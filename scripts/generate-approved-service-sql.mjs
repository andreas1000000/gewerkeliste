#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const today = new Date().toISOString().slice(0, 10);
const planPath = path.join("reports", "service-approval-apply-plan-2026-07-02.json");
const dryRunPath = path.join("reports", "service-enrichment-dry-run-2026-07-01.json");
const outputPath = path.join("reports", `approved-service-apply-${today}.sql`);
const precheckPath = path.join("reports", `approved-service-company-precheck-${today}.sql`);
const targetServiceTrades = new Map([
  ["hochbau", "bauunternehmen"],
  ["umbau", "bauunternehmen"],
  ["architektur", "architekt"],
  ["dachsanierung", "dachdeckerarbeiten"],
]);
const excludedProductionLookups = new Set([
  "Planungsbüro Georg Gschwendtner|Reischenhart|architektur",
]);

const taxonomyModule = await importServiceTaxonomyModule();
const plan = JSON.parse(await readFile(planPath, "utf8"));
const dryRun = JSON.parse(await readFile(dryRunPath, "utf8"));
const candidateByKey = new Map((dryRun.candidates || []).map((candidate) => [`${candidate.company_id}|${candidate.service_slug}`, candidate]));
const rows = (Array.isArray(plan.rows) ? plan.rows : []).filter((row) => {
  const candidate = candidateByKey.get(`${row.company_id}|${row.service_slug}`);
  return !excludedProductionLookups.has(`${candidate?.company_name}|${candidate?.city}|${row.service_slug}`);
});
const serviceEntries = findTargetServices(taxonomyModule.serviceTaxonomy);

const sql = [
  "-- Generated approved service apply SQL.",
  "-- Scope: only READY_TO_APPROVE high-priority service assignments from 2026-07-02.",
  "-- No Medium, Low or Ambiguous candidates included.",
  "begin;",
  "",
  ...serviceEntries.flatMap(renderServiceSql),
  "",
  ...rows.map(renderCompanyServiceSql),
  "",
  "commit;",
  "",
].join("\n");

await writeFile(outputPath, sql);
await writeFile(precheckPath, renderPrecheckSql(rows));

console.log(JSON.stringify({
  status: "ok",
  output: outputPath,
  precheck: precheckPath,
  services: serviceEntries.map((entry) => `${entry.trade.slug}/${entry.service.slug}`),
  company_service_rows: rows.length,
}, null, 2));

function findTargetServices(taxonomy) {
  const entries = [];
  for (const group of taxonomy) {
    for (const trade of group.trades) {
      for (const family of trade.families) {
        for (const service of family.services) {
          if (targetServiceTrades.get(service.slug) !== trade.slug) continue;
          entries.push({ group, trade, family, service });
        }
      }
    }
  }
  const found = new Set(entries.map((entry) => entry.service.slug));
  for (const slug of targetServiceTrades.keys()) {
    if (!found.has(slug)) throw new Error(`Missing target service in taxonomy: ${slug}`);
  }
  return entries.sort((a, b) => a.service.slug.localeCompare(b.service.slug));
}

function renderServiceSql({ group, trade, family, service }) {
  return [
    `insert into trade_groups (name, slug, description, sort_order, is_active) values (${q(group.name)}, ${q(group.slug)}, ${q(group.description)}, ${n(group.sortOrder)}, true) on conflict (slug) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order, is_active = true;`,
    `insert into trades (name, slug, description, sort_order, is_active, trade_group_id) values (${q(trade.name)}, ${q(trade.slug)}, ${q(trade.description)}, 0, true, (select id from trade_groups where slug = ${q(group.slug)})) on conflict (slug) do update set name = excluded.name, description = excluded.description, is_active = true, trade_group_id = excluded.trade_group_id;`,
    `insert into service_families (trade_id, name, slug, description, sort_order, is_active) values ((select id from trades where slug = ${q(trade.slug)}), ${q(family.name)}, ${q(family.slug)}, ${q(family.description)}, 0, true) on conflict (trade_id, slug) do update set name = excluded.name, description = excluded.description, is_active = true;`,
    `insert into services (service_family_id, name, slug, description, search_weight, sort_order, seo_enabled, is_popular, is_active) values ((select sf.id from service_families sf join trades t on t.id = sf.trade_id where t.slug = ${q(trade.slug)} and sf.slug = ${q(family.slug)}), ${q(service.name)}, ${q(service.slug)}, ${q(service.description)}, ${n(service.searchWeight || 70)}, 0, true, ${service.isPopular ? "true" : "false"}, true) on conflict (service_family_id, slug) do update set name = excluded.name, description = excluded.description, search_weight = excluded.search_weight, seo_enabled = true, is_popular = excluded.is_popular, is_active = true;`,
  ];
}

function renderCompanyServiceSql(row) {
  if (row.no_live_write !== true || row.approved_status !== "pending" || row.confidence !== "high") {
    throw new Error(`Unsafe apply row: ${JSON.stringify(row)}`);
  }
  const tradeSlug = targetServiceTrades.get(row.service_slug);
  if (!tradeSlug) throw new Error(`Missing target trade for service ${row.service_slug}`);
  const candidate = candidateByKey.get(`${row.company_id}|${row.service_slug}`);
  if (!candidate?.company_name || !candidate?.city) throw new Error(`Missing company lookup fields for ${row.company_id}/${row.service_slug}`);
  return `insert into company_services (company_id, service_id, confidence_score, source, status) values ((select id from companies where name = ${q(candidate.company_name)} and city = ${q(candidate.city)} and public_visible = true limit 1), (select s.id from services s join service_families sf on sf.id = s.service_family_id join trades t on t.id = sf.trade_id where s.slug = ${q(row.service_slug)} and t.slug = ${q(tradeSlug)}), 95, 'service_approval_high_priority_review', 'confirmed') on conflict (company_id, service_id) do update set confidence_score = greatest(company_services.confidence_score, excluded.confidence_score), source = excluded.source, status = 'confirmed', updated_at = now();`;
}

function renderPrecheckSql(rows) {
  const values = rows.map((row) => {
    const candidate = candidateByKey.get(`${row.company_id}|${row.service_slug}`);
    if (!candidate?.company_name || !candidate?.city) throw new Error(`Missing company lookup fields for ${row.company_id}/${row.service_slug}`);
    return `(${q(candidate.company_name)}, ${q(candidate.city)}, ${q(row.service_slug)})`;
  });

  return [
    "with candidates(company_name, city, service_slug) as (",
    "  values",
    values.map((value, index) => `  ${value}${index === values.length - 1 ? "" : ","}`).join("\n"),
    ")",
    "select c.company_name, c.city, c.service_slug, count(co.id) as production_matches",
    "from candidates c",
    "left join companies co on co.name = c.company_name and co.city = c.city and co.public_visible = true",
    "group by c.company_name, c.city, c.service_slug",
    "order by production_matches, c.company_name;",
    "",
  ].join("\n");
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
  const dir = path.join(tmpdir(), "gewerkeliste-approved-service-sql");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "empty.mjs"), "export {};\n");
  const outputPath = path.join(dir, `service-taxonomy-${Date.now()}.mjs`);
  await writeFile(outputPath, compiled);
  return import(pathToFileURL(outputPath).href);
}

function q(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function n(value) {
  return Number.isFinite(Number(value)) ? String(Number(value)) : "0";
}
