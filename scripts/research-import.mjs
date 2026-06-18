#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { requireLiveConfirmation } from "./safety-gates.mjs";

const args = parseArgs(process.argv.slice(2));
const filePath = args.file || args._[0];

if (!filePath) {
  fail("Datei fehlt. Nutzung: npm run research:import -- --file ./betriebe.csv --batch \"Rosenheim Test\" --source-note \"öffentliche Firmenwebsites\"");
}
requireLiveConfirmation({
  args,
  action: "research-import-live",
  reason: "Research Import schreibt Batches und Kandidaten in die Datenbank.",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY muessen gesetzt sein.");
}

const text = await readFile(filePath, "utf8");
const sourceType = args.type || inferSourceType(filePath);
const rows = sourceType === "jsonl" ? parseJsonl(text) : parseCsv(text);
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const batchName = args.batch || `Recherche-Import ${new Date().toISOString().slice(0, 10)} ${basename(filePath)}`;
const sourceNote = args["source-note"] || null;

const { data: batch, error: batchError } = await supabase
  .from("research_import_batches")
  .insert({
    name: batchName,
    source_type: sourceType,
    source_note: sourceNote,
    status: "imported",
    created_by: args["created-by"] || "research-agent",
  })
  .select("id")
  .single();

if (batchError || !batch) fail(batchError?.message || "Batch konnte nicht angelegt werden.");

let created = 0;
let skipped = 0;
const errors = [];

for (let index = 0; index < rows.length; index += 1) {
  const rowNumber = index + 1;
  const normalized = normalizeRow(rows[index]);

  const validationError = validateCandidate(normalized);
  if (validationError) {
    errors.push(`Datensatz ${rowNumber}: ${validationError}`);
    continue;
  }

  const duplicateId = await findDuplicateCompany(normalized);
  const { error } = await supabase.from("research_company_candidates").insert({
    batch_id: batch.id,
    status: duplicateId ? "duplicate" : normalized.status,
    duplicate_company_id: duplicateId,
    company_name: normalized.company_name,
    trade_name: normalized.trade_name,
    trade_slug: normalized.trade_slug,
    website: normalized.website,
    phone: normalized.phone,
    email: normalized.email,
    street: normalized.street,
    postal_code: normalized.postal_code,
    city: normalized.city,
    country: normalized.country,
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    short_description: normalized.short_description,
    source_url: normalized.source_url,
    source_label: normalized.source_label,
    source_retrieved_at: normalized.source_retrieved_at,
    source_excerpt: normalized.source_excerpt,
    confidence_score: normalized.confidence_score,
    public_data_only: normalized.public_data_only,
    privacy_notes: normalized.privacy_notes,
  });

  if (error) {
    errors.push(`Datensatz ${rowNumber}: ${error.message}`);
    continue;
  }

  if (duplicateId) skipped += 1;
  created += 1;
}

await supabase
  .from("research_import_batches")
  .update({
    total_candidates: created,
    admin_notes: errors.length ? `${errors.length} Importfehler. Details im Konsolenreport.` : null,
  })
  .eq("id", batch.id);

console.log(
  JSON.stringify(
    {
      ok: errors.length === 0,
      batch_id: batch.id,
      batch_name: batchName,
      created,
      duplicates_marked: skipped,
      errors,
    },
    null,
    2,
  ),
);

async function findDuplicateCompany(candidate) {
  let query = supabase
    .from("companies")
    .select("id")
    .eq("postal_code", candidate.postal_code)
    .ilike("name", `%${candidate.company_name}%`)
    .limit(1);

  if (candidate.website) query = query.or(`website_url.eq.${candidate.website},website_url.is.null`);

  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;
  return data[0].id;
}

function normalizeRow(row) {
  const website = normalizeWebsite(pick(row, "website", "website_url", "url"));
  const tradeName = pick(row, "trade_name", "trade", "gewerk", "primary_trade");
  const tradeSlug = slugify(pick(row, "trade_slug") || tradeName);
  const retrievedAt = pick(row, "source_retrieved_at", "retrieved_at", "abrufdatum") || new Date().toISOString();

  return {
    status: pick(row, "status") || "found",
    company_name: pick(row, "company_name", "name", "firma"),
    trade_name: tradeName,
    trade_slug: tradeSlug,
    website,
    phone: nullable(pick(row, "phone", "telefon")),
    email: nullable(pick(row, "email", "e_mail", "mail")),
    street: nullable(pick(row, "street", "address", "adresse", "strasse")),
    postal_code: pick(row, "postal_code", "plz"),
    city: pick(row, "city", "ort"),
    country: pick(row, "country", "land") || "Deutschland",
    latitude: numberOrNull(pick(row, "latitude", "lat")),
    longitude: numberOrNull(pick(row, "longitude", "lng", "lon")),
    short_description: nullable(pick(row, "short_description", "beschreibung")),
    source_url: normalizeWebsite(pick(row, "source_url", "quelle_url", "source")),
    source_label: pick(row, "source_label", "quelle", "source_label") || "Öffentliche Quelle",
    source_retrieved_at: retrievedAt,
    source_excerpt: nullable(pick(row, "source_excerpt", "quellenauszug")),
    confidence_score: clamp(Number(pick(row, "confidence_score", "score") || 60), 0, 100),
    public_data_only: String(pick(row, "public_data_only", "oeffentliche_daten") || "true").toLowerCase() !== "false",
    privacy_notes: nullable(pick(row, "privacy_notes", "datenschutznotiz")),
  };
}

function validateCandidate(candidate) {
  if (!candidate.company_name || candidate.company_name.length < 2) return "Firmenname fehlt.";
  if (!candidate.trade_name || !candidate.trade_slug) return "Gewerk fehlt.";
  if (!/^[0-9]{5}$/.test(candidate.postal_code)) return "PLZ muss 5-stellig sein.";
  if (!candidate.city) return "Ort fehlt.";
  if (!candidate.source_url) return "Quellen-URL fehlt.";
  if (!candidate.source_label) return "Quellenlabel fehlt.";
  if (!candidate.public_data_only) return "Datensatz ist nicht als öffentlich zugänglich markiert.";
  if (candidate.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) return "E-Mail ist ungültig.";
  return null;
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

function inferSourceType(filePath) {
  return extname(filePath).toLowerCase() === ".jsonl" ? "jsonl" : "csv";
}

function parseJsonl(text) {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""]));
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current);
  return values;
}

function pick(row, ...keys) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
  }
  return "";
}

function nullable(value) {
  return value ? value : null;
}

function numberOrNull(value) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeWebsite(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
