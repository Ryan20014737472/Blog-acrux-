import { ArrowLink } from "@/components/ui/arrow-link";

const galleryFilters = ["Temporada", "Evento", "Campeonato", "Projeto", "Categoria"];

export const metadata = {
  title: "Galeria",
  description: "Galeria de fotos e vídeos da ACRUX ROBOCEP.",
};

export default function GalleryPage() {
  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Galeria</p>
        <h1 className="display-heading mt-5">Um acervo visual para a história da equipe.</h1>
        <p className="body-copy mt-6">Fotos e vídeos serão cadastrados posteriormente e organizados por temporada, evento, campeonato, projeto e categoria.</p>
        <div className="mt-8 flex flex-wrap gap-2">
          {galleryFilters.map((filter) => (
            <span className="rounded-full border border-cyan-200/14 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold text-acrux-muted" key={filter}>{filter}</span>
          ))}
        </div>
        <div className="glass-panel panel-grid mt-10 grid min-h-80 place-items-center rounded-3xl p-8 text-center">
          <div>
            <p className="text-xl font-bold text-white">Nenhuma imagem publicada ainda.</p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-acrux-muted">A estrutura do banco já prevê álbuns, imagens, textos alternativos e uma futura visualização em lightbox.</p>
          </div>
        </div>
        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}

