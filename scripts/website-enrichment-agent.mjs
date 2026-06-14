#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

const args = parseArgs(process.argv.slice(2));
const filePath = args.file || args._[0];
const outputPath =
  args.output || join("work", `${new Date().toISOString().replace(/[:.]/g, "-")}-website-enriched-candidates.jsonl`);
const searchTasksPath = outputPath.replace(/\.jsonl$/i, "-website-search-tasks.jsonl");
const reportPath = outputPath.replace(/\.jsonl$/i, "-report.json");
const limit = numberArg("limit", Number.POSITIVE_INFINITY);
const delayMs = numberArg("delay-ms", 1500);
const timeoutMs = numberArg("timeout-ms", 12000);
const userAgent =
  args["user-agent"] ||
  "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)";

if (!filePath) {
  fail("Datei fehlt. Nutzung: npm run research:enrich:web -- --file work/candidates.jsonl");
}

await mkdir(dirname(outputPath), { recursive: true });

const candidates = parseJsonl(await readFile(filePath, "utf8")).slice(0, limit);
const output = createWriteStream(outputPath, { flags: "w" });
const searchTasks = createWriteStream(searchTasksPath, { flags: "w" });
const robotsCache = new Map();
const report = {
  ok: true,
  input: filePath,
  output: outputPath,
  search_tasks: searchTasksPath,
  candidates_processed: candidates.length,
  websites_checked: 0,
  websites_blocked_by_robots: 0,
  websites_failed: 0,
  imprints_found: 0,
  enriched_email: 0,
  enriched_phone: 0,
  enriched_address: 0,
  search_tasks_written: 0,
  errors: [],
};

for (const candidate of candidates) {
  const enriched = { ...candidate };

  if (!candidate.website) {
    const task = createSearchTask(candidate);
    searchTasks.write(`${JSON.stringify(task)}\n`);
    report.search_tasks_written += 1;
    output.write(`${JSON.stringify(enriched)}\n`);
    continue;
  }

  const website = normalizeUrl(candidate.website);
  const allowed = await isAllowedByRobots(website);
  if (!allowed) {
    report.websites_blocked_by_robots += 1;
    enriched.enrichment_status = "blocked_by_robots";
    output.write(`${JSON.stringify(enriched)}\n`);
    continue;
  }

  await wait(delayMs);
  const analyzed = await analyzeWebsite(website);
  report.websites_checked += 1;

  if (!analyzed.ok) {
    report.websites_failed += 1;
    enriched.enrichment_status = "website_failed";
    enriched.enrichment_notes = analyzed.error;
    output.write(`${JSON.stringify(enriched)}\n`);
    continue;
  }

  if (analyzed.imprint_url) {
    enriched.imprint_url = analyzed.imprint_url;
    enriched.secondary_source_url = analyzed.imprint_url;
    enriched.secondary_source_label = "Impressum der Unternehmenswebsite";
    enriched.source_label = `${candidate.source_label}; Impressum`;
    report.imprints_found += 1;
  }

  if (!enriched.email && analyzed.email) {
    enriched.email = analyzed.email;
    report.enriched_email += 1;
  }
  if (!enriched.phone && analyzed.phone) {
    enriched.phone = analyzed.phone;
    report.enriched_phone += 1;
  }
  if ((!enriched.street || !enriched.postal_code || !enriched.city) && analyzed.address) {
    enriched.street = enriched.street || analyzed.address.street;
    enriched.postal_code = enriched.postal_code || analyzed.address.postal_code;
    enriched.city = enriched.city || analyzed.address.city;
    report.enriched_address += 1;
  }

  enriched.website = website;
  enriched.enrichment_status = "website_checked";
  enriched.enrichment_checked_at = new Date().toISOString();
  enriched.enrichment_notes = analyzed.imprint_url
    ? "Website und Impressum geprueft; Daten bleiben vor Import reviewpflichtig."
    : "Website geprueft; Impressum nicht eindeutig gefunden.";
  output.write(`${JSON.stringify(enriched)}\n`);
}

await new Promise((resolve) => output.end(resolve));
await new Promise((resolve) => searchTasks.end(resolve));
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

async function analyzeWebsite(website) {
  const home = await fetchHtml(website);
  if (!home.ok) return home;

  const links = extractLinks(home.html, website);
  const imprintUrl =
    links.find((link) => /impressum|anbieterkennzeichnung|kontakt/i.test(link.label + " " + link.url))?.url || null;
  let imprint = null;

  if (imprintUrl && (await isAllowedByRobots(imprintUrl))) {
    await wait(Math.max(250, Math.floor(delayMs / 2)));
    imprint = await fetchHtml(imprintUrl);
  }

  const trustedHtml = imprint?.ok ? imprint.html : home.html;
  const text = clean(stripTags(trustedHtml));

  return {
    ok: true,
    imprint_url: imprint?.ok ? imprintUrl : null,
    email: extractEmail(trustedHtml),
    phone: extractPhone(text),
    address: extractAddress(text),
  };
}

async function fetchHtml(url) {
  try {
    const response = await fetchWithTimeout(url);
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) {
      return { ok: false, error: `Kein HTML oder HTTP ${response.status}` };
    }
    return { ok: true, html: await response.text() };
  } catch (error) {
    addError(`${url}: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

async function isAllowedByRobots(targetUrl) {
  const url = new URL(targetUrl);
  const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
  if (!robotsCache.has(robotsUrl)) {
    try {
      const response = await fetchWithTimeout(robotsUrl);
      const text = response.ok ? await response.text() : "";
      robotsCache.set(robotsUrl, parseRobots(text));
    } catch {
      robotsCache.set(robotsUrl, []);
    }
  }

  const rules = robotsCache.get(robotsUrl) || [];
  const path = `${url.pathname}${url.search}`;
  const matchingRule = rules
    .filter((rule) => path.startsWith(rule.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return matchingRule ? matchingRule.allow : true;
}

function parseRobots(text) {
  const rules = [];
  let applies = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const [rawKey, ...rawValue] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.join(":").trim();

    if (key === "user-agent") {
      applies = value === "*" || userAgent.toLowerCase().includes(value.toLowerCase());
      continue;
    }
    if (!applies) continue;
    if (key === "allow" && value) rules.push({ allow: true, path: value });
    if (key === "disallow" && value) rules.push({ allow: false, path: value });
  }

  return rules;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { "user-agent": userAgent, accept: "text/html,application/xhtml+xml" },
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
      // Ignore invalid links.
    }
  }
  return links;
}

function extractEmail(html) {
  const mailto = html.match(/mailto:([^"?'>\s]+)/i)?.[1];
  if (mailto) return clean(decodeHtml(mailto)).toLowerCase();
  const textEmail = clean(stripTags(html)).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  return textEmail ? textEmail.toLowerCase() : null;
}

function extractPhone(text) {
  const match = text.match(/(?:Tel\.?|Telefon|Phone|Mobil)\s*:?\s*((?:\+49|0)[0-9 ()/.-]{5,})/i);
  return match?.[1] ? clean(match[1]) : null;
}

function extractAddress(text) {
  const match = text.match(/([A-ZÄÖÜ][A-Za-zÄÖÜäöüß .-]+(?:str\.|straße|weg|gasse|platz|ring|feld|moos|dorf)\s*\d+[a-zA-Z]?)\s*,?\s*(\d{5})\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß .-]+)/i);
  if (!match) return null;
  return {
    street: clean(match[1]),
    postal_code: match[2],
    city: clean(match[3]).replace(/\s+(Deutschland|Germany).*$/i, ""),
  };
}

function createSearchTask(candidate) {
  const query = [candidate.company_name, candidate.trade_name, candidate.city, "Website Impressum"].filter(Boolean).join(" ");
  return {
    company_name: candidate.company_name,
    trade_name: candidate.trade_name,
    street: candidate.street,
    postal_code: candidate.postal_code,
    city: candidate.city,
    source_url: candidate.source_url,
    query,
    reason: "Keine Website in Ausgangsquelle. Website-Finder ueber erlaubte Suchquelle/API erforderlich.",
  };
}

function parseJsonl(value) {
  return value
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, " ");
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
