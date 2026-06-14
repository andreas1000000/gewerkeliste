#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const url = args.url || "https://www.riedering.de/index.php?id=0,46&literal=ALLE";
const sourceLabel = args["source-label"] || "Gemeinde Riedering Unternehmensverzeichnis";
const outputPath =
  args.output || join("work", `${new Date().toISOString().replace(/[:.]/g, "-")}-open2c-directory-candidates.jsonl`);
const includePlanning = String(args["include-planning"] || "false").toLowerCase() === "true";
const includeSuppliers = String(args["include-suppliers"] || "false").toLowerCase() === "true";

const branchTradeMap = new Map([
  ["bauunternehmen", "Bauunternehmen"],
  ["boden- und parkettleger", "Bodenbelag"],
  ["elektronik", "Elektroinstallation"],
  ["fliesenleger", "Fliesenarbeiten"],
  ["garten- und landschaftsbau", "Garten- und Landschaftsbau"],
  ["heizung - sanitär - solar - spenglerei", "Sanitaerinstallation"],
  ["holz- und bautenschutz", "Holz- und Bautenschutz"],
  ["holzverarbeitung", "Schreinerarbeiten"],
  ["kachelofenbau", "Ofenbau"],
  ["kälteanlagen - klimaanlagen", "Kälte / Klima"],
  ["malerbetrieb", "Malerarbeiten"],
  ["metall- und maschinenbau", "Metallbau"],
  ["ofbau", "Ofenbau"],
  ["ofenbau", "Ofenbau"],
  ["schlosserei", "Schlosserarbeiten"],
  ["schreinerei", "Schreinerarbeiten"],
  ["spenglerei", "Spenglerarbeiten"],
  ["steinmetz", "Natursteinarbeiten"],
  ["zimmerei", "Zimmererarbeiten"],
]);

if (includePlanning) {
  branchTradeMap.set("architektur", "Architektur");
  branchTradeMap.set("ingenieurbüro", "Ingenieurbüro");
  branchTradeMap.set("hls-planung", "TGA-Planung");
  branchTradeMap.set("energieberatung", "Energieberatung");
  branchTradeMap.set("projektplanung", "Projektplanung");
}

if (includeSuppliers) {
  branchTradeMap.set("baustoffhandel", "Baustoffhandel");
  branchTradeMap.set("baumaschinenverleih", "Baumaschinenverleih");
  branchTradeMap.set("sägewerk", "Sägewerk");
}

if (!args.file) await assertRobotsAllowed(url);
await mkdir(dirname(outputPath), { recursive: true });

const html = args.file ? await readFile(args.file, "utf8") : await fetchText(url);
const rows = parseRows(html);
const output = createWriteStream(outputPath, { flags: "w" });
const seen = new Set();
const report = {
  ok: true,
  source: sourceLabel,
  url,
  output: outputPath,
  rows_found: rows.length,
  candidates_written: 0,
  skipped_non_trade: 0,
  skipped_duplicate: 0,
  include_planning: includePlanning,
  include_suppliers: includeSuppliers,
};

for (const row of rows) {
  const tradeName = mapTrade(row.branches);
  if (!tradeName) {
    report.skipped_non_trade += 1;
    continue;
  }

  const key = `${normalizeKey(row.name)}|${normalizeKey(row.street)}|${row.postal_code}`;
  if (seen.has(key)) {
    report.skipped_duplicate += 1;
    continue;
  }
  seen.add(key);

  const candidate = {
    company_name: row.name,
    trade_name: tradeName,
    trade_slug: slugify(tradeName),
    website: normalizeWebsite(row.website),
    phone: row.phone,
    email: row.email,
    street: row.street,
    postal_code: row.postal_code,
    city: row.city,
    country: "Deutschland",
    source_url: row.source_url,
    source_label: sourceLabel,
    source_retrieved_at: new Date().toISOString(),
    source_excerpt: `Branche: ${row.branches.join(", ")}; Anschrift: ${[row.street, row.postal_code, row.city].filter(Boolean).join(" ")}`,
    public_data_only: true,
    privacy_notes: "Aus oeffentlichem kommunalem Unternehmensverzeichnis recherchiert; Betrieb vor Freigabe pruefen.",
  };

  output.write(`${JSON.stringify(candidate)}\n`);
  report.candidates_written += 1;
}

await new Promise((resolve) => output.end(resolve));
await writeFile(outputPath.replace(/\.jsonl$/i, "-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

async function assertRobotsAllowed(targetUrl) {
  const parsed = new URL(targetUrl);
  const robotsUrl = `${parsed.origin}/robots.txt`;
  const robots = await fetchText(robotsUrl);
  const disallowed = robots
    .split(/\r?\n/)
    .map((line) => line.split("#")[0].trim())
    .filter(Boolean)
    .some((line) => {
      const [key, value] = line.split(":").map((part) => part.trim());
      return key?.toLowerCase() === "disallow" && value && parsed.pathname.startsWith(value);
    });

  if (disallowed) fail(`robots.txt sperrt den Abruf von ${targetUrl}`);
}

async function fetchText(targetUrl) {
  const response = await fetch(targetUrl, {
    headers: { "user-agent": "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)" },
  });
  if (!response.ok) fail(`Abruf fehlgeschlagen: ${targetUrl} (${response.status})`);
  return response.text();
}

function parseRows(html) {
  const rowMatches = [...html.matchAll(/<tr[^>]*class=["']branchen_tr_[^"']+["'][^>]*>([\s\S]*?)<\/tr>/gi)];
  return rowMatches.map((match) => parseRow(match[1])).filter(Boolean);
}

function parseRow(rowHtml) {
  const cells = [...rowHtml.matchAll(/<td[^>]*class=["']branchen_td_(\d+)["'][^>]*>([\s\S]*?)<\/td>/gi)].sort(
    (a, b) => Number(a[1]) - Number(b[1]),
  );
  if (cells.length < 3) return null;

  const nameLink = cells[0][2].match(/href=["']([^"']+)["'][\s\S]*?<b>([\s\S]*?)<\/b>/i);
  const name = clean(stripTags(nameLink?.[2] || cells[0][2]));
  const href = decodeHtml(nameLink?.[1] || "");
  const sourceUrl = href ? new URL(href, url).toString() : url;
  const address = parseAddressCell(cells[1][2]);
  const branches = [...cells[2][2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((branch) => clean(stripTags(branch[1])));

  if (!name || !address.postal_code || !address.city) return null;

  return {
    name,
    source_url: sourceUrl,
    branches,
    ...address,
  };
}

function parseAddressCell(html) {
  const decoded = decodeHtml(html);
  const email = firstMatch(decoded, /mailto:([^"'>\s]+)/i);
  const homepage = firstMatch(decoded, /Homepage:[\s\S]*?href=["']([^"']+)["']/i);
  const phone = firstMatch(decoded, /(?:Tel\.|Mobil):\s*([^<\n\r]+)/i);
  const text = decoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a[\s\S]*?<\/a>/gi, "")
    .replace(/<[^>]+>/g, " ");
  const lines = text
    .split(/\n/)
    .map((line) => clean(line))
    .filter((line) => line && !/^(Tel\.|Mobil|Fax|E-Mail|Homepage)\b/i.test(line));
  const postalLineIndex = lines.findIndex((line) => /\b[0-9]{5}\b/.test(line));
  const street = postalLineIndex > 0 ? lines[postalLineIndex - 1] : "";
  const postalLine = postalLineIndex >= 0 ? lines[postalLineIndex] : "";
  const postalMatch = postalLine.match(/\b([0-9]{5})\b\s*([A-Za-zÄÖÜäöüß .-]+)?/);

  return {
    street: street || null,
    postal_code: postalMatch?.[1] || "",
    city: clean(postalMatch?.[2] || "").replace(/\s+(Tel\.|Mobil|Fax|E-Mail|Homepage).*$/i, ""),
    phone: phone ? clean(phone) : null,
    email: email ? clean(email).toLowerCase() : null,
    website: homepage && homepage !== "http://" && homepage !== "https://" ? homepage : null,
  };
}

function mapTrade(branches) {
  for (const branch of branches) {
    const normalized = normalizeKey(branch);
    if (branchTradeMap.has(normalized)) return branchTradeMap.get(normalized);
  }
  return "";
}

function firstMatch(value, regex) {
  const match = value.match(regex);
  return match?.[1] ? decodeHtml(match[1]).trim() : "";
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

function normalizeWebsite(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value) {
  return normalizeKey(value)
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
    result[key] = next;
    index += 1;
  }
  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
