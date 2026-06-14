"use client";

import type { TaxonomyTrade } from "@/lib/trade-taxonomy";
import { groupedTradeSelection } from "@/lib/trade-taxonomy";

type TradeCheckboxGroupsProps = {
  selected: string[];
  name: string;
  onToggle: (slug: string) => void;
  max?: number;
};

export function TradeCheckboxGroups({ selected, name, onToggle, max }: TradeCheckboxGroupsProps) {
  const groups = groupedTradeSelection();

  return (
    <div className="grid gap-3">
      {groups.map((group) => (
        <details key={group.name} className="overflow-hidden rounded-lg border border-line bg-white" open>
          <summary className="cursor-pointer bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-brand">
            {group.name}
          </summary>
          <div className="divide-y divide-line border-t border-line">
            {group.trades.map((trade) => (
              <TradeCheckRow
                key={trade.slug}
                checked={selected.includes(trade.slug)}
                disabled={!selected.includes(trade.slug) && max != null && selected.length >= max}
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

function TradeCheckRow({
  checked,
  disabled,
  name,
  onToggle,
  trade,
}: {
  checked: boolean;
  disabled?: boolean;
  name: string;
  onToggle: () => void;
  trade: TaxonomyTrade;
}) {
  return (
    <label
      className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-sm transition ${
        checked ? "bg-[#eef4ff] text-brand" : "bg-white text-ink hover:bg-[#fbfcff]"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <input
        checked={checked}
        className="mt-1 h-5 w-5 shrink-0 rounded-none accent-action"
        disabled={disabled}
        name={name}
        onChange={onToggle}
        type="checkbox"
        value={trade.slug}
      />
      <span className="min-w-0">
        <span className="block font-semibold leading-6">{trade.name}</span>
        <span className="mt-1 block text-xs leading-5 text-muted">{trade.shortDescription}</span>
        {disabled ? <span className="mt-1 block text-xs font-semibold text-muted">Maximal 5 Gewerke im Basis-Eintrag.</span> : null}
      </span>
    </label>
  );
}
