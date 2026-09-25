"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { useAdminConfirm } from "@/components/admin/admin-confirmation-provider";
import type { AdminSession } from "@/components/admin/admin-gate";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { aboutFromRow, emptyAboutContent, type AboutContent } from "@/features/about/about-model";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TextField = Exclude<keyof AboutContent, "milestones" | "isPublished">;

const detailFields: { key: TextField; label: string; hint: string }[] = [
  { key: "institutionalNote", label: "Apresentação institucional", hint: "Texto ao lado da logo" },
  { key: "mission", label: "Missão", hint: "Objetivo da equipe" },
  { key: "vision", label: "Visão", hint: "Perspectiva para o futuro" },
  { key: "values", label: "Valores", hint: "Princípios da equipe" },
  { key: "robocep", label: "ROBOCEP", hint: "Relação da ACRUX com a ROBOCEP" },
];

const homeFields: { key: TextField; label: string; maxLength: number }[] = [
  { key: "homeHeadline", label: "Título da Home", maxLength: 140 },
  { key: "homeIntroduction", label: "Apresentação da Home", maxLength: 500 },
  { key: "homeHistory", label: "Cartão História", maxLength: 240 },
  { key: "homeMission", label: "Cartão Missão", maxLength: 240 },
  { key: "homeValues", label: "Cartão Valores", maxLength: 240 },
  { key: "homeTrajectory", label: "Cartão Trajetória", maxLength: 240 },
];

export function AboutManager({ session }: { session: AdminSession }) {
  const confirm = useAdminConfirm();
  const [draft, setDraft] = useState<AboutContent>(emptyAboutContent);
  const [baseline, setBaseline] = useState(JSON.stringify(emptyAboutContent));
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const allowNavigation = useRef(false);
  const canManage = session.role === "admin";
  const dirty = canManage && !loading && JSON.stringify(draft) !== baseline;

  useEffect(() => {
    let active = true;
    async function load() {
      const client = createSupabaseBrowserClient();
      if (!client) { setError("Supabase não configurado neste ambiente."); setLoadFailed(true); setLoading(false); return; }
      const { data, error: loadError } = await client.from("about_page").select("*").eq("id", "sobre").maybeSingle();
      if (!active) return;
      if (loadError) { setError("Não foi possível carregar a página Sobre. Confira a migração do banco e tente novamente."); setLoadFailed(true); }
      else {
        const content = data ? aboutFromRow(data) : emptyAboutContent;
        setDraft(content);
        setBaseline(JSON.stringify(content));
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { if (allowNavigation.current) return; event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      event.preventDefault(); event.stopPropagation();
      void confirm({ title: "Sair sem salvar?", description: "As alterações da página Sobre serão descartadas.", confirmLabel: "Descartar e sair", tone: "danger" }).then((accepted) => {
        if (accepted) { allowNavigation.current = true; window.location.assign(destination.href); }
      });
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", navigate, true); };
  }, [dirty, confirm]);

  function updateField(key: TextField, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback("");
  }

  function updateMilestone(index: number, key: "title" | "description", value: string) {
    setDraft((current) => ({ ...current, milestones: current.milestones.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
    setFeedback("");
  }

  function moveMilestone(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const next = [...current.milestones];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, milestones: next };
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || saving || loading || loadFailed) return;
    setError(""); setFeedback("");
    const headline = draft.headline.trim();
    const introduction = draft.introduction.trim();
    const milestones = draft.milestones.map((item) => ({ title: item.title.trim(), description: item.description.trim() }));
    if (draft.isPublished && (!headline || !introduction || milestones.some((item) => !item.title))) {
      setError("Para publicar, informe título, apresentação e título de cada marco.");
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) { setError("Supabase não configurado neste ambiente."); return; }
    setSaving(true);
    const { data, error: saveError } = await client.from("about_page").upsert({
      id: "sobre",
      headline,
      introduction,
      institutional_note: draft.institutionalNote.trim(),
      mission: draft.mission.trim(),
      vision: draft.vision.trim(),
      values_text: draft.values.trim(),
      robocep: draft.robocep.trim(),
      partners_title: draft.partnersTitle.trim(),
      partners_body: draft.partnersBody.trim(),
      home_headline: draft.homeHeadline.trim(),
      home_introduction: draft.homeIntroduction.trim(),
      home_history: draft.homeHistory.trim(),
      home_mission: draft.homeMission.trim(),
      home_values: draft.homeValues.trim(),
      home_trajectory: draft.homeTrajectory.trim(),
      milestones,
      is_published: draft.isPublished,
    }, { onConflict: "id" }).select().single();
    setSaving(false);
    if (saveError || !data) { setError("Não foi possível salvar a página Sobre. Confira seu acesso e tente novamente."); return; }
    const saved = aboutFromRow(data);
    setDraft(saved);
    setBaseline(JSON.stringify(saved));
    setFeedback(saved.isPublished ? "Página Sobre salva e publicada." : "Rascunho da página Sobre salvo.");
  }

  return <AdminWorkspace description="Edite a apresentação institucional, os marcos da trajetória e o bloco de parcerias. A logo oficial permanece inalterada." section="sobre" session={session} title="Editar página Sobre">
    {error ? <p className="mt-7 rounded-2xl border border-red-300/25 bg-red-950/25 p-4 text-sm text-red-100" role="alert">{error}</p> : null}
    {feedback ? <p className="mt-7 rounded-2xl border border-cyan-200/25 bg-cyan-300/8 p-4 text-sm text-acrux-cyan-bright" role="status">{feedback}</p> : null}
    {loading ? <p className="mt-8 text-acrux-muted" aria-live="polite">Carregando conteúdo…</p> : loadFailed ? <p className="mt-6 text-sm text-acrux-muted">O formulário foi bloqueado para evitar sobrescrever conteúdo que não pôde ser carregado. Atualize a página após conferir a conexão.</p> : <form className="mt-9 grid gap-6" onSubmit={(event) => void save(event)}>
      <section className="glass-panel rounded-3xl p-5 sm:p-7">
        <h2 className="text-xl font-bold text-white">Apresentação na Home</h2>
        <p className="mt-2 text-sm text-acrux-muted">Edite o bloco “Constelação em movimento” da página inicial. Campos vazios exibem textos provisórios; só o conteúdo publicado aparece para visitantes.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {homeFields.map((field) => <label className="grid gap-2 text-sm font-bold text-white" key={field.key}>{field.label}<textarea className="admin-input min-h-24 resize-y" maxLength={field.maxLength} onChange={(event) => updateField(field.key, event.target.value)} value={draft[field.key]} /></label>)}
        </div>
      </section>
      <section className="glass-panel rounded-3xl p-5 sm:p-7">
        <h2 className="text-xl font-bold text-white">Apresentação</h2>
        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 text-sm font-bold text-white">Título principal<input className="admin-input" maxLength={140} onChange={(event) => updateField("headline", event.target.value)} placeholder="Título da página Sobre" value={draft.headline} /></label>
          <label className="grid gap-2 text-sm font-bold text-white">Texto de abertura<textarea className="admin-input min-h-30 resize-y" maxLength={1200} onChange={(event) => updateField("introduction", event.target.value)} placeholder="Apresente a história da ACRUX com informações oficiais" value={draft.introduction} /></label>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-5 sm:p-7">
        <h2 className="text-xl font-bold text-white">Informações oficiais</h2>
        <p className="mt-2 text-sm text-acrux-muted">Os campos vazios aparecem como “Em preparação” no site.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {detailFields.map((field) => <label className="grid gap-2 text-sm font-bold text-white" key={field.key}>{field.label}<span className="text-xs font-normal text-acrux-muted">{field.hint}</span><textarea className="admin-input min-h-28 resize-y" maxLength={1400} onChange={(event) => updateField(field.key, event.target.value)} value={draft[field.key]} /></label>)}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-white">Trajetória</h2><p className="mt-2 text-sm text-acrux-muted">Adicione até 12 marcos e ajuste a ordem de exibição.</p></div><button className="button-secondary" disabled={draft.milestones.length >= 12} onClick={() => setDraft((current) => ({ ...current, milestones: [...current.milestones, { title: "", description: "" }] }))} type="button">Adicionar marco</button></div>
        {draft.milestones.length === 0 ? <p className="mt-5 text-sm text-acrux-muted">Nenhum marco cadastrado.</p> : null}
        <div className="mt-5 grid gap-4">{draft.milestones.map((item, index) => <div className="rounded-2xl border border-white/10 bg-acrux-navy/40 p-4" key={index}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-white">Marco {String(index + 1).padStart(2, "0")}</h3><div className="flex gap-2"><button aria-label={`Mover marco ${index + 1} para cima`} className="button-secondary min-h-9 px-3" disabled={index === 0} onClick={() => moveMilestone(index, -1)} type="button">↑</button><button aria-label={`Mover marco ${index + 1} para baixo`} className="button-secondary min-h-9 px-3" disabled={index === draft.milestones.length - 1} onClick={() => moveMilestone(index, 1)} type="button">↓</button><button className="rounded-xl border border-red-200/25 px-3 py-2 text-sm font-bold text-red-100 hover:border-red-200/50" onClick={() => setDraft((current) => ({ ...current, milestones: current.milestones.filter((_, itemIndex) => itemIndex !== index) }))} type="button">Remover</button></div></div>
          <div className="grid gap-4"><label className="grid gap-2 text-sm font-bold text-white">Título<input className="admin-input" maxLength={120} onChange={(event) => updateMilestone(index, "title", event.target.value)} value={item.title} /></label><label className="grid gap-2 text-sm font-bold text-white">Descrição<textarea className="admin-input min-h-24 resize-y" maxLength={1000} onChange={(event) => updateMilestone(index, "description", event.target.value)} value={item.description} /></label></div>
        </div>)}</div>
      </section>

      <section className="glass-panel rounded-3xl p-5 sm:p-7"><h2 className="text-xl font-bold text-white">Parcerias</h2><div className="mt-5 grid gap-5"><label className="grid gap-2 text-sm font-bold text-white">Título<input className="admin-input" maxLength={140} onChange={(event) => updateField("partnersTitle", event.target.value)} value={draft.partnersTitle} /></label><label className="grid gap-2 text-sm font-bold text-white">Texto<textarea className="admin-input min-h-24 resize-y" maxLength={1200} onChange={(event) => updateField("partnersBody", event.target.value)} value={draft.partnersBody} /></label></div></section>

      <div className="glass-panel flex flex-col gap-5 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><label className="flex items-center gap-3 text-sm font-bold text-white"><input checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} type="checkbox" />Publicar página no site</label><div className="flex flex-wrap items-center gap-3"><Link className="button-secondary" href="/sobre">Ver página</Link><button className="button-primary" disabled={saving || !canManage} type="submit">{saving ? "Salvando…" : "Salvar página Sobre"}</button></div></div>
    </form>}
  </AdminWorkspace>;
}

