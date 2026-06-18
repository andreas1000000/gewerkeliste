---
type: agent-knowledge
title: Regional Coverage Agent
description: Regionsbasierter Growth-Agent fuer Marktabdeckung und Datenqualitaet.
tags:
  - agents
  - regional-coverage
  - growth
timestamp: 2026-06-18
status: active
owner: Andi
---

# Regional Coverage Agent

Der Regional Coverage Agent denkt nicht zuerst in Einzelfirmen, sondern in Regionen und Gewerken.

## Ziel

Fuer eine Region soll sichtbar werden, welche relevanten Bau- und Handwerksbetriebe bereits gefunden, klassifiziert und oeffentlich nutzbar sind.

Beispiel:

- Region: Riedering
- Gewerk: Elektroinstallation
- gefunden: 14
- geschaetzt vorhanden: 18
- Abdeckung: 78 %

Wenn keine belastbare Baseline existiert, darf der Agent keine Scheingenauigkeit erfinden. Dann erzeugt er eine Aufgabe zur Baseline-Ermittlung.

## Prioritaeten

1. Firmen mit eigener offizieller Website.
2. Firmen mit Impressum und belastbarer Adresse.
3. aktive Betriebe mit regionalem Bezug.
4. konkrete Leistungsseiten und Gewerkenachweise.
5. Verzeichnisse nur als Hinweisquellen.

## Output

Der Agent erzeugt Dry Runs, Coverage-Findings, Tasks und Review-Faelle. Live-Importe, Veroeffentlichungen und Massenlaeufe brauchen Freigabe.
