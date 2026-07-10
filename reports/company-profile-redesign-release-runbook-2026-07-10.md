# Company Profile Redesign Release Runbook

Datum: 2026-07-10
Branch: `feature/profile-redesign`
Scope: neue öffentliche Firmenprofilseite, Profilmodule, Metadaten, Fixture-Guards und lokale Release-Readiness.

## Harte Grenzen

- Kein Production-Deploy ohne ausdrückliche Freigabe.
- Kein Vercel-Deploy ohne ausdrückliche Freigabe.
- Kein GitHub-Push und kein Merge nach `main` im Rahmen dieses Runbooks.
- Keine Remote-Supabase-Migration aus diesem lokalen Prüfablauf heraus.
- Keine Live-Datenänderung, keine produktiven Secrets und keine vollständigen Verbindungsstrings dokumentieren.

## Vorbereitung

1. Branch prüfen: `feature/profile-redesign`.
2. Arbeitsbaum prüfen und sicherstellen, dass nur erwartete Release-Änderungen enthalten sind.
3. Phase-2- und Phase-3-Commits prüfen, insbesondere Profil-Redesign, Profilmodule, Tests und lokale Fixture-Absicherung.
4. Datenbankbackup beziehungsweise Wiederherstellungspunkt für Production bestätigen.
5. Production-Umgebungsvariablen nur in der geschützten Umgebung prüfen: Supabase-URL, Service-Role-Key, Admin-Secret, Site-URL und Vercel-Umgebung.
6. Vercel-Preview-Umgebung prüfen: eigene Variablen, Supabase-Ziel, Schreibrechte und `VERCEL_ENV=preview`.
7. Prüfen, ob Preview und Production dieselbe Supabase-Datenbank nutzen. Wenn nicht eindeutig getrennt, Preview ausschließlich lesend testen.
8. Prüfen, ob Branch-Push automatisch einen Preview-Deploy auslöst.

## Empfohlene Reihenfolge

1. Backup beziehungsweise Wiederherstellungspunkt bestätigen.
2. Additive Migrationen in der vorbereiteten Reihenfolge ausführen.
3. Schema, RLS, Grants, Constraints, Trigger und Indizes prüfen.
4. Anwendung deployen.
5. Smoke Tests durchführen.
6. Relevante Firmenprofile prüfen.
7. Logs und Fehler prüfen.
8. Erst danach Release abschließen.

## Migrationen

Reihenfolge für das Profil-Redesign:

1. `20260710123000_public_profile_compatibility.sql`
2. `20260710165000_profile_presentation_modules.sql`
3. `20260710190000_public_profile_service_role_grants.sql`

Zusammenhang mit früheren vorbereitenden Migrationen:

- `company_trades.visibility_level` muss vor der finalen Profilabfrage vorhanden oder vom Anwendungscode kompatibel behandelt werden.
- `companies.service_countries` muss additiv vorhanden sein oder leer behandelt werden.
- Profilmodule sind additiv und dürfen bestehende Kernprofile nicht blockieren.
- Service-Role-Grants sind für serverseitige öffentliche Profilabfragen erforderlich.

Prüfpunkte:

- Migrationen sind additiv und enthalten keine destruktiven Datenänderungen.
- Defaults verhindern unbeabsichtigte öffentliche Sichtbarkeit.
- RLS bleibt aktiv; öffentliche Modulzeilen werden nur serverseitig und statusgefiltert gelesen.
- Constraints verhindern unbekannte Status- und Prüfwerte.
- Trigger aktualisieren `updated_at`.
- Anwendungscode toleriert fehlende optionale Modultabellen, aber nicht beliebige unbekannte Kernfehler.

## Preview-Audit

Anhand des Repositories ist nicht eindeutig feststellbar, ob Vercel Preview und Production getrennte Supabase-Instanzen verwenden. Die lokale `.vercel`-Verknüpfung zeigt nur, dass das Verzeichnis mit einem Vercel-Projekt verbunden ist; Details zu Preview-Variablen wurden nicht verändert.

Wenn Preview dieselbe Datenbank wie Production nutzt:

- Preview nur lesend testen.
- Keine Admin-Aktionen ausführen.
- Keine Submission-, Claim- oder Profiländerungen ausführen.
- Keine Migration über Preview auslösen.
- Keine Datenkorrekturen im Preview-Kontext durchführen.

Erwartetes SEO-Verhalten:

- `VERCEL_ENV=production`: Profilseiten indexierbar.
- `VERCEL_ENV=preview`: Profilseiten `noindex,nofollow`.
- lokale Umgebung: `noindex,nofollow`.
- Canonical verweist immer auf `https://gewerkeliste.com`.

## Smoke Tests

Profile:

- MetallteQ
- Wagner und Spielvogel
- Basisprofil
- Sparse-Profil
- Profil mit Kontakten
- Profil mit Zertifikaten

Funktional:

- Suche und interne Verlinkungen
- JSON-LD und BreadcrumbList
- Mobilansicht bei 390 px und 320 px
- Kontaktlinks: Telefon, E-Mail, Website
- Bilder und Alt-Texte
- Keine sichtbaren internen Fixture-, Review- oder Debugdaten
- Keine NotFound-Seite bei bestehenden Profilen

## Rollback

Standard-Rollback:

1. Anwendung auf den vorherigen stabilen Commit zurücksetzen.
2. Additive Tabellen und Spalten bestehen lassen, sofern sie den Altcode nicht stören.
3. Keine destruktive Rückmigration als Standardmaßnahme.
4. Logs, Fehlerquote und Profilseiten erneut prüfen.

Rollback-Kriterien:

- Profilseiten werfen serverseitige Fehler statt stabiler 200-/404-Antworten.
- Production erhält versehentlich `noindex`.
- Preview oder lokale Testdaten erscheinen öffentlich in Suche, Sitemap oder JSON-LD.
- Verifizierungstexte suggerieren Qualitäts-, Referenz- oder Leistungsprüfung.
- Kontaktlinks oder Kernprofilinhalte fallen auf mehreren Profiltypen aus.

## Abschlusskriterien

- Typecheck, Lint, Build und Tests erfolgreich.
- Lokale Migrationstests erfolgreich.
- JSON-LD validierbar und ohne private/lokale Inhalte.
- Preview-/Production-Metadaten geprüft.
- Accessibility- und Lighthouse-Prüfung dokumentiert.
- Screenshots für Desktop, Mobil und 320-px-Fälle erzeugt.
- Kein Push, kein Deploy, kein Merge und keine Remote-Migration im lokalen Abschluss.
