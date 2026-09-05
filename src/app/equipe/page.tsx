import { ArrowLink } from "@/components/ui/arrow-link";
import { PlaceholderMedia } from "@/components/ui/placeholder-media";

const plannedAreas = ["CAD", "Programação", "Mecânica", "Elétrica", "Gestão", "Marketing", "Impacto STEAM"];

export const metadata = {
  title: "Equipe",
  description: "Conheça os integrantes e áreas da ACRUX ROBOCEP.",
};

export default function TeamPage() {
  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Equipe</p>
        <h1 className="display-heading mt-5">Pessoas que constroem a ACRUX.</h1>
        <p className="body-copy mt-6">Os perfis oficiais terão foto, nome, área, função e apresentação curta. A equipe ainda não forneceu esses dados para publicação.</p>

        <div className="mt-8 flex flex-wrap gap-2" aria-label="Áreas previstas da equipe">
          {plannedAreas.map((area) => (
            <span className="rounded-full border border-cyan-200/14 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold text-acrux-muted" key={area}>{area}</span>
          ))}
        </div>

        <section aria-label="Integrantes da equipe" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <article className="glass-panel card-hover overflow-hidden rounded-2xl" key={index}>
              <PlaceholderMedia className="min-h-48 border-x-0 border-t-0" label="Foto de integrante pendente" />
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">Perfil em breve</p>
                <h2 className="mt-3 text-xl font-bold text-white">Integrante da ACRUX</h2>
                <p className="mt-3 text-sm leading-6 text-acrux-muted">Conteúdo da equipe será adicionado posteriormente pelo painel administrativo.</p>
              </div>
            </article>
          ))}
        </section>
        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}

