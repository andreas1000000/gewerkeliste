# Approval Policy

Riskante Aktionen werden nicht direkt ausgefuehrt. Sie werden als Approval, Review Item oder Outbox-Draft abgelegt.

## Freigabe erforderlich

- E-Mail senden
- Firmendaten ueberschreiben
- Firmen oeffentlich veroeffentlichen
- `verified=true` setzen
- Claim-Status aendern
- mehrere Datensaetze auf einmal aendern
- Daten loeschen
- kostenpflichtige API starten
- SEO-Seite veroeffentlichen
- Slugs ohne Redirect aendern

## Statuswerte

Approvals:

- `pending`
- `approved`
- `rejected`
- `expired`
- `executed`

Review Items:

- `open`
- `in_review`
- `resolved`
- `rejected`

Outbox:

- `draft`
- `queued`
- `sent`
- `cancelled`
- `failed`

## Freigabeinstanz

Andreas Moser ist im MVP die finale Freigabeinstanz. Spaeter kann das ueber Rollen und echte Auth/RLS abgebildet werden.
