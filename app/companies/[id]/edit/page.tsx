import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/company-form";
import { Shell } from "@/components/shell";
import { updateCompany } from "@/lib/actions";
import { getCompany, getTrades } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCompanyPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const [company, trades] = await Promise.all([getCompany(id), getTrades()]);
    const action = updateCompany.bind(null, company.id);

    return (
      <Shell>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Firmenprofil</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{company.name}</h1>
        </div>
        <CompanyForm action={action} company={company} submitLabel="Aenderungen speichern" trades={trades} />
      </Shell>
    );
  } catch {
    notFound();
  }
}

