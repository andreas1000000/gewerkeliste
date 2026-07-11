alter table company_trades
  add column if not exists visibility_level text not null default 'basis_public';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_trades_visibility_level_check'
      and conrelid = 'company_trades'::regclass
  ) then
    alter table company_trades
      add constraint company_trades_visibility_level_check
      check (visibility_level in ('basis_public', 'verified_public', 'premium_public', 'internal'));
  end if;
end $$;

create index if not exists company_trades_visibility_level_idx
on company_trades(visibility_level);

alter table companies
  add column if not exists service_countries text[] not null default '{}';
