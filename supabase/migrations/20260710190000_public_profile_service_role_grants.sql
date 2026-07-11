revoke all privileges on
  trades,
  companies,
  company_trades,
  company_services,
  service_families,
  services,
  company_contacts,
  company_team_members,
  company_references,
  company_reference_media,
  company_certificates,
  company_social_links,
  company_profile_sections
from anon, authenticated;

grant select, insert, update, delete on
  trades,
  companies,
  company_trades,
  company_services,
  service_families,
  services,
  company_contacts,
  company_team_members,
  company_references,
  company_reference_media,
  company_certificates,
  company_social_links,
  company_profile_sections
to service_role;
