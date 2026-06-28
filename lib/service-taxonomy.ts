import type { TradeHierarchyGroup } from "@/lib/trade-hierarchy";

export type ServiceActivity =
  | "Beratung"
  | "Planung"
  | "Lieferung"
  | "Fertigung"
  | "Montage"
  | "Einbau"
  | "Austausch"
  | "Reparatur"
  | "Wartung"
  | "Prüfung"
  | "Reinigung"
  | "Sanierung"
  | "Restaurierung"
  | "Gestaltung"
  | "Modernisierung"
  | "Rückbau"
  | "Entsorgung"
  | "Notdienst"
  | "Vermietung"
  | "Instandsetzung"
  | "Abdichtung"
  | "Dämmung"
  | "Beschichtung"
  | "Fräsen"
  | "Bohren"
  | "Schneiden"
  | "Schleifen"
  | "Trocknung"
  | "Analyse"
  | "Entwurf"
  | "Ausführung"
  | "Gutachten"
  | "Abnahme";

export type ServiceContextType = "building_type" | "project_type" | "customer_type" | "material" | "regulation" | "use_case";

export type ServiceContext = {
  name: string;
  slug: string;
  type: ServiceContextType;
};

export type ServiceTaxonomyService = {
  name: string;
  slug: string;
  description: string;
  aliases: string[];
  activities: ServiceActivity[];
  contexts: string[];
  crosslinks: string[];
  isPopular?: boolean;
  searchWeight?: number;
};

export type ServiceFamily = {
  name: string;
  slug: string;
  description: string;
  services: ServiceTaxonomyService[];
};

export type ServiceTaxonomyTrade = {
  name: string;
  slug: string;
  description: string;
  aliases: string[];
  families: ServiceFamily[];
};

export type ServiceTaxonomyGroup = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  trades: ServiceTaxonomyTrade[];
};

export const serviceActivities: ServiceActivity[] = [
  "Beratung",
  "Planung",
  "Lieferung",
  "Fertigung",
  "Montage",
  "Einbau",
  "Austausch",
  "Reparatur",
  "Wartung",
  "Prüfung",
  "Reinigung",
  "Sanierung",
  "Restaurierung",
  "Gestaltung",
  "Modernisierung",
  "Rückbau",
  "Entsorgung",
  "Notdienst",
  "Vermietung",
  "Instandsetzung",
  "Abdichtung",
  "Dämmung",
  "Beschichtung",
  "Fräsen",
  "Bohren",
  "Schneiden",
  "Schleifen",
  "Trocknung",
  "Analyse",
  "Entwurf",
  "Ausführung",
  "Gutachten",
  "Abnahme",
];

export const serviceContexts: ServiceContext[] = [
  ...contextList("building_type", [
    "Einfamilienhaus",
    "Mehrfamilienhaus",
    "Wohnung",
    "Gewerbe",
    "Industrie",
    "Büro",
    "Hotel",
    "Gastronomie",
    "Praxis",
    "Schule / Kita",
    "Kommune",
    "Landwirtschaft",
    "Denkmal",
    "Altbau",
    "Neubau",
    "Bestand",
    "Tiefgarage",
    "Halle",
    "Außenanlage",
    "Fassade",
    "Innenraum",
    "Dach",
    "Bad",
    "Serverraum",
    "Rechenzentrum",
    "Parkplatz",
    "Hof",
    "Zufahrt",
    "Straße",
  ]),
  ...contextList("use_case", [
    "barrierefrei",
    "brandschutzrelevant",
    "schallschutzrelevant",
    "feuchtebelastet",
    "denkmalgeschützt",
    "ökologisch / Naturbaustoffe",
    "energieeffizient",
    "schadstoffbelastet",
    "notdienstfähig",
    "förderfähig",
    "gewerblich",
    "privat",
    "industriell",
    "künstlerisch",
    "historisch",
    "technisch",
  ]),
];

export const serviceTaxonomy: ServiceTaxonomyGroup[] = [
  group(1, "Planung, Gutachten & Bauleitung", "Fachplanung, Nachweise, Gutachten und Bauüberwachung.", [
    trade("architekt", "Architektur & Entwurf", "Gebäudeentwurf, Genehmigungsplanung und Ausführungsplanung.", [
      family("Architektur", ["Architektur", "Bauantrag", "Eingabeplanung", "Ausführungsplanung", "Nutzungsänderung", "Umbauplanung", "Sanierungsplanung", "Innenarchitektur"], {
        aliases: ["Architekt", "Architekturbüro", "Bauplaner", "Entwurfsplanung"],
        activities: ["Beratung", "Planung", "Abnahme"],
        contexts: ["Einfamilienhaus", "Mehrfamilienhaus", "Altbau", "Gewerbe"],
      }),
    ]),
    trade("tragwerksplanung", "Tragwerksplanung & Statik", "Bemessung und Prüfung tragender Bauteile.", [
      family("Statik", ["Statik", "Tragwerksplanung", "Durchbruchstatik", "Bestandsstatik", "Holzbaustatik", "Stahlbaustatik"], {
        aliases: ["Statiker", "Bauingenieur", "Tragwerksplaner"],
        activities: ["Planung", "Prüfung", "Gutachten"],
        contexts: ["Bestand", "Neubau", "Altbau", "Gewerbe"],
      }),
    ]),
    trade("energieberatung", "Energieberatung & Bauphysik", "Energetische Bewertung und bauphysikalische Nachweise.", [
      family("Energie & Bauphysik", ["Energieberatung", "Energieausweis", "Sanierungsfahrplan", "Heizlastberechnung", "Wärmebrückenberechnung", "Blower-Door-Test", "Lüftungskonzept", "Fördermittelberatung"], {
        aliases: ["Energieberater", "Bauphysiker", "iSFP"],
        activities: ["Beratung", "Analyse", "Gutachten", "Planung"],
        contexts: ["energieeffizient", "förderfähig", "Altbau", "Neubau"],
      }),
    ]),
    trade("brandschutzplanung", "Brandschutzplanung & SiGeKo", "Brandschutzkonzepte, Nachweise und Sicherheitskoordination.", [
      family("Brandschutzplanung", ["Brandschutzkonzept", "Brandschutznachweis", "Feuerwehrplan", "SiGeKo"], {
        aliases: ["Brandschutzplaner", "Sicherheitskoordinator", "SiGeKo"],
        activities: ["Planung", "Prüfung", "Gutachten"],
        contexts: ["brandschutzrelevant", "Gewerbe", "Schule / Kita", "Kommune"],
      }),
    ]),
    trade("vermessung", "Vermessung, Baugrund & Geotechnik", "Vermessung, Baugrundbeurteilung und Geotechnik.", [
      family("Vermessung und Baugrund", ["Vermessung", "Schnurgerüst", "Baugrundgutachten", "Bodengutachten", "Altlastengutachten"], {
        aliases: ["Vermesser", "Geotechniker", "Bodengutachter"],
        activities: ["Analyse", "Gutachten", "Prüfung"],
        contexts: ["Neubau", "Grundstück", "schadstoffbelastet"],
      }),
    ]),
    trade("sachverstaendige", "Gutachter & Sachverständige", "Bewertung von Schäden, Immobilien und Bauleistungen.", [
      family("Gutachten", ["Bauschadengutachten", "Schimmelgutachten", "Immobilienbewertung", "Bauabnahme"], {
        aliases: ["Bausachverständiger", "Gutachter", "Bauberater"],
        activities: ["Gutachten", "Analyse", "Abnahme"],
        contexts: ["Bestand", "feuchtebelastet", "Altbau"],
      }),
    ]),
  ]),
  group(2, "Baustellenvorbereitung, Gerüst & Baulogistik", "Baustelle einrichten, sichern, versorgen und zugänglich machen.", [
    trade("arbeitssicherheit-baustelle", "Baustelleneinrichtung", "Vorbereitung und technische Einrichtung von Baustellen.", [
      family("Baustelle", ["Baustelleneinrichtung", "Bauzaun", "Baustrom", "Bauwasser", "Baustellenbeleuchtung", "Baustellencontainer", "Staubschutz", "Lärmschutz", "Bauheizung"], {
        aliases: ["Baustromkasten", "Bauzaun mieten", "Baulogistik"],
        activities: ["Lieferung", "Montage", "Vermietung"],
        contexts: ["Neubau", "Bestand", "Gewerbe"],
      }),
    ]),
    trade("geruestbau", "Gerüstbau", "Arbeits-, Schutz- und Fassadengerüste.", [
      family("Gerüste", ["Gerüstbau", "Fassadengerüst", "Arbeitsgerüst", "Schutzgerüst", "Dachfanggerüst", "Raumgerüst", "Wetterschutzdach", "Einhausung", "Treppenturm"], {
        aliases: ["Baugerüst", "Gerüstbauer"],
        activities: ["Montage", "Vermietung", "Rückbau"],
        contexts: ["Fassade", "Dach", "Bestand"],
      }),
    ]),
    trade("aufzugstechnik", "Baulogistik, Hebetechnik & Krane", "Hebe- und Zugangstechnik für Baustellen.", [
      family("Hebetechnik", ["Autokran", "Mobilkran", "Minikran", "Arbeitsbühne", "Teleskopstapler", "Schwertransport", "Hebearbeiten"], {
        aliases: ["Kranservice", "Autokran mieten", "Arbeitsbühne mieten"],
        activities: ["Vermietung", "Montage", "Lieferung"],
        contexts: ["Gewerbe", "Industrie", "Neubau"],
      }),
    ]),
    trade("verkehrssicherung", "Verkehrssicherung", "Absicherung von Baustellen und Verkehrsflächen.", [
      family("Absicherung", ["Verkehrssicherung", "Baustellenabsicherung", "Straßensperrung", "Halteverbotszone", "Baustellenampel"], {
        aliases: ["Straßensperre", "Absperrung"],
        activities: ["Planung", "Montage", "Prüfung"],
        contexts: ["Kommune", "Straße", "Gewerbe"],
      }),
    ]),
  ]),
  group(3, "Abbruch, Rückbau & Schadstoffe", "Rückbau, Entkernung, Schadstoffsanierung und Entsorgung.", [
    trade("abbrucharbeiten", "Abbruch & Rückbau", "Teilabbruch, Entkernung und selektiver Rückbau.", [
      family("Rückbau", ["Gebäudeabbruch", "Teilabbruch", "Innenabbruch", "Entkernung", "Rückbau", "selektiver Rückbau", "Betonabbruch", "Mauerwerksabbruch", "Fundamentabbruch", "Estrichabbruch", "Fliesenabbruch", "Dachrückbau"], {
        aliases: ["Abriss", "Abbruchunternehmen", "Haus abreißen", "Entkernen"],
        activities: ["Rückbau", "Entsorgung", "Schneiden"],
        contexts: ["Bestand", "schadstoffbelastet", "Gewerbe"],
      }),
    ]),
    trade("schadstoffsanierung", "Schadstoffsanierung", "Sanierung belasteter Baustoffe und Bereiche.", [
      family("Schadstoffe", ["Asbestsanierung", "KMF-Sanierung", "PAK-Sanierung", "PCB-Sanierung", "Schimmelsanierung", "Schadstoffanalyse", "Schadstoffrückbau"], {
        aliases: ["Asbest entfernen", "KMF entfernen", "PAK entfernen"],
        activities: ["Analyse", "Sanierung", "Entsorgung"],
        contexts: ["schadstoffbelastet", "Bestand", "Altbau"],
      }),
    ]),
    trade("containerdienst", "Entsorgung & Recycling", "Entsorgung von Bauschutt, Aushub und Baustellenabfällen.", [
      family("Entsorgung", ["Bauschuttentsorgung", "Containerdienst", "Erdaushubentsorgung", "Betonrecycling", "Baustellenabfall", "Entrümpelung"], {
        aliases: ["Bauschutt Container", "Container bestellen"],
        activities: ["Entsorgung", "Lieferung", "Vermietung"],
        contexts: ["Bestand", "Neubau", "Gewerbe"],
      }),
    ]),
  ]),
  group(4, "Erd-, Tief- & Spezialtiefbau", "Baugrund, Baugrube, Entwässerung, Leitungsbau und Spezialtiefbau.", [
    trade("erdarbeiten", "Erdarbeiten & Baugrube", "Aushub, Planum, Verfüllung und Baugrubenvorbereitung.", [
      family("Erdbau", ["Erdarbeiten", "Aushub", "Baugrube", "Humusabtrag", "Planum", "Frostschutzschicht", "Schottertragschicht", "Verfüllung", "Verdichtung", "Bodenaustausch", "Baugrubensicherung", "Minibaggerarbeiten"], {
        aliases: ["Erdbauer", "Baggerarbeiten", "Baugrube ausheben"],
        activities: ["Rückbau", "Lieferung", "Montage"],
        contexts: ["Neubau", "Außenanlage", "Gewerbe"],
      }),
    ]),
    trade("kanalbau", "Entwässerung, Kanal & Drainage", "Grundstücksentwässerung, Drainage und Kanalarbeiten.", [
      family("Entwässerung", ["Kanalbau", "Hausanschluss Kanal", "Regenwasserleitung", "Schmutzwasserleitung", "Drainage", "Versickerung", "Rigole", "Sickerschacht", "Zisterne", "Rückstauklappe", "Hebeanlage außen", "Kanalinspektion", "Kanalkamera", "Kanalsanierung", "Dichtheitsprüfung"], {
        aliases: ["Kanalanschluss", "Drainage legen", "Grundstücksentwässerung"],
        activities: ["Montage", "Prüfung", "Sanierung"],
        contexts: ["Außenanlage", "Bestand", "feuchtebelastet"],
      }),
    ]),
    trade("leitungsbau", "Leitungsbau & Infrastruktur", "Leitungen, Leerrohre und Trassen im Außenbereich.", [
      family("Leitungsbau", ["Wasserleitung außen", "Gasleitung außen", "Kabeltiefbau", "Glasfasertrasse", "Fernwärmeleitung", "Leerrohrverlegung", "Hausanschlüsse", "Horizontalspülbohrung", "Rohrvortrieb"], {
        aliases: ["Glasfaser Tiefbau", "Kabelgraben", "Hausanschlüsse"],
        activities: ["Montage", "Bohren", "Sanierung"],
        contexts: ["Kommune", "Gewerbe", "Bestand"],
      }),
    ]),
    trade("tiefbau", "Spezialtiefbau", "Verbau, Pfähle, Unterfangung und Wasserhaltung.", [
      family("Spezialtiefbau", ["Verbau", "Berliner Verbau", "Spundwand", "Bohrpfahl", "Mikropfahl", "Unterfangung", "Hangsicherung", "Wasserhaltung", "Grundwasserabsenkung"], {
        aliases: ["Spezialtiefbauer", "Verbauarbeiten"],
        activities: ["Planung", "Montage", "Bohren"],
        contexts: ["Baugrube", "Gewerbe", "Bestand"],
      }),
    ]),
    trade("geotechnik", "Brunnenbau & Geothermie", "Brunnen und Bohrungen für Wasser und Erdwärme.", [
      family("Bohrungen", ["Brunnenbau", "Tiefbrunnen", "Gartenbrunnen", "Geothermiebohrung", "Erdwärmesonde"], {
        aliases: ["Brunnen bohren", "Erdwärme bohren"],
        activities: ["Bohren", "Planung", "Prüfung"],
        contexts: ["Außenanlage", "energieeffizient", "Landwirtschaft"],
      }),
    ]),
  ]),
  group(5, "Rohbau, Beton, Mauerwerk & Tragwerk", "Massive Bauteile, Beton, Mauerwerk, Abdichtung und Durchbrüche.", [
    trade("maurerarbeiten", "Maurerarbeiten & Mauerwerk", "Mauerwerk im Neubau und Bestand.", [
      family("Mauerwerk", ["Mauerarbeiten", "Ziegelmauerwerk", "Porenbeton", "Kalksandstein", "Natursteinmauerwerk", "Sichtmauerwerk", "tragende Wände", "nichttragende Wände", "Sturz einbauen", "Wanddurchbruch", "Ringanker", "Mauerwerkssanierung"], {
        aliases: ["Maurer", "Rohbauer", "Mauerwerksbau"],
        activities: ["Einbau", "Sanierung", "Instandsetzung"],
        contexts: ["Neubau", "Bestand", "Altbau"],
      }),
    ]),
    trade("betonbau", "Beton- & Stahlbetonbau", "Beton- und Stahlbetonbauteile.", [
      family("Beton", ["Betonarbeiten", "Stahlbetonarbeiten", "Fundamente", "Bodenplatte", "Streifenfundament", "Betonwände", "Betondecken", "Betonstützen", "Treppen aus Beton", "Ortbeton", "Fertigteilmontage", "Sichtbeton", "WU-Beton", "weiße Wanne"], {
        aliases: ["Betonbauer", "Stahlbetonbauer", "Bodenplatte betonieren", "Fundament betonieren"],
        activities: ["Montage", "Einbau", "Instandsetzung"],
        contexts: ["Neubau", "Gewerbe", "Industrie"],
      }),
    ]),
    trade("schalungsarbeiten", "Schalung & Bewehrung", "Schalung, Bewehrung und Betonvorbereitung.", [
      family("Schalung und Bewehrung", ["Schalungsarbeiten", "Bewehrungsarbeiten", "Bewehrung verlegen", "Einbauteile Beton"], {
        aliases: ["Schaler", "Bewehrer"],
        activities: ["Montage", "Einbau", "Prüfung"],
        contexts: ["Neubau", "Gewerbe", "Industrie"],
      }),
    ]),
    trade("kernbohrungen", "Kernbohren, Schneiden & Fräsen", "Bohr- und Schneidarbeiten an Beton und Mauerwerk.", [
      family("Bohren und Schneiden", ["Kernbohrung", "Betonbohren", "Mauerwerksbohren", "Betonsägen", "Wandsägen", "Deckensägen", "Fugenschneiden", "Seilsägen", "Betonfräsen", "Beton schleifen", "Deckendurchbruch", "Türöffnung schneiden", "Fensteröffnung schneiden"], {
        aliases: ["Kernbohrer", "Beton sägen", "Betonschneider", "Durchbruch Firma"],
        activities: ["Bohren", "Schneiden", "Fräsen", "Schleifen"],
        contexts: ["Bestand", "Umbau", "Gewerbe"],
      }),
    ]),
    trade("bauwerksabdichtung", "Bauwerksabdichtung", "Abdichtung erdberührter und feuchtebelasteter Bauteile.", [
      family("Abdichtung", ["Kellerabdichtung", "Außenabdichtung", "Innenabdichtung", "schwarze Wanne", "Horizontalsperre", "Injektionsabdichtung", "Rissverpressung", "Sockelabdichtung"], {
        aliases: ["Abdichter", "Keller trockenlegen", "Feuchtigkeitssanierung"],
        activities: ["Abdichtung", "Sanierung", "Instandsetzung"],
        contexts: ["feuchtebelastet", "Bestand", "Keller"],
      }),
    ]),
  ]),
  group(6, "Holzbau, Zimmerer & Fertigbau", "Zimmererarbeiten, Holzbau, Holzrahmenbau und Systembau.", [
    trade("zimmererarbeiten", "Zimmererarbeiten & Dachstuhl", "Dachstühle, Holzbauteile und Zimmererarbeiten.", [
      family("Zimmererarbeiten", ["Zimmererarbeiten", "Dachstuhl", "Dachgauben", "Dachaufstockung", "Dachsanierung Holz", "Carport", "Vordach Holz", "Holzterrasse", "Pergola", "Abbund"], {
        aliases: ["Zimmerer", "Zimmermann", "Dachstuhl bauen", "Abbund"],
        activities: ["Planung", "Montage", "Sanierung"],
        contexts: ["Neubau", "Bestand", "Altbau"],
      }),
    ]),
    trade("holzbau", "Holzbau & Holzrahmenbau", "Tragende und nichttragende Holzbausysteme.", [
      family("Holzbau", ["Holzrahmenbau", "Holzständerbau", "Holztafelbau", "Massivholzbau", "Brettsperrholz", "CLT", "Blockhaus", "Modulbau Holz", "Anbau Holz", "Aufstockung Holz", "Holzfassade", "Holzbalkendecke", "Holzschutz"], {
        aliases: ["Holzbauer", "Holzständer", "CLT", "Holzrahmen"],
        activities: ["Planung", "Montage", "Sanierung"],
        contexts: ["Neubau", "Bestand", "ökologisch / Naturbaustoffe"],
      }),
    ]),
    trade("fertigteilmontage", "Fertigbau, Modulbau & Systembau", "Fertige Raum- und Gebäudemodule.", [
      family("Systembau", ["Fertighausmontage", "Modulbau", "Containerbau", "Systembau", "Raummodule", "Elementmontage"], {
        aliases: ["Fertigbau", "Modulhaus", "Containergebäude"],
        activities: ["Montage", "Lieferung", "Planung"],
        contexts: ["Neubau", "Gewerbe", "Kommune"],
      }),
    ]),
  ]),
  group(7, "Dach, Abdichtung & Spengler", "Dachdeckung, Dachabdichtung, Spenglerarbeiten und PV-Dachmontage.", [
    trade("dachdeckerarbeiten", "Dachdeckerarbeiten", "Steildach, Dachsanierung und Dachdetails.", [
      family("Steildach", ["Steildach", "Dachdeckung", "Ziegeldach", "Betondachstein", "Schieferdach", "Metalldach", "Dachsanierung", "Umdeckung", "Dachreparatur", "Dachwartung", "Dachfenster", "Dachflächenfenster", "Schneefang", "Dachentwässerung", "Aufsparrendämmung", "Zwischensparrendämmung"], {
        aliases: ["Dachdecker", "Bedachungen", "Dach neu eindecken"],
        activities: ["Montage", "Sanierung", "Wartung"],
        contexts: ["Dach", "Bestand", "Neubau"],
      }),
    ]),
    trade("flachdachabdichtung", "Flachdach & Dachabdichtung", "Abdichtung von Flachdächern, Terrassen und Anschlüssen.", [
      family("Flachdach", ["Flachdachabdichtung", "Bitumenbahn", "Kunststoffbahn", "EPDM", "Flüssigkunststoff", "Attikaabdichtung", "Dachterrassenabdichtung", "Balkonabdichtung", "Gründach", "Retentionsdach", "Lichtkuppel", "Dachabläufe", "Leckageortung Dach"], {
        aliases: ["Flachdachdecker", "EPDM Dach", "Bitumendach"],
        activities: ["Abdichtung", "Sanierung", "Prüfung"],
        contexts: ["Dach", "feuchtebelastet", "Gewerbe"],
      }),
    ]),
    trade("spenglerarbeiten", "Spengler / Klempner / Blechner", "Blechanschlüsse, Dachrinnen und Blechfassaden.", [
      family("Spenglerarbeiten", ["Spenglerarbeiten", "Dachrinne", "Fallrohr", "Blechanschlüsse", "Kaminverkleidung", "Attikablech", "Mauerabdeckung", "Fensterbank außen", "Stehfalz", "Falzdach", "Blechfassade"], {
        aliases: ["Spengler", "Klempner", "Blechner", "Dachrinne montieren"],
        activities: ["Montage", "Reparatur", "Sanierung"],
        contexts: ["Dach", "Fassade", "Bestand"],
      }),
    ]),
    trade("photovoltaik", "PV-Dachmontage", "PV-Unterkonstruktionen und Modulmontage am Dach.", [
      family("PV am Dach", ["PV-Unterkonstruktion", "Dachhaken", "Solarmodulmontage", "Indach-PV", "Aufdach-PV", "Flachdach-PV", "Dachprüfung PV"], {
        aliases: ["PV Dachmontage", "Solarmodulmontage", "Aufdach PV"],
        activities: ["Montage", "Prüfung", "Wartung"],
        contexts: ["Dach", "energieeffizient", "Neubau"],
        crosslinks: ["photovoltaik", "elektroinstallation"],
      }),
    ]),
  ]),
  group(8, "Fassade, Putz, Stuck & Dämmung", "Putz, Fassadensysteme, Dämmung und Fassadensanierung.", [
    trade("verputzarbeiten", "Putz & Stuck", "Innenputz, Außenputz, Naturputze und Stuckarbeiten.", [
      family("Putzsysteme", ["Innenputz", "Außenputz", "Gipsputz", "Kalkzementputz", "Kalkputz", "Lehmputz", "Lehmfeinputz", "Tadelakt", "Sanierputz", "Sockelputz", "Wärmedämmputz", "Akustikputz", "Brandschutzputz", "Maschinenputz", "Handputz", "Feinputz", "Strukturputz", "Glattputz", "Putzsanierung", "Putzfräsen", "Altputz entfernen", "Risssanierung", "Stuckarbeiten", "Stuckrestaurierung", "Denkmalputz", "Schimmelsanierung mit Kalkputz"], {
        aliases: ["Verputzer", "Gipser", "Stuckateur", "Lehmputzer", "Naturputz", "Putz abfräsen"],
        activities: ["Beratung", "Lieferung", "Sanierung", "Fräsen"],
        contexts: ["Altbau", "Denkmal", "ökologisch / Naturbaustoffe", "feuchtebelastet"],
      }),
    ]),
    trade("waermedaemmverbundsysteme", "Wärmedämmung & WDVS", "Fassaden- und Bauteildämmung.", [
      family("Dämmung", ["WDVS", "Fassadendämmung", "Innendämmung", "Kellerdeckendämmung", "oberste Geschossdeckendämmung", "Einblasdämmung", "Holzfaserdämmung", "Mineralwolldämmung", "EPS-Dämmung", "Hanfdämmung", "Kalziumsilikatplatten", "Sockeldämmung", "Perimeterdämmung", "ökologische Dämmung"], {
        aliases: ["Wärmedämmverbundsystem", "Dämmfirma", "Fassade dämmen", "Innendämmung Altbau"],
        activities: ["Dämmung", "Sanierung", "Montage"],
        contexts: ["energieeffizient", "Altbau", "förderfähig"],
      }),
    ]),
    trade("vorhangfassaden", "Vorgehängte hinterlüftete Fassade", "Bekleidete hinterlüftete Fassadensysteme.", [
      family("VHF", ["VHF-Fassade", "Holzfassade", "Metallfassade", "Faserzementfassade", "HPL-Fassade", "Keramikfassade", "Natursteinfassade", "Fassadenplatten"], {
        aliases: ["VHF", "hinterlüftete Fassade", "Vorhangfassade"],
        activities: ["Planung", "Montage", "Sanierung"],
        contexts: ["Fassade", "Gewerbe", "Bestand"],
      }),
    ]),
    trade("fassadensanierung", "Fassadensanierung & Fassadenreinigung", "Sanierung, Reinigung und Schutz von Fassaden.", [
      family("Fassade im Bestand", ["Fassadensanierung", "Fassadenreinigung", "Algenentfernung", "Moosentfernung", "Fassadenanstrich", "Sockelsanierung", "Graffitientfernung", "Hydrophobierung"], {
        aliases: ["Fassade reinigen", "Sockel sanieren", "Graffiti entfernen"],
        activities: ["Reinigung", "Sanierung", "Beschichtung"],
        contexts: ["Bestand", "Fassade", "Gewerbe"],
      }),
    ]),
  ]),
  group(9, "Fenster, Türen, Glas & Sonnenschutz", "Öffnungen, Verglasung, Türen, Tore und Sonnenschutz.", [
    trade("fensterbau", "Fensterbau", "Fenster, Fenstermontage und Fenstertausch.", [
      family("Fenster", ["Fenster", "Kunststofffenster", "Holzfenster", "Holz-Alu-Fenster", "Aluminiumfenster", "Denkmalschutzfenster", "Schallschutzfenster", "Sicherheitsfenster", "Dachflächenfenster", "Kellerfenster", "Fensterreparatur", "Fensterwartung", "Fenstermontage", "Fensteraustausch"], {
        aliases: ["Fensterbauer", "Fensterfirma", "Fenster tauschen"],
        activities: ["Montage", "Austausch", "Wartung"],
        contexts: ["Altbau", "Neubau", "denkmalgeschützt"],
      }),
    ]),
    trade("tuerbau", "Türen, Tore & Schließtechnik", "Türen, Tore und Schließanlagen.", [
      family("Türen und Tore", ["Haustür", "Innentür", "Wohnungseingangstür", "Brandschutztür", "Rauchschutztür", "Schallschutztür", "Sicherheitstür", "Glastür", "Schiebetür", "Automatiktür", "Garagentor", "Sektionaltor", "Rolltor", "Industrietor", "Schließanlage"], {
        aliases: ["Türenbauer", "Haustür einbauen", "Garagentor"],
        activities: ["Montage", "Austausch", "Wartung"],
        contexts: ["brandschutzrelevant", "schallschutzrelevant", "Gewerbe"],
      }),
    ]),
    trade("glaserarbeiten", "Glas & Verglasung", "Glasbauteile, Reparatur und Verglasung.", [
      family("Glas", ["Isolierglas", "Sicherheitsglas", "VSG", "ESG", "Glasfassade", "Glasgeländer", "Glasdach", "Duschtrennwand", "Schaufenster", "Glasreparatur", "Notverglasung"], {
        aliases: ["Glaser", "Glaserei", "Glasbruch"],
        activities: ["Montage", "Reparatur", "Notdienst"],
        contexts: ["Gewerbe", "Wohnung", "Bestand"],
      }),
    ]),
    trade("sonnenschutz", "Rollladen, Raffstore & Sonnenschutz", "Außenliegender und innenliegender Sonnenschutz.", [
      family("Sonnenschutz", ["Rollladen", "Raffstore", "Außenjalousie", "Markise", "Zip-Screen", "Sonnensegel", "Insektenschutz", "Rollladenmotor", "Sonnenschutzsteuerung", "Rollladenreparatur", "Markisenreparatur"], {
        aliases: ["Rollladenbauer", "Raffstore einbauen", "Markise montieren"],
        activities: ["Montage", "Reparatur", "Wartung"],
        contexts: ["Wohnung", "Gewerbe", "Bestand"],
      }),
    ]),
  ]),
  group(10, "Sanitär, Heizung, Klima, Lüftung & Kälte", "Sanitär, Bad, Wärmeerzeuger, Lüftung, Klima und Isolierung.", [
    trade("sanitaerinstallation", "Sanitär & Bad", "Sanitärinstallation und Badleistungen.", [
      family("Sanitär", ["Sanitärinstallation", "Trinkwasserinstallation", "Abwasserinstallation innen", "Badinstallation", "Badsanierung", "barrierefreies Bad", "bodengleiche Dusche", "Vorwandinstallation", "Enthärtungsanlage", "Wasserfilter", "Hebeanlage", "Rückstauklappe", "Regenwassernutzung", "Leckageortung", "Rohrbruch", "Rohrreinigung innen", "Trinkwasserhygiene"], {
        aliases: ["Sanitärfirma", "Installateur", "Bad sanieren", "SHK"],
        activities: ["Einbau", "Reparatur", "Wartung"],
        contexts: ["barrierefrei", "Wohnung", "Gewerbe"],
      }),
    ]),
    trade("heizungsbau", "Heizung & Wärmeerzeuger", "Wärmeerzeuger und Heizungsanlagen.", [
      family("Wärmeerzeuger", ["Gastherme", "Gas-Brennwertgerät", "Gasheizung", "Gasthermenwartung", "Gasthermenreparatur", "Ölheizung", "Wärmepumpe", "Luft-Wasser-Wärmepumpe", "Sole-Wasser-Wärmepumpe", "Wasser-Wasser-Wärmepumpe", "Hybridheizung", "Pelletheizung", "Hackschnitzelheizung", "Scheitholzheizung", "Holzvergaser", "Biomasseheizung", "Fernwärme", "Nahwärme", "BHKW", "Solarthermie", "Pufferspeicher", "Warmwasserspeicher", "Frischwasserstation", "Heizzentrale", "Heizungstausch", "Heizungsoptimierung"], {
        aliases: ["Heizungsbauer", "Brennwerttherme", "Therme", "Hackschnitzelkessel", "Biomassekessel"],
        activities: ["Einbau", "Austausch", "Wartung", "Reparatur", "Notdienst"],
        contexts: ["Wohnung", "Mehrfamilienhaus", "Landwirtschaft", "energieeffizient"],
      }),
    ]),
    trade("heizungsbau", "Wärmeverteilung & Flächenheizung", "Heizflächen, Verteiler und hydraulische Einregulierung.", [
      family("Flächenheizung", ["Fußbodenheizung", "Wandheizung", "Deckenheizung", "Heizkörper", "Heizkörpertausch", "Heizkreisverteiler", "hydraulischer Abgleich", "Pumpentausch", "Fußbodenheizung nachrüsten", "Fußbodenheizung fräsen"], {
        aliases: ["FBH fräsen", "Fussbodenheizung fräsen", "hydraulisch abgleichen"],
        activities: ["Einbau", "Fräsen", "Wartung", "Modernisierung"],
        contexts: ["Altbau", "Bestand", "energieeffizient"],
      }),
    ]),
    trade("ofenbau", "Ofen, Kamin & Luftheizung", "Einzelöfen, Kamine und Schornsteinanschluss.", [
      family("Ofen und Kamin", ["Kaminofen", "Kachelofen", "Grundofen", "Pelletofen", "Ofenbau", "Schornsteinanschluss", "Edelstahlkamin", "Schornsteinsanierung"], {
        aliases: ["Ofenbauer", "Kaminbauer"],
        activities: ["Beratung", "Einbau", "Sanierung"],
        contexts: ["Wohnung", "Altbau", "Bestand"],
      }),
    ]),
    trade("lueftung", "Lüftung", "Wohnraum- und Gewerbelüftung.", [
      family("Lüftung", ["Wohnraumlüftung", "zentrale Lüftungsanlage", "dezentrale Lüftungsanlage", "Lüftung mit Wärmerückgewinnung", "KWL", "Badlüfter", "Küchenabluft", "Brandschutzklappen", "Lüftungsreinigung", "Lüftungswartung"], {
        aliases: ["Lüftungsbauer", "RLT", "KWL"],
        activities: ["Planung", "Einbau", "Wartung", "Reinigung"],
        contexts: ["energieeffizient", "Gewerbe", "Wohnung"],
      }),
    ]),
    trade("kaelte-klima", "Klima & Kälte", "Klima- und Kälteanlagen.", [
      family("Kälte und Klima", ["Klimaanlage", "Split-Klimaanlage", "Multi-Split-Klimaanlage", "VRF-Anlage", "Kaltwassersatz", "Klimawartung", "Kühlraum", "Tiefkühlzelle", "Serverraumkühlung"], {
        aliases: ["Klimatechniker", "Splitgerät", "Kälteanlagenbauer"],
        activities: ["Einbau", "Wartung", "Reparatur"],
        contexts: ["Gewerbe", "Industrie", "Büro"],
      }),
    ]),
    trade("technische-isolierung", "Technische Isolierung", "Dämmung technischer Leitungen und Anlagen.", [
      family("Isolierung", ["Rohrdämmung", "Heizungsrohrdämmung", "Kältedämmung", "Lüftungskanaldämmung", "Brandschutzdämmung", "technische Isolierung"], {
        aliases: ["Isolierer", "Rohrisolierung"],
        activities: ["Dämmung", "Montage", "Wartung"],
        contexts: ["Gewerbe", "Industrie", "brandschutzrelevant"],
      }),
    ]),
  ]),
  group(11, "Elektro, Energie, Sicherheit, IT & Automation", "Elektroinstallation, Energie, Automation, Sicherheit und IT.", [
    trade("elektroinstallation", "Elektroinstallation", "Elektrische Anlagen im Gebäude.", [
      family("Elektro", ["Elektroinstallation", "Altbauelektrik", "Neubauinstallation", "Zählerschrank", "Unterverteilung", "Sicherungskasten", "Steckdosen", "Lichtschalter", "Beleuchtung", "LED-Beleuchtung", "Außenbeleuchtung", "Baustrom", "Erdung", "Potentialausgleich", "Elektroprüfung", "Fehlerstromschutz", "Überspannungsschutz", "Kabelverlegung", "Notstrom"], {
        aliases: ["Elektriker", "Elektroinstallateur", "Sicherungskasten erneuern", "Zählerschrank erneuern"],
        activities: ["Einbau", "Austausch", "Prüfung", "Wartung"],
        contexts: ["Altbau", "Neubau", "Gewerbe"],
      }),
    ]),
    trade("photovoltaik", "Photovoltaik, Speicher & E-Mobilität", "PV-Anlagen, Speicher und Ladeinfrastruktur.", [
      family("PV und Speicher", ["Photovoltaik", "PV-Anlage", "Aufdach-PV", "Indach-PV", "Flachdach-PV", "Freiflächen-PV", "Wechselrichter", "Batteriespeicher", "Stromspeicher", "Energiemanagement", "Wallbox", "Lastmanagement", "PV-Wartung", "PV-Reinigung", "PV-Erweiterung", "PV-Repowering", "Eigenverbrauchsoptimierung", "Notstrom PV", "Inselanlage"], {
        aliases: ["PV Firma", "Solaranlage", "Solarstrom", "Wallbox installieren"],
        activities: ["Planung", "Montage", "Wartung", "Reinigung"],
        contexts: ["energieeffizient", "Einfamilienhaus", "Gewerbe"],
        crosslinks: ["dachdeckerarbeiten", "spenglerarbeiten"],
      }),
    ]),
    trade("knx-smart-home", "Smart Home & Gebäudeautomation", "Automation und Steuerung von Gebäudefunktionen.", [
      family("Automation", ["Smart Home", "KNX", "Gebäudeautomation", "MSR-Technik", "DDC", "GLT", "Lichtsteuerung", "Heizungssteuerung", "Verschattungssteuerung", "Zutrittssteuerung", "Raumautomation", "Visualisierung"], {
        aliases: ["KNX Elektriker", "Smart Home Installateur", "Gebäudeautomatisierung", "MSR", "GLT"],
        activities: ["Planung", "Einbau", "Wartung"],
        contexts: ["Gewerbe", "Wohnung", "energieeffizient"],
      }),
    ]),
    trade("sicherheitstechnik", "Sicherheitstechnik", "Alarm, Video, Zutritt und Sicherheitssysteme.", [
      family("Sicherheit", ["Alarmanlage", "Einbruchmeldeanlage", "Videoüberwachung", "Sprechanlage", "Türkommunikation", "Brandmeldeanlage", "Rauchwarnmelder", "Sicherheitsbeleuchtung", "Fluchtwegbeleuchtung", "RWA-Anlage", "Rauchabzug"], {
        aliases: ["Alarmanlage einbauen", "Kameraüberwachung", "Brandmeldeanlage"],
        activities: ["Planung", "Einbau", "Wartung", "Prüfung"],
        contexts: ["Gewerbe", "brandschutzrelevant", "Sicherheit"],
      }),
    ]),
    trade("netzwerktechnik", "Netzwerk, IT & Kommunikation", "Daten- und Kommunikationsnetze im Gebäude.", [
      family("Netzwerk", ["Netzwerktechnik", "LAN-Verkabelung", "Glasfaserverkabelung", "WLAN-Ausleuchtung", "Serverschrank", "Patchfeld", "Telefonanlage", "SAT-Anlage", "Antennentechnik", "Datendosen", "Access Points"], {
        aliases: ["Netzwerktechniker", "LAN Kabel verlegen", "WLAN planen"],
        activities: ["Planung", "Montage", "Prüfung"],
        contexts: ["Büro", "Gewerbe", "Wohnung"],
      }),
    ]),
    trade("blitzschutz", "Blitzschutz & Erdung", "Äußerer und innerer Blitzschutz.", [
      family("Blitzschutz", ["Blitzschutzanlage", "äußerer Blitzschutz", "innerer Blitzschutz", "Fundamenterder", "Tiefenerder", "Erdungsmessung"], {
        aliases: ["Blitzableiter", "Erdung", "Potentialausgleich"],
        activities: ["Planung", "Montage", "Prüfung"],
        contexts: ["Neubau", "Gewerbe", "Bestand"],
      }),
    ]),
  ]),
  group(12, "Trockenbau, Innenausbau & Akustik", "Trockenbau, Akustik, Schallschutz und Ausbau.", [
    trade("trockenbau", "Trockenbau", "Wände, Decken, Vorsatzschalen und Trockenbausysteme.", [
      family("Trockenbau", ["Trockenbauwand", "Gipskartonwand", "GK-Wand", "Rigipswand", "Vorsatzschale", "Installationswand", "Schachtwand", "Trockenputz", "abgehängte Decke", "Deckenbekleidung", "Feuchtraumdecke", "Brandschutzwand", "Brandschutzdecke", "F30-Verkleidung", "F60-Verkleidung", "F90-Verkleidung", "Revisionsklappen", "Dachgeschossausbau", "Trockenestrich", "Systemtrennwand", "Bürotrennwand"], {
        aliases: ["Trockenbauer", "Rigips", "GK", "Gipskarton", "Decke abhängen"],
        activities: ["Montage", "Sanierung", "Dämmung"],
        contexts: ["brandschutzrelevant", "schallschutzrelevant", "Gewerbe"],
      }),
    ]),
    trade("akustikbau", "Akustik & Schallschutz", "Raumakustik und Schallschutzkonstruktionen.", [
      family("Akustik", ["Akustikdecke", "Akustikwand", "Akustikpaneele", "Schallschutzwand", "Schallschutzdecke", "Raumakustik", "Deckensegel", "Akustikputz", "Schallabsorber", "Trittschallschutz"], {
        aliases: ["Akustikbauer", "Schallschutz", "Lärmschutz innen"],
        activities: ["Planung", "Montage", "Prüfung"],
        contexts: ["schallschutzrelevant", "Büro", "Schule / Kita"],
      }),
    ]),
    trade("innenausbau", "Innenausbau & Ausbaugewerke", "Ausbau im Bestand, Büroausbau und Sonderausbau.", [
      family("Innenausbau", ["Innenausbau", "Ausbau Altbau", "Büroausbau", "Ladenbau", "Praxisumbau", "Reinraumausbau", "Brandschutzausbau"], {
        aliases: ["Innenausbauer", "Büro umbauen", "Laden ausbauen"],
        activities: ["Planung", "Montage", "Sanierung"],
        contexts: ["Gewerbe", "Praxis", "Altbau"],
      }),
      family("Systemböden & Hohlraumböden", ["Doppelboden", "Hohlboden", "Hohlraumboden", "Systemboden", "Installationsboden", "Trockenhohlboden", "Nasshohlboden", "Revisionsboden", "Kabelboden", "EDV-Boden", "Doppelbodenplatten", "Doppelbodensanierung", "Doppelbodenmontage", "Hohlbodensanierung"], {
        aliases: ["Raised Floor", "Access Floor", "Computerboden", "Serverraum Doppelboden", "Technikboden", "Installationshohlraum", "Büro Doppelboden", "Rechenzentrum Doppelboden", "Kabelmanagement Boden", "Hohlraumboden", "Hohlraumböden"],
        activities: ["Beratung", "Planung", "Lieferung", "Montage", "Einbau", "Austausch", "Reparatur", "Sanierung", "Prüfung"],
        contexts: ["Büro", "Gewerbe", "Industrie", "Serverraum", "Rechenzentrum", "Bestand", "Neubau", "brandschutzrelevant", "schallschutzrelevant", "technisch"],
        crosslinks: ["bodenlegerarbeiten", "netzwerktechnik", "kaelte-klima"],
      }),
    ]),
  ]),
  group(13, "Estrich, Boden, Fliesen & Naturstein", "Bodenaufbau, Beläge, Fliesen, Parkett, Naturstein und Beschichtungen.", [
    trade("estricharbeiten", "Estrich", "Estrich und Fußbodenaufbau.", [
      family("Estrich", ["Estricharbeiten", "Zementestrich", "Anhydritestrich", "Calciumsulfatestrich", "Fließestrich", "Schnellestrich", "Heizestrich", "Sichtestrich", "Verbundestrich", "schwimmender Estrich", "Trockenestrich", "Gefälleestrich", "Industrieestrich", "Estrichsanierung", "Estrich schleifen", "Estrich fräsen", "Fußbodenheizung einfräsen", "Estrichrisse sanieren", "Estrich trocknen", "CM-Messung"], {
        aliases: ["Estrichleger", "Fließestrich", "Fußbodenheizung fräsen", "FBH fräsen"],
        activities: ["Einbau", "Fräsen", "Schleifen", "Trocknung"],
        contexts: ["Neubau", "Bestand", "Gewerbe"],
      }),
    ]),
    trade("fliesenarbeiten", "Fliesen, Platten & Mosaik", "Fliesen und Platten im Innen- und Außenbereich.", [
      family("Fliesen", ["Fliesenarbeiten", "Wandfliesen", "Bodenfliesen", "Badfliesen", "Küchenfliesen", "Großformatfliesen", "Mosaik", "Natursteinfliesen", "Feinsteinzeug", "Terrassenplatten", "Balkonfliesen", "Poolfliesen", "Abdichtung Bad", "Verbundabdichtung", "Silikonfugen", "Fugen erneuern", "Fliesensanierung", "Fliese auf Fliese", "bodengleiche Dusche"], {
        aliases: ["Fliesenleger", "Plattenleger", "Großformat Fliesen", "Fugen erneuern"],
        activities: ["Montage", "Abdichtung", "Sanierung"],
        contexts: ["Bad", "barrierefrei", "Gewerbe"],
      }),
    ]),
    trade("bodenlegerarbeiten", "Bodenbeläge", "Elastische und textile Bodenbeläge.", [
      family("Bodenbeläge", ["Vinylboden", "Designboden", "PVC-Boden", "Linoleumboden", "Teppichboden", "Laminat", "Korkboden", "Sockelleisten", "Boden ausgleichen"], {
        aliases: ["Bodenleger", "Vinyl verlegen", "Designbelag"],
        activities: ["Montage", "Sanierung", "Schleifen"],
        contexts: ["Wohnung", "Gewerbe", "Bestand"],
      }),
    ]),
    trade("parkettarbeiten", "Parkett & Holzboden", "Holzböden und Parkett.", [
      family("Holzboden", ["Parkett", "Dielenboden", "Parkettverlegung", "Parkett schleifen", "Parkett ölen", "Parkett versiegeln"], {
        aliases: ["Parkettleger", "Parkett schleifen"],
        activities: ["Montage", "Schleifen", "Beschichtung"],
        contexts: ["Wohnung", "Altbau", "Bestand"],
      }),
    ]),
    trade("naturstein", "Naturstein, Terrazzo & Werkstein", "Naturstein- und Werksteinbeläge.", [
      family("Stein", ["Natursteinarbeiten", "Terrazzo", "Werkstein", "Natursteinboden", "Natursteintreppe", "Naturstein schleifen"], {
        aliases: ["Steinmetz", "Natursteinleger"],
        activities: ["Montage", "Schleifen", "Sanierung"],
        contexts: ["Gewerbe", "Wohnung", "Bestand"],
      }),
    ]),
    trade("bodenbeschichtungen", "Industrieboden & Beschichtungen", "Industrie- und Funktionsböden.", [
      family("Beschichtungen", ["Industrieboden", "Epoxidharzboden", "PU-Beschichtung", "Bodenbeschichtung", "Garagenboden", "Werkstattboden", "Betonboden schleifen", "Betonboden polieren"], {
        aliases: ["Epoxidharz", "Garagenboden beschichten"],
        activities: ["Beschichtung", "Schleifen", "Sanierung"],
        contexts: ["Industrie", "Gewerbe", "Tiefgarage"],
      }),
    ]),
  ]),
  group(14, "Maler, Oberflächen & Beschichtungen", "Malerarbeiten, Oberflächen, Schutzanstriche und Beschichtungen.", [
    trade("malerarbeiten", "Maler- & Lackierarbeiten", "Anstrich, Lackierung und Tapezierarbeiten.", [
      family("Malerarbeiten", ["Innenanstrich", "Außenanstrich", "Fassadenanstrich", "Decken streichen", "Wände streichen", "Lackierarbeiten", "Holzlasur", "Metalllackierung", "Türen lackieren", "Fenster lackieren", "Heizkörper lackieren", "Tapezierarbeiten", "Raufaser", "Vliestapete", "Spachtelarbeiten", "Q1-Spachtelung", "Q2-Spachtelung", "Q3-Spachtelung", "Q4-Spachtelung", "Kalkfarbe", "Lehmfarbe", "Silikatfarbe"], {
        aliases: ["Maler", "Lackierer", "Anstreicher", "Wohnung streichen"],
        activities: ["Beschichtung", "Sanierung", "Reparatur"],
        contexts: ["Wohnung", "Fassade", "Bestand"],
      }),
    ]),
    trade("malerarbeiten", "Dekorative Oberflächen & Kunstmalerei", "Gestalterische Wand-, Fassaden- und Oberflächentechniken.", [
      family("Gestaltung", ["Lasurtechnik", "Spachteltechnik", "Betonoptik", "Rostoptik", "Marmorspachtel", "Stucco Veneziano", "Designoberflächen", "Wandgestaltung", "Farbkonzept"], {
        aliases: ["Wandgestaltung", "Designwand", "Betonlook"],
        activities: ["Beratung", "Beschichtung", "Planung"],
        contexts: ["Wohnung", "Hotel", "Gastronomie"],
      }),
      family("Kunstmalerei", ["Kunstmalerei", "Wandmalerei", "Fassadenmalerei", "Graffiti-Gestaltung", "Graffiti-Kunst", "Street-Art", "Lüftlmalerei", "Illusionsmalerei", "Trompe-l'œil", "Ornamentmalerei", "Schablonenmalerei", "Kirchenmalerei", "Restaurationsmalerei", "Airbrush", "Schriftmalerei", "Logo-Malerei", "Deckenmalerei", "Historische Farbfassung", "Vergoldung", "Marmorierung", "Holzmaserierung"], {
        aliases: ["Mural", "Murals", "Wandbild", "Fassadenbild", "Graffiti Maler", "Graffiti Künstler", "Streetart", "Lüftlmaler", "Lüftlmalerei Bayern", "Bauernmalerei", "Trompe l oeil", "Illusionswand", "Ornament", "Schriftenmaler", "Sign Painting", "Kirchenmaler", "Restaurationsmaler", "historische Maltechnik", "dekorative Maltechnik"],
        activities: ["Beratung", "Entwurf", "Planung", "Ausführung", "Restaurierung", "Sanierung", "Gestaltung"],
        contexts: ["Fassade", "Innenraum", "Denkmal", "Altbau", "Gastronomie", "Hotel", "Gewerbe", "privat", "künstlerisch", "historisch"],
      }),
    ]),
    trade("korrosionsschutz", "Schutzbeschichtungen & Korrosionsschutz", "Schutzbeschichtungen für Stahl, Beton und Holz.", [
      family("Schutz", ["Korrosionsschutz", "Rostschutz", "Stahlbeschichtung", "Brandschutzbeschichtung", "Betonschutz", "Balkonbeschichtung", "Graffitischutz", "Hydrophobierung", "Industrielackierung", "Schutzanstrich", "Holzschutzanstrich"], {
        aliases: ["Korrosionsschutzarbeiten", "Brandschutzanstrich"],
        activities: ["Beschichtung", "Prüfung", "Sanierung"],
        contexts: ["Industrie", "brandschutzrelevant", "Gewerbe"],
      }),
    ]),
  ]),
  group(15, "Metallbau, Stahlbau & Schlosser", "Metallbau, Stahlbau, Schlosserei und Fördertechnik.", [
    trade("metallbau", "Metallbau & Schlosserei", "Geländer, Tore, Treppen und Sonderkonstruktionen.", [
      family("Metallbau", ["Metallbau", "Geländer", "Balkongeländer", "Treppengeländer", "Treppen", "Handlauf", "Vordach", "Balkon", "Tore", "Gitter", "Fenstergitter", "Zäune Metall", "Edelstahlbau", "Aluminiumbau", "Sonderkonstruktionen", "Reparaturschweißung", "Schweißarbeiten", "Schmiedearbeiten"], {
        aliases: ["Metallbauer", "Schlosser", "Schlosserei", "Geländerbauer"],
        activities: ["Montage", "Reparatur", "Schneiden"],
        contexts: ["Wohnung", "Gewerbe", "Bestand"],
      }),
      family("Loftwände & Stahl-Glas-Systeme", ["Loftwand", "Stahl-Glas-Trennwand", "Stahl-Glas-Wand", "Glas-Metall-Trennwand", "Stahlrahmentür", "Lofttür", "Industrietrennwand", "Metall-Glas-Trennwand"], {
        aliases: ["Loftwände", "Stahlglaswand", "Stahl Glas Wand", "Stahl Glas Trennwand", "Industrie Glaswand", "Industrial Style Wand", "Industrial Loftwand", "Loft Trennwand", "Glaswand mit Stahlrahmen", "Schlosser Loftwand", "Metallbauer Loftwand"],
        activities: ["Beratung", "Planung", "Fertigung", "Lieferung", "Montage", "Einbau", "Reparatur"],
        contexts: ["Wohnung", "Büro", "Gewerbe", "Gastronomie", "Altbau", "Bestand", "Innenausbau"],
        crosslinks: ["glaserarbeiten", "innenausbau"],
      }),
    ]),
    trade("stahlbau", "Stahlbau", "Tragende Stahlkonstruktionen und Hallenbau.", [
      family("Stahlbau", ["Stahlbau", "Stahlhalle", "Hallenbau", "Stahltragwerk", "Stahlstützen", "Stahlträger", "Unterzüge Stahl", "Stahlbühne", "Podest", "Fluchttreppe", "Industrietreppe", "Stahlbalkon", "Stahlverstärkung", "Stahlmontage"], {
        aliases: ["Stahlbauer", "Hallenbauer", "Stahlträger einbauen"],
        activities: ["Planung", "Montage", "Prüfung"],
        contexts: ["Industrie", "Gewerbe", "Halle"],
      }),
    ]),
    trade("aufzugstechnik", "Fördertechnik & Aufzüge", "Aufzüge und Hebeanlagen.", [
      family("Aufzüge", ["Aufzug", "Personenaufzug", "Lastenaufzug", "Plattformlift", "Treppenlift", "Hublift", "Aufzugsmodernisierung"], {
        aliases: ["Aufzugsbauer", "Lift", "Treppenlift"],
        activities: ["Einbau", "Wartung", "Modernisierung"],
        contexts: ["barrierefrei", "Gewerbe", "Mehrfamilienhaus"],
      }),
    ]),
  ]),
  group(16, "Außenanlagen, Garten, Landschaft & Verkehr", "Garten- und Landschaftsbau, Pflaster, Mauern, Wasseranlagen und Verkehrsflächen.", [
    trade("garten-landschaftsbau", "Garten- & Landschaftsbau", "Gärten, Grünflächen und Außenanlagen.", [
      family("Gartenbau", ["Gartenbau", "Landschaftsbau", "Gartenneuanlage", "Gartensanierung", "Pflanzarbeiten", "Rasen", "Rollrasen", "Hecken", "Sträucher", "Bäume", "Baumpflege", "Baumfällung", "Bewässerung", "Gartenbeleuchtung", "Grünpflege", "Hanggestaltung", "Spielplatzbau"], {
        aliases: ["GaLaBau", "Gärtner", "Gartenbauer", "Garten anlegen"],
        activities: ["Planung", "Montage", "Wartung"],
        contexts: ["Außenanlage", "privat", "gewerblich"],
      }),
    ]),
    trade("pflasterarbeiten", "Pflaster, Wege & Terrassen", "Pflasterflächen, Wege und Terrassen.", [
      family("Pflaster", ["Pflasterarbeiten", "Betonpflaster", "Natursteinpflaster", "Granitpflaster", "Plattenbelag", "Terrassenplatten", "Keramikterrasse", "Holzterrasse", "WPC-Terrasse", "Wege", "Hofeinfahrt", "Garageneinfahrt", "Randsteine", "Bordsteine", "Entwässerungsrinne", "Stufen außen", "Pflastersanierung"], {
        aliases: ["Pflasterer", "Hof pflastern", "Einfahrt pflastern", "Terrassenbauer"],
        activities: ["Montage", "Sanierung", "Reparatur"],
        contexts: ["Außenanlage", "Gewerbe", "privat"],
      }),
    ]),
    trade("zaunbau", "Mauern, Zäune & Einfriedungen", "Mauern, Stützelemente und Einfriedungen.", [
      family("Einfriedung", ["Gartenmauer", "Natursteinmauer", "Trockenmauer", "Stützmauer", "L-Steine", "Gabionen", "Sichtschutz", "Zaunbau", "Metallzaun", "Holzzaun", "Doppelstabmattenzaun", "Hoftor", "Schiebetor"], {
        aliases: ["Zaunbauer", "L-Steine setzen", "Sichtschutz"],
        activities: ["Montage", "Sanierung", "Lieferung"],
        contexts: ["Außenanlage", "privat", "Gewerbe"],
      }),
    ]),
    trade("poolbau", "Pool, Teich & Wasseranlagen", "Pools, Teiche und Wasseranlagen.", [
      family("Wasseranlagen", ["Poolbau", "Naturpool", "Schwimmteich", "Teichbau", "Pooltechnik", "Poolabdichtung"], {
        aliases: ["Poolbauer", "Schwimmteich"],
        activities: ["Planung", "Montage", "Wartung"],
        contexts: ["Außenanlage", "privat", "Gewerbe"],
      }),
    ]),
    trade("strassenbau", "Straßenbau, Asphalt & Markierung", "Straßen, Zufahrten, Asphalt und Markierungen.", [
      family("Verkehrsflächen", ["Asphaltarbeiten", "Asphaltbau", "Asphaltbelag", "Asphaltdeckschicht", "Asphalttragschicht", "Asphaltfeinbelag", "Walzasphalt", "Gussasphalt", "Kaltasphalt", "Splittmastixasphalt", "Asphaltreparatur", "Asphaltfräsen", "Asphalt schneiden", "Asphaltabdichtung", "Fahrbahnsanierung", "Parkplatzbau", "Straßenbau", "Wege- und Verkehrsflächenbau", "Fahrbahnmarkierung"], {
        aliases: ["Hof asphaltieren", "Zufahrt asphaltieren", "Einfahrt asphaltieren", "Parkplatz asphaltieren", "Asphalt Firma", "Asphaltbauer", "Asphaltieren", "Teerarbeiten", "Teeren", "Schwarzdecke", "Fahrbahnbelag", "Asphaltfläche", "Straßenbauer"],
        activities: ["Beratung", "Planung", "Lieferung", "Einbau", "Sanierung", "Reparatur", "Fräsen", "Schneiden", "Abdichtung"],
        contexts: ["Außenanlage", "Gewerbe", "Kommune", "Industrie", "Parkplatz", "Hof", "Zufahrt", "Straße", "Bestand", "Neubau"],
      }),
    ]),
  ]),
  group(17, "Sanierung, Restaurierung & Spezialverfahren", "Bestandssanierung, Schäden, Denkmalpflege und Spezialverfahren.", [
    trade("altbausanierung", "Altbau- & Komplettsanierung", "Sanierung und Modernisierung von Bestandsgebäuden.", [
      family("Sanierung", ["Altbausanierung", "Kernsanierung", "Komplettsanierung", "energetische Sanierung", "Wohnungssanierung", "Haussanierung", "Gewerbesanierung", "Dachgeschossausbau", "Bad-Komplettsanierung", "Sanierung im Bestand", "Modernisierung", "Umbau", "Renovierung"], {
        aliases: ["Sanierungsfirma", "Altbau sanieren", "Haus kernsanieren"],
        activities: ["Sanierung", "Modernisierung", "Planung"],
        contexts: ["Altbau", "Bestand", "energieeffizient"],
      }),
    ]),
    trade("bautrocknung", "Feuchte, Schimmel & Bautrocknung", "Feuchte- und Schimmelschäden sowie technische Trocknung.", [
      family("Feuchte", ["Schimmelsanierung", "Feuchtesanierung", "Bautrocknung", "Wasserschaden trocknen", "Leckageortung", "technische Trocknung", "Estrichtrocknung", "Dämmschichttrocknung", "Keller trocknen", "Horizontalsperre", "Injektionsverfahren", "Geruchsneutralisation"], {
        aliases: ["Bautrockner", "Wasserschaden", "Schimmel entfernen", "Keller feucht"],
        activities: ["Trocknung", "Analyse", "Sanierung"],
        contexts: ["feuchtebelastet", "Bestand", "Altbau"],
      }),
    ]),
    trade("brandschadensanierung", "Brand-, Wasser- & Sturmschäden", "Schadensanierung nach Ereignissen.", [
      family("Schadensanierung", ["Brandschadensanierung", "Rußentfernung", "Geruchsbeseitigung", "Wasserschadensanierung", "Sturmschadensanierung", "Notabdichtung", "Notreparatur", "Versicherungsschaden"], {
        aliases: ["Brandschaden", "Versicherungsschaden"],
        activities: ["Sanierung", "Reinigung", "Notdienst"],
        contexts: ["Bestand", "notdienstfähig", "Gewerbe"],
      }),
    ]),
    trade("denkmalpflege-bau", "Denkmalpflege & Restaurierung", "Restaurierung historischer Bauteile.", [
      family("Restaurierung", ["Denkmalpflege", "Stuckrestaurierung", "Fachwerksanierung", "Natursteinrestaurierung", "historische Putze", "Kalkputz Denkmal", "Lehmputz Denkmal", "historische Fenster", "historische Türen"], {
        aliases: ["Restaurator", "Denkmal sanieren", "Fachwerk sanieren"],
        activities: ["Sanierung", "Gutachten", "Instandsetzung"],
        contexts: ["Denkmal", "denkmalgeschützt", "Altbau"],
      }),
    ]),
    trade("strahltechnik", "Spezialreinigung & Strahltechnik", "Strahlen, Reinigen und Entschichten von Bauteilen.", [
      family("Strahltechnik", ["Sandstrahlen", "Trockeneisstrahlen", "Sodastrahlen", "Glasperlenstrahlen", "Hochdruckreinigung", "Fassadenstrahlen", "Holz entlacken", "Metall entrosten", "Graffiti entfernen"], {
        aliases: ["Trockeneis", "Sandstrahler"],
        activities: ["Reinigung", "Rückbau", "Sanierung"],
        contexts: ["Bestand", "Fassade", "Gewerbe"],
      }),
    ]),
    trade("holzschutz", "Holzschutz & Schädlingsbekämpfung", "Holzschutz, Schwamm- und Schädlingsbekämpfung.", [
      family("Holzschutz", ["Holzschutz", "Hausschwammsanierung", "Holzwurmbekämpfung", "Schädlingsbekämpfung", "Dachstuhlsanierung"], {
        aliases: ["Holzwurm", "Hausschwamm", "Kammerjäger"],
        activities: ["Analyse", "Sanierung", "Instandsetzung"],
        contexts: ["Altbau", "Dach", "Bestand"],
      }),
    ]),
  ]),
  group(18, "Reinigung, Wartung & Facility Services", "Gebäudereinigung, Hausmeisterservice und technische Wartung.", [
    trade("gebaeudereinigung", "Gebäudereinigung", "Reinigung von Gebäuden, Glas, Fassaden und Baustellen.", [
      family("Reinigung", ["Gebäudereinigung", "Unterhaltsreinigung", "Büroreinigung", "Glasreinigung", "Fensterreinigung", "Fassadenreinigung", "Bauendreinigung", "Grundreinigung", "Treppenhausreinigung", "Industriereinigung", "Hallenreinigung", "Tiefgaragenreinigung", "PV-Reinigung", "Dachrinnenreinigung", "Desinfektionsreinigung", "Sonderreinigung"], {
        aliases: ["Reinigungsfirma", "Gebäudereiniger", "Fenster putzen", "Bauendreinigung"],
        activities: ["Reinigung", "Wartung", "Prüfung"],
        contexts: ["Büro", "Gewerbe", "Industrie"],
      }),
    ]),
    trade("hausmeisterservice", "Hausmeisterservice & Facility Management", "Objektbetreuung und Gebäudeservice.", [
      family("Facility Service", ["Hausmeisterservice", "Objektbetreuung", "technisches Gebäudemanagement", "Winterdienst", "Grünpflege", "Kleinreparaturen", "Kontrollgänge", "Wartungskoordination"], {
        aliases: ["Hausmeister", "Facility Service", "Objektservice"],
        activities: ["Wartung", "Reparatur", "Prüfung"],
        contexts: ["Wohnanlage", "Gewerbe", "Bestand"],
      }),
    ]),
    trade("wartung-service", "Wartung & Prüfung technischer Anlagen", "Wiederkehrende Wartung und technische Prüfungen.", [
      family("Wartung", ["Heizungswartung", "Gasthermenwartung", "Wärmepumpenwartung", "Klimawartung", "Lüftungswartung", "Elektroprüfung", "Brandschutzklappenprüfung", "Feuerlöscherwartung", "Rauchmelderwartung", "RWA-Wartung", "Aufzugswartung", "Torwartung", "Türwartung", "Dachwartung", "PV-Wartung", "Kanalwartung"], {
        aliases: ["Wartungsfirma", "Thermenservice", "Anlagenprüfung"],
        activities: ["Wartung", "Prüfung", "Instandsetzung"],
        contexts: ["Gewerbe", "Wohnanlage", "Bestand"],
      }),
    ]),
  ]),
  group(19, "Möbel, Küchen, Ausstattung & Sonderausbau", "Schreiner, Tischler, Küchenbau, Raumausstattung und Spezialausbau.", [
    trade("schreinerarbeiten", "Tischler / Schreiner", "Möbel, Einbauten und Holzinnenausbau.", [
      family("Schreinerarbeiten", ["Einbaumöbel", "Einbauschrank", "Garderobe", "Küche", "Küchenmontage", "Arbeitsplatte", "Türen", "Innentüren", "Holztreppe", "Wandverkleidung", "Deckenverkleidung", "Möbelreparatur", "Sondermöbel", "Empfangstheke", "Ladenbau Möbel"], {
        aliases: ["Schreiner", "Tischler", "Möbelbauer", "Einbauschrank"],
        activities: ["Planung", "Montage", "Reparatur"],
        contexts: ["Wohnung", "Gewerbe", "Praxis"],
      }),
    ]),
    trade("kuechenbau", "Küchenbau & Küchenmontage", "Küchenplanung, Montage und Umbau.", [
      family("Küche", ["Küchenplanung", "Küchenumbau", "Arbeitsplattenmontage", "Spüle einbauen", "Kochfeld einbauen", "Dunstabzug", "Küchenrückwand", "Naturstein-Arbeitsplatte", "Massivholz-Arbeitsplatte", "Küchenreparatur", "Geräteaustausch"], {
        aliases: ["Küchenbauer", "Küchenmonteur", "Küche montieren"],
        activities: ["Planung", "Montage", "Reparatur"],
        contexts: ["Wohnung", "Gastronomie", "Bestand"],
      }),
    ]),
    trade("raumausstattung", "Raumausstattung", "Textile Ausstattung, Sonnenschutz innen und Polsterarbeiten.", [
      family("Raumausstattung", ["Vorhänge", "Gardinen", "Polsterarbeiten", "Sonnenschutz innen", "Teppiche", "Wandbespannung", "Akustikvorhänge"], {
        aliases: ["Raumausstatter", "Gardinen", "Vorhänge", "Polsterer"],
        activities: ["Beratung", "Montage", "Reparatur"],
        contexts: ["Wohnung", "Hotel", "Büro"],
      }),
    ]),
    trade("ladenbau", "Ladenbau, Messebau & Spezialausbau", "Sonderausbau für gewerbliche Nutzungen.", [
      family("Sonderausbau", ["Ladenbau", "Messebau", "Praxisbau", "Laborbau", "Gastronomieausbau", "Hotelzimmerausbau", "Büroausbau", "Reinraumausbau", "Thekenbau", "Verkaufsflächen"], {
        aliases: ["Ladenbauer", "Messebauer", "Praxisausbau", "Gastroausbau"],
        activities: ["Planung", "Montage", "Modernisierung"],
        contexts: ["Gewerbe", "Praxis", "Gastronomie"],
      }),
    ]),
  ]),
];

export function serviceTradeHierarchy(): TradeHierarchyGroup[] {
  return serviceTaxonomy.map((group) => ({
    code: String(group.sortOrder).padStart(2, "0"),
    title: group.name,
    defaultOpen: group.sortOrder <= 5,
    items: group.trades.map((trade) => ({ label: trade.name, slug: trade.slug })),
  }));
}

export function serviceTermsByTradeSlug() {
  const map = new Map<string, string[]>();
  for (const group of serviceTaxonomy) {
    for (const trade of group.trades) {
      const terms = [
        group.name,
        trade.name,
        trade.description,
        ...trade.aliases,
        ...trade.families.flatMap((familyItem) => [
          familyItem.name,
          familyItem.description,
          ...familyItem.services.flatMap((service) => [
            service.name,
            service.description,
            ...service.aliases,
            ...service.activities,
            ...service.contexts,
            ...service.crosslinks,
          ]),
        ]),
      ];
      map.set(trade.slug, [...(map.get(trade.slug) || []), ...terms]);
    }
  }
  return map;
}

export function serviceOptionsForTrade(slug: string) {
  return serviceTaxonomy
    .flatMap((group) => group.trades)
    .filter((trade) => trade.slug === slug)
    .flatMap((trade) => trade.families.flatMap((familyItem) => familyItem.services.map((service) => service.name)));
}

export function popularServicesForTrade(slug: string, limit = 8) {
  const services = serviceTaxonomy
    .flatMap((group) => group.trades)
    .filter((trade) => trade.slug === slug)
    .flatMap((trade) => trade.families.flatMap((familyItem) => familyItem.services));
  const popular = services.filter((service) => service.isPopular);
  return (popular.length ? popular : services).slice(0, limit);
}

function group(sortOrder: number, name: string, description: string, trades: ServiceTaxonomyTrade[]): ServiceTaxonomyGroup {
  return { name, slug: slugify(name), description, sortOrder, trades };
}

function trade(slug: string, name: string, description: string, families: ServiceFamily[], aliases: string[] = []): ServiceTaxonomyTrade {
  return { slug, name, description, aliases, families };
}

function family(
  name: string,
  services: string[],
  options: {
    aliases?: string[];
    activities?: ServiceActivity[];
    contexts?: string[];
    crosslinks?: string[];
  } = {},
): ServiceFamily {
  return {
    name,
    slug: slugify(name),
    description: `${name} als Leistungsfamilie in der Bauleistungs-Taxonomie.`,
    services: services.map((serviceName, index) => ({
      name: serviceName,
      slug: slugify(serviceName),
      description: `${serviceName} wird als konkrete Spezialleistung suchbar gemacht.`,
      aliases: index === 0 ? options.aliases || [] : [],
      activities: options.activities || [],
      contexts: options.contexts || [],
      crosslinks: options.crosslinks || [],
      isPopular: index < 5,
      searchWeight: index < 5 ? 90 : 70,
    })),
  };
}

function contextList(type: ServiceContextType, names: string[]): ServiceContext[] {
  return names.map((name) => ({ name, slug: slugify(name), type }));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
