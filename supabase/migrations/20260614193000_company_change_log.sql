create table if not exists company_change_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  action text not null,
  field_name text,
  old_value text,
  new_value text,
  confidence_score integer check (confidence_score is null or confidence_score between 0 and 100),
  source_url text,
  created_by text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists company_change_log_company_idx on company_change_log(company_id, created_at desc);
create index if not exists company_change_log_action_idx on company_change_log(action, created_at desc);

alter table company_change_log enable row level security;

drop policy if exists "service role manages company change log" on company_change_log;
create policy "service role manages company change log"
on company_change_log for all
to service_role
using (true)
with check (true);
