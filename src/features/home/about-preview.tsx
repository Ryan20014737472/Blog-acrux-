"use client";

import { useEffect, useState } from "react";

import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { ArrowLink } from "@/components/ui/arrow-link";
import { aboutFromRow, emptyAboutContent, type AboutContent } from "@/features/about/about-model";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const pending = "Conteúdo oficial será adicionado posteriormente.";

export function AboutPreview() {
  const [content, setContent] = useState<AboutContent>(emptyAboutContent);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    let active = true;
    void client.from("about_page").select("*").eq("id", "sobre").eq("is_published", true).maybeSingle()
      .then(({ data }) => { if (active && data) setContent(aboutFromRow(data)); });
    return () => { active = false; };
  }, []);

  const cards = [
    ["História", content.homeHistory],
    ["Missão", content.homeMission],
    ["Valores", content.homeValues],
    ["Trajetória", content.homeTrajectory],
  ] as const;

  return <section className="section scroll-mt-24" id="sobre-acrux">
    <div className="shell grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <ScrollReveal>
        <div>
          <p className="eyebrow">Constelação em movimento</p>
          <h2 className="section-heading mt-4 whitespace-pre-line">{content.homeHeadline || "Uma equipe que conecta pessoas, ideias e tecnologia."}</h2>
          <p className="body-copy mt-6 whitespace-pre-line">{content.homeIntroduction || "A ACRUX ROBOCEP terá aqui seu espaço para compartilhar a própria história, propósito, aprendizado e impacto. O texto institucional completo será adicionado pela equipe."}</p>
          <ArrowLink className="mt-8" href="/sobre" variant="secondary">Conheça a ACRUX</ArrowLink>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.12}>
        <div className="glass-panel panel-grid relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <div aria-hidden="true" className="absolute -right-18 -top-18 h-48 w-48 rounded-full border border-cyan-200/13" />
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 480 330">
            <path className="constellation-line" d="M55 236 L133 158 L224 208 L302 95 L405 148" />
            <path className="constellation-line" d="M133 158 L201 82 L302 95" />
            {[[55, 236], [133, 158], [224, 208], [302, 95], [405, 148], [201, 82]].map(([cx, cy]) => <circle cx={cx} cy={cy} fill="#4BD4E8" key={`${cx}-${cy}`} r="3" />)}
          </svg>
          <div className="relative grid gap-4 sm:grid-cols-2">
            {cards.map(([title, body]) => <div className="rounded-2xl border border-white/10 bg-[#020817]/46 p-4" key={title}>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-acrux-muted">{body || pending}</p>
            </div>)}
          </div>
        </div>
      </ScrollReveal>
    </div>
  </section>;
}

