#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { requireLiveConfirmation } from "./safety-gates.mjs";

const args = parseArgs(process.argv.slice(2));
const live = Boolean(args.live);
const supabase = createSupabaseClient();
const taxonomyModule = await importTaxonomyModule();
const { publicTradeTaxonomy, tradeSlugAliases } = taxonomyModule;
const trades = publicTradeTaxonomy();
if (live) {
  requireLiveConfirmation({
    args,
    action: "sync-trade-taxonomy-live",
    reason: "Taxonomie-Sync schreibt trades, trade_synonyms und trade_slug_aliases.",
  });
}

const duplicateSlugs = findDuplicates(trades.map((trade) => trade.slug));
const report = {
  ok: duplicateSlugs.length === 0,
  mode: live ? "live" : "dry_run",
  code_trades: trades.length,
  duplicate_slugs: duplicateSlugs,
  upserted_trades: 0,
  upserted_synonyms: 0,
  upserted_aliases: 0,
  missing_after_sync: [],
};

if (duplicateSlugs.length > 0) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (live) {
  const { data: upsertedTrades, error } = await supabase
    .from("trades")
    .upsert(
      trades.map((trade) => ({ slug: trade.slug, name: trade.name })),
      { onConflict: "slug" },
    )
    .select("id,slug");
  if (error) fail(error.message);
  report.upserted_trades = upsertedTrades?.length || 0;

  const tradeIds = new Map((upsertedTrades || []).map((trade) => [trade.slug, trade.id]));
  const synonymRows = [];
  for (const trade of trades) {
    const tradeId = tradeIds.get(trade.slug);
    if (!tradeId) continue;
    for (const synonym of unique([trade.name, ...trade.synonyms])) {
      synonymRows.push({ trade_id: tradeId, synonym, weight: synonym === trade.name ? 100 : 80, source: "central-taxonomy" });
    }
  }
  if (synonymRows.length > 0) {
    const { data, error: synonymError } = await supabase
      .from("trade_synonyms")
      .upsert(synonymRows, { onConflict: "trade_id,synonym" })
      .select("id");
    if (synonymError) fail(synonymError.message);
    report.upserted_synonyms = data?.length || 0;
  }

  const aliasRows = Object.entries(tradeSlugAliases)
    .map(([old_slug, new_slug]) => ({ old_slug, new_slug, trade_id: tradeIds.get(new_slug) || null }))
    .filter((row) => row.trade_id);
  if (aliasRows.length > 0) {
    const { data, error: aliasError } = await supabase
      .from("trade_slug_aliases")
      .upsert(aliasRows, { onConflict: "old_slug" })
      .select("id");
    if (aliasError) fail(aliasError.message);
    report.upserted_aliases = data?.length || 0;
  }
}

const { data: dbTrades, error: dbError } = await supabase.from("trades").select("slug");
if (dbError) fail(dbError.message);
const dbSlugs = new Set((dbTrades || []).map((trade) => trade.slug));
report.missing_after_sync = trades.filter((trade) => !dbSlugs.has(trade.slug)).map((trade) => trade.slug);

console.log(JSON.stringify(report, null, 2));

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY muessen gesetzt sein.");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function importTaxonomyModule() {
  const sourcePath = path.join(process.cwd(), "lib/trade-taxonomy.ts");
  const source = await readFile(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = path.join(tmpdir(), "gewerkeliste-taxonomy-sync");
  await mkdir(dir, { recursive: true });
  const outputPath = path.join(dir, `trade-taxonomy-${Date.now()}.mjs`);
  await writeFile(outputPath, compiled);
  return import(pathToFileURL(outputPath).href);
}

function unique(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
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
