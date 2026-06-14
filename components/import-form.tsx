"use client";

import { useActionState } from "react";
import { importCompanies } from "@/lib/actions";
import type { ImportReport } from "@/lib/types";

const initialState: ImportReport = {
  ok: false,
  message: "",
  created: 0,
  skipped: 0,
  errors: [],
};

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importCompanies, initialState);

  return (
    <div className="grid gap-5">
      <form action={formAction} className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <label className="grid gap-2 text-sm font-medium text-ink">
          CSV-Datei
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            className="rounded-md border border-line bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            required
          />
        </label>
        <button disabled={pending} className="mt-5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Importiere..." : "Import starten"}
        </button>
      </form>

      {state.message ? (
        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Erstellt" value={state.created} />
            <Metric label="Uebersprungen" value={state.skipped} />
            <Metric label="Fehler" value={state.errors.length} />
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">{state.message}</p>
          {state.errors.length > 0 ? (
            <ul className="mt-4 grid gap-2 text-sm text-[#8e2f1f]">
              {state.errors.map((error) => (
                <li key={error} className="rounded-md border border-[#da9a8a] bg-[#fff0ed] px-3 py-2">
                  {error}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-panel px-4 py-3">
      <div className="text-xs font-semibold uppercase text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

