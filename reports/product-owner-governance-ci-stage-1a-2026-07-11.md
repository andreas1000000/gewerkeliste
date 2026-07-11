# Stufe 1A: Product-Owner-Governance und CI-Grundschutz

Datum: 2026-07-11
Ausgangscommit: `aa507c77d81f5a48696c2bae4465b0e97df68435`
Branch: `foundation/product-owner-governance-ci`
Ziel: sicheres Repository-, CI- und Freigabefundament ohne Produktcode-, Supabase-, Vercel-, Dependency- oder Production-Aenderungen.

## Umgesetzter Umfang

- GitHub Actions Workflow `.github/workflows/ci.yml` fuer Pull Requests gegen `main` und Pushes nach `main`.
- Product-Owner-Issue-Vorlagen fuer Produktwuensche und Fehlerberichte.
- Pull-Request-Vorlage fuer fachliche Abnahme, Pruefbelege, Daten/Sicherheit, Preview, Risiken und Freigabeempfehlung.
- Konsolidierte Regeln in `AGENTS.md` fuer Product-Owner-Rolle, Arbeitsablauf, Schreibrechte, Source of Truth und kritische Bereiche.
- Betriebsmodell-Dokument `docs/operating-model/product-owner-development-process.md`.

## Bewusst nicht geaendert

- Keine Anwendungskomponente.
- Keine Datenbankmigration.
- Keine Supabase-Konfiguration.
- Keine Vercel-Konfiguration.
- Keine Environment-Datei oder Secret-Wert.
- Keine Dependency-Version und kein Lockfile.
- Keine GitHub-Repository-Einstellung.
- Kein Branch-Protection-Setup.
- Kein Merge.
- Kein Deployment.

## CI-Checks

Der Workflow nutzt vorhandene npm-Skripte:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit --audit-level=critical`

Der Dependency-Audit blockiert kritische Vulnerabilities. Der bekannte aktuelle Zustand mit high und moderate Vulnerabilities wird dadurch nicht verschleiert, sondern bleibt im Audit-Output sichtbar. Die Behebung der 34 bekannten Vulnerabilities ist ein separater Auftrag, weil sie Dependency-Upgrades und moegliche Breaking Changes erfordert.

## Folgeablauf Stufe 1B

| Schritt | Voraussetzung | Technische Aktion | Risiko | Pruefnachweis | Rollback | Freigabe Andreas |
|---|---|---|---|---|---|---|
| 1. Aktives Vercel-Production-Deployment verifizieren | Read-only Vercel-Zugriff | Deployment fuer `gewerkeliste.com` mit ID, Alias und Git-SHA abfragen | falscher Production-Stand | Deployment-ID, URL, Alias, Commit-SHA | keine Aenderung, nur Bericht | Ja |
| 2. Production-Branch in Vercel feststellen | Vercel-Projektzugriff | Production Branch read-only pruefen | falsche Branch-Annahme | Vercel-Projektsetting-Screenshot/API-Ausgabe | keine Aenderung | Ja |
| 3. GitHub Default Branch kontrolliert auf `main` setzen | Zustimmung und bekannte Auswirkungen | GitHub Default Branch aendern | bestehende Automationen/PRs koennen betroffen sein | GitHub Repo-Metadaten zeigen `main` | Default Branch zuruecksetzen | Ja |
| 4. `main` als Source of Truth bestaetigen | Schritte 1-3 | Dokumentierte Bestaetigung im Repo/PR | lokale Branches werden weiter verwechselt | Source-of-Truth-Dokument aktualisiert | Dokument revertieren | Ja |
| 5. Branch Protection einrichten | CI-Workflow auf Branch vorhanden | Protection fuer `main` aktivieren | falsche Regeln blockieren Arbeit | Branch Protection API/UI | Regeln entfernen/anpassen | Ja |
| 6. Pull Requests verpflichtend machen | Branch Protection aktiv | Require PR before merge | direkte Pushes nicht mehr moeglich | GitHub Protection zeigt PR-Pflicht | Regel deaktivieren | Ja |
| 7. CI-Checks als Required Checks einrichten | CI einmal erfolgreich gelaufen | Required Checks setzen: `Quality gates`, `Dependency audit` | falsch benannte Checks blockieren Merge | Protection zeigt Required Checks | Check-Liste korrigieren | Ja |
| 8. Review-Kommentare verpflichtend aufloesen | PR-Pflicht aktiv | Conversation resolution aktivieren | PRs bleiben haengen | Protection/UI zeigt Regel | Regel deaktivieren | Ja |
| 9. Direkte Pushes auf `main` verhindern | Branch Protection aktiv | Restrict direct pushes | Notfall-Fixes brauchen PR | Test mit Schutzregel / UI | temporaer lockern | Ja |
| 10. Force Push und Branch-Loeschung verhindern | Branch Protection aktiv | Force push und deletion verbieten | gering | Protection-Regeln | Regel zuruecknehmen | Ja |
| 11. Baseline-Commit mit Release-Tag sichern | Production-Zuordnung eindeutig | annotierten Release-Tag auf Baseline setzen | falscher Tag waere irrefuehrend | Tag zeigt auf `aa507c77...` | Tag loeschen nach Freigabe | Ja |
| 12. Foundation-PR nach PO-Freigabe mergen | Checks gruen, Review abgeschlossen | PR gegen `main` mergen | Foundation-Regeln werden verbindlich | Merge-Commit/PR-Historie | Revert-PR | Ja |
| 13. Production-Zuordnung erneut verifizieren | Merge abgeschlossen | Vercel/GitHub read-only pruefen | Vercel zeigt unerwarteten Stand | Deployment-ID, Alias, SHA | ggf. Rollback/Stop | Ja |

## Blocker fuer Stufe 1B

- Aktive Vercel-Domain-Deployment-ID und Git-SHA muessen eindeutig read-only ermittelt werden.
- GitHub Default Branch ist noch nicht `main`.
- Branch Protection und Required Checks sind noch nicht eingerichtet.
- Der Foundation-PR muss zuerst reviewed und von Andreas freigegeben werden.

## Empfehlung

Stufe 1B sollte nach erfolgreichem Review und gruenen CI-Pruefungen freigegeben werden, aber nur als kontrollierter Repository-/GitHub-/Vercel-Konfigurationsschritt. Produktcode, Supabase-Migrationen, Auth-Umbauten und Dependency-Upgrades bleiben separate Auftraege.
