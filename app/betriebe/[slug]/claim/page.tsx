import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ClaimAssistant } from "@/components/claim-assistant";
import { SiteHeader } from "@/components/site-header";
import { canonicalPublicCompanySlug, canonicalPublicCompanySlugFromSlug, getCompanyBySlug } from "@/lib/data/public-directory";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getClaimCompany(slug);

  if (!company) {
    return { title: "Profil übernehmen | GewerkeListe.com" };
  }

  return {
    title: `${company.name} kostenlos übernehmen | GewerkeListe.com`,
    description: `Kostenloses Basisprofil von ${company.name} übernehmen, Daten korrigieren und Leistungen zur Prüfung einreichen.`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function CompanyClaimWizardPage({ params }: PageProps) {
  const { slug } = await params;
  const canonicalRequestedSlug = canonicalPublicCompanySlugFromSlug(slug);
  if (canonicalRequestedSlug !== slug) {
    permanentRedirect(`/betriebe/${canonicalRequestedSlug}/claim`);
  }

  const company = await getClaimCompany(slug);
  if (!company) notFound();
  const canonicalSlug = canonicalPublicCompanySlug(company);
  if (canonicalSlug !== slug) {
    permanentRedirect(`/betriebe/${canonicalSlug}/claim`);
  }

  const initialTrades = getInitialTrades(company);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link className="hover:text-ink" href={"/suche" as Route}>
            Suche
          </Link>
          <span aria-hidden="true">/</span>
          <Link className="hover:text-ink" href={`/firma/${company.slug}` as Route}>
            {company.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-ink">Profil übernehmen</span>
        </nav>

        <section className="mt-6 rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Kostenloses Basisprofil sichern</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[#07173d]">Profil kostenlos übernehmen</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink">
            Übernehmen Sie den bestehenden Betriebseintrag für <span className="font-semibold">{company.name}</span>,
            korrigieren Sie Angaben und ergänzen Sie Gewerke, Leistungen und Kontaktinformationen zur Prüfung.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Benefit>Kontaktdaten korrigieren</Benefit>
            <Benefit>Leistungen sichtbar machen</Benefit>
            <Benefit>Datenbestätigung nachvollziehbar machen</Benefit>
          </div>
          <p className="mt-5 rounded-md border border-[#bde7cc] bg-[#f1fbf5] px-4 py-3 text-sm leading-6 text-[#24523a]">
            Die Übernahme des Basisprofils ist kostenlos. Änderungen werden geprüft, bevor sie veröffentlicht werden.
            Freiwillige Förderbeiträge haben keinen Einfluss auf Prüfung, Darstellung oder Verifizierung.
          </p>
          <p className="mt-3 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-xs leading-5 text-muted">
            Eine Profilübernahme bestätigt Profildaten. Sie ist keine Empfehlung, keine Qualitätsgarantie und keine
            Bewertung der ausgeführten Arbeiten.
          </p>
        </section>

        <div className="mt-6">
          <ClaimAssistant company={company} initialTrades={initialTrades} />
        </div>
      </div>
    </main>
  );
}

async function getClaimCompany(slug: string) {
  try {
    return await getCompanyBySlug(slug);
  } catch {
    return null;
  }
}

function getInitialTrades(company: Awaited<ReturnType<typeof getClaimCompany>>) {
  if (!company) return [];

  const confirmedCompanyTrades = (company.company_trades || [])
    .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal" && Boolean(match.trades?.slug))
    .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
    .map((match) => match.trades?.slug);

  return [company.trades?.slug, ...confirmedCompanyTrades].filter(uniqueString);
}

function uniqueString(value: string | null | undefined, index: number, values: Array<string | null | undefined>): value is string {
  return Boolean(value) && values.indexOf(value) === index;
}

function Benefit({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-ink">{children}</div>;
}
