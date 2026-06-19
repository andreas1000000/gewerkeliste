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
  return ["discovered", "website_found", "enriched", "needs_review", "rejected", "promoted", "ready_for_publish"].includes(status);
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
