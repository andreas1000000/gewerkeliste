alter table company_submissions
  add column if not exists admin_notes text;

do $$
begin
  alter table company_submissions
    drop constraint if exists company_submissions_status_check;

  alter table company_submissions
    add constraint company_submissions_status_check
    check (status in ('submitted', 'in_review', 'needs_info', 'approved', 'rejected'));
end $$;
