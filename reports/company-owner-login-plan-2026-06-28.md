# Company Owner Login Plan

Stand: 2026-06-28

## Einordnung

Ein LinkedIn-aehnlicher Betrieb-Login ist strategisch sinnvoll, aber aktuell nicht als kleiner sicherer Fix umzusetzen. Im Projekt existieren Claim-Tabellen und Admin-Pruefprozesse, aber noch kein vollstaendiges Owner-Auth-Modell mit sicherer Company-Zuordnung, Rollen, RLS-Policies, Upload-Rechten und Review-Workflow fuer Aenderungen.

Deshalb gilt vorerst:

- Neue Betriebe koennen niedrigschwellig einen Eintrag einreichen.
- Andi oder spaeter ein gepruefter Agent gibt den Basiseintrag frei.
- Das oeffentliche Profil motiviert zur Uebernahme und Vervollstaendigung.
- Logo, Ansprechpartnerbild und erweiterte Darstellung werden noch nicht direkt hochgeladen.
- CTAs fuehren in den bestehenden Claim-/Uebernahme-Flow.

## Benoetigte Tabellen

Empfohlene neue bzw. zu pruefende Tabellen:

- `company_owners`
  - `id`
  - `company_id`
  - `user_id`
  - `role` (`owner`, `admin`, `editor`)
  - `status` (`pending`, `active`, `revoked`)
  - `verified_by`
  - `verified_at`
  - `created_at`
  - `updated_at`
- `company_profile_change_requests`
  - Entwurfsaenderungen an Stammdaten, Leistungen, Wirkungskreis und Medien.
- `company_media_assets`
  - Logo, Ansprechpartnerbild, Teamfoto, Projektbilder.
  - Status: `draft`, `in_review`, `approved`, `rejected`, `archived`.
- `company_owner_audit_log`
  - Jede relevante Owner-Aktion nachvollziehbar speichern.

## Supabase Auth Strategie

- Supabase Auth fuer E-Mail/Passwort oder Magic Link nutzen.
- Kein selbstgebautes Passwortsystem.
- E-Mail-Verifizierung aktivieren.
- Passwort-Reset ueber Supabase Auth.
- Login-Routen serverseitig pruefen.
- Keine Service-Role-Keys im Client.

## Rollenmodell

Minimaler MVP:

- `owner`: darf Profil-Aenderungen einreichen und Nutzer verwalten.
- `admin`: darf Profil-Aenderungen einreichen.
- `editor`: darf Inhalte vorbereiten, aber keine Rollen verwalten.

Alle Aenderungen bleiben im Review, bis eine Freigabe erfolgt.

## Sichere Company-Zuordnung

Ein User darf nur auf eine Firma zugreifen, wenn:

1. ein Claim/Ownership-Antrag vorliegt,
2. Andi/Admin die Berechtigung geprueft hat,
3. ein aktiver `company_owners` Datensatz existiert,
4. RLS-Policies diese Zuordnung erzwingen.

## Storage Buckets fuer Logo und Bilder

Empfohlen:

- Bucket `company-media`
- Pfade nach Company-ID trennen, z. B. `companies/{company_id}/logo/...`
- Upload nur fuer aktive Owner/Admin/Editor dieser Company.
- Keine oeffentliche Original-Datei ohne Freigabe.
- Freigegebene Medien koennen per signed URL oder kontrollierter Public-Variante angezeigt werden.

## Upload-Validierung

Erforderlich vor Live-Upload:

- Dateitypen: PNG, JPG, WebP, SVG nur fuer Logo.
- Ansprechpartnerbild: kein SVG.
- Groessenlimit, z. B. 5 MB.
- Bilddimensionen pruefen.
- Missbrauchs-/Content-Pruefung einplanen.
- Nutzungsrechte und Einwilligung explizit bestaetigen.
- Loesch- und Austauschprozess dokumentieren.

## RLS / Policies

Notwendige Policies:

- Owner duerfen nur eigene `company_owners` lesen.
- Owner duerfen nur Change Requests fuer eigene Company erstellen.
- Direkte Updates auf `companies` durch Owner bleiben gesperrt.
- Medien duerfen nur fuer eigene Company hochgeladen werden.
- Freigabe und Publikation bleiben Admin-/Agent-Approval-Prozess.

## Review-Workflow

Owner-Aenderungen laufen ueber:

1. Entwurf im Owner-Bereich.
2. Speichern als `company_profile_change_requests`.
3. Review Item im Admin-/Agent-OS.
4. Freigabe durch Andi/Admin oder spaeter genehmigten Agenten.
5. Audit-Log und Change-Log.
6. Erst danach oeffentliche Anzeige.

## Sicherheitsrisiken

- Multi-Tenant-Fehler: Betrieb A darf nie Daten von Betrieb B sehen oder aendern.
- Medien-Upload kann Missbrauch erzeugen.
- Ansprechpartnerbilder sind personenbezogene Daten.
- Falsche Claims koennen zu unberechtigter Profilkontrolle fuehren.
- Direkte Live-Aenderungen koennen falsche Daten veroeffentlichen.
- Premium-Funktionen duerfen keine falschen Qualitaets- oder Rankingversprechen enthalten.

## MVP-Schritte

1. Auth-Architektur und RLS-Policies lokal entwerfen.
2. `company_owners` und `company_profile_change_requests` Migration erstellen.
3. Lokale Supabase-RLS-Tests.
4. Minimaler Owner-Dashboard-Prototyp:
   - Login erforderlich.
   - Eigene Firma anzeigen.
   - Hinweis: Aenderungen gehen in Pruefung.
   - Keine direkten Live-Updates.
5. Admin-Review fuer Owner-Aenderungen.
6. Medien-Upload erst nach Storage-/RLS-/Review-Freigabe.

## Premium / spaeter optional

Kostenlos bleiben:

- Basisprofil.
- Profiluebernahme.
- Stammdaten korrigieren.
- Gewerke und Leistungen vollstaendig angeben.
- offizielle Website und Kontaktwege anzeigen.

Optional spaeter:

- prominente Logo-/Teamdarstellung.
- Referenzen und Projektgalerie.
- QR-Code/Kurzlink.
- Sichtbarkeitsreport.
- erweiterte Profilgestaltung.
- Wirkungskreis visuell markieren.

Keine Monetarisierung ueber:

- kuenstliche Einschraenkung des tatsaechlichen Leistungsspektrums.
- Paywall fuer grundlegende Firmendaten.
- bessere Sortierung ohne klare, faire Produktlogik.
- Qualitaetsgarantien.

