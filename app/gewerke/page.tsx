import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getPublicCompanyTradeCounts } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { frequentTradeSlugs, tradeHierarchy, type TradeHierarchyItem } from "@/lib/trade-hierarchy";
import { publicTradeTaxonomy, type TaxonomyTrade } from "@/lib/trade-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gewerke finden nach Baukostenstruktur | GewerkeListe.com",
  description:
    "Strukturierte Suche nach Baugewerken, Planungsleistungen und ausführenden Unternehmen – gegliedert nach DIN-276-naher Kostenstruktur und praxisnahen Vergabeeinheiten.",
};

type ViewMode = "kostengruppen" | "alphabetisch" | "haeufig";

type PageProps = {
  searchParams?: Promise<{
    ansicht?: string;
    q?: string;
    ort?: string;
  }>;
};

export default async function TradesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const viewMode = viewModeFromParam(params?.ansicht);
  const query = normalizeSearch(params?.q || "");
  const location = params?.ort?.trim() || "";
  const companyCounts = isSupabaseConfigured() ? await getPublicCompanyTradeCounts() : {};
  const searchableTrades = publicTradeTaxonomy();
  const filteredHierarchy = filterHierarchy(query);
  const alphabeticTrades = searchableTrades
    .filter((trade) => tradeMatchesQuery(trade, query))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
  const frequentTrades = frequentTradeSlugs
    .map((slug) => searchableTrades.find((trade) => trade.slug === slug))
    .filter((trade): trade is TaxonomyTrade => Boolean(trade))
    .filter((trade) => tradeMatchesQuery(trade, query));

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-line pb-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Gewerkeregister nach Kostenstruktur</p>
          <div className="mt-3 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
                Gewerke finden nach Baukostenstruktur
              </h1>
              <p className="mt-5 max-w-4xl text-base leading-7 text-muted">
                Strukturierte Suche nach Baugewerken, Planungsleistungen und ausführenden Unternehmen – gegliedert nach
                DIN-276-naher Kostenstruktur und praxisnahen Vergabeeinheiten.
              </p>
            </div>

            <form className="rounded-lg border border-line bg-white p-4 shadow-soft" action="/suche">
              <label className="grid gap-2 text-xs font-semibold text-muted">
                Gewerk, Leistung oder Firma suchen
                <input
                  className="h-11 rounded-md border border-line px-3 text-sm font-normal text-ink outline-none focus:border-action"
                  name="q"
                  placeholder="Gewerk, Leistung oder Firma suchen"
                  defaultValue={params?.q || ""}
                />
              </label>
              <label className="mt-3 grid gap-2 text-xs font-semibold text-muted">
                Ort oder PLZ
                <input
                  className="h-11 rounded-md border border-line px-3 text-sm font-normal text-ink outline-none focus:border-action"
                  name="ort"
                  placeholder="Ort oder PLZ"
                  defaultValue={location}
                />
              </label>
              <button className="mt-4 h-11 w-full rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand">
                Suchen
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-6">
          <ViewTab label="Nach Kostengruppen" mode="kostengruppen" current={viewMode} query={params?.q} location={location} />
          <ViewTab label="Alphabetisch" mode="alphabetisch" current={viewMode} query={params?.q} location={location} />
          <ViewTab label="Häufig gesucht" mode="haeufig" current={viewMode} query={params?.q} location={location} />
        </div>

        {viewMode === "kostengruppen" ? (
          <section className="mt-6">
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-3 text-xs font-semibold uppercase tracking-normal text-muted">
              <span>Kostengruppe / Vergabeeinheit</span>
              <span>Betriebe</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
              {filteredHierarchy.length > 0 ? (
                filteredHierarchy.map((group) => (
                  <details key={group.code} className="border-b border-line last:border-b-0" open={group.defaultOpen}>
                    <summary className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-4 bg-[#fbfcff] px-4 py-4 hover:bg-[#f2f6fb]">
                      <span>
                        <span className="font-semibold text-brand">{group.code}</span>
                        <span className="ml-3 font-semibold text-[#07173d]">{group.title}</span>
                      </span>
                      <span className="text-sm text-muted">{countItems(group.items, group.subgroups)} Einheiten</span>
                    </summary>
                    <div className="divide-y divide-line">
                      {group.items?.map((item) => (
                        <TradeRow key={`${group.code}-${item.label}`} item={item} location={location} count={companyCounts[item.slug] || 0} />
                      ))}
                      {group.subgroups?.map((subgroup) => (
                        <details key={`${group.code}-${subgroup.code}`} className="bg-white" open>
                          <summary className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3 hover:bg-[#fbfcff]">
                            <span>
                              <span className="font-semibold text-muted">{subgroup.code}</span>
                              <span className="ml-3 font-semibold text-ink">{subgroup.title}</span>
                            </span>
                            <span className="text-sm text-muted">{subgroup.items.length} Gewerke</span>
                          </summary>
                          <div className="divide-y divide-line border-t border-line bg-white">
                            {subgroup.items.map((item) => (
                              <TradeRow key={`${subgroup.code}-${item.label}`} item={item} location={location} count={companyCounts[item.slug] || 0} nested />
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </details>
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          </section>
        ) : null}

        {viewMode === "alphabetisch" ? (
          <TradeList
            title="Alphabetische Gewerkeliste"
            trades={alphabeticTrades}
            location={location}
            companyCounts={companyCounts}
          />
        ) : null}

        {viewMode === "haeufig" ? (
          <TradeList
            title="Häufig gesuchte Baugewerke"
            trades={frequentTrades}
            location={location}
            companyCounts={companyCounts}
          />
        ) : null}

        <section className="mt-8 rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold text-[#07173d]">Einordnung für Planung, Ausschreibung und Vergabe</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Die Struktur orientiert sich an Kosten- und Leistungsbereichen, wie sie in der Baupraxis für Kostenschätzung,
            Leistungsverzeichnis, Vergabeeinheiten und Bauablauf verwendet werden. Die Zuordnung ersetzt keine Norm- oder
            Ausschreibungsprüfung, hilft aber bei der fachlichen Suche nach passenden Gewerken und Betrieben.
          </p>
        </section>
      </section>
    </main>
  );
}

function ViewTab({ label, mode, current, query, location }: { label: string; mode: ViewMode; current: ViewMode; query?: string; location: string }) {
  const href = hrefWithParams("/gewerke", { ansicht: mode === "kostengruppen" ? undefined : mode, q: query, ort: location });
  const active = current === mode;

  return (
    <Link
      className={`inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold ${
        active ? "border-action bg-action text-white" : "border-line bg-white text-action hover:border-action"
      }`}
      href={href as Route}
    >
      {label}
    </Link>
  );
}

function TradeRow({ item, location, count, nested = false }: { item: TradeHierarchyItem; location: string; count: number; nested?: boolean }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 ${nested ? "md:pl-12" : ""}`}>
      <Link className="min-w-0 text-sm font-medium text-ink hover:text-action" href={tradeHref(item.slug, location) as Route}>
        {item.label}
      </Link>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        {count > 0 ? <span className="hidden text-muted sm:inline">{count} Betriebe</span> : null}
        <Link className="font-semibold text-action hover:underline" href={searchHref(item.slug, location) as Route}>
          Betriebe finden
        </Link>
      </div>
    </div>
  );
}

function TradeList({ title, trades, location, companyCounts }: { title: string; trades: TaxonomyTrade[]; location: string; companyCounts: Record<string, number> }) {
  return (
    <section className="mt-6">
      <h2 className="text-2xl font-semibold text-[#07173d]">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        {trades.length > 0 ? (
          trades.map((trade) => (
            <TradeRow
              key={trade.slug}
              item={{ label: trade.name, slug: trade.slug }}
              location={location}
              count={companyCounts[trade.slug] || 0}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-brand">Kein passendes Gewerk gefunden</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Prüfen Sie den Suchbegriff oder wechseln Sie zur Betriebssuche.</p>
      <Link className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href="/suche">
        Zur Betriebssuche
      </Link>
    </div>
  );
}

function filterHierarchy(query: string) {
  if (!query) return tradeHierarchy;

  return tradeHierarchy
    .map((group) => {
      const items = group.items?.filter((item) => normalizeSearch(item.label).includes(query) || normalizeSearch(item.slug).includes(query));
      const subgroups = group.subgroups
        ?.map((subgroup) => ({
          ...subgroup,
          items: subgroup.items.filter((item) => normalizeSearch(item.label).includes(query) || normalizeSearch(item.slug).includes(query)),
        }))
        .filter((subgroup) => subgroup.items.length > 0);

      return { ...group, defaultOpen: true, items, subgroups };
    })
    .filter((group) => (group.items?.length || 0) > 0 || (group.subgroups?.length || 0) > 0);
}

function tradeMatchesQuery(trade: TaxonomyTrade, query: string) {
  if (!query) return true;
  const haystack = normalizeSearch(
    [
      trade.name,
      trade.slug,
      trade.category,
      trade.shortDescription,
      ...trade.synonyms,
      ...trade.subTrades,
      ...trade.coreServices,
      ...trade.specializations,
    ].join(" "),
  );
  return haystack.includes(query);
}

function countItems(items?: TradeHierarchyItem[], subgroups?: Array<{ items: TradeHierarchyItem[] }>) {
  return (items?.length || 0) + (subgroups || []).reduce((sum, subgroup) => sum + subgroup.items.length, 0);
}

function tradeHref(slug: string, location: string) {
  if (!location) return `/gewerke/${slug}`;
  return `/gewerke/${slug}/${slugifyLocation(location)}`;
}

function searchHref(slug: string, location: string) {
  return hrefWithParams("/suche", { gewerk: slug, ort: location || undefined });
}

function hrefWithParams(path: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function viewModeFromParam(value?: string): ViewMode {
  if (value === "alphabetisch" || value === "haeufig") return value;
  return "kostengruppen";
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function slugifyLocation(value: string) {
  return normalizeSearch(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
