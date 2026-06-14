#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const args = parseArgs(process.argv.slice(2));
const limit = Number(args.limit || 20);
const live = Boolean(args.live);
const maxSearchQueries = Number(args["max-search-queries"] || 8);
const timeoutMs = Number(args["timeout-ms"] || 8000);

const supabase = createSupabaseClient();

const { data: jobs, error } = await supabase
  .from("company_enrichment_jobs")
  .select("id,company_id,status,priority,attempts,source,companies(id,name,city,postal_code,website_url)")
  .eq("status", "pending")
  .order("priority", { ascending: false })
  .order("created_at", { ascending: true })
  .limit(limit);

if (error) fail(`company_enrichment_jobs konnten nicht geladen werden: ${error.message}`);

const report = {
  ok: true,
  mode: live ? "live" : "dry_run",
  limit,
  jobs_found: jobs?.length || 0,
  done: 0,
  review: 0,
  failed: 0,
  results: [],
};

for (const job of jobs || []) {
  const company = Array.isArray(job.companies) ? job.companies[0] : job.companies;
  if (!company) {
    await markJob(job.id, "failed", "Company fehlt");
    report.failed += 1;
    continue;
  }

  if (live) {
    await supabase
      .from("company_enrichment_jobs")
      .update({ status: "running", attempts: Number(job.attempts || 0) + 1, started_at: new Date().toISOString(), last_error: null })
      .eq("id", job.id);
  }

  const childArgs = [
    "scripts/enrich-company.mjs",
    "--company-id",
    company.id,
    "--company",
    company.name,
    "--city",
    company.city || "",
    "--max-search-queries",
    String(maxSearchQueries),
    "--timeout-ms",
    String(timeoutMs),
  ];
  if (company.website_url) childArgs.push("--website", company.website_url);
  if (live) childArgs.push("--live");

  try {
    const { stdout } = await execFileAsync(process.execPath, childArgs, {
      cwd: process.cwd(),
      env: process.env,
      maxBuffer: 8 * 1024 * 1024,
    });
    const childReport = JSON.parse(stdout);
    const status = childReport.ok && childReport.risk_notes?.length ? "review" : childReport.ok ? "done" : "failed";
    if (live) await markJob(job.id, status, childReport.errors?.join("; ") || null);
    report[status] += 1;
    report.results.push({
      job_id: job.id,
      company_id: company.id,
      company_name: company.name,
      status,
      possible_website: childReport.possible_website?.url || null,
      proposed_trades: childReport.proposed_trades?.map((trade) => trade.slug) || [],
      errors: childReport.errors || [],
      risk_notes: childReport.risk_notes || [],
    });
  } catch (error) {
    if (live) await markJob(job.id, "failed", error.message);
    report.failed += 1;
    report.results.push({
      job_id: job.id,
      company_id: company.id,
      company_name: company.name,
      status: "failed",
      errors: [error.message],
    });
  }
}

console.log(JSON.stringify(report, null, 2));

async function markJob(id, status, errorMessage) {
  await supabase
    .from("company_enrichment_jobs")
    .update({
      status,
      last_error: errorMessage || null,
      finished_at: status === "running" ? null : new Date().toISOString(),
    })
    .eq("id", id);
}

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY muessen gesetzt sein.");
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
