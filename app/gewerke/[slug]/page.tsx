import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ClaimBadge } from "@/components/status-badge";
import { publicResultDescription, publicResultImage } from "@/lib/company-display";
import { getPublicCompaniesByTrade } from "@/lib/data/public-directory";
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

  return {
    title: trade.seoTitle,
    description: trade.seoDescription,
  };
}

export default async function TradeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const trade = findTrade(slug);

  if (!trade) notFound();
  const companies = isSupabaseConfigured() ? await getPublicCompaniesByTrade(trade.slug) : [];

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
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
                href={`/suche?gewerk=${encodeURIComponent(trade.slug)}` as Route}
              >
                Fachbetrieb suchen
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
            <form action="/suche" className="mt-5 grid gap-3">
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

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold text-[#07173d]">Öffentlich gelistete Betriebe</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Zuordnung über bestätigte oder öffentlich erkennbare Gewerkesignale. Verifiziert bedeutet nur: Betriebsdaten bestätigt.
              </p>
            </div>
            <span className="text-sm font-semibold text-muted">{companies.length > 0 ? `${companies.length} Betriebe` : "Betriebe finden"}</span>
          </div>
          <div className="divide-y divide-line">
            {companies.length > 0 ? (
              companies.map((company) => {
                const description = publicResultDescription(company.description);
                const imageUrl = publicResultImage(company);

                return (
                  <article key={company.id} className="py-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="flex min-w-0 gap-4">
                        {imageUrl ? (
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-[#fbfcff]">
                            <img
                              alt={`${company.name} Profilbild`}
                              className="h-full w-full object-cover"
                              src={imageUrl}
                            />
                          </div>
                        ) : null}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-[#07173d]">{company.name}</h3>
                            {company.verified ? (
                              <span className="rounded-md border border-[#b9e2c2] bg-[#effaf2] px-2.5 py-1 text-xs font-semibold text-[#1f6b3d]">
                                Betriebsdaten bestätigt
                              </span>
                            ) : (
                              <span className="rounded-md border border-line bg-[#fbfcff] px-2.5 py-1 text-xs font-semibold text-muted">
                                unbestätigt
                              </span>
                            )}
                            <ClaimBadge status={company.claim_status} />
                          </div>
                          <p className="mt-2 text-sm text-muted">
                            {company.postal_code} {company.city}
                          </p>
                          {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-ink">{description}</p> : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-md border border-line bg-white px-2.5 py-1 text-xs text-muted">{trade.name}</span>
                            {company.trades?.name && company.trades.slug !== trade.slug ? (
                              <span className="rounded-md border border-line bg-white px-2.5 py-1 text-xs text-muted">{company.trades.name}</span>
                            ) : null}
                            {tradeMatchFor(company)?.confidence_score ? (
                              <span className="rounded-md border border-line bg-white px-2.5 py-1 text-xs text-muted">
                                Score {tradeMatchFor(company)?.confidence_score}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {company.phone ? (
                          <a className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action" href={`tel:${company.phone}`}>
                            Anrufen
                          </a>
                        ) : null}
                        {company.website_url ? (
                          <a className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action" href={company.website_url} rel="nofollow noopener noreferrer" target="_blank">
                            Website
                          </a>
                        ) : null}
                        <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href={`/firma/${company.slug}` as Route}>
                          Profil ansehen
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyCompanies trade={trade} />
            )}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-[#07173d]">Worauf Auftraggeber achten sollten</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <InfoCard title="Leistungsprofil" text="Passt die konkrete Leistung zum Bauvorhaben und zum Bestand?" />
            <InfoCard title="Tätigkeitsgebiet" text="Ist der Betrieb in der gesuchten Region regelmäßig tätig?" />
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
            Fachbetriebe können Leistungen, Tätigkeitsgebiet und Betriebsdaten strukturiert zur Prüfung einreichen.
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

function EmptyCompanies({ trade }: { trade: TaxonomyTrade }) {
  return (
    <div className="py-8 text-center">
      <h3 className="text-xl font-semibold text-[#07173d]">Für dieses Gewerk sind noch keine Betriebe öffentlich gelistet.</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
        Suche erweitern oder einen passenden Betrieb vorschlagen.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href="/betrieb-eintragen">
          Betrieb vorschlagen
        </Link>
        <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action" href={`/suche?gewerk=${trade.slug}&umkreis=100` as Route}>
          Umkreis erweitern
        </Link>
      </div>
    </div>
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

function tradeMatchFor(company: unknown) {
  return (company as { trade_match?: { confidence_score: number; source: string; evidence: string | null } }).trade_match;
}

function findTrade(slug: string): TaxonomyTrade | undefined {
  return findTaxonomyTrade(canonicalTradeSlug(slug));
}

function findRelatedTrade(value: string): TaxonomyTrade | undefined {
  return findTaxonomyTrade(value);
}
