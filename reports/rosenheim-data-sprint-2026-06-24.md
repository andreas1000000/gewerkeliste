# Landkreis Rosenheim Datenaufbau-Sprint

Status: `review_only`  
Datum: 2026-06-24  
Quelle erster Lauf: OpenStreetMap via Overpass API  
Lizenzhinweis Quelle: OpenStreetMap-Daten stehen unter ODbL.  
Produktstatus: Kandidaten sind nicht veröffentlicht, nicht verifiziert und nicht beansprucht.

## Kurzfazit

- 207 bau- und handwerksnahe Kandidaten erzeugt.
- 166 Kandidaten sind als `ready_for_import=true` markiert.
- 41 Kandidaten bleiben `needs_review=true`.
- 36 Orte/Ortseinträge sind im Datensatz vertreten.
- 25 Gewerke-/Leistungs-Slugs sind abgedeckt.
- 123 Kandidaten haben eine Website.
- 124 Kandidaten haben eine grobe Adresse.
- Keine E-Mails, keine Veröffentlichungen, keine Production-Aktionen.

## Erzeugte Dateien

- `data/import/osm-rosenheim-raw.json`
- `data/import/rosenheim-company-candidates.json`
- `data/import/rosenheim-company-candidates.csv`
- `data/import/build-rosenheim-dataset.mjs`
- `reports/rosenheim-data-sprint-2026-06-24.md`

## Datenlogik

Der Lauf nutzt OSM/Overpass als Hinweisquelle. Es wurden nur Kandidaten aufgenommen, wenn ein baunahes Signal vorhanden war:

- `craft=*` mit baunaher Einordnung, zum Beispiel `carpenter`, `plumber`, `electrician`, `painter`, `roofer`, `tiler`, `stonemason`, `builder`.
- Bau- und handwerksnahe Begriffe in Name, Beschreibung, Website oder Service-Feld.
- Nicht baunahe Tags und offensichtliche Retail-/Gastro-/Kfz-/Bäckerei-/Friseur-Treffer wurden herausgefiltert.

Jeder Kandidat bleibt:

- `verified=false`
- `claim_status=unclaimed`
- `status=review`

## Quellen und Compliance

- Google Maps Scraping: nein
- E-Mails gesendet: nein
- Production-Aktionen: nein
- Kostenpflichtige APIs: nein
- Kosten: 0 EUR
- Quelle kopiert als Volltext: nein
- Bilder/Logos übernommen: nein
- Bewertungen übernommen: nein

Hinweis: Für eine spätere öffentliche Nutzung oder Anzeige muss die ODbL-Attribution sauber berücksichtigt werden. Vor Veröffentlichung sollten High-Confidence-Kandidaten über offizielle Firmenwebsite/Impressum oder andere Primärquelle gegengeprüft werden.

## Coverage nach Ort

| Ort | Kandidaten |
| --- | ---: |
| ohne Ort | 65 |
| Bad Aibling | 28 |
| Bruckmühl | 23 |
| Bad Feilnbach | 8 |
| Kolbermoor | 7 |
| Aschau im Chiemgau | 5 |
| Griesstätt | 5 |
| Rott am Inn | 5 |
| Wasserburg am Inn | 5 |
| Eggstätt | 4 |
| Frasdorf | 4 |
| Prien am Chiemsee | 4 |
| Rimsting | 4 |
| Bad Endorf | 4 |
| Großkarolinenfeld | 3 |
| Tuntenhausen | 3 |
| Rohrdorf | 3 |
| Vogtareuth | 3 |
| Edling | 2 |
| Soyen | 2 |
| Feldkirchen-Westerham | 2 |
| Raubling | 2 |
| Stephanskirchen | 2 |

Weitere Orte mit je 1 Kandidat: Alteiselfing, Brannenburg, Halfing, Oberaudorf, Pfaffing, Prutting, Riedering, Schonstett, Söchtenau, Bernau am Chiemsee, Amerang, Eiselfing, Niedermoosen, Schechen.

## Coverage nach Gewerk

| Gewerk | Kandidaten |
| --- | ---: |
| schreinerarbeiten | 71 |
| zimmererarbeiten | 41 |
| innenausbau | 26 |
| metallbau | 25 |
| heizungsbau | 25 |
| malerarbeiten | 17 |
| sanitaerinstallation | 17 |
| fenster-tueren | 14 |
| bauunternehmen | 12 |
| elektroinstallation | 12 |
| holzbau | 9 |
| lueftung | 9 |
| natursteinarbeiten | 7 |
| garten-und-landschaftsbau | 7 |
| dachdeckerarbeiten | 5 |
| bodenlegerarbeiten | 4 |
| spenglerarbeiten | 4 |
| fliesenlegerarbeiten | 4 |
| sonnenschutz | 2 |
| kaelte-klima | 2 |
| ofenbau | 2 |
| bauwerksabdichtung | 1 |
| pflasterbau | 1 |
| tiefbau | 1 |
| geruestbau | 1 |

## Top 20 Beispielkandidaten

| Name | Ort | Gewerk | Score | Website |
| --- | --- | --- | ---: | --- |
| Sebastian Pauker Bauunternehmen GmbH | Alteiselfing | bauunternehmen | 92 | https://www.pauker-bau-gmbh.de/ |
| Andreas Fischer Malerbetrieb GmbH | Aschau im Chiemgau | malerarbeiten | 92 | https://malerfischeraschau.de/ |
| Messer Werk Damaszenerstahl | Aschau im Chiemgau | metallbau | 92 | https://www.messer-werk.de/ |
| Möbelwerkstätte Christian Deml | Aschau im Chiemgau | schreinerarbeiten, innenausbau | 92 | https://www.demldesign.de/ |
| AB-Form Teck | Bad Aibling | metallbau | 92 | https://www.ab-form.tech/ |
| Bautrocknung Jaist | Bad Aibling | bauwerksabdichtung | 92 | https://bautrocknung-jaist.de/ |
| Der Holzladen | Bad Aibling | schreinerarbeiten, innenausbau | 92 | https://www.holzladen-bad-aibling.de/ |
| Die Glaser | Bad Aibling | fenster-tueren | 92 | https://www.glasboehm.de |
| Folgner GmbH | Bad Aibling | sonnenschutz | 92 | https://www.folgner-rolladen.de/ |
| Franke Naturstein | Bad Aibling | natursteinarbeiten | 92 | https://www.frankenaturstein.de/ |
| Geisler GmbH | Bad Aibling | metallbau | 92 | http://www.geisler-cnc.de |
| Glaserei Pauliel | Bad Aibling | fenster-tueren | 92 | https://www.pauliel.de |
| Hafner "Der Maler" | Bad Aibling | malerarbeiten | 92 | https://www.maler-hafner.de |
| Holzbau Glas | Bad Aibling | zimmererarbeiten, schreinerarbeiten, holzbau | 92 | https://www.holzbau-glas.de |
| Klepp Absauganlagen GmbH | Bad Aibling | heizungsbau, lueftung | 92 | https://klepp.de/ |
| Maler Leyer | Bad Aibling | malerarbeiten | 92 | https://www.leyer.de/ |
| Pakt Türen | Bad Aibling | fenster-tueren | 92 | https://pakt-tueren.de/ |
| Parkett Jaist | Bad Aibling | bodenlegerarbeiten | 92 | https://parkett-jaist.de/ |
| Ritthaler & Sohn | Bad Aibling | dachdeckerarbeiten | 92 | https://www.dachdeckerei-ritthaler.com/ |
| Rottmüller Systemholz | Bad Aibling | zimmererarbeiten, schreinerarbeiten | 92 | https://www.rottmueller-systemholz.de/ |

## Größte Lücken

- Viele Kandidaten ohne Ort/Adresse müssen im Enrichment über Website/Impressum nachgezogen werden.
- Tiefbau, Pflasterbau, Gerüstbau, Brandschutz, Abdichtung und Spengler sind noch deutlich unterabgedeckt.
- Stephanskirchen ist im OSM-Hinweislauf nur schwach abgedeckt und braucht zusätzliche Discovery-Quellen.
- Riedering ist bewusst nicht Schwerpunkt dieses Laufs und erscheint nur minimal.
- OSM liefert für Baugewerke brauchbare Hinweise, ersetzt aber nicht die Website-/Impressumsprüfung.

## Empfohlener nächster Sprint

1. Importdatei lokal in `company_candidates` mappen, nicht in `companies`.
2. `agent_review_items` für `ready_for_import=true` erzeugen.
3. Website-Enrichment für die ersten 30 High-Confidence-Kandidaten mit offizieller Website.
4. Zusätzliche Quellen für unterabgedeckte Gewerke: Innungen/Kammern/öffentliche Firmenwebsites/Such-API nach Freigabe.
5. Stephanskirchen separat mit Firmenwebsites und lokalen Quellen nachziehen, weil OSM hier nicht ausreichend ist.
