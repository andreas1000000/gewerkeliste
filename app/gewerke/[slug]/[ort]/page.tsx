import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getPublicCompanies } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { tradeTaxonomy, type TaxonomyTrade } from "@/lib/trade-taxonomy";

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

  return {
    title: `${trade.name} in ${location} finden | GewerkeListe.com`,
    description: `${trade.name}: Fachbetriebe und Betriebseinträge in ${location} nach Leistung, Standort und Tätigkeitsgebiet finden.`,
  };
}

export default async function TradeLocationPage({ params }: PageProps) {
  const { slug, ort } = await params;
  const trade = findTrade(slug);
  const location = displayLocation(ort);

  if (!trade) notFound();

  const companies = isSupabaseConfigured() ? await getPublicCompanies({ tradeSlug: trade.slug, location }) : [];

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
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
              {trade.name} in {location}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
              Regionale Suche nach {trade.name} mit Bezug zu Leistung, Standort und Tätigkeitsgebiet. Die Einträge
              zeigen, ob Betriebsdaten bereits bestätigt wurden und wie der Betrieb erreichbar ist.
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

        <section className="mt-8 overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          {companies.length > 0 ? (
            companies.map((company) => (
              <Link key={company.id} className="block border-b border-line px-5 py-4 last:border-b-0 hover:bg-[#fbfcff]" href={`/firma/${company.slug}` as Route}>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-[#07173d]">{company.name}</h2>
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
                Die Betriebssuche kann trotzdem genutzt werden, um nach ähnlichen Gewerken oder angrenzenden Orten zu
                suchen.
              </p>
              <Link className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href={searchHref(trade.slug, location) as Route}>
                Zur Betriebssuche
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function findTrade(slug: string): TaxonomyTrade | undefined {
  return tradeTaxonomy.find((trade) => trade.slug === slug);
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
