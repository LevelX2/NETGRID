# AI Behavior Baseline v1

Status: complete
Git head: fb1569057
Generated: 2026-07-22T16:18:06.677Z

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
| Advanced remote contest skip rate              | 0.818 |
| Plan conversion rate                           | 0.710 |
| Strategic no-progress repeats / 100 decisions  | 2.826 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 3.025 |
| Action-capacity use rate                       | 0.085 |
| Action-capacity plan conversion rate           | 0.911 |
| Action-capacity expiration rate                | 0.022 |
| Action-capacity misconversion rate             | 0.000 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1861 |             0.000 |                    0.821 |                0.879 |             0.699 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1787 |             0.000 |                    0.900 |                0.751 |             2.238 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1914 |             0.000 |                    0.852 |                0.802 |             1.829 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2721 |             0.000 |                    0.667 |                0.561 |             5.145 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |       858 |               n/a |                      n/a |                0.615 |             3.147 |               0 |      0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      1899 |             0.000 |                    0.778 |                0.683 |             3.002 |               0 |      0 |

## Outcome context

- Runner agenda points: 180
- Corp agenda points: 113
- Runner steals: 94
- Corp scores: 78
- Score or steal actions: 172
- Action-capacity opportunities: 530
- Action-capacity uses: 45
- Action-capacity plan conversions: 41
- Action-capacity follow-up conversions: 45
- Action-capacity expired uses: 1
- Action-capacity misconversions: 0
- Average actions: 184
- Average turns: 24.15

## Comparison

Comparable: yes
Baseline git head: c6e1d4d72
Candidate git head: fb1569057
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                    -0.02 |
| planConversionRate                            |                    +0.01 |
| strategicNoProgressRatePer100Decisions        |                   -0.199 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                    -2.83 |
| averageActions                                |                  -13.267 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Review: Aktionskapazität und Tempo-Routen

Der Lauf wurde im P7-Arbeitsbaum auf Basis von `fb1569057` einschließlich der
noch nicht committeden P7-Korrekturen ausgeführt. Der P7-Abschlusscommit
bindet exakt diesen geprüften Code- und Dokumentstand.

Die neue Aktionskapazitätsdiagnostik meldet 530 Gelegenheiten und 45
tatsächliche Nutzungen. 41 Nutzungen waren bereits an einen Planbeitrag
gebunden; alle 45 wurden im selben Zug tatsächlich konvertiert. Die
Fehlkonversionsrate beträgt damit 0.000. Selbstfinanzierende Quellen zählen
ihre Quellaktion als unmittelbare Umwandlung und benötigen keine künstliche
zweite Hauptaktion, um als produktiv zu gelten.

Ein erster Prüflauf hatte sieben vermeintliche Fehlkonversionen gezeigt. Vier
davon waren selbstfinanzierende Runs und damit Messartefakte. Drei waren echte
Valu-Pak-Leerläufe, bei denen der Runner fünf programminstallationsgebundene
Aktionen erzeugte und danach den Zug beendete. Die allgemeine Korrektur
entfernt spekulativen Rohwert für eingeschränkte Bursts ohne kompatiblen
Demand oder Planbeitrag und lässt einen allgemeinen Handkartenplan eine
solche Quelle nicht gegen eine positive Alternative erzwingen. Der gezielte
Reproduktionsslot und der anschließende vollständige Lauf enthalten keinen
Valu-Pak-Leerlauf mehr.

Der einzige verbliebene Verfall ist keine Fehlkonversion: In einem bereits
terminal verlorenen Corp-Zug mit leerem R&D wird eine uneingeschränkte Quelle
noch in einen Remote-Aufbau umgewandelt; zwei Restaktionen verfallen, bevor
der Runner den Zug zum sicheren Deckout beendet. Dieser isolierte
Endzustand rechtfertigt keine globale Abwertung produktiver uneingeschränkter
Quellen.

Gegen die formale maschinenlesbare Referenz `c6e1d4d72` bleiben alle Hard
Gates grün. Die Remote-Contest-Skiprate sinkt um 0.020, die Plan-Konversion
steigt um 0.010, No-progress sinkt um 0.199 je 100 Entscheidungen und die
durchschnittliche Aktionszahl sinkt um 13.267. Verpasste Scorefenster und
klar dominierte Planwahlen bleiben bei null.

Gegen den unmittelbar vorherigen Economy-Abschlussstand `b3a59226f` ist die
Remote-Contest-Skiprate um 0.041 niedriger. Plan-Konversion liegt um 0.011
niedriger, No-progress um 0.097 je 100 Entscheidungen höher, die Findingrate
um 0.087 niedriger und die durchschnittliche Aktionszahl um 1.383 höher.
Diese kleinen deckübergreifenden Verschiebungen sind Beobachtungsevidence;
Siegpunkte bleiben ausdrücklich kein Abnahmegate.

Ergebnis: Der Rollout ist verhaltensbezogen akzeptiert. Zusätzliche Aktionen
werden aus dem wirklichen PlayerView-Bestand, einer typisierten Projektion,
kompatiblen Demands und begrenzten Routen bewertet. Nicht konvertierbare
eingeschränkte Bursts werden nicht pauschal bevorzugt, während garantierte
Score- und Folgeaktionsrouten ihren Wert behalten.
