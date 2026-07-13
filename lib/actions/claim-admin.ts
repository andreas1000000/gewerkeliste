"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function approveClaim(formData: FormData) {
  const claimId = requiredUuid(formData, "claim_id");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("approve_company_claim", {
    p_claim_id: claimId,
    p_admin_actor: "basic-auth-admin",
  });

  if (error) redirect(`/admin/claims/${claimId}?error=${encodeURIComponent(publicClaimError(error.message))}`);

  revalidateClaimPaths(claimId);
  redirect(`/admin/claims/${claimId}?approved=1`);
}

export async function decideClaim(formData: FormData) {
  const claimId = requiredUuid(formData, "claim_id");
  const status = stringValue(formData, "status");
  const reason = stringValue(formData, "reason");
  if (status !== "needs_info" && status !== "rejected") {
    redirect(`/admin/claims/${claimId}?error=unsupported_decision`);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("decide_company_claim", {
    p_claim_id: claimId,
    p_status: status,
    p_reason: reason || null,
    p_admin_actor: "basic-auth-admin",
  });
  if (error) redirect(`/admin/claims/${claimId}?error=${encodeURIComponent(publicClaimError(error.message))}`);

  revalidateClaimPaths(claimId);
  redirect(`/admin/claims/${claimId}?decided=${status}`);
}

export async function revokeMembership(formData: FormData) {
  const membershipId = requiredUuid(formData, "membership_id");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("revoke_company_membership", {
    p_membership_id: membershipId,
    p_reason: stringValue(formData, "reason") || null,
    p_admin_actor: "basic-auth-admin",
  });
  if (error) redirect(`/admin/claims?error=${encodeURIComponent(publicClaimError(error.message))}`);

  revalidatePath("/admin/claims");
  redirect("/admin/claims?membership_revoked=1");
}

function revalidateClaimPaths(claimId: string) {
  revalidatePath("/admin/claims");
  revalidatePath(`/admin/claims/${claimId}`);
  revalidatePath("/mein-betrieb");
}

function requiredUuid(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  if (!isUuid(value)) throw new Error("invalid_identifier");
  return value;
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function publicClaimError(message: string) {
  if (message.includes("company_already_claimed")) return "Der Betrieb ist bereits einem anderen aktiven Zugang zugeordnet.";
  if (message.includes("claim_not_approvable")) return "Der Antrag befindet sich nicht in einem freigabefähigen Status.";
  if (message.includes("claim_not_found")) return "Der Übernahmeantrag wurde nicht gefunden.";
  return "Die Entscheidung konnte nicht transaktional gespeichert werden.";
}
