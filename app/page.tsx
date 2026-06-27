import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ServiceAreaPreview } from "@/components/map/service-area-preview";
import { SiteHeader } from "@/components/site-header";
import { getPublicCompanies } from "@/lib/data/public-directory";
import type { ServiceAreaGeoJson } from "@/lib/geo/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { tradeTaxonomy } from "@/lib/trade-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GewerkeListe.com – Regionale Gewerke-Suche für Bauprojekte",
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

const registerFields = [
  "Gewerk",
  "Ort und Region",
  "angebotene Leistungen",
  "Wirkungskreis und Tätigkeitsgebiet",
  "Kontakt",
  "Verifizierungsstatus ohne Qualitätsgarantie",
  "Referenzen, soweit vorhanden",
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
  const companies = await getHomepageCompanies();
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

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(18,58,111,0.05),rgba(47,143,91,0.04)_42%,rgba(255,255,255,0)_70%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="relative mb-10 overflow-hidden rounded-lg border border-line bg-[#07173d] shadow-soft">
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

          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Die digitale Infrastruktur der Bauwirtschaft</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
              Die regionale Gewerke-Suche für professionelle Bauprojekte.
            </h1>
            <p className="mt-6 text-lg leading-8 text-ink">
              Finden Sie passende Bau- und Handwerksbetriebe nach Gewerk, Leistung, Spezialisierung und Region –
              ohne Leadportal, ohne Preisdruck, mit strukturierter Datenbasis.
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

            <form action="/suche" className="mt-8 rounded-lg border border-line bg-white p-4 shadow-soft">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label className="grid gap-1.5 text-xs font-semibold text-brand">
                  Was suchen Sie?
                  <input
                    name="q"
                    className="h-12 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-action"
                    placeholder="z. B. Pflasterbau, Abdichtung, Metallbau"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-brand">
                  Wo suchen Sie?
                  <input
                    name="ort"
                    className="h-12 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-action"
                    placeholder="Ort oder PLZ"
                  />
                </label>
                <button className="mt-auto h-12 rounded-md bg-action px-6 text-sm font-semibold text-white hover:bg-brand">
                  Fachbetrieb suchen
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted">
                <span>Strukturierte Betriebsdaten</span>
                <span>·</span>
                <span>Leistungen</span>
                <span>·</span>
                <span>Einsatzgebiet</span>
                <span>·</span>
                <span>Datenbestätigung</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <BlueLink href="/betrieb-eintragen">Kostenlosen Basiseintrag sichern</BlueLink>
                <OutlineLink href="/eintrag-beanspruchen">Eintrag beanspruchen</OutlineLink>
                <OutlineLink href="/preise">Gründungsmitglied werden</OutlineLink>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-[#07173d]">Schneller zum passenden Fachbetrieb.</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <Card key={benefit.title}>
              <h3 className="text-lg font-semibold text-ink">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{benefit.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <Card>
          <h2 className="text-2xl font-semibold text-[#07173d]">
            Der Markt ist nicht leer. Er ist schlecht sortiert.
          </h2>
          <p className="mt-4 text-base leading-7 text-ink">
            In der Baupraxis geht viel Zeit verloren, weil Informationen zu Fachbetrieben verstreut sind: Website,
            Empfehlung, Branchenbuch, Suchmaschine oder persönliche Kontaktliste. GewerkeListe.com bringt diese
            Informationen in eine fachliche B2B-Suchlogik vor Ausschreibung, Anfrage und Vergabe.
          </p>
        </Card>
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {registerFields.map((field) => (
              <CheckLine key={field}>{field}</CheckLine>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Card>
          <h2 className="text-2xl font-semibold text-[#07173d]">Für Planer, Bauleiter und Auftraggeber</h2>
          <Step number="1" text="Gewerk und Ort eingeben" />
          <Step number="2" text="Leistung, Spezialisierung und Region einordnen" />
          <Step number="3" text="passende Betriebe direkt kontaktieren" />
          <div className="mt-6">
            <BlueLink href="/suche">Fachbetrieb suchen</BlueLink>
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
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Kostenlose Grundsichtbarkeit</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">Der Basiseintrag bleibt offen.</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Betriebe können Gewerke, Leistungen, Spezialisierungen, Standort und Kontaktwege sichtbar machen. Die
              vollständige Leistungsbreite wird nicht hinter eine Paywall gestellt.
            </p>
            <Link className="mt-5 inline-flex text-sm font-semibold text-[#1f5fd4] hover:underline" href="/betrieb-eintragen">
              Basiseintrag sichern
            </Link>
          </Card>
          <Card>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Kein Leadportal</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">Keine Auktion. Kein Preisdruck.</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              GewerkeListe.com verkauft keine einzelnen Kontakte. Die Plattform schafft strukturierte B2B-Sichtbarkeit
              vor Ausschreibung, Anfrage und Vergabe.
            </p>
            <Link className="mt-5 inline-flex text-sm font-semibold text-[#1f5fd4] hover:underline" href="/ueber-gewerkeliste">
              Warum GewerkeListe?
            </Link>
          </Card>
          <Card>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Landkreis Rosenheim startet jetzt</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">Erster echter Markt statt Streuverlust.</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Rosenheim/Chiemgau wird als erster Proof-of-Market aufgebaut: regionale Dichte, geprüfte Kandidaten,
              Claims, Sichtbarkeit und erste zahlende Unterstützer.
            </p>
            <Link className="mt-5 inline-flex text-sm font-semibold text-[#1f5fd4] hover:underline" href="/preise">
              Gründungsmitglied werden
            </Link>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Für Bauprojekte</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#07173d]">Finde Betriebe, die zur Aufgabe und zur Region passen.</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-ink">
              GewerkeListe.com ordnet Leistungen, Standorte und Wirkungskreise so, dass Projektbeteiligte schneller
              eine belastbare Vorauswahl treffen können.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Der Wert entsteht nicht durch Druck oder Preiskampf, sondern durch bessere Marktübersicht: welches Gewerk,
              welche Leistung, welche Region, welcher Kontaktweg.
            </p>
          </div>
          <div className="mt-6 flex items-center lg:mt-0 lg:justify-end">
            <BlueLink href="/suche">Gewerk suchen</BlueLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-[#07173d]">Gewerke entdecken</h2>
            <p className="mt-2 text-sm text-muted">Wichtige Baugewerke als strukturierter Einstieg in die Suche.</p>
          </div>
          <Link className="text-sm font-semibold text-[#1f5fd4] hover:underline" href={"/gewerke" as Route}>
            Alle Gewerke anzeigen
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
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Wirkungskreis-Suche</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#07173d]">Nicht nur Standort. Wirkungskreis.</h2>
          <p className="mt-4 text-base leading-7 text-ink">
            Handwerksbetriebe arbeiten nicht in perfekten Kreisen. GewerkeListe macht sichtbar, in welchen Regionen,
            Orten und Projektgebieten Betriebe tatsächlich aktiv sein wollen.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <CheckLine>Firmenstandort als Punkt</CheckLine>
            <CheckLine>Einsatzgebiet als Wirkungskreis</CheckLine>
            <CheckLine>später frei markierbar mit Karte</CheckLine>
            <CheckLine>geprüft vor Veröffentlichung</CheckLine>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted">
            Karten- und Wirkungskreisfunktionen werden schrittweise ausgebaut. Wirkungskreise können vom Betrieb
            angegeben oder aus Quellen abgeleitet und geprüft werden.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BlueLink href="/suche">Gewerke suchen</BlueLink>
            <OutlineLink href="/betrieb-eintragen">Betrieb eintragen</OutlineLink>
          </div>
        </div>
        <ServiceAreaPreview
          geojson={exampleServiceArea}
          label="Wirkungskreis: Rosenheim / Chiemgau"
          regionNames={["Rosenheim", "Chiemgau"]}
          status="draft"
          type="manual_drawn"
        />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-[#082a63] p-6 text-white shadow-soft sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div>
            <h2 className="text-2xl font-semibold">Ihr Betrieb. Ihre Leistungen. Ihr Tätigkeitsgebiet.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-blue-50">
              Ein Betriebseintrag zeigt sachlich, welche Leistungen Ihr Betrieb anbietet, wo Sie tätig sind und wie
              Auftraggeber Sie erreichen können. Die vollständige Nennung von Gewerken, Leistungen und Spezialisierungen
              gehört zur Grundsichtbarkeit und wird nicht künstlich begrenzt.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <WhiteCheck>Betriebsdaten bestätigen</WhiteCheck>
              <WhiteCheck>Leistungsbreite vollständig darstellen</WhiteCheck>
              <WhiteCheck>Wirkungskreis festlegen</WhiteCheck>
              <WhiteCheck>Kontaktwege aktuell halten</WhiteCheck>
            </div>
            <p className="mt-5 text-sm leading-6 text-blue-50">
              GewerkeListe.com ist kein System für Preiskampf und verkauft keine einzelnen Anfragen. Ziel ist eine
              professionelle Daten- und Vertrauensschicht für echte Baugewerke.
            </p>
          </div>
          <div className="mt-6 rounded-lg bg-white p-5 text-ink lg:mt-0">
            <h3 className="text-lg font-semibold text-[#07173d]">Jetzt im Landkreis Rosenheim starten</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Kostenlosen Basiseintrag sichern, Profil übernehmen oder als Gründungsmitglied den Aufbau der regionalen
              Gewerke-Suche unterstützen.
            </p>
            <div className="mt-5 grid gap-3">
              <BlueLink href="/betrieb-eintragen">Kostenlosen Basiseintrag sichern</BlueLink>
              <OutlineLink href="/betrieb-eintragen">Betrieb eintragen</OutlineLink>
              <OutlineLink href="/preise">Gründungsmitglied werden</OutlineLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#b9dec8] bg-[#eef9f2] p-6 shadow-soft sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Gründungsmitglied Landkreis Rosenheim</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#07173d]">Sichtbarkeit aufbauen, bevor der Markt sortiert ist.</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Das Gründungsmitglied-Angebot richtet sich an Betriebe, die GewerkeListe.com in Rosenheim/Chiemgau früh
              unterstützen und ihr Profil als professionelle Website-Ergänzung ausbauen möchten.
            </p>
            <div className="mt-5 grid gap-2 text-sm text-ink sm:grid-cols-2">
              <CheckLine>Founding-Member-Badge</CheckLine>
              <CheckLine>Logo und erweiterte Beschreibung</CheckLine>
              <CheckLine>Projektbilder und Referenzen später</CheckLine>
              <CheckLine>QR-Code und Kurz-URL geplant</CheckLine>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              Kein Qualitäts-, Auftrags- oder Verfügbarkeitsversprechen. Der Basiseintrag bleibt unabhängig davon
              kostenlos sichtbar.
            </p>
          </div>
          <div className="mt-6 rounded-lg border border-line bg-white p-5 lg:mt-0">
            <div className="text-sm font-semibold uppercase tracking-normal text-brand">Startangebot</div>
            <div className="mt-2 text-4xl font-semibold text-[#07173d]">99 €</div>
            <div className="mt-1 text-sm text-muted">pro Jahr, erste 100 Betriebe im Landkreis Rosenheim</div>
            <div className="mt-5 grid gap-3">
              <BlueLink href="/preise">Jetzt Gründungsmitglied werden</BlueLink>
              <OutlineLink href="/eintrag-beanspruchen">Profil beanspruchen</OutlineLink>
            </div>
          </div>
        </div>
      </section>

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

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-[#07173d]">Was GewerkeListe.com anders macht</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {comparisons.map((item) => (
            <Card key={item.title}>
              <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
              <ul className="mt-4 grid gap-2 text-sm text-muted">
                {item.items.map((point) => (
                  <li key={point}>
                    <span className={`mr-2 font-semibold ${item.positive ? "text-brand" : "text-accent"}`}>
                      {item.positive ? "✓" : "×"}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <Card>
          <h2 className="text-xl font-semibold text-[#07173d]">Bestätigte Betriebsdaten schaffen Vertrauen.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">
            Ein verifizierter Eintrag zeigt, dass Betriebsdaten übernommen und bestätigt wurden. Das ist keine
            Qualitätsgarantie, sondern ein Signal für nachvollziehbare Daten und aktuelle Kontaktwege.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-[#07173d]">Aus echter Baupraxis entstanden.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">
            GewerkeListe.com wurde von Andreas Moser gegründet. Er ist gelernter Maurer, Bauingenieur und kennt die Suche
            nach passenden Fachbetrieben aus der Baupraxis.
          </p>
          <Link className="mt-5 inline-flex text-sm font-semibold text-[#1f5fd4] hover:underline" href={"/ueber-gewerkeliste" as Route}>
            Mehr über GewerkeListe.com
          </Link>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-[#07173d]">Aufbauphase</h2>
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
            <p className="mt-4 text-sm leading-6 text-muted">
              Aufbau startet im Raum Rosenheim/Chiemgau. Das Register wächst Region für Region, Gewerk für Gewerk und
              Betrieb für Betrieb.
            </p>
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
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 text-center shadow-soft sm:p-8">
          <h2 className="text-3xl font-semibold text-[#07173d]">Suchen, finden, einordnen.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted">
            Starten Sie mit Gewerk und Ort – oder übernehmen Sie den Eintrag Ihres Betriebs.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <BlueLink href="/suche">Fachbetrieb suchen</BlueLink>
            <OutlineLink href="/eintrag-beanspruchen">Eintrag beanspruchen</OutlineLink>
            <OutlineLink href="/betrieb-eintragen">Betrieb eintragen</OutlineLink>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />
    </main>
  );
}

async function getHomepageCompanies() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    return await getPublicCompanies();
  } catch (error) {
    console.error("Homepage company data could not be loaded", error);
    return [];
  }
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
