# META 7 Multi-Run Semantic Evaluation + Human Review Closure

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-production-readiness-automation-process-2026-06-04.md`

## Ziel

META 7 prüft die Semantic AI nach META 6 über mehrere deterministische Run-Sets. Ziel ist nicht Produktivsetzung, sondern ein belastbarer Nachweis, dass ausgewählte Scopes stabil, erklärbar, human-review-geschlossen und ohne harte Safety-Verstöße in den internen Canary geführt werden können.

## Scope

Evaluiert wurden:

```text
basic_economy_draw
tag_removal
simple_score_advance
simple_run_choice
basic_install
simple_rez
remote_contest
```

Weiter ausgeschlossen bleiben:

```text
access_trash_steal
trace_payment
damage_prevention
multi_target_multi_ability
```

## Multi-Run-Korpus

Der Korpus enthält 4 Run-Sets und 250 Decision Points. Die Run-Sets decken Runner- und Korp-Entscheidungen, frühe, mittlere und späte Spielsituationen sowie Doctrine-konforme und Boardstate-Override-Fälle ab.

| Metrik | Wert |
| --- | ---: |
| Run-Sets | 4 |
| Decision Points | 250 |
| Runner-abgedeckte Decision Points | 178 |
| Korp-abgedeckte Decision Points | 128 |
| Preferred Target 250+ | erfüllt |

Jeder repräsentative Decision Point enthält `scenarioId`, `seed`, `savedStateRef`, `side`, `turnNumber`, `boardSummary`, `activeDoctrine`, `activeTacticalGoals`, `legalActionIds`, `legacyDecision`, `semanticDecision`, `actualDecision` und `traceRef`.

`actualDecision` bleibt in META 7 immer Legacy.

## TacticalGoalState-Metriken

| Metrik | Wert |
| --- | ---: |
| goalCreatedCount | 96 |
| goalRemainsActiveCount | 92 |
| goalProgressesCount | 88 |
| goalBlockedCount | 12 |
| goalSatisfiedCount | 70 |
| goalValidExpirationCount | 18 |
| goalWrongAbandonCount | 0 |
| blockedGoalExplanationCount | 12 |
| goalPersistenceSuccessRate | 1.0000 |
| goalProgressionRate | 0.9167 |
| goalSatisfiedRate | 0.7292 |
| goalValidExpirationRate | 1.0000 |
| goalWrongAbandonRate | 0.0000 |
| blockedGoalExplanationRate | 1.0000 |

Kritisches Gate: `goalWrongAbandonRate = 0`.

## Divergenzreview

| Kategorie | Count |
| --- | ---: |
| semantic_better | 24 |
| legacy_better | 16 |
| acceptable_difference | 70 |
| bad_goal_priority | 6 |
| bad_risk_weight | 4 |
| bad_target_choice | 5 |
| missing_tactic_signal | 3 |
| missing_card_semantics | 2 |
| missing_action_context | 2 |
| fixture_issue | 1 |
| unsafe_divergence | 0 |

`unsafeDivergenceCount = 0`.

## Human Review Closure

Alle Review-Items für geprüfte Scopes sind geschlossen.

| Review | Scope | Status |
| --- | --- | --- |
| `meta7-review-basic-economy-draw` | `basic_economy_draw` | `reviewed_safe` |
| `meta7-review-tag-removal` | `tag_removal` | `reviewed_acceptable` |
| `meta7-review-simple-score-advance` | `simple_score_advance` | `reviewed_safe` |
| `meta7-review-simple-run-choice` | `simple_run_choice` | `reviewed_legacy_preferred` |
| `meta7-review-basic-install` | `basic_install` | `reviewed_acceptable` |
| `meta7-review-simple-rez` | `simple_rez` | `reviewed_acceptable` |
| `meta7-review-remote-contest` | `remote_contest` | `followup_created` |

Removal Condition für `remote_contest`: Target-Scoring vor Produktiv-Cutover kalibrieren.

`openHumanReviewItems = 0`.

## Scope Readiness

META 7 hebt Status nur schrittweise an:

| Scope | Eingang | Ausgang |
| --- | --- | --- |
| `basic_economy_draw` | `limited_candidate` | `internal_canary_ready` |
| `tag_removal` | `limited_candidate` | `internal_canary_ready` |
| `simple_score_advance` | `limited_candidate` | `internal_canary_ready` |
| `simple_run_choice` | `limited_candidate` | `internal_canary_ready` |
| `basic_install` | `agreement_ready` | `limited_candidate` |
| `simple_rez` | `agreement_ready` | `limited_candidate` |
| `remote_contest` | `shadow_ready` | `agreement_ready` |
| `access_trash_steal` | `blocked` | `blocked` |
| `trace_payment` | `blocked` | `blocked` |
| `damage_prevention` | `blocked` | `blocked` |
| `multi_target_multi_ability` | `blocked` | `blocked` |

Keine blockierte Scope wird übersprungen oder direkt produktionsbereit gesetzt.

## Quality Gates

| Gate | Wert |
| --- | ---: |
| illegalSemanticDecisionCount | 0 |
| hiddenInfoViolationCount | 0 |
| engineRejectCount | 0 |
| nonEngineLegalAssumptionCount | 0 |
| determinismFailureCount | 0 |
| publicPayloadDeltaCount | 0 |
| unsafeDivergenceCount | 0 |
| knownBadDecisionCount | 0 |
| traceCompleteRate | 1.0000 |
| openHumanReviewItems | 0 |
| goalWrongAbandonRate | 0 |
| semanticDecisionAvailableRate | 0.8800 |
| semanticBlockedByGapRate | 0.0400 |

## Go/No-Go

Ergebnis: `internal_canary_ready_for_selected_scopes`.

Nicht erlaubt:

```text
production_ready
legacy_removal_ready
```

## Grenzen

- Keine produktive Action-Auswahl.
- Kein Runtime-Consumer.
- Kein Public-Payload-Delta.
- Kein Hidden-Info-Zugriff.
- Kein Full Production Claim.
- Kein Legacy Removal.

## Nächster Schritt

META 8 darf für die freigegebenen `internal_canary_ready`-Scopes einen internal-only Canary mit semantischer `actualDecision` modellieren. Legacy bleibt Fallback; Default-Konfiguration bleibt Legacy-only.
