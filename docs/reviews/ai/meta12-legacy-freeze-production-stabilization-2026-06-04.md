# META 12 Legacy Freeze + Production Stabilization

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-production-readiness-automation-process-2026-06-04.md`

## Ziel

META 12 stabilisiert die begrenzte Produktivsetzung und entscheidet, ob Legacy für ausgewählte Scopes eingefroren werden kann. Freeze heißt: Legacy-Heuristiken für diesen Scope werden nicht weiterentwickelt. Legacy bleibt als Fallback-Codepfad erhalten.

## Stabilized Production Scopes

```text
basic_economy_draw
tag_removal
simple_score_advance
basic_install
```

## Freeze-Entscheidung

| Scope | Stable | Decision | Observation Cycles | Production Decisions |
| --- | --- | --- | ---: | ---: |
| `basic_economy_draw` | true | `freeze_ready` | 4 | 148 |
| `tag_removal` | true | `freeze_ready` | 4 | 76 |
| `simple_score_advance` | true | `freeze_ready` | 3 | 84 |
| `basic_install` | true | `freeze_ready` | 2 | 52 |

Alle Freeze-Entscheidungen behalten `legacyFallbackAvailable = true` und `rollbackAvailable = true`.

## Stabilitätsdashboard

| Metrik | Wert |
| --- | ---: |
| productionDecisionCount | 360 |
| semanticDecisionShare | 0.72 |
| legacyFallbackShare | 0.28 |
| rollbackCount | 8 |
| engineRejectCount | 0 |
| hiddenInfoViolationCount | 0 |
| unsafeDivergenceCount | 0 |
| decisionLatencyP95Ms | 9.8 |
| traceScrubPassRate | 1 |
| scopeRegressionStatus | green |

## Expansion Policy

| Scope | Policy |
| --- | --- |
| `basic_economy_draw` | `freeze_legacy_for_scope` |
| `tag_removal` | `freeze_legacy_for_scope` |
| `simple_score_advance` | `freeze_legacy_for_scope` |
| `basic_install` | `freeze_legacy_for_scope` |
| `simple_rez` | `semantic_followup_required` |
| `remote_contest` | `semantic_followup_required` |
| `trace_payment` | `remain_blocked` |
| `damage_prevention` | `remain_blocked` |
| `multi_target_multi_ability` | `remain_blocked` |

## Spätere Legacy-Retirement-Bedingungen

Legacy Removal ist nicht Teil von META 12. Für einen späteren Retirement-Prozess wären mindestens erforderlich:

```text
minimum_observation_duration
minimum_production_decision_count
rollback_replacement_plan
human_signoff_required
blocked_scopes_resolved_or_declared_legacy_only
```

Alle Bedingungen stehen auf `future_required`.

## Quality Gates

| Gate | Wert |
| --- | --- |
| legacyFreezeAllowedForSelectedScopes | true |
| legacyFallbackAvailable | true |
| rollbackAvailable | true |
| hiddenInfoViolationCount | 0 |
| illegalSemanticDecisionCount | 0 |
| engineRejectCount | 0 |
| unsafeDivergenceCount | 0 |
| traceScrubberPasses | true |
| multiRunMetricsStable | true |
| fullProductionReady | false |
| legacyRemovalReady | false |

## Go/No-Go

Ergebnis: `legacy_freeze_for_selected_scopes_ready`.

Nicht erlaubt:

```text
legacy_removed
full_replacement_without_fallback
```

## Grenzen

- Freeze nur für ausgewählte Scopes.
- Legacy bleibt als Fallback vorhanden.
- Rollback bleibt verfügbar.
- Keine Legacy-Entfernung.
- Kein Full-Replacement-Claim.
- Blockierte Scopes bleiben blockiert.

## Folgeprozess

Ein späteres META 13 kann Legacy Retirement prüfen. META 12 führt diesen Schritt nicht aus.
