import { Shell } from "@/components/shell";
import type { Route } from "next";
import Link from "next/link";
import { AgentApprovalCard } from "@/components/agent-approval-card";
import { agentRegistry } from "@/lib/agents/agent-registry";
import { agentOsTablesAvailableError, getAgentCockpitData } from "@/lib/agents/persistence";
import { runCompanyDiscoveryDryRun } from "@/lib/agents/company-discovery";
import { runRegionalCoverageDryRun } from "@/lib/agents/regional-coverage";
import {
  persistRiederingCoverageDryRun,
  persistRiederingDiscoveryDryRun,
  setAgentApprovalStatus,
  setAgentOutboxStatus,
  setAgentReviewStatus,
  setAgentTaskStatus,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const cockpit = await loadCockpit();

  return (
    <Shell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Agent Operating System</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Founder Cockpit</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Kontrollierte Agenten-Firma fuer regionale Abdeckung, Datenqualitaet, Freigaben und spaetere Automatisierung.
            Riskante Aktionen bleiben Human-in-the-Loop.
          </p>
        </div>
        <a className="w-fit rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href="/admin/coverage">
          Coverage Review
        </a>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-5">
        <Metric label="Registrierte Agenten" value={agentRegistry.length} />
        <Metric label="Aktiv" value={agentRegistry.filter((agent) => agent.enabled).length} />
        <Metric label="Gespeicherte Runs" value={cockpit.persisted?.counts.runs || 0} />
        <Metric label="Offene Freigaben" value={cockpit.persisted?.counts.approvals || 0} />
        <Metric label="Offene Reviews" value={cockpit.persisted?.counts.reviews || 0} />
      </section>

      {cockpit.migrationMissing ? (
        <section className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-950">
          <h2 className="font-semibold">Agent-OS-Migration noch nicht aktiv</h2>
          <p className="mt-1 leading-6">
            Die Registry und der Coverage-Dry-Run funktionieren read-only. Persistente Runs, Tool Calls, Tasks,
            Approvals, Reviews, Outbox und Kostenereignisse benoetigen die Migration{" "}
            <strong>20260618001000_agent_operating_system.sql</strong>. Ich habe sie nicht angewendet, weil keine
            eindeutig lokale/dev-Supabase-Umgebung erkennbar war.
          </p>
        </section>
      ) : null}

      <section className="mb-6 rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-semibold text-ink">Regional Coverage Dry Run</h2>
            <p className="mt-1 text-sm text-muted">
              Region Riedering wird gelesen und bewertet. Speichern erzeugt nur interne Agent-Runs und Agent-Tasks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={persistRiederingCoverageDryRun}>
              <button
                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#265a4d] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={cockpit.migrationMissing || Boolean(cockpit.coverageError)}
                type="submit"
              >
                Coverage Dry Run speichern
              </button>
            </form>
            <form action={persistRiederingDiscoveryDryRun}>
              <button
                className="rounded-md border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
                disabled={cockpit.migrationMissing || Boolean(cockpit.discoveryError)}
                type="submit"
              >
                Discovery Dry Run speichern
              </button>
            </form>
          </div>
        </div>
        <p className="mb-4 rounded-md border border-line bg-panel p-3 text-xs font-semibold text-muted">
          Discovery Dry Run nutzt nur lokale Daten. Keine Websuche, keine externe API, keine Firmenanlage, keine E-Mail.
        </p>
        {cockpit.coverageError ? (
          <pre className="overflow-auto rounded-md bg-panel p-4 text-xs text-muted">{cockpit.coverageError}</pre>
        ) : (
          <>
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              {cockpit.coverage?.guardrails.map((guardrail) => (
                <div key={guardrail} className="rounded-md border border-line bg-panel p-3 text-xs font-semibold text-muted">
                  {guardrail}
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-md border border-line">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-panel text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Gewerk</th>
                    <th className="px-4 py-3">Öffentlich</th>
                    <th className="px-4 py-3">Kandidaten</th>
                    <th className="px-4 py-3">Ziel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Nächste Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cockpit.coverage?.findings.slice(0, 20).map((finding) => (
                    <tr key={finding.trade_slug}>
                      <td className="px-4 py-3 font-semibold text-ink">{finding.trade_name}</td>
                      <td className="px-4 py-3 text-muted">{finding.found_companies}</td>
                      <td className="px-4 py-3 text-muted">{finding.candidate_companies}</td>
                      <td className="px-4 py-3 text-muted">{finding.estimated_companies ?? "Baseline offen"}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={finding.status} />
                      </td>
                      <td className="px-4 py-3 text-muted">{finding.next_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Gespeicherte Agent Runs">
          <div className="grid gap-3">
            {(cockpit.persisted?.runs || []).map((run) => (
              <div key={run.id} className="rounded-md border border-line bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link className="font-semibold text-ink hover:text-brand hover:underline" href={`/admin/agents/runs/${run.id}` as Route}>
                      {run.objective}
                    </Link>
                    <div className="mt-1 text-xs text-muted">
                      {run.agent_name} · {run.mode} · {run.status} · {formatDate(run.created_at)}
                    </div>
                  </div>
                  <span className="rounded-full border border-line bg-white px-2 py-1 text-xs font-semibold text-muted">{run.actual_cost} EUR</span>
                </div>
              </div>
            ))}
            {empty(cockpit.persisted?.runs, "Noch keine gespeicherten Agent Runs.")}
          </div>
        </Panel>

        <Panel title="Gespeicherte Agent Tasks">
          <div className="grid gap-3">
            {(cockpit.persisted?.tasks || []).map((task) => (
              <div key={task.id} className="rounded-md border border-line bg-panel p-4">
                <div className="font-semibold text-ink">{task.title}</div>
                <div className="mt-1 text-sm text-muted">{task.description}</div>
                <div className="mt-2 text-xs text-muted">
                  {task.priority} · {task.status} · {task.regions?.name || "Region offen"} · {task.trades?.name || "Gewerk offen"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusFormButton action={setAgentTaskStatus} id={task.id} status="in_progress" label="In Prüfung" />
                  <StatusFormButton action={setAgentTaskStatus} id={task.id} status="completed" label="Erledigt" />
                  <StatusFormButton action={setAgentTaskStatus} id={task.id} status="cancelled" label="Abbrechen" />
                </div>
              </div>
            ))}
            {empty(cockpit.persisted?.tasks, "Keine offenen Agent Tasks.")}
          </div>
        </Panel>
      </section>

      <section className="mb-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Run Steps">
          <div className="grid gap-3">
            {(cockpit.persisted?.steps || []).map((step) => (
              <div key={step.id} className="rounded-md border border-line bg-panel p-4">
                <div className="font-semibold text-ink">{step.step_name}</div>
                <div className="mt-1 text-xs text-muted">
                  {step.step_key} · {step.status} · Confidence {step.confidence_score ?? "offen"}
                </div>
              </div>
            ))}
            {empty(cockpit.persisted?.steps, "Noch keine gespeicherten Run Steps.")}
          </div>
        </Panel>

        <Panel title="Tool Calls">
          <div className="grid gap-3">
            {(cockpit.persisted?.toolCalls || []).map((toolCall) => (
              <div key={toolCall.id} className="rounded-md border border-line bg-panel p-4">
                <div className="font-semibold text-ink">{toolCall.tool_name}</div>
                <div className="mt-1 text-xs text-muted">
                  {toolCall.tool_class} · {toolCall.status} · {toolCall.actual_cost} EUR
                </div>
              </div>
            ))}
            {empty(cockpit.persisted?.toolCalls, "Noch keine gespeicherten Tool Calls.")}
          </div>
        </Panel>

        <Panel title="Kostenereignisse">
          <div className="grid gap-3">
            {(cockpit.persisted?.costEvents || []).map((event) => (
              <div key={event.id} className="rounded-md border border-line bg-panel p-4">
                <div className="font-semibold text-ink">{event.tool_name || event.provider || event.cost_center}</div>
                <div className="mt-1 text-xs text-muted">
                  {event.agent_id} · {event.actual_cost} {event.currency}
                </div>
              </div>
            ))}
            {empty(cockpit.persisted?.costEvents, "Noch keine Kostenereignisse.")}
          </div>
        </Panel>
      </section>

      <section className="mb-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Approvals">
          <div className="grid gap-3">
            {(cockpit.persisted?.approvals || []).map((approval) => (
              <AgentApprovalCard key={approval.id} approval={approval} setStatusAction={setAgentApprovalStatus} />
            ))}
            {empty(cockpit.persisted?.approvals, "Keine offenen Freigaben.")}
          </div>
        </Panel>

        <Panel title="Reviews">
          <div className="grid gap-3">
            {(cockpit.persisted?.reviews || []).map((review) => (
              <div key={review.id} className="rounded-md border border-line bg-panel p-4">
                <div className="font-semibold text-ink">{review.title}</div>
                <div className="mt-1 text-xs text-muted">
                  {review.review_type} · {review.severity} · {review.status}
                </div>
                {review.review_type === "company_discovery_candidate" ? (
                  <p className="mt-3 rounded-md border border-line bg-white p-3 text-xs font-semibold leading-5 text-muted">
                    Internes Review Item. Keine Firma wurde veröffentlicht.
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusFormButton action={setAgentReviewStatus} id={review.id} status="in_review" label="In Review" />
                  <StatusFormButton action={setAgentReviewStatus} id={review.id} status="resolved" label="Gelöst" />
                  <StatusFormButton action={setAgentReviewStatus} id={review.id} status="rejected" label="Verworfen" />
                </div>
              </div>
            ))}
            {empty(cockpit.persisted?.reviews, "Keine Review Items.")}
          </div>
        </Panel>

        <Panel title="Outbox">
          <div className="grid gap-3">
            {(cockpit.persisted?.outbox || []).map((item) => (
              <div key={item.id} className="rounded-md border border-line bg-panel p-4">
                <div className="font-semibold text-ink">{item.subject || "Entwurf ohne Betreff"}</div>
                <div className="mt-1 text-xs text-muted">
                  {item.channel} · {item.recipient || "Empfänger offen"} · {item.status}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusFormButton action={setAgentOutboxStatus} id={item.id} status="cancelled" label="Abbrechen" />
                  <StatusFormButton action={setAgentOutboxStatus} id={item.id} status="failed" label="Als Fehler markieren" />
                </div>
              </div>
            ))}
            {empty(cockpit.persisted?.outbox, "Keine Outbox-Entwürfe.")}
          </div>
        </Panel>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Agent Registry</h2>
        <div className="mt-4 grid gap-3">
          {agentRegistry.map((agent) => (
            <article key={agent.agent_id} className="rounded-md border border-line p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{agent.name}</h3>
                    <span className="rounded-full border border-line px-2 py-1 text-xs font-semibold text-muted">{agent.department}</span>
                    <span className="rounded-full border border-line px-2 py-1 text-xs font-semibold text-muted">{agent.autonomy_level}</span>
                  </div>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">{agent.mission}</p>
                </div>
                <span className={agent.enabled ? "text-sm font-semibold text-green-700" : "text-sm font-semibold text-muted"}>
                  {agent.enabled ? "aktiv" : "vorbereitet"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.allowed_tools.map((tool) => (
                  <span key={tool} className="rounded-md bg-panel px-2 py-1 text-xs font-semibold text-muted">
                    {tool}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}

async function loadCockpit() {
  const base = {
    migrationMissing: false,
    coverage: null as Awaited<ReturnType<typeof runRegionalCoverageDryRun>> | null,
    coverageError: "",
    discovery: null as Awaited<ReturnType<typeof runCompanyDiscoveryDryRun>> | null,
    discoveryError: "",
    persisted: null as Awaited<ReturnType<typeof getAgentCockpitData>> | null,
  };

  try {
    base.coverage = await runRegionalCoverageDryRun({ regionSlug: "riedering" });
  } catch (error) {
    base.coverageError = error instanceof Error ? error.message : String(error);
  }

  try {
    base.discovery = await runCompanyDiscoveryDryRun({ regionSlug: "riedering" });
  } catch (error) {
    base.discoveryError = error instanceof Error ? error.message : String(error);
  }

  try {
    base.persisted = await getAgentCockpitData();
  } catch (error) {
    if (agentOsTablesAvailableError(error)) {
      base.migrationMissing = true;
    } else {
      throw error;
    }
  }

  return base;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="text-3xl font-semibold text-brand">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusFormButton({
  action,
  id,
  status,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  status: string;
  label: string;
}) {
  return (
    <form action={action}>
      <input name="id" type="hidden" value={id} />
      <input name="status" type="hidden" value={status} />
      <button className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-panel" type="submit">
        {label}
      </button>
    </form>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "good"
      ? "border-green-200 bg-green-50 text-green-800"
      : status === "kritisch"
        ? "border-red-200 bg-red-50 text-red-800"
        : status === "nacharbeiten"
          ? "border-yellow-200 bg-yellow-50 text-yellow-900"
          : "border-line bg-panel text-muted";

  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function empty(items: unknown[] | undefined, message: string) {
  if (items?.length) return null;
  return <div className="rounded-md border border-dashed border-line bg-panel p-4 text-sm text-muted">{message}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
