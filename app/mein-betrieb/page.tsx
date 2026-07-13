import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteHeader } from "@/components/site-header";
import { getCompany } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Mein Betrieb | GewerkeListe.com",
  description: "Betriebszugang und eingereichte Profiländerungen verwalten.",
  robots: { index: false, follow: false },
};

export default async function MyCompanyPage() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/anmelden?next=/mein-betrieb");

  const [membershipResult, claimsResult] = await Promise.all([
    supabase.from("company_memberships").select("*").eq("status", "active").eq("role", "owner").order("created_at", { ascending: false }),
    supabase.from("company_claims").select("id, company_id, status, created_at, decided_at, rejection_reason").order("created_at", { ascending: false }),
  ]);
  if (membershipResult.error || claimsResult.error) throw membershipResult.error || claimsResult.error;

  const memberships = membershipResult.data || [];
  const companies = await Promise.all(memberships.map(async (membership) => ({ membership, company: await getCompany(membership.company_id) })));

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Persönlicher Bereich</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#07173d]">Mein Betrieb</h1>
            <p className="mt-3 text-sm leading-6 text-muted">Angemeldet als {userData.user.email}. Sie sehen nur Betriebe, denen Ihr Zugang aktiv zugeordnet ist.</p>
          </div>
          <SignOutButton />
        </div>

        <section className="mt-8 grid gap-4">
          <h2 className="text-xl font-semibold text-ink">Aktive Betriebszugänge</h2>
          {companies.length ? companies.map(({ company, membership }) => (
            <article className="rounded-lg border border-line bg-white p-5 shadow-soft" key={membership.id}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{company.name}</h3>
                  <p className="mt-1 text-sm text-muted">{company.postal_code} {company.city} · Rolle: {membership.role}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">Der Betrieb ist Ihrem Zugang zugeordnet. Änderungen werden vor der Veröffentlichung geprüft.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white" href={`/mein-betrieb/${company.id}` as Route}>Bereich öffnen</Link>
                  <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink" href={`/firma/${company.slug}` as Route}>Öffentliches Profil</Link>
                </div>
              </div>
            </article>
          )) : <p className="rounded-lg border border-line bg-white p-5 text-sm leading-6 text-muted">Noch kein Betrieb ist freigegeben. Offene Übernahmeanträge sehen Sie unten.</p>}
        </section>

        <section className="mt-10 grid gap-4">
          <h2 className="text-xl font-semibold text-ink">Meine Übernahmeanträge</h2>
          {(claimsResult.data || []).length ? (claimsResult.data || []).map((claim) => (
            <div className="rounded-lg border border-line bg-white p-5" key={claim.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-ink">Betrieb {claim.company_id}</span>
                <StatusLabel status={claim.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{claim.status === "approved" ? "Der Betrieb ist jetzt Ihrem Zugang zugeordnet." : claim.status === "needs_info" ? "Für die Prüfung wird eine Rückfrage benötigt." : claim.status === "rejected" ? "Der Antrag wurde abgelehnt. Der Grund wird nur im geschützten Supportprozess weitergegeben." : "Die Prüfung läuft. Eine Freigabe erfolgt ausschließlich manuell."}</p>
            </div>
          )) : <p className="rounded-lg border border-line bg-white p-5 text-sm text-muted">Noch kein Übernahmeantrag gestellt.</p>}
        </section>
      </section>
    </main>
  );
}

function StatusLabel({ status }: { status: string }) {
  return <span className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold text-ink">{status === "needs_info" ? "Rückfrage erforderlich" : status === "approved" ? "Freigegeben" : status === "rejected" ? "Abgelehnt" : "Prüfung läuft"}</span>;
}
