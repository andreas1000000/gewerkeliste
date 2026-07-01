import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/betriebe",
        "/fuer-betriebe",
        "/gewerke",
        "/gewerke/",
        "/leistungen",
        "/leistungen/",
        "/orte",
        "/orte/",
        "/firma/",
        "/betrieb-eintragen",
        "/eintrag-beanspruchen",
      ],
      disallow: [
        "/admin/",
        "/api/",
        "/claim/",
        "/companies/",
        "/trades/",
        "/planner/",
        "/betriebe/*/claim",
        "/zahlung-erfolgreich",
        "/zahlung-abgebrochen",
        "/preise",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
