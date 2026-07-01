import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ClaimBadge } from "@/components/status-badge";
import { publicResultDescription, publicResultImage } from "@/lib/company-display";
import { getBusinessDirectoryCompanies } from "@/lib/data/public-directory";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PublicCompanyWithTrade } from "@/lib/types/public-directory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Betriebe suchen & eintragen | GewerkeListe.com",
  description:
    "Bau- und Handwerksbetriebe auf GewerkeListe.com nach Firmenname, Ort, Gewerk, Leistung oder Website-Domain suchen.",
  alternates: {
    canonical: "/betriebe",
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BusinessesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = stringParam(params.query) || stringParam(params.q);
  const tradeSlug = stringParam(params.gewerk);
  const serviceSlug = stringParam(params.leistung);
  const location = stringParam(params.ort);
  const activeLabel = activeSearchLabel({ query, tradeSlug, serviceSlug, location });
  const companies = isSupabaseConfigured()
    ? await getBusinessDirectoryCompanies({
        query,
        tradeSlug,
        serviceSlug,
        location,
        limit: query || tradeSlug || serviceSlug || location ? 70 : 36,
      })
    : [];
  const hasSearch = Boolean(query || tradeSlug || serviceSlug || location);

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-ink">
      <SiteHeader />

      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Betriebsverzeichnis</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[#07173d] sm:text-5xl">
              Betriebe auf GewerkeListe.com
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
              Suchen Sie nach Bau- und Handwerksbetrieben, prüfen Sie ob Ihr Betrieb bereits gelistet ist oder legen Sie
              einen kostenlosen Basiseintrag an.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
                href={"/betrieb-eintragen" as Route}
              >
                Betrieb eintragen
              </Link>
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
                href="#betrieb-suchen"
              >
                Eigenen Betrieb suchen
              </a>
            </div>
          </div>

          <form id="betrieb-suchen" className="rounded-lg border border-line bg-[#f8fafc] p-5 shadow-soft">
            <label className="text-sm font-semibold text-[#24364d]" htmlFor="business-query">
              Betrieb suchen
            </label>
            <div className="mt-3 grid gap-3">
              <input
                id="business-query"
                name="query"
                defaultValue={query || ""}
                placeholder="Betrieb suchen - z. B. Firmenname, Ort oder Gewerk"
                className="min-h-12 rounded-md border border-line bg-white px-4 text-base outline-none focus:border-action"
              />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_136px]">
                <input
                  name="ort"
                  defaultValue={location || ""}
                  placeholder="Ort oder PLZ"
                  className="min-h-12 rounded-md border border-line bg-white px-4 text-base outline-none focus:border-action"
                />
                <input name="gewerk" type="hidden" value={tradeSlug || ""} />
                <input name="leistung" type="hidden" value={serviceSlug || ""} />
                <button className="min-h-12 rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand">
                  Betrieb suchen
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Suche nach Firmenname, Ort, Gewerk, Leistung oder Website-Domain. Vor dem Eintragen hilft die Suche,
              doppelte Profile zu vermeiden.
            </p>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">
              {hasSearch ? "Suchergebnisse" : "Neue Betriebe auf GewerkeListe.com"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">
              {hasSearch ? `Passende Betriebe${activeLabel ? ` für ${activeLabel}` : ""}` : "Kürzlich eingetragene Betriebe"}
            </h2>
            {hasSearch ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                Diese zentrale Ergebnisliste berücksichtigt Firmenname, Ort, Gewerk, Leistung, Beschreibung und
                vorhandene Gewerkesignale.
              </p>
            ) : null}
          </div>
          <span className="text-sm font-semibold text-muted">
            {companies.length ? `${companies.length} ${companies.length === 1 ? "Betrieb" : "Betriebe"}` : "Noch kein Treffer"}
          </span>
        </div>

        {companies.length ? (
          <div className="mt-6 grid gap-4">
            {companies.map((company) => (
              <BusinessCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <BusinessEmptyState query={activeLabel || query} />
        )}

        <section className="mt-10 grid gap-4 rounded-lg border border-line bg-white p-6 shadow-soft lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-[#07173d]">Ihr Betrieb fehlt?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Tragen Sie Ihren Betrieb ein, wenn er noch nicht sichtbar ist. Gewerke, Leistungen, Spezialisierungen und
              regionale Auffindbarkeit werden strukturiert erfasst.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
            href={"/betrieb-eintragen" as Route}
          >
            Betrieb kostenlos eintragen
          </Link>
        </section>
      </section>

    </main>
  );
}

function BusinessCard({ company }: { company: PublicCompanyWithTrade }) {
  const description = publicResultDescription(company.description);
  const imageUrl = publicResultImage(company);
  const tradeNames = visibleTradeNames(company);
  const location = [company.postal_code, company.city].filter(Boolean).join(" ");
  const canClaim = company.claim_status === "unclaimed" || company.claim_status === "rejected";
  const websiteHref = normalizeWebsiteUrl(company.website_url);

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="grid gap-5 md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-start">
        <Link
          aria-label={`Profil von ${company.name} ansehen`}
          className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-line bg-[#f8fafc] text-xl font-semibold text-brand transition hover:border-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          href={`/firma/${company.slug}` as Route}
        >
          {imageUrl ? (
            <img alt={`Profilbild oder Logo von ${company.name}`} className="h-full w-full object-contain" src={imageUrl} />
          ) : (
            <span aria-hidden="true">{initials(company.name)}</span>
          )}
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {tradeNames.slice(0, 4).map((trade) => (
              <span key={trade} className="rounded-md bg-[#eef4fb] px-2.5 py-1 text-xs font-semibold text-brand">
                {trade}
              </span>
            ))}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-[#07173d]">
            <Link className="hover:text-action hover:underline" href={`/firma/${company.slug}` as Route}>
              {company.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm font-medium text-muted">{location || company.city}</p>
          {description ? (
            <p className="mt-3 max-w-4xl text-sm leading-6 text-ink">{description}</p>
          ) : (
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
              Öffentlich gelisteter Betrieb. Weitere Profilangaben erscheinen, sobald sie vom Betrieb ergänzt oder
              geprüft wurden.
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 md:min-w-56 md:grid-cols-1">
          <div className="flex flex-wrap gap-2 md:justify-end">
            <span className="rounded-md border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
              {company.verified ? "Betriebsdaten bestätigt" : "Unbestätigter Basis-Eintrag"}
            </span>
            <ClaimBadge status={company.claim_status} />
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
            href={`/firma/${company.slug}` as Route}
          >
            Profil ansehen
          </Link>
          {canClaim ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
              href={`/betriebe/${company.slug}/claim` as Route}
            >
              Profil übernehmen
            </Link>
          ) : (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
              href={`/firma/${company.slug}` as Route}
            >
              Profil aktualisieren
            </Link>
          )}
          {company.phone ? (
            <a
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
              href={`tel:${company.phone}`}
            >
              Anrufen
            </a>
          ) : null}
          {websiteHref ? (
            <a
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
              href={websiteHref}
              rel="noreferrer"
              target="_blank"
            >
              Website
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function BusinessEmptyState({ query }: { query?: string }) {
  return (
    <section className="mt-6 rounded-lg border border-line bg-white p-8 shadow-soft">
      <h2 className="text-2xl font-semibold text-[#07173d]">Betrieb nicht gefunden?</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        {query ? `Für "${query}" ist aktuell kein passender öffentlicher Betrieb sichtbar. ` : ""}
        GewerkeListe wird laufend erweitert. Sie können einen fehlenden Betrieb vorschlagen oder einen kostenlosen
        Basiseintrag anlegen.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
          href={"/betrieb-eintragen" as Route}
        >
          Betrieb kostenlos eintragen
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
          href={"/betriebe" as Route}
        >
          Suche zurücksetzen
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
          href={"/gewerke" as Route}
        >
          Andere Gewerke anzeigen
        </Link>
      </div>
    </section>
  );
}

function visibleTradeNames(company: PublicCompanyWithTrade) {
  const names = [
    ...(company.company_trades || [])
      .filter(
        (match) =>
          (match.confidence_score || 0) >= 70 &&
          match.status !== "rejected" &&
          match.visibility_level !== "internal" &&
          Boolean(match.trades?.name),
      )
      .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
      .map((match) => match.trades?.name),
    company.trades?.name,
  ].filter((name): name is string => Boolean(name));

  return Array.from(new Set(names));
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "GL";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeWebsiteUrl(url: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function activeSearchLabel({
  query,
  tradeSlug,
  serviceSlug,
  location,
}: {
  query?: string;
  tradeSlug?: string;
  serviceSlug?: string;
  location?: string;
}) {
  const parts = [
    serviceSlug ? `Leistung "${humanizeSlug(serviceSlug)}"` : undefined,
    tradeSlug ? `Gewerk "${humanizeSlug(tradeSlug)}"` : undefined,
    query ? `"${query}"` : undefined,
    location ? `Ort/Region "${location}"` : undefined,
  ].filter(Boolean);
  return parts.join(", ");
}

function humanizeSlug(value: string) {
  return value
    .split(",")
    .map((item) =>
      item
        .trim()
        .replace(/-/g, " ")
        .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase()),
    )
    .join(", ");
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
