import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile("app/aktuelles/gewerkeliste-im-rocketinsider/page.tsx", "utf8");
const home = await readFile("app/page.tsx", "utf8");
const sitemap = await readFile("app/sitemap.ts", "utf8");

test("RocketInsider article is indexable, source-separated, and metadata-ready", () => {
  assert.match(page, /canonical: "\/aktuelles\/gewerkeliste-im-rocketinsider"/);
  assert.match(page, /type: "article"/);
  assert.match(page, /"@type": "Article"/);
  assert.match(page, /ROCkET – Gründungszentrum der Technischen Hochschule Rosenheim/);
  assert.match(page, /Interview, Seiten 9–10/);
  assert.match(page, /Aussage von Andreas Moser im ROCkETinsider, Juli 2026/);
  assert.match(page, /Mitarbeit%20%2F%20Hochschulkooperation/);
  assert.match(page, /keine formale Hochschulpartnerschaft, Empfehlung, Förderung oder Zertifizierung/);
});

test("publication uses the official archive without inventing a PDF or logo asset", () => {
  assert.match(page, /https:\/\/www\.th-rosenheim\.de\/forschung-innovation\/entrepreneurship\/newsletter-rocketinsider/);
  assert.match(page, /Eine direkte öffentliche PDF-URL der Ausgabe\s+Juli 2026 ist derzeit nicht belastbar dokumentiert/);
  assert.doesNotMatch(page, /<img/);
  assert.doesNotMatch(page, /rocketinsider-juli-2026-gewerkeliste\.pdf/);
});

test("home page contains a compact publication trust block and sitemap entry", () => {
  assert.match(home, /<RocketInsiderHighlight \/>/);
  assert.match(sitemap, /\/aktuelles\/gewerkeliste-im-rocketinsider/);
});
