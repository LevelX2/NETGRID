# AI080 Full Test Sweep Final Review

Datum: 2026-06-10

## Ergebnis

AI080 ist ausgefuehrt. Die AI-spezifischen Tests, Typechecks, root Typecheck, Diff-Check und der finale A-D-x5-Selfplay-Trace sind abgeschlossen. Es gab keine AI-Regressionsfixes nach AI079.

Der root `corepack pnpm test` ist nicht gruen, weil bestehende `@netgrid/engine`-Tests ausserhalb des AI-Testgegenstands fehlschlagen. AI073-AI080 aendern keine Engine-, LegalAction-, Replay-, StateHash- oder Randomness-Logik; diese Engine-Fehler wurden deshalb nicht im AI-Stabilisierungspaket behoben.

## Erfolgreiche Checks

- `corepack pnpm --filter @netgrid/ai test`: PASS, 54 Testdateien, 1047 Tests
- `corepack pnpm --filter @netgrid/ai typecheck`: PASS
- `corepack pnpm typecheck`: PASS, 7 Workspace-Projekte
- `git diff --check`: PASS
- finaler A-D-x5-Selfplay-Trace: PASS auf Safety-Gates

## Root-Test-Befund

`corepack pnpm test`: FAIL in `@netgrid/engine`, 5 Testdateien, 8 Tests.

Fehlerklassen:

- Proteus-Manifest-Drift: `manifestAiSupportDrift` listet 154 Proteus-Karten.
- Originalset/Mechanik-Smokes: mehrere "Missing legal action"-Fehler in Hidden-Access-/R&D-/Archives-Access-Flows.
- Corolla Speed Chip recurring-credit Erwartung: erwartete Runner-Credits `1`, erhalten `0`.
- PlayerView remote root order: erwartete Breach-Queue fehlt.

Bewertung: Nicht durch AI073-AI080 verursacht und ausserhalb des erlaubten Fixbereichs dieses Pakets.

## Finales A-D-x5 Trace-Mining

JSON: `docs/reviews/ai/ai080-final-selfplay-trace-mining-a-d-2026-06-10.json`

| Metric | Wert |
| --- | ---: |
| games | 20 |
| decisions | 2571 |
| findings | 829 |
| criticalFindings | 0 |
| illegalActions | 0 |
| replayFailures | 0 |
| hidden-info markers | 0 |
| allRedactionSafe | 1 |
| actionLimitReached | 11 |
| repeated_known_no_payoff_remote | 0 |
| repeated_no_progress_run | 35 |
| recovery_low_value_loop | 2 |
| unsafeScoreChosen | 6 |
| passiveActionWithScoreLineAvailable | 6 |
| corp_never_scores_long_game | 3 |
| corpAgendaScores | 14 |

## Action-Limit Cluster

| Cluster | Matches |
| --- | ---: |
| `action_limit_low_value_repeat` | 8 |
| `action_limit_mixed_or_unknown` | 3 |
| `action_limit_runner_repeated_no_progress_run` | 0 |
| `action_limit_runner_remote_contest_blocked` | 0 |
| `action_limit_corp_scoreline_stall` | 0 |
| `action_limit_setup_economy_loop` | 0 |

## Zielwerte

- Erfuellt: `illegalActions = 0`
- Erfuellt: `replayFailures = 0`
- Erfuellt: `criticalFindings = 0`
- Erfuellt: `allRedactionSafe = 1`
- Erfuellt: Hidden-info marker `0`
- Erfuellt: `repeated_known_no_payoff_remote = 0`
- Erfuellt: `recovery_low_value_loop = 2`
- Erfuellt: `corp_never_scores_long_game = 3`
- Erfuellt: `corpAgendaScores = 14`
- Nicht erfuellt: `repeated_no_progress_run = 35` gegen Ziel `<= 33`
- Nicht erfuellt: `actionLimitReached = 11` gegen Ziel `<= 8`
- Nicht erfuellt: `unsafeScoreChosen = 6` gegen Ziel `<= 3`
- Erfuellt am Grenzwert: `passiveActionWithScoreLineAvailable = 6`

## Abschlussbewertung

AI073-AI080 verbessert die Selfplay-Diagnose und reduziert false-positive Recovery-Funde deutlich. Die verbleibenden roten Qualitaetsziele sind nicht sicher durch eine einzelne kleine Runtime-Aenderung zu beheben: Action-Limits clustern ueberwiegend als heterogene Low-Value-Repeats, und die unsafe Scoreline-Funde bleiben trotz Doctrine-Gate unveraendert. Diese Punkte sollten als Folgepakete mit engeren Subclustern umgesetzt werden.
