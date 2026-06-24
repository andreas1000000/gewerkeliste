#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { requireExternalApiConfirmation, requireLiveConfirmation, requireSupabaseSafety } from "./safety-gates.mjs";

const searchModule = await importSearchModule();
const args = parseArgs(process.argv.slice(2));
const regionSlug = String(args.region || "riedering").trim().toLowerCase();
const requestedTrade = args.trade ? String(args.trade).trim() : null;
const live = Boolean(args.live);
const maxQueries = Number(args["max-queries"] || 20);
const maxResultsPerQuery = Number(args["max-results-per-query"] || 5);
const maxEnrichCandidates = Number(args["max-enrich-candidates"] || 35);
const maxPagesPerWebsite = Number(args["max-pages-per-website"] || 5);
const targetNameFilter = args.name ? String(args.name).trim() : null;
const timeoutMs = Number(args["timeout-ms"] || 8000);
const monthlyBudgetEur = Number(args["monthly-budget-eur"] || 10);
const estimatedCostPerQuery = Number(args["estimated-cost-per-query-eur"] || 0.01);
const userAgent = "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (live) {
  requireLiveConfirmation({
    args,
    action: "discover-region-live",
    reason: "Regional Discovery schreibt Kandidaten, Coverage Snapshots und Review Items.",
  });
}
requireSupabaseSafety({ args, url: supabaseUrl, live, action: "discover-region-live" });
if (process.env.BRAVE_SEARCH_API_KEY) {
  requireExternalApiConfirmation({ args, provider: "brave-search", estimatedRequests: maxQueries });
}
const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const pilotRegions = {
  "landkreis-rosenheim": {
    name: "Landkreis Rosenheim",
    slug: "landkreis-rosenheim",
    postal_codes: [
      "83022",
      "83024",
      "83026",
      "83043",
      "83052",
      "83059",
      "83064",
      "83071",
      "83075",
      "83080",
      "83083",
      "83088",
      "83093",
      "83098",
      "83101",
      "83109",
      "83112",
      "83115",
      "83119",
      "83122",
      "83123",
      "83125",
      "83126",
      "83128",
      "83129",
      "83131",
      "83134",
      "83135",
      "83137",
      "83139",
      "83209",
      "83229",
      "83233",
      "83253",
      "83512",
      "83533",
      "83539",
      "83543",
      "83549",
      "83556",
      "83561",
      "83564",
      "83569",
    ],
    query_localities: [
      "Rosenheim",
      "Kolbermoor",
      "Bad Aibling",
      "Raubling",
      "Stephanskirchen",
      "Riedering",
      "Prien am Chiemsee",
      "Wasserburg am Inn",
      "Brannenburg",
      "Rohrdorf",
      "Bernau am Chiemsee",
      "Frasdorf",
      "Bad Endorf",
      "Grosskarolinenfeld",
      "Bruckmuehl",
      "Neubeuern",
      "Nussdorf am Inn",
      "Flintsbach am Inn",
      "Oberaudorf",
      "Kiefersfelden",
      "Aschau im Chiemgau",
      "Rimsting",
      "Eggstaett",
      "Halfing",
      "Soechtenau",
      "Tuntenhausen",
      "Feldkirchen-Westerham",
      "Schechen",
      "Rott am Inn",
      "Amerang",
      "Eiselfing",
      "Griesstaett",
      "Pfaffing",
      "Vogtareuth",
    ],
    municipality: null,
    county: "Rosenheim",
    state: "Bayern",
    country: "Deutschland",
    latitude: 47.856,
    longitude: 12.129,
    region_type: "county",
  },
  riedering: {
    name: "Riedering",
    slug: "riedering",
    postal_codes: ["83083"],
    municipality: "Riedering",
    county: "Rosenheim",
    state: "Bayern",
    country: "Deutschland",
    latitude: 47.838,
    longitude: 12.207,
    region_type: "municipality",
  },
};

const tradePresets = {
  maurerarbeiten: {
    slug: "maurerarbeiten",
    name: "Maurer",
    terms: ["maurer", "maurerarbeiten", "mauerwerk", "massivbau", "rohbau", "hochbau"],
    estimated: 20,
  },
  rohbau: {
    slug: "rohbau",
    name: "Rohbau",
    terms: ["rohbau", "hochbau", "mauerwerk", "betonarbeiten", "schalung", "bewehrung"],
    estimated: 18,
  },
  betonbau: {
    slug: "betonbau",
    name: "Betonbau",
    terms: ["betonbau", "stahlbeton", "betonarbeiten", "schalung", "bewehrung", "fundament"],
    estimated: 12,
  },
  bauunternehmen: {
    slug: "bauunternehmen",
    name: "Bauunternehmen",
    terms: ["bauunternehmen", "baufirma", "hochbau", "rohbau", "umbau", "sanierung", "maurer"],
    estimated: 8,
  },
  elektroinstallation: {
    slug: "elektroinstallation",
    name: "Elektroinstallation",
    terms: ["elektro", "elektriker", "elektroinstallation", "elektrotechnik", "photovoltaik", "netzwerktechnik"],
    estimated: 12,
  },
  elektrotechnik: {
    slug: "elektrotechnik",
    name: "Elektrotechnik",
    terms: ["elektrotechnik", "elektro", "elektriker", "elektroanlagen", "photovoltaik", "netzwerktechnik"],
    estimated: 18,
  },
  heizungsbau: {
    slug: "heizungsbau",
    name: "Heizung",
    terms: ["heizung", "heizungsbau", "waermepumpe", "wärmepumpe", "heizungsanlage", "shk"],
    estimated: 16,
  },
  sanitaerinstallation: {
    slug: "sanitaerinstallation",
    name: "Sanitär",
    terms: ["sanitär", "sanitaer", "bad", "trinkwasser", "abwasser", "shk"],
    estimated: 16,
  },
  "sanitaer-heizung-klima": {
    slug: "sanitaer-heizung-klima",
    name: "Sanitär Heizung Klima",
    relatedSlugs: ["sanitaerinstallation", "heizungsbau", "lueftung", "kaelte-klima", "waermepumpen"],
    terms: ["sanitär", "sanitaer", "heizung", "shk", "lüftung", "lueftung", "klima", "wärmepumpe", "waermepumpe"],
    estimated: 8,
  },
  lueftung: {
    slug: "lueftung",
    name: "Lüftung",
    terms: ["lüftung", "lueftung", "lüftungsbau", "raumlufttechnik", "wohnraumlüftung"],
    estimated: 8,
  },
  "kaelte-klima": {
    slug: "kaelte-klima",
    name: "Klima",
    terms: ["klima", "klimatechnik", "kälte", "kaelte", "kälteanlagen", "klimaanlage"],
    estimated: 8,
  },
  zimmererarbeiten: {
    slug: "zimmererarbeiten",
    name: "Zimmerei",
    terms: ["zimmerei", "zimmerer", "holzbau", "dachstuhl", "holzrahmenbau", "abbund"],
    estimated: 20,
  },
  dachdeckerarbeiten: {
    slug: "dachdeckerarbeiten",
    name: "Dachdecker",
    terms: ["dachdecker", "bedachungen", "dachsanierung", "flachdach", "steildach", "dachfenster"],
    estimated: 14,
  },
  spenglerarbeiten: {
    slug: "spenglerarbeiten",
    name: "Spengler",
    terms: ["spengler", "blechner", "klempner", "dachrinne", "blechdach", "kaminverkleidung"],
    estimated: 12,
  },
  tiefbau: {
    slug: "tiefbau",
    name: "Tiefbau",
    terms: ["tiefbau", "erdbau", "kanalbau", "entwässerung", "entwaesserung", "baggerbetrieb"],
    estimated: 14,
  },
  erdbau: {
    slug: "erdbau",
    name: "Erdbau",
    terms: ["erdbau", "baggerarbeiten", "aushub", "erdarbeiten", "baggerbetrieb"],
    estimated: 12,
  },
  kanalbau: {
    slug: "kanalbau",
    name: "Kanalbau",
    terms: ["kanalbau", "entwässerung", "entwaesserung", "kanalsanierung", "rohrleitungsbau"],
    estimated: 8,
  },
  malerarbeiten: {
    slug: "malerarbeiten",
    name: "Malerarbeiten",
    terms: ["maler", "malerarbeiten", "lackierer", "anstrich", "fassadenanstrich", "innenanstrich"],
    estimated: 8,
  },
  stuckateurarbeiten: {
    slug: "stuckateurarbeiten",
    name: "Stuckateur",
    terms: ["stuckateur", "stuck", "putz", "innenputz", "aussenputz", "fassade"],
    estimated: 12,
  },
  trockenbau: {
    slug: "trockenbau",
    name: "Trockenbau",
    terms: ["trockenbau", "gipskarton", "akustikbau", "trennwand", "deckenbau"],
    estimated: 14,
  },
  fliesenarbeiten: {
    slug: "fliesenarbeiten",
    name: "Fliesenleger",
    terms: ["fliesenleger", "fliesen", "platten", "natursteinverlegung", "badsanierung"],
    estimated: 16,
  },
  estricharbeiten: {
    slug: "estricharbeiten",
    name: "Estrich",
    terms: ["estrich", "estricharbeiten", "fliessestrich", "zementestrich", "bodenausgleich"],
    estimated: 8,
  },
  bodenlegerarbeiten: {
    slug: "bodenlegerarbeiten",
    name: "Bodenleger",
    terms: ["bodenleger", "bodenbelag", "parkett", "vinyl", "linoleum", "boden"],
    estimated: 12,
  },
  schreinerarbeiten: {
    slug: "schreinerarbeiten",
    name: "Schreiner",
    terms: ["schreiner", "schreinerei", "tischler", "möbelbau", "moebelbau", "innenausbau"],
    estimated: 22,
  },
  innenausbau: {
    slug: "innenausbau",
    name: "Innenausbau",
    terms: ["innenausbau", "ausbau", "möbelbau", "moebelbau", "akustik", "trockenbau"],
    estimated: 18,
  },
  "fenster-tueren": {
    slug: "fenster-tueren",
    name: "Fensterbau",
    terms: ["fensterbau", "fenster", "türen", "tueren", "haustüren", "haustueren"],
    estimated: 12,
  },
  metallbau: {
    slug: "metallbau",
    name: "Metallbau",
    terms: ["metallbau", "schlosserei", "stahlbau", "geländer", "gelaender", "torbau"],
    estimated: 18,
  },
  schlosserarbeiten: {
    slug: "schlosserarbeiten",
    name: "Schlosserei",
    terms: ["schlosserei", "schlosser", "metallbau", "stahlbau", "geländer", "gelaender"],
    estimated: 10,
  },
  bauwerksabdichtung: {
    slug: "bauwerksabdichtung",
    name: "Abdichtung",
    terms: ["abdichtung", "bauwerksabdichtung", "kellerabdichtung", "flachdachabdichtung", "feuchteschutz"],
    estimated: 8,
  },
  brandschutz: {
    slug: "brandschutz",
    name: "Brandschutz",
    terms: ["brandschutz", "brandschutztechnik", "abschottung", "brandabschottung", "rauchschutz"],
    estimated: 6,
  },
  geruestbau: {
    slug: "geruestbau",
    name: "Gerüstbau",
    terms: ["gerüstbau", "geruestbau", "arbeitsgerüst", "fassadengerüst", "gerüst"],
    estimated: 8,
  },
  abbrucharbeiten: {
    slug: "abbrucharbeiten",
    name: "Abbruch",
    terms: ["abbruch", "rückbau", "rueckbau", "entkernung", "demontage"],
    estimated: 8,
  },
  bauendreinigung: {
    slug: "bauendreinigung",
    name: "Bauendreinigung",
    terms: ["bauendreinigung", "baureinigung", "baugrobreinigung", "baufeinreinigung"],
    estimated: 8,
  },
  "garten-und-landschaftsbau": {
    slug: "garten-und-landschaftsbau",
    name: "Garten- und Landschaftsbau",
    terms: ["gartenbau", "landschaftsbau", "galabau", "aussenanlagen", "außenanlagen", "pflaster", "gartenpflege"],
    estimated: 10,
  },
  pflasterbau: {
    slug: "pflasterbau",
    name: "Pflasterbau",
    terms: ["pflasterbau", "pflasterarbeiten", "natursteinpflaster", "einfahrt", "terrassen", "wege"],
    estimated: 14,
  },
};

const storageTradeSlugAliases = {
  "sanitaer-heizung-klima": "heizungsbau",
  sanitaer: "sanitaerinstallation",
  heizung: "heizungsbau",
};

const report = {
  ok: true,
  mode: live ? "live" : "dry_run",
  guardrails: {
    region_based: true,
    pilot_region: regionSlug,
    writes_companies_directly: false,
    writes_only_candidates: live,
    auto_publish_threshold: 90,
    missing_confirmed_website_always_review: true,
    monthly_budget_eur: monthlyBudgetEur,
    sends_email: false,
    copies_logos_or_images: false,
    copies_foreign_text: false,
  },
  region: null,
  selected_trades: [],
  search: {
    provider: null,
    available: false,
    generated_queries: [],
    executed_queries: [],
    skipped_queries: [],
    estimated_cost_eur: 0,
    budget_ok: true,
  },
  enrichment: {
    enabled: true,
    max_candidates: maxEnrichCandidates,
    max_pages_per_website: maxPagesPerWebsite,
    visited_websites: 0,
    accepted_official_websites: 0,
  },
  candidates: [],
  coverage: [],
  live_result: null,
  errors: [],
  risk_notes: [],
};

const region = await resolveRegion(regionSlug);
report.region = region;
const selectedTrades = selectTrades(requestedTrade);
report.selected_trades = selectedTrades.map(({ slug, name }) => ({ slug, name }));

const queries = buildSearchQueries(region, selectedTrades);
report.search.generated_queries = queries;
const executableQueries = queries.slice(0, maxQueries);
report.search.executed_queries = executableQueries;
report.search.skipped_queries = queries.slice(maxQueries);
report.search.estimated_cost_eur = roundCurrency(executableQueries.length * estimatedCostPerQuery);
report.search.budget_ok = report.search.estimated_cost_eur <= monthlyBudgetEur;

if (!report.search.budget_ok) {
  fail(`Budgetlimit ueberschritten: geschaetzt ${report.search.estimated_cost_eur} EUR > ${monthlyBudgetEur} EUR.`);
}

const provider = createSearchProvider();
report.search.provider = provider?.name || null;
report.search.available = Boolean(provider?.available);
if (!provider?.available) {
  addRisk("Kein BRAVE_SEARCH_API_KEY gesetzt. Es wurde keine echte Websuche ausgefuehrt.");
}

const existingCompanies = await loadExistingCompanies(region);
const existingCandidates = live ? await loadExistingCandidates(region) : [];
const rawResults = [];

if (provider?.available) {
  for (const query of executableQueries) {
    try {
      const results = await provider.search(query);
      rawResults.push(...results.slice(0, maxResultsPerQuery).map((result) => ({ ...result, query })));
    } catch (error) {
      addError(`Search fehlgeschlagen fuer "${query}": ${error.message}`);
    }
  }
}

const candidateMap = new Map();
for (const result of rawResults) {
  const trade = selectedTrades.find((item) => result.query.includes(item.name) || item.terms.some((term) => normalize(result.query).includes(normalize(term)))) || selectedTrades[0];
  const candidate = candidateFromSearchResult(result, region, trade, existingCompanies, existingCandidates);
  if (!candidate?.name || !candidate.source_url) continue;
  const key = `${normalize(candidate.name)}|${hostname(candidate.source_url)}|${candidate.possible_trade}`;
  const previous = candidateMap.get(key);
  if (!previous || candidate.overall_score > previous.overall_score) candidateMap.set(key, candidate);
}

const discoveredCandidates = [...candidateMap.values()]
  .filter((candidate) => !targetNameFilter || contains(candidate.name, targetNameFilter) || contains(candidate.raw_evidence?.search_snippet || "", targetNameFilter))
  .sort((a, b) => b.overall_score - a.overall_score || a.name.localeCompare(b.name, "de"))
  .slice(0, 80);

report.candidates = await enrichCandidates(discoveredCandidates, region, selectedTrades, existingCompanies, existingCandidates);
report.coverage = await calculateCoverage(region, selectedTrades, report.candidates, existingCompanies);

if (live) {
  await assertLiveTables();
  report.live_result = await persistLive(region, selectedTrades, executableQueries, report.candidates, report.coverage);
}

finish();

async function resolveRegion(slug) {
  if (supabase) {
    const { data, error } = await supabase.from("regions").select("*").eq("slug", slug).limit(1);
    if (!error && data?.[0]) return { ...(pilotRegions[slug] || {}), ...normalizeRegion(data[0]) };
  }
  if (pilotRegions[slug]) return pilotRegions[slug];
  fail(`Region nicht bekannt: ${slug}`);
}

function selectTrades(slug) {
  if (!slug) {
    return Object.values(tradePresets);
  }
  const trade = tradePresets[slug];
  if (!trade) fail(`Gewerk nicht im MVP-Preset: ${slug}`);
  return [trade];
}

function buildSearchQueries(region, trades) {
  const tradeQueries = trades.map((trade) => buildRegionTradeQueries(region, trade));
  const result = [];
  const maxLength = Math.max(...tradeQueries.map((queries) => queries.length));
  for (let index = 0; index < maxLength; index += 1) {
    for (const queries of tradeQueries) {
      if (queries[index]) result.push(queries[index]);
    }
  }
  return [...new Set(result)];
}

function buildRegionTradeQueries(region, trade) {
  const localities = region.query_localities?.length ? region.query_localities : [region.name];
  const county = region.county || region.name;
  const queries = [];
  for (const locality of localities) {
    queries.push(`${trade.name} ${locality}`);
    queries.push(`${trade.name} ${locality} Handwerk`);
  }
  queries.push(`${trade.name} Landkreis ${county}`);
  queries.push(`${trade.name} Rosenheim Chiemgau`);
  queries.push(`${trade.name} ${county} Innung`);
  queries.push(`${trade.name} ${county} Gewerbeverzeichnis`);
  queries.push(`site:.de ${trade.name} ${county}`);
  return [...new Set(queries.filter(Boolean))];
}

function createSearchProvider() {
  if (!process.env.BRAVE_SEARCH_API_KEY) return null;
  return new searchModule.BraveSearchProvider({
    apiKey: process.env.BRAVE_SEARCH_API_KEY,
    maxResults: maxResultsPerQuery,
    userAgent,
  });
}

async function loadExistingCompanies(region) {
  if (!supabase) return [];
  const postalCode = region.postal_codes?.[0] || "";
  const { data, error } = await supabase
    .from("companies")
    .select("id,name,slug,city,postal_code,street,phone,email,website_url,verified,claim_status,public_visible,trades(id,name,slug)")
    .or(`city.ilike.%${region.name}%,postal_code.eq.${postalCode}`);
  if (error) {
    addRisk(`Bestehende Firmen konnten nicht geladen werden: ${error.message}`);
    return [];
  }
  return data || [];
}

async function loadExistingCandidates(region) {
  if (!supabase) return [];
  const postalCode = region.postal_codes?.[0] || "";
  const { data, error } = await supabase
    .from("company_candidates")
    .select("id,name,city,postal_code,phone,email,possible_website,source_url,status")
    .or(`city.ilike.%${region.name}%,postal_code.eq.${postalCode}`)
    .neq("status", "rejected");
  if (error) return [];
  return data || [];
}

function candidateFromSearchResult(result, region, trade, existingCompanies, existingCandidates) {
  const sourceUrl = normalizeUrl(result.url);
  const sourceHost = hostname(sourceUrl);
  const text = `${result.title} ${result.snippet} ${result.url}`;
  const directory = isDirectoryLikeHost(sourceHost);
  const possibleWebsite = directory ? extractWebsiteCandidate(text, sourceUrl) : rootUrl(sourceUrl);
  const name = extractCandidateName(result, trade, region);
  if (isGenericCandidateName(name)) return null;
  const phone = extractPhone(text);
  const email = extractEmail(text);
  const address = extractAddressFromText(text, region) || extractLooseAddressFromText(text, region);
  const identity = calculateIdentityConfidence({ name, sourceHost, text, region, possibleWebsite });
  const tradeConfidence = calculateTradeConfidence(text, trade);
  const scoring = scoreCandidate({ directory, possibleWebsite, text, region, phone, email, tradeConfidence });
  const duplicate = detectDuplicate({ name, possibleWebsite, phone, city: address?.city || region.name, postal_code: address?.postal_code || region.postal_codes?.[0] }, existingCompanies, existingCandidates);
  const status = duplicate
    ? "needs_review"
    : scoring.overall_score >= 60 || possibleWebsite
      ? "needs_review"
      : "discovered";

  return {
    name,
    city: address?.city || region.name,
    postal_code: address?.postal_code || region.postal_codes?.[0] || null,
    street: address?.street || null,
    possible_trade: trade.slug,
    possible_website: possibleWebsite,
    phone,
    email,
    source_type: directory ? "directory_hint" : "search_result",
    source_url: sourceUrl,
    discovery_confidence: directory ? 45 : 70,
    identity_confidence: identity,
    trade_confidence: tradeConfidence,
    overall_score: scoring.overall_score,
    status,
    duplicate_of_company_id: duplicate?.kind === "company" ? duplicate.id : null,
    review_reason: reviewReason({ duplicate, possibleWebsite, tradeConfidence, overallScore: scoring.overall_score }),
    suggested_action: duplicate ? "Dublette manuell prüfen" : status === "needs_review" ? "Kandidat fachlich prüfen und als Basis-Eintrag vorbereiten" : "Quelle und Gewerk prüfen",
    raw_evidence: {
      query: result.query,
      rank: result.rank,
      source_host: sourceHost,
      score_reasons: scoring.reasons,
      directory_hint_only: directory,
      search_provider: result.source,
      search_title: result.title,
      search_snippet: result.snippet,
      website_candidate_confidence: possibleWebsite && directory ? "candidate_from_external_source" : possibleWebsite ? "possible_own_domain" : null,
    },
  };
}

async function enrichCandidates(candidates, region, trades, existingCompanies, existingCandidates) {
  const enriched = [];
  let visited = 0;
  let accepted = 0;

  for (const candidate of candidates) {
    let current = candidate;
    if (current.source_type === "directory_hint") {
      const external = await analyzeExternalDirectorySource(current, region, trades);
      current = mergeExternalDirectoryData(current, external, region, trades);
    }

    if (isGenericCandidateName(current.name)) {
      continue;
    }

    if (!current.possible_website || visited >= maxEnrichCandidates) {
      enriched.push(current);
      continue;
    }

    visited += 1;
    const website = await analyzeCompanyWebsite(current.possible_website, current, region, trades);
    if (!website.accepted) {
      const fallbackScore = scoreCandidate({
        directory: true,
        possibleWebsite: current.possible_website,
        text: `${current.name} ${current.city} ${current.postal_code} ${current.street} ${current.phone} ${current.email} ${current.possible_trade}`,
        region,
        phone: current.phone,
        email: current.email,
        tradeConfidence: current.trade_confidence || 40,
      });
      const fallbackCandidate = {
        ...current,
        status: "needs_review",
        overall_score: Math.max(current.overall_score || 0, fallbackScore.overall_score),
        review_reason: website.reason || "Website-Kandidat gefunden, aber noch nicht als eigene Firmenwebsite bestaetigt",
        raw_evidence: {
          ...current.raw_evidence,
          website_analysis: website,
          score_reasons: [...(current.raw_evidence?.score_reasons || []), ...fallbackScore.reasons],
        },
      };
      if (!isGenericCandidateName(fallbackCandidate.name)) enriched.push(fallbackCandidate);
      continue;
    }

    accepted += 1;
    const detectedTrade = normalizeDetectedTrade(detectBestTrade(website.text, trades, current.possible_trade), website.text);
    const phone = current.phone || website.phone;
    const email = current.email || website.email;
    const name = cleanCompanyName(website.company_name || current.name);
    if (isGenericCandidateName(name)) continue;
    const identityConfidence = calculateIdentityConfidence({
      name,
      sourceHost: hostname(current.possible_website),
      text: website.text,
      region,
      possibleWebsite: current.possible_website,
    });
    const tradeConfidence = detectedTrade.confidence;
    const scoring = scoreCandidate({
      directory: false,
      possibleWebsite: current.possible_website,
      text: website.text,
      region,
      phone,
      email,
      tradeConfidence,
      websiteAnalysis: website,
    });
    const duplicate = detectDuplicate(
      { name, possibleWebsite: current.possible_website, phone, city: region.name, postal_code: region.postal_codes?.[0] },
      existingCompanies,
      existingCandidates,
    );
    const fromExternalDirectory = Boolean(current.raw_evidence?.external_directory_analysis);
    const status = duplicate
      ? "needs_review"
      : scoring.overall_score >= 60 || fromExternalDirectory
        ? "needs_review"
        : "discovered";

    enriched.push({
      ...current,
      name,
      phone,
      email,
      street: website.address?.street || candidate.street,
      postal_code: website.address?.postal_code || candidate.postal_code,
      city: website.address?.city || candidate.city,
      possible_trade: detectedTrade.slug || normalizeTradeSlugForStorage(current.possible_trade, website.text),
      source_type: "official_website",
      discovery_confidence: 85,
      identity_confidence: identityConfidence,
      trade_confidence: tradeConfidence,
      overall_score: scoring.overall_score,
      status,
      duplicate_of_company_id: duplicate?.kind === "company" ? duplicate.id : null,
      review_reason: fromExternalDirectory ? "Eigene Website bestaetigt; finale Sichtpruefung empfohlen" : reviewReason({ duplicate, possibleWebsite: current.possible_website, tradeConfidence, overallScore: scoring.overall_score }),
      suggested_action: duplicate ? "Dublette manuell prüfen" : status === "needs_review" ? "Kandidat fachlich prüfen und als Basis-Eintrag vorbereiten" : "Quelle und Gewerk prüfen",
      raw_evidence: {
        ...current.raw_evidence,
        score_reasons: scoring.reasons,
        website_analysis: {
          accepted: website.accepted,
          root_url: website.root_url,
          pages: website.pages,
          matching_features: website.matching_features,
          services: website.services,
          detected_trade: detectedTrade,
          imprint_found: website.imprint_found,
          contact_found: website.contact_found,
        },
      },
    });
  }

  report.enrichment.visited_websites = visited;
  report.enrichment.accepted_official_websites = accepted;
  return dedupeCandidates(enriched
    .filter((candidate) => isAcceptableCandidate(candidate))
    .sort((a, b) => b.overall_score - a.overall_score || a.name.localeCompare(b.name, "de")));
}

async function analyzeExternalDirectorySource(candidate, region, trades) {
  const analysis = {
    ok: false,
    source_url: candidate.source_url,
    source_type: "external_directory",
    confidence: "medium",
    text: `${candidate.raw_evidence?.search_title || ""} ${candidate.raw_evidence?.search_snippet || ""}`,
    company_name: null,
    phone: candidate.phone || null,
    email: candidate.email || null,
    website_candidate: candidate.possible_website || null,
    address: null,
    detected_trade: { slug: candidate.possible_trade, confidence: candidate.trade_confidence || 40, terms: [] },
    score_reasons: [],
    risk_notes: [],
  };

  const fetched = await fetchHtml(candidate.source_url);
  if (fetched.ok) {
    analysis.ok = true;
    analysis.text = clean(stripTags(fetched.html));
  } else {
    analysis.risk_notes.push(`Quelle konnte nicht geladen werden: ${fetched.error}`);
  }

  analysis.company_name = extractCompanyNameFromDirectoryText(analysis.text, candidate.name) || candidate.name;
  analysis.phone = analysis.phone || extractPhone(analysis.text);
  analysis.email = analysis.email || extractEmail(analysis.text);
  analysis.website_candidate = analysis.website_candidate || extractWebsiteCandidate(analysis.text, candidate.source_url);
  analysis.address = extractAddressFromText(analysis.text, region) || extractLooseAddressFromText(analysis.text, region);
  analysis.detected_trade = normalizeDetectedTrade(detectBestTrade(analysis.text, trades, candidate.possible_trade), analysis.text);
  analysis.score_reasons = [
    analysis.company_name ? "Name aus externer Fachseite erkannt" : "",
    analysis.phone ? "Telefon aus externer Fachseite erkannt" : "",
    analysis.email ? "E-Mail aus externer Fachseite erkannt" : "",
    analysis.website_candidate ? "Website-Kandidat aus externer Fachseite erkannt" : "",
    analysis.address?.street ? "Adresse aus externer Fachseite erkannt" : "",
    (analysis.detected_trade?.confidence || 0) >= 75 ? "Gewerk aus Fachbegriffen erkannt" : "",
  ].filter(Boolean);
  return analysis;
}

function mergeExternalDirectoryData(candidate, external, region, trades) {
  const trade = normalizeDetectedTrade(
    external.detected_trade?.confidence >= 75 ? external.detected_trade : detectBestTrade(external.text, trades, candidate.possible_trade),
    external.text,
  );
  const phone = candidate.phone || external.phone;
  const email = candidate.email || external.email;
  const address = external.address || {};
  const possibleWebsite = candidate.possible_website || external.website_candidate;
  const text = [
    external.text,
    external.company_name,
    phone,
    email,
    possibleWebsite,
    address.street,
    address.postal_code,
    address.city,
    trade.slug,
  ].filter(Boolean).join(" ");
  const externalName = cleanCompanyName(external.company_name || "");
  const fallbackName = cleanCompanyName(candidate.name || "");
  const mergedName = !isGenericCandidateName(externalName) ? externalName : fallbackName;
  const identityConfidence = calculateIdentityConfidence({
    name: mergedName,
    sourceHost: hostname(candidate.source_url),
    text,
    region,
    possibleWebsite,
  });
  const scoring = scoreCandidate({
    directory: true,
    possibleWebsite,
    text,
    region,
    phone,
    email,
    tradeConfidence: trade.confidence || candidate.trade_confidence || 40,
  });

  return {
    ...candidate,
    name: mergedName,
    phone,
    email,
    street: candidate.street || address.street || null,
    postal_code: candidate.postal_code || address.postal_code || region.postal_codes?.[0] || null,
    city: candidate.city || address.city || region.name,
    possible_trade: trade.slug || normalizeTradeSlugForStorage(candidate.possible_trade, text),
    possible_website: possibleWebsite,
    source_type: "external_directory",
    discovery_confidence: Math.max(candidate.discovery_confidence || 0, 65),
    identity_confidence: Math.max(candidate.identity_confidence || 0, identityConfidence),
    trade_confidence: Math.max(candidate.trade_confidence || 0, trade.confidence || 40),
    overall_score: Math.max(candidate.overall_score || 0, scoring.overall_score),
    status: "needs_review",
    review_reason: possibleWebsite ? "Website-Kandidat gefunden; eigene Website muss bestaetigt werden" : reviewReason({ possibleWebsite, tradeConfidence: trade.confidence || 40, overallScore: scoring.overall_score }),
    suggested_action: possibleWebsite ? "Website-Kandidat öffnen, Impressum/Kontakt prüfen, dann übernehmen" : "Quelle und Gewerk prüfen",
    raw_evidence: {
      ...candidate.raw_evidence,
      external_directory_analysis: {
        source_url: external.source_url,
        source_type: external.source_type,
        confidence: external.confidence,
        extracted_name: external.company_name,
        extracted_phone: phone,
        extracted_email: email,
        extracted_website_candidate: possibleWebsite,
        extracted_address: address,
        detected_trade: trade,
        score_reasons: [...(candidate.raw_evidence?.score_reasons || []), ...external.score_reasons, ...scoring.reasons],
        risk_notes: external.risk_notes,
      },
      website_candidate_confidence: possibleWebsite ? "candidate_from_external_source" : null,
    },
  };
}

async function analyzeCompanyWebsite(root, candidate, region, trades) {
  const rootUrlValue = rootUrl(root);
  const analysis = {
    accepted: false,
    reason: null,
    root_url: rootUrlValue,
    pages: [],
    matching_features: [],
    text: "",
    company_name: null,
    email: null,
    phone: null,
    address: null,
    services: [],
    imprint_found: false,
    contact_found: false,
  };

  if (!rootUrlValue || isDirectoryLikeHost(hostname(rootUrlValue))) {
    analysis.reason = "Keine eigenstaendige Firmen-Domain";
    return analysis;
  }

  const allowed = await isRobotsAllowed(rootUrlValue);
  if (!allowed) {
    analysis.reason = "robots.txt untersagt Abruf";
    return analysis;
  }

  const home = await fetchHtml(rootUrlValue);
  if (!home.ok) {
    analysis.reason = home.error;
    return analysis;
  }

  const links = extractLinks(home.html, rootUrlValue);
  const pageUrls = [
    rootUrlValue,
    ...links
      .filter((link) => /(impressum|kontakt|contact|leistung|angebot|service|referenz|ueber|über)/i.test(`${link.label} ${link.url}`))
      .map((link) => link.url),
    new URL("/impressum", rootUrlValue).toString(),
    new URL("/kontakt", rootUrlValue).toString(),
    new URL("/leistungen", rootUrlValue).toString(),
  ];

  const seen = new Set();
  const pageTexts = [];
  for (const pageUrl of pageUrls) {
    const normalized = normalizeUrl(pageUrl);
    if (!normalized || seen.has(normalized) || rootUrl(normalized) !== rootUrlValue || seen.size >= maxPagesPerWebsite) continue;
    seen.add(normalized);
    const fetched = normalized === rootUrlValue ? home : await fetchHtml(normalized);
    if (!fetched.ok) continue;
    const text = clean(stripTags(fetched.html));
    const role = pageRole(normalized);
    analysis.pages.push({ url: normalized, role });
    pageTexts.push(text);
    if (role === "impressum") analysis.imprint_found = true;
    if (role === "kontakt") analysis.contact_found = true;
  }

  analysis.text = pageTexts.join("\n").slice(0, 20000);
  analysis.company_name = extractCompanyNameFromText(analysis.text, candidate.name);
  analysis.email = extractEmail(analysis.text);
  analysis.phone = extractPhone(analysis.text);
  analysis.address = extractAddressFromText(analysis.text, region);
  analysis.services = extractServicesFromText(analysis.text, trades);
  analysis.matching_features = websiteMatchingFeatures(candidate, region, analysis);
  const ownedDomain = domainMatchesName(hostname(rootUrlValue), analysis.company_name || candidate.name);
  const strongOnPageIdentity = analysis.matching_features.includes("Firmenname") &&
    (
      analysis.matching_features.includes("Adresse") ||
      analysis.matching_features.includes("Ort") ||
      analysis.matching_features.includes("PLZ")
    ) &&
    (
      analysis.matching_features.includes("Telefon") ||
      analysis.matching_features.includes("Leistungsangebot")
    );
  analysis.accepted = !isGenericCandidateName(analysis.company_name || candidate.name) && analysis.matching_features.includes("Firmenname") && (ownedDomain || strongOnPageIdentity) && (
    analysis.matching_features.includes("Ort") ||
    analysis.matching_features.includes("PLZ") ||
    analysis.matching_features.includes("Adresse") ||
    analysis.matching_features.includes("Telefon") ||
    analysis.matching_features.includes("Leistungsangebot")
  );
  if (!analysis.accepted) analysis.reason = ownedDomain ? "Zu wenige Identitaetsmerkmale auf der Website" : "Domain und Website-Identitaet passen nicht eindeutig genug";
  return analysis;
}

function extractCandidateName(result, trade, region) {
  const rawTitle = clean(result.title);
  const locations = [region.name, ...(region.postal_codes || [])].filter(Boolean);
  const locationPattern = locations.map(escapeRegex).join("|");
  const titleWithoutDirectoryTail = rawTitle
    .replace(/\s*(?:⇒|»|›|->)\s+.*$/g, "")
    .replace(/\s+-\s+(?:Das Örtliche|Das Telefonbuch|Gelbe Seiten|Meinestadt|Branchenbuch|Google|Facebook|Instagram).*$/gi, "")
    .replace(/\s+\|\s+.*$/g, "");
  const inMatch = locationPattern
    ? titleWithoutDirectoryTail.match(new RegExp(`^(.+?)\\s+(?:in|bei|nahe)\\s+(?:${locationPattern})(?:\\b|\\s|$)`, "i"))
    : null;
  const title = clean(inMatch?.[1] || titleWithoutDirectoryTail)
    .replace(new RegExp(`\\b${escapeRegex(trade.name)}\\b`, "ig"), "")
    .replace(new RegExp(`\\b${escapeRegex(region.name)}\\b`, "ig"), "")
    .replace(/\b(Handwerker|Branchenbuch|Firma|Firmen|Kontakt|Impressum|Leistungen|Details ansehen|Jetzt finden|Startseite|Zertifikate)\b/gi, "")
    .replace(/\b(?:in|bei)\s*$/i, "")
    .replace(/^\d+\s+(?:besten|beste)\s+/i, "")
    .replace(/\s+in\s+$/i, "")
    .trim();
  return cleanCompanyName(title).slice(0, 140);
}

function scoreCandidate({ directory, possibleWebsite, text, region, phone, email, tradeConfidence, websiteAnalysis }) {
  let score = 0;
  const reasons = [];
  if (possibleWebsite) add(25, "offizielle Website moeglich");
  if (/impressum|kontakt/.test(normalize(text)) || websiteAnalysis?.imprint_found || websiteAnalysis?.contact_found) add(20, "Impressum/Kontakt-Hinweis");
  if (contains(text, region.name) || region.postal_codes?.some((code) => contains(text, code))) add(15, "Adresse/Region passt");
  if (phone) add(10, "Telefon gefunden");
  if (email) add(10, "E-Mail gefunden");
  if (extractAddressFromText(text, region) || extractLooseAddressFromText(text, region)) add(20, "vollstaendige Adresse gefunden");
  if (tradeConfidence >= 75) add(15, "Gewerk eindeutig erkannt");
  if (!directory) add(5, "hochwertigere Quelle");
  if (directory && possibleWebsite) add(-5, "externe Hinweisquelle mit Website-Kandidat");
  else if (directory) add(-20, "nur Verzeichnisquelle");
  if (!possibleWebsite) add(-30, "keine Website");
  if (tradeConfidence < 60) add(-20, "unsicheres Gewerk");
  return { overall_score: Math.max(0, Math.min(100, score)), reasons };

  function add(points, reason) {
    score += points;
    reasons.push(`${points > 0 ? "+" : ""}${points}: ${reason}`);
  }
}

function calculateIdentityConfidence({ name, sourceHost, text, region, possibleWebsite }) {
  let score = 0;
  if (name && normalize(text).includes(normalize(name).split(" ")[0] || "")) score += 30;
  if (possibleWebsite && name && domainMatchesName(sourceHost, name)) score += 35;
  if (extractPhone(text)) score += 20;
  if (extractAddressFromText(text, region) || extractLooseAddressFromText(text, region)) score += 20;
  if (possibleWebsite || extractEmail(text)) score += 10;
  if (contains(text, region.name)) score += 20;
  if (region.postal_codes?.some((code) => contains(text, code))) score += 15;
  return Math.max(0, Math.min(100, score));
}

function calculateTradeConfidence(text, trade) {
  const normalized = normalize(text);
  const matches = trade.terms.filter((term) => normalized.includes(normalize(term)));
  if (trade.slug === "sanitaer-heizung-klima" && /\b(shk|zvshk|sanitaer heizung klima|sanitar heizung klima|heizungs und lueftungsbau|heizungs lueftungsbau|wasser waerme luft|wasserwaermeluft)\b/i.test(normalized)) {
    return 90;
  }
  if (matches.length >= 2) return 85;
  if (matches.length === 1) return 75;
  return 40;
}

function detectBestTrade(text, trades, fallbackSlug) {
  const ranked = trades
    .map((trade) => ({ slug: trade.slug, confidence: calculateTradeConfidence(text, trade), terms: trade.terms.filter((term) => contains(text, term)) }))
    .sort((a, b) => b.confidence - a.confidence || b.terms.length - a.terms.length);
  const best = ranked[0];
  if (best && best.confidence >= 75) return best;
  return { slug: normalizeTradeSlugForStorage(fallbackSlug, text), confidence: best?.confidence || 40, terms: best?.terms || [] };
}

function normalizeDetectedTrade(detectedTrade, text) {
  return {
    ...detectedTrade,
    slug: normalizeTradeSlugForStorage(detectedTrade?.slug, text),
  };
}

function normalizeTradeSlugForStorage(slug, text = "") {
  if (!slug) return slug;
  if (slug !== "sanitaer-heizung-klima") return storageTradeSlugAliases[slug] || slug;
  const normalized = normalize(text);
  if (/\b(sanitaer|badinstallation|trinkwasser|abwasser|armaturen)\b/.test(normalized) && !/\b(heizung|heizungsbau|lueftung|waermepumpe)\b/.test(normalized)) {
    return "sanitaerinstallation";
  }
  if (/\b(lueftung|lueftungsbau|raumluft|wohnraumlueftung)\b/.test(normalized) && !/\b(heizung|heizungsbau)\b/.test(normalized)) {
    return "lueftung";
  }
  if (/\b(klima|kaelte|kaelteanlagen|klimaanlage)\b/.test(normalized) && !/\b(heizung|heizungsbau)\b/.test(normalized)) {
    return "kaelte-klima";
  }
  if (/\b(waermepumpe|waermepumpen)\b/.test(normalized) && !/\b(heizung|heizungsbau)\b/.test(normalized)) {
    return "waermepumpen";
  }
  return storageTradeSlugAliases[slug] || slug;
}

function detectDuplicate(candidate, companies, candidates) {
  const candidateDomain = hostname(candidate.possibleWebsite || "");
  const candidatePhone = digits(candidate.phone || "");
  const candidateName = normalizeCompanyName(candidate.name);
  const all = [
    ...companies.map((company) => ({ ...company, kind: "company" })),
    ...candidates.map((item) => ({ ...item, kind: "candidate" })),
  ];
  for (const item of all) {
    const itemDomain = hostname(item.website_url || item.possible_website || "");
    const itemPhone = digits(item.phone || "");
    const itemName = normalizeCompanyName(item.name || "");
    if (candidateDomain && itemDomain && candidateDomain === itemDomain) return item;
    if (candidatePhone && itemPhone && candidatePhone === itemPhone) return item;
    if (candidateName && itemName && (candidateName === itemName || candidateName.includes(itemName) || itemName.includes(candidateName))) {
      const samePlace = normalize(item.city || "") === normalize(candidate.city || "") || item.postal_code === candidate.postal_code;
      if (samePlace) return item;
    }
  }
  return null;
}

function reviewReason({ duplicate, possibleWebsite, tradeConfidence, overallScore }) {
  if (duplicate) return "Dublettenverdacht";
  if (!possibleWebsite) return "Keine eigene bestaetigte Website";
  if (tradeConfidence < 75) return "Gewerk unsicher";
  if (overallScore < 90) return "Score unter Auto-Publish-Schwelle";
  return "Sehr hoher Score, finale Sichtpruefung empfohlen";
}

async function calculateCoverage(region, trades, candidates, existingCompanies) {
  return trades.map((trade) => {
    const relatedSlugs = new Set([trade.slug, ...(trade.relatedSlugs || [])]);
    const foundCompanies = existingCompanies.filter((company) => {
      const tradeSlug = Array.isArray(company.trades) ? company.trades[0]?.slug : company.trades?.slug;
      return company.public_visible && relatedSlugs.has(tradeSlug);
    }).length;
    const candidateCompanies = candidates.filter((candidate) => candidate.possible_trade === trade.slug).length;
    const estimatedCompanies = Math.max(trade.estimated, foundCompanies + Math.ceil(candidateCompanies * 0.4));
    const coveragePercent = estimatedCompanies > 0 ? Math.min(100, Math.round((foundCompanies / estimatedCompanies) * 100)) : 0;
    const qualityAverage = candidates.length
      ? Math.round(average(candidates.filter((candidate) => candidate.possible_trade === trade.slug).map((candidate) => candidate.overall_score)))
      : 0;
    return {
      region_slug: region.slug,
      trade_slug: trade.slug,
      trade_name: trade.name,
      found_companies: foundCompanies,
      candidate_companies: candidateCompanies,
      estimated_companies: estimatedCompanies,
      coverage_percent: coveragePercent,
      quality_average: qualityAverage,
    };
  });
}

async function assertLiveTables() {
  if (!supabase) fail("Live-Modus braucht Supabase-Env.");
  for (const table of ["regions", "company_candidates", "discovery_runs", "coverage_snapshots", "review_queue"]) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) fail(`Live-Modus verweigert: Tabelle ${table} fehlt oder ist nicht erreichbar: ${error.message}`);
  }
}

async function persistLive(region, trades, queries, candidates, coverage) {
  const result = { discovery_runs: 0, candidates_inserted: 0, review_items: 0, coverage_snapshots: 0, skipped: [] };
  const { data: dbRegion, error: regionError } = await supabase
    .from("regions")
    .upsert(regionToRow(region), { onConflict: "slug" })
    .select("id")
    .single();
  if (regionError) fail(regionError.message);

  const tradeRows = await loadTradeRows(trades);
  for (const query of queries) {
    const trade = trades.find((item) => query.includes(item.name));
    const tradeId = resolveTradeId(trade, tradeRows);
    const { error } = await supabase.from("discovery_runs").insert({
      region_id: dbRegion.id,
      trade_id: tradeId,
      source_type: "brave_search",
      query,
      status: "completed",
      found_count: candidates.filter((candidate) => candidate.raw_evidence.query === query).length,
      new_candidates: candidates.filter((candidate) => candidate.raw_evidence.query === query && !candidate.duplicate_of_company_id).length,
      cost_estimate: estimatedCostPerQuery,
    });
    if (error) addError(`discovery_runs insert fehlgeschlagen: ${error.message}`);
    else result.discovery_runs += 1;
  }

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("company_candidates")
      .upsert(candidateToRow(candidate), { onConflict: "source_url,name" })
      .select("id")
      .single();
    if (error) {
      addError(`company_candidates upsert fehlgeschlagen: ${error.message}`);
      continue;
    }
    result.candidates_inserted += 1;
    if (candidate.status !== "rejected") {
      const { data: existingReview } = await supabase
        .from("review_queue")
        .select("id")
        .eq("candidate_id", data.id)
        .eq("item_type", "company_candidate")
        .limit(1);
      if (existingReview?.length) continue;
      const { error: reviewError } = await supabase.from("review_queue").insert({
        candidate_id: data.id,
        company_id: candidate.duplicate_of_company_id,
        item_type: "company_candidate",
        reason: candidate.review_reason,
        severity: candidate.duplicate_of_company_id ? "high" : "medium",
        suggested_action: candidate.suggested_action,
        assigned_status: "pending",
        payload: candidate.raw_evidence,
      });
      if (reviewError) addError(`review_queue insert fehlgeschlagen: ${reviewError.message}`);
      else result.review_items += 1;
    }
  }

  for (const snapshot of coverage) {
    const snapshotTrade = trades.find((trade) => trade.slug === snapshot.trade_slug);
    const snapshotTradeId = resolveTradeId(snapshotTrade, tradeRows);
    if (!snapshotTradeId) {
      result.skipped.push(`Coverage ohne Supabase-Gewerk uebersprungen: ${snapshot.trade_slug}`);
      continue;
    }
    const { error } = await supabase.from("coverage_snapshots").insert({
      region_id: dbRegion.id,
      trade_id: snapshotTradeId,
      found_companies: snapshot.found_companies,
      candidate_companies: snapshot.candidate_companies,
      estimated_companies: snapshot.estimated_companies,
      coverage_percent: snapshot.coverage_percent,
      quality_average: snapshot.quality_average,
    });
    if (error) addError(`coverage_snapshots insert fehlgeschlagen: ${error.message}`);
    else result.coverage_snapshots += 1;
  }
  return result;
}

function regionToRow(region) {
  return {
    name: region.name,
    slug: region.slug,
    postal_codes: region.postal_codes || [],
    municipality: region.municipality || null,
    county: region.county || null,
    state: region.state || null,
    country: region.country || "Deutschland",
    latitude: region.latitude || null,
    longitude: region.longitude || null,
    population: region.population || null,
    region_type: region.region_type || "municipality",
  };
}

function resolveTradeId(trade, tradeRows) {
  if (!trade) return null;
  return tradeRows.get(trade.slug)?.id || trade.relatedSlugs?.map((slug) => tradeRows.get(slug)?.id).find(Boolean) || null;
}

function candidateToRow(candidate) {
  return {
    name: candidate.name,
    city: candidate.city,
    postal_code: candidate.postal_code,
    street: candidate.street,
    possible_trade: candidate.possible_trade,
    possible_website: candidate.possible_website,
    phone: candidate.phone,
    email: candidate.email,
    source_type: candidate.source_type,
    source_url: candidate.source_url,
    discovery_confidence: candidate.discovery_confidence,
    identity_confidence: candidate.identity_confidence,
    trade_confidence: candidate.trade_confidence,
    overall_score: candidate.overall_score,
    status: candidate.status,
    duplicate_of_company_id: candidate.duplicate_of_company_id,
    raw_evidence: candidate.raw_evidence,
  };
}

async function loadTradeRows(trades) {
  const slugs = [...new Set(trades.flatMap((trade) => [trade.slug, ...(trade.relatedSlugs || [])]))];
  const { data, error } = await supabase.from("trades").select("id,slug,name").in("slug", slugs);
  if (error) return new Map();
  return new Map((data || []).map((trade) => [trade.slug, trade]));
}

function normalizeRegion(row) {
  return {
    name: row.name,
    slug: row.slug,
    postal_codes: row.postal_codes || [],
    municipality: row.municipality,
    county: row.county,
    state: row.state,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    population: row.population,
    region_type: row.region_type,
  };
}

function isDirectoryLikeHost(host) {
  return searchModule.isDirectoryDomain(host) || /(riedering\.de|rosenheim\.de|landkreis-rosenheim\.de|handwerk-rosenheim\.de|zimmerer-rosenheim\.de|rosenheimsbeste|bauenimlandkreis|gelbeseiten|dasoertliche|dastelefonbuch|meinestadt|cylex|11880|firmenwissen|northdata|unternehmensregister|branchenbuch|gewerbeverzeichnis|ortsdienst|handwerkerportal|gartenbau\.org|bauunternehmen\.org|elektriker\.org|maler\.org|maler-regional|sanitaer\.org|schlosserei\.net|fensterbau\.org|stuckateur-portal|installateur-mv|handwerk\.de|bghm\.de|shk-nrw|dgfnb|mobile\.de|coelnconcept|chatbase|werkenntdenbesten|wlw\.de|my-hammer|starofservice|auskunft\.de|wirsindhandwerk|wasserwaermeluft|mein-elektriker-profi|elektriker-vorort|si-ex\.de|handwerkerservice365|innung|branchenportal|facebook|instagram|linkedin)/i.test(host);
}

function isGenericCandidateName(name) {
  const value = normalize(name);
  if (!value || value.length < 4) return true;
  if (/^(top|beste|start|home|hauptseite|adresse|aus |firmenverzeichnis|innungsbetriebe|innungsmitglieder|mitglieder|betriebe|handwerker|bauunternehmen|elektriker|maler|sanitaer heizung|sanitar heizung|heizungsbau|kontakt|impressum|das unternehmen|unternehmen|profil|zertifikate|uhr|bahn details ansehen|fachhandwerker|fachbetrieb fuer|fachbetrieb fur|fachbetrieb fur|anlagenmechaniker|sanitaer heizungs und klima handwerk|sanitar heizungs und klima handwerk|bghm|alle daten bleiben|ihre experten fuer|ihre experten fur|experte fuer|experte fur|installation von|stadt|landratsamt|bescheinigung|klima schuetzen|bayern rosenheim|entwaesserung und|erdarbeiten|baureinigung|brandschutzkonzepte|dachdeckerei in|die [0-9]+ besten)/i.test(value)) return true;
  if (/\b(rewe|stellenangebote|karriere|notdienst|top 10|bewertungen|branchenbuch|houzz|innung|landratsamt|stadt rosenheim|selbst aktiv werden|wer kennt den besten|jetzt finden|in jetzt finden|in der naehe|in und umgebung|rosenheim und in der naehe|kommen sie vorbei|oeffnungszeiten|route planen|gratis anrufen|angebote von|suchergebnis|startseite sts|leistungen produkte|gesellschaft fuer|verband|zentralverband|datenschutz impressum|matomo|arbeitsschutz|ausbildung)\b/i.test(value)) return true;
  if (/\b(profis\s+\w+\s+20\d{2}|top fachbetriebe|qualifizierter fachbetrieb|unverbindlich anfragen)\b/i.test(value)) return true;
  if (/^[^A-Za-zÄÖÜäöüß0-9]/.test(name)) return true;
  if (/\b(?:rosenheim|chiemgau|landkreis)\b/i.test(value) && !/\b(gmbh|gbr|gdbr|ug|ag|kg|ohg|ek|e k|meisterbetrieb|schreinerei|zimmerei|bau|elektro|maler|metall|dach|spenglerei|fliesen|heizung|sanitaer|sanitär|gartenbau)\b/i.test(value)) return true;
  if (/^(?:in|bei|nahe|fuer|für)\b/i.test(value)) return true;
  if (/[?!]{2,}/.test(name) || /(?:⇒|»|›|->)/.test(name)) return true;
  const tokens = value.split(" ").filter((token) => token.length >= 3);
  return tokens.length < 2 && !/\b(gmbh|gbr|kg|ohg|ek)\b/i.test(name);
}

function isAcceptableCandidate(candidate) {
  if (!candidate?.name || isGenericCandidateName(candidate.name)) return false;
  const ownWebsiteAccepted = candidate.raw_evidence?.website_analysis?.accepted === true && candidate.source_type === "official_website";
  const sourceHost = hostname(candidate.source_url || "");
  if (ownWebsiteAccepted) return true;
  if ((candidate.overall_score || 0) < 45) return false;
  if (isDirectoryLikeHost(sourceHost) && !candidate.possible_website && !candidate.phone && !candidate.street) return false;
  if (candidate.possible_website && isDirectoryLikeHost(hostname(candidate.possible_website))) return false;
  if (candidate.source_type === "search_result" && isDirectoryLikeHost(sourceHost)) return false;
  return true;
}

function dedupeCandidates(candidates) {
  const result = [];
  for (const candidate of candidates) {
    const duplicateIndex = result.findIndex((item) => areLikelySameCandidate(item, candidate));
    if (duplicateIndex === -1) {
      result.push(candidate);
      continue;
    }
    if (candidateQuality(candidate) > candidateQuality(result[duplicateIndex])) {
      result[duplicateIndex] = candidate;
    }
  }
  return result.sort((a, b) => b.overall_score - a.overall_score || a.name.localeCompare(b.name, "de"));
}

function areLikelySameCandidate(a, b) {
  const aDomain = hostname(a.possible_website || "");
  const bDomain = hostname(b.possible_website || "");
  if (aDomain && bDomain && aDomain === bDomain) return true;
  const aPhone = digits(a.phone || "");
  const bPhone = digits(b.phone || "");
  if (aPhone && bPhone && aPhone === bPhone) return true;
  const aName = normalizeCompanyName(a.name || "");
  const bName = normalizeCompanyName(b.name || "");
  if (!aName || !bName) return false;
  const samePlace = normalize(a.city || "") === normalize(b.city || "") || a.postal_code === b.postal_code;
  return samePlace && (aName === bName || aName.includes(bName) || bName.includes(aName));
}

function candidateQuality(candidate) {
  let score = candidate.overall_score || 0;
  if (candidate.source_type === "official_website") score += 25;
  if (candidate.raw_evidence?.website_analysis?.accepted) score += 20;
  if (!isDirectoryLikeHost(hostname(candidate.source_url || ""))) score += 10;
  if (/\b(GmbH|GbR|GdbR|UG|OHG|KG|e\.K\.)\b/i.test(candidate.name || "")) score += 10;
  if (candidate.email) score += 5;
  if (candidate.street) score += 5;
  return score;
}

async function isRobotsAllowed(root) {
  try {
    const robotsUrl = new URL("/robots.txt", root).toString();
    const response = await fetchWithTimeout(robotsUrl, { accept: "text/plain,*/*" });
    if (!response.ok) return true;
    const text = await response.text();
    const genericBlock = text.match(/user-agent:\s*\*[\s\S]*?(?=user-agent:|$)/i)?.[0] || "";
    return !/disallow:\s*\/\s*(?:\n|$)/i.test(genericBlock);
  } catch {
    return true;
  }
}

async function fetchHtml(url) {
  try {
    const response = await fetchWithTimeout(url, { accept: "text/html,application/xhtml+xml" });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return { ok: false, error: "Kein HTML" };
    }
    return { ok: true, html: await response.text() };
  } catch (error) {
    return { ok: false, error: error.message };
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

function extractLinks(html, baseUrl) {
  const links = [];
  for (const match of html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = new URL(decodeHtml(match[1]), baseUrl);
      if (!/^https?:$/.test(url.protocol)) continue;
      links.push({ url: url.toString(), label: clean(stripTags(match[2])) });
    } catch {
      // ignore invalid links
    }
  }
  return links;
}

function pageRole(url) {
  if (/impressum|anbieterkennzeichnung/i.test(url)) return "impressum";
  if (/kontakt|contact/i.test(url)) return "kontakt";
  if (/leistung|angebot|service/i.test(url)) return "leistungen";
  if (/referenz/i.test(url)) return "referenzen";
  if (/ueber|über|about/i.test(url)) return "ueber-uns";
  return "startseite";
}

function websiteMatchingFeatures(candidate, region, analysis) {
  const features = [];
  const text = `${analysis.text} ${analysis.root_url}`;
  const candidateTokens = normalizeCompanyName(candidate.name).split(" ").filter((token) => token.length >= 3);
  const matchedTokens = candidateTokens.filter((token) => contains(text, token));
  if (matchedTokens.length >= Math.min(2, candidateTokens.length) || (analysis.company_name && contains(analysis.company_name, candidate.name))) {
    features.push("Firmenname");
  }
  if (analysis.address?.street) features.push("Adresse");
  if (contains(text, region.name)) features.push("Ort");
  if (region.postal_codes?.some((code) => contains(text, code))) features.push("PLZ");
  if (analysis.phone) features.push("Telefon");
  if (analysis.services.length > 0) features.push("Leistungsangebot");
  return [...new Set(features)];
}

function extractCompanyNameFromText(text, fallback) {
  const fallbackName = cleanCompanyName(fallback || "");
  const fallbackTokens = normalizeCompanyName(fallbackName).split(" ").filter((token) => token.length >= 3);
  if (fallbackName && fallbackTokens.length > 0 && fallbackTokens.every((token) => contains(text, token))) {
    return fallbackName;
  }
  const legal = clean(text).match(/[A-ZÄÖÜ][A-Za-zÄÖÜäöüß0-9 .&-]{2,80}\s(?:GmbH|GbR|GdbR|UG|OHG|KG|e\.K\.)/i)?.[0];
  if (legal && fallbackTokens.some((token) => contains(legal, token))) return cleanCompanyName(legal);
  return fallbackName;
}

function extractAddressFromText(text, region) {
  const postalCode = region.postal_codes?.[0] || "\\d{5}";
  const escapedPostalCode = escapeRegex(postalCode);
  const cleanText = clean(text);
  const postalMatch = cleanText.match(new RegExp(`(${escapedPostalCode})\\s+(${escapeRegex(region.name)})`, "i"));
  if (!postalMatch) return null;
  const beforePostal = cleanText.slice(Math.max(0, postalMatch.index - 120), postalMatch.index);
  const street = pickStreetCandidate(beforePostal);
  if (!street) return null;
  return {
    street,
    postal_code: postalMatch[1],
    city: clean(postalMatch[2]),
  };
}

function extractLooseAddressFromText(text, region) {
  const cleanText = clean(text);
  const postalCode = region.postal_codes?.[0] || "\\d{5}";
  const escapedPostalCode = escapeRegex(postalCode);
  const postalMatch = cleanText.match(new RegExp(`(${escapedPostalCode})\\s+(${escapeRegex(region.name)})`, "i"));
  if (!postalMatch) return null;
  const beforePostal = cleanText.slice(Math.max(0, postalMatch.index - 160), postalMatch.index);
  const street = pickStreetCandidate(beforePostal);
  if (!street) return null;
  return {
    street,
    postal_code: postalMatch[1],
    city: clean(postalMatch[2]),
  };
}

function pickStreetCandidate(beforePostal) {
  const blocked = /kontakt|daten|firma|heizungs|lueftungsbau|lüftungsbau|sanitaer|sanitär|telefon|christian|loferer|betrieb|homepage/i;
  const matches = [...clean(beforePostal).matchAll(/([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.-]+(?:\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.-]+){0,2}\s+\d+[a-zA-Z]?)/g)]
    .map((match) => clean(match[1]))
    .map((value) => {
      const parts = value.split(/\s+/);
      while (parts.length > 2 && blocked.test(parts[0])) parts.shift();
      return parts.join(" ");
    })
    .filter((value) => value && !blocked.test(value.split(/\s+/).slice(0, -2).join(" ")));
  return matches.at(-1) || null;
}

function extractServicesFromText(text, trades) {
  const services = [];
  for (const trade of trades) {
    for (const term of trade.terms) {
      if (contains(text, term)) services.push(term);
    }
  }
  return [...new Set(services)].slice(0, 12);
}

function domainMatchesName(host, name) {
  const hostText = normalize(host);
  const tokens = normalizeCompanyName(name).split(" ").filter((token) => token.length >= 3);
  if (tokens.length === 0) return false;
  return tokens.filter((token) => hostText.includes(token)).length >= Math.min(2, tokens.length);
}

function rootUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname.replace(/^www\./, "")}`;
  } catch {
    return null;
  }
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function cleanCompanyName(value) {
  const cleaned = clean(value)
    .replace(/^(www\.)/i, "")
    .replace(/\b(Google|Branchenbuch|Gelbe Seiten|Das Örtliche|Meinestadt)\b/gi, "")
    .replace(/\s*(?:⇒|»|›|->)\s+.*$/g, "")
    .replace(/\s*[•·]{2,}.*$/g, "")
    .replace(/^[-–—•\s]+/g, "")
    .replace(/^(?:Zertifikate|Uhr|Kommen Sie vorbei|Profil von)\s+/gi, "")
    .replace(/^(?:Über uns|Ueber uns)\s*[–-]\s*/gi, "")
    .replace(/\s+-\s+Startseite.*$/gi, "")
    .replace(/\s+-\s+(?:Maler|Bauunternehmen|Elektroinstallation|Sanitär|Sanitaer|Heizung).*$/gi, "")
    .replace(/\s+(?:Elektrische|Elektroinstallation|Elektrische Installationen|Sanitärinstallateur|Bauunternehmen|Malerarbeiten)\s*$/gi, "")
    .replace(/\s+in\s+\/?[A-ZÄÖÜa-zäöüß-]+$/g, "")
    .replace(/\s+in\s+\d{5}$/g, "")
    .replace(/\b(?:in|bei)\s+(?:jetzt|der naehe|der nähe)\b.*$/gi, "")
    .replace(/\b(?:Details ansehen|Jetzt finden|Gratis anrufen|Route planen|Öffnungszeiten|Oeffnungszeiten)\b.*$/gi, "")
    .replace(/^(?:Startseite|Das Unternehmen|Profil von|Bahn Details ansehen)\s+/gi, "")
    .replace(/^[-–—•\s]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const duplicateTitle = cleaned.match(/^(.{3,80}?)\s+-\s+\1$/i);
  return (duplicateTitle?.[1] || cleaned).trim();
}

function normalizeCompanyName(value) {
  return normalize(value).replace(/\b(gmbh|gbr|gdbr|ug|ag|kg|ohg|ek|co|firma|bauunternehmen)\b/g, " ").replace(/\s+/g, " ").trim();
}

function extractPhone(value) {
  return clean(value).match(/(?:\+49|0)[0-9 ()/.-]{6,}/)?.[0]?.trim() || null;
}

function extractEmail(value) {
  const text = normalizeObfuscatedEmailText(clean(value));
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || null;
}

function normalizeObfuscatedEmailText(value) {
  return String(value || "")
    .replace(/(?:\s|\(|\[)+at(?:\s|\)|\])+/gi, "@")
    .replace(/(?:\s|\(|\[)+dot(?:\s|\)|\])+/gi, ".")
    .replace(/\s*@\s*/g, "@")
    .replace(/\s*\.\s*/g, ".");
}

function extractWebsiteCandidate(value, sourceUrl) {
  const text = clean(value);
  const candidates = [
    ...text.matchAll(/https?:\/\/(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s<>"')\]]*/gi),
    ...text.matchAll(/\bwww\.[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s<>"')\]]*/gi),
  ]
    .map((match) => normalizeWebsiteCandidate(match[0]))
    .filter(Boolean)
    .filter((url) => {
      const host = hostname(url);
      return host && host !== hostname(sourceUrl) && !isDirectoryLikeHost(host) && !/@/.test(url);
    });
  return [...new Set(candidates)][0] || null;
}

function normalizeWebsiteCandidate(value) {
  const cleanValue = String(value || "").trim().replace(/[.,;:]+$/g, "");
  if (!cleanValue || cleanValue.includes("@")) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(cleanValue) ? cleanValue : `https://${cleanValue}`);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function extractCompanyNameFromDirectoryText(text, fallback) {
  const cleanText = clean(text);
  const target = cleanCompanyName(fallback || "");
  const titleMatch = cleanText.match(/([A-ZÄÖÜ][A-Za-zÄÖÜäöüß .&-]{2,100}?(?:Heizungs-?\s*und\s*Lüftungsbau|Heizungs-?\s*und\s*Lueftungsbau|Sanitär|Sanitaer|SHK)[A-Za-zÄÖÜäöüß .&-]*)/i)?.[1];
  if (titleMatch) {
    const value = cleanCompanyName(titleMatch.replace(/\s+Handwerker.*$/i, ""));
    if (!isGenericCandidateName(value)) return value;
  }
  if (target && cleanText.toLowerCase().includes(target.toLowerCase())) return target;
  return target || null;
}

function contains(haystack, needle) {
  return normalize(String(haystack || "")).includes(normalize(String(needle || "")));
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
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

function clean(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function stripTags(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, " ");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function average(values) {
  const cleanValues = values.filter((value) => Number.isFinite(value));
  if (cleanValues.length === 0) return 0;
  return cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length;
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

async function importSearchModule() {
  const files = ["search-provider.ts", "brave-search-provider.ts", "rank-company-website.ts"];
  const dir = path.join(tmpdir(), "gewerkeliste-region-discovery-search");
  await mkdir(dir, { recursive: true });
  for (const file of files) {
    const sourcePath = path.join(process.cwd(), "lib/search", file);
    const source = await readFile(sourcePath, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    await writeFile(path.join(dir, file.replace(/\.ts$/, ".mjs")), compiled);
  }
  const indexPath = path.join(dir, `index-${Date.now()}.mjs`);
  await writeFile(indexPath, [
    'export * from "./search-provider.mjs";',
    'export * from "./brave-search-provider.mjs";',
    'export * from "./rank-company-website.mjs";',
  ].join("\n"));
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

function finish() {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
