import type { AutonomyLevel } from "./autonomy";
import type { RiskyApprovalAction } from "./permissions";
import type { AgentToolClass } from "./tools";

export type AgentDepartment =
  | "strategy"
  | "regional_coverage"
  | "discovery"
  | "enrichment"
  | "classification"
  | "quality"
  | "verification"
  | "outreach"
  | "seo_content"
  | "matching"
  | "compliance"
  | "finance";

export type AgentRiskLevel = "low" | "medium" | "high" | "critical";

export type AgentDefaultOutput =
  | "report"
  | "coverage_snapshot"
  | "candidate_review"
  | "classification_review"
  | "approval_request"
  | "outbox_draft"
  | "task_list"
  | "cost_report";

export type AgentDefinition = {
  agent_id: string;
  name: string;
  department: AgentDepartment;
  mission: string;
  allowed_tools: readonly AgentToolClass[];
  autonomy_level: AutonomyLevel;
  risk_level: AgentRiskLevel;
  requires_approval_for: readonly RiskyApprovalAction[];
  default_output: AgentDefaultOutput;
  cost_center: string;
  enabled: boolean;
};

export type AgentRunStatus = "draft" | "running" | "completed" | "failed" | "cancelled" | "blocked";

export type AgentTaskPriority = "low" | "medium" | "high" | "critical";

export type AgentTaskStatus = "open" | "in_progress" | "waiting_for_approval" | "completed" | "cancelled";

export type RegionalCoverageDryRunInput = {
  regionSlug: string;
  tradeSlugs?: string[];
};

export type RegionalCoverageFinding = {
  region_slug: string;
  region_name: string;
  trade_slug: string;
  trade_name: string;
  found_companies: number;
  candidate_companies: number;
  estimated_companies: number | null;
  coverage_percent: number | null;
  status: "good" | "nacharbeiten" | "kritisch" | "unknown" | "needs_baseline";
  confidence_score: number;
  next_action: string;
  reasoning: string;
};

export type RegionalCoverageDryRunResult = {
  agent_id: string;
  mode: "dry_run";
  region_slug: string;
  findings: RegionalCoverageFinding[];
  tasks: Array<{
    title: string;
    priority: AgentTaskPriority;
    trade_slug: string;
    suggested_action: string;
    confidence_score: number;
  }>;
  guardrails: string[];
};

export type CompanyDiscoveryDryRunInput = {
  regionSlug: string;
  tradeSlug?: string;
};

export type CompanyDiscoveryFinding = {
  region_slug: string;
  region_name: string;
  trade_slug: string;
  trade_name: string;
  found_companies: number;
  candidate_companies: number;
  estimated_companies: number | null;
  gap_estimate: number | null;
  status: "needs_source" | "review_candidates" | "needs_more_candidates" | "sufficient_for_now";
  confidence_score: number;
  next_action: string;
  reasoning: string;
};

export type CompanyDiscoveryReviewItem = {
  candidate_id: string;
  candidate_name: string;
  trade_slug: string | null;
  source_url: string | null;
  confidence_score: number;
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  next_action: string;
};

export type CompanyDiscoveryDryRunResult = {
  agent_id: string;
  mode: "dry_run";
  region_slug: string;
  trade_slug?: string;
  findings: CompanyDiscoveryFinding[];
  tasks: Array<{
    title: string;
    priority: AgentTaskPriority;
    trade_slug: string;
    task_type: "find_candidates_for_region_trade" | "verify_candidate_source" | "review_possible_duplicate" | "needs_manual_source";
    suggested_action: string;
    confidence_score: number;
  }>;
  review_items: CompanyDiscoveryReviewItem[];
  guardrails: string[];
};
