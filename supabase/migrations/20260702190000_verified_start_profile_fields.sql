alter table companies
  add column if not exists service_radius_km integer,
  add column if not exists service_regions text[] not null default '{}',
  add column if not exists service_postal_codes text[] not null default '{}',
  add column if not exists references_text text,
  add column if not exists memberships text[] not null default '{}',
  add column if not exists certificates text[] not null default '{}',
  add column if not exists manufacturer_certificates text[] not null default '{}';

create index if not exists companies_service_regions_idx on companies using gin(service_regions);
create index if not exists companies_service_postal_codes_idx on companies using gin(service_postal_codes);
