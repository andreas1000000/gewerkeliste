import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getPublicLocationSitemapEntries } from "@/lib/data/public-directory";
import { breadcrumbJsonLd, collectionPageJsonLd, jsonLd } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orte und Regionen | GewerkeListe.com",
  description: "Bau- und Handwerksbetriebe nach Ort und Region finden. GewerkeListe.com macht regionale Betriebe strukturiert auffindbar.",
  alternates: {
    canonical: "/orte",
  },
};

export default async function LocationsPage() {
  const locations = isSupabaseConfigured() ? await getSafeLocations() : [];
  const breadcrumb = breadcrumbJsonLd([
    { name: "Startseite", path: "/" },
    { name: "Orte", path: "/orte" },
  ]);
  const collectionPage = collectionPageJsonLd({
    name: "Orte und Regionen",
    description: "Bau- und Handwerksbetriebe nach Ort und Region finden.",
    path: "/orte",
  });

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumb)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(collectionPage)} />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link className="hover:text-action" href="/">
            Startseite
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">Orte</span>
        </nav>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Regionale Suche</p>
          <h1 className="mt-3 text-4xl font-semibold text-[#07173d]">Betriebe nach Ort finden</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
            GewerkeListe.com ordnet Bau- und Handwerksbetriebe nach Gewerk, Leistung und Region. Die Ortsseiten zeigen
            nur Regionen, in denen bereits öffentliche Betriebseinträge vorhanden sind.
          </p>
        </div>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-[#07173d]">Öffentliche Orte</h2>
          {locations.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <Link
                  key={location.slug}
                  className="rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-action hover:border-action"
                  href={`/orte/${location.slug}` as Route}
                >
                  {location.city}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">Noch keine öffentlichen Orte verfügbar.</p>
          )}
        </section>
      </section>
    </main>
  );
}

async function getSafeLocations() {
  try {
    return await getPublicLocationSitemapEntries();
  } catch {
    return [];
  }
}
