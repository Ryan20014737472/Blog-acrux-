import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

/** Resolves public links within the site's deployment path, including Pages. */
export function publicUrl(path: `/${string}`) {
  const baseUrl = `${siteConfig.url.replace(/\/+$/, "")}/`;

  return new URL(path.replace(/^\/+/, ""), baseUrl).toString();
}

interface PublicPageMetadataOptions {
  path: `/${string}`;
  title?: string;
  description?: string;
}

export function publicPageMetadata({
  path,
  title,
  description = siteConfig.description,
}: PublicPageMetadataOptions): Metadata {
  const fullTitle = title
    ? `${title} | ${siteConfig.name}`
    : "ACRUX ROBOCEP | Equipe de Robótica";
  const url = publicUrl(path);

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      url,
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}
