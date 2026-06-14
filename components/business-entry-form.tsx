"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { TradeCheckboxGroups } from "@/components/trade-checkbox-groups";
import { submitBusinessEntry } from "@/lib/actions";
import type { CompanyFormState } from "@/lib/types";
import type { TaxonomyTrade } from "@/lib/trade-taxonomy";

const initialState: CompanyFormState = { ok: false, message: "" };
const supportOptions = [
  { value: "none", label: "Ohne Aufbau-Beitrag einreichen" },
  { value: "49", label: "49 € beitragen" },
  { value: "99", label: "99 € beitragen" },
  { value: "199", label: "199 € beitragen" },
  { value: "custom", label: "Eigenen Betrag wählen" },
];

export function BusinessEntryForm({ trades }: { trades: TaxonomyTrade[] }) {
  const [state, formAction, pending] = useActionState(submitBusinessEntry, initialState);
  const [primaryTrade, setPrimaryTrade] = useState(trades[0]?.slug ?? "");
  const [selectedTrades, setSelectedTrades] = useState<string[]>(trades[0]?.slug ? [trades[0].slug] : []);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [founderVerification, setFounderVerification] = useState(true);
  const [supportContribution, setSupportContribution] = useState("none");
  const errors = state.fieldErrors || {};
  const values = state.values || {};
  const formKey = JSON.stringify(values);

  const selectedTrade = useMemo(
    () => trades.find((trade) => trade.slug === primaryTrade) || trades[0],
    [primaryTrade, trades],
  );
  const serviceOptions = useMemo(() => {
    if (!selectedTrade) return [];
    return Array.from(new Set([...selectedTrade.subTrades, ...selectedTrade.coreServices, ...selectedTrade.specializations]));
  }, [selectedTrade]);
  const basisLimitReached = !founderVerification && selectedServices.length > 5;

  useEffect(() => {
    if (!state.values) return;
    const restoredValues = state.values;
    const restoredPrimaryTrade = textValue(restoredValues, "primaryTrade", trades[0]?.slug ?? "");
    const restoredSecondary = arrayValue(restoredValues, "secondaryTrades");
    setPrimaryTrade(restoredPrimaryTrade);
    setSelectedTrades([restoredPrimaryTrade, ...restoredSecondary].filter(Boolean));
    setSelectedServices(arrayValue(restoredValues, "selectedServices"));
    setFounderVerification(booleanValue(restoredValues, "wantsFounderVerification", true));
    setSupportContribution(textValue(restoredValues, "supportContribution", "none"));
  }, [state.values, trades]);

  function toggleService(service: string) {
    setSelectedServices((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service],
    );
  }

  function toggleTrade(slug: string) {
    setSelectedTrades((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug].slice(0, 5);
      const nextPrimary = next[0] || "";
      setPrimaryTrade(nextPrimary);
      setSelectedServices([]);
      return next;
    });
  }

  if (state.ok) {
    return (
      <section className="rounded-lg border border-[#b9dec8] bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-[#2f8f5b]">Einreichung gespeichert</p>
        <h2 className="mt-3 text-3xl font-semibold text-brand">Vielen Dank. Ihr Betriebseintrag wurde eingereicht.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          Wir prüfen die Angaben und melden uns, falls Rückfragen bestehen. Nach erfolgreicher Prüfung kann der
          Betriebseintrag auf GewerkeListe.com veröffentlicht werden.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-md bg-action px-5 text-sm font-semibold text-white" href="/suche">
            Zur Suche
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action" href="/fuer-betriebe">
            Weitere Informationen für Betriebe
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form action={formAction} className="grid gap-6" key={formKey} noValidate>
      <input className="hidden" name="websiteExtra" tabIndex={-1} autoComplete="off" />

      <FormSection number="1" title="Betriebsdaten" help="Diese Angaben bilden die Grundlage Ihres Betriebseintrags.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Firmenname" error={errors.companyName} required>
            <input className={inputClass} defaultValue={textValue(values, "companyName")} name="companyName" required />
          </Field>
          <Field label="Rechtsform" error={errors.legalForm}>
            <input className={inputClass} defaultValue={textValue(values, "legalForm")} name="legalForm" placeholder="z. B. GmbH, Einzelunternehmen" />
          </Field>
          <Field label="Website" error={errors.website}>
            <input className={inputClass} defaultValue={textValue(values, "website")} name="website" placeholder="https://..." type="url" />
          </Field>
          <Field label="Telefon" error={errors.phone}>
            <input className={inputClass} defaultValue={textValue(values, "phone")} name="phone" inputMode="tel" />
          </Field>
          <Field label="E-Mail" error={errors.email} required>
            <input className={inputClass} defaultValue={textValue(values, "email")} name="email" type="email" required />
          </Field>
          <Field label="Allgemeine Kontakt-E-Mail" error={errors.contactEmail}>
            <input className={inputClass} defaultValue={textValue(values, "contactEmail")} name="contactEmail" type="email" />
          </Field>
        </div>
      </FormSection>

      <FormSection
        number="2"
        title="Ansprechpartner"
        help="Der Ansprechpartner wird für Rückfragen zur Prüfung des Eintrags verwendet. Er muss nicht öffentlich angezeigt werden."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Vorname" error={errors.contactFirstName}>
            <input className={inputClass} defaultValue={textValue(values, "contactFirstName")} name="contactFirstName" />
          </Field>
          <Field label="Nachname" error={errors.contactLastName}>
            <input className={inputClass} defaultValue={textValue(values, "contactLastName")} name="contactLastName" />
          </Field>
          <Field label="Funktion" error={errors.contactRole}>
            <input className={inputClass} defaultValue={textValue(values, "contactRole")} name="contactRole" placeholder="z. B. Inhaber, Bauleitung" />
          </Field>
          <Field label="E-Mail Ansprechpartner" error={errors.contactPersonEmail}>
            <input className={inputClass} defaultValue={textValue(values, "contactPersonEmail")} name="contactPersonEmail" type="email" />
          </Field>
          <Field label="Telefon Ansprechpartner" error={errors.contactPersonPhone}>
            <input className={inputClass} defaultValue={textValue(values, "contactPersonPhone")} name="contactPersonPhone" inputMode="tel" />
          </Field>
        </div>
      </FormSection>

      <FormSection number="3" title="Standort" help="Der Standort hilft Auftraggebern, Betriebe regional einzuordnen.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Straße" error={errors.street}>
            <input className={inputClass} defaultValue={textValue(values, "street")} name="street" />
          </Field>
          <Field label="Hausnummer" error={errors.houseNumber}>
            <input className={inputClass} defaultValue={textValue(values, "houseNumber")} name="houseNumber" />
          </Field>
          <Field label="PLZ" error={errors.postalCode} required>
            <input className={inputClass} defaultValue={textValue(values, "postalCode")} name="postalCode" required />
          </Field>
          <Field label="Ort" error={errors.city} required>
            <input className={inputClass} defaultValue={textValue(values, "city")} name="city" required />
          </Field>
          <Field label="Bundesland / Region" error={errors.region}>
            <input className={inputClass} defaultValue={textValue(values, "region")} name="region" />
          </Field>
          <Field label="Land" error={errors.country} required>
            <input className={inputClass} name="country" defaultValue={textValue(values, "country", "Deutschland")} required />
          </Field>
        </div>
      </FormSection>

      <FormSection
        number="4"
        title="Gewerke auswählen"
        help="Wählen Sie die passenden Gewerke. Im kostenlosen Basis-Eintrag werden maximal 5 relevante Gewerke übernommen."
      >
        <input name="primaryTrade" type="hidden" value={primaryTrade} />
        {selectedTrades.slice(1).map((slug) => (
          <input key={slug} name="secondaryTrades" type="hidden" value={slug} />
        ))}
        <TradeCheckboxGroups max={5} name="tradeSelection" onToggle={toggleTrade} selected={selectedTrades} />
        {errors.primaryTrade ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.primaryTrade}</p> : null}
        {errors.secondaryTrades ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.secondaryTrades}</p> : null}
      </FormSection>

      <FormSection number="5" title="Leistungen auswählen" help="Im Basis-Eintrag können Sie Ihre wichtigsten Kernleistungen angeben.">
        <div className="rounded-md border border-line bg-[#fbfcff] p-4 text-sm leading-6 text-muted">
          Aktuelles Hauptgewerk: <span className="font-semibold text-ink">{selectedTrade?.name}</span>. Im Basis-Eintrag
          können bis zu 5 Kernleistungen ausgewählt werden.
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {serviceOptions.map((service) => (
            <CheckCard
              key={service}
              checked={selectedServices.includes(service)}
              label={service}
              name="selectedServices"
              onChange={() => toggleService(service)}
              value={service}
            />
          ))}
        </div>
        {basisLimitReached ? (
          <div className="mt-4 rounded-md border border-[#f1d08a] bg-[#fff8e8] p-4 text-sm leading-6 text-[#6d4a00]">
            Im Basis-Eintrag können bis zu 5 Kernleistungen ausgewählt werden. Mit einem verifizierten
            Fachbetriebseintrag können Sie Ihr Leistungsprofil vollständiger darstellen.
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-md border border-[#d6b661] bg-white px-3 py-2 text-xs font-semibold"
                onClick={() => setSelectedServices((current) => current.slice(0, 5))}
                type="button"
              >
                Bei 5 Kernleistungen bleiben
              </button>
              <button
                className="rounded-md bg-action px-3 py-2 text-xs font-semibold text-white"
                onClick={() => setFounderVerification(true)}
                type="button"
              >
                Als Gründungsbetrieb verifizieren lassen
              </button>
            </div>
          </div>
        ) : null}
        {errors.selectedServices ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.selectedServices}</p> : null}
        <Field label="Spezialisierungen ergänzen" error={errors.additionalSpecializations}>
          <input className={inputClass} defaultValue={textValue(values, "additionalSpecializations")} name="additionalSpecializations" placeholder="z. B. Altbausanierung, Naturstein, Gewerbeflächen" />
        </Field>
      </FormSection>

      <FormSection
        number="6"
        title="Tätigkeitsgebiet"
        help="Das Tätigkeitsgebiet hilft Auftraggebern einzuschätzen, ob Ihr Betrieb für eine Region relevant ist."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Einsatzradius in km" error={errors.serviceRadiusKm} required>
            <input className={inputClass} name="serviceRadiusKm" type="number" min="1" max="500" defaultValue={textValue(values, "serviceRadiusKm", "50")} required />
          </Field>
          <Field label="Länder" error={errors.serviceCountries}>
            <input className={inputClass} name="serviceCountries" defaultValue={textValue(values, "serviceCountries", "Deutschland")} />
          </Field>
          <Field label="Orte / Regionen" error={errors.serviceRegions}>
            <textarea className={textareaClass} defaultValue={textValue(values, "serviceRegions")} name="serviceRegions" placeholder="Rosenheim, Bad Aibling, München" />
          </Field>
          <Field label="PLZ-Gebiete" error={errors.postalCodes}>
            <textarea className={textareaClass} defaultValue={textValue(values, "postalCodes")} name="postalCodes" placeholder="83083, 83022, 83026" />
          </Field>
        </div>
      </FormSection>

      <FormSection
        number="7"
        title="Beschreibung"
        help="Beschreiben Sie sachlich, welche Arbeiten Ihr Betrieb anbietet, in welcher Region Sie tätig sind und worauf Sie spezialisiert sind."
      >
        <Field label="Kurzbeschreibung" error={errors.shortDescription} required>
          <textarea
            className={textareaClass}
            defaultValue={textValue(values, "shortDescription")}
            name="shortDescription"
            placeholder="Unser Betrieb ist auf Maurerarbeiten, Umbauten im Bestand und kleinere Betonarbeiten im Raum Rosenheim spezialisiert."
            required
          />
        </Field>
        <Field label="Beschreibung" error={errors.description}>
          <textarea className="min-h-36 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-action" defaultValue={textValue(values, "description")} name="description" />
        </Field>
      </FormSection>

      <FormSection number="8" title="Referenzen / Nachweise" help="Referenzen oder Bilder können später ergänzt werden.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Referenzprojekte als Text" error={errors.referencesText}>
            <textarea className={textareaClass} defaultValue={textValue(values, "referencesText")} name="referencesText" />
          </Field>
          <Field label="Innung / Kammer" error={errors.memberships}>
            <textarea className={textareaClass} defaultValue={textValue(values, "memberships")} name="memberships" placeholder="Je Eintrag durch Komma oder Zeilenumbruch trennen" />
          </Field>
          <Field label="Zertifikate" error={errors.certificates}>
            <textarea className={textareaClass} defaultValue={textValue(values, "certificates")} name="certificates" />
          </Field>
          <Field label="Herstellerzertifikate" error={errors.manufacturerCertificates}>
            <textarea className={textareaClass} defaultValue={textValue(values, "manufacturerCertificates")} name="manufacturerCertificates" />
          </Field>
        </div>
      </FormSection>

      <FormSection number="9" title="Eintrag zur Prüfung einreichen" help="Die Angaben werden vor der Veröffentlichung geprüft. Ein verifizierter Eintrag zeigt, dass Betriebsdaten bestätigt wurden. Es wird dadurch keine Aussage über Qualität, Zuverlässigkeit oder Ausführung garantiert.">
        <label className="flex items-start gap-3 text-sm font-medium leading-6 text-ink">
          <input
            checked={founderVerification}
            className="mt-1 h-4 w-4 accent-action"
            name="wantsFounderVerification"
            onChange={(event) => setFounderVerification(event.target.checked)}
            type="checkbox"
          />
          Ich möchte als Gründungsbetrieb ohne Verifizierungsgebühr geprüft werden.
        </label>

        <section className="mt-5 rounded-lg border border-line bg-[#fbfcff] p-4">
          <h3 className="text-sm font-semibold text-brand">GewerkeListe.com unterstützen</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Der freiwillige Aufbau-Beitrag hat keinen Einfluss auf Prüfung, Darstellung oder Verifizierung. Es wird keine
            Zahlung ausgelöst.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {supportOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
                <input
                  checked={supportContribution === option.value}
                  className="h-4 w-4 accent-action"
                  name="supportContribution"
                  onChange={() => setSupportContribution(option.value)}
                  type="radio"
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
          {supportContribution === "custom" ? (
            <Field label="Eigener Betrag in Euro" error={errors.supportCustomAmount}>
              <input className={inputClass} defaultValue={textValue(values, "supportCustomAmount")} name="supportCustomAmount" type="number" min="1" />
            </Field>
          ) : (
            <input name="supportCustomAmount" type="hidden" value="" />
          )}
          <label className="mt-4 flex items-start gap-3 text-sm font-medium leading-6 text-ink">
            <input className="mt-1 h-4 w-4 accent-action" defaultChecked={booleanValue(values, "supportInvoiceRequested")} name="supportInvoiceRequested" type="checkbox" />
            Rechnung auf Wunsch
          </label>
          <p className="mt-3 text-xs leading-5 text-muted">
            Es handelt sich nicht um einen steuerbegünstigten Beitrag. Auf Wunsch kann eine Rechnung über den freiwilligen
            Unterstützungsbeitrag ausgestellt werden.
          </p>
        </section>

        <div className="mt-5 grid gap-3">
          <Consent checked={booleanValue(values, "consentAuthorized")} name="consentAuthorized" error={errors.consentAuthorized}>
            Ich bestätige, dass ich berechtigt bin, diesen Betriebseintrag anzulegen oder zu bearbeiten.
          </Consent>
          <Consent checked={booleanValue(values, "consentDataCorrect")} name="consentDataCorrect" error={errors.consentDataCorrect}>
            Ich bestätige, dass die angegebenen Daten nach bestem Wissen korrekt sind.
          </Consent>
          <Consent checked={booleanValue(values, "consentPrivacy")} name="consentPrivacy" error={errors.consentPrivacy}>
            Ich habe die <Link className="text-action hover:underline" href="/datenschutz">Datenschutzerklärung</Link> gelesen.
          </Consent>
        </div>
      </FormSection>

      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <p className="text-xs leading-5 text-muted">
          Mit dem Absenden verarbeiten wir Ihre Angaben zur Bearbeitung des Betriebseintrags. Weitere Informationen
          finden Sie in der <Link className="text-action hover:underline" href="/datenschutz">Datenschutzerklärung</Link>.
        </p>
        {state.message ? (
          <div className="mt-4 rounded-md border border-[#da9a8a] bg-[#fff0ed] px-4 py-3 text-sm font-medium text-[#8e2f1f]">
            {state.message}
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
            disabled={pending || basisLimitReached}
          >
            {pending ? "Einreichung wird gespeichert..." : "Betriebseintrag zur Prüfung einreichen"}
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
            href="/eintrag-beanspruchen"
          >
            Bestehenden Eintrag beanspruchen
          </Link>
        </div>
      </div>
    </form>
  );
}

const inputClass = "w-full rounded-md border border-line px-3 py-2 outline-none focus:border-action";
const textareaClass = "min-h-28 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-action";

function textValue(values: CompanyFormState["values"], key: string, fallback = "") {
  const value = values?.[key];
  return typeof value === "string" ? value : fallback;
}

function arrayValue(values: CompanyFormState["values"], key: string) {
  const value = values?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function booleanValue(values: CompanyFormState["values"], key: string, fallback = false) {
  const value = values?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function FormSection({ number, title, help, children }: { number: string; title: string; help: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
      <div className="flex gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action text-sm font-semibold text-white">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-brand">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{help}</p>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      <span>
        {label}
        {required ? <span className="text-[#a4442b]"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs font-semibold text-[#a4442b]">{error}</span> : null}
    </label>
  );
}

function CheckCard({
  checked,
  disabled,
  label,
  name,
  onChange,
  value,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  name: string;
  onChange: () => void;
  value: string;
}) {
  return (
    <label
      className={`flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium ${
        checked ? "border-action bg-[#eef4ff] text-brand" : "border-line bg-white text-ink"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <input
        checked={checked}
        className="h-4 w-4 accent-action"
        disabled={disabled}
        name={name}
        onChange={onChange}
        type="checkbox"
        value={value}
      />
      {label}
    </label>
  );
}

function Consent({ name, checked, error, children }: { name: string; checked?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium leading-6 text-ink">
      <span className="flex items-start gap-3">
        <input className="mt-1 h-4 w-4 accent-action" defaultChecked={checked} name={name} type="checkbox" />
        <span>{children}</span>
      </span>
      {error ? <span className="pl-7 text-xs font-semibold text-[#a4442b]">{error}</span> : null}
    </label>
  );
}
