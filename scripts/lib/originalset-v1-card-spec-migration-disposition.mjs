export const ORIGINALSET_V1_ADDRESSABLE_FAMILIES = new Set([
  "abilities",
  "accessEffects",
  "accessHooks",
  "agendaAccessReplacement",
  "corpTrashInstalledRunnerSource",
  "corpUtility",
  "damagePreventionSources",
  "flatlineReplacementSources",
  "fortRunWindows",
  "hiddenReplacementLongtail",
  "icebreakerAbilities",
  "iceEncounter",
  "icebreakerSubtypeChange",
  "installTargetBinding",
  "printedSubroutines",
  "relativeIce",
  "remainingReplacementLongtail",
  "runnerCounterEffects",
  "runnerEventLongtail",
  "runnerEventTargetedEffect",
  "runnerRunStrengthBoost",
  "runEncounterInterventions",
  "runnerUtilityLongtail",
  "scoredAgenda",
  "successfulRunFollowups",
  "tagPreventionSources",
  "trashPreventionSources",
  "uniqueDirectLongtail",
  "variableRez",
  "virusCounter",
]);

// Planning annotations are historical authoring evidence only. Every accepted
// value below is non-mechanical and every discarded role is explicitly owned
// by the typed CardSpec compiler/Engine projection instead.
export const ORIGINALSET_V1_PLANNING_PLAN_ROLES = new Set([
  "agenda_reward",
  "avoid_tags",
  "bait_runner",
  "build_economy",
  "build_rig",
  "build_scoring_remote",
  "click_for_credits_when_safe",
  "contest_remote",
  "defend_server",
  "draw_for_answers",
  "economy",
  "hardware_pressure",
  "hidden_information_pressure",
  "information",
  "managed_risk_economy",
  "pressure_hq",
  "pressure_remote",
  "pressure_rnd",
  "program_pressure",
  "protect_hq",
  "protect_remote",
  "protect_rig",
  "protect_rnd",
  "protect_virus_counters",
  "punish_tagged_runner",
  "recover_cards",
  "recover_economy",
  "recover_rig",
  "remote_asset_agenda_support",
  "remote_asset_control",
  "remote_asset_economy",
  "remote_asset_finisher",
  "remote_asset_modifier",
  "remote_asset_pressure",
  "remote_asset_run_start_tax",
  "remote_asset_trap",
  "remote_upgrade_agenda_support",
  "remote_upgrade_modifier",
  "remote_upgrade_reactive_defense",
  "remote_upgrade_rez_support",
  "remote_upgrade_support",
  "remote_upgrade_tax",
  "remote_upgrade_trap",
  "rez_expensive_ice_after_score",
  "run_pressure",
  "run_punish",
  "run_start_damage",
  "run_support",
  "safe_probe_run",
  "score_next_turn",
  "score_now",
  "survive_core_damage",
  "survive_damage",
  "survive_meat_damage",
  "survive_net_damage",
  "tag_pressure",
  "tag_punish",
  "trace_bid_support",
  "trace_defense",
  "trace_pressure",
  "wall_remote_plan",
]);

export const ORIGINALSET_V1_MECHANICAL_PLAN_ROLES = new Set([
  "break_walls",
  "clear_tags",
  "corp_after_pass_ice_random_end_run",
  "corp_agenda_ability",
  "corp_agenda_operation",
  "corp_asset_tag_checked_damage",
  "corp_install_ice",
  "corp_operation_choice",
  "corp_play_operation",
  "corp_rez_ice",
  "corp_rez_root_asset",
  "corp_rez_root_upgrade",
  "corp_score_agenda",
  "delayed_install",
  "draw",
  "increase_link",
  "post_bid_trace_link",
  "runner_access_trash_economy",
  "runner_agenda_pressure",
  "runner_choice_gain_all_default",
  "runner_deck_memory_recurring_credit",
  "runner_defensive_event",
  "runner_event_choice",
  "runner_event_playful_ai_dice_loop",
  "runner_hq_run_counter",
  "runner_install_hardware",
  "runner_install_program",
  "runner_install_resource",
  "runner_killer_run_credit_support",
  "runner_play_event",
  "runner_program_ability",
  "runner_start_run_strength_roll",
  "runner_start_turn_random_hq_reveal",
  "runner_start_turn_random_resource",
  "runner_trace_bid_support",
  "score_agenda",
  "successful_hq_run_payoff",
]);

export const ORIGINALSET_V1_PLANNING_TACTIC_INTERPRETATIONS = Object.freeze({
  "access.punish": Object.freeze({
    signal: "access.punish",
    use: "access.punish",
  }),
  "corp.remote_protection": Object.freeze({
    signal: "corp.remote_protection",
    use: "corp.remote_protection",
  }),
  "coverage.breaker": Object.freeze({
    signal: "coverage.breaker",
    use: "coverage.breaker",
  }),
  "damage.payoff": Object.freeze({
    signal: "damage.payoff",
    use: "damage.payoff.runner",
  }),
  "damage.payoff.runner": Object.freeze({
    signal: "damage.payoff",
    use: "damage.payoff.runner",
  }),
  "draw.card": Object.freeze({ signal: "draw.card", use: "draw.card" }),
  "economy.card": Object.freeze({
    signal: "economy.card",
    use: "economy.card",
  }),
  "punish.payoff": Object.freeze({
    signal: "punish.payoff",
    use: "punish.payoff",
  }),
  "remote.ambush": Object.freeze({
    signal: "remote.ambush",
    use: "remote.ambush",
  }),
  "tag.payoff": Object.freeze({ signal: "tag.payoff", use: "tag.payoff" }),
});

// The complete pinned source ontology is fingerprinted so that new historical
// fields or token values cannot silently enter the canonical projection.
export const ORIGINALSET_V1_PLANNING_ONTOLOGY_FINGERPRINTS = Object.freeze({
  topLevelFields:
    "sha256:a9efa022ec3f2bf71a3467969527c9ee23108ae52b447935dd6897f5dbeb2579",
  planRoles:
    "sha256:aa16c8417c007ac9c71e4487f6677195d8f5cc32ef655bd877817080979027c2",
  strategicRoles:
    "sha256:b659f7a364314f3c59f96e16794a67939b5cef0660bcc01931dfa1e26a6d78c2",
  strategyAnchors:
    "sha256:2fbed398a9b1bb6857d76bb7a3eea0a1737bc76468015fa753ce58b85f48a7a6",
  lineSupport:
    "sha256:af749436445cb417d489052d5c5fb3e9ce008206885801bf7f2ae80b62af50f2",
  strategicExchangeKinds:
    "sha256:ffbe4016c6d4b003d1e9965a83096287db4e2a194f25ea620fc36522bc70af27",
  tacticSignalOntology:
    "sha256:624b3a48ea2d5ce82bc1ccae3ab6de7067cfc9e70a8965147a34040a2f6d336b",
  actionTacticSignalOntology:
    "sha256:3061f48bac0da53e65dacc47e51cc859373d716da80ca83ad517e3c4d423f371",
  remoteRoleOntology:
    "sha256:4786bce5e031ea8791683687291222de31891f4a2cf8a9668e5e7cb52746e45b",
  targetOntology:
    "sha256:882046dccd11c8d246e28334d52dad4df5130abe114c50df133d8e2ac6b48f76",
  strategyEvidenceOntology:
    "sha256:1c13a83e317eb50e52a0855d1118752e984ef607ed4ab7dbd9c0c5f757eb0f57",
  actionEvidenceOntology:
    "sha256:3e21f9ddb85c24e2ba27a9fce2e1f10756c7bdda137f55491e48bd6a0039092f",
});

// Exact reviewed capability binding for historical action-strategy evidence.
// Repeated printed mechanics are deliberately fanned out only where both
// semantic nodes implement the same reviewed action signal.
export const ORIGINALSET_V1_ACTION_STRATEGY_CAPABILITY_SLOTS = Object.freeze({
  "onr_v1_081_custodial-position": Object.freeze([
    "onr_v1_081_custodial-position:abilities:0",
  ]),
  "onr_v1_084_edited-shipping-manifests": Object.freeze([
    "onr_v1_084_edited-shipping-manifests:abilities:0",
  ]),
  "onr_v1_085_executive-wiretaps": Object.freeze([
    "onr_v1_085_executive-wiretaps:abilities:0",
  ]),
  "onr_v1_207_netwatch-operations-office": Object.freeze([
    "onr_v1_207_netwatch-operations-office:abilities:0",
  ]),
  "onr_v1_208_on-call-solo-team": Object.freeze([
    "onr_v1_208_on-call-solo-team:abilities:0",
  ]),
  "onr_v1_213_private-cybernet-police": Object.freeze([
    "onr_v1_213_private-cybernet-police:abilities:0",
  ]),
  "onr_v1_217_strike-force-kali": Object.freeze([
    "onr_v1_217_strike-force-kali:abilities:0",
  ]),
  "onr_v1_227_cerberus": Object.freeze([
    "onr_v1_227_cerberus:printedSubroutines:1",
  ]),
  "onr_v1_228_cinderella": Object.freeze([
    "onr_v1_228_cinderella:printedSubroutines:0",
  ]),
  "onr_v1_236_data-raven": Object.freeze([
    "onr_v1_236_data-raven:printedSubroutines:0",
  ]),
  "onr_v1_243_fetch-4-0-1": Object.freeze([
    "onr_v1_243_fetch-4-0-1:printedSubroutines:0",
  ]),
  "onr_v1_249_hunter": Object.freeze([
    "onr_v1_249_hunter:printedSubroutines:0",
  ]),
  "onr_v1_251_jack-attack": Object.freeze([
    "onr_v1_251_jack-attack:printedSubroutines:1",
  ]),
  "onr_v1_260_pocket-virtual-reality": Object.freeze([
    "onr_v1_260_pocket-virtual-reality:printedSubroutines:0",
    "onr_v1_260_pocket-virtual-reality:printedSubroutines:1",
  ]),
  "onr_v1_271_tko-2-0": Object.freeze([
    "onr_v1_271_tko-2-0:printedSubroutines:0",
  ]),
  "onr_v1_283_audit-of-call-records": Object.freeze([
    "onr_v1_283_audit-of-call-records:abilities:0",
  ]),
  "onr_v1_284_chance-observation": Object.freeze([
    "onr_v1_284_chance-observation:abilities:0",
  ]),
  "onr_v1_285_closed-accounts": Object.freeze([
    "onr_v1_285_closed-accounts:abilities:0",
  ]),
  "onr_v1_286_corporate-detective-agency": Object.freeze([
    "onr_v1_286_corporate-detective-agency:corpUtility:0",
  ]),
  "onr_v1_287_datapool-by-zetatech": Object.freeze([
    "onr_v1_287_datapool-by-zetatech:abilities:0",
  ]),
  "onr_v1_293_netwatch-credit-voucher": Object.freeze([
    "onr_v1_293_netwatch-credit-voucher:abilities:0",
  ]),
  "onr_v1_299_power-grid-overload": Object.freeze([
    "onr_v1_299_power-grid-overload:corpUtility:0",
  ]),
  "onr_v1_301_punitive-counterstrike": Object.freeze([
    "onr_v1_301_punitive-counterstrike:abilities:0",
  ]),
  "onr_v1_302_scorched-earth": Object.freeze([
    "onr_v1_302_scorched-earth:abilities:0",
  ]),
  "onr_v1_306_trojan-horse": Object.freeze([
    "onr_v1_306_trojan-horse:corpUtility:0",
  ]),
  "onr_v1_307_urban-renewal": Object.freeze([
    "onr_v1_307_urban-renewal:abilities:0",
  ]),
  "onr_v1_310_blood-cat": Object.freeze([
    "onr_v1_310_blood-cat:abilities:0",
  ]),
  "onr_v1_313_city-surveillance": Object.freeze([
    "onr_v1_313_city-surveillance:remainingReplacementLongtail:0",
  ]),
  "onr_v1_327_i-got-a-rock": Object.freeze([
    "onr_v1_327_i-got-a-rock:uniqueDirectLongtail:0",
  ]),
  "onr_v1_333_omniscience-foundation": Object.freeze([
    "onr_v1_333_omniscience-foundation:corpUtility:0",
  ]),
  "onr_v1_339_schlaghund": Object.freeze([
    "onr_v1_339_schlaghund:uniqueDirectLongtail:0",
  ]),
  "onr_v1_342_solo-squad": Object.freeze([
    "onr_v1_342_solo-squad:abilities:0",
  ]),
  "onr_v1_345_trap": Object.freeze([
    "onr_v1_345_trap:accessEffects:0",
  ]),
  "onr_v1_356_dedicated-response-team": Object.freeze([
    "onr_v1_356_dedicated-response-team:accessEffects:0",
  ]),
  "onr_v1_372_turbeau-delacroix": Object.freeze([
    "onr_v1_372_turbeau-delacroix:accessEffects:0",
  ]),
});

export const ORIGINALSET_V1_UNADDRESSABLE_ACTION_STRATEGY_DISPOSITIONS =
  Object.freeze({
    "onr_v1_129_hq-interface":
      "discard_modifier_has_no_addressable_capability_node",
    "onr_v1_139_r-and-d-interface":
      "discard_modifier_has_no_addressable_capability_node",
  });

export const ORIGINALSET_V1_VALUE_HINT_DISPOSITIONS = Object.freeze({
  discardedAxes: Object.freeze(["damage"]),
  discardedSlots: Object.freeze([
    "onr_v1_327_i-got-a-rock:remoteRootValue",
    "onr_v1_344_spinn-public-relations:economy",
    "onr_v1_344_spinn-public-relations:remoteRootValue",
  ]),
});

// Reviewed semantic disposition. These keys are never inferred by the adapter.
const ORIGINALSET_V1_LEGACY_CAPABILITY_KEYS = Object.freeze({
  "onr_v1_024_expert-schedule-analyzer:accessHooks:0":
    "access_hooks_post_access_private_look",
  "onr_v1_041_microtech-ai-interface:accessHooks:0":
    "access_hooks_pre_access_rd_cut",
  "onr_v1_088_fortress-respecification:hiddenReplacementLongtail:0":
    "hidden_replacement_longtail_successful_run_fort_ice_reorder",
  "onr_v1_111_social-engineering:hiddenReplacementLongtail:0":
    "hidden_replacement_longtail_secret_spend_guess_then_targeted_bypass_run",
  "onr_v1_155_code-viral-cache:corpTrashInstalledRunnerSource:0":
    "corp_trash_installed_runner_source_corp_trash_installed_runner_resource",
  "onr_v1_155_code-viral-cache:hiddenReplacementLongtail:0":
    "hidden_replacement_longtail_purge_replacement_with_runner_virus_counter_cleanup",
  "onr_v1_157_crash-everett-inventive-fixer:remainingReplacementLongtail:0":
    "remaining_replacement_longtail_hidden_draw_keep_or_top_replacement",
  "onr_v1_173_restrictive-net-zoning:installTargetBinding:0":
    "install_target_binding_choose_data_fort_on_install",
  "onr_v1_176_the-shell-traders:hiddenReplacementLongtail:0":
    "hidden_replacement_longtail_delayed_install_with_counter_countdown",
  "onr_v1_187_wilson-weeflerunner-apprentice:remainingReplacementLongtail:0":
    "remaining_replacement_longtail_run_action_spending_cap",
  "onr_v1_294_new-blood:hiddenReplacementLongtail:0":
    "hidden_replacement_longtail_conceal_and_reorder_installed_ice",
  "onr_v1_308_acme-savings-and-loan:remainingReplacementLongtail:0":
    "remaining_replacement_longtail_obligation_debt",
  "onr_v1_313_city-surveillance:remainingReplacementLongtail:0":
    "remaining_replacement_longtail_runner_draw_tax_tag",
  "onr_v1_325_hacker-tracker-central:remainingReplacementLongtail:0":
    "remaining_replacement_longtail_trace_bit_counter_pool_asset",
  "onr_v1_329_investment-firm:remainingReplacementLongtail:0":
    "remaining_replacement_longtail_basic_credit_diversion_to_recurring_credits",
  "onr_v1_351_bizarre-encryption-scheme:hiddenReplacementLongtail:0":
    "hidden_replacement_longtail_delayed_agenda_access_replacement",
  "onr_v1_354_crybaby:remainingReplacementLongtail:0":
    "remaining_replacement_longtail_link_reduction_counter_upgrade",
  "onr_v1_065_smarteye:runEncounterInterventions:0":
    "run_encounter_interventions_approach_ice_expose_then_jack_out_before_rez",
  "onr_v1_067_speed-trap:runEncounterInterventions:0":
    "run_encounter_interventions_jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
  "onr_v1_188_ai-chief-financial-officer:scoredAgenda:0":
    "scored_agenda_shuffle_hq_archives_into_rd_then_draw",
  "onr_v1_190_bioweapons-engineering:scoredAgenda:0":
    "scored_agenda_meat_damage_bonus",
  "onr_v1_192_corporate-boon:abilities:0":
    "abilities_activated_corp_main_gain_actions",
  "onr_v1_192_corporate-boon:scoredAgenda:0":
    "scored_agenda_add_counters_on_score_boon",
  "onr_v1_193_corporate-coup:abilities:0":
    "abilities_activated_corp_main_take_hosted_credits",
  "onr_v1_194_corporate-downsizing:scoredAgenda:0":
    "scored_agenda_shuffle_selected_hq_agendas_into_rd_gain_credits",
  "onr_v1_195_corporate-retreat:scoredAgenda:0":
    "scored_agenda_scored_agenda_credit_until_install_or_rez_mark",
  "onr_v1_196_corporate-war:scoredAgenda:0":
    "scored_agenda_score_credit_swing_if_corp_credit_threshold_met",
  "onr_v1_199_employee-empowerment:abilities:0":
    "abilities_activated_corp_main_draw_cards",
  "onr_v1_199_employee-empowerment:scoredAgenda:0":
    "scored_agenda_corp_start_turn_optional_draw",
  "onr_v1_200_encryption-breakthrough:scoredAgenda:0":
    "scored_agenda_reveal_installed_ice_subtype_for_credits",
  "onr_v1_203_hostile-takeover:scoredAgenda:0":
    "scored_agenda_gain_credits_on_score",
  "onr_v1_204_ice-transmutation:scoredAgenda:0":
    "scored_agenda_select_rezzed_ice_mark_modifier_mark",
  "onr_v1_206_marine-arcology:abilities:0":
    "abilities_activated_corp_main_gain_credits",
  "onr_v1_207_netwatch-operations-office:abilities:0":
    "abilities_activated_corp_main_trace",
  "onr_v1_208_on-call-solo-team:abilities:0":
    "abilities_activated_corp_main_damage",
  "onr_v1_209_political-coup:abilities:0":
    "abilities_activated_corp_main_take_hosted_credits",
  "onr_v1_210_political-overthrow:abilities:0":
    "abilities_activated_corp_main_gain_credits",
  "onr_v1_212_priority-requisition:scoredAgenda:0":
    "scored_agenda_score_rez_installed_ice_at_no_cost",
  "onr_v1_213_private-cybernet-police:abilities:0":
    "abilities_activated_corp_main_trace",
  "onr_v1_214_project-babylon:scoredAgenda:0":
    "scored_agenda_overadvance_bonus_agenda_points",
  "onr_v1_215_security-net-optimization:scoredAgenda:0":
    "scored_agenda_choose_fort_ice_strength_bonus",
  "onr_v1_216_security-purge:scoredAgenda:0":
    "scored_agenda_reveal_top_rd_install_and_rez_ice_trash_rest",
  "onr_v1_217_strike-force-kali:abilities:0":
    "abilities_activated_corp_main_damage",
  "onr_v1_219_superior-net-barriers:scoredAgenda:0":
    "scored_agenda_reveal_installed_ice_subtype_for_credits",
  "onr_v1_309_bbs-whispering-campaign:abilities:0":
    "abilities_activated_corp_main_take_hosted_credits",
  "onr_v1_310_blood-cat:abilities:0": "abilities_activated_corp_main_trace",
  "onr_v1_312_chicago-branch:abilities:0":
    "abilities_activated_corp_main_distribute_advancement_counters",
  "onr_v1_315_corprunners-shattered-remains:accessEffects:0":
    "access_effects_on_access_trash_installed_runner_cards",
  "onr_v1_316_cowboy-sysop:corpUtility:0":
    "corp_utility_move_installed_corp_card_to_hq",
  "onr_v1_318_department-of-truth-enhancement:abilities:0":
    "abilities_activated_corp_main_add_hosted_credits",
  "onr_v1_318_department-of-truth-enhancement:abilities:1":
    "abilities_activated_corp_main_take_hosted_credits",
  "onr_v1_319_disinfectant-inc:corpUtility:0":
    "corp_utility_counter_prevention_replacement",
  "onr_v1_321_esa-contract:abilities:0":
    "abilities_activated_corp_main_draw_cards",
  "onr_v1_322_euromarket-consortium:abilities:0":
    "abilities_activated_corp_main_draw_cards",
  "onr_v1_323_experimental-ai:accessEffects:0":
    "access_effects_on_access_trash_installed_runner_cards",
  "onr_v1_327_i-got-a-rock:uniqueDirectLongtail:0":
    "unique_direct_longtail_tagged_meat_damage_meat",
  "onr_v1_328_information-laundering:abilities:0":
    "abilities_activated_corp_main_gain_credits_per_advancement_counter_on_source",
  "onr_v1_330_krumz:corpUtility:0":
    "corp_utility_recurring_trace_credit_pool_bit",
  "onr_v1_331_nevinyrral:uniqueDirectLongtail:0":
    "unique_direct_longtail_rezzed_leave_action_gain_asset",
  "onr_v1_332_newsgroup-taunting:corpUtility:0": "corp_utility_run_start_tax",
  "onr_v1_333_omniscience-foundation:corpUtility:0":
    "corp_utility_end_turn_tag_if_runner_received_tag",
  "onr_v1_334_pacifica-regional-ai:abilities:0":
    "abilities_activated_corp_main_gain_actions",
  "onr_v1_336_rescheduler:corpUtility:0":
    "corp_utility_shuffle_hq_into_rd_then_draw_same_count",
  "onr_v1_337_rockerboy-promotion:abilities:0":
    "abilities_activated_corp_main_take_hosted_credits",
  "onr_v1_339_schlaghund:uniqueDirectLongtail:0":
    "unique_direct_longtail_tag_threshold_meat_damage_asset_meat",
  "onr_v1_340_setup:accessEffects:0": "access_effects_on_access_damage",
  "onr_v1_342_solo-squad:abilities:0": "abilities_activated_corp_main_damage",
  "onr_v1_343_south-african-mining-corp:abilities:0":
    "abilities_activated_corp_main_gain_credits",
  "onr_v1_344_spinn-public-relations:abilities:0":
    "abilities_activated_corp_main_add_hosted_credits",
  "onr_v1_345_trap:accessEffects:0": "access_effects_on_access_damage",
  "onr_v1_346_vacant-soulkiller:accessEffects:0":
    "access_effects_on_access_damage_from_source_advancement_counters",
  "onr_v1_347_vapor-ops:abilities:0":
    "abilities_activated_corp_main_gain_credits",
  "onr_v1_347_vapor-ops:abilities:1":
    "abilities_activated_corp_main_move_advancement_counters",
  "onr_v1_221_asp:printedSubroutines:0": "printed_subroutines_trace",
  "onr_v1_222_ball-and-chain:printedSubroutines:0":
    "printed_subroutines_run_duration_encounter_cost_or_end_run",
  "onr_v1_223_banpei:printedSubroutines:0": "printed_subroutines_trash_program",
  "onr_v1_223_banpei:printedSubroutines:1": "printed_subroutines_end_the_run",
  "onr_v1_224_bolter-cluster:printedSubroutines:0":
    "printed_subroutines_damage_net",
  "onr_v1_224_bolter-cluster:printedSubroutines:1":
    "printed_subroutines_prohibit_break_next_ice",
  "onr_v1_225_canis-major:printedSubroutines:0":
    "printed_subroutines_run_duration_ice_strength",
  "onr_v1_226_canis-minor:printedSubroutines:0":
    "printed_subroutines_run_duration_ice_strength",
  "onr_v1_227_cerberus:printedSubroutines:0": "printed_subroutines_damage_net",
  "onr_v1_227_cerberus:printedSubroutines:1": "printed_subroutines_trace",
  "onr_v1_227_cerberus:printedSubroutines:2": "printed_subroutines_end_the_run",
  "onr_v1_227_cerberus:runnerCounterEffects:0":
    "runner_counter_effects_cerberus",
  "onr_v1_228_cinderella:printedSubroutines:0": "printed_subroutines_trace",
  "onr_v1_229_code-corpse:printedSubroutines:0":
    "printed_subroutines_damage_brain",
  "onr_v1_229_code-corpse:printedSubroutines:1":
    "printed_subroutines_damage_brain_a",
  "onr_v1_229_code-corpse:printedSubroutines:2":
    "printed_subroutines_end_the_run",
  "onr_v1_230_cortical-scanner:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_230_cortical-scanner:printedSubroutines:1":
    "printed_subroutines_end_the_run_a",
  "onr_v1_230_cortical-scanner:printedSubroutines:2":
    "printed_subroutines_end_the_run_b",
  "onr_v1_231_cortical-scrub:printedSubroutines:0":
    "printed_subroutines_damage_brain",
  "onr_v1_231_cortical-scrub:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_232_crystal-wall:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_233_d-arc-knight:printedSubroutines:0":
    "printed_subroutines_trash_program",
  "onr_v1_233_d-arc-knight:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_234_data-darts:printedSubroutines:0":
    "printed_subroutines_damage_net",
  "onr_v1_234_data-darts:printedSubroutines:1":
    "printed_subroutines_prohibit_break_next_ice",
  "onr_v1_235_data-naga:printedSubroutines:0":
    "printed_subroutines_trash_program",
  "onr_v1_235_data-naga:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_236_data-raven:printedSubroutines:0": "printed_subroutines_trace",
  "onr_v1_236_data-raven:runnerCounterEffects:0":
    "runner_counter_effects_trace_tag_counter",
  "onr_v1_238_data-wall-2-0:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_237_data-wall:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_239_endless-corridor:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_239_endless-corridor:printedSubroutines:1":
    "printed_subroutines_end_the_run_a",
  "onr_v1_241_fang-2-0:printedSubroutines:0": "printed_subroutines_trace",
  "onr_v1_240_fang:printedSubroutines:0": "printed_subroutines_trace",
  "onr_v1_242_fatal-attractor:printedSubroutines:0":
    "printed_subroutines_next_encounter_unless_fully_break_damage_net",
  "onr_v1_243_fetch-4-0-1:printedSubroutines:0": "printed_subroutines_trace",
  "onr_v1_244_filter:printedSubroutines:0": "printed_subroutines_end_the_run",
  "onr_v1_245_fire-wall:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_246_fragmentation-storm:printedSubroutines:0":
    "printed_subroutines_trace",
  "onr_v1_247_haunting-inquisition:printedSubroutines:0":
    "printed_subroutines_runner_run_lock_actions",
  "onr_v1_247_haunting-inquisition:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_248_homewrecker:printedSubroutines:0": "printed_subroutines_trace",
  "onr_v1_249_hunter:printedSubroutines:0": "printed_subroutines_trace",
  "onr_v1_250_ice-pick-willie:printedSubroutines:0":
    "printed_subroutines_trash_program",
  "onr_v1_250_ice-pick-willie:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_251_jack-attack:printedSubroutines:0":
    "printed_subroutines_run_duration_cannot_jack_out",
  "onr_v1_251_jack-attack:printedSubroutines:1": "printed_subroutines_trace",
  "onr_v1_252_keeper:printedSubroutines:0": "printed_subroutines_end_the_run",
  "onr_v1_253_laser-wire:printedSubroutines:0":
    "printed_subroutines_damage_net",
  "onr_v1_253_laser-wire:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_254_liche:printedSubroutines:0": "printed_subroutines_damage_brain",
  "onr_v1_254_liche:printedSubroutines:1": "printed_subroutines_damage_brain_a",
  "onr_v1_254_liche:printedSubroutines:2": "printed_subroutines_damage_brain_b",
  "onr_v1_254_liche:printedSubroutines:3": "printed_subroutines_end_the_run",
  "onr_v1_255_mastiff:printedSubroutines:0": "printed_subroutines_damage_brain",
  "onr_v1_255_mastiff:printedSubroutines:1": "printed_subroutines_damage_net",
  "onr_v1_255_mastiff:printedSubroutines:2":
    "printed_subroutines_run_duration_ice_strength",
  "onr_v1_255_mastiff:printedSubroutines:3": "printed_subroutines_trace",
  "onr_v1_255_mastiff:printedSubroutines:4": "printed_subroutines_end_the_run",
  "onr_v1_255_mastiff:runnerCounterEffects:0": "runner_counter_effects_mastiff",
  "onr_v1_256_mazer:printedSubroutines:0": "printed_subroutines_end_the_run",
  "onr_v1_257_nerve-labyrinth:printedSubroutines:0":
    "printed_subroutines_damage_net",
  "onr_v1_257_nerve-labyrinth:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_258_neural-blade:printedSubroutines:0":
    "printed_subroutines_damage_net",
  "onr_v1_258_neural-blade:printedSubroutines:1":
    "printed_subroutines_prohibit_break_next_ice",
  "onr_v1_259_in-the-face:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_260_pocket-virtual-reality:iceEncounter:0":
    "ice_encounter_add_encounter_temporary_credits",
  "onr_v1_260_pocket-virtual-reality:printedSubroutines:0":
    "printed_subroutines_trace",
  "onr_v1_260_pocket-virtual-reality:printedSubroutines:1":
    "printed_subroutines_trace_a",
  "onr_v1_261_quandary:printedSubroutines:0": "printed_subroutines_end_the_run",
  "onr_v1_262_razor-wire:printedSubroutines:0":
    "printed_subroutines_damage_net",
  "onr_v1_262_razor-wire:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_263_reinforced-wall:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_263_reinforced-wall:printedSubroutines:1":
    "printed_subroutines_end_the_run_a",
  "onr_v1_264_rex:printedSubroutines:0": "printed_subroutines_trace",
  "onr_v1_265_rock-is-strong:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_266_scramble:printedSubroutines:0": "printed_subroutines_end_the_run",
  "onr_v1_267_sentinels-prime:printedSubroutines:0":
    "printed_subroutines_trash_program",
  "onr_v1_267_sentinels-prime:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_268_shock-r:printedSubroutines:0":
    "printed_subroutines_prohibit_break_and_jack_out_next_ice",
  "onr_v1_269_shotgun-wire:printedSubroutines:0":
    "printed_subroutines_damage_net",
  "onr_v1_269_shotgun-wire:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_270_sleeper:printedSubroutines:0": "printed_subroutines_end_the_run",
  "onr_v1_271_tko-2-0:printedSubroutines:0":
    "printed_subroutines_runner_forgoes_next_action",
  "onr_v1_271_tko-2-0:printedSubroutines:1": "printed_subroutines_end_the_run",
  "onr_v1_272_too-many-doors:printedSubroutines:0":
    "printed_subroutines_secret_spend_compare_end_run_unless_corp_spent_at_least_runner",
  "onr_v1_273_triggerman:printedSubroutines:0":
    "printed_subroutines_trash_program",
  "onr_v1_273_triggerman:printedSubroutines:1":
    "printed_subroutines_end_the_run",
  "onr_v1_274_tutor:printedSubroutines:0":
    "printed_subroutines_run_duration_additional_subroutine",
  "onr_v1_275_vacuum-link:printedSubroutines:0":
    "printed_subroutines_random_resume_from_rezzed_ice_back_or_jack_out",
  "onr_v1_276_viral-15:printedSubroutines:0":
    "printed_subroutines_run_duration_jack_out_cost",
  "onr_v1_276_viral-15:printedSubroutines:1":
    "printed_subroutines_run_duration_trash_program_after_passing_rezzed_ice_unless_jack_out",
  "onr_v1_277_virizz:printedSubroutines:0":
    "printed_subroutines_run_duration_break_subroutine_cost",
  "onr_v1_278_wall-of-ice:printedSubroutines:0":
    "printed_subroutines_damage_net",
  "onr_v1_278_wall-of-ice:printedSubroutines:1":
    "printed_subroutines_damage_net_a",
  "onr_v1_278_wall-of-ice:printedSubroutines:2":
    "printed_subroutines_end_the_run",
  "onr_v1_278_wall-of-ice:printedSubroutines:3":
    "printed_subroutines_end_the_run_a",
  "onr_v1_279_wall-of-static:printedSubroutines:0":
    "printed_subroutines_end_the_run",
  "onr_v1_280_zombie:printedSubroutines:0": "printed_subroutines_damage_brain",
  "onr_v1_280_zombie:printedSubroutines:1":
    "printed_subroutines_damage_brain_a",
  "onr_v1_280_zombie:printedSubroutines:2": "printed_subroutines_end_the_run",
  "onr_v1_281_accounts-receivable:abilities:0":
    "abilities_on_play_gain_credits",
  "onr_v1_282_annual-reviews:abilities:0": "abilities_on_play_draw_cards",
  "onr_v1_283_audit-of-call-records:abilities:0": "abilities_on_play_trace",
  "onr_v1_284_chance-observation:abilities:0": "abilities_on_play_trace",
  "onr_v1_285_closed-accounts:abilities:0": "abilities_on_play_lose_credits",
  "onr_v1_286_corporate-detective-agency:corpUtility:0":
    "corp_utility_trash_runner_resources_if_tagged",
  "onr_v1_287_datapool-by-zetatech:abilities:0": "abilities_on_play_add_tags",
  "onr_v1_288_day-shift:abilities:0": "abilities_on_play_draw_cards",
  "onr_v1_289_edgerunner-inc-temps:corpUtility:0":
    "corp_utility_gain_restricted_install_actions",
  "onr_v1_290_efficiency-experts:abilities:0": "abilities_on_play_gain_credits",
  "onr_v1_291_falsified-transactions-expert:abilities:0":
    "abilities_on_play_move_advancement_counters",
  "onr_v1_292_management-shake-up:abilities:0":
    "abilities_on_play_distribute_advancement_counters",
  "onr_v1_293_netwatch-credit-voucher:abilities:0":
    "abilities_on_play_add_tags",
  "onr_v1_295_night-shift:abilities:0": "abilities_on_play_gain_credits",
  "onr_v1_296_off-site-backups:corpUtility:0":
    "corp_utility_corp_archives_to_hq",
  "onr_v1_297_overtime-incentives:abilities:0":
    "abilities_on_play_gain_actions",
  "onr_v1_298_planning-consultants:corpUtility:0":
    "corp_utility_corp_rd_top_reorder",
  "onr_v1_299_power-grid-overload:corpUtility:0":
    "corp_utility_installed_hardware_trash_by_counter",
  "onr_v1_300_project-consultants:abilities:0":
    "abilities_on_play_distribute_advancement_counters",
  "onr_v1_301_punitive-counterstrike:abilities:0": "abilities_on_play_damage",
  "onr_v1_302_scorched-earth:abilities:0": "abilities_on_play_damage",
  "onr_v1_303_silver-lining-recovery-protocol:corpUtility:0":
    "corp_utility_gain_credits_from_stolen_agenda_advancement_history",
  "onr_v1_304_systematic-layoffs:abilities:0":
    "abilities_on_play_distribute_advancement_counters",
  "onr_v1_305_team-restructuring:abilities:0":
    "abilities_on_play_distribute_advancement_counters",
  "onr_v1_306_trojan-horse:corpUtility:0": "corp_utility_encounter_tag",
  "onr_v1_307_urban-renewal:abilities:0": "abilities_on_play_damage",
  "onr_v1_349_aardvark:fortRunWindows:0":
    "fort_run_windows_aardvark_worm_lock_and_reaction_during_run_on_this_fort",
  "onr_v1_353_chimera:accessEffects:0":
    "access_effects_on_access_trash_installed_runner_cards",
  "onr_v1_354_crybaby:accessEffects:0":
    "access_effects_on_access_add_runner_counter",
  "onr_v1_354_crybaby:runnerCounterEffects:0": "runner_counter_effects_crying",
  "onr_v1_356_dedicated-response-team:accessEffects:0":
    "access_effects_on_access_damage",
  "onr_v1_357_dieter-esslin:accessEffects:0": "access_effects_on_access_damage",
  "onr_v1_358_dr-dreff:fortRunWindows:0":
    "fort_run_windows_temporary_hq_ice_encounter_after_successful_run_before_successful_run_finalizes_on_this_fort",
  "onr_v1_359_jenny-jett:fortRunWindows:0":
    "fort_run_windows_install_hq_ice_innermost_after_successful_run_before_successful_run_finalizes_on_this_fort",
  "onr_v1_363_olivia-salazar:fortRunWindows:0":
    "fort_run_windows_discounted_rez_ice_on_this_fort_during_run_on_this_fort",
  "onr_v1_364_omni-kismet-ph-d:fortRunWindows:0":
    "fort_run_windows_swap_unrezzed_fort_ice_with_hq_ice_during_run_on_this_fort",
  "onr_v1_365_paris-city-grid:fortRunWindows:0":
    "fort_run_windows_corp_trace_bits_during_runs_on_this_fort_bit_during_run_on_this_fort",
  "onr_v1_367_rio-de-janeiro-city-grid:fortRunWindows:0":
    "fort_run_windows_roll_die_on_pass_rezzed_ice_on_same_fort_pass_rezzed_ice_on_this_fort",
  "onr_v1_369_singapore-city-grid:fortRunWindows:0":
    "fort_run_windows_swap_unrezzed_fort_ice_with_hq_ice_during_run_on_this_fort",
  "onr_v1_371_tokyo-chiba-infighting:fortRunWindows:0":
    "fort_run_windows_gain_credits_after_unsuccessful_run_on_same_fort_after_unsuccessful_run_on_this_fort",
  "onr_v1_372_turbeau-delacroix:accessEffects:0":
    "access_effects_on_access_trace",
  "onr_v1_373_twenty-four-hour-surveillance:fortRunWindows:0":
    "fort_run_windows_block_stealth_bits_during_runs_on_this_fort_during_run_on_this_fort",
  "onr_v1_120_armadillo-armored-road-home:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_121_armored-fridge:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_123_bodyweight-data-creche:successfulRunFollowups:0":
    "successful_run_followups_optional_make_run_after_successful_run",
  "onr_v1_125_dermatech-bodyplating:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_127_full-body-conversion:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_128_green-knight-surge-buffers:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_130_lifesaver-nanosurgeons:abilities:0":
    "abilities_activated_runner_main_draw_cards",
  "onr_v1_130_lifesaver-nanosurgeons:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_131_microtech-backup-drive:runnerUtilityLongtail:0":
    "runner_utility_longtail_replace_installed_program_trash_with_host_on_source",
  "onr_v1_132_microtech-trode-set:runnerUtilityLongtail:0":
    "runner_utility_longtail_access_point_subroutine_modifier",
  "onr_v1_135_nasuko-cycle:tagPreventionSources:0":
    "tag_prevention_sources_avoid_tag",
  "onr_v1_140_raven-microcyb-eagle:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_142_record-reconstructor:abilities:0":
    "abilities_activated_runner_main_make_run",
  "onr_v1_143_techtronica-utility-suit:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_076_all-nighter:abilities:0": "abilities_on_play_make_run",
  "onr_v1_077_anonymous-tip:abilities:0":
    "abilities_on_play_derez_rezzed_black_ice",
  "onr_v1_078_arasaka-owns-you:flatlineReplacementSources:0":
    "flatline_replacement_sources_flatline_replacement_from_grip",
  "onr_v1_079_bodyweight-synthetic-blood:abilities:0":
    "abilities_on_play_draw_cards",
  "onr_v1_080_core-command-jettison-ice:abilities:0":
    "abilities_on_play_pay_rez_cost_to_trash_rezzed_ice",
  "onr_v1_081_custodial-position:abilities:0": "abilities_on_play_make_run",
  "onr_v1_082_deal-with-militech:abilities:0":
    "abilities_on_play_add_counter_to_all_installed_runner_icebreakers",
  "onr_v1_083_desperate-competitor:abilities:0":
    "abilities_on_play_gain_runner_event_agenda_point",
  "onr_v1_084_edited-shipping-manifests:abilities:0":
    "abilities_on_play_make_run",
  "onr_v1_085_executive-wiretaps:abilities:0": "abilities_on_play_make_run",
  "onr_v1_086_forged-activation-orders:abilities:0":
    "abilities_on_play_corp_choice_rez_or_trash_ice",
  "onr_v1_087_forgotten-backup-chip:abilities:0":
    "abilities_on_play_search_trash_to_grip",
  "onr_v1_089_gideons-pawnshop:abilities:0":
    "abilities_on_play_search_trash_to_grip",
  "onr_v1_090_hot-tip-for-wns:abilities:0":
    "abilities_on_play_gain_runner_event_agenda_point_if_liberated_agenda_subtype",
  "onr_v1_091_hunt-club-bbs:abilities:0":
    "abilities_on_play_expose_installed_cards",
  "onr_v1_092_ice-and-datas-guide-to-the-net:abilities:0":
    "abilities_on_play_expose_outermost_ice_each_fort",
  "onr_v1_093_if-you-want-it-done-right:abilities:0":
    "abilities_on_play_look_top_stack_take_one_arrange_rest",
  "onr_v1_094_inside-job:abilities:0": "abilities_on_play_make_run",
  "onr_v1_095_jack-n-joe:abilities:0": "abilities_on_play_draw_cards",
  "onr_v1_096_kilroy-was-here:abilities:0": "abilities_on_play_make_run",
  "onr_v1_097_livewires-contacts:abilities:0": "abilities_on_play_gain_credits",
  "onr_v1_098_lucidrine-booster-drug:abilities:0": "abilities_on_play_make_run",
  "onr_v1_099_mantis-fixer-at-large:abilities:0":
    "abilities_on_play_search_stack_to_grip",
  "onr_v1_100_misc-for-sale:abilities:0":
    "abilities_on_play_trash_own_installed_cards_for_credits",
  "onr_v1_101_mit-west-tier:abilities:0":
    "abilities_on_play_shuffle_grip_trash_and_stack_then_draw",
  "onr_v1_102_open-ended-mileage-program:abilities:0":
    "abilities_on_play_remove_tags",
  "onr_v1_103_organ-donor:abilities:0":
    "abilities_on_play_trash_cards_from_grip_for_credits",
  "onr_v1_104_playful-ai:runnerEventLongtail:0":
    "runner_event_longtail_random_dice_loop",
  "onr_v1_105_priority-wreck:abilities:0": "abilities_on_play_make_run",
  "onr_v1_106_private-ldl-access:abilities:0": "abilities_on_play_make_run",
  "onr_v1_107_romp-through-hq:abilities:0": "abilities_on_play_make_run",
  "onr_v1_108_score:abilities:0": "abilities_on_play_gain_credits",
  "onr_v1_109_security-code-worm-chip:abilities:0":
    "abilities_on_play_trash_unrezzed_ice",
  "onr_v1_112_stumble-through-wilderspace:abilities:0":
    "abilities_on_play_make_run",
  "onr_v1_113_synchronized-attack-on-hq:abilities:0":
    "abilities_on_play_corp_discard_hq_with_retain_payment",
  "onr_v1_114_temple-microcode-outlet:abilities:0":
    "abilities_on_play_search_stack_to_grip",
  "onr_v1_115_terrorist-reprisal:abilities:0":
    "abilities_on_play_corp_random_discard_from_hq",
  "onr_v1_116_total-genetic-retrofit:abilities:0":
    "abilities_on_play_remove_tags",
  "onr_v1_117_valu-pak-software-bundle:abilities:0":
    "abilities_on_play_start_runner_program_install_action_bundle",
  "onr_v1_118_weather-to-finance-pipe:abilities:0":
    "abilities_on_play_make_run",
  "onr_v1_002_ai-boon:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_002_ai-boon:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_003_baedekers-net-map:abilities:0":
    "abilities_activated_trace_base_link_window_use_base_link",
  "onr_v1_003_baedekers-net-map:abilities:1":
    "abilities_activated_trace_post_bid_link_window_increase_trace_link",
  "onr_v1_004_bakdoor:abilities:0":
    "abilities_activated_trace_base_link_window_use_base_link",
  "onr_v1_004_bakdoor:abilities:1":
    "abilities_activated_trace_post_bid_link_window_increase_trace_link",
  "onr_v1_005_bartmoss-memorial-icebreaker:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_005_bartmoss-memorial-icebreaker:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_006_black-dahlia:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_006_black-dahlia:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_007_blink:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_008_boardwalk:virusCounter:0": "virus_counter",
  "onr_v1_009_butcher-boy:virusCounter:0": "virus_counter",
  "onr_v1_010_cascade:virusCounter:0": "virus_counter",
  "onr_v1_013_cockroach:virusCounter:0": "virus_counter",
  "onr_v1_014_codecracker:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_014_codecracker:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_015_codeslinger:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_016_cyfermaster:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_016_cyfermaster:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_017_deep-thought:virusCounter:0": "virus_counter",
  "onr_v1_018_dogcatcher:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_018_dogcatcher:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_019_dropp:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_019_dropp:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_020_dupre:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_020_dupre:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_021_dwarf:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_021_dwarf:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_022_emergency-self-construct:flatlineReplacementSources:0":
    "flatline_replacement_sources_flatline_replacement_installed",
  "onr_v1_023_evil-twin:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_023_evil-twin:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_023_evil-twin:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_025_fait-accompli:virusCounter:0": "virus_counter",
  "onr_v1_026_false-echo:successfulRunFollowups:0":
    "successful_run_followups_force_rez_ice_outermost_inward_after_successful_run",
  "onr_v1_027_flak:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_027_flak:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_028_force-shield:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_029_gremlins:virusCounter:0": "virus_counter",
  "onr_v1_030_grubb:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_030_grubb:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_031_hammer:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_031_hammer:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_032_i-spy:runnerUtilityLongtail:0":
    "runner_utility_longtail_successful_run_fort_counter_expose",
  "onr_v1_034_incubator:virusCounter:0": "virus_counter",
  "onr_v1_036_jackhammer:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_036_jackhammer:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_037_japanese-water-torture:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_037_japanese-water-torture:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_038_joan-of-arc:trashPreventionSources:0":
    "trash_prevention_sources_prevent_installed_card_trash",
  "onr_v1_038_joan-of-arc:trashPreventionSources:1":
    "trash_prevention_sources_prevent_installed_card_trash_a",
  "onr_v1_039_krash:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_039_krash:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_040_loony-goon:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_040_loony-goon:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_042_mouse:abilities:0":
    "abilities_activated_runner_main_expose_installed_card",
  "onr_v1_043_mystery-box:abilities:0":
    "abilities_activated_during_run_look_top_stack_show_to_corp_then_install_matching",
  "onr_v1_044_netspace-inverter:successfulRunFollowups:0":
    "successful_run_followups_reverse_ice_on_successful_run_fort_immediately_after_successful_run",
  "onr_v1_045_newsgroup-filter:abilities:0":
    "abilities_activated_runner_main_gain_credits",
  "onr_v1_046_pattels-virus:virusCounter:0": "virus_counter",
  "onr_v1_047_pile-driver:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_047_pile-driver:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_049_pox:virusCounter:0": "virus_counter",
  "onr_v1_050_r-and-d-protocol-files:abilities:0":
    "abilities_activated_runner_main_make_run",
  "onr_v1_051_rabbit:runnerUtilityLongtail:0":
    "runner_utility_longtail_rabbit_ice_trace_limit_reduction",
  "onr_v1_052_raffles:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_052_raffles:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_053_ramming-piston:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_053_ramming-piston:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_054_raptor:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_054_raptor:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_055_reflector:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_055_reflector:icebreakerAbilities:1":
    "icebreaker_abilities_break_subroutine_a",
  "onr_v1_055_reflector:icebreakerAbilities:2":
    "icebreaker_abilities_break_subroutine_b",
  "onr_v1_056_replicator:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_056_replicator:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_058_seeya:abilities:0":
    "abilities_activated_runner_main_expose_installed_card",
  "onr_v1_059_self-modifying-code:abilities:0":
    "abilities_activated_during_run_trash_source",
  "onr_v1_060_shaka:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_060_shaka:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_061_shield:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_062_shredder-uplink-protocol:abilities:0":
    "abilities_activated_runner_main_make_run",
  "onr_v1_063_signpost:abilities:0":
    "abilities_activated_trace_post_bid_link_window_increase_trace_link",
  "onr_v1_064_skivviss:virusCounter:0": "virus_counter",
  "onr_v1_066_snowball:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_066_snowball:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_068_startup-immolator:runnerUtilityLongtail:0":
    "runner_utility_longtail_trash_fully_broken_passed_ice_after_passing_fully_broken_ice",
  "onr_v1_070_tinweasel:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_072_wild-card:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_072_wild-card:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_073_wizards-book:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_073_wizards-book:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_074_worm:icebreakerAbilities:0":
    "icebreaker_abilities_break_subroutine",
  "onr_v1_074_worm:icebreakerAbilities:1":
    "icebreaker_abilities_increase_strength",
  "onr_v1_148_access-through-alpha:abilities:0":
    "abilities_activated_trace_base_link_window_use_base_link",
  "onr_v1_149_access-to-arasaka:abilities:0":
    "abilities_activated_trace_base_link_window_use_base_link",
  "onr_v1_149_access-to-arasaka:abilities:1":
    "abilities_activated_trace_post_bid_link_window_increase_trace_link",
  "onr_v1_150_access-to-kiribati:abilities:0":
    "abilities_activated_trace_base_link_window_use_base_link",
  "onr_v1_150_access-to-kiribati:abilities:1":
    "abilities_activated_trace_post_bid_link_window_increase_trace_link",
  "onr_v1_151_aujourdoui:abilities:0":
    "abilities_activated_runner_main_look_top_stack_take_matching",
  "onr_v1_152_back-door-to-hilliard:abilities:0":
    "abilities_activated_trace_base_link_window_use_base_link",
  "onr_v1_152_back-door-to-hilliard:abilities:1":
    "abilities_activated_trace_post_bid_link_window_increase_trace_link",
  "onr_v1_153_back-door-to-orbital-air:abilities:0":
    "abilities_activated_trace_base_link_window_use_base_link",
  "onr_v1_153_back-door-to-orbital-air:abilities:1":
    "abilities_activated_trace_post_bid_link_window_increase_trace_link",
  "onr_v1_158_danshis-second-id:abilities:0":
    "abilities_activated_runner_main_remove_tags",
  "onr_v1_159_databroker:uniqueDirectLongtail:0":
    "unique_direct_longtail_agenda_point_for_credits_resource",
  "onr_v1_160_diplomatic-immunity:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_161_fall-guy:tagPreventionSources:0":
    "tag_prevention_sources_avoid_tag",
  "onr_v1_162_field-reporter-for-ice-and-data:runnerUtilityLongtail:0":
    "runner_utility_longtail_field_reporter_end_turn_rezzed_ice_payout",
  "onr_v1_165_junkyard-bbs:abilities:0":
    "abilities_activated_runner_main_move_top_trash_to_grip",
  "onr_v1_166_karl-de-veres-corporate-stooge:uniqueDirectLongtail:0":
    "unique_direct_longtail_successful_run_credit_resource",
  "onr_v1_167_leland-corporate-bodyguard:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_167_leland-corporate-bodyguard:tagPreventionSources:0":
    "tag_prevention_sources_avoid_tag",
  "onr_v1_169_n-e-t-o:abilities:0":
    "abilities_activated_runner_main_look_top_stack_take_matching",
  "onr_v1_170_nomad-allies:abilities:0":
    "abilities_activated_runner_main_remove_tags",
  "onr_v1_170_nomad-allies:tagPreventionSources:0":
    "tag_prevention_sources_avoid_tag",
  "onr_v1_171_preying-mantis:runnerUtilityLongtail:0":
    "runner_utility_longtail_optional_extra_action_with_delayed_damage_core",
  "onr_v1_172_quest-for-cattekin:runnerUtilityLongtail:0":
    "runner_utility_longtail_start_turn_random_effect_table",
  "onr_v1_175_ronin-around:abilities:0":
    "abilities_activated_runner_main_look_top_stack_take_matching",
  "onr_v1_175_ronin-around:abilities:1":
    "abilities_activated_runner_main_expose_installed_card",
  "onr_v1_178_short-term-contract:abilities:0":
    "abilities_activated_runner_main_take_hosted_credits",
  "onr_v1_179_silicon-saloon-franchise:abilities:0":
    "abilities_activated_runner_main_gain_credits",
  "onr_v1_180_smiths-pawnshop:uniqueDirectLongtail:0":
    "unique_direct_longtail_start_turn_trash_for_credits",
  "onr_v1_182_submarine-uplink:abilities:0":
    "abilities_activated_trace_base_link_window_use_base_link",
  "onr_v1_182_submarine-uplink:abilities:1":
    "abilities_activated_trace_post_bid_link_window_increase_trace_link",
  "onr_v1_182_submarine-uplink:runnerUtilityLongtail:0":
    "runner_utility_longtail_trace_link_force_jack_out",
  "onr_v1_183_technician-lover:abilities:0":
    "abilities_activated_runner_main_private_look",
  "onr_v1_177_the-short-circuit:abilities:0":
    "abilities_activated_runner_main_search_stack_to_grip",
  "onr_v1_181_the-springboard:abilities:0":
    "abilities_activated_trace_post_bid_link_window_increase_trace_link",
  "onr_v1_185_trauma-team:abilities:0":
    "abilities_activated_runner_main_add_counters_to_source",
  "onr_v1_185_trauma-team:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_186_umbrella-policy:trashPreventionSources:0":
    "trash_prevention_sources_prevent_installed_card_trash",
  "onr_v1_187_wilson-weeflerunner-apprentice:damagePreventionSources:0":
    "damage_prevention_sources_damage_prevention",
  "onr_v1_187_wilson-weeflerunner-apprentice:tagPreventionSources:0":
    "tag_prevention_sources_avoid_tag",
});
export const ORIGINALSET_V1_CAPABILITY_KEYS =
  ORIGINALSET_V1_LEGACY_CAPABILITY_KEYS;

/**
 * Pinned Shared-definition ability evidence mapped to the already canonical
 * Legacy runtime capability slots. Reflector's one printed break ability
 * deliberately fans out to its three typed break-tag capabilities.
 */
export const ORIGINALSET_V1_SHARED_ABILITY_DISPOSITIONS = Object.freeze({
  "onr_v1_005_bartmoss-memorial-icebreaker:sharedAbility:onr_v1_005_bartmoss_memorial_icebreaker_pump":
    Object.freeze([
      "onr_v1_005_bartmoss-memorial-icebreaker:icebreakerAbilities:1",
    ]),
  "onr_v1_005_bartmoss-memorial-icebreaker:sharedAbility:onr_v1_005_bartmoss_memorial_icebreaker_break":
    Object.freeze([
      "onr_v1_005_bartmoss-memorial-icebreaker:icebreakerAbilities:0",
    ]),
  "onr_v1_007_blink:sharedAbility:onr_v1_007_blink_break": Object.freeze([
    "onr_v1_007_blink:icebreakerAbilities:0",
  ]),
  "onr_v1_015_codeslinger:sharedAbility:onr_v1_015_codeslinger_break":
    Object.freeze(["onr_v1_015_codeslinger:icebreakerAbilities:0"]),
  "onr_v1_018_dogcatcher:sharedAbility:onr_v1_018_dogcatcher_pump":
    Object.freeze(["onr_v1_018_dogcatcher:icebreakerAbilities:1"]),
  "onr_v1_018_dogcatcher:sharedAbility:onr_v1_018_dogcatcher_break":
    Object.freeze(["onr_v1_018_dogcatcher:icebreakerAbilities:0"]),
  "onr_v1_019_dropp:sharedAbility:onr_v1_019_dropp_pump": Object.freeze([
    "onr_v1_019_dropp:icebreakerAbilities:1",
  ]),
  "onr_v1_019_dropp:sharedAbility:onr_v1_019_dropp_break": Object.freeze([
    "onr_v1_019_dropp:icebreakerAbilities:0",
  ]),
  "onr_v1_052_raffles:sharedAbility:onr_v1_052_raffles_pump": Object.freeze([
    "onr_v1_052_raffles:icebreakerAbilities:1",
  ]),
  "onr_v1_052_raffles:sharedAbility:onr_v1_052_raffles_break": Object.freeze([
    "onr_v1_052_raffles:icebreakerAbilities:0",
  ]),
  "onr_v1_054_raptor:sharedAbility:onr_v1_054_raptor_pump": Object.freeze([
    "onr_v1_054_raptor:icebreakerAbilities:1",
  ]),
  "onr_v1_054_raptor:sharedAbility:onr_v1_054_raptor_break": Object.freeze([
    "onr_v1_054_raptor:icebreakerAbilities:0",
  ]),
  "onr_v1_070_tinweasel:sharedAbility:onr_v1_070_tinweasel_break":
    Object.freeze(["onr_v1_070_tinweasel:icebreakerAbilities:0"]),
  "onr_v1_006_black-dahlia:sharedAbility:onr_v1_006_black-dahlia_pump":
    Object.freeze(["onr_v1_006_black-dahlia:icebreakerAbilities:1"]),
  "onr_v1_006_black-dahlia:sharedAbility:onr_v1_006_black-dahlia_break":
    Object.freeze(["onr_v1_006_black-dahlia:icebreakerAbilities:0"]),
  "onr_v1_014_codecracker:sharedAbility:onr_v1_014_codecracker_pump":
    Object.freeze(["onr_v1_014_codecracker:icebreakerAbilities:1"]),
  "onr_v1_014_codecracker:sharedAbility:onr_v1_014_codecracker_break":
    Object.freeze(["onr_v1_014_codecracker:icebreakerAbilities:0"]),
  "onr_v1_016_cyfermaster:sharedAbility:onr_v1_016_cyfermaster_pump":
    Object.freeze(["onr_v1_016_cyfermaster:icebreakerAbilities:1"]),
  "onr_v1_016_cyfermaster:sharedAbility:onr_v1_016_cyfermaster_break":
    Object.freeze(["onr_v1_016_cyfermaster:icebreakerAbilities:0"]),
  "onr_v1_021_dwarf:sharedAbility:onr_v1_021_dwarf_pump": Object.freeze([
    "onr_v1_021_dwarf:icebreakerAbilities:1",
  ]),
  "onr_v1_021_dwarf:sharedAbility:onr_v1_021_dwarf_break": Object.freeze([
    "onr_v1_021_dwarf:icebreakerAbilities:0",
  ]),
  "onr_v1_023_evil-twin:sharedAbility:onr_v1_023_evil-twin_pump": Object.freeze(
    ["onr_v1_023_evil-twin:icebreakerAbilities:1"],
  ),
  "onr_v1_023_evil-twin:sharedAbility:onr_v1_023_evil-twin_break":
    Object.freeze(["onr_v1_023_evil-twin:icebreakerAbilities:0"]),
  "onr_v1_030_grubb:sharedAbility:onr_v1_030_grubb_pump": Object.freeze([
    "onr_v1_030_grubb:icebreakerAbilities:1",
  ]),
  "onr_v1_030_grubb:sharedAbility:onr_v1_030_grubb_break": Object.freeze([
    "onr_v1_030_grubb:icebreakerAbilities:0",
  ]),
  "onr_v1_036_jackhammer:sharedAbility:onr_v1_036_jackhammer_pump":
    Object.freeze(["onr_v1_036_jackhammer:icebreakerAbilities:1"]),
  "onr_v1_036_jackhammer:sharedAbility:onr_v1_036_jackhammer_break":
    Object.freeze(["onr_v1_036_jackhammer:icebreakerAbilities:0"]),
  "onr_v1_039_krash:sharedAbility:onr_v1_039_krash_pump": Object.freeze([
    "onr_v1_039_krash:icebreakerAbilities:1",
  ]),
  "onr_v1_039_krash:sharedAbility:onr_v1_039_krash_break": Object.freeze([
    "onr_v1_039_krash:icebreakerAbilities:0",
  ]),
  "onr_v1_040_loony-goon:sharedAbility:onr_v1_040_loony-goon_pump":
    Object.freeze(["onr_v1_040_loony-goon:icebreakerAbilities:1"]),
  "onr_v1_040_loony-goon:sharedAbility:onr_v1_040_loony-goon_break":
    Object.freeze(["onr_v1_040_loony-goon:icebreakerAbilities:0"]),
  "onr_v1_060_shaka:sharedAbility:onr_v1_060_shaka_pump": Object.freeze([
    "onr_v1_060_shaka:icebreakerAbilities:1",
  ]),
  "onr_v1_060_shaka:sharedAbility:onr_v1_060_shaka_break": Object.freeze([
    "onr_v1_060_shaka:icebreakerAbilities:0",
  ]),
  "onr_v1_066_snowball:sharedAbility:onr_v1_066_snowball_pump": Object.freeze([
    "onr_v1_066_snowball:icebreakerAbilities:1",
  ]),
  "onr_v1_066_snowball:sharedAbility:onr_v1_066_snowball_break": Object.freeze([
    "onr_v1_066_snowball:icebreakerAbilities:0",
  ]),
  "onr_v1_072_wild-card:sharedAbility:onr_v1_072_wild-card_pump": Object.freeze(
    ["onr_v1_072_wild-card:icebreakerAbilities:1"],
  ),
  "onr_v1_072_wild-card:sharedAbility:onr_v1_072_wild-card_break":
    Object.freeze(["onr_v1_072_wild-card:icebreakerAbilities:0"]),
  "onr_v1_074_worm:sharedAbility:onr_v1_074_worm_pump": Object.freeze([
    "onr_v1_074_worm:icebreakerAbilities:1",
  ]),
  "onr_v1_074_worm:sharedAbility:onr_v1_074_worm_break": Object.freeze([
    "onr_v1_074_worm:icebreakerAbilities:0",
  ]),
  "onr_v1_073_wizards-book:sharedAbility:onr_v1_073_wizards-book_pump":
    Object.freeze(["onr_v1_073_wizards-book:icebreakerAbilities:1"]),
  "onr_v1_073_wizards-book:sharedAbility:onr_v1_073_wizards-book_break":
    Object.freeze(["onr_v1_073_wizards-book:icebreakerAbilities:0"]),
  "onr_v1_002_ai-boon:sharedAbility:onr_v1_002_ai-boon_pump": Object.freeze([
    "onr_v1_002_ai-boon:icebreakerAbilities:1",
  ]),
  "onr_v1_002_ai-boon:sharedAbility:onr_v1_002_ai-boon_break_sentry":
    Object.freeze(["onr_v1_002_ai-boon:icebreakerAbilities:0"]),
  "onr_v1_031_hammer:sharedAbility:onr_v1_031_hammer_pump": Object.freeze([
    "onr_v1_031_hammer:icebreakerAbilities:1",
  ]),
  "onr_v1_031_hammer:sharedAbility:onr_v1_031_hammer_break": Object.freeze([
    "onr_v1_031_hammer:icebreakerAbilities:0",
  ]),
  "onr_v1_037_japanese-water-torture:sharedAbility:onr_v1_037_japanese_water_torture_pump":
    Object.freeze(["onr_v1_037_japanese-water-torture:icebreakerAbilities:1"]),
  "onr_v1_037_japanese-water-torture:sharedAbility:onr_v1_037_japanese_water_torture_break":
    Object.freeze(["onr_v1_037_japanese-water-torture:icebreakerAbilities:0"]),
  "onr_v1_027_flak:sharedAbility:onr_v1_027_flak_pump": Object.freeze([
    "onr_v1_027_flak:icebreakerAbilities:1",
  ]),
  "onr_v1_027_flak:sharedAbility:onr_v1_027_flak_break": Object.freeze([
    "onr_v1_027_flak:icebreakerAbilities:0",
  ]),
  "onr_v1_055_reflector:sharedAbility:onr_v1_055_reflector_break":
    Object.freeze([
      "onr_v1_055_reflector:icebreakerAbilities:0",
      "onr_v1_055_reflector:icebreakerAbilities:1",
      "onr_v1_055_reflector:icebreakerAbilities:2",
    ]),
  "onr_v1_053_ramming-piston:sharedAbility:ramming_piston_break_wall":
    Object.freeze(["onr_v1_053_ramming-piston:icebreakerAbilities:0"]),
  "onr_v1_053_ramming-piston:sharedAbility:ramming_piston_pump": Object.freeze([
    "onr_v1_053_ramming-piston:icebreakerAbilities:1",
  ]),
  "onr_v1_056_replicator:sharedAbility:replicator_break_trace": Object.freeze([
    "onr_v1_056_replicator:icebreakerAbilities:0",
  ]),
  "onr_v1_056_replicator:sharedAbility:replicator_pump": Object.freeze([
    "onr_v1_056_replicator:icebreakerAbilities:1",
  ]),
  "onr_v1_020_dupre:sharedAbility:onr_v1_020_dupre_pump": Object.freeze([
    "onr_v1_020_dupre:icebreakerAbilities:1",
  ]),
  "onr_v1_020_dupre:sharedAbility:onr_v1_020_dupre_break_code_gate":
    Object.freeze(["onr_v1_020_dupre:icebreakerAbilities:0"]),
  "onr_v1_065_smarteye:sharedAbility:onr_v1_065_smarteye_approach_ice_expose":
    Object.freeze(["onr_v1_065_smarteye:runEncounterInterventions:0"]),
  "onr_v1_047_pile-driver:sharedAbility:onr_v1_047_pile_driver_pump":
    Object.freeze(["onr_v1_047_pile-driver:icebreakerAbilities:1"]),
  "onr_v1_047_pile-driver:sharedAbility:onr_v1_047_pile_driver_break":
    Object.freeze(["onr_v1_047_pile-driver:icebreakerAbilities:0"]),
});

// These legacy replacements are not projection-safe. Their old ID branches
// are reconciled to the variant-required typed resolution contracts below and
// must be emitted only by the later projection stage.
export const ORIGINALSET_V1_MECHANICAL_RECONCILIATIONS = Object.freeze({
  "onr_v1_022_emergency-self-construct": Object.freeze({
    family: "flatline_replacement_installed",
    cost: "trash_source",
    resolution: Object.freeze({
      trashAllGrip: true,
      removeAllCoreDamage: true,
      maxHandSizeModifier: -1,
      runnerActionsPerTurnOverride: 3,
      permanentMeatDamagePrevention: true,
    }),
  }),
  "onr_v1_078_arasaka-owns-you": Object.freeze({
    family: "flatline_replacement_from_grip",
    resolution: Object.freeze({
      trashSource: true,
      removeAllCoreDamage: true,
      refreshGripToMax: true,
      gainCredits: 10,
      removeAllTags: true,
      futureActionDebt: 4,
      futureAgendaPointForfeit: 3,
    }),
  }),
});

export const ORIGINALSET_V1_HELPER_SYMBOLS = new Set([
  "addHostedCredits",
  "basicIcebreakerAbilities",
  "brainDamageSubroutine",
  "endTheRunSubroutine",
  "endTheRunSubroutines",
  "hostedCreditAddAbility",
  "hostedCreditTakeAbility",
  "hostedCreditTakeTurnTrigger",
  "lookTopStackShowToCorpThenInstallMatchingEffect",
  "lookTopStackTakeMatchingEffect",
  "lookTopStackTakeOneArrangeRestEffect",
  "netDamageSubroutine",
  "restrictedHostedCreditSource",
  "scoredRezzedIceMarkModifier",
  "searchStackInstallEffect",
  "searchStackToGripEffect",
  "traceTagEffect",
  "traceTagSubroutine",
  "trashProgramSubroutine",
]);
