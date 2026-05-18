# V1.1.1 Test Matrix - Discard, Handlimit und Core Damage

Stand: 2026-05-07
Status: eingefroren

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V111-T001 | Shared/Types | V111-MUST-001, V111-MUST-003, V111-MUST-017 | Shared typecheck und Engine/Web typecheck. |
| V111-T002 | Corp Turn Flow | V111-MUST-002, V111-MUST-005 | Engine-Test: Korp-Endturn ohne Überhand wechselt über Discard sauber zum Runner. |
| V111-T003 | Runner Turn Flow | V111-MUST-002, V111-MUST-005 | Engine-Test: Runner-Endturn ohne Überhand wechselt über Discard sauber zur Korp-Draw-Phase. |
| V111-T004 | Corp Discard Choice | V111-MUST-006, V111-MUST-007, V111-MUST-008 | Engine-Test: übervolles HQ erzeugt private Korp-Choice mit exakter Anzahl und facedown Archives. |
| V111-T005 | Runner Discard Choice | V111-MUST-006, V111-MUST-007, V111-MUST-009 | Engine-Test: übervolle Grip erzeugt private Runner-Choice und bewegt Karten in Heap. |
| V111-T006 | Revalidation | V111-MUST-007 | Engine-Test: falsche Side, stale StateVersion, falsche Anzahl und Nicht-Handkarten werden abgelehnt. |
| V111-T007 | Discard Event | V111-MUST-010, V111-MUST-011 | Engine/PublicEvent-Test: `discardResolved`, kein Trash-Event, Hidden-Info-Barriere. |
| V111-T008 | Core Damage Normal | V111-MUST-012, V111-MUST-013, V111-MUST-015 | Engine-Test: Core Damage trashte zufällig, erhöht Core-Damage-Status und reduziert Handlimit. |
| V111-T009 | Core Damage Flatline | V111-MUST-014 | Engine-Test: `amount > grip.length` flatlined ohne zusätzliche Random-Auswahl. |
| V111-T010 | Negative Handlimit Flatline | V111-MUST-016 | Engine-Test: Runner flatlined erst zu Beginn des Runner-Discard-Steps bei maxHandSize < 0. |
| V111-T011 | Replay/StateHash | V111-MUST-021 | Engine-Test: Replay reproduziert Discard, Core Damage, RandomDrawRecords und StateHash. |
| V111-T012 | Visibility Contract | V111-MUST-008, V111-MUST-009, V111-MUST-017, V111-MUST-018 | Root Visibility-Spec scannt PlayerViews, Payloads, Reconnect und Diagnostik auf Hidden-Info-Leaks. |
| V111-T013 | Multiplayer | V111-MUST-011, V111-MUST-018 | Server-Test: Submit, Idempotency, Stale-State, Reconnect/EventTail und Undo-Barriere bei Discard/Core Damage. |
| V111-T014 | AI | V111-MUST-019 | AI-Test: KI löst Discard deterministisch über PlayerView/LegalActions. |
| V111-T015 | Web UI | V111-MUST-020 | Web-Test: dynamisches Handlimit, Core-Damage-Status und Discard-Choice-Anzeige. |
| V111-T016 | E2E | V111-MUST-018, V111-MUST-020 | Browser-E2E-Smoke deckt Discard-Choice, Reconnect und Core-Damage-Status ohne Hänger ab. |
| V111-T017 | No-Scope | V111-MUST-022 | Regression: keine Prevention/Avoid/Interrupt/Replacement-, Full-Archives- oder Runner-Deckout-Funktion. |

## Pflichtchecks

- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/engine test -- --run`
- `corepack pnpm --filter @netgrid/server test -- --run`
- `corepack pnpm --filter @netgrid/ai test -- --run`
- `corepack pnpm --filter @netgrid/web test -- --run`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`

