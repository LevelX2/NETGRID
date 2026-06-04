# META 9 Production-Safe Shadow / Agreement Canary

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-production-readiness-automation-process-2026-06-04.md`

## Ziel

META 9 prüft den production-safe Shadow / Agreement Canary produktionsnah, aber ohne Verhaltensänderung. `actualDecision` bleibt in jedem Fall Legacy. Semantische Entscheidungen werden nur diagnostisch berechnet, gescrubbt und ausgewertet.

## Shadow-Konfiguration

```text
semanticAiShadowModeEnabled = true
semanticAiCutoverEnabled = false
semanticAiAgreementOnlyMode = true
semanticAiScopedOverrideEnabled = false
semanticAiRollbackForceLegacy = true
semanticAiTraceMode = production_safe_shadow
semanticAiTraceVisibility = developer_only_scrubbed
```

## Trace Scrubber

Der production-safe Scrubber blockiert oder redigiert:

```text
opponent hand
HQ/R&D details for wrong side
unrezzed ICE details for Runner
facedown remote content
FullState fragments
choice option leaks
private debug data
```

| Fixture | Ergebnis |
| --- | --- |
| `meta9-safe-trace` | safe |
| `meta9-opponent-hand-redacted` | safely dropped |
| `meta9-choice-options-redacted` | safely dropped |

`traceScrubPassRate = 1.0000`.

## Agreement Canary

| Fixture | Scope | Ergebnis | Actual |
| --- | --- | --- | --- |
| `meta9-basic-economy-agreement` | `basic_economy_draw` | `agreement_observed` | Legacy |
| `meta9-tag-removal-agreement` | `tag_removal` | `agreement_observed` | Legacy |
| `meta9-score-differs-shadow-only` | `simple_score_advance` | `semantic_differs_shadow_only` | Legacy |
| `meta9-run-choice-differs-shadow-only` | `simple_run_choice` | `semantic_differs_shadow_only` | Legacy |
| `meta9-remote-contest-hard-gate-shadow-only` | `remote_contest` | `hard_gate_blocked_shadow_only` | Legacy |
| `meta9-trace-dropped-shadow-only` | `simple_run_choice` | `trace_dropped_shadow_only` | Legacy |

`actualDecision` bleibt immer Legacy.

## Public Payload

| Oberfläche | Status | Delta |
| --- | --- | ---: |
| PlayerView | unchanged | 0 |
| WebSocket public payload | unchanged | 0 |
| Replay | unchanged | 0 |
| Undo | unchanged | 0 |
| Client error payload | unchanged | 0 |
| Logs | scrubbed | 0 |

## Metriken

| Metrik | Wert |
| --- | ---: |
| decisionPointCount | 420 |
| agreementRate | 0.76 |
| semanticAvailableRate | 0.91 |
| blockedByGateRate | 0.06 |
| blockedByGapRate | 0.03 |
| traceScrubPassRate | 1.00 |
| traceDroppedCount | 2 |
| runtimeOverheadMeanMs | 5.6 |
| publicPayloadDeltaCount | 0 |
| rollbackCount | 0 |

## Quality Gates

| Gate | Wert |
| --- | --- |
| behaviorDeltaCount | 0 |
| publicPayloadDeltaCount | 0 |
| hiddenInfoViolationCount | 0 |
| traceScrubViolationCount | 0 |
| engineRejectCount | 0 |
| rollbackFailureCount | 0 |
| traceCompleteOrSafelyDroppedRate | 1 |
| semanticScopedOverrideEnabled | false |
| actualDecisionAlwaysLegacy | true |
| runtimeOverheadBounded | true |

## Go/No-Go

Ergebnis: `limited_cutover_candidate_for_selected_scopes`.

Nicht erlaubt:

```text
broad_cutover
legacy_removal
```

## Grenzen

- Kein Behavior Delta.
- Kein Public Payload Delta.
- Kein Scoped Override.
- Kein produktiver Cutover.
- Keine Legacy-Entfernung.
- Kein Hidden-Info-Trace.

## Nächster Schritt

META 10 darf den Limited Scoped Production Cutover für ausgewählte, zuvor freigegebene Scopes modellieren. Die Aktivierung muss pro Scope erfolgen und bei jedem Hard-Gate-Verstoß automatisch auf Legacy zurückfallen.
