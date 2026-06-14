export type AnalyzedWebsitePage = {
  url: string;
  role: "impressum" | "leistungen" | "kontakt" | "startseite" | "ueber-uns" | "referenzen" | "sonstige";
  sourceWeight: number;
};

export type WebsiteAnalysis = {
  websiteRoot: string;
  acceptedAsOfficialWebsite: boolean;
  matchingFeatures: string[];
  analyzedPages: AnalyzedWebsitePage[];
  extractedTextSample?: string;
};

export function pageRoleForUrl(url: string): AnalyzedWebsitePage["role"] {
  if (/impressum|anbieterkennzeichnung/i.test(url)) return "impressum";
  if (/leistung|angebot|service/i.test(url)) return "leistungen";
  if (/kontakt|contact/i.test(url)) return "kontakt";
  if (/ueber|über|about/i.test(url)) return "ueber-uns";
  if (/referenz|galerie/i.test(url)) return "referenzen";
  return "startseite";
}
