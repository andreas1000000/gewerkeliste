import { getSupabaseAdmin } from "@/lib/supabase";
import { serviceTermsByTradeSlug, serviceTaxonomy } from "@/lib/service-taxonomy";
import { companySlug } from "@/lib/slug";
import type {
  PublicCompanyMetadata,
  PublicCompanyTradeMatch,
  PublicCompanyWithTrade,
} from "@/lib/types/public-directory";

const COMPANY_MEDIA_BUCKET = "company-media";
const MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;
const PUBLIC_COMPANY_SLUG_ALIASES: Record<string, string> = {
  "wagner-und-spielvogel-gdbr-83083-riedering": "wagner-und-spielvogel-gbr-83083-riedering",
};

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
  return dedupePublicCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[]));
}

export async function getBusinessDirectoryCompanies(params?: {
  query?: string;
  tradeSlug?: string;
  serviceSlug?: string;
  location?: string;
  limit?: number;
}) {
  const search = params?.query?.trim();
  const tradeSlugs = splitParamList(params?.tradeSlug).map(normalizeForDirectorySearch).filter(Boolean);
  const service = findServiceSearchContext(params?.serviceSlug);
  const location = params?.location?.trim();
  const hasFilter = Boolean(search || tradeSlugs.length || service || location);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select(
      "*, trades(id, name, slug), company_trades(confidence_score, source, evidence, status, visibility_level, trades(id, name, slug))",
    )
    .eq("public_visible", true)
    .order("created_at", { ascending: false })
    .limit(hasFilter ? 700 : params?.limit || 40);

  if (error) {
    return getBusinessDirectoryCompaniesFallback(params);
  }

  const companies = dedupePublicCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[]));
  if (!hasFilter) return companies.slice(0, params?.limit || 40);

  return companies
    .map((company) => ({
      company,
      score: scoreBusinessDirectoryMatch(company, {
        query: search,
        tradeSlugs,
        service,
        location,
      }),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || newestFirst(a.company, b.company))
    .map((entry) => entry.company)
    .slice(0, params?.limit || 50);
}

export async function getServiceDirectoryCompanies(params: {
  serviceSlug: string;
  location?: string;
  limit?: number;
}) {
  const service = findServiceSearchContext(params.serviceSlug);
  if (!service) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select(
      "*, trades(id, name, slug), company_trades(confidence_score, source, evidence, status, visibility_level, trades(id, name, slug))",
    )
    .eq("public_visible", true)
    .order("created_at", { ascending: false })
    .limit(700);

  if (error) return [];

  const companies = dedupePublicCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[]));
  return companies
    .filter((company) => serviceDirectlyMatchesCompany(company, service))
    .filter((company) => companyMatchesDirectoryLocation(company, params.location))
    .map((company) => ({
      company,
      score: scoreBusinessDirectoryMatch(company, {
        query: service.name,
        tradeSlugs: [],
        service,
        location: params.location,
      }),
    }))
    .sort((a, b) => b.score - a.score || newestFirst(a.company, b.company))
    .map((entry) => entry.company)
    .slice(0, params.limit || 50);
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

  const rows = (data || []) as unknown[];
  return rows.reduce<Record<string, number>>((counts, row) => {
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
  return ((data || []) as Array<{ slug: string }>).map((item) => item.slug);
}

export async function getPublicCompanySitemapEntries() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("companies").select("slug, updated_at").eq("public_visible", true);

  if (error) throw error;
  return ((data || []) as Array<{ slug: unknown; updated_at: unknown }>)
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

export async function getPublicServiceLocationSitemapEntries(limit = 700) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("city, description, website_url, email, phone, postal_code, trades(slug), company_trades(status, visibility_level, evidence, trades(slug))")
    .eq("public_visible", true)
    .not("city", "is", null)
    .limit(limit * 3);

  if (error) return [];

  const serviceEntries = serviceTaxonomy.flatMap((group) =>
    group.trades.flatMap((trade) =>
      trade.families.flatMap((familyItem) =>
        familyItem.services.map((service) => ({
          service,
          tradeSlug: trade.slug,
          directTerms: [service.name, service.slug.replace(/-/g, " "), ...service.aliases],
        })),
      ),
    ),
  );
  const entries = new Map<string, { serviceSlug: string; city: string }>();

  for (const row of data || []) {
    const company = row as unknown as PublicCompanyWithTrade;
    if (!company.city) continue;
    const city = slugifyLocation(company.city);
    if (!city) continue;
    const tradeSlugs = publicCompanyTradeSlugSet(company);
    const blob = companyDirectorySearchBlob(company);

    for (const entry of serviceEntries) {
      if (!tradeSlugs.has(normalizeForDirectorySearch(entry.tradeSlug))) continue;
      const directHit = entry.directTerms
        .map(normalizeForDirectorySearch)
        .filter((term) => term.length > 2)
        .some((term) => blob.includes(term));
      if (!directHit) continue;
      entries.set(`${entry.service.slug}/${city}`, { serviceSlug: entry.service.slug, city });
      if (entries.size >= limit) return Array.from(entries.values());
    }
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
  const company = await applyApprovedProfileUpdateMedia(data as PublicCompanyWithTrade);
  return resolveSingleCompanyMedia(company);
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
  return dedupePublicCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[]));
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

async function getBusinessDirectoryCompaniesFallback(params?: {
  query?: string;
  tradeSlug?: string;
  serviceSlug?: string;
  location?: string;
  limit?: number;
}) {
  const search = params?.query?.trim();
  const tradeSlugs = splitParamList(params?.tradeSlug).map(normalizeForDirectorySearch).filter(Boolean);
  const service = findServiceSearchContext(params?.serviceSlug);
  const location = params?.location?.trim();
  const hasFilter = Boolean(search || tradeSlugs.length || service || location);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*, trades(id, name, slug)")
    .eq("public_visible", true)
    .order("created_at", { ascending: false })
    .limit(hasFilter ? 700 : params?.limit || 40);

  if (error) throw error;

  const companies = dedupePublicCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[]));
  if (!hasFilter) return companies.slice(0, params?.limit || 40);

  return companies
    .map((company) => ({
      company,
      score: scoreBusinessDirectoryMatch(company, {
        query: search,
        tradeSlugs,
        service,
        location,
      }),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || newestFirst(a.company, b.company))
    .map((entry) => entry.company)
    .slice(0, params?.limit || 50);
}

export function canonicalPublicCompanySlug(company: PublicCompanyWithTrade) {
  return canonicalPublicCompanySlugFromSlug(company.slug);
}

export function canonicalPublicCompanySlugFromSlug(slug: string) {
  return PUBLIC_COMPANY_SLUG_ALIASES[slug] || slug;
}

function dedupePublicCompanies<T extends PublicCompanyWithTrade>(companies: T[]) {
  const bestByKey = new Map<string, T>();

  for (const company of companies) {
    const key = publicCompanyDedupeKey(company);
    const current = bestByKey.get(key);
    if (!current || comparePublicCompanyCanonical(company, current) < 0) {
      bestByKey.set(key, company);
    }
  }

  return [...bestByKey.values()];
}

function publicCompanyDedupeKey(company: PublicCompanyWithTrade) {
  return [
    normalizeForDirectorySearch(company.name),
    normalizeForDirectorySearch(company.postal_code),
    normalizeForDirectorySearch(company.city),
  ].join("|");
}

function comparePublicCompanyCanonical(a: PublicCompanyWithTrade, b: PublicCompanyWithTrade) {
  const aCanonical = canonicalPublicCompanySlug(a) === a.slug;
  const bCanonical = canonicalPublicCompanySlug(b) === b.slug;
  if (aCanonical !== bCanonical) return aCanonical ? -1 : 1;

  const aExpected = a.slug === companySlug(a.name, a.postal_code, a.city);
  const bExpected = b.slug === companySlug(b.name, b.postal_code, b.city);
  if (aExpected !== bExpected) return aExpected ? -1 : 1;

  const aMedia = Number(Boolean(a.logo_url)) + Number(Boolean(a.profile_image_url));
  const bMedia = Number(Boolean(b.logo_url)) + Number(Boolean(b.profile_image_url));
  if (aMedia !== bMedia) return bMedia - aMedia;

  const aTradeCount = (a.company_trades || []).filter((match) => match.status !== "rejected" && match.visibility_level !== "internal").length;
  const bTradeCount = (b.company_trades || []).filter((match) => match.status !== "rejected" && match.visibility_level !== "internal").length;
  if (aTradeCount !== bTradeCount) return bTradeCount - aTradeCount;

  return newestFirst(a, b);
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

async function applyApprovedProfileUpdateMedia<T extends PublicCompanyWithTrade>(company: T) {
  if (company.profile_image_url) return company;

  const supabase = getSupabaseAdmin();
  const sources = [`profile-update:${company.id}`, `claim:${company.id}`];
  const { data: sourceMatch, error: sourceError } = await supabase
    .from("company_submissions")
    .select("logo_url, profile_image_url, profile_image_alt, contact_person_name, contact_person_role")
    .in("source", sources)
    .eq("status", "approved")
    .not("profile_image_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fallbackMatch = sourceMatch
    ? null
    : await supabase
        .from("company_submissions")
        .select("logo_url, profile_image_url, profile_image_alt, contact_person_name, contact_person_role")
        .eq("company_name", company.name)
        .eq("postal_code", company.postal_code)
        .eq("city", company.city)
        .eq("status", "approved")
        .not("profile_image_url", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  const data = sourceMatch || fallbackMatch?.data;
  const error = sourceError || fallbackMatch?.error;
  if (error || !data) return company;

  return {
    ...company,
    logo_url: company.logo_url || (typeof data.logo_url === "string" ? data.logo_url : null),
    profile_image_url: typeof data.profile_image_url === "string" ? data.profile_image_url : company.profile_image_url,
    profile_image_alt: typeof data.profile_image_alt === "string" ? data.profile_image_alt : company.profile_image_alt,
    contact_person_name: typeof data.contact_person_name === "string" ? data.contact_person_name : company.contact_person_name,
    contact_person_role: typeof data.contact_person_role === "string" ? data.contact_person_role : company.contact_person_role,
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

type DirectoryServiceSearchContext = {
  slug: string;
  name: string;
  tradeSlugs: string[];
  terms: string[];
  directTerms: string[];
};

function publicCompanyTradeSlugSet(company: PublicCompanyWithTrade) {
  return new Set(
    [
      company.trades?.slug,
      ...(company.company_trades || [])
        .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
        .map((match) => match.trades?.slug),
    ]
      .filter((value): value is string => Boolean(value))
      .map(normalizeForDirectorySearch),
  );
}

function companyDirectorySearchBlob(company: PublicCompanyWithTrade) {
  const tradeNames = [
    company.trades?.name,
    company.trades?.slug,
    ...(company.company_trades || [])
      .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
      .flatMap((match) => [match.trades?.name, match.trades?.slug]),
  ].filter((value): value is string => Boolean(value));

  return normalizeForDirectorySearch(
    [
      company.name,
      company.website_url,
      company.city,
      company.postal_code,
      company.description,
      company.email,
      company.phone,
      tradeNames.join(" "),
      ...(company.company_trades || [])
        .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
        .map((match) => match.evidence || ""),
    ].join(" "),
  );
}

function serviceDirectlyMatchesCompany(company: PublicCompanyWithTrade, service: DirectoryServiceSearchContext) {
  const blob = companyDirectorySearchBlob(company);
  return service.directTerms
    .map(normalizeForDirectorySearch)
    .filter((term) => term.length > 2)
    .some((term) => blob.includes(term));
}

function companyMatchesDirectoryLocation(company: PublicCompanyWithTrade, location?: string) {
  const locationQuery = normalizeForDirectorySearch(location || "");
  if (!locationQuery) return true;
  const locationValue = normalizeForDirectorySearch([company.city, company.postal_code].filter(Boolean).join(" "));
  const locationTokens = expandDirectoryQuery(locationQuery);
  return locationValue.includes(locationQuery) || locationTokens.some((token) => locationValue.includes(token));
}

function scoreBusinessDirectoryMatch(
  company: PublicCompanyWithTrade,
  params: {
    query?: string;
    tradeSlugs: string[];
    service?: DirectoryServiceSearchContext;
    location?: string;
  },
) {
  const normalizedQuery = normalizeForDirectorySearch(params.query || "");
  const locationQuery = normalizeForDirectorySearch(params.location || "");
  const queryTokens = normalizedQuery ? expandDirectoryQuery(normalizedQuery) : [];
  const locationTokens = locationQuery ? expandDirectoryQuery(locationQuery) : [];

  const tradeNames = [
    company.trades?.name,
    company.trades?.slug,
    ...(company.company_trades || [])
      .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
      .flatMap((match) => [match.trades?.name, match.trades?.slug]),
  ].filter((value): value is string => Boolean(value));
  const companyTradeSlugs = new Set(tradeNames.map(normalizeForDirectorySearch));
  const companySearchBlob = companyDirectorySearchBlob(company);

  const fields: Array<[string | null | undefined, number]> = [
    [company.name, 100],
    [company.website_url, 80],
    [company.city, 70],
    [company.postal_code, 60],
    [company.description, 55],
    [company.email, 45],
    [company.phone, 35],
    [tradeNames.join(" "), 75],
    [
      (company.company_trades || [])
        .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
        .map((match) => match.evidence || "")
        .join(" "),
      50,
    ],
  ];

  let score = fields.reduce((currentScore, [value, weight]) => {
    const normalizedValue = normalizeForDirectorySearch(value || "");
    if (!normalizedValue || !normalizedQuery) return currentScore;
    if (normalizedValue === normalizedQuery) return Math.max(currentScore, weight + 25);
    if (normalizedValue.startsWith(normalizedQuery)) return Math.max(currentScore, weight + 15);
    if (normalizedValue.includes(normalizedQuery)) return Math.max(currentScore, weight);
    if (queryTokens.some((token) => normalizedValue.includes(token))) return Math.max(currentScore, Math.max(20, weight - 10));
    return currentScore;
  }, 0);

  if (locationQuery) {
    const locationValue = normalizeForDirectorySearch([company.city, company.postal_code].filter(Boolean).join(" "));
    if (locationValue.includes(locationQuery)) score += 90;
    else if (locationTokens.some((token) => locationValue.includes(token))) score += 55;
    else if (params.query || params.tradeSlugs.length || params.service) score -= 20;
  }

  for (const slug of params.tradeSlugs) {
    if (companyTradeSlugs.has(slug)) score += 120;
    else if (companySearchBlob.includes(slug)) score += 65;
  }

  if (params.service) {
    const serviceTerms = params.service.terms.map(normalizeForDirectorySearch).filter(Boolean);
    const directServiceHit = serviceTerms.some((term) => companySearchBlob.includes(term));
    const tradeFallbackHit = params.service.tradeSlugs.some((slug) => companyTradeSlugs.has(normalizeForDirectorySearch(slug)));
    if (directServiceHit) score += 140;
    else if (tradeFallbackHit) score += 75;
  }

  return score;
}

const directorySynonymGroups = [
  ["shk", "heizung", "sanitaer", "sanitar", "sanitaerinstallation", "heizungsbau"],
  ["elektro", "elektriker", "elektrotechnik", "elektroinstallation", "photovoltaik", "netzwerktechnik"],
  ["zimmerei", "zimmerer", "zimmererarbeiten", "holzbau", "dachstuhl"],
  ["gartenbau", "galabau", "garten landschaftsbau", "landschaftsbau", "aussenanlagen"],
  ["pflaster", "pflasterbau", "pflasterarbeiten", "aussenanlagen", "einfahrt", "terrasse"],
  ["tiefbau", "erdbau", "kanalbau", "entwaesserung", "leitungsbau", "bagger"],
  ["maler", "malerarbeiten", "anstrich", "fassade", "beschichtung"],
  ["fenster", "fensterbau", "tueren", "tuer", "glaser", "schreiner"],
  ["metallbau", "schlosserei", "stahlbau", "schlosser"],
  ["rohbau", "maurer", "maurerarbeiten", "bauunternehmen", "hochbau", "betonbau"],
];

function expandDirectoryQuery(normalizedQuery: string) {
  const tokens = new Set(
    normalizedQuery
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length > 1),
  );

  for (const group of directorySynonymGroups) {
    const normalizedGroup = group.map(normalizeForDirectorySearch);
    if (normalizedGroup.some((term) => normalizedQuery.includes(term) || tokens.has(term))) {
      normalizedGroup.flatMap((term) => term.split(" ")).forEach((token) => {
        if (token.length > 1) tokens.add(token);
      });
    }
  }

  return Array.from(tokens);
}

function splitParamList(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function findServiceSearchContext(serviceSlug?: string): DirectoryServiceSearchContext | undefined {
  if (!serviceSlug) return undefined;
  const normalizedSlug = normalizeForDirectorySearch(serviceSlug);
  const termsByTrade = serviceTermsByTradeSlug();
  for (const group of serviceTaxonomy) {
    for (const trade of group.trades) {
      for (const familyItem of trade.families) {
        for (const service of familyItem.services) {
          if (normalizeForDirectorySearch(service.slug) !== normalizedSlug) continue;
          return {
            slug: service.slug,
            name: service.name,
            tradeSlugs: [trade.slug, ...service.crosslinks],
            directTerms: [service.name, service.slug.replace(/-/g, " "), ...service.aliases],
            terms: [
              service.name,
              service.description,
              ...service.aliases,
              ...service.activities,
              ...service.contexts,
              ...service.crosslinks,
              ...(termsByTrade.get(trade.slug) || []),
            ],
          };
        }
      }
    }
  }
  return {
    slug: serviceSlug,
    name: serviceSlug.replace(/-/g, " "),
    tradeSlugs: [],
    directTerms: [serviceSlug, serviceSlug.replace(/-/g, " ")],
    terms: [serviceSlug, serviceSlug.replace(/-/g, " ")],
  };
}

function normalizeForDirectorySearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function newestFirst(a: PublicCompanyWithTrade, b: PublicCompanyWithTrade) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
