import { ArrowLink } from "@/components/ui/arrow-link";

const competitionCategories = ["FTC", "TBR", "OBR", "Outras futuras"];

export const metadata = {
  title: "Competições",
  description: "Histórico e participações da ACRUX ROBOCEP em competições.",
};

export default function CompetitionsPage() {
  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Competições</p>
        <h1 className="display-heading mt-5">Cada participação terá uma história completa.</h1>
        <p className="body-copy mt-6">Eventos poderão ser organizados por categoria, temporada, data, local, resultado, premiações, fotos, relatos e integrantes participantes.</p>
        <div className="mt-8 flex flex-wrap gap-2">
          {competitionCategories.map((category) => (
            <span className="rounded-full border border-cyan-200/14 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold text-acrux-muted" key={category}>{category}</span>
          ))}
        </div>
        <div className="glass-panel mt-10 rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">Arquivo em preparação</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-acrux-muted">Nenhum evento ou resultado foi cadastrado nesta etapa, portanto não há conquistas ou datas inventadas para exibir.</p>
        </div>
        <ArrowLink className="mt-10" href="/temporadas" variant="secondary">Ver estrutura de temporadas</ArrowLink>
      </div>
    </main>
  );
}

