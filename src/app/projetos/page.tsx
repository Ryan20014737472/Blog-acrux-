import { ArrowLink } from "@/components/ui/arrow-link";
import { PlaceholderMedia } from "@/components/ui/placeholder-media";

const projectCategories = ["CAD", "Impressão 3D", "Corte a laser", "Robótica", "Engenharia", "Impacto STEAM", "Projetos escolares", "Protótipos"];

export const metadata = {
  title: "Projetos",
  description: "Projetos de tecnologia, engenharia e impacto da ACRUX ROBOCEP.",
};

export default function ProjectsPage() {
  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Projetos</p>
        <h1 className="display-heading mt-5">Ideias que merecem ser documentadas.</h1>
        <p className="body-copy mt-6">Projetos poderão ter página própria, categoria, descrição, autoria, imagens e relação com temporadas.</p>
        <div className="mt-8 flex flex-wrap gap-2">
          {projectCategories.map((category) => (
            <span className="rounded-full border border-cyan-200/14 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold text-acrux-muted" key={category}>{category}</span>
          ))}
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <article className="glass-panel card-hover overflow-hidden rounded-2xl" key={index}>
              <PlaceholderMedia className="min-h-42 border-x-0 border-t-0" label="Imagem de projeto pendente" />
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">Projeto em breve</p>
                <h2 className="mt-3 text-xl font-bold text-white">Novo projeto da ACRUX</h2>
                <p className="mt-3 text-sm leading-6 text-acrux-muted">Conteúdo da equipe será adicionado posteriormente.</p>
              </div>
            </article>
          ))}
        </section>
        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}

