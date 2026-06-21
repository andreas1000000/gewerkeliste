# Wirkungskreis- und Kartenstrategie

Status: technische Vorbereitung, keine Live-Funktion

Diese Datei ist eine Produkt- und Technikleitplanke fuer die kuenftige Karten-/Wirkungskreis-Funktion von GewerkeListe.com. Sie ist zusammen mit `BUSINESSPLAN_GEWERKELISTE_V2.md`, `GEWERKELISTE_PRODUCT_DOCTRINE.md`, `AGENTS.md` und `AGENT_OPERATING_RULES.md` zu beruecksichtigen.

## Zielbild

GewerkeListe.com soll perspektivisch nicht nur Firmenstandorte zeigen, sondern den tatsaechlichen Wirkungskreis eines Betriebs sichtbar machen:

- Firmenstandorte als Punkte
- Wirkungskreise als Regionen, PLZ-Bereiche, Landkreise, Korridore, Radien oder Polygone
- Suche nach Gewerk, Ort, Region und Einsatzgebiet
- spaeter: Betriebsinhaber koennen ihren Wirkungskreis mit einem Zeichenwerkzeug markieren

Der Wirkungskreis ist kein Qualitaetsversprechen und keine Verfuegbarkeitsgarantie. Er beschreibt nur, in welchem Gebiet ein Betrieb nach eigener Angabe, nach bestaetigten Daten oder nach nachvollziehbaren Quellen taetig ist.

## Aktueller Bestand im Code

### companies

Vorhanden:

- `latitude`
- `longitude`
- Index `companies_location_idx` auf `(latitude, longitude)`
- spaeter in einer lokalen/dirty Planner-Migration vorbereitet: `geocode_source`, `geocode_quality`, `geocoded_at`

Fehlt:

- `geocoded_address`
- `geocoding_provider`
- `geocoding_confidence`
- echte Distanz-/Umkreissuche
- Wirkungskreis als eigene Struktur

### research_company_candidates

Vorhanden:

- `latitude`
- `longitude`
- Range-Checks fuer Koordinaten

Fehlt:

- Kandidaten-Wirkungskreise
- Geocoding-Metadaten

### company_candidates

Vorhanden:

- Stadt, PLZ, Strasse
- Status, Confidence Scores, Quelle, Evidence

Fehlt:

- `latitude`
- `longitude`
- Kandidaten-Wirkungskreise

### regions

Vorhanden:

- `latitude`
- `longitude`
- `postal_codes`
- `municipality`, `county`, `state`, `country`

Fehlt:

- Region-Geometrie
- Polygon/Boundary
- PostGIS-Geom

### PostGIS

Im aktuellen Migrationsbestand ist kein `postgis`-Extension-Setup erkennbar. Vorhanden ist `pgcrypto`.

### Karten-/Geocoding-Code

Vorhanden:

- OSM-Research-Skript mit Koordinaten aus OSM-Daten
- Research-/Import-Skripte mit lat/lng-Feldern
- keine produktive Kartenkomponente
- keine MapLibre-/Mapbox-/Leaflet-Abhaengigkeit in `package.json`
- kein produktiver Geocoding-Provider

## Datenmodell-Vorschlag

### companies erweitern

Spaeter per reviewter Migration:

```sql
alter table companies add column if not exists geocoded_address text;
alter table companies add column if not exists geocoding_provider text;
alter table companies add column if not exists geocoding_confidence integer check (geocoding_confidence is null or geocoding_confidence between 0 and 100);
alter table companies add column if not exists geocoded_at timestamptz;
```

Hinweis: `latitude` und `longitude` sind bereits vorhanden. Die bestehenden Pflichtfelder sollten erst nach Datenqualitaetspruefung gelockert oder migriert werden.

### company_service_areas

Zentrale Tabelle fuer Wirkungskreise:

```sql
create table company_service_areas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  type text not null check (type in ('radius', 'region', 'postal_codes', 'polygon', 'manual_drawn')),
  label text not null,
  geojson jsonb,
  postal_codes text[] not null default '{}',
  region_ids uuid[] not null default '{}',
  radius_km numeric(8,2),
  source text not null check (source in ('company_claim', 'admin', 'agent', 'imported')),
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'rejected')),
  confidence_score integer check (confidence_score is null or confidence_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Ohne PostGIS ist `geojson jsonb` der sichere erste Schritt. Mit PostGIS kann spaeter ergaenzt werden:

```sql
alter table company_service_areas add column if not exists geom geometry(MultiPolygon, 4326);
create index if not exists company_service_areas_geom_idx on company_service_areas using gist (geom);
```

### company_candidate_service_areas

Optional fuer Kandidaten vor der Veroeffentlichung:

- `candidate_id`
- gleiche Struktur wie `company_service_areas`
- Status immer `draft`, `review` oder `rejected`
- keine automatische Veroeffentlichung

## Suchlogik

Ein Betrieb passt zu einer Suche, wenn mindestens eine Bedingung erfuellt ist:

1. Standort liegt im Suchgebiet.
2. Wirkungskreis schneidet das Suchgebiet.
3. PLZ, Landkreis oder Region passt.
4. Spaeter: Wirkungskreis-Polygon enthaelt den Suchpunkt.

Ranking:

1. Betrieb hat bestaetigten Wirkungskreis.
2. Betrieb hat bestaetigte Region oder PLZ.
3. Betrieb sitzt nahe am Suchort.
4. Betrieb hat passende Gewerke und Leistungen.
5. Betriebsdaten sind bestaetigt oder uebernommen.

Wichtig: Radius ist nur ein Fallback. Der Zielzustand ist ein tatsaechlicher Wirkungskreis aus Regionen, PLZ-Bereichen, Landkreisen, Verkehrsachsen und spaeter frei gezeichneten Flaechen.

## Kartenanbieter-Bewertung

| Option | Kostenrisiko | Lock-in | Polygon-Zeichnen | DACH-Qualitaet | Next.js-Integration | Bewertung |
| --- | --- | --- | --- | --- | --- | --- |
| MapLibre + OSM/Tile Provider | niedrig bis mittel, je nach Tile Provider | niedrig | ueber MapLibre Draw / eigene Controls moeglich | gut, abhaengig vom Tile Provider | gut, client-only Komponente noetig | beste offene Grundlage fuer GewerkeListe |
| Mapbox GL JS + Mapbox Draw | mittel, nutzungsabhaengig | mittel bis hoch | sehr gut | gut | gut, aber Token/Kosten noetig | stark fuer UX, aber Kosten-/Lock-in-Gate erforderlich |
| Google Maps | mittel bis hoch | hoch | moeglich, aber API-/Billing-nah | sehr gut | gut | sinnvoll fuer serverseitiges Geocoding, aber nicht als erster Kartenstandard |

Empfehlung:

- Darstellung und spaeter Polygon-Zeichnen: MapLibre-kompatible Architektur vorbereiten.
- Speicherung: GeoJSON zuerst, PostGIS spaeter fuer performante Schnitt-/Contains-Abfragen.
- Geocoding: serverseitig, streng gegated, keine Massenlaeufe ohne Freigabe; Google Geocoding kann spaeter wegen Adressqualitaet geprueft werden.
- Bis zur Kosten-/Datenschutzfreigabe keine externen Kartenkacheln produktiv einbauen.

## UI-Konzept

### Oeffentliche Suche

- Ergebnisliste und Karte nebeneinander auf Desktop
- Liste zuerst auf Mobile
- Firmenstandorte als Punkte
- Wirkungskreise optional als transparente Flaechen
- Filter:
  - Gewerk
  - Ort/PLZ
  - Umkreis
  - Wirkungskreis beruecksichtigen
  - Daten bestaetigt / uebernommen
  - spaeter Verfuegbarkeit

### Firmenprofil

- Standortkarte
- Wirkungskreis anzeigen, falls vorhanden
- Hinweis bei bestaetigtem Wirkungskreis:
  - "Einsatzgebiet vom Betrieb angegeben oder bestaetigt."
- Hinweis bei abgeleitetem Wirkungskreis:
  - "Wirkungskreis aus oeffentlichen Quellen abgeleitet und noch nicht bestaetigt."
- Hinweis bei unbestaetigtem Eintrag:
  - "Wirkungskreis noch nicht vom Betrieb bestaetigt."

### Claim-/Betriebsbereich

Betriebe sollen spaeter ihren Wirkungskreis erfassen koennen:

1. PLZ oder Landkreis auswaehlen
2. Radius grob setzen
3. spaeter Flaeche auf Karte zeichnen

Zeichenwerkzeug:

- Polygon zeichnen
- Punkte verschieben
- Flaeche loeschen
- Flaeche speichern

Status:

- `draft`
- `review`
- `approved`
- `rejected`

Gezeichnete Bereiche werden nicht automatisch live veroeffentlicht. Sie gehen in Review/Approval.

## Sicherer erster technischer Slice

Bereits mit diesem Commit vorbereitet:

- Strategie-Dokumentation
- Geo-/Wirkungskreis-Typen
- GeoJSON-Validierung ohne externe Abhaengigkeiten

Noch nicht gebaut:

- keine Map-Library
- keine Kartenkacheln
- keine Migration
- keine PostGIS-Aktivierung
- kein Geocoding
- kein Massenlauf
- keine Live-Veroeffentlichung

## Sicherheits- und Freigaberegeln

Nicht ohne explizite Freigabe:

- Google API Calls
- Mapbox API Calls
- externe Kartenkosten
- Production-Migration
- Massen-Geocoding
- automatische Veroeffentlichung von Wirkungskreisen
- Aussage "tatsaechlich verfuegbar" ohne belastbare Daten
- Live-Kartenfeature ohne Datenschutz-/Kostenpruefung

Jede spaetere Aktion mit Kosten, externer API, personenbezogenen Daten, Veroeffentlichung oder Massenverarbeitung braucht ein Approval-Gate.

