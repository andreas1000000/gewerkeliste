import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { approveResearchCandidate, setResearchCandidateStatus } from "@/lib/actions";
import { getResearchCandidate, getResearchCandidateDuplicates } from "@/lib/data";
import type { ResearchCompanyCandidate } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResearchCandidateDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  try {
    const candidate = await getResearchCandidate(id);
    const duplicates = await getResearchCandidateDuplicates(candidate);
    const approvedSlug = typeof query.approved === "string" ? query.approved : null;
    const markedDuplicate = typeof query.duplicate === "string";

    return (
      <Shell>
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link className="text-sm font-semibold text-brand hover:underline" href="/admin/research-imports">
              Zurück zur Recherche
            </Link>
            <h1 className="mt-2 text-3xl font-semibold text-ink">{candidate.company_name}</h1>
            <p className="mt-2 text-sm text-muted">
              {candidate.trade_name} · {candidate.postal_code} {candidate.city} · Quelle abgerufen am{" "}
              {formatDate(candidate.source_retrieved_at)}
            </p>
          </div>
          <StatusBadge status={candidate.status} />
        </div>

        {approvedSlug ? (
          <div className="mb-6 rounded-lg border border-[#b9e2c2] bg-[#f2fbf4] p-4 text-sm font-semibold text-[#245b37]">
            Öffentlicher unbestätigter Basis-Eintrag erzeugt:
            <Link className="ml-1 underline" href={`/firma/${approvedSlug}` as Route}>
              Profil ansehen
            </Link>
          </div>
        ) : null}

        {markedDuplicate ? (
          <div className="mb-6 rounded-lg border border-[#f1d08a] bg-[#fff8e8] p-4 text-sm font-semibold text-[#6d4a00]">
            Kandidat wurde als Dublette markiert. Es wurde kein öffentlicher Eintrag erzeugt.
          </div>
        ) : null}

        <section className="mb-6 grid gap-4 lg:grid-cols-4">
          <InfoCard title="Status" value={statusLabel(candidate.status)} />
          <InfoCard title="Score" value={`${candidate.confidence_score}/100`} />
          <InfoCard title="Quelle" value={candidate.source_label} />
          <InfoCard title="Batch" value={candidate.research_import_batches?.name || "Ohne Batch"} />
        </section>

        {duplicates.length > 0 ? (
          <section className="mb-6 rounded-lg border border-[#f1d08a] bg-[#fff8e8] p-5">
            <h2 className="text-lg font-semibold text-[#6d4a00]">Mögliche Dubletten</h2>
            <div className="mt-4 grid gap-3">
              {duplicates.map((company) => (
                <div key={company.id} className="rounded-md border border-[#f1d08a] bg-white p-4 text-sm">
                  <div className="font-semibold text-ink">{company.name}</div>
                  <div className="text-muted">
                    {company.postal_code} {company.city} · {company.reason}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link className="text-brand hover:underline" href={`/firma/${company.slug}` as Route}>
                      Bestehenden Eintrag ansehen
                    </Link>
                    <form action={approveResearchCandidate}>
                      <input name="id" type="hidden" value={candidate.id} />
                      <input name="duplicate_company_id" type="hidden" value={company.id} />
                      <button className="font-semibold text-[#6d4a00] hover:underline">Als Dublette markieren</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-6">
            <ReadSection title="Öffentliche Betriebsdaten">
              <Data label="Firmenname" value={candidate.company_name} />
              <Data label="Gewerk" value={candidate.trade_name} />
              <Data label="Website" value={candidate.website} />
              <Data label="Telefon" value={candidate.phone} />
              <Data label="E-Mail" value={candidate.email} />
              <Data label="Adresse" value={[candidate.street, candidate.postal_code, candidate.city].filter(Boolean).join(", ")} />
              <Data label="Koordinaten" value={candidate.latitude && candidate.longitude ? `${candidate.latitude}, ${candidate.longitude}` : null} />
              <Data label="Kurzbeschreibung" value={candidate.short_description} multiline />
            </ReadSection>

            <ReadSection title="Quelle und Datenschutz">
              <Data label="Quelle" value={candidate.source_label} />
              <Data label="URL" value={candidate.source_url} />
              <Data label="Abrufdatum" value={formatDate(candidate.source_retrieved_at)} />
              <Data label="Öffentliche Daten" value={candidate.public_data_only ? "ja" : "prüfen"} />
              <Data label="Quellenauszug" value={candidate.source_excerpt} multiline />
              <Data label="Datenschutznotiz" value={candidate.privacy_notes} multiline />
            </ReadSection>
          </div>

          <aside className="grid content-start gap-6">
            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Status setzen</h2>
              <form action={setResearchCandidateStatus} className="mt-4 grid gap-3">
                <input name="id" type="hidden" value={candidate.id} />
                <select className="rounded-md border border-line px-3 py-2 text-sm" name="status" defaultValue={candidate.status}>
                  <option value="found">Gefunden</option>
                  <option value="validated">Validiert</option>
                  <option value="duplicate">Dublette</option>
                  <option value="rejected">Abgelehnt</option>
                </select>
                <textarea className="min-h-20 rounded-md border border-line px-3 py-2 text-sm" name="admin_notes" placeholder="Interne Notiz" defaultValue={candidate.admin_notes || ""} />
                <textarea className="min-h-20 rounded-md border border-line px-3 py-2 text-sm" name="rejected_reason" placeholder="Ablehnungsgrund, falls relevant" defaultValue={candidate.rejected_reason || ""} />
                <button disabled={candidate.status === "approved"} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  Status speichern
                </button>
              </form>
            </section>

            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Als Basis-Eintrag freigeben</h2>
              <div className="mt-4 rounded-md border border-line bg-panel p-4 text-sm leading-6 text-ink">
                <div><strong>Status danach:</strong> öffentlich, unbestätigt, nicht verifiziert</div>
                <div><strong>Claim:</strong> Betrieb kann Eintrag übernehmen</div>
                <div><strong>Quelle:</strong> wird intern protokolliert</div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">
                Es wird kein Verifiziert-Badge gesetzt. Der Eintrag enthält einen Hinweis auf öffentlich zugängliche
                Gewerbedaten und Korrektur-/Löschmöglichkeit.
              </p>
              <form action={approveResearchCandidate} className="mt-4 grid gap-3">
                <input name="id" type="hidden" value={candidate.id} />
                <textarea className="min-h-20 rounded-md border border-line px-3 py-2 text-sm" name="admin_notes" placeholder="Freigabenotiz" defaultValue={candidate.admin_notes || ""} />
                <button disabled={candidate.status === "approved" || candidate.status === "duplicate" || candidate.status === "rejected"} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  Öffentlichen Basis-Eintrag erzeugen
                </button>
              </form>
            </section>
          </aside>
        </div>
      </Shell>
    );
  } catch {
    notFound();
  }
}

function ReadSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <dl className="mt-4 grid gap-3">{children}</dl>
    </section>
  );
}

function Data({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</dt>
      <dd className={`break-words text-sm text-ink ${multiline ? "whitespace-pre-line leading-6" : ""}`}>{value || "Nicht angegeben"}</dd>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="text-sm font-medium text-muted">{title}</div>
      <div className="mt-2 text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className="w-fit rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">{statusLabel(status)}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
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
