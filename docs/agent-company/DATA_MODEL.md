# Datenmodell

Die Agent-OS-Tabellen bilden einen uebergeordneten Audit- und Freigaberahmen. Bestehende Tabellen wie `companies`, `trades`, `company_trades`, `company_candidates`, `coverage_snapshots`, `review_queue`, `company_sources` und `company_change_log` bleiben fachliche Datenquellen.

## Neue Tabellen

- `agent_runs`: ein Agentenlauf mit Ziel, Modus, Status, Kostenrahmen und Ergebnis.
- `agent_run_steps`: einzelne Schritte eines Laufs.
- `agent_tool_calls`: genutzte Tools, Input-/Output-Metadaten, keine Secrets.
- `agent_tasks`: priorisierte Folgeaufgaben.
- `agent_approvals`: riskante Aktionen zur Freigabe.
- `agent_review_items`: pruefpflichtige Daten-, Content- oder Compliance-Faelle.
- `agent_outbox`: externe Kommunikation als Entwurf.
- `agent_lessons`: wiederverwendbare Erkenntnisse und Regeln.
- `agent_cost_events`: Kostenereignisse pro Agent, Region, Tool und Aufgabe.

## Sicherheitsprinzip

Im aktuellen Projekt wird serverseitig mit Service Role gearbeitet und Admin-Routen sind geschuetzt. Die Migration nutzt RLS mit Service-Role-Policies. Echte Nutzerrollen, OAuth und differenzierte RLS bleiben ein spaeterer Schritt.

## Keine Secrets

In Agent-Tabellen duerfen keine API-Keys, Tokens, Passwoerter oder personenbezogenen Zusatzdaten ohne Zweck landen.
