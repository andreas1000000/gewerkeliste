import type { AgentApprovalRecord } from "@/lib/agents/persistence";

type AgentApprovalCardProps = {
  approval: AgentApprovalRecord;
  setStatusAction: (formData: FormData) => Promise<void>;
};

export function AgentApprovalCard({ approval, setStatusAction }: AgentApprovalCardProps) {
  const payload = approval.proposed_payload || {};
  const sourceTable = stringValue(payload.source_table);
  const sourceId = stringValue(payload.source_id);
  const requestedAction = stringValue(payload.requested_action);
  const guardrails = objectValue(payload.guardrails);
  const candidateSnapshot = objectValue(payload.candidate_snapshot);
  const requestedFields = objectValue(payload.requested_fields);
  const readableAction = getReadableAction(approval.action_type, requestedAction);

  return (
    <div className={`rounded-md border p-4 ${riskTone(approval.risk_level)}`}>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="text-xs font-semibold uppercase tracking-normal text-muted">Approval {approval.id}</div>
          <div className="mt-1 font-semibold text-ink">{approval.title}</div>
          <div className="mt-1 text-sm font-semibold text-brand">{readableAction}</div>
        </div>
        <span className="w-fit rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
          {approval.status}
        </span>
      </div>

      {isHighRisk(approval.risk_level) ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-900">
          Hohe Risikostufe: Diese Freigabe betrifft eine potenziell externe Wirkung. Statusfreigabe löst aktuell keine
          Ausführung aus.
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 text-xs text-muted md:grid-cols-2">
        <Meta label="Action Type" value={approval.action_type} />
        <Meta label="Risk Level" value={approval.risk_level} />
        <Meta label="Erstellt" value={formatDate(approval.created_at)} />
        <Meta label="Angefragt von" value={approval.requested_by || "nicht erfasst"} />
        <Meta label="Source Table" value={sourceTable || "nicht erfasst"} />
        <Meta label="Source ID" value={sourceId || "nicht erfasst"} />
      </div>

      {approval.description ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{approval.description}</p> : null}

      {candidateSnapshot || requestedFields ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {candidateSnapshot ? (
            <SummaryBox title="Betroffener Kandidat" values={compactObject(candidateSnapshot, ["name", "postal_code", "city", "possible_trade", "possible_website", "status"])} />
          ) : null}
          {requestedFields ? (
            <SummaryBox title="Angefragte Daten" values={compactObject(requestedFields, ["name", "postal_code", "city", "street", "possible_trade", "possible_website", "phone", "email"])} />
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 rounded-md border border-line bg-white p-3 text-xs leading-5 text-muted">
        <div className="font-semibold text-ink">Was passiert beim Klick?</div>
        <div>Status wird gesetzt. Es wird keine Firma angelegt, kein Kandidat gelöscht, keine E-Mail gesendet und nichts veröffentlicht.</div>
        {guardrails ? (
          <div className="mt-2">
            Guardrails:{" "}
            {compactObject(guardrails, Object.keys(guardrails))
              .map(({ label, value }) => `${label}: ${value}`)
              .join(" · ")}
          </div>
        ) : null}
      </div>

      <details className="mt-3 rounded-md border border-line bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink">Payload anzeigen</summary>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-muted">{JSON.stringify(payload, null, 2)}</pre>
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusFormButton action={setStatusAction} id={approval.id} status="approved" label="Status auf freigegeben setzen" />
        <StatusFormButton action={setStatusAction} id={approval.id} status="rejected" label="Status auf abgelehnt setzen" />
        <StatusFormButton action={setStatusAction} id={approval.id} status="expired" label="Status auf abgelaufen setzen" />
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-semibold text-ink">{label}:</span> {value}
    </div>
  );
}

function SummaryBox({ title, values }: { title: string; values: { label: string; value: string }[] }) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted">{title}</div>
      <dl className="mt-2 grid gap-1 text-xs text-muted">
        {values.map((item) => (
          <div key={item.label} className="grid grid-cols-[120px_1fr] gap-2">
            <dt className="font-semibold text-ink">{item.label}</dt>
            <dd className="break-words">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function getReadableAction(actionType: string, requestedAction: string) {
  if (requestedAction === "accept_regional_candidate") return "Anlegen eines Basis-Eintrags wurde angefragt - noch nicht ausgeführt";
  if (requestedAction === "delete_regional_candidate") return "Löschen eines Kandidaten wurde angefragt - noch nicht ausgeführt";
  if (actionType === "publish_company") return "Öffentliche Veröffentlichung angefragt - noch nicht ausgeführt";
  if (actionType === "delete_data") return "Datenlöschung angefragt - noch nicht ausgeführt";
  return "Freigabe angefragt - noch nicht ausgeführt";
}

function riskTone(riskLevel: string) {
  if (riskLevel === "critical") return "border-red-300 bg-red-50";
  if (riskLevel === "high") return "border-yellow-300 bg-yellow-50";
  return "border-line bg-panel";
}

function isHighRisk(riskLevel: string) {
  return riskLevel === "high" || riskLevel === "critical";
}

function compactObject(source: Record<string, unknown>, keys: string[]) {
  return keys
    .map((key) => ({ label: key, value: valueToString(source[key]) }))
    .filter((item) => item.value && item.value !== "nicht erfasst");
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function valueToString(value: unknown) {
  if (value === null || value === undefined || value === "") return "nicht erfasst";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
