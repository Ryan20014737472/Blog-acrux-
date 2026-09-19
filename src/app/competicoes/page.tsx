import { CompetitionsIndex } from "@/features/competitions/competitions-index";

export const metadata = {
  title: "Competições",
  description: "Histórico, resultados e relatos das participações da ACRUX ROBOCEP em competições.",
};

export default function CompetitionsPage() {
  return <CompetitionsIndex />;
}

