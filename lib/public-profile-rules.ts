import { normalizeSocialLinkUrl } from "./social-links.ts";

const PUBLIC_REVIEW_STATUS = "approved";

const DANGEROUS_PROTOCOLS = new Set(["javascript:", "data:", "vbscript:", "file:", "blob:"]);

const CERTIFICATE_VERIFICATION_LABELS = {
  self_declared: {
    label: "Eigenangabe des Betriebs",
    description: "Der Betrieb hat diese Angabe selbst bereitgestellt. GewerkeListe hat daraus keine fachliche Pruefung abgeleitet.",
  },
  document_uploaded: {
    label: "Nachweis vom Betrieb hinterlegt",
    description: "Der Betrieb hat einen Nachweis hinterlegt. Das bedeutet nicht automatisch, dass Inhalt, Gueltigkeit oder fachliche Qualitaet geprueft wurden.",
  },
  gewerkeliste_checked: {
    label: "Durch GewerkeListe geprueft",
    description: "Dieser Pruefstatus wird nur angezeigt, wenn er ausdruecklich im Datensatz hinterlegt ist.",
  },
} as const;

export type CertificateVerificationLevel = keyof typeof CERTIFICATE_VERIFICATION_LABELS;

export type PublicProfileEntitlements = {
  profilePackage: "basis" | "verified_start" | "unknown";
  isVerified: boolean;
  verifiedStartEligible: boolean;
  canUseBasicCompanyData: true;
  canUsePrimaryContact: boolean;
  canUseBasicSocialLinks: boolean;
  canShowVerificationBadge: boolean;
  canPublishReferences: boolean;
  canPublishReferenceMedia: boolean;
  canPublishMultipleContacts: boolean;
  canPublishTeam: boolean;
  canPublishCertificates: boolean;
  canPublishAdvancedSocialContent: boolean;
  canViewProfileAnalytics: boolean;
  modules: {
    baseProfile: true;
    contacts: boolean;
    team: boolean;
    references: boolean;
    referenceMedia: boolean;
    certificates: boolean;
    socialLinks: boolean;
    profileSections: boolean;
  };
};

type ProfileContentSummary = {
  contacts?: readonly unknown[] | null;
  teamMembers?: readonly unknown[] | null;
  references?: readonly unknown[] | null;
  referenceMedia?: readonly unknown[] | null;
  certificates?: readonly unknown[] | null;
  socialLinks?: readonly unknown[] | null;
  profileSections?: readonly unknown[] | null;
};

type EntitlementCompany = {
  profile_package?: string | null;
  profile_status?: string | null;
  verified?: boolean | null;
  premium_started_at?: string | null;
  premium_expires_at?: string | null;
  contact_person_name?: string | null;
  contact_name?: string | null;
  contact_person_email?: string | null;
  contact_person_phone?: string | null;
  profile_image_url?: string | null;
  references_text?: string | null;
  memberships?: readonly unknown[] | null;
  certificates?: readonly unknown[] | null;
  manufacturer_certificates?: readonly unknown[] | null;
  premium_profile?: ProfileContentSummary | null;
};

export function isApprovedPublicStatus(value: unknown) {
  return value === PUBLIC_REVIEW_STATUS;
}

export function normalizePublicExternalUrl(value?: string | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;
  if (/[\u0000-\u001f\s]/.test(trimmed)) return null;

  const explicitProtocol = trimmed.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (explicitProtocol && DANGEROUS_PROTOCOLS.has(`${explicitProtocol}:`)) return null;

  const candidate = trimmed.startsWith("//")
    ? `https:${trimmed}`
    : explicitProtocol
      ? trimmed
      : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname || url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function publicJsonLdSocialUrls(links?: readonly { url?: string | null }[] | null) {
  const safeUrls = (Array.isArray(links) ? links : [])
    .map((link) => {
      const platform = (link as { platform?: string | null }).platform || null;
      return platform ? normalizeSocialLinkUrl(platform, link.url) : normalizePublicExternalUrl(link.url);
    })
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(safeUrls));
}

export function certificateVerificationInfo(value?: string | null) {
  if (value === "document_uploaded" || value === "gewerkeliste_checked") {
    return CERTIFICATE_VERIFICATION_LABELS[value];
  }

  return CERTIFICATE_VERIFICATION_LABELS.self_declared;
}

export function publicCertificateFileUrl() {
  return null;
}

export function publicReferenceClientName(value: unknown, clientPublic: unknown) {
  if (clientPublic !== true) return null;
  const name = typeof value === "string" ? value.trim() : "";
  return name || null;
}

export function isPublicReferenceImageMediaType(value: unknown) {
  const mediaType = typeof value === "string" ? value.trim().toLowerCase() : "";
  return !mediaType || mediaType === "image";
}

export function approvedSubmissionFileStoragePath(file: unknown) {
  if (!file || typeof file !== "object") return null;
  const candidate = file as { review_status?: unknown; storage_path?: unknown };
  if (candidate.review_status !== PUBLIC_REVIEW_STATUS) return null;
  const storagePath = typeof candidate.storage_path === "string" ? candidate.storage_path.trim() : "";
  if (!storagePath || storagePath.includes("\0")) return null;
  return storagePath;
}

export function mergePublicItemsByKey<T>(primary: T[], fallback: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const item of [...primary, ...fallback]) {
    const key = keyFor(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

export function isMissingPublicProfileSchemaError(error: unknown) {
  const candidate = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const message = [candidate?.message, candidate?.details, candidate?.hint]
    .map((item) => (typeof item === "string" ? item : ""))
    .join(" ")
    .toLowerCase();

  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST200" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("could not find") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("column")
  );
}

export function publicProfileRowsOrEmpty<T>(data: T[] | null | undefined, error: unknown) {
  if (error) return [];
  return Array.isArray(data) ? data : [];
}

export function isPublicCompanyNotFoundError(error: unknown) {
  const candidate = error as { code?: unknown; message?: unknown; details?: unknown };
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const message = [candidate?.message, candidate?.details]
    .map((item) => (typeof item === "string" ? item : ""))
    .join(" ")
    .toLowerCase();

  return code === "PGRST116" || message.includes("contains 0 rows");
}

export function isLocalFixtureCompanyRecord(company: {
  trust_badge?: unknown;
  voluntary_support_status?: unknown;
  email?: unknown;
  description?: unknown;
} | null | undefined) {
  if (!company) return false;
  const marker = [company.trust_badge, company.voluntary_support_status]
    .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .filter(Boolean);
  const description = typeof company.description === "string" ? company.description.toLowerCase() : "";
  const email = typeof company.email === "string" ? company.email.toLowerCase() : "";

  return (
    marker.includes("phase3-local-fixture") ||
    marker.includes("local-test") ||
    (email.endsWith("@example.invalid") && description.includes("lokale phase-3-testdaten"))
  );
}

export function getPublicProfileEntitlements(company: EntitlementCompany): PublicProfileEntitlements {
  const premiumProfile = company.premium_profile || {};
  const profilePackage = company.profile_package === "verified_start" ? "verified_start" : company.profile_package === "basis" ? "basis" : "unknown";
  const isVerified = Boolean(company.verified || company.profile_status === "verified");
  const verifiedStartEligible = isVerifiedStartProfileActive(company);
  const canUsePrimaryContact = Boolean(
    hasItems(premiumProfile.contacts) ||
      company.contact_person_name ||
      company.contact_name ||
      company.contact_person_phone ||
      company.contact_person_email ||
      company.profile_image_url,
  );
  const canUseBasicSocialLinks = hasItems(premiumProfile.socialLinks);

  const modules = {
    baseProfile: true as const,
    contacts: canUsePrimaryContact || (verifiedStartEligible && hasItems(premiumProfile.contacts)),
    team: verifiedStartEligible && hasItems(premiumProfile.teamMembers),
    references: verifiedStartEligible && (hasItems(premiumProfile.references) || Boolean(company.references_text)),
    referenceMedia: verifiedStartEligible && hasItems(premiumProfile.referenceMedia),
    certificates:
      verifiedStartEligible &&
      (hasItems(premiumProfile.certificates) ||
        hasItems(company.memberships) ||
        hasItems(company.certificates) ||
        hasItems(company.manufacturer_certificates)),
    socialLinks: canUseBasicSocialLinks,
    profileSections: verifiedStartEligible && hasItems(premiumProfile.profileSections),
  };

  return {
    profilePackage,
    isVerified,
    verifiedStartEligible,
    canUseBasicCompanyData: true,
    canUsePrimaryContact,
    canUseBasicSocialLinks,
    canShowVerificationBadge: verifiedStartEligible,
    canPublishReferences: verifiedStartEligible,
    canPublishReferenceMedia: verifiedStartEligible,
    canPublishMultipleContacts: verifiedStartEligible,
    canPublishTeam: verifiedStartEligible,
    canPublishCertificates: verifiedStartEligible,
    canPublishAdvancedSocialContent: verifiedStartEligible,
    canViewProfileAnalytics: verifiedStartEligible,
    modules,
  };
}

export function isVerifiedStartProfileActive(
  company: Pick<EntitlementCompany, "profile_package" | "profile_status" | "verified" | "premium_started_at" | "premium_expires_at">,
  now = new Date(),
) {
  const profilePackage = company.profile_package === "verified_start" ? "verified_start" : company.profile_package === "basis" ? "basis" : "unknown";
  const isVerified = Boolean(company.verified || company.profile_status === "verified");
  if (profilePackage !== "verified_start" || !isVerified) return false;

  const startsAt = parseEntitlementDate(company.premium_started_at);
  const expiresAt = parseEntitlementDate(company.premium_expires_at);
  if (startsAt && startsAt.getTime() > now.getTime()) return false;
  if (expiresAt && expiresAt.getTime() <= now.getTime()) return false;
  return true;
}

function hasItems(value?: readonly unknown[] | null) {
  return Array.isArray(value) && value.length > 0;
}

function parseEntitlementDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}
