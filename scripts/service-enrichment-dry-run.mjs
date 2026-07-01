#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const args = parseArgs(process.argv.slice(2));
if (args.live) fail("Dieser Workflow ist absichtlich nur Dry-Run. --live ist nicht erlaubt.");

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  fail("Supabase ENV fehlt. Es wurden keine Daten gelesen und keine Reports erzeugt.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const taxonomyModule = await importServiceTaxonomyModule();
const serviceEntries = flattenTaxonomy(taxonomyModule.serviceTaxonomy);
const broadTradeTerms = new Set(
  serviceEntries.flatMap((entry) => [entry.tradeSlug, entry.tradeName]).map(normalize).filter(Boolean),
);
const termIndex = buildTermIndex(serviceEntries);
const today = new Date().toISOString().slice(0, 10);
const reportBase = path.join("reports", `service-enrichment-dry-run-${today}`);
const genericTerms = new Set([
  "beratung",
  "planung",
  "lieferung",
  "fertigung",
  "montage",
  "einbau",
  "austausch",
  "reparatur",
  "wartung",
  "pruefung",
  "reinigung",
  "sanierung",
  "restaurierung",
  "gestaltung",
  "modernisierung",
  "rueckbau",
  "entsorgung",
  "notdienst",
  "vermietung",
  "instandsetzung",
  "abdichtung",
  "daemmung",
  "beschichtung",
  "analyse",
  "ausfuehrung",
  "gutachten",
  "abnahme",
  "gewerbe",
  "privat",
  "neubau",
  "altbau",
  "bestand",
  "fassade",
  "innenraum",
  "dach",
  "bad",
  "hof",
  "zufahrt",
  "strasse",
]);

const companies = await loadPublicCompanies(Number(args.limit || 5000));
const submissions = await loadSubmissions();
const candidates = [];
const conflicts = [];
const reviewedCompanies = new Map();
const submissionsByCompanyKey = indexSubmissions(submissions);

for (const company of companies) {
  const companyTrades = visibleCompanyTrades(company);
  const companyTradeSlugs = new Set(companyTrades.map((trade) => trade.slug).filter(Boolean));
  const sourceFields = companySourceFields(company, submissionsByCompanyKey.get(companyKey(company)) || []);
  const companyCandidates = [];

  for (const source of sourceFields) {
    const matches = matchSourceField({
      company,
      companyTrades,
      companyTradeSlugs,
      source,
    });
    companyCandidates.push(...matches.candidates);
    conflicts.push(...matches.conflicts);
  }

  const deduped = dedupeCandidates(companyCandidates);
  for (const candidate of deduped) candidates.push(candidate);

  reviewedCompanies.set(company.id, {
    id: company.id,
    name: company.name,
    city: company.city || "",
    tradeCount: companyTrades.length,
    candidateCount: deduped.length,
    insufficientEvidence: deduped.length === 0,
    manyMatches: deduped.length >= 12,
  });
}

const report = buildReport({
  companies,
  submissions,
  candidates,
  conflicts,
  reviewedCompanies: Array.from(reviewedCompanies.values()),
});

await mkdir("reports", { recursive: true });
await writeFile(`${reportBase}.json`, JSON.stringify(report, null, 2));
await writeFile(`${reportBase}.md`, renderMarkdown(report));

console.log(JSON.stringify({
  status: "ok",
  mode: "dry_run",
  reviewed_companies: report.summary.reviewed_companies,
  candidates: report.summary.candidates_total,
  high: report.summary.by_confidence.high || 0,
  medium: report.summary.by_confidence.medium || 0,
  low: report.summary.by_confidence.low || 0,
  indexable_service_pages_after_review: report.summary.service_pages_after_review,
  indexable_service_location_pages_after_review: report.summary.service_location_pages_after_review,
  reports: [`${reportBase}.md`, `${reportBase}.json`],
}, null, 2));

async function loadPublicCompanies(limit) {
  const { data, error } = await supabase
    .from("companies")
    .select(
      [
        "id",
        "name",
        "slug",
        "city",
        "postal_code",
        "description",
        "website_url",
        "email",
        "phone",
        "public_visible",
        "trades(slug,name)",
        "company_trades(status,visibility_level,confidence_score,source,evidence,trades(slug,name))",
      ].join(","),
    )
    .eq("public_visible", true)
    .limit(limit);

  if (error) fail(`companies read fehlgeschlagen: ${error.message}`);
  return data || [];
}

async function loadSubmissions() {
  const { data, error } = await supabase
    .from("company_submissions")
    .select("id,status,company_name,postal_code,city,primary_trade,selected_services,specializations,short_description,description")
    .limit(5000);

  if (error) return [];
  return data || [];
}

function companySourceFields(company, submissionsForCompany) {
  const fields = [
    sourceField("companies.description", company.description, 1),
    sourceField("companies.website_url", company.website_url, 0.35),
    sourceField("companies.email", company.email, 0.2),
    sourceField("companies.phone", company.phone, 0.1),
  ];

  for (const match of company.company_trades || []) {
    if (match?.status === "rejected" || match?.visibility_level === "internal") continue;
    fields.push(sourceField("company_trades.evidence", match?.evidence, 1.15, relationTrade(match)));
  }

  for (const submission of submissionsForCompany) {
    fields.push(sourceField("company_submissions.selected_services", arrayText(submission.selected_services), 1.25));
    fields.push(sourceField("company_submissions.specializations", arrayText(submission.specializations), 1.1));
    fields.push(sourceField("company_submissions.description", [submission.short_description, submission.description].filter(Boolean).join(" "), 0.8));
  }

  return fields.filter((field) => field.text.trim());
}

function matchSourceField({ company, companyTrades, companyTradeSlugs, source }) {
  const normalizedText = normalize(source.text);
  const candidates = [];
  const conflicts = [];

  for (const [term, indexed] of termIndex.entries()) {
    if (!term || !includesTerm(normalizedText, term)) continue;
    if (isGenericTerm(term)) {
      conflicts.push(conflict(company, source, term, "too_general_term", indexed));
      continue;
    }

    const compatible = indexed.entries.filter((entry) => isTradeCompatible(entry, companyTradeSlugs, source.tradeSlug));
    if (!compatible.length) {
      if (indexed.entries.length > 1) conflicts.push(conflict(company, source, term, "ambiguous_term_outside_trade_context", indexed));
      continue;
    }

    if (compatible.length > 1 && new Set(compatible.map((entry) => `${entry.tradeSlug}/${entry.serviceSlug}`)).size > 1) {
      conflicts.push(conflict(company, source, term, "ambiguous_term_multiple_services", { entries: compatible }));
    }

    for (const entry of compatible) {
      const confidence = confidenceFor({ entry, indexed, source, normalizedText, companyTradeSlugs });
      if (!confidence) continue;
      candidates.push({
        company_id: company.id,
        company_name: company.name,
        city: company.city || "",
        postal_code: company.postal_code || "",
        trade_slug: entry.tradeSlug,
        trade_name: entry.tradeName,
        service_slug: entry.serviceSlug,
        service_name: entry.serviceName,
        confidence,
        source_field: source.field,
        evidence_text: snippet(source.text, term),
        matched_term: term,
        reason: reasonFor({ confidence, indexed, source, entry }),
        suggested_action: confidence === "high" ? "review_and_confirm_company_service" : "manual_review_required",
        profile_url: company.slug ? `/firma/${company.slug}` : "",
        company_trades: companyTrades.map((trade) => trade.slug).filter(Boolean),
      });
    }
  }

  return { candidates, conflicts };
}

function confidenceFor({ indexed, source, normalizedText, companyTradeSlugs, entry }) {
  const hasTrade = companyTradeSlugs.has(entry.tradeSlug) || source.tradeSlug === entry.tradeSlug;
  const type = entry.matchType || indexed.bestType;

  if (type === "service_name" || type === "alias" || type === "slug") {
    if (broadTradeTerms.has(normalize(entry.serviceName)) && normalize(entry.serviceName) === normalize(entry.tradeSlug)) return null;
    if (source.field === "companies.website_url" || source.field === "companies.email" || source.field === "companies.phone") return "low";
    return hasTrade ? "high" : "medium";
  }

  if (type === "family") {
    if (!hasTrade) return null;
    if (broadTradeTerms.has(normalize(entry.familyName))) return null;
    return source.field === "company_trades.evidence" || normalizedText.length > 80 ? "medium" : "low";
  }

  if (type === "activity" || type === "context") {
    if (!hasTrade) return null;
    const serviceSpecificSignals = [entry.serviceName, ...entry.aliases, entry.familyName]
      .map(normalize)
      .filter((term) => term.length > 3 && !isGenericTerm(term));
    return serviceSpecificSignals.some((term) => includesTerm(normalizedText, term)) ? "medium" : null;
  }

  return null;
}

function reasonFor({ confidence, indexed, source, entry }) {
  const typeLabel = {
    service_name: "Service-Name",
    alias: "Alias",
    slug: "Service-Slug",
    family: "Leistungsfamilie",
    activity: "Taetigkeit",
    context: "Kontext",
  }[entry.matchType || indexed.bestType] || entry.matchType || indexed.bestType;

  if (confidence === "high") return `${typeLabel} direkt in ${source.field} gefunden und fachlich dem Gewerk ${entry.tradeSlug} zuordenbar.`;
  if (confidence === "medium") return `Starker Kontexttreffer in ${source.field} mit passendem Gewerk ${entry.tradeSlug}; vor Freigabe pruefen.`;
  return `Unsicherer Treffer in ${source.field}; nur als manueller Review-Kandidat verwenden.`;
}

function buildReport({ companies, submissions, candidates, conflicts, reviewedCompanies }) {
  const byConfidence = countBy(candidates, (candidate) => candidate.confidence);
  const serviceCounts = countBy(candidates, (candidate) => `${candidate.service_slug}|||${candidate.service_name}`);
  const cityCounts = countBy(candidates, (candidate) => candidate.city || "ohne Ort");
  const comboCounts = countBy(candidates, (candidate) => `${candidate.trade_slug}|||${candidate.service_slug}|||${candidate.service_name}`);
  const locationPageCounts = countBy(
    candidates.filter((candidate) => candidate.confidence !== "low" && candidate.city),
    (candidate) => `${candidate.service_slug}|||${slugifyLocation(candidate.city)}`,
  );
  const servicePageCounts = countBy(
    candidates.filter((candidate) => candidate.confidence !== "low"),
    (candidate) => candidate.service_slug,
  );

  const manyMatches = reviewedCompanies.filter((company) => company.manyMatches);
  const insufficientEvidence = reviewedCompanies.filter((company) => company.insufficientEvidence);
  const lowConfidence = candidates.filter((candidate) => candidate.confidence === "low").slice(0, 80);
  const importantServices = topEntries(serviceCounts, 12).map((item) => item.key.split("|||")[0]);

  return {
    generated_at: new Date().toISOString(),
    mode: "dry_run",
    safety: {
      writes_to_database: false,
      imports: false,
      scrapes: false,
      emails: false,
      migrations: false,
    },
    summary: {
      reviewed_companies: companies.length,
      reviewed_submissions: submissions.length,
      candidates_total: candidates.length,
      by_confidence: Object.fromEntries(byConfidence),
      distinct_services_with_candidates: serviceCounts.size,
      service_pages_after_review: servicePageCounts.size,
      service_location_pages_after_review: locationPageCounts.size,
      conflicts_total: conflicts.length,
      companies_without_sufficient_evidence: insufficientEvidence.length,
      companies_with_many_matches: manyMatches.length,
    },
    top_services: topEntries(serviceCounts, 30).map(serviceCountRow),
    top_locations: topEntries(cityCounts, 30).map(({ key, count }) => ({ city: key, count })),
    top_trade_service_combinations: topEntries(comboCounts, 30).map(comboCountRow),
    potential_service_location_pages: topEntries(locationPageCounts, 100).map(({ key, count }) => {
      const [service_slug, city_slug] = key.split("|||");
      return { url: `/leistungen/${service_slug}/${city_slug}`, count };
    }),
    low_confidence_candidates: lowConfidence,
    conflicts: conflicts.slice(0, 120),
    examples_by_important_service: Object.fromEntries(
      importantServices.map((serviceSlug) => [
        serviceSlug,
        candidates.filter((candidate) => candidate.service_slug === serviceSlug).slice(0, 6),
      ]),
    ),
    companies_requiring_manual_review: {
      many_matches: manyMatches.slice(0, 80),
      insufficient_evidence: insufficientEvidence.slice(0, 80),
    },
    candidates,
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push(`# Service-Enrichment Dry-Run ${today}`);
  lines.push("");
  lines.push("Dieser Report ist read-only erzeugt. Es wurden keine Daten geschrieben, keine Imports gestartet, keine Scrapes ausgefuehrt und keine E-Mails versendet.");
  lines.push("");
  lines.push("## Zusammenfassung");
  lines.push("");
  lines.push(`- Gepruefte Betriebe: ${report.summary.reviewed_companies}`);
  lines.push(`- Gepruefte Submissions/Profilergänzungen: ${report.summary.reviewed_submissions}`);
  lines.push(`- Kandidaten gesamt: ${report.summary.candidates_total}`);
  lines.push(`- High: ${report.summary.by_confidence.high || 0}`);
  lines.push(`- Medium: ${report.summary.by_confidence.medium || 0}`);
  lines.push(`- Low: ${report.summary.by_confidence.low || 0}`);
  lines.push(`- Unterschiedliche Leistungen mit Kandidaten: ${report.summary.distinct_services_with_candidates}`);
  lines.push(`- Potenzielle /leistungen/[slug]-Seiten nach Review: ${report.summary.service_pages_after_review}`);
  lines.push(`- Potenzielle /leistungen/[slug]/[ort]-Seiten nach Review: ${report.summary.service_location_pages_after_review}`);
  lines.push(`- Konflikte/Mehrdeutigkeiten: ${report.summary.conflicts_total}`);
  lines.push(`- Betriebe ohne ausreichende Evidence: ${report.summary.companies_without_sufficient_evidence}`);
  lines.push(`- Betriebe mit vielen Treffern: ${report.summary.companies_with_many_matches}`);
  lines.push("");
  lines.push("## Top 30 Leistungen");
  lines.push("");
  appendTable(lines, ["Leistung", "Slug", "Kandidaten"], report.top_services.map((row) => [row.service_name, row.service_slug, row.count]));
  lines.push("");
  lines.push("## Top 30 Orte");
  lines.push("");
  appendTable(lines, ["Ort", "Kandidaten"], report.top_locations.map((row) => [row.city, row.count]));
  lines.push("");
  lines.push("## Top 30 Gewerk-Leistung-Kombinationen");
  lines.push("");
  appendTable(lines, ["Gewerk", "Leistung", "Slug", "Kandidaten"], report.top_trade_service_combinations.map((row) => [row.trade_slug, row.service_name, row.service_slug, row.count]));
  lines.push("");
  lines.push("## Potenziell indexierbare Leistung-Ort-Seiten nach Review");
  lines.push("");
  appendTable(lines, ["URL", "Kandidaten"], report.potential_service_location_pages.slice(0, 80).map((row) => [row.url, row.count]));
  lines.push("");
  lines.push("## Low-Confidence Kandidaten");
  lines.push("");
  appendTable(lines, ["Betrieb", "Ort", "Leistung", "Quelle", "Grund"], report.low_confidence_candidates.slice(0, 40).map((row) => [row.company_name, row.city, row.service_name, row.source_field, row.reason]));
  lines.push("");
  lines.push("## Konflikte und Mehrdeutigkeiten");
  lines.push("");
  appendTable(lines, ["Betrieb", "Quelle", "Begriff", "Typ"], report.conflicts.slice(0, 60).map((row) => [row.company_name, row.source_field, row.term, row.type]));
  lines.push("");
  lines.push("## Beispiele nach wichtiger Leistung");
  lines.push("");
  for (const [serviceSlug, examples] of Object.entries(report.examples_by_important_service)) {
    lines.push(`### ${serviceSlug}`);
    lines.push("");
    appendTable(lines, ["Betrieb", "Ort", "Confidence", "Quelle", "Evidence"], examples.map((row) => [row.company_name, row.city, row.confidence, row.source_field, row.evidence_text]));
    lines.push("");
  }
  lines.push("## Empfehlung");
  lines.push("");
  lines.push("1. High-Kandidaten zuerst per CSV/JSON oder kleiner Review-UI pruefen.");
  lines.push("2. Medium-Kandidaten nur mit sichtbarer Evidence bestaetigen.");
  lines.push("3. Low-Kandidaten nicht automatisch uebernehmen.");
  lines.push("4. Nach Review eine separate, explizit freigegebene Migration/Action fuer `company_services` bauen.");
  lines.push("5. Erst nach bestaetigten direkten Leistungszuordnungen Leistung-Seiten indexierbar machen.");
  lines.push("");
  lines.push(`JSON mit allen Kandidaten: \`${reportBase}.json\``);
  lines.push("");
  return lines.join("\n");
}

function appendTable(lines, headers, rows) {
  if (!rows.length) {
    lines.push("_Keine Eintraege._");
    return;
  }
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) lines.push(`| ${row.map((cell) => markdownCell(cell)).join(" | ")} |`);
}

function flattenTaxonomy(groups) {
  return groups.flatMap((group) =>
    group.trades.flatMap((trade) =>
      trade.families.flatMap((family) =>
        family.services.map((service) => ({
          groupName: group.name,
          groupSlug: group.slug,
          tradeName: trade.name,
          tradeSlug: trade.slug,
          familyName: family.name,
          familySlug: family.slug,
          serviceName: service.name,
          serviceSlug: service.slug,
          aliases: service.aliases || [],
          activities: service.activities || [],
          contexts: service.contexts || [],
          crosslinks: service.crosslinks || [],
        })),
      ),
    ),
  );
}

function buildTermIndex(entries) {
  const index = new Map();
  for (const entry of entries) {
    addTerm(index, entry.serviceName, "service_name", entry);
    addTerm(index, entry.serviceSlug.replace(/-/g, " "), "slug", entry);
    for (const alias of entry.aliases) addTerm(index, alias, "alias", entry);
    addTerm(index, entry.familyName, "family", entry);
    for (const activity of entry.activities) addTerm(index, activity, "activity", entry);
    for (const context of entry.contexts) addTerm(index, context, "context", entry);
  }

  for (const value of index.values()) {
    value.entries = uniqueBy(value.entries, (entry) => `${entry.type}|${entry.service.tradeSlug}|${entry.service.serviceSlug}`)
      .map((item) => ({ ...item.service, matchType: item.type }));
    value.bestType = bestType(value.entries.map((entry) => entry.matchType));
  }
  return index;
}

function addTerm(index, value, type, service) {
  const term = normalize(value);
  if (!term || term.length < 3) return;
  const current = index.get(term) || { entries: [] };
  current.entries.push({ type, service });
  index.set(term, current);
}

function bestType(types) {
  const order = ["service_name", "alias", "slug", "family", "activity", "context"];
  return order.find((type) => types.includes(type)) || types[0] || "unknown";
}

function dedupeCandidates(candidates) {
  const best = new Map();
  const rank = { high: 3, medium: 2, low: 1 };
  for (const candidate of candidates) {
    const key = `${candidate.company_id}|${candidate.service_slug}`;
    const existing = best.get(key);
    if (!existing || rank[candidate.confidence] > rank[existing.confidence]) best.set(key, candidate);
  }
  return Array.from(best.values()).sort((a, b) => (rank[b.confidence] - rank[a.confidence]) || a.service_name.localeCompare(b.service_name, "de"));
}

function visibleCompanyTrades(company) {
  const relations = (company.company_trades || [])
    .filter((match) => match?.status !== "rejected" && match?.visibility_level !== "internal")
    .map(relationTrade)
    .filter((trade) => trade.slug);
  const primary = relationTrade({ trades: company.trades });
  return uniqueBy([primary, ...relations].filter((trade) => trade.slug), (trade) => trade.slug);
}

function relationTrade(match) {
  const trade = Array.isArray(match?.trades) ? match.trades[0] : match?.trades;
  return { slug: trade?.slug || "", name: trade?.name || "" };
}

function isTradeCompatible(entry, companyTradeSlugs, sourceTradeSlug) {
  return companyTradeSlugs.has(entry.tradeSlug) || sourceTradeSlug === entry.tradeSlug;
}

function conflict(company, source, term, type, indexed) {
  return {
    company_id: company.id,
    company_name: company.name,
    city: company.city || "",
    source_field: source.field,
    term,
    type,
    matching_services: (indexed.entries || []).slice(0, 8).map((entry) => `${entry.tradeSlug}/${entry.serviceSlug}`),
    evidence_text: snippet(source.text, term),
  };
}

function sourceField(field, value, weight, trade = { slug: "", name: "" }) {
  return {
    field,
    text: String(value || ""),
    weight,
    tradeSlug: trade.slug || "",
    tradeName: trade.name || "",
  };
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function topEntries(counts, limit) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "de"))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function serviceCountRow({ key, count }) {
  const [service_slug, service_name] = key.split("|||");
  return { service_slug, service_name, count };
}

function comboCountRow({ key, count }) {
  const [trade_slug, service_slug, service_name] = key.split("|||");
  return { trade_slug, service_slug, service_name, count };
}

function indexSubmissions(submissions) {
  const index = new Map();
  for (const submission of submissions) {
    const key = normalizeKey(submission.company_name, submission.postal_code, submission.city);
    if (!key) continue;
    const rows = index.get(key) || [];
    rows.push(submission);
    index.set(key, rows);
  }
  return index;
}

function companyKey(company) {
  return normalizeKey(company.name, company.postal_code, company.city);
}

function normalizeKey(name, postalCode, city) {
  const normalizedName = normalize(name || "").replace(/\b(gmbh|ug|ag|kg|gbr|mbh|e k|ek)\b/g, "").replace(/\s+/g, " ").trim();
  const normalizedPostal = normalize(postalCode || "");
  const normalizedCity = normalize(city || "");
  if (!normalizedName) return "";
  return `${normalizedName}|${normalizedPostal}|${normalizedCity}`;
}

function includesTerm(normalizedText, term) {
  const paddedText = ` ${normalizedText} `;
  const paddedTerm = ` ${term} `;
  return paddedText.includes(paddedTerm);
}

function isGenericTerm(term) {
  return genericTerms.has(term) || term.length < 4;
}

function arrayText(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function snippet(text, term) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const normalizedClean = normalize(clean);
  const index = normalizedClean.indexOf(term);
  if (index < 0) return clean.slice(0, 220);
  const roughStart = Math.max(0, index - 80);
  const roughEnd = Math.min(clean.length, index + term.length + 140);
  return clean.slice(roughStart, roughEnd).trim();
}

function slugifyLocation(value) {
  return normalize(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/https?:\/\//g, " ")
    .replace(/www\./g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function markdownCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .slice(0, 260);
}

function uniqueBy(values, keyFn) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const key = keyFn(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

async function importServiceTaxonomyModule() {
  const sourcePath = path.join(process.cwd(), "lib/service-taxonomy.ts");
  const source = await readFile(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
  }).outputText.replace(/from ["']@\/lib\/trade-hierarchy["'];?/g, "from './empty.mjs';");
  const dir = path.join(tmpdir(), "gewerkeliste-service-enrichment-dry-run");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "empty.mjs"), "export {};\n");
  const outputPath = path.join(dir, `service-taxonomy-${Date.now()}.mjs`);
  await writeFile(outputPath, compiled);
  return import(pathToFileURL(outputPath).href);
}

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--live") parsed.live = true;
    else if (arg === "--limit") parsed.limit = argv[++index];
    else if (arg.startsWith("--limit=")) parsed.limit = arg.slice("--limit=".length);
  }
  return parsed;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
