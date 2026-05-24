# AI Advance-to-Score Window Compression - 2026-05-24

## Kurzfazit

Der Slice komprimiert vorhandene Corp-Agenda-Linien enger von geschütztem Remote über Advance zu Score, ohne Cheap-Remote-Safety zurückzunehmen. `score_agenda` wurde weiterhin nicht verpasst (`missedScoreWindows = 0`), und die harten Safety-Gates bleiben sauber (`illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`).

Der 8-Slot-Benchmark zeigt aber keine breite Corp-Score-Erholung. `current_candidate` bleibt bei ActionLimit und No-Progress besser als `belief_ai_v1_4_2`, verliert aber weiter Corp-Scores. Das spricht gegen einen weiteren kleinen Score-Kompressionsfix ohne neue Diagnose.

## Diagnosebefund

Die Verzögerung lag nicht in legalen `score_agenda`-Fenstern, sondern vor diesen Fenstern. Relevante Muster waren:

- Agenda liegt bereits in einem effektiv geschützten Remote, aber die Corp schiebt Economy, Protection, Central-Protection, Draw oder End Turn ein.
- Eine Agenda wurde advanced, aber der nächste Score-/Advance-Schritt wird nicht schnell genug erreicht.
- Einige Protection-Aktionen erhöhen die effektive Remote-Safety nicht mehr, werden aber trotzdem als attraktive Zwischenaktion bewertet.
- Economy ist teilweise sinnvoll, wenn sie konkret Rez-/Advance-/Score-Reserve erreicht; generische Economy vor einem bereits spielbaren Scorepfad ist dagegen ein Verzögerungssignal.

Cheap-Remote-Safety bleibt die harte Grenze: Agenda-Install und Advance in billig contestbaren Remotes bleiben blockiert, außer Same-Turn-Score-/Bait-Sonderfälle aus bestehenden Regeln greifen.

## Implementierter Slice

Neue Score-Window-Compression-Logik im Corp-Planer:

- Erkennt Score-Kompressionsfenster für `score_agenda`, protected `advance_card`, protected Agenda-Install und Advance-Burst-/Same-Turn-Score-Aktionen.
- Boostet Score-/Advance-/Agenda-Install-Linien, wenn der Zielremote effektiv geschützt ist oder Same-Turn-Score möglich ist.
- Erlaubt Economy vor Score nur, wenn sie konkret eine Remote-Rez-/Score-Reserve erreicht.
- Wertet Protection ohne Remote-Safety-Delta ab.
- Wertet Central-Protection, Draw und End Turn vor einem plausiblen Remote-Scorefenster ab, sofern kein akutes höheres Central-Risiko sichtbar ist.
- Nutzt nur bestehende LegalActions und bestehende Effective-Remote-Safety-Bewertung.

Keine Engine-, Deck-, Hint-, Catalog- oder Profiländerung.

## Neue Metriken

Ergänzt wurden unter anderem:

- `corpAgendaInstalledInProtectedRemote`
- `corpAgendaAdvancedInProtectedRemote`
- `corpAgendaNearScoreWindow`
- `corpScoreWindowCompressionOpportunity`
- `corpScoreWindowCompressionTaken`
- `corpScoreWindowCompressionRate`
- `corpScoreWindowCompressionSkipped`
- `corpNonEssentialActionBeforeScoreWindow`
- `corpEconomyBeforeScoreWindow`
- `corpEconomyBeforeScoreWindowNecessary`
- `corpProtectionBeforeScoreWindowNoSafetyDelta`
- `corpCentralProtectionBeforeScoreWindow`
- `corpSameTurnScoreOpportunity`
- `corpSameTurnScoreTaken`
- `corpRunnerStealAfterDelayedScoreWindow`
- `corpAdvanceToScoreLineCompressedWithin2`
- `corpAdvanceToScoreLineCompressedWithin3`

Die Metriken werden aus redaction-safe Plan-Evidence und Action-Sequenzen aggregiert. Sie erzeugen keine neuen AIInput-Felder und keine Hidden-Info-Nutzung.

## Benchmark-Konfiguration

- Suite: Match-Progression-Deck-Suite mit 8 runnable Slots
- Seeds: `ai-v143-tuning-001` bis `006`, `ai-v143-holdout-001` bis `003`
- `maxActions`: 160
- Profile: `belief_ai_v1_4_2`, `current_candidate`
- Real-Scene-Paare bleiben `holdout_only`

## Gesamtergebnis

| Metrik                                        | belief_ai_v1_4_2 | current_candidate |
| --------------------------------------------- | ---------------: | ----------------: |
| ActionLimitRate avg                           |            0.556 |             0.417 |
| Runner Steals                                 |              153 |               157 |
| Corp Scores                                   |               60 |                55 |
| Score/Steal per Match avg                     |            2.958 |             2.944 |
| StrategicLongestNoProgress                    |              244 |               168 |
| SameStrategicPlanRepeatedWithoutProgress      |              649 |               578 |
| corpScoreWindowCompressionOpportunity         |              565 |               564 |
| corpScoreWindowCompressionTaken               |              544 |               538 |
| corpScoreWindowCompressionRate avg            |            0.969 |             0.958 |
| corpNonEssentialActionBeforeScoreWindow       |               25 |                20 |
| corpEconomyBeforeScoreWindow                  |               10 |                 5 |
| corpEconomyBeforeScoreWindowNecessary         |                8 |                 2 |
| corpProtectionBeforeScoreWindowNoSafetyDelta  |               13 |                15 |
| corpCentralProtectionBeforeScoreWindow        |               11 |                19 |
| corpAdvanceBurstOpportunity                   |                7 |                 8 |
| corpAdvanceBurstTaken                         |                7 |                 8 |
| corpSameTurnScoreOpportunity                  |                7 |                 8 |
| corpSameTurnScoreTaken                        |                7 |                 8 |
| corpRunnerStealAfterDelayedScoreWindow        |                7 |                 9 |
| missedScoreWindows                            |                0 |                 0 |
| corpAgendaInstalledInCheaplyContestableRemote |                0 |                 0 |
| corpAdvanceInCheaplyContestableRemote         |                0 |                 0 |
| illegalActions                                |                0 |                 0 |
| replayFailures                                |                0 |                 0 |
| timeoutRate avg                               |                0 |                 0 |

## Slotbefund

| Slot              | ActionLimit Baseline -> Candidate | Corp Scores Baseline -> Candidate | Runner Steals Baseline -> Candidate | Befund                                                            |
| ----------------- | --------------------------------: | --------------------------------: | ----------------------------------: | ----------------------------------------------------------------- |
| Smoke             |                    0.667 -> 0.667 |                            7 -> 8 |                            18 -> 16 | Corp leicht besser, ActionLimit unverändert.                      |
| Snapshot Rig      |                    0.333 -> 0.333 |                          14 -> 12 |                            24 -> 26 | Corp-Scores regressieren trotz besserer No-Progress-Werte.        |
| Snapshot Pressure |                        0.556 -> 0 |                          13 -> 11 |                            25 -> 26 | ActionLimit stark besser, Corp-Scores niedriger.                  |
| Snapshot Holdout  |                    0.556 -> 0.556 |                            3 -> 1 |                            28 -> 30 | Holdout bleibt klare Corp-Score-Schwäche.                         |
| Local Pair 1      |                    0.333 -> 0.111 |                            4 -> 2 |                            10 -> 10 | ActionLimit besser, Corp-Scores niedriger.                        |
| Local Pair 2      |                    0.556 -> 0.556 |                            8 -> 6 |                            22 -> 23 | Stabil bei ActionLimit, Corp-Scores niedriger.                    |
| Real Scene Pair 1 |                    0.444 -> 0.222 |                            5 -> 6 |                            18 -> 20 | Candidate besser, aber holdout_only.                              |
| Real Scene Pair 2 |                        1 -> 0.889 |                            6 -> 9 |                              8 -> 6 | Candidate besser für Corp, Runner-Steals niedriger, holdout_only. |

## Bewertung

Positiv:

- Cheap-Remote-Safety bleibt erhalten: beide Cheap-Remote-Metriken bleiben 0.
- `missedScoreWindows` bleibt 0.
- ActionLimitRate sinkt im Candidate weiter.
- No-Progress-Metriken verbessern sich deutlich.
- Same-Turn-/Advance-Burst-Erkennung bleibt aktiv.

Gemischt oder negativ:

- Corp-Scores bleiben unter Baseline.
- `corpRunnerStealAfterDelayedScoreWindow` steigt im Candidate von 7 auf 9.
- `corpProtectionBeforeScoreWindowNoSafetyDelta` steigt leicht.
- `corpCentralProtectionBeforeScoreWindow` steigt deutlich, besonders in Snapshot Rig und Smoke.
- Snapshot Holdout und Local Pair 1 verlieren Corp-Scores trotz besserer ActionLimit-Werte.

## Risiko

Die Score-Kompressionslogik ist eng und nutzt bestehende Safety-Bewertungen, aber die Benchmarkwirkung zeigt, dass Corp-Score-Verlust nicht allein aus nicht komprimierten Scorefenstern entsteht. Wahrscheinlich bleibt ein höherliegendes Problem:

- Remote-Scorepfade werden zwar sicherer, aber weniger oft bis zum Punktgewinn materialisiert.
- Runner-Contest-Kapazität und Corp-Score-Linien bleiben teilweise gegenläufig.
- Central-Protection kann den Remote-Scorepfad noch verdrängen, obwohl sie jetzt als Verzögerung messbar wird.

Ein weiterer kleiner Fix nur auf Score-Kompression wäre derzeit nicht ausreichend begründet.

## Tests

Grün:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts --reporter=dot`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`

Zusätzlich lief ein temporärer 8-Slot-Benchmark-Harness. Temporäre Harness- und Output-Dateien wurden nicht versioniert.

## Empfehlung

Kein weiterer enger Corp-Score-Fix direkt hinterher. Nächster sinnvoller Schritt ist ein Release-/Merge-Review oder eine größere, bewusst diagnostizierte Corp-Doctrine-/Opponent-Model-Entscheidung. Wenn weiter an Corp gearbeitet wird, sollte der nächste Slice zuerst erklären, warum `corpCentralProtectionBeforeScoreWindow` und `corpRunnerStealAfterDelayedScoreWindow` im Candidate steigen, statt weitere Score-Boosts zu addieren.
