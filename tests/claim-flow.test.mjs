import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionSource = await readFile(new URL("../lib/actions/claims.ts", import.meta.url), "utf8");
const assistantSource = await readFile(new URL("../components/claim-assistant.tsx", import.meta.url), "utf8");
const fallbackSource = await readFile(new URL("../components/claim-form.tsx", import.meta.url), "utf8");

test("claim submission requires explicit privacy consent", () => {
  assert.match(actionSource, /formData\.get\("consent_privacy"\) !== "on"/);
  assert.match(actionSource, /fieldErrors: \{ consent_privacy: "Datenschutzbestätigung ist erforderlich\." \}/);
  assert.match(actionSource, /consent_privacy: true/);
  assert.match(assistantSource, /name="consent_privacy"[^>]+required/);
  assert.match(assistantSource, /Datenschutzerklärung/);
  assert.match(assistantSource, /errors\.consent_privacy/);
  assert.match(fallbackSource, /name="consent_privacy"[^>]+required/);
});

test("claim feedback is announced to assistive technology", () => {
  assert.match(assistantSource, /aria-live="polite"/);
  assert.match(assistantSource, /role=\{state\.ok \? "status" : "alert"\}/);
  assert.match(fallbackSource, /aria-live="polite"/);
  assert.match(fallbackSource, /role=\{state\.ok \? "status" : "alert"\}/);
});

test("claim submission blocks already claimed or open requests", () => {
  assert.match(actionSource, /company\.claim_status === "claimed"/);
  assert.match(actionSource, /company\.claim_status === "pending"/);
  assert.match(actionSource, /\.from\("company_claims"\)/);
  assert.match(actionSource, /\.in\("status", \["pending", "approved"\]\)/);
  assert.match(actionSource, /Eine weitere Anfrage ist nicht erforderlich/);
  assert.match(actionSource, /liegt bereits eine Übernahmeanfrage zur Prüfung vor/);
});

test("rejecting the last pending claim reopens the company entry for a new request", async () => {
  const actionsSource = await readFile(new URL("../lib/actions.ts", import.meta.url), "utf8");
  assert.match(actionsSource, /\.from\("company_claims"\)\n    \.select\("id, company_id, status"\)/);
  assert.match(actionsSource, /\.eq\("status", "pending"\)\n      \.neq\("id", claimId\)/);
  assert.match(actionsSource, /\.update\(\{ claim_status: "rejected" \}\)/);
});
