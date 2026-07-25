# AI Behavior Baseline v1

Status: complete
Git head: 527833085
Generated: 2026-07-25T19:00:55.459Z

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

| Metric | Value |
| --- | ---: |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitGames | 0 |
| fallbackActions | 0 |
| timeoutActions | 0 |
| runtimeErrors | 0 |
| classifiedRuntimeFailures | 0 |
| unclassifiedRuntimeFailures | 0 |
| classifiedActionLimitGames | 0 |
| unclassifiedActionLimitGames | 0 |
| hiddenInfoFindings | 0 |
| noLegalActionFailures | 0 |
| redactionSafe | yes |

### Runtime failure classifications

| Code | Count |
| --- | ---: |
| none | 0 |

| Owner | Count |
| --- | ---: |
| none | 0 |

### Action-limit classifications

| Slot | Seed | Classified | Last owner | Last plan | Last step | No-progress cluster | No-progress subcluster |
| --- | --- | --- | --- | --- | --- | --- | --- |
| none | none | yes | none | none | none | none | none |

## Behavioural metrics

| Metric | Value |
| --- | ---: |
| Missed score window rate | 0.000 |
| Advanced remote contest skip rate | 0.780 |
| Plan conversion rate | 0.665 |
| Strategic no-progress repeats / 100 decisions | 7.217 |
| Clearly dominated plan choices / 100 decisions | 0 |
| Trace findings / 100 decisions | 1.567 |
| Action-capacity use rate | n/a |
| Action-capacity plan conversion rate | n/a |
| Action-capacity expiration rate | n/a |
| Action-capacity misconversion rate | n/a |
| Premature Runner end turns / 100 decisions | 0 |
| Redundant low-value Runner persistent install rate | n/a |

## Deck slots

| Slot | Runner | Corp | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| progression_tuning_origin_rig_vs_tax | rig_economy_pressure | remote_scoring | 10 | 1218 | 0.000 | 0.813 | 0.782 | 4.844 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | event_pressure | remote_scoring | 10 | 1017 | 0.000 | 0.769 | 0.742 | 8.751 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | event_pressure | tag_punish | 10 | 1413 | 0.000 | 0.818 | 0.794 | 3.822 | 0 | 0 |
| strategy_panel_fast_advance_chrome_rush | rig_economy_pressure | fast_advance | 10 | 2508 | 0.000 | 0.811 | 0.639 | 11.124 | 0 | 0 |
| strategy_panel_net_damage_black_ice | central_multiaccess | net_damage | 10 | 2754 | n/a | 0.583 | 0.636 | 6.1 | 0 | 0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish | 10 | 2258 | 0.000 | 0.789 | 0.552 | 6.953 | 0 | 0 |

## Outcome context

- Runner agenda points: 382
- Corp agenda points: 58
- Runner steals: 222
- Corp scores: 29
- Score or steal actions: 251
- Action-capacity opportunities: 0
- Action-capacity uses: 0
- Action-capacity plan conversions: 0
- Action-capacity follow-up conversions: 0
- Action-capacity expired uses: 0
- Action-capacity misconversions: 0
- Runner end turns with clicks: 36
- Deterministic Corp-deckout end turns with clicks: 11
- Premature Runner end turns with clicks: 0
- Runner persistent install selections: 0
- Redundant low-value Runner persistent install selections: 0
- Average actions: 186.133
- Average turns: 27.667

## Comparison

Comparable: yes
Baseline git head: 527833085
Candidate git head: 527833085
Incompatibilities: none

| Metric | Candidate minus baseline |
| --- | ---: |
| missedScoreWindowRate | 0 |
| advancedRemoteContestSkipRate | -0.055 |
| planConversionRate | +0.035 |
| strategicNoProgressRatePer100Decisions | -0.973 |
| clearlyDominatedPlanChoiceRatePer100Decisions | 0 |
| findingRatePer100Decisions | -2.114 |
| averageActions | -11.25 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Premature Runner end turns exclude zero-click turns, decisions without an actionable legal alternative, and the explicit deterministic Corp-deckout closeout.
- Redundant low-value persistent installs require structured persistent-install evaluation, `redundant_duplicate` classification, and negative final fit. Useful backups and other positively valued second copies remain permitted.
- Win rate is deliberately outcome context rather than the acceptance criterion.
