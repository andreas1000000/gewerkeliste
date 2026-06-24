#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import fs from "node:fs";
import { requireLiveConfirmation, requireSupabaseSafety } from "./safety-gates.mjs";

loadEnvLocalIfNeeded();

const args = parseArgs(process.argv.slice(2));
const filePath = args.file || args._[0] || "data/import/rosenheim-company-candidates.json";
const live = Boolean(args.live);
const regionSlug = args.region || "landkreis-rosenheim";
const regionName = args["region-name"] || "Landkreis Rosenheim";
const limit = Number(args.limit || 0);
const agentId = "company-discovery";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (live) {
  requireLiveConfirmation({
    args,
    action: "import-company-candidates-live",
    reason: "Schreibt reale Firmenkandidaten und Review Items in company_candidates/agent_review_items.",
  });
}
requireSupabaseSafety({ args, url: supabaseUrl, live, action: "import-company-candidates-live" });

if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY muessen gesetzt sein.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const input = JSON.parse(await readFile(filePath, "utf8"));
const candidates = (Array.isArray(input) ? input : input.candidates || []).slice(0, limit > 0 ? limit : undefined);
if (!candidates.length) fail("Keine Kandidaten in der Importdatei gefunden.");

const validationErrors = validateCandidates(candidates);
if (validationErrors.length) {
  fail(`Importdatei nicht valide:\n${validationErrors.slice(0, 20).join("\n")}`);
}

const report = {
  ok: true,
  live,
  source_file: filePath,
  target: safeTargetLabel(supabaseUrl),
  candidates_seen: candidates.length,
  candidates_written: 0,
  review_items_written: 0,
  duplicates_marked: 0,
  skipped: 0,
  errors: [],
};

if (!live) {
  const summary = summarize(candidates);
  console.log(JSON.stringify({ ...report, dry_run_summary: summary }, null, 2));
  process.exit(0);
}

const region = await upsertRegion();
const tradeRows = await loadTrades();
const agentRun = await createAgentRun(region.id);

await insertToolCall(agentRun.id, "read_import_file", {
  file_path: filePath,
  source: input.metadata?.source || "Importdatei",
  source_license: input.metadata?.source_license || null,
  rows: candidates.length,
});

for (const candidate of candidates) {
  try {
    const duplicateCompanyId = await findDuplicateCompany(candidate);
    const row = toCandidateRow(candidate, duplicateCompanyId);
    const { data, error } = await supabase
      .from("company_candidates")
      .upsert(row, { onConflict: "source_url,name" })
      .select("id")
      .single();

    if (error || !data) throw error || new Error("candidate insert returned no row");

    report.candidates_written += 1;
    if (duplicateCompanyId) report.duplicates_marked += 1;

    const firstTradeId = resolveTradeId(candidate.trades?.[0], tradeRows);
    const reviewExists = await existingReviewItem(data.id);
    if (!reviewExists) {
      const { error: reviewError } = await supabase.from("agent_review_items").insert({
        agent_run_id: agentRun.id,
        agent_id: agentId,
        review_type: "company_candidate_import_review",
        title: `${candidate.name} prüfen`,
        description: "Importierter Firmenkandidat aus öffentlicher Hinweisquelle. Keine Veröffentlichung, keine Verifizierung, keine E-Mail.",
        status: "open",
        severity: duplicateCompanyId ? "high" : candidate.ready_for_import ? "medium" : "low",
        region_id: region.id,
        trade_id: firstTradeId,
        candidate_id: data.id,
        source_url: candidate.source_url,
        source_type: candidate.source_type,
        source_snapshot: candidate.website || candidate.source_url,
        confidence_score: candidate.confidence_score,
        payload: {
          candidate_name: candidate.name,
          city: candidate.city,
          postal_code: candidate.postal_code,
          trades: candidate.trades,
          ready_for_import: candidate.ready_for_import,
          source_license: input.metadata?.source_license || "unknown",
          next_action: duplicateCompanyId ? "Dublettenverdacht prüfen" : "Website/Impressum prüfen und Import entscheiden",
          public_visibility: false,
          verified: false,
          claim_status: "unclaimed",
        },
      });
      if (reviewError) throw reviewError;
      report.review_items_written += 1;
    }
  } catch (error) {
    report.errors.push(`${candidate.name}: ${error.message}`);
  }
}

await supabase
  .from("agent_runs")
  .update({
    status: report.errors.length ? "completed" : "completed",
    output: report,
    finished_at: new Date().toISOString(),
  })
  .eq("id", agentRun.id);

console.log(JSON.stringify(report, null, 2));

async function upsertRegion() {
  const { data, error } = await supabase
    .from("regions")
    .upsert(
      {
        name: regionName,
        slug: regionSlug,
        county: "Rosenheim",
        state: "Bayern",
        country: "Deutschland",
        region_type: "county",
      },
      { onConflict: "slug" },
    )
    .select("id,name,slug")
    .single();
  if (error || !data) throw error || new Error("Region konnte nicht angelegt werden.");
  return data;
}

async function loadTrades() {
  const slugs = [...new Set(candidates.flatMap((candidate) => candidate.trades || []).filter(Boolean))];
  const { data, error } = await supabase.from("trades").select("id,slug,name").in("slug", slugs);
  if (error) throw error;
  return new Map((data || []).map((trade) => [trade.slug, trade]));
}

async function createAgentRun(regionId) {
  const { data, error } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agentId,
      agent_name: "Company Discovery Import",
      department: "data",
      objective: "Rosenheim Firmenkandidaten aus Importdatei in Review-Struktur übernehmen",
      mode: "internal_write",
      status: "running",
      region_id: regionId,
      dry_run: false,
      risk_level: "medium",
      cost_center: "data-acquisition",
      estimated_cost: 0,
      actual_cost: 0,
      input: { file_path: filePath, candidates: candidates.length, target: safeTargetLabel(supabaseUrl) },
      created_by: "codex",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) throw error || new Error("agent_run konnte nicht angelegt werden.");
  return data;
}

async function insertToolCall(agentRunId, toolName, responseSummary) {
  const { error } = await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRunId,
    tool_class: "local_import",
    tool_name: toolName,
    status: "completed",
    request_summary: { file_path: filePath },
    response_summary: responseSummary,
    source_url: input.metadata?.source || null,
    source_type: "import_file",
    cost_estimate: 0,
    actual_cost: 0,
  });
  if (error) throw error;
}

async function findDuplicateCompany(candidate) {
  if (candidate.website) {
    const { data } = await supabase.from("companies").select("id").eq("website_url", candidate.website).limit(1);
    if (data?.[0]?.id) return data[0].id;
  }

  if (candidate.postal_code && candidate.name) {
    const { data } = await supabase
      .from("companies")
      .select("id")
      .eq("postal_code", candidate.postal_code)
      .ilike("name", `%${candidate.name.slice(0, 24)}%`)
      .limit(1);
    if (data?.[0]?.id) return data[0].id;
  }
  return null;
}

async function existingReviewItem(candidateId) {
  const { data } = await supabase
    .from("agent_review_items")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("review_type", "company_candidate_import_review")
    .limit(1);
  return Boolean(data?.length);
}

function toCandidateRow(candidate, duplicateCompanyId) {
  return {
    name: candidate.name,
    city: candidate.city,
    postal_code: candidate.postal_code,
    street: candidate.address_line,
    possible_trade: candidate.trades?.[0] || null,
    possible_website: candidate.website,
    phone: candidate.phone_public_business,
    email: candidate.email_public_business,
    source_type: candidate.source_type,
    source_url: candidate.source_url,
    discovery_confidence: candidate.confidence_score,
    identity_confidence: candidate.website ? 75 : 55,
    trade_confidence: candidate.confidence_score,
    overall_score: candidate.confidence_score,
    status: duplicateCompanyId ? "needs_review" : candidate.ready_for_import ? "ready_for_publish" : "needs_review",
    duplicate_of_company_id: duplicateCompanyId,
    raw_evidence: {
      ...candidate.raw_evidence,
      all_trades: candidate.trades,
      services_raw: candidate.services_raw,
      notes_internal: candidate.notes_internal,
      verified: false,
      claim_status: "unclaimed",
      public_visible: false,
      import_source: filePath,
    },
  };
}

function validateCandidates(items) {
  const errors = [];
  items.forEach((candidate, index) => {
    const prefix = `#${index + 1} ${candidate.name || "ohne Name"}`;
    if (!candidate.name) errors.push(`${prefix}: name fehlt`);
    if (!candidate.source_url) errors.push(`${prefix}: source_url fehlt`);
    if (!candidate.source_type) errors.push(`${prefix}: source_type fehlt`);
    if (!Array.isArray(candidate.trades) || candidate.trades.length === 0) errors.push(`${prefix}: trades fehlen`);
    if (candidate.verified !== false) errors.push(`${prefix}: verified muss false sein`);
    if (candidate.claim_status !== "unclaimed") errors.push(`${prefix}: claim_status muss unclaimed sein`);
    if (candidate.phone_public_business && /^\+?49\s?(15|16|17)/.test(candidate.phone_public_business.replace(/[^0-9+]/g, ""))) {
      errors.push(`${prefix}: private Mobilnummer erkannt`);
    }
  });
  return errors;
}

function resolveTradeId(slug, rows) {
  return rows.get(slug)?.id || null;
}

function summarize(items) {
  return {
    candidates: items.length,
    ready_for_import: items.filter((candidate) => candidate.ready_for_import).length,
    needs_review: items.filter((candidate) => candidate.needs_review).length,
    with_website: items.filter((candidate) => candidate.website).length,
    with_address: items.filter((candidate) => candidate.address_line).length,
    trades: [...new Set(items.flatMap((candidate) => candidate.trades))].length,
    cities: [...new Set(items.map((candidate) => candidate.city).filter(Boolean))].length,
  };
}

function safeTargetLabel(url) {
  if (!url) return "missing";
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) ? "local" : `remote:${parsed.hostname}`;
  } catch {
    return "unknown";
  }
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      result._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    index += 1;
  }
  return result;
}

function loadEnvLocalIfNeeded() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  if (!fs.existsSync(".env.local")) return;
  const lines = fs.readFileSync(".env.local", "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
