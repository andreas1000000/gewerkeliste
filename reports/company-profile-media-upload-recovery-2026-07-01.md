# Company Profile Media Upload Recovery

Datum: 2026-07-01
Branch: `codex/go-live-preview-2026-06-28`

## Kurzbefund

Die Logo-/Ansprechpartnerbild-Funktion wurde frueher im Repo gefunden. Sie war teilweise committed und wurde spaeter bewusst aus dem aktiven Betrieb-eintragen-Flow entfernt.

Die relevante Implementierung stammt aus der Git-History, nicht aus dem Backup-Ordner `/private/tmp/gewerkeliste-untracked-backup-2026-06-28-2020`.

## Gefundene Teile

- `components/business-entry-form.tsx`
  - Commit `03fc897` fuegte Upload-Felder fuer Firmenlogo und Ansprechpartnerbild hinzu.
  - Commit `3194906` haertete die Erkennung ausgewaehlter Dateien.
  - Commit `e671106` entfernte diese Upload-Felder wieder.

- `lib/actions/business-entry.ts`
  - Commit `1d9f727` fuegte Server-seitigen Upload in den privaten Supabase-Storage-Bucket `company-media` hinzu.
  - Gespeichert wurde unter `submissions/{safe-company-name}/logo-...` bzw. `submissions/{safe-company-name}/contact-...`.
  - Commit `3194906` haertete die File-Erkennung.
  - Commit `e671106` entfernte die Upload-Verarbeitung wieder aus dem aktiven Eintragsflow.

- `app/admin/submissions/[id]/page.tsx`
  - Admin-/Review-Ansicht fuer hochgeladene Medien ist weiterhin vorhanden.
  - Dateien werden per signed URL aus `company-media` angezeigt.
  - Ansprechpartnerbilder werden ausdruecklich als personenbezogen und pruefpflichtig markiert.

- `lib/actions/submissions.ts`
  - Admin-Freigabe kopiert `logo_url`, `profile_image_url`, `profile_image_alt`, `contact_person_name` und `contact_person_role` aus einer Submission ins Firmenprofil.
  - Es erfolgt nicht automatisch beim Upload, sondern erst im Approval-Flow.

- `supabase/migrations/20260615001000_profile_trust_fields.sql`
  - Fuegt Medienfelder auf `companies` und `company_submissions` hinzu.
  - Legt den privaten Storage-Bucket `company-media` an.
  - Erlaubt Storage-Zugriff nur fuer `service_role`.

- `lib/data/public-directory.ts`
  - Loest gespeicherte Medienpfade fuer oeffentliche Profile ueber signed URLs auf.

- `app/firma/[slug]/page.tsx`
  - Oeffentliche Profile zeigen Logo bzw. Ansprechpartnerbild, wenn diese nach Freigabe auf dem Company-Datensatz stehen.
  - Ohne Logo werden Initialen bzw. Platzhalter angezeigt.

## Backup-Ordner

Im Backup-Ordner wurden keine relevanten Firmenlogo- oder Ansprechpartnerbild-Uploads gefunden.

Gefunden wurden nur:

- Planner-CSV-Upload in `components/planner-csv-import.tsx`
- Planner-/Claim-Hinweistext in `app/claim/[token]/page.tsx`
- Planner-/Mail-/Coverage-Dateien und Planner-Migrationen

Diese Dateien sind fuer die sichere Wiederherstellung des Firmenprofil-Medienflows nicht geeignet und wurden nicht uebernommen.

## Aktueller Zustand

Aktuell existieren noch:

- DB-/Storage-Migration fuer Medienfelder und Bucket
- Public-Profile-Anzeige fuer bereits freigegebene Medien
- Admin-Review-Anzeige fuer Submission-Medien
- Approval-Logik, die Medien nach Review ins Firmenprofil uebernimmt
- Datenschutz-/Review-Texte

Aktuell fehlen:

- Upload-Felder im aktiven Betrieb-eintragen-Formular
- Upload-Felder im aktiven Claim-/Profil-ergaenzen-Flow
- aktuelle Server-Action fuer neuen Medienupload
- expliziter sicherer Owner-Upload-Workflow
- klare Produktentscheidung, ob Logo schon im freien Eintragsformular hochladbar sein soll oder erst nach Claim/Profilvervollstaendigung

## Sicherheitsbewertung

Die alte Funktion war kein reiner UI-Entwurf, sondern funktional. Sie war aber nicht reif genug fuer eine blinde Reaktivierung:

- SVG war fuer Logos erlaubt; das sollte vor Live-Aktivierung bewusst bewertet oder eingeschraenkt werden.
- Upload lief serverseitig mit Service Role in Storage; das ist technisch moeglich, braucht aber harte Validierung.
- Es gab keine dedizierte Owner-Auth/RLS-Uploadstrecke.
- Ansprechpartnerbilder sind personenbezogene Daten und duerfen nicht ohne Berechtigung/Zustimmung oeffentlich werden.
- Der spaetere Commit `e671106` dokumentiert durch Code-Aenderung die Produktentscheidung, Medien auf einen Post-Claim-/Upsell- bzw. spaeteren Pflegefluss zu verschieben.

## Empfehlung fuer sicheren MVP

Nicht einfach den alten Code zurueckkopieren.

Sinnvoller naechster Schritt:

1. Upload nur fuer Einreichungen oder Claim-Ergaenzungen erlauben.
2. Keine automatische Veroeffentlichung.
3. Medien nur in `company_submissions` speichern.
4. Admin-Review bleibt Pflicht.
5. Profil zeigt Medien erst nach expliziter Freigabe.
6. Logo optional und in der Startphase kostenlos.
7. Ansprechpartnerbild optional und nur mit ausdruecklicher Zustimmung.
8. SVG fuer Uploads vorerst nicht erlauben oder separat sanitizen.
9. Bestehenden privaten Bucket `company-media` weiterverwenden, falls Migration/Bucket vorhanden sind.

## Nicht wiederhergestellt

Es wurde keine Uploadfunktion aktiviert, keine Migration ausgefuehrt, kein Supabase-Remote-Zugriff genutzt, kein Production-Deploy gemacht und kein Push ausgefuehrt.
