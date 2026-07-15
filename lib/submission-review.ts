import { normalizeSocialLink } from "./social-links.ts";
import type {
  CompanyPremiumSubmissionPayload,
  PremiumSubmissionCertificate,
  PremiumSubmissionContact,
  PremiumSubmissionMedia,
  PremiumSubmissionProfileSection,
  PremiumSubmissionReference,
  PremiumSubmissionSocialLink,
  PremiumSubmissionTeamMember,
  SubmissionUploadedFile,
} from "./types.ts";

export type SubmissionMediaReferenceStatus = "missing" | "available" | "unavailable" | "invalid";

export type SubmissionMediaReference = {
  path: string | null;
  externalUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  status: SubmissionMediaReferenceStatus;
};

const MEDIA_PATH_PREFIX = "submissions/";
const MEDIA_MIME_TYPES: Record<string, string> = {
  avif: "image/avif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
  png: "image/png",
  webp: "image/webp",
};

export function normalizeSubmissionReviewPayload(value: unknown): CompanyPremiumSubmissionPayload | null {
  const raw = parseObject(value);
  if (!raw) return null;

  const payload: CompanyPremiumSubmissionPayload = {
    requested: rawBoolean(raw.requested),
    request_label: rawStringOrNull(raw.request_label),
    contacts: rawArray(raw.contacts).map(normalizeContact).filter(Boolean) as PremiumSubmissionContact[],
    team_members: rawArray(raw.team_members).map(normalizeTeamMember).filter(Boolean) as PremiumSubmissionTeamMember[],
    references: rawArray(raw.references).map(normalizeReference).filter(Boolean) as PremiumSubmissionReference[],
    reference_media: rawArray(raw.reference_media).map(normalizeReferenceMedia).filter(Boolean) as PremiumSubmissionMedia[],
    certificates: rawArray(raw.certificates).map(normalizeCertificate).filter(Boolean) as PremiumSubmissionCertificate[],
    social_links: normalizeSocialLinks(raw.social_links ?? raw.socialLinks),
    profile_sections: rawArray(raw.profile_sections ?? raw.profileSections)
      .map(normalizeProfileSection)
      .filter(Boolean) as PremiumSubmissionProfileSection[],
    notes: rawStringOrNull(raw.notes),
  };

  return hasSubmissionPayloadContent(payload) ? payload : null;
}

export function submissionMediaReference(value: unknown): SubmissionMediaReference {
  if (typeof value !== "string" || !value.trim()) {
    return { path: null, externalUrl: null, fileName: null, mimeType: null, status: "missing" };
  }

  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const mediaPath = normalizeMediaPath(trimmed);
      if (mediaPath) return mediaReferenceForPath(mediaPath);
      if (url.protocol !== "https:") throw new Error("Unsupported media URL protocol");
      const fileName = decodeURIComponent(url.pathname.split("/").at(-1) || "") || null;
      return {
        path: null,
        externalUrl: url.toString(),
        fileName,
        mimeType: mimeTypeForFileName(fileName),
        status: "available",
      };
    } catch {
      return { path: null, externalUrl: null, fileName: null, mimeType: null, status: "invalid" };
    }
  }

  const path = normalizeMediaPath(value);
  if (!path) {
    return { path: null, externalUrl: null, fileName: null, mimeType: null, status: "invalid" };
  }

  return mediaReferenceForPath(path);
}

function mediaReferenceForPath(path: string): SubmissionMediaReference {
  const fileName = path.split("/").at(-1) || null;
  return {
    path,
    externalUrl: null,
    fileName,
    mimeType: mimeTypeForFileName(fileName),
    status: "unavailable",
  };
}

function mimeTypeForFileName(fileName: string | null) {
  const extension = fileName?.split(".").at(-1)?.toLowerCase() || "";
  return MEDIA_MIME_TYPES[extension] || null;
}

export function normalizeMediaPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /[\\\u0000-\u001f]/.test(trimmed)) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const marker = "/company-media/";
      const markerIndex = url.pathname.indexOf(marker);
      if (markerIndex < 0) return null;
      return normalizeMediaPath(url.pathname.slice(markerIndex + marker.length));
    } catch {
      return null;
    }
  }

  const withoutBucket = trimmed.replace(/^company-media\//i, "").replace(/^\/+/, "");
  if (!withoutBucket.startsWith(MEDIA_PATH_PREFIX)) return null;
  if (withoutBucket.split("/").some((segment) => !segment || segment === "." || segment === "..")) return null;
  return withoutBucket;
}

function normalizeSocialLinks(value: unknown): PremiumSubmissionSocialLink[] {
  return normalizeSubmissionSocialLinkRows(
    rawArray(value).map((item) => {
      const raw = asRecord(item);
      return raw
        ? { platform: raw.platform ?? raw.network, url: raw.url ?? raw.href, label: raw.label }
        : {};
    }),
  );
}

export function normalizeSubmissionSocialLinkRows(
  rows: Array<{ platform?: unknown; url?: unknown; label?: unknown; sort_order?: unknown }>,
): PremiumSubmissionSocialLink[] {
  const links: PremiumSubmissionSocialLink[] = [];
  rows.forEach((row, index) => {
    const normalized = normalizeSocialLink(rawString(row.platform), rawString(row.url), rawStringOrNull(row.label));
    if (!normalized) return;
    links.push({
      platform: normalized.platform,
      url: normalized.url,
      label: normalized.label,
      sort_order: rawNumber(row.sort_order, index + 1),
    });
  });
  return links;
}

function normalizeContact(value: unknown): PremiumSubmissionContact | null {
  const raw = asRecord(value);
  if (!raw) return null;
  return {
    name: rawString(raw.name),
    role: rawStringOrNull(raw.role),
    responsibility_area: rawStringOrNull(raw.responsibility_area ?? raw.responsibilityArea),
    phone: rawStringOrNull(raw.phone),
    email: rawStringOrNull(raw.email),
    image_note: rawStringOrNull(raw.image_note ?? raw.imageNote),
    image_file: normalizeUploadedFile(raw.image_file ?? raw.imageFile),
    sort_order: rawNumber(raw.sort_order, 0),
  };
}

function normalizeTeamMember(value: unknown): PremiumSubmissionTeamMember | null {
  const raw = asRecord(value);
  if (!raw) return null;
  return {
    name: rawString(raw.name),
    role: rawStringOrNull(raw.role),
    department: rawStringOrNull(raw.department),
    description: rawStringOrNull(raw.description),
    image_note: rawStringOrNull(raw.image_note ?? raw.imageNote),
    image_file: normalizeUploadedFile(raw.image_file ?? raw.imageFile),
    sort_order: rawNumber(raw.sort_order, 0),
  };
}

function normalizeReference(value: unknown): PremiumSubmissionReference | null {
  const raw = asRecord(value);
  if (!raw) return null;
  return {
    title: rawString(raw.title),
    location: rawStringOrNull(raw.location),
    year: rawNumberOrNull(raw.year),
    period: rawStringOrNull(raw.period),
    project_type: rawStringOrNull(raw.project_type ?? raw.projectType),
    services: rawStringArray(raw.services),
    description: rawStringOrNull(raw.description),
    client_type: rawStringOrNull(raw.client_type ?? raw.clientType),
    client_name: rawStringOrNull(raw.client_name ?? raw.clientName),
    client_public: rawBoolean(raw.client_public ?? raw.clientPublic),
    challenge: rawStringOrNull(raw.challenge),
    solution: rawStringOrNull(raw.solution),
    sort_order: rawNumber(raw.sort_order, 0),
  };
}

function normalizeReferenceMedia(value: unknown): PremiumSubmissionMedia | null {
  const raw = asRecord(value);
  if (!raw) return null;
  return {
    reference_title: rawStringOrNull(raw.reference_title ?? raw.referenceTitle),
    file_note: rawStringOrNull(raw.file_note ?? raw.fileNote),
    file: normalizeUploadedFile(raw.file),
    caption: rawStringOrNull(raw.caption),
    alt_text: rawStringOrNull(raw.alt_text ?? raw.altText),
    media_type: rawStringOrNull(raw.media_type ?? raw.mediaType) as PremiumSubmissionMedia["media_type"],
    width: rawNumberOrNull(raw.width),
    height: rawNumberOrNull(raw.height),
    category: rawStringOrNull(raw.category),
    sort_order: rawNumber(raw.sort_order, 0),
  };
}

function normalizeCertificate(value: unknown): PremiumSubmissionCertificate | null {
  const raw = asRecord(value);
  if (!raw) return null;
  return {
    title: rawString(raw.title),
    issuer: rawStringOrNull(raw.issuer),
    valid_until: rawStringOrNull(raw.valid_until ?? raw.validUntil),
    description: rawStringOrNull(raw.description),
    file_note: rawStringOrNull(raw.file_note ?? raw.fileNote),
    file: normalizeUploadedFile(raw.file),
    proof_type: rawStringOrNull(raw.proof_type ?? raw.proofType) as PremiumSubmissionCertificate["proof_type"],
    verification_level: rawStringOrNull(raw.verification_level ?? raw.verificationLevel) as PremiumSubmissionCertificate["verification_level"],
    sort_order: rawNumber(raw.sort_order, 0),
  };
}

function normalizeProfileSection(value: unknown): PremiumSubmissionProfileSection | null {
  const raw = asRecord(value);
  if (!raw) return null;
  return {
    title: rawString(raw.title),
    body: rawString(raw.body),
    section_type: rawStringOrNull(raw.section_type ?? raw.sectionType),
    sort_order: rawNumber(raw.sort_order, 0),
  };
}

function normalizeUploadedFile(value: unknown): SubmissionUploadedFile | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const storagePath = rawString(raw.storage_path ?? raw.storagePath ?? raw.file_url ?? raw.fileUrl);
  if (!storagePath) return null;
  return {
    storage_path: storagePath,
    original_filename: rawString(raw.original_filename ?? raw.originalFilename) || "Unbenannte Datei",
    mime_type: rawString(raw.mime_type ?? raw.mimeType) || "application/octet-stream",
    file_size: rawNumber(raw.file_size ?? raw.fileSize, 0),
    review_status: normalizeReviewStatus(raw.review_status ?? raw.reviewStatus),
    submitted_at: rawString(raw.submitted_at ?? raw.submittedAt),
  };
}

function normalizeReviewStatus(value: unknown): SubmissionUploadedFile["review_status"] {
  return value === "approved" || value === "rejected" ? value : "pending";
}

function hasSubmissionPayloadContent(payload: CompanyPremiumSubmissionPayload) {
  return Boolean(
    payload.requested ||
      payload.contacts.length ||
      payload.team_members.length ||
      payload.references.length ||
      payload.reference_media.length ||
      payload.certificates.length ||
      payload.social_links.length ||
      payload.profile_sections.length ||
      payload.notes,
  );
}

function parseObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return asRecord(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function rawArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function rawString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function rawStringOrNull(value: unknown): string | null {
  const normalized = rawString(value);
  return normalized || null;
}

function rawStringArray(value: unknown): string[] {
  return rawArray(value).map(rawString).filter(Boolean);
}

function rawBoolean(value: unknown): boolean {
  return value === true;
}

function rawNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function rawNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
