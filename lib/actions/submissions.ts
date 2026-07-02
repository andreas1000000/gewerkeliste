"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompanySubmission, getUniqueCompanySlug } from "@/lib/data";
import { companySlug } from "@/lib/slug";
import { getSupabaseAdmin } from "@/lib/supabase";
import { canonicalTradeSlug } from "@/lib/trade-taxonomy";
import type { CompanySubmission } from "@/lib/types";

type ApprovedCompany = {
  id: string;
  slug: string;
};

type SubmissionTradeAssignment = {
  id: string;
  slug: string;
  primary: boolean;
};

type ExistingCompanyMatch = ApprovedCompany & {
  name: string;
  postal_code: string;
  city: string;
  email: string | null;
  website_url: string | null;
};

export async function approveSubmission(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/submissions?error=missing-submission-id");

  const publicVisible = formData.get("public_visible") === "on";
  const verified = formData.get("verified") === "on";

  try {
    const submission = await getCompanySubmission(id);
    if (submission.status === "approved") {
      throw new Error("Diese Einreichung wurde bereits freigegeben.");
    }

    const company = await promoteSubmissionToCompany(submission, { publicVisible, verified });

    revalidatePath("/admin/submissions");
    revalidatePath(`/admin/submissions/${id}`);
    revalidatePath("/betriebe");
    revalidatePath("/suche");
    revalidatePath("/");
    revalidatePath(`/firma/${company.slug}`);

    redirect(`/admin/submissions/${id}?approved=${company.slug}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message = readableApprovalError(error);
    redirect(`/admin/submissions/${id}?error=${encodeURIComponent(message)}`);
  }
}

async function promoteSubmissionToCompany(
  submission: CompanySubmission,
  options: { publicVisible: boolean; verified: boolean },
): Promise<ApprovedCompany> {
  const supabase = getSupabaseAdmin();
  const claimCompanyId = claimCompanyIdFromSource(submission.source);
  const tradeSlug = canonicalTradeSlug(submission.primary_trade);
  const { data: trade, error: tradeError } = await supabase.from("trades").select("id").eq("slug", tradeSlug).single();

  if (tradeError || !trade) {
    throw tradeError || new Error(`Gewerk fehlt in Supabase: ${tradeSlug}`);
  }

  const updateOrInsert = companyPayload(submission, trade.id, options);
  const existingCompany = claimCompanyId ? null : await findExistingCompanyForSubmission(submission);
  const company = claimCompanyId
    ? await updateClaimedCompany(claimCompanyId, updateOrInsert)
    : existingCompany
      ? await updateClaimedCompany(existingCompany.id, updateOrInsert)
    : await createSubmittedCompany(submission, updateOrInsert);
  const tradeAssignments = await getSubmissionTradeAssignments(submission, { id: trade.id, slug: tradeSlug });

  await upsertCompanyTradeRelations(company.id, tradeAssignments, submission);
  await insertSubmissionSource(company.id, submission);

  const { error: submissionError } = await supabase
    .from("company_submissions")
    .update({ status: "approved" })
    .eq("id", submission.id)
    .neq("status", "approved");
  if (submissionError) throw submissionError;

  return company;
}

function companyPayload(
  submission: CompanySubmission,
  tradeId: string,
  options: { publicVisible: boolean; verified: boolean },
) {
  const verificationDate = options.verified ? new Date().toISOString() : null;

  return {
    trade_id: tradeId,
    description: companyDescription(submission),
    contact_name: [submission.contact_first_name, submission.contact_last_name].filter(Boolean).join(" ") || null,
    email: submission.email,
    phone: submission.phone,
    website_url: normalizeSubmissionWebsite(submission.website),
    street: [submission.street, submission.house_number].filter(Boolean).join(" ") || null,
    city: submission.city,
    postal_code: submission.postal_code,
    latitude: 0,
    longitude: 0,
    claim_status: "claimed",
    verified: options.verified,
    profile_status: options.verified ? "verified" : "claimed",
    verification_date: verificationDate,
    public_visible: options.publicVisible,
    logo_url: submission.logo_url || null,
    profile_image_url: submission.profile_image_url || null,
    profile_image_alt: submission.profile_image_alt || null,
    contact_person_name: submission.contact_person_name,
    contact_person_role: submission.contact_person_role,
    service_radius_km: submission.service_radius_km || null,
    service_regions: submission.service_regions,
    service_postal_codes: submission.postal_codes,
    references_text: submission.references_text || null,
    memberships: submission.memberships,
    certificates: submission.certificates,
    manufacturer_certificates: submission.manufacturer_certificates,
  };
}

async function updateClaimedCompany(
  companyId: string,
  payload: ReturnType<typeof companyPayload>,
): Promise<ApprovedCompany> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("companies")
    .select(
      "claim_status, verified, profile_status, verification_date, logo_url, profile_image_url, profile_image_alt, contact_person_name, contact_person_role, service_radius_km, service_regions, service_postal_codes, references_text, memberships, certificates, manufacturer_certificates",
    )
    .eq("id", companyId)
    .single();
  if (existingError || !existing) {
    throw existingError || new Error("Bestehender Betriebseintrag konnte nicht gelesen werden.");
  }

  const updatePayload = {
    ...payload,
    claim_status: existing.claim_status === "claimed" && !payload.verified ? "claimed" : payload.claim_status,
    verified: payload.verified || Boolean(existing.verified),
    profile_status: payload.verified ? "verified" : existing.profile_status || payload.profile_status,
    verification_date: payload.verified ? payload.verification_date : existing.verification_date || null,
    logo_url: payload.logo_url || existing.logo_url || null,
    profile_image_url: payload.profile_image_url || existing.profile_image_url || null,
    profile_image_alt: payload.profile_image_alt || existing.profile_image_alt || null,
    contact_person_name: payload.contact_person_name || existing.contact_person_name || null,
    contact_person_role: payload.contact_person_role || existing.contact_person_role || null,
    service_radius_km: payload.service_radius_km || existing.service_radius_km || null,
    service_regions: payload.service_regions.length ? payload.service_regions : existing.service_regions || [],
    service_postal_codes: payload.service_postal_codes.length ? payload.service_postal_codes : existing.service_postal_codes || [],
    references_text: payload.references_text || existing.references_text || null,
    memberships: payload.memberships.length ? payload.memberships : existing.memberships || [],
    certificates: payload.certificates.length ? payload.certificates : existing.certificates || [],
    manufacturer_certificates: payload.manufacturer_certificates.length
      ? payload.manufacturer_certificates
      : existing.manufacturer_certificates || [],
  };

  const { data, error } = await supabase.from("companies").update(updatePayload).eq("id", companyId).select("id, slug").single();
  if (error || !data) throw error || new Error("Bestehender Betriebseintrag konnte nicht aktualisiert werden.");
  return data;
}

async function createSubmittedCompany(
  submission: CompanySubmission,
  payload: ReturnType<typeof companyPayload>,
): Promise<ApprovedCompany> {
  const supabase = getSupabaseAdmin();
  const slug = await getUniqueCompanySlug(companySlug(submission.company_name, submission.postal_code, submission.city));
  const { data, error } = await supabase
    .from("companies")
    .insert({
      ...payload,
      name: submission.company_name,
      slug,
    })
    .select("id, slug")
    .single();

  if (error || !data) throw error || new Error("Betriebseintrag konnte nicht angelegt werden.");
  return data;
}

async function findExistingCompanyForSubmission(submission: CompanySubmission): Promise<ExistingCompanyMatch | null> {
  const supabase = getSupabaseAdmin();
  const expectedSlug = companySlug(submission.company_name, submission.postal_code, submission.city);
  const { data: slugMatch, error: slugError } = await supabase
    .from("companies")
    .select("id, slug, name, postal_code, city, email, website_url")
    .eq("slug", expectedSlug)
    .maybeSingle();

  if (!slugError && slugMatch) return slugMatch as ExistingCompanyMatch;

  const { data, error } = await supabase
    .from("companies")
    .select("id, slug, name, postal_code, city, email, website_url")
    .eq("postal_code", submission.postal_code)
    .limit(50);

  if (error || !data?.length) return null;

  const normalizedSubmissionName = normalizeCompanyMatchValue(submission.company_name);
  const normalizedWebsite = normalizeUrlForMatch(submission.website);
  const normalizedEmail = normalizeEmailForMatch(submission.email);

  const matches = (data as ExistingCompanyMatch[]).filter((company) => {
    if (company.slug === expectedSlug) return true;
    if (
      company.postal_code === submission.postal_code &&
      normalizeCompanyMatchValue(company.city) === normalizeCompanyMatchValue(submission.city) &&
      normalizeCompanyMatchValue(company.name) === normalizedSubmissionName
    ) {
      return true;
    }
    if (normalizedWebsite && normalizedWebsite === normalizeUrlForMatch(company.website_url)) return true;
    if (normalizedEmail && normalizedEmail === normalizeEmailForMatch(company.email)) return true;
    return false;
  });

  return matches[0] || null;
}

async function getSubmissionTradeAssignments(
  submission: CompanySubmission,
  primaryTrade: { id: string; slug: string },
): Promise<SubmissionTradeAssignment[]> {
  const supabase = getSupabaseAdmin();
  const secondarySlugs = submission.secondary_trades
    .map((slug) => canonicalTradeSlug(slug))
    .filter((slug, index, values) => slug && slug !== primaryTrade.slug && values.indexOf(slug) === index);

  if (!secondarySlugs.length) return [{ ...primaryTrade, primary: true }];

  const { data, error } = await supabase.from("trades").select("id, slug").in("slug", secondarySlugs);
  const secondaryTrades: SubmissionTradeAssignment[] =
    error || !data ? [] : data.map((trade) => ({ id: trade.id, slug: trade.slug, primary: false }));

  return [{ ...primaryTrade, primary: true }, ...secondaryTrades];
}

async function upsertCompanyTradeRelations(
  companyId: string,
  trades: SubmissionTradeAssignment[],
  submission: CompanySubmission,
) {
  await Promise.all(trades.map((trade) => upsertCompanyTradeRelation(companyId, trade, submission)));
}

async function upsertCompanyTradeRelation(
  companyId: string,
  trade: SubmissionTradeAssignment,
  submission: CompanySubmission,
) {
  const supabase = getSupabaseAdmin();
  const row = {
    company_id: companyId,
    trade_id: trade.id,
    confidence_score: 100,
    source: "admin-submission-approval",
    evidence: [
      trade.primary ? submission.primary_trade : trade.slug,
      ...submission.selected_services,
    ].filter(Boolean).join(", ") || null,
    status: "admin_confirmed",
    visibility_level: "basis_public",
  };

  const { error } = await supabase.from("company_trades").upsert(row, { onConflict: "company_id,trade_id" });
  if (!error) return;

  const { error: fallbackError } = await supabase
    .from("company_trades")
    .upsert(
      {
        company_id: companyId,
        trade_id: trade.id,
        confidence_score: 100,
        source: "admin-submission-approval",
        evidence: row.evidence,
      },
      { onConflict: "company_id,trade_id" },
    );
  if (fallbackError) throw fallbackError;
}

async function insertSubmissionSource(companyId: string, submission: CompanySubmission) {
  const supabase = getSupabaseAdmin();
  await supabase.from("company_sources").insert({
    company_id: companyId,
    source_type: "business_submission",
    source_url: null,
    title: "Betriebseintrag",
    snippet: `${submission.company_name} hat den Betriebseintrag eingereicht.`,
    content: JSON.stringify({
      submission_id: submission.id,
      logo_uploaded: Boolean(submission.logo_url),
      profile_image_uploaded: Boolean(submission.profile_image_url),
      profile_image_publication: submission.profile_image_url ? "copied_to_company_profile_after_admin_approval" : "not_uploaded",
    }),
  });
}

function companyDescription(submission: CompanySubmission) {
  return [
    submission.short_description,
    submission.description,
    submission.selected_services.length ? `Leistungen: ${submission.selected_services.join(", ")}` : "",
    submission.service_regions.length ? `Tätigkeitsgebiet: ${submission.service_regions.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function claimCompanyIdFromSource(source: string) {
  const match = source.match(/^(?:claim|profile-update):([0-9a-f-]{36})$/i);
  return match?.[1] || null;
}

function normalizeSubmissionWebsite(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeUrlForMatch(value: string | null) {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function normalizeEmailForMatch(value: string | null) {
  return value?.trim().toLowerCase() || "";
}

function normalizeCompanyMatchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\b(gmbh|gbr|gdbr|ug|ag|kg|ohg|ek|e k|mbh|co|firma)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function readableApprovalError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  const message = (error as { message?: unknown })?.message;
  if (typeof message === "string" && message) return message;
  return "Der Betrieb konnte nicht freigegeben werden. Die Einreichung bleibt im Review.";
}

function isRedirectError(error: unknown) {
  const candidate = error as { digest?: unknown; message?: unknown };
  const digest = typeof candidate?.digest === "string" ? candidate.digest : "";
  const message = typeof candidate?.message === "string" ? candidate.message : "";
  return digest.startsWith("NEXT_REDIRECT") || message.includes("NEXT_REDIRECT");
}
