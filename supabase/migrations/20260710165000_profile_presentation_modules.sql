create table if not exists company_social_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  platform text not null,
  url text not null,
  label text,
  review_status text not null default 'pending',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_social_links_review_status_check check (review_status in ('pending', 'approved', 'rejected', 'internal'))
);

create table if not exists company_profile_sections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  body text not null,
  section_type text,
  review_status text not null default 'pending',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_profile_sections_review_status_check check (review_status in ('pending', 'approved', 'rejected', 'internal'))
);

alter table company_contacts
  add column if not exists responsibility_area text,
  add column if not exists primary_contact_method text;

alter table company_team_members
  add column if not exists department text;

alter table company_references
  add column if not exists period text,
  add column if not exists client_name text,
  add column if not exists client_public boolean not null default false,
  add column if not exists challenge text,
  add column if not exists solution text;

alter table company_reference_media
  add column if not exists media_type text not null default 'image',
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists category text;

alter table company_certificates
  add column if not exists proof_type text,
  add column if not exists verification_level text not null default 'self_declared';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_contacts_primary_contact_method_check'
      and conrelid = 'company_contacts'::regclass
  ) then
    alter table company_contacts
      add constraint company_contacts_primary_contact_method_check
      check (
        primary_contact_method is null
        or primary_contact_method in ('phone', 'email', 'website', 'form', 'none')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_reference_media_media_type_check'
      and conrelid = 'company_reference_media'::regclass
  ) then
    alter table company_reference_media
      add constraint company_reference_media_media_type_check
      check (media_type in ('image', 'document', 'video', 'other'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_reference_media_dimensions_check'
      and conrelid = 'company_reference_media'::regclass
  ) then
    alter table company_reference_media
      add constraint company_reference_media_dimensions_check
      check (
        (width is null or width > 0)
        and (height is null or height > 0)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_certificates_verification_level_check'
      and conrelid = 'company_certificates'::regclass
  ) then
    alter table company_certificates
      add constraint company_certificates_verification_level_check
      check (verification_level in ('self_declared', 'document_uploaded', 'gewerkeliste_checked'));
  end if;
end $$;

create index if not exists company_social_links_company_status_idx
on company_social_links(company_id, review_status, sort_order);

create index if not exists company_profile_sections_company_status_idx
on company_profile_sections(company_id, review_status, sort_order);

create index if not exists company_reference_media_type_status_idx
on company_reference_media(company_id, media_type, review_status, sort_order);

drop trigger if exists company_contacts_updated_at on company_contacts;
create trigger company_contacts_updated_at
before update on company_contacts
for each row execute function set_updated_at();

drop trigger if exists company_team_members_updated_at on company_team_members;
create trigger company_team_members_updated_at
before update on company_team_members
for each row execute function set_updated_at();

drop trigger if exists company_references_updated_at on company_references;
create trigger company_references_updated_at
before update on company_references
for each row execute function set_updated_at();

drop trigger if exists company_reference_media_updated_at on company_reference_media;
create trigger company_reference_media_updated_at
before update on company_reference_media
for each row execute function set_updated_at();

drop trigger if exists company_certificates_updated_at on company_certificates;
create trigger company_certificates_updated_at
before update on company_certificates
for each row execute function set_updated_at();

drop trigger if exists company_social_links_updated_at on company_social_links;
create trigger company_social_links_updated_at
before update on company_social_links
for each row execute function set_updated_at();

drop trigger if exists company_profile_sections_updated_at on company_profile_sections;
create trigger company_profile_sections_updated_at
before update on company_profile_sections
for each row execute function set_updated_at();

alter table company_contacts enable row level security;
alter table company_team_members enable row level security;
alter table company_references enable row level security;
alter table company_reference_media enable row level security;
alter table company_certificates enable row level security;
alter table company_social_links enable row level security;
alter table company_profile_sections enable row level security;

grant select, insert, update, delete on
  company_social_links,
  company_profile_sections
to service_role;

drop policy if exists "service role manages company social links" on company_social_links;
create policy "service role manages company social links"
on company_social_links for all to service_role
using (true)
with check (true);

drop policy if exists "service role manages company profile sections" on company_profile_sections;
create policy "service role manages company profile sections"
on company_profile_sections for all to service_role
using (true)
with check (true);
