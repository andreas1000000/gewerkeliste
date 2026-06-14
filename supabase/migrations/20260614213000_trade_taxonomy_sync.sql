alter table company_trades
  add column if not exists status text not null default 'agent_suggested'
  check (status in ('agent_suggested', 'user_confirmed', 'admin_confirmed', 'rejected'));

create index if not exists company_trades_status_idx on company_trades(status, confidence_score desc);

create table if not exists trade_slug_aliases (
  id uuid primary key default gen_random_uuid(),
  old_slug text not null unique,
  new_slug text not null,
  trade_id uuid references trades(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists trade_slug_aliases_new_slug_idx on trade_slug_aliases(new_slug);

alter table trade_slug_aliases enable row level security;

drop policy if exists "service role manages trade slug aliases" on trade_slug_aliases;
create policy "service role manages trade slug aliases"
on trade_slug_aliases for all
to service_role
using (true)
with check (true);
