import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Route } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ServiceCandidate = {
  company_id: string;
  company_name: string;
  city: string;
  trade_slug: string;
  trade_name: string;
  service_slug: string;
  service_name: string;
  confidence: "high" | "medium" | "low";
  source_field: string;
  evidence_text: string;
  reason: string;
  suggested_action: string;
  profile_url?: string;
};

type ServiceEnrichmentReport = {
  generated_at: string;
  summary: {
    reviewed_companies: number;
    candidates_total: number;
    by_confidence: Record<string, number>;
    service_pages_after_review: number;
    service_location_pages_after_review: number;
    conflicts_total: number;
  };
  candidates: ServiceCandidate[];
  conflicts: Array<{ company_id: string; term: string; type: string }>;
};

const REPORT_PATH = path.join(process.cwd(), "reports", "service-enrichment-dry-run-2026-07-01.json");
const CSV_DOWNLOAD_PATH = "/admin/service-enrichment/export";

export default async function AdminServiceEnrichmentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const report = await loadReport();
  const filters = {
    confidence: stringParam(params.confidence),
    service: stringParam(params.service),
    city: stringParam(params.city),
    trade: stringParam(params.trade),
    source: stringParam(params.source),
    query: stringParam(params.q),
  };
  const candidates = filterCandidates(report.candidates, report.conflicts, filters);
  const visible = candidates.slice(0, 250);
  const services = uniqueSorted(report.candidates.map((candidate) => candidate.service_slug));
  const cities = uniqueSorted(report.candidates.map((candidate) => candidate.city).filter(Boolean));
  const trades = uniqueSorted(report.candidates.map((candidate) => candidate.trade_slug));
  const sources = uniqueSorted(report.candidates.map((candidate) => candidate.source_field));

  return (
    <Shell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Leistungszuordnungen prüfen</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Read-only Review aus dem Service-Enrichment-Dry-Run. Diese Ansicht schreibt keine Daten und übernimmt keine
            Kandidaten in company_services.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href={CSV_DOWNLOAD_PATH as Route}>
            CSV herunterladen
          </Link>
          <Link className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href="/admin/agents">
            OS Start
          </Link>
        </div>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-6">
        <Metric label="Kandidaten" value={report.summary.candidates_total} />
        <Metric label="High" value={report.summary.by_confidence.high || 0} />
        <Metric label="Medium" value={report.summary.by_confidence.medium || 0} />
        <Metric label="Low" value={report.summary.by_confidence.low || 0} />
        <Metric label="Leistungsseiten" value={report.summary.service_pages_after_review} />
        <Metric label="Ort-Seiten" value={report.summary.service_location_pages_after_review} />
      </section>

      <section className="mb-6 rounded-lg border border-line bg-white p-4 shadow-soft">
        <h2 className="text-sm font-semibold text-ink">Review-Entscheidungen</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          {["AUTO_CANDIDATE_HIGH", "REVIEW_REQUIRED_MEDIUM", "DO_NOT_AUTO_APPLY_LOW", "AMBIGUOUS", "APPROVED", "REJECTED"].map((label) => (
            <span key={label} className="rounded-md border border-line bg-panel px-2.5 py-1 text-muted">
              {label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          Diese Seite bleibt read-only. APPROVED und REJECTED sind vorbereitete Review-Zustände; eine spätere Übernahme
          in company_services erfolgt nur einzeln und nach expliziter Admin-Freigabe.
        </p>
      </section>

      <form className="mb-6 grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft lg:grid-cols-[1fr_140px_170px_170px_170px_190px_auto]">
        <input className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={filters.query || ""} name="q" placeholder="Betrieb suchen" />
        <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={filters.confidence || ""} name="confidence">
          <option value="">High + Medium</option>
          <option value="high">Nur High</option>
          <option value="medium">Nur Medium</option>
          <option value="low">Nur Low</option>
          <option value="all">Alle inkl. Low</option>
        </select>
        <Select name="service" value={filters.service} label="Alle Leistungen" options={services} />
        <Select name="city" value={filters.city} label="Alle Orte" options={cities} />
        <Select name="trade" value={filters.trade} label="Alle Gewerke" options={trades} />
        <Select name="source" value={filters.source} label="Alle Quellen" options={sources} />
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Filtern</button>
      </form>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <div>
          {candidates.length} Treffer · Anzeige maximal {visible.length}. Low-Kandidaten sind standardmäßig ausgeblendet.
        </div>
        <div>Report: {formatDate(report.generated_at)}</div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-normal text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Betrieb</th>
              <th className="px-4 py-3 font-semibold">Gewerk / Leistung</th>
              <th className="px-4 py-3 font-semibold">Kategorie</th>
              <th className="px-4 py-3 font-semibold">Quelle</th>
              <th className="px-4 py-3 font-semibold">Evidence</th>
              <th className="px-4 py-3 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((candidate) => {
              const quality = qualityLabel(candidate, report.conflicts);
              return (
                <tr key={`${candidate.company_id}-${candidate.service_slug}-${candidate.source_field}`} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-ink">{candidate.company_name}</div>
                    <div className="text-sm text-muted">{candidate.city || "ohne Ort"}</div>
                    {candidate.profile_url ? (
                      <Link className="mt-1 inline-block text-xs font-semibold text-brand hover:underline" href={candidate.profile_url as Route}>
                        Profil ansehen
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-ink">{candidate.service_name}</div>
                    <div className="mt-1 text-xs text-muted">{candidate.service_slug}</div>
                    <div className="mt-2 rounded-md border border-line bg-panel px-2 py-1 text-xs font-semibold text-ink">
                      {candidate.trade_name || candidate.trade_slug}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <ConfidenceBadge confidence={candidate.confidence} />
                    <div className="mt-2 text-xs font-semibold text-muted">{quality}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted">{candidate.source_field}</td>
                  <td className="max-w-xl px-4 py-4">
                    <p className="text-sm leading-6 text-ink">{candidate.evidence_text || "Keine Evidence"}</p>
                    <p className="mt-2 text-xs leading-5 text-muted">{candidate.reason}</p>
                  </td>
                  <td className="px-4 py-4">
                    <button className="w-full cursor-not-allowed rounded-md border border-line bg-panel px-3 py-2 text-xs font-semibold text-muted" disabled>
                      Nur Review
                    </button>
                    <div className="mt-2 text-xs leading-5 text-muted">{candidate.suggested_action}</div>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={6}>
                  Keine Kandidaten gefunden.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

async function loadReport() {
  const raw = await readFile(REPORT_PATH, "utf8");
  return JSON.parse(raw) as ServiceEnrichmentReport;
}

function filterCandidates(
  candidates: ServiceCandidate[],
  conflicts: ServiceEnrichmentReport["conflicts"],
  filters: {
    confidence?: string;
    service?: string;
    city?: string;
    trade?: string;
    source?: string;
    query?: string;
  },
) {
  const query = filters.query?.toLowerCase();
  return candidates
    .filter((candidate) => {
      if (!filters.confidence && candidate.confidence === "low") return false;
      if (filters.confidence && filters.confidence !== "all" && candidate.confidence !== filters.confidence) return false;
      if (filters.service && candidate.service_slug !== filters.service) return false;
      if (filters.city && candidate.city !== filters.city) return false;
      if (filters.trade && candidate.trade_slug !== filters.trade) return false;
      if (filters.source && candidate.source_field !== filters.source) return false;
      if (query && !candidate.company_name.toLowerCase().includes(query)) return false;
      return true;
    })
    .sort((a, b) => sortConfidence(a.confidence) - sortConfidence(b.confidence) || ambiguityScore(a, conflicts) - ambiguityScore(b, conflicts));
}

function Select({ name, value, label, options }: { name: string; value?: string; label: string; options: string[] }) {
  return (
    <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue={value || ""} name={name}>
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
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

function ConfidenceBadge({ confidence }: { confidence: ServiceCandidate["confidence"] }) {
  const className =
    confidence === "high"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : confidence === "medium"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${className}`}>{confidence}</span>;
}

function qualityLabel(candidate: ServiceCandidate, conflicts: ServiceEnrichmentReport["conflicts"]) {
  if (candidate.confidence === "low") return "DO_NOT_AUTO_APPLY_LOW";
  if (ambiguityScore(candidate, conflicts) > 0) return "AMBIGUOUS";
  if (!candidate.evidence_text.trim()) return "INSUFFICIENT_EVIDENCE";
  if (candidate.confidence === "high") return "AUTO_CANDIDATE_HIGH";
  return "REVIEW_REQUIRED_MEDIUM";
}

function ambiguityScore(candidate: ServiceCandidate, conflicts: ServiceEnrichmentReport["conflicts"]) {
  return conflicts.filter((conflict) => conflict.company_id === candidate.company_id).length;
}

function sortConfidence(value: ServiceCandidate["confidence"]) {
  const order = { high: 0, medium: 1, low: 2 };
  return order[value] ?? 3;
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "de"));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
