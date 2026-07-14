import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteHeader } from "@/components/site-header";
import { getCompany } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type PageProps = { params: Promise<{ companyId: string }> };

export default async function MyCompanyDetailPage({ params }: PageProps) {
  const { companyId } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect(`/anmelden?next=${encodeURIComponent(`/mein-betrieb/${companyId}`)}`);

  const { data: membership, error: membershipError } = await supabase
    .rpc("get_my_active_memberships", { p_company_id: companyId })
    .maybeSingle();
  if (membershipError || !membership) notFound();

  const company = await getCompany(companyId);
  const { data: submissionsData, error: submissionsError } = await supabase.rpc("get_my_owner_submissions", {
    p_company_id: companyId,
  });
  if (submissionsError) throw submissionsError;
  const submissions = (submissionsData || []) as Array<{ id: string; status: string; created_at: string; decided_at: string | null }>;

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><Link className="text-sm font-semibold text-brand hover:underline" href="/mein-betrieb">← Mein Betrieb</Link><h1 className="mt-3 text-3xl font-semibold text-[#07173d]">{company.name}</h1><p className="mt-2 text-sm text-muted">{company.postal_code} {company.city} · aktiver Owner-Zugang</p></div>
          <SignOutButton />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">Profilstatus</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Der öffentliche Eintrag bleibt unverändert, bis eine eingereichte Änderung durch einen menschlichen Admin geprüft und freigegeben wurde.</p>
            <dl className="mt-5 grid gap-3 text-sm"><Data label="Claim-Status" value={company.claim_status} /><Data label="Verifiziert" value={company.verified ? "ja – nur Datenstatus" : "nein"} /><Data label="Offene Änderungen" value={String((submissions || []).filter((submission) => ["submitted", "in_review", "needs_info"].includes(submission.status)).length)} /></dl>
            <div className="mt-6 flex flex-wrap gap-3"><Link className="rounded-md bg-action px-4 py-3 text-sm font-semibold text-white" href={`/mein-betrieb/${company.id}/bearbeiten` as Route}>Profildaten bearbeiten</Link><Link className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink" href={`/firma/${company.slug}` as Route}>Öffentliches Profil</Link></div>
          </section>
          <section className="rounded-lg border border-line bg-white p-6 shadow-soft"><h2 className="text-xl font-semibold text-ink">Meine Einreichungen</h2><div className="mt-4 grid gap-3">{submissions?.length ? submissions.map((submission) => <div className="rounded-md border border-line bg-panel p-3 text-sm" key={submission.id}><div className="font-semibold text-ink">{statusLabel(submission.status)}</div><div className="mt-1 text-xs text-muted">{formatDate(submission.created_at)}</div></div>) : <p className="text-sm text-muted">Noch keine Profiländerung eingereicht.</p>}</div></section>
        </div>
      </section>
    </main>
  );
}

function Data({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-[150px_1fr]"><dt className="font-semibold text-muted">{label}</dt><dd className="text-ink">{value}</dd></div>; }
function statusLabel(status: string) { return status === "approved" ? "Freigegeben" : status === "rejected" ? "Abgelehnt" : status === "needs_info" ? "Rückfrage erforderlich" : "Prüfung läuft"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
