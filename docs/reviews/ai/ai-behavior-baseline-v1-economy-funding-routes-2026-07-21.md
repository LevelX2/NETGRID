# AI Behavior Baseline v1

Status: complete
Git head: b3a59226f
Generated: 2026-07-22T01:17:30.245Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
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
| Missed score window rate                       | 0.000 |
| Advanced remote contest skip rate              | 0.859 |
| Plan conversion rate                           | 0.721 |
| Strategic no-progress repeats / 100 decisions  | 2.729 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 3.112 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1768 |             0.000 |                    0.855 |                0.881 |             0.905 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1759 |             0.000 |                    0.900 |                0.760 |              2.16 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      2026 |             0.000 |                    0.870 |                0.817 |             1.629 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2351 |             0.000 |                    0.667 |                0.570 |             4.849 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |       858 |               n/a |                      n/a |                0.615 |             3.147 |               0 |      0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2195 |             0.000 |                    0.865 |                0.676 |             3.235 |               0 |      0 |

## Outcome context

- Runner agenda points: 173
- Corp agenda points: 130
- Runner steals: 90
- Corp scores: 85
- Score or steal actions: 175
- Average actions: 182.617
- Average turns: 24

## Comparison

Comparable: yes
Baseline git head: c6e1d4d72
Candidate git head: b3a59226f
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                   +0.021 |
| planConversionRate                            |                   +0.021 |
| strategicNoProgressRatePer100Decisions        |                   -0.296 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   -2.743 |
| averageActions                                |                   -14.65 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.
