/**
 * Defines serializable on-play, activated, lifecycle, and direct ability contracts.
 *
 * This module is declarative only: it must not execute effects, query
 * GameState, or contain concrete card IDs.
 */
import type {
  CounterType,
  DamageType,
  EventVisibilityClass,
} from "@netgrid/shared";
import type {
  CardAbilityCostImplementation,
  CardAbilityLimitImplementation,
  CardConditionImplementation,
  OnPlayCardAbilityCostImplementation,
} from "./definition-core-contracts";
import type { CardEffectImplementation } from "./definition-effect-contracts";

export type ActivatedCardAbilityTiming =
  | "runner_main"
  | "runner_paid"
  | "during_run"
  | "runner_cost_penalty_support"
  | "access_start"
  | "corp_main"
  | "corp_paid"
  | "corp_encounter"
  | "corp_during_run"
  | "corp_trace_window"
  | "corp_start_run_window"
  | "trace_base_link_window"
  | "trace_post_bid_link_window"
  | "trace_success_cancel_window";

export type AdditionalActivatedCardAbilityTiming = {
  timing: ActivatedCardAbilityTiming;
  /** An extra window may be narrower than the ordinary ability window. */
  condition?: CardConditionImplementation;
};

export type CardLifecycleTriggeredAbilityImplementation = {
  condition?: CardConditionImplementation;
  /**
   * Explicit author guarantee for simultaneous copies of this lifecycle
   * ability. A runtime may use it only when every otherwise due source is a
   * copy of the same definition and no additional start path participates.
   */
  simultaneousResolution?: {
    kind: "order_independent_between_copies";
  };
  effects: readonly CardEffectImplementation[];
};

export type OnPlayCardAbilityImplementation = {
  kind: "on_play";
  costs: OnPlayCardAbilityCostImplementation;
  condition?: CardConditionImplementation;
  sourceDisposition?: {
    kind: "return_to_grip_instead_of_trash";
    additionalCreditCost: number;
    decisionTiming: "when_played";
  };
  effects: CardEffectImplementation[];
};

export type ActivatedCardAbilityImplementation = {
  kind: "activated";
  /** The ability's ordinary timing window. */
  timing: ActivatedCardAbilityTiming;
  /**
   * Additional explicitly granted windows for the same printed ability.
   * They do not create another capability, limit, or planning identity.
   */
  additionalTimings?: readonly AdditionalActivatedCardAbilityTiming[];
  costs: readonly CardAbilityCostImplementation[];
  condition?: CardConditionImplementation;
  limit?: CardAbilityLimitImplementation;
  effects: readonly CardEffectImplementation[];
  label?: string;
};

/**
 * Resolves an ability for one offered timing window without changing its
 * capability identity. A caller must use the returned view for both action
 * construction and revalidation.
 */
export function activatedAbilityAtTiming(
  ability: ActivatedCardAbilityImplementation,
  timing: ActivatedCardAbilityTiming,
): ActivatedCardAbilityImplementation | undefined {
  if (ability.timing === timing) return ability;
  const additional = ability.additionalTimings?.find(
    (entry) => entry.timing === timing,
  );
  return additional === undefined ? undefined : { ...ability, timing };
}

/**
 * Returns only the extra condition of an additional timing. The ordinary
 * ability condition remains independently required at every timing.
 */
export function additionalTimingCondition(
  ability: ActivatedCardAbilityImplementation,
  timing: ActivatedCardAbilityTiming,
): CardConditionImplementation | undefined {
  if (ability.timing === timing) return undefined;
  return ability.additionalTimings?.find((entry) => entry.timing === timing)
    ?.condition;
}

export type CardUniqueDirectLongtailImplementation =
  | {
      kind: "successful_run_end_credit_resource";
      amount: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "start_turn_trash_for_credits";
      gainCredits: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "agenda_point_for_credits_resource";
      agendaPointCost: 1;
      gainCredits: 10;
      trashSource: true;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "runner_start_turn_forced_random_action";
      startsTurnAfterInstall: true;
      mustTakeIfPossible: true;
      outcomes: readonly RunnerStartTurnForcedRandomActionOutcome[];
      visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
    }
  | {
      kind: "runner_start_turn_drip_counter_action_or_core_damage";
      counterType: Extract<CounterType, "drip">;
      threshold: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "rezzed_leave_action_gain_asset";
      actionGain: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "tagged_meat_damage";
      requiredRunnerTags: 2;
      agendaPointCost: 3;
      damageType: Extract<DamageType, "meat">;
      damageAmount: 15;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "tag_threshold_meat_damage_asset";
      damageType: Extract<DamageType, "meat">;
      damageAmount: 10;
      trashSourceOnSuccess: true;
      visibility: Extract<EventVisibilityClass, "public">;
    };

export type RunnerStartTurnForcedRandomActionOutcome = {
  dieRoll: 1 | 2 | 3 | 4 | 5 | 6;
  action:
    | "draw_card"
    | "gain_credit"
    | "make_run_rd"
    | "make_run_hq"
    | "make_run_remote"
    | "reveal_random_grip_card_to_corp_and_play_or_install";
};

export type CardRemainingReplacementLongtailImplementation =
  | {
      kind: "hidden_draw_keep_or_top_replacement";
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
      kind: "basic_credit_diversion_to_recurring_credits";
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
      kind: "trace_bit_counter_pool_asset";
      counterType: Extract<CounterType, "bit">;
      addAfterTrace: 1;
      traceValueAndLimitPerBit: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "link_reduction_counter_upgrade";
      counterType: Extract<CounterType, "crying">;
      linkReductionPerCounter: 2;
      removeCost: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    };
