"use client";

import { useMemo, useState } from "react";
import { serviceTaxonomy } from "@/lib/service-taxonomy";
import { publicTradeTaxonomy } from "@/lib/trade-taxonomy";

type TradeServiceSelectionProps = {
  selectedTrades: string[];
  selectedServices: string[];
  onToggleService: (service: string) => void;
};

export function TradeServiceSelection({
  selectedTrades,
  selectedServices,
  onToggleService,
}: TradeServiceSelectionProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearch(query);
  const tradeLabels = useMemo(
    () => new Map(publicTradeTaxonomy().map((trade) => [trade.slug, trade.name])),
    [],
  );
  const serviceTradesBySlug = new Map(serviceTaxonomy.flatMap((group) => group.trades).map((trade) => [trade.slug, trade]));
  const selectedTradeSet = new Set(selectedTrades.flatMap(serviceTaxonomySlugsForTrade));
  const trades = serviceTaxonomy
    .flatMap((group) => group.trades)
    .filter((trade) => selectedTradeSet.has(trade.slug));

  if (!selectedTrades.length) {
    return (
      <div className="rounded-lg border border-line bg-white p-5 text-sm leading-6 text-muted">
        Wählen Sie zuerst mindestens ein Gewerk aus. Danach erscheinen hier die passenden Detailleistungen.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-line bg-[#fbfcff] p-4">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Leistungen durchsuchen
          <input
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm font-normal outline-none focus:border-action"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="z. B. Akustikdecken, Brandschutz, PV, Estrich"
            value={query}
          />
        </label>
        <p className="mt-3 text-xs leading-5 text-muted">
          Wählen Sie die konkreten Leistungen aus, die Ihr Betrieb innerhalb der ausgewählten Gewerke anbietet.
        </p>
        {selectedServices.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedServices.map((service) => (
              <button
                key={service}
                className="rounded-md border border-[#b9dec8] bg-[#f1fbf5] px-3 py-1 text-xs font-semibold text-brand"
                onClick={() => onToggleService(service)}
                type="button"
              >
                {service} entfernen
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {selectedTrades.map((tradeSlug) => {
        const mappedTradeSlugs = serviceTaxonomySlugsForTrade(tradeSlug);
        const mappedTrades = mappedTradeSlugs.map((slug) => serviceTradesBySlug.get(slug)).filter((item): item is NonNullable<typeof item> => Boolean(item));
        const trade = mappedTrades[0];
        const families = mappedTrades
          .flatMap((mappedTrade) => mappedTrade.families)
          .map((family) => ({
            ...family,
            services: family.services.filter((service) => {
              if (!normalizedQuery) return true;
              const haystack = normalizeSearch(
                [service.name, service.description, ...service.aliases, ...service.activities, ...service.contexts].join(" "),
              );
              return haystack.includes(normalizedQuery);
            }),
          }))
          .filter((family) => family.services.length > 0);

        return (
          <details key={tradeSlug} className="overflow-hidden rounded-lg border border-line bg-white">
            <summary className="cursor-pointer bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-action">
              Leistungen in {tradeLabels.get(tradeSlug) || trade?.name || tradeSlug} auswählen
              {selectedServicesForTrade(tradeSlug, selectedServices).length ? (
                <span className="ml-2 text-xs font-semibold text-muted">
                  {selectedServicesForTrade(tradeSlug, selectedServices).length} ausgewählt
                </span>
              ) : null}
            </summary>
            <div className="grid gap-4 border-t border-line p-4">
              {families.length ? (
                families.map((family) => (
                  <section key={family.slug} className="rounded-md border border-line bg-[#fbfaf7] p-3">
                    <h3 className="text-sm font-semibold text-ink">{family.name}</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {family.services.map((service) => (
                        <label
                          key={service.slug}
                          className={`flex cursor-pointer gap-3 rounded-md border px-3 py-2 text-sm leading-6 transition ${
                            selectedServices.includes(service.name)
                              ? "border-[#b9dec8] bg-[#f1fbf5] text-brand"
                              : "border-line bg-white text-ink hover:border-action"
                          }`}
                        >
                          <input
                            checked={selectedServices.includes(service.name)}
                            className="mt-1 h-4 w-4 shrink-0 accent-action"
                            name="selectedServices"
                            onChange={() => onToggleService(service.name)}
                            type="checkbox"
                            value={service.name}
                          />
                          <span>
                            <span className="block font-semibold">{service.name}</span>
                            <span className="mt-1 block text-xs text-muted">{service.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-md border border-line bg-white p-4 text-sm leading-6 text-muted">
                  Für dieses Gewerk sind noch keine passenden Detailleistungen sichtbar. Sie können das Profil trotzdem
                  einreichen und unten eine fehlende Leistung vorschlagen.
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function selectedServicesForTrade(tradeSlug: string, selectedServices: string[]) {
  const tradeSlugs = new Set(serviceTaxonomySlugsForTrade(tradeSlug));
  const serviceNames = new Set(
    serviceTaxonomy
      .flatMap((group) => group.trades)
      .filter((trade) => tradeSlugs.has(trade.slug))
      .flatMap((trade) => trade.families.flatMap((family) => family.services.map((service) => service.name))),
  );
  return selectedServices.filter((service) => serviceNames.has(service));
}

function serviceTaxonomySlugsForTrade(tradeSlug: string) {
  const aliases: Record<string, string[]> = {
    bauunternehmen: ["maurerarbeiten", "hochbau", "betonbau"],
    rohbau: ["maurerarbeiten", "hochbau", "betonbau"],
  };
  return aliases[tradeSlug] || [tradeSlug];
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
