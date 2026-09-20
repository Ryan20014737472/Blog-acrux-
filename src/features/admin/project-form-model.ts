import type { Database } from "@/types/database";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectDraft = {
  title: string; slug: string; category: string; seasonId: string;
  description: string; body: string; coverPath: string | null; published: boolean;
};
export const projectCategories = ["CAD", "Impressão 3D", "Corte a laser", "Robótica", "Engenharia", "Impacto STEAM", "Projetos escolares", "Protótipos"];
export function emptyProject(): ProjectDraft {
  return { title: "", slug: "", category: "", seasonId: "", description: "", body: "", coverPath: null, published: false };
}
export function projectToDraft(row: ProjectRow): ProjectDraft {
  return { title: row.title, slug: row.slug, category: row.category, seasonId: row.season_id ?? "", description: row.description ?? "", body: row.body ?? "", coverPath: row.cover_path, published: row.is_published };
}
export function projectPayload(draft: ProjectDraft): Omit<Database["public"]["Tables"]["projects"]["Insert"], "id"> {
  if (!draft.title.trim()) throw new Error("Informe o título do projeto.");
  if (!draft.category.trim()) throw new Error("Informe a categoria do projeto.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) throw new Error("Use letras minúsculas, números e hífens no identificador.");
  return { title: draft.title.trim(), slug: draft.slug, category: draft.category.trim(), season_id: draft.seasonId || null, description: draft.description.trim() || null, body: draft.body.trim() || null, cover_path: draft.coverPath, is_published: draft.published };
}

