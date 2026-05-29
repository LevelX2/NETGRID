# Aufgabe 038 - Runner Setup Metrics Reclassification Cleanup

## Kurzfazit

Aufgabe-ID: Aufgabe 038

Die Runner-Setup-Diagnose wurde bereinigt, ohne Planner-, Strategie-, Engine- oder Legalitätswirkung einzuführen. Die alten breiten Search/Recovery-, Memory- und Hand-size-Suspicious-Zähler bleiben zur historischen Vergleichbarkeit bestehen. Führend für zukünftige Fix-Gates sind jetzt die neuen `runner*Normalized*`-Metriken, die plausible Pressure-/Remote-Contest-, Economy-/Reserve- und Artefaktfälle disjunkter von echten Suspicious-Fenstern trennen.

Der 8-Slot-Lauf bestätigt die Aufgabe-037-Sichtung: Die alten Zähler waren zu breit. Candidate Search/Recovery fällt von 104 alten suspicious Fällen auf 1 normalized suspicious, Memory von 104 auf 23, Hand-size von 2 auf 0. Ein Search/Recovery- oder Memory-Fix ist weiterhin nicht gerechtfertigt; die Empfehlung bleibt profile-gated beobachten.

## Bezug zu Aufgabe 036/037

Aufgabe 036 hatte 134 Search/Recovery-Attribution-Windows mit 104 suspicious und 231 Memory-Windows mit 104 suspicious gefunden, aber bewusst keinen Planner-Fix umgesetzt.

Aufgabe 037 sichtete 243 Runner-Setup-Fenster side-safe. Die Root-Cause-Verteilung war überwiegend plausibel blockiert:

| Root Cause                             | Anzahl |
| -------------------------------------- | -----: |
| `blocked_pressure_or_remote_contest`   |    123 |
| `blocked_economy_or_reserve`           |     67 |
| `true_memory_bottleneck_blocks_rig`    |     23 |
| `true_search_recovery_missed_coverage` |     13 |
| kleinere Artefakt-/Uncertain-Klassen   |     17 |

Damit war kein Search/Recovery-, Memory- oder Hand-size-Boost fixreif. Aufgabe 038 überführt diese Erkenntnis in die Metriklogik.

## Audit Alter Metriken

Die bestehenden breiten Zähler bleiben unverändert:

- `runnerSearchRecoveryFixGateAttributionSuspicious`
- `runnerMemoryFixGateAttributionSuspicious`
- `runnerHandSizeFixGateAttributionSuspicious`
- die zugehörigen Aufgabe-027-/036-FixGate- und Attribution-Zähler

Diese Metriken sind weiterhin nützlich, um alte Läufe zu vergleichen, zählen aber auch Fälle mit plausiblen Alternativentscheidungen. Insbesondere Pressure-/Remote-Contest-Aktionen und Economy-/Reserve-Entscheidungen konnten bisher gleichzeitig als blocked und suspicious erscheinen.

Die neuen normalized-Zähler sind die führenden FixGate-Zähler. Sie zählen pro Fenster früh in genau eine Hauptklasse: blocked, suspicious, metric artifact oder unclassified. Taken-Fenster werden separat gezählt und nicht als skipped-suspicious interpretiert.

## Neue Normalized-Metriken

Search/Recovery:

- `runnerSearchRecoveryNormalizedWindows`
- `runnerSearchRecoveryNormalizedTaken`
- `runnerSearchRecoveryNormalizedSkipped`
- `runnerSearchRecoveryNormalizedBlocked`
- `runnerSearchRecoveryNormalizedBlockedByPressureOrRemoteContest`
- `runnerSearchRecoveryNormalizedBlockedByEconomyOrReserve`
- `runnerSearchRecoveryNormalizedBlockedByCurrentRigEnough`
- `runnerSearchRecoveryNormalizedBlockedByNoInstallFollowup`
- `runnerSearchRecoveryNormalizedMetricArtifact`
- `runnerSearchRecoveryNormalizedUnclassified`
- `runnerSearchRecoveryNormalizedSuspicious`
- `runnerSearchRecoveryNormalizedTrueMissedCoverage`
- `runnerSearchRecoveryNormalizedFixGateEligible`

Memory:

- `runnerMemoryNormalizedWindows`
- `runnerMemoryNormalizedTaken`
- `runnerMemoryNormalizedSkipped`
- `runnerMemoryNormalizedBlocked`
- `runnerMemoryNormalizedBlockedByPressureOrRemoteContest`
- `runnerMemoryNormalizedBlockedByEconomyOrReserve`
- `runnerMemoryNormalizedBlockedByNoProgramPressure`
- `runnerMemoryNormalizedMetricArtifact`
- `runnerMemoryNormalizedUnclassified`
- `runnerMemoryNormalizedSuspicious`
- `runnerMemoryNormalizedTrueRigBottleneck`
- `runnerMemoryNormalizedFixGateEligible`

Hand-size:

- `runnerHandSizeNormalizedWindows`
- `runnerHandSizeNormalizedTaken`
- `runnerHandSizeNormalizedSkipped`
- `runnerHandSizeNormalizedBlocked`
- `runnerHandSizeNormalizedSuspicious`
- `runnerHandSizeNormalizedMetricArtifact`

Combined:

- `runnerSetupNormalizedWindows`
- `runnerSetupNormalizedSuspicious`
- `runnerSetupNormalizedBlocked`
- `runnerSetupNormalizedMetricArtifact`
- `runnerSetupNormalizedUnclassified`
- `runnerSetupNormalizedFixGateEligible`
- `runnerSetupNormalizedRecommendedFixKind*`

## Reclassification-Regeln

Search/Recovery ist normalized suspicious nur noch, wenn Missing Coverage sichtbar ist, legale Search/Recovery-Action existiert, kein plausibler Pressure-/Remote-Contest- oder Economy-/Reserve-Blocker vorliegt, Current Rig nicht bereits reicht, ein sinnvoller Followup-Kontext side-safe plausibel ist und danach Coverage still missing, known unbreakable run, no progress oder ActionLimit sichtbar wird.

Memory ist normalized suspicious nur noch, wenn ein echtes Memory-Bottleneck sichtbar ist, legale Memory-Support-Action existiert, Program-/Coverage-/Rig-Fortschritt durch Memory blockiert bleibt und keine plausible Pressure-/Contest-/Economy-Blockade vorliegt.

Hand-size ist normalized suspicious nur noch bei sichtbarer Damage-/Discard-/Hand-size-Pressure, legaler Hand-size-Support-Action und sichtbarem Folgeproblem ohne plausiblen Blocker.

MRAM/Militech bleiben Hand-size-Kontext und erzeugen keine Memory-normalized-suspicious-Metrik.

## Old-vs-Normalized Vergleich

Frischer 8-Slot-Lauf, Candidate `current_candidate` gegen Baseline `belief_ai_v1_4_2`, `includeHoldout: true`, `maxActions: 160`, 8 runnable Slots:

| Bereich               | Baseline alt suspicious | Baseline normalized suspicious | Candidate alt suspicious | Candidate normalized suspicious |
| --------------------- | ----------------------: | -----------------------------: | -----------------------: | ------------------------------: |
| Search/Recovery       |                     101 |                              3 |                      104 |                               1 |
| Memory                |                      90 |                             24 |                      104 |                              23 |
| Hand-size             |                      11 |                              1 |                        2 |                               0 |
| Combined Runner Setup |                       - |                             28 |                        - |                              24 |

Candidate normalized blocked/artifact:

| Bereich         | Blocked | Metric Artifact | Unclassified |
| --------------- | ------: | --------------: | -----------: |
| Search/Recovery |     109 |              17 |            7 |
| Memory          |      81 |               0 |            1 |
| Hand-size       |       2 |               2 |            - |
| Combined        |     192 |              19 |            8 |

Der normalized Candidate empfiehlt keinen Search/Recovery- oder Hand-size-Fix. Memory bleibt der größte echte Restzähler, aber mit 23 Fällen weiterhin nicht dominant genug für einen sicheren Boost, weil Aufgabe 037 bereits gemischte Ursachen und plausible Blocker gezeigt hatte.

## Benchmark

Globaler 8-Slot-Lauf:

| Metrik          |  Baseline | Candidate |
| --------------- | --------: | --------: |
| illegalActions  |         0 |         0 |
| replayFailures  |         0 |         0 |
| timeoutRate     |         0 |         0 |
| actionLimitRate | ca. 0,347 | ca. 0,347 |
| Corp Scores     |        52 |        61 |
| Runner Steals   |       132 |       118 |

Guardrails:

| Guardrail                                       | Baseline | Candidate |
| ----------------------------------------------- | -------: | --------: |
| `runnerRunStartedAgainstKnownUnpayableFullPath` |        0 |         0 |
| `runnerRunSuppressedAsKnownNoAccess`            |      411 |       379 |
| `runnerRunAllowedAsFirstProbeUnknownIce`        |      290 |       339 |
| `corpAgendaInstalledInCheaplyContestableRemote` |        0 |         0 |
| `corpAdvanceInCheaplyContestableRemote`         |        0 |         0 |
| `corpFutureRunIceInstalledAsDeadEffect`         |        1 |         1 |
| `corpMultiIceInstallOrderFutureEffectDead`      |        1 |         0 |
| Tag/Punish unknown/suspicious normalized        |    0 / 0 |     0 / 0 |

## Slotbefunde

| Slot              | Candidate Scores/Steals | Search old -> normalized | Memory old -> normalized | Befund                                                                |
| ----------------- | ----------------------: | -----------------------: | -----------------------: | --------------------------------------------------------------------- |
| Smoke             |                 10 / 15 |                   0 -> 0 |                  37 -> 9 | Memory-Rest sichtbar, Safety sauber                                   |
| Local Pair 1      |                   2 / 8 |                  30 -> 1 |                   6 -> 2 | Search-Zähler fast vollständig blocked/artifact                       |
| Local Pair 2      |                  3 / 15 |                   2 -> 0 |                   0 -> 0 | ActionLimit-Warnung hängt nicht an Runner-Setup-normalized-suspicious |
| Snapshot Rig      |                 11 / 17 |                   0 -> 0 |                   2 -> 1 | Rig stabiler, keine Search-Warnung                                    |
| Snapshot Pressure |                 13 / 22 |                   0 -> 0 |                  19 -> 2 | Pressure-Kontext blockt plausibel                                     |
| Snapshot Holdout  |                  6 / 21 |                   0 -> 0 |                   8 -> 3 | Holdout bleibt Progression-Warnung, kein Search-Fixsignal             |
| Real Scene 1      |                 10 / 14 |                  49 -> 0 |                  25 -> 3 | alte Search-Suspicion war überwiegend blocked/artifact                |
| Real Scene 2      |                   6 / 6 |                  23 -> 0 |                   7 -> 3 | stabil, kein dominanter Fix-Kandidat                                  |

## Focus-Tests

Ergänzt wurde ein Focus-Test für normalized Runner-Setup-Diagnostik:

- Search/Recovery skipped for pressure zählt normalized blocked by pressure, nicht suspicious.
- Search/Recovery skipped for economy/reserve zählt normalized blocked by economy/reserve, nicht suspicious.
- Search/Recovery true missed coverage zählt normalized suspicious und FixGate eligible.
- Search/Recovery current-rig-enough-Fall zählt metric artifact, nicht suspicious.
- Memory skipped ohne Programmdruck zählt blocked/noProgramPressure.
- Memory true bottleneck zählt normalized suspicious und FixGate eligible.
- Hand-size unter sichtbarer Damage-/Discard-Pressure zählt Hand-size suspicious.
- MRAM/Militech-artiger Hand-size-Kontext erzeugt keine Memory-normalized-suspicious.
- Disjointness wird für Search/Recovery, Memory und Hand-size geprüft.

## Entscheidung

Kein Search/Recovery-, Memory- oder Hand-size-Fix ist gerechtfertigt. Die normalized-Metriken werden für zukünftige FixGate-Reviews als führend dokumentiert; die alten breiten Metriken bleiben nur für historische Vergleichbarkeit erhalten.

Technische Empfehlung: `profile_gated_observe`, kein Default-Schritt aus dieser Aufgabe.

## Bewusst Nicht Geändert

- Keine Engine-Regeländerung.
- Keine neue Legalität oder LegalAction-Erzeugung.
- Keine Strategy-/Planner-Score-Änderung.
- Kein Search-/Recovery-, Memory- oder Hand-size-Boost.
- Keine Profilumschaltung.
- Keine neuen Decks.
- Keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index oder modularer Overlays.

## Nächster Praktischer Schritt

Nach Aufgabe 038 ist ein Default-/Profile-Observation-Review sinnvoller als eine weitere Heuristik. Wenn später Runner-Setup erneut auffällt, sollten Reviews die normalized-Zähler verwenden und nur echte `runnerSearchRecoveryNormalizedTrueMissedCoverage`- oder `runnerMemoryNormalizedTrueRigBottleneck`-Häufungen als Fix-Kandidaten behandeln.
