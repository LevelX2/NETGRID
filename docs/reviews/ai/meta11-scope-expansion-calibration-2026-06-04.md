# META 11 Scope Expansion + Calibration

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-production-readiness-automation-process-2026-06-04.md`

## Ziel

META 11 erweitert die begrenzte Produktivsetzung scope-by-scope. Es gibt keine Bulk-Aktivierung. Pro Iteration darf höchstens ein neuer Scope produktiv dazukommen.

## Kandidatenreihenfolge

```text
basic_install
simple_rez
remote_contest
access_trash_steal
trace_payment
damage_prevention
multi_target_multi_ability
```

## Ergebnis

Vor META 11 produktiv:

```text
basic_economy_draw
tag_removal
simple_score_advance
```

Nach META 11 produktiv:

```text
basic_economy_draw
tag_removal
simple_score_advance
basic_install
```

Neuer Scope: `basic_install`.

## Scope-Dossiers

| Scope | Status vorher | Zielstatus | Entscheidung |
| --- | --- | --- | --- |
| `basic_install` | `production_shadow_stable` | `limited_scoped_production_active` | `promote_one_scope` |
| `simple_rez` | `internal_canary_ready` | `production_shadow_stable` | `ready_but_not_activated` |
| `remote_contest` | `agreement_ready` | `agreement_ready` | `blocked_by_calibration` |
| `trace_payment` | `blocked` | `blocked` | `blocked_scope` |

`remote_contest` bleibt durch `remote_target_scoring_calibration_open` blockiert.

## Kalibrierung

| Finding | Scope | Kategorie | Count | Status |
| --- | --- | --- | ---: | --- |
| `meta11-basic-install-goal-priority` | `basic_install` | `bad_goal_priority` | 0 | `clear` |
| `meta11-basic-install-risk-weight` | `basic_install` | `bad_risk_weight` | 0 | `clear` |
| `meta11-simple-rez-credit-reserve` | `simple_rez` | `too_costly` | 1 | `followup_created` |
| `meta11-remote-contest-target-choice` | `remote_contest` | `bad_target_choice` | 2 | `blocked` |

## Regression Suite

Abgedeckt sind:

```text
hidden_info_guard
illegal_action_guard
rollback_guard
engine_reject_guard
agreement_only_guard
scoped_override_guard
legacy_fallback_guard
trace_scrubber_guard
determinism_guard
goal_persistence_guard
```

## Quality Gates

| Gate | Wert |
| --- | ---: |
| hardGateFailures | 0 |
| unsafeDivergenceCount | 0 |
| knownBadDecisionCount | 0 |
| humanReviewOpenCount | 0 |
| traceCompleteRate | 1 |
| rollbackTested | true |
| semanticDecisionAvailableRate | 0.92 |
| blockedByGapRate | 0.02 |
| multiRunMetricsStable | true |
| oneNewScopeActivated | true |
| bulkActivationCount | 0 |

## Go/No-Go

Ergebnis: `one_scope_promoted`.

Nicht erlaubt:

```text
bulk_activation
full_production
legacy_removal
```

## Grenzen

- Nur `basic_install` wird neu produktiv.
- `simple_rez` bleibt vorbereitet, aber nicht aktiviert.
- `remote_contest` bleibt blockiert.
- Komplexe Scopes bleiben blockiert.
- Legacy-Fallback und Rollback bleiben verfügbar.

## Nächster Schritt

META 12 stabilisiert die ausgewählten produktiven Scopes und prüft, ob Legacy-Freeze für diese Scopes erlaubt ist. Freeze bedeutet nicht Removal.
