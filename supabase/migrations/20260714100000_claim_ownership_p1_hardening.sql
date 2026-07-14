begin;

-- Legacy claims intentionally remain nullable and reviewable by the admin
-- service role. They are never matched to a new authenticated user by this
-- migration and cannot create a membership without a verified auth identity.
comment on column public.company_claims.auth_user_id is
  'Nullable for legacy claims. NULL identities remain admin-reviewable but cannot create an ownership membership.';

create index if not exists company_claims_legacy_review_idx
  on public.company_claims(status, created_at desc)
  where auth_user_id is null;

-- A company must be explicitly unowned before it can be deleted. This keeps
-- ownership history from disappearing through a silent membership cascade.
alter table public.company_memberships
  drop constraint if exists company_memberships_company_id_fkey;
alter table public.company_memberships
  add constraint company_memberships_company_id_fkey
  foreign key (company_id) references public.companies(id) on delete restrict;

-- Claim history is audit data as well. A company with any claim history is
-- deliberately not hard-deletable; archive it instead of silently cascading
-- the historical ownership record.
alter table public.company_claims
  drop constraint if exists company_claims_company_id_fkey;
alter table public.company_claims
  add constraint company_claims_company_id_fkey
  foreign key (company_id) references public.companies(id) on delete restrict;

-- Auth-user deletion preserves the membership audit row, removes the active
-- identity, and is converted to a revoked membership by the trigger below.
alter table public.company_memberships
  add column if not exists former_user_id uuid;
alter table public.company_submissions
  add column if not exists former_company_id uuid;
alter table public.company_memberships
  alter column user_id drop not null;
alter table public.company_memberships
  drop constraint if exists company_memberships_user_id_fkey;
alter table public.company_memberships
  add constraint company_memberships_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

create or replace function public.prepare_company_membership_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_claim public.company_claims%rowtype;
begin
  if tg_op = 'UPDATE' and old.user_id is not null and new.user_id is null then
    new.former_user_id := old.user_id;
    new.status := 'revoked';
    new.updated_at := now();
  end if;

  if new.status = 'active' and new.user_id is null then
    raise exception 'active_membership_user_required';
  end if;
  if new.status = 'active' and new.former_user_id is not null then
    raise exception 'active_membership_former_user_conflict';
  end if;
  if new.status = 'active' then
    if new.approved_claim_id is null then raise exception 'active_membership_claim_required'; end if;
    select * into v_claim from public.company_claims where id = new.approved_claim_id for share;
    if not found or v_claim.status <> 'approved' or v_claim.auth_user_id is null
       or v_claim.auth_user_id <> new.user_id or v_claim.company_id <> new.company_id then
      raise exception 'active_membership_claim_mismatch';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists company_memberships_prepare_write on public.company_memberships;
create trigger company_memberships_prepare_write
before insert or update on public.company_memberships
for each row execute function public.prepare_company_membership_write();

create or replace function public.guard_company_claim_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'claim_audit_delete_forbidden';
  end if;

  if tg_op = 'INSERT' then
    if new.submission_id is not null and exists (
      select 1
        from public.company_submissions s
       where s.id = new.submission_id
         and (s.company_id is distinct from new.company_id
           or s.auth_user_id is distinct from new.auth_user_id)
    ) then
      raise exception 'claim_submission_identity_mismatch';
    end if;
    return new;
  end if;

  -- The auth.users FK clears auth_user_id during account deletion. Only mark
  -- the claim rejected here. Membership and company locks are deliberately
  -- acquired by the membership trigger in the same order as admin revoke;
  -- this avoids a claim -> company -> membership lock inversion.
  if new.auth_user_id is null and old.auth_user_id is not null then
    new.status := 'rejected';
    new.decided_at := now();
    new.decided_by := 'auth-user-deleted';
    new.rejection_reason := coalesce(new.rejection_reason, 'auth_user_deleted');
    return new;
  end if;

  if new.company_id is distinct from old.company_id then
    raise exception 'claim_company_immutable';
  end if;
  if new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'claim_identity_immutable';
  end if;
  if new.submission_id is distinct from old.submission_id then
    raise exception 'claim_submission_immutable';
  end if;
  if new.status is distinct from old.status
     and coalesce(current_setting('gewerkeliste.claim_transition', true), '') <> '1' then
    raise exception 'claim_transition_required';
  end if;

  -- An active membership is proven by exactly this approved claim. Direct
  -- service-role table writes must not be able to sever that provenance.
  if old.status = 'approved' and exists (
    select 1
      from public.company_memberships m
     where m.approved_claim_id = old.id
       and m.role = 'owner'
       and m.status = 'active'
  ) and (
    new.status <> 'approved'
    or new.auth_user_id is distinct from old.auth_user_id
    or new.company_id is distinct from old.company_id
  ) then
    raise exception 'active_membership_claim_mismatch';
  end if;

  return new;
end;
$$;

drop trigger if exists company_claims_guard_write on public.company_claims;
create trigger company_claims_guard_write
before insert or update or delete on public.company_claims
for each row execute function public.guard_company_claim_write();

create or replace function public.guard_company_audit_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception '%_audit_delete_forbidden', tg_table_name;
end;
$$;

drop trigger if exists company_memberships_audit_delete_guard on public.company_memberships;
create trigger company_memberships_audit_delete_guard
before delete on public.company_memberships
for each row execute function public.guard_company_audit_delete();

drop trigger if exists company_submissions_audit_delete_guard on public.company_submissions;
create trigger company_submissions_audit_delete_guard
before delete on public.company_submissions
for each row execute function public.guard_company_audit_delete();

create or replace function public.guard_owner_submission_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if old.source like 'owner-profile-update:%' and new.company_id is null and old.company_id is not null then
    new.former_company_id := old.company_id;
    new.status := 'rejected';
    new.decided_at := now();
    new.decided_by := 'company-deleted';
    new.rejection_reason := coalesce(new.rejection_reason, 'company_deleted');
    return new;
  end if;

  if old.source like 'owner-profile-update:%' and new.auth_user_id is null and old.auth_user_id is not null then
    new.status := 'rejected';
    new.decided_at := now();
    new.decided_by := 'auth-user-deleted';
    new.rejection_reason := coalesce(new.rejection_reason, 'auth_user_deleted');
    return new;
  end if;

  if old.source like 'owner-profile-update:%'
     and (new.company_id is distinct from old.company_id or new.auth_user_id is distinct from old.auth_user_id) then
    raise exception 'owner_submission_identity_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists company_submissions_owner_identity_guard on public.company_submissions;
create trigger company_submissions_owner_identity_guard
before update on public.company_submissions
for each row execute function public.guard_owner_submission_write();

create or replace function public.sync_company_claim_status_from_membership()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_company_id uuid;
begin
  if tg_op <> 'INSERT'
     and old.status = 'active'
     and (tg_op = 'DELETE' or new.status <> 'active')
     and old.approved_claim_id is not null
  then
    perform set_config('gewerkeliste.claim_transition', '1', true);
    update public.company_claims
       set status = 'rejected', decided_at = now(),
           decided_by = 'membership-integrity-trigger',
           rejection_reason = coalesce(rejection_reason, 'membership_revoked')
     where id = old.approved_claim_id and status = 'approved';

    update public.company_submissions
       set status = 'rejected', decided_at = now(),
           decided_by = 'membership-integrity-trigger',
           rejection_reason = coalesce(rejection_reason, 'membership_revoked')
     where company_id = old.company_id
       and auth_user_id = old.user_id
       and source like 'owner-profile-update:%'
       and status in ('submitted', 'in_review', 'needs_info');
    perform set_config('gewerkeliste.claim_transition', '', true);
  end if;

  if tg_op <> 'DELETE' then
    v_company_id := new.company_id;
    update public.companies
       set claim_status = case
         when exists (
           select 1 from public.company_memberships m
            where m.company_id = v_company_id and m.role = 'owner' and m.status = 'active'
         ) then 'claimed'::public.claim_status
         when exists (
           select 1 from public.company_claims c
            where c.company_id = v_company_id and c.status in ('pending', 'needs_info')
         ) then 'pending'::public.claim_status
         else 'unclaimed'::public.claim_status
       end
     where id = v_company_id;
  end if;

  if tg_op <> 'INSERT' and (tg_op = 'DELETE' or old.company_id is distinct from new.company_id) then
    v_company_id := old.company_id;
    update public.companies
       set claim_status = case
         when exists (
           select 1 from public.company_memberships m
            where m.company_id = v_company_id and m.role = 'owner' and m.status = 'active'
         ) then 'claimed'::public.claim_status
         when exists (
           select 1 from public.company_claims c
            where c.company_id = v_company_id and c.status in ('pending', 'needs_info')
         ) then 'pending'::public.claim_status
         else 'unclaimed'::public.claim_status
       end
     where id = v_company_id;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists company_memberships_claim_status_sync on public.company_memberships;
create trigger company_memberships_claim_status_sync
after insert or update or delete on public.company_memberships
for each row execute function public.sync_company_claim_status_from_membership();

create or replace function public.sync_company_claim_status_from_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.companies
     set claim_status = case
       when exists (
         select 1 from public.company_memberships m
          where m.company_id = new.company_id and m.role = 'owner' and m.status = 'active'
       ) then 'claimed'::public.claim_status
       when exists (
         select 1 from public.company_claims c
          where c.company_id = new.company_id and c.status in ('pending', 'needs_info')
       ) then 'pending'::public.claim_status
       else 'unclaimed'::public.claim_status
     end
   where id = new.company_id;
  return new;
end;
$$;

drop trigger if exists company_claims_claim_status_sync on public.company_claims;
create trigger company_claims_claim_status_sync
after insert or update on public.company_claims
for each row execute function public.sync_company_claim_status_from_claim();

-- Reconcile existing companies once. An approved legacy claim without an
-- active membership is reviewable history, never proof of current ownership.
update public.companies c
   set claim_status = case
     when exists (
       select 1 from public.company_memberships m
        where m.company_id = c.id and m.role = 'owner' and m.status = 'active'
     ) then 'claimed'::public.claim_status
     when exists (
       select 1 from public.company_claims cl
        where cl.company_id = c.id and cl.status in ('pending', 'needs_info')
     ) then 'pending'::public.claim_status
     else 'unclaimed'::public.claim_status
   end
 where c.claim_status in ('claimed', 'pending')
    or exists (
      select 1 from public.company_memberships m
       where m.company_id = c.id and m.role = 'owner' and m.status = 'active'
    )
    or exists (
      select 1 from public.company_claims cl
       where cl.company_id = c.id and cl.status in ('pending', 'needs_info')
    );

alter table public.company_memberships enable row level security;
alter table public.company_claims enable row level security;
alter table public.company_submissions enable row level security;

drop policy if exists "users read own company memberships" on public.company_memberships;
drop policy if exists "users read own claims" on public.company_claims;
drop policy if exists "users read own submissions" on public.company_submissions;

revoke all on table public.company_memberships, public.company_claims, public.company_submissions
from public, anon, authenticated, service_role;

grant select, insert, update, delete on table public.company_memberships, public.company_claims, public.company_submissions
to service_role;

-- These functions expose only the minimum safe, self-owned projection needed
-- by the owner UI. Base-table SELECT remains unavailable to authenticated.
create or replace function public.get_my_active_memberships(p_company_id uuid default null)
returns table (
  id uuid,
  company_id uuid,
  role text,
  status text,
  approved_claim_id uuid,
  approved_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select m.id, m.company_id, m.role, m.status, m.approved_claim_id, m.approved_at, m.created_at
    from public.company_memberships m
    join auth.users u on u.id = m.user_id
   where m.user_id = auth.uid()
     and m.role = 'owner'
     and m.status = 'active'
     and u.email_confirmed_at is not null
     and (u.banned_until is null or u.banned_until <= now())
     and u.deleted_at is null
     and (p_company_id is null or m.company_id = p_company_id)
   order by m.created_at desc;
$$;

create or replace function public.get_my_claims()
returns table (
  id uuid,
  company_id uuid,
  status text,
  created_at timestamptz,
  decided_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select c.id, c.company_id, c.status, c.created_at, c.decided_at
   from public.company_claims c
   where c.auth_user_id = auth.uid()
     and exists (
       select 1 from auth.users u
        where u.id = auth.uid()
          and u.email_confirmed_at is not null
          and (u.banned_until is null or u.banned_until <= now())
          and u.deleted_at is null
     )
   order by c.created_at desc;
$$;

create or replace function public.get_my_owner_submissions(p_company_id uuid)
returns table (
  id uuid,
  status text,
  created_at timestamptz,
  decided_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select s.id, s.status, s.created_at, s.decided_at
   from public.company_submissions s
   where s.auth_user_id = auth.uid()
     and s.company_id = p_company_id
     and s.source like 'owner-profile-update:%'
     and exists (
       select 1 from auth.users u
        where u.id = auth.uid()
          and u.email_confirmed_at is not null
          and (u.banned_until is null or u.banned_until <= now())
          and u.deleted_at is null
     )
   order by s.created_at desc
   limit 5;
$$;

revoke all on function public.get_my_active_memberships(uuid) from public, anon, authenticated;
grant execute on function public.get_my_active_memberships(uuid) to authenticated;
revoke all on function public.get_my_claims() from public, anon, authenticated;
grant execute on function public.get_my_claims() to authenticated;
revoke all on function public.get_my_owner_submissions(uuid) from public, anon, authenticated;
grant execute on function public.get_my_owner_submissions(uuid) to authenticated;

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
  v_banned_until timestamptz;
  v_deleted_at timestamptz;
  v_email text;
  v_existing_claim_id uuid;
  v_claim_id uuid;
  v_submission_id uuid;
  v_company public.companies%rowtype;
  v_primary_trade text;
  v_message text := nullif(trim(coalesce(p_authorization_notes, '')), '');
  v_verification_notes text := nullif(trim(concat_ws(E'\n', nullif(trim(coalesce(p_role, '')), ''), v_message)), '');
begin
  select email, email_confirmed_at, banned_until, deleted_at into v_auth_email, v_email_confirmed_at, v_banned_until, v_deleted_at
    from auth.users where id = v_user_id for key share;
  v_email := nullif(trim(coalesce(v_auth_email, '')), '');
  if v_user_id is null or v_email is null or v_email_confirmed_at is null or v_deleted_at is not null or (v_banned_until is not null and v_banned_until > now()) then
    raise exception 'authenticated_email_required';
  end if;
  if not p_consent_authorized or not p_consent_privacy then raise exception 'consent_required'; end if;

  select * into v_company from public.companies
   where id = p_company_id and public_visible = true for update;
  if not found then raise exception 'company_not_found'; end if;
  if v_company.claim_status = 'claimed' then raise exception 'company_already_claimed'; end if;

  -- A needs_info or rejected claim is never reused. A new authenticated
  -- submission is the only way to provide a fresh reviewed snapshot.
  select id into v_existing_claim_id from public.company_claims
   where company_id = p_company_id and auth_user_id = v_user_id and status = 'pending'
   order by created_at desc limit 1;
  if v_existing_claim_id is not null then return v_existing_claim_id; end if;

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
    consent_data_correct, consent_privacy, source, auth_user_id, company_id
  ) values (
    'submitted', v_company.name, null, v_company.website_url, v_company.phone,
    v_email, v_email, nullif(trim(coalesce(p_name, '')), ''),
    nullif(trim(coalesce(p_role, '')), ''), v_email,
    nullif(trim(coalesce(p_phone, '')), ''), v_company.street, v_company.postal_code,
    v_company.city, 'Deutschland', v_primary_trade, '[]'::jsonb, '[]'::jsonb,
    '[]'::jsonb, coalesce(v_company.service_radius_km, 50),
    coalesce(to_jsonb(v_company.service_regions), '[]'::jsonb),
    coalesce(to_jsonb(v_company.service_postal_codes), '[]'::jsonb),
    coalesce(to_jsonb(v_company.service_countries), '["Deutschland"]'::jsonb),
    left(coalesce(v_company.description, 'Profilübernahme zur Prüfung.'), 240),
    concat('Übernahmeantrag für den bestehenden Betriebseintrag.', E'\n\n', coalesce(v_message, 'Keine weiteren Angaben.')),
    concat('Bestehende Firmen-ID: ', v_company.id::text), '[]'::jsonb, '[]'::jsonb,
    '[]'::jsonb, false, false, false, p_consent_authorized, false, p_consent_privacy,
    concat('claim:', p_company_id::text), v_user_id, p_company_id
  ) returning id into v_submission_id;

  insert into public.company_claims (
    company_id, name, email, phone, message, status, auth_user_id,
    email_verified_at, verification_method, verification_notes, submission_id
  ) values (
    p_company_id,
    nullif(trim(coalesce(p_name, '')), ''),
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    coalesce(v_message, 'Keine weiteren Angaben.'),
    'pending', v_user_id, v_email_confirmed_at, 'supabase_magic_link', v_verification_notes, v_submission_id
  ) returning id into v_claim_id;

  update public.companies set claim_status = case
    when exists (select 1 from public.company_memberships m where m.company_id = p_company_id and m.role = 'owner' and m.status = 'active') then 'claimed'::public.claim_status
    when exists (select 1 from public.company_claims c where c.company_id = p_company_id and c.status in ('pending', 'needs_info')) then 'pending'::public.claim_status
    else 'unclaimed'::public.claim_status
  end where id = p_company_id;
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
  v_company_id uuid;
  v_claim public.company_claims%rowtype;
  v_company public.companies%rowtype;
  v_membership_id uuid;
  v_existing_membership public.company_memberships%rowtype;
  v_has_membership boolean;
  v_email_confirmed_at timestamptz;
  v_banned_until timestamptz;
  v_deleted_at timestamptz;
  v_claim_user_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  select company_id, auth_user_id into v_company_id, v_claim_user_id from public.company_claims where id = p_claim_id;
  if v_company_id is null then raise exception 'claim_not_found'; end if;
  if v_claim_user_id is not null then
    select email_confirmed_at, banned_until, deleted_at into v_email_confirmed_at, v_banned_until, v_deleted_at
      from auth.users where id = v_claim_user_id for key share;
    if not found or v_email_confirmed_at is null or v_deleted_at is not null or (v_banned_until is not null and v_banned_until > now()) then
      raise exception 'claim_user_missing';
    end if;
  end if;
  select * into v_existing_membership from public.company_memberships
   where company_id = v_company_id and role = 'owner' and status = 'active' for update;
  v_has_membership := found;
  select * into v_claim from public.company_claims where id = p_claim_id for update;
  if not found or v_claim.company_id is distinct from v_company_id then raise exception 'claim_changed'; end if;
  select * into v_company from public.companies where id = v_company_id for update;
  if not found then raise exception 'company_not_found'; end if;
  -- Re-read after the company lock so a concurrent approval cannot be
  -- mistaken for an unclaimed company after waiting on the same lock.
  select * into v_existing_membership from public.company_memberships
   where company_id = v_company_id and role = 'owner' and status = 'active' for update;
  v_has_membership := found;
  if v_claim.auth_user_id is null then raise exception 'claim_user_missing'; end if;
  if v_claim.auth_user_id is distinct from v_claim_user_id then raise exception 'claim_changed'; end if;
  if v_claim.company_id is distinct from v_company_id then raise exception 'claim_changed'; end if;
  select email_confirmed_at, banned_until, deleted_at into v_email_confirmed_at, v_banned_until, v_deleted_at from auth.users where id = v_claim.auth_user_id;
  if not found or v_email_confirmed_at is null or v_deleted_at is not null or (v_banned_until is not null and v_banned_until > now()) then raise exception 'claim_user_missing'; end if;

  if v_has_membership and v_existing_membership.user_id <> v_claim.auth_user_id then
    raise exception 'company_already_claimed';
  end if;
  if v_claim.status = 'approved' and v_has_membership then return v_existing_membership.id; end if;
  if v_claim.status <> 'pending' then raise exception 'claim_not_approvable'; end if;
  if v_has_membership then raise exception 'company_already_claimed'; end if;

  perform set_config('gewerkeliste.claim_transition', '1', true);
  update public.company_claims
     set status = 'approved', decided_at = now(),
         decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
         rejection_reason = null
   where id = v_claim.id;
  if v_claim.submission_id is not null then
    update public.company_submissions
       set status = 'approved', decided_at = now(),
           decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
           rejection_reason = null
     where id = v_claim.submission_id
       and company_id = v_claim.company_id
       and auth_user_id = v_claim.auth_user_id
       and source = concat('claim:', v_claim.company_id::text);
  end if;
  perform set_config('gewerkeliste.claim_transition', '', true);
  insert into public.company_memberships (company_id, user_id, role, status, approved_claim_id, approved_at)
  values (v_claim.company_id, v_claim.auth_user_id, 'owner', 'active', v_claim.id, now())
  returning id into v_membership_id;
  update public.companies
     set claim_status = 'claimed'::public.claim_status,
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
declare
  v_company_id uuid;
  v_claim public.company_claims%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  perform set_config('gewerkeliste.claim_transition', '1', true);
  if p_status not in ('needs_info', 'rejected') then raise exception 'unsupported_claim_decision'; end if;
  select company_id into v_company_id from public.company_claims where id = p_claim_id;
  if v_company_id is null then raise exception 'claim_not_decidable'; end if;
  select * into v_claim from public.company_claims where id = p_claim_id for update;
  if not found or v_claim.company_id is distinct from v_company_id or v_claim.status not in ('pending', 'needs_info') then
    raise exception 'claim_not_decidable';
  end if;
  perform 1 from public.companies where id = v_company_id for update;

  update public.company_claims
     set status = p_status, decided_at = now(),
         decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
         rejection_reason = nullif(trim(coalesce(p_reason, '')), '')
   where id = p_claim_id;
  perform set_config('gewerkeliste.claim_transition', '', true);
  update public.company_submissions
     set status = p_status, decided_at = now(),
         decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
         rejection_reason = nullif(trim(coalesce(p_reason, '')), '')
   where id = v_claim.submission_id
     and company_id = v_claim.company_id
     and auth_user_id is not distinct from v_claim.auth_user_id
     and source = concat('claim:', v_claim.company_id::text)
     and status in ('submitted', 'in_review', 'needs_info');

  update public.companies set claim_status = case
    when exists (select 1 from public.company_memberships m where m.company_id = v_company_id and m.role = 'owner' and m.status = 'active') then 'claimed'::public.claim_status
    when exists (select 1 from public.company_claims c where c.company_id = v_company_id and c.status in ('pending', 'needs_info')) then 'pending'::public.claim_status
    else 'unclaimed'::public.claim_status
  end where id = v_company_id;
end;
$$;

create or replace function public.set_company_submission_review_status(
  p_submission_id uuid,
  p_status text,
  p_admin_notes text default null,
  p_admin_actor text default 'basic-auth-admin'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source text;
  v_current_status text;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_status not in ('submitted', 'in_review', 'needs_info', 'rejected') then
    raise exception 'unsupported_submission_status';
  end if;

  select source, status into v_source, v_current_status
    from public.company_submissions
   where id = p_submission_id
   for update;
  if not found then raise exception 'submission_not_found'; end if;
  if v_source like 'claim:%' or v_source like 'owner-profile-update:%' then
    raise exception 'special_submission_transition_required';
  end if;
  if v_current_status = 'approved' then raise exception 'approved_submission_immutable'; end if;
  if p_status = 'submitted' and v_current_status <> 'submitted' then
    raise exception 'submission_reopen_forbidden';
  end if;
  if p_status = 'in_review' and v_current_status not in ('submitted', 'in_review', 'needs_info') then
    raise exception 'submission_transition_forbidden';
  end if;
  if p_status in ('needs_info', 'rejected') and v_current_status not in ('submitted', 'in_review', 'needs_info', 'rejected') then
    raise exception 'submission_transition_forbidden';
  end if;

  update public.company_submissions
     set status = p_status,
         decided_at = case when p_status in ('needs_info', 'rejected') then now() else null end,
         decided_by = case when p_status in ('needs_info', 'rejected') then nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), '') else null end,
         rejection_reason = case when p_status = 'rejected' then nullif(trim(coalesce(p_admin_notes, '')), '') else null end
   where id = p_submission_id;
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
  v_user_id uuid;
  v_approved_claim_id uuid;
  v_submission_id uuid;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  perform set_config('gewerkeliste.claim_transition', '1', true);
  select company_id, user_id, approved_claim_id into v_company_id, v_user_id, v_approved_claim_id
    from public.company_memberships where id = p_membership_id and status = 'active' for update;
  if v_company_id is null then raise exception 'membership_not_active'; end if;
  select submission_id into v_submission_id from public.company_claims where id = v_approved_claim_id for update;
  perform 1 from public.companies where id = v_company_id for update;

  update public.company_memberships
     set status = 'revoked', updated_at = now()
   where id = p_membership_id;
  perform set_config('gewerkeliste.claim_transition', '1', true);
  update public.company_claims
     set status = 'rejected', decided_at = now(),
         decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
         rejection_reason = coalesce(v_reason, 'membership_revoked')
   where id = v_approved_claim_id and status = 'approved';
  perform set_config('gewerkeliste.claim_transition', '', true);
  update public.company_submissions
     set status = 'rejected', decided_at = now(),
         decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
         rejection_reason = coalesce(v_reason, 'membership_revoked')
   where id = v_submission_id
     and company_id = v_company_id
     and auth_user_id is not distinct from v_user_id
     and source = concat('claim:', v_company_id::text)
     and status in ('submitted', 'in_review', 'needs_info', 'approved');
  update public.company_submissions
     set status = 'rejected', decided_at = now(),
         decided_by = nullif(trim(coalesce(p_admin_actor, 'basic-auth-admin')), ''),
         rejection_reason = coalesce(v_reason, 'membership_revoked')
   where company_id = v_company_id and auth_user_id = v_user_id
     and source like 'owner-profile-update:%'
     and status in ('submitted', 'in_review', 'needs_info');

  update public.companies set claim_status = case
    when exists (select 1 from public.company_memberships m where m.company_id = v_company_id and m.role = 'owner' and m.status = 'active') then 'claimed'::public.claim_status
    when exists (select 1 from public.company_claims c where c.company_id = v_company_id and c.status in ('pending', 'needs_info')) then 'pending'::public.claim_status
    else 'unclaimed'::public.claim_status
  end where id = v_company_id;
end;
$$;

drop index if exists public.company_submissions_one_pending_owner_update_idx;
create unique index company_submissions_one_pending_owner_update_idx
  on public.company_submissions(company_id, auth_user_id)
  where source like 'owner-profile-update:%'
    and status in ('submitted', 'in_review');

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
  v_auth_email text;
  v_email_confirmed_at timestamptz;
  v_banned_until timestamptz;
  v_deleted_at timestamptz;
  v_company public.companies%rowtype;
  v_primary_trade text;
  v_submission_id uuid;
  v_membership_id uuid;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
begin
  select email, email_confirmed_at, banned_until, deleted_at into v_auth_email, v_email_confirmed_at, v_banned_until, v_deleted_at
    from auth.users where id = v_user_id for key share;
  if v_user_id is null or nullif(trim(coalesce(v_auth_email, '')), '') is null or v_email_confirmed_at is null or v_deleted_at is not null or (v_banned_until is not null and v_banned_until > now()) then raise exception 'authenticated_email_required'; end if;
  if coalesce(v_payload ->> 'consent_authorized', 'false') <> 'true' or coalesce(v_payload ->> 'consent_privacy', 'false') <> 'true' then raise exception 'consent_required'; end if;

  select id into v_membership_id from public.company_memberships
   where company_id = p_company_id and user_id = v_user_id and role = 'owner' and status = 'active' for update;
  if v_membership_id is null then raise exception 'active_membership_required'; end if;
  select * into v_company from public.companies where id = p_company_id for update;
  if not found then raise exception 'company_not_found'; end if;
  if exists (
    select 1 from public.company_submissions
     where company_id = p_company_id and auth_user_id = v_user_id
       and status in ('submitted', 'in_review')
       and source = concat('owner-profile-update:', p_company_id::text)
  ) then raise exception 'profile_change_already_pending'; end if;

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
  ) values (
    'submitted', coalesce(nullif(trim(v_payload ->> 'company_name'), ''), v_company.name),
    nullif(trim(v_payload ->> 'legal_form'), ''), nullif(trim(v_payload ->> 'website'), ''),
    nullif(trim(v_payload ->> 'phone'), ''), coalesce(nullif(trim(v_payload ->> 'public_email'), ''), v_company.email),
    nullif(trim(v_payload ->> 'public_email'), ''), nullif(trim(v_payload ->> 'contact_name'), ''),
    nullif(trim(v_payload ->> 'contact_role'), ''),
    coalesce(nullif(trim(v_payload ->> 'public_email'), ''), v_company.email),
    nullif(trim(v_payload ->> 'contact_phone'), ''), nullif(trim(v_payload ->> 'street'), ''),
    coalesce(nullif(trim(v_payload ->> 'postal_code'), ''), v_company.postal_code),
    coalesce(nullif(trim(v_payload ->> 'city'), ''), v_company.city), 'Deutschland', v_primary_trade,
    case when jsonb_typeof(v_payload -> 'secondary_trades') = 'array' then v_payload -> 'secondary_trades' else '[]'::jsonb end,
    case when jsonb_typeof(v_payload -> 'selected_services') = 'array' then v_payload -> 'selected_services' else '[]'::jsonb end,
    case when jsonb_typeof(v_payload -> 'specializations') = 'array' then v_payload -> 'specializations' else '[]'::jsonb end,
    greatest(0, coalesce((v_payload ->> 'service_radius_km')::integer, v_company.service_radius_km, 50)),
    case when jsonb_typeof(v_payload -> 'service_regions') = 'array' then v_payload -> 'service_regions' else coalesce(to_jsonb(v_company.service_regions), '[]'::jsonb) end,
    case when jsonb_typeof(v_payload -> 'postal_codes') = 'array' then v_payload -> 'postal_codes' else coalesce(to_jsonb(v_company.service_postal_codes), '[]'::jsonb) end,
    case when jsonb_typeof(v_payload -> 'service_countries') = 'array' then v_payload -> 'service_countries' else coalesce(to_jsonb(v_company.service_countries), '["Deutschland"]'::jsonb) end,
    left(coalesce(nullif(trim(v_payload ->> 'short_description'), ''), v_company.description), 240),
    nullif(trim(v_payload ->> 'description'), ''), nullif(trim(v_payload ->> 'references_text'), ''),
    case when jsonb_typeof(v_payload -> 'memberships') = 'array' then v_payload -> 'memberships' else coalesce(to_jsonb(v_company.memberships), '[]'::jsonb) end,
    case when jsonb_typeof(v_payload -> 'certificates') = 'array' then v_payload -> 'certificates' else coalesce(to_jsonb(v_company.certificates), '[]'::jsonb) end,
    case when jsonb_typeof(v_payload -> 'manufacturer_certificates') = 'array' then v_payload -> 'manufacturer_certificates' else coalesce(to_jsonb(v_company.manufacturer_certificates), '[]'::jsonb) end,
    false, false, false, coalesce((v_payload ->> 'consent_authorized')::boolean, false), false,
    coalesce((v_payload ->> 'consent_privacy')::boolean, false), concat('owner-profile-update:', p_company_id::text),
    jsonb_build_object(
      'social_links', case when jsonb_typeof(v_payload -> 'social_links') = 'array' and jsonb_array_length(v_payload -> 'social_links') > 0 then v_payload -> 'social_links' else null end,
      'notes', nullif(trim(v_payload ->> 'notes'), '')
    ), v_user_id, p_company_id, nullif(trim(v_payload ->> 'logo_url'), ''),
    nullif(trim(v_payload ->> 'profile_image_url'), ''), nullif(trim(v_payload ->> 'profile_image_alt'), ''),
    nullif(trim(v_payload ->> 'contact_name'), ''), nullif(trim(v_payload ->> 'contact_role'), '')
  ) returning id into v_submission_id;
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
  v_company_id uuid;
  v_user_id uuid;
  v_email_confirmed_at timestamptz;
  v_banned_until timestamptz;
  v_deleted_at timestamptz;
  v_submission public.company_submissions%rowtype;
  v_company public.companies%rowtype;
  v_membership public.company_memberships%rowtype;
  v_primary_trade_id uuid;
  v_secondary_slug text;
  v_secondary_trade_id uuid;
  v_social jsonb;
  v_platform text;
  v_url text;
  v_label text;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  select company_id, auth_user_id into v_company_id, v_user_id
    from public.company_submissions where id = p_submission_id and source like 'owner-profile-update:%';
  if v_company_id is null then raise exception 'owner_submission_identity_missing'; end if;
  if v_user_id is null then raise exception 'owner_submission_identity_missing'; end if;

  select email_confirmed_at, banned_until, deleted_at into v_email_confirmed_at, v_banned_until, v_deleted_at
    from auth.users where id = v_user_id for key share;
  if not found or v_email_confirmed_at is null or v_deleted_at is not null or (v_banned_until is not null and v_banned_until > now()) then
    raise exception 'active_membership_required';
  end if;

  select m.* into v_membership
    from public.company_memberships m join auth.users u on u.id = m.user_id
   where m.company_id = v_company_id and m.user_id = v_user_id
     and m.role = 'owner' and m.status = 'active' and u.email_confirmed_at is not null
     and (u.banned_until is null or u.banned_until <= now())
     and u.deleted_at is null
   for update of m;
  if not found then raise exception 'active_membership_required'; end if;
  select * into v_company from public.companies where id = v_company_id for update;
  if not found then raise exception 'company_not_found'; end if;
  select * into v_submission from public.company_submissions where id = p_submission_id and source like 'owner-profile-update:%' for update;
  if not found then raise exception 'owner_submission_not_found'; end if;
  if v_submission.company_id is distinct from v_company_id or v_submission.auth_user_id is distinct from v_user_id then
    raise exception 'owner_submission_identity_changed';
  end if;
  if v_submission.status = 'approved' then return v_submission.company_id; end if;
  if v_submission.status not in ('submitted', 'in_review') then raise exception 'owner_submission_not_approvable'; end if;

  select id into v_primary_trade_id from public.trades where slug = v_submission.primary_trade;
  if v_primary_trade_id is null then raise exception 'company_trade_not_found'; end if;

  update public.companies
     set name = coalesce(nullif(trim(v_submission.company_name), ''), v_company.name),
         trade_id = v_primary_trade_id,
         description = coalesce(nullif(trim(v_submission.description), ''), v_submission.short_description, v_company.description),
         contact_name = coalesce(nullif(trim(concat_ws(' ', v_submission.contact_first_name, v_submission.contact_last_name)), ''), v_company.contact_name),
         email = coalesce(v_submission.contact_email, v_company.email),
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

  delete from public.company_trades where company_id = v_company.id and source = 'owner-submission';
  insert into public.company_trades (company_id, trade_id, confidence_score, source, evidence, status, visibility_level)
  values (v_company.id, v_primary_trade_id, 100, 'owner-submission', v_submission.selected_services::text, 'admin_confirmed', 'basis_public')
  on conflict (company_id, trade_id) do update set confidence_score = excluded.confidence_score, source = excluded.source, evidence = excluded.evidence, status = excluded.status, visibility_level = excluded.visibility_level;

  if jsonb_typeof(to_jsonb(v_submission.secondary_trades)) = 'array' then
    for v_secondary_slug in select jsonb_array_elements_text(to_jsonb(v_submission.secondary_trades)) loop
      select id into v_secondary_trade_id from public.trades where slug = v_secondary_slug;
      if v_secondary_trade_id is not null and v_secondary_trade_id <> v_primary_trade_id then
        insert into public.company_trades (company_id, trade_id, confidence_score, source, evidence, status, visibility_level)
        values (v_company.id, v_secondary_trade_id, 100, 'owner-submission', v_submission.selected_services::text, 'admin_confirmed', 'basis_public')
        on conflict (company_id, trade_id) do update set confidence_score = excluded.confidence_score, source = excluded.source, evidence = excluded.evidence, status = excluded.status, visibility_level = excluded.visibility_level;
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
      if v_platform in ('instagram', 'whatsapp', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x', 'pinterest', 'xing') and v_url ~* '^https?://.+' then
        insert into public.company_social_links (company_id, platform, url, label, review_status, sort_order)
        values (v_company.id, v_platform, v_url, v_label, 'approved', 0);
      end if;
    end loop;
  end if;

  insert into public.company_sources (company_id, source_type, source_url, title, snippet, content)
  values (v_company.id, 'owner_submission', null, 'Betriebsinhaber-Einreichung', concat(v_submission.company_name, ' wurde nach menschlicher Prüfung aktualisiert.'), jsonb_build_object('submission_id', v_submission.id, 'approved_by', p_admin_actor)::text);
  insert into public.company_change_log (company_id, action, field_name, new_value, created_by)
  values (v_company.id, 'owner_submission_approved', null, v_submission.id::text, coalesce(nullif(trim(p_admin_actor), ''), 'basic-auth-admin'));
  update public.company_submissions set status = 'approved', decided_at = now(), decided_by = coalesce(nullif(trim(p_admin_actor), ''), 'basic-auth-admin'), rejection_reason = null where id = v_submission.id;
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
     set status = p_status, decided_at = now(),
         decided_by = coalesce(nullif(trim(p_admin_actor), ''), 'basic-auth-admin'),
         rejection_reason = nullif(trim(coalesce(p_reason, '')), '')
   where id = p_submission_id and source like 'owner-profile-update:%'
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
revoke all on function public.set_company_submission_review_status(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.set_company_submission_review_status(uuid, text, text, text) to service_role;
revoke all on function public.revoke_company_membership(uuid, text, text) from public, anon, authenticated;
grant execute on function public.revoke_company_membership(uuid, text, text) to service_role;
revoke all on function public.approve_company_profile_submission(uuid, text) from public, anon, authenticated;
grant execute on function public.approve_company_profile_submission(uuid, text) to service_role;
revoke all on function public.decide_company_profile_submission(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.decide_company_profile_submission(uuid, text, text, text) to service_role;
revoke all on function public.prepare_company_membership_write() from public, anon, authenticated, service_role;
revoke all on function public.guard_company_claim_write() from public, anon, authenticated, service_role;
revoke all on function public.guard_company_audit_delete() from public, anon, authenticated, service_role;
revoke all on function public.guard_owner_submission_write() from public, anon, authenticated, service_role;
revoke all on function public.sync_company_claim_status_from_membership() from public, anon, authenticated, service_role;
revoke all on function public.sync_company_claim_status_from_claim() from public, anon, authenticated, service_role;

commit;
