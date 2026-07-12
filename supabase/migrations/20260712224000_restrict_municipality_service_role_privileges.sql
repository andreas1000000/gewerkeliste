begin;

revoke all on table
  municipalities,
  company_submission_service_areas,
  company_service_areas
from public, anon, authenticated, service_role;

grant select, insert, update, delete on
  municipalities,
  company_submission_service_areas,
  company_service_areas
to service_role;

commit;
