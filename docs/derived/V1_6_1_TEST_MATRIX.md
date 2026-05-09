# V1.6.1 Test Matrix - Mechanikpaket A

Stand: 2026-05-09  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V161-T001 | Abhängigkeit | V161-MUST-001 | Review: V1.6.0 Final Gate ist grün. |
| V161-T002 | Preflight-Schnitt | V161-MUST-002, V161-MUST-009 | Artefakt-Test: `freigabefähig`/`deferred` dokumentiert. |
| V161-T003 | Kernkorb exakt 6 | V161-MUST-003 | Unit-Test: Kartenliste exakt und vollständig. |
| V161-T004 | Runtime-Prevention | V161-MUST-004, V161-MUST-005 | Engine-Test: Force Shield / Dermatech öffnen echte Prevention-Choices und begrenzen Prevention turn-basiert. |
| V161-T005 | Core-Damage-ICE | V161-MUST-006 | Engine-Test: Code Corpse / Cortical Scrub / Liche verursachen deterministischen Core Damage. |
| V161-T006 | V1.2.0/0.2 Regression | V161-MUST-007 | Server-Test: Event-Modification-Reconnect/Undo/Idempotency bleibt grün. |
| V161-T007 | Replacement Regression | V161-MUST-008 | Engine-Test: V1.2.1 Replacement-Fälle bleiben grün. |
| V161-T008 | Kein impliziter Unlock | V161-MUST-009, V161-MUST-010 | Catalog-Test: Runtime-Allowlist nur +6, kein neuer AI-Support. |
| V161-T009 | Hidden Info | V161-MUST-011 | Visibility-/Reconnect-Test: keine Leaks in Choice-/Event-Projektionen. |
| V161-T010 | No-Scope | V161-MUST-012, V161-MUST-013 | No-Scope-Review: keine Plattformfeatures, kein Parserpfad. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Gate-Auswertung

V1.6.1 ist finalisierbar, wenn alle Pflichtchecks grün sind, die 6 Karten exakt freigegeben sind und keine Hidden-Info-/V1.2.x-Regression auftritt.
