alter table companies
  add column if not exists logo_url text,
  add column if not exists profile_image_url text,
  add column if not exists profile_image_alt text,
  add column if not exists contact_person_name text,
  add column if not exists contact_person_role text,
  add column if not exists banner_image_url text,
  add column if not exists gallery_image_urls text[] not null default '{}',
  add column if not exists is_free_founding_member boolean not null default false,
  add column if not exists trust_badge text,
  add column if not exists voluntary_support_status text,
  add column if not exists profile_status text not null default 'imported',
  add column if not exists verification_date timestamptz,
  add column if not exists image_consent_given boolean not null default false,
  add column if not exists image_consent_timestamp timestamptz;

alter table companies
  drop constraint if exists companies_profile_status_check;

alter table companies
  add constraint companies_profile_status_check
  check (profile_status in ('imported', 'verified', 'claimed', 'needs_review', 'removed'));

alter table company_submissions
  add column if not exists logo_url text,
  add column if not exists profile_image_url text,
  add column if not exists profile_image_alt text,
  add column if not exists contact_person_name text,
  add column if not exists contact_person_role text,
  add column if not exists image_consent_given boolean not null default false,
  add column if not exists image_consent_timestamp timestamptz;

create index if not exists companies_profile_status_idx on companies(profile_status);
create index if not exists companies_free_founding_member_idx on companies(is_free_founding_member);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-media',
  'company-media',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "service role manages company media" on storage.objects;
create policy "service role manages company media"
on storage.objects for all to service_role
using (bucket_id = 'company-media')
with check (bucket_id = 'company-media');
