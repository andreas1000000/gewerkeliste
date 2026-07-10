import assert from "node:assert/strict";
import test from "node:test";
import {
  approvedSubmissionFileStoragePath,
  certificateVerificationInfo,
  getPublicProfileEntitlements,
  isPublicReferenceImageMediaType,
  isApprovedPublicStatus,
  isMissingPublicProfileSchemaError,
  mergePublicItemsByKey,
  normalizePublicExternalUrl,
  publicCertificateFileUrl,
  publicJsonLdSocialUrls,
  publicProfileRowsOrEmpty,
  publicReferenceClientName,
} from "../lib/public-profile-rules.ts";

test("pending social links are not public", () => {
  assert.equal(isApprovedPublicStatus("pending"), false);
});

test("dangerous social URL protocols are discarded", () => {
  assert.equal(normalizePublicExternalUrl("javascript:alert(1)"), null);
  assert.equal(normalizePublicExternalUrl("data:text/html,boom"), null);
  assert.equal(normalizePublicExternalUrl("vbscript:msgbox(1)"), null);
  assert.equal(normalizePublicExternalUrl("instagram.com/metallteq"), "https://instagram.com/metallteq");
});

test("private reference client names are removed server side", () => {
  assert.equal(publicReferenceClientName("Privater Auftraggeber", false), null);
  assert.equal(publicReferenceClientName("Privater Auftraggeber", null), null);
  assert.equal(publicReferenceClientName("Oeffentlicher Auftraggeber", true), "Oeffentlicher Auftraggeber");
});

test("internal certificates are not public", () => {
  assert.equal(isApprovedPublicStatus("internal"), false);
});

test("self_declared certificates are labelled as self declared", () => {
  assert.equal(certificateVerificationInfo("self_declared").label, "Eigenangabe des Betriebs");
});

test("missing new public profile tables are recognized as compatible schema gaps", () => {
  assert.equal(isMissingPublicProfileSchemaError({ code: "42P01", message: "relation does not exist" }), true);
  assert.equal(isMissingPublicProfileSchemaError({ code: "PGRST205", message: "Could not find table in schema cache" }), true);
});

test("missing new public profile columns are recognized as compatible schema gaps", () => {
  assert.equal(isMissingPublicProfileSchemaError({ code: "42703", message: "column does not exist" }), true);
  assert.equal(isMissingPublicProfileSchemaError({ code: "PGRST204", message: "Could not find column in schema cache" }), true);
});

test("structured profile rows win over duplicate submission fallback rows", () => {
  const structured = [{ id: "structured", name: "Johannes Lechner", email: "lechner@metallteq.de" }];
  const fallback = [{ id: "submission", name: "Johannes Lechner", email: "lechner@metallteq.de" }];
  const merged = mergePublicItemsByKey(structured, fallback, (item) => `${item.name}|${item.email}`.toLowerCase());

  assert.deepEqual(merged, structured);
});

test("duplicate submission and table rows are rendered once", () => {
  const merged = mergePublicItemsByKey(
    [{ id: "structured", title: "Treppengelaender", location: "Rohrdorf" }],
    [{ id: "fallback", title: "Treppengelaender", location: "Rohrdorf" }],
    (item) => `${item.title}|${item.location}`.toLowerCase(),
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, "structured");
});

test("basis profile remains functional without extension modules", () => {
  const entitlements = getPublicProfileEntitlements({
    profile_package: "basis",
    verified: false,
    premium_profile: {
      contacts: [],
      teamMembers: [],
      references: [],
      referenceMedia: [],
      certificates: [],
      socialLinks: [],
      profileSections: [],
    },
  });

  assert.equal(entitlements.modules.baseProfile, true);
  assert.equal(entitlements.modules.contacts, false);
  assert.equal(entitlements.modules.team, false);
  assert.equal(entitlements.modules.socialLinks, false);
  assert.equal(entitlements.modules.profileSections, false);
});

test("unknown review status is not public", () => {
  assert.equal(isApprovedPublicStatus("approved"), true);
  assert.equal(isApprovedPublicStatus("unknown"), false);
  assert.equal(isApprovedPublicStatus("rejected"), false);
});

test("document_uploaded is not described as checked by GewerkeListe", () => {
  const info = certificateVerificationInfo("document_uploaded");
  assert.equal(info.label, "Nachweis vom Betrieb hinterlegt");
  assert.match(info.description, /nicht automatisch/);
  assert.doesNotMatch(info.label, /GewerkeListe geprueft/);
});

test("gewerkeliste_checked appears only for the exact verification level", () => {
  assert.equal(certificateVerificationInfo("gewerkeliste_checked").label, "Durch GewerkeListe geprueft");
  assert.equal(certificateVerificationInfo("gewerkeliste-check").label, "Eigenangabe des Betriebs");
  assert.equal(certificateVerificationInfo("checked").label, "Eigenangabe des Betriebs");
});

test("private client names are unavailable to JSON-LD consumers", () => {
  const clientName = publicReferenceClientName("Nicht oeffentlicher Auftraggeber", false);
  const jsonLdPayload = JSON.stringify({ clientName });

  assert.equal(clientName, null);
  assert.doesNotMatch(jsonLdPayload, /Nicht oeffentlicher Auftraggeber/);
});

test("unsafe social links are excluded from JSON-LD sameAs values", () => {
  const sameAs = publicJsonLdSocialUrls([
    { url: "https://www.linkedin.com/company/metallteq" },
    { url: "javascript:alert(1)" },
    { url: "data:text/html,boom" },
  ]);

  assert.deepEqual(sameAs, ["https://www.linkedin.com/company/metallteq"]);
});

test("pending contacts are not public", () => {
  assert.equal(isApprovedPublicStatus("pending"), false);
});

test("pending team members are not public", () => {
  assert.equal(isApprovedPublicStatus("pending"), false);
});

test("private certificate file paths are never returned publicly", () => {
  assert.equal(publicCertificateFileUrl("company-media/private/certificate.pdf"), null);
  assert.equal(publicCertificateFileUrl({ storage_path: "company-media/private/certificate.pdf" }), null);
});

test("unknown reference media types are not public image media", () => {
  assert.equal(isPublicReferenceImageMediaType("image"), true);
  assert.equal(isPublicReferenceImageMediaType(undefined), true);
  assert.equal(isPublicReferenceImageMediaType("document"), false);
  assert.equal(isPublicReferenceImageMediaType("audio"), false);
});

test("module query errors return empty rows and preserve the surrounding profile", () => {
  const rows = publicProfileRowsOrEmpty([{ id: "visible" }], null);
  const failedRows = publicProfileRowsOrEmpty([{ id: "should-not-leak" }], { code: "500", message: "boom" });

  assert.deepEqual(rows, [{ id: "visible" }]);
  assert.deepEqual(failedRows, []);
});

test("only approved submission uploads are eligible for signed public media URLs", () => {
  assert.equal(
    approvedSubmissionFileStoragePath({
      storage_path: "phase3/contact-approved.jpg",
      review_status: "approved",
    }),
    "phase3/contact-approved.jpg",
  );
  assert.equal(
    approvedSubmissionFileStoragePath({
      storage_path: "phase3/contact-pending.jpg",
      review_status: "pending",
    }),
    null,
  );
});
