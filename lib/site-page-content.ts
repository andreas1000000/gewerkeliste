export const editablePageDefinitions = [
  { key: "home", label: "Startseite", description: "Suche und erster Eindruck" },
  { key: "prices", label: "Preise", description: "Leistungen und Profilmodelle" },
  { key: "about", label: "Über GewerkeListe", description: "Herkunft und Vertrauen" },
] as const;

export type EditablePageKey = (typeof editablePageDefinitions)[number]["key"];

export type EditablePageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export const defaultPageContent: Record<EditablePageKey, EditablePageContent> = {
  home: {
    eyebrow: "Die GewerkeListe",
    title: "Fachbetriebe finden, die zu Ihrem Projekt passen.",
    intro: "Suchen Sie nach Gewerk, Leistung und Region – mit strukturierten Betriebsdaten statt zufälliger Treffer.",
    primaryLabel: "Fachbetrieb suchen",
    primaryHref: "/suche",
    secondaryLabel: "Betrieb sichtbar machen",
    secondaryHref: "/betrieb-eintragen",
  },
  prices: {
    eyebrow: "Preise",
    title: "Sichtbarkeit bleibt kostenlos. Vertrauen braucht klare Leistungen.",
    intro: "GewerkeListe.com trennt das dauerhaft kostenlose Basisprofil von einem späteren verifizierten Startprofil. Die fachliche Auffindbarkeit und das organische Ranking hängen nicht von einer Zahlung ab.",
    primaryLabel: "Kostenloses Basisprofil eintragen",
    primaryHref: "/betrieb-eintragen",
    secondaryLabel: "Mehr über GewerkeListe",
    secondaryHref: "/ueber-gewerkeliste",
  },
  about: {
    eyebrow: "Warum GewerkeListe.com entsteht",
    title: "Warum GewerkeListe.com entsteht.",
    intro: "Weil die Suche nach passenden Bau- und Handwerksbetrieben heute noch viel zu oft über Zufall, alte Kontakte und persönliche Netzwerke läuft.",
    primaryLabel: "Betrieb kostenlos eintragen",
    primaryHref: "/betrieb-eintragen",
    secondaryLabel: "Fehlenden Betrieb vorschlagen",
    secondaryHref: "/betrieb-eintragen",
  },
};

const editableFields = ["eyebrow", "title", "intro", "primaryLabel", "primaryHref", "secondaryLabel", "secondaryHref"] as const;

export function isEditablePageKey(value: string): value is EditablePageKey {
  return editablePageDefinitions.some((page) => page.key === value);
}

export function normalizePageContent(pageKey: EditablePageKey, value: unknown): EditablePageContent {
  const defaults = defaultPageContent[pageKey];
  if (!value || typeof value !== "object") return defaults;

  const candidate = value as Record<string, unknown>;
  const normalized: EditablePageContent = { ...defaults };

  for (const field of editableFields) {
    if (pageKey === "prices" && (field === "eyebrow" || field === "title" || field === "intro")) continue;
    const fieldValue = candidate[field];
    if (typeof fieldValue !== "string" || !fieldValue.trim()) continue;
    if (field.endsWith("Href")) {
      if (isSafeInternalHref(fieldValue)) normalized[field] = fieldValue.trim();
      continue;
    }
    normalized[field] = fieldValue.trim();
  }

  return normalized;
}

function isSafeInternalHref(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("/") && !trimmed.startsWith("//") && !/[\r\n]/.test(trimmed);
}
