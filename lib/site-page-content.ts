export const editablePageDefinitions = [
  { key: "home", label: "Startseite", description: "Suche und erster Eindruck" },
  { key: "prices", label: "Preise", description: "Leistungen und Profilmodelle" },
  { key: "about", label: "Über GewerkeListe", description: "Herkunft und Vertrauen" },
] as const;

export type EditablePageKey = (typeof editablePageDefinitions)[number]["key"];

export type EditablePageSectionItem = {
  label: string;
  detail: string;
};

export type EditablePageSection = {
  id: string;
  label: string;
  enabled: boolean;
  eyebrow: string;
  title: string;
  body: string;
  items: EditablePageSectionItem[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  protected?: boolean;
};

export type EditablePageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  sections: EditablePageSection[];
};

const section = (values: Omit<EditablePageSection, "enabled" | "items" | "primaryLabel" | "primaryHref" | "secondaryLabel" | "secondaryHref"> & Partial<Pick<EditablePageSection, "enabled" | "items" | "primaryLabel" | "primaryHref" | "secondaryLabel" | "secondaryHref">>): EditablePageSection => ({
  enabled: true,
  items: [],
  primaryLabel: "",
  primaryHref: "",
  secondaryLabel: "",
  secondaryHref: "",
  ...values,
});

export const defaultPageContent: Record<EditablePageKey, EditablePageContent> = {
  home: {
    eyebrow: "Die GewerkeListe",
    title: "Fachbetriebe finden, die zu Ihrem Projekt passen.",
    intro: "Suchen Sie nach Gewerk, Leistung und Region – mit strukturierten Betriebsdaten statt zufälliger Treffer.",
    primaryLabel: "Fachbetrieb suchen",
    primaryHref: "/suche",
    secondaryLabel: "Betrieb sichtbar machen",
    secondaryHref: "/betrieb-eintragen",
    sections: [
      section({
        id: "home-benefits",
        label: "Schneller zum passenden Fachbetrieb",
        eyebrow: "",
        title: "Schneller zum passenden Fachbetrieb.",
        body: "",
        items: [
          { label: "Passende Betriebe schneller finden", detail: "Für Planer, Bauleiter, GU, Kommunen und professionelle Bauherren entsteht eine strukturierte Suche nach Gewerk, Leistung und Region." },
          { label: "Region und Wirkungskreis einordnen", detail: "Nicht nur Sitz und Radius zählen. GewerkeListe.com macht sichtbar, in welchen Regionen ein Betrieb fachlich relevant ist." },
        ],
      }),
      section({
        id: "home-market",
        label: "Der Markt ist nicht leer",
        eyebrow: "",
        title: "Der Markt ist nicht leer. Er ist schlecht sortiert.",
        body: "In der Baupraxis geht viel Zeit verloren, weil Informationen zu Fachbetrieben verstreut sind: Website, Empfehlung, Branchenbuch, Suchmaschine oder persönliche Kontaktliste. GewerkeListe.com bringt diese Informationen in eine fachliche B2B-Suchlogik vor Ausschreibung, Anfrage und Vergabe.",
        items: [
          { label: "Gewerk", detail: "" },
          { label: "Ort und Region", detail: "" },
          { label: "angebotene Leistungen", detail: "" },
          { label: "Wirkungskreis und Tätigkeitsgebiet", detail: "" },
          { label: "Kontakt", detail: "" },
          { label: "Datenbestätigung", detail: "ohne Qualitätsgarantie" },
        ],
      }),
      section({
        id: "home-audiences",
        label: "Für wen die Suche gedacht ist",
        eyebrow: "",
        title: "Für Planer, Bauleiter und Auftraggeber",
        body: "",
        items: [
          { label: "1", detail: "Gewerk und Ort eingeben" },
          { label: "2", detail: "Leistung, Spezialisierung und Region einordnen" },
          { label: "3", detail: "passende Betriebe direkt kontaktieren" },
        ],
        primaryLabel: "Fachbetrieb suchen",
        primaryHref: "/suche",
      }),
      section({
        id: "home-projects",
        label: "Für Bauprojekte",
        eyebrow: "Für Bauprojekte",
        title: "Finde Betriebe, die zur Aufgabe und zur Region passen.",
        body: "GewerkeListe.com ordnet Leistungen, Standorte und Wirkungskreise so, dass Projektbeteiligte schneller eine belastbare Vorauswahl treffen können.\n\nDer Wert entsteht nicht durch Druck oder Preiskampf, sondern durch bessere Marktübersicht: welches Gewerk, welche Leistung, welche Region, welcher Kontaktweg.",
        primaryLabel: "Gewerk suchen",
        primaryHref: "/suche",
      }),
      section({
        id: "home-trades",
        label: "Gewerke entdecken",
        eyebrow: "",
        title: "Gewerke entdecken",
        body: "Wichtige Baugewerke als strukturierter Einstieg in die Suche.",
        primaryLabel: "Alle Gewerke anzeigen",
        primaryHref: "/gewerke",
      }),
      section({
        id: "home-service-area",
        label: "Wirkungskreis-Suche",
        eyebrow: "Wirkungskreis-Suche",
        title: "Nicht nur Standort. Wirkungskreis.",
        body: "Handwerksbetriebe arbeiten nicht in perfekten Kreisen. GewerkeListe macht sichtbar, in welchen Regionen, Orten und Projektgebieten Betriebe tatsächlich aktiv sein wollen.\n\nKarten- und Wirkungskreisfunktionen werden schrittweise ausgebaut. Wirkungskreise können vom Betrieb angegeben oder aus Quellen abgeleitet und geprüft werden.",
        items: [
          { label: "Firmenstandort als Punkt", detail: "" },
          { label: "Einsatzgebiet als Wirkungskreis", detail: "" },
          { label: "später frei markierbar mit Karte", detail: "" },
          { label: "geprüft vor Veröffentlichung", detail: "" },
        ],
        primaryLabel: "Gewerke suchen",
        primaryHref: "/suche",
        secondaryLabel: "Betrieb eintragen",
        secondaryHref: "/betrieb-eintragen",
      }),
      section({
        id: "home-business",
        label: "Für Fachbetriebe",
        eyebrow: "",
        title: "Ihr Betrieb. Ihre Leistungen. Ihr Tätigkeitsgebiet.",
        body: "Ein Betriebseintrag zeigt sachlich, welche Leistungen Ihr Betrieb anbietet, wo Sie tätig sind und wie Auftraggeber Sie erreichen können. Die vollständige Nennung von Gewerken, Leistungen und Spezialisierungen gehört zur Grundsichtbarkeit und wird nicht künstlich begrenzt.\n\nGewerkeListe.com ist kein System für Preiskampf und verkauft keine einzelnen Anfragen. Ziel ist eine professionelle Daten- und Vertrauensschicht für echte Baugewerke.",
        items: [
          { label: "Betriebsdaten bestätigen", detail: "" },
          { label: "Leistungsbreite vollständig darstellen", detail: "" },
          { label: "Wirkungskreis festlegen", detail: "" },
          { label: "Kontaktwege aktuell halten", detail: "" },
        ],
        primaryLabel: "Eintrag beanspruchen",
        primaryHref: "/eintrag-beanspruchen",
        secondaryLabel: "Betrieb eintragen",
        secondaryHref: "/betrieb-eintragen",
      }),
      section({
        id: "home-positioning",
        label: "Positionierung",
        eyebrow: "Marktübersicht",
        title: "Für den gesamten Bau- und Handwerksmarkt.",
        body: "Jeder Betrieb soll unabhängig von Region, Größe oder Unternehmensalter die Möglichkeit haben, seine Leistungen klar darzustellen und gefunden zu werden.",
      }),
      section({
        id: "home-comparison",
        label: "Was GewerkeListe anders macht",
        eyebrow: "",
        title: "Was GewerkeListe.com anders macht",
        body: "",
        items: [
          { label: "Allgemeine Suchmaschinen", detail: "wenig fachliche Struktur · Spezialisierungen oft schwer erkennbar · Tätigkeitsgebiet unklar" },
          { label: "Klassische Auftragsportale", detail: "einzelne Anfragen · oft Preisdruck" },
          { label: "GewerkeListe.com", detail: "strukturierte Gewerkeliste · Leistungen sichtbar · Region und Tätigkeitsgebiet · Datenbestätigung statt Qualitätsversprechen · direkte Kontaktaufnahme" },
        ],
      }),
      section({
        id: "home-proof",
        label: "Vertrauen und Aufbauphase",
        eyebrow: "",
        title: "Bestätigte Betriebsdaten schaffen Vertrauen.",
        body: "Ein verifizierter Eintrag zeigt, dass Betriebsdaten übernommen und bestätigt wurden. Das ist keine Qualitätsgarantie, sondern ein Signal für nachvollziehbare Daten und aktuelle Kontaktwege.",
        items: [
          { label: "Aus echter Baupraxis entstanden.", detail: "GewerkeListe.com wurde von Andreas Moser gegründet. Er ist gelernter Maurer, Bauingenieur und kennt die Suche nach passenden Fachbetrieben aus der Baupraxis." },
          { label: "Aufbauphase", detail: "Das Register wächst Region für Region, Gewerk für Gewerk und Betrieb für Betrieb." },
        ],
      }),
      section({
        id: "home-closing",
        label: "Abschluss",
        eyebrow: "",
        title: "Suchen, finden, einordnen.",
        body: "Starten Sie mit Gewerk und Ort – oder übernehmen Sie den Eintrag Ihres Betriebs.",
        primaryLabel: "Fachbetrieb suchen",
        primaryHref: "/suche",
        secondaryLabel: "Eintrag beanspruchen",
        secondaryHref: "/eintrag-beanspruchen",
      }),
    ],
  },
  prices: {
    eyebrow: "Preise",
    title: "Sichtbarkeit bleibt kostenlos. Vertrauen braucht klare Leistungen.",
    intro: "GewerkeListe.com trennt das dauerhaft kostenlose Basisprofil von einem späteren verifizierten Startprofil. Die fachliche Auffindbarkeit und das organische Ranking hängen nicht von einer Zahlung ab.",
    primaryLabel: "Kostenloses Basisprofil eintragen",
    primaryHref: "/betrieb-eintragen",
    secondaryLabel: "Mehr über GewerkeListe",
    secondaryHref: "/ueber-gewerkeliste",
    sections: [
      section({
        id: "prices-status",
        label: "Status des verifizierten Startprofils",
        eyebrow: "",
        title: "Aktueller Status des verifizierten Startprofils",
        body: "",
        protected: true,
      }),
      section({
        id: "prices-basis",
        label: "Basisprofil",
        eyebrow: "Dauerhaft kostenlos",
        title: "Basisprofil",
        body: "Das Basisprofil macht einen Betrieb nach Gewerk, Leistung und Region auffindbar. Die tatsächliche Leistungsbreite wird nicht künstlich durch ein kostenpflichtiges Paket begrenzt.",
        protected: true,
      }),
      section({
        id: "prices-verified",
        label: "Verifiziertes Startprofil",
        eyebrow: "Perspektivisches Angebot",
        title: "Verifiziertes Startprofil",
        body: "Das verifizierte Startprofil beschreibt zusätzliche Prüf-, Strukturierungs- und Unterstützungsleistungen, sobald diese vollständig verfügbar, getestet und fachlich abgenommen sind.",
        protected: true,
      }),
      section({
        id: "prices-comparison",
        label: "Leistungsunterschiede",
        eyebrow: "",
        title: "Leistungsunterschiede auf einen Blick",
        body: "",
        protected: true,
      }),
      section({
        id: "prices-fairness",
        label: "Faire Auffindbarkeit",
        eyebrow: "",
        title: "Faire Auffindbarkeit",
        body: "Keine automatische Verlängerung und kein Monatsabo.\n\nKeine Bestellung, Zahlung oder Rechnung, solange das Angebot nicht freigegeben ist.\n\nEine Zahlung verändert weder Suchrelevanz noch organisches Ranking.",
        protected: true,
      }),
    ],
  },
  about: {
    eyebrow: "Warum GewerkeListe.com entsteht",
    title: "Warum GewerkeListe.com entsteht.",
    intro: "Weil die Suche nach passenden Bau- und Handwerksbetrieben heute noch viel zu oft über Zufall, alte Kontakte und persönliche Netzwerke läuft.",
    primaryLabel: "Betrieb kostenlos eintragen",
    primaryHref: "/betrieb-eintragen",
    secondaryLabel: "Fehlenden Betrieb vorschlagen",
    secondaryHref: "/betrieb-eintragen",
    sections: [
      section({
        id: "about-trust",
        label: "Vertrauen und Herkunft",
        eyebrow: "",
        title: "Gebaut von jemandem, der den Bau kennt.",
        body: "",
        items: [
          { label: "Gelernter Maurer", detail: "" },
          { label: "Bauingenieur", detail: "" },
          { label: "Bauherrenvertretung", detail: "" },
          { label: "Planung und Projektsteuerung", detail: "" },
          { label: "Erfahrung aus Auftraggeber- und Ausführungsperspektive", detail: "" },
          { label: "Aus der Region Rosenheim", detail: "" },
        ],
      }),
      section({
        id: "about-problem",
        label: "Das Problem",
        eyebrow: "Das Problem",
        title: "Der Markt ist nicht leer. Er ist nur schlecht sichtbar.",
        body: "Auf dem Bau fehlt nicht nur Personal. Oft fehlt vor allem Übersicht.\n\nViele Auftraggeber suchen passende Betriebe. Viele Betriebe leisten gute Arbeit. Viele Spezialisten sind regional vorhanden. Und trotzdem finden beide Seiten häufig nicht zusammen.\n\nDann wird telefoniert, herumgefragt, weiterempfohlen, gesucht und improvisiert. Große Büros fragen kleine Netzwerke. Bauleiter fragen andere Bauleiter. Bauherren suchen über Google. Gute Betriebe bleiben unsichtbar, wenn sie nicht zufällig genannt werden.\n\nDas kostet Zeit, Geld, Energie und oft auch Baufortschritt.",
        items: [
          { label: "fehlende Übersicht", detail: "" },
          { label: "verstreute Informationen", detail: "" },
          { label: "unklare Spezialisierungen", detail: "" },
          { label: "schwer erkennbare Einsatzgebiete", detail: "" },
        ],
      }),
      section({
        id: "about-observation",
        label: "Beobachtung aus der Praxis",
        eyebrow: "Beobachtung aus der Praxis",
        title: "Die entscheidende Frage lautet fast immer: Wer kann das wirklich?",
        body: "Bei Bauprojekten geht es selten nur um ein Gewerk. Es geht um konkrete Leistungen.\n\nNicht nur Gartenbau, sondern zum Beispiel Natursteinmauern, Granitpflaster, Entwässerungsrinnen, Außenanlagen, Stützwände oder Hofbefestigungen.\n\nNicht nur Elektro, sondern PV, Zähleranlagen, KNX, Baustrom, Ladeinfrastruktur oder Industrieinstallationen.\n\nNicht nur Metallbau, sondern Treppen, Geländer, Loftwände, Tore, Sonderkonstruktionen oder Edelstahlverarbeitung.\n\nGewerkeListe.com soll genau diese Leistungstiefe sichtbar machen. Deshalb darf ein Betrieb nicht künstlich auf wenige Leistungen begrenzt werden.",
        items: [
          { label: "Gewerke", detail: "" },
          { label: "Leistungen", detail: "" },
          { label: "Spezialisierungen", detail: "" },
          { label: "Tätigkeitsgebiet", detail: "" },
          { label: "Kontaktwege", detail: "" },
          { label: "Betriebsstatus", detail: "" },
        ],
      }),
      section({
        id: "about-positioning",
        label: "Was anders werden soll",
        eyebrow: "Was anders werden soll",
        title: "Nicht der billigste Betrieb. Der passende Betrieb.",
        body: "GewerkeListe.com soll keine Plattform werden, die Handwerker gegeneinander ausspielt.\n\nEs geht nicht darum, Preise zu drücken. Es geht darum, den Markt besser auffindbar zu machen.\n\nEin guter Betrieb soll gefunden werden, weil er die passende Leistung in der passenden Region anbietet. Ein Auftraggeber soll schneller erkennen, wer für sein Vorhaben grundsätzlich infrage kommt. Ein Planer oder Bauleiter soll nicht jedes Mal bei null anfangen müssen.",
      }),
      section({
        id: "about-boundary",
        label: "Klare Abgrenzung",
        eyebrow: "Klare Abgrenzung",
        title: "Kein Lead-Portal. Keine Kontaktbörse gegen Gebühr. Keine Preisschlacht.",
        body: "Viele bestehende Plattformen leben davon, Kontakte zu verkaufen oder Betriebe in Konkurrenz um einzelne Anfragen zu bringen.\n\nGewerkeListe.com verfolgt einen anderen Ansatz. Die Plattform soll zuerst Transparenz schaffen.\n\nDas Ziel ist nicht, den Markt auszupressen. Das Ziel ist, ihn besser zu ordnen.",
        items: [
          { label: "Welche Betriebe gibt es?", detail: "" },
          { label: "Wo sind sie tätig?", detail: "" },
          { label: "Welche Leistungen bieten sie an?", detail: "" },
          { label: "Welche Spezialisierungen haben sie?", detail: "" },
          { label: "Wie können Auftraggeber sie erreichen?", detail: "" },
          { label: "Welche Betriebe fehlen noch?", detail: "" },
        ],
      }),
      section({
        id: "about-benefit",
        label: "Gesellschaftlicher Nutzen",
        eyebrow: "Gesellschaftlicher Nutzen",
        title: "Weniger Zufall. Weniger Suchaufwand. Bessere Bauprojekte.",
        body: "Wenn der Markt transparenter wird, profitieren alle. GewerkeListe.com soll dazu beitragen, dass Bauprojekte einfacher, schneller und besser vorbereitet werden können.",
        items: [
          { label: "Auftraggeber finden schneller passende Betriebe.", detail: "" },
          { label: "Planer sparen Suchaufwand.", detail: "" },
          { label: "Bauleiter bekommen bessere Übersicht.", detail: "" },
          { label: "Betriebe werden mit ihren tatsächlichen Leistungen sichtbarer.", detail: "" },
          { label: "Regionale Kapazitäten können besser genutzt werden.", detail: "" },
          { label: "Unnötige Wege und ineffiziente Suche werden reduziert.", detail: "" },
        ],
      }),
      section({
        id: "about-build",
        label: "Aufbauphase",
        eyebrow: "Aufbauphase",
        title: "Wir bauen das pragmatisch auf.",
        body: "GewerkeListe.com befindet sich im Aufbau.\n\nDie Plattform startet bewusst einfach: Betriebe sichtbar machen, Leistungen erfassen, Regionen strukturieren und Suchenden eine bessere Übersicht geben.\n\nNicht perfekt am ersten Tag. Aber nützlich von Anfang an.\n\nMit jedem Betrieb, jedem Hinweis und jeder Verbesserung wird die Plattform wertvoller.",
        items: [
          { label: "Handwerksbetriebe", detail: "" },
          { label: "Bauleiter", detail: "" },
          { label: "Architekten", detail: "" },
          { label: "Planer", detail: "" },
          { label: "Projektentwickler", detail: "" },
          { label: "Bauherren", detail: "" },
          { label: "Hausverwaltungen", detail: "" },
          { label: "Kommunen", detail: "" },
          { label: "Unternehmen mit Bauprojekten", detail: "" },
        ],
      }),
      section({
        id: "about-finance",
        label: "Finanzierung und Fairness",
        eyebrow: "Finanzierung und Fairness",
        title: "Kostenlos starten. Echten Mehrwert später ausbauen.",
        body: "Der Basiseintrag soll niedrigschwellig bleiben, damit möglichst viele Betriebe sichtbar werden können.\n\nDer Aufbau einer guten Plattform kostet trotzdem Geld: Entwicklung, Hosting, Datenpflege, Prüfung, Verbesserung und Support.\n\nSpäter können zusätzliche Funktionen entstehen, wenn sie echten Mehrwert schaffen. Wichtig bleibt: Grundlegende Sichtbarkeit und das tatsächliche Leistungsspektrum eines Betriebs dürfen nicht künstlich versteckt werden.",
        items: [
          { label: "Verifizierung", detail: "" },
          { label: "Referenzprojekte", detail: "" },
          { label: "Bildergalerien", detail: "" },
          { label: "Unternehmensvorstellungen", detail: "" },
          { label: "Verfügbarkeiten", detail: "" },
          { label: "Matching", detail: "" },
          { label: "Ausschreibungen", detail: "" },
          { label: "professionelle Werkzeuge für Planer und Auftraggeber", detail: "" },
        ],
      }),
      section({
        id: "about-personal",
        label: "Persönlich",
        eyebrow: "Persönlich",
        title: "Warum ich das mache.",
        body: "Ich habe selbst auf dem Bau gearbeitet. Ich kenne Baustellen nicht nur aus Besprechungsräumen.\n\nSpäter habe ich Bauingenieurwesen studiert und auf Auftraggeberseite viele Projekte begleitet.\n\nDabei habe ich immer wieder gesehen, wie viel Zeit verloren geht, nur weil passende Betriebe schwer zu finden sind.\n\nDiese Lücke möchte ich schließen. Nicht theoretisch. Nicht kompliziert. Sondern pragmatisch, aus der Praxis heraus und Schritt für Schritt.",
        items: [
          { label: "Andreas Moser", detail: "Gelernter Maurer | Bauingenieur | Bauherrenvertreter | Gründer von GewerkeListe.com" },
        ],
      }),
      section({
        id: "about-join",
        label: "Mitmachen",
        eyebrow: "Mitmachen",
        title: "Hilf mit, die GewerkeListe besser zu machen.",
        body: "Eine gute GewerkeListe entsteht nicht am Schreibtisch allein. Sie entsteht durch Hinweise aus der Praxis. Wenn ein Betrieb fehlt, ein Gewerk nicht sauber erfasst ist oder eine Leistung besser beschrieben werden sollte, freue ich mich über Rückmeldung.",
        primaryLabel: "Betrieb eintragen",
        primaryHref: "/betrieb-eintragen",
        secondaryLabel: "Fehlenden Betrieb melden",
        secondaryHref: "/betrieb-eintragen",
      }),
    ],
  },
};

const editableFields = ["eyebrow", "title", "intro", "primaryLabel", "primaryHref", "secondaryLabel", "secondaryHref"] as const;

export function isEditablePageKey(value: string): value is EditablePageKey {
  return editablePageDefinitions.some((page) => page.key === value);
}

export function getPageSection(content: EditablePageContent, sectionId: string) {
  return content.sections.find((section) => section.id === sectionId) || null;
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

  const rawSections = candidate.sections;
  if (Array.isArray(rawSections)) {
    normalized.sections = defaults.sections.map((defaultSection) => {
      const candidateSection = rawSections.find(
        (item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && (item as Record<string, unknown>).id === defaultSection.id,
      );
      if (!candidateSection) return defaultSection;

      const normalizedSection: EditablePageSection = {
        ...defaultSection,
        enabled: typeof candidateSection.enabled === "boolean" ? candidateSection.enabled : defaultSection.enabled,
        eyebrow: readText(candidateSection.eyebrow, defaultSection.eyebrow),
        title: readText(candidateSection.title, defaultSection.title),
        body: readText(candidateSection.body, defaultSection.body),
        primaryLabel: readText(candidateSection.primaryLabel, defaultSection.primaryLabel),
        primaryHref: readHref(candidateSection.primaryHref, defaultSection.primaryHref),
        secondaryLabel: readText(candidateSection.secondaryLabel, defaultSection.secondaryLabel),
        secondaryHref: readHref(candidateSection.secondaryHref, defaultSection.secondaryHref),
        items: Array.isArray(candidateSection.items)
          ? candidateSection.items.slice(0, 20).map((item: unknown, index: number) => {
              const defaultItem = defaultSection.items[index] || { label: "", detail: "" };
              const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
              return {
                label: readText(record.label, defaultItem.label),
                detail: readText(record.detail, defaultItem.detail),
              };
            })
          : defaultSection.items,
      };

      return normalizedSection;
    });
  }

  return normalized;
}

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readHref(value: unknown, fallback: string) {
  return typeof value === "string" && isSafeInternalHref(value) ? value.trim() : fallback;
}

function isSafeInternalHref(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("/") && !trimmed.startsWith("//") && !/[\r\n]/.test(trimmed);
}
