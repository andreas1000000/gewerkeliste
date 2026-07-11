# Product-Owner-Entwicklungsprozess

Dieses Dokument beschreibt das Betriebsmodell fuer GewerkeListe.com. Ziel ist, dass Andreas Moser als Product Owner arbeitet und nicht als technischer Vermittler zwischen Tools, Logs, Code, GitHub, Vercel und Supabase.

## Rollen

### Product Owner

Andreas beschreibt Ziele, Probleme, Prioritaeten, fachliche Grenzen und sichtbare Akzeptanzkriterien. Er trifft geschaeftliche Entscheidungen, nimmt Previews fachlich ab und gibt Production-Releases ausdruecklich frei.

Andreas muss keine Dateien, Komponenten, Datenbanktabellen, Logs oder technischen Loesungswege benennen.

### Produkt-Agent

Der Produkt-Agent uebersetzt ein Ziel oder Fehlerbild in eine klare Spezifikation. Er klaert Nicht-Ziele, Akzeptanzkriterien, offene Fragen und Risiken fuer Nutzer, Betriebe und Betrieb.

### Architektur-Agent

Der Architektur-Agent prueft Auswirkungen auf Anwendung, Datenfluesse, Supabase, Vercel, Security, SEO und Betrieb. Er empfiehlt eine Loesungsrichtung, ohne Product-Owner-Entscheidungen zu ersetzen.

### Implementierungs-Agent

Der Implementierungs-Agent setzt eine freigegebene, eng begrenzte Aenderung auf einem eigenen Branch um. Pro Branch gibt es grundsaetzlich nur einen primaeren Agenten, der Anwendungscode schreibt.

### Review-Agent

Der Review-Agent prueft unabhaengig. Er bewertet Risiken, fehlende Tests, Regressionen und Regelverstoss. Der implementierende Agent darf seine eigene Arbeit nicht als alleinige Pruefung freigeben.

### QA- und Security-Agent

Der QA- und Security-Agent prueft sichtbare Akzeptanzkriterien, Regressionen, Datenfluesse, Authentifizierung, Service-Role-Nutzung, RLS, Uploads, personenbezogene Daten und Production-Risiken.

### Release-Agent

Der Release-Agent darf erst nach ausdruecklicher Product-Owner-Freigabe handeln. Er dokumentiert Commit, Deployment, Rollback-Punkt, Smoke-Test und Ergebnis. Ohne Freigabe gibt es keinen Production-Release.

## Ablauf von Idee bis Production

1. Product Owner beschreibt Ziel, Problem oder Fehlerbild.
2. Produkt-Agent erstellt Spezifikation und Akzeptanzkriterien.
3. Architektur-Agent prueft Loesungsrahmen und Risiken.
4. Implementierungs-Agent arbeitet auf eigenem Branch.
5. Automatische CI-Pruefungen laufen.
6. Review-Agent prueft unabhaengig.
7. QA- und Security-Agent pruefen Preview, Daten und Risiken.
8. Product Owner nimmt Preview fachlich ab oder lehnt ab.
9. Product Owner gibt Production ausdruecklich frei.
10. Release-Agent merged und deployed kontrolliert.
11. Nachkontrolle prueft zentrale Seiten, kritische Funktionen und Rollback-Bedarf.

## Erforderliche Freigaben

Eine ausdrueckliche Freigabe von Andreas ist erforderlich fuer:

- Production-Deployment.
- Merge nach `main`, sobald Branch Protection aktiv ist.
- Datenbankmigrationen und Supabase-Remote-Aenderungen.
- Aenderungen an Vercel-Domains, Aliases oder Environment-Werten.
- Aenderungen an GitHub Default Branch, Branch Protection oder Required Checks.
- Veroeffentlichung von Firmendaten.
- Verifizierung, Claim-Status, oeffentliche Sichtbarkeit.
- Massenaktionen, Loeschungen, E-Mail-Versand und Zahlungen.

## Verhalten bei fehlgeschlagenen Pruefungen

Fehlschlagende Typechecks, Tests, Lint-Fehler oder Builds blockieren die Freigabe. Warnungen werden dokumentiert und bewertet. Es wird nicht mit spontanen Production-Reparaturen weitergemacht, solange Ursache, Risiko und Freigabe nicht geklaert sind.

## Verhalten bei unklarer Production-Zuordnung

Wenn nicht eindeutig belegt ist, welches Deployment unter `gewerkeliste.com` aktiv ist, wird nicht gemerged und nicht deployed. Production muss anhand Deployment-ID, Domain-Alias und Git-Commit belegbar sein. Ein Vercel-Success-Status allein ist kein ausreichender Nachweis.

## Source of Truth

Das Zielbild ist:

- `main` ist der eindeutige Production-Branch.
- GitHub ist die Source of Truth fuer freigegebenen Code.
- Vercel Production ist eindeutig mit `main` verbunden.
- Lokale Branches, Worktrees und Preview-Deployments sind keine Production-Baseline.

Dieses Zielbild wird in Stufe 1A dokumentiert. Die tatsaechlichen GitHub- und Vercel-Einstellungen werden erst nach separater Freigabe in Stufe 1B geaendert.

## Rollback-Grundsatz

Vor jedem Production-Release wird der vorherige stabile Stand dokumentiert. Bei kritischen Fehlern wird nicht blind weiterrepariert, sondern kontrolliert zurueckgerollt oder der Release gestoppt. Datenbank-Aenderungen brauchen vorab einen eigenen Rollback- und Backup-Plan.

## Verbot eigenmaechtiger Production-Veraenderungen

Kein Agent, kein Script und kein Mensch in diesem Prozess veraendert Production ohne ausdrueckliche Freigabe durch Andreas. Das gilt fuer Code, Datenbank, Supabase, Vercel, Environment-Werte, GitHub-Einstellungen, Domains, E-Mails, Zahlungen und oeffentliche Firmendaten.
