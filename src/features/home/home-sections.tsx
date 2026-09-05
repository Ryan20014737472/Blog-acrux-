import Link from "next/link";
import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { ArrowLink } from "@/components/ui/arrow-link";
import { PlaceholderMedia } from "@/components/ui/placeholder-media";

interface SectionLeadProps {
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  action?: string;
}

function SectionLead({ eyebrow, title, description, href, action }: SectionLeadProps) {
  return (
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-heading mt-4">{title}</h2>
        <p className="body-copy mt-5">{description}</p>
      </div>
      {href && action ? <ArrowLink href={href}>{action}</ArrowLink> : null}
    </div>
  );
}

interface PreviewCardProps {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  mediaLabel: string;
  index?: number;
  children?: ReactNode;
}

function PreviewCard({
  eyebrow,
  title,
  description,
  href,
  mediaLabel,
  index = 0,
  children,
}: PreviewCardProps) {
  return (
    <ScrollReveal delay={index * 0.06}>
      <article className="glass-panel card-hover group h-full overflow-hidden rounded-2xl">
        <PlaceholderMedia className="min-h-42 border-x-0 border-t-0" label={mediaLabel} />
        <div className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">{eyebrow}</p>
          <h3 className="mt-3 text-xl font-bold tracking-[-0.025em] text-white">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-acrux-muted">{description}</p>
          {children}
          <ArrowLink className="mt-5" href={href}>
            Ver em breve
          </ArrowLink>
        </div>
      </article>
    </ScrollReveal>
  );
}

export function AboutPreview() {
  return (
    <section className="section" id="sobre-acrux">
      <div className="shell grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <ScrollReveal>
          <div>
            <p className="eyebrow">Constelação em movimento</p>
            <h2 className="section-heading mt-4">Uma equipe que conecta pessoas, ideias e tecnologia.</h2>
            <p className="body-copy mt-6">
              A ACRUX ROBOCEP terá aqui seu espaço para compartilhar a própria história, propósito, aprendizado e impacto. O texto institucional completo será adicionado pela equipe.
            </p>
            <ArrowLink className="mt-8" href="/sobre" variant="secondary">
              Conheça a ACRUX
            </ArrowLink>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.12}>
          <div className="glass-panel panel-grid relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div aria-hidden="true" className="absolute -right-18 -top-18 h-48 w-48 rounded-full border border-cyan-200/13" />
            <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 480 330">
              <path className="constellation-line" d="M55 236 L133 158 L224 208 L302 95 L405 148" />
              <path className="constellation-line" d="M133 158 L201 82 L302 95" />
              {[ [55,236], [133,158], [224,208], [302,95], [405,148], [201,82] ].map(([cx, cy]) => (
                <circle cx={cx} cy={cy} fill="#4BD4E8" key={`${cx}-${cy}`} r="3" />
              ))}
            </svg>
            <div className="relative grid gap-4 sm:grid-cols-2">
              {["História", "Missão", "Valores", "Trajetória"].map((item) => (
                <div className="rounded-2xl border border-white/10 bg-[#020817]/46 p-4" key={item}>
                  <p className="text-sm font-bold text-white">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-acrux-muted">Conteúdo oficial será adicionado posteriormente.</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export function NewsPreview() {
  return (
    <section className="section section-tight border-y border-white/7 bg-[#06163f]/30">
      <div className="shell">
        <SectionLead
          action="Ir para o blog"
          description="Notícias, bastidores, competições, robôs e projetos terão um espaço editorial próprio no site oficial."
          eyebrow="Blog oficial"
          href="/blog"
          title="O que acontece na ACRUX, contado pela própria equipe."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <PreviewCard
            description="Os primeiros conteúdos editoriais serão publicados pela área administrativa."
            eyebrow="Em breve"
            href="/blog"
            index={0}
            mediaLabel="Imagem de capa do blog"
            title="Notícias oficiais da ACRUX"
          />
          <PreviewCard
            description="Relatos de eventos e competições serão organizados por temporada."
            eyebrow="Competições"
            href="/blog"
            index={1}
            mediaLabel="Imagem de competição"
            title="Histórias que ainda serão registradas"
          />
          <PreviewCard
            description="Projetos e bastidores mostrarão processos, aprendizados e colaboração."
            eyebrow="Bastidores"
            href="/blog"
            index={2}
            mediaLabel="Imagem de bastidores"
            title="Conhecimento em construção"
          />
        </div>
      </div>
    </section>
  );
}

export function TeamPreview() {
  return (
    <section className="section">
      <div className="shell">
        <SectionLead
          action="Ver a equipe"
          description="Cada perfil poderá reunir foto, área, função e uma breve apresentação. Nenhum integrante foi inventado nesta primeira etapa."
          eyebrow="Pessoas que fazem"
          href="/equipe"
          title="Uma constelação se forma com muitas perspectivas."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {["Perfil da equipe", "Perfil da equipe", "Perfil da equipe"].map((title, index) => (
            <PreviewCard
              description="Conteúdo da equipe será adicionado posteriormente."
              eyebrow="Integrante em breve"
              href="/equipe"
              index={index}
              key={`${title}-${index}`}
              mediaLabel="Foto de integrante pendente"
              title={title}
            >
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-white/62">Área e função pendentes</p>
            </PreviewCard>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RobotsAndProjectsPreview() {
  return (
    <section className="section section-tight border-y border-white/7 bg-[radial-gradient(circle_at_85%_18%,rgba(7,155,185,0.15),transparent_23rem)]">
      <div className="shell">
        <SectionLead
          action="Conhecer os robôs"
          description="O site já está preparado para apresentar as temporadas, mecanismos, componentes, resultados e, no futuro, visualizações 3D."
          eyebrow="Engenharia em campo"
          href="/robos"
          title="Robôs e projetos feitos para aprender, competir e evoluir."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <ScrollReveal>
            <article className="glass-panel card-hover relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <div aria-hidden="true" className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-cyan-200/13" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Robôs</p>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-white">Arquivo de robôs por temporada</h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-acrux-muted">
                Nome, mecanismos, componentes, galeria, resultados e pessoas envolvidas serão cadastrados posteriormente.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-[#020817]/48 p-4 text-sm text-acrux-muted">Modelos 3D: preparado para futura integração</div>
                <div className="rounded-xl border border-white/10 bg-[#020817]/48 p-4 text-sm text-acrux-muted">Galeria e detalhes por robô</div>
              </div>
              <ArrowLink className="mt-7" href="/robos" variant="secondary">Explorar robôs</ArrowLink>
            </article>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <article className="glass-panel card-hover relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Projetos</p>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-white">Ideias transformadas em protótipos.</h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-acrux-muted">
                CAD, impressão 3D, corte a laser, robótica, engenharia e impacto STEAM poderão ganhar páginas próprias.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {["CAD", "Impressão 3D", "Robótica", "Impacto STEAM"].map((category) => (
                  <span className="rounded-full border border-cyan-200/14 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold text-acrux-muted" key={category}>{category}</span>
                ))}
              </div>
              <ArrowLink className="mt-7" href="/projetos" variant="secondary">Explorar projetos</ArrowLink>
            </article>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function AchievementsAndCompetitionPreview() {
  return (
    <section className="section">
      <div className="shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-18">
        <div>
          <p className="eyebrow">Conquistas</p>
          <h2 className="section-heading mt-4">Resultados que a equipe decidirá contar.</h2>
          <p className="body-copy mt-5">
            Este espaço reserva destaque para conquistas, reconhecimentos e aprendizados, sempre com informações oficiais da ACRUX.
          </p>
          <ArrowLink className="mt-8" href="/temporadas" variant="secondary">Ver temporadas</ArrowLink>
        </div>
        <ScrollReveal delay={0.1}>
          <div className="relative border-l border-cyan-200/22 pl-7 sm:pl-9">
            {["Conquista ou reconhecimento", "Participação em competição", "Próxima etapa da trajetória"].map((item, index) => (
              <div className="relative pb-8 last:pb-0" key={item}>
                <span className={`absolute -left-[2.06rem] top-1.5 h-3 w-3 rounded-full border-2 border-[#06163f] ${index === 0 ? "bg-acrux-yellow shadow-[0_0_0.75rem_rgba(251,244,6,0.6)]" : "bg-acrux-cyan"}`} />
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">Informações em breve</p>
                <h3 className="mt-2 text-xl font-bold text-white">{item}</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-acrux-muted">Dados oficiais serão adicionados posteriormente, sem antecipar títulos, datas ou resultados.</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      <div className="shell mt-15">
        <SectionLead
          action="Ir para competições"
          description="FTC, TBR, OBR e outras participações futuras poderão ser organizadas por evento, temporada, local, premiações e relato."
          eyebrow="Competições"
          href="/competicoes"
          title="Cada evento terá seu contexto, não apenas um resultado."
        />
      </div>
    </section>
  );
}

export function GalleryAndSponsorsPreview() {
  return (
    <section className="section section-tight border-y border-white/7 bg-[#06163f]/32">
      <div className="shell">
        <SectionLead
          action="Abrir galeria"
          description="Fotos e vídeos poderão ser organizados por temporada, evento, campeonato, projeto e categoria."
          eyebrow="Galeria"
          href="/galeria"
          title="Os registros visuais da ACRUX terão seu próprio arquivo."
        />
        <div className="mt-10 grid auto-rows-[8rem] grid-cols-2 gap-3 sm:grid-cols-4 sm:auto-rows-[10rem]">
          {[
            "Foto em destaque",
            "Bastidores",
            "Robô",
            "Evento",
            "Projeto",
            "Competição",
          ].map((label, index) => (
            <ScrollReveal
              className={index === 0 ? "col-span-2 row-span-2" : index === 3 ? "col-span-2" : ""}
              delay={index * 0.04}
              key={label}
            >
              <div className="placeholder-media h-full min-h-0 rounded-xl"><span>{label} — em breve</span></div>
            </ScrollReveal>
          ))}
        </div>

        <div className="glass-panel mt-14 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="eyebrow">Patrocinadores e parceiros</p>
              <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-white">Espaço reservado para quem apoia a jornada da ACRUX.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-acrux-muted">Marcas e informações de parceiros serão adicionadas somente após confirmação da equipe.</p>
            </div>
            <Link className="button-secondary shrink-0" href="/sobre#parcerias">Conhecer parcerias</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="section">
      <div className="shell">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-cyan-200/18 bg-[linear-gradient(135deg,#09285b_0%,#06163f_46%,#020817_100%)] px-6 py-12 text-center shadow-[0_1.5rem_5rem_rgba(1,14,43,0.45)] sm:px-12 sm:py-16">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-95 w-95 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/10" />
            <div aria-hidden="true" className="absolute left-[18%] top-[26%] h-1.5 w-1.5 rounded-full bg-acrux-yellow shadow-[0_0_0.8rem_rgba(251,244,6,0.8)]" />
            <div aria-hidden="true" className="absolute right-[20%] top-[38%] h-1 w-1 rounded-full bg-white shadow-[0_0_0.8rem_rgba(75,212,232,0.8)]" />
            <div className="relative">
              <p className="eyebrow justify-center">ACRUX ROBOCEP</p>
              <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-[-0.055em] text-white sm:text-5xl">O próximo capítulo começa aqui.</h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-acrux-muted">Acompanhe o site enquanto a equipe adiciona sua história, suas pessoas e seus projetos oficiais.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <ArrowLink href="/sobre" variant="primary">Conheça a ACRUX</ArrowLink>
                <ArrowLink href="/blog" variant="secondary">Acompanhe o blog</ArrowLink>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

