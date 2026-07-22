import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getPublishedPageContent } from "@/lib/data/site-pages";
import {
  BASIS_FEATURES,
  BASIS_PROFILE,
  VERIFIED_START_FEATURES,
  VERIFIED_START_PROFILE,
  formatNetEuro,
  verifiedStartPriceSummary,
} from "@/lib/profile-plans";

const priceSummary = verifiedStartPriceSummary();

export const metadata: Metadata = {
  title: "Preise und Profile | GewerkeListe.com",
  description:
    `Das Basisprofil bleibt kostenlos. Das verifizierte Startprofil kostet ${priceSummary.totalPriceWithNet} für ${priceSummary.term} und ist aktuell noch nicht buchbar.`,
  alternates: {
    canonical: "/preise",
  },
};

const verifiedOnlyFeatures = VERIFIED_START_FEATURES.filter((feature) => !feature.basis);
const comparisonRows = [
  ...BASIS_FEATURES.map((feature) => ({ label: feature.label, basis: true, verified: true })),
  ...verifiedOnlyFeatures.map((feature) => ({ label: feature.label, basis: false, verified: true })),
];

const verifiedAvailabilityCopy = VERIFIED_START_PROFILE.orderingEnabled
  ? "Das verifizierte Startprofil ist aktuell verfügbar."
  : "Das verifizierte Startprofil wird freigeschaltet, sobald alle zugesagten Funktionen vollständig verfügbar und geprüft sind. Aktuell ist es noch nicht buchbar.";

export default async function PricingPage() {
  const pageContent = await getPublishedPageContent("prices");

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">{pageContent.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
            {pageContent.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#30415f]">
            {pageContent.intro}
          </p>

          <aside className="mt-8 max-w-4xl rounded-lg border border-[#d8e4ef] bg-[#fbfcff] p-5" role="note">
            <p className="font-semibold text-ink">Aktueller Status des verifizierten Startprofils</p>
            <p className="mt-2 text-base leading-7 text-[#30415f]">{verifiedAvailabilityCopy}</p>
          </aside>

          <div className="mt-8">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
              href="/betrieb-eintragen"
            >
              {pageContent.primaryLabel}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-line bg-white p-6 shadow-soft" aria-labelledby="basis-title">
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Dauerhaft kostenlos</p>
            <h2 id="basis-title" className="mt-2 text-2xl font-semibold text-ink">
              {BASIS_PROFILE.publicName}
            </h2>
            <p className="mt-4 text-4xl font-semibold text-ink">{BASIS_PROFILE.publicCopy.price}</p>
            <p className="mt-4 text-base leading-7 text-[#30415f]">
              Das Basisprofil macht einen Betrieb nach Gewerk, Leistung und Region auffindbar. Die tatsächliche
              Leistungsbreite wird nicht künstlich durch ein kostenpflichtiges Paket begrenzt.
            </p>
            <ul className="mt-5 grid gap-2 text-sm leading-6 text-[#30415f]">
              {BASIS_FEATURES.map((feature) => (
                <li key={feature.id} className="flex gap-2">
                  <span aria-hidden="true" className="text-brand">
                    ✓
                  </span>
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-[#9bbbd2] bg-[#09284e] p-6 text-white shadow-soft" aria-labelledby="verified-title">
            <p className="text-sm font-semibold uppercase tracking-normal text-blue-100">Perspektivisches Angebot</p>
            <h2 id="verified-title" className="mt-2 text-2xl font-semibold">
              {VERIFIED_START_PROFILE.publicName}
            </h2>
            <p className="mt-4 text-3xl font-semibold">{priceSummary.totalPriceWithNet}</p>
            <p className="mt-1 text-sm text-blue-100">für {priceSummary.term}</p>
            <p className="mt-5 text-base leading-7 text-blue-50">
              Das verifizierte Startprofil beschreibt zusätzliche Prüf-, Strukturierungs- und Unterstützungsleistungen,
              sobald diese vollständig verfügbar, getestet und fachlich abgenommen sind.
            </p>
            <ul className="mt-5 grid gap-2 text-sm leading-6 text-blue-50">
              {verifiedOnlyFeatures.map((feature) => (
                <li key={feature.id} className="flex gap-2">
                  <span aria-hidden="true">✓</span>
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-md border border-white/20 bg-white/10 p-4 text-sm leading-6 text-blue-50">
              <p>{verifiedAvailabilityCopy}</p>
              <ul className="mt-3 grid gap-1">
                <li>{VERIFIED_START_PROFILE.monthlySubscription ? "Monatsabo möglich." : "Kein Monatsabo."}</li>
                <li>
                  {VERIFIED_START_PROFILE.automaticRenewal
                    ? "Automatische Verlängerung möglich."
                    : "Keine automatische Verlängerung."}
                </li>
                <li>
                  {VERIFIED_START_PROFILE.rankingPreference
                    ? "Rankingvorteil ist enthalten."
                    : "Kein Pay-to-rank und kein künstlicher Rankingvorteil."}
                </li>
                <li>
                  {VERIFIED_START_PROFILE.paymentEnabled
                    ? "Zahlung ist aktiviert."
                    : "Aktuell keine Bestellung, Zahlung oder Rechnung."}
                </li>
              </ul>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6" aria-labelledby="comparison-title">
          <h2 id="comparison-title" className="text-2xl font-semibold text-ink">
            Leistungsunterschiede auf einen Blick
          </h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[680px] w-full border-collapse text-left text-sm">
              <caption className="sr-only">Vergleich von Basisprofil und verifiziertem Startprofil</caption>
              <thead className="bg-panel text-xs uppercase tracking-normal text-muted">
                <tr>
                  <th scope="col" className="border-b border-line px-4 py-3 font-semibold">
                    Leistung
                  </th>
                  <th scope="col" className="border-b border-line px-4 py-3 text-right font-semibold">
                    Basisprofil
                  </th>
                  <th scope="col" className="border-b border-line px-4 py-3 text-right font-semibold">
                    Verifiziertes Startprofil
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {comparisonRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="px-4 py-3 font-medium text-ink">
                      {row.label}
                    </th>
                    <td className="px-4 py-3 text-right text-muted">{row.basis ? "Enthalten" : "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{row.verified ? "Enthalten" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6" aria-labelledby="fairness-title">
          <h2 id="fairness-title" className="text-2xl font-semibold text-ink">
            Faire Auffindbarkeit
          </h2>
          <div className="mt-5 grid gap-4 text-base leading-7 text-[#30415f] sm:grid-cols-3">
            <p>Keine automatische Verlängerung und kein Monatsabo.</p>
            <p>Keine Bestellung, Zahlung oder Rechnung, solange das Angebot nicht freigegeben ist.</p>
            <p>Eine Zahlung verändert weder Suchrelevanz noch organisches Ranking.</p>
          </div>
          <p className="mt-5 text-sm text-muted">
            Die Preisangaben und Leistungsunterschiede werden aus dem zentralen Preis- und Entitlement-Vertrag abgeleitet.
            Der rechnerische Vertragswert bleibt eine Information und ist kein Monatsabo.
          </p>
          <p className="mt-3 text-sm text-muted">Basispreis: {formatNetEuro(BASIS_PROFILE.totalPriceNetEur)}.</p>
        </section>
      </div>
    </main>
  );
}
