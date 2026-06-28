import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getPublicCompanies } from "@/lib/data/public-directory";
import { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd, jsonLd } from "@/lib/seo";
import { popularServicesForTrade } from "@/lib/service-taxonomy";
import { isSupabaseConfigured } from "@/lib/supabase";
import { canonicalTradeSlug, findTaxonomyTrade, type TaxonomyTrade } from "@/lib/trade-taxonomy";

type PageProps = {
  params: Promise<{ slug: string; ort: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, ort } = await params;
  const trade = findTrade(slug);
  const location = displayLocation(ort);

  if (!trade) {
    return { title: "Gewerk nicht gefunden | GewerkeListe.com" };
  }
  const companies = isSupabaseConfigured() ? await getPublicCompanies({ tradeSlug: trade.slug, location }) : [];
  const hasCompanies = companies.length > 0;

  return {
    title: `${trade.name} in ${location} finden | GewerkeListe.com`,
    description: `Finden Sie passende Betriebe für ${trade.name} in ${location} und Umgebung. Strukturiert nach Leistungen, Region und Unternehmensprofil.`,
    alternates: {
      canonical: `/gewerke/${trade.slug}/${ort}`,
    },
    robots: {
      index: hasCompanies,
      follow: true,
    },
    openGraph: {
      title: `${trade.name} in ${location} | GewerkeListe.com`,
      description: `Betriebe für ${trade.name} in ${location} strukturiert finden.`,
      url: `/gewerke/${trade.slug}/${ort}`,
      type: "website",
    },
  };
}

export default async function TradeLocationPage({ params }: PageProps) {
  const { slug, ort } = await params;
  const trade = findTrade(slug);
  const location = displayLocation(ort);

  if (!trade) notFound();

  const companies = isSupabaseConfigured() ? await getPublicCompanies({ tradeSlug: trade.slug, location }) : [];
  const typicalServices = popularServicesForTrade(trade.slug, 10);
  const breadcrumb = breadcrumbJsonLd([
    { name: "Startseite", path: "/" },
    { name: "Gewerke", path: "/gewerke" },
    { name: trade.name, path: `/gewerke/${trade.slug}` },
    { name: location, path: `/gewerke/${trade.slug}/${ort}` },
  ]);
  const collectionPage = collectionPageJsonLd({
    name: `${trade.name} in ${location} finden`,
    description: `Regionale Suche nach ${trade.name} in ${location}.`,
    path: `/gewerke/${trade.slug}/${ort}`,
  });
  const itemList = itemListJsonLd(
    companies.slice(0, 50).map((company) => ({
      name: company.name,
      path: `/firma/${company.slug}`,
    })),
  );

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumb)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(collectionPage)} />
      {companies.length ? <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(itemList)} /> : null}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="text-sm text-muted">
          <Link className="hover:text-action" href="/">
            Startseite
          </Link>
          <span className="mx-2">/</span>
          <Link className="hover:text-action" href="/gewerke">
            Gewerke
          </Link>
          <span className="mx-2">/</span>
          <Link className="hover:text-action" href={`/gewerke/${trade.slug}` as Route}>
            {trade.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">{location}</span>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">{trade.category}</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#07173d]">
              {trade.name} in {location} finden
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
              Regionale Suche nach {trade.name} mit Bezug zu Leistung, Standort und Wirkungskreis. Die Einträge zeigen,
              ob Betriebsdaten bereits bestätigt wurden und wie der Betrieb erreichbar ist. Datenbestätigung bedeutet
              keine Qualitäts- oder Ausführungsgarantie.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href={searchHref(trade.slug, location) as Route}>
                Betriebe finden
              </Link>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href="/eintrag-beanspruchen">
                Eintrag beanspruchen
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-[#07173d]">Suchkontext</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <dt className="font-semibold text-muted">Gewerk</dt>
                <dd className="text-ink">{trade.name}</dd>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <dt className="font-semibold text-muted">Ort / PLZ</dt>
                <dd className="text-ink">{location}</dd>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <dt className="font-semibold text-muted">Treffer</dt>
                <dd className="text-ink">{companies.length > 0 ? `${companies.length} Betriebe` : "Betriebe finden"}</dd>
              </div>
            </dl>
          </aside>
        </div>

        {typicalServices.length > 0 ? (
          <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-[#07173d]">Typische Leistungen für {trade.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Diese Begriffe helfen bei der Einordnung. Ob ein Betrieb eine konkrete Leistung anbietet, steht im
              jeweiligen Profil oder wird vom Betrieb ergänzt.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {typicalServices.map((service) => (
                <Link
                  key={service.slug}
                  className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-medium text-ink hover:border-action hover:text-action"
                  href={`/suche?gewerk=${trade.slug}&ort=${encodeURIComponent(location)}&q=${encodeURIComponent(service.name)}` as Route}
                >
                  {service.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          {companies.length > 0 ? (
            companies.map((company) => (
              <Link key={company.id} className="block border-b border-line px-5 py-4 last:border-b-0 hover:bg-[#fbfcff]" href={`/firma/${company.slug}` as Route}>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-[#07173d]">{company.name}</h2>
                      {company.verified ? (
                        <span className="rounded-md border border-[#b9e2c2] bg-[#effaf2] px-2.5 py-1 text-xs font-semibold text-[#1f6b3d]">
                          Daten bestätigt
                        </span>
                      ) : (
                        <span className="rounded-md border border-line bg-[#fbfcff] px-2.5 py-1 text-xs font-semibold text-muted">
                          Basisprofil
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {company.postal_code} {company.city}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-action">Profil ansehen</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold text-[#07173d]">Noch keine passenden Betriebseinträge sichtbar</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
                Für dieses Gewerk sind in dieser Region noch keine Betriebe öffentlich gelistet. Sie können die Suche
                erweitern, einen Betrieb vorschlagen oder einen Betrieb kostenlos eintragen.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href={searchHref(trade.slug, location) as Route}>
                  Suche im Umkreis erweitern
                </Link>
                <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action" href="/betrieb-eintragen">
                  Betrieb kostenlos eintragen
                </Link>
                <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action" href="/gewerke">
                  Ähnliche Gewerke ansehen
                </Link>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function findTrade(slug: string): TaxonomyTrade | undefined {
  return findTaxonomyTrade(canonicalTradeSlug(slug));
}

function displayLocation(value: string) {
  return decodeURIComponent(value)
    .replace(/-/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function searchHref(slug: string, location: string) {
  const params = new URLSearchParams({ gewerk: slug, ort: location });
  return `/suche?${params.toString()}`;
}
