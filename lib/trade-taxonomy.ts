export interface TradeCategory {
  slug: string;
  name: string;
  description: string;
}

export interface Trade {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  coreServices: string[];
  specializations: string[];
  synonyms: string[];
  relatedTrades: string[];
  projectTypes: string[];
  typicalBusinessTypes: string[];
  seoTitle: string;
  seoDescription: string;
  isExample?: boolean;
  isActive: boolean;
}

export const categories: TradeCategory[] = [
  { slug: "rohbau-tragwerk", name: "Rohbau & Tragwerk", description: "Tragkonstruktionen, Mauerwerk und konstruktiver Ingenieurbau" },
  { slug: "tiefbau-infrastruktur", name: "Tiefbau & Infrastruktur", description: "Erdarbeiten, Leitungsbau, Verkehrswege und Spezialtiefbau" },
  { slug: "gebaeudehuelle-dach", name: "Gebäudehülle & Dach", description: "Dachkonstruktionen, Fassadensysteme, Abdichtung und Verglasung" },
  { slug: "ausbau-oberflaeche", name: "Ausbau & Oberfläche", description: "Innenausbau, Putze, Estriche, Bodenbeläge und Oberflächengestaltung" },
  { slug: "tga", name: "Technische Gebäudeausrüstung", description: "Heizung, Lüftung, Sanitär, Elektro und Gebäudeautomation" },
  { slug: "metall-stahlbau", name: "Metall- & Stahlbau", description: "Stahl- und Metallkonstruktionen, Schlosserarbeiten und Korrosionsschutz" },
  { slug: "brandschutz-sicherheit", name: "Brandschutz & Sicherheit", description: "Vorbeugender und anlagentechnischer Brandschutz, Sicherheitssysteme" },
  { slug: "sanierung-instandsetzung", name: "Sanierung & Instandsetzung", description: "Bestandserhaltung, Schadstoffbeseitigung und Bauwerksinstandsetzung" },
  { slug: "aussenanlagen-landschaftsbau", name: "Außenanlagen & Landschaftsbau", description: "Gartengestaltung, Sportanlagen, Wegebau und Freianlagenplanung" },
  { slug: "planung-gutachten", name: "Planung & Gutachten", description: "Architektur, Fachplanung, Vermessung und Sachverständigenwesen" },
  { slug: "wartung-facility-management", name: "Wartung & Facility Management", description: "Gebäudebetrieb, technische Wartung und infrastrukturelle Dienste" },
  { slug: "spezialgewerke", name: "Spezialgewerke", description: "Sonderbauverfahren, Spezialbau und branchenspezifische Gewerke" },
];

// TRADES_PLACEHOLDER
export const trades: Trade[] = [];

export function getTradeBySlug(slug: string): Trade | undefined {
  return trades.find((t) => t.slug === slug);
}

export function getTradesByCategory(categorySlug: string): Trade[] {
  return trades.filter((t) => t.category === categorySlug);
}

export function getActiveExampleTrades(): Trade[] {
  return trades.filter((t) => t.isExample && t.isActive);
}

export function getRelatedTrades(trade: Trade): Trade[] {
  return trade.relatedTrades
    .map((slug) => getTradeBySlug(slug))
    .filter((t): t is Trade => t !== undefined);
}
