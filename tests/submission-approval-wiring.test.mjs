import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionsSource = await readFile(new URL("../lib/actions.ts", import.meta.url), "utf8");
const submissionActionSource = await readFile(new URL("../lib/actions/submissions.ts", import.meta.url), "utf8");
const approvalPlaceholderSource = await readFile(new URL("../lib/actions/approval-required.ts", import.meta.url), "utf8");

test("new-entry approval uses the real admin submission action", () => {
  assert.ok(actionsSource.includes('import { approveSubmission as approveSubmissionAction } from "@/lib/actions/submissions";'));
  assert.ok(!actionsSource.includes("approveSubmission as approveSubmissionAction,"));
  assert.ok(submissionActionSource.includes("await requireAdminAction();"));
  assert.ok(!approvalPlaceholderSource.includes("export async function approveSubmission"));
});
