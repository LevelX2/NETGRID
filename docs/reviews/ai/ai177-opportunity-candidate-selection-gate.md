# AI177 Opportunity Candidate Selection Gate

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI177 definiert das verbindliche Gate, ab wann ein Opportunity-Kandidat in Runtime getestet werden darf. Shadow-Kandidaten aus AI173 und AI175 werden gegen dieses Gate geprüft.

## Gate

| Bedingung | Status |
| --- | --- |
| `opportunity_state_snapshot_present` | required |
| `stable_same_state_action_id_present` | required |
| `target_context_complete_or_irrelevant` | required |
| `cost_timing_hard_gates_clear` | required |
| `progress_delta_better` | required |
| `intent_contract_matches` | required |
| `redaction_safe` | required |
| `repeated_or_extremely_clear_fixture` | required |

## Kandidatenprüfung

| Quelle | Case | Familie | Pfad | Gate | Fehlende Bedingungen |
| --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `visible_installable_solution` | `blocked` | `stable_same_state_action_id_present`, `repeated_or_extremely_clear_fixture` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `scoreline` | `blocked` | `stable_same_state_action_id_present` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `scoreline` | `blocked` | `stable_same_state_action_id_present` |

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Kandidaten | 3 |
| Gate-pass | 0 |
| blockiert | 3 |

## Schluss

Kein aktueller Shadow-Kandidat darf in Runtime getestet werden. Der entscheidende Blocker ist nicht mehr das Fehlen irgendeines Snapshots, sondern die fehlende stabile same-state `actionId` plus Zielidentität in der redigierten Snapshot-Evidence. AI178 muss daher No-Go bleiben, solange diese Removal Condition nicht erfüllt ist.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai177-opportunity-candidate-selection-gate.ts`
- `git diff --check`
