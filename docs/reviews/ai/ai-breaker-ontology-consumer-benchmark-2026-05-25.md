# Breaker-Ontology-Consumer-Benchmark 2026-05-25

## Kurzfazit

Der BreakerProfile/CostProfile-Consumer aus `570923c6` ist im aktuellen
8-Slot-Lauf safety-stabil: `illegalActions = 0`, `replayFailures = 0` und
`timeoutRate = 0` in allen Candidate-Slots. Cheap-Remote-Safety bleibt im
Candidate hart (`corpAgendaInstalledInCheaplyContestableRemote = 0`,
`corpAdvanceInCheaplyContestableRemote = 0`).

Die Suite zeigt keinen klaren Fix-Bedarf am Consumer selbst. Der Candidate
verbessert Corp Scores insgesamt (`54 -> 64`) und senkt Runner Steals
(`140 -> 124`), verschlechtert aber die gewichtete ActionLimitRate leicht
(`33/72 -> 34/72`, ca. `0.458 -> 0.472`). Die Verschlechterung konzentriert
sich weiterhin auf `local_realistic_pair_2`; das ist ein bekanntes
Tag/Punish-/Stagnationswarnsignal, kein spezifischer Breaker-Ontology-Crash.

Wichtige Einschränkung: Die vom Check angefragten Breaker-Ontology-Metriken
wie `runnerBreakerOntologyProfilesSeen` oder
`corpRemoteSafetyUsedRunnerBreakerOntology` existieren noch nicht als
First-Class-Summary-Felder. Sichtbar ist die Nutzung aktuell vor allem über
Evidence-/Reason-Strings wie `structured_breaker_profile_contest_fallback`.

## Test- und Benchmarkkonfiguration

- Workspace: `C:\Projekte\NETGRID-ai-optimization-diagnosis`
- Branch: `codex/ai-legal-action-diagnosis`
- geprüfter Commit: `570923c6 ai: consume breaker ontology profiles`
- Suite: `runMatchProgressionBenchmarkSuite`
- Profile: `belief_ai_v1_4_2` vs. `current_candidate`
- Seeds: 9 (`ai-v143-tuning-001` bis `006`, `ai-v143-holdout-001` bis `003`)
- `maxActions`: `160`
- Slots: Smoke, Snapshot Rig, Snapshot Pressure, Snapshot Holdout, Local Pair 1,
  Local Pair 2, Real Scene Pair 1, Real Scene Pair 2
- Real-Scene-Paare: `holdout_only`, nur berichtet
- Temporärer Vitest-Harness: nach dem Lauf gelöscht

Der Lauf vergleicht Profile auf dem aktuellen Code. Er ist daher ein
Safety-/Profilvergleich mit aktivem Consumer in beiden Profilen, kein isolierter
Vorher/Nachher-Vergleich gegen den Stand vor `570923c6`.

## Guardrails

| Metric                                       |      Baseline |     Candidate |    Delta |
| -------------------------------------------- | ------------: | ------------: | -------: |
| Games                                        |            72 |            72 |        0 |
| ActionLimitRate                              | 33/72 = 0.458 | 34/72 = 0.472 | +1 Match |
| Runner Steals                                |           140 |           124 |      -16 |
| Corp Scores                                  |            54 |            64 |      +10 |
| Illegal Actions                              |             0 |             0 |        0 |
| Replay Failures                              |             0 |             0 |        0 |
| Timeout Rate                                 |             0 |             0 |        0 |
| Agenda install in cheaply contestable remote |             0 |             0 |        0 |
| Advance in cheaply contestable remote        |             1 |             0 |       -1 |
| Runs started against known unaffordable path |             9 |            10 |       +1 |
| Pump actions that could not lead to break    |             0 |             0 |        0 |
| Pump actions that destroyed access reserve   |             0 |             0 |        0 |
| Break skipped to preserve trash reserve      |           192 |           184 |       -8 |

Cheap-Remote-Safety ist im Candidate intakt. Die alte Data-Wall/Japanese-Water-
Torture-Härtung zeigt kein Regressionssignal: keine Candidate-Agenda-Install-
oder Advance-Aktion in billig contestbaren Remotes, keine Pump-Aktion ohne
Break-Pfad und keine Pump-Aktion, die die Access-Reserve zerstört.

## Ontology-Nutzung

Die exakten angefragten Breaker-Ontology-Summary-Metriken sind im aktuellen
`AiMatchProgressionMetrics`-Objekt nicht vorhanden:

- `runnerBreakerOntologyProfilesSeen`
- `runnerBreakerOntologyCoverageUsed`
- `runnerBreakerOntologyFallbackUsed`
- `runnerBreakerOntologyConflict`
- `runnerInstallableBreakerRankedByOntology`
- `runnerSearchTargetRankedByOntology`
- `runnerMissingCoverageResolvedByOntology`
- `runnerBreakerOntologySetupSuppressedBecausePressureReady`
- `corpVisibleRunnerBreakerOntologyProfilesSeen`
- `corpRemoteSafetyUsedRunnerBreakerOntology`
- `corpCheapContestDetectedByBreakerOntology`
- `corpRemoteSafetyOntologyConflictWithEffectiveQuote`
- `corpAgendaInstallBlockedByOntologyCheapContest`
- `corpAdvanceBlockedByOntologyCheapContest`
- `breakerOntologyCoverageByType`
- `breakerOntologySideEffectsSeen`
- `breakerOntologyCostProfileSeen`

Evidence-Zählung aus `actionSequence.evidence`:

| Slot              | Baseline `structured_breaker_profile_contest_fallback` | Candidate `structured_breaker_profile_contest_fallback` | Andere strukturierte Breaker-Evidence |
| ----------------- | -----------------------------------------------------: | ------------------------------------------------------: | ------------------------------------- |
| Smoke             |                                                     72 |                                                      79 | 0                                     |
| Snapshot Rig      |                                                     77 |                                                      81 | 0                                     |
| Snapshot Pressure |                                                     76 |                                                      87 | 0                                     |
| Snapshot Holdout  |                                                     77 |                                                      86 | 0                                     |
| Local Pair 1      |                                                     52 |                                                      51 | 0                                     |
| Local Pair 2      |                                                     45 |                                                      62 | 0                                     |
| Real Scene Pair 1 |                                                     82 |                                                      75 | 0                                     |
| Real Scene Pair 2 |                                                     59 |                                                      54 | 0                                     |
| Gesamt            |                                                    540 |                                                     575 | 0                                     |

Interpretation: Der Corp-Fallback für sichtbare Runner-Breakerprofile wird
breit erreicht. Runner-seitige install/search-spezifische Evidence wie
`structured_matching_grip_breakers` oder `structured_breaker_cost_profile:true`
taucht in dieser Suite nicht auf. Das heißt nicht, dass der Codepfad tot ist;
die bestehenden fokussierten Tests decken ihn ab. Für Benchmarkdiagnosen wäre
ein späterer reiner Metrik-Slice sinnvoll, der diese Evidence in stabile
Summary-Felder hebt.

## Candidate vs. Baseline

| Slot              |    ActionLimit | Runner Steals | Corp Scores | Score/Steal pro Match | StrategicLongestNoProgress | SameStrategicPlanRepeated |
| ----------------- | -------------: | ------------: | ----------: | --------------------: | -------------------------: | ------------------------: |
| Smoke             | 0.667 -> 0.667 |      14 -> 13 |     7 -> 10 |        2.333 -> 2.556 |                   32 -> 31 |                  78 -> 76 |
| Snapshot Rig      | 0.222 -> 0.222 |      24 -> 20 |    10 -> 11 |        3.778 -> 3.444 |                   23 -> 42 |                  78 -> 65 |
| Snapshot Pressure | 0.333 -> 0.333 |      28 -> 22 |     9 -> 13 |        4.111 -> 3.889 |                   41 -> 22 |                  55 -> 60 |
| Snapshot Holdout  | 0.556 -> 0.556 |      19 -> 18 |      9 -> 8 |        3.111 -> 2.889 |                   31 -> 15 |                  80 -> 60 |
| Local Pair 1      |         0 -> 0 |        8 -> 9 |      3 -> 3 |        1.222 -> 1.333 |                   32 -> 33 |                  51 -> 52 |
| Local Pair 2      | 0.444 -> 0.667 |      26 -> 20 |      1 -> 4 |        3.000 -> 2.667 |                   34 -> 44 |                129 -> 153 |
| Real Scene Pair 1 | 0.444 -> 0.444 |      14 -> 14 |      8 -> 9 |        2.444 -> 2.556 |                   37 -> 12 |                  60 -> 51 |
| Real Scene Pair 2 | 1.000 -> 0.889 |        7 -> 8 |      7 -> 6 |        1.556 -> 1.556 |                   28 -> 15 |                117 -> 117 |

## Slotanalyse

### Smoke

Safety stabil. ActionLimit bleibt gleich, Corp Scores steigen (`7 -> 10`),
Runner Steals sinken leicht (`14 -> 13`). Candidate startet mehr Central- und
Remote-Pressure, hat aber mehr bekannte unbezahlbare Runs (`2 -> 6`). Kein
Breaker-/Pump-Safety-Problem.

### Snapshot Rig

ActionLimit stabil, Runner Steals sinken (`24 -> 20`), Corp Scores steigen
leicht (`10 -> 11`). Der längste strategische No-Progress-Abschnitt steigt
(`23 -> 42`), während wiederholte gleiche Strategic Plans sinken (`78 -> 65`).
Das ist ein Beobachtungspunkt, aber kein Safety-Regressionssignal.

### Snapshot Pressure

ActionLimit stabil. Candidate verbessert Corp Scores deutlich (`9 -> 13`) und
senkt Runner Steals (`28 -> 22`). Die Baseline hatte einen Advance in billig
contestbarem Remote; Candidate bleibt bei `0`. Bekannte unbezahlbare Runs gehen
auf `0` zurück.

### Snapshot Holdout

ActionLimit stabil. Corp Scores fallen leicht (`9 -> 8`), Runner Steals sinken
leicht (`19 -> 18`). Strategische No-Progress-Signale verbessern sich deutlich.
Da Holdout-only, nur Warnsignal und kein Tuning-Ziel.

### Local Pair 1

ActionLimit bleibt bei `0`. Runner Steals steigen leicht (`8 -> 9`), Corp
Scores bleiben stabil. Candidate erzeugt mehr Central-/R&D-/Remote-Pressure,
ohne Cheap-Remote- oder Breaker-Safety-Verletzung.

### Local Pair 2

Hauptwarnsignal. ActionLimit verschlechtert sich (`0.444 -> 0.667`), obwohl
Runner Steals sinken (`26 -> 20`) und Corp Scores steigen (`1 -> 4`). Die
strategischen Stagnationssignale steigen (`34 -> 44`,
`129 -> 153`). Gleichzeitig sinken bekannte unbezahlbare Runs (`3 -> 0`).
Das passt zur bisherigen Diagnose: mehr Schutz und bessere Corp-Disziplin,
aber weiter fehlender terminaler Score-/Tag-Punish-Druck.

### Real Scene Pair 1

Holdout-only, stabil bis positiv: ActionLimit unverändert, Runner Steals gleich,
Corp Scores `8 -> 9`, strategische No-Progress-Signale sinken deutlich.

### Real Scene Pair 2

Holdout-only. ActionLimit verbessert sich (`1.000 -> 0.889`), Corp Scores sinken
leicht (`7 -> 6`), Runner Steals steigen leicht (`7 -> 8`). Bekannte
unbezahlbare Runs steigen (`1 -> 4`), aber es gibt keine illegalen Aktionen,
keine Replay-Fehler und keine Pump-/Reserve-Verletzung.

## Regressionssignale

- Kein Safety-Regressionssignal.
- Kein Cheap-Remote-Safety-Regressionssignal.
- Kein Konflikt mit `effectiveRunQuote` als First-Class-Metrik sichtbar; ein
  entsprechendes Summary-Feld existiert noch nicht.
- Local Pair 2 bleibt das zentrale ActionLimit-Warnsignal.
- `runsStartedAgainstKnownUnaffordablePath` steigt global minimal (`9 -> 10`),
  getrieben durch Smoke und Real Scene Pair 2, während Snapshot Pressure und
  Local Pair 2 sich verbessern. Das ist beobachtungswürdig, aber kein klarer
  Breaker-Ontology-Fix-Bug.
- Runner-seitige Ontology-Nutzung ist im Benchmark nicht als First-Class-Metrik
  sichtbar. Für belastbare spätere Vergleiche fehlen dedizierte Summary-Felder.

## Empfehlung

Den BreakerProfile/CostProfile-Consumer behalten. Er bleibt safety-stabil, hält
Cheap-Remote-Safety, und die Profile mit aktivem Consumer zeigen in Summe mehr
Corp Scores und weniger Runner Steals. Ein sofortiger Fix-Slice am Consumer ist
nicht gerechtfertigt.

Nächster sinnvoller Schritt: ein kleiner Diagnose-Metrik-Slice für
Breaker-Ontology-First-Class-Metriken, falls die Wirkung in Benchmarks künftig
präziser verfolgt werden soll. Strategisch als nächster Consumer-Slice ist eher
`RemoteRole` für Corp-Remote-/Upgrade-Disziplin oder ein enger Tag/Punish-Funnel-
Consumer sinnvoll; beide sollten separat und nicht auf Holdouts optimiert
werden.
