# AI Selfplay Trace Mining Report

Version: ai-selfplay-trace-mining-v1
Gate: diagnostic_only
No training: yes
No autofix: yes
Seeds: ai-v143-tuning-001, ai-v143-tuning-002, ai-v143-tuning-003, ai-v143-tuning-004, ai-v143-tuning-005
Max actions: 100
Runner deck: demo_runner_008
Corp deck: demo_corp_008
Runner mode: current_candidate
Corp mode: current_candidate

## Aggregate

| Metric | Value |
| --- | ---: |
| games | 5 |
| decisions | 500 |
| findings | 206 |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitReached | 5 |
| redactionSafe | 1 |

## Findings By Severity

| Severity | Count |
| --- | ---: |
| critical | 0 |
| high | 5 |
| medium | 142 |
| low | 59 |

## Findings By Detector

| Detector | Count |
| --- | ---: |
| action_limit_reached | 5 |
| repeated_no_progress_run | 20 |
| recovery_low_value_loop | 24 |
| duplicate_low_delta_install | 2 |
| plan_step_action_mismatch | 113 |
| semantic_override_suspicious | 135 |
| corp_never_scores_long_game | 5 |

## Top Findings

| Severity | Seed | State | Side | Action | Detectors | Reason | Facts |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| high | ai-v143-tuning-001 | 96 | corp | decline_rez | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:decline_rez; corp_empty_remote_count:0; credit_cost:0; legacy_reference:fallback_stable_legal_action |
| high | ai-v143-tuning-002 | 94 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:3 |
| high | ai-v143-tuning-003 | 95 | corp | decline_rez | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:decline_rez; corp_empty_remote_count:0; credit_cost:0; legacy_reference:fallback_stable_legal_action |
| high | ai-v143-tuning-004 | 94 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:11 |
| high | ai-v143-tuning-005 | 87 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:2 |
| medium | ai-v143-tuning-001 | 7 | runner | install_card | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:install_card; credit_cost:2; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:12 |
| medium | ai-v143-tuning-001 | 8 | runner | install_card | recovery_low_value_loop, semantic_override_suspicious | Runner repeated a recovery-like action without visible progress. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:install_card; capability_delta:new_coverage; credit_cost:3; credits_after_install:0 |
| medium | ai-v143-tuning-001 | 9 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 10 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch, semantic_override_suspicious | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 20 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 22 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 23 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch, semantic_override_suspicious | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 30 | runner | install_card | duplicate_low_delta_install, semantic_override_suspicious | Runner installed a duplicate or low-delta setup card. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:install_card; credit_cost:2; legacy_reference_action_type:play_event; legacy_reference_reason:runner.plan.recover_economy |
| medium | ai-v143-tuning-001 | 32 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 33 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch, semantic_override_suspicious | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 34 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch, semantic_override_suspicious | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 41 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-001 | 42 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:1 |
| medium | ai-v143-tuning-001 | 43 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; activeRequiredCapability:Sentry-Breaker; activeRequiredCapabilityRaw:breaker_sentry; coverageAnswerFit:draw_for_answer |
| medium | ai-v143-tuning-001 | 52 | runner | play_event | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:play_event; activeRequiredCapability:Sentry-Breaker; activeRequiredCapabilityRaw:breaker_sentry; coverageAnswerFit:draw_for_answer |
| medium | ai-v143-tuning-001 | 53 | runner | draw_card | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:draw_card; activeRequiredCapability:Sentry-Breaker; activeRequiredCapabilityRaw:breaker_sentry; coverageAnswerFit:basic_draw_fallback |
| medium | ai-v143-tuning-001 | 54 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference_action_type:play_event; legacy_reference_reason:runner.plan.recover_economy |
| medium | ai-v143-tuning-001 | 55 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference_action_type:start_run; legacy_reference_reason:runner.plan.pressure_hq |
| medium | ai-v143-tuning-001 | 62 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference_action_type:start_run; legacy_reference_reason:runner.plan.pressure_hq |
| medium | ai-v143-tuning-001 | 63 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:1 |
| medium | ai-v143-tuning-001 | 64 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:1; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:1 |
| medium | ai-v143-tuning-001 | 65 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:1; legacy_reference:difficulty:normal; legacy_reference:plan:pressure_hq |
| medium | ai-v143-tuning-001 | 67 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 79 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 80 | runner | continue_run | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 82 | runner | continue_run | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 84 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 92 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 93 | runner | continue_run | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 95 | runner | continue_run | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 97 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 99 | runner | decline_trash | action_limit_reached | Selfplay game reached the configured action limit before a result. | access_trash_scope:central; access_trash_server:hq; action_type:decline_trash; asset_trash_neglect |
| medium | ai-v143-tuning-002 | 10 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-002 | 12 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 20 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 21 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 23 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 31 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 32 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 36 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 43 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 44 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 45 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:1 |
| medium | ai-v143-tuning-002 | 54 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| medium | ai-v143-tuning-002 | 55 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |

## Interpretation

Die Funde sind Review-Hinweise. Echte Fehler sollten als generische KI-Fix-Klasse formuliert und danach mit denselben Seeds erneut geprüft werden.