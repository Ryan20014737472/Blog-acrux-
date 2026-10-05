import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeNotifications, notificationAction, notificationActor, notificationChangeDescription, notificationField, notificationSection,
  notificationSummary, notificationValue, parseNotificationPage, parseNotificationStatus,
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

test("summaries distinguish creation, updates and deletion without repeating fields or counting technical IDs", () => {
  const item = notification({ changed_fields: ["id", "title", "title", "categories"] });
  assert.match(notificationSummary(item), /^Foram alterados 2 campos: Título e Categorias\./);
  assert.match(notificationSummary({ ...item, action: "create" }), /^Novo registro cadastrado com 2 campos/);
  assert.match(notificationSummary({ ...item, action: "delete" }), /histórico preservou 2 campos do estado anterior/);
  assert.match(notificationSummary(notification({ changed_fields: [] })), /não contém campos adicionais para comparar/);
});

test("replacing images with the same total still reports actual additions and removals", () => {
  const item = notification({ changed_fields: ["image_paths"], before_values: { image_paths: ["a.jpg", "b.jpg"] }, after_values: { image_paths: ["b.jpg", "c.jpg", "d.jpg"] } });
  assert.equal(notificationChangeDescription(item, "image_paths"), "Imagens: 2 imagens adicionadas; 1 imagem removida.");
  const replaced = { ...item, after_values: { image_paths: ["b.jpg", "c.jpg"] } };
  assert.equal(notificationChangeDescription(replaced, "image_paths"), "Imagens: 1 imagem adicionada; 1 imagem removida.");
});

test("image reordering and edits to the same image are described without inventing additions", () => {
  const reordered = notification({ before_values: { image_paths: ["a.jpg", "b.jpg"] }, after_values: { image_paths: ["b.jpg", "a.jpg"] } });
  assert.equal(notificationChangeDescription(reordered, "image_paths"), "Imagens: ordem das imagens alterada.");
  const image = { id: "image-1", caption: "Evento", alt_text: "Robô parado", display_order: 0, storage_path: "before.jpg" };
  const updated = notification({ before_values: { images: [image] }, after_values: { images: [{ ...image, alt_text: "Robô em movimento", display_order: 1, storage_path: "after.jpg" }] } });
  assert.match(notificationChangeDescription(updated, "images"), /1 imagem atualizada; dados das imagens alterados: Descrição da imagem, Ordem de exibição e Arquivo/);
  assert.doesNotMatch(notificationChangeDescription(updated, "images"), /adicionada|removida/);
});

test("category and team changes identify names stored in the snapshot", () => {
  const item = notification({ before_values: { categories: [{ id: "a", name: "Notícias" }], team_members: [{ id: "a", name: "Ana" }] }, after_values: { categories: [{ id: "b", name: "Eventos" }], team_members: [{ id: "b", name: "Bruno" }] } });
  assert.equal(notificationChangeDescription(item, "categories"), "Categorias: 1 categoria adicionada (“Eventos”); 1 categoria removida (“Notícias”).");
  assert.equal(notificationChangeDescription(item, "team_members"), "Integrantes: 1 integrante vinculado (“Bruno”); 1 integrante desvinculado (“Ana”).");
  const renamed = { ...item, after_values: { categories: [{ id: "a", name: "Eventos" }] } };
  assert.match(notificationChangeDescription(renamed, "categories"), /1 categoria atualizada \(“Eventos”\)/);
});

test("text revisions and permission changes explain the change in readable Portuguese", () => {
  const item = notification({ before_values: { body: "Antes", role: "editor" }, after_values: { body: "Depois da revisão", role: "admin" } });
  assert.match(notificationChangeDescription(item, "body"), /texto revisado, de 5 para 17 caracteres/);
  assert.equal(notificationChangeDescription(item, "role"), "Permissão: de “Editor” para “Administrador”.");
});

test("excerpted records and ambiguous collection identities do not invent precise differences", () => {
  const item = notification({ before_values: { body: "Primeiro trecho… [trecho]", images: { excerpt: "[]", truncated: true } }, after_values: { body: "Segundo trecho… [trecho]", images: [] } });
  for (const field of ["body", "images"]) {
    const description = notificationChangeDescription(item, field);
    assert.match(description, /apenas um trecho/);
    assert.doesNotMatch(description, /caracteres|imagens removidas|imagens adicionadas/);
  }
  const duplicate = notification({ before_values: { image_paths: ["a.jpg", "a.jpg"] }, after_values: { image_paths: ["a.jpg", "b.jpg"] } });
  assert.match(notificationChangeDescription(duplicate, "image_paths"), /lista atualizada, de 2 para 2 imagens/);
  assert.doesNotMatch(notificationChangeDescription(duplicate, "image_paths"), /removida|adicionada/);
});

test("initial and deleted values are explicit and date-only fields keep their calendar date", () => {
  const item = notification({ before_values: { title: "Título antigo" }, after_values: { title: "Título novo" } });
  assert.equal(notificationChangeDescription({ ...item, action: "create" }, "title"), "Título: valor inicial — Título novo.");
  assert.equal(notificationChangeDescription({ ...item, action: "delete" }, "title"), "Título: último valor registrado — Título antigo.");
  assert.equal(notificationValue("2026-10-03", "achieved_on"), "03/10/2026");
});
