# AI Behavior Baseline v1

Status: attention_required
Git head: b9f50ab69
Generated: 2026-07-16T18:30:10.384Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: illegal_actions:1, action_limit_games:3, runtime_errors:1

| Metric | Value |
| --- | ---: |
| illegalActions | 1 |
| replayFailures | 0 |
| actionLimitGames | 3 |
| fallbackActions | 0 |
| timeoutActions | 0 |
| runtimeErrors | 1 |
| hiddenInfoFindings | 0 |
| noLegalActionFailures | 0 |
| redactionSafe | yes |

## Behavioural metrics

| Metric | Value |
| --- | ---: |
| Missed score window rate | 0.000 |
| Advanced remote contest skip rate | 0.840 |
| Plan conversion rate | 0.772 |
| Strategic no-progress repeats / 100 decisions | 2.612 |
| Clearly dominated plan choices / 100 decisions | 0 |
| Trace findings / 100 decisions | 5.042 |

## Deck slots

| Slot | Runner | Corp | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| progression_tuning_origin_rig_vs_tax | rig_economy_pressure | remote_scoring | 10 | 1554 | 0.000 | 0.861 | 0.846 | 1.544 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | event_pressure | remote_scoring | 10 | 1451 | 0.000 | 0.850 | 0.916 | 1.034 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | event_pressure | tag_punish | 10 | 1422 | 0.000 | n/a | 0.913 | 0.774 | 0 | 0 |
| strategy_panel_fast_advance_chrome_rush | rig_economy_pressure | fast_advance | 10 | 2690 | 0.000 | 0.652 | 0.601 | 4.052 | 0 | 0 |
| strategy_panel_net_damage_black_ice | central_multiaccess | net_damage | 10 | 2951 | 0.000 | 0.901 | 0.804 | 2.982 | 0 | 1 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish | 10 | 3102 | 0.000 | 0.811 | 0.715 | 3.127 | 0 | 2 |

## Outcome context

- Runner agenda points: 180
- Corp agenda points: 145
- Runner steals: 96
- Corp scores: 98
- Score or steal actions: 194
- Average actions: 219.5
- Average turns: 30.683

## Comparison

Comparable: yes
Baseline git head: 8f4515b7a
Candidate git head: b9f50ab69
Incompatibilities: none

| Metric | Candidate minus baseline |
| --- | ---: |
| missedScoreWindowRate | 0 |
| advancedRemoteContestSkipRate | +0.051 |
| planConversionRate | +0.01 |
| strategicNoProgressRatePer100Decisions | -0.004 |
| clearlyDominatedPlanChoiceRatePer100Decisions | 0 |
| findingRatePer100Decisions | +1.008 |
| averageActions | +23.267 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Reviewentscheidung

Der exakte Vorher-Stand `8f4515b7a` erreichte in demselben 60-Spiele-Panel
zwei Spiele am Aktionslimit. Der Kandidat erreichte drei. Der illegale Zug und
der Runtime-Fehler in Net-Damage-Seed 03 treten bereits im Vorher-Stand auf
und sind nicht durch die Broker-Anpassung entstanden.

Nach diesem Lauf wurde die Installationspriorität auf dem finalen Branch-Stand
`877176982` auf ihre zuvor bewährte Kalibrierung zurückgesetzt. Ein gezielter
Sechs-Spiele-Nachlauf blieb bei den drei betroffenen Konstellationen am
Aktionslimit; weitere Gewichtskorrekturen ohne eigenständige Analyse der
allgemeinen Fortschrittsschleife wurden deshalb nicht vorgenommen.

Der Nutzer hat die bekannte Abweichung am 16. Juli 2026 ausdrücklich
akzeptiert und die Integration freigegeben, damit das Broker-Verhalten in
echten Spielen beurteilt wird.
