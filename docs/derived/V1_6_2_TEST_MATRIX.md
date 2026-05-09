# V1.6.2 Test Matrix - Mechanikpaket B

Stand: 2026-05-09  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V162-T001 | Abhängigkeit | V162-MUST-001 | Review: V1.6.1 Final Gate ist grün. |
| V162-T002 | Preflight-Schnitt | V162-MUST-002, V162-MUST-008 | Artefakt-Test: `freigabefähig`/`deferred` dokumentiert. |
| V162-T003 | Kernkorb exakt 5 | V162-MUST-003 | Unit-Test: Kartenliste exakt und vollständig. |
| V162-T004 | Globale Rez-Kosten-Modifier | V162-MUST-004 | Engine-Test: Data Masons, Encoder Inc., Skälderviken reduzieren passende ICE-Rez-Kosten. |
| V162-T005 | Globale Stärke-Modifier | V162-MUST-005 | Engine-Test: Data Masons und Security Net erhöhen ICE-Stärke deterministisch. |
| V162-T006 | Priority Requisition | V162-MUST-006 | Engine-Test: Score-Effekt rezzt deterministisch ein unrezzed ICE kostenfrei. |
| V162-T007 | Replay/Visibility/StateHash | V162-MUST-007 | Regression über bestehende Engine-/Server-Testpfade. |
| V162-T008 | Kein impliziter Unlock | V162-MUST-008, V162-MUST-009 | Catalog-Test: Runtime-Allowlist nur +5, kein neuer AI-Support. |
| V162-T009 | No-Scope | V162-MUST-010 | No-Scope-Review: keine Plattform-/Public-Features. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Gate-Auswertung

V1.6.2 ist finalisierbar, wenn alle Pflichtchecks grün sind, die 5 Karten exakt freigegeben sind und die Modifier-/Score-Effekte deterministisch ohne Leak laufen.
