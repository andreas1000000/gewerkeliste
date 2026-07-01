import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ClaimBadge } from "@/components/status-badge";
import { publicResultDescription } from "@/lib/company-display";
import { getBusinessDirectoryCompanies } from "@/lib/data/public-directory";
import { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd, jsonLd } from "@/lib/seo";
import { findServiceSeoEntry } from "@/lib/service-taxonomy";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; ort: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, ort } = await params;
  const entry = findServiceSeoEntry(slug);
  const location = displayLocation(ort);
  if (!entry) return { title: "Leistung nicht gefunden | GewerkeListe.com" };

  const companies = isSupabaseConfigured()
    ? await getBusinessDirectoryCompanies({ serviceSlug: entry.service.slug, location, limit: 12 })
    : [];
  const hasCompanies = companies.length > 0;

  return {
    title: `${entry.service.name} in ${location} – Betriebe finden | GewerkeListe.com`,
    description: `Betriebe für ${entry.service.name} in ${location} finden. Strukturierte Suche nach Leistung, Gewerk und Ort.`,
    alternates: {
      canonical: `/leistungen/${entry.service.slug}/${ort}`,
    },
    robots: {
      index: hasCompanies,
      follow: true,
    },
    openGraph: {
      title: `${entry.service.name} in ${location} | GewerkeListe.com`,
      description: `Passende Betriebe für ${entry.service.name} in ${location} strukturiert finden.`,
      url: `/leistungen/${entry.service.slug}/${ort}`,
      type: "website",
    },
  };
}

export default async function ServiceLocationPage({ params }: PageProps) {
  const { slug, ort } = await params;
  const entry = findServiceSeoEntry(slug);
  const location = displayLocation(ort);
  if (!entry) notFound();

  const companies = isSupabaseConfigured()
    ? await getBusinessDirectoryCompanies({ serviceSlug: entry.service.slug, location, limit: 36 })
    : [];
  const breadcrumb = breadcrumbJsonLd([
    { name: "Startseite", path: "/" },
    { name: "Leistungen", path: "/leistungen" },
    { name: entry.service.name, path: `/leistungen/${entry.service.slug}` },
    { name: location, path: `/leistungen/${entry.service.slug}/${ort}` },
  ]);
  const collectionPage = collectionPageJsonLd({
    name: `${entry.service.name} in ${location}`,
    description: `Betriebe für ${entry.service.name} in ${location}.`,
    path: `/leistungen/${entry.service.slug}/${ort}`,
  });
  const itemList = itemListJsonLd(
    companies.slice(0, 50).map((company) => ({
      name: company.name,
      path: `/firma/${company.slug}`,
    })),
  );

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
          <Link className="hover:text-action" href={`/leistungen/${entry.service.slug}` as Route}>
            {entry.service.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">{location}</span>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">{entry.trade.name}</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#07173d]">
              {entry.service.name} in {location} finden
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
              Finden Sie Betriebe, deren öffentliches Profil zu {entry.service.name} in {location} passt. Die Suche
              verbindet Leistung, Gewerk, Standort und vorhandene Profildaten.
            </p>
          </div>

          <aside className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-[#07173d]">Suchkontext</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <dt className="font-semibold text-muted">Leistung</dt>
                <dd>
                  <Link className="text-action hover:underline" href={`/leistungen/${entry.service.slug}` as Route}>
                    {entry.service.name}
                  </Link>
                </dd>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <dt className="font-semibold text-muted">Ort</dt>
                <dd>{location}</dd>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <dt className="font-semibold text-muted">Gewerk</dt>
                <dd>
                  <Link className="text-action hover:underline" href={`/gewerke/${entry.trade.slug}/${ort}` as Route}>
                    {entry.trade.name}
                  </Link>
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold text-[#07173d]">Passende Betriebe in {location}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Die Liste ist eine Suchstruktur, keine Empfehlung und keine Qualitätsbewertung.
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
                Für diese Kombination gibt es noch keinen öffentlichen Treffer. Die Seite bleibt für Suchmaschinen auf
                noindex, bis echte Betriebe vorhanden sind.
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

function displayLocation(value: string) {
  return decodeURIComponent(value)
    .replace(/-/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}
