# Semantic Runtime Precision Follow-up, 2026-06-27

Status: `P0_inventory_done`

Prozess: `docs/architecture/ai/semantic-runtime-precision-legacy-cleanup-process-2026-06-27.md`

Vorgabe: `docs/source/NETGRID_Codex_Folgepaket_Semantic_Runtime_Precision_Legacy_Cleanup_2026-06-27.md`

Geprüfter Code-Start: `19b7fe11947dd19588de25b1df7eafcd3cf998d8`

Preflight-Prozesscommit: `9220d3cd`

## Kurzbefund

Der Semantic-Runtime-Legacy-Cutover ist im aktuellen Stand fachlich bereits umgesetzt. Der normale Runtime-Pfad ruft Legacy nicht mehr für Debugreferenzen oder No-Candidate-Fallbacks auf, fehlender Deckkontext wird neutral modelliert, Opening/Mulligan und Discard lesen produktiv keine Doctrine-v1-PlanWeights mehr, und `PracticalMicroRuntime` zieht Legacy nur noch bei explizitem Micro-Modus.

Das Folgepaket ist deshalb kein weiterer Cutover. Offen sind Präzisions- und Cleanup-Punkte, die spätere Replay-Kalibrierung verfälschen können: Strategieportfolio statt erster Primary, Ability-spezifische Semantik, qualifizierte StrategySupport-Evidence, stärkere Signal-Invarianten, konkreterer TargetContext, klare Legacy-/Benchmark-Grenzen und bessere Debug-Erklärung.

## Bereits erledigt

| Bereich | Befund |
| --- | --- |
| Normalpfad | `packages/ai/src/runtime/semantic-runtime-decision-context.ts` ruft Legacy nur noch für `PracticalMicroRuntime` bei Micro-Modus ungleich `off`; der Semantic-Runtime-Pfad bleibt normaler Entscheidungspfad. |
| No-Candidate-Fallback | Laut `docs/reviews/ai/semantic-runtime-legacy-cutover-inventory-2026-06-26.md` nutzt der Normalpfad einen deterministischen Semantic-Coverage-Fallback auf vorhandenen LegalActions statt Legacy. |
| Missing Deck Context | Laut Cutover-Inventar erzeugt `buildAiDecisionInput` ohne Snapshot explizite Neutral-/Unknown-Profile. |
| Doctrine v1 | `packages/ai/src/deck-doctrine.ts` ist als Legacy Doctrine v1 kommentiert und nutzt PlanWeights aus `packages/ai/src/legacy/deck-doctrine-legacy-weights.ts`. |
| Opening/Mulligan/Discard | Laut Cutover-Inventar lesen diese Pfade produktiv keine Doctrine-v1-PlanWeights/ArchetypeTags mehr. |
| Practical Micro | `packages/ai/src/runtime/practical-micro-runtime.ts` gibt im Modus `off` unverändert die Runtime-Entscheidung zurück und reportet selbst im `apply`-Modus `actual_override:false`. |
| Practical Tactic Overlay | `packages/ai/src/runtime/practical-tactic-overlay.ts` ist opt-in und reportet `practical_tactic_overlay_actual_override:false`; es überschreibt aktuell keine Action. |
| TacticalPlans-Struktur | `packages/ai/src/tactical-plans.ts` ist bereits eine 306-Zeilen-Fassade über zahlreiche `packages/ai/src/plans/*`-Module; Runner-/Corp-Planbuilder, Memory, Mapping-Helfer, Action Values und Redaction sind teilweise ausgelagert. |
| Signal-Invariant-Basis | `packages/ai/src/actions/action-semantic-invariants.ts` existiert als diagnostic-only Check für strukturelle Signale, unvollständige StrategySupportPairs, Support-only StrategySupport und Hidden-Info in TargetProfiles. |
| Debug-Basis | `packages/ai/src/diagnostics/semantic-runtime-debug.ts` zeigt DeckStrategy-Primaries/Secondaries, StrategicIntentState, TacticalPlan-Ränge, TargetChoice-Shadow und Coverage-Details. |

## Tatsächlich offene Punkte

### P1 Strategy-Portfolio

Offen. `packages/ai/src/runtime/strategic-runtime-context.ts` wählt mit `productivePrimaryStrategyId()` weiterhin die erste produktive `primaryStrategies`-ID. `packages/ai/src/strategic-intent-state.ts` wählt in `selectPrimaryStrategy()` ebenfalls `profile.primaryStrategies[0]`; `selectSecondaryStrategies()` liest nur `profile.secondaryStrategies`, nicht die übrigen produktiven Primary-Kandidaten. Hysterese existiert, aber sie arbeitet nur zwischen der neuen ersten Primary und der vorherigen Primary.

Betroffene Dateien:

- `packages/ai/src/runtime/strategic-runtime-context.ts`
- `packages/ai/src/strategic-intent-state.ts`
- `packages/ai/src/runtime/strategic-runtime-context.test.ts`
- `packages/ai/src/strategic-intent-state.test.ts`
- `packages/ai/src/diagnostics/semantic-runtime-debug.ts`

### P2 Card-/Ability-Semantik

Offen. `packages/ai/src/actions/action-card-semantic-profiles.ts` legt breite Hint-Felder als `tacticSignals` auf Profilebene ab: `role:*`, `plan_role:*`, `line_support:*`, `strategic_role:*`. `applyCardSemanticJoin()` hängt diese Profilebene bei jeder kartenbasierten Action an `cardContextSignals` und übernimmt `profile.strategySupport` immer. Ability-Binding ergänzt zwar ability-spezifische `actionTacticSignals`, verhindert aber noch nicht, dass breite card-level Signale und StrategySupport bei gebundener Ability mitlaufen.

Betroffene Dateien:

- `packages/ai/src/actions/action-card-semantic-profiles.ts`
- `packages/ai/src/actions/action-card-semantic-join.ts`
- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/action-semantic-candidate.test.ts`

### P3 StrategySupport-Ableitung

Offen. `strategySupportFromHint()` erzeugt `StrategySupportPair`s pauschal aus `lineSupport` und `strategicRole` mit `confidence: "medium"` und generischer Evidence. Das ist genau der Support-only-Rückweg, den das Folgepaket schließen soll. `deck-doctrine-strategy.ts` hat bereits strengere Anchor-/LineSupport-Logik, aber die Action-Card-Semantic-Bridge umgeht diese Qualifikation noch.

Betroffene Dateien:

- `packages/ai/src/actions/action-card-semantic-profiles.ts`
- `packages/ai/src/actions/action-semantic-invariants.ts`
- `packages/ai/src/deck-doctrine-strategy.ts`
- `packages/ai/src/deck-doctrine-strategy.test.ts`

### P4 Signal-Katalog und Invariants

Teilweise offen. Ein Invariant-Modul existiert, deckt aber noch nicht die geforderten zu breiten Oberklassensignale als alleinige Primär-Evidence ab, z. B. `damage.payoff`, `access.punish`, `economy.generic`, `setup.search`, `operation.black_ops`, `corp.operation`. Es unterscheidet auch noch nicht explizit `hard falsch`, `legacy/compatibility erlaubt` und `deferred`.

Betroffene Dateien:

- `packages/ai/src/actions/action-semantic-invariants.ts`
- `packages/ai/src/actions/action-semantic-invariants.test.ts`
- ggf. `docs/architecture/ai/*` für Signalklassen-Dokumentation

### P5 TargetContext

Teilweise offen. `packages/ai/src/actions/action-target-context.ts` projiziert side-safe selected targets, allowed servers, choice options, payload `serverId`/`cardId`/`iceId` und engine-only Blocker. Offen bleiben konkretere sichtbare Metadaten, Constraints wie `not_cybernetics`, differenzierte `available_targets_missing`/`engine_only_target_blocked`-Evidence und Zielwertprofile für Hardware-/Resource-/Program-Trash, ICE-Control, Search/Install, Advancement Counter und Server-/Remote-Auswahl.

Betroffene Dateien:

- `packages/ai/src/actions/action-target-context.ts`
- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/action-semantic-candidate.test.ts`
- `packages/ai/src/action-doctrine-goal-diagnostics.ts`

### P6 Doctrine-v1-Reste

Weitgehend erledigt, kleiner Cleanup offen. `deck-doctrine.ts` ist bereits als Legacy Doctrine v1 markiert. Nutzungen in `packages/ai/src/legacy/*`, DTOs, Benchmarks und Tests bleiben begründet. Offen ist, Kommentare und Tests so zu schärfen, dass `planWeights`/`mulliganWeights` nicht wieder als produktive Semantic-Runtime-Wahrheit gelesen werden.

Betroffene Dateien:

- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/deck-doctrine.test.ts`
- `packages/ai/src/index.test.ts` nur bei gezielter Testtitel-/Evidence-Schärfung

### P7 Practical Overlay/Micro

Weitgehend erledigt, Dokumentationshärtung offen. Beide Module sind default-off beziehungsweise comparator-only und überschreiben keine Entscheidung. Offen ist die klare Dateikommentar-Grenze `benchmark/comparator only` und ein kleiner Guard, dass default-off keine Legacy-Auswertung oder Action-Änderung braucht.

Betroffene Dateien:

- `packages/ai/src/runtime/practical-tactic-overlay.ts`
- `packages/ai/src/runtime/practical-tactic-overlay.test.ts`
- `packages/ai/src/runtime/practical-micro-runtime.ts`
- `packages/ai/src/runtime/practical-micro-runtime.test.ts`

### P8 TacticalPlans

Teilweise erledigt. Die frühere Großdatei ist bereits auf `plans/*` verteilt. Ein kleiner weiterer Schnitt ist sinnvoll: das Mapping von PlanStep zu LegalActions kann aus `tactical-plans.ts` in ein Plan-Mapping-Modul verschoben werden, weil `tactical-plans.ts` heute noch Build, Evaluation und Mapping koordiniert.

Betroffene Dateien:

- `packages/ai/src/tactical-plans.ts`
- `packages/ai/src/plans/tactical-plan-step-candidate-matching.ts`
- ggf. neues oder erweitertes `packages/ai/src/plans/tactical-plan-legal-action-mapping.ts`
- `packages/ai/src/tactical-plans.test.ts`

### P9 Debug/Reports

Teilweise offen. Debug zeigt bereits DeckStrategy-Linien und TacticalPlans. Offen sind explizite Sections oder Items für:

- `action_semantic_projection`
- `ability_semantic_binding`
- `target_context`
- `strategy_portfolio`
- `compatibility_signals`
- `coverage_gaps`

Diese Informationen sollen vorhandene Candidate-/State-Felder verwenden und keine neuen Hidden-Info-Flächen öffnen.

Betroffene Dateien:

- `packages/ai/src/diagnostics/semantic-runtime-debug.ts`
- `packages/ai/src/runtime/semantic-runtime.ts`
- `packages/ai/src/diagnostics/semantic-runtime-debug.test.ts`

## Normalpfad, Legacy und opt-in Vergleichspfade

| Pfad | Klassifikation | Regel für diesen Prozess |
| --- | --- | --- |
| `chooseCorpAction` / `chooseRunnerAction` über Semantic Runtime | Normalpfad | Präzisieren, aber nicht erneut cutovern. |
| `ActionSemanticCandidate`-Projektion | Normalpfad-Semantikinput | Präzisieren; keine LegalAction-Erzeugung. |
| `AiDeckStrategyProfile` / `StrategicIntentState` | Normalpfad-Strategiekontext | Portfolio und Debug ergänzen. |
| `packages/ai/src/legacy/*` | Legacy-/Notaus-/Benchmark-Pfad | Nicht löschen; nicht als fachliche Normalpfad-Wahrheit reaktivieren. |
| Doctrine v1 `planWeights`/`mulliganWeights` | Legacy-/Fixture-/Benchmark-Komponente | Kommentare/Tests schärfen, keine produktive Runtime-Wirkung einführen. |
| `DeckDoctrineV2Diagnostic` | report-only/no-effect | Nicht produktiv machen. |
| `PracticalMicroRuntime` | expliziter opt-in Comparator | Default-off und `actual_override:false` absichern. |
| `PracticalTacticOverlay` | expliziter opt-in Overlay/Benchmark | Keine Normalpfad-Abhängigkeit; Kommentar-/Testgrenze schärfen. |

## Geplante Reihenfolge

1. P1: Strategy-Portfolio in `StrategicIntentState`/RuntimeContext und Debug sichtbar machen.
2. P2/P3: Card-/Ability-Semantik und StrategySupport gemeinsam härten, weil beide über dieselbe Join-Brücke wirken.
3. P4/P5: Signal-Invariants und TargetContext als Guards für die neue Semantik ergänzen.
4. P6/P7: Legacy-/Benchmark-Grenzen kommentieren und testen.
5. P8/P9: Kleinen TacticalPlans-Mapping-Schnitt und Debug-Sections ergänzen.
6. P10: Fokussierte Tests, AI-Typecheck, ggf. `@netgrid/ai test`, Abschlussdoku.

## Risiken

- Strategy-Portfolio darf bestehende Hysterese nicht destabilisieren.
- Ability-spezifische Semantik darf BasicActions und eindeutige Single-Ability-Fälle nicht verlieren.
- StrategySupport-Härtung darf klare Payoff-/Anchor-Karten nicht versehentlich neutralisieren.
- TargetContext darf keine Engine-only oder verdeckten Zielinformationen in Debug/Evidence tragen.
- Debug-Erweiterung muss redigierte, strukturierte Evidence nutzen und darf keine Action-IDs in ungeeignete öffentliche Flächen verschieben.

## P0-Verifikation

- `git diff --check`: grün vor P0-Commit.

P0 hat keine Runtime-Dateien geändert.

## P1 Ergebnis: Strategy-Portfolio

Status: `P1_done`

Umgesetzt:

- `StrategicIntentState` enthält jetzt optional ein `strategyPortfolio` mit aktiver Strategie, produktiven Kandidaten, geblockten Kandidaten, Selection-Score und Switch-/Transition-Grund.
- `buildStrategicRuntimeContext()` baut ein Runtime-Portfolio aus produktiven Primary-/Secondary-Kandidaten und bewertet sie mit finalScore/anchorScore, Role-Readiness, sichtbarer BoardOpportunity, TargetVector und Reservefähigkeit.
- Die bisherige `primaryStrategy` bleibt für bestehende Consumer erhalten. Hysterese kann eine bisherige Strategie weiter halten; das Portfolio bleibt trotzdem sichtbar.
- Geblockte oder nicht-produktive Strategien werden nicht als aktive Linie gewählt und bleiben als `blockedCandidates` sichtbar.
- `buildAiDecisionInput()` reicht Portfolio, bevorzugte Runtime-Linie, TargetVector, Rollenstatus und Reserve an `buildStrategicIntentState()` weiter.
- `semanticRuntimeDebugStrategicRuntimeItems()` berichtet aktive Strategie, Portfolio-Grund, produktive Kandidaten und geblockte Kandidaten.

Verifikation:

- `corepack pnpm --dir packages/ai exec vitest run --maxWorkers=1 --testTimeout=30000 src/runtime/strategic-runtime-context.test.ts src/strategic-intent-state.test.ts src/diagnostics/semantic-runtime-debug.test.ts`: grün, 3 Dateien, 17 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `git diff --check`: grün.
