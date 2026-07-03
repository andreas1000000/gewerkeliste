import Link from "next/link";
import { hideCompanyFromPublicDirectory, restoreCompanyToPublicDirectory } from "@/lib/actions/admin-companies";
import type { CompanyWithTrade } from "@/lib/types";
import { ClaimBadge, VerifiedBadge } from "@/components/status-badge";

export function CompanyTable({ companies }: { companies: CompanyWithTrade[] }) {
  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-10 text-center shadow-soft">
        <p className="text-sm font-medium text-muted">Keine Firmen gefunden.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-normal text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Firma</th>
              <th className="px-4 py-3 font-semibold">Gewerk</th>
              <th className="px-4 py-3 font-semibold">Ort</th>
              <th className="px-4 py-3 font-semibold">Koordinaten</th>
              <th className="px-4 py-3 font-semibold">Sichtbarkeit</th>
              <th className="px-4 py-3 font-semibold">Eintragsstatus</th>
              <th className="px-4 py-3 font-semibold">Verifiziert</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {companies.map((company) => (
              <tr key={company.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-semibold text-ink">{company.name}</div>
                  <div className="mt-1 max-w-md text-sm text-muted">{company.description}</div>
                </td>
                <td className="px-4 py-4 text-ink">
                  <TradeTags company={company} />
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-ink">{company.city}</div>
                  <div className="text-muted">{company.postal_code}</div>
                </td>
                <td className="px-4 py-4 text-muted">
                  <div>{formatCoordinate(company.latitude)}</div>
                  <div>{formatCoordinate(company.longitude)}</div>
                </td>
                <td className="px-4 py-4">
                  <VisibilityBadge visible={company.public_visible} />
                </td>
                <td className="px-4 py-4">
                  <ClaimBadge status={company.claim_status} />
                </td>
                <td className="px-4 py-4">
                  <VerifiedBadge verified={company.verified} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      className="rounded-md border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-panel"
                      href={`/companies/${company.id}/edit`}
                    >
                      Bearbeiten
                    </Link>
                    <Link
                      className="rounded-md border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-panel"
                      href={`/admin/companies/${company.id}/premium`}
                    >
                      Startprofil
                    </Link>
                    {company.public_visible ? (
                      <form action={hideCompanyFromPublicDirectory}>
                        <input name="id" type="hidden" value={company.id} />
                        <button className="rounded-md border border-[#da9a8a] px-3 py-2 text-xs font-semibold text-[#8e2f1f] hover:bg-[#fff0ed]">
                          Aus Website entfernen
                        </button>
                      </form>
                    ) : (
                      <form action={restoreCompanyToPublicDirectory}>
                      <input name="id" type="hidden" value={company.id} />
                      <button className="rounded-md border border-[#b9dec8] px-3 py-2 text-xs font-semibold text-[#24523a] hover:bg-[#f1fbf5]">
                        Wieder veröffentlichen
                      </button>
                    </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCoordinate(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "nicht hinterlegt";
}

function VisibilityBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={
        visible
          ? "rounded-md border border-[#b9dec8] bg-[#f1fbf5] px-2.5 py-1 text-xs font-semibold text-[#24523a]"
          : "rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-muted"
      }
    >
      {visible ? "Öffentlich" : "Ausgeblendet"}
    </span>
  );
}

function TradeTags({ company }: { company: CompanyWithTrade }) {
  const tradeMap = new Map<string, { name: string; confidence: number }>();

  if (company.trades) {
    tradeMap.set(company.trades.id, { name: company.trades.name, confidence: 100 });
  }

  for (const relation of company.company_trades || []) {
    const trade = relation.trades;
    if (!trade || relation.status === "rejected") continue;
    if (relation.visibility_level === "internal") continue;
    tradeMap.set(trade.id, {
      name: trade.name,
      confidence: relation.confidence_score || 0,
    });
  }

  const trades = [...tradeMap.values()].sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name, "de"));

  if (trades.length === 0) return <span className="text-muted">Ohne Gewerk</span>;

  return (
    <div className="flex max-w-sm flex-wrap gap-1.5">
      {trades.map((trade) => (
        <span key={trade.name} className="rounded-full border border-line bg-panel px-2 py-1 text-xs font-semibold text-ink">
          {trade.name}
        </span>
      ))}
    </div>
  );
}
