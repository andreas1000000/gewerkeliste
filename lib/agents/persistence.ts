import { getAgentDefinition } from "@/lib/agents/agent-registry";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { AgentTaskStatus, CompanyDiscoveryDryRunResult, RegionalCoverageDryRunResult } from "./types";

export type AgentRunRecord = {
  id: string;
  agent_id: string;
  agent_name: string;
  department: string;
  objective: string;
  mode: "dry_run" | "internal_write" | "approval_required" | "live";
  status: "draft" | "running" | "completed" | "failed" | "cancelled" | "blocked";
  dry_run: boolean;
  risk_level: string;
  cost_center: string | null;
  estimated_cost: number;
  actual_cost: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type AgentTaskRecord = {
  id: string;
  agent_run_id: string | null;
  agent_id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: "low" | "medium" | "high" | "critical";
  status: AgentTaskStatus;
  confidence_score: number | null;
  created_at: string;
  regions?: { id: string; name: string; slug: string } | null;
  trades?: { id: string; name: string; slug: string } | null;
};

export type AgentRunStepRecord = {
  id: string;
  agent_run_id: string;
  step_key: string;
  step_name: string;
  status: string;
  confidence_score: number | null;
  created_at: string;
};

export type AgentToolCallRecord = {
  id: string;
  agent_run_id: string | null;
  tool_class: string;
  tool_name: string;
  status: string;
  request_summary: Record<string, unknown>;
  response_summary: Record<string, unknown>;
  source_type: string | null;
  cost_estimate: number;
  actual_cost: number;
  created_at: string;
};

export type AgentCostEventRecord = {
  id: string;
  agent_run_id: string | null;
  agent_id: string;
  cost_center: string;
  provider: string | null;
  tool_name: string | null;
  actual_cost: number;
  currency: string;
  created_at: string;
};

export type AgentApprovalRecord = {
  id: string;
  agent_run_id: string | null;
  agent_task_id: string | null;
  agent_id: string;
  action_type: string;
  risk_level: string;
  title: string;
  description: string | null;
  proposed_payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "expired" | "executed";
  requested_by: string | null;
  decided_by: string | null;
  created_at: string;
  decided_at: string | null;
};

export type AgentReviewRecord = {
  id: string;
  agent_run_id: string | null;
  agent_id: string;
  review_type: string;
  title: string;
  description: string | null;
  status: "open" | "in_review" | "resolved" | "rejected";
  severity: "low" | "medium" | "high" | "critical";
  confidence_score: number | null;
  created_at: string;
};

export type AgentOutboxRecord = {
  id: string;
  agent_run_id: string | null;
  agent_id: string;
  channel: string;
  recipient: string | null;
  subject: string | null;
  body: string;
  status: "draft" | "queued" | "sent" | "cancelled" | "failed";
  requires_approval: boolean;
  created_at: string;
};

export type AgentCockpitData = {
  runs: AgentRunRecord[];
  tasks: AgentTaskRecord[];
  steps: AgentRunStepRecord[];
  toolCalls: AgentToolCallRecord[];
  costEvents: AgentCostEventRecord[];
  approvals: AgentApprovalRecord[];
  reviews: AgentReviewRecord[];
  outbox: AgentOutboxRecord[];
  counts: {
    approvals: number;
    reviews: number;
    outbox: number;
    tasks: number;
    runs: number;
    steps: number;
    toolCalls: number;
    costEvents: number;
  };
};

export type AgentRunDetailData = {
  run: AgentRunRecord;
  tasks: AgentTaskRecord[];
  steps: AgentRunStepRecord[];
  toolCalls: AgentToolCallRecord[];
  costEvents: AgentCostEventRecord[];
  approvals: AgentApprovalRecord[];
  reviews: AgentReviewRecord[];
  outbox: AgentOutboxRecord[];
  auditSummary: AgentRunAuditSummary;
};

export type AgentRunAuditSummary = {
  run_id: string;
  agent: string;
  status: string;
  dry_run: boolean;
  risk_level: string;
  cost_center: string;
  started_at: string;
  finished_at: string;
  created_tasks: number;
  steps_count: number;
  tool_calls_count: number;
  cost_events_count: number;
  estimated_cost: string;
  read_tables: string[];
  written_tables: string[];
  review_items_count: number;
  approvals_count: number;
  outbox_items_count: number;
  risky_actions_blocked: string;
  public_data_changed: string;
  emails_created_or_sent: string;
  companies_claims_verification_changed: string;
};

export async function persistRegionalCoverageDryRun(result: RegionalCoverageDryRunResult) {
  const supabase = getSupabaseAdmin();
  const agent = getAgentDefinition(result.agent_id);
  if (!agent) throw new Error(`Unbekannter Agent: ${result.agent_id}`);

  const { data: region, error: regionError } = await supabase.from("regions").select("id,slug,name").eq("slug", result.region_slug).single();
  if (regionError) throw regionError;

  const tradeSlugs = [...new Set(result.findings.map((finding) => finding.trade_slug))];
  const { data: trades, error: tradesError } = await supabase.from("trades").select("id,slug,name").in("slug", tradeSlugs);
  if (tradesError) throw tradesError;
  const tradeBySlug = new Map((trades || []).map((trade) => [trade.slug as string, trade]));

  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agent.agent_id,
      agent_name: agent.name,
      department: agent.department,
      objective: `Regional Coverage Dry Run fuer ${region.name}`,
      mode: "dry_run",
      status: "completed",
      region_id: region.id,
      dry_run: true,
      risk_level: agent.risk_level,
      cost_center: agent.cost_center,
      estimated_cost: 0,
      actual_cost: 0,
      input: { region_slug: result.region_slug, trade_count: result.findings.length },
      output: {
        findings_count: result.findings.length,
        tasks_count: result.tasks.length,
        guardrails: result.guardrails,
        findings: result.findings,
      },
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      created_by: "gewerkeliste-os",
    })
    .select("id")
    .single();
  if (runError) throw runError;

  const stepRows = [
    {
      agent_run_id: run.id,
      step_key: "load_region_data",
      step_name: "Region, Firmen, Kandidaten und Gewerke laden",
      status: "completed",
      output: { region_slug: result.region_slug, findings_count: result.findings.length },
      confidence_score: 90,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    },
    {
      agent_run_id: run.id,
      step_key: "calculate_coverage",
      step_name: "Coverage je Gewerk berechnen",
      status: "completed",
      output: { findings: result.findings },
      confidence_score: 75,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    },
    {
      agent_run_id: run.id,
      step_key: "create_tasks",
      step_name: "Priorisierte Aufgaben ableiten",
      status: "completed",
      output: { tasks: result.tasks },
      confidence_score: 75,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    },
  ];

  const { error: stepsError } = await supabase.from("agent_run_steps").insert(stepRows);
  if (stepsError) throw stepsError;

  const { error: toolCallError } = await supabase.from("agent_tool_calls").insert([
    {
      agent_run_id: run.id,
      tool_class: "database_read",
      tool_name: "supabase",
      status: "completed",
      request_summary: { tables: ["regions", "companies", "company_candidates", "coverage_snapshots", "trades"] },
      response_summary: { findings_count: result.findings.length },
      cost_estimate: 0,
      actual_cost: 0,
    },
    {
      agent_run_id: run.id,
      tool_class: "classifier",
      tool_name: "coverage_rules",
      status: "completed",
      request_summary: { mode: "deterministic_rules" },
      response_summary: { tasks_count: result.tasks.length },
      cost_estimate: 0,
      actual_cost: 0,
    },
  ]);
  if (toolCallError) throw toolCallError;

  if (result.tasks.length) {
    const { error: tasksError } = await supabase.from("agent_tasks").insert(
      result.tasks.map((task) => {
        const trade = tradeBySlug.get(task.trade_slug);
        return {
          agent_run_id: run.id,
          agent_id: agent.agent_id,
          title: task.title,
          description: task.suggested_action,
          task_type: "regional_coverage_gap",
          priority: task.priority,
          status: "open",
          region_id: region.id,
          trade_id: trade?.id || null,
          confidence_score: task.confidence_score,
          created_by: "regional-coverage-agent",
        };
      }),
    );
    if (tasksError) throw tasksError;
  }

  const { error: costError } = await supabase.from("agent_cost_events").insert({
    agent_run_id: run.id,
    agent_id: agent.agent_id,
    cost_center: agent.cost_center,
    provider: "internal",
    tool_name: "regional_coverage_dry_run",
    region_id: region.id,
    estimated_cost: 0,
    actual_cost: 0,
    metadata: { note: "No paid API used" },
  });
  if (costError) throw costError;

  return run.id as string;
}

export async function persistCompanyDiscoveryDryRun(result: CompanyDiscoveryDryRunResult) {
  const supabase = getSupabaseAdmin();
  const agent = getAgentDefinition(result.agent_id);
  if (!agent) throw new Error(`Unbekannter Agent: ${result.agent_id}`);

  const { data: region, error: regionError } = await supabase.from("regions").select("id,slug,name").eq("slug", result.region_slug).single();
  if (regionError) throw regionError;

  const tradeSlugs = [...new Set([...result.findings.map((finding) => finding.trade_slug), ...result.tasks.map((task) => task.trade_slug)])];
  const { data: trades, error: tradesError } = tradeSlugs.length
    ? await supabase.from("trades").select("id,slug,name").in("slug", tradeSlugs)
    : { data: [], error: null };
  if (tradesError) throw tradesError;
  const tradeBySlug = new Map((trades || []).map((trade) => [trade.slug as string, trade]));

  const candidateIds = [...new Set(result.review_items.map((item) => item.candidate_id))];
  const { data: candidateRows, error: candidateError } = candidateIds.length
    ? await supabase.from("company_candidates").select("id,possible_trade").in("id", candidateIds)
    : { data: [], error: null };
  if (candidateError) throw candidateError;
  const candidateById = new Map((candidateRows || []).map((candidate) => [candidate.id as string, candidate]));

  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agent.agent_id,
      agent_name: agent.name,
      department: agent.department,
      objective: `Company Discovery Dry Run fuer ${region.name}`,
      mode: "dry_run",
      status: "completed",
      region_id: region.id,
      dry_run: true,
      risk_level: agent.risk_level,
      cost_center: agent.cost_center,
      estimated_cost: 0,
      actual_cost: 0,
      input: { region_slug: result.region_slug, trade_slug: result.trade_slug || null },
      output: {
        findings_count: result.findings.length,
        tasks_count: result.tasks.length,
        review_items_count: result.review_items.length,
        guardrails: result.guardrails,
        findings: result.findings,
      },
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      created_by: "gewerkeliste-os",
    })
    .select("id")
    .single();
  if (runError) throw runError;

  const { error: stepsError } = await supabase.from("agent_run_steps").insert([
    {
      agent_run_id: run.id,
      step_key: "load_local_discovery_inputs",
      step_name: "Region, Gewerke, Firmen, Kandidaten und Coverage lokal laden",
      status: "completed",
      output: { region_slug: result.region_slug, trade_slug: result.trade_slug || null },
      confidence_score: 90,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    },
    {
      agent_run_id: run.id,
      step_key: "derive_discovery_gaps",
      step_name: "Discovery-Luecken aus lokalen Daten ableiten",
      status: "completed",
      output: { findings_count: result.findings.length },
      confidence_score: 70,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    },
    {
      agent_run_id: run.id,
      step_key: "prepare_review_queue",
      step_name: "Tasks und Review Items ohne externe Wirkung vorbereiten",
      status: "completed",
      output: { tasks_count: result.tasks.length, review_items_count: result.review_items.length },
      confidence_score: 70,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    },
  ]);
  if (stepsError) throw stepsError;

  const { error: toolCallError } = await supabase.from("agent_tool_calls").insert([
    {
      agent_run_id: run.id,
      tool_class: "database_read",
      tool_name: "supabase",
      status: "completed",
      request_summary: { tables: ["regions", "trades", "companies", "company_candidates", "coverage_snapshots"] },
      response_summary: { findings_count: result.findings.length, existing_review_candidates: result.review_items.length },
      cost_estimate: 0,
      actual_cost: 0,
    },
    {
      agent_run_id: run.id,
      tool_class: "classifier",
      tool_name: "local_discovery_rules",
      status: "completed",
      request_summary: { mode: "deterministic_local_rules", external_api: false },
      response_summary: { tasks_count: result.tasks.length, review_items_count: result.review_items.length },
      cost_estimate: 0,
      actual_cost: 0,
    },
  ]);
  if (toolCallError) throw toolCallError;

  if (result.tasks.length) {
    const { error: tasksError } = await supabase.from("agent_tasks").insert(
      result.tasks.map((task) => {
        const trade = tradeBySlug.get(task.trade_slug);
        return {
          agent_run_id: run.id,
          agent_id: agent.agent_id,
          title: task.title,
          description: task.suggested_action,
          task_type: task.task_type,
          priority: task.priority,
          status: "open",
          region_id: region.id,
          trade_id: trade?.id || null,
          confidence_score: task.confidence_score,
          created_by: "company-discovery-agent",
        };
      }),
    );
    if (tasksError) throw tasksError;
  }

  if (result.review_items.length) {
    const { error: reviewsError } = await supabase.from("agent_review_items").insert(
      result.review_items.map((item) => {
        const candidate = candidateById.get(item.candidate_id);
        const trade = tradeBySlug.get(item.trade_slug || candidate?.possible_trade || "");
        return {
          agent_run_id: run.id,
          agent_id: agent.agent_id,
          review_type: "company_discovery_candidate",
          title: `Discovery-Kandidat pruefen: ${item.candidate_name}`,
          description: `${item.reason}\n${item.next_action}`,
          status: "open",
          severity: item.severity,
          region_id: region.id,
          trade_id: trade?.id || null,
          candidate_id: item.candidate_id,
          source_url: item.source_url,
          source_type: item.source_url ? "local_candidate_source" : "needs_source",
          confidence_score: item.confidence_score,
          payload: {
            dry_run: true,
            candidate_name: item.candidate_name,
            trade_slug: item.trade_slug,
            reason: item.reason,
            next_action: item.next_action,
            creates_company: false,
            sends_email: false,
            external_api_used: false,
          },
        };
      }),
    );
    if (reviewsError) throw reviewsError;
  }

  const { error: costError } = await supabase.from("agent_cost_events").insert({
    agent_run_id: run.id,
    agent_id: agent.agent_id,
    cost_center: agent.cost_center,
    provider: "internal",
    tool_name: "company_discovery_dry_run",
    region_id: region.id,
    estimated_cost: 0,
    actual_cost: 0,
    metadata: { note: "No web search and no paid API used" },
  });
  if (costError) throw costError;

  return run.id as string;
}

export async function getAgentCockpitData(): Promise<AgentCockpitData> {
  const supabase = getSupabaseAdmin();
  const [runs, tasks, steps, toolCalls, costEvents, approvals, reviews, outbox] = await Promise.all([
    supabase.from("agent_runs").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("agent_tasks").select("*, regions(id,name,slug), trades(id,name,slug)").order("created_at", { ascending: false }).limit(50),
    supabase.from("agent_run_steps").select("id,agent_run_id,step_key,step_name,status,confidence_score,created_at").order("created_at", { ascending: false }).limit(50),
    supabase
      .from("agent_tool_calls")
      .select("id,agent_run_id,tool_class,tool_name,status,request_summary,response_summary,source_type,cost_estimate,actual_cost,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("agent_cost_events").select("id,agent_run_id,agent_id,cost_center,provider,tool_name,actual_cost,currency,created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("agent_approvals").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("agent_review_items").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("agent_outbox").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  for (const response of [runs, tasks, steps, toolCalls, costEvents, approvals, reviews, outbox]) {
    if (response.error) throw response.error;
  }

  const stepRows = (steps.data || []) as AgentRunStepRecord[];
  const toolCallRows = (toolCalls.data || []) as AgentToolCallRecord[];
  const costEventRows = (costEvents.data || []) as AgentCostEventRecord[];
  const approvalRows = (approvals.data || []) as AgentApprovalRecord[];
  const reviewRows = (reviews.data || []) as AgentReviewRecord[];
  const outboxRows = (outbox.data || []) as AgentOutboxRecord[];
  const taskRows = (tasks.data || []) as AgentTaskRecord[];
  const runRows = (runs.data || []) as AgentRunRecord[];

  return {
    runs: runRows,
    tasks: taskRows,
    steps: stepRows,
    toolCalls: toolCallRows,
    costEvents: costEventRows,
    approvals: approvalRows,
    reviews: reviewRows,
    outbox: outboxRows,
    counts: {
      approvals: approvalRows.filter((item) => item.status === "pending").length,
      reviews: reviewRows.filter((item) => item.status === "open" || item.status === "in_review").length,
      outbox: outboxRows.filter((item) => item.status === "draft" || item.status === "queued").length,
      tasks: taskRows.filter((item) => item.status === "open" || item.status === "in_progress" || item.status === "waiting_for_approval").length,
      runs: runRows.length,
      steps: stepRows.length,
      toolCalls: toolCallRows.length,
      costEvents: costEventRows.length,
    },
  };
}

export async function getAgentRunDetail(runId: string): Promise<AgentRunDetailData | null> {
  const [run, tasks, steps, toolCalls, costEvents, approvals, reviews, outbox] = await Promise.all([
    getAgentRunRecord(runId),
    listAgentTasksForRun(runId),
    listAgentRunSteps(runId),
    listAgentToolCalls(runId),
    listAgentCostEventsForRun(runId),
    listAgentApprovalsForRun(runId),
    listAgentReviewItemsForRun(runId),
    listAgentOutboxItemsForRun(runId),
  ]);

  if (!run) return null;

  const detail = {
    run,
    tasks,
    steps,
    toolCalls,
    costEvents,
    approvals,
    reviews,
    outbox,
  };

  return {
    ...detail,
    auditSummary: getAgentRunAuditSummary(detail),
  };
}

export async function getAgentRunRecord(runId: string): Promise<AgentRunRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("agent_runs").select("*").eq("id", runId).maybeSingle();
  if (error) throw new Error(`Agent Run konnte nicht geladen werden: ${error.message}`);
  return (data as AgentRunRecord | null) || null;
}

export async function listAgentRunSteps(runId: string): Promise<AgentRunStepRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_run_steps")
    .select("id,agent_run_id,step_key,step_name,status,confidence_score,created_at")
    .eq("agent_run_id", runId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Agent Run Steps konnten nicht geladen werden: ${error.message}`);
  return (data || []) as AgentRunStepRecord[];
}

export async function listAgentToolCalls(runId: string): Promise<AgentToolCallRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_tool_calls")
    .select("id,agent_run_id,tool_class,tool_name,status,request_summary,response_summary,source_type,cost_estimate,actual_cost,created_at")
    .eq("agent_run_id", runId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Agent Tool Calls konnten nicht geladen werden: ${error.message}`);
  return (data || []) as AgentToolCallRecord[];
}

export async function listAgentTasksForRun(runId: string): Promise<AgentTaskRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_tasks")
    .select("*, regions(id,name,slug), trades(id,name,slug)")
    .eq("agent_run_id", runId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Agent Tasks konnten nicht geladen werden: ${error.message}`);
  return (data || []) as AgentTaskRecord[];
}

export async function listAgentApprovalsForRun(runId: string): Promise<AgentApprovalRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("agent_approvals").select("*").eq("agent_run_id", runId).order("created_at", { ascending: true });
  if (error) throw new Error(`Agent Approvals konnten nicht geladen werden: ${error.message}`);
  return (data || []) as AgentApprovalRecord[];
}

export async function listAgentReviewItemsForRun(runId: string): Promise<AgentReviewRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("agent_review_items").select("*").eq("agent_run_id", runId).order("created_at", { ascending: true });
  if (error) throw new Error(`Agent Review Items konnten nicht geladen werden: ${error.message}`);
  return (data || []) as AgentReviewRecord[];
}

export async function listAgentOutboxItemsForRun(runId: string): Promise<AgentOutboxRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("agent_outbox").select("*").eq("agent_run_id", runId).order("created_at", { ascending: true });
  if (error) throw new Error(`Agent Outbox Items konnten nicht geladen werden: ${error.message}`);
  return (data || []) as AgentOutboxRecord[];
}

export async function listAgentCostEventsForRun(runId: string): Promise<AgentCostEventRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_cost_events")
    .select("id,agent_run_id,agent_id,cost_center,provider,tool_name,actual_cost,currency,created_at")
    .eq("agent_run_id", runId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Agent Cost Events konnten nicht geladen werden: ${error.message}`);
  return (data || []) as AgentCostEventRecord[];
}

export function getAgentRunAuditSummary(detail: Omit<AgentRunDetailData, "auditSummary">): AgentRunAuditSummary {
  const readTables = uniqueStrings(
    detail.toolCalls.flatMap((toolCall) => {
      const tables = toolCall.request_summary?.tables;
      return Array.isArray(tables) ? tables : [];
    }),
  );
  const writtenTables = getWrittenAgentTables(detail);
  const publicWrittenTables = writtenTables.filter((table) => !table.startsWith("agent_"));
  const emailsSent = detail.outbox.filter((item) => item.status === "sent").length;
  const estimatedCost = detail.costEvents.reduce((sum, event) => sum + Number(event.actual_cost || 0), 0);
  const hasRiskQueueItems = detail.approvals.length > 0 || detail.reviews.length > 0 || detail.outbox.length > 0;

  return {
    run_id: detail.run.id,
    agent: detail.run.agent_name,
    status: detail.run.status,
    dry_run: detail.run.dry_run,
    risk_level: detail.run.risk_level,
    cost_center: detail.run.cost_center || "not recorded",
    started_at: detail.run.started_at || "not recorded",
    finished_at: detail.run.finished_at || "not recorded",
    created_tasks: detail.tasks.length,
    steps_count: detail.steps.length,
    tool_calls_count: detail.toolCalls.length,
    cost_events_count: detail.costEvents.length,
    estimated_cost: `${estimatedCost.toFixed(2)} EUR`,
    read_tables: readTables.length ? readTables : ["not recorded"],
    written_tables: writtenTables.length ? writtenTables : ["not recorded"],
    review_items_count: detail.reviews.length,
    approvals_count: detail.approvals.length,
    outbox_items_count: detail.outbox.length,
    risky_actions_blocked: hasRiskQueueItems ? "ja, als Review/Approval/Outbox festgehalten" : detail.run.dry_run ? "ja, Dry Run ohne Folgeaktion" : "unknown",
    public_data_changed: publicWrittenTables.length ? "unknown" : detail.run.dry_run ? "nein" : "not recorded",
    emails_created_or_sent: detail.outbox.length ? `Entwuerfe: ${detail.outbox.length}, gesendet: ${emailsSent}` : "nein",
    companies_claims_verification_changed: detail.run.dry_run ? "nein" : "unknown",
  };
}

function getWrittenAgentTables(detail: Omit<AgentRunDetailData, "auditSummary">) {
  const tables = ["agent_runs"];
  if (detail.steps.length) tables.push("agent_run_steps");
  if (detail.toolCalls.length) tables.push("agent_tool_calls");
  if (detail.tasks.length) tables.push("agent_tasks");
  if (detail.approvals.length) tables.push("agent_approvals");
  if (detail.reviews.length) tables.push("agent_review_items");
  if (detail.outbox.length) tables.push("agent_outbox");
  if (detail.costEvents.length) tables.push("agent_cost_events");
  return tables;
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))].sort((a, b) => a.localeCompare(b, "de"));
}

export async function updateAgentApprovalStatus(id: string, status: "approved" | "rejected" | "expired") {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("agent_approvals")
    .update({ status, decided_by: "gewerkeliste-os", decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw error;
}

export async function updateAgentReviewStatus(id: string, status: "in_review" | "resolved" | "rejected") {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("agent_review_items").update({ status }).eq("id", id).in("status", ["open", "in_review"]);
  if (error) throw error;
}

export async function updateAgentOutboxStatus(id: string, status: "cancelled" | "failed") {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("agent_outbox").update({ status }).eq("id", id).in("status", ["draft", "queued"]);
  if (error) throw error;
}

export async function updateAgentTaskStatus(id: string, status: "in_progress" | "completed" | "cancelled") {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("agent_tasks").update({ status }).eq("id", id).in("status", ["open", "in_progress", "waiting_for_approval"]);
  if (error) throw error;
}

export function agentOsTablesAvailableError(error: unknown) {
  const message = errorToSearchableMessage(error);
  const agentOsTables = [
    "agent_runs",
    "agent_run_steps",
    "agent_tool_calls",
    "agent_tasks",
    "agent_approvals",
    "agent_review_items",
    "agent_outbox",
    "agent_cost_events",
  ];

  if (agentOsTables.some((table) => message.includes(table))) {
    return true;
  }

  return (
    message.includes("agent_") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("could not find") ||
      message.includes("foreign key relationship") ||
      message.includes("pgrst200") ||
      message.includes("pgrst205") ||
      message.includes("42p01"))
  );
}

function errorToSearchableMessage(error: unknown) {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`.toLowerCase();
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return ["message", "details", "hint", "code"]
      .map((key) => {
        const value = record[key];
        return typeof value === "string" ? value : "";
      })
      .join(" ")
      .toLowerCase();
  }

  return String(error).toLowerCase();
}
