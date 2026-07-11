# Match Series Plan Fixes Process

Status: complete

## Source

The two-game side-swap series `series_d4f165eede0924ae` exposed four independent defects:

- game two did not inherit detailed AI trace persistence;
- a one-credit matchpoint run was displaced by Broker development;
- speculative remote protection displaced the first effective R&D layer;
- an extra-action operation won without a profitable downstream sequence.

## Goal Check

The end state is precise: each defect receives a source-level correction, a realistic regression based on the observed game state, a focused commit, and final verification before local integration into `main`.

## Overall Goal

Implement the four approved corrections without card-name special cases, hidden information, client-only score repair, or bypasses around `LegalActions` and the Rules Engine.

## Assumptions

- Historical runtime data remains read-only evidence and is not migrated.
- The running server is not restarted during implementation.
- Existing post-match fixes for unsafe agenda exposure and effective remote protection remain authoritative and receive compatibility coverage where the new tests overlap them.

## Non-Goals

- No global retuning of every plan or semantic score.
- No changes to match results or stored SQLite data.
- No changes to Runner or Corp rules legality.
- No benchmark claim based only on the two historical games.

## Controller Invariants

- AI consumes only side-safe `PlayerView`, side-filtered events, `LegalActions`, and allowed metadata.
- Plan selection may only map to existing legal actions.
- Matchpoint urgency changes plan priority, not action legality or run costs.
- ICE placement remains owned by the existing Corp ICE placement evaluator.
- Extra-action value must be backed by concrete legal follow-up actions.

## Automatic Error Handling

- A red focused test blocks the current package.
- Existing unrelated failures are documented and isolated before continuing.
- Conflicts with newer `main` changes are resolved by preserving both compatible intentions.

## Safety Blockers

Stop if a correction would require hidden Runner grip/stack data, fabricated legal actions, full `GameState` in AI code, or a client-side display-only score override.

## State Machine

`preflight -> trace inheritance -> matchpoint funding -> defense allocation -> extra-action projection -> integrated verification -> main merge -> complete`

Exactly one package is active at a time.

## Package Sequence

### Package 1: Series Trace Inheritance

- Pass the normalized trace mode into game two creation.
- Test detailed, summary, and off behavior across a side swap.
- Done gate: server regression, typecheck if affected, `git diff --check`, commit.
- Commit: `fix(server): preserve AI traces across match series`

### Package 2: Matchpoint Run Funding

- Raise a concrete, bounded funding step for an unknown-payoff central run when that access can win the game.
- Ensure long-term economy development does not displace the sequence.
- Add a counterexample where the remaining clicks cannot fund and run.
- Done gate: focused tactical-plan/runtime tests, AI typecheck, `git diff --check`, commit.
- Commit: `fix(ai): prioritize fundable matchpoint runs`

### Package 3: Central First-Layer Defense

- Prevent a hypothetical HQ agenda scoreline from demanding second or later remote ICE while a pressured central lacks an effective first layer.
- Preserve active same-turn and concrete installed-agenda score windows.
- Keep placement comparison in the Corp ICE placement evaluator.
- Done gate: board-triage and ICE-placement regressions, AI typecheck, `git diff --check`, commit.
- Commit: `fix(ai): protect pressured centrals before remote layering`

### Package 4: Extra-Action Follow-Up Value

- Require a concrete profitable follow-up sequence before an extra-action operation can escape plan mismatch.
- Preserve score, kill, and other high-value action-burst conversions.
- Add the observed four-credit-for-one-basic-credit counterexample.
- Done gate: focused semantic-runtime tests, AI typecheck, `git diff --check`, commit.
- Commit: `fix(ai): bind extra actions to profitable follow-ups`

### Package 5: Integrated Regression And Evidence

- Run the focused suites together and relevant broader server/AI checks.
- Record the two match IDs, root causes, corrections, limitations, and checks in a review artifact.
- Confirm current unsafe-agenda and effective-protection tests still pass.
- Done gate: clean worktree, final evidence commit, current `main` integrated, final checks green.
- Commit: `docs(ai): close match series plan fixes`

## Worktree And Git Rules

- Worktree: `C:\Projekte\NETGRID_AI_MATCH_SERIES_PLAN_FIXES`
- Branch: `codex/match-series-plan-fixes-20260711`
- Main workspace is used only for final integration.
- Each completed package is committed separately.
- No push or pull request.

## Goal

`/Goal Arbeite Match Series Plan Fixes vollstaendig und sequenziell von Package 1 bis Package 5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, packages/ai/AGENTS.md und dieses Prozessartefakt. Arbeite ausschliesslich im angegebenen Worktree und immer nur am aktuellen Paket. Fuehre Paketchecks aus, committe jedes abgeschlossene Paket und stoppe bei einem Sicherheitsblocker. Integriere vor dem finalen Merge aktuelles main, verifiziere erneut, merge lokal nach main und markiere das Goal erst danach als complete.`

## Completion Criteria

- All four source-level defects are corrected generically.
- Realistic positive and negative regressions are green.
- No hidden-information, legality, replay, or score-display workaround was introduced.
- Every package has a commit.
- The branch is locally integrated into `main` and the worktree is removed cleanly.
