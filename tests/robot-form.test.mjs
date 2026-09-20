import test from "node:test";
import assert from "node:assert/strict";
import { emptyRobot, robotPayload, robotToDraft } from "../src/features/admin/robot-form-model.ts";

const draft = () => ({ ...emptyRobot(), name: "Robô de teste", slug: "robo-teste" });
const row = () => ({ id: "test", season_id: null, name: "Robô de teste", slug: "robo-teste", description: null, mechanisms: [], components: [], specifications: {}, cover_path: null, cad_embed_url: "https://example.com/model", is_published: false, created_at: "2026-01-01", updated_at: "2026-01-01" });

test("new robots default to draft with no season and do not overwrite CAD data", () => {
  const payload = robotPayload(draft(), null);
  assert.equal(payload.is_published, false);
  assert.equal(payload.season_id, null);
  assert.equal("cad_embed_url" in payload, false);
  assert.deepEqual(payload.specifications, {});
});
test("requires valid name and slug", () => {
  assert.throws(() => robotPayload({ ...draft(), name: " " }, null), /nome/);
  for (const slug of ["", "Nome Inválido", "../x", "x--x"]) assert.throws(() => robotPayload({ ...draft(), slug }, null), /identificador/);
});
test("normalizes lists and checks complete unique specification names", () => {
  assert.deepEqual(robotPayload({ ...draft(), mechanisms: " Elevador\n\nGarra " }, null).mechanisms, ["Elevador", "Garra"]);
  assert.throws(() => robotPayload({ ...draft(), specifications: [{ key: "Peso", value: "" }] }, null), /nome e o valor/);
  assert.throws(() => robotPayload({ ...draft(), specifications: [{ key: "Peso", value: "10" }, { key: " peso ", value: "11" }] }, null), /repetidos/);
});
test("preserves numeric and boolean specifications when unrelated fields change", () => {
  const original = { ...row(), specifications: { motores: 4, autonomo: true } };
  assert.deepEqual(robotPayload({ ...robotToDraft(original), description: "Editado" }, original).specifications, original.specifications);
});
test("preserves legacy structured lists and specifications", () => {
  const original = { ...row(), mechanisms: [{ name: "Garra" }], components: { motors: 2 }, specifications: { dimensions: [1, 2] } };
  const payload = robotPayload(robotToDraft(original), original);
  for (const key of ["mechanisms", "components", "specifications"]) assert.deepEqual(payload[key], original[key]);
});
test("supports publishing, photo removal and season assignment", () => {
  const payload = robotPayload({ ...draft(), published: true, coverPath: null, seasonId: "season-id" }, row());
  assert.equal(payload.is_published, true);
  assert.equal(payload.cover_path, null);
  assert.equal(payload.season_id, "season-id");
});

