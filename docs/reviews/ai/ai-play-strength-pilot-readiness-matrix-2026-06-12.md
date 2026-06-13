# AI Play-Strength Pilot Readiness Matrix 2026-06-12

Status: diagnostic-only, no runtime activation.

AI-MAT3-2 turns broad pilot eligibility into an explicit local cutover-readiness
matrix. The matrix is produced by `SemanticShadowLeagueReport.metrics` and keeps
separate counts for:

- `candidate`
- `allowed`
- `wouldOverride`
- `actualOverride`
- `safeToEnableLocally`
- `recommendedForDefaultOffPilot`
- `blockedByInsufficientCorpus`
- `blockedByTargetChoice`
- `blockedByDoctrineConflict`
- `blockedByRisk`

## Current Matrix

| Scope | Candidate | Allowed | Would override | Actual override | Recommendation | Main blocker |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `basic_setup` | 50 | 22 | 22 | 0 | `default_off_candidate` | No runtime consumer; separate local-default report still required. |
| `runner_safe_access` | 50 | 18 | 18 | 0 | `default_off_candidate` | No runtime consumer; separate local-default report still required. |
| `corp_score_window` | 50 | 3 | 3 | 0 | `keep_env_gated` | Corpus support is still below the readiness floor. |
| `remote_contest_report_only` | 2 | 2 | 0 | 0 | `report_only` | Target-choice and remote-risk readiness are not closed. |
| `target_choice_shadow_only` | 0 | 0 | 0 | 0 | `report_only` | Shadow-only until TargetChoice coverage is expanded. |

## Interpretation

High pilot eligibility is not treated as runtime activation. The report keeps
`actualOverride` at 0 and marks only `basic_setup` and `runner_safe_access` as
default-off candidates. They remain env-gated until the separate local default
candidate reports close the operational review. The next maturity step is better
evidence: target-choice coverage, doctrine-goal coverage, remote-contest
readiness, and larger focused corp-score window corpus coverage.

## Not Changed

- No pilot default was enabled.
- No runtime consumer was added.
- No Engine, LegalAction, `applyAction`, Replay, StateHash, Randomness or
  Hidden-Info contract changed.
- Remote contest and target choice remain report-only.
