alter table companies
  add column if not exists profile_package text not null default 'basis',
  add column if not exists premium_started_at timestamptz,
  add column if not exists premium_expires_at timestamptz;

alter table companies
  drop constraint if exists companies_profile_package_check;

alter table companies
  add constraint companies_profile_package_check
  check (profile_package in ('basis', 'verified_start'));

create table if not exists company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text,
  phone text,
  email text,
  image_url text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_contacts_review_status_check check (review_status in ('pending', 'approved', 'rejected', 'internal'))
);

create table if not exists company_team_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text,
  description text,
  image_url text,
  sort_order integer not null default 0,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_team_members_review_status_check check (review_status in ('pending', 'approved', 'rejected', 'internal'))
);

create table if not exists company_references (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  project_type text,
  location text,
  year integer,
  description text,
  services text[] not null default '{}',
  client_type text,
  sort_order integer not null default 0,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_references_review_status_check check (review_status in ('pending', 'approved', 'rejected', 'internal'))
);

create table if not exists company_reference_media (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  reference_id uuid references company_references(id) on delete set null,
  file_url text not null,
  alt_text text,
  caption text,
  sort_order integer not null default 0,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_reference_media_review_status_check check (review_status in ('pending', 'approved', 'rejected', 'internal'))
);

create table if not exists company_certificates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  issuer text,
  issued_at date,
  valid_until date,
  description text,
  file_url text,
  sort_order integer not null default 0,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_certificates_review_status_check check (review_status in ('pending', 'approved', 'rejected', 'internal'))
);

create index if not exists companies_profile_package_idx on companies(profile_package);
create index if not exists companies_premium_expires_at_idx on companies(premium_expires_at);
create index if not exists company_contacts_company_status_idx on company_contacts(company_id, review_status, sort_order);
create index if not exists company_team_members_company_status_idx on company_team_members(company_id, review_status, sort_order);
create index if not exists company_references_company_status_idx on company_references(company_id, review_status, sort_order);
create index if not exists company_reference_media_company_status_idx on company_reference_media(company_id, review_status, sort_order);
create index if not exists company_certificates_company_status_idx on company_certificates(company_id, review_status, sort_order);

grant select, insert, update, delete on
  company_contacts,
  company_team_members,
  company_references,
  company_reference_media,
  company_certificates
to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-media',
  'company-media',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = greatest(storage.buckets.file_size_limit, excluded.file_size_limit),
  allowed_mime_types = (
    select array(
      select distinct unnest(coalesce(storage.buckets.allowed_mime_types, '{}'::text[]) || excluded.allowed_mime_types)
    )
  );

drop policy if exists "service role manages company contacts" on company_contacts;
create policy "service role manages company contacts"
on company_contacts for all to service_role
using (true)
with check (true);

drop policy if exists "service role manages company team members" on company_team_members;
create policy "service role manages company team members"
on company_team_members for all to service_role
using (true)
with check (true);

drop policy if exists "service role manages company references" on company_references;
create policy "service role manages company references"
on company_references for all to service_role
using (true)
with check (true);

drop policy if exists "service role manages company reference media" on company_reference_media;
create policy "service role manages company reference media"
on company_reference_media for all to service_role
using (true)
with check (true);

drop policy if exists "service role manages company certificates" on company_certificates;
create policy "service role manages company certificates"
on company_certificates for all to service_role
using (true)
with check (true);
