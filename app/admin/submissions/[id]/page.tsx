import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { approveSubmission, setSubmissionStatus, updateSubmission } from "@/lib/actions";
import { getCompanySubmission, getSubmissionDuplicates } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { tradeTaxonomy } from "@/lib/trade-taxonomy";
import type { CompanyPremiumSubmissionPayload, CompanySubmission } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SubmissionDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  try {
    const submission = await getCompanySubmission(id);
    const duplicates = await getSubmissionDuplicates(submission);
    const approvedSlug = typeof query.approved === "string" ? query.approved : null;
    const errorMessage = typeof query.error === "string" ? query.error : null;
    const media = await getSubmissionMedia(submission);

    return (
      <Shell>
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link className="text-sm font-semibold text-brand hover:underline" href="/admin/submissions">
              Zurück zu Einreichungen
            </Link>
            <h1 className="mt-2 text-3xl font-semibold text-ink">{submission.company_name}</h1>
            <p className="mt-2 text-sm text-muted">
              Eingereicht am {formatDate(submission.created_at)} · {submission.postal_code} {submission.city}
            </p>
          </div>
          <StatusBadge status={submission.status} />
        </div>

        {approvedSlug ? (
          <div className="mb-6 rounded-lg border border-[#b9e2c2] bg-[#f2fbf4] p-4 text-sm font-semibold text-[#245b37]">
            Ein öffentlicher Betriebseintrag wurde vorbereitet:
            <Link className="ml-1 underline" href={`/firma/${approvedSlug}` as Route}>
              Profil ansehen
            </Link>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-[#f0b4b4] bg-[#fff5f5] p-4 text-sm font-semibold text-[#8a1f1f]">
            Freigabe nicht abgeschlossen: {errorMessage}
          </div>
        ) : null}

        <section className="mb-6 grid gap-4 lg:grid-cols-4">
          <InfoCard title="Status" value={statusLabel(submission.status)} />
          <InfoCard title="Erstes Gewerk" value={tradeLabel(submission.primary_trade)} />
          <InfoCard title="Leistungen" value={`${submission.selected_services.length} ausgewählt`} />
          <InfoCard title="Gründungsbetrieb" value={submission.wants_founder_verification ? "angefragt" : "nein"} />
        </section>

        {duplicates.length > 0 ? (
          <section className="mb-6 rounded-lg border border-[#f1d08a] bg-[#fff8e8] p-5">
            <h2 className="text-lg font-semibold text-[#6d4a00]">Möglicher bestehender Eintrag gefunden</h2>
            <div className="mt-4 grid gap-3">
              {duplicates.map((company) => (
                <div key={company.id} className="rounded-md border border-[#f1d08a] bg-white p-4 text-sm">
                  <div className="font-semibold text-ink">{company.name}</div>
                  <div className="text-muted">
                    {company.postal_code} {company.city} · {company.reason}
                  </div>
                  <Link className="mt-2 inline-flex text-brand hover:underline" href={`/firma/${company.slug}` as Route}>
                    Bestehenden Eintrag ansehen
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6d4a00]">
              Keine automatische Zusammenführung. Bestehenden Eintrag prüfen oder diesen Fall als Claim-Fall behandeln.
            </p>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-6">
            <ReadSection title="Betriebsdaten">
              <Data label="Firmenname" value={submission.company_name} />
              <Data label="Rechtsform" value={submission.legal_form} />
              <Data label="Website" value={submission.website} />
              <Data label="Telefon" value={submission.phone} />
              <Data label="E-Mail" value={submission.email} />
              <Data label="Kontakt-E-Mail" value={submission.contact_email} />
            </ReadSection>

            <ReadSection title="Ansprechpartner">
              <Data label="Name" value={[submission.contact_first_name, submission.contact_last_name].filter(Boolean).join(" ")} />
              <Data label="Funktion" value={submission.contact_role} />
              <Data label="E-Mail" value={submission.contact_person_email} />
              <Data label="Telefon" value={submission.contact_person_phone} />
            </ReadSection>

            <ReadSection title="Medien zur Prüfung">
              <div className="grid gap-4 md:grid-cols-2">
                <MediaPreview
                  alt={`${submission.company_name} Firmenlogo`}
                  emptyText="Kein Firmenlogo hochgeladen."
                  label="Firmenlogo"
                  note="Logo kann nach fachlicher Prüfung in den öffentlichen Betriebseintrag übernommen werden."
                  src={media.logo.previewUrl}
                  storedValue={submission.logo_url}
                  status={mediaStatusLabel(media.logo.status, "Neu hochgeladen")}
                />
                <MediaPreview
                  alt={submission.profile_image_alt || `${submission.company_name} Ansprechpartnerbild`}
                  emptyText="Kein Ansprechpartnerbild hochgeladen."
                  label="Ansprechpartnerbild / Kontaktbild"
                  note="Personenbild nur veröffentlichen, wenn Berechtigung und Zustimmung plausibel sind. Nicht automatisch bei unbestätigten Basisprofilen anzeigen."
                  src={media.profileImage.previewUrl}
                  storedValue={submission.profile_image_url}
                  status={mediaStatusLabel(media.profileImage.status, "Zur Prüfung")}
                />
              </div>
              <div className="grid gap-3 rounded-md border border-line bg-white p-4">
                <Data label="Ansprechpartner Name pending" value={submission.contact_person_name} />
                <Data label="Rolle/Funktion pending" value={submission.contact_person_role} />
              </div>
              <div className="rounded-md border border-line bg-panel p-4 text-xs leading-5 text-muted">
                <div className="font-semibold text-ink">Datenschutz-Hinweis</div>
                <p className="mt-1">
                  Firmenlogo und Ansprechpartnerbild wurden vom Einreicher hochgeladen. Ein Ansprechpartnerbild ist
                  personenbezogen und darf erst nach plausibler Berechtigung/Zustimmung öffentlich verwendet werden.
                </p>
                <p className="mt-2">
                  Zustimmung laut Formular: {submission.image_consent_given ? "ja" : "nein"}
                  {submission.image_consent_timestamp ? ` · ${formatDate(submission.image_consent_timestamp)}` : ""}
                </p>
              </div>
            </ReadSection>

            <ReadSection title="Standort">
              <Data label="Adresse" value={[submission.street, submission.house_number].filter(Boolean).join(" ")} />
              <Data label="PLZ / Ort" value={`${submission.postal_code} ${submission.city}`} />
              <Data label="Region" value={submission.region} />
              <Data label="Land" value={submission.country} />
            </ReadSection>

            <ReadSection title="Gewerke und Leistungen">
              <Data label="Erstes Gewerk" value={tradeLabel(submission.primary_trade)} />
              <TagList label="Weitere Gewerke" items={submission.secondary_trades.map(tradeLabel)} />
              <TagList label="Leistungen" items={submission.selected_services} />
              <TagList label="Spezialisierungen" items={submission.specializations} />
            </ReadSection>

            <ReadSection title="Tätigkeitsgebiet">
              <Data label="Radius" value={`${submission.service_radius_km} km`} />
              <TagList label="Orte / Regionen" items={submission.service_regions} />
              <TagList label="PLZ-Gebiete" items={submission.postal_codes} />
              <TagList label="Länder" items={submission.service_countries} />
            </ReadSection>

            <ReadSection title="Beschreibung und Nachweise">
              <Data label="Kurzbeschreibung" value={submission.short_description} />
              <Data label="Beschreibung" value={submission.description} multiline />
              <Data label="Referenzen" value={submission.references_text} multiline />
              <TagList label="Innung / Kammer" items={submission.memberships} />
              <TagList label="Zertifikate" items={submission.certificates} />
              <TagList label="Herstellerzertifikate" items={submission.manufacturer_certificates} />
            </ReadSection>

            <PremiumSubmissionReview payload={submission.premium_submission_payload} />
          </div>

          <aside className="grid gap-6 content-start">
            <ReadSection title="Basiseintrag / Fördermodell">
              <Data label="Basiseintrag prüfen" value={submission.wants_founder_verification ? "ja" : "nein"} />
              <Data label="Förderbeitrag angefragt" value={supportLabel(submission)} />
              <Data label="Rechnung auf Wunsch" value={submission.support_invoice_requested ? "ja" : "nein"} />
              <p className="text-xs leading-5 text-muted">
                Der freiwillige Förderbeitrag hat keinen Einfluss auf Freigabe, Darstellung oder Verifizierung des Basiseintrags.
              </p>
            </ReadSection>

            <ReadSection title="Consent">
              <Data label="Berechtigt" value={submission.consent_authorized ? "ja" : "nein"} />
              <Data label="Daten korrekt" value={submission.consent_data_correct ? "ja" : "nein"} />
              <Data label="Datenschutz gelesen" value={submission.consent_privacy ? "ja" : "nein"} />
            </ReadSection>

            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Status und interne Notiz</h2>
              <form action={setSubmissionStatus} className="mt-4 grid gap-3">
                <input name="id" type="hidden" value={submission.id} />
                <select className="rounded-md border border-line px-3 py-2 text-sm" name="status" defaultValue={submission.status}>
                  <option value="submitted">Neu</option>
                  <option value="in_review">In Prüfung</option>
                  <option value="needs_info">Rückfrage erforderlich</option>
                  <option value="rejected">Abgelehnt</option>
                </select>
                <textarea className="min-h-24 rounded-md border border-line px-3 py-2 text-sm" name="admin_notes" placeholder="Interne Notiz / Grund für Rückfrage oder Ablehnung" defaultValue={submission.admin_notes || ""} />
                <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Status speichern</button>
              </form>
              <p className="mt-3 text-xs leading-5 text-muted">
                Interne Notizen werden in der Einreichung gespeichert und sind nicht öffentlich sichtbar.
              </p>
            </section>

            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Diesen Betriebseintrag freigeben?</h2>
              <div className="mt-4 rounded-md border border-line bg-panel p-4 text-sm leading-6 text-ink">
                <div><strong>Firma:</strong> {submission.company_name}</div>
                <div><strong>Ort:</strong> {submission.postal_code} {submission.city}</div>
                <div><strong>Gewerk:</strong> {tradeLabel(submission.primary_trade)}</div>
                <div><strong>Leistungen:</strong> {submission.selected_services.join(", ") || "keine"}</div>
              </div>
              <form action={approveSubmission} className="mt-4 grid gap-3">
                <input name="id" type="hidden" value={submission.id} />
                <label className="flex items-start gap-3 text-sm font-medium text-ink">
                  <input className="mt-1 h-4 w-4 accent-brand" name="verified" type="checkbox" defaultChecked={submission.wants_founder_verification} />
                  Betriebsdaten bestätigt
                </label>
                <label className="flex items-start gap-3 text-sm font-medium text-ink">
                  <input className="mt-1 h-4 w-4 accent-brand" name="verified_start_profile" type="checkbox" defaultChecked={submission.wants_founder_verification} />
                  Als verifiziertes Startprofil freigeben
                </label>
                <label className="flex items-start gap-3 text-sm font-medium text-ink">
                  <input className="mt-1 h-4 w-4 accent-brand" name="public_visible" type="checkbox" defaultChecked />
                  Öffentlichen Firmeneintrag erzeugen
                </label>
                <button disabled={submission.status === "approved"} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  Freigeben und Firmeneintrag erzeugen
                </button>
              </form>
            </section>
          </aside>
        </div>

        <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Einreichung bearbeiten</h2>
          <form action={updateSubmission} className="mt-5 grid gap-4 md:grid-cols-2">
            <input name="id" type="hidden" value={submission.id} />
            <Field label="Firmenname" name="company_name" value={submission.company_name} />
            <Field label="Rechtsform" name="legal_form" value={submission.legal_form} />
            <Field label="Website" name="website" value={submission.website} />
            <Field label="Telefon" name="phone" value={submission.phone} />
            <Field label="E-Mail" name="email" value={submission.email} />
            <Field label="Straße" name="street" value={submission.street} />
            <Field label="Hausnummer" name="house_number" value={submission.house_number} />
            <Field label="PLZ" name="postal_code" value={submission.postal_code} />
            <Field label="Ort" name="city" value={submission.city} />
            <Field label="Region" name="region" value={submission.region} />
            <Field label="Land" name="country" value={submission.country} />
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Erstes Gewerk
              <select className="rounded-md border border-line px-3 py-2 text-sm" name="primary_trade" defaultValue={submission.primary_trade}>
                {tradeTaxonomy.map((trade) => (
                  <option key={trade.slug} value={trade.slug}>
                    {trade.name}
                  </option>
                ))}
              </select>
            </label>
            <TextArea label="Weitere Gewerke" name="secondary_trades" value={submission.secondary_trades.join("\n")} />
            <TextArea label="Leistungen" name="selected_services" value={submission.selected_services.join("\n")} />
            <Field label="Einsatzradius km" name="service_radius_km" value={String(submission.service_radius_km)} />
            <TextArea label="Orte / Regionen" name="service_regions" value={submission.service_regions.join("\n")} />
            <TextArea label="PLZ-Gebiete" name="postal_codes" value={submission.postal_codes.join("\n")} />
            <TextArea label="Kurzbeschreibung" name="short_description" value={submission.short_description} wide />
            <TextArea label="Beschreibung" name="description" value={submission.description || ""} wide />
            <div className="md:col-span-2">
              <button disabled={submission.status === "approved"} className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel disabled:opacity-50">
                Änderungen in Submission speichern
              </button>
            </div>
          </form>
        </section>
      </Shell>
    );
  } catch {
    notFound();
  }
}

function ReadSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function Data({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</dt>
      <dd className={`text-sm text-ink ${multiline ? "whitespace-pre-line leading-6" : ""}`}>{value || "Nicht angegeben"}</dd>
    </div>
  );
}

function TagList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length > 0 ? items.map((item) => <span key={item} className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink">{item}</span>) : <span className="text-sm text-muted">Nicht angegeben</span>}
      </div>
    </div>
  );
}

function PremiumSubmissionReview({ payload }: { payload: CompanyPremiumSubmissionPayload | null }) {
  if (!payload?.requested) return null;

  return (
    <ReadSection title="Verifiziertes Startprofil angefragt">
      <div className="rounded-md border border-[#9bbbd2] bg-[#f1f7fb] p-4 text-sm leading-6 text-[#17395c]">
        <div className="font-semibold text-ink">Vom Betrieb eingereicht, noch nicht öffentlich</div>
        <p className="mt-1">
          Diese Angaben dienen als Arbeitsgrundlage für das verifizierte Startprofil. Sie werden nicht automatisch in
          öffentliche Premium-Module übernommen.
        </p>
      </div>
      <PremiumList title="Ansprechpartner" items={payload.contacts} render={(item) => (
        <>
          <Data label="Name" value={item.name} />
          <Data label="Rolle" value={item.role} />
          <Data label="Telefon" value={item.phone} />
          <Data label="E-Mail" value={item.email} />
          <Data label="Bildlink / Hinweis" value={item.image_note} multiline />
        </>
      )} />
      <PremiumList title="Teamvorstellung" items={payload.team_members} render={(item) => (
        <>
          <Data label="Name" value={item.name} />
          <Data label="Rolle" value={item.role} />
          <Data label="Beschreibung" value={item.description} multiline />
          <Data label="Bildlink / Hinweis" value={item.image_note} multiline />
        </>
      )} />
      <PremiumList title="Referenzen" items={payload.references} render={(item) => (
        <>
          <Data label="Titel" value={item.title} />
          <Data label="Ort" value={item.location} />
          <Data label="Jahr" value={item.year ? String(item.year) : null} />
          <Data label="Projektart" value={item.project_type} />
          <TagList label="Leistungen" items={item.services} />
          <Data label="Beschreibung" value={item.description} multiline />
          <Data label="Kundentyp" value={item.client_type} />
        </>
      )} />
      <PremiumList title="Referenzbilder / Medienhinweise" items={payload.reference_media} render={(item) => (
        <>
          <Data label="Referenz" value={item.reference_title} />
          <Data label="Link / Hinweis" value={item.file_note} multiline />
          <Data label="Bildtitel / Beschreibung" value={item.caption} multiline />
          <Data label="Alt-Text" value={item.alt_text} />
        </>
      )} />
      <PremiumList title="Nachweise / Zertifikate" items={payload.certificates} render={(item) => (
        <>
          <Data label="Titel" value={item.title} />
          <Data label="Aussteller" value={item.issuer} />
          <Data label="Gültig bis" value={item.valid_until} />
          <Data label="Beschreibung" value={item.description} multiline />
          <Data label="PDF-/Bildlink / Hinweis" value={item.file_note} multiline />
        </>
      )} />
      <Data label="Weitere Hinweise" value={payload.notes} multiline />
    </ReadSection>
  );
}

function PremiumList<T>({ items, render, title }: { items: T[]; render: (item: T) => React.ReactNode; title: string }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfcff] p-4">
      <h3 className="text-sm font-semibold text-brand">{title}</h3>
      {items.length ? (
        <div className="mt-3 grid gap-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-line bg-white p-4">
              {render(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">Nicht angegeben</p>
      )}
    </div>
  );
}

function MediaPreview({
  alt,
  emptyText,
  label,
  note,
  src,
  storedValue,
  status,
}: {
  alt: string;
  emptyText: string;
  label: string;
  note: string;
  src?: string | null;
  storedValue?: string | null;
  status: string;
}) {
  return (
    <div className="rounded-md border border-line bg-[#fbfcff] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink">{label}</div>
        <span className="rounded-full border border-line bg-white px-2 py-1 text-xs font-semibold text-muted">{status}</span>
      </div>
      {src ? (
        <>
          <a className="mt-3 block overflow-hidden rounded-md border border-line bg-white" href={src} rel="noreferrer" target="_blank">
            <img alt={alt} className="h-44 w-full object-contain p-3" src={src} />
          </a>
          <div className="mt-2 break-all text-xs text-muted">{storedValue || src}</div>
        </>
      ) : storedValue ? (
        <div className="mt-3 rounded-md border border-[#f1d08a] bg-[#fff8e8] px-4 py-6 text-sm leading-6 text-[#6d4a00]">
          Upload-Pfad gespeichert, aber Datei aktuell nicht abrufbar.
          <div className="mt-2 break-all text-xs">{storedValue}</div>
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-muted">
          Kein Upload gespeichert. {emptyText}
        </div>
      )}
      <p className="mt-3 text-xs leading-5 text-muted">{note}</p>
    </div>
  );
}

async function getSubmissionMedia(submission: CompanySubmission) {
  const [logo, profileImage] = await Promise.all([
    resolveSubmissionMedia(submission.logo_url),
    resolveSubmissionMedia(submission.profile_image_url),
  ]);

  return { logo, profileImage };
}

async function resolveSubmissionMedia(value: string | null) {
  if (!value) return { previewUrl: null as string | null, status: "missing" as const };
  if (/^https?:\/\//i.test(value)) return { previewUrl: value, status: "available" as const };

  const supabase = getSupabaseAdmin();
  const path = value.replace(/^company-media\//, "");
  const { data, error } = await supabase.storage.from("company-media").createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return { previewUrl: null as string | null, status: "unavailable" as const };

  return { previewUrl: data.signedUrl, status: "available" as const };
}

function mediaStatusLabel(status: "missing" | "available" | "unavailable", availableLabel: string) {
  if (status === "available") return availableLabel;
  if (status === "unavailable") return "Pfad vorhanden, nicht abrufbar";
  return "Nicht vorhanden";
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="text-sm font-medium text-muted">{title}</div>
      <div className="mt-2 text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className="w-fit rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">{statusLabel(status)}</span>;
}

function Field({ label, name, value }: { label: string; name: string; value?: string | null }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-ink">
      {label}
      <input className="rounded-md border border-line px-3 py-2 text-sm" name={name} defaultValue={value || ""} />
    </label>
  );
}

function TextArea({ label, name, value, wide }: { label: string; name: string; value: string; wide?: boolean }) {
  return (
    <label className={`grid gap-1.5 text-sm font-semibold text-ink ${wide ? "md:col-span-2" : ""}`}>
      {label}
      <textarea className="min-h-24 rounded-md border border-line px-3 py-2 text-sm" name={name} defaultValue={value} />
    </label>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function tradeLabel(slug: string) {
  return tradeTaxonomy.find((trade) => trade.slug === slug)?.name || slug;
}

function supportLabel(submission: CompanySubmission) {
  if (!submission.wants_support_contribution) return "nein";
  return submission.support_contribution_amount ? `${submission.support_contribution_amount} EUR` : "ja";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    submitted: "Neu",
    in_review: "In Prüfung",
    needs_info: "Rückfrage erforderlich",
    approved: "Freigegeben",
    rejected: "Abgelehnt",
  };
  return labels[status] || status;
}
