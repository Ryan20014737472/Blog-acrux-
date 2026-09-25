"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminSession } from "@/components/admin/admin-gate";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { useAdminConfirm } from "@/components/admin/admin-confirmation-provider";
import { CompetitionForm } from "@/features/admin/competition-form";
import { CompetitionRelations } from "@/features/admin/competition-relations";
import { competitionError, competitionToDraft, emptyCompetitionDraft, parseCompetitionDraft, type CompetitionDraft, type CompetitionRow, type SeasonOption } from "@/features/admin/competition-form-model";
import { slugify } from "@/lib/content/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function CompetitionsManager({ session }: { session: AdminSession }) {
  const confirm = useAdminConfirm();
  const [competitions, setCompetitions] = useState<CompetitionRow[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [draft, setDraft] = useState(emptyCompetitionDraft);
  const [savedDraft, setSavedDraft] = useState(() => JSON.stringify(emptyCompetitionDraft()));
  const [version, setVersion] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [relatedBusy, setRelatedBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [seasonWarning, setSeasonWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState("");
  const active = useRef(false);
  const allowNavigation = useRef(false);
  const mutation = useRef(false);
  const loadSequence = useRef(0);
  const canManage = session.role === "admin";
  const busy = saving || relatedBusy;
  const dirty = canManage && JSON.stringify(draft) !== savedDraft;

  const loadData = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError(null);
    setSeasonWarning(null);
    try {
      const client = createSupabaseBrowserClient();
      if (!client) throw new Error("Supabase indisponível");
      // Load every page rather than silently truncating Supabase's default limit.
      const records: CompetitionRow[] = [];
      for (let offset = 0; ; offset += 500) {
        const result = await client.from("competitions").select("*").order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
        if (result.error) throw result.error;
        if (!active.current || sequence !== loadSequence.current) return;
        records.push(...result.data);
        if (result.data.length < 500) break;
      }
      setCompetitions(records);
      const result = await client.from("seasons").select("id, label, year").order("year", { ascending: false });
      if (!active.current || sequence !== loadSequence.current) return;
      if (result.error) setSeasonWarning("Não foi possível carregar as temporadas. O vínculo atual será preservado; tente atualizar a lista.");
      else setSeasons(result.data);
    } catch {
      if (active.current && sequence === loadSequence.current) setLoadError("Não foi possível carregar as competições. Confira sua conexão e tente novamente.");
    } finally {
      if (active.current && sequence === loadSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    active.current = true;
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    void loadData();
    return () => { active.current = false; loadSequence.current += 1; };
  }, [loadData]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { if (allowNavigation.current) return; event.preventDefault(); event.returnValue = ""; };
    const warnBeforeNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      event.preventDefault();
      event.stopPropagation();
      void confirm({ title: "Sair sem salvar?", description: "As alterações desta competição serão descartadas.", confirmLabel: "Descartar e sair", tone: "danger" }).then((accepted) => {
        if (accepted) { allowNavigation.current = true; window.location.assign(destination.href); }
      });
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", warnBeforeNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", warnBeforeNavigation, true);
    };
  }, [dirty, confirm]);

  async function selectCompetition(row: CompetitionRow | null) {
    if (busy || (dirty && !await confirm({ title: "Descartar alterações?", description: "As alterações não salvas desta competição serão perdidas.", confirmLabel: "Descartar alterações", tone: "danger" }))) return;
    const next = row ? competitionToDraft(row) : emptyCompetitionDraft();
    setDraft(next);
    setSavedDraft(JSON.stringify(next));
    setVersion(row?.updated_at ?? null);
    setError(null);
    setFeedback(null);
  }

  function updateName(eventName: string) {
    setDraft((current) => ({ ...current, eventName, slug: !current.id && current.slug === slugify(current.eventName) ? slugify(eventName) : current.slug }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || busy || mutation.current) return;
    setError(null);
    setFeedback(null);
    const parsed = parseCompetitionDraft({ ...draft, slug: slugify(draft.slug) });
    if (!parsed.ok) { setError(parsed.message); return; }
    mutation.current = true;
    setSaving(true);
    try {
      const client = createSupabaseBrowserClient();
      if (!client) throw new Error("Supabase indisponível");
      const result = draft.id
        ? await client.from("competitions").update(parsed.payload).eq("id", draft.id).eq("updated_at", version ?? "").select().single()
        : await client.from("competitions").insert(parsed.payload).select().single();
      if (result.error || !result.data) throw result.error;
      if (!active.current) return;
      const next = competitionToDraft(result.data);
      setDraft(next);
      setSavedDraft(JSON.stringify(next));
      setVersion(result.data.updated_at);
      setCompetitions((current) => [result.data, ...current.filter((row) => row.id !== result.data.id)]);
      setFeedback(result.data.is_published ? "Competição salva e publicada no site." : "Competição salva como rascunho.");
    } catch (cause) {
      if (active.current) setError(competitionError(cause, "Não foi possível salvar. Seus campos foram mantidos; confira a conexão e tente novamente."));
    } finally {
      mutation.current = false;
      if (active.current) setSaving(false);
    }
  }

  async function remove() {
    if (!canManage || !draft.id || busy || mutation.current) return;
    if (!await confirm({ title: `Excluir a competição “${draft.eventName}”?`, description: "Ela sairá do site e os vínculos de participantes serão removidos. As fotos e os integrantes serão preservados. Esta exclusão não pode ser desfeita.", confirmLabel: "Excluir competição", tone: "danger" })) return;
    mutation.current = true;
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const client = createSupabaseBrowserClient();
      if (!client) throw new Error("Supabase indisponível");
      const result = await client.from("competitions").delete().eq("id", draft.id).eq("updated_at", version ?? "").select("id").single();
      if (result.error || !result.data) throw result.error;
      if (!active.current) return;
      setCompetitions((current) => current.filter((row) => row.id !== result.data.id));
      const next = emptyCompetitionDraft();
      setDraft(next);
      setSavedDraft(JSON.stringify(next));
      setVersion(null);
      setFeedback("Competição excluída. As fotos e os integrantes foram preservados.");
    } catch (cause) {
      if (active.current) setError(competitionError(cause, "Não foi possível excluir. Confira a conexão e tente novamente."));
    } finally {
      mutation.current = false;
      if (active.current) setSaving(false);
    }
  }

  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filtered = competitions.filter((row) => normalize(`${row.event_name} ${row.organization ?? ""} ${row.location ?? ""}`).includes(normalize(search.trim())) && (status === "all" || row.is_published === (status === "published")));

  return (
    <AdminWorkspace description="Registre participações oficiais, organize resultados e escolha o que publicar no site." section="competicoes" session={session} title="Gerenciar competições">
      <div className="mt-6 flex flex-wrap gap-3"><Link className="button-secondary" href="/competicoes" rel="noopener noreferrer" target="_blank">Ver página pública ↗</Link></div>
      <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="glass-panel h-fit min-w-0 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Competições</h2>{canManage ? <button className="button-secondary disabled:opacity-50" disabled={busy || loading || !!loadError} onClick={() => selectCompetition(null)} type="button">Nova competição</button> : null}</div>
          <label className="mt-5 grid gap-2 text-sm font-bold" htmlFor="competitions-search">Buscar competição<input className="admin-input" id="competitions-search" onChange={(event) => setSearch(event.target.value)} placeholder="Evento, categoria ou local" type="search" value={search} /></label>
          <label className="mt-4 grid gap-2 text-sm font-bold" htmlFor="competitions-status">Status<select className="admin-input" id="competitions-status" onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">Todos</option><option value="draft">Rascunhos</option><option value="published">Publicados</option></select></label>
          <button className="mt-4 min-h-11 text-sm font-bold text-acrux-cyan-bright disabled:opacity-50" disabled={loading || busy} onClick={() => void loadData()} type="button">{loading ? "Carregando…" : "Atualizar lista"}</button>
          {loadError ? <p className="mt-3 text-sm text-red-100" role="alert">{loadError}</p> : null}
          {seasonWarning ? <p className="mt-3 text-sm text-acrux-muted" role="status">{seasonWarning}</p> : null}
          <p className="mt-3 text-sm text-acrux-muted" role="status">{loading ? "Carregando competições…" : `${filtered.length} de ${competitions.length} competição(ões)`}</p>
          {!loading && !loadError && !filtered.length ? <p className="mt-5 rounded-xl border border-dashed border-white/20 p-4 text-sm text-acrux-muted">{competitions.length ? "Nenhuma competição corresponde aos filtros." : "Nenhuma competição cadastrada ainda."}</p> : null}
          <div className="mt-4 grid gap-3">{filtered.map((row) => <button aria-pressed={draft.id === row.id} className={`min-w-0 rounded-2xl border p-4 text-left disabled:opacity-50 ${draft.id === row.id ? "border-cyan-200/35 bg-cyan-300/10" : "border-white/10 bg-acrux-navy/30 hover:border-cyan-200/25"}`} disabled={busy || loading} key={row.id} onClick={() => selectCompetition(row)} type="button"><span className="block break-words font-bold">{row.event_name}</span><span className="mt-2 block text-xs font-bold text-acrux-cyan-bright">{row.is_published ? "Publicado" : "Rascunho"}</span><span className="mt-2 block break-words text-sm text-acrux-muted">{[row.organization, row.location].filter(Boolean).join(" · ") || "Detalhes ainda não informados"}</span></button>)}</div>
        </aside>
        <div className="grid min-w-0 content-start gap-6">
          {canManage || draft.id ? <CompetitionForm disabled={busy || loading || !!loadError} draft={draft} error={error} feedback={feedback} onChange={(next: CompetitionDraft) => { setDraft(next); setFeedback(null); }} onDelete={() => void remove()} onNameChange={updateName} onSubmit={save} readOnly={!canManage} seasons={seasons} timeZone={timeZone} /> : <div className="glass-panel rounded-3xl p-6"><h2 className="text-xl font-bold">Acesso de leitura</h2><p className="mt-3 text-acrux-muted">Selecione uma competição para consultar seus dados. Somente administradores podem cadastrar, editar ou excluir eventos.</p></div>}
          {draft.id ? <CompetitionRelations canManage={canManage} competitionId={draft.id} disabled={saving} key={draft.id} onBusyChange={setRelatedBusy} /> : canManage ? <p className="text-sm text-acrux-muted">Salve a competição para associar integrantes e álbuns de fotos.</p> : null}
        </div>
      </div>
    </AdminWorkspace>
  );
}
