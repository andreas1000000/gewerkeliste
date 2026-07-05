import type { Route } from "next";

export type FaqAudience = "auftraggeber" | "betrieb" | "allgemein";
export type FaqShowOn = "faq" | "home" | "preise" | "betrieb-eintragen" | "eintrag-beanspruchen";

export type FaqLink = {
  href: Route;
  label: string;
};

export type FaqEntry = {
  id: string;
  section: string;
  question: string;
  answer: string;
  links?: FaqLink[];
  audience?: FaqAudience;
  showOn?: FaqShowOn[];
};

export const faqIntro =
  "GewerkeListe.com ist ein strukturiertes Verzeichnis für Bau- und Handwerksbetriebe. Auftraggeber finden Betriebe nach Gewerk, Leistung und Region. Betriebe können kostenlos sichtbar werden und ihr Profil bei Bedarf verifizieren und professionell aufbauen lassen.";

export const faqEntries: FaqEntry[] = [
  {
    id: "was-ist-gewerkeliste",
    section: "Allgemein",
    question: "Was ist GewerkeListe.com?",
    answer:
      "GewerkeListe.com ist ein strukturiertes Verzeichnis für Bau- und Handwerksbetriebe. Die Plattform ordnet Betriebe nach Gewerk, konkreter Leistung und Region, damit Bauherren, Architekten, Verwaltungen und institutionelle Auftraggeber schneller passende Fachbetriebe finden und vergleichen können.",
    links: [
      { href: "/betriebe", label: "Betriebe ansehen" },
      { href: "/gewerke", label: "Gewerke ansehen" },
      { href: "/leistungen", label: "Leistungen ansehen" },
      { href: "/orte", label: "Orte und Regionen ansehen" },
    ],
    audience: "allgemein",
    showOn: ["faq", "home"],
  },
  {
    id: "fuer-wen",
    section: "Allgemein",
    question: "Für wen ist GewerkeListe.com gedacht?",
    answer:
      "GewerkeListe.com richtet sich an zwei Gruppen: Auftraggeber, die passende Fachbetriebe suchen, und Betriebe, die fachlich auffindbar sein möchten. Dazu gehören private Bauherren, Architekten, Immobilienverwaltungen, Bauträger, Unternehmen und öffentliche oder institutionelle Auftraggeber.",
    audience: "allgemein",
    showOn: ["faq", "home"],
  },
  {
    id: "welche-betriebe",
    section: "Allgemein",
    question: "Welche Betriebe werden auf GewerkeListe.com gelistet?",
    answer:
      "GewerkeListe.com listet Betriebe aus Bau, Ausbau, Sanierung, Gebäudetechnik, TGA, Garten- und Landschaftsbau sowie angrenzenden Handwerks- und Bauleistungen. Entscheidend ist, dass ein Betrieb einem Gewerk, konkreten Leistungen und einer Einsatzregion zugeordnet werden kann.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "branchenbuch",
    section: "Allgemein",
    question: "Ist GewerkeListe.com ein klassisches Branchenbuch?",
    answer:
      "GewerkeListe.com ist mehr als ein klassisches Branchenbuch. Statt nur Name, Telefonnummer und Ort zu zeigen, strukturiert GewerkeListe Betriebe nach Gewerk, Leistung, Einsatzregion, Ansprechpartnern, Referenzen und Nachweisen. So können Auftraggeber besser einschätzen, wofür ein Betrieb geeignet ist.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "vollstaendig",
    section: "Allgemein",
    question: "Ist GewerkeListe.com bereits vollständig?",
    answer:
      "GewerkeListe.com befindet sich im Aufbau. Die Plattform wird laufend erweitert, Daten werden ergänzt und Profile werden schrittweise verbessert. Betriebe können sich kostenlos eintragen oder ein vorhandenes Profil beanspruchen, damit die veröffentlichten Angaben aktueller und genauer werden.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "betrieb-finden",
    section: "Suche für Auftraggeber",
    question: "Wie finde ich auf GewerkeListe.com einen passenden Betrieb?",
    answer:
      "Sie können Betriebe über Gewerk, konkrete Leistung und Ort finden. Ein Auftraggeber kann zum Beispiel nach Elektroinstallation in einer Region, Garten- und Landschaftsbau in einem Ort oder bestimmten Bauleistungen suchen. Ziel ist, Betriebe nicht nur nach Namen, sondern nach tatsächlicher Leistung auffindbar zu machen.",
    links: [
      { href: "/betriebe", label: "Betriebe suchen" },
      { href: "/gewerke", label: "Gewerke ansehen" },
      { href: "/leistungen", label: "Leistungen ansehen" },
      { href: "/orte", label: "Orte ansehen" },
    ],
    audience: "auftraggeber",
    showOn: ["faq"],
  },
  {
    id: "direkt-kontaktieren",
    section: "Suche für Auftraggeber",
    question: "Kann ich Betriebe direkt kontaktieren?",
    answer:
      "Ja. Wenn ein Betrieb Kontaktdaten veröffentlicht hat, können Auftraggeber direkt Kontakt aufnehmen. GewerkeListe vermittelt keine Aufträge im eigenen Namen und erhebt keine Provision auf beauftragte Leistungen.",
    audience: "auftraggeber",
    showOn: ["faq"],
  },
  {
    id: "vergeben-auftraege",
    section: "Suche für Auftraggeber",
    question: "Vergibt GewerkeListe.com selbst Aufträge?",
    answer:
      "Nein. GewerkeListe.com ist ein Verzeichnis und eine Strukturierungsplattform. Auftraggeber wählen selbst aus, welchen Betrieb sie kontaktieren. Verträge, Angebote und Aufträge entstehen direkt zwischen Auftraggeber und Betrieb.",
    audience: "auftraggeber",
    showOn: ["faq"],
  },
  {
    id: "qualitaetsgarantie",
    section: "Suche für Auftraggeber",
    question: "Garantiert GewerkeListe.com die Qualität eines Betriebs?",
    answer:
      "Nein. GewerkeListe.com garantiert keine handwerkliche Ausführungsqualität und ersetzt keine eigene Prüfung durch den Auftraggeber. Ein verifiziertes Profil bedeutet, dass veröffentlichte Betriebsdaten geprüft oder vom Betrieb bestätigt wurden. Referenzen und Nachweise helfen Auftraggebern bei der Einschätzung, sind aber keine Qualitätsgarantie.",
    audience: "auftraggeber",
    showOn: ["faq"],
  },
  {
    id: "verifiziertes-profil",
    section: "Suche für Auftraggeber",
    question: "Was bedeutet „Verifiziertes Profil“?",
    answer:
      "Ein verifiziertes Profil bedeutet, dass veröffentlichte Betriebsdaten geprüft oder vom Betrieb bestätigt wurden. Dazu können Ansprechpartner, Leistungen, Einsatzregionen, Referenzen, Bilder und Nachweise gehören. Die Verifizierung bezieht sich auf die Darstellung und Nachvollziehbarkeit der Profildaten, nicht auf eine Garantie für spätere Bau- oder Handwerksleistungen.",
    audience: "auftraggeber",
    showOn: ["faq", "home"],
  },
  {
    id: "platzierung-kaufen",
    section: "Suche für Auftraggeber",
    question: "Werden bezahlte Profile besser platziert?",
    answer:
      "Nein. Bei GewerkeListe kann man keine bessere Platzierung kaufen. Das verifizierte Startprofil verbessert die Darstellung eines Betriebs durch Struktur, Ansprechpartner, Referenzen, Bilder und Nachweise. Es ist keine gekaufte Spitzenposition und keine künstliche Bevorzugung.",
    audience: "allgemein",
    showOn: ["faq", "preise"],
  },
  {
    id: "eintrag-kostenlos",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Ist ein Eintrag auf GewerkeListe.com kostenlos?",
    answer:
      "Ja. Das Basisprofil bleibt kostenlos. Reine Sichtbarkeit und fachliche Auffindbarkeit sollen keine Hürde sein. Ein Betrieb kann mit grundlegenden Informationen wie Name, Ort, Gewerk, Leistungen, Einsatzregion, Kontaktmöglichkeit und Website-Link auffindbar werden.",
    links: [{ href: "/betrieb-eintragen", label: "Kostenloses Basisprofil eintragen" }],
    audience: "betrieb",
    showOn: ["faq", "home"],
  },
  {
    id: "basisprofil-inhalt",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Was enthält das kostenlose Basisprofil?",
    answer:
      "Das kostenlose Basisprofil kann Betriebsname, Ort, Region, Gewerk, konkrete Leistungen, Einsatzregionen, Kontaktmöglichkeit, Website-Link, Firmenlogo und einen Ansprechpartner enthalten, sofern diese Angaben vom Betrieb bereitgestellt oder bestätigt werden.",
    audience: "betrieb",
    showOn: ["faq", "betrieb-eintragen"],
  },
  {
    id: "basisprofil-kostenlos",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Warum bleibt das Basisprofil kostenlos?",
    answer:
      "Das Basisprofil bleibt kostenlos, weil ein Betrieb grundsätzlich auffindbar sein sollte, wenn er ein Gewerk anbietet und in einer Region tätig ist. GewerkeListe soll kein Verzeichnis sein, in dem nur sichtbar ist, wer bezahlt.",
    audience: "betrieb",
    showOn: ["faq", "preise"],
  },
  {
    id: "betrieb-eintragen",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Wie kann ich meinen Betrieb kostenlos eintragen?",
    answer:
      "Betriebe können über das Formular „Betrieb eintragen“ ein kostenloses Basisprofil anlegen. Die Angaben werden geprüft, bevor sie öffentlich erscheinen oder bestehende Daten ergänzt werden.",
    links: [{ href: "/betrieb-eintragen", label: "Betrieb eintragen" }],
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "bestehenden-betrieb-beanspruchen",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Was kann ich tun, wenn mein Betrieb bereits auf GewerkeListe.com erscheint?",
    answer:
      "Wenn Ihr Betrieb bereits gelistet ist, können Sie den Eintrag beanspruchen oder ergänzen. Dadurch können Sie Daten bestätigen, korrigieren und zusätzliche Informationen einreichen.",
    links: [{ href: "/eintrag-beanspruchen", label: "Eintrag beanspruchen" }],
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "falsche-daten",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Kann ich falsche Daten korrigieren lassen?",
    answer:
      "Ja. Betriebe können fehlerhafte oder veraltete Angaben korrigieren lassen. Ziel von GewerkeListe ist eine möglichst strukturierte und verlässliche Darstellung von Betrieben, Gewerken, Leistungen und Einsatzregionen.",
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "startprofil",
    section: "Verifiziertes Startprofil",
    question: "Was ist das verifizierte Startprofil?",
    answer:
      "Das verifizierte Startprofil ist ein professionell aufgebautes Profil für Betriebe, die nicht nur auffindbar sein möchten, sondern Auftraggebern mehr Vertrauen und Orientierung geben wollen. Es kann mehrere Ansprechpartner, Referenzen, Referenzbilder, Nachweise, Zertifikate, Teamangaben und eine strukturierte Leistungsdarstellung enthalten.",
    links: [{ href: "/preise", label: "Preise ansehen" }],
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "startprofil-kosten",
    section: "Verifiziertes Startprofil",
    question: "Was kostet das verifizierte Startprofil?",
    answer:
      "Das verifizierte Startprofil kostet 490 Euro netto für 12 Monate. Das entspricht rund 41 Euro netto pro Monat. Es gibt keine Leadgebühren, keine Provision auf Aufträge und keine gekaufte Platzierung.",
    audience: "betrieb",
    showOn: ["faq", "preise"],
  },
  {
    id: "startprofil-inhalt",
    section: "Verifiziertes Startprofil",
    question: "Was ist im verifizierten Startprofil enthalten?",
    answer:
      "Das verifizierte Startprofil enthält alles aus dem kostenlosen Basisprofil sowie eine Verifizierungskennzeichnung, eine professionell strukturierte Leistungsdarstellung, mehrere Ansprechpartner mit Bild, Teamangaben, Referenzen, Referenzbilder, Nachweise und Zertifikate, soweit vom Betrieb bereitgestellt und freigegeben. In der Startphase ist persönliche Unterstützung beim Profilaufbau enthalten.",
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "startprofil-nicht-kaufen",
    section: "Verifiziertes Startprofil",
    question: "Was kaufe ich mit dem verifizierten Startprofil nicht?",
    answer:
      "Sie kaufen keine gekaufte Spitzenposition, keine künstliche Bevorzugung, keine Leadgarantie, keine Auftragsgarantie und keine Provisionierung von Aufträgen. Sie investieren in Struktur, Vertrauen, Verifizierung und professionelle Auffindbarkeit.",
    audience: "betrieb",
    showOn: ["faq", "preise"],
  },
  {
    id: "startprofil-unvollstaendig",
    section: "Verifiziertes Startprofil",
    question: "Muss ich alle Referenzen, Bilder und Nachweise sofort vollständig einreichen?",
    answer:
      "Nein. Betriebe können einreichen, was bereits vorhanden ist. Dazu gehören Ansprechpartner, Referenzen, Bilder, Nachweise, Zertifikate und zusätzliche Hinweise. GewerkeListe prüft die Angaben und unterstützt in der Startphase dabei, daraus ein klares Profil aufzubauen.",
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "bilder-referenzen-hochladen",
    section: "Verifiziertes Startprofil",
    question: "Kann ich Bilder und Referenzen selbst hochladen?",
    answer:
      "Ja. Betriebe können im Rahmen der Anfrage für ein verifiziertes Startprofil zusätzliche Profilinformationen einreichen. Dazu gehören Ansprechpartnerbilder, Teamfotos, Referenzbilder und Nachweise oder Zertifikate als Datei. Diese Inhalte werden nicht automatisch veröffentlicht, sondern zuerst geprüft.",
    audience: "betrieb",
    showOn: ["faq", "preise"],
  },
  {
    id: "automatische-verlaengerung",
    section: "Verifiziertes Startprofil",
    question: "Gibt es eine automatische Verlängerung?",
    answer:
      "Nein. Das verifizierte Startprofil läuft für 12 Monate. Eine automatische Verlängerung erfolgt nicht ohne Ihre Zustimmung.",
    audience: "betrieb",
    showOn: ["preise"],
  },
  {
    id: "bilder-oeffentlich",
    section: "Verifiziertes Startprofil",
    question: "Wann werden eingereichte Bilder und Nachweise öffentlich angezeigt?",
    answer:
      "Eingereichte Bilder, Referenzen und Nachweise werden erst nach Prüfung öffentlich angezeigt. Ungeprüfte Inhalte erscheinen nicht automatisch im öffentlichen Firmenprofil.",
    audience: "betrieb",
    showOn: ["faq", "eintrag-beanspruchen"],
  },
  {
    id: "beispiel-verifiziertes-profil",
    section: "Verifiziertes Startprofil",
    question: "Gibt es ein Beispiel für ein verifiziertes Profil?",
    answer:
      "Ja. Das Profil von Wagner & Spielvogel GmbH zeigt, wie ein verifiziertes Profil mit Ansprechpartnern, Referenzen, Referenzbildern und Nachweisen aussehen kann. Jedes Profil hängt jedoch von den Informationen ab, die ein Betrieb bereitstellt und freigibt.",
    links: [{ href: "/firma/wagner-und-spielvogel-gbr-83083-riedering", label: "Beispiel eines verifizierten Profils ansehen" }],
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "datenpruefung",
    section: "Daten, Prüfung und Sichtbarkeit",
    question: "Wie prüft GewerkeListe Betriebsdaten?",
    answer:
      "GewerkeListe prüft eingereichte Angaben auf Plausibilität, Zuordnung und Darstellbarkeit. Je nach Profil können dazu Betriebsdaten, Kontaktdaten, Leistungen, Einsatzregionen, Ansprechpartner, Referenzen, Bilder und Nachweise gehören. Die Prüfung ersetzt keine rechtliche, technische oder handwerkliche Qualitätsprüfung.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "konkrete-leistungen",
    section: "Daten, Prüfung und Sichtbarkeit",
    question: "Warum sind konkrete Leistungen wichtig?",
    answer:
      "Konkrete Leistungen helfen Auftraggebern, einen Betrieb nicht nur nach Gewerk, sondern nach tatsächlicher Eignung zu finden. Ein Betrieb wird dadurch besser verständlich, zum Beispiel für Hochbau, Umbau, Elektroinstallation, KNX, Photovoltaik, Gartenbau, Verputzarbeiten oder Sanierung.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "einsatzregionen",
    section: "Daten, Prüfung und Sichtbarkeit",
    question: "Was sind Einsatzregionen?",
    answer:
      "Einsatzregionen beschreiben, in welchen Orten oder Regionen ein Betrieb tätig ist. Das kann ein Ort, ein Landkreis, ein Umkreis oder eine konkrete Liste von Regionen sein. Dadurch können Auftraggeber Betriebe finden, die für ihr Projektgebiet grundsätzlich relevant sind.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "mehrere-gewerke",
    section: "Daten, Prüfung und Sichtbarkeit",
    question: "Kann ein Betrieb mehrere Gewerke haben?",
    answer:
      "Ja. Viele Betriebe decken mehrere Gewerke oder Leistungsbereiche ab. GewerkeListe kann einen Betrieb mehreren Gewerken und Leistungen zuordnen, wenn diese fachlich passen und plausibel dargestellt werden können.",
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "datenaktualitaet",
    section: "Daten, Prüfung und Sichtbarkeit",
    question: "Wie aktuell sind die Daten auf GewerkeListe.com?",
    answer:
      "GewerkeListe.com befindet sich im Aufbau. Daten werden laufend ergänzt, geprüft und verbessert. Betriebe können ihre Angaben selbst einreichen, beanspruchen oder korrigieren lassen, damit Profile aktueller und aussagekräftiger werden.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "aufbauphase",
    section: "GewerkeListe im Aufbau",
    question: "Warum steht bei GewerkeListe, dass die Plattform im Aufbau ist?",
    answer:
      "GewerkeListe.com wächst Schritt für Schritt. Das ist bewusst transparent. In der Startphase werden Betriebe, Gewerke, Leistungen, Regionen und Profile laufend ergänzt. Betriebe, die jetzt ein verifiziertes Startprofil anfragen, erhalten persönliche Unterstützung beim Aufbau ihres Profils.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "vorteil-frueh",
    section: "GewerkeListe im Aufbau",
    question: "Was ist der Vorteil, jetzt dabei zu sein?",
    answer:
      "Betriebe können früh ein sauberes Profil aufbauen, Daten korrigieren, Referenzen einreichen und ihre Leistungen strukturiert darstellen. Gleichzeitig unterstützen sie den Aufbau einer fairen Plattform für Bau, Ausbau, TGA, Sanierung, Gebäudetechnik und Handwerk.",
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "regionen",
    section: "GewerkeListe im Aufbau",
    question: "Ist GewerkeListe nur für eine Region gedacht?",
    answer:
      "GewerkeListe ist skalierbar aufgebaut und kann Betriebe nach Ort, Region, Gewerk und Leistung strukturieren. Der Aufbau beginnt regional fokussiert und kann schrittweise auf weitere Regionen und Gewerke erweitert werden.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "verantwortung-profilinhalte",
    section: "Kontakt und Verantwortung",
    question: "Wer ist für die Inhalte eines Firmenprofils verantwortlich?",
    answer:
      "Betriebsdaten, Referenzen, Bilder und Nachweise stammen aus öffentlich verfügbaren Quellen, aus eingereichten Angaben oder aus vom Betrieb bestätigten Informationen. Betriebe können Korrekturen und Ergänzungen einreichen. GewerkeListe strukturiert und veröffentlicht Angaben nach Prüfung.",
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "kontakt",
    section: "Kontakt und Verantwortung",
    question: "Wie kann ich GewerkeListe kontaktieren?",
    answer:
      "Sie können GewerkeListe über die auf der Website angegebenen Kontaktmöglichkeiten erreichen. Betriebe können außerdem direkt über „Betrieb eintragen“ oder „Eintrag beanspruchen“ ihre Angaben übermitteln.",
    links: [
      { href: "/betrieb-eintragen", label: "Betrieb eintragen" },
      { href: "/eintrag-beanspruchen", label: "Eintrag beanspruchen" },
    ],
    audience: "allgemein",
    showOn: ["faq"],
  },
  {
    id: "entfernung",
    section: "Kontakt und Verantwortung",
    question: "Kann mein Betrieb aus GewerkeListe entfernt werden?",
    answer:
      "Wenn ein Betrieb nicht oder nicht mehr dargestellt werden möchte oder Angaben fehlerhaft sind, kann eine Prüfung und Korrektur angefragt werden. GewerkeListe prüft solche Hinweise und passt öffentliche Daten entsprechend der internen Daten- und Qualitätslogik an.",
    audience: "betrieb",
    showOn: ["faq"],
  },
  {
    id: "logo-ansprechpartner",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Kann ich ein Logo und einen Ansprechpartner einreichen?",
    answer:
      "Ja. Logo und ein Ansprechpartnerbild können freiwillig eingereicht werden. Diese Inhalte werden geprüft, bevor sie öffentlich erscheinen. Das kostenlose Basisprofil funktioniert auch ohne Bilder.",
    audience: "betrieb",
    showOn: ["betrieb-eintragen"],
  },
  {
    id: "veroeffentlichung-eintrag",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Wann wird mein Eintrag veröffentlicht?",
    answer:
      "Ein Eintrag wird erst nach Prüfung veröffentlicht oder ergänzt. Automatisch wird durch das Absenden des Formulars nichts im öffentlichen Firmenprofil sichtbar.",
    audience: "betrieb",
    showOn: ["betrieb-eintragen"],
  },
  {
    id: "startprofil-spaeter",
    section: "Verifiziertes Startprofil",
    question: "Kann ich später ein verifiziertes Startprofil anfragen?",
    answer:
      "Ja. Ein Betrieb kann zunächst mit dem kostenlosen Basisprofil starten und später zusätzliche Profilinformationen für ein verifiziertes Startprofil einreichen.",
    audience: "betrieb",
    showOn: ["betrieb-eintragen"],
  },
  {
    id: "beanspruchen-bedeutung",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Was bedeutet Eintrag beanspruchen?",
    answer:
      "Eintrag beanspruchen bedeutet, dass ein Betrieb einen vorhandenen öffentlichen Eintrag zur Prüfung übernimmt. Dadurch können Betriebsdaten bestätigt, korrigiert und ergänzt werden.",
    audience: "betrieb",
    showOn: ["eintrag-beanspruchen"],
  },
  {
    id: "daten-korrigieren",
    section: "Kostenloses Basisprofil für Betriebe",
    question: "Kann ich bestehende Daten korrigieren?",
    answer:
      "Ja. Bestehende Daten können als Korrekturvorschlag eingereicht werden. Die Änderung wird geprüft, bevor sie öffentlich sichtbar wird.",
    audience: "betrieb",
    showOn: ["eintrag-beanspruchen"],
  },
  {
    id: "zusatzinformationen-einreichen",
    section: "Verifiziertes Startprofil",
    question: "Kann ich zusätzliche Profilinformationen einreichen?",
    answer:
      "Ja. Betriebe können zusätzliche Profilinformationen wie Ansprechpartner, Teamangaben, Referenzen, Bilder und Nachweise einreichen. Diese Angaben bleiben reviewfähig und werden nicht ungeprüft veröffentlicht.",
    audience: "betrieb",
    showOn: ["eintrag-beanspruchen"],
  },
];

export function faqSections(entries = fullFaqEntries()) {
  const sections = new Map<string, FaqEntry[]>();
  for (const entry of entries) {
    const items = sections.get(entry.section) || [];
    items.push(entry);
    sections.set(entry.section, items);
  }
  return Array.from(sections.entries()).map(([title, items]) => ({ title, items }));
}

export function fullFaqEntries() {
  return faqEntries.filter((entry) => entry.showOn?.includes("faq"));
}

export function faqEntriesFor(showOn: Exclude<FaqShowOn, "faq">, ids?: string[]) {
  const entries = faqEntries.filter((entry) => entry.showOn?.includes(showOn));
  if (!ids) return entries;
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return ids.map((id) => byId.get(id)).filter((entry): entry is FaqEntry => Boolean(entry));
}

export function plainFaqAnswer(entry: FaqEntry) {
  return entry.answer;
}
