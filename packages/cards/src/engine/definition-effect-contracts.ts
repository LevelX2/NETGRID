/**
 * Defines serializable effect commands interpreted by the Rules Engine.
 *
 * This module is declarative only: it must not execute effects, query
 * GameState, or contain concrete card IDs.
 */
import type {
  CardType,
  CounterType,
  DamageType,
  EventVisibilityClass,
  ServerId,
} from "@netgrid/shared";
import type { CardSubroutineImplementation } from "./definition-core-contracts";

export type CardEffectImplementation =
  | GainCreditsEffectImplementation
  | GainCreditsForRunnerTrashHistoryEffectImplementation
  | AddBadPublicityEffectImplementation
  | AddBadPublicityFromFrameUpHistoryEffectImplementation
  | CancelSuccessfulTraceEffectImplementation
  | AddBadPublicityIfCancelledTraceHasNonTagEffectImplementation
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
  | EndRunEffectImplementation
  | AddHostedCreditsEffectImplementation
  | TakeHostedCreditsEffectImplementation
  | TransferHostedCreditsEffectImplementation
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
  | MoveTopHostedProgramToGripEffectImplementation
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
  | ScoreSourceAsAgendaEffectImplementation
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
  | ReplaceFortCardsFromHqEffectImplementation
  | DoubleChosenIceStrengthUntilEndOfTurnEffectImplementation;

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

/** Cancels the current successful trace effect in its dedicated timing window. */
export type CancelSuccessfulTraceEffectImplementation = {
  kind: "cancel_successful_trace_effect";
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

/**
 * A consequence of cancelling the current trace, evaluated against that
 * trace's declarative success effect rather than against a card identity.
 */
export type AddBadPublicityIfCancelledTraceHasNonTagEffectImplementation = {
  kind: "add_bad_publicity_if_cancelled_trace_has_non_tag_effect";
  amount: number;
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
  counterType: Extract<
    CounterType,
    "militech" | "pattel" | "breaker_strength_penalty"
  >;
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
  include: "root";
  installCost: "free";
  rezTiming: "after_runner_passed_last_ice_on_source_fort";
  visibility: Extract<EventVisibilityClass, "hidden_info_barrier">;
};

export type DoubleChosenIceStrengthUntilEndOfTurnEffectImplementation = {
  kind: "double_chosen_ice_strength_until_end_of_turn";
  target: "chosen_installed_ice";
  maxStrength: number;
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

export type MoveTopHostedProgramToGripEffectImplementation = {
  kind: "move_top_hosted_program_to_grip";
  recipient: "runner";
  host: "source";
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
      counterType: Extract<
        CounterType,
        "trace_tag_counter" | "baskerville" | "cerberus" | "mastiff"
      >;
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
  traceLimit: number;
  additionalPlayCostPerTraceLimitPointAboveZero?: number;
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
    | "runner_gain_agenda_point"
    | "reveal_rd_until_agenda_store_in_hq";
  conditionalAccessBonus?: {
    kind: "no_noisy_icebreaker_or_trace";
    amount: number;
  };
  corpRezCostSurcharge?: {
    kind: "matching_printed_rez_cost";
  };
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
  badPublicityRunAftermath?:
    | "successful_run_draw_event"
    | "bad_publicity_run_replacement";
  visibility: EventVisibilityClass;
};

export type EndRunEffectImplementation = {
  kind: "end_run";
  successful: boolean;
  visibility: Extract<EventVisibilityClass, "public">;
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

export type ScoreSourceAsAgendaEffectImplementation = {
  kind: "score_source_as_agenda";
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

export type TransferHostedCreditsEffectImplementation = {
  kind: "transfer_hosted_credits";
  direction: "controller_to_source" | "source_to_controller";
  amount: {
    kind: "x_value";
    min: 1;
  };
  visibility: Extract<EventVisibilityClass, "public">;
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
