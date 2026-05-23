# AI Plan-Conversion-Diagnose 2026-05-23

## Kurzfazit

Es wurde keine neue Strategie-Heuristik eingebaut. Der neue Slice ergänzt reine Diagnosemetriken, die prüfen, ob lokale Entscheidungen innerhalb von 1 bis 3 Folgeaktionen oder bis zum nächsten relevanten Fortschritt konvertieren.

Der Befund stützt die Hypothese: Das Restproblem ist nicht mehr primär ein einzelnes Action-Gewicht. Viele Einzelentscheidungen sind plausibel, aber mehrere Slots erzeugen lange Ketten aus Setup, Economy, Probe-/Central-Runs, Remote-Build und End-Turns, ohne in Score, Steal, relevante Trash-/Contest-Linie oder Board-/Reserve-Fortschritt zu konvertieren.

`current_candidate` bleibt safety-stabil (`illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`) und ist gegenüber Basic-Profilen kontrollierter. Gegen `belief_ai_v1_4_2` ist er nur slotweise besser: Pressure-Tuning und Snapshot-Holdout gewinnen bei Runner-Steals oder ActionLimit, Local Pair 2 bleibt praktisch identisch, Local Pair 1 bleibt auffällig.

## Methode

Benchmarklauf:

- Suite: Match-Progression-Deck-Suite
- Seeds: 9
- Profile: `basic_corp_ai`, `basic_runner_ai`, `belief_ai_v1_4_2`, `current_candidate`
- Vergleich: `belief_ai_v1_4_2` gegen `current_candidate`
- Slots: Smoke, Snapshot Tuning A/B, Snapshot Holdout, Frozen Local Realistic Pair 1/2
- Real-Scene-Holdouts bleiben pending, weil keine vollständigen echten Szenedecklisten im Repository liegen.

Neue Diagnosewerte werden aus der redaction-sicheren `actionSequence` abgeleitet. Verdeckte Corp-Hand, R&D-Reihenfolge, HQ-Inhalte, Stack, Deckliste oder Hidden-Info-Titel werden nicht verwendet.

Fortschritt zählt streng:

- Score oder Steal.
- Relevanter Remote-Trash oder Remote-Contest mit Steal/Trash-Folge.
- Central Pressure nur mit Steal, Interface/Multiaccess/Fresh-/Closeout-Signal.
- Runner-Rig-Install nur, wenn kein Low-Value-Duplicate-Signal vorliegt.
- Economy nur bei Reserve-Erhalt, Reserve-Überschreitung oder deutlichem Kreditgewinn.
- Corp Remote-Advance, Schutz-Rez/ICE oder Remote-Build, der zeitnah in Advance/Score konvertiert.

## Neue Planfolge-Metriken

- `actionLedToProgressWithin1/2/3`
- `planIntentConverted`
- `planIntentAbandoned`
- `samePlanRepeatedWithoutProgress`
- `setupActionConvertedToRun`
- `economyActionConvertedToRun`
- `rigActionConvertedToRun`
- `remoteBuildConvertedToAdvanceOrScore`
- `advanceConvertedToScore`
- `remoteContestConvertedToStealOrTrash`
- `centralPressureConvertedToSteal`
- `noProgressActionChainLength`
- `longestNoProgressChain`
- `turnsWithNoProgress`
- `actionsUntilNextScoreOrSteal`
- `actionsUntilNextMeaningfulBoardProgress`

## Baseline vs Candidate

| Slot              |    ActionLimit |   Steals |   Scores | Score/Steal pro Match | Progress <=3 |  Converted |  Abandoned | Same Plan Repeat | Avg No-Progress | Max No-Progress |
| ----------------- | -------------: | -------: | -------: | --------------------: | -----------: | ---------: | ---------: | ---------------: | --------------: | --------------: |
| Smoke             | 0.667 -> 0.667 | 16 -> 16 |   8 -> 8 |        2.667 -> 2.667 |   692 -> 707 | 241 -> 246 | 232 -> 222 |         87 -> 84 |  5.388 -> 5.206 |        42 -> 42 |
| Snapshot Rig      | 0.111 -> 0.222 | 30 -> 30 | 10 -> 10 |        4.444 -> 4.444 |   674 -> 680 | 260 -> 268 | 250 -> 250 |        98 -> 111 |  5.291 -> 5.299 |        74 -> 84 |
| Snapshot Pressure | 0.222 -> 0.222 | 26 -> 29 |   9 -> 8 |        3.889 -> 4.111 |   729 -> 654 | 267 -> 246 | 216 -> 228 |       132 -> 139 |  4.735 -> 5.095 |        39 -> 62 |
| Snapshot Holdout  | 0.667 -> 0.556 | 23 -> 24 |   5 -> 5 |        3.111 -> 3.222 |   870 -> 827 | 248 -> 244 | 197 -> 228 |       142 -> 158 |  4.381 -> 4.585 |        28 -> 36 |
| Local Pair 1      | 0.333 -> 0.333 |  9 -> 10 |   4 -> 4 |        1.444 -> 1.556 |   443 -> 454 | 160 -> 164 | 252 -> 281 |       100 -> 107 |  5.769 -> 6.056 |        40 -> 40 |
| Local Pair 2      | 0.556 -> 0.556 | 26 -> 26 |   5 -> 5 |        3.444 -> 3.444 |   762 -> 764 | 220 -> 220 | 173 -> 171 |       153 -> 153 |  4.397 -> 4.369 |        41 -> 41 |

## Conversion-Details

| Slot              | Remote Build -> Advance/Score | Advance -> Score | Remote Contest -> Steal/Trash | Central Pressure -> Steal | Actions bis Score/Steal | Actions bis Board-Fortschritt |
| ----------------- | ----------------------------: | ---------------: | ----------------------------: | ------------------------: | ----------------------: | ----------------------------: |
| Smoke             |                      18 -> 16 |         14 -> 14 |                        1 -> 1 |                    5 -> 5 |        23.808 -> 25.700 |                3.753 -> 3.615 |
| Snapshot Rig      |                      19 -> 21 |         14 -> 14 |                        0 -> 0 |                    5 -> 5 |        18.709 -> 19.970 |                5.901 -> 6.570 |
| Snapshot Pressure |                      21 -> 19 |         15 -> 13 |                        0 -> 0 |                    5 -> 6 |        17.875 -> 16.384 |                3.941 -> 5.564 |
| Snapshot Holdout  |                      20 -> 18 |           8 -> 8 |                        0 -> 0 |                    1 -> 1 |        27.654 -> 27.521 |                3.275 -> 4.176 |
| Local Pair 1      |                        8 -> 8 |         10 -> 10 |                        0 -> 0 |                    4 -> 3 |        41.208 -> 39.229 |                5.098 -> 5.392 |
| Local Pair 2      |                      17 -> 17 |           6 -> 6 |                        0 -> 0 |                  12 -> 12 |        36.311 -> 36.311 |                3.510 -> 3.503 |

## Slotanalyse

### Smoke

Der Candidate verbessert Diagnosewerte leicht: mehr `actionLedToProgressWithin3`, mehr `planIntentConverted`, weniger `planIntentAbandoned`, weniger gleiche Planwiederholung ohne Fortschritt. ActionLimit bleibt unverändert. Das ist ein kontrollierter Safety-Smoke-Befund, keine klare Spielstärkeverbesserung.

### Snapshot Rig

Mixed bis negativ. Remote-Build-Konversion steigt leicht und RepeatLow sinkt, aber ActionLimit steigt von `0.111` auf `0.222`, `samePlanRepeatedWithoutProgress` steigt und die längste No-Progress-Kette wächst von `74` auf `84`. Der Candidate macht lokal mehr plausible Konversionen, löst aber einzelne lange Sequenzen schlechter auf.

### Snapshot Pressure

Runner-Steals steigen `26 -> 29`, Score/Steal pro Match steigt und `actionsUntilNextScoreOrSteal` sinkt. Gleichzeitig fallen `actionLedToProgressWithin3` und `planIntentConverted`, während Plan-Abbruch, Same-Plan-Repeat und Max-No-Progress steigen. Das spricht für bessere Endpunkte in einigen Seeds, aber schlechtere Zwischenkonversion.

### Snapshot Holdout

ActionLimit verbessert sich `0.667 -> 0.556`, Runner-Steals und Remote Trash steigen. Die Planfolgewerte verschlechtern sich aber: mehr Abandoned, mehr Same-Plan-Repeat, längere No-Progress-Ketten. Die Ergebnisverbesserung ist real, aber nicht durch durchgehend bessere Conversion-Qualität erklärt.

### Local Realistic Pair 1

Pair 1 bleibt der Sonderfall. Runner-Steals steigen leicht `9 -> 10`, Scores bleiben gleich, Safety bleibt stabil. Gleichzeitig steigen `planIntentAbandoned` `252 -> 281`, `samePlanRepeatedWithoutProgress` `100 -> 107`, `turnsWithNoProgress` `47 -> 53` und die durchschnittliche No-Progress-Kette `5.769 -> 6.056`.

Die häufigsten No-Progress-Anteile sind beidseitig:

- Runner: `safe_probe_run`, `pressure_hq`, `pressure_rnd`, `recover_economy`, `contest_remote`.
- Corp: `recover_economy`, `protect_hq`, `protect_rnd`, Remote-Install/End-Turn-Sequenzen.
- Viele einzelne Trace-Einträge sind `unknown`, vor allem `continue_run`, `access_card`, `end_turn`, `mandatory_draw` und Reaktionsfenster. Das ist kein Hidden-Info-Problem, sondern Granularität in der Action-Trace-Erklärung.

Top-Ketten bleiben im Candidate praktisch identisch zum Baseline: lange Sequenzen aus Corp-Ende/Draw/Protect/Economy gefolgt von Runner-R&D/HQ-Probes, Decline-Rez, Jack-Out oder Access ohne Score/Steal-Wert. Pair 1 ist daher eher beidseitige Planfolge-Stagnation als ein isolierter Runner-Central-Fehler.

### Local Realistic Pair 2

Praktisch unverändert. ActionLimit, Steals, Scores, Conversion, Repeat-Werte und zentrale Pressure-Konversion bleiben identisch oder fast identisch. Das bestätigt den früheren Befund: Die neue Logik triggert dort kaum anders, weil die vorhandene Interface-/Central-Linie bereits stabil ist oder beide Profile dieselben sichtbaren Entscheidungen treffen.

## Top No-Progress-Muster

Die längsten Ketten kommen nicht aus einem einzigen Plan:

- `Runner pressure_rnd / pressure_hq -> access -> pressure_hq -> access -> end_turn`, ohne Steal oder Fresh-Value-Signal.
- `Corp mandatory_draw -> protect_hq/protect_rnd -> recover_economy -> end_turn`, ohne zeitnahe Score-Konversion.
- `Runner recover_economy -> recover_economy -> end_turn`, teils ohne nachfolgende Contest-/Run-Konversion.
- `Remote build / score_next_turn` tritt auf, konvertiert aber nicht immer in Score oder zwingenden Runner-Fortschritt.
- Run-Mikroaktionen wie `continue_run`, `pump_breaker`, `break_subroutine`, `access_card` füllen Ketten, zählen aber bewusst nicht als Fortschritt, wenn kein Steal/Trash/Fresh-/Multiaccess-Wert entsteht.

Die schlechtest konvertierenden Planfamilien in den langen Ketten sind:

- Runner: `safe_probe_run`, `pressure_hq`, `pressure_rnd`, `recover_economy`, `contest_remote`.
- Corp: `recover_economy`, `protect_hq`, `protect_rnd`, `score_next_turn`/`build_scoring_remote`.
- Nicht klassifizierte Folgeaktionen: `unknown` dominiert, weil Reaktionsfenster, End-Turns und Run-Mikroaktionen keinen stabilen Planintent tragen.

## Local Pair 1 Detail

Pair 1 ist nicht durch No-Fresh-Central allein erklärbar:

- `noFreshCentralRunsTaken` bleibt `2 -> 2`.
- `noFreshCentralSubstitutions` steigt `10 -> 12`.
- `repeatedLowValueCentralRuns` bleibt `15 -> 15`.
- `centralPressureConvertedToSteal` fällt `4 -> 3`.
- `remoteBuildConvertedToAdvanceOrScore` bleibt `8 -> 8`.
- `advanceConvertedToScore` bleibt `10 -> 10`.

Der Candidate bekommt also mehr Einzel-Fortschritt und einen Steal mehr, aber bezahlt mit mehr abgebrochenen Planintents und längeren Stagnationsphasen. Das spricht gegen eine weitere kleine Central-Gewichtskorrektur. Der nächste Slice sollte Planabschluss und Abbruchbedingungen über mehrere konkrete Folgeaktionen prüfen.

## Regressions- und Side-Effect-Bewertung

- Safety: stabil, keine IllegalActions, ReplayFailures oder Timeouts im Candidate.
- Runner-Steals: kein starker Einbruch. Snapshot Pressure, Snapshot Holdout und Local Pair 1 steigen; Smoke, Snapshot Rig und Local Pair 2 bleiben gleich.
- Corp-Scores: kein Hinweis, dass bessere Scores nur durch Runner-Passivität entstehen. Scores bleiben meist gleich; Snapshot Pressure fällt `9 -> 8`.
- ActionLimit: bleibt Hauptproblem. Verbesserung nur im Snapshot-Holdout, Verschlechterung im Snapshot Rig, sonst unverändert.
- Reserve-/No-Fresh-Passivität: nicht als Hauptursache sichtbar. No-Fresh-Runs bleiben niedrig; Pair 1 stagniert trotz Substitution.
- Konflikte: Economy-Reserve, Remote-Contest und Central-Pressure konkurrieren weiterhin in der Planfolge. Sie erzeugen lokal plausible Actions, aber nicht zuverlässig Score/Steal/Trash-Konversion.
- Corp Advance/Protection/Score: Score-Windows werden nicht verpasst, aber Remote-Build- und Protect-Phasen bleiben nicht immer in Score-Fortschritt eingebettet.

## Empfehlung

Nächste Strategie-Slices sollten nicht weitere Einzelgewichte sein, sondern Planabschluss-Slices:

1. **Plan-Continuation/Abort Slice**: Wenn eine Planlinie begonnen wurde, soll die KI in den nächsten 1 bis 3 eigenen Aktionen prüfen, ob der Plan konkret konvertiert oder abgebrochen werden muss.
2. **Run-Outcome Follow-up Slice**: Nach Access/Jack-Out/No-Value-Run soll die Folgeentscheidung explizit zwischen erneutem Run, Pivot zu Economy/Rig/Remote und End-Turn unterscheiden.
3. **Corp Remote-Build-to-Score Slice**: Remote-Build, Protect und Advance sollen stärker als kurze Score-Kette bewertet werden, inklusive Abbruch, wenn die Remote nicht mehr scorable oder zu riskant ist.

Keine Empfehlung für den nächsten Schritt: weitere kleinteilige Central-Pressure- oder No-Fresh-Gewichte.
