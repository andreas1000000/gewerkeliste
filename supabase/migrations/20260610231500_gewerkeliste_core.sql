create extension if not exists pgcrypto;

do $$ begin
  create type claim_status as enum ('unclaimed', 'pending', 'claimed', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null,
  contact_name text,
  email text,
  phone text,
  website_url text,
  street text,
  city text not null,
  postal_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  public_visible boolean not null default true,
  claim_status claim_status not null default 'unclaimed',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_postal_code_format check (postal_code ~ '^[0-9]{5}$'),
  constraint companies_latitude_range check (latitude between -90 and 90),
  constraint companies_longitude_range check (longitude between -180 and 180),
  constraint companies_email_format check (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  constraint companies_website_format check (website_url is null or website_url ~* '^https?://.+\..+')
);

create index if not exists companies_trade_idx on companies(trade_id);
create index if not exists companies_city_idx on companies(city);
create index if not exists companies_postal_code_idx on companies(postal_code);
create index if not exists companies_claim_status_idx on companies(claim_status);
create index if not exists companies_verified_idx on companies(verified);
create index if not exists companies_location_idx on companies(latitude, longitude);
create index if not exists companies_public_visible_idx on companies(public_visible);

create table if not exists company_claims (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_claims_email_format check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create index if not exists company_claims_company_idx on company_claims(company_id);
create index if not exists company_claims_status_idx on company_claims(status, created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trades_updated_at on trades;
create trigger trades_updated_at
before update on trades
for each row execute function set_updated_at();

drop trigger if exists companies_updated_at on companies;
create trigger companies_updated_at
before update on companies
for each row execute function set_updated_at();

drop trigger if exists company_claims_updated_at on company_claims;
create trigger company_claims_updated_at
before update on company_claims
for each row execute function set_updated_at();

alter table trades enable row level security;
alter table companies enable row level security;
alter table company_claims enable row level security;

drop policy if exists "service role manages trades" on trades;
create policy "service role manages trades"
on trades for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages companies" on companies;
create policy "service role manages companies"
on companies for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages company claims" on company_claims;
create policy "service role manages company claims"
on company_claims for all
to service_role
using (true)
with check (true);

insert into trades (name, slug)
values
  ('Elektriker', 'elektriker'),
  ('Sanitaer', 'sanitaer'),
  ('Heizung', 'heizung'),
  ('Maler', 'maler'),
  ('Dachdecker', 'dachdecker'),
  ('Tischler', 'tischler'),
  ('Fliesenleger', 'fliesenleger'),
  ('Gaertner', 'gaertner')
on conflict (slug) do update
set name = excluded.name;
