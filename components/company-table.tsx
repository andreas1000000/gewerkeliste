import Link from "next/link";
import { deleteCompany } from "@/lib/actions";
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
                <td className="px-4 py-4 text-ink">{company.trades?.name || "Ohne Gewerk"}</td>
                <td className="px-4 py-4">
                  <div className="font-medium text-ink">{company.city}</div>
                  <div className="text-muted">{company.postal_code}</div>
                </td>
                <td className="px-4 py-4 text-muted">
                  <div>{company.latitude.toFixed(6)}</div>
                  <div>{company.longitude.toFixed(6)}</div>
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
                    <form action={deleteCompany}>
                      <input name="id" type="hidden" value={company.id} />
                      <button className="rounded-md border border-[#da9a8a] px-3 py-2 text-xs font-semibold text-[#8e2f1f] hover:bg-[#fff0ed]">
                        Loeschen
                      </button>
                    </form>
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
