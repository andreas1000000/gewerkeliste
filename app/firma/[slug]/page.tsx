import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  cleanCompanyDescription,
  extractServiceListFromDescription,
  groupServicesForDisplay,
  publicResultDescription,
} from "@/lib/company-display";
import { getCompanyBySlug, getCompanyBySlugForMetadata } from "@/lib/data/public-directory";
import { breadcrumbJsonLd, jsonLd, localBusinessJsonLd } from "@/lib/seo";
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
    const sourceItems = getSourceItems(company, websiteHref);
    const hasCoordinates =
      Number.isFinite(company.latitude) &&
      Number.isFinite(company.longitude) &&
      !(company.latitude === 0 && company.longitude === 0);
    const hasDirectContact = Boolean(company.email || company.phone || websiteHref);
    const missingProfileItems = getMissingProfileItems(company, visibleDescription, services.length, hasCoordinates);
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
            <Link className="hover:text-ink" href={`/suche?gewerk=${company.trades?.slug || ""}` as Route}>
              {trade}
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="hover:text-ink" href={`/suche?ort=${encodeURIComponent(company.city)}` as Route}>
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
                title="Leistungen"
                subtitle={
                  company.verified || company.claim_status === "claimed"
                    ? "Vom Betrieb angegebene oder im Profil genannte Leistungen."
                    : "Auf der Firmenwebsite oder in öffentlichen Unternehmensquellen erkennbare Leistungen."
                }
              >
                {groupedServices.length ? (
                  <ServiceGroups groups={groupedServices} />
                ) : (
                  <p className="text-sm leading-6 text-muted">
                    Für diesen Betrieb sind noch keine konkreten Leistungen strukturiert hinterlegt. Nach Profilübernahme
                    können Leistungen und Spezialisierungen ergänzt werden.
                  </p>
                )}
              </ProfileCard>

              <ProfileCard title="Gewerke">
                <div className="flex flex-wrap gap-2">
                  {executedTrades.map((item, index) =>
                    index === 0 && company.trades?.slug ? (
                      <Link
                        key={item}
                        className="rounded-md bg-[#07173d] px-3 py-2 text-sm font-semibold text-white hover:bg-brand"
                        href={`/gewerke/${company.trades.slug}` as Route}
                      >
                        {item}
                      </Link>
                    ) : (
                      <span key={item} className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-ink">
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </ProfileCard>

              <ProfileCard title="Standort und Einsatzgebiet">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Fact label="Standort" value={location} />
                  <Fact
                    label="Wirkungskreis"
                    value={
                      hasCoordinates
                        ? "Standortdaten vorhanden. Ein konkreter Wirkungskreis ist noch nicht hinterlegt."
                        : "Noch nicht hinterlegt. Der Betrieb kann Einsatzgebiete nach Profilübernahme ergänzen."
                    }
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

              {missingProfileItems.length ? (
                <ProfileCard title="Profil vervollständigen">
                  <p className="text-sm leading-6 text-muted">Dieses Profil ist noch unvollständig.</p>
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted">
                    {missingProfileItems.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </ProfileCard>
              ) : null}
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
        <div className="grid h-full w-full place-items-center rounded-md bg-[#07173d] text-4xl font-semibold text-white">
          {initials(company.name)}
        </div>
      )}
    </div>
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

function ServiceGroups({ groups }: { groups: Array<{ label: string; items: string[] }> }) {
  const visibleGroups = groups.map((group) => ({ ...group, items: group.items.slice(0, 18) }));
  const visibleCount = visibleGroups.reduce((sum, group) => sum + group.items.length, 0);
  const allCount = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-semibold text-ink">{group.label}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span key={item} className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-ink">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {allCount > visibleCount ? (
        <details className="rounded-md border border-line bg-[#fbfcff] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-action">Alle Leistungen anzeigen</summary>
          <div className="mt-4 flex flex-wrap gap-2">
            {groups.flatMap((group) => group.items.slice(18)).map((item) => (
              <span key={item} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
                {item}
              </span>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
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
    .flatMap((match) => splitEvidence(match.evidence));

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

function getMissingProfileItems(company: PublicCompanyWithTrade, description: string, serviceCount: number, hasCoordinates: boolean) {
  const items: string[] = [];
  if (!company.email && !company.phone && !company.website_url) items.push("Kontaktdaten fehlen");
  if (!description) items.push("Leistungsbeschreibung fehlt");
  if (!serviceCount) items.push("Leistungen fehlen");
  if (!hasCoordinates) items.push("Einsatzgebiet fehlt");
  return items;
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
