# Company Enrichment Agent

Der Company-Enrichment-Agent macht aus schwachen Basis-Firmeneintraegen hochwertige GewerkeListe-Profile.

Fuer alle Research-, Import- und Enrichment-Laeufe gilt die zentrale Richtlinie `AGENT_DATA_ACQUISITION_POLICY.md`.

## Mission

Workflow:

Basis-Eintrag -> offizielle Firmenwebsite finden -> Website analysieren -> Impressum lesen -> Leistungen erkennen -> Gewerke zuordnen -> Firmenprofil anreichern -> Qualitaet bewerten -> Aenderungen dokumentieren.

Der Agent wird dauerhaft genutzt:

- nach Import einer neuen Gemeinde
- nach Import neuer Basisdaten
- nach manueller Anlage einer Firma
- nach Aenderung der Gewerke-Taxonomie

## Was der Agent niemals tut

- keine E-Mails versenden
- keine Logos oder Bilder uebernehmen
- keine fremden Texte kopieren
- keine fremden Datenbanken oder Verzeichnisse kopieren
- keine Bewertungen anderer Plattformen uebernehmen
- keine Daten aus Hinweisquellen automatisiert als Profilinhalt uebernehmen
- keine robots.txt, Logins, Paywalls oder technischen Schutzmassnahmen umgehen
- keine privaten Daten speichern
- keine unsicheren Daten blind uebernehmen
- keine Betriebe loeschen
- keinen Verifizierungsstatus setzen
- keinen Claim-Status auf claimed setzen

`verified` bleibt `false`. `claim_status` bleibt `unclaimed`.

## Quellenprioritaet

1. Impressum der offiziellen Firmenwebsite
2. Leistungsseiten der offiziellen Firmenwebsite
3. Kontaktseite der offiziellen Firmenwebsite
4. Startseite der offiziellen Firmenwebsite
5. HWK, Innung, Kreishandwerkerschaft
6. serioese Branchenverzeichnisse
7. Gemeinde-Websites
8. OSM

Gemeinde-Websites, OSM, Suchmaschinen, Kartendienste und Branchenverzeichnisse sind Entdeckungs- oder Hinweisquellen. Die Firmenwebsite ist die Primaerquelle.

## Qualitaetsregeln

- Automatisch uebernehmen ab Confidence `>= 75`.
- Confidence `50-74` geht in Review.
- Confidence `< 50` wird ignoriert.
- Leere Felder duerfen ergaenzt werden.
- Bestehende Felder nur ueberschreiben, wenn die neue Quelle eindeutig besser ist.
- Firmenwebsite und Impressum schlagen Gemeindeverzeichnis.
- Jede Aenderung wird in `company_change_log` dokumentiert.
- Jede Quelle wird in `company_sources` gespeichert.

## Dry Run

Ohne `--live` darf der Agent niemals Daten veraendern. Dry Run ist Standard.

```bash
npm run enrich:company -- --name "Wagner Spielvogel" --city "Riedering" --dry-run
npm run enrich:queue -- --limit 20 --dry-run
```

## Live Run

Live Run nur mit explizitem `--live`.

```bash
npm run enrich:company -- --name "Wagner Spielvogel" --city "Riedering" --live
npm run enrich:queue -- --limit 20 --live
```

## Jobs erzeugen

```bash
npm run enrich:create-jobs -- --city "Riedering"
```

Der Agent arbeitet pending Jobs aus `company_enrichment_jobs` ab.

## Testfall: Wagner & Spielvogel GmbH

Offizielle Website:

https://www.wagner-spielvogel.de/

Der Referenzfall muss zeigen:

- Website wird gefunden
- Impressum wird erkannt
- Leistungen werden erkannt
- Gewerke werden korrekt vorgeschlagen
- Beschreibung wird neu formuliert
- Quellen werden gespeichert
- Aenderungen werden geloggt
- `verified` bleibt `false`
- `claim_status` bleibt `unclaimed`

Passende Gewerkesignale:

- Bauunternehmen
- Hochbau
- Umbau
- Sanierung
- Verputzarbeiten
- Garten- und Landschaftsbau

Nicht zuordnen ohne Nachweis:

- Elektro
- Sanitaer
- Heizung
- Dachdecker
- Zimmerer
