#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { requireLiveConfirmation } from "./safety-gates.mjs";

const args = parseArgs(process.argv.slice(2));
const filePath = args.file || args._[0];
const dryRun = String(args["dry-run"] || "false").toLowerCase() === "true";
const cityFilter = args.city || "";
const defaultLatitude = numberArg("default-latitude", 47.8389);
const defaultLongitude = numberArg("default-longitude", 12.2071);

if (!filePath) fail("Datei fehlt. Nutzung: node scripts/publish-public-basis-entries.mjs --file work/candidates.jsonl --city Riedering");
if (!dryRun) {
  requireLiveConfirmation({
    args,
    action: "publish-public-basis-entries-live",
    reason: "Basis-Eintraege werden oeffentlich sichtbar in companies angelegt.",
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  fail("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY muessen gesetzt sein.");
}

const supabase = dryRun ? null : createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const input = parseJsonl(await readFile(filePath, "utf8")).filter((candidate) => {
  if (!cityFilter) return true;
  return normalize(candidate.city).includes(normalize(cityFilter)) || normalize(candidate.postal_code) === normalize(cityFilter);
});

const seen = new Set();
const report = {
  ok: true,
  dry_run: dryRun,
  source_file: filePath,
  city_filter: cityFilter || null,
  candidates_seen: input.length,
  created: 0,
  skipped_duplicate: 0,
  skipped_invalid: 0,
  errors: [],
  created_slugs: [],
};

for (const candidate of input) {
  const validationError = validate(candidate);
  if (validationError) {
    report.skipped_invalid += 1;
    addError(`${candidate.company_name || "Unbekannt"}: ${validationError}`);
    continue;
  }

  const key = [normalize(candidate.company_name), normalize(candidate.street), candidate.postal_code].join("|");
  if (seen.has(key)) {
    report.skipped_duplicate += 1;
    continue;
  }
  seen.add(key);

  if (dryRun) {
    report.created += 1;
    continue;
  }

  const existing = await findExisting(candidate);
  if (existing) {
    report.skipped_duplicate += 1;
    continue;
  }

  const tradeSlug = slugify(candidate.trade_slug || candidate.trade_name);
  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .upsert({ name: candidate.trade_name, slug: tradeSlug }, { onConflict: "slug" })
    .select("id")
    .single();

  if (tradeError || !trade) {
    addError(`${candidate.company_name}: ${tradeError?.message || "Gewerk konnte nicht angelegt werden."}`);
    continue;
  }

  const slug = await uniqueCompanySlug(companySlug(candidate.company_name, candidate.postal_code, candidate.city));
  const description = [
    `${candidate.trade_name} in ${candidate.city}.`,
    "Öffentlicher Basis-Eintrag aus öffentlich zugänglichen Gewerbedaten. Der Eintrag ist noch nicht vom Betrieb bestätigt.",
    `Quelle: ${candidate.source_label} (${candidate.source_url})`,
    "Korrektur oder Löschung kann jederzeit angefragt werden.",
  ].join("\n\n");

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      trade_id: trade.id,
      name: candidate.company_name,
      slug,
      description,
      contact_name: null,
      email: candidate.email || null,
      phone: candidate.phone || null,
      website_url: normalizeWebsite(candidate.website),
      street: candidate.street || null,
      city: candidate.city,
      postal_code: candidate.postal_code,
      latitude: candidate.latitude ?? defaultLatitude,
      longitude: candidate.longitude ?? defaultLongitude,
      claim_status: "unclaimed",
      verified: false,
      public_visible: true,
    })
    .select("id, slug")
    .single();

  if (companyError || !company) {
    addError(`${candidate.company_name}: ${companyError?.message || "Eintrag konnte nicht angelegt werden."}`);
    continue;
  }

  report.created += 1;
  report.created_slugs.push(company.slug);
}

console.log(JSON.stringify(report, null, 2));

async function findExisting(candidate) {
  let query = supabase.from("companies").select("id").eq("postal_code", candidate.postal_code).eq("name", candidate.company_name).limit(1);
  if (candidate.street) query = query.eq("street", candidate.street);
  const { data, error } = await query;
  if (error) {
    addError(`${candidate.company_name}: Dublettenpruefung fehlgeschlagen: ${error.message}`);
    return true;
  }
  return Boolean(data?.length);
}

async function uniqueCompanySlug(base) {
  let slug = base;
  let counter = 2;
  while (true) {
    const { data, error } = await supabase.from("companies").select("id").eq("slug", slug).limit(1);
    if (error) throw error;
    if (!data?.length) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

function validate(candidate) {
  if (!candidate.company_name) return "Firmenname fehlt.";
  if (!candidate.trade_name) return "Gewerk fehlt.";
  if (!candidate.postal_code || !/^[0-9]{5}$/.test(candidate.postal_code)) return "PLZ fehlt oder ist ungueltig.";
  if (!candidate.city) return "Ort fehlt.";
  if (!candidate.source_url) return "Quelle fehlt.";
  if (!candidate.source_label) return "Quellenlabel fehlt.";
  return null;
}

function parseJsonl(value) {
  return value
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function companySlug(name, postalCode, city) {
  return slugify([name, postalCode, city].filter(Boolean).join(" "));
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function normalizeWebsite(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
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
      result[key] = "true";
      continue;
    }
    result[key] = next;
    index += 1;
  }
  return result;
}

function numberArg(key, fallback) {
  const value = Number(args[key] || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function addError(message) {
  report.ok = false;
  if (report.errors.length < 100) report.errors.push(message);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
