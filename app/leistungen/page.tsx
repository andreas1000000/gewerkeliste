import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { breadcrumbJsonLd, collectionPageJsonLd, jsonLd } from "@/lib/seo";
import { serviceSeoEntries } from "@/lib/service-taxonomy";

export const metadata: Metadata = {
  title: "Bauleistungen finden: Leistungen, Gewerke & Betriebe | GewerkeListe.com",
  description:
    "Bauleistungen und Handwerksleistungen nach Gewerk einordnen und passende Betriebe auf GewerkeListe.com finden.",
  alternates: {
    canonical: "/leistungen",
  },
};

export default function ServicesPage() {
  const entries = serviceSeoEntries();
  const popularEntries = entries.filter((entry) => entry.service.isPopular).slice(0, 120);
  const grouped = groupByTrade(popularEntries.length ? popularEntries : entries.slice(0, 120));
  const breadcrumb = breadcrumbJsonLd([
    { name: "Startseite", path: "/" },
    { name: "Leistungen", path: "/leistungen" },
  ]);
  const collectionPage = collectionPageJsonLd({
    name: "Bauleistungen und Handwerksleistungen",
    description: "Leistungen nach Gewerk einordnen und passende Betriebe finden.",
    path: "/leistungen",
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
          <span className="font-medium text-ink">Leistungen</span>
        </nav>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Leistungstaxonomie</p>
          <h1 className="mt-3 text-4xl font-semibold text-[#07173d]">Bauleistungen nach Gewerk finden</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
            GewerkeListe.com trennt fachliche Gewerke von konkreten Leistungen. So werden Betriebe nicht nur nach
            Oberbegriffen, sondern auch nach Spezialleistungen wie KNX, Wallbox, Estrich, Pflasterbau oder Abdichtung
            auffindbar.
          </p>
        </div>

        <section className="mt-8 grid gap-4">
          {grouped.map((group) => (
            <article key={group.tradeSlug} className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#07173d]">{group.tradeName}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{group.tradeDescription}</p>
                </div>
                <Link className="text-sm font-semibold text-action hover:underline" href={`/gewerke/${group.tradeSlug}` as Route}>
                  Gewerk ansehen
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.services.map((entry) => (
                  <Link
                    key={entry.service.slug}
                    className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-medium text-ink hover:border-action hover:text-action"
                    href={`/leistungen/${entry.service.slug}` as Route}
                  >
                    {entry.service.name}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function groupByTrade(entries: ReturnType<typeof serviceSeoEntries>) {
  const grouped = new Map<
    string,
    {
      tradeSlug: string;
      tradeName: string;
      tradeDescription: string;
      services: ReturnType<typeof serviceSeoEntries>;
    }
  >();

  for (const entry of entries) {
    const current =
      grouped.get(entry.trade.slug) ||
      {
        tradeSlug: entry.trade.slug,
        tradeName: entry.trade.name,
        tradeDescription: entry.trade.description,
        services: [],
      };
    current.services.push(entry);
    grouped.set(entry.trade.slug, current);
  }

  return Array.from(grouped.values()).sort((a, b) => a.tradeName.localeCompare(b.tradeName, "de"));
}
