import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { updateCompanyPremiumProfile } from "@/lib/actions";
import { getCompanyForPremiumAdmin, getCompanyPremiumProfileForAdmin } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompanyPremiumAdminPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  try {
    const [company, premiumProfile] = await Promise.all([
      getCompanyForPremiumAdmin(id),
      getCompanyPremiumProfileForAdmin(id),
    ]);
    const saved = query.saved === "1";
    const error = typeof query.error === "string" ? query.error : null;

    return (
      <Shell>
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link className="text-sm font-semibold text-brand hover:underline" href="/admin/companies">
              Zurück zu Betrieben
            </Link>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Verifiziertes Startprofil: {company.name}</h1>
            <p className="mt-2 text-sm text-muted">
              {company.postal_code} {company.city} · {company.trades?.name || "Ohne Gewerk"}
            </p>
          </div>
          <Link className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-panel" href={`/firma/${company.slug}` as Route}>
            Öffentliches Profil ansehen
          </Link>
        </div>

        {saved ? (
          <div className="mb-6 rounded-lg border border-[#b9e2c2] bg-[#f2fbf4] p-4 text-sm font-semibold text-[#245b37]">
            Startprofil-Daten gespeichert. Öffentlich sichtbar werden nur freigegebene Inhalte bei verifiziertem Startprofil.
          </div>
        ) : null}
        {error ? (
          <div className="mb-6 rounded-lg border border-[#f0b4b4] bg-[#fff5f5] p-4 text-sm font-semibold text-[#8a1f1f]">
            Speichern fehlgeschlagen: {error}
          </div>
        ) : null}

        <form action={updateCompanyPremiumProfile} className="grid gap-6">
          <input name="company_id" type="hidden" value={company.id} />
          <input name="company_slug" type="hidden" value={company.slug} />

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Paket und Verifizierung</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-ink">
                Profilpaket
                <select className="rounded-md border border-line px-3 py-2 text-sm" name="profile_package" defaultValue={company.profile_package || "basis"}>
                  <option value="basis">Basisprofil</option>
                  <option value="verified_start">Verifiziertes Startprofil</option>
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-ink">
                <input className="h-4 w-4 accent-brand" name="verified" type="checkbox" defaultChecked={company.verified} />
                Betriebsdaten bestätigt / verifiziert
              </label>
              <Field label="Verifiziert am" name="verification_date" value={dateTimeInputValue(company.verification_date)} type="datetime-local" />
              <Field label="Startprofil seit" name="premium_started_at" value={dateTimeInputValue(company.premium_started_at)} type="datetime-local" />
              <Field label="Startprofil bis" name="premium_expires_at" value={dateTimeInputValue(company.premium_expires_at)} type="datetime-local" />
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              Diese Einstellung erzeugt keine bessere Platzierung und keine Anfragegarantie. Sie steuert nur die öffentliche Darstellung des verifizierten Startprofils.
            </p>
          </section>

          <EditSection
            title="Mehrere Ansprechpartner"
            help="Eine Zeile pro Ansprechpartner: Name | Rolle | Telefon | E-Mail | Bildpfad/URL | review_status | primary"
            name="contacts"
            value={contactsText(premiumProfile.contacts)}
          />
          <EditSection
            title="Teamvorstellung"
            help="Eine Zeile pro Teammitglied: Name | Rolle | Beschreibung | Bildpfad/URL | review_status"
            name="team_members"
            value={teamText(premiumProfile.teamMembers)}
          />
          <EditSection
            title="Strukturierte Referenzen"
            help="Eine Zeile pro Referenz: Titel | Projekttyp | Ort | Jahr | Beschreibung | Leistungen mit Komma | Kundentyp | review_status"
            name="references"
            value={referencesText(premiumProfile.references)}
          />
          <EditSection
            title="Referenzbilder"
            help="Eine Zeile pro Bild: Bildpfad/URL | Alt-Text | Bildunterschrift | review_status"
            name="reference_media"
            value={referenceMediaText(premiumProfile.referenceMedia)}
          />
          <EditSection
            title="Nachweise und Zertifikate"
            help="Eine Zeile pro Nachweis: Titel | Aussteller | Ausgestellt YYYY-MM-DD | Gültig bis YYYY-MM-DD | Beschreibung | Datei/Bildpfad | review_status"
            name="certificates"
            value={certificatesText(premiumProfile.certificates)}
          />

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <button className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-[#265a4d]">
              Startprofil-Daten speichern
            </button>
            <p className="mt-3 text-xs leading-5 text-muted">
              Nur Einträge mit review_status=approved werden auf öffentlichen Profilen angezeigt. pending, rejected und internal bleiben unsichtbar.
            </p>
          </section>
        </form>
      </Shell>
    );
  } catch {
    notFound();
  }
}

function EditSection({ title, help, name, value }: { title: string; help: string; name: string; value: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-xs leading-5 text-muted">{help}</p>
      <textarea className="mt-4 min-h-40 w-full rounded-md border border-line px-3 py-2 font-mono text-sm" name={name} defaultValue={value} />
    </section>
  );
}

function Field({ label, name, value, type = "text" }: { label: string; name: string; value?: string; type?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-ink">
      {label}
      <input className="rounded-md border border-line px-3 py-2 text-sm" name={name} type={type} defaultValue={value || ""} />
    </label>
  );
}

function contactsText(items: Array<{ name: string; role: string | null; phone: string | null; email: string | null; image_url: string | null; review_status: string; is_primary: boolean }>) {
  return items.map((item) => [item.name, item.role, item.phone, item.email, item.image_url, item.review_status, item.is_primary ? "ja" : ""].map(text).join(" | ")).join("\n");
}

function teamText(items: Array<{ name: string; role: string | null; description: string | null; image_url: string | null; review_status: string }>) {
  return items.map((item) => [item.name, item.role, item.description, item.image_url, item.review_status].map(text).join(" | ")).join("\n");
}

function referencesText(items: Array<{ title: string; project_type: string | null; location: string | null; year: number | null; description: string | null; services: string[]; client_type: string | null; review_status: string }>) {
  return items.map((item) => [item.title, item.project_type, item.location, item.year, item.description, item.services.join(", "), item.client_type, item.review_status].map(text).join(" | ")).join("\n");
}

function referenceMediaText(items: Array<{ file_url: string; alt_text: string | null; caption: string | null; review_status: string }>) {
  return items.map((item) => [item.file_url, item.alt_text, item.caption, item.review_status].map(text).join(" | ")).join("\n");
}

function certificatesText(items: Array<{ title: string; issuer: string | null; issued_at: string | null; valid_until: string | null; description: string | null; file_url: string | null; review_status: string }>) {
  return items.map((item) => [item.title, item.issuer, item.issued_at, item.valid_until, item.description, item.file_url, item.review_status].map(text).join(" | ")).join("\n");
}

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function dateTimeInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}
