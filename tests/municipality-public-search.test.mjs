import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getPilotMunicipalityByAgs,
  resolvePilotMunicipalitySearch,
} from "../lib/municipality-catalog.ts";

const publicDirectorySource = await readFile(new URL("../lib/data/public-directory.ts", import.meta.url), "utf8");
const searchPageSource = await readFile(new URL("../app/suche/page.tsx", import.meta.url), "utf8");

test("municipality search resolves exact names, slugs, AGS codes, and German input", () => {
  assert.equal(resolvePilotMunicipalitySearch("Riedering")?.ags, "09187167");
  assert.equal(resolvePilotMunicipalitySearch("riedering-09187167")?.name, "Riedering");
  assert.equal(resolvePilotMunicipalitySearch("09187167")?.slug, "riedering-09187167");
  assert.equal(resolvePilotMunicipalitySearch("München")?.ags, undefined);
  assert.equal(resolvePilotMunicipalitySearch("Riedering West"), null);
  assert.equal(getPilotMunicipalityByAgs("09187167")?.selectionEnabled, true);
});

test("public municipality search uses only enabled municipalities and approved public assignments", () => {
  assert.match(publicDirectorySource, /resolvePilotMunicipalitySearch\(params\?\.location\)/);
  assert.match(publicDirectorySource, /\.from\("municipalities"\)/);
  assert.match(publicDirectorySource, /\.eq\("selection_enabled", true\)/);
  assert.match(publicDirectorySource, /\.from\("company_service_areas"\)/);
  assert.match(publicDirectorySource, /\.eq\("status", "approved"\)/);
  assert.match(publicDirectorySource, /\.select\("company_id"\)/);
  assert.match(publicDirectorySource, /\.eq\("public_visible", true\)/);
  assert.match(publicDirectorySource, /return null/);
});

test("search UI explains that exact municipality mode does not widen by radius", () => {
  assert.match(searchPageSource, /Exakte Gemeindesuche für/);
  assert.match(searchPageSource, /Die Umkreisauswahl erweitert diese Suche nicht/);
});
