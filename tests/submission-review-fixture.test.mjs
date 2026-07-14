import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { normalizeSubmissionReviewPayload } from "../lib/submission-review.ts";

const sharedReviewSource = await readFile(new URL("../components/admin/submission-review-media.tsx", import.meta.url), "utf8");

test("local submission fixture uses the shared review components and normalization", async () => {
  const fixtureModule = await import("./fixtures/submission-review.ts");
  const payload = normalizeSubmissionReviewPayload(fixtureModule.syntheticSerializedSubmissionPayload);

  assert.ok(payload);
  assert.equal(payload.social_links.length, 2);
  assert.equal(payload.contacts.length, 1);
  assert.match(sharedReviewSource, /export function SubmissionMediaPreview/);
  assert.match(sharedReviewSource, /export function SubmissionPayloadFilePreview/);
  assert.match(sharedReviewSource, /export function SubmissionSocialLinkReview/);
  assert.doesNotMatch(sharedReviewSource, /storedValue/);
});

test("fixture payload contains only synthetic media and links", async () => {
  const fixtureModule = await import("./fixtures/submission-review.ts");

  assert.match(fixtureModule.syntheticSerializedSubmissionPayload, /synthetic-company/);
  assert.match(fixtureModule.syntheticSerializedSubmissionPayload, /fixture\.invalid/);
  assert.doesNotMatch(fixtureModule.syntheticSerializedSubmissionPayload, /supabase\.co|gewerkeliste\.com|@/i);
  assert.equal(fixtureModule.syntheticResolvedMedia(fixtureModule.syntheticLogoReference, "data:image/svg+xml,fixture").status, "available");
  assert.equal(fixtureModule.syntheticResolvedMedia(fixtureModule.syntheticUnavailableReference).status, "unavailable");
  assert.equal(fixtureModule.syntheticResolvedMedia(fixtureModule.syntheticMissingReference).status, "missing");
});
