"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CompanyFormState, ImportReport } from "@/lib/types";
import type { PlannerImportState } from "@/lib/types/planner";
import { companySlug, slugify } from "@/lib/slug";
import { getCompany, getCompanySubmission, getResearchCandidate, getUniqueCompanySlug } from "@/lib/data";
import { canonicalTradeSlug, findTaxonomyTrade, tradeTaxonomy } from "@/lib/trade-taxonomy";
import {
  importPlannerContacts as importPlannerContactsAction,
  markPlannerContactPrivate as markPlannerContactPrivateAction,
  suggestPlannerContact as suggestPlannerContactAction,
  updatePlannerProfile as updatePlannerProfileAction,
} from "@/lib/actions/planner";
import {
  approveClaim as approveClaimAction,
  approveResearchCandidate as approveResearchCandidateAction,
  approveSubmission as approveSubmissionAction,
  createCompany as createCompanyAction,
  deleteCompany as deleteCompanyAction,
  deletePlannerContact as deletePlannerContactAction,
  deleteTrade as deleteTradeAction,
  importCompanies as importCompaniesAction,
  preparePlannerInvitation as preparePlannerInvitationAction,
  publishClaimSuggestion as publishClaimSuggestionAction,
  rejectClaimSuggestion as rejectClaimSuggestionAction,
  sendPlannerInvitationDryRun as sendPlannerInvitationDryRunAction,
  updateCompany as updateCompanyAction,
} from "@/lib/actions/approval-required";
import {
  claimSchema,
  csvCompanySchema,
  flattenZodErrors,
  parseBusinessSubmissionForm,
  parseCompanyForm,
  parseTradeName,
} from "@/lib/validation";

export async function importPlannerContacts(
  prevState: PlannerImportState,
  formData: FormData,
): Promise<PlannerImportState> {
  return importPlannerContactsAction(prevState, formData);
}

export async function markPlannerContactPrivate(formData: FormData) {
  return markPlannerContactPrivateAction(formData);
}

export async function suggestPlannerContact(formData: FormData) {
  return suggestPlannerContactAction(formData);
}

export async function updatePlannerProfile(formData: FormData) {
  return updatePlannerProfileAction(formData);
}

export async function deletePlannerContact(formData: FormData) {
  return deletePlannerContactAction(formData);
}

export async function preparePlannerInvitation(formData: FormData) {
  return preparePlannerInvitationAction(formData);
}

export async function sendPlannerInvitationDryRun(formData: FormData) {
  return sendPlannerInvitationDryRunAction(formData);
}

export async function publishClaimSuggestion(formData: FormData) {
  return publishClaimSuggestionAction(formData);
}

export async function rejectClaimSuggestion(formData: FormData) {
  return rejectClaimSuggestionAction(formData);
}

export async function createCompany(_prevState: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  return createCompanyAction(formData);
}

export async function updateCompany(
  id: string,
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  formData.set("id", id);
  return updateCompanyAction(formData);
}

export async function submitClaim(_prevState: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  const parsed = claimSchema.safeParse({
    company_id: String(formData.get("company_id") || ""),
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    message: String(formData.get("message") || ""),
    support_contribution: String(formData.get("support_contribution") || "none"),
    support_custom_amount: String(formData.get("support_custom_amount") || ""),
    support_invoice_requested: formData.get("support_invoice_requested") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Bitte pruefe die markierten Felder.",
      fieldErrors: flattenZodErrors(parsed.error),
    };
  }

  const supabase = getSupabaseAdmin();
  const { support_contribution, support_custom_amount, support_invoice_requested, ...claim } = parsed.data;
  const supportSummary = formatSupportContribution(
    support_contribution,
    support_custom_amount,
    support_invoice_requested,
  );
  const { error } = await supabase.from("company_claims").insert({
    ...claim,
    message: `${claim.message}\n\n---\n${supportSummary}`,
  });
  if (error) return { ok: false, message: error.message };

  const company = await getCompany(parsed.data.company_id);
  const requestedPrimaryTrade = canonicalTradeSlug(String(formData.get("primaryTrade") || company.trades?.slug || ""));
  const requestedSecondaryTrades = formData
    .getAll("secondaryTrades")
    .map((value) => canonicalTradeSlug(String(value)))
    .filter((slug) => slug && slug !== requestedPrimaryTrade && findTaxonomyTrade(slug))
    .slice(0, 4);
  const companyTradeSlug = findTaxonomyTrade(requestedPrimaryTrade)?.slug || canonicalTradeSlug(company.trades?.slug || slugify(company.trades?.name || "fachbetrieb"));
  const { error: submissionError } = await supabase.from("company_submissions").insert({
    status: "submitted",
    company_name: company.name,
    legal_form: null,
    website: company.website_url,
    phone: company.phone,
    email: claim.email,
    contact_email: claim.email,
    contact_first_name: claim.name,
    contact_last_name: null,
    contact_role: "Eintragsübernahme",
    contact_person_email: claim.email,
    contact_person_phone: claim.phone,
    street: company.street,
    house_number: null,
    postal_code: company.postal_code,
    city: company.city,
    region: null,
    country: "Deutschland",
    primary_trade: companyTradeSlug,
    secondary_trades: requestedSecondaryTrades,
    selected_services: [],
    specializations: [],
    service_radius_km: 50,
    service_regions: [company.city],
    postal_codes: [company.postal_code],
    service_countries: ["Deutschland"],
    short_description: company.description.slice(0, 240) || `${company.trades?.name || "Fachbetrieb"} in ${company.city}`,
    description: `Claim-Anfrage für bestehenden Betriebseintrag.\n\n${claim.message}\n\n${supportSummary}`,
    references_text: `Bestehende Firmen-ID: ${company.id}`,
    memberships: [],
    certificates: [],
    manufacturer_certificates: [],
    wants_founder_verification: true,
    wants_support_contribution: support_contribution !== "none",
    support_contribution_amount:
      support_contribution === "none"
        ? null
        : support_contribution === "custom"
          ? support_custom_amount
          : Number(support_contribution),
    support_invoice_requested,
    consent_authorized: false,
    consent_data_correct: false,
    consent_privacy: true,
    source: `claim:${company.id}`,
  });
  if (submissionError) return { ok: false, message: submissionError.message };

  await supabase.from("companies").update({ claim_status: "pending" }).eq("id", parsed.data.company_id).neq("claim_status", "claimed");

  revalidatePath("/");
  revalidatePath("/suche");
  revalidatePath("/admin/claims");
  revalidatePath("/admin/submissions");
  return { ok: true, message: "Anfrage wurde gespeichert. Es wurde keine Zahlung ausgelöst." };
}

export async function submitBusinessEntry(
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const parsed = parseBusinessSubmissionForm(formData);
  if (parsed.state) return parsed.state;

  const input = parsed.data;
  if (!input) return { ok: false, message: "Ungueltige Eingabe." };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_submissions")
    .insert({
      status: "submitted",
      company_name: input.companyName,
      legal_form: input.legalForm,
      website: input.website,
      phone: input.phone,
      email: input.email,
      contact_email: input.contactEmail,
      contact_first_name: input.contactFirstName,
      contact_last_name: input.contactLastName,
      contact_role: input.contactRole,
      contact_person_email: input.contactPersonEmail,
      contact_person_phone: input.contactPersonPhone,
      street: input.street,
      house_number: input.houseNumber,
      postal_code: input.postalCode,
      city: input.city,
      region: input.region,
      country: input.country,
      primary_trade: input.primaryTrade,
      secondary_trades: input.secondaryTrades,
      selected_services: input.selectedServices,
      specializations: input.additionalSpecializations
        ? [...input.specializations, input.additionalSpecializations]
        : input.specializations,
      service_radius_km: input.serviceRadiusKm,
      service_regions: input.serviceRegions,
      postal_codes: input.postalCodes,
      service_countries: input.serviceCountries,
      short_description: input.shortDescription,
      description: input.description,
      references_text: input.referencesText,
      memberships: input.memberships,
      certificates: input.certificates,
      manufacturer_certificates: input.manufacturerCertificates,
      wants_founder_verification: input.wantsFounderVerification,
      wants_support_contribution: input.supportContribution !== "none",
      support_contribution_amount:
        input.supportContribution === "none"
          ? null
          : input.supportContribution === "custom"
            ? input.supportCustomAmount
            : Number(input.supportContribution),
      support_invoice_requested: input.supportInvoiceRequested,
      consent_authorized: input.consentAuthorized,
      consent_data_correct: input.consentDataCorrect,
      consent_privacy: input.consentPrivacy,
      source: "betrieb-eintragen",
    })
    .select("id")
    .single();

  if (error) {
    const missingTable = error.code === "42P01" || error.message.toLowerCase().includes("company_submissions");
    return {
      ok: false,
      message: missingTable
        ? "Die Einreichungstabelle ist noch nicht in Supabase angelegt. Die Migration liegt im Projekt bereit."
        : error.message,
    };
  }

  revalidatePath("/admin/companies");
  return {
    ok: true,
    message:
      "Vielen Dank. Ihr Betriebseintrag wurde eingereicht. Wir pruefen die Angaben und melden uns, falls Rueckfragen bestehen.",
    fieldErrors: data?.id ? { submissionId: String(data.id) } : undefined,
  };
}

function formatSupportContribution(contribution: "none" | "49" | "99" | "199" | "custom", customAmount: number | null, invoiceRequested: boolean) {
  const amount =
    contribution === "none"
      ? "Ohne freiwilligen Aufbau-Beitrag"
      : contribution === "custom"
        ? `${customAmount || 0} EUR freiwilliger Aufbau-Beitrag`
        : `${contribution} EUR freiwilliger Aufbau-Beitrag`;

  return [
    "Gründungsphase: Verifizierung ohne Gebühr",
    `Unterstützungsoption: ${amount}`,
    `Rechnung auf Wunsch: ${invoiceRequested ? "ja" : "nein"}`,
    "Hinweis: Der freiwillige Aufbau-Beitrag hat keinen Einfluss auf Prüfung, Darstellung oder Verifizierung des Eintrags.",
    "Zahlungsstatus: keine Zahlung ausgelöst",
  ].join("\n");
}

export async function approveClaim(formData: FormData) {
  return approveClaimAction(formData);
}

export async function rejectClaim(formData: FormData) {
  const claimId = String(formData.get("claim_id") || "");
  if (!claimId) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("company_claims")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", claimId);
  if (error) throw error;

  revalidatePath("/admin/claims");
}

export async function setSubmissionStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const adminNotes = String(formData.get("admin_notes") || "").trim();
  if (!id || !["submitted", "in_review", "needs_info", "approved", "rejected"].includes(status)) return;

  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = { status };
  if (adminNotes) update.admin_notes = adminNotes;
  const { error } = await supabase.from("company_submissions").update(update).eq("id", id);

  if (error && "admin_notes" in update) {
    const { error: fallbackError } = await supabase.from("company_submissions").update({ status }).eq("id", id);
    if (fallbackError) throw fallbackError;
  } else if (error) {
    throw error;
  }

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
}

export async function updateSubmission(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const update = {
    company_name: getFormString(formData, "company_name"),
    legal_form: nullableFormString(formData, "legal_form"),
    website: nullableFormString(formData, "website"),
    phone: nullableFormString(formData, "phone"),
    email: getFormString(formData, "email"),
    street: nullableFormString(formData, "street"),
    house_number: nullableFormString(formData, "house_number"),
    postal_code: getFormString(formData, "postal_code"),
    city: getFormString(formData, "city"),
    region: nullableFormString(formData, "region"),
    country: getFormString(formData, "country") || "Deutschland",
    primary_trade: getFormString(formData, "primary_trade"),
    secondary_trades: splitAdminList(getFormString(formData, "secondary_trades")),
    selected_services: splitAdminList(getFormString(formData, "selected_services")),
    service_radius_km: Number(getFormString(formData, "service_radius_km") || 50),
    service_regions: splitAdminList(getFormString(formData, "service_regions")),
    postal_codes: splitAdminList(getFormString(formData, "postal_codes")),
    short_description: getFormString(formData, "short_description"),
    description: nullableFormString(formData, "description"),
  };

  const { error } = await supabase.from("company_submissions").update(update).eq("id", id).neq("status", "approved");
  if (error) throw error;

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
}

export async function approveSubmission(formData: FormData) {
  return approveSubmissionAction(formData);
}

export async function setResearchCandidateStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const adminNotes = nullableFormString(formData, "admin_notes");
  const rejectedReason = nullableFormString(formData, "rejected_reason");
  if (!id || !["found", "validated", "duplicate", "rejected"].includes(status)) return;

  const update: Record<string, unknown> = { status };
  if (adminNotes) update.admin_notes = adminNotes;
  if (rejectedReason) update.rejected_reason = rejectedReason;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("research_company_candidates")
    .update(update)
    .eq("id", id)
    .neq("status", "approved");
  if (error) throw error;

  revalidatePath("/admin/research-imports");
  revalidatePath(`/admin/research-imports/${id}`);
}

export async function approveResearchCandidate(formData: FormData) {
  return approveResearchCandidateAction(formData);
}

function claimCompanyIdFromSource(source: string) {
  const match = source.match(/^claim:([0-9a-f-]{36})$/i);
  return match?.[1] || null;
}

export async function importCompanies(_prevState: ImportReport, formData: FormData): Promise<ImportReport> {
  return importCompaniesAction(formData);
}

export async function deleteCompany(formData: FormData) {
  return deleteCompanyAction(formData);
}

export async function createTrade(formData: FormData) {
  const parsed = parseTradeName(formData);
  if (parsed.error || !parsed.name) {
    redirect(`/trades?error=${encodeURIComponent(parsed.error || "Ungueltiger Name")}`);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("trades").insert({
    name: parsed.name,
    slug: slugify(parsed.name),
  });

  if (error) {
    redirect(`/trades?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/trades");
  revalidatePath("/");
}

export async function deleteTrade(formData: FormData) {
  return deleteTradeAction(formData);
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""]));
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableFormString(formData: FormData, key: string) {
  const value = getFormString(formData, key);
  return value || null;
}

function splitAdminList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSubmissionWebsite(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function tradeNameFromSlug(slug: string) {
  const taxonomyTrade = tradeTaxonomy.find((trade) => trade.slug === slug);
  if (taxonomyTrade) return taxonomyTrade.name;

  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
