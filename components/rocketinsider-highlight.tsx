import Link from "next/link";

const sourceUrl = "https://www.th-rosenheim.de/forschung-innovation/entrepreneurship/newsletter-rocketinsider";

export function RocketInsiderHighlight() {
  return (
    <section aria-labelledby="rocketinsider-highlight-title" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-[#c9d9d3] bg-[#eef9f2] p-6 shadow-soft sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Gründungsinsights</p>
          <h2 id="rocketinsider-highlight-title" className="mt-2 text-2xl font-semibold text-[#07173d]">
            GewerkeListe.com im ROCkETinsider
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink">
            ROCkET, das Gründungszentrum der Technischen Hochschule Rosenheim, stellt GewerkeListe.com und Gründer
            Andreas Moser in der Juli-Ausgabe 2026 ausführlich vor.
          </p>
          <p className="mt-3 text-xs leading-5 text-muted">
            Medienhinweis: ROCkETinsider, Gründungsinsights, Ausgabe Juli 2026.
          </p>
        </div>
        <div className="mt-5 flex shrink-0 flex-wrap gap-3 lg:mt-0 lg:justify-end">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
            href="/aktuelles/gewerkeliste-im-rocketinsider"
          >
            Interview lesen
          </Link>
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
            href={sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            ROCkETinsider öffnen
          </a>
        </div>
      </div>
    </section>
  );
}
