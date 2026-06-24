import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Zahlung erfolgreich | GewerkeListe.com",
  description: "Die Zahlung wurde im Stripe-Checkout abgeschlossen.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#b9dec8] bg-white p-8 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Stripe Checkout</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#07173d]">Zahlung erfolgreich</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Danke. Der Checkout wurde abgeschlossen. Die manuelle Zuordnung zum Betrieb und die Aktivierung von
            Zusatzfunktionen erfolgen erst nach Prüfung.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href={"/betrieb-eintragen" as Route}>
              Betrieb eintragen
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href={"/" as Route}>
              Zur Startseite
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
