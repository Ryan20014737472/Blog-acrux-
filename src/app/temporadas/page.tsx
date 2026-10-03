import { SeasonsIndex } from "@/features/seasons/seasons-index";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata = publicPageMetadata({
  path: "/temporadas/",
  title: "Temporadas",
  description: "Arquivo de temporadas, equipes, robôs, projetos e competições da ACRUX ROBOCEP.",
});

export default function SeasonsPage() {
  return <SeasonsIndex />;
}

