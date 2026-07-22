import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const headerSource = await readFile(new URL("../components/site-header.tsx", import.meta.url), "utf8");
const pricingSource = await readFile(new URL("../app/preise/page.tsx", import.meta.url), "utf8");
const sitemapSource = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");

test("keeps the public header navigation in the product-owner order", () => {
  const items = [...headerSource.matchAll(/\{ label: "([^"]+)", href: "([^"]+)"(?:, primary: true)? \}/g)].map((match) => [match[1], match[2]]);

  const expectedPublicHeaderItems = [
    ["Suche", "/suche"],
    ["Gewerke", "/gewerke"],
    ["Betriebe", "/fuer-betriebe"],
    ["Preise", "/preise"],
    ["Über uns", "/ueber-gewerkeliste"],
  ];

  assert.deepEqual(items, expectedPublicHeaderItems);
  assert.match(headerSource, /\{ label: "Preise", href: "\/preise" \}/, "Preise muss dauerhaft im Hauptmenü bleiben.");
  assert.match(headerSource, /href="\/eintrag-beanspruchen"[\s\S]*?Eintrag beanspruchen/);
  assert.match(headerSource, /aria-current=\{active \? "page" : undefined\}/);
  assert.doesNotMatch(headerSource, /label: "Für Betriebe"/);
});

test("publishes a real prices page based on the central profile contract", () => {
  assert.match(pricingSource, /@\/lib\/profile-plans/);
  assert.match(pricingSource, /BASIS_PROFILE/);
  assert.match(pricingSource, /VERIFIED_START_PROFILE/);
  assert.match(pricingSource, /verifiedStartPriceSummary/);
  assert.match(pricingSource, /Das verifizierte Startprofil wird freigeschaltet, sobald alle zugesagten Funktionen vollständig verfügbar und geprüft sind\. Aktuell ist es noch nicht buchbar\./);
  assert.match(pricingSource, /Kein Monatsabo/);
  assert.match(pricingSource, /Keine automatische Verlängerung/);
  assert.match(pricingSource, /Kein Pay-to-rank und kein künstlicher Rankingvorteil/);
  assert.match(pricingSource, /priceSummary\.totalPriceWithNet/);
  assert.doesNotMatch(pricingSource, /490\s*€/);
  assert.doesNotMatch(pricingSource, /Jetzt (kaufen|sichern|bestellen|buchen)/i);
  assert.doesNotMatch(pricingSource, /href="\/eintrag-beanspruchen"/);
});

test("includes the public prices route in the sitemap", () => {
  assert.match(sitemapSource, /\$\{baseUrl}\/preise/);
});
