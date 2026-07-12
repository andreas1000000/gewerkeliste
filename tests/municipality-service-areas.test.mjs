import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getPilotMunicipalityByAgs,
  getPilotMunicipalityBySlug,
  municipalityManifest,
  normalizeMunicipalityCodes,
  pilotCounties,
  pilotMunicipalities,
  validatePilotMunicipalityCodes,
} from "../lib/municipality-catalog.ts";

const geoJsonText = readFileSync(new URL("../public/geo/municipality-pilot.geojson", import.meta.url), "utf8");
const geoJson = JSON.parse(geoJsonText);
const geoJsonSha256 = createHash("sha256").update(geoJsonText).digest("hex");
const migration = readFileSync(new URL("../supabase/migrations/20260712150000_municipality_service_areas.sql", import.meta.url), "utf8");
const seedMigration = readFileSync(new URL("../supabase/migrations/20260712150100_municipality_catalog_seed.sql", import.meta.url), "utf8");
const pickerSource = readFileSync(new URL("../components/municipality-service-area-picker.tsx", import.meta.url), "utf8");
const importerSource = readFileSync(new URL("../scripts/import-vg250.mjs", import.meta.url), "utf8");

test("pilot catalog contains only the seven official target counties", () => {
  assert.equal(pilotMunicipalities.length, 180);
  assert.deepEqual(pilotCounties.map((county) => county.code).sort(), ["09163", "09175", "09182", "09183", "09184", "09187", "09189"]);
  assert.equal(new Set(pilotMunicipalities.map((municipality) => municipality.ags)).size, pilotMunicipalities.length);
  assert.equal(pilotMunicipalities.every((municipality) => /^\d{8}$/.test(municipality.ags)), true);
  assert.equal(pilotMunicipalities.every((municipality) => municipality.stateCode === "09" && municipality.stateName === "Bayern"), true);
  assert.equal(pilotMunicipalities.some((municipality) => ["Anzinger Forst", "Ebersberger Forst", "Eglhartinger Forst", "Mühldorfer Hart", "Forstenrieder Park", "Grünwalder Forst", "Perlacher Forst", "Rotter Forst-Nord", "Rotter Forst-Süd", "Chiemsee (See)", "Waginger See"].includes(municipality.name)), false);
  assert.equal(pilotMunicipalities.some((municipality) => municipality.name === "Kufstein"), false);
  assert.equal(municipalityManifest.dataAsOf, "2025-01-01");
  assert.match(municipalityManifest.source.sourceFileSha256, /^[a-f0-9]{64}$/);
  assert.match(municipalityManifest.source.dataSourcesUrl, /^https:\/\//);
  assert.equal(municipalityManifest.source.sourceFileSha256, "b16b97d8f2ae0ce59ae6139617b60bb550f652f4b6db1a0c74417b2105bab33e");
  assert.equal(municipalityManifest.geometry.sha256, geoJsonSha256);
  assert.match(municipalityManifest.source.transformation, /mapshaper 0\.7\.45 weighted Visvalingam/);
  assert.match(importerSource, /"weighted"/);
  assert.doesNotMatch(importerSource, /method=visvalingam/);
});

test("catalog and geometry use the same stable AGS identifiers", () => {
  assert.equal(geoJson.type, "FeatureCollection");
  assert.equal(geoJson.features.length, pilotMunicipalities.length);
  assert.equal(new Set(geoJson.features.map((feature) => feature.id)).size, geoJson.features.length);
  for (const municipality of pilotMunicipalities) {
    const feature = geoJson.features.find((item) => item.id === municipality.ags);
    assert.ok(feature, `Geometrie fehlt für ${municipality.ags}`);
    assert.equal(feature.properties.ags, municipality.ags);
    assert.equal(feature.properties.countyCode, municipality.countyCode);
    assert.ok(feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon");
    const rings = feature.geometry.type === "Polygon" ? feature.geometry.coordinates : feature.geometry.coordinates.flat();
    assert.ok(rings.every((ring) => Array.isArray(ring) && ring.length >= 4 && ring.every((coordinate) => Array.isArray(coordinate) && coordinate.length >= 2 && coordinate.every(Number.isFinite))));
  }
});

test("allowlist validation deduplicates valid codes and rejects unknown or disabled codes", () => {
  const known = pilotMunicipalities[0].ags;
  assert.deepEqual(normalizeMunicipalityCodes([known, known, " "]), [known]);
  assert.deepEqual(validatePilotMunicipalityCodes([known, known]), {
    valid: true,
    validCodes: [known],
    invalidCodes: [],
  });
  const invalid = validatePilotMunicipalityCodes([known, "99999999"]);
  assert.equal(invalid.valid, false);
  assert.deepEqual(invalid.invalidCodes, ["99999999"]);
  assert.equal(getPilotMunicipalityByAgs(known)?.slug, `${pilotMunicipalities[0].slug}`);
  assert.equal(getPilotMunicipalityBySlug(pilotMunicipalities[0].slug)?.ags, known);
});

test("migration models pending and approved municipality assignments without public anon access", () => {
  assert.match(migration, /create table if not exists municipalities/);
  assert.match(migration, /ags text primary key/);
  assert.match(migration, /create table if not exists company_submission_service_areas/);
  assert.match(migration, /create table if not exists company_service_areas/);
  assert.match(migration, /unique \(submission_id, municipality_ags\)/);
  assert.match(migration, /unique \(company_id, municipality_ags\)/);
  assert.match(migration, /status in \('submitted', 'in_review', 'approved', 'rejected'\)/g);
  assert.match(migration, /jsonb_array_elements_text\(new\.municipality_codes\)/);
  assert.match(migration, /enable row level security/);
  assert.doesNotMatch(migration, /to anon/);
  assert.doesNotMatch(migration, /to authenticated/);
  assert.match(seedMigration, /insert into municipalities/);
  assert.equal((seedMigration.match(/\('[0-9]{8}',/g) || []).length, pilotMunicipalities.length);
  assert.match(seedMigration, /Source SHA256: [a-f0-9]{64}/);
  assert.match(seedMigration, /GeoJSON SHA256: [a-f0-9]{64}/);
  assert.match(seedMigration, new RegExp(`Source SHA256: ${municipalityManifest.source.sourceFileSha256}`));
  assert.match(seedMigration, new RegExp(`GeoJSON SHA256: ${municipalityManifest.geometry.sha256}`));
});

test("picker is local, list-first accessible, and has no external map runtime dependency", () => {
  assert.match(pickerSource, /fetch\("\/geo\/municipality-pilot\.geojson"/);
  assert.match(pickerSource, /Gemeindeliste – vollständig bedienbar/);
  assert.ok(pickerSource.indexOf("Gemeindeliste – vollständig bedienbar</div>") < pickerSource.indexOf("Gemeindekarte</div>"));
  assert.match(pickerSource, /validSelectedCodes/);
  assert.match(pickerSource, /isGeoJson\(value\)/);
  assert.match(pickerSource, /isMultiPolygonCoordinates/);
  assert.match(pickerSource, /selectableAgs/);
  assert.match(pickerSource, /focus-visible:outline/);
  assert.match(pickerSource, /role="alert"/);
  assert.match(pickerSource, /role="button"/);
  assert.match(pickerSource, /onKeyDown/);
  assert.doesNotMatch(pickerSource, /google|mapbox|here\.com|bing\.com|tile/i);
});
