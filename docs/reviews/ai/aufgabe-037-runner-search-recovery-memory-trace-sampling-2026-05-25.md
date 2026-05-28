# Aufgabe 037 - AI: Runner Search/Recovery/Memory Suspicious Trace Sampling

## Kurzfazit

Aufgabe 037 sichtet die auffälligen Runner-Setup-Fenster aus Aufgabe 036 side-safe über den reproduzierten 8-Slot-Lauf. Es wurde kein Planner-Fix, kein Search-/Recovery-Boost und kein Memory-/Hand-size-Boost umgesetzt.

Ergebnis: Die Search/Recovery- und Memory-Warnungen sind nicht leer, aber sie sind überwiegend durch plausible Immediate-Actions oder Economy-/Reserve-Kontext blockiert. Ein echter, enger Fix-Kandidat bleibt klein:

- `true_search_recovery_missed_coverage`: 13 Fälle.
- `true_memory_bottleneck_blocks_rig`: 23 Fälle.
- Dominant sind `blocked_pressure_or_remote_contest` mit 123 Fällen und `blocked_economy_or_reserve` mit 67 Fällen.

Fix-Gate-Entscheidung: **kein Search/Recovery- oder Memory-Fix in Aufgabe 037**. Der sinnvollere nächste Schritt ist Metrikbereinigung plus profile-gated Observation; ein enger Fix wäre erst nach einer kleineren, eindeutigeren Root-Cause-Klasse gerechtfertigt.

## Bezug zu Aufgabe 036

Aufgabe 036 hatte die Runner-Setup-Attribution geschärft und im frischen 8-Slot-Lauf gemessen:

- Search/Recovery: `runnerSearchRecoveryAttributionWindows = 134`, suspicious = 104.
- Memory: `runnerMemoryAttributionWindows = 231`, suspicious = 104.
- Hand-size: suspicious = 2.

Aufgabe 036 hatte bewusst keinen Fix umgesetzt, weil die Aggregate noch nicht belegten, dass Search/Recovery oder Memory in einem engen, guardrail-sicheren Kontext höher gewichtet werden sollten. Aufgabe 037 prüft nun die konkreten Decision-Kontexte.

## Methodik

Temporärer Harness:

- `runMatchProgressionBenchmarkSuite`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- `includeHoldout: true`
- `maxActions: 160`
- 8 runnable Slots
- Fokus auf Candidate-`actionSequence`

Der Harness extrahierte nur side-safe Felder:

- Slot, Seed, Match-Index, Action-Index.
- Suspicious-Kind: Search/Recovery, Memory oder Hand-size.
- Missing-Coverage-Buckets.
- Legal-Search-/Recovery-/Memory-/Hand-size-Zähler.
- gewählte Action-Familie, Action-Type und ReasonCode.
- Followup-Klasse.
- Root-Cause-Klasse.

Nicht enthalten:

- keine Hidden Cards
- keine Runner-Hand-/Stack-Identitäten
- keine Corp-HQ-/R&D-Hidden-Infos
- keine private Payloads
- keine CardInstances
- kein FullGameState
- keine Behauptung konkreter Search-Ziele in Stack/Heap

Der temporäre Harness wurde nach der Auswertung gelöscht. Der deterministische JSON-Report liegt in `docs/reviews/ai/aufgabe-037-runner-search-recovery-memory-trace-sampling-report-2026-05-25.json`.

Hinweis zur Zählweise: Der Harness hat alle 243 Candidate-Attribution-Windows gesichtet, die in die Search/Recovery-/Memory-/Hand-size-FixGate-Familie fallen. Die Aufgabe-036-Suspicious-Subset-Zähler bleiben 210: 104 Search/Recovery, 104 Memory und 2 Hand-size. Die Root-Cause-Verteilung bezieht sich auf die 243 gesichteten Attribution-Windows, weil suspicious und blocked in den bestehenden Metriken nicht disjunkt sind.

## Root-Cause-Taxonomie

Search/Recovery:

| Klasse                                         | Bedeutung                                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true_search_recovery_missed_coverage`         | Missing coverage sichtbar, Search/Recovery legal, Skip führt zu still-missing/no-progress/known-unbreakable/action-limit ohne plausible Blockade. |
| `blocked_pressure_or_remote_contest`           | Runner nimmt plausiblen Pressure-/Contest-/Trash-Wert.                                                                                            |
| `blocked_economy_or_reserve`                   | Economy/Reserve erklärt die Entscheidung plausibel.                                                                                               |
| `current_rig_enough_metric_artifact`           | Coverage-Detection wirkt breiter als der aktuelle Rig-/Pressure-Kontext.                                                                          |
| `search_recovery_no_install_followup_artifact` | Kein sinnvoller sichtbarer Install-Followup.                                                                                                      |
| `hidden_target_uncertain`                      | Search/Recovery wäre nur mit verdeckter Zielannahme sicher bewertbar.                                                                             |
| `unclassified_needs_more_evidence`             | Evidence reicht nicht.                                                                                                                            |

Memory/Hand-size:

| Klasse                               | Bedeutung                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `true_memory_bottleneck_blocks_rig`  | Memory-Support legal, Skip korreliert mit Program-Install-Blocked/Coverage-Still-Missing/No-Progress. |
| `hand_size_not_memory`               | Hand-size-Kontext, kein Memory-Fix-Kandidat.                                                          |
| `no_program_pressure`                | Kein sichtbarer Programminstall-/Coverage-Druck.                                                      |
| `blocked_pressure_or_remote_contest` | Immediate-Action plausibel höherwertig.                                                               |
| `blocked_economy_or_reserve`         | Economy/Reserve plausibel wichtiger.                                                                  |
| `memory_metric_artifact`             | Bottleneck-Erkennung zu breit.                                                                        |
| `unclassified_needs_more_evidence`   | Evidence reicht nicht.                                                                                |

## Globale Verteilung

| Root Cause                                     | Fälle |
| ---------------------------------------------- | ----: |
| `blocked_pressure_or_remote_contest`           |   123 |
| `blocked_economy_or_reserve`                   |    67 |
| `true_memory_bottleneck_blocks_rig`            |    23 |
| `true_search_recovery_missed_coverage`         |    13 |
| `search_recovery_no_install_followup_artifact` |     6 |
| `current_rig_enough_metric_artifact`           |     5 |
| `hand_size_not_memory`                         |     4 |
| `hidden_target_uncertain`                      |     1 |
| `unclassified_needs_more_evidence`             |     1 |

Dominante Klasse: `blocked_pressure_or_remote_contest` mit 123/243 = 50.6 %. Zusammen mit `blocked_economy_or_reserve` sind 190/243 Fälle plausibel blockiert.

Echte Fix-Kandidaten sind deutlich kleiner:

- Search/Recovery: 13/134 Attribution-Windows.
- Memory: 23/105 Attribution-Windows.
- Hand-size: kein Fix-Kandidat.

## Local Pair 1

| Kategorie                              | Fälle |
| -------------------------------------- | ----: |
| Search/Recovery                        |    38 |
| Memory                                 |     6 |
| `blocked_pressure_or_remote_contest`   |    29 |
| `blocked_economy_or_reserve`           |     6 |
| `true_search_recovery_missed_coverage` |     5 |
| `true_memory_bottleneck_blocks_rig`    |     2 |
| Artefakt/uncertain                     |     2 |

Local Pair 1 bleibt der sauberste Search/Recovery-Warnslot, aber selbst dort dominieren Pressure-/Remote-Contest-Blocker. Ein enger Search/Recovery-Fix wäre aus diesem Slot allein nicht ausreichend belegt.

## Local Pair 2

| Kategorie                    | Fälle |
| ---------------------------- | ----: |
| Search/Recovery              |     2 |
| Memory                       |     0 |
| `blocked_economy_or_reserve` |     2 |

Das ActionLimit-Warnsignal in Local Pair 2 hängt in dieser Sichtung nicht an Runner Search/Recovery oder Memory. Der Slot ist eher ein anderes Progression-/Corp-/Score-Kontextthema.

## Snapshot Rig

| Kategorie                            | Fälle |
| ------------------------------------ | ----: |
| Memory                               |     2 |
| `true_memory_bottleneck_blocks_rig`  |     1 |
| `blocked_pressure_or_remote_contest` |     1 |

Snapshot Rig zeigt keine breite Runner-Setup-Regression. Der Rig-Aufbau wirkt nicht als dominanter Problemherd.

## Snapshot Pressure

| Kategorie                            | Fälle |
| ------------------------------------ | ----: |
| Memory                               |    19 |
| `blocked_pressure_or_remote_contest` |    17 |
| `true_memory_bottleneck_blocks_rig`  |     2 |

Snapshot Pressure bestätigt den Namen des Slots: Die meisten Memory-Warnungen sind Pressure-/Contest-Konflikte. Ein Memory-Fix wäre hier riskant, weil er wahrscheinlich echte Pressure-Aktionen verdrängen würde.

## Snapshot Holdout

| Kategorie                            | Fälle |
| ------------------------------------ | ----: |
| Memory                               |     9 |
| `blocked_pressure_or_remote_contest` |     5 |
| `true_memory_bottleneck_blocks_rig`  |     3 |
| `blocked_economy_or_reserve`         |     1 |

Die Holdout-Warnung hängt nicht primär an Runner Search/Recovery. Memory ist sichtbar, aber klein und nicht dominant genug für einen Fix.

## Real Scene 1

| Kategorie                              | Fälle |
| -------------------------------------- | ----: |
| Search/Recovery                        |    67 |
| Memory                                 |    25 |
| `blocked_pressure_or_remote_contest`   |    39 |
| `blocked_economy_or_reserve`           |    35 |
| `true_search_recovery_missed_coverage` |     7 |
| `true_memory_bottleneck_blocks_rig`    |     3 |
| Artefakt/uncertain                     |     8 |

Real Scene 1 erzeugt die meisten Runner-Setup-Warnungen, aber die Ursache ist gemischt. Die echten Search/Recovery- und Memory-Fix-Kandidaten sind gegenüber Pressure/Economy-Blockern klein.

## Real Scene 2

| Kategorie                              | Fälle |
| -------------------------------------- | ----: |
| Search/Recovery                        |    27 |
| Memory                                 |     7 |
| Hand-size                              |     4 |
| `blocked_economy_or_reserve`           |    14 |
| `blocked_pressure_or_remote_contest`   |    13 |
| `true_memory_bottleneck_blocks_rig`    |     3 |
| `true_search_recovery_missed_coverage` |     1 |
| `hand_size_not_memory`                 |     4 |
| Artefakt                               |     3 |

Real Scene 2 zeigt keinen Search/Recovery- oder Memory-Fixpfad. Hand-size bleibt klar getrennt und ist kein Memory-Fix-Kandidat.

## Smoke-Kontrolle

| Kategorie                            | Fälle |
| ------------------------------------ | ----: |
| Memory                               |    37 |
| `blocked_pressure_or_remote_contest` |    19 |
| `blocked_economy_or_reserve`         |     9 |
| `true_memory_bottleneck_blocks_rig`  |     9 |

Smoke ist safety-sauber, zeigt aber Memory-Diagnosehäufung. Die Hälfte ist durch Pressure/Contest blockiert; der echte Memory-Kern ist zu klein für eine produktive Heuristik.

## Side-safe Beispiel-Evidence

Search/Recovery, echter kleiner Fix-Kandidat:

```json
{
  "slotId": "local_realistic_pair_1",
  "suspiciousKind": "search_recovery",
  "missingCoverage": ["code_gate"],
  "legalSearchCount": 1,
  "legalRecoveryCount": 0,
  "chosenActionFamily": "draw",
  "chosenReasonCode": "runner.plan.draw",
  "followup": "coverage_still_missing",
  "rootCauseCandidate": "true_search_recovery_missed_coverage"
}
```

Search/Recovery, plausible blockiert:

```json
{
  "slotId": "real_scene_pair_1",
  "suspiciousKind": "search_recovery",
  "missingCoverage": ["sentry"],
  "legalSearchCount": 1,
  "legalRecoveryCount": 0,
  "chosenActionFamily": "run",
  "chosenReasonCode": "runner.plan.contest_remote",
  "followup": "coverage_still_missing",
  "rootCauseCandidate": "blocked_pressure_or_remote_contest"
}
```

Memory, echter kleiner Fix-Kandidat:

```json
{
  "slotId": "safety_smoke_demo_008",
  "suspiciousKind": "memory",
  "memoryPressure": true,
  "legalMemorySupportCount": 1,
  "chosenActionFamily": "draw",
  "chosenReasonCode": "runner.plan.draw",
  "followup": "program_install_blocked",
  "rootCauseCandidate": "true_memory_bottleneck_blocks_rig"
}
```

Memory, plausible blockiert:

```json
{
  "slotId": "snapshot_holdout_origin_pressure_vs_tag_ops",
  "suspiciousKind": "memory",
  "memoryPressure": true,
  "legalMemorySupportCount": 1,
  "chosenActionFamily": "run",
  "chosenReasonCode": "runner.plan.contest_remote",
  "followup": "program_install_blocked",
  "rootCauseCandidate": "blocked_pressure_or_remote_contest"
}
```

## Fix-Gate-Entscheidung

Search/Recovery-Fix: **nicht gerechtfertigt**.

Begründung:

- Nur 13 Fälle clustern als `true_search_recovery_missed_coverage`.
- Die Mehrheit ist Pressure/Contest oder Economy/Reserve.
- Ein Fix würde wahrscheinlich legitime Contest-/Pressure-Fenster verdrängen.

Memory-Fix: **nicht gerechtfertigt**.

Begründung:

- 23 Fälle clustern als `true_memory_bottleneck_blocks_rig`.
- Memory-Warnungen sind hoch, aber überwiegend in Slots mit plausibler Pressure-/Economy-Konkurrenz.
- Snapshot Pressure und Smoke wären bei einem Memory-Boost regressionsanfällig.

Hand-size-Fix: **nicht gerechtfertigt**.

Begründung:

- Hand-size ist klein und sauber von Memory getrennt.
- Die sichtbaren Fälle clustern als `hand_size_not_memory`.

## Was bewusst nicht geändert wurde

- Kein Planner-Fix.
- Keine Action-Score-Änderung.
- Kein PlanWeight-Change.
- Kein Search-/Recovery-Boost.
- Kein Memory-/Hand-size-Boost.
- Keine Engine-Regeländerung.
- Keine neue Legalität.
- Keine Profil- oder Default-Umschaltung.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index oder modularer Overlays.

## Nächster praktischer Schritt

Empfohlen: **keine neue Heuristik**.

Sinnvoller ist:

1. Runner-Setup-Metriken bereinigen, damit blocked und suspicious disjunkter berichtet werden.
2. Profile-gated Observation fortsetzen.
3. Erst bei wiederkehrenden echten Fällen aus `true_search_recovery_missed_coverage` oder `true_memory_bottleneck_blocks_rig` einen engen Aufgabe-038-Fix schneiden.

Wenn ein weiterer aktiver Slice nötig ist, sollte er keine Search-/Memory-Bewertung ändern, sondern die Diagnoseklassifikation schärfen: Pressure-/Contest-/Economy-Blocker vor suspicious zählen, damit die Warnzahlen nicht größer wirken als die echten Fix-Kandidaten.
