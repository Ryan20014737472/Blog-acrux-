import test from "node:test";
import assert from "node:assert/strict";
import { emptyProject, projectPayload, projectToDraft } from "../src/features/admin/project-form-model.ts";
const valid = () => ({ ...emptyProject(), title: "Projeto de teste", slug: "projeto-teste", category: "CAD" });
test("requires a title, category and safe unique identifier", () => {
  for (const field of ["title", "category", "slug"]) assert.throws(() => projectPayload({ ...valid(), [field]: " " }));
  assert.throws(() => projectPayload({ ...valid(), slug: "../teste" }));
});
test("draft defaults and optional fields are normalized without losing multiline content", () => {
  const payload = projectPayload({ ...valid(), body: " Etapa 1\nEtapa 2 " });
  assert.equal(payload.is_published, false);
  assert.equal(payload.season_id, null);
  assert.equal(payload.cover_path, null);
  assert.equal(payload.description, null);
  assert.equal(payload.body, "Etapa 1\nEtapa 2");
});
test("editing preserves existing content, custom category, season and cover", () => {
  const row = { id: "id", title: "Projeto", slug: "projeto", category: "Categoria própria", description: "Resumo", body: "Texto\ncom linhas", cover_path: "covers/exemplo.png", season_id: "season", is_published: true, created_at: "date", updated_at: "date" };
  const { id, created_at, updated_at, ...expected } = row;
  void id; void created_at; void updated_at;
  assert.deepEqual(projectPayload(projectToDraft(row)), expected);
  assert.equal(projectPayload({ ...projectToDraft(row), published: false }).is_published, false);
});

