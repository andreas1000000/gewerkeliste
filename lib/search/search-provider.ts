export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  rank: number;
};

export type SearchProvider = {
  readonly name: string;
  readonly available: boolean;
  search(query: string): Promise<SearchResult[]>;
};

export type CompanySearchContext = {
  companyName: string;
  city?: string | null;
  postalCode?: string | null;
  tradeHint?: string | null;
};

export function buildCompanySearchQueries(context: CompanySearchContext): string[] {
  const companyName = context.companyName.trim();
  const city = (context.city || "").trim();
  const tradeHint = (context.tradeHint || "").trim();
  const queries = [
    companyName,
    [companyName, city].filter(Boolean).join(" "),
    `${companyName} Impressum`,
    `${companyName} Kontakt`,
    `${companyName} Leistungen`,
    [companyName, tradeHint, city].filter(Boolean).join(" "),
  ];

  if (context.postalCode) queries.push(`${companyName} ${context.postalCode}`);

  return [...new Set(queries.map((query) => query.trim()).filter(Boolean))];
}
