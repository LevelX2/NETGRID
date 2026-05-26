# Breaker-Ontology First-Class Metrics 2026-05-25

## Kurzfazit

Der Slice hebt BreakerProfile-/CostProfile-Nutzung aus ad-hoc
Evidence-Strings in stabile `AiMatchProgressionMetrics`. Es gibt keine
Strategieänderung, keine Action-Score-Änderung, keine neue Legalität und keine
neue Consumer-Anbindung. Die Metriken werden ausschließlich aus der bereits
erzeugten side-safe `actionSequence.evidence` und vorhandenen
Action-Diagnosefeldern aggregiert.

Der wichtigste neue Befund: Die vorher im Review gezählten
`structured_breaker_profile_contest_fallback`-Vorkommen waren
Prefix-Zählungen und enthielten auch `false`-Marker. Die neue First-Class-Metrik
zählt nur echte `...:true`-Fallbacks. In der aktuellen 8-Slot-Suite ist echter
Breaker-Ontology-Fallback `0`; sichtbar ist stattdessen vor allem
`corpVisibleRunnerBreakerOntologyProfilesSeen`. Local Pair 2 kippt damit nicht
wegen Breaker-Ontology-Fallback, sondern bleibt ein bekanntes
Stagnations-/Tag-Punish-Warnsignal.

## Warum der Metrik-Slice nötig war

Der Benchmark nach `570923c6 ai: consume breaker ontology profiles` konnte
Breaker-Ontology-Nutzung nur über rohe Evidence-Strings berichten. Das hatte
drei Schwächen:

- `structured_breaker_profile_contest_fallback:false` wurde bei Prefix-Zählung
  wie echte Nutzung gezählt.
- Runner- und Corp-Signale waren nicht getrennt.
- Coverage-Typen, CostProfile, SideEffects, Effective-Quote-Overrides und
  Conflict-Signale waren nicht stabil dedupliziert.

Die neuen Metriken sind jetzt Teil von `AiMatchProgressionMetrics`, vom
Delta-Pfad abgedeckt und im Suite-Report als eigene
`Breaker Ontology Metrics`-Sektion sichtbar.

## Neue Metriken

Runner:

- `runnerBreakerOntologyProfilesSeen`
- `runnerBreakerOntologyCoverageUsed`
- `runnerBreakerOntologyFallbackUsed`
- `runnerBreakerOntologyConflict`
- `runnerInstallableBreakerRankedByOntology`
- `runnerSearchTargetRankedByOntology`
- `runnerMissingCoverageResolvedByOntology`
- `runnerBreakerOntologySetupSuppressedBecausePressureReady`

Corp:

- `corpVisibleRunnerBreakerOntologyProfilesSeen`
- `corpRemoteSafetyUsedRunnerBreakerOntology`
- `corpCheapContestDetectedByBreakerOntology`
- `corpRemoteSafetyOntologyConflictWithEffectiveQuote`
- `corpAgendaInstallBlockedByOntologyCheapContest`
- `corpAdvanceBlockedByOntologyCheapContest`

Shared / Breakdown:

- `breakerOntologyCoverageByType`
- `breakerOntologyCoverageWall`
- `breakerOntologyCoverageSentry`
- `breakerOntologyCoverageCodeGate`
- `breakerOntologyCoverageAp`
- `breakerOntologyCoverageTrace`
- `breakerOntologyCoverageWatchdog`
- `breakerOntologyCoverageBlackIce`
- `breakerOntologyCoverageUniversal`
- `breakerOntologyCoverageUnknownSpecial`
- `breakerOntologySideEffectsSeen`
- `breakerOntologyCostProfileSeen`
- `breakerOntologyFallbackEvidenceCount`
- `breakerOntologyEffectiveQuoteOverrideCount`

## Dedupe und Definitionen

Die Aggregation läuft pro Action/Decision. Ein Signal zählt innerhalb derselben
Action höchstens einmal. Coverage-Typen werden pro Action in einem Set
dedupliziert; zwei gleiche `structured_breaker_coverage:wall`-Einträge in einer
Action zählen also als ein Wall-Signal.

`corpRemoteSafetyUsedRunnerBreakerOntology` und
`breakerOntologyFallbackEvidenceCount` zählen nur echte
`structured_breaker_profile_contest_fallback:true`- oder
`structured_breaker_ice_cost:true`-Signale, nicht mehr `false`-Marker.

`corpVisibleRunnerBreakerOntologyProfilesSeen` zählt Corp-Entscheidungen, in
denen öffentlich sichtbare installierte Runner-Karten mit structured
`breakerProfile` im Remote-Safety-Kontext gesehen wurden. Dieses Signal ist
diagnostisch breiter als echter Fallback.

## Tests

Ergänzt in `packages/ai/src/index.test.ts`:

- Summary-Test für Runner-/Corp-First-Class-Metriken aus side-safe Evidence.
- Legacy-only-Test: alte Rollen-/Evidence-Pfade ohne structured
  `breakerProfile` erzeugen keine Ontology-Metriken.
- Hidden-State-Invarianztest: gleiche sichtbare Evidence mit anderer
  hidden-state-artiger Hash-/Seed-Variante erzeugt gleiche Metriken.

Ein expliziter No-Behavior-Delta-Test wurde nicht als separater
Entscheidungstest gebaut, weil der Slice nur `summarizeMatchProgressionMetrics`,
den Suite-Report und diagnostische Evidence-Ausgabe erweitert. Es wurden keine
Action-Scores, Planergewichte oder LegalAction-Pfade geändert.

## 8-Slot-Benchmark

Konfiguration:

- Funktion: `runMatchProgressionBenchmarkSuite`
- Profile: `belief_ai_v1_4_2` vs. `current_candidate`
- Seeds: 9
- `maxActions`: `160`
- Real-Scene-Paare: `holdout_only`
- temporärer Vitest-Harness nach dem Lauf gelöscht

Guardrails bleiben grün:

| Metric                                       | Baseline | Candidate | Delta |
| -------------------------------------------- | -------: | --------: | ----: |
| Illegal Actions                              |        0 |         0 |     0 |
| Replay Failures                              |        0 |         0 |     0 |
| Timeout Rate                                 |        0 |         0 |     0 |
| Agenda install in cheaply contestable remote |        0 |         0 |     0 |
| Advance in cheaply contestable remote        |        1 |         0 |    -1 |
| Runs started against known unaffordable path |        9 |        10 |    +1 |
| Pump actions that could not lead to break    |        0 |         0 |     0 |
| Pump actions that destroyed access reserve   |        0 |         0 |     0 |

Progression bleibt ähnlich zum vorherigen Review:

| Metric              | Baseline | Candidate | Delta |
| ------------------- | -------: | --------: | ----: |
| ActionLimit matches |    33/72 |     34/72 |    +1 |
| Runner Steals       |      140 |       124 |   -16 |
| Corp Scores         |       54 |        64 |   +10 |

Neue Breaker-Ontology-Metriken, aggregiert:

| Metric                                             | Baseline | Candidate | Delta |
| -------------------------------------------------- | -------: | --------: | ----: |
| runnerBreakerOntologyProfilesSeen                  |        0 |         0 |     0 |
| runnerBreakerOntologyCoverageUsed                  |        0 |         0 |     0 |
| runnerBreakerOntologyFallbackUsed                  |        0 |         0 |     0 |
| runnerInstallableBreakerRankedByOntology           |        0 |         0 |     0 |
| runnerSearchTargetRankedByOntology                 |        0 |         0 |     0 |
| runnerMissingCoverageResolvedByOntology            |        0 |         0 |     0 |
| corpVisibleRunnerBreakerOntologyProfilesSeen       |      283 |       275 |    -8 |
| corpRemoteSafetyUsedRunnerBreakerOntology          |        0 |         0 |     0 |
| corpCheapContestDetectedByBreakerOntology          |        0 |         0 |     0 |
| corpRemoteSafetyOntologyConflictWithEffectiveQuote |        0 |         0 |     0 |
| corpAgendaInstallBlockedByOntologyCheapContest     |        0 |         0 |     0 |
| corpAdvanceBlockedByOntologyCheapContest           |        0 |         0 |     0 |
| breakerOntologyCoverageByType                      |      362 |       341 |   -21 |
| breakerOntologyCoverageWall                        |      133 |       121 |   -12 |
| breakerOntologyCoverageSentry                      |       22 |        14 |    -8 |
| breakerOntologyCoverageCodeGate                    |       48 |        38 |   -10 |
| breakerOntologyCoverageUniversal                   |      159 |       168 |    +9 |
| breakerOntologyFallbackEvidenceCount               |        0 |         0 |     0 |
| breakerOntologyEffectiveQuoteOverrideCount         |        0 |         0 |     0 |

## Slotanalyse

| Slot              |    ActionLimit | Corp Scores | Runner Steals | Corp visible profiles | Coverage signals | Fallback true |
| ----------------- | -------------: | ----------: | ------------: | --------------------: | ---------------: | ------------: |
| Smoke             | 0.667 -> 0.667 |     7 -> 10 |      14 -> 13 |                0 -> 0 |           0 -> 0 |        0 -> 0 |
| Snapshot Rig      | 0.222 -> 0.222 |    10 -> 11 |      24 -> 20 |              63 -> 65 |         82 -> 79 |        0 -> 0 |
| Snapshot Pressure | 0.333 -> 0.333 |     9 -> 13 |      28 -> 22 |              59 -> 60 |         84 -> 91 |        0 -> 0 |
| Snapshot Holdout  | 0.556 -> 0.556 |      9 -> 8 |      19 -> 18 |              55 -> 56 |         74 -> 66 |        0 -> 0 |
| Local Pair 1      |         0 -> 0 |      3 -> 3 |        8 -> 9 |                9 -> 8 |           9 -> 8 |        0 -> 0 |
| Local Pair 2      | 0.444 -> 0.667 |      1 -> 4 |      26 -> 20 |              25 -> 18 |         25 -> 18 |        0 -> 0 |
| Real Scene Pair 1 | 0.444 -> 0.444 |      8 -> 9 |      14 -> 14 |              38 -> 41 |         38 -> 41 |        0 -> 0 |
| Real Scene Pair 2 | 1.000 -> 0.889 |      7 -> 6 |        7 -> 8 |              34 -> 27 |         50 -> 38 |        0 -> 0 |

## Local Pair 2

Local Pair 2 bleibt das auffällige ActionLimit-Signal:

- ActionLimit `0.444 -> 0.667`
- Runner Steals `26 -> 20`
- Corp Scores `1 -> 4`
- `strategicLongestNoProgressChain` `34 -> 44`
- `sameStrategicPlanRepeatedWithoutProgress` `129 -> 153`
- `runsStartedAgainstKnownUnaffordablePath` `3 -> 0`
- `corpVisibleRunnerBreakerOntologyProfilesSeen` `25 -> 18`
- `corpRemoteSafetyUsedRunnerBreakerOntology` `0 -> 0`
- `corpCheapContestDetectedByBreakerOntology` `0 -> 0`

Damit spricht Local Pair 2 nicht für eine Breaker-Ontology-Fallback-Regression.
Der Candidate sieht sogar weniger Breaker-Ontology-Remote-Safety-Kontexte als
die Baseline und startet keine bekannten unbezahlbaren Runs. Das Muster passt
weiter zum bereits dokumentierten Tag/Punish-/Terminaldruck-Problem.

## Bewertung

Der BreakerProfile/CostProfile-Consumer kann bleiben. Der Slice macht die
Diagnose sauberer, statt Verhalten zu verändern. Die neuen Metriken zeigen:

- sichtbare Runner-BreakerProfile werden Corp-seitig häufig gesehen;
- echter structured fallback ist in dieser Suite nicht aktiv;
- es gibt keine Effective-Quote-Konflikte;
- Cheap-Remote-Safety bleibt intakt;
- Local Pair 2 ist nicht durch Breaker-Ontology-Fallback erklärbar.

Als nächster Consumer-Slice ist `RemoteRole` sinnvoller als weiteres
Breaker-Tuning. Die Voraussetzung wäre aber ein ähnlich enger Diagnosepfad:
erst RemoteRole-Metriken und Fixture-Schutz, dann nur bei klarem generischem
Muster Planerwirkung.
