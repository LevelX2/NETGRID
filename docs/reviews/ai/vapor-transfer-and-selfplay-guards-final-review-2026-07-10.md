# Vapor-Transfer und Selfplay-Guardrails: Final Review

## Ergebnis

Die drei freigegebenen Fehlergruppen sind behoben. Der generische
Score-Conversion-Vertrag erreicht die AI-Input-DTO, wird als Score-Semantik
klassifiziert und bindet Advancement-Transfer, Advancement-Platzierung und
zusätzliche Aktionskapazität an `corp.create_score_window`. Die Engine erzeugt
Secret-Spend-Guess-Aktionen nur noch, wenn nach den gedruckten Eventkosten der
benötigte Credit-Puffer verbleibt. Decline-Projektionen tragen keine
Trash-only-Waiverfelder mehr.

## 100-Versuche-Nachtest

- 100 Versuche, 100 erzeugte Spielzusammenfassungen
- 46 Corp-Siege, 19 Runner-Siege, 35 reguläre Action-Limits
- 226 Corp-Scores, 155 Runner-Steals
- 0 SimulationFailures
- 0 ReplayFailures
- 0 RedactionFailures
- 0 Fallback-Nutzungen
- 0 verpasste Scorefenster
- 0 unsichere Scores

Vapor Ops war in 50 Spielen installiert sichtbar. Der Nachtest beobachtete
151 Transferfenster mit 157 Kandidaten und 14 tatsächlich gewählten
Transfers. Die Nutzung verteilte sich auf alle vier Matchups:

| Runner-Archetyp | gewählte Transfers | Transferfenster |
|---|---:|---:|
| Blink Pressure | 3 | 14 |
| Classic Prep Economy | 4 | 41 |
| Proteus HQ Virus & Derez | 2 | 46 |
| Proteus R&D Virus & Bad Publicity | 5 | 50 |

Vor der Änderung standen 231 Transferfenster ohne eine einzige Auswahl. Im
Nachtest wurden Transfers nur bei konkreter Conversion gewählt; Fenster ohne
geeignetes Advance-Ziel erhielten fail-closed
`corp_advancement_counter_placement_without_conversion`.

## Fehlerseed-Regression

Der separate Zehnerlauf über Blink und Proteus R&D deckte alle zuvor
fehlerhaften Seeds 06, 11, 18 und 21 ab. Ergebnis: 0 SimulationFailures, 0
IllegalActions, 0 Replay-/Redaction-Fehler und 5 gewählte Vapor-Transfers.
Classic Seed 22 wandelte Vapor Ops zweimal über den generischen Scoreplan um
und endete 8:0 für die Corp.

## Gates

- AI-Shard 1: 94 Dateien, 540 Tests
- AI-Shard 2: 94 Dateien, 578 Tests
- AI-Shard 3: 94 Dateien, 696 Tests
- Engine vollständig: 180 Dateien, 1.618 Tests
- AI- und Engine-Typecheck: grün
- AI-Compiled-Hints, Derived Facts, Hint Inspector, Manual Overlays und
  Action-Semantic-Signal-Catalog: grün
- Card-Function-Abstraction: grün

## Separat abgeschlossener unabhängiger Folgefund

Der breite Nachtest enthielt eine gezählte IllegalAction in
`proteus_hq_virus_derez`, Seed 11, StateVersion 152. Nach dem legalen Spielen
von Test Spin auf Archives installierte die Choice ein Programm, anschließend
konnte der verzögerte Run nicht gestartet werden
(`Test Spin konnte keinen Run starten`). Das Spiel wurde als reguläres
Action-Limit fortgeführt; es entstand kein Simulation-, Replay- oder
Redaction-Failure.

Dieser Fund gehörte nicht zu den drei damaligen Fehlergruppen und wurde nicht
mit zusätzlicher KI-Kartenlogik vermischt. Er ist nach separater Freigabe über
den atomaren generischen Runstart-Optionsvertrag behoben und in
`docs/reviews/ai/test-spin-choice-run-guard-final-review-2026-07-10.md`
verifiziert.

## Rohdaten

Die umfangreichen Reports bleiben unversioniert:

- `data/local/vapor-transfer-targeted-seeds-2026-07-10.json`
- `data/local/vapor-transfer-100attempt-retest-2026-07-10.json`
- `data/local/vapor-transfer-100attempt-retest-2026-07-10.md`
