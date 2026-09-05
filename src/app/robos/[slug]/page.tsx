import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

interface RobotDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RobotDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: "Robô", description: `Detalhes do robô ${slug} da ACRUX ROBOCEP.` };
}

export default function RobotDetailPage() {
  return (
    <PlaceholderPage
      description="Esta página receberá mecanismos, componentes, características, resultados, galeria e futura visualização 3D do robô."
      eyebrow="Robôs"
      title="Detalhes técnicos em preparação"
    />
  );
}

