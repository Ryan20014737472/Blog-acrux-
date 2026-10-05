export interface NotificationChangeSource {
  action: "create" | "update" | "delete";
  changed_fields: string[];
  before_values: Record<string, unknown>;
  after_values: Record<string, unknown>;
}

interface Presentation {
  fieldLabel(field: string): string;
  valueText(value: unknown, field: string): string;
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function brief(value: string, limit = 110) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

function list(items: string[]) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}

export function notificationOverview(notification: NotificationChangeSource, fieldLabel: Presentation["fieldLabel"]) {
  const fields = [...new Set(notification.changed_fields)].filter((field) => field !== "id");
  const total = fields.length;
  const names = list(fields.slice(0, 5).map((field) => brief(fieldLabel(field), 60)));
  const remaining = total > 5 ? `, além de ${total - 5} ${total - 5 === 1 ? "outro campo" : "outros campos"}` : "";
  const count = `${total} ${total === 1 ? "campo" : "campos"}`;
  if (notification.action === "create") {
    return total ? `Novo registro cadastrado com ${count}: ${names}${remaining}. Os detalhes mostram os dados informados na criação.` : "Novo registro cadastrado. Não há campos adicionais registrados neste aviso.";
  }
  if (notification.action === "delete") {
    return total ? `O registro foi excluído. O histórico preservou ${count} do estado anterior: ${names}${remaining}.` : "O registro foi excluído. Não há valores anteriores adicionais registrados neste aviso.";
  }
  return total ? `${total === 1 ? "Foi alterado" : "Foram alterados"} ${count}: ${names}${remaining}. Os detalhes comparam os valores anteriores e atuais.` : "O registro foi atualizado, mas este aviso não contém campos adicionais para comparar.";
}

const collections: Record<string, { singular: string; plural: string; added: string; removed: string; updated: string }> = {
  image_paths: { singular: "imagem", plural: "imagens", added: "adicionada", removed: "removida", updated: "atualizada" },
  images: { singular: "imagem", plural: "imagens", added: "adicionada", removed: "removida", updated: "atualizada" },
  categories: { singular: "categoria", plural: "categorias", added: "adicionada", removed: "removida", updated: "atualizada" },
  team_members: { singular: "integrante", plural: "integrantes", added: "vinculado", removed: "desvinculado", updated: "atualizado" },
  tags: { singular: "tag", plural: "tags", added: "adicionada", removed: "removida", updated: "atualizada" },
};

function itemKey(value: unknown) {
  if (typeof value === "string") return `text:${value}`;
  if (!record(value)) return null;
  for (const field of ["id", "storage_path", "name"]) {
    if (typeof value[field] === "string") return `${field}:${value[field]}`;
  }
  return null;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (record(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
}

function itemName(value: unknown) {
  if (typeof value === "string") return brief(value, 60);
  if (!record(value)) return "";
  for (const field of ["name", "caption", "alt_text"]) {
    if (typeof value[field] === "string" && value[field].trim()) return brief(value[field], 60);
  }
  return "";
}

function collectionDescription(field: string, before: unknown[], after: unknown[], presentation: Presentation) {
  const label = presentation.fieldLabel(field);
  const words = collections[field];
  if (!words || before.length > 100 || after.length > 100) return `${label}: lista atualizada, de ${before.length} para ${after.length} itens. Confira os valores registrados nos detalhes.`;
  const previous = new Map(before.map((item) => [itemKey(item), item]));
  const current = new Map(after.map((item) => [itemKey(item), item]));
  // Ambiguous or duplicate identities cannot support reliable additions/removals.
  if (previous.has(null) || current.has(null) || previous.size !== before.length || current.size !== after.length) {
    return `${label}: lista atualizada, de ${before.length} para ${after.length} ${after.length === 1 ? words.singular : words.plural}. Confira os valores registrados nos detalhes.`;
  }
  const added = after.filter((item) => !previous.has(itemKey(item)));
  const removed = before.filter((item) => !current.has(itemKey(item)));
  const updated = after.filter((item) => previous.has(itemKey(item)) && canonical(previous.get(itemKey(item))) !== canonical(item));
  const changes: string[] = [];
  function describe(items: unknown[], verb: string) {
    if (!items.length) return;
    const names = field === "categories" || field === "team_members" || field === "tags" ? items.slice(0, 3).map(itemName).filter(Boolean) : [];
    changes.push(`${items.length} ${items.length === 1 ? words.singular : words.plural} ${verb}${items.length === 1 ? "" : "s"}${names.length ? ` (${list(names.map((name) => `“${name}”`))}${items.length > names.length ? "; outros itens nos detalhes" : ""})` : ""}`);
  }
  describe(added, words.added);
  describe(removed, words.removed);
  describe(updated, words.updated);
  if (field === "images" && updated.length) {
    const properties = new Set(updated.flatMap((item) => {
      if (!record(item)) return [];
      const old = previous.get(itemKey(item));
      if (!record(old)) return [];
      return [...new Set([...Object.keys(old), ...Object.keys(item)])].filter((key) => canonical(old[key]) !== canonical(item[key]));
    }));
    changes.push(`dados das imagens alterados: ${list([...properties].slice(0, 5).map(presentation.fieldLabel))}`);
  }
  const keptBefore = before.map(itemKey).filter((key) => current.has(key));
  const keptAfter = after.map(itemKey).filter((key) => previous.has(key));
  if (canonical(keptBefore) !== canonical(keptAfter)) changes.push(field === "images" || field === "image_paths" ? "ordem das imagens alterada" : "ordem da lista alterada");
  return changes.length ? `${label}: ${changes.join("; ")}.` : `${label}: os dados da lista foram atualizados. Confira os valores registrados nos detalhes.`;
}

function empty(value: unknown) {
  return value === undefined || value === null || value === "";
}

function excerpt(value: unknown) {
  return (record(value) && value.truncated === true) || (typeof value === "string" && value.endsWith("… [trecho]"));
}

export function describeNotificationChange(notification: NotificationChangeSource, field: string, presentation: Presentation) {
  const label = presentation.fieldLabel(field);
  const before = notification.before_values[field];
  const after = notification.after_values[field];
  if (notification.action === "create") return `${label}: ${Array.isArray(after) ? `lista inicial com ${after.length} ${after.length === 1 ? collections[field]?.singular ?? "item" : collections[field]?.plural ?? "itens"}` : `valor inicial — ${brief(presentation.valueText(after, field))}`}.`;
  if (notification.action === "delete") return `${label}: ${Array.isArray(before) ? `${before.length} ${before.length === 1 ? collections[field]?.singular ?? "item" : collections[field]?.plural ?? "itens"} no registro excluído` : `último valor registrado — ${brief(presentation.valueText(before, field))}`}.`;
  if (excerpt(before) || excerpt(after)) return `${label}: conteúdo alterado. O histórico contém apenas um trecho; consulte os valores registrados nos detalhes.`;
  if (Array.isArray(before) && Array.isArray(after)) return collectionDescription(field, before, after, presentation);
  if (record(before) || record(after)) {
    if (record(before) && record(after)) {
      const properties = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => canonical(before[key]) !== canonical(after[key]));
      if (properties.length) return `${label}: dados alterados em ${list(properties.slice(0, 5).map(presentation.fieldLabel))}${properties.length > 5 ? ` e mais ${properties.length - 5} campos` : ""}.`;
    }
    return `${label}: dados atualizados. Confira a comparação completa nos detalhes.`;
  }
  if (empty(before) && !empty(after)) return `${label}: informação adicionada — ${brief(presentation.valueText(after, field))}.`;
  if (!empty(before) && empty(after)) return `${label}: informação removida. Valor anterior: ${brief(presentation.valueText(before, field))}.`;
  if (typeof before === "string" && typeof after === "string" && ["body", "description", "report", "short_bio", "excerpt", "introduction", "home_introduction", "home_history", "partners_body", "mission", "vision", "values_text", "home_mission", "home_values", "home_trajectory", "institutional_note", "robocep"].includes(field)) {
    return `${label}: texto revisado, de ${Array.from(before).length} para ${Array.from(after).length} caracteres. Confira os textos anterior e atual nos detalhes.`;
  }
  return `${label}: de “${brief(presentation.valueText(before, field))}” para “${brief(presentation.valueText(after, field))}”.`;
}
