import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MagicLinkForm } from "@/components/magic-link-form";
import { SiteHeader } from "@/components/site-header";
import { getSupabaseUser } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Sicher anmelden | GewerkeListe.com",
  description: "Passwortlos per E-Mail bei GewerkeListe.com anmelden.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const user = await getSupabaseUser();
  if (user) redirect("/mein-betrieb");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const next = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/mein-betrieb";

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Sicherer Zugang</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#07173d]">Mit E-Mail anmelden</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Wir senden Ihnen einen einmaligen Anmeldelink. Es gibt kein Passwort, und Ihre E-Mail-Adresse wird aus der
            bestätigten Sitzung für Übernahme- und Betriebszugriffe verwendet.
          </p>
          {error ? <p className="mt-4 rounded-md border border-[#e1b0a5] bg-[#fff5f2] px-4 py-3 text-sm text-[#8e2f1f]">Der Anmeldelink konnte nicht verarbeitet werden. Bitte fordern Sie einen neuen Link an.</p> : null}
          <div className="mt-6">
            <MagicLinkForm nextPath={next} />
          </div>
        </div>
      </section>
    </main>
  );
}
