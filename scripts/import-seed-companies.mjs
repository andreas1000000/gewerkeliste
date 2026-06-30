#!/usr/bin/env node

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import ts from "typescript";
import { requireSupabaseSafety } from "./safety-gates.mjs";

const args = parseArgs(process.argv.slice(2));
const live = Boolean(args.live);
const dryRun = Boolean(args["dry-run"]) || !live;
const seedFile = args.file || "work/curated-seed-companies.tsv";
const defaultLatitude = numberArg("default-latitude", 47.8564);
const defaultLongitude = numberArg("default-longitude", 12.1225);
const source = "curated_seed_list";
const sourceNote = "kuratierter regionaler Startdatenbestand";
const region = "Rosenheim / Oberbayern";

if (live && args["dry-run"]) fail("Bitte genau einen Modus nutzen: --dry-run oder --live.");

const [{ publicTradeTaxonomy, tradeSlugAliases }, { serviceTaxonomy }] = await Promise.all([importTradeTaxonomyModule(), importServiceTaxonomyModule()]);
const taxonomy = buildTaxonomyIndex(publicTradeTaxonomy(), tradeSlugAliases, serviceTaxonomy);
const seedText = await readFile(path.resolve(seedFile), "utf8");
const parsedRows = parseSeedTable(seedText, taxonomy);
const candidates = parsedRows.map((row, index) => buildCandidate(row, index + 1, taxonomy));
const duplicates = detectSeedDuplicates(candidates);

const report = buildDryRunReport(candidates, duplicates);

if (dryRun) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!supabaseUrl || !serviceRoleKey) fail("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY muessen gesetzt sein.");

requireSupabaseSafety({ args, url: supabaseUrl, live, action: "import-seed-companies-live" });

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const existingCompanies = await loadExistingCompanies();
const liveReport = {
  ...report,
  mode: "live",
  inserted_companies: 0,
  skipped_duplicates: 0,
  inserted_internal_contact_sources: 0,
  inserted_review_items: 0,
  inserted_company_trade_links: 0,
  inserted_company_service_links: 0,
  errors: [],
  created_slugs: [],
};
let servicesTableAvailable = true;

const seedDuplicateKeys = new Set(duplicates.map((duplicate) => duplicate.key));

for (const candidate of candidates) {
  if (!candidate.importable) continue;
  if (seedDuplicateKeys.has(candidate.duplicateKey)) {
    liveReport.skipped_duplicates += 1;
    continue;
  }

  const existing = findExistingCompany(candidate, existingCompanies);
  if (existing) {
    liveReport.skipped_duplicates += 1;
    await insertDuplicateReview(candidate, existing);
    continue;
  }

  try {
    const trade = await getOrCreateTrade(candidate.tradeMapped);
    const slug = await uniqueCompanySlug(companySlug(candidate.companyName, candidate.postalCode, candidate.city));
    const company = await insertCompany(candidate, trade.id, slug);
    existingCompanies.push({
      id: company.id,
      name: candidate.companyName,
      slug,
      street: candidate.street,
      city: candidate.city,
      postal_code: candidate.postalCode,
      email: candidate.publicEmail,
      phone: candidate.publicPhone,
      website_url: candidate.website,
    });
    liveReport.inserted_companies += 1;
    liveReport.created_slugs.push(slug);

    await insertCompanySource(company.id, candidate);
    if (candidate.internalContacts.length > 0) {
      liveReport.inserted_internal_contact_sources += 1;
      await insertInternalContactSource(company.id, candidate);
      liveReport.inserted_review_items += 1;
      await insertContactReview(company.id, candidate);
    }

    await upsertCompanyTrade(company.id, trade.id, candidate);
    liveReport.inserted_company_trade_links += 1;

    const serviceRows = await mapServiceRows(candidate, company.id);
    for (const row of serviceRows) {
      const { error } = await supabase.from("company_services").upsert(row, { onConflict: "company_id,service_id" });
      if (error) addLiveError(`${candidate.companyName}: company_services ${error.message}`);
      else liveReport.inserted_company_service_links += 1;
    }
  } catch (error) {
    addLiveError(`${candidate.companyName}: ${error.message}`);
  }
}

console.log(JSON.stringify(liveReport, null, 2));
process.exit(liveReport.errors.length ? 1 : 0);

function parseSeedTable(text, taxonomyIndex) {
  const lines = text.replace(/\r/g, "").split("\n");
  const rows = [];
  let current = null;
  let pendingTradePrefix = "";

  for (const rawLine of lines.slice(1)) {
    const line = rawLine.trim();
    if (!line) continue;
    const cells = rawLine.split("\t");

    const firstCell = cell(cells[0]);
    const combinedTrade = [pendingTradePrefix, firstCell].filter(Boolean).join(" ");
    const startsRecord = cells.length >= 3 && isKnownSeedTrade(combinedTrade, taxonomyIndex);

    if (startsRecord) {
      if (current) rows.push(normalizeRow(current));
      if (pendingTradePrefix) {
        cells[0] = `${pendingTradePrefix} ${cells[0]}`.trim();
        pendingTradePrefix = "";
      }
      current = {
        tradeOriginal: cell(cells[0]),
        companyName: cell(cells[1]),
        street: cell(cells[2]),
        location: cell(cells[3]),
        phoneRaw: cell(cells[4]),
        emailRaw: cell(cells.slice(5).join("\n")),
      };
      continue;
    }

    if (!current) {
      pendingTradePrefix = [pendingTradePrefix, line].filter(Boolean).join(" ");
      continue;
    }

    if (cells.length > 1) {
      appendContinuationCells(current, cells);
    } else if (isKnownSeedTrade(line, taxonomyIndex) || /\/$/.test(line)) {
      pendingTradePrefix = [pendingTradePrefix, line].filter(Boolean).join(" ");
    } else if (line.includes("@")) current.emailRaw = appendLine(current.emailRaw, line);
    else if (/\b[0-9]{5}\b/.test(line)) current.location = appendLine(current.location, line);
    else if (isPhoneLike(line) || /mobil|fax/i.test(line)) current.phoneRaw = appendLine(current.phoneRaw, line);
    else if (!current.street || !/\b[0-9]{5}\b/.test(current.location)) current.street = appendLine(current.street, line);
    else current.companyName = appendLine(current.companyName, line);
  }

  if (current) rows.push(normalizeRow(current));
  return rows.filter((row) => row.companyName && row.tradeOriginal);
}

function appendContinuationCells(current, cells) {
  for (const part of cells.map(cell).filter(Boolean)) {
    if (part.includes("@")) current.emailRaw = appendLine(current.emailRaw, part);
    else if (/\b[0-9]{5}\b/.test(part)) current.location = appendLine(current.location, part);
    else if (isPhoneLike(part) || /mobil|fax/i.test(part)) current.phoneRaw = appendLine(current.phoneRaw, part);
    else if (!current.street || !/\b[0-9]{5}\b/.test(current.location)) current.street = appendLine(current.street, part);
    else current.companyName = appendLine(current.companyName, part);
  }
}

function normalizeRow(row) {
  const location = cleanText(row.location).replace(/^D-/, "");
  const match = parseLocation(location);
  return {
    tradeOriginal: cleanText(row.tradeOriginal),
    companyName: cleanText(row.companyName),
    street: cleanText(row.street),
    postalCode: match?.postalCode || "",
    city: cleanText(match?.city || location.replace(/[0-9]/g, "")),
    phoneRaw: cleanText(row.phoneRaw),
    emailRaw: cleanText(row.emailRaw),
  };
}

function parseLocation(value) {
  const lines = String(value || "").split("\n").map((line) => line.replace(/^D-/, "").trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/\b([0-9]{5})\s+(.+)$/);
    if (!match) continue;
    const city = match[2]
      .replace(/\s+(?:\+|0|'|\.)\s*[0-9][0-9\s().\/+-]{5,}.*$/i, "")
      .replace(/\s+mobil.*$/i, "")
      .replace(/\s+fax.*$/i, "")
      .trim();
    return { postalCode: match[1], city };
  }
  return null;
}

function buildCandidate(row, rowNumber, taxonomyIndex) {
  const emails = extractEmails(row.emailRaw);
  const phones = extractPhones(row.phoneRaw);
  const emailClassifications = emails.map(classifyEmail);
  const phoneClassifications = phones.map((phone) => classifyPhone(phone, row.phoneRaw));
  const publicEmail = emailClassifications.find((item) => item.public)?.email || null;
  const publicPhone = phoneClassifications.find((item) => item.public)?.phone || null;
  const internalContacts = [
    ...emailClassifications.filter((item) => !item.public).map((item) => ({ type: "email", value: item.email, reason: item.reason })),
    ...phoneClassifications.filter((item) => !item.public).map((item) => ({ type: "phone", value: item.phone, reason: item.reason })),
  ];
  const tradeMapped = mapTrade(row.tradeOriginal, taxonomyIndex);
  const servicesMapped = mapServices(row.tradeOriginal, tradeMapped, taxonomyIndex);
  const duplicateKey = [normalizeKey(row.companyName), row.postalCode, normalizeKey(row.city), normalizeKey(row.street)].join("|");
  const validationErrors = [];
  if (!row.companyName) validationErrors.push("Firmenname fehlt");
  if (!row.postalCode || !/^[0-9]{5}$/.test(row.postalCode)) validationErrors.push("PLZ fehlt oder ungueltig");
  if (!row.city) validationErrors.push("Ort fehlt");
  if (!tradeMapped) validationErrors.push("Gewerk nicht gemappt");
  if (row.companyName.includes("\n")) validationErrors.push("Mehrzeiliger Firmenname unklar");

  return {
    rowNumber,
    companyName: row.companyName,
    tradeOriginal: row.tradeOriginal,
    tradeMapped,
    servicesMapped,
    street: row.street,
    postalCode: row.postalCode,
    city: row.city,
    region,
    website: null,
    publicEmail,
    publicPhone,
    emails,
    phones,
    internalContacts,
    withheldMobilePhones: phoneClassifications.filter((item) => item.reason === "mobile").length,
    withheldPersonalEmails: emailClassifications.filter((item) => item.reason === "personal_email" || item.reason === "private_provider").length,
    validationErrors,
    importable: validationErrors.length === 0,
    duplicateKey,
    emailDomains: emails.map((email) => email.split("@")[1]).filter(Boolean),
    phoneKeys: phones.map(normalizePhone).filter(Boolean),
    raw: row,
  };
}

function buildDryRunReport(candidates, duplicateGroups) {
  const critical = candidates
    .filter((candidate) => candidate.validationErrors.length || candidate.internalContacts.length || duplicateGroups.some((group) => group.key === candidate.duplicateKey))
    .slice(0, 60)
    .map((candidate) => ({
      row: candidate.rowNumber,
      company_name: candidate.companyName,
      trade_original: candidate.tradeOriginal,
      trade_mapped: candidate.tradeMapped?.slug || null,
      city: candidate.city,
      postal_code: candidate.postalCode,
      reasons: [
        ...candidate.validationErrors,
        candidate.internalContacts.length ? "interne Kontaktdaten pruefen" : null,
        duplicateGroups.some((group) => group.key === candidate.duplicateKey) ? "Dublettenverdacht" : null,
      ].filter(Boolean),
    }));

  return {
    ok: candidates.every((candidate) => candidate.validationErrors.length === 0),
    mode: "dry_run",
    source_file: seedFile,
    total_records: candidates.length,
    unique_companies: new Set(candidates.map((candidate) => candidate.duplicateKey)).size,
    suspected_duplicates: duplicateGroups.reduce((sum, group) => sum + group.rows.length, 0),
    public_importable_basic_profiles: candidates.filter((candidate) => candidate.importable).length,
    internally_stored_emails: candidates.reduce((sum, candidate) => sum + candidate.internalContacts.filter((item) => item.type === "email").length, 0),
    internally_stored_phone_numbers: candidates.reduce((sum, candidate) => sum + candidate.internalContacts.filter((item) => item.type === "phone").length, 0),
    withheld_mobile_numbers: candidates.reduce((sum, candidate) => sum + candidate.withheldMobilePhones, 0),
    withheld_personal_emails: candidates.reduce((sum, candidate) => sum + candidate.withheldPersonalEmails, 0),
    unmapped_trades: candidates.filter((candidate) => !candidate.tradeMapped).length,
    duplicate_suspicions: duplicateGroups.map((group) => ({ rows: group.rows, companies: group.names })),
    critical_records_for_manual_review: critical,
  };
}

function detectSeedDuplicates(candidates) {
  const groups = new Map();
  for (const candidate of candidates) {
    const keys = [
      candidate.duplicateKey,
      [normalizeKey(candidate.companyName), candidate.postalCode, normalizeKey(candidate.city)].join("|"),
      ...candidate.emailDomains.map((domain) => [normalizeKey(candidate.companyName), domain].join("|")),
      ...candidate.phoneKeys.map((phone) => [normalizeKey(candidate.companyName), phone].join("|")),
    ];
    for (const key of keys.filter(Boolean)) {
      const group = groups.get(key) || [];
      group.push(candidate);
      groups.set(key, group);
    }
  }
  const uniqueGroups = new Map();
  for (const [key, group] of groups.entries()) {
    const rows = [...new Set(group.map((candidate) => candidate.rowNumber))];
    if (rows.length <= 1) continue;
    const rowKey = rows.join(",");
    if (!uniqueGroups.has(rowKey)) uniqueGroups.set(rowKey, { key, group });
  }

  return [...uniqueGroups.values()]
    .filter(({ group }) => new Set(group.map((candidate) => candidate.rowNumber)).size > 1)
    .map(({ key, group }) => ({
      key,
      rows: [...new Set(group.map((candidate) => candidate.rowNumber))],
      names: [...new Set(group.map((candidate) => candidate.companyName))],
    }));
}

async function loadExistingCompanies() {
  const { data, error } = await supabase.from("companies").select("id,name,slug,street,city,postal_code,email,phone,website_url");
  if (error) fail(`Bestehende Betriebe konnten nicht geladen werden: ${error.message}`);
  return data || [];
}

function findExistingCompany(candidate, companies) {
  return companies.find((company) => {
    const sameName = normalizeKey(company.name) === normalizeKey(candidate.companyName);
    const sameLocation = normalizeKey(company.city) === normalizeKey(candidate.city) && String(company.postal_code || "") === candidate.postalCode;
    const sameStreet = normalizeKey(company.street) && normalizeKey(company.street) === normalizeKey(candidate.street);
    const sameEmailDomain = candidate.emailDomains.some((domain) => normalizeKey(company.email || "").endsWith(`@${domain}`) || normalizeKey(company.website_url || "").includes(domain));
    const samePhone = candidate.phoneKeys.some((phone) => normalizePhone(company.phone || "") === phone);
    return sameName && (sameLocation || sameStreet || sameEmailDomain || samePhone);
  });
}

async function getOrCreateTrade(tradeMapped) {
  const { data: existing, error } = await supabase.from("trades").select("id,name,slug").eq("slug", tradeMapped.slug).maybeSingle();
  if (error) throw error;
  if (existing) return existing;
  const { data: existingByName, error: nameError } = await supabase.from("trades").select("id,name,slug").eq("name", tradeMapped.name).maybeSingle();
  if (nameError) throw nameError;
  if (existingByName) return existingByName;
  const { data, error: insertError } = await supabase.from("trades").insert({ name: tradeMapped.name, slug: tradeMapped.slug }).select("id,name,slug").single();
  if (insertError || !data) throw insertError || new Error(`Gewerk konnte nicht angelegt werden: ${tradeMapped.slug}`);
  return data;
}

async function insertCompany(candidate, tradeId, slug) {
  const description = [
    `${candidate.tradeMapped.name} in ${candidate.city}.`,
    "Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand.",
    "Dieses Profil ist noch nicht vom Betrieb verifiziert. Korrektur oder Loeschung kann jederzeit angefragt werden.",
  ].join("\n\n");
  const payload = {
    trade_id: tradeId,
    name: candidate.companyName,
    slug,
    description,
    contact_name: null,
    email: candidate.publicEmail,
    phone: candidate.publicPhone,
    website_url: candidate.website,
    street: candidate.street || null,
    city: candidate.city,
    postal_code: candidate.postalCode,
    latitude: defaultLatitude,
    longitude: defaultLongitude,
    public_visible: true,
    claim_status: "unclaimed",
    verified: false,
    needs_review: candidate.internalContacts.length > 0,
    profile_status: candidate.internalContacts.length > 0 ? "needs_review" : "imported",
  };
  const { data, error } = await supabase.from("companies").insert(payload).select("id,slug").single();
  if (error || !data) throw error || new Error("Betrieb konnte nicht angelegt werden.");
  return data;
}

async function insertCompanySource(companyId, candidate) {
  const { error } = await supabase.from("company_sources").insert({
    company_id: companyId,
    source_type: source,
    source_url: null,
    title: "Kuratierte Seed-Liste Andreas Moser",
    snippet: `${candidate.tradeOriginal} | ${candidate.companyName} | ${candidate.postalCode} ${candidate.city}`,
    content: JSON.stringify({
      source,
      source_note: sourceNote,
      profile_type: "free_basic",
      visibility: "public",
      region,
      created_by_import: true,
      trade_original: candidate.tradeOriginal,
      trade_mapped: candidate.tradeMapped?.slug,
      services_mapped: candidate.servicesMapped.map((service) => service.slug),
    }),
    source_name: source,
    confidence_score: 80,
    extracted_at: new Date().toISOString(),
    raw_snippet: `${candidate.raw.phoneRaw || ""}\n${candidate.raw.emailRaw || ""}`.trim().slice(0, 1000),
  });
  if (error) throw error;
}

async function insertInternalContactSource(companyId, candidate) {
  const { error } = await supabase.from("company_sources").insert({
    company_id: companyId,
    source_type: "internal_only",
    source_url: null,
    title: "Interne Kontaktdaten aus kuratierter Seed-Liste",
    snippet: "Nicht oeffentlich anzeigen. Review erforderlich.",
    content: JSON.stringify({
      visibility: "internal_only",
      data_status: "needs_review",
      purpose: "profile_claim_notification",
      source,
      contacts: candidate.internalContacts,
    }),
    source_name: source,
    confidence_score: 60,
    extracted_at: new Date().toISOString(),
    raw_snippet: JSON.stringify(candidate.internalContacts),
  });
  if (error) throw error;
}

async function insertContactReview(companyId, candidate) {
  const { error } = await supabase.from("review_queue").insert({
    company_id: companyId,
    item_type: "seed_contact_privacy",
    reason: "Nicht oeffentliche Kontaktdaten aus kuratierter Seed-Liste pruefen",
    payload: {
      visibility: "internal_only",
      data_status: "needs_review",
      purpose: "profile_claim_notification",
      source,
      company_name: candidate.companyName,
      contacts: candidate.internalContacts,
    },
    status: "pending",
  });
  if (error) throw error;
}

async function insertDuplicateReview(candidate, existing) {
  const { data: sourceRows } = await supabase.from("company_sources").select("id").eq("company_id", existing.id).eq("source_type", source).limit(1);
  if (sourceRows?.length) return;

  await supabase.from("review_queue").insert({
    company_id: existing.id,
    item_type: "seed_duplicate_suspected",
    reason: "Seed-Datensatz moegliche Dublette; nicht neu angelegt",
    payload: { source, company_name: candidate.companyName, existing_company_id: existing.id, row: candidate.rowNumber },
    status: "pending",
  });
}

async function upsertCompanyTrade(companyId, tradeId, candidate) {
  const row = {
    company_id: companyId,
    trade_id: tradeId,
    confidence_score: 85,
    source,
    evidence: candidate.tradeOriginal,
    status: "agent_suggested",
    visibility_level: "basis_public",
  };
  const { error } = await supabase.from("company_trades").upsert(row, { onConflict: "company_id,trade_id" });
  if (error) throw error;
}

async function mapServiceRows(candidate, companyId) {
  if (!servicesTableAvailable) return [];
  if (candidate.servicesMapped.length === 0) return [];
  const slugs = candidate.servicesMapped.map((service) => service.slug);
  const { data, error } = await supabase.from("services").select("id,slug").in("slug", slugs);
  if (error) {
    if (error.message?.includes("Could not find the table 'public.services'")) {
      servicesTableAvailable = false;
      return [];
    }
    addLiveError(`${candidate.companyName}: services lookup ${error.message}`);
    return [];
  }
  return (data || []).map((service) => ({
    company_id: companyId,
    service_id: service.id,
    confidence_score: 70,
    source,
    status: "suggested",
  }));
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

function buildTaxonomyIndex(trades, aliases, serviceGroups) {
  const bySlug = new Map(trades.map((trade) => [trade.slug, trade]));
  const terms = new Map();
  for (const trade of trades) {
    [trade.slug, trade.name, ...(trade.synonyms || []), ...(trade.subTrades || []), ...(trade.coreServices || [])].forEach((term) => {
      if (term) terms.set(normalizeKey(term), trade.slug);
    });
  }
  Object.entries(aliases || {}).forEach(([alias, slug]) => terms.set(normalizeKey(alias), slug));
  for (const [original, slug] of manualTradeEntries()) terms.set(normalizeKey(original), slug);

  const servicesByTrade = new Map();
  for (const group of serviceGroups) {
    for (const trade of group.trades) {
      if (!bySlug.has(trade.slug)) {
        bySlug.set(trade.slug, {
          slug: trade.slug,
          name: trade.name,
          category: "Planung / Gutachten / Fachberatung",
          shortDescription: trade.description,
          synonyms: trade.aliases || [],
          subTrades: [],
          coreServices: [],
          specializations: [],
          projectTypes: [],
          relatedTrades: [],
          typicalBusinessTypes: [],
          seoTitle: trade.name,
          seoDescription: trade.description,
        });
      }
      [trade.slug, trade.name, ...(trade.aliases || [])].forEach((term) => terms.set(normalizeKey(term), trade.slug));
      servicesByTrade.set(trade.slug, [...(servicesByTrade.get(trade.slug) || []), ...trade.families.flatMap((family) => family.services)]);
    }
  }
  return { bySlug, terms, servicesByTrade };
}

function isKnownSeedTrade(value, taxonomyIndex) {
  const normalized = normalizeKey(value);
  if (!normalized) return false;
  if (taxonomyIndex.terms.has(normalized)) return true;
  return manualTradeEntries().some(([label]) => normalizeKey(label) === normalized);
}

function mapTrade(original, taxonomyIndex) {
  const normalized = normalizeKey(original);
  const direct = taxonomyIndex.terms.get(normalized);
  if (direct && taxonomyIndex.bySlug.has(direct)) return taxonomyIndex.bySlug.get(direct);
  for (const [term, slug] of taxonomyIndex.terms.entries()) {
    if (normalized.includes(term) || term.includes(normalized)) {
      const trade = taxonomyIndex.bySlug.get(slug);
      if (trade) return trade;
    }
  }
  return null;
}

function mapServices(original, tradeMapped, taxonomyIndex) {
  if (!tradeMapped) return [];
  const services = taxonomyIndex.servicesByTrade.get(tradeMapped.slug) || [];
  const normalized = normalizeKey(original);
  return services
    .filter((service) => normalized.includes(normalizeKey(service.name)) || (service.aliases || []).some((alias) => normalized.includes(normalizeKey(alias))))
    .slice(0, 8)
    .map((service) => ({ name: service.name, slug: service.slug }));
}

function extractEmails(value) {
  return [...new Set(String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])].map((email) => email.trim().toLowerCase());
}

function classifyEmail(email) {
  const local = email.split("@")[0].toLowerCase();
  const domain = email.split("@")[1]?.toLowerCase() || "";
  const privateDomains = privateEmailDomains();
  const genericPrefixes = genericEmailPrefixes();
  if (privateDomains.has(domain)) return { email, public: false, reason: "private_provider" };
  if (genericPrefixes.has(local) || [...genericPrefixes].some((prefix) => local.startsWith(`${prefix}.`) || local.startsWith(`${prefix}-`))) {
    return { email, public: true, reason: "generic_business_email" };
  }
  return { email, public: false, reason: "personal_email" };
}

function extractPhones(value) {
  const phones = [];
  for (const line of String(value || "").split(/\n|;/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const numberMatch = trimmed.match(/(?:\+|0|'|\s|\.)[0-9][0-9\s().\/+-]{5,}/);
    if (!numberMatch) continue;
    phones.push(cleanPhoneLabel(trimmed));
  }
  return [...new Set(phones)];
}

function classifyPhone(phone, raw) {
  const label = `${phone}\n${raw}`;
  if (/fax/i.test(label)) return { phone, public: false, reason: "fax" };
  if (/mobil|mobile|handy/i.test(label) || isMobilePhone(phone)) return { phone, public: false, reason: "mobile" };
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 7) return { phone, public: false, reason: "unclear_phone" };
  return { phone, public: true, reason: "business_landline" };
}

function isMobilePhone(value) {
  const digits = normalizePhone(value);
  return /^49(15|16|17)/.test(digits) || /^0(15|16|17)/.test(digits) || /^(15|16|17)/.test(digits);
}

function isPhoneLike(value) {
  return /(\+|0|'|\.)\s*[0-9][0-9\s().\/+-]{5,}/.test(value);
}

function cleanPhoneLabel(value) {
  return cleanText(value).replace(/^'+/, "").replace(/^mobil\s*:?\s*/i, "").replace(/^fax\s*:?\s*/i, "Fax ");
}

function normalizePhone(value) {
  return String(value || "").replace(/[^0-9]/g, "").replace(/^00/, "");
}

function companySlug(name, postalCode, city) {
  return slugify([name, postalCode, city].filter(Boolean).join(" "));
}

function slugify(value) {
  return normalizeKey(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function cleanText(value) {
  return String(value || "").replace(/\s*\n\s*/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function cell(value) {
  return String(value || "").trim();
}

function appendLine(current, line) {
  return [current, line].filter(Boolean).join("\n");
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9@.]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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
    if (!next || next.startsWith("--")) result[key] = true;
    else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

function numberArg(key, fallback) {
  const value = Number(args[key] || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function addLiveError(message) {
  if (liveReport.errors.length < 100) liveReport.errors.push(message);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function importTradeTaxonomyModule() {
  const sourcePath = path.join(process.cwd(), "lib/trade-taxonomy.ts");
  const sourceText = await readFile(sourcePath, "utf8");
  const compiled = ts.transpileModule(sourceText, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const dir = path.join(tmpdir(), "gewerkeliste-seed-import");
  await mkdir(dir, { recursive: true });
  const outputPath = path.join(dir, `trade-taxonomy-${Date.now()}.mjs`);
  await writeFile(outputPath, compiled);
  return import(pathToFileURL(outputPath).href);
}

async function importServiceTaxonomyModule() {
  const sourcePath = path.join(process.cwd(), "lib/service-taxonomy.ts");
  const sourceText = await readFile(sourcePath, "utf8");
  const compiled = ts
    .transpileModule(sourceText, {
      compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler },
    })
    .outputText.replace(/from ["']@\/lib\/trade-hierarchy["'];?/g, "from './empty.mjs';");
  const dir = path.join(tmpdir(), "gewerkeliste-seed-import");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "empty.mjs"), "export {};\n");
  const outputPath = path.join(dir, `service-taxonomy-${Date.now()}.mjs`);
  await writeFile(outputPath, compiled);
  return import(pathToFileURL(outputPath).href);
}

function genericEmailPrefixes() {
  return new Set(["info", "kontakt", "office", "mail", "service", "buero", "büro", "post", "verwaltung", "zentrale", "sekretariat", "team"]);
}

function privateEmailDomains() {
  return new Set(["t-online.de", "gmx.de", "gmx.net", "web.de", "gmail.com", "googlemail.com", "yahoo.de", "yahoo.com", "aol.com", "alice.de", "freenet.de", "freetnet.de"]);
}

function manualTradeEntries() {
  return Object.entries({
    "Abbruch": "abbrucharbeiten",
    "Abbruch Erd- und Tiefbau": "abbrucharbeiten",
    "Abbruch Erd- und Tiefbau GmbH": "abbrucharbeiten",
    "Baumeisterarbeiten": "bauunternehmen",
    "Baumeisterarbeiten Tiefbau": "tiefbau",
    "Beweissicherung/Baugutachter": "sachverstaendige",
    "Brandschutz": "brandschutzplanung",
    "Dachdecker/Spengler": "dachdeckerarbeiten",
    "Elektrofachplanung": "tga-planung",
    "Elektroinstallation": "elektroinstallation",
    "Elektrotechnik/ Elektroinstallation": "elektroinstallation",
    "Elektrotechnik": "elektrotechnik",
    "Erd - Kanal - Pflasterbau Abbruch Recycling": "tiefbau",
    "Erdbau Tiefbau": "erdarbeiten",
    "Estrich/Sichtestrich": "estricharbeiten",
    "Fassade Glas Alu": "metallbau",
    "Fenster": "fensterbau",
    "Garten- und Landschaftsbau": "garten-landschaftsbau",
    "Gartenpflege Rodungsarbeiten": "garten-landschaftsbau",
    "GEG Nachweis Wärmeschutznachweis": "energieberatung",
    "GEG Nachweis Wärmeschutznachweis SiGeKo": "energieberatung",
    "Gerüstbau": "geruestbau",
    "HLS": "heizungsbau",
    "HLS Haustechnik": "heizungsbau",
    "Informations- Kommuniktatonstechnik/Netzwerktechnik": "netzwerktechnik",
    "Keller/Tiefgarage/Betonbau": "betonbau",
    "Natursteinhandel": "naturstein",
    "Parkett Bodenbeläge": "parkettarbeiten",
    "Planungsbüro": "architekt",
    "SiGeKo": "brandschutzplanung",
    "Stahlbau": "stahlbau",
    "Tragwerksplanung": "tragwerksplanung",
    "Trockenbau": "trockenbau",
    "Vermessung": "vermessung",
    "Akustik Trockenbau": "trockenbau",
    "Kamin Schornstein": "ofenbau",
    "Heizöl / Mineralöl": "energieanlagen",
    "Licht": "elektroinstallation",
    "Mediatechnik": "netzwerktechnik",
    "Bodengutachter/Baugrunderkundung": "vermessung",
    "Flachdach Sanierung Leckage": "flachdachabdichtung",
    "Fliesenleger": "fliesenarbeiten",
    "Schreinerei/Küchenmontage": "schreinerarbeiten",
    "Schreinerei/Möbelschreinerei": "schreinerarbeiten",
    "Teppiche/Bodenbeläge": "bodenlegerarbeiten",
  });
}
