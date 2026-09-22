export type Role = "admin" | "editor" | "visitor";
export interface Account { id: string; email?: string; email_confirmed_at?: string; invited_at?: string; last_sign_in_at?: string; created_at: string }
export interface Profile { id: string; display_name: string | null; role: Role; updated_at: string }
export interface UserService {
  actor(token: string): Promise<{ id: string; role: Role } | null>;
  users(page: number): Promise<Account[]>;
  profiles(ids: string[]): Promise<Profile[]>;
  invite(email: string, redirect: string): Promise<Account>;
  update(id: string, expected: string, role: Role, name: string | null): Promise<boolean>;
  recover(email: string, redirect: string): Promise<void>;
}
const origin = "https://ryan20014737472.github.io";
const activation = `${origin}/Blog-acrux-/admin/ativar-conta/`;
const roles: Role[] = ["admin", "editor", "visitor"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Authorization is verified against Auth and profiles on EVERY request, never user_metadata.
export function createHandler(serviceFor: (token: string) => UserService) {
  return async (request: Request): Promise<Response> => {
    const headers = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin" };
    const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
    if (request.headers.has("origin") && request.headers.get("origin") !== origin) return reply(403, { error: "Origem não permitida." });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply(405, { error: "Método não permitido." });
    const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return reply(401, { error: "Entre novamente para continuar." });
    try {
      const service = serviceFor(token);
      const actor = await service.actor(token);
      if (!actor) return reply(401, { error: "Sessão inválida. Entre novamente." });
      if (actor.role !== "admin") return reply(403, { error: "Somente administradores podem gerenciar usuários." });
      const raw = await request.text();
      if (raw.length > 4096) return reply(413, { error: "Solicitação muito grande." });
      let input: Record<string, unknown>;
      try { input = JSON.parse(raw); } catch { return reply(400, { error: "Solicitação inválida." }); }
      if (!input || typeof input !== "object" || Array.isArray(input)) return reply(400, { error: "Solicitação inválida." });
      if (input.action === "list") {
        const page = input.page ?? 1;
        if (!Number.isInteger(page) || Number(page) < 1 || Number(page) > 10000) return reply(400, { error: "Página inválida." });
        const users = await service.users(Number(page));
        const profiles = users.length ? await service.profiles(users.map((user) => user.id)) : [];
        return reply(200, { actorId: actor.id, hasMore: users.length === 50, users: users.map((user) => {
          const profile = profiles.find((row) => row.id === user.id);
          return { id: user.id, email: user.email ?? "", displayName: profile?.display_name ?? "", role: profile?.role ?? "visitor", updatedAt: profile?.updated_at ?? null, confirmedAt: user.email_confirmed_at ?? null, invitedAt: user.invited_at ?? null, lastSignInAt: user.last_sign_in_at ?? null };
        }) });
      }
      if (input.action === "invite") {
        const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["editor", "admin"].includes(String(input.role))) return reply(400, { error: "Informe um e-mail válido e o acesso desejado." });
        // Never turn a resend into a permission change on an existing account.
        for (let page = 1; ; page++) {
          const users = await service.users(page);
          if (users.some((user) => user.email?.toLowerCase() === email)) return reply(409, { error: "Esta conta já existe. Localize-a na lista e use Enviar link de senha." });
          if (users.length < 50) break;
        }
        const user = await service.invite(email, activation);
        const [profile] = await service.profiles([user.id]);
        if (!profile || profile.role !== "visitor" || !await service.update(user.id, profile.updated_at, input.role as Role, profile.display_name)) {
          return reply(409, { error: "Convite enviado, mas a permissão não foi aplicada. Atualize a lista e revise o acesso da conta antes de reenviar qualquer convite." });
        }
        return reply(200, { message: "Convite enviado e permissão configurada. A pessoa define a própria senha pelo e-mail." });
      }
      if (!["update", "recover"].includes(String(input.action)) || typeof input.id !== "string" || !uuid.test(input.id)) return reply(400, { error: "Operação inválida." });
      const [profile] = await service.profiles([input.id]);
      if (!profile) return reply(404, { error: "Perfil não encontrado." });
      if (input.action === "update") {
        if (!roles.includes(input.role as Role) || typeof input.displayName !== "string" || input.displayName.trim().length > 100 || typeof input.updatedAt !== "string") return reply(400, { error: "Nome ou permissão inválidos." });
        // Admin accounts cannot be demoted here: this also avoids last-admin races.
        // A deliberate administrator removal is performed through the Supabase dashboard.
        if (profile.role === "admin" && input.role !== "admin") return reply(409, { error: "Administradores estão protegidos contra remoção de acesso neste painel. Para remover um administrador, use o Supabase após garantir outro administrador ativo." });
        if (!await service.update(input.id, input.updatedAt, input.role as Role, input.displayName.trim() || null)) return reply(409, { error: "O perfil mudou. Atualize a lista antes de salvar novamente." });
        return reply(200, { message: "Perfil atualizado." });
      }
      if (profile.role === "visitor") return reply(400, { error: "Autorize esta conta como editor ou administrador antes de enviar o link." });
      // Resolve email from Auth, not from a client-provided recipient.
      for (let page = 1; ; page++) {
        const users = await service.users(page);
        const user = users.find((item) => item.id === input.id);
        if (user?.email) { await service.recover(user.email, activation); return reply(200, { message: "Link para definir senha enviado. Use o e-mail mais recente." }); }
        if (users.length < 50) return reply(404, { error: "Conta não encontrada." });
      }
    } catch {
      return reply(503, { error: "Não foi possível concluir. Verifique a conexão, a configuração de e-mail e os limites de envio do Supabase. Atualize a lista antes de tentar novamente." });
    }
  };
}

