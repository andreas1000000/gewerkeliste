import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

export const COMPANY_MEDIA_BUCKET = "company-media";

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const CONTACT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type MediaKind = "logo" | "contact-person";

type PreparedSubmissionMedia = {
  logoUrl: string | null;
  profileImageUrl: string | null;
  profileImageAlt: string | null;
  contactPersonName: string | null;
  contactPersonRole: string | null;
  imageConsentGiven: boolean;
  imageConsentTimestamp: string | null;
};

export type SubmissionMediaResult =
  | { ok: true; media: PreparedSubmissionMedia }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function prepareSubmissionMedia(formData: FormData, submissionId: string, companyName: string): Promise<SubmissionMediaResult> {
  const logo = fileFromForm(formData, "companyLogo");
  const contactImage = fileFromForm(formData, "contactProfileImage");
  const contactPersonName = nullableFormString(formData, "mediaContactName");
  const contactPersonRole = nullableFormString(formData, "mediaContactRole");
  const hasMediaDetails = Boolean(logo || contactImage || contactPersonName || contactPersonRole);
  const hasUploadedMedia = Boolean(logo || contactImage);
  const consentGiven = formData.get("imageConsentGiven") === "on";

  if (!hasMediaDetails) {
    return {
      ok: true,
      media: emptySubmissionMedia(),
    };
  }

  if (hasUploadedMedia && !consentGiven) {
    return {
      ok: false,
      message: "Bitte bestaetigen Sie, dass Sie berechtigt sind, diese Bilder fuer den Betrieb einzureichen.",
      fieldErrors: { imageConsentGiven: "Berechtigung ist erforderlich." },
    };
  }

  const logoValidation = validateImageFile(logo, "logo");
  if (!logoValidation.ok) return logoValidation;

  const contactValidation = validateImageFile(contactImage, "contact-person");
  if (!contactValidation.ok) return contactValidation;

  const logoUrl = logo ? await uploadSubmissionMediaFile(logo, submissionId, "logo") : null;
  if (logoUrl && typeof logoUrl !== "string") return uploadError(logoUrl.error, "companyLogo");

  const profileImageUrl = contactImage ? await uploadSubmissionMediaFile(contactImage, submissionId, "contact-person") : null;
  if (profileImageUrl && typeof profileImageUrl !== "string") return uploadError(profileImageUrl.error, "contactProfileImage");

  return {
    ok: true,
    media: {
      logoUrl: typeof logoUrl === "string" ? logoUrl : null,
      profileImageUrl: typeof profileImageUrl === "string" ? profileImageUrl : null,
      profileImageAlt: contactImage ? `${companyName} Ansprechpartnerbild` : null,
      contactPersonName,
      contactPersonRole,
      imageConsentGiven: hasUploadedMedia,
      imageConsentTimestamp: hasUploadedMedia ? new Date().toISOString() : null,
    },
  };
}

function emptySubmissionMedia(): PreparedSubmissionMedia {
  return {
    logoUrl: null,
    profileImageUrl: null,
    profileImageAlt: null,
    contactPersonName: null,
    contactPersonRole: null,
    imageConsentGiven: false,
    imageConsentTimestamp: null,
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

function validateImageFile(file: File | null, kind: MediaKind): { ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> } {
  if (!file) return { ok: true };

  const field = kind === "logo" ? "companyLogo" : "contactProfileImage";
  const label = kind === "logo" ? "Firmenlogo" : "Ansprechpartnerbild";
  const maxBytes = kind === "logo" ? LOGO_MAX_BYTES : CONTACT_IMAGE_MAX_BYTES;
  const maxMb = kind === "logo" ? 2 : 5;

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false,
      message: `${label}: Bitte nur JPG, PNG oder WebP hochladen. SVG, GIF, PDF und andere Dateien sind nicht erlaubt.`,
      fieldErrors: { [field]: "Nur JPG, PNG oder WebP erlaubt." },
    };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      message: `${label}: Die Datei ist zu gross. Maximal ${maxMb} MB sind erlaubt.`,
      fieldErrors: { [field]: `Maximal ${maxMb} MB erlaubt.` },
    };
  }

  return { ok: true };
}

async function uploadSubmissionMediaFile(file: File, submissionId: string, kind: MediaKind): Promise<string | { error: string }> {
  const extension = ALLOWED_IMAGE_TYPES.get(file.type);
  if (!extension) return { error: "Dateityp ist nicht erlaubt." };

  const folder = kind === "logo" ? "logo" : "contact-person";
  const path = `submissions/${submissionId}/${folder}/${randomUUID()}.${extension}`;
  const supabase = getSupabaseAdmin();
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

  return path;
}

function uploadError(message: string, field: string): SubmissionMediaResult {
  return { ok: false, message, fieldErrors: { [field]: message } };
}

function nullableFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}
