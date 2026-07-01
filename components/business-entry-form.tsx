"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { TradeCheckboxGroups } from "@/components/trade-checkbox-groups";
import { serviceNamesForTrades, TradeServiceSelection } from "@/components/trade-service-selection";
import { submitBusinessEntry } from "@/lib/actions/business-entry";
import type { CompanyFormState } from "@/lib/types";
import type { TaxonomyTrade } from "@/lib/trade-taxonomy";

const initialState: CompanyFormState = { ok: false, message: "" };

export function BusinessEntryForm({ trades }: { trades: TaxonomyTrade[] }) {
  const [state, formAction, pending] = useActionState(submitBusinessEntry, initialState);
  const [primaryTrade, setPrimaryTrade] = useState("");
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [founderVerification, setFounderVerification] = useState(true);
  const [mediaFilesSelected, setMediaFilesSelected] = useState(false);
  const errors = state.fieldErrors || {};
  const values = state.values || {};
  const formKey = JSON.stringify(values);

  useEffect(() => {
    if (!state.values) return;
    const restoredValues = state.values;
    const restoredPrimaryTrade = textValue(restoredValues, "primaryTrade");
    const restoredSecondary = arrayValue(restoredValues, "secondaryTrades");
    setPrimaryTrade(restoredPrimaryTrade);
    setSelectedTrades([restoredPrimaryTrade, ...restoredSecondary].filter(Boolean));
    setSelectedServices(arrayValue(restoredValues, "selectedServices"));
    setFounderVerification(booleanValue(restoredValues, "wantsFounderVerification", true));
  }, [state.values, trades]);

  function toggleService(service: string) {
    setSelectedServices((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service],
    );
  }

  function toggleTrade(slug: string) {
    setSelectedTrades((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      const nextPrimary = next[0] || "";
      setPrimaryTrade(nextPrimary);
      const allowedServices = serviceNamesForTrades(next);
      setSelectedServices((services) => services.filter((service) => allowedServices.has(service)));
      return next;
    });
  }

  if (state.ok) {
    return (
      <section className="rounded-lg border border-[#b9dec8] bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-[#2f8f5b]">Einreichung gespeichert</p>
        <h2 className="mt-3 text-3xl font-semibold text-brand">Vielen Dank. Ihr Betriebseintrag wurde eingereicht.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          Danke. Ihre Angaben wurden übermittelt und werden geprüft. Der kostenlose Basiseintrag bleibt erhalten. Wir
          melden uns, falls Rückfragen bestehen.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-md bg-action px-5 text-sm font-semibold text-white" href="/betriebe">
            Zur Betriebe-Liste
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action" href="/betriebe">
            Betriebe suchen
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form action={formAction} className="grid min-w-0 gap-6" encType="multipart/form-data" key={formKey} method="post" noValidate>
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
        title="Kontakt und Ansprechpartner"
        help="Diese Angaben helfen bei Rückfragen zur Prüfung des Eintrags. Angaben zum Ansprechpartner müssen nicht öffentlich angezeigt werden."
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

      <FormSection
        number="2a"
        title="Profil optisch vervollständigen"
        help="Logo und Ansprechpartnerbild sind freiwillig. Ihr kostenloses Basisprofil kann auch ohne Bilder eingetragen werden. Eingereichte Bilder werden geprüft, bevor sie öffentlich erscheinen."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <MediaFileField
            accept="image/jpeg,image/png,image/webp"
            error={errors.companyLogo}
            help="JPG, PNG oder WebP. Maximal 2 MB. SVG, GIF und PDF sind nicht erlaubt."
            label="Firmenlogo hochladen"
            maxBytes={2 * 1024 * 1024}
            name="companyLogo"
            onMediaChange={setMediaFilesSelected}
          />
          <MediaFileField
            accept="image/jpeg,image/png,image/webp"
            error={errors.contactProfileImage}
            help="JPG, PNG oder WebP. Maximal 5 MB. Nur ein Bild einreichen, wenn die abgebildete Person zugestimmt hat."
            label="Ansprechpartnerbild hochladen"
            maxBytes={5 * 1024 * 1024}
            name="contactProfileImage"
            onMediaChange={setMediaFilesSelected}
          />
          <Field label="Ansprechpartner Name" error={errors.mediaContactName}>
            <input className={inputClass} defaultValue={textValue(values, "mediaContactName")} name="mediaContactName" />
          </Field>
          <Field label="Rolle/Funktion" error={errors.mediaContactRole}>
            <input className={inputClass} defaultValue={textValue(values, "mediaContactRole")} name="mediaContactRole" placeholder="z. B. Inhaber, Geschäftsführung, Bauleitung" />
          </Field>
        </div>
        <Consent checked={booleanValue(values, "imageConsentGiven")} name="imageConsentGiven" error={errors.imageConsentGiven} required={mediaFilesSelected}>
          Ich bin berechtigt, diese Bilder für den Betrieb einzureichen.
        </Consent>
        <p className="mt-3 rounded-md border border-line bg-white px-4 py-3 text-xs leading-5 text-muted">
          Logo und Ansprechpartnerbild sind freiwillig. Sie können Ihr Profil auch ohne Medien kostenlos eintragen. Bilder werden erst nach Prüfung veröffentlicht.
        </p>
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
        help="Wählen Sie alle Gewerke aus, die Ihr Betrieb tatsächlich anbietet. Das Leistungsspektrum soll klar und vollständig sichtbar werden."
      >
        <input name="primaryTrade" type="hidden" value={primaryTrade} />
        {selectedTrades.slice(1).map((slug) => (
          <input key={slug} name="secondaryTrades" type="hidden" value={slug} />
        ))}
        <TradeCheckboxGroups defaultOpen={false} name="tradeSelection" onToggle={toggleTrade} selected={selectedTrades} />
        {errors.primaryTrade ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.primaryTrade}</p> : null}
        {errors.secondaryTrades ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.secondaryTrades}</p> : null}
      </FormSection>

      <FormSection number="5" title="Leistungen auswählen" help="Wählen Sie die konkreten Leistungen aus, die Ihr Betrieb innerhalb der gewählten Gewerke tatsächlich anbietet.">
        <TradeServiceSelection selectedServices={selectedServices} selectedTrades={selectedTrades} onToggleService={toggleService} />
        {selectedTrades.length && !selectedServices.length ? (
          <p className="mt-4 rounded-md border border-[#f2d3a7] bg-[#fff8ea] px-4 py-3 text-sm leading-6 text-[#7a4a00]">
            Sie haben noch keine konkreten Leistungen ausgewählt. Detailleistungen verbessern die Auffindbarkeit Ihres
            Betriebs.
          </p>
        ) : null}
        {errors.selectedServices ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.selectedServices}</p> : null}
        <Field label="Spezialisierungen ergänzen" error={errors.additionalSpecializations}>
          <input className={inputClass} defaultValue={textValue(values, "additionalSpecializations")} name="additionalSpecializations" placeholder="z. B. Altbausanierung, Naturstein, Gewerbeflächen" />
        </Field>
      </FormSection>

      <FormSection
        number="6"
        title="Region und Wirkungskreis"
        help="Der Wirkungskreis hilft Auftraggebern einzuschätzen, in welchen Orten und Regionen Ihr Betrieb tätig werden möchte."
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

      <FormSection number="9" title="Prüfung und Absenden" help="Die Angaben werden vor der Veröffentlichung geprüft. Eine spätere Datenbestätigung bedeutet nur, dass Profildaten bestätigt wurden. Sie ist keine Qualitätsbewertung.">
        <label className="flex items-start gap-3 text-sm font-medium leading-6 text-ink">
          <input
            checked={founderVerification}
            className="mt-1 h-4 w-4 accent-action"
            name="wantsFounderVerification"
            onChange={(event) => setFounderVerification(event.target.checked)}
            type="checkbox"
          />
          Ich möchte meinen kostenlosen Basiseintrag prüfen und bestätigen lassen.
        </label>
        <input name="supportContribution" type="hidden" value="none" />
        <input name="supportCustomAmount" type="hidden" value="" />

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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60 sm:w-auto"
            disabled={pending}
          >
            {pending ? "Einreichung wird gespeichert..." : "Betriebseintrag zur Prüfung einreichen"}
          </button>
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action sm:w-auto"
            href="/eintrag-beanspruchen"
          >
            Bestehenden Eintrag beanspruchen
          </Link>
        </div>
      </div>
    </form>
  );
}

const inputClass = "w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-action";
const textareaClass = "min-h-28 w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-action";

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
    <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-white p-4 shadow-soft sm:p-6">
      <div className="flex min-w-0 gap-3 sm:gap-4">
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

function MediaFileField({
  accept,
  error,
  help,
  label,
  maxBytes,
  name,
  onMediaChange,
}: {
  accept: string;
  error?: string;
  help: string;
  label: string;
  maxBytes: number;
  name: string;
  onMediaChange: (selected: boolean) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2 rounded-lg border border-line bg-[#fbfcff] p-4 text-sm font-semibold text-ink">
      {label}
      <input
        accept={accept}
        className="w-full min-w-0 max-w-full rounded-md border border-line bg-white px-3 py-2 text-xs sm:text-sm"
        name={name}
        onChange={(event) => {
          const file = event.target.files?.[0];
          const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
          const maxMb = Math.round(maxBytes / 1024 / 1024);
          event.target.setCustomValidity("");
          if (file && !allowedTypes.includes(file.type)) {
            event.target.setCustomValidity("Bitte nur JPG, PNG oder WebP hochladen.");
          } else if (file && file.size > maxBytes) {
            event.target.setCustomValidity(`Die Datei ist zu groß. Maximal ${maxMb} MB sind erlaubt.`);
          }
          if (file) onMediaChange(true);
          event.target.reportValidity();
        }}
        type="file"
      />
      <span className="text-xs font-normal leading-5 text-muted">{help}</span>
      {error ? <span className="text-xs font-semibold text-[#a4442b]">{error}</span> : null}
    </label>
  );
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">
      <span>
        {label}
        {required ? <span className="text-[#a4442b]"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs font-semibold text-[#a4442b]">{error}</span> : null}
    </label>
  );
}

function Consent({ name, checked, error, required, children }: { name: string; checked?: boolean; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1 text-sm font-medium leading-6 text-ink">
      <span className="flex min-w-0 items-start gap-3">
        <input className="mt-1 h-4 w-4 accent-action" defaultChecked={checked} name={name} required={required} type="checkbox" />
        <span className="min-w-0">{children}</span>
      </span>
      {error ? <span className="pl-7 text-xs font-semibold text-[#a4442b]">{error}</span> : null}
    </label>
  );
}
