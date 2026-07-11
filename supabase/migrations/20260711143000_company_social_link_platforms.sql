do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_social_links_platform_check'
      and conrelid = 'company_social_links'::regclass
  ) then
    alter table company_social_links
      add constraint company_social_links_platform_check
      check (
        lower(platform) in (
          'instagram',
          'whatsapp',
          'facebook',
          'linkedin',
          'tiktok',
          'youtube',
          'x',
          'pinterest',
          'xing'
        )
      ) not valid;
  end if;
end $$;

create index if not exists company_social_links_company_platform_status_idx
on company_social_links(company_id, lower(platform), review_status, sort_order);
