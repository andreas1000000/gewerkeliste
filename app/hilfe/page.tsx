import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Hilfe und häufige Fragen | GewerkeListe.com",
  description: "Antworten zu Suche, Betriebseinträgen, Übernahme, Korrekturen und dem Status verifizierter Betriebsdaten.",
  alternates: { canonical: "/hilfe" },
};

const faqs = [
  {
    question: "Wie finde ich einen passenden Betrieb?",
    answer:
      "Nutzen Sie die Suche nach Gewerk, konkreter Leistung, Firmenname, Ort oder PLZ. Die öffentlichen Ergebnisse berücksichtigen nur sichtbare Betriebseinträge. Eine vollständige Abdeckung jeder Region wird nicht behauptet.",
  },
  {
    question: "Wie kann ich einen vorhandenen Eintrag übernehmen?",
    answer:
      "Suchen Sie den Betrieb über Eintrag beanspruchen oder direkt über die Suche. Auf der Profilseite starten Sie die Übernahmeanfrage, bestätigen Ihre Berechtigung und die Datenschutzerklärung und reichen die Angaben zur Prüfung ein.",
  },
  {
    question: "Was bedeutet „Verifiziert“?",
    answer:
      "Der Status bezieht sich auf bestätigte Betriebsdaten und nachvollziehbare Kontaktwege. Er ist keine Qualitätsgarantie, Empfehlung oder Gewähr für die Ausführung eines Auftrags.",
  },
  {
    question: "Was passiert nach einer Korrektur oder Übernahmeanfrage?",
    answer:
      "Die Angaben werden intern geprüft. Ungeprüfte Vorschläge werden nicht automatisch veröffentlicht. Bei einer Rückfrage kann der betreuende Kontakt weitere Informationen anfordern.",
  },
  {
    question: "Ist ein Basiseintrag kostenlos?",
    answer:
      "Ja. Der kostenlose Basiseintrag soll Betriebsdaten, Gewerke und konkrete Leistungen sachlich und strukturiert darstellen.",
  },
  {
    question: "Wie melde ich einen falschen oder unzulässigen Inhalt?",
    answer:
      "Nutzen Sie die Seite Daten korrigieren. Dort finden Sie den passenden Weg für eigene Betriebsdaten, einen bestehenden öffentlichen Eintrag oder einen Hinweis mit Quellenangabe.",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Hilfe und Orientierung</p>
          <h1 className="mt-3 text-4xl font-semibold text-brand">Häufige Fragen zu GewerkeListe.com</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
            Hier erklären wir die wichtigsten Abläufe für Suchende und Fachbetriebe. Die Antworten beschreiben den
            aktuellen Stand der Plattform und ersetzen keine Rechts- oder Fachberatung.
          </p>
        </header>

        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <section key={faq.question} className="rounded-lg border border-line bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-brand">{faq.question}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{faq.answer}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-lg border border-[#b9dec8] bg-[#eef9f2] p-6">
          <h2 className="text-xl font-semibold text-brand">Noch nicht beantwortet?</h2>
          <p className="mt-3 text-sm leading-7 text-ink">
            Für eine konkrete Datenfrage nutzen Sie den Korrekturweg. Allgemeine Anliegen können Sie an{" "}
            <a className="font-semibold text-action hover:underline" href={"mailto:" + siteConfig.publicContactEmail}>
              {siteConfig.publicContactEmail}
            </a>{" "}
            senden.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href={"/daten-korrigieren" as Route}>
              Daten korrigieren
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href={"/suche" as Route}>
              Zur Suche
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
