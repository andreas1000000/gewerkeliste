import { randomUUID } from "crypto";
import { COMPANY_MEDIA_BUCKET } from "@/lib/company-media-upload";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CompanyPremiumSubmissionPayload, SubmissionUploadedFile } from "@/lib/types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const ALLOWED_CERTIFICATE_TYPES = new Map([
  ...ALLOWED_IMAGE_TYPES,
  ["application/pdf", "pdf"],
]);

type FileGroup = "contacts" | "team" | "references" | "certificates";

type PremiumMediaResult =
  | { ok: true; payload: CompanyPremiumSubmissionPayload }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

export async function preparePremiumSubmissionMedia(
  formData: FormData,
  submissionId: string,
  payload: CompanyPremiumSubmissionPayload,
): Promise<PremiumMediaResult> {
  if (!payload.requested) return { ok: true, payload };

  const fileGroups = {
    contacts: filesFromForm(formData, "premiumContactImageFile"),
    team: filesFromForm(formData, "premiumTeamImageFile"),
    references: filesFromForm(formData, "premiumReferenceMediaFile"),
    certificates: filesFromForm(formData, "premiumCertificateFile"),
  };

  const hasFiles = Object.values(fileGroups).some((files) => files.some(Boolean));
  if (hasFiles && formData.get("premiumMediaConsentGiven") !== "on") {
    return {
      ok: false,
      message: "Bitte bestaetigen Sie, dass Sie berechtigt sind, die Zusatzbilder und Dateien einzureichen.",
      fieldErrors: { premiumMediaConsentGiven: "Berechtigung ist erforderlich." },
    };
  }

  const nextPayload = structuredClone(payload);

  const contacts = await attachFiles(fileGroups.contacts, submissionId, "contacts", "premiumContactImageFile");
  if (!contacts.ok) return contacts;
  contacts.files.forEach((file, index) => {
    if (nextPayload.contacts[index]) nextPayload.contacts[index].image_file = file;
  });

  const team = await attachFiles(fileGroups.team, submissionId, "team", "premiumTeamImageFile");
  if (!team.ok) return team;
  team.files.forEach((file, index) => {
    if (nextPayload.team_members[index]) nextPayload.team_members[index].image_file = file;
  });

  const references = await attachFiles(fileGroups.references, submissionId, "references", "premiumReferenceMediaFile");
  if (!references.ok) return references;
  references.files.forEach((file, index) => {
    if (nextPayload.reference_media[index]) nextPayload.reference_media[index].file = file;
  });

  const certificates = await attachFiles(fileGroups.certificates, submissionId, "certificates", "premiumCertificateFile");
  if (!certificates.ok) return certificates;
  certificates.files.forEach((file, index) => {
    if (nextPayload.certificates[index]) nextPayload.certificates[index].file = file;
  });

  return { ok: true, payload: nextPayload };
}

async function attachFiles(files: Array<File | null>, submissionId: string, group: FileGroup, field: string) {
  const uploaded: Array<SubmissionUploadedFile | null> = [];

  for (const [index, file] of files.entries()) {
    if (!file) {
      uploaded.push(null);
      continue;
    }

    const validation = validateFile(file, group, field);
    if (!validation.ok) return validation;

    const storagePath = await uploadFile(file, submissionId, group, index + 1, validation.extension);
    if (typeof storagePath !== "string") {
      return {
        ok: false as const,
        message: storagePath.error,
        fieldErrors: { [field]: storagePath.error },
      };
    }

    uploaded.push({
      storage_path: storagePath,
      original_filename: file.name || `upload-${index + 1}.${validation.extension}`,
      mime_type: file.type,
      file_size: file.size,
      review_status: "pending",
      submitted_at: new Date().toISOString(),
    });
  }

  return { ok: true as const, files: uploaded };
}

function validateFile(file: File, group: FileGroup, field: string) {
  const allowed = group === "certificates" ? ALLOWED_CERTIFICATE_TYPES : ALLOWED_IMAGE_TYPES;
  const extension = allowed.get(file.type);

  if (!extension) {
    const message =
      group === "certificates"
        ? "Bitte nur PDF, JPG, PNG oder WebP hochladen."
        : "Bitte nur JPG, PNG oder WebP hochladen.";
    return { ok: false as const, message, fieldErrors: { [field]: message } };
  }

  if (file.size > MAX_FILE_BYTES) {
    const message = "Die Datei ist zu gross. Maximal 10 MB sind erlaubt.";
    return { ok: false as const, message, fieldErrors: { [field]: message } };
  }

  return { ok: true as const, extension };
}

async function uploadFile(file: File, submissionId: string, group: FileGroup, index: number, extension: string) {
  const filename = `${String(index).padStart(2, "0")}-${safeFilename(file.name, extension)}-${randomUUID()}.${extension}`;
  const path = `submissions/${submissionId}/verified-start/${group}/${filename}`;
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

function filesFromForm(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => (isUploadedFile(value) ? value : null));
}

function isUploadedFile(value: FormDataEntryValue): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).size === "number" &&
    (value as File).size > 0 &&
    typeof (value as File).type === "string"
  );
}

function safeFilename(name: string, fallbackExtension: string) {
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);

  return base || "datei-" + fallbackExtension;
}
