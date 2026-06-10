# AI Source Structure Reorg STRUCT-7 Simulation Boundary 2026-06-10

## Status

`implemented_with_index_test_preserved`

## Umgesetzter Schnitt

STRUCT-7 lagert die stabilen Simulation-Basistypen aus `packages/ai/src/index.ts` nach `packages/ai/src/simulation/simulation-types.ts` aus:

- `SimulationControllerMode`
- `SimulationBenchmarkProfileId`
- `SimulationBenchmarkProfile`
- `SimulationWorld`

`index.ts` bleibt für diese Typen öffentliche Fassade und re-exportiert sie weiter.

## Bewusste Grenze

`index.test.ts` wurde nicht ausgedünnt. Die STRUCT-0-Baseline ist bereits mit sieben bestehenden Fehlern rot. Solange diese roten Bereiche nicht behoben oder durch fokussierte grüne Ersatztests abgedeckt sind, wäre das Entfernen von `index.test.ts`-Abschnitten kein sicherer Strukturgewinn.

Die Ausdünnung bleibt damit an die Regel gebunden: Erst fokussierte Tests grün absichern, dann einzelne `index.test.ts`-Blöcke entfernen.

## Checks

```bash
corepack pnpm --filter @netgrid/ai typecheck
```

Weitere Paketchecks laufen im finalen Verify nach Abschluss aller Strukturpakete.
