import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ClaimBadge } from "@/components/status-badge";
import { publicResultDescription } from "@/lib/company-display";
import { getPublicCompanies } from "@/lib/data/public-directory";
import { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd, jsonLd } from "@/lib/seo";
import { popularServicesForTrade } from "@/lib/service-taxonomy";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ ort: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ort } = await params;
  const location = displayLocation(ort);
  const companies = isSupabaseConfigured() ? await getPublicCompanies({ location }) : [];

  return {
    title: `Handwerker in ${location} finden | GewerkeListe.com`,
    description: `Finde Bau- und Handwerksbetriebe in ${location}. GewerkeListe.com ordnet Betriebe nach Gewerk, Leistung und Region.`,
    alternates: {
      canonical: `/orte/${ort}`,
    },
    robots: {
      index: companies.length > 0,
      follow: true,
    },
    openGraph: {
      title: `Bau- und Handwerksbetriebe in ${location}`,
      description: `Betriebe in ${location} nach Gewerk und Leistung strukturiert finden.`,
      url: `/orte/${ort}`,
      type: "website",
    },
  };
}

export default async function LocationPage({ params }: PageProps) {
  const { ort } = await params;
  const location = displayLocation(ort);
  const companies = isSupabaseConfigured() ? await getPublicCompanies({ location }) : [];

  if (!companies.length) notFound();

  const tradeLinks = tradeNames(companies).slice(0, 16);
  const serviceLinks = servicesForTrades(tradeLinks).slice(0, 16);
  const breadcrumb = breadcrumbJsonLd([
    { name: "Startseite", path: "/" },
    { name: "Orte", path: "/orte" },
    { name: location, path: `/orte/${ort}` },
  ]);
  const collectionPage = collectionPageJsonLd({
    name: `Bau- und Handwerksbetriebe in ${location}`,
    description: `Öffentlich gelistete Betriebe in ${location} nach Gewerk und Leistung.`,
    path: `/orte/${ort}`,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(itemList)} />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link className="hover:text-action" href="/">
            Startseite
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">{location}</span>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Regionale Gewerkesuche</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#07173d]">Handwerker in {location} finden</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
              Auf GewerkeListe.com findest du öffentlich gelistete Bau- und Handwerksbetriebe in {location}.
              Die Einträge sind nach Gewerk, Leistung und Region strukturiert, damit passende Ansprechpartner schneller sichtbar werden.
            </p>
          </div>

          <aside className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-[#07173d]">Gewerke in {location}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tradeLinks.map((trade) => (
                <Link
                  key={trade.slug}
                  className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-action hover:border-action"
                  href={`/gewerke/${trade.slug}/${ort}` as Route}
                >
                  {trade.name}
                </Link>
              ))}
            </div>
          </aside>
        </div>

        {serviceLinks.length ? (
          <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-[#07173d]">Häufige Leistungen in {location}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Diese Leistungsbegriffe stammen aus den Gewerken, für die in {location} öffentliche Betriebe sichtbar sind.
              Die konkrete Zuordnung wird erst über geprüfte Leistungsdaten indexierbar.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {serviceLinks.map((service) => (
                <Link
                  key={service.slug}
                  className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-action hover:border-action"
                  href={`/betriebe?ort=${ort}&leistung=${service.slug}&query=${encodeURIComponent(service.name)}` as Route}
                >
                  {service.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold text-[#07173d]">Betriebe in {location}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Verifiziert bedeutet nur: Betriebsdaten bestätigt, keine Qualitäts- oder Ausführungsgarantie.
              </p>
            </div>
            <span className="text-sm font-semibold text-muted">{companies.length} Betriebe</span>
          </div>

          <div className="divide-y divide-line">
            {companies.map((company) => {
              const description = publicResultDescription(company.description);
              return (
                <article key={company.id} className="py-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-[#07173d]">{company.name}</h3>
                        <ClaimBadge status={company.claim_status} />
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {company.trades?.name || "Gewerk"} · {company.postal_code} {company.city}
                      </p>
                      {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-ink">{description}</p> : null}
                    </div>
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
                      href={`/firma/${company.slug}` as Route}
                    >
                      Profil ansehen
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

function displayLocation(value: string) {
  return decodeURIComponent(value)
    .replace(/-/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function tradeNames(companies: Awaited<ReturnType<typeof getPublicCompanies>>) {
  const trades = new Map<string, { name: string; slug: string }>();
  for (const company of companies) {
    if (company.trades?.slug && company.trades.name) trades.set(company.trades.slug, company.trades);
    for (const match of company.company_trades || []) {
      if (match.trades?.slug && match.trades.name && match.visibility_level !== "internal" && match.status !== "rejected") {
        trades.set(match.trades.slug, match.trades);
      }
    }
  }
  return Array.from(trades.values()).sort((a, b) => a.name.localeCompare(b.name, "de"));
}

function servicesForTrades(trades: Array<{ slug: string }>) {
  const services = new Map<string, { name: string; slug: string }>();
  for (const trade of trades) {
    for (const service of popularServicesForTrade(trade.slug, 4)) {
      services.set(service.slug, { name: service.name, slug: service.slug });
    }
  }
  return Array.from(services.values()).sort((a, b) => a.name.localeCompare(b.name, "de"));
}
