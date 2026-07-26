"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { canonicalTradeSlug } from "@/lib/trade-taxonomy";

export async function updateRegionalCandidate(formData: FormData) {
  const id = getFormString(formData, "id");
  if (!id) return;

  const possibleTrade = canonicalTradeSlug(getFormString(formData, "possible_trade"));
  const status = getFormString(formData, "status");
  if (!isRegionalCandidateStatus(status)) return;

  const update = {
    name: getFormString(formData, "name"),
    city: nullableFormString(formData, "city"),
    postal_code: nullableFormString(formData, "postal_code"),
    street: nullableFormString(formData, "street"),
    possible_trade: possibleTrade || null,
    possible_website: normalizeSubmissionWebsite(nullableFormString(formData, "possible_website")),
    phone: nullableFormString(formData, "phone"),
    email: nullableFormString(formData, "email"),
    status,
  };

  const supabase = getSupabaseAdmin();
  const { data: currentCandidate, error: lookupError } = await supabase
    .from("company_candidates")
    .select("status,possible_website,source_type,overall_score,identity_confidence,trade_confidence,duplicate_of_company_id")
    .eq("id", id)
    .single();
  if (lookupError) throw lookupError;
  if (!currentCandidate || currentCandidate.status === "promoted") return;

  if (status === "ready_for_publish" && !isPublishReadyCandidate(currentCandidate)) {
    return;
  }

  const { error } = await supabase.from("company_candidates").update(update).eq("id", id).neq("status", "promoted");
  if (error) throw error;

  await updateCandidateReviewStatus(id, status === "rejected" ? "resolved" : "pending");
  revalidatePath("/admin/coverage");
}

export async function rejectRegionalCandidate(formData: FormData) {
  const id = getFormString(formData, "id");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("company_candidates").update({ status: "rejected" }).eq("id", id).neq("status", "promoted");
  if (error) throw error;

  await updateCandidateReviewStatus(id, "resolved");
  revalidatePath("/admin/coverage");
}

async function updateCandidateReviewStatus(candidateId: string, status: "pending" | "resolved") {
  const supabase = getSupabaseAdmin();
  await supabase.from("review_queue").update({ assigned_status: status }).eq("candidate_id", candidateId);
}

function isRegionalCandidateStatus(status: string) {
  return ["discovered", "website_found", "enriched", "needs_review", "rejected", "ready_for_publish"].includes(status);
}

function isPublishReadyCandidate(candidate: {
  possible_website?: string | null;
  source_type?: string | null;
  overall_score?: number | null;
  identity_confidence?: number | null;
  trade_confidence?: number | null;
  duplicate_of_company_id?: string | null;
}) {
  return Boolean(
    candidate.possible_website &&
      candidate.source_type === "official_website" &&
      (candidate.overall_score || 0) >= 90 &&
      (candidate.identity_confidence || 0) >= 75 &&
      (candidate.trade_confidence || 0) >= 75 &&
      !candidate.duplicate_of_company_id,
  );
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function nullableFormString(formData: FormData, key: string) {
  const value = getFormString(formData, key);
  return value ? value : null;
}

function normalizeSubmissionWebsite(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
