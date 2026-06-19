---
type: product-doctrine
title: GewerkeListe.com Product Doctrine
description: Verbindliche Produktverfassung fuer Plattformlogik, Datenqualitaet, Monetarisierung und Agentenfreigaben.
tags:
  - product
  - doctrine
  - agents
  - coverage
  - verification
  - monetization
timestamp: 2026-06-19
status: active
owner: Andi
---

# GewerkeListe.com Product Doctrine

GewerkeListe.com ist eine DACH-weite Plattform fuer Baugewerke, Handwerksbetriebe und baunahe Spezialleistungen. Auftraggeber, Planer, Architekten, Bauleiter, Unternehmen, Kommunen und Bauherren sollen schneller passende Betriebe finden. Betriebe sollen ihr echtes Leistungsspektrum vollstaendig sichtbar machen koennen.

## Nicht-Ziele

GewerkeListe.com ist kein klassisches Lead-Portal, verkauft keine Kontakte als Kernmodell, erzeugt keinen Preisdruck und behauptet keine Qualitaetsgarantie, wenn nur Betriebsdaten verifiziert sind.

Die Plattform soll Handwerker nicht ausnutzen, sondern ihnen Sichtbarkeit und strukturierte Auffindbarkeit geben.

## Leitprinzipien

- Leistungstiefe statt nur Branchenrubriken
- regionale Auffindbarkeit
- quellenbasierte Daten
- Confidence Scores statt Scheinsicherheit
- Review vor Veroeffentlichung
- menschliche Freigabe vor externer Wirkung
- keine E-Mail ohne Freigabe
- keine kostenpflichtige API ohne Freigabe
- keine Massenlaeufe ohne Freigabe

## Profile

Betriebe sollen Gewerke, Leistungen, Spezialisierungen, Regionen, Kontaktwege, Website, Logo, optional Profilbild, Verifizierungsstatus und Quellenlage darstellen koennen.

Es gibt keine kuenstliche fachliche Limitierung wie ein Hauptgewerk, zwei Nebengewerke oder fuenf Kernleistungen. Vollstaendigkeit ist wertvoller als Limits.

## Verifizierung

Verifiziert bedeutet nur: Betriebsdaten wurden bestaetigt oder vom Betrieb uebernommen.

Verifiziert bedeutet nicht: Qualitaetsgarantie, Empfehlung, Bonitaetspruefung, fachliche Zertifizierung oder Gewaehr fuer Leistung.

## Riedering-Pilot

Riedering ist der erste persoenliche Pilotmarkt. Ziel sind Marktabdeckung, Lernen und Vertrauen. Die Kommunikation ist persoenlich, ehrlich und von Andi als Bau- und Handwerksmensch.

Pilotregionen sind interne Wachstums- und Qualitaetsinstrumente, nicht oeffentliche Unterscheidungsmerkmale zwischen Betrieben.

## Monetarisierung

Kurzfristig sind freiwillige Unterstuetzung, Foerderbeitraege und Zusatzdienste moeglich. Mittelfristig duerfen bessere Profilfunktionen, Verifizierung, Darstellung, Matching, Recruiting, Datenmodule, Partnerdienste und professionelle Werkzeuge monetarisiert werden.

Monetarisierung darf nicht Datenqualitaet oder Vertrauen zerstoeren. GewerkeListe.com monetarisiert echten Mehrwert, nicht kuenstliche Einschraenkung.

## Agentenregeln

Agenten duerfen intern analysieren, Dry Runs ausfuehren, Coverage berechnen, Kandidaten vorschlagen, Quellen sammeln, Confidence Scores setzen, Review Items erzeugen, Approval Items erzeugen und Outbox-Entwuerfe erstellen.

Agenten duerfen ohne Freigabe nicht Firmen oeffentlich veroeffentlichen, Firmen loeschen, echte E-Mails senden, Claim- oder Verification-Status live aendern, Massenlaeufe starten, kostenpflichtige APIs nutzen, Remote-SQL ausfuehren oder Production-Daten aendern.

## Discovery

Discovery arbeitet zuerst als Dry Run. Ziel ist, regionale Luecken zu erkennen, moegliche Betriebe zu finden, Quellen zu speichern, Confidence zu bewerten und Kandidaten in Review Queues zu legen.

Keine automatische Veroeffentlichung.

## Enrichment

Enrichment darf Daten strukturieren, aber nicht erfinden. Lieber `unknown` als halluziniert.

Quellen sind Pflicht: offizielle Website, Impressum, Kontaktseite, Leistungsseiten, zulaessige oeffentliche Verzeichnisse und manuelle Pruefung.

## Outreach

Outreach ist zuerst nur Outbox. Keine Mail wird automatisch gesendet.

Der Ton ist direkt, ehrlich, regional, von Handwerker zu Handwerker, nicht uebertrieben werblich und frei von Leadportal-Sprache.

## Founder-Freigabe

Andi ist bis auf Weiteres finale Freigabeinstanz fuer Veroeffentlichung, Loeschung, Massenlauf, E-Mail-Versand, kostenpflichtige API, Production-Migration, Claim-/Verification-Statusaenderung und gefaehrliche Datenaenderungen.

## Roadmap

1. Coverage Review stabil
2. Product Doctrine festgelegt
3. Discovery Agent Dry Run
4. Candidate Review Queue
5. Enrichment Dry Run
6. Outbox Outreach
7. Riedering-Pilot
8. Rosenheim/Chiemgau-Skalierung
9. Production-Agent-OS intern
10. Monetarisierung testen
