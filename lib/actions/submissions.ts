"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/admin-action-auth";
import { getCompanySubmission, getUniqueCompanySlug } from "@/lib/data";
import { companySlug } from "@/lib/slug";
import { normalizeSocialLink } from "@/lib/social-links";
import { getSupabaseAdmin } from "@/lib/supabase";
import { canonicalTradeSlug } from "@/lib/trade-taxonomy";
import type { CompanyPremiumSubmissionPayload, CompanySubmission } from "@/lib/types";

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
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/submissions?error=missing-submission-id");

  const publicVisible = formData.get("public_visible") === "on";
  const verified = formData.get("verified") === "on";
  const verifiedStartProfile = formData.get("verified_start_profile") === "on";

  try {
    const submission = await getCompanySubmission(id);
    if (submission.status === "approved") {
      throw new Error("Diese Einreichung wurde bereits freigegeben.");
    }
    if (submission.source.startsWith("claim:")) {
      throw new Error("Claims werden ausschließlich in der Claim-Detailprüfung freigegeben.");
    }
    if (submission.source.startsWith("owner-profile-update:")) {
      throw new Error("Owner-Profiländerungen werden ausschließlich über die geschützte Owner-Prüfung freigegeben.");
    }

    const company = await promoteSubmissionToCompany(submission, { publicVisible, verified, verifiedStartProfile });

    revalidatePath("/admin/submissions");
    revalidatePath(`/admin/submissions/${id}`);
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

export async function approveOwnerSubmission(formData: FormData) {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/submissions?error=missing-submission-id");

  const supabase = getSupabaseAdmin();
  const { data: companyId, error } = await supabase.rpc("approve_company_profile_submission", {
    p_submission_id: id,
    p_admin_actor: "basic-auth-admin",
  });
  if (error) redirect(`/admin/submissions/${id}?error=${encodeURIComponent(ownerSubmissionError(error.message))}`);

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
  revalidatePath("/mein-betrieb");
  if (companyId) revalidatePath(`/mein-betrieb/${companyId}`);
  redirect(`/admin/submissions/${id}?owner_approved=1`);
}

export async function decideOwnerSubmission(formData: FormData) {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["needs_info", "rejected"].includes(status)) redirect(`/admin/submissions/${id}?error=unsupported-owner-decision`);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("decide_company_profile_submission", {
    p_submission_id: id,
    p_status: status,
    p_reason: String(formData.get("reason") || "").trim() || null,
    p_admin_actor: "basic-auth-admin",
  });
  if (error) redirect(`/admin/submissions/${id}?error=${encodeURIComponent(ownerSubmissionError(error.message))}`);

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
  redirect(`/admin/submissions/${id}?owner_decided=${status}`);
}

async function promoteSubmissionToCompany(
  submission: CompanySubmission,
  options: { publicVisible: boolean; verified: boolean; verifiedStartProfile: boolean },
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
  await publishApprovedSocialLinks(company.id, submission);
  await publishApprovedPremiumSubmission(company.id, submission, options);

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
  options: { publicVisible: boolean; verified: boolean; verifiedStartProfile: boolean },
) {
  const verificationDate = options.verified ? new Date().toISOString() : null;
  const profilePackage = options.verified && options.verifiedStartProfile ? "verified_start" : "basis";

  return {
    name: companyNameWithLegalForm(submission.company_name, submission.legal_form),
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
    claim_status: "unclaimed",
    verified: options.verified,
    profile_package: profilePackage,
    profile_status: options.verified ? "verified" : "claimed",
    verification_date: verificationDate,
    premium_started_at: profilePackage === "verified_start" ? verificationDate : null,
    premium_expires_at: profilePackage === "verified_start" ? addMonthsIso(12) : null,
    public_visible: options.publicVisible,
    logo_url: submission.logo_url || null,
    profile_image_url: submission.image_consent_given ? submission.profile_image_url || null : null,
    profile_image_alt: submission.image_consent_given ? submission.profile_image_alt || null : null,
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
      "name, claim_status, verified, profile_package, profile_status, verification_date, premium_started_at, premium_expires_at, logo_url, profile_image_url, profile_image_alt, contact_person_name, contact_person_role, service_radius_km, service_regions, service_postal_codes, references_text, memberships, certificates, manufacturer_certificates",
    )
    .eq("id", companyId)
    .single();
  if (existingError || !existing) {
    throw existingError || new Error("Bestehender Betriebseintrag konnte nicht gelesen werden.");
  }

  const updatePayload = {
    ...payload,
    name: payload.name || existing.name,
    claim_status: existing.claim_status === "claimed" ? "claimed" : "unclaimed",
    verified: payload.verified || Boolean(existing.verified),
    profile_package: payload.profile_package === "verified_start" ? "verified_start" : existing.profile_package || payload.profile_package,
    profile_status: payload.verified ? "verified" : existing.profile_status || payload.profile_status,
    verification_date: payload.verified ? payload.verification_date : existing.verification_date || null,
    premium_started_at: payload.profile_package === "verified_start" ? payload.premium_started_at : existing.premium_started_at || null,
    premium_expires_at: payload.profile_package === "verified_start" ? payload.premium_expires_at : existing.premium_expires_at || null,
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
      slug,
    })
    .select("id, slug")
    .single();

  if (error || !data) throw error || new Error("Betriebseintrag konnte nicht angelegt werden.");
  return data;
}

function companyNameWithLegalForm(companyName: string, legalForm: string | null) {
  const name = companyName.trim();
  const form = legalForm?.trim();
  if (!form) return name;
  const normalizedName = normalizeLegalFormMatchValue(name);
  const normalizedForm = normalizeLegalFormMatchValue(form);
  if (!normalizedForm || normalizedName.split(" ").includes(normalizedForm)) return name;
  return `${name} ${form}`;
}

function normalizeLegalFormMatchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

async function publishApprovedPremiumSubmission(
  companyId: string,
  submission: CompanySubmission,
  options: { verifiedStartProfile: boolean },
) {
  const payload = normalizePremiumPayload(submission.premium_submission_payload);
  if (!options.verifiedStartProfile || !payload?.requested) return;

  const references = payload.references
    .filter((item) => item.title || item.description || item.services.length)
    .map((item, index) => ({
      title: item.title || `Referenz ${index + 1}`,
      project_type: item.project_type || null,
      location: item.location || null,
      year: item.year || null,
      period: item.period || null,
      description: item.description || null,
      services: item.services || [],
      client_type: item.client_type || null,
      client_name: item.client_public ? item.client_name || null : null,
      client_public: item.client_public === true,
      challenge: item.challenge || null,
      solution: item.solution || null,
      review_status: "approved",
      sort_order: item.sort_order || index + 1,
    }));

  await replacePremiumRows("company_contacts", companyId, payload.contacts
    .filter((item) => item.name || item.role || item.phone || item.email || item.image_file)
    .map((item, index) => ({
      name: item.name || `Ansprechpartner ${index + 1}`,
      role: item.role || null,
      phone: item.phone || null,
      email: item.email || null,
      image_url: item.image_file?.storage_path || null,
      is_primary: index === 0,
      review_status: "approved",
      sort_order: item.sort_order || index + 1,
    })));

  await replacePremiumRows("company_team_members", companyId, payload.team_members
    .filter((item) => item.name || item.role || item.description || item.image_file)
    .map((item, index) => ({
      name: item.name || `Teammitglied ${index + 1}`,
      role: item.role || null,
      description: item.description || null,
      image_url: item.image_file?.storage_path || null,
      review_status: "approved",
      sort_order: item.sort_order || index + 1,
    })));

  const insertedReferences = await replacePremiumRows("company_references", companyId, references, "id,title,sort_order") as Array<{ id: string; title: string }>;
  const referenceIdByTitle = new Map(
    insertedReferences
      .filter((item) => item.id && item.title)
      .map((item) => [item.title.trim().toLowerCase(), item.id]),
  );

  await replacePremiumRows("company_reference_media", companyId, payload.reference_media
    .filter((item) => item.file?.storage_path)
    .map((item, index) => ({
      reference_id: item.reference_title ? referenceIdByTitle.get(item.reference_title.trim().toLowerCase()) || null : null,
      file_url: item.file?.storage_path,
      alt_text: item.alt_text || null,
      caption: item.caption || item.file_note || null,
      review_status: "approved",
      sort_order: item.sort_order || index + 1,
    })));

  await replacePremiumRows("company_certificates", companyId, payload.certificates
    .filter((item) => item.title || item.issuer || item.description || item.file)
    .map((item, index) => ({
      title: item.title || `Nachweis ${index + 1}`,
      issuer: item.issuer || null,
      issued_at: null,
      valid_until: normalizedDate(item.valid_until),
      description: item.description || item.file_note || null,
      file_url: item.file?.storage_path || null,
      review_status: "approved",
      sort_order: item.sort_order || index + 1,
    })));
}

async function publishApprovedSocialLinks(companyId: string, submission: CompanySubmission) {
  const payload = normalizePremiumPayload(submission.premium_submission_payload);
  if (!payload?.social_links.length) return;

  const rows = payload.social_links
    .map((item, index) => {
      const normalized = normalizeSocialLink(item.platform, item.url, item.label);
      return normalized
        ? {
            platform: normalized.platform,
            url: normalized.url,
            label: normalized.label,
            review_status: "approved",
            sort_order: item.sort_order || index + 1,
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (rows.length) {
    await replacePremiumRows("company_social_links", companyId, rows);
  }
}

async function replacePremiumRows(
  table: string,
  companyId: string,
  rows: Array<Record<string, unknown>>,
  selectColumns = "",
): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase.from(table).delete().eq("company_id", companyId);
  if (deleteError) throw deleteError;
  if (!rows.length) return [];

  const insertQuery = supabase.from(table).insert(rows.map((row) => ({ ...row, company_id: companyId })));
  const { data, error } = selectColumns
    ? await insertQuery.select(selectColumns)
    : await insertQuery.select("id");
  if (error) throw error;
  return (data || []) as Array<Record<string, unknown>>;
}

function normalizePremiumPayload(payload: CompanyPremiumSubmissionPayload | null): CompanyPremiumSubmissionPayload | null {
  if (!payload) return null;
  const hasContent = Boolean(
    payload.requested ||
      payload.contacts?.length ||
      payload.team_members?.length ||
      payload.references?.length ||
      payload.reference_media?.length ||
      payload.certificates?.length ||
      payload.social_links?.length ||
      payload.profile_sections?.length ||
      payload.notes,
  );
  if (!hasContent) return null;
  return {
    requested: Boolean(payload.requested),
    request_label: payload.request_label || null,
    contacts: Array.isArray(payload.contacts) ? payload.contacts : [],
    team_members: Array.isArray(payload.team_members) ? payload.team_members : [],
    references: Array.isArray(payload.references) ? payload.references : [],
    reference_media: Array.isArray(payload.reference_media) ? payload.reference_media : [],
    certificates: Array.isArray(payload.certificates) ? payload.certificates : [],
    social_links: Array.isArray(payload.social_links) ? payload.social_links : [],
    profile_sections: Array.isArray(payload.profile_sections) ? payload.profile_sections : [],
    notes: payload.notes || null,
  };
}

function normalizedDate(value: string | null) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
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

function addMonthsIso(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
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

function ownerSubmissionError(message: string) {
  if (message.includes("active_membership_required")) return "Der Owner-Zugang ist nicht mehr aktiv.";
  if (message.includes("owner_submission_not_found")) return "Diese Einreichung ist keine Owner-Profiländerung.";
  return "Die Owner-Einreichung konnte nicht sicher entschieden werden.";
}
