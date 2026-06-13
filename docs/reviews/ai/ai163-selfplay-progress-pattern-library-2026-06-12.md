# AI163 Selfplay Progress Pattern Library

Datum: 2026-06-12

Branch: `codex/ai159-ai169-endgame-opportunity`

## Ziel

AI163 baut aus den positiven Progress-Actions aus AI132 eine kleine deterministische Pattern-Library. Sie ist redaction-safe und dient späterem Shadow-Scoring, ohne Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Pattern-Klassen | 8 |
| Redaction-safe | 1 |

## Pattern Summary

| Progress Label | Aktionen | Beispiele |
| --- | ---: | ---: |
| `progress_access` | 47 | 8 |
| `progress_trash` | 18 | 8 |
| `progress_steal` | 10 | 8 |
| `progress_score` | 14 | 8 |
| `progress_coverage_install` | 85 | 8 |
| `progress_reachability_improved` | 184 | 8 |
| `progress_server_protected` | 26 | 8 |
| `progress_economy_converted` | 286 | 8 |

## Beispiele

### progress_access

| Case | Action | Boardstate Summary | TargetContext | Cost | Timing | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `A-ai-v143-tuning-008` | runner/access_card@111 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via access_card | `payoff_target_side_safe` | `cost_not_primary` | `run_window` | `progress_steal,progress_coverage_install,progress_server_protected` |
| `A-ai-v143-tuning-008` | runner/access_card@135 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via access_card | `payoff_target_side_safe` | `cost_not_primary` | `run_window` | `progress_trash,progress_coverage_install,progress_server_protected` |
| `A-ai-v143-tuning-009` | runner/access_card@118 | runner endwindow runner_late_gain_credit_real_reserve via access_card | `payoff_target_side_safe` | `cost_not_primary` | `run_window` | `progress_trash,progress_server_protected,progress_reachability_improved,progress_access` |
| `A-ai-v143-tuning-009` | runner/access_card@134 | runner endwindow runner_late_gain_credit_real_reserve via access_card | `payoff_target_side_safe` | `cost_not_primary` | `run_window` | `progress_trash,progress_reachability_improved` |
| `A-ai-v143-tuning-009` | runner/access_card@156 | runner endwindow runner_late_gain_credit_real_reserve via access_card | `payoff_target_side_safe` | `cost_not_primary` | `run_window` | `progress_trash,progress_reachability_improved` |
| `B-ai-v143-tuning-001` | runner/access_card@123 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via access_card | `payoff_target_side_safe` | `cost_not_primary` | `run_window` | `progress_reachability_improved,progress_access,progress_trash` |
| `B-ai-v143-tuning-001` | runner/access_card@140 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via access_card | `payoff_target_side_safe` | `cost_not_primary` | `run_window` | `progress_trash` |
| `B-ai-v143-tuning-005` | runner/access_card@133 | runner endwindow runner_late_gain_credit_real_reserve via access_card | `payoff_target_side_safe` | `cost_not_primary` | `run_window` | `progress_trash` |

### progress_trash

| Case | Action | Boardstate Summary | TargetContext | Cost | Timing | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `A-ai-v143-tuning-008` | runner/trash_accessed_card@136 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via trash_accessed_card | `payoff_target_side_safe` | `cost_relevant` | `run_window` | `progress_coverage_install,progress_server_protected` |
| `A-ai-v143-tuning-009` | runner/trash_accessed_card@119 | runner endwindow runner_late_gain_credit_real_reserve via trash_accessed_card | `payoff_target_side_safe` | `cost_relevant` | `run_window` | `progress_server_protected,progress_reachability_improved,progress_access,progress_trash` |
| `A-ai-v143-tuning-009` | runner/trash_accessed_card@135 | runner endwindow runner_late_gain_credit_real_reserve via trash_accessed_card | `payoff_target_side_safe` | `cost_relevant` | `run_window` | `progress_reachability_improved` |
| `A-ai-v143-tuning-009` | runner/trash_accessed_card@157 | runner endwindow runner_late_gain_credit_real_reserve via trash_accessed_card | `payoff_target_side_safe` | `cost_relevant` | `run_window` | `progress_reachability_improved` |
| `B-ai-v143-tuning-001` | runner/trash_accessed_card@141 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via trash_accessed_card | `payoff_target_side_safe` | `cost_relevant` | `run_window` | `no_followup_progress` |
| `B-ai-v143-tuning-005` | runner/trash_accessed_card@134 | runner endwindow runner_late_gain_credit_real_reserve via trash_accessed_card | `payoff_target_side_safe` | `cost_relevant` | `run_window` | `no_followup_progress` |
| `B-ai-v143-tuning-008` | runner/trash_accessed_card@116 | runner endwindow runner_late_gain_credit_real_reserve via trash_accessed_card | `payoff_target_side_safe` | `cost_relevant` | `run_window` | `progress_coverage_install,progress_reachability_improved,progress_access,progress_trash` |
| `B-ai-v143-tuning-008` | runner/trash_accessed_card@128 | runner endwindow runner_late_gain_credit_real_reserve via trash_accessed_card | `payoff_target_side_safe` | `cost_relevant` | `run_window` | `progress_coverage_install` |

### progress_steal

| Case | Action | Boardstate Summary | TargetContext | Cost | Timing | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `A-ai-v143-tuning-006` | runner/steal_agenda@100 | mixed endwindow continue_chain_to_access via steal_agenda | `payoff_target_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_coverage_install,progress_server_protected` |
| `A-ai-v143-tuning-008` | runner/steal_agenda@112 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via steal_agenda | `payoff_target_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_coverage_install,progress_server_protected,progress_reachability_improved` |
| `B-ai-v143-tuning-006` | runner/steal_agenda@116 | mixed endwindow continue_chain_to_access via steal_agenda | `payoff_target_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_coverage_install,progress_reachability_improved` |
| `C-ai-v143-tuning-001` | runner/steal_agenda@151 | runner endwindow runner_late_gain_credit_real_reserve via steal_agenda | `payoff_target_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_coverage_install,progress_reachability_improved` |
| `C-ai-v143-tuning-006` | runner/steal_agenda@156 | runner endwindow runner_late_gain_credit_real_reserve via steal_agenda | `payoff_target_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_coverage_install` |
| `C-ai-v143-tuning-008` | runner/steal_agenda@110 | mixed endwindow run_microstep_required via steal_agenda | `payoff_target_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_reachability_improved,progress_access,progress_coverage_install,progress_trash` |
| `D-ai-v143-tuning-003` | runner/steal_agenda@105 | mixed endwindow continue_chain_to_access via steal_agenda | `payoff_target_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_reachability_improved,progress_access,progress_steal` |
| `D-ai-v143-tuning-003` | runner/steal_agenda@122 | mixed endwindow continue_chain_to_access via steal_agenda | `payoff_target_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_reachability_improved,progress_access,progress_steal` |

### progress_score

| Case | Action | Boardstate Summary | TargetContext | Cost | Timing | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `B-ai-v143-tuning-001` | corp/score_agenda@112 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via score_agenda | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved,progress_access` |
| `B-ai-v143-tuning-009` | corp/advance_card@120 | runner endwindow runner_late_gain_credit_real_reserve via advance_card | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_score,progress_coverage_install,progress_server_protected,progress_reachability_improved` |
| `B-ai-v143-tuning-009` | corp/score_agenda@121 | runner endwindow runner_late_gain_credit_real_reserve via score_agenda | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_coverage_install,progress_server_protected,progress_reachability_improved` |
| `C-ai-v143-tuning-001` | corp/score_agenda@135 | runner endwindow runner_late_gain_credit_real_reserve via score_agenda | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved,progress_access,progress_steal,progress_coverage_install` |
| `C-ai-v143-tuning-004` | corp/score_agenda@105 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via score_agenda | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_coverage_install` |
| `C-ai-v143-tuning-006` | corp/advance_card@138 | runner endwindow runner_late_gain_credit_real_reserve via advance_card | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_score,progress_coverage_install,progress_reachability_improved,progress_access` |
| `C-ai-v143-tuning-006` | corp/score_agenda@139 | runner endwindow runner_late_gain_credit_real_reserve via score_agenda | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_coverage_install,progress_reachability_improved,progress_access,progress_steal` |
| `C-ai-v143-tuning-007` | corp/score_agenda@118 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via score_agenda | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved,progress_access,progress_trash,progress_coverage_install` |

### progress_coverage_install

| Case | Action | Boardstate Summary | TargetContext | Cost | Timing | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `A-ai-v143-tuning-006` | runner/install_card@103 | mixed endwindow continue_chain_to_access via install_card | `run_path_or_ice_type_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_server_protected` |
| `A-ai-v143-tuning-006` | runner/play_event@125 | mixed endwindow continue_chain_to_access via play_event | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_coverage_install,progress_reachability_improved` |
| `A-ai-v143-tuning-006` | runner/play_event@127 | mixed endwindow continue_chain_to_access via play_event | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_reachability_improved` |
| `A-ai-v143-tuning-008` | runner/play_event@122 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via play_event | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_coverage_install,progress_server_protected,progress_reachability_improved,progress_access` |
| `A-ai-v143-tuning-008` | runner/install_card@123 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via install_card | `run_path_or_ice_type_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_coverage_install,progress_server_protected,progress_reachability_improved,progress_access` |
| `A-ai-v143-tuning-008` | runner/activated_card_ability@124 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via activated_card_ability | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `basic_action_or_choice_window` | `progress_server_protected,progress_reachability_improved,progress_access,progress_trash` |
| `B-ai-v143-tuning-003` | runner/install_card@111 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via install_card | `run_path_or_ice_type_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved,progress_server_protected` |
| `B-ai-v143-tuning-003` | runner/install_card@133 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via install_card | `run_path_or_ice_type_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_coverage_install` |

### progress_reachability_improved

| Case | Action | Boardstate Summary | TargetContext | Cost | Timing | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `A-ai-v143-tuning-006` | runner/start_run@134 | mixed endwindow continue_chain_to_access via start_run | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `run_window` | `progress_reachability_improved` |
| `A-ai-v143-tuning-006` | runner/continue_run@136 | mixed endwindow continue_chain_to_access via continue_run | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `run_window` | `progress_reachability_improved` |
| `A-ai-v143-tuning-006` | runner/continue_run@137 | mixed endwindow continue_chain_to_access via continue_run | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `run_window` | `progress_reachability_improved` |
| `A-ai-v143-tuning-008` | runner/start_run@108 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via start_run | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `run_window` | `progress_reachability_improved,progress_access,progress_steal,progress_coverage_install` |
| `A-ai-v143-tuning-008` | runner/continue_run@110 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via continue_run | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `run_window` | `progress_access,progress_steal,progress_coverage_install,progress_server_protected` |
| `A-ai-v143-tuning-008` | runner/start_run@132 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via start_run | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `run_window` | `progress_reachability_improved,progress_access,progress_trash,progress_coverage_install` |
| `A-ai-v143-tuning-009` | runner/start_run@115 | runner endwindow runner_late_gain_credit_real_reserve via start_run | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `run_window` | `progress_reachability_improved,progress_access,progress_trash,progress_server_protected` |
| `A-ai-v143-tuning-009` | runner/continue_run@117 | runner endwindow runner_late_gain_credit_real_reserve via continue_run | `run_path_or_ice_type_side_safe` | `cost_not_primary` | `run_window` | `progress_access,progress_trash,progress_server_protected,progress_reachability_improved` |

### progress_server_protected

| Case | Action | Boardstate Summary | TargetContext | Cost | Timing | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `A-ai-v143-tuning-006` | corp/rez_ice@110 | mixed endwindow continue_chain_to_access via rez_ice | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_coverage_install` |
| `A-ai-v143-tuning-008` | corp/rez_ice@129 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via rez_ice | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved,progress_access,progress_trash,progress_coverage_install` |
| `A-ai-v143-tuning-008` | corp/rez_ice@154 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via rez_ice | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved` |
| `A-ai-v143-tuning-009` | corp/rez_ice@107 | runner endwindow runner_late_gain_credit_real_reserve via rez_ice | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved,progress_access,progress_trash,progress_server_protected` |
| `A-ai-v143-tuning-009` | corp/rez_ice@124 | runner endwindow runner_late_gain_credit_real_reserve via rez_ice | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved,progress_access,progress_trash` |
| `B-ai-v143-tuning-003` | corp/rez_ice@108 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via rez_ice | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved,progress_coverage_install,progress_server_protected` |
| `B-ai-v143-tuning-003` | corp/rez_ice@127 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via rez_ice | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_coverage_install` |
| `B-ai-v143-tuning-003` | corp/rez_ice@158 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via rez_ice | `corp_scoreline_or_server_side_safe` | `cost_relevant` | `corp_or_install_window` | `progress_reachability_improved` |

### progress_economy_converted

| Case | Action | Boardstate Summary | TargetContext | Cost | Timing | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `A-ai-v143-tuning-006` | runner/gain_credit@106 | mixed endwindow continue_chain_to_access via gain_credit | `economy_conversion_side_safe` | `cost_relevant` | `basic_action_or_choice_window` | `progress_server_protected,progress_coverage_install` |
| `A-ai-v143-tuning-006` | corp/gain_credit@111 | mixed endwindow continue_chain_to_access via gain_credit | `economy_conversion_side_safe` | `cost_relevant` | `basic_action_or_choice_window` | `progress_coverage_install` |
| `A-ai-v143-tuning-006` | corp/gain_credit@112 | mixed endwindow continue_chain_to_access via gain_credit | `economy_conversion_side_safe` | `cost_relevant` | `basic_action_or_choice_window` | `progress_coverage_install` |
| `A-ai-v143-tuning-008` | runner/gain_credit@100 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via gain_credit | `economy_conversion_side_safe` | `cost_relevant` | `basic_action_or_choice_window` | `progress_reachability_improved,progress_access,progress_steal` |
| `A-ai-v143-tuning-008` | corp/gain_credit@104 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via gain_credit | `economy_conversion_side_safe` | `cost_relevant` | `basic_action_or_choice_window` | `progress_reachability_improved,progress_access,progress_steal,progress_coverage_install` |
| `A-ai-v143-tuning-008` | runner/gain_credit@107 | corp endwindow corp_late_gain_credit_real_rez_or_protection_reserve via gain_credit | `economy_conversion_side_safe` | `cost_relevant` | `basic_action_or_choice_window` | `progress_reachability_improved,progress_access,progress_steal,progress_coverage_install` |
| `A-ai-v143-tuning-009` | runner/gain_credit@101 | runner endwindow runner_late_gain_credit_real_reserve via gain_credit | `economy_conversion_side_safe` | `cost_relevant` | `basic_action_or_choice_window` | `progress_server_protected,progress_reachability_improved,progress_access,progress_trash` |
| `A-ai-v143-tuning-009` | runner/gain_credit@113 | runner endwindow runner_late_gain_credit_real_reserve via gain_credit | `economy_conversion_side_safe` | `cost_relevant` | `basic_action_or_choice_window` | `progress_reachability_improved,progress_access,progress_trash,progress_server_protected` |

## Schluss

Die Library zeigt positive Muster für Access, Trash, Steal, Score, Coverage, Reachability, Protection und Economy-Konversion. Sie ist kein ML-Modell und kein Runtime-Gewicht, sondern ein wiederverwendbarer Shadow-Katalog.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai163-selfplay-progress-pattern-library.ts`
- `git diff --check`
