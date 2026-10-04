export type MailError = "provider_unavailable" | "provider_rejected" | "configuration_missing" | "delivery_failed";
export interface MailSettings {
  enabled: boolean;
  configured: boolean;
  sender: string | null;
  pending_count: number;
  last_error: string | null;
}
export interface MailCredentials {
  api_key: string | null;
  sender: string | null;
  recipient_email: string | null;
  enabled: boolean;
}
export interface MailNotification {
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
  before_values: Record<string, unknown>;
  after_values: Record<string, unknown>;
  claim_token: string;
  recipient_email: string;
  idempotency_key: string;
  attempts: number;
}
export interface MailService {
  actor(token: string): Promise<{ id: string; is_owner: boolean } | null>;
  verifyDispatchToken(token: string): Promise<boolean>;
  settings(): Promise<MailSettings>;
  configure(apiKey: string | null, sender: string, enabled: boolean): Promise<MailSettings>;
  credentials(): Promise<MailCredentials>;
  claim(limit: number): Promise<MailNotification[]>;
  finish(id: number, claimToken: string, providerId: string | null, error: MailError | null): Promise<boolean>;
}
interface Dependencies {
  fetch?: typeof fetch;
  now?: () => number;
  uuid?: () => string;
  timeoutMs?: number;
}

const origin = "https://ryan20014737472.github.io";
const panelUrl = `${origin}/Blog-acrux-/admin/notificacoes/`;
const requestLimit = 4096;
const batchSize = 5;
const fieldLabels: Record<string, string> = {
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
const sectionLabels: Record<string, string> = {
  about_page: "Sobre e início", posts: "Blog", categories: "Categorias do blog", post_categories: "Categorias do blog",
  team_members: "Equipe", team_areas: "Áreas da equipe", robots: "Robôs", projects: "Projetos",
  competitions: "Competições", achievements: "Conquistas", galleries: "Galeria", gallery_images: "Imagens da galeria",
  seasons: "Temporadas", sponsors: "Patrocinadores", profiles: "Usuários", media_assets: "Arquivos e imagens",
  robot_team_members: "Equipe dos robôs", project_team_members: "Equipe dos projetos", competition_team_members: "Participantes das competições",
};
const valueLabels: Record<string, string> = {
  draft: "Rascunho", published: "Publicado", archived: "Arquivado", admin: "Administrador", editor: "Editor", visitor: "Visitante",
};
const errorMessages: Record<MailError, string> = {
  configuration_missing: "Configure o serviço de e-mail e o remetente para receber as notificações.",
  provider_unavailable: "O serviço de e-mail está indisponível. A notificação será tentada novamente.",
  provider_rejected: "O serviço de e-mail recusou o envio. Confira a chave, o remetente e as permissões do serviço.",
  delivery_failed: "Não foi possível concluir o envio. As notificações pendentes serão tentadas novamente.",
};

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function bounded(value: string, limit = 1000) {
  return value.length > limit ? `${value.slice(0, limit)}… [trecho; consulte os detalhes no painel]` : value;
}
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
function fieldLabel(field: string) {
  return fieldLabels[field] ?? field.replaceAll("_", " ");
}
function valueText(value: unknown, field: string, depth = 0): string {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (typeof value === "boolean") return field === "is_published" ? value ? "Publicado" : "Não publicado" : value ? "Sim" : "Não";
  if (typeof value === "string") return bounded((field === "status" || field === "role") ? valueLabels[value] ?? value : value);
  if (typeof value === "number") return String(value);
  if (depth >= 4) return "Consulte os detalhes no painel";
  if (Array.isArray(value)) {
    if (!value.length) return "Nenhum item";
    // Render every property of related records. A caption/name alone would
    // hide edits to image descriptions, files and ordering from the owner.
    const items = value.slice(0, 20).map((item) => valueText(item, field, depth + 1));
    if (value.length > 20) items.push(`Mais ${value.length - 20} itens no painel`);
    return bounded(items.join("\n"));
  }
  if (record(value)) return bounded(Object.entries(value).slice(0, 20).map(([key, item]) => `${fieldLabel(key)}: ${valueText(item, key, depth + 1)}`).join("\n")) || "Nenhum item";
  return "Consulte os detalhes no painel";
}
function actionText(notification: MailNotification) {
  if (notification.action === "create") return "Criou";
  if (notification.action === "delete") return "Excluiu";
  const before = notification.before_values;
  const after = notification.after_values;
  if ((after.status === "published" && before.status !== "published") || (after.is_published === true && before.is_published !== true)) return "Publicou";
  if (after.status === "archived" && before.status !== "archived") return "Arquivou";
  if ((before.status === "published" && after.status === "draft") || (before.is_published === true && after.is_published === false)) return "Retirou da publicação";
  return "Alterou";
}
function dateText(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : `${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date)} (Brasília)`;
}

export function notificationEmail(notification: MailNotification) {
  const section = sectionLabels[notification.entity_table] ?? "Conteúdo do site";
  const action = actionText(notification);
  const label = bounded(notification.entity_label || "Item sem título", 160);
  const actor = bounded(notification.actor_kind === "system" ? "Rotina do sistema" : notification.actor_name?.trim() || (notification.actor_id ? `Usuário ${notification.actor_id}` : "Usuário sem nome registrado"), 160);
  const role = notification.actor_role ? valueLabels[notification.actor_role] ?? notification.actor_role : null;
  const attribution = `${actor}${role ? ` (${bounded(role, 50)})` : ""}`;
  const description = `${attribution}: ${action.toLowerCase()} “${label}” em ${section}.`;
  const fields = [...new Set(notification.changed_fields)].slice(0, 50);
  const changes = fields.map((field) => {
    const before = valueText(notification.before_values[field], field);
    const after = valueText(notification.after_values[field], field);
    const name = bounded(fieldLabel(field), 100);
    if (notification.action === "create") return { name, text: `${name}: ${after}`, html: `<strong>${escapeHtml(name)}</strong><br>${escapeHtml(after)}` };
    if (notification.action === "delete") return { name, text: `${name}: ${before}`, html: `<strong>${escapeHtml(name)}</strong><br>${escapeHtml(before)}` };
    return { name, text: `${name}\nAntes: ${before}\nDepois: ${after}`, html: `<strong>${escapeHtml(name)}</strong><br>Antes: ${escapeHtml(before)}<br>Depois: ${escapeHtml(after)}` };
  });
  const details = changes.length ? changes.map((item) => item.text).join("\n\n") : "Consulte os detalhes da alteração no painel.";
  const extra = notification.changed_fields.length > 50 ? "\nHá mais campos alterados; consulte todos no painel." : "";
  const subject = `[ACRUX] ${action}: ${label}`.replace(/[\r\n]/g, " ").slice(0, 200);
  return {
    subject,
    text: `${description}\nQuando: ${dateText(notification.occurred_at)}\n\n${details}${extra}\n\nVer notificações: ${panelUrl}\n\nEsta mensagem é exclusiva do proprietário do site.`,
    html: `<!doctype html><html lang="pt-BR"><body style="font-family:Arial,sans-serif;color:#18212b;line-height:1.6;max-width:640px;margin:24px auto;padding:0 16px"><h1 style="font-size:22px">Alteração no site ACRUX</h1><p>${escapeHtml(description)}</p><p>Quando: ${escapeHtml(dateText(notification.occurred_at))}</p>${changes.length ? changes.map((item) => `<p style="white-space:pre-wrap;overflow-wrap:anywhere">${item.html}</p>`).join("") : `<p>${escapeHtml(details)}</p>`}${extra ? `<p>${escapeHtml(extra.trim())}</p>` : ""}<p><a href="${panelUrl}">Ver notificações no painel</a></p><p style="font-size:12px;color:#536171">Esta mensagem é exclusiva do proprietário do site.</p></body></html>`,
  };
}

function safeSettings(settings: MailSettings) {
  return {
    enabled: settings.enabled === true,
    configured: settings.configured === true,
    sender: typeof settings.sender === "string" ? settings.sender : null,
    pending_count: Number.isSafeInteger(settings.pending_count) && settings.pending_count >= 0 ? settings.pending_count : 0,
    last_error: typeof settings.last_error === "string" && Object.hasOwn(errorMessages, settings.last_error) ? settings.last_error : null,
  };
}
function senderValue(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 254 || /[\r\n]/.test(value)) return null;
  const email = value.trim();
  if (email.length > 254 || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(email)) return null;
  return email;
}
function ready(credentials: MailCredentials) {
  return Boolean(credentials.api_key && credentials.sender && credentials.recipient_email);
}

async function readInput(request: Request): Promise<{ input?: Record<string, unknown>; status?: number }> {
  if (Number(request.headers.get("content-length")) > requestLimit) return { status: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { status: 400 };
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > requestLimit) { await reader.cancel(); return { status: 413 }; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const input: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return record(input) ? { input } : { status: 400 };
  } catch { return { status: 400 }; }
  finally { reader.releaseLock(); }
}

// The platform JWT check is disabled to admit the scheduler's custom token.
// EVERY owner action still verifies Auth and the database's pinned owner; the
// scheduler can dispatch only and cannot read settings or change recipients.
export function createHandler(serviceFor: (token: string | null) => MailService, dependencies: Dependencies = {}) {
  const sendFetch = dependencies.fetch ?? fetch;
  const now = dependencies.now ?? Date.now;
  const uuid = dependencies.uuid ?? (() => crypto.randomUUID());
  const timeoutMs = dependencies.timeoutMs ?? 10_000;
  async function sendMail(credentials: MailCredentials, message: { subject: string; text: string; html: string }, idempotencyKey: string): Promise<{ providerId: string | null; error: MailError | null }> {
    if (!ready(credentials)) return { providerId: null, error: "configuration_missing" };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await sendFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${credentials.api_key}`, "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ from: `ACRUX <${credentials.sender}>`, to: [credentials.recipient_email], ...message }),
        signal: controller.signal,
      });
      if (!response.ok) return { providerId: null, error: response.status === 429 || response.status >= 500 ? "provider_unavailable" : "provider_rejected" };
      const result: unknown = await response.json();
      if (!record(result) || typeof result.id !== "string" || !result.id || result.id.length > 200) return { providerId: null, error: "delivery_failed" };
      return { providerId: result.id, error: null };
    } catch { return { providerId: null, error: "provider_unavailable" }; }
    finally { clearTimeout(timeout); }
  }

  return async (request: Request): Promise<Response> => {
    const headers = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json", "Cache-Control": "no-store", Vary: "Origin" };
    const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
    const errorReply = (status: number, code: MailError) => reply(status, { code, error: errorMessages[code] });
    if (request.headers.has("origin") && request.headers.get("origin") !== origin) return reply(403, { error: "Origem não permitida." });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply(405, { error: "Método não permitido." });
    const parsed = await readInput(request);
    if (!parsed.input) return reply(parsed.status ?? 400, { error: parsed.status === 413 ? "Solicitação muito grande." : "Solicitação inválida." });
    const input = parsed.input;
    const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1] ?? null;
    try {
      const service = serviceFor(token);
      if (input.action === "dispatch") {
        const dispatchToken = request.headers.get("x-acrux-notification-token");
        if (!dispatchToken || dispatchToken.length > 512 || !await service.verifyDispatchToken(dispatchToken)) return reply(401, { error: "Agendamento não autorizado." });
        const credentials = await service.credentials();
        if (!credentials.enabled) return reply(200, { enabled: false, claimed: 0, sent: 0, failed: 0 });
        if (!ready(credentials)) return errorReply(503, "configuration_missing");
        const startedAt = now();
        const notifications = await service.claim(batchSize);
        let sent = 0;
        let failed = 0;
        for (const notification of notifications) {
          // Only credentials obtained from the pinned owner are used for the
          // recipient. A stale claim for a previous owner is never redirected.
          if (notification.recipient_email !== credentials.recipient_email) {
            if (!await service.finish(notification.id, notification.claim_token, null, "configuration_missing")) return errorReply(503, "delivery_failed");
            failed++;
            continue;
          }
          if (now() - startedAt >= 45_000) break; // remaining claims expire and retry in the durable outbox
          const key = /^[\w:-]{1,256}$/.test(notification.idempotency_key) ? notification.idempotency_key : `acrux-content-notification-${notification.id}`;
          const result = await sendMail(credentials, notificationEmail(notification), key);
          if (!await service.finish(notification.id, notification.claim_token, result.providerId, result.error)) return errorReply(503, "delivery_failed");
          if (result.error) failed++; else sent++;
        }
        return reply(200, { enabled: true, claimed: notifications.length, sent, failed });
      }
      if (!token) return reply(401, { error: "Entre novamente para continuar." });
      const actor = await service.actor(token);
      if (!actor) return reply(401, { error: "Sessão inválida. Entre novamente." });
      if (actor.is_owner !== true) return reply(403, { error: "Somente o proprietário pode configurar as notificações." });
      if (input.action === "status") return reply(200, { settings: safeSettings(await service.settings()) });
      if (input.action === "configure") {
        const sender = senderValue(input.sender);
        const key = input.api_key === null || input.api_key === undefined ? null : typeof input.api_key === "string" ? input.api_key.trim() : "";
        if (!sender || typeof input.enabled !== "boolean" || (key !== null && !/^re_[A-Za-z0-9_-]{8,253}$/.test(key))) return reply(400, { error: "Informe um remetente válido e, ao substituir a chave, uma chave válida do Resend." });
        if (input.enabled && key === null && !(await service.settings()).configured) return errorReply(409, "configuration_missing");
        const settings = safeSettings(await service.configure(key, sender, input.enabled));
        return reply(200, { settings, message: "Configuração de e-mail salva." });
      }
      if (input.action === "test") {
        const credentials = await service.credentials();
        if (!ready(credentials)) return errorReply(409, "configuration_missing");
        const result = await sendMail(credentials, {
          subject: "Teste de notificações ACRUX",
          text: `As notificações de alterações no site ACRUX serão enviadas somente para você.\n\nVer notificações: ${panelUrl}\n\nEste é um teste solicitado no painel; nenhum conteúdo do site foi alterado.`,
          html: `<!doctype html><html lang="pt-BR"><body style="font-family:Arial,sans-serif;line-height:1.6"><h1 style="font-size:22px">Teste de notificações ACRUX</h1><p>As notificações de alterações no site ACRUX serão enviadas somente para você.</p><p><a href="${panelUrl}">Ver notificações no painel</a></p><p>Este é um teste solicitado no painel; nenhum conteúdo do site foi alterado.</p></body></html>`,
        }, `acrux-content-notification-test-${uuid()}`);
        if (result.error) return errorReply(503, result.error);
        return reply(200, { message: "E-mail de teste aceito pelo serviço somente para o proprietário. Confira sua caixa de entrada e spam." });
      }
      return reply(400, { error: "Operação inválida." });
    } catch { return errorReply(503, "delivery_failed"); }
  };
}
