# META 18 Legacy Retirement / Full Takeover Decision

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-meta13-meta18-takeover-automation-process-2026-06-04.md`

## Ziel

META 18 entscheidet, ob Legacy entfernt, scopeweise retired oder als Fallback behalten wird. Ergebnis: Semantic ist Default für eligible Scopes, aber Legacy bleibt als Fallback erhalten. Legacy Removal ist nicht freigegeben.

## Entscheidung

Gewähltes Modell:

```text
legacy_retained_as_fallback
```

Full-Takeover-Entscheidung:

```text
semantic_default_with_legacy_fallback
```

## Entscheidungsoptionen

| Modell | Status |
| --- | --- |
| `legacy_retained_as_fallback` | `selected` |
| `legacy_retired_for_selected_scopes` | `available_future_option` |
| `full_legacy_retirement_ready` | `blocked_without_signoff` |

## Prerequisites

| Bedingung | Status |
| --- | --- |
| `minimum_observation_duration` | `future_required` |
| `minimum_production_decision_count` | `future_required` |
| `human_signoff_completed` | `blocked` |
| `rollback_replacement_plan` | `blocked` |
| `blocked_scopes_resolved_or_declared_legacy_only` | `future_required` |
| `hard_gates_stable` | `met` |
| `performance_stable` | `met` |
| `determinism_stable` | `met` |

## Scope-Disposition

Semantic Default Scopes:

```text
basic_economy_draw
tag_removal
simple_score_advance
basic_install
simple_rez
simple_run_choice
remote_contest
simple_hq_or_rnd_pressure
```

Legacy-only Scopes:

```text
simple_advance_score
basic_setup_install
access_trash_steal
trace_payment
damage_prevention
multi_target_multi_ability
```

Retirement Candidate Scopes:

```text
basic_economy_draw
tag_removal
simple_score_advance
basic_install
```

Diese Kandidaten werden nicht in META 18 retired, weil kein explizites Human Signoff und kein Rollback-Ersatzplan vorliegen.

## Quality Gates

| Gate | Wert |
| --- | --- |
| legacyRemovalReady | false |
| fallbackReplacementAvailable | false |
| blockedScopesResolvedOrDeclaredLegacyOnly | false |
| humanSignoffRequired | not_requested |
| longRunMetricsStable | true |
| hardGateFailureCount | 0 |
| engineRejectCount | 0 |
| hiddenInfoViolationCount | 0 |
| publicPayloadDeltaCount | 0 |
| unsafeDivergenceCount | 0 |

## Go/No-Go

Ergebnis: `legacy_retained_as_fallback`.

Nicht erlaubt:

```text
legacy_removed
full_legacy_retirement_ready
scopewise_retirement_now
fallback_removed
```

## Folge

Die neue KI hat für eligible Scopes die reguläre Entscheidung übernommen. Die alte KI bleibt als Fallback erhalten. Ein späterer Retirement-Prozess braucht explizites Signoff, längere Beobachtung, ausreichend viele Default-Entscheidungen, einen Rollback-Ersatzplan und eine Entscheidung zu legacy-only Scopes.
