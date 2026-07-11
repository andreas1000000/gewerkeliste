import {
  SOCIAL_PLATFORMS,
  socialPlatformColorClass,
  socialPlatformLabel,
  socialPlatformMark,
  type SocialPlatform,
} from "@/lib/social-links";

type InitialSocialLink = {
  platform: string;
  url: string;
  label?: string | null;
};

export function SocialLinksFields({ initialLinks = [] }: { initialLinks?: InitialSocialLink[] | null }) {
  const linkByPlatform = new Map(
    (Array.isArray(initialLinks) ? initialLinks : [])
      .filter((link) => link.platform && link.url)
      .map((link) => [link.platform.toLowerCase(), link]),
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-white p-4 shadow-soft sm:p-6">
      <div className="flex min-w-0 gap-3 sm:gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action text-sm font-semibold text-white">
          S
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-brand">Social Media & weitere Kontaktwege</h2>
            <span className="rounded-md border border-[#bde7cc] bg-[#f1fbf5] px-2.5 py-1 text-xs font-semibold text-[#24523a]">
              Im Basisprofil enthalten
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            Verknüpfen Sie Ihre offiziellen Social-Media-Kanäle kostenlos mit Ihrem Profil. Neue oder geänderte Links
            werden geprüft, bevor sie öffentlich erscheinen.
          </p>
          <div className="mt-5 grid gap-3">
            {SOCIAL_PLATFORMS.map((platform) => (
              <SocialLinkRow key={platform} platform={platform} value={linkByPlatform.get(platform)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialLinkRow({ platform, value }: { platform: SocialPlatform; value?: InitialSocialLink }) {
  return (
    <div className="grid gap-3 rounded-md border border-line bg-[#fbfcff] p-3 md:grid-cols-[190px_minmax(0,1fr)_180px] md:items-center">
      <input name="socialPlatform" type="hidden" value={platform} />
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${socialPlatformColorClass(platform)}`}
        >
          {socialPlatformMark(platform)}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">{socialPlatformLabel(platform)}</div>
          <div className="text-xs leading-5 text-muted">Kostenloser Link</div>
        </div>
      </div>
      <label className="grid min-w-0 gap-1 text-sm font-medium text-ink">
        <span className="sr-only">{socialPlatformLabel(platform)} URL</span>
        <input
          className="w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action"
          defaultValue={value?.url || ""}
          inputMode="url"
          name="socialUrl"
          placeholder={platform === "whatsapp" ? "https://wa.me/... oder Telefonnummer" : "https://..."}
          type="text"
        />
      </label>
      <label className="grid min-w-0 gap-1 text-sm font-medium text-ink">
        <span className="sr-only">{socialPlatformLabel(platform)} Label optional</span>
        <input
          className="w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action"
          defaultValue={value?.label || ""}
          name="socialLabel"
          placeholder="Label optional"
          type="text"
        />
      </label>
    </div>
  );
}
