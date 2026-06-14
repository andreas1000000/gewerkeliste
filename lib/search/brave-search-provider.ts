import type { SearchProvider, SearchResult } from "./search-provider";

type BraveSearchOptions = {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  maxResults?: number;
  userAgent?: string;
};

export class BraveSearchProvider implements SearchProvider {
  readonly name = "brave_search_api";
  readonly available: boolean;

  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly maxResults: number;
  private readonly userAgent: string;

  constructor(options: BraveSearchOptions = {}) {
    this.apiKey = options.apiKey || process.env.BRAVE_SEARCH_API_KEY;
    this.available = Boolean(this.apiKey);
    this.fetchImpl = options.fetchImpl || fetch;
    this.maxResults = Math.max(1, Math.min(options.maxResults || 5, 10));
    this.userAgent = options.userAgent || "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)";
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.apiKey) return [];

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(this.maxResults));
    url.searchParams.set("country", "de");
    url.searchParams.set("search_lang", "de");

    const response = await this.fetchImpl(url, {
      headers: {
        accept: "application/json",
        "user-agent": this.userAgent,
        "x-subscription-token": this.apiKey,
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Brave Search API HTTP ${response.status}`);
    }

    const json = await response.json();
    return (json.web?.results || []).map((item: { title?: string; url?: string; description?: string }, index: number) => ({
      title: clean(item.title || ""),
      url: item.url || "",
      snippet: clean(item.description || ""),
      source: this.name,
      rank: index + 1,
    })).filter((item: SearchResult) => item.url);
  }
}

function clean(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
