import manifest from "../data/municipality-pilot.json" with { type: "json" };

export type PilotCounty = {
  code: string;
  name: string;
  kind: "Landkreis" | "Kreisfreie Stadt";
  stateCode: string;
  stateName: string;
};

export type PilotMunicipality = {
  ags: string;
  name: string;
  slug: string;
  countyCode: string;
  countyName: string;
  countyKind: string;
  stateCode: string;
  stateName: string;
  geometryRef: string;
  selectionEnabled: boolean;
  center: [number, number];
};

type MunicipalityManifest = {
  schemaVersion: number;
  dataAsOf: string;
  source: {
    dataset: string;
    url: string;
    sourceFileSha256: string;
    license: string;
    licenseUrl: string;
    dataSourcesUrl: string;
    attribution: string;
    transformation: string;
  };
  geometry: {
    path: string;
    sha256: string;
    projection: string;
    simplification: string;
  };
  pilotCounties: PilotCounty[];
  municipalities: PilotMunicipality[];
};

export const municipalityManifest = manifest as unknown as MunicipalityManifest;
export const pilotCounties = municipalityManifest.pilotCounties;
export const pilotMunicipalities = municipalityManifest.municipalities;
export const pilotMunicipalityCount = pilotMunicipalities.length;
export const municipalitySourceAttribution = municipalityManifest.source.attribution;
export const municipalitySourceUrl = municipalityManifest.source.url;
export const municipalityDataSourcesUrl = municipalityManifest.source.dataSourcesUrl;
export const municipalityDataAsOfLabel = municipalityManifest.dataAsOf.split("-").reverse().join(".");

const municipalityByAgs = new Map(pilotMunicipalities.map((municipality) => [municipality.ags, municipality]));
const municipalityBySlug = new Map(pilotMunicipalities.map((municipality) => [municipality.slug, municipality]));

export function getPilotMunicipalityByAgs(ags: string) {
  return municipalityByAgs.get(ags) || null;
}

export function getPilotMunicipalityBySlug(slug: string) {
  return municipalityBySlug.get(slug) || null;
}

export function normalizeMunicipalityCodes(values: readonly unknown[]) {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    ),
  );
}

export function validatePilotMunicipalityCodes(values: readonly unknown[]) {
  const normalizedCodes = normalizeMunicipalityCodes(values);
  const invalidCodes = normalizedCodes.filter((ags) => !municipalityByAgs.has(ags) || !municipalityByAgs.get(ags)?.selectionEnabled);
  return {
    valid: invalidCodes.length === 0,
    validCodes: normalizedCodes.filter((ags) => !invalidCodes.includes(ags)),
    invalidCodes,
  };
}

export function municipalitiesByCounty() {
  return pilotCounties.map((county) => ({
    county,
    municipalities: pilotMunicipalities.filter((municipality) => municipality.countyCode === county.code),
  }));
}
