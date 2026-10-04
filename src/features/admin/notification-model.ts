export type NotificationValue = string | number | boolean | null | NotificationValue[] | { [key: string]: NotificationValue };

export interface ContentNotification {
  id: number;
  occurred_at: string;
  entity_table: string;
  entity_id: string;
  entity_label: string;
  action: "create" | "update" | "delete";
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  actor_kind: "user" | "system";
  changed_fields: string[];
  before_values: Record<string, NotificationValue>;
  after_values: Record<string, NotificationValue>;
  read_at: string | null;
  email_status: "pending" | "sending" | "sent" | "failed" | "disabled";
  email_error: string | null;
}

export interface ContentNotificationStatus {
  is_owner: boolean;
  configured: boolean;
  unread_count: number;
  email_enabled: boolean;
  email_configured: boolean;
  last_email_error: string | null;
}

export interface ContentNotificationPage {
  items: ContentNotification[];
  next_cursor: number | null;
}

const sectionLabels: Record<string, string> = {
  about_page: "Sobre e início", posts: "Blog", categories: "Categorias do blog", post_categories: "Categorias do blog",
  team_members: "Equipe", team_areas: "Áreas da equipe", robots: "Robôs", projects: "Projetos",
  competitions: "Competições", achievements: "Conquistas", galleries: "Galeria", gallery_images: "Imagens da galeria",
  seasons: "Temporadas", sponsors: "Patrocinadores", profiles: "Usuários", media_assets: "Arquivos e imagens",
  robot_team_members: "Equipe dos robôs", project_team_members: "Equipe dos projetos", competition_team_members: "Participantes das competições",
};

const fieldLabels: Record<string, string> = {
  id: "Identificador do registro",
  title: "Título", name: "Nome", slug: "Identificador do link", headline: "Título de apresentação", introduction: "Introdução",
  institutional_note: "Nota institucional", mission: "Missão", vision: "Visão", values_text: "Valores", robocep: "ROBOCEP",
  partners_title: "Título das parcerias", partners_body: "Texto das parcerias", home_headline: "Título da página inicial",
  home_introduction: "Introdução da página inicial", home_history: "História na página inicial", home_mission: "Missão na página inicial",
  home_values: "Valores na página inicial", home_trajectory: "Trajetória na página inicial", milestones: "Marcos da trajetória",
  label: "Nome da temporada", year: "Ano", summary: "Resumo", is_current: "Temporada atual", area: "Área", role_title: "Função",
  short_bio: "Biografia", photo_path: "Foto", display_order: "Ordem de exibição", is_published: "Publicação",
  is_home_featured: "Destaque na página inicial", season_id: "Temporada", category: "Categoria", description: "Descrição",
  cover_path: "Capa", body: "Conteúdo", organization: "Organização", event_name: "Nome do evento", starts_at: "Início",
  ends_at: "Término", location: "Local", result: "Resultado", awards: "Premiações", report: "Relato", mechanisms: "Mecanismos",
  components: "Componentes", specifications: "Especificações", cad_embed_url: "Link do CAD", competition_id: "Competição",
  achieved_on: "Data da conquista", placement: "Colocação", project_id: "Projeto", gallery_id: "Álbum", storage_bucket: "Pasta de arquivos",
  storage_path: "Arquivo", alt_text: "Descrição da imagem", caption: "Legenda", author_id: "Autor", excerpt: "Resumo da postagem",
  image_paths: "Imagens", tags: "Tags", status: "Status", is_featured: "Destaque", published_at: "Data da publicação",
  categories: "Categorias", images: "Imagens", team_members: "Integrantes", category_id: "Categoria", post_id: "Postagem",
  team_member_id: "Integrante", robot_id: "Robô", website_url: "Site", logo_path: "Logotipo", tier: "Categoria de apoio",
  display_name: "Nome da conta", avatar_path: "Foto da conta", role: "Permissão", profile_id: "Conta vinculada", bucket_id: "Pasta de arquivos",
  uploaded_by: "Responsável pelo envio", email: "E-mail", invite_status: "Status do convite",
};

const valueLabels: Record<string, string> = {
  draft: "Rascunho", published: "Publicado", archived: "Arquivado", admin: "Administrador", editor: "Editor", visitor: "Visitante",
};

export function notificationSection(table: string) {
  return sectionLabels[table] ?? "Conteúdo do site";
}

export function notificationField(field: string) {
  return fieldLabels[field] ?? field.replaceAll("_", " ");
}

export function notificationActor(notification: Pick<ContentNotification, "actor_kind" | "actor_name" | "actor_id">) {
  if (notification.actor_kind === "system") return "Rotina do sistema";
  return notification.actor_name?.trim() || (notification.actor_id ? `Usuário ${notification.actor_id}` : "Usuário sem nome registrado");
}

export function notificationRole(role: string | null) {
  return role ? valueLabels[role] ?? role : null;
}

export function notificationAction(notification: Pick<ContentNotification, "action" | "before_values" | "after_values">) {
  if (notification.action === "delete") return "Excluiu";
  if (notification.action === "create") return "Criou";
  if (notification.after_values.status === "published" && notification.before_values.status !== "published") return "Publicou";
  if (notification.after_values.is_published === true && notification.before_values.is_published !== true) return "Publicou";
  if (notification.after_values.status === "archived" && notification.before_values.status !== "archived") return "Arquivou";
  if ((notification.before_values.status === "published" && notification.after_values.status === "draft") ||
    (notification.before_values.is_published === true && notification.after_values.is_published === false)) return "Retirou da publicação";
  return "Alterou";
}

export function notificationDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function notificationValue(value: NotificationValue | undefined, field: string): string {
  if (value === undefined || value === null || value === "") return "Não informado";
  if (typeof value === "boolean") return field === "is_published" ? value ? "Publicado" : "Não publicado" : value ? "Sim" : "Não";
  if (typeof value === "string") {
    if (field === "status" || field === "role") return valueLabels[value] ?? value;
    if (["starts_at", "ends_at", "published_at"].includes(field)) return notificationDate(value);
    return value;
  }
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return "Nenhum item";
    return value.map((item) => notificationValue(item, field)).join("\n\n");
  }
  if (value.truncated === true && typeof value.excerpt === "string") return `${value.excerpt}\n… [trecho]`;
  return Object.entries(value).map(([key, item]) => `${notificationField(key)}: ${notificationValue(item, key)}`).join("\n") || "Nenhum item";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nullableString(value: unknown) {
  return value === null || typeof value === "string";
}

export function parseNotificationStatus(value: unknown): ContentNotificationStatus {
  if (!isRecord(value) || typeof value.is_owner !== "boolean" || typeof value.configured !== "boolean" ||
    !Number.isSafeInteger(value.unread_count) || Number(value.unread_count) < 0 || typeof value.email_enabled !== "boolean" ||
    typeof value.email_configured !== "boolean" || !nullableString(value.last_email_error)) throw new Error("Invalid notification status");
  return value as unknown as ContentNotificationStatus;
}

export function parseNotificationPage(value: unknown): ContentNotificationPage {
  if (!isRecord(value) || !Array.isArray(value.items) || !(value.next_cursor === null || (Number.isSafeInteger(value.next_cursor) && Number(value.next_cursor) > 0))) throw new Error("Invalid notification page");
  for (const item of value.items) {
    if (!isRecord(item) || !Number.isSafeInteger(item.id) || Number(item.id) <= 0 || typeof item.occurred_at !== "string" ||
      typeof item.entity_table !== "string" || typeof item.entity_id !== "string" || typeof item.entity_label !== "string" ||
      !["create", "update", "delete"].includes(String(item.action)) || !nullableString(item.actor_id) || !nullableString(item.actor_name) ||
      !nullableString(item.actor_role) || !["user", "system"].includes(String(item.actor_kind)) || !Array.isArray(item.changed_fields) ||
      !item.changed_fields.every((field) => typeof field === "string") || !isRecord(item.before_values) || !isRecord(item.after_values) ||
      !nullableString(item.read_at) || !["pending", "sending", "sent", "failed", "disabled"].includes(String(item.email_status)) ||
      !nullableString(item.email_error)) throw new Error("Invalid content notification");
  }
  return value as unknown as ContentNotificationPage;
}

export function mergeNotifications(current: ContentNotification[], incoming: ContentNotification[]) {
  const byId = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => byId.set(item.id, item));
  return [...byId.values()].sort((first, second) => second.id - first.id);
}
