alter table companies
  add column if not exists enrichment_status text not null default 'pending',
  add column if not exists enrichment_score integer check (enrichment_score is null or enrichment_score between 0 and 100),
  add column if not exists last_enriched_at timestamptz,
  add column if not exists needs_review boolean not null default false,
  add column if not exists review_status text;

create index if not exists companies_enrichment_status_idx on companies(enrichment_status, needs_review, last_enriched_at);

create table if not exists company_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed', 'review')),
  priority integer not null default 50,
  source text not null default 'manual',
  attempts integer not null default 0,
  last_error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, source)
);

create index if not exists company_enrichment_jobs_queue_idx
on company_enrichment_jobs(status, priority desc, created_at asc);

create index if not exists company_enrichment_jobs_company_idx
on company_enrichment_jobs(company_id);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  item_type text not null,
  reason text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_queue_status_idx on review_queue(status, created_at desc);
create index if not exists review_queue_company_idx on review_queue(company_id);

alter table company_sources
  add column if not exists source_name text,
  add column if not exists confidence_score integer check (confidence_score is null or confidence_score between 0 and 100),
  add column if not exists extracted_at timestamptz,
  add column if not exists raw_snippet text;

alter table company_change_log
  add column if not exists changed_at timestamptz not null default now();

drop trigger if exists company_enrichment_jobs_updated_at on company_enrichment_jobs;
create trigger company_enrichment_jobs_updated_at
before update on company_enrichment_jobs
for each row execute function set_updated_at();

drop trigger if exists review_queue_updated_at on review_queue;
create trigger review_queue_updated_at
before update on review_queue
for each row execute function set_updated_at();

alter table company_enrichment_jobs enable row level security;
alter table review_queue enable row level security;

drop policy if exists "service role manages company enrichment jobs" on company_enrichment_jobs;
create policy "service role manages company enrichment jobs"
on company_enrichment_jobs for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages review queue" on review_queue;
create policy "service role manages review queue"
on review_queue for all
to service_role
using (true)
with check (true);
