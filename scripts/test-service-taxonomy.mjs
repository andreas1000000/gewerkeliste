#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const taxonomyModule = await importServiceTaxonomyModule();
const { serviceTaxonomy, slugify } = taxonomyModule;
const entries = flattenTaxonomy(serviceTaxonomy);
const tradeSlugs = new Set(entries.map((entry) => entry.tradeSlug));

const checks = [];

checkSearch("Loftwand", ({ top }) => {
  assert(top.groupName === "Metallbau, Stahlbau & Schlosser", "Loftwand muss Metallbau-Hauptgruppe treffen.");
  assert(top.tradeSlug === "metallbau", "Loftwand muss Metallbau & Schlosserei treffen.");
  assert(top.familyName === "Loftwände & Stahl-Glas-Systeme", "Loftwand muss in der Loftwand-Familie liegen.");
});

checkSearch("Stahlglaswand", ({ top }) => {
  assert(top.tradeSlug === "metallbau", "Stahlglaswand muss Metallbau treffen.");
  assert(top.serviceName === "Loftwand", "Stahlglaswand muss als Alias der Loftwand gefunden werden.");
});

checkSearch("Lüftlmalerei", ({ top }) => {
  assert(top.tradeSlug === "malerarbeiten", "Lüftlmalerei muss Malerarbeiten treffen.");
  assert(top.familyName === "Kunstmalerei", "Lüftlmalerei muss Kunstmalerei treffen.");
});

checkSearch("Graffiti Gestaltung", ({ top }) => {
  assert(top.familyName === "Kunstmalerei", "Graffiti-Gestaltung muss Kunstmalerei treffen.");
});

checkSearch("Street Art", ({ top }) => {
  assert(top.familyName === "Kunstmalerei", "Street Art muss Kunstmalerei treffen.");
});

checkSearch("Wandmalerei", ({ top }) => {
  assert(top.familyName === "Kunstmalerei", "Wandmalerei muss Kunstmalerei treffen.");
});

checkSearch("Trompe l oeil", ({ top }) => {
  assert(top.familyName === "Kunstmalerei", "Trompe l'oeil muss Kunstmalerei treffen.");
});

checkSearch("Graffiti entfernen", ({ top, results }) => {
  assert(top.familyName !== "Kunstmalerei", "Graffiti entfernen darf nicht Kunstmalerei als Top-Treffer haben.");
  assert(results.some((entry) => ["Fassade im Bestand", "Strahltechnik"].includes(entry.familyName)), "Graffiti entfernen muss Reinigungs-/Sanierungsfamilien treffen.");
});

checkSearch("Hof asphaltieren", ({ top }) => {
  assert(top.tradeSlug === "strassenbau", "Hof asphaltieren muss Straßenbau/Asphalt treffen.");
  assert(["Asphaltarbeiten", "Asphaltbau", "Asphaltbelag"].includes(top.serviceName), "Hof asphaltieren muss auf einen fachlichen Asphalt-Canonical zeigen.");
});

checkSearch("Zufahrt asphaltieren", ({ top }) => {
  assert(top.tradeSlug === "strassenbau", "Zufahrt asphaltieren muss Straßenbau/Asphalt treffen.");
  assert(["Asphaltarbeiten", "Asphaltbau", "Asphaltbelag"].includes(top.serviceName), "Zufahrt asphaltieren muss auf einen fachlichen Asphalt-Canonical zeigen.");
});

checkSearch("Kaltasphalt", ({ top }) => {
  assert(top.tradeSlug === "strassenbau", "Kaltasphalt muss Straßenbau/Asphalt treffen.");
  assert(top.familyName === "Verkehrsflächen", "Kaltasphalt muss Verkehrsflächen treffen.");
});

for (const query of ["Doppelboden", "Hohlboden", "Raised Floor", "Access Floor", "EDV-Boden"]) {
  checkSearch(query, ({ top }) => {
    assert(top.tradeSlug === "innenausbau", `${query} muss Innenausbau treffen.`);
    assert(top.familyName === "Systemböden & Hohlraumböden", `${query} muss Systemböden & Hohlraumböden treffen.`);
  });
}

checkCanonicalServices();
checkFamilyLocalDuplicates();
checkRequiredCrosslinks();

console.log(JSON.stringify({
  status: "ok",
  groups: serviceTaxonomy.length,
  trades: new Set(entries.map((entry) => entry.tradeSlug)).size,
  services: entries.length,
  checks,
}, null, 2));

function checkSearch(query, validate) {
  const results = search(query);
  assert(results.length > 0, `Keine Treffer fuer "${query}".`);
  const top = results[0];
  validate({ top, results });
  checks.push({ query, top: summarize(top) });
}

function search(query) {
  const normalizedQuery = normalize(query);
  return entries
    .map((entry) => ({ ...entry, score: scoreEntry(entry, normalizedQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.serviceName.localeCompare(b.serviceName, "de"));
}

function scoreEntry(entry, normalizedQuery) {
  const serviceTerms = [entry.serviceName, ...entry.aliases].map(normalize);
  const familyTerms = [entry.familyName].map(normalize);
  const tradeTerms = [entry.tradeName, entry.tradeSlug].map(normalize);
  const groupTerms = [entry.groupName].map(normalize);

  if (serviceTerms.includes(normalizedQuery)) return 100;
  if (familyTerms.includes(normalizedQuery)) return 85;
  if (tradeTerms.includes(normalizedQuery)) return 70;
  if (serviceTerms.some((term) => term.includes(normalizedQuery) || normalizedQuery.includes(term))) return 65;
  if (familyTerms.some((term) => term.includes(normalizedQuery) || normalizedQuery.includes(term))) return 50;
  if (groupTerms.some((term) => term.includes(normalizedQuery) || normalizedQuery.includes(term))) return 30;
  return 0;
}

function checkCanonicalServices() {
  const forbidden = new Set(["Hof asphaltieren", "Zufahrt asphaltieren", "Parkplatz asphaltieren"].map(slugify));
  const canonicalSlugs = new Set(entries.map((entry) => entry.serviceSlug));
  for (const slug of forbidden) assert(!canonicalSlugs.has(slug), `${slug} darf nicht als Canonical-Service existieren.`);
  checks.push({ rule: "asphalt_aliases_not_canonical", status: "ok" });
}

function checkFamilyLocalDuplicates() {
  const seen = new Set();
  for (const entry of entries) {
    const key = `${entry.tradeSlug}|${entry.familySlug}|${entry.serviceSlug}`;
    assert(!seen.has(key), `Doppelter Service-Slug innerhalb einer Familie: ${key}`);
    seen.add(key);
  }
  checks.push({ rule: "no_duplicate_service_slug_in_family", status: "ok" });
}

function checkRequiredCrosslinks() {
  const required = [
    { familyName: "Loftwände & Stahl-Glas-Systeme", links: ["glaserarbeiten", "innenausbau"] },
    { familyName: "Systemböden & Hohlraumböden", links: ["bodenlegerarbeiten", "netzwerktechnik", "kaelte-klima"] },
  ];
  for (const item of required) {
    const familyEntries = entries.filter((entry) => entry.familyName === item.familyName);
    assert(familyEntries.length > 0, `${item.familyName} fehlt.`);
    for (const link of item.links) {
      assert(tradeSlugs.has(link), `Crosslink-Ziel ${link} fuer ${item.familyName} existiert nicht als Gewerk.`);
      assert(familyEntries.some((entry) => entry.crosslinks.includes(link)), `${item.familyName} fehlt Crosslink ${link}.`);
    }
  }
  checks.push({ rule: "required_crosslinks_exist", status: "ok" });
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
  const dir = path.join(tmpdir(), "gewerkeliste-service-taxonomy-test");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "empty.mjs"), "export {};\n");
  const outputPath = path.join(dir, `service-taxonomy-${Date.now()}.mjs`);
  await writeFile(outputPath, compiled);
  return import(pathToFileURL(outputPath).href);
}

function summarize(entry) {
  return {
    group: entry.groupName,
    trade: entry.tradeSlug,
    family: entry.familyName,
    service: entry.serviceName,
    score: entry.score,
  };
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Service-Taxonomie-Test fehlgeschlagen: ${message}`);
    process.exit(1);
  }
}
