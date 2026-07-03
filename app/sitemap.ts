import type { MetadataRoute } from "next";
import {
  getPublicCompanyTradeCounts,
  getPublicCompanySitemapEntries,
  getPublicLocationSitemapEntries,
  getPublicServiceLocationSitemapEntries,
  getPublicTradeLocationSitemapEntries,
} from "@/lib/data/public-directory";
import { serviceSeoEntries } from "@/lib/service-taxonomy";
import { siteConfig } from "@/lib/site-config";
import { isSupabaseConfigured } from "@/lib/supabase";
import { publicTradeTaxonomy } from "@/lib/trade-taxonomy";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const [companies, locations, tradeLocations, serviceLocations, tradeCounts] = await Promise.all([
    loadCompanyEntries(),
    loadLocationEntries(),
    loadTradeLocationEntries(),
    loadServiceLocationEntries(),
    loadTradeCounts(),
  ]);
  const now = new Date();
  const activeTradeSlugs = new Set(Object.entries(tradeCounts).filter(([, count]) => count > 0).map(([slug]) => slug));
  const activeServiceSlugs = new Set(serviceLocations.map((entry) => entry.serviceSlug));
  const activeServices = uniqueServicesBySlug(serviceSeoEntries().filter((entry) => activeServiceSlugs.has(entry.service.slug))).slice(0, 600);

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
    ...publicTradeTaxonomy().filter((trade) => activeTradeSlugs.has(trade.slug)).map((trade) => ({
      url: `${baseUrl}/gewerke/${trade.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    {
      url: `${baseUrl}/leistungen`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.62,
    },
    ...activeServices.map((entry) => ({
      url: `${baseUrl}/leistungen/${entry.service.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.52,
    })),
    ...serviceLocations.map((entry) => ({
      url: `${baseUrl}/leistungen/${entry.serviceSlug}/${entry.city}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.58,
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
      url: `${baseUrl}/betriebe`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/betrieb-eintragen`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/eintrag-beanspruchen`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/fuer-betriebe`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${baseUrl}/preise`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55,
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

type LocationSitemapEntry = { city: string; slug: string };
type CompanySitemapEntry = { slug: string; updatedAt: string | null };
type TradeLocationSitemapEntry = { tradeSlug: string; city: string };
type ServiceLocationSitemapEntry = { serviceSlug: string; city: string };

function uniqueServicesBySlug(entries: ReturnType<typeof serviceSeoEntries>) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.service.slug)) return false;
    seen.add(entry.service.slug);
    return true;
  });
}

async function loadLocationEntries(): Promise<LocationSitemapEntry[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    return await getPublicLocationSitemapEntries();
  } catch {
    return [];
  }
}

async function loadCompanyEntries(): Promise<CompanySitemapEntry[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    return await getPublicCompanySitemapEntries();
  } catch {
    return [];
  }
}

async function loadTradeLocationEntries(): Promise<TradeLocationSitemapEntry[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    return await getPublicTradeLocationSitemapEntries();
  } catch {
    return [];
  }
}

async function loadServiceLocationEntries(): Promise<ServiceLocationSitemapEntry[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    return await getPublicServiceLocationSitemapEntries();
  } catch {
    return [];
  }
}

async function loadTradeCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};

  try {
    return await getPublicCompanyTradeCounts();
  } catch {
    return {};
  }
}
