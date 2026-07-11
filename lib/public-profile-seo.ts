import { siteConfig } from "./site-config.ts";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

type DeploymentEnv = Record<string, string | undefined>;

export function canonicalUrlForPath(path = "/") {
  const base = siteConfig.url.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function canonicalProfileUrl(slug: string) {
  return canonicalUrlForPath(`/firma/${slug}`);
}

export function isIndexableProductionEnvironment(env: DeploymentEnv = process.env) {
  return env.VERCEL_ENV === "production";
}

export function publicProfileRobots(env: DeploymentEnv = process.env) {
  const index = isIndexableProductionEnvironment(env);
  return {
    index,
    follow: index,
  };
}

export function shouldDisallowPublicIndexing(env: DeploymentEnv = process.env) {
  return !isIndexableProductionEnvironment(env);
}

export function publicJsonLdMediaUrl(value?: string | null) {
  if (!value) return undefined;

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return undefined;
    if (LOCAL_HOSTS.has(url.hostname)) return undefined;
    if (url.pathname.includes("/storage/v1/object/sign/")) return undefined;
    if (url.searchParams.has("token")) return undefined;

    return url.toString();
  } catch {
    return undefined;
  }
}

export function buildPublicProfileTitle({
  name,
  trade,
  city,
}: {
  name: string;
  trade?: string | null;
  city?: string | null;
}) {
  const tradeAndCity = [trade || "Handwerk", city].filter(Boolean).join(" in ");
  return `${name} | ${tradeAndCity} | GewerkeListe.com`;
}

export function buildPublicProfileDescription({
  name,
  trade,
  city,
  serviceRegion,
}: {
  name: string;
  trade?: string | null;
  city?: string | null;
  serviceRegion?: string | null;
}) {
  const context = [trade || "Handwerksbetrieb", city || serviceRegion].filter(Boolean).join(" in ");
  const location = context ? ` als ${context}` : "";
  return `${name}${location}: Informationen zu Leistungen, Standort und direkter Kontaktaufnahme im Fachregister GewerkeListe.com.`;
}
