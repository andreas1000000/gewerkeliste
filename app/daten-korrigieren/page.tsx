import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Daten korrigieren oder Inhalt melden | GewerkeListe.com",
  description: "Falsche, veraltete oder unzulässige Angaben in einem Betriebseintrag zur Prüfung melden.",
  alternates: { canonical: "/daten-korrigieren" },
};

export default function CorrectDataPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Datenqualität</p>
          <h1 className="mt-3 text-4xl font-semibold text-brand">Daten korrigieren oder Inhalt melden</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
            Melden Sie falsche, veraltete oder unzulässige Angaben. Änderungen werden geprüft und nicht automatisch
            veröffentlicht.
          </p>
        </header>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <ActionCard
            title="Mein Betrieb ist gelistet"
            text="Übernehmen Sie den Eintrag und reichen Sie Betriebsdaten, Leistungen oder Kontaktdaten strukturiert zur Prüfung ein."
            href="/eintrag-beanspruchen"
            label="Eintrag suchen"
          />
          <ActionCard
            title="Mein Betrieb fehlt"
            text="Legen Sie einen kostenlosen Basiseintrag an. Gewerke, Leistungen und Einsatzgebiet werden vor Veröffentlichung geprüft."
            href="/betrieb-eintragen"
            label="Betrieb eintragen"
          />
          <ActionCard
            title="Ich melde einen anderen Inhalt"
            text="Senden Sie die Profil-URL, die konkrete Korrektur und möglichst eine nachvollziehbare Quelle an den betreuenden Kontakt."
            href={"mailto:" + siteConfig.publicContactEmail + "?subject=Korrektur%20eines%20Betriebseintrags"}
            label="Hinweis senden"
          />
        </div>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-brand">Was in einen guten Hinweis gehört</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted">
            <li>• Profil-URL oder Firmenname und Ort</li>
            <li>• konkrete Angabe, die falsch, veraltet oder unzulässig ist</li>
            <li>• gewünschte Korrektur oder Löschung</li>
            <li>• nachvollziehbare Quelle oder kurze Begründung, soweit vorhanden</li>
          </ul>
          <p className="mt-5 text-sm leading-7 text-muted">
            Bitte senden Sie nur Angaben, die für die Prüfung erforderlich sind. Vertrauliche Dokumente sollten Sie
            nicht unaufgefordert per E-Mail übermitteln. Informationen zur Verarbeitung personenbezogener Daten finden
            Sie in der{" "}
            <Link className="font-semibold text-action hover:underline" href="/datenschutz">
              Datenschutzerklärung
            </Link>
            .
          </p>
        </section>

        <section className="mt-6 rounded-lg border border-[#b9dec8] bg-[#eef9f2] p-6">
          <h2 className="text-xl font-semibold text-brand">Prüfung und Rückmeldung</h2>
          <p className="mt-3 text-sm leading-7 text-ink">
            Eingehende Hinweise werden dem passenden Review-Prozess zugeordnet. Eine Korrektur kann Rückfragen auslösen;
            sie wird erst nach Prüfung in den öffentlichen Daten berücksichtigt. Bei Fragen erreichen Sie uns unter{" "}
            <a className="font-semibold text-action hover:underline" href={"mailto:" + siteConfig.publicContactEmail}>
              {siteConfig.publicContactEmail}
            </a>
            .
          </p>
        </section>
      </section>
    </main>
  );
}

function ActionCard({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  const external = href.startsWith("mailto:");
  const className =
    "mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action";

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-brand">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
      {external ? (
        <a className={className} href={href}>
          {label}
        </a>
      ) : (
        <Link className={className} href={href as Route}>
          {label}
        </Link>
      )}
    </article>
  );
}
