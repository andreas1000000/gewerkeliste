#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args["dry-run"]);
const minAutoScore = Number(args["min-auto-score"] || 70);
const minReviewScore = Number(args["min-review-score"] || 50);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !serviceRoleKey) fail("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY muessen gesetzt sein.");

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

await assertTables();

const [companies, trades, initialSynonyms, sources] = await Promise.all([
  loadAll("companies", "id,name,description,email,phone,website_url,street,city,postal_code,public_visible,claim_status,verified,trade_id,trades(id,name,slug)", { public_visible: "eq.true" }),
  loadAll("trades", "id,name,slug"),
  loadAll("trade_synonyms", "trade_id,synonym,weight,source"),
  loadAll("company_sources", "company_id,source_type,source_url,title,snippet,content"),
]);

const tradeBySlug = new Map(trades.map((trade) => [trade.slug, trade]));
const tradeById = new Map(trades.map((trade) => [trade.id, trade]));
const sourceByCompanyId = groupBy(sources, "company_id");
const syncedSynonyms = await syncLocalSynonyms(tradeBySlug, initialSynonyms);
const synonymMap = buildSynonymMap(trades, syncedSynonyms);
const report = {
  ok: true,
  dry_run: dryRun,
  companies_analyzed: companies.length,
  mappings_created: 0,
  mappings_updated: 0,
  review_cases: 0,
  ignored_under_threshold: 0,
  top_mappings: [],
  top_review_cases: [],
  trades_without_companies: [],
  companies_without_trade: [],
  errors: [],
};

const mappingCounts = new Map();

for (const company of companies) {
  const textProfile = textForCompany(company, sourceByCompanyId.get(company.id) || []);
  const matches = scoreCompany(company, textProfile, synonymMap, tradeById);
  const autoMatches = matches.filter((match) => match.score >= minAutoScore);
  const reviewMatches = matches.filter((match) => match.score >= minReviewScore && match.score < minAutoScore);

  if (autoMatches.length === 0) report.companies_without_trade.push(company.name);

  for (const match of autoMatches) {
    mappingCounts.set(match.trade.slug, (mappingCounts.get(match.trade.slug) || 0) + 1);
    report.top_mappings.push({
      company: company.name,
      trade: match.trade.name,
      score: match.score,
      evidence: match.evidence,
    });

    if (dryRun) {
      report.mappings_created += 1;
      continue;
    }

    const { data, error } = await supabase
      .from("company_trades")
      .upsert(
        {
          company_id: company.id,
          trade_id: match.trade.id,
          confidence_score: match.score,
          source: match.source,
          evidence: match.evidence,
        },
        { onConflict: "company_id,trade_id" },
      )
      .select("created_at,updated_at")
      .single();

    if (error) {
      addError(`${company.name} -> ${match.trade.name}: ${error.message}`);
      continue;
    }

    if (data?.created_at === data?.updated_at) report.mappings_created += 1;
    else report.mappings_updated += 1;
  }

  for (const match of reviewMatches) {
    report.top_review_cases.push({
      company: company.name,
      trade: match.trade.name,
      score: match.score,
      evidence: match.evidence,
    });

    if (dryRun) {
      report.review_cases += 1;
      continue;
    }

    const { error } = await supabase.from("company_trade_reviews").upsert(
      {
        company_id: company.id,
        trade_id: match.trade.id,
        confidence_score: match.score,
        source: match.source,
        evidence: match.evidence,
        status: "pending",
      },
      { onConflict: "company_id,trade_id" },
    );
    if (error) addError(`${company.name} -> Review ${match.trade.name}: ${error.message}`);
    else report.review_cases += 1;
  }

  report.ignored_under_threshold += matches.filter((match) => match.score < minReviewScore).length;
}

for (const trade of trades) {
  if (!mappingCounts.has(trade.slug)) report.trades_without_companies.push(trade.slug);
}

report.top_mappings = report.top_mappings.sort((a, b) => b.score - a.score || a.company.localeCompare(b.company, "de")).slice(0, 20);
report.top_review_cases = report.top_review_cases.sort((a, b) => b.score - a.score || a.company.localeCompare(b.company, "de")).slice(0, 20);
report.trades_without_companies = report.trades_without_companies.slice(0, 80);
report.companies_without_trade = report.companies_without_trade.slice(0, 80);

console.log(JSON.stringify(report, null, 2));

async function assertTables() {
  for (const table of ["companies", "trades", "company_trades", "trade_synonyms", "company_sources", "company_trade_reviews"]) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      fail(`Tabelle ${table} ist nicht verfuegbar. Bitte Migration 20260614172000_company_trade_mapping.sql anwenden. Supabase sagt: ${error.message}`);
    }
  }
}

async function loadAll(table, select, filters = {}) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + pageSize - 1);
    for (const [column, expression] of Object.entries(filters)) {
      const [operator, value] = String(expression).split(".");
      if (operator === "eq") query = query.eq(column, value);
    }
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
    from += pageSize;
  }
}

function buildSynonymMap(trades, existingSynonyms) {
  const map = new Map();
  for (const trade of trades) {
    map.set(trade.id, {
      trade,
      terms: [
        { term: trade.name, weight: 85, source: "trade-name" },
        { term: trade.slug.replace(/-/g, " "), weight: 80, source: "trade-slug" },
      ],
    });
  }

  for (const row of existingSynonyms) {
    const entry = map.get(row.trade_id);
    if (entry) entry.terms.push({ term: row.synonym, weight: row.weight || 70, source: row.source || "trade_synonyms" });
  }

  for (const [slug, terms] of Object.entries(localSynonyms())) {
    const trade = trades.find((item) => item.slug === slug);
    if (!trade) continue;
    const entry = map.get(trade.id);
    for (const item of terms) entry.terms.push({ term: item.term, weight: item.weight, source: "local-synonyms" });
  }

  return map;
}

async function syncLocalSynonyms(tradeBySlug, existingSynonyms) {
  const rows = [...existingSynonyms];
  const existingKeys = new Set(existingSynonyms.map((row) => `${row.trade_id}|${normalize(row.synonym)}`));
  const upserts = [];

  for (const [slug, terms] of Object.entries(localSynonyms())) {
    const trade = tradeBySlug.get(slug);
    if (!trade) continue;
    for (const item of terms) {
      const key = `${trade.id}|${normalize(item.term)}`;
      if (existingKeys.has(key)) continue;
      const row = { trade_id: trade.id, synonym: item.term, weight: item.weight, source: "local-synonyms" };
      rows.push(row);
      upserts.push(row);
      existingKeys.add(key);
    }
  }

  if (!dryRun && upserts.length > 0) {
    const { error } = await supabase.from("trade_synonyms").upsert(upserts, { onConflict: "trade_id,synonym" });
    if (error) addError(`Synonyme konnten nicht synchronisiert werden: ${error.message}`);
  }

  return rows;
}

function scoreCompany(company, textProfile, synonymMap, tradeById) {
  const matches = [];
  const primaryTrade = tradeById.get(company.trade_id);

  for (const { trade, terms } of synonymMap.values()) {
    let best = null;

    if (primaryTrade?.id === trade.id) {
      best = scoreCandidate(best, 92, "bisheriges Hauptgewerk", "existing-primary-trade");
    }

    for (const item of terms) {
      const term = normalize(item.term);
      if (!term || term.length < 3) continue;

      if (containsTerm(textProfile.name, term)) best = scoreCandidate(best, Math.max(item.weight, 100), `Firmenname: ${item.term}`, item.source);
      else if (containsTerm(textProfile.source, term)) best = scoreCandidate(best, Math.max(item.weight, 85), `Quelle/Leistungsseite: ${item.term}`, item.source);
      else if (containsTerm(textProfile.description, term)) best = scoreCandidate(best, Math.max(item.weight, 85), `Beschreibung: ${item.term}`, item.source);
      else if (containsTerm(textProfile.website, term)) best = scoreCandidate(best, Math.max(item.weight, 70), `Website/Domain: ${item.term}`, item.source);
      else if (containsTerm(textProfile.all, term)) best = scoreCandidate(best, item.weight, `Textsignal: ${item.term}`, item.source);
    }

    if (best) matches.push({ trade, ...best });
  }

  return suppressOverbroadMatches(matches).sort((a, b) => b.score - a.score);
}

function suppressOverbroadMatches(matches) {
  const strong = matches.filter((match) => match.score >= 85);
  if (strong.length > 0) return matches.filter((match) => match.score >= 70);
  return matches.filter((match) => match.score >= 50);
}

function scoreCandidate(current, score, evidence, source) {
  if (!current || score > current.score) return { score, evidence, source };
  return current;
}

function textForCompany(company, sources) {
  const name = normalize(company.name);
  const description = normalize(company.description);
  const website = normalize([company.website_url, domainWords(company.website_url)].filter(Boolean).join(" "));
  const source = normalize(
    sources
      .map((item) => [item.source_type, item.source_url, item.title, item.snippet, item.content].filter(Boolean).join(" "))
      .join(" "),
  );
  const all = [name, description, website, source].join(" ");
  return { name, description, website, source, all };
}

function containsTerm(text, term) {
  if (!text || !term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function domainWords(url) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "").replace(/\.[a-z]{2,}$/i, "").replace(/[-_.]+/g, " ");
  } catch {
    return String(url).replace(/[-_.:/]+/g, " ");
  }
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

function groupBy(items, key) {
  const map = new Map();
  for (const item of items) {
    const value = item[key];
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item);
  }
  return map;
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

function addError(message) {
  report.ok = false;
  if (report.errors.length < 100) report.errors.push(message);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function localSynonyms() {
  return {
  zimmererarbeiten: [
    { term: "zimmerer", weight: 100 },
    { term: "zimmerei", weight: 100 },
    { term: "holzbau", weight: 100 },
    { term: "holzrahmenbau", weight: 90 },
    { term: "dachstuhl", weight: 90 },
    { term: "dachstuehle", weight: 90 },
    { term: "carport", weight: 75 },
    { term: "holzfassade", weight: 80 },
    { term: "holzbauarbeiten", weight: 90 },
    { term: "abbund", weight: 85 },
    { term: "pergola", weight: 70 },
    { term: "dachkonstruktion", weight: 85 },
  ],
  holzbau: [
    { term: "holzbau", weight: 100 },
    { term: "holzrahmenbau", weight: 90 },
    { term: "holzbauarbeiten", weight: 90 },
    { term: "dachstuhl", weight: 85 },
    { term: "abbund", weight: 85 },
  ],
  dachdecker: [
    { term: "dachdecker", weight: 100 },
    { term: "bedachungen", weight: 90 },
    { term: "dachsanierung", weight: 90 },
    { term: "flachdach", weight: 85 },
    { term: "steildach", weight: 85 },
    { term: "dachabdichtung", weight: 85 },
    { term: "dachfenster", weight: 80 },
  ],
  "spengler-klempner": [
    { term: "spengler", weight: 100 },
    { term: "blechner", weight: 90 },
    { term: "klempner", weight: 90 },
    { term: "dachrinne", weight: 80 },
    { term: "blechdach", weight: 85 },
    { term: "blechfassade", weight: 85 },
    { term: "kaminverkleidung", weight: 80 },
  ],
  pflasterbau: [
    { term: "pflasterbau", weight: 100 },
    { term: "pflasterarbeiten", weight: 100 },
    { term: "natursteinpflaster", weight: 90 },
    { term: "aussenanlagen", weight: 75 },
    { term: "einfahrten", weight: 75 },
    { term: "terrassen", weight: 70 },
    { term: "wege", weight: 70 },
    { term: "hofeinfahrten", weight: 80 },
  ],
  elektroinstallation: [
    { term: "elektro", weight: 90 },
    { term: "elektriker", weight: 100 },
    { term: "elektrotechnik", weight: 100 },
    { term: "elektroinstallation", weight: 100 },
  ],
  sanitaer: [
    { term: "sanitaer", weight: 100 },
    { term: "sanitär", weight: 100 },
    { term: "installateur", weight: 85 },
    { term: "trinkwasser", weight: 75 },
  ],
  heizung: [
    { term: "heizung", weight: 100 },
    { term: "heizungsbau", weight: 100 },
    { term: "waermepumpe", weight: 80 },
    { term: "wärmepumpe", weight: 80 },
    { term: "fussbodenheizung", weight: 80 },
  ],
  malerarbeiten: [
    { term: "maler", weight: 100 },
    { term: "malerbetrieb", weight: 100 },
    { term: "lackierer", weight: 80 },
    { term: "beschichtung", weight: 70 },
  ],
  fliesenarbeiten: [
    { term: "fliesen", weight: 100 },
    { term: "fliesenleger", weight: 100 },
    { term: "plattenleger", weight: 85 },
  ],
  metallbau: [
    { term: "metallbau", weight: 100 },
    { term: "schlosserei", weight: 95 },
    { term: "schmiede", weight: 85 },
    { term: "stahlbau", weight: 85 },
  ],
  "garten-landschaftsbau": [
    { term: "garten und landschaftsbau", weight: 100 },
    { term: "galabau", weight: 100 },
    { term: "landschaftsbau", weight: 95 },
    { term: "gartenbau", weight: 85 },
  ],
  bauwerksabdichtung: [
    { term: "bauwerksabdichtung", weight: 100 },
    { term: "bautenschutz", weight: 90 },
    { term: "abdichtung", weight: 80 },
    { term: "kellerabdichtung", weight: 90 },
  ],
  schreinerarbeiten: [
    { term: "schreiner", weight: 100 },
    { term: "schreinerei", weight: 100 },
    { term: "tischler", weight: 95 },
    { term: "holzverarbeitung", weight: 85 },
  ],
  erdarbeiten: [
    { term: "erdbau", weight: 100 },
    { term: "erdarbeiten", weight: 100 },
    { term: "baggerarbeiten", weight: 85 },
    { term: "aushub", weight: 75 },
  ],
  kanalbau: [
    { term: "kanalbau", weight: 100 },
    { term: "entwaesserung", weight: 80 },
    { term: "entwässerung", weight: 80 },
    { term: "kanal", weight: 70 },
  ],
  ofenbau: [{ term: "ofenbau", weight: 100 }, { term: "kachelofen", weight: 95 }, { term: "hafnerei", weight: 95 }],
  "kaelte-klima": [{ term: "kaelte", weight: 90 }, { term: "kälte", weight: 90 }, { term: "klima", weight: 80 }, { term: "klimatechnik", weight: 95 }],
  };
}
