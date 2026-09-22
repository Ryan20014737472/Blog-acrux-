import test from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../supabase/functions/admin-users/handler.ts";

const id = "11111111-1111-4111-8111-111111111111";
const row = { id, email: "editor@example.test", created_at: "2026-01-01", email_confirmed_at: "2026-01-01" };
function setup(overrides = {}) {
  const calls = [];
  const service = {
    actor: async () => ({ id: "admin-id", role: "admin" }),
    users: async () => [row],
    profiles: async () => [{ id, role: "editor", display_name: "Editor", updated_at: "v1" }],
    invite: async (...args) => { calls.push(["invite", ...args]); return row; },
    update: async (...args) => { calls.push(["update", ...args]); return true; },
    recover: async (...args) => { calls.push(["recover", ...args]); },
    ...overrides,
  };
  const handler = createHandler(() => service);
  const send = (body, headers = { authorization: "Bearer test-token" }) => handler(new Request("https://example.test", { method: "POST", headers, body: JSON.stringify(body) }));
  return { calls, send, handler };
}
test("unauthenticated and non-admin requests are denied before any privileged operation", async () => {
  for (const role of ["editor", "visitor"]) {
    const { send, calls } = setup({ actor: async () => ({ id, role }), users: async () => { throw new Error("Must not run"); } });
    assert.equal((await send({ action: "list" })).status, 403);
    assert.deepEqual(calls, []);
  }
  assert.equal((await setup().send({ action: "list" }, {})).status, 401);
  assert.equal((await setup({ actor: async () => null }).send({ action: "list" })).status, 401);
});
test("list exposes only the explicit safe account projection", async () => {
  const { send } = setup({ users: async () => [{ ...row, encrypted_password: "secret", user_metadata: { role: "admin" } }] });
  const response = await send({ action: "list", page: 1 });
  const body = await response.json();
  assert.equal(body.users[0].role, "editor");
  assert.equal(body.users[0].email, row.email);
  assert.equal(JSON.stringify(body).includes("secret"), false);
  assert.equal(JSON.stringify(body).includes("metadata"), false);
});
test("duplicate invitations never change existing permissions or send email", async () => {
  const { send, calls } = setup();
  assert.equal((await send({ action: "invite", email: row.email.toUpperCase(), role: "admin" })).status, 409);
  assert.deepEqual(calls, []);
});
test("invite uses fixed activation destination and assigns requested role", async () => {
  const { send, calls } = setup({ users: async () => [], profiles: async () => [{ id, role: "visitor", display_name: null, updated_at: "v1" }] });
  assert.equal((await send({ action: "invite", email: " NEW@example.test ", role: "editor", redirectTo: "https://evil.test" })).status, 200);
  assert.deepEqual(calls[0], ["invite", "new@example.test", "https://ryan20014737472.github.io/Blog-acrux-/admin/ativar-conta/"]);
  assert.deepEqual(calls[1], ["update", id, "v1", "editor", null]);
});
test("partial invite completion is reported accurately", async () => {
  const { send } = setup({ users: async () => [], profiles: async () => [] });
  const response = await send({ action: "invite", email: "new@example.test", role: "editor" });
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /Convite enviado/);
});
test("invalid role and email are rejected", async () => {
  const { send, calls } = setup();
  for (const body of [{ action: "invite", email: "bad", role: "editor" }, { action: "invite", email: "new@example.test", role: "owner" }, { action: "list", page: -1 }, { action: "update", id: "bad" }]) assert.equal((await send(body)).status, 400);
  assert.deepEqual(calls, []);
});
test("admin accounts cannot be downgraded, including one's own account", async () => {
  const { send, calls } = setup({ profiles: async () => [{ id, role: "admin", updated_at: "v1" }] });
  assert.equal((await send({ action: "update", id, role: "visitor", displayName: "Admin", updatedAt: "v1" })).status, 409);
  assert.deepEqual(calls, []);
});
test("updates use optimistic concurrency and report conflicts", async () => {
  const { send, calls } = setup({ update: async (...args) => { calls.push(args); return false; } });
  assert.equal((await send({ action: "update", id, role: "visitor", displayName: " Name ", updatedAt: "old" })).status, 409);
  assert.deepEqual(calls[0], [id, "old", "visitor", "Name"]);
});
test("password recovery resolves recipient from Auth rather than client input", async () => {
  const { send, calls } = setup();
  assert.equal((await send({ action: "recover", id, email: "attacker@example.test" })).status, 200);
  assert.equal(calls[0][1], row.email);
});
test("visitors cannot receive administrative recovery from this endpoint", async () => {
  const { send, calls } = setup({ profiles: async () => [{ id, role: "visitor" }] });
  assert.equal((await send({ action: "recover", id })).status, 400);
  assert.deepEqual(calls, []);
});
test("origin and HTTP method enforcement; errors do not leak internals", async () => {
  const { send, handler } = setup({ users: async () => { throw new Error("private service key"); } });
  assert.equal((await send({ action: "list" }, { origin: "https://evil.test", authorization: "Bearer token" })).status, 403);
  assert.equal((await handler(new Request("https://example.test", { method: "GET" }))).status, 405);
  assert.equal((await handler(new Request("https://example.test", { method: "OPTIONS" }))).status, 204);
  const response = await send({ action: "list" });
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes("private service key"), false);
});

