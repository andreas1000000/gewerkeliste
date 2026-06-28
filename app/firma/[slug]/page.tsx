import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { publicResultDescription } from "@/lib/company-display";
import { getCompanyBySlug, getCompanyBySlugForMetadata } from "@/lib/data/public-directory";
import { breadcrumbJsonLd, jsonLd, localBusinessJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import type { PublicCompanyWithTrade, PublicClaimStatus } from "@/lib/types/public-directory";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ProfileStatus = {
  label: string;
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
  return {
    title: `${company.name} – ${trade} in ${company.city} | GewerkeListe.com`,
    description: `Informationen zu ${company.name} in ${company.city}: Gewerke, Leistungen, Kontakt und Unternehmensprofil auf GewerkeListe.com.`,
    alternates: {
      canonical: `/firma/${slug}`,
    },
    openGraph: {
      title: `${company.name} | ${trade} in ${company.city}`,
      description: `Unternehmensprofil von ${company.name} auf GewerkeListe.com.`,
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
    const location = `${company.postal_code} ${company.city}`;
    const visibleDescription = publicResultDescription(company.description);
    const profileDescription = getProfileDescription(company, trade, location, visibleDescription);
    const executedTrades = getExecutedTrades(company);
    const recognizableServices = getRecognizableServices(company, executedTrades);
    const sourceItems = getSourceItems(company, websiteHref);
    const hasCoordinates =
      Number.isFinite(company.latitude) &&
      Number.isFinite(company.longitude) &&
      !(company.latitude === 0 && company.longitude === 0);
    const hasDirectContact = Boolean(company.email || company.phone || websiteHref);
    const missingProfileItems = getMissingProfileItems(company, visibleDescription, hasCoordinates);
    const breadcrumb = breadcrumbJsonLd([
      { name: "Startseite", path: "/" },
      { name: "Betriebe", path: "/betriebe" },
      { name: trade, path: `/gewerke/${company.trades?.slug || ""}` },
      { name: company.city, path: `/gewerke/${company.trades?.slug || ""}/${locationSlug(company.city)}` },
      { name: company.name, path: `/firma/${company.slug}` },
    ]);
    const localBusiness = localBusinessJsonLd(company, `/firma/${company.slug}`);

    return (
      <main className="min-h-screen bg-[#f7f8fb] text-ink">
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

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
              <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
                <div className="flex aspect-square items-center justify-center rounded-lg border border-line bg-[#fbfaf7] p-5">
                  {company.logo_url ? (
                    <img alt={`Logo von ${company.name}`} className="h-full w-full rounded-md object-contain" src={company.logo_url} />
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

                  <p className="mt-6 max-w-3xl text-base leading-7 text-ink">{profileDescription}</p>

                  <div className={`mt-6 rounded-md border px-4 py-4 text-sm leading-6 ${statusBoxClass(status.tone)}`}>
                    <div className="font-semibold text-ink">{status.label}</div>
                    <p className="mt-1">{status.note}</p>
                    {!company.verified ? (
                      <p className="mt-2">
                        Korrekturen oder Löschung können jederzeit angefragt werden.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Fact label="Gewerk" value={trade} />
                    <Fact label="Standort" value={location} />
                    <Fact label="Status" value={status.label} />
                  </div>

                  {hasDirectContact ? (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {company.email ? (
                        <ContactButton kind="primary" href={`mailto:${company.email}`}>
                          E-Mail senden
                        </ContactButton>
                      ) : null}
                      {company.phone ? <ContactButton href={`tel:${company.phone}`}>Anrufen</ContactButton> : null}
                      {websiteHref ? (
                        <ContactButton href={websiteHref} external>
                          Website besuchen
                        </ContactButton>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-sm leading-6 text-muted">
                      Für diesen Betrieb sind noch keine öffentlichen Kontaktdaten hinterlegt.
                      {canClaim ? (
                        <Link className="ml-1 font-semibold text-action hover:underline" href={`/betriebe/${company.slug}/claim` as Route}>
                          Daten ergänzen oder Eintrag übernehmen
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="grid gap-5">
              <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Kontakt</h2>
                <dl className="mt-5 grid gap-4">
                  <DataRow label="Standort" value={location} />
                  {websiteHref ? <DataRow label="Website" value={company.website_url || websiteHref} href={websiteHref} external /> : null}
                  {company.phone ? <DataRow label="Telefon" value={company.phone} href={`tel:${company.phone}`} /> : null}
                  {company.email ? <DataRow label="E-Mail" value={company.email} href={`mailto:${company.email}`} /> : null}
                  <DataRow label="Eintragsstatus" value={claimStatusLabel(company.claim_status)} />
                  <DataRow label="Verifizierung" value={company.verified ? "Daten vom Betrieb bestätigt" : "Daten noch nicht verifiziert"} />
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
                    ? "Daten vom Betrieb bestätigt. Keine Qualitäts- oder Empfehlungsgarantie."
                    : "Aus öffentlich erkennbaren oder redaktionell erfassten Signalen abgeleitet – noch nicht vom Betrieb bestätigt."}
                </p>
              </section>

              <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Einsatzgebiet</h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {hasCoordinates
                    ? `${location}. Einsatzradius wird angezeigt, sobald er vom Betrieb bestätigt wurde.`
                    : "Noch kein Einsatzgebiet hinterlegt. Der Wirkungskreis kann nach Übernahme des Eintrags ergänzt werden."}
                </p>
              </section>

              {missingProfileItems.length ? (
                <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                  <h2 className="text-lg font-semibold text-ink">Dieses Profil ist noch unvollständig.</h2>
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted">
                    {missingProfileItems.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true">–</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {canClaim ? (
                    <Link
                      className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
                      href={`/betriebe/${company.slug}/claim` as Route}
                    >
                      Daten ergänzen oder Eintrag übernehmen
                    </Link>
                  ) : null}
                </section>
              ) : null}

              {company.contact_person_name || company.contact_person_role || company.profile_image_url ? (
                <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Ansprechpartner</h2>
                <div className="mt-4 flex gap-4">
                  {company.profile_image_url ? (
                    <img
                      alt={company.profile_image_alt || `Ansprechpartner von ${company.name}`}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                      src={company.profile_image_url}
                    />
                  ) : company.contact_person_name ? (
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-line bg-[#eef4fb] text-xl font-semibold text-brand">
                      {company.contact_person_name.slice(0, 1).toUpperCase()}
                    </div>
                  ) : null}
                  <div>
                    <div className="font-semibold text-ink">
                      {company.contact_person_name || "Ansprechpartner im Betrieb"}
                    </div>
                    {company.contact_person_role ? <div className="mt-1 text-sm text-muted">{company.contact_person_role}</div> : null}
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Ansprechpartner werden nur angezeigt, wenn entsprechende Angaben im Profil hinterlegt sind.
                    </p>
                    {canClaim ? (
                      <Link
                        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
                        href={`/betriebe/${company.slug}/claim` as Route}
                      >
                        Ansprechpartner ergänzen
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
              ) : null}

              {canClaim ? (
                <section className="rounded-lg border border-[#b9dec8] bg-[#f1fbf5] p-5 shadow-soft">
                  <h2 className="text-xl font-semibold text-[#07173d]">Sind Sie Inhaber oder berechtigt, diesen Betrieb zu vertreten?</h2>
                  <p className="mt-3 text-sm leading-6 text-[#24523a]">
                    Übernehmen Sie den Eintrag und ergänzen Sie Leistungen, Kontaktangaben und Einsatzgebiet. Der kostenlose Basiseintrag bleibt erhalten.
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
            <h2 className="text-lg font-semibold text-ink">Auf öffentlicher Firmenquelle erkennbare Leistungen</h2>
            {recognizableServices.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recognizableServices.map((item) => (
                  <CheckFact key={item} value={item} />
                ))}
              </div>
            ) : (
              <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
                Für diesen Betrieb sind noch keine konkreten Leistungen strukturiert hinterlegt. Die Zuordnung kann aus
                der Firmenwebsite ergänzt oder vom Betrieb nach Profilübernahme gepflegt werden.
              </p>
            )}
            <p className="mt-4 max-w-4xl text-xs leading-5 text-muted">
              Diese Angaben beschreiben erkennbare Leistungsbereiche. Sie sind keine Aussage über Qualität,
              Verfügbarkeit oder Empfehlung.
            </p>
          </section>

          <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Datenquellen</h2>
            {sourceItems.length ? (
              <ul className="mt-4 grid gap-3">
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
                    <p className="mt-1 text-xs leading-5 text-muted">Öffentlich zugängliche Unternehmensquelle.</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
                Für diesen Eintrag ist aktuell keine öffentliche Quelle hinterlegt. Der Eintrag sollte geprüft oder vom
                Betrieb übernommen werden.
              </p>
            )}
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Über den Betrieb</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-ink">{profileDescription}</p>
              {!visibleDescription ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                  Eine ausführlichere Beschreibung kann vom Betrieb nach Profilübernahme ergänzt werden.
                </p>
              ) : null}
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
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}

function getProfileStatus(company: PublicCompanyWithTrade): ProfileStatus {
  if (company.verified) {
    return {
      label: "Daten vom Betrieb bestätigt",
      note: "Die Bestätigung bezieht sich auf die Profildaten. Sie ist keine Qualitäts-, Verfügbarkeits- oder Empfehlungsgarantie.",
      tone: "verified",
    };
  }

  if (company.claim_status === "claimed" || company.claim_status === "pending") {
    return {
      label: company.claim_status === "pending" ? "Übernahme angefragt" : "Profil übernommen",
      note:
        company.claim_status === "pending"
          ? "Der Betriebseintrag wurde zur Übernahme angefragt. Die Prüfung ist noch nicht abgeschlossen."
          : "Der Betrieb hat das Profil übernommen. Die Datenverifizierung ist noch ausstehend.",
      tone: "claimed",
    };
  }

  return {
    label: "Basisprofil – noch nicht vom Betrieb bestätigt",
    note: "Dieser Eintrag basiert auf öffentlich verfügbaren oder redaktionell erfassten Informationen. Der Betrieb hat die Angaben noch nicht bestätigt.",
    tone: "unverified",
  };
}

function StatusPill({ status }: { status: ProfileStatus }) {
  return (
    <div
      className={`rounded-md border px-4 py-3 text-sm font-semibold ${statusPillClass(status.tone)}`}
      title={status.tone === "verified" ? "Die Profildaten wurden vom Betrieb bestätigt." : undefined}
    >
      <div>{status.label}</div>
      <p className="mt-1 text-xs font-medium">{status.note}</p>
    </div>
  );
}

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

function getExecutedTrades(company: PublicCompanyWithTrade) {
  const tradeNames = [
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

  return [...new Set(tradeNames)].slice(0, 10);
}

function getProfileDescription(company: PublicCompanyWithTrade, trade: string, location: string, visibleDescription: string) {
  if (visibleDescription) return visibleDescription;
  return `${company.name} ist als Betrieb im Bereich ${trade} in ${location} gelistet. Der Eintrag basiert auf öffentlich zugänglichen Unternehmensinformationen und ist noch nicht vom Betrieb bestätigt.`;
}

function getRecognizableServices(company: PublicCompanyWithTrade, executedTrades: string[]) {
  const evidenceItems = (company.company_trades || [])
    .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal")
    .flatMap((match) => splitEvidence(match.evidence))
    .filter(Boolean);

  return [...new Set([...evidenceItems, ...executedTrades])].slice(0, 12);
}

function splitEvidence(value: string | null) {
  if (!value) return [];
  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && item.length <= 80)
    .slice(0, 6);
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

function getMissingProfileItems(company: PublicCompanyWithTrade, description: string, hasCoordinates: boolean) {
  const items: string[] = [];
  if (!company.email && !company.phone && !company.website_url) items.push("Kontaktdaten fehlen");
  if (!description) items.push("Leistungsbeschreibung fehlt");
  if (!hasCoordinates) items.push("Einsatzgebiet fehlt");
  items.push("Referenzen fehlen");
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
