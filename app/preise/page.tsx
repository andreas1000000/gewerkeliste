import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Preise – Gründungsmitglied Landkreis Rosenheim | GewerkeListe.com",
  description:
    "Gründungsmitglied bei GewerkeListe.com werden: freiwilliges Unterstützerangebot für Betriebe im Landkreis Rosenheim mit Zusatznutzen rund um Profil, Sichtbarkeit und Datenpflege.",
  alternates: {
    canonical: "/preise",
  },
};

const foundingBenefits = [
  "Founding-Member-Badge im Profil",
  "Logo oder Profilbild, sobald vom Betrieb bereitgestellt",
  "erweiterte Betriebsbeschreibung",
  "bis zu 10 Referenzen oder Bilder später",
  "individuelle Kurz-URL und QR-Code zum Profil geplant",
  "monatlicher Sichtbarkeitsreport, sobald Tracking live ist",
  "Priorität bei Datenpflege und Profilaufbau",
];

const proBenefits = [
  "Website-Ergänzung für Betriebe ohne starke eigene Website",
  "Projektgalerie und Referenzen",
  "Wirkungskreis und Tätigkeitsgebiete",
  "Sichtbarkeitsreport für Profilaufrufe",
  "später optionale Matching- und Recruiting-Funktionen",
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ stripe?: string }>;
}) {
  const params = await searchParams;
  const stripeMessage = stripeStatusMessage(params?.stripe);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-brand">Gründungsphase Landkreis Rosenheim</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-brand">
          Sichtbarkeit aufbauen, ohne Leadportal und ohne Preisdruck.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
          GewerkeListe.com bleibt bei der Grundsichtbarkeit offen: Betriebe sollen ihre Gewerke, Leistungen und
          Spezialisierungen vollständig darstellen können. Bezahlt wird für Zusatznutzen wie bessere Darstellung,
          Datenpflege, Referenzen und Sichtbarkeitsnachweise.
        </p>

        {stripeMessage ? (
          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm font-semibold text-yellow-950">
            {stripeMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-lg border border-[#b9dec8] bg-white p-6 shadow-soft">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-brand">Produkt 1</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">Gründungsmitglied Landkreis Rosenheim</h2>
              </div>
              <div className="rounded-lg bg-[#eef9f2] px-4 py-3 text-right">
                <div className="text-3xl font-semibold text-brand">99 €</div>
                <div className="text-xs font-semibold text-muted">pro Jahr</div>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted">
              Für die ersten 100 Betriebe im Landkreis Rosenheim. Das Angebot unterstützt den Aufbau der regionalen
              Gewerke-Suche und ergänzt den kostenlosen Basiseintrag um zusätzliche Darstellungsmöglichkeiten.
            </p>

            <ul className="mt-5 grid gap-2 text-sm text-ink">
              {foundingBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span className="font-semibold text-brand">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 rounded-md border border-line bg-panel p-3 text-xs leading-5 text-muted">
              Keine Auftragsgarantie, keine Qualitätsgarantie, keine bessere Sortierung gegen Zahlung. Der kostenlose
              Basiseintrag bleibt davon unabhängig.
            </p>

            <form action="/api/stripe/checkout" className="mt-6 grid gap-3" method="post">
              <label className="grid gap-1.5 text-xs font-semibold text-brand">
                E-Mail für Checkout
                <input
                  className="h-11 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-action"
                  name="email"
                  placeholder="kontakt@betrieb.de"
                  type="email"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-brand">
                Betriebsname
                <input
                  className="h-11 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-action"
                  name="company_name"
                  placeholder="Musterbetrieb GmbH"
                />
              </label>
              <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand">
                Jetzt Gründungsmitglied werden
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Produkt 2</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">Pro-Profil vormerken</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Das Pro-Profil wird als Website-Ergänzung vorbereitet. Es soll Betrieben helfen, Leistungen, Referenzen,
              Wirkungskreis und Sichtbarkeit professioneller darzustellen. Es ersetzt nicht den kostenlosen Basiseintrag.
            </p>
            <div className="mt-5 rounded-lg bg-panel p-4">
              <div className="text-2xl font-semibold text-[#07173d]">29–49 €</div>
              <div className="text-sm text-muted">pro Monat später geplant</div>
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-ink">
              {proBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span className="font-semibold text-brand">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href={"/betrieb-eintragen" as Route}>
                Betrieb eintragen
              </Link>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href={"/eintrag-beanspruchen" as Route}>
                Profil beanspruchen
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function stripeStatusMessage(status: string | undefined) {
  if (status === "missing-env") {
    return "Stripe-Testmode ist vorbereitet, aber die lokale Stripe-Konfiguration fehlt noch. Setze STRIPE_SECRET_KEY und optional STRIPE_PRICE_FOUNDING_MEMBER_YEARLY.";
  }
  if (status === "live-blocked") {
    return "Stripe Live Mode ist blockiert. Für echte Zahlungen braucht es eine ausdrückliche Live-Freigabe.";
  }
  if (status === "checkout-error") {
    return "Checkout konnte nicht gestartet werden. Bitte Stripe-Testkonfiguration prüfen.";
  }
  return "";
}
