"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import type { AdminSession } from "@/components/admin/admin-gate";
import { usersRequest, type UsersResponse } from "./users-api";
import { UserAccessForm, roleLabels, userField } from "./user-access-form";

export function UsersManager({ session }: { session: AdminSession }) {
  const [result, setResult] = useState<UsersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const lock = useRef(false);
  const pending = useRef(new Set<string>());
  const onDirty = useCallback((id: string, dirty: boolean) => { if (dirty) pending.current.add(id); else pending.current.delete(id); }, []);
  const canDiscard = () => !pending.current.size || window.confirm("Descartar as alterações não salvas?");
  const loadId = useRef(0);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (pending.current.size) { event.preventDefault(); event.returnValue = ""; } };
    const navigate = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (pending.current.size && link && link.target !== "_blank" && !window.confirm("Descartar as alterações não salvas e sair?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload); document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, []);
  const load = useCallback(async () => {
    const id = ++loadId.current;
    setLoading(true);
    try {
      const data = await usersRequest<UsersResponse>({ action: "list", page });
      if (id === loadId.current) setResult(data);
    } catch (cause) {
      if (id === loadId.current) { setResult(null); setError(cause instanceof Error ? cause.message : "Falha ao carregar usuários."); }
    } finally { if (id === loadId.current) setLoading(false); }
  }, [page]);
  useEffect(() => { const requests = loadId; setError(""); void load(); return () => { requests.current++; }; }, [load]);

  async function mutate(body: Record<string, unknown>) {
    if (lock.current) return;
    if ([...pending.current].some((id) => id !== body.id) && !window.confirm("Há alterações em outra conta que serão descartadas após esta operação. Continuar?")) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await usersRequest<{ message: string }>(body);
      setMessage(response.message);
      if (body.action === "invite") setEmail("");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!window.confirm(`Enviar convite para ${email.trim()} como ${inviteRole === "admin" ? "ADMINISTRADOR (acesso completo, incluindo usuários)" : "editor"}?`)) return;
    await mutate({ action: "invite", email, role: inviteRole });
  }
  const rows = result?.users.filter((user) => (!filter || user.role === filter) && `${user.email} ${user.displayName}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))) ?? [];
  return <AdminWorkspace session={session} section="usuarios" title="Gerenciar usuários" description="Convide pessoas autorizadas e controle quem pode editar o site. Senhas são definidas pela própria pessoa; nunca aparecem neste painel.">
    <section className="glass-panel mt-8 rounded-2xl p-5 sm:p-7" aria-labelledby="invite-title">
      <h2 id="invite-title" className="text-xl font-bold">Convidar usuário</h2>
      <p className="mt-2 text-sm leading-6 text-acrux-muted">Editor: acesso limitado de edição. Administrador: gestão completa, inclusive de usuários. Sem acesso: apenas navegação pública.</p>
      <form onSubmit={invite} className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
        <label className="grid gap-2 text-sm font-bold">E-mail<input className={userField} type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy || loading} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="grid gap-2 text-sm font-bold">Acesso<select className={userField} value={inviteRole} disabled={busy || loading} onChange={(event) => setInviteRole(event.target.value)}><option value="editor">Editor</option><option value="admin">Administrador</option></select></label>
        <button type="submit" className="button-primary" disabled={busy || loading || !result}>{busy ? "Processando…" : "Enviar convite"}</button>
      </form>
    </section>
    <div className="mt-6" aria-live="polite" aria-atomic="true">
      {message && <p className="rounded-xl border border-cyan-200/25 bg-cyan-300/10 p-4 text-sm">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200/25 bg-red-950/30 p-4 text-sm text-red-100">{error}</p>}
    </div>
    <section className="mt-8" aria-labelledby="users-title" aria-busy={loading || busy}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="users-title" className="text-2xl font-bold">Contas cadastradas</h2><button className="button-secondary" disabled={busy || loading} onClick={() => { if (canDiscard()) { setError(""); void load(); } }}>Atualizar lista</button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Buscar nesta página<input type="search" className={userField} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou e-mail" /></label>
        <label className="grid gap-2 text-sm font-bold">Filtrar por acesso<select className={userField} value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Todos</option>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      </div>
      {loading ? <p className="py-8 text-acrux-muted">Carregando usuários…</p> : <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {result?.users.map((user) => <article hidden={!rows.some((row) => row.id === user.id)} key={`${user.id}:${user.updatedAt}`} className="glass-panel min-w-0 rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2"><h3 className="break-all font-bold">{user.email || "Conta sem e-mail"}</h3>{user.id === result?.actorId && <span className="text-xs text-acrux-cyan-bright">Você</span>}</div>
          <p className="mt-2 text-sm text-acrux-muted">{user.confirmedAt ? "E-mail confirmado" : "Aguardando confirmação"} · {roleLabels[user.role]}</p>
          <p className="mt-1 text-xs text-acrux-muted">Último acesso: {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("pt-BR") : "Ainda não registrado"}</p>
          <UserAccessForm user={user} busy={busy} canRemove={user.id !== result?.actorId && user.role !== "admin"} onDirty={onDirty} onSave={(role, displayName) => mutate({ action: "update", id: user.id, updatedAt: user.updatedAt, role, displayName })} onRecover={() => mutate({ action: "recover", id: user.id })} onRemove={() => mutate({ action: "delete", id: user.id, updatedAt: user.updatedAt })} />
        </article>)}
        {result && !rows.length && <p className="py-6 text-acrux-muted">Nenhuma conta encontrada nesta página.</p>}
      </div>}
      <div className="mt-6 flex flex-wrap items-center gap-4"><button className="button-secondary" disabled={page === 1 || busy || loading} onClick={() => { if (canDiscard()) setPage((value) => value - 1); }}>Anterior</button><span className="text-sm">Página {page} · até 50 contas</span><button className="button-secondary" disabled={!result?.hasMore || busy || loading} onClick={() => { if (canDiscard()) setPage((value) => value + 1); }}>Próxima</button></div>
      <p className="mt-5 text-xs leading-6 text-acrux-muted">“Sem acesso ao painel” mantém a conta. “Remover usuário” apaga a conta de acesso e invalida convites pendentes; um novo convite será necessário para adicioná-la outra vez. Administradores não podem ser removidos por esta tela.</p>
    </section>
  </AdminWorkspace>;
}

