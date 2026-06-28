import type { MetadataRoute } from "next";
import {
  getPublicCompanySitemapEntries,
  getPublicLocationSitemapEntries,
  getPublicTradeLocationSitemapEntries,
} from "@/lib/data/public-directory";
import { isSupabaseConfigured } from "@/lib/supabase";
import { publicTradeTaxonomy } from "@/lib/trade-taxonomy";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gewerkeliste.com";
  const [companies, locations, tradeLocations] = await Promise.all([
    loadCompanyEntries(),
    loadLocationEntries(),
    loadTradeLocationEntries(),
  ]);
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/gewerke`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/orte`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.65,
    },
    ...publicTradeTaxonomy().map((trade) => ({
      url: `${baseUrl}/gewerke/${trade.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...tradeLocations.map((entry) => ({
      url: `${baseUrl}/gewerke/${entry.tradeSlug}/${entry.city}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.62,
    })),
    ...locations.map((entry) => ({
      url: `${baseUrl}/orte/${entry.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    {
      url: `${baseUrl}/fuer-betriebe`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/eintrag-beanspruchen`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/betrieb-eintragen`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ueber-gewerkeliste`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/impressum`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/datenschutz`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    ...companies.map((company) => ({
      url: `${baseUrl}/firma/${company.slug}`,
      lastModified: company.updatedAt ? new Date(company.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

async function loadLocationEntries() {
  if (!isSupabaseConfigured()) return [];

  try {
    return await getPublicLocationSitemapEntries();
  } catch {
    return [];
  }
}

async function loadCompanyEntries() {
  if (!isSupabaseConfigured()) return [];

  try {
    return await getPublicCompanySitemapEntries();
  } catch {
    return [];
  }
}

async function loadTradeLocationEntries() {
  if (!isSupabaseConfigured()) return [];

  try {
    return await getPublicTradeLocationSitemapEntries();
  } catch {
    return [];
  }
}
