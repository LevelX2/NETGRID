# Deck Strategy Runtime Hardening Process 2026-06-25

Status: `DSR-H07_done`

Quelle/Vorgabe: `C:\Users\Lui\Downloads\NETGRID_Codex_Goal_Deckstrategie_Runtime_Hardening_Debug.md`

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Gesamtziel, Paketfolge `DSR-H00` bis `DSR-H09`, Sicherheitsgrenzen, relevante Startartefakte, Abnahmekriterien, Worktree-Regeln und Pflichtchecks sind definiert. Kleine Lücken werden konservativ geschlossen: Dateischnitte folgen vorhandenen `packages/ai/src/**`-Modulgrenzen, `packages/ai/src/index.ts` bleibt Fassade, und produktive Wirkung bleibt AI-intern, side-safe und ausschließlich über vorhandene `LegalActions`.

## Gesamtziel

Die bereits integrierte Deck Strategy Runtime wird gehärtet, ohne eine zweite Strategiearchitektur aufzubauen. Nach Abschluss ist die Kette von Deckstrategie über Rollenstatus, `StrategicIntentState`, TacticalGoals, TacticalPlans, `semantic_strategic_action_fit` und DecisionDebug fachlich konsistent, redaction-safe und auf `main` lokal verifiziert.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Arbeitsbranch: `codex/deck-strategy-runtime-hardening`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_deck_strategy_runtime_hardening`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für Preflight und finalen lokalen Merge genutzt.
- Mindestchecks je Paket sind fokussierte Tests nach Paketrisiko, `corepack pnpm --filter @netgrid/ai typecheck`, relevante Gesamttests und `git diff --check -- packages/ai docs KI-Wissen-NETGRID`.
- Vollständiger `@netgrid/ai test` ist Paket- oder Abschlussgate, wenn das Paket produktive Runtime-, Plan-, State- oder Debuglogik berührt.

## Nicht-Ziele

- Keine neue Engine-Regelautorität.
- Keine Erzeugung neuer Actions außerhalb bestehender `LegalActions`.
- Keine neue Hidden-Info-Projektion.
- Keine sachfremden Web-, Engine-, Server- oder UI-Änderungen.
- Keine Canary-, Enterprise- oder Rollout-Kaskade.
- Keine Wiedereinführung produktiver Doctrine-v1-PlanWeights in die Semantic Runtime.
- Keine pauschale Entfernung von Opening-Hand-, Mulligan-, Discard- oder expliziten Legacy-Fallbacks.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt oder ein Blocker dokumentiert ist.
- Report-only, produktiv, Legacy, Shadow und display-only bleiben unterscheidbar.
- TacticalPlans bleiben Mapping- und Ausführungsschicht über vorhandene Actions.
- HardGates, Kosten, Timing, Target, Reachability, Survival, terminale Chancen und Hidden-Info-Schutz überstimmen Strategie.
- Neue oder wesentlich geänderte Fachdateien erhalten knappe Kommentare zu Ebene, Inputs, Vertrag und Grenzen.

## Automatische Fehlerbehandlung

- Rote Tests werden eng auf das aktive Paket zurückgeführt.
- Unklare Altdaten oder nicht benötigte Legacy-Pfade werden erst nach Consumer-Audit entfernt.
- Bei Konflikten mit `main` werden beide Intentionen gelesen und, wenn fachlich kompatibel, erhalten.
- Sicherheitsblocker stoppen den Prozess ohne Rückfrage und erhalten einen Blocker-Report mit Removal Condition.

## Sicherheitsblocker

- Produktive Auswahl nutzt nicht mehr ausschließlich Engine-`LegalActions`.
- Neue verdeckte gegnerische Karteninformation wird in AIInput, Debug, Trace, Replay, Log oder Public Payload sichtbar oder entscheidungswirksam.
- Determinismus, Replayfähigkeit oder StateHash-Vertrag werden durch AI-Memory verletzt.
- HardGates, Kosten-, Timing-, Target- oder Reachability-Prüfungen werden vor strategischer Wirkung abgeschwächt.
- Opening-Hand-, Mulligan-, Discard- oder expliziter Legacy-Fallback gehen beim Bereinigen verloren.

## State Machine

```text
preflight
-> H00 post-integration-audit
-> H01 runtime-vs-diagnostic-contract
-> H02 anchor-capability-boundary
-> H03 role-target-reserve-runtime-context
-> H04 state-machine-hysteresis-memory
-> H05 action-fit-and-plan-override
-> H06 decision-debug-truth
-> H07 productive-e2e-regressions
-> H08 cleanup-docs-legacy
-> H09 final-validation-integration
-> merged-to-main
-> complete
```

## Paketfolge

1. `DSR-H00` Post-Integration-Audit und reproduzierbare Baseline. Status: `done`.
2. `DSR-H01` Produktiven Strategie-Vertrag und report-only Diagnostic strikt trennen. Status: `done`.
3. `DSR-H02` Anchor-Disziplin und Capability-Grenze härten. Status: `done`.
4. `DSR-H03` Rollenstatus, Zielvektor und Reserve aus echtem Runtime-Kontext ableiten. Status: `done`.
5. `DSR-H04` StrategicIntent-State-Machine, Hysterese und Memory vervollständigen. Status: `done`.
6. `DSR-H05` Strategischen Action-Fit und Plan-Override semantisch präzisieren. Status: `done`.
7. `DSR-H06` KI-Debugbewertung um Strategie, State und Auswahlbegründung ergänzen. Status: `done`.
8. `DSR-H07` Echte produktive End-to-End- und Regressionsnachweise ergänzen. Status: `done`.
9. `DSR-H08` Doppelzuständigkeiten, tote Pfade, Legacy und Dokumentationsstatus bereinigen. Status: `active`.
10. `DSR-H09` Gesamtvalidierung, Source-Review und Integration. Status: `pending`.

## Paketdetails

### DSR-H00 Post-Integration-Audit und reproduzierbare Baseline

Ziel: Den aktuellen `main`-Stand, Consumer, Klassifikationen, offene Hardening-Punkte und Baseline-Checks erfassen.

Kernartefakte: dieses Prozessdokument, optional ein kompakter Audit-Abschnitt oder Review unter `docs/reviews/ai/`.

Checks: `@netgrid/ai` Baseline-Typecheck, vollständiger AI-Testlauf, `git diff --check -- packages/ai docs KI-Wissen-NETGRID`.

Ergebnis: Abgeschlossen in `docs/reviews/ai/deck-strategy-runtime-hardening-audit-2026-06-25.md`. Baseline nach `corepack pnpm install --frozen-lockfile`: `@netgrid/ai` Typecheck grün, vollständiger AI-Testlauf grün mit 146 Testdateien und 1628 Tests, Diff-Check grün.

Commit: `docs(ai): audit deck strategy hardening baseline`

### DSR-H01 Produktiven Strategie-Vertrag und report-only Diagnostic strikt trennen

Ziel: Keine report-only/no-effect Struktur darf Runtime-Auswahl beeinflussen; produktive Goals müssen auf eine produktiv deklarierte Quelle zurückführbar sein.

Kernartefakte: Strategy-/Diagnostic-Vertrag, Goal-Synthese-Tests, Debug-/Trace-Kommentare.

Ergebnis: Produktiver Input enthält nun `ownDeckStrategyProfile` als explizite `ai_internal_strategy_profile`-Quelle. `DeckDoctrineV2Diagnostic` bleibt report-only im Input, wird aber nicht mehr in produktive Runtime-Frames, neutrale Goal-Synthese, TacticalGoal-Merge oder StrategicIntent-Memory eingespeist. Report-only Doctrine-Ziele werden im produktiven Merge defensiv verworfen, auch wenn ein Aufrufer sie explizit übergibt.

Checks: `@netgrid/ai` Typecheck grün; fokussierte Tests `neutral-goal-synthesis`, `tactical-goal-merge`, `semantic-shadow-decision`, `semantic-ai-runtime-cutover`, `strategic-intent-memory`, `index` grün mit 621 Tests; vollständiger `@netgrid/ai`-Testlauf grün mit 146 Testdateien und 1629 Tests; Diff-Check grün.

Commit: `feat(ai): separate strategy runtime and diagnostics`

### DSR-H02 Anchor-Disziplin und Capability-Grenze härten

Ziel: Capabilities bleiben Werkzeuge und Pflichten, erfinden aber ohne echte Anker keine Strategie.

Kernartefakte: DeckStrategyProfile, Runner-/Corp-Intent, ankerlose und Golden-Deck-Tests.

Ergebnis: Runner- und Corp-StrategicIntent-Projektionen erzeugen ohne produktiven Strategy-Anker keine Setup-, Pressure-, Score-, Defense-, Economy- oder Punish-Pläne mehr. Capabilities bleiben als Evidence sichtbar, dürfen aber ankerlose oder support-only Profile nicht in produktive Strategie verwandeln. Runner- und Corp-Tests sichern capability-only Fälle explizit ab.

Checks: `@netgrid/ai` Typecheck grün; fokussierte Tests `runner-strategic-intent`, `corp-strategic-intent`, `strategic-intent-state`, `deck-doctrine-strategy`, `strategic-vertical-slices`, `runner-golden-deck-debug` grün; vollständiger `@netgrid/ai`-Testlauf grün mit 146 Testdateien und 1631 Tests; Diff-Check grün.

Commit: `feat(ai): harden strategy anchors and capability boundary`

### DSR-H03 Rollenstatus, Zielvektor und Reserve aus echtem Runtime-Kontext ableiten

Ziel: Der Default-Input-Pfad baut Rollenstatus, konkrete Targets und Reservebedarf aus Deck, PlayerView, Capabilities und LegalActions.

Kernartefakte: `strategic-intent-state`, `runtime/ai-decision-input`, Runner-/Corp-Intent-Tests.

Ergebnis: `buildAiDecisionInput` baut vor `buildStrategicIntentState` einen side-safe `StrategicRuntimeContext` aus `PlayerView`, `LegalActions`, produktivem StrategyProfile und Deck-Capabilities. Der Kontext liefert Rollenstatus, Zielvektor und Reservebedarf mit `runtime_context`-Evidence. Tests decken Runner-Zentraldruck und Corp-Scoreline ab; der Default-Input-Test prüft, dass Target/Reserve aus dem Kontext stammen.

Checks: `@netgrid/ai` Typecheck grün; fokussierte Tests `runtime/strategic-runtime-context`, `index`, `strategic-intent-state`, `semantic-ai-runtime-cutover`, `strategic-vertical-slices` grün mit 609 Tests; vollständiger `@netgrid/ai`-Testlauf grün mit 147 Testdateien und 1633 Tests; Diff-Check grün.

Commit: `feat(ai): derive strategic role and target context`

### DSR-H04 StrategicIntent-State-Machine, Hysterese und Memory vervollständigen

Ziel: Alle Phasen und Transitionen sind erreichbar, Memory ist isoliert und preview-safe, Switch-Margin und Mindestbindung wirken real.

Kernartefakte: `strategic-intent-state`, `strategic-intent-memory`, Multi-Decision-Tests.

Ergebnis: `buildStrategicIntentState` hält vorherige Strategien während Mindestbindung oder bei zu kleiner Score-Marge, wechselt erst bei erfüllter Bindung und ausreichendem Vorsprung und markiert neutrale Rückfälle als `abandoned`. Memory lässt `abandoned`-States sofort auslaufen; Preview-Verhalten und Isolation bleiben unverändert abgesichert.

Checks: `@netgrid/ai` Typecheck grün; fokussierte Tests `strategic-intent-state`, `strategic-intent-memory`, `semantic-ai-runtime-cutover`, `runtime/strategic-runtime-context` grün mit 78 Tests; vollständiger `@netgrid/ai`-Testlauf grün mit 147 Testdateien und 1637 Tests; Diff-Check grün.

Commit: `feat(ai): complete strategic intent state machine`

### DSR-H05 Strategischen Action-Fit und Plan-Override semantisch präzisieren

Ziel: Strategischer Fit nutzt präzise Semantik, Phase und Target; Planfortsetzung und Mapping-Schutz bleiben begrenzt und dynamisch.

Kernartefakte: `runtime/strategic-action-fit.ts`, `runtime/semantic-choice-ranking.ts`, TacticalPlan-Fortsetzung.

Ergebnis: StrategicActionFit unterscheidet exakten Target-Fit, generischen Kind-Fit und Nicht-Fit. Zielspezifische Runner-Runs erhalten nur noch Fit auf das konkrete Ziel; Fund-/Recover-Phasen blockieren strategischen Druckaufbau, lassen aber legale Abschluss- und echte Tag-Punish-Fenster zu. Plan-Override-Schwellen sind nach exaktem vs. generischem strategischem Fit dynamisch.

Checks: `@netgrid/ai` Typecheck grün; fokussierte Tests `strategic-action-fit`, `semantic-choice-ranking`, `semantic-ai-runtime-cutover`, `strategic-vertical-slices`, `tactical-plans` grün mit 125 Tests; vollständiger `@netgrid/ai`-Testlauf grün mit 148 Testdateien und 1640 Tests; Diff-Check grün.

Commit: `feat(ai): refine strategic action fit`

### DSR-H06 KI-Debugbewertung um Strategie, State und Auswahlbegründung ergänzen

Ziel: DecisionDebug trennt echte Runtime-Scores, display-only Erklärung, Strategy/Intent, Goals, Plan, Fit und Override redaction-safe.

Kernartefakte: `diagnostics/semantic-runtime-debug.ts`, `diagnostics/semantic-runtime-decision-debug.ts`, Debug-Tests.

Ergebnis: DecisionDebug enthält nun separate redaction-safe Sektionen für strategischen Runtime-State/Fit und den Score-Vertrag. Runtime-Rohscore, Debug-Anzeigescore, Plan-Mapping-Boost und display-only Status werden ausdrücklich getrennt; `finalSelectionScore` bleibt nur als Anzeige-/Erklärwert markiert.

Checks: `@netgrid/ai` Typecheck grün; fokussierte Tests `decision-debug`, `semantic-runtime-debug`, `semantic-ai-runtime-cutover`, `strategic-vertical-slices` grün mit 82 Tests; vollständiger `@netgrid/ai`-Testlauf grün mit 148 Testdateien und 1641 Tests; Diff-Check grün.

Commit: `feat(ai): explain strategic runtime decisions`

### DSR-H07 Echte produktive End-to-End- und Regressionsnachweise ergänzen

Ziel: Produktive Akzeptanzfälle laufen über realitätsnahe `GameState`-/`buildAiDecisionInput`-Pfade ohne manuelle StrategyProfile- oder TargetVector-Injektion.

Kernartefakte: `strategic-vertical-slices.test.ts` oder fokussierte E2E-Slice-Tests.

Ergebnis: `packages/ai/src/index.test.ts` enthält nun einen produktiven Regressionstest für Corp und Runner, der jeweils von einem echten Engine-`GameState` über `buildAiDecisionInput` mit Decksnapshot bis zu `chooseCorpAction`/`chooseRunnerAction` läuft. Der Test injiziert keine StrategyProfiles, TargetVectors oder ReserveRequirements manuell. Er sichert produktive `AiDeckStrategyProfile`-Quelle, report-only Doctrine-Diagnostic, `StrategicIntentState` aus `runtime_context`, legale Action-Auswahl, Semantic-Runtime-Debugsektionen `strategic_runtime`/`selection_score`, Preview-Memory und Hidden-Info-Redaction ab.

Checks: `@netgrid/ai` Typecheck grün; fokussierter Test `index` grün mit 534 Tests.

Commit: `test(ai): add productive deck strategy regressions`

### DSR-H08 Doppelzuständigkeiten, tote Pfade, Legacy und Dokumentationsstatus bereinigen

Ziel: Überholte Adapter, tote State-/Debug-/Goal-Pfade und irreführende Statusfelder entfernen; verbleibendes Legacy begründet abgrenzen.

Kernartefakte: Source cleanup, Prozess-/Final-/Hardening-Review, Wissensbasis, Betriebslog.

Commit: `docs(ai): finalize deck strategy hardening`

### DSR-H09 Gesamtvalidierung, Source-Review und Integration

Ziel: Vollständige Verifikation, Source-Review, `main`-Integration, erneute `main`-Prüfung und Worktree-Entfernung.

Checks: `corepack pnpm --filter @netgrid/ai typecheck`, `corepack pnpm --filter @netgrid/ai test`, `git diff --check -- packages/ai docs KI-Wissen-NETGRID`; zusätzliche Package-Checks nur bei tatsächlich geändertem Scope.

Commit: `chore(ai): validate deck strategy hardening`

## Verifikationsregeln

- Fokussierte Tests laufen vor breiteren Gates.
- Paketabschluss braucht mindestens Typecheck, relevante Tests und Diff-Check oder einen dokumentierten Blocker.
- Bei produktiver Runtime-, Plan-, State- oder Debugänderung läuft vor Paketcommit der vollständige `@netgrid/ai`-Testlauf, sofern kein konkreter Blocker dokumentiert ist.
- Auf `main` werden nach finalem Merge mindestens AI-Typecheck, vollständiger AI-Testlauf und Diff-Check wiederholt.

## Worktree-, Git- und Integrationsregeln

- Nur im Worktree `C:\Projekte\NETGRID_deck_strategy_runtime_hardening` arbeiten.
- Pro Paket ein kohärenter Commit oder ein nachvollziehbarer kleinerer Commit-Schnitt.
- Nur paketzugehörige Änderungen stagen.
- Kein Push und kein Pull Request ohne Nutzerwunsch.
- Vor finalem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Finaler Merge bevorzugt Fast-Forward nach `main`.
- Nach erfolgreichem Merge `git status --short` und `git diff --check -- packages/ai docs KI-Wissen-NETGRID` auf `main`.

## Abschlusskriterien

- Alle Pakete `DSR-H00` bis `DSR-H09` sind abgeschlossen und committed.
- Die Definition of Done aus der Vorgabe ist erfüllt.
- AI-Typecheck, vollständiger AI-Testlauf und Diff-Check sind grün.
- Dokumentation und Wissensbasis beschreiben den integrierten Hardening-Stand.
- Arbeitsbranch ist lokal nach `main` gemerged.
- Temporärer Worktree ist entfernt.
