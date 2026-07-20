# AI Behavior Baseline v1

Status: complete
Git head: 4fb5d7044
Generated: 2026-07-20T16:21:49.120Z

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
| Advanced remote contest skip rate              | 0.838 |
| Plan conversion rate                           | 0.700 |
| Strategic no-progress repeats / 100 decisions  | 3.025 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 5.855 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1461 |             0.000 |                    0.861 |                0.842 |             1.164 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1380 |             0.000 |                    0.750 |                0.795 |             1.957 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1464 |             0.000 |                    0.750 |                0.804 |             1.434 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2737 |             0.000 |                    0.667 |                0.564 |              4.64 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      2524 |             0.000 |                    0.778 |                0.698 |             2.971 |               0 |      0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2270 |             0.000 |                    0.887 |                0.656 |             4.009 |               0 |      0 |

## Outcome context

- Runner agenda points: 179
- Corp agenda points: 126
- Runner steals: 99
- Corp scores: 85
- Score or steal actions: 184
- Average actions: 197.267
- Average turns: 26.067

## Comparison

Comparable: yes
Baseline git head: de15e599f
Candidate git head: 4fb5d7044
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                   -0.041 |
| planConversionRate                            |                   -0.009 |
| strategicNoProgressRatePer100Decisions        |                   -0.018 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   -0.726 |
| averageActions                                |                   -8.116 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Semantische Abnahme

Der Kandidat schließt die sieben gesicherten Fehlstellen ohne Kartenname-
Sonderfall. R&D-Protocol-Aktionen besitzen jetzt vor der Auswahl eine konkrete
Run-Projektion; die früheren ungeprüften Aktivierungen aus Seed 01/196, 278,
347 und Seed 09/290 werden in den exakten Checkpoints verworfen, während
erreichbare Replacement-, Unknown-ICE- und Bypass-Runs zulässig bleiben. Das
Top-5-Wissen wird positionsgebunden fortgeschrieben: ein entfernender Access
nimmt nur die betroffene Karte heraus, der nächste Corp-Draw verschiebt die
Folgekarten und überführt ausschließlich die tatsächlich gezogene Karte in
die bekannte HQ-Menge.

Seed 02/181 konsumiert die ungescorte Black Ice Quality Assurance nicht mehr
als aktive Remote-Verteidigung. Seed 02/354 und 413 verwerfen unerreichbare
Scoreline-Projekte und wechseln auf noch aktivierbare Punish-Pfade. Das
Deadline-Gate erfasst außerdem nicht konvertierbare Agenda-Advancements und
kann durch den Remote-Advance-Override nicht umgangen werden.

Im betroffenen Net-Damage-Slot sinken die Entscheidungen von 2.547 auf 2.524,
die Findings von 318 auf 260, die Finding-Rate von 12,48 auf 10,30 und die
No-Progress-Rate von 3,18 auf 2,97 je 100 Entscheidungen. Die Remote-Contest-
Skip-Rate sinkt von 0,86 auf 0,78. Die Plan-Conversion geht leicht von 0,72
auf 0,70 zurück; daraus entsteht weder ein Hard Failure noch eine dominierte
Auswahl. Über alle Slots sinken Finding-Rate, No-Progress-Rate und mittlere
Aktionszahl; kein Safety-Gate verschlechtert sich.

Seed 09 endet im Kandidaten früher mit Corp-Sieg, der generische
`gameEndReason`-Classifier meldet dabei `unknown`. Replay, StateHash,
Runtime- und Redaction-Gates sind grün; dieser diagnostische Klassifierwert
ist daher kein Beleg für den Fix und wird durch die exakte Seed-09/290-
Regressionsevidence flankiert.

## Verifikation

- 421 AI-Testdateien mit 2.909 Tests grün;
- 202 Engine-Testdateien mit 1.758 Tests grün;
- vollständiger Workspace-Typecheck grün;
- Hint-Metadaten und AI-Source-Structure grün;
- 60 Spiele, 11.836 Entscheidungen, keine Illegal Actions, Replay-Failures,
  Action-Limits, Fallbacks, Timeouts, Runtimefehler, Hidden-Info-Findings oder
  Redaction-Verstöße.
