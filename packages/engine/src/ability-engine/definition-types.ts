/**
 * Defines the declarative, engine-local CardImplementation vocabulary.
 *
 * This file describes what card files may declare. It must not execute effects,
 * query GameState, or contain concrete card IDs; runtime modules interpret these
 * types through explicit effect, lifecycle, modifier, and limit pipelines.
 */
import type {
  CardType,
  CounterType,
  DamageType,
  EventVisibilityClass,
  ServerId,
  Side,
} from "@netgrid/shared";

export type CardModifierImplementation =
  | CardRezCostModifierImplementation
  | CardInstallCostModifierImplementation
  | CardNewDataFortCreationLockModifierImplementation
  | CardStealCostModifierImplementation
  | CardIceStrengthModifierImplementation
  | CardAdditionalSubroutineModifierImplementation
  | CardHandSizeModifierImplementation
  | CardMemoryUnitsModifierImplementation
  | CardAgendaDifficultyModifierImplementation
  | CardTrashCostModifierImplementation
  | CardBreakSubroutineCostModifierImplementation
  | CardAccessCountModifierImplementation;

export type CardAbilityImplementation =
  | OnPlayCardAbilityImplementation
  | ActivatedCardAbilityImplementation;

export type CardLifecycleImplementation = {
  // These lifecycle hooks are deliberately narrow CardImplementation entry
  // points. They are not a general trigger registry with priorities or choices.
  on_rez?: readonly CardEffectImplementation[];
  on_install?: readonly CardEffectImplementation[];
  on_score?: readonly CardEffectImplementation[];
  on_leave_play?: readonly CardEffectImplementation[];
  start_of_corp_turn?: readonly CardLifecycleTriggeredAbilityImplementation[];
  start_of_runner_turn?: readonly CardLifecycleTriggeredAbilityImplementation[];
  end_of_runner_turn?: readonly CardLifecycleTriggeredAbilityImplementation[];
  on_runner_run_start?: readonly CardLifecycleTriggeredAbilityImplementation[];
};

export type CardInstallTargetBindingImplementation = {
  kind:
    | "choose_data_fort_on_install"
    | "choose_installed_ice_on_install"
    | "choose_icebreaker_subtype_on_install";
  stores: "selectedServerId" | "selectedCardId" | "selectedSubtype";
  choices?:
    | readonly "code_gate"[]
    | readonly ("code_gate" | "sentry" | "wall")[];
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardCorpUtilityImplementation =
  | {
      kind: "gain_restricted_install_actions";
      amount: 3;
      mayStopEarly: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corp_archives_to_hq";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "corp_rd_top_reorder";
      count: 5;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "trojan_horse_tag";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "gain_credits_from_stolen_agenda_advancement_history";
      multiplierPerAdvancementCounter: 3;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "trash_runner_resources_if_tagged";
      max: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "power_grid_overload";
      excludesSubtype: "cybernetics";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "shuffle_hq_into_rd_then_draw_same_count";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "move_installed_corp_card_to_hq";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "end_turn_tag_if_runner_received_tag";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "counter_prevention_replacement";
      cost: { kind: "credit"; amount: 1 };
      limit: "once_per_turn_per_source";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "run_start_tax";
      amount: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "recurring_trace_credit_pool";
      amount: 1;
      counterType: Extract<CounterType, "bit">;
      spendWindow: "trace";
      refresh: "start_of_corp_turn_after_use";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "advance_counter_temporary_install_rez_credits";
      amount: number;
      creditsPerCounter: number;
      cleanup: "end_of_turn";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "advance_counter_temporary_trace_credits";
      amount: number;
      creditsPerCounter: number;
      timing: "during_trace_attempt";
      cleanup: "trace_end";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corp_run_hq_draw";
      cost: { kind: "credit"; amount: number };
      timing: "during_run_on_hq";
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "same_fort_advancement_counters_to_run_credits";
      cost: { kind: "tap_source" };
      creditsPerCounter: number;
      timing: "during_run";
      cleanup: "run_end";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "x_future_actions_and_credit_forfeit";
      costMultiplier: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "start_run_redirect_to_source_fort";
      cost: { credits: number };
      timing: "run_start";
      redirectTarget: "source_fort";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "fort_start_reorder_ice";
      cost: { kind: "credit"; amount: 0 };
      timing: "start_of_run";
      target: "source_fort";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "fort_start_runner_spend_cap";
      timing: "start_of_run";
      target: "source_fort";
      mayRezAtWindow: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "trash_own_rezzed_ice_gain_credits";
      gainCredits: number;
      target: "own_rezzed_ice";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "expose_prevention";
      cost: { kind: "credit"; amount: number };
      timing: "during_expose_attempt";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "meat_damage_boost";
      cost: { kind: "advancement_counter"; amount: number };
      amount: number;
      timing: "successful_meat_damage";
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardHiddenReplacementLongtailImplementation =
  | {
      kind: "successful_run_fort_ice_reorder";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "secret_spend_guess_then_targeted_bypass_run";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "conceal_and_reorder_installed_ice";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "delayed_install_with_counter_countdown";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "delayed_agenda_access_replacement";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "purge_replacement_with_runner_virus_counter_cleanup";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    };

export type CardCorpTrashInstalledRunnerSourceImplementation = {
  kind: "corp_trash_installed_runner_resource";
  timing: "corp_main";
  cost: { clicks: 1; credits: number };
  target: "source";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardRunnerUtilityLongtailImplementation =
  | {
      kind: "replace_installed_program_trash_with_host_on_source";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "trash_fully_broken_passed_ice";
      timing: "after_passing_fully_broken_ice";
      target: "that_ice";
      cost: "target_rez_cost";
      trashSourceOnResolve: true;
      limit: "once_per_turn_per_source";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "derez_fully_broken_passed_ice_and_end_run";
      cost: { kind: "credit"; amount: number };
      timing: "after_passing_fully_broken_ice";
      target: "that_ice";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "rabbit_ice_trace_limit_reduction";
      amount: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "submarine_uplink_trace_link_force_jack_out";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "i_spy_successful_run_fort_counter_expose";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "field_reporter_end_turn_rezzed_ice_payout";
      amountPerRezzedIce: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "optional_extra_action_with_delayed_damage";
      extraActions: number;
      damageType: "core" | "net" | "meat";
      damageAmount: number;
      damageTiming: "end_of_turn";
      preventable: boolean;
      limit: "once_per_turn_per_source";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "start_turn_random_effect_table";
      dieFaces: number;
      randomPurpose: "runner_start_turn_source";
      outcomes: Array<
        | {
            roll: number;
            kind: "trash_source_and_grant_persistent_extra_action";
            extraActions: number;
          }
        | {
            roll: number;
            kind: "unpreventable_damage";
            damageType: "core" | "net" | "meat";
            amount: number;
          }
      >;
      defaultOutcome: { kind: "no_effect" };
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "microtech_trode_set_ap_subroutine_modifier";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "hidden_resource_current_access_free_trash";
      cost: { kind: "credit_and_tap_source"; amount: number };
      target: "current_accessed_cards";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "hidden_resource_post_meat_damage_random_hq_discard";
      cost: { kind: "tap_source" };
      amount: number;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    };

export type CardAccessHookImplementation =
  | {
      kind: "pre_access_rd_cut";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "post_access_private_look";
      afterAccessServer: Extract<ServerId, "hq">;
      lookZone: Extract<ServerId, "hq">;
      count: "all";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    };

export type CardAccessZone = "installed" | "hq" | "rd" | "archives";

export type CardAccessEffectImplementation = {
  kind: "on_access";
  sourceZones: readonly CardAccessZone[];
  ignoreIfAccessedFrom?: readonly CardAccessZone[];
  revealIfAccessedFrom?: readonly Extract<CardAccessZone, "rd">[];
  condition?: CardConditionImplementation;
  cost?: {
    kind: "corp_may_pay_credits";
    amount: number;
  };
  effects: readonly CardAccessEffectStepImplementation[];
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type CardAccessEffectStepImplementation =
  | CardEffectImplementation
  | {
      kind: "add_runner_counter";
      counterType: Extract<CounterType, "crying" | "doppelganger_antibody">;
      amount: number;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "trace";
      baseTraceStrength: number;
      onSuccess: readonly CardTraceSuccessEffectImplementation[];
      limit: "once_per_run_on_this_fort_per_source";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "damage_from_source_advancement_counters";
      recipient: "runner";
      damageType: Extract<DamageType, "net" | "core">;
      amountPerCounter: number;
      minimumAmount: number;
      preventable: true;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "trash_installed_runner_cards";
      target: "program" | "hardware" | "daemon";
      amount:
        | number
        | {
            kind: "source_advancement_counter_count";
          };
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "return_installed_runner_programs_to_grip";
      chooser: "corp";
      amount: {
        kind: "source_advancement_counter_count";
        multiplier: number;
      };
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "reduce_current_access_queue";
      target: "remaining_stored_cards_in_this_fort";
      amount: 1;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    };

export type CardSuccessfulRunFollowupImplementation =
  | {
      kind: "optional_make_run_after_successful_run";
      limit: "once_per_turn_per_source";
      cost: "none";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "reverse_ice_on_successful_run_fort";
      timing: "immediately_after_successful_run";
      cost: "none";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "force_rez_ice_outermost_inward_after_successful_run";
      cost: { kind: "credit"; amount: number };
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "skip_rd_access_add_purgeable_runner_virus_counter";
      counterType: "doom";
      amount: 1;
      cost: "none";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "successful_run_before_access_effect";
      abilityKey?: string;
      timing: "immediately_after_successful_run_before_access";
      server: "hq";
      source: "installed_hidden_runner_resource";
      cost: { kind: "reveal_and_tap_source" };
      effect: { kind: "corp_lose_credits"; amount: number };
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "successful_run_before_access_effect";
      abilityKey?: string;
      timing: "immediately_after_successful_run_before_access";
      server: "remote";
      source: "installed_hidden_runner_resource";
      cost: { kind: "reveal_and_tap_source" };
      effect: { kind: "trash_remote_fort"; include: "root_and_ice" };
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    };

export type CardFortRunWindowImplementation =
  | {
      kind: "discounted_rez_ice_on_this_fort";
      timing: "during_run_on_this_fort";
      discount: "half_rez_cost_rounded_down";
      target: "unrezzed_ice_on_this_fort";
      limit: "once_per_run_per_source";
      endOfRun: "derez_target";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "swap_unrezzed_fort_ice_with_hq_ice";
      timing: "during_run_on_this_fort";
      target: "unrezzed_ice_on_this_fort";
      hqCard: "ice";
      replacementEnters: "concealed_unrezzed";
      limit: "once_per_run_per_source";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "temporary_hq_ice_encounter_after_successful_run";
      timing: "before_successful_run_finalizes_on_this_fort";
      hqCard: "ice";
      cost: "half_rez_cost_rounded_down";
      limit: "once_per_run_per_source";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "install_hq_ice_innermost_after_successful_run";
      timing: "before_successful_run_finalizes_on_this_fort";
      hqCard: "ice";
      installCost: "one_per_existing_ice_on_fort";
      limit: "once_per_run_per_source";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "block_stealth_bits_during_runs_on_this_fort";
      timing: "during_run_on_this_fort";
      blocks: "runner_stealth_bit_payment_sources";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "aardvark_worm_lock_and_reaction";
      timing: "during_run_on_this_fort";
      blocks: "runner_worm_icebreaker_use";
      reaction: "rez_to_trash_worm_and_cancel_current_use";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "corp_trace_bits_during_runs_on_this_fort";
      timing: "during_run_on_this_fort";
      amount: number;
      counterType: Extract<CounterType, "bit">;
      refresh: "start_of_corp_turn_after_use";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "roll_die_on_pass_rezzed_ice_on_same_fort";
      timing: "pass_rezzed_ice_on_this_fort";
      dieFaces: 6;
      endRunOn: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "add_advancement_counters_after_passing_last_ice_on_this_fort";
      timing: "pass_last_ice_on_this_fort";
      cost: { kind: "credit"; amount: number };
      target: "advanceable_installed_card_in_this_fort";
      amount: number;
      limit: "once_per_run_per_source";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "runner_pay_or_end_run_after_passing_ice_on_this_fort";
      timing: "pass_ice_on_this_fort";
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corp_return_passed_ice_to_hq";
      timing: "after_runner_passes_this_ice";
      mode: "required_pay_or_return" | "optional_return_gain";
      paymentAmount?: number;
      gainCredits?: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "move_self_to_different_position_on_same_fort";
      timing: "start_of_run_on_this_fort";
      cost: { kind: "credit"; amount: number };
      target: "different_position_on_same_fort";
      revealIfUnrezzed: true;
      limit: "once_per_run_per_source";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "can_run_fort_only_if_last_corp_turn_activity_on_fort";
      timing: "run_start_legal";
      activity: "corp_installed_or_advanced_inside_or_on_fort_during_last_turn";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "gain_credits_after_unsuccessful_run_on_same_fort";
      timing: "after_unsuccessful_run_on_this_fort";
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardRegionBaselineImplementation = {
  kind: "region_baseline";
  rezOnInstall: true;
  installOnlyIfRezAffordable: true;
  oneRegionPerFort: true;
  trashOlderRegions: true;
};

export type CardInstallCapabilityImplementation =
  | {
      kind: "rez_on_install";
      installOnlyIfRezAffordable: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "install_only_in_hq";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "install_only_inside_subsidiary_data_fort";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "install_only_in_hq_or_rd";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "runner_made_successful_run_on_server_this_turn";
      server: Extract<ServerId, "hq" | "rd"> | "any_data_fort";
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardFortCapacityModifierImplementation = {
  kind: "additional_agenda_or_node_slot_inside_fort";
  amount: number;
  activeWhile: "installed";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardLeavePlayCleanupImplementation = {
  kind: "trash_agenda_or_node_if_fort_over_capacity";
  target: "agenda_or_node_inside_same_fort";
  selection: "deterministic_lowest_instance_id";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardVariableRezImplementation =
  | {
      kind: "x_strength";
      additionalCostPerValue: 1;
      minValue: 0;
      maxValue: number;
      traceBaseFromValue?: true;
      traceBidLimitFromValue?: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "paid_end_the_run_subroutines";
      additionalCostPerSubroutine: 2;
      minSubroutines: 0;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "alternate_subtype";
      additionalCost: number;
      baseSubtypes: readonly string[];
      alternateSubtypes: readonly string[];
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardRelativeIceImplementation = {
  kind: "rezzed_ice_outside_this_ice";
  strengthBonusPerCount?: number;
  dynamicDamageSubroutine?: {
    subroutineId: string;
    amountPerCount: number;
    visibility: Extract<EventVisibilityClass, "public">;
  };
  dynamicTraceSubroutines?: {
    baseTraceStrength: number;
    traceSuccessEffect: { type: "add_tag"; amount: number };
    visibility: Extract<EventVisibilityClass, "public">;
  };
};

export type CardRunEncounterInterventionImplementation =
  | {
      kind: "approach_ice_expose_then_jack_out_before_rez";
      timing: "approaching_unrezzed_ice";
      target: "approached_unrezzed_ice";
      limit: "once_per_run_per_source";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "jack_out_after_corp_rezzes_upgrade_or_node_before_effect";
      timing: "after_corp_rezzes_upgrade_or_node_before_effect";
      cost: { kind: "credit"; amount: 0 };
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardRunnerEventLongtailImplementation =
  | {
      kind: "playful_ai_dice_loop";
      dieFaces: 6;
      choiceOn: readonly [1, 2, 3];
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "grip_install_program_or_hardware_with_temporary_credits";
      temporaryCredits: 3;
      allowedTypes: readonly Extract<CardType, "program" | "hardware">[];
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "search_stack_install_program_free_then_run_return_or_penalty";
      installCost: "free";
      shuffleAfterwards: true;
      penaltyBase: 4;
      penaltyDamageType: Extract<DamageType, "meat">;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "trash_installed_runner_connections_then_add_bad_publicity";
      count: 2;
      badPublicity: 1;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    };

export type CardVirusCounterKindImplementation =
  | "boardwalk"
  | "successful_hq_run_pair_credit"
  | "cockroach"
  | "cascade"
  | "crumble"
  | "doom"
  | "garbage"
  | "highlighter"
  | "thought"
  | "fait"
  | "gremlin"
  | "incubate"
  | "pattel"
  | "pipe"
  | "pox"
  | "scaldan"
  | "skivviss"
  | "socket_archives"
  | "socket_hq"
  | "socket_rd"
  | "tax"
  | "vienna";

export type CardVirusCounterImplementation = {
  counterKind: CardVirusCounterKindImplementation;
  addOnSuccessfulRun?: {
    server:
      | "hq"
      | "rd"
      | "archives"
      | "central"
      | "any"
      | "subsidiary_data_fort";
    target:
      | "source"
      | "successful_run_server"
      | "chosen_fully_broken_ice"
      | "corp_purgeable_runner_virus_counter"
      | "central_server_socket_counters";
    amount: 1;
    visibility: Extract<EventVisibilityClass, "public">;
  };
  startOfRunnerTurn?:
    | {
        kind: "random_reveal_hq_cards_per_two_counters";
        perCounters: 2;
        countPerGroup: 1;
        visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
      }
    | {
        kind: "gain_credits_per_two_counters";
        recipient: "runner";
        perCounters: 2;
        amountPerGroup: 1;
        visibility: Extract<EventVisibilityClass, "public">;
      }
    | {
        kind: "private_look_top_rd_at_threshold";
        threshold: 3;
        count: 1;
        visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
      }
    | {
        kind: "incubator_duplicate_virus_counter";
        rollPerCounter: true;
        successDieValue: 6;
        visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
      };
  startOfCorpTurn?:
    | {
        kind: "trash_faceup_rd_cards_per_two_counters";
        perCounters: 2;
        countPerGroup: 1;
        visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
      }
    | {
        kind: "draw_extra_cards_per_counter";
        amountPerCounter: 1;
        visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
      };
  continuousEffect?:
    | {
        kind: "randomize_corp_hq_discards_at_threshold";
        threshold: 2;
        visibility: Extract<EventVisibilityClass, "public">;
      }
    | {
        kind: "corp_hand_size_reduce_per_two_counters";
        perCounters: 2;
        amountPerGroup: 1;
        visibility: Extract<EventVisibilityClass, "public">;
      }
    | {
        kind: "agenda_difficulty_increase_per_two_fort_counters";
        perCounters: 2;
        amountPerGroup: 1;
        visibility: Extract<EventVisibilityClass, "public">;
      }
    | {
        kind: "ice_strength_reduce_per_counter";
        amountPerCounter: 1;
        visibility: Extract<EventVisibilityClass, "public">;
      }
    | {
        kind: "corp_install_cost_increase_per_two_fort_counters";
        perCounters: 2;
        amountPerGroup: 1;
        visibility: Extract<EventVisibilityClass, "public">;
      };
};

export type CardScoredAgendaImplementation =
  | {
      kind: "gain_credits_on_score";
      recipient: "corp";
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "add_counters_on_score";
      counterType: Extract<CounterType, "boon">;
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "score_credit_swing_if_corp_credit_threshold_met";
      threshold: number;
      gainAmount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "scored_agenda_credit_until_install_or_rez";
      counterType: Extract<CounterType, "mark">;
      gainAmount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "shuffle_hq_archives_into_rd_then_draw";
      drawCount: 5;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "meat_damage_bonus";
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "overadvance_bonus_agenda_points";
      perExcessAdvancementCounters: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "fixed_bonus_agenda_points_on_score";
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "overadvance_start_of_corp_turn_credits";
      perExcessAdvancementCounters: number;
      creditPerGroup: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "overadvance_start_of_corp_turn_actions";
      perExcessAdvancementCounters: number;
      actionPerGroup: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corp_start_turn_random_restricted_optional_action";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corp_damage_replacement_pdca_action_counter";
      counterType: Extract<CounterType, "pdca">;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "tagged_runner_meat_damage_reduce_hand_size_on_success";
      damageAmount: number;
      handSizeReduction: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "choose_fort_ice_strength_bonus";
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "reveal_installed_ice_subtype_for_credits";
      subtype: "code_gate" | "wall";
      creditPerRevealedOrRezzed: number;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "score_rez_installed_ice_at_no_cost";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "select_rezzed_ice_mark_modifier";
      abilityKey?: string;
      target: "rezzed_installed_ice";
      counterType: Extract<CounterType, "mark">;
      counterAmount: 1;
      strengthBonusPerCounter: 1;
      duplicateEachPrintedSubroutinePerCounter: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "shuffle_selected_hq_agendas_into_rd_gain_credits";
      creditPerAgendaPoint: number;
      shuffleSelectedIntoRnd: true;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "reveal_top_rd_install_and_rez_ice_trash_rest";
      count: 3;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "score_install_hq_cards_into_new_remote_then_rez";
      abilityKey?: string;
      sourceZone: "hq";
      targetServer: "new_remote";
      allowedCards: "corp_installable";
      maxCards: number;
      temporaryCredits: {
        amount: number;
        usableFor: "rez_installed_cards_from_sequence";
        returnUnused: true;
      };
      optionalRez: true;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    };

export type HostedProgramCapacityImplementation = {
  capacityMu: number;
  allowedCardTypes: readonly ["program"];
  allowedProgramSubtypes?: readonly string[];
  maxHostedPrograms?: number;
  hostedProgramsAreInstalled: true;
  hostLeavesPlayTrashesHosted: true;
};

export type HostedProgramModifierImplementation = {
  appliesTo: "hosted_icebreakers";
  kind: "icebreaker_strength";
  operation: "reduce";
  amount: number;
};

export type CardLifecycleTriggeredAbilityImplementation = {
  condition?: CardConditionImplementation;
  effects: readonly CardEffectImplementation[];
};

export type OnPlayCardAbilityImplementation = {
  kind: "on_play";
  costs: "printed";
  condition?: CardConditionImplementation;
  effects: CardEffectImplementation[];
};

export type CardConditionImplementation =
  | { kind: "runner_is_tagged" }
  | { kind: "source_has_hosted_credits" }
  | { kind: "source_has_advancement_counters"; minimum: number }
  | { kind: "runner_attempted_run_last_turn"; minimumRuns: number }
  | { kind: "runner_attempted_run_this_game"; minimumRuns: number }
  | { kind: "runner_trashed_node_last_turn" }
  | { kind: "runner_trashed_advertisement_this_turn" }
  | { kind: "runner_trashed_transactions_this_turn" }
  | { kind: "runner_installed_resource_last_turn" }
  | { kind: "runner_damaged_during_last_three_actions" }
  | {
      kind: "runner_liberated_agenda_subtype_this_turn";
      subtype: "research" | "gray_ops" | "black_ops";
    }
  | {
      kind: "corp_scored_agenda_subtype_last_turn";
      subtype: "black_ops";
    }
  | {
      kind: "runner_made_successful_run_on_server_this_turn";
      server: Extract<ServerId, "hq" | "rd"> | "any_data_fort";
    }
  | { kind: "runner_made_successful_hq_and_rd_runs_this_turn" }
  | { kind: "corp_rezzed_black_ice_this_turn" }
  | { kind: "current_encounter_ice" }
  | {
      kind: "current_encounter_ice_subtype";
      subtype: "ap";
    }
  | {
      kind: "current_run_server";
      server: Extract<ServerId, "hq" | "rd">;
    };

export type ActivatedCardAbilityImplementation = {
  kind: "activated";
  timing:
    | "runner_main"
    | "during_run"
    | "runner_cost_penalty_support"
    | "access_start"
    | "corp_main"
    | "corp_encounter"
    | "corp_during_run"
    | "corp_trace_window"
    | "corp_start_run_window"
    | "trace_base_link_window"
    | "trace_post_bid_link_window"
    | "trace_success_cancel_window";
  costs: readonly CardAbilityCostImplementation[];
  condition?: CardConditionImplementation;
  limit?: CardAbilityLimitImplementation;
  effects: readonly CardEffectImplementation[];
  label?: string;
};

export type CardAbilityLimitImplementation =
  | {
      kind: "once_per_turn_per_source";
      scope: "any_ability_on_source";
    }
  | {
      kind: "one_base_link_card_per_trace_attempt";
      scope: "trace_attempt";
    }
  | {
      kind: "once_per_trace_per_source";
      scope: "source";
    }
  | {
      kind: "once_per_run_per_source";
      scope: "source";
    };

export type CardAbilityCostImplementation =
  | {
      kind: "action";
      amount: number;
    }
  | {
      kind: "credit";
      amount: number;
    }
  | {
      kind: "advancement_counter";
      amount: number;
      source: "source";
    }
  | {
      kind: "source_counter";
      counterType: Extract<CounterType, "boon">;
      amount: number;
      source: "source";
    }
  | {
      kind: "trash_source";
      amount: 1;
    }
  | {
      kind: "tap_source";
      amount: 1;
    }
  | {
      kind: "corp_random_discard_hq";
      amount: number;
    }
  | {
      kind: "trash_corp_rd_top";
      amount: 2;
    };

export type CardUniqueDirectLongtailImplementation =
  | {
      kind: "karl_successful_run_credit";
      amount: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "smiths_pawnshop_start_turn_trash_for_credits";
      gainCredits: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "databroker_agenda_point_credits";
      agendaPointCost: 1;
      gainCredits: 10;
      trashSource: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "runner_start_turn_forced_random_action";
      startsTurnAfterInstall: true;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "runner_start_turn_drip_counter_action_or_core_damage";
      counterType: Extract<CounterType, "drip">;
      threshold: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "nevinyrral_action_and_lose_on_rezzed_leave";
      actionGain: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "i_got_a_rock_tagged_meat_damage";
      requiredRunnerTags: 2;
      agendaPointCost: 3;
      damageType: Extract<DamageType, "meat">;
      damageAmount: 15;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "schlaghund_tag_die_meat_damage";
      damageType: Extract<DamageType, "meat">;
      damageAmount: 10;
      trashSourceOnSuccess: true;
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardRemainingReplacementLongtailImplementation =
  | {
      kind: "crash_everett_draw_extra_choose_trash_or_top";
      extraDraw: 1;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "run_action_spending_cap";
      actionGain: 1;
      spendingCap: 3;
      appliesTo: readonly ["icebreaker_use", "increase_link"];
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "obligation_debt";
      agendaPointRezCost: 1;
      gainCreditsOnRez: 12;
      endTurnCreditDebt: 1;
      removeDebtCost: 12;
      agendaPointsOnRemove: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "investment_firm_credit_diversion";
      counterType: Extract<CounterType, "recurring_credit">;
      hostedCreditsPerDivertedCredit: 2;
      startTurnTakeCredits: 1;
      excludeStartTurnCreditGains: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "runner_draw_tax_tag";
      avoidTagCost: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "hacker_tracker_trace_bits";
      counterType: Extract<CounterType, "bit">;
      addAfterTrace: 1;
      traceStrengthAndLimitPerBit: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "crybaby_crying_counter";
      counterType: Extract<CounterType, "crying">;
      linkReductionPerCounter: 2;
      removeCost: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardEffectImplementation =
  | GainCreditsEffectImplementation
  | GainCreditsForRunnerTrashHistoryEffectImplementation
  | AddBadPublicityEffectImplementation
  | AddBadPublicityFromFrameUpHistoryEffectImplementation
  | DrawCardsEffectImplementation
  | LoseCreditsEffectImplementation
  | AddTagsEffectImplementation
  | RemoveTagsEffectImplementation
  | AvoidNextTagEffectImplementation
  | ReturnSourceToGripIfPaidEffectImplementation
  | AddCountersToSourceEffectImplementation
  | DamageEffectImplementation
  | TraceEffectImplementation
  | MakeRunEffectImplementation
  | AddHostedCreditsEffectImplementation
  | TakeHostedCreditsEffectImplementation
  | TrashSourceWhenEmptyEffectImplementation
  | GainActionsEffectImplementation
  | TrashSourceEffectImplementation
  | PayCreditsOrLoseGameEffectImplementation
  | UseBaseLinkEffectImplementation
  | IncreaseTraceLinkEffectImplementation
  | PrivateLookEffectImplementation
  | ExposeInstalledCardEffectImplementation
  | ExposeInstalledCardsEffectImplementation
  | ExposeOutermostIceEachFortEffectImplementation
  | ShowHqAgendasForCreditsEffectImplementation
  | SearchTrashToGripEffectImplementation
  | SearchStackToGripEffectImplementation
  | MoveTopTrashToGripEffectImplementation
  | SearchStackInstallEffectImplementation
  | ChooseStackOrTrashProgramInstallEffectImplementation
  | LookTopStackShowToCorpThenInstallMatchingEffectImplementation
  | LookTopStackTakeMatchingEffectImplementation
  | LookTopStackTakeOneArrangeRestEffectImplementation
  | TrashOwnInstalledCardsForCreditsEffectImplementation
  | TrashCardsFromGripForCreditsEffectImplementation
  | ShuffleGripTrashAndStackThenDrawEffectImplementation
  | MarkPrearrangedDropEffectImplementation
  | MarkNextAgendaAccessAgendaPointEffectImplementation
  | MakeRunEachDataFortSequenceEffectImplementation
  | PayRezCostToTrashRezzedIceEffectImplementation
  | TrashRezzedIceOnLastSuccessfulRunFortEffectImplementation
  | TrashUnrezzedIceEffectImplementation
  | CorpChoiceRezOrTrashIceEffectImplementation
  | CorpChoiceDerezLastRezzedBlackIceOrBadPublicityEffectImplementation
  | GainCreditsPerAdvancementCounterOnSourceEffectImplementation
  | AddCounterToAllInstalledRunnerIcebreakersEffectImplementation
  | GainRunnerEventAgendaPointEffectImplementation
  | GainRunnerEventAgendaPointIfLiberatedAgendaSubtypeEffectImplementation
  | ShuffleSourceIntoCorpRdEffectImplementation
  | TrashCorpInstalledCardsInSourceServerEffectImplementation
  | CorpRandomDiscardFromHqEffectImplementation
  | CorpDiscardHqWithRetainPaymentEffectImplementation
  | DerezRezzedBlackIceEffectImplementation
  | AddCurrentEncounterAdditionalSubroutineEffectImplementation
  | AddCurrentRunAccessCountEffectImplementation
  | PassCurrentEncounteredIceEffectImplementation
  | StartRunnerProgramInstallActionBundleEffectImplementation
  | DistributeAdvancementCountersEffectImplementation
  | MoveAdvancementCountersEffectImplementation
  | GainTemporaryCorpCreditsEffectImplementation
  | GainTemporaryCorpRunCreditsEffectImplementation
  | GainTemporaryTraceCreditsEffectImplementation
  | RemoveSameFortAdvancementCountersForRunCreditsEffectImplementation
  | CopySameFortIceSubroutineForRunEffectImplementation
  | TrashOwnRezzedIceForCreditsEffectImplementation
  | FreeRezInstalledIceWithCountersEffectImplementation
  | ReplaceFortCardsFromHqEffectImplementation;

export type GainCreditsEffectImplementation = {
  kind: "gain_credits";
  recipient: "controller" | "runner" | "corp";
  amount: number;
  visibility: EventVisibilityClass;
};

export type GainCreditsForRunnerTrashHistoryEffectImplementation = {
  kind: "gain_credits_for_runner_trash_history";
  recipient: "controller";
  advertisementAmount: number;
  transactionsAmount: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type AddBadPublicityEffectImplementation = {
  kind: "add_bad_publicity";
  amount: number;
  visibility: Extract<EventVisibilityClass, "public">;
  sourceVisibility?: "public" | "redacted";
};

export type AddBadPublicityFromFrameUpHistoryEffectImplementation = {
  kind: "add_bad_publicity_from_frame_up_history";
  baseAmount: 1;
  additionalAmount: 1;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type GainCreditsPerAdvancementCounterOnSourceEffectImplementation = {
  kind: "gain_credits_per_advancement_counter_on_source";
  recipient: "controller" | "corp";
  amountPerCounter: number;
  visibility: EventVisibilityClass;
};

export type AddCounterToAllInstalledRunnerIcebreakersEffectImplementation = {
  kind: "add_counter_to_all_installed_runner_icebreakers";
  counterType: Extract<CounterType, "militech" | "pattel_antibody">;
  amount: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type ShuffleSourceIntoCorpRdEffectImplementation = {
  kind: "shuffle_source_into_corp_rd";
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type TrashCorpInstalledCardsInSourceServerEffectImplementation = {
  kind: "trash_corp_installed_cards_in_source_server";
  include: "root_and_ice";
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type GainRunnerEventAgendaPointEffectImplementation = {
  kind: "gain_runner_event_agenda_point";
  amount: 1;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type GainRunnerEventAgendaPointIfLiberatedAgendaSubtypeEffectImplementation =
  {
    kind: "gain_runner_event_agenda_point_if_liberated_agenda_subtype";
    subtype: "black_ops";
    amount: 1;
    visibility: Extract<EventVisibilityClass, "public">;
  };

export type CorpRandomDiscardFromHqEffectImplementation = {
  kind: "corp_random_discard_from_hq";
  count: number;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type CorpDiscardHqWithRetainPaymentEffectImplementation = {
  kind: "corp_discard_hq_with_retain_payment";
  retainCostPerCard: number;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type DerezRezzedBlackIceEffectImplementation = {
  kind: "derez_rezzed_black_ice";
  target: "chosen_rezzed_black_ice";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type AddCurrentEncounterAdditionalSubroutineEffectImplementation = {
  kind: "add_current_encounter_additional_subroutine";
  target: "encountered_ice_self";
  append: "after_existing";
  subroutine: CardSubroutineImplementation;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type AddCurrentRunAccessCountEffectImplementation = {
  kind: "add_current_run_access_count";
  server: Extract<ServerId, "hq" | "rd">;
  amount: number;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type PassCurrentEncounteredIceEffectImplementation = {
  kind: "pass_current_encountered_ice";
  subtypeRequired?: "ap";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type StartRunnerProgramInstallActionBundleEffectImplementation = {
  kind: "start_runner_program_install_action_bundle";
  actionCount: 5;
  temporaryCredit: 1;
  allowedActionKind: "install_program";
  mayStopEarly: true;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type DistributeAdvancementCountersEffectImplementation = {
  kind: "distribute_advancement_counters";
  amount: number;
  target: "installed_advanceable_cards";
  distribution:
    | "single_target"
    | "any_combination"
    | "up_to_distinct_targets_one_each";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type MoveAdvancementCountersEffectImplementation = {
  kind: "move_advancement_counters";
  source: "chosen_card" | "source_card";
  target: "chosen_installed_advanceable_card";
  maxAmount: number | "all";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type GainTemporaryCorpCreditsEffectImplementation = {
  kind: "gain_temporary_corp_credits";
  recipient: "corp";
  amount: number;
  usableFor: "install_or_rez";
  cleanup: "end_of_turn";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type GainTemporaryCorpRunCreditsEffectImplementation = {
  kind: "gain_temporary_corp_run_credits";
  recipient: "corp";
  amount: number;
  usableFor: "corp_costs_during_this_run";
  cleanup: "run_end";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type GainTemporaryTraceCreditsEffectImplementation = {
  kind: "gain_temporary_trace_credits";
  recipient: "corp";
  amount: number;
  usableFor: "current_trace";
  cleanup: "trace_end";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type RemoveSameFortAdvancementCountersForRunCreditsEffectImplementation =
  {
    kind: "remove_same_fort_advancement_counters_for_run_credits";
    creditsPerCounter: number;
    maxAmount: "all";
    cleanup: "run_end";
    visibility: Extract<EventVisibilityClass, "public">;
  };

export type CopySameFortIceSubroutineForRunEffectImplementation = {
  kind: "copy_same_fort_ice_subroutine_for_run";
  target: "chosen_same_fort_ice_subroutine";
  append: "immediately_after_original";
  cleanup: "run_end";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type TrashOwnRezzedIceForCreditsEffectImplementation = {
  kind: "trash_own_rezzed_ice_for_credits";
  target: "chosen_own_rezzed_ice";
  gainCredits: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type FreeRezInstalledIceWithCountersEffectImplementation = {
  kind: "free_rez_installed_ice_with_counters";
  target: "chosen_installed_ice";
  counterType: Extract<CounterType, "kludge" | "term">;
  amount:
    | { kind: "bounded_x_by_rez_cost_min_one" }
    | { kind: "target_rez_cost" };
  lifecycle:
    | "remove_one_counter_start_corp_turn_trash_on_last"
    | "rent_to_own_start_corp_turn";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type ReplaceFortCardsFromHqEffectImplementation = {
  kind: "replace_source_fort_cards_from_hq";
  include: "root_and_ice";
  installCost: "free";
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type DrawCardsEffectImplementation = {
  kind: "draw_cards";
  recipient: "controller" | "runner" | "corp";
  amount: number;
  visibility: EventVisibilityClass;
};

export type ExposeInstalledCardEffectImplementation = {
  kind: "expose_installed_card";
  target: "chosen_installed_corp_card";
  scope: "inside_data_fort" | "any_installed";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type ExposeInstalledCardsEffectImplementation = {
  kind: "expose_installed_cards";
  targets: "chosen_installed_corp_cards";
  scope?: "any_installed" | "single_data_fort";
  min: number;
  max: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type ExposeOutermostIceEachFortEffectImplementation = {
  kind: "expose_outermost_ice_each_fort";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type ShowHqAgendasForCreditsEffectImplementation = {
  kind: "show_hq_agendas_for_credits";
  creditPerAgenda: number;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type SearchTrashToGripEffectImplementation = {
  kind: "search_trash_to_grip";
  filter: "program" | "any_card";
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type SearchStackToGripEffectImplementation = {
  kind: "search_stack_to_grip";
  filter: "program" | "any_card";
  revealToCorp: boolean;
  shuffleAfterwards: true;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type MoveTopTrashToGripEffectImplementation = {
  kind: "move_top_trash_to_grip";
  recipient: "runner";
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type SearchStackInstallEffectImplementation = {
  kind: "search_stack_install";
  filter: "program";
  installCost: "normal" | "free";
  shuffleAfterwards: true;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type ChooseStackOrTrashProgramInstallEffectImplementation = {
  kind: "choose_stack_or_trash_program_install";
  installCost: "free";
  shuffleStackIfSearched: true;
  returnInstalledCardToGripAtEndOfTurn: true;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type LookTopStackShowToCorpThenInstallMatchingEffectImplementation = {
  kind: "look_top_stack_show_to_corp_then_install_matching";
  count: 5;
  allowedTypes: readonly Extract<CardType, "program">[];
  installCost: "free";
  trashSourceIfInstalled: true;
  shuffleAfterwards: true;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type LookTopStackTakeMatchingEffectImplementation = {
  kind: "look_top_stack_take_matching";
  count: number;
  allowedTypes: readonly Extract<
    CardType,
    "program" | "event" | "hardware" | "resource"
  >[];
  costPerTaken: number;
  revealTakenToCorp: true;
  shuffleRemainder: true;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type LookTopStackTakeOneArrangeRestEffectImplementation = {
  kind: "look_top_stack_take_one_arrange_rest";
  count: 5;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type TrashOwnInstalledCardsForCreditsEffectImplementation = {
  kind: "trash_own_installed_cards_for_credits";
  target: "chosen_installed_runner_cards";
  min: 0 | 1;
  max: "any";
  gainPerTrashed: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type TrashCardsFromGripForCreditsEffectImplementation = {
  kind: "trash_cards_from_grip_for_credits";
  target: "chosen_runner_grip_cards";
  max: number;
  gainPerTrashed: number;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type ShuffleGripTrashAndStackThenDrawEffectImplementation = {
  kind: "shuffle_grip_trash_and_stack_then_draw";
  drawCount: number;
  removePlayedCardFromGame: true;
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type LoseCreditsEffectImplementation = {
  kind: "lose_credits";
  recipient: "controller" | "runner" | "corp";
  amount?: number;
  mode?: "amount" | "all";
  visibility: EventVisibilityClass;
};

export type AddTagsEffectImplementation = {
  kind: "add_tags";
  recipient: "runner";
  amount: number;
  visibility: EventVisibilityClass;
};

export type RemoveTagsEffectImplementation = {
  kind: "remove_tags";
  recipient: "runner";
  mode: "amount" | "up_to_amount" | "all";
  amount?: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type AvoidNextTagEffectImplementation = {
  kind: "avoid_next_tag";
  recipient: "runner";
  amount: 1;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type ReturnSourceToGripIfPaidEffectImplementation = {
  kind: "return_source_to_grip_if_paid";
  amount: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type AddCountersToSourceEffectImplementation = {
  kind: "add_counters_to_source";
  counterType: Extract<CounterType, "ablative" | "trauma" | "boon">;
  amount: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type DamageEffectImplementation = {
  kind: "damage";
  recipient: "runner";
  damageType: Extract<DamageType, "meat" | "net" | "core">;
  amount: number;
  preventable: boolean;
  visibility: EventVisibilityClass;
};

export type CardTraceSuccessEffectImplementation =
  | {
      kind: "add_tags";
      recipient: "runner";
      amount: number;
      visibility: EventVisibilityClass;
    }
  | {
      kind: "add_tags_by_trace_margin_over_runner_link";
      recipient: "runner";
      visibility: EventVisibilityClass;
    }
  | {
      kind: "add_counter";
      recipient: "runner";
      counterType: Extract<CounterType, "data_raven" | "cerberus" | "mastiff">;
      amount: number;
      visibility: EventVisibilityClass;
    }
  | {
      kind: "end_run";
      visibility: EventVisibilityClass;
    }
  | {
      kind: "trash_hardware";
      target: "installed_runner_hardware";
      visibility: EventVisibilityClass;
    }
  | {
      kind: "unpreventable_meat_damage";
      recipient: "runner";
      amount: number;
      visibility: EventVisibilityClass;
    }
  | {
      kind: "preventable_damage";
      recipient: "runner";
      damageType: Extract<DamageType, "net" | "core">;
      amount: number;
      visibility: EventVisibilityClass;
    }
  | {
      kind: "runner_run_lock_until_action_paid";
      amount: number;
      visibility: EventVisibilityClass;
    }
  | {
      kind: "trash_program";
      target: "installed_runner_program";
      visibility: EventVisibilityClass;
    }
  | {
      kind: "trash_runner_resource_and_add_tag";
      target: "runner_resource_installed_last_turn";
      visibility: EventVisibilityClass;
    };

export type TraceEffectImplementation = {
  kind: "trace";
  baseTraceStrength: number;
  additionalPlayCostPerBaseTracePointAboveZero?: number;
  onSuccess: readonly CardTraceSuccessEffectImplementation[];
  onFailure?: readonly CardTraceSuccessEffectImplementation[];
  visibility: EventVisibilityClass;
};

export type MakeRunEffectImplementation = {
  kind: "make_run";
  target:
    | {
        kind: "central_server";
        server: Extract<ServerId, "hq" | "rd" | "archives">;
      }
    | {
        kind: "chosen_server";
      };
  accessCount?: number;
  freeTrashAccessZones?: readonly Extract<ServerId, "hq" | "rd">[];
  accessServerOverride?: Extract<ServerId, "hq" | "rd" | "archives">;
  successfulRunAccessReplacement?:
    | "corp_lose_credits"
    | "runner_spend_corp_lose_credits"
    | "private_look_top_rd"
    | "archives_faceup_to_rd"
    | "trash_rezzed_ice_on_fort_and_tag_runner"
    | "runner_gain_agenda_point";
  successfulRunCreditLoss?: number;
  successfulRunRunnerTagGain?: number;
  successfulRunRunnerCreditGain?: number;
  successfulRunRequiresCorpCredits?: boolean;
  successfulRunPrivateLookCount?: number;
  successfulRunArchivesMoveCount?: number;
  followupRunOnEnd?: "optional";
  bypassFirstIce?: boolean;
  runTraceLinkBonus?: number;
  runTemporaryCredits?: {
    side: "runner";
    amount: number;
    usableFor: "any_runner_cost_during_this_run";
    returnUnusedAtRunEnd: true;
  };
  afterRunCompletedUnpreventableCoreDamage?: number;
  prohibitNoisyIcebreakers?: boolean;
  eventApproachIceExposeBeforeRez?: boolean;
  runnerCreditGainOnCorpRez?: number;
  damagePreventionPool?: number;
  badPublicityRunAftermath?: "live_news_feed" | "subliminal_corruption";
  visibility: EventVisibilityClass;
};

export type PayRezCostToTrashRezzedIceEffectImplementation = {
  kind: "pay_rez_cost_to_trash_rezzed_ice";
  target: "chosen_rezzed_ice";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type MarkPrearrangedDropEffectImplementation = {
  kind: "mark_next_agenda_access_credit_gain";
  amount: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type MarkNextAgendaAccessAgendaPointEffectImplementation = {
  kind: "mark_next_agenda_access_agenda_point";
  amount: 1;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type MakeRunEachDataFortSequenceEffectImplementation = {
  kind: "make_run_each_data_fort_sequence";
  onAllSuccessful: "gain_runner_event_agenda_point";
  onAnyUnsuccessful: "forgo_next_action";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type TrashRezzedIceOnLastSuccessfulRunFortEffectImplementation = {
  kind: "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags";
  tagAmount: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type TrashUnrezzedIceEffectImplementation = {
  kind: "trash_unrezzed_ice";
  target: "chosen_unrezzed_ice";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CorpChoiceRezOrTrashIceEffectImplementation = {
  kind: "corp_choice_rez_or_trash_ice";
  target: "chosen_installed_ice";
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CorpChoiceDerezLastRezzedBlackIceOrBadPublicityEffectImplementation =
  {
    kind: "corp_choice_derez_last_rezzed_black_ice_or_bad_publicity";
    badPublicity: 2;
    visibility: Extract<EventVisibilityClass, "public">;
  };

export type PrivateLookEffectImplementation = {
  kind: "private_look";
  zone: Extract<ServerId, "rd" | "hq">;
  count: number | "all";
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type AddHostedCreditsEffectImplementation = {
  // Hosted credits currently model public on-card bits only; this is not a
  // named-counter, virus-counter, or advancement-counter abstraction.
  kind: "add_hosted_credits";
  target: "source";
  amount: number;
  visibility: EventVisibilityClass;
};

export type TakeHostedCreditsEffectImplementation = {
  kind: "take_hosted_credits";
  source: "source";
  recipient: "controller";
  amount?: number;
  mode?: "up_to_amount_if_available" | "all";
  visibility: EventVisibilityClass;
};

export type TrashSourceWhenEmptyEffectImplementation = {
  kind: "trash_source_when_empty";
  source: "source";
  visibility: EventVisibilityClass;
};

export type GainActionsEffectImplementation = {
  kind: "gain_actions";
  recipient: "controller" | "runner" | "corp";
  amount: number;
  visibility: EventVisibilityClass;
};

export type TrashSourceEffectImplementation = {
  kind: "trash_source";
  visibility: EventVisibilityClass;
};

export type PayCreditsOrLoseGameEffectImplementation = {
  kind: "pay_credits_or_lose_game";
  payer: "controller" | "runner" | "corp";
  amount: number;
  loseSide: "controller" | "runner" | "corp";
  reason: "source_left_play";
  visibility: EventVisibilityClass;
};

export type UseBaseLinkEffectImplementation = {
  kind: "use_base_link";
  baseLink: number;
  rewardCreditsOnAvoidTrace?: number;
  visibility: EventVisibilityClass;
};

export type IncreaseTraceLinkEffectImplementation = {
  kind: "increase_trace_link";
  amount: number;
  rewardCreditsOnAvoidTrace?: number;
  visibility: EventVisibilityClass;
};

export type CardRezCostModifierImplementation = {
  kind: "rez_cost";
  operation: "reduce";
  amount: number;
  activeWhile: "rezzed";
  sourceZone: "corp_root";
  visibility: EventVisibilityClass;
  appliesTo: {
    cardType: "ice";
    subtype?: string;
    sameServerAsSource?: boolean;
  };
};

export type CardInstallCostModifierImplementation = {
  kind: "install_cost";
  operation: "increase" | "reduce";
  amount: number;
  activeWhile: "installed" | "rezzed";
  sourceZone: "corp_root" | "runner_installed";
  visibility: EventVisibilityClass;
  appliesTo: {
    side: Extract<Side, "corp">;
    cardType: Extract<CardType, "ice">;
    sameServerAsSource?: boolean;
    selectedServerAsSource?: boolean;
  };
};

export type CardNewDataFortCreationLockModifierImplementation = {
  kind: "new_data_fort_creation_lock";
  activeWhile: "installed";
  sourceZone: "runner_installed";
  side: Extract<Side, "corp">;
  visibility: Extract<EventVisibilityClass, "public">;
  blocks: "corp_new_remote_installs";
  corpTrashSourceCost: {
    clicks: 1;
    credits: number;
  };
};

export type CardStealCostModifierImplementation = {
  kind: "steal_cost";
  operation: "increase";
  amount: number;
  activeWhile: "rezzed";
  sourceZone: "corp_root";
  side: Extract<Side, "corp">;
  visibility: EventVisibilityClass;
  appliesTo: {
    cardType: Extract<CardType, "agenda">;
  };
  sameServerAsSource: true;
  persistsForCurrentAccessIfSourceTrashed: true;
};

export type CardSelfStealCostImplementation = {
  kind: "current_access_self_steal_cost";
  amount: number;
  sourceZones: readonly CardAccessZone[];
  ignoreIfAccessedFrom?: readonly CardAccessZone[];
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type CardIceStrengthModifierImplementation = {
  kind: "ice_strength";
  operation: "increase" | "reduce";
  amount: number;
  activeWhile: "installed" | "rezzed" | "scored";
  sourceZone: "runner_installed" | "corp_root" | "corp_scored_agenda";
  visibility: EventVisibilityClass;
  appliesTo: {
    side: Extract<Side, "corp">;
    cardType: Extract<CardType, "ice">;
    subtype?: string;
    sameServerAsSource?: boolean;
    encounteredOnly?: boolean;
  };
};

export type CardAdditionalSubroutineModifierImplementation = {
  kind: "additional_subroutine";
  activeWhile: "rezzed";
  sourceZone: "corp_root" | "corp_installed";
  visibility: EventVisibilityClass;
  appliesTo: {
    side: Extract<Side, "corp">;
    cardType: Extract<CardType, "ice">;
    subtype?: string;
    subtypeAnyOf?: readonly string[];
    sourceCardOnly?: boolean;
    sameServerAsSource?: boolean;
  };
  append: "after_existing";
  subroutine: CardSubroutineImplementation;
  repeat?: {
    kind: "for_each_rezzed_installed_ice";
    subtypeAnyOf: readonly string[];
    excludeSource: true;
  };
};

export type CardHandSizeModifierImplementation = {
  kind: "hand_size";
  operation: "increase";
  amount: number;
  activeWhile: "installed" | "scored" | "rezzed";
  sourceZone: "runner_installed" | "corp_scored_agenda" | "corp_root";
  side: "runner" | "corp";
  visibility: EventVisibilityClass;
};

export type CardMemoryUnitsModifierImplementation = {
  kind: "memory_units";
  operation: "increase";
  amount: number;
  activeWhile: "installed";
  sourceZone: "runner_installed";
  side: "runner";
  visibility: EventVisibilityClass;
};

export type CardAgendaDifficultyModifierImplementation = {
  kind: "agenda_difficulty";
  operation: "increase" | "reduce";
  amount: number;
  activeWhile: "installed" | "scored" | "rezzed";
  sourceZone: "runner_installed" | "corp_scored_agenda" | "corp_root";
  side: "corp";
  visibility: EventVisibilityClass;
  appliesTo: {
    cardType: Extract<CardType, "agenda">;
    subtype?: string;
    sameServerAsSource?: boolean;
  };
};

export type CardTrashCostModifierImplementation = {
  kind: "trash_cost";
  operation: "increase";
  amount: number;
  activeWhile: "rezzed";
  sourceZone: "corp_root";
  side: "corp";
  visibility: EventVisibilityClass;
  appliesTo: {
    cardType: Extract<CardType, "asset" | "upgrade">;
  };
  sameServerAsSource: true;
};

export type CardBreakSubroutineCostModifierImplementation = {
  kind: "break_subroutine_cost";
  operation: "increase";
  amount: number;
  activeWhile: "rezzed";
  sourceZone: "corp_root";
  side: "corp";
  visibility: EventVisibilityClass;
  appliesTo: {
    cardType: Extract<CardType, "ice">;
  };
  sameServerAsSource: true;
};

export type CardSubroutineImplementation =
  | {
      kind: "end_the_run";
      text: "*End the run.";
      visibility: EventVisibilityClass;
    }
  | {
      kind: "end_the_run_unless_runner_pays";
      amount: number;
      text: `*End the run unless Runner pays [${number}].`;
      visibility: EventVisibilityClass;
    };

export type CardAccessCountModifierImplementation = {
  kind: "access_count";
  sourceZone: "runner_installed";
  activeWhile: "installed";
  server: Extract<ServerId, "hq" | "rd">;
  amount: number;
  visibility: EventVisibilityClass;
};

export type CardIcebreakerAbilityImplementation =
  | {
      kind: "break_subroutine";
      cost: {
        kind: "credit";
        amount: number;
      };
      matches: CardIcebreakerBreakMatcherImplementation;
      count?: number;
      breakTarget?: "all_matching_subroutines";
      onSuccessfulBreak?: readonly CardIcebreakerBreakSideEffectImplementation[];
      special?: CardIcebreakerBreakSpecialImplementation;
      onUse?: readonly CardIcebreakerUseSideEffectImplementation[];
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "increase_strength";
      cost: {
        kind: "credit";
        amount: number;
      };
      amount: number;
      duration: "current_encounter" | "current_run";
      variableAmount?: {
        kind: "paid_amount";
        min: number;
      };
      onUse?: readonly CardIcebreakerUseSideEffectImplementation[];
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardIcebreakerBreakMatcherImplementation =
  | { kind: "any" }
  | { kind: "ice_subtype"; subtype: string }
  | { kind: "selected_ice_subtype" }
  | { kind: "ice_subtype_any_of"; subtypes: readonly string[] }
  | { kind: "subroutine_tag"; tag: string }
  | { kind: "subroutine_traces" };

export type CardIcebreakerBreakSideEffectImplementation = {
  kind: "lose_bits_from_stealth_sources";
  amount: number;
  mode: "total_if_available" | "up_to_if_available";
};

export type CardIcebreakerUseSideEffectImplementation = {
  kind: "end_run";
};

export type CardIcebreakerBreakSpecialImplementation =
  | { kind: "run_start_random_strength_bonus" }
  | { kind: "blink_random_break_or_net_damage" }
  | { kind: "bartmoss_post_encounter_self_trash_check" }
  | { kind: "snowball_run_strength_per_successful_break" }
  | { kind: "dupre_strength_counter_and_last_fort" }
  | { kind: "set_next_sentry_free_break_after_fully_breaking_wall" };

export type RestrictedHostedCreditUse =
  | "using_icebreaker_during_run"
  | "using_icebreaker_during_run_non_noisy"
  | "using_killer_during_run"
  | "increase_link"
  | "trash_nodes"
  | "trash_upgrades"
  | "install_programs"
  | "remove_tags";

export type RestrictedHostedCreditSourceImplementation = {
  capacity: number;
  counterType: Extract<CounterType, "bit">;
  usableFor: readonly RestrictedHostedCreditUse[];
  refresh: {
    timing: "start_of_runner_turn";
    mode: "refill_to_capacity_if_used";
  };
  allowUseWhileOverwritingSource?: true;
  requireHostedBreakerForIcebreakerUse?: true;
};

export type CardInstallAdditionalCostImplementation = {
  kind: "agenda_point";
  amount: number;
};

export type CardDamagePreventionSourceImplementation = {
  kind: "damage_prevention";
  damageTypes: readonly Extract<DamageType, "net" | "meat" | "core">[];
  amount: number | "all";
  corpMayPayToBypass?: {
    costPerDamage: 1;
  };
  corpMayCancelUntilEndOfTurn?: {
    agendaPointCost: 1;
  };
  limit?:
    | {
        kind: "per_turn";
        amount: number;
      }
    | undefined;
  cost:
    | {
        kind: "none";
      }
    | {
        kind: "source_counter";
        counterType: Extract<CounterType, "ablative" | "trauma">;
        amount: 1;
        trashSourceWhenEmpty?: true;
      }
    | {
        kind: "trash_source";
      }
    | {
        kind: "credit";
        amount: number;
      }
    | {
        kind: "tap_source";
      }
    | {
        kind: "credit_and_tap_source";
        amount: number;
      };
  priority: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardFlatlineReplacementSourceImplementation =
  | {
      kind: "flatline_replacement_from_grip";
      replacement: "flatline_tag_replacement";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "damage_replacement_from_grip";
      replacement: "prevent_meat_damage_add_bad_publicity";
      damageType: Extract<DamageType, "meat">;
      activeOnlyDuring: "corp_turn";
      badPublicity: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "flatline_replacement_installed";
      replacement: "installed_flatline_prevention";
      cost: { kind: "trash_source" };
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardTagPreventionSourceImplementation = {
  kind: "avoid_tag";
  amount: 1;
  cost:
    | {
        kind: "trash_source";
      }
    | {
        kind: "credit";
        amount: number;
      }
    | {
        kind: "credit_and_tap_source";
        amount: number;
      };
  priority: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardTrashPreventionSourceImplementation = {
  kind: "prevent_installed_card_trash";
  protectsCardTypes: readonly Extract<
    CardType,
    "program" | "hardware" | "resource"
  >[];
  excludesSelf?: true;
  activeOnlyDuring?: "corp_turn";
  mode: "one_card" | "one_or_more_simultaneous";
  cost:
    | {
        kind: "trash_source";
      }
    | {
        kind: "tap_source";
      }
    | {
        kind: "credit_return_source_to_grip";
        amount: number;
      };
  priority: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardPrintedSubroutineImplementation =
  | {
      kind: "end_the_run";
      text: "*End the run.";
    }
  | {
      kind: "end_the_run_unless_runner_pays";
      amount: number;
      text: `*End the run unless Runner pays [${number}].`;
    }
  | {
      kind: "trash_program";
      text: "*Trash a program.";
    }
  | {
      kind: "trash_program_unless_runner_pays";
      amount: number;
      text: `*Trash a program unless Runner pays [${number}].`;
    }
  | {
      kind: "damage";
      damageType: "net" | "brain";
      amount: number;
      preventable: true;
      text: string;
    }
  | {
      kind: "prohibit_break_next_ice";
      text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run.";
      breakTags?: readonly string[];
    }
  | {
      kind: "prohibit_break_and_jack_out_next_ice";
      text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run, and cannot jack out until after that encounter.";
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_ice_strength";
      amount: number;
      runnerMayCancelOnPassingSource?: { amount: number };
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_additional_subroutine";
      subroutine: CardSubroutineImplementation;
      append: "after_existing";
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_break_subroutine_cost";
      amount: number;
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_cannot_jack_out";
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_encounter_cost_or_end_run";
      amount: number;
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_jack_out_cost";
      amount: number;
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_trash_program_after_passing_rezzed_ice_unless_jack_out";
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "secret_spend_compare_end_run_unless_corp_spent_at_least_runner";
      allowedAmounts: readonly [0, 1, 2];
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "random_resume_from_rezzed_ice_back_or_jack_out";
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "next_encounter_unless_fully_break_damage";
      damageType: "net";
      amount: number;
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "runner_run_lock_actions";
      amount: number;
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "runner_forgoes_next_action";
      text: string;
      breakTags?: readonly string[];
    }
  | {
      kind: "trace";
      baseTraceStrength: number;
      onSuccess: readonly CardTraceSuccessEffectImplementation[];
      text: string;
      breakTags?: readonly string[];
    };

export type CardIceEncounterImplementation =
  | {
      kind: "add_encounter_temporary_credits";
      side: "corp";
      amount: number;
      usableFor: "this_ice_printed_trace_subroutines";
      returnUnusedAtEncounterEnd: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "roll_die_strength_or_derez_auto_pass";
      dieFaces: 6;
      successValue: 6;
      strengthDuration: "current_encounter";
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type RunnerTraceCounterEffectImplementation = {
  counterType: Extract<
    CounterType,
    "data_raven" | "cerberus" | "mastiff" | "crying" | "doppelganger_antibody"
  >;
  removeCost: number;
  startOfRunnerTurn?:
    | {
        kind: "add_tags";
        amountPerCounter: number;
        visibility: EventVisibilityClass;
      }
    | {
        kind: "lose_credits";
        amountPerCounter: number;
        visibility: EventVisibilityClass;
      };
  runStart?: {
    kind: "damage";
    damageType: "net" | "brain";
    amountPerCounter: number;
    preventable: true;
    visibility: EventVisibilityClass;
  };
};
