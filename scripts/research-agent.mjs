#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { requireLiveConfirmation } from "./safety-gates.mjs";

const args = parseArgs(process.argv.slice(2));
const filePath = args.file || args._[0];
const dryRun = hasFlag("dry-run");
const limit = numberArg("limit", Number.POSITIVE_INFINITY);
const offset = numberArg("offset", 0);
const chunkSize = numberArg("chunk-size", 500);
const maxErrors = numberArg("max-errors", 200);

if (!filePath) {
  fail(
    "Datei fehlt. Nutzung: npm run research:agent -- --file ./betriebe.csv --batch \"Bayern Import\" --source-note \"oeffentliche Unternehmenswebsites\" --dry-run",
  );
}

if (!Number.isFinite(chunkSize) || chunkSize < 1 || chunkSize > 1000) {
  fail("--chunk-size muss zwischen 1 und 1000 liegen.");
}
if (!dryRun) {
  requireLiveConfirmation({
    args,
    action: "research-agent-live",
    reason: "Research Agent schreibt Import-Batches und Kandidaten in Supabase.",
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  fail("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY muessen gesetzt sein. Fuer Prueflaeufe nutze --dry-run.");
}

const text = await readFile(filePath, "utf8");
const sourceType = args.type || inferSourceType(filePath);
const allRows = sourceType === "jsonl" ? parseJsonl(text) : parseCsv(text);
const rows = allRows.slice(offset, Number.isFinite(limit) ? offset + limit : undefined);
const batchName = args.batch || `Recherche-Agent ${new Date().toISOString().slice(0, 10)} ${basename(filePath)}`;
const sourceNote = args["source-note"] || "oeffentlich zugaengliche Gewerbedaten";
const createdBy = args["created-by"] || "research-agent";
const supabase = dryRun ? null : createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const seenKeys = new Set();
const report = {
  ok: true,
  mode: dryRun ? "dry-run" : "import",
  batch_id: args["resume-batch-id"] || null,
  batch_name: batchName,
  source_file: filePath,
  source_type: sourceType,
  source_note: sourceNote,
  total_rows_in_file: allRows.length,
  processed_rows: rows.length,
  inserted: 0,
  dry_run_valid: 0,
  duplicate_existing_company: 0,
  duplicate_existing_candidate: 0,
  duplicate_in_file: 0,
  invalid: 0,
  errors: [],
  by_status: {},
};

if (!dryRun) {
  report.batch_id = await ensureBatch();
}

for (let start = 0; start < rows.length; start += chunkSize) {
  const chunk = rows.slice(start, start + chunkSize);
  const candidates = [];

  for (let index = 0; index < chunk.length; index += 1) {
    const rowNumber = offset + start + index + 1;
    const normalized = normalizeRow(chunk[index]);
    normalized.confidence_score = calculateConfidenceScore(normalized);

    const validationError = validateCandidate(normalized);
    if (validationError) {
      addError(`Datensatz ${rowNumber}: ${validationError}`);
      report.invalid += 1;
      continue;
    }

    const fileKey = candidateKey(normalized);
    if (seenKeys.has(fileKey)) {
      report.duplicate_in_file += 1;
      incrementStatus("duplicate");
      continue;
    }
    seenKeys.add(fileKey);

    if (dryRun) {
      report.dry_run_valid += 1;
      incrementStatus(normalized.status);
      continue;
    }

    const existingCompanyId = await findDuplicateCompany(normalized);
    const existingCandidateId = existingCompanyId ? null : await findDuplicateCandidate(normalized);
    const status = existingCompanyId || existingCandidateId ? "duplicate" : normalized.status;

    if (existingCompanyId) report.duplicate_existing_company += 1;
    if (existingCandidateId) report.duplicate_existing_candidate += 1;
    incrementStatus(status);

    candidates.push({
      batch_id: report.batch_id,
      status,
      duplicate_company_id: existingCompanyId,
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
      admin_notes: existingCandidateId ? `Moegliche Dublette zu Recherche-Kandidat ${existingCandidateId}.` : null,
    });
  }

  if (candidates.length > 0) {
    const { error } = await supabase.from("research_company_candidates").insert(candidates);
    if (error) {
      report.ok = false;
      addError(`Chunk ab Datensatz ${offset + start + 1}: ${error.message}`);
    } else {
      report.inserted += candidates.length;
    }
  }
}

if (!dryRun) {
  await supabase
    .from("research_import_batches")
    .update({
      status: "in_review",
      total_candidates: report.inserted,
      admin_notes: report.errors.length ? `${report.errors.length} Importhinweise im Agentenreport.` : null,
    })
    .eq("id", report.batch_id);
}

const reportPath = await writeReport(report);
console.log(JSON.stringify({ ...report, report_path: reportPath }, null, 2));

async function ensureBatch() {
  if (args["resume-batch-id"]) return args["resume-batch-id"];

  const { data, error } = await supabase
    .from("research_import_batches")
    .insert({
      name: batchName,
      source_type: sourceType,
      source_note: sourceNote,
      status: "imported",
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error || !data) fail(error?.message || "Batch konnte nicht angelegt werden.");
  return data.id;
}

async function findDuplicateCompany(candidate) {
  if (candidate.website) {
    const { data } = await supabase.from("companies").select("id").eq("website_url", candidate.website).limit(1);
    if (data?.[0]?.id) return data[0].id;
  }

  const { data } = await supabase
    .from("companies")
    .select("id")
    .eq("postal_code", candidate.postal_code)
    .ilike("name", `%${escapeIlike(candidate.company_name)}%`)
    .limit(1);

  return data?.[0]?.id || null;
}

async function findDuplicateCandidate(candidate) {
  if (candidate.website) {
    const { data } = await supabase.from("research_company_candidates").select("id").eq("website", candidate.website).limit(1);
    if (data?.[0]?.id) return data[0].id;
  }

  const { data } = await supabase
    .from("research_company_candidates")
    .select("id")
    .eq("postal_code", candidate.postal_code)
    .ilike("company_name", `%${escapeIlike(candidate.company_name)}%`)
    .limit(1);

  return data?.[0]?.id || null;
}

function normalizeRow(row) {
  const website = normalizeWebsite(pick(row, "website", "website_url", "url"));
  const tradeName = pick(row, "trade_name", "trade", "gewerk", "primary_trade");
  const tradeSlug = slugify(pick(row, "trade_slug") || tradeName);
  const sourceUrl = normalizeWebsite(pick(row, "source_url", "quelle_url", "source", "fundstelle"));
  const retrievedAt = pick(row, "source_retrieved_at", "retrieved_at", "abrufdatum") || new Date().toISOString();
  const privacyNotes = [
    nullable(pick(row, "privacy_notes", "datenschutznotiz")),
    isFreemail(pick(row, "email", "e_mail", "mail")) ? "E-Mail wirkt wie Freemailer; oeffentliche Quelle gesondert pruefen." : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    status: normalizeStatus(pick(row, "status")),
    company_name: pick(row, "company_name", "name", "firma"),
    trade_name: tradeName,
    trade_slug: tradeSlug,
    website,
    phone: nullable(pick(row, "phone", "telefon")),
    email: normalizeEmail(pick(row, "email", "e_mail", "mail")),
    street: nullable(pick(row, "street", "address", "adresse", "strasse")),
    postal_code: pick(row, "postal_code", "plz"),
    city: pick(row, "city", "ort"),
    country: pick(row, "country", "land") || "Deutschland",
    latitude: numberOrNull(pick(row, "latitude", "lat")),
    longitude: numberOrNull(pick(row, "longitude", "lng", "lon")),
    short_description: nullable(pick(row, "short_description", "beschreibung")),
    source_url: sourceUrl,
    source_label: pick(row, "source_label", "quelle", "source_name") || sourceHost(sourceUrl) || "Oeffentliche Quelle",
    source_retrieved_at: retrievedAt,
    source_excerpt: nullable(pick(row, "source_excerpt", "quellenauszug", "excerpt")),
    confidence_score: 60,
    public_data_only: String(pick(row, "public_data_only", "oeffentliche_daten") || "true").toLowerCase() !== "false",
    privacy_notes: privacyNotes || null,
  };
}

function validateCandidate(candidate) {
  if (!candidate.company_name || candidate.company_name.length < 2) return "Firmenname fehlt.";
  if (!candidate.trade_name || !candidate.trade_slug) return "Gewerk fehlt.";
  if (!/^[0-9]{5}$/.test(candidate.postal_code)) return "PLZ muss 5-stellig sein.";
  if (!candidate.city) return "Ort fehlt.";
  if (!candidate.source_url) return "Quellen-URL fehlt.";
  if (!candidate.source_label) return "Quellenlabel fehlt.";
  if (!candidate.public_data_only) return "Datensatz ist nicht als oeffentlich zugaenglich markiert.";
  if (candidate.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) return "E-Mail ist ungueltig.";
  if (candidate.website && !/^https?:\/\/.+\..+/i.test(candidate.website)) return "Website ist ungueltig.";
  if (!Number.isFinite(Date.parse(candidate.source_retrieved_at))) return "Abrufdatum ist ungueltig.";
  return null;
}

function calculateConfidenceScore(candidate) {
  let score = 45;
  if (candidate.website) score += 15;
  if (candidate.phone) score += 8;
  if (candidate.email) score += 8;
  if (candidate.street) score += 8;
  if (candidate.source_excerpt) score += 8;
  if (candidate.latitude && candidate.longitude) score += 4;
  if (candidate.privacy_notes) score -= 5;
  return clamp(score, 0, 100);
}

async function writeReport(data) {
  const safeName = slugify(batchName).slice(0, 60) || "research-agent";
  const path = join("work", `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeName}-report.json`);
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return path;
}

function candidateKey(candidate) {
  return [normalizeKey(candidate.company_name), candidate.postal_code, normalizeKey(candidate.website || "")].join("|");
}

function incrementStatus(status) {
  report.by_status[status] = (report.by_status[status] || 0) + 1;
}

function addError(message) {
  report.ok = false;
  if (report.errors.length < maxErrors) report.errors.push(message);
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

function hasFlag(key) {
  return String(args[key] || "").toLowerCase() === "true";
}

function numberArg(key, fallback) {
  const value = Number(args[key] || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function inferSourceType(path) {
  return extname(path).toLowerCase() === ".jsonl" ? "jsonl" : "csv";
}

function parseJsonl(value) {
  return value
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function parseCsv(value) {
  const lines = value.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
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

function normalizeEmail(value) {
  return value ? value.toLowerCase() : null;
}

function numberOrNull(value) {
  if (!value) return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeWebsite(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function sourceHost(value) {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function normalizeStatus(value) {
  return ["found", "validated", "duplicate", "approved", "rejected"].includes(value) ? value : "found";
}

function slugify(value) {
  return normalizeKey(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function escapeIlike(value) {
  return String(value).replace(/[%_]/g, "");
}

function isFreemail(value) {
  const domain = String(value || "").split("@")[1]?.toLowerCase();
  return [
    "gmail.com",
    "googlemail.com",
    "gmx.de",
    "web.de",
    "t-online.de",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "yahoo.com",
  ].includes(domain);
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
