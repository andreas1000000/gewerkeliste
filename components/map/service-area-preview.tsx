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
  const metaItems = [
    typeLabels[type],
    radiusKm ? `${radiusKm} km` : null,
    postalCodes.length ? postalCodes.slice(0, 4).join(", ") : null,
    regionNames.length ? regionNames.slice(0, 3).join(", ") : null,
  ].filter(Boolean);

  return (
    <section className={`overflow-hidden rounded-lg border border-line bg-white shadow-soft ${className}`}>
      <div className="relative h-64 bg-[#eef4fb]">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 600 320">
          <rect fill="#eef4fb" height="320" width="600" />
          <path d="M0 80 H600 M0 160 H600 M0 240 H600 M120 0 V320 M240 0 V320 M360 0 V320 M480 0 V320" fill="none" stroke="#cbd7e5" strokeWidth="1" />
          <path d="M70 238 C140 170 195 208 260 132 C330 52 430 74 518 136" fill="none" stroke="#9fb4cf" strokeDasharray="8 8" strokeWidth="3" />
          {validGeoJson ? (
            <path
              d="M116 210 L174 104 L274 74 L398 96 L492 180 L430 254 L270 270 Z"
              fill="rgba(31,95,212,0.18)"
              stroke="#1f5fd4"
              strokeWidth="3"
            />
          ) : (
            <circle cx="300" cy="170" fill="rgba(31,95,212,0.16)" r={radiusKm ? 112 : 82} stroke="#1f5fd4" strokeWidth="3" />
          )}
          <circle cx="300" cy="170" fill="#1f5fd4" r="10" />
          <circle cx="300" cy="170" fill="none" r="20" stroke="rgba(31,95,212,0.28)" strokeWidth="8" />
        </svg>

        <div className="absolute left-4 top-4 rounded-md border border-line bg-white/95 px-3 py-2 text-xs font-semibold text-brand shadow-soft">
          Wirkungskreis-Preview
        </div>
        <div className="absolute bottom-4 left-4 right-4 rounded-md border border-line bg-white/95 p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#07173d]">{label}</h3>
              <p className="mt-1 text-xs text-muted">{metaItems.join(" / ") || "Keine Details angegeben"}</p>
            </div>
            <span className="rounded-md border border-[#b9dec8] bg-[#eef9f2] px-3 py-1 text-xs font-semibold text-brand">
              {statusLabels[status]}
            </span>
          </div>
        </div>
      </div>
      <p className="border-t border-line px-4 py-3 text-xs leading-5 text-muted">
        Diese Vorschau nutzt keine externen Kartenkacheln. Sie ist nur eine interne Darstellung fuer spaetere
        Wirkungskreis-Reviews.
      </p>
    </section>
  );
}
