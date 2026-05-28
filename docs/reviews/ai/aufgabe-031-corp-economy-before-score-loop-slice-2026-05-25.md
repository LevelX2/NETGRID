# Aufgabe 031 - Corp Economy-before-score Loop Slice

## Kurzfazit

Aufgabe 031 schärft die Economy-before-score-Diagnose nach Aufgabe 030 und ergänzt einen sehr engen No-repeat-Economy-Malus in echten Score-/Advance-to-score-Terminalfenstern. Der Fix greift nur, wenn Score oder Advance-to-score bereits legal beziehungsweise terminal sichtbar sind und die Corp nicht mehr credit-blocked ist. Es gibt keine Engine-, Legalitäts-, Hint-, Profil-, Deck-, Runtime-Compiled-Index- oder Overlay-Änderung.

Der 8-Slot-Lauf bleibt safety-grün und hält das Aufgabe-030-Niveau bei Score/Steal: Candidate 61 Corp Scores, 118 Runner Steals, 0 illegal actions, 0 replay failures, 0 timeout rate. Die neue strengere Attribution zeigt aber, dass Economy-before-score noch nicht erledigt ist: Candidate 86 Economy-before-score-Taken, davon 84 trotz ausreichender Credits, 44 Repeated-Economy-within-3 und 71 Not-converted-within-3.

## Bezug zu Aufgabe 030

Aufgabe 030 ergänzte Score-Terminal-Fenster und priorisierte Score-now sowie Advance-to-score gegen Protection, Economy, Draw und planlose Remote-Aktionen. Danach blieben 26 suspicious Score-Terminal-Economy-Loop-Fenster sichtbar. Aufgabe 031 trennt diese grobe Zahl in:

- notwendige Economy,
- Economy trotz ausreichender Credits,
- wiederholte Economy,
- Nicht-Konversion innerhalb von drei Corp-Aktionen,
- Runner-Steal-Follow-up,
- Cheap-Remote-/Credits-/Runner-Contest-/Safety-Blocker.

## Audit bestehender Score-/Economy-Metriken

Bereits vorhanden:

- `corpEconomyBeforeScoreWindow`
- `corpEconomyBeforeScoreWindowNecessary`
- `corpScoreTerminalSkippedForEconomy`
- `corpScoreConversionFixGateSuspiciousEconomyLoop`
- `corpScoreTerminalSkippedThenEconomyLoop`
- `corpScoreTerminalSkippedThenScoreNextDecision`
- `scoreActionsAvailable`, `scoreActionsTaken`, `missedScoreWindows`
- `corpScoreTerminalScoreTaken`, `corpScoreTerminalAdvanceTaken`, `corpScoreTerminalAgendaInstalled`
- Cheap-Remote-Guardrails
- HQ-Density-/Draw-Dilution-Metriken

Zu breit war bisher `corpEconomyBeforeScoreWindow`: Es war primär Evidence-basiert aus Score-Compression und unterschied notwendige Economy nicht sauber von wiederholter Economy nach bereits ausreichenden Credits. Außerdem fehlten eigene Follow-up-Zähler für Economy -> Score/Advance/Agenda-Install, Economy -> Economy und Economy -> Runner steal.

## Neue Economy-before-score-Metriken

Ergänzt wurden:

- Window-Kontext: installed agenda, advanced agenda, score legal, advance-to-score legal, ready remote, HQ-agenda-to-ready-remote, credits short/enough, remote safe, runner contest high.
- Taken-Kontext: necessary credits, despite credits enough, over score legal, over advance-to-score legal, over agenda install ready remote, over HQ agenda exit.
- Conversion: converted to score/advance/agenda-install next decision, converted within 2/3 Corp actions, not converted within 3, repeated economy next/within 3, then draw/protect/new remote/runner steal/action limit.
- Plausibility: credits needed, rez/advance reserve, HQ/R&D safety, runner contest high, no agenda exit.
- Suspicious: credits already enough, repeated economy, delayed terminal action, remote still safe, runner steal follow-up, unclassified.
- FixGate: eligible, blocked by credits/cheap contest/runner contest/safety, suspicious repeated/no-conversion/steal-followup.

Die neuen Werte werden aus side-safe Summary-Feldern und Evidence erzeugt. Keine Hidden Cards, keine CardInstances und keine private Payloads werden ausgegeben.

## Implementierter enger Fix

In `corpScoreTerminalActionPriorityBonus` wird Economy in echten Score-/Advance-to-score-Fenstern stärker abgewertet, wenn Credits bereits reichen. Credit-blocked Economy bleibt plausibel und wird nicht pauschal verboten.

Das ist absichtlich kleiner als ein Agenda-install-after-economy-Fix:

- kein neues Mehrzug-Suchsystem,
- kein Install in cheap contestable remote,
- kein pauschales Economy-Verbot,
- keine neue Legalität,
- keine Hidden-Info-Nutzung.

Agenda-Install in Ready-Remote bleibt wie nach Aufgabe 030 nur leicht gebufft, weil ein breiterer Agenda-Install-Fix in Aufgabe 030 im ersten Benchmark schlechter war.

## Focus-Tests

Ergänzt beziehungsweise abgesichert:

- Economy necessary, then Advance next wird als plausible Konversion gezählt.
- Repeated Economy vor Score wird als suspicious repeated/no-conversion gezählt.
- Runner-Steal-Follow-up nach Economy-before-score wird als suspicious Follow-up gezählt.
- Cheap-contest-blocked Economy-before-score zählt nicht als suspicious FixGate.
- Bestehende Score legal now, Advance-to-score legal now und Agenda install into ready remote Auswahltests bleiben grün.
- DTO-/Sanitizer-Schutz bleibt über bestehende DecisionDebug-/Summary-Tests grün.

## 8-Slot Benchmark

Konfiguration:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- 8 runnable Slots

Global:

- Baseline: `corpScores = 52`, `runnerSteals = 132`, `corpEconomyBeforeScoreTaken = 57`, `corpEconomyBeforeScoreFixGateSuspicious = 33`
- Candidate: `corpScores = 61`, `runnerSteals = 118`, `actionLimitRate = 0.347`
- Candidate Economy-before-score:
  - `corpEconomyBeforeScoreWindow = 505`
  - `corpEconomyBeforeScoreTaken = 86`
  - `corpEconomyBeforeScoreTakenAsNecessaryCredits = 2`
  - `corpEconomyBeforeScoreTakenDespiteCreditsEnough = 84`
  - `corpEconomyBeforeScoreConvertedWithin3CorpActions = 15`
  - `corpEconomyBeforeScoreRepeatedEconomyWithin3 = 44`
  - `corpEconomyBeforeScoreNotConvertedWithin3CorpActions = 71`
  - `corpEconomyBeforeScoreThenRunnerSteal = 10`
  - `corpEconomyBeforeScoreFixGateSuspicious = 45`
  - `corpEconomyBeforeScoreFixGateSuspiciousRepeatedEconomy = 21`
  - `corpEconomyBeforeScoreFixGateSuspiciousNoConversion = 36`
  - `corpEconomyBeforeScoreFixGateSuspiciousStealFollowup = 6`

Guardrails:

- `corpAgendaInstalledInCheaplyContestableRemote = 0`
- `corpAdvanceInCheaplyContestableRemote = 0`
- `runnerRunStartedAgainstKnownUnpayableFullPath = 0`
- `corpFutureRunIceInstalledAsDeadEffect = 1`

## Slotbefunde

- Safety Smoke: 1 suspicious no-conversion Economy-before-score, no Cheap-Remote regression.
- Snapshot Rig: 7 Economy-before-score taken, 1 suspicious no-conversion.
- Snapshot Pressure: 2 taken, 0 suspicious.
- Snapshot Holdout: 13 taken, 4 suspicious, 2 repeated, 2 no-conversion.
- Local Pair 1: 17 taken, 13 suspicious, 8 repeated within 3, 16 not converted within 3, 3 runner-steal follow-ups.
- Local Pair 2: 16 taken, 11 suspicious, 13 repeated within 3, 11 not converted within 3, 4 runner-steal follow-ups.
- Real Scene Pair 1: 28 taken, 15 suspicious, 14 repeated within 3, 22 not converted within 3.
- Real Scene Pair 2: 2 taken, 0 suspicious.

## Entscheidung

**Fix umgesetzt und behalten, aber nicht als abgeschlossen bewerten.**

Begründung:

- Safety bleibt grün: 0 illegal actions, 0 replay failures, 0 timeout rate.
- Cheap-Remote-Guardrails bleiben bei 0.
- Known-no-access-run-Guardrail bleibt bei 0.
- Corp Scores und Runner Steals bleiben auf dem Aufgabe-030-Niveau.
- Der Fix ist eng und unterdrückt Economy nicht, wenn Credits tatsächlich fehlen.

Gleichzeitig zeigt die neue Attribution, dass ein breiterer Economy-before-score-Fix nicht gerechtfertigt ist. Die dominierenden Restsignale sind nicht "Score legal now, basic credit gewählt", sondern repeated/no-conversion nach Economy, besonders in Local Pair 1/2 und Real Scene Pair 1. Dafür braucht es als nächstes eine Folgeentscheidung auf konkrete Action-Familien und Remote-/HQ-Kontext, nicht mehr pauschal mehr Score-Priorität.

## Bewusst Nicht Geändert

- Keine Engine-Regeländerung.
- Keine neue Legalität und keine Änderung an LegalActions.
- Keine Hidden-Info-Nutzung.
- Kein pauschales Economy-Verbot.
- Keine pauschale "score immer sofort"-Heuristik.
- Keine Agenda-Installationen oder Advances in billig contestbare Remotes.
- Keine Profilumschaltung oder Profile-Promotion.
- Keine neuen Decks und keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index oder modularer Overlays.

## Nächster Schritt

Der nächste praktische Schritt ist ein **Release-/Default-Readiness-Review** mit klarer Rest-Risiko-Spalte für Economy-before-score. Die großen Fixes Runner Known-Path, Corp Future-ICE-Ordering und Score-Terminal sind stabil genug für eine konsolidierte Entscheidung; Economy-before-score bleibt als enger Follow-up, aber nicht als Blocker für den Review.
