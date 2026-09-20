"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { editableSpecifications, isTextList, type RobotRow } from "@/features/admin/robot-form-model";
import type { SeasonOption } from "@/features/admin/competition-form-model";

export function RobotsIndex() {
  const [robots, setRobots] = useState<(RobotRow & { image: string | null })[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [query, setQuery] = useState("");
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
        const rows: RobotRow[] = [];
        for (let offset = 0; ; offset += 500) {
          const result = await client.from("robots").select("*").eq("is_published", true).order("name").order("id").range(offset, offset + 499);
          if (result.error) throw result.error;
          rows.push(...result.data);
          if (result.data.length < 500) break;
        }
        const seasonResult = await client.from("seasons").select("id, label, year").eq("is_published", true).order("year", { ascending: false });
        if (seasonResult.error) throw seasonResult.error;
        if (active) { setRobots(rows.map((row) => ({ ...row, image: getPublicImageUrl(client, "robots", row.cover_path) }))); setSeasons(seasonResult.data); }
      } catch { if (active) setError("Não foi possível carregar os robôs. Tente novamente."); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [attempt]);
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visible = robots.filter((robot) => normalized(`${robot.name} ${robot.description ?? ""}`).includes(normalized(query.trim())) && (!season || robot.season_id === season));
  return <main className="section pt-34"><div className="shell">
    <p className="eyebrow">Robôs</p><h1 className="display-heading mt-5">Engenharia que ganha forma.</h1><p className="body-copy mt-6">Conheça as criações da ACRUX e os detalhes de cada robô.</p>
    {robots.length ? <div className="glass-panel mt-10 grid gap-4 rounded-3xl p-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Buscar robô<input className="admin-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="grid gap-2 text-sm font-bold">Temporada<select className="admin-input" value={season} onChange={(event) => setSeason(event.target.value)}><option value="">Todas</option>{seasons.filter((item) => robots.some((robot) => robot.season_id === item.id)).map((item) => <option value={item.id} key={item.id}>{item.label} ({item.year})</option>)}</select></label></div> : null}
    {loading ? <p role="status" className="mt-8 text-acrux-muted">Carregando robôs…</p> : null}
    {error ? <div role="alert" className="mt-8 rounded-3xl border border-red-200/20 p-6"><p>{error}</p><button type="button" className="button-secondary mt-4" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></div> : null}
    {!loading && !error && !visible.length ? <p role="status" className="glass-panel mt-8 rounded-3xl p-7 text-acrux-muted">{robots.length ? "Nenhum robô corresponde aos filtros." : "Os robôs da equipe serão apresentados aqui assim que forem publicados."}</p> : null}
    {!loading && !error ? <section aria-label="Robôs publicados" className="mt-8 grid items-start gap-6 lg:grid-cols-2">{visible.map((robot) => <article className="glass-panel min-w-0 overflow-hidden rounded-3xl" key={robot.id}>
      {robot.image ? <Image src={robot.image} alt={`Robô ${robot.name}`} width={1000} height={750} unoptimized className="aspect-[4/3] w-full bg-acrux-navy object-contain" /> : <div className="flex aspect-[4/3] items-center justify-center bg-acrux-blue/20 text-sm text-acrux-muted">Foto ainda não adicionada</div>}
      <div className="p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-acrux-cyan-bright">{seasons.find((item) => item.id === robot.season_id)?.label ?? "ACRUX ROBOCEP"}</p><h2 className="mt-3 break-words text-3xl font-bold">{robot.name}</h2>{robot.description ? <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-acrux-muted">{robot.description}</p> : null}
        <details className="mt-6 border-t border-white/10 pt-5"><summary className="cursor-pointer font-bold text-acrux-cyan-bright">Ficha técnica</summary>
          {(["mechanisms", "components"] as const).map((key) => isTextList(robot[key]) && robot[key].length ? <div className="mt-5" key={key}><h3 className="font-bold">{key === "mechanisms" ? "Mecanismos" : "Componentes"}</h3><ul className="mt-2 list-inside list-disc space-y-2 break-words text-sm text-acrux-muted">{robot[key].map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null)}
          {editableSpecifications(robot.specifications) && Object.keys(robot.specifications).length ? <dl className="mt-5 grid gap-3">{Object.entries(robot.specifications).map(([key, value]) => <div className="min-w-0 break-words text-sm" key={key}><dt className="font-bold">{key}</dt><dd className="text-acrux-muted">{String(value)}</dd></div>)}</dl> : null}
          {isTextList(robot.mechanisms) && !robot.mechanisms.length && isTextList(robot.components) && !robot.components.length && editableSpecifications(robot.specifications) && !Object.keys(robot.specifications).length ? <p className="mt-4 text-sm text-acrux-muted">Detalhes técnicos ainda não adicionados.</p> : null}
        </details>
      </div>
    </article>)}</section> : null}
  </div></main>;
}

