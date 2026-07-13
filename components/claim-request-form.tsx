"use client";

import { useActionState } from "react";
import { submitClaimRequest, type ClaimRequestState, initialClaimRequestState } from "@/lib/actions/claim-ownership";

export function ClaimRequestForm({ companyId, companySlug, email }: { companyId: string; companySlug: string; email: string }) {
  const action = submitClaimRequest.bind(null, companyId);
  const [state, formAction, pending] = useActionState<ClaimRequestState, FormData>(action, initialClaimRequestState);
  const errors = state.fieldErrors || {};

  if (state.ok) {
    return (
      <section className="rounded-lg border border-[#b9dec8] bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-[#2f8f5b]">Übernahme eingereicht</p>
        <h2 className="mt-3 text-2xl font-semibold text-brand">Die Prüfung läuft.</h2>
        <p className="mt-4 text-sm leading-6 text-muted">{state.message}</p>
        <p className="mt-4 rounded-md border border-line bg-panel px-4 py-3 text-sm leading-6 text-muted">
          Eine Übernahme ist keine Qualitätsbewertung und keine Empfehlung. Nach der Freigabe können Sie Änderungen
          einreichen; öffentlich werden sie erst nach Prüfung.
        </p>
      </section>
    );
  }

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
      <input name="company_slug" type="hidden" value={companySlug} />
      {state.message ? <p className="rounded-md border border-[#e1b0a5] bg-[#fff5f2] px-4 py-3 text-sm text-[#8e2f1f]">{state.message}</p> : null}
      <div className="rounded-md border border-line bg-panel px-4 py-3 text-sm leading-6 text-muted">
        Angemeldet als <span className="font-semibold text-ink">{email}</span>. Die geschäftliche E-Mail stammt aus Ihrer
        bestätigten Sitzung und kann im Antrag nicht ersetzt werden.
      </div>
      <Field error={errors.name} label="Ihr Name">
        <input className={inputClass} name="name" required />
      </Field>
      <Field error={errors.role} label="Funktion im Betrieb">
        <input className={inputClass} name="role" placeholder="z. B. Inhaber, Geschäftsführung, Büro" required />
      </Field>
      <Field error={errors.phone} label="Telefonnummer optional">
        <input className={inputClass} name="phone" type="tel" />
      </Field>
      <Field error={errors.authorization_notes} label="Wie kann die Vertretungsberechtigung geprüft werden?">
        <textarea className={`${inputClass} min-h-28`} name="authorization_notes" placeholder="z. B. Rückruf über die offizielle Betriebsnummer oder Nachweis auf Anfrage" required />
      </Field>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink">
        <input className="mt-1 h-4 w-4 accent-action" name="is_authorized" required type="checkbox" />
        Ich bin berechtigt, diesen Betrieb zu vertreten.
      </label>
      {errors.is_authorized ? <p className="-mt-3 text-xs font-semibold text-[#a4442b]">{errors.is_authorized}</p> : null}
      <p className="text-xs leading-5 text-muted">
        Wir prüfen die Angaben manuell. Eine passende E-Mail-Domain ist nur ein Hinweis und führt nicht automatisch zur Freigabe.
      </p>
      <button className="rounded-md bg-action px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Übernahme wird eingereicht …" : "Übernahme zur Prüfung einreichen"}
      </button>
    </form>
  );
}

function Field({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      {children}
      {error ? <span className="text-xs font-medium text-[#a4442b]">{error}</span> : null}
    </label>
  );
}

const inputClass = "w-full rounded-md border border-line px-3 py-2 font-normal outline-none focus:border-action";
