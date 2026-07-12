---
name: release-approved-change
description: Prueft eine ausdruecklich freigegebene PR, merged sie geschuetzt und kontrolliert den automatischen Production-Release.
---

# Release Approved Change

## Ausloeser

Der Skill startet nur nach einer eindeutigen Product-Owner-Freigabe im Format:

`Product-Owner-Freigabe für PR #X erteilt.`

Die ASCII-Schreibweise `Product-Owner-Freigabe fuer PR #X erteilt.` wird als identische
Normalisierung akzeptiert. Der Satz muss von Andreas Moser als Product Owner in der aktuellen
Auftrags-/PR-Kommunikation stammen und sich auf genau die im Delivery-Bericht genannte PR beziehen.
Eine nicht zuordenbare oder nur aus einem automatischen Status abgeleitete Zeichenfolge gilt nicht als
Freigabe. Zusaetzlich muessen die zuletzt gepruefte Entscheidungskarte `STATUS: GREEN` und
`EMPFEHLUNG: freigeben` vorliegen.

Ohne diesen Satz stoppt er vor jeder Release-Aktion. Eine allgemeine Bitte, ein gruener Preview-Status
oder ein GitHub-Vercel-Success-Status ersetzt die Freigabe nicht.

## Preflight

1. PR-Status, Base `main`, Head-Branch und aktuellen Head-Commit lesen.
2. Pruefen, dass der Head-Commit seit der Freigabe unveraendert ist.
3. Diff gegen `main`, Freigabeumfang, offene Review-Threads, CI, Required Checks und Branch Protection
   verifizieren.
4. Preview-QA-Einordnung, Akzeptanzkriterien und offene P0-/P1-Findings verifizieren.
5. Bei Abweichung, fehlender Zuordnung oder offenem Blocker stoppen und berichten.

## Preview-QA-Einordnung

Vor jeder Preview-Entscheidung den vollstaendigen, unveraenderten PR-Diff pruefen.

- `PREVIEW-QA: REQUIRED` gilt bei Anwendungscode, UI, oeffentlichen oder internen Routen, Rendering,
  Suche, SEO, Datenfluessen, Authentifizierung, Supabase/Datenbank, API-Verhalten oder Environment-/
  Vercel-Konfiguration.
- `PREVIEW-QA: NOT APPLICABLE – keine ausgelieferte Anwendung geändert` ist nur zulaessig, wenn der
  vollstaendige Diff ausschliesslich Dokumentation, Repository-Skills, Agentenanweisungen, Roadmaps,
  Entscheidungsregister, GitHub-Issue-/PR-Vorlagen, reine Governance oder CI-Konfiguration ohne
  ausgelieferte Anwendungsveraenderung betrifft.
- Fuer `NOT APPLICABLE` muessen die vollstaendige Diff-Pruefung, die Begruendung in der Product-Owner-
  Statuskarte und die Bestaetigung des unabhaengigen Reviewers vorliegen.
- `NOT APPLICABLE` ist nicht `NOT RUN` oder `SKIPPED`. Bei laufzeitwirksamen oder unklaren Aenderungen
  bleibt eine fehlende oder wegen SSO nicht pruefbare Preview-QA ein `YELLOW`-/`RED`-Blocker.

Ein Release-Preflight darf `NOT APPLICABLE` akzeptieren, wenn genau diese Bedingungen, unveraenderter
Head-Commit, erfolgreiche Required Checks und keine offenen P0-/P1-Findings belegt sind. Vercel-SSO
wird nicht umgangen; `vercel --yes` und temporaere Projekte werden fuer reine Governance-PRs nicht
verwendet.

## Geschuetzter Release

1. Ausschliesslich den Pull-Request-Prozess verwenden.
2. Den Merge mit dem unveraenderten Head-Commit und ohne Admin-Bypass ausfuehren.
3. Niemals direkt auf `main` pushen und niemals einen manuellen Vercel-Deploy starten.
4. Nach dem Merge GitHub-CI auf `main` abwarten.
5. Das automatische Vercel-Production-Deployment anhand von Deployment-ID, Domain-Alias und Git-
   Commit-SHA eindeutig zuordnen.
6. Deployment-Status und Zeitpunkt festhalten.
7. Oeffentliche Smoke Tests auf den kritischen Routen ausfuehren.
8. Nach dem Merge nur noch Rollback-Bedarf beurteilen; bei einem kritischen Fehler kontrolliert
   zurueckrollen oder den laufenden Release als fehlgeschlagen melden. Ein bereits erfolgter Merge
   wird nicht als vor dem Merge stoppbar beschrieben.

## Sicherheits- und Datenregeln

- Keine Secrets oder Environment-Werte ausgeben.
- Keine Supabase-, Datenbank- oder Environment-Aenderung als Teil des Skills ausfuehren.
- Ein Production-Nachweis besteht aus Deployment-ID, Alias und Git-SHA; ein Status allein reicht nicht.
- Bei unklarer Domain-Zuordnung nicht raten und nicht als erfolgreich melden.
- Oeffentliche Smoke Tests sind read-only. Sie duerfen keine E-Mails, Datenmutationen, Claims,
  Verifizierungen oder sonstigen externen Aktionen ausloesen.

## Abschlussformat

```text
STATUS: GREEN | YELLOW | RED
PR: <Nummer, URL, unveraenderter Head-Commit>
MERGE: <Methode, Merge-Commit, Zeitpunkt>
CI: <Run und Required Checks>
PRODUCTION: <Deployment-ID, Alias, Git-Branch, Git-SHA, Status, Zeitpunkt>
SMOKE TESTS: <Routen und Ergebnis>
ROLLBACK: <nicht erforderlich | erforderlich | unverifiziert>
RISIKEN: <nur echte Restrisiken>
```
