# AI173 Runner Coverage Opportunity Solver

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI173 prüft Runner-Coverage-Fälle aus AI170-Snapshots auf konkrete, side-safe Opportunity-LegalActions. Das Ranking bleibt shadow-only: sichtbare installierbare Coverage vor Search, Draw und Credit, aber nur bei vorhandener LegalAction-Evidence.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-nahe Fälle | 13 |
| Cutover-Kandidaten | 1 |
| No-Go-Fälle | 12 |

## Pfade

| Pfad | Fälle |
| --- | ---: |
| `draw_solution` | 5 |
| `no_solution_visible` | 3 |
| `visible_installable_solution` | 5 |

## Fälle

| Case | Subcluster | Snapshots | Pfad | Cutover |
| --- | --- | ---: | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | 1 | `no_solution_visible` | `no_go_no_progress_path` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 2 | `visible_installable_solution` | `cutover_candidate` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | 1 | `draw_solution` | `no_go_hard_gate_or_target_context` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | 1 | `draw_solution` | `no_go_hard_gate_or_target_context` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 1 | `draw_solution` | `no_go_hard_gate_or_target_context` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | 1 | `draw_solution` | `no_go_hard_gate_or_target_context` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | 1 | `visible_installable_solution` | `no_go_hard_gate_or_target_context` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | 1 | `no_solution_visible` | `no_go_no_progress_path` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | 1 | `visible_installable_solution` | `no_go_hard_gate_or_target_context` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | 1 | `visible_installable_solution` | `no_go_hard_gate_or_target_context` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | 1 | `draw_solution` | `no_go_hard_gate_or_target_context` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | 1 | `visible_installable_solution` | `no_go_hard_gate_or_target_context` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | 1 | `no_solution_visible` | `no_go_no_progress_path` |

## Schluss

AI173 findet Coverage-nahe Snapshot-Pfade und markiert erste shadow-only Cutover-Kandidaten. Diese Kandidaten sind noch keine Runtime-Freigabe: AI177 muss erst das übergreifende Gate prüfen und AI178 darf höchstens genau einen belegten Kandidaten testen.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai173-runner-coverage-opportunity-solver.ts`
- `git diff --check`
