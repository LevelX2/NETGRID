# AI Source Structure Reorg Final Report 2026-06-10

## Status

`ready_for_local_main_integration`

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

Die alten öffentlichen Importpfade für `runner-plans.ts`, `corp-plans.ts`, `tactical-plans.ts`, `runner-run-target-evaluation.ts` und `index.ts` bleiben über Fassaden beziehungsweise Re-Exports erhalten.

## Safety-Grenzen

- Keine neue LegalAction-Erzeugung.
- Keine Änderung an Engine-Regeln, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, KI-Inputs, Debug-Ausgaben, Logs oder Reconnect-Payloads.
- `NETGRID_SEMANTIC_AI_RUNTIME=legacy` und No-Candidate-Fallback bleiben erhalten.
- Finale AI-Actions stammen weiterhin aus den übergebenen `legalActions`.

## Verifikation

Grün:

```bash
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts src/runner-run-target-evaluation.test.ts src/runner-hand-development.test.ts src/runner-tactical-goals.test.ts src/runner-golden-deck-debug.test.ts src/simulation/benchmark-reports.test.ts
git diff --check
```

Der fokussierte Vitest-Lauf deckte acht Testdateien mit 159 bestandenen Tests ab.

Bekannte Ausgangsabweichung:

```bash
corepack pnpm --filter @netgrid/ai test
```

Der vollständige `@netgrid/ai`-Testlauf bleibt wegen der bereits in STRUCT-0 dokumentierten sieben bestehenden Fehler in `src/index.test.ts` rot. Der Schlusslauf nach STRUCT-7 zeigte dieselbe Baseline: 50 Testdateien bestanden, 1 Testdatei fehlgeschlagen, 1018 Tests bestanden, 7 Tests fehlgeschlagen.

## Offene Folgearbeit

`index.test.ts` wurde bewusst nicht ausgedünnt. Die Ausdünnung bleibt sinnvoll, sobald die roten Baseline-Blöcke behoben oder durch fokussierte grüne Ersatztests abgesichert sind.
