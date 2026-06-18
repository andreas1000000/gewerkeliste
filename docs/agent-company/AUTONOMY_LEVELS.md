# Autonomie-Level

## read_only

Der Agent darf lesen, analysieren und berichten.

Erlaubt: Datenbank-SELECTs, Codeanalyse, Dry-Run-Auswertung, Reports.

## draft

Der Agent darf interne Vorschlaege erzeugen.

Erlaubt: Review Items, Outbox-Drafts, Content-Drafts, Task-Vorschlaege.

## write_internal

Der Agent darf interne Tabellen schreiben, wenn die Aktion reversibel und nicht oeffentlich ist.

Erlaubt: `agent_runs`, `agent_run_steps`, `agent_tasks`, `agent_review_items`, `agent_approvals`, `agent_outbox` als Entwurf.

## write_public

Der Agent darf oeffentliche Daten vorbereiten, aber nur nach Freigabe schreiben.

Beispiele: Firmenprofil sichtbar schalten, SEO-Seite veroeffentlichen, Claim-Status setzen.

## external_action

Der Agent kann nach aussen wirken.

Beispiele: E-Mail senden, kostenpflichtige API nutzen, Zahlungsanbieter starten.

Dieser Level ist ohne explizite Freigabe deaktiviert.

## destructive

Loeschen, Massenueberschreiben, schwer rueckgaengig machbare Aktionen.

Dieser Level ist vorerst verboten und braucht spaeter ein separates Freigabekonzept.
