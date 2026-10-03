import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [{ slug: "em-preparacao" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    ...publicPageMetadata({
      path: "/blog/",
      title: "Postagem em preparação",
      description: `Post da ACRUX ROBOCEP: ${slug}.`,
    }),
    robots: { index: false, follow: true },
  };
}

export default function BlogPostPage() {
  return (
    <PlaceholderPage
      description="Cada postagem publicada terá conteúdo, metadata, categoria, tags, autor, imagens e vídeos opcionais."
      eyebrow="Blog"
      title="Postagem em preparação"
    />
  );
}
