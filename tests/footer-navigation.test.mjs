import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const appRoot = join(repositoryRoot, "app");
const footerSource = await readFile(join(repositoryRoot, "components", "legal-footer.tsx"), "utf8");
const headerSource = await readFile(join(repositoryRoot, "components", "site-header.tsx"), "utf8");
const homeSource = await readFile(join(repositoryRoot, "app", "page.tsx"), "utf8");
const sitemapSource = await readFile(join(repositoryRoot, "app", "sitemap.ts"), "utf8");
const footerLinks = [...footerSource.matchAll(/href="(\/[^\"]+)"/g)].map((match) => match[1]);
const appRoutes = new Set(await collectPageRoutes(appRoot));

test("footer exposes only existing internal routes", () => {
  assert.deepEqual(footerLinks, [
    "/suche",
    "/gewerke",
    "/fuer-betriebe",
    "/betrieb-eintragen",
    "/eintrag-beanspruchen",
    "/hilfe",
    "/daten-korrigieren",
    "/ueber-gewerkeliste",
    "/impressum",
    "/datenschutz",
  ]);
  assert.equal(new Set(footerLinks).size, footerLinks.length);

  for (const href of footerLinks) {
    assert.equal(appRoutes.has(href), true, `Footer-Ziel ${href} hat keine vorhandene page.tsx-Route.`);
  }
});

test("help and correction routes are included in the public sitemap", () => {
  assert.match(sitemapSource, /\$\{baseUrl\}\/hilfe/);
  assert.match(sitemapSource, /\$\{baseUrl\}\/daten-korrigieren/);
});

test("public header makes the directory search the primary navigation", () => {
  assert.match(headerSource, /\{ label: "Suche", href: "\/suche", primary: true \}/);
  assert.match(headerSource, /aria-label=\{item\.primary \? "GewerkeListe durchsuchen"/);
});

test("homepage presents the directory search before the supporting video", () => {
  const searchIndex = homeSource.indexOf("Fachbetriebe suchen");
  const videoIndex = homeSource.indexOf("<video");

  assert.ok(searchIndex >= 0, "Homepage needs a prominent directory search entry.");
  assert.ok(videoIndex >= 0, "Homepage should keep the supporting Baupraxis video.");
  assert.ok(searchIndex < videoIndex, "Directory search must appear before the supporting video.");
});

async function collectPageRoutes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      routes.push(...(await collectPageRoutes(path)));
      continue;
    }
    if (entry.name !== "page.tsx") continue;

    const routeDirectory = relative(appRoot, dirname(path)).split(sep).filter(Boolean);
    routes.push(routeDirectory.length ? `/${routeDirectory.join("/")}` : "/");
  }

  return routes;
}
