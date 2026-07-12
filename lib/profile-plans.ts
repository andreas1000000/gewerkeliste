export type ProfilePlanId = "basis" | "verified_start";

export type ProfileFeatureDefinition = {
  label: string;
  basis: boolean;
  verifiedStart: boolean;
  grandfatheredBasis: boolean;
};

export const PROFILE_PLAN_IDS = {
  basis: "basis",
  verifiedStart: "verified_start",
} as const satisfies Record<string, ProfilePlanId>;

export const PROFILE_FEATURE_MATRIX = {
  companyName: { label: "Betriebsname", basis: true, verifiedStart: true, grandfatheredBasis: false },
  legalForm: { label: "Rechtsform, soweit vorhanden", basis: true, verifiedStart: true, grandfatheredBasis: false },
  locationAndRegion: { label: "Standort, Ort und Region", basis: true, verifiedStart: true, grandfatheredBasis: false },
  trades: { label: "Alle bestätigten Gewerke", basis: true, verifiedStart: true, grandfatheredBasis: false },
  services: { label: "Alle bestätigten konkreten Leistungen", basis: true, verifiedStart: true, grandfatheredBasis: false },
  specializations: { label: "Spezialisierungen", basis: true, verifiedStart: true, grandfatheredBasis: false },
  serviceRegions: { label: "Einsatzregionen, PLZ-Gebiete und Wirkungskreis", basis: true, verifiedStart: true, grandfatheredBasis: false },
  phone: { label: "Telefon", basis: true, verifiedStart: true, grandfatheredBasis: false },
  email: { label: "E-Mail", basis: true, verifiedStart: true, grandfatheredBasis: false },
  website: { label: "Website", basis: true, verifiedStart: true, grandfatheredBasis: false },
  whatsapp: { label: "WhatsApp als direkter Kontaktweg", basis: true, verifiedStart: true, grandfatheredBasis: false },
  logo: { label: "Firmenlogo", basis: true, verifiedStart: true, grandfatheredBasis: false },
  primaryContact: { label: "Ein Hauptansprechpartner mit Name und Funktion", basis: true, verifiedStart: true, grandfatheredBasis: false },
  shortDescription: { label: "Sachliche Kurzbeschreibung", basis: true, verifiedStart: true, grandfatheredBasis: false },
  claimAndCorrection: { label: "Eintrag beanspruchen und Daten korrigieren", basis: true, verifiedStart: true, grandfatheredBasis: false },
  directContact: { label: "Direkte Kontaktaufnahme", basis: true, verifiedStart: true, grandfatheredBasis: false },
  dataReview: { label: "Prüfung und Bestätigung definierter Betriebsdaten", basis: false, verifiedStart: true, grandfatheredBasis: false },
  verificationLabel: { label: "Sichtbare Verifizierungskennzeichnung", basis: false, verifiedStart: true, grandfatheredBasis: false },
  structuredPerformance: { label: "Redaktionell strukturiertes Leistungsprofil", basis: false, verifiedStart: true, grandfatheredBasis: false },
  projectTypesAndAudiences: { label: "Geeignete Projektarten und relevante Zielgruppen", basis: false, verifiedStart: true, grandfatheredBasis: false },
  multipleContacts: { label: "Mehrere Ansprechpartner", basis: false, verifiedStart: true, grandfatheredBasis: false },
  contactImages: { label: "Ansprechpartnerbilder", basis: false, verifiedStart: true, grandfatheredBasis: false },
  responsibilities: { label: "Funktionen und Zuständigkeitsbereiche", basis: false, verifiedStart: true, grandfatheredBasis: false },
  team: { label: "Teamvorstellung mit Bildern", basis: false, verifiedStart: true, grandfatheredBasis: false },
  references: { label: "Strukturierte Referenzen", basis: false, verifiedStart: true, grandfatheredBasis: false },
  referenceImages: { label: "Referenzbilder", basis: false, verifiedStart: true, grandfatheredBasis: false },
  certificates: { label: "Nachweise und Zertifikate mit Prüfstatus", basis: false, verifiedStart: true, grandfatheredBasis: false },
  officialCompanyChannels: { label: "Verknüpfte offizielle Unternehmenskanäle", basis: false, verifiedStart: true, grandfatheredBasis: false },
  personalSetup: { label: "Persönliche Unterstützung bei der Profileinrichtung", basis: false, verifiedStart: true, grandfatheredBasis: false },
  profilePreview: { label: "Profilvorschau vor Veröffentlichung", basis: false, verifiedStart: true, grandfatheredBasis: false },
  correctionLoop: { label: "Eine Korrekturschleife", basis: false, verifiedStart: true, grandfatheredBasis: false },
  extendedPublication: { label: "Erweiterte öffentliche Darstellung für zwölf Monate", basis: false, verifiedStart: true, grandfatheredBasis: false },
} as const satisfies Record<string, ProfileFeatureDefinition>;

export type ProfileFeatureId = keyof typeof PROFILE_FEATURE_MATRIX;

export const BASIS_FEATURES = Object.freeze(
  Object.entries(PROFILE_FEATURE_MATRIX)
    .filter(([, feature]) => feature.basis)
    .map(([id, feature]) => ({ id: id as ProfileFeatureId, ...feature })),
);

export const VERIFIED_START_FEATURES = Object.freeze(
  Object.entries(PROFILE_FEATURE_MATRIX)
    .filter(([, feature]) => feature.verifiedStart)
    .map(([id, feature]) => ({ id: id as ProfileFeatureId, ...feature })),
);

export const VERIFIED_START_PROFILE = {
  id: PROFILE_PLAN_IDS.verifiedStart,
  publicName: "Verifiziertes Startprofil",
  currency: "EUR",
  totalPriceNetEur: 490,
  termMonths: 12,
  monthlyEquivalentNetEur: 490 / 12,
  payment: "einmalige Zahlung",
  recurringPayment: false,
  automaticRenewal: false,
  monthlySubscription: false,
  monthlyCancellation: false,
  orderingEnabled: false,
  paymentEnabled: false,
  bindingContractEnabled: false,
  salesApproval: "NEIN",
  leadFees: false,
  commission: false,
  rankingPreference: false,
  searchRelevanceChange: false,
  publicCopy: {
    totalPrice: "490 € netto Gesamtpreis",
    setupAndPublication: "Für die persönliche Profileinrichtung und 12 Monate Veröffentlichung.",
    monthlyEquivalent: "Entspricht 40,83 € netto pro Monat.",
    payment: "Einmalige Zahlung.",
    renewal: "Keine automatische Verlängerung.",
    fairness: "Keine gekaufte Platzierung.",
  },
} as const;

export const BASIS_PROFILE = {
  id: PROFILE_PLAN_IDS.basis,
  publicName: "Basisprofil",
  currency: "EUR",
  totalPriceNetEur: 0,
  permanentlyFree: true,
  publicCopy: {
    price: "0 €",
    description: "Das kostenlose Basisprofil macht einen Betrieb nach Gewerk, Leistung und Region auffindbar.",
  },
} as const;

export const GRANDFATHERING_RULES = {
  legacyBasicSocialLinks: {
    field: "legacy_basic_social_links",
    appliesTo: "Bereits freigegebene Unternehmenskanäle bestehender Profile.",
    newProfiles: false,
    deletesData: false,
  },
  legacyBasicContactImage: {
    field: "legacy_basic_contact_image",
    appliesTo: "Bereits freigegebene Ansprechpartnerbilder bestehender Profile.",
    newProfiles: false,
    deletesData: false,
  },
  logo: {
    field: null,
    appliesTo: "Firmenlogos bleiben im Basisprofil dauerhaft sichtbar.",
    newProfiles: true,
    deletesData: false,
  },
  fallbackAfterExpiry: {
    field: null,
    appliesTo: "Nach Ablauf werden erweiterte Inhalte nur öffentlich ausgeblendet und nicht gelöscht.",
    newProfiles: true,
    deletesData: false,
  },
} as const;

export function formatNetEuro(value: number) {
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  return `${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)} €`;
}

export function verifiedStartPriceSummary() {
  return {
    totalPrice: formatNetEuro(VERIFIED_START_PROFILE.totalPriceNetEur),
    totalPriceWithNet: `${formatNetEuro(VERIFIED_START_PROFILE.totalPriceNetEur)} netto Gesamtpreis`,
    monthlyEquivalent: formatNetEuro(VERIFIED_START_PROFILE.monthlyEquivalentNetEur),
    term: `${VERIFIED_START_PROFILE.termMonths} Monate`,
    payment: VERIFIED_START_PROFILE.payment,
    renewal: VERIFIED_START_PROFILE.automaticRenewal ? "automatische Verlängerung" : "keine automatische Verlängerung",
  };
}
