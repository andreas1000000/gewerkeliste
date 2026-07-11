-- Additive compatibility patch for existing production trades table.
-- Required before applying 20260628001000_service_taxonomy.sql on databases
-- where the original trades table predates service taxonomy columns.

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
  add column if not exists trade_group_id uuid,
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists canonical_trade_id uuid;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'trades'
      and constraint_name = 'trades_trade_group_id_fkey'
  ) then
    alter table trades
      add constraint trades_trade_group_id_fkey
      foreign key (trade_group_id) references trade_groups(id) on delete set null;
  end if;

  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'trades'
      and constraint_name = 'trades_canonical_trade_id_fkey'
  ) then
    alter table trades
      add constraint trades_canonical_trade_id_fkey
      foreign key (canonical_trade_id) references trades(id) on delete set null;
  end if;
end $$;
