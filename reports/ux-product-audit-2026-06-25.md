# UX-/Produkt-Audit GewerkeListe.com - 2026-06-25

Status: umgesetzt als sicherer UI-/Datenanzeige-Slice ohne Production-Aktion.

## Geprüfte Bereiche

- Öffentliche Suche `/suche`
- Öffentliches Firmenprofil `/firma/[slug]`
- Öffentliche Gewerk-/Betriebszuordnung über `company_trades`
- Internes OS: `companies`-Tabelle über `components/company-table.tsx`
- Adminseite für Gemeinde-Agenten `/admin/agents/municipality-discovery`
- Bestehende Leitplanken aus `AGENTS.md`, Product Doctrine und Businessplan

## Gefundene UX-/Produktprobleme

1. Öffentliche Suche zeigte bei mehreren Gewerk-Zuordnungen faktisch nur das primäre Gewerk.
2. Leere Suchergebnisse wirkten wie ein harter Fehler statt wie ein steuerbarer nächster Schritt.
3. Öffentliche Anzeige konnte `company_trades` verwenden, ohne `rejected` oder `internal` sauber auszusortieren.
4. Firmenprofile konnten abgelehnte oder interne Gewerk-Zuordnungen in "Ausgeführte Gewerke" übernehmen.
5. Die Gemeinde-Agent-Seite nutzte zu viele technische Labels wie `web_search_discovery`, `review_only` oder `draft_only`.
6. Im OS war bei Betrieben mit mehreren Gewerken nur ein Gewerk sichtbar.

## Umgesetzte Verbesserungen

### Suche

- Ergebnis-Karten zeigen jetzt mehrere sichtbare Gewerke als Tags.
- Abgelehnte oder interne Gewerk-Zuordnungen werden nicht öffentlich angezeigt.
- Der leere Zustand erklärt, was passiert ist und bietet nächste Schritte:
  - Betrieb vorschlagen
  - Suche zurücksetzen

### Firmenprofil

- "Ausgeführte Gewerke" nutzt nur sichtbare, nicht abgelehnte Gewerk-Zuordnungen mit ausreichender Confidence.
- Die bestehende Claim-/Korrektur-Logik blieb unverändert.
- Keine Qualitäts-, Verfügbarkeits- oder Ausführungsgarantie ergänzt.

### Datenanzeige

- Öffentliche Datenzugriffe holen sichtbare Gewerk-Zuordnungen strukturierter mit.
- Trade Counts ignorieren interne oder abgelehnte Zuordnungen.
- OS-Betriebsliste zeigt mehrere relevante Gewerke als kompakte Tags.

### Gemeinde-Agent Admin UX

- Technische Modusnamen wurden durch verständliche Begriffe ersetzt.
- Hilfetexte erklären:
  - Recherchemodus
  - Ergebnisverarbeitung
  - Outbox ohne Versand
  - Kosten- und Umfangsgrenzen
- Buttons heißen jetzt klarer:
  - "Dry Run speichern"
  - "Mit gewähltem Modus starten"

## Bewusst nicht umgesetzt

- Keine externe Suche
- Keine API-Läufe
- Keine Production-Datenänderung
- Keine E-Mails
- Keine Veröffentlichung
- Keine Migration
- Keine neuen Discovery-/Enrichment-Features
- Kein Redesign der gesamten Homepage
- Keine Änderung am Claim- oder Revenue-Flow

## Offene Punkte

1. Suchlogik sollte später mit echten synonymisierten Gewerke-Clustern und Ranking-Tests weiter verbessert werden.
2. `/gewerke/[slug]` sollte separat auf leere Zustände, lokale Treffer und Leistungssprache geprüft werden.
3. Admin-OS braucht mittelfristig eine klarere Informationsarchitektur für Agenten, Kandidaten, Outbox und Approvals.
4. Mobile QA sollte mit Browser-Screenshots nachgezogen werden.
5. Der Discovery-Agent braucht weiter Safety Gates, bevor größere Live-Läufe sinnvoll sind.

## Sicherheitsstatus

- Production-Aktionen: 0
- E-Mails: 0
- Veröffentlichungen: 0
- Löschungen: 0
- Externe APIs: 0
- Kostenpflichtige Dienste: 0
