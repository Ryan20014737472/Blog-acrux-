"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import type { AdminSession } from "@/components/admin/admin-gate";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { slugify } from "@/lib/content/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Draft = { id: string | null; updatedAt: string | null; label: string; slug: string; year: string; summary: string; isCurrent: boolean; isPublished: boolean };
const blank: Draft = { id: null, updatedAt: null, label: "", slug: "", year: "", summary: "", isCurrent: false, isPublished: false };

function fromRow(row: Season): Draft {
  return { id: row.id, updatedAt: row.updated_at, label: row.label, slug: row.slug, year: String(row.year), summary: row.summary ?? "", isCurrent: row.is_current, isPublished: row.is_published };
}

export function SeasonsManager({ session }: { session: AdminSession }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = session.role === "admin";
  const original = seasons.find((season) => season.id === draft.id);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(original ? fromRow(original) : blank);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  function select(next: Draft) {
    if (isDirty && !window.confirm("Descartar alterações não salvas?")) return;
    setDraft(next); setError(""); setMessage("");
  }

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("Supabase não configurado."); setLoading(false); return; }
    const { data, error: loadError } = await supabase.from("seasons").select("*").order("year", { ascending: false }).order("label");
    if (loadError) setError("Não foi possível carregar as temporadas.");
    else setSeasons(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function changeLabel(label: string) {
    setDraft((current) => ({ ...current, label, slug: !current.id && current.slug === slugify(current.label) ? slugify(label) : current.slug }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || busy) return;
    const label = draft.label.trim();
    const slug = slugify(draft.slug);
    const year = Number(draft.year);
    if (!label || !slug) { setError("Informe o nome e o endereço da temporada."); return; }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) { setError("Informe um ano entre 2000 e 2100."); return; }
    if (draft.isCurrent && seasons.some((season) => season.is_current && season.id !== draft.id)) {
      setError("Já existe uma temporada marcada como atual. Desmarque-a antes de selecionar outra.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const payload = { label, slug, year, summary: draft.summary.trim() || null, is_current: draft.isCurrent, is_published: draft.isPublished };
    const request = draft.id
      ? supabase.from("seasons").update(payload).eq("id", draft.id).eq("updated_at", draft.updatedAt!).select().maybeSingle()
      : supabase.from("seasons").insert(payload).select().maybeSingle();
    const { data, error: saveError } = await request;
    setBusy(false);
    if (saveError) {
      setError(saveError.code === "23505" ? "Endereço já usado ou já existe outra temporada atual." : "Não foi possível salvar a temporada.");
      return;
    }
    if (!data) { setError("Este cadastro foi alterado por outra pessoa. Recarregue a página antes de salvar."); return; }
    setDraft(fromRow(data));
    setMessage(draft.id ? "Temporada atualizada." : "Temporada cadastrada.");
    await load();
  }

  async function remove() {
    if (!draft.id || !canManage || busy) return;
    if (!window.confirm(`Excluir ${draft.label}? Os conteúdos vinculados perderão a referência à temporada. Essa ação não pode ser desfeita.`)) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const { data, error: deleteError } = await supabase.from("seasons").delete().eq("id", draft.id).eq("updated_at", draft.updatedAt!).select("id").maybeSingle();
    setBusy(false);
    if (deleteError) { setError("Não foi possível excluir a temporada."); return; }
    if (!data) { setError("Este cadastro foi alterado por outra pessoa. Recarregue a página antes de excluir."); return; }
    setDraft(blank);
    setMessage("Temporada excluída. Os conteúdos vinculados foram mantidos sem temporada.");
    await load();
  }

  return <AdminWorkspace description="Organize o arquivo histórico da equipe. Publique apenas períodos confirmados; os demais ficam visíveis somente para a equipe autorizada." section="temporadas" session={session} title="Gerenciar temporadas">
    <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="glass-panel h-fit rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-white">Temporadas ({seasons.length})</h2>{canManage && <button className="button-secondary px-4" onClick={() => select(blank)} type="button">Nova</button>}</div>
        {loading ? <p className="mt-5 text-sm text-acrux-muted">Carregando…</p> : seasons.length ? <ul className="mt-5 space-y-2">{seasons.map((season) => <li key={season.id}><button className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${draft.id === season.id ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 hover:border-cyan-300/25"}`} onClick={() => select(fromRow(season))} type="button"><span className="block font-bold text-white">{season.label}</span><span className="text-xs text-acrux-muted">{season.year} · {season.is_published ? "Publicada" : "Rascunho"}{season.is_current ? " · Atual" : ""}</span></button></li>)}</ul> : <p className="mt-5 text-sm text-acrux-muted">Nenhuma temporada cadastrada.</p>}
      </aside>
      <form className="glass-panel space-y-5 rounded-3xl p-5 sm:p-7" onSubmit={save}>
        <h2 className="text-xl font-bold text-white">{draft.id ? "Editar temporada" : "Nova temporada"}</h2>
        <label className="block text-sm text-white">Nome *<input className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white" disabled={!canManage || busy} maxLength={160} onChange={(e) => changeLabel(e.target.value)} placeholder="Ex.: Temporada 2026" required value={draft.label} /></label>
        <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm text-white">Ano *<input className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white" disabled={!canManage || busy} max="2100" min="2000" onChange={(e) => setDraft({ ...draft, year: e.target.value })} required type="number" value={draft.year} /></label><label className="block text-sm text-white">Endereço *<input className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white" disabled={!canManage || busy} maxLength={160} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} required value={draft.slug} /></label></div>
        <label className="block text-sm text-white">Resumo<textarea className="mt-2 min-h-32 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white" disabled={!canManage || busy} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} value={draft.summary} /></label>
        <label className="flex items-center gap-3 text-sm text-white"><input checked={draft.isCurrent} disabled={!canManage || busy} onChange={(e) => setDraft({ ...draft, isCurrent: e.target.checked })} type="checkbox" />Temporada atual</label>
        <label className="flex items-center gap-3 text-sm text-white"><input checked={draft.isPublished} disabled={!canManage || busy} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} type="checkbox" />Publicar no site</label>
        {error && <p aria-live="assertive" className="text-sm text-red-200">{error}</p>}{message && <p aria-live="polite" className="text-sm text-acrux-cyan-bright">{message}</p>}
        {canManage ? <div className="flex flex-wrap gap-3"><button className="button-primary" disabled={busy} type="submit">{busy ? "Aguarde…" : "Salvar temporada"}</button>{draft.id && <button className="button-secondary" disabled={busy} onClick={() => void remove()} type="button">Excluir</button>}</div> : <p className="text-sm text-acrux-muted">Seu perfil pode consultar esta seção; alterações exigem administrador.</p>}
      </form>
    </div>
  </AdminWorkspace>;
}

