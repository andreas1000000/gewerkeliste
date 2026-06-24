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

---

# Multi-Source-Ergänzung Landkreis Rosenheim

Status: `review_only`  
Datum: 2026-06-24  
Quelle zweiter Lauf: Brave Search API, öffentliche Suchtreffer, mögliche Firmenwebsites, einzelne öffentliche Fach-/Verzeichnisprofile.  
Produktstatus: Kandidaten sind nicht veröffentlicht, nicht verifiziert und nicht beansprucht.  
Wichtig: Dieser Lauf hat Review-Daten in Production geschrieben, aber keine öffentlichen Firmen angelegt.

## Kurzfazit Multi-Source

- 180 Suchabfragen wurden kontrolliert ausgeführt.
- 56 zusätzliche Kandidaten wurden in `company_candidates` geschrieben.
- 56 Review-Items wurden erzeugt.
- 56 Kandidaten stehen auf `needs_review`.
- 0 Kandidaten stehen auf `ready_for_publish`.
- 13 Kandidaten wurden aus akzeptierten möglichen Firmenwebsites abgeleitet.
- 41 Kandidaten stammen aus Suchtreffern und brauchen Sichtprüfung.
- 2 Kandidaten stammen aus externen Fach-/Verzeichnisprofilen und brauchen Sichtprüfung.
- 29 Coverage-Snapshots wurden erzeugt.
- Keine öffentlichen Firmen wurden angelegt.
- Keine E-Mails wurden versendet.
- Kein Google-Maps-Scraping wurde genutzt.
- Keine Löschungen wurden durchgeführt.

## Live-Schreibumfang

Geschrieben wurden ausschließlich:

- `discovery_runs`
- `company_candidates`
- `review_queue`
- `coverage_snapshots`

Nicht geschrieben oder verändert wurden:

- öffentliche Firmenveröffentlichungen
- E-Mails
- Claim-/Verification-Status
- Zahlungsdaten
- Löschungen

Verifikation nach dem Lauf:

| Kennzahl | Wert |
| --- | ---: |
| Firmen gesamt | 279 |
| öffentliche Firmen | 276 |
| Kandidaten gesamt | 294 |
| Brave-/Multi-Source-Kandidaten | 86 |
| Kandidaten mit `needs_review` | 126 |
| Review-Queue gesamt | 294 |
| Discovery-Runs gesamt | 215 |
| Coverage-Snapshots gesamt | 36 |

## Quellenarten Multi-Source-Lauf

| Source Type | Kandidaten |
| --- | ---: |
| `search_result` | 41 |
| `official_website` | 13 |
| `external_directory` | 2 |

## Confidence-Verteilung

| Gruppe | Kandidaten |
| --- | ---: |
| High Confidence, Score >= 90 | 15 |
| Medium, Score 60-89 | 22 |
| Low/unsicher, Score < 60 | 19 |

Alle Gruppen bleiben im Review. Kein Kandidat wird automatisch veröffentlicht.

## Gewerke-Abdeckung Multi-Source-Lauf

| Gewerk | Kandidaten |
| --- | ---: |
| sanitaerinstallation | 16 |
| bauunternehmen | 6 |
| maurerarbeiten | 5 |
| garten-und-landschaftsbau | 4 |
| dachdeckerarbeiten | 3 |
| bodenlegerarbeiten | 2 |
| elektroinstallation | 2 |
| heizungsbau | 2 |
| schlosserarbeiten | 2 |
| schreinerarbeiten | 2 |
| spenglerarbeiten | 2 |
| tiefbau | 2 |
| zimmererarbeiten | 2 |
| bauwerksabdichtung | 1 |
| betonbau | 1 |
| brandschutz | 1 |
| fenster-tueren | 1 |
| metallbau | 1 |
| trockenbau | 1 |

## Top 20 Beispielkandidaten aus Multi-Source

Diese Liste ist ein Review-Auszug, keine Veröffentlichungsfreigabe. Einige Treffer sind bewusst als Review-Fälle sichtbar, weil Suchmaschinen auch Rathaus-, Portal- oder Partnerseiten liefern können.

| Name | Gewerk | Quelle | Score | Website/Kandidat |
| --- | --- | --- | ---: | --- |
| Dachdeckerei Otto Spenglerei - Bad Aibling, Bruckmühl, Rosenheim | dachdeckerarbeiten | official_website | 100 | https://dachdeckerei-otto.de |
| Elegant Bau | garten-und-landschaftsbau | official_website | 100 | https://elegant-bau.com |
| M. Schwendemann Bauunternehmung GmbH | bauunternehmen | official_website | 100 | http://schwendemann.de |
| Rosenheim - Schweinsteiger Bau | bauunternehmen | official_website | 100 | https://schweinsteiger-bau.de |
| Sebastian Daxeder Bauunternehmung GmbH | bauunternehmen | official_website | 100 | https://daxeder.de |
| Elektro Duschl GmbH Kolbermoor | elektroinstallation | search_result | 90 | https://duschl-elektro.de |
| Hans Kern, Garten- & Landschaftsbau | garten-und-landschaftsbau | official_website | 90 | https://kern-gartenbau.de |
| Schmid GmbH Heizung-Sanitär-Solar-Kundendienst | heizungsbau | external_directory | 90 | https://www.schmidhaustechnik.com |
| Schwaiger Bau | bauunternehmen | official_website | 90 | https://schwaiger-bau.de |
| Abdichtung von Kellern planen im Raum Bad Aibling | sanitaerinstallation | search_result | 80 | https://eh-bauabdichtung.de |
| Inntaler Innenausbau & Sanierung | schreinerarbeiten | search_result | 80 | https://firmenabc.com |
| Johann Feiel Baggerbetrieb | tiefbau | search_result | 80 | https://dialo.de |
| Max Aicher Bau GmbH & Co. KG | bauunternehmen | search_result | 80 | https://www.max-aicher-bau.de |
| Stadler & Holzner Bau GmbH | maurerarbeiten | search_result | 80 | https://www.stadler-holzner-bau.de |
| Wanner Bau GmbH | maurerarbeiten | search_result | 80 | https://www.wannerbau.de |
| Tor- und Zaunanlagen | schlosserarbeiten | search_result | 80 | https://tore-zaeune-rosenheim.de |
| Holzbau Eder GmbH | zimmererarbeiten | search_result | 70 | https://www.holzbau-eder.de |
| Zimmerei Egger | zimmererarbeiten | search_result | 70 | https://www.zimmerei-egger.de |
| Spielberger Bau | betonbau | search_result | 70 | https://www.spielberger-bau.de |
| Gartenbau Ganslmaier | garten-und-landschaftsbau | search_result | 70 | https://www.ganslmaier.de |

## Qualitätsbefund

Der Multi-Source-Ansatz funktioniert besser als OSM-only, ist aber noch nicht gut genug fuer automatische Veröffentlichung:

- Suchmaschinen liefern auch Behörden-, Nachrichten-, Portal- und Partnerseiten.
- Einige Namen sind noch zu lang oder enthalten Seitentitel statt reine Firmierung.
- Einige Treffer haben eine plausible Website, aber Ort/Gewerk muss manuell gegengeprüft werden.
- Coverage nach Ort ist noch grob, weil viele Treffer auf Landkreis-Ebene statt sauberer Gemeindeebene gespeichert wurden.
- Mehr Kandidaten sind erreichbar, aber die Schwelle für automatische Übernahme muss bewusst streng bleiben.

## Größte Lücken nach Multi-Source

- Zielwert 300 Kandidaten wurde in diesem kontrollierten Sprint noch nicht erreicht.
- Zielwert 100 High-Confidence wurde noch nicht erreicht.
- Ortserkennung muss verbessert werden, damit Rosenheim, Bad Aibling, Kolbermoor, Stephanskirchen usw. sauber getrennt werden.
- Directory-/Portal-Domains muessen stärker abgewertet werden.
- Firmenname-Normalisierung muss vor dem naechsten Massenlauf verbessert werden.

## Compliance-Bestätigung Multi-Source

- Google Maps Scraping: nein
- E-Mails gesendet: nein
- Öffentliche Firmen veröffentlicht: nein
- Löschungen: nein
- Live-Zahlungen: nein
- Remote-SQL: nein
- Production-Migration: nein
- Externe API genutzt: ja, Brave Search API, kontrolliert begrenzt
- Geschätzte API-Kosten laut Skript: ca. 1,80 EUR

## Empfohlener nächster Sprint Multi-Source

1. Filter für Behörden-/Portal-/Nachrichten-Domains verschärfen.
2. Firmenname-Normalisierung verbessern.
3. Ortserkennung aus Impressum/Kontaktseiten verbessern.
4. Erst danach den Suchumfang auf 300-600 Queries erhöhen.
5. Kandidaten weiterhin nur in Review schreiben, keine automatische Veröffentlichung.
