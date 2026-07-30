# AI Behavior Baseline v1

Status: attention_required
Git head: 3e0080cf3
Generated: 2026-07-30T00:17:23.730Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: action_limit_games:1

Cutover-Review: **angenommen**. Das einzelne Action-Limit ist die bereits
dokumentierte fremde Runner-Spätspielbaseline. Derselbe Kandidatenlauf
`strategy_panel_fast_advance_chrome_rush` /
`ai-behavior-baseline-v1-02` endet mit `maxActions=650` nach 581 Aktionen
regulär und weist weiterhin keinen illegalen Zug, Runtime-, Replay-,
Hidden-Info-, Fallback-, Timeout- oder No-LegalAction-Fehler auf.

| Metric | Value |
| --- | ---: |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitGames | 1 |
| fallbackActions | 0 |
| timeoutActions | 0 |
| runtimeErrors | 0 |
| classifiedRuntimeFailures | 0 |
| unclassifiedRuntimeFailures | 0 |
| classifiedActionLimitGames | 1 |
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
| strategy_panel_fast_advance_chrome_rush | ai-behavior-baseline-v1-02 | yes | plan_module | plan:runner.complete_turn:standard-turn-completion | plan:runner.complete_turn:standard-turn-completion:complete_turn | action_limit_low_value_repeat | runner_late_gain_credit_real_reserve |

## Behavioural metrics

| Metric | Value |
| --- | ---: |
| Missed score window rate | 0.097 |
| Advanced remote contest skip rate | 0.841 |
| Plan conversion rate | 0.646 |
| Strategic no-progress repeats / 100 decisions | 4.379 |
| Clearly dominated plan choices / 100 decisions | 0 |
| Trace findings / 100 decisions | 1.295 |
| Action-capacity use rate | n/a |
| Action-capacity plan conversion rate | n/a |
| Action-capacity expiration rate | n/a |
| Action-capacity misconversion rate | n/a |
| Premature Runner end turns / 100 decisions | 0 |
| Redundant low-value Runner persistent install rate | n/a |

## Deck slots

| Slot | Runner | Corp | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| progression_tuning_origin_rig_vs_tax | rig_economy_pressure | remote_scoring | 10 | 1809 | 0.167 | 0.947 | 0.782 | 1.879 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | event_pressure | remote_scoring | 10 | 1794 | 0.000 | 0.769 | 0.570 | 7.581 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | event_pressure | tag_punish | 10 | 1967 | 0.000 | 0.792 | 0.692 | 4.423 | 0 | 0 |
| strategy_panel_fast_advance_chrome_rush | rig_economy_pressure | fast_advance | 10 | 3379 | 0.093 | 0.758 | 0.601 | 4.646 | 0 | 1 |
| strategy_panel_net_damage_black_ice | central_multiaccess | net_damage | 10 | 1559 | 0.250 | 0.875 | 0.673 | 2.886 | 0 | 0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish | 10 | 2236 | 0.063 | 0.875 | 0.620 | 4.428 | 0 | 0 |

## Outcome context

- Runner agenda points: 205
- Corp agenda points: 149
- Runner steals: 115
- Corp scores: 84
- Score or steal actions: 199
- Action-capacity opportunities: 0
- Action-capacity uses: 0
- Action-capacity plan conversions: 0
- Action-capacity follow-up conversions: 0
- Action-capacity expired uses: 0
- Action-capacity misconversions: 0
- Runner end turns with clicks: 27
- Deterministic Corp-deckout end turns with clicks: 27
- Premature Runner end turns with clicks: 0
- Runner persistent install selections: 0
- Redundant low-value Runner persistent install selections: 0
- Average actions: 212.4
- Average turns: 27

## Comparison

Comparable: yes
Baseline git head: 3105db2ad
Candidate git head: 3e0080cf3
Incompatibilities: none

| Metric | Candidate minus baseline |
| --- | ---: |
| missedScoreWindowRate | +0.097 |
| advancedRemoteContestSkipRate | +0.022 |
| planConversionRate | -0.014 |
| strategicNoProgressRatePer100Decisions | +0.348 |
| clearlyDominatedPlanChoiceRatePer100Decisions | 0 |
| findingRatePer100Decisions | +0.212 |
| averageActions | -21.6 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Premature Runner end turns exclude zero-click turns, decisions without an actionable legal alternative, and the explicit deterministic Corp-deckout closeout.
- Redundant low-value persistent installs require structured persistent-install evaluation, `redundant_duplicate` classification, and negative final fit. Useful backups and other positively valued second copies remain permitted.
- Win rate is deliberately outcome context rather than the acceptance criterion.
