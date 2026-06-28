export function publicResultDescription(description: string | null | undefined) {
  const text = cleanCompanyDescription(description);
  if (!text) return "";

  const genericSignals = [
    "Öffentlicher Basis-Eintrag",
    "öffentlich zugänglichen Gewerbedaten",
    "Der Eintrag ist noch nicht vom Betrieb bestätigt",
    "Korrektur oder Löschung kann jederzeit angefragt werden",
    "Quelle:",
  ];

  if (genericSignals.some((signal) => text.includes(signal))) return "";
  return text;
}

export function cleanCompanyDescription(description: string | null | undefined) {
  const text = removeInternalSubmissionFragments(description);
  if (!text) return "";

  const withoutServiceIntro = text
    .replace(/\b(Ausgewählte|Ausgewaehlte)\s+Leistungen\s*:\s*/gi, "")
    .replace(/\bLeistungen\s*:\s*((?:[^.?!]|,\s*){80,})/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return truncateDescription(withoutServiceIntro, 420);
}

export function extractServiceListFromDescription(description: string | null | undefined) {
  const raw = description?.trim();
  if (!raw) return [];

  const serviceMatch =
    raw.match(/(?:Ausgewählte|Ausgewaehlte)\s+Leistungen\s*:\s*([^.!?\n]+)/i) ||
    raw.match(/Leistungen\s*:\s*([^.!?\n]+)/i);
  if (!serviceMatch?.[1]) return extractServiceKeywordsFromText(raw);

  return uniqueList([
    ...serviceMatch[1]
    .split(/[,;|/]+/)
    .map((item) => normalizeServiceLabel(item))
      .filter((item): item is string => Boolean(item && item.length >= 3 && item.length <= 80)),
    ...extractServiceKeywordsFromText(raw),
  ]);
}

export function extractServiceKeywordsFromText(text: string | null | undefined) {
  const raw = text?.trim();
  if (!raw) return [];
  const normalized = raw.toLowerCase();
  const services: string[] = [];

  for (const rule of serviceKeywordRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      services.push(rule.label);
    }
  }

  return uniqueList(services);
}

export function groupServicesForDisplay(services: string[]) {
  const groups = new Map<string, string[]>();

  for (const service of services) {
    const label = serviceGroupLabel(service);
    const entries = groups.get(label) || [];
    if (!entries.includes(service)) entries.push(service);
    groups.set(label, entries);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function truncateDescription(description: string, maxLength = 420) {
  const text = description.trim();
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(shortened.lastIndexOf("."), shortened.lastIndexOf("!"), shortened.lastIndexOf("?"));
  if (sentenceEnd > 140) return shortened.slice(0, sentenceEnd + 1).trim();
  const wordEnd = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, wordEnd > 140 ? wordEnd : maxLength).trim()}...`;
}

export function removeInternalSubmissionFragments(description: string | null | undefined) {
  if (!description) return "";

  const fragments = [
    /Ausgewählte Leistungen\s*:/gi,
    /Ausgewaehlte Leistungen\s*:/gi,
    /Nachweisangaben\s*:[^.!?\n]*(?:[.!?]|$)/gi,
    /Gewerbenachweis kann bei Bedarf nachgereicht werden\.?/gi,
    /Startphase\s*:[^.!?\n]*(?:[.!?]|$)/gi,
    /Förderoption\s*:[^.!?\n]*(?:[.!?]|$)/gi,
    /Foerderoption\s*:[^.!?\n]*(?:[.!?]|$)/gi,
    /Rechnung auf Wunsch\s*:[^.!?\n]*(?:[.!?]|$)/gi,
    /Hinweis:\s*Der freiwillige Förderbeitrag[^.!?\n]*(?:[.!?]|$)/gi,
    /Hinweis:\s*Der freiwillige Foerderbeitrag[^.!?\n]*(?:[.!?]|$)/gi,
    /Status:\s*automatisch wird nichts berechnet\.?/gi,
  ];

  return fragments
    .reduce((value, pattern) => value.replace(pattern, " "), description)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

export function publicResultImage(company: {
  claim_status: string;
  logo_url?: string | null;
  profile_image_url?: string | null;
  profile_status?: string | null;
  verified: boolean;
}) {
  const hasConfirmedProfile =
    company.verified ||
    company.claim_status === "claimed" ||
    company.profile_status === "verified" ||
    company.profile_status === "claimed";

  if (!hasConfirmedProfile) return "";
  return company.logo_url || company.profile_image_url || "";
}

function normalizeServiceLabel(value: string) {
  const text = value
    .replace(/^[✓\-–•\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function uniqueList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

const serviceKeywordRules: Array<{ label: string; keywords: string[] }> = [
  { label: "Hochbau", keywords: ["hochbau", "hochbaumeister"] },
  { label: "Maurerarbeiten", keywords: ["maurer", "mauerwerk", "mauern"] },
  { label: "Umbau", keywords: ["umbau", "umbauten"] },
  { label: "Sanierung", keywords: ["sanierung", "sanieren", "modernisierung"] },
  { label: "Verputzarbeiten", keywords: ["verputz", "putzarbeiten", "innenputz", "außenputz", "aussenputz"] },
  { label: "Betonarbeiten", keywords: ["beton", "stahlbeton", "fundament", "bodenplatte"] },
  { label: "Erdarbeiten", keywords: ["erdarbeiten", "aushub", "bagger", "baugrube"] },
  { label: "Garten- und Landschaftsbau", keywords: ["landschaftsgärtner", "landschaftsgaertner", "galabau", "gartenbau", "garten- und landschaftsbau"] },
  { label: "Pflasterarbeiten", keywords: ["pflaster", "pflastern", "pflasterarbeiten"] },
  { label: "Außenanlagen", keywords: ["außenanlage", "aussenanlage", "außenanlagen", "aussenanlagen"] },
  { label: "Dacharbeiten", keywords: ["dacharbeiten", "dachdecker", "steildach", "flachdach"] },
  { label: "Zimmererarbeiten", keywords: ["zimmerer", "zimmerei", "holzbau", "dachstuhl"] },
  { label: "Elektroinstallation", keywords: ["elektroinstallation", "elektroinstallateur", "elektriker"] },
  { label: "Photovoltaik", keywords: ["photovoltaik", "pv-anlage", "solaranlage"] },
  { label: "Sanitärinstallation", keywords: ["sanitär", "sanitaer", "badinstallation", "badsanierung"] },
  { label: "Heizungsbau", keywords: ["heizung", "heizungsbau", "wärmepumpe", "waermepumpe"] },
  { label: "Lüftungsbau", keywords: ["lüftung", "lueftung", "lüftungsbau", "lueftungsbau"] },
  { label: "Trockenbau", keywords: ["trockenbau", "gipskarton", "akustikdecke"] },
  { label: "Malerarbeiten", keywords: ["maler", "anstrich", "beschichtung"] },
  { label: "Bodenarbeiten", keywords: ["bodenbelag", "bodenarbeiten", "parkett", "estrich"] },
  { label: "Fliesenarbeiten", keywords: ["fliesen", "fliesenleger", "naturstein"] },
  { label: "Schreinerarbeiten", keywords: ["schreiner", "schreinerei", "möbelbau", "moebelbau"] },
  { label: "Metallbau", keywords: ["metallbau", "schlosserei", "stahlbau", "geländer", "gelaender"] },
];

function serviceGroupLabel(value: string) {
  const normalized = value.toLowerCase();
  if (/(beratung|planung|entwurf|bauleitung|antrag|statik|gutachten)/.test(normalized)) return "Planung / Beratung";
  if (/(rohbau|mauer|mauerwerk|beton|schalung|bewehrung|fundament)/.test(normalized)) return "Rohbau / Mauerwerk";
  if (/(erd|tiefbau|bagger|kanal|leitung|aushub)/.test(normalized)) return "Erdarbeiten / Tiefbau";
  if (/(garten|landschaft|pflaster|außenanlage|aussenanlage|hof|zufahrt)/.test(normalized)) return "Außenanlagen / Pflaster";
  if (/(sanierung|umbau|bestand|modernisierung|renovierung)/.test(normalized)) return "Sanierung / Umbau";
  if (/(dach|holz|zimmer|fassade)/.test(normalized)) return "Dach / Holzbau";
  if (/(innen|trockenbau|ausbau|boden|fliese|maler|putz)/.test(normalized)) return "Innenausbau";
  if (/(abdichtung|feuchte|schaden|trocknung)/.test(normalized)) return "Abdichtung / Schadensbehebung";
  return "Weitere Leistungen";
}
