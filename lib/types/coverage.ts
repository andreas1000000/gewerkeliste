import type { Company, Trade } from "@/lib/types";

export type Region = {
  id: string;
  name: string;
  slug: string;
  postal_codes: string[];
  municipality: string | null;
  county: string | null;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  region_type: string;
  created_at: string;
  updated_at: string;
};

export type CompanyCandidateStatus =
  | "discovered"
  | "website_found"
  | "enriched"
  | "needs_review"
  | "rejected"
  | "promoted"
  | "ready_for_publish";

export type RegionalCompanyCandidate = {
  id: string;
  name: string;
  city: string | null;
  postal_code: string | null;
  street: string | null;
  possible_trade: string | null;
  possible_website: string | null;
  phone: string | null;
  email: string | null;
  source_type: string;
  source_url: string;
  discovery_confidence: number | null;
  identity_confidence: number | null;
  trade_confidence: number | null;
  overall_score: number | null;
  status: CompanyCandidateStatus;
  duplicate_of_company_id: string | null;
  raw_evidence: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  duplicate_company?: Pick<Company, "id" | "name" | "slug" | "city" | "postal_code"> | null;
};

export type CoverageSnapshot = {
  id: string;
  region_id: string;
  trade_id: string;
  found_companies: number;
  candidate_companies: number;
  estimated_companies: number;
  coverage_percent: number;
  quality_average: number;
  created_at: string;
  regions?: Pick<Region, "id" | "name" | "slug"> | null;
  trades?: Pick<Trade, "id" | "name" | "slug"> | null;
};
