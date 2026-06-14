import Link from "next/link";
import type { Route } from "next";
import { Shell } from "@/components/shell";
import { getResearchCandidates, getResearchImportBatches } from "@/lib/data";
import { tradeTaxonomy } from "@/lib/trade-taxonomy";
import type { ResearchCompanyCandidate } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statuses = [
  ["", "Alle"],
  ["found", "Gefunden"],
  ["validated", "Validiert"],
  ["duplicate", "Dublette"],
  ["approved", "Freigegeben"],
  ["rejected", "Abgelehnt"],
];

export default async function AdminResearchImportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [batches, candidates] = await Promise.all([
    getResearchImportBatches(),
    getResearchCandidates({
      batchId: stringParam(params.batch),
      status: stringParam(params.status),
      trade: stringParam(params.trade),
      location: stringParam(params.location),
      query: stringParam(params.q),
    }),
  ]);

  return (
    <Shell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Recherche-Importe prüfen</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Öffentlich recherchierte Betriebe werden hier zuerst als Kandidaten geprüft. Erst nach Freigabe entsteht ein
            öffentlicher unbestätigter Basis-Eintrag.
          </p>
        </div>
        <Link className="w-fit rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href="/admin/companies">
          Betriebseinträge
        </Link>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-5">
        <Metric label="Kandidaten" value={candidates.length} />
        <Metric label="Validiert" value={countStatus(candidates, "validated")} />
        <Metric label="Dubletten" value={countStatus(candidates, "duplicate")} />
        <Metric label="Freigegeben" value={countStatus(candidates, "approved")} />
        <Metric label="Batches" value={batches.length} />
      </section>

      <form className="mb-6 grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft lg:grid-cols-[1fr_170px_160px_180px_150px_auto]">
        <input className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={stringParam(params.q) || ""} name="q" placeholder="Betrieb suchen" />
        <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={stringParam(params.status) || ""} name="status">
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={stringParam(params.trade) || ""} name="trade">
          <option value="">Alle Gewerke</option>
          {tradeTaxonomy.map((trade) => (
            <option key={trade.slug} value={trade.slug}>
              {trade.name}
            </option>
          ))}
        </select>
        <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={stringParam(params.batch) || ""} name="batch">
          <option value="">Alle Batches</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
        <input className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={stringParam(params.location) || ""} name="location" placeholder="Ort / PLZ" />
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Filtern</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-normal text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Betrieb</th>
              <th className="px-4 py-3 font-semibold">Gewerk</th>
              <th className="px-4 py-3 font-semibold">Ort</th>
              <th className="px-4 py-3 font-semibold">Quelle</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-semibold text-ink">{candidate.company_name}</div>
                  <div className="mt-1 text-xs text-muted">{candidate.research_import_batches?.name || "Ohne Batch"}</div>
                  {candidate.company_id && candidate.companies ? (
                    <Link className="mt-1 inline-flex text-xs font-semibold text-brand hover:underline" href={`/firma/${candidate.companies.slug}` as Route}>
                      Öffentlichen Eintrag ansehen
                    </Link>
                  ) : null}
                </td>
                <td className="px-4 py-4">{candidate.trade_name}</td>
                <td className="px-4 py-4">
                  {candidate.postal_code} {candidate.city}
                </td>
                <td className="px-4 py-4">
                  <a className="font-semibold text-brand hover:underline" href={candidate.source_url} rel="noreferrer" target="_blank">
                    {candidate.source_label}
                  </a>
                  <div className="mt-1 text-xs text-muted">{formatDate(candidate.source_retrieved_at)}</div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={candidate.status} />
                </td>
                <td className="px-4 py-4 text-muted">{candidate.confidence_score}/100</td>
                <td className="px-4 py-4 text-right">
                  <Link className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white" href={`/admin/research-imports/${candidate.id}` as Route}>
                    Prüfen
                  </Link>
                </td>
              </tr>
            ))}
            {candidates.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={7}>
                  Keine Recherche-Kandidaten gefunden.
                </td>
              </tr>
            ) : null}
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

function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink">{statusLabel(status)}</span>;
}

function countStatus(items: ResearchCompanyCandidate[], status: string) {
  return items.filter((item) => item.status === status).length;
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    found: "Gefunden",
    validated: "Validiert",
    duplicate: "Dublette",
    approved: "Freigegeben",
    rejected: "Abgelehnt",
  };
  return labels[status] || status;
}
