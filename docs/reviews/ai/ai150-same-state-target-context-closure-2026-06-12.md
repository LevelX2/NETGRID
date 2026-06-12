# AI150 Same-State TargetContext Closure

Datum: 2026-06-12

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

## Ziel

AI150 schließt oder begründet TargetContext-Gaps für die Top-5-Fälle aus AI149. Es wird ausschließlich side-safe Snapshot-Kontext verwendet. Es wird keine Legalität erzeugt und keine Runtime-Entscheidung verändert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Top-Fälle | 5 |
| historischer Challenger same-state vorhanden | 0 |
| vollständig oder begründet | 5 |
| Redaction-safe | 1 |

## Fälle

| Case | Subcluster | Legacy | Historischer Challenger | Same-State vorhanden | Closure |
| --- | --- | --- | --- | ---: | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | corp/advance_card@159 | runner/continue_run | 0 | `historical_challenger_absent_at_same_state` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/continue_run@159 | corp/rez_ice | 0 | `historical_challenger_absent_at_same_state` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | corp/decline_rez@159 | runner/trash_accessed_card | 0 | `historical_challenger_absent_at_same_state` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/resolve_choice@159 | runner/trash_accessed_card | 0 | `historical_challenger_absent_at_same_state` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/pump_breaker@159 | corp/rez_ice | 0 | `historical_challenger_absent_at_same_state` |

## Detailprüfung

### A-ai-v143-tuning-006

The same-state alternative list exists, but the historical challenger action is not present at the terminal legacy decision.

| Rank | Action | Semantic | SourceKind | SourceDefinitionId | AbilityId | TargetServer | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `advance_card` selected | `scoreline` | `legacy_selected_action` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `scoreline_relevant` | `cost_relevant_side_safe` | `run_window` | `sourceDefinitionId_not_exposed` |
| 2 | `install_card` | `coverage_setup` | `visible_card_or_ability` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `sourceDefinitionId_not_exposed`, `hard_gate_present`, `blocked_reason_present` |
| 3 | `install_card` | `scoreline` | `visible_card_or_ability` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `run_window` | `sourceDefinitionId_not_exposed`, `hard_gate_present`, `blocked_reason_present` |
| 4 | `install_card` | `coverage_setup` | `visible_card_or_ability` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `sourceDefinitionId_not_exposed`, `hard_gate_present`, `blocked_reason_present` |
| 5 | `install_card` | `coverage_setup` | `visible_card_or_ability` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `sourceDefinitionId_not_exposed`, `hard_gate_present`, `blocked_reason_present` |
| 6 | `install_card` | `coverage_setup` | `visible_card_or_ability` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `sourceDefinitionId_not_exposed`, `hard_gate_present`, `blocked_reason_present` |
| 7 | `install_card` | `coverage_setup` | `visible_card_or_ability` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `sourceDefinitionId_not_exposed`, `hard_gate_present`, `blocked_reason_present` |
| 8 | `gain_credit` | `server_protection` | `visible_card_or_ability` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `basic_action_window` | `hard_gate_present`, `blocked_reason_present` |

### A-ai-v143-tuning-008

The same-state alternative list exists, but the historical challenger action is not present at the terminal legacy decision.

| Rank | Action | Semantic | SourceKind | SourceDefinitionId | AbilityId | TargetServer | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `continue_run` selected | `economy` | `legacy_selected_action` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `reachability_relevant` | `cost_relevant_side_safe` | `run_window` | none |
| 2 | `jack_out` | `economy` | `visible_card_or_ability` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `scoreline_relevant` | `cost_relevant_side_safe` | `run_window` | none |

### A-ai-v143-tuning-009

The same-state alternative list exists, but the historical challenger action is not present at the terminal legacy decision.

| Rank | Action | Semantic | SourceKind | SourceDefinitionId | AbilityId | TargetServer | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `decline_rez` selected | `server_protection` | `legacy_selected_action` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `protection_relevant` | `cost_relevant_side_safe` | `corp_action_window` | none |

### B-ai-v143-tuning-001

The same-state alternative list exists, but the historical challenger action is not present at the terminal legacy decision.

| Rank | Action | Semantic | SourceKind | SourceDefinitionId | AbilityId | TargetServer | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `resolve_choice` selected | `server_protection` | `legacy_selected_action` | `not_exposed_in_snapshot` | `not_exposed_in_snapshot` | `side_safe_server_context_not_exposed` | `protection_relevant` | `cost_relevant_side_safe` | `basic_action_window` | `sourceDefinitionId_not_exposed`, `abilityId_not_exposed` |

### B-ai-v143-tuning-003

The same-state alternative list exists, but the historical challenger action is not present at the terminal legacy decision.

| Rank | Action | Semantic | SourceKind | SourceDefinitionId | AbilityId | TargetServer | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `pump_breaker` selected | `coverage_setup` | `legacy_selected_action` | `not_exposed_in_snapshot` | `not_applicable` | `not_applicable` | `coverage_relevant` | `cost_relevant_side_safe` | `run_window` | none |
| 2 | `continue_run` | `economy` | `visible_card_or_ability` | `not_exposed_in_snapshot` | `not_applicable` | `side_safe_server_context_not_exposed` | `scoreline_relevant` | `cost_relevant_side_safe` | `run_window` | none |

## Schluss

Die Top-5-Fälle sind vollständig erklärt: Der relevante historische Challenger ist in keinem Fall am terminalen Same-State vorhanden. Damit ist TargetContext nicht der primäre Cutover-Blocker; der Blocker bleibt fehlende LegalAction-Verfügbarkeit im selben Zustand.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai150-same-state-target-context-closure.ts`
- `git diff --check`
