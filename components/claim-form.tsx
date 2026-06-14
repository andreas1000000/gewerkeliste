"use client";

import { useState } from "react";
import { useActionState } from "react";
import { submitClaim } from "@/lib/actions";
import type { CompanyFormState } from "@/lib/types";

const initialState: CompanyFormState = { ok: false, message: "" };
const supportOptions = [
  { value: "none", label: "Ohne Beitrag abschließen" },
  { value: "49", label: "49 € beitragen" },
  { value: "99", label: "99 € beitragen" },
  { value: "199", label: "199 € beitragen" },
  { value: "custom", label: "Eigenen Betrag wählen" },
];

export function ClaimForm({ companyId }: { companyId: string }) {
  const [state, formAction, pending] = useActionState(submitClaim, initialState);
  const [supportContribution, setSupportContribution] = useState("none");
  const errors = state.fieldErrors || {};

  return (
    <form action={formAction} className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <input name="company_id" type="hidden" value={companyId} />
      <h2 className="text-lg font-semibold text-ink">Eintrag beanspruchen</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Wenn dieser Betrieb zu Ihnen gehört, können Sie die Übernahme des Betriebseintrags anfragen. Die Anfrage wird
        geprüft, bevor der Status geändert wird.
      </p>
      <div className="mt-5 grid gap-4">
        <Field label="Name" error={errors.name}>
          <input name="name" className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-brand" required />
        </Field>
        <Field label="E-Mail" error={errors.email}>
          <input name="email" type="email" className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-brand" required />
        </Field>
        <Field label="Telefonnummer" error={errors.phone}>
          <input name="phone" className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        </Field>
        <Field label="Nachricht" error={errors.message}>
          <textarea
            name="message"
            className="min-h-28 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-brand"
            required
          />
        </Field>
      </div>

      <section className="mt-6 rounded-lg border border-line bg-[#fbfaf7] p-4">
        <p className="text-sm font-semibold text-[#07173d]">Gründungsphase: Verifizierung ohne Gebühr</p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Die ersten 500 Fachbetriebe können ihren Betriebseintrag ohne Verifizierungsgebühr übernehmen und bestätigen.
          GewerkeListe.com befindet sich im Aufbau. Wer die Entwicklung eines professionellen Gewerkeregisters
          unterstützen möchte, kann freiwillig einen Aufbau-Beitrag leisten.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Der Beitrag ist freiwillig und hat keinen Einfluss auf die Prüfung, Darstellung oder Verifizierung des Eintrags.
        </p>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-ink">GewerkeListe.com unterstützen</legend>
          <div className="mt-3 grid gap-3">
            {supportOptions.map((option) => (
              <label
                key={option.value}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-ink"
              >
                <input
                  checked={supportContribution === option.value}
                  className="h-4 w-4 accent-[#1f5fd4]"
                  name="support_contribution"
                  onChange={() => setSupportContribution(option.value)}
                  type="radio"
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {supportContribution === "custom" ? (
          <Field label="Eigener Betrag in Euro" error={errors.support_custom_amount}>
            <input
              className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-brand"
              inputMode="decimal"
              min="1"
              name="support_custom_amount"
              placeholder="z. B. 75"
              type="number"
            />
          </Field>
        ) : (
          <input name="support_custom_amount" type="hidden" value="" />
        )}

        <label className="mt-4 flex items-start gap-3 text-sm font-medium leading-6 text-ink">
          <input className="mt-1 h-4 w-4 accent-[#1f5fd4]" name="support_invoice_requested" type="checkbox" />
          Rechnung auf Wunsch
        </label>

        <p className="mt-4 rounded-md border border-line bg-white px-4 py-3 text-xs leading-5 text-muted">
          Es handelt sich nicht um einen steuerbegünstigten Beitrag. Auf Wunsch kann eine Rechnung über den freiwilligen
          Unterstützungsbeitrag ausgestellt werden. Es wird an dieser Stelle keine Zahlung ausgelöst.
        </p>
      </section>

      <p className="mt-4 text-xs leading-5 text-muted">
        Mit dem Absenden verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage. Weitere Informationen finden Sie in
        der <a className="text-[#1f5fd4] hover:underline" href="/datenschutz">Datenschutzerklärung</a>.
      </p>

      {state.message ? (
        <div
          className={`mt-4 rounded-md border px-4 py-3 text-sm font-medium ${
            state.ok ? "border-[#8ab9aa] bg-[#e8f3ef] text-[#25584c]" : "border-[#da9a8a] bg-[#fff0ed] text-[#8e2f1f]"
          }`}
        >
          {state.message}
        </div>
      ) : null}
      <button
        disabled={pending || state.ok}
        className="mt-5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#265a4d] disabled:opacity-60"
      >
        {pending ? "Sende..." : "Anfrage abschicken"}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      {label}
      {children}
      {error ? <span className="text-xs font-semibold text-[#a4442b]">{error}</span> : null}
    </label>
  );
}
