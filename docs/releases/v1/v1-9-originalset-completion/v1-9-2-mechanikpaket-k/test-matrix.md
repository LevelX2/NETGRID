# V1.9.2 Test Matrix - Hidden-Zone-/Access-/Run-Kernverbreiterung

Stand: 2026-05-10  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V192-T001 | Abhaengigkeit | V192-MUST-001 | Review: V1.9.1 Final Gate ist gruen. |
| V192-T002 | Preflight-Kernkorb | V192-MUST-003 | Artefakt-Test: V1.9.2-Kernkorb + Deferred-Liste eingefroren. |
| V192-T003 | Scope-Grenze | V192-MUST-002, V192-MUST-008 | Review/Test: nur freigegebene Effektfamilien aktiv. |
| V192-T004 | Data-Naga-Entscheidung | V192-MUST-004 | Preflight-Test: `Data Naga` mit klarer `freigabefaehig`/`deferred`-Begruendung. |
| V192-T005 | Hidden-Zone-Redaction | V192-MUST-005 | Visibility-Test: Search/Reorder/Shuffle ohne Gegenleaks. |
| V192-T006 | Access-/Multiaccess-Pfade | V192-MUST-006 | Engine-/Scenario-Test: deterministische Access-Reihenfolgen. |
| V192-T007 | Run-Locks/Recurring | V192-MUST-006 | Engine-Test: Run-Locks und Start-of-turn-Resolver stabil. |
| V192-T008 | Deferred-Haertung | V192-MUST-007 | Manifest-/Catalog-Test: spaetere Abhaengigkeiten bleiben deferred. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Release-spezifische Smokes/Regressionen

- `data/scenarios/v192-card-release-smoke.json`
- `packages/engine/src/index.test.ts::V1.9.2`
- `tests/specs/visibility-contract.test.ts`

## Gate-Auswertung

V1.9.2 ist finalisierbar, wenn Hidden-Zone-/Access-/Run-Erweiterungen deterministisch und leakfrei laufen und der Preflight-Schnitt sauber dokumentiert ist.
