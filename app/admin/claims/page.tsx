import Link from "next/link";
import type { Route } from "next";
import { Shell } from "@/components/shell";
import { approveClaim, rejectClaim } from "@/lib/actions";
import { getCompanyClaimStatusCounts, getCompanyClaims } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  const [claims, companyStatusCounts] = await Promise.all([getCompanyClaims(), getCompanyClaimStatusCounts()]);
  const claimCounts = {
    total: claims.length,
    pending: claims.filter((claim) => claim.status === "pending").length,
    approved: claims.filter((claim) => claim.status === "approved").length,
    rejected: claims.filter((claim) => claim.status === "rejected").length,
  };

  return (
    <Shell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Anfragen zur Eintragsübernahme</h1>
        </div>
        <Link href={"/admin/import" as Route} className="w-fit rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel">
          CSV-Import
        </Link>
      </div>

      <p className="mb-6 max-w-4xl rounded-lg border border-[#d8e4ef] bg-[#fbfcff] px-4 py-3 text-sm leading-6 text-muted">
        „Anfragen“ sind eingereichte Übernahmewünsche. „Profile übernommen“ ist der aktuelle Status im Firmenverzeichnis.
        „Daten bestätigt“ beschreibt die Prüfung von Betriebsdaten – das ist nicht automatisch dasselbe wie eine Übernahme.
      </p>

      <section className="mb-6 grid gap-4 md:grid-cols-5">
        <Metric label="Anfragen gesamt" value={claimCounts.total} />
        <Metric label="Warten auf Prüfung" value={claimCounts.pending} />
        <Metric label="Freigegeben" value={claimCounts.approved} />
        <Metric label="Profile übernommen" value={companyStatusCounts.claimed} />
        <Metric label="Daten bestätigt" value={companyStatusCounts.verified} />
      </section>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-normal text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Firma</th>
              <th className="px-4 py-3 font-semibold">Anfrage</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {claims.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm leading-6 text-muted">
                  Keine Claim-Anfragen gespeichert. Die Zahl „Profile übernommen“ wird separat aus den Firmenstatus gelesen;
                  sie kann deshalb größer sein als die Zahl der aktuell gespeicherten Anfragen.
                </td>
              </tr>
            ) : claims.map((claim) => (
              <tr key={claim.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-semibold text-ink">{claim.companies?.name || "Firma geloescht"}</div>
                  {claim.companies ? (
                    <Link className="text-sm text-brand hover:underline" href={`/firma/${claim.companies.slug}` as Route}>
                      {claim.companies.postal_code} {claim.companies.city}
                    </Link>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-ink">{claim.name}</div>
                  <a className="text-sm text-brand hover:underline" href={`mailto:${claim.email}`}>
                    {claim.email}
                  </a>
                  {claim.phone ? <div className="text-sm text-muted">{claim.phone}</div> : null}
                  <p className="mt-2 max-w-xl text-sm leading-6 text-ink">{claim.message}</p>
                </td>
                <td className="px-4 py-4 font-semibold text-ink">{claimStatusLabel(claim.status)}</td>
                <td className="px-4 py-4">
                  {claim.status === "pending" && claim.companies ? (
                    <div className="flex justify-end gap-2">
                      <form action={approveClaim}>
                        <input name="claim_id" type="hidden" value={claim.id} />
                        <input name="company_id" type="hidden" value={claim.company_id} />
                        <button className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">Freigeben</button>
                      </form>
                      <form action={rejectClaim}>
                        <input name="claim_id" type="hidden" value={claim.id} />
                        <button className="rounded-md border border-[#da9a8a] px-3 py-2 text-xs font-semibold text-[#8e2f1f] hover:bg-[#fff0ed]">
                          Ablehnen
                        </button>
                      </form>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="text-sm font-medium text-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function claimStatusLabel(status: string) {
  return {
    pending: "Offen",
    approved: "Freigegeben",
    rejected: "Abgelehnt",
  }[status] || status;
}
