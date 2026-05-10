# V1.9.4 Test Matrix - Damage/Prevention/Core-Erweiterungen

Stand: 2026-05-10  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V194-T001 | Abhaengigkeit | V194-MUST-001 | Review: V1.9.3 Final Gate ist gruen. |
| V194-T002 | Preflight-Kernkorb | V194-MUST-003 | Artefakt-Test: V1.9.4-Kernkorb + Deferred-Liste eingefroren. |
| V194-T003 | Scope-Grenze | V194-MUST-002, V194-MUST-008 | Review/Test: nur V1.9.4-Effektfamilien aktiv. |
| V194-T004 | Data-Darts-Entscheidung | V194-MUST-004 | Preflight-Test: `Data Darts` mit klarer `freigabefaehig`/`deferred`-Begruendung. |
| V194-T005 | Damage-Determinismus | V194-MUST-005 | Engine-/Scenario-Test: Damage-Pfade konsistent und replaybar. |
| V194-T006 | Prevention/Avoid/Replacement | V194-MUST-005 | Engine-Test: Fensterreihenfolge/Choices legal und deterministisch. |
| V194-T007 | Core-/Brain-Damage | V194-MUST-006 | Engine-/Regressionstest: Handlimit/Flatline/Game-End konsistent. |
| V194-T008 | Hidden-Info-Gate | V194-MUST-007 | Visibility-Test: keine Leaks in Damage-/Discard-nahen Events. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Release-spezifische Smokes/Regressionen

- `data/scenarios/v194-card-release-smoke.json`
- `packages/engine/src/index.test.ts::V1.9.4`
- `tests/specs/visibility-contract.test.ts`

## Gate-Auswertung

V1.9.4 ist finalisierbar, wenn Damage-/Prevention-/Core-Pfade deterministisch, leakfrei und ohne Scope-Uebergriff auf V1.9.5+ umgesetzt sind.
