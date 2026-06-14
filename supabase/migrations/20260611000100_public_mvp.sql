alter table companies
add column if not exists public_visible boolean not null default true;

create index if not exists companies_public_visible_idx on companies(public_visible);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

drop trigger if exists company_claims_updated_at on company_claims;
create trigger company_claims_updated_at
before update on company_claims
for each row execute function set_updated_at();

alter table company_claims enable row level security;

drop policy if exists "service role manages company claims" on company_claims;
create policy "service role manages company claims"
on company_claims for all
to service_role
using (true)
with check (true);
