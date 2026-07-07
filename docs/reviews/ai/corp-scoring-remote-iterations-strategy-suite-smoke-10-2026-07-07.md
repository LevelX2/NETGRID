# AI Match Progression Benchmark Suite Report

Version: ai-match-progression-suite-v1
Baseline: belief_ai_v1_4_2
Candidate: current_candidate
Comparison profiles: basic_corp_ai, basic_runner_ai, belief_ai_v1_4_2, current_candidate
Seeds: 6
Gate: diagnostic_only

## Slot Status

| Slot | Type | Status | Use | Runner Archetype | Corp Archetype | Runner | Corp | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| safety_smoke_demo_008 | smoke | runnable | safety_regression | starter | starter_scoreline | demo_runner_008 | demo_corp_008 | ok |
| progression_tuning_origin_rig_vs_tax | snapshot_tuning | runnable | progression_tuning | rig_economy_pressure | remote_scoring | onr_origin_runner_ai_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | ok |
| progression_tuning_origin_pressure_vs_tax | snapshot_tuning | runnable | progression_tuning | event_pressure | remote_scoring | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | ok |
| snapshot_holdout_origin_pressure_vs_tag_ops | snapshot_holdout | runnable | holdout_only | event_pressure | tag_punish | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_tag_ops_snapshot_v1 | ok |
| local_realistic_pair_1 | local_realistic_holdout | runnable | holdout_only | rig_economy_pressure | remote_scoring | local_realistic_runner_blink_pressure_rig_snapshot_v1 | local_realistic_corp_ivory_bastion_snapshot_v1 | ok |
| local_realistic_pair_2 | local_realistic_holdout | runnable | holdout_only | central_multiaccess | tag_punish | local_realistic_runner_rnd_interface_dig_snapshot_v1 | local_realistic_corp_shadoe_tag_bag_snapshot_v1 | ok |
| real_scene_pair_1 | real_scene_holdout | runnable | holdout_only | rig_economy_pressure | remote_scoring | real_scene_runner_deep_market_engine_snapshot_v1 | real_scene_corp_siren_fortress_snapshot_v1 | ok |
| real_scene_pair_2 | real_scene_holdout | runnable | holdout_only | central_multiaccess | tag_punish | real_scene_runner_stealth_interface_starter_snapshot_v1 | real_scene_corp_manhunt_pressure_bureau_snapshot_v1 | ok |
| strategy_panel_gap_fast_advance | strategy_panel_gap | pending | holdout_only | unknown | fast_advance | strategy_panel:fast_advance:runner_pending | strategy_panel:fast_advance:corp_pending | Corp strategy panel target fast_advance has no stable runnable benchmark deck yet. |
| strategy_panel_gap_net_damage | strategy_panel_gap | pending | holdout_only | unknown | net_damage | strategy_panel:net_damage:runner_pending | strategy_panel:net_damage:corp_pending | Corp strategy panel target net_damage has no stable runnable benchmark deck yet. |
| strategy_panel_gap_hybrid_score_punish | strategy_panel_gap | pending | holdout_only | unknown | hybrid_score_punish | strategy_panel:hybrid_score_punish:runner_pending | strategy_panel:hybrid_score_punish:corp_pending | Corp strategy panel target hybrid_score_punish has no stable runnable benchmark deck yet. |
| strategy_panel_gap_virus_damage | strategy_panel_gap | pending | holdout_only | unknown | virus_damage | strategy_panel:virus_damage:runner_pending | strategy_panel:virus_damage:corp_pending | Corp strategy panel target virus_damage has no stable runnable benchmark deck yet. |

## Strategy Panel Coverage

Target Corp archetypes: remote_scoring, fast_advance, tag_punish, net_damage, hybrid_score_punish, virus_damage
Missing runnable Corp archetypes: fast_advance, net_damage, hybrid_score_punish, virus_damage

| Corp Archetype | Runnable Slots | Holdout Slots | Slots |
| --- | ---: | ---: | --- |
| fast_advance | 0 | 1 | strategy_panel_gap_fast_advance |
| hybrid_score_punish | 0 | 1 | strategy_panel_gap_hybrid_score_punish |
| net_damage | 0 | 1 | strategy_panel_gap_net_damage |
| remote_scoring | 4 | 2 | progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, local_realistic_pair_1, real_scene_pair_1 |
| starter_scoreline | 1 | 0 | safety_smoke_demo_008 |
| tag_punish | 3 | 3 | snapshot_holdout_origin_pressure_vs_tag_ops, local_realistic_pair_2, real_scene_pair_2 |
| virus_damage | 0 | 1 | strategy_panel_gap_virus_damage |

## Strategy Panel Gaps

Pending slots are explicit placeholders for Corp archetypes that need stable benchmark decks before they can be used as evidence.

| Slot | Corp Archetype | Status | Reason |
| --- | --- | --- | --- |
| strategy_panel_gap_fast_advance | fast_advance | pending | Corp strategy panel target fast_advance has no stable runnable benchmark deck yet. |
| strategy_panel_gap_net_damage | net_damage | pending | Corp strategy panel target net_damage has no stable runnable benchmark deck yet. |
| strategy_panel_gap_hybrid_score_punish | hybrid_score_punish | pending | Corp strategy panel target hybrid_score_punish has no stable runnable benchmark deck yet. |
| strategy_panel_gap_virus_damage | virus_damage | pending | Corp strategy panel target virus_damage has no stable runnable benchmark deck yet. |

## Demo Smoke

Demo-Smoke-Decks bleiben Safety-/Regression-Material und sind keine Spielstaerke-Basis.

| Slot | Type | Use | Runner Archetype | Corp Archetype | Profile | Runner | Corp | Illegal | Replay Failures | Timeout Rate | Action Limit Rate | Avg Turns | Corp Scores | Score Available | Score Taken | Missed Score | Score Take Rate | Runner Steals | Advanced Steals | Adv Steal Remote | Adv Steal Central | Final Advances | Unsafe Final | Protected Final | Protect Before | Score/Steal per Match | Remote Build | Remote Advances | Remote Trash | Successful Remote Access | Remote Access Trashable | Affordable Relevant Trash Opp | Relevant Trash Taken | Relevant Trash Take Rate | Skipped Relevant Trash | Remote Runs vs Advanced | Skipped Advanced Remote | Central While Remote Threat | Runner Draw | Draw Share | Draw+Discard | Duplicate Installs | Low-Value Dup | Junkyard Dup | Economy Taken | Rig Installs | Remote Trash Opp | Remote Trash Taken | Hand Use Rate | Runner Avg Credits | Runner End Credits | End Below Reserve | Turns Below Reserve | Runs Below Reserve | Contest Blocked Credits | Spend Below Reserve | Known Unaffordable Runs | Avg Missing Path Credits | Low-Value Unaffordable Runs | Unique Advanced Threats | Contestable Threats | Threats Contested | Threat Contest Rate | Skipped Contestable Threats | Central Instead Contestable | Central Justified | Central Burned Reserve | Remote Contest Credit Block | Remote Contest Post-Run Block | Remote Runs Insufficient Reserve | Repeated Central Same Threat | Successful Central | Successful Remote | Run-window Rez |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| safety_smoke_demo_008 | smoke | safety_regression | starter | starter_scoreline | basic_corp_ai | demo_runner_008 | demo_corp_008 | 0 | 0 | 0 | 1 | 1.333 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0.167 | 9 | 4 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 2 | 6 | 2 | 1 | 0.05 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0.727 | 5 | 7 | 0 | 2 | 1 | 2 | 3 | 0 | 0 | 0 | 4 | 4 | 2 | 0.5 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 3 | 0 |
| safety_smoke_demo_008 | smoke | safety_regression | starter | starter_scoreline | basic_runner_ai | demo_runner_008 | demo_corp_008 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 10 | 0 | 0 | 1 | 3.538 | 0 | 0 | 10 | 3 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 |
| safety_smoke_demo_008 | smoke | safety_regression | starter | starter_scoreline | belief_ai_v1_4_2 | demo_runner_008 | demo_corp_008 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0.167 | 8 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 |
| safety_smoke_demo_008 | smoke | safety_regression | starter | starter_scoreline | current_candidate | demo_runner_008 | demo_corp_008 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0.167 | 8 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 |

## Snapshot Progression

Snapshot-Decks sind die interne Progression-Messung fuer Tuning- und Holdout-Signale.

| Slot | Type | Use | Runner Archetype | Corp Archetype | Profile | Runner | Corp | Illegal | Replay Failures | Timeout Rate | Action Limit Rate | Avg Turns | Corp Scores | Score Available | Score Taken | Missed Score | Score Take Rate | Runner Steals | Advanced Steals | Adv Steal Remote | Adv Steal Central | Final Advances | Unsafe Final | Protected Final | Protect Before | Score/Steal per Match | Remote Build | Remote Advances | Remote Trash | Successful Remote Access | Remote Access Trashable | Affordable Relevant Trash Opp | Relevant Trash Taken | Relevant Trash Take Rate | Skipped Relevant Trash | Remote Runs vs Advanced | Skipped Advanced Remote | Central While Remote Threat | Runner Draw | Draw Share | Draw+Discard | Duplicate Installs | Low-Value Dup | Junkyard Dup | Economy Taken | Rig Installs | Remote Trash Opp | Remote Trash Taken | Hand Use Rate | Runner Avg Credits | Runner End Credits | End Below Reserve | Turns Below Reserve | Runs Below Reserve | Contest Blocked Credits | Spend Below Reserve | Known Unaffordable Runs | Avg Missing Path Credits | Low-Value Unaffordable Runs | Unique Advanced Threats | Contestable Threats | Threats Contested | Threat Contest Rate | Skipped Contestable Threats | Central Instead Contestable | Central Justified | Central Burned Reserve | Remote Contest Credit Block | Remote Contest Post-Run Block | Remote Runs Insufficient Reserve | Repeated Central Same Threat | Successful Central | Successful Remote | Run-window Rez |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| progression_tuning_origin_rig_vs_tax | snapshot_tuning | progression_tuning | rig_economy_pressure | remote_scoring | basic_corp_ai | onr_origin_runner_ai_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 8 | 8 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 5.182 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 3 | 3 | 1 | 0.333 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| progression_tuning_origin_rig_vs_tax | snapshot_tuning | progression_tuning | rig_economy_pressure | remote_scoring | basic_runner_ai | onr_origin_runner_ai_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 6 | 0 | 0 | 1 | 4.261 | 0 | 0 | 7 | 3 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 |
| progression_tuning_origin_rig_vs_tax | snapshot_tuning | progression_tuning | rig_economy_pressure | remote_scoring | belief_ai_v1_4_2 | onr_origin_runner_ai_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 2 |
| progression_tuning_origin_rig_vs_tax | snapshot_tuning | progression_tuning | rig_economy_pressure | remote_scoring | current_candidate | onr_origin_runner_ai_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 2 |
| progression_tuning_origin_pressure_vs_tax | snapshot_tuning | progression_tuning | event_pressure | remote_scoring | basic_corp_ai | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 6 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 4 | 3 | 0.136 | 0 | 0 | 0 | 0 | 3 | 2 | 0 | 0 | 0.786 | 4.682 | 0 | 0 | 5 | 3 | 1 | 3 | 0 | 0 | 0 | 3 | 3 | 0 | 0 | 3 | 3 | 1 | 0 | 0 | 0 | 0 | 3 | 2 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | snapshot_tuning | progression_tuning | event_pressure | remote_scoring | basic_runner_ai | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 6 | 0 | 0 | 1 | 4.6 | 0 | 0 | 2 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 2 |
| progression_tuning_origin_pressure_vs_tax | snapshot_tuning | progression_tuning | event_pressure | remote_scoring | belief_ai_v1_4_2 | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0.167 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 2 |
| progression_tuning_origin_pressure_vs_tax | snapshot_tuning | progression_tuning | event_pressure | remote_scoring | current_candidate | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0.167 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 2 |
| snapshot_holdout_origin_pressure_vs_tag_ops | snapshot_holdout | holdout_only | event_pressure | tag_punish | basic_corp_ai | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_tag_ops_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 1 | 5.333 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | snapshot_holdout | holdout_only | event_pressure | tag_punish | basic_runner_ai | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_tag_ops_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 5 | 0 | 0 | 0.923 | 4.682 | 0 | 0 | 3 | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | snapshot_holdout | holdout_only | event_pressure | tag_punish | belief_ai_v1_4_2 | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_tag_ops_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 1 |
| snapshot_holdout_origin_pressure_vs_tag_ops | snapshot_holdout | holdout_only | event_pressure | tag_punish | current_candidate | onr_origin_runner_ai_event_pressure_snapshot_v1 | onr_origin_corp_ai_tag_ops_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 1 |

## Local Realistic Holdout

Lokale Deck-Editor-Decks sind Holdout-/Reality-Check-Slots und werden nicht als Tuningbasis behandelt.

| Slot | Type | Use | Runner Archetype | Corp Archetype | Profile | Runner | Corp | Illegal | Replay Failures | Timeout Rate | Action Limit Rate | Avg Turns | Corp Scores | Score Available | Score Taken | Missed Score | Score Take Rate | Runner Steals | Advanced Steals | Adv Steal Remote | Adv Steal Central | Final Advances | Unsafe Final | Protected Final | Protect Before | Score/Steal per Match | Remote Build | Remote Advances | Remote Trash | Successful Remote Access | Remote Access Trashable | Affordable Relevant Trash Opp | Relevant Trash Taken | Relevant Trash Take Rate | Skipped Relevant Trash | Remote Runs vs Advanced | Skipped Advanced Remote | Central While Remote Threat | Runner Draw | Draw Share | Draw+Discard | Duplicate Installs | Low-Value Dup | Junkyard Dup | Economy Taken | Rig Installs | Remote Trash Opp | Remote Trash Taken | Hand Use Rate | Runner Avg Credits | Runner End Credits | End Below Reserve | Turns Below Reserve | Runs Below Reserve | Contest Blocked Credits | Spend Below Reserve | Known Unaffordable Runs | Avg Missing Path Credits | Low-Value Unaffordable Runs | Unique Advanced Threats | Contestable Threats | Threats Contested | Threat Contest Rate | Skipped Contestable Threats | Central Instead Contestable | Central Justified | Central Burned Reserve | Remote Contest Credit Block | Remote Contest Post-Run Block | Remote Runs Insufficient Reserve | Repeated Central Same Threat | Successful Central | Successful Remote | Run-window Rez |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| local_realistic_pair_1 | local_realistic_holdout | holdout_only | rig_economy_pressure | remote_scoring | basic_corp_ai | local_realistic_runner_blink_pressure_rig_snapshot_v1 | local_realistic_corp_ivory_bastion_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0.167 | 10 | 4 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0.857 | 4.688 | 5 | 0 | 2 | 0 | 1 | 2 | 0 | 0 | 0 | 3 | 3 | 1 | 0.333 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 |
| local_realistic_pair_1 | local_realistic_holdout | holdout_only | rig_economy_pressure | remote_scoring | basic_runner_ai | local_realistic_runner_blink_pressure_rig_snapshot_v1 | local_realistic_corp_ivory_bastion_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 1 | 5.789 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 |
| local_realistic_pair_1 | local_realistic_holdout | holdout_only | rig_economy_pressure | remote_scoring | belief_ai_v1_4_2 | local_realistic_runner_blink_pressure_rig_snapshot_v1 | local_realistic_corp_ivory_bastion_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 2 |
| local_realistic_pair_1 | local_realistic_holdout | holdout_only | rig_economy_pressure | remote_scoring | current_candidate | local_realistic_runner_blink_pressure_rig_snapshot_v1 | local_realistic_corp_ivory_bastion_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 2 |
| local_realistic_pair_2 | local_realistic_holdout | holdout_only | central_multiaccess | tag_punish | basic_corp_ai | local_realistic_runner_rnd_interface_dig_snapshot_v1 | local_realistic_corp_shadoe_tag_bag_snapshot_v1 | 0 | 0 | 0 | 1 | 0.833 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 1 | 2 | 0.105 | 0 | 0 | 0 | 0 | 2 | 3 | 0 | 0 | 0.727 | 4.368 | 0 | 0 | 4 | 1 | 1 | 4 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 |
| local_realistic_pair_2 | local_realistic_holdout | holdout_only | central_multiaccess | tag_punish | basic_runner_ai | local_realistic_runner_rnd_interface_dig_snapshot_v1 | local_realistic_corp_shadoe_tag_bag_snapshot_v1 | 0 | 0 | 0 | 1 | 1.167 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0.04 | 0 | 0 | 0 | 0 | 4 | 6 | 0 | 0 | 0.938 | 4.68 | 0 | 1 | 5 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| local_realistic_pair_2 | local_realistic_holdout | holdout_only | central_multiaccess | tag_punish | belief_ai_v1_4_2 | local_realistic_runner_rnd_interface_dig_snapshot_v1 | local_realistic_corp_shadoe_tag_bag_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0.333 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 2 |
| local_realistic_pair_2 | local_realistic_holdout | holdout_only | central_multiaccess | tag_punish | current_candidate | local_realistic_runner_rnd_interface_dig_snapshot_v1 | local_realistic_corp_shadoe_tag_bag_snapshot_v1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0.333 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 2 |

## Real Scene Holdout

Echte Szenedecks sind externe Reality-Check-Slots und bleiben von der Progression-Tuningbasis getrennt.

| Slot | Status | Runner Archetype | Corp Archetype | Runner | Corp | Reason |
| --- | --- | --- | --- | --- | --- | --- |

## Breaker Ontology Metrics

| Slot | Use | Profile | Runner Profiles Seen | Runner Coverage Used | Runner Fallback | Runner Install Ranked | Runner Search Ranked | Corp Visible Profiles | Corp Remote Safety Used | Corp Cheap Contest | Quote Conflict/Override | Coverage Signals | Fallback Evidence | Effective Quote Override |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| safety_smoke_demo_008 | safety_regression | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| safety_smoke_demo_008 | safety_regression | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| safety_smoke_demo_008 | safety_regression | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| safety_smoke_demo_008 | safety_regression | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_1 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_1 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_1 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_1 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## RemoteRole Ontology Metrics

| Slot | Use | Profile | Corp Profiles Seen | Corp Safety Used | Corp Scoring Used | Raised Safety | Inactive | Cheap Contest Blocked | Legacy Conflict | Bait Not Protection | Asset Not Protection | Runner Profiles Seen | Runner Trash Value | Kinds | Scopes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| safety_smoke_demo_008 | safety_regression | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| safety_smoke_demo_008 | safety_regression | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| safety_smoke_demo_008 | safety_regression | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| safety_smoke_demo_008 | safety_regression | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_1 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_1 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
| local_realistic_pair_1 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
| local_realistic_pair_1 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
| local_realistic_pair_2 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 2 | 2 |
| real_scene_pair_1 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 2 | 2 |
| real_scene_pair_2 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Tag/Punish Ontology Metrics

| Slot | Use | Profile | Profiles Seen | Tag Source Used | Payoff Used | Confirmed Punish Opp | Skipped Confirmed Opp | Converted | Expired | Tag Source With Payoff | Tag Source Without Payoff | Conflict | Kinds | Conditions |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| safety_smoke_demo_008 | safety_regression | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| safety_smoke_demo_008 | safety_regression | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| safety_smoke_demo_008 | safety_regression | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| safety_smoke_demo_008 | safety_regression | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_rig_vs_tax | progression_tuning | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | progression_tuning | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | belief_ai_v1_4_2 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 1 |
| snapshot_holdout_origin_pressure_vs_tag_ops | holdout_only | current_candidate | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 1 |
| local_realistic_pair_1 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_1 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_1 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_1 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| local_realistic_pair_2 | holdout_only | belief_ai_v1_4_2 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 1 |
| local_realistic_pair_2 | holdout_only | current_candidate | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 1 |
| real_scene_pair_1 | holdout_only | basic_corp_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_1 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | basic_corp_ai | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 |
| real_scene_pair_2 | holdout_only | basic_runner_ai | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| real_scene_pair_2 | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Metric Notes

`scoreActionsAvailable` zaehlt Corp-Entscheidungsfenster mit mindestens einer legalen Score-Action. `missedScoreWindows` zaehlt diese Fenster, wenn die Corp nicht scored. `finalAdvanceActions` zaehlt Remote-Agenda-Advances, die eine Agenda auf 0 oder 1 verbleibende Advances bringen. `unsafeFinalAdvanceActions` markiert diese Fenster bei hoher sichtbarer Runner-Contest-Gefahr oder schwachem Schutz. `protectBeforeAdvanceActions` zaehlt Remote-Schutzaktionen vor einer near-final Agenda. `relevantRemoteTrashTakeRate` misst genommene relevante und bezahlbare Remote-Trash-Gelegenheiten. `skippedAdvancedRemoteContest` zaehlt Runner-Fenster mit legaler Advanced-Remote-Run-Gelegenheit, in denen kein solcher Remote-Run gewaehlt wurde. Die `uniqueAdvancedRemoteThreats`-/`contestableAdvancedRemoteThreats`-Metriken deduplizieren diese Bedrohungen pro Match, Turn und Server und trennen echte Contest-Targets von Reserve-/Coverage-Blockern. `runnerDrawActions` zaehlt Click-Draw sowie Draw-/Setup-/Search-Karteneffekte. `drawThenDiscardSameTurn` zaehlt Runner-Draws, denen im selben Runner-Turn ein Discard-Choice folgt. `runnerLowValueDuplicateInstallActions` markiert installierte Zweitkopien mit niedrigem Grenznutzen wie Junkyard BBS. `handUseRate` misst, wie oft der Runner bei sichtbarer Economy-/Breaker-/Pressure-/Remote-Trash-Gelegenheit eine solche Hand-/Board-Aktion statt Draw/Filler nimmt. `runnerEndTurnCreditsBelowReserve`, `runnerRunsStartedBelowReserve` und `runsStartedAgainstKnownUnaffordablePath` messen Cashpool-/Spend-Discipline und bekannte ICE-Pfad-Bezahlbarkeit auf sichtbarer Information. `remoteBuildActions` zaehlt Remote-Installationen plus Run-Fenster-Rez-Aktionen. `remoteAdvanceActions` zaehlt Advances und explizite Advancement-Counter-Zuwaechse auf Remotes.