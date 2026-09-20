import type { Database, Json } from "@/types/database";

export type RobotRow = Database["public"]["Tables"]["robots"]["Row"];
export type RobotDraft = {
  name: string; slug: string; seasonId: string; description: string;
  mechanisms: string; components: string; specifications: { key: string; value: string }[];
  coverPath: string | null; published: boolean;
};
export const isTextList = (value: Json): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
export function emptyRobot(): RobotDraft {
  return { name: "", slug: "", seasonId: "", description: "", mechanisms: "", components: "", specifications: [], coverPath: null, published: false };
}
export function editableSpecifications(value: Json): value is Record<string, string | number | boolean> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.values(value).every((entry) => ["string", "number", "boolean"].includes(typeof entry));
}
export function robotToDraft(row: RobotRow): RobotDraft {
  return {
    name: row.name, slug: row.slug, seasonId: row.season_id ?? "", description: row.description ?? "",
    mechanisms: isTextList(row.mechanisms) ? row.mechanisms.join("\n") : "",
    components: isTextList(row.components) ? row.components.join("\n") : "",
    specifications: editableSpecifications(row.specifications) ? Object.entries(row.specifications).map(([key, value]) => ({ key, value: String(value) })) : [], coverPath: row.cover_path, published: row.is_published,
  };
}
export function robotPayload(draft: RobotDraft, original: RobotRow | null): Database["public"]["Tables"]["robots"]["Update"] & { name: string; slug: string } {
  if (!draft.name.trim()) throw new Error("Informe o nome do robô.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) throw new Error("Use letras minúsculas, números e hífens no identificador.");
  const pairs = draft.specifications.filter((entry) => entry.key.trim() || entry.value.trim());
  if (pairs.some((entry) => !entry.key.trim() || !entry.value.trim())) throw new Error("Preencha o nome e o valor de cada característica.");
  if (new Set(pairs.map((entry) => entry.key.trim().toLowerCase())).size !== pairs.length) throw new Error("Evite nomes repetidos nas características.");
  const previous = original?.specifications;
  const specifications: Json = previous !== undefined && !editableSpecifications(previous) ? previous : Object.fromEntries(pairs.map(({ key, value }) => {
    const old = previous && editableSpecifications(previous) ? previous[key.trim()] : undefined;
    return [key.trim(), old !== undefined && String(old) === value.trim() ? old : value.trim()];
  }));
  const lines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    name: draft.name.trim(), slug: draft.slug, season_id: draft.seasonId || null,
    description: draft.description.trim() || null, cover_path: draft.coverPath,
    mechanisms: original && !isTextList(original.mechanisms) ? original.mechanisms : lines(draft.mechanisms),
    components: original && !isTextList(original.components) ? original.components : lines(draft.components),
    specifications, is_published: draft.published,
  };
}

