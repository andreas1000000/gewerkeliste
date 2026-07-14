begin;

alter table public.company_claims
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists email_verified_at timestamptz,
  add column if not exists verification_method text,
  add column if not exists verification_notes text,
  add column if not exists submission_id uuid references public.company_submissions(id) on delete set null,
  add column if not exists decided_by text,
  add column if not exists rejection_reason text;

alter table public.company_claims
  drop constraint if exists company_claims_status_check;

alter table public.company_claims
  add constraint company_claims_status_check
  check (status in ('pending', 'needs_info', 'approved', 'rejected'));

alter table public.company_submissions
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists decided_at timestamptz,
  add column if not exists decided_by text,
  add column if not exists rejection_reason text;

create index if not exists company_claims_auth_user_idx
  on public.company_claims(auth_user_id, created_at desc);

create index if not exists company_claims_submission_idx
  on public.company_claims(submission_id);

create index if not exists company_submissions_auth_user_idx
  on public.company_submissions(auth_user_id, created_at desc);

create index if not exists company_submissions_company_id_idx
  on public.company_submissions(company_id, created_at desc);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  status text not null default 'active' check (status in ('active', 'revoked')),
  approved_claim_id uuid not null references public.company_claims(id) on delete restrict,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists company_memberships_one_active_owner_idx
  on public.company_memberships(company_id)
  where status = 'active' and role = 'owner';

create unique index if not exists company_memberships_one_active_user_company_idx
  on public.company_memberships(user_id, company_id)
  where status = 'active';

create index if not exists company_memberships_user_idx
  on public.company_memberships(user_id, status);

create index if not exists company_memberships_company_idx
  on public.company_memberships(company_id, status);

create unique index if not exists company_submissions_one_pending_owner_update_idx
  on public.company_submissions(company_id, auth_user_id)
  where source like 'owner-profile-update:%'
    and status in ('submitted', 'in_review', 'needs_info');

drop trigger if exists company_memberships_updated_at on public.company_memberships;
create trigger company_memberships_updated_at
before update on public.company_memberships
for each row execute function public.set_updated_at();

alter table public.company_memberships enable row level security;

drop policy if exists "service role manages company memberships" on public.company_memberships;
create policy "service role manages company memberships"
on public.company_memberships for all
to service_role
using (true)
with check (true);

drop policy if exists "users read own company memberships" on public.company_memberships;
create policy "users read own company memberships"
on public.company_memberships for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "service role manages authenticated claims" on public.company_claims;
create policy "service role manages authenticated claims"
on public.company_claims for all
to service_role
using (true)
with check (true);

drop policy if exists "users read own claims" on public.company_claims;
create policy "users read own claims"
on public.company_claims for select
to authenticated
using (auth_user_id = (select auth.uid()));

drop policy if exists "service role manages authenticated submissions" on public.company_submissions;
create policy "service role manages authenticated submissions"
on public.company_submissions for all
to service_role
using (true)
with check (true);

drop policy if exists "users read own submissions" on public.company_submissions;
create policy "users read own submissions"
on public.company_submissions for select
to authenticated
using (auth_user_id = (select auth.uid()));

revoke all on table public.company_memberships, public.company_claims, public.company_submissions
from public, anon, authenticated, service_role;

grant select on table public.company_memberships, public.company_claims, public.company_submissions
to authenticated;

grant select, insert, update, delete on table public.company_memberships, public.company_claims, public.company_submissions
to service_role;

drop function if exists public.submit_company_claim(uuid, text, text, text, text);

create or replace function public.submit_company_claim(
  p_company_id uuid,
  p_name text,
  p_phone text default null,
  p_role text default null,
  p_authorization_notes text default null,
  p_consent_authorized boolean default false,
  p_consent_privacy boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_auth_email text;
  v_email_confirmed_at timestamptz;
  v_email text;
  v_existing_claim_id uuid;
  v_claim_id uuid;
  v_submission_id uuid;
  v_company public.companies%rowtype;
  v_primary_trade text;
  v_message text := nullif(trim(coalesce(p_authorization_notes, '')), '');
  v_verification_notes text := nullif(
    trim(concat_ws(E'\n', nullif(trim(coalesce(p_role, '')), ''), v_message)),
    ''
  );
begin
  select email, email_confirmed_at
    into v_auth_email, v_email_confirmed_at
    from auth.users
   where id = v_user_id;
  v_email := nullif(trim(coalesce(v_auth_email, auth.jwt() ->> 'email', '')), '');

  if v_user_id is null or v_email is null or v_email_confirmed_at is null then
    raise exception 'authenticated_email_required';
  end if;
  if not p_consent_authorized or not p_consent_privacy then
    raise exception 'consent_required';
  end if;

  select *
    into v_company
    from public.companies
   where id = p_company_id
     and public_visible = true
   for update;

  if not found then
    raise exception 'company_not_found';
  end if;

  if v_company.claim_status = 'claimed' then
    raise exception 'company_already_claimed';
  end if;

  select id
    into v_existing_claim_id
    from public.company_claims
   where company_id = p_company_id
     and auth_user_id = v_user_id
     and status in ('pending', 'needs_info', 'approved')
   order by created_at desc
   limit 1;

  if v_existing_claim_id is not null then
    return v_existing_claim_id;
  end if;

  select slug
    into v_primary_trade
    from public.trades
   where id = v_company.trade_id;

  if v_primary_trade is null then
    raise exception 'company_trade_not_found';
  end if;

  insert into public.company_claims (
    company_id,
    name,
    email,
    phone,
    message,
    status,
    auth_user_id,
    email_verified_at,
    verification_method,
    verification_notes
  )
  values (
    p_company_id,
    nullif(trim(coalesce(p_name, '')), ''),
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    coalesce(v_message, 'Keine weiteren Angaben.'),
    'pending',
    v_user_id,
    v_email_confirmed_at,
    'supabase_magic_link',
    v_verification_notes
  )
  returning id into v_claim_id;

  insert into public.company_submissions (
    status,
    company_name,
    legal_form,
    website,
    phone,
    email,
    contact_email,
    contact_first_name,
    contact_role,
    contact_person_email,
    contact_person_phone,
    street,
    postal_code,
    city,
    country,
    primary_trade,
    secondary_trades,
    selected_services,
    specializations,
    service_radius_km,
    service_regions,
    postal_codes,
    service_countries,
    short_description,
    description,
    references_text,
    memberships,
    certificates,
    manufacturer_certificates,
    wants_founder_verification,
    wants_support_contribution,
    support_invoice_requested,
    consent_authorized,
    consent_data_correct,
    consent_privacy,
    source,
    auth_user_id,
    company_id
  )
  values (
    'submitted',
    v_company.name,
    null,
    v_company.website_url,
    v_company.phone,
    v_email,
    v_email,
    nullif(trim(coalesce(p_name, '')), ''),
    nullif(trim(coalesce(p_role, '')), ''),
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    v_company.street,
    v_company.postal_code,
    v_company.city,
    'Deutschland',
    v_primary_trade,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    coalesce(v_company.service_radius_km, 50),
    coalesce(to_jsonb(v_company.service_regions), '[]'::jsonb),
    coalesce(to_jsonb(v_company.service_postal_codes), '[]'::jsonb),
    coalesce(to_jsonb(v_company.service_countries), '["Deutschland"]'::jsonb),
    left(coalesce(v_company.description, 'Profilübernahme zur Prüfung.'), 240),
    concat('Übernahmeantrag für den bestehenden Betriebseintrag.', E'\n\n', coalesce(v_message, 'Keine weiteren Angaben.')),
    concat('Bestehende Firmen-ID: ', v_company.id::text),
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    false,
    false,
    false,
    p_consent_authorized,
    false,
    p_consent_privacy,
    concat('claim:', p_company_id::text),
    v_user_id,
    p_company_id
  )
  returning id into v_submission_id;

  update public.company_claims
     set submission_id = v_submission_id
   where id = v_claim_id;

  if v_company.claim_status <> 'claimed' then
    update public.companies
       set claim_status = 'pending'::claim_status
     where id = p_company_id;
  end if;

  return v_claim_id;
end;
$$;

create or replace function public.approve_company_claim(
  p_claim_id uuid,
  p_admin_actor text default 'basic-auth-admin'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_claim public.company_claims%rowtype;
  v_company public.companies%rowtype;
  v_membership_id uuid;
  v_existing_membership public.company_memberships%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  select * into v_claim from public.company_claims where id = p_claim_id for update;
  if not found then raise exception 'claim_not_found'; end if;
  if v_claim.auth_user_id is null then raise exception 'claim_user_missing'; end if;

  select * into v_company
    from public.companies
   where id = v_claim.company_id
   for update;
  if not found then raise exception 'company_not_found'; end if;

  select * into v_existing_membership
    from public.company_memberships
   where company_id = v_claim.company_id
     and role = 'owner'
     and status = 'active'
   for update;

  if found and v_existing_membership.user_id <> v_claim.auth_user_id then
    raise exception 'company_already_claimed';
  end if;

  if v_claim.status = 'approved' and found then
    return v_existing_membership.id;
  end if;

  if v_claim.status not in ('pending', 'needs_info') then
    raise exception 'claim_not_approvable';
  end if;

  if found then
    v_membership_id := v_existing_membership.id;
  else
    insert into public.company_memberships (
      company_id,
      user_id,
      role,
      status,
      approved_claim_id,
      approved_at
    )
    values (v_claim.company_id, v_claim.auth_user_id, 'owner', 'active', v_claim.id, now())
    returning id into v_membership_id;
  end if;

  update public.company_claims
     set status = 'approved',
         decided_at = now(),
         decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
         rejection_reason = null
   where id = v_claim.id;

  if v_claim.submission_id is not null then
    update public.company_submissions
       set status = 'approved',
           decided_at = now(),
           decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
           rejection_reason = null
     where id = v_claim.submission_id;
  end if;

  update public.companies
     set claim_status = 'claimed'::claim_status,
         profile_status = case when verified then profile_status else 'claimed' end
   where id = v_claim.company_id;

  return v_membership_id;
end;
$$;

create or replace function public.decide_company_claim(
  p_claim_id uuid,
  p_status text,
  p_reason text default null,
  p_admin_actor text default 'basic-auth-admin'
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required';
  end if;
  if p_status not in ('needs_info', 'rejected') then
    raise exception 'unsupported_claim_decision';
  end if;

  update public.company_claims
     set status = p_status,
         decided_at = now(),
         decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
         rejection_reason = nullif(trim(coalesce(p_reason, '')), '')
   where id = p_claim_id
     and status in ('pending', 'needs_info');

  if not found then raise exception 'claim_not_decidable'; end if;

  update public.company_submissions
     set status = p_status,
         decided_at = now(),
         decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
         rejection_reason = nullif(trim(coalesce(p_reason, '')), '')
   where id = (select submission_id from public.company_claims where id = p_claim_id)
     and status in ('submitted', 'in_review', 'needs_info');

end;
$$;

create or replace function public.revoke_company_membership(
  p_membership_id uuid,
  p_reason text default null,
  p_admin_actor text default 'basic-auth-admin'
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_company_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  select company_id into v_company_id
    from public.company_memberships
   where id = p_membership_id
     and status = 'active'
   for update;
  if not found then raise exception 'membership_not_active'; end if;

  perform 1 from public.companies where id = v_company_id for update;
  if not found then raise exception 'company_not_found'; end if;

  update public.company_memberships
     set status = 'revoked', updated_at = now()
   where id = p_membership_id;

  if not exists (
    select 1 from public.company_memberships
     where company_id = v_company_id and role = 'owner' and status = 'active'
  ) then
    update public.companies
       set claim_status = 'unclaimed'::claim_status
     where id = v_company_id;
  end if;
end;
$$;

create or replace function public.submit_company_profile_change(
  p_company_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_company public.companies%rowtype;
  v_primary_trade text;
  v_submission_id uuid;
  v_auth_email text;
  v_email_confirmed_at timestamptz;
  v_email text;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
begin
  select email, email_confirmed_at
    into v_auth_email, v_email_confirmed_at
    from auth.users
   where id = v_user_id;
  v_email := nullif(trim(coalesce(v_auth_email, auth.jwt() ->> 'email', '')), '');

  if v_user_id is null or v_email is null or v_email_confirmed_at is null then raise exception 'authenticated_email_required'; end if;
  if coalesce(v_payload ->> 'consent_authorized', 'false') <> 'true'
     or coalesce(v_payload ->> 'consent_privacy', 'false') <> 'true' then
    raise exception 'consent_required';
  end if;

  select * into v_company from public.companies where id = p_company_id for update;
  if not found then raise exception 'company_not_found'; end if;

  if not exists (
    select 1 from public.company_memberships
     where company_id = p_company_id
       and user_id = v_user_id
       and role = 'owner'
       and status = 'active'
  ) then
    raise exception 'active_membership_required';
  end if;

  if exists (
    select 1 from public.company_submissions
     where company_id = p_company_id
       and auth_user_id = v_user_id
       and status in ('submitted', 'in_review', 'needs_info')
       and source = concat('owner-profile-update:', p_company_id::text)
  ) then
    raise exception 'profile_change_already_pending';
  end if;

  select slug into v_primary_trade from public.trades where id = v_company.trade_id;
  if v_primary_trade is null then raise exception 'company_trade_not_found'; end if;

  insert into public.company_submissions (
    status, company_name, legal_form, website, phone, email, contact_email,
    contact_first_name, contact_role, contact_person_email, contact_person_phone,
    street, postal_code, city, country, primary_trade, secondary_trades,
    selected_services, specializations, service_radius_km, service_regions,
    postal_codes, service_countries, short_description, description, references_text,
    memberships, certificates, manufacturer_certificates, wants_founder_verification,
    wants_support_contribution, support_invoice_requested, consent_authorized,
    consent_data_correct, consent_privacy, source, premium_submission_payload,
    auth_user_id, company_id, logo_url, profile_image_url, profile_image_alt,
    contact_person_name, contact_person_role
  )
  values (
    'submitted',
    coalesce(nullif(trim(v_payload ->> 'company_name'), ''), v_company.name),
    nullif(trim(v_payload ->> 'legal_form'), ''),
    nullif(trim(v_payload ->> 'website'), ''),
    nullif(trim(v_payload ->> 'phone'), ''),
    coalesce(nullif(trim(v_payload ->> 'public_email'), ''), v_company.email, v_email),
    nullif(trim(v_payload ->> 'public_email'), ''),
    nullif(trim(v_payload ->> 'contact_name'), ''),
    nullif(trim(v_payload ->> 'contact_role'), ''),
    v_email,
    nullif(trim(v_payload ->> 'contact_phone'), ''),
    nullif(trim(v_payload ->> 'street'), ''),
    coalesce(nullif(trim(v_payload ->> 'postal_code'), ''), v_company.postal_code),
    coalesce(nullif(trim(v_payload ->> 'city'), ''), v_company.city),
    'Deutschland',
    v_primary_trade,
    case when jsonb_typeof(v_payload -> 'secondary_trades') = 'array' and jsonb_array_length(v_payload -> 'secondary_trades') > 0 then v_payload -> 'secondary_trades' else '[]'::jsonb end,
    case when jsonb_typeof(v_payload -> 'selected_services') = 'array' and jsonb_array_length(v_payload -> 'selected_services') > 0 then v_payload -> 'selected_services' else '[]'::jsonb end,
    case when jsonb_typeof(v_payload -> 'specializations') = 'array' and jsonb_array_length(v_payload -> 'specializations') > 0 then v_payload -> 'specializations' else '[]'::jsonb end,
    greatest(0, coalesce((v_payload ->> 'service_radius_km')::integer, v_company.service_radius_km, 50)),
    case when jsonb_typeof(v_payload -> 'service_regions') = 'array' and jsonb_array_length(v_payload -> 'service_regions') > 0 then v_payload -> 'service_regions' else coalesce(to_jsonb(v_company.service_regions), '[]'::jsonb) end,
    case when jsonb_typeof(v_payload -> 'postal_codes') = 'array' and jsonb_array_length(v_payload -> 'postal_codes') > 0 then v_payload -> 'postal_codes' else coalesce(to_jsonb(v_company.service_postal_codes), '[]'::jsonb) end,
    case when jsonb_typeof(v_payload -> 'service_countries') = 'array' and jsonb_array_length(v_payload -> 'service_countries') > 0 then v_payload -> 'service_countries' else coalesce(to_jsonb(v_company.service_countries), '["Deutschland"]'::jsonb) end,
    left(coalesce(nullif(trim(v_payload ->> 'short_description'), ''), v_company.description), 240),
    nullif(trim(v_payload ->> 'description'), ''),
    nullif(trim(v_payload ->> 'references_text'), ''),
    case when jsonb_typeof(v_payload -> 'memberships') = 'array' and jsonb_array_length(v_payload -> 'memberships') > 0 then v_payload -> 'memberships' else coalesce(to_jsonb(v_company.memberships), '[]'::jsonb) end,
    case when jsonb_typeof(v_payload -> 'certificates') = 'array' and jsonb_array_length(v_payload -> 'certificates') > 0 then v_payload -> 'certificates' else coalesce(to_jsonb(v_company.certificates), '[]'::jsonb) end,
    case when jsonb_typeof(v_payload -> 'manufacturer_certificates') = 'array' and jsonb_array_length(v_payload -> 'manufacturer_certificates') > 0 then v_payload -> 'manufacturer_certificates' else coalesce(to_jsonb(v_company.manufacturer_certificates), '[]'::jsonb) end,
    false, false, false,
    coalesce((v_payload ->> 'consent_authorized')::boolean, false), false,
    coalesce((v_payload ->> 'consent_privacy')::boolean, false),
    concat('owner-profile-update:', p_company_id::text),
    jsonb_build_object(
      'social_links', case when jsonb_typeof(v_payload -> 'social_links') = 'array' and jsonb_array_length(v_payload -> 'social_links') > 0 then v_payload -> 'social_links' else null end,
      'notes', nullif(trim(v_payload ->> 'notes'), '')
    ),
    v_user_id,
    p_company_id,
    nullif(trim(v_payload ->> 'logo_url'), ''),
    nullif(trim(v_payload ->> 'profile_image_url'), ''),
    nullif(trim(v_payload ->> 'profile_image_alt'), ''),
    nullif(trim(v_payload ->> 'contact_name'), ''),
    nullif(trim(v_payload ->> 'contact_role'), '')
  )
  returning id into v_submission_id;

  return v_submission_id;
end;
$$;

create or replace function public.approve_company_profile_submission(
  p_submission_id uuid,
  p_admin_actor text default 'basic-auth-admin'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_submission public.company_submissions%rowtype;
  v_company public.companies%rowtype;
  v_primary_trade_id uuid;
  v_secondary_slug text;
  v_secondary_trade_id uuid;
  v_social jsonb;
  v_platform text;
  v_url text;
  v_label text;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  select * into v_submission
    from public.company_submissions
   where id = p_submission_id
     and source like 'owner-profile-update:%'
   for update;
  if not found then raise exception 'owner_submission_not_found'; end if;
  if v_submission.status = 'approved' then
    return v_submission.company_id;
  end if;
  if v_submission.status not in ('submitted', 'in_review', 'needs_info') then
    raise exception 'owner_submission_not_approvable';
  end if;
  if v_submission.company_id is null or v_submission.auth_user_id is null then
    raise exception 'owner_submission_identity_missing';
  end if;

  select * into v_company from public.companies where id = v_submission.company_id for update;
  if not found then raise exception 'company_not_found'; end if;

  if not exists (
    select 1 from public.company_memberships
     where company_id = v_submission.company_id
       and user_id = v_submission.auth_user_id
       and role = 'owner'
       and status = 'active'
  ) then
    raise exception 'active_membership_required';
  end if;

  select id into v_primary_trade_id from public.trades where slug = v_submission.primary_trade;
  if v_primary_trade_id is null then raise exception 'company_trade_not_found'; end if;

  update public.companies
     set name = coalesce(nullif(trim(v_submission.company_name), ''), v_company.name),
         trade_id = v_primary_trade_id,
         description = coalesce(nullif(trim(v_submission.description), ''), v_submission.short_description, v_company.description),
         contact_name = coalesce(nullif(trim(concat_ws(' ', v_submission.contact_first_name, v_submission.contact_last_name)), ''), v_company.contact_name),
         email = coalesce(v_submission.email, v_company.email),
         phone = coalesce(v_submission.phone, v_company.phone),
         website_url = coalesce(v_submission.website, v_company.website_url),
         street = coalesce(nullif(trim(concat_ws(' ', v_submission.street, v_submission.house_number)), ''), v_company.street),
         city = coalesce(nullif(trim(v_submission.city), ''), v_company.city),
         postal_code = coalesce(nullif(trim(v_submission.postal_code), ''), v_company.postal_code),
         logo_url = coalesce(v_submission.logo_url, v_company.logo_url),
         profile_image_url = case when v_submission.image_consent_given then coalesce(v_submission.profile_image_url, v_company.profile_image_url) else v_company.profile_image_url end,
         profile_image_alt = case when v_submission.image_consent_given then coalesce(v_submission.profile_image_alt, v_company.profile_image_alt) else v_company.profile_image_alt end,
         contact_person_name = coalesce(v_submission.contact_person_name, v_company.contact_person_name),
         contact_person_role = coalesce(v_submission.contact_person_role, v_company.contact_person_role),
         service_radius_km = coalesce(v_submission.service_radius_km, v_company.service_radius_km),
         service_regions = case when jsonb_typeof(to_jsonb(v_submission.service_regions)) = 'array' then array(select jsonb_array_elements_text(to_jsonb(v_submission.service_regions))) else v_company.service_regions end,
         service_postal_codes = case when jsonb_typeof(to_jsonb(v_submission.postal_codes)) = 'array' then array(select jsonb_array_elements_text(to_jsonb(v_submission.postal_codes))) else v_company.service_postal_codes end,
         memberships = case when jsonb_typeof(v_submission.memberships) = 'array' then array(select jsonb_array_elements_text(v_submission.memberships)) else v_company.memberships end,
         certificates = case when jsonb_typeof(v_submission.certificates) = 'array' then array(select jsonb_array_elements_text(v_submission.certificates)) else v_company.certificates end,
         manufacturer_certificates = case when jsonb_typeof(v_submission.manufacturer_certificates) = 'array' then array(select jsonb_array_elements_text(v_submission.manufacturer_certificates)) else v_company.manufacturer_certificates end
   where id = v_company.id;

  insert into public.company_trades (
    company_id, trade_id, confidence_score, source, evidence, status, visibility_level
  ) values (
    v_company.id, v_primary_trade_id, 100, 'owner-submission', v_submission.selected_services::text, 'admin_confirmed', 'basis_public'
  )
  on conflict (company_id, trade_id) do update set
    confidence_score = excluded.confidence_score,
    source = excluded.source,
    evidence = excluded.evidence,
    status = excluded.status,
    visibility_level = excluded.visibility_level;

  if jsonb_typeof(to_jsonb(v_submission.secondary_trades)) = 'array' then
    for v_secondary_slug in select jsonb_array_elements_text(to_jsonb(v_submission.secondary_trades)) loop
      select id into v_secondary_trade_id from public.trades where slug = v_secondary_slug;
      if v_secondary_trade_id is not null and v_secondary_trade_id <> v_primary_trade_id then
        insert into public.company_trades (
          company_id, trade_id, confidence_score, source, evidence, status, visibility_level
        ) values (
          v_company.id, v_secondary_trade_id, 100, 'owner-submission', v_submission.selected_services::text, 'admin_confirmed', 'basis_public'
        )
        on conflict (company_id, trade_id) do update set
          confidence_score = excluded.confidence_score,
          source = excluded.source,
          evidence = excluded.evidence,
          status = excluded.status,
          visibility_level = excluded.visibility_level;
      end if;
    end loop;
  end if;

  v_social := v_submission.premium_submission_payload -> 'social_links';
  if jsonb_typeof(v_social) = 'array' then
    delete from public.company_social_links where company_id = v_company.id;
    for v_social in select value from jsonb_array_elements(v_social) loop
      v_platform := lower(trim(coalesce(v_social ->> 'platform', '')));
      v_url := trim(coalesce(v_social ->> 'url', ''));
      v_label := nullif(trim(coalesce(v_social ->> 'label', '')), '');
      if v_platform in ('instagram', 'whatsapp', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x', 'pinterest', 'xing')
         and v_url ~* '^https?://.+' then
        insert into public.company_social_links (company_id, platform, url, label, review_status, sort_order)
        values (v_company.id, v_platform, v_url, v_label, 'approved', 0);
      end if;
    end loop;
  end if;

  insert into public.company_sources (company_id, source_type, source_url, title, snippet, content)
  values (
    v_company.id,
    'owner_submission',
    null,
    'Betriebsinhaber-Einreichung',
    concat(v_submission.company_name, ' wurde nach menschlicher Prüfung aktualisiert.'),
    jsonb_build_object('submission_id', v_submission.id, 'approved_by', p_admin_actor)::text
  );

  insert into public.company_change_log (company_id, action, field_name, new_value, created_by)
  values (v_company.id, 'owner_submission_approved', null, v_submission.id::text, coalesce(nullif(trim(p_admin_actor), ''), 'basic-auth-admin'));

  update public.company_submissions
     set status = 'approved',
         decided_at = now(),
         decided_by = coalesce(nullif(trim(p_admin_actor), ''), 'basic-auth-admin'),
         rejection_reason = null
   where id = v_submission.id;

  return v_company.id;
end;
$$;

create or replace function public.decide_company_profile_submission(
  p_submission_id uuid,
  p_status text,
  p_reason text default null,
  p_admin_actor text default 'basic-auth-admin'
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_status not in ('needs_info', 'rejected') then raise exception 'unsupported_submission_decision'; end if;

  update public.company_submissions
     set status = p_status,
         decided_at = now(),
         decided_by = coalesce(nullif(trim(p_admin_actor), ''), 'basic-auth-admin'),
         rejection_reason = nullif(trim(coalesce(p_reason, '')), '')
   where id = p_submission_id
     and source like 'owner-profile-update:%'
     and status in ('submitted', 'in_review', 'needs_info');

  if not found then raise exception 'owner_submission_not_decidable'; end if;
end;
$$;

revoke all on function public.submit_company_claim(uuid, text, text, text, text, boolean, boolean) from public, anon;
grant execute on function public.submit_company_claim(uuid, text, text, text, text, boolean, boolean) to authenticated;

revoke all on function public.submit_company_profile_change(uuid, jsonb) from public, anon;
grant execute on function public.submit_company_profile_change(uuid, jsonb) to authenticated;

revoke all on function public.approve_company_claim(uuid, text) from public, anon, authenticated;
grant execute on function public.approve_company_claim(uuid, text) to service_role;

revoke all on function public.decide_company_claim(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.decide_company_claim(uuid, text, text, text) to service_role;

revoke all on function public.revoke_company_membership(uuid, text, text) from public, anon, authenticated;
grant execute on function public.revoke_company_membership(uuid, text, text) to service_role;

revoke all on function public.approve_company_profile_submission(uuid, text) from public, anon, authenticated;
grant execute on function public.approve_company_profile_submission(uuid, text) to service_role;

revoke all on function public.decide_company_profile_submission(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.decide_company_profile_submission(uuid, text, text, text) to service_role;

commit;
