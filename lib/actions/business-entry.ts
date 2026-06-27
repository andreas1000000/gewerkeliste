"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CompanyFormState } from "@/lib/types";
import { parseBusinessSubmissionForm } from "@/lib/validation";

const COMPANY_MEDIA_BUCKET = "company-media";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

type UploadedMedia = {
  logoUrl?: string;
  profileImageUrl?: string;
};

type UploadFailure = {
  error: string;
};

export async function submitBusinessEntry(
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const parsed = parseBusinessSubmissionForm(formData);
  if (parsed.state) return parsed.state;

  const input = parsed.data;
  if (!input) return { ok: false, message: "Ungueltige Eingabe." };

  const supabase = getSupabaseAdmin();
  const companyLogo = fileFromForm(formData, "companyLogo");
  const contactProfileImage = fileFromForm(formData, "contactProfileImage");
  const companyLogoSelected = formData.get("companyLogoSelected") === "true";
  const contactProfileImageSelected = formData.get("contactProfileImageSelected") === "true";
  const mediaSelected = Boolean(companyLogo || contactProfileImage);

  if (companyLogoSelected && !companyLogo) {
    return {
      ok: false,
      message:
        "Das Firmenlogo wurde im Formular ausgewaehlt, aber nicht an den Server uebertragen. Bitte die Datei erneut auswaehlen und den Eintrag noch einmal absenden.",
      fieldErrors: { companyLogo: "Logo-Datei wurde nicht uebertragen." },
    };
  }

  if (contactProfileImageSelected && !contactProfileImage) {
    return {
      ok: false,
      message:
        "Das Ansprechpartnerbild wurde im Formular ausgewaehlt, aber nicht an den Server uebertragen. Bitte die Datei erneut auswaehlen und den Eintrag noch einmal absenden.",
      fieldErrors: { contactProfileImage: "Profilbild wurde nicht uebertragen." },
    };
  }

  if (contactProfileImage && !input.imageConsentGiven) {
    return {
      ok: false,
      message: "Bitte Berechtigung und Zustimmung fuer das Ansprechpartnerbild bestaetigen.",
      fieldErrors: { imageConsentGiven: "Zustimmung fuer das Ansprechpartnerbild ist erforderlich." },
    };
  }

  const mediaColumnsReady = mediaSelected ? await ensureSubmissionMediaColumns() : { ok: true as const };
  if (!mediaColumnsReady.ok) {
    return {
      ok: false,
      message: mediaColumnsReady.message,
      fieldErrors: { companyLogo: mediaColumnsReady.message },
    };
  }

  const uploadedMedia: UploadedMedia | UploadFailure = mediaSelected
    ? await uploadSubmissionMedia({
        companyName: input.companyName,
        companyLogo,
        contactProfileImage,
      })
    : ({} satisfies UploadedMedia);

  if ("error" in uploadedMedia) {
    return {
      ok: false,
      message: uploadedMedia.error || "Medien-Upload fehlgeschlagen.",
      fieldErrors: { companyLogo: uploadedMedia.error || "Medien-Upload fehlgeschlagen." },
    };
  }

  const { data, error } = await supabase
    .from("company_submissions")
    .insert({
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
      logo_url: uploadedMedia.logoUrl || null,
      profile_image_url: uploadedMedia.profileImageUrl || null,
      profile_image_alt: uploadedMedia.profileImageUrl ? `${input.companyName} Ansprechpartnerbild` : null,
      contact_person_name: [input.contactFirstName, input.contactLastName].filter(Boolean).join(" ") || null,
      contact_person_role: input.contactRole,
      image_consent_given: input.imageConsentGiven,
      image_consent_timestamp: input.imageConsentGiven ? new Date().toISOString() : null,
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
      consent_authorized: input.consentAuthorized,
      consent_data_correct: input.consentDataCorrect,
      consent_privacy: input.consentPrivacy,
      source: "betrieb-eintragen",
    })
    .select("id")
    .single();

  if (error) {
    const missingTable = error.code === "42P01" || error.message.toLowerCase().includes("company_submissions");
    return {
      ok: false,
      message: missingTable
        ? "Die Einreichungstabelle ist noch nicht in Supabase angelegt. Die Migration liegt im Projekt bereit."
        : error.message,
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

function fileFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  if (!isUploadedFile(value) || value.size === 0) return null;
  return value;
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).size === "number" &&
    typeof (value as File).type === "string"
  );
}

async function ensureSubmissionMediaColumns() {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("company_submissions").select("logo_url, profile_image_url, image_consent_given").limit(1);

  if (!error) return { ok: true as const };
  if (error.code === "42703" || error.message.toLowerCase().includes("logo_url")) {
    return {
      ok: false as const,
      message:
        "Medien koennen noch nicht gespeichert werden: Die Submission-Medienfelder fehlen in Supabase. Bitte zuerst die lokale/Production-Migration fuer Profilmedien pruefen und freigeben.",
    };
  }

  return { ok: true as const };
}

async function uploadSubmissionMedia({
  companyName,
  companyLogo,
  contactProfileImage,
}: {
  companyName: string;
  companyLogo: File | null;
  contactProfileImage: File | null;
}): Promise<UploadedMedia | UploadFailure> {
  const uploaded: { logoUrl?: string; profileImageUrl?: string } = {};

  if (companyLogo) {
    const logo = await uploadMediaFile(companyLogo, companyName, "logo");
    if ("error" in logo) return logo;
    uploaded.logoUrl = logo.url;
  }

  if (contactProfileImage) {
    const profileImage = await uploadMediaFile(contactProfileImage, companyName, "contact");
    if ("error" in profileImage) return profileImage;
    uploaded.profileImageUrl = profileImage.url;
  }

  return uploaded;
}

async function uploadMediaFile(file: File, companyName: string, kind: "logo" | "contact"): Promise<{ url: string } | UploadFailure> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: "Bitte nur PNG, JPG, WebP oder SVG als Logo bzw. PNG, JPG oder WebP als Ansprechpartnerbild hochladen." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Die Bilddatei ist zu gross. Maximal 5 MB sind erlaubt." };
  }

  const extension = extensionFor(file);
  if (kind === "contact" && extension === "svg") {
    return { error: "Ansprechpartnerbilder duerfen kein SVG sein. Bitte PNG, JPG oder WebP verwenden." };
  }

  const supabase = getSupabaseAdmin();
  const path = `submissions/${safeFolder(companyName)}/${kind}-${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(COMPANY_MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return {
      error:
        error.message.toLowerCase().includes("bucket")
          ? `Medien koennen noch nicht gespeichert werden: Supabase Storage Bucket "${COMPANY_MEDIA_BUCKET}" fehlt oder ist nicht erreichbar.`
          : `Medien-Upload fehlgeschlagen: ${error.message}`,
    };
  }

  return { url: path };
}

function extensionFor(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/svg+xml") return "svg";
  const nameExtension = file.name.split(".").pop()?.toLowerCase();
  return nameExtension && /^[a-z0-9]{2,5}$/.test(nameExtension) ? nameExtension : "bin";
}

function safeFolder(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "betrieb";
}
