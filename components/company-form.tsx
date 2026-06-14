"use client";

import { useActionState } from "react";
import type { CompanyFormState, CompanyWithTrade, Trade } from "@/lib/types";

type Props = {
  trades: Trade[];
  company?: CompanyWithTrade;
  action: (state: CompanyFormState, formData: FormData) => Promise<CompanyFormState>;
  submitLabel: string;
};

const initialState: CompanyFormState = { ok: false, message: "" };

export function CompanyForm({ trades, company, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors || {};

  return (
    <form action={formAction} className="grid gap-6">
      {state.message ? (
        <div className="rounded-md border border-[#da9a8a] bg-[#fff0ed] px-4 py-3 text-sm font-medium text-[#8e2f1f]">
          {state.message}
        </div>
      ) : null}

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-ink">Betriebseintrag</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Firmenname" error={errors.name}>
            <input
              name="name"
              defaultValue={company?.name}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
              required
            />
          </Field>
          <Field label="Gewerk" error={errors.trade_id}>
            <select
              name="trade_id"
              defaultValue={company?.trade_id || ""}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
              required
            >
              <option value="" disabled>
                Gewerk waehlen
              </option>
              {trades.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  {trade.name}
                </option>
              ))}
            </select>
          </Field>
          <Field className="md:col-span-2" label="Beschreibung" error={errors.description}>
            <textarea
              name="description"
              defaultValue={company?.description}
              className="min-h-28 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
              required
            />
          </Field>
          <Field label="Ansprechpartner" error={errors.contact_name}>
            <input
              name="contact_name"
              defaultValue={company?.contact_name || ""}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            />
          </Field>
          <Field label="E-Mail" error={errors.email}>
            <input
              name="email"
              type="email"
              defaultValue={company?.email || ""}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            />
          </Field>
          <Field label="Telefon" error={errors.phone}>
            <input
              name="phone"
              defaultValue={company?.phone || ""}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            />
          </Field>
          <Field label="Website" error={errors.website_url}>
            <input
              name="website_url"
              type="url"
              defaultValue={company?.website_url || ""}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-ink">Ort und Geokoordinaten</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field className="lg:col-span-2" label="Strasse" error={errors.street}>
            <input
              name="street"
              defaultValue={company?.street || ""}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            />
          </Field>
          <Field label="Ort" error={errors.city}>
            <input
              name="city"
              defaultValue={company?.city}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
              required
            />
          </Field>
          <Field label="PLZ" error={errors.postal_code}>
            <input
              name="postal_code"
              inputMode="numeric"
              pattern="[0-9]{5}"
              defaultValue={company?.postal_code}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
              required
            />
          </Field>
          <Field label="Breitengrad" error={errors.latitude}>
            <input
              name="latitude"
              type="number"
              step="0.000001"
              defaultValue={company?.latitude}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
              required
            />
          </Field>
          <Field label="Laengengrad" error={errors.longitude}>
            <input
              name="longitude"
              type="number"
              step="0.000001"
              defaultValue={company?.longitude}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
              required
            />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-ink">Status</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Eintragsstatus" error={errors.claim_status}>
            <select
              name="claim_status"
              defaultValue={company?.claim_status || "unclaimed"}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            >
              <option value="unclaimed">Nicht beansprucht</option>
              <option value="pending">Übernahme angefragt</option>
              <option value="claimed">Eintrag übernommen</option>
              <option value="rejected">Abgelehnt</option>
            </select>
          </Field>
          <label className="flex items-center gap-3 rounded-md border border-line bg-panel px-4 py-3 text-sm font-semibold text-ink">
            <input name="verified" type="checkbox" defaultChecked={company?.verified || false} className="h-4 w-4 accent-brand" />
            Verifiziert
          </label>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          disabled={pending}
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#265a4d] disabled:opacity-60"
          type="submit"
        >
          {pending ? "Speichere..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-medium text-ink ${className}`}>
      {label}
      {children}
      {error ? <span className="text-xs font-semibold text-[#a4442b]">{error}</span> : null}
    </label>
  );
}
