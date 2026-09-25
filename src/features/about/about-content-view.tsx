"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import acruxLogo from "@/assets/acrux-logo.jpeg";
import { ArrowLink } from "@/components/ui/arrow-link";
import { aboutFromRow, aboutPlaceholder, type AboutContent } from "@/features/about/about-model";
import { AboutTimeline } from "@/features/home/about-timeline";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AboutContentView() {
  const [content, setContent] = useState<AboutContent>(aboutPlaceholder);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    void client.from("about_page").select("*").eq("id", "sobre").eq("is_published", true).maybeSingle()
      .then(({ data }) => { if (data) setContent(aboutFromRow(data)); });
  }, []);

  const details = [
    ["Missão", content.mission],
    ["Visão", content.vision],
    ["Valores", content.values],
    ["ROBOCEP", content.robocep],
  ] as const;

  return <main className="section pt-34">
    <div className="shell grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div>
        <p className="eyebrow">Sobre a ACRUX</p>
        <h1 className="display-heading mt-5">{content.headline || aboutPlaceholder.headline}</h1>
        <p className="body-copy mt-6 whitespace-pre-line">{content.introduction || aboutPlaceholder.introduction}</p>
        <AboutTimeline items={content.milestones} />
        <ArrowLink className="mt-9" href="/temporadas" variant="secondary">Explorar temporadas</ArrowLink>
      </div>

      <div className="glass-panel panel-grid rounded-3xl p-6 sm:p-8">
        <div className="mx-auto max-w-54 overflow-hidden rounded-full ring-1 ring-white/15 shadow-[0_1rem_3rem_rgba(7,155,185,0.22)]">
          <Image alt="Logo oficial da ACRUX ROBOCEP" className="aspect-square w-full object-cover" height={216} sizes="216px" src={acruxLogo} width={216} />
        </div>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Informações oficiais</p>
        <p className="mt-3 whitespace-pre-line text-base leading-7 text-acrux-muted">{content.institutionalNote || "As informações institucionais serão adicionadas pela equipe."}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {details.map(([topic, body]) => <div className="rounded-xl border border-white/10 bg-[#020817]/42 p-4" key={topic}>
            <h2 className="font-bold text-white">{topic}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-acrux-muted">{body || "Em preparação"}</p>
          </div>)}
        </div>
      </div>
    </div>

    <section className="shell mt-18" id="parcerias">
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <p className="eyebrow">Parcerias</p>
        <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-white">{content.partnersTitle || aboutPlaceholder.partnersTitle}</h2>
        <p className="mt-4 max-w-2xl whitespace-pre-line text-acrux-muted">{content.partnersBody || aboutPlaceholder.partnersBody}</p>
      </div>
    </section>
  </main>;
}
