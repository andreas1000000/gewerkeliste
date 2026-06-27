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
  title: "GewerkeListe.com – Construction trade directory for the DACH region",
  description:
    "Find construction and trade companies by trade, service and region. GewerkeListe.com builds structured company data for the construction market.",
  alternates: {
    canonical: "/en",
    languages: {
      de: "/",
      en: "/en",
    },
  },
};

const serviceArea: ServiceAreaGeoJson = {
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

const trades = [
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

export default async function EnglishHomePage() {
  const companies = await getHomepageCompanies();
  const visibleTrades = trades
    .map((slug) => tradeTaxonomy.find((trade) => trade.slug === slug))
    .filter((trade): trade is (typeof tradeTaxonomy)[number] => Boolean(trade));
  const latestCompanies = companies.slice(0, 3);
  const regions = new Set(companies.map((company) => company.city)).size;

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader locale="en" />

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
              aria-label="Construction trades and jobsite atmosphere"
            >
              <source src="/videos/gewerkeliste-homepage-background.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,23,61,0)_48%,rgba(7,23,61,0.68))]" />
          </div>

          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">The digital infrastructure for construction</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
              Find construction and trade companies by trade, service and region.
            </h1>
            <p className="mt-6 text-lg leading-8 text-ink">
              GewerkeListe.com structures company data for the construction market: trades, services, locations,
              service areas and direct contact channels.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-brand">
              <TrustItem text="Structured company data" />
              <TrustItem text="Regional search" />
              <TrustItem text="Direct contact" />
            </div>

            <form action="/suche" className="mt-8 rounded-lg border border-line bg-white p-4 shadow-soft">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label className="grid gap-1.5 text-xs font-semibold text-brand">
                  What are you looking for?
                  <input
                    name="q"
                    className="h-12 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-action"
                    placeholder="e.g. paving, waterproofing, metalwork"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-brand">
                  Where?
                  <input
                    name="ort"
                    className="h-12 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-action"
                    placeholder="City or postal code"
                  />
                </label>
                <button className="mt-auto h-12 rounded-md bg-action px-6 text-sm font-semibold text-white hover:bg-brand">
                  Search companies
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <BlueLink href="/betrieb-eintragen">Add company</BlueLink>
                <OutlineLink href="/eintrag-beanspruchen">Claim profile</OutlineLink>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-[#07173d]">A structured directory for real construction decisions.</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <Card title="Search by actual trade">
            Find companies by trade, service, specialization and region instead of guessing through generic search
            results.
          </Card>
          <Card title="Understand service areas">
            GewerkeListe.com is built to show not only where a company is based, but where it wants to work.
          </Card>
          <Card title="No lead auction">
            The platform is not designed for price pressure. Its purpose is transparency, data quality and direct
            contact.
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Service area search</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#07173d]">Not just location. Service area.</h2>
          <p className="mt-4 text-base leading-7 text-ink">
            Trade companies do not work in perfect circles. GewerkeListe.com makes visible which regions, towns and
            project areas companies actually want to cover.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <CheckLine>Company location</CheckLine>
            <CheckLine>Service area</CheckLine>
            <CheckLine>Regional project fit</CheckLine>
            <CheckLine>Review before publication</CheckLine>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted">
            Map and service-area functions are being expanded step by step. Service areas can be provided by companies
            or derived from public sources and reviewed.
          </p>
        </div>
        <ServiceAreaPreview
          geojson={serviceArea}
          label="Service area: Rosenheim / Chiemgau"
          regionNames={["Rosenheim", "Chiemgau"]}
          status="draft"
          type="manual_drawn"
        />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Panel title="For planners, construction managers and clients">
          <Step number="1" text="Enter trade and location" />
          <Step number="2" text="Compare services, specialization and service area" />
          <Step number="3" text="Contact suitable companies directly" />
          <div className="mt-6">
            <BlueLink href="/suche">Search companies</BlueLink>
          </div>
        </Panel>
        <Panel title="For trade companies">
          <Step number="1" text="Find or create your company profile" />
          <Step number="2" text="Claim and correct company data" />
          <Step number="3" text="Show your full range of services and service area" />
          <p className="mt-5 rounded-md border border-[#b9dec8] bg-[#eef9f2] px-4 py-3 text-sm font-semibold text-brand">
            Show what your company can actually do: trades, services, specializations and regions.
          </p>
        </Panel>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-[#07173d]">Explore trades</h2>
            <p className="mt-2 text-sm text-muted">Key construction trades as structured entry points into the directory.</p>
          </div>
          <Link className="text-sm font-semibold text-[#1f5fd4] hover:underline" href={"/gewerke" as Route}>
            View all trades
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

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <Panel title="Data quality matters">
          Verified means company data has been confirmed. It is not a quality guarantee for the work performed.
        </Panel>
        <Panel title="Built from construction practice">
          GewerkeListe.com was founded by Andreas Moser, a trained mason and civil engineer with practical construction
          experience.
        </Panel>
        <Panel title="Current build-up phase">
          {latestCompanies.length > 0 ? (
            <div className="grid gap-3">
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
            "The directory grows region by region, trade by trade and company by company."
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {companies.length > 0 ? <Metric label="Companies" value={companies.length} /> : null}
            {regions > 0 ? <Metric label="Regions" value={regions} /> : null}
            <Metric label="Trades" value={tradeTaxonomy.length} />
          </div>
        </Panel>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 text-center shadow-soft sm:p-8">
          <h2 className="text-3xl font-semibold text-[#07173d]">Search, find, understand.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted">
            Start with a trade and a location, or claim your company profile.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <BlueLink href="/suche">Search companies</BlueLink>
            <OutlineLink href="/eintrag-beanspruchen">Claim profile</OutlineLink>
            <OutlineLink href="/betrieb-eintragen">Add company</OutlineLink>
          </div>
        </div>
      </section>
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

function TrustItem({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-action" />
      {text}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted">{children}</p>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
      <h2 className="text-2xl font-semibold text-[#07173d]">{title}</h2>
      <div className="mt-4 text-sm leading-6 text-muted">{children}</div>
    </section>
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
