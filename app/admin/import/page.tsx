import { ImportForm } from "@/components/import-form";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  return (
    <Shell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-brand">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">CSV-Import</h1>
      </div>
      <ImportForm />
    </Shell>
  );
}

