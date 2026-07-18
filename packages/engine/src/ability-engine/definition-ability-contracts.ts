/**
 * Defines on-play, activated, lifecycle, and direct ability contracts.
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

export type CardLifecycleTriggeredAbilityImplementation = {
  condition?: CardConditionImplementation;
  effects: readonly CardEffectImplementation[];
};

export type OnPlayCardAbilityImplementation = {
  kind: "on_play";
  costs: OnPlayCardAbilityCostImplementation;
  condition?: CardConditionImplementation;
  effects: CardEffectImplementation[];
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

export type CardUniqueDirectLongtailImplementation =
  | {
      kind: "successful_run_credit_resource";
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
      traceStrengthAndLimitPerBit: 1;
      visibility: Extract<EventVisibilityClass, "public">;
    }
  | {
      kind: "link_reduction_counter_upgrade";
      counterType: Extract<CounterType, "crying">;
      linkReductionPerCounter: 2;
      removeCost: 2;
      visibility: Extract<EventVisibilityClass, "public">;
    };
