# AI Strategy Slices Consolidation Review 2026-05-23

Status: Konsolidierte Review
Scope: Diagnose und Bilanz, keine neue Strategie-Heuristik
Workspace: `C:\Projekte\NETGRID-ai-optimization-diagnosis`
Branch: `codex/ai-legal-action-diagnosis`

## Kurzfazit

Die letzten KI-Slices haben die Safety- und Diagnosebasis klar verbessert und mehrere echte Progressionsfehler reduziert. Die stärksten fachlichen Verbesserungen kamen aus Corp-Advance-/Score-Horizont, Corp-Protection, Runner-Draw-/Hand-/Duplicate-Discipline und Runner-Remote-Contest-Targeting. Einige spätere Runner-Central-Slices waren wichtig, aber stärker diagnostisch: Sie machen Closeout, Repeat und No-Fresh-Fenster erklärbarer, erzeugen aber im aktuellen Deck-Suite-Benchmark keinen klaren neuen Progressionssprung.

`current_candidate` ist gegenüber den Basic-Profilen deutlich kontrollierter und safety-stabil. Gegenüber `belief_ai_v1_4_2` ist es aber nicht durchgehend stärker. Auf Snapshot Pressure verbessert sich Runner-Progression; Snapshot Rig verbessert RepeatLow, verliert aber einen Corp-Score; Snapshot Holdout und Local Pair 2 bleiben nahezu stabil; Local Pair 1 bleibt ein Sonderproblem und verschlechtert im aktuellen Lauf die ActionLimitRate von `0.556` auf `0.667`, ohne Runner-Steals oder Corp-Scores zu verbessern.

Der wichtigste offene Befund ist nicht mehr "Runner läuft stale Central zu oft". Im letzten Slice liegt `noFreshCentralRunsTaken` in Local Pair 1 weiter bei `2`, aber die No-Fresh-Fenster werden überwiegend substituiert. Das Restproblem wirkt wie ein Progressions-/Planfolgenproblem: Aktionen sind einzeln plausibel, schließen Matches aber zu selten ab.

## Methodik

Aktueller Lauf:

- Funktion: `runMatchProgressionBenchmarkSuite`
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- Vergleichsprofile: `basic_corp_ai`, `basic_runner_ai`, `belief_ai_v1_4_2`, `current_candidate`
- Seeds: 6 Tuning-Seeds plus 3 Holdout-Seeds
- Max Actions: 80
- Slots: Smoke, zwei Snapshot-Tuning-Slots, ein Snapshot-Holdout, zwei Frozen Local-Realistic-Holdouts
- Pending: zwei Real-Scene-Holdouts ohne vollständige versionierte Decklisten

Zusätzlich wurden die vorhandenen Review-Artefakte genutzt:

- `docs/reviews/ai/ai-benchmark-deck-basis-review-2026-05-23.md`
- `docs/reviews/ai/match-progression-benchmark-2026-05-23.md`
- `docs/reviews/ai/match-progression-deck-suite-benchmark-2026-05-23.md`
- vorherige Slice-Berichte aus dem Arbeitsverlauf

Eine echte Code-Ablation wurde nicht durchgeführt. Es gibt für die neuen Heuristikgruppen keine saubere Flag-Struktur, und eine temporäre Patch-Orgie würde mehr Risiko als Erkenntnis erzeugen. Die Ablation-light-Bewertung stützt sich deshalb auf vorhandene Profile, aktuelle Profile-Vergleiche und dokumentierte Vorher/Nachher-Tabellen.

## Slice-Bilanz

| Slice                                                          | Ursprünglicher Befund                                                                                              | Haupttyp                   | Verbesserte Signale                                                                                                                              | Verschlechterte oder offene Signale                                                                | Safety-Kosten                                                  | Konsistenz                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| AI-Simulation/Server-Side-Resolver activeSide vs LegalActions  | AI musste auch in Fenstern handeln, in denen `activeSide` und LegalActions-Seite auseinanderlaufen konnten.        | LegalAction-/Timingproblem | Resolver bleibt an aktuelle LegalActions gebunden; root-rez/window-Fälle wurden spielbar.                                                        | Keine direkte Progression-Verbesserung.                                                            | Keine; LegalAction- und `applyAction`-Vertrag bleibt erhalten. | Safety-fixture, nicht deckprogressionsgetrieben.                                |
| AI-Hints-/Support-Contract inklusive Toughonium Wall           | AI-Support und Kartenrollen mussten systematischer und side-sicher werden.                                         | Support-/Contract-Problem  | Besserer Contract für `ai_supported`, Toughonium-Wall-Entscheidung abgesichert.                                                                  | Keine isolierte Matchprogression-Messung.                                                          | Keine.                                                         | Primär Karten-/Supportqualität, nicht Benchmark-Progression.                    |
| Fokussierte AI-Hint-Qualitätsrunde                             | Einzelne Rollen/Hints waren zu grob oder fehlend.                                                                  | Daten-/Diagnoseproblem     | Rollenbasis für Planer verbessert; Support-Smokes stabil.                                                                                        | Kein sauber isolierter Stärkeeffekt.                                                               | Keine.                                                         | Wirkt breit, aber indirekt.                                                     |
| Deck-Suite mit Snapshot- und Frozen Local-Realistic-Holdouts   | Demo-Decks waren zu schwach als Progression-Benchmark.                                                             | Deckbasis-/Messproblem     | Smoke, Snapshot-Tuning, Snapshot-Holdout und lokale realistische Holdouts getrennt; kein Demo-Fallback.                                          | Real-Scene-Holdouts bleiben pending.                                                               | Keine.                                                         | Starke Messverbesserung, keine Strategieänderung.                               |
| Corp Remote-Advance-/Score-Metrik und kleiner Advance-Horizont | Corp baute Remotes, advancete/scorte aber zu selten.                                                               | Strategie + Metrik         | `remoteAdvances`, `corpScores`, `scoreWindowActions`, `scoreActionTakeRate` wurden messbar.                                                      | ActionLimitRate blieb hoch; Runner kann viele Fortschritte trotzdem contesten.                     | Keine.                                                         | Echte Progression, besonders gegen Basic-Runner und in Snapshot-Slots sichtbar. |
| Corp Score-Conversion-Diagnose                                 | Score-Fenster und Conversion waren zu grob gemessen.                                                               | Metrik-/Diagnoseproblem    | Score/Steal, Score-Windows, scorebare Remote-Linien besser erklärbar.                                                                            | Ohne Strategie nur begrenzter Fortschritt.                                                         | Keine.                                                         | Hilfreich als Grundlage für folgende Corp-Slices.                               |
| Corp Remote-Protection / Contest-Risk vor Final Advance        | Corp final-advancete teils zu offen oder ohne Rez-/Contest-Bewertung.                                              | Strategie                  | Protected Final Advances und Remote-Protection-Scores wurden plausibler.                                                                         | Kann Scores verzögern, wenn Protection übervorsichtig wird.                                        | Keine.                                                         | Echte Härtung, aber abhängig von Deck/Runner-Druck.                             |
| Runner Draw-/Hand-/Duplicate-Install-Discipline                | Exzessiver Draw und Low-Value-Duplicate-Installs erzeugten Stillstand.                                             | Strategie + Metrik         | Draw fiel in früheren Runs von hohen Werten stark ab, Local Pair 1 von 54 auf 1; Low-Value-Duplicate in Pair 1 von 1 auf 0.                      | Einzelne Snapshot-Slots verloren zeitweise Runner-Steals oder erhöhten Corp-Scores.                | Keine.                                                         | Einer der klarsten Runner-Gewinne; breit sichtbar.                              |
| Runner Remote-Trash-/Opportunity-Diagnose                      | Remote-Trash wirkte niedrig, Ursache unklar.                                                                       | Primär Diagnose            | Relevante bezahlbare Trash-Gelegenheiten werden genommen; `skippedAffordableRelevantRemoteTrash = 0` in betroffenen Slots.                       | Niedriger Trash kommt oft von Opportunity/Targeting, nicht Choice.                                 | Keine.                                                         | Diagnose korrigiert Fehlinterpretation, nur begrenzt Strategieeffekt.           |
| Runner Economy Reserve / Known-Path-Affordability              | Runner verbrannte Cashpool und lief bekannte unbezahlbare Pfade.                                                   | Strategie + Metrik         | Known unaffordable runs und schlechte Reserve-Starts wurden reduziert; Reserve-Metriken sichtbar.                                                | Cashpool bleibt knapp; Reserve kann Passivität fördern.                                            | Keine.                                                         | Nützlich, aber mit möglichem Tempo-Tradeoff.                                    |
| Runner Remote-Contest Targeting plus Post-Run-Reserve          | Alte Skip-Metriken zählten mehrfach; contestbare Remote-Threats wurden nicht sauber unterschieden.                 | Strategie + Metrik         | Deduplizierte `advancedRemoteThreatContestRate` in beiden Local-Holdouts 1.000 in früherem Lauf; Post-run reserve blockte nicht mehr fälschlich. | Alte `skippedAdvancedRemoteContest` bleibt hoch als Fensterzähler; Snapshot-Tuning nicht perfekt.  | Keine.                                                         | Echte Verbesserung, besonders Holdouts.                                         |
| Runner Central Pressure / Multiaccess / Endgame Conversion     | Zentraldruck war nicht pauschal zu selten, aber Interface/Multiaccess und Wiederholungen waren schlecht erklärbar. | Strategie + Metrik         | Zentraldruck wurde kontextabhängiger; Interface-/Multiaccess-Nutzung messbar.                                                                    | Local Pair 1 blieb auffällig; Steals/Run teils gemischt.                                           | Keine.                                                         | Gemischt; gut für Erklärbarkeit, kein sicherer Progressionssprung.              |
| Closeout-/Repeat-Dedupe-Kalibrierung                           | `centralCloseoutOpportunities` war zu breit und mehrfach gezählt.                                                  | Metrik + kleine Strategie  | Raw/Deduped/True Closeout; Closeout-False-Positive-Rate sinkt in mehreren Slots.                                                                 | Closeout-Erfolge bleiben oft 0; RepeatLow nicht überall besser.                                    | Keine.                                                         | Vor allem Messkorrektur und Guardrail.                                          |
| No-Fresh-Central-Substitution                                  | Stale Central wurde bestraft, aber Alternativen wurden nicht gezielt gewählt.                                      | Strategie + Diagnose       | No-Fresh-Fenster, Substitutionen und Typen messbar; Economy/Setup/Rig/Pressure-Alternativen werden gezielt bevorzugt.                            | Im aktuellen 80er-Lauf kein klarer Progressionsgewinn; Local Pair 1 ALR schlechter gegen Baseline. | Keine.                                                         | Diagnostisch gut, strategisch neutral bis gemischt.                             |

## Aktuelle Baseline-vs-Candidate-Gesamttabelle

Werte zeigen `current_candidate` im vollständigen aktuellen Lauf.

| Slot                                          |   ALR | RunnerSteals | CorpScores | ScoreSteal/Match | RemoteAdv | ScoreConv | AdvSteals | ContestRate | RemoteTrash | AvgCred | EndCred | Draw | Dup | LowDup | CentralSteal/Run | RepeatLow | NFTaken | NFSub | Illegal | Replay | Timeout |
| --------------------------------------------- | ----: | -----------: | ---------: | ---------------: | --------: | --------: | --------: | ----------: | ----------: | ------: | ------: | ---: | --: | -----: | ---------------: | --------: | ------: | ----: | ------: | -----: | ------: |
| `safety_smoke_demo_008`                       | 0.778 |           14 |          4 |            2.000 |        29 |     1.000 |         7 |       0.833 |           1 |   4.114 |   4.053 |    4 |   0 |      0 |            0.114 |         3 |       3 |    13 |       0 |      0 |       0 |
| `progression_tuning_origin_rig_vs_tax`        | 0.889 |           19 |          6 |            2.778 |        32 |     1.000 |         7 |       0.706 |           0 |   3.688 |   3.951 |    5 |   0 |      0 |            0.140 |         5 |       1 |     5 |       0 |      0 |       0 |
| `progression_tuning_origin_pressure_vs_tax`   | 0.889 |           21 |          7 |            3.111 |        31 |     1.000 |         7 |       0.750 |           0 |   4.301 |   4.641 |    9 |   0 |      0 |            0.170 |         5 |       1 |    18 |       0 |      0 |       0 |
| `snapshot_holdout_origin_pressure_vs_tag_ops` | 0.889 |           18 |          0 |            2.000 |        20 |     0.000 |        12 |       0.933 |           3 |   2.394 |   2.923 |    3 |   0 |      0 |            0.083 |         2 |       2 |     9 |       0 |      0 |       0 |
| `local_realistic_pair_1`                      | 0.667 |            9 |          1 |            1.111 |        24 |     1.000 |         5 |       1.000 |           4 |   3.904 |   4.054 |    6 |   2 |      1 |            0.075 |         6 |       2 |    10 |       0 |      0 |       0 |
| `local_realistic_pair_2`                      | 0.889 |           17 |          2 |            2.111 |        19 |     1.000 |         6 |       1.000 |           0 |   3.268 |   3.267 |    0 |   1 |      0 |            0.161 |         2 |       1 |    15 |       0 |      0 |       0 |

Delta `current_candidate - belief_ai_v1_4_2`.

| Slot                                          |   ALR | RunnerSteals | CorpScores | ScoreSteal/Match | RemoteAdv | ScoreConv | AdvSteals | ContestRate | RemoteTrash | AvgCred | EndCred | Draw | Dup | LowDup | CentralSteal/Run | RepeatLow | NFTaken | NFSub | Illegal | Replay | Timeout |
| --------------------------------------------- | ----: | -----------: | ---------: | ---------------: | --------: | --------: | --------: | ----------: | ----------: | ------: | ------: | ---: | --: | -----: | ---------------: | --------: | ------: | ----: | ------: | -----: | ------: |
| `safety_smoke_demo_008`                       | 0.000 |           -1 |         -1 |           -0.222 |        -4 |     0.000 |        -1 |      -0.013 |           0 |   0.007 |   0.185 |    0 |   0 |      0 |           -0.002 |         0 |       0 |     1 |       0 |      0 |       0 |
| `progression_tuning_origin_rig_vs_tax`        | 0.000 |            0 |         -1 |           -0.111 |        -2 |     0.000 |         1 |       0.000 |           0 |  -0.007 |  -0.001 |    1 |   0 |      0 |           -0.021 |        -2 |       0 |     0 |       0 |      0 |       0 |
| `progression_tuning_origin_pressure_vs_tax`   | 0.000 |            2 |         -1 |            0.111 |        -3 |     0.000 |         0 |       0.044 |           0 |   0.464 |   0.466 |   -3 |   0 |      0 |            0.019 |         2 |       1 |    -1 |       0 |      0 |       0 |
| `snapshot_holdout_origin_pressure_vs_tag_ops` | 0.000 |            0 |          0 |            0.000 |        -1 |     0.000 |        -2 |      -0.005 |           1 |  -0.432 |  -0.256 |   -1 |   0 |      0 |            0.050 |         1 |       0 |    -1 |       0 |      0 |       0 |
| `local_realistic_pair_1`                      | 0.111 |            0 |          0 |            0.000 |         0 |     0.000 |         0 |       0.000 |           1 |  -0.031 |   0.025 |    0 |   0 |      0 |           -0.012 |         0 |       0 |     2 |       0 |      0 |       0 |
| `local_realistic_pair_2`                      | 0.000 |            0 |          0 |            0.000 |         0 |     0.000 |         0 |       0.000 |           0 |   0.000 |   0.000 |    0 |   0 |      0 |            0.000 |         1 |       0 |     0 |       0 |      0 |       0 |

## Profilvergleich und Ablation light

| Slot                                          | Profile             |   ALR | RunnerSteals | CorpScores | ScoreSteal/Match | RemoteAdv | RemoteTrash | RepeatLow | NFTaken | NFSub | Illegal | Replay | Timeout |
| --------------------------------------------- | ------------------- | ----: | -----------: | ---------: | ---------------: | --------: | ----------: | --------: | ------: | ----: | ------: | -----: | ------: |
| `safety_smoke_demo_008`                       | `basic_corp_ai`     | 0.889 |            5 |         16 |            2.333 |        62 |           3 |         2 |       2 |    30 |       0 |      0 |       0 |
| `safety_smoke_demo_008`                       | `basic_runner_ai`   | 0.889 |           12 |          0 |            1.333 |         5 |           4 |        23 |      19 |     4 |       0 |      0 |       0 |
| `safety_smoke_demo_008`                       | `belief_ai_v1_4_2`  | 0.778 |           15 |          5 |            2.222 |        33 |           1 |         3 |       3 |    12 |       0 |      0 |       0 |
| `safety_smoke_demo_008`                       | `current_candidate` | 0.778 |           14 |          4 |            2.000 |        29 |           1 |         3 |       3 |    13 |       0 |      0 |       0 |
| `progression_tuning_origin_rig_vs_tax`        | `basic_corp_ai`     | 1.000 |           13 |         13 |            2.889 |        63 |           3 |         3 |       0 |    29 |       0 |      0 |       0 |
| `progression_tuning_origin_rig_vs_tax`        | `basic_runner_ai`   | 0.667 |           21 |          0 |            2.333 |         2 |           2 |        45 |      19 |     0 |       0 |      0 |       0 |
| `progression_tuning_origin_rig_vs_tax`        | `belief_ai_v1_4_2`  | 0.889 |           19 |          7 |            2.889 |        34 |           0 |         7 |       1 |     5 |       0 |      0 |       0 |
| `progression_tuning_origin_rig_vs_tax`        | `current_candidate` | 0.889 |           19 |          6 |            2.778 |        32 |           0 |         5 |       1 |     5 |       0 |      0 |       0 |
| `progression_tuning_origin_pressure_vs_tax`   | `basic_corp_ai`     | 1.000 |           11 |         19 |            3.333 |        78 |           3 |         5 |       4 |    28 |       0 |      0 |       0 |
| `progression_tuning_origin_pressure_vs_tax`   | `basic_runner_ai`   | 0.778 |           25 |          0 |            2.778 |         3 |           3 |        60 |      45 |     2 |       0 |      0 |       0 |
| `progression_tuning_origin_pressure_vs_tax`   | `belief_ai_v1_4_2`  | 0.889 |           19 |          8 |            3.000 |        34 |           0 |         3 |       0 |    19 |       0 |      0 |       0 |
| `progression_tuning_origin_pressure_vs_tax`   | `current_candidate` | 0.889 |           21 |          7 |            3.111 |        31 |           0 |         5 |       1 |    18 |       0 |      0 |       0 |
| `snapshot_holdout_origin_pressure_vs_tag_ops` | `basic_corp_ai`     | 1.000 |           11 |         10 |            2.333 |        55 |           4 |         3 |       2 |    20 |       0 |      0 |       0 |
| `snapshot_holdout_origin_pressure_vs_tag_ops` | `basic_runner_ai`   | 0.889 |           20 |          0 |            2.222 |         1 |           4 |        52 |      48 |     1 |       0 |      0 |       0 |
| `snapshot_holdout_origin_pressure_vs_tag_ops` | `belief_ai_v1_4_2`  | 0.889 |           18 |          0 |            2.000 |        21 |           2 |         1 |       2 |    10 |       0 |      0 |       0 |
| `snapshot_holdout_origin_pressure_vs_tag_ops` | `current_candidate` | 0.889 |           18 |          0 |            2.000 |        20 |           3 |         2 |       2 |     9 |       0 |      0 |       0 |
| `local_realistic_pair_1`                      | `basic_corp_ai`     | 1.000 |            6 |          5 |            1.222 |        38 |           7 |         1 |       2 |    21 |       3 |      0 |       0 |
| `local_realistic_pair_1`                      | `basic_runner_ai`   | 0.889 |           10 |          0 |            1.111 |         1 |          10 |        39 |      29 |     1 |       1 |      0 |       0 |
| `local_realistic_pair_1`                      | `belief_ai_v1_4_2`  | 0.556 |            9 |          1 |            1.111 |        24 |           3 |         6 |       2 |     8 |       0 |      0 |       0 |
| `local_realistic_pair_1`                      | `current_candidate` | 0.667 |            9 |          1 |            1.111 |        24 |           4 |         6 |       2 |    10 |       0 |      0 |       0 |
| `local_realistic_pair_2`                      | `basic_corp_ai`     | 0.889 |           11 |          7 |            2.000 |        48 |           0 |         2 |       3 |    25 |       0 |      0 |       0 |
| `local_realistic_pair_2`                      | `basic_runner_ai`   | 0.667 |           20 |          0 |            2.222 |         2 |           0 |        55 |      37 |     7 |       0 |      0 |       0 |
| `local_realistic_pair_2`                      | `belief_ai_v1_4_2`  | 0.889 |           17 |          2 |            2.111 |        19 |           0 |         1 |       1 |    15 |       0 |      0 |       0 |
| `local_realistic_pair_2`                      | `current_candidate` | 0.889 |           17 |          2 |            2.111 |        19 |           0 |         2 |       1 |    15 |       0 |      0 |       0 |

Interpretation:

- Basic-Corp isoliert grob den Corp-Advance-/Score-Impuls: viele Corp-Scores und RemoteAdvances, aber oft schwache Runner-Gegenwehr und in Local Pair 1 IllegalActions. Das ist kein akzeptables Zielprofil.
- Basic-Runner isoliert grob den alten aggressiven Runner-Druck: viele Steals, fast keine Corp-Scores, aber extrem hohe RepeatLow-/No-Fresh-Taken-Werte und in Local Pair 1 IllegalActions. Das erklärt, warum reine Runner-Aggression kein sauberer Rückweg ist.
- `belief_ai_v1_4_2` und `current_candidate` sind beide safety-stabil. `current_candidate` ist erklärbarer, aber nicht durchgehend stärker.
- Die neuen No-Fresh-Substitutionen sind sichtbar (`NFSub` hoch), aber der aktuelle Lauf zeigt nur selten eine Progressionsverbesserung daraus.

## Slot-spezifische Bewertung

### Smoke

Smoke bleibt safety-stabil: IllegalActions, ReplayFailures und TimeoutRate sind 0. Gegenüber Baseline verliert der Candidate 1 Runner-Steal, 1 Corp-Score, 4 RemoteAdvances und 0.222 Score/Steal pro Match. Das ist keine Progressionsverbesserung, aber auch keine Safety-Regression.

### Snapshot Tuning A: Rig vs Tax

RepeatLow verbessert sich von 7 auf 5. Runner-Steals bleiben stabil bei 19, CorpScores sinken von 7 auf 6, RemoteAdvances von 34 auf 32. Das ist ein kleiner Strategie-/Discipline-Gewinn mit leichtem Score-Conversion-Verlust.

### Snapshot Tuning B: Pressure vs Tax

Runner-Steals steigen von 19 auf 21, Score/Steal pro Match von 3.000 auf 3.111 und CentralStealsPerRun von 0.151 auf 0.170. Gleichzeitig sinken CorpScores 8 auf 7 und RemoteAdvances 34 auf 31. RepeatLow steigt von 3 auf 5. Das ist der stärkste positive Candidate-Slot, aber mit Repeat-Side-Effect.

### Snapshot Holdout

Runner-Steals und CorpScores bleiben stabil. RemoteTrash steigt von 2 auf 3, CentralStealsPerRun steigt von 0.033 auf 0.083, aber RepeatLow steigt von 1 auf 2 und Runner-Credits sinken. Insgesamt stabil bis leicht gemischt.

### Frozen Local Realistic Pair 1

Runner-Steals, CorpScores, Score/Steal, RemoteAdvances und ContestRate bleiben stabil; RemoteTrash steigt 3 auf 4. Die ActionLimitRate verschlechtert sich aber von 0.556 auf 0.667. RepeatLow bleibt 6, No-Fresh-Taken bleibt 2, No-Fresh-Substitution steigt 8 auf 10. Das spricht gegen "stale Central weiter bestrafen" als nächsten Schritt. Pair 1 bleibt ein Progressions-/Planfolgenproblem.

### Frozen Local Realistic Pair 2

Fast alle Werte bleiben identisch: RunnerSteals 17, CorpScores 2, Score/Steal 2.111, RemoteAdvances 19, ContestRate 1.000, No-Fresh-Substitution 15. RepeatLow steigt 1 auf 2. Der Slot scheint bereits eine robuste Interface-/Central-Linie zu haben und wird durch die letzten Slices nicht wesentlich bewegt.

## Gewinner

- Deck-Suite und Frozen-Holdout-Trennung: Ohne diese Messbasis wären viele alte Remote-/Central-Signale falsch interpretiert worden.
- Corp Advance/Score + Protection: Corp kann jetzt sichtbar remote entwickeln und scorebare Linien erzeugen; Basic-Corp-Vergleich zeigt, dass der Mechanismus wirkt, auch wenn Balancing nötig bleibt.
- Runner Draw-/Hand-/Duplicate-Discipline: Der klarste Runner-Fortschritt; exzessiver Draw und Low-Value-Duplicate wurden breit reduziert.
- Runner Remote-Contest Targeting: Deduplizierte contestable Remote-Threats werden deutlich plausibler contestet; Local-Holdouts waren hier stark.
- Safety/Replay: Alle aktuellen Candidate-Slots haben `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`.

## Neutrale oder diagnostische Slices

- Remote-Trash-Diagnose: Wichtig, weil sie zeigte, dass die Trash-Choice selbst nicht das Hauptproblem war.
- Closeout-/Repeat-Dedupe: Wichtig, weil sie überbreite Closeout-Zähler reparierte; strategischer Fortschritt ist gemischt.
- No-Fresh-Central-Substitution: Gute Erklärbarkeit und sichtbare Substitutionen, aber aktuell kein klarer Matchprogressionssprung.
- AI-Hints-/Support-Qualitätsrunden: Wichtig für Kartenfähigkeit und Rollen, aber nicht sauber als Progression-Slice isoliert.

## Mögliche Regressionen und Seiteneffekte

- Runner-Steals brechen nicht breit ein. Es gibt aber Slot-Deltas: Smoke -1, Snapshot Pressure +2, andere stabil.
- CorpScores steigen nicht, weil Runner passiver wurde. Im aktuellen Vergleich sinken CorpScores sogar in Smoke, Snapshot Rig und Snapshot Pressure jeweils um 1.
- ActionLimitRate bleibt hoch und verschlechtert sich in Local Pair 1 von 0.556 auf 0.667. Das ist der wichtigste negative Side-Effect.
- Runner-Reserve- und No-Fresh-Logiken erzeugen keine offensichtliche globale Passivität: RunnerSteals bleiben stabil oder steigen in den meisten relevanten Slots. Trotzdem bleiben hohe ActionLimitRates und viele Economy/Substitution-Fenster ein Zeichen, dass Einzelentscheidungen zu oft nicht in Abschlusslinien konvertieren.
- Local Pair 1 ist weiterhin ein Sonderproblem. Der Slot ist nicht kaputt, aber er ist der beste aktuelle Indikator für Planfolgen-Stagnation.
- Economy-Reserve, Remote-Contest und Central-Pressure stehen in einem echten Spannungsverhältnis: Reserve schützt vor schlechten Runs, kann aber Tempo kosten; Remote-Contest ist dedupliziert gut, aber alte Fensterzähler bleiben hoch; Central-Pressure ist erklärbarer, aber nicht automatisch progressiv.
- Corp-Advance, Corp-Protection und Score-Conversion stehen ebenfalls in Spannung: Protection senkt riskante Scores, kann aber Advance-/Score-Frequenz reduzieren. Die Current-Werte zeigen weniger RemoteAdvances und weniger CorpScores als Baseline in mehreren Slots.

## Verbleibende Hauptprobleme

1. ActionLimitRate bleibt zu hoch. Vier von sechs runnable Slots liegen bei 0.889, einer bei 0.778, Local Pair 1 bei 0.667.
2. Planfolgen sind zu schwach. Viele Entscheidungen sind einzeln plausibel, ergeben aber zu selten Score-/Steal-Abschluss.
3. Local Pair 1 bleibt der wichtigste Holdout-Stresstest: stabile Steals/Scores, mehr RemoteTrash, aber schlechtere ActionLimitRate.
4. Central-Closeout-Erfolge bleiben schwach; bessere Metrik hat nicht automatisch bessere Conversion erzeugt.
5. Corp-Score-Frequenz ist gegenüber Baseline aktuell nicht besser; bei mehreren Slots sinken RemoteAdvances und CorpScores.

## Empfehlung für nächste Strategie-Slices

Maximal drei sinnvolle nächste Slices:

1. **Planfolge-/Conversion-Slice ohne neue Gewichte zuerst als Diagnose**
   Ziel: Warum führen Economy, Rig, Remote-Contest und Central-Substitution nicht häufiger in Score/Steal innerhalb von 1 bis 2 Zügen? Kein neuer Suchbaum, aber klare Sequenzdiagnose: Aktion verbessert Reserve/Rig/Threat-Lage, danach wird die Folgechance genutzt oder verpasst.

2. **Corp Score-Conversion Rebalance**
   Ziel: RemoteAdvances und CorpScores dürfen nicht durch übervorsichtige Protection oder Runner-Reserve-Interaktion sinken. Fokus auf bestehende Corp-Score-/Protection-Logik, nicht neue Corp-Strategiebreite.

3. **Runner Progression Tempo nach Substitution**
   Ziel: Wenn No-Fresh durch Economy/Rig/Setup ersetzt wurde, muss der Runner danach eine konkrete Druck- oder Contestlinie nutzen. Nicht stale Central weiter bestrafen, sondern Follow-up nach Substitution prüfen.

Nicht empfohlen als nächster Slice: weitere kleine Central-Gewichtsanpassung. Der aktuelle Befund stützt das nicht ausreichend.

## Checks

Vor Erstellung dieses Reviews:

- Match-Progression-Deck-Suite-Benchmark vollständig mit `maxActions: 80` ausgeführt.
- Temporärer Benchmark-Harness wurde nach dem Lauf entfernt.

Abschlusschecks für diesen Review sind im Chatabschluss zu vermerken.
