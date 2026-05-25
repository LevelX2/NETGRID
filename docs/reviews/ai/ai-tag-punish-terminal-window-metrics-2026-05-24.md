# AI Tag/Punish Terminal Window Metrics 2026-05-24

## Kurzfazit

Der Slice ändert keine Strategieentscheidung. Er ergänzt die Match-Progression-Summary um side-correcte Diagnosemetriken für Tag/Punish-Fenster aus Corp-Sicht.

Die neue 8-Slot-Auswertung zeigt: Local Pair 2 hat echte Punish-LegalAction-Fenster. Candidate erzeugt dort mehr Tag-Source- und Punish-Fenster als Baseline, nutzt sie aber nur selten terminal. Der Funnel bricht nicht primär bei Tag-Erzeugung oder LegalAction-Sichtbarkeit, sondern bei niedriger Punish-Take-Rate und bei Überschreibungen durch Economy/Score-Fortsetzung. Ein enger Fix-Slice ist damit plausibler, aber noch als Bewertungs-/Priorisierungsslice zu schneiden, nicht als neues Tag/Punish-Großmodell.

Safety blieb im Diagnosebenchmark sauber: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`.

## Neue Funnel-Metriken

Tag-State am Corp-Fenster:

- `runnerTaggedAtCorpDecision`
- `runnerTaggedAtCorpDecisionTurns`
- `runnerTaggedAtCorpDecisionActions`
- `runnerTagClearedBeforeCorpDecision`
- `runnerTagClearedSameRunnerTurn`
- `runnerTagWindowExpiredBeforeCorpTurn`
- `runnerTaggedAfterTraceDuringRun`
- `runnerTaggedAtEndOfRunnerTurn`
- `runnerTaggedAtStartOfCorpTurn`

Punish-LegalAction-Fenster:

- `corpPunishOpportunities`
- `corpPunishTaken`
- `corpPunishSkipped`
- `corpPunishTakeRate`
- `corpPunishOpportunityByKind` als flache Summary-Keys für Scorched-/Urban-/Punitive-/Closed-Accounts-/Power-Grid-/Datapool-/Resource-Trash-/Scored-Agenda-/Unknown-Klassen
- `corpPunishSkippedForEconomy`
- `corpPunishSkippedForProtection`
- `corpPunishSkippedForScore`
- `corpPunishSkippedForRemoteSafety`
- `corpPunishSkippedForDraw`
- `corpPunishSkippedForEndTurn`
- `corpPunishSkippedForUnknown`
- `corpPunishWindowExpiredBeforeAction`
- `corpPunishWindowExpiredBeforeCorpTurn`

Tagquellen:

- `corpTagSourceOpportunities`
- `corpTagSourceTaken`
- `corpTagSourceSkipped`
- `corpTraceTagOpportunities`
- `corpTraceTagTaken`
- `corpTraceTagSkipped`
- `corpTraceTagExpectedSuccess`
- `corpTraceTagSkippedForEconomy`
- `corpTraceTagSkippedForProtection`
- `corpTraceTagSkippedForScore`
- `corpTraceTagSkippedForRemoteSafety`
- `corpTagSourceConvertedToRunnerTagged`
- `corpTagSourceConvertedToPunishOpportunity`
- `corpTagSourceConvertedToPunishTaken`

Funnel:

- `corpTagPunishFunnelTagSourceOpportunity`
- `corpTagPunishFunnelTagSourceTaken`
- `corpTagPunishFunnelRunnerTagged`
- `corpTagPunishFunnelRunnerTaggedAtCorpDecision`
- `corpTagPunishFunnelPunishOpportunity`
- `corpTagPunishFunnelPunishTaken`
- `corpTagPunishFunnelTerminalDamageOrEconomicHit`
- `corpTagPunishFunnelFlatlineOrLock`

Die Metriken entstehen aus Simulation Summary, Corp-LegalActions, PlayerView und sichtbaren Action-Ergebnissen. Sie erweitern kein AIInput und leaken keine versteckte Runner-Hand oder Stack-Reihenfolge.

## Benchmark 8-Slot

Aktuelle Suite mit 9 Seeds, 8 runnable Slots, `belief_ai_v1_4_2` gegen `current_candidate`.

| Gesamt                                              |  Baseline | Candidate |
| --------------------------------------------------- | --------: | --------: |
| mittlere `ActionLimitRate`                          |     0.472 |     0.486 |
| `Runner Steals`                                     |       138 |       124 |
| `Corp Scores`                                       |        57 |        65 |
| `corpTagSourceOpportunities`                        |       178 |       176 |
| `corpTagSourceTaken`                                |       107 |       113 |
| `runnerTaggedAtCorpDecision`                        |       190 |       201 |
| `corpPunishOpportunities`                           |        58 |        58 |
| `corpPunishTaken`                                   |         5 |        13 |
| `illegalActions` / `replayFailures` / `timeoutRate` | 0 / 0 / 0 | 0 / 0 / 0 |

Guardrail-Metriken bleiben stabil:

- `corpAgendaInstalledInCheaplyContestableRemote = 0`
- `corpAdvanceInCheaplyContestableRemote = 0`
- `basicCreditTakenWhileBetterAgendaEconomyAvailable = 0`
- `politicalOverthrowSkippedForBasicCredit = 0`

## Local Pair 2

Slot: `local_realistic_pair_2` (`R&D Interface Dig` vs `Shadoe Tag & Bag`)

| Metrik                                           | Baseline | Candidate |  Delta |
| ------------------------------------------------ | -------: | --------: | -----: |
| `ActionLimitRate`                                |    0.444 |     0.667 | +0.223 |
| `Runner Steals`                                  |       26 |        20 |     -6 |
| `Corp Scores`                                    |        1 |         4 |     +3 |
| `corpTagSourceOpportunities`                     |       56 |        64 |     +8 |
| `corpTagSourceTaken`                             |       33 |        37 |     +4 |
| `corpTagSourceConvertedToRunnerTagged`           |       30 |        31 |     +1 |
| `runnerTaggedAtCorpDecision`                     |       56 |        61 |     +5 |
| `runnerTagClearedBeforeCorpDecision`             |       18 |        19 |     +1 |
| `corpPunishOpportunities`                        |       18 |        26 |     +8 |
| `corpPunishTaken`                                |        1 |         2 |     +1 |
| `corpPunishTakeRate`                             |    0.056 |     0.077 | +0.021 |
| `corpPunishSkippedForEconomy`                    |       17 |        17 |      0 |
| `corpPunishSkippedForScore`                      |        0 |         6 |     +6 |
| `corpTagPunishFunnelTerminalDamageOrEconomicHit` |        1 |         2 |     +1 |

Befund:

- Local Pair 2 hat echte Corp-Punish-LegalAction-Fenster.
- Tags bleiben oft bis zum Corp-Entscheidungsfenster stehen: Candidate `runnerTaggedAtCorpDecision = 61`.
- Runner entfernt weiterhin viele Tags vor dem nächsten Corp-Fenster: Candidate `runnerTagClearedBeforeCorpDecision = 19`.
- Candidate verbessert Tag-Erzeugung und Punish-Fensterzahl, aber die Take-Rate bleibt sehr niedrig.
- Die Skip-Gründe sind dominant Economy und Score-Fortsetzung, nicht Remote-Safety.
- Kein `FlatlineOrLock` wurde erreicht.

Interpretation: Das Problem ist nicht mehr nur "kein Tag" oder "keine LegalAction". Es ist ein Terminal-Conversion-/Priorisierungsproblem unter vorhandenen Tag/Punish-Fenstern.

## Snapshot Holdout

Slot: `snapshot_holdout_origin_pressure_vs_tag_ops`

| Metrik                                           | Baseline | Candidate |  Delta |
| ------------------------------------------------ | -------: | --------: | -----: |
| `ActionLimitRate`                                |    0.556 |     0.556 |      0 |
| `Runner Steals`                                  |       19 |        18 |     -1 |
| `Corp Scores`                                    |        9 |         8 |     -1 |
| `corpTagSourceOpportunities`                     |       33 |        36 |     +3 |
| `corpTagSourceTaken`                             |       33 |        34 |     +1 |
| `runnerTaggedAtCorpDecision`                     |       81 |        71 |    -10 |
| `corpPunishOpportunities`                        |       30 |        15 |    -15 |
| `corpPunishTaken`                                |        1 |         7 |     +6 |
| `corpPunishTakeRate`                             |    0.033 |     0.467 | +0.434 |
| `corpPunishSkippedForScore`                      |       22 |         2 |    -20 |
| `corpTagPunishFunnelTerminalDamageOrEconomicHit` |        0 |         2 |     +2 |

Befund:

- Candidate nutzt echte Punish-Fenster hier deutlich häufiger.
- Weniger tagged-at-Corp-Decision-Fenster und weniger Opportunities führen trotzdem zu deutlich mehr `corpPunishTaken`.
- Das bestätigt, dass Tag/Punish grundsätzlich funktioniert und die Local-Pair-2-Schwäche nicht einfach eine LegalAction-/Klassifikationslücke ist.

## Real Scene Pair 2

Slot: `real_scene_pair_2` (`Stealth Interface Starter` vs `Manhunt Pressure Bureau`)

| Metrik                                           | Baseline | Candidate |  Delta |
| ------------------------------------------------ | -------: | --------: | -----: |
| `ActionLimitRate`                                |    1.000 |     0.889 | -0.111 |
| `Runner Steals`                                  |        7 |         8 |     +1 |
| `Corp Scores`                                    |        7 |         6 |     -1 |
| `corpTagSourceOpportunities`                     |       89 |        76 |    -13 |
| `corpTagSourceTaken`                             |       41 |        42 |     +1 |
| `corpTagSourceConvertedToRunnerTagged`           |       35 |        40 |     +5 |
| `runnerTaggedAtCorpDecision`                     |       43 |        59 |    +16 |
| `corpPunishOpportunities`                        |        8 |        14 |     +6 |
| `corpPunishTaken`                                |        2 |         3 |     +1 |
| `corpPunishTakeRate`                             |    0.250 |     0.214 | -0.036 |
| `corpPunishSkippedForEconomy`                    |        2 |         6 |     +4 |
| `corpPunishSkippedForScore`                      |        3 |         3 |      0 |
| `corpTagPunishFunnelTerminalDamageOrEconomicHit` |        2 |         3 |     +1 |

Befund:

- Real Scene Pair 2 zeigt echte Tag/Punish-Fenster und Candidate nimmt etwas mehr davon.
- Die ActionLimitRate verbessert sich trotz niedriger Take-Rate.
- Wie in Local Pair 2 ist Economy ein relevanter Skip-Grund, aber hier beschädigt es die Progression weniger stark.

## Diagnoseantworten

1. Local Pair 2 ist mit fehlender Terminalkonversion verbunden: Ja, aber nicht wegen fehlender LegalActions.
2. Echte Punish-Fenster existieren: Ja, Candidate `corpPunishOpportunities = 26`.
3. Tags werden teilweise vor dem Corp-Turn entfernt: Ja, Candidate `runnerTagClearedBeforeCorpDecision = 19`.
4. Echte Punish-Fenster werden überwiegend übersprungen: Candidate `corpPunishTaken = 2` von `26`.
5. Snapshot Holdout zeigt, dass Candidate Punish-Fenster nutzen kann: `corpPunishTaken = 7` von `15`.
6. Real Scene Pair 2 zeigt ein ähnliches, aber weniger schädliches Muster: mehr tagged-at-Corp-Decision und Punish-Fenster, aber niedrige Take-Rate.

## Empfehlung

Ein enger Fix-Slice ist gerechtfertigt, aber nur als Tag/Punish Terminal Prioritization Slice:

- Punish-Fenster gegen Economy/Score/Protection abwägen.
- Nur legale, sichtbare Punish-Actions bewerten.
- Keine pauschale Tag-/Punish-Gewichtung.
- Kein Opponent Model.
- Keine Holdout-spezifische Regel.
- Guardrails: Score-now, echte Remote-Safety, Cheap-Remote-Safety und Scored-Agenda-Ability-Fix bleiben vorrangig.

Kein Fix sollte allein aus Local Pair 2 entstehen. Der generische Repro-Korridor ist: `runnerTaggedAtCorpDecision > 0`, `corpPunishOpportunity = true`, Punish wird für Economy/Score übersprungen, ohne dass daraus terminaler Schaden, Lock oder Score-Fortschritt entsteht.
