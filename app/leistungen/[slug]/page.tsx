import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ClaimBadge } from "@/components/status-badge";
import { publicResultDescription } from "@/lib/company-display";
import { getServiceDirectoryCompanies } from "@/lib/data/public-directory";
import { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd, jsonLd } from "@/lib/seo";
import { findServiceSeoEntry, popularServicesForTrade } from "@/lib/service-taxonomy";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = findServiceSeoEntry(slug);
  if (!entry) return { title: "Leistung nicht gefunden | GewerkeListe.com" };

  const companies = isSupabaseConfigured() ? await getServiceDirectoryCompanies({ serviceSlug: entry.service.slug, limit: 12 }) : [];
  const hasCompanies = companies.length > 0;

  return {
    title: `${entry.service.name} finden – Betriebe & Gewerke | GewerkeListe.com`,
    description: `${entry.service.name} als Bauleistung einordnen und passende Betriebe im Gewerk ${entry.trade.name} finden.`,
    alternates: {
      canonical: `/leistungen/${entry.service.slug}`,
    },
    robots: {
      index: hasCompanies,
      follow: true,
    },
    openGraph: {
      title: `${entry.service.name} finden | GewerkeListe.com`,
      description: entry.service.description,
      url: `/leistungen/${entry.service.slug}`,
      type: "website",
    },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const entry = findServiceSeoEntry(slug);
  if (!entry) notFound();

  const companies = isSupabaseConfigured() ? await getServiceDirectoryCompanies({ serviceSlug: entry.service.slug, limit: 24 }) : [];
  const breadcrumb = breadcrumbJsonLd([
    { name: "Startseite", path: "/" },
    { name: "Leistungen", path: "/leistungen" },
    { name: entry.service.name, path: `/leistungen/${entry.service.slug}` },
  ]);
  const collectionPage = collectionPageJsonLd({
    name: `${entry.service.name} Betriebe finden`,
    description: entry.service.description,
    path: `/leistungen/${entry.service.slug}`,
  });
  const itemList = itemListJsonLd(
    companies.slice(0, 50).map((company) => ({
      name: company.name,
      path: `/firma/${company.slug}`,
    })),
  );
  const locations = Array.from(new Set(companies.map((company) => company.city).filter(Boolean))).slice(0, 12);
  const relatedServices = popularServicesForTrade(entry.trade.slug, 10).filter((service) => service.slug !== entry.service.slug).slice(0, 8);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumb)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(collectionPage)} />
      {companies.length ? <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(itemList)} /> : null}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link className="hover:text-action" href="/">
            Startseite
          </Link>
          <span className="mx-2">/</span>
          <Link className="hover:text-action" href="/leistungen">
            Leistungen
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">{entry.service.name}</span>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">{entry.family.name}</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#07173d]">{entry.service.name} finden</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
              {entry.service.description} Diese Leistung ist dem Gewerk{" "}
              <Link className="font-semibold text-action hover:underline" href={`/gewerke/${entry.trade.slug}` as Route}>
                {entry.trade.name}
              </Link>{" "}
              zugeordnet. Die Ergebnisliste zeigt Betriebe, deren Profil, Beschreibung oder Gewerkesignale zu dieser
              Leistung passen.
            </p>
          </div>

          <aside className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-[#07173d]">Suchkontext</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <dt className="font-semibold text-muted">Gewerk</dt>
                <dd>
                  <Link className="text-action hover:underline" href={`/gewerke/${entry.trade.slug}` as Route}>
                    {entry.trade.name}
                  </Link>
                </dd>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <dt className="font-semibold text-muted">Treffer</dt>
                <dd>{companies.length ? `${companies.length} Betriebe` : "Noch keine Treffer"}</dd>
              </div>
            </dl>
            <Link
              className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
              href={`/betriebe?gewerk=${entry.trade.slug}&leistung=${entry.service.slug}&query=${encodeURIComponent(entry.service.name)}` as Route}
            >
              In Betriebe suchen
            </Link>
          </aside>
        </div>

        {locations.length ? (
          <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-[#07173d]">{entry.service.name} nach Ort</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {locations.map((location) => (
                <Link
                  key={location}
                  className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-action hover:border-action"
                  href={`/leistungen/${entry.service.slug}/${slugifyLocation(location)}` as Route}
                >
                  {entry.service.name} in {location}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {relatedServices.length ? (
          <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-[#07173d]">Verwandte Leistungen im Gewerk {entry.trade.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Diese Leistungen liegen fachlich nahe beieinander. Die jeweilige Leistungsseite wird nur indexierbar, wenn
              echte passende Betriebe vorhanden sind.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedServices.map((service) => (
                <Link
                  key={service.slug}
                  className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-action hover:border-action"
                  href={`/leistungen/${service.slug}` as Route}
                >
                  {service.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold text-[#07173d]">Passende Betriebe</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Verifiziert bedeutet: Betriebsdaten bestätigt. Es ist keine Qualitätsbewertung und keine Empfehlung.
              </p>
            </div>
            <span className="text-sm font-semibold text-muted">{companies.length ? `${companies.length} Betriebe` : "Noch kein Treffer"}</span>
          </div>

          {companies.length ? (
            <div className="divide-y divide-line">
              {companies.map((company) => (
                <article key={company.id} className="py-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-[#07173d]">
                          <Link className="hover:text-action hover:underline" href={`/firma/${company.slug}` as Route}>
                            {company.name}
                          </Link>
                        </h3>
                        <ClaimBadge status={company.claim_status} />
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {company.trades?.name || entry.trade.name} · {company.postal_code} {company.city}
                      </p>
                      {publicResultDescription(company.description) ? (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink">{publicResultDescription(company.description)}</p>
                      ) : null}
                    </div>
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
                      href={`/firma/${company.slug}` as Route}
                    >
                      Profil ansehen
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-6">
              <p className="text-sm leading-6 text-muted">
                Für diese Leistung sind noch keine passenden öffentlichen Betriebe sichtbar. Betriebe können ihr Profil
                kostenlos ergänzen und diese Leistung zur Prüfung einreichen.
              </p>
              <Link className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href="/betrieb-eintragen">
                Betrieb kostenlos eintragen
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function slugifyLocation(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
