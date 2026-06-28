"use client";

import { useMemo, useState } from "react";
import type { TaxonomyTrade } from "@/lib/trade-taxonomy";
import { publicTradeTaxonomy } from "@/lib/trade-taxonomy";
import { serviceTaxonomy } from "@/lib/service-taxonomy";

type TradeCheckboxGroupsProps = {
  selected: string[];
  name: string;
  onToggle: (slug: string) => void;
  max?: number;
  defaultOpen?: boolean;
};

export function TradeCheckboxGroups({ selected, name, onToggle, defaultOpen = false }: TradeCheckboxGroupsProps) {
  const [query, setQuery] = useState("");
  const groups = groupedTradeSelectionByServiceTaxonomy();
  const selectedTrades = useMemo(
    () => publicTradeTaxonomy().filter((trade) => selected.includes(trade.slug)),
    [selected],
  );
  const normalizedQuery = normalizeSearch(query);
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      trades: normalizedQuery
        ? group.trades.filter((trade) => {
            const haystack = normalizeSearch(
              [trade.name, trade.shortDescription, trade.category, ...trade.synonyms, ...trade.coreServices, ...trade.specializations].join(" "),
            );
            return haystack.includes(normalizedQuery);
          })
        : group.trades,
    }))
    .filter((group) => group.trades.length > 0);

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-line bg-[#fbfcff] p-4">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Gewerk oder Leistung suchen
          <input
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm font-normal outline-none focus:border-action"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="z. B. Trockenbau, PV, Estrich"
            value={query}
          />
        </label>
        <p className="mt-3 text-xs leading-5 text-muted">
          Wählen Sie alle Gewerke aus, die Ihr Betrieb tatsächlich anbietet. Es gibt keine künstliche Begrenzung des
          tatsächlichen Leistungsspektrums.
        </p>
        {selectedTrades.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTrades.map((trade) => (
              <button
                key={trade.slug}
                className="rounded-md border border-[#b9dec8] bg-[#f1fbf5] px-3 py-1 text-xs font-semibold text-brand"
                onClick={() => onToggle(trade.slug)}
                type="button"
              >
                {trade.name} entfernen
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {filteredGroups.map((group) => (
        <details key={group.name} className="overflow-hidden rounded-lg border border-line bg-white" open={defaultOpen}>
          <summary className="cursor-pointer bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-action">
            {group.name}
          </summary>
          <div className="divide-y divide-line border-t border-line">
            {group.trades.map((trade) => (
              <TradeCheckRow
                key={trade.slug}
                checked={selected.includes(trade.slug)}
                name={name}
                onToggle={() => onToggle(trade.slug)}
                trade={trade}
              />
            ))}
          </div>
        </details>
      ))}
      {filteredGroups.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-4 text-sm leading-6 text-muted">
          Kein passendes Gewerk gefunden. Prüfen Sie die Schreibweise oder nutzen Sie ein verwandtes Gewerk.
        </div>
      ) : null}
    </div>
  );
}

function groupedTradeSelectionByServiceTaxonomy() {
  const tradesBySlug = new Map(publicTradeTaxonomy().map((trade) => [trade.slug, trade]));
  return serviceTaxonomy
    .map((group) => ({
      name: group.name,
      trades: group.trades.map((taxonomyTrade) => tradesBySlug.get(taxonomyTrade.slug)).filter((trade): trade is TaxonomyTrade => Boolean(trade)),
    }))
    .filter((group) => group.trades.length > 0);
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function TradeCheckRow({
  checked,
  name,
  onToggle,
  trade,
}: {
  checked: boolean;
  name: string;
  onToggle: () => void;
  trade: TaxonomyTrade;
}) {
  return (
    <label
      className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-sm transition ${
        checked ? "bg-[#eef4ff] text-brand" : "bg-white text-ink hover:bg-[#fbfcff]"
      }`}
    >
      <input
        checked={checked}
        className="mt-1 h-5 w-5 shrink-0 rounded-none accent-action"
        name={name}
        onChange={onToggle}
        type="checkbox"
        value={trade.slug}
      />
      <span className="min-w-0">
        <span className="block font-semibold leading-6">{trade.name}</span>
        <span className="mt-1 block text-xs leading-5 text-muted">{trade.shortDescription}</span>
      </span>
    </label>
  );
}
