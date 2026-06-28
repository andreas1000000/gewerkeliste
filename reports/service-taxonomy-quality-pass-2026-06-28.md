# Service-Taxonomie Quality Pass 2026-06-28

Status: abgeschlossen als lokaler Code-/Taxonomie-Sprint. Keine Live-Datenbank-Aktion, kein `supabase link`, kein `supabase db push`, kein Commit, kein Push.

## Ziel

Die neue Bauleistungs-Taxonomie wurde fachlich an mehreren Stellen korrigiert, damit Suchanfragen nicht in falsche Gewerkelogik laufen:

- Loftwände / Stahl-Glas-Systeme fachlich bei Metallbau & Schlosserei verorten.
- Kunstmalerei und dekorative Wand-/Fassadengestaltung von Graffitientfernung trennen.
- Asphalt-Leistungen fachlich als Asphalt-/Straßenbau-Canonicals führen, umgangssprachliche Suchbegriffe nur als Aliases nutzen.
- Doppelboden, Hohlboden und Systemböden als eigenen Bereich im Innenausbau sichtbar machen.

## Geprüfte Begriffe

### Loftwände / Stahl-Glas

Geprüft:

- Loftwand
- Loftwände
- Stahl-Glas-Wand
- Stahlglaswand
- Stahl-Glas-Trennwand
- Industrie-Trennwand
- Glastrennwand
- Stahlrahmentür
- Lofttür

Umsetzung:

- Hauptgruppe: Metallbau, Stahlbau & Schlosser
- Gewerk: Metallbau & Schlosserei
- Familie: Loftwände & Stahl-Glas-Systeme
- Canonicals: Loftwand, Stahl-Glas-Trennwand, Stahl-Glas-Wand, Glas-Metall-Trennwand, Stahlrahmentür, Lofttür, Industrietrennwand, Metall-Glas-Trennwand
- Aliases: Loftwände, Stahlglaswand, Stahl Glas Wand, Stahl Glas Trennwand, Industrie Glaswand, Industrial Style Wand, Industrial Loftwand, Loft Trennwand, Glaswand mit Stahlrahmen, Schlosser Loftwand, Metallbauer Loftwand
- Tätigkeiten: Beratung, Planung, Fertigung, Lieferung, Montage, Einbau, Reparatur
- Kontexte: Wohnung, Büro, Gewerbe, Gastronomie, Altbau, Bestand, Innenausbau
- Crosslinks: glaserarbeiten, innenausbau

Ergebnis:

- `Loftwand` trifft Metallbau & Schlosserei.
- `Stahlglaswand` trifft die Loftwand-Familie als Alias.

## Kunstmalerei / Graffiti

Geprüft:

- Kunstmalerei
- Wandmalerei
- Fassadenmalerei
- Graffiti-Gestaltung
- Street-Art
- Lüftlmalerei
- Illusionsmalerei
- Trompe-l'oeil
- Ornamentmalerei
- Schablonenmalerei
- Airbrush
- Schriftmalerei

Umsetzung:

- Gewerk: Dekorative Oberflächen & Kunstmalerei
- Familie: Kunstmalerei
- Graffitientfernung bleibt weiterhin getrennt in Sanierung/Reinigung, nicht in Kunstmalerei.

Ergebnis:

- `Lüftlmalerei`, `Graffiti Gestaltung`, `Street Art`, `Wandmalerei` und `Trompe l oeil` treffen Kunstmalerei.
- `Graffiti entfernen` trifft keine Kunstmalerei, sondern Reinigungs-/Sanierungslogik.

## Asphalt

Korrektur:

- `Hof asphaltieren`
- `Zufahrt asphaltieren`
- `Parkplatz asphaltieren`

wurden nicht als Canonical-Leistungen geführt, sondern als Such-Aliases.

Canonicals:

- Asphaltarbeiten
- Asphaltbau
- Asphaltbelag
- Asphaltdeckschicht
- Asphalttragschicht
- Asphaltfeinbelag
- Walzasphalt
- Gussasphalt
- Kaltasphalt
- Splittmastixasphalt
- Asphaltreparatur
- Asphaltfräsen
- Asphalt schneiden
- Asphaltabdichtung
- Fahrbahnsanierung
- Parkplatzbau
- Straßenbau
- Wege- und Verkehrsflächenbau
- Fahrbahnmarkierung

Ergebnis:

- `Hof asphaltieren` und `Zufahrt asphaltieren` finden Asphalt/Straßenbau, bleiben aber Aliases.
- `Kaltasphalt` ist Canonical im Bereich Verkehrsflächen.

## Doppelboden / Systemböden

Umsetzung:

- Hauptgruppe: Trockenbau, Innenausbau & Akustik
- Gewerk: Innenausbau & Ausbaugewerke
- Familie: Systemböden & Hohlraumböden
- Canonicals: Doppelboden, Hohlboden, Hohlraumboden, Systemboden, Installationsboden, Trockenhohlboden, Nasshohlboden, Revisionsboden, Kabelboden, EDV-Boden, Doppelbodenplatten, Doppelbodensanierung, Doppelbodenmontage, Hohlbodensanierung
- Aliases: Raised Floor, Access Floor, Computerboden, Serverraum Doppelboden, Technikboden, Installationshohlraum, Büro Doppelboden, Rechenzentrum Doppelboden, Kabelmanagement Boden, Hohlraumboden, Hohlraumböden
- Crosslinks: bodenlegerarbeiten, netzwerktechnik, kaelte-klima

Ergebnis:

- `Doppelboden`, `Hohlboden`, `Raised Floor`, `Access Floor` und `EDV-Boden` treffen Systemböden & Hohlraumböden.

## Lokale Prüfergebnisse

Ausgeführt:

```bash
node scripts/sync-service-taxonomy.mjs
node scripts/test-service-taxonomy.mjs
```

Dry-Run-Ergebnis:

- Gruppen: 19
- Gewerke: 80
- Leistungsfamilien: 87
- Spezialleistungen: 979
- Aliases: 319
- Tätigkeiten: 33
- Kontexte: 45
- Live-Upserts: 0

Test-Ergebnis:

- Loftwand-Suche: grün
- Stahlglaswand-Suche: grün
- Kunstmalerei-/Street-Art-/Lüftlmalerei-Suche: grün
- Graffiti entfernen nicht Kunstmalerei: grün
- Asphalt-Aliases nicht Canonical: grün
- Doppelboden/Systemboden-Suche: grün
- Doppelte Service-Slugs innerhalb derselben Familie: keine gefunden
- Erforderliche Crosslinks für Loftwände und Systemböden: vorhanden

## Geänderte Dateien

- `lib/service-taxonomy.ts`
- `scripts/test-service-taxonomy.mjs`
- `package.json`
- `reports/service-taxonomy-quality-pass-2026-06-28.md`

## Noch offen

- Keine Live-Synchronisation der Service-Taxonomie durchgeführt.
- Kein Production-DB-Schema oder Datenbestand verändert.
- Falls diese Service-Taxonomie produktiv genutzt werden soll, muss die bestehende Service-Taxonomie-Migration kontrolliert reviewt und separat freigegeben werden.
