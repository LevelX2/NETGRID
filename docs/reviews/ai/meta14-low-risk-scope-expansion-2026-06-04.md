# META 14 Low-Risk Scope Expansion

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-meta13-meta18-takeover-automation-process-2026-06-04.md`

## Ziel

META 14 erweitert die produktive Semantic AI konservativ um Low-Risk-Scopes. Höchstens ein neuer Scope darf produktiv aktiviert werden. `simple_rez` ist der einzige neue produktive Scope. `simple_run_choice` bleibt Kandidat ohne Produktivaktivierung. `remote_contest` wird target-kalibriert, aber nicht produktiv aktiviert.

## Candidate Order

```text
1. simple_rez
2. simple_run_choice
3. remote_contest
```

## Active Production Scopes

Vor META 14:

```text
basic_economy_draw
tag_removal
simple_score_advance
basic_install
```

Nach META 14:

```text
basic_economy_draw
tag_removal
simple_score_advance
basic_install
simple_rez
```

## Dossiers

| Scope | Input | Output | Productive | Decision |
| --- | --- | --- | --- | --- |
| `simple_rez` | `production_shadow_stable` | `limited_scoped_production_active` | true | `activate_one_scope` |
| `simple_run_choice` | `internal_canary_ready` | `limited_candidate` | false | `candidate_not_activated` |
| `remote_contest` | `agreement_ready` | `agreement_ready` | false | `calibrated_not_productive` |

## Kalibrierung

| Scope | Finding | Status |
| --- | --- | --- |
| `simple_rez` | `simple_rez_credit_reserve` | `clear` |
| `simple_run_choice` | `simple_run_choice_reviewed_legacy_preferred` | `candidate_requires_more_review` |
| `remote_contest` | `remote_target_scoring_calibration` | `calibrated` |

`remote_contest` bleibt ausdrücklich side-safe: keine verdeckte Remote-Identität wird geraten oder aus FullState abgeleitet.

## Quality Gates

| Gate | Wert |
| --- | --- |
| oneNewScopeActivatedAtMost | true |
| bulkActivationCount | 0 |
| humanReviewOpenCount | 0 |
| unsafeDivergenceCount | 0 |
| engineRejectCount | 0 |
| hiddenInfoViolationCount | 0 |
| knownBadDecisionCount | 0 |
| multiRunMetricsStable | true |
| rollbackTested | true |

## Go/No-Go

Ergebnis: `simple_rez_limited_scoped_production_active`.

Weitere Entscheidungen:

```text
simple_run_choice = limited_candidate_not_activated
remote_contest = agreement_ready_not_productive
```

Nächster Schritt: `META15_complex_scope_enablement`.

Nicht erlaubt:

```text
bulk_activation
remote_contest_productive_without_target_review
complex_scope_activation
legacy_removed
```
