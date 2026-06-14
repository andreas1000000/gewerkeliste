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
        <details key={group.name} className="rounded-lg border border-line bg-white" open>
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-brand">
            {group.name}
          </summary>
          <div className="grid gap-2 border-t border-line p-3 sm:grid-cols-2">
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
      className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm ${
        checked ? "border-action bg-[#eef4ff] text-brand" : "border-line bg-[#fbfcff] text-ink"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <input
        checked={checked}
        className="mt-0.5 h-5 w-5 rounded-none accent-action"
        disabled={disabled}
        name={name}
        onChange={onToggle}
        type="checkbox"
        value={trade.slug}
      />
      <span>
        <span className="block font-semibold">{trade.name}</span>
        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted">{trade.shortDescription}</span>
      </span>
    </label>
  );
}
