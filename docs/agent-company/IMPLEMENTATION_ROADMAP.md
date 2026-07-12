# Kanonische operative Produkt-Roadmap

Diese Datei ist die einzige operative Roadmap fuer autonome Produktentwicklung. Die Roadmaps in
`GEWERKELISTE_PRODUCT_DOCTRINE.md` und `BUSINESSPLAN_GEWERKELISTE_V2.md` bleiben strategischer Kontext
und Zeitplanung; sie sind keine parallelen Backlogs.

## Aktueller Status

- Stand: 2026-07-12.
- Source of Truth: GitHub-Repository `andreas1000000/gewerkeliste`, Branch `main`.
- Production ist mit `main` verbunden; der Production-Commit wird vor jedem Release anhand von Vercel-Deployment-ID, Domain-Alias und Git-SHA belegt.
- Stufe 1A und Stufe 1B sind auf `main` abgeschlossen: Product-Owner-Governance, CI, Branch Protection und Required Checks sind aktiv.
- Product-Engine, Roadmap-, Delivery- und Release-Skills sowie der unabhaengige Delivery-Gate sind auf `main` abgeschlossen.
- Die fail-closed Basic-Auth-Haertung aus PR #4 ist abgeschlossen. Sie ersetzt keine vollstaendige Benutzer-, Rollen- oder RLS-Architektur; diese bleibt eigene P0-Arbeit.
- Diese Roadmap ist die operative Auswahlreihenfolge. Merge und Production-Release bleiben getrennte Product-Owner-Entscheidungen.

## Priorisierungsregeln

Arbeit wird in dieser Reihenfolge priorisiert:

1. Existenzielle Sicherheits- oder Datenrisiken.
2. Blocker fuer weitere autonome Entwicklung.
3. Unmittelbarer Nutzen fuer Suchende und Betriebe.
4. Vertrauen und Datenqualitaet.
5. Marktabdeckung und Wachstum.
6. Monetarisierung.

Jeder Pull Request enthaelt genau ein klar begrenztes Arbeitspaket. Ein Punkt ist erst abgeschlossen,
wenn sichtbarer Produkt-, Sicherheits- oder Skalierungsnutzen, Tests und unabhaengige Pruefung belegt sind.

Governance wird nicht um ihrer selbst willen erweitert. Jede neue Regel, Dokumentation oder Kontrolle muss
einen konkreten Sicherheits-, Produkt-, Datenqualitaets-, Usability- oder Skalierungsvorteil belegen.
P0 wird in kleinen Slices mit messbaren Exit-Kriterien abgeschlossen; nach dem Abschluss eines P0-Slices
wechselt die Arbeit in den naechsten priorisierten P0- oder P1-Slice. Ein endloser P0- oder zweiter
Roadmap-Backlog entsteht nicht.

## P0 - Entwicklungsmaschine und Sicherheit

- [x] Product-Owner-Betriebsmodell, CI und geschuetzter `main`-Branch (Stufe 1A/1B, auf `main`).
- [x] Autonome Product-Engine mit Roadmap-, Delivery- und Release-Skills.
- [x] Unabhaengige Reviews, Delivery-Evidenz und Preview-QA-Klassifizierung als wiederholbaren Gate ausfuehren und nachweisen.
- [x] Bestehende Admin- und interne Zugangswege fail-closed haerten (PR #4, Basic Auth). Eine vollstaendige Benutzer-, Rollen- und RLS-Architektur ist ausdruecklich nicht Teil dieses Abschlusses.
- [ ] Naechsten minimalen Admin-/Benutzer-/Rollen-Architektur-Slice festlegen und umsetzen.
  - Exit-Kriterien: Entscheidungsregister mit Bedrohungsmodell und Rollenmatrix fuer Admin, interne Bearbeitung, Betrieb und oeffentliche Nutzer.
  - Exit-Kriterien: Ein minimaler, getesteter Slice ist implementiert; keine Live-RLS- oder Datenbankmigration ohne separates Arbeitspaket und ausdrueckliche Freigabe.
  - Exit-Kriterien: Unautorisierte, autorisierte und fehlerhafte Pfade sind mit reproduzierbaren Tests belegt.
- [ ] Service-Role-Nutzung auf Least Privilege reduzieren.
  - Exit-Kriterien: Alle Service-Role-Aufrufstellen, Berechtigungen und Datenpfade sind inventarisiert und einem Zweck zugeordnet.
  - Exit-Kriterien: Nicht benoetigte Rechte oder Aufrufstellen sind entfernt; kein Service-Role-Secret gelangt in Client-Code oder Logs.
  - Exit-Kriterien: Oeffentliche und administrative Pfade haben Negativtests fuer unberechtigten Zugriff und bestehen den unabhaengigen Security-Review.
- [ ] Dependency-Risiken kontrolliert beheben.
  - Exit-Kriterien: Dependency-Audit ist ausgewertet, Risiken sind nach Schwere und Exploitierbarkeit triagiert und kritische Blocker sind beseitigt.
  - Exit-Kriterien: Akzeptierte Restrisiken, Upgrade-Entscheidungen und Lockfile-Aenderungen sind im PR dokumentiert und reproduzierbar durch CI.
- [ ] Backup-, Migration-, Release- und Rollback-Prozesse belastbar nachweisen.
  - Exit-Kriterien: Migrationen werden in einer nicht-produktiven Umgebung mit Backup-/Restore-Probe und dokumentierter Reihenfolge reproduziert.
  - Exit-Kriterien: Deployment, Git-SHA, Domain-Zuordnung und Smoke-Tests sind als Release-Nachweis verknuepft.
  - Exit-Kriterien: Der Rollback ist als separater Revert-PR gegen den tatsaechlichen Merge-Commit beschrieben und getestet; keine Live-Datenmutation ist Teil des Slices.

## P1 - Kernprodukt

- [~] Firmenprofile vollstaendig und hochwertig darstellen (inklusive Leistungen, Gewerke, Spezialisierungen, Regionen, Ansprechpartner, Team, Referenzen, Bilder und Nachweise; Basisprofil und oeffentliche Darstellung existieren, Vollstaendigkeit und Abnahme offen).
  - Exit-Kriterien: Ein Profil kann Firmenname, Ort/Region, Gewerke, konkrete Leistungen, Spezialisierungen, Einsatzgebiete, Kontakt und Website dauerhaft kostenlos strukturiert darstellen.
  - Exit-Kriterien: Fuer fehlende, ungueltige und freigegebene Angaben existieren sichtbare Zustaende und Tests; die fachliche Abnahme wird anhand eines kleinen Referenzdatensatzes dokumentiert.
  - Exit-Kriterien: Ansprechpartner, Team, Referenzen, Bilder und Nachweise sind in Profil, Suche und Review konsistent; unfreigegebene oder unvollstaendige Inhalte bleiben intern.
  - Exit-Kriterien: Upload-, Einwilligungs-, Loesch- und Sichtbarkeitsregeln sind getestet, ohne Secrets oder unnoetige personenbezogene Daten preiszugeben.
- [~] Claim-, Bearbeitungs-, Pruefungs- und Verifizierungsprozess fertigstellen (Submission-, Claim- und Admin-Review-Bausteine existieren; vollstaendiger Rollenfluss offen).
  - Exit-Kriterien: Claim, Bearbeitung, Review, Ablehnung und erneute Einreichung sind fuer berechtigte Rollen end-to-end abbildbar und auditiert.
  - Exit-Kriterien: `Verifiziert` ist sichtbar semantisch auf bestaetigte/beanspruchte Unternehmensdaten begrenzt und wird nicht als Qualitaetsgarantie dargestellt.
  - Exit-Kriterien: Unberechtigte Bearbeitung, unfreigegebene Inhalte und Statusspruenge sind durch Negativtests ausgeschlossen.
- [~] Suche fuer Teilbegriffe, Synonyme, Schreibvarianten, Orte und konkrete Leistungen verbessern (Term-/Ort-Suche und Taxonomie sind vorhanden; Abdeckung offen).
  - Exit-Kriterien: Reproduzierbare Akzeptanzfaelle decken Teilbegriffe, Synonyme, Schreibvarianten, Orte, konkrete Leistungen und leere Treffer ab.
  - Exit-Kriterien: Ranking bleibt nach fachlicher Passung, Region, Datenqualitaet, Vertrauensniveau und Nutzerrelevanz nachvollziehbar und nicht zahlungsgetrieben.
- [~] Gewerk-Taxonomie fachlich sauber strukturieren (umfangreiche Masterdaten und Synonyme existieren; kanonische Governance offen).
  - Exit-Kriterien: Kanonische Gewerke, Leistungen, Spezialisierungen und Synonyme sind versioniert, konfliktfrei gemappt und mit verantwortlicher fachlicher Quelle dokumentiert.
  - Exit-Kriterien: Neue oder geaenderte Begriffe haben Review-, Rueckwaertsvertraeglichkeits- und Suchtests.
- [~] Datenherkunft und Vertrauensniveau sichtbar machen (Verifizierungssemantik und Quellenregeln existieren; vollstaendige Nutzerfuehrung offen).
  - Exit-Kriterien: Oeffentliche Profile zeigen Quelle, Aktualitaet und Vertrauens-/Pruefstatus in einer fuer Suchende verstaendlichen Form.
  - Exit-Kriterien: Jede sichtbare Vertrauensstufe hat eine dokumentierte Bedeutung, keinen Qualitaets- oder Gewaehrleistungsanspruch und einen reproduzierbaren Review-Pfad.
- [~] Admin-Prozesse auf fachliche Entscheidungen reduzieren.
  - Exit-Kriterien: Jeder Admin-Schritt ist einer fachlichen Entscheidung, einem Status, einer Begruendung und einer Audit-Spur zugeordnet.
  - Exit-Kriterien: Technische Routine wird automatisiert; offene Produkt-, Rechts-, Secret-, Live-Daten- und irreversible Entscheidungen bleiben beim Product Owner.
- [~] Gemeindebasierte Tätigkeitsgebiete im Rosenheimer Pilotcluster (Slice 1: amtlicher Katalog, lokale Karte und Submission-Speicherung; Slice 2: Review, exakte Gemeindesuche und Profil; Slice 3: öffentliche regionale Verfügbarkeit und Erweiterungsworkflow).
  - Exit-Kriterien Slice 1: Die freigegebene Pilot-Allowlist stammt reproduzierbar aus VG250, ist AGS-basiert, lokal visualisiert und serverseitig validiert.
  - Exit-Kriterien Slice 2: Nur freigegebene Betrieb-Gemeinde-Zuordnungen wirken auf exakte Suche und öffentliche Profile; Sitz, Radius und PLZ reichen nicht.
  - Exit-Kriterien Slice 3: Regionale Verfügbarkeit und spätere Kreis-Erweiterungen werden aus demselben Manifest transparent und ohne Vollständigkeitsbehauptung abgeleitet.
- [ ] Footer-, Hilfe-, Sicherheits- und Service-Informationsarchitektur schrittweise umsetzen (Referenz: `docs/knowledge/product/footer-service-pages.md`).
  - Slice 1: vorhandene Navigation und tote Links bereinigen.
  - Slice 2: Hilfe/FAQ und Datenkorrektur.
  - Slice 3: Sicherheit und Inhalte melden.
  - Slice 4: Nutzungsbedingungen und rechtliche Bedarfspruefung.
  - Slice 5: Orte-, Regionen- und Firmenuebersichten.
  - Slice 6: Presse und Sicherheitskontakt.
  - Slice 7: Magazin, Karriere und Partnerschaften.

## P2 - Datenqualitaet und Marktabdeckung

- [ ] Regional Coverage Agent produktiv als kontrollierten Dry-Run einsetzen.
- [ ] Company-Enrichment-Agent mit offiziellen Unternehmensquellen priorisieren.
- [ ] Dublettenpruefung, Confidence, Quellenherkunft und Review Queue durchgaengig machen.
- [ ] Dry-Run-, Approval- und Freigabeprozesse fuer Datenlaeufe nachweisen.
- [ ] Pilotregion Landkreis Rosenheim fachlich vorbereiten.

## P3 - Wachstum

- [ ] Skalierbare SEO-Struktur fuer Gewerke-, Leistungs-, Orts- und Regionsseiten.
- [ ] Interne Verlinkung, strukturierte Daten und Indexierungsqualitaet verbessern.
- [ ] Partnerschaften mit Innungen, Kreishandwerkerschaften und Hochschulen vorbereiten.
- [ ] Messbare Produkt- und Wachstumskennzahlen definieren.

## P4 - Monetarisierung

- [ ] Kostenloses Basisprofil dauerhaft sichern.
- [ ] Verifiziertes Startprofil erst anbieten, wenn die zugesagten Funktionen stabil verfuegbar, getestet und fachlich abgenommen sind.
- [ ] Die derzeitige Preisgrundlage von 490 EUR netto fuer 12 Monate bleibt dokumentiert und wird ohne neue Freigabe nicht live veraendert.
- [ ] Zahlung, Rechnung, Verlaengerung und Kuendigung erst nach gesonderter Security-, Rechts- und Product-Owner-Freigabe aktivieren.

### Verbindliche Preis-/Entitlement-Slices

- [~] Slice 1: Preis- und Entitlement-Vertrag als zentrale Grundlage (dieser Draft-PR).
  - Exit-Kriterien: Zentrale Konfiguration definiert Basisprofil, verifiziertes Startprofil, 490 EUR netto Gesamtpreis, zwölf Monate, einmalige Zahlung, keine automatische Verlängerung, kein Monatsabo, keine monatliche Kündigung, keine Leadgebühr, keine Provision sowie keine Änderung von Suchrelevanz oder Ranking durch Zahlung.
  - Exit-Kriterien: Basis-/Verified-Feature-Matrix und nicht-destruktive Bestandsschutzregeln sind zentral testbar dokumentiert.
  - Exit-Kriterien: Verkaufsfreigabe bleibt NEIN; es gibt keine Bestellung, Zahlung, Rechnung oder Aktivierung eines kostenpflichtigen Zeitraums.
- [ ] Slice 2: Datenmodell und Bestandsschutz mit eigener Security-/Datenprüfung und sicherer, wiederholbarer Migration.
- [ ] Slice 3: Formular, Validierung und Speicherung für Basis-Kontakt und verifizierte Unternehmenskanäle.
- [ ] Slice 4: Serverseitige Entitlements und öffentliche Profile einschließlich HTML, Accessibility, JSON-LD, OpenGraph und Twitter Cards.
- [ ] Slice 5: Preisseite und öffentliche Kommunikation erst nach belegter Funktionsreife.
- [ ] Slice 6: Laufzeit, Ablauf und sichere Reaktivierung ohne Datenlöschung.

## Delivery-Status und Entscheidungsregister

Der aktuelle Status steht in diesem Dokument. Architektur- und Produktentscheidungen werden in
`docs/knowledge/decisions/architecture-decisions.md` erfasst. Das Roadmap-Skill darf nach einem
abgeschlossenen Arbeitspaket nur den Status des bearbeiteten Pakets und die dazugehoerige Entscheidung
aktualisieren; es erzeugt keine zweite Roadmap.

## Strategische Einordnung

Die strategische Reihenfolge bleibt: Coverage Review, Discovery Dry Run, Candidate Review Queue,
Enrichment Dry Run, Outbox Outreach, Riedering-Pilot, Rosenheim/Chiemgau-Skalierung, internes
Production-Agent-OS und erst danach Monetarisierungstests. Die vorliegende P0-P4-Struktur uebersetzt
diese Leitlinie in eine operative Auswahlreihenfolge.
