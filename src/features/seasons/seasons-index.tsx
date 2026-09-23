"use client";

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Count = { robots: number; projects: number; competitions: number; achievements: number; galleries: number; posts: number };
type Counts = Record<string, Count>;

function addCounts(rows: { season_id: string | null }[] | null, counts: Counts, key: keyof Count) {
  for (const row of rows ?? []) if (row.season_id && counts[row.season_id]) counts[row.season_id][key]++;
}

export function SeasonsIndex() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setLoaded(true); return; }
    void (async () => {
      const result = await supabase.from("seasons").select("*").eq("is_published", true).order("year", { ascending: false }).order("label");
      if (!active) return;
      if (result.error) { setError(true); setLoaded(true); return; }
      const rows = result.data ?? [];
      setSeasons(rows);
      if (rows.length) {
        const next = Object.fromEntries(rows.map((season) => [season.id, { robots: 0, projects: 0, competitions: 0, achievements: 0, galleries: 0, posts: 0 }])) as Counts;
        const [robots, projects, competitions, achievements, galleries, posts] = await Promise.all([
          supabase.from("robots").select("season_id").eq("is_published", true),
          supabase.from("projects").select("season_id").eq("is_published", true),
          supabase.from("competitions").select("season_id").eq("is_published", true),
          supabase.from("achievements").select("season_id").eq("is_published", true),
          supabase.from("galleries").select("season_id").eq("is_published", true),
          supabase.from("posts").select("season_id").eq("status", "published"),
        ]);
        if (!active) return;
        addCounts(robots.data, next, "robots");
        addCounts(projects.data, next, "projects");
        addCounts(competitions.data, next, "competitions");
        addCounts(achievements.data, next, "achievements");
        addCounts(galleries.data, next, "galleries");
        addCounts(posts.data, next, "posts");
        setCounts(next);
      }
      setLoaded(true);
    })();
    return () => { active = false; };
  }, []);

  const contentTypes: { key: keyof Count; label: string }[] = [
    { key: "robots", label: "Robôs" },
    { key: "projects", label: "Projetos" },
    { key: "competitions", label: "Competições" },
    { key: "achievements", label: "Conquistas" },
    { key: "galleries", label: "Galerias" },
    { key: "posts", label: "Posts" },
  ];

  return <main className="section pt-34"><div className="shell">
    <p className="eyebrow">Temporadas</p>
    <h1 className="display-heading mt-5">A história da ACRUX, temporada por temporada.</h1>
    <p className="body-copy mt-6">Cada período publicado reúne os registros oficiais da equipe em um só lugar.</p>
    {!loaded ? <p aria-live="polite" className="mt-10 text-acrux-muted">Carregando temporadas…</p> : error ? <p role="alert" className="mt-10 text-red-200">Não foi possível carregar as temporadas agora. Tente novamente mais tarde.</p> : seasons.length ? <div className="mt-10 grid gap-5 md:grid-cols-2">{seasons.map((season) => <article className="glass-panel card-hover rounded-2xl p-6 sm:p-8" id={season.slug} key={season.id}>
      <div className="flex items-start justify-between gap-4"><p className="eyebrow">{season.year}</p>{season.is_current && <span className="rounded-full border border-cyan-300/30 px-3 py-1 text-xs font-bold text-acrux-cyan-bright">Atual</span>}</div>
      <h2 className="mt-4 text-2xl font-bold text-white">{season.label}</h2>
      {season.summary ? <p className="mt-3 text-sm leading-6 text-acrux-muted">{season.summary}</p> : <p className="mt-3 text-sm leading-6 text-acrux-muted">Resumo desta temporada será adicionado pela equipe.</p>}
      <div className="mt-6 flex flex-wrap gap-2">{contentTypes.map(({ key, label }) => <span className="rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-acrux-muted" key={key}>{label} · {counts[season.id]?.[key] ?? 0}</span>)}</div>
    </article>)}</div> : <div className="glass-panel mt-10 rounded-2xl p-6"><p className="text-acrux-muted">As temporadas serão exibidas aqui quando a equipe publicar seus registros.</p></div>}
  </div></main>;
}

