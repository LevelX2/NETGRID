# AI Behavior Baseline v1

Status: attention_required
Git head: 7212a70c4
Generated: 2026-07-26T08:15:38.687Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: illegal_actions:2, action_limit_games:2, runtime_errors:2, repeated_runtime_failure_owner:scheduler:2

| Metric | Value |
| --- | ---: |
| illegalActions | 2 |
| replayFailures | 0 |
| actionLimitGames | 2 |
| fallbackActions | 0 |
| timeoutActions | 0 |
| runtimeErrors | 2 |
| classifiedRuntimeFailures | 2 |
| unclassifiedRuntimeFailures | 0 |
| classifiedActionLimitGames | 2 |
| unclassifiedActionLimitGames | 0 |
| hiddenInfoFindings | 0 |
| noLegalActionFailures | 0 |
| redactionSafe | yes |

### Runtime failure classifications

| Code | Count |
| --- | ---: |
| missing_plan_module_coverage | 2 |

| Owner | Count |
| --- | ---: |
| scheduler | 2 |

### Action-limit classifications

| Slot | Seed | Classified | Last owner | Last plan | Last step | No-progress cluster | No-progress subcluster |
| --- | --- | --- | --- | --- | --- | --- | --- |
| strategy_panel_fast_advance_chrome_rush | ai-behavior-baseline-v1-05 | yes | plan_module | plan:corp.economy:economy-liquidity-development%3Acorp%3A54 | plan:corp.economy:economy-liquidity-development%3Acorp%3A54:fund | action_limit_low_value_repeat | corp_late_gain_credit_no_safe_alternative |
| strategy_panel_net_damage_black_ice | ai-behavior-baseline-v1-08 | yes | window_resolution | rules.window_resolution | rules.window_resolution | action_limit_setup_economy_loop | corp_late_gain_credit_no_safe_alternative |

## Behavioural metrics

| Metric | Value |
| --- | ---: |
| Missed score window rate | 0.000 |
| Advanced remote contest skip rate | 0.814 |
| Plan conversion rate | 0.683 |
| Strategic no-progress repeats / 100 decisions | 5.304 |
| Clearly dominated plan choices / 100 decisions | 0 |
| Trace findings / 100 decisions | 1.317 |
| Action-capacity use rate | n/a |
| Action-capacity plan conversion rate | n/a |
| Action-capacity expiration rate | n/a |
| Action-capacity misconversion rate | n/a |
| Premature Runner end turns / 100 decisions | 0 |
| Redundant low-value Runner persistent install rate | n/a |

## Deck slots

| Slot | Runner | Corp | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| progression_tuning_origin_rig_vs_tax | rig_economy_pressure | remote_scoring | 10 | 1560 | 0.000 | 0.844 | 0.774 | 4.615 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | event_pressure | remote_scoring | 10 | 1475 | 0.000 | 0.875 | 0.715 | 5.627 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | event_pressure | tag_punish | 10 | 1930 | 0.000 | 0.875 | 0.773 | 3.679 | 0 | 0 |
| strategy_panel_fast_advance_chrome_rush | rig_economy_pressure | fast_advance | 10 | 3095 | 0.000 | 0.800 | 0.662 | 6.624 | 0 | 1 |
| strategy_panel_net_damage_black_ice | central_multiaccess | net_damage | 10 | 2981 | n/a | 0.833 | 0.683 | 4.73 | 0 | 1 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish | 10 | 2628 | 0.000 | 0.725 | 0.564 | 5.822 | 0 | 0 |

## Outcome context

- Runner agenda points: 296
- Corp agenda points: 124
- Runner steals: 167
- Corp scores: 78
- Score or steal actions: 245
- Action-capacity opportunities: 0
- Action-capacity uses: 0
- Action-capacity plan conversions: 0
- Action-capacity follow-up conversions: 0
- Action-capacity expired uses: 0
- Action-capacity misconversions: 0
- Runner end turns with clicks: 20
- Deterministic Corp-deckout end turns with clicks: 20
- Premature Runner end turns with clicks: 0
- Runner persistent install selections: 0
- Redundant low-value Runner persistent install selections: 0
- Average actions: 227.817
- Average turns: 28.633

## Comparison

No prior baseline was supplied. This result is the frozen v1 reference for future paired runs.

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Premature Runner end turns exclude zero-click turns, decisions without an actionable legal alternative, and the explicit deterministic Corp-deckout closeout.
- Redundant low-value persistent installs require structured persistent-install evaluation, `redundant_duplicate` classification, and negative final fit. Useful backups and other positively valued second copies remain permitted.
- Win rate is deliberately outcome context rather than the acceptance criterion.
