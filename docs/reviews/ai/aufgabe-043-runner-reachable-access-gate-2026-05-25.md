# Aufgabe 043 - Runner Reachable-Access Gate

## Kurzfazit

Aufgabe-ID: Aufgabe 043

Der Live-Befund war kein allgemeines Intent-Problem, sondern ein Reachability-Fehler: `HQ Interface` erzeugte Druckwert, obwohl HQ durch eine bekannte/rezzed `Data Wall` mit `End the run` und fehlender Wall-Coverage nicht erreichbar war. Der Slice trennt jetzt bekannte Kosten-No-Access-Fälle von bekannten unbreakable/missing-coverage No-Access-Fällen, koppelt Central-Multiaccess und Remote-Trash-/Contest-Wert an `canReachAccess` und penalisiert Wiederholungsruns auf bekannte No-Access-Pfade.

Der Fix ist eng im AI-Planer und in side-safe Diagnosepfaden umgesetzt. Engine, LegalActions, Profile, Decks, `aiSupportStatus` und `data/ai/ai-card-hints-active.json` wurden nicht geändert.

## Motivation

Aufgabe 028 hatte sequentielle Kostenprojektion geschlossen: Der Runner erkennt, wenn er nach bezahlten ICE-Kosten den späteren bekannten Pfad nicht mehr bezahlen kann. Der aktuelle Fall ist anders: Der Runner kann ein bekanntes/rezzed ETR-ICE wegen fehlender Breaker-Coverage überhaupt nicht brechen. Bei `HQ Interface` hinter `Data Wall` ist der erwartete Access daher `false`; Multiaccess-Wert muss `0` sein.

Die gleiche Grundregel gilt für Remote-Trash und Remote-Contest: Wert aus Zugriff, Trash oder Steal darf nur entstehen, wenn Access erreichbar ist. Unknown/unrezzed First-Probes bleiben davon getrennt.

## Audit

- `assessKnownRezzedIcePath` hatte bereits `canReachAccess`, `creditsAfterPath` und `ice_unbreakable`, aber die nachgelagerten Runner-Runpfade behandelten vor allem Kosten-No-Access hart.
- `runnerRunActionIsKnownNoAccess` ließ unbreakable Coverage-Fälle aus der harten Run-Suppression heraus, weil nur `ice_unaffordable` und `later_ice_unaffordable_after_prior_ice_cost` als bekannte No-Access-Pfade galten.
- Central-Pressure-Scoring konnte Interface-/Multiaccess-Wert addieren, obwohl `opportunity.pathBlocked` bereits wahr war.
- Remote-Trash-Memory erkannte relevante bekannte trashbare Karten, prüfte aber nicht zuerst, ob der Runner den Remote-Access überhaupt erreichen kann.
- Coverage-Reparatur war schon als sichtbarer Breaker-/Search-/Recovery-Druck vorhanden, aber neue Diagnose trennt jetzt klarer, wann sie statt eines bekannten No-Access-Runs genommen wurde.

## Implementierter Fix

### Reachable-Access Gate

`KnownRezzedIcePathAssessment` enthält jetzt zusätzlich:

- `knownPathBlockedByUnbreakableIce`
- `knownPathBlockedByMissingCoverage`
- `knownPathBlockedByEtr`
- `unbreakableIceIndex`
- `unbreakableIceTitle`
- `missingCoverage`
- `hasBypassOrSpecialAccessPlan`
- `reachableAccessReason`
- `noAccessReason`

Known/rezzed ETR-ICE ohne passende Breaker-Coverage wird als `known_path_unbreakable` beziehungsweise `missing_breaker_coverage` klassifiziert. `Data Wall` liefert dabei `missingCoverage: ["wall"]`.

### Multiaccess-Gating

Central-Pressure-Scoring addiert HQ-/R&D-Interface- und generischen Multiaccess-Wert nur noch, wenn der Access erreichbar ist. Bei bekanntem unbreakable Pfad wird der Central-Run stark negativ bewertet und mit `central_pressure_known_unbreakable_no_access` diagnostiziert.

### Remote-Trash-/Remote-Contest-Gating

Bekannte relevante Remote-Trash-Ziele zählen nur noch als Trash-Plan, wenn der sichtbare ICE-Pfad Access zulässt. Ein BBS-Remote hinter bekanntem unbreakable ICE erzeugt damit keinen Trash-Bonus; stattdessen greifen Runpath- und Coverage-Reparatur-Diagnosen.

### Repeat-Known-Unbreakable Suppression

Bekannte No-Access-LegalRuns werden jetzt auch bei unbreakable Coverage-Fällen als zu suppressende Runziele gezählt. Die Diagnose unterscheidet Cost-No-Access und Unbreakable-No-Access. Wiederholte bekannte No-Access-Runs werden penalized/suppressed gezählt; echte First-Probes gegen unbekannte oder unrezzed ICE bleiben erlaubt.

### Coverage Repair

Wenn ein wertvoller Pfad durch bekannte Coverage fehlt, zählen Install-, Search-/Recovery- sowie Draw/Economy-Alternativen als Coverage-Repair-Intent. Das ist keine neue Mehrzug-Suche und kein pauschaler Search-Boost; es bleibt an sichtbare LegalActions und bekannte No-Access-Kontexte gebunden.

## Neue Metriken

Reachability:

- `runnerKnownPathAccessReachable`
- `runnerKnownPathAccessNotReachable`
- `runnerKnownPathBlockedByUnbreakableIce`
- `runnerKnownPathBlockedByMissingCoverage`
- `runnerKnownPathBlockedByKnownEtr`
- `runnerKnownPathBlockedByWall`
- `runnerKnownPathBlockedByCodeGate`
- `runnerKnownPathBlockedBySentry`
- `runnerRunStartedAgainstKnownUnbreakablePath`
- `runnerRunStartedAgainstKnownUnbreakableCentralPath`
- `runnerRunStartedAgainstKnownUnbreakableRemotePath`

Multiaccess:

- `runnerMultiaccessValueAvailable`
- `runnerMultiaccessValueUsed`
- `runnerMultiaccessValueSuppressedNoAccess`
- `runnerCentralPressureSuppressedNoAccess`
- `runnerHqInterfaceSuppressedNoAccess`
- `runnerRndInterfaceSuppressedNoAccess`

Repeat/Coverage repair:

- `runnerRepeatKnownUnbreakableRunSuppressed`
- `runnerRepeatKnownUnbreakableRunPenalized`
- `runnerRepeatKnownUnbreakableCentralRunSuppressed`
- `runnerRepeatKnownUnbreakableRemoteRunSuppressed`
- `runnerRepeatKnownUnbreakableRunTakenDespiteSuppression`
- `runnerCoverageRepairIntentCandidates`
- `runnerCoverageRepairIntentSearchTaken`
- `runnerCoverageRepairIntentRecoveryTaken`
- `runnerCoverageRepairIntentInstallTaken`
- `runnerCoverageRepairIntentDrawOrEconomyTaken`
- `runnerCoverageRepairIntentSatisfied`
- `runnerCoverageRepairIntentNoFollowup`
- `runnerCoverageRepairIntentBlockedByHiddenTargetUncertain`

Live-Repro:

- `runnerDataWallHqNoAccessSuppressed`
- `runnerDataWallHqRepeatSuppressed`
- `runnerHqInterfaceDataWallValueSuppressed`

## Focus-Tests

Ergänzt wurden Tests für:

- bekannte/rezzed ETR-ICE ohne Coverage als unbreakable No-Access (`Data Wall`, `missingCoverage: ["wall"]`),
- `HQ Interface` hinter bekannter/rezzed `Data Wall`: HQ-Run verliert gegen Economy, Multiaccess wird suppressed,
- `HQ Interface` nach installierter Wall-Coverage: HQ-Pressure darf wieder wirken,
- bestehende Kosten-/Multi-ICE-Tests für Aufgabe 028 bleiben grün.

Die Tests prüfen außerdem, dass keine forbidden Debug-/DTO-Felder entstehen.

## 8-Slot Benchmark

Setup:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- 8 runnable Slots

Global:

| Profil    | Illegal | Replay | Timeout | ActionLimit Summe | Corp Scores | Runner Steals | Score+Steal |
| --------- | ------: | -----: | ------: | ----------------: | ----------: | ------------: | ----------: |
| Baseline  |       0 |      0 |       0 |             2.779 |          52 |           132 |         184 |
| Candidate |       0 |      0 |       0 |             2.889 |          60 |           118 |         178 |

Reachability / Multiaccess / Repair:

| Metrik                                                   | Candidate |
| -------------------------------------------------------- | --------: |
| `runnerRunStartedAgainstKnownUnpayableFullPath`          |         0 |
| `runnerRunStartedAgainstKnownUnbreakablePath`            |        10 |
| `runnerRunStartedAgainstKnownUnbreakableCentralPath`     |         0 |
| `runnerRunStartedAgainstKnownUnbreakableRemotePath`      |        10 |
| `runnerKnownPathBlockedByMissingCoverage`                |       484 |
| `runnerKnownPathBlockedByWall`                           |       176 |
| `runnerMultiaccessValueSuppressedNoAccess`               |       309 |
| `runnerCentralPressureSuppressedNoAccess`                |       309 |
| `runnerRepeatKnownUnbreakableRunSuppressed`              |       474 |
| `runnerRepeatKnownUnbreakableRunTakenDespiteSuppression` |         0 |
| `runnerCoverageRepairIntentCandidates`                   |       789 |
| `runnerCoverageRepairIntentSatisfied`                    |       746 |

Remote Trash:

| Metrik                                       | Candidate |
| -------------------------------------------- | --------: |
| `runnerRemoteTrashDecisionWindows`           |        21 |
| `runnerRemoteTrashTaken`                     |         4 |
| `runnerRemoteTrashSkippedAffordableRelevant` |         0 |

Guardrails:

| Metrik                                                             | Candidate |
| ------------------------------------------------------------------ | --------: |
| `corpAgendaInstalledInCheaplyContestableRemote`                    |         0 |
| `corpAdvanceInCheaplyContestableRemote`                            |         0 |
| `corpMultiIceInstallOrderFutureEffectDead`                         |         0 |
| `corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization` |         0 |
| `corpVisibleTagPunishFixGateSuspiciousSkipNormalized`              |         0 |

## Slotbefunde

- Smoke: Safety sauber, aber 6 unbreakable Remote-Starts bleiben als Restrisiko sichtbar.
- Snapshot Rig: verbessert gegenüber Baseline bei ActionLimit, Corp Scores und Runner Steals; 3 Data-Wall-HQ-Suppressionen.
- Snapshot Pressure: Runner Steals sinken 27 -> 22, keine unbreakable Starts.
- Snapshot Holdout: bleibt schwach, aber keine unbreakable Starts.
- Local Pair 1: stabil, keine unbreakable Starts.
- Local Pair 2: bleibt ActionLimit-Warnsignal, aber keine unbreakable Starts; 20 Data-Wall-HQ-Suppressionen.
- Real Scene 1: leicht schlechtere ActionLimit-Rate, keine unbreakable Starts.
- Real Scene 2: 4 unbreakable Remote-Starts bleiben; 52 Data-Wall-HQ-Suppressionen.

## Bewertung

Der konkrete HQ-Interface/Data-Wall-Fehler ist gefixt: bekannter unbreakable Central-Access erzeugt keinen Multiaccess-Wert mehr, und der Benchmark zeigt `runnerRunStartedAgainstKnownUnbreakableCentralPath = 0`.

Der Remote-Teil ist verbessert, aber nicht vollständig geschlossen: `runnerRunStartedAgainstKnownUnbreakableRemotePath = 10` bleibt als Follow-up-Risiko. Wichtig ist, dass keine Wiederholungsruns trotz Suppression gezählt wurden (`runnerRepeatKnownUnbreakableRunTakenDespiteSuppression = 0`) und Remote-Trash-Guardrails stabil bleiben.

## Bewusst nicht geändert

- Keine Engine-Regeländerung.
- Keine neue LegalAction und keine neue Trash-/Run-Legalität.
- Keine Hidden-Info-Nutzung.
- Keine pauschale Run-Vermeidung.
- Keine pauschale Search-/Recovery-/Economy-Heuristik.
- Keine Profil-/Default-Umschaltung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Holdout-Optimierung.

## Nächster Schritt

Der nächste praktische Schritt ist kein breiter Intent-Layer, sondern ein enger Follow-up auf die 10 verbleibenden unbreakable Remote-Starts aus Smoke und Real Scene 2: prüfen, ob sie echte No-Alternative-/Endturn-Fälle, Remote-Contest-Fallbacks oder weitere Metrikartefakte sind.
