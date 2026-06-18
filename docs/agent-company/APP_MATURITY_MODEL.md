# App Maturity Model

Dieses Modell definiert Reifegrade fuer GewerkeListe.com. Es dient als Deployment-, Review- und Governance-Gate fuer Features, Agenten und Datenprozesse.

## Prototype

Erlaubte Daten:

- lokale Testdaten
- synthetische Daten
- Dry-Run-Ergebnisse

Notwendige Tests:

- Typecheck
- lokaler Smoke-Test

Review:

- Selbstreview durch den Agenten

Deployment-Gate:

- kein Production-Deployment noetig

Security:

- keine Secrets im Code
- keine Service-Role im Client

DSGVO:

- keine echten personenbezogenen Daten noetig

Freigabe:

- Codex/Andi je nach Aufgabe

## Internal Tool

Erlaubte Daten:

- lokale oder interne Betriebsdaten
- nicht oeffentliche Kandidaten
- Agenten-Dry-Runs

Notwendige Tests:

- Typecheck
- Build
- lokaler UI-Test

Review:

- technische Plausibilitaetspruefung

Deployment-Gate:

- interne Admin-Nutzung moeglich

Security:

- Admin-Schutz aktiv
- keine oeffentliche Indexierung

DSGVO:

- Datenminimierung
- Quellen dokumentieren

Freigabe:

- Andi

## Admin Tool

Erlaubte Daten:

- echte Firmen- und Kandidatendaten
- Review Items
- Approvals
- Outbox Drafts

Notwendige Tests:

- Typecheck
- Build
- Admin-Flow-Test
- Status- und Rechtepruefung

Review:

- technische und fachliche Pruefung

Deployment-Gate:

- Adminbereich darf deployt werden, wenn riskante Aktionen nicht automatisch ausloesen

Security:

- Admin-Guard
- serverseitige Mutationen
- Audit

DSGVO:

- Korrektur- und Loeschpfad vorbereitet

Freigabe:

- Andi

## Public Beta

Erlaubte Daten:

- oeffentliche Basisdaten
- gepruefte Firmenprofile
- unbestaetigte Eintraege mit klarer Kennzeichnung

Notwendige Tests:

- Typecheck
- Build
- wichtigste Public-Flows
- Claim-Flow
- SEO-Smoke-Test

Review:

- fachliche Sichtpruefung
- Datenschutzpruefung

Deployment-Gate:

- keine bekannten Blocker fuer Nutzer

Security:

- keine Admin-Daten oeffentlich
- keine Secrets
- keine Service-Role im Client

DSGVO:

- Impressum
- Datenschutz
- Korrektur-/Opt-out-Hinweis

Freigabe:

- Andi

## Production Public

Erlaubte Daten:

- oeffentliche Firmenprofile
- Claims
- verifizierte Betriebsdaten
- regionale Seiten mit ausreichender Datenqualitaet

Notwendige Tests:

- Typecheck
- Build
- Regression wichtiger Flows
- Monitoring der kritischen Routen

Review:

- Code Review
- Datenqualitaetsreview bei Importen

Deployment-Gate:

- kontrolliertes Deployment
- Rollback-Faehigkeit

Security:

- saubere Env-Trennung
- RLS/Grants geprueft
- Admin- und Server Actions abgesichert

DSGVO:

- Datenverarbeitungslogik dokumentiert
- Korrektur, Loeschung und Widerspruch handhabbar

Freigabe:

- Andi

## Revenue Critical

Erlaubte Daten:

- zahlungsrelevante Daten nur mit expliziter Rechts- und Sicherheitspruefung
- Abrechnung, Rechnungen und Vertragsanbahnung nur ueber freigegebene Systeme

Notwendige Tests:

- Typecheck
- Build
- E2E fuer zahlungs- und vertragsrelevante Flows
- Sicherheitsreview

Review:

- technisches Review
- fachliches Review
- Datenschutz-/Rechtspruefung

Deployment-Gate:

- keine offenen kritischen Bugs
- Monitoring
- Rollback
- Backup/Recovery

Security:

- Least Privilege
- Audit
- sichere Zahlungsanbieter
- keine sensiblen Daten unnoetig speichern

DSGVO:

- Zweckbindung
- Aufbewahrungsfristen
- Auskunfts- und Loeschprozesse

Freigabe:

- Andi plus fachliche externe Pruefung, wenn erforderlich
