create table if not exists company_trades (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  trade_id uuid not null references trades(id) on delete cascade,
  confidence_score integer not null check (confidence_score between 0 and 100),
  source text not null default 'mapping-script',
  evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, trade_id)
);

create index if not exists company_trades_company_idx on company_trades(company_id);
create index if not exists company_trades_trade_idx on company_trades(trade_id);
create index if not exists company_trades_score_idx on company_trades(confidence_score desc);

create table if not exists trade_synonyms (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades(id) on delete cascade,
  synonym text not null,
  weight integer not null default 70 check (weight between 0 and 100),
  source text not null default 'taxonomy',
  created_at timestamptz not null default now(),
  unique (trade_id, synonym)
);

create index if not exists trade_synonyms_trade_idx on trade_synonyms(trade_id);
create index if not exists trade_synonyms_synonym_idx on trade_synonyms(synonym);

create table if not exists company_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  source_type text not null default 'public',
  source_url text,
  title text,
  snippet text,
  content text,
  created_at timestamptz not null default now()
);

create index if not exists company_sources_company_idx on company_sources(company_id);

create table if not exists company_trade_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  trade_id uuid not null references trades(id) on delete cascade,
  confidence_score integer not null check (confidence_score between 0 and 100),
  source text not null default 'mapping-script',
  evidence text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, trade_id)
);

create index if not exists company_trade_reviews_status_idx on company_trade_reviews(status, confidence_score desc);
create index if not exists company_trade_reviews_company_idx on company_trade_reviews(company_id);
create index if not exists company_trade_reviews_trade_idx on company_trade_reviews(trade_id);

drop trigger if exists company_trades_updated_at on company_trades;
create trigger company_trades_updated_at
before update on company_trades
for each row execute function set_updated_at();

drop trigger if exists company_trade_reviews_updated_at on company_trade_reviews;
create trigger company_trade_reviews_updated_at
before update on company_trade_reviews
for each row execute function set_updated_at();

alter table company_trades enable row level security;
alter table trade_synonyms enable row level security;
alter table company_sources enable row level security;
alter table company_trade_reviews enable row level security;

drop policy if exists "service role manages company trades" on company_trades;
create policy "service role manages company trades"
on company_trades for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages trade synonyms" on trade_synonyms;
create policy "service role manages trade synonyms"
on trade_synonyms for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages company sources" on company_sources;
create policy "service role manages company sources"
on company_sources for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages company trade reviews" on company_trade_reviews;
create policy "service role manages company trade reviews"
on company_trade_reviews for all
to service_role
using (true)
with check (true);
