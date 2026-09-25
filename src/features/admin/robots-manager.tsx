"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AdminSession } from "@/components/admin/admin-gate";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { useAdminConfirm } from "@/components/admin/admin-confirmation-provider";
import { emptyRobot, robotToDraft, robotPayload, type RobotRow, type RobotDraft } from "@/features/admin/robot-form-model";
import { RobotForm } from "@/features/admin/robot-form";
import { RobotMembers } from "@/features/admin/robot-members";
import type { SeasonOption } from "@/features/admin/competition-form-model";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl, uploadPublicImage, validateImageFile } from "@/lib/supabase/storage";
import { slugify } from "@/lib/content/slug";

export function RobotsManager({ session }: { session: AdminSession }) {
  const confirm = useAdminConfirm();
  const [rows, setRows] = useState<RobotRow[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [selected, setSelected] = useState<RobotRow | null>(null);
  const [draft, setDraft] = useState(emptyRobot);
  const [baseline, setBaseline] = useState(() => JSON.stringify(emptyRobot()));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [relationsBusy, setRelationsBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(false);
  const allowNavigation = useRef(false);
  const lock = useRef(false);
  const canManage = session.role === "admin";
  const busy = saving || relationsBusy;
  const dirty = canManage && (file !== null || JSON.stringify(draft) !== baseline);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError("");
    async function load() {
      try {
        const client = createSupabaseBrowserClient();
        if (!client) throw new Error();
        const all: RobotRow[] = [];
        for (let offset = 0; ; offset += 500) {
          const result = await client.from("robots").select("*").order("name").order("id").range(offset, offset + 499);
          if (result.error) throw result.error;
          all.push(...result.data);
          if (result.data.length < 500) break;
        }
        const result = await client.from("seasons").select("id, label, year").order("year", { ascending: false });
        if (result.error) throw result.error;
        if (active) { setRows(all); setSeasons(result.data); }
      } catch { if (active) setLoadError("Não foi possível carregar os robôs e temporadas. Tente novamente."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    if (file) { const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }
    const client = createSupabaseBrowserClient();
    setPreview(client ? getPublicImageUrl(client, "robots", draft.coverPath) : null);
  }, [file, draft.coverPath]);

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { if (allowNavigation.current) return; event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      event.preventDefault(); event.stopPropagation();
      void confirm({ title: "Sair sem salvar?", description: "As alterações deste robô serão descartadas.", confirmLabel: "Descartar e sair", tone: "danger" }).then((accepted) => {
        if (accepted) { allowNavigation.current = true; window.location.assign(url.href); }
      });
    };
    window.addEventListener("beforeunload", unload); document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty, confirm]);

  async function select(row: RobotRow | null) {
    if (busy || (dirty && !await confirm({ title: "Descartar alterações?", description: "As alterações não salvas deste robô serão perdidas.", confirmLabel: "Descartar alterações", tone: "danger" }))) return;
    const next = row ? robotToDraft(row) : emptyRobot();
    setSelected(row); setDraft(next); setBaseline(JSON.stringify(next)); setFile(null); setError(""); setMessage("");
  }
  function change(next: RobotDraft) { setDraft(next); setMessage(""); }
  function chooseFile(next: File | null) {
    if (!next) return;
    const validation = validateImageFile(next);
    if (validation) { setError(validation); return; }
    setError(""); setMessage(""); setFile(next);
  }
  function failure(cause: unknown) {
    const code = cause && typeof cause === "object" && "code" in cause ? cause.code : null;
    if (code === "23505") return "Este identificador já está em uso. Escolha outro.";
    if (code === "PGRST116") return "O robô foi alterado ou removido por outra pessoa. Atualize a lista e selecione o registro novamente.";
    if (code === "42501") return "Sua conta não tem permissão para esta alteração.";
    if (code === "23503") return "A temporada não está mais disponível. Atualize a lista.";
    return cause instanceof Error ? cause.message : "Não foi possível salvar. Os campos foram preservados; confira a conexão e tente novamente.";
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || busy || lock.current) return;
    setError(""); setMessage("");
    let payload;
    try { payload = robotPayload(draft, selected); } catch (cause) { setError(failure(cause)); return; }
    lock.current = true; setSaving(true);
    try {
      const client = createSupabaseBrowserClient();
      if (!client) throw new Error("Conexão indisponível.");
      if (file) {
        payload.cover_path = await uploadPublicImage(client, "robots", "covers", file);
        if (!mounted.current) return;
        setDraft((current) => ({ ...current, coverPath: payload.cover_path ?? null })); setFile(null);
      }
      const result = selected
        ? await client.from("robots").update(payload).eq("id", selected.id).eq("updated_at", selected.updated_at).select().single()
        : await client.from("robots").insert(payload).select().single();
      if (result.error) throw result.error;
      if (!mounted.current) return;
      const next = robotToDraft(result.data);
      setRows((current) => [result.data, ...current.filter((row) => row.id !== result.data.id)]);
      setSelected(result.data); setDraft(next); setBaseline(JSON.stringify(next));
      setMessage(result.data.is_published ? "Robô salvo e publicado no site." : "Robô salvo como rascunho.");
    } catch (cause) { if (mounted.current) setError(failure(cause)); }
    finally { lock.current = false; if (mounted.current) setSaving(false); }
  }
  async function remove() {
    if (!selected || !canManage || busy || lock.current) return;
    if (!await confirm({ title: `Excluir o robô “${selected.name}”?`, description: "Os vínculos com integrantes serão removidos. Os integrantes e arquivos de imagem serão preservados. Esta exclusão não pode ser desfeita.", confirmLabel: "Excluir robô", tone: "danger" })) return;
    lock.current = true; setSaving(true); setError(""); setMessage("");
    try {
      const client = createSupabaseBrowserClient();
      if (!client) throw new Error("Conexão indisponível.");
      const result = await client.from("robots").delete().eq("id", selected.id).eq("updated_at", selected.updated_at).select("id").single();
      if (result.error) throw result.error;
      if (!mounted.current) return;
      setRows((current) => current.filter((row) => row.id !== selected.id));
      const next = emptyRobot(); setSelected(null); setDraft(next); setBaseline(JSON.stringify(next)); setFile(null); setMessage("Robô excluído.");
    } catch (cause) { if (mounted.current) setError(failure(cause)); }
    finally { lock.current = false; if (mounted.current) setSaving(false); }
  }
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visible = rows.filter((row) => normalized(row.name).includes(normalized(search.trim())) && (status === "all" || row.is_published === (status === "published")));
  return <AdminWorkspace section="robos" session={session} title="Gerenciar robôs" description="Organize os robôs da ACRUX, suas fotos e informações técnicas.">
    <Link className="button-secondary mt-6" href="/robos" target="_blank" rel="noopener noreferrer">Ver robôs no site ↗</Link>
    <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[0.7fr_1.3fr]">
      <aside className="glass-panel h-fit min-w-0 rounded-3xl p-5 sm:p-6">
        <h2 className="text-xl font-bold">Robôs cadastrados</h2>
        {canManage ? <button type="button" className="button-secondary mt-4" disabled={busy || loading || !!loadError} onClick={() => select(null)}>Novo robô</button> : <p className="mt-3 text-sm text-acrux-muted">Acesso de leitura. Selecione um robô para consultar.</p>}
        <label className="mt-5 grid gap-2 text-sm font-bold">Buscar robô<input className="admin-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label className="mt-4 grid gap-2 text-sm font-bold">Status<select className="admin-input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="draft">Rascunhos</option><option value="published">Publicados</option></select></label>
        <button className="mt-4 min-h-11 text-sm font-bold text-acrux-cyan-bright" type="button" disabled={busy || loading} onClick={() => setAttempt((value) => value + 1)}>Atualizar lista</button>
        {loadError ? <p role="alert" className="mt-3 text-red-100">{loadError}</p> : null}
        <p role="status" className="mt-3 text-sm text-acrux-muted">{loading ? "Carregando…" : `${visible.length} robô(s) encontrado(s)`}</p>
        {!loading && !loadError && !visible.length ? <p className="mt-4 text-sm text-acrux-muted">{rows.length ? "Nenhum robô corresponde aos filtros." : "Nenhum robô cadastrado ainda."}</p> : null}
        <div className="mt-4 grid gap-3">{visible.map((row) => <button type="button" aria-pressed={selected?.id === row.id} disabled={busy || loading} key={row.id} onClick={() => select(row)} className={`min-w-0 rounded-2xl border p-4 text-left ${selected?.id === row.id ? "border-cyan-200/40 bg-cyan-300/10" : "border-white/10"}`}><span className="block break-words font-bold">{row.name}</span><span className="mt-2 block text-xs text-acrux-cyan-bright">{row.is_published ? "Publicado" : "Rascunho"}</span></button>)}</div>
      </aside>
      <div className="grid min-w-0 content-start gap-6">
        {canManage || selected ? <><RobotForm draft={draft} original={selected} seasons={seasons} disabled={busy || loading || !!loadError} readOnly={!canManage} onChange={change} onNameChange={(name) => change({ ...draft, name, slug: !selected && draft.slug === slugify(draft.name) ? slugify(name) : draft.slug })} onFile={chooseFile} onRemovePhoto={() => { setFile(null); change({ ...draft, coverPath: null }); }} onSubmit={save} onDelete={() => void remove()} error={error} message={message}>
          {preview ? <Image src={preview} alt={`Foto do robô ${draft.name || "em edição"}`} width={800} height={600} unoptimized className="mt-4 max-h-72 w-full rounded-xl bg-acrux-navy object-contain" /> : null}
        </RobotForm>{selected ? <RobotMembers robotId={selected.id} canManage={canManage} disabled={saving} onBusy={setRelationsBusy} key={selected.id} /> : <p className="text-sm text-acrux-muted">Salve o robô para vincular os integrantes responsáveis.</p>}</> : null}
      </div>
    </div>
  </AdminWorkspace>;
}
