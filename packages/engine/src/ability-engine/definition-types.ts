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
  | { kind: "runner_attempted_run_last_turn"; minimumRuns: number };

export type ActivatedCardAbilityImplementation = {
  kind: "activated";
  timing:
    | "runner_main"
    | "corp_main"
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
    };

export type CardAbilityCostImplementation =
  | {
      kind: "action";
      amount: number;
    }
  | {
      kind: "credit";
      amount: number;
    };

export type CardEffectImplementation =
  | GainCreditsEffectImplementation
  | DrawCardsEffectImplementation
  | LoseCreditsEffectImplementation
  | AddTagsEffectImplementation
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
  | PrivateLookEffectImplementation;

export type GainCreditsEffectImplementation = {
  kind: "gain_credits";
  recipient: "controller" | "runner" | "corp";
  amount: number;
  visibility: EventVisibilityClass;
};

export type DrawCardsEffectImplementation = {
  kind: "draw_cards";
  recipient: "controller" | "runner" | "corp";
  amount: number;
  visibility: EventVisibilityClass;
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

export type DamageEffectImplementation = {
  kind: "damage";
  recipient: "runner";
  damageType: Extract<DamageType, "meat">;
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
  visibility: EventVisibilityClass;
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
  operation: "reduce";
  amount: number;
  activeWhile: "rezzed";
  sourceZone: "corp_root";
  visibility: EventVisibilityClass;
  appliesTo: {
    side: Extract<Side, "corp">;
    cardType: Extract<CardType, "ice">;
    sameServerAsSource?: boolean;
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
  operation: "increase";
  amount: number;
  activeWhile: "rezzed" | "scored";
  sourceZone: "corp_root" | "corp_scored_agenda";
  visibility: EventVisibilityClass;
  appliesTo: {
    side: Extract<Side, "corp">;
    cardType: Extract<CardType, "ice">;
    subtype?: string;
    sameServerAsSource?: boolean;
  };
};

export type CardAdditionalSubroutineModifierImplementation = {
  kind: "additional_subroutine";
  activeWhile: "rezzed";
  sourceZone: "corp_root";
  visibility: EventVisibilityClass;
  appliesTo: {
    side: Extract<Side, "corp">;
    cardType: Extract<CardType, "ice">;
    subtype?: string;
    sameServerAsSource?: boolean;
  };
  append: "after_existing";
  subroutine: CardSubroutineImplementation;
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
  activeWhile: "scored" | "rezzed";
  sourceZone: "corp_scored_agenda" | "corp_root";
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

export type CardPrintedSubroutineImplementation =
  | {
      kind: "end_the_run";
      text: "*End the run.";
      visibility: EventVisibilityClass;
    }
  | {
      kind: "trash_program";
      text: "*Trash a program.";
      visibility: EventVisibilityClass;
    }
  | {
      kind: "damage";
      damageType: "net" | "brain";
      amount: number;
      preventable: true;
      text: string;
      visibility: EventVisibilityClass;
    }
  | {
      kind: "prohibit_break_next_ice";
      text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run.";
      visibility: EventVisibilityClass;
      breakTags?: readonly string[];
    }
  | {
      kind: "prohibit_break_and_jack_out_next_ice";
      text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run, and cannot jack out until after that encounter.";
      visibility: EventVisibilityClass;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_ice_strength";
      amount: number;
      text: string;
      visibility: EventVisibilityClass;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_additional_subroutine";
      subroutine: CardSubroutineImplementation;
      append: "after_existing";
      text: string;
      visibility: EventVisibilityClass;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_break_subroutine_cost";
      amount: number;
      text: string;
      visibility: EventVisibilityClass;
      breakTags?: readonly string[];
    }
  | {
      kind: "run_duration_cannot_jack_out";
      text: string;
      visibility: EventVisibilityClass;
      breakTags?: readonly string[];
    }
  | {
      kind: "trace";
      baseTraceStrength: number;
      onSuccess: readonly CardTraceSuccessEffectImplementation[];
      text: string;
      visibility: EventVisibilityClass;
      breakTags?: readonly string[];
    };

export type RunnerTraceCounterEffectImplementation = {
  counterType: Extract<CounterType, "data_raven" | "cerberus" | "mastiff">;
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
