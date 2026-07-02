#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TARGET_SERVICES = new Set(["hochbau", "umbau", "architektur", "fenster", "dachsanierung"]);
const today = new Date().toISOString().slice(0, 10);
const inputPath = path.join("reports", "service-enrichment-dry-run-2026-07-01.json");
const markdownPath = path.join("reports", `service-approval-high-priority-${today}.md`);
const csvPath = path.join("reports", `service-approval-high-priority-${today}.csv`);
const applyPlanPath = path.join("reports", `service-approval-apply-plan-${today}.json`);

const report = JSON.parse(await readFile(inputPath, "utf8"));
const candidates = Array.isArray(report.candidates) ? report.candidates : [];
const conflicts = Array.isArray(report.conflicts) ? report.conflicts : [];
const manyMatchCompanies = new Set(
  (report.companies_requiring_manual_review?.many_matches || []).map((company) => company.id),
);

const focusedCandidates = candidates
  .filter((candidate) => TARGET_SERVICES.has(candidate.service_slug))
  .filter((candidate) => candidate.confidence === "high")
  .map((candidate) => {
    const review_category = reviewCategory(candidate, conflicts);
    const quality = qualityStatus(candidate, review_category, manyMatchCompanies);
    return {
      ...candidate,
      review_category,
      quality_status: quality.status,
      quality_note: quality.note,
      reviewer_decision: "",
      reviewer_note: "",
    };
  })
  .filter((candidate) => candidate.review_category === "AUTO_CANDIDATE_HIGH")
  .filter((candidate) => String(candidate.evidence_text || "").trim())
  .sort(
    (a, b) =>
      serviceRank(a.service_slug) - serviceRank(b.service_slug) ||
      statusRank(a.quality_status) - statusRank(b.quality_status) ||
      a.city.localeCompare(b.city, "de") ||
      a.company_name.localeCompare(b.company_name, "de"),
  );

const readyCandidates = focusedCandidates.filter((candidate) => candidate.quality_status === "READY_TO_APPROVE");
const applyPlan = readyCandidates.map((candidate) => ({
  company_id: candidate.company_id,
  service_slug: candidate.service_slug,
  source: "service_approval_high_priority_review",
  evidence: candidate.evidence_text,
  confidence: candidate.confidence,
  approved_status: "pending",
  write_action: "would_insert_or_update",
  no_live_write: true,
}));

const simulation = seoSimulation(readyCandidates);

await writeFile(markdownPath, renderMarkdown({ focusedCandidates, readyCandidates, simulation }));
await writeFile(csvPath, renderCsv(focusedCandidates));
await writeFile(applyPlanPath, `${JSON.stringify({
  generated_at: new Date().toISOString(),
  mode: "dry_run_apply_plan",
  no_live_write: true,
  source_report: inputPath,
  target_services: Array.from(TARGET_SERVICES),
  rows: applyPlan,
}, null, 2)}\n`);

console.log(JSON.stringify({
  status: "ok",
  source: inputPath,
  reports: [markdownPath, csvPath, applyPlanPath],
  reviewed_high_priority_candidates: focusedCandidates.length,
  ready_to_approve: countByStatus(focusedCandidates).READY_TO_APPROVE || 0,
  review_manually: countByStatus(focusedCandidates).REVIEW_MANUALLY || 0,
  reject_recommended: countByStatus(focusedCandidates).REJECT_RECOMMENDED || 0,
  simulated_service_pages: simulation.servicePages,
  simulated_service_location_pages: simulation.serviceLocationPages,
  companies_with_new_service_links: simulation.companyProfiles,
}, null, 2));

function reviewCategory(candidate, allConflicts) {
  if (candidate.confidence === "low") return "DO_NOT_AUTO_APPLY_LOW";
  if (allConflicts.some((conflict) => conflict.company_id === candidate.company_id)) return "AMBIGUOUS";
  if (!String(candidate.evidence_text || "").trim()) return "INSUFFICIENT_EVIDENCE";
  if (candidate.confidence === "high") return "AUTO_CANDIDATE_HIGH";
  return "REVIEW_REQUIRED_MEDIUM";
}

function qualityStatus(candidate, reviewCategoryValue, manyMatchCompanyIds) {
  if (reviewCategoryValue !== "AUTO_CANDIDATE_HIGH") {
    return { status: "REVIEW_MANUALLY", note: "Nicht automatisch freigeben, weil der Review-Status nicht eindeutig AUTO_CANDIDATE_HIGH ist." };
  }

  const evidence = normalize(candidate.evidence_text);
  const serviceName = normalize(candidate.service_name);
  const serviceSlug = normalize(candidate.service_slug);
  const matchedTerm = normalize(candidate.matched_term);

  if (!candidate.city || !candidate.trade_slug) {
    return { status: "REVIEW_MANUALLY", note: "Ort oder Gewerk fehlt; vor Freigabe manuell prüfen." };
  }

  if (!directEvidence({ evidence, serviceName, serviceSlug, matchedTerm })) {
    return { status: "REJECT_RECOMMENDED", note: "Evidence enthält keinen eindeutigen Leistungsbegriff oder klaren Alias." };
  }

  if (candidate.service_slug === "fenster" && manyMatchCompanyIds.has(candidate.company_id)) {
    return { status: "REVIEW_MANUALLY", note: "Fenster ist plausibel, aber der Betrieb hat viele Treffer; erst manuell prüfen." };
  }

  if (manyMatchCompanyIds.has(candidate.company_id)) {
    return { status: "REVIEW_MANUALLY", note: "Betrieb hat viele Treffer; vor Freigabe kurz manuell gegenprüfen." };
  }

  if (evidence.length < 8) {
    return { status: "REVIEW_MANUALLY", note: "Evidence ist sehr kurz; vor Freigabe manuell prüfen." };
  }

  return { status: "READY_TO_APPROVE", note: "Direkter Leistungsbegriff in Evidence, passendes Gewerk und Ort vorhanden, kein Ambiguity-Hinweis." };
}

function directEvidence({ evidence, serviceName, serviceSlug, matchedTerm }) {
  return [serviceName, serviceSlug, matchedTerm]
    .filter((term) => term && term.length >= 4)
    .some((term) => includesTerm(evidence, term));
}

function seoSimulation(approvedCandidates) {
  const servicePages = new Set();
  const serviceLocationPages = new Map();
  const companyProfiles = new Set();

  for (const candidate of approvedCandidates) {
    servicePages.add(candidate.service_slug);
    companyProfiles.add(candidate.company_id);
    const key = `${candidate.service_slug}/${slugify(candidate.city)}`;
    const row = serviceLocationPages.get(key) || {
      service_slug: candidate.service_slug,
      service_name: candidate.service_name,
      city: candidate.city,
      candidate_count: 0,
      companies: new Set(),
    };
    row.candidate_count += 1;
    row.companies.add(candidate.company_name);
    serviceLocationPages.set(key, row);
  }

  const topServiceLocationPages = Array.from(serviceLocationPages.entries())
    .map(([pathKey, row]) => ({
      url_path: `/leistungen/${pathKey}`,
      service_slug: row.service_slug,
      service_name: row.service_name,
      city: row.city,
      candidate_count: row.candidate_count,
      example_companies: Array.from(row.companies).slice(0, 3),
    }))
    .sort((a, b) => b.candidate_count - a.candidate_count || a.url_path.localeCompare(b.url_path, "de"))
    .slice(0, 20);

  return {
    servicePages: servicePages.size,
    serviceLocationPages: serviceLocationPages.size,
    companyProfiles: companyProfiles.size,
    topServiceLocationPages,
  };
}

function renderMarkdown({ focusedCandidates: rows, readyCandidates: readyRows, simulation }) {
  const statusCounts = countByStatus(rows);
  const byService = groupRows(rows, (row) => row.service_name);

  const lines = [
    `# High-Priority Service Approval Review (${today})`,
    "",
    "## Sicherheit",
    "- Keine Live-Datenbank-Schreibzugriffe.",
    "- Keine Migration ausgeführt.",
    "- Keine Medium- oder Low-Kandidaten enthalten.",
    "- AMBIGUOUS-Kandidaten sind ausgeschlossen.",
    "- Apply-Plan ist Dry-Run und setzt `no_live_write: true`.",
    "",
    "## Fokus",
    "- Hochbau",
    "- Umbau",
    "- Architektur",
    "- Fenster",
    "- Dachsanierung",
    "",
    "## Zusammenfassung",
    `- Geprüfte High-Priority-Kandidaten: ${rows.length}`,
    `- READY_TO_APPROVE: ${statusCounts.READY_TO_APPROVE || 0}`,
    `- REVIEW_MANUALLY: ${statusCounts.REVIEW_MANUALLY || 0}`,
    `- REJECT_RECOMMENDED: ${statusCounts.REJECT_RECOMMENDED || 0}`,
    `- Simulierte neue /leistungen/[slug]: ${simulation.servicePages}`,
    `- Simulierte neue /leistungen/[slug]/[ort]: ${simulation.serviceLocationPages}`,
    `- Firmenprofile mit zusätzlichen Leistungslinks: ${simulation.companyProfiles}`,
    "",
    "## Kandidaten nach Leistung",
  ];

  for (const [serviceName, serviceRows] of byService) {
    const counts = countByStatus(serviceRows);
    lines.push(
      "",
      `### ${serviceName}`,
      `- Kandidaten: ${serviceRows.length}`,
      `- READY_TO_APPROVE: ${counts.READY_TO_APPROVE || 0}`,
      `- REVIEW_MANUALLY: ${counts.REVIEW_MANUALLY || 0}`,
      `- REJECT_RECOMMENDED: ${counts.REJECT_RECOMMENDED || 0}`,
    );
  }

  lines.push("", "## Top 20 Leistung-Ort-Seiten nach READY_TO_APPROVE");
  for (const page of simulation.topServiceLocationPages) {
    lines.push(`- ${page.url_path}: ${page.candidate_count} Kandidaten (${page.example_companies.join("; ")})`);
  }

  lines.push("", "## READY_TO_APPROVE Kandidaten");
  for (const row of readyRows) {
    lines.push(
      "",
      `### ${row.company_name} - ${row.service_name} (${row.city})`,
      `- company_id: ${row.company_id}`,
      `- Gewerk: ${row.trade_name}`,
      `- Evidence: ${row.evidence_text}`,
      `- Quelle: ${row.source_field}`,
      `- Grund: ${row.reason}`,
    );
  }

  lines.push("", "## REVIEW_MANUALLY / REJECT_RECOMMENDED");
  for (const row of rows.filter((candidate) => candidate.quality_status !== "READY_TO_APPROVE")) {
    lines.push(
      "",
      `### ${row.quality_status}: ${row.company_name} - ${row.service_name} (${row.city})`,
      `- Hinweis: ${row.quality_note}`,
      `- Evidence: ${row.evidence_text}`,
      `- Quelle: ${row.source_field}`,
    );
  }

  return `${lines.join("\n")}\n`;
}

function renderCsv(rows) {
  const headers = [
    "company_id",
    "company_name",
    "city",
    "trade_name",
    "service_slug",
    "service_name",
    "confidence",
    "evidence_text",
    "source_field",
    "reason",
    "suggested_action",
    "quality_status",
    "quality_note",
    "reviewer_decision",
    "reviewer_note",
  ];

  return `${[
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n")}\n`;
}

function groupRows(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).sort((a, b) => serviceRank(a[1][0]?.service_slug) - serviceRank(b[1][0]?.service_slug));
}

function countByStatus(rows) {
  return rows.reduce((counts, row) => {
    counts[row.quality_status] = (counts[row.quality_status] || 0) + 1;
    return counts;
  }, {});
}

function serviceRank(slug) {
  return ["hochbau", "umbau", "architektur", "fenster", "dachsanierung"].indexOf(slug);
}

function statusRank(status) {
  return { READY_TO_APPROVE: 0, REVIEW_MANUALLY: 1, REJECT_RECOMMENDED: 2 }[status] ?? 3;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i").test(text);
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function csvCell(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}
