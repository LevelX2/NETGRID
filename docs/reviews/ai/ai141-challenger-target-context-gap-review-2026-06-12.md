# AI141 Challenger TargetContext Gap Review

Datum: 2026-06-12

Branch: `codex/ai140-ai148-semantic-endgame-optimization`

## Ziel

AI141 prüft die Top-5-Challenger-Fälle aus AI140 auf side-safe TargetContext-, Source-, Kosten- und Timing-Gaps. Es wird keine Legalität erzeugt und kein Runtime-Scoring geändert.

## Methode

- Quelle: `docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.json`
- Bewertet werden die ersten fünf AI140-Fälle.
- Geprüfte Felder: `sourceKind`, `sourceDefinitionId`, `targetContextStatus`, `hardGates`, Kostenprofil und Timingprofil.
- Redaction-safe: ja
- Git Head: `00ac9d32`

## Ergebnis

| Case | Subcluster | Legacy | historischer Challenger | Challenger same-state vorhanden | Closure |
| --- | --- | --- | --- | ---: | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | corp/advance_card@159 | runner/continue_run@152 | 0 | `historical_action_not_in_same_state_alternatives` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/continue_run@159 | corp/rez_ice@154 | 0 | `historical_action_not_in_same_state_alternatives` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | corp/decline_rez@159 | runner/trash_accessed_card@157 | 0 | `historical_action_not_in_same_state_alternatives` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/resolve_choice@159 | runner/trash_accessed_card@141 | 0 | `historical_action_not_in_same_state_alternatives` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/pump_breaker@159 | corp/rez_ice@158 | 0 | `historical_action_not_in_same_state_alternatives` |

## Detailprüfung

### A-ai-v143-tuning-006

TargetContext is sufficiently explained for the same-state list, but the historical challenger action is absent at the legacy decision point.

| Rank | Action | Semantic | Source | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `advance_card` selected | `scoreline` | `visible_card_or_ability:Ice Transmutation` | `scoreline_relevant` | `cost_relevant_side_safe` | `run_window` | none |
| 2 | `install_card` | `coverage_setup` | `visible_card_or_ability:Cinderella` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `hard_gate_present` |
| 3 | `install_card` | `scoreline` | `visible_card_or_ability:Roving Submarine` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `run_window` | `hard_gate_present` |
| 4 | `install_card` | `coverage_setup` | `visible_card_or_ability:Cinderella` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `hard_gate_present` |
| 5 | `install_card` | `coverage_setup` | `visible_card_or_ability:Cinderella` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `hard_gate_present` |
| 6 | `install_card` | `coverage_setup` | `visible_card_or_ability:Cinderella` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `hard_gate_present` |
| 7 | `install_card` | `coverage_setup` | `visible_card_or_ability:Cinderella` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `corp_action_window` | `hard_gate_present` |
| 8 | `gain_credit` | `server_protection` | `basic_action:none` | `blocked_by_hard_gate` | `cost_relevant_side_safe` | `basic_action_window` | `hard_gate_present` |

### A-ai-v143-tuning-008

TargetContext is sufficiently explained for the same-state list, but the historical challenger action is absent at the legacy decision point.

| Rank | Action | Semantic | Source | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `continue_run` selected | `economy` | `game_rule:none` | `reachability_relevant` | `cost_relevant_side_safe` | `run_window` | none |
| 2 | `jack_out` | `economy` | `game_rule:none` | `scoreline_relevant` | `cost_relevant_side_safe` | `run_window` | none |

### A-ai-v143-tuning-009

TargetContext is sufficiently explained for the same-state list, but the historical challenger action is absent at the legacy decision point.

| Rank | Action | Semantic | Source | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `decline_rez` selected | `server_protection` | `game_rule:none` | `protection_relevant` | `cost_relevant_side_safe` | `corp_action_window` | none |

### B-ai-v143-tuning-001

TargetContext is sufficiently explained for the same-state list, but the historical challenger action is absent at the legacy decision point.

| Rank | Action | Semantic | Source | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `resolve_choice` selected | `server_protection` | `game_rule:none` | `protection_relevant` | `cost_relevant_side_safe` | `basic_action_window` | none |

### B-ai-v143-tuning-003

TargetContext is sufficiently explained for the same-state list, but the historical challenger action is absent at the legacy decision point.

| Rank | Action | Semantic | Source | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `pump_breaker` selected | `coverage_setup` | `visible_card_or_ability:Codecracker` | `coverage_relevant` | `cost_relevant_side_safe` | `run_window` | none |
| 2 | `continue_run` | `economy` | `game_rule:Quandary` | `scoreline_relevant` | `cost_relevant_side_safe` | `run_window` | none |

## Schluss

Die Top-5-Fälle haben same-state Alternative-Listen, aber der jeweilige historische Challenger-Action-Typ ist dort nicht vorhanden. Das ist kein ungeklärter Hidden-Info- oder Legalitätsgap, sondern ein bestätigtes Cutover-Hindernis: Die bessere historische Aktion war am exakten Legacy-State nicht als Alternative belegt. AI142 und AI143 können daraus Shadow-Prioritäten ableiten, aber AI146 darf daraus keinen Runtime-Fix schneiden.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai141-challenger-target-context-gap-review.ts`
- `git diff --check`
