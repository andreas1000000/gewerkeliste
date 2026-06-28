import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  PublicCompanyMetadata,
  PublicCompanyTradeMatch,
  PublicCompanyWithTrade,
} from "@/lib/types/public-directory";

const COMPANY_MEDIA_BUCKET = "company-media";
const MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getPublicCompanies(params?: {
  query?: string;
  tradeSlug?: string;
  location?: string;
  radiusKm?: string;
}) {
  if (params?.tradeSlug) {
    return getPublicCompaniesByTrade(params.tradeSlug, { query: params.query, location: params.location });
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("companies")
    .select(
      "*, trades!inner(id, name, slug), company_trades(confidence_score, source, evidence, status, visibility_level, trades(id, name, slug))",
    )
    .eq("public_visible", true)
    .order("verified", { ascending: false })
    .order("name", { ascending: true });

  if (params?.query) {
    const value = params.query.trim();
    query = query.or(`name.ilike.%${value}%,description.ilike.%${value}%`);
  }

  if (params?.location) {
    const value = params.location.trim();
    query = query.or(`city.ilike.%${value}%,postal_code.ilike.%${value}%`);
  }

  const { data, error } = await query;
  if (error) return getPublicCompaniesFallback(params);
  return resolveCompanyMedia(data as PublicCompanyWithTrade[]);
}

export async function getPublicCompaniesByTrade(
  tradeSlug: string,
  params?: {
    query?: string;
    location?: string;
  },
) {
  const supabase = getSupabaseAdmin();
  const { data: trade, error: tradeError } = await supabase.from("trades").select("id, name, slug").eq("slug", tradeSlug).single();

  if (tradeError || !trade) return [];

  let query = supabase
    .from("company_trades")
    .select("id, confidence_score, source, evidence, status, visibility_level, companies!inner(*, trades(id, name, slug)), trades(id, name, slug)")
    .eq("trade_id", trade.id)
    .eq("companies.public_visible", true)
    .order("confidence_score", { ascending: false });

  if (params?.location) {
    const value = params.location.trim();
    query = query.or(`city.ilike.%${value}%,postal_code.ilike.%${value}`, { referencedTable: "companies" });
  }

  if (params?.query) {
    const value = params.query.trim();
    query = query.or(`name.ilike.%${value}%,description.ilike.%${value}`, { referencedTable: "companies" });
  }

  const { data, error } = await query;
  if (error) {
    return getPublicCompaniesByPrimaryTradeFallback(tradeSlug, params);
  }

  const companies = ((data || []) as unknown as PublicCompanyTradeMatch[])
    .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
    .map((match) => ({
      ...match.companies,
      trades: match.trades || match.companies?.trades || null,
      trade_match: {
        confidence_score: match.confidence_score,
        source: match.source,
        evidence: match.evidence,
      },
    }))
    .filter((company): company is PublicCompanyWithTrade & { trade_match: { confidence_score: number; source: string; evidence: string | null } } => Boolean(company?.id))
    .sort(sortMatchedCompanies);

  return resolveCompanyMedia(companies);
}

export async function getPublicCompanyTradeCounts() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_trades")
    .select("status, visibility_level, trades(slug), companies!inner(public_visible)")
    .eq("companies.public_visible", true);

  if (error) {
    const companies = await getPublicCompanies();
    return companies.reduce<Record<string, number>>((counts, company) => {
      const slug = company.trades?.slug;
      if (!slug) return counts;
      counts[slug] = (counts[slug] || 0) + 1;
      return counts;
    }, {});
  }

  return (data || []).reduce<Record<string, number>>((counts, row) => {
    const raw = row as unknown as {
      status?: string | null;
      visibility_level?: string | null;
      trades: { slug: string } | { slug: string }[] | null;
    };
    if (raw.status === "rejected" || raw.visibility_level === "internal") return counts;
    const trade = Array.isArray(raw.trades) ? raw.trades[0] : raw.trades;
    if (!trade?.slug) return counts;
    counts[trade.slug] = (counts[trade.slug] || 0) + 1;
    return counts;
  }, {});
}

export async function getAllPublicCompanySlugs() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("companies").select("slug").eq("public_visible", true);

  if (error) throw error;
  return (data || []).map((item) => item.slug as string);
}

export async function getPublicCompanySitemapEntries() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("companies").select("slug, updated_at").eq("public_visible", true);

  if (error) throw error;
  return (data || [])
    .filter((item) => typeof item.slug === "string" && item.slug)
    .map((item) => ({
      slug: item.slug as string,
      updatedAt: typeof item.updated_at === "string" ? item.updated_at : null,
    }));
}

export async function getPublicTradeLocationSitemapEntries(limit = 500) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_trades")
    .select("trades(slug), companies!inner(city, public_visible)")
    .eq("companies.public_visible", true)
    .neq("visibility_level", "internal")
    .limit(limit * 4);

  if (error) return getPublicTradeLocationSitemapEntriesFallback(limit);

  const entries = new Map<string, { tradeSlug: string; city: string }>();
  for (const row of data || []) {
    const raw = row as unknown as {
      trades: { slug: string } | { slug: string }[] | null;
      companies: { city: string } | { city: string }[] | null;
    };
    const trade = Array.isArray(raw.trades) ? raw.trades[0] : raw.trades;
    const company = Array.isArray(raw.companies) ? raw.companies[0] : raw.companies;
    if (!trade?.slug || !company?.city) continue;
    const citySlug = slugifyLocation(company.city);
    if (!citySlug) continue;
    entries.set(`${trade.slug}/${citySlug}`, { tradeSlug: trade.slug, city: citySlug });
    if (entries.size >= limit) break;
  }

  return Array.from(entries.values());
}

export async function getPublicLocationSitemapEntries(limit = 300) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("city")
    .eq("public_visible", true)
    .not("city", "is", null)
    .limit(limit * 4);

  if (error) throw error;

  const entries = new Map<string, { city: string; slug: string }>();
  for (const row of data || []) {
    const city = typeof row.city === "string" ? row.city.trim() : "";
    if (!city) continue;
    const slug = slugifyLocation(city);
    if (!slug) continue;
    entries.set(slug, { city, slug });
    if (entries.size >= limit) break;
  }

  return Array.from(entries.values()).sort((a, b) => a.city.localeCompare(b.city, "de"));
}

export async function getCompanyBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*, trades(id, name, slug), company_trades(confidence_score, source, evidence, status, visibility_level, trades(id, name, slug))")
    .eq("slug", slug)
    .eq("public_visible", true)
    .single();

  if (error) return getCompanyBySlugFallback(slug);
  return resolveSingleCompanyMedia(data as PublicCompanyWithTrade);
}

export async function getCompanyBySlugForMetadata(slug: string): Promise<PublicCompanyMetadata | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("name, city, postal_code, description, trades(name)")
    .eq("slug", slug)
    .eq("public_visible", true)
    .single();

  if (error || !data) return null;
  const raw = data as unknown as {
    name: string;
    city: string;
    postal_code: string;
    description: string;
    trades: { name: string } | { name: string }[] | null;
  };
  const trade = Array.isArray(raw.trades) ? raw.trades[0] || null : raw.trades;

  return {
    name: raw.name,
    city: raw.city,
    postal_code: raw.postal_code,
    description: raw.description,
    trades: trade,
  };
}

async function getPublicCompaniesByPrimaryTradeFallback(
  tradeSlug: string,
  params?: {
    query?: string;
    location?: string;
  },
) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("companies")
    .select("*, trades!inner(id, name, slug)")
    .eq("public_visible", true)
    .eq("trades.slug", tradeSlug)
    .order("verified", { ascending: false })
    .order("name", { ascending: true });

  if (params?.location) {
    const value = params.location.trim();
    query = query.or(`city.ilike.%${value}%,postal_code.ilike.%${value}%`);
  }

  if (params?.query) {
    const value = params.query.trim();
    query = query.or(`name.ilike.%${value}%,description.ilike.%${value}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return resolveCompanyMedia(data as PublicCompanyWithTrade[]);
}

async function getPublicCompaniesFallback(params?: {
  query?: string;
  location?: string;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("companies")
    .select("*, trades!inner(id, name, slug)")
    .eq("public_visible", true)
    .order("verified", { ascending: false })
    .order("name", { ascending: true });

  if (params?.query) {
    const value = params.query.trim();
    query = query.or(`name.ilike.%${value}%,description.ilike.%${value}%`);
  }

  if (params?.location) {
    const value = params.location.trim();
    query = query.or(`city.ilike.%${value}%,postal_code.ilike.%${value}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return resolveCompanyMedia(data as PublicCompanyWithTrade[]);
}

async function getCompanyBySlugFallback(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*, trades(id, name, slug)")
    .eq("slug", slug)
    .eq("public_visible", true)
    .single();

  if (error) throw error;
  return resolveSingleCompanyMedia(data as PublicCompanyWithTrade);
}

async function getPublicTradeLocationSitemapEntriesFallback(limit: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("city, trades(slug)")
    .eq("public_visible", true)
    .limit(limit * 2);

  if (error) throw error;

  const entries = new Map<string, { tradeSlug: string; city: string }>();
  for (const row of data || []) {
    const raw = row as unknown as { city: string; trades: { slug: string } | { slug: string }[] | null };
    const trade = Array.isArray(raw.trades) ? raw.trades[0] : raw.trades;
    if (!trade?.slug || !raw.city) continue;
    const citySlug = slugifyLocation(raw.city);
    if (!citySlug) continue;
    entries.set(`${trade.slug}/${citySlug}`, { tradeSlug: trade.slug, city: citySlug });
    if (entries.size >= limit) break;
  }

  return Array.from(entries.values());
}

function slugifyLocation(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveCompanyMedia<T extends PublicCompanyWithTrade>(companies: T[]) {
  return Promise.all(companies.map((company) => resolveSingleCompanyMedia(company)));
}

async function resolveSingleCompanyMedia<T extends PublicCompanyWithTrade>(company: T) {
  const [logoUrl, profileImageUrl] = await Promise.all([
    resolveCompanyMediaUrl(company.logo_url),
    resolveCompanyMediaUrl(company.profile_image_url),
  ]);

  return {
    ...company,
    logo_url: logoUrl,
    profile_image_url: profileImageUrl,
  };
}

async function resolveCompanyMediaUrl(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;

  const path = trimmed.replace(/^company-media\//, "").replace(/^\/+/, "");
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(COMPANY_MEDIA_BUCKET).createSignedUrl(path, MEDIA_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function sortMatchedCompanies(
  a: PublicCompanyWithTrade & { trade_match?: { confidence_score: number } },
  b: PublicCompanyWithTrade & { trade_match?: { confidence_score: number } },
) {
  if (a.verified !== b.verified) return a.verified ? -1 : 1;
  const scoreDiff = (b.trade_match?.confidence_score || 0) - (a.trade_match?.confidence_score || 0);
  if (scoreDiff !== 0) return scoreDiff;
  const aClaimed = a.claim_status === "claimed";
  const bClaimed = b.claim_status === "claimed";
  if (aClaimed !== bClaimed) return aClaimed ? -1 : 1;
  return a.name.localeCompare(b.name, "de");
}
