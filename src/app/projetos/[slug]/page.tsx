import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: "Projeto", description: `Detalhes do projeto ${slug} da ACRUX ROBOCEP.` };
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

