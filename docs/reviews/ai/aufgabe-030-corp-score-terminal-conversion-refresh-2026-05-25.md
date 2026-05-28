# Aufgabe 030 - Corp Score Terminal Conversion Refresh

## Kurzfazit

Aufgabe 030 ergänzt einen Score-Terminal-Diagnose-Slice und einen engen Planer-Fix für echte Score-/Advance-to-score-Fenster. Wenn `score_agenda` legal ist oder ein `advance_card` die Agenda direkt in ein Scorefenster bringt, schlägt diese Terminal-Konversion nun Protection, Economy, Draw und planlose Remote-Aktionen, solange Cheap-Contest-, Credit- und Runner-Contest-Guardrails nicht blockieren.

Der Fix wurde nach dem ersten Benchmark bewusst eingeengt: Agenda-Install in einen Ready-Remote bekommt nur einen kleinen Bonus, aber keine harte Protection-/Economy-Penalty. Dadurch bleibt der Slice auf Terminal-Konversion fokussiert und verwässert Cheap-Remote-Safety nicht.

## Bezug zu Aufgabe 028/029

- Aufgabe 028 stabilisierte bekannte Runner-No-Access-Full-Path-Runs: `runnerRunStartedAgainstKnownUnpayableFullPath` bleibt im 8-Slot-Lauf bei 0.
- Aufgabe 029 stabilisierte Corp-ICE-Reihenfolge für Future-/Later-ICE; der Guardrail `corpFutureRunIceInstalledAsDeadEffect` bleibt niedrig.
- Aufgabe 030 nutzt diese stabileren Runpath-/Remote-Safety-Grundlagen, um Score-Konversion erneut zu prüfen.

## Audit der Score-Conversion-Metriken

Bereits vorhanden und weiterhin belastbar:

- `corpScores`, `scoreActionsAvailable`, `scoreActionsTaken`, `missedScoreWindows`, `scoreActionTakeRate`
- `corpProtectionConvertedToScoreWithin3`, `corpScorePathChosenAfterProtection`, `corpProtectionOpenedScorePath`
- `corpAgendaInstalledInCheaplyContestableRemote`, `corpAdvanceInCheaplyContestableRemote`
- `corpScoreWindowCompressionOpportunity`, `corpScoreWindowCompressionTaken`, `corpEconomyBeforeScoreWindow`
- `corpProtectionLoopAfterRemoteSafe`, `corpRemoteSafeButNoScoreActionTaken`, `corpRemoteSafeButAgendaHeld`

Zu breit oder nicht terminal genug waren die alten Fenster: sie trennten legale Score-Actions, Advance-to-score und Agenda-Install in einen fertigen Remote nicht sauber als Terminal-Conversion-Window. Außerdem fehlte eine Follow-up-Attribution für Skip -> Steal, Skip -> kein Scorefenster und Skip -> Loop.

## Neue Metriken

Ergänzt wurden unter anderem:

- `corpScoreTerminalWindow`
- `corpScoreTerminalWindowScoreLegal`
- `corpScoreTerminalWindowAdvanceToScoreLegal`
- `corpScoreTerminalWindowAgendaInstallLegal`
- `corpScoreTerminalWindowProtectedRemoteReady`
- `corpScoreTerminalScoreTaken`
- `corpScoreTerminalAdvanceTaken`
- `corpScoreTerminalAgendaInstalled`
- `corpScoreTerminalSkipped`
- Skip-Buckets für Protection, Economy, Draw, ICE, Asset/Upgrade, HQ/R&D Protection, Remote Portfolio und Unknown.
- Follow-ups: `corpScoreTerminalSkippedThenAgendaStolen`, `corpScoreTerminalSkippedThenNoScoreWindow`, `corpScoreTerminalSkippedThenActionLimit`, `corpScoreTerminalSkippedThenProtectionLoop`, `corpScoreTerminalSkippedThenEconomyLoop`, `corpScoreTerminalSkippedThenRemoteStillSafe`, `corpScoreTerminalSkippedThenScoreNextDecision`.
- FixGate: Eligible, blocked by Cheap Contest/Credits/Runner Contest/HQ Threat und suspicious Protection/Economy/Draw/RemotePortfolio/Unknown.

Evidence bleibt side-safe: keine Hidden Cards, keine CardInstances, keine FullGameState- oder private Payload-Felder.

## Implementierter Fix

In `packages/ai/src/corp-plans.ts` wurde `assessCorpScoreTerminalWindow` ergänzt. Die Bewertung trennt:

- legale Score-Actions,
- Advance-Actions, die direkt auf Score-Reife führen,
- Agenda-Install-Actions in bereits geschützte Remote-Pfade,
- Cheap-Contest-, Credit-, Runner-Contest- und HQ/R&D-Threat-Blocker.

Der Action-Priority-Fix ist eng:

- `score_agenda`: starker Terminal-Bonus.
- `advance_card` in ein Scorefenster: starker Terminal-Bonus.
- Agenda-Install in Ready-Remote: kleiner Bonus, keine harte Penalty gegen Economy/Protection.
- Nicht-terminale Protection/Economy/Draw/Remote-Aktionen werden nur in echten Score-/Advance-to-score-Fenstern abgewertet.

Nicht geändert wurden Engine, LegalActions, Hints, Profile, Decks oder Runtime-Compiled-Index.

## Focus-Tests

Ergänzt:

- Legal Score in sicherem Remote schlägt weitere Protection.
- Legal Advance-to-score schlägt Economy.
- Agenda-Install nutzt einen ready scoring remote statt Economy.
- Score-Terminal-Summary zählt Taken, Skipped, Skip-Buckets, FixGate-Blocker und Follow-ups.
- Cheap-contest-blocked Fenster zählen nicht als suspicious FixGate.
- Bestehende Cheap-Remote-, Score-Compression-, Protection-to-score- und Sanitizer-Tests bleiben grün.

## 8-Slot Benchmark

Konfiguration:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- 8 runnable Slots

Global:

- Baseline: `corpScores = 52`, `runnerSteals = 132`, `corpScoreConversionFixGateEligible = 117`
- Candidate: `corpScores = 61`, `runnerSteals = 118`, `corpScoreConversionFixGateEligible = 114`
- Candidate Safety: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`
- Candidate Score-Terminal: `corpScoreTerminalWindow = 505`, `corpScoreTerminalSkipped = 261`
- Candidate suspicious: Protection Loop 0, Economy Loop 26
- Candidate Follow-up: `corpScoreTerminalSkippedThenAgendaStolen = 59`

Guardrails:

- `corpAgendaInstalledInCheaplyContestableRemote = 0`
- `corpAdvanceInCheaplyContestableRemote = 0`
- `runnerRunStartedAgainstKnownUnpayableFullPath = 0`
- `corpFutureRunIceInstalledAsDeadEffect = 1`

Der erste breitere Fix-Entwurf kam nur auf 55 Corp Scores und 120 Runner Steals. Deshalb wurde Agenda-Install wieder enger gefasst und der finale Fix auf Score/Advance-Terminalfenster begrenzt.

## Slotbefunde

- Safety Smoke: Candidate 10 Corp Scores, 15 Runner Steals, 21 FixGate-eligible, 1 suspicious Economy-Loop.
- Snapshot Rig: Candidate 11 Corp Scores, 17 Runner Steals, 16 FixGate-eligible, 1 suspicious Economy-Loop.
- Snapshot Pressure: Candidate 13 Corp Scores, 22 Runner Steals, 14 FixGate-eligible, 0 suspicious Economy-Loop.
- Snapshot Holdout: Candidate 6 Corp Scores, 21 Runner Steals, 21 FixGate-eligible, 4 suspicious Economy-Loops.
- Local Pair 1: Candidate 2 Corp Scores, 8 Runner Steals, 12 FixGate-eligible, 7 suspicious Economy-Loops.
- Local Pair 2: Candidate 3 Corp Scores, 15 Runner Steals, 6 FixGate-eligible, 4 suspicious Economy-Loops.
- Real Scene Pair 1: Candidate 10 Corp Scores, 14 Runner Steals, 18 FixGate-eligible, 9 suspicious Economy-Loops.
- Real Scene Pair 2: Candidate 6 Corp Scores, 6 Runner Steals, 6 FixGate-eligible, 0 suspicious Economy-Loop.

## FixGate-Auswertung

Protection-Loops nach Score-Terminal-Fenstern dominieren nicht mehr: `corpScoreConversionFixGateSuspiciousProtectionLoop = 0`.

Das verbleibende Signal liegt bei Economy-Loops vor scorebaren Fenstern: global 26 suspicious Economy-Loop-Fenster, konzentriert in Local Pair 1, Local Pair 2, Snapshot Holdout und Real Scene Pair 1. Das rechtfertigt keinen breiten Score-Boost mehr, aber es ist ein brauchbarer enger Folgepunkt.

## Entscheidung

**Fix umgesetzt und behalten.**

Begründung:

- Candidate verbessert im aktuellen 8-Slot-Vergleich Corp Scores von 52 auf 61 und Runner Steals fallen von 132 auf 118.
- Cheap-Remote-Guardrails bleiben bei 0.
- Known-No-Access-Run-Guardrail bleibt bei 0.
- Keine illegal actions, replay failures oder timeouts.
- Der Fix ist nach der Einengung auf Score/Advance-Terminalfenster begrenzt.

Gleichzeitig ist der Fix keine Profilpromotion und keine Aussage, dass Corp-Score-Conversion abgeschlossen ist. Gegen den Aufgabe-029-Kontext ist die absolute Candidate-Scorezahl nicht besser; deshalb bleibt der nächste Schritt ein enger Economy-before-score-Loop-Slice statt weiterer globaler Score-Priorität.

## Bewusst Nicht Geändert

- Keine Engine-Regeländerung.
- Keine neue Legalität und keine Änderung an LegalActions.
- Keine Hidden-Info-Nutzung.
- Keine pauschale "score immer sofort"-Heuristik.
- Keine Cheap-Remote-Safety-Verwässerung.
- Keine Profilumschaltung oder Profile-Promotion.
- Keine neuen Decks und keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index oder modularer Overlays.

## Nächster Schritt

Der nächste praktische Schritt ist ein enger **Corp Economy-before-score Loop Slice**: nicht Score weiter boosten, sondern die 26 verbleibenden suspicious Economy-Loop-Fenster attribuieren. Besonders wichtig sind Local Pair 1, Local Pair 2, Snapshot Holdout und Real Scene Pair 1.
