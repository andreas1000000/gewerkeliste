#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const area = args.area || "Rosenheim";
const country = args.country || "Deutschland";
const endpoint = args.endpoint || "https://overpass-api.de/api/interpreter";
const timeoutSeconds = numberArg("timeout", 60);
const limit = numberArg("limit", Number.POSITIVE_INFINITY);
const fallbackPostalCode = args["postal-code"] || "";
const fallbackCity = args.city || area;
const includePlanning = String(args["include-planning"] || "false").toLowerCase() === "true";
const includeSuppliers = String(args["include-suppliers"] || "false").toLowerCase() === "true";
const outputPath =
  args.output || join("work", `${new Date().toISOString().replace(/[:.]/g, "-")}-osm-${slugify(area)}-candidates.jsonl`);

const craftTradeMap = {
  bricklayer: "Maurerarbeiten",
  builder: "Maurerarbeiten",
  carpenter: "Schreinerarbeiten",
  concrete: "Betonbau",
  drywall: "Trockenbau",
  electrician: "Elektroinstallation",
  floorer: "Bodenbelag",
  gardener: "Gartenbau",
  glaziery: "Glasarbeiten",
  hvac: "Heizung und Klima",
  insulation: "Daemmung",
  joiner: "Schreinerarbeiten",
  landscaper: "Landschaftsbau",
  mason: "Maurerarbeiten",
  metal_construction: "Metallbau",
  painter: "Malerarbeiten",
  paver: "Pflasterbau",
  plasterer: "Putzarbeiten",
  plumber: "Sanitaerinstallation",
  roofer: "Dachdeckerarbeiten",
  sawmill: "Holzbau",
  scaffolder: "Geruestbau",
  stonemason: "Natursteinarbeiten",
  tiler: "Fliesenarbeiten",
  window_construction: "Fensterbau",
};

const planningTradeMap = {
  architect: "Architektur",
  surveyor: "Vermessung",
};

const supplierTradeMap = {
  doityourself: "Baustoffhandel",
  hardware: "Baustoffhandel",
  trade: "Baustoffhandel",
};

await mkdir(dirname(outputPath), { recursive: true });

const query = buildQuery();
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    "user-agent": "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)",
  },
  body: new URLSearchParams({ data: query }),
});

if (!response.ok) {
  fail(`Overpass Anfrage fehlgeschlagen: ${response.status} ${response.statusText}`);
}

const data = await response.json();
const elements = Array.isArray(data.elements) ? data.elements : [];
const output = createWriteStream(outputPath, { flags: "w" });
const report = {
  ok: true,
  source: "OpenStreetMap Overpass API",
  area,
  country,
  include_planning: includePlanning,
  include_suppliers: includeSuppliers,
  fallback_postal_code: fallbackPostalCode || null,
  fallback_city: fallbackCity || null,
  output: outputPath,
  elements_received: elements.length,
  candidates_written: 0,
  skipped_without_name: 0,
  skipped_without_location: 0,
  skipped_without_trade: 0,
};

for (const element of elements) {
  if (report.candidates_written >= limit) break;
  const candidate = toCandidate(element);
  if (!candidate) continue;
  output.write(`${JSON.stringify(candidate)}\n`);
  report.candidates_written += 1;
}

await new Promise((resolve) => output.end(resolve));
await writeFile(outputPath.replace(/\.jsonl$/i, "-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

function buildQuery() {
  const craftValues = Object.keys(craftTradeMap).join("|");
  const escapedArea = escapeOverpass(area);
  const escapedCountry = escapeOverpass(country);
  const optionalQueries = [];

  if (includePlanning) {
    optionalQueries.push(`  nwr(area.searchArea)["office"~"^(${Object.keys(planningTradeMap).join("|")})$"];`);
  }
  if (includeSuppliers) {
    optionalQueries.push(`  nwr(area.searchArea)["shop"~"^(${Object.keys(supplierTradeMap).join("|")})$"];`);
  }

  return `
[out:json][timeout:${timeoutSeconds}];
area["name"="${escapedCountry}"]["boundary"="administrative"]->.countryArea;
area["name"="${escapedArea}"]["boundary"="administrative"](area.countryArea)->.searchArea;
(
  nwr(area.searchArea)["craft"~"^(${craftValues})$"];
${optionalQueries.join("\n")}
);
out center tags;
`;
}

function toCandidate(element) {
  const tags = element.tags || {};
  const name = tags.name || tags.operator;
  if (!name) {
    report.skipped_without_name += 1;
    return null;
  }

  const trade = inferTrade(tags);
  if (!trade) {
    report.skipped_without_trade += 1;
    return null;
  }

  const postalCode = tags["addr:postcode"] || fallbackPostalCode;
  const city = tags["addr:city"] || fallbackCity;
  if (!postalCode || !city) {
    report.skipped_without_location += 1;
    return null;
  }

  const coordinates = getCoordinates(element);
  const osmUrl = `https://www.openstreetmap.org/${osmType(element.type)}/${element.id}`;
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ") || null;

  return {
    company_name: clean(name),
    trade_name: trade,
    trade_slug: slugify(trade),
    website: normalizeWebsite(tags.website || tags["contact:website"]),
    phone: tags.phone || tags["contact:phone"] || null,
    email: normalizeEmail(tags.email || tags["contact:email"]),
    street,
    postal_code: postalCode,
    city,
    country,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    source_url: osmUrl,
    source_label: "OpenStreetMap",
    source_retrieved_at: new Date().toISOString(),
    source_excerpt: buildExcerpt(tags),
    public_data_only: true,
    privacy_notes:
      "Aus OpenStreetMap ueber Overpass API recherchiert. ODbL/OSM-Attribution beachten und Betriebsdaten vor Freigabe pruefen.",
  };
}

function inferTrade(tags) {
  if (tags.craft && craftTradeMap[tags.craft]) return craftTradeMap[tags.craft];
  if (includePlanning && tags.office && planningTradeMap[tags.office]) return planningTradeMap[tags.office];
  if (includeSuppliers && tags.shop && supplierTradeMap[tags.shop]) return supplierTradeMap[tags.shop];
  return "";
}

function getCoordinates(element) {
  const latitude = element.lat ?? element.center?.lat ?? null;
  const longitude = element.lon ?? element.center?.lon ?? null;
  return { latitude, longitude };
}

function buildExcerpt(tags) {
  const selected = {
    name: tags.name,
    craft: tags.craft,
    office: tags.office,
    shop: tags.shop,
    website: tags.website || tags["contact:website"],
    phone: tags.phone || tags["contact:phone"],
    email: tags.email || tags["contact:email"],
    address: [tags["addr:street"], tags["addr:housenumber"], tags["addr:postcode"], tags["addr:city"]]
      .filter(Boolean)
      .join(" "),
  };
  return Object.entries(selected)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

function osmType(type) {
  if (type === "node") return "node";
  if (type === "way") return "way";
  return "relation";
}

function normalizeWebsite(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function normalizeEmail(value) {
  return value ? String(value).trim().toLowerCase() : null;
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function escapeOverpass(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
