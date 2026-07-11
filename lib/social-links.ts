export const SOCIAL_PLATFORMS = [
  "instagram",
  "whatsapp",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "x",
  "pinterest",
  "xing",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type NormalizedSocialLink = {
  platform: SocialPlatform;
  url: string;
  label: string | null;
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  pinterest: "Pinterest",
  xing: "Xing",
};

const PLATFORM_MARKS: Record<SocialPlatform, string> = {
  instagram: "IG",
  whatsapp: "WA",
  facebook: "f",
  linkedin: "in",
  tiktok: "TT",
  youtube: "YT",
  x: "X",
  pinterest: "P",
  xing: "X",
};

const PLATFORM_COLOR_CLASSES: Record<SocialPlatform, string> = {
  instagram: "border-[#d62976]/30 bg-[#d62976] text-white",
  whatsapp: "border-[#25d366]/30 bg-[#25d366] text-[#053b1d]",
  facebook: "border-[#1877f2]/30 bg-[#1877f2] text-white",
  linkedin: "border-[#0a66c2]/30 bg-[#0a66c2] text-white",
  tiktok: "border-[#111111]/30 bg-[#111111] text-white",
  youtube: "border-[#ff0000]/30 bg-[#ff0000] text-white",
  x: "border-[#111111]/30 bg-[#111111] text-white",
  pinterest: "border-[#bd081c]/30 bg-[#bd081c] text-white",
  xing: "border-[#006567]/30 bg-[#006567] text-white",
};

const PLATFORM_HOSTS: Record<Exclude<SocialPlatform, "whatsapp">, string[]> = {
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
  tiktok: ["tiktok.com", "www.tiktok.com"],
  youtube: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"],
  x: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
  pinterest: ["pinterest.com", "www.pinterest.com", "pinterest.de", "www.pinterest.de"],
  xing: ["xing.com", "www.xing.com"],
};

const DANGEROUS_PROTOCOLS = new Set(["javascript:", "data:", "vbscript:", "file:", "blob:"]);

export function normalizeSocialPlatform(value?: string | null): SocialPlatform | null {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "twitter") return "x";
  if (normalized === "linked-in") return "linkedin";
  return SOCIAL_PLATFORMS.includes(normalized as SocialPlatform) ? (normalized as SocialPlatform) : null;
}

export function socialPlatformLabel(value?: string | null) {
  const platform = normalizeSocialPlatform(value);
  return platform ? PLATFORM_LABELS[platform] : "Online-Profil";
}

export function socialPlatformMark(value?: string | null) {
  const platform = normalizeSocialPlatform(value);
  return platform ? PLATFORM_MARKS[platform] : "↗";
}

export function socialPlatformColorClass(value?: string | null) {
  const platform = normalizeSocialPlatform(value);
  return platform ? PLATFORM_COLOR_CLASSES[platform] : "border-line bg-white text-action";
}

export function normalizeSocialLink(platformValue: string | null | undefined, urlValue: string | null | undefined, labelValue?: string | null): NormalizedSocialLink | null {
  const platform = normalizeSocialPlatform(platformValue);
  if (!platform) return null;

  const url = platform === "whatsapp" ? normalizeWhatsappUrl(urlValue) : normalizePlatformUrl(platform, urlValue);
  if (!url) return null;

  const label = cleanOptionalLabel(labelValue);
  return { platform, url, label };
}

export function normalizeSocialLinkUrl(platformValue: string | null | undefined, urlValue: string | null | undefined) {
  const platform = normalizeSocialPlatform(platformValue);
  if (!platform) return null;
  return platform === "whatsapp" ? normalizeWhatsappUrl(urlValue) : normalizePlatformUrl(platform, urlValue);
}

function normalizePlatformUrl(platform: Exclude<SocialPlatform, "whatsapp">, value?: string | null) {
  const url = normalizeHttpsUrl(value);
  if (!url) return null;

  const hosts = PLATFORM_HOSTS[platform];
  if (!hosts.includes(url.hostname.toLowerCase())) return null;
  return url.toString();
}

function normalizeWhatsappUrl(value?: string | null) {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;

  if (/^[+()0-9\s/-]{6,30}$/.test(trimmed)) {
    const digits = trimmed.replace(/[^\d]/g, "");
    if (digits.length < 6) return null;
    return `https://wa.me/${digits}`;
  }

  const url = normalizeHttpsUrl(trimmed);
  if (!url) return null;

  const host = url.hostname.toLowerCase();
  if (host === "wa.me" || host === "api.whatsapp.com" || host === "www.whatsapp.com" || host === "whatsapp.com") {
    return url.toString();
  }

  return null;
}

function normalizeHttpsUrl(value?: string | null) {
  const trimmed = (value || "").trim();
  if (!trimmed || /[\u0000-\u001f\s]/.test(trimmed)) return null;

  const explicitProtocol = trimmed.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (explicitProtocol && DANGEROUS_PROTOCOLS.has(`${explicitProtocol}:`)) return null;

  const candidate = trimmed.startsWith("//")
    ? `https:${trimmed}`
    : explicitProtocol
      ? trimmed
      : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return null;
    if (!url.hostname || url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    return url;
  } catch {
    return null;
  }
}

function cleanOptionalLabel(value?: string | null) {
  const label = (value || "").trim();
  return label ? label.slice(0, 80) : null;
}
