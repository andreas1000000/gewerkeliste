import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gewerkeliste.com";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/suche", "/firma/"],
      disallow: ["/admin/", "/companies/", "/trades/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

