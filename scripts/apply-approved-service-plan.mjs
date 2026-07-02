#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { requireSupabaseSafety } from "./safety-gates.mjs";

const args = parseArgs(process.argv.slice(2));
const live = Boolean(args.live);
if (!args["dry-run"] && !live) fail("Nutze --dry-run oder --live.");
if (args["dry-run"] && live) fail("--dry-run und --live duerfen nicht zusammen verwendet werden.");

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const inputPath = args.file || path.join("reports", "service-approval-apply-plan-2026-07-02.json");
const today = new Date().toISOString().slice(0, 10);
const outputPath = path.join("reports", `service-approval-live-result-${today}.json`);

if (!supabaseUrl || !serviceRoleKey) fail("Supabase ENV fehlt. Keine Daten gelesen oder geschrieben.");

requireSupabaseSafety({
  args,
  url: supabaseUrl,
  live,
  action: "apply-approved-services",
});

const plan = JSON.parse(readFileSync(inputPath, "utf8"));
const rows = Array.isArray(plan.rows) ? plan.rows : [];
if (!rows.length) fail("Apply-Plan enthaelt keine Zeilen.");
if (rows.some((row) => row.no_live_write !== true || row.approved_status !== "pending")) {
  fail("Apply-Plan enthaelt unsichere Zeilen. Erwartet: no_live_write=true und approved_status=pending.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const serviceSlugs = Array.from(new Set(rows.map((row) => row.service_slug))).sort();
const companyIds = Array.from(new Set(rows.map((row) => row.company_id))).sort();
const serviceBySlug = await loadServices(serviceSlugs);
const companies = await loadCompanies(companyIds);
const existingPairs = await loadExistingPairs(companyIds, Array.from(serviceBySlug.values()).map((service) => service.id));

const operations = rows.map((row) => {
  const service = serviceBySlug.get(row.service_slug);
  const company = companies.get(row.company_id);
  const pairKey = `${row.company_id}:${service?.id || "missing"}`;
  return {
    company_id: row.company_id,
    company_name: company?.name || "",
    city: company?.city || "",
    service_id: service?.id || null,
    service_slug: row.service_slug,
    service_name: service?.name || "",
    evidence: row.evidence,
    confidence: row.confidence,
    write_action: existingPairs.has(pairKey) ? "would_update_existing" : "would_insert_new",
    safe_to_apply: Boolean(service?.id && company?.id && row.confidence === "high"),
  };
});

const unsafe = operations.filter((operation) => !operation.safe_to_apply);
if (unsafe.length) {
  await writeFile(outputPath, `${JSON.stringify({ status: "blocked", live, unsafe }, null, 2)}\n`);
  fail(`Apply blockiert: ${unsafe.length} unsichere Zeilen. Siehe ${outputPath}`);
}

if (live) {
  for (const operation of operations) {
    const payload = {
      company_id: operation.company_id,
      service_id: operation.service_id,
      confidence_score: 95,
      source: "service_approval_high_priority_review",
      status: "confirmed",
    };
    const { error } = await supabase.from("company_services").upsert(payload, { onConflict: "company_id,service_id" });
    if (error) {
      await writeFile(outputPath, `${JSON.stringify({ status: "error", live, failed_operation: operation, error: error.message }, null, 2)}\n`);
      fail(`company_services upsert fehlgeschlagen: ${error.message}`);
    }
  }
}

const result = {
  status: "ok",
  mode: live ? "live" : "dry_run",
  input: inputPath,
  no_live_write: !live,
  rows: operations.length,
  inserts_or_updates: operations.length,
  would_insert_new: operations.filter((operation) => operation.write_action === "would_insert_new").length,
  would_update_existing: operations.filter((operation) => operation.write_action === "would_update_existing").length,
  service_pages: new Set(operations.map((operation) => operation.service_slug)).size,
  service_location_pages: new Set(operations.map((operation) => `${operation.service_slug}/${slugify(operation.city)}`)).size,
  company_profiles: new Set(operations.map((operation) => operation.company_id)).size,
  operations,
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  status: result.status,
  mode: result.mode,
  output: outputPath,
  rows: result.rows,
  would_insert_new: result.would_insert_new,
  would_update_existing: result.would_update_existing,
  service_pages: result.service_pages,
  service_location_pages: result.service_location_pages,
  company_profiles: result.company_profiles,
}, null, 2));

async function loadServices(slugs) {
  const { data, error } = await supabase
    .from("services")
    .select("id,slug,name,is_active")
    .in("slug", slugs);
  if (error) fail(`services lookup fehlgeschlagen: ${error.message}`);

  const grouped = new Map();
  for (const service of data || []) {
    if (!service.is_active) continue;
    const list = grouped.get(service.slug) || [];
    list.push(service);
    grouped.set(service.slug, list);
  }

  const result = new Map();
  for (const slug of slugs) {
    const matches = grouped.get(slug) || [];
    if (matches.length !== 1) fail(`Service-Slug ${slug} ist nicht eindeutig oder fehlt (${matches.length}).`);
    result.set(slug, matches[0]);
  }
  return result;
}

async function loadCompanies(ids) {
  const { data, error } = await supabase
    .from("companies")
    .select("id,name,city,public_visible")
    .in("id", ids);
  if (error) fail(`companies lookup fehlgeschlagen: ${error.message}`);

  const result = new Map();
  for (const company of data || []) {
    if (company.public_visible) result.set(company.id, company);
  }
  if (result.size !== ids.length) fail(`Nicht alle Firmen sind public_visible auffindbar (${result.size}/${ids.length}).`);
  return result;
}

async function loadExistingPairs(companyIds, serviceIds) {
  const result = new Set();
  for (const companyId of companyIds) {
    const { data, error } = await supabase
      .from("company_services")
      .select("company_id,service_id")
      .eq("company_id", companyId)
      .in("service_id", serviceIds);
    if (error) fail(`company_services lookup fehlgeschlagen: ${error.message}`);
    for (const row of data || []) result.add(`${row.company_id}:${row.service_id}`);
  }
  return result;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
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

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
