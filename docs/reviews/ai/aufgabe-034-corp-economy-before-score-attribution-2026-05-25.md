# Aufgabe 034 - AI: Corp Economy-before-score Attribution Follow-up

## Kurzfazit

Aufgabe 034 ergänzt eine engere Attribution für die Economy-before-score-Warnungen aus Aufgabe 031/033. Es wurde kein weiterer Planner-Fix umgesetzt.

Die neue Attribution zeigt: Die Warnung ist real, aber gemischt. Im frischen 8-Slot-Lauf hat `current_candidate` weiter 86 Economy-before-score-Taken, 44 repeated Economy innerhalb von 3 Corp-Aktionen und 71 nicht innerhalb von 3 Corp-Aktionen konvertierte Fenster. Davon bleiben 15 repeated-Economy- und 16 no-conversion-Fälle suspicious. Der größere Anteil ist plausibel oder blockiert, vor allem durch fehlenden Agenda-Exit, Safety-Kontext oder fortbestehende Scorepfad-Voraussetzungen.

Entscheidung: nur Diagnose, kein weiterer Score-/Economy-Fix in diesem Slice. Ein enger No-repeat-Fix wäre nach diesen Daten zu breit.

## Bezug zu Aufgabe 031/032/033

Aufgabe 031 hatte Economy-before-score-Metriken und einen engen Malus gegen Economy in echten Score-/Advance-to-score-Fenstern ergänzt. Aufgabe 032 bewertete den Gesamtstand als `merge_ready_with_documented_risk`, `profile_gated_ready_with_risks`, aber `default_not_ready_observe_more`. Aufgabe 033 bestätigte die Default-Gate-Warnung:

- `corpEconomyBeforeScoreTaken = 86`
- `corpEconomyBeforeScoreRepeatedEconomyWithin3 = 44`
- `corpEconomyBeforeScoreNotConvertedWithin3CorpActions = 71`

Aufgabe 034 zerlegt diese Werte in Ursache-Buckets, ohne Engine, LegalActions, Profile, Hintdaten oder PlanWeights zu ändern.

## Audit der bestehenden Metriken

Die bestehenden Economy-before-score-Metriken werden aus der side-safe `actionSequence` der Match-Progression-Summary aggregiert.

| Metrikgruppe                                           |                Zählebene | Befund                                                                                              |
| ------------------------------------------------------ | -----------------------: | --------------------------------------------------------------------------------------------------- |
| `corpEconomyBeforeScoreWindow`                         | Action-/Decision-Eintrag | Ein Corp-Decision-Eintrag mit Economy-before-score-Diagnoseflag.                                    |
| `corpEconomyBeforeScoreTaken`                          |           Action-basiert | Economy wurde in diesem Diagnosefenster gewählt.                                                    |
| `corpEconomyBeforeScoreTakenAsNecessaryCredits`        |           Action-basiert | Economy wurde als Credit-Voraussetzung markiert.                                                    |
| `corpEconomyBeforeScoreTakenDespiteCreditsEnough`      |           Action-basiert | Credits reichen bereits; getrennt von Safety/Contest zu bewerten.                                   |
| `corpEconomyBeforeScoreConvertedWithin3CorpActions`    |         Followup-basiert | Eine der nächsten 3 Corp-Entscheidungen konvertiert in Score, Advance-to-score oder Agenda-Install. |
| `corpEconomyBeforeScoreNotConvertedWithin3CorpActions` |         Followup-basiert | Keine Score-/Advance-/AgendaInstall-Konversion in den nächsten 3 Corp-Entscheidungen.               |
| `corpEconomyBeforeScoreRepeatedEconomyWithin3`         |         Followup-basiert | In den nächsten 3 Corp-Entscheidungen folgt erneut Economy.                                         |
| FixGate-Blocker                                        |           Action-basiert | Credits, Cheap Contest, Runner Contest und Safety blockieren suspicious Attribution.                |

`not converted within 3` wird pro Economy-before-score-Taken-Eintrag berechnet. Advance-to-score zählt als Conversion, wenn die folgende Corp-Aktion ein Score-Terminal-Advance ist oder das Diagnosefenster `AdvanceToScoreLegalNext` trägt. Agenda-Install in eine ready Remote zählt ebenfalls als Conversion, sofern die Summary sie als Agenda-Install/Root-Install ausweist.

## Neue Attribution-Metriken

Neu ergänzt wurden drei Buckets:

- Repeated Economy: Credits noch knapp vs. Credits reichen bereits, Score/Advance/AgendaInstall-ready-remote legal, Remote safe, Runner Contest high, spätere Score-/Steal-/ActionLimit-Folge, suspicious/plausible.
- No Conversion within 3: Credits short, no agenda exit, remote unsafe, runner contest high, safety blocked, plan drift, repeated economy, draw/protection/remote-portfolio loop, runner steal, action limit, suspicious/plausible.
- Credits enough: Credits-enough-Windows, Taken, Score legal, Advance legal, AgendaInstall-ready-remote legal, Safety blocked, suspicious/plausible.

Die Metriken bleiben rein diagnostisch und nutzen keine Hidden-Card-Identitäten.

## 8-Slot Benchmark

Setup:

- `runMatchProgressionBenchmarkSuite`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- `includeHoldout: true`
- `maxActions: 160`
- 8 runnable Slots, 72 Spiele
- temporärer Vitest-Harness, danach gelöscht

### Global

| Metrik                                   | Baseline | Candidate | Delta |
| ---------------------------------------- | -------: | --------: | ----: |
| Corp Scores                              |       52 |        61 |    +9 |
| Runner Steals                            |      132 |       118 |   -14 |
| ActionLimitRate                          |    0.347 |     0.347 |     0 |
| illegalActions                           |        0 |         0 |     0 |
| replayFailures                           |        0 |         0 |     0 |
| timeoutRate                              |        0 |         0 |     0 |
| Cheap-Remote Agenda/Advance              |    0 / 0 |     0 / 0 | 0 / 0 |
| Known no-access full-path runs           |        0 |         0 |     0 |
| Multi-ICE future dead order              |        1 |         0 |    -1 |
| Tag/Punish normalized unknown/suspicious |    0 / 0 |     0 / 0 | 0 / 0 |

### Economy-before-score Attribution

| Metrik                                                 | Baseline | Candidate | Delta |
| ------------------------------------------------------ | -------: | --------: | ----: |
| `corpEconomyBeforeScoreWindow`                         |      466 |       505 |   +39 |
| `corpEconomyBeforeScoreTaken`                          |       57 |        86 |   +29 |
| `corpEconomyBeforeScoreTakenAsNecessaryCredits`        |        1 |         2 |    +1 |
| `corpEconomyBeforeScoreTakenDespiteCreditsEnough`      |       56 |        84 |   +28 |
| `corpEconomyBeforeScoreConvertedWithin3CorpActions`    |        8 |        15 |    +7 |
| `corpEconomyBeforeScoreNotConvertedWithin3CorpActions` |       49 |        71 |   +22 |
| `corpEconomyBeforeScoreRepeatedEconomyWithin3`         |       23 |        44 |   +21 |
| `corpEconomyBeforeScoreThenRunnerSteal`                |        9 |        10 |    +1 |
| `corpEconomyBeforeScoreFixGateSuspicious`              |       33 |        45 |   +12 |

### Ursache-Buckets

| Bucket                             | Baseline | Candidate | Befund                                                |
| ---------------------------------- | -------: | --------: | ----------------------------------------------------- |
| Repeated Economy suspicious        |        9 |        15 | echtes Restsignal, aber nicht dominant                |
| Repeated Economy plausible         |       14 |        29 | größerer Anteil plausibel/blockiert                   |
| Repeated Credits already enough    |       23 |        43 | hoch, aber nur kleine terminal-legale Teilmenge       |
| Repeated Score legal               |        0 |         1 | kaum Score-now-Fälle                                  |
| Repeated Advance legal             |        1 |         4 | klein                                                 |
| Repeated AgendaInstall-ready legal |        8 |        11 | sichtbar, aber gemischt                               |
| Repeated then Score                |        3 |        10 | mehrere Wiederholungen konvertieren später            |
| No Conversion suspicious           |       11 |        16 | echtes Restsignal                                     |
| No Conversion plausible            |       38 |        55 | Mehrheit plausibel/blockiert                          |
| No Conversion no agenda exit       |       37 |        53 | dominierender Cause                                   |
| No Conversion safety blocked       |       21 |        33 | wichtiger Blocker                                     |
| No Conversion repeated economy     |       20 |        34 | Loop-Anteil sichtbar                                  |
| No Conversion plan drift           |        2 |         0 | kein aktuelles Draw/Protection/New-Remote-Driftmuster |
| No Conversion runner steal         |        9 |        10 | praktisch stabil                                      |
| No Conversion action limit         |        2 |         3 | klein                                                 |
| Credits-enough taken               |       56 |        84 | hoch                                                  |
| Credits-enough suspicious          |       15 |        22 | Restsignal                                            |
| Credits-enough plausible           |      135 |       170 | Safety/plausible-Kontext dominiert                    |

## Slot-Fokus

| Slot              | Corp Scores B/C | Runner Steals B/C | Taken C | Repeated C | Repeated suspicious C | No conversion C | No conversion suspicious C | Befund                                                           |
| ----------------- | --------------: | ----------------: | ------: | ---------: | --------------------: | --------------: | -------------------------: | ---------------------------------------------------------------- |
| Smoke             |          7 / 10 |           14 / 15 |       1 |          0 |                     0 |               1 |                          0 | kein Economy-Loop-Treiber                                        |
| Snapshot Rig      |         10 / 11 |           22 / 17 |       7 |          2 |                     0 |               7 |                          0 | positiv, Attribution plausibel                                   |
| Snapshot Pressure |         10 / 13 |           27 / 22 |       2 |          1 |                     0 |               2 |                          0 | positiv trotz kleiner Warnung                                    |
| Snapshot Holdout  |           9 / 6 |           19 / 21 |      13 |          5 |                     2 |              11 |                          2 | negativer Slot, Economy beteiligt, aber nicht alleiniger Treiber |
| Local Pair 1      |           2 / 2 |            10 / 8 |      17 |          8 |                     4 |              16 |                          5 | stabil, Runner-Setup bleibt wichtiger Kontext                    |
| Local Pair 2      |           0 / 3 |           19 / 15 |      16 |         13 |                     5 |              11 |                          4 | Score/Steal besser, ActionLimit-Warnung bleibt                   |
| Real Scene 1      |          8 / 10 |           15 / 14 |      28 |         14 |                     4 |              22 |                          5 | größter Economy-before-score-Träger, aber überwiegend plausibel  |
| Real Scene 2      |           6 / 6 |             6 / 6 |       2 |          1 |                     0 |               1 |                          0 | stabil                                                           |

### Snapshot Holdout

Snapshot Holdout bleibt der wichtigste negative Slot: Corp Scores fallen von 9 auf 6, Runner Steals steigen von 19 auf 21. Economy-before-score ist dort sichtbar, aber klein im Vergleich zum globalen Signal: 13 taken, 5 repeated, 11 not converted. Nur 2 repeated- und 2 no-conversion-Fälle sind suspicious. Das reicht nicht für einen Slot-spezifischen Economy-Fix ohne weitere Trace-Sichtung.

### Local Pair 2

Local Pair 2 verbessert sich bei Scores/Steals von 0/19 auf 3/15, bekommt aber ein ActionLimit-Warnsignal. Die Attribution zeigt 16 taken, 13 repeated und 11 no-conversion; suspicious sind 5 bzw. 4. Das ist der stärkste Kandidat für weitere manuelle Trace-Sichtung, aber nicht eindeutig genug, um Economy pauschal weiter zu drücken.

### Real Scene 1

Real Scene 1 trägt den größten Anteil: 28 taken, 14 repeated, 22 not converted. Die Unterteilung ist aber gemischt: 4 repeated suspicious gegen 10 plausible, 5 no-conversion suspicious gegen 17 plausible. Der Slot ist außerdem leicht positiv bei Corp Scores und Runner Steals. Das spricht gegen einen weiteren automatischen Score-Fix in diesem Slice.

## FixGate-Auswertung

Ein weiterer enger Fix wäre nur gerechtfertigt, wenn repeated Economy oder no-conversion klar suspicious und terminal legal dominiert:

- Score legal bei repeated Economy: 1.
- Advance legal bei repeated Economy: 4.
- AgendaInstall-ready-remote legal bei repeated Economy: 11.
- Repeated suspicious: 15 von 44.
- No-conversion suspicious: 16 von 71.
- No-conversion plan drift: 0.
- Draw-/Protection-/RemotePortfolio-Loops nach Economy: 0/0/0.
- Cheap-Remote-Blocker bleibt 0.

Damit sind die Fix-Gates nicht sauber genug. Ein No-repeat-Economy-Fix würde viele plausible oder safety-blockierte Fenster treffen. Ein Convert-within-3-Fix findet kein klares Plan-Drift-Muster. Agenda-install-ready-remote nach Economy bleibt interessant, aber die aktuelle Teilmenge ist zu klein und zu stark mit no-agenda-exit/Safety-Kontext vermischt.

## Focus-Tests

Ergänzt wurden fokussierte Tests in `packages/ai/src/index.test.ts`:

- repeated Economy mit Credits already enough, Score legal und Runner-Steal-Followup zählt suspicious.
- no-conversion mit repeated Economy und Runner-Steal-Followup zählt suspicious.
- necessary Economy / credits still short bleibt plausibel.
- Cheap-Contest-Blocker bleibt blockierend.
- Runner-Contest-, Safety-/Remote-Unsafe- und Plan-Drift-Buckets werden getrennt gezählt.

Die Tests prüfen den side-safe Summary-/Attribution-Pfad. Es wurde kein Action-Selection-Fix ergänzt, weil die FixGate-Entscheidung gegen einen weiteren Planner-Eingriff ausfällt.

## Guardrails

| Guardrail                                       | Candidate | Gate |
| ----------------------------------------------- | --------: | ---- |
| `illegalActions`                                |         0 | pass |
| `replayFailures`                                |         0 | pass |
| `timeoutRate`                                   |         0 | pass |
| `corpAgendaInstalledInCheaplyContestableRemote` |         0 | pass |
| `corpAdvanceInCheaplyContestableRemote`         |         0 | pass |
| `runnerRunStartedAgainstKnownUnpayableFullPath` |         0 | pass |
| `corpMultiIceInstallOrderFutureEffectDead`      |         0 | pass |
| `corpFutureRunIceInstalledAsDeadEffect`         |         1 | warn |
| Tag/Punish normalized unknown/suspicious        |     0 / 0 | pass |

Keine Guardrail spricht gegen die Diagnoseänderung.

## Entscheidung

Ergebnis: nur Diagnose, kein weiterer Fix in Aufgabe 034.

Begründung:

- Es gibt echte suspicious Restfenster, aber sie sind nicht dominant.
- Die meisten no-conversion-Fälle sind plausibel oder blockiert.
- `no agenda exit` und Safety-Kontext dominieren stärker als planloser Economy-Drift.
- Draw-/Protection-/Remote-Portfolio-Loops nach Economy sind im Candidate nicht das aktuelle Muster.
- Snapshot Holdout und Local Pair 2 bleiben Warnungen, aber nicht eindeutig genug für einen breiten Economy-Malus.

## Bewusst Nicht Geändert

- keine Engine-Regeländerung
- keine neue Legalität
- keine LegalAction-Änderung
- keine Profilumschaltung
- keine neuen Decks
- keine Holdout-Optimierung
- keine Änderung an `aiSupportStatus`
- keine Änderung an `data/ai/ai-card-hints-active.json`
- keine Runtime-Nutzung des Compiled Index
- keine Runtime-Nutzung modularer Overlays
- keine aktive Hintmigration
- keine neue Action-Erzeugung
- keine PlanWeights
- keine Action-Score-Änderung

## Nächster praktischer Schritt

Wenn der Scorepfad weiter verfolgt wird, sollte der nächste Schritt kein weiterer pauschaler Economy-Fix sein, sondern eine kleine Trace-Sichtung der 15 repeated-suspicious- und 16 no-conversion-suspicious-Fälle in Snapshot Holdout, Local Pair 2 und Real Scene 1. Wenn diese Trace-Sichtung keinen einheitlichen Cause zeigt, ist der stärkere technische Hebel eher Runner Setup/Search-Recovery/Memory oder profile-gated Beobachtung ohne Default-Promotion.
