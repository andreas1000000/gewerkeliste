create table if not exists research_import_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  source_type text not null check (source_type in ('csv', 'jsonl', 'api', 'manual')),
  source_note text,
  status text not null default 'draft' check (status in ('draft', 'imported', 'in_review', 'completed', 'rejected')),
  total_candidates integer not null default 0,
  created_by text,
  admin_notes text
);

create table if not exists research_company_candidates (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references research_import_batches(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'found' check (status in ('found', 'validated', 'duplicate', 'approved', 'rejected')),
  company_id uuid references companies(id) on delete set null,
  duplicate_company_id uuid references companies(id) on delete set null,
  company_name text not null,
  trade_name text not null,
  trade_slug text not null,
  website text,
  phone text,
  email text,
  street text,
  postal_code text not null,
  city text not null,
  country text not null default 'Deutschland',
  latitude double precision,
  longitude double precision,
  short_description text,
  source_url text not null,
  source_label text not null,
  source_retrieved_at timestamptz not null,
  source_excerpt text,
  confidence_score integer not null default 60 check (confidence_score between 0 and 100),
  public_data_only boolean not null default true,
  privacy_notes text,
  admin_notes text,
  rejected_reason text,
  approved_at timestamptz,
  approved_by text,
  constraint research_company_candidates_postal_code_format check (postal_code ~ '^[0-9]{5}$'),
  constraint research_company_candidates_email_format check (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  constraint research_company_candidates_website_format check (website is null or website ~* '^https?://.+\..+'),
  constraint research_company_candidates_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint research_company_candidates_longitude_range check (longitude is null or longitude between -180 and 180)
);

create index if not exists research_import_batches_status_idx on research_import_batches(status, created_at desc);
create index if not exists research_company_candidates_batch_idx on research_company_candidates(batch_id, status);
create index if not exists research_company_candidates_status_idx on research_company_candidates(status, created_at desc);
create index if not exists research_company_candidates_lookup_idx on research_company_candidates(company_name, postal_code, website);
create index if not exists research_company_candidates_trade_idx on research_company_candidates(trade_slug);
create index if not exists research_company_candidates_location_idx on research_company_candidates(postal_code, city);

drop trigger if exists research_import_batches_updated_at on research_import_batches;
create trigger research_import_batches_updated_at
before update on research_import_batches
for each row execute function set_updated_at();

drop trigger if exists research_company_candidates_updated_at on research_company_candidates;
create trigger research_company_candidates_updated_at
before update on research_company_candidates
for each row execute function set_updated_at();

alter table research_import_batches enable row level security;
alter table research_company_candidates enable row level security;

drop policy if exists "service role manages research import batches" on research_import_batches;
create policy "service role manages research import batches"
on research_import_batches for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages research company candidates" on research_company_candidates;
create policy "service role manages research company candidates"
on research_company_candidates for all
to service_role
using (true)
with check (true);
