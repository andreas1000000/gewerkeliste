import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  CompanyClaimWithCompany,
  CompanyTradeMatch,
  CompanySubmission,
  CompanyWithTrade,
  ResearchCompanyCandidate,
  ResearchImportBatch,
  SubmissionDuplicate,
  Trade,
} from "@/lib/types";

export async function getTrades() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("trades").select("*").order("name", { ascending: true });

  if (error) throw error;
  return data as Trade[];
}

export async function getCompanies(params?: {
  query?: string;
  tradeId?: string;
  claimStatus?: string;
  verified?: string;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("companies")
    .select("*, trades!inner(id, name, slug), company_trades(id, confidence_score, status, visibility_level, trades(id, name, slug))")
    .order("updated_at", { ascending: false });

  if (params?.query) {
    const value = params.query.trim();
    query = query.or(
      `name.ilike.%${value}%,city.ilike.%${value}%,postal_code.ilike.%${value}%,description.ilike.%${value}%`,
    );
  }

  if (params?.tradeId) {
    query = query.eq("trade_id", params.tradeId);
  }

  if (params?.claimStatus) {
    query = query.eq("claim_status", params.claimStatus);
  }

  if (params?.verified === "true") {
    query = query.eq("verified", true);
  }

  if (params?.verified === "false") {
    query = query.eq("verified", false);
  }

  const { data, error } = await query;
  if (error) return getCompaniesFallback(params);
  return data as CompanyWithTrade[];
}

async function getCompaniesFallback(params?: {
  query?: string;
  tradeId?: string;
  claimStatus?: string;
  verified?: string;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("companies")
    .select("*, trades!inner(id, name, slug)")
    .order("updated_at", { ascending: false });

  if (params?.query) {
    const value = params.query.trim();
    query = query.or(
      `name.ilike.%${value}%,city.ilike.%${value}%,postal_code.ilike.%${value}%,description.ilike.%${value}%`,
    );
  }

  if (params?.tradeId) {
    query = query.eq("trade_id", params.tradeId);
  }

  if (params?.claimStatus) {
    query = query.eq("claim_status", params.claimStatus);
  }

  if (params?.verified === "true") {
    query = query.eq("verified", true);
  }

  if (params?.verified === "false") {
    query = query.eq("verified", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as CompanyWithTrade[];
}

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
  return data as CompanyWithTrade[];
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
    .select("id, confidence_score, source, evidence, companies!inner(*, trades(id, name, slug)), trades(id, name, slug)")
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

  return ((data || []) as unknown as CompanyTradeMatch[])
    .map((match) => ({
      ...match.companies,
      trades: match.trades || match.companies?.trades || null,
      trade_match: {
        confidence_score: match.confidence_score,
        source: match.source,
        evidence: match.evidence,
      },
    }))
    .filter((company): company is CompanyWithTrade & { trade_match: { confidence_score: number; source: string; evidence: string | null } } => Boolean(company?.id))
    .sort(sortMatchedCompanies);
}

export async function getPublicCompanyTradeCounts() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_trades")
    .select("trades(slug), companies!inner(public_visible)")
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
    const raw = row as unknown as { trades: { slug: string } | { slug: string }[] | null };
    const trade = Array.isArray(raw.trades) ? raw.trades[0] : raw.trades;
    if (!trade?.slug) return counts;
    counts[trade.slug] = (counts[trade.slug] || 0) + 1;
    return counts;
  }, {});
}

export async function getPublicCompaniesForTradeCountsFallback() {
  const companies = await getPublicCompanies();
  return companies.reduce<Record<string, number>>((counts, company) => {
    const slug = company.trades?.slug;
    if (!slug) return counts;
    counts[slug] = (counts[slug] || 0) + 1;
    return counts;
  }, {});
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
  return data as CompanyWithTrade[];
}

function sortMatchedCompanies(
  a: CompanyWithTrade & { trade_match?: { confidence_score: number } },
  b: CompanyWithTrade & { trade_match?: { confidence_score: number } },
) {
  if (a.verified !== b.verified) return a.verified ? -1 : 1;
  const scoreDiff = (b.trade_match?.confidence_score || 0) - (a.trade_match?.confidence_score || 0);
  if (scoreDiff !== 0) return scoreDiff;
  const aClaimed = a.claim_status === "claimed";
  const bClaimed = b.claim_status === "claimed";
  if (aClaimed !== bClaimed) return aClaimed ? -1 : 1;
  return a.name.localeCompare(b.name, "de");
}

export async function getCompany(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*, trades(id, name, slug)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as CompanyWithTrade;
}

export async function getCompanyBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*, trades(id, name, slug)")
    .eq("slug", slug)
    .eq("public_visible", true)
    .single();

  if (error) throw error;
  return data as CompanyWithTrade;
}

export async function getCompanyBySlugForMetadata(slug: string) {
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

export async function getCompanyClaims() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_claims")
    .select("*, companies(id, name, slug, city, postal_code, claim_status)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as CompanyClaimWithCompany[];
}

export async function getLatestCompanyProfileUpdateSubmission(companyId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_submissions")
    .select("*")
    .eq("source", `profile-update:${companyId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeSubmission(data);
}

export async function getCompanySubmissions(params?: {
  status?: string;
  primaryTrade?: string;
  location?: string;
  query?: string;
  founder?: string;
  verification?: string;
  type?: string;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("company_submissions").select("*").order("created_at", { ascending: false });

  if (params?.status) query = query.eq("status", params.status);
  if (params?.primaryTrade) query = query.eq("primary_trade", params.primaryTrade);
  if (params?.query) query = query.ilike("company_name", `%${params.query.trim()}%`);
  if (params?.location) {
    const value = params.location.trim();
    query = query.or(`city.ilike.%${value}%,postal_code.ilike.%${value}%`);
  }
  if (params?.founder === "true") query = query.eq("wants_founder_verification", true);
  if (params?.verification === "true") query = query.eq("wants_founder_verification", true);
  if (params?.type === "claim") query = query.ilike("source", "claim:%");
  if (params?.type === "new") query = query.eq("source", "betrieb-eintragen");

  const { data, error } = await query;
  if (error) throw error;
  return normalizeSubmissions(data || []);
}

export async function getResearchImportBatches() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("research_import_batches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ResearchImportBatch[];
}

export async function getResearchCandidates(params?: {
  batchId?: string;
  status?: string;
  trade?: string;
  location?: string;
  query?: string;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("research_company_candidates")
    .select("*, research_import_batches(id, name, status), companies:companies!research_company_candidates_company_id_fkey(id, name, slug, city, postal_code)")
    .order("created_at", { ascending: false });

  if (params?.batchId) query = query.eq("batch_id", params.batchId);
  if (params?.status) query = query.eq("status", params.status);
  if (params?.trade) query = query.eq("trade_slug", params.trade);
  if (params?.query) query = query.ilike("company_name", `%${params.query.trim()}%`);
  if (params?.location) {
    const value = params.location.trim();
    query = query.or(`city.ilike.%${value}%,postal_code.ilike.%${value}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ResearchCompanyCandidate[];
}

export async function getResearchCandidate(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("research_company_candidates")
    .select("*, research_import_batches(id, name, status), companies:companies!research_company_candidates_company_id_fkey(id, name, slug, city, postal_code)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ResearchCompanyCandidate;
}

export async function getResearchCandidateDuplicates(candidate: ResearchCompanyCandidate) {
  const supabase = getSupabaseAdmin();
  const conditions = [
    `name.ilike.%${candidate.company_name}%`,
    `and(postal_code.eq.${candidate.postal_code},city.ilike.%${candidate.city}%)`,
  ];

  if (candidate.website) conditions.push(`website_url.eq.${candidate.website}`);
  if (candidate.email) conditions.push(`email.eq.${candidate.email}`);

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, city, postal_code, email, website_url")
    .or(conditions.join(","))
    .limit(10);

  if (error) return [];

  return (data || []).map((company) => ({
    ...company,
    reason: duplicateReason(
      {
        company_name: candidate.company_name,
        postal_code: candidate.postal_code,
        city: candidate.city,
        email: candidate.email,
        website: candidate.website,
      } as CompanySubmission,
      company,
    ),
  })) as SubmissionDuplicate[];
}

export async function getCompanySubmission(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("company_submissions").select("*").eq("id", id).single();
  if (error) throw error;
  return normalizeSubmission(data);
}

export async function getSubmissionDuplicates(submission: CompanySubmission) {
  const supabase = getSupabaseAdmin();
  const conditions = [
    `name.ilike.%${submission.company_name}%`,
    `and(postal_code.eq.${submission.postal_code},city.ilike.%${submission.city}%)`,
  ];

  if (submission.website) conditions.push(`website_url.eq.${submission.website}`);
  if (submission.email) conditions.push(`email.eq.${submission.email}`);

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, city, postal_code, email, website_url")
    .or(conditions.join(","))
    .limit(10);

  if (error) return [];

  return (data || []).map((company) => ({
    ...company,
    reason: duplicateReason(submission, company),
  })) as SubmissionDuplicate[];
}

export async function getAllPublicCompanySlugs() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("companies").select("slug").eq("public_visible", true);

  if (error) throw error;
  return (data || []).map((item) => item.slug as string);
}

export async function getUniqueCompanySlug(baseSlug: string, existingId?: string) {
  const supabase = getSupabaseAdmin();
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    let query = supabase.from("companies").select("id").eq("slug", candidate).limit(1);
    if (existingId) query = query.neq("id", existingId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return candidate;

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function normalizeSubmissions(items: unknown[]) {
  return items.map((item) => normalizeSubmission(item));
}

function normalizeSubmission(item: unknown) {
  const raw = item as Record<string, unknown>;
  return {
    ...raw,
    secondary_trades: arrayField(raw.secondary_trades),
    selected_services: arrayField(raw.selected_services),
    specializations: arrayField(raw.specializations),
    service_regions: arrayField(raw.service_regions),
    postal_codes: arrayField(raw.postal_codes),
    service_countries: arrayField(raw.service_countries),
    memberships: arrayField(raw.memberships),
    certificates: arrayField(raw.certificates),
    manufacturer_certificates: arrayField(raw.manufacturer_certificates),
    logo_url: typeof raw.logo_url === "string" ? raw.logo_url : null,
    profile_image_url: typeof raw.profile_image_url === "string" ? raw.profile_image_url : null,
    profile_image_alt: typeof raw.profile_image_alt === "string" ? raw.profile_image_alt : null,
    contact_person_name: typeof raw.contact_person_name === "string" ? raw.contact_person_name : null,
    contact_person_role: typeof raw.contact_person_role === "string" ? raw.contact_person_role : null,
    image_consent_given: raw.image_consent_given === true,
    image_consent_timestamp: typeof raw.image_consent_timestamp === "string" ? raw.image_consent_timestamp : null,
  } as CompanySubmission;
}

function arrayField(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function duplicateReason(submission: CompanySubmission, company: { name: string; postal_code: string; city: string; email: string | null; website_url: string | null }) {
  if (company.website_url && submission.website && company.website_url === submission.website) return "gleiche Website";
  if (company.email && company.email === submission.email) return "gleiche E-Mail";
  if (company.postal_code === submission.postal_code && company.city.toLowerCase() === submission.city.toLowerCase()) return "gleiche PLZ und Ort";
  return "ähnlicher Firmenname";
}
