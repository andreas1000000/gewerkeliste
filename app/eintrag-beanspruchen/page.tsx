import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ClaimForm } from "@/components/claim-form";
import { SiteHeader } from "@/components/site-header";
import { getCompany, getCompanyBySlug } from "@/lib/data";

export const metadata: Metadata = {
  title: "Eintrag beanspruchen | GewerkeListe.com",
  description:
    "Übernehmen Sie einen bestehenden Betriebseintrag, bestätigen Sie Betriebsdaten und ergänzen Sie Leistungen und Tätigkeitsgebiet.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClaimEntryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const companyId = stringParam(params.companyId);
  const companySlug = stringParam(params.firma);
  const company = await getClaimCompany(companyId, companySlug);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Betriebseintrag verwalten</p>
          <h1 className="mt-3 text-4xl font-semibold text-[#07173d]">Eintrag beanspruchen</h1>
          {company ? (
            <>
              <p className="mt-5 text-base leading-7 text-ink">
                Sie beanspruchen den bestehenden Betriebseintrag für{" "}
                <span className="font-semibold">{company.name}</span>. Die Anfrage wird als Übernahme eines vorhandenen
                Eintrags gespeichert und anschließend geprüft.
              </p>
              <div className="mt-5 rounded-md border border-line bg-[#f7f8fb] p-4 text-sm leading-6 text-ink">
                <div className="font-semibold">{company.name}</div>
                <div className="text-muted">
                  {company.postal_code} {company.city}
                  {company.trades?.name ? ` · ${company.trades.name}` : ""}
                </div>
                <Link className="mt-2 inline-flex font-semibold text-[#1f5fd4] hover:underline" href={`/firma/${company.slug}` as Route}>
                  Firmenprofil ansehen
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-5 text-base leading-7 text-ink">
              Wenn Ihr Betrieb bereits auf GewerkeListe.com gelistet ist, suchen Sie den Eintrag über die öffentliche
              Suche. Auf der Firmenprofilseite können Sie die Übernahme des Betriebseintrags anfragen.
            </p>
          )}
          <div className="mt-6 rounded-md border border-[#bde7cc] bg-[#f1fbf5] p-4 text-sm leading-6 text-[#24523a]">
            In der Gründungsphase können die ersten 500 Fachbetriebe ihren Eintrag ohne Verifizierungsgebühr übernehmen
            und Betriebsdaten bestätigen.
          </div>
        </div>

        <div className="mt-6">
          {company ? (
            <ClaimForm companyId={company.id} />
          ) : (
            <div className="grid gap-3 rounded-lg border border-line bg-white p-6 shadow-soft sm:grid-cols-2">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1f5fd4] px-5 text-sm font-semibold text-white hover:bg-[#174eb2]"
                href={"/suche" as Route}
              >
                Fachbetrieb suchen
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-[#1f5fd4] hover:border-[#1f5fd4]"
                href={"/betrieb-eintragen" as Route}
              >
                Betrieb eintragen
              </Link>
            </div>
          )}
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
