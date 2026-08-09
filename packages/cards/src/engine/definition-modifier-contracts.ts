/**
 * Defines serializable cost, strength, prevention, trace, and encounter modifiers.
 *
 * This module is declarative only: it must not execute effects, query
 * GameState, or contain concrete card IDs.
 */
import type {
  CardType,
  CardDefinitionId,
  CounterType,
  DamageType,
  EventVisibilityClass,
  ServerId,
  Side,
} from "@netgrid/shared";
import type {
  CardAccessZone,
  CardSubroutineImplementation,
} from "./definition-core-contracts";
import type { CardTraceSuccessEffectImplementation } from "./definition-effect-contracts";

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
  appliesToRunner?: {
    cardType: Extract<CardType, "program">;
    subtype: string;
  };
  sameServerAsSource: true;
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
      duration: "current_encounter" | "current_run" | "current_turn";
      variableAmount?: {
        kind: "paid_amount";
        min: number;
      };
      consequences?: readonly CardIcebreakerPumpConsequenceImplementation[];
      onUse?: readonly CardIcebreakerUseSideEffectImplementation[];
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type CardIcebreakerPumpConsequenceImplementation = {
  kind: "lose_future_clicks";
  amountPerStrength: number;
};

export type CardIcebreakerBreakMatcherImplementation =
  | { kind: "any" }
  | { kind: "ice_subtype"; subtype: string }
  | { kind: "selected_ice_subtype" }
  | { kind: "ice_subtype_any_of"; subtypes: readonly string[] }
  | {
      kind: "ice_definition_any_of";
      definitionIds: readonly CardDefinitionId[];
    }
  | { kind: "subroutine_tag"; tag: string }
  | { kind: "subroutine_traces" };

export type CardIcebreakerBreakSideEffectImplementation = {
  kind: "lose_bits_from_stealth_sources";
  amount: number;
  sourceMode: "single_stealth_card" | "any_stealth_cards";
  optionalIfUnavailable: boolean;
  trigger: "per_subroutine" | "per_ability_use";
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
  | { kind: "once_per_run_break_tag_and_all_stealth_loss" }
  | { kind: "run_end_trash_source_if_used" }
  | { kind: "set_next_sentry_free_break_after_fully_breaking_wall" };

export type RestrictedHostedCreditUse =
  | "using_icebreaker_during_run"
  | "using_icebreaker_during_run_non_noisy"
  | "using_killer_during_run"
  | "increase_link"
  | "trash_nodes"
  | "trash_upgrades"
  | "install_programs"
  | "remove_tags"
  | "play_events";

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
      }
    | {
        kind: "credit_and_trash_source";
        amount: number;
      }
    | {
        kind: "credit_and_forgo_next_action";
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
      kind: "end_the_run_and_trash_source_at_end_of_turn";
      text: string;
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
      kind: "random_damage";
      dieFaces: 6;
      damageOnResults: readonly number[];
      damageType: "brain";
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
    }
  | {
      kind: "deflect_run";
      target: "archives" | "any_data_fort" | "subsidiary_data_fort";
      cost?: { kind: "credit"; amount: number };
      autoBreakIfNoTarget?: true;
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
    | "trace_tag_counter"
    | "baskerville"
    | "cerberus"
    | "mastiff"
    | "crying"
    | "link_reduction_counter"
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

export type CardSelfRezCostModifierImplementation = {
  kind: "self_rez_cost_reduction_during_run_after_noisy_icebreaker";
  amount: number;
  visibility: Extract<EventVisibilityClass, "public">;
};

export type CardSelfRezAdditionalCostImplementation = {
  kind: "agenda_point";
  amount: number;
  visibility: Extract<EventVisibilityClass, "public">;
};
