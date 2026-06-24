import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Zahlung abgebrochen | GewerkeListe.com",
  description: "Der Stripe-Checkout wurde abgebrochen.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-8 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Stripe Checkout</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#07173d]">Zahlung abgebrochen</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Der Checkout wurde nicht abgeschlossen. Der kostenlose Basiseintrag und die Profilübernahme bleiben davon
            unberührt.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href={"/preise" as Route}>
              Zurück zu Preise
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href={"/betrieb-eintragen" as Route}>
              Betrieb kostenlos eintragen
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
