"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { type ProjectRow } from "@/features/admin/project-form-model";
import type { SeasonOption } from "@/features/admin/competition-form-model";

export function ProjectsIndex() {
  const [projects, setProjects] = useState<(ProjectRow & { image: string | null })[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [season, setSeason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    async function load() {
      try {
        const client = createSupabaseBrowserClient();
        if (!client) throw new Error();
        const rows: ProjectRow[] = [];
        for (let offset = 0; ; offset += 500) {
          const result = await client.from("projects").select("*").eq("is_published", true).order("title").order("id").range(offset, offset + 499);
          if (result.error) throw result.error;
          rows.push(...result.data);
          if (result.data.length < 500) break;
        }
        const seasonResult = await client.from("seasons").select("id, label, year").eq("is_published", true).order("year", { ascending: false });
        if (seasonResult.error) throw seasonResult.error;
        if (active) { setProjects(rows.map((row) => ({ ...row, image: getPublicImageUrl(client, "projects", row.cover_path) }))); setSeasons(seasonResult.data); }
      } catch { if (active) setError("Não foi possível carregar os projetos. Tente novamente."); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [attempt]);
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visible = projects.filter((project) => normalized(`${project.title} ${project.category} ${project.description ?? ""}`).includes(normalized(query.trim())) && (!category || project.category === category) && (!season || project.season_id === season));
  return <main className="section pt-34"><div className="shell">
    <p className="eyebrow">Projetos</p><h1 className="display-heading mt-5">Ideias que viram projetos.</h1><p className="body-copy mt-6">Conheça as criações da ACRUX e os detalhes de cada projeto.</p>
    {projects.length ? <div className="glass-panel mt-10 grid gap-4 rounded-3xl p-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Buscar projeto<input className="admin-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="grid gap-2 text-sm font-bold">Temporada<select className="admin-input" value={season} onChange={(event) => setSeason(event.target.value)}><option value="">Todas</option>{seasons.filter((item) => projects.some((project) => project.season_id === item.id)).map((item) => <option value={item.id} key={item.id}>{item.label} ({item.year})</option>)}</select></label></div> : null}
    {projects.length ? <label className="mt-4 grid max-w-md gap-2 text-sm font-bold">Categoria<select className="admin-input" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas</option>{Array.from(new Set(projects.map((project) => project.category))).sort().map((item) => <option key={item} value={item}>{item}</option>)}</select></label> : null}
    {loading ? <p role="status" className="mt-8 text-acrux-muted">Carregando projetos…</p> : null}
    {error ? <div role="alert" className="mt-8 rounded-3xl border border-red-200/20 p-6"><p>{error}</p><button type="button" className="button-secondary mt-4" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></div> : null}
    {!loading && !error && !visible.length ? <p role="status" className="glass-panel mt-8 rounded-3xl p-7 text-acrux-muted">{projects.length ? "Nenhum projeto corresponde aos filtros." : "Os projetos da equipe serão apresentados aqui assim que forem publicados."}</p> : null}
    {!loading && !error ? <section aria-label="Projetos publicados" className="mt-8 grid items-start gap-6 lg:grid-cols-2">{visible.map((project) => <article className="glass-panel min-w-0 overflow-hidden rounded-3xl" key={project.id}>
      {project.image ? <Image src={project.image} alt={`Projeto ${project.title}`} width={1000} height={750} unoptimized className="aspect-[4/3] w-full bg-acrux-navy object-contain" /> : <div className="flex aspect-[4/3] items-center justify-center bg-acrux-blue/20 text-sm text-acrux-muted">Foto ainda não adicionada</div>}
      <div className="p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-acrux-cyan-bright">{seasons.find((item) => item.id === project.season_id)?.label ?? "ACRUX ROBOCEP"}</p><h2 className="mt-3 break-words text-3xl font-bold">{project.title}</h2>{project.description ? <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-acrux-muted">{project.description}</p> : null}
        <p className="mt-4 text-sm font-bold text-acrux-cyan-bright">{project.category}</p>
        {project.body ? <details className="mt-6 border-t border-white/10 pt-5"><summary className="cursor-pointer font-bold text-acrux-cyan-bright">Conheça o projeto</summary><div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-acrux-muted">{project.body}</div></details> : null}
      </div>
    </article>)}</section> : null}
  </div></main>;
}

