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
  kind: "choose_data_fort_on_install";
  stores: "selectedServerId";
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
      kind: "silver_lining_recovery";
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
      kind: "rescheduler_hq_shuffle_draw";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "cowboy_sysop_uninstall_corp_card_to_hq";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "omniscience_foundation_end_turn_tag";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "disinfectant_avoid_virus_counter";
      cost: { kind: "credit"; amount: 1 };
      limit: "once_per_turn_per_source";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "newsgroup_taunting_run_start_tax";
      amount: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "krumz_trace_bit";
      amount: 1;
      refresh: "start_of_corp_turn_after_use";
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardHiddenReplacementLongtailImplementation =
  | {
      kind: "fortress_respecification_ice_reorder";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "social_engineering_secret_guess_run";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "new_blood_conceal_reorder_installed_ice";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "shell_traders_delayed_install";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "bizarre_encryption_scheme_access_replacement";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "code_viral_cache_purge_replacement";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    };

export type CardRunnerUtilityLongtailImplementation =
  | {
      kind: "microtech_backup_drive_program_trash_replacement";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "startup_immolator_trash_fully_broken_ice";
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
      kind: "preying_mantis_optional_action_unpreventable_core_damage";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "quest_for_cattekin_start_turn_random_permanent_action";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "microtech_trode_set_ap_subroutine_modifier";
      visibility: Extract<EventVisibilityClass, "public">;
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
      counterType: Extract<CounterType, "crying">;
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
      kind: "install_only_inside_subsidiary_data_fort";
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

export type CardRunnerEventLongtailImplementation = {
  kind: "playful_ai_dice_loop";
  dieFaces: 6;
  choiceOn: readonly [1, 2, 3];
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardVirusCounterKindImplementation =
  | "boardwalk"
  | "butcher_boy"
  | "cockroach"
  | "cascade"
  | "thought"
  | "fait"
  | "gremlin"
  | "incubate"
  | "pattel"
  | "pox"
  | "skivviss";

export type CardVirusCounterImplementation = {
  counterKind: CardVirusCounterKindImplementation;
  addOnSuccessfulRun?: {
    server: "hq" | "rd" | "any" | "subsidiary_data_fort";
    target: "source" | "successful_run_server" | "chosen_fully_broken_ice";
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
      kind: "corporate_war_credit_swing";
      threshold: number;
      gainAmount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corporate_retreat_disable_on_rez_or_install";
      counterType: Extract<CounterType, "mark">;
      gainAmount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "ai_cfo_shuffle_hq_archives_into_rd_draw";
      drawCount: 5;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "meat_damage_bonus";
      amount: number;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "project_babylon_bonus_points";
      perExcessAdvancementCounters: number;
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
      kind: "priority_requisition_rez_ice_at_no_cost";
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "ice_transmutation_rezzed_ice_modifier";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "corporate_downsizing_hq_agendas";
      creditPerAgendaPoint: number;
      shuffleSelectedIntoRnd: true;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "security_purge_top_rd";
      count: 3;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "data_fort_reclamation";
      temporaryCredits: 10;
      maxHqCards: 4;
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    };

export type HostedProgramCapacityImplementation = {
  capacityMu: number;
  allowedCardTypes: readonly ["program"];
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
      server: Extract<ServerId, "hq">;
    };

export type ActivatedCardAbilityImplementation = {
  kind: "activated";
  timing:
    | "runner_main"
    | "during_run"
    | "corp_main"
    | "corp_encounter"
    | "trace_base_link_window"
    | "trace_post_bid_link_window";
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
      kind: "wilson_run_action_spending_cap";
      actionGain: 1;
      spendingCap: 3;
      appliesTo: readonly ["icebreaker_use", "increase_link"];
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "acme_savings_and_loan_debt";
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
      kind: "city_surveillance_draw_tag";
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
  | PayRezCostToTrashRezzedIceEffectImplementation
  | TrashUnrezzedIceEffectImplementation
  | CorpChoiceRezOrTrashIceEffectImplementation
  | GainCreditsPerAdvancementCounterOnSourceEffectImplementation
  | AddCounterToAllInstalledRunnerIcebreakersEffectImplementation
  | GainRunnerEventAgendaPointEffectImplementation
  | GainRunnerEventAgendaPointIfLiberatedAgendaSubtypeEffectImplementation
  | CorpRandomDiscardFromHqEffectImplementation
  | CorpDiscardHqWithRetainPaymentEffectImplementation
  | DerezRezzedBlackIceEffectImplementation
  | AddCurrentEncounterAdditionalSubroutineEffectImplementation
  | StartRunnerProgramInstallActionBundleEffectImplementation
  | DistributeAdvancementCountersEffectImplementation
  | MoveAdvancementCountersEffectImplementation;

export type GainCreditsEffectImplementation = {
  kind: "gain_credits";
  recipient: "controller" | "runner" | "corp";
  amount: number;
  visibility: EventVisibilityClass;
};

export type GainCreditsPerAdvancementCounterOnSourceEffectImplementation = {
  kind: "gain_credits_per_advancement_counter_on_source";
  recipient: "controller" | "corp";
  amountPerCounter: number;
  visibility: EventVisibilityClass;
};

export type AddCounterToAllInstalledRunnerIcebreakersEffectImplementation = {
  kind: "add_counter_to_all_installed_runner_icebreakers";
  counterType: Extract<CounterType, "militech">;
  amount: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type GainRunnerEventAgendaPointEffectImplementation = {
  kind: "gain_runner_event_agenda_point";
  amount: 1;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type GainRunnerEventAgendaPointIfLiberatedAgendaSubtypeEffectImplementation = {
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
  preventable: true;
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
      kind: "runner_run_lock_until_action_paid";
      amount: number;
      visibility: EventVisibilityClass;
    }
  | {
      kind: "trash_program";
      target: "installed_runner_program";
      visibility: EventVisibilityClass;
    };

export type TraceEffectImplementation = {
  kind: "trace";
  baseTraceStrength: number;
  onSuccess: readonly CardTraceSuccessEffectImplementation[];
  onFailure?: readonly CardTraceSuccessEffectImplementation[];
  visibility: EventVisibilityClass;
};

export type MakeRunEffectImplementation = {
  kind: "make_run";
  target: {
    kind: "central_server";
    server: Extract<ServerId, "hq" | "rd" | "archives">;
  } | {
    kind: "chosen_server";
  };
  accessCount?: number;
  freeTrashAccessZones?: readonly Extract<ServerId, "hq" | "rd">[];
  accessServerOverride?: Extract<ServerId, "hq" | "rd" | "archives">;
  successfulRunAccessReplacement?:
    | "corp_lose_credits"
    | "runner_spend_corp_lose_credits"
    | "private_look_top_rd"
    | "archives_faceup_to_rd";
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
  visibility: EventVisibilityClass;
};

export type PayRezCostToTrashRezzedIceEffectImplementation = {
  kind: "pay_rez_cost_to_trash_rezzed_ice";
  target: "chosen_rezzed_ice";
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
  visibility: EventVisibilityClass;
};

export type IncreaseTraceLinkEffectImplementation = {
  kind: "increase_trace_link";
  amount: number;
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
      text: "*End the run unless Runner pays [1].";
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
  | { kind: "ai_boon_run_start_random_strength" }
  | { kind: "blink_random_break_or_net_damage" }
  | { kind: "bartmoss_post_encounter_self_trash_check" }
  | { kind: "snowball_run_strength_per_successful_break" }
  | { kind: "dupre_strength_counter_and_last_fort" };

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
      };
  priority: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardFlatlineReplacementSourceImplementation =
  | {
      kind: "flatline_replacement_from_grip";
      replacement: "arasaka_owns_you";
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "flatline_replacement_installed";
      replacement: "emergency_self_construct";
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
      };
  priority: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardTrashPreventionSourceImplementation = {
  kind: "prevent_installed_card_trash";
  protectsCardTypes: readonly Extract<CardType, "program" | "hardware">[];
  excludesSelf?: true;
  mode: "one_card" | "one_or_more_simultaneous";
  cost:
    | {
        kind: "trash_source";
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
      kind: "trash_program";
      text: "*Trash a program.";
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

export type CardIceEncounterImplementation = {
  kind: "add_encounter_temporary_credits";
  side: "corp";
  amount: number;
  usableFor: "this_ice_printed_trace_subroutines";
  returnUnusedAtEncounterEnd: true;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type RunnerTraceCounterEffectImplementation = {
  counterType: Extract<
    CounterType,
    "data_raven" | "cerberus" | "mastiff" | "crying"
  >;
  removeCost: number;
  startOfRunnerTurn?: {
    kind: "add_tags";
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
