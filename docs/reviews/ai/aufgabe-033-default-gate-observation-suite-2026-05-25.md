# Aufgabe 033 - AI: Default-Gate Observation Suite nach Readiness-Review

## Kurzfazit

Technische Empfehlung: `observe_more`.

Die Observation bestätigt Aufgabe 032: `current_candidate` bleibt safety- und guardrail-stabil und ist global besser als `belief_ai_v1_4_2` bei Corp Scores und Runner Steals. Für Default ist der Stand aber weiter nicht sauber genug, weil Snapshot Holdout, Local Pair 2, Economy-before-score und offene Runner-Setup-FixGates Warnungen bleiben.

Readiness bleibt damit:

- Merge: `merge_ready_with_documented_risk`
- Profile-gated: `profile_gated_ready_with_risks`
- Default: `default_not_ready_observe_more`

## Bezug zu Aufgabe 032

Aufgabe 032 hatte nach den Fixes aus Aufgaben 025 bis 031 bereits einen technischen Review erstellt. Die wichtigsten Restrisiken waren:

- Economy-before-score: 86 taken, 44 repeated within 3, 71 not converted within 3.
- Snapshot Holdout: weniger Corp Scores und mehr Runner Steals.
- Local Pair 2: Score-/Steal-Bilanz verbessert, aber ActionLimit-Warnsignal.
- Runner Setup: Search/Recovery- und Memory-FixGates aus Aufgabe 027/028 weiter offen.

Aufgabe 033 definiert daraus keine neue Heuristik, sondern eine wiederholbare Default-Gate-Beobachtung mit Pass-/Warn-/Fail-Kriterien.

## Suite-Setup

Observation-Lauf:

- `runMatchProgressionBenchmarkSuite`
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- `includeHoldout: true`
- `maxActions: 160`
- 8 runnable Slots
- 9 Seeds pro Slot
- temporärer Vitest-Harness, nach Auswertung gelöscht

Die Suite wurde als einzelner deterministischer Beobachtungspunkt ausgewertet. Das reicht für ein Gate-Signal, aber nicht für eine statistische Default-Freigabe.

Der maschinenlesbare Report liegt in `docs/reviews/ai/aufgabe-033-default-gate-observation-suite-report-2026-05-25.json`.

## Pass-/Warn-/Fail-Kriterien

| Kategorie            | PASS                                                                             | WARN                                                  | FAIL                                                     |
| -------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Safety               | `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`                    | nicht genutzt                                         | irgendein Wert > 0                                       |
| Cheap Remote         | Agenda-/Advance-in-cheap-remote 0/0                                              | nicht genutzt                                         | einer der Werte > 0                                      |
| Known No-Access Runs | `runnerRunStartedAgainstKnownUnpayableFullPath = 0`                              | alte breite unaffordable-path-Metrik bleibt > 0       | neue Full-Path-Metrik > 0                                |
| ICE Ordering         | `corpMultiIceInstallOrderFutureEffectDead = 0`                                   | einzelne Dead-Effect-Fälle ohne Multi-ICE-Reihenfolge | Multi-ICE-Dead-Order > 0 oder häufig dead Ball-and-Chain |
| Progression          | Corp Scores >= Baseline, Runner Steals <= Baseline, ActionLimit nicht schlechter | globale Verbesserung mit Slot-Warnungen               | deutlich schlechtere Scores/Steals plus ActionLimit      |
| Economy-before-score | repeated/not-converted moderat oder sinkend                                      | hoch, aber ohne harte Safety-/Steal-Regression        | deutlicher Anstieg mit Steal-/ActionLimit-Korrelation    |
| Tag/Punish           | normalized unknown 0, FixGate suspicious 0                                       | viele Multi-Payoff-Fenster, aber taken                | unknown/suspicious kehren zurück                         |
| Runner Setup         | kein starker Anstieg der FixGates                                                | Search/Recovery-/Memory-FixGates bleiben sichtbar     | klarer Anstieg plus ActionLimit/NoProgress-Signal        |

## Benchmark-Ergebnisse

### Global

| Metrik                | Baseline | Candidate | Gate |
| --------------------- | -------: | --------: | ---- |
| Games                 |       72 |        72 | -    |
| ActionLimitRate       |    0.347 |     0.347 | warn |
| Corp Scores           |       52 |        61 | pass |
| Runner Steals         |      132 |       118 | pass |
| Score+Steal total     |      184 |       179 | info |
| Score/Steal pro Match |    2.556 |     2.486 | info |
| illegalActions        |        0 |         0 | pass |
| replayFailures        |        0 |         0 | pass |
| timeoutRate           |        0 |         0 | pass |

Global ist Candidate weiter besser: +9 Corp Scores, -14 Runner Steals, gleiche ActionLimitRate. Das reicht für profile-gated Beobachtung, aber nicht für Default, weil mehrere Holdout-/Slot-Warnungen bleiben.

### Slots

| Slot              | Corp Scores B/C | Runner Steals B/C | ActionLimit B/C | Gate | Befund                                                       |
| ----------------- | --------------: | ----------------: | --------------: | ---- | ------------------------------------------------------------ |
| Smoke             |          7 / 10 |           14 / 15 |   0.667 / 0.667 | warn | Scores steigen, Runner Steals leicht auch, ActionLimit hoch. |
| Snapshot Rig      |         10 / 11 |           22 / 17 |   0.222 / 0.111 | pass | klar positiv.                                                |
| Snapshot Pressure |         10 / 13 |           27 / 22 |   0.222 / 0.333 | warn | Score/Steal positiv, ActionLimit leicht schlechter.          |
| Snapshot Holdout  |           9 / 6 |           19 / 21 |   0.556 / 0.556 | warn | wichtigster negativer Holdout.                               |
| Local Pair 1      |           2 / 2 |            10 / 8 |           0 / 0 | warn | stabil bis leicht positiv, Setup-Warnungen bleiben.          |
| Local Pair 2      |           0 / 3 |           19 / 15 |       0 / 0.222 | warn | Scores/Steals besser, aber ActionLimit und repeated Economy. |
| Real Scene 1      |          8 / 10 |           15 / 14 |   0.556 / 0.556 | warn | leicht positiv, Economy-before-score hoch.                   |
| Real Scene 2      |           6 / 6 |             6 / 6 |   0.556 / 0.333 | warn | Ergebnis stabil, Search/Recovery bleibt sichtbar.            |

## Guardrail-Tabelle

| Guardrail                                       | Candidate | Delta | Gate |
| ----------------------------------------------- | --------: | ----: | ---- |
| `corpAgendaInstalledInCheaplyContestableRemote` |         0 |     0 | pass |
| `corpAdvanceInCheaplyContestableRemote`         |         0 |     0 | pass |
| `runnerRunStartedAgainstKnownUnpayableFullPath` |         0 |     0 | pass |
| `runsStartedAgainstKnownUnaffordablePath`       |        10 |    +5 | warn |
| `runnerRunSuppressedAsKnownNoAccess`            |       379 |   -32 | pass |
| `runnerRunAllowedAsFirstProbeUnknownIce`        |       339 |   +49 | pass |
| `corpFutureRunIceInstalledAsDeadEffect`         |         1 |     0 | warn |
| `corpMultiIceInstallOrderFutureEffectDead`      |         0 |    -1 | pass |
| `corpBallAndChainInstalledWithoutLaterIce`      |         1 |     0 | warn |
| `corpRemotePortfolioOverExpanded`               |         0 |    -6 | pass |
| `corpNewRemoteCreatedWithoutPayloadPlan`        |        10 |    -5 | warn |

Die harten Guardrails halten. Die breite alte unaffordable-path-Metrik und der einzelne Future-ICE-Dead-Effect bleiben Beobachtungspunkte, brechen aber nicht das Default-Gate hart.

## Recent-Fix-Tabelle

| Bereich              |                                                 Candidate | Gate | Befund                                                                  |
| -------------------- | --------------------------------------------------------: | ---- | ----------------------------------------------------------------------- |
| Tag/Punish Windows   |                           36 Windows, 35 taken, 1 skipped | pass | 0 unknown nach Normalisierung, 0 suspicious FixGate.                    |
| Runner Known Path    |                                0 unpayable full-path runs | pass | First-probe bleibt mit 339 erlaubt, no-access suppression bleibt aktiv. |
| Corp ICE Ordering    |                    6 live, 1 dead, 0 multi-ICE dead order | pass | Kernfix hält; ein Dead-Effect-Fall bleibt klein.                        |
| Score Terminal       |             505 Windows, 61 score taken, 52 advance taken | warn | Score-Konversion verbessert, Skips und Economy-Loops bleiben.           |
| Economy-before-score | 86 taken, 44 repeated within 3, 71 not converted within 3 | warn | stärkstes Default-Risiko.                                               |

## Open-Risk-Tabelle

| Risiko                                            | Baseline | Candidate | Delta | Gate |
| ------------------------------------------------- | -------: | --------: | ----: | ---- |
| `runnerEconomyFixGateEligibleStarvedSkip`         |       34 |        60 |   +26 | warn |
| `runnerSetupFixGateEligibleSearchRecoverySkip`    |      128 |       134 |    +6 | warn |
| `runnerSetupFixGateEligibleMemorySkip`            |       93 |       105 |   +12 | warn |
| `runnerEconomySkippedWhileKnownUnaffordablePath`  |      116 |       123 |    +7 | warn |
| `runnerSearchRecoveryWindowWithNoInstallFollowup` |       97 |        99 |    +2 | warn |
| `runnerMemorySupportSkippedWhileGripHasPrograms`  |       93 |       105 |   +12 | warn |

Runner-Setup ist kein Safety-Blocker, aber als Default-Risiko weiterhin offen. Der stärkste praktische Punkt bleibt Search/Recovery plus Memory/Grip-Programm-Kontext, nicht Tag/Punish oder Known-Path.

## Gate-Ergebnis

| Gate                 | Ergebnis | Begründung                                                       |
| -------------------- | -------- | ---------------------------------------------------------------- |
| Safety               | pass     | illegal/replay/timeout 0.                                        |
| Cheap Remote         | pass     | Agenda/Advance cheap-remote 0/0.                                 |
| Known No-Access Runs | pass     | neue Full-Path-Metrik bleibt 0.                                  |
| ICE Ordering         | pass     | Multi-ICE-Dead-Order 0; ein Dead-Effect-Fall bleibt klein.       |
| Progression          | warn     | Global besser, aber Snapshot Holdout und Local Pair 2 warnen.    |
| Economy-before-score | warn     | 44 repeated within 3 und 71 not converted within 3 bleiben hoch. |
| Tag/Punish           | pass     | unknown/suspicious kehren nicht zurück.                          |
| Runner Setup         | warn     | Search/Recovery- und Memory-FixGates bleiben sichtbar.           |

Overall: `observe_more`.

## Technische Empfehlung

Keine Release- oder Default-Entscheidung in diesem Review.

Technisch ist der Stand weiter merge-würdig mit dokumentiertem Risiko und profile-gated beobachtbar. Für Default reicht der Beobachtungspunkt nicht: Snapshot Holdout ist negativ, Local Pair 2 zeigt trotz besserer Score-/Steal-Bilanz ActionLimit-Warnung, Economy-before-score bleibt hoch, und Runner-Setup-FixGates sind noch nicht geschlossen.

Empfehlung:

- Code/Merge: `merge_ready_with_documented_risk`
- Profile-gated: `profile_gated_ready_with_risks`
- Default: `default_not_ready_observe_more`
- Nächster Schritt: profile-gated Beobachtung fortsetzen; wenn das Muster stabil bleibt, eine kleine Economy-before-score-Folgeaufgabe oder Runner-Setup-Attribution schneiden.

## Bewusst Nicht Geändert

- keine Code-Fixes
- keine Strategieänderung
- keine PlanWeights
- keine Action-Score-Änderung
- keine Engine-Regeländerung
- keine LegalAction-Änderung
- keine Profilumschaltung
- keine neuen Decks
- keine Holdout-Optimierung
- keine Änderung an `aiSupportStatus`
- keine Änderung an `data/ai/ai-card-hints-active.json`
- keine Runtime-Nutzung des Compiled Index
- keine Runtime-Nutzung modularer Overlays
- keine aktive Hintmigration
