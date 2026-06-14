export type TradeHierarchyItem = {
  label: string;
  slug: string;
};

export type TradeHierarchySubgroup = {
  code: string;
  title: string;
  items: TradeHierarchyItem[];
};

export type TradeHierarchyGroup = {
  code: string;
  title: string;
  defaultOpen: boolean;
  items?: TradeHierarchyItem[];
  subgroups?: TradeHierarchySubgroup[];
};

function item(label: string, slug: string): TradeHierarchyItem {
  return { label, slug };
}

export const frequentTradeSlugs = [
  "maurerarbeiten",
  "betonbau",
  "erdarbeiten",
  "dachdecker",
  "zimmererarbeiten",
  "spengler-klempner",
  "trockenbau",
  "putzarbeiten",
  "fliesenarbeiten",
  "elektroinstallation",
  "sanitaer",
  "heizung",
  "lueftung",
  "pflasterbau",
  "garten-landschaftsbau",
  "metallbau",
  "bauwerksabdichtung",
  "brandschutzabschottungen",
] as const;

export const tradeHierarchy: TradeHierarchyGroup[] = [
  {
    code: "KG 200",
    title: "Vorbereitende Maßnahmen",
    defaultOpen: false,
    items: [
      item("Abbrucharbeiten", "abbrucharbeiten"),
      item("Baustelleneinrichtung", "arbeitssicherheit-baustelle"),
      item("Erschließung", "hausanschluesse"),
      item("Kampfmittelsondierung", "sachverstaendige"),
      item("Altlastensanierung", "asbestsanierung"),
      item("Sicherungsmaßnahmen", "baugrubensicherung"),
    ],
  },
  {
    code: "KG 300",
    title: "Bauwerk / Baukonstruktionen",
    defaultOpen: true,
    subgroups: [
      {
        code: "310",
        title: "Baugrube / Erdbau",
        items: [
          item("Erdarbeiten", "erdarbeiten"),
          item("Baugrubenaushub", "erdarbeiten"),
          item("Wasserhaltung", "wasserhaltung"),
          item("Spezialtiefbau", "tiefbau"),
          item("Verbau", "baugrubensicherung"),
        ],
      },
      {
        code: "320",
        title: "Gründung / Unterbau",
        items: [
          item("Fundamentarbeiten", "fundamentbau"),
          item("Bodenplatte", "bodenplatten"),
          item("Pfahlgründung", "tiefbau"),
          item("Abdichtung erdberührter Bauteile", "bauwerksabdichtung"),
        ],
      },
      {
        code: "330",
        title: "Außenwände",
        items: [
          item("Maurerarbeiten", "maurerarbeiten"),
          item("Betonarbeiten", "betonbau"),
          item("Fassadenbau", "fassadenbau"),
          item("Wärmedämmverbundsystem", "waermedaemmverbundsysteme"),
          item("Fensterbau", "fensterbau"),
          item("Sonnenschutz", "sonnenschutz"),
        ],
      },
      {
        code: "340",
        title: "Innenwände",
        items: [
          item("Trockenbau", "trockenbau"),
          item("Innenputz", "putzarbeiten"),
          item("Glaserarbeiten", "fensterbau"),
          item("Schreinerarbeiten", "schreinerarbeiten"),
          item("Metallbau", "metallbau"),
        ],
      },
      {
        code: "350",
        title: "Decken",
        items: [
          item("Stahlbetonarbeiten", "betonbau"),
          item("Deckensanierung", "deckenbau"),
          item("Estricharbeiten", "estrich"),
          item("Bodenaufbau", "bodenbelag"),
        ],
      },
      {
        code: "360",
        title: "Dächer",
        items: [
          item("Dachdeckerarbeiten", "dachdecker"),
          item("Zimmererarbeiten", "zimmererarbeiten"),
          item("Spenglerarbeiten", "spengler-klempner"),
          item("Dachabdichtung", "flachdachabdichtung"),
          item("Dachfenster", "dachfenster"),
          item("PV-Montage Dach", "photovoltaik"),
        ],
      },
      {
        code: "370",
        title: "Infrastrukturanlagen",
        items: [
          item("Entwässerung", "drainagearbeiten"),
          item("Kanalbau", "kanalbau"),
          item("Leitungsbau", "leitungsbau"),
          item("Hofentwässerung", "regenwassermanagement"),
        ],
      },
      {
        code: "380",
        title: "Baukonstruktive Einbauten",
        items: [
          item("Treppenbau", "treppenbau-metall"),
          item("Geländer", "gelaenderbau"),
          item("Einbaumöbel", "schreinerarbeiten"),
          item("Schließanlagen", "sicherheitstechnik"),
        ],
      },
      {
        code: "390",
        title: "Sonstige Maßnahmen",
        items: [
          item("Gerüstarbeiten", "arbeitssicherheit-baustelle"),
          item("Kernbohrungen", "kernbohrungen"),
          item("Brandschutzabschottung", "brandschutzabschottungen"),
          item("Bauwerksabdichtung", "bauwerksabdichtung"),
          item("Betonsanierung", "betoninstandsetzung"),
          item("Bautrocknung", "wasserschadensanierung"),
          item("Schadstoffsanierung", "asbestsanierung"),
        ],
      },
    ],
  },
  {
    code: "KG 400",
    title: "Technische Anlagen",
    defaultOpen: true,
    subgroups: [
      {
        code: "410",
        title: "Abwasser-, Wasser-, Gasanlagen",
        items: [
          item("Sanitär", "sanitaer"),
          item("Trinkwasserinstallation", "sanitaer"),
          item("Abwasserinstallation", "sanitaer"),
          item("Gasinstallation", "heizung"),
          item("Hebeanlagen", "aufzugstechnik"),
        ],
      },
      {
        code: "420",
        title: "Wärmeversorgungsanlagen",
        items: [
          item("Heizungsbau", "heizung"),
          item("Wärmepumpen", "waermepumpen"),
          item("Fußbodenheizung", "heizung"),
          item("Fernwärme", "energieanlagen"),
          item("Pelletheizung", "heizung"),
          item("Solarthermie", "energieanlagen"),
        ],
      },
      {
        code: "430",
        title: "Raumlufttechnische Anlagen",
        items: [
          item("Lüftungsanlagen", "lueftung"),
          item("Klima", "kaelte-klima"),
          item("Kältetechnik", "kaelte-klima"),
          item("Wohnraumlüftung", "lueftung"),
          item("Entrauchung", "rauch-waermeabzug"),
        ],
      },
      {
        code: "440",
        title: "Elektrische Anlagen",
        items: [
          item("Elektroinstallation", "elektroinstallation"),
          item("Zählerschrank", "elektroinstallation"),
          item("Beleuchtung", "elektroinstallation"),
          item("Blitzschutz", "blitzschutz"),
          item("Erdung", "blitzschutz"),
          item("Photovoltaik", "photovoltaik"),
          item("Batteriespeicher", "energieanlagen"),
        ],
      },
      {
        code: "450",
        title: "Kommunikations-, sicherheits- und informationstechnische Anlagen",
        items: [
          item("Netzwerktechnik", "netzwerktechnik"),
          item("Brandmeldeanlagen", "brandmeldeanlagen"),
          item("Einbruchmeldeanlagen", "sicherheitstechnik"),
          item("Videoüberwachung", "sicherheitstechnik"),
          item("Zutrittskontrolle", "sicherheitstechnik"),
          item("Sprechanlagen", "netzwerktechnik"),
          item("Smart Home", "knx-smart-home"),
        ],
      },
      {
        code: "460",
        title: "Förderanlagen",
        items: [
          item("Aufzüge", "aufzugstechnik"),
          item("Plattformlifte", "aufzugstechnik"),
          item("Hebeanlagen", "aufzugstechnik"),
          item("Garagentore", "torbau"),
        ],
      },
      {
        code: "480",
        title: "Gebäudeautomation",
        items: [
          item("KNX", "knx-smart-home"),
          item("Gebäudeleittechnik", "gebaeudeautomation"),
          item("MSR-Technik", "gebaeudeautomation"),
          item("Smart Building", "gebaeudeautomation"),
        ],
      },
    ],
  },
  {
    code: "KG 500",
    title: "Außenanlagen und Freiflächen",
    defaultOpen: true,
    subgroups: [
      {
        code: "510",
        title: "Erdbau Außenanlagen",
        items: [item("Geländemodellierung", "erdarbeiten"), item("Aushub", "erdarbeiten"), item("Bodenverbesserung", "geotechnik")],
      },
      {
        code: "520",
        title: "Gründung / Unterbau Außenanlagen",
        items: [item("Frostschutzschicht", "pflasterbau"), item("Unterbau", "pflasterbau"), item("Tragschichten", "pflasterbau")],
      },
      {
        code: "530",
        title: "Oberbau / Deckschichten",
        items: [
          item("Pflasterarbeiten", "pflasterbau"),
          item("Asphaltarbeiten", "asphaltarbeiten"),
          item("Natursteinpflaster", "pflasterbau"),
          item("Betonpflaster", "pflasterbau"),
          item("Plattenbeläge", "pflasterbau"),
          item("Terrassenbau", "terrassenbau"),
        ],
      },
      {
        code: "540",
        title: "Baukonstruktionen Außenanlagen",
        items: [
          item("Stützmauern", "mauerbau-aussenanlagen"),
          item("Treppen außen", "mauerbau-aussenanlagen"),
          item("Einfriedungen", "zaunbau"),
          item("Zaunbau", "zaunbau"),
          item("Carports", "holzbau"),
        ],
      },
      {
        code: "550",
        title: "Technische Anlagen Außenanlagen",
        items: [
          item("Außenbeleuchtung", "elektroinstallation"),
          item("Entwässerung", "drainagearbeiten"),
          item("Rigolen", "regenwassermanagement"),
          item("Zisternen", "zisterne"),
          item("Bewässerung", "regenwassermanagement"),
          item("Außenstrom", "elektroinstallation"),
        ],
      },
      {
        code: "570",
        title: "Vegetationsflächen",
        items: [
          item("Gartenbau", "gartenbau"),
          item("Landschaftsbau", "landschaftsbau"),
          item("Rasen", "garten-landschaftsbau"),
          item("Pflanzarbeiten", "garten-landschaftsbau"),
          item("Baumpflege", "pflege-aussenanlagen"),
        ],
      },
    ],
  },
  {
    code: "KG 600",
    title: "Ausstattung",
    defaultOpen: false,
    items: [
      item("Küchenbau", "schreinerarbeiten"),
      item("Möbelbau", "schreinerarbeiten"),
      item("Objektmöblierung", "innenausbau"),
      item("Beschilderung", "metallbau"),
      item("Sonderausstattung", "sonderkonstruktionen-metall"),
    ],
  },
  {
    code: "KG 700",
    title: "Baunebenkosten / Planung",
    defaultOpen: false,
    subgroups: [
      {
        code: "730",
        title: "Objektplanung",
        items: [
          item("Architekten", "architektur"),
          item("Innenarchitekten", "innenausbau"),
          item("Landschaftsarchitekten", "landschaftsbau"),
        ],
      },
      {
        code: "740",
        title: "Fachplanung",
        items: [
          item("Tragwerksplanung", "tragwerksplanung"),
          item("TGA-Planung", "tga-planung"),
          item("Elektroplanung", "tga-planung"),
          item("Brandschutzplanung", "brandschutzplanung"),
          item("Energieberatung", "energieberatung"),
          item("Bauphysik", "baubiologie"),
          item("Schallschutz", "sachverstaendige"),
          item("Vermessung", "vermessung"),
          item("SiGeKo", "arbeitssicherheit-baustelle"),
          item("Bodengutachter", "baugrundgutachten"),
          item("Schadstoffgutachter", "sachverstaendige"),
          item("Entwässerungsplanung", "ausschreibung-vergabe"),
        ],
      },
    ],
  },
];
