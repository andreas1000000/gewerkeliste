"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { publishSitePage, saveSitePageDraft } from "@/lib/actions/site-pages";
import type { AdminSitePage } from "@/lib/data/site-pages";
import type { EditablePageContent, EditablePageKey, EditablePageSection } from "@/lib/site-page-content";

type SiteEditorProps = {
  pages: AdminSitePage[];
};

export function SiteEditor({ pages }: SiteEditorProps) {
  const [selectedKey, setSelectedKey] = useState<EditablePageKey>(pages[0]?.key || "home");
  const [activeAction, setActiveAction] = useState<"draft" | "publish" | null>(null);
  const [drafts, setDrafts] = useState<Record<EditablePageKey, EditablePageContent>>(() =>
    Object.fromEntries(pages.map((page) => [page.key, page.draft])) as Record<EditablePageKey, EditablePageContent>,
  );
  const selectedPage = pages.find((page) => page.key === selectedKey) || pages[0];
  const selectedDraft = selectedPage ? drafts[selectedPage.key] : undefined;

  const serializedDraft = useMemo(() => JSON.stringify(selectedDraft || {}), [selectedDraft]);

  if (!selectedPage || !selectedDraft) {
    return <p className="rounded-lg border border-line bg-white p-5 text-sm text-muted">Keine editierbaren Seiten gefunden.</p>;
  }

  function updateDraft(field: keyof EditablePageContent, value: string) {
    setDrafts((current) => ({
      ...current,
      [selectedPage.key]: {
        ...current[selectedPage.key],
        [field]: value,
      },
    }));
  }

  function updateSection(sectionId: string, patch: Partial<EditablePageSection>) {
    setDrafts((current) => ({
      ...current,
      [selectedPage.key]: {
        ...current[selectedPage.key],
        sections: current[selectedPage.key].sections.map((section) =>
          section.id === sectionId ? { ...section, ...patch } : section,
        ),
      },
    }));
  }

  function updateSectionItem(sectionId: string, itemIndex: number, patch: { label?: string; detail?: string }) {
    if (!selectedDraft) return;
    const section = selectedDraft.sections.find((item) => item.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      items: section.items.map((item, index) => (index === itemIndex ? { ...item, ...patch } : item)),
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_minmax(320px,0.9fr)]">
      <aside className="rounded-xl border border-line bg-white p-3 shadow-sm">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Seiten</p>
        <div className="grid gap-1">
          {pages.map((page) => (
            <button
              key={page.key}
              type="button"
              onClick={() => setSelectedKey(page.key)}
              className={`rounded-lg px-3 py-3 text-left transition ${
                page.key === selectedPage.key ? "bg-[#e8f3ef] text-brand" : "text-muted hover:bg-panel hover:text-ink"
              }`}
            >
              <span className="block text-sm font-semibold">{page.label}</span>
              <span className="mt-1 block text-xs leading-5 text-current/70">{page.description}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">Inhalt bearbeiten</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{selectedPage.label}</h2>
            <p className="mt-1 text-sm text-muted">Ändere sichtbare Texte und Button-Beschriftungen direkt. Die Kernaussagen der Preisseite bleiben geschützt.</p>
          </div>
          <div className="rounded-lg bg-panel px-3 py-2 text-right text-xs text-muted">
            <span className="block font-semibold text-ink">Preise bleibt aktiv</span>
            <span>Die Preislogik wird nicht verändert.</span>
          </div>
        </div>

        <form action={saveSitePageDraft} className="mt-6 grid gap-5">
          <input type="hidden" name="page_key" value={selectedPage.key} />
          <input type="hidden" name="content_json" value={serializedDraft} readOnly />

          <Field label="Kleine Überschrift" value={selectedDraft.eyebrow} onChange={(value) => updateDraft("eyebrow", value)} disabled={selectedPage.key === "prices"} />
          <TextField label="Hauptüberschrift" value={selectedDraft.title} onChange={(value) => updateDraft("title", value)} rows={3} disabled={selectedPage.key === "prices"} />
          <TextField label="Einleitung" value={selectedDraft.intro} onChange={(value) => updateDraft("intro", value)} rows={4} disabled={selectedPage.key === "prices"} />

          <div className="grid gap-4 rounded-lg border border-line bg-panel p-4 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm font-semibold text-ink">Primärer Button</p>
            <Field label="Beschriftung" value={selectedDraft.primaryLabel} onChange={(value) => updateDraft("primaryLabel", value)} />
            <Field label="Interner Link" value={selectedDraft.primaryHref} onChange={(value) => updateDraft("primaryHref", value)} />
            <p className="sm:col-span-2 text-xs leading-5 text-muted">Nur interne Links wie <code>/suche</code> oder <code>/betrieb-eintragen</code> werden akzeptiert.</p>
          </div>

          <div className="grid gap-4 rounded-lg border border-line bg-panel p-4 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm font-semibold text-ink">Sekundärer Button</p>
            <Field label="Beschriftung" value={selectedDraft.secondaryLabel} onChange={(value) => updateDraft("secondaryLabel", value)} />
            <Field label="Interner Link" value={selectedDraft.secondaryHref} onChange={(value) => updateDraft("secondaryHref", value)} />
          </div>

          <div className="grid gap-4 rounded-lg border border-line bg-[#f8fafc] p-4 sm:p-5">
            <div>
              <p className="text-sm font-semibold text-ink">Seitenbereiche</p>
              <p className="mt-1 text-xs leading-5 text-muted">Hier bearbeitest du die weiteren sichtbaren Bereiche der Seite – mit Überschrift, Text, Listenpunkten und Buttons. Ausblenden funktioniert pro Bereich.</p>
            </div>
            <div className="grid gap-4">
              {selectedDraft.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  index={index}
                  onChange={(patch) => updateSection(section.id, patch)}
                  onItemChange={(itemIndex, patch) => updateSectionItem(section.id, itemIndex, patch)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <SubmitButton activeAction={activeAction} onClick={() => setActiveAction("draft")} />
            <button
              type="submit"
              formAction={publishSitePage}
              onClick={() => setActiveAction("publish")}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#265a4d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PublishButtonLabel activeAction={activeAction} />
            </button>
            <span className="text-xs leading-5 text-muted">Als Entwurf speichern prüft den Inhalt, veröffentlicht ihn aber noch nicht.</span>
          </div>
        </form>
      </section>

      <EditorPreview content={selectedDraft} />
    </div>
  );
}

function Field({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-ink">
      {label}
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-line bg-white px-3 text-sm font-normal text-ink outline-none transition focus:border-action focus:ring-2 focus:ring-action/15 disabled:cursor-not-allowed disabled:bg-panel disabled:text-muted"
      />
    </label>
  );
}

function TextField({ label, value, onChange, rows, disabled = false }: { label: string; value: string; onChange: (value: string) => void; rows: number; disabled?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-ink">
      {label}
      <textarea
        value={value}
        rows={rows}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal leading-6 text-ink outline-none transition focus:border-action focus:ring-2 focus:ring-action/15 disabled:cursor-not-allowed disabled:bg-panel disabled:text-muted"
      />
    </label>
  );
}

function SectionEditor({
  section,
  index,
  onChange,
  onItemChange,
}: {
  section: EditablePageSection;
  index: number;
  onChange: (patch: Partial<EditablePageSection>) => void;
  onItemChange: (itemIndex: number, patch: { label?: string; detail?: string }) => void;
}) {
  const disabled = section.protected === true;

  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Bereich {index + 1}</p>
          <h3 className="mt-1 text-base font-semibold text-ink">{section.label}</h3>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink">
          <input type="checkbox" checked={section.enabled} disabled={disabled} onChange={(event) => onChange({ enabled: event.target.checked })} />
          Sichtbar
        </label>
      </div>

      {disabled ? <p className="mt-3 rounded-md bg-panel px-3 py-2 text-xs leading-5 text-muted">Dieser Bereich bleibt aus Gründen der Preis- und Leistungsrichtigkeit geschützt.</p> : null}

      <div className="mt-4 grid gap-4">
        <Field label="Kleine Überschrift" value={section.eyebrow} onChange={(value) => onChange({ eyebrow: value })} disabled={disabled} />
        <Field label="Bereichsüberschrift" value={section.title} onChange={(value) => onChange({ title: value })} disabled={disabled} />
        <TextField label="Text (Absätze mit Leerzeile trennen)" value={section.body} onChange={(value) => onChange({ body: value })} rows={4} disabled={disabled} />

        {section.items.length > 0 ? (
          <div className="grid gap-3 rounded-md border border-line bg-panel p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Listen und Karten</p>
            {section.items.map((item, itemIndex) => (
              <div key={`${section.id}-${itemIndex}`} className="grid gap-3 rounded-md border border-line bg-white p-3 sm:grid-cols-2">
                <Field label={`Punkt ${itemIndex + 1}`} value={item.label} onChange={(value) => onItemChange(itemIndex, { label: value })} disabled={disabled} />
                <TextField label="Beschreibung" value={item.detail} onChange={(value) => onItemChange(itemIndex, { detail: value })} rows={2} disabled={disabled} />
              </div>
            ))}
          </div>
        ) : null}

        {section.primaryLabel || section.secondaryLabel ? (
          <div className="grid gap-3 rounded-md border border-line bg-panel p-3 sm:grid-cols-2">
            {section.primaryLabel ? <Field label="Primärer Button" value={section.primaryLabel} onChange={(value) => onChange({ primaryLabel: value })} disabled={disabled} /> : null}
            {section.primaryHref ? <Field label="Primärer Link" value={section.primaryHref} onChange={(value) => onChange({ primaryHref: value })} disabled={disabled} /> : null}
            {section.secondaryLabel ? <Field label="Sekundärer Button" value={section.secondaryLabel} onChange={(value) => onChange({ secondaryLabel: value })} disabled={disabled} /> : null}
            {section.secondaryHref ? <Field label="Sekundärer Link" value={section.secondaryHref} onChange={(value) => onChange({ secondaryHref: value })} disabled={disabled} /> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function EditorPreview({ content }: { content: EditablePageContent }) {
  return (
    <aside className="rounded-xl border border-line bg-[#07173d] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Live-Vorschau</p>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-blue-100">Entwurf</span>
      </div>
      <div className="rounded-xl bg-white p-5 text-ink shadow-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">{content.eyebrow}</p>
        <h3 className="mt-3 text-2xl font-semibold leading-tight">{content.title}</h3>
        <p className="mt-4 text-sm leading-6 text-muted">{content.intro}</p>
        <div className="mt-6 grid gap-2">
          <span className="rounded-lg bg-brand px-4 py-3 text-center text-sm font-semibold text-white">{content.primaryLabel}</span>
          <span className="rounded-lg border border-line px-4 py-3 text-center text-sm font-semibold text-brand">{content.secondaryLabel}</span>
        </div>
        <div className="mt-7 grid gap-3 border-t border-line pt-5">
          {content.sections.filter((section) => section.enabled).slice(0, 4).map((section) => (
            <div key={section.id} className="rounded-lg border border-line bg-panel p-3">
              {section.eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-action">{section.eyebrow}</p> : null}
              <p className="mt-1 text-sm font-semibold text-ink">{section.title}</p>
              {section.body ? <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs leading-5 text-muted">{section.body}</p> : null}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-blue-100/80">So sieht der bearbeitete Inhaltsblock ungefähr aus. Die echte Seite behält ihre Suche, Preise und Navigation.</p>
    </aside>
  );
}

function SubmitButton({ activeAction, onClick }: { activeAction: "draft" | "publish" | null; onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" onClick={onClick} disabled={pending} className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-brand hover:bg-panel disabled:cursor-not-allowed disabled:opacity-60">
      {pending && activeAction === "draft" ? "Speichert …" : "Entwurf speichern"}
    </button>
  );
}

function PublishButtonLabel({ activeAction }: { activeAction: "draft" | "publish" | null }) {
  const { pending } = useFormStatus();
  return pending && activeAction === "publish" ? "Veröffentlicht …" : "Veröffentlichen";
}
