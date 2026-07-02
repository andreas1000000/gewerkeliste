# High-Priority Service Approval Review (2026-07-02)

## Sicherheit
- Keine Live-Datenbank-Schreibzugriffe.
- Keine Migration ausgeführt.
- Keine Medium- oder Low-Kandidaten enthalten.
- AMBIGUOUS-Kandidaten sind ausgeschlossen.
- Apply-Plan ist Dry-Run und setzt `no_live_write: true`.

## Fokus
- Hochbau
- Umbau
- Architektur
- Fenster
- Dachsanierung

## Zusammenfassung
- Geprüfte High-Priority-Kandidaten: 84
- READY_TO_APPROVE: 35
- REVIEW_MANUALLY: 49
- REJECT_RECOMMENDED: 0
- Simulierte neue /leistungen/[slug]: 4
- Simulierte neue /leistungen/[slug]/[ort]: 13
- Firmenprofile mit zusätzlichen Leistungslinks: 32

## Kandidaten nach Leistung

### Hochbau
- Kandidaten: 46
- READY_TO_APPROVE: 3
- REVIEW_MANUALLY: 43
- REJECT_RECOMMENDED: 0

### Umbau
- Kandidaten: 13
- READY_TO_APPROVE: 13
- REVIEW_MANUALLY: 0
- REJECT_RECOMMENDED: 0

### Architektur
- Kandidaten: 12
- READY_TO_APPROVE: 12
- REVIEW_MANUALLY: 0
- REJECT_RECOMMENDED: 0

### Fenster
- Kandidaten: 6
- READY_TO_APPROVE: 0
- REVIEW_MANUALLY: 6
- REJECT_RECOMMENDED: 0

### Dachsanierung
- Kandidaten: 7
- READY_TO_APPROVE: 7
- REVIEW_MANUALLY: 0
- REJECT_RECOMMENDED: 0

## Top 20 Leistung-Ort-Seiten nach READY_TO_APPROVE
- /leistungen/umbau/bad-aibling: 10 Kandidaten (Dachdeckerei Otto Spenglerei; Die Glaser; Holzbau Glas)
- /leistungen/architektur/kolbermoor: 4 Kandidaten (Architektur Krose / Hermann Krose; Blaesig Architekten GmbH; Moser Hoffmann Planungsgesellschaft UG)
- /leistungen/dachsanierung/bad-aibling: 4 Kandidaten (Dachdeckerei Otto Spenglerei; Meyer Bauabdichtung: Bau-Abdichtung Kuppeldach Bad Aibling I Dachabdichtung; Spenglerei Paul)
- /leistungen/architektur/prien-am-chiemsee: 3 Kandidaten (HOOFF Architektur - Büro Prien; Josef Riefer Architektur; Püschel Architektengesellschaft mbH - Geschäftsstelle Prien)
- /leistungen/architektur/rosenheim: 3 Kandidaten (Behringer Architekten; Finsterwalder Garten- und Landschaftsarchitektur; perner architekten & ingenieure)
- /leistungen/dachsanierung/rosenheim: 3 Kandidaten (Baumann KG – Rosenheim; bauwerk singer: Holzarchitektur & moderne; Dachdeckerei Paul Horner)
- /leistungen/umbau/rosenheim: 2 Kandidaten (Baumann KG – Rosenheim; bauwerk singer: Holzarchitektur & moderne)
- /leistungen/architektur/reischenhart: 1 Kandidaten (Planungsbüro Georg Gschwendtner)
- /leistungen/architektur/riedering: 1 Kandidaten (STANKO & Partner Architekten)
- /leistungen/hochbau/bad-endorf: 1 Kandidaten (Inntaler Naturbau GmbH)
- /leistungen/hochbau/oberaudorf: 1 Kandidaten (Hoch- und Tiefbau Hans Obermair GmbH)
- /leistungen/hochbau/stephanskirchen-ziegelberg: 1 Kandidaten (Baugeschäft Maurer GmbH)
- /leistungen/umbau/prien-am-chiemsee: 1 Kandidaten (Rudolf Hasholzner)

## READY_TO_APPROVE Kandidaten

### Inntaler Naturbau GmbH - Hochbau (Bad Endorf)
- company_id: 53190cdc-7f70-416a-8175-725b7b09f17c
- Gewerk: Bauunternehmen
- Evidence: Hochbau / Naturbau
- Quelle: company_trades.evidence
- Grund: Service-Name direkt in company_trades.evidence gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Hoch- und Tiefbau Hans Obermair GmbH - Hochbau (Oberaudorf)
- company_id: c43e6604-2c1f-400e-8b01-94715aa3beec
- Gewerk: Bauunternehmen
- Evidence: Hochbau / Tiefbau
- Quelle: company_trades.evidence
- Grund: Service-Name direkt in company_trades.evidence gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Baugeschäft Maurer GmbH - Hochbau (Stephanskirchen-Ziegelberg)
- company_id: 87971dd0-5714-4e49-9eb1-b8a2c1686700
- Gewerk: Bauunternehmen
- Evidence: Baugeschäft / Hochbau
- Quelle: company_trades.evidence
- Grund: Service-Name direkt in company_trades.evidence gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Dachdeckerei Otto Spenglerei - Umbau (Bad Aibling)
- company_id: df7b09bf-b7f5-4800-9a3f-807facd70cda
- Gewerk: Bauunternehmen
- Evidence: ten in Bad Aibling. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Sanierung, Dachsanierung beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist no
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Die Glaser - Umbau (Bad Aibling)
- company_id: 512d8e26-cb98-4fe2-aa20-d6ace55c560a
- Gewerk: Bauunternehmen
- Evidence: ten in Bad Aibling. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Schreinerarbeiten beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist noch nich
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Holzbau Glas - Umbau (Bad Aibling)
- company_id: d9adda02-2dce-4ef1-8e4e-75ee64f513d2
- Gewerk: Bauunternehmen
- Evidence: ten in Bad Aibling. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Sanierung, Zimmererarbeiten beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Klepp Absauganlagen GmbH - Umbau (Bad Aibling)
- company_id: 0034536f-2b0f-4c69-beae-52857a03422c
- Gewerk: Bauunternehmen
- Evidence: Aibling. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Metallbau, Umbau, Netzwerktechnik beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist noch nicht
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### M. Schwendemann Bauunternehmung GmbH - Umbau (Bad Aibling)
- company_id: 1ae2fe75-3947-4b8d-b4c4-4a35f7c7b640
- Gewerk: Bauunternehmen
- Evidence: tion in Bad Aibling. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Sanierung, Schreinerarbeiten beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag i
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Metallbau - Bad Aibling - Umbau (Bad Aibling)
- company_id: 5e1a07be-6348-43c0-8882-da5fe79ffd7e
- Gewerk: Bauunternehmen
- Evidence: ad Aibling. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Metallbau, Umbau, Netzwerktechnik beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist noch nic
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Pakt Türen - Umbau (Bad Aibling)
- company_id: 77d8dd1c-ed7a-4f35-b41c-cb10eb959b1f
- Gewerk: Bauunternehmen
- Evidence: en in Bad Aibling. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Schreinerarbeiten, Netzwerktechnik beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintr
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Schwaiger Bau - Umbau (Bad Aibling)
- company_id: 1ef9b97c-eb42-4b13-844b-d46e913417d7
- Gewerk: Bauunternehmen
- Evidence: irmenwebsite werden u. a. Leistungen in den Bereichen Maurerarbeiten, Betonarbeiten, Umbau beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist noch nicht vom Betrieb bes
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Umbauhilfe Meyer - Umbau (Bad Aibling)
- company_id: a6b4ecd8-5512-4592-b0c5-91d1b57de767
- Gewerk: Bauunternehmen
- Evidence: Umbauhilfe Meyer ist ein Betrieb im Bereich Erdarbeiten in Bad Aibling. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, San
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### werk.4 - Schreinerei Mathias Vierlinger - Umbau (Bad Aibling)
- company_id: 41c39afa-157e-44d7-a08a-106eb9532b8a
- Gewerk: Bauunternehmen
- Evidence: eiten in Bad Aibling. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Pflasterarbeiten, Schreinerarbeiten beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der E
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Rudolf Hasholzner - Umbau (Prien am Chiemsee)
- company_id: 8e1b647c-1960-4189-b767-7f745b024335
- Gewerk: Bauunternehmen
- Evidence: Prien am Chiemsee. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Heizung beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist noch nicht vom Betr
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Baumann KG – Rosenheim - Umbau (Rosenheim)
- company_id: 24345cdf-129b-4b05-95be-c162ecd1f2ff
- Gewerk: Bauunternehmen
- Evidence: rbeiten in Rosenheim. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Sanierung, Pflasterarbeiten beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag i
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### bauwerk singer: Holzarchitektur & moderne - Umbau (Rosenheim)
- company_id: 38ae9783-c4b2-4292-8a05-c0d70103da10
- Gewerk: Bauunternehmen
- Evidence: arbeiten in Rosenheim. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Sanierung, Pflasterarbeiten beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk bauunternehmen zuordenbar.

### Architektur Krose / Hermann Krose - Architektur (Kolbermoor)
- company_id: facd2c47-226b-41e5-81c0-39ae99bdab6d
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Kolbermoor. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifiziert.
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### Blaesig Architekten GmbH - Architektur (Kolbermoor)
- company_id: f81fa3b5-a4e4-4bf9-b2a7-2341e4a782b4
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Kolbermoor. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifiziert.
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### Moser Hoffmann Planungsgesellschaft UG - Architektur (Kolbermoor)
- company_id: 229ff305-968b-458a-a151-099cbc5e64ad
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Kolbermoor. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifiziert.
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### WE&P GmbH - Architektur (Kolbermoor)
- company_id: ff479029-0e27-4411-b543-45e14613ec91
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Kolbermoor. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifiziert.
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### HOOFF Architektur - Büro Prien - Architektur (Prien am Chiemsee)
- company_id: 1c9b813a-033c-428c-b1c7-e3e9275f54f4
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Prien am Chiemsee. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifi
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### Josef Riefer Architektur - Architektur (Prien am Chiemsee)
- company_id: de52876d-1ac3-445e-9bed-48f65eacc947
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Prien am Chiemsee. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifi
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### Püschel Architektengesellschaft mbH - Geschäftsstelle Prien - Architektur (Prien am Chiemsee)
- company_id: 7249d8b9-d8f9-4efa-80c2-df51c92d36df
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Prien am Chiemsee. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifi
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### Planungsbüro Georg Gschwendtner - Architektur (Reischenhart)
- company_id: d78edfe2-20b0-4847-8898-85e0ff7934d1
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Reischenhart. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifiziert
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### STANKO & Partner Architekten - Architektur (Riedering)
- company_id: f2c4a9e8-8a88-4d62-b329-ff3d406dfc41
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Riedering. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifiziert. K
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### Behringer Architekten - Architektur (Rosenheim)
- company_id: adfd545b-147c-42a1-bfa3-ba1603a50c67
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Rosenheim. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifiziert. K
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### Finsterwalder Garten- und Landschaftsarchitektur - Architektur (Rosenheim)
- company_id: b9fbcc89-5e6e-4fcf-b5c5-023bc3c830f5
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Rosenheim. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifiziert. K
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### perner architekten & ingenieure - Architektur (Rosenheim)
- company_id: 767dff83-7074-4b84-a63c-43ef47e9bd70
- Gewerk: Architektur & Entwurf
- Evidence: Architekt in Rosenheim. Kostenloses Basisprofil aus kuratiertem regionalem Startdatenbestand. Dieses Profil ist noch nicht vom Betrieb verifiziert. K
- Quelle: companies.description
- Grund: Alias direkt in companies.description gefunden und fachlich dem Gewerk architekt zuordenbar.

### Dachdeckerei Otto Spenglerei - Dachsanierung (Bad Aibling)
- company_id: df7b09bf-b7f5-4800-9a3f-807facd70cda
- Gewerk: Dachdeckerarbeiten
- Evidence: ng. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Umbau, Sanierung, Dachsanierung beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist noch nicht vom Betrieb bes
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk dachdeckerarbeiten zuordenbar.

### Meyer Bauabdichtung: Bau-Abdichtung Kuppeldach Bad Aibling I Dachabdichtung - Dachsanierung (Bad Aibling)
- company_id: ee3150b7-fbb1-49b1-bcfe-c4579cf58296
- Gewerk: Dachdeckerarbeiten
- Evidence: Firmenwebsite werden u. a. Leistungen in den Bereichen Sanierung, Pflasterarbeiten, Dachsanierung beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist noch nicht vom Betrieb bes
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk dachdeckerarbeiten zuordenbar.

### Spenglerei Paul - Dachsanierung (Bad Aibling)
- company_id: 4e8cb327-5d76-4901-bcbf-80dde715997a
- Gewerk: Dachdeckerarbeiten
- Evidence: g. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Pflasterarbeiten, Dachsanierung, Spenglerarbeiten beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintrag ist noch nich
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk dachdeckerarbeiten zuordenbar.

### Zimmerei Heiß + Heiß - Dachsanierung (Bad Aibling)
- company_id: e55c8298-d4ac-453e-bb58-a91cca3ea090
- Gewerk: Dachdeckerarbeiten
- Evidence: Umbau, Sanierung, Pflasterarbeiten, Dachsanierung, Zimmererarbeiten, Schreinerarbeiten, Netzwerktechnik
- Quelle: company_trades.evidence
- Grund: Service-Name direkt in company_trades.evidence gefunden und fachlich dem Gewerk dachdeckerarbeiten zuordenbar.

### Baumann KG – Rosenheim - Dachsanierung (Rosenheim)
- company_id: 24345cdf-129b-4b05-95be-c162ecd1f2ff
- Gewerk: Dachdeckerarbeiten
- Evidence: Umbau, Sanierung, Pflasterarbeiten, Dachsanierung, Zimmererarbeiten, Netzwerktechnik
- Quelle: company_trades.evidence
- Grund: Service-Name direkt in company_trades.evidence gefunden und fachlich dem Gewerk dachdeckerarbeiten zuordenbar.

### bauwerk singer: Holzarchitektur & moderne - Dachsanierung (Rosenheim)
- company_id: 38ae9783-c4b2-4292-8a05-c0d70103da10
- Gewerk: Dachdeckerarbeiten
- Evidence: Umbau, Sanierung, Pflasterarbeiten, Dachsanierung, Zimmererarbeiten, Netzwerktechnik
- Quelle: company_trades.evidence
- Grund: Service-Name direkt in company_trades.evidence gefunden und fachlich dem Gewerk dachdeckerarbeiten zuordenbar.

### Dachdeckerei Paul Horner - Dachsanierung (Rosenheim)
- company_id: a5f18393-e748-4f4a-ae73-3816d35b6c2a
- Gewerk: Dachdeckerarbeiten
- Evidence: eiten in Rosenheim. Auf der Firmenwebsite werden u. a. Leistungen in den Bereichen Dachsanierung, Spenglerarbeiten, Netzwerktechnik beschrieben. Der Eintrag wurde aus öffentlich zugänglichen Unternehmensquellen vorbereitet. Der Eintr
- Quelle: companies.description
- Grund: Service-Name direkt in companies.description gefunden und fachlich dem Gewerk dachdeckerarbeiten zuordenbar.

## REVIEW_MANUALLY / REJECT_RECOMMENDED

### REVIEW_MANUALLY: Baugeschäft Andreas Dörfl GmbH & Co. KG - Hochbau (Aschau im Chiemgau)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Sebastian Koch Baugeschäft GmbH - Hochbau (Aschau im Chiemgau)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Grosch Bauunternehmen GmbH & Co. KG - Hochbau (Bad Aibling)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Hausbau Jegg GmbH - Hochbau (Bad Aibling)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Pumpfer Bauunternehmung GmbH - Hochbau (Bad Aibling)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Schwaiger Bau GmbH - Hochbau (Bad Aibling)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Holzmaier Bau GmbH & Co. KG - Hochbau (Bad Endorf)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Eisner GmbH - Hochbau (Beyharting)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Helwig Bau GmbH - Hochbau (Bruckmühl)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Millauer GmbH - Hochbau (Bruckmühl)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Feldschmidt & Maier Bauunternehmung GmbH - Hochbau (Bruckmühl-Högling)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Meindl GmbH Bauunternehmen - Hochbau (Flintsbach)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Matthias Staber Baugeschäft - Hochbau (Frasdorf)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Riedel Bau GmbH - Hochbau (Frasdorf)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Helmut Anderl Baugeschäft GmbH - Hochbau (Großkarolinenfeld)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Schilp Bauunternehmung GmbH - Hochbau (Großkarolinenfeld)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: TF Baugeschäft GmbH - Hochbau (Großkarolinenfeld)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Iffländer GmbH Bauunternehmen - Hochbau (Höslwang)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Alto Mair Bau GmbH - Hochbau (Kolbermoor)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: K. Baumann Baugesellschaft mbH - Hochbau (Kolbermoor)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Sebastian Daxeder Bauunternehmung GmbH - Hochbau (Kolbermoor)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Trost Bau - Hochbau (Kolbermoor)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Maurer & Sohn GmbH - Hochbau (Pfaffing)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Hans Neureiter Bauunternehmen GmbH - Hochbau (Pittenhart)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Scheck GmbH & Co. KG - Hochbau (Prien am Chiemsee)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Franz Mayrl Baugeschäft - Hochbau (Raubling)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Franz Schoner GmbH - Hochbau (Riedering)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Frommwieser Baugeschäft GmbH - Hochbau (Rimsting)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Schweinsteiger Bau GmbH & Co. KG - Hochbau (Rohrdorf)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Simon Gartner Bauunternehmen - Hochbau (Rohrdorf)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Bauunternehmen Georg Tremmel GmbH & Co. KG - Hochbau (Rosenheim)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Moser Bau GmbH - Hochbau (Rosenheim)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Peter Holzner GmbH & Co. KG - Hochbau (Rosenheim)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Pfeiffer Baugesellschaft mbH - Hochbau (Rosenheim)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Sennes GmbH - Hochbau (Rosenheim)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Stefan Daberger Bauunternehmung GmbH - Hochbau (Rott am Inn)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Baugeschäft Spöck - Hochbau (Samerberg)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Thalhauser Bau GmbH - Hochbau (Schechen)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Gramer Bau GmbH - Hochbau (Söchtenau)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Murner Bau GmbH - Hochbau (Söchtenau)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Elisabeth Weber Baugeschäft - Hochbau (Stephanskirchen)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Sundmacher Bau GmbH - Hochbau (Tuntenhausen)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: BauManufaktur Loy GmbH - Hochbau (Vogtareuth)
- Hinweis: Evidence ist sehr kurz; vor Freigabe manuell prüfen.
- Evidence: Hochbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Huber & Sohn GmbH & Co. KG - Fenster (Eiselfing)
- Hinweis: Fenster ist plausibel, aber der Betrieb hat viele Treffer; erst manuell prüfen.
- Evidence: Fenster
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Schreinerei Dandl KG - Fenster (Fridolfing)
- Hinweis: Fenster ist plausibel, aber der Betrieb hat viele Treffer; erst manuell prüfen.
- Evidence: Fenster
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Niedermaier GmbH - Fenster (Raubling)
- Hinweis: Fenster ist plausibel, aber der Betrieb hat viele Treffer; erst manuell prüfen.
- Evidence: Fenster
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Martin Angerer GmbH - Fenster (Riedering-Söllhuben)
- Hinweis: Fenster ist plausibel, aber der Betrieb hat viele Treffer; erst manuell prüfen.
- Evidence: Fenster
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: FeBaTec Fenster- und Bauelementetechnik GmbH - Fenster (Rosenheim)
- Hinweis: Fenster ist plausibel, aber der Betrieb hat viele Treffer; erst manuell prüfen.
- Evidence: Fenster / Metallbau
- Quelle: company_trades.evidence

### REVIEW_MANUALLY: Schreinerei Andreas Huber - Fenster (Stephanskirchen)
- Hinweis: Fenster ist plausibel, aber der Betrieb hat viele Treffer; erst manuell prüfen.
- Evidence: Fenster
- Quelle: company_trades.evidence
