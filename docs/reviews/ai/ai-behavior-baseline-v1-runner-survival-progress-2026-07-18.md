# AI Behavior Baseline v1

Status: attention_required
Git head: 2c2b7ea31
Generated: 2026-07-18T12:03:18.064Z

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
| Advanced remote contest skip rate              | 0.874 |
| Plan conversion rate                           | 0.732 |
| Strategic no-progress repeats / 100 decisions  | 2.587 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 7.667 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1520 |             0.000 |                    0.867 |                0.858 |             0.987 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1550 |             0.000 |                    0.850 |                0.872 |             0.452 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1402 |             0.000 |                    0.833 |                0.833 |              1.07 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2819 |             0.000 |                    0.667 |                0.610 |             4.576 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      2828 |             0.000 |                    0.926 |                0.736 |               2.9 |               0 |      1 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2676 |             0.000 |                    0.892 |                0.642 |             3.102 |               0 |      1 |

## Outcome context

- Runner agenda points: 185
- Corp agenda points: 148
- Runner steals: 91
- Corp scores: 103
- Score or steal actions: 194
- Average actions: 213.25
- Average turns: 28.333

## Comparison

Comparable: yes
Baseline git head: 4a9e347f4
Candidate git head: 2c2b7ea31
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                   -0.003 |
| planConversionRate                            |                   -0.055 |
| strategicNoProgressRatePer100Decisions        |                   +0.344 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   +3.692 |
| averageActions                                |                  +27.517 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Review-Urteil

Der Runner-Survival-Progress-Vertrag beseitigt die bestätigte
Survival-Credit-Plansperre. Der commit-reine Standardlauf auf `2c2b7ea31`
ist gegenüber der Referenz `4a9e347f4` technisch vergleichbar. Illegal
Actions, Replayfehler, Fallbacks, Timeouts, Runtimefehler, Hidden-Info-Funde
und No-LegalAction-Fehler bleiben null; Redaction bleibt sicher.

Gegenüber dem unmittelbar vor der Umsetzung geprüften Stand `ce65b4aae`
ändert sich die bestätigte Fehlerklasse wie folgt:

| Folge         | Vorherige Survival-Credits | Aktuelle Survival-Credits | Survival-Draws vorher/nachher | Ergebnis                                             |
| ------------- | -------------------------: | ------------------------: | ----------------------------: | ---------------------------------------------------- |
| Net-Damage-08 |                         45 |                         0 |                       13 / 13 | reguläres Runner-Spielende bleibt erhalten           |
| Net-Damage-09 |                         30 |                         0 |                       13 / 13 | Action-Limit wird zu Corp-Flatline nach 421 Aktionen |
| Hybrid-04     |                         17 |                         0 |                         6 / 6 | reguläres Corp-Spielende, 346 auf 292 Aktionen       |
| Hybrid-07     |                         74 |                         0 |                         9 / 9 | reguläres Runner-Spielende, 429 auf 406 Aktionen     |

C-09 stapelt damit nicht mehr Credits von 12 bis 34 unter
`runner.survival_defense`. Oberhalb der konkreten Reaktionsreserve gibt der
Survival-Plan die Arbitration frei; im Trace werden Credits anschließend für
Runs und Trash-Zahlungen eingesetzt. Die 13 echten Handaufbau-Aktionen bleiben
als Survival-Fortschritt bestehen. Der neue
`runner_survival_no_progress_loop`-Detektor meldet im Kandidatenpanel null
Funde. Das ist hier das erwartete Ergebnis: Die frühere Schleife wird durch
den Controller verhindert und nicht nur nachträglich markiert.

## Vergleich zum Vor-Fix-Stand

| Metrik                           | `ce65b4aae` | `2c2b7ea31` |  Delta |
| -------------------------------- | ----------: | ----------: | -----: |
| Entscheidungen                   |      12.900 |      12.795 |   -105 |
| durchschnittliche Aktionen       |      215,00 |      213,25 |  -1,75 |
| durchschnittliche Züge           |       28,72 |       28,33 |  -0,38 |
| Plan-Konversion                  |       0,730 |       0,732 | +0,002 |
| No-Progress / 100 Entscheidungen |       2,566 |       2,587 | +0,021 |
| Action-Limit-Spiele              |           3 |           2 |     -1 |

Die leicht höhere normalisierte No-Progress- und Finding-Rate ist kein neuer
Hard-Gate-Fehler. Sie entsteht bei weniger Entscheidungen und schärferer
Diagnostik; klar dominierte Planauswahlen bleiben bei null. Die Umsetzung
beansprucht daher keine allgemeine Verbesserung aller Verhaltensmetriken,
sondern die nachgewiesene Beseitigung der Survival-Credit-Fehlerklasse.

## Verbleibende Grenzen

Das globale Hard Gate bleibt wegen zwei unveränderten, unabhängigen
Action-Limit-Seeds rot:

- Net-Damage-07: 480 Aktionen, 63 Züge;
- Hybrid-05: 480 Aktionen, 52 Züge.

Beide Seeds erreichten bereits vor dieser Umsetzung dasselbe Limit und
enthalten keine `runner.survival_defense`-Credit-Aktion. Sie sind daher kein
Gegenbeleg zum abgeschlossenen Survival-Vertrag und bleiben eigenständige
Analysepakete.

## Verifikation

- drei AI-Testshards: 392 Testdateien, 2.773 Tests, vollständig grün;
- fokussierte Survival-Plan-/Ranking-Regressionen: 4 Tests grün;
- AI-Typecheck, Formatprüfung und `git diff --check`: grün;
- `check:ai` erreicht weiterhin ausschließlich die vier bereits auf aktuellem
  `main` reproduzierbaren Source-Structure-Pfade; dieses Paket fügt keinen
  weiteren Strukturverstoß hinzu;
- vollständiger AI-Behavior-Benchmark: 60 Spiele, 12.795 Entscheidungen,
  Replay und Redaction grün, ausschließlich zwei klassifizierte bestehende
  Action-Limits.

Freigabe: Die Runner-Survival-Progress-Remediation ist fachlich und technisch
zur lokalen Integration freigegeben. Die beiden unabhängigen Action-Limits
bleiben außerhalb dieses Pakets offen.
