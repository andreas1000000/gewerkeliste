type PlannerCompanyRef = {
  id: string;
  name: string;
  slug: string;
  city: string;
  postal_code: string;
};

export type PlannerProfile = {
  id: string;
  user_id: string | null;
  company_name: string | null;
  website: string | null;
  public_email: string | null;
  alias_email: string | null;
  profile_status: "draft" | "active" | "hidden";
  contribution_status: "basic" | "contributor" | "partner";
  contribution_score: number;
  contribution_reason: string | null;
  full_access_unlocked: boolean;
  created_at: string;
  updated_at: string;
};

export type PlannerDashboard = {
  planner: PlannerProfile;
  privateContacts: number;
  imports: number;
  duplicates: number;
  matchedExisting: number;
  newSuggestions: number;
  invitations: number;
  suggestions: number;
};

export type PlannerPrivateContact = {
  id: string;
  planner_id: string;
  import_id: string | null;
  raw_company_name: string;
  normalized_company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  trade_text: string | null;
  notes_private: string | null;
  source_label: string | null;
  matched_company_id: string | null;
  match_status: "unmatched" | "possible_duplicate" | "matched_existing" | "new_suggestion";
  visibility_status: "private" | "suggested" | "invited" | "claimed" | "published" | "rejected" | "deleted";
  created_at: string;
  updated_at: string;
  companies?: PlannerCompanyRef | null;
};

export type PlannerSuggestion = {
  id: string;
  planner_id: string;
  private_contact_id: string | null;
  company_id: string | null;
  raw_company_data: Record<string, unknown>;
  suggested_trade_text: string | null;
  status: "private" | "suggested" | "invited" | "claimed" | "published" | "rejected" | "deleted";
  invitation_sent_at: string | null;
  invitation_triggered_by: string | null;
  claim_token: string;
  delete_token: string;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
  planner_private_contacts?: PlannerPrivateContact | null;
  planners?: Pick<PlannerProfile, "id" | "company_name" | "public_email" | "alias_email"> | null;
  companies?: PlannerCompanyRef | null;
};

export type PlannerInvitation = {
  id: string;
  planner_id: string;
  company_suggestion_id: string;
  recipient_email: string | null;
  sender_alias: string | null;
  reply_to: string | null;
  subject: string;
  body: string;
  status: "draft" | "queued" | "sent" | "failed" | "bounced" | "unsubscribed";
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  company_suggestions?: Pick<PlannerSuggestion, "id" | "raw_company_data" | "suggested_trade_text" | "status"> | null;
};

export type PlannerImportState = {
  ok: boolean;
  message: string;
  importId?: string;
  imported?: number;
  duplicates?: number;
  matched?: number;
  suggestions?: number;
};
