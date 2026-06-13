# AI175 Corp Tempo Opportunity Solver

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI175 übersetzt Corp-Endgame-Tempo aus AI170-Snapshots in konkrete shadow-only Pfade: Scoreline, Advance, Protection, Economy, Punish oder opake Ability. Es gibt keine Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-/mixed-Fälle | 17 |
| Cutover-Kandidaten | 2 |
| No-Go-Fälle | 15 |

## Pfade

| Pfad | Fälle |
| --- | ---: |
| `economy` | 1 |
| `opaque_ability` | 2 |
| `opaque_or_basic` | 2 |
| `scoreline` | 12 |

## Fälle

| Case | Subcluster | Snapshots | Primärpfad | Klassen | Cutover |
| --- | --- | ---: | --- | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | 1 | `opaque_ability` | `opaque_ability` | `no_go_no_tempo_path` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 | `opaque_or_basic` |  | `no_go_missing_snapshot` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 2 | `scoreline` | `economy`, `protection`, `scoreline` | `cutover_candidate` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 2 | `scoreline` | `economy`, `scoreline` | `cutover_candidate` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 | `opaque_or_basic` |  | `no_go_missing_snapshot` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | 1 | `scoreline` | `economy`, `protection`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | 1 | `scoreline` | `economy`, `protection`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 1 | `scoreline` | `economy`, `protection`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | 1 | `scoreline` | `economy`, `protection`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | 1 | `scoreline` | `economy`, `install_protection`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | 1 | `economy` | `economy` | `no_go_no_tempo_path` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 | `scoreline` | `economy`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | 1 | `scoreline` | `economy`, `protection`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | 1 | `scoreline` | `economy`, `install_protection`, `protection`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | 1 | `scoreline` | `economy`, `protection`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | 1 | `scoreline` | `economy`, `install_protection`, `scoreline` | `no_go_hard_gate_or_target_context` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | 1 | `opaque_ability` | `opaque_ability` | `no_go_no_tempo_path` |

## Schluss

AI175 zeigt, dass Corp-Tempo aus Snapshots konkreter prüfbar ist. Cutover-Kandidaten bleiben dennoch vorläufig, bis AI177 das Gate und AI178 höchstens einen bewiesenen Kandidaten auswählt.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai175-corp-tempo-opportunity-solver.ts`
- `git diff --check`
