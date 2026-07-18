# AI Behavior Baseline v1

Status: attention_required
Git head: 384c5bdd8
Generated: 2026-07-18T08:08:35.274Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: action_limit_games:2

| Metric                | Value |
| --------------------- | ----: |
| illegalActions        |     0 |
| replayFailures        |     0 |
| actionLimitGames      |     2 |
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
| Advanced remote contest skip rate              | 0.845 |
| Plan conversion rate                           | 0.732 |
| Strategic no-progress repeats / 100 decisions  |  2.59 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 5.557 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1526 |             0.000 |                    0.859 |                0.855 |             0.917 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1552 |             0.000 |                    0.850 |                0.870 |             0.451 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1386 |             0.000 |                    0.800 |                0.848 |              1.01 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2829 |             0.000 |                    0.700 |                0.619 |              4.56 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      2480 |             0.000 |                    0.857 |                0.710 |             3.468 |               0 |      1 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2428 |             0.000 |                    0.853 |                0.651 |             2.718 |               0 |      1 |

## Outcome context

- Runner agenda points: 190
- Corp agenda points: 143
- Runner steals: 92
- Corp scores: 105
- Score or steal actions: 197
- Average actions: 203.35
- Average turns: 27.5

## Comparison

Comparable: yes
Baseline git head: 637c62a09
Candidate git head: 384c5bdd8
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                   -0.043 |
| planConversionRate                            |                   -0.002 |
| strategicNoProgressRatePer100Decisions        |                   -0.037 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   +0.026 |
| averageActions                                |                   -0.967 |

## Reviewentscheidung

Der Kandidat ist gegenüber dem Referenzlauf auf `637c62a09` vollständig
vergleichbar. Der Hint-Umbau erzeugt keine illegalen Aktionen, Replayfehler,
Fallbacks, Timeouts, Runtimefehler, Hidden-Info-Funde oder
`no_legal_action_failure`; alle Traces sind redaction-safe. Das Hard Gate
bleibt ausschließlich wegen zwei Spielen am 480er-Aktionslimit rot.

Diese beiden roten Spiele sind gegenüber der Referenz unverändert: Net Damage
Seed 09 endet erneut nach 480 Aktionen und 58 Zügen mit StateHash
`fnv1a:2ee9547f`; Hybrid Score/Punish Seed 02 erneut nach 480 Aktionen und
82 Zügen mit StateHash `fnv1a:f4d7cbb0`. Damit sind beide Limitfälle
reproduzierbarer Bestand und nicht durch den Kartenhint-Diff entstanden.
Hybrid Seed 07 erreicht dagegen nicht mehr das Limit, sondern endet nach 451
Aktionen durch leeres Korp-R&D; die Zahl der Limitspiele sinkt dadurch von
drei auf zwei.

Die Verhaltensindikatoren liefern keinen Regressionshinweis: ausgelassene
Advanced-Remote-Contests sinken um 0,043, strategische No-Progress-
Wiederholungen um 0,037 je 100 Entscheidungen und die durchschnittliche
Spiellänge um 0,967 Aktionen. Die Plan-Konversionsrate sinkt geringfügig um
0,002 und die Finding-Rate steigt um 0,026 je 100 Entscheidungen; beide
Deltas bleiben ohne kalibrierte Schwelle Beobachtungsevidence, nicht
isolierter Fehlernachweis.

## Ausführungsabgrenzung

Der Vergleich lief in einem isolierten Prüf-Worktree auf dem letzten
lauffähigen Referenz-Head `637c62a09` plus den sechs Hint-Paketcommits; daraus
entstand Kandidaten-Head `384c5bdd8`. Der danach auf `main` fortgeschrittene
Engine-Architekturstand scheiterte zum ersten Laufzeitpunkt bereits beim
Modulstart und war deshalb keine zulässige Vergleichsbasis. Er wird getrennt
über Build-, Typecheck- und Testsuite-Gates des final synchronisierten
Arbeitsbranches geprüft. Die Baseline belegt ausschließlich die
Verhaltenswirkung des Hint-Umbaus.

## Restrisiko

- Die zwei bekannten Aktionslimit-Schleifen bleiben offen und verhindern ein
  vollständig grünes Hard Gate, sind aber bitgenau beziehungsweise per
  StateHash gegen die Referenz reproduziert.
- Die kleine Verschlechterung der Plan-Konversion und der Finding-Rate ist
  mangels kalibrierter Schwelle nicht als Regression klassifiziert.
- Spätere Engine-Architekturcommits sind nicht Teil dieses Selfplay-Vergleichs
  und werden nur durch die abschließenden Repository-Gates abgedeckt.

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.
