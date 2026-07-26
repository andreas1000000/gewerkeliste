import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ServiceAreaPreview } from "@/components/map/service-area-preview";
import { SiteHeader } from "@/components/site-header";
import { getPublicCompanies } from "@/lib/data/public-directory";
import { getPublishedPageContent } from "@/lib/data/site-pages";
import { getPageSection } from "@/lib/site-page-content";
import type { ServiceAreaGeoJson } from "@/lib/geo/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { tradeTaxonomy } from "@/lib/trade-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GewerkeListe.com – Die digitale Infrastruktur für Baugewerke",
  description:
    "Regionale B2B-Suche für Baugewerke: passende Fachbetriebe nach Gewerk, Leistung, Spezialisierung und Region finden – ohne Leadportal und ohne Preisdruck.",
  alternates: {
    canonical: "/",
  },
};

const benefits = [
  {
    title: "Passende Betriebe schneller finden",
    text: "Für Planer, Bauleiter, GU, Kommunen und professionelle Bauherren entsteht eine strukturierte Suche nach Gewerk, Leistung und Region.",
  },
  {
    title: "Region und Wirkungskreis einordnen",
    text: "Nicht nur Sitz und Radius zählen. GewerkeListe.com macht sichtbar, in welchen Regionen ein Betrieb fachlich relevant ist.",
  },
];

const comparisons = [
  {
    title: "Allgemeine Suchmaschinen",
    items: ["wenig fachliche Struktur", "Spezialisierungen oft schwer erkennbar", "Tätigkeitsgebiet unklar"],
  },
  {
    title: "Klassische Auftragsportale",
    items: ["einzelne Anfragen", "oft Preisdruck"],
  },
  {
    title: "GewerkeListe.com",
    items: [
      "strukturierte Gewerkeliste",
      "Leistungen sichtbar",
      "Region und Tätigkeitsgebiet",
      "Datenbestätigung statt Qualitätsversprechen",
      "direkte Kontaktaufnahme",
      "langfristiger Fachbetriebseintrag mit voller Leistungsbreite",
    ],
    positive: true,
  },
];

const exampleServiceArea: ServiceAreaGeoJson = {
  type: "Polygon",
  coordinates: [
    [
      [12.06, 47.78],
      [12.18, 47.91],
      [12.38, 47.9],
      [12.47, 47.79],
      [12.3, 47.69],
      [12.12, 47.7],
      [12.06, 47.78],
    ],
  ],
};

export default async function HomePage() {
  const companies = isSupabaseConfigured() ? await getPublicCompanies() : [];
  const pageContent = await getPublishedPageContent("home");
  const preferredTradeSlugs = [
    "pflasterbau",
    "bauwerksabdichtung",
    "metallbau",
    "trockenbau",
    "dachdecker",
    "elektroinstallation",
    "sanitaer",
    "heizung",
    "malerarbeiten",
    "fliesenarbeiten",
    "garten-landschaftsbau",
    "maurerarbeiten",
  ];
  const visibleTrades = preferredTradeSlugs
    .map((slug) => tradeTaxonomy.find((trade) => trade.slug === slug))
    .filter((trade): trade is (typeof tradeTaxonomy)[number] => Boolean(trade));
  const latestCompanies = companies.slice(0, 3);
  const verifiedCount = companies.filter((company) => company.verified).length;
  const regionCount = new Set(companies.map((company) => company.city)).size;
  const showRealMetrics = companies.length > 0 || tradeTaxonomy.length > 0;
  const benefitsSection = getPageSection(pageContent, "home-benefits");
  const marketSection = getPageSection(pageContent, "home-market");
  const audiencesSection = getPageSection(pageContent, "home-audiences");
  const projectsSection = getPageSection(pageContent, "home-projects");
  const tradesSection = getPageSection(pageContent, "home-trades");
  const serviceAreaSection = getPageSection(pageContent, "home-service-area");
  const businessSection = getPageSection(pageContent, "home-business");
  const comparisonSection = getPageSection(pageContent, "home-comparison");
  const proofSection = getPageSection(pageContent, "home-proof");
  const closingSection = getPageSection(pageContent, "home-closing");

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(18,58,111,0.05),rgba(47,143,91,0.04)_42%,rgba(255,255,255,0)_70%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">{pageContent.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
              {pageContent.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-ink">
              {pageContent.intro}
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-brand">
              <TrustItem text="Strukturierte Betriebsdaten" />
              <TrustItem text="Regionale Suche" />
              <TrustItem text="Direkte Kontaktaufnahme" />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
              GewerkeListe.com ersetzt keine persönlichen Empfehlungen. Die Plattform macht den Markt davor besser
              sichtbar: strukturierte Betriebsdaten, nachvollziehbare Quellen, Claim-Prozess und später Wirkungskreis,
              Kapazitätsbezug und Sichtbarkeitsreport.
            </p>

            <form action="/suche" className="mt-8 rounded-lg border border-[#183b7a] bg-[#07173d] p-5 shadow-soft sm:p-6">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Der direkte Einstieg</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Fachbetriebe suchen</h2>
                <p className="mt-2 text-sm leading-6 text-blue-100">Gewerk, Leistung und Ort eingeben – dann passende Betriebe direkt finden.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label className="grid gap-1.5 text-xs font-semibold text-blue-50">
                  Was suchen Sie?
                  <input
                    name="q"
                    className="h-12 rounded-md border border-line bg-white px-3 text-sm font-normal text-ink outline-none focus:border-action"
                    placeholder="z. B. Pflasterbau, Abdichtung, Metallbau"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-blue-50">
                  Wo suchen Sie?
                  <input
                    name="ort"
                    className="h-12 rounded-md border border-line bg-white px-3 text-sm font-normal text-ink outline-none focus:border-action"
                    placeholder="Ort oder PLZ"
                  />
                </label>
                <button className="mt-auto h-12 rounded-md bg-[#2f8f5b] px-6 text-sm font-semibold text-white hover:bg-[#26784b]">
                  Fachbetrieb suchen
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-blue-100">
                <span>Strukturierte Betriebsdaten</span>
                <span>·</span>
                <span>Leistungen</span>
                <span>·</span>
                <span>Einsatzgebiet</span>
                <span>·</span>
                <span>Datenbestätigung</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <OutlineLink href={pageContent.primaryHref as Route}>{pageContent.primaryLabel}</OutlineLink>
                <OutlineLink href={pageContent.secondaryHref as Route}>{pageContent.secondaryLabel}</OutlineLink>
              </div>
            </form>

            <div className="relative mt-10 overflow-hidden rounded-lg border border-line bg-[#07173d] shadow-soft">
              <video
                className="aspect-[16/7] w-full object-cover opacity-95"
                autoPlay
                muted
                playsInline
                preload="metadata"
                aria-label="Baugewerke und Baustellensituation als Hintergrundvideo"
              >
                <source src="/videos/gewerkeliste-homepage-background.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,23,61,0)_48%,rgba(7,23,61,0.68))]" />
            </div>
          </div>
        </div>
      </section>

      {benefitsSection?.enabled ? <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-[#07173d]">{benefitsSection.title}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {(benefitsSection.items.length ? benefitsSection.items : benefits.map((benefit) => ({ label: benefit.title, detail: benefit.text }))).map((benefit) => (
            <Card key={benefit.label}>
              <h3 className="text-lg font-semibold text-ink">{benefit.label}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{benefit.detail}</p>
            </Card>
          ))}
        </div>
      </section> : null}

      {marketSection?.enabled ? <section className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <Card>
          <h2 className="text-2xl font-semibold text-[#07173d]">
            {marketSection.title}
          </h2>
          <p className="mt-4 whitespace-pre-line text-base leading-7 text-ink">{marketSection.body}</p>
        </Card>
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {marketSection.items.map((item) => (
              <CheckLine key={item.label}>{item.detail ? `${item.label}: ${item.detail}` : item.label}</CheckLine>
            ))}
          </div>
        </Card>
      </section> : null}

      {audiencesSection?.enabled ? <section className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Card>
          <h2 className="text-2xl font-semibold text-[#07173d]">{audiencesSection.title}</h2>
          {audiencesSection.items.map((item) => <Step key={item.label} number={item.label} text={item.detail} />)}
          <div className="mt-6">
            <BlueLink href={(audiencesSection.primaryHref || "/suche") as Route}>{audiencesSection.primaryLabel || "Fachbetrieb suchen"}</BlueLink>
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-semibold text-[#07173d]">Für Fachbetriebe</h2>
          <Step number="1" text="Eintrag finden oder neu anlegen" />
          <Step number="2" text="Betriebsdaten übernehmen oder korrigieren" />
          <Step number="3" text="volle Leistungsbreite und Wirkungskreis darstellen" />
          <p className="mt-5 rounded-md border border-[#b9dec8] bg-[#eef9f2] px-4 py-3 text-sm font-semibold text-brand">
            Zeig, was dein Betrieb wirklich kann: Gewerke, Leistungen, Spezialisierungen und Tätigkeitsgebiet klar darstellen.
          </p>
          <div className="mt-6">
            <BlueLink href="/eintrag-beanspruchen">Eintrag beanspruchen</BlueLink>
          </div>
        </Card>
      </section> : null}

      {projectsSection?.enabled ? <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">{projectsSection.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#07173d]">{projectsSection.title}</h2>
            <p className="mt-4 whitespace-pre-line text-base font-semibold leading-7 text-ink">{projectsSection.body}</p>
          </div>
          <div className="mt-6 flex items-center lg:mt-0 lg:justify-end">
            <BlueLink href={(projectsSection.primaryHref || "/suche") as Route}>{projectsSection.primaryLabel || "Gewerk suchen"}</BlueLink>
          </div>
        </div>
      </section> : null}

      {tradesSection?.enabled ? <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-[#07173d]">{tradesSection.title}</h2>
            <p className="mt-2 text-sm text-muted">{tradesSection.body}</p>
          </div>
          <Link className="text-sm font-semibold text-[#1f5fd4] hover:underline" href={(tradesSection.primaryHref || "/gewerke") as Route}>
            {tradesSection.primaryLabel || "Alle Gewerke anzeigen"}
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleTrades.map((trade) => (
            <Link
              key={trade.slug}
              className="rounded-lg border border-line bg-white p-5 text-sm font-semibold text-[#07173d] shadow-soft hover:border-[#1f5fd4]"
              href={`/suche?gewerk=${trade.slug}` as Route}
            >
              {trade.name}
            </Link>
          ))}
        </div>
      </section> : null}

      {serviceAreaSection?.enabled ? <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">{serviceAreaSection.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#07173d]">{serviceAreaSection.title}</h2>
          <p className="mt-4 whitespace-pre-line text-base leading-7 text-ink">{serviceAreaSection.body}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {serviceAreaSection.items.map((item) => <CheckLine key={item.label}>{item.label}</CheckLine>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <BlueLink href={(serviceAreaSection.primaryHref || "/suche") as Route}>{serviceAreaSection.primaryLabel || "Gewerke suchen"}</BlueLink>
            <OutlineLink href={(serviceAreaSection.secondaryHref || "/betrieb-eintragen") as Route}>{serviceAreaSection.secondaryLabel || "Betrieb eintragen"}</OutlineLink>
          </div>
        </div>
        <ServiceAreaPreview
          geojson={exampleServiceArea}
          label="Wirkungskreis: Rosenheim / Chiemgau"
          regionNames={["Rosenheim", "Chiemgau"]}
          status="draft"
          type="manual_drawn"
        />
      </section> : null}

      {businessSection?.enabled ? <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-[#082a63] p-6 text-white shadow-soft sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div>
            <h2 className="text-2xl font-semibold">{businessSection.title}</h2>
            <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-blue-50">{businessSection.body}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {businessSection.items.map((item) => <WhiteCheck key={item.label}>{item.label}</WhiteCheck>)}
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-white p-5 text-ink lg:mt-0">
            <h3 className="text-lg font-semibold text-[#07173d]">Ist Ihr Betrieb schon gelistet?</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Suchen Sie Ihren Betrieb und übernehmen Sie den Eintrag, wenn die Daten bestätigt werden sollen.
            </p>
            <div className="mt-5 grid gap-3">
              <BlueLink href={(businessSection.primaryHref || "/eintrag-beanspruchen") as Route}>{businessSection.primaryLabel || "Eintrag beanspruchen"}</BlueLink>
              <OutlineLink href={(businessSection.secondaryHref || "/betrieb-eintragen") as Route}>{businessSection.secondaryLabel || "Betrieb eintragen"}</OutlineLink>
            </div>
          </div>
        </div>
      </section> : null}

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-3 lg:px-8">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Marktübersicht</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">Für den gesamten Bau- und Handwerksmarkt.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">
            Jeder Betrieb soll unabhängig von Region, Größe oder Unternehmensalter die Möglichkeit haben, seine
            Leistungen klar darzustellen und gefunden zu werden.
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Kein Lead-Portal</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">Passende Betriebe statt Preiskampf.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">
            GewerkeListe.com soll nicht den billigsten Anbieter finden, sondern passende Betriebe sichtbar machen:
            nach Gewerk, Leistung, Region und nachvollziehbaren Betriebsdaten.
          </p>
        </Card>
      </section>

      {comparisonSection?.enabled ? <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-[#07173d]">{comparisonSection.title}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {(comparisonSection.items.length ? comparisonSection.items : comparisons.map((item) => ({ label: item.title, detail: item.items.join(" · ") }))).map((item, index) => (
            <Card key={item.label}>
              <h3 className="text-lg font-semibold text-ink">{item.label}</h3>
              <ul className="mt-4 grid gap-2 text-sm text-muted">
                {item.detail.split(" · ").filter(Boolean).map((point) => (
                  <li key={point}>
                    <span className={`mr-2 font-semibold ${index === 2 ? "text-brand" : "text-accent"}`}>{index === 2 ? "✓" : "×"}</span>
                    {point}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section> : null}

      {proofSection?.enabled ? <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <Card>
          <h2 className="text-xl font-semibold text-[#07173d]">{proofSection.title}</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted">{proofSection.body}</p>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-[#07173d]">{proofSection.items[0]?.label || "Aus echter Baupraxis entstanden."}</h2>
          <p className="mt-4 text-sm leading-6 text-muted">{proofSection.items[0]?.detail}</p>
          <Link className="mt-5 inline-flex text-sm font-semibold text-[#1f5fd4] hover:underline" href={"/ueber-gewerkeliste" as Route}>
            Mehr über GewerkeListe.com
          </Link>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-[#07173d]">{proofSection.items[1]?.label || "Aufbauphase"}</h2>
          {latestCompanies.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {latestCompanies.map((company) => (
                <Link key={company.id} className="block rounded-md border border-line p-3 hover:border-[#1f5fd4]" href={`/firma/${company.slug}` as Route}>
                  <span className="text-sm font-semibold text-ink">{company.name}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {company.trades?.name} · {company.city}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">{proofSection.items[1]?.detail}</p>
          )}
          {showRealMetrics ? (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {companies.length > 0 ? <Metric label="Betriebe" value={companies.length} /> : null}
              {verifiedCount > 0 ? <Metric label="Bestätigt" value={verifiedCount} /> : null}
              {regionCount > 0 ? <Metric label="Regionen" value={regionCount} /> : null}
              <Metric label="Gewerke" value={tradeTaxonomy.length} />
            </div>
          ) : null}
        </Card>
      </section> : null}

      {closingSection?.enabled ? <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 text-center shadow-soft sm:p-8">
          <h2 className="text-3xl font-semibold text-[#07173d]">{closingSection.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-muted">{closingSection.body}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <BlueLink href={(closingSection.primaryHref || "/suche") as Route}>{closingSection.primaryLabel || "Fachbetrieb suchen"}</BlueLink>
            <OutlineLink href={(closingSection.secondaryHref || "/eintrag-beanspruchen") as Route}>{closingSection.secondaryLabel || "Eintrag beanspruchen"}</OutlineLink>
            <OutlineLink href="/betrieb-eintragen">Betrieb eintragen</OutlineLink>
          </div>
        </div>
      </section> : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">{children}</section>;
}

function TrustItem({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-action" />
      {text}
    </span>
  );
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfaf7] px-4 py-3 text-sm font-medium text-ink">
      <span className="mr-2 font-semibold text-brand">✓</span>
      {children}
    </div>
  );
}

function WhiteCheck({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-medium text-blue-50">
      <span className="mr-2 font-semibold text-white">✓</span>
      {children}
    </div>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="mt-4 flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8f3ef] text-sm font-semibold text-brand">
        {number}
      </span>
      <p className="pt-1 text-sm font-medium text-ink">{text}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-[#fbfaf7] px-3 py-2">
      <div className="text-lg font-semibold text-[#07173d]">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function BlueLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1f5fd4] px-5 text-sm font-semibold text-white hover:bg-[#174eb2]" href={href}>
      {children}
    </Link>
  );
}

function OutlineLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-[#1f5fd4] hover:border-[#1f5fd4]" href={href}>
      {children}
    </Link>
  );
}

function structuredData() {
  const baseUrl = "https://gewerkeliste.com";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "GewerkeListe.com",
        url: baseUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/suche?ort={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: "GewerkeListe.com",
        url: baseUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Start",
            item: baseUrl,
          },
        ],
      },
    ],
  };
}
