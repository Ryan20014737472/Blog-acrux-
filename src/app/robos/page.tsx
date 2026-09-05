import { ArrowLink } from "@/components/ui/arrow-link";
import { PlaceholderMedia } from "@/components/ui/placeholder-media";

export const metadata = {
  title: "Robôs",
  description: "Conheça os robôs e temporadas da ACRUX ROBOCEP.",
};

export default function RobotsPage() {
  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Robôs</p>
        <h1 className="display-heading mt-5">Um arquivo para cada criação da equipe.</h1>
        <p className="body-copy mt-6">Esta área receberá robôs por temporada, com mecanismos, componentes, características, galerias, resultados e equipe envolvida.</p>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          {["Robô da temporada", "Robô da temporada"].map((title, index) => (
            <article className="glass-panel card-hover overflow-hidden rounded-3xl" key={`${title}-${index}`}>
              <PlaceholderMedia className="min-h-60 border-x-0 border-t-0" label="Foto de robô pendente" />
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">Em breve</p>
                <h2 className="mt-3 text-2xl font-bold text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-acrux-muted">Conteúdo técnico será adicionado posteriormente. A estrutura já prevê uma futura experiência CAD/3D.</p>
              </div>
            </article>
          ))}
        </section>
        <ArrowLink className="mt-10" href="/temporadas" variant="secondary">Explorar temporadas</ArrowLink>
      </div>
    </main>
  );
}

