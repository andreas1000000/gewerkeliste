import assert from "node:assert/strict";
import test from "node:test";
import {
  certificateVerificationInfo,
  getPublicProfileEntitlements,
  isApprovedPublicStatus,
  isMissingPublicProfileSchemaError,
  mergePublicItemsByKey,
  normalizePublicExternalUrl,
  publicReferenceClientName,
} from "../lib/public-profile-rules.ts";

test("only approved review status is public", () => {
  assert.equal(isApprovedPublicStatus("approved"), true);
  assert.equal(isApprovedPublicStatus("pending"), false);
  assert.equal(isApprovedPublicStatus("rejected"), false);
  assert.equal(isApprovedPublicStatus("internal"), false);
  assert.equal(isApprovedPublicStatus("unknown"), false);
});

test("dangerous social URL protocols are discarded", () => {
  assert.equal(normalizePublicExternalUrl("javascript:alert(1)"), null);
  assert.equal(normalizePublicExternalUrl("data:text/html,boom"), null);
  assert.equal(normalizePublicExternalUrl("vbscript:msgbox(1)"), null);
  assert.equal(normalizePublicExternalUrl("instagram.com/metallteq"), "https://instagram.com/metallteq");
});

test("private reference clients are removed server side", () => {
  assert.equal(publicReferenceClientName("Privater Auftraggeber", false), null);
  assert.equal(publicReferenceClientName("Privater Auftraggeber", null), null);
  assert.equal(publicReferenceClientName("Oeffentlicher Auftraggeber", true), "Oeffentlicher Auftraggeber");
});

test("certificate verification labels stay precise", () => {
  assert.equal(certificateVerificationInfo("self_declared").label, "Eigenangabe des Betriebs");
  assert.equal(certificateVerificationInfo("document_uploaded").label, "Nachweis vom Betrieb hinterlegt");
  assert.equal(certificateVerificationInfo("gewerkeliste_checked").label, "Durch GewerkeListe geprueft");
  assert.equal(certificateVerificationInfo("unknown").label, "Eigenangabe des Betriebs");
});

test("missing new public profile tables and columns are recognized as compatible schema gaps", () => {
  assert.equal(isMissingPublicProfileSchemaError({ code: "42P01", message: "relation does not exist" }), true);
  assert.equal(isMissingPublicProfileSchemaError({ code: "42703", message: "column does not exist" }), true);
  assert.equal(isMissingPublicProfileSchemaError({ code: "PGRST205", message: "Could not find table in schema cache" }), true);
  assert.equal(isMissingPublicProfileSchemaError({ code: "42501", message: "permission denied" }), false);
});

test("structured profile rows win over duplicate submission fallback rows", () => {
  const structured = [{ id: "structured", name: "Johannes Lechner", email: "lechner@metallteq.de" }];
  const fallback = [{ id: "submission", name: "Johannes Lechner", email: "lechner@metallteq.de" }];
  const merged = mergePublicItemsByKey(structured, fallback, (item) => `${item.name}|${item.email}`.toLowerCase());

  assert.deepEqual(merged, structured);
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
