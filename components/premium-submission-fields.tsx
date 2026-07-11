"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

type GroupKey = "contacts" | "team" | "references" | "media" | "certificates";

const inputClass = "w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-action";
const textareaClass = "min-h-24 w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-action";

export function PremiumSubmissionFields() {
  const [enabled, setEnabled] = useState(false);
  const [counts, setCounts] = useState<Record<GroupKey, number>>({
    contacts: 1,
    team: 1,
    references: 1,
    media: 1,
    certificates: 1,
  });

  function addItem(key: GroupKey) {
    setCounts((current) => ({ ...current, [key]: current[key] + 1 }));
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-[#9bbbd2] bg-white p-4 shadow-soft sm:p-6">
      <div className="mb-5 rounded-md border border-line bg-[#fbfcff] p-4 text-sm leading-6 text-muted">
        <div className="font-semibold text-ink">Zeigen Sie, was Ihr Betrieb geleistet hat.</div>
        <p className="mt-1">
          Ihr Basisprofil macht Ihren Betrieb auffindbar. Referenzen, Bilder, Team und Nachweise machen ihn auswählbar.
        </p>
      </div>
      <label className="flex min-w-0 items-start gap-3 text-sm font-semibold leading-6 text-ink">
        <input
          checked={enabled}
          className="mt-1 h-4 w-4 shrink-0 accent-action"
          name="premiumStartProfileRequested"
          onChange={(event) => setEnabled(event.target.checked)}
          type="checkbox"
        />
        <span>
          Verifiziertes Startprofil für 490 € netto / 12 Monate anfragen
          <span className="mt-1 block text-sm font-normal leading-6 text-muted">
            Sie müssen nicht alles perfekt vorbereiten. Reichen Sie ein, was vorhanden ist. Wir strukturieren daraus Ihr
            GewerkeListe-Profil.
          </span>
        </span>
      </label>

      {enabled ? (
        <div className="mt-6 grid gap-6">
          <p className="rounded-md border border-line bg-[#fbfcff] px-4 py-3 text-xs leading-5 text-muted">
            Sie können Ihre Referenzen und Bilder zur Prüfung einreichen. Nach Freigabe und Aktivierung des
            verifizierten Profils werden die Inhalte veröffentlicht.
          </p>

          <DynamicGroup
            addLabel="Ansprechpartner hinzufügen"
            count={counts.contacts}
            onAdd={() => addItem("contacts")}
            title="Mehrere Ansprechpartner"
          >
            {(index) => (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <input className={inputClass} name="premiumContactName" />
                </Field>
                <Field label="Rolle/Funktion">
                  <input className={inputClass} name="premiumContactRole" placeholder="z. B. Geschäftsführung, Bauleitung" />
                </Field>
                <Field label="Telefon optional">
                  <input className={inputClass} name="premiumContactPhone" inputMode="tel" />
                </Field>
                <Field label="E-Mail optional">
                  <input className={inputClass} name="premiumContactEmail" type="email" />
                </Field>
                <Field label="Bild optional">
                  <UploadField
                    accept="image/jpeg,image/png,image/webp"
                    help="JPG, PNG oder WebP. Maximal 10 MB."
                    name="premiumContactImageFile"
                    preview="image"
                  />
                </Field>
                <Field label="Bildhinweis optional">
                  <input className={inputClass} name="premiumContactImageNote" placeholder="z. B. Bild folgt später oder besondere Freigabehinweise" />
                </Field>
                <input name="premiumContactSortOrder" type="hidden" value={index + 1} />
              </div>
            )}
          </DynamicGroup>

          <DynamicGroup addLabel="Teammitglied hinzufügen" count={counts.team} onAdd={() => addItem("team")} title="Teamvorstellung">
            {(index) => (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <input className={inputClass} name="premiumTeamName" />
                </Field>
                <Field label="Rolle/Funktion">
                  <input className={inputClass} name="premiumTeamRole" />
                </Field>
                <Field label="Bild optional">
                  <UploadField
                    accept="image/jpeg,image/png,image/webp"
                    help="JPG, PNG oder WebP. Maximal 10 MB."
                    name="premiumTeamImageFile"
                    preview="image"
                  />
                </Field>
                <Field label="Bildhinweis optional">
                  <input className={inputClass} name="premiumTeamImageNote" placeholder="z. B. Teamfoto folgt später" />
                </Field>
                <Field label="Kurzbeschreibung">
                  <textarea className={textareaClass} name="premiumTeamDescription" />
                </Field>
                <input name="premiumTeamSortOrder" type="hidden" value={index + 1} />
              </div>
            )}
          </DynamicGroup>

          <DynamicGroup addLabel="Referenz hinzufügen" count={counts.references} onAdd={() => addItem("references")} title="Referenzen">
            {(index) => (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Referenztitel">
                  <input className={inputClass} name="premiumReferenceTitle" placeholder="z. B. Sanierung Mehrfamilienhaus" />
                </Field>
                <Field label="Ort">
                  <input className={inputClass} name="premiumReferenceLocation" />
                </Field>
                <Field label="Jahr oder Zeitraum optional">
                  <input className={inputClass} name="premiumReferenceYear" placeholder="z. B. 2025 oder 2024-2025" />
                </Field>
                <Field label="Projektart">
                  <input className={inputClass} name="premiumReferenceProjectType" placeholder="z. B. Neubau, Umbau, Sanierung" />
                </Field>
                <Field label="Ausgeführte Leistungen">
                  <textarea className={textareaClass} name="premiumReferenceServices" placeholder="Kommagetrennt oder je Zeile" />
                </Field>
                <Field label="Kundentyp optional">
                  <input className={inputClass} name="premiumReferenceClientType" placeholder="privat, gewerblich, öffentlich, Hausverwaltung" />
                </Field>
                <Field label="Beschreibung">
                  <textarea className={textareaClass} name="premiumReferenceDescription" />
                </Field>
                <Field label="Herausforderung optional">
                  <textarea className={textareaClass} name="premiumReferenceChallenge" />
                </Field>
                <Field label="Lösung optional">
                  <textarea className={textareaClass} name="premiumReferenceSolution" />
                </Field>
                <input name="premiumReferenceSortOrder" type="hidden" value={index + 1} />
              </div>
            )}
          </DynamicGroup>

          <DynamicGroup addLabel="Referenzbild hinzufügen" count={counts.media} onAdd={() => addItem("media")} title="Referenzbilder">
            {() => (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Zugehörige Referenz optional">
                  <input className={inputClass} name="premiumReferenceMediaReferenceTitle" />
                </Field>
                <Field label="Bilddatei optional">
                  <UploadField
                    accept="image/jpeg,image/png,image/webp"
                    help="JPG, PNG oder WebP. Maximal 10 MB."
                    name="premiumReferenceMediaFile"
                    preview="image"
                  />
                </Field>
                <Field label="Dateihinweis optional">
                  <input className={inputClass} name="premiumReferenceMediaFileNote" placeholder="z. B. Bild folgt später" />
                </Field>
                <Field label="Bildtitel/Beschreibung optional">
                  <input className={inputClass} name="premiumReferenceMediaCaption" />
                </Field>
                <Field label="Alt-Text optional">
                  <input className={inputClass} name="premiumReferenceMediaAltText" />
                </Field>
              </div>
            )}
          </DynamicGroup>

          <DynamicGroup addLabel="Nachweis hinzufügen" count={counts.certificates} onAdd={() => addItem("certificates")} title="Nachweise und Zertifikate">
            {() => (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Titel">
                  <input className={inputClass} name="premiumCertificateTitle" />
                </Field>
                <Field label="Aussteller optional">
                  <input className={inputClass} name="premiumCertificateIssuer" />
                </Field>
                <Field label="Gültig bis optional">
                  <input className={inputClass} name="premiumCertificateValidUntil" type="date" />
                </Field>
                <Field label="PDF oder Bild optional">
                  <UploadField
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    help="PDF, JPG, PNG oder WebP. Maximal 10 MB."
                    name="premiumCertificateFile"
                    preview="file"
                  />
                </Field>
                <Field label="Dateihinweis optional">
                  <input className={inputClass} name="premiumCertificateFileNote" placeholder="z. B. Nachweis wird nachgereicht" />
                </Field>
                <Field label="Beschreibung">
                  <textarea className={textareaClass} name="premiumCertificateDescription" />
                </Field>
              </div>
            )}
          </DynamicGroup>

          <Field label="Weitere Hinweise zur Profilaufbereitung">
            <textarea
              className={textareaClass}
              name="premiumSubmissionNotes"
              placeholder="Was soll bei der Aufbereitung besonders beachtet werden?"
            />
          </Field>
          <label className="flex items-start gap-3 rounded-md border border-line bg-white p-4 text-sm font-medium leading-6 text-ink">
            <input className="mt-1 h-4 w-4 accent-action" name="premiumMediaConsentGiven" type="checkbox" />
            <span>
              Ich bin berechtigt, diese Zusatzbilder und Dateien für den Betrieb einzureichen. Personenbilder wurden von
              den abgebildeten Personen freigegeben.
            </span>
          </label>
          <div className="rounded-md border border-[#b9dec8] bg-[#f1fbf5] p-4 text-sm leading-6 text-[#24523a]">
            <div className="font-semibold text-ink">Ihre Referenzen sind vorbereitet.</div>
            <p className="mt-1">
              Mit dem verifizierten Profil werden freigegebene Referenzen öffentlich präsentiert und stärken das
              Vertrauen potenzieller Auftraggeber.
            </p>
            <a
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-sm font-semibold text-white hover:bg-brand"
              href={`mailto:${siteConfig.publicContactEmail}?subject=${encodeURIComponent("Verifiziertes Profil anfragen")}`}
            >
              Verifiziertes Profil anfragen
            </a>
            <p className="mt-2 text-xs leading-5">Verifiziertes Profil – 490 € netto für 12 Monate.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DynamicGroup({
  addLabel,
  children,
  count,
  onAdd,
  title,
}: {
  addLabel: string;
  children: (index: number) => React.ReactNode;
  count: number;
  onAdd: () => void;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-[#fbfcff] p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h3 className="text-base font-semibold text-brand">{title}</h3>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
          onClick={onAdd}
          type="button"
        >
          {addLabel}
        </button>
      </div>
      <div className="mt-4 grid gap-4">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="rounded-md border border-line bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-normal text-muted">
              {title} {index + 1}
            </p>
            {children(index)}
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">
      <span>{label}</span>
      {children}
    </label>
  );
}

function UploadField({
  accept,
  help,
  name,
  preview,
}: {
  accept: string;
  help: string;
  name: string;
  preview: "image" | "file";
}) {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="grid gap-2">
      <input
        accept={accept}
        className="w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 text-xs sm:text-sm"
        name={name}
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          const allowedTypes =
            preview === "image"
              ? ["image/jpeg", "image/png", "image/webp"]
              : ["application/pdf", "image/jpeg", "image/png", "image/webp"];
          event.target.setCustomValidity("");
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
          setFileName(file?.name || "");
          if (file && !allowedTypes.includes(file.type)) {
            event.target.setCustomValidity(
              preview === "image" ? "Bitte nur JPG, PNG oder WebP hochladen." : "Bitte nur PDF, JPG, PNG oder WebP hochladen.",
            );
          } else if (file && file.size > 10 * 1024 * 1024) {
            event.target.setCustomValidity("Die Datei ist zu groß. Maximal 10 MB sind erlaubt.");
          } else if (file && file.type.startsWith("image/")) {
            setPreviewUrl(URL.createObjectURL(file));
          }
          event.target.reportValidity();
        }}
        type="file"
      />
      <span className="text-xs font-normal leading-5 text-muted">{help}</span>
      {previewUrl ? (
        <img alt="" className="h-28 w-full rounded-md border border-line bg-white object-contain p-2" src={previewUrl} />
      ) : fileName ? (
        <span className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-muted">{fileName}</span>
      ) : null}
    </div>
  );
}
