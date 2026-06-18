create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  agent_name text not null,
  department text not null,
  objective text not null,
  mode text not null default 'dry_run' check (mode in ('dry_run', 'internal_write', 'approval_required', 'live')),
  status text not null default 'draft' check (status in ('draft', 'running', 'completed', 'failed', 'cancelled', 'blocked')),
  region_id uuid references regions(id) on delete set null,
  trade_id uuid references trades(id) on delete set null,
  dry_run boolean not null default true,
  risk_level text not null default 'medium',
  cost_center text,
  budget_limit numeric(10,4),
  estimated_cost numeric(10,4) not null default 0,
  actual_cost numeric(10,4) not null default 0,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_message text,
  created_by text,
  approved_by text,
  approved_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_runs_agent_idx on agent_runs(agent_id, created_at desc);
create index if not exists agent_runs_status_idx on agent_runs(status, created_at desc);
create index if not exists agent_runs_region_idx on agent_runs(region_id, created_at desc);

create table if not exists agent_run_steps (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references agent_runs(id) on delete cascade,
  step_key text not null,
  step_name text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'skipped', 'blocked')),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  confidence_score integer check (confidence_score is null or confidence_score between 0 and 100),
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agent_run_steps_run_idx on agent_run_steps(agent_run_id, created_at);

create table if not exists agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid references agent_runs(id) on delete cascade,
  agent_run_step_id uuid references agent_run_steps(id) on delete cascade,
  tool_class text not null,
  tool_name text not null,
  status text not null default 'completed' check (status in ('planned', 'completed', 'failed', 'blocked')),
  request_summary jsonb not null default '{}'::jsonb,
  response_summary jsonb not null default '{}'::jsonb,
  source_url text,
  source_type text,
  source_snapshot text,
  cost_estimate numeric(10,4) not null default 0,
  actual_cost numeric(10,4) not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists agent_tool_calls_run_idx on agent_tool_calls(agent_run_id, created_at desc);
create index if not exists agent_tool_calls_tool_idx on agent_tool_calls(tool_class, created_at desc);

create table if not exists agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid references agent_runs(id) on delete set null,
  agent_id text not null,
  title text not null,
  description text,
  task_type text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_for_approval', 'completed', 'cancelled')),
  region_id uuid references regions(id) on delete set null,
  trade_id uuid references trades(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  candidate_id uuid references company_candidates(id) on delete set null,
  confidence_score integer check (confidence_score is null or confidence_score between 0 and 100),
  source_url text,
  due_at timestamptz,
  created_by text,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_tasks_status_idx on agent_tasks(status, priority, created_at desc);
create index if not exists agent_tasks_region_trade_idx on agent_tasks(region_id, trade_id, status);

create table if not exists agent_approvals (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid references agent_runs(id) on delete set null,
  agent_task_id uuid references agent_tasks(id) on delete set null,
  agent_id text not null,
  action_type text not null,
  risk_level text not null default 'high',
  title text not null,
  description text,
  proposed_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'executed')),
  requested_by text,
  decided_by text,
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_approvals_status_idx on agent_approvals(status, created_at desc);

create table if not exists agent_review_items (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid references agent_runs(id) on delete set null,
  agent_id text not null,
  review_type text not null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'rejected')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  region_id uuid references regions(id) on delete set null,
  trade_id uuid references trades(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  candidate_id uuid references company_candidates(id) on delete set null,
  source_url text,
  source_type text,
  source_snapshot text,
  confidence_score integer check (confidence_score is null or confidence_score between 0 and 100),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_review_items_status_idx on agent_review_items(status, severity, created_at desc);

create table if not exists agent_outbox (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid references agent_runs(id) on delete set null,
  agent_id text not null,
  channel text not null default 'email',
  recipient text,
  subject text,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'queued', 'sent', 'cancelled', 'failed')),
  company_id uuid references companies(id) on delete set null,
  candidate_id uuid references company_candidates(id) on delete set null,
  requires_approval boolean not null default true,
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_outbox_status_idx on agent_outbox(status, created_at desc);

create table if not exists agent_lessons (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  lesson_type text not null,
  title text not null,
  body text not null,
  source_run_id uuid references agent_runs(id) on delete set null,
  confidence_score integer check (confidence_score is null or confidence_score between 0 and 100),
  status text not null default 'active' check (status in ('draft', 'active', 'deprecated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_lessons_agent_idx on agent_lessons(agent_id, status, created_at desc);

create table if not exists agent_cost_events (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid references agent_runs(id) on delete set null,
  agent_id text not null,
  cost_center text not null,
  provider text,
  tool_name text,
  region_id uuid references regions(id) on delete set null,
  trade_id uuid references trades(id) on delete set null,
  estimated_cost numeric(10,4) not null default 0,
  actual_cost numeric(10,4) not null default 0,
  currency text not null default 'EUR',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_cost_events_agent_idx on agent_cost_events(agent_id, created_at desc);
create index if not exists agent_cost_events_cost_center_idx on agent_cost_events(cost_center, created_at desc);

drop trigger if exists agent_runs_updated_at on agent_runs;
create trigger agent_runs_updated_at
before update on agent_runs
for each row execute function set_updated_at();

drop trigger if exists agent_tasks_updated_at on agent_tasks;
create trigger agent_tasks_updated_at
before update on agent_tasks
for each row execute function set_updated_at();

drop trigger if exists agent_approvals_updated_at on agent_approvals;
create trigger agent_approvals_updated_at
before update on agent_approvals
for each row execute function set_updated_at();

drop trigger if exists agent_review_items_updated_at on agent_review_items;
create trigger agent_review_items_updated_at
before update on agent_review_items
for each row execute function set_updated_at();

drop trigger if exists agent_outbox_updated_at on agent_outbox;
create trigger agent_outbox_updated_at
before update on agent_outbox
for each row execute function set_updated_at();

drop trigger if exists agent_lessons_updated_at on agent_lessons;
create trigger agent_lessons_updated_at
before update on agent_lessons
for each row execute function set_updated_at();

alter table agent_runs enable row level security;
alter table agent_run_steps enable row level security;
alter table agent_tool_calls enable row level security;
alter table agent_tasks enable row level security;
alter table agent_approvals enable row level security;
alter table agent_review_items enable row level security;
alter table agent_outbox enable row level security;
alter table agent_lessons enable row level security;
alter table agent_cost_events enable row level security;

drop policy if exists "service role manages agent runs" on agent_runs;
create policy "service role manages agent runs"
on agent_runs for all to service_role using (true) with check (true);

drop policy if exists "service role manages agent run steps" on agent_run_steps;
create policy "service role manages agent run steps"
on agent_run_steps for all to service_role using (true) with check (true);

drop policy if exists "service role manages agent tool calls" on agent_tool_calls;
create policy "service role manages agent tool calls"
on agent_tool_calls for all to service_role using (true) with check (true);

drop policy if exists "service role manages agent tasks" on agent_tasks;
create policy "service role manages agent tasks"
on agent_tasks for all to service_role using (true) with check (true);

drop policy if exists "service role manages agent approvals" on agent_approvals;
create policy "service role manages agent approvals"
on agent_approvals for all to service_role using (true) with check (true);

drop policy if exists "service role manages agent review items" on agent_review_items;
create policy "service role manages agent review items"
on agent_review_items for all to service_role using (true) with check (true);

drop policy if exists "service role manages agent outbox" on agent_outbox;
create policy "service role manages agent outbox"
on agent_outbox for all to service_role using (true) with check (true);

drop policy if exists "service role manages agent lessons" on agent_lessons;
create policy "service role manages agent lessons"
on agent_lessons for all to service_role using (true) with check (true);

drop policy if exists "service role manages agent cost events" on agent_cost_events;
create policy "service role manages agent cost events"
on agent_cost_events for all to service_role using (true) with check (true);

grant usage on schema public to service_role;
grant select, insert, update, delete on
  agent_runs,
  agent_run_steps,
  agent_tool_calls,
  agent_tasks,
  agent_approvals,
  agent_review_items,
  agent_outbox,
  agent_lessons,
  agent_cost_events
to service_role;

grant select on
  regions,
  trades,
  companies,
  company_trades,
  company_candidates,
  coverage_snapshots
to service_role;
