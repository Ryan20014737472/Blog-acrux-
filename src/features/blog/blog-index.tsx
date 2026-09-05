"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

import { ArrowLink } from "@/components/ui/arrow-link";

const categories = ["Todos", "Notícias", "Competições", "Bastidores", "Projetos", "Robôs", "Equipe", "Eventos"] as const;

export function BlogIndex() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("Todos");
  const [query, setQuery] = useState("");
  const reduceMotion = useReducedMotion();

  const emptyStateText = useMemo(() => {
    if (query.trim()) {
      return `Nenhuma postagem encontrada para “${query.trim()}”.`;
    }

    if (activeCategory !== "Todos") {
      return `Ainda não há postagens publicadas em ${activeCategory}.`;
    }

    return "Ainda não há postagens publicadas.";
  }, [activeCategory, query]);

  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Blog oficial</p>
        <h1 className="display-heading mt-5">As histórias da ACRUX, em um só arquivo.</h1>
        <p className="body-copy mt-6">A estrutura do blog está preparada para notícias, competições, bastidores, projetos, robôs, equipe e eventos.</p>

        <section aria-label="Busca e filtros do blog" className="glass-panel mt-10 rounded-3xl p-5 sm:p-7">
          <label className="block text-sm font-bold text-white" htmlFor="post-search">Pesquisar no blog</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              className="min-h-12 w-full rounded-xl border border-white/12 bg-[#020817]/58 px-4 text-base text-white placeholder:text-acrux-muted/70"
              id="post-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar quando os posts forem publicados"
              type="search"
              value={query}
            />
            <button className="button-primary shrink-0" type="button">Pesquisar</button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {categories.map((category) => (
              <motion.button
                aria-pressed={activeCategory === category}
                className={activeCategory === category ? "rounded-full border border-cyan-200/36 bg-cyan-300/13 px-3 py-2 text-sm font-bold text-acrux-cyan-bright" : "rounded-full border border-white/12 bg-white/3 px-3 py-2 text-sm font-bold text-acrux-muted transition-colors hover:border-cyan-200/28 hover:text-white"}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]" aria-label="Postagens">
          <article className="glass-panel panel-grid min-h-86 rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Postagem em destaque</p>
            <div className="mt-8 flex h-full flex-col justify-end">
              <p className="text-3xl font-bold tracking-[-0.05em] text-white">A primeira postagem aparecerá aqui.</p>
              <p className="mt-4 max-w-lg text-base leading-7 text-acrux-muted">Título, descrição, imagem de capa, autor, data, categoria, tags, galeria, vídeo e status já fazem parte da modelagem prevista.</p>
            </div>
          </article>
          <article className="glass-panel rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Posts recentes</p>
            <div aria-live="polite" className="mt-6 rounded-2xl border border-dashed border-cyan-200/18 bg-[#020817]/38 p-5">
              <p className="font-bold text-white">{emptyStateText}</p>
              <p className="mt-3 text-sm leading-6 text-acrux-muted">Conteúdo da equipe será adicionado posteriormente pelo painel administrativo.</p>
            </div>
          </article>
        </section>

        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}

