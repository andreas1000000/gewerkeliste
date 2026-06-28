import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gewerkeliste.com";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/gewerke", "/gewerke/", "/orte", "/orte/", "/firma/", "/betrieb-eintragen", "/eintrag-beanspruchen"],
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
