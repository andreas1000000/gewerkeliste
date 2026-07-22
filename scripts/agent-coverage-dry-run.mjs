#!/usr/bin/env node

import { requireLiveConfirmation, requireSupabaseSafety } from "./safety-gates.mjs";

const args = parseArgs(process.argv.slice(2));
const regionSlug = String(args.region || "riedering").trim().toLowerCase();
const persist = args.persist === true || String(args.persist || "").toLowerCase() === "true";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

requireSupabaseSafety({
  args,
  url: supabaseUrl,
  live: persist,
  action: "persist-agent-dry-run",
});

if (persist) {
  requireLiveConfirmation({
    args,
    action: "persist-agent-dry-run",
    reason: "Der Lauf schreibt ausschließlich Agent-OS-Audit-, Task- und Run-Daten.",
  });
}

const { runRegionalCoverageDryRun } = await import("../lib/agents/regional-coverage.ts");
const { persistRegionalCoverageDryRun } = await import("../lib/agents/persistence.ts");

const result = await runRegionalCoverageDryRun({ regionSlug });
const runId = persist ? await persistRegionalCoverageDryRun(result) : null;

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: persist ? "persisted_dry_run" : "dry_run",
      region: result.region_slug,
      findings: result.findings.length,
      tasks: result.tasks.length,
      guardrails: result.guardrails,
      persisted_run_id: runId,
    },
    null,
    2,
  ),
);

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    result[key] = next && !next.startsWith("--") ? argv[++index] : true;
  }
  return result;
}
