import { siteConfig } from "@/lib/site-config";
import type { PublicCompanyWithTrade } from "@/lib/types/public-directory";

export function siteUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(/\/+$/, "");
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
  const tradeNames = [
    ...(company.company_trades || [])
      .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal" && Boolean(match.trades?.name))
      .map((match) => match.trades?.name),
    company.trades?.name,
  ].filter((value): value is string => Boolean(value));

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
    url: siteUrl(path),
    description: description || undefined,
    telephone: company.phone || undefined,
    email: company.email || undefined,
    image: company.profile_image_url || company.logo_url || undefined,
    logo: company.logo_url || undefined,
    address,
    areaServed: company.city
      ? {
          "@type": "AdministrativeArea",
          name: company.city,
        }
      : undefined,
    knowsAbout: tradeNames.length ? Array.from(new Set(tradeNames)) : undefined,
    serviceType: tradeNames.length ? Array.from(new Set(tradeNames)) : undefined,
    sameAs: company.website_url || undefined,
  });
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
