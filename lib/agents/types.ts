import type { AutonomyLevel } from "./autonomy";
import type { RiskyApprovalAction } from "./permissions";
import type { AgentToolClass } from "./tools";

export type AgentDepartment =
  | "strategy"
  | "regional_coverage"
  | "municipality_discovery"
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

export type MunicipalityDiscoveryPublishMode = "review_only" | "manual_approval" | "tier_a_unverified_basis";

export type MunicipalityDiscoveryEmailMode = "none" | "draft_only" | "send_after_approval";

export type MunicipalityDiscoveryInput = {
  municipality: string;
  county?: string;
  trade_scope: "prio1" | "all" | string;
  max_queries: number;
  max_publications: number;
  max_cost_eur: number;
  publish_mode: MunicipalityDiscoveryPublishMode;
  email_mode: MunicipalityDiscoveryEmailMode;
};

export type MunicipalityDiscoveryTier = "A" | "B" | "C";

export type MunicipalityDiscoveryCandidate = {
  candidate_id: string;
  name: string;
  city: string | null;
  postal_code: string | null;
  possible_trade: string | null;
  possible_website: string | null;
  source_type: string;
  source_url: string | null;
  tier: MunicipalityDiscoveryTier;
  confidence_score: number;
  reasons: string[];
  duplicate_company_id: string | null;
};

export type MunicipalityDiscoveryResult = {
  agent_id: "municipality-discovery-agent";
  run_id: string;
  mode: "dry_run" | "approval_required" | "live";
  municipality: string;
  county?: string;
  region_slug: string;
  publish_mode: MunicipalityDiscoveryPublishMode;
  email_mode: MunicipalityDiscoveryEmailMode;
  queries_planned: number;
  queries_executed: number;
  external_api_used: boolean;
  costs_eur: number;
  candidates: MunicipalityDiscoveryCandidate[];
  tier_counts: Record<MunicipalityDiscoveryTier, number>;
  publications_created: number;
  approvals_created: number;
  review_items_created: number;
  outbox_drafts_created: number;
  duplicates_blocked: number;
  blocked_candidates: number;
  guardrails: string[];
  errors: string[];
};
