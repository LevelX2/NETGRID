# META 17 Semantic Default for Eligible Scopes

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-meta13-meta18-takeover-automation-process-2026-06-04.md`

## Ziel

META 17 macht Semantic für eligible Scopes zum Default-Entscheider. Legacy bleibt Notfall-Fallback. Nicht eligible Scopes bleiben Legacy-only.

## Eligible Semantic Default Scopes

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

## Nicht Eligible

```text
simple_advance_score
basic_setup_install
access_trash_steal
trace_payment
damage_prevention
multi_target_multi_ability
```

## Runtime-Regel

```text
if scope in eligibleSemanticDefaultScopes
and semanticActionId in EngineLegalActions
and all gates pass
and rollback not forced
then actualDecision = semanticDecision
else actualDecision = legacyDecision
```

## Guard-Ergebnisse

| Fixture | Ergebnis |
| --- | --- |
| `meta17-basic-economy-default` | `semantic_default_actual` |
| `meta17-remote-contest-default` | `semantic_default_actual` |
| `meta17-trace-payment-legacy-only` | `scope_not_eligible_legacy` |
| `meta17-semantic-not-legal` | `semantic_not_legal_legacy` |
| `meta17-rollback-forced` | `rollback_forced_legacy` |

## Quality Gates

| Gate | Wert |
| --- | --- |
| previousSemanticDefaultScopeCount | 0 |
| semanticDefaultScopeCount | 8 |
| legacyFallbackShareTrend | down |
| rollbackWorks | true |
| engineRejectCount | 0 |
| hiddenInfoViolationCount | 0 |
| unsafeDivergenceCount | 0 |
| publicPayloadDeltaCount | 0 |
| determinismFailureCount | 0 |
| performanceWithinLimit | true |

## Go/No-Go

Ergebnis: `semantic_default_for_eligible_scopes`.

Nächster Schritt: `META18_legacy_retirement_full_takeover_decision`.

Nicht erlaubt:

```text
full_legacy_removal
semantic_default_for_blocked_scopes
fallback_removed
```

## Grenzen

- Semantic Default gilt nur für eligible Scopes.
- Rollback schlägt Semantic Default.
- Nicht Engine-legale semantische Actions fallen auf Legacy zurück.
- Legacy-Fallback bleibt verfügbar.
