import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { SiteHeader } from "@/components/site-header";
import { ClaimBadge } from "@/components/status-badge";
import { publicResultDescription, publicResultImage } from "@/lib/company-display";
import { getPublicCompanies } from "@/lib/data/public-directory";
import { createTradeSearchEntry, normalizeSearchTerm, rankTradeEntries } from "@/lib/trade-search";
import { isSupabaseConfigured } from "@/lib/supabase";
import { canonicalTradeSlug, publicTradeTaxonomy } from "@/lib/trade-taxonomy";
import type { PublicCompanyWithTrade } from "@/lib/types/public-directory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fachbetriebe suchen | GewerkeListe.com",
  description: "Betriebseinträge nach Gewerk, Leistung, Ort oder PLZ im Gewerkeregister suchen.",
  robots: {
    index: false,
    follow: true,
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = stringParam(params.q);
  const trade = stringParam(params.gewerk);
  const selectedTrades = stringArrayParam(params.trades).map(canonicalTradeSlug);
  const location = stringParam(params.ort);
  const radiusKm = stringParam(params.umkreis) || "50";
  const tradeOptions = publicTradeTaxonomy()
    .filter((item) => item.isActive !== false)
    .map((item) => ({ key: item.slug, slug: item.slug, name: item.name, category: item.category }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
  const selectedTrade = tradeOptions.some((item) => item.slug === trade) ? trade : undefined;
  const selectedTradeSet = selectedTrades.filter((slug) => tradeOptions.some((item) => item.slug === slug));
  const queryTradeSlugs = q ? tradeSlugsForQuery(q) : [];
  const companies = isSupabaseConfigured()
    ? await getCompaniesForSearch({
        location,
        q,
        queryTradeSlugs,
        radiusKm,
        selectedTrade,
        selectedTradeSet,
      })
    : [];
  const hasActiveSearch = Boolean(q || selectedTrade || selectedTradeSet.length || location);
  const groupedTradeOptions = tradeOptions.reduce<Array<{ category: string; trades: typeof tradeOptions }>>(
    (groups, item) => {
      const group = groups.find((entry) => entry.category === item.category);
      if (group) {
        group.trades.push(item);
      } else {
        groups.push({ category: item.category, trades: [item] });
      }
      return groups;
    },
    [],
  );

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">GewerkeListe.com</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Fachbetriebe suchen</h1>
        </div>

        <form className="grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft md:grid-cols-[1fr_1fr_1fr_140px_auto]">
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Betrieb oder Leistung"
            className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand"
          />
          <select name="gewerk" defaultValue={selectedTrade || ""} className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand">
            <option value="">{selectedTradeSet.length ? `${selectedTradeSet.length} Gewerke vorausgewählt` : "Alle Gewerke"}</option>
            {groupedTradeOptions.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.trades.map((item) => (
                  <option key={item.key} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            name="ort"
            defaultValue={location || ""}
            placeholder="Ort oder PLZ"
            className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand"
          />
          <select name="umkreis" defaultValue={radiusKm} className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand">
            <option value="10">10 km</option>
            <option value="25">25 km</option>
            <option value="50">50 km</option>
            <option value="100">100 km</option>
          </select>
          <button className="rounded-md bg-brand px-5 py-2 font-semibold text-white hover:bg-[#265a4d]">Suchen</button>
          {selectedTradeSet.map((slug) => (
            <input key={slug} name="trades" type="hidden" value={slug} />
          ))}
        </form>
        {selectedTradeSet.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTradeSet.map((slug) => {
              const option = tradeOptions.find((item) => item.slug === slug);
              return (
                <span key={slug} className="rounded-md border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
                  {option?.name || slug}
                </span>
              );
            })}
          </div>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-muted">
          Die Umkreisauswahl wird für Betriebseinträge mit hinterlegtem Tätigkeitsgebiet berücksichtigt. Ohne
          hinterlegte Radiusdaten werden passende Treffer nach Gewerk, Ort und PLZ angezeigt.
        </p>

        {queryTradeSlugs.length ? (
          <section className="mt-6 rounded-lg border border-line bg-white p-4 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Passende Gewerke</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {queryTradeSlugs.slice(0, 14).map((slug) => {
                const option = tradeOptions.find((item) => item.slug === slug);
                if (!option) return null;
                return (
                  <Link
                    key={slug}
                    className="inline-flex min-h-9 items-center rounded-md border border-line px-3 text-sm font-semibold text-action hover:border-action"
                    href={`/gewerke/${slug}` as Route}
                  >
                    {option.name}
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-4">
          {companies.length === 0 ? (
            <SearchEmptyState hasActiveSearch={hasActiveSearch} location={location} query={q} />
          ) : (
            companies.map((company) => {
              const description = publicResultDescription(company.description);
              const imageUrl = publicResultImage(company);
              const tradeNames = visibleTradeNames(company);

              return (
                <Link
                  key={company.id}
                  href={`/firma/${company.slug}` as Route}
                  className="rounded-lg border border-line bg-white p-5 shadow-soft transition hover:border-brand"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div className="flex min-w-0 gap-4">
                      {imageUrl ? (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-[#fbfcff]">
                          <img
                            alt={company.logo_url ? `Logo von ${company.name}` : `Ansprechpartner von ${company.name}`}
                            className="h-full w-full object-cover"
                            src={imageUrl}
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        {tradeNames.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {tradeNames.slice(0, 4).map((tradeName) => (
                              <span key={tradeName} className="rounded-md bg-[#eef4fb] px-2 py-1 text-xs font-semibold text-brand">
                                {tradeName}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <h2 className="mt-1 text-xl font-semibold text-ink">{company.name}</h2>
                        <p className="mt-2 text-sm text-muted">
                          {company.postal_code} {company.city}
                        </p>
                        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-ink">{description}</p> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {company.verified ? (
                        <span className="rounded-md border border-[#b9e2c2] bg-[#effaf2] px-3 py-1 text-xs font-semibold text-[#1f6b3d]">
                          Betriebsdaten bestätigt
                        </span>
                      ) : (
                        <span className="rounded-md border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
                          Basis-Eintrag
                        </span>
                      )}
                      <ClaimBadge status={company.claim_status} />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArrayParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

async function getCompaniesForSearch({
  location,
  q,
  queryTradeSlugs,
  radiusKm,
  selectedTrade,
  selectedTradeSet,
}: {
  location?: string;
  q?: string;
  queryTradeSlugs: string[];
  radiusKm: string;
  selectedTrade?: string;
  selectedTradeSet: string[];
}) {
  const tradeSlugs = selectedTradeSet.length ? selectedTradeSet : selectedTrade ? [selectedTrade] : queryTradeSlugs;

  if (!tradeSlugs.length) {
    return getPublicCompanies({ query: q, location, radiusKm });
  }

  const results = await Promise.all(
    tradeSlugs.map((tradeSlug) =>
      getPublicCompanies({ query: selectedTradeSet.length || selectedTrade || queryTradeSlugs.length ? undefined : q, tradeSlug, location, radiusKm }),
    ),
  );
  const unique = new Map<string, Awaited<ReturnType<typeof getPublicCompanies>>[number]>();
  results.flat().forEach((company) => {
    if (!unique.has(company.id)) unique.set(company.id, company);
  });
  return Array.from(unique.values());
}

function tradeSlugsForQuery(query: string) {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return [];
  return rankTradeEntries(publicTradeTaxonomy().map((trade) => createTradeSearchEntry(trade)), normalizedQuery).map((entry) => entry.trade.slug);
}

function visibleTradeNames(company: PublicCompanyWithTrade) {
  const names = [
    ...(company.company_trades || [])
      .filter(
        (match) =>
          (match.confidence_score || 0) >= 70 &&
          match.status !== "rejected" &&
          match.visibility_level !== "internal" &&
          Boolean(match.trades?.name),
      )
      .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
      .map((match) => match.trades?.name),
    company.trades?.name,
  ].filter((name): name is string => Boolean(name));

  return Array.from(new Set(names));
}

function SearchEmptyState({
  hasActiveSearch,
  location,
  query,
}: {
  hasActiveSearch: boolean;
  location?: string;
  query?: string;
}) {
  if (!hasActiveSearch) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Starte mit Gewerk, Leistung oder Ort.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Suche zum Beispiel nach einem Gewerk, einer konkreten Leistung oder einem Ort. Öffentliche Basis-Einträge und
          übernommene Profile erscheinen hier, sobald sie zur Suche passen.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-white p-8 shadow-soft">
      <h2 className="text-xl font-semibold text-ink">Noch kein passender Betrieb gefunden.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Für {query ? `"${query}"` : "diese Suche"}
        {location ? ` in ${location}` : ""} ist aktuell kein öffentlicher Eintrag sichtbar. Prüfe den Ort, erweitere den
        Umkreis oder schlage einen Betrieb vor.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link className="inline-flex min-h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-[#265a4d]" href={"/betrieb-eintragen" as Route}>
          Betrieb vorschlagen
        </Link>
        <Link className="inline-flex min-h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action" href={"/suche" as Route}>
          Suche zurücksetzen
        </Link>
      </div>
    </div>
  );
}
