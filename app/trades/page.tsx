import { getTrades } from "@/lib/data";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TradesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const trades = await getTrades();

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-brand">Stammdaten</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Gewerke</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Diese Gewerke sind zentrale Systemdaten fuer Suche, Firmenprofile und regionale Abdeckung.
          Änderungen erfolgen kontrolliert ueber Taxonomie-Sync und nicht manuell in dieser Ansicht.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-[#da9a8a] bg-[#fff0ed] px-4 py-3 text-sm font-medium text-[#8e2f1f]">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-normal text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {trades.map((trade) => (
              <tr key={trade.id}>
                <td className="px-4 py-4 font-semibold text-ink">{trade.name}</td>
                <td className="px-4 py-4 text-muted">{trade.slug}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold text-muted">
                    System-Stammdatum
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
