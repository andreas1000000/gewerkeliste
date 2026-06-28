import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Für Betriebe: kostenloses Basisprofil sichern | GewerkeListe.com",
  description:
    "Bau- und Handwerksbetriebe können ihren kostenlosen Basiseintrag übernehmen, Leistungen vollständig darstellen und regional auffindbar werden.",
  alternates: {
    canonical: "/fuer-betriebe",
  },
};

const benefits = [
  "kostenloser Basiseintrag",
  "vollständige Gewerke und Leistungen",
  "Spezialisierungen und Wirkungskreis",
  "Kontaktwege und Website",
  "Datenbestätigung ohne Qualitätsversprechen",
  "keine Leadgebühr und keine Auktion",
];

const steps = [
  {
    title: "Eintrag finden oder anlegen",
    text: "Suchen Sie nach Ihrem Betrieb. Falls noch kein Profil existiert, können Sie einen kostenlosen Basiseintrag einreichen.",
  },
  {
    title: "Daten und Leistungen ergänzen",
    text: "Ergänzen Sie Gewerke, konkrete Leistungen, Spezialisierungen, Kontaktwege und Ihren regionalen Wirkungskreis.",
  },
  {
    title: "Prüfung abwarten",
    text: "Änderungen werden geprüft, bevor sie veröffentlicht werden. Eine Datenbestätigung ist keine Qualitätsbewertung.",
  },
];

export default function ForCompaniesPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-brand">Für Bau- und Handwerksbetriebe</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-brand">
          Zeigen Sie, was Ihr Betrieb wirklich kann.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
          GewerkeListe.com ist kein Leadportal und keine Auktion. Ihr Profil soll sachlich zeigen, welche Gewerke,
          Leistungen und Spezialisierungen Ihr Betrieb anbietet und in welchen Regionen Sie tätig werden möchten.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-brand">Kostenloser Basiseintrag</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Der Basiseintrag bleibt offen zugänglich. Die Nennung von Gewerken, Leistungen und Spezialisierungen wird
              nicht künstlich begrenzt und nicht hinter eine Paywall gestellt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <BlueLink href="/betrieb-eintragen">Betrieb kostenlos eintragen</BlueLink>
              <OutlineLink href="/eintrag-beanspruchen">Profil übernehmen</OutlineLink>
              <OutlineLink href="/gewerke">Gewerke ansehen</OutlineLink>
            </div>
          </section>

          <section className="rounded-lg border border-[#b9dec8] bg-[#eef9f2] p-6">
            <h2 className="text-xl font-semibold text-brand">Was sichtbar werden kann</h2>
            <div className="mt-5 grid gap-3">
              {benefits.map((item) => (
                <Check key={item}>{item}</Check>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-brand">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{step.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-brand">Optionaler Zusatznutzen, keine Pflicht.</h2>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-muted">
            Spätere kostenpflichtige Funktionen dürfen zusätzliche Darstellung, Referenzen, Projektbeispiele oder
            Werkzeuge ermöglichen. Die grundlegende Sichtbarkeit der Betriebsdaten und des tatsächlichen
            Leistungsspektrums bleibt davon getrennt.
          </p>
        </section>
      </section>
    </main>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm font-medium text-ink">
      <span className="text-[#2f8f5b]">✓</span>
      <span>{children}</span>
    </div>
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
