"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-action-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function approveClaim(formData: FormData) {
  await requireAdminAction();

  const claimId = String(formData.get("claim_id") || "");
  if (!claimId) return;

  const supabase = getSupabaseAdmin();
  const { data: claim, error: claimLookupError } = await supabase
    .from("company_claims")
    .select("id, company_id, status")
    .eq("id", claimId)
    .maybeSingle();
  if (claimLookupError) throw claimLookupError;
  if (!claim || claim.status !== "pending") return;

  const { data: company, error: companyLookupError } = await supabase
    .from("companies")
    .select("id, claim_status")
    .eq("id", claim.company_id)
    .maybeSingle();
  if (companyLookupError) throw companyLookupError;
  if (!company) return;

  if (company.claim_status !== "claimed") {
    const { error: companyUpdateError } = await supabase
      .from("companies")
      .update({ claim_status: "claimed" })
      .eq("id", claim.company_id)
      .neq("claim_status", "claimed");
    if (companyUpdateError) throw companyUpdateError;
  }

  const { error: claimUpdateError } = await supabase
    .from("company_claims")
    .update({ status: "approved", decided_at: new Date().toISOString() })
    .eq("id", claimId)
    .eq("status", "pending");
  if (claimUpdateError) throw claimUpdateError;

  revalidatePath("/admin/claims");
  revalidatePath("/admin/companies");
  revalidatePath("/suche");
  revalidatePath("/");
}
