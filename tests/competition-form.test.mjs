import assert from "node:assert/strict";
import test from "node:test";
import { competitionError, competitionToDraft, emptyCompetitionDraft, localDateTime, parseCompetitionDraft } from "../src/features/admin/competition-form-model.ts";

function draft(overrides = {}) {
  return { ...emptyCompetitionDraft(), eventName: "Evento de teste", slug: "evento-de-teste", ...overrides };
}

function row(overrides = {}) {
  return {
    id: "competition-test", event_name: "Evento de teste", slug: "evento-de-teste",
    organization: "FTC", season_id: null, starts_at: null, ends_at: null,
    location: null, result: null, awards: [], report: null, is_published: false,
    created_at: "2026-09-19T12:00:00Z", updated_at: "2026-09-19T12:00:00Z", ...overrides,
  };
}

test("new competitions are private drafts with optional fields unset", () => {
  const result = parseCompetitionDraft(draft());
  assert.equal(result.ok, true);
  assert.equal(result.payload.is_published, false);
  assert.equal(result.payload.season_id, null);
  assert.equal(result.payload.starts_at, null);
  assert.equal(result.payload.ends_at, null);
  assert.deepEqual(result.payload.awards, []);
  assert.equal(result.payload.report, null);
});

test("requires event name and a valid unique-identifier format", () => {
  assert.equal(parseCompetitionDraft(draft({ eventName: "   " })).ok, false);
  for (const slug of ["", "invalid slug", "<script>", "--", "test-"]) {
    assert.equal(parseCompetitionDraft(draft({ slug })).ok, false);
  }
});

test("rejects invalid calendar dates and end before start", () => {
  assert.equal(parseCompetitionDraft(draft({ startsAt: "2026-02-30T10:00" })).ok, false);
  assert.equal(parseCompetitionDraft(draft({ startsAt: "wrong" })).ok, false);
  assert.equal(parseCompetitionDraft(draft({ startsAt: "2026-09-20T10:00", endsAt: "2026-09-19T10:00" })).ok, false);
  assert.equal(parseCompetitionDraft(draft({ startsAt: "2026-09-20T10:00", endsAt: "2026-09-20T10:00" })).ok, true);
});

test("local date input saves the same local hour in UTC", () => {
  const result = parseCompetitionDraft(draft({ startsAt: "2026-09-20T09:30" }));
  assert.equal(result.ok, true);
  assert.equal(result.payload.starts_at, new Date(2026, 8, 20, 9, 30).toISOString());
  assert.equal(localDateTime(result.payload.starts_at), "2026-09-20T09:30");
});

test("editing another field preserves existing timestamp seconds and offsets", () => {
  const original = row({ starts_at: "2026-09-20T09:30:48.123-03:00", ends_at: "2026-09-20T14:40:55.321-03:00" });
  const edited = competitionToDraft(original);
  edited.location = "Local atualizado";
  const result = parseCompetitionDraft(edited);
  assert.equal(result.ok, true);
  assert.equal(result.payload.starts_at, original.starts_at);
  assert.equal(result.payload.ends_at, original.ends_at);
});

test("awards become a clean string list and existing structured awards survive unrelated edits", () => {
  const result = parseCompetitionDraft(draft({ awardsText: "  Prêmio A \n\n Prêmio B\r\n" }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.payload.awards, ["Prêmio A", "Prêmio B"]);
  const awards = [{ title: "Registro legado", category: "teste" }];
  const legacy = parseCompetitionDraft(competitionToDraft(row({ awards })));
  assert.equal(legacy.ok, true);
  assert.deepEqual(legacy.payload.awards, awards);
});

test("publication and unpublication follow the checkbox without altering season", () => {
  for (const isPublished of [true, false]) {
    const result = parseCompetitionDraft(draft({ isPublished, seasonId: "season-test" }));
    assert.equal(result.ok, true);
    assert.equal(result.payload.is_published, isPublished);
    assert.equal(result.payload.season_id, "season-test");
  }
});

test("database validation and RLS errors have actionable messages", () => {
  assert.match(competitionError({ code: "23505" }, "fallback"), /identificador/);
  assert.match(competitionError({ code: "23514" }, "fallback"), /datas/);
  assert.match(competitionError({ code: "42501" }, "fallback"), /permissão/);
  assert.match(competitionError({ code: "PGRST116" }, "fallback"), /registro/i);
  assert.equal(competitionError(new Error("private details"), "Falha ao salvar"), "Falha ao salvar");
});

