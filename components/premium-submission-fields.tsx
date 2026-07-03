"use client";

import { useState } from "react";

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
            Mehrere Premium-Medien werden hier zunächst als Link, Cloudordner oder Hinweis eingereicht. Dadurch bleiben
            die Daten vollständig reviewfähig; veröffentlicht wird nichts ohne Admin-Prüfung.
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
                <Field label="Bildlink oder Hinweis optional">
                  <input className={inputClass} name="premiumContactImageNote" placeholder="Link, Cloudordner oder Hinweis für Admin-Upload" />
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
                <Field label="Bildlink oder Hinweis optional">
                  <input className={inputClass} name="premiumTeamImageNote" placeholder="Link, Cloudordner oder Hinweis für Admin-Upload" />
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
                <Field label="Jahr optional">
                  <input className={inputClass} name="premiumReferenceYear" inputMode="numeric" />
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
                <input name="premiumReferenceSortOrder" type="hidden" value={index + 1} />
              </div>
            )}
          </DynamicGroup>

          <DynamicGroup addLabel="Referenzbild-Hinweis hinzufügen" count={counts.media} onAdd={() => addItem("media")} title="Referenzbilder">
            {() => (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Zugehörige Referenz optional">
                  <input className={inputClass} name="premiumReferenceMediaReferenceTitle" />
                </Field>
                <Field label="Bildlink, Cloudordner oder Hinweis">
                  <input className={inputClass} name="premiumReferenceMediaFileNote" placeholder="URL oder Ablagehinweis" />
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
                <Field label="PDF-/Bildlink oder Hinweis optional">
                  <input className={inputClass} name="premiumCertificateFileNote" placeholder="URL oder Ablagehinweis" />
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
