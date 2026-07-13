# AI Behavior Baseline v1

Status: attention_required
Git head: 5083ec265
Generated: 2026-07-13T14:47:40.347Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: action_limit_games:6

| Metric                | Value |
| --------------------- | ----: |
| illegalActions        |     0 |
| replayFailures        |     0 |
| actionLimitGames      |     6 |
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
| Advanced remote contest skip rate              | 0.904 |
| Plan conversion rate                           | 0.775 |
| Strategic no-progress repeats / 100 decisions  | 2.568 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 3.591 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1612 |             0.000 |                    0.868 |                0.845 |             1.303 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1622 |             0.000 |                    0.906 |                0.896 |             0.925 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1378 |             0.000 |                    0.800 |                0.877 |             1.016 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2656 |             0.000 |                    0.857 |                0.639 |              4.33 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      1929 |             0.000 |                    0.733 |                0.784 |             3.629 |               0 |      1 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      3614 |             0.000 |                    0.961 |                0.735 |             2.601 |               0 |      5 |

## Outcome context

- Runner agenda points: 192
- Corp agenda points: 130
- Runner steals: 101
- Corp scores: 87
- Score or steal actions: 188
- Average actions: 213.517
- Average turns: 29.033

## Comparison

Comparable: yes
Baseline git head: 47f078f77
Candidate git head: 5083ec265
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                   +0.037 |
| planConversionRate                            |                   -0.015 |
| strategicNoProgressRatePer100Decisions        |                   +0.181 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   -1.426 |
| averageActions                                |                  +22.167 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Causal control against current main

The compact reference predates the worktree base by many AI changes. The two
action-limit seeds that are new relative to `47f078f77` were therefore rerun
with the same decks, controllers and 480-action limit on clean start-main
`5a2f9a532`, without this branch:

| Slot                                         | Seed                       | Start-main                     | Candidate                      | Attribution                  |
| -------------------------------------------- | -------------------------- | ------------------------------ | ------------------------------ | ---------------------------- |
| strategy_panel_net_damage_black_ice          | ai-behavior-baseline-v1-04 | action limit, 480 actions, 4:0 | action limit, 480 actions, 4:0 | inherited before this branch |
| strategy_panel_hybrid_score_punish_cheap_bag | ai-behavior-baseline-v1-10 | action limit, 480 actions, 0:6 | action limit, 480 actions, 4:3 | inherited before this branch |

The hard-gate delta against the current-main control is therefore zero. The
six action-limit games remain project-level follow-up work; this candidate adds
no new action-limit seed, hard-failure class, legality, replay, fallback,
timeout, runtime, hidden-info, or redaction regression.
