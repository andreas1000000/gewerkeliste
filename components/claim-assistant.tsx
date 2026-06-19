"use client";

import { useState } from "react";
import { useActionState } from "react";
import { TradeCheckboxGroups } from "@/components/trade-checkbox-groups";
import { submitClaim } from "@/lib/actions/claims";
import type { CompanyFormState, CompanyWithTrade } from "@/lib/types";

const initialState: CompanyFormState = { ok: false, message: "" };

export function ClaimAssistant({ company, initialTrades }: { company: CompanyWithTrade; initialTrades: string[] }) {
  const [state, formAction, pending] = useActionState(submitClaim, initialState);
  const [selectedTrades, setSelectedTrades] = useState(initialTrades);
  const errors = state.fieldErrors || {};

  function toggleTrade(slug: string) {
    setSelectedTrades((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug);
      }
      return [...current, slug];
    });
  }

  return (
    <form action={formAction} className="grid gap-5">
      <input name="company_id" type="hidden" value={company.id} />
      <input name="message" type="hidden" value={`Profilübernahme und Datenprüfung für ${company.name}.`} />
      <input name="support_contribution" type="hidden" value="none" />
      <input name="support_custom_amount" type="hidden" value="" />
      <input name="primaryTrade" type="hidden" value={selectedTrades[0] || ""} />
      {selectedTrades.slice(1).map((slug) => (
        <input key={slug} name="secondaryTrades" type="hidden" value={slug} />
      ))}

      <WizardSection eyebrow="Schritt 1" title="Identität">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name Ansprechpartner" error={errors.name}>
            <input className={inputClass} name="name" required />
          </Field>
          <Field label="E-Mail" error={errors.email}>
            <input className={inputClass} name="email" type="email" required />
          </Field>
          <Field label="Telefonnummer" error={errors.phone}>
            <input className={inputClass} name="phone" />
          </Field>
          <Field label="Funktion im Betrieb">
            <input className={inputClass} name="requester_role" placeholder="z. B. Inhaber, Geschäftsführung, Büro" />
          </Field>
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm font-medium leading-6 text-ink">
          <input className="mt-1 h-4 w-4 accent-action" name="is_authorized" required type="checkbox" />
          Ich bin berechtigt, diesen Betrieb zu vertreten.
        </label>
        {errors.is_authorized ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.is_authorized}</p> : null}
      </WizardSection>

      <WizardSection eyebrow="Schritt 2" title="Basisdaten prüfen">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Firmenname">
            <input className={inputClass} defaultValue={company.name} name="proposed_company_name" />
          </Field>
          <Field label="Rechtsform">
            <input className={inputClass} name="proposed_legal_form" placeholder="z. B. GmbH, Einzelunternehmen" />
          </Field>
          <Field label="Straße">
            <input className={inputClass} defaultValue={company.street || ""} name="proposed_street" />
          </Field>
          <Field label="PLZ">
            <input className={inputClass} defaultValue={company.postal_code} name="proposed_postal_code" />
          </Field>
          <Field label="Ort">
            <input className={inputClass} defaultValue={company.city} name="proposed_city" />
          </Field>
          <Field label="Telefon">
            <input className={inputClass} defaultValue={company.phone || ""} name="proposed_phone" />
          </Field>
          <Field label="Öffentliche E-Mail">
            <input className={inputClass} defaultValue={company.email || ""} name="proposed_email" type="email" />
          </Field>
          <Field label="Website">
            <input className={inputClass} defaultValue={company.website_url || ""} name="proposed_website" />
          </Field>
        </div>
      </WizardSection>

      <WizardSection eyebrow="Schritt 3" title="Leistungen und Gewerke bestätigen">
        <p className="text-sm leading-6 text-muted">
          Bereits erkannte Gewerke sind vorausgewählt. Bestätigen oder ergänzen Sie alle Gewerke, Leistungen und
          Spezialisierungen, die Ihr Betrieb tatsächlich anbietet.
        </p>
        <div className="mt-4">
          <TradeCheckboxGroups defaultOpen name="claimTradeSelection" onToggle={toggleTrade} selected={selectedTrades} />
        </div>
      </WizardSection>

      <WizardSection eyebrow="Schritt 4" title="Profiltext">
        <Field label="Kurzbeschreibung">
          <textarea
            className="min-h-36 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-action"
            defaultValue={company.description || ""}
            name="proposed_description"
          />
        </Field>
        <p className="mt-3 text-sm leading-6 text-muted">
          Beschreiben Sie kurz und sachlich, welche Leistungen Sie anbieten. Keine Werbetexte, keine irreführenden
          Angaben.
        </p>
      </WizardSection>

      <WizardSection eyebrow="Schritt 5" title="Nachweis und Prüfung">
        <div className="grid gap-3">
          <Check name="verification_website">Website entspricht Betrieb</Check>
          <Check name="verification_email_domain">Geschäftliche E-Mail-Domain passt zur Website</Check>
          <Check name="verification_phone_callback">Telefonnummer-Rückfrage möglich</Check>
          <Check name="verification_document_later">Gewerbenachweis kann bei Bedarf nachgereicht werden</Check>
        </div>
        <p className="mt-4 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-xs leading-5 text-muted">
          Änderungen werden geprüft, bevor sie veröffentlicht werden. Das bestehende öffentliche Profil bleibt bis dahin
          unverändert.
        </p>
      </WizardSection>

      <WizardSection eyebrow="Schritt 6" title="Zur Prüfung einreichen">
        <div className="grid gap-3 sm:grid-cols-3">
          <Benefit>Kostenloses Basisprofil sichern</Benefit>
          <Benefit>Kontaktdaten korrigieren</Benefit>
          <Benefit>Leistungen sichtbar machen</Benefit>
        </div>
        {state.message ? (
          <div
            className={`mt-5 rounded-md border px-4 py-3 text-sm font-medium ${
              state.ok ? "border-[#8ab9aa] bg-[#e8f3ef] text-[#25584c]" : "border-[#da9a8a] bg-[#fff0ed] text-[#8e2f1f]"
            }`}
          >
            {state.message}
          </div>
        ) : null}
        <button
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
          disabled={pending || state.ok}
        >
          {pending ? "Wird eingereicht..." : "Profil zur Prüfung einreichen"}
        </button>
      </WizardSection>
    </form>
  );
}

function WizardSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-normal text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-ink">
      {label}
      {children}
      {error ? <span className="text-xs font-semibold text-[#a4442b]">{error}</span> : null}
    </label>
  );
}

function Check({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-sm font-medium leading-6 text-ink">
      <input className="mt-1 h-4 w-4 accent-action" name={name} type="checkbox" />
      {children}
    </label>
  );
}

function Benefit({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-ink">{children}</div>;
}

const inputClass = "w-full rounded-md border border-line px-3 py-2 outline-none focus:border-action";
