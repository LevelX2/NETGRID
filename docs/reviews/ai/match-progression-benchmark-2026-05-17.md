# AI Match Progression Benchmark Report

Datum: 2026-05-17

Quelle: `runMatchProgressionBenchmark` aus `packages/ai/src/index.ts`

Konfiguration:

- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- Seeds: 6 Tuning-Seeds, ohne Holdout
- Runner-Deck: `demo_runner_008`
- Corp-Deck: `demo_corp_008`
- Max Actions: 20
- Gate-Modus: `diagnostic_only`

## Progression Metrics

| Metric | Baseline | Candidate | Delta |
| --- | ---: | ---: | ---: |
| actionLimitRate | 1 | 1 | 0 |
| averageActions | 20 | 20 | 0 |
| runnerAgendaPoints | 2 | 2 | 0 |
| corpAgendaPoints | 0 | 0 | 0 |
| runnerSteals | 1 | 1 | 0 |
| corpScores | 0 | 0 | 0 |
| centralPressureRuns | 6 | 5 | -1 |
| remotePressureRuns | 4 | 9 | 5 |
| pressureTargetSwitches | 7 | 5 | -2 |
| remoteRootInstalls | 4 | 3 | -1 |
| remoteIceInstalls | 0 | 0 | 0 |
| remoteAdvances | 0 | 0 | 0 |
| scoreWindows | 0 | 0 | 0 |

## Safety Metrics

| Metric | Baseline | Candidate | Delta |
| --- | ---: | ---: | ---: |
| illegalActions | 0 | 0 | 0 |
| replayFailures | 0 | 0 | 0 |
| fallbackRate | 0.017 | 0.017 | 0 |
| timeoutRate | 0 | 0 | 0 |

## Befund

Der Benchmark bestätigt das P0-Signal aus der AI-Capability-Analyse: `current_candidate` bleibt side-safe und replay-stabil, erzeugt im kurzen Diagnosefenster aber keine bessere Matchprogression als `belief_ai_v1_4_2`. Beide Profile laufen in allen sechs Tuning-Seeds in das Action-Limit. Runner-Steals treten nur einmal aggregiert auf, Korp-Scoring und Remote-Advances bleiben bei 0.

Der Candidate erzeugt mehr Remote-Druckläufe als die Baseline (`+5`), aber weniger Zielwechsel (`-2`) und keine zusätzlichen Score-/Advance-Fenster. Das spricht eher für verlagerten Druck als für echten Matchabschluss-Fortschritt.

## Grenzen

Der Lauf ist bewusst klein und diagnostisch. Er ist kein Release-Gate, keine Winrate-Aussage und keine vollständige KI-Liga. Er soll P1-Tuning vergleichbar machen, ohne die normalen Safety-Tests zu verlängern oder zu destabilisieren.

## Empfohlene Folgepakete

- Runner-Planung: zwei Züge Rig/Economy vor Zentraldruck messen und verbessern.
- Korp-Planung: Remote-Aufbau mit Rez-Reserve, Advance-Fenstern und Score-Abschluss messen.
- Benchmark-Ausbau: dieselben Progression-Metriken für längere manuelle Läufe mit Holdout-Seeds reporten, sobald erste Tuning-Slices vorliegen.
