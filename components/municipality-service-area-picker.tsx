"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  municipalityDataSourcesUrl,
  municipalityDataAsOfLabel,
  municipalitySourceUrl,
  type PilotCounty,
  type PilotMunicipality,
} from "@/lib/municipality-catalog";

type GeoFeature = {
  id?: string;
  properties: {
    ags: string;
    name: string;
    slug: string;
    countyCode: string;
    countyName: string;
    stateCode: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
};

type GeoJson = {
  features: GeoFeature[];
};

export function MunicipalityServiceAreaPicker({
  counties,
  municipalities,
  selectedCodes = [],
  error,
}: {
  counties: PilotCounty[];
  municipalities: PilotMunicipality[];
  selectedCodes?: string[];
  error?: string;
}) {
  const selectedCodesKey = selectedCodes.join("|");
  const municipalityKey = municipalities.map((municipality) => `${municipality.ags}:${municipality.selectionEnabled}`).join("|");
  const selectionSourceKey = `${selectedCodesKey}::${municipalityKey}`;
  const validSelectedCodes = useMemo(
    () => selectedCodes.filter((ags) => municipalities.some((municipality) => municipality.ags === ags && municipality.selectionEnabled)),
    [municipalities, selectedCodes],
  );
  const [selected, setSelected] = useState(() => new Set(validSelectedCodes));
  const lastSyncedSelectionKey = useRef(selectionSourceKey);
  const [query, setQuery] = useState("");
  const [countyCode, setCountyCode] = useState("");
  const [geoJson, setGeoJson] = useState<GeoJson | null>(null);
  const [mapError, setMapError] = useState(false);
  const selectableAgs = useMemo(
    () => new Set(municipalities.filter((municipality) => municipality.selectionEnabled).map((municipality) => municipality.ags)),
    [municipalities],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/geo/municipality-pilot.geojson", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Gemeindekarte konnte nicht geladen werden.");
        const value: unknown = await response.json();
        if (!isGeoJson(value)) throw new Error("Gemeindekarte enthält keine gültigen auswählbaren Gemeinden.");
        return value;
      })
      .then(setGeoJson)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setMapError(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (lastSyncedSelectionKey.current === selectionSourceKey) return;
    setSelected(new Set(validSelectedCodes));
    lastSyncedSelectionKey.current = selectionSourceKey;
  }, [selectionSourceKey, validSelectedCodes]);

  const selectedMunicipalities = municipalities.filter((municipality) => selected.has(municipality.ags));
  const filteredMunicipalities = municipalities.filter((municipality) => {
    if (!municipality.selectionEnabled) return false;
    const matchesCounty = !countyCode || municipality.countyCode === countyCode;
    const normalizedQuery = query.trim().toLocaleLowerCase("de-DE");
    const matchesQuery = !normalizedQuery || municipality.name.toLocaleLowerCase("de-DE").includes(normalizedQuery);
    return matchesCounty && matchesQuery;
  });
  const map = useMemo(
    () => createMapModel((geoJson?.features || []).filter((feature) => selectableAgs.has(feature.properties.ags))),
    [geoJson, selectableAgs],
  );

  function toggleMunicipality(ags: string) {
    if (!selectableAgs.has(ags)) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(ags)) next.delete(ags);
      else next.add(ags);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-[#fbfcff] p-4">
      <div>
        <h3 className="text-lg font-semibold text-brand">Tätigkeitsgemeinden im Pilotgebiet</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          Wählen Sie nur Gemeinden aus, in denen Ihr Betrieb tatsächlich tätig werden möchte. Eine Auswahl wird erst nach Prüfung wirksam.
          Radius, PLZ und freie Regionsangaben bleiben zusätzlich erhalten, erzeugen aber keinen exakten Gemeindetreffer.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-normal text-muted">Gemeinde suchen</span>
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action focus:ring-2 focus:ring-action/20"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="z. B. Riedering"
            value={query}
            aria-describedby={error ? "municipality-codes-error" : undefined}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-normal text-muted">Landkreis filtern</span>
          <select
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action focus:ring-2 focus:ring-action/20"
            onChange={(event) => setCountyCode(event.target.value)}
            value={countyCode}
            aria-describedby={error ? "municipality-codes-error" : undefined}
          >
            <option value="">Alle Pilotkreise</option>
            {counties.map((county) => (
              <option key={county.code} value={county.code}>
                {county.kind} {county.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="min-h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-action hover:border-action disabled:cursor-not-allowed disabled:opacity-50"
          disabled={selected.size === 0}
          onClick={clearSelection}
          type="button"
        >
          Auswahl zurücksetzen
        </button>
      </div>

      <p aria-live="polite" className="text-sm font-semibold text-brand">
        {selected.size} {selected.size === 1 ? "Gemeinde" : "Gemeinden"} ausgewählt
      </p>
      {error ? <p className="rounded-md border border-[#e6b8aa] bg-[#fff6f3] px-3 py-2 text-sm font-semibold text-[#8b351f]" id="municipality-codes-error" role="alert">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.85fr)]">
        <div className="rounded-md border border-line bg-white" id="municipality-list">
          <div className="border-b border-line bg-panel px-4 py-3 text-sm font-semibold text-brand">Gemeindeliste – vollständig bedienbar</div>
          <div className="max-h-[440px] overflow-y-auto p-3">
            <div className="grid gap-2">
              <p aria-live="polite" className="mb-2 px-2 text-xs text-muted">
                {filteredMunicipalities.length} {filteredMunicipalities.length === 1 ? "Gemeinde" : "Gemeinden"} angezeigt
              </p>
              {filteredMunicipalities.map((municipality) => {
                const isSelected = selected.has(municipality.ags);
                return (
                  <button
                    aria-describedby={error ? "municipality-codes-error" : undefined}
                    aria-pressed={isSelected}
                    className={isSelected ? "rounded-md border border-[#6da98e] bg-[#eef9f2] px-3 py-2 text-left text-sm text-[#174d38]" : "rounded-md border border-line bg-white px-3 py-2 text-left text-sm text-ink hover:border-action"}
                    key={municipality.ags}
                    onClick={() => toggleMunicipality(municipality.ags)}
                    type="button"
                  >
                    <span className="block font-semibold">{municipality.name}</span>
                    <span className="block text-xs text-muted">{municipality.countyName} · AGS {municipality.ags}{isSelected ? " · ausgewählt" : ""}</span>
                  </button>
                );
              })}
              {filteredMunicipalities.length === 0 ? <p className="px-2 py-6 text-center text-sm text-muted">Keine Pilotgemeinde gefunden.</p> : null}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-line bg-white">
          <div className="border-b border-line bg-panel px-4 py-3 text-sm font-semibold text-brand">Gemeindekarte</div>
          <div className="p-3">
            {geoJson && map.features.length ? (
              <svg
                aria-label="Karte der auswählbaren Gemeinden im Pilotgebiet"
                className="h-auto min-h-[300px] w-full rounded-md bg-[#edf4f1]"
                role="img"
                viewBox={`0 0 ${map.width} ${map.height}`}
              >
                {map.features.map((feature) => {
                  const isSelected = selected.has(feature.ags);
                  return (
                    <path
                      aria-label={`${feature.name}, ${feature.countyName}${isSelected ? ", ausgewählt" : ", nicht ausgewählt"}`}
                      aria-describedby={error ? "municipality-codes-error" : undefined}
                      aria-pressed={isSelected}
                      className={isSelected ? "cursor-pointer fill-[#2f8f5b] stroke-[#123d31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action" : "cursor-pointer fill-white stroke-[#6b8e82] hover:fill-[#d6eee2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"}
                      d={feature.path}
                      key={feature.ags}
                      onClick={() => toggleMunicipality(feature.ags)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleMunicipality(feature.ags);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="flex min-h-[300px] items-center justify-center rounded-md border border-dashed border-line px-6 text-center text-sm leading-6 text-muted">
                {mapError ? "Die lokale Karte ist gerade nicht verfügbar. Verwenden Sie bitte die zugängliche Gemeindeliste." : "Gemeindekarte wird geladen …"}
              </div>
            )}
          </div>
          <p className="border-t border-line px-4 py-3 text-xs leading-5 text-muted">
            Karte: vereinfachte, lokal ausgelieferte Geometrien aus <a className="font-semibold text-action underline" href={municipalitySourceUrl} rel="noreferrer" target="_blank">BKG VG250</a>, Stand {municipalityDataAsOfLabel}. <a className="font-semibold text-action underline" href="https://www.bkg.bund.de" rel="noreferrer" target="_blank">© BKG</a> (<a className="font-semibold text-action underline" href="https://www.govdata.de/dl-de/by-2-0" rel="noreferrer" target="_blank">dl-de/by-2-0</a>, Daten verändert; <a className="font-semibold text-action underline" href={municipalityDataSourcesUrl} rel="noreferrer" target="_blank">Datenquellen</a>).
          </p>
        </div>

      </div>

      {selectedMunicipalities.length ? (
        <div className="rounded-md border border-[#b9dec8] bg-[#eef9f2] p-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#24523a]">Ihre Auswahl</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedMunicipalities.map((municipality) => (
              <span className="inline-flex items-center gap-2 rounded-md border border-[#9bc8ad] bg-white px-3 py-1 text-sm text-[#174d38]" key={municipality.ags}>
                {municipality.name} ({municipality.countyName})
                <button aria-label={`${municipality.name} entfernen`} className="font-bold text-[#24523a] hover:text-[#8b351f]" onClick={() => toggleMunicipality(municipality.ags)} type="button">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {Array.from(selected).map((ags) => <input key={ags} name="municipalityCodes" type="hidden" value={ags} />)}
    </div>
  );
}

function createMapModel(features: GeoFeature[]) {
  const coordinates = features.flatMap((feature) => collectCoordinates(feature.geometry.coordinates));
  if (!coordinates.length) return { width: 1000, height: 700, features: [] };
  const minLongitude = Math.min(...coordinates.map(([longitude]) => longitude));
  const maxLongitude = Math.max(...coordinates.map(([longitude]) => longitude));
  const minLatitude = Math.min(...coordinates.map(([, latitude]) => latitude));
  const maxLatitude = Math.max(...coordinates.map(([, latitude]) => latitude));
  const width = 1000;
  const height = 700;
  const longitudeRange = Math.max(maxLongitude - minLongitude, 0.01);
  const latitudeRange = Math.max(maxLatitude - minLatitude, 0.01);
  const scale = Math.min((width - 24) / longitudeRange, (height - 24) / latitudeRange);
  const project = ([longitude, latitude]: Coordinate) => [12 + (longitude - minLongitude) * scale, height - 12 - (latitude - minLatitude) * scale] as const;
  return {
    width,
    height,
    features: features.map((feature) => ({
      ags: feature.properties.ags,
      name: feature.properties.name,
      countyName: feature.properties.countyName,
      path: geometryPath(feature.geometry, project),
    })),
  };
}

function isGeoJson(value: unknown): value is GeoJson {
  return isRecord(value) && Array.isArray(value.features) && value.features.length > 0 && value.features.every(isGeoFeature);
}

function isGeoFeature(value: unknown): value is GeoFeature {
  if (!isRecord(value) || !isRecord(value.properties) || !isRecord(value.geometry)) return false;
  const properties = value.properties;
  const geometry = value.geometry;
  return (
    (value.id === undefined || typeof value.id === "string") &&
    typeof properties.ags === "string" &&
    typeof properties.name === "string" &&
    typeof properties.slug === "string" &&
    typeof properties.countyCode === "string" &&
    typeof properties.countyName === "string" &&
    typeof properties.stateCode === "string" &&
    ((geometry.type === "Polygon" && isPolygonCoordinates(geometry.coordinates)) ||
      (geometry.type === "MultiPolygon" && isMultiPolygonCoordinates(geometry.coordinates)))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCoordinate(value: unknown): value is Coordinate {
  return Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && Number.isFinite(value[0]) && typeof value[1] === "number" && Number.isFinite(value[1]);
}

function isRing(value: unknown): value is Coordinate[] {
  return Array.isArray(value) && value.length >= 4 && value.every(isCoordinate);
}

function isPolygonCoordinates(value: unknown): value is Coordinate[][] {
  return Array.isArray(value) && value.length > 0 && value.every(isRing);
}

function isMultiPolygonCoordinates(value: unknown): value is Coordinate[][][] {
  return Array.isArray(value) && value.length > 0 && value.every(isPolygonCoordinates);
}

type Coordinate = [number, number];

function collectCoordinates(value: unknown): Coordinate[] {
  if (!Array.isArray(value)) return [];
  if (typeof value[0] === "number" && typeof value[1] === "number") return [[value[0], value[1]]];
  return value.flatMap(collectCoordinates);
}

function geometryPath(geometry: GeoFeature["geometry"], project: (coordinate: Coordinate) => readonly [number, number]) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return (polygons as unknown[]).flatMap((polygon) => (polygon as unknown[]).map((ring) => ringPath(ring as Coordinate[], project))).join(" ");
}

function ringPath(ring: Coordinate[], project: (coordinate: Coordinate) => readonly [number, number]) {
  return ring
    .map((coordinate, index) => {
      const [x, y] = project(coordinate);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}
