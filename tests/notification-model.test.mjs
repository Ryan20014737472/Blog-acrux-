import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeNotifications, notificationAction, notificationActor, notificationField, notificationSection,
  notificationValue, parseNotificationPage, parseNotificationStatus,
} from "../src/features/admin/notification-model.ts";

function notification(overrides = {}) {
  return {
    id: 8, occurred_at: "2026-10-03T12:00:00Z", entity_table: "posts", entity_id: "post-test", entity_label: "Postagem de teste",
    action: "update", actor_id: "user-test", actor_name: "Editora de teste", actor_role: "editor", actor_kind: "user",
    changed_fields: ["title"], before_values: { title: "Título anterior" }, after_values: { title: "Título atual" },
    read_at: null, email_status: "pending", email_error: null, ...overrides,
  };
}

test("publication, archiving and withdrawal explain the resulting visibility", () => {
  assert.equal(notificationAction(notification()), "Alterou");
  assert.equal(notificationAction(notification({ before_values: { status: "draft" }, after_values: { status: "published" } })), "Publicou");
  assert.equal(notificationAction(notification({ before_values: { is_published: true }, after_values: { is_published: false } })), "Retirou da publicação");
  assert.equal(notificationAction(notification({ before_values: { status: "published" }, after_values: { status: "draft" } })), "Retirou da publicação");
  assert.equal(notificationAction(notification({ before_values: { status: "published" }, after_values: { status: "archived" } })), "Arquivou");
  assert.equal(notificationAction(notification({ action: "create" })), "Criou");
  assert.equal(notificationAction(notification({ action: "delete" })), "Excluiu");
});

test("actor snapshots remain useful without a name or after the account is removed", () => {
  assert.equal(notificationActor(notification()), "Editora de teste");
  assert.equal(notificationActor(notification({ actor_name: " ", actor_id: "removed-user" })), "Usuário removed-user");
  assert.equal(notificationActor(notification({ actor_kind: "system", actor_name: "Untrusted name" })), "Rotina do sistema");
});

test("relation snapshots, booleans and empty values display readable changes", () => {
  assert.equal(notificationValue([{ id: "a", name: "Eletrônica" }, { id: "b", name: "Programação" }], "categories"), "Identificador do registro: a\nNome: Eletrônica\n\nIdentificador do registro: b\nNome: Programação");
  assert.equal(notificationValue([{ storage_path: "gallery/photo.jpg", caption: null, alt_text: "Robô em campo" }], "images"), "Arquivo: gallery/photo.jpg\nLegenda: Não informado\nDescrição da imagem: Robô em campo");
  assert.equal(notificationValue(true, "is_published"), "Publicado");
  assert.equal(notificationValue(false, "is_home_featured"), "Não");
  assert.equal(notificationValue("draft", "status"), "Rascunho");
  assert.equal(notificationValue("admin", "role"), "Administrador");
  assert.equal(notificationValue([], "team_members"), "Nenhum item");
  assert.equal(notificationValue(null, "cover_path"), "Não informado");
});

test("image changes remain distinguishable when the caption stays the same", () => {
  const before = [{ id: "image-a", caption: "Competição", alt_text: "Robô parado", display_order: 0, storage_path: "gallery/before.jpg" }];
  const after = [{ id: "image-a", caption: "Competição", alt_text: "Robô em movimento", display_order: 2, storage_path: "gallery/after.jpg" }];
  const previous = notificationValue(before, "images");
  const current = notificationValue(after, "images");
  assert.notEqual(previous, current);
  assert.match(previous, /Robô parado/);
  assert.match(current, /Robô em movimento/);
  assert.match(previous, /Ordem de exibição: 0/);
  assert.match(current, /Ordem de exibição: 2/);
  assert.match(current, /gallery\/after.jpg/);
});

test("structured fields preserve details and truncated snapshots are explicit", () => {
  assert.equal(notificationValue({ Peso: "10 kg", Altura: "40 cm" }, "specifications"), "Peso: 10 kg\nAltura: 40 cm");
  assert.match(notificationValue({ excerpt: "Partial legacy JSON", truncated: true }, "specifications"), /Partial legacy JSON\n… \[trecho\]/);
  assert.equal(notificationSection("posts"), "Blog");
  assert.equal(notificationSection("future_table"), "Conteúdo do site");
  assert.equal(notificationField("photo_path"), "Foto");
});

test("status requires a boolean owner decision and a nonnegative unread count", () => {
  const status = { is_owner: false, configured: true, unread_count: 0, email_enabled: false, email_configured: false, last_email_error: null };
  assert.deepEqual(parseNotificationStatus(status), status);
  assert.throws(() => parseNotificationStatus({ ...status, is_owner: "true" }));
  assert.throws(() => parseNotificationStatus({ ...status, unread_count: -1 }));
  assert.throws(() => parseNotificationStatus(null));
});

test("malformed pages cannot be rendered as trusted audit records", () => {
  const page = { items: [notification()], next_cursor: 8 };
  assert.deepEqual(parseNotificationPage(page), page);
  assert.throws(() => parseNotificationPage({ ...page, items: [notification({ id: -1 })] }));
  assert.throws(() => parseNotificationPage({ ...page, items: [notification({ changed_fields: [12] })] }));
  assert.throws(() => parseNotificationPage({ ...page, items: [notification({ actor_kind: "admin" })] }));
  assert.throws(() => parseNotificationPage({ ...page, next_cursor: "8" }));
});

test("new pages merge in chronological ID order without repeating refreshed items", () => {
  const first = notification({ id: 10 });
  const updated = notification({ id: 8, read_at: "2026-10-03T12:01:00Z" });
  const merged = mergeNotifications([first, notification()], [updated, notification({ id: 4 })]);
  assert.deepEqual(merged.map((item) => item.id), [10, 8, 4]);
  assert.equal(merged[1].read_at, updated.read_at);
});
