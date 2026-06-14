#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const sourcesPath = args.sources || "config/research-sources.json";
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const workDir = args["work-dir"] || join("work", "research-source-runs", runId);
const outputPath = args.output || join("work", `${runId}-combined-research-candidates.jsonl`);
const maxSources = numberArg("max-sources", Number.POSITIVE_INFINITY);
const importDryRun = String(args["import-dry-run"] || "true").toLowerCase() !== "false";

await mkdir(workDir, { recursive: true });
await mkdir(dirname(outputPath), { recursive: true });

const sources = JSON.parse(await readFile(sourcesPath, "utf8")).filter((source) => source.enabled !== false).slice(0, maxSources);
const report = {
  ok: true,
  sources_path: sourcesPath,
  output: outputPath,
  sources_total: sources.length,
  sources_ok: 0,
  sources_failed: 0,
  candidates_seen: 0,
  candidates_written: 0,
  duplicates_skipped: 0,
  source_reports: [],
  errors: [],
};

const combined = createWriteStream(outputPath, { flags: "w" });
const seen = new Set();

for (const source of sources) {
  const sourceOutput = join(workDir, `${source.id}.jsonl`);
  const sourceReport = { id: source.id, type: source.type, output: sourceOutput, ok: false };

  try {
    await runSource(source, sourceOutput);
    const text = await readFile(sourceOutput, "utf8").catch(() => "");
    let writtenForSource = 0;
    let seenForSource = 0;

    for (const line of text.split(/\r?\n/).filter(Boolean)) {
      const candidate = JSON.parse(line);
      seenForSource += 1;
      report.candidates_seen += 1;
      const key = candidateKey(candidate);
      if (seen.has(key)) {
        report.duplicates_skipped += 1;
        continue;
      }
      seen.add(key);
      combined.write(`${JSON.stringify(candidate)}\n`);
      report.candidates_written += 1;
      writtenForSource += 1;
    }

    sourceReport.ok = true;
    sourceReport.candidates_seen = seenForSource;
    sourceReport.candidates_written = writtenForSource;
    report.sources_ok += 1;
  } catch (error) {
    report.ok = false;
    report.sources_failed += 1;
    sourceReport.error = error.message;
    report.errors.push(`${source.id}: ${error.message}`);
  }

  report.source_reports.push(sourceReport);
}

await new Promise((resolve) => combined.end(resolve));

if (importDryRun) {
  const dryRun = await runCommand(process.execPath, [
    "scripts/research-agent.mjs",
    "--file",
    outputPath,
    "--type",
    "jsonl",
    "--batch",
    `Quellenlauf ${runId}`,
    "--source-note",
    "Kombinierter Quellenlauf",
    "--dry-run",
  ]);
  report.import_dry_run = parseJsonTail(dryRun.stdout);
}

await writeFile(outputPath.replace(/\.jsonl$/i, "-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

async function runSource(source, output) {
  if (source.type === "open2c") {
    const htmlFile = join(workDir, `${source.id}.html`);
    await runCommand("curl", ["-sSL", source.url, "-o", htmlFile]);
    await runCommand(process.execPath, [
      "scripts/open2c-directory-agent.mjs",
      "--file",
      htmlFile,
      "--url",
      source.url,
      "--source-label",
      source.sourceLabel || source.id,
      "--output",
      output,
    ]);
    return;
  }

  if (source.type === "osm") {
    const commandArgs = [
      "scripts/osm-research-agent.mjs",
      "--area",
      source.area,
      "--country",
      source.country || "Deutschland",
      "--limit",
      String(source.limit || 10000),
      "--output",
      output,
    ];
    if (source.city) commandArgs.push("--city", source.city);
    if (source.postalCode) commandArgs.push("--postal-code", source.postalCode);
    await runCommand(process.execPath, commandArgs);
    return;
  }

  throw new Error(`Unbekannter Quellentyp: ${source.type}`);
}

function runCommand(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: process.cwd(), env: process.env });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${command} exited with ${code}`));
    });
  });
}

function candidateKey(candidate) {
  return [normalizeKey(candidate.company_name), normalizeKey(candidate.street || ""), candidate.postal_code || "", normalizeKey(candidate.website || "")]
    .filter(Boolean)
    .join("|");
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function parseJsonTail(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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

function numberArg(key, fallback) {
  const value = Number(args[key] || fallback);
  return Number.isFinite(value) ? value : fallback;
}
