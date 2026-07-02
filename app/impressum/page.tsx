import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { siteOwner } from "@/lib/legal/site-owner";

export const metadata: Metadata = {
  title: `Impressum | ${siteOwner.projectName}`,
  description: `Impressum und Anbieterkennzeichnung von ${siteOwner.projectName}.`,
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-5 py-10">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">{siteOwner.projectName}</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Impressum</h1>
        </header>

        <div className="grid gap-6">
          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">Angaben gemäß § 5 DDG</h2>
            <address className="mt-4 not-italic leading-7 text-ink">
              <div>{siteOwner.operatorName}</div>
              {siteOwner.businessName ? <div>{siteOwner.businessName}</div> : null}
              <div>{siteOwner.street}</div>
              <div>
                {siteOwner.postalCode} {siteOwner.city}
              </div>
              <div>{siteOwner.country}</div>
            </address>

            <div className="mt-6">
              <h3 className="text-base font-semibold text-ink">Kontakt</h3>
              <dl className="mt-3 grid gap-2 text-ink">
                <div>
                  <dt className="inline font-semibold">E-Mail: </dt>
                  <dd className="inline">
                    <a className="text-brand hover:underline" href={`mailto:${siteOwner.email}`}>
                      {siteOwner.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Telefon: </dt>
                  <dd className="inline">
                    <a className="text-brand hover:underline" href={`tel:${siteOwner.phone.replace(/\s+/g, "")}`}>
                      {siteOwner.phone}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">Vertretungsberechtigte Person</h2>
            <p className="mt-4 text-ink">{siteOwner.authorizedRepresentative}</p>
          </section>

          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">Umsatzsteuer-ID</h2>
            <p className="mt-4 leading-7 text-ink">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
              <br />
              {siteOwner.vatId}
            </p>
          </section>

          {siteOwner.isEditorialResponsible ? (
            <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
              <h2 className="text-xl font-semibold text-ink">Inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV</h2>
              <p className="mt-4 text-ink">{siteOwner.authorizedRepresentative}</p>
            </section>
          ) : null}

          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">Haftung für Inhalte</h2>
            <p className="mt-4 leading-7 text-ink">
              Die Inhalte dieser Website werden mit Sorgfalt erstellt und gepflegt. Für die Richtigkeit, Vollständigkeit
              und Aktualität der bereitgestellten Informationen kann jedoch keine Gewähr übernommen werden. Bei Hinweisen
              auf fehlerhafte oder rechtswidrige Inhalte werden diese nach Prüfung zeitnah bearbeitet.
            </p>
          </section>

          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">Haftung für Links</h2>
            <p className="mt-4 leading-7 text-ink">
              Diese Website kann Links zu externen Websites enthalten. Auf deren Inhalte besteht kein Einfluss. Für die
              Inhalte verlinkter Seiten ist der jeweilige Anbieter oder Betreiber verantwortlich. Rechtswidrige Inhalte
              waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
          </section>

          <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">Urheberrecht</h2>
            <p className="mt-4 leading-7 text-ink">
              Die auf dieser Website erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Eine Nutzung,
              Vervielfältigung oder Weitergabe außerhalb der gesetzlichen Grenzen bedarf der vorherigen Zustimmung des
              jeweiligen Rechteinhabers.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
