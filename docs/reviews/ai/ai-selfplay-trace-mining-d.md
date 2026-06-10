# AI Selfplay Trace Mining Report

Version: ai-selfplay-trace-mining-v1
Gate: diagnostic_only
No training: yes
No autofix: yes
Seeds: ai-v143-tuning-001, ai-v143-tuning-002, ai-v143-tuning-003, ai-v143-tuning-004, ai-v143-tuning-005
Max actions: 160
Runner deck: local_realistic_runner_rnd_interface_dig_snapshot_v1
Corp deck: local_realistic_corp_shadoe_tag_bag_snapshot_v1
Runner mode: current_candidate
Corp mode: current_candidate

## Aggregate

| Metric | Value |
| --- | ---: |
| games | 5 |
| decisions | 508 |
| findings | 177 |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitReached | 2 |
| redactionSafe | 1 |

## Findings By Severity

| Severity | Count |
| --- | ---: |
| critical | 0 |
| high | 2 |
| medium | 78 |
| low | 97 |

## Findings By Detector

| Detector | Count |
| --- | ---: |
| action_limit_reached | 2 |
| repeated_no_progress_run | 26 |
| repeated_low_value_archives | 1 |
| recovery_low_value_loop | 7 |
| bank_over_target_without_funding_need | 5 |
| duplicate_low_delta_install | 1 |
| plan_step_action_mismatch | 46 |
| semantic_override_suspicious | 121 |
| corp_never_scores_long_game | 2 |

## Top Findings

| Severity | Seed | State | Side | Action | Detectors | Reason | Facts |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| high | ai-v143-tuning-003 | 156 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:28 |
| high | ai-v143-tuning-005 | 158 | corp | rez_ice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:rez_ice; corp_empty_remote_count:0; credit_cost:2; legacy_reference:credits:23 |
| medium | ai-v143-tuning-001 | 12 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 13 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 20 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; credit_cost:0; legacy_reference_action_type:start_run; legacy_reference_reason:runner.plan.pressure_hq |
| medium | ai-v143-tuning-001 | 25 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 26 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 28 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 29 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 30 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 39 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 40 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 41 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 42 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 49 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 50 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 51 | runner | install_card | bank_over_target_without_funding_need, semantic_override_suspicious | Runner bank or debt economy was used without a concrete funding need. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:install_card; bankBuildLegal:false; bankCashOutLegal:false; bankCashOutThreshold:false |
| medium | ai-v143-tuning-001 | 52 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 59 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 60 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 61 | runner | activated_card_ability | bank_over_target_without_funding_need, semantic_override_suspicious | Runner bank or debt economy was used without a concrete funding need. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:activated_card_ability; bankBuildLegal:true; bankCashOutLegal:false; bankCashOutThreshold:false |
| medium | ai-v143-tuning-001 | 62 | runner | install_card | bank_over_target_without_funding_need, duplicate_low_delta_install, semantic_override_suspicious | Runner bank or debt economy was used without a concrete funding need. \| Runner installed a duplicate or low-delta setup card. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:install_card; bankBuildLegal:false; bankCashOutLegal:false; bankCashOutThreshold:false |
| medium | ai-v143-tuning-001 | 70 | runner | activated_card_ability | bank_over_target_without_funding_need, semantic_override_suspicious | Runner bank or debt economy was used without a concrete funding need. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:activated_card_ability; bankBuildLegal:true; bankCashOutLegal:false; bankCashOutThreshold:false |
| medium | ai-v143-tuning-001 | 71 | runner | start_run | repeated_no_progress_run, bank_over_target_without_funding_need | Runner bank or debt economy was used without a concrete funding need. \| Runner repeated rd without intervening progress. | action_type:start_run; bankBuildLegal:false; bankCashOutLegal:false; bankCashOutThreshold:false |
| medium | ai-v143-tuning-001 | 75 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 76 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 78 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-002 | 13 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 24 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 25 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 27 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-003 | 9 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-003 | 11 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-003 | 12 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-003 | 19 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-003 | 20 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-003 | 23 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-003 | 24 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-003 | 26 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-003 | 35 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-003 | 36 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-003 | 45 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; activeFundingNeed:false; contestReserve:0; credit_cost:0 |
| medium | ai-v143-tuning-003 | 79 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; activeFundingNeed:false; contestReserve:0; credit_cost:0 |
| medium | ai-v143-tuning-003 | 81 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; activeFundingNeed:false; contestReserve:0; credit_cost:0 |
| medium | ai-v143-tuning-003 | 91 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; activeFundingNeed:false; contestReserve:0; credit_cost:0 |
| medium | ai-v143-tuning-003 | 93 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; activeFundingNeed:false; contestReserve:0; credit_cost:0 |
| medium | ai-v143-tuning-003 | 103 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; activeFundingNeed:false; contestReserve:0; credit_cost:0 |
| medium | ai-v143-tuning-003 | 107 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; activeFundingNeed:false; contestReserve:0; credit_cost:0 |
| medium | ai-v143-tuning-003 | 120 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; activeFundingNeed:false; contestReserve:0; credit_cost:0 |
| medium | ai-v143-tuning-003 | 122 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; activeFundingNeed:false; contestReserve:0; credit_cost:0 |

## Interpretation

Die Funde sind Review-Hinweise. Echte Fehler sollten als generische KI-Fix-Klasse formuliert und danach mit denselben Seeds erneut geprüft werden.