# META 8 Internal Semantic Canary

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-production-readiness-automation-process-2026-06-04.md`

## Ziel

META 8 erlaubt der Semantic AI erstmals eine semantische `actualDecision`, aber ausschließlich in internen Canary-Läufen und nur für Scopes, die META 7 auf `internal_canary_ready` gehoben hat. Dies ist kein Produktiv-Cutover.

## Konfiguration

Default bleibt Legacy-only:

```text
semanticAiShadowModeEnabled = false
semanticAiCutoverEnabled = false
semanticAiAgreementOnlyMode = false
semanticAiScopedOverrideEnabled = false
semanticAiRollbackForceLegacy = true
semanticAiCanaryScope = disabled
```

Internal Canary:

```text
semanticAiShadowModeEnabled = true
semanticAiCutoverEnabled = true
semanticAiAgreementOnlyMode = false
semanticAiScopedOverrideEnabled = true
semanticAiRollbackForceLegacy = false
semanticAiCanaryScope = internal
```

## Canary-Scopes

| Scope | Status | Internal Canary |
| --- | --- | --- |
| `basic_economy_draw` | `internal_canary_ready` | enabled |
| `tag_removal` | `internal_canary_ready` | enabled |
| `simple_score_advance` | `internal_canary_ready` | enabled |
| `simple_run_choice` | `internal_canary_ready` | enabled |
| `basic_install` | `limited_candidate` | disabled |
| `simple_rez` | `limited_candidate` | disabled |
| `remote_contest` | `agreement_ready` | disabled |
| `trace_payment` | `blocked` | disabled |

## Canary-Läufe

| Metrik | Wert |
| --- | ---: |
| Run-Sets | 5 |
| Decision Points | 320 |
| Runner-Scopes | 3 |
| Korp-Scopes | 1 |
| Semantic actual decisions | 4 |

Semantische `actualDecision` ist nur für `basic_economy_draw`, `tag_removal`, `simple_score_advance` und `simple_run_choice` erlaubt.

## Rollback-Fälle

Alle Pflichtfälle fallen auf Legacy zurück:

| Fall | Ergebnis |
| --- | --- |
| `rollbackForceLegacy=true` | Legacy gewinnt |
| Semantic action nicht in `LegalActions` | Legacy gewinnt |
| Hidden-info blocked | Legacy gewinnt |
| Trace fehlt | Legacy gewinnt |
| Engine reject simuliert | Legacy gewinnt |

`rollbackFailureCount = 0`.

## Runtime-Overhead

| Metrik | Wert |
| --- | ---: |
| mean semantic compute time | 4.8 ms |
| p95 semantic compute time | 8.5 ms |
| max semantic compute time | 12.4 ms |
| mean trace size | 4096 bytes |
| max trace size | 9216 bytes |
| memory impact | 3.2 MB |

Der Overhead ist dokumentiert. Ein harter Performance-Freeze bleibt späteren produktionsnahen Gates vorbehalten.

## Quality Gates

| Gate | Wert |
| --- | ---: |
| internalCanaryDecisionPoints | 320 |
| semanticActualDecisionCount | 4 |
| illegalSemanticDecisionCount | 0 |
| hiddenInfoViolationCount | 0 |
| engineRejectCount | 0 |
| nonEngineLegalAssumptionCount | 0 |
| determinismFailureCount | 0 |
| rollbackFailureCount | 0 |
| traceCompleteRate | 1.0000 |
| unsafeDivergenceCount | 0 |
| knownBadDecisionCount | 0 |
| runtimeOverheadDocumented | true |
| defaultConfigLegacyOnly | true |

## Go/No-Go

Ergebnis: `production_safe_shadow_candidate`.

Nicht erlaubt:

```text
production_cutover
legacy_freeze
legacy_removal
```

## Grenzen

- Kein Produktiv-Cutover.
- Keine globale Aktivierung.
- Keine semantische `actualDecision` außerhalb `internal_canary_ready`.
- Legacy bleibt Fallback.
- Default-Konfiguration bleibt Legacy-only.
- Keine Hidden-Info-Projektion.
- Kein Public-Payload-Delta.

## Nächster Schritt

META 9 darf den production-safe Shadow / Agreement Canary modellieren. Dort muss `actualDecision` wieder immer Legacy bleiben und `behaviorDeltaCount = 0` gelten.
