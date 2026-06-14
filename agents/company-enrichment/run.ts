export type EnrichmentRunMode = "dry_run" | "live";

export type EnrichmentRunRequest = {
  companyId?: string;
  name?: string;
  city?: string;
  website?: string;
  mode: EnrichmentRunMode;
};

export type EnrichmentRunReport = {
  ok: boolean;
  mode: EnrichmentRunMode;
  companyId?: string;
  warnings: string[];
  errors: string[];
};

export function assertLiveMode(mode: EnrichmentRunMode) {
  return mode === "live";
}
