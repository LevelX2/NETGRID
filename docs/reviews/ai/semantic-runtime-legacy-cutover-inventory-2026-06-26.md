# Semantic Runtime Legacy Cutover Inventory 2026-06-26

## Produktiver neuer Runtime-Pfad

- `packages/ai/src/index.ts` routet `chooseAiAction`, `chooseCorpAction` und `chooseRunnerAction` in die Semantic Runtime.
- `packages/ai/src/runtime/semantic-runtime.ts` baut `ActionSemanticCandidate`s, Semantic Choices, TacticalGoals, TacticalPlans, StrategicIntentState-Fit, SelectedChoices und DecisionDebug.
- `packages/ai/src/runtime/ai-decision-input.ts` reichert Inputs bei vorhandenem `ownDeckSnapshot` mit `DeckCapabilityProfile`, `AiDeckStrategyProfile`, report-only `DeckDoctrineV2Diagnostic`, `StrategicIntentState` sowie Runner-/Corp-StrategicIntent an.
- `packages/ai/src/action-semantic-candidate.ts` projiziert LegalActions read-only in Basic-, Source-/Ability-, Target-, Cost-/Timing-, Tag- und Card-Semantik. Die Projektion erzeugt keine LegalActions.

## Produktive Legacy-/Fallback-Pfade vor diesem Schnitt

- `packages/ai/src/runtime/semantic-runtime.ts` wertete den Legacy-Provider auch bei erfolgreicher Semantic-Entscheidung für Debugreferenzen aus und nutzte ihn als No-Candidate-Fallback.
- `packages/ai/src/runtime/semantic-runtime-decision-context.ts` rief den Legacy-Provider zusätzlich für `PracticalMicroRuntime` immer auf, auch wenn der Micro-Modus `off` war.
- `packages/ai/src/index.ts` baut in `chooseCorpAction` und `chooseRunnerAction` weiterhin die alten Baseline-/Plan-Entscheider als Provider. Das bleibt nur für explizites `NETGRID_SEMANTIC_AI_RUNTIME=legacy`, Legacy-Benchmarks oder opt-in Comparatoren zulässig.
- `packages/ai/src/deck-doctrine.ts` enthält Doctrine-v1-Archetype-Tags, PlanWeights und Opening-Hand-Logik.
- `packages/ai/src/runtime/discard-*` nutzte Doctrine-v1-PlanWeights und Archetype-Tags für produktive Discard-SelectedChoices.
- `packages/ai/src/runtime/practical-micro-runtime.ts` und `packages/ai/src/runtime/practical-tactic-overlay.ts` sind Nachentscheidungs-Comparator/Overlay. Default ist zwar aus, aber die Context-Schicht zog Legacy für Micro trotzdem an.

## Debug-/Shadow-/Fixture-Pfade

- `packages/ai/src/legacy/*` bleibt als explizite Legacy-/Fixture-/Benchmark-Quelle verwendbar.
- Doctrine-v1-Qualitätsberichte und Simulation-Metriken unter `packages/ai/src/simulation/*doctrine*` sind Diagnose-/Benchmarkmaterial.
- `DeckDoctrineV2Diagnostic` ist report-only/no-effect und darf nicht als produktiver Scorer genutzt werden.
- `PracticalTacticBenchmark` und Practical-Overlay-Tests sind Vergleichsmaterial; produktive Korrektheit muss aus Semantic Runtime, Gates, Goals und Scores kommen.

## Entfernungskandidaten und Migrationsreihenfolge

1. Deckkontext auch bei fehlendem Snapshot explizit neutral/unknown modellieren; normale Simulationen mit Decksnapshots aufrufen.
2. Produktive `ActionSemanticCandidate`s mit CardSemanticProfiles, sourceDefinitionId, AbilityBinding, TargetContext, Cost und Timing füttern.
3. BasicAction-Semantik und StrategicIntent-Fit so erweitern, dass score/steal/run/tag/damage/punish/closeout ohne Legacy erklärbar sind.
4. Opening/Mulligan und Discard auf StrategyProfile, DeckCapabilities, Rollenstatus und sichtbare Hand umstellen.
5. Normalen Semantic Runtime Pfad von Legacy-Debugreferenzen, No-Candidate-Legacy-Fallback und default Micro-Legacy-Aufruf trennen.
6. Practical-Regeln in normale Scoring-/Goal-/Fallback-Logik absorbieren oder opt-in Benchmark-only lassen.
7. Doctrine-v1-Produktivimporte auf Legacy-/Fixture-/Benchmark-Rolle begrenzen.

## Umgesetzter Stand in diesem Schnitt

- `buildAiDecisionInput` baut ohne Snapshot keinen stillen strategielosen Input mehr, sondern ein explizites neutrales `AiDeckStrategyProfile`, `DeckCapabilityProfile`, `DeckDoctrineV2Diagnostic` und `StrategicIntentState`. Der alte pre-strategy DTO-Pfad ist nur noch ueber `missingDeckContextMode: "legacy_compatible"` explizit erreichbar.
- Simulationen geben Decksnapshots nun auch fuer den normalen Semantic-Modus `belief_ai_v1_4_2` weiter.
- `ActionSemanticCandidate`s werden im produktiven Runtime-Aufruf mit side-safe CardSemanticProfiles aus AI-Hints gespeist; Source-/Ability-Bindings koennen eindeutige sichtbare Ability-Definitionen inferieren, TargetContext nutzt Engine-TargetRequirements und BasicActions tragen eigene Taktiksignale.
- Der normale Semantic-Runtime-Pfad ruft Legacy nicht mehr fuer Debugreferenzen auf. No-Candidate nutzt einen deterministischen Semantic-Coverage-Fallback auf vorhandenen LegalActions mit sichtbarer Evidence.
- `PracticalMicroRuntime` zieht Legacy nur noch bei explizitem Micro-Modus ungleich `off`; `PracticalTacticOverlay` bleibt opt-in.
- Corp-Punish-Fit und StrategicRuntimeContext nutzen keine generische Operation-/Trigger-Heuristik mehr, sondern side-safe SourceDefinition plus Tag-/Trace-/Damage-/Payoff-Ontology.
- `closeout` wird im `StrategicIntentState` nur bei konkreter Runtime-Evidence wie legalem Score- oder legalem Damage-Payoff-Fenster gesetzt.
- Opening/Mulligan und Discard lesen produktiv keine Doctrine-v1-PlanWeights/ArchetypeTags mehr; sie nutzen StrategyProfile, StrategicIntentState, DeckCapabilities, sichtbare Handrollen und neutrale Basisprioritaeten.
- Normaler DecisionDebug enthaelt keine `legacy_reference_*`-Felder mehr; Coverage-Fallbacks und Candidate-Semantik bleiben sichtbar.

## Nachtrag 2026-07-05: Legacy-Fallback-Removal

- Server-Preview und `advance_ai` verwenden keine sortierte erste LegalAction mehr als Ersatz, wenn `AiDecision.actionId` fehlt oder nicht in den aktuellen Engine-`LegalActions` enthalten ist. Beide Pfade stoppen sichtbar mit `ai_decision_action_not_legal`.
- `packages/ai/src/runtime/semantic-runtime.ts` hat keinen Legacy-Provider-Parameter und keinen direkten `semanticRuntimeForcedLegacy`-Notaus mehr.
- Default-`chooseCorpAction` und Default-`chooseRunnerAction` übergeben keinen Legacy-Provider mehr an den Semantic-Context. Practical Micro erhält eine Legacy-Referenz nur noch bei explizitem Opt-in; der explizite Notaus `NETGRID_SEMANTIC_AI_RUNTIME=legacy` bleibt an der Public-/Compatibility-Fassade.
- Boundary-Tests begrenzen Runtime-Imports aus `legacy/**` auf die aktuell expliziten Compatibility-Fassaden: `runtime/ai-action-entrypoints.ts`, `runtime/ai-action-entrypoints-composition.ts`, `runtime/runner-baseline-support-composition.ts` und `runtime/semantic-runtime-action-exclusion-composition.ts`.
- Führende Artefakte: `docs/architecture/ai/legacy-fallback-removal-process-2026-07-05.md` und `docs/reviews/ai/semantic-runtime-legacy-fallback-removal-2026-07-05.md`.

## Verbleibende Grenzen

- `packages/ai/src/legacy/*`, Doctrine-v1-Profilerstellung und doctrinebezogene Benchmark-/Shadow-Metriken bleiben als explizite Legacy-/Fixture-/Vergleichspfade im Repo.
- Practical Micro und Practical Tactic sind weiterhin als opt-in Vergleichs-/Overlay-Module vorhanden; Standardentscheidungen und Tests benoetigen sie nicht.
- Die CardSemanticProfile-Bruecke ist side-safe, aber Ability-spezifische Semantik ist nur so granular wie die vorhandenen Carddefinitionen und AI-Hints. Unklare Faelle bleiben ueber `ability_unresolved`/Coverage-Evidence sichtbar.

## Risiken und Testbedarf

- Safety: KI darf weiterhin nur Engine-`LegalActions` auswählen; Fallbacks müssen deterministisch und LegalActions-only bleiben.
- Hidden Info: Card-/Target-/Debug-Projektion darf nur `PlayerView`, `LegalActions`, AI-Hints und side-sichere öffentliche Metadaten verwenden.
- Regression: Setup-Mulligan, Discard, Corp-Punish, score/steal Closeout, BasicActions und Simulation-Smokes brauchen fokussierte Tests.
- Diagnose: Fallbacks und unresolved Candidate-Gaps müssen sichtbar sein, sonst werden Abdeckungslücken wieder verdeckt.
