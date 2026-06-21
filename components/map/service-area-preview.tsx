import type { ServiceAreaGeoJson, ServiceAreaStatus, ServiceAreaType } from "@/lib/geo/types";
import { isValidServiceAreaGeoJson } from "@/lib/geo/geojson";

type ServiceAreaPreviewProps = {
  label: string;
  type: ServiceAreaType;
  status: ServiceAreaStatus;
  geojson?: ServiceAreaGeoJson;
  radiusKm?: number;
  postalCodes?: string[];
  regionNames?: string[];
  className?: string;
};

const statusLabels: Record<ServiceAreaStatus, string> = {
  draft: "Entwurf",
  review: "In Pruefung",
  approved: "Bestaetigt",
  rejected: "Abgelehnt",
};

const typeLabels: Record<ServiceAreaType, string> = {
  radius: "Radius",
  region: "Region",
  postal_codes: "PLZ-Bereich",
  polygon: "Flaeche",
  manual_drawn: "Gezeichnete Flaeche",
};

const rosenheimMapSrc =
  "https://www.openstreetmap.org/export/embed.html?bbox=12.006%2C47.666%2C12.569%2C48.004&layer=mapnik&marker=47.856%2C12.129";

export function ServiceAreaPreview({
  label,
  type,
  status,
  geojson,
  radiusKm,
  postalCodes = [],
  regionNames = [],
  className = "",
}: ServiceAreaPreviewProps) {
  const validGeoJson = geojson && isValidServiceAreaGeoJson(geojson);
  const areaShapeLabel = validGeoJson ? "Polygon / Wirkungskreis" : "Wirkungskreis";
  const metaItems = [
    typeLabels[type],
    radiusKm ? `${radiusKm} km` : null,
    postalCodes.length ? postalCodes.slice(0, 4).join(", ") : null,
    regionNames.length ? regionNames.slice(0, 3).join(", ") : null,
  ].filter(Boolean);

  return (
    <section className={`overflow-hidden rounded-lg border border-line bg-white shadow-soft ${className}`}>
      <div className="relative h-[360px] bg-[#eef4fb] sm:h-[420px]">
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={rosenheimMapSrc}
          title="Interaktive Karte Rosenheim und Chiemgau mit Beispiel-Wirkungskreis"
        />

        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-[39%] top-[28%] h-[220px] w-[300px] -translate-x-1/2 rounded-[46%] border-2 border-[#1f5fd4] bg-[#1f5fd4]/15 shadow-[0_0_0_10px_rgba(31,95,212,0.08)] sm:h-[250px] sm:w-[350px]" />
          <div className="absolute left-[39%] top-[48%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-[#1f5fd4] shadow-lg" />
          <div className="absolute left-[39%] top-[48%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1f5fd4] bg-[#1f5fd4]/15" />
        </div>

        <div className="absolute left-4 top-4 rounded-md border border-line bg-white/95 px-3 py-2 text-xs font-semibold text-brand shadow-soft">
          Interaktive Kartenansicht
        </div>
        <div className="absolute bottom-4 left-4 right-4 rounded-md border border-line bg-white/95 p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#07173d]">Beispielbetrieb Ausbau</h3>
              <p className="mt-1 text-xs text-muted">{label}</p>
              <p className="mt-1 text-xs text-muted">{[areaShapeLabel, ...metaItems].join(" / ")}</p>
            </div>
            <span className="rounded-md border border-[#b9dec8] bg-[#eef9f2] px-3 py-1 text-xs font-semibold text-brand">
              {statusLabels[status]}
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">Demo-Daten - keine echte Veröffentlichung.</p>
        </div>
      </div>
      <p className="border-t border-line px-4 py-3 text-xs leading-5 text-muted">
        Karte: © OpenStreetMap-Mitwirkende. Karten- und Wirkungskreisfunktionen werden schrittweise ausgebaut; keine
        Qualitäts- oder Verfügbarkeitsgarantie.
      </p>
    </section>
  );
}
