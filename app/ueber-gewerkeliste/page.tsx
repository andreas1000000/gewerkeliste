import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Über GewerkeListe.com – Aus echter Baupraxis entstanden",
  description:
    "GewerkeListe.com entsteht aus echter Baupraxis und schafft ein professionelles Verzeichnis für Baugewerke, Fachbetriebe und Auftraggeber.",
  alternates: {
    canonical: "/ueber-gewerkeliste",
  },
};

const trustPoints = [
  {
    title: "Fachbetriebe sind schwer auffindbar",
    text: "Wer einen Fachbetrieb sucht, findet oft Empfehlungen, alte Kontakte, Suchtreffer und verstreute Informationen. Das kostet Zeit und führt nicht immer zum passenden Betrieb.",
  },
  {
    title: "Leistungen sind oft nicht strukturiert",
    text: "Leistungen, Spezialisierungen, Regionen und Tätigkeitsgebiete sind online häufig nicht klar dargestellt oder schwer vergleichbar.",
  },
  {
    title: "Das Bauwesen braucht ein verlässliches Register",
    text: "GewerkeListe.com schafft eine klare, strukturierte und verifizierbare Übersicht für Baugewerke, Auftraggeber und Fachbetriebe.",
  },
];

const practiceFacts = [
  "Gelernter Maurer",
  "Bauingenieur",
  "Erfahrung aus Ausführung, Bauherrenvertretung und Projektsteuerung",
  "Praxiswissen aus Baustelle, Planung und Bauorganisation",
  "Verständnis für Baugewerke, Schnittstellen und regionale Betriebe",
  "Unternehmerischer Anspruch: aus Einzelwissen ein skalierbares System machen",
];

const comparison = [
  {
    title: "Allgemeine Suchmaschinen",
    items: ["Viele Treffer, wenig Einordnung", "Schwer vergleichbar", "Spezialisierungen oft unsichtbar", "Keine klare Struktur nach Gewerk und Region"],
  },
  {
    title: "Klassische Auftragsportale",
    items: ["Häufig Preisdruck", "Einzelne Anfragen statt Betriebseintrag", "Begrenzte fachliche Struktur", "Darstellung oft austauschbar"],
  },
];

const different = [
  "Strukturierte Gewerkeliste",
  "Klare Leistungen",
  "Region und Tätigkeitsgebiet",
  "Verifizierbare Betriebseinträge",
  "Professionelle Darstellung",
  "Direkte Kontaktaufnahme",
];

const audiences = [
  {
    title: "Für Fachbetriebe",
    text: "Für Handwerksbetriebe, Bauunternehmen und spezialisierte Fachfirmen, die Leistungen und Tätigkeitsgebiet sauber darstellen möchten.",
  },
  {
    title: "Für Bauherren",
    text: "Bauherren finden Fachbetriebe nach Gewerk, Ort und Spezialisierung schneller und strukturierter.",
  },
  {
    title: "Für Planer und Architekten",
    text: "Planer erhalten eine bessere Übersicht regionaler Fachbetriebe für konkrete Bauaufgaben.",
  },
  {
    title: "Für Unternehmen und Projektentwickler",
    text: "Professionelle Auftraggeber können Ausführungspartner gezielter identifizieren und vergleichen.",
  },
];

export default function AboutGewerkeListePage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-muted sm:px-6 lg:px-8">
          <Link className="hover:text-ink" href={"/suche" as Route}>
            Start
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">Über GewerkeListe.com</span>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Aus der Baupraxis</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
              GewerkeListe.com entsteht aus echter Baupraxis.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink">
              GewerkeListe.com wurde aufgebaut, weil die Suche nach passenden Fachbetrieben in der Baupraxis oft
              unnötig kompliziert ist. Gute Betriebe sind vorhanden – aber Leistungen, Spezialisierungen und
              Tätigkeitsgebiete sind häufig nicht sauber auffindbar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BlueLink href="/suche">Fachbetrieb suchen</BlueLink>
              <OutlineLink href="/eintrag-beanspruchen">Eintrag beanspruchen</OutlineLink>
              <OutlineLink href="/betrieb-eintragen">Betrieb eintragen</OutlineLink>
            </div>
          </div>

          <aside className="rounded-lg border border-line bg-panel p-6 shadow-soft">
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              <img
                alt="Andreas Moser, Gründer von GewerkeListe.com"
                className="aspect-square w-full object-cover"
                src="/images/andreas-moser.png"
              />
            </div>
            <div className="mt-5 rounded-lg border border-line bg-white p-5">
              <p className="text-lg font-semibold text-ink">Andreas Moser</p>
              <p className="mt-1 text-sm text-muted">Gründer von GewerkeListe.com</p>
              <a
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
                href="https://www.linkedin.com/in/andreasmoserrealestate/"
                rel="noopener noreferrer"
                target="_blank"
              >
                LinkedIn-Profil
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-brand">Warum es GewerkeListe.com geben muss</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {trustPoints.map((point, index) => (
            <Card key={point.title}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-sm font-semibold text-action">
                {index + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink">{point.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{point.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Card>
          <h2 className="text-2xl font-semibold text-brand">Über den Gründer</h2>
          <div className="mt-5 space-y-4 text-base leading-7 text-ink">
            <p>
              Andreas Moser ist gelernter Maurer, Bauingenieur und Gründer von GewerkeListe.com. Sein Blick auf das
              Register kommt aus Ausführung, Planung, Bauherrenvertretung und Organisation.
            </p>
            <p>
              Dadurch kennt er beide Seiten: die praktische Ausführung auf der Baustelle und die Anforderungen
              professioneller Projektsteuerung.
            </p>
            <p className="font-semibold text-action">
              GewerkeListe.com ist deshalb keine abstrakte Plattformidee. Es entsteht aus einem wiederkehrenden Problem
              der Baupraxis.
            </p>
            <p>
              Berufliches Profil:{" "}
              <a
                className="font-semibold text-action hover:underline"
                href="https://www.linkedin.com/in/andreasmoserrealestate/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Andreas Moser auf LinkedIn
              </a>
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold text-brand">Baupraxis statt Plattformfantasie</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {practiceFacts.map((fact) => (
              <div key={fact} className="rounded-md border border-line bg-panel px-4 py-3 text-sm font-medium leading-6 text-ink">
                <span className="mr-2 font-semibold text-brand">✓</span>
                {fact}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Card>
          <h2 className="text-2xl font-semibold text-brand">Das Marktproblem: fehlende Struktur</h2>
          <p className="mt-4 text-base leading-7 text-ink">
            Viele gute Handwerksbetriebe haben genug Arbeit, werden aber online nicht klar genug gefunden. Gleichzeitig
            suchen Bauherren, Architekten, Projektsteuerer, Hausverwaltungen und Unternehmen regelmäßig nach genau diesen
            Fachbetrieben.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {comparison.map((block) => (
              <div key={block.title} className="rounded-md border border-line bg-panel p-4">
                <h3 className="text-sm font-semibold text-ink">{block.title}</h3>
                <ul className="mt-3 grid gap-2 text-sm text-muted">
                  {block.items.map((item) => (
                    <li key={item}>
                      <span className="mr-2 font-semibold text-accent">×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold text-brand">Was GewerkeListe.com anders macht</h2>
          <p className="mt-4 text-base leading-7 text-ink">
            GewerkeListe.com ist kein lautes Auftragsportal und kein System für Preiskampf. Ein Betrieb wird als
            Fachbetrieb mit konkretem Leistungsprofil dargestellt.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {different.map((item) => (
              <div key={item} className="rounded-md border border-line bg-panel px-4 py-3 text-sm font-medium text-ink">
                <span className="mr-2 font-semibold text-brand">✓</span>
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Card>
          <h2 className="text-2xl font-semibold text-brand">Der Anspruch</h2>
          <p className="mt-4 max-w-4xl text-base leading-7 text-ink">
            GewerkeListe.com soll langfristig der professionelle Standard für Baugewerke werden. Nicht als größtes
            Werbeportal. Nicht als lauteste Plattform. Sondern als verlässliches Verzeichnis echter Fachbetriebe.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Fact value="Region für Region" />
            <Fact value="Gewerk für Gewerk" />
            <Fact value="Betrieb für Betrieb" />
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-brand">Für wen GewerkeListe.com gebaut wird</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          {audiences.map((audience) => (
            <Card key={audience.title}>
              <h3 className="text-lg font-semibold text-ink">{audience.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{audience.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <Card>
          <h2 className="text-2xl font-semibold text-brand">Meine Haltung</h2>
          <div className="mt-5 space-y-4 text-base leading-7 text-ink">
            <p>Ich glaube an klare Leistung, saubere Ausführung und verlässliche Strukturen.</p>
            <p>
              Gute Fachbetriebe verdienen es, professionell gefunden zu werden. Auftraggeber verdienen es, schneller die
              richtigen Betriebe zu finden.
            </p>
            <p>
              GewerkeListe.com soll kein lautes Marketingprodukt sein. Es soll ein praktisches Werkzeug für die
              Bauwirtschaft werden.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold text-brand">GewerkeListe.com wächst mit jedem bestätigten Betrieb.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">
            Wenn Ihr Betrieb bereits gelistet ist, können Sie den Eintrag übernehmen und die Betriebsdaten bestätigen.
            Wenn Ihr Betrieb noch fehlt, können Sie ihn eintragen lassen.
          </p>
          <div className="mt-6 grid gap-3">
            <BlueLink href="/suche">Fachbetrieb suchen</BlueLink>
            <OutlineLink href="/eintrag-beanspruchen">Eintrag beanspruchen</OutlineLink>
            <OutlineLink href="/betrieb-eintragen">Betrieb eintragen</OutlineLink>
          </div>
        </Card>
      </section>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">{children}</section>;
}

function Fact({ value }: { value: string }) {
  return (
    <div className="rounded-md border border-line bg-panel px-4 py-3 text-sm font-semibold text-ink">
      <span className="mr-2 text-brand">✓</span>
      {value}
    </div>
  );
}

function BlueLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href={href}>
      {children}
    </Link>
  );
}

function OutlineLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href={href}>
      {children}
    </Link>
  );
}
