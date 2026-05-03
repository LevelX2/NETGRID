# CODEX_STATUS

## Current phase

MVP 0.1 implementation may start.

## Status

Phase 1, MVP 0.1 executable requirements, is complete and reviewable.

`ready_for_implementation: true`

No Engine, UI, Server, AI, or executable test implementation has been written in Phase 1. The work so far is limited to derived documentation, versioned data artifacts, scenario fixtures, the acceptance-test TODO, Codex status, and project knowledge/status logs.

## Goal

Active thread goal: Netrunner gated MVP delivery.

Gate flow:

1. MVP 0.1 executable requirements: pass.
2. MVP 0.1 implementation: next.
3. MVP 0.1 validation, hardening and documentation: pending.
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

## Important Phase 1 assumptions

- Demo games use `agendaPointsToWin = 6` because the fixed Corp demo deck contains three 2-point agendas.
- Mulligan, Jack-out, Multiaccess, Tags, Trace, Damage, Viren, Hosting, Prevention, Replacement and Interrupts are documented deviations, not MVP-0.1 implementation scope.
- Concrete scenario StateHashes are generated and frozen during Phase 2 after the first green replay implementation.
- MVP 0.2 was read only for future compatibility and did not expand MVP 0.1 scope.

## Blockers

No Phase-1 blocker remains.

Implementation blockers to watch during Phase 2:

- Hidden-info filtering must be implemented early and tested continuously.
- Run/Encounter/Access state machine is the highest complexity area.
- The 6-point demo win condition must remain explicit until deck composition changes.

## Local tool notes

- Node target files exist: `.nvmrc` and `.node-version` both specify `24`.
- Root `package.json` declares `pnpm@10.33.2` via `packageManager`.
- If `pnpm` is not directly on PATH, use `corepack pnpm ...`.

## Next step

Start Phase 2: implement MVP 0.1 only, using the derived artifacts as the active implementation source. Do not start MVP 0.2 until MVP 0.1 validation and hardening gates pass.
