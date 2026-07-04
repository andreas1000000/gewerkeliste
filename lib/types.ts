export type ClaimStatus = "unclaimed" | "pending" | "claimed" | "rejected";

export type Trade = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  trade_id: string;
  name: string;
  slug: string;
  description: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  street: string | null;
  city: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  public_visible: boolean;
  claim_status: ClaimStatus;
  verified: boolean;
  profile_package?: "basis" | "verified_start" | null;
  profile_status?: "imported" | "verified" | "claimed" | "needs_review" | "removed" | null;
  verification_date?: string | null;
  premium_started_at?: string | null;
  premium_expires_at?: string | null;
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
  created_at: string;
  updated_at: string;
};

export type PremiumReviewStatus = "pending" | "approved" | "rejected" | "internal";

export type SubmissionUploadedFile = {
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  review_status: "pending" | "approved" | "rejected";
  submitted_at: string;
};

export type CompanyContact = {
  id: string;
  company_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  image_url: string | null;
  sort_order: number;
  is_primary: boolean;
  review_status: PremiumReviewStatus;
  created_at: string;
  updated_at: string;
};

export type CompanyTeamMember = {
  id: string;
  company_id: string;
  name: string;
  role: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  review_status: PremiumReviewStatus;
  created_at: string;
  updated_at: string;
};

export type CompanyReference = {
  id: string;
  company_id: string;
  title: string;
  project_type: string | null;
  location: string | null;
  year: number | null;
  description: string | null;
  services: string[];
  client_type: string | null;
  sort_order: number;
  review_status: PremiumReviewStatus;
  created_at: string;
  updated_at: string;
};

export type CompanyReferenceMedia = {
  id: string;
  company_id: string;
  reference_id: string | null;
  file_url: string;
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
  review_status: PremiumReviewStatus;
  created_at: string;
  updated_at: string;
};

export type CompanyCertificate = {
  id: string;
  company_id: string;
  title: string;
  issuer: string | null;
  issued_at: string | null;
  valid_until: string | null;
  description: string | null;
  file_url: string | null;
  sort_order: number;
  review_status: PremiumReviewStatus;
  created_at: string;
  updated_at: string;
};

export type CompanyPremiumProfile = {
  contacts: CompanyContact[];
  teamMembers: CompanyTeamMember[];
  references: CompanyReference[];
  referenceMedia: CompanyReferenceMedia[];
  certificates: CompanyCertificate[];
};

export type PremiumSubmissionContact = {
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  image_note: string | null;
  image_file?: SubmissionUploadedFile | null;
  sort_order: number;
};

export type PremiumSubmissionTeamMember = {
  name: string;
  role: string | null;
  description: string | null;
  image_note: string | null;
  image_file?: SubmissionUploadedFile | null;
  sort_order: number;
};

export type PremiumSubmissionReference = {
  title: string;
  location: string | null;
  year: number | null;
  project_type: string | null;
  services: string[];
  description: string | null;
  client_type: string | null;
  sort_order: number;
};

export type PremiumSubmissionMedia = {
  reference_title: string | null;
  file_note: string | null;
  file?: SubmissionUploadedFile | null;
  caption: string | null;
  alt_text: string | null;
  sort_order: number;
};

export type PremiumSubmissionCertificate = {
  title: string;
  issuer: string | null;
  valid_until: string | null;
  description: string | null;
  file_note: string | null;
  file?: SubmissionUploadedFile | null;
  sort_order: number;
};

export type CompanyPremiumSubmissionPayload = {
  requested: boolean;
  request_label: string | null;
  contacts: PremiumSubmissionContact[];
  team_members: PremiumSubmissionTeamMember[];
  references: PremiumSubmissionReference[];
  reference_media: PremiumSubmissionMedia[];
  certificates: PremiumSubmissionCertificate[];
  notes: string | null;
};

export type CompanyWithTrade = Company & {
  trades: Pick<Trade, "id" | "name" | "slug"> | null;
  company_trades?: Array<{
    id: string;
    confidence_score: number | null;
    status: string | null;
    visibility_level: string | null;
    trades: Pick<Trade, "id" | "name" | "slug"> | null;
  }> | null;
};

export type CompanyTradeMatch = {
  id: string;
  company_id: string;
  trade_id: string;
  confidence_score: number;
  source: string;
  evidence: string | null;
  created_at: string;
  updated_at: string;
  companies: CompanyWithTrade | null;
  trades: Pick<Trade, "id" | "name" | "slug"> | null;
};

export type CompanyClaim = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "pending" | "approved" | "rejected";
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyClaimWithCompany = CompanyClaim & {
  companies: Pick<Company, "id" | "name" | "slug" | "city" | "postal_code" | "claim_status"> | null;
};

export type SubmissionStatus = "submitted" | "in_review" | "needs_info" | "approved" | "rejected";

export type CompanySubmission = {
  id: string;
  created_at: string;
  updated_at: string;
  status: SubmissionStatus;
  company_name: string;
  legal_form: string | null;
  website: string | null;
  phone: string | null;
  email: string;
  contact_email: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_role: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  logo_url: string | null;
  profile_image_url: string | null;
  profile_image_alt: string | null;
  contact_person_name: string | null;
  contact_person_role: string | null;
  image_consent_given: boolean;
  image_consent_timestamp: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
  primary_trade: string;
  secondary_trades: string[];
  selected_services: string[];
  specializations: string[];
  service_radius_km: number;
  service_regions: string[];
  postal_codes: string[];
  service_countries: string[];
  short_description: string;
  description: string | null;
  references_text: string | null;
  memberships: string[];
  certificates: string[];
  manufacturer_certificates: string[];
  wants_founder_verification: boolean;
  wants_support_contribution: boolean;
  support_contribution_amount: number | null;
  support_invoice_requested: boolean;
  premium_submission_payload: CompanyPremiumSubmissionPayload | null;
  consent_authorized: boolean;
  consent_data_correct: boolean;
  consent_privacy: boolean;
  source: string;
  user_agent: string | null;
  admin_notes?: string | null;
};

export type SubmissionDuplicate = Pick<Company, "id" | "name" | "slug" | "city" | "postal_code" | "email" | "website_url"> & {
  reason: string;
};

export type CompanyFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string | string[] | boolean>;
};

export type BusinessSubmissionState = CompanyFormState & {
  submissionId?: string;
};

export type ImportReport = {
  ok: boolean;
  message: string;
  created: number;
  skipped: number;
  errors: string[];
};

export type ResearchImportBatch = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  source_type: "csv" | "jsonl" | "api" | "manual";
  source_note: string | null;
  status: "draft" | "imported" | "in_review" | "completed" | "rejected";
  total_candidates: number;
  created_by: string | null;
  admin_notes: string | null;
};

export type ResearchCandidateStatus = "found" | "validated" | "duplicate" | "approved" | "rejected";

export type ResearchCompanyCandidate = {
  id: string;
  batch_id: string;
  created_at: string;
  updated_at: string;
  status: ResearchCandidateStatus;
  company_id: string | null;
  duplicate_company_id: string | null;
  company_name: string;
  trade_name: string;
  trade_slug: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  street: string | null;
  postal_code: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  short_description: string | null;
  source_url: string;
  source_label: string;
  source_retrieved_at: string;
  source_excerpt: string | null;
  confidence_score: number;
  public_data_only: boolean;
  privacy_notes: string | null;
  admin_notes: string | null;
  rejected_reason: string | null;
  approved_at: string | null;
  approved_by: string | null;
  research_import_batches?: Pick<ResearchImportBatch, "id" | "name" | "status"> | null;
  companies?: Pick<Company, "id" | "name" | "slug" | "city" | "postal_code"> | null;
};

export type {
  PlannerDashboard,
  PlannerImportState,
  PlannerInvitation,
  PlannerPrivateContact,
  PlannerProfile,
  PlannerSuggestion,
} from "@/lib/types/planner";
