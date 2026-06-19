import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { publicResultDescription } from "@/lib/company-display";
import { getCompanyBySlug, getCompanyBySlugForMetadata } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";
import type { ClaimStatus, CompanyWithTrade } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ProfileStatus = {
  label: string;
  note: string;
  tone: "verified" | "claimed" | "unverified";
};

type PublicCompanyProfile = CompanyWithTrade & {
  logo_url?: string | null;
  profile_image_url?: string | null;
  profile_image_alt?: string | null;
  contact_person_name?: string | null;
  contact_person_role?: string | null;
  company_trades?: Array<{
    confidence_score: number | null;
    source?: string | null;
    evidence?: string | null;
    trades: { id: string; name: string; slug: string } | null;
  }> | null;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlugForMetadata(slug);

  if (!company) {
    return { title: "Firma nicht gefunden" };
  }

  const trade = company.trades?.name || "Handwerk";
  return {
    title: `${company.name} – ${trade} in ${company.city} | GewerkeListe.com`,
    description: `${company.name}: ${trade}, Leistungen und Tätigkeitsgebiet in ${company.city} und Umgebung. Kontakt und Verifizierungsstatus auf GewerkeListe.com.`,
    alternates: {
      canonical: `/firma/${slug}`,
    },
  };
}

export default async function CompanyPublicPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const company = await getCompanyBySlug(slug);
    const publicCompany = company as PublicCompanyProfile;
    const trade = company.trades?.name || "Gewerk";
    const status = getProfileStatus(company);
    const canClaim = company.claim_status === "unclaimed" || company.claim_status === "rejected";
    const websiteHref = normalizeWebsiteUrl(company.website_url);
    const location = `${company.postal_code} ${company.city}`;
    const visibleDescription = publicResultDescription(company.description);
    const executedTrades = getExecutedTrades(publicCompany);
    const hasCoordinates =
      Number.isFinite(company.latitude) &&
      Number.isFinite(company.longitude) &&
      !(company.latitude === 0 && company.longitude === 0);

    return (
      <main className="min-h-screen bg-[#f7f8fb] text-ink">
        <SiteHeader />

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link className="hover:text-ink" href={"/suche" as Route}>
              Start
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

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
              <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
                <div className="flex aspect-square items-center justify-center rounded-lg border border-line bg-[#fbfaf7] p-5">
                  {publicCompany.logo_url ? (
                    <img alt={`${company.name} Firmenlogo`} className="h-full w-full rounded-md object-contain" src={publicCompany.logo_url} />
                  ) : (
                    <div className="grid h-full w-full place-items-center rounded-md border border-line bg-white text-center">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-md bg-brand text-2xl font-semibold text-white">
                        {company.name.slice(0, 1).toUpperCase()}
                      </div>
                      <p className="mt-4 text-sm font-semibold leading-5 text-ink">{company.name}</p>
                      <p className="mt-1 text-xs text-muted">Fachbetriebseintrag</p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h1 className="text-3xl font-semibold tracking-normal text-ink sm:text-4xl">{company.name}</h1>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
                        <span>{trade}</span>
                        <span aria-hidden="true">·</span>
                        <span>{location}</span>
                      </div>
                    </div>
                    <StatusPill status={status} />
                  </div>

                  {visibleDescription ? <p className="mt-6 max-w-3xl text-base leading-7 text-ink">{visibleDescription}</p> : null}

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Fact label="Gewerk" value={trade} />
                    <Fact label="Standort" value={location} />
                    <Fact label="Status" value={status.label} />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <ContactButton kind="primary" href={company.email ? `mailto:${company.email}` : undefined}>
                      Kontakt anfragen
                    </ContactButton>
                    <ContactButton href={company.phone ? `tel:${company.phone}` : undefined}>Anrufen</ContactButton>
                    <ContactButton href={websiteHref} external>
                      Website besuchen
                    </ContactButton>
                  </div>
                </div>
              </div>
            </section>

            <aside className="grid gap-5">
              <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Kontakt</h2>
                <dl className="mt-5 grid gap-4">
                  <DataRow label="Standort" value={location} />
                  <DataRow label="Website" value={company.website_url || ""} href={websiteHref} external />
                  <DataRow label="Telefon" value={company.phone || ""} href={company.phone ? `tel:${company.phone}` : undefined} />
                  <DataRow label="E-Mail" value={company.email || ""} href={company.email ? `mailto:${company.email}` : undefined} />
                  <DataRow label="Eintragsstatus" value={claimStatusLabel(company.claim_status)} />
                  <DataRow label="Verifizierung" value={company.verified ? "Betriebsdaten bestätigt" : "Nicht verifiziert"} />
                </dl>
              </section>

              <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Ausgeführte Gewerke</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {executedTrades.map((item) => (
                    <span key={item} className="rounded-md border border-line bg-[#fbfcff] px-3 py-1.5 text-sm font-semibold text-ink">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-muted">
                  {company.verified
                    ? "Vom Betrieb bestätigt."
                    : "Aus bestehendem Basisdatensatz übernommen – noch nicht vom Betrieb bestätigt."}
                </p>
              </section>

              <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Einsatzgebiet</h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {hasCoordinates
                    ? `${location}. Einsatzradius wird angezeigt, sobald er vom Betrieb bestätigt wurde.`
                    : "Noch kein Einsatzgebiet hinterlegt."}
                </p>
              </section>

              <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Ansprechpartner</h2>
                <div className="mt-4 flex gap-4">
                  {publicCompany.profile_image_url ? (
                    <img
                      alt={publicCompany.profile_image_alt || publicCompany.contact_person_name || "Ansprechpartner"}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                      src={publicCompany.profile_image_url}
                    />
                  ) : (
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-line bg-[#eef4fb] text-xl font-semibold text-brand">
                      {publicCompany.contact_person_name?.slice(0, 1).toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-ink">
                      {publicCompany.contact_person_name || "Hier könnte dein Ansprechpartner sichtbar sein."}
                    </div>
                    <div className="mt-1 text-sm text-muted">{publicCompany.contact_person_role || "Ansprechpartner im Betrieb"}</div>
                    <p className="mt-3 text-sm font-semibold text-brand">Menschen kaufen von Menschen.</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Auftraggeber möchten wissen, mit wem sie sprechen. Betriebe mit persönlichem Ansprechpartner wirken
                      vertrauenswürdiger.
                    </p>
                    {canClaim ? (
                      <Link
                        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
                        href={`/betriebe/${company.slug}/claim` as Route}
                      >
                        Profilbild ergänzen
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>

              {canClaim ? (
                <section className="rounded-lg border border-[#b9dec8] bg-[#f1fbf5] p-5 shadow-soft">
                  <h2 className="text-xl font-semibold text-[#07173d]">Ist das Ihr Betrieb?</h2>
                  <p className="mt-3 text-sm leading-6 text-[#24523a]">
                    Übernehmen Sie Ihr kostenloses Basisprofil, korrigieren Sie Ihre Angaben und zeigen Sie Auftraggebern
                    klar, welche Leistungen Sie anbieten.
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
                    Datenkorrektur melden
                  </a>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    Die Übernahme wird geprüft, bevor Änderungen veröffentlicht werden.
                  </p>
                </section>
              ) : null}
            </aside>
          </div>

          <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Ausgeführte Gewerke</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {executedTrades.map((item) => (
                <CheckFact key={item} value={item} />
              ))}
              <CheckFact value={`Standort ${company.city}`} />
              <CheckFact value={company.verified ? "Betriebsdaten bestätigt" : "Betriebsdaten nicht bestätigt"} />
            </div>
          </section>

          <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Korrektur oder Löschung</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
              Dieser öffentliche Basis-Eintrag enthält gewerbliche Kontaktdaten zum Betrieb. Wenn Angaben korrigiert
              werden sollen oder der Betriebseintrag nicht öffentlich angezeigt werden soll, genügt eine Nachricht an{" "}
              <a className="font-semibold text-[#1f5fd4] hover:underline" href={`mailto:${siteConfig.publicContactEmail}`}>
                {siteConfig.publicContactEmail}
              </a>
              . Korrektur- und Löschanfragen werden geprüft und zeitnah bearbeitet.
            </p>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Über den Betrieb</h2>
              {visibleDescription ? (
                <p className="mt-4 max-w-3xl text-base leading-7 text-ink">{visibleDescription}</p>
              ) : (
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
                  Für diesen Betrieb ist noch keine bestätigte Kurzbeschreibung hinterlegt.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Tätigkeitsgebiet</h2>
              <div className="mt-4 rounded-md border border-line bg-[#eef4fb] p-5">
                <div className="relative h-48 overflow-hidden rounded-md bg-white">
                  <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1f5fd4]/30 bg-[#1f5fd4]/10" />
                  <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1f5fd4]" />
                  <div className="absolute bottom-4 left-4 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-[#07173d]">
                    {location}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                Kartenplatzhalter ohne externe Karten-API. Einsatzgebiet und Radius werden angezeigt, sobald sie im
                Betriebseintrag hinterlegt sind.
              </p>
            </section>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Referenzen</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Referenzen werden nur angezeigt, wenn sie vom Betrieb bereitgestellt und im Betriebseintrag hinterlegt
                sind.
              </p>
            </section>

            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">{canClaim ? "Ist das Ihr Betrieb?" : "Eintrag verwalten"}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                {canClaim
                  ? "Sichern Sie das kostenlose Basisprofil und reichen Sie Korrekturen zur Prüfung ein."
                  : "Dieser Betriebseintrag ist bereits übernommen oder befindet sich in Prüfung."}
              </p>
              {canClaim ? (
                <Link
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
                  href={`/betriebe/${company.slug}/claim` as Route}
                >
                  Profil kostenlos übernehmen
                </Link>
              ) : null}
            </section>
          </div>

          <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">Förderprofil</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">Zusätzliche Möglichkeiten für Fördermitglieder</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Der Basiseintrag bleibt kostenlos. Fördermitglieder können das Projekt freiwillig unterstützen und ihr
              Profil schrittweise ausführlicher darstellen.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plannedProfileExtensions.map((item) => (
                <div key={item} className="rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-ink">
                  <span className="mr-2 text-brand" aria-hidden="true">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}

function getProfileStatus(company: CompanyWithTrade): ProfileStatus {
  if (company.verified) {
    return {
      label: "Betriebsdaten bestätigt",
      note: "Betriebsdaten bestätigt. Es wird dadurch keine Aussage über Qualität, Zuverlässigkeit oder Ausführung garantiert.",
      tone: "verified",
    };
  }

  if (company.claim_status === "claimed" || company.claim_status === "pending") {
    return {
      label: company.claim_status === "pending" ? "Übernahme angefragt" : "Eintrag übernommen",
      note:
        company.claim_status === "pending"
          ? "Der Betriebseintrag wurde zur Übernahme angefragt. Die Prüfung ist noch nicht abgeschlossen."
          : "Die Betriebsdaten wurden vom Betrieb übernommen. Die Verifizierung ist noch ausstehend.",
      tone: "claimed",
    };
  }

  return {
    label: "Nicht verifiziert",
    note: "Dieser Betriebseintrag wurde noch nicht vom Betrieb bestätigt.",
    tone: "unverified",
  };
}

function StatusPill({ status }: { status: ProfileStatus }) {
  return (
    <div
      className={`rounded-md border px-4 py-3 text-sm font-semibold ${statusPillClass(status.tone)}`}
      title={status.tone === "verified" ? "Die Unternehmensdaten wurden geprüft und bestätigt." : undefined}
    >
      <div>{status.label}</div>
      <p className="mt-1 text-xs font-medium">{status.note}</p>
    </div>
  );
}

const plannedProfileExtensions = [
  "Referenzprojekte",
  "Projektgalerie",
  "Titelbild",
  "Mehrere Ansprechpartner",
  "Teamvorstellung",
  "Zertifikate und Nachweise",
  "Verfügbarkeitsanzeige",
  "Direkte Anfragefunktion",
  "Ausführlichere Leistungsdarstellung",
  "Persönliche Vorstellung",
  "Bilder und Referenzen",
  "Ausführlichere Unternehmensseite",
];

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfaf7] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

function CheckFact({ value }: { value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfaf7] px-4 py-3 text-sm font-semibold text-ink">
      <span className="mr-2 text-brand">✓</span>
      {value}
    </div>
  );
}

function getExecutedTrades(company: PublicCompanyProfile) {
  const tradeNames = [
    ...(company.company_trades || [])
      .filter((match) => (match.confidence_score || 0) >= 70)
      .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
      .map((match) => match.trades?.name),
    company.trades?.name,
  ].filter((name): name is string => Boolean(name));

  return [...new Set(tradeNames)].slice(0, 10);
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
    <div className="grid gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[118px_minmax(0,1fr)]">
      <dt className="text-sm font-semibold text-ink">{label}</dt>
      <dd className="min-w-0 text-sm leading-6 text-muted">
        {value ? (
          href ? (
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
          )
        ) : (
          "Nicht hinterlegt"
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
  href?: string;
  kind?: "primary" | "secondary";
  external?: boolean;
}) {
  const className =
    kind === "primary"
      ? "inline-flex min-h-12 items-center justify-center rounded-md bg-[#1f5fd4] px-4 text-sm font-semibold text-white hover:bg-[#174eb2]"
      : "inline-flex min-h-12 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-[#1f5fd4] hover:border-[#1f5fd4]";

  if (!href) {
    return <span className={`${className} cursor-not-allowed opacity-50`}>{children}</span>;
  }

  return (
    <a className={className} href={href} rel={external ? "noreferrer" : undefined} target={external ? "_blank" : undefined}>
      {children}
    </a>
  );
}

function claimStatusLabel(status: ClaimStatus) {
  const labels: Record<ClaimStatus, string> = {
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
