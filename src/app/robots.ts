import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { publicUrl } from "@/lib/seo/public-metadata";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const sitePath = new URL(siteConfig.url).pathname.replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [`${sitePath}/admin`, `${sitePath}/admin/`],
    },
    sitemap: publicUrl("/sitemap.xml"),
  };
}
