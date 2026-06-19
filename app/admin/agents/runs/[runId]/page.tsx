import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { AgentApprovalCard } from "@/components/agent-approval-card";
import { getAgentRunDetail } from "@/lib/agents/persistence";
import { setAgentApprovalStatus, setAgentOutboxStatus, setAgentReviewStatus, setAgentTaskStatus } from "../../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ runId: string }>;
};

export default async function AgentRunDetailPage({ params }: PageProps) {
  const { runId } = await params;
  const detail = await getAgentRunDetail(runId);

  if (!detail) {
    notFound();
  }

  const summary = runSummary(detail.run.output);

  return (
    <Shell>
      <div className="mb-8">
        <Link className="text-sm font-semibold text-brand hover:underline" href={"/admin/agents" as Route}>
          Zurueck zum Founder Cockpit
        </Link>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Agent Run</p>
            <h1 className="mt-2 max-w-4xl text-3xl font-semibold text-ink">{detail.run.objective}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{summary}</p>
          </div>
          <div className="w-full rounded-lg border border-line bg-white p-4 shadow-soft lg:w-80">
            <Meta label="Status" value={detail.run.status} />
            <Meta label="Dry Run" value={detail.run.dry_run ? "ja" : "nein"} />
            <Meta label="Risiko" value={detail.run.risk_level} />
            <Meta label="Kostenstelle" value={detail.run.cost_center || "offen"} />
          </div>
        </div>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric label="Steps" value={detail.steps.length} />
        <Metric label="Tool Calls" value={detail.toolCalls.length} />
        <Metric label="Tasks" value={detail.tasks.length} />
        <Metric label="Kosten" value={`${sumCost(detail.costEvents)} EUR`} />
      </section>

      <section className="mb-6 rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Audit Summary</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Rein lesende Zusammenfassung aus gespeicherten Run-, Task-, Tool-, Review-, Approval-, Outbox- und Cost-Event-Daten.
          Nicht gespeicherte Informationen werden als unknown oder not recorded angezeigt.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Meta label="Run ID" value={detail.auditSummary.run_id} />
          <Meta label="Agent" value={detail.auditSummary.agent} />
          <Meta label="Status" value={detail.auditSummary.status} />
          <Meta label="Dry Run" value={detail.auditSummary.dry_run ? "true" : "false"} />
          <Meta label="Risk Level" value={detail.auditSummary.risk_level} />
          <Meta label="Cost Center" value={detail.auditSummary.cost_center} />
          <Meta label="Gestartet" value={formatRecordedDateTime(detail.auditSummary.started_at)} />
          <Meta label="Abgeschlossen" value={formatRecordedDateTime(detail.auditSummary.finished_at)} />
          <Meta label="Erzeugte Tasks" value={String(detail.auditSummary.created_tasks)} />
          <Meta label="Steps" value={String(detail.auditSummary.steps_count)} />
          <Meta label="Tool Calls" value={String(detail.auditSummary.tool_calls_count)} />
          <Meta label="Cost Events" value={String(detail.auditSummary.cost_events_count)} />
          <Meta label="Geschätzte Kosten" value={detail.auditSummary.estimated_cost} />
          <Meta label="Review Items" value={String(detail.auditSummary.review_items_count)} />
          <Meta label="Approvals" value={String(detail.auditSummary.approvals_count)} />
          <Meta label="Outbox Items" value={String(detail.auditSummary.outbox_items_count)} />
          <Meta label="Riskante Aktionen blockiert" value={detail.auditSummary.risky_actions_blocked} />
          <Meta label="Öffentliche Daten geändert" value={detail.auditSummary.public_data_changed} />
          <Meta label="E-Mails erzeugt/gesendet" value={detail.auditSummary.emails_created_or_sent} />
          <Meta label="Firmen/Claims/Verification geändert" value={detail.auditSummary.companies_claims_verification_changed} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ListBox title="Gelesene Tabellen" values={detail.auditSummary.read_tables} />
          <ListBox title="Geschriebene Tabellen" values={detail.auditSummary.written_tables} />
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Run-Metadaten</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Meta label="Run ID" value={detail.run.id} />
          <Meta label="Agent ID" value={detail.run.agent_id} />
          <Meta label="Agent" value={detail.run.agent_name} />
          <Meta label="Modus" value={detail.run.mode} />
          <Meta label="Gestartet" value={formatDateTime(detail.run.started_at)} />
          <Meta label="Beendet" value={formatDateTime(detail.run.finished_at)} />
          <Meta label="Geschaetzte Kosten" value={`${detail.run.estimated_cost} EUR`} />
          <Meta label="Tatsaechliche Kosten" value={`${detail.run.actual_cost} EUR`} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-6">
          <Panel title="Steps">
            <div className="grid gap-3">
              {detail.steps.map((step) => (
                <div key={step.id} className="rounded-md border border-line bg-panel p-4">
                  <div className="font-semibold text-ink">{step.step_name}</div>
                  <div className="mt-1 text-xs text-muted">
                    {step.step_key} · {step.status} · Confidence {step.confidence_score ?? "offen"}
                  </div>
                </div>
              ))}
              {empty(detail.steps, "Keine Steps gespeichert.")}
            </div>
          </Panel>

          <Panel title="Tool Calls">
            <div className="grid gap-3">
              {detail.toolCalls.map((toolCall) => (
                <div key={toolCall.id} className="rounded-md border border-line bg-panel p-4">
                  <div className="font-semibold text-ink">{toolCall.tool_name}</div>
                  <div className="mt-1 text-xs text-muted">
                    {toolCall.tool_class} · {toolCall.status} · {toolCall.actual_cost} EUR
                  </div>
                </div>
              ))}
              {empty(detail.toolCalls, "Keine Tool Calls gespeichert.")}
            </div>
          </Panel>

          <Panel title="Erzeugte Tasks">
            <div className="grid gap-3">
              {detail.tasks.map((task) => (
                <div key={task.id} className="rounded-md border border-line bg-panel p-4">
                  <div className="font-semibold text-ink">{task.title}</div>
                  <div className="mt-1 text-sm text-muted">{task.description}</div>
                  <div className="mt-2 text-xs text-muted">
                    {task.priority} · {task.status} · {task.regions?.name || "Region offen"} · {task.trades?.name || "Gewerk offen"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusFormButton action={setAgentTaskStatus} id={task.id} status="in_progress" label="In Pruefung" />
                    <StatusFormButton action={setAgentTaskStatus} id={task.id} status="completed" label="Erledigt" />
                    <StatusFormButton action={setAgentTaskStatus} id={task.id} status="cancelled" label="Abbrechen" />
                  </div>
                </div>
              ))}
              {empty(detail.tasks, "Keine Tasks aus diesem Run.")}
            </div>
          </Panel>
        </div>

        <aside className="grid gap-6 content-start">
          <Panel title="Kostenereignisse">
            <div className="grid gap-3">
              {detail.costEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-line bg-panel p-4">
                  <div className="font-semibold text-ink">{event.tool_name || event.provider || event.cost_center}</div>
                  <div className="mt-1 text-xs text-muted">
                    {event.agent_id} · {event.actual_cost} {event.currency}
                  </div>
                </div>
              ))}
              {empty(detail.costEvents, "Keine Kostenereignisse.")}
            </div>
          </Panel>

          <Panel title="Approvals">
            <div className="grid gap-3">
              {detail.approvals.map((approval) => (
                <AgentApprovalCard key={approval.id} approval={approval} setStatusAction={setAgentApprovalStatus} />
              ))}
              {empty(detail.approvals, "Keine Approvals fuer diesen Run.")}
            </div>
          </Panel>

          <Panel title="Review Items">
            <div className="grid gap-3">
              {detail.reviews.map((review) => (
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
                    <StatusFormButton action={setAgentReviewStatus} id={review.id} status="resolved" label="Geloest" />
                    <StatusFormButton action={setAgentReviewStatus} id={review.id} status="rejected" label="Verwerfen" />
                  </div>
                </div>
              ))}
              {empty(detail.reviews, "Keine Review Items fuer diesen Run.")}
            </div>
          </Panel>

          <Panel title="Outbox">
            <div className="grid gap-3">
              {detail.outbox.map((item) => (
                <div key={item.id} className="rounded-md border border-line bg-panel p-4">
                  <div className="font-semibold text-ink">{item.subject || "Entwurf ohne Betreff"}</div>
                  <div className="mt-1 text-xs text-muted">
                    {item.channel} · {item.recipient || "Empfaenger offen"} · {item.status}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusFormButton action={setAgentOutboxStatus} id={item.id} status="cancelled" label="Abbrechen" />
                    <StatusFormButton action={setAgentOutboxStatus} id={item.id} status="failed" label="Als Fehler markieren" />
                  </div>
                </div>
              ))}
              {empty(detail.outbox, "Keine Outbox Items fuer diesen Run.")}
            </div>
          </Panel>
        </aside>
      </div>
    </Shell>
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

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="text-3xl font-semibold text-brand">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

function ListBox({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-md border border-line bg-panel p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
            {value}
          </span>
        ))}
      </div>
    </div>
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

function empty(items: unknown[], message: string) {
  if (items.length) return null;
  return <div className="rounded-md border border-dashed border-line bg-panel p-4 text-sm text-muted">{message}</div>;
}

function formatDateTime(value: string | null) {
  if (!value) return "offen";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatRecordedDateTime(value: string) {
  if (value === "not recorded" || value === "unknown" || value === "not applicable") return value;
  return formatDateTime(value);
}

function sumCost(events: { actual_cost: number; currency: string }[]) {
  return events.reduce((sum, event) => sum + Number(event.actual_cost || 0), 0).toFixed(2);
}

function runSummary(output: Record<string, unknown>) {
  const summary = typeof output.summary === "string" ? output.summary : "";
  if (summary) return summary;

  const findings = typeof output.findings_count === "number" ? output.findings_count : null;
  const tasks = typeof output.tasks_count === "number" ? output.tasks_count : null;
  if (findings !== null || tasks !== null) {
    return `Dry Run mit ${findings ?? "offen"} Findings und ${tasks ?? "offen"} abgeleiteten Tasks.`;
  }

  return "Gespeicherter Agentenlauf mit Audit-Daten, Schritten, Werkzeugen, Aufgaben und Kostenereignissen.";
}
