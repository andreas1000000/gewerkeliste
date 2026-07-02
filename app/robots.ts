import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;
  const publicAllow = [
    "/",
    "/betriebe",
    "/fuer-betriebe",
    "/gewerke",
    "/gewerke/",
    "/leistungen",
    "/leistungen/",
    "/orte",
    "/orte/",
    "/firma",
    "/firma/",
    "/betrieb-eintragen",
    "/eintrag-beanspruchen",
    "/ueber-gewerkeliste",
  ];
  const privateDisallow = [
    "/admin/",
    "/api/",
    "/claim/",
    "/companies/",
    "/trades/",
    "/planner/",
    "/betriebe/*/claim",
    "/betriebe/*/profil-ergaenzen",
    "/zahlung-erfolgreich",
    "/zahlung-abgebrochen",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: publicAllow,
        disallow: privateDisallow,
      },
      ...["Googlebot", "Google-Extended", "GPTBot", "OAI-SearchBot", "ChatGPT-User"].map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: privateDisallow,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
