# GewerkeListe.com Revenue Go-live Checkliste

Status: active  
Owner: Andi  
Stand: Juni 2026

Diese Checkliste ist das Freigabe-Dokument, bevor GewerkeListe.com echte Zahlungen, echte Veröffentlichungen oder externe Wirkung auslöst.

## 1. Produkt und Website

- [ ] Homepage final auf Nutzenversprechen geprüft.
- [ ] `/fuer-betriebe` final geprüft.
- [ ] `/preise` final geprüft.
- [ ] Kostenloser Basiseintrag klar sichtbar.
- [ ] Gründungsmitglied-Angebot klar als Zusatznutzen formuliert.
- [ ] Keine Auftragsgarantie.
- [ ] Keine Qualitätsgarantie.
- [ ] Keine Verfügbarkeitsgarantie.
- [ ] Keine künstliche Paywall auf Gewerke, Leistungen oder Spezialisierungen.
- [ ] Kein Leadportal-Wording.

## 2. Recht und Pflichtangaben

- [ ] Impressum geprüft.
- [ ] Datenschutz geprüft.
- [ ] Preisangaben geprüft.
- [ ] Widerruf/Verbraucherrecht geprüft, falls relevante Zielgruppe betroffen ist.
- [ ] AGB/Leistungsbeschreibung geprüft, bevor echte Zahlungen angenommen werden.
- [ ] Rechnungsprozess geklärt.
- [ ] Aussage "Gründungsmitglied" rechtlich und steuerlich geprüft.

## 3. Stripe Testmode

- [ ] `STRIPE_SECRET_KEY` als Test-Key gesetzt.
- [ ] Live-Key wird lokal/technisch blockiert, bis Andi Live-Freigabe gibt.
- [ ] Optional `STRIPE_PRICE_FOUNDING_MEMBER_YEARLY` als Test-Price gesetzt.
- [ ] Checkout für Gründungsmitglied im Testmode geprüft.
- [ ] `/zahlung-erfolgreich` geprüft.
- [ ] `/zahlung-abgebrochen` geprüft.
- [ ] Mindestens 10 Testzahlungen mit Stripe-Testkarten durchgespielt.
- [ ] Testkunden im Stripe-Dashboard nachvollziehbar.

## 4. Stripe Live-Freigabe

- [ ] Live-Keys bewusst gesetzt.
- [ ] Webhook-Endpunkt in Stripe eingerichtet.
- [ ] `STRIPE_WEBHOOK_SECRET` gesetzt.
- [ ] Webhook-Verarbeitung getestet.
- [ ] Live-Schaltung explizit durch Andi freigegeben.
- [ ] Rollback-Pfad dokumentiert.

## 5. Datenbank und Supabase

- [ ] Erforderliche Production-Migrationen reviewt.
- [ ] Keine `supabase link`, `db push` oder `db reset` ohne explizite Freigabe.
- [ ] Zahlungsstatus-Datenmodell final entschieden.
- [ ] Membership-/Profilstatus nicht ohne Review öffentlich wirksam.
- [ ] Service-Role-Key nur serverseitig.

## 6. Admin und Sicherheit

- [ ] `ADMIN_SECRET` in Production gesetzt.
- [ ] Admin-Basic-Auth geprüft.
- [ ] Admin-Bereiche nicht indexierbar.
- [ ] `/admin/agents` geschützt.
- [ ] `/admin/coverage` geschützt.
- [ ] Keine Secrets im Repo.
- [ ] Build grün.
- [ ] Typecheck grün.

## 7. Daten und Veröffentlichung

- [ ] Landkreis Rosenheim Kandidatenpipeline definiert.
- [ ] Quellenlogik dokumentiert.
- [ ] Review Queue funktioniert.
- [ ] Keine Veröffentlichung ohne Review.
- [ ] Keine E-Mail ohne Freigabe.
- [ ] Keine kostenpflichtige externe API ohne Freigabe.
- [ ] Erste 50 Profile manuell geprüft.
- [ ] Erste 10 Claims testweise durchgespielt.

## 8. Smoke Tests

- [ ] `/`
- [ ] `/fuer-betriebe`
- [ ] `/preise`
- [ ] `/betrieb-eintragen`
- [ ] `/eintrag-beanspruchen`
- [ ] `/suche`
- [ ] `/gewerke`
- [ ] `/zahlung-erfolgreich`
- [ ] `/zahlung-abgebrochen`
- [ ] `/admin/agents`
- [ ] `/admin/coverage`

## 9. Go-live Entscheidung

Live-Zahlungen dürfen erst aktiviert werden, wenn:

1. Rechtliche Pflichttexte und Preisangaben geprüft sind.
2. Stripe-Testmode erfolgreich war.
3. Webhook und Zahlungsstatus geklärt sind.
4. Andi die Live-Schaltung ausdrücklich freigibt.

Bis dahin gilt:

- echte Zahlungen: 0
- echte E-Mails: 0
- automatische Veröffentlichungen: 0
- Massenaktionen: 0
