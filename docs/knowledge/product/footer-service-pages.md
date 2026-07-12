---
type: product-architecture
title: Footer-, Service- und Vertrauensseiten
description: Verbindliche Informationsarchitektur für öffentliche Footer- und Serviceseiten.
status: active
owner: Product Owner / GewerkeListe
date: 2026-07-12
---

# Footer-, Service- und Vertrauensseiten

## Zweck und Geltungsbereich

Dieses Dokument ist die verbindliche Produkt- und Informationsarchitektur für Footer-, Hilfe-,
Sicherheits-, Vertrauens- und Serviceseiten von GewerkeListe.com. Es beschreibt, welche Seiten es
geben soll, warum sie gebraucht werden, wann sie verlinkt werden dürfen und welche fachlichen,
rechtlichen und technischen Voraussetzungen vor einer Veröffentlichung erfüllt sein müssen.

Es ist keine zweite operative Roadmap. Die Umsetzung erfolgt über den einen referenzierten
Roadmap-Punkt in `docs/agent-company/IMPLEMENTATION_ROADMAP.md`; jeder spätere Slice erhält einen
eigenen Branch und einen eigenen PR.

### Verbindliche Statuswerte

- `NOW`: unmittelbare Informationsarchitektur. Eine bestehende Route darf bereits verlinkt werden,
  sofern sie den dokumentierten Release-Gate erfüllt. Fehlende Routen bleiben unverlinkt.
- `NEXT`: zeitnah nach belastbarer inhaltlicher, technischer oder organisatorischer Grundlage.
- `CONDITIONAL`: nur bei tatsächlicher rechtlicher oder technischer Anwendbarkeit.
- `LATER`: strategisch sinnvoll, aber kein aktueller Kern des Produkts.
- `NOT_PLANNED`: wird nicht aus anderen Plattformen übernommen und erhält keine Zielroute.

Für alle Einträge gilt: Ein Footer-Link wird erst veröffentlicht, wenn die Zielroute tatsächlich
existiert, die Seite nicht leer oder improvisiert ist und der jeweilige Release-Gate nachweisbar
erfüllt wurde. Ein Name in dieser Spezifikation ist keine Freigabe zur Implementierung oder
Veröffentlichung.

## Ist-Aufnahme auf `origin/main`

### Tatsächliche öffentliche und interne Routen

| Route | Tatsächlicher Stand | Einordnung |
| --- | --- | --- |
| `/` | vorhanden | Öffentliche Startseite; kanonische Startseite. |
| `/suche` | vorhanden | Öffentliche Fachbetriebssuche; ohne Filter zugleich die bestehende Übersicht der sichtbaren Betriebseinträge. |
| `/gewerke` | vorhanden | Öffentliche Gewerkestruktur und Sucheinstieg. |
| `/gewerke/[slug]` | vorhanden | Öffentliche Gewerkeseite. |
| `/gewerke/[slug]/[ort]` | vorhanden | Öffentliche Gewerk-/Ortsseite; kein eigenständiger Regionenindex. |
| `/firma/[slug]` | vorhanden | Öffentliches Firmenprofil. |
| `/fuer-betriebe` | vorhanden | Öffentliche Betriebsseite. |
| `/betrieb-eintragen` | vorhanden | Öffentlicher Einstieg für kostenlosen Basiseintrag und Korrekturanfragen. |
| `/eintrag-beanspruchen` | vorhanden | Öffentlicher Einstieg zur Suche und Übernahme eines Eintrags. |
| `/betriebe/[slug]/claim` | vorhanden | Claim-Assistent; Prozessseite, aktuell mit `noindex`. |
| `/ueber-gewerkeliste` | vorhanden | Öffentliche Über-uns-Seite. |
| `/impressum` | vorhanden | Öffentliche Anbieterkennzeichnung. |
| `/datenschutz` | vorhanden | Öffentliche Datenschutzerklärung. |
| `/fuer-handwerker` | vorhanden | Legacy-Redirect auf `/fuer-betriebe`; keine eigene Zielseite. |
| `/handwerker` | vorhanden | Legacy-Redirect auf `/fuer-betriebe`; keine eigene Zielseite. |
| `/ueber-mich` | vorhanden | Legacy-Redirect auf `/ueber-gewerkeliste`; keine eigene Zielseite. |
| `/profil-beanspruchen` | vorhanden | Legacy-Redirect auf `/eintrag-beanspruchen`; keine eigene Zielseite. |
| `/companies/new`, `/companies/[id]/edit` | vorhanden | Interne Firmenverwaltung; durch Middleware geschützt, nicht öffentlich. |
| `/trades` | vorhanden | Interne Stammdatenansicht; nicht die öffentliche Route `/gewerke`. |
| `/admin/...` | vorhanden | Interne Admin-Routen; nicht Teil der öffentlichen Informationsarchitektur. |

Die tatsächliche Sitemap enthält Startseite, Suche, Gewerke, dynamische Gewerkeseiten, `Für
Betriebe`, Eintragseintrag, Eintragsübernahme, Über uns und öffentliche Firmenprofile. Impressum
und Datenschutz sind vorhanden, aber nicht in `app/sitemap.ts` aufgeführt. Das wird als bestehende
SEO-/Sitemap-Entscheidung erfasst, nicht als Anlass für eine Laufzeitänderung.

### Aktueller Footer

Der globale Footer wird in `app/layout.tsx` über `components/legal-footer.tsx` auf allen Seiten
eingebunden. Er enthält aktuell:

- **Navigation:** Suche, Gewerke, Für Betriebe, Betrieb eintragen, Eintrag beanspruchen, Über uns.
- **Rechtliches:** Impressum, Datenschutz.
- **Kontakt:** Firmenname, Deutschland und `kontakt@gewerkeliste.com` als `mailto:`-Link; es gibt
  noch keine öffentliche Kontaktseite.
- **Vertrauensleiste:** Aussagen aus Baupraxis, Fachregister, Auftraggeber/Betriebe und
  nachvollziehbare Betriebsdaten; diese Elemente sind keine Service-Links.

Alle aktuell im Footer verwendeten internen Ziele existieren auf `origin/main`. Es wurde kein toter
Footer-Link festgestellt. Die Legacy-Redirects, geschützten internen Routen und der persönliche
LinkedIn-Link auf der Über-uns-Seite werden nicht als offizielle Footer-Ziele behandelt. Ein
persönlicher Gründerkanal ist kein bestätigter offizieller GewerkeListe-Kanal.

### Aktueller Header und weitere Verweise

Der öffentliche Header verlinkt Gewerke, Für Betriebe, Über uns und den CTA Eintrag beanspruchen und
enthält ein Suchformular mit `action="/suche"`. Startseite und bestehende Fachseiten verlinken zusätzlich Suche, Betrieb eintragen,
Eintrag beanspruchen und Gewerkeseiten. Datenkorrekturen laufen derzeit über Eintragen- und
Claim-Prozesse; eine eigenständige Service-Seite fehlt.

Es gibt aktuell keine öffentliche Zielroute für Hilfe/FAQ, Regionenindex, Kontakt, Datenkorrektur,
Sicherheit/Vertrauensnutzung, Nutzungsbedingungen, Presse, Sicherheitslückenmeldung, Preise,
Widerruf, Datenschutzeinstellungen oder Barrierefreiheitserklärung. Eine Route darf in den
Ziel-Footer aufgenommen werden, sobald sie in der Matrix als vorhanden und freigegeben belegt ist.

## Verbindliche Matrix

### NOW – unmittelbare Informationsarchitektur

#### Über uns

- **Route / Stand:** `/ueber-gewerkeliste`; vorhanden und bereits im Footer.
- **Zweck / Zielgruppe:** Herkunft, Mission, Rolle der Plattform und Orientierung für Suchende,
  Betriebe, Planer und Auftraggeber.
- **Fachlicher Owner:** Product Owner / Founder.
- **Notwendige Inhalte:** Mission, Baupraxis, neutrale Positionierung, keine Qualitätsgarantie und
  keine erfundenen Erfolgszahlen.
- **Release-Gates / Abhängigkeiten:** Grundsatz und Doctrine müssen eingehalten werden; persönliche
  externe Links dürfen nicht als offizielle Firmenkanäle erscheinen.
- **SEO / Indexierung:** `index, follow`; keine parallele `/ueber-mich`-Seite.
- **Footer-Gruppe:** `GewerkeListe`.
- **Verlinkung:** Ja, weil Route und inhaltliche Grundlage existieren.

#### Hilfe und FAQ

- **Route / Stand:** Zielroute `/hilfe`; fehlt. `/faq` wird nicht parallel eingeführt.
- **Zweck / Zielgruppe:** Praktische Antworten für Suchende und Betriebe zu Suche, Profilen,
  Übernahme, Korrekturen, Verifizierungsbedeutung und Kontaktwegen.
- **Fachlicher Owner:** Product Owner / Support.
- **Notwendige Inhalte:** Kuratierte, belegte Fragen und Antworten, klare Eskalations- und
  Korrekturwege; keine Rechtsberatung und keine leeren FAQ-Platzhalter.
- **Release-Gates / Abhängigkeiten:** Echte Nutzerfragen sammeln, Antworten fachlich prüfen und
  einen betreuten Korrektur-/Kontaktprozess benennen.
- **SEO / Indexierung:** `index, follow` für die kanonische Hilfeseite; erst nach vollständigem
  Inhalt in die Sitemap aufnehmen.
- **Footer-Gruppe:** `Hilfe und Sicherheit`.
- **Verlinkung:** Nein, bis `/hilfe` tatsächlich existiert und abgenommen ist.

#### Für Betriebe

- **Route / Stand:** `/fuer-betriebe`; vorhanden und bereits im Footer.
- **Zweck / Zielgruppe:** Betrieben erklären, wie kostenloser Eintrag, Claim, Datenpflege und
  sachliche Sichtbarkeit funktionieren.
- **Fachlicher Owner:** Product Owner / Founder.
- **Notwendige Inhalte:** Kostenloser Basiseintrag, tatsächliches Leistungsspektrum, Claim und
  geprüfte Änderungen; keine aggressive Verkaufs- oder Leadportal-Sprache.
- **Release-Gates / Abhängigkeiten:** Aussagen müssen dem tatsächlichen Funktionsstand entsprechen;
  keine nicht freigegebenen Preise oder Zahlungsversprechen.
- **SEO / Indexierung:** `index, follow`; bestehende kanonische Route.
- **Footer-Gruppe:** `Für Betriebe`.
- **Verlinkung:** Ja, weil Route und Inhalt existieren.

#### Alle Gewerke

- **Route / Stand:** `/gewerke`; vorhanden und bereits im Footer.
- **Zweck / Zielgruppe:** Einstieg in die fachliche Gewerkestruktur für Planer, Auftraggeber und
  Betriebe.
- **Fachlicher Owner:** Product Owner / Taxonomy Owner.
- **Notwendige Inhalte:** Aktive Gewerke, fachliche Struktur, Leistungen und Suchübergänge; keine
  erfundenen Abdeckungszahlen.
- **Release-Gates / Abhängigkeiten:** Taxonomie, Suchlinks und leere Zustände müssen konsistent sein.
- **SEO / Indexierung:** `index, follow`; Gewerkeseiten bleiben die kanonischen Unterseiten.
- **Footer-Gruppe:** `Suchen und Finden`.
- **Verlinkung:** Ja; nicht die geschützte interne Route `/trades` verlinken.

#### Alle Orte und Regionen

- **Route / Stand:** Zielroute `/regionen`; fehlt. Vorhanden sind nur dynamische
  `/gewerke/[slug]/[ort]`-Seiten.
- **Zweck / Zielgruppe:** Regionale Orientierung und Einstieg in Orte, Regionen und vorhandene
  Gewerkeseiten für Suchende und Planer.
- **Fachlicher Owner:** Product Owner / Data Quality / SEO.
- **Notwendige Inhalte:** Nur belastbare Orte/Regionen, sinnvolle Leermeldungen und Links zu
  tatsächlich existierenden Gewerk-/Ort-Seiten.
- **Release-Gates / Abhängigkeiten:** Regionstaxonomie, Datenabdeckung, Canonical-Regeln und keine
  automatisch erzeugte SEO-Masse.
- **SEO / Indexierung:** `index, follow` erst für substanzielle Regionen; leere Kombinationen nicht
  indexieren oder in die Sitemap aufnehmen.
- **Footer-Gruppe:** `Suchen und Finden`.
- **Verlinkung:** Nein, bis `/regionen` existiert und Daten-/SEO-Prüfung bestanden ist.

#### Firmenverzeichnis / Übersicht aller Betriebe

- **Route / Stand:** Kanonischer Einstieg ist derzeit `/suche`; eine separate `/firmen`-Dublettenroute
  wird nicht vorgesehen. Ohne Filter zeigt `/suche` die öffentliche Übersicht, sofern Daten vorhanden sind.
- **Zweck / Zielgruppe:** Neutrale Orientierung für Planer, Auftraggeber und Nutzer, ergänzt um die
  fachliche Suche.
- **Fachlicher Owner:** Product Owner / Data Quality.
- **Notwendige Inhalte:** Nur freigegebene öffentliche Betriebseinträge, nachvollziehbare Status-
  kennzeichnung, sinnvolle Leermeldung und keine Rankingbevorzugung.
- **Release-Gates / Abhängigkeiten:** Öffentliche Sichtbarkeit, Datenqualität, Suche und Datenschutz
  müssen zusammenpassen; keine Vollständigkeitsbehauptung ohne Messgrundlage.
- **SEO / Indexierung:** Basisroute `/suche` `index, follow`; Query-Varianten später mit Canonical-
  und Indexierungsregeln vor Crawl-Masse schützen.
- **Footer-Gruppe:** `Suchen und Finden`.
- **Verlinkung:** `/suche` darf verlinkt werden; kein zusätzlicher `/firmen`-Link.

#### Betrieb eintragen

- **Route / Stand:** `/betrieb-eintragen`; vorhanden und bereits im Footer.
- **Zweck / Zielgruppe:** Kostenlosen Eintrag, vorhandenes Profil und Korrekturweg für Betriebe starten.
- **Fachlicher Owner:** Product Owner / Data Quality.
- **Notwendige Inhalte:** Betriebsdaten, Gewerke, Leistungen, Region, Kontakt und Prüfhinweis;
  transparente Datenschutzinformationen.
- **Release-Gates / Abhängigkeiten:** Formular, Validierung, Speicherung, Review und Datenschutz
  müssen produktiv zusammenarbeiten.
- **SEO / Indexierung:** `index, follow`; bestehende kanonische Route.
- **Footer-Gruppe:** `Für Betriebe`.
- **Verlinkung:** Ja, weil Route und Prozess existieren.

#### Eintrag beanspruchen

- **Route / Stand:** `/eintrag-beanspruchen`; vorhanden und bereits im Footer. Der nachgelagerte
  `/betriebe/[slug]/claim`-Assistent ist Prozessziel und `noindex`.
- **Zweck / Zielgruppe:** Berechtigten Betrieben ermöglichen, Daten zu prüfen, zu korrigieren und
  den Eintrag zu übernehmen.
- **Fachlicher Owner:** Product Owner / Claim- und Data-Quality-Owner.
- **Notwendige Inhalte:** Such- und Identifikationsweg, kostenlose Basisübernahme, Prüfstatus,
  keine Qualitätsgarantie und klare Korrekturgrenzen.
- **Release-Gates / Abhängigkeiten:** Claim-Identität, Review, Datenschutz und sichere Veröffentlichung
  müssen funktionieren.
- **SEO / Indexierung:** Einstieg `index, follow`; individuelle Claim-Assistenten `noindex, follow`.
- **Footer-Gruppe:** `Für Betriebe`.
- **Verlinkung:** Ja für den Einstieg; keine Legacy-Aliase ergänzen.

#### Daten korrigieren / Inhalt melden

- **Route / Stand:** Zielroute `/daten-korrigieren`; fehlt. Korrekturen sind derzeit in Eintragen-
  und Claim-Prozesse eingebettet.
- **Zweck / Zielgruppe:** Suchende und Betriebe sollen falsche, veraltete oder unzulässige Profilinhalte
  melden können.
- **Fachlicher Owner:** Product Owner / Data Quality / Support.
- **Notwendige Inhalte:** Meldeumfang, Quellen-/Begründungshinweise, Eingangsbestätigung, Reviewprozess,
  Datenschutz und keine automatische Veröffentlichung.
- **Release-Gates / Abhängigkeiten:** Betreuter Eingang, Review-Queue, Zuständigkeit, Missbrauchsschutz
  und belastbarer Korrekturprozess.
- **SEO / Indexierung:** `index, follow`, sobald eine substanzielle Service-Seite existiert; keine
  leere Formularroute in die Sitemap.
- **Footer-Gruppe:** `Hilfe und Sicherheit`.
- **Verlinkung:** Nein, bis Route und betreuter Prozess existieren.

#### Sicherheit und vertrauenswürdige Nutzung

- **Route / Stand:** Zielroute `/sicherheit`; fehlt.
- **Zweck / Zielgruppe:** Vertrauensgrenzen für Suchende, Betriebe und Planer erklären: Datenstatus,
  Korrektur, Verifizierung, sichere Nutzung und Grenzen der Plattform.
- **Fachlicher Owner:** Product Owner / Security- und Compliance-Owner.
- **Notwendige Inhalte:** Bedeutung von „Betriebsdaten bestätigt“, keine Qualitätsgarantie,
  Quellen-/Korrekturprinzipien und sichere Meldewege.
- **Release-Gates / Abhängigkeiten:** Aussagen müssen mit Datenschutz, Authentifizierung, Datenmodell
  und tatsächlichen Prozessen übereinstimmen; keine Scheinsicherheit.
- **SEO / Indexierung:** `index, follow`, wenn vollständig geprüft; danach in die Informationssitemap.
- **Footer-Gruppe:** `Hilfe und Sicherheit`.
- **Verlinkung:** Nein, bis Seite und Vertrauensprozesse existieren.

#### Nutzungsbedingungen

- **Route / Stand:** Zielroute `/nutzungsbedingungen`; fehlt.
- **Zweck / Zielgruppe:** Regeln für Nutzer, Betriebe und Verzeichnisnutzung transparent bereitstellen.
- **Fachlicher Owner:** Product Owner / rechtlicher Owner.
- **Notwendige Inhalte:** Tatsächlicher Leistungsumfang, Nutzerpflichten, Profil-/Korrekturregeln,
  Haftungs- und Moderationsgrenzen; keine kopierte Standardbelehrung.
- **Release-Gates / Abhängigkeiten:** Rechtliche Prüfung und Abgleich mit Datenprozessen, Claim,
  öffentlicher Sichtbarkeit und einem etwaigen kostenpflichtigen Angebot.
- **SEO / Indexierung:** Keine SEO-Landingpage; nicht in Sitemap. `index, follow` erst nach rechtlicher
  Abnahme, wenn die Seite zur Transparenz beitragen soll.
- **Footer-Gruppe:** `Rechtliches`.
- **Verlinkung:** Nein, bis geprüfte Bedingungen tatsächlich gelten.

#### Datenschutz

- **Route / Stand:** `/datenschutz`; vorhanden und bereits im Footer.
- **Zweck / Zielgruppe:** Betroffene, Nutzer und Betriebe über tatsächliche Datenverarbeitungen informieren.
- **Fachlicher Owner:** Product Owner / Datenschutz- und rechtlicher Owner.
- **Notwendige Inhalte:** Tatsächliche Hosting-, Datenbank-, Formular-, Profil- und Kontaktprozesse;
  Rechte, Zwecke, Rechtsgrundlagen und Aufbewahrung.
- **Release-Gates / Abhängigkeiten:** Laufende rechtliche und technische Aktualisierung; keine
  Beschreibung nicht eingesetzter Tracking- oder Einwilligungssysteme.
- **SEO / Indexierung:** Keine SEO-Priorität; nicht in Sitemap, aber über den Footer auffindbar.
- **Footer-Gruppe:** `Rechtliches`.
- **Verlinkung:** Ja, bestehend.

#### Impressum

- **Route / Stand:** `/impressum`; vorhanden und bereits im Footer.
- **Zweck / Zielgruppe:** Anbieterkennzeichnung und Kontakt für alle Besucher.
- **Fachlicher Owner:** Betreiber / Product Owner / rechtlicher Owner.
- **Notwendige Inhalte:** Aktuelle Anbieter-, Vertretungs-, Kontakt- und Verantwortlichkeitsdaten.
- **Release-Gates / Abhängigkeiten:** Rechtliche Aktualität und Übereinstimmung mit dem tatsächlichen
  Betreiber; keine erfundenen oder veralteten Angaben.
- **SEO / Indexierung:** Keine SEO-Landingpage; nicht in Sitemap, aber über den Footer auffindbar.
- **Footer-Gruppe:** `Rechtliches`.
- **Verlinkung:** Ja, bestehend.

#### Kontakt

- **Route / Stand:** Zielroute `/kontakt`; fehlt. Aktuell existieren nur `mailto:`-Link sowie
  Kontaktinformationen in Impressum und Über uns.
- **Zweck / Zielgruppe:** Zentraler, nachvollziehbarer Kontaktweg für Suchende, Betriebe, Planer und
  Hinweise zur Datenqualität.
- **Fachlicher Owner:** Product Owner / Support.
- **Notwendige Inhalte:** Kontaktzwecke, E-Mail, gegebenenfalls Telefon, Antworterwartung und
  Weiterleitung zu Claim-, Korrektur- und Sicherheitswegen.
- **Release-Gates / Abhängigkeiten:** Tatsächlich betreutes Postfach und Zuständigkeit; kein Formular
  ohne gesicherte Verarbeitung und Datenschutzgrundlage.
- **SEO / Indexierung:** `index, follow`, wenn die Seite mehr als ein Mailto enthält; keine SEO-
  Priorität ohne substanziellen Inhalt.
- **Footer-Gruppe:** `Hilfe und Sicherheit`.
- **Verlinkung:** Nein, bis Route und betreuter Eingang existieren.

### NEXT – zeitnah nach belastbarer Grundlage

#### Presse

- **Route / Stand:** Zielroute `/presse`; fehlt.
- **Zweck / Zielgruppe:** Journalisten und Multiplikatoren mit überprüfbaren Unternehmens- und
  Produktinformationen versorgen.
- **Fachlicher Owner:** Founder / Communications.
- **Notwendige Inhalte:** Kurze Unternehmensbeschreibung, Gründerinformation, verwendbare Logos und
  Pressebilder mit Nutzungsregeln, Pressekontakt und aktuelle Fakten ohne erfundene Reichweitenzahlen.
- **Release-Gates / Abhängigkeiten:** Assets und betreuter Pressekontakt müssen vollständig vorliegen;
  Inhalte müssen aktuell und freigegeben sein.
- **SEO / Indexierung:** `index, follow` nach Inhaltsfreigabe; vorher keine öffentliche Verlinkung.
- **Footer-Gruppe:** `GewerkeListe`.
- **Verlinkung:** Nein, bis die Mindestgrundlage vollständig vorliegt.

#### Sicherheitslücke melden

- **Route / Stand:** Zielroute `/sicherheitsluecke-melden`; fehlt.
- **Zweck / Zielgruppe:** Sicherheitsforscher und Nutzer sollen technische Schwachstellen sicher und
  verantwortungsvoll melden können.
- **Fachlicher Owner:** Technical Owner / Security-Owner.
- **Notwendige Inhalte:** Betreuter Eingang, Meldeumfang, sichere Hinweise, erwartete Antwort und
  Umgang mit sensiblen Details; keine Veröffentlichung von Exploits verlangen.
- **Release-Gates / Abhängigkeiten:** Überwachtes Postfach oder Ticketing, definierter Triage- und
  Response-Prozess, Zuständigkeit und sichere Verarbeitung.
- **SEO / Indexierung:** `index, follow` zur Auffindbarkeit durch Sicherheitsforscher; keine
  Verlinkung vor Prozessstart.
- **Footer-Gruppe:** `Hilfe und Sicherheit`.
- **Verlinkung:** Nein, bis Eingang, Prozess und Meldeumfang real betreut sind.

### CONDITIONAL – nur bei tatsächlicher Anwendbarkeit

#### Preise

- **Route / Stand:** Zielroute `/preise`; fehlt. Sie gehört zur Zielarchitektur, ist aber kein
  freigegebenes Verkaufsangebot.
- **Zweck / Zielgruppe:** Betrieben das tatsächlich lieferbare verifizierte Startprofil und seine
  Bedingungen transparent erklären.
- **Fachlicher Owner:** Product Owner / Product, Legal und Finance.
- **Notwendige Inhalte:** Tatsächliche Funktionen, 490 EUR netto Gesamtpreis für zwölf Monate,
  einmalige Zahlung und freigegebene Leistungsgrenzen; kein Pay-to-rank.
- **Release-Gates / Abhängigkeiten:** Verifiziertes Startprofil vollständig lieferbar, Aussagen
  entsprechen dem Funktionsstand und Product Owner erteilt Verkaufsfreigabe. Das bloße Vorhandensein
  einer Preview oder Route löst keine Verkaufsfreigabe aus.
- **SEO / Indexierung:** Preview `noindex`; öffentlich `index, follow` erst nach Verkaufsfreigabe.
- **Footer-Gruppe:** `Für Betriebe`.
- **Verlinkung:** Nein, bis Route, Angebot und Verkaufsfreigabe vorhanden sind.

#### Widerruf / Verbraucherinformationen

- **Route / Stand:** Zielroute `/widerruf`; fehlt.
- **Zweck / Zielgruppe:** Verbraucherinformationen nur für einen tatsächlich angebotenen relevanten
  Fernabsatz- oder Verbrauchervertrag bereitstellen.
- **Fachlicher Owner:** Product Owner / rechtlicher Owner.
- **Notwendige Inhalte:** Konkreter Vertrag, Anwendbarkeit, Fristen und Hinweise nach geprüfter
  Rechtsgrundlage; keine kopierte Standardbelehrung.
- **Release-Gates / Abhängigkeiten:** Tatsächliches kostenpflichtiges Angebot und konkrete rechtliche
  Bedarfsprüfung.
- **SEO / Indexierung:** Keine SEO-Landingpage; nicht in Sitemap; nur bei Anwendbarkeit verlinken.
- **Footer-Gruppe:** `Rechtliches`.
- **Verlinkung:** Nein, solange Vertrag und Prüfung fehlen.

#### Datenschutzeinstellungen

- **Route / Stand:** Zielroute `/datenschutzeinstellungen`; fehlt.
- **Zweck / Zielgruppe:** Präferenzen für nicht notwendige Cookies, Tracking oder vergleichbare
  Einwilligungen verwalten.
- **Fachlicher Owner:** Product Owner / Datenschutz- und Technical Owner.
- **Notwendige Inhalte:** Tatsächliche Kategorien, Einwilligungsstatus, Widerruf und technische
  Funktion; kein Schein-Consent-Management.
- **Release-Gates / Abhängigkeiten:** Echtes Präferenz-/Einwilligungssystem mit sicherer und
  dokumentierter Verarbeitung.
- **SEO / Indexierung:** `noindex, follow`, nicht in Sitemap; reine Servicefunktion.
- **Footer-Gruppe:** `Rechtliches`.
- **Verlinkung:** Nein, solange kein solches System existiert.

#### Barrierefreiheitserklärung

- **Route / Stand:** Zielroute `/barrierefreiheit`; fehlt.
- **Zweck / Zielgruppe:** Tatsächlichen Stand, bekannte Einschränkungen und Kontakt für Barrierefrei-
  heitsfeedback transparent machen.
- **Fachlicher Owner:** Product Owner / Engineering / rechtlicher Owner.
- **Notwendige Inhalte:** Geprüfter Status, verwendeter Standard nur bei Grundlage, bekannte
  Einschränkungen und Korrekturkontakt; keine pauschale Konformitätsbehauptung.
- **Release-Gates / Abhängigkeiten:** Rechtliche Anwendbarkeit prüfen, Audit oder belastbare
  Selbstbewertung durchführen und Feedbackprozess betreuen.
- **SEO / Indexierung:** Keine SEO-Landingpage; nicht in Sitemap, aber bei Anwendbarkeit auffindbar.
- **Footer-Gruppe:** `Rechtliches`.
- **Verlinkung:** Nein, bis Anwendbarkeit und Prüfung vorliegen.

#### Social-Media-Links von GewerkeListe

- **Route / Stand:** Keine interne Route; externe offizielle Kanäle sind aktuell nicht belegt. Der
  persönliche LinkedIn-Link auf Über uns ist kein Firmenkanal.
- **Zweck / Zielgruppe:** Offizielle Kommunikation für Betriebe, Suchende und Partner nur bei echter
  Aktivität auffindbar machen.
- **Fachlicher Owner:** Founder / Communications.
- **Notwendige Inhalte:** Aktiver offizieller Kanal, konsistenter Name, Verantwortlichkeit und
  aktuelle Inhalte; keine leeren Profile oder Platzhalter.
- **Release-Gates / Abhängigkeiten:** Tatsächliche Kanalaktivität, Freigabe, regelmäßige Betreuung
  und rechtlich/markenrechtlich unbedenkliche Nutzung.
- **SEO / Indexierung:** Kein interner Sitemap-Eintrag; externe Links sind keine indexierbaren
  GewerkeListe-Seiten.
- **Footer-Gruppe:** `GewerkeListe`.
- **Verlinkung:** Nein, bis ein offizieller aktiver Kanal nachgewiesen ist.

### LATER – strategisch sinnvoll, aber kein aktueller Kern

#### Magazin / Wissensbereich

- **Route / Stand:** Zielroute `/magazin`; fehlt.
- **Zweck / Zielgruppe:** Fachliche Orientierung für Planer, Auftraggeber und Betriebe sowie
  belastbarer Wissens- und SEO-Nutzen.
- **Fachlicher Owner:** Product Owner / Editorial.
- **Notwendige Inhalte:** Fachwissen zu Gewerken, Leistungen, Suche, Quellen und Verifizierung;
  keine beliebige Content-Marketing-Masse oder automatisch erzeugte Scheininhalte.
- **Release-Gates / Abhängigkeiten:** Redaktioneller Prozess, Quellenprüfung, Pflege,
  Autorenverantwortung und messbarer fachlicher Wert.
- **SEO / Indexierung:** `index, follow` für substanzielle Artikel; keine leeren Kategorien oder
  automatisch erzeugte Massenvarianten.
- **Footer-Gruppe:** `GewerkeListe`.
- **Verlinkung:** Nein, bis ein redaktionell tragfähiger Bereich existiert.

#### Karriere

- **Route / Stand:** Zielroute `/karriere`; fehlt.
- **Zweck / Zielgruppe:** Tatsächliche Stellen, Praktika, Abschlussarbeiten oder belastbare
  Kooperationsangebote kommunizieren.
- **Fachlicher Owner:** Founder / People.
- **Notwendige Inhalte:** Reale Angebote, Ansprechpartner, Bedingungen und Aktualisierungsdatum.
- **Release-Gates / Abhängigkeiten:** Mindestens ein aktuelles Angebot oder belastbares
  Kooperationsprogramm und betreuter Kontakt.
- **SEO / Indexierung:** `index, follow` bei realen Angeboten; leere Route weder verlinken noch indexieren.
- **Footer-Gruppe:** `GewerkeListe`.
- **Verlinkung:** Nein, solange keine realen Angebote existieren.

#### Gesellschaftliches Engagement

- **Route / Stand:** Zielroute `/engagement`; fehlt.
- **Zweck / Zielgruppe:** Tatsächliche Beiträge zu Transparenz, Baupraxis, regionaler Marktabdeckung
  oder gemeinnützigen Vorhaben nachvollziehbar zeigen.
- **Fachlicher Owner:** Founder / Communications.
- **Notwendige Inhalte:** Konkrete Aktivitäten, Partner, Zeitraum und überprüfbare Wirkung; keine
  Imagebehauptungen ohne Beleg.
- **Release-Gates / Abhängigkeiten:** Reales Engagement und freigegebene Nachweise.
- **SEO / Indexierung:** `index, follow` nur bei substanziellen Inhalten; nicht als dünne Marketingseite.
- **Footer-Gruppe:** `GewerkeListe`.
- **Verlinkung:** Nein, bis ein konkretes Programm existiert.

#### Partnerschaften / Kooperationen

- **Route / Stand:** Zielroute `/partnerschaften`; fehlt. Die Bezeichnungen `PRO`, `Pakete` und
  `Werben` werden nicht als Ersatz übernommen.
- **Zweck / Zielgruppe:** Fachliche Kooperationen für Betriebe, Planer, Lieferanten und Institutionen
  transparent darstellen.
- **Fachlicher Owner:** Product Owner / Partnerships.
- **Notwendige Inhalte:** Reale Partner, Zweck, Zustimmung, Rollen und Schutz der Plattformneutralität;
  keine gekaufte organische Bevorzugung.
- **Release-Gates / Abhängigkeiten:** Belastbare Vereinbarungen, Datenschutz-/Markenprüfung und
  Neutralitätsprüfung ohne Pay-to-rank.
- **SEO / Indexierung:** `index, follow` nur bei echten Partnerschaften; keine leere Angebotsseite.
- **Footer-Gruppe:** `Für Betriebe`.
- **Verlinkung:** Nein, bis reale Partnerschaften und Inhalte bestehen.

#### Presseausbau

- **Route / Stand:** Keine neue Route; Ausbau der späteren `/presse`-Seite.
- **Zweck / Zielgruppe:** Nach dem Presse-Grundangebot vertiefende Fakten, Assets und Aktualisierungen
  für Medien und Multiplikatoren bereitstellen.
- **Fachlicher Owner:** Founder / Communications.
- **Notwendige Inhalte:** Aktuelle, belegte Fakten und Nutzungsregeln für Assets; keine Reichweiten-
  oder Erfolgsfiktionen.
- **Release-Gates / Abhängigkeiten:** `/presse` muss zuerst die NEXT-Voraussetzungen erfüllen;
  Ausbau bleibt redaktionell gepflegt.
- **SEO / Indexierung:** Gleiche Entscheidung wie `/presse`; keine separate Dublettenroute.
- **Footer-Gruppe:** `GewerkeListe`.
- **Verlinkung:** Nein, bis die gemeinsame Presse-Route existiert.

#### Für Planer und Auftraggeber

- **Route / Stand:** Zielroute `/fuer-planer-und-auftraggeber`; fehlt.
- **Zweck / Zielgruppe:** Professionelle Nachfrage-Seite für Planer, Architekten, Bauleiter,
  Generalunternehmer, Kommunen und Auftraggeber.
- **Fachlicher Owner:** Product Owner / Editorial.
- **Notwendige Inhalte:** Suchnutzen, fachliche Tiefe, regionale Orientierung, neutrale Darstellung
  und tatsächliche professionelle Funktionen; keine Leadgarantie.
- **Release-Gates / Abhängigkeiten:** Nachweisbarer Mehrwert über Suche und Datenqualität; belastbare
  Inhalte und echte Funktionen.
- **SEO / Indexierung:** `index, follow` nach vollständiger inhaltlicher Abnahme.
- **Footer-Gruppe:** `Suchen und Finden`.
- **Verlinkung:** Nein, bis Seite und Nutzen belegt sind.

### NOT_PLANNED – nicht aus anderen Plattformen kopieren

#### Mobile-App-Link ohne vorhandene App

- **Route / Stand:** Keine Route und kein App-Angebot.
- **Zweck / Zielgruppe:** Nicht erforderlich, solange keine reale App existiert.
- **Fachlicher Owner:** Nicht zutreffend.
- **Notwendige Inhalte:** Keine; keine App-Store-Platzhalter.
- **Release-Gates / Abhängigkeiten:** Keine; nur eine tatsächlich veröffentlichte und betreute App
  würde den Status neu bewerten.
- **SEO / Indexierung:** Nicht zutreffend; keine Verlinkung.
- **Footer-Gruppe:** Keine.
- **Verlinkung:** Niemals ohne tatsächlich veröffentlichte und betreute App.

#### Kinder- und Jugendschutzseite ohne Produktbezug

- **Route / Stand:** Keine Zielroute.
- **Zweck / Zielgruppe:** Kein eigenständiger Produkt- oder Zielgruppenbezug belegt.
- **Fachlicher Owner:** Nicht zutreffend.
- **Notwendige Inhalte:** Keine künstliche Plattformkopie.
- **Release-Gates / Abhängigkeiten:** Status bleibt `NOT_PLANNED`; spezifische rechtliche Pflichten
  würden bei tatsächlicher Anwendbarkeit separat geprüft.
- **SEO / Indexierung:** Keine Seite, keine Indexierung.
- **Footer-Gruppe:** Keine.
- **Verlinkung:** Nicht vorgesehen.

#### Kleinanzeigen-spezifische Vertrags-, Bewertungs- oder Anzeigenfunktionen

- **Route / Stand:** Keine Zielroute; GewerkeListe ist kein Kleinanzeigenprodukt.
- **Zweck / Zielgruppe:** Nicht Teil der neutralen Fachsuche.
- **Fachlicher Owner:** Nicht zutreffend.
- **Notwendige Inhalte:** Keine Übernahme fremder Vertrags-, Bewertungs- oder Anzeigenlogik.
- **Release-Gates / Abhängigkeiten:** Status bleibt `NOT_PLANNED`; keine Umsetzung als
  Kleinanzeigen- oder Bewertungsprodukt.
- **SEO / Indexierung:** Keine Seite, keine Indexierung.
- **Footer-Gruppe:** Keine.
- **Verlinkung:** Nicht vorgesehen.

#### Autobewertung oder fremde Spezialprodukte

- **Route / Stand:** Keine Zielroute.
- **Zweck / Zielgruppe:** Kein Bezug zur Baugewerke-Fachsuche.
- **Fachlicher Owner:** Nicht zutreffend.
- **Notwendige Inhalte:** Keine fachfremden Spezialprodukte und keine kopierten Markenbegriffe.
- **Release-Gates / Abhängigkeiten:** Status bleibt `NOT_PLANNED`; kein fachlicher Produktbezug.
- **SEO / Indexierung:** Keine Seite, keine Indexierung.
- **Footer-Gruppe:** Keine.
- **Verlinkung:** Nicht vorgesehen.

#### „PRO Infopoint“ und „PRO Pakete“

- **Route / Stand:** Keine Zielroute; `PRO` ist keine GewerkeListe-Produktbezeichnung.
- **Zweck / Zielgruppe:** Nicht erforderlich und nicht Teil der eigenen Sprache.
- **Fachlicher Owner:** Nicht zutreffend.
- **Notwendige Inhalte:** Eigene Begriffe wie Für Betriebe, Preise, Verifiziertes Startprofil, Für
  Planer und Auftraggeber und Partnerschaften bleiben maßgeblich.
- **Release-Gates / Abhängigkeiten:** Status bleibt `NOT_PLANNED`; `PRO`-Bezeichnungen werden nicht
  als eigene GewerkeListe-Seiten eingeführt.
- **SEO / Indexierung:** Keine Seite, keine Indexierung.
- **Footer-Gruppe:** Keine.
- **Verlinkung:** Nicht vorgesehen.

#### Aggressive Werbeangebote und gekaufte Spitzenpositionen

- **Route / Stand:** Keine Zielroute und kein zulässiges Angebot.
- **Zweck / Zielgruppe:** Widerspricht neutraler Fachsuche und Vertrauen.
- **Fachlicher Owner:** Nicht zutreffend.
- **Notwendige Inhalte:** Kein Pay-to-rank, keine künstliche Sichtbarkeitsverknappung und keine
  aggressive Verkaufsrhetorik.
- **Release-Gates / Abhängigkeiten:** Status bleibt `NOT_PLANNED`; widersprechende Angebote dürfen
  weder implementiert noch verlinkt werden.
- **SEO / Indexierung:** Keine Seite, keine Indexierung.
- **Footer-Gruppe:** Keine.
- **Verlinkung:** Niemals.

#### Footer-Links auf leere, tote oder erfundene Seiten

- **Route / Stand:** Kein Ziel; dies ist ein verbindliches Negativkriterium.
- **Zweck / Zielgruppe:** Nutzer nicht in Sackgassen oder Scheinangebote führen.
- **Fachlicher Owner:** Product Owner / Engineering.
- **Notwendige Inhalte:** Jede verlinkte Route muss existieren, erreichbar sein, echten Inhalt und
  einen zuständigen Owner haben.
- **Release-Gates / Abhängigkeiten:** Vor jedem späteren Footer-Slice sind Route, Inhalt, Owner,
  SEO-Entscheidung und Linkziel reproduzierbar zu prüfen.
- **SEO / Indexierung:** Keine künstlichen Indexziele.
- **Footer-Gruppe:** Keine.
- **Verlinkung:** Niemals; Linkprüfung ist Teil jedes späteren Footer-Slices.

## Zielstruktur des späteren Footers

Die Zielstruktur ist ein Architekturziel, keine sofortige Änderung an `components/legal-footer.tsx`.
Ein Element wird erst aufgenommen, wenn sein Ziel in der Matrix als verlinkbar bestätigt ist.

### GewerkeListe

- Über uns
- Presse
- Magazin
- Karriere

### Suchen und Finden

- Suche / Firmenverzeichnis über `/suche`
- Alle Gewerke über `/gewerke`
- Alle Orte und Regionen über `/regionen`, sobald vorhanden
- Für Planer und Auftraggeber, sobald die spätere Seite existiert

### Für Betriebe

- Für Betriebe
- Betrieb eintragen
- Eintrag beanspruchen
- Preise nur bei `CONDITIONAL`-Freigabe
- Partnerschaften erst bei realen Kooperationen

### Hilfe und Sicherheit

- Hilfe und FAQ
- Daten korrigieren
- Inhalt melden als Teil des Korrekturprozesses
- Sicherheit
- Sicherheitslücke melden erst bei betreutem Prozess

### Rechtliches

- Impressum
- Datenschutz
- Nutzungsbedingungen nach rechtlicher Prüfung
- Datenschutzeinstellungen nur bei echtem Präferenzsystem
- Barrierefreiheit nur bei Anwendbarkeit und belastbarer Prüfung
- Widerruf nur bei tatsächlichem Vertrag und konkretem Bedarf

## SEO-, Vertrauens- und Release-Grundsätze

- Keine Sitemap- oder Footer-Aufnahme ohne existente, erreichbare und inhaltlich belastbare Route.
- Öffentliche Informations- und Suchseiten dürfen `index, follow` erhalten, wenn Inhalt, Canonical-
  Regeln und Datenqualität geprüft sind.
- Utility-, Claim-, Präferenz- und technische Prozessseiten werden nicht als SEO-Landingpages
  behandelt und erhalten bei der Implementierung eine bewusste Indexierungsentscheidung.
- Leere Regionen, leere Kategorien, unbetreute Kontakte und nicht vorhandene Social-Kanäle werden
  weder als SEO-Fläche noch als Footer-Vertrauenssignal genutzt.
- „Verifiziert“ bezeichnet bestätigte Betriebsdaten und ist keine Qualitätsgarantie, Empfehlung,
  Bonitätsprüfung oder fachliche Zertifizierung.
- Preise, Partnerschaften oder andere bezahlte Angebote dürfen die fachliche Suchrelevanz nicht
  verändern und keine organische Spitzenposition kaufen.
- Rechtstexte, Barrierefreiheitsaussagen, Datenschutz- und Verbraucherinformationen werden nur auf
  einer geprüften tatsächlichen Grundlage veröffentlicht.
- Kein Wortlaut, Footer-Aufbau, Produktname oder Spezialbereich wird blind von Kleinanzeigen oder
  einer anderen Plattform kopiert. Gute Standards werden auf die Rolle von GewerkeListe übertragen.

## Spätere Umsetzungsslices

Die folgende Reihenfolge ist die Referenz für einzelne spätere PRs; sie ist keine zweite Roadmap:

1. Vorhandene Navigation und tote oder widersprüchliche Links bereinigen.
2. Hilfe/FAQ und Datenkorrektur als betreute Servicewege umsetzen.
3. Sicherheit, vertrauenswürdige Nutzung und Inhalte-melden-Prozess umsetzen.
4. Nutzungsbedingungen und rechtliche Bedarfsprüfung für weitere Legal-Seiten durchführen.
5. Orte-, Regionen- und Firmenübersichten auf belastbarer Datenbasis umsetzen.
6. Presse und Sicherheitskontakt erst nach ihren jeweiligen Voraussetzungen veröffentlichen.
7. Magazin, Karriere, Partnerschaften und professionelle Informationsbereiche nur bei echter
   Grundlage ergänzen.

Jeder Slice braucht eigene Akzeptanzkriterien, fachlichen Owner, Release-Gate, Link-/SEO-Prüfung,
Typecheck/Lint/Tests/Build soweit relevant, unabhängiges Review und einen eigenen PR. Dieser
Dokumentations-PR implementiert keinen dieser Slices.

## Quellen des Ist-Abgleichs

- `components/legal-footer.tsx`
- `components/site-header.tsx`
- `app/layout.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- öffentliche `app/**/page.tsx`-Routen auf `origin/main`
- `AGENTS.md`
- `GEWERKELISTE_GRUNDSATZ.md`
- `GEWERKELISTE_PRODUCT_DOCTRINE.md`
- `BUSINESSPLAN_GEWERKELISTE_V2.md`
- `docs/agent-company/IMPLEMENTATION_ROADMAP.md`
- `docs/knowledge/decisions/architecture-decisions.md`
