import { ArrowLink } from "@/components/ui/arrow-link";

export const metadata = {
  title: "Temporadas",
  description: "Arquivo de temporadas, equipes, robôs, projetos e competições da ACRUX ROBOCEP.",
};

export default function SeasonsPage() {
  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Temporadas</p>
        <h1 className="display-heading mt-5">Um arquivo que cresce junto com a ACRUX.</h1>
        <p className="body-copy mt-6">Cada temporada poderá conectar integrantes, robôs, projetos, campeonatos, conquistas, postagens e galeria sem perder a história de cada período.</p>
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <article className="glass-panel card-hover rounded-2xl p-6" key={index}>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">Temporada em breve</p>
              <h2 className="mt-3 text-2xl font-bold text-white">Arquivo da ACRUX</h2>
              <p className="mt-3 text-sm leading-6 text-acrux-muted">Ano, equipe, robô, projetos, campeonatos e registros serão cadastrados posteriormente.</p>
            </article>
          ))}
        </section>
        <ArrowLink className="mt-10" href="/robos" variant="secondary">Conhecer a estrutura de robôs</ArrowLink>
      </div>
    </main>
  );
}

