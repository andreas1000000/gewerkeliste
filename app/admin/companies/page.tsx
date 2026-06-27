import Link from "next/link";
import { CompanyFilters } from "@/components/company-filters";
import { CompanyTable } from "@/components/company-table";
import { Shell } from "@/components/shell";
import { getCompanies, getTrades } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [trades, companies] = await Promise.all([
    getTrades(),
    getCompanies({
      query: stringParam(params.q),
      tradeId: stringParam(params.trade),
      claimStatus: stringParam(params.claim),
      verified: stringParam(params.verified),
    }),
  ]);

  const verifiedCount = companies.filter((company) => company.verified).length;
  const pendingClaims = companies.filter((company) => company.claim_status === "pending").length;
  const cities = new Set(companies.map((company) => company.city)).size;
  const publicCount = companies.filter((company) => company.public_visible).length;
  const hiddenCount = companies.length - publicCount;

  return (
    <Shell>
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Betriebseinträge</h1>
        </div>
        <Link className="w-fit rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#265a4d]" href="/companies/new">
          Betriebseintrag anlegen
        </Link>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric label="Betriebe" value={companies.length} />
        <Metric label="Öffentlich" value={publicCount} />
        <Metric label="Ausgeblendet" value={hiddenCount} />
        <Metric label="Offene Übernahmen" value={pendingClaims} />
      </section>

      <div className="mb-5">
        <CompanyFilters trades={trades} searchParams={params} />
      </div>

      <div className="mb-3 text-sm font-medium text-muted">
        {verifiedCount} verifiziert · {trades.length} Gewerke · {cities} Orte
      </div>
      <CompanyTable companies={companies} />
    </Shell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="text-sm font-medium text-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
