import { socialPlatformLabel } from "@/lib/social-links";
import type { SubmissionMediaReference } from "@/lib/submission-review";
import type { SubmissionUploadedFile } from "@/lib/types";

export type ResolvedSubmissionMedia = SubmissionMediaReference & {
  previewUrl: string | null;
};

export function SubmissionMediaPreview({
  alt,
  emptyText,
  label,
  media,
  note,
}: {
  alt: string;
  emptyText: string;
  label: string;
  media: ResolvedSubmissionMedia;
  note: string;
}) {
  const status = submissionMediaStatusLabel(media.status);

  return (
    <div className="rounded-md border border-line bg-[#fbfcff] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink">{label}</div>
        <span className="rounded-full border border-line bg-white px-2 py-1 text-xs font-semibold text-muted">{status}</span>
      </div>
      {media.previewUrl ? (
        <>
          <a className="mt-3 block overflow-hidden rounded-md border border-line bg-white" href={media.previewUrl} rel="noreferrer noopener" target="_blank">
            <img alt={alt} className="h-44 w-full object-contain p-3" src={media.previewUrl} />
          </a>
          <div className="mt-2 grid gap-1 text-xs text-muted">
            <span>Datei: {media.fileName || "unbekannter Dateiname"}</span>
            <span>Medientyp: {media.mimeType || "unbekannter Medientyp"}</span>
          </div>
        </>
      ) : media.status === "missing" ? (
        <div className="mt-3 rounded-md border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-muted">
          Nicht eingereicht. {emptyText}
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-[#f1d08a] bg-[#fff8e8] px-4 py-6 text-sm leading-6 text-[#6d4a00]">
          Eingereicht, aber die Datei ist aktuell nicht abrufbar. Bitte Storage-Referenz und Bucket-Zugriff intern prüfen.
          <div className="mt-2 grid gap-1 text-xs">
            <span>Datei: {media.fileName || "unbekannter Dateiname"}</span>
            <span>Medientyp: {media.mimeType || "unbekannter Medientyp"}</span>
          </div>
        </div>
      )}
      <p className="mt-3 text-xs leading-5 text-muted">{note}</p>
    </div>
  );
}

export function SubmissionPayloadFilePreview({
  file,
  label,
  resolved,
}: {
  file: SubmissionUploadedFile | null;
  label: string;
  resolved: ResolvedSubmissionMedia;
}) {
  if (!file) {
    return <SubmissionReviewData label={label} value={null} />;
  }

  const isImage = file.mime_type.startsWith("image/");

  return (
    <div className="grid gap-2 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</dt>
      <dd className="grid gap-2 text-sm text-ink">
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-full border border-line bg-white px-2 py-1 font-semibold">{file.review_status}</span>
          <span>{file.original_filename}</span>
          <span>{file.mime_type}</span>
          <span>{formatBytes(file.file_size)}</span>
        </div>
        {resolved.previewUrl ? (
          isImage ? (
            <a className="block overflow-hidden rounded-md border border-line bg-white" href={resolved.previewUrl} rel="noreferrer noopener" target="_blank">
              <img alt={file.original_filename} className="h-44 w-full object-contain p-3" src={resolved.previewUrl} />
            </a>
          ) : (
            <a className="inline-flex w-fit rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-action hover:border-action" href={resolved.previewUrl} rel="noreferrer noopener" target="_blank">
              Datei zur Prüfung öffnen
            </a>
          )
        ) : (
          <div className="rounded-md border border-[#f1d08a] bg-[#fff8e8] px-4 py-3 text-sm leading-6 text-[#6d4a00]">
            Datei eingereicht, aber aktuell nicht abrufbar. Status: {submissionMediaStatusLabel(resolved.status)}.
          </div>
        )}
      </dd>
    </div>
  );
}

export function SubmissionSocialLinkReview({
  link,
}: {
  link: { platform: string; url: string; label?: string | null };
}) {
  return (
    <>
      <SubmissionReviewData label="Plattform" value={socialPlatformLabel(link.platform)} />
      <div className="grid gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0">
        <dt className="text-xs font-semibold uppercase tracking-normal text-muted">URL</dt>
        <dd className="text-sm text-ink">
          <a className="break-all text-action underline hover:text-brand" href={link.url} rel="noreferrer noopener" target="_blank">
            {link.url}
          </a>
        </dd>
      </div>
      <SubmissionReviewData label="Label" value={link.label} />
    </>
  );
}

function SubmissionReviewData({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</dt>
      <dd className="text-sm text-ink">{value || "Nicht angegeben"}</dd>
    </div>
  );
}

function submissionMediaStatusLabel(status: SubmissionMediaReference["status"]) {
  if (status === "available") return "Vorschau verfügbar";
  if (status === "invalid") return "Ungültige Referenz";
  if (status === "unavailable") return "Eingereicht, nicht abrufbar";
  return "Nicht eingereicht";
}

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return "unbekannte Größe";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
