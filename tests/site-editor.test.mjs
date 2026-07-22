import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const editorSource = await readFile(new URL("../components/site-editor.tsx", import.meta.url), "utf8");
const editorPageSource = await readFile(new URL("../app/admin/site-editor/page.tsx", import.meta.url), "utf8");
const contentSource = await readFile(new URL("../lib/site-page-content.ts", import.meta.url), "utf8");
const migrationSource = await readFile(new URL("../supabase/migrations/20260722180000_site_page_content.sql", import.meta.url), "utf8");
const homeSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const pricesSource = await readFile(new URL("../app/preise/page.tsx", import.meta.url), "utf8");

test("site editor provides draft, publish and preview controls", () => {
  assert.match(editorSource, /Entwurf speichern/);
  assert.match(editorSource, /Veröffentlichen/);
  assert.match(editorSource, /Live-Vorschau/);
  assert.match(editorPageSource, /20260722180000_site_page_content\.sql/);
});

test("site content accepts only safe internal links", () => {
  assert.match(contentSource, /startsWith\("\/"\)/);
  assert.match(contentSource, /startsWith\("\/\/"\)/);
  assert.match(contentSource, /\\r\\n/);
});

test("pricing hero claims remain protected while internal button links are connected", async () => {
  assert.match(contentSource, /pageKey === "prices"/);
  assert.match(editorSource, /disabled=\{selectedPage\.key === "prices"\}/);
  assert.match(homeSource, /href=\{pageContent\.primaryHref as Route\}/);
  assert.match(pricesSource, /href=\{pageContent\.primaryHref as Route\}/);
});

test("site content storage is service-role-only", () => {
  assert.match(migrationSource, /revoke all privileges on public\.site_page_content from anon, authenticated/);
  assert.match(migrationSource, /grant select, insert, update, delete on public\.site_page_content to service_role/);
});

test("public pages read published content without replacing protected pricing logic", () => {
  assert.match(homeSource, /getPublishedPageContent\("home"\)/);
  assert.match(pricesSource, /getPublishedPageContent\("prices"\)/);
  assert.match(pricesSource, /VERIFIED_START_PROFILE/);
  assert.match(pricesSource, /href=\{pageContent\.primaryHref as Route\}/);
});
