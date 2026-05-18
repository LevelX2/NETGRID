# V1.9.3 Test Matrix - Trace/Tag/Resource/Action-Fenster

Stand: 2026-05-10  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V193-T001 | Abhaengigkeit | V193-MUST-001 | Review: V1.9.2 Final Gate ist gruen. |
| V193-T002 | Preflight-Kernkorb | V193-MUST-003 | Artefakt-Test: V1.9.3-Kernkorb + Deferred-Liste eingefroren. |
| V193-T003 | Scope-Grenze | V193-MUST-002, V193-MUST-008 | Review/Test: nur V1.9.3-Effektfamilien aktiv. |
| V193-T004 | TKO-2.0-Entscheidung | V193-MUST-004 | Preflight-Test: `TKO 2.0` mit klarer `freigabefaehig`/`deferred`-Begruendung. |
| V193-T005 | Trace/Bid-Determinismus | V193-MUST-005 | Engine-/Scenario-Test: gleiche Seeds => gleiche Trace/Bid-Pfade. |
| V193-T006 | Tag/Resource-Pfade | V193-MUST-005 | Engine-Test: Tag-Remove/Avoid und Resource-Interaktionen legal/stabil. |
| V193-T007 | Action-/Handsize-Modifier | V193-MUST-006 | Engine-/Regressionstest: Action-Loss/Handsize konsistent ueber Turn-Wechsel. |
| V193-T008 | Counter-Deferred | V193-MUST-007 | Manifest-/Catalog-Check: counter-gekoppelte Karten bleiben deferred. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Release-spezifische Smokes/Regressionen

- `data/scenarios/v193-card-release-smoke.json`
- `packages/engine/src/index.test.ts::V1.9.3`
- `tests/specs/visibility-contract.test.ts`

## Gate-Auswertung

V1.9.3 ist finalisierbar, wenn Trace-/Tag-/Resource-/Action-Fenster deterministisch, side-sicher und ohne Counter-Scope-Ausweitung laufen.
