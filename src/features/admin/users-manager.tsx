"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import type { AdminSession } from "@/components/admin/admin-gate";
import { ConfirmationDialog, type ConfirmationRequest } from "@/components/admin/confirmation-dialog";
import { usersRequest, type ManagedUser, type UsersResponse } from "./users-api";
import { UserAccessForm, roleLabels, userField } from "./user-access-form";
import type { UserRole } from "@/types/content";

export function UsersManager({ session }: { session: AdminSession }) {
  const [result, setResult] = useState<UsersResponse | null>(null);
  const [listRevision, setListRevision] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const lock = useRef(false);
  const pending = useRef(new Set<string>());
  const onDirty = useCallback((id: string, dirty: boolean) => { if (dirty) pending.current.add(id); else pending.current.delete(id); }, []);
  const afterDiscard = (action: () => void) => {
    if (!pending.current.size) { action(); return; }
    setConfirmation({
      title: "Descartar alterações?",
      description: "Existem alterações de usuários ainda não salvas. Elas serão perdidas se você continuar.",
      confirmLabel: "Descartar e continuar",
      tone: "danger",
      onConfirm: action,
    });
  };
  const loadId = useRef(0);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (pending.current.size) { event.preventDefault(); event.returnValue = ""; } };
    const navigate = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (pending.current.size && link && link.target !== "_blank" && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault(); event.stopPropagation();
        const href = link.href;
        setConfirmation({ title: "Sair sem salvar?", description: "As alterações feitas nos usuários ainda não foram salvas e serão perdidas.", confirmLabel: "Sair sem salvar", tone: "danger", onConfirm: () => { pending.current.clear(); window.location.assign(href); } });
      }
    };
    window.addEventListener("beforeunload", unload); document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, []);
  const load = useCallback(async () => {
    const id = ++loadId.current;
    setLoading(true);
    try {
      const data = await usersRequest<UsersResponse>({ action: "list", page });
      if (id === loadId.current) { pending.current.clear(); setResult(data); setListRevision((value) => value + 1); }
    } catch (cause) {
      if (id === loadId.current) { setResult(null); setError(cause instanceof Error ? cause.message : "Falha ao carregar usuários."); }
    } finally { if (id === loadId.current) setLoading(false); }
  }, [page]);
  useEffect(() => { const requests = loadId; setError(""); void load(); return () => { requests.current++; }; }, [load]);

  async function mutate(body: Record<string, unknown>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await usersRequest<{ message: string }>(body);
      setMessage(response.message);
      if (body.action === "invite") setEmail("");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir."); }
    finally { lock.current = false; setBusy(false); }
  }
  function askMutation(body: Record<string, unknown>, request: Omit<ConfirmationRequest, "onConfirm">) {
    const otherChanges = [...pending.current].some((id) => id !== body.id);
    setConfirmation({
      ...request,
      description: otherChanges ? `${request.description} Alterações não salvas em outra conta serão descartadas.` : request.description,
      onConfirm: () => mutate(body),
    });
  }
  async function confirmAction() {
    if (!confirmation || confirmBusy) return;
    setConfirmBusy(true);
    try { await confirmation.onConfirm(); setConfirmation(null); }
    finally { setConfirmBusy(false); }
  }
  function invite(event: FormEvent) {
    event.preventDefault();
    const recipient = email.trim();
    askMutation({ action: "invite", email: recipient, role: inviteRole }, {
      title: "Enviar convite?",
      description: `Um e-mail será enviado para ${recipient}. A pessoa receberá acesso como ${inviteRole === "admin" ? "administrador, com gestão completa do site e dos usuários" : "editor"}.`,
      confirmLabel: "Enviar convite",
    });
  }
  function saveUser(user: ManagedUser, role: UserRole, displayName: string) {
    const body = { action: "update", id: user.id, updatedAt: user.updatedAt, role, displayName };
    if (role !== user.role || [...pending.current].some((id) => id !== user.id)) {
      askMutation(body, {
        title: "Salvar acesso?",
        description: role === user.role ? `Salvar as alterações de ${user.email}?` : `Alterar o acesso de ${user.email} para ${roleLabels[role]}?${role === "admin" ? " Essa pessoa poderá gerenciar usuários e todo o conteúdo." : ""}`,
        confirmLabel: "Salvar alterações",
      });
    } else void mutate(body);
  }
  function recoverUser(user: ManagedUser) {
    askMutation({ action: "recover", id: user.id }, {
      title: "Enviar link de senha?",
      description: `Um novo link para definir a senha será enviado para ${user.email}. Oriente a pessoa a usar somente o e-mail mais recente.`,
      confirmLabel: "Enviar link",
    });
  }
  function removeUser(user: ManagedUser) {
    askMutation({ action: "delete", id: user.id, updatedAt: user.updatedAt }, {
      title: "Remover usuário?",
      description: `A conta de ${user.email} será removida. Convites antigos deixarão de funcionar e será necessário convidar essa pessoa novamente. Essa ação não pode ser desfeita.`,
      confirmLabel: "Remover usuário",
      requiredText: user.email,
      tone: "danger",
    });
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
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="users-title" className="text-2xl font-bold">Contas cadastradas</h2><button className="button-secondary" disabled={busy || loading} onClick={() => afterDiscard(() => { setError(""); void load(); })}>Atualizar lista</button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Buscar nesta página<input type="search" className={userField} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou e-mail" /></label>
        <label className="grid gap-2 text-sm font-bold">Filtrar por acesso<select className={userField} value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Todos</option>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      </div>
      {loading ? <p className="py-8 text-acrux-muted">Carregando usuários…</p> : <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {result?.users.map((user) => <article hidden={!rows.some((row) => row.id === user.id)} key={`${user.id}:${user.updatedAt}:${listRevision}`} className="glass-panel min-w-0 rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2"><h3 className="break-all font-bold">{user.email || "Conta sem e-mail"}</h3>{user.id === result?.actorId && <span className="text-xs text-acrux-cyan-bright">Você</span>}</div>
          <p className="mt-2 text-sm text-acrux-muted">{user.confirmedAt ? "E-mail confirmado" : "Aguardando confirmação"} · {roleLabels[user.role]}</p>
          <p className="mt-1 text-xs text-acrux-muted">Último acesso: {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("pt-BR") : "Ainda não registrado"}</p>
          <UserAccessForm user={user} busy={busy} canRemove={user.id !== result?.actorId && user.role !== "admin"} onDirty={onDirty} onSave={(role, displayName) => saveUser(user, role, displayName)} onRecover={() => recoverUser(user)} onRemove={() => removeUser(user)} />
        </article>)}
        {result && !rows.length && <p className="py-6 text-acrux-muted">Nenhuma conta encontrada nesta página.</p>}
      </div>}
      <div className="mt-6 flex flex-wrap items-center gap-4"><button className="button-secondary" disabled={page === 1 || busy || loading} onClick={() => afterDiscard(() => setPage((value) => value - 1))}>Anterior</button><span className="text-sm">Página {page} · até 50 contas</span><button className="button-secondary" disabled={!result?.hasMore || busy || loading} onClick={() => afterDiscard(() => setPage((value) => value + 1))}>Próxima</button></div>
      <p className="mt-5 text-xs leading-6 text-acrux-muted">“Sem acesso ao painel” mantém a conta. “Remover usuário” apaga a conta de acesso e invalida convites pendentes; um novo convite será necessário para adicioná-la outra vez. Administradores não podem ser removidos por esta tela.</p>
    </section>
    <ConfirmationDialog request={confirmation} busy={confirmBusy} onCancel={() => setConfirmation(null)} onConfirm={() => void confirmAction()} />
  </AdminWorkspace>;
}

