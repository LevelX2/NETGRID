# V1.7.0 Test Matrix - Mechanikpaket D

Stand: 2026-05-09  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V170-T001 | Abhängigkeit | V170-MUST-001 | Review: V1.6.3 Final Gate ist grün. |
| V170-T002 | Preflight-Schnitt | V170-MUST-002, V170-MUST-011 | Artefakt-Test: `freigabefähig`/`deferred` dokumentiert. |
| V170-T003 | Kernkorb exakt 5 | V170-MUST-003 | Unit-Test: Kartenliste exakt und vollständig. |
| V170-T004 | Unique-Constraint Deck/Runtime | V170-MUST-004, V170-MUST-005 | Engine-Test: Deckvalidation + Install-Block für doppelte Unique-Karten. |
| V170-T005 | Hosting/Daemon-Kaskade | V170-MUST-006, V170-SHOULD-001 | Engine-Test: gehostete Install-Aktion, MU-Vertrag, Host-Trash-Kaskade. |
| V170-T006 | Stealth/Noisy Recurring | V170-MUST-007, V170-MUST-009 | Engine-Test: Cloak erlaubt nicht-noisy, blockt noisy Breaker. |
| V170-T007 | Start-of-turn Resolver | V170-MUST-008 | Engine-Test: Floating Runner BBS + Smith's Pawnshop Choice deterministisch. |
| V170-T008 | Subtype-Konsistenz | V170-MUST-009 | Unit-Test: Dwarf/Worm Subtype-Mapping bleibt konsistent. |
| V170-T009 | Replay/Visibility/StateHash | V170-MUST-010 | Regression über Engine-/Server-Testpfade. |
| V170-T010 | Runtime-Allowlist | V170-MUST-011 | Catalog-Test: Runtime-Allowlist nur +5, kein neuer AI-Support. |
| V170-T011 | No-Scope | V170-MUST-012 | No-Scope-Review: keine Plattform-/Public-Features. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Gate-Auswertung

V1.7.0 ist finalisierbar, wenn alle Pflichtchecks grün sind, der 5er-Kernkorb exakt freigegeben ist und Unique-/Hosting-/Recurring-/Subtype-Pfade deterministisch ohne Leak laufen.
