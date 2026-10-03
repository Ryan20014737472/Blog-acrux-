import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

interface CompetitionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [{ slug: "em-preparacao" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: CompetitionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    ...publicPageMetadata({
      path: "/competicoes/",
      title: "Competição em preparação",
      description: `Registro da competição ${slug} da ACRUX ROBOCEP.`,
    }),
    robots: { index: false, follow: true },
  };
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
