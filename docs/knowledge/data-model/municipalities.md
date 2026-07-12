---
type: data-model-knowledge
title: Amtliche Gemeinden und Tätigkeitsgebiete
description: Kanonischer Gemeinde- und Tätigkeitsgebietsvertrag für den Pilotcluster.
tags:
  - data-model
  - municipalities
  - service-areas
  - vg250
timestamp: 2026-07-12
status: active
owner: Andi
---

# Amtliche Gemeinden und Tätigkeitsgebiete

## Kanonischer Katalog

Der Pilotkatalog wird aus dem amtlichen BKG-Datensatz VG250, Stand 01.01.2025, erzeugt. Die stabile
technische Identität ist der achtstellige amtliche Gemeindeschlüssel (`AGS`). Namen, Landkreis- und
Bundeslandzuordnung werden aus demselben Datensatz übernommen. Namen oder PLZ sind keine technischen
IDs.

Die versionierte Manifestdatei `data/municipality-pilot.json` und die lokale Webgeometrie
`public/geo/municipality-pilot.geojson` werden mit `scripts/import-vg250.mjs` aus derselben Quelle
erzeugt. Der Datenstand, die Rohdaten-Prüfsumme, die Geometrie-Prüfsumme, die Transformation und die
Lizenz stehen im Manifest. Die Datenbank-Seeds sind daraus abgeleitete Artefakte und keine zweite
manuell gepflegte Gemeindeliste.

Die bestehende Tabelle `regions` bleibt der Kontext für Regional-Coverage-Agent und Snapshots. Sie
ist wegen ihrer freien Regions-/PLZ-Logik nicht die technische Quelle für exakte Gemeindeauswahl;
`municipalities` ist dafür der einzige AGS-basierte Katalog.

Der erste Cluster umfasst sieben amtliche Kreise in Bayern und 180 Gemeinden bzw. Städte. 11 im
VG250 enthaltene gemeindefreie Gebiete (zum Beispiel Forste, Parks oder Seen) werden anhand des
amtlichen `BEZ`-Typs ausdrücklich nicht als auswählbare Gemeinden übernommen. Die sieben Kreise
sind:

- kreisfreie Stadt Rosenheim (`09163`)
- Landkreis Rosenheim (`09187`)
- Landkreis Miesbach (`09182`)
- Landkreis München (`09184`)
- Landkreis Ebersberg (`09175`)
- Landkreis Mühldorf a.Inn (`09183`)
- Landkreis Traunstein (`09189`)

Der österreichische Bezirk Kufstein ist ausdrücklich eine spätere grenzüberschreitende Erweiterung
und nicht Bestandteil dieses Katalogs.

## Tätigkeitsgebiete

Im ersten Slice speichert eine Einreichung die ausdrücklich ausgewählten AGS in
`company_submissions.municipality_codes`. Der additive Trigger materialisiert dieselbe Auswahl in
`company_submission_service_areas` mit `submitted`-Status. Für spätere freigegebene Betriebe ist
`company_service_areas` die normalisierte Zuordnung mit Status und Freigabezeitpunkt.

Nur `approved`-Zuordnungen dürfen in Slice 2 exakte Gemeindesuche oder öffentliche Profile speisen.
Sitz, Radius, PLZ-Nähe, freie Regionsangaben und Nachbargemeinden erzeugen keine exakte
Gemeindezuordnung. Bestehende Radius-, Regions- und PLZ-Felder bleiben für Rückwärtskompatibilität
erhalten.

## Quelle und Lizenz

Öffentliche Kartendarstellungen verwenden den sichtbaren Quellenvermerk:

`© BKG (2025) dl-de/by-2-0 (Daten verändert), Datenquellen: https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf`

Die Links auf BKG und Datenlizenz Deutschland – Namensnennung 2.0 werden in der Auswahloberfläche
angezeigt. Die Geometrie ist für verständliche Auswahlkarten vereinfacht und keine katastergenaue
Grenzauskunft.
