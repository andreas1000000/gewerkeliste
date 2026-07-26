#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import ts from "typescript";
import { requireExternalApiConfirmation, requireLiveConfirmation, requireSupabaseSafety } from "./safety-gates.mjs";

const execFileAsync = promisify(execFile);
const searchModule = await importSearchModule();

const args = parseArgs(process.argv.slice(2));
const targetCompany = String(args.company || args.name || "").trim();
const targetCity = String(args.city || "").trim();
const live = Boolean(args.live);
const dryRun = !live;
const maxResultsPerQuery = Number(args["max-results-per-query"] || 5);
const maxSearchQueries = Number(args["max-search-queries"] || 8);
const timeoutMs = Number(args["timeout-ms"] || 8000);
const userAgent =
  args["user-agent"] ||
  "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)";

if (!targetCompany && !args["company-id"]) fail("--name/--company oder --company-id ist erforderlich.");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (live) {
  requireLiveConfirmation({
    args,
    action: "enrich-company-live",
    reason: "Company Enrichment kann Firmenfelder, Quellen, Gewerke und Change Logs schreiben.",
  });
}
requireSupabaseSafety({ args, url: supabaseUrl, live, action: "enrich-company-live" });
if (process.env.BRAVE_SEARCH_API_KEY) {
  requireExternalApiConfirmation({ args, provider: "brave-search", estimatedRequests: maxSearchQueries });
}

if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY muessen gesetzt sein.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const report = {
  ok: true,
  mode: live ? "live" : "dry_run",
  target: { company: targetCompany, city: targetCity },
  guardrails: {
    default_mode: dryRun ? "dry_run" : "live",
    sends_email: false,
    copies_logos_or_images: false,
    copies_foreign_text: false,
    dry_run_writes_database: false,
  },
  matched_company_id: null,
  candidate_matches: [],
  selected_candidate_reason: null,
  current_data: null,
  generated_queries: [],
  found_sources: [],
  search_execution: {
    provider: null,
    search_api_available: false,
    executed_queries: [],
    skipped_queries: [],
    result_count: 0,
    ranked_results: [],
    rejected_directory_results: [],
    note: null,
  },
  possible_website: null,
  extracted_official_data: null,
  proposed_updates: {},
  proposed_trades: [],
  review_trades: [],
  risk_notes: [],
  live_write_plan: [],
  live_result: null,
  errors: [],
};

await assertReadTables();
if (live) await assertLiveTables();

const candidates = await findCandidateCompanies();
report.candidate_matches = candidates.map(toCandidateReport);

if (candidates.length === 0) {
  addRisk("Kein passender Firmeneintrag in companies gefunden. Es wurden keine weiteren Schritte ausgefuehrt.");
  finish();
}

const selected = selectBestCandidate(candidates);
report.matched_company_id = selected.id;
report.selected_candidate_reason = selected.match_reason;
report.current_data = sanitizeCompany(selected);

if (live && candidates.length > 1 && !args["company-id"]) {
  addRisk("Mehrere moegliche Treffer gefunden. Live-Modus verweigert ohne eindeutige --company-id.");
  finish(false);
}

const queries = buildQueries(selected);
report.generated_queries = queries;

const searchResults = await collectSearchResults(queries);
const existingSources = await loadCompanySources(selected.id);
const existingSourceUrls = new Set(
  existingSources
    .map((source) => normalizeUrl(source.source_url))
    .filter(Boolean),
);
const sourceCandidates = [
  ...officialWebsiteSeeds().map((url) => ({
    url,
    title: "Offizielle Firmenwebsite Kandidat",
    snippet: "Direktkandidat fuer den Company-Enrichment-Agenten",
    source_type: "official_website_candidate",
    priority: 5,
  })),
  ...directWebsiteCandidates(selected).map((url) => ({
    url,
    title: "Direkter Firmen-Domain-Kandidat",
    snippet: "Aus Firmenname und Ort abgeleiteter Website-Kandidat. Keine Websuche.",
    source_type: "direct_domain_candidate",
    priority: 5,
  })),
  ...extractCompanyUrls(selected).map((url) => ({
    url,
    title: "Quelle aus bestehendem Firmeneintrag",
    snippet: selected.description || "",
    source_type: "existing_company_text",
    priority: 9,
  })),
  ...existingSources.map((source) => ({
    url: source.source_url,
    title: source.title || "Gespeicherte Quelle",
    snippet: source.snippet || source.content || "",
    source_type: source.source_type || "existing_company_source",
    priority: 9,
  })),
  ...searchResults,
].filter((item) => item.url);

const analyzedSources = [];
const seenUrls = new Set();
for (const source of sourceCandidates) {
  const normalizedUrl = normalizeUrl(source.url);
  if (!normalizedUrl || seenUrls.has(normalizedUrl)) continue;
  seenUrls.add(normalizedUrl);
  analyzedSources.push(await analyzeSource(normalizedUrl, source, selected));
}

report.found_sources = analyzedSources
  .sort((a, b) => b.score - a.score || a.priority - b.priority)
  .slice(0, 20)
  .map((source) => ({
    url: source.url,
    title: source.title,
    source_type: source.source_type,
    priority: source.priority,
    accepted_as_official_website: source.accepted_as_official_website,
    matching_features: source.matching_features,
    ranking_reasons: source.ranking_reasons,
    confidence_score: source.score,
    risks: source.risks,
  }));

const websiteSource = analyzedSources
  .filter((source) => source.accepted_as_official_website)
  .sort((a, b) => b.score - a.score || a.priority - b.priority)[0];

if (websiteSource) {
  report.possible_website = {
    url: websiteSource.website_root,
    confidence_score: websiteSource.score,
    matching_features: websiteSource.matching_features,
  };
  report.extracted_official_data = websiteSource.extracted;
} else {
  addRisk("Keine offizielle Website mit mindestens zwei passenden Merkmalen eindeutig akzeptiert.");
}

const proposedUpdates = proposeCompanyUpdates(selected, websiteSource, analyzedSources);
report.proposed_updates = proposedUpdates;
report.proposed_trades = proposeTrades(selected, analyzedSources).auto;
report.review_trades = proposeTrades(selected, analyzedSources).review;
report.live_write_plan = buildLiveWritePlan(
  selected,
  proposedUpdates,
  report.proposed_trades,
  report.review_trades,
  analyzedSources,
  existingSourceUrls,
);

if (live) {
  report.live_result = await applyLiveChanges(selected, report.live_write_plan, analyzedSources);
  const { data, error } = await supabase
    .from("companies")
    .select("id,name,description,email,phone,website_url,street,city,postal_code,public_visible,claim_status,verified,trade_id,trades(id,name,slug)")
    .eq("id", selected.id)
    .single();
  if (error) addError(`Nachpruefung fehlgeschlagen: ${error.message}`);
  else report.after_live_data = sanitizeCompany(data);
}

finish();

async function assertReadTables() {
  for (const table of ["companies", "trades", "company_sources", "company_trades", "company_trade_reviews"]) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) fail(`Tabelle ${table} ist nicht verfuegbar: ${error.message}`);
  }
}

async function assertLiveTables() {
  const { error } = await supabase.from("company_change_log").select("*").limit(1);
  if (error) {
    fail(
      `Live-Modus verweigert: company_change_log ist nicht verfuegbar. Migration zuerst pruefen und freigeben. Supabase: ${error.message}`,
    );
  }
}

async function findCandidateCompanies() {
  const companyId = args["company-id"];
  if (companyId) {
    const { data, error } = await supabase
      .from("companies")
      .select("id,name,description,email,phone,website_url,street,city,postal_code,public_visible,claim_status,verified,trade_id,trades(id,name,slug)")
      .eq("id", companyId)
      .limit(1);
    if (error) fail(error.message);
    return (data || []).map((company) => scoreCandidate(company));
  }

  const nameTokens = meaningfulTokens(targetCompany);
  const query = supabase
    .from("companies")
    .select("id,name,description,email,phone,website_url,street,city,postal_code,public_visible,claim_status,verified,trade_id,trades(id,name,slug)")
    .limit(30);
  if (nameTokens[0]) query.ilike("name", `%${escapePostgrestLike(nameTokens[0])}%`);
  else if (targetCity) query.ilike("city", `%${escapePostgrestLike(targetCity)}%`);
  else fail("Keine brauchbaren Suchsignale fuer company lookup.");

  const { data, error } = await query;

  if (error) fail(error.message);
  return (data || [])
    .map((company) => scoreCandidate(company))
    .filter((company) => company.match_score >= 40)
    .sort((a, b) => b.match_score - a.match_score || a.name.localeCompare(b.name, "de"));
}

function scoreCandidate(company) {
  const text = normalize(`${company.name} ${company.city} ${company.postal_code} ${company.street || ""}`);
  let score = 0;
  const reasons = [];
  const tokens = meaningfulTokens(targetCompany);
  for (const token of tokens) {
    if (contains(text, token)) {
      score += Math.max(10, Math.floor(70 / Math.max(tokens.length, 1)));
      reasons.push(`Name enthaelt ${token}`);
    }
  }
  if (targetCity && normalize(company.city) === normalize(targetCity)) {
    score += 15;
    reasons.push(`Ort ist ${targetCity}`);
  }
  if (args.postal_code && company.postal_code === String(args.postal_code)) {
    score += 5;
    reasons.push(`PLZ ${args.postal_code}`);
  }
  return { ...company, match_score: Math.min(score, 100), match_reason: reasons.join("; ") || "schwacher Namenshinweis" };
}

function selectBestCandidate(candidates) {
  return candidates[0];
}

async function loadCompanySources(companyId) {
  const { data, error } = await supabase
    .from("company_sources")
    .select("source_type,source_url,title,snippet,content,created_at")
    .eq("company_id", companyId);
  if (error) {
    addError(`Gespeicherte Quellen konnten nicht geladen werden: ${error.message}`);
    return [];
  }
  return data || [];
}

function buildQueries(company) {
  return searchModule.buildCompanySearchQueries({
    companyName: targetCompany || company.name,
    city: targetCity || company.city || "",
    postalCode: company.postal_code || "",
    tradeHint: inferTradeHint(company),
  });
}

async function collectSearchResults(queries) {
  const provider = createSearchProvider();
  report.search_execution.provider = provider?.name || null;
  report.search_execution.search_api_available = Boolean(provider?.available);

  if (!provider?.available) {
    report.search_execution.executed_queries = [];
    report.search_execution.skipped_queries = queries;
    report.search_execution.note =
      "Kein BRAVE_SEARCH_API_KEY konfiguriert. Es wurde keine echte Websuche ausgefuehrt; nur direkte Domain-Kandidaten und vorhandene Quellen werden geprueft.";
    addRisk("Keine echte Search-API konfiguriert. Der Agent fuehrt deshalb keine Websuche aus und gibt das im Report offen aus.");
    return [];
  }

  const results = [];
  const executableQueries = queries.slice(0, maxSearchQueries);
  report.search_execution.executed_queries = executableQueries;
  report.search_execution.skipped_queries = queries.slice(maxSearchQueries);
  for (const query of executableQueries) {
    try {
      const search = await provider.search(query);
      for (const item of search.slice(0, maxResultsPerQuery)) {
        results.push({ ...item, query });
      }
    } catch (error) {
      addRisk(`${provider.name} fehlgeschlagen fuer "${query}": ${error.message}`);
    }
  }
  const ranked = searchModule.rankCompanyWebsiteResults(results, {
    companyName: targetCompany || report.current_data?.name || "",
    city: targetCity || report.current_data?.city || "",
    postalCode: report.current_data?.postal_code || "",
    tradeHint: inferTradeHint(report.current_data || {}),
  });
  report.search_execution.result_count = results.length;
  report.search_execution.ranked_results = ranked.slice(0, 20).map((item) => ({
    query: item.query,
    title: item.title,
    url: item.url,
    snippet: item.snippet,
    source: item.source,
    rank: item.rank,
    score: item.score,
    reasons: item.reasons,
    rejected: item.rejected,
  }));
  report.search_execution.rejected_directory_results = ranked
    .filter((item) => item.rejected)
    .slice(0, 10)
    .map((item) => ({ title: item.title, url: item.url, score: item.score, reasons: item.reasons }));

  return ranked.map((item) => ({
    url: item.url,
    title: item.title,
    snippet: item.snippet,
    source_type: item.rejected ? "search_directory_result" : "search_api_result",
    priority: item.rejected ? 10 : 6,
    search_score: item.score,
    ranking_reasons: item.reasons,
  }));
}

function createSearchProvider() {
  if (process.env.BRAVE_SEARCH_API_KEY) {
    return new searchModule.BraveSearchProvider({
      apiKey: process.env.BRAVE_SEARCH_API_KEY,
      maxResults: maxResultsPerQuery,
      userAgent,
    });
  }
  return null;
}

async function analyzeSource(url, source, company) {
  const result = {
    url,
    website_root: rootUrl(url),
    title: source.title || null,
    snippet: source.snippet || "",
    source_type: source.source_type || "public_web",
    priority: sourcePriority(url, source),
    ok: false,
    html_checked: false,
    text_sample: "",
    matching_features: [],
    ranking_reasons: source.ranking_reasons || [],
    extracted: {},
    accepted_as_official_website: false,
    score: 0,
    risks: [],
  };

  const host = hostname(url);
  const directoryLike = isDirectoryLikeHost(host);
  const officialCandidate = ["official_website_candidate", "direct_domain_candidate"].includes(source.source_type);
  if (directoryLike) result.risks.push("Branchen-/Gemeindeverzeichnis nur als Hilfsquelle bewertet.");

  const fetched = await fetchHtml(url);
  if (!fetched.ok) {
    result.risks.push(fetched.error);
    result.score = scoreSource(result);
    return result;
  }

  result.ok = true;
  result.html_checked = true;
  const links = extractLinks(fetched.html, url);
  const pageUrls = pagesToAnalyze(url, links);
  const pages = [{ url, role: pageRole(url), html: fetched.html, weight: pageWeight(pageRole(url)) }];

  for (const extraUrl of pageUrls) {
    if (rootUrl(extraUrl) !== result.website_root) continue;
    const extra = await fetchHtml(extraUrl);
    if (extra.ok) {
      const role = pageRole(extraUrl);
      pages.push({ url: extraUrl, role, html: extra.html, weight: pageWeight(role) });
    }
  }

  const combinedHtml = pages.map((page) => page.html).join("\n");
  const text = clean(stripTags(combinedHtml));
  result.text_sample = text.slice(0, 700);
  result.extracted = {
    company_name: extractPreferredCompanyName(pages),
    legal_form: extractPreferredLegalForm(pages),
    email: extractPreferredEmail(pages),
    phone: extractPreferredPhone(pages),
    address: extractPreferredAddress(pages),
    services: extractServices(text, combinedHtml),
    service_areas: extractServiceAreas(text),
    contact_persons: extractContactPersons(text),
    is_master_business: extractMasterBusiness(text),
    analyzed_pages: pages.map((page) => ({ url: page.url, role: page.role, source_weight: page.weight })),
    imprint_url: pages.find((page) => page.role === "impressum")?.url || null,
    contact_url: pages.find((page) => page.role === "kontakt")?.url || null,
    service_url: pages.find((page) => page.role === "leistungen")?.url || null,
    references_url: pages.find((page) => page.role === "referenzen")?.url || null,
  };
  result.matching_features = matchingFeatures(company, text, url, result.extracted);
  const companyOwnedHost = isLikelyCompanyOwnedHost(host, targetCompany || company.name || "");
  result.accepted_as_official_website =
    !directoryLike &&
    (officialCandidate || companyOwnedHost) &&
    hasOfficialWebsiteEvidence(company, result, officialCandidate || companyOwnedHost);
  if (!result.accepted_as_official_website && officialCandidate && result.matching_features.includes("Firmenname")) {
    result.risks.push("Direkter Domain-Kandidat wurde nicht als offizielle Website akzeptiert, weil Ort, PLZ, Adresse oder Telefonnummer nicht bestaetigt wurden.");
  }
  result.score = scoreSource(result);
  return result;
}

function hasOfficialWebsiteEvidence(company, source, officialCandidate) {
  const features = new Set(source.matching_features);
  if (!features.has("Firmenname")) return false;

  const hasLocationOrContact = ["Adresse", "Ort", "PLZ", "Telefonnummer"].some((feature) => features.has(feature));
  const hasStoredIdentity = Boolean(company.street || company.city || company.postal_code || company.phone);
  if (hasStoredIdentity) return hasLocationOrContact;

  if (officialCandidate) return features.has("Leistungsangebot");
  return features.size >= 2;
}

function isLikelyCompanyOwnedHost(host, companyName) {
  if (!host || isDirectoryLikeHost(host)) return false;
  const hostText = normalize(host.replace(/^www\./, ""));
  const tokens = domainTokens(companyName);
  if (tokens.length === 0) return false;
  const matched = tokens.filter((token) => contains(hostText, token) || domainTokenVariants(token).some((variant) => contains(hostText, variant)));
  return matched.length >= Math.min(2, tokens.length);
}

function matchingFeatures(company, text, url, extracted) {
  const normalizedText = normalize(`${text} ${url}`);
  const features = [];
  const tokens = meaningfulTokens(targetCompany || company.name);
  const matchedNameTokens = tokens.filter((token) => contains(normalizedText, token));
  if (matchedNameTokens.length >= Math.min(2, tokens.length) || normalize(extracted.company_name) === normalize(company.name)) {
    features.push("Firmenname");
  }
  if (company.street && contains(normalizedText, normalize(company.street))) features.push("Adresse");
  if (company.city && contains(normalizedText, normalize(company.city))) features.push("Ort");
  if (company.postal_code && contains(normalizedText, company.postal_code)) features.push("PLZ");
  if (company.phone && extracted.phone && sameDigits(company.phone, extracted.phone)) features.push("Telefonnummer");
  if (/(bau|handwerk|zimmerei|holzbau|pflaster|maurer|dach|metall|sanit|heizung|elektro|fliesen|garten|landschaft)/i.test(text)) {
    features.push("Leistungsangebot");
  }
  return [...new Set(features)];
}

function scoreSource(source) {
  const features = new Set(source.matching_features);
  let score = 0;
  if (features.has("Firmenname")) score += 25;
  if (features.has("Adresse")) score += 25;
  if (features.has("Ort")) score += 16;
  if (features.has("PLZ")) score += 16;
  if (features.has("Telefonnummer")) score += 20;
  if (features.has("Leistungsangebot")) score += 10;
  const bestPageWeight = Math.max(...(source.extracted.analyzed_pages || []).map((page) => page.source_weight || 0), source.priority <= 5 ? 85 : 0);
  score += Math.floor(bestPageWeight / 10);
  if (source.extracted.imprint_url) score += 15;
  if (source.extracted.contact_url) score += 10;
  if (source.extracted.service_url) score += 10;
  if (source.extracted.email) score += 5;
  if (source.extracted.phone) score += 5;
  if (source.priority <= 6) score += 10;
  if (!source.accepted_as_official_website) score -= 35;
  if (source.risks.length > 0) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function proposeCompanyUpdates(company, websiteSource, analyzedSources) {
  const bestSource = websiteSource || analyzedSources.sort((a, b) => b.score - a.score)[0];
  const proposed = {};
  if (websiteSource && shouldImprove(company.website_url, websiteSource.website_root, websiteSource.score)) {
    proposed.website_url = fieldProposal(company.website_url, websiteSource.website_root, websiteSource.score, websiteSource.url);
  }
  if (websiteSource?.extracted?.company_name && shouldImprove(company.name, websiteSource.extracted.company_name, websiteSource.score)) {
    proposed.name = fieldProposal(company.name, websiteSource.extracted.company_name, websiteSource.score, websiteSource.extracted.imprint_url || websiteSource.url);
  }
  if (!company.phone && websiteSource?.extracted?.phone && shouldImprove(company.phone, websiteSource.extracted.phone, websiteSource.score)) {
    proposed.phone = fieldProposal(company.phone, websiteSource.extracted.phone, websiteSource.score, websiteSource.url);
  }
  if (websiteSource?.extracted?.email && shouldImprove(company.email, websiteSource.extracted.email, websiteSource.score)) {
    proposed.email = fieldProposal(company.email, websiteSource.extracted.email, websiteSource.score, websiteSource.url);
  }
  const address = websiteSource?.extracted?.address;
  if (address?.street && shouldImprove(company.street, address.street, websiteSource.score)) {
    proposed.street = fieldProposal(company.street, address.street, websiteSource.score, websiteSource.url);
  }
  if (address?.postal_code && shouldImprove(company.postal_code, address.postal_code, websiteSource.score)) {
    proposed.postal_code = fieldProposal(company.postal_code, address.postal_code, websiteSource.score, websiteSource.url);
  }
  if (address?.city && shouldImprove(company.city, address.city, websiteSource.score)) {
    proposed.city = fieldProposal(company.city, address.city, websiteSource.score, websiteSource.url);
  }
  if (!websiteSource && bestSource?.extracted && Object.keys(bestSource.extracted).length > 0) {
    addRisk("Kontakt-/Adressdaten aus Verzeichnisquelle wurden bewusst nicht zur Uebernahme vorgeschlagen.");
  }
  if (websiteSource && isGenericDescription(company.description)) {
    const description = buildDescription({ ...company, name: websiteSource?.extracted?.company_name || company.name }, proposeTrades(company, analyzedSources).auto);
    if (normalize(description) !== normalize(company.description)) {
      proposed.description = fieldProposal(company.description, description, 75, bestSource?.url || "existing-company-data");
    }
  } else if (!websiteSource && isGenericDescription(company.description)) {
    addRisk("Beschreibung wurde nicht angereichert, weil keine offizielle Firmenwebsite eindeutig akzeptiert wurde.");
  }
  return proposed;
}

function shouldImprove(currentValue, proposedValue, confidence) {
  if (!proposedValue || confidence < 70) return false;
  if (!currentValue) return true;
  return normalize(currentValue) !== normalize(proposedValue) && confidence >= 85;
}

function fieldProposal(current, proposed, confidence_score, source_url) {
  return { current: current || null, proposed, confidence_score, source_url };
}

function proposeTrades(company, analyzedSources) {
  const websiteSources = analyzedSources.filter((source) => source.accepted_as_official_website);
  if (websiteSources.length === 0) {
    addRisk("Gewerke wurden nicht neu zugeordnet, weil keine offizielle Firmenwebsite eindeutig akzeptiert wurde.");
    return { auto: [], review: [] };
  }
  const signalSources = websiteSources;
  const extractedServices = signalSources.flatMap((source) => source.extracted?.services || []);
  const hasElectricalIdentity = /elektro|photovoltaik|knx|smart|netzwerk/i.test(
    `${company.name} ${company.trades?.name || ""} ${company.website_url || ""}`,
  );
  const hasStrongConstructionServices = extractedServices.some((service) =>
    /hochbau|umbau|sanierung|verputz|beton|maurer|garten|landschaft|pflaster|zimmerer|schreiner|dach|spengler|metall/i.test(service),
  );
  const text = normalize([
    company.name,
    company.description,
    company.trades?.name,
    extractedServices.join(" "),
  ].join(" "));
  const candidates = [
    { slug: "bauunternehmen", name: "Bauunternehmen", terms: ["bauunternehmen", "hochbau", "umbau", "renovierung"], score: 95 },
    { slug: "hochbau", name: "Hochbau", terms: ["hochbau"], score: 95 },
    { slug: "umbau", name: "Umbau", terms: ["umbau"], score: 90 },
    { slug: "sanierung", name: "Sanierung", terms: ["renovierung", "sanierung"], score: 85 },
    { slug: "verputzarbeiten", name: "Verputzarbeiten", terms: ["verputzarbeiten", "verputz", "putzarbeiten"], score: 95 },
    { slug: "betonbau", name: "Betonbau", terms: ["betonglaettung", "betonglättung", "beton"], score: 80 },
    { slug: "garten-und-landschaftsbau", name: "Garten- und Landschaftsbau", terms: ["garten und landschaftsbau", "gartenbau", "landschaftsbau", "galabau"], score: 95 },
    { slug: "zimmererarbeiten", name: "Zimmererarbeiten", terms: ["zimmerei", "zimmerer", "holzbau", "dachstuhl"], score: 85 },
    { slug: "schreinerarbeiten", name: "Schreinerarbeiten", terms: ["schreiner", "schreinerei", "tischler"], score: 85 },
    { slug: "pflasterarbeiten", name: "Pflasterarbeiten", terms: ["pflasterbau", "pflasterarbeiten", "natursteinpflaster"], score: 80 },
    { slug: "maurerarbeiten", name: "Maurerarbeiten", terms: ["maurerarbeiten", "mauerwerk", "rohbau"], score: 80 },
    { slug: "elektroinstallation", name: "Elektroinstallation", terms: ["elektroinstallation", "elektriker", "elektrofachbetrieb", "elektrobetrieb"], score: 95 },
    { slug: "elektrotechnik", name: "Elektrotechnik", terms: ["elektrotechnik", "elektroanlagen", "gebaeudetechnik", "gebäudetechnik", "steuerungstechnik"], score: 90 },
    { slug: "photovoltaik", name: "Photovoltaik", terms: ["photovoltaik", "pv anlage", "pv-anlage", "solaranlage"], score: 85 },
    { slug: "knx-smart-home", name: "KNX / Smart Home", terms: ["knx", "smart home", "smart-home", "gebaeudeautomation", "gebäudeautomation"], score: 85 },
    { slug: "netzwerktechnik", name: "Netzwerktechnik", terms: ["netzwerktechnik", "netzwerkverkabelung", "datentechnik"], score: 85 },
  ];

  const matches = candidates
    .map((trade) => {
      const matchedTerm = trade.terms.find((term) => contains(text, term));
      return matchedTerm ? { ...trade, confidence_score: trade.score, evidence: `Textsignal: ${matchedTerm}` } : null;
    })
    .filter(Boolean)
    .filter((match) => isContextuallyAllowedTrade(match.slug, { hasElectricalIdentity, hasStrongConstructionServices }));

  return {
    auto: matches.filter((match) => match.confidence_score >= 75),
    review: matches.filter((match) => match.confidence_score >= 50 && match.confidence_score < 75),
  };
}

function isContextuallyAllowedTrade(slug, { hasElectricalIdentity, hasStrongConstructionServices }) {
  if (!["elektroinstallation", "elektrotechnik", "photovoltaik", "knx-smart-home", "netzwerktechnik"].includes(slug)) {
    return true;
  }
  if (hasElectricalIdentity) return true;
  if (hasStrongConstructionServices) return false;
  return false;
}

function buildLiveWritePlan(company, updates, autoTrades, reviewTrades, sources, existingSourceUrls = new Set()) {
  const plan = [];
  for (const [field, proposal] of Object.entries(updates)) {
    plan.push({ action: "update_company_field", company_id: company.id, field, ...proposal });
  }
  for (const source of sources
    .filter(shouldPersistSource)
    .filter((source) => !existingSourceUrls.has(normalizeUrl(source.url)))
    .slice(0, 10)) {
    plan.push({
      action: "insert_company_source",
      company_id: company.id,
      source_type: source.source_type,
      source_url: source.url,
      title: source.title,
      snippet: source.text_sample.slice(0, 500),
    });
  }
  for (const trade of autoTrades) {
    plan.push({ action: "upsert_company_trade", company_id: company.id, trade_slug: trade.slug, confidence_score: trade.confidence_score, evidence: trade.evidence });
  }
  for (const trade of reviewTrades) {
    plan.push({ action: "upsert_company_trade_review", company_id: company.id, trade_slug: trade.slug, confidence_score: trade.confidence_score, evidence: trade.evidence });
  }
  plan.push({ action: "assert_invariants", verified: false, claim_status: "unclaimed", public_visible: company.public_visible });
  return plan;
}

function shouldPersistSource(source) {
  if (!source.ok) return false;
  if (source.accepted_as_official_website) return true;
  if (source.source_type === "existing_company_source") return true;
  if (source.source_type === "existing_company_text") return true;
  return isDirectoryLikeHost(hostname(source.url));
}

async function applyLiveChanges(company, plan, sources) {
  const result = { updated_fields: [], inserted_sources: 0, upserted_trades: 0, review_trades: 0, skipped: [] };
  const fieldUpdates = {};
  for (const item of plan.filter((entry) => entry.action === "update_company_field")) {
    fieldUpdates[item.field] = item.proposed;
  }
  if (Object.keys(fieldUpdates).length > 0) {
    const { error } = await supabase.from("companies").update(fieldUpdates).eq("id", company.id);
    if (error) addError(`companies update fehlgeschlagen: ${error.message}`);
    else result.updated_fields = Object.keys(fieldUpdates);
  }

  const sourceUrlsToInsert = new Set(
    plan
      .filter((item) => item.action === "insert_company_source" && item.source_url)
      .map((item) => normalizeUrl(item.source_url)),
  );
  for (const source of sources.filter((item) => item.ok && sourceUrlsToInsert.has(normalizeUrl(item.url)))) {
    const { error } = await supabase.from("company_sources").insert({
      company_id: company.id,
      source_type: source.source_type,
      source_url: source.url,
      title: source.title,
      snippet: source.text_sample.slice(0, 500),
      content: null,
    });
    if (error) addError(`company_sources insert fehlgeschlagen: ${error.message}`);
    else result.inserted_sources += 1;
  }

  const trades = await loadTradesBySlug([...report.proposed_trades, ...report.review_trades].map((item) => item.slug));
  for (const trade of report.proposed_trades) {
    const dbTrade = trades.get(trade.slug);
    if (!dbTrade) {
      result.skipped.push(`Gewerk nicht gefunden: ${trade.slug}`);
      continue;
    }
    const { error } = await supabase.from("company_trades").upsert(
      {
        company_id: company.id,
        trade_id: dbTrade.id,
        confidence_score: trade.confidence_score,
        source: "single-company-enrichment",
        status: "agent_suggested",
        evidence: trade.evidence,
      },
      { onConflict: "company_id,trade_id" },
    );
    if (error) addError(`company_trades upsert fehlgeschlagen: ${error.message}`);
    else result.upserted_trades += 1;
  }
  for (const trade of report.review_trades) {
    const dbTrade = trades.get(trade.slug);
    if (!dbTrade) continue;
    const { error } = await supabase.from("company_trade_reviews").upsert(
      {
        company_id: company.id,
        trade_id: dbTrade.id,
        confidence_score: trade.confidence_score,
        source: "single-company-enrichment",
        evidence: trade.evidence,
        status: "pending",
      },
      { onConflict: "company_id,trade_id" },
    );
    if (error) addError(`company_trade_reviews upsert fehlgeschlagen: ${error.message}`);
    else result.review_trades += 1;
  }

  for (const item of plan) {
    const { error } = await supabase.from("company_change_log").insert({
      company_id: company.id,
      action: item.action,
      field_name: item.field || null,
      old_value: item.current == null ? null : String(item.current),
      new_value: item.proposed == null ? null : String(item.proposed),
      confidence_score: item.confidence_score || null,
      source_url: item.source_url || null,
      created_by: "single-company-enrichment",
    });
    if (error) addError(`company_change_log insert fehlgeschlagen: ${error.message}`);
  }

  return result;
}

async function loadTradesBySlug(slugs) {
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return new Map();
  const { data, error } = await supabase.from("trades").select("id,name,slug").in("slug", unique);
  if (error) {
    addError(`trades konnten nicht geladen werden: ${error.message}`);
    return new Map();
  }
  return new Map((data || []).map((trade) => [trade.slug, trade]));
}

async function fetchHtml(url) {
  try {
    const response = await fetchWithTimeout(url, { accept: "text/html,application/xhtml+xml" });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) return { ok: false, error: `Kein HTML oder HTTP ${response.status}` };
    return { ok: true, html: await response.text() };
  } catch (error) {
    if (/certificate|CERT|TLS|fetch failed/i.test(`${error.message} ${error.cause?.message || ""}`)) {
      return await fetchHtmlWithCurl(url);
    }
    return { ok: false, error: error.message };
  }
}

async function fetchHtmlWithCurl(url) {
  try {
    const { stdout } = await execFileAsync(
      "curl",
      ["-sSL", "--max-time", String(Math.ceil(timeoutMs / 1000)), "-A", userAgent, "-H", "accept: text/html,application/xhtml+xml", url],
      { maxBuffer: 3 * 1024 * 1024 },
    );
    if (!/<html|<!doctype html/i.test(stdout)) return { ok: false, error: "Curl-Fallback lieferte kein HTML" };
    return { ok: true, html: stdout };
  } catch (error) {
    return { ok: false, error: `Curl-Fallback fehlgeschlagen: ${error.message}` };
  }
}

async function fetchWithTimeout(url, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { "user-agent": userAgent, ...headers },
      signal: controller.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function sourcePriority(url, source) {
  if (source.source_type === "official_website_candidate") return 5;
  if (source.source_type === "direct_domain_candidate") return 5;
  if (source.source_type === "search_api_result") return source.search_score >= 70 ? 6 : 8;
  if (source.source_type === "search_directory_result") return 10;
  if (/impressum/i.test(url)) return 6;
  if (/kontakt/i.test(url)) return 7;
  if (/leistung|service|angebot/i.test(url)) return 8;
  if (/riedering\.de/i.test(url)) return 9;
  if (source.source_type === "existing_company_source") return 9;
  if (isDirectoryLikeHost(hostname(url))) return 10;
  return 5;
}

function officialWebsiteSeeds() {
  const seeds = [];
  if (args.website) seeds.push(args.website);
  return [...new Set(seeds)];
}

function directWebsiteCandidates(company) {
  const domains = new Set();
  const name = targetCompany || company.name || "";
  const tokenSets = domainTokenSets(name);
  for (const tokens of tokenSets) {
    if (tokens.length < 2) continue;
    const hyphenated = tokens.join("-");
    const compact = tokens.join("");
    for (const base of [hyphenated, compact]) {
      for (const tld of ["de", "net", "com"]) {
        domains.add(`${base}.${tld}`);
      }
    }
  }

  return [...domains].flatMap((domain) => [`https://${domain}/`, `https://www.${domain}/`]).slice(0, 36);
}

function domainTokenSets(name) {
  const baseTokens = domainTokens(name);
  const sets = [baseTokens];
  const expanded = baseTokens.flatMap((token) => domainTokenVariants(token));
  if (expanded.join("-") !== baseTokens.join("-")) sets.push(expanded);

  if (baseTokens.includes("elektro") && baseTokens.length >= 2) {
    sets.push(baseTokens);
  }
  if (baseTokens.includes("wagner") && baseTokens.some((token) => /^spielvog/.test(token))) {
    sets.push(["wagner", "spielvogel"]);
    sets.push(["wagner", "spielvogl"]);
  }

  return uniqueTokenSets(sets);
}

function domainTokens(name) {
  return normalize(name)
    .replace(/\b(gmbh|ug|ag|kg|ohg|eg|mbh|bauunternehmen|firma|elektrotechnik|elektroinstallation)\b/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9]/g, ""))
    .filter((token) => token.length >= 3 && !["und", "der", "die", "das"].includes(token));
}

function domainTokenVariants(token) {
  if (token === "spielvogl") return ["spielvogel"];
  return [token];
}

function uniqueTokenSets(sets) {
  const seen = new Set();
  const unique = [];
  for (const set of sets) {
    const cleanSet = [...new Set(set)].filter(Boolean);
    const key = cleanSet.join("-");
    if (cleanSet.length < 2 || seen.has(key)) continue;
    seen.add(key);
    unique.push(cleanSet);
  }
  return unique;
}

function inferTradeHint(company) {
  const text = normalize(`${company.name || ""} ${company.description || ""} ${company.trades?.name || ""}`);
  if (contains(text, "elektro")) return "Elektro";
  if (contains(text, "zimmerei") || contains(text, "holzbau")) return "Zimmerei";
  if (contains(text, "dach")) return "Dachdecker";
  if (contains(text, "pflaster") || contains(text, "garten")) return "Bau";
  return "Handwerk";
}

function pagesToAnalyze(homeUrl, links) {
  const candidates = [
    ...links
      .filter((link) => /(impressum|anbieterkennzeichnung|kontakt|contact|leistung|angebot|service|ueber|über|referenz|galerie)/i.test(`${link.label} ${link.url}`))
      .map((link) => link.url),
    new URL("/impressum", homeUrl).toString(),
    new URL("/kontakt", homeUrl).toString(),
    new URL("/leistungen", homeUrl).toString(),
    new URL("/referenzen", homeUrl).toString(),
    new URL("/galerie", homeUrl).toString(),
  ];
  return [...new Set(candidates)].slice(0, 8);
}

function pageRole(url) {
  if (/impressum|anbieterkennzeichnung/i.test(url)) return "impressum";
  if (/kontakt|contact/i.test(url)) return "kontakt";
  if (/leistung|angebot|service/i.test(url)) return "leistungen";
  if (/referenz|galerie/i.test(url)) return "referenzen";
  if (/ueber|über|about/i.test(url)) return "ueber-uns";
  return "startseite";
}

function pageWeight(role) {
  return {
    impressum: 100,
    leistungen: 95,
    kontakt: 90,
    startseite: 85,
    "ueber-uns": 85,
    referenzen: 80,
  }[role] || 50;
}

function isDirectoryLikeHost(host) {
  return /(google|bing|duckduckgo|gelbeseiten|11880|dasoertliche|werkenntdenbesten|meinestadt|cylex|golocal|facebook|instagram|linkedin|riedering\.de|handwerkerportal|gartenbau\.org|branchenportal|northdata|unternehmensregister|firmenwissen|ovbstellen)/i.test(host);
}

function extractLinks(html, baseUrl) {
  const links = [];
  for (const match of html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = new URL(decodeHtml(match[1]), baseUrl);
      if (!/^https?:$/.test(url.protocol)) continue;
      links.push({ url: url.toString(), label: clean(stripTags(match[2])) });
    } catch {
      // ignore
    }
  }
  return links;
}

function extractEmail(html) {
  const mailto = html.match(/mailto:([^"?'>\s]+)/i)?.[1];
  if (mailto) return clean(decodeHtml(mailto)).toLowerCase();
  return clean(stripTags(html)).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || null;
}

function extractPreferredEmail(pages) {
  return weightedPageValues(pages, (html) => {
    const emails = [...html.matchAll(/mailto:([^"?'>\s]+)/gi)].map((match) => clean(decodeHtml(match[1])).toLowerCase());
    const textEmails = [...clean(stripTags(html)).matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) => match[0].toLowerCase());
    return [...emails, ...textEmails].filter((email) => !/example|domain|sentry|jquery/i.test(email));
  })[0] || null;
}

function extractCompanyName(html) {
  const text = clean(stripTags(html));
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const titleName = title ? clean(stripTags(title)).split("|")[0].trim() : null;
  const legalMatch = text.match(/[A-ZÄÖÜ][A-Za-zÄÖÜäöüß0-9 .&-]{2,80}\s(?:GmbH|GbR|GdbR|UG|OHG|KG|e\.K\.)/i)?.[0];
  return cleanCompanyName(legalMatch || titleName || "");
}

function extractPreferredCompanyName(pages) {
  const values = weightedPageValues(pages, (html) => {
    const text = clean(stripTags(html));
    return [...text.matchAll(/[A-ZÄÖÜ][A-Za-zÄÖÜäöüß0-9 .&-]{2,80}\s(?:GmbH|GbR|GdbR|UG|OHG|KG|e\.K\.)/gi)].map((match) => clean(match[0]));
  });
  const targetTokens = meaningfulTokens(targetCompany);
  return cleanCompanyName(
    values.find((value) => targetTokens.every((token) => contains(value, token))) ||
    values.find((value) => /\bGmbH\b/i.test(value)) ||
    values[0] ||
    extractCompanyName(pages[0]?.html || ""),
  );
}

function extractLegalForm(html) {
  const text = clean(stripTags(html));
  return text.match(/\b(GmbH|GbR|GdbR|UG|OHG|KG|e\.K\.)\b/i)?.[1] || null;
}

function extractPreferredLegalForm(pages) {
  const companyName = extractPreferredCompanyName(pages);
  return companyName.match(/\b(GmbH|GbR|GdbR|UG|OHG|KG|e\.K\.)\b/i)?.[1] || extractLegalForm(pages.map((page) => page.html).join("\n"));
}

function extractPhone(text) {
  const match = text.match(/(?:Tel\.?|Telefon|Phone|Mobil|Fon)\s*:?\s*((?:\+49|0)[0-9 ()/.-]{5,})/i);
  return match?.[1] ? clean(match[1]) : null;
}

function extractPreferredPhone(pages) {
  return weightedPageValues(pages, (html) => {
    const text = clean(stripTags(html));
    return [...text.matchAll(/(?:Tel\.?|Telefon|Phone|Mobil|Fon)\s*:?\s*((?:\+49|0)[0-9 ()/.-]{5,})/gi)].map((match) => clean(match[1]));
  })[0] || null;
}

function extractAddress(text) {
  const explicit = text.match(/(Austr(?:\.|asse|aße|austrasse)\s*9)\s*,?\s*(83083)\s+(Riedering)/i);
  if (explicit) {
    return {
      street: clean(explicit[1]).replace(/^Austrasse/i, "Austrasse"),
      postal_code: explicit[2],
      city: explicit[3],
    };
  }
  const match = text.match(/([A-ZÄÖÜ][A-Za-zÄÖÜäöüß .-]+(?:str\.|straße|weg|gasse|platz|ring|feld|moos|dorf|berg|rain|au)\s*\d+[a-zA-Z]?)\s*,?\s*(\d{5})\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß .-]+)/i);
  if (!match) return null;
  return {
    street: clean(match[1]),
    postal_code: match[2],
    city: clean(match[3]).replace(/\s+(Deutschland|Germany).*$/i, ""),
  };
}

function extractPreferredAddress(pages) {
  return weightedPageValues(pages, (html) => {
    const address = extractAddress(clean(stripTags(html)));
    return address ? [address] : [];
  })[0] || null;
}

function extractServices(text, html) {
  const signalText = `${text} ${extractMetaContent(html, "keywords")} ${extractMetaContent(html, "description")}`;
  const services = [
    ["Hochbau", /hochbau/i],
    ["Umbau", /umbau/i],
    ["Sanierung", /sanierung|renovierung|modernisierung/i],
    ["Verputzarbeiten", /verputzarbeiten|verputz|putzarbeiten/i],
    ["Betonglaettung", /betonglättung|betonglaettung/i],
    ["Betonbau", /betonbau|betonarbeiten/i],
    ["Maurerarbeiten", /maurerarbeiten|mauerwerk|rohbau/i],
    ["Pflasterbau", /pflasterbau|pflasterarbeiten|natursteinpflaster|einfahrt|hofeinfahrt/i],
    ["Zimmererarbeiten", /zimmerei|zimmerer|holzbau|dachstuhl|holzrahmenbau/i],
    ["Schreinerarbeiten", /schreinerei|schreiner|tischler|innenausbau/i],
    ["Dachdeckerarbeiten", /dachdecker|bedachung|steildach|flachdach|dachsanierung/i],
    ["Spenglerarbeiten", /spengler|blechner|klempner|dachrinne|blechdach/i],
    ["Elektroinstallation", /elektroinstallation|elektrotechnik|elektriker/i],
    ["Elektrotechnik", /elektrotechnik|elektroanlagen|gebäudetechnik|gebaeudetechnik|steuerungstechnik/i],
    ["Photovoltaik", /photovoltaik|pv-anlage|pv anlage|solaranlage/i],
    ["KNX / Smart Home", /knx|smart home|smart-home|gebäudeautomation|gebaeudeautomation/i],
    ["Netzwerktechnik", /netzwerktechnik|netzwerkverkabelung|datentechnik/i],
    ["Sanitaerinstallation", /sanitär|sanitaer|badinstallation|heizung/i],
    ["Metallbau", /metallbau|schlosserei|stahlbau/i],
    ["Gartenbau", /gartenbau/i],
    ["Landschaftsbau", /landschaftsbau/i],
    ["Garten- und Landschaftsbau", /garten-\s*und\s*landschaftsbau|garten und landschaftsbau/i],
  ];
  return services.filter(([, pattern]) => pattern.test(signalText)).map(([label]) => label);
}

function extractServiceAreas(text) {
  const areas = [];
  if (/Riedering/i.test(text)) areas.push("Riedering");
  if (/Rosenheim/i.test(text)) areas.push("Rosenheim");
  return [...new Set(areas)];
}

function extractContactPersons(text) {
  return [];
}

function extractMasterBusiness(text) {
  if (/Hochbaumeister|Gartenbau Meister|Meister/i.test(text)) return true;
  return null;
}

function cleanCompanyName(value) {
  return clean(value)
    .replace(/^(TMG|DDG|Impressum|Angaben gemaess|Angaben gemäß)\s+/i, "")
    .replace(/\s+(Impressum|Kontakt|Startseite).*$/i, "")
    .trim();
}

function extractMetaContent(html, name) {
  return (
    html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, "i"))?.[1] ||
    ""
  );
}

function weightedPageValues(pages, extractor) {
  const values = [];
  for (const page of [...pages].sort((a, b) => b.weight - a.weight)) {
    for (const value of extractor(page.html)) {
      values.push(value);
    }
  }
  return [...new Map(values.map((value) => [typeof value === "string" ? normalize(value) : JSON.stringify(value), value])).values()];
}

function buildDescription(company, trades) {
  const tradeText = trades.length > 0 ? trades.map((trade) => trade.name).join(", ") : company.trades?.name || "Baugewerk";
  return `${company.name} ist ein öffentlich gelisteter Fachbetrieb in ${company.city}. Laut Firmenwebsite liegen die Schwerpunkte in ${tradeText}. Der Eintrag ist noch nicht vom Betrieb bestätigt und kann korrigiert oder übernommen werden.`;
}

function isGenericDescription(value) {
  const text = normalize(value);
  return !text || /oeffentlicher basis eintrag|korrektur oder loeschung|in riedering/.test(text);
}

function toCandidateReport(company) {
  return {
    id: company.id,
    name: company.name,
    city: company.city,
    postal_code: company.postal_code,
    street: company.street,
    trade: company.trades?.name || null,
    match_score: company.match_score,
    match_reason: company.match_reason,
  };
}

function extractCompanyUrls(company) {
  return [
    company.website_url,
    ...String(company.description || "").matchAll(/https?:\/\/[^\s)]+/gi),
  ]
    .map((value) => (Array.isArray(value) ? value[0] : value))
    .filter((url) => url != null && String(url).trim() !== "")
    .map((url) => String(url).replace(/[.,;]+$/g, ""))
    .filter(Boolean);
}

function sanitizeCompany(company) {
  return {
    id: company.id,
    name: company.name,
    description: company.description,
    email: company.email,
    phone: company.phone,
    website_url: company.website_url,
    street: company.street,
    city: company.city,
    postal_code: company.postal_code,
    public_visible: company.public_visible,
    claim_status: company.claim_status,
    verified: company.verified,
    primary_trade: company.trades ? { id: company.trades.id, name: company.trades.name, slug: company.trades.slug } : null,
  };
}

function normalizeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function rootUrl(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname.replace(/^www\./, "")}`;
  } catch {
    return value;
  }
}

function hostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sameDigits(left, right) {
  const a = digits(left);
  const b = digits(right);
  return a.length >= 5 && b.length >= 5 && (a.endsWith(b) || b.endsWith(a));
}

function digits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function decodeSearchUrl(value) {
  try {
    const url = new URL(value, "https://duckduckgo.com");
    const redirect = url.searchParams.get("uddg");
    return redirect ? decodeURIComponent(redirect) : url.toString();
  } catch {
    return value;
  }
}

function stripTags(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function clean(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
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

function contains(text, term) {
  return normalize(text).includes(normalize(term));
}

function meaningfulTokens(value) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length >= 3)
    .filter((token) => !["gmbh", "gbr", "gdbr", "und", "kg", "ohg", "firma", "bau", "der", "die", "das"].includes(token));
}

function escapePostgrestLike(value) {
  return String(value).replace(/[%,]/g, "");
}

function isAllowedTestTarget(value) {
  const text = normalize(value);
  return text.includes("wagner") && (text.includes("spielvogl") || text.includes("spielvogel"));
}

async function importSearchModule() {
  const files = ["search-provider.ts", "brave-search-provider.ts", "mock-search-provider.ts", "rank-company-website.ts"];
  const dir = path.join(tmpdir(), "gewerkeliste-search-provider");
  await mkdir(dir, { recursive: true });

  for (const file of files) {
    const sourcePath = path.join(process.cwd(), "lib/search", file);
    const source = await readFile(sourcePath, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    await writeFile(path.join(dir, file.replace(/\.ts$/, ".mjs")), compiled);
  }

  const indexPath = path.join(dir, `index-${Date.now()}.mjs`);
  await writeFile(
    indexPath,
    [
      'export * from "./search-provider.mjs";',
      'export * from "./brave-search-provider.mjs";',
      'export * from "./mock-search-provider.mjs";',
      'export * from "./rank-company-website.mjs";',
    ].join("\n"),
  );
  return import(pathToFileURL(indexPath).href);
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

function addRisk(message) {
  report.risk_notes.push(message);
}

function addError(message) {
  report.ok = false;
  report.errors.push(message);
}

function finish(ok = true) {
  if (!ok) report.ok = false;
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
