import { siteConfig } from "./site-config.ts";
import { normalizePublicExternalUrl, publicJsonLdSocialUrls } from "./public-profile-rules.ts";
import { publicJsonLdMediaUrl } from "./public-profile-seo.ts";
import type { PublicCompanyWithTrade } from "./types/public-directory.ts";

export function siteUrl(path = "/") {
  const base = siteConfig.url.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function jsonLd(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: siteUrl(item.path),
    })),
  };
}

export function collectionPageJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: siteUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteUrl("/"),
    },
  };
}

export function localBusinessJsonLd(company: PublicCompanyWithTrade, path: string, description?: string) {
  const logo = publicJsonLdMediaUrl(company.logo_url);
  const profileImage = publicJsonLdMediaUrl(company.profile_image_url);
  const website = normalizePublicExternalUrl(company.website_url);
  const services = (company.company_services || [])
    .filter((match) => match.status === "confirmed" && Boolean(match.services?.name))
    .map((match) => match.services?.name)
    .filter((value): value is string => Boolean(value));
  const tradeNames = [
    ...(company.company_trades || [])
      .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal" && Boolean(match.trades?.name))
      .map((match) => match.trades?.name),
    company.trades?.name,
  ].filter((value): value is string => Boolean(value));
  const sameAs = publicJsonLdSocialUrls(company.premium_profile?.socialLinks);

  const address = {
    "@type": "PostalAddress",
    streetAddress: company.street || undefined,
    postalCode: company.postal_code || undefined,
    addressLocality: company.city || undefined,
    addressCountry: "DE",
  };

  return removeUndefined({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.name,
    url: website || siteUrl(path),
    mainEntityOfPage: siteUrl(path),
    description: description || undefined,
    telephone: company.phone || undefined,
    email: company.email || undefined,
    contactPoint: jsonLdContactPoint(company),
    image: profileImage || logo,
    logo,
    address,
    areaServed: jsonLdAreas(company),
    knowsAbout: tradeNames.length ? Array.from(new Set(tradeNames)) : undefined,
    serviceType: services.length ? Array.from(new Set(services)) : tradeNames.length ? Array.from(new Set(tradeNames)) : undefined,
    sameAs: sameAs.length ? Array.from(new Set(sameAs)) : undefined,
  });
}

function jsonLdAreas(company: PublicCompanyWithTrade) {
  const areas = [
    ...(Array.isArray(company.service_regions) ? company.service_regions : []),
    ...(Array.isArray(company.service_countries) ? company.service_countries : []),
  ]
    .map((item) => String(item).trim())
    .filter(Boolean);

  if (areas.length) {
    return Array.from(new Set(areas)).map((name) => ({
      "@type": "AdministrativeArea",
      name,
    }));
  }

  return company.city
    ? {
        "@type": "AdministrativeArea",
        name: company.city,
      }
    : undefined;
}

function jsonLdContactPoint(company: PublicCompanyWithTrade) {
  if (!company.phone && !company.email) return undefined;

  return {
    "@type": "ContactPoint",
    telephone: company.phone || undefined,
    email: company.email || undefined,
    contactType: "customer service",
    areaServed: "DE",
    availableLanguage: ["de"],
  };
}

function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(removeUndefined).filter((item) => item !== undefined) as T;
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined && item !== null && item !== "")
      .map(([key, item]) => [key, removeUndefined(item)]),
  ) as T;
}
