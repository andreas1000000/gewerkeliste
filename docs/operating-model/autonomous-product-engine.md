# Bedienung: Autonomous Product Engine

Die Autonomous Product Engine ist der operative Einstieg fuer die weitere Produktentwicklung von
GewerkeListe.com. Andreas arbeitet als Product Owner: Er beschreibt Ziel, fachliche Grenzen, sichtbare
Akzeptanz und Production-Freigaben. Die technische Auswahl und Umsetzung erfolgt innerhalb der
Repository-Regeln autonom.

## Start

Diese Eingaben starten den Roadmap-Workflow:

- `GewerkeListe weiterbauen.`
- `Arbeite den naechsten wichtigsten Punkt ab.`
- `Fuehre die Produktentwicklung autonom fort.`

Der Roadmap-Skill liest zuerst den aktuellen Repository-, Produkt-, Sicherheits- und Entscheidungsstand,
waehlt genau ein unblocked Arbeitspaket und uebergibt es an den Delivery-Skill.

## Was automatisch passiert

Das Arbeitspaket wird spezifiziert, analysiert, auf einem eigenen Branch umgesetzt, getestet, unabhaengig
reviewt, als Draft-PR gegen `main` erstellt und je nach Diff-Klassifizierung per Preview-QA oder als
`NOT APPLICABLE` fachlich abgeschlossen. Andreas erhaelt danach eine kurze Statuskarte mit Status,
Nutzen, Preview-QA-Einordnung, Tests, Risiken und Empfehlung.

Jeder Pull Request bleibt auf ein Arbeitspaket begrenzt. Die kanonische operative Reihenfolge steht in
`docs/agent-company/IMPLEMENTATION_ROADMAP.md`; Entscheidungen werden in
`docs/knowledge/decisions/architecture-decisions.md` protokolliert.

## Preview-QA

Preview-QA ist bei jeder laufzeitwirksamen Aenderung Pflicht. Dazu gehoeren Anwendungscode, UI, Routen,
Rendering, Suche, SEO, Datenfluesse, Authentifizierung, Supabase/Datenbank, APIs und Environment- oder
Vercel-Konfiguration.

Bei einem vollstaendig geprueften Diff, der ausschliesslich Dokumentation, Repository-Skills,
Agentenanweisungen, Roadmaps, Entscheidungsregister, GitHub-Vorlagen, reine Governance oder CI-only-
Konfiguration ohne ausgelieferte Anwendungsveraenderung betrifft, lautet das Ergebnis:

`PREVIEW-QA: NOT APPLICABLE – keine ausgelieferte Anwendung geändert`

Die Product-Owner-Statuskarte muss die Begruendung enthalten, und ein unabhaengiger Reviewer muss die
Einordnung bestaetigen. `NOT APPLICABLE` ist nicht `NOT RUN` oder `SKIPPED`. Vercel-SSO wird nicht
umgangen; fuer reine Governance-PRs werden keine temporaeren Vercel-Projekte erzeugt.

## Aktualisierte Dry Runs

- Dokumentations-/Skill-/Governance-PR: vollständiger Diff nur nicht laufzeitwirksam -> `NOT APPLICABLE`,
  Reviewer-Bestaetigung erforderlich.
- UI-/Routing-/Daten-/Konfigurations-PR: `REQUIRED`; SSO-Blockade -> `YELLOW` oder `RED`.
- `NOT RUN` oder `SKIPPED`: immer Blocker, niemals `GREEN`.

## Was eine Freigabe braucht

Der Delivery-Skill merged nicht und veraendert Production nicht. Erst nach fachlicher Pruefung und dem
exakten Satz

`Product-Owner-Freigabe für PR #X erteilt.`

startet der Release-Skill seinen Preflight und verwendet den geschuetzten Pull-Request-Prozess. Ohne
Freigabe gibt es keinen Merge und kein Production-Release; eine vorhandene Preview bleibt ein
nichtproduktiver, nicht als Production zu behandelnder Stand.

## Automatische Stopps

Der Prozess stoppt bei ungeklarem Production-Stand, fehlgeschlagenem Typecheck, Lint, Test oder Build,
offenen P0-/P1-Findings, fehlender oder fehlgeschlagener CI, fehlender Preview-QA, veraendertem
freigegebenem Commit, unklarer Domain-Zuordnung, Remote-Datenbankrisiken, Massendaten, Loeschungen,
E-Mails, Zahlungen oder anderen gesondert freizugebenden Aktionen.

Technische Alternativen, Dateinamen und Testdetails muessen nicht vorgegeben werden. Unternehmerische
Entscheidungen bleiben beim Product Owner.
