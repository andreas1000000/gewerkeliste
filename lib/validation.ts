import { z } from "zod";
import type { ClaimStatus, CompanyFormState } from "@/lib/types";
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
    primaryTrade: z.string().trim().refine((slug) => validTradeSlugs.has(slug), "Bitte Hauptgewerk auswaehlen."),
    secondaryTrades: z.array(z.string()).max(4, "Im Basis-Eintrag sind bis zu 5 Gewerke moeglich."),
    selectedServices: z.array(z.string()).min(1, "Bitte mindestens eine Kernleistung auswaehlen."),
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

    if (!value.wantsFounderVerification && value.selectedServices.length > 5) {
      ctx.addIssue({
        code: "custom",
        message: "Im Basis-Eintrag koennen bis zu 5 Kernleistungen ausgewaehlt werden.",
        path: ["selectedServices"],
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

  return { data: result.data };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string" && value.trim().length > 0);
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
