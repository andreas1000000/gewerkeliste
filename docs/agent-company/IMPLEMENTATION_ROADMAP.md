# Kanonische operative Produkt-Roadmap

Diese Datei ist die einzige operative Roadmap fuer autonome Produktentwicklung. Die Roadmaps in
`GEWERKELISTE_PRODUCT_DOCTRINE.md` und `BUSINESSPLAN_GEWERKELISTE_V2.md` bleiben strategischer Kontext
und Zeitplanung; sie sind keine parallelen Backlogs.

## Aktueller Status

- Stand: 2026-07-12.
- Source of Truth: GitHub-Repository `andreas1000000/gewerkeliste`, Branch `main`.
- Production ist mit `main` verbunden; der Production-Commit wird vor jedem Release anhand von Vercel-Deployment-ID, Domain-Alias und Git-SHA belegt.
- Stufe 1A und Stufe 1B sind auf `main` abgeschlossen: Product-Owner-Governance, CI, Branch Protection und Required Checks sind aktiv.
- Diese Roadmap fuehrt die Autopilot-Engine als P0-Arbeitspaket in einem Draft-PR ein. Merge und Production-Release sind davon getrennte Product-Owner-Entscheidungen.

## Priorisierungsregeln

Arbeit wird in dieser Reihenfolge priorisiert:

1. Existenzielle Sicherheits- oder Datenrisiken.
2. Blocker fuer weitere autonome Entwicklung.
3. Unmittelbarer Nutzen fuer Suchende und Betriebe.
4. Vertrauen und Datenqualitaet.
5. Marktabdeckung und Wachstum.
6. Monetarisierung.

Jeder Pull Request enthaelt genau ein klar begrenztes Arbeitspaket. Ein Punkt ist erst abgeschlossen,
wenn sichtbarer Produkt-, Sicherheits- oder Skalierungsnutzen, Tests und unabhaengige Pruefung belegt sind.

## P0 - Entwicklungsmaschine und Sicherheit

- [x] Product-Owner-Betriebsmodell, CI und geschuetzter `main`-Branch (Stufe 1A/1B, auf `main`).
- [~] Autonome Product-Engine mit Roadmap-, Delivery- und Release-Skills (dieser Draft-PR).
- [x] Unabhaengige Reviews und Preview-QA als wiederholbarer Delivery-Gate ausfuehren und nachweisen.
- [~] Admin- und interne Zugangswege weiter absichern (Basic-Auth-Grenze gehärtet; weitere Auth-/RLS-Arbeiten offen).
- [ ] Service-Role-Nutzung auf Least Privilege reduzieren.
- [ ] Dependency-Risiken kontrolliert beheben.
- [ ] Backup-, Migration-, Release- und Rollback-Prozesse belastbar nachweisen.

## P1 - Kernprodukt

- [ ] Firmenprofile vollstaendig und hochwertig darstellen.
- [ ] Datenherkunft und Vertrauensniveau sichtbar machen.
- [ ] Leistungen, Gewerke, Spezialisierungen, Regionen, Ansprechpartner, Team, Referenzen, Bilder und Nachweise sauber abbilden.
- [ ] Suche fuer Teilbegriffe, Synonyme, Schreibvarianten, Orte und konkrete Leistungen verbessern.
- [ ] Gewerk-Taxonomie fachlich sauber strukturieren.
- [ ] Claim-, Bearbeitungs-, Pruefungs- und Verifizierungsprozess fertigstellen.
- [ ] Admin-Prozesse auf fachliche Entscheidungen reduzieren.

## P2 - Datenqualitaet und Marktabdeckung

- [ ] Regional Coverage Agent produktiv als kontrollierten Dry-Run einsetzen.
- [ ] Company-Enrichment-Agent mit offiziellen Unternehmensquellen priorisieren.
- [ ] Dublettenpruefung, Confidence, Quellenherkunft und Review Queue durchgaengig machen.
- [ ] Dry-Run-, Approval- und Freigabeprozesse fuer Datenlaeufe nachweisen.
- [ ] Pilotregion Landkreis Rosenheim fachlich vorbereiten.

## P3 - Wachstum

- [ ] Skalierbare SEO-Struktur fuer Gewerke-, Leistungs-, Orts- und Regionsseiten.
- [ ] Interne Verlinkung, strukturierte Daten und Indexierungsqualitaet verbessern.
- [ ] Partnerschaften mit Innungen, Kreishandwerkerschaften und Hochschulen vorbereiten.
- [ ] Messbare Produkt- und Wachstumskennzahlen definieren.

## P4 - Monetarisierung

- [ ] Kostenloses Basisprofil dauerhaft sichern.
- [ ] Verifiziertes Profil erst anbieten, wenn die zugesagten Funktionen stabil verfuegbar sind.
- [ ] Die derzeitige Preisgrundlage von 490 EUR netto fuer 12 Monate bleibt dokumentiert und wird ohne neue Freigabe nicht live veraendert.
- [ ] Zahlung, Rechnung, Verlaengerung und Kuendigung erst nach gesonderter Security-, Rechts- und Product-Owner-Freigabe aktivieren.

## Delivery-Status und Entscheidungsregister

Der aktuelle Status steht in diesem Dokument. Architektur- und Produktentscheidungen werden in
`docs/knowledge/decisions/architecture-decisions.md` erfasst. Das Roadmap-Skill darf nach einem
abgeschlossenen Arbeitspaket nur den Status des bearbeiteten Pakets und die dazugehoerige Entscheidung
aktualisieren; es erzeugt keine zweite Roadmap.

## Strategische Einordnung

Die strategische Reihenfolge bleibt: Coverage Review, Discovery Dry Run, Candidate Review Queue,
Enrichment Dry Run, Outbox Outreach, Riedering-Pilot, Rosenheim/Chiemgau-Skalierung, internes
Production-Agent-OS und erst danach Monetarisierungstests. Die vorliegende P0-P4-Struktur uebersetzt
diese Leitlinie in eine operative Auswahlreihenfolge.
