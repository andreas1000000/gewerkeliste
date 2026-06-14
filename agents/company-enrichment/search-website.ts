export type WebsiteCandidate = {
  url: string;
  title?: string;
  snippet?: string;
  confidenceScore: number;
  matchingFeatures: string[];
};

export function buildWebsiteSearchQueries(input: { name: string; city?: string; postalCode?: string; phone?: string; street?: string }) {
  const base = input.name.trim();
  const city = input.city?.trim();
  return [
    [base, city].filter(Boolean).join(" "),
    [base, input.postalCode].filter(Boolean).join(" "),
    `${base} Impressum`,
    `${base} Kontakt`,
    `${base} Leistungen`,
    `${base} Referenzen`,
    `${base} Bau`,
    `${base} Handwerk`,
    input.phone ? `"${base}" "${input.phone}"` : "",
    input.street ? `"${base}" "${input.street}"` : "",
  ].filter(Boolean);
}
