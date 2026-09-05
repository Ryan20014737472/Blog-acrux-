import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

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
    title: "Post do blog",
    description: `Post da ACRUX ROBOCEP: ${slug}.`,
    openGraph: {
      images: [],
    },
    twitter: {
      images: [],
    },
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
