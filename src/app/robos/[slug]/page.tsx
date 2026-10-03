import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

interface RobotDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [{ slug: "em-preparacao" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: RobotDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    ...publicPageMetadata({
      path: "/robos/",
      title: "Robô em preparação",
      description: `Detalhes do robô ${slug} da ACRUX ROBOCEP.`,
    }),
    robots: { index: false, follow: true },
  };
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
