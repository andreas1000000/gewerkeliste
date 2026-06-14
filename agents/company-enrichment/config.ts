export const COMPANY_ENRICHMENT_CONFIG = {
  defaultLimit: 20,
  defaultTimeoutMs: 8000,
  defaultMaxSearchQueries: 8,
  autoAcceptConfidence: 75,
  reviewMinConfidence: 50,
  userAgent: "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)",
  sourceWeights: {
    officialWebsiteImprint: 100,
    officialWebsiteServices: 95,
    officialWebsiteContact: 90,
    officialWebsiteHome: 85,
    chamberOrGuild: 70,
    businessDirectory: 50,
    municipality: 20,
    osm: 10,
  },
} as const;

export const ENRICHMENT_JOB_STATUSES = ["pending", "running", "done", "failed", "review"] as const;

export type EnrichmentJobStatus = (typeof ENRICHMENT_JOB_STATUSES)[number];
