/**
 * Defines serializable access, run, utility, lifecycle, and scored-agenda domains.
 *
 * This module is declarative only: it must not execute effects, query
 * GameState, or contain concrete card IDs.
 */
import type {
  CardType,
  CounterType,
  DamageType,
  EventVisibilityClass,
  PurgeableRunnerVirusCounterType,
  ServerId,
} from "@netgrid/shared";
import type { CardLifecycleTriggeredAbilityImplementation } from "./definition-ability-contracts";
import type {
  AddressableCapabilityContract,
  CapabilityKey,
} from "../capability-identity";
import type {
  CardAccessZone,
  CardConditionImplementation,
} from "./definition-core-contracts";
import type {
  CardEffectImplementation,
  CardTraceSuccessEffectImplementation,
} from "./definition-effect-contracts";

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

export type CardCorpUtilityPlayCostImplementation = {
  playCost?: {
    kind: "printed";
    additionalClicks: 1;
  };
};

export type CardCorpUtilityImplementation = (
  | {
      kind: "gain_restricted_install_actions";
      amount: 3;
      mayStopEarly: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corp_archives_to_hq";
      filter?: {
        cardType: Extract<CardType, "ice">;
      };
      maxSelections?: 1 | "all";
      revealToRunner?: true;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "draw_corp_cards_then_shuffle_hq_card_into_rd";
      drawCount: 5;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "corp_rd_top_reorder";
      count: 5;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "encounter_tag";
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
      kind: "installed_hardware_trash_by_counter";
      excludesSubtype: "cybernetics";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "runner_memory_limit_modifier_until_end_of_turn";
      operation: "reduce";
      amount: number;
      condition: "runner_tagged";
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
      kind: "run_start_lose_runner_credits_per_tag";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corp_start_turn_tag_roll_per_runner_run_last_turn";
      dieFaces: 6;
      tagOn: number;
      optional: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corp_draw_extra_then_bottom_one";
      extraDraw: 1;
      bottom: "one_drawn_card";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
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
    }
) &
  CardCorpUtilityPlayCostImplementation;

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
      kind: "derez_fully_broken_passed_ice";
      cost: { kind: "trash_source" };
      timing: "after_passing_fully_broken_ice";
      target: "that_ice";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "hq_access_expose_all_installed_corp_cards";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "rabbit_ice_trace_limit_reduction";
      amount: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "trace_link_force_jack_out";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "successful_run_fort_counter_expose";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "field_reporter_end_turn_rezzed_ice_payout";
      amountPerRezzedIce: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "first_prep_credit_gain_bonus";
      amount: 1;
      limit: "once_per_prep";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "trace_attempts_auto_success_add_tag";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "base_memory_equals_grip_count";
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
      kind: "access_point_subroutine_modifier";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "hidden_resource_current_access_free_trash";
      cost: { kind: "credit_and_trash_source"; amount: number };
      target: "current_accessed_cards";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "hidden_resource_post_meat_damage_random_hq_discard";
      cost: { kind: "trash_source" };
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

export type CardAgendaAccessReplacementImplementation = {
  kind: "install_as_runner_program";
  memoryCost: number;
  scoreAsAgendaAction: true;
  removeFromGameOnLeavePlay: true;
  onDecline?: {
    kind: "score_if_still_installed_in_same_fort_at_runner_start";
  };
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardAccessEffectImplementation = {
  kind: "on_access";
  sourceZones: readonly CardAccessZone[];
  installedSourceActivation?:
    | "requires_rezzed"
    | "unrezzed_only"
    | "any_rez_state";
  ignoreIfAccessedFrom?: readonly CardAccessZone[];
  revealIfAccessedFrom?: readonly Extract<CardAccessZone, "rd">[];
  condition?: CardConditionImplementation;
  cost?:
    | { kind: "corp_may_pay_credits"; amount: number }
    | { kind: "tap_source" }
    | { kind: "trash_source" };
  optional?: boolean;
  effects: readonly CardAccessEffectStepImplementation[];
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type CardAccessEffectStepImplementation =
  | CardEffectImplementation
  | {
      kind: "add_runner_counter";
      counterType: Extract<
        CounterType,
        "crying" | "doppelganger" | "link_reduction_counter"
      >;
      amount: number;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "trace";
      traceLimit: number;
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
      kind: "trash_installed_runner_hardware_and_programs";
      hardwareAmount: "all";
      programAmount: number;
      chooser: "corp";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "trash_other_corp_installed_cards_in_source_server_and_damage_runner";
      include: "root_and_ice";
      damageType: Extract<DamageType, "net">;
      amountPerTrashed: 1;
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
      cost: { kind: "reveal_and_trash_source" };
      effect: { kind: "corp_lose_credits"; amount: number };
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "successful_run_before_access_effect";
      abilityKey?: string;
      timing: "immediately_after_successful_run_before_access";
      server: "remote";
      source: "installed_hidden_runner_resource";
      cost: { kind: "reveal_and_trash_source" };
      effect: { kind: "trash_remote_fort"; include: "root" };
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count";
      timing: "after_successful_run";
      cost: "none";
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
      target: "installed_card_in_this_fort";
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
      kind: "move_self_to_outermost_position_on_other_fort";
      timing: "start_of_run";
      cost: { kind: "credit"; amount: number };
      target: "outermost_position_on_other_data_fort";
      revealIfUnrezzed: true;
      limit?: "once_per_run_per_source";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | ({
      kind: "server_run_start_restriction";
      timing: "run_start_legal";
      target: "source_fort" | "selected_server";
      condition: "corp_installed_or_advanced_on_target_server_during_latest_corp_turn";
      visibility: Extract<EventVisibilityClass, "public">;
    } & ({ abilityKey: string } | AddressableCapabilityContract))
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
      kind: "install_not_on_archives";
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
      traceLimitFromValue?: true;
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
  /** Present on canonical CardSpec projections; legacy declarations may omit it. */
  capabilityKey?: CapabilityKey;
  kind: "rezzed_ice_outside_this_ice";
  strengthBonusPerCount?: number;
  dynamicDamageSubroutine?: {
    subroutineCapabilityKey: CapabilityKey;
    amountPerCount: number;
    visibility: Extract<EventVisibilityClass, "public">;
  };
  dynamicTraceSubroutines?: {
    traceLimit: number;
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
      kind: "random_dice_loop";
      dieFaces: 6;
      choiceOn: readonly [1, 2, 3];
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "three_dice_gain_credits";
      dieFaces: 6;
      diceCount: 3;
      recipient: "runner";
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
    }
  | {
      kind: "trash_grip_search_stack_to_grip_equal_count";
      shuffleAfterwards: true;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "runner_corruption_agenda_point_transfer";
      creditsPerAgendaPoint: 10;
      tagRunner: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "do_the_drine_unpreventable_core_damage_for_credits";
      creditsPerDamage: 4;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "library_search_run";
      accessBonus: 2;
      allowedServers: readonly Extract<ServerId, "hq" | "rd">[];
      condition: "no_noisy_icebreaker_or_trace";
      visibility: Extract<EventVisibilityClass, "public">;
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
  centralAccessCountModifier?: {
    source: "corp_purgeable_runner_virus_counter";
    counterKind: PurgeableRunnerVirusCounterType;
    server: "hq" | "rd";
    formula: "per_counter" | "per_counter_after_first";
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
      counterType: Extract<CounterType, "boon" | "remap">;
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "purge_runner_virus_counters_and_prevent_next";
      preventCount: number;
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
      kind: "corp_start_turn_optional_draw";
      drawCount: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corp_start_turn_mandatory_draw";
      drawCount: 1;
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
