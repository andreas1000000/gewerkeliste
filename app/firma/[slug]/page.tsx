import type { Metadata } from "next";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  extractServiceListFromDescription,
  groupServicesForDisplay,
  publicProfileDescription,
} from "@/lib/company-display";
import {
  canonicalPublicCompanySlug,
  canonicalPublicCompanySlugFromSlug,
  getCompanyBySlug,
  getCompanyBySlugForMetadata,
} from "@/lib/data/public-directory";
import { certificateVerificationInfo, getPublicProfileEntitlements } from "@/lib/public-profile-rules";
import {
  buildPublicProfileDescription,
  buildPublicProfileTitle,
  canonicalProfileUrl,
  publicJsonLdMediaUrl,
  publicProfileRobots,
} from "@/lib/public-profile-seo";
import { breadcrumbJsonLd, jsonLd, localBusinessJsonLd } from "@/lib/seo";
import { findServiceSeoEntry, slugify as slugifyService } from "@/lib/service-taxonomy";
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

type ServiceDisplayItem = {
  label: string;
  slug?: string;
};

type ServiceDisplayGroup = {
  label: string;
  items: ServiceDisplayItem[];
};

const VERIFIED_SCOPE_TEXT =
  "GewerkeListe.com hat ausgewählte Unternehmens- und Kontaktdaten dieses Betriebs geprüft. Leistungsangaben, Referenzen und weitere Inhalte stammen vom Betrieb, sofern sie nicht gesondert als geprüft gekennzeichnet sind.";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = canonicalPublicCompanySlugFromSlug(slug);
  const company = await getCompanyBySlugForMetadata(canonicalSlug);

  if (!company) {
    return {
      title: "Firma nicht gefunden | GewerkeListe.com",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const trade = company.trades?.name || "Handwerk";
  const title = buildPublicProfileTitle({ name: company.name, trade, city: company.city });
  const description = buildPublicProfileDescription({
    name: company.name,
    trade,
    city: company.city,
    serviceRegion: company.service_regions?.[0] || null,
  });
  const canonical = canonicalProfileUrl(canonicalSlug);
  const image = publicJsonLdMediaUrl(company.profile_image_url) || publicJsonLdMediaUrl(company.logo_url);

  return {
    title,
    description,
    robots: publicProfileRobots(),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: image ? [{ url: image, alt: `Profilbild oder Logo von ${company.name}` }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function CompanyPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const canonicalRequestedSlug = canonicalPublicCompanySlugFromSlug(slug);
  if (canonicalRequestedSlug !== slug) {
    permanentRedirect(`/firma/${canonicalRequestedSlug}`);
  }

  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

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
    const visibleDescription = businessProfileDescription(publicProfileDescription(company.description));
    const profileDescription = getProfileDescription(company, trade, location, visibleDescription);
    const serviceDisplay = getServiceDisplay(company);
    const specializationItems = getSpecializationItems(company);
    const serviceAreaItems = getServiceAreaItems(company);
    const referenceItems = getTextBlockItems(company.references_text);
    const proofItems = getProfileProofItems(company);
    const premiumProfile = company.premium_profile || emptyPremiumProfile();
    const entitlements = getPublicProfileEntitlements({ ...company, premium_profile: premiumProfile });
    const hasDirectContact = Boolean(company.email || company.phone || company.contact_person_email || company.contact_person_phone || websiteHref);
    const headline = trade === "Gewerk" ? `Bau- und Handwerksbetrieb in ${company.city}` : `${trade} in ${company.city}`;
    const tradeSlug = company.trades?.slug || "";
    const citySlug = locationSlug(company.city);
    const tradePath = tradeSlug ? `/gewerke/${tradeSlug}` : "/betriebe";
    const cityPath = tradeSlug ? `/gewerke/${tradeSlug}/${citySlug}` : `/orte/${citySlug}`;

    const breadcrumb = breadcrumbJsonLd([
      { name: "Startseite", path: "/" },
      { name: "Betriebe", path: "/betriebe" },
      { name: trade, path: tradePath },
      { name: company.city, path: cityPath },
      { name: company.name, path: `/firma/${company.slug}` },
    ]);
    const localBusiness = localBusinessJsonLd(company, `/firma/${company.slug}`, profileDescription);

    return (
      <main className="min-h-screen overflow-x-hidden bg-[#f6f8fb] text-ink [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-action [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-action [&_input:focus-visible]:outline [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-offset-2 [&_input:focus-visible]:outline-action [&_select:focus-visible]:outline [&_select:focus-visible]:outline-2 [&_select:focus-visible]:outline-offset-2 [&_select:focus-visible]:outline-action [&_summary:focus-visible]:outline [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-offset-4 [&_summary:focus-visible]:outline-action [&_textarea:focus-visible]:outline [&_textarea:focus-visible]:outline-2 [&_textarea:focus-visible]:outline-offset-2 [&_textarea:focus-visible]:outline-action">
        <SiteHeader />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumb)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(localBusiness)} />

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link className="inline-flex min-h-8 items-center hover:text-ink" href={"/" as Route}>
              Startseite
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="inline-flex min-h-8 items-center hover:text-ink" href={"/betriebe" as Route}>
              Betriebe
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="inline-flex min-h-8 items-center hover:text-ink" href={tradePath as Route}>
              {trade}
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="inline-flex min-h-8 items-center hover:text-ink" href={cityPath as Route}>
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
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ProfileMetric label="Standort" value={address.compact} />
                <ProfileMetric label="Schwerpunkt" value={trade} />
                <ProfileMetric label="Profilstatus" value={status.shortLabel} />
              </div>
              <div className="mt-6 border-t border-line py-4">
                <ActionBar company={company} websiteHref={websiteHref} />
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="order-2 grid gap-5 lg:order-1">
              <ProfileCard title="Über den Betrieb">
                <div className="max-w-4xl space-y-4 text-base leading-7 text-ink">
                  {profileDescription.split(/\n{2,}/).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Fact label="Gewerk" value={trade} />
                  <Fact label="Region" value={company.city} />
                  {hasDirectContact ? <Fact label="Kontakt" value="Direkte Kontaktdaten hinterlegt" /> : null}
                </div>
              </ProfileCard>

              {serviceDisplay.groups.length || specializationItems.length ? (
                <ProfileCard
                  title="Leistungen"
                  subtitle={serviceDisplay.sourceLabel}
                >
                  {serviceDisplay.groups.length ? (
                    <ServiceGroups groups={serviceDisplay.groups} />
                  ) : null}
                  {specializationItems.length ? (
                    <div className={serviceDisplay.groups.length ? "mt-5 border-t border-line pt-4" : ""}>
                      <h3 className="text-sm font-semibold text-ink">Spezialisierungen</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {specializationItems.map((item) => (
                          <span key={item} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </ProfileCard>
              ) : null}

              {(address.hasStreet || serviceAreaItems.length || company.service_radius_km) ? (
                <ProfileCard title="Standort und Wirkungskreis">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Fact label="Standort" value={address.full} />
                    <Fact label="Ort" value={company.city} />
                    {serviceAreaItems.length ? <Fact label="Wirkungskreis" value={serviceAreaItems.join(", ")} /> : null}
                  </div>
                  {company.service_radius_km ? (
                    <p className="mt-4 text-sm leading-6 text-muted">Angegebener Einsatzradius: {company.service_radius_km} km.</p>
                  ) : null}
                </ProfileCard>
              ) : null}

              {(entitlements.modules.references || entitlements.modules.certificates || hasPremiumTrustContent(premiumProfile)) ? (
                <ProfileCard title="Referenzen und Nachweise">
                  {hasPremiumTrustContent(premiumProfile) ? (
                    <PremiumTrustSections premiumProfile={premiumProfile} />
                  ) : null}
                  {referenceItems.length ? (
                    <div className={hasPremiumTrustContent(premiumProfile) ? "mt-5 border-t border-line pt-5" : ""}>
                      <h3 className="text-sm font-semibold text-ink">Referenzen</h3>
                      <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                        {referenceItems.map((item) => (
                          <li key={item} className="rounded-md border border-line bg-[#fbfcff] px-4 py-3">{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {proofItems.length ? (
                    <div className={(referenceItems.length || hasPremiumTrustContent(premiumProfile)) ? "mt-5" : ""}>
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
                </ProfileCard>
              ) : null}

              {entitlements.modules.profileSections ? (
                <ProfileSections sections={premiumProfile.profileSections} />
              ) : null}

              {company.verified ? (
                <ProfileCard title="Verifizierungskennzeichnung">
                  <div className="rounded-md border border-[#8ab9aa] bg-[#e8f3ef] px-4 py-4 text-sm leading-6 text-[#25584c]">
                    <div className="font-semibold text-ink">Verifiziertes Profil</div>
                    <p className="mt-2">{VERIFIED_SCOPE_TEXT}</p>
                    {company.verification_date ? (
                      <p className="mt-2 text-xs">Bestätigt am {formatDate(company.verification_date)}</p>
                    ) : null}
                  </div>
                </ProfileCard>
              ) : null}

            </div>

            <aside className="order-1 grid content-start gap-5 lg:order-2">
              <ProfileCard title="Kontakt">
                <dl className="grid gap-4">
                  <DataRow label="Standort" value={address.full} />
                  {websiteHref ? <DataRow label="Website" value={company.website_url || websiteHref} href={websiteHref} external /> : null}
                  {company.phone ? <DataRow label="Telefon" value={company.phone} href={`tel:${company.phone}`} /> : null}
                  {company.email ? <DataRow label="E-Mail" value={company.email} href={`mailto:${company.email}`} /> : null}
                </dl>
              </ProfileCard>

              {entitlements.modules.socialLinks ? <SocialLinksCard links={premiumProfile.socialLinks} /> : null}

              {entitlements.modules.contacts && hasContactPersonContent(company, premiumProfile.contacts) ? (
                <ContactTrustCard company={company} premiumContacts={premiumProfile.contacts} />
              ) : null}

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

              {entitlements.modules.team ? (
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

            </aside>
          </div>

          <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Ähnliche Betriebe finden</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
              Vergleichen Sie weitere öffentlich gelistete Betriebe nach Gewerk und Region.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {tradeSlug ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
                  href={tradePath as Route}
                >
                  Weitere Betriebe in diesem Gewerk suchen
                </Link>
              ) : null}
              {tradeSlug ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
                  href={cityPath as Route}
                >
                  Betriebe in {company.city} vergleichen
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    );
}

function ProfileMark({ company, canClaim }: { company: PublicCompanyWithTrade; canClaim: boolean }) {
  const logoLabel = canClaim ? "Profil übernehmen und Logo ergänzen" : "Logo ergänzen";

  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-line bg-white p-3 shadow-soft sm:h-32 sm:w-32">
      {company.logo_url ? (
        <Image
          alt={`Logo von ${company.name}`}
          className="h-full w-full rounded-md object-contain"
          height={128}
          src={company.logo_url}
          width={128}
          sizes="128px"
          unoptimized={isLocalSignedMediaUrl(company.logo_url)}
        />
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
  premiumContacts,
}: {
  company: PublicCompanyWithTrade;
  premiumContacts: NonNullable<PublicCompanyWithTrade["premium_profile"]>["contacts"];
}) {
  const contactName = company.contact_person_name || company.contact_name || "Ansprechpartner";
  const contactPhone = company.contact_person_phone || company.phone || "";
  const contactEmail = company.contact_person_email || "";
  const hasNamedContact = Boolean(company.contact_person_name || company.contact_name);

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
                  responsibilityArea={contact.responsibility_area}
                  phone={contact.phone}
                  email={contact.email}
                  primary={contact.is_primary}
                  primaryContactMethod={contact.primary_contact_method}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-line bg-[#fbfcff] p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white text-center text-xl font-semibold leading-4 text-brand shadow-soft">
                {company.profile_image_url ? (
                  <Image
                    alt={company.profile_image_alt || `Ansprechpartner von ${company.name}`}
                    className="h-full w-full object-cover"
                    height={96}
                    src={company.profile_image_url}
                    width={96}
                    sizes="96px"
                    unoptimized={isLocalSignedMediaUrl(company.profile_image_url)}
                  />
                ) : (
                  initials(company.name)
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-ink">
                  {hasNamedContact ? contactName : "Ansprechpartner"}
                </h3>
                {company.contact_person_role ? (
                  <p className="mt-1 text-sm font-semibold text-muted">{company.contact_person_role}</p>
                ) : null}
                {contactPhone ? (
                  <a className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-action hover:underline" href={`tel:${contactPhone}`}>
                    {contactPhone}
                  </a>
                ) : null}
                {contactEmail ? (
                  <a className="mt-1 inline-flex min-h-9 items-center text-sm font-semibold text-action hover:underline" href={`mailto:${contactEmail}`}>
                    {contactEmail}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        )}
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
  responsibilityArea,
  phone,
  email,
  primary,
  primaryContactMethod,
}: {
  imageUrl?: string | null;
  imageAlt: string;
  initialsSource: string;
  name: string;
  role?: string | null;
  responsibilityArea?: string | null;
  phone?: string | null;
  email?: string | null;
  primary?: boolean;
  primaryContactMethod?: string | null;
}) {
  const primaryLabel = primaryContactMethod ? primaryContactMethodLabel(primaryContactMethod) : "";

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white text-center text-lg font-semibold leading-4 text-brand shadow-soft">
        {imageUrl ? (
          <Image
            alt={imageAlt}
            className="h-full w-full object-cover"
            height={80}
            src={imageUrl}
            width={80}
            sizes="80px"
            unoptimized={isLocalSignedMediaUrl(imageUrl)}
          />
        ) : initials(initialsSource)}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-ink">{name}</h3>
          {primary ? <span className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-muted">Hauptkontakt</span> : null}
        </div>
        {role ? <p className="mt-1 text-sm font-semibold text-muted">{role}</p> : null}
        {responsibilityArea ? <p className="mt-1 text-sm leading-5 text-muted">{responsibilityArea}</p> : null}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
          {phone ? <a className="inline-flex min-h-9 items-center text-action hover:underline" href={`tel:${phone}`}>{phone}</a> : null}
          {email ? <a className="inline-flex min-h-9 items-center text-action hover:underline" href={`mailto:${email}`}>{email}</a> : null}
        </div>
        {primaryLabel ? <p className="mt-2 text-xs leading-5 text-muted">Primaere Kontaktmoeglichkeit: {primaryLabel}</p> : null}
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
            responsibilityArea={item.department}
          />
          {item.description ? <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p> : null}
        </div>
      ))}
    </div>
  );
}

function SocialLinksCard({ links }: { links: NonNullable<PublicCompanyWithTrade["premium_profile"]>["socialLinks"] }) {
  return (
    <ProfileCard title="Online-Profile">
      <ul className="grid gap-2">
        {links.map((link) => {
          const label = link.label || socialPlatformLabel(link.platform);
          return (
            <li key={link.id}>
              <a
                aria-label={`${label} von ${link.platform || "Betrieb"} oeffnen`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-line bg-[#fbfcff] px-4 py-2 text-sm font-semibold text-action hover:border-action"
                href={link.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>{label}</span>
                <span aria-hidden="true" className="text-muted">↗</span>
              </a>
            </li>
          );
        })}
      </ul>
    </ProfileCard>
  );
}

function ProfileSections({ sections }: { sections: NonNullable<PublicCompanyWithTrade["premium_profile"]>["profileSections"] }) {
  return (
    <div className="grid gap-5">
      {sections.map((section) => (
        <ProfileCard key={section.id} title={section.title}>
          <p className="whitespace-pre-line text-sm leading-7 text-muted">{section.body}</p>
        </ProfileCard>
      ))}
    </div>
  );
}

function PremiumTrustSections({ premiumProfile }: { premiumProfile: NonNullable<PublicCompanyWithTrade["premium_profile"]> }) {
  const mediaByReference = groupReferenceMedia(premiumProfile);

  return (
    <div className="grid gap-5">
      {premiumProfile.notes ? (
        <div>
          <h3 className="text-sm font-semibold text-ink">Weitere Profilinformationen</h3>
          <p className="mt-3 whitespace-pre-line rounded-md border border-line bg-[#fbfcff] p-4 text-sm leading-6 text-muted">
            {premiumProfile.notes}
          </p>
        </div>
      ) : null}

      {premiumProfile.references.length ? (
        <div>
          <h3 className="text-sm font-semibold text-ink">Strukturierte Referenzen</h3>
          <div className="mt-3 grid gap-3">
            {premiumProfile.references.map((reference) => {
              const mediaItems = mediaByReference.get(reference.id) || [];
              return (
                <article key={reference.id} className="rounded-md border border-line bg-[#fbfcff] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-ink">{reference.title}</h4>
                      <p className="mt-1 text-sm text-muted">
                        {referenceMetaParts(reference).join(" · ")}
                      </p>
                    </div>
                  </div>
                  {reference.description ? <p className="mt-3 text-sm leading-6 text-muted">{reference.description}</p> : null}
                  {reference.challenge && reference.solution ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border border-line bg-white p-3">
                        <div className="text-xs font-semibold uppercase tracking-normal text-muted">Herausforderung</div>
                        <p className="mt-2 text-sm leading-6 text-muted">{reference.challenge}</p>
                      </div>
                      <div className="rounded-md border border-line bg-white p-3">
                        <div className="text-xs font-semibold uppercase tracking-normal text-muted">Loesung</div>
                        <p className="mt-2 text-sm leading-6 text-muted">{reference.solution}</p>
                      </div>
                    </div>
                  ) : null}
                  {reference.services.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {reference.services.map((service) => (
                        <span key={service} className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink">{service}</span>
                      ))}
                    </div>
                  ) : null}
                  {mediaItems.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {mediaItems.map((media) => (
                        <figure key={media.id} className="overflow-hidden rounded-md border border-line bg-white">
                          <Image
                            alt={media.alt_text || media.caption || `Referenzbild zu ${reference.title}`}
                          className="h-48 w-full object-cover"
                          height={media.height || 240}
                          src={media.file_url}
                            width={media.width || 420}
                            sizes="(min-width: 1024px) 330px, (min-width: 640px) 50vw, 100vw"
                            unoptimized={isLocalSignedMediaUrl(media.file_url)}
                          />
                          {media.caption ? <figcaption className="px-3 py-2 text-sm leading-5 text-muted">{media.caption}</figcaption> : null}
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {premiumProfile.certificates.length ? (
        <div>
          <h3 className="text-sm font-semibold text-ink">Nachweise und Zertifikate</h3>
          <div className="mt-3 grid gap-3">
            {premiumProfile.certificates.map((certificate) => {
              const verification = certificateVerificationInfo(certificate.verification_level);
              return (
                <div key={certificate.id} className="rounded-md border border-line bg-[#fbfcff] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink">{certificate.title}</div>
                      <p className="mt-1 text-sm text-muted">
                        {certificateMetaParts(certificate).join(" · ")}
                      </p>
                    </div>
                    <span className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-muted">
                      {verification.label}
                    </span>
                  </div>
                  {certificate.description ? <p className="mt-3 text-sm leading-6 text-muted">{certificate.description}</p> : null}
                  <p className="mt-3 text-xs leading-5 text-muted">{verification.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-xs leading-5 text-muted">
        Referenzen und Nachweise werden vom Betrieb bereitgestellt. GewerkeListe strukturiert die Darstellung, gibt aber keine Qualitäts-, Verfügbarkeits- oder Auftragsgarantie.
      </p>
    </div>
  );
}

function groupReferenceMedia(premiumProfile: NonNullable<PublicCompanyWithTrade["premium_profile"]>) {
  const referenceIds = new Set(premiumProfile.references.map((reference) => reference.id));
  const groups = new Map<string, typeof premiumProfile.referenceMedia>();

  for (const media of premiumProfile.referenceMedia) {
    const key = media.reference_id && referenceIds.has(media.reference_id) ? media.reference_id : "__orphan__";
    groups.set(key, [...(groups.get(key) || []), media]);
  }

  return groups;
}

function referenceMetaParts(reference: NonNullable<PublicCompanyWithTrade["premium_profile"]>["references"][number]) {
  const period = reference.period || (reference.year ? String(reference.year) : "");
  const year = reference.year ? String(reference.year) : "";
  return [
    reference.project_type,
    reference.location,
    period,
    period && year && period.includes(year) ? null : year,
    reference.client_type,
    reference.client_public ? reference.client_name : null,
  ].filter((value): value is string => Boolean(value));
}

function certificateMetaParts(certificate: NonNullable<PublicCompanyWithTrade["premium_profile"]>["certificates"][number]) {
  return [
    certificate.proof_type,
    certificate.issuer,
    certificate.issued_at ? `seit ${formatDate(certificate.issued_at)}` : null,
    certificate.valid_until ? `gueltig bis ${formatDate(certificate.valid_until)}` : null,
  ].filter((value): value is string => Boolean(value));
}

function primaryContactMethodLabel(value: string) {
  const labels: Record<string, string> = {
    phone: "Telefon",
    email: "E-Mail",
    website: "Website",
    form: "Kontaktformular",
    none: "nicht festgelegt",
  };

  return labels[value] || value;
}

function socialPlatformLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  const labels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    pinterest: "Pinterest",
    tiktok: "TikTok",
    youtube: "YouTube",
  };

  return labels[normalized] || value || "Externes Profil";
}

function ActionBar({
  company,
  websiteHref,
}: {
  company: PublicCompanyWithTrade;
  websiteHref?: string;
}) {
  const primaryAction = getPrimaryContactAction(company, websiteHref);

  return (
    <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
      {primaryAction ? (
        <ContactButton kind="primary" href={primaryAction.href} external={primaryAction.external}>
          Betrieb kontaktieren
        </ContactButton>
      ) : null}
      {websiteHref && primaryAction?.href !== websiteHref ? (
        <ContactButton href={websiteHref} external>
          Website besuchen
        </ContactButton>
      ) : null}
      {company.phone && primaryAction?.href !== `tel:${company.phone}` ? <ContactButton href={`tel:${company.phone}`}>Anrufen</ContactButton> : null}
      {company.email && primaryAction?.href !== `mailto:${company.email}` ? <ContactButton href={`mailto:${company.email}`}>E-Mail schreiben</ContactButton> : null}
    </div>
  );
}

function getPrimaryContactAction(company: PublicCompanyWithTrade, websiteHref?: string) {
  const email = company.contact_person_email || company.email;
  if (email) return { href: `mailto:${email}` };
  const phone = company.contact_person_phone || company.phone;
  if (phone) return { href: `tel:${phone}` };
  if (websiteHref) return { href: websiteHref, external: true };
  return null;
}

function serviceDisplayGroupsFromNames(services: string[]): ServiceDisplayGroup[] {
  return groupServicesForDisplay(services).map((group) => ({
    label: group.label,
    items: group.items.map(serviceDisplayItemFromName),
  }));
}

function serviceDisplayItemFromName(name: string): ServiceDisplayItem {
  const slug = slugifyService(name);
  return findServiceSeoEntry(slug) ? { label: name, slug } : { label: name };
}

function ServiceGroups({ groups }: { groups: ServiceDisplayGroup[] }) {
  return (
    <div className="grid gap-3">
      {groups.map((group, index) => (
        <ServiceAccordion key={group.label} group={group} open={index === 0} />
      ))}
    </div>
  );
}

function ServiceAccordion({ group, open }: { group: ServiceDisplayGroup; open: boolean }) {
  return (
    <details className="group rounded-md border border-line bg-[#fbfcff] p-4" open={open}>
      <summary className="cursor-pointer list-none rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action">
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
          item.slug ? (
            <Link
              key={item.label}
              className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-ink hover:border-action hover:text-action"
              href={`/leistungen/${item.slug}` as Route}
            >
              {item.label}
            </Link>
          ) : (
            <span key={item.label} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
              {item.label}
            </span>
          )
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
      note: VERIFIED_SCOPE_TEXT,
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
    "Leistungen:",
    "Tätigkeitsgebiet:",
    "Taetigkeitsgebiet:",
    "Nachweisangaben:",
    "Gewerbenachweis kann bei Bedarf nachgereicht werden",
    "Startphase:",
    "Förderoption:",
    "Foerderoption:",
    "Rechnung auf Wunsch:",
    "Status: automatisch wird nichts berechnet",
  ];

  const cleaned = description
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !blockedSignals.some((signal) => line.includes(signal)))
    .join("\n\n")
    .trim();

  return cleaned;
}

function getServiceDisplay(company: PublicCompanyWithTrade) {
  const confirmedServices = (company.company_services || [])
    .filter((match) => match.status === "confirmed" && Boolean(match.services?.name))
    .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));

  if (confirmedServices.length) {
    const groupsByFamily = new Map<string, ServiceDisplayItem[]>();
    for (const match of confirmedServices) {
      const service = match.services;
      if (!service?.name) continue;
      const family = service.service_families?.name || "Weitere Leistungen";
      const current = groupsByFamily.get(family) || [];
      if (!current.some((item) => item.label === service.name)) {
        current.push({ label: service.name, slug: service.slug });
      }
      groupsByFamily.set(family, current);
    }

    const groups = Array.from(groupsByFamily.entries()).map(([label, items]) => ({ label, items }));
    return {
      groups,
      totalCount: groups.reduce((count, group) => count + group.items.length, 0),
      sourceLabel: "Bestätigte, strukturierte Leistungen des öffentlichen Profils.",
    };
  }

  const selectedServices = Array.isArray(company.selected_services)
    ? company.selected_services.map((item) => String(item).trim()).filter(Boolean)
    : [];
  if (selectedServices.length) {
    const services = Array.from(new Set(selectedServices));
    return {
      groups: serviceDisplayGroupsFromNames(services),
      totalCount: services.length,
      sourceLabel: "Freigegebene Leistungen aus dem genehmigten Betriebseintrag.",
    };
  }

  const descriptionServices = extractServiceListFromDescription(company.description);
  if (descriptionServices.length) {
    const services = Array.from(new Set(descriptionServices));
    return {
      groups: serviceDisplayGroupsFromNames(services),
      totalCount: services.length,
      sourceLabel: "Aus dem freigegebenen Profiltext erkennbare Leistungen.",
    };
  }

  return { groups: [], totalCount: 0, sourceLabel: "" };
}

function getServiceAreaItems(company: PublicCompanyWithTrade) {
  const regions = Array.isArray(company.service_regions) ? company.service_regions : [];
  const postalCodes = Array.isArray(company.service_postal_codes) ? company.service_postal_codes : [];
  const countries = Array.isArray(company.service_countries) ? company.service_countries : [];

  return [...regions, ...postalCodes, ...countries]
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 12);
}

function getSpecializationItems(company: PublicCompanyWithTrade) {
  return (Array.isArray(company.specializations) ? company.specializations : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 12);
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

function hasPremiumTrustContent(profile: NonNullable<PublicCompanyWithTrade["premium_profile"]>) {
  return Boolean(profile.references.length || profile.certificates.length || profile.notes);
}

function hasContactPersonContent(
  company: PublicCompanyWithTrade,
  premiumContacts: NonNullable<PublicCompanyWithTrade["premium_profile"]>["contacts"],
) {
  return Boolean(
    premiumContacts.length ||
      company.contact_person_name ||
      company.contact_name ||
      company.contact_person_phone ||
      company.contact_person_email ||
      company.profile_image_url,
  );
}

function emptyPremiumProfile(): NonNullable<PublicCompanyWithTrade["premium_profile"]> {
  return {
    contacts: [],
    teamMembers: [],
    references: [],
    referenceMedia: [],
    certificates: [],
    socialLinks: [],
    profileSections: [],
    notes: null,
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

function isLocalSignedMediaUrl(value?: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (url.hostname === "127.0.0.1" || url.hostname === "localhost") && url.pathname.includes("/storage/v1/object/");
  } catch {
    return false;
  }
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
            className="inline-flex min-h-9 items-center break-words text-[#1f5fd4] hover:underline"
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
