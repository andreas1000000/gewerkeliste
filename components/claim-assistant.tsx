"use client";
import { useState } from "react";
import { useActionState } from "react";
import { PremiumSubmissionFields } from "@/components/premium-submission-fields";
import { SocialLinksFields } from "@/components/social-links-fields";
import { TradeCheckboxGroups } from "@/components/trade-checkbox-groups";
import { serviceNamesForTrades, TradeServiceSelection } from "@/components/trade-service-selection";
import { submitClaim } from "@/lib/actions/claims";
import type { CompanyFormState, CompanySubmission, CompanyWithTrade } from "@/lib/types";
import type { PublicCompanyWithTrade } from "@/lib/types/public-directory";
import { publicTradeTaxonomy } from "@/lib/trade-taxonomy";
const initialState: CompanyFormState = { ok: false, message: "" };
type ClaimAssistantIntent = "claim" | "update";
type ClaimAssistantCompany = (CompanyWithTrade | PublicCompanyWithTrade) & {
  logo_url?: string | null;
  profile_image_url?: string | null;
  contact_person_name?: string | null;
  contact_person_role?: string | null;
};

export function ClaimAssistant({
  company,
  initialDescription,
  initialServices,
  initialSubmission,
  initialTrades,
  intent = "claim",
}: {
  company: ClaimAssistantCompany;
  initialDescription?: string;
  initialServices?: string[];
  initialSubmission?: CompanySubmission | null;
  initialTrades: string[];
  intent?: ClaimAssistantIntent;
}) {
  const [state, formAction, pending] = useActionState(submitClaim, initialState);
  const isUpdate = intent === "update";
  const [selectedTrades, setSelectedTrades] = useState(initialTrades);
  const [selectedServices, setSelectedServices] = useState<string[]>(initialSubmission?.selected_services?.length ? initialSubmission.selected_services : initialServices || []);
  const [missingServices, setMissingServices] = useState((initialSubmission?.specializations || []).join("\n"));
  const [logoFileSelected, setLogoFileSelected] = useState(false);
  const [contactImageFileSelected, setContactImageFileSelected] = useState(false);
  const [contact, setContact] = useState({
    name: isUpdate ? initialSubmission?.contact_person_name || company.contact_person_name || company.contact_name || "" : "",
    email: isUpdate ? initialSubmission?.contact_person_email || company.email || "" : "",
    phone: initialSubmission?.contact_person_phone || company.phone || "",
    role: initialSubmission?.contact_person_role || company.contact_person_role || "",
  });
  const mediaContactName = initialSubmission?.contact_person_name || company.contact_person_name || company.contact_name || "";
  const mediaContactRole = initialSubmission?.contact_person_role || company.contact_person_role || "";
  const [profile, setProfile] = useState({
    companyName: company.name,
    legalForm: initialSubmission?.legal_form || "",
    street: initialSubmission?.street || company.street || "",
    postalCode: initialSubmission?.postal_code || company.postal_code,
    city: initialSubmission?.city || company.city,
    publicEmail: initialSubmission?.contact_email || company.email || "",
    website: initialSubmission?.website || company.website_url || "",
    description: initialDescription || initialSubmission?.short_description || company.description || "",
  });
  const errors = state.fieldErrors || {};
  const tradeLabels = new Map(publicTradeTaxonomy().map((trade) => [trade.slug, trade.name]));
  const mediaFilesSelected = logoFileSelected || contactImageFileSelected;
  if (state.ok) {
    return (
      <section className="rounded-lg border border-[#b9dec8] bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-[#2f8f5b]">
          {isUpdate ? "Profilergänzung eingereicht" : "Übernahme eingereicht"}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-brand">Vielen Dank. Ihre Angaben wurden übermittelt.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          Danke. Ihre Angaben wurden übermittelt und werden geprüft. Der kostenlose Basiseintrag bleibt erhalten. Wir
          melden uns, falls Rückfragen bestehen.
        </p>
        <p className="mt-4 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-xs leading-5 text-muted">
          Die Übernahme bestätigt keine fachliche Qualität und ist keine Empfehlung. Sie dient der Prüfung und
          Bestätigung der Profildaten.
        </p>
      </section>
    );
  }
  function toggleTrade(slug: string) {
    setSelectedTrades((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      const allowedServices = serviceNamesForTrades(next);
      setSelectedServices((services) => services.filter((service) => allowedServices.has(service)));
      return next;
    });
  }
  function toggleService(service: string) {
    setSelectedServices((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service],
    );
  }
  function updateContact(field: keyof typeof contact, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
  }
  function updateProfile(field: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }
  return (
    <form action={formAction} className="grid min-w-0 gap-5 overflow-hidden" encType="multipart/form-data">
      <input name="company_id" type="hidden" value={company.id} />
      <input name="intent" type="hidden" value={intent} />
      <input
        name="message"
        type="hidden"
        value={
          isUpdate
            ? `Profilergänzung und Datenpflege für ${company.name}.`
            : `Profilübernahme und Datenprüfung für ${company.name}.`
        }
      />
      <input name="support_contribution" type="hidden" value="none" />
      <input name="support_custom_amount" type="hidden" value="" />
      <input name="primaryTrade" type="hidden" value={selectedTrades[0] || ""} />
      <input name="proposed_phone" type="hidden" value={contact.phone} />
      {selectedServices.map((service) => (
        <input key={service} name="selectedServices" type="hidden" value={service} />
      ))}
      {selectedTrades.slice(1).map((slug) => (
        <input key={slug} name="secondaryTrades" type="hidden" value={slug} />
      ))}
      <WizardSection eyebrow="Schritt 1" title={isUpdate ? "Profildaten prüfen" : "Betrieb prüfen"}>
        <p className="mb-5 text-sm leading-6 text-muted">
          Prüfen Sie die vorhandenen Betriebsdaten. Korrigieren Sie nur Angaben, die öffentlich für den Betrieb verwendet werden
          sollen.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Firmenname">
            <input className={inputClass} name="proposed_company_name" onChange={(event) => updateProfile("companyName", event.target.value)} value={profile.companyName} />
          </Field>
          <Field label="Rechtsform">
            <input className={inputClass} name="proposed_legal_form" onChange={(event) => updateProfile("legalForm", event.target.value)} placeholder="z. B. GmbH, Einzelunternehmen" value={profile.legalForm} />
          </Field>
          <Field label="Straße">
            <input className={inputClass} name="proposed_street" onChange={(event) => updateProfile("street", event.target.value)} value={profile.street} />
          </Field>
          <Field label="PLZ">
            <input className={inputClass} name="proposed_postal_code" onChange={(event) => updateProfile("postalCode", event.target.value)} value={profile.postalCode} />
          </Field>
          <Field label="Ort">
            <input className={inputClass} name="proposed_city" onChange={(event) => updateProfile("city", event.target.value)} value={profile.city} />
          </Field>
          <Field label="Öffentliche E-Mail">
            <input className={inputClass} name="proposed_email" onChange={(event) => updateProfile("publicEmail", event.target.value)} type="email" value={profile.publicEmail} />
          </Field>
          <Field label="Website">
            <input className={inputClass} name="proposed_website" onChange={(event) => updateProfile("website", event.target.value)} value={profile.website} />
          </Field>
        </div>
      </WizardSection>
      <WizardSection eyebrow="Schritt 2" title="Welche Gewerke bietet Ihr Betrieb an?">
        <p className="text-sm leading-6 text-muted">
          Bereits erkannte Gewerke sind vorausgewählt. Entfernen Sie unpassende Gewerke und ergänzen Sie alle Gewerke,
          die Ihr Betrieb tatsächlich anbietet.
        </p>
        <div className="mt-4">
          <TradeCheckboxGroups defaultOpen={false} name="claimTradeSelection" onToggle={toggleTrade} selected={selectedTrades} />
        </div>
        {!selectedTrades.length ? (
          <p className="mt-3 rounded-md border border-[#f2d3a7] bg-[#fff8ea] px-4 py-3 text-sm font-semibold text-[#7a4a00]">
            Bitte wählen Sie mindestens ein Gewerk aus.
          </p>
        ) : null}
      </WizardSection>
      <WizardSection eyebrow="Schritt 3" title="Welche konkreten Leistungen bietet Ihr Betrieb an?">
        <TradeServiceSelection selectedServices={selectedServices} selectedTrades={selectedTrades} onToggleService={toggleService} />
        {selectedTrades.length && !selectedServices.length ? (
          <p className="mt-4 rounded-md border border-[#f2d3a7] bg-[#fff8ea] px-4 py-3 text-sm leading-6 text-[#7a4a00]">
            Sie haben noch keine konkreten Leistungen ausgewählt. Detailleistungen verbessern die Auffindbarkeit Ihres
            Betriebs. Falls für Ihr Gewerk noch keine passende Leistung vorhanden ist, schlagen Sie sie unten vor.
          </p>
        ) : null}
        <Field label="Fehlt eine Leistung? Leistung oder Spezialisierung vorschlagen">
          <textarea
            className="min-h-24 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-action"
            name="missing_services"
            onChange={(event) => setMissingServices(event.target.value)}
            placeholder="z. B. Akustikdecken, Brandschutzwände, Trockenestrich"
            value={missingServices}
          />
        </Field>
      </WizardSection>
      <WizardSection eyebrow="Schritt 4" title={isUpdate ? "Rückfragen optional" : "Ansprechpartner und öffentliche Kontaktdaten"}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={isUpdate ? "Name Ansprechpartner optional" : "Name Ansprechpartner"} error={errors.name}>
            <input className={inputClass} name="name" onChange={(event) => updateContact("name", event.target.value)} required={!isUpdate} value={contact.name} />
          </Field>
          <Field label={isUpdate ? "E-Mail für Rückfragen optional" : "E-Mail für Rückfragen"} error={errors.email}>
            <input className={inputClass} name="email" onChange={(event) => updateContact("email", event.target.value)} required={!isUpdate} type="email" value={contact.email} />
          </Field>
          <Field label="Telefon öffentlich / Rückruf" error={errors.phone}>
            <input className={inputClass} name="phone" onChange={(event) => updateContact("phone", event.target.value)} value={contact.phone} />
          </Field>
          <Field label="Funktion im Betrieb">
            <input className={inputClass} name="requester_role" onChange={(event) => updateContact("role", event.target.value)} placeholder="z. B. Inhaber, Geschäftsführung, Büro" value={contact.role} />
          </Field>
        </div>
        <Field label="Kurzbeschreibung">
          <textarea
            className="min-h-36 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-action"
            name="proposed_description"
            onChange={(event) => updateProfile("description", event.target.value)}
            value={profile.description}
          />
        </Field>
        <p className="mt-3 text-sm leading-6 text-muted">
          {isUpdate
            ? "Diese Kontaktdaten sind nur für Rückfragen zur Prüfung hilfreich. Sie müssen sie nicht erneut eintragen, wenn Sie nur Leistungen, Logo oder Profildaten ergänzen möchten."
            : "Beschreiben Sie kurz und sachlich, welche Leistungen Sie anbieten. Keine Werbetexte, keine irreführenden Angaben."}
        </p>
        <label className="mt-5 flex items-start gap-3 text-sm font-medium leading-6 text-ink">
          <input className="mt-1 h-4 w-4 accent-action" name="is_authorized" required type="checkbox" />
          Ich bin berechtigt, diesen Betrieb zu vertreten.
        </label>
        {errors.is_authorized ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.is_authorized}</p> : null}
      </WizardSection>
      <SocialLinksFields initialLinks={initialSubmission?.premium_submission_payload?.social_links || []} />
      <WizardSection eyebrow="Schritt 5" title="Profil vervollständigen">
        <p className="mb-5 text-sm leading-6 text-muted">
          Logo und Ansprechpartnerbild sind freiwillig. Diese Angaben werden geprüft, bevor sie öffentlich im Profil erscheinen.
          Bereits eingereichte Angaben sind vorausgefüllt, damit Sie sie ergänzen oder ändern können.
        </p>
        {company.logo_url || company.profile_image_url ? (
          <div className="mb-5 grid gap-3 rounded-md border border-line bg-[#fbfcff] p-4 text-sm text-ink sm:grid-cols-2">
            <p>
              <span className="font-semibold">Logo:</span>{" "}
              {company.logo_url ? "bereits im Profil hinterlegt" : "noch nicht hinterlegt"}
            </p>
            <p>
              <span className="font-semibold">Ansprechpartnerbild:</span>{" "}
              {company.profile_image_url ? "bereits im Profil hinterlegt" : "noch nicht hinterlegt"}
            </p>
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <MediaFileField
            accept="image/jpeg,image/png,image/webp"
            error={errors.companyLogo}
            help="JPG, PNG oder WebP. Maximal 2 MB. SVG, GIF und PDF sind nicht erlaubt."
            label="Logo hochladen"
            maxBytes={2 * 1024 * 1024}
            name="companyLogo"
            onMediaChange={setLogoFileSelected}
          />
          <MediaFileField
            accept="image/jpeg,image/png,image/webp"
            error={errors.contactProfileImage}
            help="JPG, PNG oder WebP. Maximal 5 MB. Nur mit Zustimmung der abgebildeten Person einreichen."
            label="Ansprechpartnerbild hochladen"
            maxBytes={5 * 1024 * 1024}
            name="contactProfileImage"
            onMediaChange={setContactImageFileSelected}
          />
          <Field label="Ansprechpartner Name" error={errors.mediaContactName}>
            <input
              className={inputClass}
              defaultValue={mediaContactName}
              name="mediaContactName"
            />
          </Field>
          <Field label="Rolle/Funktion" error={errors.mediaContactRole}>
            <input
              className={inputClass}
              defaultValue={mediaContactRole}
              name="mediaContactRole"
              placeholder="z. B. Inhaber, Geschäftsführung, Büro"
            />
          </Field>
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm font-medium leading-6 text-ink">
          <input className="mt-1 h-4 w-4 accent-action" name="imageConsentGiven" required={mediaFilesSelected} type="checkbox" />
          Ich bin berechtigt, diese Bilder für den Betrieb einzureichen.
        </label>
        {errors.imageConsentGiven ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.imageConsentGiven}</p> : null}
      </WizardSection>
      <WizardSection eyebrow="Optional" title="Verifiziertes Startprofil anfragen">
        <PremiumSubmissionFields />
      </WizardSection>
      <WizardSection eyebrow="Schritt 6" title="Zusammenfassung prüfen">
        <div className="grid gap-4">
          <SummaryBlock title="Betrieb">
            <SummaryLine label="Firmenname" value={profile.companyName} />
            <SummaryLine label="Ort" value={`${profile.postalCode} ${profile.city}`.trim()} />
            <SummaryLine label="Website" value={profile.website || "Nicht hinterlegt"} />
            <SummaryLine label="Öffentliche E-Mail" value={profile.publicEmail || "Nicht hinterlegt"} />
          </SummaryBlock>
          <SummaryBlock title="Ausgewählte Gewerke">
            {selectedTrades.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedTrades.map((slug) => (
                  <span key={slug} className="rounded-md border border-line bg-[#fbfcff] px-3 py-1 text-sm font-semibold text-ink">
                    {tradeLabels.get(slug) || slug}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-[#a4442b]">Noch kein Gewerk ausgewählt.</p>
            )}
          </SummaryBlock>
          <SummaryBlock title="Ausgewählte Leistungen">
            {selectedServices.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {selectedServices.map((service) => (
                  <li key={service} className="rounded-md border border-line bg-[#fbfcff] px-3 py-2 text-sm text-ink">
                    {service}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-[#7a4a00]">
                Noch keine konkrete Leistung ausgewählt. Das Profil kann eingereicht werden, aber Detailleistungen
                verbessern die Auffindbarkeit.
              </p>
            )}
            {missingServices ? <p className="mt-3 text-sm leading-6 text-muted">Vorgeschlagen: {missingServices}</p> : null}
          </SummaryBlock>
          <SummaryBlock title="Ansprechpartner">
            <SummaryLine label="Name" value={contact.name || "Nicht eingetragen"} />
            <SummaryLine label="E-Mail" value={contact.email || "Nicht eingetragen"} />
            <SummaryLine label="Telefon" value={contact.phone || "Nicht eingetragen"} />
            <SummaryLine label="Funktion" value={contact.role || "Nicht eingetragen"} />
          </SummaryBlock>
        </div>
        <input name="verification_document_later" type="hidden" value="on" />
        <p className="mt-5 rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-xs leading-5 text-muted">
          Die Angaben werden als Korrekturvorschlag eingereicht und geprüft, bevor Änderungen veröffentlicht werden.
          Das bestehende öffentliche Profil bleibt bis dahin unverändert. Eine spätere Datenbestätigung ist keine
          Qualitätsbewertung und keine Empfehlung.
        </p>
        <label className="mt-5 flex items-start gap-3 text-sm font-medium leading-6 text-ink">
          <input className="mt-1 h-4 w-4 accent-action" name="consent_privacy" required type="checkbox" />
          <span>
            Ich habe die <a className="text-action hover:underline" href="/datenschutz">Datenschutzerklärung</a> gelesen und
            stimme der Verarbeitung meiner Angaben zur Bearbeitung dieser Anfrage zu.
          </span>
        </label>
        {errors.consent_privacy ? <p className="mt-2 text-xs font-semibold text-[#a4442b]">{errors.consent_privacy}</p> : null}
        {state.message ? (
          <div
            aria-live="polite"
            role={state.ok ? "status" : "alert"}
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
          {pending ? "Wird eingereicht..." : isUpdate ? "Profilergänzung zur Prüfung einreichen" : "Profil zur Prüfung einreichen"}
        </button>
      </WizardSection>
    </form>
  );
}
function WizardSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-white p-4 shadow-soft sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-normal text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">{title}</h2>
      <div className="mt-5">{children}</div>
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
    <label className="grid gap-2 rounded-lg border border-line bg-[#fbfcff] p-4 text-sm font-semibold text-ink">
      {label}
      <input
        accept={accept}
        className="rounded-md border border-line bg-white px-3 py-2 text-sm"
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
          onMediaChange(Boolean(file));
          event.target.reportValidity();
        }}
        type="file"
      />
      <span className="text-xs font-normal leading-5 text-muted">{help}</span>
      {error ? <span className="text-xs font-semibold text-[#a4442b]">{error}</span> : null}
    </label>
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
function SummaryBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-[#fbfcff] p-4">
      <h3 className="text-sm font-semibold text-brand">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-line py-2 text-sm last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)]">
      <span className="font-semibold text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
const inputClass = "w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-action";
