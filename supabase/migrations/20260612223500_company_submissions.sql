create table if not exists company_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'approved', 'rejected')),
  company_name text not null,
  legal_form text,
  website text,
  phone text,
  email text not null,
  contact_email text,
  contact_first_name text,
  contact_last_name text,
  contact_role text,
  contact_person_email text,
  contact_person_phone text,
  street text,
  house_number text,
  postal_code text not null,
  city text not null,
  region text,
  country text not null default 'Deutschland',
  primary_trade text not null,
  secondary_trades jsonb not null default '[]'::jsonb,
  selected_services jsonb not null default '[]'::jsonb,
  specializations jsonb not null default '[]'::jsonb,
  service_radius_km integer not null,
  service_regions jsonb not null default '[]'::jsonb,
  postal_codes jsonb not null default '[]'::jsonb,
  service_countries jsonb not null default '[]'::jsonb,
  short_description text not null,
  description text,
  references_text text,
  memberships jsonb not null default '[]'::jsonb,
  certificates jsonb not null default '[]'::jsonb,
  manufacturer_certificates jsonb not null default '[]'::jsonb,
  wants_founder_verification boolean not null default false,
  wants_support_contribution boolean not null default false,
  support_contribution_amount numeric,
  support_invoice_requested boolean not null default false,
  consent_authorized boolean not null default false,
  consent_data_correct boolean not null default false,
  consent_privacy boolean not null default false,
  source text not null default 'betrieb-eintragen',
  user_agent text
);

create index if not exists company_submissions_status_idx on company_submissions(status, created_at desc);
create index if not exists company_submissions_company_lookup_idx on company_submissions(company_name, postal_code);
create index if not exists company_submissions_primary_trade_idx on company_submissions(primary_trade);

drop trigger if exists company_submissions_updated_at on company_submissions;
create trigger company_submissions_updated_at
before update on company_submissions
for each row execute function set_updated_at();

alter table company_submissions enable row level security;

drop policy if exists "service role manages company submissions" on company_submissions;
create policy "service role manages company submissions"
on company_submissions for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
