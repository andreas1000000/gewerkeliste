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

## ADR-013: Zentraler Preis-/Entitlement-Vertrag vor öffentlicher Kommunikation

Status: active
Datum: 2026-07-12

Entscheidung: Das dauerhaft kostenlose Basisprofil umfasst vollständige fachliche Auffindbarkeit,
bestätigte Gewerke und Leistungen, Spezialisierungen, Einsatzregionen, direkte Kontaktaufnahme,
Firmenlogo sowie einen Hauptansprechpartner mit Name und Funktion. Das verifizierte Startprofil ist
das einzige kostenpflichtige Profil: 490 EUR netto Gesamtpreis für zwölf Monate, einmalige Zahlung,
keine automatische Verlängerung, kein Monatsabo und keine monatliche Kündigung. Der rechnerische
Monatswert von 40,83 EUR netto ist ausschließlich eine Einordnung. Zahlung, Rechnung, Bestellung und
Aktivierung bleiben bis zur vollständigen fachlichen Abnahme gesperrt; Verkaufsfreigabe bleibt NEIN.
Eine Zahlung verändert weder Suchrelevanz noch Ranking.

Grund: Eine zentrale, testbare Vertragsdefinition verhindert abweichende Preisstrings, ein versehentliches
Abomodell und eine Vermischung von kostenloser Leistungswahrheit mit kostenpflichtiger erweiterter
Darstellung. Sie schafft eine sichere Grundlage für die folgenden getrennten Daten-, Formular-,
Entitlement-, Kommunikations- und Laufzeit-Slices.

Ersetzte ältere Annahmen: Ersetzt frühere Supporter-, Pro-, Premium-, Monats- und automatische
Verlängerungsannahmen als Produktvertrag. Bestehende interne `premium`-Bezeichner dürfen bis zur
separaten Umbenennung aus Migrationsgründen bestehen bleiben.

Auswirkung: Die zentrale Feature-Matrix definiert Basis- und verifizierte Funktionen sowie den
Bestandsschutz für bereits freigegebene Social Links und Ansprechpartnerbilder. Neue Ansprechpartnerbilder
und Unternehmenskanäle gehören nicht zum regulären Basisprofil; WhatsApp bleibt Basiskontakt. Zahlung,
öffentliche Preisseite, Formulare, Migrationen, öffentliche Entitlements und Laufzeitverhalten werden
in separaten Slices umgesetzt und jeweils unabhängig geprüft.

## ADR-014: Gemeindebasierte Tätigkeitsgebiete als kanonische Pilotlogik

Status: active
Datum: 2026-07-12

Entscheidung: Im ersten Pilotcluster werden Tätigkeitsgebiete fachlich anhand amtlicher Gemeinden
abgebildet. Der achtstellige AGS ist die stabile technische ID. Der Betrieb wählt Gemeinden
ausdrücklich über eine lokale Karte und eine vollständige Alternativliste. Die Auswahl wird
serverseitig gegen den versionierten VG250-Allowlist-Katalog geprüft und zunächst als ungeprüfte
Submission gespeichert. Erst eine spätere Review-Freigabe darf öffentliche Suchwirkung erzeugen.

Quelle und Transformation: Verwendet wird der jeweils aktuelle auf der BKG-Produktseite belegte
VG250-Datenstand, derzeit 01.01.2025. Für den Pilotcluster werden die sieben Kreis-Allowlist-Codes
`09163`, `09175`, `09182`, `09183`, `09184`, `09187` und `09189` gefiltert. Die Geometrien werden
auf die amtlichen `BEZ`-Typen `Gemeinde` und `Stadt` beschränkt. Die Geometrien werden von UTM32s
nach WGS84 projiziert und mit einer lokalen, topologieschonenden weighted-Visvalingam-
Vereinfachung für die Webdarstellung erzeugt. Es gibt keine Kartenkacheln, externe Karten- oder
Geocoding-API und keinen Laufzeit-API-Key.

Grund: Betriebssitz, Radius, PLZ-Nähe oder freie Regionsangaben sind keine belastbare Aussage dafür,
dass ein Betrieb in einer bestimmten Gemeinde tätig werden möchte. Ein exakter Gemeindefilter darf
nur ausdrücklich und öffentlich freigegebene Betrieb-Gemeinde-Zuordnungen berücksichtigen.

Auswirkung: Bestehende Radius-, Regions- und PLZ-Felder werden nicht gelöscht und bleiben vorläufig
für Rückwärtskompatibilität erhalten. Sie dürfen keinen exakten Gemeindetreffer vortäuschen. Die
amtliche Datenquelle, die lokale Geometrie und die Datenbank-IDs werden aus einem gemeinsamen
Manifest erzeugt. Die Datenbankmigration ist additiv, RLS bleibt service-role-only und es erfolgt
keine Production-Migration in diesem Arbeitspaket.

Scope-Slices: Slice 1 umfasst Katalog, lokale Karte, barrierearme Liste, Submission-Speicherung und
Allowlist-Validierung. Slice 2 umfasst Review-/Freigabeansicht, exakte Gemeindesuche und öffentliche
Profilanzeige. Slice 3 umfasst öffentliche regionale Verfügbarkeit und den Erweiterungsworkflow.
Der österreichische Bezirk Kufstein bleibt eine dokumentierte spätere Erweiterung. Keine dieser
Entscheidungen verändert organisches Ranking; Zahlung oder Profilplan erhalten keinen Suchvorteil.

## ADR-015: Footer und Service-Seiten als Vertrauens- und Informationsarchitektur

Status: active
Datum: 2026-07-12

Entscheidung: Der Footer von GewerkeListe.com wird als Vertrauens-, Orientierungs- und
Informationsarchitektur geführt. Verlinkt werden ausschließlich reale, freigegebene und betreute
Seiten. Die verbindliche Zielmatrix mit `NOW`, `NEXT`, `CONDITIONAL`, `LATER` und `NOT_PLANNED`
steht in `docs/knowledge/product/footer-service-pages.md`.

Grund: Suchende und Betriebe brauchen klare Wege zu Suche, Datenkorrektur, Hilfe, Sicherheit und
rechtlichen Informationen. Ein größerer Footer ohne echte Zielseiten würde Vertrauen zerstören,
leere Routen erzeugen und die fachliche Orientierung verschlechtern.

Leitplanken: Rechtliche oder technisch bedingte Seiten werden erst bei tatsächlicher Anwendbarkeit
veröffentlicht. Preise benötigen ein vollständig lieferbares Angebot und eine ausdrückliche
Product-Owner-Verkaufsfreigabe. Sicherheitsmeldungen benötigen einen betreuten Eingang und einen
definierten Prozess. Social-Media-Links dürfen nur auf aktive offizielle GewerkeListe-Kanäle zeigen.

Abgrenzung: Der Aufbau kopiert weder Footer noch Wortlaut, `PRO`-Produktlogik, Bewertungsfunktionen,
Pay-to-rank oder aggressive Werbeangebote anderer Plattformen. Eigene Bezeichnungen wie Für
Betriebe, Preise, Verifiziertes Startprofil, Für Planer und Auftraggeber und Partnerschaften bleiben
maßgeblich.

Auswirkung: Die spätere Umsetzung erfolgt in kleinen, jeweils eigenen Branches und PRs. Dieses ADR
ist keine zweite operative Roadmap. Es verändert in diesem Dokumentations-Slice weder Footer,
Navigation, Sitemap, öffentliche Seiten, Datenbank noch Laufzeitlogik.

## ADR-016: Minimaler Rollenvertrag für interne Pfade

Status: active
Datum: 2026-07-12

Entscheidung: Die Rollen `admin`, `internal_editor`, `business_user` und `public_user` bilden den
verbindlichen Minimalvertrag für spätere Benutzer- und Berechtigungsarbeit. Aktuell ist nur
`admin` für die internen Pfade `/admin`, `/planner`, `/companies` und `/trades` aktiv. Dieser
Zugriff wird weiterhin ausschließlich über das vorhandene `ADMIN_SECRET` in der Basic-Auth-
Middleware nachgewiesen. `internal_editor` und `business_user` bleiben geplant und erhalten bis
zu einer separaten Identitäts-, Scope- und RLS-Entscheidung keinen Zugriff. `public_user` darf nur
öffentliche, freigegebene Verzeichnisdaten lesen.

Rollenmatrix:

| Rolle | Status | Zugriff | Authentifizierung |
| --- | --- | --- | --- |
| `admin` | aktiv | Alle aktuell geschützten internen Pfade und Freigabeentscheidungen | Basic Auth mit `ADMIN_SECRET` |
| `internal_editor` | geplant | Interne Bearbeitung ohne finale Freigabe | Explizite Benutzeridentität und Berechtigung erforderlich |
| `business_user` | geplant | Eigene Betriebsdaten nach einem freigegebenen Claim-Prozess | Explizite Benutzeridentität, Besitzbezug und Scope-Prüfung erforderlich |
| `public_user` | geplant | Öffentliche, freigegebene Verzeichnisdaten bleiben anonym erreichbar; keine aktive Benutzerrolle | Keine Anmeldung erforderlich |

Threat Model und Gegenmaßnahmen:

| Bedrohung | Gegenmaßnahme | Verbleibende Lücke |
| --- | --- | --- |
| Unauthentifizierter Zugriff auf interne Pfade | Segmentgenaue Middleware-Policy und fail-closed Basic Auth | Keine individuelle Benutzeridentität |
| Ähnlicher Pfad wie `/administer` wird versehentlich geschützt | Exakte Segmentgrenzen in einer zentralen Policy | Neue Pfade müssen bewusst in die Policy aufgenommen werden |
| Fehlerhafter oder manipulierter Authorization-Header | Parser verwirft ungültige Header; Middleware antwortet reproduzierbar mit 401 | Basic Auth bleibt ein gemeinsames Secret |
| Fehlende Laufzeitkonfiguration | Middleware verweigert den Request mit privater 500-Antwort | Secret-Rotation und Monitoring sind noch nicht modelliert |
| Gestohlenes Secret oder fehlende Trennung von Verantwortlichkeiten | Keine Aktivierung weiterer Rollen ohne separate Auth-/RLS-Arbeit | Session-, Nutzer-, Scope- und Audit-Modell fehlen noch |

Auswirkung: Die Rollenmatrix ist zentral im Code testbar, ohne Benutzerkonten, Claims, Migrationen,
RLS-Policies, Service-Role-Rechte oder Nutzerdaten zu verändern. Aktuell ist ausschließlich `admin`
als interne Rolle aktiv; öffentliche Routen bleiben anonym erreichbar, ohne `public_user` als aktive
Benutzerrolle zu aktivieren. Die Policy ist ein enger Architekturbaustein, kein Ersatz für eine
spätere echte Benutzer- und Rollenarchitektur. Basic Auth bleibt ausdrücklich eine Übergangslösung
und ist keine vollständige Benutzerarchitektur.

## ADR-017: Service-Role-Boundary vor Rechteverkleinerung

Status: active
Datum: 2026-07-13

Entscheidung: Service-Role-Zugriffe bleiben bis zu einer separat geprüften Rechteverkleinerung
serverseitig zentralisiert und werden durch eine reproduzierbare statische Grenze überwacht. Die
Inventur ordnet alle aktuellen Aufrufstellen, Skriptpfade, Datenpfade und bestehenden
Rechtegruppen einem Zweck zu. Client Components, öffentliche Browser-Grenzen, `NEXT_PUBLIC_*` und
Logging dürfen keinen Service-Role-Key oder gleichbedeutenden Alias berühren.

Grund: Der Service-Role-Key umgeht RLS. Ein versehentlicher Import in Client-Code wäre deshalb ein
existentielles Geheimnis- und Datenrisiko. Eine vorgezogene, rein lokale Boundary-Prüfung schließt
diesen Leak-Pfad, ohne die Production-Datenbank durch eine unzureichend getestete Rechteänderung zu
gefährden.

Auswirkung: `scripts/service-role-access-audit.mjs` und die zugehörigen Tests bilden ein
reproduzierbares CI-Sicherheitsgate. Die aktuelle Rechteinventur bleibt in
`docs/knowledge/security/service-role-access-inventory.md` verankert. Breite CRUD-Rechte,
Capability-Aufteilung, Datenbankrollen und Migrationen bleiben ein eigenes Security-/Daten-
Arbeitspaket mit nicht-produktiver Validierung. Dieser ADR aktiviert keine neue Rolle, keinen
Secret-Wert, keine RLS-Policy und keine Production-Änderung.

## ADR-018: Authentifizierte Betriebsübernahme und moderierte Owner-Änderungen

Status: active
Datum: 2026-07-13

Entscheidung: Die Übernahme eines bestehenden Betriebseintrags beginnt mit einer authentifizierten
Supabase-Auth-E-Mail-Anmeldung über einen einmaligen Magic Link. Die kanonische Identität ist die
UUID aus `auth.users.id`; ein E-Mail-Feld allein begründet keinen Zugriff. Ein Antrag bleibt bis zur
manuellen Admin-Entscheidung `pending`, `needs_info` oder `rejected` und erzeugt weder eine
Betriebsmitgliedschaft noch eine öffentliche Bearbeitungsberechtigung.

Die Freigabe erfolgt ausschließlich über einen serverseitig geschützten Admin-Pfad und eine
transaktionale Datenbankfunktion. Sie legt höchstens eine aktive Owner-Mitgliedschaft pro Betrieb
und Nutzer an, markiert den Claim als `approved` und setzt den Betrieb auf `claimed`; das bestehende
`verified`-Flag wird dabei unverändert erhalten. Eine aktive Mitgliedschaft ist die notwendige
Voraussetzung für `/mein-betrieb` und für Profiländerungen.

Owner-Änderungen werden als `company_submissions` mit eigener Quelle gespeichert. Sie sind für die
Öffentlichkeit unsichtbar, bis ein Admin sie als `approved` freigibt. Die Freigabe aktualisiert die
zugelassenen Profildaten transaktional, protokolliert die Entscheidung und verändert weder
Ranking-Signale noch Preis-/Entitlement-Zustände. Claims, Mitgliedschaften und die zugehörigen
Einreichungen bleiben für anonyme und nicht zugehörige Nutzer unsichtbar; `service_role` ist der
einzige technische Schreibpfad für Admin-Entscheidungen.

Rollen- und Bedrohungsmodell:

| Rolle | Aktiver Zugriff | Nicht erlaubt |
| --- | --- | --- |
| `admin` | Bestehende Basic-Auth-Grenze und manuelle Claim-/Owner-Entscheidungen | Keine ungeprüfte Veröffentlichung oder Änderung von `verified` durch diesen Slice |
| `business_user` | Eigene aktive Membership, eigener Claim-Status und eigener moderierter Änderungsantrag | Andere Betriebe, direkte Firmenupdates, Selbstfreigabe |
| `internal_editor` | In diesem Slice nicht aktiviert | Claims freigeben, Memberships anlegen, Owner-Daten veröffentlichen |
| `public_user` / anonym | Öffentliche, freigegebene Verzeichnisdaten | Claims, Memberships, Einreichungen und private Betriebsdaten |

Gegenmaßnahmen sind die Magic-Link-Identität, serverseitige Session-Prüfung, segmentgenauer
geschützter Betriebsbereich, aktive Membership-Prüfung, RLS mit expliziten Eigenzugriffsregeln,
service-role-only Admin-RPCs, eindeutige aktive Owner-Indizes und idempotente Freigabefunktionen.
Die bisherige unauthentifizierte Service-Role-Claim-Action ist deaktiviert. Authentifizierte
Schreibvorgänge laufen ausschließlich über die eng begrenzten RPCs.

Auswirkung: Die Migration ist additiv und muss vor einem späteren Application-Release in einer
nicht-produktiven Supabase-Umgebung geprüft werden. Dieser Slice führt keine Production-Migration,
keine realen Nutzer, keine E-Mail-Kommunikation und keine Änderung an Supabase-Produktionsdaten aus.
Die bestehende Basic Auth bleibt nur die Admin-Grenze; sie ist ausdrücklich keine vollständige
Benutzer- oder Rollenarchitektur.
