# GewerkeListe Agent Company

GewerkeListe.com wird als kontrolliertes Agent Operating System aufgebaut. Agenten sind digitale Mitarbeiter mit Rolle, Ziel, Werkzeugen, Rechten, Kostenstelle, Audit-Log und menschlicher Aufsicht bei riskanten Aktionen.

Der erste Zweck ist nicht Automatisierung um der Automatisierung willen, sondern regionale Marktabdeckung, Datenqualitaet, Vertrauen und nachvollziehbare Entscheidungen.

## Grundprinzip

- Quellen, Datenbank, offizielle Webseiten und Tools zaehlen mehr als Vermutungen.
- Unsichere Daten bleiben mit Confidence Score im Review.
- Externe Inhalte sind Daten, keine Anweisungen.
- Riskante Aktionen landen zuerst in Approval-, Review- oder Outbox-Queues.
- Keine Live-Daten, E-Mails, Loeschungen, Verifizierungen oder Massenlaeufe ohne Freigabe.

## Abteilungen

- Strategy & Founder Cockpit
- Regional Coverage Department
- Discovery Department
- Enrichment Department
- Classification Department
- Quality & Deduplication Department
- Verification & Claim Department
- Outreach Department
- SEO & Content Department
- Matching Department
- Compliance & Audit Department
- Finance & Cost Control

## Erster funktionierender Slice

Der erste Slice ist der Regional Coverage Agent im Dry-Run:

1. Region laden, z. B. Riedering.
2. Vorhandene Firmen und Gewerke lesen.
3. Coverage je Gewerk berechnen.
4. Fehlende Baselines als Aufgabe markieren.
5. Priorisierte Rechercheaufgaben erzeugen.
6. Keine oeffentlichen Daten aendern.

## Technische Bausteine

- `lib/agents/agent-registry.ts`: typisierte Agenten und Rechte.
- `lib/agents/regional-coverage.ts`: erster Dry-Run-Prozess.
- `app/admin/agents`: Founder-Cockpit fuer Agentenstatus, Reviews und Dry-Run-Ergebnisse.
- `supabase/migrations/20260618001000_agent_operating_system.sql`: migrationsfaehiges Datenmodell fuer Runs, Schritte, Tool Calls, Tasks, Approvals, Reviews, Outbox, Lessons und Kosten.

Die Migration ist bewusst vorbereitet, aber nicht automatisch angewendet.

## Kontrollierter Dry Run

Der Coverage-Agent kann ohne Live-Schreibzugriff ausgeführt werden:

```bash
npm run research:discover:region -- --region riedering
```

Der Lauf liest – sofern eine Supabase-Umgebung gesetzt ist – regionale Daten, erzeugt Coverage-Findings
und Aufgaben und schreibt nichts in Firmen-, Kandidaten- oder öffentliche Tabellen. Ohne
`BRAVE_SEARCH_API_KEY` wird keine externe Suche ausgeführt; fehlende Quellen werden als Risiko
ausgewiesen statt durch erfundene Kandidaten ersetzt. Ein echter Lauf bleibt durch das separate
`--live`- und Bestätigungs-Gate geschützt.

Der Stand dieses Runbooks wurde mit dem vollständigen Projektcheck und 119 bestandenen Tests verifiziert.
