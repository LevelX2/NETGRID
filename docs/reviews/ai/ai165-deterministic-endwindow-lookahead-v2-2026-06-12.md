# AI165 Deterministic Endwindow Lookahead v2

Datum: 2026-06-12

Branch: `codex/ai159-ai169-endgame-opportunity`

## Ziel

AI165 verfeinert MCTS-lite zu einem deterministischen Endwindow-Lookahead über Top-3-Aktionssequenzen. Mangels früherer Opportunity-LegalAction-Snapshots bleibt v2 ein statischer LegalAction-Sequencing-Proxy ohne Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Top-Opportunity-Fälle | 10 |
| Lookahead Proxy Wins | 7 |
| echte Opportunity-LegalAction-Snapshots | 0 |

## Probes

| Case | Subcluster | Top 3 Proxy Actions | Lookahead Win | Ergebnis |
| --- | --- | --- | ---: | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | runner/continue_run@151/`progress_reachability_improved`:64, runner/start_run@149/`progress_reachability_improved`:64, runner/continue_run@136/`progress_reachability_improved`:64 | 0 | `no_go_missing_opportunity_legal_action_snapshot` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/access_card@135/`progress_access`:108, runner/trash_accessed_card@136/`progress_trash`:99, runner/start_run@132/`progress_reachability_improved`:87 | 1 | `no_go_missing_opportunity_legal_action_snapshot` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | runner/access_card@156/`progress_access`:108, runner/trash_accessed_card@157/`progress_trash`:99, runner/access_card@134/`progress_access`:99 | 1 | `no_go_missing_opportunity_legal_action_snapshot` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/access_card@140/`progress_access`:99, runner/trash_accessed_card@141/`progress_trash`:90, runner/continue_run@138/`progress_reachability_improved`:82 | 1 | `no_go_missing_opportunity_legal_action_snapshot` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/install_card@155/`progress_coverage_install`:88, corp/rez_ice@158/`progress_server_protected`:79, runner/install_card@142/`progress_coverage_install`:79 | 0 | `no_go_missing_opportunity_legal_action_snapshot` |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | runner/access_card@133/`progress_access`:99, runner/trash_accessed_card@134/`progress_trash`:90, runner/start_run@132/`progress_reachability_improved`:73 | 1 | `no_go_missing_opportunity_legal_action_snapshot` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | runner/access_card@144/`progress_access`:90, runner/continue_run@142/`progress_reachability_improved`:73, runner/break_subroutine@141/`progress_reachability_improved`:73 | 1 | `no_go_missing_opportunity_legal_action_snapshot` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | runner/install_card@148/`progress_coverage_install`:70, runner/gain_credit@147/`progress_economy_converted`:44, corp/gain_credit@144/`progress_economy_converted`:44 | 0 | `no_go_missing_opportunity_legal_action_snapshot` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | runner/access_card@142/`progress_access`:99, runner/trash_accessed_card@143/`progress_trash`:90, runner/continue_run@140/`progress_reachability_improved`:82 | 1 | `no_go_missing_opportunity_legal_action_snapshot` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | runner/steal_agenda@151/`progress_steal`:138, corp/score_agenda@135/`progress_score`:120, runner/access_card@150/`progress_access`:117 | 1 | `no_go_missing_opportunity_legal_action_snapshot` |

## Schluss

Der Lookahead-Proxy findet starke positive Sequenzen, bewertet aber keine echten same-state Opportunity-LegalActions. Daher liefert AI165 keinen Top-Kandidaten für AI166. Der notwendige nächste technische Schritt bleibt Instrumentierung von Opportunity-State-LegalAction-Snapshots.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai165-deterministic-endwindow-lookahead-v2.ts`
- `git diff --check`
