import { createTrade, deleteTrade } from "@/lib/actions";
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
      </div>

      <form action={createTrade} className="mb-6 flex max-w-2xl gap-3 rounded-lg border border-line bg-white p-4 shadow-soft">
        <input
          name="name"
          placeholder="Gewerkname"
          className="min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          required
        />
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#265a4d]">
          Anlegen
        </button>
      </form>

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
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {trades.map((trade) => (
              <tr key={trade.id}>
                <td className="px-4 py-4 font-semibold text-ink">{trade.name}</td>
                <td className="px-4 py-4 text-muted">{trade.slug}</td>
                <td className="px-4 py-4 text-right">
                  <form action={deleteTrade}>
                    <input name="id" type="hidden" value={trade.id} />
                    <button className="rounded-md border border-[#da9a8a] px-3 py-2 text-xs font-semibold text-[#8e2f1f] hover:bg-[#fff0ed]">
                      Loeschen
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

