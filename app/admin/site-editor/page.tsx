import { SiteEditor } from "@/components/site-editor";
import { Shell } from "@/components/shell";
import { getAdminSitePages } from "@/lib/data/site-pages";

export const dynamic = "force-dynamic";

export default async function SiteEditorPage() {
  try {
    const pages = await getAdminSitePages();

    return (
      <Shell>
        <div className="mb-7 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">GewerkeListe bearbeiten</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Seiteneditor</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Bearbeite die wichtigsten sichtbaren Inhalte direkt hier. Änderungen werden erst nach „Veröffentlichen“ auf der öffentlichen Seite sichtbar.</p>
        </div>
        <SiteEditor pages={pages} />
      </Shell>
    );
  } catch {
    return (
      <Shell>
        <div className="max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Einmalige Einrichtung fehlt noch</p>
          <h1 className="mt-2 text-2xl font-semibold text-amber-950">Der Seiteneditor ist vorbereitet.</h1>
          <p className="mt-3 text-sm leading-6 text-amber-900">Bevor du Texte speichern kannst, muss die enthaltene Datenbankmigration für die Seitentexte freigegeben und angewendet werden. Bis dahin bleibt die öffentliche Seite unverändert.</p>
          <p className="mt-4 text-xs text-amber-800">Benötigte Migration: <code>20260722180000_site_page_content.sql</code></p>
        </div>
      </Shell>
    );
  }
}
