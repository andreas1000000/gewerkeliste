import type { SearchResult } from "./search-provider";

export type CompanyWebsiteRankingContext = {
  companyName: string;
  city?: string | null;
  postalCode?: string | null;
  tradeHint?: string | null;
};

export type RankedCompanyWebsite = SearchResult & {
  score: number;
  reasons: string[];
  rejected: boolean;
};

const directoryDomains = [
  "riedering.de",
  "gelbeseiten.de",
  "dasoertliche.de",
  "meinestadt.de",
  "cylex.de",
  "11880.com",
  "firmenwissen.de",
  "northdata.de",
  "unternehmensregister.de",
  "branchenbuch",
  "google.",
  "bing.",
  "duckduckgo.",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
];

export function rankCompanyWebsiteResults(results: SearchResult[], context: CompanyWebsiteRankingContext): RankedCompanyWebsite[] {
  return results
    .map((result) => rankCompanyWebsiteResult(result, context))
    .sort((a, b) => b.score - a.score || a.rank - b.rank);
}

export function rankCompanyWebsiteResult(result: SearchResult, context: CompanyWebsiteRankingContext): RankedCompanyWebsite {
  const reasons: string[] = [];
  const host = hostname(result.url);
  const searchable = normalize(`${result.title} ${result.snippet} ${result.url}`);
  const companyTokens = meaningfulTokens(context.companyName);
  const domainTokens = meaningfulTokens(host.replace(/\.(de|net|com|at|ch)$/i, ""));
  let score = 0;

  const directory = isDirectoryDomain(host);
  if (directory) {
    score -= 50;
    reasons.push("Verzeichnisdomain abgewertet");
  }

  const domainNameMatches = companyTokens.filter((token) => domainTokens.some((domainToken) => domainToken.includes(token) || token.includes(domainToken)));
  if (domainNameMatches.length >= Math.min(2, companyTokens.length)) {
    score += 45;
    reasons.push("Domain enthaelt Firmennamen");
  }

  const titleNameMatches = companyTokens.filter((token) => searchable.includes(token));
  if (titleNameMatches.length >= Math.min(2, companyTokens.length)) {
    score += 25;
    reasons.push("Titel oder Snippet enthaelt Firmennamen");
  }

  if (context.city && searchable.includes(normalize(context.city))) {
    score += 20;
    reasons.push("Ort im Treffer");
  }

  if (context.postalCode && searchable.includes(context.postalCode)) {
    score += 20;
    reasons.push("PLZ im Treffer");
  }

  if (/impressum|kontakt|leistung|leistungen|service|angebot/.test(searchable)) {
    score += 15;
    reasons.push("Treffer verweist auf Kontakt/Impressum/Leistungen");
  }

  if (context.tradeHint && searchable.includes(normalize(context.tradeHint))) {
    score += 10;
    reasons.push("Gewerk-Hinweis im Treffer");
  }

  score += Math.max(0, 10 - result.rank);

  return {
    ...result,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    rejected: directory,
  };
}

export function isDirectoryDomain(host: string): boolean {
  return directoryDomains.some((domain) => host.includes(domain));
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function meaningfulTokens(value: string): string[] {
  return normalize(value)
    .replace(/\b(gmbh|ug|ag|kg|ohg|eg|mbh|firma|elektrotechnik|elektroinstallation|bauunternehmen)\b/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9]/g, ""))
    .filter((token) => token.length >= 3 && !["und", "der", "die", "das"].includes(token));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
