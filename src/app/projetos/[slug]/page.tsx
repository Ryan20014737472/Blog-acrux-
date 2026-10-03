import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [{ slug: "em-preparacao" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    ...publicPageMetadata({
      path: "/projetos/",
      title: "Projeto em preparação",
      description: `Detalhes do projeto ${slug} da ACRUX ROBOCEP.`,
    }),
    robots: { index: false, follow: true },
  };
}

export default function ProjectDetailPage() {
  return (
    <PlaceholderPage
      description="Esta página receberá o relato, a galeria, as áreas envolvidas e os detalhes do projeto."
      eyebrow="Projetos"
      title="Projeto em preparação"
    />
  );
}
