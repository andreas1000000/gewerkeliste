import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildCompanySearchQueries } from "../lib/search/search-provider.ts";
import { rankCompanyWebsiteResult } from "../lib/search/rank-company-website.ts";

const enrichmentSource = await readFile(new URL("../scripts/enrich-company.mjs", import.meta.url), "utf8");

test("official company websites outrank directory results and directories stay rejected", () => {
  const context = {
    companyName: "Wagner Spielvogel GmbH",
    city: "Riedering",
    postalCode: "83083",
    tradeHint: "Bau",
  };
  const official = rankCompanyWebsiteResult(
    {
      title: "Wagner Spielvogel GmbH | Bauunternehmen",
      url: "https://www.wagner-spielvogel.de/",
      snippet: "Bauunternehmen in Riedering, 83083. Leistungen und Kontakt.",
      source: "test",
      rank: 4,
    },
    context,
  );
  const directory = rankCompanyWebsiteResult(
    {
      title: "Wagner Spielvogel GmbH - Branchenverzeichnis",
      url: "https://www.gelbeseiten.de/gsbiz/wagner-spielvogel",
      snippet: "Bauunternehmen in Riedering, 83083.",
      source: "test",
      rank: 1,
    },
    context,
  );

  assert.equal(official.rejected, false);
  assert.equal(directory.rejected, true);
  assert.ok(official.score > directory.score);
});

test("website discovery queries cover identity, legal notice, contact, services and location", () => {
  const queries = buildCompanySearchQueries({
    companyName: "Wagner Spielvogel GmbH",
    city: "Riedering",
    postalCode: "83083",
    tradeHint: "Bau",
  });

  assert.deepEqual(queries, [
    "Wagner Spielvogel GmbH",
    "Wagner Spielvogel GmbH Riedering",
    "Wagner Spielvogel GmbH Impressum",
    "Wagner Spielvogel GmbH Kontakt",
    "Wagner Spielvogel GmbH Leistungen",
    "Wagner Spielvogel GmbH Bau Riedering",
    "Wagner Spielvogel GmbH 83083",
  ]);
});

test("live enrichment plans do not insert a source URL that already exists", () => {
  assert.match(enrichmentSource, /existingSourceUrls/);
  assert.match(enrichmentSource, /!existingSourceUrls\.has\(normalizeUrl\(source\.url\)\)/);
  assert.match(enrichmentSource, /sourceUrlsToInsert/);
});
