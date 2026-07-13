# AI Behavior Baseline v1

Status: attention_required
Git head: a8a27f41d
Generated: 2026-07-13T20:25:13.432Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: action_limit_games:4

| Metric                | Value |
| --------------------- | ----: |
| illegalActions        |     0 |
| replayFailures        |     0 |
| actionLimitGames      |     4 |
| fallbackActions       |     0 |
| timeoutActions        |     0 |
| runtimeErrors         |     0 |
| hiddenInfoFindings    |     0 |
| noLegalActionFailures |     0 |
| redactionSafe         |   yes |

## Behavioural metrics

| Metric                                         | Value |
| ---------------------------------------------- | ----: |
| Missed score window rate                       | 0.000 |
| Advanced remote contest skip rate              | 0.860 |
| Plan conversion rate                           | 0.774 |
| Strategic no-progress repeats / 100 decisions  | 2.557 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 3.231 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1663 |             0.000 |                    0.846 |                0.845 |             1.624 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1602 |             0.000 |                    0.857 |                0.928 |             0.936 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1416 |             0.000 |                    0.750 |                0.903 |             0.918 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2594 |             0.000 |                    0.750 |                0.623 |             4.086 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      1709 |             0.000 |                    0.846 |                0.761 |             3.569 |               0 |      0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      3178 |             0.000 |                    0.900 |                0.717 |             2.801 |               0 |      4 |

## Outcome context

- Runner agenda points: 158
- Corp agenda points: 132
- Runner steals: 83
- Corp scores: 90
- Score or steal actions: 173
- Average actions: 202.7
- Average turns: 27.317

## Comparison

Comparable: yes
Baseline git head: 5083ec265
Candidate git head: a8a27f41d
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                   -0.044 |
| planConversionRate                            |                   -0.001 |
| strategicNoProgressRatePer100Decisions        |                   -0.011 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                    -0.36 |
| averageActions                                |                  -10.817 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.
