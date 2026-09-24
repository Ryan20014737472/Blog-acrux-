import type { Database } from "@/types/database";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type TeamArea = Database["public"]["Tables"]["team_areas"]["Row"];

export function groupTeamMembers(members: TeamMember[], areas: TeamArea[]) {
  const areaOrder = new Map(areas.map((area) => [area.name, area.display_order]));
  const grouped = new Map<string, TeamMember[]>();

  for (const member of members) {
    const area = member.area?.trim() || "Sem área definida";
    grouped.set(area, [...(grouped.get(area) ?? []), member]);
  }

  return Array.from(grouped, ([name, items]) => ({
    name,
    members: items.sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name, "pt-BR")),
  })).sort((a, b) =>
    (areaOrder.get(a.name) ?? Number.MAX_SAFE_INTEGER) - (areaOrder.get(b.name) ?? Number.MAX_SAFE_INTEGER)
    || a.name.localeCompare(b.name, "pt-BR"),
  );
}

