# Agent Data Acquisition Policy

Diese Richtlinie gilt fuer alle Research-, Import- und Enrichment-Agenten von GewerkeListe.com.

## Ziel

Der Agent baut eine moeglichst vollstaendige, aktuelle und qualitativ hochwertige Datenbasis von Handwerks-, Bau- und Gewerbebetrieben im DACH-Raum auf.

Der Agent identifiziert Unternehmen, findet offizielle Unternehmensquellen, prueft Plausibilitaet und erstellt strukturierte Unternehmensprofile.

Alle Schritte muessen nachvollziehbar, dokumentiert und rechtlich vorsichtig erfolgen.

## Grundprinzip

- Keine Datenbanken oder Verzeichnisse kopieren.
- Oeffentliche Quellen nur zur Identifikation und Plausibilisierung nutzen.
- Oeffentlich sichtbare Unternehmensprofile bevorzugt aus offiziellen Unternehmensquellen erstellen.
- Keine fremden Texte, Bewertungen, Bilder oder Logos uebernehmen.
- Keine personenbezogenen Daten erfassen, die fuer ein gewerbliches Unternehmensprofil nicht erforderlich sind.

## Region erfassen

Fuer jede Gemeinde, Stadt, Verwaltungsgemeinschaft, PLZ-Region oder jeden Landkreis werden nach Moeglichkeit erfasst:

- Regionsname
- Bundesland
- Land
- Geokoordinaten
- Einwohnerzahl, falls sauber verfuegbar

## Unternehmen identifizieren

Der Agent erzeugt zunaechst eine Masterliste relevanter Betriebe.

Zulaessige Identifikationsquellen:

- Handelsregister
- Unternehmensregister
- Bundesanzeiger
- oeffentliche Vergabe- und Praequalifizierungsverzeichnisse
- oeffentliche Kammerverzeichnisse
- oeffentliche Innungsverzeichnisse
- oeffentliche Gemeindeverzeichnisse
- Firmenwebsites
- Impressum
- Kontaktseiten
- Leistungsseiten
- Referenzseiten

Hinweisquellen duerfen nur zur Identifikation genutzt werden:

- Suchmaschinen
- Kartendienste
- Gelbe Seiten
- Das Oertliche
- Branchenbuecher
- sonstige Verzeichnisse

Aus Hinweisquellen duerfen keine Texte, Beschreibungen, Bewertungen, Bilder oder Datenbestaende automatisiert uebernommen werden. Sie dienen nur dazu:

- Unternehmen zu entdecken
- Firmennamen zu finden
- offizielle Firmenwebsites zu finden

## Masterliste

Fuer jedes identifizierte Unternehmen werden nur die minimal notwendigen Basisdaten gespeichert:

- Firmenname
- Ort
- Postleitzahl
- Quelle
- Vertrauensscore
- Website, falls bekannt

Betriebe duerfen nur einmal gespeichert werden. Dubletten muessen automatisch erkannt und zusammengefuehrt oder in Review gegeben werden.

## Offizielle Unternehmenswebsite finden

Fuer jeden Betrieb wird gezielt nach der offiziellen Website gesucht, z. B.:

- `"<Firmenname>" "<Ort>"`
- `"<Firmenname>" Impressum`
- `"<Firmenname>" Kontakt`
- `"<Firmenname>" Leistungen`

Eine Website gilt nur dann als offizielle Unternehmenswebsite, wenn sie plausibel zum Betrieb gehoert.

Plausibilitaetskriterien:

- Firmenname passt
- Ort oder PLZ passt
- Adresse passt
- Telefonnummer passt
- Impressum passt
- Leistungsangebot passt

## Unternehmensdaten erfassen

Primaerquellen:

- Impressum
- Kontaktseite
- Leistungsseiten
- Referenzseiten
- Ueber-uns-Seite

Moegliche Felder:

- Firmenname
- Rechtsform
- Adresse
- Telefon
- E-Mail
- Website
- Gewerke
- Spezialisierungen
- sachlich neu formulierte Leistungsbeschreibung
- Einzugsgebiet
- Zertifizierungen, nur wenn nachweisbar
- Oeffnungszeiten, optional
- Social-Media-Profile, optional

Beschreibungen muessen eigenstaendig sachlich formuliert werden. Keine fremden Website-Texte kopieren.

## Gewerkeklassifizierung

Der Agent ordnet Betriebe einer oder mehreren GewerkeListe-Kategorien zu.

Beispiele:

- KG 300 Bauwerk / Baukonstruktionen: Rohbau, Maurerarbeiten, Betonbau, Zimmererarbeiten, Dachdeckerarbeiten
- KG 400 Technische Anlagen: Elektroinstallation, SHK, Lueftung, Kaelte, Gebaeudeautomation
- KG 500 Aussenanlagen: Garten- und Landschaftsbau, Pflasterarbeiten, Tiefbau

Ein Betrieb darf mehreren Gewerken zugeordnet werden, aber nur bei konkretem Nachweis auf offizieller Quelle oder starker Plausibilitaet.

Keine falschen Massen-Zuordnungen. Ein allgemeines Bauunternehmen wird nicht automatisch allen Baugewerken zugeordnet.

## Qualitaetskontrolle

Automatisch pruefen:

- Website erreichbar
- robots.txt respektiert
- Telefonnummer plausibel
- E-Mail plausibel
- Adresse plausibel
- Dubletten vorhanden
- Gewerk plausibel
- Quelle ausreichend vertrauenswuerdig

Jeder Datensatz und jede Zuordnung bekommt einen Vertrauens- oder Confidence-Score.

Unsichere Faelle muessen in Review.

## Profilstatus

Zulaessige fachliche Statuslogik:

- `imported`: automatisch erstellt
- `verified`: durch offizielle Unternehmensquelle bestaetigt
- `claimed`: Unternehmen hat Profil uebernommen
- `needs_review`: manuelle Pruefung erforderlich
- `removed`: Loeschwunsch oder rechtlicher Grund

Wichtig fuer das aktuelle Produkt:

- `verified=true` darf nicht automatisch gesetzt werden.
- `claim_status=claimed` darf nicht automatisch gesetzt werden.
- Ein durch offizielle Website plausibilisierter Betrieb bleibt trotzdem unbestaetigt, solange er nicht vom Betrieb uebernommen oder manuell freigegeben wurde.

## Rechtliche Vorgaben

Der Agent darf niemals:

- robots.txt umgehen
- technische Schutzmassnahmen umgehen
- Logins umgehen
- Paywalls umgehen
- fremde Datenbanken kopieren
- Bewertungen anderer Plattformen uebernehmen
- Texte anderer Plattformen kopieren
- Bilder anderer Plattformen kopieren
- Logos anderer Plattformen kopieren
- personenbezogene Daten sammeln, die fuer das Unternehmensprofil nicht erforderlich sind
- E-Mails ohne ausdrueckliche Freigabe senden

Der Agent darf nur oeffentlich zugaengliche Informationen verwenden.

Der Agent darf ausschliesslich Informationen erfassen, die fuer die Darstellung eines gewerblichen Unternehmensprofils relevant sind.

## Quellenprioritaet

Bei widerspruechlichen Informationen gilt:

1. Offizielle Unternehmenswebsite
2. Handelsregister
3. Unternehmensregister
4. Kammern / Innungen
5. Gemeindequellen
6. Sonstige Hinweisquellen

Wenn eine offizielle Unternehmenswebsite vorhanden ist, duerfen abweichende Angaben aus Gemeinde- oder Branchenverzeichnissen die offiziellen Angaben nicht verdraengen.

## Zielzustand

Fuer jede Region soll der Agent:

- relevante Betriebe finden
- offizielle Websites identifizieren
- strukturierte Unternehmensdaten erfassen
- Gewerke korrekt klassifizieren
- Dubletten vermeiden
- rechtliche Vorgaben einhalten
- Quellen und Entscheidungen dokumentieren
- hochwertige Profile fuer GewerkeListe.com vorbereiten

Qualitaet geht vor Menge. Lieber 100 hochwertige Profile als 10.000 schwache Eintraege.
