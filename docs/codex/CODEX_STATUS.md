# CODEX_STATUS

## Current phase

MVP 0.1 validation, hardening and documentation may start.

## Status

Phase 1, MVP 0.1 executable requirements, is complete and committed.

`ready_for_implementation: true`

Phase 2, MVP 0.1 implementation, is implemented and locally verified.

`ready_for_hardening: true`

## Goal

Active thread goal: Netrunner gated MVP delivery.

Gate flow:

1. MVP 0.1 executable requirements: pass.
2. MVP 0.1 implementation: pass.
3. MVP 0.1 validation, hardening and documentation: next.
4. MVP 0.2 requirements and implementation: blocked until MVP 0.1 gate passes.

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

No Phase-2 blocker remains.

Hardening risks to watch during Phase 3:

- Hidden-info filtering must be implemented early and tested continuously.
- Run/Encounter/Access state machine is the highest complexity area.
- The 6-point demo win condition must remain explicit until deck composition changes.

## Local tool notes

- Node target files exist: `.nvmrc` and `.node-version` both specify `24`.
- Root `package.json` declares `pnpm@10.33.2` via `packageManager`.
- If `pnpm` is not directly on PATH, use `corepack pnpm ...`.

## Next step

Start Phase 3: validation, hardening, documentation and MVP-0.1 final review. Do not start MVP 0.2 until MVP 0.1 final gate passes.
