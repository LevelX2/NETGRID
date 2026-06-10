# AI Selfplay Trace Mining A-D Summary

Seeds: ai-v143-tuning-001, ai-v143-tuning-002, ai-v143-tuning-003, ai-v143-tuning-004, ai-v143-tuning-005
Max actions: 160
Gate: diagnostic_only

## Aggregate

| Metric | Value |
| --- | ---: |
| pairs | 4 |
| games | 20 |
| decisions | 2678 |
| findings | 1090 |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitReached | 13 |
| allRedactionSafe | 1 |

## Pairs

| Pair | Decks | Games | Findings | Critical | High | Medium | Low | Safety |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A | Deep Market Engine vs Siren Fortress | 5 | 340 | 0 | 5 | 259 | 76 | illegal=0; replay=0; redaction=1 |
| B | Stealth Interface Starter vs Manhunt Pressure Bureau | 5 | 222 | 0 | 2 | 163 | 57 | illegal=0; replay=0; redaction=1 |
| C | Blink Pressure Rig vs Ivory Bastion | 5 | 351 | 0 | 5 | 234 | 112 | illegal=0; replay=0; redaction=1 |
| D | R&D Interface Dig vs Shadoe Tag & Bag | 5 | 177 | 0 | 2 | 78 | 97 | illegal=0; replay=0; redaction=1 |

## Findings By Severity

| Severity | Count |
| --- | ---: |
| critical | 0 |
| high | 14 |
| medium | 734 |
| low | 342 |

## Findings By Detector

| Detector | Count |
| --- | ---: |
| plan_step_action_mismatch | 621 |
| semantic_override_suspicious | 619 |
| recovery_low_value_loop | 110 |
| repeated_no_progress_run | 73 |
| bank_over_target_without_funding_need | 33 |
| corp_never_scores_long_game | 14 |
| action_limit_reached | 13 |
| duplicate_low_delta_install | 4 |
| repeated_low_value_archives | 3 |

## Top Findings

| Pair | Severity | Seed | State | Side | Action | Detectors | Reason | Facts |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| A | high | ai-v143-tuning-001 | 127 | corp | rez_ice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:rez_ice; corp_empty_remote_count:0; credit_cost:13; legacy_reference:credits:16 |
| A | high | ai-v143-tuning-004 | 152 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:6 |
| A | high | ai-v143-tuning-005 | 157 | corp | resolve_choice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:resolve_choice; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:1 |
| A | high | ai-v143-tuning-002 | 158 | corp | decline_rez | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:decline_rez; corp_empty_remote_count:0; credit_cost:0; legacy_reference:fallback_stable_legal_action |
| A | high | ai-v143-tuning-003 | 159 | corp | end_turn | action_limit_reached, corp_never_scores_long_game | Long selfplay game ended without a Corp score. \| Selfplay game reached the configured action limit before a result. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:5 |
| B | high | ai-v143-tuning-003 | 157 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:16 |
| B | high | ai-v143-tuning-005 | 159 | corp | end_turn | action_limit_reached, corp_never_scores_long_game | Long selfplay game ended without a Corp score. \| Selfplay game reached the configured action limit before a result. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:11 |
| C | high | ai-v143-tuning-003 | 147 | corp | rez_ice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:rez_ice; corp_empty_remote_count:0; credit_cost:6; legacy_reference:credits:6 |
| C | high | ai-v143-tuning-001 | 152 | corp | rez_ice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:rez_ice; corp_empty_remote_count:0; corp_remote_protection:unprotected; corp_remote_target:existing_remote |
| C | high | ai-v143-tuning-005 | 152 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:4 |
| C | high | ai-v143-tuning-004 | 158 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:3 |
| C | high | ai-v143-tuning-002 | 159 | corp | gain_credit | action_limit_reached, corp_never_scores_long_game | Long selfplay game ended without a Corp score. \| Selfplay game reached the configured action limit before a result. | action_type:gain_credit; corp_empty_remote_count:0; corp_remote_risk:present; corp_remote_risk:unsafe_score_action_available |
| D | high | ai-v143-tuning-003 | 156 | corp | end_turn | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:end_turn; corp_empty_remote_count:0; credit_cost:0; legacy_reference:credits:28 |
| D | high | ai-v143-tuning-005 | 158 | corp | rez_ice | corp_never_scores_long_game | Long selfplay game ended without a Corp score. | action_type:rez_ice; corp_empty_remote_count:0; credit_cost:2; legacy_reference:credits:23 |
| A | medium | ai-v143-tuning-001 | 9 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| A | medium | ai-v143-tuning-002 | 12 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| A | medium | ai-v143-tuning-002 | 13 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| A | medium | ai-v143-tuning-001 | 14 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| A | medium | ai-v143-tuning-002 | 16 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; commitmentStrength:3; credit_cost:0; expectedFutureValue:2 |
| A | medium | ai-v143-tuning-001 | 19 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| A | medium | ai-v143-tuning-001 | 21 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| A | medium | ai-v143-tuning-002 | 27 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| A | medium | ai-v143-tuning-002 | 28 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| A | medium | ai-v143-tuning-002 | 29 | runner | gain_credit | recovery_low_value_loop, plan_step_action_mismatch | Runner repeated a recovery-like action without visible progress. \| Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| A | medium | ai-v143-tuning-001 | 30 | runner | start_run | repeated_no_progress_run, semantic_override_suspicious | Runner repeated rd without intervening progress. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:start_run; credit_cost:0; legacy_reference_action_type:gain_credit; legacy_reference_reason:runner.plan.recover_economy |
| A | medium | ai-v143-tuning-001 | 32 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| A | medium | ai-v143-tuning-001 | 37 | runner | continue_run | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:continue_run; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:7 |
| A | medium | ai-v143-tuning-002 | 37 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| A | medium | ai-v143-tuning-001 | 39 | runner | play_event | plan_step_action_mismatch, semantic_override_suspicious | Selected action appears to mismatch the current plan category. \| Semantic runtime selected a different actual action than the legacy debug winner. | action_type:play_event; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |
| A | medium | ai-v143-tuning-002 | 41 | runner | gain_credit | plan_step_action_mismatch | Selected action appears to mismatch the current plan category. | action_type:gain_credit; credit_cost:0; legacy_reference:difficulty:normal; legacy_reference:doctrine_plan_weight:9 |

## Interpretation

Harte Safety-Werte haben Vorrang. Critical/High-Findings werden zuerst triagiert; Medium/Low-Findings dienen zur Musterbildung und zum Schneiden kleiner Folge-Activities.