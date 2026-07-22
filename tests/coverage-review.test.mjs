import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const coverageActionSource = await readFile(new URL("../lib/actions/coverage.ts", import.meta.url), "utf8");
const approvalActionSource = await readFile(new URL("../lib/actions/coverage-approvals.ts", import.meta.url), "utf8");
const coveragePageSource = await readFile(new URL("../app/admin/coverage/page.tsx", import.meta.url), "utf8");

test("candidate review cannot promote a record through the edit form", () => {
  assert.match(coverageActionSource, /status === "promoted"\) return/);
  assert.match(coverageActionSource, /\["discovered", "website_found", "enriched", "needs_review", "rejected", "ready_for_publish"\]\.includes\(status\)/);
  assert.match(coveragePageSource, /value !== "promoted"/);
});

test("candidate publication approval requires official website evidence and clean scores", () => {
  assert.match(approvalActionSource, /requestedAction === "accept_regional_candidate" && !isPublishReadyCandidate\(candidate\)/);
  assert.match(approvalActionSource, /candidate\.status === "ready_for_publish"/);
  assert.match(approvalActionSource, /candidate\.source_type === "official_website"/);
  assert.match(approvalActionSource, /candidate\.overall_score \|\| 0\) >= 90/);
  assert.match(approvalActionSource, /!candidate\.duplicate_of_company_id/);
  assert.match(coveragePageSource, /disabled=\{locked \|\| !readyForApproval\}/);
});
