create table if not exists public.site_page_content (
  page_key text primary key check (page_key in ('home', 'prices', 'about')),
  draft_content jsonb not null default '{}'::jsonb,
  published_content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.site_page_content enable row level security;

revoke all privileges on public.site_page_content from anon, authenticated;
grant select, insert, update, delete on public.site_page_content to service_role;

insert into public.site_page_content (page_key)
values ('home'), ('prices'), ('about')
on conflict (page_key) do nothing;
