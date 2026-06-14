# Agent Operating Rules

Diese Regeln gelten fuer die Arbeit am Projekt GewerkeListe.com.

## Grundhaltung

Der Agent arbeitet mit hoher Autonomie innerhalb klar beschriebener Aufgaben.
Kleine, naheliegende Schritte werden eigenstaendig umgesetzt, ohne fuer jeden Einzelschritt Rueckfragen zu stellen.

Wenn Unsicherheit besteht, waehlt der Agent die sichere Variante und arbeitet weiter.

## Ohne Rueckfrage erlaubt

- Dateien lesen
- bestehende Code-Struktur analysieren
- neue Komponenten oder Skripte anlegen
- TypeScript-, Lint- und Build-Fehler beheben
- kleine Refactorings machen
- Dry Runs ausfuehren
- Tests ausfuehren
- Reports erzeugen
- offensichtliche Bugs beheben
- UI-Details verbessern, wenn sie zum beschriebenen Ziel passen
- Supabase-SELECTs ausfuehren
- lokale Migrationen vorbereiten
- Dokumentation ergaenzen

## Rueckfrage erforderlich

Vor folgenden Aktionen muss der Agent explizit fragen:

- Live-Daten in Supabase massenhaft aendern
- Daten loeschen
- Datenbank-Schema in Production aendern
- Keys, Secrets oder Env-Variablen aendern
- E-Mails versenden
- externe kostenpflichtige APIs aktivieren
- viele Firmen live importieren
- `verified=true` setzen
- `claim_status` aendern
- `public_visible=false` oder `public_visible=true` massenhaft aendern
- Slugs ohne Redirect aendern
- bestehende Daten ueberschreiben
- Aktionen ausfuehren, die schwer rueckgaengig zu machen sind

## Standard fuer Datenlaeufe

- Dry Run ist erlaubt.
- Live Run nur mit explizitem `--live`.
- Keine E-Mails ohne ausdrueckliche Freigabe.
- Keine Massenimporte ohne ausdrueckliche Freigabe.
- Keine Verifizierungsstatus-Aenderung ohne ausdrueckliche Freigabe.
- Fuer Research-, Import- und Enrichment-Laeufe gilt zusaetzlich `AGENT_DATA_ACQUISITION_POLICY.md`.
- Keine Datenbanken oder Verzeichnisse kopieren.
- Hinweisquellen wie Suchmaschinen, Kartendienste oder Branchenverzeichnisse nur zur Identifikation und Website-Findung nutzen.
- Unternehmensprofile bevorzugt aus offiziellen Unternehmensquellen erstellen.
- Keine fremden Texte, Bewertungen, Bilder oder Logos uebernehmen.
- robots.txt, Logins, Paywalls und technische Schutzmassnahmen muessen respektiert werden.
- Qualitaet geht vor Menge.

## Abschlussbericht

Am Ende einer Aufgabe berichtet der Agent kurz:

- was geaendert wurde
- was getestet wurde
- was noch offen ist
