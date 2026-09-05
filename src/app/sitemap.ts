import type { MetadataRoute } from "next";

import { publicNavigation, siteConfig } from "@/config/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [...publicNavigation, { href: "/temporadas", label: "Temporadas" }];

  return routes.map((item) => ({
    url: new URL(item.href, siteConfig.url).toString(),
    lastModified: now,
    changeFrequency: item.href === "/" ? "weekly" : "monthly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
