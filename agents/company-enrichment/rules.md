# Company Enrichment Rules

- Es gilt zusaetzlich die zentrale Richtlinie `AGENT_DATA_ACQUISITION_POLICY.md`.
- Firmenwebsite ist Primaerquelle.
- Gemeindeverzeichnis ist nur Lead.
- OSM ist nur Hilfsquelle.
- Suchmaschinen, Kartendienste und Branchenverzeichnisse sind nur Hinweisquellen zur Identifikation und Website-Findung.
- Keine Datenbanken oder Verzeichnisse kopieren.
- Keine fremden Texte kopieren.
- Keine Logos oder Bilder uebernehmen.
- Keine Bewertungen uebernehmen.
- robots.txt, Logins, Paywalls und technische Schutzmassnahmen respektieren.
- Keine E-Mails versenden.
- Keine privaten Daten speichern.
- `verified` bleibt `false`.
- `claim_status` bleibt `unclaimed`.
- Unsichere Faelle gehen in Review Queue.
- Aenderungen werden immer geloggt.
- Bestehende Daten nicht blind ueberschreiben.
- Automatische Uebernahme nur ab Confidence `>= 75`.
- Confidence `50-74` in Review.
- Confidence `< 50` ignorieren.
- Wenn ein Betrieb kein Baugewerk, Planer oder baunaher Betrieb ist: nicht loeschen, sondern `public_visible=false` und `review_status='not_relevant_candidate'` setzen.

## Pflichtworkflow je Firma

Kein Datensatz gilt als fertig, solange diese Kette nicht durchlaufen wurde:

1. Firma entdecken
2. offizielle Website finden
3. Website validieren
4. Impressum lesen
5. Kontaktseite lesen
6. Leistungsseiten lesen
7. Leistungen und Gewerke extrahieren
8. Gewerke gegen zentrale Taxonomie mappen
9. Dublettenpruefung durchfuehren
10. Datenqualitaet bewerten
11. Daten speichern
12. `company_trades` setzen
13. nicht oeffentliche Zusatzleistungen intern speichern
14. Claim-Flow vorbereiten
15. Review-Faelle erzeugen, falls noetig
16. Report erzeugen

Der Agent darf nicht nur Basisdaten speichern und danach stoppen.

## Dublettenpruefung

Vor jedem neuen Insert und nach jedem Enrichment prueft der Agent:

- gleicher oder aehnlicher Firmenname
- gleiche Domain
- gleiche Telefonnummer
- gleiche E-Mail
- gleiche Adresse
- gleiche PLZ/Ort
- aehnliche Schreibweisen und Rechtsformvarianten

Eindeutige Dubletten werden nicht neu angelegt. Stattdessen wird der bestehende Datensatz angereichert und der Merge in `company_change_log` dokumentiert.

Automatisches Deaktivieren oder Zusammenfuehren ist nur bei sehr sicherer Uebereinstimmung erlaubt:

- gleiche Domain und gleicher Firmenname
- gleiche Telefonnummer und gleiche Adresse
- gleicher Firmenname und gleiche Adresse

Unsichere Faelle werden nicht geloescht, sondern als `possible_duplicate` in die Review Queue gegeben.

## Gewerke und Sichtbarkeit

Alle auf der offiziellen Website nachweisbaren Gewerke und Teilgewerke werden intern gespeichert:

- `status='agent_suggested'`
- `visibility_level='internal'`
- mit Confidence Score und Quelle

Oeffentlich sichtbar sein sollen alle nachweisbaren, relevanten Gewerke und Leistungen:

- hoechste Confidence
- konkrete Leistung vor allgemeiner Kategorie
- offizielle Website vor Hinweisquelle
- Suchrelevanz fuer Bauherren und Betriebe

Unsichere oder nicht nachweisbare Leistungen bleiben intern oder gehen in die Review Queue. Nachweisbare Leistungen duerfen nicht wegen eines Foerdermodells verborgen werden.

Nicht raten. Nicht pauschal alle Baugewerke setzen. Nur nachweisbare Leistungen speichern.

## Claim-Flow Vorbefuellung

Der Claim-Assistent muss vorhandene und erkannte Daten nutzen:

- Firmenname
- Adresse
- Telefon
- Website
- Beschreibung
- erkannte Gewerke und Teilgewerke
- erkannte Einsatzgebiete
- Quellenstatus

Der Betrieb soll sehen: "Wir haben bereits folgende Leistungen aus Ihrem oeffentlichen Firmenauftritt erkannt."

Im Claim-Flow:

- erkannte Gewerke vorauswaehlen
- alle tatsaechlich passenden Gewerke und Leistungen bestaetigen oder ergaenzen lassen
- Foerdermitgliedschaft nur fuer bessere Darstellung, Referenzen, Bilder, Projektbeispiele oder Matching nutzen
- vom Nutzer ergaenzte Gewerke als `user_suggested` speichern
- nichts sofort oeffentlich schalten, sondern Review/Verifizierung nutzen

## Payment- und Upgrade-Vorbereitung

Zahlung darf nur vorbereitet werden:

- UI fuer erweitertes Profil
- Mock Payment Provider
- Rechnungsauswahl
- Datenmodell

Nicht erlaubt ohne Freigabe:

- echte Stripe-Zahlung
- PayPal live verbinden
- kostenpflichtige API aktivieren
- automatische Rechnungen versenden

## Datenqualitaetsstatus

Jeder Betrieb braucht dauerhaft:

- `enrichment_status`
- `enrichment_score`
- `last_enriched_at`
- `duplicate_status`
- `trade_mapping_status`

Schwache Basisprofile duerfen nicht massenhaft oeffentlich gemacht werden, ohne Enrichment-Status und Review-Logik.
