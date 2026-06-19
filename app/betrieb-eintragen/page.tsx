import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { BusinessEntryForm } from "@/components/business-entry-form";
import { SiteHeader } from "@/components/site-header";
import { publicTradeTaxonomy } from "@/lib/trade-taxonomy";

export const metadata: Metadata = {
  title: "Betrieb kostenlos eintragen | GewerkeListe.com",
  description:
    "Tragen Sie Ihren Fachbetrieb kostenlos ein, wählen Sie Gewerke und Leistungen aus und hinterlegen Sie Ihr Tätigkeitsgebiet.",
};

export default function RegisterCompanyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Fachbetriebseintrag</p>
          <h1 className="mt-3 text-4xl font-semibold text-brand">Betrieb kostenlos eintragen</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ink">
            Tragen Sie Ihren Fachbetrieb ein, wählen Sie Gewerke und Leistungen aus und hinterlegen Sie Ihr
            Tätigkeitsgebiet. Die Angaben werden vor der Veröffentlichung geprüft.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
            GewerkeListe.com wird als professionelles Verzeichnis für Baugewerke aufgebaut. Wenn Ihr Betrieb noch nicht
            gelistet ist, können Sie hier einen neuen Fachbetriebseintrag anlegen.
          </p>
          <div className="mt-6 rounded-md border border-[#b9dec8] bg-[#eef9f2] p-4 text-sm leading-6 text-[#24523a]">
            <div className="text-lg font-semibold text-[#07173d]">Kostenloser Basiseintrag</div>
            <p className="mt-2 font-semibold">Werde in deiner Region sachlich und strukturiert auffindbar.</p>
            <p className="mt-2">
              GewerkeListe.com befindet sich im Aufbau. Der Basiseintrag ist kostenlos und bleibt von freiwilligen
              Förderbeiträgen getrennt. Jeder Betrieb soll sein tatsächliches Leistungsspektrum klar darstellen können.
            </p>
          </div>
          <div className="mt-6 grid gap-3 rounded-lg border border-line bg-panel p-4 text-sm font-semibold text-brand sm:grid-cols-4">
            <span>1. Betriebsdaten</span>
            <span>2. Gewerke und Leistungen</span>
            <span>3. Tätigkeitsgebiet</span>
            <span>4. Prüfung einreichen</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href="#eintrag-starten">
              Betrieb kostenlos eintragen
            </a>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href={"/eintrag-beanspruchen" as Route}>
              Bestehenden Eintrag beanspruchen
            </Link>
          </div>
        </div>

        <div id="eintrag-starten" className="mt-8 scroll-mt-6">
          <BusinessEntryForm trades={publicTradeTaxonomy()} />
        </div>
      </section>
    </main>
  );
}
