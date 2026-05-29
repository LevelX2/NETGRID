# Aufgabe 039 - Runner Remote Trash / Repeat Access Fix

## Kurzfazit

Der Live-Befund war ein echter Bewertungsfehler an zwei Stellen: `BBS Whispering Campaign` wurde zwar als Remote-Economy-Kontext erkannt, konnte aber wegen der generischen Reserve-Logik als teurer Trash zu stark nach unten fallen; danach war ein erneuter Run auf denselben bekannten Remote nicht spezifisch genug als No-Progress-Wiederholung nach declined Trash markiert. Der Slice setzt keinen Engine- oder Legalitätsfix, sondern bewertet bereits legale Trash- und Run-Actions enger.

Ergebnis: `BBS Whispering Campaign` mit sichtbarem großem Restpool wird im Access-Fenster stark bevorzugt getrasht, und ein Repeat-Run auf denselben Remote nach declined relevantem Trash wird abgewertet. Die 8-Slot-Suite bleibt safety-grün.

## Live-Befund

Gemeldet war ein Runner, der Remote 2 mehrfach lief, dort ein offenes/rezzed `BBS Whispering Campaign` mit 12 Bits accessete, die bezahlbare Trash-Action für 4 Credits nicht nahm und danach denselben Remote wieder lief. Das ist strategisch falsch: Entweder ist der sichtbare Corp-Economy-Pool den Trash wert, oder der Remote-Run hat nach dem Decline keinen neuen Nutzen.

## Audit der bisherigen Bewertung

- Trash im Access-Fenster wurde über `trash_asset` und `trash_accessed_card` bereits separat bewertet.
- Remote-Trash-Rollen wie `economy`, `run_tax`, `scoring_protection` existierten bereits.
- `BBS Whispering Campaign` fiel als Economy-Remote grundsätzlich in die relevante Klasse.
- Die Reserve-Logik konnte teure High-Impact-Trashes aber zurückstellen, wenn Runner-Credits danach unter die generische Reserve fielen.
- Der verbleibende sichtbare Finite-Pool-Wert der Corp-Karte wurde nicht stark genug gegen die Reserve-Abwertung gestellt.
- Outcome-Followup erkannte bereits Remote-Repeats mit wenig Wert, aber nicht den Spezialfall "bekannter relevanter Trash wurde declined und derselbe Remote wird direkt wieder gelaufen".

## Implementierter Fix

Der Fix bleibt auf AI-Bewertung beschränkt.

- `BBS Whispering Campaign` wird über die Definition-ID und sichtbare Bit-Counter als Finite-Pool-Economy erkannt.
- Economy-Assets mit sichtbarem Finite-Pool-Wert bekommen im Access-Trash eine höhere Bewertung.
- Bei großem sichtbarem Restpool, z. B. 12 Bits gegen Trash-Kosten 4, blockiert die generische Reserve-Abwertung den Trash nicht mehr automatisch.
- `decline_trash` wird für bezahlbaren Finite-Pool-Trash deutlich unattraktiver.
- Wiederholte Remote-Runs nach declined relevantem Trash werden über EventTail/Outcome-Kontext penalisiert, sofern der Server noch dieselbe bekannte relevante trashbare Karte enthält.

Ausnahmen bleiben: Low Credits, echte Reserve-/Score-/Survival-Kontexte und andere höherwertige Access-Entscheidungen werden nicht pauschal überschrieben.

## Neue Metriken

Ergänzt wurden First-Class-Zähler für:

- Remote-Trash-Fenster: `runnerRemoteTrashDecisionWindows`, `runnerRemoteTrashLegalActions`, `runnerRemoteTrashSkipped`, `runnerRemoteTrashSkippedAffordableRelevant`.
- Economy-/Finite-Pool-Skips: `runnerRemoteTrashSkippedAssetEconomy`, `runnerRemoteTrashSkippedFinitePoolEconomy`, `runnerRemoteTrashSkippedWithCorpValueRemaining`.
- BBS-Fokus: `runnerBbsWhisperingCampaignAccessed`, `runnerBbsWhisperingCampaignTrashLegal`, `runnerBbsWhisperingCampaignTrashTaken`, `runnerBbsWhisperingCampaignTrashSkipped`, `runnerBbsWhisperingCampaignTrashSkippedAffordable`, `runnerBbsWhisperingCampaignTrashSkippedWithCreditsRemaining`.
- Finite-Pool-Fokus: `runnerFinitePoolAssetAccessed`, `runnerFinitePoolAssetTrashLegal`, `runnerFinitePoolAssetTrashTaken`, `runnerFinitePoolAssetTrashSkippedAffordable`.
- Repeat-Remote: `runnerRepeatRunOnSameRemoteAfterDecliningTrash`, `runnerRepeatRemoteRunPenalizedAfterNoTrash`, `runnerRepeatRemoteRunSuppressedAfterNoTrash`.
- FixGate: `runnerRemoteTrashFixGateEligible`, `runnerRemoteTrashFixGateBlockedByReserve`, `runnerRemoteTrashFixGateBlockedByLowCredits`, `runnerRemoteTrashFixGateBlockedByHigherThreat`, `runnerRemoteTrashFixGateSuspicious`, `runnerRepeatRemoteNoTrashFixGateSuspicious`.

## Focus-Tests

Neue Tests decken:

- BBS mit 12 Bits und Runner 4 Credits: Trash wird gewählt.
- BBS mit Runner 3 Credits: Trash ist nicht legal, Decline ist kein suspicious Skip.
- Repeat-Run auf denselben BBS-Remote nach declined Trash: Remote-Run bekommt die neue Penalty-Evidence.
- Redaction-/DTO-Safety im BBS-Focus-Test.
- Summary-Aggregation der BBS-/Finite-Pool-/Repeat-Remote-Metriken.

Bestehende Remote-Trash-Tests für Red Herrings, teure Run-Tax-Regionen, Dedicated Trash Credits und low-value Trash bleiben grün.

## 8-Slot Benchmark

Setup:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- 8 runnable Slots

Global über die 8 Slots:

| Metrik                            | Baseline | Candidate |
| --------------------------------- | -------: | --------: |
| illegalActions                    |        0 |         0 |
| replayFailures                    |        0 |         0 |
| timeoutRate                       |        0 |         0 |
| ActionLimitRate, Slot-Summe       |    2.779 |     2.778 |
| ActionLimitRate, ca. Durchschnitt |    0.347 |     0.347 |
| Corp Scores                       |       52 |        61 |
| Runner Steals                     |      132 |       118 |
| Score+Steal total                 |      184 |       179 |

Remote-Trash / BBS:

| Metrik                                            | Baseline | Candidate |
| ------------------------------------------------- | -------: | --------: |
| runnerRemoteTrashDecisionWindows                  |       26 |        21 |
| runnerRemoteTrashTaken                            |        7 |         4 |
| runnerRemoteTrashSkippedAffordableRelevant        |        0 |         0 |
| runnerBbsWhisperingCampaignAccessed               |        1 |         0 |
| runnerBbsWhisperingCampaignTrashLegal             |        0 |         0 |
| runnerBbsWhisperingCampaignTrashTaken             |        0 |         0 |
| runnerBbsWhisperingCampaignTrashSkippedAffordable |        0 |         0 |
| runnerFinitePoolAssetAccessed                     |        1 |         1 |
| runnerFinitePoolAssetTrashLegal                   |        0 |         0 |
| runnerFinitePoolAssetTrashSkippedAffordable       |        0 |         0 |
| runnerRepeatRunOnSameRemoteAfterDecliningTrash    |        6 |         9 |
| runnerRepeatRemoteRunPenalizedAfterNoTrash        |       10 |         4 |
| runnerRemoteTrashFixGateSuspicious                |        0 |         0 |
| runnerRepeatRemoteNoTrashFixGateSuspicious        |        6 |         9 |

Interpretation: Der konkrete BBS-Access-Fall wurde im Candidate-8-Slot nicht erneut angeboten, deshalb belegt der Focus-Test den Fix direkt. Die allgemeine Remote-Trash-Safety bleibt sauber: Es gibt keine bezahlbaren relevanten Trash-Skips. Repeat-Remote-Signale bleiben diagnostisch sichtbar, aber ohne Safety-/Progressionsregression.

## Slotbefunde

| Slot              | Candidate ActionLimit | Candidate Corp Scores | Candidate Runner Steals | Remote Trash Windows | Trash Taken |
| ----------------- | --------------------: | --------------------: | ----------------------: | -------------------: | ----------: |
| Smoke             |                 0.667 |                    10 |                      15 |                   14 |           0 |
| Snapshot Rig      |                 0.111 |                    11 |                      17 |                    1 |           1 |
| Snapshot Pressure |                 0.333 |                    13 |                      22 |                    0 |           0 |
| Snapshot Holdout  |                 0.556 |                     6 |                      21 |                    2 |           1 |
| Local Pair 1      |                     0 |                     2 |                       8 |                    3 |           2 |
| Local Pair 2      |                 0.222 |                     3 |                      15 |                    0 |           0 |
| Real Scene 1      |                 0.556 |                    10 |                      14 |                    1 |           0 |
| Real Scene 2      |                 0.333 |                     6 |                       6 |                    0 |           0 |

Snapshot Holdout bleibt wie in den vorherigen Reviews ein Progression-Warnslot, aber nicht wegen BBS/affordable relevant Remote-Trash-Skips. Local Pair 2 bleibt mit ActionLimit-Warnung sichtbar, verbessert aber weiter Corp Scores und Runner Steals gegenüber Baseline.

## Guardrails

| Guardrail                                                          | Candidate |
| ------------------------------------------------------------------ | --------: |
| `runnerRunStartedAgainstKnownUnpayableFullPath`                    |         0 |
| `corpAgendaInstalledInCheaplyContestableRemote`                    |         0 |
| `corpAdvanceInCheaplyContestableRemote`                            |         0 |
| `corpMultiIceInstallOrderFutureEffectDead`                         |         0 |
| `corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization` |         0 |
| `corpVisibleTagPunishFixGateSuspiciousSkipNormalized`              |         0 |

Keine Hidden-Info-, Engine-, LegalAction-, Runtime-Compiled-Index- oder Overlay-Wirkung wurde eingeführt.

## Bewusst nicht geändert

- Keine Engine-Regeln.
- Keine neue Trash-Legalität.
- Keine Änderung an `install_ice`, LegalActions oder `applyAction`.
- Keine pauschale Remote-Trash-Policy.
- Keine pauschale Remote-Run-Sperre.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Profilumschaltung, keine neuen Decks, keine Holdout-Optimierung.

## Nächster praktischer Schritt

Der konkrete BBS/Finite-Pool-Remote-Trash-Fehler ist testgedeckt. Danach ist wieder ein kurzer Observation-Review sinnvoll, der die neuen Repeat-Remote-Metriken getrennt von echten Remote-Trash-Skips bewertet; weitere Heuristik sollte erst folgen, wenn `runnerRepeatRemoteNoTrashFixGateSuspicious` in Trace-Sampling als echter No-Progress-Fehler statt als Metrikartefakt bestätigt wird.
