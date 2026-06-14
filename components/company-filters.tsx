import type { Trade } from "@/lib/types";

export function CompanyFilters({
  trades,
  searchParams,
}: {
  trades: Trade[];
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const value = (key: string) => {
    const raw = searchParams[key];
    return typeof raw === "string" ? raw : "";
  };

  return (
    <form className="grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft md:grid-cols-5">
      <input
        name="q"
        defaultValue={value("q")}
        placeholder="Firma, Ort, PLZ"
        className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand md:col-span-2"
      />
      <select
        name="trade"
        defaultValue={value("trade")}
        className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
      >
        <option value="">Alle Gewerke</option>
        {trades.map((trade) => (
          <option key={trade.id} value={trade.id}>
            {trade.name}
          </option>
        ))}
      </select>
      <select
        name="claim"
        defaultValue={value("claim")}
        className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
      >
        <option value="">Alle Eintragsstatus</option>
        <option value="unclaimed">Nicht beansprucht</option>
        <option value="pending">Übernahme angefragt</option>
        <option value="claimed">Eintrag übernommen</option>
        <option value="rejected">Abgelehnt</option>
      </select>
      <div className="flex gap-2">
        <select
          name="verified"
          defaultValue={value("verified")}
          className="min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Alle</option>
          <option value="true">Verifiziert</option>
          <option value="false">Nicht verifiziert</option>
        </select>
        <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">Filtern</button>
      </div>
    </form>
  );
}
