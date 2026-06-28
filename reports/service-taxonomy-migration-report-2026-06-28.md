# Bauleistungs-Taxonomie Migration Report

Status: vorbereitet, nicht live angewendet.

## Geänderte Dateien

- `lib/service-taxonomy.ts`
- `lib/trade-search.ts`
- `components/trade-browser.tsx`
- `components/trade-checkbox-groups.tsx`
- `components/business-entry-form.tsx`
- `app/gewerke/page.tsx`
- `scripts/sync-service-taxonomy.mjs`
- `supabase/migrations/20260628001000_service_taxonomy.sql`
- `package.json`

Zusätzlich existiert ein vorheriger uncommitted SEO-Slice, der separate Dateien wie `lib/seo.ts`, `app/orte/*`, `app/sitemap.ts`, `app/robots.ts` und Public-Directory-Metadata betrifft.

## Tabellen / Models

Die Migration ergänzt reviewbar und idempotent:

- `trade_groups`
- Erweiterungen an `trades`: `trade_group_id`, `description`, `sort_order`, `is_active`, `canonical_trade_id`
- `service_families`
- `services`
- `service_aliases`
- `activities`
- `service_activities`
- `contexts`
- `service_contexts`
- `service_crosslinks`
- `company_services`
- `company_service_activities`
- `company_contexts`

Bestehende Tabellen wie `trades`, `company_trades`, `trade_synonyms` und `trade_slug_aliases` bleiben erhalten.

## Seed-Daten

Die Seed-Daten liegen in `lib/service-taxonomy.ts` und werden über `scripts/sync-service-taxonomy.mjs` synchronisiert.

Dry Run:

- 19 Hauptgruppen
- 80 eindeutige Gewerke-Slugs
- 84 Leistungsfamilien
- 924 Spezialleistungen
- 267 Service-Aliases
- 28 Tätigkeiten
- 32 Kontexte

Das Sync-Skript ist standardmäßig Dry Run. Live-Schreiben erfordert:

```bash
node scripts/sync-service-taxonomy.mjs --live --confirm-live sync-service-taxonomy-live
```

Bei nicht-lokaler Supabase-URL greift zusätzlich das bestehende Production-Write-Gate.

## Mapping alter Gewerke

Bestehende Slugs werden nicht gelöscht. Die neue Service-Taxonomie nutzt vorhandene Slugs, z. B.:

- `maurerarbeiten`
- `betonbau`
- `kernbohrungen`
- `bauwerksabdichtung`
- `zimmererarbeiten`
- `dachdeckerarbeiten`
- `spenglerarbeiten`
- `verputzarbeiten`
- `sanitaerinstallation`
- `heizungsbau`
- `elektroinstallation`
- `photovoltaik`
- `trockenbau`
- `fliesenarbeiten`
- `estricharbeiten`
- `malerarbeiten`
- `metallbau`
- `garten-landschaftsbau`
- `pflasterarbeiten`
- `schreinerarbeiten`

Alte Alias-Regeln bleiben in `tradeSlugAliases` erhalten. Unklare oder noch nicht in der bestehenden Code-Taxonomie vorhandene Spezialbereiche werden als Trade-Slugs in der Service-Taxonomie vorbereitet, ohne bestehende Firmenzuordnungen zu entfernen.

## Slugs und Redirects

Slug-Regeln:

- lowercase
- `ä -> ae`
- `ö -> oe`
- `ü -> ue`
- `ß -> ss`
- Leerzeichen/Sonderzeichen zu Bindestrichen

Bestehende Trade-Slugs bleiben erhalten. Neue Service-Slugs sind für spätere URLs wie `/leistungen/lehmputz/rosenheim` vorbereitet, aber solche Landingpages wurden in diesem Slice noch nicht gebaut.

## Neue Hauptgruppen

Die öffentliche Gewerke-Seite nutzt nun die 19 Hauptgruppen in Bauleistungslogik:

1. Planung, Gutachten & Bauleitung
2. Baustellenvorbereitung, Gerüst & Baulogistik
3. Abbruch, Rückbau & Schadstoffe
4. Erd-, Tief- & Spezialtiefbau
5. Rohbau, Beton, Mauerwerk & Tragwerk
6. Holzbau, Zimmerer & Fertigbau
7. Dach, Abdichtung & Spengler
8. Fassade, Putz, Stuck & Dämmung
9. Fenster, Türen, Glas & Sonnenschutz
10. Sanitär, Heizung, Klima, Lüftung & Kälte
11. Elektro, Energie, Sicherheit, IT & Automation
12. Trockenbau, Innenausbau & Akustik
13. Estrich, Boden, Fliesen & Naturstein
14. Maler, Oberflächen & Beschichtungen
15. Metallbau, Stahlbau & Schlosser
16. Außenanlagen, Garten, Landschaft & Verkehr
17. Sanierung, Restaurierung & Spezialverfahren
18. Reinigung, Wartung & Facility Services
19. Möbel, Küchen, Ausstattung & Sonderausbau

## Wichtige Spezialleistungen

Unter anderem enthalten:

- Lehmputz
- Lehmfeinputz
- Tadelakt
- Putzfräsen
- WDVS
- Einblasdämmung
- Gastherme
- Gasthermenwartung
- Hackschnitzelheizung
- Wärmepumpe
- Fußbodenheizung fräsen
- Kernbohrung
- Brandschutzdecke
- Photovoltaik
- PV-Anlage
- Wallbox
- KNX
- Estrich fräsen
- EPDM
- Dachfenster
- Badsanierung

## Aliases und Suche

`lib/trade-search.ts` berücksichtigt jetzt zusätzlich:

- Hauptgruppen
- Leistungsfamilien
- Spezialleistungen
- Service-Aliases
- Tätigkeiten
- Kontexte
- Crosslinks

Beispiele, die über die neue Suchbasis abgedeckt sind:

- `Rigips`
- `Brennwerttherme`
- `FBH fräsen`
- `PV`
- `Spengler`
- `Klempner`
- `Blechner`

## Crosslinks

Crosslinks sind in der Service-Taxonomie vorbereitet, z. B.:

- PV-Dachmontage zu Photovoltaik / Elektro
- Badsanierung zu Fliesen / Trockenbau / Elektro über Service-Kontext vorbereitet
- Dachabdichtung und EPDM im Dach-/Abdichtungsbereich
- Putzfräsen mit Sanierung/Rückbau-Kontext

Die DB-Tabelle `service_crosslinks` ist vorhanden. Konkrete SEO-Landingpage-Crosslinks werden später aufgebaut.

## UI-Änderungen

- `/gewerke` zeigt Hauptgruppen nach Bauleistungslogik.
- Gewerke werden unter Hauptgruppen angezeigt.
- Spezialleistungen erscheinen kompakt als häufig gesuchte Chips.
- Die Suche findet Spezialleistungen über die bestehende Ranking-Funktion.
- Das Betriebseintragsformular bietet Spezialleistungen aus der neuen Taxonomie an.
- Die Gewerk-Auswahl im Betriebseintrag verwendet die neue Hauptgruppenstruktur.

## Offene fachliche Entscheidungen

- Welche Spezialleistungen später eigene indexierbare Landingpages bekommen.
- Welche Service-Seiten zuerst regional ausgerollt werden.
- Welche Services `seo_enabled=true` erhalten.
- Ob unklare neue Trade-Slugs in der bestehenden flachen Trade-Taxonomie zusätzlich als eigene öffentliche Gewerkeseiten auftauchen sollen.
- Wie tief Tätigkeiten und Kontexte im Onboarding sofort auswählbar sein sollen.
- Ob `company_services` aus bestehenden `selected_services` rückwirkend befüllt wird.

## Checks

Ausgeführt:

- `node scripts/sync-service-taxonomy.mjs` als Dry Run: erfolgreich, keine Writes.
- `tsc --noEmit`: erfolgreich.
- `next build`: erfolgreich.

Nicht ausgeführt:

- Keine Live-Migration.
- Kein Supabase-Link.
- Kein `supabase db push`.
- Keine Remote-SQL.
- Keine Production-Datenänderung.

