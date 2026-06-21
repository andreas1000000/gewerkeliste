import type { ServiceAreaGeoJson, ServiceAreaStatus, ServiceAreaType } from "@/lib/geo/types";

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

const rosenheimMapSrc = "https://www.openstreetmap.org/export/embed.html?bbox=12.006%2C47.666%2C12.569%2C48.004&layer=mapnik";

export function ServiceAreaPreview({
  className = "",
}: ServiceAreaPreviewProps) {
  return (
    <section className={`overflow-hidden rounded-lg border border-line bg-white shadow-soft ${className}`}>
      <div className="relative h-[360px] bg-[#eef4fb] sm:h-[420px]">
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={rosenheimMapSrc}
          title="Interaktive Karte Rosenheim und Chiemgau"
        />
      </div>
      <p className="border-t border-line px-4 py-3 text-xs leading-5 text-muted">
        Karte: © OpenStreetMap-Mitwirkende. Karten- und Wirkungskreisfunktionen werden schrittweise ausgebaut.
      </p>
    </section>
  );
}
