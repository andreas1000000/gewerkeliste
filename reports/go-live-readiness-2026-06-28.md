# Go-live Readiness - 2026-06-28

Status: active
Owner: Andi
Scope: lokaler Readiness-Check, kein Push, kein Deploy, keine Production-Aktion

## 1. Aktueller Commit-Stand

HEAD:

- `b319be8 Document and isolate remaining worktree risks`

Letzte relevante Commits:

- `b319be8 Document and isolate remaining worktree risks`
- `b197fba Harden claim submission actions`
- `58a09a7 Improve marketing pages and SEO basics`
- `db1d212 Improve trade taxonomy and service pages`
- `99bdf93 Improve business entry and claim UX`
- `aec5fa9 Improve public search and businesses directory`
- `9fb1e52 Improve public company profile UX`
- `484ae7e Stabilize local project tooling`
- `0fe91dc Clean up repository ignore rules`
- `73d9d9a Add deep service taxonomy browsing`

## 2. Arbeitsbaumstatus

Ergebnis:

- `git status --short`: leer
- `git ls-files --others --exclude-standard`: leer
- `git clean -nd`: leer
- `git diff --stat`: leer

Bewertung:

- Der aktive Worktree ist sauber.
- Die vorherigen untracked Planner-/Mail-/Dangerous-/Migration-Altlasten wurden aus dem aktiven Projekt entfernt und vorher unter `/private/tmp/gewerkeliste-untracked-backup-2026-06-28-2020` gesichert.

## 3. Typecheck Ergebnis

Befehl:

```bash
npm run typecheck
```

Ergebnis:

- erfolgreich
- `tsc --noEmit` ohne Fehler

## 4. Build Ergebnis

Befehl:

```bash
npm run build
```

Ergebnis:

- erfolgreich
- Next.js Production Build erfolgreich
- 22 Routen generiert
- keine Planner- oder Claim-Token-Routen mehr im Build
- Admin-Routen bleiben dynamisch und durch Middleware geschuetzt

Hinweis:

- Nach dem Entfernen der untracked Routen musste der Build einmal laufen, damit `.next/types` neu erzeugt wird. Danach war auch der Typecheck sauber.

## 5. Taxonomie-Test Ergebnis

Befehl:

```bash
npm run taxonomy:services:test
```

Ergebnis:

- erfolgreich
- Status: `ok`
- Gruppen: 19
- Gewerke: 80
- Leistungen: 979
- Regeln `asphalt_aliases_not_canonical`, `no_duplicate_service_slug_in_family` und `required_crosslinks_exist` bestanden.

## 6. Gepruefte Public-Routen

Lokaler Server:

- `http://127.0.0.1:3010`

Ergebnis:

| Route | Status | Bewertung |
| --- | ---: | --- |
| `/` | 200 | ok |
| `/suche` | 200 | ok |
| `/betriebe` | 200 | ok |
| `/gewerke` | 200 | ok |
| `/gewerke/bauunternehmen` | 200 | ok |
| `/gewerke/dachdeckerarbeiten` | 200 | ok |
| `/gewerke/sanitaerinstallation` | 200 | ok |
| `/gewerke/elektroinstallation` | 200 | ok |
| `/gewerke/schreinerarbeiten` | 200 | ok |
| `/gewerke/bauunternehmen/rosenheim` | 200 | ok |
| `/gewerke/dachdeckerarbeiten/kolbermoor` | 200 | ok |
| `/gewerke/elektroinstallation/rosenheim` | 200 | ok |
| `/gewerke/schreinerarbeiten/riedering` | 200 | ok |
| `/betrieb-eintragen` | 200 | ok |
| `/ueber-gewerkeliste` | 200 | ok |
| `/impressum` | 200 | ok |
| `/datenschutz` | 200 | ok |
| `/robots.txt` | 200 | ok |
| `/sitemap.xml` | 200 | ok |

Bewusst nicht live:

| Route | Status | Bewertung |
| --- | ---: | --- |
| `/preise` | 404 | absichtlich deaktiviert |
| `/zahlung-erfolgreich` | 404 | absichtlich deaktiviert |
| `/zahlung-abgebrochen` | 404 | absichtlich deaktiviert |

Hinweise:

- `/preise`, `/zahlung-erfolgreich` und `/zahlung-abgebrochen` enthalten `notFound()` und `robots: { index: false, follow: false }`.
- `/api/stripe/checkout` ist deaktiviert und gibt `checkout_disabled` mit HTTP 404 zurueck.
- Ein zunaechst getesteter Slug `/gewerke/architektur-entwurf` lieferte 404, weil dieser Slug nicht Bestandteil der aktuellen Gewerk-Taxonomie ist. Gueltige Gewerk-Slugs wurden danach erfolgreich getestet.

## 7. Gepruefte Admin-Schutzrouten

Ohne Login:

| Route | Status | Bewertung |
| --- | ---: | --- |
| `/admin/agents` | 401 | geschuetzt |
| `/admin/coverage` | 401 | geschuetzt |
| `/admin/agents/municipality-discovery` | 401 | geschuetzt |
| `/planner` | 401 | durch Middleware geschuetzt; keine App-Route mehr im Repo |
| `/planner/dashboard` | 401 | durch Middleware geschuetzt; keine App-Route mehr im Repo |

Bewertung:

- Admin-Bereich ist durch Basic Auth Middleware geschuetzt.
- `/planner` ist weiterhin in Middleware/robots blockiert, aber aktive Planner-Routen liegen nicht mehr im App-Router.
- Gefaehrliche Coverage-Actions liegen nicht mehr im aktiven Worktree.
- Mail-/Outreach-Code liegt nicht mehr im aktiven Worktree.

## 8. Security-/Secret-/Risk-Checks

Geprueft:

- `.env.local` ist nicht im Git.
- Keine untracked Dateien vorhanden.
- Keine aktiven unreviewed Migrationen im Worktree.
- Keine `sk_live_...`, `sk_test_...`, `sbp_...`, `vcp_...` oder `github_pat_...` Tokenmuster im Repo gefunden.
- Keine Supabase-Service-Role-Keys als Secret im Code gefunden.
- `lib/supabase.ts` nutzt Server-ENV, gibt aber keine Keys aus.
- Stripe Checkout ist deaktiviert.
- Keine echten E-Mails aktiv.
- Keine Mail-/Outreach-Automation aktiv.
- Keine `coverage-dangerous.ts` im aktiven Projekt.
- Robots blockiert `/admin/`, `/api/`, `/claim/`, `/companies/`, `/trades/`, `/planner/`, `/betriebe/*/claim`, `/preise`, `/zahlung-erfolgreich`, `/zahlung-abgebrochen`.

Hinweise:

- `supabase/migrations/20260618002000_admin_service_role_grants.sql` enthaelt `service_role` als Rollenname in SQL, nicht als Secret.
- `docs/ops/GO_LIVE_REVENUE_CHECKLIST.md` enthaelt offene Checklistenpunkte fuer Recht, Stripe und Revenue.
- `NEXT_PUBLIC_SITE_URL` war lokal auf `http://localhost:3002` gesetzt, daher zeigen lokale Sitemap-/Robots-Ausgaben auf localhost. Fuer Production muss `NEXT_PUBLIC_SITE_URL=https://gewerkeliste.com` gesetzt sein.

## 9. Offene Go-live-TODOs

Vor Git Push:

- Keine technischen Blocker gefunden.

Vor Vercel Preview:

- Preview-Environment muss `ADMIN_SECRET` gesetzt haben, sonst Admin-Routen liefern 500 statt 401.
- `NEXT_PUBLIC_SITE_URL` fuer Preview/Production bewusst setzen.

Vor Production Deploy:

- `ADMIN_SECRET` in Production gesetzt und getestet.
- `NEXT_PUBLIC_SITE_URL=https://gewerkeliste.com` gesetzt.
- Impressum und Datenschutz final fachlich/rechtlich pruefen.
- Keine UG/Rechtsform faelschlich genannt: aktueller Owner ist `Einzelunternehmer / Andreas Moser Baugewerbe`.
- Revenue bleibt deaktiviert: `/preise`, Zahlungserfolg, Zahlungsabbruch und Checkout sind nicht live.
- Stripe-Live-Mode nicht aktivieren, bis Checkliste erledigt ist.
- Keine echten E-Mails senden.
- Keine Production-Migration ohne separate Review/Freigabe.
- Erste Production-Smoke-Tests nach Deploy manuell mit echter Domain wiederholen.
- Optional: final pruefen, ob `/preise` als 404 fuer aktuellen Go-live gewollt bleibt.

## 10. Empfehlung

Bereit fuer Git Push:

- Ja, aus technischer Sicht.
- Arbeitsbaum sauber, Tests gruen, keine Secrets gefunden.

Bereit fuer Vercel Preview Deploy:

- Ja, wenn Preview-ENV mindestens `ADMIN_SECRET` und sinnvolle Public-ENV enthaelt.
- Kein Production-Deploy in diesem Check ausgefuehrt.

Bereit fuer Production Deploy:

- Bedingt.
- Technischer Build ist bereit.
- Production sollte erst erfolgen, wenn die offenen Production-TODOs bestaetigt sind: `ADMIN_SECRET`, `NEXT_PUBLIC_SITE_URL`, Impressum/Datenschutz final, Preise/Stripe bewusst deaktiviert oder final freigegeben.

## 11. Risiken

- Revenue-Seiten sind bewusst 404. Das ist aktuell sicher, aber muss vor Monetarisierung wieder kontrolliert aktiviert werden.
- Sitemap/Robots verwenden lokal `NEXT_PUBLIC_SITE_URL`; falsche Production-ENV wuerde falsche URLs erzeugen.
- Admin-Schutz haengt an `ADMIN_SECRET`; fehlt es in Production, ist Admin nicht nutzbar.
- Keine Production-Datenbankmigration wurde in diesem Check ausgefuehrt oder verifiziert.
- Rechtliche Inhalte wurden technisch geprueft, aber nicht juristisch bewertet.

## 12. Naechste Befehle - nicht ausgefuehrt

Wenn Andi Push freigibt:

```bash
git push origin main
```

Wenn Andi Preview freigibt:

```bash
vercel
```

Wenn Andi Production nach finaler Freigabe deployen will:

```bash
vercel --prod
```

Nach Preview/Production:

```bash
curl -I https://gewerkeliste.com/
curl -I https://gewerkeliste.com/suche
curl -I https://gewerkeliste.com/gewerke
curl -I https://gewerkeliste.com/admin/agents
```

