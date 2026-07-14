"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-action-auth";
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

const defaultAgentRegionSlug = "stephanskirchen";

export async function persistDefaultCoverageDryRun() {
  await requireAdminAction();
  const result = await runRegionalCoverageDryRun({ regionSlug: defaultAgentRegionSlug });
  await persistRegionalCoverageDryRun(result);
  revalidatePath("/admin/agents");
}

export async function persistDefaultDiscoveryDryRun() {
  await requireAdminAction();
  const result = await runCompanyDiscoveryDryRun({ regionSlug: defaultAgentRegionSlug });
  await persistCompanyDiscoveryDryRun(result);
  revalidatePath("/admin/agents");
}

export async function setAgentApprovalStatus(formData: FormData) {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || (status !== "approved" && status !== "rejected" && status !== "expired")) return;
  await updateAgentApprovalStatus(id, status);
  revalidatePath("/admin/agents");
}

export async function setAgentReviewStatus(formData: FormData) {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || (status !== "in_review" && status !== "resolved" && status !== "rejected")) return;
  await updateAgentReviewStatus(id, status);
  revalidatePath("/admin/agents");
}

export async function setAgentOutboxStatus(formData: FormData) {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || (status !== "cancelled" && status !== "failed")) return;
  await updateAgentOutboxStatus(id, status);
  revalidatePath("/admin/agents");
}

export async function setAgentTaskStatus(formData: FormData) {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || (status !== "in_progress" && status !== "completed" && status !== "cancelled")) return;
  await updateAgentTaskStatus(id, status);
  revalidatePath("/admin/agents");
}
