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
