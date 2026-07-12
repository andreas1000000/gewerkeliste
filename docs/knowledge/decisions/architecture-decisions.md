---
type: decision-log
title: Architecture Decisions
description: Versionierter Entscheidungslog fuer zentrale Architektur- und Produktentscheidungen.
tags:
  - decisions
  - architecture
  - adr
timestamp: 2026-06-18
status: active
owner: Andi
---

# Architecture Decisions

## ADR-001: Agent Operating System statt Einzel-Skripte

Status: active

Entscheidung: Agentenlaeufe werden als `agent_runs`, Schritte, Tool Calls, Tasks, Approvals, Reviews, Outbox und Cost Events persistiert.

Grund: GewerkeListe soll kontrolliert wachsen. Agenten brauchen Audit, Rechte, Kostenkontrolle und Freigabepfade.

## ADR-002: Regionale Marktabdeckung als Growth-Logik

Status: active

Entscheidung: Der Growth-Ansatz startet regionsbasiert, nicht nur firmenspezifisch.

Grund: Das Produktziel ist regionale Vollstaendigkeit nach Gewerk und Ort.

## ADR-003: Offizielle Unternehmenswebsite als Primaerquelle

Status: active

Entscheidung: Offizielle Firmenwebsites, Impressum, Kontakt- und Leistungsseiten haben Vorrang vor Gemeinde- oder Branchenverzeichnissen.

Grund: Verzeichnisse sind Hinweisquellen, aber nicht die Wahrheit ueber ein Unternehmen.

## ADR-004: Keine Monetarisierung ueber Leistungswahrheit

Status: active

Entscheidung: Gewerke, Leistungen und Spezialisierungen duerfen nicht kuenstlich begrenzt oder hinter eine Paywall gelegt werden.

Grund: Transparenz ist Kernnutzen der Plattform.

## ADR-005: Kanonische operative Roadmap und autonome Delivery-Skills

Status: active

Entscheidung: `docs/agent-company/IMPLEMENTATION_ROADMAP.md` ist die einzige operative Roadmap. Die
Repository-Skills `run-product-roadmap`, `deliver-product-change` und `release-approved-change` bilden
Auswahl, Lieferung und Release-Nachkontrolle als getrennte Schritte ab.

Grund: Andreas Moser soll technische Einzelschritte nicht orchestrieren muessen. Gleichzeitig bleiben
Arbeitspakete einzeln, Reviews unabhaengig, Production-Freigaben menschlich und Releases ueber den
geschuetzten Pull-Request-Prozess nachvollziehbar.

## ADR-006: Delivery-Evidenz als geschlossener CI-Gate

Status: active

Entscheidung: Jeder Pull Request weist die Preview-QA-Klassifizierung, die vollständige Diff-Einordnung,
ein unabhängiges Review und den Status offener P0-/P1-Findings im PR-Text aus. Der CI-Gate leitet die
erwartete Klassifizierung aus einer geschlossenen Allowlist nicht laufzeitwirksamer Governance-/CI-Dateien
ab. Unbekannte Pfade und alle ausgelieferten Anwendungsänderungen werden immer als `REQUIRED` behandelt.

Grund: Preview-QA darf nur bei vollständig belegtem, nicht laufzeitwirksamem Diff entfallen. Eine
deterministische Prüfung verhindert, dass ein PR durch eine unpassende Selbsteinstufung oder offene
P0-/P1-Findings als abgeschlossen erscheint.

Auswirkung: Der Gate liest nur Git-Diff und PR-Evidenz, nutzt keine Secrets, keine Supabase-Verbindung
und keine externe Aktion. Für reine Governance-/CI-PRs bleibt die Einordnung `NOT APPLICABLE – keine
ausgelieferte Anwendung geändert`; bei Anwendungscode, Daten-, Auth-, SEO- oder Konfigurationsänderungen
ist Preview-QA verpflichtend.
