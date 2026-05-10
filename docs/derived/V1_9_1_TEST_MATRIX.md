# V1.9.1 Test Matrix - Deferred-Aufloesung und Zufall-Restfaelle

Stand: 2026-05-10  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V191-T001 | Abhaengigkeit | V191-MUST-001 | Review: V1.9.0 Final Gate ist gruen. |
| V191-T002 | Preflight-Kernkorb | V191-MUST-002, V191-SHOULD-002 | Artefakt-Test: exakt drei Kernkarten, keine Zusatzfreigabe. |
| V191-T003 | Random-Determinismus | V191-MUST-003 | Engine-Test: identische Seeds => identische RandomRecords/StateHashes. |
| V191-T004 | Grubb-Lifecycle | V191-MUST-004 | Engine-/Scenario-Test: remainder-of-run Strength korrekt gesetzt/entfernt. |
| V191-T005 | Incubator-Transform | V191-MUST-005 | Engine-Test: Start-of-turn-/Counter-Choice legal und deterministisch. |
| V191-T006 | Cockroach-Pfad | V191-MUST-006 | Engine-/Scenario-Test: HQ-Discard-/Counter-Pfad deterministisch und leakfrei. |
| V191-T007 | Visibility/Replay | V191-MUST-007 | Regression: PlayerView/PublicEvents/Reconnect/Undo/Replay ohne Leaks. |
| V191-T008 | No-Scope | V191-MUST-008, V191-MUST-009 | Manifest-/Catalog-Check: keine impliziten Freigaben, keine V2.x-Pfade. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Release-spezifische Smokes/Regressionen

- `data/scenarios/v191-card-release-smoke.json`
- `packages/engine/src/index.test.ts::V1.9.1`
- `packages/catalog/src/index.test.ts::V1.9.1`

## Gate-Auswertung

V1.9.1 ist finalisierbar, wenn der 3er-Deferred-Kern deterministisch, side-sicher und ohne Scope-Ausweitung freigegeben ist.
