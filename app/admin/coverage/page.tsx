import Link from "next/link";
import type { Route } from "next";
import { Shell } from "@/components/shell";
import { requestAcceptRegionalCandidateApproval, requestDeleteRegionalCandidateApproval } from "@/lib/actions/coverage-approvals";
import { rejectRegionalCandidate, updateRegionalCandidate } from "@/lib/actions/coverage";
import { getRegionalCoverageOverview } from "@/lib/data/coverage";
import { tradeTaxonomy } from "@/lib/trade-taxonomy";
import type { CoverageSnapshot, RegionalCompanyCandidate } from "@/lib/types/coverage";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statuses = [
  ["", "Alle"],
  ["ready_for_publish", "Publikationsreif"],
  ["needs_review", "Review"],
  ["discovered", "Entdeckt"],
  ["website_found", "Website gefunden"],
  ["enriched", "Angereichert"],
  ["promoted", "Übernommen"],
  ["rejected", "Verworfen"],
];

const defaultRegionSlug = "stephanskirchen";

export default async function AdminCoveragePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const regionSlug = stringParam(params.region) || defaultRegionSlug;
  const status = stringParam(params.status);
  const trade = stringParam(params.trade);
  const query = stringParam(params.q);

  try {
    const overview = await getRegionalCoverageOverview({ region: regionSlug, status, trade, query });
    const candidates = overview.candidates;
    const snapshots = overview.snapshots;

    return (
      <Shell>
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Regional Coverage Agent</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">{overview.region.name} Abdeckung</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Kandidaten werden zuerst geprüft und bleiben unverifiziert. Neue Betriebe landen nicht direkt öffentlich in
              der Suche.
            </p>
          </div>
          <Link className="w-fit rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href="/admin/research-imports">
            Recherche-Importe
          </Link>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-5">
          <Metric label="Kandidaten" value={candidates.length} />
          <Metric label="Review" value={countStatus(candidates, "needs_review")} />
          <Metric label="Publikationsreif" value={countStatus(candidates, "ready_for_publish")} />
          <Metric label="Dublettenverdacht" value={candidates.filter((item) => item.duplicate_of_company_id).length} />
          <Metric label="Ø Score" value={Math.round(average(candidates.map((item) => item.overall_score || 0)))} />
        </section>

        <section className="mb-6 rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-ink">Coverage nach Gewerk</h2>
              <p className="mt-1 text-sm text-muted">Letzter Snapshot je Gewerk. Zielzahlen sind im MVP heuristisch.</p>
            </div>
            <div className="text-sm font-semibold text-muted">Region: {overview.region.name}</div>
          </div>
          <div className="overflow-hidden rounded-md border border-line">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-panel text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Gewerk</th>
                  <th className="px-4 py-3">Öffentlich</th>
                  <th className="px-4 py-3">Kandidaten</th>
                  <th className="px-4 py-3">Ziel</th>
                  <th className="px-4 py-3">Abdeckung</th>
                  <th className="px-4 py-3">Qualität</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {snapshots.map((snapshot) => (
                  <CoverageRow key={snapshot.id} snapshot={snapshot} />
                ))}
                {snapshots.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted" colSpan={6}>
                      Noch kein Coverage-Snapshot vorhanden. Starte zuerst einen Dry Run und danach bei Bedarf einen Live-Kandidatenlauf.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Link className={regionPillClass(regionSlug === "stephanskirchen")} href="/admin/coverage?region=stephanskirchen">
            Stephanskirchen
          </Link>
          <Link className={regionPillClass(regionSlug === "riedering")} href="/admin/coverage?region=riedering">
            Riedering
          </Link>
        </div>

        <form className="mb-3 grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft lg:grid-cols-[1fr_180px_220px_auto_auto]">
          <input name="region" type="hidden" value={regionSlug} />
          <input className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={query || ""} name="q" placeholder="Kandidat suchen" />
          <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={status || ""} name="status">
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={trade || ""} name="trade">
            <option value="">Alle Gewerke</option>
            {tradeTaxonomy.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Filtern</button>
          <Link className="inline-flex items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href={`/admin/coverage?region=${regionSlug}` as Route}>
            Filter zurücksetzen
          </Link>
        </form>

        {status || trade || query ? (
          <div className="mb-6 rounded-md border border-line bg-panel px-4 py-3 text-sm text-muted">
            Aktive Filter: {query ? `Suche "${query}" ` : ""}
            {status ? `Status "${statuses.find(([value]) => value === status)?.[1] || status}" ` : ""}
            {trade ? `Gewerk "${tradeTaxonomy.find((item) => item.slug === trade)?.name || trade}" ` : ""}
          </div>
        ) : (
          <div className="mb-6 rounded-md border border-line bg-panel px-4 py-3 text-sm text-muted">
            Es werden alle Kandidaten dieser Region angezeigt. Du kannst nach Status, Gewerk oder Name filtern.
          </div>
        )}

        <section className="space-y-4">
          {candidates.map((candidate) => (
            <CandidateReviewCard key={candidate.id} candidate={candidate} />
          ))}
          {candidates.length === 0 ? (
            <div className="rounded-lg border border-line bg-white px-4 py-8 text-center text-sm text-muted shadow-soft">
              Keine Kandidaten gefunden.
            </div>
          ) : null}
        </section>
      </Shell>
    );
  } catch (error) {
    return (
      <Shell>
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Regional Coverage Agent</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Migration erforderlich</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Die Admin-Ansicht ist vorbereitet. Wende zuerst die Migration
            <span className="font-semibold text-ink"> 20260615004000_regional_coverage_agent.sql </span>
            in Supabase an, damit Regionen, Kandidaten und Coverage-Snapshots gelesen werden können.
          </p>
          <pre className="mt-4 overflow-auto rounded-md bg-panel p-4 text-xs text-muted">{error instanceof Error ? error.message : String(error)}</pre>
        </div>
      </Shell>
    );
  }
}

function CandidateReviewCard({ candidate }: { candidate: RegionalCompanyCandidate }) {
  const locked = candidate.status === "promoted";

  return (
    <form className="rounded-lg border border-line bg-white p-5 shadow-soft" action={updateRegionalCandidate}>
      <input name="id" type="hidden" value={candidate.id} />
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-ink">{candidate.name}</h3>
            <StatusBadge status={candidate.status} />
            <ScorePill score={candidate.overall_score || 0} />
          </div>
          <div className="mt-2 text-sm text-muted">
            {candidate.postal_code || "PLZ offen"} {candidate.city || "Ort offen"} · {tradeLabel(candidate.possible_trade)}
          </div>
          <div className="mt-1 text-xs text-muted">
            Identität {candidate.identity_confidence || 0}/100 · Gewerk {candidate.trade_confidence || 0}/100 · Quelle:{" "}
            <a className="font-semibold text-brand hover:underline" href={candidate.possible_website || candidate.source_url} rel="noreferrer" target="_blank">
              {sourceLabel(candidate)}
            </a>
          </div>
          {candidate.duplicate_company ? (
            <Link className="mt-2 inline-flex rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-100" href={`/firma/${candidate.duplicate_company.slug}` as Route}>
              Dublettenverdacht: {candidate.duplicate_company.name}
            </Link>
          ) : null}
        </div>
        <div className="text-sm text-muted lg:max-w-sm">{reviewReason(candidate)}</div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <Field label="Name" name="name" defaultValue={candidate.name} disabled={locked} />
        <Field label="PLZ" name="postal_code" defaultValue={candidate.postal_code || ""} disabled={locked} />
        <Field label="Ort" name="city" defaultValue={candidate.city || ""} disabled={locked} />
        <Field label="Straße" name="street" defaultValue={candidate.street || ""} disabled={locked} />
        <Field label="Website" name="possible_website" defaultValue={candidate.possible_website || ""} disabled={locked} />
        <Field label="Telefon" name="phone" defaultValue={candidate.phone || ""} disabled={locked} />
        <Field label="E-Mail" name="email" defaultValue={candidate.email || ""} disabled={locked} />
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-normal text-muted">Gewerk</span>
          <select className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-panel" defaultValue={candidate.possible_trade || ""} disabled={locked} name="possible_trade">
            <option value="">Gewerk offen</option>
            {tradeTaxonomy.map((trade) => (
              <option key={trade.slug} value={trade.slug}>
                {trade.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-normal text-muted">Status</span>
          <select className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-panel" defaultValue={candidate.status} disabled={locked} name="status">
            {statuses.filter(([value]) => value).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50" disabled={locked} type="submit">
          Korrektur speichern
        </button>
        <button className="rounded-md border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50" disabled={locked} formAction={requestAcceptRegionalCandidateApproval}>
          Anlegen anfragen
        </button>
        <button className="rounded-md border border-yellow-300 px-4 py-2 text-sm font-semibold text-yellow-900 hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={locked} formAction={rejectRegionalCandidate}>
          Verwerfen
        </button>
        <button className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={locked} formAction={requestDeleteRegionalCandidateApproval}>
          Löschen anfragen
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">
        Anlegen und Löschen erzeugen nur eine Freigabeanforderung im Founder Cockpit. Es wird nichts automatisch ausgeführt.
      </p>
    </form>
  );
}

function Field({ label, name, defaultValue, disabled }: { label: string; name: string; defaultValue: string; disabled: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</span>
      <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-panel" defaultValue={defaultValue} disabled={disabled} name={name} />
    </label>
  );
}

function CoverageRow({ snapshot }: { snapshot: CoverageSnapshot }) {
  return (
    <tr>
      <td className="px-4 py-4 font-semibold text-ink">{snapshot.trades?.name || snapshot.trade_id}</td>
      <td className="px-4 py-4 text-muted">{snapshot.found_companies}</td>
      <td className="px-4 py-4 text-muted">{snapshot.candidate_companies}</td>
      <td className="px-4 py-4 text-muted">{snapshot.estimated_companies}</td>
      <td className="px-4 py-4">
        <div className="h-2 rounded-full bg-panel">
          <div className="h-2 rounded-full bg-action" style={{ width: `${Math.min(100, snapshot.coverage_percent)}%` }} />
        </div>
        <div className="mt-1 text-xs font-semibold text-muted">{snapshot.coverage_percent}%</div>
      </td>
      <td className="px-4 py-4 text-muted">{snapshot.quality_average}/100</td>
    </tr>
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

function regionPillClass(active: boolean) {
  return active
    ? "rounded-md bg-brand px-3 py-2 font-semibold text-white"
    : "rounded-md border border-line bg-white px-3 py-2 font-semibold text-ink hover:bg-panel";
}

function ScorePill({ score }: { score: number }) {
  const tone = score >= 90 ? "border-green-200 bg-green-50 text-green-800" : score >= 60 ? "border-yellow-200 bg-yellow-50 text-yellow-800" : "border-line bg-panel text-muted";
  return <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}>{score}/100</span>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink">{statusLabel(status)}</span>;
}

function countStatus(items: RegionalCompanyCandidate[], status: string) {
  return items.filter((item) => item.status === status).length;
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function average(values: number[]) {
  const cleanValues = values.filter((value) => Number.isFinite(value));
  if (cleanValues.length === 0) return 0;
  return cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length;
}

function tradeLabel(slug: string | null) {
  if (!slug) return "Unbekannt";
  return tradeTaxonomy.find((trade) => trade.slug === slug)?.name || slug;
}

function sourceLabel(candidate: RegionalCompanyCandidate) {
  if (candidate.possible_website && hasConfirmedCompanyWebsite(candidate)) return "Eigene Website";
  const labels: Record<string, string> = {
    search_result: "Suchtreffer",
    directory_hint: "Hinweisquelle",
    external_directory: "Externe Fachseite",
    official_website: "Firmenwebsite",
  };
  return labels[candidate.source_type] || candidate.source_type;
}

function hasConfirmedCompanyWebsite(candidate: RegionalCompanyCandidate) {
  const evidence = candidate.raw_evidence as Record<string, unknown> | null;
  const websiteAnalysis = evidence?.website_analysis as Record<string, unknown> | undefined;
  return candidate.source_type === "official_website" || websiteAnalysis?.accepted === true || evidence?.website_candidate_confidence === "confirmed_by_website";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    discovered: "Entdeckt",
    website_found: "Website gefunden",
    enriched: "Angereichert",
    needs_review: "Review",
    rejected: "Verworfen",
    promoted: "Übernommen",
    ready_for_publish: "Publikationsreif",
  };
  return labels[status] || status;
}

function reviewReason(candidate: RegionalCompanyCandidate) {
  if (candidate.duplicate_of_company_id) return "Dublettenverdacht";
  if (!candidate.possible_website) return "Keine eigene bestätigte Website";
  if ((candidate.trade_confidence || 0) < 75) return "Gewerk unsicher";
  if ((candidate.overall_score || 0) < 90) return "Score erfordert Review";
  return "Finale Sichtprüfung empfohlen";
}
