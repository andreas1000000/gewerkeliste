import { z } from "zod";
import type { ClaimStatus, CompanyFormState, CompanyPremiumSubmissionPayload } from "@/lib/types";
import { canonicalTradeSlug, publicTradeTaxonomy } from "@/lib/trade-taxonomy";

export type CompanyInput = {
  trade_id: string;
  name: string;
  description: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  street: string | null;
  city: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  claim_status: ClaimStatus;
  verified: boolean;
};

const emptyToNull = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const requiredString = z.string().trim().min(1);
const validTradeSlugs = new Set(publicTradeTaxonomy().map((trade) => trade.slug));
const phonePattern = /^[+()0-9\s/-]{6,30}$/;

const optionalString = z.preprocess(emptyToNull, z.string().trim().min(1).nullable());
const optionalUrl = z.preprocess(emptyToNull, z.string().trim().url("Website muss eine gueltige URL sein.").nullable());
const optionalEmail = z.preprocess(emptyToNull, z.string().trim().email("E-Mail ist ungueltig.").nullable());
const optionalPhone = z.preprocess(
  emptyToNull,
  z.string().trim().regex(phonePattern, "Telefonnummer wirkt ungueltig.").nullable(),
);

export const companySchema = z.object({
  trade_id: requiredString,
  name: z.string().trim().min(2, "Name ist zu kurz."),
  description: z.string().trim().min(10, "Beschreibung braucht mindestens 10 Zeichen."),
  contact_name: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  email: z.preprocess(emptyToNull, z.string().trim().email("E-Mail ist ungueltig.").nullable()),
  phone: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  website_url: z.preprocess(
    emptyToNull,
    z.string().trim().url("Website muss eine gueltige URL sein.").nullable(),
  ),
  street: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  city: requiredString,
  postal_code: z.string().trim().regex(/^\d{5}$/, "PLZ muss 5-stellig sein."),
  latitude: z.coerce.number().min(-90, "Breitengrad ist ungueltig.").max(90, "Breitengrad ist ungueltig."),
  longitude: z.coerce.number().min(-180, "Laengengrad ist ungueltig.").max(180, "Laengengrad ist ungueltig."),
  claim_status: z.enum(["unclaimed", "pending", "claimed", "rejected"]),
  verified: z.boolean(),
});

export const claimSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().trim().min(2, "Name ist zu kurz."),
  email: z.string().trim().email("E-Mail ist ungueltig."),
  phone: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  message: z.string().trim().min(10, "Nachricht braucht mindestens 10 Zeichen."),
  support_contribution: z.enum(["none", "49", "99", "199", "custom"]),
  support_custom_amount: z.preprocess(emptyToNull, z.coerce.number().min(1, "Bitte Betrag angeben.").nullable()),
  support_invoice_requested: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.support_contribution === "custom" && value.support_custom_amount === null) {
    ctx.addIssue({
      code: "custom",
      message: "Bitte Betrag angeben.",
      path: ["support_custom_amount"],
    });
  }
});

export const csvCompanySchema = z.object({
  name: z.string().trim().min(2),
  trade: z.string().trim().min(2),
  city: z.string().trim().min(1),
  postal_code: z.string().trim().regex(/^\d{5}$/),
  website: z.preprocess(emptyToNull, z.string().trim().url().nullable()),
  email: z.preprocess(emptyToNull, z.string().trim().email().nullable()),
  phone: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const businessSubmissionSchema = z
  .object({
    companyName: z.string().trim().min(2, "Firmenname ist erforderlich."),
    legalForm: optionalString,
    website: optionalUrl,
    phone: optionalPhone,
    email: z.string().trim().email("E-Mail ist ungueltig."),
    contactEmail: optionalEmail,
    contactFirstName: optionalString,
    contactLastName: optionalString,
    contactRole: optionalString,
    contactPersonEmail: optionalEmail,
    contactPersonPhone: optionalPhone,
    street: optionalString,
    houseNumber: optionalString,
    postalCode: z.string().trim().regex(/^\d{4,10}$/, "PLZ ist erforderlich."),
    city: z.string().trim().min(2, "Ort ist erforderlich."),
    region: optionalString,
    country: z.string().trim().min(2, "Land ist erforderlich."),
    primaryTrade: z.string().trim().refine((slug) => validTradeSlugs.has(slug), "Bitte mindestens ein Gewerk auswaehlen."),
    secondaryTrades: z.array(z.string()),
    selectedServices: z.array(z.string()).min(1, "Bitte mindestens eine Leistung auswaehlen."),
    specializations: z.array(z.string()),
    additionalSpecializations: optionalString,
    serviceRadiusKm: z.coerce.number().int().min(1, "Radius muss mindestens 1 km betragen.").max(500, "Radius wirkt zu gross."),
    serviceRegions: z.array(z.string()),
    postalCodes: z.array(z.string()),
    serviceCountries: z.array(z.string()),
    shortDescription: z.string().trim().min(30, "Kurzbeschreibung braucht mindestens 30 Zeichen.").max(500, "Kurzbeschreibung ist zu lang."),
    description: optionalString,
    referencesText: optionalString,
    memberships: z.array(z.string()),
    certificates: z.array(z.string()),
    manufacturerCertificates: z.array(z.string()),
    imageConsentGiven: z.boolean(),
    wantsFounderVerification: z.boolean(),
    supportContribution: z.enum(["none", "49", "99", "199", "custom"]),
    supportCustomAmount: z.preprocess(emptyToNull, z.coerce.number().min(1, "Bitte Betrag angeben.").nullable()),
    supportInvoiceRequested: z.boolean(),
    consentAuthorized: z.literal(true, {
      error: "Bitte Berechtigung bestaetigen.",
    }),
    consentDataCorrect: z.literal(true, {
      error: "Bitte Richtigkeit der Angaben bestaetigen.",
    }),
    consentPrivacy: z.literal(true, {
      error: "Bitte Datenschutzerklaerung bestaetigen.",
    }),
    websiteExtra: z.string().max(0, "Spam erkannt."),
  })
  .superRefine((value, ctx) => {
    if (!value.phone && !value.email) {
      ctx.addIssue({
        code: "custom",
        message: "Bitte mindestens E-Mail oder Telefon angeben.",
        path: ["email"],
      });
    }

    if (value.supportContribution === "custom" && value.supportCustomAmount === null) {
      ctx.addIssue({
        code: "custom",
        message: "Bitte Betrag angeben.",
        path: ["supportCustomAmount"],
      });
    }
  });

export function parseCompanyForm(formData: FormData): { data?: CompanyInput; state?: CompanyFormState } {
  const result = companySchema.safeParse({
    trade_id: getString(formData, "trade_id"),
    name: getString(formData, "name"),
    description: getString(formData, "description"),
    contact_name: getString(formData, "contact_name"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    website_url: getString(formData, "website_url"),
    street: getString(formData, "street"),
    city: getString(formData, "city"),
    postal_code: getString(formData, "postal_code"),
    latitude: getString(formData, "latitude"),
    longitude: getString(formData, "longitude"),
    claim_status: getString(formData, "claim_status") as ClaimStatus,
    verified: formData.get("verified") === "on",
  });

  if (!result.success) {
    return {
      state: {
        ok: false,
        message: "Bitte pruefe die markierten Felder.",
        fieldErrors: flattenZodErrors(result.error),
      },
    };
  }

  return {
    data: result.data,
  };
}

export function parseTradeName(formData: FormData) {
  const name = getString(formData, "name");
  if (name.length < 2) {
    return { error: "Gewerkname ist zu kurz." };
  }
  return { name };
}

export function parseBusinessSubmissionForm(formData: FormData) {
  const result = businessSubmissionSchema.safeParse({
    companyName: getString(formData, "companyName"),
    legalForm: getString(formData, "legalForm"),
    website: getString(formData, "website"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    contactEmail: getString(formData, "contactEmail"),
    contactFirstName: getString(formData, "contactFirstName"),
    contactLastName: getString(formData, "contactLastName"),
    contactRole: getString(formData, "contactRole"),
    contactPersonEmail: getString(formData, "contactPersonEmail"),
    contactPersonPhone: getString(formData, "contactPersonPhone"),
    mediaContactName: getString(formData, "mediaContactName"),
    mediaContactRole: getString(formData, "mediaContactRole"),
    street: getString(formData, "street"),
    houseNumber: getString(formData, "houseNumber"),
    postalCode: getString(formData, "postalCode"),
    city: getString(formData, "city"),
    region: getString(formData, "region"),
    country: getString(formData, "country") || "Deutschland",
    primaryTrade: canonicalTradeSlug(getString(formData, "primaryTrade")),
    secondaryTrades: getStringArray(formData, "secondaryTrades").map(canonicalTradeSlug).filter((slug, index, values) => values.indexOf(slug) === index),
    selectedServices: getStringArray(formData, "selectedServices"),
    specializations: getStringArray(formData, "specializations"),
    additionalSpecializations: getString(formData, "additionalSpecializations"),
    serviceRadiusKm: getString(formData, "serviceRadiusKm"),
    serviceRegions: splitList(getString(formData, "serviceRegions")),
    postalCodes: splitList(getString(formData, "postalCodes")),
    serviceCountries: splitList(getString(formData, "serviceCountries")),
    shortDescription: getString(formData, "shortDescription"),
    description: getString(formData, "description"),
    referencesText: getString(formData, "referencesText"),
    memberships: splitList(getString(formData, "memberships")),
    certificates: splitList(getString(formData, "certificates")),
    manufacturerCertificates: splitList(getString(formData, "manufacturerCertificates")),
    imageConsentGiven: formData.get("imageConsentGiven") === "on",
    wantsFounderVerification: formData.get("wantsFounderVerification") === "on",
    supportContribution: getString(formData, "supportContribution") || "none",
    supportCustomAmount: getString(formData, "supportCustomAmount"),
    supportInvoiceRequested: formData.get("supportInvoiceRequested") === "on",
    consentAuthorized: formData.get("consentAuthorized") === "on",
    consentDataCorrect: formData.get("consentDataCorrect") === "on",
    consentPrivacy: formData.get("consentPrivacy") === "on",
    websiteExtra: getString(formData, "websiteExtra"),
  });

  if (!result.success) {
    return {
      state: {
        ok: false,
        message: "Bitte pruefe die markierten Felder.",
        fieldErrors: flattenZodErrors(result.error),
        values: getBusinessSubmissionValues(formData),
      },
    };
  }

  return { data: { ...result.data, premiumSubmissionPayload: parsePremiumSubmissionPayload(formData) } };
}

export function parsePremiumSubmissionPayload(formData: FormData): CompanyPremiumSubmissionPayload {
  const requested = formData.get("premiumStartProfileRequested") === "on";

  const payload: CompanyPremiumSubmissionPayload = {
    requested,
    request_label: requested ? "Verifiziertes Startprofil fuer 490 EUR netto / 12 Monate angefragt" : null,
    contacts: requested
      ? rowsFromFormData(formData, ["premiumContactName", "premiumContactImageFile"]).map((_, index) => ({
          name: getStringAt(formData, "premiumContactName", index),
          role: emptyToNullableString(getStringAt(formData, "premiumContactRole", index)),
          phone: emptyToNullableString(getStringAt(formData, "premiumContactPhone", index)),
          email: emptyToNullableString(getStringAt(formData, "premiumContactEmail", index)),
          image_note: emptyToNullableString(getStringAt(formData, "premiumContactImageNote", index)),
          sort_order: index + 1,
        })).filter((item, index) => item.name || item.role || item.phone || item.email || item.image_note || hasUploadedFileAt(formData, "premiumContactImageFile", index))
      : [],
    team_members: requested
      ? rowsFromFormData(formData, ["premiumTeamName", "premiumTeamImageFile"]).map((_, index) => ({
          name: getStringAt(formData, "premiumTeamName", index),
          role: emptyToNullableString(getStringAt(formData, "premiumTeamRole", index)),
          description: emptyToNullableString(getStringAt(formData, "premiumTeamDescription", index)),
          image_note: emptyToNullableString(getStringAt(formData, "premiumTeamImageNote", index)),
          sort_order: index + 1,
        })).filter((item, index) => item.name || item.role || item.description || item.image_note || hasUploadedFileAt(formData, "premiumTeamImageFile", index))
      : [],
    references: requested
      ? rowsFromFormData(formData, ["premiumReferenceTitle"]).map((_, index) => ({
          title: getStringAt(formData, "premiumReferenceTitle", index),
          location: emptyToNullableString(getStringAt(formData, "premiumReferenceLocation", index)),
          year: parseOptionalYear(getStringAt(formData, "premiumReferenceYear", index)),
          project_type: emptyToNullableString(getStringAt(formData, "premiumReferenceProjectType", index)),
          services: splitList(getStringAt(formData, "premiumReferenceServices", index)),
          description: emptyToNullableString(getStringAt(formData, "premiumReferenceDescription", index)),
          client_type: emptyToNullableString(getStringAt(formData, "premiumReferenceClientType", index)),
          sort_order: index + 1,
        })).filter((item) => item.title || item.location || item.project_type || item.services.length || item.description || item.client_type)
      : [],
    reference_media: requested
      ? rowsFromFormData(formData, ["premiumReferenceMediaFileNote", "premiumReferenceMediaFile"]).map((_, index) => ({
          reference_title: emptyToNullableString(getStringAt(formData, "premiumReferenceMediaReferenceTitle", index)),
          file_note: emptyToNullableString(getStringAt(formData, "premiumReferenceMediaFileNote", index)),
          caption: emptyToNullableString(getStringAt(formData, "premiumReferenceMediaCaption", index)),
          alt_text: emptyToNullableString(getStringAt(formData, "premiumReferenceMediaAltText", index)),
          sort_order: index + 1,
        })).filter((item, index) => item.reference_title || item.file_note || item.caption || item.alt_text || hasUploadedFileAt(formData, "premiumReferenceMediaFile", index))
      : [],
    certificates: requested
      ? rowsFromFormData(formData, ["premiumCertificateTitle", "premiumCertificateFile"]).map((_, index) => ({
          title: getStringAt(formData, "premiumCertificateTitle", index),
          issuer: emptyToNullableString(getStringAt(formData, "premiumCertificateIssuer", index)),
          valid_until: emptyToNullableString(getStringAt(formData, "premiumCertificateValidUntil", index)),
          description: emptyToNullableString(getStringAt(formData, "premiumCertificateDescription", index)),
          file_note: emptyToNullableString(getStringAt(formData, "premiumCertificateFileNote", index)),
          sort_order: index + 1,
        })).filter((item, index) => item.title || item.issuer || item.valid_until || item.description || item.file_note || hasUploadedFileAt(formData, "premiumCertificateFile", index))
      : [],
    social_links: [],
    profile_sections: [],
    notes: requested ? emptyToNullableString(getString(formData, "premiumSubmissionNotes")) : null,
  };

  return payload;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function rowsFromFormData(formData: FormData, keys: string[]) {
  const length = Math.max(0, ...keys.map((key) => formData.getAll(key).length));
  return Array.from({ length });
}

function getStringAt(formData: FormData, key: string, index: number) {
  const value = formData.getAll(key)[index];
  return typeof value === "string" ? value.trim() : "";
}

function emptyToNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function hasUploadedFileAt(formData: FormData, key: string, index: number) {
  const value = formData.getAll(key)[index];
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).size === "number" &&
    (value as File).size > 0
  );
}

function parseOptionalYear(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100 ? parsed : null;
}

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBusinessSubmissionValues(formData: FormData) {
  return {
    companyName: getString(formData, "companyName"),
    legalForm: getString(formData, "legalForm"),
    website: getString(formData, "website"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    contactEmail: getString(formData, "contactEmail"),
    contactFirstName: getString(formData, "contactFirstName"),
    contactLastName: getString(formData, "contactLastName"),
    contactRole: getString(formData, "contactRole"),
    contactPersonEmail: getString(formData, "contactPersonEmail"),
    contactPersonPhone: getString(formData, "contactPersonPhone"),
    mediaContactName: getString(formData, "mediaContactName"),
    mediaContactRole: getString(formData, "mediaContactRole"),
    street: getString(formData, "street"),
    houseNumber: getString(formData, "houseNumber"),
    postalCode: getString(formData, "postalCode"),
    city: getString(formData, "city"),
    region: getString(formData, "region"),
    country: getString(formData, "country") || "Deutschland",
    primaryTrade: getString(formData, "primaryTrade"),
    secondaryTrades: getStringArray(formData, "secondaryTrades"),
    selectedServices: getStringArray(formData, "selectedServices"),
    additionalSpecializations: getString(formData, "additionalSpecializations"),
    serviceRadiusKm: getString(formData, "serviceRadiusKm") || "50",
    serviceRegions: getString(formData, "serviceRegions"),
    postalCodes: getString(formData, "postalCodes"),
    serviceCountries: getString(formData, "serviceCountries") || "Deutschland",
    shortDescription: getString(formData, "shortDescription"),
    description: getString(formData, "description"),
    referencesText: getString(formData, "referencesText"),
    memberships: getString(formData, "memberships"),
    certificates: getString(formData, "certificates"),
    manufacturerCertificates: getString(formData, "manufacturerCertificates"),
    imageConsentGiven: formData.get("imageConsentGiven") === "on",
    wantsFounderVerification: formData.get("wantsFounderVerification") === "on",
    supportContribution: getString(formData, "supportContribution") || "none",
    supportCustomAmount: getString(formData, "supportCustomAmount"),
    supportInvoiceRequested: formData.get("supportInvoiceRequested") === "on",
    consentAuthorized: formData.get("consentAuthorized") === "on",
    consentDataCorrect: formData.get("consentDataCorrect") === "on",
    consentPrivacy: formData.get("consentPrivacy") === "on",
  };
}

export function flattenZodErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] || "form");
    fieldErrors[key] ||= issue.message;
  }
  return fieldErrors;
}
