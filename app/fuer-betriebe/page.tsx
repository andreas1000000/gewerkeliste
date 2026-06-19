import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Für Betriebe – kostenloser Basiseintrag | GewerkeListe.com",
  description:
    "Fachbetriebe können ihren Betrieb kostenlos eintragen, Leistungen hinterlegen und die regionale GewerkeListe mit aufbauen.",
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
          Kostenlos sichtbar werden. Von Anfang an dabei sein.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
          GewerkeListe.com ist ein unabhängiges, regional wachsendes Verzeichnis für Baugewerke. Fachbetriebe können
          ihren kostenlosen Basiseintrag übernehmen, Betriebsdaten bestätigen und Leistungen sowie Tätigkeitsgebiet
          strukturiert darstellen.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-brand">
              Kostenloser Basiseintrag für Fachbetriebe
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Trage deinen Betrieb kostenlos ein und hilf mit, eine vollständige, regionale GewerkeListe aufzubauen.
              Ziel ist eine Plattform, auf der Auftraggeber, Planer und Betriebe schneller zueinanderfinden. Der
              Basiseintrag bleibt kostenlos.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <BlueLink href="/betrieb-eintragen">Betrieb kostenlos eintragen</BlueLink>
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

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-brand">Zeig, was dein Betrieb wirklich kann.</h2>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-muted">
            Jeder Betrieb soll sein Leistungsspektrum klar, vollständig und übersichtlich darstellen können. Genau darum
            geht es bei GewerkeListe.com: Auftraggeber, Planer und Bauleiter sollen besser erkennen, welche Betriebe
            welche Leistungen anbieten – regional, transparent und aus der Praxis heraus.
          </p>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-semibold text-brand">Kostenloser Basiseintrag</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Der Basiseintrag ermöglicht eine klare Darstellung deines Betriebs und deiner Leistungen. Nicht künstlich
              begrenzt, sondern so, dass der Markt besser versteht, wofür dein Betrieb steht.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-ink">
              {[
                "Gewerke und Leistungen klar benennen",
                "Spezialisierungen sichtbar machen",
                "regionale Auffindbarkeit verbessern",
                "transparente Leistungsübersicht",
                "Kontaktdaten und Website",
                "sachliche Kurzbeschreibung",
                "Eintragsstatus klar gekennzeichnet",
              ].map((item) => (
                <li key={item}>
                  <span className="mr-2 text-brand">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-[#b9dec8] bg-[#eef9f2] p-6">
            <h2 className="text-2xl font-semibold text-brand">Bestätigter Fachbetriebseintrag</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Ein bestätigter Eintrag zeigt, dass Betriebsdaten übernommen und geprüft wurden. Das ist keine Aussage über
              Qualität oder Ausführung, sondern über die Nachvollziehbarkeit der Eintragsdaten.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-ink">
              {[
                "geprüfte Betriebsdaten",
                "vollständiges Leistungsspektrum",
                "Tätigkeitsgebiete oder PLZ",
                "Referenzen und Projektbeispiele, falls vorhanden",
                "Zertifikate oder Innungen, falls vorhanden",
                "Badge Betriebsdaten bestätigt",
                "optional Fördermitglied",
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

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[#b9dec8] bg-[#eef9f2] p-6">
            <h2 className="text-2xl font-semibold text-brand">Fördermitglied werden</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Wer das Projekt gut findet, kann GewerkeListe.com freiwillig unterstützen. Fördermitglieder können
              zusätzliche Darstellungsmöglichkeiten nutzen, zum Beispiel mehr Bilder, Referenzen, eine persönliche
              Vorstellung oder frühes Feedback zu neuen Funktionen.
            </p>
            <p className="mt-4 text-sm font-semibold text-brand">Der kostenlose Basiseintrag bleibt davon unberührt.</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-semibold text-brand">Für alle Betriebe offen.</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Jeder Betrieb soll unabhängig von Region, Größe oder Unternehmensalter die Möglichkeit haben, sich auf
              GewerkeListe.com sachlich, vollständig und nachvollziehbar zu präsentieren.
            </p>
          </div>
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
