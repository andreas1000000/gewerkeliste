# Worktree Risk Cleanup - 2026-06-28

Status: active
Owner: Andi
Scope: Rest-Worktree nach Paket 6, keine Feature-Umsetzung

## Kurzfazit

- Vor der Pruefung waren 18 untracked Dateien vorhanden und 0 tracked Dateien dirty.
- Es wurden keine Production-Aktionen, keine Migrationen, keine externen APIs und keine E-Mails ausgefuehrt.
- Die Restdateien gehoeren zu Planner OS, Claim-Token-Flow, Mail/Outreach, Coverage-Dangerous und noch nicht freigegebenen Migrationen.
- Fuer den aktuellen Public-Go-live sind diese Restdateien nicht notwendig.
- `lib/actions/coverage-dangerous.ts` ist nicht importiert, enthaelt aber echte Delete-/Publish-Logik und darf nicht unreviewed committed werden.
- `lib/mail/planner-invitations.ts` sendet selbst keine E-Mails, erzeugt aber Outreach-Texte und gehoert in einen spaeteren Mail-/Outbox-Sprint.
- Die untracked Planner-Routen waeren im lokalen Arbeitsbaum technisch als Next-Routen aktiv, sind aber nicht committed und brauchen DB-Migration, Auth-/Rollenmodell und Datenschutzreview.
- Empfohlene Sofortmassnahme: keine der Altlasten committen; nur diesen Report committen und danach separat entscheiden, ob Planner/Mail/Coverage-Dangerous geloescht, archiviert oder kontrolliert neu aufgebaut werden.

## Vorheriger Git-Status

Untracked:

- `app/admin/planner-os/page.tsx`
- `app/claim/[token]/page.tsx`
- `app/planner/dashboard/page.tsx`
- `app/planner/import/page.tsx`
- `app/planner/invitations/page.tsx`
- `app/planner/lists/page.tsx`
- `app/planner/page.tsx`
- `app/planner/profile/page.tsx`
- `app/planner/suggestions/page.tsx`
- `components/planner-csv-import.tsx`
- `components/planner-shell.tsx`
- `lib/actions/coverage-dangerous.ts`
- `lib/mail/planner-invitations.ts`
- `lib/planner-data.ts`
- `lib/planner-matching.ts`
- `supabase/migrations/20260615002000_claim_requests.sql`
- `supabase/migrations/20260615003000_enrichment_visibility_and_upgrades.sql`
- `supabase/migrations/20260617001000_planner_os.sql`

Tracked dirty files: keine.

## Klassifizierung A bis D

### A - Behalten und spaeter separat bauen

#### Planner OS Code

Dateien:

- `app/admin/planner-os/page.tsx`
- `app/planner/dashboard/page.tsx`
- `app/planner/import/page.tsx`
- `app/planner/invitations/page.tsx`
- `app/planner/lists/page.tsx`
- `app/planner/page.tsx`
- `app/planner/profile/page.tsx`
- `app/planner/suggestions/page.tsx`
- `components/planner-csv-import.tsx`
- `components/planner-shell.tsx`
- `lib/planner-data.ts`
- `lib/planner-matching.ts`
- `supabase/migrations/20260617001000_planner_os.sql`

Risiko: hoch.

Bewertung:

- Fachlich plausibler spaeterer Modulbereich.
- Aktuell halbfertig und nicht fuer Public-Go-live notwendig.
- Routen unter `/planner` sind durch Middleware Basic Auth geschuetzt, aber untracked Dateien werden lokal von Next trotzdem als Routen erkannt.
- `lib/planner-data.ts` erzeugt bei Aufruf Default-Profile und Planner-Datensaetze.
- `lib/actions/planner.ts` ist bereits committed und schreibt private Kontakte, Suggestions und Planner-Profile; die untracked UI wuerde diese Aktionen nutzbar machen.
- Planner OS braucht eigene Migration, Rollenmodell, Datenschutz-/UWG-Review und klare Outbox-/Approval-Gates.

Empfehlung: nicht committen. In einem eigenen Sprint entscheiden, ob der Planner-Code archiviert oder mit vollstaendigem Safety Design neu aufgebaut wird.

#### Claim Token Flow

Dateien:

- `app/claim/[token]/page.tsx`
- `supabase/migrations/20260615002000_claim_requests.sql`

Risiko: hoch.

Bewertung:

- Der Token-Flow nutzt `publishClaimSuggestion` und `rejectClaimSuggestion` aus `lib/actions`.
- Diese Funktionen sind aktuell in `lib/actions/approval-required.ts` blockiert und werfen nur einen approval-pflichtigen Fehler.
- Die Seite selbst formuliert aber "Daten freigeben und Profil veroeffentlichen" und "Vorschlag loeschen / widersprechen"; das passt noch nicht zur aktuellen Safety-Doktrin.
- Die Migration legt `claim_requests` an, ist aber fuer den aktuellen Claim-Antrag ueber `company_claims`/`company_submissions` nicht notwendig.

Empfehlung: nicht committen. Spaeter als eigener "Claim Token mit Approval Gate"-Sprint neu schneiden.

#### Mail-/Outreach Builder

Datei:

- `lib/mail/planner-invitations.ts`

Risiko: mittel bis hoch.

Bewertung:

- Enthält nur eine Funktion zum Bauen von Betreff und Body.
- Kein SMTP, kein Resend, kein externer Mailversand, kein API-Aufruf.
- Trotzdem Outreach-Kontext mit Claim-/Delete-Link und muss rechtlich/UWG sauber geprueft werden.

Empfehlung: nicht committen. Spaeter in einen Outbox-only Sprint mit explizitem Versandverbot und Legal Review aufnehmen.

### B - Jetzt sicher committen

Keine der untracked Altlasten ist aktuell als Codepaket sicher genug fuer einen Go-live-Commit.

Dieser Report ist als einziges sicheres Paket commitbar:

- `reports/worktree-risk-cleanup-2026-06-28.md`

### C - Zurueckstellen, nicht committen

#### Enrichment-/Revenue-/Visibility Migration

Datei:

- `supabase/migrations/20260615003000_enrichment_visibility_and_upgrades.sql`

Risiko: hoch.

Bewertung:

- Erweitert `companies` um Duplicate-/Trade-Mapping-Status.
- Erweitert `company_trades` um `visibility_level` und Status-Constraint.
- Legt `profile_upgrade_requests` und `payment_intents` an.
- Referenziert `claim_requests`, das selbst untracked und nicht freigegeben ist.
- Nicht notwendig fuer den aktuellen Public-Go-live.

Empfehlung: zurueckstellen. Separat reviewen, weil Revenue-/Payment-Tabellen und Claim-Request-Abhaengigkeit enthalten sind.

#### Planner Migration

Datei:

- `supabase/migrations/20260617001000_planner_os.sql`

Risiko: hoch.

Bewertung:

- Legt `profiles`, `planners`, `planner_imports`, `planner_private_contacts`, `company_suggestions`, `invitations` und `planner_reference_projects` an.
- Erweitert `companies` und `trades`.
- Enthält private Kontaktdaten, Einladungen und Contribution-/Access-Logik.
- Nicht notwendig fuer den aktuellen Go-live.

Empfehlung: zurueckstellen. Erst nach Datenschutz-, Rollen-, RLS- und Product-Review.

### D - Verwerfen/loeschen

Noch keine Datei wurde automatisch geloescht.

Kandidaten fuer Loeschung oder Archivierung nach expliziter Freigabe:

- `lib/actions/coverage-dangerous.ts`, falls die gefaehrlichen Aktionen durch Approval-Requests dauerhaft ersetzt bleiben.
- `app/claim/[token]/page.tsx`, falls der Token-Claim-Flow nicht kurzfristig rechts-/produktlogisch sauber gebaut wird.
- Planner UI-Dateien, falls Planner OS nicht Teil des kurzfristigen Go-live ist.

## Sicherheitspruefung Einzelbereiche

### `lib/actions/coverage-dangerous.ts`

Importiert/erreichbar:

- Kein committed `git grep` Treffer fuer Import oder Nutzung.
- In `/admin/coverage` werden aktuell Approval-Request-Actions genutzt, nicht diese Datei.

Risiko:

- `deleteRegionalCandidate` fuehrt echtes `delete()` auf `company_candidates` aus.
- `acceptRegionalCandidate` kann aus Kandidaten echte `companies` mit `public_visible: true` anlegen.
- Es setzt Kandidaten auf `promoted`, schreibt `company_sources` und `company_trades`.
- Damit handelt es sich um echte Publish-/Delete-Logik.

Empfehlung:

- Nicht committen.
- Entweder loeschen oder in einem spaeteren Sprint als blockierte/approval-pflichtige Ausfuehrungsstufe neu bauen.

### `lib/mail/*`

Dateien:

- `lib/mail/planner-invitations.ts`

Erreichbarkeit:

- Kein committed Import gefunden.

Risiko:

- Kein echter Versand.
- Erzeugt aber Outreach-Nachrichten mit Claim-/Delete-Link.
- Spaeter nur als Outbox Draft erlaubt, kein direkter Versand.

Empfehlung:

- Nicht committen.
- Erst mit Outbox-, UWG-/DSGVO- und Approval-Konzept aufnehmen.

### Planner-Dateien

Erreichbarkeit:

- Middleware schuetzt `/planner`.
- Robots disallowt `/planner/`.
- Untracked Dateien unter `app/planner` und `app/admin/planner-os` waeren im lokalen Build als Routen aktiv.
- Committed `lib/actions.ts` und `lib/actions/planner.ts` enthalten bereits Planner-Server-Actions.

Risiko:

- Private Kontaktlisten, CSV-Import, Vorschlaege und Einladungen.
- DB-Writes in Planner-Tabellen.
- Braucht uncommitted Migration.
- Noch keine vollstaendige UX-/Legal-/Rollenfreigabe.

Empfehlung:

- Nicht committen.
- Entweder aus dem Arbeitsbaum entfernen oder gezielt als separaten Planner-Sprint mit Migration, Auth, Datenschutz und Tests neu schneiden.

### Migrationen

`20260615002000_claim_requests.sql`

- Legt `claim_requests` an.
- Nicht notwendig fuer aktuellen Claim-Antrag ueber `company_claims` und `company_submissions`.
- Zurueckstellen.

`20260615003000_enrichment_visibility_and_upgrades.sql`

- Fuegt Visibility-/Payment-/Upgrade-Strukturen hinzu.
- Referenziert `claim_requests`.
- Zurueckstellen.

`20260617001000_planner_os.sql`

- Grosses Planner-Schema mit privaten Kontakten und Einladungen.
- Zurueckstellen.

## Go-live Bewertung

Public Core fuer ersten Go-live:

- Homepage
- Suche/Betriebe
- Firmenprofile
- Gewerke/Leistungsseiten
- Betrieb eintragen
- Claim-Antrag
- Preise/Test-Checkout verborgen bzw. nicht live
- Admin/Agent Cockpit geschuetzt

Nicht notwendig fuer ersten Go-live:

- Planner OS
- Mailversand
- Massen-Outreach
- gefaehrliche Coverage-Actions
- unreviewed Migrationen
- Claim-Token-Flow mit direkter Publish-/Delete-Sprache

Go-live-blockierend:

- Keine der Restdateien ist noetig fuer den Go-live.
- Blockierend waere nur, wenn diese untracked Dateien versehentlich committed oder deployed werden.

## Umgesetzt

- Keine Altdateien geloescht.
- Keine Migration ausgefuehrt.
- Keine E-Mail gesendet.
- Keine Production-Aktion ausgefuehrt.
- Dieser Risiko-Report wurde angelegt.

## Bewusst nicht umgesetzt

- Kein Commit von Planner OS.
- Kein Commit von Mail/Outreach.
- Kein Commit von Coverage-Dangerous.
- Kein Commit von unreviewed Migrationen.
- Kein automatisches Loeschen der Altlasten ohne explizite Freigabe.

## Naechste empfohlene Schritte

1. Explizit entscheiden: untracked Planner/Mail/Coverage-Dangerous/Migrationen loeschen oder in einen Archiv-/Backlog-Branch auslagern.
2. Wenn Loeschen freigegeben wird: nur untracked Altlasten entfernen, danach Typecheck/Build.
3. Danach Go-live-Check mit sauberem Worktree.
4. Planner OS erst spaeter als eigener, vollstaendiger Sprint mit Migration, Auth, Outbox und Compliance.

