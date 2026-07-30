# AI Behavior Baseline v1

Status: attention_required
Git head: c72842d70
Generated: 2026-07-30T02:22:15.197Z

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

Runner-Cutover-Review: **angenommen**. Das einzige Action-Limit ist weiterhin
die bereits vor dem Runner-Cutover dokumentierte Spätspielklasse
`runner_late_gain_credit_real_reserve`. Derselbe Lauf
`strategy_panel_fast_advance_chrome_rush` /
`ai-behavior-baseline-v1-02` endet mit `maxActions=650` nach 501 Aktionen
regulär durch Corp-Agenda-Punkte. Er enthält keinen illegalen Zug und keinen
Runtime-, Replay-, Hidden-Info-, Fallback-, Timeout- oder
No-LegalAction-Fehler.

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
| strategy_panel_fast_advance_chrome_rush | ai-behavior-baseline-v1-02 | yes | plan_module | plan:corp.defend_servers:server-defense-portfolio | plan:corp.defend_servers:server-defense-portfolio:develop_score_protection | action_limit_low_value_repeat | runner_late_gain_credit_real_reserve |

## Behavioural metrics

| Metric | Value |
| --- | ---: |
| Missed score window rate | 0.108 |
| Advanced remote contest skip rate | 0.866 |
| Plan conversion rate | 0.667 |
| Strategic no-progress repeats / 100 decisions | 3.827 |
| Clearly dominated plan choices / 100 decisions | 0 |
| Trace findings / 100 decisions | 1.122 |
| Action-capacity use rate | n/a |
| Action-capacity plan conversion rate | n/a |
| Action-capacity expiration rate | n/a |
| Action-capacity misconversion rate | n/a |
| Premature Runner end turns / 100 decisions | 0 |
| Redundant low-value Runner persistent install rate | n/a |

## Deck slots

| Slot | Runner | Corp | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| progression_tuning_origin_rig_vs_tax | rig_economy_pressure | remote_scoring | 10 | 1680 | 0.143 | 0.882 | 0.764 | 2.143 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | event_pressure | remote_scoring | 10 | 1667 | 0.125 | 0.864 | 0.628 | 6.239 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | event_pressure | tag_punish | 10 | 1879 | 0.000 | 0.727 | 0.698 | 4.683 | 0 | 0 |
| strategy_panel_fast_advance_chrome_rush | rig_economy_pressure | fast_advance | 10 | 3244 | 0.054 | 0.794 | 0.578 | 4.346 | 0 | 1 |
| strategy_panel_net_damage_black_ice | central_multiaccess | net_damage | 10 | 2273 | 0.286 | 0.920 | 0.709 | 2.86 | 0 | 0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish | 10 | 2898 | 0.130 | 0.887 | 0.686 | 3.037 | 0 | 0 |

## Outcome context

- Runner agenda points: 199
- Corp agenda points: 166
- Runner steals: 107
- Corp scores: 83
- Score or steal actions: 190
- Action-capacity opportunities: 0
- Action-capacity uses: 0
- Action-capacity plan conversions: 0
- Action-capacity follow-up conversions: 0
- Action-capacity expired uses: 0
- Action-capacity misconversions: 0
- Runner end turns with clicks: 23
- Deterministic Corp-deckout end turns with clicks: 23
- Premature Runner end turns with clicks: 0
- Runner persistent install selections: 0
- Redundant low-value Runner persistent install selections: 0
- Average actions: 227.35
- Average turns: 29.417

## Comparison

Comparable: yes
Baseline git head: 3e0080cf3
Candidate git head: c72842d70
Incompatibilities: none

| Metric | Candidate minus baseline |
| --- | ---: |
| missedScoreWindowRate | +0.011 |
| advancedRemoteContestSkipRate | +0.025 |
| planConversionRate | +0.021 |
| strategicNoProgressRatePer100Decisions | -0.552 |
| clearlyDominatedPlanChoiceRatePer100Decisions | 0 |
| findingRatePer100Decisions | -0.173 |
| averageActions | +14.95 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Premature Runner end turns exclude zero-click turns, decisions without an actionable legal alternative, and the explicit deterministic Corp-deckout closeout.
- Redundant low-value persistent installs require structured persistent-install evaluation, `redundant_duplicate` classification, and negative final fit. Useful backups and other positively valued second copies remain permitted.
- Win rate is deliberately outcome context rather than the acceptance criterion.
