# Assets Semantic Review v2 Implementation Report

Datum: 2026-07-02

## Zusammenfassung

- Geprüfte Assets: 55
- Verankerte Karten: 42
- Support-only Karten: 13
- StrategySupportPairs: 49
- Review-Status: kleine Änderung=39, ändern=6, behalten=10
- Priorität: medium=45, low=10
- Neue Signale: condition.runner_has_two_or_more_tags, condition.runner_received_tag_this_turn, economy.corp_installed_credit_pool, economy.corp_rezzed_ice_cashout, risk.ongoing_payment_liability, risk.random_outcome

## Strategieanker-Verteilung

- corp.ambush_bluff: 10
- corp.asset_economy: 8
- corp.central_stabilize: 1
- corp.damage_kill: 6
- corp.draw_engine: 1
- corp.economy_rez_reserve: 2
- corp.fast_advance: 3
- corp.ice_tax_glacier: 5
- corp.remote_scoring: 2
- corp.tag_trace_punish: 11

## Support-only Karten

- ACME Savings and Loan (onr_v1_308_acme-savings-and-loan)
- Corporate Negotiating Center (onr_v1_314_corporate-negotiating-center)
- Cowboy Sysop (onr_v1_316_cowboy-sysop)
- Disinfectant, Inc. (onr_v1_319_disinfectant-inc)
- ESA Contract (onr_v1_321_esa-contract)
- Euromarket Consortium (onr_v1_322_euromarket-consortium)
- Nevinyrral (onr_v1_331_nevinyrral)
- Remote Facility (onr_v1_335_remote-facility)
- Rescheduler (onr_v1_336_rescheduler)
- Rustbelt HQ Branch (onr_v1_338_rustbelt-hq-branch)
- South African Mining Corp (onr_v1_343_south-african-mining-corp)
- Department of Misinformation (onr_proteus_056_department-of-misinformation)
- Syd Meyer Superstores (onr_proteus_076_syd-meyer-superstores)

## Verankerte Karten

- Indiscriminate Response Team (corp.central_stabilize -> defensive_tool/successful_run_grip_reset_defense (medium))
- Satellite Monitors (corp.tag_trace_punish -> enabler/run_count_start_turn_tag_source (medium))
- Strategic Planning Group (corp.draw_engine -> engine_anchor/recurring_draw_filter_engine (high))
- BBS Whispering Campaign (corp.asset_economy -> engine_anchor/installed_economy_engine (medium))
- Blood Cat (corp.tag_trace_punish -> enabler/trace_tag_source (medium))
- Braindance Campaign (corp.asset_economy -> engine_anchor/installed_economy_engine (medium))
- Chicago Branch (corp.fast_advance -> scoring_tool/advancement_enabler (high); corp.remote_scoring -> scoring_tool/advancement_enabler (medium))
- City Surveillance (corp.tag_trace_punish -> enabler/persistent_tag_source (high))
- Corprunner's Shattered Remains (corp.ambush_bluff -> punish_payoff/access_hardware_trash (high))
- Data Masons (corp.ice_tax_glacier -> tax_tool/ice_tax_support (high))
- Department of Truth Enhancement (corp.asset_economy -> engine_anchor/installed_economy_engine (medium))
- Encoder, Inc. (corp.ice_tax_glacier -> tax_tool/ice_tax_support (high))
- Experimental AI (corp.ambush_bluff -> punish_payoff/access_program_trash (high))
- Fortress Architects (corp.ice_tax_glacier -> tax_tool/ice_tax_support (medium))
- Hacker Tracker Central (corp.tag_trace_punish -> enabler/trace_credit_enabler (medium))
- Holovid Campaign (corp.asset_economy -> engine_anchor/installed_economy_engine (medium))
- I Got a Rock (corp.damage_kill -> win_condition/tagged_meat_payoff (medium); corp.tag_trace_punish -> win_condition/tagged_meat_payoff (medium))
- Information Laundering (corp.asset_economy -> engine_anchor/installed_economy_engine (medium))
- Investment Firm (corp.asset_economy -> engine_anchor/installed_economy_engine (medium))
- Krumz (corp.tag_trace_punish -> enabler/trace_credit_enabler (low))
- Newsgroup Taunting (corp.ice_tax_glacier -> tax_tool/run_tax_support (medium))
- Omniscience Foundation (corp.tag_trace_punish -> enabler/tag_snowball_followup (medium))
- Pacifica Regional AI (corp.fast_advance -> engine_anchor/fast_advance_action_engine (high))
- Rockerboy Promotion (corp.asset_economy -> engine_anchor/installed_economy_engine (medium))
- Schlaghund (corp.damage_kill -> win_condition/tagged_meat_payoff (medium); corp.tag_trace_punish -> win_condition/tagged_meat_payoff (medium))
- Setup! (corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (high))
- Skälderviken SA Beta Test Site (corp.ice_tax_glacier -> tax_tool/ice_tax_support (medium))
- Solo Squad (corp.damage_kill -> win_condition/tagged_meat_payoff (medium); corp.tag_trace_punish -> win_condition/tagged_meat_payoff (medium))
- Spinn® Public Relations (corp.asset_economy -> engine_anchor/installed_economy_engine (medium))
- TRAP! (corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (high); corp.tag_trace_punish -> enabler/access_tag_source (medium))
- Vacant Soulkiller (corp.ambush_bluff -> punish_payoff/access_brain_damage_payoff (high); corp.damage_kill -> punish_payoff/access_brain_damage_payoff (medium))
- Vapor Ops (corp.fast_advance -> scoring_tool/advancement_enabler (high))
- Virus Test Site (corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (high); corp.damage_kill -> punish_payoff/access_net_damage_payoff (medium))
- Bel-Digmo Antibody (corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (medium))
- Cybertech Think Tank (corp.damage_kill -> enabler/damage_amplifier (high))
- Doppelganger Antibody (corp.ambush_bluff -> punish_payoff/access_counter_credit_loss (medium))
- Executive Boot Camp (corp.economy_rez_reserve -> engine_anchor/install_rez_reserve (medium))
- Government Contract (corp.economy_rez_reserve -> engine_anchor/install_rez_reserve (high))
- LDL Traffic Analyzers (corp.tag_trace_punish -> enabler/trace_credit_enabler (medium))
- Pattel Antibody (corp.ambush_bluff -> punish_payoff/access_counter_icebreaker_strength (medium))
- Siren (corp.remote_scoring -> defensive_tool/remote_run_control (high))
- Stereogram Antibody (corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (medium))

## Neue Taktiksignale

| Signal | Gruppe | supportOnly | mayAnchorStrategy | Beispiele |
|---|---:|---:|---:|---|
| condition.runner_has_two_or_more_tags | assets_v2_conditions | true | false | I Got a Rock |
| condition.runner_received_tag_this_turn | assets_v2_conditions | true | false | Omniscience Foundation |
| economy.corp_installed_credit_pool | assets_v2_economy | true | false | BBS Whispering Campaign<br>Rockerboy Promotion |
| economy.corp_rezzed_ice_cashout | assets_v2_economy | true | false | Syd Meyer Superstores |
| risk.ongoing_payment_liability | assets_v2_risk_condition | true | false | ACME Savings and Loan |
| risk.random_outcome | assets_v2_risk_condition | true | false | Satellite Monitors<br>Schlaghund |

## Vorher/Nachher je Karte

| Karte | Status | Priorität | Geändert | Taktiksignale vorher | Taktiksignale nachher | Strategie vorher | Strategie nachher | Pairs vorher | Pairs nachher |
|---|---:|---:|---|---|---|---|---|---|---|
| Indiscriminate Response Team (onr_classic_019_indiscriminate-response-team) | kleine Änderung | medium | strategySupportPairs | run.successful_run_grip_reset | run.successful_run_grip_reset | corp.central_stabilize / defensive_tool | corp.central_stabilize / defensive_tool |  | corp.central_stabilize -> defensive_tool/successful_run_grip_reset_defense (medium) |
| Satellite Monitors (onr_classic_021_satellite-monitors) | kleine Änderung | medium | tacticSignals, strategySupportPairs | condition.multiple_runs_last_turn<br>tag.source | condition.runner_attempted_run_last_turn<br>risk.random_outcome<br>tag.source | corp.tag_trace_punish / enabler | corp.tag_trace_punish / enabler |  | corp.tag_trace_punish -> enabler/run_count_start_turn_tag_source (medium) |
| Strategic Planning Group (onr_classic_025_strategic-planning-group) | ändern | medium | tacticSignals, lineSupport, strategySupportPairs | draw.corp_draw<br>hq.corp_hand_refresh | draw.corp_draw<br>draw.corp_recurring<br>hq.corp_hand_filter | corp.central_stabilize / engine_anchor | corp.draw_engine / engine_anchor |  | corp.draw_engine -> engine_anchor/recurring_draw_filter_engine (high) |
| ACME Savings and Loan (onr_v1_308_acme-savings-and-loan) | ändern | medium | tacticSignals, lineSupport, strategicRole | economy.corp_credit_burst<br>risk.agenda_point_cost<br>risk.loss_condition | economy.corp_credit_burst<br>risk.agenda_point_cost<br>risk.loss_condition<br>risk.ongoing_payment_liability | corp.asset_economy / engine_anchor |  /  |  |  |
| BBS Whispering Campaign (onr_v1_309_bbs-whispering-campaign) | kleine Änderung | medium | tacticSignals, strategySupportPairs | economy.corp_installed_credit_drip<br>remote.asset_economy | economy.corp_installed_credit_pool<br>remote.asset_economy | corp.asset_economy / engine_anchor | corp.asset_economy / engine_anchor |  | corp.asset_economy -> engine_anchor/installed_economy_engine (medium) |
| Blood Cat (onr_v1_310_blood-cat) | kleine Änderung | medium | strategySupportPairs | tag.source<br>trace.source | tag.source<br>trace.source | corp.tag_trace_punish / enabler | corp.tag_trace_punish / enabler |  | corp.tag_trace_punish -> enabler/trace_tag_source (medium) |
| Braindance Campaign (onr_v1_311_braindance-campaign) | kleine Änderung | medium | strategySupportPairs | economy.corp_installed_credit_drip<br>remote.asset_economy | economy.corp_installed_credit_drip<br>remote.asset_economy | corp.asset_economy / engine_anchor | corp.asset_economy / engine_anchor |  | corp.asset_economy -> engine_anchor/installed_economy_engine (medium) |
| Chicago Branch (onr_v1_312_chicago-branch) | kleine Änderung | medium | tacticSignals, strategySupportPairs | advance.corp_counter_placement<br>advance.score_window_support<br>remote.scoring_protection | advance.corp_counter_placement<br>advance.score_window_support | corp.fast_advance<br>corp.remote_scoring / scoring_tool | corp.fast_advance<br>corp.remote_scoring / scoring_tool |  | corp.fast_advance -> scoring_tool/advancement_enabler (high)<br>corp.remote_scoring -> scoring_tool/advancement_enabler (medium) |
| City Surveillance (onr_v1_313_city-surveillance) | kleine Änderung | medium | strategySupportPairs | tag.corp_persistent_source<br>tag.source<br>tax.runner_credit | tag.corp_persistent_source<br>tag.source<br>tax.runner_credit | corp.tag_trace_punish / enabler | corp.tag_trace_punish / enabler |  | corp.tag_trace_punish -> enabler/persistent_tag_source (high) |
| Corporate Negotiating Center (onr_v1_314_corporate-negotiating-center) | behalten | low | keine Datenänderung | economy.corp_hq_agenda_reveal_credit<br>info.hq_agenda_reveal<br>risk.reveal_hq_agendas | economy.corp_hq_agenda_reveal_credit<br>info.hq_agenda_reveal<br>risk.reveal_hq_agendas |  /  |  /  |  |  |
| Corprunner's Shattered Remains (onr_v1_315_corprunners-shattered-remains) | ändern | medium | strategicRole, strategySupportPairs | access.corp_hardware_trash<br>access.punish<br>advance.corp_counter_bank<br>remote.ambush | access.corp_hardware_trash<br>access.punish<br>advance.corp_counter_bank<br>remote.ambush | corp.ambush_bluff / support_tool | corp.ambush_bluff / punish_payoff |  | corp.ambush_bluff -> punish_payoff/access_hardware_trash (high) |
| Cowboy Sysop (onr_v1_316_cowboy-sysop) | behalten | low | keine Datenänderung | hq.corp_installed_card_bounce<br>install.corp_uninstall_to_hq | hq.corp_installed_card_bounce<br>install.corp_uninstall_to_hq |  /  |  /  |  |  |
| Data Masons (onr_v1_317_data-masons) | kleine Änderung | medium | strategySupportPairs | ice.corp_rez_discount<br>ice.corp_strength_support<br>tax.ice | ice.corp_rez_discount<br>ice.corp_strength_support<br>tax.ice | corp.ice_tax_glacier / tax_tool | corp.ice_tax_glacier / tax_tool |  | corp.ice_tax_glacier -> tax_tool/ice_tax_support (high) |
| Department of Truth Enhancement (onr_v1_318_department-of-truth-enhancement) | kleine Änderung | medium | tacticSignals, strategySupportPairs | economy.corp_action_charged_bank<br>economy.corp_charge_bank<br>economy.corp_counter_bank<br>remote.asset_economy | economy.corp_action_charged_bank<br>economy.corp_counter_bank<br>remote.asset_economy | corp.asset_economy / engine_anchor | corp.asset_economy / engine_anchor |  | corp.asset_economy -> engine_anchor/installed_economy_engine (medium) |
| Disinfectant, Inc. (onr_v1_319_disinfectant-inc) | behalten | low | keine Datenänderung | virus.corp_counter_prevention | virus.corp_counter_prevention |  /  |  /  |  |  |
| Encoder, Inc. (onr_v1_320_encoder-inc) | kleine Änderung | medium | strategySupportPairs | ice.corp_rez_discount<br>ice.corp_subroutine_support<br>tax.ice | ice.corp_rez_discount<br>ice.corp_subroutine_support<br>tax.ice | corp.ice_tax_glacier / tax_tool | corp.ice_tax_glacier / tax_tool |  | corp.ice_tax_glacier -> tax_tool/ice_tax_support (high) |
| ESA Contract (onr_v1_321_esa-contract) | behalten | low | keine Datenänderung | draw.corp_draw | draw.corp_draw |  /  |  /  |  |  |
| Euromarket Consortium (onr_v1_322_euromarket-consortium) | behalten | low | keine Datenänderung | draw.corp_draw<br>setup.corp_hand_size | draw.corp_draw<br>setup.corp_hand_size |  /  |  /  |  |  |
| Experimental AI (onr_v1_323_experimental-ai) | kleine Änderung | medium | strategySupportPairs | access.corp_program_trash<br>access.punish<br>advance.corp_counter_bank<br>remote.ambush | access.corp_program_trash<br>access.punish<br>advance.corp_counter_bank<br>remote.ambush | corp.ambush_bluff / punish_payoff | corp.ambush_bluff / punish_payoff |  | corp.ambush_bluff -> punish_payoff/access_program_trash (high) |
| Fortress Architects (onr_v1_324_fortress-architects) | kleine Änderung | medium | tacticSignals, lineSupport, strategicRole, strategySupportPairs | economy.rez_discount<br>ice.corp_install_discount<br>tax.ice | ice.corp_install_discount<br>tax.ice | corp.economy_rez_reserve<br>corp.ice_tax_glacier / engine_anchor<br>tax_tool | corp.ice_tax_glacier / tax_tool |  | corp.ice_tax_glacier -> tax_tool/ice_tax_support (medium) |
| Hacker Tracker Central (onr_v1_325_hacker-tracker-central) | kleine Änderung | medium | tacticSignals, strategySupportPairs | economy.corp_trace_credit_support<br>trace.corp_credit_support | trace.corp_credit_support | corp.tag_trace_punish / enabler | corp.tag_trace_punish / enabler |  | corp.tag_trace_punish -> enabler/trace_credit_enabler (medium) |
| Holovid Campaign (onr_v1_326_holovid-campaign) | kleine Änderung | medium | strategySupportPairs | economy.corp_installed_credit_drip<br>remote.asset_economy | economy.corp_installed_credit_drip<br>remote.asset_economy | corp.asset_economy / engine_anchor | corp.asset_economy / engine_anchor |  | corp.asset_economy -> engine_anchor/installed_economy_engine (medium) |
| I Got a Rock (onr_v1_327_i-got-a-rock) | kleine Änderung | medium | tacticSignals, strategySupportPairs | damage.corp_tagged_meat_payoff<br>damage.payoff<br>risk.requires_tagged_runner<br>tag.payoff | condition.runner_has_two_or_more_tags<br>damage.corp_tagged_meat_payoff<br>damage.payoff<br>risk.agenda_point_cost<br>tag.payoff | corp.damage_kill<br>corp.tag_trace_punish / win_condition | corp.damage_kill<br>corp.tag_trace_punish / win_condition |  | corp.damage_kill -> win_condition/tagged_meat_payoff (medium)<br>corp.tag_trace_punish -> win_condition/tagged_meat_payoff (medium) |
| Information Laundering (onr_v1_328_information-laundering) | kleine Änderung | medium | tacticSignals, strategySupportPairs | advance.corp_counter_bank<br>economy.corp_advanceable_cashout<br>economy.corp_counter_cashout<br>remote.asset_economy | advance.corp_counter_bank<br>economy.corp_counter_cashout<br>remote.asset_economy | corp.asset_economy / engine_anchor | corp.asset_economy / engine_anchor |  | corp.asset_economy -> engine_anchor/installed_economy_engine (medium) |
| Investment Firm (onr_v1_329_investment-firm) | kleine Änderung | medium | strategySupportPairs | economy.corp_counter_bank<br>economy.corp_installed_credit_drip<br>remote.asset_economy | economy.corp_counter_bank<br>economy.corp_installed_credit_drip<br>remote.asset_economy | corp.asset_economy / engine_anchor | corp.asset_economy / engine_anchor |  | corp.asset_economy -> engine_anchor/installed_economy_engine (medium) |
| Krumz (onr_v1_330_krumz) | kleine Änderung | medium | tacticSignals, strategySupportPairs | economy.corp_trace_credit_support<br>trace.corp_credit_support | trace.corp_credit_support | corp.tag_trace_punish / enabler | corp.tag_trace_punish / enabler |  | corp.tag_trace_punish -> enabler/trace_credit_enabler (low) |
| Nevinyrral (onr_v1_331_nevinyrral) | behalten | low | keine Datenänderung | action.corp_repeatable_extra_action<br>risk.leaves_play_loss<br>risk.loss_condition | action.corp_repeatable_extra_action<br>risk.leaves_play_loss<br>risk.loss_condition |  /  |  /  |  |  |
| Newsgroup Taunting (onr_v1_332_newsgroup-taunting) | kleine Änderung | medium | strategySupportPairs | run.corp_start_tax<br>tax.runner_credit | run.corp_start_tax<br>tax.runner_credit | corp.ice_tax_glacier / tax_tool | corp.ice_tax_glacier / tax_tool |  | corp.ice_tax_glacier -> tax_tool/run_tax_support (medium) |
| Omniscience Foundation (onr_v1_333_omniscience-foundation) | kleine Änderung | medium | tacticSignals, strategySupportPairs | risk.requires_tagged_runner<br>tag.additional_tag_followup<br>tag.payoff | condition.runner_received_tag_this_turn<br>tag.additional_tag_followup | corp.tag_trace_punish / enabler | corp.tag_trace_punish / enabler |  | corp.tag_trace_punish -> enabler/tag_snowball_followup (medium) |
| Pacifica Regional AI (onr_v1_334_pacifica-regional-ai) | kleine Änderung | medium | strategySupportPairs | action.corp_counter_to_action<br>advance.corp_counter_bank<br>advance.score_window_support | action.corp_counter_to_action<br>advance.corp_counter_bank<br>advance.score_window_support | corp.fast_advance / engine_anchor | corp.fast_advance / engine_anchor |  | corp.fast_advance -> engine_anchor/fast_advance_action_engine (high) |
| Remote Facility (onr_v1_335_remote-facility) | behalten | low | keine Datenänderung | action.corp_repeatable_extra_action | action.corp_repeatable_extra_action |  /  |  /  |  |  |
| Rescheduler (onr_v1_336_rescheduler) | behalten | low | keine Datenänderung | draw.corp_draw<br>hq.corp_hand_filter<br>hq.corp_hand_refresh<br>rnd.corp_shuffle_hq_into_rnd | draw.corp_draw<br>hq.corp_hand_filter<br>hq.corp_hand_refresh<br>rnd.corp_shuffle_hq_into_rnd |  /  |  /  |  |  |
| Rockerboy Promotion (onr_v1_337_rockerboy-promotion) | kleine Änderung | medium | tacticSignals, strategySupportPairs | economy.corp_installed_credit_drip<br>remote.asset_economy | economy.corp_installed_credit_pool<br>remote.asset_economy | corp.asset_economy / engine_anchor | corp.asset_economy / engine_anchor |  | corp.asset_economy -> engine_anchor/installed_economy_engine (medium) |
| Rustbelt HQ Branch (onr_v1_338_rustbelt-hq-branch) | behalten | low | keine Datenänderung | setup.corp_hand_size | setup.corp_hand_size |  /  |  /  |  |  |
| Schlaghund (onr_v1_339_schlaghund) | kleine Änderung | medium | tacticSignals, strategySupportPairs | damage.corp_tagged_meat_payoff<br>damage.payoff<br>risk.random_action<br>risk.requires_tagged_runner<br>tag.payoff | condition.requires_tagged_runner<br>damage.corp_tagged_meat_payoff<br>damage.payoff<br>risk.random_outcome<br>tag.payoff | corp.damage_kill<br>corp.tag_trace_punish / win_condition | corp.damage_kill<br>corp.tag_trace_punish / win_condition |  | corp.damage_kill -> win_condition/tagged_meat_payoff (medium)<br>corp.tag_trace_punish -> win_condition/tagged_meat_payoff (medium) |
| Setup! (onr_v1_340_setup) | kleine Änderung | medium | strategySupportPairs | access.archives_safe_exception<br>access.corp_net_damage_ambush<br>access.punish<br>access.rnd_reveal_requirement<br>damage.payoff<br>remote.ambush | access.archives_safe_exception<br>access.corp_net_damage_ambush<br>access.punish<br>access.rnd_reveal_requirement<br>damage.payoff<br>remote.ambush | corp.ambush_bluff / punish_payoff | corp.ambush_bluff / punish_payoff |  | corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (high) |
| Skälderviken SA Beta Test Site (onr_v1_341_skalderviken-sa-beta-test-site) | kleine Änderung | medium | strategySupportPairs | ice.corp_rez_discount<br>tax.ice | ice.corp_rez_discount<br>tax.ice | corp.ice_tax_glacier / tax_tool | corp.ice_tax_glacier / tax_tool |  | corp.ice_tax_glacier -> tax_tool/ice_tax_support (medium) |
| Solo Squad (onr_v1_342_solo-squad) | kleine Änderung | medium | tacticSignals, strategySupportPairs | damage.corp_tagged_meat_payoff<br>damage.payoff<br>risk.requires_tagged_runner<br>tag.payoff | condition.requires_tagged_runner<br>damage.corp_tagged_meat_payoff<br>damage.payoff<br>tag.payoff | corp.damage_kill<br>corp.tag_trace_punish / win_condition | corp.damage_kill<br>corp.tag_trace_punish / win_condition |  | corp.damage_kill -> win_condition/tagged_meat_payoff (medium)<br>corp.tag_trace_punish -> win_condition/tagged_meat_payoff (medium) |
| South African Mining Corp (onr_v1_343_south-african-mining-corp) | ändern | medium | tacticSignals, lineSupport, strategicRole | economy.corp_multi_action_credit<br>remote.asset_economy | economy.corp_multi_action_credit | corp.asset_economy / punish_payoff |  /  |  |  |
| Spinn® Public Relations (onr_v1_344_spinn-public-relations) | kleine Änderung | medium | strategySupportPairs | economy.corp_counter_bank<br>economy.corp_installed_credit_drip<br>remote.asset_economy | economy.corp_counter_bank<br>economy.corp_installed_credit_drip<br>remote.asset_economy | corp.asset_economy / engine_anchor | corp.asset_economy / engine_anchor |  | corp.asset_economy -> engine_anchor/installed_economy_engine (medium) |
| TRAP! (onr_v1_345_trap) | kleine Änderung | medium | strategicRole, strategySupportPairs | access.archives_safe_exception<br>access.corp_net_damage_ambush<br>access.corp_tag_ambush<br>access.punish<br>access.rnd_reveal_requirement<br>damage.payoff<br>remote.ambush<br>tag.source | access.archives_safe_exception<br>access.corp_net_damage_ambush<br>access.corp_tag_ambush<br>access.punish<br>access.rnd_reveal_requirement<br>damage.payoff<br>remote.ambush<br>tag.source | corp.ambush_bluff<br>corp.tag_trace_punish / enabler<br>punish_payoff | corp.ambush_bluff<br>corp.tag_trace_punish / punish_payoff<br>enabler |  | corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (high)<br>corp.tag_trace_punish -> enabler/access_tag_source (medium) |
| Vacant Soulkiller (onr_v1_346_vacant-soulkiller) | kleine Änderung | medium | strategySupportPairs | access.corp_brain_damage_ambush<br>access.punish<br>advance.corp_counter_bank<br>damage.payoff<br>remote.ambush | access.corp_brain_damage_ambush<br>access.punish<br>advance.corp_counter_bank<br>damage.payoff<br>remote.ambush | corp.ambush_bluff<br>corp.damage_kill / punish_payoff | corp.ambush_bluff<br>corp.damage_kill / punish_payoff |  | corp.ambush_bluff -> punish_payoff/access_brain_damage_payoff (high)<br>corp.damage_kill -> punish_payoff/access_brain_damage_payoff (medium) |
| Vapor Ops (onr_v1_347_vapor-ops) | kleine Änderung | medium | tacticSignals, strategySupportPairs | advance.corp_counter_bank<br>advance.corp_counter_transfer<br>advance.score_window_support<br>economy.corp_counter_bank | advance.corp_counter_bank<br>advance.corp_counter_transfer<br>advance.score_window_support<br>economy.corp_counter_cashout | corp.fast_advance / scoring_tool | corp.fast_advance / scoring_tool |  | corp.fast_advance -> scoring_tool/advancement_enabler (high) |
| Virus Test Site (onr_v1_348_virus-test-site) | kleine Änderung | medium | strategySupportPairs | access.archives_safe_exception<br>access.corp_net_damage_ambush<br>access.punish<br>access.rnd_reveal_requirement<br>advance.corp_counter_bank<br>damage.payoff<br>remote.ambush | access.archives_safe_exception<br>access.corp_net_damage_ambush<br>access.punish<br>access.rnd_reveal_requirement<br>advance.corp_counter_bank<br>damage.payoff<br>remote.ambush | corp.ambush_bluff<br>corp.damage_kill / punish_payoff | corp.ambush_bluff<br>corp.damage_kill / punish_payoff |  | corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (high)<br>corp.damage_kill -> punish_payoff/access_net_damage_payoff (medium) |
| Bel-Digmo Antibody (onr_proteus_054_bel-digmo-antibody) | kleine Änderung | medium | strategySupportPairs | access.corp_net_damage_ambush<br>access.corp_rnd_net_damage_ambush<br>access.punish<br>access.rnd_reveal_requirement<br>damage.payoff<br>rnd.corp_self_shuffle_access | access.corp_net_damage_ambush<br>access.corp_rnd_net_damage_ambush<br>access.punish<br>access.rnd_reveal_requirement<br>damage.payoff<br>rnd.corp_self_shuffle_access | corp.ambush_bluff / punish_payoff | corp.ambush_bluff / punish_payoff |  | corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (medium) |
| Cybertech Think Tank (onr_proteus_055_cybertech-think-tank) | ändern | medium | tacticSignals, strategicRole, strategySupportPairs | advance.corp_counter_bank<br>damage.corp_damage_amplifier<br>damage.payoff | advance.corp_counter_bank<br>damage.corp_damage_amplifier | corp.damage_kill / win_condition | corp.damage_kill / enabler |  | corp.damage_kill -> enabler/damage_amplifier (high) |
| Department of Misinformation (onr_proteus_056_department-of-misinformation) | behalten | low | keine Datenänderung | expose.corp_prevention | expose.corp_prevention |  /  |  /  |  |  |
| Doppelganger Antibody (onr_proteus_057_doppelganger-antibody) | kleine Änderung | medium | strategySupportPairs | access.archives_safe_exception<br>access.corp_counter_punish<br>access.corp_credit_loss_counter<br>access.punish<br>access.rnd_reveal_requirement | access.archives_safe_exception<br>access.corp_counter_punish<br>access.corp_credit_loss_counter<br>access.punish<br>access.rnd_reveal_requirement | corp.ambush_bluff / punish_payoff | corp.ambush_bluff / punish_payoff |  | corp.ambush_bluff -> punish_payoff/access_counter_credit_loss (medium) |
| Executive Boot Camp (onr_proteus_058_executive-boot-camp) | kleine Änderung | medium | strategySupportPairs | economy.corp_run_temporary_credit<br>risk.random_discard_cost<br>risk.temporary_credit_drawback | economy.corp_run_temporary_credit<br>risk.random_discard_cost<br>risk.temporary_credit_drawback | corp.economy_rez_reserve / engine_anchor | corp.economy_rez_reserve / engine_anchor |  | corp.economy_rez_reserve -> engine_anchor/install_rez_reserve (medium) |
| Government Contract (onr_proteus_059_government-contract) | kleine Änderung | medium | tacticSignals, strategySupportPairs, conditions | advance.corp_counter_bank<br>economy.advanceable<br>economy.corp_install_rez_credit<br>risk.temporary_credit_drawback | advance.corp_counter_bank<br>economy.corp_counter_cashout<br>economy.corp_install_rez_credit<br>risk.temporary_credit_drawback | corp.economy_rez_reserve / engine_anchor | corp.economy_rez_reserve / engine_anchor |  | corp.economy_rez_reserve -> engine_anchor/install_rez_reserve (high) |
| LDL Traffic Analyzers (onr_proteus_061_ldl-traffic-analyzers) | kleine Änderung | medium | tacticSignals, strategySupportPairs | advance.corp_counter_bank<br>economy.corp_trace_credit_support<br>risk.temporary_credit_drawback<br>trace.corp_credit_support | advance.corp_counter_bank<br>risk.temporary_credit_drawback<br>trace.corp_credit_support | corp.tag_trace_punish / enabler | corp.tag_trace_punish / enabler |  | corp.tag_trace_punish -> enabler/trace_credit_enabler (medium) |
| Pattel Antibody (onr_proteus_068_pattel-antibody) | kleine Änderung | medium | strategySupportPairs | access.archives_safe_exception<br>access.corp_counter_punish<br>access.corp_icebreaker_strength_counter<br>access.punish<br>access.rnd_reveal_requirement | access.archives_safe_exception<br>access.corp_counter_punish<br>access.corp_icebreaker_strength_counter<br>access.punish<br>access.rnd_reveal_requirement | corp.ambush_bluff / punish_payoff | corp.ambush_bluff / punish_payoff |  | corp.ambush_bluff -> punish_payoff/access_counter_icebreaker_strength (medium) |
| Siren (onr_proteus_074_siren) | kleine Änderung | medium | strategySupportPairs | remote.scoring_protection<br>run.corp_redirect | remote.scoring_protection<br>run.corp_redirect | corp.remote_scoring / defensive_tool | corp.remote_scoring / defensive_tool |  | corp.remote_scoring -> defensive_tool/remote_run_control (high) |
| Stereogram Antibody (onr_proteus_075_stereogram-antibody) | kleine Änderung | medium | strategySupportPairs | access.corp_archives_net_damage_ambush<br>access.corp_net_damage_ambush<br>access.punish<br>damage.payoff<br>rnd.corp_self_shuffle_access | access.corp_archives_net_damage_ambush<br>access.corp_net_damage_ambush<br>access.punish<br>damage.payoff<br>rnd.corp_self_shuffle_access | corp.ambush_bluff / punish_payoff | corp.ambush_bluff / punish_payoff |  | corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (medium) |
| Syd Meyer Superstores (onr_proteus_076_syd-meyer-superstores) | ändern | medium | tacticSignals, lineSupport, strategicRole | economy.corp_asset_cashout<br>ice.corp_self_trash_cost<br>risk.trash_own_rezzed_ice | economy.corp_rezzed_ice_cashout<br>ice.corp_self_trash_cost<br>risk.trash_own_rezzed_ice | corp.asset_economy / punish_payoff |  /  |  |  |

## Target-/Constraint- und Rationale-Review

| Karte | Target/Constraints | Rationale |
|---|---|---|
| Indiscriminate Response Team (onr_classic_019_indiscriminate-response-team) | kein TargetProfile; Runner-Handidentitäten bleiben verborgen, der Effekt ist nur als erfolgreicher-Run-Folgefenster relevant | Current-Hint ist fachlich brauchbar; es fehlt nur die hierarchische Pair-Ebene. |
| Satellite Monitors (onr_classic_021_satellite-monitors) | kein Zielwahlprofil; Bedingung ist vergangene Runner-Run-Anzahl plus Würfel-/Zufallsauflösung | `condition.multiple_runs_last_turn` ist zu eng und nicht kanonisch; der Effekt funktioniert ab einem Run und skaliert mit Run-Anzahl. Der Würfelwurf gehört als Risiko/Outcome sichtbar dazu. |
| Strategic Planning Group (onr_classic_025_strategic-planning-group) | Controller-only Kartenwahl; gezogene Kartenidentitäten dürfen nicht in öffentliche oder Runner-seitige AI-Inputs gelangen | Anker `corp.draw_engine` bleibt richtig; roleDetail sollte nicht `start_turn_*` heißen, weil der Effekt bei jedem Corp-Draw triggert. |
| ACME Savings and Loan (onr_v1_308_acme-savings-and-loan) | schema_gap: long_term_liability_payment_choice | Starker, aber selbst-trashender One-shot-Burst mit Agenda-Kosten und Lose-Game-Liability; das ist keine Asset-Economy-Engine und sollte keine Decklinie allein ankern. |
| BBS Whispering Campaign (onr_v1_309_bbs-whispering-campaign) | not_required | Preloaded action-withdrawal pool, kein Drip. `corp.asset_economy` bleibt als installed economy engine. |
| Blood Cat (onr_v1_310_blood-cat) | candidate: use_target:runner | Trace 5 in Tag; kein Trace-Credit-Enabler. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Braindance Campaign (onr_v1_311_braindance-campaign) | not_required | Start-of-turn installed economy creates asset-economy pressure; Gray Ops remains only a subtype. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Chicago Branch (onr_v1_312_chicago-branch) | candidate: use_target:installed_advanceable_card | `remote.scoring_protection` ist für Chicago Branch ungenau; die Karte schützt nicht, sie beschleunigt Advancement/Scorefenster. |
| City Surveillance (onr_v1_313_city-surveillance) | not_required | Persistent draw-linked tag pressure is a tag source, not a tagged payoff. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Corporate Negotiating Center (onr_v1_314_corporate-negotiating-center) | not_required | HQ-Agenda-Reveal-Economy with explicit reveal risk; no high-difficulty agenda risk. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Corprunner's Shattered Remains (onr_v1_315_corprunners-shattered-remains) | candidate: use_target:installed_hardware | Hardware-Trash-Access-Ambush ohne Tag-/Tagged-Logik. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Cowboy Sysop (onr_v1_316_cowboy-sysop) | schema_gap: corp_private_installed_card_to_hq_choice | Uninstall eigener installierter Karte nach HQ; keine Archives-Recovery. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Data Masons (onr_v1_317_data-masons) | not_required | Static Wall scope is a constraint, not a TargetProfile. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Department of Truth Enhancement (onr_v1_318_department-of-truth-enhancement) | not_required | `economy.corp_charge_bank` ist redundant; action-charged bank plus counter bank genügt. |
| Disinfectant, Inc. (onr_v1_319_disinfectant-inc) | not_required | Virus-counter prevention is defensive utility, not a generic Corp virus strategy. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Encoder, Inc. (onr_v1_320_encoder-inc) | not_required | Static Code-Gate scope is a constraint, not a TargetProfile. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| ESA Contract (onr_v1_321_esa-contract) | not_required | Corp Draw, nicht Credit-Economy. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Euromarket Consortium (onr_v1_322_euromarket-consortium) | not_required | Draw und Corp-Handsize, kein Score-Kontext. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Experimental AI (onr_v1_323_experimental-ai) | candidate: use_target:installed_program | Access program trash is a concrete ambush payoff; AI/Ambush subtypes remain card data. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Fortress Architects (onr_v1_324_fortress-architects) | not_required | `economy.rez_discount` ist fachlich falsch, weil die Karte Installationskosten senkt. Der zweite Economy-Reserve-Anker ist zu stark. |
| Hacker Tracker Central (onr_v1_325_hacker-tracker-central) | not_required | `economy.corp_trace_credit_support` und `trace.corp_credit_support` sind Synonyme; das trace.*-Signal ist präziser. |
| Holovid Campaign (onr_v1_326_holovid-campaign) | not_required | Installed credit drip creates asset-economy pressure; Advertisement remains a subtype. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| I Got a Rock (onr_v1_327_i-got-a-rock) | candidate: use_target:runner | Die Voraussetzung ist spezifisch „zwei oder mehr Tags“, nicht nur tagged; die Agenda-Punkt-Zahlung muss als Risiko/Kosten sichtbar sein. |
| Information Laundering (onr_v1_328_information-laundering) | candidate: use_target:self_advancement_counter_count | `economy.corp_advanceable_cashout` und `economy.corp_counter_cashout` doppeln sich hier; Counter-Cashout reicht zusammen mit `advance.corp_counter_bank`. |
| Investment Firm (onr_v1_329_investment-firm) | not_required | Banked installed economy supports asset economy; Transactions remains card data. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Krumz (onr_v1_330_krumz) | not_required | Trace-credit support nicht doppelt als economy.* und trace.* führen. |
| Nevinyrral (onr_v1_331_nevinyrral) | not_required | Repeatable extra action with lose-game risk; no automatic Fast-Advance/Remote-Scoring anchor. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Newsgroup Taunting (onr_v1_332_newsgroup-taunting) | not_required | Start-of-run credit tax supports tax/glacier without creating run legality. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Omniscience Foundation (onr_v1_333_omniscience-foundation) | not_required | Die Bedingung ist „Runner received a tag this turn“, nicht „Runner is tagged“. `tag.payoff` ist hier zu grob. |
| Pacifica Regional AI (onr_v1_334_pacifica-regional-ai) | candidate: use_target:self_advancement_counter_count | Advancement-counter-to-action conversion remains a plausible Fast-Advance anchor. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Remote Facility (onr_v1_335_remote-facility) | not_required | Repeatable extra action remains a tactic signal; Fast-Advance/Remote-Scoring anchor deferred because no direct score conversion is encoded. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Rescheduler (onr_v1_336_rescheduler) | schema_gap: private_hq_shuffle_and_draw_count | HQ in R&D mischen und gleich viele Karten ziehen ist Hand-Refresh, kein kontrolliertes Topdeck-Setup. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Rockerboy Promotion (onr_v1_337_rockerboy-promotion) | not_required | Preloaded action-withdrawal pool, kein Drip. `corp.asset_economy` bleibt als installed economy engine. |
| Rustbelt HQ Branch (onr_v1_338_rustbelt-hq-branch) | not_required | Corp-Handsize, kein Score-Kontext. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Schlaghund (onr_v1_339_schlaghund) | candidate: use_target:runner | `risk.random_action` beschreibt die Karte falsch; die Aktion ist gewählt, nur das Ergebnis ist zufällig. |
| Setup! (onr_v1_340_setup) | not_required | Net-Damage-Access-Ambush; `damage.payoff` bleibt nur Oberklasse, kein Damage-Kill-Anker. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Skälderviken SA Beta Test Site (onr_v1_341_skalderviken-sa-beta-test-site) | not_required | Static Black-ICE scope is a constraint, not a TargetProfile. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Solo Squad (onr_v1_342_solo-squad) | candidate: use_target:runner | `requires_tagged_runner` ist eine Condition, kein Risiko. |
| South African Mining Corp (onr_v1_343_south-african-mining-corp) | not_required | Drei Aktionen für 6 Credits ist generische, action-intensive Economy. Kein Remote-/Asset-Economy-Anker und kein punish_payoff/payoff_anchor. |
| Spinn® Public Relations (onr_v1_344_spinn-public-relations) | not_required | Installed banked economy supports asset economy without using Transactions as signal. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| TRAP! (onr_v1_345_trap) | not_required | Access-Net-Damage plus Access-Tag-Ambush; die Tag-Rolle ist nicht persistent. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Vacant Soulkiller (onr_v1_346_vacant-soulkiller) | not_required | Brain-Damage-Ambush nach Advancement Countern; keine Meat-Damage-Rolle. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Vapor Ops (onr_v1_347_vapor-ops) | candidate: use_target:installed_advanceable_card | Die Credit-Funktion ist Counter-Cashout, nicht nur ein Economy-Counter-Bank-Signal. |
| Virus Test Site (onr_v1_348_virus-test-site) | not_required | Net-Damage-Ambush skaliert mit Advancement Countern; keine Meat-Damage-Rolle. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Bel-Digmo Antibody (onr_proteus_054_bel-digmo-antibody) | not_required | R&D-Access-Net-Damage plus Reveal/Self-Shuffle. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Cybertech Think Tank (onr_proteus_055_cybertech-think-tank) | schema_gap: use_target:damage_source | `damage.payoff` ist für einen reinen Amplifier zu grob; die Karte liefert keinen eigenen Schaden. |
| Department of Misinformation (onr_proteus_056_department-of-misinformation) | candidate: use_target:corp_card_expose_attempt | Expose prevention is defensive utility and not automatically remote contest. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Doppelganger Antibody (onr_proteus_057_doppelganger-antibody) | not_required | Counter-Punish konkret als Runner-Credit-Loss-Counter. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Executive Boot Camp (onr_proteus_058_executive-boot-camp) | schema_gap: private_random_discard_cost | Temporary run-only credits support rez/trace reserve with explicit random discard and temporary-credit drawbacks. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Government Contract (onr_proteus_059_government-contract) | candidate: use_target:install_or_rez_payment | `economy.advanceable` ist zu generisch; Counter-Cashout plus Install/Rez-Credit beschreibt die Funktion präziser. `requires_during_run` sollte aus den Conditions entfernt werden. |
| LDL Traffic Analyzers (onr_proteus_061_ldl-traffic-analyzers) | candidate: use_target:trace_attempt | Trace-credit support nicht doppelt als economy.* und trace.* führen. |
| Pattel Antibody (onr_proteus_068_pattel-antibody) | candidate: use_target:installed_icebreaker | Counter-Punish konkret als Icebreaker-Strength-Counter. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Siren (onr_proteus_074_siren) | schema_gap: run_redirect_fort_choice | Run redirect/control supports remote defense but adds no planner or legality behavior. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Stereogram Antibody (onr_proteus_075_stereogram-antibody) | not_required | Archives selbst ist der Trigger; keine Archives-safe-exception. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals. |
| Syd Meyer Superstores (onr_proteus_076_syd-meyer-superstores) | candidate: use_target:own_rezzed_ice | Die Karte casht eigenes rezzed ICE aus, nicht ein Asset. Das ist Economy/ICE-Sacrifice-Utility mit Drawback, kein Asset-Economy-Anker. |

## Verifikation

- node scripts/check-assets-semantic-review-v2.mjs passed
- JSON-Parse der geänderten AI-Hint- und Signaldateien erfolgreich.
- `git diff --check` erfolgreich.
- pnpm --filter @netgrid/ai test -- hint-ontology blocked before test execution by ERR_PNPM_IGNORED_BUILDS for esbuild@0.27.7 and sharp@0.34.5; generated pnpm-workspace.yaml allowBuilds placeholder was reverted.
