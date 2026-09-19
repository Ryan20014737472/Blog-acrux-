"use client";

import { useEffect, useMemo, useState } from "react";

import { ArrowLink } from "@/components/ui/arrow-link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Competition = Database["public"]["Tables"]["competitions"]["Row"];

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function CompetitionDate({ value }: { value: string | null }) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return <time dateTime={date.toISOString()}>{dateFormatter.format(date)}</time>;
}

export function CompetitionsIndex() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [query, setQuery] = useState("");
  const [organization, setOrganization] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCompetitions() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          if (active) setLoadError("O histórico de competições ainda não está conectado ao acervo da equipe.");
          return;
        }

        // Explicit publication filtering also applies to signed-in administrators.
        const { data, error } = await supabase
          .from("competitions")
          .select("*")
          .eq("is_published", true)
          .order("starts_at", { ascending: false, nullsFirst: false })
          .order("event_name");

        if (error) throw error;
        if (active) setCompetitions(data ?? []);
      } catch {
        if (active) setLoadError("Não foi possível carregar as competições agora. Tente novamente.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCompetitions();
    return () => { active = false; };
  }, [loadAttempt]);

  const organizations = useMemo(() => Array.from(new Set([
    "FTC", "TBR", "OBR",
    ...competitions.map((competition) => competition.organization).filter((value): value is string => Boolean(value)),
  ])), [competitions]);

  const filteredCompetitions = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    return competitions.filter((competition) => {
      if (organization !== null && competition.organization !== organization) return false;
      const searchable = normalizeSearch([
        competition.event_name, competition.organization, competition.location, competition.result,
      ].join(" "));
      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [competitions, organization, query]);

  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Competições</p>
        <h1 className="display-heading mt-5">Cada participação, uma história.</h1>
        <p className="body-copy mt-6">Acompanhe os eventos, resultados e relatos publicados pela equipe ACRUX.</p>

        {!isLoading && !loadError && competitions.length > 0 ? (
          <section aria-label="Busca e filtros de competições" className="glass-panel mt-10 rounded-3xl p-5 sm:p-7">
            <label className="block text-sm font-bold text-white" htmlFor="competition-search">Pesquisar competições</label>
            <input
              className="admin-input mt-3"
              id="competition-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por evento, local ou resultado"
              type="search"
              value={query}
            />
            <div aria-label="Filtrar por organização" className="mt-5 flex flex-wrap gap-2" role="group">
              {[null, ...organizations].map((value) => (
                <button
                  aria-pressed={organization === value}
                  className={organization === value
                    ? "rounded-full border border-cyan-200/36 bg-cyan-300/13 px-3 py-2 text-sm font-bold text-acrux-cyan-bright"
                    : "rounded-full border border-white/12 bg-white/3 px-3 py-2 text-sm font-bold text-acrux-muted transition-colors hover:border-cyan-200/28 hover:text-white"}
                  key={value === null ? "all-organizations" : `organization-${value}`}
                  onClick={() => setOrganization(value)}
                  type="button"
                >
                  {value ?? "Todas"}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div aria-live="polite" aria-atomic="true" className="mt-8 text-sm text-acrux-muted" role="status">
          {isLoading ? "Carregando competições…" : !loadError && competitions.length > 0
            ? `${filteredCompetitions.length} ${filteredCompetitions.length === 1 ? "competição encontrada" : "competições encontradas"}.`
            : null}
        </div>

        {loadError ? (
          <div className="mt-6 rounded-3xl border border-red-300/20 bg-red-950/22 p-6" role="alert">
            <p className="text-red-100">{loadError}</p>
            <button className="button-secondary mt-5" onClick={() => setLoadAttempt((attempt) => attempt + 1)} type="button">Tentar novamente</button>
          </div>
        ) : null}

        {!isLoading && !loadError && competitions.length === 0 ? (
          <div className="glass-panel mt-6 rounded-3xl p-7">
            <h2 className="text-xl font-bold text-white">Nosso histórico será publicado aqui.</h2>
            <p className="mt-3 text-sm leading-6 text-acrux-muted">A equipe ainda não publicou competições. Novas participações aparecerão neste espaço.</p>
          </div>
        ) : null}

        {!isLoading && !loadError && competitions.length > 0 && filteredCompetitions.length === 0 ? (
          <div className="glass-panel mt-6 rounded-3xl p-7">
            <h2 className="text-xl font-bold text-white">Nenhuma competição corresponde à busca.</h2>
            <p className="mt-3 text-sm leading-6 text-acrux-muted">Tente outro termo ou selecione outra organização.</p>
            <button className="button-secondary mt-5" onClick={() => { setQuery(""); setOrganization(null); }} type="button">Limpar filtros</button>
          </div>
        ) : null}

        {!isLoading && !loadError && filteredCompetitions.length > 0 ? (
          <section aria-label="Participações publicadas" className="mt-6 grid items-start gap-6 lg:grid-cols-2">
            {filteredCompetitions.map((competition) => {
              const awards = Array.isArray(competition.awards)
                ? competition.awards.filter((award): award is string => typeof award === "string" && award.trim().length > 0)
                : [];

              return (
                <article className="glass-panel min-w-0 break-words rounded-3xl p-6 sm:p-8" key={competition.id}>
                  {competition.organization ? <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">{competition.organization}</p> : null}
                  <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white">{competition.event_name}</h2>
                  <dl className="mt-5 space-y-4 text-sm leading-6">
                    {competition.location ? <div><dt className="font-bold text-white">Local</dt><dd className="text-acrux-muted">{competition.location}</dd></div> : null}
                    {competition.starts_at || competition.ends_at ? (
                      <div>
                        <dt className="font-bold text-white">Datas <span className="font-normal text-acrux-muted">· horário de Brasília</span></dt>
                        <dd className="text-acrux-muted">
                          {competition.starts_at ? <p>Início: <CompetitionDate value={competition.starts_at} /></p> : null}
                          {competition.ends_at ? <p>Encerramento: <CompetitionDate value={competition.ends_at} /></p> : null}
                        </dd>
                      </div>
                    ) : null}
                    {competition.result ? <div><dt className="font-bold text-white">Resultado</dt><dd className="whitespace-pre-wrap text-acrux-muted">{competition.result}</dd></div> : null}
                  </dl>
                  {awards.length > 0 ? (
                    <div className="mt-6 border-t border-white/10 pt-5">
                      <h3 className="text-sm font-bold text-white">Premiações</h3>
                      <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-acrux-muted marker:text-acrux-yellow">
                        {awards.map((award, index) => <li key={`${index}-${award}`}>{award}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {competition.report ? (
                    <details className="mt-6 border-t border-white/10 pt-5">
                      <summary className="cursor-pointer text-sm font-bold text-acrux-cyan-bright">Relato da participação</summary>
                      <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-acrux-muted">{competition.report}</div>
                    </details>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : null}

        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}

