---
name: deliver-product-change
description: Liefert genau ein begrenztes Produktarbeitspaket von der Spezifikation bis zu Draft-PR, Preview-QA und unabhaengigem Review.
---

# Deliver Product Change

## Zweck

Dieser Skill setzt ein vom Roadmap-Skill uebergebenes Arbeitspaket vollstaendig um. Er beendet die
Arbeit bei einem geprueften Draft-PR. Merge und Production bleiben ausserhalb dieses Skills.

## Pflichtphasen

1. Produktverstaendnis aus Ziel, Doctrine, Roadmap und bestehendem Code herstellen.
2. Akzeptanzkriterien, Nicht-Ziele und Abnahmepunkte festhalten.
3. Repository-, Datenfluss- und Ursachenanalyse durchfuehren.
4. Architekturentscheidung mit Auswirkungen auf Next.js, Supabase, Vercel, Security, SEO und Betrieb
   dokumentieren, soweit der Scope beruehrt ist.
5. Einen primaeren Implementierungsagenten auf eigenem Branch arbeiten lassen. Pro Branch schreibt nur
   dieser Agent Anwendungscode.
6. Automatische Tests ausfuehren: Typecheck, Lint, Tests und Build; weitere relevante Checks ergaenzen.
7. Einen unabhaengigen Review-Agenten mit vollstaendigem Diff, Akzeptanzkriterien und der
   Laufzeitklassifizierung beauftragen. Der Implementierer darf die eigene Arbeit nicht allein
   freigeben.
8. Bei Auth, RLS, Service Role, Migrationen, Claims, Verifizierung, Sichtbarkeit, Uploads, E-Mail,
   Zahlungen oder Massenaktionen eine Security- und Datenpruefung durchfuehren.
9. Branch pushen und einen Draft-PR gegen `main` erstellen. CI abwarten.
10. Den vollstaendigen PR-Diff als `PREVIEW-QA: REQUIRED` oder `PREVIEW-QA: NOT APPLICABLE`
    klassifizieren.
11. Bei `REQUIRED` die Vercel-Preview und die sichtbaren Akzeptanzkriterien pruefen. Bei SSO oder
    anderer fehlender Pruefbarkeit keinen Umgehungsversuch starten; das Ergebnis bleibt `YELLOW` oder
    `RED`.
12. `NOT APPLICABLE` nur setzen, wenn der vollstaendige Diff ausschliesslich Dokumentation,
    Repository-Skills, Agentenanweisungen, Roadmaps, Entscheidungsregister, GitHub-Vorlagen, reine
    Governance oder CI-Konfiguration ohne ausgelieferte Anwendungsveraenderung betrifft. Die
    Product-Owner-Statuskarte muss die Begruendung `PREVIEW-QA: NOT APPLICABLE – keine ausgelieferte
    Anwendung geändert` enthalten, und der unabhaengige Reviewer muss diese Einordnung bestaetigen.
13. Nach jedem Lauf eine Product-Owner-Statuskarte ausgeben. Nur bei gruenen Gates darf sie eine
    Freigabeempfehlung enthalten.

## Gate-Regeln

- P0- oder P1-Findings blockieren den Draft-PR-Abschluss, bis sie behoben oder explizit als Blocker
  berichtet sind.
- Typecheck, Lint, Tests und Build muessen jeweils mit Exit-Code 0 enden. Jeder Fehler stoppt den
  Abschluss vor einer `GREEN`-Karte und wird als `RED` berichtet.
- `NOT RUN`, `SKIPPED`, fehlende Werkzeuge oder nicht reproduzierbare Ergebnisse zaehlen wie ein
  fehlgeschlagener Gate: kein `GREEN`, keine Freigabeempfehlung und Stop bis der Check belastbar
  ausgefuehrt oder als Blocker berichtet ist.
- Die beiden Required Checks `Quality gates` und `Dependency audit` muessen erfolgreich sein. Ein
  fehlender oder fehlgeschlagener Check stoppt die Freigabe.
- Bei laufzeitwirksamen Aenderungen wird eine fehlende, wegen SSO nicht pruefbare oder nicht
  durchgefuehrte Preview-QA als `YELLOW` oder `RED` gemeldet, nicht als Erfolg behauptet und nicht zur
  Freigabe empfohlen.
- `NOT APPLICABLE` ist nicht `NOT RUN` oder `SKIPPED` und darf nur nach vollstaendiger Diff-Pruefung
  und unabhaengiger Bestaetigung verwendet werden.
- Tests muessen den konkreten Scope abdecken; Dokumentation allein gilt nicht als Produktabschluss.
- Bei kritischen Daten- oder Sicherheitsbereichen sind Diff, Migration, RLS, Service-Role-Nutzung,
  personenbezogene Daten und Rollback-Punkt einzeln zu pruefen.

## Harte Grenzen

- Niemals mergen, `main` direkt pushen oder Production deployen.
- Niemals `vercel --yes` verwenden, wenn dadurch fuer einen reinen Dokumentations- oder Agenten-PR
  ein Projekt oder eine Verknuepfung entstehen kann. Vercel-SSO wird nicht umgangen.
- Keine Remote-SQL-Aktion, keine Live-Datenveraenderung, keine oeffentliche Massenaktion und keine
  E-Mail ohne die jeweils erforderliche Freigabe.
- Keine Secrets in Logs, Reports, PR-Beschreibung oder Entscheidungskarte.
- Keine Scope-Erweiterung auf mehrere unabhaengige Arbeitspakete.

## Product-Owner-Entscheidungskarte

```text
STATUS: GREEN | YELLOW | RED
GESCHAEFTLICHES ERGEBNIS: <was ist fuer Nutzer oder Betriebe besser?>
PREVIEW: <exakte URL oder unverifiziert>
PREVIEW-QA: REQUIRED - <Ergebnis> | NOT APPLICABLE – keine ausgelieferte Anwendung geändert
APPLICABILITY-BEGRUENDUNG: <vollstaendiger Diff und Einordnung>
FACHLICHE ABNAHME:
1. <sichtbarer Punkt>
2. <sichtbarer Punkt>
3. <sichtbarer Punkt>
AUTOMATISCHE PRUEFUNGEN: Typecheck, Lint, Tests, Build, GitHub-CI
UNABHAENGIGES REVIEW: <Ergebnis und offene Findings>
REVIEW-BESTAETIGUNG: <Reviewer bestaetigt REQUIRED oder NOT APPLICABLE>
SECURITY/DATENPRUEFUNG: <Ergebnis oder nicht relevant>
OFFENE RISIKEN: <nur echte Restrisiken>
EMPFEHLUNG: freigeben | Aenderungen verlangen | nicht freigeben
```

Bei `GREEN`, erfolgreicher Preview-QA oder belastbar bestaetigtem `NOT APPLICABLE`, gruenen Required
Checks und `EMPFEHLUNG: freigeben` wird der exakte Freigabesatz angezeigt:

`Product-Owner-Freigabe für PR #X erteilt.`

Bei `YELLOW` oder `RED` wird dieselbe Karte mit `STATUS`, `OFFENE RISIKEN`, `BLOCKER` und
`EMPFEHLUNG: Aenderungen verlangen` oder `EMPFEHLUNG: nicht freigeben` ausgegeben. Der exakte
Freigabesatz wird in diesen Faellen niemals angezeigt.
