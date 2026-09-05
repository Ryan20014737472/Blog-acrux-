import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

interface CompetitionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [{ slug: "em-preparacao" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: CompetitionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: "Competição", description: `Registro da competição ${slug} da ACRUX ROBOCEP.` };
}

export default function CompetitionDetailPage() {
  return (
    <PlaceholderPage
      description="Cada participação poderá reunir data, local, temporada, resultados, premiações, fotos, relato e integrantes participantes."
      eyebrow="Competições"
      title="Registro de competição em preparação"
    />
  );
}
