#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

const args = parseArgs(process.argv.slice(2));
const seeds = await loadSeeds();
const maxPages = numberArg("max-pages", 100);
const maxDepth = numberArg("max-depth", 1);
const delayMs = numberArg("delay-ms", 2000);
const timeoutMs = numberArg("timeout-ms", 12000);
const outputPath =
  args.output ||
  join("work", `${new Date().toISOString().replace(/[:.]/g, "-")}-public-web-research-candidates.jsonl`);
const userAgent =
  args["user-agent"] ||
  "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)";
const sameHostOnly = String(args["same-host-only"] || "true").toLowerCase() !== "false";
const includePattern = args["include-path"] ? new RegExp(args["include-path"], "i") : null;
const sourceLabel = args["source-label"] || "Oeffentlich zugaengliche Website";
const defaultTrade = args.trade || "";
const defaultCity = args.city || "";
const defaultPostalCode = args["postal-code"] || "";

if (seeds.length === 0) {
  fail(
    "Keine Start-URL angegeben. Nutzung: npm run research:web -- --seed https://example.de --trade Pflasterbau --city Rosenheim --max-pages 50",
  );
}

await mkdir(dirname(outputPath), { recursive: true });

const output = createWriteStream(outputPath, { flags: "w" });
const robotsCache = new Map();
const visited = new Set();
const queue = seeds.map((seed) => ({ url: normalizeUrl(seed), depth: 0, rootHost: new URL(normalizeUrl(seed)).host }));
const report = {
  ok: true,
  output: outputPath,
  seeds,
  pages_checked: 0,
  pages_skipped_by_robots: 0,
  pages_failed: 0,
  candidates_written: 0,
  links_queued: 0,
  errors: [],
};

while (queue.length > 0 && report.pages_checked < maxPages) {
  const item = queue.shift();
  if (!item?.url || visited.has(item.url)) continue;
  visited.add(item.url);

  let url;
  try {
    url = new URL(item.url);
  } catch {
    addError(`Ungueltige URL uebersprungen: ${item.url}`);
    continue;
  }

  if (includePattern && !includePattern.test(url.pathname)) continue;

  const allowed = await isAllowedByRobots(url);
  if (!allowed) {
    report.pages_skipped_by_robots += 1;
    continue;
  }

  await wait(delayMs);

  const html = await fetchHtml(url);
  report.pages_checked += 1;
  if (!html) continue;

  const candidate = extractCandidate(html, url.toString());
  if (candidate) {
    output.write(`${JSON.stringify(candidate)}\n`);
    report.candidates_written += 1;
  }

  if (item.depth >= maxDepth) continue;

  for (const link of extractLinks(html, url)) {
    if (visited.has(link)) continue;
    const linkUrl = new URL(link);
    if (sameHostOnly && linkUrl.host !== item.rootHost) continue;
    queue.push({ url: link, depth: item.depth + 1, rootHost: item.rootHost });
    report.links_queued += 1;
  }
}

await new Promise((resolve) => output.end(resolve));
await writeFile(outputPath.replace(/\.jsonl$/i, "-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

async function loadSeeds() {
  const values = [];
  if (args.seed) values.push(...asArray(args.seed));
  if (args["seeds-file"]) {
    const text = await readFile(args["seeds-file"], "utf8");
    values.push(...text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  }
  return [...new Set(values)];
}

async function isAllowedByRobots(url) {
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

async function fetchHtml(url) {
  try {
    const response = await fetchWithTimeout(url.toString());
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) {
      report.pages_failed += 1;
      return null;
    }
    return await response.text();
  } catch (error) {
    report.pages_failed += 1;
    addError(`${url}: ${error.message}`);
    return null;
  }
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { "user-agent": userAgent, accept: "text/html,application/xhtml+xml" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractCandidate(html, sourceUrl) {
  const jsonLdBusinesses = extractJsonLdBusinesses(html);
  const jsonLd = jsonLdBusinesses[0] || {};
  const address = normalizeAddress(jsonLd.address || {});
  const name = textValue(jsonLd.name) || meta(html, "og:site_name") || title(html);
  const website = textValue(jsonLd.url) || sourceUrl;
  const phone = textValue(jsonLd.telephone) || firstMatch(html, /(?:Tel\.?|Telefon|Phone)\s*:?\s*([+()0-9 /.-]{6,})/i);
  const email = textValue(jsonLd.email) || firstMatch(html, /mailto:([^"?'>\s]+)/i);
  const postalCode = textValue(address.postalCode) || defaultPostalCode || firstMatch(html, /\b([0-9]{5})\b/);
  const city = textValue(address.addressLocality) || defaultCity;
  const street = [textValue(address.streetAddress)].filter(Boolean).join(" ") || null;
  const trade = defaultTrade || inferTrade(html);

  if (!name || !trade || !postalCode || !city) return null;

  return {
    company_name: clean(name),
    trade_name: clean(trade),
    trade_slug: slugify(trade),
    website: normalizeUrl(website),
    phone: phone ? clean(phone) : null,
    email: email ? clean(email).toLowerCase() : null,
    street,
    postal_code: postalCode,
    city: clean(city),
    country: textValue(address.addressCountry) || "Deutschland",
    source_url: sourceUrl,
    source_label: sourceLabel,
    source_retrieved_at: new Date().toISOString(),
    source_excerpt: excerpt(html),
    public_data_only: true,
    privacy_notes: "Automatisch aus oeffentlich abrufbarer Website extrahiert; Quelle vor Freigabe pruefen.",
  };
}

function extractJsonLdBusinesses(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const items = [];

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(decodeHtml(stripTags(block[1])));
      const flattened = flattenJsonLd(parsed);
      items.push(
        ...flattened.filter((item) => {
          const type = asArray(item["@type"]).join(" ").toLowerCase();
          return /localbusiness|homeandconstructionbusiness|professionalservice|organization/.test(type);
        }),
      );
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return items;
}

function flattenJsonLd(value) {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (value && typeof value === "object" && Array.isArray(value["@graph"])) return value["@graph"].flatMap(flattenJsonLd);
  return value && typeof value === "object" ? [value] : [];
}

function normalizeAddress(value) {
  if (Array.isArray(value)) return value[0] || {};
  return value && typeof value === "object" ? value : {};
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  for (const match of html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const href = decodeHtml(match[1]).trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const url = new URL(href, baseUrl);
      if (!/^https?:$/.test(url.protocol)) continue;
      url.hash = "";
      links.add(url.toString());
    } catch {
      // Ignore invalid links.
    }
  }
  return links;
}

function inferTrade(html) {
  const content = clean(stripTags(html)).toLowerCase();
  const trades = [
    "Pflasterbau",
    "Maurerarbeiten",
    "Dachdeckerarbeiten",
    "Zimmerei",
    "Sanitaerinstallation",
    "Elektroinstallation",
    "Malerarbeiten",
    "Metallbau",
    "Trockenbau",
    "Fliesenarbeiten",
    "Garten- und Landschaftsbau",
    "Bauwerksabdichtung",
  ];
  return trades.find((trade) => content.includes(trade.toLowerCase())) || "";
}

function title(html) {
  return firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
}

function meta(html, property) {
  return firstMatch(
    html,
    new RegExp(`<meta[^>]+(?:property|name)=["']${escapeRegExp(property)}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
  );
}

function firstMatch(value, regex) {
  const match = value.match(regex);
  return match?.[1] ? decodeHtml(stripTags(match[1])).trim() : "";
}

function excerpt(html) {
  return clean(stripTags(html)).slice(0, 500);
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function clean(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function textValue(value) {
  if (typeof value === "string" || typeof value === "number") return clean(String(value));
  return "";
}

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function slugify(value) {
  return String(value || "")
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
    if (result[key]) result[key] = [...asArray(result[key]), next];
    else result[key] = next;
    index += 1;
  }
  return result;
}

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function numberArg(key, fallback) {
  const value = Number(args[key] || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addError(message) {
  report.ok = false;
  if (report.errors.length < 100) report.errors.push(message);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
