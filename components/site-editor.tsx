"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { publishSitePage, saveSitePageDraft } from "@/lib/actions/site-pages";
import type { AdminSitePage } from "@/lib/data/site-pages";
import type { EditablePageContent, EditablePageKey } from "@/lib/site-page-content";

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
