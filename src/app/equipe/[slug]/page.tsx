import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

interface TeamMemberDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [{ slug: "em-preparacao" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: TeamMemberDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    ...publicPageMetadata({
      path: "/equipe/",
      title: "Perfil em preparação",
      description: `Perfil da equipe ACRUX: ${slug}.`,
    }),
    robots: { index: false, follow: true },
  };
}

export default function TeamMemberDetailPage() {
  return (
    <PlaceholderPage
      description="Perfis individuais poderão trazer foto, área, função, biografia e projetos relacionados."
      eyebrow="Equipe"
      title="Perfil em preparação"
    />
  );
}
