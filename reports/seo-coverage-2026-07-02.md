# SEO Coverage Report (2026-07-02)

## Datenquellen
- Service-Enrichment-Dry-Run: reports/service-enrichment-dry-run-2026-07-01.json
- Review-CSV: reports/service-enrichment-review-2026-07-01.csv
- Live-Datenbank: nicht gelesen
- Externe Scrapes: nicht ausgeführt

## Indexierbare Seitentypen laut Sitemap-Logik
- Startseite: immer enthalten
- /gewerke: immer enthalten
- /orte: immer enthalten
- /leistungen: immer enthalten
- /betriebe: immer enthalten
- /betrieb-eintragen, /fuer-betriebe, /ueber-gewerkeliste, /impressum, /datenschutz: enthalten
- /firma/[slug]: nur öffentliche Firmenprofile aus `companies.public_visible = true`
- /gewerke/[slug]: nur Gewerke mit mindestens einem öffentlichen Betrieb
- /gewerke/[slug]/[ort]: nur echte Gewerk-Ort-Kombinationen aus öffentlichen Betrieben
- /orte/[ort]: nur Orte mit öffentlichen Betrieben
- /leistungen/[slug]: nur wenn Service-Location-Treffer einen echten Leistungs-Slug liefern
- /leistungen/[slug]/[ort]: nur echte Leistung-Ort-Kombinationen

## Bewusst noindex / ausgeschlossen
- Admin-, API-, Planner-, Companies- und Trades-Internseiten sind in robots.txt blockiert.
- Claim- und Profilergänzungsseiten werden nicht in die Sitemap aufgenommen.
- Leistung- und Leistung-Ort-Seiten setzen `noindex, follow`, wenn keine echten Treffer geladen werden.
- Leere Ortsseiten werfen 404 statt indexierbarer Boilerplate-Seiten.

## Service-Enrichment-Coverage
- Geprüfte Betriebe: 385
- Kandidaten gesamt: 729
- High: 112
- Medium: 326
- Low: 291
- Potenzielle /leistungen/[slug]: 131
- Potenzielle /leistungen/[slug]/[ort]: 330
- Konflikte/Mehrdeutigkeiten: 953

## Review-Status
- DO_NOT_AUTO_APPLY_LOW: 291
- REVIEW_REQUIRED_MEDIUM: 243
- AUTO_CANDIDATE_HIGH: 101
- AMBIGUOUS: 94
- APPROVED: 0
- REJECTED: 0

## Top Leistungen nach Kandidaten
- Hochbau: 46
- Umbau: 15
- Altbauelektrik: 12
- Architektur: 12
- Außenbeleuchtung: 12
- Baustrom: 12
- Beleuchtung: 12
- Elektroinstallation: 12
- Elektroprüfung: 12
- Erdung: 12
- Fehlerstromschutz: 12
- Kabelverlegung: 12
- LED-Beleuchtung: 12
- Lichtschalter: 12
- Neubauinstallation: 12
- Notstrom: 12
- Potentialausgleich: 12
- Sicherungskasten: 12
- Steckdosen: 12
- Überspannungsschutz: 12

## Top Orte nach Kandidaten
- Rosenheim: 177
- Kolbermoor: 101
- Stephanskirchen: 73
- Raubling: 68
- Prien am Chiemsee: 45
- Bad Aibling: 44
- Riedering: 40
- Neubeuern: 20
- Au bei Bad Feilnbach: 19
- Großhöhenrain: 19
- Bad Endorf: 16
- Eiselfing: 14
- Fridolfing: 14
- Ramerberg: 14
- Riedering-Söllhuben: 14
- Brannenburg: 12
- Großkarolinenfeld: 5
- Aschau im Chiemgau: 3
- Beyharting: 2
- Bruckmühl: 2

## Top Gewerk-Leistung-Kombinationen
- bauunternehmen -> Hochbau: 46
- bauunternehmen -> Umbau: 15
- architekt -> Architektur: 12
- elektroinstallation -> Altbauelektrik: 12
- elektroinstallation -> Außenbeleuchtung: 12
- elektroinstallation -> Baustrom: 12
- elektroinstallation -> Beleuchtung: 12
- elektroinstallation -> Elektroinstallation: 12
- elektroinstallation -> Elektroprüfung: 12
- elektroinstallation -> Erdung: 12
- elektroinstallation -> Fehlerstromschutz: 12
- elektroinstallation -> Kabelverlegung: 12
- elektroinstallation -> LED-Beleuchtung: 12
- elektroinstallation -> Lichtschalter: 12
- elektroinstallation -> Neubauinstallation: 12
- elektroinstallation -> Notstrom: 12
- elektroinstallation -> Potentialausgleich: 12
- elektroinstallation -> Sicherungskasten: 12
- elektroinstallation -> Steckdosen: 12
- elektroinstallation -> Überspannungsschutz: 12

## Aktuelle Datenhebel
- High-Kandidaten zuerst manuell prüfen und explizit freigeben.
- Medium-Kandidaten nach Gewerk priorisieren, besonders Elektro, Bauunternehmen, Sanitär/Heizung und Dach.
- Low-Kandidaten nicht automatisch übernehmen.
- Ambiguous-Kandidaten nur mit klarer Evidence übernehmen.
- Nach freigegebenen direkten Leistungszuordnungen Sitemap erneut prüfen.

## Technische Risiken
- Sitemap nutzt Service-Treffer erst, wenn Service-Location-Daten vorhanden sind.
- Robots blockiert Admin/API: ja.
- `company_services` existiert, braucht aber geprüfte Decisions/Evidence, bevor Leistungsseiten breit indexierbar werden.

## Empfehlung
1. Review-Decision-Struktur anwenden, aber erst nach expliziter Freigabe.
2. High-Kandidaten im Admin-Review als erste Charge manuell entscheiden.
3. Erst danach einzelne APPROVED-Kandidaten nach `company_services` übernehmen.
4. Danach `npm run seo:coverage` erneut ausführen und Sitemap/Preview prüfen.

