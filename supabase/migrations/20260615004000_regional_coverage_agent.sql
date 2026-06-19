create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  postal_codes text[] not null default '{}'::text[],
  municipality text,
  county text,
  state text,
  country text not null default 'Deutschland',
  latitude double precision,
  longitude double precision,
  population integer,
  region_type text not null default 'municipality',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists regions_slug_idx on regions(slug);
create index if not exists regions_postal_codes_idx on regions using gin(postal_codes);

create table if not exists company_candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  postal_code text,
  street text,
  possible_trade text,
  possible_website text,
  phone text,
  email text,
  source_type text not null,
  source_url text not null,
  discovery_confidence integer check (discovery_confidence is null or discovery_confidence between 0 and 100),
  identity_confidence integer check (identity_confidence is null or identity_confidence between 0 and 100),
  trade_confidence integer check (trade_confidence is null or trade_confidence between 0 and 100),
  overall_score integer check (overall_score is null or overall_score between 0 and 100),
  status text not null default 'discovered' check (status in ('discovered', 'website_found', 'enriched', 'needs_review', 'rejected', 'promoted', 'ready_for_publish')),
  duplicate_of_company_id uuid references companies(id) on delete set null,
  raw_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_candidates_status_idx on company_candidates(status, overall_score desc, created_at desc);
create index if not exists company_candidates_location_idx on company_candidates(city, postal_code);
create index if not exists company_candidates_trade_idx on company_candidates(possible_trade);
create index if not exists company_candidates_duplicate_idx on company_candidates(duplicate_of_company_id);
create unique index if not exists company_candidates_source_unique_idx on company_candidates(source_url, name);

create table if not exists coverage_snapshots (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references regions(id) on delete cascade,
  trade_id uuid not null references trades(id) on delete cascade,
  found_companies integer not null default 0,
  candidate_companies integer not null default 0,
  estimated_companies integer not null default 0,
  coverage_percent numeric(5,2) not null default 0,
  quality_average numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists coverage_snapshots_region_trade_idx on coverage_snapshots(region_id, trade_id, created_at desc);

drop trigger if exists regions_updated_at on regions;
create trigger regions_updated_at
before update on regions
for each row execute function set_updated_at();

drop trigger if exists company_candidates_updated_at on company_candidates;
create trigger company_candidates_updated_at
before update on company_candidates
for each row execute function set_updated_at();

alter table regions enable row level security;
alter table company_candidates enable row level security;
alter table coverage_snapshots enable row level security;

drop policy if exists "service role manages regions" on regions;
create policy "service role manages regions"
on regions for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages company candidates" on company_candidates;
create policy "service role manages company candidates"
on company_candidates for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages coverage snapshots" on coverage_snapshots;
create policy "service role manages coverage snapshots"
on coverage_snapshots for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete on
  regions,
  company_candidates,
  coverage_snapshots
to service_role;
