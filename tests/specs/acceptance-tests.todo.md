# Acceptance Tests TODO MVP 0.1

Status: derived in Phase 1, to be implemented in Phase 2.

## Gate Tests

- [ ] AC-001 / T-BASE-001: RulesBaseline `26.03` and schema versions `0.1.0` are present in GameState and events.
- [ ] AC-002 / T-SETUP-001: same seed creates identical game setup, hands, deck order, RandomDrawRecords and StateHash.
- [ ] AC-003 / T-ACTION-001..005: LegalActions are side/timing/cost valid and manipulated PlayerActions are rejected.
- [ ] AC-004 / T-ACTION-006, T-TURN-001..003: basic actions, turn flow, play/install/advance/score/end turn work.
- [ ] AC-005 / SCN-001..004: unprotected run, protected breaker run, ETR-fail run and Corp remote score scenario pass.
- [ ] AC-006 / T-ACCESS-001..003: HQ, R&D, Archives and Remote breach/access behavior passes.
- [ ] AC-007 / T-WIN-001..002: Runner and Corp agenda wins at configured demo target pass.
- [ ] AC-008 / T-EVENT-001: every successful transition emits stateVersionBefore/After and stateHashAfter.
- [ ] AC-009 / T-REPLAY-001 / SCN-006: replay reproduces final StateHash.
- [ ] AC-010 / T-VIS-001..006 / SCN-005: PlayerViews, PublicEvents, AI input, errors, UI and replay leak no hidden data.
- [ ] AC-011 / T-AI-001..003: Corp AI uses only LegalActions and survives 100 test turns.
- [ ] AC-012 / T-CARD-* tests: every `playable_mvp` card has unit and scenario/integration coverage.
- [ ] AC-013 / T-E2E-001: a Human Runner can complete a local demo game against Corp AI.

## Scenario Fixtures

- [ ] `data/scenarios/runner-steals-rd-agenda.json`
- [ ] `data/scenarios/runner-breaks-ice-and-accesses-rd.json`
- [ ] `data/scenarios/runner-fails-on-end-the-run.json`
- [ ] `data/scenarios/corp-scores-remote-agenda.json`
- [ ] `data/scenarios/visibility-runner-view-no-corp-leak.json`
- [ ] `data/scenarios/replay-full-demo-game-statehash.json`

## Quality Commands

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
