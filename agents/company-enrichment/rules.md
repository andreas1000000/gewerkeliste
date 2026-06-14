# Company Enrichment Rules

- Firmenwebsite ist Primaerquelle.
- Gemeindeverzeichnis ist nur Lead.
- OSM ist nur Hilfsquelle.
- Keine fremden Texte kopieren.
- Keine Logos oder Bilder uebernehmen.
- Keine E-Mails versenden.
- Keine privaten Daten speichern.
- `verified` bleibt `false`.
- `claim_status` bleibt `unclaimed`.
- Unsichere Faelle gehen in Review Queue.
- Aenderungen werden immer geloggt.
- Bestehende Daten nicht blind ueberschreiben.
- Automatische Uebernahme nur ab Confidence `>= 75`.
- Confidence `50-74` in Review.
- Confidence `< 50` ignorieren.
- Wenn ein Betrieb kein Baugewerk, Planer oder baunaher Betrieb ist: nicht loeschen, sondern `public_visible=false` und `review_status='not_relevant_candidate'` setzen.
