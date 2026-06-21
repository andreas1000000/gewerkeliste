export type GeoCoordinate = {
  latitude: number;
  longitude: number;
};

export type GeoJsonPosition = [longitude: number, latitude: number] | [longitude: number, latitude: number, elevation: number];

export type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: GeoJsonPosition[][];
};

export type GeoJsonMultiPolygon = {
  type: "MultiPolygon";
  coordinates: GeoJsonPosition[][][];
};

export type ServiceAreaGeoJson = GeoJsonPolygon | GeoJsonMultiPolygon;

export type ServiceAreaType = "radius" | "region" | "postal_codes" | "polygon" | "manual_drawn";

export type ServiceAreaSource = "company_claim" | "admin" | "agent" | "imported";

export type ServiceAreaStatus = "draft" | "review" | "approved" | "rejected";

export type CompanyServiceAreaDraft = {
  companyId: string;
  type: ServiceAreaType;
  label: string;
  geojson?: ServiceAreaGeoJson;
  postalCodes?: string[];
  regionIds?: string[];
  radiusKm?: number;
  source: ServiceAreaSource;
  status: ServiceAreaStatus;
  confidenceScore?: number;
};

export type GeocodingMetadata = {
  geocodedAddress?: string;
  provider?: string;
  confidence?: number;
  geocodedAt?: string;
};

