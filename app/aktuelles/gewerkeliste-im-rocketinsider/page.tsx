import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const sourceUrl = "https://www.th-rosenheim.de/forschung-innovation/entrepreneurship/newsletter-rocketinsider";
const pageUrl = "https://gewerkeliste.com/aktuelles/gewerkeliste-im-rocketinsider";

export const metadata: Metadata = {
  title: "GewerkeListe.com im ROCkETinsider | TH Rosenheim",
  description:
    "ROCkET, das Gründungszentrum der Technischen Hochschule Rosenheim, stellt GewerkeListe.com und Gründer Andreas Moser in der Juli-Ausgabe 2026 vor.",
  alternates: {
    canonical: "/aktuelles/gewerkeliste-im-rocketinsider",
  },
  openGraph: {
    title: "GewerkeListe.com im ROCkETinsider | TH Rosenheim",
    description:
      "ROCkET stellt GewerkeListe.com und Gründer Andreas Moser in der Juli-Ausgabe 2026 vor.",
    type: "article",
    url: pageUrl,
  },
  twitter: {
    card: "summary",
    title: "GewerkeListe.com im ROCkETinsider | TH Rosenheim",
    description:
      "ROCkET stellt GewerkeListe.com und Gründer Andreas Moser in der Juli-Ausgabe 2026 vor.",
  },
};

export default function RocketInsiderPublicationPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />

      <div className="border-b border-line bg-white">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 py-3 text-sm text-muted sm:px-6 lg:px-8">
          <Link className="hover:text-ink" href="/">
            Start
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">ROCkETinsider</span>
        </nav>
      </div>

      <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Presse / Gründungsinsights</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
            GewerkeListe.com im ROCkETinsider der TH Rosenheim
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink">
            ROCkET, das Gründungszentrum der Technischen Hochschule Rosenheim, stellt GewerkeListe.com und Gründer
            Andreas Moser in der Juli-Ausgabe 2026 ausführlich vor.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold text-muted">
            <span className="rounded-full border border-line bg-white px-3 py-1.5">ROCkETinsider</span>
            <span className="rounded-full border border-line bg-white px-3 py-1.5">Juli 2026</span>
            <span className="rounded-full border border-line bg-white px-3 py-1.5">Interview, Seiten 9–10</span>
          </div>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Section title="Ein Gründungsprojekt aus der Baupraxis">
              <p>
                GewerkeListe.com entsteht aus einem konkreten Problem der Baupraxis: Passende Bau- und
                Handwerksbetriebe sollen nach Gewerk, konkreter Leistung, Region und Wirkungskreis auffindbar werden.
              </p>
              <p>
                Die Plattform ist keine Auftragsauktion und kein Leadportal. Das Basisprofil bleibt kostenlos. Gute
                Betriebe sollen aufgrund ihrer passenden Leistung gefunden werden – nicht nur, weil bereits jemand ihre
                Telefonnummer kennt.
              </p>
            </Section>

            <Section title="Sparring für die nächsten Schritte">
              <p>
                ROCkET berät Andreas Moser bei der Weiterentwicklung der Gründungsinitiative. Andreas Moser nahm mit
                GewerkeListe.com am Startup Camp 2026 teil. ROCkET und die TH Rosenheim sind dabei wichtige
                Sparringspartner, um Annahmen zu prüfen, Prioritäten zu klären und aus dem Praxisproblem ein
                skalierbares Produkt und Geschäftsmodell zu entwickeln.
              </p>
              <p>
                Der Ausbau konzentriert sich zunächst auf den Landkreis Rosenheim und gegebenenfalls weitere Regionen.
                Langfristig soll eine digitale, faire Grundlage für die Gewerkesuche im Bauwesen entstehen.
              </p>
            </Section>

            <figure className="rounded-lg border border-[#c9d9d3] bg-[#eef9f2] p-6 shadow-soft sm:p-8">
              <blockquote className="text-2xl font-semibold leading-9 text-brand">
                „Wartet nicht, bis alles perfekt ist. Baut eine erste Version, sprecht mit echten Nutzern und verbessert
                konsequent weiter.“
              </blockquote>
              <figcaption className="mt-4 text-sm leading-6 text-muted">
                Aussage von Andreas Moser im ROCkETinsider, Juli 2026.
              </figcaption>
            </figure>

            <section aria-labelledby="participate-title" className="rounded-lg bg-[#082a63] p-6 text-white shadow-soft sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-normal text-blue-100">Mitmachen</p>
              <h2 id="participate-title" className="mt-2 text-3xl font-semibold">
                GewerkeListe.com mitgestalten
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-blue-50">
                Gesucht werden Studierende der TH Rosenheim und anderer Hochschulen, Webentwicklerinnen und
                Webentwickler, Menschen mit Erfahrung in Datenbanken, Suchtechnologie, Kartenfunktionen und
                Plattformökonomie sowie Bau- und Handwerksexperten und mögliche technische Mitgründer.
              </p>
              <a
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-[#082a63] hover:bg-blue-50"
                href="mailto:kontakt@gewerkeliste.com?subject=Mitarbeit%20%2F%20Hochschulkooperation"
              >
                Mit Andreas Kontakt aufnehmen
              </a>
            </section>
          </div>

          <aside className="h-fit space-y-5 lg:sticky lg:top-6">
            <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-normal text-brand">Quelle</p>
              <h2 className="mt-2 text-xl font-semibold text-[#07173d]">ROCkET – Gründungszentrum der Technischen Hochschule Rosenheim</h2>
              <p className="mt-4 text-sm leading-6 text-muted">
                Der ROCkETinsider stellt GewerkeListe.com in seiner Juli-Ausgabe 2026 vor. Den Originalbeitrag finden Sie
                in der Ausgabe auf den Seiten 9–10.
              </p>
              <a
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-line bg-white px-5 text-center text-sm font-semibold text-action hover:border-action"
                href={sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                ROCkETinsider-Archiv öffnen
              </a>
              <p className="mt-3 text-xs leading-5 text-muted">
                Die Seite verlinkt die offizielle ROCkETinsider-Übersicht. Eine direkte öffentliche PDF-URL der Ausgabe
                Juli 2026 ist derzeit nicht belastbar dokumentiert; daher wird kein Dateipfad geraten oder kopiert.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-panel p-6">
              <p className="text-sm font-semibold uppercase tracking-normal text-brand">Einordnung</p>
              <p className="mt-3 text-sm leading-6 text-ink">
                ROCkET und die TH Rosenheim werden hier als Beratung und Sparring eingeordnet. Diese Veröffentlichung
                behauptet keine formale Hochschulpartnerschaft, Empfehlung, Förderung oder Zertifizierung.
              </p>
            </div>
          </aside>
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData()) }} />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
      <h2 className="text-2xl font-semibold text-[#07173d]">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-ink">{children}</div>
    </section>
  );
}

function articleStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "GewerkeListe.com im ROCkETinsider der TH Rosenheim",
    description:
      "ROCkET stellt GewerkeListe.com und Gründer Andreas Moser in der Juli-Ausgabe 2026 vor.",
    mainEntityOfPage: pageUrl,
    author: {
      "@type": "Person",
      name: "Andreas Moser",
    },
    publisher: {
      "@type": "Organization",
      name: "GewerkeListe.com",
      url: "https://gewerkeliste.com",
    },
    isPartOf: {
      "@type": "CreativeWork",
      name: "ROCkETinsider, Juli 2026",
      url: sourceUrl,
    },
    citation: sourceUrl,
  };
}
