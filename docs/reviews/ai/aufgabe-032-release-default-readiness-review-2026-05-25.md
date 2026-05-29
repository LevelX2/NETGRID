# Aufgabe 032 - AI: Release / Default Readiness Review nach Runpath-, ICE-Ordering- und Score-Conversion-Fixes

## Kurzfazit

Technische Empfehlung: `merge_ready_with_documented_risk`, `profile_gated_ready_with_risks`, `default_not_ready_observe_more`.

Der aktuelle `current_candidate` ist im frischen 8-Slot-Lauf safety-stabil und verbessert die globale Corp-Score-/Runner-Steal-Bilanz gegenüber `belief_ai_v1_4_2`: 61 Corp Scores statt 52, 118 Runner Steals statt 132. Die Kern-Guardrails bleiben intakt: keine illegalen Actions, keine Replay-Failures, keine Timeouts, keine Cheap-Remote-Agenda-/Advance-Fälle, keine bekannten No-Access-Full-Path-Runs und keine Multi-ICE-Future-Dead-Order.

Für eine technische Code-Integration spricht, dass die Fixes eng, testgedeckt und guardrail-stabil sind. Für eine sofortige Default-Promotion reicht der Review noch nicht: Economy-before-score bleibt mit 86 Taken, 44 repeated within 3 und 71 not converted within 3 das wichtigste dokumentierte Restrisiko; Snapshot Holdout bleibt schwächer bei Corp Scores und Local Pair 2 hat ein ActionLimit-/Economy-loop-Warnsignal.

## Scope und Nicht-Ziele

Dieser Review bewertet nur technische AI-Readiness nach den Aufgaben 025 bis 031. Er trifft keine Release-, Merge-, Default- oder Profilumschaltentscheidung.

Bewusst nicht geändert:

- keine Codeänderung
- keine Strategie-, PlanWeight- oder Action-Score-Änderung
- keine Engine-Regeländerung
- keine LegalAction-Änderung
- keine Profilumschaltung
- keine neuen Decks
- keine Holdout-Optimierung
- keine Änderung an `aiSupportStatus`
- keine Änderung an `data/ai/ai-card-hints-active.json`
- keine Runtime-Nutzung des Compiled Index
- keine Runtime-Nutzung modularer Overlays
- keine aktive Hintmigration

## Geprüfte Commits und Vorarbeiten

| Aufgabe     | Commit                                     | Bewertung                                                                                                |
| ----------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Aufgabe 025 | `d8b15a115aa23a066f9ec17c375cd62ca1871d7e` | Tag/Punish-Unknown-Skips wurden als Multi-Payoff-Metrikartefakte normalisiert; kein Strategie-Fix nötig. |
| Aufgabe 026 | `e0f948de6b930795955a4d31246fd4ab3e483b85` | Runner-Economy-/Resource-/Hardware-Facts read-only stabilisiert; keine Runtime-/Plannerwirkung.          |
| Aufgabe 027 | `e1457065a2a63b5feea9b02e448d6677194324ec` | Runner-Economy-/Setup-FixGates diagnostiziert; kein breiter Strategie-Fix.                               |
| Aufgabe 028 | `00210beae33a4eacd8aad4234e34bd32351b0aa9` | Bekannte Runner-No-Access-Full-Path-Runs werden sequentiell erkannt und abgewertet.                      |
| Aufgabe 029 | `99e4843f5ad583cea38a9a6b2ea5a76021d0f753` | Corp-Future-ICE-Ordering positionssensitiv verbessert.                                                   |
| Aufgabe 030 | `14b92355`                                 | Score-now und Advance-to-score schlagen Protection/Economy/Draw in engen sicheren Terminalfenstern.      |
| Aufgabe 031 | `89f8b3f0`                                 | Economy-before-score-Diagnose geschärft und enger No-repeat-Malus in Score-/Advance-Fenstern eingeführt. |

Ausgangsstatus vor Review: Branch `codex/ai-legal-action-diagnosis`, letzter Commit `89f8b3f0 ai: reduce corp economy loops before score`, Worktree sauber.

## Check-Ergebnisse

Alle geforderten Checks wurden frisch ausgeführt und waren grün:

- `corepack pnpm check:ai-generated-fact-batch12-runner-economy-closeout`
- `corepack pnpm check:ai-generated-fact-batch11-tag-punish-closeout`
- `corepack pnpm check:ai-generated-fact-batch10-runner-survival-closeout`
- `corepack pnpm check:ai-generated-fact-batch9-corp-nodes-closeout`
- `corepack pnpm check:ai-generated-fact-batch8-corp-economy-closeout`
- `corepack pnpm check:ai-generated-fact-batch7-corp-ice-closeout`
- `corepack pnpm check:ai-generated-fact-batch6-runner-info-closeout`
- `corepack pnpm check:ai-generated-fact-batch5-breaker-closeout`
- `corepack pnpm check:ai-generated-fact-batch4-corp-remote-closeout`
- `corepack pnpm check:ai-generated-fact-batch3-closeout`
- `corepack pnpm check:ai-generated-fact-batch2-rollup`
- `corepack pnpm check:ai-generated-fact-batch1-rollup`
- `corepack pnpm check:ai-derived-facts`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-generated-fact-migration-priority`
- `corepack pnpm check:ai-manual-overlays`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `git diff --check`

Die read-only Derived-/Compiled-/Overlay-/Hint-Checks melden weiterhin bekannte Warnings, aber 0 Hard Errors. Der AI-Testlauf hatte 28 Testdateien und 554 Tests grün.

## Frischer 8-Slot Benchmark

Konfiguration:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- 8 runnable Slots, 9 Seeds pro Slot
- temporärer Harness erstellt und danach gelöscht

### Global

| Metrik            | Baseline | Candidate | Delta |
| ----------------- | -------: | --------: | ----: |
| Games             |       72 |        72 |     0 |
| ActionLimitRate   |    0.347 |     0.347 | 0.000 |
| Corp Scores       |       52 |        61 |    +9 |
| Runner Steals     |      132 |       118 |   -14 |
| Score+Steal total |      184 |       179 |    -5 |
| illegalActions    |        0 |         0 |     0 |
| replayFailures    |        0 |         0 |     0 |
| timeoutRate       |        0 |         0 |     0 |

Interpretation: Candidate verschiebt die Progression sichtbar zugunsten der Corp, ohne Safety-Bruch. Der leicht niedrigere Score+Steal total ist nicht automatisch negativ, weil er vor allem aus weniger Runner Steals kommt; für Default reicht die Slot-Stabilität aber noch nicht.

### Slots

| Slot              | Baseline Corp Scores | Candidate Corp Scores | Baseline Runner Steals | Candidate Runner Steals | ActionLimit Candidate | Bewertung                                                                        |
| ----------------- | -------------------: | --------------------: | ---------------------: | ----------------------: | --------------------: | -------------------------------------------------------------------------------- |
| Smoke             |                    7 |                    10 |                     14 |                      15 |                 0.667 | Corp verbessert, Runner Steals leicht höher; Safety bleibt sauber.               |
| Snapshot Rig      |                   10 |                    11 |                     22 |                      17 |                 0.111 | Klar positiv: mehr Corp Scores, weniger Runner Steals, bessere ActionLimitRate.  |
| Snapshot Pressure |                   10 |                    13 |                     27 |                      22 |                 0.333 | Positiv trotz höherer ActionLimitRate als Baseline.                              |
| Snapshot Holdout  |                    9 |                     6 |                     19 |                      21 |                 0.556 | Negativer Holdout-Ausreißer; wichtigstes Default-Risiko.                         |
| Local Pair 1      |                    2 |                     2 |                     10 |                       8 |                 0.000 | Stabil bis leicht positiv; Economy-loop-Rest bleibt sichtbar.                    |
| Local Pair 2      |                    0 |                     3 |                     19 |                      15 |                 0.222 | Fortschritt bei Scores/Steals, aber ActionLimit-Warnsignal und repeated Economy. |
| Real Scene Pair 1 |                    8 |                    10 |                     15 |                      14 |                 0.556 | Leicht positiv bei Scores/Steals, Economy-before-score-Risiko steigt.            |
| Real Scene Pair 2 |                    6 |                     6 |                      6 |                       6 |                 0.333 | Ergebnis stabil, ActionLimitRate besser als Baseline.                            |

### Guardrails

| Guardrail                                       | Baseline | Candidate | Bewertung                                 |
| ----------------------------------------------- | -------: | --------: | ----------------------------------------- |
| `corpAgendaInstalledInCheaplyContestableRemote` |        0 |         0 | intakt                                    |
| `corpAdvanceInCheaplyContestableRemote`         |        0 |         0 | intakt                                    |
| `runnerRunStartedAgainstKnownUnpayableFullPath` |        0 |         0 | intakt                                    |
| `corpFutureRunIceInstalledAsDeadEffect`         |        1 |         1 | nicht verschlechtert, Restrisiko bleibt 1 |
| `corpMultiIceInstallOrderFutureEffectDead`      |        1 |         0 | verbessert                                |
| `corpRemotePortfolioOverExpanded`               |        6 |         0 | verbessert                                |
| `corpNewRemoteCreatedWithoutPayloadPlan`        |       15 |        10 | verbessert, aber nicht 0                  |

### Recent Fix Metrics

| Bereich                                  | Baseline | Candidate | Bewertung                                               |
| ---------------------------------------- | -------: | --------: | ------------------------------------------------------- |
| Tag/Punish DecisionWindows               |       26 |        36 | mehr sichtbare Fenster                                  |
| Tag/Punish Taken                         |       26 |        35 | Payoffs werden genommen                                 |
| Tag/Punish Skipped                       |        0 |         1 | ein echter Skip, nicht suspicious                       |
| Tag/Punish Unknown nach Normalisierung   |        0 |         0 | geklärt                                                 |
| Tag/Punish FixGate suspicious normalized |        0 |         0 | kein Fixpfad                                            |
| Runner First-Probe unknown ICE erlaubt   |      290 |       339 | Probe-Runs bleiben möglich                              |
| Runner known no-access suppressed        |      411 |       379 | Suppression aktiv, keine bekannten Full-Path-Fehlstarts |
| Future ICE live effect                   |        5 |         6 | leicht verbessert                                       |
| Future ICE dead effect                   |        1 |         1 | Restrisiko unverändert                                  |
| Multi-ICE future dead order              |        1 |         0 | behoben                                                 |
| ScoreTerminalWindow                      |      466 |       505 | mehr score-relevante Fenster                            |
| ScoreTerminalScoreTaken                  |       52 |        61 | verbessert                                              |
| ScoreTerminalAdvanceTaken                |       50 |        52 | leicht verbessert                                       |
| ScoreTerminalSkipped                     |      234 |       261 | mehr Fenster, weiter viele Skips                        |
| Score suspicious EconomyLoop             |       21 |        26 | bleibt Hauptrestrisiko                                  |
| Score suspicious ProtectionLoop          |        0 |         0 | geschlossen                                             |
| EconomyBeforeScoreWindow                 |      466 |       505 | mehr Fenster                                            |
| EconomyBeforeScoreTaken                  |       57 |        86 | höher                                                   |
| EconomyBeforeScoreRepeatedWithin3        |       23 |        44 | Restrisiko                                              |
| EconomyBeforeScoreNotConvertedWithin3    |       49 |        71 | Restrisiko                                              |

## Bewertung der Aufgaben 025-031

Aufgabe 025 hat einen falschen Fixpfad geschlossen: Die Tag/Punish-Unknown-Skips waren window-normalisierte Multi-Payoff-Artefakte. Der aktuelle Benchmark bestätigt 0 normalized unknown und 0 suspicious Tag/Punish-FixGate.

Aufgabe 026 bleibt ein read-only Datenqualitätsfortschritt. Die Generated-Facts-Gates sind grün; es wurde keine Runtime-Migration begonnen.

Aufgabe 027 ist als Diagnosefundament weiterhin relevant. Search/Recovery- und Memory-FixGates aus diesem Slice sind nicht gelöst, aber sie brechen keine Safety und sind kein Merge-Blocker für die späteren engen Fixes.

Aufgabe 028 ist technisch stark: bekannte Full-Path-No-Access-Runs bleiben bei 0, First-Probe gegen unbekanntes ICE bleibt erhalten.

Aufgabe 029 ist technisch stark: Multi-ICE-Future-Dead-Order fällt auf 0. Ein einzelner `corpFutureRunIceInstalledAsDeadEffect` bleibt als Kontext-/Notfallrestrisiko, aber ohne Regression.

Aufgabe 030 ist der größte Performance-Hebel in diesem Block: ScoreTerminalScoreTaken steigt auf 61, Runner Steals fallen auf 118, Protection-Loop-Suspicious bleibt 0.

Aufgabe 031 ist eng und guardrail-stabil, aber nicht vollständig lösungsstark: Economy-before-score wurde verbessert und eingegrenzt, bleibt aber der klarste offene Diagnosebereich.

## Readiness-Matrix

| Kategorie                    | Bewertung                          | Begründung                                                                                                                                                                                |
| ---------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code-/Merge-Würdigkeit       | `merge_ready_with_documented_risk` | Checks, Tests, Typecheck und Guardrails sind grün; Fixes sind eng und nachvollziehbar. Dokumentierte Risiken bleiben Economy-before-score, Snapshot Holdout und Local Pair 2 ActionLimit. |
| Profile-gated Nutzung        | `profile_gated_ready_with_risks`   | Candidate ist safety-stabil und besser bei Corp Scores/Runner Steals. Profile-gated Beobachtung ist sinnvoll, gerade wegen der offenen Economy-/Holdout-Risiken.                          |
| Default-Promotion            | `default_not_ready_observe_more`   | Global positiv, aber Snapshot Holdout verschlechtert sich und Economy-before-score bleibt stark. Default sollte erst nach Beobachtungssuite oder weiterem engen Follow-up geprüft werden. |
| Nächster technischer Schritt | `default_gate_observation_suite`   | Kein weiterer Sofort-Fix ist zwingend vor Code-Integration; für Default braucht es eine breitere Beobachtung mit Fokus auf Economy-before-score, Holdout und Local Pair 2.                |

## Restrisiken

- Economy-before-score bleibt der dominante offene Score-Conversion-Bereich: Candidate hat 86 Taken, 44 repeated within 3 und 71 not converted within 3.
- Snapshot Holdout ist der wichtigste Gegenbefund: Corp Scores fallen von 9 auf 6, Runner Steals steigen von 19 auf 21.
- Local Pair 2 verbessert Score/Steal-Bilanz, zeigt aber 0.222 ActionLimitRate und 13 repeated Economy-before-score within 3.
- Real Scene Pair 1 verbessert Score/Steal leicht, aber Economy-before-score-Suspicious steigt deutlich.
- Die alte breite Kategorie `runsStartedAgainstKnownUnaffordablePath` bleibt als Coverage-/Unbreakable-Kontext separat zu beobachten; der enge Full-Path-Fehler bleibt jedoch bei 0.
- `corpFutureRunIceInstalledAsDeadEffect` bleibt bei 1, auch wenn Multi-ICE-Dead-Order auf 0 fällt.
- Runner-Setup aus Aufgabe 027 ist diagnostisch offen: Search/Recovery- und Memory-FixGates wurden nicht aktiv gefixt.
- Generated Facts und Compiled Index bleiben read-only; keine Runtime-Migration wurde bewertet.

## Technische Empfehlung

Aus technischer Sicht ist der Code nach Aufgaben 025 bis 031 merge-würdig mit dokumentiertem Risiko. `current_candidate` ist als profile-gated Candidate sinnvoll weiter nutzbar. Eine Default-Promotion sollte nicht direkt aus diesem Review folgen; dafür sind Snapshot Holdout, Economy-before-score und Local Pair 2 noch zu auffällig.

Praktischer nächster Schritt: eine Default-Gate-Beobachtungssuite mit denselben Guardrails, plus gezielter Auswertung von Economy-before-score in Snapshot Holdout, Local Pair 2 und Real Scene Pair 1. Wenn diese Beobachtung die gleichen repeated/no-conversion Muster bestätigt, ist ein enger Economy-before-score-Follow-up gerechtfertigt. Wenn sie stabil bleibt oder die Risiken klein sind, kann Default-Promotion erneut technisch geprüft werden.
