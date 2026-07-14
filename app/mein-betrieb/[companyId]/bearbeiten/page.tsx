import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OwnerProfileForm } from "@/components/owner-profile-form";
import { SiteHeader } from "@/components/site-header";
import { getCompanyForOwnerProfile } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Betriebsprofil bearbeiten | GewerkeListe.com", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ companyId: string }> };

export default async function EditMyCompanyPage({ params }: PageProps) {
  const { companyId } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect(`/anmelden?next=${encodeURIComponent(`/mein-betrieb/${companyId}/bearbeiten`)}`);

  const { data: membership, error: membershipError } = await supabase
    .rpc("get_my_active_memberships", { p_company_id: companyId })
    .maybeSingle();
  if (membershipError || !membership) notFound();

  const company = await getCompanyForOwnerProfile(companyId);
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link className="text-sm font-semibold text-brand hover:underline" href={`/mein-betrieb/${company.id}`}>← Zurück zu Mein Betrieb</Link>
        <h1 className="mt-3 text-3xl font-semibold text-[#07173d]">Profiländerung einreichen</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Bearbeiten Sie nur Daten, die für den Betrieb öffentlich verwendet werden sollen. Jede Einreichung wird geprüft; ein Owner-Zugang verändert öffentliche Daten nicht direkt.</p>
        <div className="mt-6"><OwnerProfileForm company={company} /></div>
      </section>
    </main>
  );
}
