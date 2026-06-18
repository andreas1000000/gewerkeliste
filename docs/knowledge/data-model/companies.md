---
type: data-model-knowledge
title: Companies Datenmodell
description: Firmenprofile, Quellen, Sichtbarkeit und Statuslogik.
tags:
  - data-model
  - companies
  - supabase
timestamp: 2026-06-18
status: active
owner: Andi
---

# Companies

`companies` repraesentiert Betriebe im Verzeichnis. Ein Eintrag kann aus einem Basisimport, einer offiziellen Website, einer Einreichung, einem Claim oder einem spaeteren Enrichment entstehen.

## Grundfelder

- Name
- Gewerk oder Hauptzuordnung
- Ort
- PLZ
- Adresse
- Website
- Telefon
- E-Mail
- Beschreibung
- Claim-Status
- Verifizierungsstatus
- oeffentliche Sichtbarkeit

## Statuslogik

`verified=true` bedeutet nur: Betriebsdaten wurden bestaetigt. Es ist keine Qualitaets-, Leistungs- oder Ausfuehrungsgarantie.

`claim_status` beschreibt, ob ein Betriebseintrag uebernommen wurde. Claim und Verifizierung duerfen nicht ohne Freigabe oder klaren Prozess gesetzt werden.

## Quellen

Offizielle Firmenwebsites, Impressum, Kontaktseiten und Leistungsseiten sind primaere Quellen. Gemeinde- und Branchenverzeichnisse sind Hinweisquellen und duerfen nicht als fertiges Profil kopiert werden.

## Aenderungen

Automatische Aenderungen an bestehenden Firmendaten brauchen Confidence, Quelle und Audit. Unsichere Aenderungen gehen in Review.
