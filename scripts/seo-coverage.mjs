#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const today = new Date().toISOString().slice(0, 10);
const reportsDir = "reports";
const outputPath = path.join(reportsDir, `seo-coverage-${today}.md`);

const dryRunPath = await latestReport(/^service-enrichment-dry-run-\d{4}-\d{2}-\d{2}\.json$/);
const reviewCsvPath = await latestReport(/^service-enrichment-review-\d{4}-\d{2}-\d{2}\.csv$/);
const dryRun = dryRunPath ? JSON.parse(await readFile(dryRunPath, "utf8")) : null;
const reviewRows = reviewCsvPath ? parseCsv(await readFile(reviewCsvPath, "utf8")) : [];
const sitemapSource = await readFile("app/sitemap.ts", "utf8");
const robotsSource = await readFile("app/robots.ts", "utf8");

const reviewCategoryCounts = countBy(reviewRows, "review_category");
const approvedRows = reviewRows.filter((row) => row.reviewer_decision === "approved");
const rejectedRows = reviewRows.filter((row) => row.reviewer_decision === "rejected");

const lines = [
  `# SEO Coverage Report (${today})`,
  "",
  "## Datenquellen",
  `- Service-Enrichment-Dry-Run: ${dryRunPath || "nicht gefunden"}`,
  `- Review-CSV: ${reviewCsvPath || "nicht gefunden"}`,
  "- Live-Datenbank: nicht gelesen",
  "- Externe Scrapes: nicht ausgeführt",
  "",
  "## Indexierbare Seitentypen laut Sitemap-Logik",
  "- Startseite: immer enthalten",
  "- /gewerke: immer enthalten",
  "- /orte: immer enthalten",
  "- /leistungen: immer enthalten",
  "- /betriebe: immer enthalten",
  "- /betrieb-eintragen, /fuer-betriebe, /ueber-gewerkeliste, /impressum, /datenschutz: enthalten",
  "- /firma/[slug]: nur öffentliche Firmenprofile aus `companies.public_visible = true`",
  "- /gewerke/[slug]: nur Gewerke mit mindestens einem öffentlichen Betrieb",
  "- /gewerke/[slug]/[ort]: nur echte Gewerk-Ort-Kombinationen aus öffentlichen Betrieben",
  "- /orte/[ort]: nur Orte mit öffentlichen Betrieben",
  "- /leistungen/[slug]: nur wenn Service-Location-Treffer einen echten Leistungs-Slug liefern",
  "- /leistungen/[slug]/[ort]: nur echte Leistung-Ort-Kombinationen",
  "",
  "## Bewusst noindex / ausgeschlossen",
  "- Admin-, API-, Planner-, Companies- und Trades-Internseiten sind in robots.txt blockiert.",
  "- Claim- und Profilergänzungsseiten werden nicht in die Sitemap aufgenommen.",
  "- Leistung- und Leistung-Ort-Seiten setzen `noindex, follow`, wenn keine echten Treffer geladen werden.",
  "- Leere Ortsseiten werfen 404 statt indexierbarer Boilerplate-Seiten.",
  "",
  "## Service-Enrichment-Coverage",
  `- Geprüfte Betriebe: ${dryRun?.summary?.reviewed_companies ?? 0}`,
  `- Kandidaten gesamt: ${dryRun?.summary?.candidates_total ?? 0}`,
  `- High: ${dryRun?.summary?.by_confidence?.high ?? 0}`,
  `- Medium: ${dryRun?.summary?.by_confidence?.medium ?? 0}`,
  `- Low: ${dryRun?.summary?.by_confidence?.low ?? 0}`,
  `- Potenzielle /leistungen/[slug]: ${dryRun?.summary?.service_pages_after_review ?? 0}`,
  `- Potenzielle /leistungen/[slug]/[ort]: ${dryRun?.summary?.service_location_pages_after_review ?? 0}`,
  `- Konflikte/Mehrdeutigkeiten: ${dryRun?.summary?.conflicts_total ?? 0}`,
  "",
  "## Review-Status",
  ...Object.entries(reviewCategoryCounts).sort((a, b) => b[1] - a[1]).map(([category, count]) => `- ${category}: ${count}`),
  `- APPROVED: ${approvedRows.length}`,
  `- REJECTED: ${rejectedRows.length}`,
  "",
  "## Top Leistungen nach Kandidaten",
  ...topList(dryRun?.top_services, "service_name", "count"),
  "",
  "## Top Orte nach Kandidaten",
  ...topList(dryRun?.top_locations, "city", "count"),
  "",
  "## Top Gewerk-Leistung-Kombinationen",
  ...topTradeServiceList(dryRun?.top_trade_service_combinations),
  "",
  "## Aktuelle Datenhebel",
  "- High-Kandidaten zuerst manuell prüfen und explizit freigeben.",
  "- Medium-Kandidaten nach Gewerk priorisieren, besonders Elektro, Bauunternehmen, Sanitär/Heizung und Dach.",
  "- Low-Kandidaten nicht automatisch übernehmen.",
  "- Ambiguous-Kandidaten nur mit klarer Evidence übernehmen.",
  "- Nach freigegebenen direkten Leistungszuordnungen Sitemap erneut prüfen.",
  "",
  "## Technische Risiken",
  `- Sitemap nutzt Service-Treffer erst, wenn ${sitemapSource.includes("getPublicServiceLocationSitemapEntries") ? "Service-Location-Daten vorhanden sind" : "die Service-Sitemap-Funktion ergänzt wird"}.`,
  `- Robots blockiert Admin/API: ${robotsSource.includes("/admin/") && robotsSource.includes("/api/") ? "ja" : "prüfen"}.`,
  "- `company_services` existiert, braucht aber geprüfte Decisions/Evidence, bevor Leistungsseiten breit indexierbar werden.",
  "",
  "## Empfehlung",
  "1. Review-Decision-Struktur anwenden, aber erst nach expliziter Freigabe.",
  "2. High-Kandidaten im Admin-Review als erste Charge manuell entscheiden.",
  "3. Erst danach einzelne APPROVED-Kandidaten nach `company_services` übernehmen.",
  "4. Danach `npm run seo:coverage` erneut ausführen und Sitemap/Preview prüfen.",
  "",
];

await writeFile(outputPath, `${lines.join("\n")}\n`);
console.log(JSON.stringify({ status: "ok", output: outputPath, dry_run: dryRunPath, review_csv: reviewCsvPath }, null, 2));

async function latestReport(pattern) {
  const files = await readdir(reportsDir).catch(() => []);
  const matches = files.filter((file) => pattern.test(file)).sort();
  return matches.length ? path.join(reportsDir, matches[matches.length - 1]) : null;
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row[key] || "EMPTY";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function topList(items, labelKey, countKey) {
  if (!Array.isArray(items) || !items.length) return ["- keine Daten"];
  return items.slice(0, 20).map((item) => `- ${item[labelKey] || item.slug || item.city}: ${item[countKey] || 0}`);
}

function topTradeServiceList(items) {
  if (!Array.isArray(items) || !items.length) return ["- keine Daten"];
  return items.slice(0, 20).map((item) => `- ${item.trade_name || item.trade_slug} -> ${item.service_name || item.service_slug}: ${item.count || 0}`);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift() || "");
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}
