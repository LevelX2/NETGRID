# Aufgabe 027 - Runner Economy / Setup Consumer Diagnostics

## Kurzfazit

Aufgabe-ID: Aufgabe 027.

Der neue Diagnose-Slice misst Runner-Economy-/Setup-Fenster jetzt auf Decision-Window-Ebene: legale Economy-Kandidaten, Taken/Skipped, Low-Credit-/Known-Path-Kontext, finite/debt/downside-Economy, Memory-/Hand-size-Support sowie Search/Recovery-Fenster. Es wurde keine Legalität, kein Planner-Score, kein Profil und kein aktiver Hintpfad geändert.

Die 8-Slot-Diagnose zeigt 2.189 Runner-Economy-Windows, 3.072 legale Economy-Actions, 939 Taken und 1.250 Skips im Candidate. Es bleiben echte FixGate-Signale: 55 starved known-path Economy-Skips, 8 Economy-over-Pressure-Fenster ohne Reserve-Erklärung, 3 Economy-over-Remote-Contest-Fenster, 107 Memory-Skip-Fenster und 120 Search/Recovery-Skip-Fenster. Das rechtfertigt noch keinen breiten Economy-Boost, aber einen engeren Attribution-Slice für Starved-Skip und Search/Recovery/Memory.

## Bezug zu Aufgabe 026

Aufgabe 026 hat die mechanischen Runner-Economy-/Resource-/Hardware-/Hand-size-/Search-Recovery-Facts read-only stabilisiert. Aufgabe 027 nutzt diese Klassen diagnostisch im AI-/Benchmark-Pfad, aber weiterhin ohne Runtime-Nutzung des Compiled Index und ohne aktive Hintmigration. `MRAM Chip` und `Militech MRAM Chip` werden explizit als Hand-size-Support, nicht als Memory-Support klassifiziert.

## Vorhandene Metriken

Bereits vorhanden und weitergenutzt:

- `runnerDrawActions`, `clickDrawActions`, `cardEffectDrawActions` und Draw-while-opportunity-Metriken.
- `runnerEconomyActionsTaken`, `runnerRigInstallActions`, `runnerInstallActions`.
- Credit-Discipline-Metriken wie `runnerEndTurnCreditsBelowReserve`, `runnerRunsStartedBelowReserve`, `runsStartedAgainstKnownUnaffordablePath`, `creditsMissingForKnownPath`.
- Remote-Contest-/Trash-Metriken wie `runnerSkippedAdvancedRemoteContest`, `runnerRemoteTrashOpportunity`, `runnerRemoteTrashTaken`.
- Breaker-/Coverage-Metriken wie `runnerSearchCardAvailableForMissingBreaker`, `runnerSearchCardUsedForMissingBreaker`, `runnerSearchCardAvailableButUnused`.
- Progression-/Stall-Metriken wie `samePlanRepeatedWithoutProgress` und `longestNoProgressChain`.

Diese Metriken waren nützlich, aber zu breit: Sie zählten einzelne genommene Economy-Actions oder allgemeine Credit-Discipline, nicht das Entscheidungsfenster mit sichtbaren legalen Economy-Kandidaten und den Grund, warum Economy genommen oder übersprungen wurde.

## Neue Diagnosemetriken

Neu ergänzt wurden Decision-Window-Metriken:

- `runnerEconomyDecisionWindows`
- `runnerLegalEconomyActions`
- `runnerEconomyTaken`
- `runnerEconomySkipped`
- `runnerEconomySkippedWhileLowCredits`
- `runnerEconomySkippedWhileKnownUnaffordablePath`
- Skip-Attribution: Pressure, Remote Contest, Setup, Draw, Run, Install Breaker, Trash, End Turn, Unknown.

Credit-/Reserve- und FixGate-Kontext:

- `runnerCreditStarvedWithLegalEconomy`
- `runnerCreditStarvedEconomyTaken`
- `runnerCreditStarvedEconomySkipped`
- `runnerKnownUnaffordablePathWithLegalEconomy`
- `runnerEconomyTakenToReachRunReserve`
- `runnerEconomyTakenButStillBelowReserve`
- `runnerEconomySkippedThenUnaffordableRun`
- `runnerRunStartedAfterSkippingEconomy`
- `runnerEconomyFixGateEligibleStarvedSkip`

Economy-vs-Progression:

- `runnerEconomyChosenOverFreshCentralPressure`
- `runnerEconomyChosenOverRemoteContest`
- `runnerEconomyChosenOverBreakerInstall`
- `runnerEconomyChosenOverCriticalSetup`
- `runnerEconomyChosenOverRelevantTrash`
- `runnerEconomyChosenWhileRich`
- `runnerEconomyChoicePlausible`
- `runnerEconomyChoiceSuspicious`

Finite/debt/downside:

- `runnerFinitePoolEconomySeen/Taken/Skipped`
- `runnerDebtEconomySeen/Taken/Skipped`
- `runnerDebtEconomyTakenWithoutNeed`
- `runnerEconomyWithDownsideSeen/Taken`
- `runnerDelayedPenaltyEconomyTaken`

Setup:

- `runnerMemoryBottleneckDecisionWindows`
- `runnerHandSizeBottleneckDecisionWindows`
- `runnerLegalMemoryHardwareActions`
- `runnerLegalHandSizeActions`
- `runnerMemoryHardwareTaken`
- `runnerHandSizeSupportTaken`
- `runnerMemorySupportSkippedWhileGripHasPrograms`
- `runnerHandSizeSupportSkippedWhileDamageRiskVisible`
- `runnerHandSizeFactUsedForDiagnosis`

Search/Recovery:

- `runnerLegalSearchActions`
- `runnerLegalRecoveryActions`
- `runnerSearchTaken`
- `runnerRecoveryTaken`
- `runnerSearchSkippedWhileMissingBreakerCoverage`
- `runnerRecoverySkippedWhileMissingBreakerCoverage`
- `runnerSearchTakenForBreakerCoverage`
- `runnerRecoveryTakenForBreakerCoverage`
- `runnerSearchOrRecoveryWindowWithNoInstallFollowup`
- `runnerSetupFixGateEligibleSearchRecoverySkip`

## Evidence und Sanitizing

Die Evidence bleibt side-safe und kompakt. Sie enthält Zähler und sichtbare Zustandsklassen wie Runner-Credits, Reserve-Ziel, Anzahl legaler Economy-/Search-/Recovery-Actions und Known-Path-/Coverage-Flags. Sie enthält keine `CardInstances`, keine FullGameState-Felder, keine private Payloads und keine Hidden-Zone-Kartenidentitäten.

## Focus-Tests

Ergänzt in `packages/ai/src/index.test.ts`:

- Low credits + legale Economy + Economy taken: starved window und plausible Reserve-Setup.
- Low credits + legale Economy + known unaffordable run: echter Skip, `runnerRunStartedAfterSkippingEconomy`, FixGate eligible.
- Rich Economy über fresh central pressure: suspicious diagnostic.
- Finite pool economy: seen/taken ohne infinite/repeatable Annahme.
- Debt economy without need: suspicious diagnostic only.
- MRAM/Militech: Hand-size-Support, nicht Memory-Support.
- Memory-Skip mit Programminstall-Kontext: Setup-FixGate.
- Search/Recovery bei fehlender Breaker-Coverage: Skip/Taken ohne Hidden-Zone-Identität.
- Hidden-State-Invarianz und DTO/Sanitizer.

## 8-Slot Diagnoseergebnis

Konfiguration: `runMatchProgressionBenchmarkSuite`, `includeHoldout: true`, `maxActions: 160`, Baseline `belief_ai_v1_4_2`, Candidate `current_candidate`, 8 runnable Slots.

Global Candidate:

- Safety: `illegalActions 0`, `replayFailures 0`, `timeoutRate 0`.
- ActionLimit-Summe über Slots: `2.777`.
- Corp Scores: `63`.
- Runner Steals: `117`.
- Runner Economy Windows: `2.189`.
- Legal Economy Actions: `3.072`.
- Economy Taken: `939`.
- Economy Skipped: `1.250`.
- Credit-starved with Legal Economy: `1.270`.
- Skipped while Known Unaffordable Path: `119`.
- Economy chosen while rich: `1`.
- Raw Economy over Fresh Central Pressure: `939`.
- Raw Economy over Remote Contest: `233`.
- Finite Pool Economy Taken: `2`.
- Debt Economy Taken: `0`.
- Memory Bottleneck Windows: `236`.
- Hand-size Bottleneck Windows: `112`.
- Legal Search Actions: `269`.
- Legal Recovery Actions: `141`.
- Setup FixGate Search/Recovery Skip: `120`.
- Economy FixGate Starved Skip: `55`.
- FixGate suspicious Rich Economy: `1`.
- FixGate suspicious Economy over Pressure after reserve normalization: `8`.
- FixGate suspicious Economy over Remote Contest after reserve normalization: `3`.
- Setup FixGate Memory Skip: `107`.

## Slot-Ergebnisse

Local Pair 1:

- Economy Windows `219`, Legal Economy Actions `422`, Taken `70`, Skipped `149`.
- Starved Known-Path Skips `0`.
- Search Actions `82`, Recovery Actions `69`.
- Search/Recovery FixGate `33`, Memory FixGate `6`, Hand-size Windows `28`.
- Interpretation: eher Search/Recovery-/Hand-size-Setup als Economy-Fix.

Local Pair 2:

- Economy Windows `175`, Legal Economy Actions `269`, Taken `72`, Skipped `103`.
- Starved Known-Path Skips `1`, Economy FixGate Starved Skip `1`.
- Search Actions `19`, Recovery Actions `12`, Search/Recovery FixGate `2`.
- Keine rich-economy oder normalized Economy-over-Pressure-FixGate-Fenster.

Snapshot Rig:

- Economy Windows `282`, Legal Economy Actions `282`, Taken `116`, Skipped `166`.
- Starved Known-Path Skips `29`, Economy FixGate Starved Skip `6`.
- Memory Windows `15`, Memory FixGate `2`.
- Ein normalized Economy-over-Pressure-FixGate-Fenster.

Snapshot Pressure:

- Economy Windows `296`, Legal Economy Actions `385`, Taken `107`, Skipped `189`.
- Starved Known-Path Skips `32`, Economy FixGate Starved Skip `11`.
- Memory Windows `30`, Memory FixGate `19`.
- Kein normalized Economy-over-Pressure-/Remote-Contest-FixGate.

Snapshot Holdout:

- Economy Windows `331`, Legal Economy Actions `397`, Taken `163`, Skipped `168`.
- Starved Known-Path Skips `34`, Economy FixGate Starved Skip `28`.
- Memory Windows `32`, Memory FixGate `9`.
- Kein normalized Economy-over-Pressure-/Remote-Contest-FixGate.

Real Scene Pair 1:

- Economy Windows `270`, Legal Economy Actions `435`, Taken `129`, Skipped `141`.
- Starved Known-Path Skips `9`, Economy FixGate Starved Skip `5`.
- Finite Pool Taken `2`.
- Search Actions `131`, Recovery Actions `60`, Search/Recovery FixGate `58`.
- Memory FixGate `25`.

Real Scene Pair 2:

- Economy Windows `309`, Legal Economy Actions `388`, Taken `159`, Skipped `150`.
- Starved Known-Path Skips `13`, Economy FixGate Starved Skip `3`.
- Hand-size Windows `75`.
- Search Actions `37`, Search/Recovery FixGate `27`.
- Kein normalized Economy-over-Pressure-/Remote-Contest-FixGate.

Smoke:

- Safety grün.
- Economy Windows `307`, Taken `123`, Skipped `184`.
- Ein rich-economy-FixGate-Fall; drei normalized Economy-over-Pressure/Remote-Contest-Fälle.
- Memory-FixGate hoch (`39`), aber Smoke ist Kontrollslot und nicht allein fixbegründend.

## Plausibel vs. suspicious

Die rohe Attribution `runnerEconomyChosenOverFreshCentralPressure` ist erwartbar hoch, weil viele Low-Credit-/Reserve-Fenster gleichzeitig zentrale Runs als legale, aber nicht sinnvoll bezahlte Pressure-Actions zeigen. Für FixGate zählt deshalb nur die normalisierte Variante ohne Reserve-/Need-Erklärung. Danach bleiben global nur `8` Economy-over-Pressure- und `3` Economy-over-Remote-Contest-Fälle.

Die stärkeren Signale sind nicht "Runner nimmt zu viel Economy", sondern:

- Starved Economy Skip bei bekannt unbezahlbarem Pfad: `55`.
- Memory-Skip bei sichtbarem Setup-Kontext: `107`.
- Search/Recovery-Skip bei fehlender Breaker-Coverage: `120`.

## Consumer-Readiness

Der Slice ist bereit für Diagnose-Verbrauch: `ready_for_runner_economy_setup_attribution_review`.

Nicht bereit ist ein aktiver Strategy-Consumer. Die FixGate-Zähler sind bewusst konservativ, aber sie brauchen vor einem Fix noch kleinere Attribution: Was wurde im Starved-Skip-Fenster tatsächlich gewählt, ob der Search/Recovery-Skip direkt zu No-Progress führt und ob Memory-Skip-Fenster wiederholt gleiche Rig-Bottlenecks erzeugen.

## Entscheidung

Kein breiter Runner-Economy-Fix.

Kein Economy-over-Pressure-Fix in diesem Schritt: normalized FixGate bleibt klein (`8` Pressure, `3` Remote Contest), und viele rohe Economy-over-Pressure-Fälle sind plausibel durch Reserve-/Low-Credit-Kontext.

Enger Economy-Fix noch nicht freigegeben: Starved Known-Path-Skips sind real (`55`), aber es fehlt noch die direkte Nachfolge-Attribution auf failed run/no progress/low-value action.

Search/Recovery/Memory-Fix ist der wahrscheinlichere nächste Fixpfad, aber ebenfalls erst nach einem engeren Attribution-Slice: `120` Search/Recovery-FixGate und `107` Memory-FixGate sind die stärkeren Signale.

## Bewusst nicht geändert

- Keine Engine-Regeländerung.
- Keine neue Legalität.
- Keine Action-Score-, Planner-, PlanWeight- oder Strategic-Line-Änderung.
- Keine Profilumschaltung.
- Keine neuen Decks.
- Keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine Runtime-Nutzung modularer Overlays.
- Keine aktive Hintmigration.

## Nächster praktischer Schritt

Aufgabe 028 sollte kein Kartenbatch sein. Empfohlen ist ein enger Runner Setup Attribution Slice für:

- Starved economy skip -> nächste Aktion -> known unaffordable run / no progress / low-value run.
- Search/Recovery legal + missing breaker coverage -> genutzt, verschleppt oder ohne Install-Followup.
- Memory/Hand-size bottleneck -> legal support skipped -> Programm-/Rig-Fortschritt blockiert.

Danach kann entschieden werden, ob ein enger Runner-Economy-Fix, ein Search/Recovery-Fix oder ein Memory-Setup-Fix gerechtfertigt ist.
