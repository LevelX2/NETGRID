# AI Behavior Baseline v1

Status: attention_required
Git head: c605cafe7
Generated: 2026-07-19T06:49:27.912Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: action_limit_games:3

| Metric | Value |
| --- | ---: |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitGames | 3 |
| fallbackActions | 0 |
| timeoutActions | 0 |
| runtimeErrors | 0 |
| hiddenInfoFindings | 0 |
| noLegalActionFailures | 0 |
| redactionSafe | yes |

## Behavioural metrics

| Metric | Value |
| --- | ---: |
| Missed score window rate | 0.000 |
| Advanced remote contest skip rate | 0.850 |
| Plan conversion rate | 0.703 |
| Strategic no-progress repeats / 100 decisions | 3.08 |
| Clearly dominated plan choices / 100 decisions | 0 |
| Trace findings / 100 decisions | 6.356 |

## Deck slots

| Slot | Runner | Corp | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| progression_tuning_origin_rig_vs_tax | rig_economy_pressure | remote_scoring | 10 | 1526 | 0.000 | 0.893 | 0.866 | 1.048 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | event_pressure | remote_scoring | 10 | 1577 | 0.000 | n/a | 0.806 | 1.585 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | event_pressure | tag_punish | 10 | 1393 | 0.000 | 0.875 | 0.797 | 2.154 | 0 | 0 |
| strategy_panel_fast_advance_chrome_rush | rig_economy_pressure | fast_advance | 10 | 2965 | 0.000 | 0.667 | 0.553 | 4.722 | 0 | 0 |
| strategy_panel_net_damage_black_ice | central_multiaccess | net_damage | 10 | 2363 | 0.000 | 0.818 | 0.731 | 2.962 | 0 | 2 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish | 10 | 2448 | 0.000 | 0.805 | 0.617 | 3.962 | 0 | 1 |

## Outcome context

- Runner agenda points: 171
- Corp agenda points: 140
- Runner steals: 96
- Corp scores: 91
- Score or steal actions: 187
- Average actions: 204.533
- Average turns: 26.383

## Comparison

Comparable: yes
Baseline git head: ce65b4aae
Candidate git head: c605cafe7
Incompatibilities: none

| Metric | Candidate minus baseline |
| --- | ---: |
| missedScoreWindowRate | 0 |
| advancedRemoteContestSkipRate | -0.038 |
| planConversionRate | -0.027 |
| strategicNoProgressRatePer100Decisions | +0.514 |
| clearlyDominatedPlanChoiceRatePer100Decisions | 0 |
| findingRatePer100Decisions | -0.846 |
| averageActions | -10.467 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Reviewentscheidung für Match 3bb14

Der Lauf gehört zum final abgeglichenen Integrationskandidaten `c605cafe7`
und ist mit der Referenz `ce65b4aae` vollständig vergleichbar. Slots, zehn
Seeds, Deck-Fingerprints, Controller und das Limit von 480 Aktionen sind
unverändert. Die technischen Gates verschlechtern sich in der Anzahl nicht:
weiterhin drei Action-Limit-Spiele, ansonsten überall null Fehler und
`redactionSafe: yes`.

Die drei Action-Limit-Fälle liegen in der Referenz bei Net Damage Seed 07 und
09 sowie Hybrid Score/Punish Seed 05. Im Kandidaten bleiben Net Damage Seed 07
und 09 bestehen; der Hybrid-Fall wechselt von Seed 05 zu Seed 01. Das ist kein
zusätzlicher Hard-Failure, aber ein diagnostischer Restpunkt und verhindert
eine Einstufung als vollständig grüne Referenz.

Die neue Near-Tie-Evidence erscheint in 19 von 12.272 Entscheidungen. Sie
bleibt auf Corp-Basic-Credit/Draw derselben Scope und Viability-Stufe sowie auf
einen strategischen Abstand von höchstens 100 Punkten begrenzt. In den
historischen D9-D11-Entscheidungen greift sie nicht, weil der neue konkrete
Verteidigungsbedarf Draw dort fachlich eindeutig macht.

Gegenüber der Referenz verbessern sich der Remote-Contest-Skip um 0,038, die
Finding-Rate um 0,846 pro 100 Entscheidungen und die mittlere Spiellänge um
10,467 Aktionen. Plan-Conversion sinkt um 0,027; strategische
No-Progress-Wiederholungen steigen um 0,514 pro 100 Entscheidungen. Da der
Kandidaten-Head zusätzlich die zwischen `ce65b4aae` und dem Paket-Ausgang
`52ac68d19` integrierten Änderungen enthält, sind diese diagnostischen Deltas
nicht ausschließlich diesem Paket zurechenbar.

Freigabeentscheidung: keine neue technische Gate-Klasse, keine zusätzliche
Hard-Failure-Anzahl und keine Redaction-/Replay-/Legalitätsregression. Der
Kandidat ist für die lokale Integration des eng begrenzten Draw-/Near-Tie-
Vertrags geeignet; die Baseline bleibt wegen der drei bekannten
Action-Limit-Spiele ausdrücklich `attention_required`.
