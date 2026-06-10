# AI Source Structure Reorg Final Report 2026-06-10

## Status

`followup_corrected_green`

## Ergebnis

Der Paketprozess STRUCT-0 bis STRUCT-7 ist umgesetzt. Die öffentliche Paketgrenze bleibt `packages/ai/src/index.ts`; produktive Implementierungsverantwortung ist aber weiter in klarere Module ausgelagert:

- Runtime-Orchestrierung: `packages/ai/src/runtime/semantic-runtime.ts`
- Legacy-Notaus und No-Candidate-Fallback: `packages/ai/src/legacy/legacy-runtime-fallback.ts`
- Action-Semantik-Bausteine: `packages/ai/src/actions/*`
- Run- und Risk-Projektionen: `packages/ai/src/actions/run-action-projection.ts`, `packages/ai/src/actions/risk-action-projection.ts`
- Runner-Economy-Posture: `packages/ai/src/runner-economy-posture.ts`
- TacticalPlan-Typen und PlanMemory: `packages/ai/src/plans/tactical-plan-types.ts`, `packages/ai/src/plans/plan-memory.ts`
- Legacy-Planer: `packages/ai/src/legacy/runner-plans.ts`, `packages/ai/src/legacy/corp-plans.ts`
- Simulation-Basistypen: `packages/ai/src/simulation/simulation-types.ts`
- Semantic-Runtime-Typen und Choice-Ranking im Follow-up: `packages/ai/src/runtime/semantic-runtime-types.ts`, `packages/ai/src/runtime/semantic-choice-ranking.ts`
- Fokussierte Simulation-Tests im Follow-up: `packages/ai/src/simulation/simulation-harness.test.ts`, `packages/ai/src/simulation/v143-fixtures.test.ts`

Die alten öffentlichen Importpfade für `runner-plans.ts`, `corp-plans.ts`, `tactical-plans.ts`, `runner-run-target-evaluation.ts` und `index.ts` bleiben über Fassaden beziehungsweise Re-Exports erhalten.

## Safety-Grenzen

- Keine neue LegalAction-Erzeugung.
- Keine Änderung an Engine-Regeln, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, KI-Inputs, Debug-Ausgaben, Logs oder Reconnect-Payloads.
- `NETGRID_SEMANTIC_AI_RUNTIME=legacy` und No-Candidate-Fallback bleiben erhalten.
- Finale AI-Actions stammen weiterhin aus den übergebenen `legalActions`.

## Verifikation

Grün nach STRUCT-Follow-up:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Der vollständige `@netgrid/ai`-Testlauf ist nach der nachgelagerten Testbereinigung und dem Follow-up grün. Der letzte vollständige Lauf im Follow-up-Stand bestand mit 54 Testdateien und 1030 Tests.

Historischer Hinweis: Die im ursprünglichen STRUCT-7-Report genannte rote `index.test.ts`-Baseline ist durch den späteren Commit `fd817c70 fix(ai): repair AI test gates` und den Follow-up-Prozess nicht mehr der aktuelle Stand.

## Offene Folgearbeit

Weitere Ausdünnung von `index.test.ts` und zusätzliche Extraktion von Debug-/Diagnosefunktionen aus `packages/ai/src/index.ts` bleiben sinnvoll, sind aber keine offenen Blocker für den aktuellen grünen Abschluss.
