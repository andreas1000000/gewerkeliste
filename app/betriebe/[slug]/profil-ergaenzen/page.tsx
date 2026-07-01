import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ClaimAssistant } from "@/components/claim-assistant";
import { SiteHeader } from "@/components/site-header";
import { cleanCompanyDescription, extractServiceListFromDescription } from "@/lib/company-display";
import { getLatestCompanyProfileUpdateSubmission } from "@/lib/data";
import { canonicalPublicCompanySlug, canonicalPublicCompanySlugFromSlug, getCompanyBySlug } from "@/lib/data/public-directory";
import type { CompanyWithTrade } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getProfileCompany(slug);

  if (!company) {
    return { title: "Profil ergänzen | GewerkeListe.com" };
  }

  return {
    title: `${company.name} Profil ergänzen | GewerkeListe.com`,
    description: `Profilergänzung für ${company.name}: Leistungen, Kontaktangaben und Profildaten zur Prüfung einreichen.`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function CompanyProfileUpdatePage({ params }: PageProps) {
  const { slug } = await params;
  const canonicalRequestedSlug = canonicalPublicCompanySlugFromSlug(slug);
  if (canonicalRequestedSlug !== slug) {
    permanentRedirect(`/betriebe/${canonicalRequestedSlug}/profil-ergaenzen`);
  }

  const company = await getProfileCompany(slug);
  if (!company) notFound();
  const canonicalSlug = canonicalPublicCompanySlug(company);
  if (canonicalSlug !== slug) {
    permanentRedirect(`/betriebe/${canonicalSlug}/profil-ergaenzen`);
  }

  const latestSubmission = await getLatestCompanyProfileUpdateSubmission(company.id);
  const initialTrades = getInitialTrades(company, latestSubmission);
  const initialServices = latestSubmission?.selected_services.length ? latestSubmission.selected_services : extractServiceListFromDescription(company.description);
  const initialDescription =
    latestSubmission?.short_description || cleanCompanyDescription(company.description) || company.description || "";
  const formCompany: CompanyWithTrade = { ...company, description: initialDescription, company_trades: undefined };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link className="hover:text-ink" href={`/firma/${company.slug}` as Route}>
            {company.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-ink">Profil ergänzen</span>
        </nav>

        <section className="mt-6 rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Profilpflege</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[#07173d]">Profil ergänzen</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink">
            Ergänzen oder korrigieren Sie das Profil von <span className="font-semibold">{company.name}</span>.
            Die Angaben werden geprüft, bevor sie öffentlich sichtbar werden.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Benefit>Leistungen ergänzen</Benefit>
            <Benefit>Kontaktwege aktualisieren</Benefit>
            <Benefit>Profiltext verbessern</Benefit>
          </div>
          <p className="mt-5 rounded-md border border-[#bde7cc] bg-[#f1fbf5] px-4 py-3 text-sm leading-6 text-[#24523a]">
            Der kostenlose Basiseintrag bleibt erhalten. Profilergänzungen werden als Prüfungsvorschlag gespeichert.
          </p>
          <p className="mt-3 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-xs leading-5 text-muted">
            Bereits eingereichte Profilergänzungen werden hier wieder aufgegriffen. Neue Änderungen werden erneut geprüft;
            es erfolgt keine automatische Veröffentlichung.
          </p>
        </section>

        <div className="mt-6">
          <ClaimAssistant
            company={formCompany}
            initialDescription={initialDescription}
            initialServices={initialServices}
            initialSubmission={latestSubmission}
            initialTrades={initialTrades}
            intent="update"
          />
        </div>
      </div>
    </main>
  );
}

async function getProfileCompany(slug: string) {
  try {
    return await getCompanyBySlug(slug);
  } catch {
    return null;
  }
}

function Benefit({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-ink">{children}</div>;
}

function getInitialTrades(
  company: Awaited<ReturnType<typeof getProfileCompany>>,
  latestSubmission: Awaited<ReturnType<typeof getLatestCompanyProfileUpdateSubmission>>,
) {
  if (!company) return [];

  const confirmedCompanyTrades = (company.company_trades || [])
    .filter((match) => match.status !== "rejected" && match.visibility_level !== "internal" && Boolean(match.trades?.slug))
    .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
    .map((match) => match.trades?.slug);

  return [
    latestSubmission?.primary_trade,
    ...(latestSubmission?.secondary_trades || []),
    company.trades?.slug,
    ...confirmedCompanyTrades,
  ].filter(uniqueString);
}

function uniqueString(value: string | null | undefined, index: number, values: Array<string | null | undefined>): value is string {
  return Boolean(value) && values.indexOf(value) === index;
}
