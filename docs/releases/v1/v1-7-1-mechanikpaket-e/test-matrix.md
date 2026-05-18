# V1.7.1 Test Matrix - Mechanikpaket E

Stand: 2026-05-09  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V171-T001 | Abhängigkeit | V171-MUST-001 | Review: V1.7.0 Final Gate ist grün. |
| V171-T002 | Preflight-Schnitt | V171-MUST-002, V171-MUST-010 | Artefakt-Test: `freigabefähig`/`deferred` je Karte dokumentiert. |
| V171-T003 | Kernkorb exakt 5 | V171-MUST-003 | Unit-/Catalog-Test: Kartenliste exakt und vollständig. |
| V171-T004 | Hidden-Zone-Search | V171-MUST-004 | Engine-Test: `Temple Microcode Outlet` Search-Choice, Shuffle, Hidden-Barrier. |
| V171-T005 | Run->RD Access Replacement | V171-MUST-005 | Engine-Test: `Private LDL Access` ersetzt HQ-Access deterministisch durch R&D-Access. |
| V171-T006 | Run->No-Access Credit Loss | V171-MUST-006, V171-MUST-007 | Engine-Test: `Weather-to-Finance Pipe` und `Edited Shipping Manifests` ersetzen Access deterministisch. |
| V171-T007 | HQ Multiaccess Bonus | V171-MUST-008, V171-SHOULD-002 | Engine-Test: installierte `HQ Interface`-Instanz erhöht HQ-Access nur auf HQ. |
| V171-T008 | Replay/Visibility/StateHash | V171-MUST-009, V171-SHOULD-001 | Regression über Engine-/Server-Testpfade. |
| V171-T009 | Runtime-Allowlist | V171-MUST-010 | Catalog-Test: Runtime-Allowlist nur +5, kein neuer AI-Support. |
| V171-T010 | No-Scope | V171-MUST-011 | No-Scope-Review: keine Plattform-/Public-Features. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Gate-Auswertung

V1.7.1 ist finalisierbar, wenn alle Pflichtchecks grün sind, der 5er-Kernkorb exakt freigegeben ist und Search-/Run-/Access-Pfade deterministisch ohne Leak laufen.
