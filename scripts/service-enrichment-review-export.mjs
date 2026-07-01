#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const today = new Date().toISOString().slice(0, 10);
const inputPath = path.join("reports", `service-enrichment-dry-run-${today}.json`);
const outputPath = path.join("reports", `service-enrichment-review-${today}.csv`);

const report = JSON.parse(await readFile(inputPath, "utf8"));
const conflicts = Array.isArray(report.conflicts) ? report.conflicts : [];
const candidates = Array.isArray(report.candidates) ? report.candidates : [];

const headers = [
  "company_id",
  "company_name",
  "city",
  "trade_slug",
  "trade_name",
  "service_slug",
  "service_name",
  "confidence",
  "source_field",
  "evidence_text",
  "reason",
  "suggested_action",
  "review_category",
  "reviewer_decision",
  "reviewer_note",
];

const rows = candidates
  .map((candidate) => ({
    ...candidate,
    review_category: reviewCategory(candidate, conflicts),
    reviewer_decision: "",
    reviewer_note: "",
  }))
  .sort((a, b) => confidenceRank(a.confidence) - confidenceRank(b.confidence) || a.company_name.localeCompare(b.company_name, "de"));

const csv = [
  headers.join(","),
  ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
].join("\n");

await writeFile(outputPath, `${csv}\n`);

const byCategory = rows.reduce((counts, row) => {
  counts[row.review_category] = (counts[row.review_category] || 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  status: "ok",
  input: inputPath,
  output: outputPath,
  rows: rows.length,
  by_category: byCategory,
}, null, 2));

function reviewCategory(candidate, allConflicts) {
  if (candidate.confidence === "low") return "DO_NOT_AUTO_APPLY_LOW";
  if (allConflicts.some((conflict) => conflict.company_id === candidate.company_id)) return "AMBIGUOUS";
  if (!String(candidate.evidence_text || "").trim()) return "INSUFFICIENT_EVIDENCE";
  if (candidate.confidence === "high") return "AUTO_CANDIDATE_HIGH";
  return "REVIEW_REQUIRED_MEDIUM";
}

function confidenceRank(value) {
  return { high: 0, medium: 1, low: 2 }[value] ?? 3;
}

function csvCell(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}
