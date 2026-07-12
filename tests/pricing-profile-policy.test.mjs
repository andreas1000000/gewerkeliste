import assert from "node:assert/strict";
import test from "node:test";
import {
  BASIS_PROFILE,
  BASIS_FEATURES,
  GRANDFATHERING_RULES,
  PROFILE_FEATURE_MATRIX,
  VERIFIED_START_FEATURES,
  VERIFIED_START_PROFILE,
  formatNetEuro,
  verifiedStartPriceSummary,
} from "../lib/profile-plans.ts";

test("defines the verified start profile as a one-time 490 EUR net total price", () => {
  assert.equal(VERIFIED_START_PROFILE.totalPriceNetEur, 490);
  assert.equal(VERIFIED_START_PROFILE.currency, "EUR");
  assert.equal(VERIFIED_START_PROFILE.termMonths, 12);
  assert.equal(VERIFIED_START_PROFILE.monthlyEquivalentNetEur, 490 / 12);
  assert.equal(VERIFIED_START_PROFILE.payment, "einmalige Zahlung");
  assert.equal(VERIFIED_START_PROFILE.recurringPayment, false);
  assert.equal(VERIFIED_START_PROFILE.automaticRenewal, false);
  assert.equal(VERIFIED_START_PROFILE.monthlySubscription, false);
  assert.equal(VERIFIED_START_PROFILE.monthlyCancellation, false);
  assert.equal(VERIFIED_START_PROFILE.orderingEnabled, false);
  assert.equal(VERIFIED_START_PROFILE.paymentEnabled, false);
  assert.equal(VERIFIED_START_PROFILE.bindingContractEnabled, false);
  assert.equal(VERIFIED_START_PROFILE.salesApproval, "NEIN");
  assert.equal(VERIFIED_START_PROFILE.publicCopy.totalPrice, "490 € netto Gesamtpreis");
  assert.equal(VERIFIED_START_PROFILE.publicCopy.monthlyEquivalent, "Entspricht 40,83 € netto pro Monat.");
});

test("formats the total price and monthly calculation in German notation", () => {
  assert.equal(formatNetEuro(490), "490 €");
  assert.equal(formatNetEuro(490 / 12), "40,83 €");
  assert.deepEqual(verifiedStartPriceSummary(), {
    totalPrice: "490 €",
    totalPriceWithNet: "490 € netto Gesamtpreis",
    monthlyEquivalent: "40,83 €",
    term: "12 Monate",
    payment: "einmalige Zahlung",
    renewal: "keine automatische Verlängerung",
  });
});

test("keeps the base profile feature contract permanently free", () => {
  const baseIds = new Set(BASIS_FEATURES.map((feature) => feature.id));

  assert.equal(BASIS_PROFILE.permanentlyFree, true);
  assert.equal(BASIS_PROFILE.totalPriceNetEur, 0);
  assert.equal(BASIS_FEATURES.length, Object.values(PROFILE_FEATURE_MATRIX).filter((feature) => feature.basis).length);
  for (const id of ["logo", "trades", "services", "specializations", "serviceRegions", "primaryContact", "directContact"]) {
    assert.equal(baseIds.has(id), true, `${id} must be in the base profile`);
    assert.equal(PROFILE_FEATURE_MATRIX[id].basis, true);
  }
  assert.equal(PROFILE_FEATURE_MATRIX.contactImages.basis, false);
  assert.equal(PROFILE_FEATURE_MATRIX.officialCompanyChannels.basis, false);
  assert.equal(PROFILE_FEATURE_MATRIX.whatsapp.basis, true);
});

test("keeps extended company presentation in the verified feature contract", () => {
  const verifiedIds = new Set(VERIFIED_START_FEATURES.map((feature) => feature.id));

  for (const id of ["dataReview", "verificationLabel", "contactImages", "multipleContacts", "team", "references", "referenceImages", "certificates", "officialCompanyChannels", "profilePreview"]) {
    assert.equal(verifiedIds.has(id), true, `${id} must be in the verified start profile`);
    assert.equal(PROFILE_FEATURE_MATRIX[id].verifiedStart, true);
  }
});

test("declares fairness and payment boundaries centrally", () => {
  assert.equal(VERIFIED_START_PROFILE.rankingPreference, false);
  assert.equal(VERIFIED_START_PROFILE.searchRelevanceChange, false);
  assert.equal(VERIFIED_START_PROFILE.leadFees, false);
  assert.equal(VERIFIED_START_PROFILE.commission, false);
  assert.equal(VERIFIED_START_PROFILE.publicCopy.fairness, "Keine gekaufte Platzierung.");
});

test("declares non-destructive legacy protection for existing basic content", () => {
  assert.equal(GRANDFATHERING_RULES.legacyBasicSocialLinks.field, "legacy_basic_social_links");
  assert.equal(GRANDFATHERING_RULES.legacyBasicSocialLinks.newProfiles, false);
  assert.equal(GRANDFATHERING_RULES.legacyBasicSocialLinks.deletesData, false);
  assert.equal(GRANDFATHERING_RULES.legacyBasicContactImage.field, "legacy_basic_contact_image");
  assert.equal(GRANDFATHERING_RULES.legacyBasicContactImage.newProfiles, false);
  assert.equal(GRANDFATHERING_RULES.legacyBasicContactImage.deletesData, false);
  assert.equal(GRANDFATHERING_RULES.logo.newProfiles, true);
  assert.equal(GRANDFATHERING_RULES.fallbackAfterExpiry.deletesData, false);
});
