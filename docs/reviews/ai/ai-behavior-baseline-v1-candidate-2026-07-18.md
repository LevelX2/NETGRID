# AI Behavior Baseline v1

Status: attention_required
Git head: 637c62a09
Generated: 2026-07-18T07:08:06.640Z

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
| Advanced remote contest skip rate              | 0.888 |
| Plan conversion rate                           | 0.734 |
| Strategic no-progress repeats / 100 decisions  | 2.627 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 5.531 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1526 |             0.000 |                    0.859 |                0.855 |             0.917 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1552 |             0.000 |                    0.850 |                0.870 |             0.451 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1386 |             0.000 |                    0.800 |                0.848 |              1.01 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2829 |             0.000 |                    0.700 |                0.618 |              4.56 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      2480 |             0.000 |                    0.857 |                0.710 |             3.468 |               0 |      1 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2486 |             0.000 |                    0.955 |                0.669 |             2.896 |               0 |      2 |

## Outcome context

- Runner agenda points: 187
- Corp agenda points: 140
- Runner steals: 91
- Corp scores: 104
- Score or steal actions: 195
- Average actions: 204.317
- Average turns: 27.567

## Comparison

Comparable: yes
Baseline git head: 4dfe4b80a
Candidate git head: 637c62a09
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                   +0.004 |
| planConversionRate                            |                   -0.055 |
| strategicNoProgressRatePer100Decisions        |                   +0.116 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   +2.834 |
| averageActions                                |                  +15.834 |

## Reviewentscheidung

Der Kandidat ist gegen die Referenz auf `4dfe4b80a` formal vergleichbar, das
Hard Gate ist wegen drei Spielen am 480er-Aktionslimit aber nicht bestanden.
Die übrigen technischen Gates bleiben vollständig grün: keine illegalen
Aktionen, Replayfehler, Fallbacks, Timeouts, Runtimefehler, Hidden-Info-Funde
oder `no_legal_action_failure`; alle Traces sind redaction-safe.

Der Lauf wurde wegen paralleler Integrationen auf dem gemeinsam verwendeten
`main` in einem isolierten Detached-Worktree auf `637c62a09` ausgeführt. Damit
stimmen geladener Code und berichteter Kandidaten-Head überein. Spätere
`main`-Commits sind ausdrücklich nicht Teil dieser Evidence.

## Betroffene Slots und Seeds

| Slot                                           | Seed                         | Ergebnis                                 | Referenzstand                            |
| ---------------------------------------------- | ---------------------------- | ---------------------------------------- | ---------------------------------------- |
| `strategy_panel_net_damage_black_ice`          | `ai-behavior-baseline-v1-09` | 480 Aktionen, 58 Züge, Runner 4 : Korp 0 | kein Limitspiel in diesem Slot           |
| `strategy_panel_hybrid_score_punish_cheap_bag` | `ai-behavior-baseline-v1-02` | 480 Aktionen, 82 Züge, Runner 2 : Korp 3 | Referenzlimits lagen auf Seeds 03 und 05 |
| `strategy_panel_hybrid_score_punish_cheap_bag` | `ai-behavior-baseline-v1-07` | 480 Aktionen, 76 Züge, Runner 0 : Korp 2 | Referenzlimits lagen auf Seeds 03 und 05 |

Damit steigt die Zahl der Limitspiele gegenüber der Referenz von zwei auf
drei. Die beiden alten Hybrid-Limitseeds 03 und 05 enden im Kandidaten
regulär; die rote Klasse bleibt im Hybrid-Slot mit zwei anderen Seeds bestehen
und kommt im Net-Damage-Slot neu hinzu.

| Betroffener Slot    | Limits | Remote-Skip-Delta | Plan-Konversions-Delta | No-Progress-Delta / 100 | Findings-Delta / 100 | Delta Ø Aktionen |
| ------------------- | -----: | ----------------: | ---------------------: | ----------------------: | -------------------: | ---------------: |
| Net Damage          |  0 → 1 |            -0.010 |                 -0.098 |                  +0.278 |               +5.876 |          +94.400 |
| Hybrid Score/Punish |  2 → 2 |            -0.002 |                 -0.075 |                  +0.019 |               +3.503 |          -36.400 |

## Redigierte Trace-Diagnose

Die drei Limitspiele zeigen legale, replay-stabile Fortschrittsschleifen:

- Net-Damage-Seed 09 kippt ab Zug 54 in eine gegenseitige Blockade. Der Runner
  nimmt unter `runner.survival_defense` viermal pro Zug einen Basic Credit,
  obwohl seine Credits von 12 bis 20 steigen und neun actionable Alternativen
  vorhanden sind. Der legale Zentral-Run besitzt einen positiven Raw Score,
  wird aber wiederholt als `excluded_by_current_plan` verworfen. Die Korp nimmt
  gleichzeitig unter `corp.create_score_window` drei Credits pro Zug, obwohl
  `agenda_flood_exposure` markiert ist und beispielsweise bei State 467
  24 actionable Alternativen vorliegen; Installationen werden vom aktuellen
  Plan ausgeschlossen.
- Hybrid-Seed 02 wiederholt spätestens ab Zug 60 jeden Runnerzug vier Basic
  Credits unter `runner.opportunistic_central_run`. Im Schlussfenster steigen
  die Credits von 104 auf 108, während zwölf actionable Alternativen vorhanden
  sind. Der legale Zentral-Run hat Raw Score 1159, wird jedoch ebenfalls als
  Plan-Mismatch ausgeschlossen. Die Korp wechselt noch zwischen Economy,
  Draw und Installationen, erzeugt aber kein Spielende.
- Hybrid-Seed 07 kombiniert zwei Schleifen. Der Runner nimmt ab Zug 54 unter
  `runner.survival_defense` vier Credits pro Zug. Die Korp wiederholt auf
  `remote_2` ab Zug 59 dreimal je Zug eine kostenlose Credit-Fähigkeit und
  anschließend ein Advance für einen Credit. Der Zielfortschritt konvertiert
  trotz `corp.create_score_window`, `agenda_flood_exposure` und
  `economy_stall` nicht in einen Score oder ein anderes Spielende.

Die Diagnose rechtfertigt keine pauschale Gewichtsänderung. Sinnvolle
spielgleiche Checkpoints liegen an den letzten wiederholten Auswahlzuständen:
Net-Damage State 472, Hybrid-Seed 02 State 474 und Hybrid-Seed 07 State 474.
Eine spätere Remediation muss dort LegalActions, aktuelle Planbindung,
Alternativscores und sichtbaren Fortschritt gemeinsam sichern.

## Restrisiko

- Der aktuelle `main`-Stand lag bei der Abschlussprüfung bereits hinter
  `637c62a09` und ist mit diesem Lauf nicht bewertet.
- Verhaltensdeltas bleiben Diagnose-Evidence ohne kalibrierte
  Verschlechterungsschwellen. Besonders Fast Advance zeigt zusätzlich mehr
  Remote-Skips, No-Progress-Signale und durchschnittliche Aktionen, ohne ein
  eigenes Hard Gate auszulösen.
- Sieg- und Agenda-Punktwerte sind nur Outcome-Kontext und belegen weder
  Stärkegewinn noch Korrektheit.

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.
