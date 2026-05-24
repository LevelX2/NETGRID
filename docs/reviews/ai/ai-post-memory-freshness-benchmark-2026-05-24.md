# AI Post-Memory/Freshness Benchmark 2026-05-24

## Kurzfazit

Nach den regel-/memory-nahen Fixes bleiben Safety-Gates für `current_candidate` sauber: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0` in allen runnable Slots. Die Full-Suite zeigt aber weiterhin kein klares Profil-Upgrade gegenüber `belief_ai_v1_4_2`.

Die jüngsten Fixes wirken überwiegend als Bewertungsfundament und Regression-Schutz. Trash-Budget-Signale sind in Smoke und Local Pair 1 sichtbar. Future-Effect-/Pump-Signale treten in dieser Suite praktisch nicht auf. R&D-Freshness erzeugt mehr erklärten R&D-Druck über Fresh-Top-Opportunities, aber `rndAccessRemovedTopCard` bleibt in der Breitsuite 0; der konkrete Fresh-after-steal/trash-Fix wird hier also vor allem durch fokussierte Tests abgedeckt.

## Konfiguration

- Quelle: temporärer Vitest-Harness gegen `runMatchProgressionBenchmarkSuite`, danach gelöscht.
- Profile: `basic_corp_ai`, `basic_runner_ai`, `belief_ai_v1_4_2`, `current_candidate`.
- Slots: Smoke, Snapshot Rig, Snapshot Pressure, Snapshot Holdout, Frozen Local Realistic Pair 1, Frozen Local Realistic Pair 2.
- Seeds: 9 (`ai-v143-tuning-001` bis `006`, `ai-v143-holdout-001` bis `003`).
- `maxActions`: 160.
- Pending: beide Real-Scene-Holdouts bleiben erwartungsgemäß pending.

## Candidate vs Baseline

| Slot              | ActionLimit Baseline | ActionLimit Candidate | Runner Steals B/C | Corp Scores B/C | Score/Steal B/C | Longest NoProgress B/C | Same Plan Repeat B/C |
| ----------------- | -------------------: | --------------------: | ----------------: | --------------: | --------------: | ---------------------: | -------------------: |
| Smoke             |                0.889 |                 0.778 |           18 / 14 |          7 / 10 |   2.778 / 2.667 |                32 / 32 |              67 / 53 |
| Snapshot Rig      |                0.333 |                 0.333 |           25 / 26 |         15 / 13 |   4.444 / 4.333 |                34 / 17 |              56 / 48 |
| Snapshot Pressure |                0.333 |                 0.111 |           27 / 28 |          12 / 9 |   4.333 / 4.111 |                39 / 21 |              53 / 46 |
| Snapshot Holdout  |                0.222 |                 0.444 |           31 / 29 |           3 / 3 |   3.778 / 3.556 |                21 / 25 |              66 / 75 |
| Local Pair 1      |                0.111 |                 0.222 |           12 / 11 |           4 / 4 |   1.778 / 1.667 |                30 / 29 |              53 / 50 |
| Local Pair 2      |                0.556 |                 0.444 |           21 / 24 |           8 / 7 |   3.222 / 3.444 |                24 / 24 |            111 / 101 |

## Safety

| Slot              | Candidate IllegalActions | Candidate ReplayFailures | Candidate TimeoutRate |
| ----------------- | -----------------------: | -----------------------: | --------------------: |
| Smoke             |                        0 |                        0 |                     0 |
| Snapshot Rig      |                        0 |                        0 |                     0 |
| Snapshot Pressure |                        0 |                        0 |                     0 |
| Snapshot Holdout  |                        0 |                        0 |                     0 |
| Local Pair 1      |                        0 |                        0 |                     0 |
| Local Pair 2      |                        0 |                        0 |                     0 |

## Trash Budget

| Slot              | Expensive Trash | Deferred by Budget | Dropped Below Reserve | Left Unable to Contest |
| ----------------- | --------------: | -----------------: | --------------------: | ---------------------: |
| Smoke             |               0 |                  4 |                     0 |                      0 |
| Snapshot Rig      |               0 |                  0 |                     0 |                      0 |
| Snapshot Pressure |               0 |                  0 |                     0 |                      0 |
| Snapshot Holdout  |               0 |                  0 |                     5 |                      5 |
| Local Pair 1      |               0 |                  3 |                     3 |                      3 |
| Local Pair 2      |               0 |                  0 |                     0 |                      0 |

Interpretation: Der Budget-Gate ist sichtbar, aber nicht breit. Smoke profitiert durch weniger Budget-Deferrals gegenüber Baseline (`19 -> 4`), Local Pair 1 zeigt weiterhin einige Reserve-/Contest-Kosten. Snapshot Holdout hat weiterhin problematische Trash-Reserve-Signale (`remoteTrashDroppedBelowReserve = 5`).

## Future-Effect / Pump

Alle abgefragten Candidate-Metriken sind in der Full-Suite 0:

- `futureEffectSubroutinesWithoutRemainingIce`
- `futureEffectBreaksSkippedNoRemainingIce`
- `futureEffectBreaksTakenWithoutRemainingIce`
- `pumpActionsThatCouldNotLeadToBreak`
- `pumpActionsThatDestroyedAccessReserve`

`breakSkippedToPreserveTrashReserve` ist sichtbar, aber nicht spezifisch für Tutor/Virizz: Smoke 62, Snapshot Rig 38, Snapshot Pressure 31, Snapshot Holdout 17, Local Pair 1 6, Local Pair 2 13.

Interpretation: Die Breitsuite enthält kaum Tutor-/Virizz-artige Repros. Der Fix ist primär durch fokussierte Tests abgesichert.

## R&D Freshness

| Slot              | R&D Runs B/C | Central Steals B/C | Central Steals/Run B/C | Fresh Opp B/C | Fresh Taken B/C | Stale Repeat Mistake C |
| ----------------- | -----------: | -----------------: | ---------------------: | ------------: | --------------: | ---------------------: |
| Smoke             |      40 / 43 |              4 / 5 |          0.051 / 0.051 |         4 / 4 |           0 / 0 |                      2 |
| Snapshot Rig      |      42 / 59 |            11 / 12 |          0.087 / 0.099 |       30 / 34 |           8 / 8 |                      1 |
| Snapshot Pressure |      53 / 45 |            13 / 13 |          0.129 / 0.140 |       15 / 26 |           3 / 6 |                      2 |
| Snapshot Holdout  |      35 / 39 |              5 / 8 |          0.059 / 0.083 |       13 / 24 |           3 / 6 |                      0 |
| Local Pair 1      |      31 / 34 |              6 / 4 |          0.071 / 0.040 |         8 / 7 |           2 / 2 |                      0 |
| Local Pair 2      |      38 / 37 |            14 / 14 |          0.133 / 0.143 |       27 / 29 |           7 / 8 |                      0 |

In allen Slots bleiben `rndAccessRemovedTopCard`, `rndTopFreshenedByRunnerAccess`, `rndKnownTopAdvancedAfterAccess`, `rndRepeatRunAfterTopRemoved` und `rndRepeatRunBoostedByFreshTop` bei 0. Das heißt: Die Full-Suite trifft offenbar kaum echte Top-Removed-R&D-Repeat-Situationen. Sichtbar ist eher die Stale-/Known-Top-Klassifikation und Fresh-Top-Opportunity-Zählung.

## Slot-Bewertung

- Smoke: Candidate verbessert ActionLimit und Corp Scores, verliert Runner Steals. Safety sauber.
- Snapshot Rig: ActionLimit stabil, NoProgress deutlich besser, Runner Steals leicht besser, Corp Scores leicht schlechter.
- Snapshot Pressure: klarer ActionLimit-/NoProgress-Gewinn, Runner Steals leicht besser, Corp Scores schlechter.
- Snapshot Holdout: Regressionssignal. ActionLimit und NoProgress schlechter; Corp Scores bleiben niedrig.
- Local Pair 1: weiter problematisch. ActionLimit schlechter als Baseline, Runner Steals leicht schlechter, Stagnation etwas besser.
- Local Pair 2: stabil bis leicht besser. ActionLimit und Runner Steals besser, Corp Scores leicht niedriger.

## Bewertung

1. Safety ist bewahrt.
2. Full-Suite-Progression verändert sich sichtbar, aber gemischt.
3. Regressionssignale liegen vor allem in Snapshot Holdout und Local Pair 1.
4. R&D-Freshness wirkt in der Suite nur teilweise; der neue Fresh-after-remove-Pfad wird dort nicht breit getroffen.
5. `current_candidate` ist weiterhin nicht klar besser als `belief_ai_v1_4_2`.

## Empfehlung

Kein weiterer enger Memory-Fix auf Basis dieser Suite. Der nächste sinnvolle Block ist eher `Strategic Line Variance / Macro-Commitment`: Die verbleibenden Regressions-/Stagnationssignale sehen nicht mehr nach einzelnen LegalAction-/Memory-Lücken aus, sondern nach fehlender Linienauswahl und Commit/Pivot-Qualität über mehrere eigene Entscheidungen.

Alternativ kann vor einem großen Strategieblock ein Release-/Merge-Review entscheiden, welche Infrastruktur- und Safety-Fixes sicher nach `main` gehören und welche Strategieteile experimentell bleiben.
