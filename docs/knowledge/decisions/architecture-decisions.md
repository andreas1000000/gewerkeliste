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

## ADR-007: Geschützte interne Pfade fail-closed härten

Status: active

Entscheidung: Die bestehende Basic-Auth-Grenze für Admin- und interne Pfade erkennt Pfade segmentgenau,
behandelt ungültige Authorization-Header als nicht autorisiert, vergleicht das Secret über gleich lange
SHA-256-Digests byteweise und versieht Auth-Fehler mit `no-store` sowie `noindex, nofollow`.

Grund: Ein fehlerhafter Basic-Header darf keine ungefangene Middleware-Ausnahme verursachen. Der
Secret-Vergleich soll keine direkte String-Gleichheit als zusätzliche Timing-Signatur verwenden.

Auswirkung: Es gibt keine Änderung an Secrets, Environment-Werten, Service-Role-Rechten, Datenbank,
RLS oder Nutzerrollen. Die Schutzgrenze bleibt Basic Auth; weitergehende Authentifizierung und
feingranulare RLS bleiben separate P0-Arbeit. Wenn eine Preview-Umgebung vor der Anwendung durch
Vercel-SSO geschützt wird, wird diese Einschränkung in der Preview-Abnahme offengelegt und nicht
durch einen Bypass umgangen; die Middleware-Antwort bleibt durch direkte Tests abzusichern.

Hinweis zum Status: ADR-007 bleibt unveraendert aktiv. Die Basic-Auth-Haertung aus PR #4 ist
abgeschlossen; eine vollstaendige Benutzer-, Rollen- oder RLS-Architektur ist weiterhin offene P0-Arbeit.

## ADR-008: Technische Agentenautonomie und alleinige Merge-/Production-Freigabe

Status: active
Datum: 2026-07-12

Entscheidung: Das Agentensystem waehlt, begrenzt, implementiert, testet und reviewt technische
Arbeitspakete autonom bis zu einem Draft Pull Request. Andreas Moser bleibt als Product Owner fuer
fachliche, wirtschaftliche, rechtliche und irreversible Entscheidungen sowie allein fuer Merge und
Production-Freigabe zustaendig.

Grund: Technische Orchestrierung soll nicht vom Product Owner abgefragt werden muessen; gleichzeitig
muessen Produktverantwortung, Freigabehoheit und Nachvollziehbarkeit eindeutig bleiben.

Ersetzte aeltere Annahmen: Ersetzt das fruehere Modell, nach dem technische Dateien, Komponenten,
Tabellen, Logs oder Implementierungsalternativen durch den Product Owner einzeln vorgegeben werden.

Auswirkung: Jeder Slice hat eigene Akzeptanzkriterien, Nicht-Ziele, Tests, unabhängiges Review und
einen genau einen Draft PR. Kein Agent darf Merge, Production, Secrets, Live-Daten, E-Mail, Zahlung,
Loeschung oder vergleichbare irreversible Aktionen ohne ausdrueckliche Product-Owner-Freigabe ausfuehren.

## ADR-009: Kostenloses Basisprofil und verifiziertes Startprofil

Status: active
Datum: 2026-07-12

Entscheidung: Das Basisprofil bleibt dauerhaft kostenlos und darf die tatsaechliche Darstellung von
Firmenname, Ort/Region, Gewerken, konkreten Leistungen, Spezialisierungen, Einsatzgebieten, Kontakt
und Website nicht kuenstlich begrenzen. Das einzige aktuell verbindliche optionale Angebot ist das
verifizierte Startprofil fuer 490 EUR netto fuer 12 Monate. Der aktive Verkauf bleibt gesperrt, bis
die zugesagten Funktionen stabil verfuegbar, getestet und fachlich abgenommen sind.

Grund: GewerkeListe ist ein fachliches Register und eine offene Infrastruktur; Datenwahrheit und
Grundsichtbarkeit sind kein Premium-Lock. Der Preis darf erst mit belastbarem Zusatznutzen verbunden
werden.

Ersetzte aeltere Annahmen: Ersetzt die Preis- und Paketannahmen Supporter 99–149 EUR/Jahr, Pro
29–49 EUR/Monat und Premium 79–149 EUR/Monat als aktuelle Angebote. Diese bleiben nur als historische,
verworfene Hypothesen dokumentiert.

Auswirkung: `Verifiziert` bezeichnet nur bestaetigte oder beanspruchte Unternehmensdaten, keine
Qualitaetsgarantie, Empfehlung, Bonitaetspruefung, fachliche Zertifizierung oder Gewaehrleistung.
Zahlung, Rechnung, Verlaengerung und Kuendigung werden erst nach separater Security-, Rechts- und
Product-Owner-Freigabe aktiviert.

## ADR-010: Keine bezahlte organische Bevorzugung

Status: active
Datum: 2026-07-12

Entscheidung: Bezahlung darf keine unpassenden Betriebe organisch nach oben sortieren und keine
fachliche Sichtbarkeit kaufen. Die organische Reihenfolge richtet sich nach fachlicher Passung,
Region, Datenqualitaet, Vertrauensniveau und Nutzerrelevanz. Bezahlte Zusatzdienste muessen einen
separaten, realen Mehrwert liefern und transparent abgegrenzt sein.

Grund: Ein fachliches Register muss die Wahrheit und Relevanz der Suche schuetzen; Pay-to-rank wuerde
den Kernnutzen in Richtung Leadportal und Preisdruck verschieben.

Ersetzte aeltere Annahmen: Ersetzt fruehere Supporter-, Pro-, Premium- und Sichtbarkeitsannahmen,
sofern sie bezahlte organische Bevorzugung oder eine bessere Platzierung als Gegenleistung unterstellen.

Auswirkung: Ranking- und Monetarisierungsentscheidungen brauchen fachliche Akzeptanzfaelle,
Transparenz und einen Negativtest gegen zahlungsbedingte Verfaelschung. Werbung oder Zusatzdistribution
werden nicht als organisches Suchsignal behandelt.

## ADR-011: Governance nur mit konkretem Nutzen

Status: active
Datum: 2026-07-12

Entscheidung: Neue Governance, Dokumentation und Kontrollschritte werden nur eingefuehrt oder
beibehalten, wenn sie einen konkreten Sicherheits-, Produkt-, Datenqualitaets-, Usability- oder
Skalierungsvorteil belegen. Die operative Roadmap bleibt ein einzelner, priorisierter Backlog.

Grund: Governance soll Risiken reduzieren und autonome Lieferung ermoeglichen, nicht die Produktarbeit
durch Selbstzweck oder parallele Dokumentenstrukturen verlangsamen.

Ersetzte aeltere Annahmen: Ersetzt die Annahme, dass zusaetzliche Regeln, Roadmaps oder Freigabestufen
ohne messbaren Nutzen als eigener Fortschritt gelten.

Auswirkung: Jedes neue Governance-Arbeitspaket benoetigt einen sichtbaren Nutzen, klare Exit-Kriterien,
einen begrenzten Scope und einen Owner. Die Roadmap verweist auf das Entscheidungsregister, erzeugt
aber keine zweite Roadmap.

## ADR-012: P0 vor P1, aber kein endloses P0

Status: active
Datum: 2026-07-12

Entscheidung: Existenzielle Sicherheits-, Daten- und Autonomie-Blocker werden als kleine P0-Slices
zuerst bearbeitet. Jeder P0-Slice braucht messbare Exit-Kriterien. Sobald diese erfuellt und unabhaengig
geprueft sind, wechselt die Arbeit zum naechsten priorisierten P0- oder P1-Slice; offene spaetere
Sicherheitsarbeit darf keinen unbegrenzten P0-Loop erzeugen.

Grund: GewerkeListe braucht zuerst eine belastbare Entwicklungs- und Sicherheitsbasis, muss danach aber
den fachlichen Kernnutzen fuer Suchende und Betriebe sichtbar verbessern.

Ersetzte aeltere Annahmen: Ersetzt eine endlose P0-/Governance-Priorisierung ohne Exit oder Produkt-
Fortschritt sowie die Annahme, dass jede offene technische Verbesserung den Start von P1 verhindert.

Auswirkung: Die Roadmap ordnet zunaechst den minimalen Admin-/Rollen-Slice, Service-Role-Least-Privilege,
Dependency-Risiken sowie Backup/Migration/Release/Rollback. Danach folgen Profile, Claim/Review,
Suche, Taxonomie, Provenienz und fachlich reduzierte Admin-Prozesse; jedes Paket benoetigt eigene
Akzeptanz- und Exit-Kriterien.
