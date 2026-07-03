import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  cleanCompanyDescription,
  extractServiceListFromDescription,
  extractServiceKeywordsFromText,
  groupServicesForDisplay,
  publicResultDescription,
} from "@/lib/company-display";
import {
  canonicalPublicCompanySlug,
  canonicalPublicCompanySlugFromSlug,
  getCompanyBySlug,
  getCompanyBySlugForMetadata,
} from "@/lib/data/public-directory";
import { breadcrumbJsonLd, jsonLd, localBusinessJsonLd } from "@/lib/seo";
import { slugify as slugifyService } from "@/lib/service-taxonomy";
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
    businessProfileDescription(cleanCompanyDescription(company.description)) ||
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
  const canonicalRequestedSlug = canonicalPublicCompanySlugFromSlug(slug);
  if (canonicalRequestedSlug !== slug) {
    permanentRedirect(`/firma/${canonicalRequestedSlug}`);
  }

  try {
    const company = await getCompanyBySlug(slug);
    const canonicalSlug = canonicalPublicCompanySlug(company);
    if (canonicalSlug !== slug) {
      permanentRedirect(`/firma/${canonicalSlug}`);
    }

    const trade = company.trades?.name || "Gewerk";
    const status = getProfileStatus(company);
    const canClaim = company.claim_status === "unclaimed" || company.claim_status === "rejected";
    const websiteHref = normalizeWebsiteUrl(company.website_url);
    const location = `${company.postal_code} ${company.city}`.trim();
    const address = getProfileAddress(company);
    const visibleDescription = businessProfileDescription(publicResultDescription(company.description));
    const profileDescription = getProfileDescription(company, trade, location, visibleDescription);
    const executedTrades = getExecutedTrades(company);
    const services = getRecognizableServices(company, executedTrades);
    const groupedServices = groupServicesForDisplay(services);
    const sourceItems = getSourceItems(company, websiteHref);
    const serviceAreaItems = getServiceAreaItems(company);
    const referenceItems = getTextBlockItems(company.references_text);
    const proofItems = getProfileProofItems(company);
    const premiumProfile = company.premium_profile || emptyPremiumProfile();
    const isVerifiedStartProfile = hasVerifiedStartProfile(company);
    const hasCoordinates =
      Number.isFinite(company.latitude) &&
      Number.isFinite(company.longitude) &&
      !(company.latitude === 0 && company.longitude === 0);
    const hasDirectContact = Boolean(company.email || company.phone || websiteHref);
    const profileCompletionItems = getProfileCompletionItems(company, visibleDescription, services.length, hasCoordinates);
    const completionScore = getProfileCompletionScore(company, visibleDescription, services.length, hasCoordinates);
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

          <section className="mt-6 overflow-hidden rounded-lg border border-line bg-white shadow-soft">
            <div className="relative min-h-28 bg-[#0d2447] sm:min-h-36">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,23,61,0.96)_0%,rgba(24,78,133,0.9)_48%,rgba(226,239,248,0.9)_100%)]" />
              <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
              <div className="relative flex min-h-28 items-start justify-between gap-4 p-5 sm:min-h-36 sm:p-7">
                <div className="rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-brand shadow-soft">
                  Öffentliches Unternehmensprofil
                </div>
              </div>
            </div>
            <div className="px-5 pt-5 pb-0 sm:px-7 sm:pt-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <ProfileMark company={company} canClaim={canClaim} />
                  <div className="min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={status} />
                    </div>
                    <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">{company.name}</h1>
                    <p className="mt-2 text-lg font-medium text-[#30415f]">{headline}</p>
                    <p className="mt-2 text-sm text-muted">{[company.city, trade, status.shortLabel].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ProfileMetric label="Standort" value={address.compact} />
                <ProfileMetric label="Schwerpunkt" value={trade} />
                <ProfileMetric label="Profilstatus" value={status.shortLabel} />
                <ProfileMetric label="Profilvollständigkeit" value={`${completionScore}%`} />
              </div>
              <div className="mt-6 border-t border-line py-4">
                <ActionBar company={company} websiteHref={websiteHref} canClaim={canClaim} />
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="order-2 grid gap-5 lg:order-1">
              <ProfileCard title="Über den Betrieb">
                <p className="max-w-4xl text-base leading-7 text-ink">{profileDescription}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Fact label="Gewerk" value={trade} />
                  <Fact label="Region" value={company.city} />
                  <Fact label="Kontaktstatus" value={hasDirectContact ? "Kontaktdaten hinterlegt" : "Kontaktdaten ergänzbar"} />
                </div>
              </ProfileCard>

              <ProfileCard
                title="Leistungen"
                subtitle="Auf der Firmenwebsite oder im Profil genannte Leistungen."
              >
                {groupedServices.length ? (
                  <ServiceGroups groups={groupedServices} totalCount={services.length} />
                ) : (
                  <p className="text-sm leading-6 text-muted">
                    Für diesen Betrieb sind noch keine konkreten Leistungen strukturiert hinterlegt. Nach Profilübernahme
                    können Leistungen und Spezialisierungen ergänzt werden.
                  </p>
                )}
              </ProfileCard>

              <ProfileCard title="Standort und Wirkungskreis">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Fact label="Standort" value={address.full} />
                  <Fact label="Ort" value={company.city} />
                  <Fact
                    label="Wirkungskreis"
                    value={
                      serviceAreaItems.length
                        ? serviceAreaItems.join(", ")
                        : "Regionale Tätigkeit kann nach Profilübernahme präzisiert werden."
                    }
                  />
                </div>
                {!address.hasStreet ? (
                  <p className="mt-3 text-xs leading-5 text-muted">Straße/Hausnummer ist noch nicht hinterlegt.</p>
                ) : null}
                {company.service_radius_km ? (
                  <p className="mt-4 text-sm leading-6 text-muted">
                    Angegebener Einsatzradius: {company.service_radius_km} km. Angaben zum Wirkungskreis werden vor Veröffentlichung geprüft.
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-muted">
                    Aktuell wird der Betrieb mit dem bekannten Standort geführt. Ein genauer Einsatzradius oder einzelne Orte werden erst nach
                    Prüfung und Profilübernahme veröffentlicht.
                  </p>
                )}
              </ProfileCard>

              {(referenceItems.length || proofItems.length) ? (
                <ProfileCard title="Referenzen und Nachweise">
                  {referenceItems.length ? (
                    <div>
                      <h3 className="text-sm font-semibold text-ink">Referenzen</h3>
                      <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                        {referenceItems.map((item) => (
                          <li key={item} className="rounded-md border border-line bg-[#fbfcff] px-4 py-3">{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {proofItems.length ? (
                    <div className={referenceItems.length ? "mt-5" : ""}>
                      <h3 className="text-sm font-semibold text-ink">Nachweise und Zugehörigkeiten</h3>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {proofItems.map((item) => (
                          <li key={item} className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-ink">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <p className="mt-4 text-xs leading-5 text-muted">
                    Referenzen und Nachweise werden als Textangaben dargestellt. Bilder oder Dokumentdateien werden derzeit nicht öffentlich angezeigt.
                  </p>
                </ProfileCard>
              ) : null}

              {company.verified ? (
                <ProfileCard title="Verifizierungskennzeichnung">
                  <div className="rounded-md border border-[#8ab9aa] bg-[#e8f3ef] px-4 py-4 text-sm leading-6 text-[#25584c]">
                    <div className="font-semibold text-ink">Verifiziertes Profil</div>
                    <p className="mt-2">
                      Die veröffentlichten Betriebsdaten wurden geprüft oder vom Betrieb bestätigt. Das ist ein Hinweis
                      auf nachvollziehbare Profildaten, keine Qualitäts-, Verfügbarkeits- oder Auftragsgarantie.
                    </p>
                    {company.verification_date ? (
                      <p className="mt-2 text-xs">Bestätigt am {formatDate(company.verification_date)}</p>
                    ) : null}
                  </div>
                </ProfileCard>
              ) : null}

              {isVerifiedStartProfile && hasPremiumTrustContent(premiumProfile) ? (
                <ProfileCard
                  title="Vertrauensprofil"
                  subtitle="Referenzen und Nachweise werden vom Betrieb bereitgestellt und strukturiert dargestellt."
                >
                  <PremiumTrustSections premiumProfile={premiumProfile} />
                </ProfileCard>
              ) : null}

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

            <aside className="order-1 grid content-start gap-5 lg:order-2">
              <ProfileCard title="Kontakt">
                <dl className="grid gap-4">
                  <DataRow label="Standort" value={address.full} />
                  {websiteHref ? <DataRow label="Website" value={company.website_url || websiteHref} href={websiteHref} external /> : null}
                  {company.phone ? <DataRow label="Telefon" value={company.phone} href={`tel:${company.phone}`} /> : null}
                  {company.email ? <DataRow label="E-Mail" value={company.email} href={`mailto:${company.email}`} /> : null}
                </dl>
                {!address.hasStreet ? (
                  <p className="mt-3 text-xs leading-5 text-muted">Straße/Hausnummer ist noch nicht hinterlegt.</p>
                ) : null}
                {!hasDirectContact ? (
                  <p className="mt-4 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-sm leading-6 text-muted">
                    Für diesen Betrieb sind noch keine direkten Kontaktdaten hinterlegt.
                  </p>
                ) : null}
              </ProfileCard>

              <ProfileCard title="Datenstatus">
                <div className={`rounded-md border px-4 py-4 text-sm leading-6 ${statusBoxClass(status.tone)}`}>
                  <div className="font-semibold text-ink">{status.label}</div>
                  <p className="mt-2">{status.note}</p>
                  {!company.verified ? (
                    <p className="mt-2 font-semibold text-ink">Dieses Profil ist noch nicht vom Betrieb verifiziert.</p>
                  ) : null}
                  <p className="mt-3 text-xs leading-5">
                    Datenstatus: Diese Seite ist ein Betriebsprofil. GewerkeListe gibt keine Qualitäts-, Auftrags- oder
                    Verfügbarkeitsgarantie.
                  </p>
                  <p className="mt-2 text-xs leading-5">
                    Personenbezogene Profilangaben werden nur angezeigt, wenn sie vom Betrieb bereitgestellt oder freigegeben wurden.
                  </p>
                </div>
                <dl className="mt-4 grid gap-4">
                  <DataRow label="Eintrag" value={claimStatusLabel(company.claim_status)} />
                  <DataRow label="Verifizierung" value={company.verified ? "Daten vom Betrieb bestätigt" : "Daten noch nicht verifiziert"} />
                </dl>
              </ProfileCard>

              <ContactTrustCard company={company} canClaim={canClaim} premiumContacts={isVerifiedStartProfile ? premiumProfile.contacts : []} />

              {isVerifiedStartProfile && premiumProfile.teamMembers.length ? (
                <ProfileCard title="Team">
                  <TeamList companyName={company.name} items={premiumProfile.teamMembers} />
                </ProfileCard>
              ) : null}

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
                    Kostenloses Basisprofil übernehmen
                  </Link>
                  <Link
                    className="mt-3 inline-flex w-full min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
                    href={`/betriebe/${company.slug}/profil-ergaenzen` as Route}
                  >
                    Eintrag korrigieren oder löschen lassen
                  </Link>
                  <Link
                    className="mt-3 inline-flex w-full min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
                    href="/datenschutz"
                  >
                    Datenschutzhinweise
                  </Link>
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
                  href={`/betriebe?gewerk=${company.trades.slug}` as Route}
                >
                  Weitere Betriebe in diesem Gewerk suchen
                </Link>
              ) : null}
              {company.trades?.slug ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
                  href={`/betriebe?gewerk=${company.trades.slug}&ort=${encodeURIComponent(company.city)}` as Route}
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

function ProfileMark({ company, canClaim }: { company: PublicCompanyWithTrade; canClaim: boolean }) {
  const logoLabel = canClaim ? "Profil übernehmen und Logo ergänzen" : "Logo ergänzen";

  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-line bg-white p-3 shadow-soft sm:h-32 sm:w-32">
      {company.logo_url ? (
        <img alt={`Logo von ${company.name}`} className="h-full w-full rounded-md object-contain" src={company.logo_url} />
      ) : (
        <div className="grid h-full w-full place-items-center rounded-md bg-[#07173d] px-3 text-center text-white">
          <div>
            <div className="text-4xl font-semibold">{initials(company.name)}</div>
            <div className="mt-2 text-[10px] font-semibold leading-4 text-white/75">{logoLabel}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactTrustCard({
  company,
  canClaim,
  premiumContacts,
}: {
  company: PublicCompanyWithTrade;
  canClaim: boolean;
  premiumContacts: NonNullable<PublicCompanyWithTrade["premium_profile"]>["contacts"];
}) {
  const claimHref = `/betriebe/${company.slug}/claim` as Route;
  const updateHref = `/betriebe/${company.slug}/profil-ergaenzen` as Route;
  const contactName = company.contact_person_name || company.contact_name || "Ansprechpartner";
  const contactPhone = company.phone || "";

  return (
    <ProfileCard title="Ansprechpartner">
      <div className="grid gap-3">
        {premiumContacts.length ? (
          <div className="grid gap-3">
            {premiumContacts.map((contact) => (
              <div key={contact.id} className="rounded-md border border-line bg-[#fbfcff] p-4">
                <PersonRow
                  imageUrl={contact.image_url}
                  imageAlt={`${contact.name} Ansprechpartner bei ${company.name}`}
                  initialsSource={contact.name}
                  name={contact.name}
                  role={contact.role}
                  phone={contact.phone}
                  email={contact.email}
                  primary={contact.is_primary}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-line bg-[#fbfcff] p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white text-center text-xl font-semibold leading-4 text-brand shadow-soft">
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
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink">
                {company.profile_image_url ? contactName : "Ansprechpartner ergänzbar"}
              </h3>
              {company.profile_image_url && company.contact_person_role ? (
                <p className="mt-1 text-sm font-semibold text-muted">{company.contact_person_role}</p>
              ) : null}
              {company.profile_image_url && contactPhone ? (
                <a className="mt-2 inline-flex text-sm font-semibold text-action hover:underline" href={`tel:${contactPhone}`}>
                  {contactPhone}
                </a>
              ) : null}
              {!company.profile_image_url ? (
                <p className="mt-1 text-sm leading-6 text-muted">Noch kein Ansprechpartnerbild freigegeben.</p>
              ) : null}
            </div>
          </div>
        </div>
        )}

        {canClaim ? (
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href={claimHref}>
            Profil übernehmen und Ansprechpartner ergänzen
          </Link>
        ) : (
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand" href={updateHref}>
            Ansprechpartner ergänzen
          </Link>
        )}
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
    <ProfileCard title="Ihr Basisprofil bleibt kostenlos.">
      <p className="text-sm leading-6 text-muted">
        Ihr Betrieb kann auf GewerkeListe.com kostenlos sichtbar bleiben – mit Name, Ort, Kontaktwegen, Gewerken und Leistungen.
        Sie können Ihr Profil übernehmen, Stammdaten korrigieren und Ihr tatsächliches Leistungsspektrum vollständig darstellen.
      </p>
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
          Kostenloses Basisprofil übernehmen
        </Link>
      ) : (
        <Link
          className="mt-5 inline-flex w-full min-h-11 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
          href={updateHref}
        >
          Profil kostenlos vervollständigen
        </Link>
      )}
      <Link
        className="mt-3 inline-flex w-full min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
        href={updateHref}
      >
        Eintrag korrigieren oder löschen lassen
      </Link>
      <Link
        className="mt-3 inline-flex w-full min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
        href="/datenschutz"
      >
        Datenschutzhinweise
      </Link>
      <div className="mt-4 grid gap-3 text-xs leading-5 text-muted">
        <p>
          Betriebe können ihr Profil übernehmen, Stammdaten korrigieren und Leistungen vollständig darstellen.
        </p>
        <p>
          Erweiterte Darstellungsfunktionen wie Ansprechpartnerbild, Referenzen, QR-Code, Sichtbarkeitsreport oder besondere Profilgestaltung können später optional angeboten werden. Das kostenlose Basisprofil bleibt davon unabhängig bestehen.
        </p>
      </div>
    </ProfileCard>
  );
}

function PersonRow({
  imageUrl,
  imageAlt,
  initialsSource,
  name,
  role,
  phone,
  email,
  primary,
}: {
  imageUrl?: string | null;
  imageAlt: string;
  initialsSource: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white text-center text-lg font-semibold leading-4 text-brand shadow-soft">
        {imageUrl ? <img alt={imageAlt} className="h-full w-full object-cover" src={imageUrl} /> : initials(initialsSource)}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-ink">{name}</h3>
          {primary ? <span className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-muted">Hauptkontakt</span> : null}
        </div>
        {role ? <p className="mt-1 text-sm font-semibold text-muted">{role}</p> : null}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
          {phone ? <a className="text-action hover:underline" href={`tel:${phone}`}>{phone}</a> : null}
          {email ? <a className="text-action hover:underline" href={`mailto:${email}`}>{email}</a> : null}
        </div>
      </div>
    </div>
  );
}

function TeamList({
  companyName,
  items,
}: {
  companyName: string;
  items: NonNullable<PublicCompanyWithTrade["premium_profile"]>["teamMembers"];
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border border-line bg-[#fbfcff] p-4">
          <PersonRow
            imageUrl={item.image_url}
            imageAlt={`${item.name} Teammitglied bei ${companyName}`}
            initialsSource={item.name}
            name={item.name}
            role={item.role}
          />
          {item.description ? <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p> : null}
        </div>
      ))}
    </div>
  );
}

function PremiumTrustSections({ premiumProfile }: { premiumProfile: NonNullable<PublicCompanyWithTrade["premium_profile"]> }) {
  return (
    <div className="grid gap-5">
      {premiumProfile.references.length ? (
        <div>
          <h3 className="text-sm font-semibold text-ink">Strukturierte Referenzen</h3>
          <div className="mt-3 grid gap-3">
            {premiumProfile.references.map((reference) => (
              <article key={reference.id} className="rounded-md border border-line bg-[#fbfcff] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-ink">{reference.title}</h4>
                    <p className="mt-1 text-sm text-muted">
                      {[reference.project_type, reference.location, reference.year, reference.client_type].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                {reference.description ? <p className="mt-3 text-sm leading-6 text-muted">{reference.description}</p> : null}
                {reference.services.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reference.services.map((service) => (
                      <span key={service} className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink">{service}</span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {premiumProfile.referenceMedia.length ? (
        <div>
          <h3 className="text-sm font-semibold text-ink">Referenzbilder</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {premiumProfile.referenceMedia.map((media) => (
              <figure key={media.id} className="overflow-hidden rounded-md border border-line bg-[#fbfcff]">
                <img alt={media.alt_text || media.caption || "Referenzbild"} className="h-48 w-full object-cover" src={media.file_url} />
                {media.caption ? <figcaption className="px-3 py-2 text-sm leading-5 text-muted">{media.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </div>
      ) : null}

      {premiumProfile.certificates.length ? (
        <div>
          <h3 className="text-sm font-semibold text-ink">Nachweise und Zertifikate</h3>
          <div className="mt-3 grid gap-3">
            {premiumProfile.certificates.map((certificate) => (
              <div key={certificate.id} className="rounded-md border border-line bg-[#fbfcff] p-4">
                <div className="font-semibold text-ink">{certificate.title}</div>
                <p className="mt-1 text-sm text-muted">
                  {[certificate.issuer, certificate.issued_at ? `seit ${formatDate(certificate.issued_at)}` : null, certificate.valid_until ? `gültig bis ${formatDate(certificate.valid_until)}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {certificate.description ? <p className="mt-3 text-sm leading-6 text-muted">{certificate.description}</p> : null}
                {certificate.file_url ? (
                  <a className="mt-3 inline-flex text-sm font-semibold text-action hover:underline" href={certificate.file_url} rel="noreferrer" target="_blank">
                    Nachweis ansehen
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-xs leading-5 text-muted">
        Referenzen und Nachweise werden vom Betrieb bereitgestellt. GewerkeListe strukturiert die Darstellung, gibt aber keine Qualitäts-, Verfügbarkeits- oder Auftragsgarantie.
      </p>
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
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
        href={`/betriebe/${company.slug}/profil-ergaenzen` as Route}
      >
        Eintrag korrigieren oder löschen lassen
      </Link>
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
        href="/datenschutz"
      >
        Datenschutzhinweise
      </Link>
    </div>
  );
}

function ServiceGroups({ groups, totalCount }: { groups: Array<{ label: string; items: string[] }>; totalCount: number }) {
  return (
    <div className="grid gap-3">
      {groups.map((group, index) => (
        <ServiceAccordion key={group.label} group={group} open={index === 0} />
      ))}
      <p className="text-xs leading-5 text-muted">{totalCount} Leistungen in {groups.length} Gruppen dargestellt.</p>
    </div>
  );
}

function ServiceAccordion({ group, open }: { group: { label: string; items: string[] }; open: boolean }) {
  return (
    <details className="group rounded-md border border-line bg-[#fbfcff] p-4" open={open}>
      <summary className="cursor-pointer list-none">
        <span className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-ink">{group.label}</span>
            <span className="mt-1 block text-xs text-muted">{group.items.length} Leistungen</span>
          </span>
          <span className="rounded-md border border-line bg-white px-3 py-1 text-xs font-semibold text-action">
            <span className="group-open:hidden">Leistungen anzeigen</span>
            <span className="hidden group-open:inline">Leistungen ausblenden</span>
          </span>
        </span>
      </summary>
      <div className="mt-4 flex flex-wrap gap-2">
        {group.items.map((item) => (
          <Link
            key={item}
            className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-ink hover:border-action hover:text-action"
            href={`/leistungen/${slugifyService(item)}` as Route}
          >
            {item}
          </Link>
        ))}
      </div>
    </details>
  );
}

function ProfileCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-lg font-semibold text-ink sm:text-xl">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function getProfileStatus(company: PublicCompanyWithTrade): ProfileStatus {
  if (company.verified) {
    return {
      label: "Verifiziertes Profil",
      shortLabel: "Verifiziertes Profil",
      note: "Die veröffentlichten Betriebsdaten wurden geprüft oder vom Betrieb bestätigt.",
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

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfcff] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-ink">{value}</div>
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
    return `${company.name} ist als Betrieb im Bereich ${trade} in ${location} gelistet. Die grundlegenden Betriebsdaten wurden übernommen bzw. zur Prüfung eingereicht.`;
  }

  return `${company.name} ist als Betrieb im Bereich ${trade} in ${location} gelistet. Der Eintrag basiert auf öffentlich zugänglichen Unternehmensinformationen und ist noch nicht vollständig vom Betrieb bestätigt.`;
}

function businessProfileDescription(description: string) {
  if (!description) return "";

  const blockedSignals = [
    "Ausgewählte Leistungen:",
    "Ausgewaehlte Leistungen:",
    "Nachweisangaben:",
    "Gewerbenachweis kann bei Bedarf nachgereicht werden",
    "Startphase:",
    "Förderoption:",
    "Foerderoption:",
    "Rechnung auf Wunsch:",
    "Status: automatisch wird nichts berechnet",
  ];

  const cleaned = cleanCompanyDescription(description)
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !blockedSignals.some((signal) => sentence.includes(signal)))
    .slice(0, 4)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function getRecognizableServices(company: PublicCompanyWithTrade, executedTrades: string[]) {
  const evidenceItems = (company.company_trades || [])
    .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
    .flatMap((match) => [...splitEvidence(match.evidence), ...extractServiceKeywordsFromText(match.evidence)]);

  const descriptionItems = extractServiceListFromDescription(company.description);
  return [...new Set([...descriptionItems, ...evidenceItems, ...executedTrades])];
}

function splitEvidence(value: string | null) {
  if (!value) return [];
  return value
    .split(/[;,|/]+/)
    .map((item) => item.trim().replace(/^[✓\-–•\s]+/, ""))
    .filter((item) => item.length >= 3 && item.length <= 80);
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
    company.profile_image_url ? "Ansprechpartner ist sichtbar" : "Ansprechpartner ergänzen",
    serviceCount ? "Leistungen weiter schärfen" : "Leistungen ergänzen",
    description ? "Kurzbeschreibung aktuell halten" : "Kurzbeschreibung ergänzen",
    hasCoordinates ? "Wirkungskreis präzisieren" : "Wirkungskreis markieren",
    "Kontaktwege aktuell halten",
  ];
}

function getServiceAreaItems(company: PublicCompanyWithTrade) {
  const regions = Array.isArray(company.service_regions) ? company.service_regions : [];
  const postalCodes = Array.isArray(company.service_postal_codes) ? company.service_postal_codes : [];

  return [...regions, ...postalCodes]
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 8);
}

function getTextBlockItems(value?: string | null) {
  if (!value) return [];

  return value
    .split(/\n|;/)
    .map((item) => item.trim().replace(/^[\-–•\s]+/, ""))
    .filter((item) => item.length >= 3)
    .slice(0, 8);
}

function getProfileProofItems(company: PublicCompanyWithTrade) {
  return [
    ...(Array.isArray(company.memberships) ? company.memberships : []),
    ...(Array.isArray(company.certificates) ? company.certificates : []),
    ...(Array.isArray(company.manufacturer_certificates) ? company.manufacturer_certificates : []),
  ]
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 12);
}

function hasVerifiedStartProfile(company: PublicCompanyWithTrade) {
  return company.profile_package === "verified_start" && (company.verified || company.profile_status === "verified");
}

function hasPremiumTrustContent(profile: NonNullable<PublicCompanyWithTrade["premium_profile"]>) {
  return Boolean(profile.references.length || profile.referenceMedia.length || profile.certificates.length);
}

function emptyPremiumProfile(): NonNullable<PublicCompanyWithTrade["premium_profile"]> {
  return {
    contacts: [],
    teamMembers: [],
    references: [],
    referenceMedia: [],
    certificates: [],
  };
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function getProfileAddress(company: PublicCompanyWithTrade) {
  const cityLine = `${company.postal_code} ${company.city}`.trim();
  const street = company.street?.trim();

  return {
    compact: street ? `${street}, ${cityLine}` : cityLine,
    full: street ? `${street}, ${cityLine}` : `Standort: ${cityLine}`,
    hasStreet: Boolean(street),
  };
}

function getProfileCompletionScore(
  company: PublicCompanyWithTrade,
  description: string,
  serviceCount: number,
  hasCoordinates: boolean,
) {
  const checks = [
    Boolean(company.name),
    Boolean(company.city),
    Boolean(company.trades?.name),
    Boolean(company.website_url || company.phone || company.email),
    Boolean(description),
    serviceCount > 0,
    Boolean(company.logo_url),
    Boolean(company.profile_image_url),
    hasCoordinates,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
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
