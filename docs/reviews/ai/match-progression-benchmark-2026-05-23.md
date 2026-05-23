# AI Match Progression Benchmark 2026-05-23

Quelle: `runMatchProgressionBenchmark` aus `packages/ai/src/index.ts`

Konfiguration:

- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- Vergleichsprofile: `basic_corp_ai`, `basic_runner_ai`, `belief_ai_v1_4_2`, `current_candidate`
- Seeds: 6 Tuning-Seeds plus 3 Holdout-Seeds
- Runner-Deck: `demo_runner_008`
- Corp-Deck: `demo_corp_008`
- Max Actions: 80
- Laufzeit lokal: ca. 7,4 Sekunden
- Gate-Modus: `diagnostic_only`

## Progression Metrics

| Metric                          | Baseline | Candidate | Delta |
| ------------------------------- | -------: | --------: | ----: |
| actionLimitRate                 |    0.889 |     0.889 |     0 |
| averageActions                  |   76.444 |    76.444 |     0 |
| averageTurns                    |    9.111 |     9.222 | 0.111 |
| runnerAgendaPoints              |       31 |        31 |     0 |
| corpAgendaPoints                |       13 |        13 |     0 |
| runnerSteals                    |       14 |        14 |     0 |
| corpScores                      |        5 |         5 |     0 |
| scoreOrStealActionsPerMatch     |    2.111 |     2.111 |     0 |
| centralPressureRuns             |       44 |        43 |    -1 |
| remotePressureRuns              |       30 |        30 |     0 |
| successfulCentralRuns           |       41 |        38 |    -3 |
| successfulRemoteRuns            |       28 |        28 |     0 |
| remoteTrashActions              |        1 |         1 |     0 |
| remoteContestActions            |       31 |        31 |     0 |
| remoteInstalls                  |       48 |        49 |     1 |
| remoteRootInstalls              |       24 |        24 |     0 |
| remoteIceInstalls               |       24 |        25 |     1 |
| remoteAdvances                  |        0 |         0 |     0 |
| scoringRemoteDevelopmentActions |       66 |        67 |     1 |
| rezIceDuringRun                 |       18 |        18 |     0 |
| scoreWindows                    |        5 |         5 |     0 |
| turnsToFirstCorpScore           |      6.5 |       6.5 |     0 |
| turnsToFirstAgendaSteal         |    2.857 |     2.857 |     0 |

## Profile Comparison

| Profile           | Action Limit Rate | Avg Turns | Score/Steal per Match | Remote Installs | Remote Advances | Run-window Rez | Successful Central Runs | Successful Remote Runs | Remote Trash | Illegal Actions | Replay Failures |
| ----------------- | ----------------: | --------: | --------------------: | --------------: | --------------: | -------------: | ----------------------: | ---------------------: | -----------: | --------------: | --------------: |
| basic_corp_ai     |             0.889 |    12.667 |                 2.333 |              41 |               0 |              8 |                      24 |                     39 |            3 |               0 |               0 |
| basic_runner_ai   |             0.889 |    10.444 |                 1.667 |              49 |               0 |             11 |                      40 |                     65 |            6 |               0 |               0 |
| belief_ai_v1_4_2  |             0.889 |     9.111 |                 2.111 |              48 |               0 |             18 |                      41 |                     28 |            1 |               0 |               0 |
| current_candidate |             0.889 |     9.222 |                 2.111 |              49 |               0 |             18 |                      38 |                     28 |            1 |               0 |               0 |

## Safety Metrics

| Metric         | Baseline | Candidate |  Delta |
| -------------- | -------: | --------: | -----: |
| illegalActions |        0 |         0 |      0 |
| replayFailures |        0 |         0 |      0 |
| fallbackRate   |    0.017 |     0.015 | -0.002 |
| timeoutRate    |        0 |         0 |      0 |

## Befund

`current_candidate` bleibt side-safe und replay-stabil, verbessert die Matchprogression gegenüber `belief_ai_v1_4_2` aber nicht. Beide Profile erreichen in 8 von 9 Spielen das Action-Limit. Score-/Steal-Aktivität liegt bei 2,111 Aktionen pro Match und ist zwischen Baseline und Candidate identisch.

Die Korp baut Remotes sichtbar auf: 49 Remote-Installationen, davon 24 Root- und 25 ICE-Installationen. Es gibt außerdem 18 Rez-Aktionen in Run-Fenstern. Trotzdem bleiben Remote-Advances bei 0. Das spricht für Aufbau und Rez-Reaktion ohne stabilen Advance-/Score-Horizont.

Der Runner erzeugt Remote-Druck: 30 Remote-Runs und 28 erfolgreiche Remote-Run-/Access-Signale. Daraus entsteht aber nur eine Remote-Trash-Aktion. Zentraldruck ist ebenfalls vorhanden, fällt beim Candidate gegenüber der Belief-Baseline leicht ab.

## Sinnvolle nächste Strategiepakete

1. Corp: Ein kleiner side-sicherer Advance-/Score-Horizont für bereits gebaute Remotes. Zielmetrik: `remoteAdvances > 0`, mehr `corpScores`, geringere Action-Limit-Rate.
2. Runner: Remote-Contest- und Trash-Bewertung nach erfolgreichem Remote-Access. Zielmetrik: mehr `remoteTrashActions` bei stabiler Safety.
3. Beide Seiten: Action-Limit-Stagnation über 1- bis 2-Zug-Pläne messen und reduzieren, ohne LegalActions zu erzwingen. Zielmetrik: niedrigere `actionLimitRate` und höhere Score-/Steal-Aktivität pro Match.

## Grenzen

Der Lauf ist diagnostisch. `successfulCentralRuns` und `successfulRemoteRuns` werden aus öffentlichen Start-Run- plus Access-/Steal-/Trash-Aktionsfolgen abgeleitet; sie sind Progressionssignale, keine neue Engine-Regel. Es wurde keine KI-Strategie verändert.
