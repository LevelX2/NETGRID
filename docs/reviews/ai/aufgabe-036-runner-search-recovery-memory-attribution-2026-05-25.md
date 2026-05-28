# Aufgabe 036 - AI: Runner Search/Recovery/Memory Attribution + Fix-Gate Review

## Kurzfazit

Aufgabe 036 schärft die Runner-Setup-Attribution aus Aufgabe 027/028 für Search/Recovery, Memory und Hand-size. Es wurde kein Planner-Fix umgesetzt.

Die Diagnose bleibt safety-sauber, findet aber keinen einzelnen, engen Fix-Kandidaten: Search/Recovery- und Memory-Suspicious-Fenster sind weiterhin sichtbar, verteilen sich jedoch stark nach Slot und Kontext. Candidate bleibt global besser als Baseline bei Score/Steal, aber Runner-Setup bleibt ein Beobachtungs- und Attributionsthema.

Fix-Gate-Entscheidung: **kein Fix in Aufgabe 036**. Die nächsten sinnvollen Schritte sind entweder eine side-safe Trace-Sichtung der Search/Recovery- und Memory-Suspicious-Fälle oder profile-gated Observation; ein pauschaler Search-/Recovery- oder Memory-Boost ist nicht gerechtfertigt.

## Bezug zu Aufgabe 027/028/035

Aufgabe 027 hatte die offenen Runner-Setup-Signale sichtbar gemacht:

- `runnerSetupFixGateEligibleSearchRecoverySkip = 120`
- `runnerSetupFixGateEligibleMemorySkip = 107`
- `runnerEconomyFixGateEligibleStarvedSkip = 55`

Aufgabe 028 hat bekannte Runner-No-Access-Full-Path-Runs über sequentielle Pfadkostenprojektion geschlossen. Starved-Economy ist deshalb in Aufgabe 036 nur noch Nebenkontext.

Aufgabe 035 hat den Corp-Economy-before-score-Fixpfad vorerst geschlossen: 31/31 suspicious Fälle waren Metrikartefakte. Der nächste technische Hebel liegt damit wieder bei Runner Setup/Search/Recovery/Memory.

## Audit bestehender Metriken

Bestehend und belastbar:

- Decision-window-basierte Runner-Economy-/Setup-Metriken aus Aufgabe 027.
- Search/Recovery-Legalität, Taken/Skipped und Missing-Coverage-Buckets.
- Memory-/Hand-size-Bottleneck-Fenster, Legal-Support und Taken/Skipped.
- Known-full-path-Kostenmetrik aus Aufgabe 028: `runnerRunStartedAgainstKnownUnpayableFullPath`.
- Combined Runner-Setup-Attribution aus Aufgabe 028.

Geschärft in Aufgabe 036:

- Search/Recovery-Attribution bekommt eigene `runnerSearchRecoveryAttribution*`-Aliasmetriken.
- Memory/Hand-size-Attribution bekommt eigene `runnerMemoryAttribution*`- und `runnerHandSizeAttribution*`-Metriken.
- Followups unterscheiden jetzt zusätzlich ActionLimit-Kontext und known-unbreakable Run-Followup.
- Hand-size erhält eigene FixGate-Attribution statt nur Window-Zählung.

Fehlende oder bewusst nicht behauptete Informationen:

- Keine Hidden-Zone-Zielidentität für Search/Recovery.
- Keine Grip-/Stack-Programmtitel für Memory.
- Keine Aussage, dass ein gesuchter Breaker tatsächlich im Stack/Heap liegt.
- Keine robuste Mehrzug-Suche; die Diagnose wertet nur bestehende LegalActions und side-safe Followups.

## Neue Attribution-Metriken

Search/Recovery:

- `runnerSearchRecoveryAttributionWindows`
- `runnerSearchRecoveryAttributionLegalSearch`
- `runnerSearchRecoveryAttributionLegalRecovery`
- `runnerSearchRecoveryAttributionMissingWall`
- `runnerSearchRecoveryAttributionMissingCodeGate`
- `runnerSearchRecoveryAttributionMissingSentry`
- `runnerSearchRecoveryAttributionMissingUniversal`
- `runnerSearchRecoveryAttributionMissingSpecial`
- `runnerSearchRecoveryAttributionSearchTaken`
- `runnerSearchRecoveryAttributionRecoveryTaken`
- `runnerSearchRecoveryAttributionSkipped`
- `runnerSearchRecoverySkipThenActionLimit`
- `runnerSearchRecoverySkipPlausibleCurrentRigEnough`
- `runnerSearchRecoverySkipSuspiciousKnownUnbreakableRun`

Memory/Hand-size:

- `runnerMemoryAttributionWindows`
- `runnerHandSizeAttributionWindows`
- `runnerMemoryAttributionLegalSupport`
- `runnerHandSizeAttributionLegalSupport`
- `runnerMemoryAttributionSupportTaken`
- `runnerHandSizeAttributionSupportTaken`
- `runnerMemoryAttributionSkipped`
- `runnerHandSizeAttributionSkipped`
- `runnerMemorySkipThenActionLimit`
- `runnerMemorySkipPlausibleNoProgramPressure`
- `runnerMemorySkipSuspiciousCoverageStillMissing`
- `runnerHandSizeFixGateAttributionEligible`
- `runnerHandSizeFixGateAttributionBlocked`
- `runnerHandSizeFixGateAttributionSuspicious`

Diese Metriken sind Diagnose- und Summary-Felder. Sie ändern keine LegalAction-Erzeugung und keine Action-Bewertung.

## Search/Recovery-Befund

Frischer 8-Slot Candidate:

| Metrik                                             | Wert |
| -------------------------------------------------- | ---: |
| `runnerSearchRecoveryAttributionWindows`           |  134 |
| `runnerSearchRecoveryFixGateAttributionSuspicious` |  104 |
| `runnerSearchRecoveryFixGateAttributionBlocked`    |  109 |
| `runnerSearchRecoverySkipThenInstallFollowup`      |   35 |
| `runnerSearchRecoverySkipThenCoverageResolved`     |    6 |
| `runnerSearchRecoverySkipThenCoverageStillMissing` |  128 |

Interpretation:

- Search/Recovery bleibt der stärkste Runner-Setup-Warnbereich.
- Viele suspicious Fenster haben gleichzeitig plausible Blocker; die Zähler sind nicht disjunkt.
- Local Pair 1 und Real Scene 1/2 tragen den Großteil der Search/Recovery-Fenster.
- Local Pair 2 zeigt nur 2 Candidate-Fenster, beide suspicious/blocked; das erklärt das ActionLimit-Warnsignal dort nicht allein.

Es wurde kein Search/Recovery-Fix umgesetzt, weil die Aggregate noch nicht belegen, dass Search/Recovery in einem einheitlichen, guardrail-sicheren Kontext Run/Draw/Economy schlagen soll.

## Memory-/Hand-size-Befund

Frischer 8-Slot Candidate:

| Metrik                                       | Wert |
| -------------------------------------------- | ---: |
| `runnerMemoryAttributionWindows`             |  231 |
| `runnerMemoryFixGateAttributionSuspicious`   |  104 |
| `runnerMemoryFixGateAttributionBlocked`      |   81 |
| `runnerMemorySkipThenProgramInstallBlocked`  |   97 |
| `runnerMemorySkipThenCoverageStillMissing`   |   36 |
| `runnerHandSizeAttributionWindows`           |   91 |
| `runnerHandSizeFixGateAttributionSuspicious` |    2 |

Interpretation:

- Memory ist sichtbar, aber nicht eindeutig dominanter als Search/Recovery.
- Smoke und Snapshot Pressure erzeugen viele Memory-Fenster; Real Scene 1 bleibt ebenfalls relevant.
- Hand-size ist in der Attribution kein starker Fix-Kandidat.
- MRAM/Militech bleiben Hand-size-Support, nicht Memory-Support.

Es wurde kein Memory-Fix umgesetzt, weil die Fenster stark slot- und kontextabhängig sind und ein enger Memory-Support-vor-Run/Draw-Fix noch nicht sauber genug belegt ist.

## Starved-Economy-Kontext

Starved-Economy wurde in Aufgabe 036 nicht erneut als Hauptpfad bewertet. Der wichtige Guardrail aus Aufgabe 028 bleibt intakt:

| Metrik                                          | Candidate |
| ----------------------------------------------- | --------: |
| `runnerRunStartedAgainstKnownUnpayableFullPath` |         0 |

Damit sind die früheren known-path-Kostenfehler nicht zurückgekehrt.

## Focus-Tests

Ergänzt und grün:

- Search/Recovery-Attribution aliasiert Legal-Search/Recovery und Missing-Coverage-Buckets.
- Search/Recovery-Skips zählen Install-Followup, Coverage-Resolved, Coverage-Still-Missing, ActionLimit und known-unbreakable Followup.
- Memory-Attribution zählt Memory-/Hand-size-Windows, Legal Support, Support Taken und Skips getrennt.
- Memory-Skips zählen Program-Install-Blocked, Coverage-Still-Missing, ActionLimit und eigene suspicious Coverage-Buckets.
- Hand-size-Skips bekommen eigene FixGate-Attribution.
- Hidden-State-Invarianz bleibt für side-safe Search/Recovery-Evidence erhalten.

## 8-Slot Benchmark

Temporärer Harness:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- 8 runnable Slots

Der temporäre Harness wurde nach dem Lauf gelöscht.

Globale Auswertung:

| Metrik                                             | Baseline | Candidate |
| -------------------------------------------------- | -------: | --------: |
| `illegalActions`                                   |        0 |         0 |
| `replayFailures`                                   |        0 |         0 |
| `timeoutRate`                                      |        0 |         0 |
| `actionLimitRate`                                  |    0.347 |     0.347 |
| `corpScores`                                       |       52 |        61 |
| `runnerSteals`                                     |      132 |       118 |
| `runnerSearchRecoveryAttributionWindows`           |      128 |       134 |
| `runnerSearchRecoveryFixGateAttributionSuspicious` |      101 |       104 |
| `runnerMemoryAttributionWindows`                   |      199 |       231 |
| `runnerMemoryFixGateAttributionSuspicious`         |       90 |       104 |
| `runnerHandSizeFixGateAttributionSuspicious`       |       11 |         2 |

## Slotbefunde

| Slot              | Candidate-Kurzbefund                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| Smoke             | Safety sauber, Memory-Warnung hoch: 37 suspicious Memory; Search/Recovery 0.                             |
| Snapshot Rig      | Positiv bei Scores/Steals; Memory suspicious 2.                                                          |
| Snapshot Pressure | Scores/Steals besser, ActionLimit höher; Memory suspicious 19.                                           |
| Snapshot Holdout  | Weiter negativ bei Progression: 6 Scores / 21 Steals; Memory suspicious 8, Search/Recovery 0.            |
| Local Pair 1      | Stabiler als Baseline: 2 Scores / 8 Steals; Search/Recovery suspicious 30, Memory suspicious 6.          |
| Local Pair 2      | Scores/Steals besser, aber ActionLimit 0.222; nur 2 Search/Recovery suspicious und 0 Memory suspicious.  |
| Real Scene 1      | Leicht positiv: 10 Scores / 14 Steals; Search/Recovery suspicious 49, Memory suspicious 25.              |
| Real Scene 2      | Stabil: 6 Scores / 6 Steals; Search/Recovery suspicious 23, Memory suspicious 7, Hand-size suspicious 2. |

## FixGate-Auswertung

Search/Recovery:

- Viele suspicious Fenster.
- Viele blocked Fenster zugleich.
- Kein einzelner Slot- oder Coverage-Typ dominiert stark genug aus der Aggregation.
- Install-Followup kommt vor, Coverage-Resolved bleibt niedrig.

Memory:

- Viele suspicious Fenster mit `program_install_blocked`.
- Candidate hat mehr Memory-Attribution-Windows als Baseline.
- Kein sauberer Beleg, dass ein enger Memory-Boost ohne Passivitäts- oder ActionLimit-Risiko greift.

Hand-size:

- Nur 2 suspicious Candidate-Fenster.
- Kein Fix-Kandidat.

Entscheidung: **nur Diagnose, kein Fix**.

## Guardrails

| Guardrail                                                          | Candidate |
| ------------------------------------------------------------------ | --------: |
| `illegalActions`                                                   |         0 |
| `replayFailures`                                                   |         0 |
| `timeoutRate`                                                      |         0 |
| `runnerRunStartedAgainstKnownUnpayableFullPath`                    |         0 |
| `corpAgendaInstalledInCheaplyContestableRemote`                    |         0 |
| `corpAdvanceInCheaplyContestableRemote`                            |         0 |
| `corpMultiIceInstallOrderFutureEffectDead`                         |         0 |
| `corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization` |         0 |
| `corpVisibleTagPunishFixGateSuspiciousSkipNormalized`              |         0 |

Keine Hidden-Info-, Engine-, Legalitäts-, Runtime-Compiled-Index- oder Overlay-Wirkung wurde eingeführt.

## Was bewusst nicht geändert wurde

- Kein Planner-Fix.
- Kein Search-/Recovery-Boost.
- Kein Memory-/Hand-size-Boost.
- Keine neue LegalAction.
- Keine Engine-Regeländerung.
- Keine Profil- oder Default-Umschaltung.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index oder modularer Overlays.

## Nächster praktischer Schritt

Empfohlen ist ein enger Trace-Sampling-Slice für Runner Search/Recovery und Memory:

- konkrete suspicious Search/Recovery-Fälle aus Local Pair 1 und Real Scene 1/2 side-safe sichten,
- Memory-suspicious Fälle aus Smoke, Snapshot Pressure und Real Scene 1 clustern,
- prüfen, ob `coverage_still_missing` und `program_install_blocked` echte Kausalpfade oder Metrikartefakte sind.

Erst wenn daraus ein dominantes Muster entsteht, ist Aufgabe 037 als enger Search/Recovery- oder Memory-Fix gerechtfertigt. Andernfalls sollte der Candidate profile-gated weiter beobachtet werden.
