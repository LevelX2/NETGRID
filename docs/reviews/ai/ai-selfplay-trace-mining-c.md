# AI Selfplay Trace Mining Report

Version: ai-selfplay-trace-mining-v1
Gate: diagnostic_only
No training: yes
No autofix: yes
Seeds: ai-v143-tuning-001, ai-v143-tuning-002, ai-v143-tuning-003, ai-v143-tuning-004, ai-v143-tuning-005
Max actions: 160
Runner deck: local_realistic_runner_blink_pressure_rig_snapshot_v1
Corp deck: local_realistic_corp_ivory_bastion_snapshot_v1
Runner mode: current_candidate
Corp mode: current_candidate

## Aggregate

| Metric | Value |
| --- | ---: |
| games | 5 |
| decisions | 800 |
| findings | 351 |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitReached | 5 |
| redactionSafe | 1 |

## Findings By Severity

| Severity | Count |
| --- | ---: |
| critical | 0 |
| high | 5 |
| medium | 234 |
| low | 112 |

## Findings By Detector

| Detector | Count |
| --- | ---: |
| action_limit_reached | 5 |
| repeated_no_progress_run | 16 |
| recovery_low_value_loop | 33 |
| plan_step_action_mismatch | 214 |
| semantic_override_suspicious | 224 |
| corp_never_scores_long_game | 5 |

## Top Findings

| Severity | Seed | State | Side | Action | Detectors | Reason | Facts |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| high | ai-v143-tuning-001 | 152 | corp | rez_ice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:rez_ice; corp_empty_remote_count:0; corp_remote_protection:unprotected; corp_remote_target:existing_remote |
| high | ai-v143-tuning-002 | 159 | corp | gain_credit | action_limit_reached, corp_never_scores_long_game | Long selfplay game ended without a Corp score. \| Selfplay game reached the configured action limit before a result. | action_type:gain_credit; corp_empty_remote_count:0; corp_remote_risk:present; corp_remote_risk:unsafe_score_action_available |
| high | ai-v143-tuning-003 | 147 | corp | rez_ice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:rez_ice; corp_empty_remote_count:0; credit_cost:6; legacy_reference:credits:6 |
| high | ai-v143-tuning-004 | 158 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:3 |
| high | ai-v143-tuning-005 | 152 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:4 |
| medium | ai-v143-tuning-001 | 9 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 11 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 12 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 24 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 25 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 28 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 36 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 40 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 41 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 48 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 49 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 50 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 51 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:5; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 60 | runner | continue_run | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:continue_run; credit_cost:0; legacy_reference:clicks:3; legacy_reference:credits:9 |
| medium | ai-v143-tuning-001 | 61 | runner | draw_card | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:draw_card; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 63 | runner | draw_card | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:draw_card; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 70 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:1; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 74 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 75 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 82 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 83 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 84 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 85 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 95 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 98 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 99 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 100 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 107 | runner | draw_card | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:draw_card; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 108 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:3; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 110 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 111 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 122 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 123 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 124 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 131 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 132 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 133 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 134 | runner | draw_card | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:draw_card; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 141 | runner | draw_card | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:draw_card; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 142 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 143 | runner | draw_card | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:draw_card; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 144 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:plan:pressure_rnd |
| medium | ai-v143-tuning-001 | 145 | runner | end_turn | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:end_turn; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |
| medium | ai-v143-tuning-001 | 153 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| medium | ai-v143-tuning-001 | 156 | runner | gain_credit | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:10 |

## Interpretation

Die Funde sind Review-Hinweise. Echte Fehler sollten als generische KI-Fix-Klasse formuliert und danach mit denselben Seeds erneut geprüft werden.