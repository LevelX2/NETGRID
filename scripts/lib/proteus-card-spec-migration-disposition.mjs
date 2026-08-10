export const PROTEUS_ADDRESSABLE_FAMILIES = new Set([
  "abilities",
  "accessEffects",
  "corpUtility",
  "damagePreventionSources",
  "flatlineReplacementSources",
  "fortRunWindows",
  "icebreakerAbilities",
  "iceEncounter",
  "icebreakerSubtypeChange",
  "printedSubroutines",
  "relativeIce",
  "runnerCounterEffects",
  "runnerEventLongtail",
  "runnerEventTargetedEffect",
  "runnerRunStrengthBoost",
  "runnerUtilityLongtail",
  "scoredAgenda",
  "successfulRunFollowups",
  "tagPreventionSources",
  "trashPreventionSources",
  "uniqueDirectLongtail",
  "variableRez",
  "virusCounter",
]);

export const PROTEUS_HELPER_MODULE_DISPOSITIONS = Object.freeze({
  "packages/engine/src/card-implementations/proteus/runner/hardware/cortical-cybermodem.ts":
    {
      source: "../../../helpers",
      helpers: ["addHostedCredits", "restrictedHostedCreditSource"],
    },
  "packages/engine/src/card-implementations/proteus/runner/hardware/eurocorpse-tm-spin-chip.ts":
    {
      source: "../../../helpers",
      helpers: ["addHostedCredits", "restrictedHostedCreditSource"],
    },
  "packages/engine/src/card-implementations/proteus/runner/hardware/sunburst-cranial-interface.ts":
    {
      source: "../../../helpers",
      helpers: ["addHostedCredits", "restrictedHostedCreditSource"],
    },
  "packages/engine/src/card-implementations/proteus/runner/programs/big-frackin-gun.ts":
    {
      source: "../../../helpers",
      helpers: ["basicIcebreakerAbilities"],
    },
  "packages/engine/src/card-implementations/proteus/runner/programs/redecorator.ts":
    {
      source: "../../../helpers",
      helpers: ["basicIcebreakerAbilities"],
    },
  "packages/engine/src/card-implementations/proteus/runner/programs/skeleton-passkeys.ts":
    {
      source: "../../../helpers",
      helpers: ["basicIcebreakerAbilities"],
    },
  "packages/engine/src/card-implementations/proteus/runner/resources/airport-locker.ts":
    {
      source: "../../../helpers",
      helpers: ["searchStackInstallEffect"],
    },
  "packages/engine/src/card-implementations/proteus/runner/resources/credit-subversion.ts":
    {
      source: "../../../../ability-engine/card-implementation-primitives",
      helpers: ["hiddenSuccessfulRunBeforeAccessEffect"],
    },
  "packages/engine/src/card-implementations/proteus/runner/resources/death-from-above.ts":
    {
      source: "../../../../ability-engine/card-implementation-primitives",
      helpers: ["hiddenSuccessfulRunBeforeAccessEffect"],
    },
  "packages/engine/src/card-implementations/proteus/runner/resources/streetware-distributor.ts":
    {
      source: "../../../helpers",
      helpers: ["hostedCreditAddAbility", "hostedCreditTakeTurnTrigger"],
    },
});

export const PROTEUS_MECHANICAL_RECONCILIATIONS = Object.freeze({
  "onr_proteus_139_eurocorpse-tm-spin-chip": Object.freeze({
    hostedProgramCapacity: Object.freeze({
      capacityMu: 1,
      disposition:
        "canonical_rules_text_limits_the_single_hosted_icebreaker_to_mu_one_legacy_99_was_an_invalid_unbounded_placeholder",
    }),
  }),
});

// Capability-bound planning evidence is authored against the reviewed semantic
// keys above. Hunting Pack's legacy action pair is intentionally absent: its
// relative-ICE trace is passive board semantics, not an addressable action.
export const PROTEUS_ACTION_STRATEGY_CAPABILITIES = Object.freeze({
  "onr_proteus_003_corporate-headhunters":
    "tagged_runner_meat_damage_reduce_hand_size_on_success",
  "onr_proteus_005_marked-accounts": "access_add_tags",
  "onr_proteus_048_data-sifters": "on_play_tag_after_runner_trashed_node",
  onr_proteus_050_manhunt: "on_play_trace_six_tags_by_margin",
  "onr_proteus_052_schlaghund-pointers": "on_play_variable_trace_add_tag",
  "onr_proteus_053_underworld-mole":
    "on_play_trace_trash_recent_resource_add_tag",
  onr_proteus_090_highlighter: "rd_success_add_highlighter_access_counter",
  "onr_proteus_098_vienna-22": "hq_success_add_vienna_access_counter",
  "onr_proteus_101_all-hands": "on_play_run_with_success_credit_gain",
  "onr_proteus_105_demolition-run": "on_play_run_with_free_access_trash",
  "onr_proteus_107_drone-for-a-day": "on_play_gain_nine_credits_add_tag",
  "onr_proteus_113_live-news-feed": "on_play_run_with_bad_publicity_aftermath",
  "onr_proteus_121_remote-detonator":
    "on_play_trash_last_run_fort_ice_add_tags",
  "onr_proteus_122_rush-hour":
    "on_play_rd_run_access_four_without_noisy_breakers",
  "onr_proteus_129_back-door-to-netwatch": "trace_success_cancel_window",
  "onr_proteus_142_hq-mole": "hq_access_start_add_two_accesses",
  "onr_proteus_147_r-and-d-mole": "rd_access_start_add_two_accesses",
});

// These keys are author-owned migration dispositions. They are deliberately
// explicit: runtime code must never infer capability identity from node kind,
// array position, card title, or card text.
export const PROTEUS_CAPABILITY_KEYS = Object.freeze({
  "onr_proteus_001_ai-board-member": {
    scoredAgenda: ["corp_start_turn_random_restricted_optional_action"],
  },
  "onr_proteus_003_corporate-headhunters": {
    scoredAgenda: ["tagged_runner_meat_damage_reduce_hand_size_on_success"],
  },
  "onr_proteus_004_fetal-ai": {
    accessEffects: ["access_damage"],
  },
  "onr_proteus_005_marked-accounts": {
    accessEffects: ["access_add_tags"],
  },
  "onr_proteus_006_please-dont-choke-anyone": {
    scoredAgenda: ["corp_damage_replacement_pdca_action_counter"],
  },
  "onr_proteus_007_project-venice": {
    scoredAgenda: ["overadvance_start_of_corp_turn_actions"],
  },
  "onr_proteus_008_project-zurich": {
    scoredAgenda: ["overadvance_start_of_corp_turn_credits"],
  },
  "onr_proteus_009_viral-breeding-ground": {
    accessEffects: ["access_return_installed_runner_programs_to_grip"],
  },
  "onr_proteus_010_world-domination": {
    scoredAgenda: ["fixed_bonus_agenda_points_on_score"],
  },
  "onr_proteus_011_brain-wash": {
    printedSubroutines: ["subroutine_brain_damage_one"],
  },
  "onr_proteus_012_bug-zapper": {
    printedSubroutines: [
      "subroutine_relative_net_damage",
      "subroutine_end_run",
    ],
    relativeIce: ["outside_rezzed_ice_dynamic_net_damage"],
  },
  onr_proteus_013_caryatid: {
    printedSubroutines: ["subroutine_end_run"],
    variableRez: ["rez_as_wall_or_code_gate"],
  },
  onr_proteus_014_chihuahua: {
    printedSubroutines: ["subroutine_trace_one_net_damage"],
  },
  "onr_proteus_015_colonel-failure": {
    printedSubroutines: [
      "subroutine_trash_program_a",
      "subroutine_trash_program_b",
      "subroutine_trash_program_c",
      "subroutine_end_run_a",
      "subroutine_end_run_b",
    ],
  },
  onr_proteus_016_coyote: {
    printedSubroutines: ["subroutine_run_duration_ice_strength"],
  },
  "onr_proteus_017_credit-blocks": {
    printedSubroutines: ["subroutine_end_run"],
    variableRez: ["rez_as_sentry_or_wall"],
  },
  onr_proteus_018_datacomb: {
    fortRunWindows: ["post_pass_pay_or_return_source_to_hq"],
    printedSubroutines: ["subroutine_end_run"],
  },
  "onr_proteus_019_death-yo-yo": {
    fortRunWindows: ["post_pass_return_source_to_hq_gain_credit"],
    printedSubroutines: ["subroutine_brain_damage_one", "subroutine_end_run"],
  },
  "onr_proteus_021_dog-pile": {
    printedSubroutines: [
      "subroutine_relative_net_damage",
      "subroutine_end_run",
    ],
    relativeIce: ["outside_rezzed_ice_strength_and_net_damage"],
  },
  "onr_proteus_022_food-fight": {
    variableRez: ["rez_with_paid_end_run_subroutines"],
  },
  onr_proteus_023_galatea: {
    printedSubroutines: ["subroutine_end_run"],
    variableRez: ["rez_as_wall_or_code_gate"],
  },
  onr_proteus_024_gatekeeper: {
    variableRez: ["rez_with_paid_end_run_subroutines"],
  },
  "onr_proteus_025_homing-missile": {
    printedSubroutines: ["subroutine_trace_x_end_run_and_run_lock"],
    variableRez: ["rez_with_x_strength_trace"],
  },
  "onr_proteus_026_hunting-pack": {
    relativeIce: ["outside_rezzed_ice_dynamic_trace"],
  },
  onr_proteus_027_iceberg: {
    abilities: ["encounter_add_end_run_subroutine"],
    printedSubroutines: ["subroutine_net_damage_one"],
  },
  onr_proteus_029_marionette: {
    fortRunWindows: ["post_pass_pay_or_return_source_to_hq"],
    printedSubroutines: ["subroutine_trash_program", "subroutine_end_run"],
  },
  "onr_proteus_028_lesser-arcana": {
    printedSubroutines: ["subroutine_end_run"],
    variableRez: ["rez_as_sentry_or_wall"],
  },
  onr_proteus_030_mastermind: {
    printedSubroutines: [
      "subroutine_relative_brain_damage",
      "subroutine_end_run",
    ],
    relativeIce: ["outside_rezzed_ice_strength_and_core_damage"],
  },
  "onr_proteus_032_misleading-access-menus": {
    printedSubroutines: ["subroutine_end_run_unless_runner_pays_one"],
  },
  "onr_proteus_033_mobile-barricade": {
    fortRunWindows: ["start_run_move_source_within_fort"],
    printedSubroutines: ["subroutine_net_damage_one", "subroutine_end_run"],
  },
  onr_proteus_034_riddler: {
    abilities: ["encounter_add_end_run_subroutine"],
  },
  onr_proteus_035_roadblock: {
    iceEncounter: ["encounter_roll_six_for_strength_or_derez"],
    printedSubroutines: ["subroutine_end_run"],
  },
  onr_proteus_036_sandstorm: {
    variableRez: ["rez_with_paid_end_run_subroutines"],
  },
  onr_proteus_037_scaffolding: {
    fortRunWindows: ["post_pass_return_source_to_hq_gain_credit"],
    printedSubroutines: ["subroutine_end_run"],
  },
  onr_proteus_038_snowbank: {
    printedSubroutines: ["subroutine_end_run_unless_runner_pays_one"],
  },
  "onr_proteus_039_sphinx-2006": {
    printedSubroutines: ["subroutine_end_run"],
    variableRez: ["rez_as_code_gate_or_sentry"],
  },
  "onr_proteus_040_sumo-2008": {
    printedSubroutines: ["subroutine_end_run"],
    variableRez: ["rez_as_sentry_or_wall"],
  },
  "onr_proteus_041_toughoniumtm-wall": {
    printedSubroutines: [
      "subroutine_end_run_a",
      "subroutine_end_run_b",
      "subroutine_end_run_c",
      "subroutine_end_run_d",
    ],
  },
  onr_proteus_042_tumblers: {
    fortRunWindows: ["post_pass_return_source_to_hq_gain_credit"],
    printedSubroutines: ["subroutine_end_run"],
  },
  "onr_proteus_043_twisty-passages": {
    fortRunWindows: ["post_pass_pay_or_return_source_to_hq"],
    printedSubroutines: ["subroutine_end_run"],
  },
  "onr_proteus_044_walking-wall": {
    fortRunWindows: ["start_run_move_source_within_fort"],
    printedSubroutines: ["subroutine_end_run"],
  },
  "onr_proteus_045_washed-up-solo-construct": {
    printedSubroutines: ["subroutine_trash_program_unless_runner_pays_one"],
  },
  "onr_proteus_046_corporate-guard-r-temps": {
    corpUtility: ["future_actions_with_credit_forfeit"],
  },
  "onr_proteus_047_credit-consolidation": {
    abilities: ["on_play_gain_fifteen_credits"],
  },
  "onr_proteus_048_data-sifters": {
    abilities: ["on_play_tag_after_runner_trashed_node"],
  },
  "onr_proteus_049_emergency-rig": {
    abilities: ["on_play_free_rez_ice_with_kludge_counters"],
  },
  onr_proteus_050_manhunt: {
    abilities: ["on_play_trace_six_tags_by_margin"],
  },
  "onr_proteus_051_rent-to-own-contract": {
    abilities: ["on_play_free_rez_ice_with_term_counters"],
  },
  "onr_proteus_052_schlaghund-pointers": {
    abilities: ["on_play_variable_trace_add_tag"],
  },
  "onr_proteus_053_underworld-mole": {
    abilities: ["on_play_trace_trash_recent_resource_add_tag"],
  },
  "onr_proteus_054_bel-digmo-antibody": {
    accessEffects: ["rd_access_net_damage_one"],
  },
  "onr_proteus_055_cybertech-think-tank": {
    corpUtility: ["successful_meat_damage_boost"],
  },
  "onr_proteus_056_department-of-misinformation": {
    corpUtility: ["paid_expose_prevention"],
  },
  "onr_proteus_057_doppelganger-antibody": {
    accessEffects: ["access_add_link_reduction_counter"],
    runnerCounterEffects: ["link_reduction_counter_start_turn_credit_loss"],
  },
  "onr_proteus_058_executive-boot-camp": {
    abilities: ["during_run_discard_for_two_run_credits"],
  },
  "onr_proteus_059_government-contract": {
    abilities: ["corp_main_spend_advancement_for_install_rez_credits"],
  },
  "onr_proteus_060_herman-revista": {
    corpUtility: ["start_run_reorder_source_fort_ice"],
  },
  "onr_proteus_061_ldl-traffic-analyzers": {
    abilities: ["trace_window_spend_advancement_for_trace_credits"],
  },
  "onr_proteus_062_lesley-major": {
    fortRunWindows: ["pass_last_ice_advance_same_fort_card"],
  },
  "onr_proteus_063_lisa-blight": {
    abilities: ["during_run_discard_and_copy_subroutine"],
  },
  "onr_proteus_064_marcel-desoleil": {
    abilities: ["during_run_trash_rd_and_copy_subroutine"],
  },
  "onr_proteus_066_obfuscated-fortress": {
    corpUtility: ["start_run_source_fort_spend_cap"],
  },
  "onr_proteus_067_panic-button": {
    abilities: ["hq_run_pay_one_draw_one"],
  },
  "onr_proteus_068_pattel-antibody": {
    accessEffects: ["access_add_breaker_strength_penalty_counters"],
  },
  "onr_proteus_070_rasmin-bridger": {
    fortRunWindows: ["post_pass_runner_pay_or_end_run"],
  },
  "onr_proteus_071_raymond-ellison": {
    abilities: ["during_run_tap_advancement_for_run_credits"],
  },
  "onr_proteus_073_simon-francisco": {
    accessEffects: ["access_reduce_stored_card_queue"],
  },
  onr_proteus_074_siren: {
    corpUtility: ["start_run_redirect_to_source_fort"],
  },
  "onr_proteus_075_stereogram-antibody": {
    accessEffects: ["archives_access_damage_and_shuffle_source"],
  },
  "onr_proteus_076_syd-meyer-superstores": {
    abilities: ["corp_main_trash_rezzed_ice_for_credits"],
  },
  onr_proteus_078_armageddon: {
    successfulRunFollowups: ["successful_rd_run_skip_access_add_doom_counter"],
  },
  "onr_proteus_079_big-frackin-gun": {
    icebreakerAbilities: ["break_five_sentry_subroutines", "pump_strength_one"],
  },
  "onr_proteus_081_boring-bit": {
    icebreakerAbilities: ["break_wall_subroutine", "pump_strength_one"],
  },
  onr_proteus_082_bulldozer: {
    icebreakerAbilities: [
      "break_wall_with_stealth_tradeoff_and_sentry_reward",
      "pump_strength_one",
    ],
  },
  onr_proteus_083_corrosion: {
    icebreakerAbilities: ["break_wall_subroutine", "pump_strength_one"],
  },
  onr_proteus_084_crumble: {
    virusCounter: ["hq_success_add_crumble_counter"],
  },
  onr_proteus_085_disintegrator: {
    runnerUtilityLongtail: ["post_pass_derez_fully_broken_ice_end_run"],
  },
  "onr_proteus_086_enterprise-inc-shields": {
    damagePreventionSources: [
      "prevent_two_net_damage",
      "prevent_one_core_damage",
    ],
  },
  "onr_proteus_087_forwards-legacy": {
    icebreakerAbilities: ["break_sentry_with_random_run_strength"],
  },
  onr_proteus_088_fubar: {
    icebreakerAbilities: [
      "break_selected_subtype_with_stealth_tradeoff",
      "pump_strength_one",
    ],
    icebreakerSubtypeChange: ["select_breaker_subtype_once"],
  },
  "onr_proteus_089_garbage-in": {
    virusCounter: ["rd_success_add_garbage_counter"],
  },
  onr_proteus_090_highlighter: {
    virusCounter: ["rd_success_add_highlighter_access_counter"],
  },
  onr_proteus_091_lockjaw: {
    runnerRunStrengthBoost: ["trash_source_boost_breaker_two_for_run"],
  },
  onr_proteus_093_redecorator: {
    icebreakerAbilities: ["break_two_sentry_subroutines", "pump_strength_one"],
  },
  onr_proteus_094_scaldan: {
    virusCounter: ["hq_success_add_scaldan_counter"],
  },
  "onr_proteus_095_skeleton-passkeys": {
    icebreakerAbilities: ["break_code_gate_subroutine", "pump_strength_four"],
  },
  onr_proteus_096_skullcap: {
    damagePreventionSources: ["trash_source_prevent_all_net_or_core_damage"],
  },
  onr_proteus_097_taxman: {
    virusCounter: ["hq_success_add_tax_counter"],
  },
  "onr_proteus_098_vienna-22": {
    virusCounter: ["hq_success_add_vienna_access_counter"],
  },
  "onr_proteus_099_viral-pipeline": {
    virusCounter: ["central_success_add_pipe_counter"],
  },
  "onr_proteus_100_wrecking-ball": {
    icebreakerAbilities: [
      "break_wall_with_stealth_tradeoff",
      "pump_strength_one",
    ],
  },
  "onr_proteus_101_all-hands": {
    abilities: ["on_play_run_with_success_credit_gain"],
  },
  onr_proteus_102_blackmail: {
    abilities: ["on_play_run_with_rez_prohibition"],
  },
  "onr_proteus_103_cruising-for-netwatch": {
    abilities: ["on_play_gain_one_credit_draw_two"],
  },
  "onr_proteus_104_decoy-signal": {
    abilities: ["on_play_run_with_rez_credit_gain"],
  },
  "onr_proteus_105_demolition-run": {
    abilities: ["on_play_run_with_free_access_trash"],
  },
  "onr_proteus_106_disgruntled-ice-technician": {
    abilities: ["on_play_run_with_success_credit_gain"],
    runnerUtilityLongtail: ["post_pass_derez_fully_broken_ice_end_run"],
  },
  "onr_proteus_107_drone-for-a-day": {
    abilities: ["on_play_gain_nine_credits_add_tag"],
  },
  "onr_proteus_108_faked-hit": {
    abilities: ["on_play_add_bad_publicity_and_core_damage"],
  },
  "onr_proteus_109_frame-up": {
    abilities: ["on_play_bad_publicity_from_run_history"],
  },
  onr_proteus_110_hijack: {
    runnerEventLongtail: ["install_grip_program_or_hardware_with_temp_credits"],
  },
  "onr_proteus_111_ice-and-data-special-report": {
    abilities: ["on_play_expose_up_to_five_same_fort_cards"],
  },
  "onr_proteus_112_identity-donor": {
    flatlineReplacementSources: [
      "grip_meat_damage_to_bad_publicity_replacement",
    ],
  },
  "onr_proteus_113_live-news-feed": {
    abilities: ["on_play_run_with_bad_publicity_aftermath"],
  },
  "onr_proteus_114_on-the-fast-track": {
    abilities: ["on_play_gain_credits_from_runner_trash_history"],
  },
  "onr_proteus_115_personal-touch-the": {
    runnerEventTargetedEffect: ["add_power_counter_to_installed_breaker"],
  },
  "onr_proteus_116_pirate-broadcast": {
    abilities: ["on_play_run_each_fort_sequence"],
  },
  "onr_proteus_117_poisoned-water-supply": {
    runnerEventLongtail: ["trash_two_connections_add_bad_publicity"],
  },
  "onr_proteus_118_prearranged-drop": {
    abilities: ["on_play_mark_next_agenda_access_credit_gain"],
  },
  "onr_proteus_119_promises-promises": {
    abilities: ["on_play_mark_next_agenda_access_point_gain"],
  },
  onr_proteus_120_reconnaissance: {
    abilities: ["on_play_run_with_corp_rez_credit_gain"],
  },
  "onr_proteus_121_remote-detonator": {
    abilities: ["on_play_trash_last_run_fort_ice_add_tags"],
  },
  "onr_proteus_122_rush-hour": {
    abilities: ["on_play_rd_run_access_four_without_noisy_breakers"],
  },
  "onr_proteus_123_senatorial-field-trip": {
    abilities: ["on_play_derez_last_black_ice_or_bad_publicity"],
  },
  onr_proteus_124_stakeout: {
    abilities: ["on_play_gain_two_credits_draw_one"],
  },
  "onr_proteus_125_subliminal-corruption": {
    abilities: ["on_play_run_with_advertisement_bad_publicity"],
  },
  "onr_proteus_126_test-spin": {
    runnerEventLongtail: ["search_install_program_run_return_or_damage"],
  },
  "onr_proteus_127_weefle-initiation": {
    abilities: ["on_play_run_with_damage_prevention_pool"],
  },
  "onr_proteus_128_airport-locker": {
    abilities: [
      "runner_main_search_install_program",
      "during_run_search_install_program",
    ],
  },
  "onr_proteus_129_back-door-to-netwatch": {
    abilities: ["trace_success_cancel_window"],
  },
  "onr_proteus_130_back-door-to-rivals": {
    abilities: ["trace_base_link_two", "trace_post_bid_link_plus_one"],
  },
  "onr_proteus_131_bargain-with-viacox": {
    uniqueDirectLongtail: ["runner_start_turn_forced_random_action"],
  },
  "onr_proteus_132_bolt-hole": {
    damagePreventionSources: ["trash_source_prevent_two_meat_damage"],
  },
  "onr_proteus_133_chiba-bank-account": {
    abilities: ["pay_and_trash_source_gain_four_credits"],
  },
  "onr_proteus_135_cortical-stimulators": {
    damagePreventionSources: ["once_per_turn_prevent_one_net_or_core_damage"],
  },
  "onr_proteus_136_credit-subversion": {
    successfulRunFollowups: ["hq_success_reveal_trash_source_corp_lose_three"],
  },
  "onr_proteus_137_death-from-above": {
    successfulRunFollowups: ["remote_success_reveal_trash_source_and_fort"],
  },
  "onr_proteus_138_deck-the": {
    abilities: ["trace_base_link_five", "trace_post_bid_link_plus_one"],
  },
  "onr_proteus_140_expendable-family-member": {
    tagPreventionSources: ["pay_and_trash_source_avoid_tag"],
  },
  "onr_proteus_141_get-ready-to-rumble": {
    runnerUtilityLongtail: ["post_meat_damage_random_hq_discard"],
  },
  "onr_proteus_142_hq-mole": {
    abilities: ["hq_access_start_add_two_accesses"],
  },
  "onr_proteus_143_liberated-savings-account": {
    abilities: ["pay_and_trash_source_gain_eleven_credits"],
  },
  "onr_proteus_144_lucidrinetm-drip-feed": {
    uniqueDirectLongtail: ["start_turn_drip_counter_action_or_core_damage"],
  },
  "onr_proteus_145_mercenary-subcontract": {
    runnerUtilityLongtail: ["current_access_pay_and_trash_source_free_trash"],
  },
  "onr_proteus_147_r-and-d-mole": {
    abilities: ["rd_access_start_add_two_accesses"],
  },
  "onr_proteus_148_runner-sensei": {
    abilities: ["trace_base_link_four", "trace_post_bid_link_plus_one"],
  },
  onr_proteus_149_simulacrum: {
    abilities: ["during_run_trash_source_pass_ap_ice"],
  },
  "onr_proteus_150_streetware-distributor": {
    abilities: ["runner_main_add_three_hosted_credits"],
  },
  "onr_proteus_152_swiss-bank-account": {
    abilities: [
      "trash_source_gain_two_credits",
      "pay_three_trash_source_gain_six",
    ],
  },
  "onr_proteus_153_time-to-collect": {
    trashPreventionSources: ["trash_source_prevent_resource_trash"],
  },
  "onr_proteus_154_wired-switchboard": {
    abilities: ["trace_post_bid_trash_source_link_plus_three"],
  },
});
