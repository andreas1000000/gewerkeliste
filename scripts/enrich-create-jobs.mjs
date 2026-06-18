#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { requireLiveConfirmation } from "./safety-gates.mjs";

const args = parseArgs(process.argv.slice(2));
const city = String(args.city || "").trim();
const limit = Number(args.limit || 500);
const source = String(args.source || `city:${city || "all"}`);
const priority = Number(args.priority || 50);
const dryRun = !args.live;

if (!city) fail("--city ist erforderlich.");
if (!dryRun) {
  requireLiveConfirmation({
    args,
    action: "enrich-create-jobs-live",
    reason: "Enrichment Jobs werden in die Queue geschrieben.",
  });
}

const supabase = createSupabaseClient();

const { data: companies, error } = await supabase
  .from("companies")
  .select("id,name,city,postal_code")
  .ilike("city", `%${city}%`)
  .order("name", { ascending: true })
  .limit(limit);

if (error) fail(`companies konnten nicht geladen werden: ${error.message}`);

const jobs = (companies || []).map((company) => ({
  company_id: company.id,
  status: "pending",
  priority,
  source,
}));

const report = {
  ok: true,
  mode: dryRun ? "dry_run" : "live",
  city,
  source,
  companies_found: companies?.length || 0,
  jobs_to_create: jobs.length,
  created: 0,
  sample: (companies || []).slice(0, 20).map((company) => ({
    id: company.id,
    name: company.name,
    city: company.city,
    postal_code: company.postal_code,
  })),
};

if (!dryRun && jobs.length > 0) {
  const { data, error: upsertError } = await supabase
    .from("company_enrichment_jobs")
    .upsert(jobs, { onConflict: "company_id,source" })
    .select("id");
  if (upsertError) fail(`company_enrichment_jobs upsert fehlgeschlagen: ${upsertError.message}`);
  report.created = data?.length || 0;
}

console.log(JSON.stringify(report, null, 2));

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
