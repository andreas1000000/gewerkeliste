import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Für Betriebe – Betriebseintrag übernehmen | GewerkeListe.com",
  description:
    "Fachbetriebe können ihren Betriebseintrag übernehmen, Leistungen hinterlegen und ihr Tätigkeitsgebiet auf GewerkeListe.com strukturiert darstellen.",
};

const steps = [
  {
    title: "Eintrag finden",
    text: "Suchen Sie Ihren Betrieb über Name, Gewerk, Ort oder PLZ.",
  },
  {
    title: "Übernahme anfragen",
    text: "Senden Sie die Anfrage direkt über den vorhandenen Betriebseintrag.",
  },
  {
    title: "Daten bestätigen",
    text: "Nach Prüfung werden Betriebsdaten, Leistungen und Tätigkeitsgebiet sauber hinterlegt.",
  },
];

const principles = [
  "Sachliche Darstellung statt Anfragenverkauf",
  "Klare Leistungen statt unstrukturierter Freitexte",
  "Region und Tätigkeitsgebiet sauber abbilden",
  "Direkte Kontaktaufnahme ohne künstliche Hürden",
];

export default function ForCompaniesPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-brand">Für Fachbetriebe</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-brand">
          Betrieb eintragen und Leistungen sichtbar machen.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
          GewerkeListe.com ist ein professionelles Verzeichnis für Baugewerke. Fachbetriebe können ihren Eintrag
          übernehmen, Betriebsdaten bestätigen und Leistungen sowie Tätigkeitsgebiet strukturiert darstellen.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-brand">
              Gründungsphase: Die ersten 500 Fachbetriebe ohne Verifizierungsgebühr
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Zum Aufbau des Registers werden die ersten 500 Fachbetriebe ohne Verifizierungsgebühr aufgenommen.
              Betriebe können ihren Eintrag übernehmen, Daten bestätigen und Leistungen sowie Tätigkeitsgebiet
              hinterlegen. Nach Abschluss der Gründungsphase wird für neue Verifizierungen eine jährliche Prüf- und
              Verwaltungsgebühr erhoben.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <BlueLink href="/betrieb-eintragen">Betrieb eintragen</BlueLink>
              <OutlineLink href="/gewerke?view=alphabetisch&claimIntent=true">Eintrag beanspruchen</OutlineLink>
              <OutlineLink href="/gewerke">Gewerkeliste ansehen</OutlineLink>
            </div>
          </section>

          <section className="rounded-lg border border-[#b9dec8] bg-[#eef9f2] p-6">
            <h2 className="text-xl font-semibold text-brand">Was ein guter Betriebseintrag leisten soll</h2>
            <div className="mt-5 grid gap-3">
              {principles.map((item) => (
                <div key={item} className="flex gap-3 text-sm font-medium text-ink">
                  <span className="text-[#2f8f5b]">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-brand">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{step.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-semibold text-brand">Basis-Eintrag</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Ein Basis-Eintrag macht öffentlich verfügbare gewerbliche Betriebsdaten auffindbar. Er ist nicht vom
              Betrieb bestätigt und wird entsprechend gekennzeichnet.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-ink">
              {["1 Hauptgewerk", "bis 2 Nebengewerke", "bis 5 Kernleistungen", "1 Einsatzradius", "Basis-Kontakt", "Kurzbeschreibung", "kein Badge"].map((item) => (
                <li key={item}>
                  <span className="mr-2 text-brand">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-[#b9dec8] bg-[#eef9f2] p-6">
            <h2 className="text-2xl font-semibold text-brand">Verifizierter Fachbetriebseintrag</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Ein bestätigter Eintrag zeigt, dass Betriebsdaten übernommen und geprüft wurden. Das ist keine Aussage über
              Qualität oder Ausführung, sondern über die Nachvollziehbarkeit der Eintragsdaten.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-ink">
              {[
                "mehr Leistungen",
                "Spezialisierungen",
                "mehrere Tätigkeitsgebiete oder PLZ",
                "Referenzen, falls vorhanden",
                "Zertifikate oder Innungen, falls vorhanden",
                "Badge Betriebsdaten bestätigt",
                "optional Gründungsbetrieb",
              ].map((item) => (
                <li key={item}>
                  <span className="mr-2 text-[#2f8f5b]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-brand">Kein Anfragenverkauf. Kein Preiskampf.</h2>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-muted">
            GewerkeListe.com verkauft keine einzelnen Anfragen. Der Betriebseintrag soll langfristig sichtbar machen,
            welche Leistungen ein Betrieb anbietet und in welchem Gebiet er tätig ist.
          </p>
        </section>
      </section>
    </main>
  );
}

function BlueLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
      href={href}
    >
      {children}
    </Link>
  );
}

function OutlineLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
      href={href}
    >
      {children}
    </Link>
  );
}
