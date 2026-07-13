---
type: security-control
title: Service-Role-Zugriffsinventur und Client-Grenze
description: Reproduzierbare Inventur und statische Sicherheitsgrenze für serverseitige Supabase-Service-Role-Zugriffe.
status: active
owner: Product Owner / Security
date: 2026-07-13
---

# Service-Role-Zugriffsinventur und Client-Grenze

## Zweck und Scope

Dieses Dokument ist die technische Inventur des Service-Role-Slices auf `origin/main` mit Stand
`5b7efe7effa98f2a7cba2e259bb5d66ebdc5e0c0`. Es beschreibt, wo der Service-Role-Client verwendet
wird, welche Datenpfade und Migrationen ihn voraussetzen und welche Rechteverkleinerung noch ein
separates Datenbank-Arbeitspaket benötigt.

Der zugehörige Guard liegt in `scripts/service-role-access-audit.mjs`. Er liest ausschließlich
lokale Quelltexte. Er verbindet sich nicht mit Supabase, liest keine Environment-Werte und schreibt
keine Daten. Der Guard wird durch `tests/service-role-access.test.mjs` reproduzierbar geprüft.

Dieses Arbeitspaket verändert keine Anwendungslaufzeit, keine Migration, keine RLS-Policy, keine
Service-Role-Rechte, kein Secret und kein Environment. Die sichtbare Produktfunktion bleibt
unverändert.

## Verbindliche Client-Grenze

- `SUPABASE_SERVICE_ROLE_KEY` und der historische Alias `SUPABASE_KEY` dürfen nicht in `app/` oder
  `components/` vorkommen.
- Client Components dürfen weder `getSupabaseAdmin`, `createClient(...)` noch `@/lib/supabase`
  importieren.
- Die zentrale Client-Fabrik bleibt `lib/supabase.ts`.
- Isolierte CLI-/Agent-Skripte unter `scripts/` dürfen den Service-Role-Key für ihren ausdrücklich
  serverseitigen Datenlauf lesen; sie dürfen den Wert nicht ausgeben.
- Der einzige direkte Aufruf aus `app/` bleibt der serverseitige Admin-Sonderpfad
  `app/admin/submissions/[id]/page.tsx`. Neue direkte Aufrufe benötigen eine erneute Architektur-
  und Security-Prüfung.
- `NEXT_PUBLIC_*` darf niemals einen Service-Role-Key oder einen gleichbedeutenden Alias enthalten.
- Logging- und Fehlerpfade dürfen weder den Secret-Wert noch den Environment-Zugriff ausgeben.

## Aufrufstellen und Datenpfade

### Zentrale Fabrik und serverseitige Datenzugriffe

`lib/supabase.ts` erstellt den nicht persistierenden Supabase-Client aus
`NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`. Die übrigen serverseitigen Module
verwenden ausschließlich diese Fabrik:

- Daten- und Lesepfade: `lib/data.ts`, `lib/data/coverage.ts`,
  `lib/data/public-directory.ts`.
- Formular-, Claim-, Admin- und Profilaktionen: `lib/actions.ts`,
  `lib/actions/business-entry.ts`, `lib/actions/claims.ts`,
  `lib/actions/company-premium.ts`, `lib/actions/coverage.ts`,
  `lib/actions/coverage-approvals.ts`, `lib/actions/planner.ts`,
  `lib/actions/submissions.ts`.
- Agentenpersistenz und regionale Verarbeitung: `lib/agents/company-discovery.ts`,
  `lib/agents/persistence.ts`, `lib/agents/regional-coverage.ts`.
- Upload- und Medienpfade: `lib/company-media-upload.ts`,
  `lib/premium-submission-media.ts`.
- Direkter, serverseitiger Admin-Sonderpfad: `app/admin/submissions/[id]/page.tsx`.

Diese Aufrufstellen sind serverseitige Datenpfade. Sie sind nicht als Freigabe zu verstehen, den
Service-Role-Client künftig aus Client Components oder Browser-Code zu verwenden.

### Isolierte Skriptpfade

Die folgenden CLI-/Agent-Skripte lesen den serverseitigen Key nur für ihren jeweiligen internen
Datenlauf: `discover-region.mjs`, `enrich-company.mjs`, `enrich-create-jobs.mjs`, `enrich-queue.mjs`,
`map-companies-to-trades.mjs`, `publish-public-basis-entries.mjs`, `research-agent.mjs`,
`research-import.mjs` und `sync-trade-taxonomy.mjs`.

Ihre Datenpfade sind Discovery/Coverage, Enrichment, Trade-Mapping, Taxonomie-Synchronisierung,
Research-Import und die kontrollierte Veröffentlichung bereits freigegebener Basisdaten. Sie
unterliegen zusätzlich den vorhandenen Dry-Run-, Approval- und Safety-Gates. Kein Skript darf den
Key loggen oder als öffentliches Ergebnis ausgeben.

## Aktuelle Datenbankrechte aus den Migrationen

Die bestehende Production-Berechtigungsstruktur ist durch die folgenden Migrationen geprägt. Die
Aufzählung ist eine Inventur, keine neue Ausführungsanweisung:

| Datenpfad | Aktuelle Service-Role-Rechte | Technischer Zweck |
| --- | --- | --- |
| `agent_runs`, `agent_run_steps`, `agent_tool_calls`, `agent_tasks`, `agent_approvals`, `agent_review_items`, `agent_outbox`, `agent_lessons`, `agent_cost_events` | `SELECT, INSERT, UPDATE, DELETE` | Agent-OS-Persistenz und Audit-Spur |
| `company_submissions`, `company_claims`, `research_import_batches`, `research_company_candidates` | `SELECT, INSERT, UPDATE, DELETE` | Einreichung, Claim und Research-Review |
| `regions`, `company_candidates`, `coverage_snapshots` | `SELECT, INSERT, UPDATE, DELETE` | Regional Coverage und Kandidatenworkflow |
| `trade_groups`, `service_families`, `services`, `service_aliases`, `activities`, `service_activities`, `contexts`, `service_contexts`, `service_crosslinks`, `company_services`, `company_service_activities`, `company_contexts` | `SELECT, INSERT, UPDATE, DELETE` | Taxonomie- und Servicepflege |
| `company_contacts`, `company_team_members`, `company_references`, `company_reference_media`, `company_certificates` | `SELECT, INSERT, UPDATE, DELETE` | Verifiziertes Startprofil und Reviewdaten |
| `company_social_links`, `company_profile_sections` | `SELECT, INSERT, UPDATE, DELETE` | Freigegebene Profilpräsentation |
| `trades`, `companies`, `company_trades`, `company_services`, `service_families`, `services`, `company_contacts`, `company_team_members`, `company_references`, `company_reference_media`, `company_certificates`, `company_social_links`, `company_profile_sections` | `SELECT, INSERT, UPDATE, DELETE` nach der Kompatibilitätsmigration | Serverlesepfade und bestehende Profilkompatibilität |
| `municipalities`, `company_submission_service_areas`, `company_service_areas` | `SELECT, INSERT, UPDATE, DELETE`; kein `TRUNCATE`, `REFERENCES`, `TRIGGER` oder `MAINTAIN` durch den Rechte-Hotfix | Gemeinde-Katalog, Einreichungs- und freigegebene Tätigkeitsgebiete |

Zusätzlich existieren Service-Role-Policies für Objekte, die in den historischen Migrationen nicht
alle eine eigene Grant-Zeile erhalten: `trade_synonyms`, `company_sources`, `company_trade_reviews`,
`company_change_log`, `trade_slug_aliases`, `company_enrichment_jobs`, `review_queue` und
`storage.objects` (nur Bucket `company-media`). Diese Policies decken die internen Trade-Mapping-,
Review-, Enrichment-, Audit- und Uploadpfade ab und werden ausdrücklich in die Rechteinventur
einbezogen. Der automatisierte Inventurtest extrahiert alle `service_role`-Policy- und Grantobjekte
aus `supabase/migrations` und prüft, dass jedes Objekt hier dokumentiert bleibt.

Die Migrationen setzen RLS auf den privaten Tabellen aktiv und legen Service-Role-Policies für die
internen Datenpfade an. `anon` und `authenticated` erhalten für die geschützten Datenpfade keine
aktive Freigabe. Der Service-Role-Key umgeht RLS; deshalb ist eine Policy allein kein Ersatz für
eine spätere Rechte- und Aufrufstellenverkleinerung.

Die historische Agent-OS-Migration vergibt außerdem `USAGE` auf dem Schema `public` an
`service_role`. Dieses Schema-Recht ist für die SQL-Objektzugriffe technisch erforderlich und wird
vom automatischen Inventurtest wie ein eigenes Grant-Objekt als `schema public` dokumentiert.

## Befund und offene nächste Rechtearbeit

Der Guard bestätigt in diesem Slice:

1. Service-Role-Referenzen liegen außerhalb von Client Components und Browser-Grenzen.
2. Die zentrale Fabrik bleibt in `lib/supabase.ts`.
3. Es gibt keine `NEXT_PUBLIC_*`-Service-Role-Variable und keinen statischen Logpfad für den Key.
4. Der direkte `app/`-Aufruf ist auf den dokumentierten serverseitigen Admin-Sonderpfad begrenzt.

Noch offen und bewusst nicht Teil dieses Slices:

- Aufteilung der breiten CRUD-Rechte in tatsächlich benötigte Operationen je Datenpfad.
- Separate Datenbankrollen oder Capability-Clients für öffentliche Lese-, Admin- und Agentenpfade.
- Nicht-produktive Validierung und additive beziehungsweise rücknehmbarer Migration dieser Rechte.
- Historie und Baseline der Supabase-Migrationen.

Diese Punkte benötigen ein eigenes Security-/Datenarbeitspaket mit nicht-produktiver Datenbank-
prüfung und ausdrücklicher Freigabe vor jeder Production-Migration. Der jetzige Guard verhindert
keine SQL-Rechte, sondern schließt die vorgelagerte Code-Leak-Grenze reproduzierbar.

## Prüfung, Rollback und Release-Grenze

Reproduzierbare lokale Prüfung:

```text
node scripts/service-role-access-audit.mjs
npm test -- tests/service-role-access.test.mjs
```

Ein Fehlschlag blockiert den Draft-PR-Abschluss. Vor einem späteren Rechte-Release müssen die
betroffenen Migrationen in einer eindeutig nicht-produktiven Umgebung ausgeführt und mit Schema-,
RLS-, Grant-, Trigger-, Foreign-Key- und Datenkompatibilitätsprüfungen belegt werden. Bis dahin
werden keine Production-Rechte verändert.

Der Rollback dieses Slices ist ein Revert-PR des tatsächlichen Merge-Commits. Er entfernt nur
Dokumentation und statische Prüfungen; ein Datenbank-Rollback ist nicht erforderlich, weil keine
Production-SQL-Anweisung und keine Live-Datenänderung enthalten ist.
