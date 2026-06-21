# GewerkeListe.com - Die digitale Infrastruktur der Bauwirtschaft

**Untertitel:** Die regionale B2B-Daten-, Sichtbarkeits-, Vertrauens- und Kapazitaetsinfrastruktur fuer das Baugewerbe im DACH-Raum  
**Autor:** Andreas Moser  
**Stand:** Juni 2026  
**Status:** Verbindliche Strategieversion fuer Produkt-, Codex- und Agentenentscheidungen. Finanzteil noch zu ergaenzen/finalisieren.

Dieser Businessplan ist zusammen mit:

- `GEWERKELISTE_PRODUCT_DOCTRINE.md`
- `AGENTS.md`
- `AGENT_OPERATING_RULES.md`

die verbindliche strategische Grundlage fuer Codex und alle spaeteren KI-Agenten.

Bei Widerspruechen gilt:

1. Sicherheits-/Compliance-Regeln
2. Product Doctrine
3. Businessplan
4. Feature-Wuensche
5. technische Bequemlichkeit

GewerkeListe.com ist die hochspezialisierte, datengetriebene Such-, Vertrauens- und Infrastrukturschicht vor der eigentlichen Ausschreibung, Angebotsanfrage und Vergabe. Bezahlt wird fuer belegbare B2B-Sichtbarkeit, verifizierte Darstellung, Datenbestaetigung, Reputation und perspektivisch Kapazitaets- und Marktdaten.

## Inhaltsverzeichnis

1. [Executive Summary](#executive-summary)
2. [Was GewerkeListe.com loest](#was-gewerkelistecom-loest)
3. [Gruender](#gruender)
4. [Marktproblem und Bedarfslage](#marktproblem-und-bedarfslage)
5. [Warum bestehende Loesungen nicht reichen](#warum-bestehende-loesungen-nicht-reichen)
6. [Volkswirtschaftlicher Nutzen](#volkswirtschaftlicher-nutzen)
7. [Loesung und Produktlogik](#loesung-und-produktlogik)
8. [Wirkungskreis-Suche statt nur Radius](#wirkungskreis-suche-statt-nur-radius)
9. [Zielgruppen und Nutzenversprechen](#zielgruppen-und-nutzenversprechen)
10. [Partneroekosystem](#partneroekosystem-baustofflieferanten-hersteller-und-fachgrosshandel)
11. [Spaeterer Innovationspfad](#spaeterer-innovationspfad-bauvorhaben-gewerke-bedarf-und-regionale-kapazitaetsplanung)
12. [Marktanalyse und Dimensionierung](#marktanalyse-und-dimensionierung)
13. [Juristischer Burggraben und Differenzierung](#juristischer-burggraben-und-differenzierung)
14. [Geschaeftsmodell und Monetarisierung](#geschaeftsmodell-und-monetarisierung)
15. [Regionale Break-even-Logik](#regionale-break-even-logik)
16. [Go-to-Market-Strategie](#go-to-market-strategie)
17. [Aktivierungskanaele und CAC-Matrix](#aktivierungskanaele-und-cac-matrix)
18. [Messe-, Baustellen- und Offline-to-Online-Strategie](#messe-baustellen-und-offline-to-online-strategie)
19. [Produktstrategie und Roadmap](#produktstrategie-und-roadmap)
20. [KI-Agenten- und Datenqualitaetsstrategie](#ki-agenten-und-datenqualitaetsstrategie)
21. [Recht, DSGVO, UWG und Datenquellen](#recht-dsgvo-uwg-und-datenquellen)
22. [Finanzteil - noch zu ergaenzen](#finanzteil---noch-zu-ergaenzen)
23. [Quellen und Leitplanken](#quellen-und-leitplanken)
24. [Verbindlichkeitsregel](#verbindlichkeitsregel)

## Executive Summary

GewerkeListe.com ist ein professionelles, B2B-fokussiertes Fachregister fuer das Baugewerbe. Die Plattform macht Bau- und Handwerksbetriebe tiefenstrukturiert nach Gewerk, Leistung, Spezialisierung, tatsaechlichem Wirkungskreis und spaeter nach Projekt- und Kapazitaetsbezug sichtbar.

Planer, Architekten, Bauleiter, Generalunternehmer, Kommunen, Hausverwaltungen und professionelle Bauherren finden dadurch schneller passende Betriebe. Betriebe erhalten kostenlose Grundsichtbarkeit, koennen ihre Eintraege in einem rechtssicheren Claim-Prozess uebernehmen und spaeter optionale Zusatzfunktionen hinzubuchen.

Der Kernunterschied zum Status quo:

GewerkeListe.com verkauft keine garantierten Auftraege, keine Auktionen und keine Kontaktdaten. Die Plattform ersetzt private Excel-Listen, unvollstaendige Google-Suchen und teure B2C-Leadportale durch eine dynamische, aktuelle und fachlich strukturierte Suchschicht vor Ausschreibung, Angebotsanfrage und Vergabe.

GewerkeListe.com macht einen bestehenden, fragmentierten Markt sichtbar und reduziert Verschwendung, die heute durch Intransparenz, Zufall, schlechte Auffindbarkeit, alte Kontaktlisten, falsche Anfragen, ungenutzte Kapazitaeten, verspaetet sichtbare Bauvorhaben und ineffiziente Projektanbahnung entsteht.

Die Startstrategie ist hyper-lokal: Rosenheim/Chiemgau dient als Proof-of-Market. Dort wird gezeigt, ob regionale Datendichte, Planer-Nutzung, Claims, Sichtbarkeitsdaten und erste Zahlungsbereitschaft zusammen funktionieren. Erst danach folgt die clusterweise Expansion ueber Muenchen-Salzburg-Innsbruck und weitere DACH-Regionen.

Langfristig entsteht aus GewerkeListe.com ein B2B-Gewerke-Graph: Betriebe, Gewerke, Wirkungskreise, Planer, Bauvorhaben, Kapazitaeten, Lieferanten und Herstellerbeziehungen werden strukturiert sichtbar. Daraus koennen spaeter Datenprodukte, Enterprise-Zugaenge und Kapazitaetsindikatoren fuer ConTech, PropTech, GU, Kommunen und Lieferanten entstehen.

| Dimension | Kernaussage |
| --- | --- |
| Problem | Der Markt ist nicht leer, sondern schlecht sortiert: Planer suchen muehsam, Betriebe sind digital schwach sichtbar, Kapazitaeten werden nicht optimal genutzt. |
| Loesung | Fachliche B2B-Suche nach Gewerk, Ort, Wirkungskreis, Spezialisierung, Verifizierungsstatus und spaeter Projekt-/Kapazitaetsbezug. |
| Startmarkt | Rosenheim/Chiemgau als Proof-of-Market; regionale Dichte vor nationaler Streuung. |
| Zahlungsgrund | Keine Leadgarantie, sondern belegbare Sichtbarkeit, Profilqualitaet, QR/Custom-URL, Sichtbarkeitsreport, Reputation. |
| Moat | First-Party-Daten, Claims, rechtssichere Datenpipeline, Wirkungskreis-Daten, Planer-Nutzung und spaeter Gewerke-Graph. |
| Hauptengpass | Datenqualitaet, rechtssichere Aktivierung, echte Planer-Retention und erster Bezahlbeweis. |
| Naechster harter Schritt | 500-1.000 Profile, 20 Planer-Testnutzer, View-Tracking, Claim-Prozess, erster Sichtbarkeitsreport und Supporter-Test. |

## Was GewerkeListe.com loest

Der Bau- und Handwerksmarkt ist nicht leer. Er ist voll, aber schlecht sortiert. Betriebe, Projekte, Planer, Baustofflieferanten, Hersteller, Fachgrosshandel und Nachfrage existieren bereits. Was fehlt, ist eine strukturierte, regionale, fachlich tiefe und vertrauenswuerdige Verbindungsschicht.

Der wahre Feind ist nicht die Konkurrenz, sondern die Gewohnheit: Architekten und Bauleiter arbeiten in der Discovery-Phase haeufig mit veralteten Excel-Listen oder denselben Stammkontakten. Dadurch werden immer wieder dieselben oft ausgebuchten Betriebe angefragt, waehrend spezialisierte, passende, junge oder regional besser geeignete Betriebe unsichtbar bleiben.

GewerkeListe.com setzt genau bei der Frage an, wer grundsaetzlich fuer ein Gewerk, eine Region, eine Spezialisierung und einen Zeitraum relevant ist. Wenn Bauvorhaben, Bedarfe und Kapazitaeten frueher sichtbar werden, koennen Betriebe regionaler planen, Planer gezielter anfragen und Gewerkeengpaesse besser erkennen.

Beispiel:

Ein Betrieb aus Rosenheim nimmt ein Bauvorhaben im Norden von Muenchen fuer das naechste Jahr an, weil dieses Projekt frueher sichtbar war. Wenig spaeter entsteht in Rosenheim ein Projekt, das fachlich besser passt, weniger Fahrzeit verursacht und fuer Mitarbeiter und regionale Reputation attraktiver waere. Der Betrieb kann es nicht mehr annehmen, weil seine Kapazitaet gebunden ist. Das Problem war nicht fehlende Nachfrage, sondern fehlende fruehzeitige Markttransparenz.

## Gruender

In einem traditionellen, beziehungsgetriebenen Markt wie dem Baugewerbe schlaegt Branchenwissen reine Software-Expertise. Andreas Moser versteht Baupraxis, die Sprache der Handwerker, die Denkweise von Planern, die VOB-/Vergabe-Logik und die Reibungsverluste auf Baustellen. Dieser Gruender-Markt-Fit ist essenziell fuer die regionale Offline-to-Online-Aktivierung.

Die Technologie - Next.js, Supabase, KI-Agenten, Geodaten, Suchlogik - ist der Hebel. Der eigentliche Motor ist aber das Verstaendnis, welche Daten fuer einen Bauleiter, Architekten oder Qualitaetsbetrieb wirklich zaehlen. Genau dieser Zugang macht die ersten Claims, Planer-Interviews, regionalen Partnergespraeche und die Produktpriorisierung glaubwuerdig.

## Marktproblem und Bedarfslage

Das Marktproblem verdichtet sich durch drei Trends: Fachkraeftemangel, fragmentierte regionale Daten und digitale Rueckstaende in kleinen Betrieben. Gleichzeitig verschiebt sich Nachfrage in Richtung Sanierung, Energie, PV, Waermepumpen, Infrastruktur und Umbau. Gerade dort brauchen Planer schnell spezialisierte Betriebe und Betriebe brauchen passende Sichtbarkeit ohne Preisdruck-Leadportale.

Digitalisierung wird im Handwerk als Chance gesehen, Fachkraeftemangel bleibt zentral, KI-Nutzung ist niedrig.

| Alltagssituation | Warum es schmerzt | GewerkeListe-Antwort |
| --- | --- | --- |
| Bauleiter sucht kurzfristig Estrichleger | Google liefert Treffer, aber keine Leistungstiefe, Verfuegbarkeit oder Wirkungskreis. | Fachsuche nach Gewerk, Ort, Spezialisierung, Wirkungskreis und spaeter Kapazitaetsindikator. |
| Architekt nutzt immer dieselben Betriebe | Private Listen sind bequem, aber geschlossen, veralten und schaffen kuenstliche Verknappung. | Dynamische B2B-Suchschicht mit Claims, Merklisten und neuen Betrieben. |
| Spezialbetrieb ist digital unsichtbar | Sichtbeton, KNX-Programmierung oder Klimaanlageninstallation werden online nicht B2B-gerecht sichtbar. | Profil mit Spezialisierungen, Referenzen und Zertifikaten. |
| Betrieb zahlt fuer Leadportale | B2C-Anfragen, Preisvergleiche, Kontaktkosten und keine echte B2B-Reputation. | Keine Leadauktion; bezahlte Sichtbarkeit erst nach messbarem Nutzen. |
| Lieferant kennt Einkaufsdaten, aber nicht den Markt | CRM zeigt Kunden, aber nicht offene regionale Gewerkeluecken oder Projektbedarfe. | Spaeter aggregierte Gewerke-Reports, Partnerprofile und Marktindikatoren. |

## Warum bestehende Loesungen nicht reichen

| Alternative | Staerke | Luecke fuer GewerkeListe.com |
| --- | --- | --- |
| Google Maps | Reichweite, Gewohnheit, Bewertungen. | Keine VOB-nahe Tiefe, keine Wirkungskreis-Suche, keine Planer-Arbeitslogik, kein Claim-/Sichtbarkeitsreport. |
| HWK-/Innungslisten | Offizieller Anstrich, Grundvertrauen. | Haeufig grobe Kategorien, schwache UX, wenig Leistungstiefe, keine operative Such- und Sichtbarkeitslogik. |
| Leadportale: MyHammer, Check24, Aroundhome | Koennen kurzfristig Anfragen erzeugen. | B2C-lastig, Preisdruck, Kontaktgebuehren, keine neutrale B2B-Vertrauensschicht. |
| B2B-Verzeichnisse: wlw, 11880, Europages | Sichtbarkeit, etablierte Portallogik. | Breit, teuer, nicht bauhandwerklich und regional-operativ genug. |
| AVA-/ConTech-Tools: Cosuno, Capmo | Stark ab LV/Ausschreibung/Vergabe. | Setzen haeufig vorhandene Netzwerke voraus; GewerkeListe fuellt die Discovery-Schicht davor. |
| Private Excel-Listen | Hohe Relevanz im einzelnen Buero. | Geschlossen, veralten, nicht neutral, nicht fuer neue Marktteilnehmer sichtbar. |
| Baustoffhaendler-CRM | Kennt Einkaufsbeziehungen. | Kein neutraler Marktueberblick, setzt vorhandene Netzwerke voraus. |

Private Gewerkelisten sind ein echter versteckter Wettbewerber. Kontakte sind Gold. Manche Planer haben zunaechst kein Interesse an mehr Transparenz, weil ihre eigene Kontaktliste ein Vorteil ist. GewerkeListe.com muss diese Gruppe nicht sofort ueberzeugen. Early Adopter sind Planer, die Zeit sparen, neue Betriebe finden und eine breitere Marktabdeckung erreichen wollen.

Der private Einfamilienhausbau wird teilweise weiter ueber Bekannte und persoenliche Empfehlungen laufen. Das ist kein Widerspruch. GewerkeListe.com ersetzt Empfehlungen nicht, sondern ergaenzt den Markt dort, wo professionelle Suche, Markttransparenz, Kapazitaetssteuerung und bessere digitale Darstellung fehlen.

## Volkswirtschaftlicher Nutzen

In einem Markt mit knappen Fachkraeften wird die bessere Allokation vorhandener Kapazitaeten selbst zum Produktivitaetshebel. GewerkeListe.com schafft nicht automatisch mehr Fachkraefte. Die Plattform kann aber dafuer sorgen, dass vorhandene Betriebe, vorhandene Kapazitaeten und vorhandene Nachfrage besser zueinander finden.

- weniger Suchkosten und Informationsasymmetrie
- weniger Streuverluste und falsche Anfragen
- weniger unnoetige Angebotsrunden
- geringere Fahrtzeiten durch besseres Hyper-Local-Matching
- schnellere Ersatzsuche bei Ausfall oder Kapazitaetsengpass
- bessere regionale Kapazitaetsnutzung
- fruehere Sichtbarkeit struktureller Gewerkeluecken

Langfristig koennen Standortsignale entstehen: Wenn in einer Region viele Bauvorhaben geplant sind, aber kaum sichtbare Abdichter, Estrichleger, Trockenbauer oder Spezialbetriebe vorhanden sind, ist das relevant fuer Gruender, expandierende Betriebe, Investoren, Kommunen und Wirtschaftsfoerderer.

GewerkeListe.com eliminiert Verschwendung im Bau- und Handwerksmarkt, indem bestehende Marktteilnehmer, Bauvorhaben, Bedarfe, Einsatzgebiete und Kapazitaeten sichtbarer, vergleichbarer und besser auffindbar werden.

## Loesung und Produktlogik

GewerkeListe.com ist das digitale Betriebssystem fuer die B2B-Bausuche vor der Ausschreibung. Das Kernprodukt ist eine regionale Fachsuche mit strukturierten Betriebsprofilen. Jedes Profil kann Leistungen, Spezialisierungen, Region, Wirkungskreis, Kontaktinformationen, Referenzen, Bilder, Logo, Verifizierungsstatus und spaeter Kapazitaets- oder Projektbezug enthalten.

| Produktbaustein | Nutzen |
| --- | --- |
| Gewerk + Ort + Umkreis | Schnelle Suche nach passenden Betrieben fuer eine Region. |
| Wirkungskreis-Markierung | Betrieb zeigt, wo er wirklich arbeiten will - nicht nur Sitz und Radius. |
| Profilseite | Digitales B2B-Aushaengeschild mit Leistungen, Spezialisierung, Bildern, Referenzen, Zertifikaten. |
| Claim-/Korrekturprozess | Datenqualitaet, Eigentum am Profil, Verifizierung und Korrekturpfad. |
| Custom-URL | Profil ist teilbar, druckbar und auf Fahrzeug, Banner oder Visitenkarte nutzbar. |
| QR-Code | Offline-Werbung fuehrt direkt zum Profil. |
| View-Tracking | Beweist Sichtbarkeit und ermoeglicht Pro-Verkauf. |
| Sichtbarkeitsreport | Monatlicher Nachweis: Profilaufrufe, Trends, Suchkontext soweit datenschutzkonform. |

## Wirkungskreis-Suche statt nur Radius

Eine reine Umkreissuche ist im Baugewerbe zu grob. Handwerksbetriebe arbeiten nicht in perfekten Kreisen, sondern entlang von Verkehrsachsen, Regionen, Gewohnheiten, Mitarbeiterwegen, Auftragstypen und wirtschaftlichen Praeferenzen. Ein Trockenbauer in Rosenheim faehrt vielleicht nach Muenchen, aber nicht in eine andere Richtung mit schlechter Erreichbarkeit.

GewerkeListe.com soll deshalb nicht nur Adresse und Radius erfassen, sondern den tatsaechlichen Wirkungskreis. Technisch kann das schrittweise erfolgen: zuerst PLZ-/Landkreis-Cluster und Prioritaetsregionen, spaeter frei markierbare Polygonflaechen auf einer Karte.

| Suchmodell | Vorteil | Nachteil / Status |
| --- | --- | --- |
| Stumpfer Radius | Einfach zu bauen und zu verstehen. | Fuer viele Betriebe falsch; ignoriert Verkehrsachsen und tatsaechliche Einsatzlogik. |
| PLZ-/Landkreis-Auswahl | Einfacher als Polygon, besser als Radius. | Verwaltungsgrenzen sind nicht immer betriebliche Realitaet. |
| Markierbares Einsatzgebiet | Sehr nah an der Realitaet, stark fuer Planer, Betriebe und Recruiting. | Mehr UI-/Datenaufwand. |
| Priorisierte Regionen | Betrieb trennt Wunschregionen und weniger attraktive Gebiete. | Braucht gute Pflege und klare Nutzerfuehrung. |

Die frei markierbare Wirkungskreis-Suche ist als differenzierendes Feature zu behandeln. Vor einer externen Behauptung "das gibt es nicht" ist ein Wettbewerbscheck noetig. Strategisch bleibt die Kombination aus Gewerkelogik, B2B-Suche, Claim und Wirkungskreis im regionalen Baukontext stark differenzierend.

## Zielgruppen und Nutzenversprechen

| Zielgruppe | Schmerz | Nutzen | Monetarisierung |
| --- | --- | --- | --- |
| Bau- und Handwerksbetriebe | Schwache digitale B2B-Sichtbarkeit, Leadportal-Frust, unklare Spezialisierungen. | Kostenlose Grundsichtbarkeit, Profil, Wirkungskreis, QR, Sichtbarkeitsreport, Reputation. | Verified/Supporter, Pro-Profil, Premium, Recruiting, Kapazitaetsmodule. |
| Planer/Architekten/Bauleiter/GU | Suchzeit, alte Kontaktlisten, fehlende Leistungstiefe, unklare Einsatzgebiete. | Schnelle Fachsuche, Merklisten, bessere Marktuebersicht, spaetere Projektlisten/Exporte. | Spaeter Pro-Suche, Teamzugaenge, Enterprise. |
| Kommunen/Hausverwaltungen/professionelle Bauherren | Bedarf an verlaesslicher regionaler Suche und Gewerkeabdeckung. | Strukturierte Suche, regionale Marktuebersicht, spaetere Kapazitaetsberichte. | Spaeter Datenmodule/Enterprise. |
| Baustofflieferanten/Hersteller/Fachgrosshandel | Kundenbeziehungen vorhanden, aber kein offener strukturierter Gewerke- und Bedarfsgraph. | Marktnaehe, Partnerprogramme, aggregierte Reports, sichtbare Fachhandelspartner mit Zustimmung. | Spaeter Partnerprofile, Sponsoring, Reports, Co-Branding, Events. |

## Partneroekosystem: Baustofflieferanten, Hersteller und Fachgrosshandel

Baustofflieferanten, Hersteller und B2B-Fachgrosshaendler werden nicht als Start-Monetarisierung eingepreist, sind aber ein starker spaeterer Werthebel. Beispiele sind BayWa, Stark Group/Raab Karcher, Kreiller, Richter+Frenzel, Heinze, SHK-Grosshaendler, Elektro-Grosshandel wie FEGA & Schmitt, Holz-/Schreiner-Fachlieferanten, Werkzeug- und Maschinenanbieter sowie Systemhersteller.

| Kooperationsform | Nutzen fuer Partner | Schutz der Plattformneutralitaet |
| --- | --- | --- |
| Partnerprofil | Relevante Sichtbarkeit im B2B-Oekosystem. | Keine bevorzugte Betriebssortierung nur gegen Geld. |
| Lieferantenlogo auf Betriebsprofil | Betrieb zeigt eigene Fachhandelspartner. | Nur mit Zustimmung des Betriebs. |
| Schulungen/Events | Hersteller erreicht passende Gewerke. | Fachlicher Mehrwert statt Werbeflaeche. |
| Co-Branding von Aufklebern/Bauzaunbannern | Partner unterstuetzt Aktivierung, Betrieb bekommt Material. | Betrieb bleibt Hauptmarke, GewerkeListe bleibt neutral. |
| Aggregierte Gewerke-Reports | Regionale Markt- und Bedarfsinformationen. | Nur aggregiert, keine sensiblen Einzelinformationen ohne Rechtsgrundlage. |
| Haendler motiviert Kunden zur Profilpflege | Hohe Trust-Wirkung ueber bestehende Beziehung. | Sauberer Opt-in-/Claim-Prozess. |
| Regionale Heatmaps | Wo sind Gewerke sichtbar, wo fehlen Leistungen? | Keine personenbezogenen Rueckschluesse ohne Freigabe. |

Strategische Regel: Partnererloese duerfen nicht zu frueh dominieren. Wenn die Plattform als Lieferantenwerbung wahrgenommen wird, verliert sie Vertrauen bei Betrieben und Planern. Der Partnerpfad gehoert nach der Validierung von Suchnutzen, Datenqualitaet und Claims.

## Spaeterer Innovationspfad: Bauvorhaben, Gewerke-Bedarf und regionale Kapazitaetsplanung

Das spaetere Bauvorhaben-Modul ist der groesste strategische Hebel, aber nicht Tag 1. Es kann Bauvorhaben mit benoetigten Gewerken, bereits vergebenen Gewerken, offenen Leistungspaketen, Zeitraeumen, Projektstatus und Region abbilden. Dadurch wird Nachfrage frueher sichtbar, nicht erst im Moment der Ausschreibung.

Langfristig kann GewerkeListe.com Projektentwicklern und Investoren helfen, Vorhaben dann zu planen, wenn in einer Region Kapazitaet realistisch verfuegbar ist. Das naehert sich einer Lean-Production-Logik fuer die Bauwirtschaft: vorhandene Ressourcen werden datenbasiert eingesetzt, statt zufaellig durch frueh oder spaet sichtbare Ausschreibungen gebunden zu werden.

Diese Vision muss defensiv formuliert werden. GewerkeListe.com kann nicht garantieren, wann Kapazitaet vorhanden ist. Aber aus Profilen, Wirkungskreisen, Projektlisten, Suchverhalten, Claims, Ampeln, Planer-Merklisten und aggregierten Daten koennen spaeter Indikatoren entstehen, die heute nicht sichtbar sind.

## Marktanalyse und Dimensionierung

### Strategische Einordnung und Praemissen der Marktdimensionierung

Die Plattform verfolgt eine dezidierte Netzwerkonomie-Strategie, deren Monetarisierungslogik sich fundamental von traditionellen SaaS-Vertriebsmodellen oder reinen Lead-Generation-Portalen unterscheidet. Die Marktlogik geht explizit nicht davon aus, dass alle erfassten Handwerksbetriebe als sofort zahlende Kunden fungieren. Vielmehr startet das System mit der Aggregation und Kuratierung von Basisprofilen, um eine kritische Masse an Angebotsdaten zu erzeugen.

Diese Liquiditaet auf der Angebotsseite ist der primaere Anreiz fuer die Nachfrageseite, das System als verlaessliches Sourcing- und Recherche-Tool in den Arbeitsalltag zu integrieren. Monetarisiert wird in der Folge lediglich eine kleine Minderheit hochgradig affiner und zahlungsbereiter Betriebe. Dieses Modell ist betriebswirtschaftlich skalierbar, solange die regionale Marktabdeckung maximal bleibt und die Betriebskosten pro zusaetzlichem Profil durch Automatisierungseffekte marginalisiert werden.

### Paradigmenwechsel der Plattformoekonomie: Profil-Liquiditaet vor Sofortumsatz

GewerkeListe.com operiert als mehrseitiger Markt. Auf der einen Seite stehen die Handwerksbetriebe des Bau- und Ausbaugewerbes, auf der anderen Seite professionelle Planer und Architekten. Das Henne-Ei-Problem solcher Plattformen wird geloest, indem die Angebotsseite initial ohne deren aktives Zutun durch strukturierte, oeffentlich zugaengliche oder aggregierte Daten in Form von Basisprofilen abgebildet wird.

Ein planender Architekt braucht keine Plattform, auf der nur fuenf Prozent der regionalen Handwerker verzeichnet sind. Er braucht eine holistische Plattform, die im Idealfall nahezu den gesamten Markt abbildet. TAM und SAM definieren daher primaer die Datenbasis und das Volumen der zu verwaltenden Entitaeten, nicht die unmittelbare Kundenbasis im monetaeren Sinn.

Der erste entscheidende Call-to-Action fuer Handwerksbetriebe ist nicht der Kauf eines Abonnements, sondern der Claim: die Uebernahme, Verifizierung und Anreicherung ihres bereits existierenden Basisprofils. Erst wenn Betriebe den Mehrwert spueren, etwa durch Traffic-Auswertungen oder qualifizierte Anfragen von Architekten, wird Upselling relevant.

### Total Addressable Market (TAM): Die Vision der DACH-Region

Die DACH-Region bildet den makrooekonomischen Rahmen und die langfristige Skalierungsvision. Der Markt zeichnet sich durch eine hohe kulturelle Homogenitaet in der handwerklichen Ausbildung aus. Das duale System sowie der Meisterzwang in vielen Gewerken praegen die Qualitaetsstandards. Gleichzeitig weisen alle drei Laender aehnliche strukturelle Herausforderungen auf: Fachkraeftemangel, Nachfolgeprobleme und Digitalisierungsrueckstand in der operativen Betriebsfuehrung.

Die Herleitung des Gesamtbestands an handwerksnahen Betrieben erfordert eine Aggregation verschiedener statistischer Aemter, weil Definitionen von "Handwerk", "Baugewerbe" und "Ausbaugewerbe" je nach Land variieren. In Summe laesst sich ein TAM von deutlich ueber einer Million Betrieben ueber alle Gewerke hinweg validieren. Der spezifisch relevante Kernmarkt der Bau- und Ausbaubetriebe sowie handwerksnaher Dienstleister belaeuft sich auf mehrere hunderttausend bis ueber eine Million relevante Profile, abhaengig von finaler Definition und Datenabgrenzung.

#### Deutschland

Deutschland stellt das klare Zentrum der Marktdimensionierung dar. Laut ZDH-Betriebsstatistik waren zum 31. Dezember 2024 in Deutschland insgesamt 1.038.315 Betriebe eingetragen. Das ZDH-Verzeichnis erfasst alle Handwerksbetriebe; fuer GewerkeListe.com relevant ist primaer das Bau- und Ausbauhandwerk.

- Anlage A: 652.686 Betriebe.
- Anlage B1: 275.125 Betriebe.
- Anlage B2: 110.224 Betriebe.

Der Gesamtumsatz des deutschen Handwerks belief sich 2024 auf rund 770,7 Milliarden Euro ohne MwSt., erwirtschaftet von etwa 5,6 Millionen Erwerbstaetigen.

| Gewerbegruppe (Destatis 2024) | Anzahl Unternehmen | Taetige Personen | Umsatz in Tsd. Euro | Umsatz je taetige Person |
| --- | ---: | ---: | ---: | ---: |
| I. Bauhauptgewerbe | 76.877 | 826.620 | 137.881.040 | 166.801 EUR |
| II. Ausbaugewerbe | 213.306 | 1.635.288 | 213.116.778 | 130.324 EUR |
| Summe Kernmarkt (Destatis) | 290.183 | 2.461.908 | 350.997.818 | - |

Quelle: Statistisches Bundesamt, Handwerkszaehlung 2024. Der Gesamtwert des deutschen Handwerks liegt laut Destatis bei 564.045 erfassten Unternehmen mit 761,6 Milliarden Euro Umsatz.

Diese rund 290.000 Betriebe bilden den harten statistischen Kern des deutschen TAM. Die tatsaechliche Anzahl relevanter Profile duerfte durch Ein-Personen-Betriebe, B2-Gewerbe und spezialisierte Manufakturen noch deutlich hoeher liegen und sich der Marke von 400.000 Profilen naehern.

#### Oesterreich

Die Sparte "Gewerbe und Handwerk" der WKO umfasste 2024 exakt 233.799 Unternehmen mit 763.850 Beschaeftigten und 139,6 Milliarden Euro Nettoumsatz. Das Gewerbe und Handwerk repraesentiert 42,5 Prozent aller Kammermitglieder und ist die groesste WKO-Sparte.

Ende 2025 verzeichnete die WKO 336.319 aktive Fachgruppenmitgliedschaften in der Sparte, inklusive Mehrfachzaehlungen. Relevante Fachgruppen sind unter anderem Tischler und Holzgestalter, SHK-Techniker, Elektro-/Gebaeude-/Alarm-/Kommunikationstechniker, Maler und Tapezierer, Dachdecker, Glaser und Spengler sowie Bauhilfsgewerbe und Holzbau.

Fuer den DACH-TAM addiert Oesterreich konservativ geschaetzt weitere 60.000 bis 80.000 relevante Bau- und Ausbauprofile.

#### Schweiz

Die Schweiz nutzt die NOGA-Klassifikation. Der Abschnitt F umfasst Hochbau, Tiefbau sowie vorbereitende Baustellenarbeiten, Bauinstallation und sonstiges Ausbaugewerbe. Die Bauwirtschaft umfasst ueber 75.000 Unternehmen mit rund 500.000 Beschaeftigten und ueber 65 Milliarden Schweizer Franken Jahresumsatz.

Ueber 90 Prozent der Unternehmen im Bereich Planung und Ausbaugewerbe sind KMU. Fuer die Schweiz ergibt sich ein relevantes Profilpotenzial von etwa 50.000 bis 65.000 Unternehmen.

#### Konsolidierung des TAM DACH

| Land | Basisbestand | Herleitung der relevanten Profile |
| --- | --- | --- |
| Deutschland | > 1,03 Millionen Betriebe | ca. 290.000 bis > 400.000 |
| Oesterreich | 233.799 Unternehmen | ca. 60.000 bis 80.000 |
| Schweiz | > 75.000 Unternehmen (NOGA F) | ca. 50.000 bis 65.000 |
| DACH Gesamt | > 1,3 Millionen Betriebe | mehrere hunderttausend bis ueber 1 Mio. Profile |

Anmerkung zur Validierung fuer externe Kommunikation: Die Spanne ergibt sich aus der Definitionstiefe. Die Nutzerrecherche von GewerkeListe.com deutet darauf hin, dass Architekten auch spezialisierte Nischenbetriebe, Ein-Personen-Gewerke, Nebengewerke oder Manufakturen suchen. Diese fallen in offiziellen Unternehmensstatistiken teils durch das Raster, sind aber fuer die Plattform essenziell.

### Serviceable Available Market (SAM): Der Fokusmarkt Bayern

Der Gesamtmarkt DACH ist zu fragmentiert und zu gross, um ihn mit einer Startfinanzierung effizient zu penetrieren. Bayern bietet sich als idealer SAM an: starke Wirtschaftskraft, lokale Handwerkstradition, anhaltende Bauttaetigkeit und belastbare statistische Basisdaten.

#### Belastbare Strukturdaten des bayerischen Handwerks

Im Jahr 2024 existierten in Bayern exakt 105.134 Handwerksunternehmen. Zieht man die Rollenfuehrung der Handwerkskammern heran, liegt die Zahl der Betriebsstaetten sogar bei 215.285.

Die bayerischen Handwerksunternehmen beschaeftigten 2024 1.117.348 taetige Personen. Der Umsatz belief sich auf 152,4 Milliarden Euro. Das Handwerk in Bayern stellt 16 Prozent aller Unternehmen des Freistaats, beschaeftigt 13 Prozent der sozialversicherungspflichtigen Arbeitnehmer und bildet 29 Prozent aller Auszubildenden aus.

#### Branchenspezifische Abgrenzung im bayerischen SAM

Der SAM fokussiert sich auf Bau- und Ausbaugewerbe. Uebertragen auf die validierten Gesamtbestaende fuer 2024 ergibt sich ein bayerischer SAM von rund 50.000 bis 60.000 hochrelevanten Handwerksbetrieben im Bau- und Ausbausektor.

Angenommen, das System erreicht mittelfristig eine Profil-Abdeckung von 80 Prozent in Bayern (ca. 40.000 bis 48.000 Profile) und konvertiert davon konservativ 3 Prozent als zahlende Kunden. Bei 1.200 Premium-Kunden mit 1.200 Euro Jahresbeitrag entstuende ein ARR von knapp 1,5 Millionen Euro allein im Zielmarkt Bayern, bei minimalen operativen Kosten fuer die Datenpflege der restlichen kostenfreien Profile.

### Serviceable Obtainable Market (SOM): Proof-of-Market Rosenheim/Chiemgau

Der SOM wird initial auf Rosenheim/Chiemgau limitiert.

#### Strategische Bedeutung von Rosenheim als Labor

Rosenheim und angrenzende Chiemgau-Landkreise vereinen hohe Betriebsdichte, Kaufkraft, starke lokale Vernetzung, Bildungszentren, Innungen, Kreishandwerkerschaft und eine konjunkturelle Situation, in der digitale Sichtbarkeit fuer Betriebe relevanter wird.

#### Quantifizierung und Metriken der Beweisfuehrung im SOM

Fuer den regionalen Proof-of-Market wird von 2.500 bis 5.000 relevanten Profilen ausgegangen. Das Ziel ist nicht kurzfristige Umsatzmaximierung, sondern der Beweis der Plattformmechanik.

Zu validierende KPIs:

- Liquiditaet und Marktabdeckung: wahrgenommene Marktabdeckung von ueber 80 Prozent bei Architekten der Region.
- Planer-Retention: wiederkehrende Nutzung pro Monat.
- Claim-Rate: Anteil passiver Profile, die aktiv uebernommen und angereichert werden.
- Paid-Signal: Konvertierung einer Minderheit, beispielsweise 2 bis 3 Prozent der geclaimten Profile, in ein bezahltes Modell.

### Die Nachfrageseite: Das Planer- und Architekten-Oekosystem

Die Nachfrageseite besteht nicht aus B2C-Endkunden, sondern aus B2B-Professionals: Architekten, Innenarchitekten, Landschaftsarchitekten und Stadtplanern. Architekten sind zentrale Multiplikatoren, verwalten Budgets, treffen Materialentscheidungen, steuern Ausschreibungen und vergeben Auftraege.

Zum 1. Januar 2025 waren laut Bundesarchitektenkammer 142.120 Architekten und Stadtplaner registriert. In Deutschland gab es 50.574 freischaffende Architekten und Stadtplaner; ueber 42.000 davon entfallen auf Hochbauarchitekten. Zusaetzlich sind angestellte Architekten in Privatbueros relevant. Das direkte Zielpublikum in Deutschland liegt damit bei etwa 80.000 bis 100.000 prozesssteuernden Einzelpersonen.

In Bayern hat die Architektenkammer rund 26.000 Mitglieder. Der Anteil freischaffender Mitglieder liegt bei etwa 40,5 Prozent, also rund 10.500 Inhabern von Planungsbueros.

### Der Partnermarkt: Multiplikatoren und strategischer Upside

Der Baustoff-Fachhandel erwirtschaftet in Deutschland in rund 2.200 Niederlassungen einen Umsatz von ueber 20,4 Milliarden Euro. Der Umsatz mit gewerblichen Kunden macht 15,48 Milliarden Euro aus. Partner- und Sponsoring-Modelle koennen spaeter starke Hebel sein, duerfen aber die Plattformneutralitaet nicht gefaehrden.

Spezialgewerke wie SHK und Elektro sind durch Energiewende, hohen Materialumsatz und projektbezogene Wertschöpfung besonders relevant. Das deutsche SHK-Handwerk umfasste 2024 rund 48.050 Betriebe und 59,12 Milliarden Euro Umsatz. Das deutsche Elektrohandwerk verzeichnete 2024 rund 48.178 Unternehmen, 516.709 Beschaeftigte und 84,3 Milliarden Euro Umsatz.

### Makrooekonomische Treiber: Warum der Markt jetzt reif ist

Die Boomphase 2010 bis 2022 ist in weiten Teilen der DACH-Region beendet. Zinswende, Materialkosten und Krise im Wohnungsneubau veraendern den Markt. Wenn Auftraege nicht mehr von selbst kommen, steigt der Selektionsdruck. Betriebe muessen sich professionalisieren, krisensichere Netzwerke aufbauen und ihre Sichtbarkeit verbessern.

Gleichzeitig steigen Digitalisierungsdruck, Komplexitaet und Generationenwechsel. Architekten suchen nicht nur nach "einem Maurer", sondern nach konkreten Spezialisierungen. Strukturiertes Filtern nach Metadaten, Tags und Zertifikaten ist ein klarer Plattformnutzen.

## Juristischer Burggraben und Differenzierung

Das staerkste Asset ist die saubere Datenstrategie im aktuellen rechtlichen Umfeld. Massenhaftes ungeprueftes Scraping personenbezogener Daten und aggressive Kaltakquise werden riskanter. GewerkeListe.com baut deshalb einen First-Party-Datenstamm ueber Claims, Opt-in-nahe Aktivierung, postalische oder rechtlich gepruefte Benachrichtigung, Quellenprotokolle und Datenminimierung auf.

BGH VI ZR 10/24 bestaetigt, dass schon kurzzeitiger Kontrollverlust ueber personenbezogene Daten einen immateriellen Schaden nach Art. 82 DSGVO darstellen kann. Das BVerwG 6 C 3.23 zeigt, dass Telefonwerbung mit oeffentlich verfuegbaren Kontaktdaten ohne zumindest mutmassliche Einwilligung datenschutz- und wettbewerbsrechtlich problematisch sein kann.

Fuer GewerkeListe.com bedeutet das: kein aggressives Scraping, keine Telefon-Kaltakquise als Hauptkanal, sondern First-Party-Claims, Opt-out, Post/Opt-in und transparente Datenherkunft.

- Regionale Datendichte statt nationaler Leere
- Claim-Mechanik und selbst bestaetigte Profile
- Wirkungskreis- und Einsatzgebietsdaten
- Quellenprotokoll und Datenminimierung
- Sichtbarkeitsdaten und monatlicher Report als Bezahlbeweis
- VOB-/Gewerkelogik und Gewerketaxonomie
- Offline-to-Online-Distribution: QR, Custom-URL, Sticker, Bauzaunbanner
- spaeter Gewerke-Graph aus Betrieben, Planern, Projekten, Kapazitaeten und Lieferanten

## Geschaeftsmodell und Monetarisierung

Die Plattform monetarisiert Vertrauen und belegbare Sichtbarkeit, keine Hoffnungen. Grundsichtbarkeit bleibt kostenlos. Geld wird erst verlangt, wenn der Mehrwert sichtbar und belegbar ist.

| Stufe | Preisannahme | Zielgruppe | Kaufgrund | Startlogik |
| --- | --- | --- | --- | --- |
| Basis | 0 EUR | alle Betriebe | Gefunden werden, Profil pruefen, Daten korrigieren. | dauerhaft kostenlos |
| Verified/Supporter | 99-149 EUR/Jahr | vertrauensorientierte Betriebe | Datenbestaetigung, Supporter-Badge, bessere Pflege. | erster Zahlungsanker |
| Pro-Profil | 29-49 EUR/Monat | Betriebe mit Sichtbarkeitsbedarf | Referenzen, Projektgalerie, Logo, Custom-URL, Sichtbarkeitsreport. | erst nach Views aktiv verkaufen |
| Premium | 79-149 EUR/Monat | Wachstumsbetriebe | Verfuegbarkeit, Recruiting, Netzwerk, Auswertungen. | spaeter |
| Enterprise Planer/GU/Kommune | 199-2.000 EUR/Monat | professionelle Nachfrager | Pro-Suche, Merklisten, Exporte, Datenmodule, API. | nach Datenvolumen |
| Partner/Lieferanten | zu validieren | Baustoffhandel, Hersteller, Fachgrosshandel | Partnerprofile, Reports, Events, Co-Branding. | spaeterer Upside |

### Differenzierung: Website-Baukaesten versus B2B-Plattformoekonomie

Ein Anbieter wie Wix stellt Software bereit, um eine isolierte Website zu bauen. Diese Homepage erzeugt von sich aus keine qualifizierte Reichweite. GewerkeListe.com bringt den Betrieb in eine fachliche, regionale Suchlogik, in der professionelle Planer und Architekten nach Gewerk, Ort, Spezialisierung und Einsatzgebiet filtern.

Die Plattform bietet nicht nur Webspace, sondern Vertrauenskontext und gezielte Distribution. Zudem kostet ein Monat im Pro-Profil weniger als viele einzelne B2C-Leadkosten auf etablierten Portalen.

## Regionale Break-even-Logik

Der Business Case wird skalierbar, weil nicht jeder Betrieb zahlen muss. Eine Region traegt sich selbst, wenn die laufenden Kosten marginalisiert werden und eine kleine Minderheit bezahlt.

### Kostendeckungstabelle nach Umsatzkanaelen

| Jaehrliche regionale Kosten | Supporter à 99 EUR/Jahr noetig | Pro à 29 EUR/Monat noetig | Pro à 49 EUR/Monat noetig | Einordnung bei 2.500 Profilen |
| ---: | ---: | ---: | ---: | --- |
| 8.500 EUR | 86 | 25 | 15 | 3,40 EUR/Jahr je Profil Kostenlast |
| 13.000 EUR | 132 | 38 | 23 | 5,20 EUR/Jahr je Profil Kostenlast |
| 18.000 EUR | 182 | 52 | 31 | 7,20 EUR/Jahr je Profil Kostenlast |
| 30.000 EUR | 304 | 87 | 52 | 12,00 EUR/Jahr je Profil Kostenlast |

Bei 2.500 Profilen im SOM Rosenheim/Chiemgau belaufen sich System- und Betriebskosten pro Profil auf 3,40 EUR bis 12,00 EUR pro Jahr. Das belegt die Skalierbarkeit des technologischen Ansatzes.

| Mischszenario | Jahresumsatz | Bewertung / strategische Einordnung |
| --- | ---: | --- |
| 50 Supporter à 99 EUR + 15 Pro à 29 EUR/Monat | 10.170 EUR | Validierung der Lean-Basis; deckt minimale Kosten von 8.500 EUR ab. Konversionsrate: 2,6 Prozent der Profile. |
| 75 Supporter à 99 EUR + 20 Pro à 29 EUR/Monat | 14.385 EUR | Tragfaehigkeit im Standard-Betrieb; deckt ca. 13.000 EUR Kosten. Konversionsrate: 3,8 Prozent. |
| 50 Supporter à 99 EUR + 20 Pro à 49 EUR/Monat | 16.710 EUR | Proof-of-Value, sobald Sichtbarkeitsreport den Nutzen zeigt. |

## Go-to-Market-Strategie

| Phase | Region/Ziel | Kernaktionen | Go/No-Go |
| --- | --- | --- | --- |
| 0 | Rosenheim als MVP- und Vertrauenspilot | Datenmodell, Suche, Wirkungskreis, Profile, Claim, Views, persoenliche Gespraeche. | 100 gepruefte Profile, 20 echte Kontakte, erste Claims. |
| 1 | Chiemgau/Rosenheim/Traunstein/Kufstein | Regionale Dichte, Planer-Testnutzer, lokale Netzwerke, erste Supporter, SEO. | 500-1.000 Profile, 20 Planer, messbare Suchsessions. |
| 2 | Muenchen-Salzburg-Innsbruck | Clusterlogik, grenznahe Nachfrage, Oesterreich-Rechtscheck, Veranstaltungen. | Wiederholbarer Claim-/Kosten-/Nutzungsprozess. |
| 3 | Regionenweise DE/AT/CH | Bayern, weitere Bundeslaender, Tirol-Cluster, Schweiz nur mit Rechts-/Marktpruefung. | Keine DACH-Skalierung ohne replizierbares Regional-Playbook. |
| 4 | DACH-Skalierung | Regionale Knoten, Messen, Netzwerke, Partnerkanaele, SEO, Team. | Datenqualitaet und CAC stabil. |
| 5 | Partneroekosystem/Bauvorhaben | Lieferantenmodule, Projektmodule, Kapazitaetsreports. | Erst nach kritischer Masse und Vertrauen. |

## Aktivierungskanaele und CAC-Matrix

Die Akquise basiert auf einer methodischen Matrix: Geschwindigkeit, Rechtsrisiko, Vertrauensbildung, Messbarkeit, Skalierbarkeit und Kosten-Effizienz. In der Initialphase werden Offline-Mailing und persoenlicher Leuchtturm-Vertrieb getestet, waehrend Programmatic SEO das langfristige skalierbare Fundament bildet.

### Rechtssichere Aktivierung

Ein zentrales Element ist die neutrale Eintragsbenachrichtigung. Betriebe werden sachlich-neutral zur Pruefung und Bestaetigung bestehender Eintraege eingeladen. Diese Kommunikation erfolgt ohne Verkaufsabsicht oder werblichen Charakter. Die rechtliche Konformitaet nach UWG und DSGVO ist Grundvoraussetzung fuer Massenversand.

| Kanal | Kosten | Tempo | Recht | Vertrauen | Messbarkeit | Empfehlung |
| --- | --- | --- | --- | --- | --- | --- |
| Selbsteintrag | 0-5 EUR | langsam | niedrig | hoch | hoch | P0, sofort aktivieren. |
| Neutrale Eintragsbenachrichtigung | 0,20-2 EUR | schnell | zu pruefen | mittel | hoch | Nur nach UWG/DSGVO-Pruefung, nicht werblich. |
| Postalisches Mailing | 1,50-2,00 EUR/Betrieb | mittel | niedrig-mittel | hoch | hoch | Gut fuer Pilot, ab 500 Sendungen Lettershop pruefen. |
| Baustellenbesuch | 10-50 EUR/Kontakt | langsam | niedrig | sehr hoch | mittel | Sehr gut fuer Leuchtturmprofile. |
| Planer-/Architektenlisten | 0-10 EUR/Profil | mittel | mittel | hoch | mittel | Nur mit sauberem Berechtigungs-/Quellenkonzept. |
| Messe/BAU mit Studenten | 2-17 EUR/Kontakt je Szenario | sehr schnell | mittel | hoch | hoch | Raketenstart-Hebel nur mit Einwilligung und App. |
| Lieferanten-/Grosshandelsnetzwerk | 0-20 EUR/Profil | mittel | mittel | sehr hoch | mittel-hoch | Spaeterer Multiplikator; Neutralitaet sichern. |
| Programmatic SEO | 5-50 EUR/Claim langfristig | langsam | niedrig | mittel | hoch | Wichtig fuer skalierende Nachfrage. |
| QR/Sticker/Bauzaunbanner | 5-80 EUR/aktivem Betrieb | mittel | niedrig | sehr hoch | mittel | Offline-to-Online Brandbeschleuniger. |

Neutrale Eintragsbenachrichtigung: Die erste Nachricht soll sachlich zur Pruefung und Bestaetigung des Eintrags einladen, nicht verkaufen. Ob und in welcher Form dies per E-Mail zulaessig ist, muss vor Massenversand anwaltlich geprueft werden. Zusatzleistungen werden erst auf der Plattform unaufdringlich erklaert.

## Messe-, Baustellen- und Offline-to-Online-Strategie

Messen koennen ein massiver Hebel sein, wenn die Aktivierung freiwillig und mit Einwilligung erfolgt. Studentische Promoter scannen Visitenkarten per App und loesen eine neutrale Profilpruefungs-Einladung aus.

| BAU/Messe-Szenario | Konservativ | Realistisch | Ambitioniert |
| --- | ---: | ---: | ---: |
| Team | 5 Studierende | 10 Studierende | 15 Studierende |
| Produktive Zeit | 5 Tage x 5 h | 5 Tage x 6 h | 5 Tage x 7 h |
| Erfassungen je h je Person | 4 | 8 | 12 |
| Erfasste Kontakte | 500 | 2.400 | 6.300 |
| Kosten Studierende/Logistik | 5.000-8.000 EUR | 8.000-15.000 EUR | 18.000-30.000 EUR |
| Kosten je Kontakt | 10-16 EUR | 3-6 EUR | 3-5 EUR |
| Verifizierungsquote Annahme | 15-25 Prozent | 20-40 Prozent | 25-50 Prozent |
| Verifizierte Profile | 75-125 | 480-960 | 1.575-3.150 |

QR-Codes, Sticker und Bauzaunbanner sind mehr als Marketingmaterial. Sobald Betriebe ihr Profil nutzen, wird ihre reale Offline-Werbung zur Distribution fuer GewerkeListe.com. Ein individuelles Bauzaunbanner bewirbt primaer den Betrieb; GewerkeListe liefert Profil, QR-Code und Messbarkeit.

## Produktstrategie und Roadmap

Die Produktstrategie verfolgt eine datengetriebene Marktpenetration mit dem Ziel, eine zentrale digitale Infrastruktur fuer die DACH-Bauwirtschaft zu etablieren. Statt grossflaechiger, oberflaechlicher Marktabdeckung wird ein Cluster-Modell genutzt, bei dem Regionen einzeln mit hoher Dichte erschlossen werden.

Die operative Umsetzung erfolgt ueber drei Querschnitts-Workstreams:

- Agentic AI & Datenpipeline: oeffentliche Quellen, Enrichment, Review Queue, Freigabe, Auditlog.
- Planer-OS: kontrollierter Import privater Listen und Einbindung professioneller Planer.
- Offline-to-Online: Messe, QR, Sticker, Bauzaunbanner, messbare Profilaufrufe.

| Phase | Zeitraum | Fokus |
| --- | --- | --- |
| 1 | Q3 2026 | Pilot & Datenbasis |
| 2 | Q4 2026 | Produkt-Markt-Fit |
| 3 | Q1-Q2 2027 | Distribution & Wachstum |
| 4 | Q3-Q4 2027 | Monetarisierung |
| 5 | 2028+ | Skalierung DACH |

| Workstream | Zeitraum | Fokus | Output |
| --- | --- | --- | --- |
| Agentic AI / Datenpipeline | Q3 2026-Q4 2027 | oeffentliche Quellen -> Enrichment -> Review Queue -> Freigabe | Skalierbare Datenqualitaet mit Auditlog und Review Gates |
| Planer-OS / Gewerkelisten-Import | Q4 2026-Q2 2027 | Private Listen kontrolliert importieren und Betriebe zur Profilpruefung einladen | Planer-Nutzen plus DSGVO-bewusste Aktualisierung |
| Offline-to-Online | Q1 2027-Q4 2027 | Messe, QR, Sticker, Bauzaunbanner, messbare Profilaufrufe | Verifizierungen, Aktivierung und regionale Sichtbarkeit |

Strategische Leitlinien:

1. Abdeckung zuerst: Ohne regionale Dichte entsteht kein Netzwerkeffekt.
2. Aktivierung vor Monetarisierung: Betriebe muessen Nutzen, Kontrolle und Sichtbarkeit spueren, bevor Zahlung skaliert wird.
3. Region fuer Region skalieren: Lokale Vollstaendigkeit schlaegt duenne DACH-Abdeckung.

## KI-Agenten- und Datenqualitaetsstrategie

Manuelle Profilpruefung skaliert nicht. Das Ziel ist eine agentische Datenfirma: Agenten finden, extrahieren, klassifizieren, pruefen, vergleichen und flaggen. Menschen entscheiden Grenzfaelle, Rechts-/Reputationsrisiken und unsichere Merges.

| Agent | Aufgabe | Autonomie | Kontrolle |
| --- | --- | --- | --- |
| Discovery Agent | Findet Betriebe, Quellen und Grunddaten. | Vorschlaege/Dry Run | Quellenprotokoll, keine ungepruefte Veroeffentlichung. |
| Enrichment Agent | Extrahiert Leistungen, Website, Gewerke, Kontakt. | Confidence Score | Grenzfaelle in Review Queue. |
| Trade Classification Agent | Ordnet Gewerke und Spezialisierungen zu. | Teilautomatisiert | Unsicherheit als Flag. |
| Duplicate/Data Quality Agent | Findet Dubletten, Widersprueche, fehlende Daten. | Flags only | Merges/Loeschungen nur mit Freigabe. |
| Outreach Draft Agent | Formuliert neutrale Benachrichtigungen und Briefe. | Outbox only | Kein automatischer Versand. |
| Compliance Guard | Prueft Wording, Rechtsrisiken, No-Go-Begriffe. | Pflichtpruefung | Audit-Log. |
| Project Discovery Agent | Findet/strukturiert spaeter Bauvorhaben. | Nur freigegebene Quellen | Rollen-/Rechtekonzept Pflicht. |
| Partner Graph Agent | Erkennt spaeter Lieferanten-/Partnerbeziehungen. | Nur aggregiert/mit Freigabe | Keine sensiblen Daten ohne Grundlage. |

| Profilmenge | 15 Min./Profil | 5 Min./Profil | 2 Min./Profil | Bewertung |
| ---: | ---: | ---: | ---: | --- |
| 1.000 | 250 h | 83 h | 33 h | Startphase manuell machbar, aber fokussiert. |
| 5.000 | 1.250 h | 417 h | 167 h | Ohne Agenten/Reviewer Engpass. |
| 10.000 | 2.500 h | 833 h | 333 h | Nur mit Review Queue und externer Hilfe. |
| 20.000 | 5.000 h | 1.667 h | 667 h | Agentenpipeline + Grenzfallpruefung Pflicht. |
| 50.000 | 12.500 h | 4.167 h | 1.667 h | Nicht nebenbei; Funding, Entwickler/Agentenarchitektur und Prozess noetig. |

| Agenten-Modell 20.000 Profile | Beispiel | Menschlicher Aufwand | Hauptkosten |
| --- | --- | ---: | --- |
| Manuell | 5 Min./Profil | 1.667 h | Reviewer/Freelancer |
| Agenten 20 Prozent Grenzfaelle | 4.000 x 5 Min. | 333 h | Agentenbetrieb + QA |
| Agenten 10 Prozent Grenzfaelle | 2.000 x 5 Min. | 167 h | Developer/Agentenarchitekt + Monitoring |
| Agenten 5 Prozent Grenzfaelle | 1.000 x 5 Min. | 83 h | Reifer Prozess, nur nach Validierung |

## Recht, DSGVO, UWG und Datenquellen

Die rechtliche Strategie ist defensiv und muss vor Skalierung anwaltlich geprueft werden. GewerkeListe.com baut keine dubiose Scraping-Datenbank, sondern eine kontrollierte, ueberpruefbare und korrigierbare Datenbasis mit transparenter Quellenlogik, Claim-Prozess, Opt-out und Datenminimierung.

Dieser Abschnitt ist keine Rechtsberatung, sondern eine strategische und rechtlich zu pruefende Umsetzungsleitlinie.

- oeffentliche Unternehmensdaten nur mit Datenminimierung und Quellenprotokoll nutzen
- juristische Personen und personenbezogene Daten von Einzelunternehmern getrennt behandeln
- keine privaten Mobilnummern ohne klare Rechtsgrundlage
- keine aggressive Scraping-Kommunikation
- Erstkontakt nicht werblich formulieren: Eintragspruefung statt Verkauf
- E-Mail-Massenversand nur nach UWG-/DSGVO-Pruefung; Post und Opt-in-Kanaele bevorzugen
- Telefon nur bei konkreter mutmasslicher Einwilligung und nach Pruefung
- "Verifiziert" bedeutet Datenbestaetigung, keine Qualitaets- oder Bonitaetsgarantie
- Bauvorhaben-Module nur mit Rollen-/Rechte- und Vertraulichkeitslogik
- Oesterreich und Schweiz vor DACH-Skalierung gesondert pruefen

## Finanzteil - noch zu ergaenzen

Der vollstaendige Finanzteil wird separat ergaenzt und muss Kostenmodell, Betriebskosten, Szenarien, Unit Economics, Kapitalbedarf und Break-even enthalten.

Der vorliegende erste Teil enthaelt bereits marktstrategische Kosten- und Break-even-Annahmen aus dem gelieferten Text, ersetzt aber keinen finalen Finanzplan.

## Quellen und Leitplanken

| Quelle / Leitplanke | Kernaussage | Konsequenz fuer GewerkeListe.com |
| --- | --- | --- |
| BGH, 18.11.2024, VI ZR 10/24 | Kontrollverlust ueber personenbezogene Daten kann immaterieller Schaden sein; BGH nennt als Groessenordnung fuer blossen Kontrollverlust etwa 100 EUR. | Kein automatisiertes Scraping personenbezogener Daten, Quellenprotokoll, Datenminimierung, First-Party-Claims. |
| BVerwG, 29.01.2025, 6 C 3.23 | Telefonwerbung auf Basis oeffentlich verfuegbarer Telefonnummern ohne zumindest mutmassliche Einwilligung kann unzulaessig sein. | Telefon-Kaltakquise ist kein Hauptkanal; Post, Opt-in, persoenliche Kontakte, Messen und rechtlich gepruefte neutrale Benachrichtigungen. |
| IHK Koeln zu Telefon/E-Mail/Brief | E-Mail-Werbung braucht grundsaetzlich Einwilligung; Briefwerbung ist grundsaetzlich zulaessig, Widerspruch ist zu beachten. | Kein werblicher E-Mail-Massenversand; Post und neutrale Claim-Kommunikation priorisieren. |

## Verbindlichkeitsregel

Dieser Businessplan ist zusammen mit:

- `GEWERKELISTE_PRODUCT_DOCTRINE.md`
- `AGENTS.md`
- `AGENT_OPERATING_RULES.md`

die verbindliche strategische Grundlage fuer Codex und alle spaeteren KI-Agenten.

Bei Widerspruechen gilt:

1. Sicherheits-/Compliance-Regeln
2. Product Doctrine
3. Businessplan
4. Feature-Wuensche
5. technische Bequemlichkeit
