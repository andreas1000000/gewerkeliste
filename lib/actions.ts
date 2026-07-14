"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-action-auth";
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
import {
  approveClaim as approveClaimOwnershipAction,
  decideClaim,
  revokeMembership,
} from "@/lib/actions/claim-admin";
import { submitClaim as submitClaimAction } from "@/lib/actions/claims";
import {
  approveOwnerSubmission as approveOwnerSubmissionAction,
  approveSubmission as approveSubmissionActionFromData,
  decideOwnerSubmission as decideOwnerSubmissionAction,
} from "@/lib/actions/submissions";
import { parseTradeName } from "@/lib/validation";

export async function importPlannerContacts(
  prevState: PlannerImportState,
  formData: FormData,
): Promise<PlannerImportState> {
  await requireAdminAction();
  return importPlannerContactsAction(prevState, formData);
}

export async function markPlannerContactPrivate(formData: FormData) {
  await requireAdminAction();
  return markPlannerContactPrivateAction(formData);
}

export async function suggestPlannerContact(formData: FormData) {
  await requireAdminAction();
  return suggestPlannerContactAction(formData);
}

export async function updatePlannerProfile(formData: FormData) {
  await requireAdminAction();
  return updatePlannerProfileAction(formData);
}

export async function deletePlannerContact(formData: FormData) {
  await requireAdminAction();
  return deletePlannerContactAction(formData);
}

export async function preparePlannerInvitation(formData: FormData) {
  await requireAdminAction();
  return preparePlannerInvitationAction(formData);
}

export async function sendPlannerInvitationDryRun(formData: FormData) {
  await requireAdminAction();
  return sendPlannerInvitationDryRunAction(formData);
}

export async function publishClaimSuggestion(formData: FormData) {
  await requireAdminAction();
  return publishClaimSuggestionAction(formData);
}

export async function rejectClaimSuggestion(formData: FormData) {
  await requireAdminAction();
  return rejectClaimSuggestionAction(formData);
}

export async function createCompany(_prevState: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  await requireAdminAction();
  return createCompanyAction(formData);
}

export async function updateCompany(
  id: string,
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  await requireAdminAction();
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
  await requireAdminAction();
  return approveClaimOwnershipAction(formData);
}

export async function rejectClaim(formData: FormData) {
  await requireAdminAction();
  formData.set("status", "rejected");
  return decideClaim(formData);
}

export { decideClaim, revokeMembership };

export async function setSubmissionStatus(formData: FormData) {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const adminNotes = String(formData.get("admin_notes") || "").trim();
  if (!id || !["submitted", "in_review", "needs_info", "rejected"].includes(status)) return;

  const supabase = getSupabaseAdmin();
  const { data: existingSubmission } = await supabase.from("company_submissions").select("source").eq("id", id).maybeSingle();
  if (existingSubmission?.source?.startsWith("claim:")) {
    const { data: claim, error: claimLookupError } = await supabase
      .from("company_claims")
      .select("id")
      .eq("submission_id", id)
      .maybeSingle();
    if (claimLookupError || !claim) throw claimLookupError || new Error("claim_not_found");

    const claimFormData = new FormData();
    claimFormData.set("claim_id", claim.id);
    claimFormData.set("status", status);
    claimFormData.set("reason", adminNotes);
    if (status === "approved") return approveClaimOwnershipAction(claimFormData);
    if (["needs_info", "rejected"].includes(status)) return decideClaim(claimFormData);
    throw new Error("Claims werden nur über den transaktionalen Claim-Entscheidungspfad geändert.");
  }
  if (existingSubmission?.source?.startsWith("owner-profile-update:") && status === "approved") {
    return approveOwnerSubmissionAction(formData);
  }
  if (existingSubmission?.source?.startsWith("owner-profile-update:") && ["needs_info", "rejected"].includes(status)) {
    const { error: decisionError } = await supabase.rpc("decide_company_profile_submission", {
      p_submission_id: id,
      p_status: status,
      p_reason: adminNotes || null,
      p_admin_actor: "basic-auth-admin",
    });
    if (decisionError) throw decisionError;
    revalidatePath("/admin/submissions");
    revalidatePath(`/admin/submissions/${id}`);
    return;
  }
  const { error } = await supabase.rpc("set_company_submission_review_status", {
    p_submission_id: id,
    p_status: status,
    p_admin_notes: adminNotes || null,
    p_admin_actor: "basic-auth-admin",
  });
  if (error) throw error;

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
}

export async function updateSubmission(formData: FormData) {
  await requireAdminAction();
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

export async function approveSubmission(formData: FormData) { await requireAdminAction(); return approveSubmissionActionFromData(formData); }

export async function approveOwnerSubmission(formData: FormData) { await requireAdminAction(); return approveOwnerSubmissionAction(formData); }

export async function decideOwnerSubmission(formData: FormData) { await requireAdminAction(); return decideOwnerSubmissionAction(formData); }

export async function setResearchCandidateStatus(formData: FormData) {
  await requireAdminAction();
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
  await requireAdminAction();
  return approveResearchCandidateAction(formData);
}

export async function importCompanies(_prevState: ImportReport, formData: FormData): Promise<ImportReport> {
  await requireAdminAction();
  return importCompaniesAction(formData);
}

export async function deleteCompany(formData: FormData) {
  await requireAdminAction();
  return deleteCompanyAction(formData);
}

export async function createTrade(formData: FormData) {
  await requireAdminAction();
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
  await requireAdminAction();
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
