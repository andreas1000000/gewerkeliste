"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CompanyFormState, ImportReport } from "@/lib/types";
import type { PlannerImportState } from "@/lib/types/planner";
import { slugify } from "@/lib/slug";
import {
  importPlannerContacts as importPlannerContactsAction,
  markPlannerContactPrivate as markPlannerContactPrivateAction,
  suggestPlannerContact as suggestPlannerContactAction,
  updatePlannerProfile as updatePlannerProfileAction,
} from "@/lib/actions/planner";
import {
  approveClaim as approveClaimAction,
  approveResearchCandidate as approveResearchCandidateAction,
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
import { submitBusinessEntry as submitBusinessEntryAction } from "@/lib/actions/business-entry";
import { submitClaim as submitClaimAction } from "@/lib/actions/claims";
import { approveSubmission as approveSubmissionAction } from "@/lib/actions/submissions";
import { parseTradeName } from "@/lib/validation";

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
  return submitClaimAction(_prevState, formData);
}

export async function submitBusinessEntry(
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  return submitBusinessEntryAction(_prevState, formData);
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
