import type { GeoCoordinate, GeoJsonMultiPolygon, GeoJsonPolygon, GeoJsonPosition, ServiceAreaGeoJson } from "./types";

export function isValidCoordinate(coordinate: GeoCoordinate): boolean {
  return (
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
}

export function isValidPosition(position: unknown): position is GeoJsonPosition {
  if (!Array.isArray(position) || (position.length !== 2 && position.length !== 3)) {
    return false;
  }

  const [longitude, latitude, elevation] = position;
  return (
    typeof longitude === "number" &&
    typeof latitude === "number" &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90 &&
    (elevation === undefined || (typeof elevation === "number" && Number.isFinite(elevation)))
  );
}

export function isValidPolygon(value: unknown): value is GeoJsonPolygon {
  if (!isGeoJsonObject(value) || value.type !== "Polygon" || !Array.isArray(value.coordinates)) {
    return false;
  }

  return isValidPolygonCoordinates(value.coordinates);
}

export function isValidMultiPolygon(value: unknown): value is GeoJsonMultiPolygon {
  if (!isGeoJsonObject(value) || value.type !== "MultiPolygon" || !Array.isArray(value.coordinates)) {
    return false;
  }

  return value.coordinates.length > 0 && value.coordinates.every(isValidPolygonCoordinates);
}

export function isValidServiceAreaGeoJson(value: unknown): value is ServiceAreaGeoJson {
  return isValidPolygon(value) || isValidMultiPolygon(value);
}

function isGeoJsonObject(value: unknown): value is { type?: unknown; coordinates?: unknown } {
  return typeof value === "object" && value !== null;
}

function isValidPolygonCoordinates(coordinates: unknown): coordinates is GeoJsonPosition[][] {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return false;
  }

  return coordinates.every((ring) => {
    if (!Array.isArray(ring) || ring.length < 4) {
      return false;
    }

    const [first] = ring;
    const last = ring[ring.length - 1];
    return ring.every(isValidPosition) && positionsEqual(first, last);
  });
}

function positionsEqual(left: unknown, right: unknown): boolean {
  return isValidPosition(left) && isValidPosition(right) && left[0] === right[0] && left[1] === right[1];
}

