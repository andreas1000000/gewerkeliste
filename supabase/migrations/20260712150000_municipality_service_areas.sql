create table if not exists municipalities (
  ags text primary key check (ags ~ '^[0-9]{8}$'),
  name text not null,
  county_code text not null check (county_code ~ '^[0-9]{5}$'),
  county_name text not null,
  state_code text not null check (state_code ~ '^[0-9]{2}$'),
  state_name text not null,
  slug text not null unique,
  geometry_ref text not null unique,
  selection_enabled boolean not null default false,
  data_source text not null,
  data_as_of date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists municipalities_selection_idx on municipalities(selection_enabled, county_code, name);
create index if not exists municipalities_county_idx on municipalities(county_code, name);

alter table company_submissions
  add column if not exists municipality_codes jsonb not null default '[]'::jsonb;

alter table company_submissions
  drop constraint if exists company_submissions_municipality_codes_array;

alter table company_submissions
  add constraint company_submissions_municipality_codes_array
  check (jsonb_typeof(municipality_codes) = 'array');

create table if not exists company_submission_service_areas (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references company_submissions(id) on delete cascade,
  municipality_ags text not null references municipalities(ags) on delete restrict,
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'approved', 'rejected')),
  source text not null default 'betrieb-eintragen',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, municipality_ags)
);

create index if not exists company_submission_service_areas_lookup_idx
  on company_submission_service_areas(municipality_ags, status);
create index if not exists company_submission_service_areas_submission_idx
  on company_submission_service_areas(submission_id, status);

create table if not exists company_service_areas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  municipality_ags text not null references municipalities(ags) on delete restrict,
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'approved', 'rejected')),
  source text not null default 'company_submission',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, municipality_ags)
);

create index if not exists company_service_areas_public_lookup_idx
  on company_service_areas(municipality_ags, status, company_id);
create index if not exists company_service_areas_company_idx
  on company_service_areas(company_id, status);

create or replace function sync_company_submission_service_areas()
returns trigger
language plpgsql
as $$
begin
  insert into company_submission_service_areas (submission_id, municipality_ags, status, source)
  select new.id, value, 'submitted', new.source
  from jsonb_array_elements_text(new.municipality_codes) as municipality_values(value)
  where value <> ''
  on conflict (submission_id, municipality_ags) do nothing;
  return new;
end;
$$;

drop trigger if exists company_submissions_service_areas on company_submissions;
create trigger company_submissions_service_areas
after insert on company_submissions
for each row execute function sync_company_submission_service_areas();

drop trigger if exists company_submission_service_areas_updated_at on company_submission_service_areas;
create trigger company_submission_service_areas_updated_at
before update on company_submission_service_areas
for each row execute function set_updated_at();

drop trigger if exists company_service_areas_updated_at on company_service_areas;
create trigger company_service_areas_updated_at
before update on company_service_areas
for each row execute function set_updated_at();

drop trigger if exists municipalities_updated_at on municipalities;
create trigger municipalities_updated_at
before update on municipalities
for each row execute function set_updated_at();

alter table municipalities enable row level security;
alter table company_submission_service_areas enable row level security;
alter table company_service_areas enable row level security;

drop policy if exists "service role manages municipalities" on municipalities;
create policy "service role manages municipalities"
on municipalities for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages submission service areas" on company_submission_service_areas;
create policy "service role manages submission service areas"
on company_submission_service_areas for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages company service areas" on company_service_areas;
create policy "service role manages company service areas"
on company_service_areas for all
to service_role
using (true)
with check (true);

revoke all on table
  municipalities,
  company_submission_service_areas,
  company_service_areas
from public, anon, authenticated;

revoke all on function sync_company_submission_service_areas()
from public, anon, authenticated;

grant select, insert, update, delete on
  municipalities,
  company_submission_service_areas,
  company_service_areas
to service_role;
