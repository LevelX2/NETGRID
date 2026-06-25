# Deck Strategy Runtime Consumer Audit 2026-06-25

Status: `DSR-00 done`

Quelle: `docs/architecture/ai/deck-strategy-runtime-process-2026-06-25.md`

## Kurzbefund

Die aktuelle KI besitzt bereits einen produktiven Semantic-Runtime-Pfad mit `DeckCapabilityProfile`, Runner-StrategicIntent, Runner-TacticalGoals, TacticalPlans, Plan-Memory, ActionSemanticCandidates und begrenzten Plan-Overrides. Die aus `buildDeckStrategyProfile` gebaute Strategy-Taxonomie ist im Source noch als `diagnostic_only` und `plannerEffect: none` markiert, wirkt aber bei vorhandenem Decksnapshot bereits indirekt auf Runner: `runtime/ai-decision-input.ts` baut daraus `ownRunnerStrategicIntent`, und `chooseSemanticRuntimeAction` nutzt dieses Profil für Runner-Handentwicklung, Economy, RunTargetEvaluation, Runner-TacticalGoals und TacticalPlans.

Für Corp existiert kein symmetrischer produktiver StrategicIntent. Corp nutzt produktiv weiter neutrale/boardstate-getriebene Corp-TacticalGoals und alte begrenzte `ownDeckDoctrine.planWeights`-Scorekomponenten. `DeckDoctrineV2Diagnostic` und `synthesizeDoctrineTacticalGoals` sind vorhanden, erreichen den Default-Runtime-Pfad aber nicht automatisch, weil `chooseSemanticRuntimeAction` kein `doctrineDiagnostic` in den produktiven `SemanticDecisionFrame` einspeist und `synthesizeNeutralTacticalGoals` im Default-Pfad nicht als zentrale Goal-Merge-Schicht verwendet wird.

## Pfadklassifikation

| Pfad | Klassifikation | Befund |
| --- | --- | --- |
| `packages/ai/src/deck-doctrine.ts::buildDeckDoctrineProfile` | produktiv + legacy | `buildAiDecisionInput` baut `ownDeckDoctrine` aus dem eigenen Decksnapshot. Die Profile bleiben Input für Opening-Hand/Mulligan, Discard-Heuristik, Legacy-Planer, forced legacy fallback und begrenzte Semantic-Runtime-Doctrine-Gewichte. |
| `ownDeckDoctrine.planWeights` | legacy-produktiv | Wird in alten Runner-/Corp-Planern, in `index.ts`-Doctrine-Scorekomponenten und in Discard-Fit genutzt. Bereits kommentiert als Legacy-Fallback-Weights, aber noch nicht entkoppelt. |
| `packages/ai/src/deck-doctrine-strategy.ts::buildDeckStrategyProfile` | diagnostisch + indirekt Runner-runtime-wirksam | Profiltyp sagt `source.mode: diagnostic_only` und `plannerEffect: none`. Trotzdem konsumiert `buildRunnerStrategicIntentProfile` dieses Profil bei Decksnapshot-Input und erzeugt daraus Runtime-Projektion. Source-/Debug-Bezeichnung ist damit nicht mehr vollständig korrekt. |
| `DeckDoctrineV2Diagnostic` | diagnostisch / Shadow / Tests | Wird in Tests, real-engine corpus fixtures, shadow decision tests, readiness reports und `synthesizeDoctrineTacticalGoals` genutzt. Keine automatische Default-Runtime-Verkabelung gefunden. |
| `packages/ai/src/runner-strategic-intent.ts::buildRunnerStrategicIntentProfile` | produktiv Runner | Wird in `runtime/ai-decision-input.ts` bei Runner-Decksnapshot vorgebaut und sonst in `index.ts::runnerStrategicIntentForInput` aus DeckCapabilities gebaut. Steuert Runner-Handentwicklung, Economy, RunTargets, Runner-TacticalGoals und TacticalPlans. |
| Corp StrategicIntent | fehlend | Kein Corp-Gegenstück gefunden. Corp-Strategie läuft über `buildCorpTacticalGoals`, praktische Overlays, alte Doctrine-Gewichte und Boardstate-Heuristiken. |
| `packages/ai/src/runner-tactical-goals.ts::buildRunnerTacticalGoals` | produktiv Runner | Wird im Default-Semantic-Runtime-Pfad aus Runner-StrategicIntent, RunTargets, Economy und Capabilities erzeugt. |
| `packages/ai/src/decision/corp-tactical-goals.ts::buildCorpTacticalGoals` | produktiv Corp | Wird von TacticalPlans und NeutralGoal-Synthese genutzt; nicht aus einem persistenten Corp-StrategicIntent gespeist. |
| `packages/ai/src/decision/doctrine-goal-synthesis.ts` | diagnostisch / bereit, aber nicht default-produktiv | Mappt `DeckDoctrineV2Diagnostic` zu `TacticalGoalLike`, wird von NeutralGoal-Synthese und Shadow/Tests verwendet. |
| `packages/ai/src/decision/neutral-goal-synthesis.ts` | teilproduktiv / testnah | Kann Neutral- und Doctrine-Ziele zusammenführen, ist aber nicht der zentrale Goal-Merge-Pfad in `chooseSemanticRuntimeAction`. |
| `packages/ai/src/decision/semantic-decision-frame.ts` | produktiv für Pilot/Debug, diagnostikfähig | Kann `doctrineDiagnostic`, TacticalGoals, TacticalPlan, Capabilities, Economy und Runner-Auswertungen tragen. Default-Runtime-Frame wird nur im Play-Strength-Pilot gebaut und enthält derzeit keine Doctrine-Diagnostik. |
| `packages/ai/src/tactical-plans.ts` | produktiv | Mapping-Schicht über bestehende LegalActions. Nutzt RunnerStrategicIntent, RunnerTacticalGoals, Capabilities, RunTargets, Economy, AccessMemory und Corp-Boardstate-Pläne. Planbindung ist aktuell pauschal `PLAN_CONTINUITY_PRIORITY_BONUS = 120`. |
| `packages/ai/src/plans/plan-memory.ts` | produktiv | Persistiert TacticalPlan-Memory keyed nach Match/DecisionScope, Side und ProfileId. Kein separater StrategicIntentState. |
| `packages/ai/src/runtime/semantic-runtime.ts` | produktiv | Baut Kandidaten, Scores, Runner-Intent-Fluss, TacticalPlanRuntime, Mapping-Override, DecisionDebug und TacticalPlan-Memory. Keine Corp-Intent- oder DoctrineDiagnostic-Verkabelung. |
| `packages/ai/src/runtime/semantic-choice-ranking.ts` | produktiv | Liefert bestes Choice-Ranking und TacticalPlan-Override-Auswahl; arbeitet auf bereits legalen Choices. |

## Produktive Default-Kette heute

```text
ownDeckSnapshot
-> buildDeckDoctrineProfile (Doctrine v1, ownDeckDoctrine)
-> buildDeckCapabilityProfile
-> Runner: buildDeckStrategyProfile -> buildRunnerStrategicIntentProfile
-> chooseRunnerAction / chooseCorpAction
-> legacy reference decision
-> chooseSemanticRuntimeAction
-> ActionSemanticCandidates + SemanticRuntimeChoices
-> Runner-only: HandDevelopment, EconomyPosture, RunTargetEvaluation, RunnerTacticalGoals
-> evaluateTacticalPlans
-> best choice / plan-mapped choice / bounded override
-> practical micro runtime + tactic overlay
-> AiDecision + DecisionDebug + TacticalPlanMemory
```

## Diagnostische und Shadow-Kette heute

```text
buildDeckStrategyProfile
-> buildDeckDoctrineV2Diagnostic
-> synthesizeDoctrineTacticalGoals
-> SemanticDecisionFrame / SemanticShadowDecision / fixture and coverage tests
```

Diese Kette besitzt Tests und Diagnoseberichte, aber keinen gefundenen automatischen Default-Runtime-Consumer.

## Legacy-Kandidaten für spätere Pakete

- `CORP_DOCTRINE_PLAN_WEIGHTS`, `RUNNER_DOCTRINE_PLAN_WEIGHTS` und `planWeightsFor`.
- `semanticRuntimeDoctrinePlanWeightComponent`, `semanticRuntimeDoctrineRawWeight`, `semanticRuntimeDoctrineClamp` und die zugehörigen Corp-/Runner-Gates in `packages/ai/src/index.ts`.
- `discardCurrentPlanKind`, `discardStrongestDoctrinePlan`, `discardPlanFitBonus` und `discardDoctrineFitBonus`, soweit sie nach neuem Intent/Plan-State ersetzt werden können.
- Doctrine-Gewichte in `packages/ai/src/legacy/runner-plans.ts` und `packages/ai/src/legacy/corp-plans.ts`.
- Debug-/UI-Felder um `doctrinePlanWeight`, sofern nach Legacy-Abbau keine produktive Bedeutung bleibt.
- Irreführende Statusmarker `diagnostic_only` / `plannerEffect: none` an Strukturen, die über Runner-Intent schon Runtime-Wirkung haben.

## Noch unverzichtbare Fallbacks

- `buildDeckDoctrineProfile` für Opening-Hand-/Mulligan-Bewertung.
- `ownDeckDoctrine` als sanitized Input-Feld für alte Runtime-, Discard- und forced-legacy-Pfade, bis DSR-10 Ersatz oder klare Abgrenzung schafft.
- Legacy-Planer unter `packages/ai/src/legacy/**` für `NETGRID_SEMANTIC_AI_RUNTIME=legacy` und `semantic_runtime_no_non_excluded_legal_action`-Fallback.
- Existing practical fixes und Overlays für Remote-Contest, Scorefenster, Coverage, Tag-/Punish- und Micro-Entscheidungen.

## Relevante vorhandene Tests

- `packages/ai/src/deck-doctrine.test.ts`
- `packages/ai/src/deck-doctrine-strategy.test.ts`
- `packages/ai/src/runner-strategic-intent.test.ts`
- `packages/ai/src/runner-tactical-goals.test.ts`
- `packages/ai/src/decision/doctrine-goal-synthesis.test.ts`
- `packages/ai/src/decision/neutral-goal-synthesis.test.ts`
- `packages/ai/src/decision/semantic-decision-frame.test.ts`
- `packages/ai/src/decision/semantic-shadow-decision.test.ts`
- `packages/ai/src/tactical-plans.test.ts`
- `packages/ai/src/runtime/semantic-choice-ranking.test.ts`
- `packages/ai/src/runtime/semantic-runtime-score-components.test.ts`
- `packages/ai/src/semantic-ai-runtime-cutover.test.ts`
- `packages/ai/src/evaluation/current-ai-holdout-runner.test.ts`
- `packages/ai/src/evaluation/replay-portable-fixtures.test.ts`

## Korrigierte Ausgangsannahmen

- `DeckStrategyProfile` ist nicht mehr ausschließlich Viewer-/Report-Diagnostik, wenn `ownDeckSnapshot` im AI-Input liegt; Runner-StrategicIntent konsumiert es produktiv.
- `DeckDoctrineV2Diagnostic` selbst ist weiterhin nicht produktiv verkabelt.
- Doctrine-Ziele existieren als Synthese, werden aber nicht mit den Runtime-TacticalGoals zusammengeführt.
- Runner hat einen produktiven Strategieprojektionspfad; Corp nicht.
- Strategische Persistenz existiert nur indirekt über TacticalPlanMemory, nicht als eigener `StrategicIntentState`.

## Baseline-Checks

- `corepack pnpm --filter @netgrid/ai test`: pass, 141 Testdateien, 1602 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `git diff --check`: pass.

## Baseline-Hygiene-Fix

Vor Runtime-Codeänderungen war `packages/ai/src/simulation/benchmark-reports.test.ts` rot: Der No-Limit-Kontrollseed `ai-v143-tuning-001` erreichte mit `maxActions: 160` inzwischen das Action-Limit. Der Testfall prüft nicht die Spielstärke dieses Seeds, sondern dass `actionAlternatives` nur in Action-Limit-Finding-Fenstern erhalten bleiben. Der Kontrolllauf nutzt deshalb jetzt `maxActions: 300`; eine temporäre Seed-Probe zeigte für denselben Deckpaar-Snapshot `actionLimit=0` und `actions=198`.
