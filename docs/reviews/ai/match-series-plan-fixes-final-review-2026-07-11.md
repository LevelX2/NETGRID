# Match Series Plan Fixes Final Review

## Scope

This review closes the approved findings from side-swap series
`series_d4f165eede0924ae`:

- `match_d8789ce16cb4e809`, Runner AI, Runner won 8-5;
- `match_f38d5ae3588344de`, Corp AI, Runner won 7-1.

The games ran on a server process started at 18:24, before the later same-day
AI commits. Historical SQLite state was used read-only and was not modified.

## Closed Findings

### Series trace inheritance

`startNextSeriesGame` now carries the first game's normalized `aiTraceMode`
into the second `createMatch` call. The regression covers `summary`,
`detailed`, and `off` across the actual Human-vs-AI side swap.

### Fundable matchpoint run

A central run receives a bounded matchpoint conversion boost when all of these
side-safe facts hold:

- the Runner needs at most one agenda point;
- the central access is unknown or currently useful;
- the known path is short of credits;
- basic funding and the run still fit into the remaining clicks.

The plan keeps its existing `gain_credits` step. The new priority applies to
the complete plan, not to a display score or a fabricated run action. A
counterexample confirms that an unfundable same-turn path receives no boost.

### Pressured central before speculative remote layering

Two successful R&D accesses plus a missing effective first layer now interrupt
additional protection for an empty, already layered remote whose agenda still
resides in HQ. The existing Corp ICE placement evaluator remains responsible
for determining whether the central ICE is concrete protection.

An installed agenda and an immediate scoreline conversion remain exempt. The
existing unsafe-agenda and effective-remote-protection contracts remain green.

### Extra-action follow-up value

An expensive operation that gains actions no longer escapes a high or critical
board triage as a neutral action. If the burst is not already mapped to direct
plan progress and its basic extra-action return does not cover its credit cost,
the score includes `corp_unbacked_extra_action_burst` with explicit evidence.

Cheap self-funding bursts and action bursts already bound to scoreline or other
urgent progress are not penalized by this component.

## Non-Findings

- Repeated late Corp draw remained outside this correction because searching
  for an agenda behind a prepared remote was not proven wrong by the replay.
- Junkyard BBS is recursion, not persistent economy; the first match did not
  establish a mandatory activation opportunity.
- The late Broker should not have been charged for a long horizon at matchpoint;
  the corrected defect was installing it ahead of the fundable winning run.

## Verification

- Integrated focused run: 7 files, 367 tests passed.
- Full `@netgrid/ai` run: 288 files, 1,893 tests passed.
- `@netgrid/ai` typecheck passed.
- `@netgrid/server` typecheck passed.
- `git diff --check` passed.

The first full AI invocation hit a three-minute command timeout without a test
failure. The isolated rerun completed in 220.60 seconds and passed completely.

## Runtime Note

No running server or web process was stopped or restarted during this work.
A new manual playtest only validates these contracts after the normal NETGRID
start script has reloaded the merged code.
