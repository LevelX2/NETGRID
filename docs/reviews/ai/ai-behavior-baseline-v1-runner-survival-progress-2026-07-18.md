# AI Behavior Baseline v1

Status: attention_required
Git head: d5199cdb0
Generated: 2026-07-18T12:36:59.905Z

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

| Metric                | Value |
| --------------------- | ----: |
| illegalActions        |     0 |
| replayFailures        |     0 |
| actionLimitGames      |     3 |
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
| Advanced remote contest skip rate              | 0.867 |
| Plan conversion rate                           | 0.716 |
| Strategic no-progress repeats / 100 decisions  |  2.92 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 7.014 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1613 |             0.000 |                    0.841 |                0.836 |             1.178 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1631 |             0.000 |                    0.875 |                0.817 |             1.471 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1346 |             0.000 |                    0.923 |                0.809 |              1.56 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2893 |             0.000 |                    0.700 |                0.603 |             4.632 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      2481 |             0.000 |                    0.936 |                0.734 |             3.023 |               0 |      1 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2740 |             0.000 |                    0.840 |                0.630 |             3.577 |               0 |      2 |

## Outcome context

- Runner agenda points: 207
- Corp agenda points: 140
- Runner steals: 104
- Corp scores: 90
- Score or steal actions: 194
- Average actions: 211.733
- Average turns: 27.55

## Comparison

Comparable: yes
Baseline git head: 4a9e347f4
Candidate git head: d5199cdb0
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                    -0.01 |
| planConversionRate                            |                   -0.071 |
| strategicNoProgressRatePer100Decisions        |                   +0.677 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   +3.039 |
| averageActions                                |                      +26 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Review-Urteil

Der Runner-Survival-Progress-Vertrag beseitigt die bestätigte
Survival-Credit-Plansperre auch auf dem mit aktuellem `main` abgeglichenen
Commit `d5199cdb0`. Der Standardlauf ist gegenüber der Referenz `4a9e347f4`
technisch vergleichbar. Illegal Actions, Replayfehler, Fallbacks, Timeouts,
Runtimefehler, Hidden-Info-Funde und No-LegalAction-Fehler bleiben null;
Redaction bleibt sicher.

Gegenüber dem unmittelbar vor der Umsetzung geprüften Stand `ce65b4aae`
ändert sich die bestätigte Fehlerklasse wie folgt:

| Folge         | Vorherige Survival-Credits | Integrierte Survival-Credits | Integriertes Ergebnis                              |
| ------------- | -------------------------: | ---------------------------: | -------------------------------------------------- |
| Net-Damage-08 |                         45 |                            0 | reguläres Corp-Spielende nach 179 Aktionen         |
| Net-Damage-09 |                         30 |       1 konkret finanzierend | Corp-Flatline nach 416 Aktionen statt Action-Limit |
| Hybrid-04     |                         17 |                            0 | reguläres Corp-Spielende nach 386 Aktionen         |
| Hybrid-07     |                         74 |                            0 | reguläres Corp-Spielende nach 217 Aktionen         |

Die einzige verbleibende Survival-Credit-Aktion in C-09 erhöht die Credits von
3 auf 4 bei einem sichtbaren Reaktionsziel von 4. Sie schließt damit eine
konkrete Reserve-Lücke und erfüllt exakt den neuen Fortschrittsvertrag. Die
frühere unbeschränkte Folge bis 34 Credits ist verschwunden. Echte
Survival-Draws bleiben zulässig; der neue
`runner_survival_no_progress_loop`-Detektor meldet im integrierten Panel null
Funde.

## Vergleich zum Vor-Fix-Stand

| Metrik                            | `ce65b4aae` | `d5199cdb0` |  Delta |
| --------------------------------- | ----------: | ----------: | -----: |
| Entscheidungen                    |      12.900 |      12.704 |   -196 |
| durchschnittliche Aktionen        |      215,00 |      211,73 |  -3,27 |
| durchschnittliche Züge            |       28,72 |       27,55 |  -1,17 |
| Plan-Konversion                   |       0,730 |       0,720 | -0,010 |
| No-Progress / 100 Entscheidungen  |       2,566 |       2,920 | +0,354 |
| Finding-Rate / 100 Entscheidungen |       7,202 |       7,014 | -0,188 |
| Action-Limit-Spiele               |           3 |           3 |      0 |

Die Plan-Konversion und normalisierte No-Progress-Rate werden durch die
parallel integrierten Deckstrategie-Änderungen mitbeeinflusst und sind kein
isolierter Effekt dieses Pakets. Klar dominierte Planauswahlen bleiben bei
null. Die Freigabe stützt sich deshalb auf den konkreten Survival-Vertrag und
die tracebasierte Gegenprüfung, nicht auf eine pauschale Verbesserung jeder
Aggregatmetrik.

## Verbleibende Action-Limits

Das globale Hard Gate bleibt wegen drei von der Survival-Credit-Fehlerklasse
getrennten Seeds rot:

- Net-Damage-07: 480 Aktionen, 63 Züge;
- Hybrid-01: 480 Aktionen, 64 Züge;
- Hybrid-05: 480 Aktionen, 57 Züge.

Alle drei Folgen enthalten null `runner.survival_defense`-Credit-Aktionen.
Net-Damage-07 und Hybrid-05 waren bereits vor dieser Umsetzung am Limit;
Hybrid-01 tritt erst im integrierten Stand auf und benötigt eine eigenständige
Ursachenanalyse. Keiner der drei Seeds widerlegt den hier abgeschlossenen
Survival-Fortschrittsvertrag.

## Verifikation

- 71 fokussierte Survival-/Memory-/Ranking-/Mining-Tests auf dem integrierten
  Stand: grün;
- drei AI-Testshards: 396 Testdateien, 2.817 Tests, vollständig grün;
- AI-Typecheck, Formatprüfung und `git diff --check`: grün;
- alle fachlichen `check:ai`-Teilgates grün; der Sammellauf stoppt nur an den
  vier bereits auf `main` vorhandenen Source-Structure-Pfaden und fügt keinen
  neuen Pfad hinzu;
- vollständiger AI-Behavior-Benchmark: 60 Spiele, 12.704 Entscheidungen,
  Replay und Redaction grün, drei klassifizierte unabhängige Action-Limits.

Freigabe: Die Runner-Survival-Progress-Remediation ist fachlich und technisch
zur lokalen Integration freigegeben. Die drei unabhängigen Action-Limit-Seeds
bleiben als getrennte Analysefälle offen.
