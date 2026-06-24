import Link from "next/link";
import type { Route } from "next";
import { Shell } from "@/components/shell";
import { agentOsTablesAvailableError, getAgentCockpitData } from "@/lib/agents/persistence";
import { startMunicipalityDiscovery } from "./actions";

export const dynamic = "force-dynamic";

export default async function MunicipalityDiscoveryPage() {
  const cockpit = await loadCockpitData();
  const recentRuns = (cockpit.persisted?.runs || []).filter((run) => run.agent_id === "municipality-discovery-agent").slice(0, 8);

  return (
    <Shell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Municipality Discovery Agent</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Gemeinde starten</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Starte einen kontrollierten Agentenlauf fuer eine Gemeinde. Der Agent nutzt vorhandene Kandidaten, klassifiziert Tier A/B/C,
            erzeugt Review Items, Freigaben oder begrenzte unbestaetigte Basis-Eintraege. E-Mails werden nie automatisch gesendet.
          </p>
        </div>
        <Link className="w-fit rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href="/admin/agents">
          Zurueck ins Cockpit
        </Link>
      </div>

      {cockpit.migrationMissing ? (
        <section className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-950">
          <h2 className="font-semibold">Agent-OS-Tabellen fehlen</h2>
          <p className="mt-1 leading-6">Der Gemeinde-Agent benoetigt agent_runs, agent_review_items, agent_approvals und agent_outbox.</p>
        </section>
      ) : null}

      <section className="mb-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form action={startMunicipalityDiscovery} className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Gemeinde / Stadt">
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue="Bad Aibling" name="municipality" required />
            </Field>
            <Field label="Landkreis / Region">
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue="Landkreis Rosenheim" name="county" />
            </Field>
            <Field label="Gewerke-Scope">
              <select className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue="prio1" name="trade_scope">
                <option value="prio1">Prio 1 Gewerke</option>
                <option value="all">Alle gespeicherten Kandidaten</option>
                <option value="elektroinstallation">Einzelnes Gewerk: Elektroinstallation</option>
                <option value="sanitaer-heizung-klima">Einzelnes Gewerk: SHK</option>
                <option value="maurerarbeiten">Einzelnes Gewerk: Maurerarbeiten</option>
                <option value="dachdeckerarbeiten">Einzelnes Gewerk: Dachdeckerarbeiten</option>
              </select>
            </Field>
            <Field label="Publish-Modus">
              <select className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue="manual_approval" name="publish_mode">
                <option value="manual_approval">manual_approval - Freigaben erzeugen</option>
                <option value="review_only">review_only - nur Review</option>
                <option value="tier_a_unverified_basis">tier_a_unverified_basis - Tier A begrenzt live</option>
              </select>
            </Field>
            <Field label="E-Mail-Modus">
              <select className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue="draft_only" name="email_mode">
                <option value="draft_only">draft_only - Entwuerfe, kein Versand</option>
                <option value="none">none - keine Entwuerfe</option>
                <option disabled value="send_after_approval">
                  send_after_approval - dokumentiert, noch nicht aktiv
                </option>
              </select>
            </Field>
            <Field label="Max. Queries">
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue="20" min="0" max="500" name="max_queries" type="number" />
            </Field>
            <Field label="Max. Veroeffentlichungen">
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue="5" min="0" max="250" name="max_publications" type="number" />
            </Field>
            <Field label="Max. Kosten EUR">
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" defaultValue="1" min="0" max="25" name="max_cost_eur" step="0.5" type="number" />
            </Field>
          </div>

          <div className="mt-5 rounded-md border border-line bg-panel p-4 text-sm leading-6 text-muted">
            <strong className="text-ink">Sicherheitslogik:</strong> Dry Run veroeffentlicht nichts. Manual Approval erzeugt nur Freigaben.
            Tier-A-Live legt nur unbestaetigte Basis-Eintraege bis zum Limit an. E-Mails bleiben Outbox-Entwuerfe.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-md border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
              disabled={cockpit.migrationMissing}
              name="intent"
              type="submit"
              value="dry_run"
            >
              Dry Run starten
            </button>
            <button
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#265a4d] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={cockpit.migrationMissing}
              name="intent"
              type="submit"
              value="run"
            >
              Agent mit Freigabe starten
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">Was passiert beim Start?</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <Guardrail title="Tier A" body="Plausibler Firmenname, Ort, Gewerk, Quelle und keine Dublette. Nur diese Kandidaten duerfen bei bewusstem Live-Modus als unbestaetigte Basis-Eintraege entstehen." />
            <Guardrail title="Tier B" body="Bleibt im Review. Typisch: schwache Quelle, unsicheres Gewerk oder moegliche Dublette." />
            <Guardrail title="Tier C" body="Wird blockiert. Behoerden, News, Toplisten, Google-Maps-Scrapes oder private Daten werden nicht veroeffentlicht." />
            <Guardrail title="E-Mail" body="Drafts nur in agent_outbox. Kein automatischer Versand, keine Massen-E-Mail." />
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Letzte Gemeinde-Runs</h2>
        <div className="mt-4 grid gap-3">
          {recentRuns.map((run) => (
            <div key={run.id} className="rounded-md border border-line bg-panel p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <Link className="font-semibold text-ink hover:text-brand hover:underline" href={`/admin/agents/runs/${run.id}` as Route}>
                    {run.objective}
                  </Link>
                  <div className="mt-1 text-xs text-muted">
                    {run.mode} · {run.status} · {formatDate(run.created_at)}
                  </div>
                </div>
                <span className="rounded-full border border-line bg-white px-2 py-1 text-xs font-semibold text-muted">{run.actual_cost} EUR</span>
              </div>
            </div>
          ))}
          {recentRuns.length === 0 ? <div className="rounded-md border border-dashed border-line bg-panel p-4 text-sm text-muted">Noch kein Gemeinde-Run gespeichert.</div> : null}
        </div>
      </section>
    </Shell>
  );
}

async function loadCockpitData() {
  try {
    return { migrationMissing: false, persisted: await getAgentCockpitData() };
  } catch (error) {
    if (agentOsTablesAvailableError(error)) return { migrationMissing: true, persisted: null };
    throw error;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm font-semibold text-ink">
      {label}
      {children}
    </label>
  );
}

function Guardrail({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <div className="font-semibold text-ink">{title}</div>
      <p className="mt-1 leading-6">{body}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
