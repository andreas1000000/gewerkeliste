export const tradeCategories = [
  "Rohbau / Tragwerk",
  "Tiefbau / Erdbau / Infrastruktur",
  "Gebäudehülle / Dach / Fassade",
  "Ausbau / Innenausbau",
  "TGA / Technische Gebäudeausrüstung",
  "Brandschutz / Sicherheit / Prüfung",
  "Außenanlagen / Garten / Landschaft",
  "Metall / Stahl / Sonderbau",
  "Sanierung / Bestand / Spezial",
  "Planung / Gutachten / Fachberatung",
  "Wartung / Service / Gebäudebetrieb",
] as const;

export type TradeCategory = (typeof tradeCategories)[number];

export type TaxonomyTrade = {
  slug: string;
  name: string;
  category: TradeCategory;
  shortDescription: string;
  synonyms: string[];
  subTrades: string[];
  coreServices: string[];
  specializations: string[];
  projectTypes: string[];
  relatedTrades: string[];
  typicalBusinessTypes: string[];
  seoTitle: string;
  seoDescription: string;
  isExample?: boolean;
  isActive?: boolean;
};

export const tradeSlugAliases: Record<string, string> = {
  dachdecker: "dachdeckerarbeiten",
  "spengler-klempner": "spenglerarbeiten",
  putzarbeiten: "verputzarbeiten",
  sanitaer: "sanitaerinstallation",
  heizung: "heizungsbau",
  estrich: "estricharbeiten",
  bodenbelag: "bodenlegerarbeiten",
  gartenbau: "garten-und-landschaftsbau",
  landschaftsbau: "garten-und-landschaftsbau",
  "garten-landschaftsbau": "garten-und-landschaftsbau",
  pflasterbau: "pflasterarbeiten",
  brandschutzabschottungen: "brandschutzabschottung",
  architektur: "architekt",
};

export const tradeSelectionGroups = [
  {
    name: "Planung",
    slugs: ["architekt", "tragwerksplanung", "tga-planung", "energieberatung", "brandschutzplanung", "vermessung"],
  },
  {
    name: "Rohbau",
    slugs: ["bauunternehmen", "hochbau", "maurerarbeiten", "betonbau", "stahlbetonbau", "umbau", "sanierung", "abbrucharbeiten"],
  },
  {
    name: "Dach / Fassade",
    slugs: ["dachdeckerarbeiten", "zimmererarbeiten", "spenglerarbeiten", "fassadenbau", "geruestbau", "verputzarbeiten"],
  },
  {
    name: "TGA",
    slugs: ["elektroinstallation", "sanitaerinstallation", "heizungsbau", "waermepumpen", "lueftung", "kaelte-klima", "photovoltaik"],
  },
  {
    name: "Ausbau",
    slugs: ["trockenbau", "malerarbeiten", "fliesenarbeiten", "estricharbeiten", "bodenlegerarbeiten", "schreinerarbeiten", "metallbau", "glaserarbeiten"],
  },
  {
    name: "Außenanlagen",
    slugs: ["garten-und-landschaftsbau", "pflasterarbeiten", "naturstein", "erdarbeiten", "tiefbau", "kanalbau", "entwaesserung", "zaunbau"],
  },
  {
    name: "Spezial",
    slugs: ["kernbohrungen", "bauwerksabdichtung", "betonsanierung", "bautrocknung", "leckortung", "schadstoffsanierung", "brandschutzabschottung"],
  },
] as const;

const supplementalTradeTaxonomy: TaxonomyTrade[] = [
  ...clusters("Rohbau / Tragwerk", [
    ["abbrucharbeiten", "Abbrucharbeiten"],
    ["schalungsarbeiten", "Schalungsarbeiten"],
    ["bewehrungsarbeiten", "Bewehrungsarbeiten"],
    ["fundamentbau", "Fundamentbau"],
    ["bodenplatten", "Bodenplatten"],
    ["kellerbau", "Kellerbau"],
    ["fertigteilmontage", "Fertigteilmontage"],
    ["stahlbetonfertigteile", "Stahlbetonfertigteile"],
    ["mauerwerkssanierung", "Mauerwerkssanierung"],
    ["kernbohrungen", "Kernbohrungen"],
    ["betonsaegen", "Betonsägen"],
    ["tragwerksverstaerkung", "Tragwerksverstärkung"],
  ]),
  ...clusters("Tiefbau / Erdbau / Infrastruktur", [
    ["tiefbau", "Tiefbau"],
    ["strassenbau", "Straßenbau"],
    ["wegebau", "Wegebau"],
    ["leitungsbau", "Leitungsbau"],
    ["rohrleitungsbau", "Rohrleitungsbau"],
    ["hausanschluesse", "Hausanschlüsse"],
    ["drainagearbeiten", "Drainagearbeiten"],
    ["baugrubensicherung", "Baugrubensicherung"],
    ["wasserhaltung", "Wasserhaltung"],
    ["asphaltarbeiten", "Asphaltarbeiten"],
    ["natursteinmauern-aussen", "Natursteinmauern im Außenbereich"],
    ["kommunaler-tiefbau", "Kommunaler Tiefbau"],
  ]),
  ...clusters("Gebäudehülle / Dach / Fassade", [
    ["zimmererarbeiten", "Zimmererarbeiten"],
    ["holzbau", "Holzbau"],
    ["fassadenbau", "Fassadenbau"],
    ["waermedaemmverbundsysteme", "Wärmedämmverbundsysteme"],
    ["flachdachabdichtung", "Flachdachabdichtung"],
    ["dachfenster", "Dachfenster"],
    ["dachsanierung", "Dachsanierung"],
    ["fassadendaemmung", "Fassadendämmung"],
    ["vorhangfassaden", "Vorhangfassaden"],
    ["fensterbau", "Fensterbau"],
    ["tuerbau", "Türbau"],
    ["sonnenschutz", "Sonnenschutz"],
  ]),
  ...clusters("Ausbau / Innenausbau", [
    ["innenausbau", "Innenausbau"],
    ["stuckateurarbeiten", "Stuckateurarbeiten"],
    ["akustikbau", "Akustikbau"],
    ["schreinerarbeiten", "Schreinerarbeiten"],
    ["tischlerarbeiten", "Tischlerarbeiten"],
    ["parkettarbeiten", "Parkettarbeiten"],
    ["raumausstattung", "Raumausstattung"],
    ["spachtelarbeiten", "Spachtelarbeiten"],
    ["innendaemmung", "Innendämmung"],
    ["brandschutzbekleidungen", "Brandschutzbekleidungen"],
    ["deckenbau", "Deckenbau"],
    ["wandverkleidungen", "Wandverkleidungen"],
  ]),
  ...clusters("TGA / Technische Gebäudeausrüstung", [
    ["photovoltaik", "Photovoltaik"],
    ["waermepumpen", "Wärmepumpen"],
    ["kaelte-klima", "Kälte / Klima"],
    ["gebaeudeautomation", "Gebäudeautomation"],
    ["knx-smart-home", "KNX / Smart Home"],
    ["netzwerktechnik", "Netzwerktechnik"],
    ["sicherheitstechnik", "Sicherheitstechnik"],
    ["blitzschutz", "Blitzschutz"],
    ["sprinkleranlagen", "Sprinkleranlagen"],
    ["aufzugstechnik", "Aufzugstechnik"],
    ["tga-wartung", "TGA-Wartung"],
    ["energieanlagen", "Energieanlagen"],
  ]),
  ...clusters("Brandschutz / Sicherheit / Prüfung", [
    ["brandschutzabschottungen", "Brandschutzabschottungen"],
    ["brandschutztueren", "Brandschutztüren"],
    ["rauch-waermeabzug", "Rauch- und Wärmeabzug"],
    ["fluchtwegtechnik", "Fluchtwegtechnik"],
    ["brandmeldeanlagen", "Brandmeldeanlagen"],
    ["sicherheitsbeleuchtung", "Sicherheitsbeleuchtung"],
    ["pruefung-brandschutzklappen", "Prüfung Brandschutzklappen"],
    ["sachkundepruefungen", "Sachkundeprüfungen"],
    ["torpruefung", "Torprüfung"],
    ["leiterpruefung", "Leiterprüfung"],
    ["elektropruefung", "Elektroprüfung"],
    ["arbeitssicherheit-baustelle", "Arbeitssicherheit Baustelle"],
  ]),
  ...clusters("Außenanlagen / Garten / Landschaft", [
    ["gartenbau", "Gartenbau"],
    ["landschaftsbau", "Landschaftsbau"],
    ["zaunbau", "Zaunbau"],
    ["terrassenbau", "Terrassenbau"],
    ["mauerbau-aussenanlagen", "Mauerbau Außenanlagen"],
    ["naturstein-aussenanlagen", "Naturstein Außenanlagen"],
    ["regenwassermanagement", "Regenwassermanagement"],
    ["zisterne", "Zisternenbau"],
    ["spielplatzbau", "Spielplatzbau"],
    ["sportplatzbau", "Sportplatzbau"],
    ["poolbau", "Poolbau"],
    ["pflege-aussenanlagen", "Pflege von Außenanlagen"],
  ]),
  ...clusters("Metall / Stahl / Sonderbau", [
    ["stahlbau", "Stahlbau"],
    ["schlosserarbeiten", "Schlosserarbeiten"],
    ["gelaenderbau", "Geländerbau"],
    ["treppenbau-metall", "Treppenbau Metall"],
    ["balkonbau", "Balkonbau"],
    ["torbau", "Torbau"],
    ["edelstahlbau", "Edelstahlbau"],
    ["aluminiumbau", "Aluminiumbau"],
    ["industriebauteile", "Industriebauteile"],
    ["sonderkonstruktionen-metall", "Sonderkonstruktionen Metall"],
    ["schweissarbeiten", "Schweißarbeiten"],
    ["metallreparaturen", "Metallreparaturen"],
  ]),
  ...clusters("Sanierung / Bestand / Spezial", [
    ["altbausanierung", "Altbausanierung"],
    ["betoninstandsetzung", "Betoninstandsetzung"],
    ["balkonsanierung", "Balkonsanierung"],
    ["kellersanierung", "Kellersanierung"],
    ["schimmelsanierung", "Schimmelsanierung"],
    ["feuchtigkeitssanierung", "Feuchtigkeitssanierung"],
    ["risssanierung", "Risssanierung"],
    ["fugensanierung", "Fugensanierung"],
    ["denkmalpflege-bau", "Denkmalpflege Bau"],
    ["brandschadensanierung", "Brandschadensanierung"],
    ["wasserschadensanierung", "Wasserschadensanierung"],
    ["asbestsanierung", "Asbestsanierung"],
  ]),
  ...clusters("Planung / Gutachten / Fachberatung", [
    ["architektur", "Architektur"],
    ["bauleitung", "Bauleitung"],
    ["projektsteuerung", "Projektsteuerung"],
    ["tragwerksplanung", "Tragwerksplanung"],
    ["tga-planung", "TGA-Planung"],
    ["energieberatung", "Energieberatung"],
    ["brandschutzplanung", "Brandschutzplanung"],
    ["vermessung", "Vermessung"],
    ["geotechnik", "Geotechnik"],
    ["baugrundgutachten", "Baugrundgutachten"],
    ["baubiologie", "Baubiologie"],
    ["ausschreibung-vergabe", "Ausschreibung und Vergabe"],
  ]),
  ...clusters("Wartung / Service / Gebäudebetrieb", [
    ["hausmeisterservice", "Hausmeisterservice"],
    ["gebaeudereinigung", "Gebäudereinigung"],
    ["winterdienst", "Winterdienst"],
    ["wartung-heizung", "Wartung Heizung"],
    ["wartung-lueftung", "Wartung Lüftung"],
    ["wartung-brandschutz", "Wartung Brandschutz"],
    ["wartung-tore", "Wartung Tore"],
    ["wartung-dach", "Wartung Dach"],
    ["instandhaltung-gebaeude", "Instandhaltung Gebäude"],
    ["stoerungsdienst-tga", "Störungsdienst TGA"],
    ["technisches-gebaeudemanagement", "Technisches Gebäudemanagement"],
    ["objektbetreuung", "Objektbetreuung"],
  ]),
];

export const tradeTaxonomy: TaxonomyTrade[] = [
  trade("bauunternehmen", "Bauunternehmen", "Rohbau / Tragwerk", {
    shortDescription: "Bauunternehmen bündeln Rohbau-, Umbau- und Sanierungsleistungen mit eigener Bauausführung.",
    synonyms: ["Baufirma", "Baugeschäft", "Rohbauunternehmen", "Hochbauunternehmen"],
    subTrades: ["Hochbau", "Rohbau", "Umbau", "Sanierung", "Massivbau"],
    coreServices: ["Baustellen einrichten", "Rohbau herstellen", "Umbauten ausführen", "Bestandsbauteile ändern", "Bauleistungen koordinieren"],
    specializations: ["Wohnbau", "Gewerbebau", "Bestandsumbau", "Massivbau"],
    projectTypes: ["Einfamilienhaus", "Mehrfamilienhaus", "Gewerbebau", "Umbau", "Sanierung"],
    relatedTrades: ["hochbau", "maurerarbeiten", "betonbau", "umbau", "sanierung"],
    typicalBusinessTypes: ["Bauunternehmen", "Baufirma", "Rohbaubetrieb"],
  }),
  trade("hochbau", "Hochbau", "Rohbau / Tragwerk", {
    shortDescription: "Hochbau umfasst die Errichtung und Änderung oberirdischer Bauwerke in Massiv- oder Mischbauweise.",
    synonyms: ["Rohbau", "Massivbau", "Neubau", "Mauerarbeiten"],
    subTrades: ["Rohbau", "Massivbau", "Mauerwerksbau", "Betonarbeiten"],
    coreServices: ["Rohbau erstellen", "Mauerwerk herstellen", "Betonbauteile herstellen", "Bauteile anschließen", "Bestand umbauen"],
    specializations: ["Wohngebäude", "Gewerbegebäude", "Anbauten", "Bestandsumbau"],
    projectTypes: ["Neubau", "Umbau", "Anbau", "Gewerbebau", "Bestand"],
    relatedTrades: ["bauunternehmen", "maurerarbeiten", "betonbau", "stahlbetonbau"],
    typicalBusinessTypes: ["Hochbauunternehmen", "Bauunternehmen", "Rohbaubetrieb"],
  }),
  trade("stahlbetonbau", "Stahlbetonbau", "Rohbau / Tragwerk", {
    shortDescription: "Stahlbetonbau verbindet Schalung, Bewehrung und Betonage tragender Bauteile.",
    synonyms: ["Betonarbeiten", "Bewehrungsarbeiten", "Schalungsarbeiten", "Betonieren"],
    subTrades: ["Schalung", "Bewehrung", "Betonage", "Sichtbeton", "Fertigteile"],
    coreServices: ["Schalung herstellen", "Bewehrung einbauen", "Beton einbringen", "Bauteile nachbehandeln", "Anschlüsse ausbilden"],
    specializations: ["Bodenplatten", "Decken", "Wände", "Stützen", "Gewerbebau"],
    projectTypes: ["Neubau", "Gewerbebau", "Mehrfamilienhaus", "Infrastruktur", "Bestand"],
    relatedTrades: ["betonbau", "hochbau", "schalungsarbeiten", "bewehrungsarbeiten"],
    typicalBusinessTypes: ["Stahlbetonbauer", "Betonbauunternehmen", "Rohbaubetrieb"],
  }),
  trade("umbau", "Umbau", "Sanierung / Bestand / Spezial", {
    shortDescription: "Umbau umfasst bauliche Änderungen an bestehenden Gebäuden und Grundrissen.",
    synonyms: ["Bestandsumbau", "Modernisierung", "Anbau", "Ausbau"],
    subTrades: ["Wanddurchbrüche", "Grundrissänderungen", "Anbauten", "Bestandsanschlüsse"],
    coreServices: ["Bestand öffnen", "Bauteile zurückbauen", "Neue Bauteile einfügen", "Anschlüsse herstellen", "Bestand sichern"],
    specializations: ["Altbau", "Wohnungsumbau", "Gewerbeumbau", "Anbau"],
    projectTypes: ["Bestand", "Wohnbau", "Gewerbe", "Anbau", "Modernisierung"],
    relatedTrades: ["sanierung", "bauunternehmen", "maurerarbeiten", "trockenbau"],
    typicalBusinessTypes: ["Bauunternehmen", "Sanierungsbetrieb", "Ausbaubetrieb"],
  }),
  trade("sanierung", "Sanierung", "Sanierung / Bestand / Spezial", {
    shortDescription: "Sanierung ordnet Instandsetzung, Modernisierung und Schadensbehebung an Bestandsgebäuden ein.",
    synonyms: ["Renovierung", "Modernisierung", "Bestandssanierung", "Altbausanierung"],
    subTrades: ["Altbausanierung", "Feuchtesanierung", "Betonsanierung", "Energetische Sanierung"],
    coreServices: ["Schäden aufnehmen", "Bauteile instand setzen", "Untergründe vorbereiten", "Feuchteschutz herstellen", "Oberflächen erneuern"],
    specializations: ["Altbau", "Keller", "Fassade", "Balkon", "Wohnung"],
    projectTypes: ["Bestandssanierung", "Altbau", "Wohnbau", "Gewerbe", "Schadensanierung"],
    relatedTrades: ["umbau", "bauwerksabdichtung", "verputzarbeiten", "malerarbeiten"],
    typicalBusinessTypes: ["Sanierungsbetrieb", "Bauunternehmen", "Fachbetrieb Bestand"],
  }),
  trade("verputzarbeiten", "Verputzarbeiten", "Gebäudehülle / Dach / Fassade", {
    shortDescription: "Verputzarbeiten umfassen Innenputz, Außenputz, Sockelputz und Putzsanierung.",
    synonyms: ["Putzarbeiten", "Innenputz", "Außenputz", "Aussenputz", "Verputzer", "Stuckateur"],
    subTrades: ["Innenputz", "Außenputz", "Sockelputz", "Sanierputz", "Armierungsputz"],
    coreServices: ["Untergrund vorbereiten", "Putz auftragen", "Gewebe einbetten", "Oberflächen abziehen", "Anschlüsse ausbilden"],
    specializations: ["Fassade", "Innenräume", "Altbau", "Sockel", "Sanierputz"],
    projectTypes: ["Neubau", "Fassadensanierung", "Innenausbau", "Bestand", "Gewerbe"],
    relatedTrades: ["fassadenbau", "malerarbeiten", "maurerarbeiten", "sanierung"],
    typicalBusinessTypes: ["Verputzerbetrieb", "Stuckateurbetrieb", "Fassadenbetrieb"],
  }),
  trade("dachdeckerarbeiten", "Dachdeckerarbeiten", "Gebäudehülle / Dach / Fassade", {
    shortDescription: "Dachdeckerarbeiten betreffen Steildach, Flachdach, Dachsanierung, Dämmung und Anschlüsse.",
    synonyms: ["Dachdecker", "Bedachungen", "Dachsanierung", "Flachdach", "Steildach", "Dachabdichtung", "Dachfenster"],
    subTrades: ["Steildach", "Flachdach", "Dachabdichtung", "Dachdämmung", "Dachfenster"],
    coreServices: ["Dach eindecken", "Dach abdichten", "Dämmung einbauen", "Anschlüsse herstellen", "Dachfenster einbauen"],
    specializations: ["Ziegeldach", "Flachdach", "Dachsanierung", "Dachreparatur"],
    projectTypes: ["Neubau", "Sanierung", "Reparatur", "Wohnbau", "Gewerbe"],
    relatedTrades: ["spenglerarbeiten", "zimmererarbeiten", "fassadenbau"],
    typicalBusinessTypes: ["Dachdeckerbetrieb", "Bedachungsbetrieb", "Dachbauunternehmen"],
  }),
  trade("spenglerarbeiten", "Spenglerarbeiten", "Gebäudehülle / Dach / Fassade", {
    shortDescription: "Spenglerarbeiten umfassen Blechanschlüsse, Dachrinnen, Fallrohre und Blechverkleidungen.",
    synonyms: ["Blechner", "Klempner", "Bauspengler", "Dachrinne", "Blechdach", "Blechfassade", "Kaminverkleidung"],
    subTrades: ["Dachrinnen", "Fallrohre", "Attika", "Kamineinfassungen", "Blechfassaden"],
    coreServices: ["Bleche kanten", "Dachrinnen montieren", "Fallrohre anschließen", "Anschlüsse herstellen", "Verkleidungen montieren"],
    specializations: ["Zink", "Kupfer", "Aluminium", "Edelstahl", "Metalldach"],
    projectTypes: ["Dachsanierung", "Neubau", "Fassade", "Reparatur", "Bestand"],
    relatedTrades: ["dachdeckerarbeiten", "fassadenbau", "metallbau"],
    typicalBusinessTypes: ["Spenglerbetrieb", "Blechnerbetrieb", "Dachdeckerbetrieb"],
  }),
  trade("sanitaerinstallation", "Sanitärinstallation", "TGA / Technische Gebäudeausrüstung", {
    shortDescription: "Sanitärinstallation umfasst Wasserleitungen, Abwasser, Bäder, Armaturen und Vorwandtechnik.",
    synonyms: ["Sanitär", "Sanitaer", "SHK", "Badinstallation", "Installateur"],
    subTrades: ["Badinstallation", "Trinkwasser", "Abwasser", "Vorwandinstallation", "Armaturen"],
    coreServices: ["Leitungen verlegen", "Sanitärobjekte montieren", "Anschlüsse herstellen", "Armaturen einbauen", "Dichtheit prüfen"],
    specializations: ["Badsanierung", "Neubau", "Gewerbesanitär", "barrierefreie Bäder"],
    projectTypes: ["Neubau", "Sanierung", "Bad", "Wohnbau", "Gewerbe"],
    relatedTrades: ["heizungsbau", "fliesenarbeiten", "trockenbau"],
    typicalBusinessTypes: ["SHK-Betrieb", "Sanitärbetrieb", "Installateurbetrieb"],
  }),
  trade("heizungsbau", "Heizungsbau", "TGA / Technische Gebäudeausrüstung", {
    shortDescription: "Heizungsbau betrifft Wärmeerzeuger, Heizflächen, Rohrnetze, Regelung und Wartung.",
    synonyms: ["Heizung", "Heizungsinstallation", "SHK", "Wärmeerzeuger", "Fussbodenheizung"],
    subTrades: ["Wärmepumpe", "Fußbodenheizung", "Heizkörper", "Rohrnetz", "Regelung"],
    coreServices: ["Heizung installieren", "Rohrleitungen verlegen", "Wärmeerzeuger anschließen", "Anlage einregulieren", "Wartung durchführen"],
    specializations: ["Wärmepumpen", "Sanierung", "Fußbodenheizung", "Gewerbeanlagen"],
    projectTypes: ["Neubau", "Sanierung", "Wartung", "Wohnbau", "Gewerbe"],
    relatedTrades: ["sanitaerinstallation", "waermepumpen", "lueftung", "elektroinstallation"],
    typicalBusinessTypes: ["Heizungsbauer", "SHK-Betrieb", "TGA-Betrieb"],
  }),
  trade("estricharbeiten", "Estricharbeiten", "Ausbau / Innenausbau", {
    shortDescription: "Estricharbeiten betreffen Fußbodenaufbauten, Dämmung, Heizestrich und Untergründe.",
    synonyms: ["Estrich", "Estrichleger", "Zementestrich", "Fließestrich", "Heizestrich"],
    subTrades: ["Zementestrich", "Fließestrich", "Heizestrich", "Verbundestrich"],
    coreServices: ["Untergrund vorbereiten", "Dämmung verlegen", "Randstreifen setzen", "Estrich einbringen", "Oberfläche nachbearbeiten"],
    specializations: ["Fußbodenheizung", "Schnellestrich", "Industrieboden", "Sanierung"],
    projectTypes: ["Neubau", "Sanierung", "Wohnbau", "Gewerbe", "Industrie"],
    relatedTrades: ["fliesenarbeiten", "bodenlegerarbeiten", "heizungsbau"],
    typicalBusinessTypes: ["Estrichbetrieb", "Estrichlegerbetrieb", "Bodenbauunternehmen"],
  }),
  trade("bodenlegerarbeiten", "Bodenlegerarbeiten", "Ausbau / Innenausbau", {
    shortDescription: "Bodenlegerarbeiten umfassen Parkett, Vinyl, Teppich, Linoleum und Untergrundvorbereitung.",
    synonyms: ["Bodenbelag", "Bodenleger", "Parkett", "Vinylboden", "Fußboden"],
    subTrades: ["Parkett", "Vinyl", "Teppich", "Linoleum", "Designboden"],
    coreServices: ["Untergrund prüfen", "Altbelag entfernen", "Ausgleich aufbringen", "Belag verlegen", "Sockelleisten montieren"],
    specializations: ["Parkett", "Designbelag", "Gewerbeflächen", "Treppen", "Sanierung"],
    projectTypes: ["Renovierung", "Innenausbau", "Wohnbau", "Gewerbe", "Bestand"],
    relatedTrades: ["estricharbeiten", "malerarbeiten", "trockenbau"],
    typicalBusinessTypes: ["Bodenlegerbetrieb", "Parkettleger", "Ausbaubetrieb"],
  }),
  trade("pflasterarbeiten", "Pflasterarbeiten", "Außenanlagen / Garten / Landschaft", {
    shortDescription: "Pflasterarbeiten betreffen Einfahrten, Wege, Terrassen, Unterbau und Entwässerung.",
    synonyms: ["Pflasterbau", "Pflasterer", "Natursteinpflaster", "Betonsteinpflaster", "Hofeinfahrten", "Außenanlagen"],
    subTrades: ["Natursteinpflaster", "Betonsteinpflaster", "Bordsteine", "Rinnen", "Unterbau"],
    coreServices: ["Unterbau herstellen", "Pflaster verlegen", "Bordsteine setzen", "Rinnen einbauen", "Fugen herstellen"],
    specializations: ["Hofeinfahrten", "Terrassen", "Naturstein", "Gewerbeflächen", "Sanierung"],
    projectTypes: ["Privat", "Gewerbe", "Außenanlage", "Sanierung", "Kommunal"],
    relatedTrades: ["garten-und-landschaftsbau", "erdarbeiten", "tiefbau", "entwaesserung"],
    typicalBusinessTypes: ["Pflasterbetrieb", "GaLaBau-Betrieb", "Tiefbauunternehmen"],
  }),
  trade("naturstein", "Naturstein", "Außenanlagen / Garten / Landschaft", {
    shortDescription: "Naturstein umfasst Beläge, Mauern, Stufen und Einfassungen aus Naturstein im Bau- und Außenbereich.",
    synonyms: ["Natursteinarbeiten", "Granit", "Natursteinpflaster", "Natursteinmauer"],
    subTrades: ["Natursteinpflaster", "Natursteinmauern", "Blockstufen", "Terrassenplatten"],
    coreServices: ["Steine setzen", "Platten verlegen", "Mauern herstellen", "Stufen einbauen", "Fugen ausbilden"],
    specializations: ["Granit", "Kalkstein", "Trockenmauern", "Außenanlagen"],
    projectTypes: ["Außenanlage", "Garten", "Terrasse", "Sanierung", "Privat"],
    relatedTrades: ["pflasterarbeiten", "garten-und-landschaftsbau", "erdarbeiten"],
    typicalBusinessTypes: ["Natursteinbetrieb", "GaLaBau-Betrieb", "Steinmetzbetrieb"],
  }),
  trade("entwaesserung", "Entwässerung", "Außenanlagen / Garten / Landschaft", {
    shortDescription: "Entwässerung umfasst Rinnen, Drainagen, Leitungen und Regenwasserführung an Gebäuden und Außenanlagen.",
    synonyms: ["Entwaesserung", "Drainage", "Regenwasser", "Grundstücksentwässerung"],
    subTrades: ["Drainage", "Rinnen", "Regenwasserleitungen", "Sickerschächte"],
    coreServices: ["Rinnen einbauen", "Leitungen verlegen", "Drainagen herstellen", "Gefälle ausbilden", "Schächte setzen"],
    specializations: ["Außenanlagen", "Hofentwässerung", "Kellerdrainage", "Regenwassermanagement"],
    projectTypes: ["Neubau", "Sanierung", "Außenanlage", "Gewerbe", "Bestand"],
    relatedTrades: ["kanalbau", "tiefbau", "pflasterarbeiten"],
    typicalBusinessTypes: ["Tiefbaubetrieb", "GaLaBau-Betrieb", "Entwässerungsbetrieb"],
  }),
  trade("brandschutzabschottung", "Brandschutzabschottung", "Brandschutz / Sicherheit / Prüfung", {
    shortDescription: "Brandschutzabschottung schließt Leitungs- und Kabeldurchführungen in feuerwiderstandsfähigen Bauteilen.",
    synonyms: ["Brandschutzabschottungen", "Abschottung", "Kabelabschottung", "Rohrabschottung"],
    subTrades: ["Kabelabschottung", "Rohrabschottung", "Kombischott", "Dokumentation"],
    coreServices: ["Durchführungen schließen", "Schotts einbauen", "Bauteile kennzeichnen", "Ausführung dokumentieren", "Mängel beheben"],
    specializations: ["TGA-Durchführungen", "Bestand", "Gewerbeobjekte", "Sonderbau"],
    projectTypes: ["Gewerbebau", "Sonderbau", "Bestand", "Umbau", "Wartung"],
    relatedTrades: ["brandschutz", "trockenbau", "elektroinstallation", "lueftung"],
    typicalBusinessTypes: ["Brandschutzbetrieb", "Spezialbetrieb", "TGA-Betrieb"],
  }),
  trade("architekt", "Architekt", "Planung / Gutachten / Fachberatung", {
    shortDescription: "Architekten planen Gebäude, koordinieren Entwurf, Genehmigung, Ausführung und Bauüberwachung.",
    synonyms: ["Architektur", "Architekturbüro", "Entwurfsplanung", "Bauantrag"],
    subTrades: ["Entwurf", "Genehmigungsplanung", "Ausführungsplanung", "Bauüberwachung"],
    coreServices: ["Bestand aufnehmen", "Entwurf erstellen", "Bauantrag vorbereiten", "Leistungen ausschreiben", "Ausführung überwachen"],
    specializations: ["Wohnbau", "Gewerbebau", "Umbau", "Sanierung"],
    projectTypes: ["Neubau", "Umbau", "Sanierung", "Gewerbebau", "Bestand"],
    relatedTrades: ["tragwerksplanung", "tga-planung", "energieberatung"],
    typicalBusinessTypes: ["Architekturbüro", "Planungsbüro"],
  }),
  trade("maurerarbeiten", "Maurerarbeiten", "Rohbau / Tragwerk", {
    shortDescription: "Mauerwerk, Rohbau, Umbau im Bestand und kleinere Betonarbeiten.",
    synonyms: ["Maurer", "Mauerer", "Rohbauer", "Mauerwerksbau", "Bauunternehmen"],
    subTrades: ["Rohbau", "Mauerwerksbau", "Sichtmauerwerk", "Natursteinmauerwerk", "Umbau im Bestand", "tragende Bauteile", "Kleinbaustellen"],
    coreServices: ["Mauerwerk herstellen", "Innenwände mauern", "Außenwände mauern", "Fundamente herstellen", "tragende Durchbrüche herstellen", "Stürze einbauen", "Bestandswände ändern", "Reparaturmauerwerk"],
    specializations: ["Einfamilienhaus-Rohbau", "Anbau / Umbau", "Sanierung im Bestand", "landwirtschaftliche Gebäude", "Gewerbebau", "Altbausanierung"],
    projectTypes: ["Neubau", "Umbau", "Sanierung", "Anbau", "Gewerbe", "Privat", "Landwirtschaft", "Bestand"],
    relatedTrades: ["Betonbau", "Putzarbeiten", "Trockenbau", "Bauwerksabdichtung", "Tiefbau", "Abbrucharbeiten"],
    typicalBusinessTypes: ["Maurerbetrieb", "Bauunternehmen", "Rohbauunternehmen"],
  }),
  trade("betonbau", "Betonbau", "Rohbau / Tragwerk", {
    shortDescription: "Beton- und Stahlbetonarbeiten für Tragwerk, Bauteile und Bestandsumbau.",
    synonyms: ["Stahlbetonbau", "Betonarbeiten", "Betonbauer"],
    subTrades: ["Stahlbetonbau", "Schalungsarbeiten", "Bewehrungsarbeiten", "Betonfertigteile", "Sichtbeton"],
    coreServices: ["Schalung herstellen", "Bewehrung einbauen", "Betonieren", "Betonbauteile herstellen", "Fundamente und Bodenplatten", "Betoninstandsetzung"],
    specializations: ["Sichtbeton", "Gewerbebau", "Fundamentbau", "Bodenplatten", "Bestandsumbau"],
    projectTypes: ["Neubau", "Gewerbe", "Industrie", "Sanierung", "Infrastruktur"],
    relatedTrades: ["Maurerarbeiten", "Betoninstandsetzung", "Kernbohrungen", "Abbrucharbeiten"],
    typicalBusinessTypes: ["Betonbauunternehmen", "Rohbauunternehmen", "Bauunternehmen"],
  }),
  trade("putzarbeiten", "Putzarbeiten", "Ausbau / Innenausbau", {
    shortDescription: "Innenputz, Außenputz, Fassadenputz und Putzsanierung.",
    synonyms: ["Verputzer", "Stuckateur", "Innenputz", "Außenputz"],
    subTrades: ["Innenputz", "Außenputz", "Kalkputz", "Gipsputz", "Zementputz", "Lehmputz", "Sanierputz", "Fassadenputz", "Sockelputz", "Armierungsputz"],
    coreServices: ["Wände verputzen", "Decken verputzen", "Fassadenputz herstellen", "Putzsanierung", "Untergrund vorbereiten", "Sockelputz ausführen"],
    specializations: ["Altbausanierung", "Lehmputz", "Sanierputz", "WDVS-Vorbereitung", "Feuchteschäden"],
    projectTypes: ["Neubau", "Sanierung", "Innenausbau", "Fassade", "Bestand"],
    relatedTrades: ["Malerarbeiten", "WDVS", "Maurerarbeiten", "Fassadenbau"],
    typicalBusinessTypes: ["Putzbetrieb", "Stuckateurbetrieb", "Ausbaubetrieb"],
  }),
  trade("erdarbeiten", "Erdarbeiten", "Tiefbau / Erdbau / Infrastruktur", {
    shortDescription: "Aushub, Baugruben, Geländeprofilierung und vorbereitende Tiefbauarbeiten.",
    synonyms: ["Erdbau", "Baggerarbeiten", "Aushub", "Baugrube"],
    subTrades: ["Baugrubenaushub", "Geländemodellierung", "Leitungsgräben", "Baugrubensicherung", "Wasserhaltung"],
    coreServices: ["Baugrube ausheben", "Boden abtragen", "Material laden und abfahren", "Planum herstellen", "Gräben herstellen"],
    specializations: ["enge Grundstücke", "Hanglagen", "Bestandsgrundstücke", "Kleinbaggerarbeiten"],
    projectTypes: ["Neubau", "Außenanlagen", "Hausanschluss", "Sanierung", "Gewerbe"],
    relatedTrades: ["Tiefbau", "Kanalbau", "Pflasterbau", "Drainagearbeiten"],
    typicalBusinessTypes: ["Erdbauunternehmen", "Tiefbauunternehmen", "Baggerbetrieb"],
  }),
  trade("kanalbau", "Kanalbau", "Tiefbau / Erdbau / Infrastruktur", {
    shortDescription: "Kanalanschlüsse, Grundstücksentwässerung und Rohrleitungsbau.",
    synonyms: ["Entwässerung", "Rohrleitungsbau", "Grundstücksentwässerung"],
    subTrades: ["Hausanschlüsse", "Revisionsschächte", "Regenwasserleitungen", "Schmutzwasserleitungen", "Drainage"],
    coreServices: ["Kanalgräben herstellen", "Rohre verlegen", "Schächte setzen", "Dichtheitsprüfung vorbereiten", "Anschlüsse herstellen"],
    specializations: ["Grundstücksentwässerung", "Sanierung im Bestand", "Regenwassermanagement", "Zisternenbau"],
    projectTypes: ["Neubau", "Sanierung", "Hausanschluss", "Kommunal", "Gewerbe"],
    relatedTrades: ["Tiefbau", "Erdarbeiten", "Drainagearbeiten", "Straßenbau"],
    typicalBusinessTypes: ["Tiefbauunternehmen", "Kanalbauunternehmen", "Rohrleitungsbauer"],
  }),
  trade("pflasterbau", "Pflasterbau", "Außenanlagen / Garten / Landschaft", {
    shortDescription: "Pflasterflächen, Hofeinfahrten, Wege, Terrassen und Entwässerung im Außenbereich.",
    synonyms: ["Pflasterer", "Wegebau", "Natursteinpflaster", "Betonsteinpflaster"],
    subTrades: ["Natursteinpflaster", "Betonsteinpflaster", "Großflächenpflaster", "Kleinflächen", "Bordsteine", "Rinnen / Entwässerung", "Unterbau"],
    coreServices: ["Unterbau herstellen", "Pflaster verlegen", "Bordsteine setzen", "Entwässerungsrinnen einbauen", "Gefälle ausbilden", "Fugen herstellen"],
    specializations: ["private Hofeinfahrten", "Gewerbeflächen", "öffentliche Flächen", "Granitpflaster", "Terrassen", "Sanierung bestehender Pflasterflächen"],
    projectTypes: ["Privat", "Gewerbe", "Kommunal", "Außenanlagen", "Sanierung"],
    relatedTrades: ["Garten- und Landschaftsbau", "Tiefbau", "Erdarbeiten", "Entwässerungsarbeiten"],
    typicalBusinessTypes: ["Pflasterbauunternehmen", "GaLaBau-Betrieb", "Tiefbauunternehmen"],
  }),
  trade("dachdecker", "Dachdecker", "Gebäudehülle / Dach / Fassade", {
    shortDescription: "Steildach, Flachdach, Dachsanierung, Dämmung und Dachentwässerung.",
    synonyms: ["Dachbau", "Dachsanierung", "Dachdeckerarbeiten"],
    subTrades: ["Steildach", "Flachdach", "Dachabdichtung", "Dachdämmung", "Dachfenster", "Dachentwässerung"],
    coreServices: ["Dach eindecken", "Dach sanieren", "Unterspannbahn erneuern", "Dämmung einbauen", "Dachfenster einbauen", "Anschlüsse herstellen"],
    specializations: ["Altbaudach", "Flachdach", "Ziegeldach", "Metalldach", "Dachreparatur"],
    projectTypes: ["Neubau", "Sanierung", "Reparatur", "Wohnbau", "Gewerbe"],
    relatedTrades: ["Spengler / Klempner", "Zimmerer", "Fassadenbau", "Flachdachabdichtung"],
    typicalBusinessTypes: ["Dachdeckerbetrieb", "Dachbauunternehmen"],
  }),
  trade("spengler-klempner", "Spengler / Klempner", "Gebäudehülle / Dach / Fassade", {
    shortDescription: "Blechanschlüsse, Dachrinnen, Fallrohre und Metallarbeiten an Dach und Fassade.",
    synonyms: ["Bauspengler", "Klempner", "Dachrinne", "Blechner"],
    subTrades: ["Dachrinnen", "Fallrohre", "Blechanschlüsse", "Attikaabdeckungen", "Kamineinfassungen", "Metalldach"],
    coreServices: ["Dachrinnen montieren", "Fallrohre montieren", "Blechanschlüsse herstellen", "Abdeckungen fertigen", "Reparaturen ausführen"],
    specializations: ["Kupfer", "Zink", "Aluminium", "Edelstahl", "Denkmal"],
    projectTypes: ["Neubau", "Sanierung", "Dach", "Fassade", "Reparatur"],
    relatedTrades: ["Dachdecker", "Fassadenbau", "Metallbau"],
    typicalBusinessTypes: ["Spenglerbetrieb", "Klempnerbetrieb", "Dachdeckerbetrieb"],
  }),
  trade("bauwerksabdichtung", "Bauwerksabdichtung", "Gebäudehülle / Dach / Fassade", {
    shortDescription: "Abdichtung von Keller, Balkon, Terrasse, Flachdach und erdberührten Bauteilen.",
    synonyms: ["Abdichtung", "Kellerabdichtung", "Feuchtigkeitssanierung", "Flüssigkunststoff"],
    subTrades: ["Kellerabdichtung", "Balkonabdichtung", "Terrassenabdichtung", "Flachdachabdichtung", "Bitumenabdichtung", "Folienabdichtung", "Flüssigkunststoffabdichtung"],
    coreServices: ["Untergrund vorbereiten", "Abdichtung herstellen", "Anschlüsse ausbilden", "Detailpunkte abdichten", "Feuchteschäden sanieren"],
    specializations: ["erdberührte Bauteile", "Bestandssanierung", "Balkone", "Flachdächer", "Sockel"],
    projectTypes: ["Sanierung", "Neubau", "Keller", "Balkon", "Terrasse", "Dach"],
    relatedTrades: ["Dachdecker", "Maurerarbeiten", "Putzarbeiten", "Fliesenarbeiten"],
    typicalBusinessTypes: ["Abdichtungsbetrieb", "Bausanierer", "Dachdeckerbetrieb"],
  }),
  trade("trockenbau", "Trockenbau", "Ausbau / Innenausbau", {
    shortDescription: "Innenwände, Decken, Vorsatzschalen, Akustik und Brandschutzkonstruktionen.",
    synonyms: ["Innenausbau", "Gipskarton", "GK-Wände", "Leichtbauwände"],
    subTrades: ["Leichtbauwände", "Abgehängte Decken", "Vorsatzschalen", "Akustikdecken", "Brandschutzbekleidungen"],
    coreServices: ["Ständerwände erstellen", "Decken abhängen", "Dämmung einbauen", "Platten montieren", "Spachtelarbeiten vorbereiten"],
    specializations: ["Akustik", "Brandschutz", "Feuchträume", "Büroausbau", "Dachgeschossausbau"],
    projectTypes: ["Innenausbau", "Sanierung", "Gewerbe", "Wohnbau", "Umbau"],
    relatedTrades: ["Malerarbeiten", "Putzarbeiten", "Brandschutz", "Elektroinstallation"],
    typicalBusinessTypes: ["Trockenbaubetrieb", "Ausbaubetrieb", "Innenausbauer"],
  }),
  trade("fliesenarbeiten", "Fliesenarbeiten", "Ausbau / Innenausbau", {
    shortDescription: "Fliesen, Platten, Naturstein, Bäder, Böden und Abdichtungen im Innenausbau.",
    synonyms: ["Fliesenleger", "Plattenleger", "Natursteinverlegung"],
    subTrades: ["Badfliesen", "Bodenfliesen", "Wandfliesen", "Naturstein", "Großformatfliesen", "Abdichtung im Verbund"],
    coreServices: ["Untergrund vorbereiten", "Fliesen verlegen", "Fugen herstellen", "Abdichtung ausführen", "Sockel verlegen"],
    specializations: ["Badsanierung", "Großformate", "Naturstein", "Balkon und Terrasse", "Gewerbeflächen"],
    projectTypes: ["Sanierung", "Neubau", "Bad", "Küche", "Gewerbe", "Terrasse"],
    relatedTrades: ["Estrich", "Sanitär", "Bauwerksabdichtung", "Malerarbeiten"],
    typicalBusinessTypes: ["Fliesenlegerbetrieb", "Ausbaubetrieb"],
  }),
  trade("estrich", "Estrich", "Ausbau / Innenausbau", {
    shortDescription: "Estricharbeiten, Fußbodenaufbau, Dämmung und Untergrundvorbereitung.",
    synonyms: ["Estrichleger", "Zementestrich", "Fließestrich", "Bodenaufbau"],
    subTrades: ["Zementestrich", "Anhydritestrich", "Fließestrich", "Heizestrich", "Verbundestrich", "Schwimmender Estrich"],
    coreServices: ["Dämmung verlegen", "Randdämmstreifen setzen", "Estrich einbringen", "Heizestrich ausführen", "Untergrund vorbereiten"],
    specializations: ["Fußbodenheizung", "Industrieboden", "Sanierung", "Schnellestrich"],
    projectTypes: ["Neubau", "Sanierung", "Wohnbau", "Gewerbe", "Industrie"],
    relatedTrades: ["Fliesenarbeiten", "Bodenbelag", "Heizung", "Trockenbau"],
    typicalBusinessTypes: ["Estrichbetrieb", "Bodenbauunternehmen"],
  }),
  trade("elektroinstallation", "Elektroinstallation", "TGA / Technische Gebäudeausrüstung", {
    shortDescription: "Elektroinstallation, Verteiler, Beleuchtung, Netzwerktechnik und Gebäudetechnik.",
    synonyms: ["Elektriker", "Elektro", "Elektrofachbetrieb", "Elektrounternehmen"],
    subTrades: ["Hausinstallation", "Verteilerbau", "Beleuchtung", "Netzwerktechnik", "KNX", "Wallbox", "PV-Anschluss"],
    coreServices: ["Leitungen verlegen", "Schalter und Steckdosen montieren", "Verteiler installieren", "Beleuchtung anschließen", "Prüfungen durchführen"],
    specializations: ["KNX", "Smart Home", "Ladeinfrastruktur", "Photovoltaik", "Gewerbeinstallation"],
    projectTypes: ["Neubau", "Sanierung", "Gewerbe", "Wohnbau", "Wartung"],
    relatedTrades: ["Photovoltaik", "Sicherheitstechnik", "TGA", "Trockenbau"],
    typicalBusinessTypes: ["Elektrobetrieb", "Elektroinstallateur", "TGA-Betrieb"],
  }),
  trade("sanitaer", "Sanitär", "TGA / Technische Gebäudeausrüstung", {
    shortDescription: "Sanitärinstallation, Bad, Wasserleitungen, Abwasser und Armaturen.",
    synonyms: ["Sanitärbetrieb", "Installateur", "SHK", "Badinstallation"],
    subTrades: ["Badinstallation", "Wasserleitungen", "Abwasserleitungen", "Vorwandinstallation", "Armaturen", "Enthärtungsanlagen"],
    coreServices: ["Leitungen verlegen", "Sanitärobjekte montieren", "Bäder installieren", "Anschlüsse herstellen", "Reparaturen ausführen"],
    specializations: ["Badsanierung", "barrierefreie Bäder", "Gewerbesanitär", "Trinkwasserhygiene"],
    projectTypes: ["Neubau", "Sanierung", "Bad", "Wartung", "Gewerbe"],
    relatedTrades: ["Heizung", "Fliesenarbeiten", "Trockenbau", "Bauwerksabdichtung"],
    typicalBusinessTypes: ["SHK-Betrieb", "Sanitärbetrieb", "Installateurbetrieb"],
  }),
  trade("heizung", "Heizung", "TGA / Technische Gebäudeausrüstung", {
    shortDescription: "Heizungsbau, Wärmeerzeuger, Fußbodenheizung, Heizkörper und Wartung.",
    synonyms: ["Heizungsbauer", "SHK", "Wärmepumpe", "Heizungsinstallation"],
    subTrades: ["Wärmepumpe", "Gasheizung", "Pelletheizung", "Fußbodenheizung", "Heizkörper", "Hydraulischer Abgleich"],
    coreServices: ["Heizung installieren", "Leitungen verlegen", "Wärmeerzeuger anschließen", "Wartung durchführen", "Störung beheben"],
    specializations: ["Wärmepumpen", "Sanierung", "Fußbodenheizung", "Gewerbeanlagen", "Energieeffizienz"],
    projectTypes: ["Neubau", "Sanierung", "Wartung", "Wohnbau", "Gewerbe"],
    relatedTrades: ["Sanitär", "Lüftung", "Elektroinstallation", "TGA"],
    typicalBusinessTypes: ["SHK-Betrieb", "Heizungsbauer", "TGA-Betrieb"],
  }),
  trade("lueftung", "Lüftung", "TGA / Technische Gebäudeausrüstung", {
    shortDescription: "Lüftungsanlagen, Wohnraumlüftung, Kanäle, Wartung und Brandschutzklappen.",
    synonyms: ["Lüftungsbau", "Klima", "Raumlufttechnik", "RLT"],
    subTrades: ["Wohnraumlüftung", "RLT-Anlagen", "Lüftungskanäle", "Brandschutzklappen", "Wartung"],
    coreServices: ["Kanäle montieren", "Geräte einbauen", "Luftdurchlässe setzen", "Wartung durchführen", "Filter wechseln"],
    specializations: ["Gewerbelüftung", "Wohnraumlüftung", "Wartung", "Brandschutzklappen", "Küchenabluft"],
    projectTypes: ["Neubau", "Sanierung", "Gewerbe", "Wartung", "Wohnbau"],
    relatedTrades: ["Heizung", "Kälte / Klima", "Elektroinstallation", "Brandschutz"],
    typicalBusinessTypes: ["Lüftungsbauer", "TGA-Betrieb", "RLT-Fachbetrieb"],
  }),
  trade("brandschutz", "Brandschutz", "Brandschutz / Sicherheit / Prüfung", {
    shortDescription: "Baulicher und technischer Brandschutz, Abschottungen, Türen und Dokumentation.",
    synonyms: ["Brandschutztechnik", "Abschottung", "Feuerschutz", "Brandschutzprüfung"],
    subTrades: ["Brandschutzabschottungen", "Brandschutztüren", "Brandschutzklappen", "Brandschutzbeschichtung", "Fluchtwegtechnik"],
    coreServices: ["Abschottungen herstellen", "Brandschutztüren montieren", "Brandschutz dokumentieren", "Durchführungen schließen", "Mängel beheben"],
    specializations: ["Leitungsabschottung", "Gewerbeobjekte", "Bestand", "Dokumentation"],
    projectTypes: ["Gewerbe", "Industrie", "Sanierung", "Umbau", "Wartung"],
    relatedTrades: ["Trockenbau", "Lüftung", "Elektroinstallation", "Sicherheitstechnik"],
    typicalBusinessTypes: ["Brandschutzbetrieb", "Spezialbetrieb", "TGA-Betrieb"],
  }),
  trade("metallbau", "Metallbau", "Metall / Stahl / Sonderbau", {
    shortDescription: "Geländer, Treppen, Tore, Stahlkonstruktionen, Schlosserarbeiten und Sonderbau.",
    synonyms: ["Schlosser", "Stahlbau", "Metallbauer", "Geländerbau"],
    subTrades: ["Geländer", "Treppen", "Tore", "Balkone", "Stahlkonstruktionen", "Edelstahlbau", "Aluminiumbau"],
    coreServices: ["Metallteile fertigen", "Geländer montieren", "Treppen bauen", "Tore einbauen", "Konstruktionen montieren"],
    specializations: ["Edelstahl", "Stahl", "Aluminium", "Balkone", "Sonderkonstruktionen"],
    projectTypes: ["Neubau", "Sanierung", "Gewerbe", "Privat", "Industrie"],
    relatedTrades: ["Stahlbau", "Fassadenbau", "Schlosserarbeiten", "Spengler / Klempner"],
    typicalBusinessTypes: ["Metallbaubetrieb", "Schlosserei", "Stahlbauunternehmen"],
  }),
  trade("malerarbeiten", "Malerarbeiten", "Ausbau / Innenausbau", {
    shortDescription: "Malerarbeiten, Beschichtungen, Tapezierarbeiten, Fassadenanstrich und Oberflächen.",
    synonyms: ["Maler", "Lackierer", "Anstrich", "Tapezieren"],
    subTrades: ["Innenanstrich", "Fassadenanstrich", "Lackierarbeiten", "Tapezierarbeiten", "Spachtelarbeiten", "Schimmelsanierung"],
    coreServices: ["Wände streichen", "Decken streichen", "Untergrund vorbereiten", "Spachteln", "Lackieren", "Fassade beschichten"],
    specializations: ["Altbau", "Fassade", "Schimmel", "Gewerbeflächen", "hochwertige Oberflächen"],
    projectTypes: ["Sanierung", "Renovierung", "Neubau", "Innenausbau", "Fassade"],
    relatedTrades: ["Putzarbeiten", "Trockenbau", "Bodenbelag", "Fassadenbau"],
    typicalBusinessTypes: ["Malerbetrieb", "Maler- und Lackiererbetrieb"],
  }),
  trade("bodenbelag", "Bodenbelag", "Ausbau / Innenausbau", {
    shortDescription: "Bodenbeläge, Parkett, Vinyl, Teppich, Linoleum und Untergrundvorbereitung.",
    synonyms: ["Bodenleger", "Parkettleger", "Fußboden", "Vinylboden"],
    subTrades: ["Parkett", "Vinyl", "Teppich", "Linoleum", "Designboden", "Untergrundausgleich"],
    coreServices: ["Untergrund prüfen", "Bodenbelag verlegen", "Sockelleisten montieren", "Altbelag entfernen", "Ausgleichsmasse einbauen"],
    specializations: ["Parkett", "Gewerbeflächen", "Sanierung", "Treppen", "Designbeläge"],
    projectTypes: ["Renovierung", "Innenausbau", "Gewerbe", "Wohnbau", "Sanierung"],
    relatedTrades: ["Estrich", "Malerarbeiten", "Trockenbau", "Fliesenarbeiten"],
    typicalBusinessTypes: ["Bodenlegerbetrieb", "Parkettleger", "Ausbaubetrieb"],
  }),
  trade("garten-landschaftsbau", "Garten- und Landschaftsbau", "Außenanlagen / Garten / Landschaft", {
    shortDescription: "Außenanlagen, Gärten, Wege, Terrassen, Pflanzflächen und Pflege.",
    synonyms: ["GaLaBau", "Gartenbau", "Landschaftsbau", "Außenanlagen"],
    subTrades: ["Terrassen", "Wege", "Pflanzflächen", "Rasen", "Einfriedungen", "Naturstein", "Gartenpflege"],
    coreServices: ["Außenanlagen herstellen", "Wege bauen", "Pflanzflächen anlegen", "Rasen herstellen", "Terrassen bauen"],
    specializations: ["Privatgärten", "Gewerbeaußenanlagen", "Naturstein", "Pflege", "Hanglagen"],
    projectTypes: ["Neuanlage", "Sanierung", "Pflege", "Privat", "Gewerbe"],
    relatedTrades: ["Pflasterbau", "Erdarbeiten", "Zaunbau", "Entwässerungsarbeiten"],
    typicalBusinessTypes: ["GaLaBau-Betrieb", "Gartenbauunternehmen", "Landschaftsbauer"],
  }),
  trade("sachverstaendige", "Sachverständige / Gutachten", "Planung / Gutachten / Fachberatung", {
    shortDescription: "Gutachten, Schadensbewertung, Bauberatung, Abnahmen und fachliche Prüfung.",
    synonyms: ["Bausachverständiger", "Gutachter", "Bauberater", "Bauschaden"],
    subTrades: ["Bauschäden", "Feuchtigkeit", "Abnahme", "Beweissicherung", "Kaufberatung", "Energieberatung"],
    coreServices: ["Schäden bewerten", "Gutachten erstellen", "Ortstermine durchführen", "Dokumentation erstellen", "Sanierungsempfehlungen geben"],
    specializations: ["Feuchteschäden", "Schimmel", "Altbau", "Abnahme", "Beweissicherung"],
    projectTypes: ["Sanierung", "Kauf", "Streitfall", "Abnahme", "Bestand"],
    relatedTrades: ["Bauleitung", "Architektur", "Sanierung", "Abdichtung"],
    typicalBusinessTypes: ["Sachverständigenbüro", "Ingenieurbüro", "Bauberatung"],
  }),
  trade("wartung-service", "Wartung / Service", "Wartung / Service / Gebäudebetrieb", {
    shortDescription: "Wartung, Instandhaltung, Störungsdienst und regelmäßige Prüfung technischer Anlagen.",
    synonyms: ["Service", "Instandhaltung", "Gebäudebetrieb", "Wartungsdienst"],
    subTrades: ["Anlagenwartung", "Störungsdienst", "Filterwechsel", "Funktionsprüfung", "Instandsetzung"],
    coreServices: ["Wartung durchführen", "Anlagen prüfen", "Störungen beheben", "Dokumentation führen", "Verschleißteile tauschen"],
    specializations: ["TGA-Wartung", "Lüftung", "Heizung", "Brandschutz", "Gewerbeobjekte"],
    projectTypes: ["Wartung", "Service", "Gewerbe", "Wohnanlage", "Bestand"],
    relatedTrades: ["Heizung", "Lüftung", "Elektroinstallation", "Brandschutz"],
    typicalBusinessTypes: ["Servicebetrieb", "TGA-Betrieb", "Gebäudedienstleister"],
  }),
  ...supplementalTradeTaxonomy,
];

export function canonicalTradeSlug(slugOrName: string) {
  const normalized = slugOrName.trim().toLowerCase();
  return tradeSlugAliases[normalized] || normalized;
}

export function findTaxonomyTrade(slugOrName: string) {
  const canonical = canonicalTradeSlug(slugOrName);
  return tradeTaxonomy.find((trade) => trade.slug === canonical || trade.name === slugOrName);
}

export function publicTradeTaxonomy() {
  const seen = new Set<string>();
  return tradeTaxonomy.filter((trade) => {
    const canonical = canonicalTradeSlug(trade.slug);
    if (canonical !== trade.slug) return false;
    if (seen.has(trade.slug)) return false;
    seen.add(trade.slug);
    return trade.isActive !== false;
  });
}

export function groupedTradeSelection() {
  const tradesBySlug = new Map(publicTradeTaxonomy().map((trade) => [trade.slug, trade]));
  return tradeSelectionGroups.map((group) => ({
    name: group.name,
    trades: group.slugs.map((slug) => tradesBySlug.get(canonicalTradeSlug(slug))).filter((trade): trade is TaxonomyTrade => Boolean(trade)),
  }));
}

function trade(
  slug: string,
  name: string,
  category: TradeCategory,
  data: Omit<TaxonomyTrade, "slug" | "name" | "category" | "seoTitle" | "seoDescription" | "isActive">,
): TaxonomyTrade {
  return {
    slug,
    name,
    category,
    seoTitle: `${name} finden | GewerkeListe.com`,
    seoDescription: `${name}: Fachbetriebe nach Leistung, Ort und Tätigkeitsgebiet im Gewerkeregister finden.`,
    isActive: true,
    ...data,
  };
}

function clusters(category: TradeCategory, entries: Array<[string, string]>): TaxonomyTrade[] {
  const profile = categoryProfile(category);
  return entries.map(([slug, name]) => {
    const normalizedName = name.replace(/\s*\/\s*/g, " ");
    const tradeTerms = tradeTermsFromName(name);

    return trade(slug, name, category, {
      shortDescription: shortDescriptionFor(category, name),
      synonyms: uniqueList([name, normalizedName, ...tradeTerms.synonyms, ...profile.synonyms]).slice(0, 7),
      subTrades: uniqueList([...tradeTerms.subTrades, ...profile.subTrades]).slice(0, 7),
      coreServices: profile.coreServices,
      specializations: uniqueList([...tradeTerms.specializations, ...profile.specializations]).slice(0, 6),
      projectTypes: profile.projectTypes,
      relatedTrades: relatedByCategory(category).filter((relatedSlug) => relatedSlug !== slug),
      typicalBusinessTypes: profile.typicalBusinessTypes,
      isExample: false,
    });
  });
}

type CategoryProfile = {
  synonyms: string[];
  subTrades: string[];
  coreServices: string[];
  specializations: string[];
  projectTypes: string[];
  typicalBusinessTypes: string[];
};

function categoryProfile(category: TradeCategory): CategoryProfile {
  const profiles: Record<TradeCategory, CategoryProfile> = {
    "Rohbau / Tragwerk": {
      synonyms: ["Rohbau", "Tragwerk", "Massivbau"],
      subTrades: ["tragende Bauteile", "Baustelleneinrichtung", "Bestandsdurchbrüche", "Rohbauanschlüsse"],
      coreServices: ["Bauteile herstellen", "Schalung setzen", "Bewehrung einbauen", "Beton einbringen", "Mauerwerk ändern", "Öffnungen herstellen"],
      specializations: ["Massivbau", "Bestandsumbau", "Rohbau", "Tragwerksanschlüsse", "Kleinbaustellen"],
      projectTypes: ["Einfamilienhaus", "Mehrfamilienhaus", "Gewerbebau", "Bestandssanierung", "Anbau"],
      typicalBusinessTypes: ["Bauunternehmen", "Rohbaubetrieb", "Maurer- und Betonbaubetrieb"],
    },
    "Tiefbau / Erdbau / Infrastruktur": {
      synonyms: ["Tiefbau", "Erdbau", "Infrastruktur"],
      subTrades: ["Baugruben", "Leitungsgräben", "Entwässerung", "Oberbau", "Hausanschlüsse"],
      coreServices: ["Boden ausheben", "Leitungen verlegen", "Planum herstellen", "Schichten verdichten", "Entwässerung einbauen", "Gräben verfüllen"],
      specializations: ["Hausanschlüsse", "Baugruben", "Wegebau", "Entwässerung", "Kommunale Flächen"],
      projectTypes: ["Erschließung", "Außenanlagen", "Gewerbebau", "Infrastruktur", "Bestand"],
      typicalBusinessTypes: ["Tiefbauunternehmen", "Erdbauunternehmen", "Infrastrukturbetrieb"],
    },
    "Gebäudehülle / Dach / Fassade": {
      synonyms: ["Gebäudehülle", "Dach", "Fassade"],
      subTrades: ["Dachflächen", "Fassadenflächen", "Anschlüsse", "Witterungsschutz", "Wärmeschutz"],
      coreServices: ["Bauteile abdichten", "Dämmung einbauen", "Bekleidungen montieren", "Anschlüsse ausbilden", "Öffnungen einfassen", "Deckungen herstellen"],
      specializations: ["Steildach", "Flachdach", "Fassade", "Wärmeschutz", "Anschlussdetails"],
      projectTypes: ["Neubau", "Dachsanierung", "Fassadensanierung", "Gewerbebau", "Bestand"],
      typicalBusinessTypes: ["Dachdeckerbetrieb", "Fassadenbetrieb", "Zimmerei"],
    },
    "Ausbau / Innenausbau": {
      synonyms: ["Innenausbau", "Ausbau", "Raumausbau"],
      subTrades: ["Wände", "Decken", "Böden", "Oberflächen", "Einbauten"],
      coreServices: ["Untergründe vorbereiten", "Bauteile montieren", "Flächen spachteln", "Beläge verlegen", "Oberflächen beschichten", "Anschlüsse herstellen"],
      specializations: ["Wohnungsbau", "Gewerbeausbau", "Trockenräume", "Feuchträume", "Bestand"],
      projectTypes: ["Wohnungsausbau", "Gewerbeausbau", "Umbau", "Modernisierung", "Bestandssanierung"],
      typicalBusinessTypes: ["Ausbaubetrieb", "Innenausbaubetrieb", "Handwerksbetrieb"],
    },
    "TGA / Technische Gebäudeausrüstung": {
      synonyms: ["TGA", "Gebäudetechnik", "Haustechnik"],
      subTrades: ["Anlagen", "Leitungsnetze", "Verteilungen", "Regelung", "Inbetriebnahme"],
      coreServices: ["Leitungen installieren", "Anlagen anschließen", "Verteilungen aufbauen", "Systeme einregulieren", "Funktionen prüfen", "Anlagen warten"],
      specializations: ["Wohngebäude", "Gewerbeobjekte", "Modernisierung", "Anlagentechnik", "Gebäudebetrieb"],
      projectTypes: ["Neubau", "Modernisierung", "Gewerbebau", "Wohnanlage", "Bestand"],
      typicalBusinessTypes: ["TGA-Fachbetrieb", "Installationsbetrieb", "Gebäudetechnikbetrieb"],
    },
    "Brandschutz / Sicherheit / Prüfung": {
      synonyms: ["Brandschutz", "Sicherheitstechnik", "Prüfung"],
      subTrades: ["Abschottungen", "Bauteilprüfung", "Sicherheitsanlagen", "Wartung", "Dokumentation"],
      coreServices: ["Bauteile abschotten", "Anlagen prüfen", "Funktionen dokumentieren", "Mängel erfassen", "Bauteile kennzeichnen", "Instandsetzungen veranlassen"],
      specializations: ["Vorbeugender Brandschutz", "Prüfung", "Gebäudebetrieb", "Bestand", "Gewerbeobjekte"],
      projectTypes: ["Gewerbebau", "Wohnanlage", "Bestandsgebäude", "Sonderbau", "Wartung"],
      typicalBusinessTypes: ["Brandschutzbetrieb", "Prüfdienstleister", "Sicherheitstechnikbetrieb"],
    },
    "Außenanlagen / Garten / Landschaft": {
      synonyms: ["Außenanlagen", "GaLaBau", "Landschaftsbau"],
      subTrades: ["Wege", "Terrassen", "Entwässerung", "Einfriedungen", "Vegetationsflächen"],
      coreServices: ["Flächen profilieren", "Tragschichten einbauen", "Beläge verlegen", "Entwässerung herstellen", "Einfassungen setzen", "Pflanzflächen vorbereiten"],
      specializations: ["Privatgärten", "Hofeinfahrten", "Gewerbeflächen", "Entwässerung", "Naturstein"],
      projectTypes: ["Außenanlage", "Gartenanlage", "Hofeinfahrt", "Gewerbefläche", "Bestand"],
      typicalBusinessTypes: ["GaLaBau-Betrieb", "Landschaftsbauunternehmen", "Außenanlagenbetrieb"],
    },
    "Metall / Stahl / Sonderbau": {
      synonyms: ["Metallbau", "Stahlbau", "Schlosserei"],
      subTrades: ["Stahlkonstruktionen", "Geländer", "Treppen", "Tore", "Sonderbauteile"],
      coreServices: ["Bauteile fertigen", "Profile zuschneiden", "Bauteile schweißen", "Konstruktionen montieren", "Oberflächen vorbereiten", "Anschlüsse richten"],
      specializations: ["Stahlkonstruktionen", "Geländer", "Treppen", "Sonderteile", "Reparaturen"],
      projectTypes: ["Gewerbebau", "Industrie", "Wohngebäude", "Umbau", "Bestand"],
      typicalBusinessTypes: ["Metallbaubetrieb", "Schlosserei", "Stahlbaubetrieb"],
    },
    "Sanierung / Bestand / Spezial": {
      synonyms: ["Sanierung", "Bestand", "Instandsetzung"],
      subTrades: ["Schadstellen", "Bauteilanschlüsse", "Feuchteschutz", "Untergrundsanierung", "Rückbau"],
      coreServices: ["Schäden freilegen", "Bauteile instand setzen", "Untergründe vorbereiten", "Feuchtigkeit sperren", "Risse schließen", "Bestand dokumentieren"],
      specializations: ["Altbau", "Feuchteschäden", "Balkone", "Keller", "Schadstoffbereiche"],
      projectTypes: ["Altbausanierung", "Bestandssanierung", "Instandsetzung", "Umbau", "Schadensanierung"],
      typicalBusinessTypes: ["Sanierungsbetrieb", "Bauunternehmen", "Spezialfachbetrieb"],
    },
    "Planung / Gutachten / Fachberatung": {
      synonyms: ["Planung", "Gutachten", "Fachberatung"],
      subTrades: ["Entwurfsplanung", "Ausführungsplanung", "Ausschreibung", "Bauüberwachung", "Gutachten"],
      coreServices: ["Bestand aufnehmen", "Bauteile bemessen", "Leistungen ausschreiben", "Ausführung überwachen", "Schäden begutachten", "Unterlagen dokumentieren"],
      specializations: ["Bestandsanalyse", "Fachplanung", "Bauüberwachung", "Schadensbewertung", "Ausschreibung"],
      projectTypes: ["Neubau", "Umbau", "Sanierung", "Gewerbebau", "Gutachten"],
      typicalBusinessTypes: ["Planungsbüro", "Ingenieurbüro", "Sachverständigenbüro"],
    },
    "Wartung / Service / Gebäudebetrieb": {
      synonyms: ["Wartung", "Service", "Gebäudebetrieb"],
      subTrades: ["Inspektion", "Funktionsprüfung", "Instandhaltung", "Störungsdienst", "Dokumentation"],
      coreServices: ["Anlagen inspizieren", "Funktionen prüfen", "Verschleißteile tauschen", "Störungen beheben", "Wartungen dokumentieren", "Intervalle überwachen"],
      specializations: ["Gewerbeobjekte", "Wohnanlagen", "Technische Anlagen", "Gebäudeservice", "Regelwartung"],
      projectTypes: ["Wartung", "Instandhaltung", "Gewerbeobjekt", "Wohnanlage", "Bestand"],
      typicalBusinessTypes: ["Servicebetrieb", "Gebäudedienstleister", "Instandhaltungsbetrieb"],
    },
  };

  return profiles[category];
}

function shortDescriptionFor(category: TradeCategory, name: string) {
  const descriptions: Record<TradeCategory, string> = {
    "Rohbau / Tragwerk": `${name} betrifft tragende und massive Bauteile im Neubau, Umbau und Bestand.`,
    "Tiefbau / Erdbau / Infrastruktur": `${name} umfasst Arbeiten an Baugrund, Leitungen, Entwässerung und befestigten Flächen.`,
    "Gebäudehülle / Dach / Fassade": `${name} betrifft witterungsbeanspruchte Bauteile an Dach, Fassade und Gebäudeanschlüssen.`,
    "Ausbau / Innenausbau": `${name} ordnet Ausbauleistungen an Innenflächen, Einbauten, Böden, Wänden und Decken ein.`,
    "TGA / Technische Gebäudeausrüstung": `${name} umfasst technische Anlagen, Leitungsnetze, Verteilungen und deren Inbetriebnahme im Gebäude.`,
    "Brandschutz / Sicherheit / Prüfung": `${name} betrifft bauliche, technische oder organisatorische Schutz- und Prüfarbeiten am Gebäude.`,
    "Außenanlagen / Garten / Landschaft": `${name} umfasst befestigte Flächen, Entwässerung, Einfassungen und gestaltete Außenbereiche.`,
    "Metall / Stahl / Sonderbau": `${name} betrifft gefertigte Metall- und Stahlbauteile für Gebäude, Außenanlagen und Sonderkonstruktionen.`,
    "Sanierung / Bestand / Spezial": `${name} ordnet Instandsetzung, Schadensbehebung und spezialisierte Arbeiten an Bestandsbauteilen ein.`,
    "Planung / Gutachten / Fachberatung": `${name} umfasst fachliche Planung, Prüfung, Bewertung und Begleitung von Bauaufgaben.`,
    "Wartung / Service / Gebäudebetrieb": `${name} betrifft wiederkehrende Inspektion, Instandhaltung und Störungsbeseitigung im Gebäudebetrieb.`,
  };

  return descriptions[category];
}

function tradeTermsFromName(name: string) {
  const cleanName = name.replace(/\s*\/\s*/g, " ");
  const parts = cleanName
    .split(/[\s-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 3);

  return {
    synonyms: parts,
    subTrades: [`${cleanName} im Bestand`, `${cleanName} im Neubau`, `${cleanName} an Bestandsgebäuden`],
    specializations: parts.slice(0, 3),
  };
}

function uniqueList(items: string[]) {
  return Array.from(new Set(items.filter((item) => item.trim().length > 0)));
}

function relatedByCategory(category: TradeCategory) {
  const related: Record<TradeCategory, string[]> = {
    "Rohbau / Tragwerk": ["maurerarbeiten", "betonbau", "tiefbau", "putzarbeiten"],
    "Tiefbau / Erdbau / Infrastruktur": ["erdarbeiten", "kanalbau", "pflasterbau", "drainagearbeiten"],
    "Gebäudehülle / Dach / Fassade": ["dachdecker", "spengler-klempner", "fassadenbau", "bauwerksabdichtung"],
    "Ausbau / Innenausbau": ["trockenbau", "putzarbeiten", "malerarbeiten", "fliesenarbeiten"],
    "TGA / Technische Gebäudeausrüstung": ["elektroinstallation", "sanitaer", "heizung", "lueftung"],
    "Brandschutz / Sicherheit / Prüfung": ["brandschutz", "trockenbau", "elektroinstallation", "lueftung"],
    "Außenanlagen / Garten / Landschaft": ["pflasterbau", "erdarbeiten", "garten-landschaftsbau", "kanalbau"],
    "Metall / Stahl / Sonderbau": ["metallbau", "stahlbau", "schlosserarbeiten", "fassadenbau"],
    "Sanierung / Bestand / Spezial": ["bauwerksabdichtung", "malerarbeiten", "putzarbeiten", "betoninstandsetzung"],
    "Planung / Gutachten / Fachberatung": ["bauleitung", "sachverstaendige", "tga-planung", "brandschutzplanung"],
    "Wartung / Service / Gebäudebetrieb": ["wartung-service", "heizung", "lueftung", "brandschutz"],
  };
  return related[category];
}
