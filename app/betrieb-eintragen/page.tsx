import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { BusinessEntryForm } from "@/components/business-entry-form";
import { SiteHeader } from "@/components/site-header";
import { publicTradeTaxonomy } from "@/lib/trade-taxonomy";

export const metadata: Metadata = {
  title: "Betrieb kostenlos eintragen oder Profil übernehmen | GewerkeListe.com",
  description:
    "Tragen Sie Ihren Fachbetrieb kostenlos ein, übernehmen Sie ein vorhandenes Profil oder reichen Sie Korrekturen zur Prüfung ein.",
};

export default function RegisterCompanyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Fachbetriebseintrag</p>
          <h1 className="mt-3 text-4xl font-semibold text-brand">
            Betrieb kostenlos eintragen oder vorhandenes Profil übernehmen
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ink">
            Legen Sie einen kostenlosen Basiseintrag an, übernehmen Sie ein vorhandenes Profil oder reichen Sie
            Korrekturen ein. Gewerke, Leistungen und Einsatzgebiet werden vor einer Veröffentlichung geprüft.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
            GewerkeListe.com ist ein professionelles Verzeichnis für Baugewerke. Ziel ist keine Auftragsauktion,
            sondern eine klare Marktübersicht nach Gewerk, Leistung und Region.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <EntryPath
              title="Mein Betrieb ist noch nicht gelistet"
              text="Legen Sie einen kostenlosen Basiseintrag mit Betriebsdaten, Gewerken, Leistungen und Wirkungskreis an."
              cta="Kostenlosen Basiseintrag anlegen"
              href="#eintrag-starten"
            />
            <EntryPath
              title="Mein Betrieb ist schon gelistet"
              text="Suchen Sie Ihr vorhandenes Profil und übernehmen Sie den Eintrag zur Datenbestätigung."
              cta="Profil suchen und übernehmen"
              href="/eintrag-beanspruchen"
            />
            <EntryPath
              title="Daten stimmen nicht"
              text="Reichen Sie Korrekturen ein. Änderungen werden geprüft, bevor sie öffentlich sichtbar werden."
              cta="Korrektur anfragen"
              href="/eintrag-beanspruchen"
            />
          </div>
          <div className="mt-6 rounded-md border border-[#b9dec8] bg-[#eef9f2] p-4 text-sm leading-6 text-[#24523a]">
            <div className="text-lg font-semibold text-[#07173d]">Kostenloser Basiseintrag</div>
            <p className="mt-2 font-semibold">Werden Sie in Ihrer Region sachlich und strukturiert auffindbar.</p>
            <p className="mt-2">
              Der Basiseintrag ist kostenlos. Jeder Betrieb soll sein tatsächliches Leistungsspektrum klar und
              vollständig darstellen können. Zusätzliche Darstellungsformen können später optional ergänzt werden,
              ohne die grundlegende Sichtbarkeit von Gewerken und Leistungen einzuschränken.
            </p>
          </div>
          <div className="mt-6 grid gap-3 rounded-lg border border-line bg-panel p-4 text-sm font-semibold text-brand sm:grid-cols-4">
            <span>1. Betriebsdaten</span>
            <span>2. Kontakt und Website</span>
            <span>3. Gewerke, Leistungen und Region</span>
            <span>4. Prüfung und Absenden</span>
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

function EntryPath({ title, text, cta, href }: { title: string; text: string; cta: string; href: string }) {
  const isAnchor = href.startsWith("#");
  const className =
    "mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action";

  return (
    <article className="rounded-lg border border-line bg-[#fbfcff] p-4">
      <h2 className="text-base font-semibold text-brand">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
      {isAnchor ? (
        <a className={className} href={href}>
          {cta}
        </a>
      ) : (
        <Link className={className} href={href as Route}>
          {cta}
        </Link>
      )}
    </article>
  );
}
