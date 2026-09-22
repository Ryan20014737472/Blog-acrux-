"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ManagedUser } from "./users-api";
import type { UserRole } from "@/types/content";

export const userField = "min-h-12 w-full rounded-xl border border-white/15 bg-[#020817] px-3 py-2 text-base text-white disabled:opacity-60";
export const roleLabels = { admin: "Administrador", editor: "Editor", visitor: "Sem acesso ao painel" };

export function UserAccessForm({ user, busy, onSave, onRecover, onDirty }: {
  user: ManagedUser;
  busy: boolean;
  onSave: (role: UserRole, displayName: string) => Promise<void>;
  onRecover: () => Promise<void>;
  onDirty: (id: string, dirty: boolean) => void;
}) {
  const [name, setName] = useState(user.displayName);
  const [role, setRole] = useState(user.role);
  const dirty = name !== user.displayName || role !== user.role;
  useEffect(() => { onDirty(user.id, dirty); return () => onDirty(user.id, false); }, [dirty, user.id, onDirty]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (role !== user.role && !window.confirm(`Alterar o acesso de ${user.email} para ${roleLabels[role]}?${role === "admin" ? " Essa pessoa poderá gerenciar usuários e todo o conteúdo." : ""}`)) return;
    await onSave(role, name);
  }
  return <form onSubmit={submit} className="mt-5 grid gap-4">
    <label className="grid gap-2 text-sm font-bold">Nome de exibição<input className={userField} value={name} maxLength={100} disabled={busy} onChange={(event) => setName(event.target.value)} /></label>
    <label className="grid gap-2 text-sm font-bold">Permissão<select className={userField} value={role} disabled={busy || user.role === "admin"} onChange={(event) => setRole(event.target.value as UserRole)}>
      {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></label>
    {user.role === "admin" && <p className="text-xs leading-5 text-acrux-muted">Administradores estão protegidos contra rebaixamento neste painel. Uma remoção deve ser feita no Supabase, mantendo outro administrador ativo.</p>}
    <div className="flex flex-wrap gap-3">
      <button className="button-primary" disabled={busy || !dirty || !user.updatedAt} type="submit">Salvar alterações</button>
      <button className="button-secondary" disabled={busy || user.role === "visitor" || dirty} type="button" onClick={() => { if (window.confirm(`Enviar um novo link para definir senha a ${user.email}?`)) void onRecover(); }}>Enviar link de senha</button>
    </div>
    {!user.updatedAt && <p className="text-sm text-amber-100">Esta conta está sem perfil. Revise a criação do perfil no Supabase.</p>}
    {dirty && <p className="text-xs text-acrux-muted">Alterações ainda não salvas. Salve antes de atualizar ou mudar de página.</p>}
  </form>;
}

