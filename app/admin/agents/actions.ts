"use server";

import { revalidatePath } from "next/cache";
import {
  persistCompanyDiscoveryDryRun,
  persistRegionalCoverageDryRun,
  updateAgentApprovalStatus,
  updateAgentOutboxStatus,
  updateAgentReviewStatus,
  updateAgentTaskStatus,
} from "@/lib/agents/persistence";
import { runCompanyDiscoveryDryRun } from "@/lib/agents/company-discovery";
import { runRegionalCoverageDryRun } from "@/lib/agents/regional-coverage";

export async function persistRiederingCoverageDryRun() {
  const result = await runRegionalCoverageDryRun({ regionSlug: "riedering" });
  await persistRegionalCoverageDryRun(result);
  revalidatePath("/admin/agents");
}

export async function persistRiederingDiscoveryDryRun() {
  const result = await runCompanyDiscoveryDryRun({ regionSlug: "riedering" });
  await persistCompanyDiscoveryDryRun(result);
  revalidatePath("/admin/agents");
}

export async function setAgentApprovalStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || (status !== "approved" && status !== "rejected" && status !== "expired")) return;
  await updateAgentApprovalStatus(id, status);
  revalidatePath("/admin/agents");
}

export async function setAgentReviewStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || (status !== "in_review" && status !== "resolved" && status !== "rejected")) return;
  await updateAgentReviewStatus(id, status);
  revalidatePath("/admin/agents");
}

export async function setAgentOutboxStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || (status !== "cancelled" && status !== "failed")) return;
  await updateAgentOutboxStatus(id, status);
  revalidatePath("/admin/agents");
}

export async function setAgentTaskStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || (status !== "in_progress" && status !== "completed" && status !== "cancelled")) return;
  await updateAgentTaskStatus(id, status);
  revalidatePath("/admin/agents");
}
