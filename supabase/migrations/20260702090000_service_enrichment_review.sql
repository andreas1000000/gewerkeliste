-- Prepared only. Do not apply to production without explicit approval.
-- Purpose: keep human review decisions for service enrichment candidates separate
-- from public company_services records until an admin explicitly approves one item.

create table if not exists service_enrichment_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  service_slug text not null,
  service_name text not null,
  trade_slug text,
  trade_name text,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  review_category text not null check (
    review_category in (
      'AUTO_CANDIDATE_HIGH',
      'REVIEW_REQUIRED_MEDIUM',
      'DO_NOT_AUTO_APPLY_LOW',
      'AMBIGUOUS',
      'INSUFFICIENT_EVIDENCE',
      'APPROVED',
      'REJECTED'
    )
  ),
  source_field text not null,
  evidence_text text,
  reason text,
  suggested_action text,
  reviewer_decision text check (reviewer_decision in ('approved', 'rejected') or reviewer_decision is null),
  reviewer_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  applied_to_company_services_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, service_slug, source_field)
);

alter table service_enrichment_reviews enable row level security;

drop policy if exists "service role manages service enrichment reviews" on service_enrichment_reviews;
create policy "service role manages service enrichment reviews"
on service_enrichment_reviews for all to service_role using (true) with check (true);

create index if not exists service_enrichment_reviews_decision_idx
on service_enrichment_reviews(review_category, reviewer_decision, confidence);

create index if not exists service_enrichment_reviews_company_idx
on service_enrichment_reviews(company_id);

create index if not exists service_enrichment_reviews_service_idx
on service_enrichment_reviews(service_slug);

alter table company_services
  add column if not exists evidence text,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists service_enrichment_review_id uuid references service_enrichment_reviews(id) on delete set null;
