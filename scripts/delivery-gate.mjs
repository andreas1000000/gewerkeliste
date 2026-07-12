import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

export const PREVIEW_QA_REQUIRED = "PREVIEW-QA: REQUIRED";
export const PREVIEW_QA_NOT_APPLICABLE = "PREVIEW-QA: NOT APPLICABLE – keine ausgelieferte Anwendung geändert";

const NON_RUNTIME_FILE_PATTERNS = [
  /^\.agents\/skills\/.+\/SKILL\.md$/,
  /^\.github\/.+$/,
  /^AGENTS\.md$/,
  /^AGENT_DATA_ACQUISITION_POLICY\.md$/,
  /^AGENT_OPERATING_RULES\.md$/,
  /^BUSINESSPLAN_GEWERKELISTE_V2\.md$/,
  /^GEWERKELISTE_GRUNDSATZ\.md$/,
  /^GEWERKELISTE_PRODUCT_DOCTRINE\.md$/,
  /^docs\/.+$/,
  /^scripts\/delivery-gate\.mjs$/,
  /^tests\/delivery-gate\.test\.mjs$/,
];

const REQUIRED_SECTIONS = [
  "## Geschaeftliches Ergebnis",
  "## Umfang",
  "## Technische Umsetzung",
  "## Pruefbelege",
  "## Daten und Sicherheit",
  "## Preview-Abnahme",
  "## Delivery-Gate-Nachweise",
  "## Unabhängiges Review",
  "## Risiken und Rollback",
  "## Freigabeempfehlung",
];

export function classifyDeliveryDiff(changedFiles) {
  const files = changedFiles.map((file) => file.replaceAll("\\", "/").trim()).filter(Boolean);
  const runtimeFiles = files.filter((file) => !NON_RUNTIME_FILE_PATTERNS.some((pattern) => pattern.test(file)));

  return {
    classification: runtimeFiles.length ? "REQUIRED" : "NOT_APPLICABLE",
    changedFiles: files,
    runtimeFiles,
  };
}

export function evaluateDeliveryEvidence({ body, changedFiles }) {
  const normalizedBody = String(body || "").replaceAll("\r\n", "\n");
  const diff = classifyDeliveryDiff(changedFiles);
  const errors = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!normalizedBody.includes(section)) {
      errors.push(`Fehlender PR-Abschnitt: ${section}`);
    }
  }

  const declaredPreviewQaValue = evidenceValue(normalizedBody, ["Laufzeitklassifizierung:"]);
  const normalizedPreviewQaValue = declaredPreviewQaValue.replaceAll("`", "").trim();
  const declaresRequired = normalizedPreviewQaValue === PREVIEW_QA_REQUIRED;
  const declaresNotApplicable = normalizedPreviewQaValue === PREVIEW_QA_NOT_APPLICABLE;
  const declaredPreviewQa = declaresNotApplicable
    ? "NOT_APPLICABLE"
    : declaresRequired
      ? "REQUIRED"
      : null;

  if (normalizedPreviewQaValue.includes(PREVIEW_QA_REQUIRED) && normalizedPreviewQaValue.includes(PREVIEW_QA_NOT_APPLICABLE)) {
    errors.push("PR darf nicht gleichzeitig REQUIRED und NOT APPLICABLE deklarieren.");
  }

  if (!declaredPreviewQa) {
    errors.push(`PR muss genau eine Preview-QA-Klassifizierung enthalten: ${PREVIEW_QA_REQUIRED} oder ${PREVIEW_QA_NOT_APPLICABLE}`);
  } else if (declaredPreviewQa !== diff.classification) {
    errors.push(`Preview-QA-Klassifizierung passt nicht zum Diff: erwartet ${diff.classification}, gefunden ${declaredPreviewQa}`);
  }

  if (!hasEvidenceValue(normalizedBody, ["Reviewer:", "Review-Agent:"])) {
    errors.push("Unabhängiges Review braucht einen benannten Reviewer oder Review-Agenten.");
  }

  const reviewResult = evidenceValue(normalizedBody, ["Review-Ergebnis:", "Ergebnis:"]);
  if (!reviewResult) {
    errors.push("Unabhängiges Review braucht ein Ergebnis.");
  } else if (!isPositiveResult(reviewResult)) {
    errors.push("Unabhängiges Review muss ein positives Ergebnis ausweisen.");
  }

  const findings = evidenceValue(normalizedBody, ["Offene P0/P1-Findings:", "Offene P0-/P1-Findings:"]);
  if (!findings) {
    errors.push("Unabhängiges Review braucht eine Aussage zu offenen P0/P1-Findings.");
  } else if (!isNoOpenFindingValue(findings)) {
    errors.push("Offene P0/P1-Findings müssen vor dem Gate-Abschluss als keine/0 ausgewiesen sein.");
  }

  if (!hasEvidenceValue(normalizedBody, ["Vollständige Diff-Einordnung:", "Vollstaendige Diff-Einordnung:"])) {
    errors.push("Die vollständige Diff-Einordnung muss ausgefüllt sein.");
  }

  if (declaredPreviewQa === "NOT_APPLICABLE" && !normalizedBody.includes(PREVIEW_QA_NOT_APPLICABLE)) {
    errors.push("NOT APPLICABLE braucht die vollständige Begründung für die unveränderte ausgelieferte Anwendung.");
  }

  if (declaredPreviewQa === "REQUIRED") {
    const previewUrl = evidenceValue(normalizedBody, ["Preview-URL:", "Preview URL:"]);
    if (!previewUrl) {
      errors.push("Laufzeitwirksame Änderungen brauchen eine Preview-URL.");
    } else if (!isHttpsUrl(previewUrl)) {
      errors.push("Preview-URL muss eine gültige HTTPS-URL sein.");
    }
    const previewQaResult = evidenceValue(normalizedBody, ["Preview-QA-Ergebnis:", "Preview QA-Ergebnis:"]);
    if (!previewQaResult) {
      errors.push("Laufzeitwirksame Änderungen brauchen ein Preview-QA-Ergebnis.");
    } else if (!isPositiveResult(previewQaResult)) {
      errors.push("Preview-QA-Ergebnis muss einen erfolgreichen sichtbaren Prüfstatus ausweisen.");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    expectedPreviewQa: diff.classification,
    runtimeFiles: diff.runtimeFiles,
    changedFiles: diff.changedFiles,
  };
}

function evidenceValue(body, labels) {
  for (const label of labels) {
    const line = body
      .split("\n")
      .find((candidate) => candidate.trimStart().toLowerCase().startsWith(label.toLowerCase()));
    if (!line) continue;

    const value = line.slice(line.toLowerCase().indexOf(label.toLowerCase()) + label.length).trim();
    if (value && !/^<[^>]+>$/.test(value) && !/^\[.*\]$/.test(value)) return value;
  }
  return "";
}

function hasEvidenceValue(body, labels) {
  return Boolean(evidenceValue(body, labels));
}

function isPositiveResult(value) {
  return /^(bestanden|pass(?:ed)?|erfolgreich|successful|green|grün|approved|freigegeben|akzeptiert|abgenommen|keine\s+(?:p0|p1|offenen|relevanten))/i.test(
    value.replaceAll("`", "").trim(),
  );
}

function isNoOpenFindingValue(value) {
  const normalized = value
    .replaceAll("`", "")
    .trim()
    .replace(/[.!]+$/, "")
    .trim()
    .toLowerCase();

  return new Set(["keine", "keins", "0", "none", "no", "keine offenen p0/p1-findings"]).has(normalized);
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value.replaceAll("`", "").trim());
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    args[key] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return args;
}

async function readPullRequestBody(eventPath) {
  if (!eventPath) return "";
  const event = JSON.parse(await readFile(eventPath, "utf8"));
  return event.pull_request?.body || "";
}

function changedFilesFromGit(baseSha, headSha) {
  if (!baseSha || !headSha) {
    throw new Error("--base-sha und --head-sha sind für die Diff-Klassifizierung erforderlich.");
  }

  return execFileSync("git", ["diff", "--name-only", `${baseSha}...${headSha}`], { encoding: "utf8" })
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const body = args.body || (await readPullRequestBody(args["event-path"] || process.env.GITHUB_EVENT_PATH));
  const changedFiles = args.files
    ? JSON.parse(args.files)
    : changedFilesFromGit(args["base-sha"], args["head-sha"]);
  const result = evaluateDeliveryEvidence({ body, changedFiles });

  console.log(`Delivery-Gate: ${result.ok ? "PASS" : "FAIL"}`);
  console.log(`Erwartete Preview-QA: ${result.expectedPreviewQa}`);
  console.log(`Geänderte Dateien: ${result.changedFiles.length}`);
  if (result.runtimeFiles.length) console.log(`Laufzeitwirksame Dateien: ${result.runtimeFiles.join(", ")}`);

  if (!result.ok) {
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
