# AI Behavior Baseline v1

Status: complete
Git head: eefee81c8
Generated: 2026-08-12T08:46:03.765Z

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

| Metric                       | Value |
| ---------------------------- | ----: |
| illegalActions               |     0 |
| replayFailures               |     0 |
| actionLimitGames             |     0 |
| fallbackActions              |     0 |
| timeoutActions               |     0 |
| runtimeErrors                |     0 |
| classifiedRuntimeFailures    |     0 |
| unclassifiedRuntimeFailures  |     0 |
| classifiedActionLimitGames   |     0 |
| unclassifiedActionLimitGames |     0 |
| hiddenInfoFindings           |     0 |
| noLegalActionFailures        |     0 |
| redactionSafe                |   yes |

### Runtime failure classifications

| Code | Count |
| ---- | ----: |
| none |     0 |

| Owner | Count |
| ----- | ----: |
| none  |     0 |

### Action-limit classifications

| Slot | Seed | Classified | Last owner | Last plan | Last step | No-progress cluster | No-progress subcluster |
| ---- | ---- | ---------- | ---------- | --------- | --------- | ------------------- | ---------------------- |
| none | none | yes        | none       | none      | none      | none                | none                   |

## Behavioural metrics

| Metric                                             | Value |
| -------------------------------------------------- | ----: |
| Missed score window rate                           | 0.030 |
| Advanced remote contest skip rate                  | 0.802 |
| Plan conversion rate                               | 0.680 |
| Strategic no-progress repeats / 100 decisions      | 3.429 |
| Clearly dominated plan choices / 100 decisions     |     0 |
| Trace findings / 100 decisions                     | 0.981 |
| Action-capacity use rate                           |   n/a |
| Action-capacity plan conversion rate               |   n/a |
| Action-capacity expiration rate                    |   n/a |
| Action-capacity misconversion rate                 |   n/a |
| Premature Runner end turns / 100 decisions         |     0 |
| Redundant low-value Runner persistent install rate |   n/a |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1642 |             0.111 |                    0.940 |                0.742 |             2.862 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1637 |             0.000 |                    0.818 |                0.770 |             2.627 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1889 |             0.000 |                    0.571 |                0.747 |             2.276 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      3100 |             0.025 |                    0.716 |                0.619 |             4.387 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      2759 |             0.000 |                    0.932 |                0.691 |             3.371 |               0 |      0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2942 |             0.000 |                    0.782 |                0.624 |             3.977 |               0 |      0 |

## Outcome context

- Runner agenda points: 191
- Corp agenda points: 164
- Runner steals: 104
- Corp scores: 97
- Score or steal actions: 201
- Action-capacity opportunities: 0
- Action-capacity uses: 0
- Action-capacity plan conversions: 0
- Action-capacity follow-up conversions: 0
- Action-capacity expired uses: 0
- Action-capacity misconversions: 0
- Runner end turns with clicks: 115
- Deterministic Corp-deckout end turns with clicks: 35
- Premature Runner end turns with clicks: 0
- Runner persistent install selections: 0
- Redundant low-value Runner persistent install selections: 0
- Average actions: 232.817
- Average turns: 31.417

## Comparison

No prior baseline was supplied. This result is the frozen v1 reference for future paired runs.

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Premature Runner end turns exclude zero-click turns, decisions without an actionable legal alternative, and the explicit deterministic Corp-deckout closeout.
- Redundant low-value persistent installs require structured persistent-install evaluation, `redundant_duplicate` classification, and negative final fit. Useful backups and other positively valued second copies remain permitted.
- Win rate is deliberately outcome context rather than the acceptance criterion.
