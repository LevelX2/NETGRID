# AI Boon: Run-Grundstärke – Final Review

Datum: 2026-07-12
Status: grün

## Ergebnis

- Die falsche statische Stärke 2 und der Additions-Regeltext wurden entfernt.
- Der W6-Wurf setzt AI Boons Grundstärke für den Run direkt auf 1 bis 6.
- LegalActions, PlayerView sowie Einzel- und Multi-Break-Validierung lesen
  denselben gespeicherten Runwert.
- Ein Wurf von 2 gegen Credit Blocks Stärke 3 erfordert genau einen Pump; ein
  Wurf von 5 kann die angebotene Break-Aktion unmittelbar ausführen.
- Das öffentliche Start-Run-Event führt den Wurf und die Run-Grundstärke.
- Die Spielchronik zeigt für beide Seiten beispielsweise:
  `AI Boon würfelt eine 5 und hat für diesen Run Grundstärke 5.`
- Lehnt die Engine künftig eine KI-LegalAction ab, meldet der Server
  `ai_engine_action_rejected` samt sicherem Engine-Fehlercode. Die potenziell
  private Engine-Nachricht wird nicht an die Gegenseite ausgegeben.

## Verifikation

- Engine: 3 Testdateien, 59 Tests grün.
- Web-Chronik: 1 Testdatei, 168 Tests grün.
- Multiplayer-Server: 1 Testdatei, 118 Tests grün.
- Typechecks: `@netgrid/shared`, `@netgrid/engine`, `@netgrid/web` und
  `@netgrid/server` grün.
- `git diff --check` grün.

## Integration

Die Umsetzung liegt in vier fachlichen Paketcommits nach dem Prozessvertrag.
Es wurde keine Legacy- oder SQLite-Recovery ergänzt; das betroffene lokale
Spiel wird per Zugrücknahme vor den Run gesetzt.
