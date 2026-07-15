import { submissionMediaReference } from "../../lib/submission-review.ts";

export const syntheticSerializedSubmissionPayload = JSON.stringify({
  requested: false,
  socialLinks: [
    { platform: "instagram", href: "instagram.com/synthetic-company", label: "Instagram" },
    { platform: "linkedin", url: "https://linkedin.com/company/synthetic-company", label: "LinkedIn" },
    { platform: "facebook", url: "javascript:alert(1)", label: "Unsafe fixture link" },
  ],
  contacts: [{
    name: "Synthetische Kontaktperson",
    role: "Büro",
    imageFile: {
      storagePath: "https://fixture.invalid/synthetic-contact.png",
      originalFilename: "synthetic-contact.png",
      mimeType: "image/png",
      fileSize: 2048,
      reviewStatus: "approved",
      submittedAt: "2026-07-14T00:00:00Z",
    },
  }],
});

export const syntheticLogoReference = "https://fixture.invalid/synthetic-logo.svg";
export const syntheticUnavailableReference = "submissions/synthetic/unavailable.png";
export const syntheticMissingReference = null;

export const syntheticLogoPreview = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 240'%3E%3Crect width='640' height='240' rx='24' fill='%2317395c'/%3E%3Cpath d='M96 156 160 72l64 84' fill='none' stroke='%23f7c948' stroke-width='24'/%3E%3Ctext x='260' y='142' fill='white' font-family='Arial' font-size='42' font-weight='700'%3ESYNTHETISCHES LOGO%3C/text%3E%3C/svg%3E";
export const syntheticContactPreview = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'%3E%3Crect width='320' height='320' rx='32' fill='%23dcecf5'/%3E%3Ccircle cx='160' cy='112' r='58' fill='%2317395c'/%3E%3Cpath d='M64 286c12-72 52-108 96-108s84 36 96 108' fill='%2317395c'/%3E%3Ctext x='160' y='306' text-anchor='middle' fill='%236d4a00' font-family='Arial' font-size='16'%3ESYNTHETISCH%3C/text%3E%3C/svg%3E";

export function syntheticResolvedMedia(value: string | null, previewUrl: string | null = null) {
  const reference = submissionMediaReference(value);
  return {
    ...reference,
    previewUrl: reference.status === "available" ? previewUrl : null,
  };
}
