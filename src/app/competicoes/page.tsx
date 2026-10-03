import { CompetitionsIndex } from "@/features/competitions/competitions-index";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata = publicPageMetadata({
  path: "/competicoes/",
  title: "Competições",
  description: "Histórico, resultados e relatos das participações da ACRUX ROBOCEP em competições.",
});

export default function CompetitionsPage() {
  return <CompetitionsIndex />;
}

