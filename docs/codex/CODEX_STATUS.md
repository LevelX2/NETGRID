# CODEX_STATUS

## Current phase

MVP 0.3 AI and simulation complete; MVP 0.4 requirements next.

## Status

Phase 1, MVP 0.1 executable requirements, is complete and committed.

`ready_for_implementation: true`

Phase 2, MVP 0.1 implementation, is implemented and locally verified.

`ready_for_hardening: true`

Phase 3, MVP 0.1 validation, hardening and documentation, is complete.

`MVP_0.1_done: true`

`ready_for_MVP_0.2_requirements: true`

MVP 0.2 requirements are complete.

`ready_for_implementation: true`

MVP 0.2 private multiplayer implementation is complete and locally verified.

`ready_for_hardening: true`

MVP 0.2 validation, hardening and documentation are complete.

`MVP_0.2_done: true`

Post-MVP 0.2 roadmap and MVP 0.3 detailed planning are complete.

`ready_for_MVP_0.3_requirements: true`

MVP 0.4 detailed planning is complete as a future gated phase.

`MVP_0.4_detailed_plan_available: true`

`ready_for_MVP_0.4_requirements_after_MVP_0.3_done: true`

MVP 0.3 requirements, implementation, validation and documentation are complete.

`MVP_0.3_done: true`

`ready_for_MVP_0.4_requirements: true`

## Goal

Active thread goal: Netrunner gated MVP delivery.

Gate flow:

1. MVP 0.1 executable requirements: pass.
2. MVP 0.1 implementation: pass.
3. MVP 0.1 validation, hardening and documentation: pass.
4. MVP 0.2 requirements: pass.
5. MVP 0.2 implementation: pass.
6. MVP 0.2 validation, hardening and documentation: pass.
7. Post-MVP 0.2 roadmap planning: pass.
8. MVP 0.3 requirements: pass.
9. MVP 0.3 implementation and validation: pass.
10. MVP 0.4 requirements: next.

## Phase 1 files created or updated

Derived docs:

- `docs/derived/MVP_0.1_REQUIREMENTS.md`
- `docs/derived/ENGINE_API_SPEC.md`
- `docs/derived/GAME_STATE_MODEL.md`
- `docs/derived/TIMING_AND_RUN_MODEL.md`
- `docs/derived/DEVIATION_REGISTRY.md`
- `docs/derived/ACCEPTANCE_CRITERIA.md`
- `docs/derived/TEST_MATRIX.md`
- `docs/derived/OPEN_QUESTIONS.md`
- `docs/derived/CONFLICT_MATRIX.md`
- `docs/derived/REQUIREMENTS_REVIEW.md`

Data artifacts:

- `data/rules/rules-baseline.json`
- `data/cards/demo-cards.json`
- `data/decks/demo-decks.json`
- `data/manifests/card-implementation-manifest.json`
- `data/deviations/rule-deviations.json`
- `data/scenarios/runner-steals-rd-agenda.json`
- `data/scenarios/runner-breaks-ice-and-accesses-rd.json`
- `data/scenarios/runner-fails-on-end-the-run.json`
- `data/scenarios/corp-scores-remote-agenda.json`
- `data/scenarios/visibility-runner-view-no-corp-leak.json`
- `data/scenarios/replay-full-demo-game-statehash.json`

Test spec:

- `tests/specs/acceptance-tests.todo.md`

## Phase 1 checks

- JSON parse check: pass for 11 JSON artifacts.
- Must requirement coverage check: pass, 42 Must requirements, 0 missing coverage IDs.
- Card manifest coverage check: pass, 13 `playable_mvp` cards, 0 missing unit/scenario coverage entries.

## Phase 2 files created or updated

Implementation:

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/ai/src/index.ts`
- `apps/server/src/index.ts`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/next.config.ts`

Tests and toolchain:

- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.test.ts`
- `tests/specs/phase1-artifacts.test.ts`
- package scripts and TypeScript configs across workspace packages
- `pnpm-lock.yaml`

Docs:

- `README.md`

## Phase 2 checks

- `corepack pnpm install`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 16 tests.
- `corepack pnpm build`: pass, including Next.js production build.
- Local web smoke: pass, `http://127.0.0.1:3000` answered with HTTP 200.

## Phase 3 files created or updated

- `docs/derived/MVP_0.1_FINAL_REVIEW.md`
- `docs/derived/MVP_0.2_READINESS_REVIEW.md`
- `apps/web/app/api/game/route.ts`
- `apps/web/app/page.tsx`
- `tests/specs/visibility-contract.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `README.md`
- `KI-Wissen-Netrunner/`

## Phase 3 checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 18 tests.
- `corepack pnpm build`: pass.
- Web API visibility smoke: pass. `/api/game` returned HTTP 200 and did not contain `cardInstances`, hidden `Simple Agenda`, or hidden unrezzed `Simple Barrier ICE`.

## Phase 3 hardening result

High-severity finding fixed: browser UI no longer imports the Engine or stores full GameState. Full GameState is held server-side in `apps/web/app/api/game/route.ts`; the client receives only Runner PlayerView, LegalActions, PublicEvents and `canRunCorp`.

## MVP 0.2 Requirements files created or updated

- `docs/derived/MVP_0.2_REQUIREMENTS.md`
- `docs/derived/MULTIPLAYER_API_SPEC.md`
- `docs/derived/WEBSOCKET_PROTOCOL_SPEC.md`
- `docs/derived/STORAGE_SCHEMA.md`
- `docs/derived/TOKEN_AND_SESSION_SECURITY.md`
- `docs/derived/RECONNECT_AND_UNDO_SPEC.md`
- `docs/derived/MULTIPLAYER_TEST_MATRIX.md`
- `docs/derived/MVP_0.2_REQUIREMENTS_REVIEW.md`
- `data/rules/rules-baseline-0.2.json`
- `data/scenarios/multiplayer-create-join-action.json`
- `data/scenarios/multiplayer-reconnect-during-run.json`
- `data/scenarios/multiplayer-undo-before-hidden-info.json`
- `data/scenarios/multiplayer-undo-after-hidden-info-blocked.json`
- `tests/specs/multiplayer-acceptance-tests.todo.md`

## MVP 0.2 Requirements checks

- JSON parse check: pass for 5 MVP-0.2 JSON artifacts.
- Must requirement coverage check: pass, 24 Must requirements, 0 missing coverage IDs.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 19 tests.

## MVP 0.2 Requirements gate

`ready_for_implementation: true`

Implementation has started and remains constrained to the private multiplayer scope only.

## MVP 0.2 Implementation files created or updated

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/index.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/server/package.json`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/visibility-contract.test.ts`
- `tests/specs/multiplayer-acceptance-tests.todo.md`
- `docs/derived/MVP_0.2_IMPLEMENTATION_REVIEW.md`
- `README.md`
- `.gitignore`
- `pnpm-lock.yaml`

## MVP 0.2 Implementation checks

- `corepack pnpm --filter @netrunner/server test`: pass, 7 Multiplayer tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.
- Multiplayer server health smoke: pass on `http://127.0.0.1:8787/health`.
- REST/WebSocket smoke: pass for create, join, host WebSocket, runner WebSocket, Corp mandatory action, and Runner hidden-info leak scan.
- Next web smoke: pass on `http://127.0.0.1:3000`.

## MVP 0.2 Implementation gate

`ready_for_hardening: true`

Phase 3 has validated and hardened MVP 0.2.

## MVP 0.2 Final Review files created or updated

- `docs/derived/MVP_0.2_FINAL_REVIEW.md`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/`

## MVP 0.2 Final checks

- `corepack pnpm --filter @netrunner/server test`: pass, 7 Multiplayer tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- Multiplayer server health smoke: pass on `http://127.0.0.1:8787/health`.
- REST/WebSocket smoke: pass for create, join, host WebSocket, runner WebSocket, Corp mandatory action, and Runner hidden-info leak scan.
- Next web smoke: pass on `http://127.0.0.1:3000`.

## MVP 0.2 Final gate

`MVP_0.2_done: true`

## Post-MVP 0.2 roadmap planning files created or updated

- `docs/derived/POST_MVP_0.2_ROADMAP.md`
- `docs/derived/MVP_0.3_DETAILED_PLAN.md`
- `docs/derived/MVP_0.4_DETAILED_PLAN.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Roadmap nach MVP 0.2.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Projektueberblick.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`
- `docs/codex/CODEX_STATUS.md`

## Post-MVP 0.2 roadmap decision

V0.3 is the AI and simulation phase: Runner AI, improved Corp AI, AI-vs-AI, controller model, explanation mode, simulation tests and AI visibility gates.

Card pool and rules breadth move to V0.4. V0.3 does not expand cards, official mechanics, platform features or deckbuilding.

## MVP 0.4 planning decision

V0.4 is the controlled card pool and rules breadth phase, gated by V0.3. It should start with a safe internal card batch and restricted deck validation, then add Tags as the preferred first new rule family. Damage is planned only as a separate sub-gate or V0.4.x because it touches hidden information, RandomDrawRecords, Undo barriers and AI visibility.

V0.4 remains limited to internal fictional demo cards. Official card pools, external card database dependencies, official art, card frames, card backs, public platform features and free deckbuilding remain out of scope.

## MVP 0.3 Requirements files created or updated

- `docs/derived/MVP_0.3_REQUIREMENTS.md`
- `docs/derived/AI_CONTROLLER_SPEC.md`
- `docs/derived/AI_SIMULATION_TEST_MATRIX.md`
- `docs/derived/MVP_0.3_REQUIREMENTS_REVIEW.md`
- `data/rules/rules-baseline-0.3.json`
- `data/scenarios/ai-runner-steals-rd-agenda.json`
- `data/scenarios/ai-corp-scores-remote-agenda.json`
- `data/scenarios/ai-vs-ai-smoke-replay.json`
- `tests/specs/ai-simulation-acceptance-tests.todo.md`

## MVP 0.3 Implementation files created or updated

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/index.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/api/game/route.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `docs/derived/MVP_0.3_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.3_FINAL_REVIEW.md`

## MVP 0.3 Final checks

- `corepack pnpm --filter @netrunner/ai test`: pass, 8 AI tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 11 tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 35 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.

## MVP 0.3 Final gate

`MVP_0.3_done: true`

`ready_for_MVP_0.4_requirements: true`

## Phase 2 implemented scope

- Deterministic `createGame` with fixed Demo-Decks, seed, RandomCounter and RandomDrawRecords.
- Engine API: `getLegalActions`, `applyAction`, `getPlayerView`, `validateGameState`, `checkWinConditions`, `replayEvents`, `hashState`.
- LegalAction/PlayerAction revalidation for side, StateVersion and current legal action.
- Runner and Corp basic actions, install/play/advance/score/end turn.
- Run, ICE rez, encounter, breaker pump/break, ETR, access, agenda steal, asset trash path.
- Agenda win condition with explicit demo target `agendaPointsToWin = 6`.
- Side-filtered PlayerViews and PublicEvents.
- Deterministic Corp-KI over LegalActions and Corp PlayerView.
- Minimal local Next.js UI for Human Runner vs Corp-KI.

## Important Phase 1 assumptions

- Demo games use `agendaPointsToWin = 6` because the fixed Corp demo deck contains three 2-point agendas.
- Mulligan, Jack-out, Multiaccess, Tags, Trace, Damage, Viren, Hosting, Prevention, Replacement and Interrupts are documented deviations, not MVP-0.1 implementation scope.
- Concrete scenario StateHashes are generated and frozen during Phase 2 after the first green replay implementation.
- MVP 0.2 was read only for future compatibility and did not expand MVP 0.1 scope.

## Blockers

No MVP-0.1 blocker remains.

Remaining known limits:

- JSON-File-Storage is intentionally simple; SQLite remains a later hardening target.
- Localhost operation is the supported private MVP path. HTTPS/WSS are required outside localhost.
- Public platform features, matchmaking, accounts, deckbuilder, chat and broad card pool remain out of scope.
- V0.4 requirements are the next active gate. Damage remains deferred to a V0.4.x sub-gate unless explicitly re-scoped after the safe-card and tag gates.

## Local tool notes

- Node target files exist: `.nvmrc` and `.node-version` both specify `24`.
- Root `package.json` declares `pnpm@10.33.2` via `packageManager`.
- If `pnpm` is not directly on PATH, use `corepack pnpm ...`.

## Next step

Start MVP 0.4 Requirements Freeze from `docs/derived/MVP_0.4_DETAILED_PLAN.md`, constrained to Safe Card Batch, restricted deck validation and Tags; keep Damage deferred.
