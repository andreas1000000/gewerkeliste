create table if not exists trade_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table trades
  add column if not exists trade_group_id uuid references trade_groups(id) on delete set null,
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists canonical_trade_id uuid references trades(id) on delete set null;

create table if not exists service_families (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trade_id, slug)
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  service_family_id uuid not null references service_families(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  search_weight integer not null default 70 check (search_weight between 0 and 100),
  seo_enabled boolean not null default false,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  canonical_service_id uuid references services(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_family_id, slug)
);

create table if not exists service_aliases (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  alias text not null,
  alias_type text not null default 'synonym'
    check (alias_type in ('synonym', 'colloquial', 'abbreviation', 'typo', 'regional', 'material', 'system', 'old_slug')),
  created_at timestamptz not null default now(),
  unique (service_id, alias)
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists service_activities (
  service_id uuid not null references services(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (service_id, activity_id)
);

create table if not exists contexts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  context_type text not null
    check (context_type in ('building_type', 'project_type', 'customer_type', 'material', 'regulation', 'use_case')),
  created_at timestamptz not null default now()
);

create table if not exists service_contexts (
  service_id uuid not null references services(id) on delete cascade,
  context_id uuid not null references contexts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (service_id, context_id)
);

create table if not exists service_crosslinks (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  related_service_id uuid references services(id) on delete cascade,
  related_trade_slug text,
  relation_type text not null default 'crosslink'
    check (relation_type in ('crosslink', 'alternative', 'prerequisite', 'related_trade', 'seo_related')),
  created_at timestamptz not null default now(),
  check (related_service_id is not null or related_trade_slug is not null)
);

create unique index if not exists service_crosslinks_related_trade_unique
on service_crosslinks(service_id, related_trade_slug, relation_type)
where related_trade_slug is not null;

create table if not exists company_services (
  company_id uuid not null references companies(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  confidence_score integer not null default 80 check (confidence_score between 0 and 100),
  source text not null default 'manual',
  status text not null default 'suggested' check (status in ('suggested', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, service_id)
);

create table if not exists company_service_activities (
  company_id uuid not null references companies(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  primary key (company_id, service_id, activity_id)
);

create table if not exists company_contexts (
  company_id uuid not null references companies(id) on delete cascade,
  context_id uuid not null references contexts(id) on delete cascade,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  primary key (company_id, context_id)
);

create index if not exists trade_groups_sort_idx on trade_groups(sort_order, name);
create index if not exists trades_group_sort_idx on trades(trade_group_id, sort_order, name);
create index if not exists service_families_trade_sort_idx on service_families(trade_id, sort_order, name);
create index if not exists services_family_sort_idx on services(service_family_id, sort_order, name);
create index if not exists services_slug_idx on services(slug);
create index if not exists service_aliases_alias_idx on service_aliases(alias);
create index if not exists company_services_service_idx on company_services(service_id, confidence_score desc);
create index if not exists service_crosslinks_trade_slug_idx on service_crosslinks(related_trade_slug);

drop trigger if exists trade_groups_updated_at on trade_groups;
create trigger trade_groups_updated_at
before update on trade_groups
for each row execute function set_updated_at();

drop trigger if exists service_families_updated_at on service_families;
create trigger service_families_updated_at
before update on service_families
for each row execute function set_updated_at();

drop trigger if exists services_updated_at on services;
create trigger services_updated_at
before update on services
for each row execute function set_updated_at();

drop trigger if exists company_services_updated_at on company_services;
create trigger company_services_updated_at
before update on company_services
for each row execute function set_updated_at();

alter table trade_groups enable row level security;
alter table service_families enable row level security;
alter table services enable row level security;
alter table service_aliases enable row level security;
alter table activities enable row level security;
alter table service_activities enable row level security;
alter table contexts enable row level security;
alter table service_contexts enable row level security;
alter table service_crosslinks enable row level security;
alter table company_services enable row level security;
alter table company_service_activities enable row level security;
alter table company_contexts enable row level security;

drop policy if exists "service role manages trade groups" on trade_groups;
create policy "service role manages trade groups" on trade_groups for all to service_role using (true) with check (true);

drop policy if exists "service role manages service families" on service_families;
create policy "service role manages service families" on service_families for all to service_role using (true) with check (true);

drop policy if exists "service role manages services" on services;
create policy "service role manages services" on services for all to service_role using (true) with check (true);

drop policy if exists "service role manages service aliases" on service_aliases;
create policy "service role manages service aliases" on service_aliases for all to service_role using (true) with check (true);

drop policy if exists "service role manages activities" on activities;
create policy "service role manages activities" on activities for all to service_role using (true) with check (true);

drop policy if exists "service role manages service activities" on service_activities;
create policy "service role manages service activities" on service_activities for all to service_role using (true) with check (true);

drop policy if exists "service role manages contexts" on contexts;
create policy "service role manages contexts" on contexts for all to service_role using (true) with check (true);

drop policy if exists "service role manages service contexts" on service_contexts;
create policy "service role manages service contexts" on service_contexts for all to service_role using (true) with check (true);

drop policy if exists "service role manages service crosslinks" on service_crosslinks;
create policy "service role manages service crosslinks" on service_crosslinks for all to service_role using (true) with check (true);

drop policy if exists "service role manages company services" on company_services;
create policy "service role manages company services" on company_services for all to service_role using (true) with check (true);

drop policy if exists "service role manages company service activities" on company_service_activities;
create policy "service role manages company service activities" on company_service_activities for all to service_role using (true) with check (true);

drop policy if exists "service role manages company contexts" on company_contexts;
create policy "service role manages company contexts" on company_contexts for all to service_role using (true) with check (true);
