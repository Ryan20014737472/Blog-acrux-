import Image from "next/image";

import { AboutTimeline } from "@/features/home/about-timeline";
import { ArrowLink } from "@/components/ui/arrow-link";

export const metadata = {
  title: "Sobre",
  description: "Conheça a história, propósito e trajetória da ACRUX ROBOCEP.",
};

export default function AboutPage() {
  return (
    <main className="section pt-34">
      <div className="shell grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="eyebrow">Sobre a ACRUX</p>
          <h1 className="display-heading mt-5">Uma história que será preservada por temporadas.</h1>
          <p className="body-copy mt-6">
            Esta página está pronta para reunir a origem da equipe, a relação com a ROBOCEP, missão, visão, valores, trajetória e participações em competições.
          </p>
          <AboutTimeline />
          <ArrowLink className="mt-9" href="/temporadas" variant="secondary">Explorar temporadas</ArrowLink>
        </div>

        <div className="glass-panel panel-grid rounded-3xl p-6 sm:p-8">
          <div className="mx-auto max-w-54 overflow-hidden rounded-full ring-1 ring-white/15 shadow-[0_1rem_3rem_rgba(7,155,185,0.22)]">
            <Image
              alt="Logo oficial da ACRUX ROBOCEP"
              className="aspect-square w-full object-cover"
              height={216}
              sizes="216px"
              src="/brand/acrux-logo.jpg"
              width={216}
            />
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Informações oficiais</p>
          <p className="mt-3 text-base leading-7 text-acrux-muted">Conteúdo da equipe será adicionado posteriormente. Nenhum dado institucional foi inventado nesta etapa.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Missão", "Visão", "Valores", "ROBOCEP"].map((topic) => (
              <div className="rounded-xl border border-white/10 bg-[#020817]/42 p-4" key={topic}>
                <p className="font-bold text-white">{topic}</p>
                <p className="mt-2 text-sm text-acrux-muted">Em preparação</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="shell mt-18" id="parcerias">
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <p className="eyebrow">Parcerias</p>
          <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-white">Apoiadores e parceiros serão apresentados aqui.</h2>
          <p className="mt-4 max-w-2xl text-acrux-muted">A equipe poderá cadastrar nomes, logotipos e links oficiais pelo painel administrativo.</p>
        </div>
      </section>
    </main>
  );
}

