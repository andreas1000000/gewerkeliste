import type { MetadataRoute } from "next";
import { getAllPublicCompanySlugs } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { tradeTaxonomy } from "@/lib/trade-taxonomy";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gewerkeliste.com";
  const slugs = await loadCompanySlugs();

  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/suche`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gewerke`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...tradeTaxonomy.map((trade) => ({
      url: `${baseUrl}/gewerke/${trade.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    {
      url: `${baseUrl}/fuer-betriebe`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/eintrag-beanspruchen`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/betrieb-eintragen`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ueber-gewerkeliste`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...slugs.map((slug) => ({
      url: `${baseUrl}/firma/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

async function loadCompanySlugs() {
  if (!isSupabaseConfigured()) return [];

  try {
    return await getAllPublicCompanySlugs();
  } catch {
    return [];
  }
}
