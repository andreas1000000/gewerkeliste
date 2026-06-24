import fs from "node:fs";

const raw = JSON.parse(fs.readFileSync("data/import/osm-rosenheim-raw.json", "utf8"));
const now = new Date().toISOString();

const craftMap = {
  electrician: ["elektroinstallation"],
  plumber: ["sanitaerinstallation", "heizungsbau"],
  hvac: ["heizungsbau", "lueftung"],
  painter: ["malerarbeiten"],
  roofer: ["dachdeckerarbeiten"],
  carpenter: ["zimmererarbeiten", "schreinerarbeiten"],
  joiner: ["schreinerarbeiten", "innenausbau"],
  cabinet_maker: ["schreinerarbeiten"],
  glaziery: ["fenster-tueren"],
  stonemason: ["natursteinarbeiten"],
  mason: ["maurerarbeiten"],
  builder: ["bauunternehmen"],
  construction: ["bauunternehmen"],
  glazier: ["fenster-tueren"],
  metal_construction: ["metallbau"],
  tinsmith: ["spenglerarbeiten"],
  blacksmith: ["metallbau"],
  locksmith: ["metallbau"],
  tiler: ["fliesenlegerarbeiten"],
  floorer: ["bodenlegerarbeiten"],
  floor_layer: ["bodenlegerarbeiten"],
  parquet_layer: ["bodenlegerarbeiten"],
  plasterer: ["stuckateurarbeiten"],
  insulation: ["waermedaemmung"],
  landscaper: ["garten-und-landschaftsbau"],
  gardener: ["garten-und-landschaftsbau"],
  excavation: ["erdbau"],
  earthworks: ["erdbau", "tiefbau"],
  demolition: ["abbrucharbeiten"],
  scaffolder: ["geruestbau"],
  window_construction: ["fenster-tueren"],
  door_construction: ["fenster-tueren"],
  stove_fitter: ["ofenbau"],
  sun_protection: ["sonnenschutz"],
  construction_drying: ["bauwerksabdichtung"],
  "sheet-metal construction worker": ["spenglerarbeiten"],
  sawyer: ["holzbau"],
};

const shopMap = {
  stones: ["natursteinarbeiten"],
  tiles: ["fliesenlegerarbeiten"],
  flooring: ["bodenlegerarbeiten"],
  paint: ["malerarbeiten"],
  garden_centre: ["garten-und-landschaftsbau"],
  doityourself: ["baustoffhandel"],
  hardware: ["baustoffhandel"],
  bathroom_furnishing: ["sanitaerinstallation"],
  windows: ["fenster-tueren"],
  doors: ["fenster-tueren"],
  furniture: ["schreinerarbeiten", "innenausbau"],
  kitchen: ["schreinerarbeiten", "innenausbau"],
};

const termMap = [
  ["elektro", ["elektroinstallation"]],
  ["elektrik", ["elektroinstallation"]],
  ["haustechnik", ["sanitaerinstallation", "heizungsbau"]],
  ["heizung", ["heizungsbau"]],
  ["sanitär", ["sanitaerinstallation"]],
  ["sanitaer", ["sanitaerinstallation"]],
  ["lüftung", ["lueftung"]],
  ["lueftung", ["lueftung"]],
  ["klima", ["kaelte-klima"]],
  ["zimmerei", ["zimmererarbeiten"]],
  ["holzbau", ["zimmererarbeiten", "holzbau"]],
  ["dach", ["dachdeckerarbeiten"]],
  ["spengl", ["spenglerarbeiten"]],
  ["maler", ["malerarbeiten"]],
  ["fliesen", ["fliesenlegerarbeiten"]],
  ["boden", ["bodenlegerarbeiten"]],
  ["parkett", ["bodenlegerarbeiten"]],
  ["schreiner", ["schreinerarbeiten"]],
  ["fenster", ["fenster-tueren"]],
  ["metall", ["metallbau"]],
  ["schlosserei", ["metallbau"]],
  ["pflaster", ["pflasterbau"]],
  ["garten", ["garten-und-landschaftsbau"]],
  ["landschaft", ["garten-und-landschaftsbau"]],
  ["bagger", ["erdbau"]],
  ["erdarbeiten", ["erdbau"]],
  ["tiefbau", ["tiefbau"]],
  ["abbruch", ["abbrucharbeiten"]],
  ["gerüst", ["geruestbau"]],
  ["geruest", ["geruestbau"]],
  ["beton", ["betonbau"]],
  ["bauunternehmen", ["bauunternehmen"]],
  ["naturstein", ["natursteinarbeiten"]],
];

function value(tags, ...keys) {
  for (const key of keys) {
    if (tags[key]) return String(tags[key]).trim();
  }
  return "";
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function cleanEmail(email) {
  const value = String(email || "").trim();
  if (!value || !value.includes("@")) return "";
  const local = value.split("@")[0].toLowerCase();
  if (
    /^(info|kontakt|mail|office|service|anfrage|verwaltung|zentrale|kundendienst|team|post|hello)$/.test(local) ||
    local.includes("info") ||
    local.includes("kontakt")
  ) {
    return value;
  }
  return "";
}

function cleanPhone(phone) {
  const value = String(phone || "").trim();
  if (!value) return "";
  const digits = value.replace(/[^0-9+]/g, "");
  if (/^\+?49(15|16|17)/.test(digits)) return "";
  return value;
}

function detectTrades(tags) {
  const trades = new Set();
  const craft = normalize(tags.craft);
  const shop = normalize(tags.shop);
  const knownConstructionTag = Boolean(craftMap[craft] || shopMap[shop]);

  if (craftMap[craft]) craftMap[craft].forEach((slug) => trades.add(slug));
  if (shopMap[shop]) shopMap[shop].forEach((slug) => trades.add(slug));

  const text = normalize(
    [tags.name, tags.operator, tags.description, tags["description:de"], tags.website, tags["contact:website"], tags.service]
      .filter(Boolean)
      .join(" ")
  );

  for (const [term, slugs] of termMap) {
    if ((knownConstructionTag || isStrongConstructionTerm(term)) && text.includes(term)) slugs.forEach((slug) => trades.add(slug));
  }

  return [...trades];
}

function isStrongConstructionTerm(term) {
  return [
    "elektro",
    "haustechnik",
    "heizung",
    "sanitär",
    "sanitaer",
    "lüftung",
    "lueftung",
    "zimmerei",
    "holzbau",
    "dach",
    "spengl",
    "maler",
    "fliesen",
    "parkett",
    "schreiner",
    "fenster",
    "pflaster",
    "erdarbeiten",
    "tiefbau",
    "abbruch",
    "gerüst",
    "geruest",
    "beton",
    "bauunternehmen",
    "naturstein",
  ].includes(term);
}

function toCandidate(element) {
  const tags = element.tags || {};
  const name = value(tags, "name", "operator");
  if (!name) return null;
  if (isClearlyNotConstruction(tags, name)) return null;

  const trades = detectTrades(tags);
  if (!trades.length) return null;

  const city = value(tags, "addr:city");
  const postalCode = value(tags, "addr:postcode");
  const street = value(tags, "addr:street");
  const houseNumber = value(tags, "addr:housenumber");
  const website = value(tags, "website", "contact:website");
  const email = cleanEmail(value(tags, "email", "contact:email"));
  const phone = cleanPhone(value(tags, "phone", "contact:phone"));
  const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;
  const hasAddress = Boolean(city || postalCode || street);
  const confidence = Math.min(92, 55 + (website ? 15 : 0) + (hasAddress ? 10 : 0) + (phone ? 6 : 0) + (email ? 5 : 0) + (tags.craft ? 10 : 0));

  return {
    name,
    legal_name: null,
    website: website || null,
    source_url: sourceUrl,
    source_type: "openstreetmap_hint_odbl",
    city: city || null,
    postal_code: postalCode || null,
    address_line: street ? `${street}${houseNumber ? ` ${houseNumber}` : ""}` : null,
    phone_public_business: phone || null,
    email_public_business: email || null,
    trades,
    services_raw: [
      tags.craft ? `craft=${tags.craft}` : null,
      tags.shop ? `shop=${tags.shop}` : null,
      tags.description || null,
      tags.service ? `service=${tags.service}` : null,
    ].filter(Boolean),
    confidence_score: confidence,
    status: "review",
    verified: false,
    claim_status: "unclaimed",
    ready_for_import: confidence >= 75,
    needs_review: confidence < 75,
    possible_duplicate: false,
    notes_internal: "OSM/Overpass-Hinweisdatensatz; vor Veröffentlichung offizielle Firmenwebsite/Impressum prüfen. ODbL-Attribution erforderlich.",
    discovered_at: now,
    last_checked_at: now,
    raw_evidence: {
      osm_type: element.type,
      osm_id: element.id,
      lat: element.lat || element.center?.lat || null,
      lon: element.lon || element.center?.lon || null,
      osm_tags_subset: {
        craft: tags.craft || null,
        shop: tags.shop || null,
        industrial: tags.industrial || null,
        operator: tags.operator || null,
      },
    },
  };
}

function isClearlyNotConstruction(tags, name) {
  const text = normalize([name, tags.craft, tags.shop, tags.description].filter(Boolean).join(" "));
  const nonConstruction = [
    "brewery",
    "beekeeper",
    "coffee",
    "jeweller",
    "photographer",
    "confectionery",
    "bakery",
    "bookbinder",
    "shoemaker",
    "tailor",
    "dental",
    "car_painter",
    "distillery",
    "caterer",
    "musical_instrument",
    "dressmaker",
    "schlossbrauerei",
  ].some((term) => text.includes(term));
  if (nonConstruction) return true;

  const manufacturingMetal =
    tags.craft === "metal_construction" &&
    /(maschinenbau|werkzeugbau|formenbau|stanzerei|spritzgieß|spritzgiess|mountaincart|cnc)/i.test(name) &&
    !/(metallbau|stahlbau|schlosserei|geländer|gelaender|treppen|zaun|tore)/i.test(name);
  return manufacturingMetal;
}

const candidates = (raw.elements || []).map(toCandidate).filter(Boolean);
const byKey = new Map();

for (const candidate of candidates) {
  const key = (
    candidate.website
      ? candidate.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
      : `${candidate.name}|${candidate.postal_code}|${candidate.city}`
  ).toLowerCase();
  const previous = byKey.get(key);
  if (!previous || candidate.confidence_score > previous.confidence_score) byKey.set(key, candidate);
}

const out = [...byKey.values()].sort(
  (a, b) => b.confidence_score - a.confidence_score || String(a.city).localeCompare(String(b.city), "de") || a.name.localeCompare(b.name, "de")
);

fs.writeFileSync(
  "data/import/rosenheim-company-candidates.json",
  JSON.stringify(
    {
      metadata: {
        region: "Landkreis Rosenheim",
        source: "OpenStreetMap via Overpass API",
        source_license: "ODbL",
        generated_at: now,
        publication_status: "review_only_not_public",
        external_api_cost_eur: 0,
        google_maps_scraping: false,
      },
      candidates: out,
    },
    null,
    2
  )
);

const columns = ["name", "city", "postal_code", "address_line", "website", "source_url", "source_type", "trades", "confidence_score", "status", "ready_for_import", "needs_review"];
const csv = [
  columns.join(","),
  ...out.map((candidate) =>
    columns
      .map((key) => {
        const value = Array.isArray(candidate[key]) ? candidate[key].join("|") : candidate[key] ?? "";
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  ),
].join("\n");
fs.writeFileSync("data/import/rosenheim-company-candidates.csv", csv);

console.log(
  JSON.stringify(
    {
      raw: raw.elements?.length || 0,
      candidates: out.length,
      ready_for_import: out.filter((candidate) => candidate.ready_for_import).length,
      cities: new Set(out.map((candidate) => candidate.city).filter(Boolean)).size,
      trades: new Set(out.flatMap((candidate) => candidate.trades)).size,
    },
    null,
    2
  )
);
