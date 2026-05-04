# MVP 0.93 Test Matrix

Status: bestanden
Stand: 2026-05-03

## Matrix

| Test-ID | Deckt ab | Prüfpfad | Ergebnis |
|---|---|---|---|
| V093-T001 | M093-M1-SHARED-001 | `corepack pnpm --filter @netrunner/shared typecheck` | pass |
| V093-T002 | M093-M1-CHOICE-001 | Engine pendingChoice PlayerView-Test | pass |
| V093-T003 | M093-M1-CHOICE-002 | Engine Choice-Revalidierung mit ungültiger Option | pass |
| V093-T004 | M093-M1-CHOICE-001 | Engine LegalActions bei offener Choice | pass |
| V093-T005 | M093-M1-NOSCOPE-001 | Engine-Test: keine normalen `resolve_choice`-/`trigger_ability`-Actions | pass |
| V093-T006 | M093-M1-EFFECT-001, M093-M1-EFFECT-002 | Engine Effect-Command-Test | pass |
| V093-T007 | M093-M1-VISIBILITY-001 | Engine Eventklassifikation für Access | pass |
| V093-T008 | M093-M1-ABILITY-001, M093-M1-ACTION-001 | Engine Breaker Ability-Pilot-Test | pass |
| V093-T009 | M093-M1-ACTION-001 | Bestehende Engine-Regressionen | pass |
| V093-T010 | M093-M1-REPLAY-001 | Engine Replay für Choice und bestehende Replay-Tests | pass |
| V093-T011 | M093-M1-MP-001 | Server Bootstrap/Reconnect/WebSocket pendingChoice-Test | pass |
| V093-T012 | M093-M1-AI-001 | AI pendingChoice LegalActions-only-Test | pass |
| V093-T013 | M093-M2-SETUP-001, M093-M2-MULLIGAN-001, M093-M2-WIN-001, M093-M2-DECKOUT-001, M093-M2-FLATLINE-001, M093-M2-IDENTITY-001, M093-M2-ARCHIVES-001 | `SETUP_GAME_END_0.93_SPEC.md` vorhanden, keine M2-Mechanik implementiert | pass |
| V093-T014 | M093-GATE-001 | Requirements Review, Implementation Review, Final Review | pass |

## Ausgeführte Checks

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test -- --run`: pass, 25 Tests.
- `corepack pnpm --filter @netrunner/ai test -- --run`: pass, 16 Tests.
- `corepack pnpm --filter @netrunner/server test -- --run`: pass, 14 Tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 17 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 Tests.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass, bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route bleibt.
- `corepack pnpm lint`: pass nach neu erzeugter `.next`-Typstruktur.
- `corepack pnpm typecheck`: pass nach neu erzeugter `.next`-Typstruktur.

## StateHash-Review

V0.93 erweitert das Eventschema additiv um `visibilityClass` und das GameState-Schema optional um `pendingChoice`. `visibilityClass` allein ändert den StateHash nicht, weil `hashState` das Eventlog weiterhin ausklammert. Ein offenes `pendingChoice` ist dagegen Teil des aktuellen GameState und damit hashrelevant, solange die Choice offen ist. Es wurden keine Golden-Scenario-Rebaselines durchgeführt. Die vorhandenen Replay-Tests prüfen deterministische Hashes aus dem jeweils erzeugten State.
