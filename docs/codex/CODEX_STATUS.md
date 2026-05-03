# CODEX_STATUS

## Current phase

MVP 0.6 deck editor and match setup is complete. V0.6 QA card readability and event-log hardening is complete.

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

MVP 0.4 requirements, implementation, validation and documentation are complete.

`MVP_0.4_done: true`

`ready_for_next_scope_decision: true`

MVP 0.5 card import and catalog requirements are complete.

`ready_for_implementation: true`

MVP 0.5 card import and catalog implementation is complete and locally verified.

`ready_for_hardening: true`

MVP 0.5 validation, hardening and documentation are complete.

`MVP_0.5_done: true`

`ready_for_MVP_0.6_requirements: true`

MVP 0.6 deck editor and match setup requirements are complete.

`ready_for_implementation: true`

MVP 0.6 deck editor and match setup implementation, validation, hardening and documentation are complete.

`MVP_0.6_done: true`

V0.6 QA hardening for visible card text, known-card tooltips and public event-log card explanations is complete.

`ready_for_V0.7_requirements: true`

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
10. MVP 0.4 requirements: pass.
11. MVP 0.4 implementation and validation: pass.
12. MVP 0.5 executable requirements: pass.
13. MVP 0.5 implementation: pass.
14. MVP 0.5 validation, hardening and documentation: pass.
15. MVP 0.6 executable requirements: pass.
16. MVP 0.6 implementation and validation: pass.
17. V0.6 QA card readability and event-log hardening: pass.

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

## MVP 0.4 Requirements files created or updated

- `docs/derived/MVP_0.4_REQUIREMENTS.md`
- `docs/derived/CARD_POOL_0.4_SPEC.md`
- `docs/derived/RULE_MECHANICS_0.4_SPEC.md`
- `docs/derived/DECK_VALIDATION_0.4_SPEC.md`
- `docs/derived/MVP_0.4_TEST_MATRIX.md`
- `docs/derived/MVP_0.4_REQUIREMENTS_REVIEW.md`
- `data/rules/rules-baseline-0.4.json`
- `data/cards/demo-cards-0.4.json`
- `data/decks/demo-decks-0.4.json`
- `data/manifests/card-implementation-manifest-0.4.json`
- `data/deviations/rule-deviations-0.4.json`
- `data/scenarios/v04-safe-card-batch-smoke.json`
- `data/scenarios/v04-tag-runner-and-remove-tag.json`
- `data/scenarios/v04-tag-punishment-blocked-when-untagged.json`
- `data/scenarios/v04-expanded-deck-ai-vs-ai-smoke.json`
- `tests/specs/card-pool-0.4-acceptance-tests.todo.md`

## MVP 0.4 Implementation files created or updated

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/http-server.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/derived/MVP_0.4_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.4_FINAL_REVIEW.md`

## MVP 0.4 Final checks

- `corepack pnpm --filter @netrunner/engine test`: pass, 15 Engine tests.
- `corepack pnpm --filter @netrunner/ai test`: pass, 10 AI tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 42 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.

## MVP 0.4 Final gate

`MVP_0.4_done: true`

`ready_for_next_scope_decision: true`

## MVP 0.5 Requirements files created or updated

- `docs/derived/MVP_0.5_REQUIREMENTS.md`
- `docs/derived/CARD_IMPORT_0.5_SPEC.md`
- `docs/derived/CARD_CATALOG_0.5_SPEC.md`
- `docs/derived/CARD_STATUS_0.5_SPEC.md`
- `docs/derived/MVP_0.5_TEST_MATRIX.md`
- `docs/derived/MVP_0.5_REQUIREMENTS_REVIEW.md`
- `data/card-import/source-registry-0.5.json`
- `data/card-import/card-snapshot-0.5.json`
- `data/card-import/card-snapshot-0.5.hash`
- `data/card-import/import-report-0.5.json`
- `data/card-import/catalog-index-0.5.json`
- `data/manifests/card-catalog-status-0.5.json`
- `tests/specs/card-import-0.5-acceptance-tests.todo.md`
- `tests/specs/phase1-artifacts.test.ts`

## MVP 0.5 Requirements checks

- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 9 artifact tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 42 package tests plus 11 root spec tests.
- `corepack pnpm build`: pass.

## MVP 0.5 Requirements gate

`ready_for_implementation: true`

V0.5 uses only local versioned demo/project data and fiktive local catalog fixtures. Import remains catalog/status-only: no import path can make a card engine-playable, KI-usable, deck-legal or match-startable without the existing manifest, resolver, tests, Visibility, Replay/StateHash and KI-Smoke gates.

## MVP 0.5 Implementation files created or updated

- `packages/catalog/AGENTS.md`
- `packages/catalog/package.json`
- `packages/catalog/tsconfig.json`
- `packages/catalog/src/index.ts`
- `packages/catalog/src/index.test.ts`
- `apps/web/app/api/cards/catalog-data.ts`
- `apps/web/app/api/cards/catalog/route.ts`
- `apps/web/app/api/cards/catalog/[id]/route.ts`
- `apps/web/app/api/cards/status-summary/route.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/package.json`
- `tests/specs/visibility-contract.test.ts`
- `docs/derived/MVP_0.5_IMPLEMENTATION_REVIEW.md`
- `pnpm-lock.yaml`
- updated V0.5 snapshot hash and derived catalog artifacts after German UI text cleanup

## MVP 0.5 Implementation checks

- `corepack pnpm install`: pass.
- `corepack pnpm --filter @netrunner/catalog test`: pass, 5 Catalog tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass, 12 root spec tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 47 package tests plus 12 root spec tests.
- `corepack pnpm build`: pass.
- Catalog API smoke on `http://127.0.0.1:3000/api/cards/catalog?status=blocked`: pass.
- Catalog detail smoke on `http://127.0.0.1:3000/api/cards/catalog/catalog_preview_operation_001`: pass.
- Browser catalog smoke on `http://127.0.0.1:3000`: pass.

## MVP 0.5 Implementation gate

`ready_for_hardening: true`

The implementation preserves the V0.5 safety boundary: catalog data is read-only and public-by-design, import-only cards stay non-playable, and no Engine, AI, deck-validation or match-start path consumes imported cards automatically.

## MVP 0.5 Final Review files created or updated

- `docs/derived/MVP_0.5_FINAL_REVIEW.md`
- `docs/derived/MVP_0.5_IMPLEMENTATION_REVIEW.md`
- `README.md`
- `tests/specs/card-import-0.5-acceptance-tests.todo.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/`

## MVP 0.5 Final checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 47 package tests plus 12 root spec tests.
- `corepack pnpm build`: pass.
- Catalog API smoke: pass.
- Catalog API hidden-info/token leak scan: pass.
- Browser catalog smoke: pass on `http://127.0.0.1:3000`.

## MVP 0.5 Final gate

`MVP_0.5_done: true`

`ready_for_MVP_0.6_requirements: true`

## MVP 0.6 Requirements files created or updated

- `docs/derived/MVP_0.6_REQUIREMENTS.md`
- `docs/derived/DECK_EDITOR_0.6_SPEC.md`
- `docs/derived/DECK_VALIDATION_0.6_SPEC.md`
- `docs/derived/MATCH_SETUP_0.6_SPEC.md`
- `docs/derived/DECK_STORAGE_0.6_SPEC.md`
- `docs/derived/MVP_0.6_TEST_MATRIX.md`
- `docs/derived/MVP_0.6_REQUIREMENTS_REVIEW.md`
- `data/decks/deck-format-profiles-0.6.json`
- `data/decks/deck-templates-0.6.json`
- `data/decks/deck-snapshots-0.6.json`
- `data/manifests/deck-validation-manifest-0.6.json`
- `tests/specs/deck-editor-0.6-acceptance-tests.todo.md`
- `tests/specs/phase1-artifacts.test.ts`

## MVP 0.6 Requirements checks

- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 12 artifact tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 47 package tests plus 15 root spec tests.
- `corepack pnpm build`: pass.

## MVP 0.6 Requirements gate

`ready_for_implementation: true`

V0.6 starts from V0.5 catalog status and versioned demo decks. The requirements freeze defines a general deck model, local format profile, immutable deck snapshots, deterministic deck hashes, private opponent decklists by default, server-side match-start revalidation and functional deck editor/match setup scope only.

## V0.6 QA card readability and event-log hardening files updated

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`

## V0.6 QA card readability and event-log hardening checks

- `corepack pnpm install --frozen-lockfile`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 47 package tests plus 16 root spec tests.
- `corepack pnpm build`: pass.
- `git diff --check`: pass, with line-ending warnings only for touched web files.
- Server health smoke on `http://127.0.0.1:8788/health`: pass.
- Next web smoke on `http://127.0.0.1:3000`: pass.
- Event payload smoke: open Corp operations include `cardDefinitionId`; hidden Corp installs stay anonymous.

## V0.6 QA hardening result

Known visible cards now carry display-only rules text and public values in `VisibleCard`. The web UI shows a short card effect on known cards and a hover/focus detail panel with values. Public event-log entries for openly played/revealed cards show the concrete card and effect text via catalog detail lookup. Hidden Corp installs and unknown cards remain anonymized and do not receive card tooltips or effect text.

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
- Damage remains deferred to a V0.4.x sub-gate unless explicitly re-scoped after this final gate.

## Local tool notes

- Node target files exist: `.nvmrc` and `.node-version` both specify `24`.
- Root `package.json` declares `pnpm@10.33.2` via `packageManager`.
- If `pnpm` is not directly on PATH, use `corepack pnpm ...`.

## Next step

The next scope decision is resolved into a product-oriented post-MVP-0.4 roadmap:

- V0.5: card import and card catalog.
- V0.6: deck editor and match setup foundation.
- V0.7: UI redesign and visual design, intentionally delayed because design analyses are still running.
- V0.8: playable base/starter-set slice.
- V0.9: stronger AI.

Next gate: V0.7 Requirements/Design Freeze for the UI redesign and visual design phase.

Detailed planning artifacts available:

- `docs/derived/POST_MVP_0.4_ROADMAP.md`
- `docs/derived/MVP_0.5_DETAILED_PLAN.md`
- `docs/derived/MVP_0.6_DETAILED_PLAN.md`
- `docs/derived/MVP_0.7_DETAILED_PLAN.md`

UI design exploration artifacts available:

- `docs/ui-designsets/README.md`
- `docs/ui-designsets/REALISM_REVIEW.md`
