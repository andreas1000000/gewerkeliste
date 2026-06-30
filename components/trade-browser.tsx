"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Route } from "next";
import type { TradeHierarchyGroup, TradeHierarchyItem } from "@/lib/trade-hierarchy";
import { createTradeSearchEntry, normalizeSearchTerm, rankTradeEntries, type TradeSearchEntry } from "@/lib/trade-search";
import type { TaxonomyTrade } from "@/lib/trade-taxonomy";
import { popularServicesForTrade, serviceTaxonomy, type ServiceFamily } from "@/lib/service-taxonomy";

export type TradeViewMode = "kostengruppen" | "alphabetisch" | "haeufig";

type TradeBrowserProps = {
  initialView: TradeViewMode;
  initialQuery: string;
  initialLocation: string;
  claimIntent: boolean;
  trades: TaxonomyTrade[];
  hierarchy: TradeHierarchyGroup[];
  frequentSlugs: string[];
  companyCounts: Record<string, number>;
};

type TradeIndexEntry = {
  trade: TaxonomyTrade;
  hierarchyLabels: string[];
  hierarchyCodes: string[];
  searchText: string;
  expansionText: string;
};

type FlatService = {
  name: string;
  slug: string;
};

const curatedFrequentSlugs = [
  "elektroinstallation",
  "sanitaerinstallation",
  "heizungsbau",
  "dachdeckerarbeiten",
  "garten-und-landschaftsbau",
  "pflasterarbeiten",
  "erdarbeiten",
  "trockenbau",
  "malerarbeiten",
  "fliesenarbeiten",
  "zimmererarbeiten",
];

const quickSearchExamples = ["Elektriker", "PV", "Bad", "Trockenbau", "Dach neu machen", "Pflaster", "Estrich", "Loftwand"];

const roleHints = [
  { title: "Bauherr", text: "Suchen Sie nach Alltagssprache wie Bad, Dach, Wand einziehen oder Garten." },
  { title: "Planer", text: "Nutzen Sie Gewerk, Leistung oder Vergabeeinheit wie WDVS, TGA, Estrich oder Trockenbau." },
  { title: "Bauleitung", text: "Springen Sie schnell zu ausführenden Betrieben nach Gewerk und Region." },
  { title: "Betrieb", text: "Prüfen Sie, wo Ihr Leistungsspektrum fachlich einsortiert ist." },
];

export function TradeBrowser({
  initialView,
  initialQuery,
  initialLocation,
  claimIntent,
  trades,
  hierarchy,
  frequentSlugs,
  companyCounts,
}: TradeBrowserProps) {
  const [viewMode, setViewMode] = useState<TradeViewMode>(claimIntent ? "alphabetisch" : initialView);
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const tradeIndex = useMemo(() => buildTradeIndex(trades, hierarchy), [trades, hierarchy]);
  const search = normalizeSearchTerm(query);
  const rankedTrades = useMemo(() => rankTradeEntries(tradeIndex, search), [tradeIndex, search]);
  const rankedSlugs = new Set(rankedTrades.map((entry) => entry.trade.slug));
  const filteredHierarchy = useMemo(() => filterHierarchy(hierarchy, rankedSlugs, Boolean(search)), [hierarchy, rankedSlugs, search]);
  const serviceFamiliesByTrade = useMemo(() => buildServiceFamiliesByTrade(), []);
  const frequentTrades = useMemo(() => {
    const slugs = Array.from(new Set([...curatedFrequentSlugs, ...frequentSlugs]));
    return slugs
      .map((slug) => rankedTrades.find((entry) => entry.trade.slug === slug)?.trade)
      .filter((trade): trade is TaxonomyTrade => Boolean(trade));
  }, [frequentSlugs, rankedTrades]);

  const selectedQuery = selectedSlugs.join(",");
  const selectedSearchHref = hrefWithParams("/betriebe", {
    gewerk: selectedQuery || undefined,
    ort: location || undefined,
    claimIntent: claimIntent ? "true" : undefined,
  });

  function toggleTrade(slug: string) {
    setSelectedSlugs((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-line pb-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Gewerke, Leistungen und Betriebe</p>
          <div className="mt-3 grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
                Gewerke am Bau verständlich finden
              </h1>
              <p className="mt-5 max-w-4xl text-base leading-7 text-muted">
                Wählen Sie ein Gewerk oder eine Leistungsgruppe aus, um passende Betriebe nach Region zu finden. Die
                Übersicht hilft, Bauleistungen in verständliche Gewerke einzuordnen – von der Alltagssprache bis zur
                fachlichen Leistungsgruppe.
              </p>
              <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
                {roleHints.map((hint) => (
                  <div key={hint.title} className="rounded-lg border border-line bg-white px-3 py-3">
                    <div className="font-semibold text-brand">{hint.title}</div>
                    <p className="mt-1 leading-5 text-muted">{hint.text}</p>
                  </div>
                ))}
              </div>
              {claimIntent ? (
                <div className="mt-5 rounded-lg border border-[#b9dec8] bg-[#eef9f2] p-4 text-sm leading-6 text-ink">
                  Suchen Sie Ihren Betrieb und beanspruchen Sie den vorhandenen Eintrag. Falls kein Eintrag existiert,
                  können Sie einen neuen Betrieb eintragen.
                </div>
              ) : null}
            </div>

            <form className="rounded-lg border border-line bg-white p-4 shadow-soft" action="/gewerke">
              <input type="hidden" name="view" value={viewMode === "kostengruppen" ? "" : viewMode} />
              {claimIntent ? <input type="hidden" name="claimIntent" value="true" /> : null}
              <label className="grid gap-2 text-xs font-semibold text-muted">
                {claimIntent ? "Betrieb, Gewerk oder Ort suchen" : "Gewerk oder Leistung suchen"}
                <input
                  className="h-11 rounded-md border border-line px-3 text-sm font-normal text-ink outline-none focus:border-action"
                  name="q"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={claimIntent ? "Betrieb, Gewerk oder Ort suchen" : "Gewerk, Leistung oder Begriff suchen – z. B. Trockenbau, PV, Estrich"}
                  value={query}
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Beispiele für die Gewerkesuche">
                {quickSearchExamples.slice(0, 6).map((example) => (
                  <button
                    key={example}
                    className="rounded-md border border-line bg-[#fbfcff] px-2.5 py-1 text-xs font-medium text-muted hover:border-action hover:text-action"
                    onClick={() => setQuery(example)}
                    type="button"
                  >
                    {example}
                  </button>
                ))}
              </div>
              <label className="mt-3 grid gap-2 text-xs font-semibold text-muted">
                Ort oder PLZ
                <input
                  className="h-11 rounded-md border border-line px-3 text-sm font-normal text-ink outline-none focus:border-action"
                  name="ort"
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Ort oder PLZ"
                  value={location}
                />
              </label>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
                  href={hrefWithParams("/betrieb-eintragen", {}) as Route}
                >
                  Neuen Betrieb eintragen
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
                  href={hrefWithParams("/betriebe", { query: query || undefined, ort: location || undefined, claimIntent: claimIntent ? "true" : undefined }) as Route}
                >
                  {claimIntent ? "Betrieb suchen" : "Fachbetrieb suchen"}
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-6">
          <ViewButton label="Nach Bauablauf" mode="kostengruppen" current={viewMode} onClick={setViewMode} />
          <span className="sr-only">Standardansicht nach Bauablauf und Nutzerlogik</span>
          <ViewButton label="Alphabetisch" mode="alphabetisch" current={viewMode} onClick={setViewMode} />
          <ViewButton label="Häufig gesucht" mode="haeufig" current={viewMode} onClick={setViewMode} />
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Standard ist die Sortierung nach Bauablauf und typischer Nutzerlogik. Über die Suche können Sie auch nach
          Alltagssprache suchen, zum Beispiel „Bad renovieren“, „Elektriker“, „Rigips“ oder „Dach neu machen“.
        </p>

        {viewMode === "kostengruppen" ? (
          <>
            {search ? (
              <TradeList
                claimIntent={claimIntent}
                companyCounts={companyCounts}
                location={location}
                onToggle={toggleTrade}
                selectedSlugs={selectedSlugs}
                title="Gefundene Gewerke"
                trades={rankedTrades.slice(0, 40).map((entry) => entry.trade)}
                query={query}
                tradeIndex={tradeIndex}
                serviceFamiliesByTrade={serviceFamiliesByTrade}
              />
            ) : null}
            <HierarchyView
              companyCounts={companyCounts}
              groups={filteredHierarchy}
              location={location}
              onToggle={toggleTrade}
              queryActive={Boolean(search)}
              searchQuery={query}
              serviceFamiliesByTrade={serviceFamiliesByTrade}
              selectedSlugs={selectedSlugs}
            />
          </>
        ) : null}

        {viewMode === "alphabetisch" ? (
          <TradeList
            claimIntent={claimIntent}
            companyCounts={companyCounts}
            location={location}
            onToggle={toggleTrade}
            selectedSlugs={selectedSlugs}
            title="Alphabetische Gewerkeliste"
            query={query}
            serviceFamiliesByTrade={serviceFamiliesByTrade}
            trades={rankedTrades.map((entry) => entry.trade).sort((a, b) => a.name.localeCompare(b.name, "de"))}
            tradeIndex={tradeIndex}
          />
        ) : null}

        {viewMode === "haeufig" ? (
          <TradeList
            claimIntent={claimIntent}
            companyCounts={companyCounts}
            location={location}
            onToggle={toggleTrade}
            selectedSlugs={selectedSlugs}
            title="Häufig gesuchte Baugewerke"
            query={query}
            serviceFamiliesByTrade={serviceFamiliesByTrade}
            trades={frequentTrades}
            tradeIndex={tradeIndex}
          />
        ) : null}

        <section className="mt-8 rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold text-[#07173d]">Wie Sie das richtige Gewerk finden</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SeoNote title="Was ist ein Gewerk?" text="Ein Gewerk ist ein fachlicher Leistungsbereich am Bau, zum Beispiel Elektro, Dachdecker, Trockenbau oder Sanitär." />
            <SeoNote title="Gewerk oder Leistung?" text="Ein Gewerk beschreibt den Fachbereich. Eine Leistung ist konkreter, etwa Wallbox montieren, Dachfenster einbauen oder Estrich legen." />
            <SeoNote title="Nach Alltagssprache suchen" text="Sie müssen keinen Normbegriff kennen. Begriffe wie Rigips, Bad, PV, Baggerarbeiten oder Dach neu machen führen ebenfalls zu passenden Bereichen." />
            <SeoNote title="Betrieb oder Gewerk fehlt?" text="Wenn Sie kein passendes Ergebnis finden, können Sie einen Betrieb eintragen oder ein fehlendes Gewerk vorschlagen." />
          </div>
        </section>
      </section>

      {selectedSlugs.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-brand">
              {selectedSlugs.length} {selectedSlugs.length === 1 ? "Gewerk ausgewählt" : "Gewerke ausgewählt"}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="min-h-10 rounded-md border border-line px-4 text-sm font-semibold text-muted" onClick={() => setSelectedSlugs([])} type="button">
                Auswahl löschen
              </button>
              <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href={selectedSearchHref as Route}>
                Passende Betriebe anzeigen
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ViewButton({
  label,
  mode,
  current,
  onClick,
}: {
  label: string;
  mode: TradeViewMode;
  current: TradeViewMode;
  onClick: (mode: TradeViewMode) => void;
}) {
  const active = current === mode;
  return (
    <button
      className={`inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold ${
        active ? "border-action bg-action text-white" : "border-line bg-white text-action hover:border-action"
      }`}
      onClick={() => onClick(mode)}
      type="button"
    >
      {label}
    </button>
  );
}

function HierarchyView({
  groups,
  location,
  companyCounts,
  selectedSlugs,
  queryActive,
  searchQuery,
  serviceFamiliesByTrade,
  onToggle,
}: {
  groups: TradeHierarchyGroup[];
  location: string;
  companyCounts: Record<string, number>;
  selectedSlugs: string[];
  queryActive: boolean;
  searchQuery: string;
  serviceFamiliesByTrade: Map<string, ServiceFamily[]>;
  onToggle: (slug: string) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubgroups, setOpenSubgroups] = useState<Record<string, boolean>>({});

  return (
    <section className="mt-6">
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-3 text-xs font-semibold uppercase tracking-normal text-muted">
        <span>Bereich / Gewerk / Leistung</span>
        <span>Betriebe</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.code} className="border-b border-line last:border-b-0">
              <button
                aria-controls={`trade-group-${group.code}`}
                aria-expanded={queryActive || Boolean(openGroups[group.code])}
                className="grid w-full cursor-pointer gap-4 bg-[#fbfcff] px-4 py-4 text-left hover:bg-[#f2f6fb] md:grid-cols-[minmax(0,1fr)_auto]"
                onClick={() => setOpenGroups((current) => ({ ...current, [group.code]: !current[group.code] }))}
                type="button"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-brand">{group.code}</span>
                    {group.phase ? <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-muted">{group.phase}</span> : null}
                  </span>
                  <span className="mt-2 block text-lg font-semibold text-[#07173d]">{group.shortTitle || group.title}</span>
                  {group.description ? <span className="mt-1 block max-w-3xl text-sm leading-6 text-muted">{group.description}</span> : null}
                  {group.examples?.length ? (
                    <span className="mt-3 flex flex-wrap gap-1.5">
                      {group.examples.slice(0, 6).map((example) => (
                        <span key={example} className="rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-muted">
                          {example}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-col items-start gap-1 text-sm text-muted md:items-end">
                  <span>{countItems(group.items, group.subgroups)} Gewerke</span>
                  <span>{countCompanies(group, companyCounts)} Betriebe</span>
                  <span className="font-semibold text-action">{queryActive || openGroups[group.code] ? "Bereich schließen" : "Bereich öffnen"}</span>
                </span>
              </button>
              {queryActive || openGroups[group.code] ? (
                <div id={`trade-group-${group.code}`} className="divide-y divide-line">
                  {group.items?.map((item) => (
                    <TradeRow
                      key={`${group.code}-${item.label}`}
                      checked={selectedSlugs.includes(item.slug)}
                      count={companyCounts[item.slug] || 0}
                      item={item}
                      location={location}
                      query={searchQuery}
                      serviceFamilies={serviceFamiliesByTrade.get(item.slug) || []}
                      onToggle={onToggle}
                    />
                  ))}
                  {group.subgroups?.map((subgroup) => {
                    const subgroupKey = `${group.code}-${subgroup.code}`;
                    return (
                      <div key={subgroupKey} className="bg-white">
                        <button
                          className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3 text-left hover:bg-[#fbfcff]"
                          aria-expanded={queryActive || Boolean(openSubgroups[subgroupKey])}
                          onClick={() => setOpenSubgroups((current) => ({ ...current, [subgroupKey]: !current[subgroupKey] }))}
                          type="button"
                        >
                          <span>
                            <span className="font-semibold text-muted">{subgroup.code}</span>
                            <span className="ml-3 font-semibold text-ink">{subgroup.title}</span>
                          </span>
                          <span className="text-sm text-muted">{subgroup.items.length} Gewerke</span>
                        </button>
                        {queryActive || openSubgroups[subgroupKey] ? (
                          <div className="divide-y divide-line border-t border-line bg-white">
                            {subgroup.items.map((item) => (
                              <TradeRow
                                key={`${subgroup.code}-${item.label}`}
                                checked={selectedSlugs.includes(item.slug)}
                                count={companyCounts[item.slug] || 0}
                                item={item}
                                location={location}
                                nested
                                query={searchQuery}
                                serviceFamilies={serviceFamiliesByTrade.get(item.slug) || []}
                                onToggle={onToggle}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <EmptyState query={searchQuery} />
        )}
      </div>
    </section>
  );
}

function TradeRow({
  item,
  location,
  count,
  nested = false,
  checked,
  query,
  serviceFamilies,
  onToggle,
}: {
  item: TradeHierarchyItem;
  location: string;
  count: number;
  nested?: boolean;
  checked: boolean;
  query: string;
  serviceFamilies: ServiceFamily[];
  onToggle: (slug: string) => void;
}) {
  const serviceCount = countServices(serviceFamilies);
  const visibleServices = flattenServices(serviceFamilies);

  return (
    <div className="bg-white">
      <div className={`grid gap-3 px-4 py-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start ${nested ? "md:pl-12" : ""}`}>
        <input
          aria-label={`${item.label} auswählen`}
          checked={checked}
          className="mt-1 h-4 w-4 rounded-none accent-action"
          onChange={() => onToggle(item.slug)}
          type="checkbox"
        />
        <div className="min-w-0">
          <Link className="min-w-0 text-sm font-medium text-ink hover:text-action" href={tradeHref(item.slug, location) as Route}>
            <HighlightText text={item.label} query={query} />
          </Link>
          {serviceCount > 0 ? (
            <div className="mt-1 text-xs text-muted">
              {serviceFamilies.length} Leistungsfamilien · {serviceCount} Detailleistungen
            </div>
          ) : null}
          {visibleServices.length > 0 ? <ServiceChipList services={visibleServices} location={location} nested /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm md:justify-end">
          {count > 0 ? <span className="hidden text-muted sm:inline">{count} Betriebe</span> : null}
          <Link className="font-semibold text-action hover:underline" href={searchHref(item.slug, location) as Route}>
            Betriebe finden
          </Link>
        </div>
      </div>
    </div>
  );
}

function TradeList({
  title,
  trades,
  location,
  companyCounts,
  selectedSlugs,
  tradeIndex,
  query,
  serviceFamiliesByTrade,
  claimIntent,
  onToggle,
}: {
  title: string;
  trades: TaxonomyTrade[];
  location: string;
  companyCounts: Record<string, number>;
  selectedSlugs: string[];
  tradeIndex: TradeIndexEntry[];
  query: string;
  serviceFamiliesByTrade: Map<string, ServiceFamily[]>;
  claimIntent: boolean;
  onToggle: (slug: string) => void;
}) {
  const bySlug = new Map(tradeIndex.map((entry) => [entry.trade.slug, entry]));
  return (
    <section className="mt-6">
      <h2 className="text-2xl font-semibold text-[#07173d]">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        {trades.length > 0 ? (
          trades.map((trade) => {
            const indexEntry = bySlug.get(trade.slug);
            const serviceFamilies = serviceFamiliesByTrade.get(trade.slug) || [];
            const serviceCount = countServices(serviceFamilies);
            const visibleServices = flattenServices(serviceFamilies);
            return (
              <div key={trade.slug} className="border-b border-line last:border-b-0">
                <div className="grid gap-3 px-4 py-4 md:grid-cols-[auto_minmax(0,1fr)_minmax(170px,240px)_auto] md:items-start">
                  <input
                    aria-label={`${trade.name} auswählen`}
                    checked={selectedSlugs.includes(trade.slug)}
                    className="mt-1 h-4 w-4 rounded-none accent-action"
                    onChange={() => onToggle(trade.slug)}
                    type="checkbox"
                  />
                  <div className="min-w-0">
                    <Link className="font-semibold text-ink hover:text-action" href={tradeHref(trade.slug, location) as Route}>
                      <HighlightText text={trade.name} query={query} />
                    </Link>
                    <p className="mt-1 text-sm leading-5 text-muted">{trade.shortDescription}</p>
                    {serviceCount > 0 ? (
                      <p className="mt-2 text-xs text-muted">
                        {serviceFamilies.length} Leistungsfamilien · {serviceCount} Detailleistungen
                      </p>
                    ) : null}
                    {visibleServices.length > 0 ? <ServiceChipList services={visibleServices} location={location} /> : <PopularServiceChips slug={trade.slug} location={location} />}
                  </div>
                  <div className="text-sm text-muted">
                    {indexEntry?.hierarchyCodes.length ? indexEntry.hierarchyCodes.join(" / ") : trade.category}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm md:justify-end">
                    {(companyCounts[trade.slug] || 0) > 0 ? <span className="text-muted">{companyCounts[trade.slug]} Betriebe</span> : null}
                    <Link className="font-semibold text-action hover:underline" href={searchHref(trade.slug, location) as Route}>
                      {claimIntent ? "Eintrag suchen" : "Betriebe finden"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState query={query} />
        )}
      </div>
    </section>
  );
}

function ServiceChipList({ services, location, nested = false }: { services: FlatService[]; location: string; nested?: boolean }) {
  if (services.length === 0) return null;

  return (
    <div className={`mt-3 ${nested ? "max-w-4xl" : ""}`}>
      <div className="text-xs font-semibold uppercase tracking-normal text-muted">Leistungen</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {services.map((service) => (
          <Link
            key={service.slug}
            className="inline-flex min-h-9 items-center rounded-md border border-line bg-[#fbfcff] px-3 text-xs font-semibold text-action hover:border-action hover:bg-white"
            href={serviceHref(service, location) as Route}
          >
            {service.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SeoNote({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-lg border border-line bg-[#fbfcff] p-4">
      <h3 className="text-base font-semibold text-brand">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </article>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return <>{text}</>;

  const normalizedText = normalizeSearchTerm(text);
  if (!normalizedText.includes(normalizedQuery)) return <>{text}</>;

  return <mark className="rounded-sm bg-[#fff4c2] px-0.5 text-inherit">{text}</mark>;
}

function PopularServiceChips({ slug, location }: { slug: string; location: string }) {
  const services = popularServicesForTrade(slug, 6);
  if (services.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Häufig gesuchte Leistungen">
      {services.map((service) => (
        <Link
          key={service.slug}
          className="inline-flex min-h-8 items-center rounded-md border border-line bg-[#fbfcff] px-2 py-1 text-xs font-medium text-action hover:border-action hover:bg-white"
          href={serviceHref(service, location) as Route}
        >
          {service.name}
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-brand">Kein exakter Treffer gefunden</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        {query ? `Für „${query}“ gibt es noch keinen eindeutigen Treffer.` : "Es gibt noch keinen eindeutigen Treffer."} Probieren
        Sie einen ähnlichen Begriff wie „Elektriker“, „PV“, „Trockenbau“ oder „Sanitär“.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {quickSearchExamples.slice(0, 4).map((example) => (
          <Link key={example} className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action" href={hrefWithParams("/gewerke", { q: example }) as Route}>
            {example}
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href="/betriebe">
          Zur Betriebssuche
        </Link>
        <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action" href="/betrieb-eintragen">
          Betrieb eintragen und Gewerk vorschlagen
        </Link>
      </div>
    </div>
  );
}

function buildTradeIndex(trades: TaxonomyTrade[], hierarchy: TradeHierarchyGroup[]) {
  const index = new Map<string, TradeIndexEntry>();
  trades.forEach((trade) => {
    index.set(trade.slug, {
      trade,
      hierarchyLabels: [],
      hierarchyCodes: [],
      searchText: "",
      expansionText: "",
    });
  });

  hierarchy.forEach((group) => {
    group.items?.forEach((item) => addHierarchy(index, item.slug, item.label, group.code, group.title));
    group.subgroups?.forEach((subgroup) => {
      subgroup.items.forEach((item) => addHierarchy(index, item.slug, item.label, `${group.code} / ${subgroup.code}`, `${group.title} ${subgroup.title}`));
    });
  });

  index.forEach((entry) => {
    const searchEntry = createTradeSearchEntry(entry.trade, [...entry.hierarchyLabels, ...entry.hierarchyCodes]);
    entry.searchText = searchEntry.searchText;
    entry.expansionText = searchEntry.expansionText;
  });

  return Array.from(index.values()) as Array<TradeIndexEntry & TradeSearchEntry>;
}

function buildServiceFamiliesByTrade() {
  const map = new Map<string, ServiceFamily[]>();
  serviceTaxonomy.forEach((group) => {
    group.trades.forEach((trade) => {
      map.set(trade.slug, [...(map.get(trade.slug) || []), ...trade.families]);
    });
  });
  return map;
}

function countServices(families: ServiceFamily[]) {
  return families.reduce((sum, family) => sum + family.services.length, 0);
}

function flattenServices(families: ServiceFamily[]): FlatService[] {
  const services: FlatService[] = [];
  const seen = new Set<string>();

  families.forEach((family) => {
    family.services.forEach((service) => {
      const key = normalizeTaxonomyLabel(service.name);
      if (!key || seen.has(key)) return;
      if (family.services.length > 1 && key === normalizeTaxonomyLabel(family.name)) return;
      seen.add(key);
      services.push({ name: service.name, slug: service.slug });
    });
  });

  return services;
}

function addHierarchy(index: Map<string, TradeIndexEntry>, slug: string, label: string, code: string, title: string) {
  const entry = index.get(slug);
  if (!entry) return;
  entry.hierarchyLabels.push(label, title);
  if (!entry.hierarchyCodes.includes(code)) entry.hierarchyCodes.push(code);
}

function filterHierarchy(hierarchy: TradeHierarchyGroup[], rankedSlugs: Set<string>, queryActive: boolean) {
  if (!queryActive) return hierarchy;

  return hierarchy
    .map((group) => {
      const items = group.items?.filter((item) => rankedSlugs.has(item.slug));
      const subgroups = group.subgroups
        ?.map((subgroup) => ({
          ...subgroup,
          items: subgroup.items.filter((item) => rankedSlugs.has(item.slug)),
        }))
        .filter((subgroup) => subgroup.items.length > 0);

      return { ...group, items, subgroups };
    })
    .filter((group) => (group.items?.length || 0) > 0 || (group.subgroups?.length || 0) > 0);
}

function countItems(items?: TradeHierarchyItem[], subgroups?: Array<{ items: TradeHierarchyItem[] }>) {
  return (items?.length || 0) + (subgroups || []).reduce((sum, subgroup) => sum + subgroup.items.length, 0);
}

function countCompanies(group: TradeHierarchyGroup, companyCounts: Record<string, number>) {
  const slugs = new Set<string>();
  group.items?.forEach((item) => slugs.add(item.slug));
  group.subgroups?.forEach((subgroup) => subgroup.items.forEach((item) => slugs.add(item.slug)));
  return Array.from(slugs).reduce((sum, slug) => sum + (companyCounts[slug] || 0), 0);
}

function tradeHref(slug: string, location: string) {
  if (!location) return `/gewerke/${slug}`;
  return `/gewerke/${slug}/${slugifyLocation(location)}`;
}

function searchHref(slug: string, location: string) {
  return hrefWithParams("/betriebe", { gewerk: slug, ort: location || undefined });
}

function serviceHref(service: FlatService, location: string) {
  return hrefWithParams("/betriebe", {
    leistung: service.slug || undefined,
    query: service.slug ? undefined : service.name,
    ort: location || undefined,
  });
}

function hrefWithParams(path: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function slugifyLocation(value: string) {
  return normalizeSearchTerm(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeTaxonomyLabel(value: string) {
  return normalizeSearchTerm(value).replace(/[^a-z0-9]+/g, "");
}
