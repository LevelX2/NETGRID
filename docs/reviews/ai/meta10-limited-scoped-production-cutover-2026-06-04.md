# META 10 Limited Scoped Production Cutover

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-production-readiness-automation-process-2026-06-04.md`

## Ziel

META 10 ist die erste begrenzte Produktivsetzung der Semantic AI. Sie gilt nur für ausgewählte, bewährte Scopes und nur unter harten Gates. Legacy bleibt Fallback, Rollback bleibt jederzeit verfügbar.

## Scope Freeze

Für den Limited Cutover ausgewählt:

```text
basic_economy_draw
tag_removal
simple_score_advance
```

Nicht ausgewählt:

```text
simple_run_choice
basic_install
simple_rez
remote_contest
access_trash_steal
trace_payment
damage_prevention
multi_target_multi_ability
```

`simple_run_choice` bleibt trotz META8-Canary wegen `reviewed_legacy_preferred` aus dem Produktivschnitt heraus. `remote_contest` bleibt wegen der offenen Removal Condition zur Target-Scoring-Kalibrierung gesperrt.

## Runtime-Regel

Semantic darf `actualDecision` nur liefern, wenn alle Bedingungen erfüllt sind:

```text
semanticActionId in Engine LegalActions
scope enabled
all hard gates pass
trace valid or safely droppable
rollback not forced
no hidden-info risk
no public payload delta
no engine reject
```

Sonst gewinnt Legacy.

## Cutover-Fixtures

| Fixture | Scope | Ergebnis |
| --- | --- | --- |
| `meta10-basic-economy-production` | `basic_economy_draw` | Semantic actual |
| `meta10-tag-removal-production` | `tag_removal` | Semantic actual |
| `meta10-score-production` | `simple_score_advance` | Semantic actual |
| `meta10-run-choice-not-enabled` | `simple_run_choice` | Legacy |
| `meta10-hidden-info-rollback` | `basic_economy_draw` | Legacy rollback |
| `meta10-semantic-not-legal-rollback` | `simple_score_advance` | Legacy rollback |
| `meta10-force-legacy-rollback` | `tag_removal` | Legacy rollback |
| `meta10-engine-reject-rollback` | `simple_score_advance` | Legacy rollback |
| `meta10-public-payload-delta-rollback` | `basic_economy_draw` | Legacy rollback |

## Monitoring

| Metrik | Wert |
| --- | ---: |
| semanticDecisionCount | 9 |
| semanticOverrideCount | 3 |
| legacyFallbackCount | 6 |
| rollbackCount | 5 |
| engineRejectCount | 0 |
| hiddenInfoViolationCount | 0 |
| unsafeDivergenceCount | 0 |
| publicPayloadDeltaCount | 0 |
| p95DecisionLatencyMs | 9.2 |

## Pre-Activation Gates

| Gate | Wert |
| --- | --- |
| META 7 green | true |
| META 8 internal canary stable | true |
| META 9 production shadow stable | true |
| openHumanReviewItems | 0 |
| unsafeDivergenceCount | 0 |
| knownBadDecisionCount | 0 |
| hiddenInfoViolationCount | 0 |
| illegalSemanticDecisionCount | 0 |
| engineRejectCount | 0 |
| rollbackTested | true |
| traceScrubberPasses | true |
| scopeFreezeComplete | true |

## Post-Activation Gates

| Gate | Wert |
| --- | ---: |
| engineRejectCount | 0 |
| hiddenInfoViolationCount | 0 |
| illegalSemanticDecisionCount | 0 |
| publicPayloadDeltaCount | 0 |
| rollbackFailureCount | 0 |
| determinismFailureCount | 0 |
| unsafeDivergenceCount | 0 |

Bei jedem Verstoß greift der Legacy-Fallback.

## Go/No-Go

Ergebnis: `limited_scoped_production_active_with_rollback_constraints`.

Das bedeutet:

```text
limitedScopedProductionActive = true
productiveUse = selected_scopes_only
semanticExecutionScope = selected_low_risk_scopes_only
legacyFallbackAvailable = true
rollbackAvailable = true
```

Nicht erlaubt:

```text
fullProductionReady
legacyRemovalReady
broadCutover
```

## Grenzen

- Keine globale Aktivierung.
- Keine Bulk-Aktivierung.
- Keine blocked Scopes.
- Kein Full Production Claim.
- Kein Legacy Removal.
- Keine Änderung an Engine-Legalität.
- Keine Public-Payload-Änderung.

## Nächster Schritt

META 11 darf Scope Expansion und Kalibrierung vorbereiten. Neue Scopes dürfen nur einzeln und nach eigenem Dossier durch denselben Reifeweg.
