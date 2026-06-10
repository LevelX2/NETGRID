# AI-FUP-R3 index.ts-Restlogik Review

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI-FUP-R3`
Branch: `codex/ai-source-followup-review-fixes`

## Ziel

`packages/ai/src/index.ts` soll nach der Source-Reorg weiter entlastet werden, aber nur durch kleine Extraktionen ohne Export-, Runtime- oder Legacy-Fallback-Risiko.

## Inventar

- `index.ts` hatte vor R3 34576 Zeilen.
- Verbliebene größere Blöcke:
  - Semantic-Runtime-DecisionDebug mit enger Kopplung an PlanRuntime, Coverage-Auswahl, Scrubbing und ScoreBreakdown.
  - Legacy-Baseline-Assembly über `decisionFromChoices` und `scoreActions`.
  - Simulation-/Benchmark-Helfer und Metrikaufbereitung.

## Umsetzung

- Der isolierte Simulation-RNG wurde aus `index.ts` nach `packages/ai/src/simulation/simulation-rng.ts` verschoben.
- `index.ts` importiert nun `createSimulationRng` und `SimulationRng` aus dem Simulation-Modul.
- Der lokale `fnv1a`-Helper in `index.ts` bleibt bestehen, weil er an weiteren Stellen genutzt wird. Das neue RNG-Modul kapselt seinen eigenen deterministischen Hash lokal.

## Bewusste Nicht-Extraktionen

- `semanticRuntimeDecisionDebug` bleibt vorerst in `index.ts`, weil eine sichere Extraktion mehrere lokale Typen und Helper gleichzeitig schneiden müsste.
- `decisionFromChoices` und `scoreActions` bleiben vorerst in `index.ts`, weil sie auf einen großen lokalen Helpergraphen zugreifen. `legacy/legacy-baseline.ts` ist bereits der öffentliche Legacy-Baseline-Entrypoint.
- Simulation-Report- und Benchmark-Metriken bleiben für spätere, größere Simulation-Modul-Schnitte offen.

## Bewertung

R3 reduziert `index.ts` minimal und sicher. Die größeren Restblöcke sind weiterhin echte Strukturreste, aber kein Blocker für diesen Review-Fixes-Prozess, solange vollständige AI-Tests, Runtime-Cutover-Tests und Simulation-Harness-Tests grün bleiben.

## Verification

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/simulation-harness.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/v143-fixtures.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai typecheck`: siehe Paketabschluss.
- `git diff --check`: siehe Paketabschluss.

## Sicherheitsgrenzen

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Änderung an Semantic-Runtime-Scoring.
- Keine Änderung an Legacy- oder No-Candidate-Fallback.
- Keine Exportentfernung aus `@netgrid/ai`.
