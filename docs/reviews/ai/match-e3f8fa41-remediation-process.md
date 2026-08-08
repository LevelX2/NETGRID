# Match e3f8fa41 – Remediation Process

Status: in implementation  
Source: human Corp vs. Runner AI match `match_e3f8fa4143e28391`

## Goal

Correct the confirmed rules/UI and Runner-continuation defects from the match
without introducing a second AI decision authority. Implement in
`C:\Projekte\NETGRID_MATCH_E3F8_REMEDIATION` on
`codex/match-e3f8-remediation`, then merge locally into `main`.

## Scope

1. Archives must not open a decision window for an inactive
   `delayed_agenda_access_replacement` card such as Bizarre Encryption Scheme.
2. The Corp's Social Engineering guess options must be exactly `2` through the
   Runner's available credits.
3. A Runner-visible, engine-certified pending targeted bypass must remain in
   the active run projection so `runner.convert_run_window` can continue the
   existing `runner.pressure_central` run. The plan, executor, action ID and
   target binding remain unchanged.
4. Maintenance match detail provides a compact copy control for the complete
   match ID.

## Non-goals

- No HQ-cadence heuristic change.
- No new plan, resolver, fallback, or AI action generation.
- No server, database, replay, or production-data changes.
- No complete workspace or AI-shard run in this change; the user schedules
  that combined run independently.

## Packages

| Package | Work | Done gate |
| --- | --- | --- |
| P1 | Correct Archives decision gating and Social guess range. | Focused Engine tests demonstrate automatic Archives processing and `2..credits` choices. |
| P2 | Project the exact pending auto-pass ICE to Runner PlayerView and preserve the existing run continuation. | Focused Engine projection and AI runtime tests prove `continue_run`, ownership and the no-bypass countercase. |
| P3 | Add match-ID copy affordance in Maintenance detail. | Focused web test or static component test covers complete copied ID. |

Each completed package receives a focused test run, `git diff --check`, and a
separate commit. Before final integration, current `main` is merged into the
work branch if it advanced. The worktree and branch are removed only after a
successful local `main` merge and verified cleanup.
