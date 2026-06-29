# AI-COMPLETE-17 Scoring Consumer Contract

Status: `VERIFIED`

Zweck: AI-COMPLETE-17 baut fachliche Scoring-Consumer auf. Dieser Vertrag hält die geforderten Scoring-Dimensionen, ihre aktuellen Owner und den Implementierungsstatus fest, damit die nächsten Code-Schnitte gezielt fehlende Consumer schließen statt neue Parallelbewertungen einzuführen.

## Dimensionen

| Dimension | Owner | Status | Skala |
| --- | --- | --- | --- |
| Goal Fit | `packages/ai/src/decision/action-goal-fit.ts` | `active` | `-100..100`, neutral `0` |
| Target Fit | `packages/ai/src/decision/action-goal-fit.ts` | `active` | `-100..100`, neutral `0` |
| Cost | `packages/ai/src/decision/action-goal-fit.ts`, Runtime-Credit-Cost-Penalty | `active` | `-100..100`, neutral `0` |
| Timing | `packages/ai/src/decision/action-goal-fit.ts` | `active` | `-100..100`, neutral `0` |
| Reachability | `packages/ai/src/runner-run-target-evaluation.ts` plus `runtime/runner-run-target-guidance-score.ts` | `active` | `-100..100`, neutral `0` |
| Boardstate Need | `packages/ai/src/runtime/semantic-runtime-corp-board-triage.ts` | `active` | `-100..100`, neutral `0` |
| Risk | `packages/ai/src/decision/action-goal-fit.ts` | `active` | `-100..100`, neutral `0` |
| Doctrine | `packages/ai/src/decision/doctrine-goal-synthesis.ts` | `active` | `-100..100`, neutral `0` |
| Plan Continuity | `packages/ai/src/plans/tactical-plan-progression.ts` | `active` | `-100..100`, neutral `0` |
| Terminal Outcome | `packages/ai/src/runtime/semantic-runtime-corp-score-safety.ts` | `active` | `-100..100`, neutral `0` |
| Reserve | `packages/ai/src/runtime/semantic-runtime-corp-score.ts` | `active` | `-100..100`, neutral `0` |
| Uncertainty | `packages/ai/src/belief-state.ts` | `active` | `-100..100`, neutral `0` |

## Code-Vertrag

- `packages/ai/src/decision/scoring-consumer-contract.ts` ist die maschinenlesbare Dimensionenliste.
- `packages/ai/src/decision/scoring-consumer-contract.test.ts` schützt, dass alle AI-COMPLETE-17-Pflichtdimensionen genau einmal definiert sind und jeweils Owner, Skala und Evidence-Key besitzen.
- `contract_only` bedeutet: fachlicher Owner und Skalenband sind festgelegt, aber produktive Score-Komponenten fehlen noch.
- `partial` bedeutet: es gibt produktive oder diagnostische Signale, aber die Dimension ist noch nicht vollständig als normalisierter fachlicher Consumer in der Runtime verankert.

## Abschluss

AI-COMPLETE-17 ist abgeschlossen. Alle Pflichtdimensionen sind im maschinenlesbaren Vertrag vorhanden, auf `-100..100` skaliert und als `active` markiert; `packages/ai/src/decision/scoring-consumer-contract.test.ts` schützt diesen Zustand.
