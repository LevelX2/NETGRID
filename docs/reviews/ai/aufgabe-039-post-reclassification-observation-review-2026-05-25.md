# Aufgabe 039 - Post-Reclassification Default/Profile Observation Review

## Kurzfazit

Aufgabe-ID: Aufgabe 039

Der frische 8-Slot-Observation-Lauf bestätigt den Stand nach Aufgabe 038: `current_candidate` ist technisch weiter merge-würdig mit dokumentiertem Risiko und profile-gated sinnvoll beobachtbar. Eine automatische Default-Promotion ist technisch weiter nicht sauber genug begründet.

Safety, Cheap-Remote, known no-access full path, ICE-Ordering und Tag/Punish bleiben stabil. Die früheren großen Runner-Setup-Warnungen sind nach Normalisierung kein breites FixGate mehr: Search/Recovery old suspicious 104 fällt normalized auf 1, Memory 104 auf 23, Hand-size 2 auf 0. Economy-before-score wird nach Aufgabe 035 nicht mehr als aktives FixGate gewertet, weil die gesichteten suspicious Fälle Metrikartefakte waren.

Die verbleibenden Gründe gegen Default sind Progression-/Holdout-Warnungen: Snapshot Holdout bleibt schlechter, Local Pair 2 hat weiter ActionLimit-Warnung, und normalized Memory bleibt als kleiner Beobachtungsrest sichtbar.

## Bezug zu Aufgabe 033/035/037/038

- Aufgabe 033 empfahl `observe_more`: Safety sauber, Candidate global besser, aber Economy-before-score, Snapshot Holdout, Local Pair 2 und Runner Setup waren Warnbereiche.
- Aufgabe 035 schloss Corp Economy-before-score als Fixpfad vorerst: 31/31 suspicious Fälle waren `metric_artifact`.
- Aufgabe 037 sichtete Runner Setup side-safe: Pressure/Remote-Contest und Economy/Reserve dominierten; kein Search/Recovery-, Memory- oder Hand-size-Fix.
- Aufgabe 038 bereinigte die Runner-Setup-Metriken: alte breite suspicious-Zähler bleiben historisch, normalized-Zähler sind führend.

## Check-Ergebnisse

Alle geforderten Gates wurden nach Review-/Report-Erstellung ausgeführt und sind grün:

- Batch1- bis Batch12-Closeout-/Rollup-Gates
- `check:ai-derived-facts`
- `check:ai-hint-compiled-index`
- `check:ai-generated-fact-migration-priority`
- `check:ai-manual-overlays`
- `check:ai-hint-quality`
- `check:ai-approval-consistency`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `git diff --check`

Die Derived-/Hint-Gates enthalten weiterhin bekannte Warnungen, aber keine Fehler.

## Benchmark-Setup

Deterministischer Observation-Lauf:

- Suite: `runMatchProgressionBenchmarkSuite`
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- `includeHoldout: true`
- `maxActions: 160`
- Seeds: 9
- Runnable Slots: 8

Der JSON-Report liegt in `docs/reviews/ai/aufgabe-039-post-reclassification-observation-report-2026-05-25.json`.

## Globale Tabelle

| Metrik            | Baseline | Candidate | Delta | Gate |
| ----------------- | -------: | --------: | ----: | ---- |
| Games             |       72 |        72 |     0 | -    |
| illegalActions    |        0 |         0 |     0 | PASS |
| replayFailures    |        0 |         0 |     0 | PASS |
| timeoutRate       |        0 |         0 |     0 | PASS |
| actionLimitRate   |    0.347 |     0.347 |     0 | WARN |
| Corp Scores       |       52 |        61 |    +9 | PASS |
| Runner Steals     |      132 |       118 |   -14 | PASS |
| Score+Steal total |      184 |       179 |    -5 | WARN |

Global ist der Candidate besser bei Corp Scores und Runner Steals, aber ActionLimit bleibt gleich hoch. Das reicht für profile-gated Beobachtung, aber noch nicht für Default ohne weitere Beobachtung.

## Slot-Tabelle

| Slot              | Baseline Scores/Steals | Candidate Scores/Steals | Candidate ActionLimit | Bewertung                                       |
| ----------------- | ---------------------: | ----------------------: | --------------------: | ----------------------------------------------- |
| Smoke             |                 7 / 14 |                 10 / 15 |                 0.667 | Warn: Steals +1, Safety sauber                  |
| Snapshot Rig      |                10 / 22 |                 11 / 17 |                 0.111 | Positiv                                         |
| Snapshot Pressure |                10 / 27 |                 13 / 22 |                 0.333 | Positiv, ActionLimit leicht höher               |
| Snapshot Holdout  |                 9 / 19 |                  6 / 21 |                 0.556 | Warn: Holdout schlechter                        |
| Local Pair 1      |                 2 / 10 |                   2 / 8 |                     0 | Stabil/positiv                                  |
| Local Pair 2      |                 0 / 19 |                  3 / 15 |                 0.222 | Positiv bei Scores/Steals, Warn bei ActionLimit |
| Real Scene 1      |                 8 / 15 |                 10 / 14 |                 0.556 | Leicht positiv, ActionLimit bleibt hoch         |
| Real Scene 2      |                  6 / 6 |                   6 / 6 |                 0.333 | Stabil, ActionLimit besser                      |

Snapshot Holdout bleibt der klarste negative Slot. Local Pair 2 ist spielstärker als Baseline, aber die ActionLimit-Warnung bleibt bestehen.

## Guardrail-Tabelle

| Guardrail                                       | Candidate | Gate       |
| ----------------------------------------------- | --------: | ---------- |
| `corpAgendaInstalledInCheaplyContestableRemote` |         0 | PASS       |
| `corpAdvanceInCheaplyContestableRemote`         |         0 | PASS       |
| `runnerRunStartedAgainstKnownUnpayableFullPath` |         0 | PASS       |
| `runnerRunSuppressedAsKnownNoAccess`            |       379 | PASS       |
| `runnerRunAllowedAsFirstProbeUnknownIce`        |       339 | PASS       |
| `corpFutureRunIceInstalledAsDeadEffect`         |         1 | WARN klein |
| `corpMultiIceInstallOrderFutureEffectDead`      |         0 | PASS       |
| `corpRemotePortfolioOverExpanded`               |         0 | PASS       |
| `corpNewRemoteCreatedWithoutPayloadPlan`        |        10 | Beobachten |

## Recent-Fix-Tabelle

| Bereich                          | Candidate | Bewertung                                  |
| -------------------------------- | --------: | ------------------------------------------ |
| Tag/Punish unknown normalized    |         0 | PASS                                       |
| Tag/Punish suspicious normalized |         0 | PASS                                       |
| known no-access full path        |         0 | PASS                                       |
| known-path suppressed no-access  |       379 | Guardrail aktiv                            |
| first-probe unknown ICE allowed  |       339 | Guardrail aktiv                            |
| Future-ICE live effect           |         6 | Stabil                                     |
| Future-ICE dead effect           |         1 | Klein, beobachten                          |
| Multi-ICE dead order             |         0 | PASS                                       |
| Score terminal windows           |       505 | Diagnose stabil                            |
| Score taken / Advance taken      |   61 / 52 | Score-Fix aktiv                            |
| Score suspicious economy loop    |        26 | Nach Aufgabe 035 nicht automatisch FixGate |
| Score suspicious protection loop |         0 | PASS                                       |

## Runner Setup Old-vs-Normalized

| Bereich         | Old suspicious | Normalized suspicious | Normalized blocked | Normalized artifact | Bewertung          |
| --------------- | -------------: | --------------------: | -----------------: | ------------------: | ------------------ |
| Search/Recovery |            104 |                     1 |                109 |                  17 | PASS               |
| Memory          |            104 |                    23 |                 81 |                   0 | WARN klein/moderat |
| Hand-size       |              2 |                     0 |                  2 |                   2 | PASS               |
| Combined        |              - |                    24 |                192 |                  19 | WARN beobachten    |

`runnerSetupNormalizedRecommendedFixKind` ist `memory_observe`, nicht `memory_fix`. Die normalized Memory-Fälle sind sichtbar, aber nicht slotdominant genug und nach Aufgabe 037 nicht einheitlich genug für einen Planner-Fix.

## Economy-before-score Interpretation

Die rohen Candidate-Werte bleiben:

- `corpEconomyBeforeScoreTaken = 86`
- `corpEconomyBeforeScoreRepeatedEconomyWithin3 = 44`
- `corpEconomyBeforeScoreNotConvertedWithin3CorpActions = 71`
- `corpEconomyBeforeScoreThenRunnerSteal = 10`

Diese Werte werden nicht mehr automatisch als FixGate interpretiert. Aufgabe 035 hat die suspicious Fälle side-safe gesichtet und 31/31 als Metrikartefakte klassifiziert. Economy-before-score bleibt ein Beobachtungsbereich, aber kein aktueller Fixpfad.

## Gate-Ergebnisse

| Gate                    | Ergebnis | Begründung                                                      |
| ----------------------- | -------- | --------------------------------------------------------------- |
| Safety                  | PASS     | illegal/replay/timeout jeweils 0                                |
| Cheap Remote            | PASS     | Agenda/Advance cheap contestable 0/0                            |
| Known No-Access         | PASS     | neue Full-Path-Metrik 0                                         |
| ICE Ordering            | PASS     | Multi-ICE dead order 0; dead effect nur 1                       |
| Tag/Punish              | PASS     | normalized unknown/suspicious 0/0                               |
| Runner Setup normalized | WARN     | Search/Recovery pass, Memory 23 beobachten                      |
| Economy-before-score    | OBSERVE  | Aufgabe 035: suspicious war Artefakt                            |
| Progression             | WARN     | Candidate global besser, aber Holdout/Local ActionLimit bleiben |

## Readiness-Matrix

| Kategorie                    | Bewertung                                             |
| ---------------------------- | ----------------------------------------------------- |
| Code-/Merge-Würdigkeit       | `merge_ready_with_documented_risk`                    |
| Profile-gated Nutzung        | `profile_gated_ready_with_risks`                      |
| Default-Promotion            | `default_not_ready_observe_more`                      |
| Nächster technischer Schritt | `profile_gated_observation_or_user_decision_on_merge` |

## Restrisiken

- Snapshot Holdout bleibt schlechter: Candidate 6 Corp Scores / 21 Runner Steals vs Baseline 9 / 19.
- Local Pair 2 bleibt ActionLimit-Warnung trotz besserer Scores/Steals.
- Normalized Memory bleibt mit 23 suspicious sichtbar, aber ohne dominanten Fixpfad.
- Future-ICE dead effect bleibt bei 1, ohne Multi-ICE-Dead-Order.
- `corpNewRemoteCreatedWithoutPayloadPlan = 10` bleibt Beobachtungsmetrik.
- Economy-before-score-Rohwerte bleiben hoch, sind nach Trace-Sampling aber kein aktives FixGate.

## Technische Empfehlung

Keine Default-Promotion aus diesem Review ableiten. Technisch ist der Branch weiter integrierbar und profile-gated sinnvoll beobachtbar:

- `merge_ready_with_documented_risk`
- `profile_gated_ready_with_risks`
- `default_not_ready_observe_more`

Ein weiterer Heuristik-Fix ist aus diesen Daten nicht sauber gerechtfertigt. Der nächste praktische Schritt ist entweder profile-gated Beobachtung als ausreichend dokumentieren oder eine bewusste Nutzerentscheidung über Code-Merge mit später separater Default-Entscheidung.

## Bewusst Nicht Geändert

- Kein Merge.
- Keine Codeänderung.
- Keine Engine-Regeländerung.
- Keine neue Legalität.
- Keine Strategy- oder Planner-Score-Änderung.
- Keine Runtime-Nutzung compiled index oder modularer Overlays.
- Keine Profilumschaltung.
- Keine neuen Decks.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Holdout-Optimierung.
