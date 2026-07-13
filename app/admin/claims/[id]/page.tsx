import Link from "next/link";
import type { Route } from "next";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Shell } from "@/components/shell";
import { approveClaim, decideClaim, revokeMembership } from "@/lib/actions";
import { getCompanyClaimDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminClaimDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const detail = await getCompanyClaimDetail(id);
  const success = typeof query.approved === "string" || typeof query.decided === "string";
  const error = typeof query.error === "string" ? query.error : null;

  return (
    <Shell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link className="text-sm font-semibold text-brand hover:underline" href="/admin/claims">
            Zurück zu Übernahmeanträgen
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-normal text-brand">Claim-Detailprüfung</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{detail.company.name}</h1>
          <p className="mt-2 text-sm text-muted">{detail.company.postal_code} {detail.company.city} · Status: {detail.claim.status}</p>
        </div>
        <Link className="w-fit rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href={`/firma/${detail.company.slug}` as Route}>
          Öffentliches Profil öffnen
        </Link>
      </div>

      {success ? <p className="mb-6 rounded-md border border-[#b9dec8] bg-[#f1fbf5] px-4 py-3 text-sm font-semibold text-[#24523a]">Die Entscheidung wurde gespeichert. Es wurde keine automatische Qualitätsbewertung oder Verifizierung ausgelöst.</p> : null}
      {error ? <p className="mb-6 rounded-md border border-[#e1b0a5] bg-[#fff5f2] px-4 py-3 text-sm font-semibold text-[#8e2f1f]">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <Section title="Antragsteller">
            <Data label="Name" value={detail.claim.name} />
            <Data label="Authentifizierte E-Mail" value={detail.claim.email} />
            <Data label="E-Mail verifiziert" value={detail.claim.email_verified_at ? `ja · ${formatDate(detail.claim.email_verified_at)}` : "nein / nicht belegt"} />
            <Data label="Funktion" value={detail.claim.verification_notes?.split("\n")[0] || "nicht angegeben"} />
            <Data label="Vertretungsprüfung" value={detail.claim.message} multiline />
            <Data label="Verifikationsmethode" value={detail.claim.verification_method || "nicht angegeben"} />
          </Section>

          <Section title="Bestehende Unternehmensdaten">
            <Data label="Betrieb" value={detail.company.name} />
            <Data label="Adresse" value={`${detail.company.street || ""} · ${detail.company.postal_code} ${detail.company.city}`} />
            <Data label="Website" value={detail.company.website_url} />
            <Data label="Öffentliche E-Mail" value={detail.company.email} />
            <Data label="Claim-Status" value={detail.company.claim_status} />
            <Data label="Verifiziert" value={detail.company.verified ? "ja" : "nein"} />
          </Section>

          <Section title="Verknüpfte Einreichung">
            <Data label="Submission-ID" value={detail.submission?.id || "nicht vorhanden"} />
            <Data label="Status" value={detail.submission?.status || "nicht vorhanden"} />
            <Data label="Quelle" value={detail.submission?.source || "nicht vorhanden"} />
            <Data label="Gespeicherte Änderungen" value={detail.submission?.description || "Keine zusätzlichen Änderungen."} multiline />
          </Section>

          <Section title="Weitere Claims für diesen Betrieb">
            {detail.relatedClaims.length ? (
              <div className="grid gap-3">
                {detail.relatedClaims.map((claim) => (
                  <div className="rounded-md border border-line bg-panel p-3 text-sm" key={claim.id}>
                    <div className="font-semibold text-ink">{claim.name} · {claim.status}</div>
                    <div className="mt-1 text-muted">Eingegangen {formatDate(claim.created_at)}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted">Keine weiteren Claims gespeichert.</p>}
          </Section>
        </div>

        <aside className="grid content-start gap-6">
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Menschliche Entscheidung</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Die Freigabe legt genau eine aktive Owner-Mitgliedschaft an. `verified` bleibt unverändert.</p>
            {detail.claim.status === "pending" || detail.claim.status === "needs_info" ? (
              <div className="mt-4 grid gap-3">
                <form action={approveClaim}>
                  <input name="claim_id" type="hidden" value={detail.claim.id} />
                  <ConfirmSubmitButton className="w-full rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white" confirmation="Übernahme freigeben? Dadurch werden Claim, Membership und claim_status transaktional gesetzt.">
                    Übernahme freigeben
                  </ConfirmSubmitButton>
                </form>
                <form action={decideClaim} className="grid gap-2">
                  <input name="claim_id" type="hidden" value={detail.claim.id} />
                  <input name="status" type="hidden" value="needs_info" />
                  <textarea className="min-h-20 rounded-md border border-line px-3 py-2 text-sm" name="reason" placeholder="Welche Rückfrage ist offen?" />
                  <button className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" type="submit">Rückfrage erforderlich</button>
                </form>
                <form action={decideClaim} className="grid gap-2">
                  <input name="claim_id" type="hidden" value={detail.claim.id} />
                  <input name="status" type="hidden" value="rejected" />
                  <textarea className="min-h-20 rounded-md border border-line px-3 py-2 text-sm" name="reason" placeholder="Ablehnungsgrund intern" />
                  <ConfirmSubmitButton className="rounded-md border border-[#da9a8a] px-4 py-2 text-sm font-semibold text-[#8e2f1f] hover:bg-[#fff0ed]" confirmation="Übernahmeantrag ablehnen?">
                    Ablehnen
                  </ConfirmSubmitButton>
                </form>
              </div>
            ) : <p className="mt-4 rounded-md border border-line bg-panel px-3 py-3 text-sm text-muted">Keine erneute Entscheidung möglich. Eine erneute Freigabe ist idempotent.</p>}
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Mitgliedschaften</h2>
            {detail.memberships.length ? detail.memberships.map((membership) => (
              <div className="mt-3 rounded-md border border-line bg-panel p-3 text-sm" key={membership.id}>
                <div className="font-semibold text-ink">{membership.role} · {membership.status}</div>
                <div className="mt-1 text-xs text-muted">User-ID: {membership.user_id}</div>
                {membership.status === "active" ? (
                  <form action={revokeMembership} className="mt-3">
                    <input name="membership_id" type="hidden" value={membership.id} />
                    <input name="reason" type="hidden" value="Manueller Widerruf durch Admin" />
                    <ConfirmSubmitButton className="rounded-md border border-[#da9a8a] px-3 py-2 text-xs font-semibold text-[#8e2f1f]" confirmation="Diesen Zugang widerrufen? Der Zugriff auf Mein Betrieb wird sofort entfernt.">
                      Zugang widerrufen
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
              </div>
            )) : <p className="mt-3 text-sm text-muted">Noch keine Mitgliedschaft.</p>}
          </section>
        </aside>
      </div>
    </Shell>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-lg border border-line bg-white p-5 shadow-soft"><h2 className="text-lg font-semibold text-ink">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Data({ label, multiline, value }: { label: string; multiline?: boolean; value: string | null | undefined }) {
  return <div className="grid gap-1 text-sm sm:grid-cols-[180px_1fr]"><dt className="font-semibold text-muted">{label}</dt><dd className={multiline ? "whitespace-pre-wrap text-ink" : "text-ink"}>{value || "nicht angegeben"}</dd></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
