# Company Enrichment Agent

Der Company-Enrichment-Agent macht aus schwachen Basis-Firmeneintraegen hochwertige GewerkeListe-Profile.

Fuer alle Research-, Import- und Enrichment-Laeufe gilt die zentrale Richtlinie `AGENT_DATA_ACQUISITION_POLICY.md`.

## Mission

Pflichtworkflow:

Basis-Eintrag -> offizielle Firmenwebsite finden -> Website validieren -> Impressum lesen -> Kontaktseite lesen -> Leistungsseiten lesen -> Leistungen erkennen -> Gewerke und Teilgewerke zuordnen -> Dubletten pruefen -> Firmenprofil anreichern -> Qualitaet bewerten -> `company_trades` setzen -> Claim-Flow vorbereiten -> Review-Faelle erzeugen -> Aenderungen dokumentieren -> Report erzeugen.

Kein Datensatz gilt als fertig, solange diese Kette nicht durchlaufen wurde.

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
- Vor jedem Insert und nach jedem Enrichment ist Dublettenpruefung Pflicht.
- Unsichere Dubletten werden als Review-Fall markiert, nicht geloescht.
- `enrichment_status`, `enrichment_score`, `last_enriched_at`, `duplicate_status` und `trade_mapping_status` muessen gepflegt werden.

## Gewerke, Teilgewerke und Sichtbarkeit

Der Agent speichert intern alle auf der offiziellen Website nachweisbaren Gewerke und Teilgewerke.

Beispiel Wagner & Spielvogel:

- Bauunternehmen
- Hochbau
- Umbau
- Sanierung
- Verputzarbeiten
- Betonbau
- Garten- und Landschaftsbau

Nur nachweisbare Leistungen werden gespeichert. Es wird nicht geraten und nicht pauschal alles gesetzt.

`company_trades` nutzt:

- `confidence_score`
- `source`
- `status`
- `visibility_level`

Status:

- `agent_suggested`
- `user_suggested`
- `user_confirmed`
- `admin_confirmed`
- `rejected`

Sichtbarkeit:

- `internal`
- `basis_public`
- `extended_public`

Oeffentlich soll das Basisprofil das tatsaechliche Leistungsspektrum klar und vollstaendig darstellen. Gewerke, Leistungen und Spezialisierungen duerfen nicht kuenstlich begrenzt oder erst durch ein Foerdermodell sichtbar gemacht werden.

## Claim-Flow Vorbereitung

Der Claim-Assistent startet nicht bei null. Er wird aus Supabase vorbefuellt mit:

- Firmenname
- Adresse
- Telefon
- Website
- Beschreibung
- erkannte Gewerke und Teilgewerke
- erkannte Einsatzgebiete
- Quellenstatus

Der Betrieb soll sehen, welche Leistungen bereits aus dem oeffentlichen Firmenauftritt erkannt wurden. Der Betrieb kann Haken entfernen, bestaetigen und weitere nachweisbare Leistungen ergaenzen. Das Foerdermodell darf die Darstellung verbessern, aber nicht die Nennung tatsaechlicher Leistungen begrenzen.

## Upgrade- und Payment-Vorbereitung

Der Agent darf Datenmodell und UI fuer folgende Optionen vorbereiten:

- kostenloses Basisprofil
- erweitertes Profil
- freiwilliger Aufbau-Beitrag
- Rechnung auf Wunsch
- Mock Payment Provider

Keine echten Zahlungen, keine Stripe-/PayPal-Live-Anbindung und keine automatischen Rechnungen ohne ausdrueckliche Freigabe.

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
- Dublettenpruefung wurde durchgefuehrt
- `company_trades` enthaelt alle nachweisbaren Gewerke intern
- oeffentlich werden alle nachweisbaren relevanten Gewerke und Leistungen klar dargestellt
- Claim-Flow ist mit erkannten Daten vorbefuellt
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
