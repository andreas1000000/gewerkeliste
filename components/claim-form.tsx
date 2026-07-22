"use client";

import { useState } from "react";
import { useActionState } from "react";
import { TradeCheckboxGroups } from "@/components/trade-checkbox-groups";
import { submitClaim } from "@/lib/actions/claims";
import type { CompanyFormState } from "@/lib/types";

const initialState: CompanyFormState = { ok: false, message: "" };

export function ClaimForm({ companyId, initialTrades }: { companyId: string; initialTrades: string[] }) {
  const [state, formAction, pending] = useActionState(submitClaim, initialState);
  const [selectedTrades, setSelectedTrades] = useState(initialTrades);
  const errors = state.fieldErrors || {};

  function toggleTrade(slug: string) {
    setSelectedTrades((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      return [...current, slug];
    });
  }

  return (
    <form action={formAction} className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <input name="company_id" type="hidden" value={companyId} />
      <input name="primaryTrade" type="hidden" value={selectedTrades[0] || ""} />
      {selectedTrades.slice(1).map((slug) => (
        <input key={slug} name="secondaryTrades" type="hidden" value={slug} />
      ))}
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

      <section className="mt-6 rounded-lg border border-line bg-[#fbfcff] p-4">
        <h3 className="text-sm font-semibold text-brand">Gewerke bestätigen</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          Vorausgewählte Gewerke basieren auf dem vorhandenen Eintrag. Sie können Haken entfernen oder alle passenden
          Gewerke ergänzen, die Ihr Betrieb tatsächlich anbietet.
        </p>
        <div className="mt-4">
          <TradeCheckboxGroups name="claimTradeSelection" onToggle={toggleTrade} selected={selectedTrades} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-[#fbfaf7] p-4">
        <p className="text-sm font-semibold text-[#07173d]">Startphase: kostenloser Basiseintrag</p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Fachbetriebe können ihren Betriebseintrag kostenlos übernehmen und bestätigen. GewerkeListe.com befindet sich
          im Aufbau und wächst Region für Region.
        </p>
        <input name="support_contribution" type="hidden" value="none" />
        <input name="support_custom_amount" type="hidden" value="" />
      </section>

      <p className="mt-4 text-xs leading-5 text-muted">
        Mit dem Absenden verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage. Weitere Informationen finden Sie in
        der <a className="text-[#1f5fd4] hover:underline" href="/datenschutz">Datenschutzerklärung</a>.
      </p>

      <label className="mt-4 flex items-start gap-3 text-sm font-medium leading-6 text-ink">
        <input className="mt-1 h-4 w-4 accent-action" name="consent_privacy" required type="checkbox" />
        Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung dieser Anfrage zu.
      </label>
      {errors.consent_privacy ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.consent_privacy}</p> : null}

      {state.message ? (
        <div
          aria-live="polite"
          role={state.ok ? "status" : "alert"}
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
