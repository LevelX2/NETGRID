# AI109 Late-Draw Action-Limit Case

Datum: 2026-06-12

## Ziel

AI109 isoliert den einzelnen `late_draw_without_coverage_or_hand_goal`-Fall aus AI108 und prüft, ob ein enger Runtime-Fix gerechtfertigt ist.

## Fall

Detailartefakt:

- `docs/reviews/ai/ai109-late-draw-action-limit-case-detail-2026-06-12.json`

Der Fall liegt in:

- Pair: C
- Seed: `ai-v143-tuning-004`
- Winner: `action_limit_reached`
- Actions: 160

Im letzten 60-Action-Fenster liegen fünf Runner-Draws:

| Action-Index | Turn | Credits vorher | Plan | Signale |
| ---: | ---: | ---: | --- | --- |
| 111 | 16 | 10 | `runner.opportunistic_central_run` | `runnerPressureReadyByTargetRnd`, `runnerSetupMissingCoverageTypes: wall` |
| 130 | 20 | 10 | `runner.contest_remote` | `runnerPressureReadyByTargetRnd`, `runnerSetupMissingCoverageTypes: wall` |
| 152 | 22 | 7 | `runner.contest_remote` | `runnerPressureReadyByTargetRnd`, `runnerPressureReadyByTargetRemote`, `runnerSetupMissingCoverageTypes: wall` |
| 153 | 22 | 7 | `basic_economy_draw` | `runnerPressureReadyByTargetRnd`, `runnerPressureReadyByTargetRemote`, `runnerSetupMissingCoverageTypes: wall` |
| 154 | 22 | 7 | `basic_economy_draw` | `runnerPressureReadyByTargetRnd`, `runnerPressureReadyByTargetRemote`, `runnerSetupMissingCoverageTypes: wall` |

## Bewertung

Der Fall ist kein sauberer Kandidat für einen pauschalen späten Draw-Malus. Alle späten Draws tragen ein öffentliches Coverage-Signal: dem Runner fehlt Wall-Coverage. Damit ist die alte Restklasse `late_draw_without_coverage_or_hand_goal` diagnostisch zu hart formuliert.

Eine Runtime-Strafe gegen diese Draws würde riskieren, echte Coverage-Suche zu bestrafen. Das widerspricht dem Paketauftrag, keine pauschalen Draw-Strafen einzuführen.

## Umsetzung

Der Trace-Classifier unterscheidet jetzt:

- `late_draw_for_coverage_or_hand_goal`
- `late_draw_without_coverage_or_hand_goal`

`runnerSetupMissingCoverageTypes` zählt dabei als Coverage-Ziel, auch wenn das Textfeld des Trace-Eintrags nicht das Wort `coverage` enthält.

Neue Regression:

- `keeps late draws with coverage gaps out of no-goal draw subclusters`

## Nachlauf

Nachweis:

- `docs/reviews/ai/ai109-late-draw-action-limit-case-a-d-5seed-2026-06-12.json`

Kernwerte:

- Spiele: 20
- Entscheidungen: 2498
- Illegale Actions: 0
- Replay-Fehler: 0
- Redaction safe: ja
- `actionLimitReached`: 9
- `late_draw_for_coverage_or_hand_goal`: 1
- `late_draw_without_coverage_or_hand_goal`: 0
- `mixed_unknown`: 0
- `continue_without_progress`: 0

## Schlussfolgerung

AI109 ergibt keinen sicheren Runtime-Fix für `<= 8`. Der bisherige Late-Draw-Rest war eine Diagnoseunschärfe: Draws mit klarer Wall-Coverage-Lücke dürfen nicht als Draws ohne Coverage-/Handziel gelten.
