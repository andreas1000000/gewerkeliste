import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceAreaPreview } from "@/components/map/service-area-preview";
import { SiteHeader } from "@/components/site-header";
import {
  cleanCompanyDescription,
  extractServiceListFromDescription,
  extractServiceKeywordsFromText,
  groupServicesForDisplay,
  publicResultDescription,
} from "@/lib/company-display";
import { getCompanyBySlug, getCompanyBySlugForMetadata } from "@/lib/data/public-directory";
import { breadcrumbJsonLd, jsonLd, localBusinessJsonLd } from "@/lib/seo";
import { serviceTaxonomy } from "@/lib/service-taxonomy";
import { siteConfig } from "@/lib/site-config";
import type { PublicClaimStatus, PublicCompanyWithTrade } from "@/lib/types/public-directory";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ProfileStatus = {
  label: string;
  shortLabel: string;
  note: string;
  tone: "verified" | "claimed" | "unverified";
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlugForMetadata(slug);

  if (!company) {
    return { title: "Firma nicht gefunden" };
  }

  const trade = company.trades?.name || "Handwerk";
  const description =
    cleanCompanyDescription(company.description) ||
    `Unternehmensprofil von ${company.name} in ${company.city}: Gewerk, Leistungen, Kontakt und Datenstatus auf GewerkeListe.com.`;

  return {
    title: `${company.name} – ${trade} in ${company.city} | GewerkeListe.com`,
    description,
    alternates: {
      canonical: `/firma/${slug}`,
    },
    openGraph: {
      title: `${company.name} | ${trade} in ${company.city}`,
      description,
      url: `/firma/${slug}`,
      type: "website",
    },
  };
}

export default async function CompanyPublicPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const company = await getCompanyBySlug(slug);
    const trade = company.trades?.name || "Gewerk";
    const status = getProfileStatus(company);
    const canClaim = company.claim_status === "unclaimed" || company.claim_status === "rejected";
    const websiteHref = normalizeWebsiteUrl(company.website_url);
    const location = `${company.postal_code} ${company.city}`.trim();
    const visibleDescription = publicResultDescription(company.description);
    const profileDescription = getProfileDescription(company, trade, location, visibleDescription);
    const executedTrades = getExecutedTrades(company);
    const services = getRecognizableServices(company, executedTrades);
    const groupedServices = groupServicesForDisplay(services);
    const detailServiceFamilies = getDetailedServiceFamilies(company, services);
    const topServices = services.slice(0, 12);
    const sourceItems = getSourceItems(company, websiteHref);
    const hasCoordinates =
      Number.isFinite(company.latitude) &&
      Number.isFinite(company.longitude) &&
      !(company.latitude === 0 && company.longitude === 0);
    const hasDirectContact = Boolean(company.email || company.phone || websiteHref);
    const profileCompletionItems = getProfileCompletionItems(company, visibleDescription, services.length, hasCoordinates);
    const headline = trade === "Gewerk" ? `Bau- und Handwerksbetrieb in ${company.city}` : `${trade} in ${company.city}`;

    const breadcrumb = breadcrumbJsonLd([
      { name: "Startseite", path: "/" },
      { name: "Betriebe", path: "/betriebe" },
      { name: trade, path: `/gewerke/${company.trades?.slug || ""}` },
      { name: company.city, path: `/gewerke/${company.trades?.slug || ""}/${locationSlug(company.city)}` },
      { name: company.name, path: `/firma/${company.slug}` },
    ]);
    const localBusiness = localBusinessJsonLd(company, `/firma/${company.slug}`, profileDescription);

    return (
      <main className="min-h-screen bg-[#f6f8fb] text-ink">
        <SiteHeader />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumb)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(localBusiness)} />

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link className="hover:text-ink" href={"/" as Route}>
              Startseite
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="hover:text-ink" href={"/betriebe" as Route}>
              Betriebe
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="hover:text-ink" href={`/betriebe?gewerk=${company.trades?.slug || ""}` as Route}>
              {trade}
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="hover:text-ink" href={`/betriebe?ort=${encodeURIComponent(company.city)}` as Route}>
              {company.city}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-ink">{company.name}</span>
          </nav>

          <section className="mt-5 overflow-hidden rounded-lg border border-line bg-white shadow-soft">
            <div className="h-28 bg-[linear-gradient(135deg,#07173d_0%,#174b8f_48%,#eef4fb_100%)] sm:h-36" />
            <div className="px-5 pb-6 sm:px-7">
              <div className="-mt-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <ProfileMark company={company} />
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={status} />
                      <span className="rounded-md border border-line bg-[#fbfcff] px-3 py-1 text-xs font-semibold text-muted">
                        Keine Qualitäts- oder Verfügbarkeitsgarantie
                      </span>
                    </div>
                    <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">{company.name}</h1>
                    <p className="mt-2 text-lg font-medium text-[#30415f]">{headline}</p>
                    <p className="mt-2 text-sm text-muted">
                      {company.city} · {trade} · {status.shortLabel}
                    </p>
                  </div>
                </div>
                <ActionBar company={company} websiteHref={websiteHref} canClaim={canClaim} />
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-5">
              <ProfileCard title="Über den Betrieb">
                <p className="max-w-4xl text-base leading-7 text-ink">{profileDescription}</p>
              </ProfileCard>

              <ProfileCard
                title="Leistungsübersicht"
                subtitle={
                  company.verified || company.claim_status === "claimed"
                    ? "Kompakte Übersicht der vom Betrieb angegebenen oder im Profil genannten Leistungen."
                    : "Kompakte Übersicht der auf Firmenwebsite oder öffentlichen Unternehmensquellen erkennbaren Leistungen."
                }
              >
                {topServices.length ? (
                  <TopServiceOverview services={topServices} totalCount={services.length} />
                ) : (
                  <p className="text-sm leading-6 text-muted">
                    Für diesen Betrieb sind noch keine konkreten Leistungen strukturiert hinterlegt. Nach Profilübernahme
                    können Leistungen und Spezialisierungen ergänzt werden.
                  </p>
                )}
              </ProfileCard>

              {groupedServices.length ? (
                <ProfileCard
                  title="Leistungsspektrum im Detail"
                  subtitle="Detailleistungen werden nach fachlichen Bereichen gruppiert. Grundlage sind vom Betrieb angegebene oder öffentlich erkennbare Leistungsbereiche."
                >
                  <DetailServiceFamilies families={detailServiceFamilies} fallbackGroups={groupedServices} />
                </ProfileCard>
              ) : null}

              <ProfileCard title="Wirkungskreis">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Fact label="Standort" value={location} />
                  <Fact
                    label="Einsatzgebiet"
                    value="Demnächst verfügbar. Betriebe können ihren tatsächlichen Wirkungskreis nach Profilübernahme ergänzen."
                  />
                </div>
                <div className="mt-5">
                  <ServiceAreaPreview
                    label={`${company.name} Wirkungskreis Vorschau`}
                    type="region"
                    status="draft"
                    regionNames={[company.city]}
                  />
                </div>
              </ProfileCard>

              <ProfileCard title="Datenquellen / Datenstatus">
                {sourceItems.length ? (
                  <ul className="grid gap-3">
                    {sourceItems.map((item) => (
                      <li key={`${item.label}-${item.value}`} className="rounded-md border border-line bg-[#fbfcff] px-4 py-3">
                        <div className="text-sm font-semibold text-ink">{item.label}</div>
                        {item.href ? (
                          <a className="mt-1 block break-words text-sm text-action hover:underline" href={item.href} rel="noreferrer" target="_blank">
                            {item.value}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm leading-6 text-muted">{item.value}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-6 text-muted">
                    Für diesen Eintrag ist aktuell keine öffentliche Quelle hinterlegt. Der Eintrag sollte geprüft oder
                    vom Betrieb übernommen werden.
                  </p>
                )}
                <p className="mt-4 text-xs leading-5 text-muted">
                  GewerkeListe beschreibt Datenstatus und öffentlich erkennbare Angaben. Daraus entsteht keine
                  Qualitäts-, Verfügbarkeits- oder Empfehlungsgarantie.
                </p>
              </ProfileCard>
            </div>

            <aside className="grid content-start gap-5">
              <ProfileCard title="Kontakt">
                <dl className="grid gap-4">
                  <DataRow label="Standort" value={location} />
                  {websiteHref ? <DataRow label="Website" value={company.website_url || websiteHref} href={websiteHref} external /> : null}
                  {company.phone ? <DataRow label="Telefon" value={company.phone} href={`tel:${company.phone}`} /> : null}
                  {company.email ? <DataRow label="E-Mail" value={company.email} href={`mailto:${company.email}`} /> : null}
                </dl>
                {!hasDirectContact ? (
                  <p className="mt-4 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-sm leading-6 text-muted">
                    Für diesen Betrieb sind noch keine direkten Kontaktdaten hinterlegt.
                  </p>
                ) : null}
              </ProfileCard>

              <ProfileCard title="Profilstatus">
                <div className={`rounded-md border px-4 py-4 text-sm leading-6 ${statusBoxClass(status.tone)}`}>
                  <div className="font-semibold text-ink">{status.label}</div>
                  <p className="mt-2">{status.note}</p>
                </div>
                <dl className="mt-4 grid gap-4">
                  <DataRow label="Eintrag" value={claimStatusLabel(company.claim_status)} />
                  <DataRow label="Verifizierung" value={company.verified ? "Daten vom Betrieb bestätigt" : "Daten noch nicht verifiziert"} />
                </dl>
              </ProfileCard>

              <ContactTrustCard company={company} canClaim={canClaim} />

              {canClaim ? (
                <section className="rounded-lg border border-[#b9dec8] bg-[#f1fbf5] p-5 shadow-soft">
                  <h2 className="text-xl font-semibold text-[#07173d]">Sind Sie dieser Betrieb?</h2>
                  <p className="mt-3 text-sm leading-6 text-[#24523a]">
                    Übernehmen Sie Ihr kostenloses Basisprofil, ergänzen Sie Leistungen und halten Sie Ihre Betriebsdaten aktuell.
                  </p>
                  <Link
                    className="mt-5 inline-flex w-full min-h-11 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
                    href={`/betriebe/${company.slug}/claim` as Route}
                  >
                    Profil kostenlos übernehmen
                  </Link>
                  <a
                    className="mt-3 inline-flex w-full min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
                    href={`mailto:${siteConfig.publicContactEmail}?subject=Datenkorrektur ${encodeURIComponent(company.name)}`}
                  >
                    Daten korrigieren
                  </a>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    Der kostenlose Basiseintrag bleibt erhalten. Erweiterte Profilfunktionen sind optional.
                  </p>
                </section>
              ) : null}

              <ProfileCompletionCard company={company} canClaim={canClaim} items={profileCompletionItems} />
            </aside>
          </div>

          <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Ähnliche Betriebe finden</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
              Vergleichen Sie weitere öffentlich gelistete Betriebe nach Gewerk und Region.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {company.trades?.slug ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
                  href={`/gewerke/${company.trades.slug}` as Route}
                >
                  Weitere Betriebe in diesem Gewerk suchen
                </Link>
              ) : null}
              {company.trades?.slug ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
                  href={`/gewerke/${company.trades.slug}/${locationSlug(company.city)}` as Route}
                >
                  Gewerke in der Region durchsuchen
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}

function ProfileMark({ company }: { company: PublicCompanyWithTrade }) {
  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-line bg-white p-3 shadow-soft sm:h-32 sm:w-32">
      {company.logo_url ? (
        <img alt={`Logo von ${company.name}`} className="h-full w-full rounded-md object-contain" src={company.logo_url} />
      ) : (
        <div className="grid h-full w-full place-items-center rounded-md bg-[#07173d] px-3 text-center text-white">
          <div>
            <div className="text-4xl font-semibold">{initials(company.name)}</div>
            <div className="mt-2 text-[10px] font-semibold leading-4 text-white/75">Logo nach Profilübernahme ergänzen</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactTrustCard({ company, canClaim }: { company: PublicCompanyWithTrade; canClaim: boolean }) {
  const claimHref = `/betriebe/${company.slug}/claim` as Route;
  const updateHref = `/betriebe/${company.slug}/profil-ergaenzen` as Route;

  return (
    <ProfileCard title="Ansprechpartner & Vertrauen">
      <div className="grid gap-3">
        <div className="rounded-md border border-line bg-[#fbfcff] p-4">
          <div className="flex gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white text-center text-lg font-semibold leading-4 text-brand">
              {company.profile_image_url ? (
                <img
                  alt={company.profile_image_alt || `Ansprechpartner von ${company.name}`}
                  className="h-full w-full object-cover"
                  src={company.profile_image_url}
                />
              ) : (
                initials(company.name)
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {company.profile_image_url ? "Persönlicher Ansprechpartner" : "Ansprechpartner sichtbar machen"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                Menschen arbeiten mit Menschen. Nach Profilübernahme kann der Betrieb hier einen Ansprechpartner, ein Teamfoto
                oder eine kurze persönliche Vorstellung ergänzen.
              </p>
            </div>
          </div>
        </div>

        {canClaim ? (
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href={claimHref}>
            Ansprechpartner nach Profilübernahme ergänzen
          </Link>
        ) : (
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href={updateHref}>
            Ansprechpartner ergänzen anfragen
          </Link>
        )}
        <p className="text-xs leading-5 text-muted">
          Es werden keine privaten Ansprechpartnerdaten erfunden oder aus fremden Quellen übernommen. Veröffentlichungen erfolgen erst nach Prüfung.
        </p>
      </div>
    </ProfileCard>
  );
}

function ProfileCompletionCard({
  company,
  canClaim,
  items,
}: {
  company: PublicCompanyWithTrade;
  canClaim: boolean;
  items: string[];
}) {
  const updateHref = `/betriebe/${company.slug}/profil-ergaenzen` as Route;

  return (
    <ProfileCard title="Profil vervollständigen">
      <p className="text-sm leading-6 text-muted">Dieses Profil kann vom Betrieb übernommen und weiter ausgebaut werden.</p>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true">-</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {canClaim ? (
        <Link
          className="mt-5 inline-flex w-full min-h-11 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
          href={`/betriebe/${company.slug}/claim` as Route}
        >
          Profil kostenlos übernehmen
        </Link>
      ) : (
        <Link
          className="mt-5 inline-flex w-full min-h-11 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
          href={updateHref}
        >
          Profilergänzung anfragen
        </Link>
      )}
      <p className="mt-3 text-xs leading-5 text-muted">
        Kostenlos bleiben Basisprofil, Stammdaten, Gewerke, Leistungen und Kontaktwege. Erweiterte Darstellung wie
        Referenzen, Projektgalerie, Sichtbarkeitsreport oder visuelle Wirkungskreise kann später optional ergänzt werden.
      </p>
    </ProfileCard>
  );
}

function ActionBar({
  company,
  websiteHref,
  canClaim,
}: {
  company: PublicCompanyWithTrade;
  websiteHref?: string;
  canClaim: boolean;
}) {
  return (
    <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
      {websiteHref ? (
        <ContactButton kind="primary" href={websiteHref} external>
          Website besuchen
        </ContactButton>
      ) : null}
      {company.phone ? <ContactButton href={`tel:${company.phone}`}>Anrufen</ContactButton> : null}
      {company.email ? <ContactButton href={`mailto:${company.email}`}>E-Mail schreiben</ContactButton> : null}
      {canClaim ? (
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
          href={`/betriebe/${company.slug}/claim` as Route}
        >
          Profil übernehmen
        </Link>
      ) : null}
      <a
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
        href={`mailto:${siteConfig.publicContactEmail}?subject=Datenkorrektur ${encodeURIComponent(company.name)}`}
      >
        Daten korrigieren
      </a>
    </div>
  );
}

function TopServiceOverview({ services, totalCount }: { services: string[]; totalCount: number }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {services.map((item) => (
          <span key={item} className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-ink">
            {item}
          </span>
        ))}
      </div>
      {totalCount > services.length ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          {totalCount - services.length} weitere Detailleistungen sind im Abschnitt „Leistungsspektrum im Detail“ zugeordnet.
        </p>
      ) : null}
    </div>
  );
}

function DetailServiceFamilies({
  families,
  fallbackGroups,
}: {
  families: Array<{ label: string; description: string; items: string[] }>;
  fallbackGroups: Array<{ label: string; items: string[] }>;
}) {
  if (families.length) {
    return (
      <div className="grid gap-3">
        {families.map((family, index) => (
          <details key={family.label} className="rounded-md border border-line bg-[#fbfcff] p-4" open={index === 0}>
            <summary className="cursor-pointer list-none">
              <span className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-sm font-semibold text-ink">{family.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    {family.items.length} Detailleistungen · {family.description}
                  </span>
                </span>
                <span className="rounded-md border border-line bg-white px-3 py-1 text-xs font-semibold text-action">Details öffnen</span>
              </span>
            </summary>
            <div className="mt-4 flex flex-wrap gap-2">
              {family.items.map((item) => (
                <span key={item} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
                  {item}
                </span>
              ))}
            </div>
          </details>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {fallbackGroups.map((group, index) => (
        <details key={group.label} className="rounded-md border border-line bg-[#fbfcff] p-4" open={index === 0}>
          <summary className="cursor-pointer list-none">
            <span className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold text-ink">{group.label}</span>
                <span className="mt-1 block text-xs text-muted">{group.items.length} Detailleistungen</span>
              </span>
              <span className="rounded-md border border-line bg-white px-3 py-1 text-xs font-semibold text-action">Details öffnen</span>
            </span>
          </summary>
          <div className="mt-4 flex flex-wrap gap-2">
            {group.items.map((item) => (
              <span key={item} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
                {item}
              </span>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function getDetailedServiceFamilies(company: PublicCompanyWithTrade, services: string[]) {
  const relatedSlugs = serviceSlugsForCompany(company, services);
  const selectedFamilies: Array<{ label: string; description: string; items: string[] }> = [];

  for (const group of serviceTaxonomy) {
    for (const trade of group.trades) {
      if (!relatedSlugs.has(trade.slug)) continue;
      for (const family of trade.families) {
        selectedFamilies.push({
          label: `${trade.name} · ${family.name}`,
          description: family.description,
          items: family.services.map((service) => service.name),
        });
      }
    }
  }

  return dedupeServiceFamilies(selectedFamilies).slice(0, 8);
}

function serviceSlugsForCompany(company: PublicCompanyWithTrade, services: string[]) {
  const slugs = new Set<string>();
  if (company.trades?.slug && company.trades.slug !== "bauunternehmen") slugs.add(company.trades.slug);

  const text = [company.trades?.slug, company.trades?.name, ...services].join(" ").toLowerCase();
  const mappings: Array<{ slugs: string[]; signals: string[] }> = [
    { slugs: ["maurerarbeiten", "betonbau"], signals: ["bauunternehmen", "hochbau", "maurer", "mauerwerk", "rohbau"] },
    { slugs: ["betonbau", "bauwerksabdichtung"], signals: ["beton", "fundament", "bodenplatte", "abdichtung"] },
    { slugs: ["erdarbeiten"], signals: ["erdarbeiten", "aushub", "bagger", "baugrube"] },
    { slugs: ["garten-landschaftsbau", "pflasterarbeiten"], signals: ["garten", "landschaft", "galabau", "pflaster", "außenanlagen", "aussenanlagen"] },
    { slugs: ["architektur-entwurf"], signals: ["bauantrag", "entwurf", "planung"] },
  ];

  for (const mapping of mappings) {
    if (mapping.signals.some((signal) => text.includes(signal))) {
      mapping.slugs.forEach((slug) => slugs.add(slug));
    }
  }

  return slugs;
}

function dedupeServiceFamilies(families: Array<{ label: string; description: string; items: string[] }>) {
  const seen = new Set<string>();
  return families.filter((family) => {
    const key = family.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ProfileCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function getProfileStatus(company: PublicCompanyWithTrade): ProfileStatus {
  if (company.verified) {
    return {
      label: "Betriebsdaten bestätigt",
      shortLabel: "Daten bestätigt",
      note: "Der Betrieb hat grundlegende Profildaten bestätigt. Dies ist keine Qualitäts-, Verfügbarkeits- oder Empfehlungsgarantie.",
      tone: "verified",
    };
  }

  if (company.claim_status === "claimed" || company.claim_status === "pending") {
    return {
      label: company.claim_status === "pending" ? "Übernahme angefragt" : "Übernommener Eintrag",
      shortLabel: company.claim_status === "pending" ? "Übernahme angefragt" : "Eintrag übernommen",
      note:
        company.claim_status === "pending"
          ? "Für diesen Eintrag liegt eine Anfrage zur Profilübernahme oder Korrektur vor. Änderungen werden geprüft."
          : "Der Betrieb hat das Profil übernommen. Die Datenverifizierung ist noch ausstehend.",
      tone: "claimed",
    };
  }

  return {
    label: "Basisprofil – noch nicht vom Betrieb bestätigt",
    shortLabel: "Basisprofil",
    note:
      "Dieser Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen oder eingereichten Angaben vorbereitet. Der Betrieb kann Daten jederzeit übernehmen, korrigieren oder löschen lassen.",
    tone: "unverified",
  };
}

function StatusBadge({ status }: { status: ProfileStatus }) {
  return <span className={`rounded-md border px-3 py-1 text-xs font-semibold ${statusPillClass(status.tone)}`}>{status.shortLabel}</span>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfcff] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold leading-6 text-ink">{value}</div>
    </div>
  );
}

function getExecutedTrades(company: PublicCompanyWithTrade) {
  const tradeNames = [
    company.trades?.name,
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
  ].filter((name): name is string => Boolean(name));

  return [...new Set(tradeNames)].slice(0, 12);
}

function getProfileDescription(company: PublicCompanyWithTrade, trade: string, location: string, visibleDescription: string) {
  if (visibleDescription) return visibleDescription;

  if (company.claim_status === "claimed" || company.verified) {
    return `${company.name} ist als Betrieb im Bereich ${trade} in ${location} gelistet. Die grundlegenden Betriebsdaten wurden übernommen bzw. zur Prüfung eingereicht. Dies ist keine Qualitäts- oder Verfügbarkeitsgarantie.`;
  }

  return `${company.name} ist als Betrieb im Bereich ${trade} in ${location} gelistet. Der Eintrag basiert auf öffentlich zugänglichen Unternehmensinformationen und ist noch nicht vollständig vom Betrieb bestätigt.`;
}

function getRecognizableServices(company: PublicCompanyWithTrade, executedTrades: string[]) {
  const evidenceItems = (company.company_trades || [])
    .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
    .flatMap((match) => [...splitEvidence(match.evidence), ...extractServiceKeywordsFromText(match.evidence)]);

  const descriptionItems = extractServiceListFromDescription(company.description);
  return [...new Set([...descriptionItems, ...evidenceItems, ...executedTrades])].slice(0, 42);
}

function splitEvidence(value: string | null) {
  if (!value) return [];
  return value
    .split(/[;,|/]+/)
    .map((item) => item.trim().replace(/^[✓\-–•\s]+/, ""))
    .filter((item) => item.length >= 3 && item.length <= 80)
    .slice(0, 12);
}

function getSourceItems(company: PublicCompanyWithTrade, websiteHref?: string) {
  const items: Array<{ label: string; value: string; href?: string }> = [];
  if (websiteHref) {
    items.push({ label: "Firmenwebsite", value: company.website_url || websiteHref, href: websiteHref });
  }

  for (const match of company.company_trades || []) {
    if (!match.source || match.status === "rejected" || match.visibility_level === "internal") continue;
    const label = sourceLabel(match.source);
    const value = match.evidence ? `${label}: ${match.evidence}` : label;
    if (!items.some((item) => item.value === value)) {
      items.push({ label: "Gewerkesignal", value });
    }
    if (items.length >= 5) break;
  }

  return items;
}

function sourceLabel(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("official") || normalized.includes("website")) return "Firmenwebsite";
  if (normalized.includes("impressum")) return "Impressum";
  if (normalized.includes("submission")) return "Betriebseintrag";
  if (normalized.includes("mapping")) return "Strukturierte Gewerkezuordnung";
  if (normalized.includes("regional") || normalized.includes("coverage")) return "Regionale Recherche";
  return value.replace(/[-_]+/g, " ");
}

function getProfileCompletionItems(company: PublicCompanyWithTrade, description: string, serviceCount: number, hasCoordinates: boolean) {
  return [
    company.logo_url ? "Logo ist hinterlegt" : "Logo hinzufügen",
    company.profile_image_url ? "Ansprechpartner oder Team ist sichtbar" : "Ansprechpartner oder Team vorstellen",
    serviceCount ? "Leistungen weiter schärfen" : "Leistungen ergänzen",
    description ? "Kurzbeschreibung aktuell halten" : "Kurzbeschreibung ergänzen",
    hasCoordinates ? "Wirkungskreis präzisieren" : "Wirkungskreis markieren",
    "Referenzen und Projektbeispiele später ergänzen",
  ];
}

function DataRow({
  label,
  value,
  href,
  external,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[112px_minmax(0,1fr)]">
      <dt className="text-sm font-semibold text-ink">{label}</dt>
      <dd className="min-w-0 text-sm leading-6 text-muted">
        {href ? (
          <a
            className="break-words text-[#1f5fd4] hover:underline"
            href={href}
            rel={external ? "noreferrer" : undefined}
            target={external ? "_blank" : undefined}
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function ContactButton({
  children,
  href,
  kind = "secondary",
  external,
}: {
  children: React.ReactNode;
  href: string;
  kind?: "primary" | "secondary";
  external?: boolean;
}) {
  const className =
    kind === "primary"
      ? "inline-flex min-h-11 items-center justify-center rounded-md bg-[#1f5fd4] px-4 text-sm font-semibold text-white hover:bg-[#174eb2]"
      : "inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-[#1f5fd4] hover:border-[#1f5fd4]";

  return (
    <a className={className} href={href} rel={external ? "noreferrer" : undefined} target={external ? "_blank" : undefined}>
      {children}
    </a>
  );
}

function claimStatusLabel(status: PublicClaimStatus) {
  const labels: Record<PublicClaimStatus, string> = {
    unclaimed: "Nicht beansprucht",
    pending: "Übernahme angefragt",
    claimed: "Eintrag übernommen",
    rejected: "Abgelehnt",
  };

  return labels[status];
}

function statusPillClass(tone: ProfileStatus["tone"]) {
  if (tone === "verified") return "border-[#b9e2c2] bg-[#effaf2] text-[#1f6b3d]";
  if (tone === "claimed") return "border-[#e6d39a] bg-[#fff9e7] text-[#765c12]";
  return "border-line bg-white text-muted";
}

function statusBoxClass(tone: ProfileStatus["tone"]) {
  if (tone === "verified") return "border-[#b9e2c2] bg-[#f2fbf4] text-[#245b37]";
  if (tone === "claimed") return "border-[#e6d39a] bg-[#fff9e7] text-[#765c12]";
  return "border-line bg-white text-muted";
}

function normalizeWebsiteUrl(url: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function locationSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initials(value: string) {
  const words = value
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-zÄÖÜäöüß0-9]/g, ""))
    .filter(Boolean);
  return (words[0]?.[0] || "G").toUpperCase();
}
