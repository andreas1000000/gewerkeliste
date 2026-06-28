import type { TaxonomyTrade } from "@/lib/trade-taxonomy";
import { serviceTermsByTradeSlug } from "@/lib/service-taxonomy";

export type TradeSearchEntry<T extends TaxonomyTrade = TaxonomyTrade> = {
  trade: T;
  searchText: string;
  expansionText: string;
};

const weakExpansionTokens = new Set([
  "und",
  "oder",
  "der",
  "die",
  "das",
  "mit",
  "fuer",
  "von",
  "im",
  "in",
  "am",
  "an",
  "bei",
  "arbeiten",
  "arbeit",
  "betrieb",
  "betriebe",
  "fachbetrieb",
  "fachbetriebe",
  "unternehmen",
  "service",
  "planung",
  "ausfuehren",
  "ausfuehrung",
]);

const serviceSearchTerms = serviceTermsByTradeSlug();

export function createTradeSearchEntry<T extends TaxonomyTrade>(trade: T, extraTerms: string[] = []): TradeSearchEntry<T> {
  const serviceTerms = serviceSearchTerms.get(trade.slug) || [];
  const searchableTerms = [
    trade.name,
    trade.slug,
    trade.category,
    trade.shortDescription,
    trade.seoTitle,
    trade.seoDescription,
    ...trade.synonyms,
    ...trade.subTrades,
    ...trade.coreServices,
    ...trade.specializations,
    ...trade.projectTypes,
    ...trade.relatedTrades,
    ...trade.typicalBusinessTypes,
    ...serviceTerms,
    ...extraTerms,
  ];
  const expansionTerms = [
    trade.name,
    trade.slug,
    trade.category,
    ...trade.synonyms,
    ...trade.subTrades,
    ...trade.specializations,
    ...trade.projectTypes,
    ...trade.relatedTrades,
    ...trade.typicalBusinessTypes,
    ...serviceTerms,
    ...extraTerms,
  ];

  return {
    trade,
    searchText: normalizeSearchTerm(searchableTerms.join(" ")),
    expansionText: normalizeSearchTerm(expansionTerms.join(" ")),
  };
}

export function rankTradeEntries<T extends TaxonomyTrade>(entries: Array<TradeSearchEntry<T>>, rawQuery: string) {
  const query = normalizeSearchTerm(rawQuery);
  if (!query) return entries;

  const expandedTokens = buildQueryExpansion(entries, query);
  return entries
    .map((entry) => ({ entry, score: scoreTradeEntry(entry, query, expandedTokens) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.trade.name.localeCompare(b.entry.trade.name, "de"))
    .map((result) => result.entry);
}

export function scoreTradeEntry(entry: TradeSearchEntry, query: string, expandedTokens = buildQueryExpansion([entry], query)) {
  const tradeName = normalizeSearchTerm(entry.trade.name);
  const slug = normalizeSearchTerm(entry.trade.slug);
  const queryTokens = usefulTokens(query);
  let score = 0;

  if (tradeName === query || slug === query) score += 150;
  if (tradeName.includes(query) || slug.includes(query)) score += 95;
  if (entry.searchText.includes(query)) score += 45;

  queryTokens.forEach((token) => {
    if (tradeName.includes(token) || slug.includes(token)) score += 45;
    if (entry.searchText.includes(token)) score += 28;
  });

  expandedTokens.forEach((token) => {
    if (token === query || queryTokens.includes(token)) return;
    if (tradeName.includes(token) || slug.includes(token)) score += 18;
    else if (entry.searchText.includes(token)) score += 8;
  });

  const words = usefulTokens(entry.searchText);
  if (words.some((word) => fuzzyClose(word, query))) score += 16;

  return score;
}

export function normalizeSearchTerm(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(bauten|betriebe|arbeiten|arbeit)\b/g, "")
    .trim();
}

function buildQueryExpansion(entries: TradeSearchEntry[], query: string) {
  const seedEntries = entries.filter((entry) => directMatchScore(entry, query) > 0);
  const relatedKeys = new Set(seedEntries.flatMap((entry) => entry.trade.relatedTrades.map(normalizeSearchTerm)));
  const relatedEntries = entries.filter((entry) => {
    const slug = normalizeSearchTerm(entry.trade.slug);
    const name = normalizeSearchTerm(entry.trade.name);
    return relatedKeys.has(slug) || relatedKeys.has(name);
  });
  const expansionText = [...seedEntries, ...relatedEntries].map((entry) => entry.expansionText).join(" ");
  return usefulTokens(expansionText).filter((token) => token.length >= Math.min(Math.max(query.length, 4), 8));
}

function directMatchScore(entry: TradeSearchEntry, query: string) {
  const tradeName = normalizeSearchTerm(entry.trade.name);
  const slug = normalizeSearchTerm(entry.trade.slug);
  if (tradeName === query || slug === query) return 100;
  if (tradeName.includes(query) || slug.includes(query)) return 80;
  if (entry.searchText.includes(query)) return 40;
  return usefulTokens(query).some((token) => entry.searchText.includes(token)) ? 20 : 0;
}

function usefulTokens(value: string) {
  return Array.from(new Set(normalizeSearchTerm(value).split(" ").filter((token) => token.length > 1 && !weakExpansionTokens.has(token))));
}

function fuzzyClose(word: string, query: string) {
  if (query.length < 5 || word.length < 5) return false;
  if (Math.abs(word.length - query.length) > 2) return false;
  return levenshtein(word, query) <= 2;
}

function levenshtein(a: string, b: string) {
  const costs = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = costs[j];
      costs[j] = a[i - 1] === b[j - 1] ? costs[j - 1] : Math.min(costs[j - 1], previous, costs[j]) + 1;
      previous = current;
    }
    costs[0] = i;
  }
  return costs[b.length];
}
