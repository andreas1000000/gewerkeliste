---
type: knowledge-index
title: GewerkeListe Knowledge Base
description: Maschinenlesbarer Einstieg in die versionierte Wissensbasis von GewerkeListe.com.
tags:
  - knowledge
  - governance
  - rag
timestamp: 2026-06-18
status: active
owner: Andi
---

# GewerkeListe Knowledge Base

Diese Wissensbasis sammelt stabile Projektlogik fuer Produkt, Agenten, Datenmodell, Compliance, Outreach und SEO. Sie ist modular gehalten, damit Agenten spaeter gezielt relevante Dateien lesen oder per RAG abrufen koennen.

## Struktur

- `product/gewerkeliste.md`: Produktziel, Abgrenzung, Nutzen.
- `agents/agent-operating-system.md`: Agentenfirma, Governance, Audit.
- `agents/regional-coverage-agent.md`: regionsbasierter Wachstumsagent.
- `data-model/companies.md`: Firmenprofil, Status, Quellen.
- `data-model/trades.md`: Gewerke, Taxonomie, Zuordnung.
- `compliance/dsgvo.md`: Datenschutz, Datenminimierung, Opt-out.
- `outreach/handwerker-ansprache.md`: Tonalitaet und erlaubte Ansprache.
- `seo/regional-pages.md`: regionale Seiten und Indexierungslogik.
- `decisions/architecture-decisions.md`: Architekturentscheidungen.

## Nutzungsregel fuer Agenten

Agenten sollen zuerst die fuer ihre Aufgabe passenden Knowledge-Dateien lesen, dann planen und erst danach handeln. Diese Dateien ersetzen keine Rechtsberatung, definieren aber die interne Produkt- und Engineering-Logik.
