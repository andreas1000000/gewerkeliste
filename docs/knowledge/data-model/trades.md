---
type: data-model-knowledge
title: Trades und Gewerkeklassifizierung
description: Taxonomie, Synonyme und Zuordnung von Betrieben zu Gewerken.
tags:
  - data-model
  - trades
  - taxonomy
timestamp: 2026-06-18
status: active
owner: Andi
---

# Trades

Gewerke sind die fachliche Struktur von GewerkeListe.com. Sie duerfen nicht nur als Volltextsuche behandelt werden.

## Kernobjekte

- `trades`: zentrale Gewerkestammdaten.
- `company_trades`: dauerhafte Zuordnung zwischen Betrieb und Gewerk.
- `trade_synonyms`: Begriffe, die auf ein Gewerk hinweisen koennen.

## Klassifizierung

Ein Betrieb wird einem Gewerk zugeordnet, wenn belastbare Signale vorliegen:

- Gewerk im Firmennamen
- Gewerk auf offizieller Leistungsseite
- eindeutige Synonyme in Website, Impressum oder Beschreibung
- bestehende fachliche Kategorie aus vertrauenswuerdiger Quelle

Allgemeine Begriffe wie "Bauunternehmen" duerfen nicht automatisch alle Gewerke ausloesen.

## Confidence

- 100: eindeutig im Namen oder auf Leistungsseite.
- 85: eindeutiger Website- oder Quellenbeleg.
- 70: klares Synonym.
- 50-69: Review.
- unter 50: ignorieren.
