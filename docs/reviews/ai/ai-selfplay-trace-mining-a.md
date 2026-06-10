# AI Selfplay Trace Mining Report

Version: ai-selfplay-trace-mining-v1
Gate: diagnostic_only
No training: yes
No autofix: yes
Seeds: ai-v143-tuning-001, ai-v143-tuning-002, ai-v143-tuning-003, ai-v143-tuning-004, ai-v143-tuning-005
Max actions: 160
Runner deck: real_scene_runner_deep_market_engine_snapshot_v1
Corp deck: real_scene_corp_siren_fortress_snapshot_v1
Runner mode: current_candidate
Corp mode: current_candidate

## Aggregate

| Metric | Value |
| --- | ---: |
| games | 5 |
| decisions | 769 |
| findings | 340 |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitReached | 4 |
| redactionSafe | 1 |

## Findings By Severity

| Severity | Count |
| --- | ---: |
| critical | 0 |
| high | 5 |
| medium | 259 |
| low | 76 |

## Findings By Detector

| Detector | Count |
| --- | ---: |
| action_limit_reached | 4 |
| repeated_no_progress_run | 23 |
| recovery_low_value_loop | 25 |
| bank_over_target_without_funding_need | 28 |
| duplicate_low_delta_install | 3 |
| plan_step_action_mismatch | 207 |
| semantic_override_suspicious | 164 |
| corp_never_scores_long_game | 5 |

## Top Findings

| Severity | Seed | State | Side | Action | Detectors | Reason | Facts |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| high | ai-v143-tuning-001 | 127 | corp | rez_ice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:rez_ice; corp_empty_remote_count:0; credit_cost:13; legacy_reference:credits:16 |
| high | ai-v143-tuning-002 | 158 | corp | decline_rez | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:decline_rez; corp_empty_remote_count:0; credit_cost:0; legacy_reference:fallback_stable_legal_action |
| high | ai-v143-tuning-003 | 159 | corp | end_turn | action_limit_reached, corp_never_scores_long_game | Long selfplay game ended without a Corp score. \| Selfplay game reached the configured action limit before a result. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:5 |
| high | ai-v143-tuning-004 | 152 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:6 |
| high | ai-v143-tuning-005 | 157 | corp | resolve_choice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:resolve_choice; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:1 |
| medium | ai-v143-tuning-001 | 9 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 14 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 19 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 21 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 30 | runner | start_run | repeated_no_progress_run, semantic_override_suspicious | Runner repeated rd without intervening progress. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:start_run; credit_cost:0; legacy_reference_action_type:gain_credit; legacy_reference_reason:runner.plan.recover_economy |
| medium | ai-v143-tuning-001 | 32 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 37 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 39 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 53 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; commitmentStrength:3; credit_cost:0; expectedFutureValue:2 |
| medium | ai-v143-tuning-001 | 54 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; commitmentStrength:3; credit_cost:0; expectedFutureValue:2 |
| medium | ai-v143-tuning-001 | 64 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 65 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 68 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 75 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 76 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 77 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:1 |
| medium | ai-v143-tuning-001 | 89 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 90 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 91 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 98 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:1 |
| medium | ai-v143-tuning-001 | 100 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 101 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:1 |
| medium | ai-v143-tuning-001 | 108 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:3; legacy_reference_action_type:start_run; legacy_reference_reason:runner.plan.pressure_hq |
| medium | ai-v143-tuning-001 | 113 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 114 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 115 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-001 | 125 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 126 | runner | continue_run | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 128 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 12 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 13 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 16 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; commitmentStrength:3; credit_cost:0; expectedFutureValue:2 |
| medium | ai-v143-tuning-002 | 27 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 28 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 29 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 37 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 41 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 42 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 49 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 50 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 51 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:1 |
| medium | ai-v143-tuning-002 | 52 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:5; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:8 |
| medium | ai-v143-tuning-002 | 61 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 62 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 63 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |

## Interpretation

Die Funde sind Review-Hinweise. Echte Fehler sollten als generische KI-Fix-Klasse formuliert und danach mit denselben Seeds erneut geprüft werden.