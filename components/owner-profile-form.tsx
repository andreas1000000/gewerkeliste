"use client";

import { useActionState } from "react";
import { initialOwnerProfileState, submitOwnerProfileChange, type OwnerProfileState } from "@/lib/actions/owner-profile";

type OwnerCompany = {
  id: string;
  name: string;
  description: string;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  street: string | null;
  city: string;
  postal_code: string;
  logo_url?: string | null;
  profile_image_url?: string | null;
  profile_image_alt?: string | null;
  contact_person_name?: string | null;
  contact_person_role?: string | null;
  service_radius_km?: number | null;
  service_regions?: string[] | null;
  service_postal_codes?: string[] | null;
  service_countries?: string[] | null;
  memberships?: string[] | null;
  certificates?: string[] | null;
  manufacturer_certificates?: string[] | null;
  references_text?: string | null;
};

export function OwnerProfileForm({ company }: { company: OwnerCompany }) {
  const action = submitOwnerProfileChange.bind(null, company.id);
  const [state, formAction, pending] = useActionState<OwnerProfileState, FormData>(action, initialOwnerProfileState);
  const errors = state.fieldErrors || {};

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
      {state.message ? <p className={state.ok ? "rounded-md border border-[#b9dec8] bg-[#f1fbf5] px-4 py-3 text-sm text-[#24523a]" : "rounded-md border border-[#e1b0a5] bg-[#fff5f2] px-4 py-3 text-sm text-[#8e2f1f]"}>{state.message}</p> : null}
      <p className="rounded-md border border-line bg-panel px-4 py-3 text-sm leading-6 text-muted">
        Ihre Angaben werden als Submission gespeichert. Das öffentliche Profil bleibt bis zur menschlichen Freigabe unverändert.
      </p>
      <Section title="Grunddaten">
        <Field error={errors.company_name} label="Firmenname"><input className={inputClass} defaultValue={company.name} name="company_name" required /></Field>
        <Field label="Rechtsform"><input className={inputClass} name="legal_form" placeholder="z. B. GmbH" /></Field>
        <Field label="Straße"><input className={inputClass} defaultValue={company.street || ""} name="street" /></Field>
        <Field error={errors.postal_code} label="PLZ"><input className={inputClass} defaultValue={company.postal_code} name="postal_code" required /></Field>
        <Field error={errors.city} label="Ort"><input className={inputClass} defaultValue={company.city} name="city" required /></Field>
        <Field label="Website"><input className={inputClass} defaultValue={company.website_url || ""} name="website" type="url" /></Field>
        <Field error={errors.public_email} label="Öffentliche E-Mail"><input className={inputClass} defaultValue={company.email || ""} name="public_email" type="email" /></Field>
        <Field label="Telefon"><input className={inputClass} defaultValue={company.phone || ""} name="phone" type="tel" /></Field>
      </Section>
      <Section title="Fachliches Profil">
        <Field label="Kurzbeschreibung"><textarea className={`${inputClass} min-h-20`} defaultValue={company.description.slice(0, 240)} name="short_description" /></Field>
        <Field label="Beschreibung"><textarea className={`${inputClass} min-h-32`} defaultValue={company.description} name="description" /></Field>
        <Field label="Weitere Gewerke (je Zeile oder Komma)"><textarea className={`${inputClass} min-h-20`} name="secondary_trades" /></Field>
        <Field label="Leistungen"><textarea className={`${inputClass} min-h-20`} name="selected_services" /></Field>
        <Field label="Spezialisierungen"><textarea className={`${inputClass} min-h-20`} name="specializations" /></Field>
      </Section>
      <Section title="Tätigkeitsgebiete">
        <Field error={errors.service_radius_km} label="Radius in km"><input className={inputClass} defaultValue={String(company.service_radius_km || 50)} name="service_radius_km" type="number" min="0" max="1000" /></Field>
        <Field label="Orte / Regionen"><textarea className={`${inputClass} min-h-20`} defaultValue={(company.service_regions || []).join("\n")} name="service_regions" /></Field>
        <Field label="PLZ-Gebiete"><textarea className={`${inputClass} min-h-20`} defaultValue={(company.service_postal_codes || []).join("\n")} name="postal_codes" /></Field>
        <Field label="Länder"><textarea className={`${inputClass} min-h-20`} defaultValue={(company.service_countries || ["Deutschland"]).join("\n")} name="service_countries" /></Field>
      </Section>
      <Section title="Kontakt und Darstellung">
        <Field label="Ansprechpartner"><input className={inputClass} defaultValue={company.contact_person_name || ""} name="contact_name" /></Field>
        <Field label="Funktion"><input className={inputClass} defaultValue={company.contact_person_role || ""} name="contact_role" /></Field>
        <Field label="Telefon Ansprechpartner"><input className={inputClass} name="contact_phone" type="tel" /></Field>
        <Field label="Logo-URL"><input className={inputClass} defaultValue={company.logo_url || ""} name="logo_url" type="url" /></Field>
        <Field label="Ansprechpartnerbild-URL"><input className={inputClass} defaultValue={company.profile_image_url || ""} name="profile_image_url" type="url" /></Field>
        <Field label="Bildbeschreibung"><input className={inputClass} defaultValue={company.profile_image_alt || ""} name="profile_image_alt" /></Field>
        <Field label="Social Links (platform|URL|Label)"><textarea className={`${inputClass} min-h-24`} name="social_links" placeholder="linkedin|https://www.linkedin.com/company/...|LinkedIn" /></Field>
        <Field label="Referenzen"><textarea className={`${inputClass} min-h-24`} defaultValue={company.references_text || ""} name="references_text" /></Field>
        <Field label="Innungen / Kammern"><textarea className={`${inputClass} min-h-20`} defaultValue={(company.memberships || []).join("\n")} name="memberships" /></Field>
        <Field label="Zertifikate"><textarea className={`${inputClass} min-h-20`} defaultValue={(company.certificates || []).join("\n")} name="certificates" /></Field>
        <Field label="Herstellerzertifikate"><textarea className={`${inputClass} min-h-20`} defaultValue={(company.manufacturer_certificates || []).join("\n")} name="manufacturer_certificates" /></Field>
        <Field label="Hinweis an die Prüfung"><textarea className={`${inputClass} min-h-20`} name="notes" /></Field>
      </Section>
      <button className="rounded-md bg-action px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Änderung wird eingereicht …" : "Änderung zur Prüfung einreichen"}
      </button>
    </form>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return <fieldset className="grid gap-4 rounded-md border border-line p-4"><legend className="px-2 text-lg font-semibold text-ink">{title}</legend>{children}</fieldset>;
}

function Field({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return <label className="grid gap-2 text-sm font-semibold text-ink">{label}{children}{error ? <span className="text-xs font-medium text-[#a4442b]">{error}</span> : null}</label>;
}

const inputClass = "w-full rounded-md border border-line px-3 py-2 font-normal outline-none focus:border-action";
