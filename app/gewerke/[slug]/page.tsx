import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getPublicCompaniesByTrade } from "@/lib/data/public-directory";
import { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd, jsonLd } from "@/lib/seo";
import { popularServicesForTrade } from "@/lib/service-taxonomy";
import { isSupabaseConfigured } from "@/lib/supabase";
import { canonicalTradeSlug, findTaxonomyTrade, tradeTaxonomy, type TaxonomyTrade } from "@/lib/trade-taxonomy";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const exampleTradeSlugs = new Set(["maurerarbeiten", "pflasterbau", "bauwerksabdichtung", "metallbau"]);

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trade = findTrade(slug);

  if (!trade) {
    return {
      title: "Gewerk nicht gefunden | GewerkeListe.com",
    };
  }
  const companies = isSupabaseConfigured() ? await getPublicCompaniesByTrade(trade.slug) : [];
  const hasCompanies = companies.length > 0;

  return {
    title: `${trade.name}: Betriebe, Leistungen & Regionen | GewerkeListe.com`,
    description: `Finden Sie Betriebe aus dem Bereich ${trade.name}. GewerkeListe.com macht Bau- und Handwerksbetriebe strukturiert auffindbar.`,
    alternates: {
      canonical: `/gewerke/${trade.slug}`,
    },
    robots: {
      index: hasCompanies,
      follow: true,
    },
    openGraph: {
      title: `${trade.name} finden | GewerkeListe.com`,
      description: trade.shortDescription,
      url: `/gewerke/${trade.slug}`,
      type: "website",
    },
  };
}

export default async function TradeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const trade = findTrade(slug);

  if (!trade) notFound();
  const companies = isSupabaseConfigured() ? await getPublicCompaniesByTrade(trade.slug) : [];
  const typicalServices = popularServicesForTrade(trade.slug, 12);
  const breadcrumb = breadcrumbJsonLd([
    { name: "Startseite", path: "/" },
    { name: "Gewerke", path: "/gewerke" },
    { name: trade.name, path: `/gewerke/${trade.slug}` },
  ]);
  const collectionPage = collectionPageJsonLd({
    name: `${trade.name} Fachbetriebe finden`,
    description: trade.shortDescription,
    path: `/gewerke/${trade.slug}`,
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
          <Link className="hover:text-[#1f5fd4]" href="/">
            Startseite
          </Link>
          <span className="mx-2">/</span>
          <Link className="hover:text-[#1f5fd4]" href="/gewerke">
            Gewerke
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">{trade.name}</span>
        </nav>

        {exampleTradeSlugs.has(trade.slug) ? (
          <div className="mt-6 rounded-lg border border-[#bde7cc] bg-[#f1fbf5] p-4 text-sm leading-6 text-[#24523a]">
            <span className="font-semibold">Mustergewerk – Darstellungsvorschau.</span> Diese Inhalte zeigen
            beispielhaft, wie Gewerke auf GewerkeListe.com strukturiert werden.
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">{trade.category}</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#07173d]">{headlineForTrade(trade)}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted">{trade.shortDescription}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1f5fd4] px-5 text-sm font-semibold text-white hover:bg-[#174eb2]"
                href={`/betriebe?gewerk=${encodeURIComponent(trade.slug)}` as Route}
              >
                Betriebe in meiner Region suchen
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-[#1f5fd4] hover:border-[#1f5fd4]"
                href="/betrieb-eintragen"
              >
                Betrieb eintragen
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-[#07173d]">Fachbetrieb suchen</h2>
            <form action="/betriebe" className="mt-5 grid gap-3">
              <input name="gewerk" type="hidden" value={trade.slug} />
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Ort oder PLZ
                <input className="h-11 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-[#1f5fd4]" name="ort" placeholder="Ort oder PLZ" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Umkreis
                <select className="h-11 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-[#1f5fd4]" name="umkreis" defaultValue="50">
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                </select>
              </label>
              <button className="h-11 rounded-md bg-[#1f5fd4] px-4 text-sm font-semibold text-white hover:bg-[#174eb2]">
                Fachbetrieb suchen
              </button>
            </form>
          </aside>
        </div>

        {typicalServices.length > 0 ? (
          <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-[#07173d]">Typische Leistungen in diesem Gewerk</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Typische Leistungsbegriffe in diesem Gewerk sind unter anderem die folgenden. Nicht jeder Betrieb bietet
              jede Leistung an; maßgeblich ist das jeweilige Betriebsprofil.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {typicalServices.map((service) => (
                <Link
                  key={service.slug}
                  className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-medium text-ink hover:border-action hover:text-action"
                  href={`/betriebe?gewerk=${trade.slug}&leistung=${service.slug}&query=${encodeURIComponent(service.name)}` as Route}
                >
                  {service.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-[#07173d]">Betriebe in diesem Gewerk anzeigen</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                Die Ergebnisliste wird zentral unter „Betriebe“ geführt. Dort können Sie zusätzlich nach Ort,
                Leistung, Spezialisierung oder Firmenname filtern.
              </p>
              <p className="mt-3 text-sm font-semibold text-muted">
                {companies.length > 0 ? `${companies.length} passende Betriebe aktuell sichtbar` : "Noch keine passenden Betriebe sichtbar"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 sm:justify-end">
              <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href={`/betriebe?gewerk=${trade.slug}` as Route}>
                Betriebe anzeigen
              </Link>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href="/betrieb-eintragen">
                Betrieb vorschlagen
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-[#07173d]">Worauf Auftraggeber achten sollten</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <InfoCard title="Leistungsprofil" text="Passt die konkrete Leistung zum Bauvorhaben und zum Bestand?" />
            <InfoCard title="Wirkungskreis" text="Ist der Betrieb in der gesuchten Region fachlich und organisatorisch sinnvoll einzuordnen?" />
            <InfoCard title="Betriebsangaben" text="Sind Kontaktwege, Standort und Verifizierungsstatus nachvollziehbar?" />
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-[#07173d]">Verwandte Gewerke</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {trade.relatedTrades.map((relatedTrade) => {
              const related = findRelatedTrade(relatedTrade);
              return (
                <Link
                  key={relatedTrade}
                  className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm text-muted hover:border-[#1f5fd4] hover:text-[#1f5fd4]"
                  href={related ? (`/gewerke/${related.slug}` as Route) : ("/gewerke" as Route)}
                >
                  {related?.name || relatedTrade}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 text-center shadow-soft">
          <h2 className="text-2xl font-semibold text-[#07173d]">Eigenen Betrieb für dieses Gewerk eintragen</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Fachbetriebe können ihr vollständiges Leistungsspektrum, ihren Wirkungskreis und ihre Betriebsdaten
            strukturiert zur Prüfung einreichen.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1f5fd4] px-5 text-sm font-semibold text-white hover:bg-[#174eb2]" href="/betrieb-eintragen">
              Eigenen Betrieb eintragen
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-[#1f5fd4] hover:border-[#1f5fd4]" href="/eintrag-beanspruchen">
              Eintrag beanspruchen
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function headlineForTrade(trade: TaxonomyTrade) {
  if (trade.slug === "maurerarbeiten") return "Maurerbetriebe finden";
  if (trade.slug === "pflasterbau") return "Pflasterbaubetriebe finden";
  if (trade.slug === "bauwerksabdichtung") return "Fachbetriebe für Bauwerksabdichtung finden";
  if (trade.slug === "metallbau") return "Metallbaubetriebe finden";
  return `${trade.name} Fachbetriebe finden`;
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfcff] p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

function findTrade(slug: string): TaxonomyTrade | undefined {
  return findTaxonomyTrade(canonicalTradeSlug(slug));
}

function findRelatedTrade(value: string): TaxonomyTrade | undefined {
  return findTaxonomyTrade(value);
}
