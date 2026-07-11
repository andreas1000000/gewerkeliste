alter table public.company_submissions
  add column if not exists premium_submission_payload jsonb not null default '{}'::jsonb;

create index if not exists company_submissions_premium_payload_idx
  on public.company_submissions using gin (premium_submission_payload);
