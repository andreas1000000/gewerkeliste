#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const filePath = args.file || args._[0];
const regionPath = args.region || "config/research-regions/landkreis-rosenheim.json";

if (!filePath) {
  fail("Datei fehlt. Nutzung: npm run research:quality -- --file work/candidates.jsonl");
}

const region = JSON.parse(await readFile(regionPath, "utf8"));
const candidates = parseJsonl(await readFile(filePath, "utf8"));
const report = auditCandidates(candidates, region);
const reportPath =
  args.output ||
  join("work", `${new Date().toISOString().replace(/[:.]/g, "-")}-${region.id || "region"}-quality-report.json`);

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...report, report_path: reportPath }, null, 2));

function auditCandidates(items, regionConfig) {
  const gates = regionConfig.qualityGates || {};
  const autoImportMinScore = Number(gates.autoImportMinScore || 70);
  const reviewMinScore = Number(gates.reviewMinScore || 50);
  const targetQualityPercent = Number(regionConfig.targetQualityPercent || 90);
  const required = gates.requiredForPublicCandidate || [];
  const byDecision = { auto_import_candidate: 0, review: 0, reject: 0 };
  const byTrade = {};
  const issueCounts = {};
  const scored = items.map((candidate, index) => {
    const result = scoreCandidate(candidate, required);
    const decision =
      result.score >= autoImportMinScore && result.missing_required.length === 0
        ? "auto_import_candidate"
        : result.score >= reviewMinScore
          ? "review"
          : "reject";

    byDecision[decision] += 1;
    byTrade[candidate.trade_name || "Unbekannt"] = (byTrade[candidate.trade_name || "Unbekannt"] || 0) + 1;
    for (const issue of result.issues) issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    for (const field of result.missing_required) issueCounts[`missing_${field}`] = (issueCounts[`missing_${field}`] || 0) + 1;

    return {
      index: index + 1,
      company_name: candidate.company_name,
      trade_name: candidate.trade_name,
      city: candidate.city,
      score: result.score,
      decision,
      missing_required: result.missing_required,
      issues: result.issues,
      source_label: candidate.source_label,
      source_url: candidate.source_url,
    };
  });

  const qualityPercent = items.length ? Math.round((byDecision.auto_import_candidate / items.length) * 1000) / 10 : 0;
  const reviewablePercent = items.length
    ? Math.round(((byDecision.auto_import_candidate + byDecision.review) / items.length) * 1000) / 10
    : 0;

  return {
    ok: qualityPercent >= targetQualityPercent,
    region: regionConfig.name,
    region_id: regionConfig.id,
    target_quality_percent: targetQualityPercent,
    actual_auto_import_quality_percent: qualityPercent,
    reviewable_percent: reviewablePercent,
    total_candidates: items.length,
    decisions: byDecision,
    by_trade: sortObject(byTrade),
    issue_counts: sortObject(issueCounts),
    next_actions: nextActions(qualityPercent, targetQualityPercent, issueCounts),
    sample_auto_import_candidates: scored.filter((item) => item.decision === "auto_import_candidate").slice(0, 10),
    sample_review_candidates: scored.filter((item) => item.decision === "review").slice(0, 10),
    sample_reject_candidates: scored.filter((item) => item.decision === "reject").slice(0, 10),
  };
}

function scoreCandidate(candidate, required) {
  let score = 0;
  const issues = [];
  const missingRequired = required.filter((field) => !candidate[field]);
  const sourceLabel = String(candidate.source_label || "").toLowerCase();

  if (candidate.website) score += 30;
  else issues.push("no_website");

  if (sourceLabel.includes("impressum") || candidate.imprint_url || candidate.secondary_source_label?.toLowerCase().includes("impressum")) {
    score += 20;
  }
  if (candidate.street && candidate.postal_code && candidate.city) score += 15;
  else issues.push("incomplete_address");

  if (candidate.phone) score += 15;
  else issues.push("no_phone");

  if (candidate.email) score += 10;
  else issues.push("no_email");

  if (candidate.trade_name && candidate.trade_slug) score += 10;
  else issues.push("unclear_trade");

  if ((sourceLabel.includes("gemeinde") || sourceLabel.includes("openstreetmap")) && !candidate.imprint_url) {
    score -= 20;
    issues.push("directory_only_source");
  }

  if (!candidate.website) score -= 20;
  if (!candidate.trade_name || /^baugewerk$/i.test(candidate.trade_name)) score -= 30;
  if (candidate.duplicate_company_id || candidate.admin_notes?.includes("Dublette")) score -= 50;

  return {
    score: clamp(score, 0, 100),
    issues,
    missing_required: missingRequired,
  };
}

function nextActions(qualityPercent, target, issues) {
  const actions = [];
  if (qualityPercent < target) {
    actions.push("Nicht skalieren. Landkreis Rosenheim weiter anreichern, bis das Qualitaetsziel erreicht ist.");
  }
  if (issues.no_website) actions.push("Website-Finder fuer kommunale Kandidaten ausfuehren.");
  if (issues.directory_only_source) actions.push("Verzeichnisdaten mit Firmenwebsite oder Impressum zweitbestaetigen.");
  if (issues.no_email || issues.no_phone) actions.push("Kontaktfelder aus Impressum/Kontaktseite nachrecherchieren.");
  if (issues.incomplete_address) actions.push("Adressen normalisieren und fehlende Strassen/Ortsteile pruefen.");
  return actions;
}

function parseJsonl(value) {
  return value
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      result._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = "true";
      continue;
    }
    result[key] = next;
    index += 1;
  }
  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
