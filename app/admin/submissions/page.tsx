import Link from "next/link";
import type { Route } from "next";
import { Shell } from "@/components/shell";
import { getCompanySubmissions } from "@/lib/data";
import { tradeTaxonomy } from "@/lib/trade-taxonomy";
import type { CompanySubmission } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statuses = [
  ["", "Alle"],
  ["submitted", "Neu"],
  ["in_review", "In Prüfung"],
  ["needs_info", "Rückfrage"],
  ["approved", "Freigegeben"],
  ["rejected", "Abgelehnt"],
];

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const submissions = await getCompanySubmissions({
    status: stringParam(params.status),
    primaryTrade: stringParam(params.trade),
    location: stringParam(params.location),
    query: stringParam(params.q),
    founder: stringParam(params.founder),
    verification: stringParam(params.verification),
    type: stringParam(params.type),
  });

  return (
    <Shell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Einreichungen prüfen</h1>
        </div>
        <Link className="w-fit rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href="/admin/companies">
          Betriebseinträge
        </Link>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-6">
        <Metric label="Neu" value={countStatus(submissions, "submitted")} />
        <Metric label="In Prüfung" value={countStatus(submissions, "in_review")} />
        <Metric label="Rückfrage" value={countStatus(submissions, "needs_info")} />
        <Metric label="Freigegeben" value={countStatus(submissions, "approved")} />
        <Metric label="Abgelehnt" value={countStatus(submissions, "rejected")} />
        <Metric label="Gründungsbetrieb" value={submissions.filter((item) => item.wants_founder_verification).length} />
      </section>

      <form className="mb-6 grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft lg:grid-cols-[1fr_150px_150px_180px_150px_150px_auto]">
        <input className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={stringParam(params.q) || ""} name="q" placeholder="Firmenname suchen" />
        <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={stringParam(params.type) || ""} name="type">
          <option value="">Alle Typen</option>
          <option value="new">Neueintrag</option>
          <option value="claim">Claim</option>
        </select>
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
        <input className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={stringParam(params.location) || ""} name="location" placeholder="Ort / PLZ" />
        <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={stringParam(params.founder) || ""} name="founder">
          <option value="">Gründung alle</option>
          <option value="true">angefragt</option>
        </select>
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Filtern</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-normal text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Eingang</th>
              <th className="px-4 py-3 font-semibold">Betrieb</th>
              <th className="px-4 py-3 font-semibold">Typ</th>
              <th className="px-4 py-3 font-semibold">Gewerk / Leistungen</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Gründungsphase</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {submissions.map((submission) => (
              <tr key={submission.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-4 text-muted">{formatDate(submission.created_at)}</td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-ink">{submission.company_name}</div>
                  <div className="text-sm text-muted">
                    {submission.postal_code} {submission.city}
                  </div>
                  <a className="text-brand hover:underline" href={`mailto:${submission.email}`}>
                    {submission.email}
                  </a>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink">
                    {submissionTypeLabel(submission.source)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-ink">{tradeLabel(submission.primary_trade)}</div>
                  <div className="mt-1 text-sm text-muted">{submission.selected_services.length} Leistungen ausgewählt</div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={submission.status} />
                </td>
                <td className="px-4 py-4 text-sm text-muted">
                  <div>Verifizierung: {submission.wants_founder_verification ? "ja" : "nein"}</div>
                  <div>Aufbau-Beitrag: {supportLabel(submission)}</div>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white" href={`/admin/submissions/${submission.id}` as Route}>
                    Prüfen
                  </Link>
                </td>
              </tr>
            ))}
            {submissions.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={7}>
                  Keine Einreichungen gefunden.
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
  const label = statusLabel(status);
  return <span className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink">{label}</span>;
}

function countStatus(items: CompanySubmission[], status: string) {
  return items.filter((item) => item.status === status).length;
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function tradeLabel(slug: string) {
  return tradeTaxonomy.find((trade) => trade.slug === slug)?.name || slug;
}

function supportLabel(submission: CompanySubmission) {
  if (!submission.wants_support_contribution) return "nein";
  return submission.support_contribution_amount ? `${submission.support_contribution_amount} EUR` : "ja";
}

function submissionTypeLabel(source: string) {
  return source.startsWith("claim:") ? "Claim" : "Neueintrag";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    submitted: "Neu",
    in_review: "In Prüfung",
    needs_info: "Rückfrage",
    approved: "Freigegeben",
    rejected: "Abgelehnt",
  };
  return labels[status] || status;
}
