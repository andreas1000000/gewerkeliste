import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCompany, getCompanyBySlug } from "@/lib/data";

export const metadata: Metadata = {
  title: "Eintrag übernehmen | GewerkeListe.com",
  description: "Bestehenden Betriebseintrag finden und kostenloses Basisprofil zur Prüfung einreichen.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyClaimEntryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const companyId = stringParam(params.companyId);
  const companySlug = stringParam(params.firma);
  const company = await getClaimCompany(companyId, companySlug);

  if (company) {
    redirect(`/betriebe/${company.slug}/claim`);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Profil übernehmen</p>
          <h1 className="mt-3 text-4xl font-semibold text-[#07173d]">Betriebseintrag finden</h1>
          <p className="mt-5 text-base leading-7 text-ink">
            Suchen Sie zuerst Ihren bestehenden Betriebseintrag. Auf der Profilseite können Sie das kostenlose
            Basisprofil übernehmen und Korrekturen zur Prüfung einreichen.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
              href={"/suche" as Route}
            >
              Betrieb suchen
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
              href={"/betrieb-eintragen" as Route}
            >
              Betrieb neu eintragen
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

async function getClaimCompany(companyId?: string, companySlug?: string) {
  try {
    if (companyId) {
      const company = await getCompany(companyId);
      return company.public_visible ? company : null;
    }
    if (companySlug) return await getCompanyBySlug(companySlug);
  } catch {
    return null;
  }

  return null;
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
