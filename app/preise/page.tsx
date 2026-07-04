import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Preise | GewerkeListe.com",
  description: "Kostenloses Basisprofil und verifiziertes Startprofil für Betriebe auf GewerkeListe.com.",
  alternates: {
    canonical: "/preise",
  },
  openGraph: {
    title: "Preise | GewerkeListe.com",
    description: "Kostenloses Basisprofil und verifiziertes Startprofil für Betriebe auf GewerkeListe.com.",
    url: "/preise",
    type: "website",
  },
};

const basisItems = [
  "Betriebsname",
  "Ort und Region",
  "Gewerk",
  "konkrete Leistungen und Angebote",
  "Einsatzregionen",
  "Kontaktmöglichkeit",
  "Website-Link, falls vorhanden",
  "Firmenlogo, falls gewünscht",
  "ein Ansprechpartnerbild, falls gewünscht",
];

const verifiedItems = [
  "alles aus dem kostenlosen Basisprofil",
  "Verifizierungskennzeichnung",
  "Firmenlogo",
  "professionell aufbereitetes Leistungsprofil",
  "klare Darstellung Ihrer Zielgruppen",
  "mehrere Ansprechpartner mit Bild",
  "Teamvorstellung mit Bild",
  "Referenzen",
  "Referenzbilder",
  "Nachweise und Zertifikate",
  "Website-Verlinkung",
  "persönliche Unterstützung beim Profilaufbau in der Startphase",
];

const verifiedExampleHref = "/firma/wagner-und-spielvogel-gbr-83083-riedering" as Route;

const comparisonRows = [
  ["Preis", "0 €", "490 € netto / 12 Monate"],
  ["Betriebsname", "enthalten", "enthalten"],
  ["Ort und Region", "enthalten", "enthalten"],
  ["Gewerk", "enthalten", "enthalten"],
  ["konkrete Leistungen und Angebote", "enthalten", "enthalten"],
  ["Einsatzregionen", "enthalten", "enthalten"],
  ["Kontaktmöglichkeit", "enthalten", "enthalten"],
  ["Website-Link", "enthalten", "enthalten"],
  ["Firmenlogo", "ein Logo möglich", "enthalten"],
  ["Ansprechpartner mit Bild", "ein Ansprechpartner möglich", "mehrere Ansprechpartner möglich"],
  ["Verifizierungskennzeichnung", "—", "enthalten"],
  ["professionell aufbereitetes Leistungsprofil", "—", "enthalten"],
  ["Zielgruppen klar dargestellt", "—", "enthalten"],
  ["mehrere Ansprechpartner", "—", "enthalten"],
  ["Teamvorstellung mit Bild", "—", "enthalten"],
  ["Referenzen", "—", "enthalten"],
  ["Referenzbilder", "—", "enthalten"],
  ["Nachweise und Zertifikate", "—", "enthalten"],
  ["persönliche Unterstützung beim Profilaufbau", "—", "in der Startphase enthalten"],
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-ink">
      <SiteHeader />

      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Preise</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
              Kostenlos sichtbar. Verifiziert gefunden.
            </h1>
            <div className="mt-6 max-w-3xl space-y-5 text-lg leading-8 text-[#30415f]">
              <p>
                <strong className="text-ink">Das Basisprofil bleibt kostenlos.</strong>
                <br />
                Weil reine Sichtbarkeit und fachliche Auffindbarkeit nichts kosten sollen.
              </p>
              <p>
                <strong className="text-ink">Das verifizierte Startprofil kostet 490 € netto für 12 Monate.</strong>
                <br />
                Dafür bauen wir Ihr Profil so auf, dass Auftraggeber schnell erkennen, wofür man Ihren Betrieb
                beauftragen kann — und warum sie Ihnen vertrauen können.
              </p>
              <p>
                Ihre Homepage zeigt, wer Sie sind.
                <br />
                GewerkeListe zeigt, wofür man Sie beauftragen kann.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/eintrag-beanspruchen">Jetzt als Betrieb verifizieren lassen</PrimaryLink>
              <SecondaryLink href="/betrieb-eintragen">Kostenloses Basisprofil eintragen</SecondaryLink>
            </div>
          </div>

          <aside className="rounded-lg border border-line bg-[#fbfcff] p-6 shadow-soft">
            <div className="text-sm font-semibold uppercase tracking-normal text-muted">Preisanker</div>
            <div className="mt-4 text-4xl font-semibold text-ink">490 €</div>
            <p className="mt-2 text-sm font-semibold text-muted">netto / 12 Monate</p>
            <p className="mt-5 text-sm leading-6 text-muted">
              Für Betriebe, die nicht nur online sein wollen — sondern im richtigen Moment gefunden werden wollen.
            </p>
            <Link
              className="mt-6 inline-flex w-full min-h-11 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
              href={"/eintrag-beanspruchen" as Route}
            >
              Startprofil für 490 € sichern
            </Link>
          </aside>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionIntro title="Zwei Möglichkeiten. Eine faire Entscheidung." />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <OfferCard
            title="Basisprofil"
            price="0 €"
            intro="Für Betriebe, die auf GewerkeListe grundsätzlich auffindbar sein möchten."
            body="Ihr Betrieb erscheint mit den wichtigsten Informationen, damit private Bauherren, Architekten, Verwalter und institutionelle Auftraggeber Sie nach Gewerk, Leistung und Region finden können."
            items={basisItems}
            after="Kostenlos, weil reine Sichtbarkeit fairerweise nichts kosten soll."
            cta="Kostenloses Basisprofil eintragen"
            href="/betrieb-eintragen"
          />
          <OfferCard
            highlighted
            title="Verifiziertes Startprofil"
            price="490 € netto / 12 Monate"
            intro="Für Betriebe, die nicht nur gefunden werden möchten, sondern professionell, persönlich und vertrauenswürdig auftreten wollen."
            body="Wir bereiten Ihr Profil so auf, dass Auftraggeber auf einen Blick verstehen:"
            items={[
              "Was macht dieser Betrieb?",
              "Wo arbeitet er?",
              "Für welche Projekte ist er geeignet?",
              "Wer sind die richtigen Ansprechpartner?",
              "Welche Referenzen gibt es?",
              "Welche Nachweise sprechen für den Betrieb?",
              "Warum sollte man gerade diesen Betrieb anfragen?",
            ]}
            itemsTitle=""
            includedTitle="Enthalten:"
            includedItems={verifiedItems}
            after="Das Basisprofil zeigt, was Ihr Betrieb anbietet. Das verifizierte Profil zeigt, wer dahintersteht, was Sie bereits geleistet haben und warum Auftraggeber Ihnen vertrauen können."
            cta="Startprofil für 490 € sichern"
            href="/eintrag-beanspruchen"
            exampleHref={verifiedExampleHref}
          />
        </div>

        <section className="mt-10 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-2xl font-semibold tracking-normal text-ink">Der Unterschied auf einen Blick</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead className="bg-panel text-xs uppercase tracking-normal text-muted">
                <tr>
                  <th className="border-b border-line px-4 py-3 font-semibold">Leistung</th>
                  <th className="border-b border-line px-4 py-3 text-right font-semibold">Basisprofil</th>
                  <th className="border-b border-line px-4 py-3 text-right font-semibold">Verifiziertes Startprofil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {comparisonRows.map(([label, basis, verified]) => (
                  <tr key={label}>
                    <td className="px-4 py-3 font-medium text-ink">{label}</td>
                    <td className="px-4 py-3 text-right text-muted">{basis}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{verified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TextSection title="Warum bleibt das Basisprofil kostenlos?">
          <p>Weil ein Betrieb grundsätzlich auffindbar sein sollte, wenn er ein Gewerk anbietet und in einer Region tätig ist.</p>
          <p>GewerkeListe soll kein Verzeichnis sein, in dem nur sichtbar ist, wer bezahlt.</p>
          <p>Deshalb bleibt das Basisprofil kostenlos.</p>
          <p>Auch wenn uns der Aufbau, die Pflege und die Strukturierung der Plattform Aufwand kostet, glauben wir:</p>
          <p>Reine Sichtbarkeit darf keine Hürde sein.</p>
        </TextSection>

        <TextSection title="Warum kostet das verifizierte Profil Geld?">
          <p>Weil Vertrauen Arbeit ist.</p>
          <p>Ein gutes Profil entsteht nicht durch einen Firmennamen und eine Telefonnummer.</p>
          <p>Ein gutes Profil zeigt Auftraggebern, ob ein Betrieb wirklich zu ihrem Projekt passt.</p>
          <p>
            Dafür strukturieren wir Leistungen, Regionen, Zielgruppen, Ansprechpartner, Referenzen, Bilder, Nachweise
            und Zertifikate so, dass Ihr Betrieb nicht nur gelistet ist — sondern verstanden wird.
          </p>
          <p>Das ist kein weiterer Werbeeintrag.</p>
          <p>Das ist Ihr Beschaffungsprofil.</p>
        </TextSection>

        <TextSection title="Der faire Deal in der Startphase">
          <p>GewerkeListe befindet sich im Aufbau.</p>
          <p>
            Wer jetzt verifiziertes Startmitglied wird, unterstützt ein faires Suchsystem für Bau, Ausbau, TGA,
            Sanierung, Gebäudetechnik und Handwerk.
          </p>
          <p>Dafür erhalten Sie in der Startphase persönliche Unterstützung beim Aufbau Ihres Profils.</p>
          <p>
            Wir helfen dabei, vorhandene Informationen aus Ihrer Website, Ihren Unterlagen, Bildern, Referenzen und
            Nachweisen in ein klares GewerkeListe-Profil zu übertragen.
          </p>
          <p>Sie unterstützen den Aufbau einer fairen Plattform.</p>
          <p>Wir helfen Ihnen, dort professionell gefunden zu werden.</p>
        </TextSection>

        <section className="mt-10 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-2xl font-semibold tracking-normal text-ink">Was Sie bei GewerkeListe nicht kaufen</h2>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 text-base leading-7 text-[#30415f]">
              <p>Sie kaufen keinen gekauften Spitzenplatz.</p>
              <p>Sie kaufen keine künstliche Bevorzugung.</p>
              <p>Sie kaufen keine versteckten Leadgebühren.</p>
              <p>Sie zahlen keine Provision auf Aufträge.</p>
              <p>Sie kaufen keine leere Reichweite.</p>
            </div>
            <div className="rounded-md border border-line bg-[#fbfcff] p-4">
              <p className="text-base leading-7 text-[#30415f]">Sie investieren in:</p>
              <ul className="mt-3 grid gap-2 text-base font-semibold leading-7 text-ink">
                <li>Struktur.</li>
                <li>Vertrauen.</li>
                <li>Verifizierung.</li>
                <li>professionelle Auffindbarkeit.</li>
              </ul>
              <p className="mt-4 text-base leading-7 text-[#30415f]">
                Bei GewerkeListe kann man Qualität sichtbar machen.
                <br />
                Aber keine Relevanz kaufen.
              </p>
            </div>
          </div>
        </section>

        <TextSection title="Für Betriebe, die gefunden werden wollen, bevor man ihren Namen kennt.">
          <p>Ihre Website wird gefunden, wenn man Ihren Namen kennt.</p>
          <p>GewerkeListe macht Sie sichtbar, wenn jemand nach Ihrem Gewerk, Ihrer Leistung und Ihrer Region sucht.</p>
          <p>Genau dort entsteht der Wert.</p>
          <p>Nicht irgendwann.</p>
          <p>Nicht irgendwo.</p>
          <p>
            Sondern in dem Moment, in dem ein Bauherr, Architekt, Verwalter oder institutioneller Auftraggeber nach
            einem passenden Betrieb sucht.
          </p>
        </TextSection>

        <section className="mt-10 rounded-lg border border-[#9bbbd2] bg-[#09284e] p-6 text-white shadow-soft sm:p-8">
          <h2 className="text-2xl font-semibold tracking-normal">Verifiziertes Startprofil</h2>
          <p className="mt-3 text-3xl font-semibold">490 € netto für 12 Monate</p>
          <p className="mt-5 max-w-3xl text-base leading-7 text-blue-100">
            Für Betriebe, die nicht nur online sein wollen — sondern im richtigen Moment gefunden werden wollen.
          </p>
          <p className="mt-4 text-sm leading-6 text-blue-100">
            <Link className="font-semibold underline decoration-white/40 underline-offset-4 hover:text-white" href={verifiedExampleHref}>
              Beispiel eines verifizierten Profils ansehen
            </Link>
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-brand hover:bg-blue-50"
              href={"/eintrag-beanspruchen" as Route}
            >
              Jetzt als Betrieb verifizieren lassen
            </Link>
          </div>
          <p className="mt-6 text-sm font-semibold text-blue-100">Oder zunächst kostenlos sichtbar werden:</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/35 px-5 text-sm font-semibold text-white hover:bg-white/10"
              href={"/betrieb-eintragen" as Route}
            >
              Kostenloses Basisprofil eintragen
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionIntro({ title }: { title: string }) {
  return <h2 className="text-2xl font-semibold tracking-normal text-ink">{title}</h2>;
}

function OfferCard({
  title,
  price,
  intro,
  body,
  items,
  itemsTitle = "Enthalten:",
  includedTitle = "Enthalten:",
  includedItems,
  after,
  cta,
  href,
  exampleHref,
  highlighted,
}: {
  title: string;
  price: string;
  intro: string;
  body: string;
  items: string[];
  itemsTitle?: string;
  includedTitle?: string;
  includedItems?: string[];
  after: string;
  cta: string;
  href: string;
  exampleHref?: Route;
  highlighted?: boolean;
}) {
  return (
    <section className={`rounded-lg border p-5 shadow-soft sm:p-6 ${highlighted ? "border-[#9bbbd2] bg-white" : "border-line bg-white"}`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-2xl font-semibold tracking-normal text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{intro}</p>
        </div>
        <div className="shrink-0 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-right">
          <div className="text-xl font-semibold text-ink">{price}</div>
        </div>
      </div>
      <p className="mt-5 text-base leading-7 text-[#30415f]">{body}</p>
      {itemsTitle ? <p className="mt-5 text-sm font-semibold text-ink">{itemsTitle}</p> : null}
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#30415f]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true">-</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {includedItems ? (
        <ul className="mt-5 grid gap-2 text-sm leading-6 text-[#30415f]">
          {includedItems.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-5 text-base leading-7 text-[#30415f]">{after}</p>
      {exampleHref ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          <Link className="font-semibold text-action hover:underline" href={exampleHref}>
            So kann ein verifiziertes Startprofil aussehen
          </Link>
        </p>
      ) : null}
      <div className="mt-6">
        {highlighted ? <PrimaryLink href={href}>{cta}</PrimaryLink> : <SecondaryLink href={href}>{cta}</SecondaryLink>}
      </div>
    </section>
  );
}

function TextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-2xl font-semibold tracking-normal text-ink">{title}</h2>
      <div className="mt-5 max-w-4xl space-y-4 text-base leading-7 text-[#30415f]">{children}</div>
    </section>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href={href as Route}>
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href={href as Route}>
      {children}
    </Link>
  );
}
