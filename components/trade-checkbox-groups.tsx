"use client";

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

export function TradeCheckboxGroups({ selected, name, onToggle, defaultOpen = true }: TradeCheckboxGroupsProps) {
  const groups = groupedTradeSelectionByServiceTaxonomy();

  return (
    <div className="grid gap-3">
      {groups.map((group) => (
        <details key={group.name} className="overflow-hidden rounded-lg border border-line bg-white" open={defaultOpen}>
          <summary className="cursor-pointer bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-brand">
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
