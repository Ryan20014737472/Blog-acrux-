import type { Database, Json } from "@/types/database";

export type CompetitionRow = Database["public"]["Tables"]["competitions"]["Row"];
export type SeasonOption = Pick<Database["public"]["Tables"]["seasons"]["Row"], "id" | "label" | "year">;

export interface CompetitionDraft {
  id: string | null;
  eventName: string;
  slug: string;
  organization: string;
  seasonId: string;
  startsAt: string;
  endsAt: string;
  location: string;
  result: string;
  awardsText: string;
  originalAwards: Json;
  originalStartsAt: string | null;
  originalEndsAt: string | null;
  report: string;
  isPublished: boolean;
}

export function emptyCompetitionDraft(): CompetitionDraft {
  return { id: null, eventName: "", slug: "", organization: "", seasonId: "", startsAt: "", endsAt: "", location: "", result: "", awardsText: "", originalAwards: [], originalStartsAt: null, originalEndsAt: null, report: "", isPublished: false };
}

// datetime-local uses the browser's local timezone, not UTC.
export function localDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function editableAwards(value: Json): value is string[] {
  return Array.isArray(value) && value.every((award) => typeof award === "string");
}

export function competitionToDraft(row: CompetitionRow): CompetitionDraft {
  return {
    id: row.id, eventName: row.event_name, slug: row.slug,
    organization: row.organization ?? "", seasonId: row.season_id ?? "",
    startsAt: localDateTime(row.starts_at), endsAt: localDateTime(row.ends_at),
    originalStartsAt: row.starts_at, originalEndsAt: row.ends_at,
    location: row.location ?? "", result: row.result ?? "",
    awardsText: editableAwards(row.awards) ? row.awards.join("\n") : "",
    originalAwards: row.awards, report: row.report ?? "", isPublished: row.is_published,
  };
}

function storedDateTime(value: string, original: string | null): string | null {
  if (!value) return null;
  // Preserve seconds, precision and offset when another field alone was edited.
  if (original && value === localDateTime(original)) return original;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Informe datas e horários válidos.");
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || localDateTime(date.toISOString()) !== value) {
    throw new Error("Informe datas e horários válidos no fuso do seu dispositivo.");
  }
  return date.toISOString();
}

type ParsedCompetition =
  | { ok: true; payload: Omit<Database["public"]["Tables"]["competitions"]["Insert"], "id"> }
  | { ok: false; message: string };

export function parseCompetitionDraft(draft: CompetitionDraft): ParsedCompetition {
  if (!draft.eventName.trim()) return { ok: false, message: "Informe o nome do evento." };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
    return { ok: false, message: "Informe um identificador com letras, números e hífens." };
  }
  try {
    const startsAt = storedDateTime(draft.startsAt, draft.originalStartsAt);
    const endsAt = storedDateTime(draft.endsAt, draft.originalEndsAt);
    if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
      return { ok: false, message: "O término não pode ser anterior ao início da competição." };
    }
    const awards = editableAwards(draft.originalAwards)
      ? draft.awardsText.split(/\r?\n/).map((award) => award.trim()).filter(Boolean)
      : draft.originalAwards;
    return {
      ok: true,
      payload: {
        event_name: draft.eventName.trim(), slug: draft.slug,
        organization: draft.organization.trim() || null, season_id: draft.seasonId || null,
        starts_at: startsAt, ends_at: endsAt, location: draft.location.trim() || null,
        result: draft.result.trim() || null, awards, report: draft.report.trim() || null,
        is_published: draft.isPublished,
      },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Verifique as datas informadas." };
  }
}

export function competitionError(error: unknown, fallback: string): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "23505") return "Esse identificador já está em uso. Escolha outro para esta competição.";
  if (code === "23514") return "Verifique as datas: o término precisa ser igual ou posterior ao início.";
  if (code === "23503") return "A temporada selecionada não está mais disponível. Atualize a lista e tente novamente.";
  if (code === "42501" || code === "PGRST116") return "O registro não está disponível ou sua conta não tem permissão para alterá-lo. Atualize a página e confira seu acesso.";
  return fallback;
}

