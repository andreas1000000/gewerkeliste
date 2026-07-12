import assert from "node:assert/strict";
import test from "node:test";
import {
  PREVIEW_QA_NOT_APPLICABLE,
  PREVIEW_QA_REQUIRED,
  classifyDeliveryDiff,
  evaluateDeliveryEvidence,
} from "../scripts/delivery-gate.mjs";

const requiredBody = ({ previewQa, previewDetails = "" } = {}) => `
## Geschaeftliches Ergebnis
Gate-Nachweise werden vor dem Draft-PR maschinenlesbar geprüft.

## Umfang
CI-/Governance-Dateien.

## Technische Umsetzung
Deterministischer Diff- und PR-Evidenzcheck.

## Pruefbelege
- Typecheck: bestanden
- Lint: bestanden
- Tests: bestanden
- Build: bestanden

## Daten und Sicherheit
Keine Daten-, Auth- oder Secret-Änderung.

## Preview-Abnahme
Preview-URL: ${previewQa === "REQUIRED" ? "https://example.vercel.app" : "NOT APPLICABLE"}
Preview-QA-Ergebnis: ${previewDetails || "Keine ausgelieferte Anwendung geändert."}

## Delivery-Gate-Nachweise
Laufzeitklassifizierung: ${previewQa === "REQUIRED" ? PREVIEW_QA_REQUIRED : PREVIEW_QA_NOT_APPLICABLE}
Vollständige Diff-Einordnung: geprüft.

## Unabhängiges Review
Reviewer: independent-review-agent
Ergebnis: bestanden.
Offene P0/P1-Findings: Keine.

## Risiken und Rollback
Bekannte Restrisiken: keine.
Rollback-Moeglichkeit: PR schließen.

## Freigabeempfehlung
Begruendung: Product-Owner-Prüfung folgt.
`;

test("classifies an allowlisted governance/CI diff as NOT_APPLICABLE", () => {
  const result = classifyDeliveryDiff([
    ".github/workflows/ci.yml",
    ".github/pull_request_template.md",
    "scripts/delivery-gate.mjs",
    "tests/delivery-gate.test.mjs",
    "docs/knowledge/decisions/architecture-decisions.md",
  ]);

  assert.equal(result.classification, "NOT_APPLICABLE");
  assert.deepEqual(result.runtimeFiles, []);
});

test("fails closed for an application path", () => {
  const result = classifyDeliveryDiff(["app/page.tsx", ".github/workflows/ci.yml"]);

  assert.equal(result.classification, "REQUIRED");
  assert.deepEqual(result.runtimeFiles, ["app/page.tsx"]);
});

test("accepts complete NOT_APPLICABLE evidence for a non-runtime diff", () => {
  const result = evaluateDeliveryEvidence({
    body: requiredBody({ previewQa: "NOT_APPLICABLE" }),
    changedFiles: [".github/workflows/ci.yml", "scripts/delivery-gate.mjs"],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("rejects NOT_APPLICABLE evidence when application code changed", () => {
  const result = evaluateDeliveryEvidence({
    body: requiredBody({ previewQa: "NOT_APPLICABLE" }),
    changedFiles: ["components/site-header.tsx"],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /passt nicht zum Diff/);
});

test("requires preview URL and QA result for runtime changes", () => {
  const body = requiredBody({ previewQa: "REQUIRED" })
    .replace("Preview-URL: https://example.vercel.app", "Preview-URL:")
    .replace("Preview-QA-Ergebnis: Keine ausgelieferte Anwendung geändert.", "Preview-QA-Ergebnis:");
  const result = evaluateDeliveryEvidence({ body, changedFiles: ["app/page.tsx"] });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Preview-URL/);
  assert.match(result.errors.join("\n"), /Preview-QA-Ergebnis/);
});

test("rejects empty diff evidence", () => {
  const body = requiredBody({ previewQa: "NOT_APPLICABLE" }).replace("Vollständige Diff-Einordnung: geprüft.", "Vollständige Diff-Einordnung:");
  const result = evaluateDeliveryEvidence({ body, changedFiles: ["docs/agent-company/IMPLEMENTATION_ROADMAP.md"] });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Diff-Einordnung muss ausgefüllt/);
});

test("rejects negative review results", () => {
  const body = requiredBody({ previewQa: "NOT_APPLICABLE" }).replace("Ergebnis: bestanden.", "Ergebnis: abgelehnt.");
  const result = evaluateDeliveryEvidence({ body, changedFiles: ["docs/agent-company/IMPLEMENTATION_ROADMAP.md"] });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /positives Ergebnis/);
});

test("rejects invalid runtime preview evidence", () => {
  const body = requiredBody({ previewQa: "REQUIRED" })
    .replace("Preview-URL: https://example.vercel.app", "Preview-URL: not-a-url")
    .replace("Preview-QA-Ergebnis: Keine ausgelieferte Anwendung geändert.", "Preview-QA-Ergebnis: x");
  const result = evaluateDeliveryEvidence({ body, changedFiles: ["app/page.tsx"] });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /gültige HTTPS-URL/);
  assert.match(result.errors.join("\n"), /erfolgreichen sichtbaren Prüfstatus/);
});

test("rejects contradictory preview classifications", () => {
  const body = requiredBody({ previewQa: "NOT_APPLICABLE" }).replace(
    `Laufzeitklassifizierung: ${PREVIEW_QA_NOT_APPLICABLE}`,
    `Laufzeitklassifizierung: ${PREVIEW_QA_REQUIRED} oder ${PREVIEW_QA_NOT_APPLICABLE}`,
  );
  const result = evaluateDeliveryEvidence({ body, changedFiles: ["docs/agent-company/IMPLEMENTATION_ROADMAP.md"] });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /nicht gleichzeitig REQUIRED/);
});

test("rejects open P0/P1 findings", () => {
  const body = requiredBody({ previewQa: "NOT_APPLICABLE" }).replace("Offene P0/P1-Findings: Keine.", "Offene P0/P1-Findings: P1: offen.");
  const result = evaluateDeliveryEvidence({ body, changedFiles: ["docs/agent-company/IMPLEMENTATION_ROADMAP.md"] });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /als keine\/0/);
});

test("rejects a finding field that hides an open P1 after Keine", () => {
  const body = requiredBody({ previewQa: "NOT_APPLICABLE" }).replace(
    "Offene P0/P1-Findings: Keine.",
    "Offene P0/P1-Findings: Keine, aber P1 offen.",
  );
  const result = evaluateDeliveryEvidence({ body, changedFiles: ["docs/agent-company/IMPLEMENTATION_ROADMAP.md"] });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /als keine\/0/);
});

test("requires an exact preview classification value", () => {
  const body = requiredBody({ previewQa: "NOT_APPLICABLE" }).replace(
    `Laufzeitklassifizierung: ${PREVIEW_QA_NOT_APPLICABLE}`,
    `Laufzeitklassifizierung: foo ${PREVIEW_QA_NOT_APPLICABLE}`,
  );
  const result = evaluateDeliveryEvidence({ body, changedFiles: ["docs/agent-company/IMPLEMENTATION_ROADMAP.md"] });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /genau eine Preview-QA-Klassifizierung/);
});
