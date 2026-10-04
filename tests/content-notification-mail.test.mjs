import test from "node:test";
import assert from "node:assert/strict";
import { createHandler, notificationEmail } from "../supabase/functions/content-notification-mail/handler.ts";

const ownerEmail = "owner@example.test";
const apiKey = "re_privateExampleKey123456";
const settings = { enabled: true, configured: true, sender: "onboarding@resend.dev", pending_count: 1, last_error: null };
const notification = {
  id: 15, occurred_at: "2026-10-03T12:00:00Z", entity_table: "posts", entity_id: "post-id", entity_label: "Robô <ACRUX>", action: "update",
  actor_id: "editor-id", actor_name: "Ana & Bia", actor_role: "editor", actor_kind: "user", changed_fields: ["title", "status", "categories"],
  before_values: { title: "Título antigo", status: "draft", categories: [{ name: "Notícias" }] },
  after_values: { title: "Título novo <script>alert(1)</script>", status: "published", categories: [{ name: "Robótica" }] },
  claim_token: "claim-a", recipient_email: ownerEmail, idempotency_key: "acrux-content-notification-15", attempts: 1,
};
function setup(overrides = {}, options = {}) {
  const calls = [];
  const messages = [];
  const service = {
    actor: async (token) => { calls.push(["actor", token]); return { id: "owner-id", is_owner: true }; },
    verifyDispatchToken: async (token) => { calls.push(["verify", token]); return token === "scheduler-token"; },
    settings: async () => { calls.push(["settings"]); return settings; },
    configure: async (...args) => { calls.push(["configure", ...args]); return settings; },
    credentials: async () => { calls.push(["credentials"]); return { api_key: apiKey, sender: settings.sender, recipient_email: ownerEmail, enabled: true }; },
    claim: async (limit) => { calls.push(["claim", limit]); return [notification]; },
    finish: async (...args) => { calls.push(["finish", ...args]); return true; },
    ...overrides,
  };
  const handler = createHandler(() => service, {
    fetch: async (url, request) => { messages.push({ url, request, body: JSON.parse(request.body) }); return Response.json({ id: "resend-message-id" }); },
    uuid: () => "test-uuid", ...options,
  });
  const send = (body, headers = { authorization: "Bearer owner-token" }) => handler(new Request("https://example.test", { method: "POST", headers, body: JSON.stringify(body) }));
  const dispatch = () => send({ action: "dispatch" }, { "x-acrux-notification-token": "scheduler-token" });
  return { calls, messages, handler, send, dispatch };
}

test("owner actions require a validated session and pinned ownership even for another administrator", async () => {
  const anonymous = setup();
  assert.equal((await anonymous.send({ action: "status" }, {})).status, 401);
  assert.deepEqual(anonymous.calls, []);
  for (const action of ["status", "configure", "test"]) {
    const denied = setup({ actor: async () => ({ id: "other-admin", is_owner: false }) });
    assert.equal((await denied.send({ action, api_key: apiKey, sender: settings.sender, enabled: true })).status, 403);
    assert.deepEqual(denied.calls, []);
    assert.deepEqual(denied.messages, []);
  }
  const expired = setup({ actor: async () => null });
  assert.equal((await expired.send({ action: "test" })).status, 401);
  assert.deepEqual(expired.messages, []);
});

test("only a valid scheduler token dispatches; owner JWT and caller-supplied recipients do not substitute", async () => {
  const { send, calls, messages } = setup();
  assert.equal((await send({ action: "dispatch" })).status, 401);
  assert.equal((await send({ action: "dispatch" }, { "x-acrux-notification-token": "bad-token" })).status, 401);
  assert.deepEqual(calls, [["verify", "bad-token"]]);
  assert.deepEqual(messages, []);
});

test("a scheduler token cannot read settings, configure credentials or request test mail", async () => {
  const { send, calls } = setup();
  for (const action of ["status", "configure", "test"]) assert.equal((await send({ action }, { "x-acrux-notification-token": "scheduler-token" })).status, 401);
  assert.deepEqual(calls, []);
});

test("status exposes only safe settings and hides unknown error details", async () => {
  const { send } = setup({ settings: async () => ({ ...settings, api_key: apiKey, recipient_email: ownerEmail, last_error: `private ${apiKey}` }) });
  const response = await send({ action: "status" });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { settings });
});

test("configure stores only the server-side key and strict sender; absent key preserves existing credential", async () => {
  const { send, calls } = setup();
  const response = await send({ action: "configure", api_key: ` ${apiKey} `, sender: ` ${settings.sender} `, enabled: true, to: "attacker@example.test" });
  assert.equal(response.status, 200);
  assert.deepEqual(calls[1], ["configure", apiKey, settings.sender, true]);
  assert.equal((await response.text()).includes(apiKey), false);
  assert.equal((await send({ action: "configure", sender: settings.sender, enabled: false })).status, 200);
  assert.deepEqual(calls[3], ["configure", null, settings.sender, false]);
});

test("configure rejects invalid keys, display names, header injection and invalid enable flags", async () => {
  const { send, calls } = setup();
  for (const change of [
    { api_key: "bad-key" }, { api_key: "re_short" }, { api_key: 5 }, { api_key: `re_${"a".repeat(254)}` },
    { sender: "Other <sender@example.test>" }, { sender: "sender@example.test\r\nBcc: attacker@example.test" },
    { sender: "invalid-email" }, { sender: "sender@invalid" }, { enabled: "true" },
  ]) {
    assert.equal((await send({ action: "configure", api_key: apiKey, sender: settings.sender, enabled: true, ...change })).status, 400);
  }
  assert.equal(calls.some(([action]) => action === "configure"), false);
});

test("enabling without an existing provider key is rejected before attempting configuration", async () => {
  const { send, calls } = setup({ settings: async () => ({ ...settings, configured: false }) });
  const response = await send({ action: "configure", sender: settings.sender, enabled: true });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "configuration_missing");
  assert.equal(calls.some(([action]) => action === "configure"), false);
});

test("test email has the pinned recipient, fixed URL and unique test idempotency key; it creates no event", async () => {
  const { send, calls, messages } = setup();
  const response = await send({ action: "test", to: ["attacker@example.test"], recipient_email: "attacker@example.test", from: "attacker@example.test", url: "https://evil.test" });
  assert.equal(response.status, 200);
  assert.match((await response.json()).message, /aceito pelo serviço somente para o proprietário/);
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].body.to, [ownerEmail]);
  assert.equal(messages[0].body.from, `ACRUX <${settings.sender}>`);
  assert.equal(messages[0].body.subject, "Teste de notificações ACRUX");
  assert.match(messages[0].body.text, /nenhum conteúdo do site foi alterado/);
  assert.match(messages[0].body.html, /https:\/\/ryan20014737472.github.io\/Blog-acrux-\/admin\/notificacoes\//);
  assert.equal(messages[0].request.headers["Idempotency-Key"], "acrux-content-notification-test-test-uuid");
  assert.equal(calls.some(([action]) => action === "claim" || action === "finish"), false);
});

test("missing credentials cannot report that a test succeeded or send provider requests", async () => {
  for (const missing of ["api_key", "sender", "recipient_email"]) {
    const { send, messages } = setup({ credentials: async () => ({ api_key: apiKey, sender: settings.sender, recipient_email: ownerEmail, enabled: true, [missing]: null }) });
    const response = await send({ action: "test" });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, "configuration_missing");
    assert.deepEqual(messages, []);
  }
});

test("disabled dispatcher does not claim or send; enabled missing configuration returns an actionable failure", async () => {
  const disabled = setup({ credentials: async () => ({ api_key: null, sender: null, recipient_email: ownerEmail, enabled: false }) });
  assert.deepEqual(await (await disabled.dispatch()).json(), { enabled: false, claimed: 0, sent: 0, failed: 0 });
  assert.equal(disabled.calls.some(([action]) => action === "claim"), false);
  const missing = setup({ credentials: async () => ({ api_key: null, sender: settings.sender, recipient_email: ownerEmail, enabled: true }) });
  const response = await missing.dispatch();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "configuration_missing");
  assert.equal(missing.calls.some(([action]) => action === "claim"), false);
  assert.deepEqual(missing.messages, []);
});

test("dispatch claims a bounded batch, sends a detailed escaped change and commits the claim token", async () => {
  const { dispatch, calls, messages } = setup();
  const response = await dispatch();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { enabled: true, claimed: 1, sent: 1, failed: 0 });
  assert.deepEqual(calls.find(([action]) => action === "claim"), ["claim", 5]);
  assert.deepEqual(calls.find(([action]) => action === "finish"), ["finish", 15, "claim-a", "resend-message-id", null]);
  const email = messages[0];
  assert.deepEqual(email.body.to, [ownerEmail]);
  assert.match(email.body.text, /Ana & Bia \(Editor\): publicou/);
  assert.match(email.body.text, /Título\nAntes: Título antigo\nDepois: Título novo/);
  assert.match(email.body.text, /Categorias\nAntes: Nome: Notícias\nDepois: Nome: Robótica/);
  assert.match(email.body.html, /Ana &amp; Bia/);
  assert.match(email.body.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.equal(email.body.html.includes("<script>"), false);
  assert.equal(email.request.headers.Authorization, `Bearer ${apiKey}`);
  assert.equal(email.request.headers["Idempotency-Key"], notification.idempotency_key);
});

test("retrying the same durable notification uses the same provider idempotency key", async () => {
  const { dispatch, messages } = setup();
  await dispatch(); await dispatch();
  assert.equal(messages[0].request.headers["Idempotency-Key"], messages[1].request.headers["Idempotency-Key"]);
});

test("a stale claim for a previous owner is never delivered to another address", async () => {
  const { dispatch, calls, messages } = setup({ claim: async () => [{ ...notification, recipient_email: "previous@example.test" }] });
  assert.deepEqual(await (await dispatch()).json(), { enabled: true, claimed: 1, sent: 0, failed: 1 });
  assert.deepEqual(messages, []);
  assert.deepEqual(calls.find(([action]) => action === "finish"), ["finish", 15, "claim-a", null, "configuration_missing"]);
});

test("provider throttling, rejection and outages become durable safe retry codes without leaking payloads", async () => {
  for (const [status, code] of [[429, "provider_unavailable"], [500, "provider_unavailable"], [401, "provider_rejected"], [422, "provider_rejected"]]) {
    const { dispatch, calls } = setup({}, { fetch: async () => Response.json({ error: `private ${apiKey}` }, { status }) });
    assert.deepEqual(await (await dispatch()).json(), { enabled: true, claimed: 1, sent: 0, failed: 1 });
    assert.deepEqual(calls.find(([action]) => action === "finish"), ["finish", 15, "claim-a", null, code]);
  }
});

test("a provider timeout is aborted and remains queued as unavailable", async () => {
  let aborted = false;
  const { dispatch, calls } = setup({}, { timeoutMs: 5, fetch: (_url, request) => new Promise((_resolve, reject) => {
    request.signal.addEventListener("abort", () => { aborted = true; reject(new Error(`private ${apiKey}`)); }, { once: true });
  }) });
  const response = await dispatch();
  assert.equal(response.status, 200);
  assert.equal(aborted, true);
  assert.deepEqual(calls.find(([action]) => action === "finish"), ["finish", 15, "claim-a", null, "provider_unavailable"]);
});

test("malformed success and refused claim completion cannot report a successful delivery", async () => {
  const malformed = setup({}, { fetch: async () => Response.json({ private: apiKey }) });
  assert.equal((await malformed.dispatch()).status, 200);
  assert.deepEqual(malformed.calls.find(([action]) => action === "finish"), ["finish", 15, "claim-a", null, "delivery_failed"]);
  const conflict = setup({ finish: async () => false });
  const response = await conflict.dispatch();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "delivery_failed");
});

test("batch deadline stops before sending remaining claims, allowing their leases to expire safely", async () => {
  let time = 0;
  const { dispatch, messages, calls } = setup({ claim: async () => [notification, { ...notification, id: 16, claim_token: "claim-b" }] }, {
    now: () => { const previous = time; time += 30_000; return previous; },
  });
  assert.deepEqual(await (await dispatch()).json(), { enabled: true, claimed: 2, sent: 1, failed: 0 });
  assert.equal(messages.length, 1);
  assert.equal(calls.filter(([action]) => action === "finish").length, 1);
});

test("owner test failures do not leak provider bodies, keys, recipients or database errors", async () => {
  const provider = setup({}, { fetch: async () => Response.json({ error: `${apiKey} ${ownerEmail}` }, { status: 422 }) });
  const response = await provider.send({ action: "test" });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "provider_rejected");
  const internal = setup({ actor: async () => { throw new Error(`${apiKey} ${ownerEmail}`); } });
  const errorText = await (await internal.send({ action: "status" })).text();
  assert.equal(errorText.includes(apiKey), false);
  assert.equal(errorText.includes(ownerEmail), false);
});

test("origin, method and JSON validation deny requests without any privileged operation", async () => {
  const { handler, send, calls } = setup();
  assert.equal((await send({ action: "status" }, { origin: "https://evil.test", authorization: "Bearer owner-token" })).status, 403);
  assert.equal((await handler(new Request("https://example.test", { method: "GET" }))).status, 405);
  const preflight = await handler(new Request("https://example.test", { method: "OPTIONS", headers: { origin: "https://ryan20014737472.github.io" } }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "https://ryan20014737472.github.io");
  for (const body of ["not-json", "[]", "null", "3"]) assert.equal((await handler(new Request("https://example.test", { method: "POST", body }))).status, 400);
  assert.deepEqual(calls, []);
});

test("request size is limited by bytes even without Content-Length", async () => {
  const { handler, calls } = setup();
  const body = JSON.stringify({ action: "configure", sender: "á".repeat(2200) });
  assert.ok(body.length < 4096);
  assert.equal((await handler(new Request("https://example.test", { method: "POST", headers: { authorization: "Bearer owner-token" }, body }))).status, 413);
  assert.deepEqual(calls, []);
});

test("unknown owner actions return an error without sending or configuring", async () => {
  const { send, calls, messages } = setup();
  assert.equal((await send({ action: "send_to_everyone" })).status, 400);
  assert.deepEqual(calls, [["actor", "owner-token"]]);
  assert.deepEqual(messages, []);
});

test("create, delete and system events explain their actual values and attribution in Portuguese", () => {
  const created = notificationEmail({ ...notification, action: "create", entity_table: "galleries", actor_kind: "system", actor_name: null, actor_role: null });
  assert.match(created.text, /Rotina do sistema: criou/);
  assert.match(created.text, /em Galeria/);
  assert.match(created.text, /Título: Título novo/);
  assert.equal(created.text.includes("Antes:"), false);
  const deleted = notificationEmail({ ...notification, action: "delete", actor_name: null });
  assert.match(deleted.text, /Usuário editor-id \(Editor\): excluiu/);
  assert.match(deleted.text, /Título: Título antigo/);
  assert.equal(deleted.text.includes("Depois:"), false);
});

test("long values and nested data remain bounded, safe and direct the owner to recorded details", () => {
  const mail = notificationEmail({ ...notification, entity_label: "x\nBcc: attacker@example.test".repeat(200), changed_fields: ["body", "is_published", "arbitrary_field"],
    before_values: { body: "x".repeat(50_000), is_published: true }, after_values: { body: "<img src=x onerror=alert(1)>".repeat(1000), is_published: false, arbitrary_field: { a: { b: { c: { d: "secret" } } } } } });
  assert.ok(mail.subject.length <= 200);
  assert.equal(/[\r\n]/.test(mail.subject), false);
  assert.ok(mail.text.length < 6000);
  assert.ok(mail.html.length < 10000);
  assert.match(mail.text, /Retirou|retirou/);
  assert.match(mail.text, /trecho; consulte os detalhes no painel/);
  assert.equal(mail.html.includes("<img"), false);
});

test("gallery image edits explain alt text, ordering and path even when the caption is unchanged", () => {
  const mail = notificationEmail({ ...notification, entity_table: "galleries", changed_fields: ["images"],
    before_values: { images: [{ caption: "Mesma legenda", alt_text: "Foto antiga", storage_path: "album/antiga.png", display_order: 1 }] },
    after_values: { images: [{ caption: "Mesma legenda", alt_text: "Foto atualizada", storage_path: "album/atualizada.png", display_order: 2 }] } });
  assert.match(mail.text, /Antes: Legenda: Mesma legenda\nDescrição da imagem: Foto antiga\nArquivo: album\/antiga.png\nOrdem de exibição: 1/);
  assert.match(mail.text, /Depois: Legenda: Mesma legenda\nDescrição da imagem: Foto atualizada\nArquivo: album\/atualizada.png\nOrdem de exibição: 2/);
});
