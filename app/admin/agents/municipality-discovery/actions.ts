"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { normalizeMunicipalityDiscoveryInput, runMunicipalityDiscovery } from "@/lib/agents/municipality-discovery";
import type { MunicipalityDiscoveryEmailMode, MunicipalityDiscoveryPublishMode } from "@/lib/agents/types";

export async function startMunicipalityDiscovery(formData: FormData) {
  const intent = String(formData.get("intent") || "manual");
  const publishMode = publishModeFromForm(formData);
  const input = normalizeMunicipalityDiscoveryInput({
    municipality: String(formData.get("municipality") || ""),
    county: String(formData.get("county") || ""),
    trade_scope: String(formData.get("trade_scope") || "prio1"),
    max_queries: Number(formData.get("max_queries") || 50),
    max_publications: Number(formData.get("max_publications") || 10),
    max_cost_eur: Number(formData.get("max_cost_eur") || 1),
    publish_mode: intent === "dry_run" ? "review_only" : publishMode,
    email_mode: emailModeFromForm(formData),
  });

  const result = await runMunicipalityDiscovery(input);
  revalidatePath("/admin/agents");
  revalidatePath("/admin/agents/municipality-discovery");
  redirect(`/admin/agents/runs/${result.run_id}`);
}

function publishModeFromForm(formData: FormData): MunicipalityDiscoveryPublishMode {
  const value = String(formData.get("publish_mode") || "");
  if (value === "review_only" || value === "manual_approval" || value === "tier_a_unverified_basis") return value;
  return "manual_approval";
}

function emailModeFromForm(formData: FormData): MunicipalityDiscoveryEmailMode {
  const value = String(formData.get("email_mode") || "");
  if (value === "none" || value === "draft_only" || value === "send_after_approval") return value;
  return "draft_only";
}
