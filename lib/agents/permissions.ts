import type { AgentToolClass } from "./tools";

export const riskyApprovalActions = [
  "send_email",
  "publish_company",
  "overwrite_company_data",
  "change_verification_status",
  "change_claim_status",
  "bulk_update",
  "delete_data",
  "start_paid_api",
  "publish_seo_page",
  "change_slug",
] as const;

export type RiskyApprovalAction = (typeof riskyApprovalActions)[number];

export function isRiskyTool(tool: AgentToolClass) {
  return tool === "database_write_public" || tool === "email_send" || tool === "payment" || tool === "delete";
}
