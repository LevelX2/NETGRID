# AI Behavior Baseline v1

Status: complete
Git head: 7db451faa
Generated: 2026-07-14T20:15:06.786Z

## Contract

- Slots: strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-05
- Games: 2
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: yes
Hard failures: none

| Metric                | Value |
| --------------------- | ----: |
| illegalActions        |     0 |
| replayFailures        |     0 |
| actionLimitGames      |     0 |
| fallbackActions       |     0 |
| timeoutActions        |     0 |
| runtimeErrors         |     0 |
| hiddenInfoFindings    |     0 |
| noLegalActionFailures |     0 |
| redactionSafe         |   yes |

## Behavioural metrics

| Metric                                         | Value |
| ---------------------------------------------- | ----: |
| Missed score window rate                       |   n/a |
| Advanced remote contest skip rate              |   n/a |
| Plan conversion rate                           | 0.706 |
| Strategic no-progress repeats / 100 decisions  | 4.505 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 0.721 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |     2 |       555 |               n/a |                      n/a |                0.706 |             4.505 |               0 |      0 |

## Outcome context

- Runner agenda points: 4
- Corp agenda points: 0
- Runner steals: 1
- Corp scores: 0
- Score or steal actions: 1
- Average actions: 277.5
- Average turns: 37.5

## Comparison

No prior baseline was supplied. This result is the frozen v1 reference for future paired runs.

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.
