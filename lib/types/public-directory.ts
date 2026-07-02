import type { ClaimStatus, Company, Trade } from "@/lib/types";

export type PublicCompany = Company & {
  logo_url?: string | null;
  profile_image_url?: string | null;
  profile_image_alt?: string | null;
  contact_person_name?: string | null;
  contact_person_role?: string | null;
  profile_status?: "imported" | "verified" | "claimed" | "needs_review" | "removed" | null;
  verification_date?: string | null;
  is_free_founding_member?: boolean | null;
  trust_badge?: string | null;
  voluntary_support_status?: string | null;
  service_radius_km?: number | null;
  service_regions?: string[] | null;
  service_postal_codes?: string[] | null;
  references_text?: string | null;
  memberships?: string[] | null;
  certificates?: string[] | null;
  manufacturer_certificates?: string[] | null;
};

export type PublicCompanyWithTrade = PublicCompany & {
  trades: Pick<Trade, "id" | "name" | "slug"> | null;
  company_trades?: PublicCompanyTradeRelation[] | null;
};

export type PublicCompanyTradeRelation = {
  confidence_score: number;
  source: string | null;
  evidence: string | null;
  status?: string | null;
  visibility_level?: string | null;
  trades: Pick<Trade, "id" | "name" | "slug"> | null;
};

export type PublicCompanyTradeMatch = {
  id: string;
  company_id: string;
  trade_id: string;
  confidence_score: number;
  source: string;
  evidence: string | null;
  status?: string | null;
  visibility_level?: string | null;
  created_at: string;
  updated_at: string;
  companies: PublicCompanyWithTrade | null;
  trades: Pick<Trade, "id" | "name" | "slug"> | null;
};

export type PublicCompanyMetadata = {
  name: string;
  city: string;
  postal_code: string;
  description: string;
  trades: { name: string } | null;
};

export type PublicClaimStatus = ClaimStatus;
