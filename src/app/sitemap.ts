import type { MetadataRoute } from "next";

import { publicNavigation } from "@/config/site";
import { publicUrl } from "@/lib/seo/public-metadata";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [...publicNavigation, { href: "/temporadas", label: "Temporadas" }] as const;

  return routes.map((item) => ({
    url: publicUrl(item.href === "/" ? "/" : `${item.href}/`),
    changeFrequency: item.href === "/" ? "weekly" : "monthly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
