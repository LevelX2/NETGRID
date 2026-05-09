# V1.6.3 Test Matrix - Mechanikpaket C

Stand: 2026-05-09  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V163-T001 | Abhängigkeit | V163-MUST-001 | Review: V1.6.2 Final Gate ist grün. |
| V163-T002 | Preflight-Schnitt | V163-MUST-002, V163-MUST-009 | Artefakt-Test: `freigabefähig`/`deferred` dokumentiert. |
| V163-T003 | Kernkorb exakt 5 | V163-MUST-003 | Unit-Test: Kartenliste exakt und vollständig. |
| V163-T004 | Uninstall-ICE | V163-MUST-004 | Engine-Test: D'Arc/Sentinels/Triggerman trashen deterministisch Runner-Programme. |
| V163-T005 | Upgrade-Serverstärke | V163-MUST-005 | Engine-Test: Antiquated Interface wirkt nur auf ICE im selben Fort. |
| V163-T006 | Tokyo-Runbonus | V163-MUST-006, V163-MUST-007 | Engine-Test: Region-Lifecycle plus Creditbonus auf erfolglosen Run am selben Fort. |
| V163-T007 | Replay/Visibility/StateHash | V163-MUST-008 | Regression über bestehende Engine-/Server-Testpfade. |
| V163-T008 | Kein impliziter Unlock | V163-MUST-009, V163-MUST-010 | Catalog-Test: Runtime-Allowlist nur +5, kein neuer AI-Support. |
| V163-T009 | No-Scope | V163-MUST-011 | No-Scope-Review: keine Plattform-/Public-Features. |
| V163-T010 | ChoiceFlow-Dokumentation | V163-SHOULD-003 | Review: ChoiceFlow im Kernrelease ausdrücklich deferred begründet. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Gate-Auswertung

V1.6.3 ist finalisierbar, wenn alle Pflichtchecks grün sind, der 5-Kernkorb exakt freigegeben ist und Uninstall-/Upgrade-/Regionpfade deterministisch ohne Leak laufen.
