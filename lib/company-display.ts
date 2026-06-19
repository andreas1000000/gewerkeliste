export function publicResultDescription(description: string | null | undefined) {
  const text = description?.trim();
  if (!text) return "";

  const genericSignals = [
    "Öffentlicher Basis-Eintrag",
    "öffentlich zugänglichen Gewerbedaten",
    "Der Eintrag ist noch nicht vom Betrieb bestätigt",
    "Korrektur oder Löschung kann jederzeit angefragt werden",
    "Quelle:",
  ];

  if (genericSignals.some((signal) => text.includes(signal))) return "";
  return text;
}

export function publicResultImage(company: {
  claim_status: string;
  logo_url?: string | null;
  profile_image_url?: string | null;
  profile_status?: string | null;
  verified: boolean;
}) {
  const hasConfirmedProfile =
    company.verified ||
    company.claim_status === "claimed" ||
    company.profile_status === "verified" ||
    company.profile_status === "claimed";

  if (!hasConfirmedProfile) return "";
  return company.logo_url || company.profile_image_url || "";
}
