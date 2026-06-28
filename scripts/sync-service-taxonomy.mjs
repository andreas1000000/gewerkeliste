#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { requireLiveConfirmation, requireSupabaseSafety } from "./safety-gates.mjs";

const args = parseArgs(process.argv.slice(2));
const live = Boolean(args.live);
const taxonomyModule = await importServiceTaxonomyModule();
const { serviceTaxonomy, serviceActivities, serviceContexts } = taxonomyModule;

const report = {
  mode: live ? "live" : "dry_run",
  groups: serviceTaxonomy.length,
  trades: unique(serviceTaxonomy.flatMap((group) => group.trades.map((trade) => trade.slug))).length,
  service_families: serviceTaxonomy.flatMap((group) => group.trades.flatMap((trade) => trade.families)).length,
  services: serviceTaxonomy.flatMap((group) => group.trades.flatMap((trade) => trade.families.flatMap((family) => family.services))).length,
  service_aliases: serviceTaxonomy.flatMap((group) => group.trades.flatMap((trade) => trade.families.flatMap((family) => family.services.flatMap((service) => service.aliases)))).length,
  activities: serviceActivities.length,
  contexts: serviceContexts.length,
  upserted: {
    trade_groups: 0,
    trades: 0,
    service_families: 0,
    services: 0,
    service_aliases: 0,
    activities: 0,
    service_activities: 0,
    contexts: 0,
    service_contexts: 0,
    service_crosslinks: 0,
  },
  warnings: [],
};

if (!live) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

requireLiveConfirmation({
  args,
  action: "sync-service-taxonomy-live",
  reason: "Service-Taxonomie-Sync schreibt Hauptgruppen, Gewerke, Leistungsfamilien, Spezialleistungen, Aliases, Taetigkeiten und Kontexte.",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!supabaseUrl || !serviceRoleKey) fail("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY muessen gesetzt sein.");
requireSupabaseSafety({ args, url: supabaseUrl, live, action: "sync-service-taxonomy-live" });

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

await assertTables();
const groupIds = await syncTradeGroups();
const tradeIds = await syncTrades(groupIds);
const familyIds = await syncFamilies(tradeIds);
const serviceIds = await syncServices(familyIds);
const activityIds = await syncActivities();
const contextIds = await syncContexts();
await syncServiceAliases(serviceIds);
await syncServiceActivities(serviceIds, activityIds);
await syncServiceContexts(serviceIds, contextIds);
await syncCrosslinks(serviceIds);

console.log(JSON.stringify(report, null, 2));

async function syncTradeGroups() {
  const rows = serviceTaxonomy.map((group) => ({
    name: group.name,
    slug: group.slug,
    description: group.description,
    sort_order: group.sortOrder,
    is_active: true,
  }));
  const data = await upsert("trade_groups", rows, "slug", "id,slug");
  report.upserted.trade_groups = data.length;
  return new Map(data.map((row) => [row.slug, row.id]));
}

async function syncTrades(groupIds) {
  const rows = serviceTaxonomy.flatMap((group) =>
    group.trades.map((trade, index) => ({
      slug: trade.slug,
      name: trade.name,
      description: trade.description,
      trade_group_id: groupIds.get(group.slug),
      sort_order: index + 1,
      is_active: true,
    })),
  );
  const data = await upsert("trades", rows, "slug", "id,slug");
  report.upserted.trades = data.length;
  return new Map(data.map((row) => [row.slug, row.id]));
}

async function syncFamilies(tradeIds) {
  const rows = [];
  for (const group of serviceTaxonomy) {
    for (const trade of group.trades) {
      const tradeId = tradeIds.get(trade.slug);
      if (!tradeId) continue;
      trade.families.forEach((family, index) => rows.push({
        trade_id: tradeId,
        name: family.name,
        slug: family.slug,
        description: family.description,
        sort_order: index + 1,
        is_active: true,
      }));
    }
  }
  const data = await upsert("service_families", rows, "trade_id,slug", "id,trade_id,slug");
  report.upserted.service_families = data.length;
  return new Map(data.map((row) => [`${row.trade_id}|${row.slug}`, row.id]));
}

async function syncServices(familyIds) {
  const rows = [];
  for (const group of serviceTaxonomy) {
    for (const trade of group.trades) {
      for (const family of trade.families) {
        const familyId = familyIds.get(`${await tradeIdForSlug(trade.slug)}|${family.slug}`);
        if (!familyId) continue;
        family.services.forEach((service, index) => rows.push({
          service_family_id: familyId,
          name: service.name,
          slug: service.slug,
          description: service.description,
          search_weight: service.searchWeight || 70,
          seo_enabled: false,
          is_popular: Boolean(service.isPopular),
          is_active: true,
        }));
      }
    }
  }
  const data = await upsert("services", rows, "service_family_id,slug", "id,service_family_id,slug");
  report.upserted.services = data.length;
  return new Map(data.map((row) => [`${row.service_family_id}|${row.slug}`, row.id]));
}

async function syncActivities() {
  const rows = serviceActivities.map((name, index) => ({ name, slug: taxonomyModule.slugify(name), sort_order: index + 1 }));
  const data = await upsert("activities", rows, "slug", "id,slug");
  report.upserted.activities = data.length;
  return new Map(data.map((row) => [row.slug, row.id]));
}

async function syncContexts() {
  const rows = serviceContexts.map((context) => ({ name: context.name, slug: context.slug, context_type: context.type }));
  const data = await upsert("contexts", rows, "slug", "id,slug");
  report.upserted.contexts = data.length;
  return new Map(data.map((row) => [row.slug, row.id]));
}

async function syncServiceAliases(serviceIds) {
  const rows = [];
  await eachService(async ({ familyId, service }) => {
    const serviceId = serviceIds.get(`${familyId}|${service.slug}`);
    if (!serviceId) return;
    for (const alias of unique([service.name, ...service.aliases])) {
      rows.push({ service_id: serviceId, alias, alias_type: alias === service.name ? "synonym" : aliasType(alias) });
    }
  });
  const data = await upsert("service_aliases", rows, "service_id,alias", "id");
  report.upserted.service_aliases = data.length;
}

async function syncServiceActivities(serviceIds, activityIds) {
  const rows = [];
  await eachService(async ({ familyId, service }) => {
    const serviceId = serviceIds.get(`${familyId}|${service.slug}`);
    if (!serviceId) return;
    for (const activity of service.activities) {
      const activityId = activityIds.get(taxonomyModule.slugify(activity));
      if (activityId) rows.push({ service_id: serviceId, activity_id: activityId });
    }
  });
  const data = await upsert("service_activities", rows, "service_id,activity_id", "service_id");
  report.upserted.service_activities = data.length;
}

async function syncServiceContexts(serviceIds, contextIds) {
  const rows = [];
  await eachService(async ({ familyId, service }) => {
    const serviceId = serviceIds.get(`${familyId}|${service.slug}`);
    if (!serviceId) return;
    for (const context of service.contexts) {
      const contextId = contextIds.get(taxonomyModule.slugify(context));
      if (contextId) rows.push({ service_id: serviceId, context_id: contextId });
    }
  });
  const data = await upsert("service_contexts", rows, "service_id,context_id", "service_id");
  report.upserted.service_contexts = data.length;
}

async function syncCrosslinks(serviceIds) {
  const rows = [];
  await eachService(async ({ familyId, service }) => {
    const serviceId = serviceIds.get(`${familyId}|${service.slug}`);
    if (!serviceId) return;
    for (const crosslink of service.crosslinks) {
      rows.push({ service_id: serviceId, related_trade_slug: crosslink, relation_type: "related_trade" });
    }
  });
  if (rows.length === 0) return;
  const { data, error } = await supabase
    .from("service_crosslinks")
    .upsert(rows, { onConflict: "service_id,related_trade_slug,relation_type" })
    .select("id");
  if (error) fail(error.message);
  report.upserted.service_crosslinks = data?.length || 0;
}

const tradeIdCache = new Map();
async function tradeIdForSlug(slug) {
  if (tradeIdCache.has(slug)) return tradeIdCache.get(slug);
  const { data, error } = await supabase.from("trades").select("id").eq("slug", slug).single();
  if (error) return null;
  tradeIdCache.set(slug, data.id);
  return data.id;
}

async function eachService(callback) {
  for (const group of serviceTaxonomy) {
    for (const trade of group.trades) {
      const tradeId = await tradeIdForSlug(trade.slug);
      for (const family of trade.families) {
        const familyId = await familyIdForTradeAndSlug(tradeId, family.slug);
        if (!familyId) continue;
        for (const service of family.services) await callback({ group, trade, family, familyId, service });
      }
    }
  }
}

const familyIdCache = new Map();
async function familyIdForTradeAndSlug(tradeId, slug) {
  if (!tradeId) return null;
  const key = `${tradeId}|${slug}`;
  if (familyIdCache.has(key)) return familyIdCache.get(key);
  const { data, error } = await supabase.from("service_families").select("id").eq("trade_id", tradeId).eq("slug", slug).single();
  if (error) return null;
  familyIdCache.set(key, data.id);
  return data.id;
}

async function upsert(table, rows, onConflict, select) {
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from(table).upsert(rows, { onConflict }).select(select);
  if (error) fail(`${table}: ${error.message}`);
  return data || [];
}

async function assertTables() {
  for (const table of ["trade_groups", "service_families", "services", "service_aliases", "activities", "contexts", "company_services"]) {
    const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) fail(`Tabelle ${table} ist nicht verfuegbar. Migration 20260628001000_service_taxonomy.sql muss zuerst lokal/reviewed angewendet werden. Supabase sagt: ${error.message}`);
  }
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
  const dir = path.join(tmpdir(), "gewerkeliste-service-taxonomy-sync");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "empty.mjs"), "export {};\n");
  const outputPath = path.join(dir, `service-taxonomy-${Date.now()}.mjs`);
  await writeFile(outputPath, compiled);
  return import(pathToFileURL(outputPath).href);
}

function aliasType(alias) {
  if (/^[A-Z0-9]{2,8}$/.test(alias)) return "abbreviation";
  if (alias.includes("/") || alias.includes("-")) return "system";
  return "synonym";
}

function unique(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
