import type { SearchProvider, SearchResult } from "./search-provider";

export class MockSearchProvider implements SearchProvider {
  readonly name = "mock_search_provider";
  readonly available = true;

  private readonly resultsByQuery: Record<string, SearchResult[]>;

  constructor(resultsByQuery: Record<string, SearchResult[]> = {}) {
    this.resultsByQuery = resultsByQuery;
  }

  async search(query: string): Promise<SearchResult[]> {
    return this.resultsByQuery[query] || [];
  }
}
