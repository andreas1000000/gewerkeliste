#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { requireLiveConfirmation, requireSupabaseSafety } from "./safety-gates.mjs";

loadDotEnv(".env.local");

const args = parseArgs(process.argv.slice(2));
const limit = Number(args.limit || args.max_companies || 50);
const live = Boolean(args.live);
const timeoutMs = Number(args["timeout-ms"] || 9000);
const maxPages = Math.min(Number(args["max-pages"] || 6), 8);
const today = new Date().toISOString().slice(0, 10);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !serviceRoleKey) fail("Supabase ENV fehlt.");
if (live) {
  requireLiveConfirmation({
    args,
    action: "enrich-existing-profiles-live",
    reason: "Profil-Enrichment schreibt lokale Firmenbeschreibungen, Quellen, Gewerke und Review Items.",
  });
}
requireSupabaseSafety({ args, url: supabaseUrl, live, action: "enrich-existing-profiles-live" });

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const report = {
  mode: live ? "live" : "dry_run",
  target: isLocalUrl(supabaseUrl) ? "local" : "remote",
  checked_companies: 0,
  visited_websites: 0,
  reachable_websites: 0,
  enriched_profiles: 0,
  review_items: 0,
  skipped: 0,
  external_apis: 0,
  emails_sent: 0,
  verifications_set: 0,
  google_maps_places: 0,
  entries: [],
  serviceStats: new Map(),
  errors: [],
};

const trades = await loadTrades();
const companies = await loadBatch();

for (const company of companies) {
  report.checked_companies += 1;
  const entry = await enrichCompany(company);
  report.entries.push(entry);
}

await writeReports();
printSummary();

async function loadBatch() {
  let query = supabase
    .from("companies")
    .select("*, trades(id,name,slug)")
    .not("website_url", "is", null)
    .neq("website_url", "")
    .eq("verified", false)
    .limit(Math.max(1, limit * 4));

  const { data, error } = await query;
  if (error) fail(`companies konnten nicht geladen werden: ${error.message}`);

  const preferredCities = ["Rosenheim", "Bad Aibling", "Kolbermoor", "Raubling", "Prien am Chiemsee", "Prien", "Wasserburg", "Wasserburg am Inn"];
  return (data || [])
    .filter((company) => company.claim_status !== "claimed")
    .sort((a, b) => {
      const ac = preferredCities.includes(a.city || "") ? 0 : 1;
      const bc = preferredCities.includes(b.city || "") ? 0 : 1;
      const ad = isGenericDescription(a.description) ? 0 : 1;
      const bd = isGenericDescription(b.description) ? 0 : 1;
      return ac - bc || ad - bd || String(a.name || "").localeCompare(String(b.name || ""));
    })
    .slice(0, limit);
}

async function enrichCompany(company) {
  const baseUrl = normalizeWebsite(company.website_url);
  const result = {
    id: company.id,
    name: company.name,
    city: company.city,
    website: baseUrl,
    status: "skipped",
    detected_trades: [],
    detected_services: [],
    changed_fields: [],
    source_urls: [],
    confidence: 0,
    notes: [],
  };

  if (!baseUrl) {
    report.skipped += 1;
    result.notes.push("ungueltige Website-URL");
    return result;
  }

  report.visited_websites += 1;
  const pages = await fetchCompanyPages(baseUrl);
  result.source_urls = pages.filter((page) => page.ok).map((page) => page.url);
  if (!pages.some((page) => page.ok)) {
    report.skipped += 1;
    result.notes.push("Website nicht erreichbar");
    return result;
  }

  report.reachable_websites += 1;
  const text = pages.filter((page) => page.ok).map((page) => page.text).join("\n");
  const detected = detectBusinessSignals(text, company);
  result.detected_trades = detected.trades;
  result.detected_services = detected.services;
  result.confidence = detected.confidence;

  for (const service of detected.services) {
    const key = detected.primaryTrade || company.trades?.slug || company.trades?.name || "unknown";
    if (!report.serviceStats.has(key)) report.serviceStats.set(key, new Map());
    const bucket = report.serviceStats.get(key);
    bucket.set(service, (bucket.get(service) || 0) + 1);
  }

  if (detected.services.length === 0 && detected.trades.length === 0) {
    report.skipped += 1;
    result.status = "review";
    result.notes.push("keine eindeutigen Leistungen erkannt");
    await insertReviewItem(company, result, "Keine eindeutigen Leistungen auf Website erkannt");
    return result;
  }

  const updates = {};
  if (isGenericDescription(company.description) && detected.services.length >= 2) {
    updates.description = buildDescription(company, detected);
  }
  if (!company.public_email && !company.email && detected.email) updates.public_email = detected.email;
  if (!company.public_phone && !company.phone && detected.phone) updates.public_phone = detected.phone;

  const proposedTradeSlugs = detected.trades
    .filter((trade) => trade.confidence >= 75)
    .map((trade) => trade.slug)
    .filter(Boolean);

  if (live) {
    if (Object.keys(updates).length) {
      const { error } = await supabase.from("companies").update({ ...updates, enrichment_status: "enriched", enrichment_score: detected.confidence, last_enriched_at: new Date().toISOString() }).eq("id", company.id);
      if (error) result.notes.push(`companies update: ${error.message}`);
      else result.changed_fields.push(...Object.keys(updates), "enrichment_status", "enrichment_score", "last_enriched_at");
    }

    for (const page of pages.filter((page) => page.ok).slice(0, 5)) {
      const { error } = await supabase.from("company_sources").insert({
        company_id: company.id,
        source_type: "official_company_website",
        source_url: page.url,
        title: page.title || "Firmenwebsite",
        snippet: page.text.slice(0, 500),
        content: null,
        source_name: "Firmenwebsite",
        confidence_score: detected.confidence,
        extracted_at: new Date().toISOString(),
        raw_snippet: page.text.slice(0, 500),
      });
      if (error) result.notes.push(`company_sources insert: ${error.message}`);
    }

    for (const slug of proposedTradeSlugs) {
      const trade = trades.bySlug.get(slug);
      if (!trade) continue;
      const evidence = detected.services.slice(0, 8).join(", ");
      const { error } = await supabase.from("company_trades").upsert(
        {
          company_id: company.id,
          trade_id: trade.id,
          confidence_score: detected.confidence,
          source: "profile-enrichment-official-website",
          evidence,
          status: "agent_suggested",
          visibility_level: "basis_public",
        },
        { onConflict: "company_id,trade_id" },
      );
      if (error) result.notes.push(`company_trades upsert: ${error.message}`);
    }

    await insertReviewItem(company, result, "Leistungsdaten aus Firmenwebsite zur Sichtpruefung");
  }

  if (Object.keys(updates).length || proposedTradeSlugs.length) {
    report.enriched_profiles += 1;
    result.status = "enriched";
  } else {
    report.skipped += 1;
    result.status = "source_only";
  }

  return result;
}

async function fetchCompanyPages(baseUrl) {
  const root = new URL(baseUrl);
  const candidates = [
    root.href,
    new URL("/leistungen", root).href,
    new URL("/service", root).href,
    new URL("/gewerke", root).href,
    new URL("/angebot", root).href,
    new URL("/unternehmen", root).href,
    new URL("/referenzen", root).href,
    new URL("/projekte", root).href,
    new URL("/bauleistungen", root).href,
    new URL("/kontakt", root).href,
    new URL("/impressum", root).href,
  ];
  const unique = [...new Set(candidates)].slice(0, maxPages);
  const pages = [];
  for (const url of unique) {
    pages.push(await fetchPage(url));
  }
  return pages;
}

async function fetchPage(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.includes("text/html")) return { url, ok: false, error: `HTTP ${response.status}` };
    const html = await response.text();
    return { url, ok: true, title: extractTitle(html), text: htmlToText(html) };
  } catch (error) {
    return { url, ok: false, error: error.message };
  }
}

function detectBusinessSignals(text, company) {
  const normalized = normalizeText(text);
  const services = [];
  const tradesFound = new Map();
  for (const item of getServiceTerms()) {
    if (item.pattern.test(normalized)) {
      services.push(item.label);
      const current = tradesFound.get(item.trade) || { slug: item.trade, confidence: 0, evidence: [] };
      current.confidence = Math.max(current.confidence, item.weight);
      current.evidence.push(item.label);
      tradesFound.set(item.trade, current);
    }
  }
  const tradeArray = [...tradesFound.values()].sort((a, b) => b.confidence - a.confidence);
  const cityHit = company.city && normalized.includes(normalizeText(company.city));
  const nameHit = company.name && company.name.split(/\s+/).some((part) => part.length > 4 && normalized.includes(normalizeText(part)));
  const confidence = Math.min(100, 45 + Math.min(35, services.length * 5) + (cityHit ? 10 : 0) + (nameHit ? 10 : 0));
  return {
    services: [...new Set(services)].slice(0, 14),
    trades: tradeArray.slice(0, 5),
    primaryTrade: tradeArray[0]?.slug || company.trades?.slug,
    confidence,
    email: extractBusinessEmail(text),
    phone: extractBusinessPhone(text),
  };
}

async function insertReviewItem(company, result, reason) {
  if (!live) return;
  const { error } = await supabase.from("agent_review_items").insert({
    agent_id: "profile-enrichment-agent",
    review_type: "company_profile_enrichment",
    title: `Profilanreicherung pruefen: ${company.name}`,
    description: reason,
    status: "open",
    severity: result.status === "enriched" ? "low" : "medium",
    company_id: company.id,
    source_url: result.website,
    source_type: "official_company_website",
    confidence_score: result.confidence,
    payload: {
      company_name: company.name,
      city: company.city,
      website: result.website,
      detected_services: result.detected_services,
      detected_trades: result.detected_trades,
      changed_fields: result.changed_fields,
      note: "Internes Review Item. Keine Verifizierung, keine E-Mail, keine automatische Bestaetigung.",
    },
  });
  if (!error) report.review_items += 1;
  else result.notes.push(`agent_review_items insert: ${error.message}`);
}

function buildDescription(company, detected) {
  const trade = trades.bySlug.get(detected.primaryTrade)?.name || company.trades?.name || "Baugewerbe";
  const listed = detected.services.slice(0, 3).join(", ");
  return `${company.name} ist ein Betrieb im Bereich ${trade} in ${company.city || "der Region"}. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen ${listed} beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist noch nicht vom Betrieb bestätigt. Korrektur oder Löschung kann jederzeit angefragt werden.`;
}

async function loadTrades() {
  const { data, error } = await supabase.from("trades").select("id,name,slug").limit(1000);
  if (error) fail(`trades konnten nicht geladen werden: ${error.message}`);
  return { bySlug: new Map((data || []).map((trade) => [trade.slug, trade])) };
}

async function writeReports() {
  await mkdir("reports", { recursive: true });
  const lines = [];
  lines.push(`# Company Profile Enrichment Sprint - ${today}`);
  lines.push("");
  lines.push(`- Modus: ${report.mode}`);
  lines.push(`- Ziel: ${report.target}`);
  lines.push(`- Gepruefte Firmen: ${report.checked_companies}`);
  lines.push(`- Besuchte Websites: ${report.visited_websites}`);
  lines.push(`- Erfolgreich besuchte Websites: ${report.reachable_websites}`);
  lines.push(`- Angereicherte Profile: ${report.enriched_profiles}`);
  lines.push(`- Review Items: ${report.review_items}`);
  lines.push(`- Uebersprungene Firmen: ${report.skipped}`);
  lines.push(`- E-Mails gesendet: 0`);
  lines.push(`- Verifizierungen gesetzt: 0`);
  lines.push(`- Google Maps/Places: 0`);
  lines.push(`- Externe APIs: 0`);
  lines.push("");
  lines.push("## Top angereicherte Profile");
  for (const entry of report.entries.filter((item) => item.status === "enriched").slice(0, 30)) {
    lines.push("");
    lines.push(`### ${entry.name}`);
    lines.push(`- Website: ${entry.website}`);
    lines.push(`- Ort: ${entry.city || "unknown"}`);
    lines.push(`- Gewerke: ${entry.detected_trades.map((trade) => `${trade.slug} (${trade.confidence})`).join(", ") || "keine eindeutige Zuordnung"}`);
    lines.push(`- Leistungen: ${entry.detected_services.join(", ") || "keine eindeutigen Leistungen"}`);
    lines.push(`- Geaenderte Felder: ${entry.changed_fields.join(", ") || "keine"}`);
    lines.push(`- Confidence: ${entry.confidence}`);
  }
  lines.push("");
  lines.push("## Risiken/Unsicherheiten");
  lines.push("- Angereicherte Daten bleiben unbestaetigt.");
  lines.push("- Es wurden keine Bewertungen, Logos, Bilder oder langen Website-Texte uebernommen.");
  lines.push("- Dedizierte Leistungstabellen fehlen noch; Leistungsdaten liegen derzeit in Beschreibung, Quellen und Review Items.");
  await writeFile(`reports/company-profile-enrichment-${today}.md`, lines.join("\n"));

  const taxonomy = [];
  taxonomy.push(`# Trade Service Taxonomy Suggestions - ${today}`);
  taxonomy.push("");
  taxonomy.push("Aus lokal besuchten Firmenwebsites abgeleitete Leistungsbegriffe. Keine langen Textpassagen, keine Bewertungen, keine Qualitaetsbehauptungen.");
  for (const [trade, bucket] of [...report.serviceStats.entries()].sort()) {
    taxonomy.push("");
    taxonomy.push(`## ${trade}`);
    for (const [service, count] of [...bucket.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
      taxonomy.push(`- ${service} (${count})`);
    }
  }
  await writeFile(`reports/trade-service-taxonomy-suggestions-${today}.md`, taxonomy.join("\n"));
}

function printSummary() {
  console.log(JSON.stringify({
    checked_companies: report.checked_companies,
    visited_websites: report.visited_websites,
    reachable_websites: report.reachable_websites,
    enriched_profiles: report.enriched_profiles,
    review_items: report.review_items,
    skipped: report.skipped,
    emails_sent: 0,
    verifications_set: 0,
    google_maps_places: 0,
    external_apis: 0,
  }, null, 2));
}

function normalizeWebsite(value) {
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).href;
  } catch {
    return null;
  }
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 25000);
}

function extractTitle(html) {
  return (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

function extractBusinessEmail(text) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function extractBusinessPhone(text) {
  const match = text.match(/(?:\+49|0)\s?[1-9][0-9\s()/.-]{6,}/);
  if (!match) return null;
  const value = match[0].replace(/\s+/g, " ").trim();
  if (/^0\s?1[5-7]/.test(value)) return null;
  return value;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function isGenericDescription(value) {
  const text = String(value || "").trim();
  return !text || text.length < 220 || /oeffentlich|öffentlich|basis-eintrag|unbestätigt|unbestaetigt|korrektur oder löschung/i.test(text);
}

function isLocalUrl(value) {
  try {
    const url = new URL(value);
    return ["127.0.0.1", "localhost", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function loadDotEnv(file) {
  if (!existsSync(file)) return;
  const content = readFileSync(file, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function getServiceTerms() {
  return [
    { label: "Werkzeugbau", trade: "metallbau", weight: 85, pattern: /werkzeugbau/ },
    { label: "Vorrichtungsbau", trade: "metallbau", weight: 85, pattern: /vorrichtungsbau/ },
    { label: "Metallbau", trade: "metallbau", weight: 85, pattern: /metallbau|stahlbau|schlosserei|schweiß|schweiss/ },
    { label: "Feinwerkmechanik", trade: "metallbau", weight: 80, pattern: /feinwerkmechanik|cnc|zerspanung|fraesen|fräsen|drehen/ },
    { label: "Maurerarbeiten", trade: "maurerarbeiten", weight: 85, pattern: /maurer|mauerwerk|mauerarbeiten|rohbau/ },
    { label: "Betonarbeiten", trade: "betonbau", weight: 85, pattern: /betonarbeiten|betonbau|stahlbeton|betonieren/ },
    { label: "Umbau", trade: "bauunternehmen", weight: 75, pattern: /umbau|anbau|ausbau/ },
    { label: "Sanierung", trade: "bauunternehmen", weight: 75, pattern: /sanierung|modernisierung|instandsetzung/ },
    { label: "Erdarbeiten", trade: "erdarbeiten", weight: 85, pattern: /erdarbeiten|aushub|baggerarbeiten|tiefbau/ },
    { label: "Pflasterarbeiten", trade: "pflasterbau", weight: 85, pattern: /pflaster|naturstein|einfahrt|terrasse|wege/ },
    { label: "Garten- und Landschaftsbau", trade: "garten-und-landschaftsbau", weight: 85, pattern: /gartenbau|landschaftsbau|aussenanlagen|außenanlagen|galabau/ },
    { label: "Dachsanierung", trade: "dachdeckerarbeiten", weight: 85, pattern: /dachsanierung|dacheindeckung|steildach|flachdach|bedachung/ },
    { label: "Spenglerarbeiten", trade: "spenglerarbeiten", weight: 85, pattern: /spengler|blechner|dachrinne|blechdach|blechfassade/ },
    { label: "Zimmererarbeiten", trade: "zimmererarbeiten", weight: 85, pattern: /zimmerei|zimmerer|holzbau|dachstuhl|abbund|holzrahmenbau/ },
    { label: "Schreinerarbeiten", trade: "schreinerarbeiten", weight: 85, pattern: /schreinerei|schreiner|moebel|möbel|innenausbau|tueren|türen/ },
    { label: "Elektroinstallation", trade: "elektroinstallation", weight: 90, pattern: /elektroinstallation|elektrotechnik|elektriker|elektroanlagen/ },
    { label: "Photovoltaik", trade: "photovoltaik", weight: 85, pattern: /photovoltaik|pv-anlage|solaranlage/ },
    { label: "Netzwerktechnik", trade: "netzwerktechnik", weight: 80, pattern: /netzwerktechnik|datentechnik|it-verkabelung|strukturierte verkabelung|netzwerkverkabelung/ },
    { label: "Heizung", trade: "heizungsbau", weight: 85, pattern: /heizung|heizungsbau|waermepumpe|wärmepumpe/ },
    { label: "Sanitär", trade: "sanitaerinstallation", weight: 85, pattern: /sanitaer|sanitär|badrenovierung|wasserinstallation/ },
    { label: "Lüftung", trade: "lueftungsbau", weight: 80, pattern: /lueftung|lüftung|klimatechnik|klima/ },
    { label: "Malerarbeiten", trade: "malerarbeiten", weight: 85, pattern: /maler|anstrich|fassadenanstrich|lackier/ },
    { label: "Putzarbeiten", trade: "putzarbeiten", weight: 80, pattern: /putz|verputz|innenputz|aussenputz|außenputz/ },
    { label: "Trockenbau", trade: "trockenbau", weight: 85, pattern: /trockenbau|gipskarton|akustikdecke/ },
    { label: "Fliesenarbeiten", trade: "fliesenlegerarbeiten", weight: 85, pattern: /fliesen|platten|mosaik/ },
    { label: "Bodenbeläge", trade: "bodenbelagsarbeiten", weight: 80, pattern: /bodenbelaege|bodenbeläge|parkett|vinyl|laminat/ },
    { label: "Bautrocknung", trade: "bautrocknung", weight: 90, pattern: /bautrocknung|wasserschaden|leckortung|trocknung/ },
    { label: "Brandschutz", trade: "brandschutz", weight: 85, pattern: /brandschutz|rauchmelder|brandmelde|feuerloescher|feuerlöscher/ },
  ];
}
