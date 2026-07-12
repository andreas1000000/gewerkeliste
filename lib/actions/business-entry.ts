"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prepareSubmissionMedia } from "@/lib/company-media-upload";
import { preparePremiumSubmissionMedia } from "@/lib/premium-submission-media";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CompanyFormState } from "@/lib/types";
import { parseBusinessSubmissionForm } from "@/lib/validation";

export async function submitBusinessEntry(
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const parsed = parseBusinessSubmissionForm(formData);
  if (parsed.state) return parsed.state;

  const input = parsed.data;
  if (!input) return { ok: false, message: "Ungueltige Eingabe." };

  const supabase = getSupabaseAdmin();
  const submissionId = randomUUID();
  const mediaResult = await prepareSubmissionMedia(formData, submissionId, input.companyName);
  if (!mediaResult.ok) {
    return {
      ok: false,
      message: mediaResult.message,
      fieldErrors: mediaResult.fieldErrors,
    };
  }
  const media = mediaResult.media;
  const premiumMediaResult = await preparePremiumSubmissionMedia(formData, submissionId, input.premiumSubmissionPayload);
  if (!premiumMediaResult.ok) {
    return {
      ok: false,
      message: premiumMediaResult.message,
      fieldErrors: premiumMediaResult.fieldErrors,
    };
  }

  const { data, error } = await supabase
    .from("company_submissions")
    .insert({
      id: submissionId,
      status: "submitted",
      company_name: input.companyName,
      legal_form: input.legalForm,
      website: input.website,
      phone: input.phone,
      email: input.email,
      contact_email: input.contactEmail,
      contact_first_name: input.contactFirstName,
      contact_last_name: input.contactLastName,
      contact_role: input.contactRole,
      contact_person_email: input.contactPersonEmail,
      contact_person_phone: input.contactPersonPhone,
      logo_url: media.logoUrl,
      profile_image_url: media.profileImageUrl,
      profile_image_alt: media.profileImageAlt,
      contact_person_name: media.contactPersonName || [input.contactFirstName, input.contactLastName].filter(Boolean).join(" ") || null,
      contact_person_role: media.contactPersonRole || input.contactRole,
      image_consent_given: media.imageConsentGiven,
      image_consent_timestamp: media.imageConsentTimestamp,
      street: input.street,
      house_number: input.houseNumber,
      postal_code: input.postalCode,
      city: input.city,
      region: input.region,
      country: input.country,
      primary_trade: input.primaryTrade,
      secondary_trades: input.secondaryTrades,
      selected_services: input.selectedServices,
      specializations: input.additionalSpecializations
        ? [...input.specializations, input.additionalSpecializations]
        : input.specializations,
      service_radius_km: input.serviceRadiusKm,
      service_regions: input.serviceRegions,
      postal_codes: input.postalCodes,
      service_countries: input.serviceCountries,
      municipality_codes: input.municipalityCodes,
      short_description: input.shortDescription,
      description: input.description,
      references_text: input.referencesText,
      memberships: input.memberships,
      certificates: input.certificates,
      manufacturer_certificates: input.manufacturerCertificates,
      wants_founder_verification: input.wantsFounderVerification,
      wants_support_contribution: input.supportContribution !== "none",
      support_contribution_amount:
        input.supportContribution === "none"
          ? null
          : input.supportContribution === "custom"
            ? input.supportCustomAmount
            : Number(input.supportContribution),
      support_invoice_requested: input.supportInvoiceRequested,
      premium_submission_payload: premiumMediaResult.payload,
      consent_authorized: input.consentAuthorized,
      consent_data_correct: input.consentDataCorrect,
      consent_privacy: input.consentPrivacy,
      source: "betrieb-eintragen",
    })
    .select("id")
    .single();

  if (error) {
    const missingTable = error.code === "42P01" || error.message.toLowerCase().includes("company_submissions");
    const missingMunicipalitySchema =
      error.code === "42703" ||
      error.code === "23503" ||
      error.message.toLowerCase().includes("municipalit");
    return {
      ok: false,
      message: missingTable
        ? "Die Einreichungstabelle ist noch nicht in Supabase angelegt. Die Migration liegt im Projekt bereit."
        : missingMunicipalitySchema
          ? "Der amtliche Gemeindekatalog ist noch nicht in Supabase angelegt. Die Migration liegt im Projekt bereit."
          : "Die Einreichung konnte gerade nicht gespeichert werden. Bitte versuche es später erneut.",
    };
  }

  revalidatePath("/admin/companies");
  return {
    ok: true,
    message:
      "Vielen Dank. Ihr Betriebseintrag wurde eingereicht. Wir pruefen die Angaben und melden uns, falls Rueckfragen bestehen.",
    fieldErrors: data?.id ? { submissionId: String(data.id) } : undefined,
  };
}
