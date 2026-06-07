# AI-STRAT-1 bis AI-STRAT-4 Runner Intent, Run Targets und Golden Deck

Status: in Umsetzung

## Quelle/Vorgabe

Ausgangspunkt ist der Nutzerdialog vom 2026-06-07 zur Ableitung eines vierstufigen Anpassungspakets aus dem Blink-Deck-Analysebefund. Die finale Vorgabe lautet:

- Die Umsetzung erfolgt direkt im selben Chat nach dem Skill `paketprozess-worktree-goal`.
- Die Module sollen generisch für Runner funktionieren, nicht Blink-spezifisch.
- `Blink Pressure Rig` ist Golden-Deck-Testdeck und Kalibrierbeispiel.
- AI-PLAN-3 bis AI-PLAN-8 sind abgeschlossen und liefern `DeckCapabilityProfile`, capability-aware TacticalPlans, Coverage-/MU-/Credit-/Bank-/Rez-Reserve-Blocker, Candidate-Mapping und redigierten Debug.
- Offen ist die Übersetzung von diagnostischen Deckprofilen und DeckCapabilities in spielprägende Runner-Absicht, Run-Zielbewertung und TacticalGoal-Integration.
- Die Änderung wird direkt live wirksam, aber konservativ und mit bestehendem Fallback.

Führende Vorartefakte:

- `docs/architecture/ai/ai-plan-3-8-deck-capability-tactical-plans-automation-process-2026-06-06.md`
- `docs/reviews/ai/ai-plan-3-8-deck-capability-tactical-plans-final-report-2026-06-06.md`
- `docs/architecture/ai/ai-fix-remote-known-access-payoff-automation-process-2026-06-06.md`
- `docs/reviews/ai/ai-fix-remote-known-access-payoff-final-report-2026-06-06.md`
- `data/ai/ai-local-realistic-benchmark-decks-2026-05-23.json`
- `data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json`

## Zielprüfung

Die Vorgabe ist präzise genug für direkte Umsetzung:

- Gesamtziel: Aus diagnostischen Deckprofilen und vorhandenen DeckCapabilities eine live nutzbare, side-sichere Runner-Strategie- und Zielschicht ableiten.
- Reihenfolge: StrategicIntentProjection vor RunTargetEvaluation/EconomyPosture, danach TacticalGoalIntegration, zuletzt Golden-Deck-Tests und Debug.
- In Scope: `@netgrid/ai`-Module, fokussierte AI-Tests, Prozess- und Review-Artefakte.
- Nicht-Ziele: keine neuen Strategy-IDs, keine neuen Taktiksignale, keine Kartensemantikänderung, keine Engine-/LegalAction-/`applyAction`-Änderung, keine Hidden-Info-Ausweitung, keine Gate-Kaskade.
- Sicherheitsgrenzen: finale Action bleibt Engine-`LegalAction`; TacticalGoals erzeugen keine Legalität; Debug bleibt redigiert.
- Verifikation: `@netgrid/ai` typecheck, fokussierte Vitest-Dateien, `git diff --check`.

Konservative Annahmen:

- Neue Intent-, Posture-, Recommendation- und Goal-Namen werden als AI-interne Runtime-Enums geführt, nicht als Strategy-Taxonomie.
- Economy-Zahlen werden nur konservativ und relativ verwendet; harte Kalibrierwerte bleiben testbar über Verhaltensklassen.
- `known-low`, `known_no_current_payoff` und Score-Threat dürfen nur aus vorhandener side-sicherer Memory-, Public-State- oder PlayerView-Evidence entstehen.
- Wenn eine Projektion unsicher ist, bleibt bestehendes TacticalPlan-/Semantic-Runtime-Ranking Fallback.

## Gesamtziel

Die Runner-KI soll nicht nur diagnostische Strategy Scores und DeckCapabilities sehen, sondern daraus eine spielbare Absicht ableiten:

1. Was ist mein Gewinnplan?
2. Welche Ausführungsart und Setup-Engine unterstützt ihn?
3. Welche Run-Ziele sind jetzt sinnvoll?
4. Wann ist Economy/Setup besser als ein legaler Run?
5. Welche TacticalGoals sollen vorhandene TacticalPlans priorisieren?

Für `Blink Pressure Rig` bedeutet das: Agenda-Steal bleibt der Primärplan; Run-Tempo, Breaker-Suche, Rig-Aufbau und Economy sind Mittel; riskante Universalbreaker-Runs werden nur bei ausreichendem Payoff und Puffer bevorzugt.

## Nicht-Ziele

- Keine neuen Strategy-IDs oder Taktiksignale in `data/ai/*`.
- Keine Hintmigration.
- Keine neue Kartensemantik.
- Keine Engine-, Shared-LegalAction-, `applyAction`-, Replay-, StateHash- oder Zufallspfad-Änderung.
- Keine vollständige Agenda-/ICE-Planungs-KI.
- Keine Korp-Intent-Erweiterung.
- Keine öffentliche Debug-Ausgabe von vollständiger Deckliste, Deckreihenfolge, privater Snapshot-ID oder gegnerischer Hidden-Info.
- Kein Remote-Push und keine PR-Erstellung.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt ist oder ein Sicherheitsblocker dokumentiert wurde.
- Jede gewählte Action muss aus `input.legalActions` stammen.
- TacticalGoals und StrategicIntent dürfen nur priorisieren, blockieren, erklären und mappen; sie erzeugen keine Legalität.
- `applyAction` bleibt Regelautorität.
- Side-sichere eigene Deckdaten bleiben AI-intern und Debugfacts redigiert.
- Unvollständige Daten führen zu konservativem Fallback, nicht zu geratenen Hidden-Info-Annahmen.

## Automatische Fehlerbehandlung

- Bei TypeScript- oder Testfehlern wird eng im aktuellen Paket debuggt.
- Wenn diagnostische Profile fehlen oder unvollständig sind, wird der Builder konservativ gegen vorhandene Snapshots/Capabilities getestet.
- Wenn bekannte Zugriffs-/Remote-Payoff-Daten nicht eindeutig side-sicher verfügbar sind, wird der Fall als unknown/low-confidence behandelt.
- Wenn TacticalGoal-Namen mit diagnostischen AI045-Taxonomiebegriffen kollidieren, bleiben sie im neuen Runtime-Modul isoliert.
- Bei Mergekonflikten werden beide fachlichen Intentionen gelesen und kompatibel zusammengeführt; bei Vertragskonflikt entsteht ein Blocker-Report.

## Sicherheitsblocker

- Auswahl einer nicht legalen oder nicht in `input.legalActions` enthaltenen Action.
- Nutzung verdeckter gegnerischer Kartendaten.
- Offenlegung vollständiger eigener Deckliste, Deckreihenfolge, privater Snapshot-ID oder gegnerischer Hidden-Info in Debug, PlayerViews, PublicEvents, Logs oder Payloads.
- Änderung an `applyAction`, LegalAction-Erzeugung oder Engine-Regelvalidierung.
- Neue Strategy-ID-/Taktiksignal-Erweiterung ohne separaten Freigabeprozess.
- Nicht auflösbarer Konflikt zwischen neuer Runner-Intent-Schicht und bestehenden Semantic-Runtime-Safety-Gates.

## State Machine

`preflight` -> `ai_strat_1_runner_strategic_intent_projection` -> `ai_strat_2_runner_run_target_economy_posture` -> `ai_strat_3_runner_tactical_goal_integration` -> `ai_strat_4_golden_deck_debug` -> `final_verify` -> `merge_main` -> `complete`

## Paketfolge

### AI-STRAT-1: Runner StrategicIntentProjection

Ziel: Ein kleines AI-internes Modul erzeugt aus diagnostischem Deckstrategieprofil plus `DeckCapabilityProfile` ein generisches `RunnerStrategicIntentProfile`.

Eingangsvoraussetzungen:

- `buildDeckStrategyProfile` bleibt diagnostische Quelle mit `plannerEffect: "none"`.
- `DeckCapabilityProfile` ist über AI-PLAN-3 bis AI-PLAN-8 vorhanden.

Konkrete Arbeit:

- Typen und Builder für `RunnerStrategicIntentProfile` ergänzen.
- Felder trennen: `primaryWinIntent`, `executionStyle`, `setupEngine`, `pressureVectors`, `riskProfile`, `rejectedIntents`, `confidence`, `evidence`.
- SupportScore ohne Anchor-/Payoff-Evidence darf keinen WinIntent erzeugen.
- Economy/Draw/Search werden als FeasibilitySupport behandelt, nicht als strategySpecificSupport.
- Blink Pressure Rig als Fixture/Builder-Test aus vorhandenem Snapshot/Profil absichern.

Kernartefakte:

- AI-Modul für Runner StrategicIntent.
- Fokussierte Tests für Blink Pressure Rig und generische Support-Normalisierung.

Done-Gate:

- Blink Pressure Rig ergibt `runner.steal_agendas_default` als Primärabsicht.
- `runner.run_event_tempo` wird Ausführungsstil.
- Search/Rig/Economy werden Setup-Engine.
- generische HQ-/R&D-Supportwerte ohne spezifischen Anchor erzeugen keine Dedicated-Pressure-Absicht.
- Keine neuen Strategy-IDs oder Taktiksignaldateien werden geändert.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- fokussierte Vitest-Datei für StrategicIntent
- `git diff --check`

Commit-Vorschlag: `AI-STRAT-1: Runner StrategicIntentProjection einführen`

### AI-STRAT-2: Runner RunTargetEvaluation + EconomyPosture

Ziel: Runner-Runs werden vor der Planpriorisierung nach Zielwert, Kosten, Puffer, bekannten Zugriffsdaten, Universalbreaker-Risiko und Economy-FundingNeed bewertet.

Eingangsvoraussetzungen:

- AI-STRAT-1 ist abgeschlossen.
- Vorhandene Known-Remote-/Known-Central-Payoff-Bausteine werden wiederverwendet.

Konkrete Arbeit:

- Typen und Builder für `RunnerRunTargetEvaluation` und `RunnerEconomyPosture` ergänzen.
- HQ, R&D, Archives und Remotes bewerten.
- AccessPayoff, knownAccessState, multiaccess, pathPassability, pathCost, creditsAfterRun, Trash-/Steal-Bezahlbarkeit, risky universal coverage, credit floor und funding need berücksichtigen.
- Empfehlungen normalisieren: `run_now`, `run_if_free`, `setup_first`, `gain_credits_first`, `find_breaker_first`, `do_not_run_now`.
- Keine vollständige Agenda-/ICE-Planungs-KI bauen.

Kernartefakte:

- AI-Modul für RunTargetEvaluation/EconomyPosture.
- Tests für unknown R&D, known-low R&D, known no-payoff Remote, fehlende Coverage/Blink-Setup und Economy-Vorrang.

Done-Gate:

- R&D unbekannt + erreichbar wird attraktiv.
- R&D known-low + kein Multiaccess wird gemieden.
- Remote known no-current-payoff wird gemieden.
- Remote Score Threat + fehlende Universal-Coverage erzeugt Setup-/Find-Breaker-Empfehlung.
- 0-2 Credits ohne hohen Payoff bevorzugen Economy/Setup.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- fokussierte Vitest-Datei für RunTarget/Economy
- `git diff --check`

Commit-Vorschlag: `AI-STRAT-2: Runner RunTargetEvaluation und EconomyPosture ergänzen`

### AI-STRAT-3: Runner TacticalGoalIntegration

Ziel: StrategicIntent, RunTargetEvaluation, EconomyPosture und DeckCapabilityProfile erzeugen AI-interne Runner TacticalGoals, die vorhandene TacticalPlans priorisieren und erklären.

Eingangsvoraussetzungen:

- AI-STRAT-1 und AI-STRAT-2 sind abgeschlossen.

Konkrete Arbeit:

- Runtime-TacticalGoal-Typen isoliert von der diagnostischen AI045-Taxonomie ergänzen.
- Builder für Opening-/Midgame-Ziele erstellen.
- Goals in vorhandenen Runner-/TacticalPlan-Kontext integrieren, ohne Legalität zu erzeugen.
- Konservative Fallbacks erhalten.

Kernartefakte:

- AI-Modul für Runner TacticalGoalIntegration.
- Tests für Blink Opening-Goals und Midgame-Goals.
- Tests, dass finale Action weiterhin aus `input.legalActions` kommt.

Done-Gate:

- Blink Opening enthält `find_or_install_blink`, `build_economy_base`, `draw_or_search_for_setup`, `avoid_low_value_risk_runs`.
- Blink Midgame enthält `pressure_good_central_target`, `contest_remote_if_score_threat`, `maintain_credit_and_hand_buffer`.
- TacticalPlans konsumieren Goals, erzeugen aber keine LegalActions.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- fokussierte Vitest-Datei für TacticalGoalIntegration
- relevante bestehende TacticalPlan-/Semantic-Runtime-Tests
- `git diff --check`

Commit-Vorschlag: `AI-STRAT-3: Runner TacticalGoals in TacticalPlans integrieren`

### AI-STRAT-4: Golden-Deck-Test Blink Pressure Rig + Debug

Ziel: Blink Pressure Rig wird als Golden-Deck-Testdeck genutzt, und Debug zeigt die neue Strategie-/Zielschicht redigiert.

Eingangsvoraussetzungen:

- AI-STRAT-1 bis AI-STRAT-3 sind abgeschlossen.

Konkrete Arbeit:

- Golden-Deck-Fixtures aus vorhandenen Benchmark-Snapshots nutzen.
- Tests für Matchstart-Intent, Blink suchen/ziehen, Economy bei wenig Credits, R&D unknown laufen, R&D known-low meiden, Remote Score Threat mit fehlendem Blink, known bad Remote meiden, Broker build/cashout.
- Debug um redigierte Felder ergänzen: `strategicIntent`, `tacticalGoals`, `runTargetEvaluation`, `economyPosture`, `selectedPlan`, `selectedAction`, `why_not_other_plan`.
- Kurzen Final-/Implementation-Review schreiben.

Kernartefakte:

- Golden-Deck-Testdatei oder Ergänzung fokussierter AI-Tests.
- Review-Artefakt unter `docs/reviews/ai/`.

Done-Gate:

- Golden-Deck-Tests decken die geforderten Blink-Szenarien ab oder dokumentieren bewusst konservative Fixture-Grenzen.
- Debug enthält keine volle Deckliste, Deckreihenfolge, gegnerische Hidden-Info oder private Snapshot-ID.
- Bestehende Runner-/Semantic-Runtime-Regressionen bleiben grün.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run <fokussierte AI-STRAT-Tests> src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`
- `git diff --check`

Commit-Vorschlag: `AI-STRAT-4: Blink Golden-Deck-Tests und Debug ergänzen`

## Verifikationsregeln

Je Paket:

- `corepack pnpm --filter @netgrid/ai typecheck`
- fokussierte Vitest-Dateien des Pakets
- `git diff --check`

Final:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runner-strategic-intent.test.ts src/runner-run-target-evaluation.test.ts src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`
- `git diff --check`
- `git status --short`

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_STRAT_RUNNER_INTENT_GOALS`
- Branch: `codex/ai-strat-runner-intent-goals`
- Integrationsbranch: `main`
- Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge genutzt.
- Push, Pull Request oder Remote-Integration erfolgen nicht ohne ausdrücklichen Nutzerwunsch.
- Nur paketzugehörige Änderungen werden gestaged.
- Nach jedem abgeschlossenen Paket wird committed.
- Nach dem letzten Paket wird der Arbeitsbranch lokal nach `main` gemerged und der Worktree entfernt.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI-STRAT-1 bis AI-STRAT-4 Runner Intent, Run Targets und Golden Deck vollständig und sequenziell von AI-STRAT-1 bis AI-STRAT-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_STRAT_RUNNER_INTENT_GOALS auf Branch codex/ai-strat-runner-intent-goals.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt und Review-Artefakt liegen vor.
- Vier Paketcommits für AI-STRAT-1 bis AI-STRAT-4 liegen auf `codex/ai-strat-runner-intent-goals`; ein zusätzlicher Prozessartefakt-/Preflight-Commit ist zulässig.
- Finale AI-Checks und `git diff --check` sind grün oder eng begründet.
- Review-Artefakt benennt Scope, Sicherheitsgrenzen, Checks und Restpunkte.
- Branch ist lokal nach `main` gemerged.
- Hauptworkspace ist nach Merge geprüft.
- Worktree ist entfernt.
