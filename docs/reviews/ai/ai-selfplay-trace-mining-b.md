# AI Selfplay Trace Mining Report

Version: ai-selfplay-trace-mining-v1
Gate: diagnostic_only
No training: yes
No autofix: yes
Seeds: ai-v143-tuning-001, ai-v143-tuning-002, ai-v143-tuning-003, ai-v143-tuning-004, ai-v143-tuning-005
Max actions: 160
Runner deck: real_scene_runner_stealth_interface_starter_snapshot_v1
Corp deck: real_scene_corp_manhunt_pressure_bureau_snapshot_v1
Runner mode: current_candidate
Corp mode: current_candidate

## Aggregate

| Metric | Value |
| --- | ---: |
| games | 5 |
| decisions | 601 |
| findings | 222 |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitReached | 2 |
| redactionSafe | 1 |

## Findings By Severity

| Severity | Count |
| --- | ---: |
| critical | 0 |
| high | 2 |
| medium | 163 |
| low | 57 |

## Findings By Detector

| Detector | Count |
| --- | ---: |
| action_limit_reached | 2 |
| repeated_no_progress_run | 8 |
| repeated_low_value_archives | 2 |
| recovery_low_value_loop | 45 |
| plan_step_action_mismatch | 154 |
| semantic_override_suspicious | 110 |
| corp_never_scores_long_game | 2 |

## Top Findings

| Severity | Seed | State | Side | Action | Detectors | Reason | Facts |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| high | ai-v143-tuning-003 | 157 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:16 |
| high | ai-v143-tuning-005 | 159 | corp | end_turn | action_limit_reached, corp_never_scores_long_game | Long selfplay game ended without a Corp score. \| Selfplay game reached the configured action limit before a result. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:11 |
| medium | ai-v143-tuning-001 | 9 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 12 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 23 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 24 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 25 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 32 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 33 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 37 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 38 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 40 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 47 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 48 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 49 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; credit_cost:0; legacy_reference_action_type:start_run; legacy_reference_reason:runner.plan.pressure_hq |
| medium | ai-v143-tuning-001 | 52 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 53 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 55 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 62 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 63 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 64 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; credit_cost:0; legacy_reference_action_type:start_run; legacy_reference_reason:runner.plan.pressure_hq |
| medium | ai-v143-tuning-001 | 67 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 68 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 71 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 79 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 80 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 81 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; credit_cost:0; legacy_reference_action_type:start_run; legacy_reference_reason:runner.plan.pressure_hq |
| medium | ai-v143-tuning-001 | 84 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 85 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 87 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 94 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 95 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 96 | runner | start_run | repeated_no_progress_run | Runner repeated rd without intervening progress. | action_type:start_run; credit_cost:0; legacy_reference_action_type:start_run; legacy_reference_reason:runner.plan.pressure_hq |
| medium | ai-v143-tuning-001 | 98 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 107 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 108 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 109 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:2; legacy_reference_action_type:start_run; legacy_reference_reason:runner.plan.pressure_hq |
| medium | ai-v143-tuning-001 | 111 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 112 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-002 | 11 | runner | install_card | recovery_low_value_loop, semantic_override_suspicious | Runner repeated a recovery-like action without visible progress. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:install_card; capability_delta:new_coverage; credit_cost:1; credits_after_install:2 |
| medium | ai-v143-tuning-002 | 12 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 21 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 22 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 24 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 31 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 32 | runner | start_run | repeated_no_progress_run, semantic_override_suspicious | Runner repeated rd without intervening progress. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:start_run; credit_cost:0; legacy_reference_action_type:gain_credit; legacy_reference_reason:runner.plan.recover_economy |
| medium | ai-v143-tuning-002 | 34 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-002 | 35 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 36 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 44 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |

## Interpretation

Die Funde sind Review-Hinweise. Echte Fehler sollten als generische KI-Fix-Klasse formuliert und danach mit denselben Seeds erneut geprüft werden.