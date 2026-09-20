"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
type Member = { id: string; name: string; area: string | null };

export function RobotMembers({ robotId, canManage, disabled, onBusy }: { robotId: string; canManage: boolean; disabled: boolean; onBusy: (busy: boolean) => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const active = useRef(false);
  const lock = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; onBusy(false); };
  }, [onBusy]);
  useEffect(() => {
    let current = true;
    setLoading(true); setError("");
    async function load() {
      try {
        const client = createSupabaseBrowserClient();
        if (!client) throw new Error();
        const [people, links] = await Promise.all([client.from("team_members").select("id, name, area").order("name"), client.from("robot_team_members").select("team_member_id").eq("robot_id", robotId)]);
        if (people.error || links.error) throw new Error();
        if (current) { setMembers(people.data); setIds(links.data.map((link) => link.team_member_id)); }
      } catch { if (current) setError("Não foi possível carregar os integrantes. Atualize os vínculos."); }
      finally { if (current) setLoading(false); }
    }
    void load(); return () => { current = false; };
  }, [robotId, attempt]);
  async function toggle(id: string, checked: boolean) {
    if (!canManage || disabled || loading || error || lock.current) return;
    lock.current = true; setBusy(true); onBusy(true); setMessage("");
    try {
      const client = createSupabaseBrowserClient();
      if (!client) throw new Error();
      const result = checked
        ? await client.from("robot_team_members").insert({ robot_id: robotId, team_member_id: id }).select().single()
        : await client.from("robot_team_members").delete().eq("robot_id", robotId).eq("team_member_id", id).select().single();
      if (result.error) throw result.error;
      if (active.current) { setIds((current) => checked ? [...current, id] : current.filter((value) => value !== id)); setMessage("Vínculo atualizado."); }
    } catch { if (active.current) setError("Não foi possível alterar o vínculo. Atualize os vínculos e tente novamente."); }
    finally { lock.current = false; if (active.current) { setBusy(false); onBusy(false); } }
  }
  const visible = canManage ? members : members.filter((member) => ids.includes(member.id));
  return <section className="glass-panel min-w-0 rounded-3xl p-5 sm:p-7" aria-busy={busy || loading}>
    <h2 className="text-xl font-bold">Equipe envolvida</h2><p className="mt-2 text-sm text-acrux-muted">Os vínculos são salvos imediatamente, separadamente do formulário.</p>
    {loading ? <p role="status" className="mt-4">Carregando integrantes…</p> : null}
    {error ? <p role="alert" className="mt-4 text-sm text-red-100">{error}</p> : null}
    <fieldset className="mt-4 grid max-h-80 gap-2 overflow-y-auto" disabled={!canManage || busy || disabled || loading || !!error}><legend className="sr-only">Integrantes responsáveis</legend>{visible.map((member) => <label className="flex items-start gap-3 rounded-xl border border-white/10 p-3 text-sm" key={member.id}><input className="mt-1" type="checkbox" checked={ids.includes(member.id)} onChange={(event) => void toggle(member.id, event.target.checked)} /><span className="min-w-0 break-words">{member.name}<span className="block text-acrux-muted">{member.area}</span></span></label>)}</fieldset>
    {!loading && !error && !visible.length ? <p className="mt-4 text-sm text-acrux-muted">{canManage ? "Cadastre integrantes na área Equipe para vinculá-los." : "Nenhum integrante vinculado."}</p> : null}
    <button type="button" className="mt-3 min-h-11 text-sm text-acrux-cyan-bright" disabled={busy || disabled || loading} onClick={() => setAttempt((value) => value + 1)}>Atualizar vínculos</button>
    {message ? <p role="status" className="mt-3 text-sm text-acrux-cyan-bright">{message}</p> : null}
  </section>;
}

