import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  normalizeSubmissionReviewPayload,
  normalizeSubmissionSocialLinkRows,
  submissionMediaReference,
} from "../lib/submission-review.ts";

const adminSource = await readFile(new URL("../app/admin/submissions/[id]/page.tsx", import.meta.url), "utf8");
const sharedMediaSource = await readFile(new URL("../components/admin/submission-review-media.tsx", import.meta.url), "utf8");

test("legacy and serialized submission payloads keep multiple social links and uploaded media", () => {
  const payload = normalizeSubmissionReviewPayload(JSON.stringify({
    requested: false,
    socialLinks: [
      { platform: "instagram", href: "instagram.com/synthetic-company", label: "Instagram" },
      { platform: "linkedin", url: "https://linkedin.com/company/synthetic-company", label: "LinkedIn" },
    ],
    contacts: [{
      name: "Synthetische Kontaktperson",
      role: "Büro",
      imageFile: {
        storagePath: "submissions/synthetic/contact-person/contact.png",
        originalFilename: "contact.png",
        mimeType: "image/png",
        fileSize: 1024,
        reviewStatus: "pending",
        submittedAt: "2026-07-14T00:00:00Z",
      },
    }],
  }));

  assert.ok(payload);
  assert.equal(payload.requested, false);
  assert.deepEqual(payload.social_links.map((item) => item.url), [
    "https://instagram.com/synthetic-company",
    "https://linkedin.com/company/synthetic-company",
  ]);
  assert.equal(payload.contacts[0].image_file?.storage_path, "submissions/synthetic/contact-person/contact.png");
});

test("unsafe legacy social links are excluded before admin review", () => {
  const payload = normalizeSubmissionReviewPayload({
    social_links: [
      { platform: "instagram", url: "javascript:alert(1)" },
      { platform: "facebook", url: "https://facebook.com/synthetic-company" },
    ],
  });

  assert.ok(payload);
  assert.deepEqual(payload.social_links.map((item) => item.url), ["https://facebook.com/synthetic-company"]);
});

test("media references distinguish missing, invalid, external and stored paths", () => {
  assert.equal(submissionMediaReference(null).status, "missing");
  assert.equal(submissionMediaReference("javascript:alert(1)").status, "invalid");
  assert.equal(submissionMediaReference("submissions/synthetic/logo/logo.png").status, "unavailable");
  assert.equal(submissionMediaReference("submissions/synthetic/logo/logo.png").mimeType, "image/png");
  assert.equal(submissionMediaReference("https://assets.example.test/logo.png").status, "available");
});

test("admin review resolves private media server-side and uses safe external link behavior", () => {
  assert.match(adminSource, /createSignedUrl\(reference\.path/);
  assert.match(sharedMediaSource, /rel="noreferrer noopener" target="_blank"/);
  assert.match(sharedMediaSource, /Eingereicht, aber die Datei ist aktuell nicht abrufbar/);
  assert.doesNotMatch(adminSource, /<div className="break-all text-xs text-muted">\{storedValue \|\| src\}<\/div>/);
  assert.doesNotMatch(adminSource, /<div className="break-all text-xs text-muted">\{file\.storage_path\}<\/div>/);
});

test("basic-profile review remains independent of premium request state", () => {
  const payload = normalizeSubmissionReviewPayload({
    requested: false,
    social_links: [{ platform: "youtube", url: "https://youtube.com/@synthetic-company" }],
  });

  assert.ok(payload);
  assert.equal(payload.requested, false);
  assert.equal(payload.social_links.length, 1);
});

test("form social-link rows are normalized and retained without a premium request", () => {
  const links = normalizeSubmissionSocialLinkRows([
    { platform: "instagram", url: "instagram.com/synthetic-company", label: "Instagram", sort_order: 1 },
    { platform: "linkedin", url: "https://linkedin.com/company/synthetic-company", label: "LinkedIn", sort_order: 2 },
    { platform: "facebook", url: "javascript:alert(1)", label: "unsafe", sort_order: 3 },
  ]);

  assert.deepEqual(links, [
    { platform: "instagram", url: "https://instagram.com/synthetic-company", label: "Instagram", sort_order: 1 },
    { platform: "linkedin", url: "https://linkedin.com/company/synthetic-company", label: "LinkedIn", sort_order: 2 },
  ]);
});
