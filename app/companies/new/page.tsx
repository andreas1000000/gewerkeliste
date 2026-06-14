import { CompanyForm } from "@/components/company-form";
import { Shell } from "@/components/shell";
import { createCompany } from "@/lib/actions";
import { getTrades } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  const trades = await getTrades();

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-brand">Firmenprofil</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Neue Firma anlegen</h1>
      </div>
      <CompanyForm action={createCompany} submitLabel="Firma speichern" trades={trades} />
    </Shell>
  );
}

