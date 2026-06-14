import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { SiteHeader } from "@/components/site-header";
import { ClaimBadge } from "@/components/status-badge";
import { getPublicCompanies } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { tradeTaxonomy } from "@/lib/trade-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fachbetriebe suchen | GewerkeListe.com",
  description: "Betriebseinträge nach Gewerk, Leistung, Ort oder PLZ im Gewerkeregister suchen.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = stringParam(params.q);
  const trade = stringParam(params.gewerk);
  const location = stringParam(params.ort);
  const radiusKm = stringParam(params.umkreis) || "50";
  const tradeOptions = tradeTaxonomy
    .filter((item) => item.isActive !== false)
    .map((item) => ({ key: item.slug, slug: item.slug, name: item.name, category: item.category }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
  const selectedTrade = tradeOptions.some((item) => item.slug === trade) ? trade : undefined;
  const queryTradeSlug = q ? tradeSlugForQuery(q) : undefined;
  const companies = isSupabaseConfigured()
    ? await getPublicCompanies({ query: queryTradeSlug ? undefined : q, tradeSlug: selectedTrade || queryTradeSlug, location, radiusKm })
    : [];
  const hasActiveSearch = Boolean(q || selectedTrade || location);
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
            <option value="">Alle Gewerke</option>
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
        </form>
        <p className="mt-3 text-sm leading-6 text-muted">
          Die Umkreisauswahl wird für Betriebseinträge mit hinterlegtem Tätigkeitsgebiet berücksichtigt. Ohne
          hinterlegte Radiusdaten werden passende Treffer nach Gewerk, Ort und PLZ angezeigt.
        </p>

        <section className="mt-8 grid gap-4">
          {companies.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-8 text-center text-sm font-medium text-muted shadow-soft">
              {hasActiveSearch
                ? "Keine Firmen gefunden."
                : "Noch keine öffentlichen Betriebseinträge sichtbar. Sobald die ersten Einträge freigegeben sind, erscheinen sie hier."}
            </div>
          ) : (
            companies.map((company) => (
              <Link
                key={company.id}
                href={`/firma/${company.slug}` as Route}
                className="rounded-lg border border-line bg-white p-5 shadow-soft transition hover:border-brand"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="text-sm font-semibold text-brand">{company.trades?.name}</div>
                    <h2 className="mt-1 text-xl font-semibold text-ink">{company.name}</h2>
                    <p className="mt-2 text-sm text-muted">
                      {company.postal_code} {company.city}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-ink">{company.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function tradeSlugForQuery(query: string) {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return undefined;

  return tradeTaxonomy.find((trade) => {
    const terms = [trade.slug, trade.name, ...trade.synonyms, ...trade.subTrades, ...trade.coreServices].map(normalizeSearchTerm);
    return terms.some((term) => term === normalizedQuery || term.includes(normalizedQuery) || normalizedQuery.includes(term));
  })?.slug;
}

function normalizeSearchTerm(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
