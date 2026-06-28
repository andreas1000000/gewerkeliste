import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Warum GewerkeListe.com entsteht | Über uns",
  description:
    "GewerkeListe.com entsteht aus echter Baupraxis, um passende Bau- und Handwerksbetriebe besser auffindbar zu machen und mehr Transparenz in den Markt zu bringen.",
  alternates: {
    canonical: "/ueber-gewerkeliste",
  },
};

const trustItems = [
  "Gelernter Maurer",
  "Bauingenieur",
  "Bauherrenvertretung",
  "Planung und Projektsteuerung",
  "Erfahrung aus Auftraggeber- und Ausführungsperspektive",
  "Aus der Region Rosenheim",
];

const transparencyQuestions = [
  "Welche Betriebe gibt es?",
  "Wo sind sie tätig?",
  "Welche Leistungen bieten sie an?",
  "Welche Spezialisierungen haben sie?",
  "Wie können Auftraggeber sie erreichen?",
  "Welche Betriebe fehlen noch?",
];

const benefits = [
  "Auftraggeber finden schneller passende Betriebe.",
  "Planer sparen Suchaufwand.",
  "Bauleiter bekommen bessere Übersicht.",
  "Betriebe werden mit ihren tatsächlichen Leistungen sichtbarer.",
  "Regionale Kapazitäten können besser genutzt werden.",
  "Unnötige Wege und ineffiziente Suche werden reduziert.",
];

const audiences = [
  "Handwerksbetriebe",
  "Bauleiter",
  "Architekten",
  "Planer",
  "Projektentwickler",
  "Bauherren",
  "Hausverwaltungen",
  "Kommunen",
  "Unternehmen mit Bauprojekten",
];

const monetizationExamples = [
  "Verifizierung",
  "Referenzprojekte",
  "Bildergalerien",
  "Unternehmensvorstellungen",
  "Verfügbarkeiten",
  "Matching",
  "Ausschreibungen",
  "professionelle Werkzeuge für Planer und Auftraggeber",
];

export default function AboutGewerkeListePage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-muted sm:px-6 lg:px-8">
          <Link className="hover:text-ink" href={"/" as Route}>
            Start
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">Über GewerkeListe.com</span>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Warum GewerkeListe.com entsteht</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
              Warum GewerkeListe.com entsteht.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink">
              Weil die Suche nach passenden Bau- und Handwerksbetrieben heute noch viel zu oft über Zufall, alte
              Kontakte und persönliche Netzwerke läuft.
            </p>
            <div className="mt-6 max-w-3xl space-y-4 text-base leading-7 text-ink">
              <p>
                Mein Name ist Andreas Moser. Ich bin gelernter Maurer, Bauingenieur und arbeite seit vielen Jahren auf
                Auftraggeberseite in der Planung, Steuerung und Umsetzung von Bauprojekten.
              </p>
              <p>Ich kenne die Frage aus der Praxis:</p>
              <p className="rounded-lg border border-line bg-panel px-5 py-4 text-xl font-semibold text-brand">
                „Kennen Sie jemanden, der das machen kann?“
              </p>
              <p>Genau aus dieser Frage heraus entsteht GewerkeListe.com.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <BlueLink href="/betrieb-eintragen">Betrieb kostenlos eintragen</BlueLink>
              <OutlineLink href="/betrieb-eintragen">Fehlenden Betrieb vorschlagen</OutlineLink>
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
              <p className="mt-1 text-sm text-muted">Gelernter Maurer | Bauingenieur | Bauherrenvertreter</p>
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
        <h2 className="text-2xl font-semibold text-brand">Gebaut von jemandem, der den Bau kennt.</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trustItems.map((item) => (
            <Fact key={item}>{item}</Fact>
          ))}
        </div>
      </section>

      <TwoColumnSection
        eyebrow="Das Problem"
        title="Der Markt ist nicht leer. Er ist nur schlecht sichtbar."
        body={
          <>
            <p>Auf dem Bau fehlt nicht nur Personal. Oft fehlt vor allem Übersicht.</p>
            <p>
              Viele Auftraggeber suchen passende Betriebe. Viele Betriebe leisten gute Arbeit. Viele Spezialisten sind
              regional vorhanden. Und trotzdem finden beide Seiten häufig nicht zusammen.
            </p>
            <p>
              Dann wird telefoniert, herumgefragt, weiterempfohlen, gesucht und improvisiert. Große Büros fragen kleine
              Netzwerke. Bauleiter fragen andere Bauleiter. Bauherren suchen über Google. Gute Betriebe bleiben
              unsichtbar, wenn sie nicht zufällig genannt werden.
            </p>
            <p>Das kostet Zeit, Geld, Energie und oft auch Baufortschritt.</p>
          </>
        }
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Woran es häufig scheitert</h3>
            <div className="mt-4 grid gap-3">
              {["fehlende Übersicht", "verstreute Informationen", "unklare Spezialisierungen", "schwer erkennbare Einsatzgebiete"].map(
                (item) => (
                  <Fact key={item}>{item}</Fact>
                ),
              )}
            </div>
          </Card>
        }
      />

      <TwoColumnSection
        eyebrow="Beobachtung aus der Praxis"
        title="Die entscheidende Frage lautet fast immer: Wer kann das wirklich?"
        body={
          <>
            <p>Bei Bauprojekten geht es selten nur um ein Gewerk. Es geht um konkrete Leistungen.</p>
            <p>
              Nicht nur Gartenbau, sondern zum Beispiel Natursteinmauern, Granitpflaster, Entwässerungsrinnen,
              Außenanlagen, Stützwände oder Hofbefestigungen.
            </p>
            <p>
              Nicht nur Elektro, sondern PV, Zähleranlagen, KNX, Baustrom, Ladeinfrastruktur oder
              Industrieinstallationen.
            </p>
            <p>
              Nicht nur Metallbau, sondern Treppen, Geländer, Loftwände, Tore, Sonderkonstruktionen oder
              Edelstahlverarbeitung.
            </p>
            <p className="font-semibold text-action">
              GewerkeListe.com soll genau diese Leistungstiefe sichtbar machen. Deshalb darf ein Betrieb nicht künstlich
              auf wenige Leistungen begrenzt werden.
            </p>
          </>
        }
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Was sichtbar werden soll</h3>
            <div className="mt-4 grid gap-3">
              {["Gewerke", "Leistungen", "Spezialisierungen", "Tätigkeitsgebiet", "Kontaktwege", "Betriebsstatus"].map((item) => (
                <Fact key={item}>{item}</Fact>
              ))}
            </div>
          </Card>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Was anders werden soll</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand">Nicht der billigste Betrieb. Der passende Betrieb.</h2>
          <div className="mt-5 max-w-4xl space-y-4 text-base leading-7 text-ink">
            <p>GewerkeListe.com soll keine Plattform werden, die Handwerker gegeneinander ausspielt.</p>
            <p>Es geht nicht darum, Preise zu drücken. Es geht darum, den Markt besser auffindbar zu machen.</p>
            <p>
              Ein guter Betrieb soll gefunden werden, weil er die passende Leistung in der passenden Region anbietet.
              Ein Auftraggeber soll schneller erkennen, wer für sein Vorhaben grundsätzlich infrage kommt. Ein Planer
              oder Bauleiter soll nicht jedes Mal bei null anfangen müssen.
            </p>
          </div>
        </div>
      </section>

      <TwoColumnSection
        eyebrow="Klare Abgrenzung"
        title="Kein Lead-Portal. Keine Kontaktbörse gegen Gebühr. Keine Preisschlacht."
        body={
          <>
            <p>
              Viele bestehende Plattformen leben davon, Kontakte zu verkaufen oder Betriebe in Konkurrenz um einzelne
              Anfragen zu bringen.
            </p>
            <p>GewerkeListe.com verfolgt einen anderen Ansatz. Die Plattform soll zuerst Transparenz schaffen.</p>
            <p>Das Ziel ist nicht, den Markt auszupressen. Das Ziel ist, ihn besser zu ordnen.</p>
          </>
        }
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Transparenz heißt konkret</h3>
            <div className="mt-4 grid gap-3">
              {transparencyQuestions.map((item) => (
                <Fact key={item}>{item}</Fact>
              ))}
            </div>
          </Card>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Gesellschaftlicher Nutzen</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand">
            Weniger Zufall. Weniger Suchaufwand. Bessere Bauprojekte.
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-7 text-ink">
            Wenn der Markt transparenter wird, profitieren alle. GewerkeListe.com soll dazu beitragen, dass Bauprojekte
            einfacher, schneller und besser vorbereitet werden können.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <Fact key={item}>{item}</Fact>
            ))}
          </div>
        </div>
      </section>

      <TwoColumnSection
        eyebrow="Aufbauphase"
        title="Wir bauen das pragmatisch auf."
        body={
          <>
            <p>GewerkeListe.com befindet sich im Aufbau.</p>
            <p>
              Die Plattform startet bewusst einfach: Betriebe sichtbar machen, Leistungen erfassen, Regionen
              strukturieren und Suchenden eine bessere Übersicht geben.
            </p>
            <p>Nicht perfekt am ersten Tag. Aber nützlich von Anfang an.</p>
            <p className="font-semibold text-action">
              Mit jedem Betrieb, jedem Hinweis und jeder Verbesserung wird die Plattform wertvoller.
            </p>
          </>
        }
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Gebaut für</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <span key={audience} className="rounded-full border border-line bg-panel px-3 py-2 text-sm font-semibold text-ink">
                  {audience}
                </span>
              ))}
            </div>
          </Card>
        }
      />

      <TwoColumnSection
        eyebrow="Finanzierung und Fairness"
        title="Kostenlos starten. Echten Mehrwert später ausbauen."
        body={
          <>
            <p>Der Basiseintrag bleibt kostenlos, damit alle Betriebe sichtbar werden können.</p>
            <p>
              Der Aufbau einer guten Plattform kostet trotzdem Geld: Entwicklung, Hosting, Datenpflege, Prüfung,
              Verbesserung und Support.
            </p>
            <p>
              Später können zusätzliche Funktionen entstehen, wenn sie echten Mehrwert schaffen. Wichtig bleibt:
              Grundlegende Sichtbarkeit und das tatsächliche Leistungsspektrum eines Betriebs dürfen nicht künstlich
              versteckt werden.
            </p>
          </>
        }
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Möglicher Zusatznutzen</h3>
            <div className="mt-4 grid gap-3">
              {monetizationExamples.map((item) => (
                <Fact key={item}>{item}</Fact>
              ))}
            </div>
          </Card>
        }
      />

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Persönlich</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand">Warum ich das mache.</h2>
          <div className="mt-5 space-y-4 text-base leading-7 text-ink">
            <p>Ich habe selbst auf dem Bau gearbeitet. Ich kenne Baustellen nicht nur aus Besprechungsräumen.</p>
            <p>Später habe ich Bauingenieurwesen studiert und auf Auftraggeberseite viele Projekte begleitet.</p>
            <p>
              Dabei habe ich immer wieder gesehen, wie viel Zeit verloren geht, nur weil passende Betriebe schwer zu
              finden sind.
            </p>
            <p>Diese Lücke möchte ich schließen. Nicht theoretisch. Nicht kompliziert. Sondern pragmatisch, aus der Praxis heraus und Schritt für Schritt.</p>
          </div>
          <div className="mt-6 rounded-lg border border-line bg-panel p-5">
            <p className="text-base font-semibold text-brand">Andreas Moser</p>
            <p className="mt-1 text-sm text-muted">Gelernter Maurer | Bauingenieur | Bauherrenvertreter</p>
            <p className="mt-1 text-sm text-muted">Gründer von GewerkeListe.com</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold text-brand">„Gute Betriebe sollen gefunden werden.“</h2>
          <p className="mt-5 text-lg leading-8 text-ink">
            Gute Betriebe sollen gefunden werden, weil sie gute Arbeit leisten und die passende Leistung anbieten, nicht
            nur, weil zufällig jemand ihre Telefonnummer kennt.
          </p>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-[#082a63] p-6 text-white shadow-soft sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-blue-100">Mitmachen</p>
            <h2 className="mt-2 text-3xl font-semibold">Helfen Sie mit, die GewerkeListe besser zu machen.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-blue-50">
              Eine gute GewerkeListe entsteht nicht am Schreibtisch allein. Sie entsteht durch Hinweise aus der Praxis.
              Wenn ein Betrieb fehlt, ein Gewerk nicht sauber erfasst ist oder eine Leistung besser beschrieben werden
              sollte, freue ich mich über Rückmeldung.
            </p>
          </div>
          <div className="mt-6 grid gap-3 lg:mt-0">
            <WhiteLink href="/betrieb-eintragen">Betrieb eintragen</WhiteLink>
            <WhiteOutlineLink href="/betrieb-eintragen">Fehlenden Betrieb melden</WhiteOutlineLink>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/45 px-5 text-sm font-semibold text-white hover:bg-white/10"
              href="mailto:kontakt@gewerkeliste.com?subject=Feedback%20zu%20GewerkeListe.com"
            >
              Feedback geben
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function TwoColumnSection({
  eyebrow,
  title,
  body,
  aside,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  aside: ReactNode;
}) {
  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-normal text-brand">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold text-brand">{title}</h2>
        <div className="mt-5 space-y-4 text-base leading-7 text-ink">{body}</div>
      </Card>
      {aside}
    </section>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">{children}</section>;
}

function Fact({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panel px-4 py-3 text-sm font-medium leading-6 text-ink">
      <span className="mr-2 font-semibold text-brand">✓</span>
      {children}
    </div>
  );
}

function BlueLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
      href={href}
    >
      {children}
    </Link>
  );
}

function OutlineLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
      href={href}
    >
      {children}
    </Link>
  );
}

function WhiteLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-brand hover:bg-blue-50"
      href={href}
    >
      {children}
    </Link>
  );
}

function WhiteOutlineLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/45 px-5 text-sm font-semibold text-white hover:bg-white/10"
      href={href}
    >
      {children}
    </Link>
  );
}
