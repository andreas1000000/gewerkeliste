import { getSupabaseAdmin } from "@/lib/supabase";
import {
  approvedSubmissionFileStoragePath,
  isPublicReferenceImageMediaType,
  isApprovedPublicStatus,
  isLocalFixtureCompanyRecord,
  isMissingPublicProfileSchemaError,
  isPublicCompanyNotFoundError,
  mergePublicItemsByKey,
  publicCertificateFileUrl,
  publicProfileRowsOrEmpty,
  publicReferenceClientName,
} from "@/lib/public-profile-rules";
import { serviceTermsByTradeSlug, serviceTaxonomy } from "@/lib/service-taxonomy";
import { resolvePilotMunicipalitySearch } from "@/lib/municipality-catalog";
import { companySlug } from "@/lib/slug";
import { normalizeSocialLink } from "@/lib/social-links";
import type {
  PublicCompanyMetadata,
  PublicCompanyServiceRelation,
  PublicCompanyTradeMatch,
  PublicCompanyWithTrade,
} from "@/lib/types/public-directory";
import type {
  CompanyCertificate,
  CompanyContact,
  CompanyPremiumProfile,
  CompanyPremiumSubmissionPayload,
  CompanyReference,
  CompanyReferenceMedia,
  CompanySocialLink,
  CompanySubmission,
  CompanyTeamMember,
  CompanyProfileSection,
  SubmissionUploadedFile,
} from "@/lib/types";

const COMPANY_MEDIA_BUCKET = "company-media";
const MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;
const APPROVED_SUBMISSION_PUBLIC_SELECT = [
  "id",
  "updated_at",
  "company_name",
  "legal_form",
  "website",
  "phone",
  "email",
  "contact_email",
  "contact_first_name",
  "contact_last_name",
  "contact_role",
  "contact_person_email",
  "contact_person_phone",
  "logo_url",
  "profile_image_url",
  "profile_image_alt",
  "contact_person_name",
  "contact_person_role",
  "image_consent_given",
  "service_radius_km",
  "service_regions",
  "postal_codes",
  "service_countries",
  "short_description",
  "description",
  "selected_services",
  "specializations",
  "references_text",
  "memberships",
  "certificates",
  "manufacturer_certificates",
  "premium_submission_payload",
  "source",
  "user_agent",
].join(", ");
const PUBLIC_COMPANY_SLUG_ALIASES: Record<string, string> = {
  "wagner-und-spielvogel-gdbr-83083-riedering": "wagner-und-spielvogel-gbr-83083-riedering",
};

export async function getPublicCompanies(params?: {
  query?: string;
  tradeSlug?: string;
  location?: string;
  radiusKm?: string;
}) {
  const municipality = resolvePilotMunicipalitySearch(params?.location);
  if (municipality) {
    const municipalityResults = await getPublicCompaniesByMunicipality(municipality.ags, municipality.name, {
      query: params?.query,
      tradeSlug: params?.tradeSlug,
    });
    if (municipalityResults !== null) return municipalityResults;
  }

  if (params?.tradeSlug) {
    return getPublicCompaniesByTrade(params.tradeSlug, { query: params.query, location: params.location });
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("companies")
    .select(
      "*, trades!inner(id, name, slug), company_trades(confidence_score, source, evidence, status, trades(id, name, slug))",
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
  return dedupePublicCompanies(excludeLocalFixtureCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[])));
}

type MunicipalityDirectorySearch = {
  query?: string;
  tradeSlug?: string;
};

async function getPublicCompaniesByMunicipality(ags: string, municipalityName: string, params: MunicipalityDirectorySearch) {
  const supabase = getSupabaseAdmin();
  const { data: municipality, error: municipalityError } = await supabase
    .from("municipalities")
    .select("ags, name, selection_enabled")
    .eq("ags", ags)
    .eq("selection_enabled", true)
    .maybeSingle();

  if (municipalityError) {
    if (isMissingPublicProfileSchemaError(municipalityError)) return null;
    throw municipalityError;
  }
  if (!municipality) return getPublicCompaniesByMunicipalityFallback(municipalityName, params);

  const { data: assignments, error: assignmentError } = await supabase
    .from("company_service_areas")
    .select("company_id")
    .eq("municipality_ags", ags)
    .eq("status", "approved");

  if (assignmentError) {
    if (isMissingPublicProfileSchemaError(assignmentError)) return null;
    throw assignmentError;
  }

  const companyIds = Array.from(
    new Set(
      (assignments || [])
        .map((assignment) => (typeof assignment.company_id === "string" ? assignment.company_id : ""))
        .filter(Boolean),
    ),
  );
  if (!companyIds.length) {
    return getPublicCompaniesByMunicipalityFallback(municipality.name, params);
  }

  const { data, error } = await supabase
    .from("companies")
    .select(
      "*, trades!inner(id, name, slug), company_trades(confidence_score, source, evidence, status, visibility_level, trades(id, name, slug))",
    )
    .eq("public_visible", true)
    .in("id", companyIds);

  if (error) {
    if (isMissingPublicProfileSchemaError(error)) return null;
    throw error;
  }

  const companies = excludeLocalFixtureCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[]));
  if (!companies.length) return getPublicCompaniesByMunicipalityFallback(municipality.name, params);
  return filterAndSortMunicipalityCompanies(companies, params);
}

async function getPublicCompaniesByMunicipalityFallback(city: string, params: MunicipalityDirectorySearch) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*, trades(id, name, slug)")
    .eq("public_visible", true)
    .ilike("city", `%${city}%`);

  if (error) {
    if (isMissingPublicProfileSchemaError(error)) return null;
    throw error;
  }

  const companies = excludeLocalFixtureCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[]));
  return filterAndSortMunicipalityCompanies(companies, params);
}

function filterAndSortMunicipalityCompanies(companies: PublicCompanyWithTrade[], params: MunicipalityDirectorySearch) {
  let filteredCompanies = companies;
  if (params.tradeSlug) {
    const normalizedTradeSlug = normalizeForDirectorySearch(params.tradeSlug);
    filteredCompanies = filteredCompanies.filter((company) => publicCompanyTradeSlugSet(company).has(normalizedTradeSlug));
  }

  const search = params.query?.trim();
  if (search) {
    filteredCompanies = filteredCompanies
      .filter(
        (company) =>
          scoreBusinessDirectoryMatch(company, {
            query: search,
            tradeSlugs: params.tradeSlug ? [params.tradeSlug] : [],
          }) > 0,
      );
  }
  filteredCompanies.sort((a, b) => sortMunicipalityCompanies(a, b, params.tradeSlug));

  return dedupePublicCompanies(filteredCompanies);
}

function sortMunicipalityCompanies(a: PublicCompanyWithTrade, b: PublicCompanyWithTrade, tradeSlug?: string) {
  if (a.verified !== b.verified) return a.verified ? -1 : 1;

  if (tradeSlug) {
    const normalizedTradeSlug = normalizeForDirectorySearch(tradeSlug);
    const confidence = (company: PublicCompanyWithTrade) =>
      Math.max(
        ...((company.company_trades || [])
          .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
          .filter((match) => normalizeForDirectorySearch(match.trades?.slug || "") === normalizedTradeSlug)
          .map((match) => match.confidence_score || 0)),
        0,
      );
    const confidenceDifference = confidence(b) - confidence(a);
    if (confidenceDifference !== 0) return confidenceDifference;
  }

  const claimedDifference = Number(b.claim_status === "claimed") - Number(a.claim_status === "claimed");
  if (claimedDifference !== 0) return claimedDifference;
  return a.name.localeCompare(b.name, "de");
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
      "*, trades(id, name, slug), company_trades(confidence_score, source, evidence, status, trades(id, name, slug))",
    )
    .eq("public_visible", true)
    .order("created_at", { ascending: false })
    .limit(hasFilter ? 700 : params?.limit || 40);

  if (error) {
    return getBusinessDirectoryCompaniesFallback(params);
  }

  const companies = dedupePublicCompanies(excludeLocalFixtureCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[])));
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
    .from("company_services")
    .select(
      "confidence_score, services!inner(slug), companies!inner(*, trades(id, name, slug), company_trades(confidence_score, source, evidence, status, trades(id, name, slug)))",
    )
    .eq("status", "confirmed")
    .eq("services.slug", service.slug)
    .eq("companies.public_visible", true)
    .order("confidence_score", { ascending: false })
    .limit(700);

  if (error) return [];

  const companies = dedupePublicCompanies(
    excludeLocalFixtureCompanies(await resolveCompanyMedia(
      (data || [])
        .map((row) => {
          const raw = row as unknown as { companies: PublicCompanyWithTrade | PublicCompanyWithTrade[] | null };
          return Array.isArray(raw.companies) ? raw.companies[0] : raw.companies;
        })
        .filter((company): company is PublicCompanyWithTrade => Boolean(company)),
    )),
  );
  return companies
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
  const municipality = resolvePilotMunicipalitySearch(params?.location);
  if (municipality) {
    const municipalityResults = await getPublicCompaniesByMunicipality(municipality.ags, municipality.name, {
      query: params?.query,
      tradeSlug,
    });
    if (municipalityResults !== null) return municipalityResults;
  }

  const supabase = getSupabaseAdmin();
  const { data: trade, error: tradeError } = await supabase.from("trades").select("id, name, slug").eq("slug", tradeSlug).single();

  if (tradeError || !trade) return [];

  let query = supabase
    .from("company_trades")
    .select("id, confidence_score, source, evidence, status, companies!inner(*, trades(id, name, slug)), trades(id, name, slug)")
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

  return resolveCompanyMedia(excludeLocalFixtureCompanies(companies));
}

export async function getPublicCompanyTradeCounts() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_trades")
    .select("status, trades(slug), companies!inner(public_visible, trust_badge, voluntary_support_status, email, description)")
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
      companies: Partial<PublicCompanyWithTrade> | Partial<PublicCompanyWithTrade>[] | null;
    };
    if (raw.status === "rejected" || raw.visibility_level === "internal") return counts;
    const company = Array.isArray(raw.companies) ? raw.companies[0] : raw.companies;
    if (isLocalFixtureCompanyRecord(company)) return counts;
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
  const { data, error } = await supabase
    .from("companies")
    .select("slug, updated_at, trust_badge, voluntary_support_status, email, description")
    .eq("public_visible", true);

  if (error) throw error;
  return ((data || []) as Array<{ slug: unknown; updated_at: unknown } & Partial<PublicCompanyWithTrade>>)
    .filter((item) => !isLocalFixtureCompanyRecord(item))
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
    .select("trades(slug), companies!inner(city, public_visible, trust_badge, voluntary_support_status, email, description)")
    .eq("companies.public_visible", true)
    .limit(limit * 4);

  if (error) return getPublicTradeLocationSitemapEntriesFallback(limit);

  const entries = new Map<string, { tradeSlug: string; city: string }>();
  for (const row of data || []) {
    const raw = row as unknown as {
      trades: { slug: string } | { slug: string }[] | null;
      companies: Partial<PublicCompanyWithTrade> | Partial<PublicCompanyWithTrade>[] | null;
    };
    const trade = Array.isArray(raw.trades) ? raw.trades[0] : raw.trades;
    const company = Array.isArray(raw.companies) ? raw.companies[0] : raw.companies;
    if (isLocalFixtureCompanyRecord(company)) continue;
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
    .from("company_services")
    .select("services!inner(slug), companies!inner(city, public_visible, trust_badge, voluntary_support_status, email, description)")
    .eq("status", "confirmed")
    .eq("companies.public_visible", true)
    .not("companies.city", "is", null)
    .limit(limit * 3);

  if (error) return [];

  const entries = new Map<string, { serviceSlug: string; city: string }>();

  for (const row of data || []) {
    const raw = row as unknown as {
      services: { slug: string } | { slug: string }[] | null;
      companies: Partial<PublicCompanyWithTrade> | Partial<PublicCompanyWithTrade>[] | null;
    };
    const service = Array.isArray(raw.services) ? raw.services[0] : raw.services;
    const company = Array.isArray(raw.companies) ? raw.companies[0] : raw.companies;
    if (isLocalFixtureCompanyRecord(company)) continue;
    if (!service?.slug) continue;
    if (!company?.city) continue;
    const city = slugifyLocation(company.city);
    if (!city) continue;
    entries.set(`${service.slug}/${city}`, { serviceSlug: service.slug, city });
    if (entries.size >= limit) return Array.from(entries.values());
  }

  return Array.from(entries.values());
}

export async function getPublicLocationSitemapEntries(limit = 300) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("city, trust_badge, voluntary_support_status, email, description")
    .eq("public_visible", true)
    .not("city", "is", null)
    .limit(limit * 4);

  if (error) throw error;

  const entries = new Map<string, { city: string; slug: string }>();
  for (const row of data || []) {
    if (isLocalFixtureCompanyRecord(row as Partial<PublicCompanyWithTrade>)) continue;
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
    .select("*, trades(id, name, slug), company_trades(confidence_score, source, evidence, status, trades(id, name, slug))")
    .eq("slug", slug)
    .eq("public_visible", true)
    .single();

  if (error) {
    if (isPublicCompanyNotFoundError(error)) return null;
    if (isMissingPublicProfileSchemaError(error)) return getCompanyBySlugFallback(slug);
    throw error;
  }
  const withServices = await attachConfirmedCompanyServices(data as PublicCompanyWithTrade);
  const company = await applyApprovedSubmissionPublicDetails(normalizePublicCompanyServices(withServices));
  if (isLocalFixtureCompanyRecord(company)) return null;
  const resolvedCompany = await resolveSingleCompanyMedia(company);
  return attachPublicPremiumProfile(resolvedCompany);
}

export async function getCompanyBySlugForMetadata(slug: string): Promise<PublicCompanyMetadata | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*, trades(name)")
    .eq("slug", slug)
    .eq("public_visible", true)
    .single();

  if (error || !data) return null;
  const raw = await applyApprovedSubmissionPublicDetails(data as PublicCompanyWithTrade);
  if (isLocalFixtureCompanyRecord(raw)) return null;
  const trade = Array.isArray(raw.trades) ? raw.trades[0] || null : raw.trades;

  return {
    name: raw.name,
    city: raw.city,
    postal_code: raw.postal_code,
    description: raw.description,
    trades: trade,
    logo_url: raw.logo_url,
    profile_image_url: raw.profile_image_url,
    service_regions: raw.service_regions,
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
  return dedupePublicCompanies(excludeLocalFixtureCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[])));
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
  return resolveCompanyMedia(excludeLocalFixtureCompanies(data as PublicCompanyWithTrade[]));
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

  const companies = dedupePublicCompanies(excludeLocalFixtureCompanies(await resolveCompanyMedia(data as PublicCompanyWithTrade[])));
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

function excludeLocalFixtureCompanies<T extends PublicCompanyWithTrade>(companies: T[]) {
  return companies.filter((company) => !isLocalFixtureCompanyRecord(company));
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

  if (error) {
    if (isPublicCompanyNotFoundError(error)) return null;
    throw error;
  }
  const withServices = await attachConfirmedCompanyServices(data as PublicCompanyWithTrade);
  const company = await applyApprovedSubmissionPublicDetails(normalizePublicCompanyServices(withServices));
  if (isLocalFixtureCompanyRecord(company)) return null;
  const resolvedCompany = await resolveSingleCompanyMedia(company);
  return attachPublicPremiumProfile(resolvedCompany);
}

async function getPublicTradeLocationSitemapEntriesFallback(limit: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("city, trust_badge, voluntary_support_status, email, description, trades(slug)")
    .eq("public_visible", true)
    .limit(limit * 2);

  if (error) throw error;

  const entries = new Map<string, { tradeSlug: string; city: string }>();
  for (const row of data || []) {
    const raw = row as unknown as Partial<PublicCompanyWithTrade> & { city: string; trades: { slug: string } | { slug: string }[] | null };
    if (isLocalFixtureCompanyRecord(raw)) continue;
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

async function attachPublicPremiumProfile<T extends PublicCompanyWithTrade>(company: T) {
  return { ...company, premium_profile: await getApprovedCompanyPremiumProfile(company) };
}

async function attachConfirmedCompanyServices<T extends PublicCompanyWithTrade>(company: T): Promise<T> {
  return {
    ...company,
    company_services: await selectConfirmedCompanyServices(company.id),
  };
}

async function selectConfirmedCompanyServices(companyId: string): Promise<PublicCompanyServiceRelation[]> {
  const supabase = getSupabaseAdmin();
  const fullSelect = "confidence_score, source, status, services(id, name, slug, service_families(name, slug, trades(name, slug)))";
  const basicSelect = "confidence_score, source, status, services(id, name, slug)";
  const { data, error } = await supabase
    .from("company_services")
    .select(fullSelect)
    .eq("company_id", companyId)
    .eq("status", "confirmed")
    .order("confidence_score", { ascending: false });

  if (!error) return normalizeServiceRows(data);
  if (!isMissingPublicProfileSchemaError(error)) throw error;

  const fallback = await supabase
    .from("company_services")
    .select(basicSelect)
    .eq("company_id", companyId)
    .eq("status", "confirmed")
    .order("confidence_score", { ascending: false });

  if (fallback.error) {
    if (isMissingPublicProfileSchemaError(fallback.error)) return [];
    throw fallback.error;
  }

  return normalizeServiceRows(fallback.data);
}

function normalizeServiceRows(data: unknown): PublicCompanyServiceRelation[] {
  return ((Array.isArray(data) ? data : []) as PublicCompanyServiceRelation[]).filter(
    (match) => match.status === "confirmed" && Boolean(match.services?.name),
  );
}

async function getApprovedCompanyPremiumProfile(company: PublicCompanyWithTrade): Promise<CompanyPremiumProfile> {
  const companyId = company.id;
  const [contacts, teamMembers, references, referenceMedia, certificates, socialLinks, profileSections, submissionProfile] = await Promise.all([
    selectApprovedProfileRows<CompanyContact>("company_contacts", companyId),
    selectApprovedProfileRows<CompanyTeamMember>("company_team_members", companyId),
    selectApprovedProfileRows<CompanyReference>("company_references", companyId),
    selectApprovedProfileRows<CompanyReferenceMedia>("company_reference_media", companyId),
    selectApprovedProfileRows<CompanyCertificate>("company_certificates", companyId),
    selectApprovedProfileRows<CompanySocialLink>("company_social_links", companyId),
    selectApprovedProfileRows<CompanyProfileSection>("company_profile_sections", companyId),
    getApprovedSubmissionPremiumProfile(company),
  ]);

  const structuredProfile: CompanyPremiumProfile = {
    contacts: normalizeContactRows(await resolvePremiumMediaRows(contacts, "image_url")),
    teamMembers: normalizeTeamRows(await resolvePremiumMediaRows(teamMembers, "image_url")),
    references: normalizeReferenceRows(references),
    referenceMedia: normalizeReferenceMediaRows(await resolvePremiumMediaRows(referenceMedia, "file_url")),
    certificates: normalizeCertificateRows(certificates),
    socialLinks: normalizeSocialLinkRows(socialLinks),
    profileSections: normalizeProfileSectionRows(profileSections),
    notes: null,
  };

  return mergePremiumProfiles(structuredProfile, submissionProfile);
}

function emptyPremiumProfile(): CompanyPremiumProfile {
  return {
    contacts: [],
    teamMembers: [],
    references: [],
    referenceMedia: [],
    certificates: [],
    socialLinks: [],
    profileSections: [],
    notes: null,
  };
}

async function selectApprovedProfileRows<T>(table: string, companyId: string): Promise<T[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("company_id", companyId)
    .eq("review_status", "approved")
    .order("sort_order", { ascending: true });

  if (!error) return publicProfileRowsOrEmpty(data as T[] | null, null);

  if (isMissingPublicProfileSchemaError(error)) {
    console.warn(`Public profile module skipped because schema is not available: ${table}`, {
      code: error.code,
      message: error.message,
    });
    return publicProfileRowsOrEmpty<T>(null, error);
  }

  console.error(`Public profile module query failed: ${table}`, {
    code: error.code,
    message: error.message,
  });
  return publicProfileRowsOrEmpty<T>(null, error);
}

function normalizeContactRows(rows: CompanyContact[]) {
  return rows
    .filter((row) => isApprovedPublicStatus(row.review_status))
    .filter((row) => cleanString(row.name))
    .map((row) => ({
      ...row,
      name: cleanString(row.name) || "Ansprechpartner",
      role: cleanString(row.role) || null,
      responsibility_area: cleanString(row.responsibility_area) || null,
      phone: cleanString(row.phone) || null,
      email: cleanString(row.email) || null,
      image_url: cleanString(row.image_url) || null,
      primary_contact_method: row.primary_contact_method || null,
    }))
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
}

function normalizeTeamRows(rows: CompanyTeamMember[]) {
  return rows
    .filter((row) => isApprovedPublicStatus(row.review_status))
    .filter((row) => cleanString(row.name))
    .map((row) => ({
      ...row,
      name: cleanString(row.name) || "Teammitglied",
      role: cleanString(row.role) || null,
      department: cleanString(row.department) || null,
      description: cleanString(row.description) || null,
      image_url: cleanString(row.image_url) || null,
    }));
}

function normalizeReferenceRows(rows: CompanyReference[]) {
  return rows
    .filter((row) => isApprovedPublicStatus(row.review_status))
    .filter((row) => cleanString(row.title) || cleanString(row.description) || nonEmptyList(row.services).length)
    .map((row, index) => ({
      ...row,
      title: cleanString(row.title) || `Referenz ${index + 1}`,
      project_type: cleanString(row.project_type) || null,
      location: cleanString(row.location) || null,
      year: typeof row.year === "number" ? row.year : null,
      period: cleanString(row.period) || null,
      description: cleanString(row.description) || null,
      services: nonEmptyList(row.services),
      client_type: cleanString(row.client_type) || null,
      client_public: row.client_public === true,
      client_name: publicReferenceClientName(row.client_name, row.client_public),
      challenge: cleanString(row.challenge) || null,
      solution: cleanString(row.solution) || null,
    }));
}

function normalizeReferenceMediaRows(rows: CompanyReferenceMedia[]) {
  return rows
    .filter((row) => isApprovedPublicStatus(row.review_status))
    .filter((row) => cleanString(row.file_url))
    .map((row) => ({
      ...row,
      file_url: cleanString(row.file_url),
      media_type: row.media_type || "image",
      width: typeof row.width === "number" && row.width > 0 ? row.width : null,
      height: typeof row.height === "number" && row.height > 0 ? row.height : null,
      category: cleanString(row.category) || null,
      alt_text: cleanString(row.alt_text) || null,
      caption: cleanString(row.caption) || null,
    }))
    .filter((row) => isPublicReferenceImageMediaType(row.media_type));
}

function normalizeCertificateRows(rows: CompanyCertificate[]) {
  return rows
    .filter((row) => isApprovedPublicStatus(row.review_status))
    .filter((row) => cleanString(row.title))
    .map((row) => ({
      ...row,
      title: cleanString(row.title) || "Nachweis",
      issuer: cleanString(row.issuer) || null,
      issued_at: cleanString(row.issued_at) || null,
      valid_until: cleanString(row.valid_until) || null,
      description: cleanString(row.description) || null,
      file_url: publicCertificateFileUrl(),
      proof_type: cleanString(row.proof_type) || null,
      verification_level: normalizeCertificateVerificationLevel(row.verification_level),
    }));
}

function normalizeSocialLinkRows(rows: CompanySocialLink[]) {
  return rows
    .filter((row) => isApprovedPublicStatus(row.review_status))
    .map((row): CompanySocialLink | null => {
      const normalized = normalizeSocialLink(row.platform, row.url, row.label);
      return normalized
        ? {
            ...row,
            platform: normalized.platform,
            label: normalized.label,
            url: normalized.url,
          }
        : null;
    })
    .filter((row): row is CompanySocialLink => Boolean(row));
}

function normalizeProfileSectionRows(rows: CompanyProfileSection[]) {
  return rows
    .filter((row) => isApprovedPublicStatus(row.review_status))
    .map((row) => ({
      ...row,
      title: cleanString(row.title),
      body: cleanString(row.body),
      section_type: cleanString(row.section_type) || null,
    }))
    .filter((row) => row.title && row.body);
}

async function getApprovedSubmissionPremiumProfile(company: PublicCompanyWithTrade): Promise<CompanyPremiumProfile> {
  const payload = await getApprovedSubmissionPremiumPayload(company);
  if (!payload || !hasSubmissionProfileContent(payload)) return emptyPremiumProfile();

  return premiumPayloadToPublicProfile(company.id, payload);
}

async function getApprovedSubmissionPremiumPayload(company: PublicCompanyWithTrade): Promise<CompanyPremiumSubmissionPayload | null> {
  const submission = await getLatestApprovedSubmissionForCompany(company, "premium_submission_payload");
  const payload = normalizeSubmissionPremiumPayload(submission?.premium_submission_payload);
  return payload && hasSubmissionProfileContent(payload) ? payload : null;
}

async function getLatestApprovedSubmissionForCompany(
  company: PublicCompanyWithTrade,
  selectColumns = APPROVED_SUBMISSION_PUBLIC_SELECT,
): Promise<Partial<CompanySubmission> | null> {
  const supabase = getSupabaseAdmin();
  const companyId = company.id;
  const sources = [`profile-update:${companyId}`, `claim:${companyId}`];
  const { data: sourceMatch, error: sourceError } = await supabase
    .from("company_submissions")
    .select(selectColumns)
    .in("source", sources)
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sourceSubmission = sourceMatch as Partial<CompanySubmission> | null;
  const validSourceMatch = isLocalFixtureSubmissionRecord(sourceSubmission) ? null : sourceSubmission;
  const fallbackMatch = validSourceMatch
    ? null
    : await supabase
        .from("company_submissions")
        .select(selectColumns)
        .eq("company_name", companyNameWithoutLegalForm(company.name, company.legal_form))
        .eq("postal_code", company.postal_code)
        .eq("city", company.city)
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  const fallbackSubmission = fallbackMatch?.data as Partial<CompanySubmission> | null | undefined;
  const fallbackData = isLocalFixtureSubmissionRecord(fallbackSubmission) ? null : fallbackSubmission;
  const data = validSourceMatch || fallbackData;
  const error = sourceError || fallbackMatch?.error;
  if (error || !data) return null;
  return data as Partial<CompanySubmission>;
}

function isLocalFixtureSubmissionRecord(submission: Partial<CompanySubmission> | null | undefined) {
  if (!submission) return false;
  const marker = [submission.source, submission.user_agent]
    .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .filter(Boolean);
  const email = typeof submission.email === "string" ? submission.email.toLowerCase() : "";
  const description = typeof submission.description === "string" ? submission.description.toLowerCase() : "";

  return (
    marker.includes("phase3-local-fixture") ||
    marker.includes("local-test") ||
    email.endsWith("@example.invalid") ||
    description.includes("lokale phase-3-testdaten") ||
    description.includes("phase-3-verifikation")
  );
}

function normalizeSubmissionPremiumPayload(payload: unknown): CompanyPremiumSubmissionPayload | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as Partial<CompanyPremiumSubmissionPayload>;
  return {
    requested: Boolean(candidate.requested),
    request_label: typeof candidate.request_label === "string" ? candidate.request_label : null,
    contacts: Array.isArray(candidate.contacts) ? candidate.contacts : [],
    team_members: Array.isArray(candidate.team_members) ? candidate.team_members : [],
    references: Array.isArray(candidate.references) ? candidate.references : [],
    reference_media: Array.isArray(candidate.reference_media) ? candidate.reference_media : [],
    certificates: Array.isArray(candidate.certificates) ? candidate.certificates : [],
    social_links: Array.isArray(candidate.social_links) ? candidate.social_links : [],
    profile_sections: Array.isArray(candidate.profile_sections) ? candidate.profile_sections : [],
    notes: typeof candidate.notes === "string" ? candidate.notes : null,
  };
}

function hasSubmissionProfileContent(payload: CompanyPremiumSubmissionPayload) {
  return Boolean(
    payload.requested ||
      payload.contacts.length ||
      payload.team_members.length ||
      payload.references.length ||
      payload.reference_media.length ||
      payload.certificates.length ||
      payload.social_links.length ||
      payload.profile_sections.length ||
      payload.notes,
  );
}

async function premiumPayloadToPublicProfile(companyId: string, payload: CompanyPremiumSubmissionPayload): Promise<CompanyPremiumProfile> {
  const references: CompanyReference[] = payload.references
    .filter((item) => item.title || item.description || item.services.length)
    .map((item, index) => ({
      id: `submission-reference-${index + 1}`,
      company_id: companyId,
      title: item.title || `Referenz ${index + 1}`,
      project_type: item.project_type,
      location: item.location,
      year: item.year,
      period: item.period || null,
      description: item.description,
      services: item.services,
      client_type: item.client_type,
      client_name: publicReferenceClientName(item.client_name, item.client_public),
      client_public: item.client_public === true,
      challenge: item.challenge || null,
      solution: item.solution || null,
      sort_order: item.sort_order || index + 1,
      review_status: "approved",
      created_at: "",
      updated_at: "",
    }));

  return {
    contacts: await Promise.all(
      payload.contacts
        .filter((item) => item.name || item.role || item.phone || item.email || item.image_file)
        .map(async (item, index) => ({
          id: `submission-contact-${index + 1}`,
          company_id: companyId,
          name: item.name || `Ansprechpartner ${index + 1}`,
          role: item.role,
          responsibility_area: item.responsibility_area || null,
          phone: item.phone,
          email: item.email,
          image_url: await resolvePayloadMediaUrl(item.image_file || null),
          primary_contact_method: null,
          sort_order: item.sort_order || index + 1,
          is_primary: index === 0,
          review_status: "approved",
          created_at: "",
          updated_at: "",
        })),
    ),
    teamMembers: await Promise.all(
      payload.team_members
        .filter((item) => item.name || item.role || item.description || item.image_file)
        .map(async (item, index) => ({
          id: `submission-team-${index + 1}`,
          company_id: companyId,
          name: item.name || `Teammitglied ${index + 1}`,
          role: item.role,
          department: item.department || null,
          description: item.description,
          image_url: await resolvePayloadMediaUrl(item.image_file || null),
          sort_order: item.sort_order || index + 1,
          review_status: "approved",
          created_at: "",
          updated_at: "",
        })),
    ),
    references,
    referenceMedia: (await Promise.all(
      payload.reference_media
        .filter((item) => item.file || item.caption || item.alt_text || item.file_note)
        .filter((item) => isPublicReferenceImageMediaType(item.media_type))
        .map(async (item, index) => ({
          id: `submission-reference-media-${index + 1}`,
          company_id: companyId,
          reference_id: referenceIdForTitle(references, item.reference_title),
          file_url: (await resolvePayloadMediaUrl(item.file || null)) || "",
          media_type: item.media_type || "image",
          width: item.width || null,
          height: item.height || null,
          category: item.category || null,
          alt_text: item.alt_text,
          caption: item.caption || item.file_note,
          sort_order: item.sort_order || index + 1,
          review_status: "approved" as const,
          created_at: "",
          updated_at: "",
        })),
    )).filter((item) => Boolean(item.file_url) && isPublicReferenceImageMediaType(item.media_type)),
    certificates: await Promise.all(
      payload.certificates
        .filter((item) => item.title || item.issuer || item.description || item.file)
        .map(async (item, index) => ({
          id: `submission-certificate-${index + 1}`,
          company_id: companyId,
          title: item.title || `Nachweis ${index + 1}`,
          issuer: item.issuer,
          issued_at: null,
          valid_until: item.valid_until,
          description: item.description || item.file_note,
          file_url: publicCertificateFileUrl(),
          proof_type: item.proof_type || null,
          verification_level: normalizeCertificateVerificationLevel(item.verification_level),
          sort_order: item.sort_order || index + 1,
          review_status: "approved",
          created_at: "",
          updated_at: "",
        })),
    ),
    socialLinks: payload.social_links
      .filter((item) => item.platform || item.url || item.label)
      .map((item, index): CompanySocialLink | null => {
        const normalized = normalizeSocialLink(item.platform, item.url, item.label);
        return normalized
          ? {
              id: `submission-social-link-${index + 1}`,
              company_id: companyId,
              platform: normalized.platform,
              url: normalized.url,
              label: normalized.label,
              sort_order: item.sort_order || index + 1,
              review_status: "approved" as const,
              created_at: "",
              updated_at: "",
            }
          : null;
      })
      .filter((item): item is CompanySocialLink => Boolean(item)),
    profileSections: payload.profile_sections
      .filter((item) => item.title || item.body)
      .map((item, index) => ({
        id: `submission-profile-section-${index + 1}`,
        company_id: companyId,
        title: item.title || `Profilabschnitt ${index + 1}`,
        body: item.body,
        section_type: item.section_type,
        sort_order: item.sort_order || index + 1,
        review_status: "approved" as const,
        created_at: "",
        updated_at: "",
      }))
      .filter((item) => item.title && item.body),
    notes: payload.notes,
  };
}

function mergePremiumProfiles(structured: CompanyPremiumProfile, fallback: CompanyPremiumProfile): CompanyPremiumProfile {
  const references = mergePublicItemsByKey(structured.references, fallback.references, referenceDedupeKey);
  const referenceKeyToId = new Map(references.map((reference) => [referenceDedupeKey(reference), reference.id]));
  const fallbackReferenceIdToMergedId = new Map(
    fallback.references.map((reference) => [reference.id, referenceKeyToId.get(referenceDedupeKey(reference)) || reference.id]),
  );
  const fallbackMedia = fallback.referenceMedia.map((media) => ({
    ...media,
    reference_id: media.reference_id ? fallbackReferenceIdToMergedId.get(media.reference_id) || media.reference_id : null,
  }));

  return {
    contacts: mergePublicItemsByKey(structured.contacts, fallback.contacts, contactDedupeKey),
    teamMembers: mergePublicItemsByKey(structured.teamMembers, fallback.teamMembers, teamMemberDedupeKey),
    references,
    referenceMedia: mergePublicItemsByKey(structured.referenceMedia, fallbackMedia, referenceMediaDedupeKey),
    certificates: mergePublicItemsByKey(structured.certificates, fallback.certificates, certificateDedupeKey),
    socialLinks: mergePublicItemsByKey(structured.socialLinks, fallback.socialLinks, socialLinkDedupeKey),
    profileSections: mergePublicItemsByKey(structured.profileSections, fallback.profileSections, profileSectionDedupeKey),
    notes: structured.notes || fallback.notes || null,
  };
}

function contactDedupeKey(contact: CompanyContact) {
  return normalizedDedupeKey([contact.name, contact.email, contact.phone, contact.role]);
}

function teamMemberDedupeKey(member: CompanyTeamMember) {
  return normalizedDedupeKey([member.name, member.role, member.department]);
}

function referenceDedupeKey(reference: CompanyReference) {
  return normalizedDedupeKey([reference.title, reference.location, reference.year, reference.period]);
}

function referenceMediaDedupeKey(media: CompanyReferenceMedia) {
  return normalizedDedupeKey([media.file_url, media.reference_id, media.caption, media.alt_text]);
}

function certificateDedupeKey(certificate: CompanyCertificate) {
  return normalizedDedupeKey([certificate.title, certificate.issuer, certificate.valid_until]);
}

function socialLinkDedupeKey(link: CompanySocialLink) {
  return normalizedDedupeKey([link.platform, link.url]);
}

function profileSectionDedupeKey(section: CompanyProfileSection) {
  return normalizedDedupeKey([section.title, section.body]);
}

function normalizeCertificateVerificationLevel(value?: string | null): CompanyCertificate["verification_level"] {
  if (value === "document_uploaded" || value === "gewerkeliste_checked") return value;
  return "self_declared";
}

function normalizedDedupeKey(values: Array<string | number | null | undefined>) {
  return values
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join("|");
}

function referenceIdForTitle(references: CompanyReference[], title: string | null) {
  if (!title) return null;
  const normalized = title.trim().toLowerCase();
  return references.find((reference) => reference.title.trim().toLowerCase() === normalized)?.id || null;
}

async function resolvePayloadMediaUrl(file: SubmissionUploadedFile | null) {
  return resolveCompanyMediaUrl(approvedSubmissionFileStoragePath(file));
}

async function resolvePremiumMediaRows<T extends Record<string, unknown>>(rows: T[], field: keyof T) {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      [field]: await resolveCompanyMediaUrl(typeof row[field] === "string" ? row[field] : null),
    })),
  ) as Promise<T[]>;
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

async function applyApprovedSubmissionPublicDetails<T extends PublicCompanyWithTrade>(company: T) {
  const submission = await getLatestApprovedSubmissionForCompany(company);
  if (!submission) return company;

  const legalName = publicCompanyNameForApprovedSubmission(company, submission);
  const description = submissionDescriptionForPublicProfile(submission);
  const contactName =
    cleanString(submission.contact_person_name) ||
    [cleanString(submission.contact_first_name), cleanString(submission.contact_last_name)].filter(Boolean).join(" ") ||
    company.contact_person_name ||
    company.contact_name ||
    null;

  return {
    ...company,
    name: legalName || company.name,
    legal_form: cleanString(submission.legal_form) || company.legal_form || null,
    description: description || company.description,
    website_url: normalizeSubmissionWebsite(submission.website) || company.website_url,
    phone: cleanString(submission.phone) || company.phone,
    email: cleanString(submission.email) || company.email,
    logo_url: cleanString(submission.logo_url) || company.logo_url || null,
    profile_image_url: submission.image_consent_given ? cleanString(submission.profile_image_url) || company.profile_image_url || null : company.profile_image_url,
    profile_image_alt: submission.image_consent_given
      ? cleanString(submission.profile_image_alt) || company.profile_image_alt || null
      : company.profile_image_alt,
    contact_person_name: contactName,
    contact_person_role: cleanString(submission.contact_person_role) || cleanString(submission.contact_role) || company.contact_person_role || null,
    contact_person_email: cleanString(submission.contact_person_email) || cleanString(submission.contact_email) || company.contact_person_email || null,
    contact_person_phone: cleanString(submission.contact_person_phone) || company.contact_person_phone || null,
    service_radius_km: submission.service_radius_km || company.service_radius_km || null,
    service_regions: nonEmptyList(submission.service_regions).length ? nonEmptyList(submission.service_regions) : company.service_regions || [],
    service_postal_codes: nonEmptyList(submission.postal_codes).length ? nonEmptyList(submission.postal_codes) : company.service_postal_codes || [],
    service_countries: nonEmptyList(submission.service_countries).length ? nonEmptyList(submission.service_countries) : company.service_countries || [],
    selected_services: nonEmptyList(submission.selected_services).length ? nonEmptyList(submission.selected_services) : company.selected_services || [],
    specializations: nonEmptyList(submission.specializations).length ? nonEmptyList(submission.specializations) : company.specializations || [],
    references_text: cleanString(submission.references_text) || company.references_text || null,
    memberships: nonEmptyList(submission.memberships).length ? nonEmptyList(submission.memberships) : company.memberships || [],
    certificates: nonEmptyList(submission.certificates).length ? nonEmptyList(submission.certificates) : company.certificates || [],
    manufacturer_certificates: nonEmptyList(submission.manufacturer_certificates).length
      ? nonEmptyList(submission.manufacturer_certificates)
      : company.manufacturer_certificates || [],
  };
}

function normalizePublicCompanyServices<T extends PublicCompanyWithTrade>(company: T): T {
  const services = (company.company_services || []).filter((match) => match.status === "confirmed" && Boolean(match.services?.name));
  return {
    ...company,
    company_services: services,
  };
}

function submissionDescriptionForPublicProfile(submission: Partial<CompanySubmission>) {
  return [submission.short_description, submission.description]
    .map((item) => cleanString(item))
    .filter(Boolean)
    .join("\n\n");
}

function companyNameWithLegalForm(companyName?: string | null, legalForm?: string | null) {
  const name = cleanString(companyName);
  const form = cleanString(legalForm);
  if (!name) return null;
  if (!form) return name;
  const normalizedName = normalizeLegalFormMatchValue(name);
  const normalizedForm = normalizeLegalFormMatchValue(form);
  if (!normalizedForm || normalizedName.split(" ").includes(normalizedForm)) return name;
  return `${name} ${form}`;
}

function publicCompanyNameForApprovedSubmission<T extends PublicCompanyWithTrade>(
  company: T,
  submission: Partial<CompanySubmission>,
) {
  const legalForm = cleanString(submission.legal_form) || cleanString(company.legal_form);
  if (legalForm) return companyNameWithLegalForm(submission.company_name || company.name, legalForm);
  return companyNameWithoutKnownLegalForm(company.name);
}

function companyNameWithoutLegalForm(name: string, legalForm?: string | null) {
  const form = cleanString(legalForm);
  if (!form) return name;
  return name.replace(new RegExp(`\\s+${escapeRegExp(form)}$`, "i"), "").trim() || name;
}

function companyNameWithoutKnownLegalForm(name: string) {
  return name
    .replace(/\s+(gmbh\s*&\s*co\.?\s*kg|gmbh|ug(?:\s*\(haftungsbeschränkt\))?|gbr|gdbr|kg|ohg|ag|eg)$/i, "")
    .trim() || name;
}

function normalizeLegalFormMatchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeSubmissionWebsite(value?: string | null) {
  const trimmed = cleanString(value);
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function cleanString(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function nonEmptyList(value?: unknown[] | null) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
