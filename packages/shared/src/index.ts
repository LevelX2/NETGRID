export {
  ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS,
  type AbilityPayloadDiscriminatorField,
  type AbilityPayloadDiscriminators,
} from "./ability-payload";
import type { AbilityPayloadDiscriminators } from "./ability-payload";
export type {
  ApiAccountActivePublicMatchIds,
  ApiAccountMatchHistory,
  ApiAccountMatchHistoryEntry,
  ApiAccountSeriesStatistics,
  ApiAccountStatistics,
  ApiAccountStatisticsBucket,
  ApiAccountStatisticsExclusionReason,
  ApiAccountStatisticsFinishKind,
  ApiAccountStatisticsOutcome,
  ApiAccountStatisticsPeriod,
  ApiAiPacingMode,
  ApiAiTurnPresentationState,
  ApiClientGameMode,
  ApiConnectionQuality,
  ApiCreateMatchResponse,
  ApiGameResultReason,
  ApiGameResultSummary,
  ApiJoinMatchResponse,
  ApiLifecycleResultSummary,
  ApiLobbyChatMessage,
  ApiLobbyParticipantPayload,
  ApiLobbyPayload,
  ApiMatchCardPool,
  ApiMatchFormat,
  ApiMatchMode,
  ApiMatchResultSnapshot,
  ApiMatchStartLobbyPayload,
  ApiMatchStatus,
  ApiOpponentStatus,
  ApiPendingUndoRequest,
  ApiPlayerIdentityKind,
  ApiPlayerClockConfig,
  ApiPlayerClockMode,
  ApiPlayerClockSnapshot,
  ApiPersonalRecentResults,
  ApiPublicMatchListEntry,
  ApiPublicMatchStatus,
  ApiReplayAnalysisFrame,
  ApiRecentGameResult,
  ApiRecentResultEntry,
  ApiRecentSeriesGameResult,
  ApiRecentSeriesResult,
  ApiSeriesPlayerSlot,
  ApiSeriesMode,
  ApiSeriesResultSummary,
  ApiSeriesStatus,
  ApiServerMessage,
  ApiServicePayload,
  ApiSidePayload,
} from "./api-contracts";
export {
  CORE_DEMO_DECK_IDS,
  DEMO_DECK_IDS,
  type DemoDeckId,
} from "./demo-fixtures";
export {
  API_USER_ERROR_CODES,
  isApiUserErrorCode,
  type ApiLobbyPresentationDescriptor,
  type ApiUserErrorCode,
  type ApiUserErrorDescriptor,
  type ApiUserErrorPayload,
} from "./presentation-contracts";
export { DEMO_DECKS } from "./demo-decks";
export { ORIGINALSET_DEFAULT_DECKS } from "./originalset-default-decks";
export {
  TEST_CARD_ENVIRONMENT_VARIABLE,
  TEST_CARD_SET_ID,
  testCardsEnabledFromEnvironment,
} from "./test-card-availability";
export { CURRENT_RULES_BASELINE, type RulesBaseline } from "./baselines";
import type { RulesBaseline } from "./baselines";
export type Side = "corp" | "runner";

export type Phase =
  | "setup"
  | "corp_draw_phase"
  | "corp_action_phase"
  | "corp_discard_phase"
  | "runner_action_phase"
  | "runner_discard_phase"
  | "run"
  | "game_over";

export type TimingPointId =
  | "setup.mulligan.runner"
  | "setup.mulligan.corp"
  | "corp_draw.mandatory_draw"
  | "corp_action.main"
  | "corp_discard.select_cards"
  | "corp_discard.complete"
  | "runner_action.main"
  | "runner_discard.flatline_check"
  | "runner_discard.select_cards"
  | "runner_discard.complete"
  | "run.approach_ice"
  | "run.encounter_ice"
  | "run.jack_out_window"
  | "run.movement_rez_window"
  | "access.resolve_card"
  | "game.checkpoint";

export type ActionType =
  | "mandatory_draw"
  | "gain_credit"
  | "draw_card"
  | "activated_card_ability"
  | "install_card"
  | "play_event"
  | "play_operation"
  | "advance_card"
  | "score_agenda"
  | "start_run"
  | "jack_out"
  | "rez_ice"
  | "rez_card"
  | "decline_rez"
  | "pump_breaker"
  | "break_subroutine"
  | "continue_run"
  | "access_card"
  | "steal_agenda"
  | "trash_accessed_card"
  | "trash_resource"
  | "decline_trash"
  | "remove_tag"
  | "purge_virus_counters"
  | "purge_runner_virus_counters"
  | "forgo_action"
  | "move_to_set_aside"
  | "move_to_removed_from_game"
  | "return_from_set_aside"
  | "change_card_control"
  | "stop_restricted_action_sequence"
  | "resolve_choice"
  | "trigger_ability"
  | "end_turn";

export type CardType =
  | "identity"
  | "event"
  | "program"
  | "hardware"
  | "resource"
  | "agenda"
  | "operation"
  | "asset"
  | "upgrade"
  | "ice";
export type CardDefinitionId = string;
export type CardInstanceId = string;
export type FixedPlayCostDefinition = {
  kind: "fixed";
  credits: number;
};
export type VariableXPlayCostDefinition = {
  kind: "variable_x";
  minimumX: number;
  creditsPerX: number;
  maximumX: {
    kind: "context";
  };
};
export type PlayCostDefinition =
  | FixedPlayCostDefinition
  | VariableXPlayCostDefinition;
export type ServerId =
  | "hq"
  | "rd"
  | "archives"
  | `remote_${number}`
  | "new_remote";
export type StateHash = string;
export type Winner = Side | "draw";
export type GameEndReason =
  | "agenda_points"
  | "obligation_debt_unpaid"
  | "bad_publicity_7"
  | "corp_deck_empty"
  | "flatline"
  | "nevinyrral_left_play"
  | "unknown";
export type DamageType = "net" | "meat" | "core";
export type CounterType =
  | "advancement"
  | "virus"
  | "boardwalk"
  | "successful_hq_run_pair_credit"
  | "cockroach"
  | "cascade"
  | "doom"
  | "crumble"
  | "garbage"
  | "highlighter"
  | "thought"
  | "gremlin"
  | "incubate"
  | "skivviss"
  | "scaldan"
  | "tax"
  | "vienna"
  | "socket_archives"
  | "socket_hq"
  | "socket_rd"
  | "pipe"
  | "spy"
  | "doppelganger"
  | "pattel"
  | "link_reduction_counter"
  | "breaker_strength_penalty"
  | "baskerville"
  | "cerberus"
  | "trace_tag_counter"
  | "mastiff"
  | "militech"
  | "power"
  | "agenda"
  | "recurring_credit"
  | "bad_publicity"
  | "install_cost_modifier"
  | "charge"
  | "mark"
  | "dividend"
  | "core_damage"
  | "shell"
  | "bit"
  | "crying"
  | "ablative"
  | "trauma"
  | "boon"
  | "pdca"
  | "remap"
  | "kludge"
  | "term"
  | "drip";

/** Card-instance counter identities that the printed Virus purge removes. */
export const CARD_VIRUS_COUNTER_TYPES = [
  "virus",
  "pattel",
] as const satisfies readonly CounterType[];

export type TraceSuccessEffect =
  | { type: "add_tag"; amount: number }
  | { type: "net_damage"; amount: number }
  | { type: "add_tags_by_trace_margin_over_runner_link" }
  | { type: "add_counter"; counterType: CounterType; amount: number }
  | {
      type: "add_tag_and_counter";
      tagAmount: number;
      counterType: CounterType;
      amount: number;
    }
  | { type: "end_run_and_run_lock"; amount: number }
  | { type: "end_run_trash_program_and_run_lock"; amount: number }
  | {
      type: "end_run_trash_hardware_and_unpreventable_meat_damage";
      amount: number;
    }
  | {
      type: "trash_runner_resource_and_add_tag";
      targetCardInstanceId: CardInstanceId;
    }
  | { type: "none" };

export type SubroutineType =
  | "end_the_run"
  | "end_the_run_unless_runner_pays"
  | "corp_gain_credit"
  | "runner_lose_credits"
  | "give_runner_tag"
  | "do_damage"
  | "random_damage"
  | "initiate_trace"
  | "end_the_run_and_trash_source_at_end_of_turn"
  | "trash_installed_program"
  | "trash_installed_program_unless_runner_pays"
  | "set_run_encounter_tax"
  | "set_run_break_subroutine_cost_modifier"
  | "set_run_future_end_the_run_subroutine"
  | "set_run_active_ice_program_trash"
  | "set_run_future_strength_bonus"
  | "set_next_encounter_unless_fully_break_damage"
  | "set_next_encounter_lock"
  | "set_next_encounter_no_break_subroutines"
  | "set_run_jack_out_lock"
  | "set_runner_forgo_next_action"
  | "end_the_run_and_runner_forgoes_next_action"
  | "set_runner_run_lock_actions"
  | "set_run_jack_out_additional_cost"
  | "set_run_pass_rezzed_ice_program_trash"
  | "secret_spend_compare_end_run_unless_corp_spent_at_least_runner"
  | "reveal_corp_rd_top"
  | "reorder_corp_rd_top2"
  | "deflect_run"
  | "rewind_run_to_rezzed_ice_by_die";

export type SubroutineDefinition = {
  id: string;
  type: SubroutineType;
  amount?: number;
  derivedAmount?: {
    kind: "relative_ice_dynamic_damage";
    ownerCapabilityKey: string;
  };
  damageType?: DamageType;
  dieFaces?: 6;
  damageOnResults?: number[];
  traceLimit?: number;
  traceSuccessEffect?: TraceSuccessEffect;
  runFutureStrengthCancelPaymentAmount?: number;
  requiresSuccessfulTraceSubroutineIndex?: number;
  deflectorTarget?: "archives" | "any_data_fort" | "subsidiary_data_fort";
  deflectorCost?: number;
  deflectorAutoBreakIfNoTarget?: boolean;
  breakTags?: string[];
};

export type EventVisibilityClass =
  | "public"
  | "private_to_side"
  | "hidden_info_barrier"
  | "replay_only";

export const PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES = [
  "boardwalk",
  "successful_hq_run_pair_credit",
  "cockroach",
  "cascade",
  "doom",
  "crumble",
  "garbage",
  "highlighter",
  "thought",
  "gremlin",
  "incubate",
  "skivviss",
  "scaldan",
  "tax",
  "vienna",
  "socket_archives",
  "socket_hq",
  "socket_rd",
  "pipe",
] as const;

export type PurgeableRunnerVirusCounterType =
  (typeof PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES)[number];

export type PurgeableRunnerVirusCounterBucket = Partial<
  Record<PurgeableRunnerVirusCounterType, number>
>;

export type PurgeableRunnerVirusCounterState = {
  corp?: PurgeableRunnerVirusCounterBucket;
  servers?: Partial<
    Record<Exclude<ServerId, "new_remote">, PurgeableRunnerVirusCounterBucket>
  >;
  effects?: Record<
    string,
    {
      counterType: PurgeableRunnerVirusCounterType;
      amount: number;
      publicLabel?: string;
      sourceDefinitionId?: CardDefinitionId;
      serverId?: Exclude<ServerId, "new_remote">;
    }
  >;
};

export type CorpActionDebtEntry = {
  reason: "proteus_virus_purge" | "pipe_counter" | string;
  remaining: number;
  createdAtStateVersion: number;
  source: "proteus_purge" | "start_of_turn_effect" | string;
};

export type CorpActionDebtState = {
  forgoActionsPending: number;
  entries: CorpActionDebtEntry[];
};

export type RestrictedActionFamily =
  | "any_action"
  | "corp_install"
  | "gain_credit"
  | "draw_card"
  | "start_run"
  | "start_run_remote"
  | "play_or_install_card";

export type TurnBoundExtraActionOffer = {
  side: Side;
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  restriction: RestrictedActionFamily;
  optional: boolean;
  dieRoll?: number;
  randomPurpose?: string;
  createdAtStateVersion: number;
  createdDuringTurnSerial?: number;
};

export type TurnBoundExtraActionGrant = TurnBoundExtraActionOffer & {
  remaining: number;
  oncePerTurnPerSource?: boolean;
  forced?: boolean;
  targetServerId?: Exclude<ServerId, "new_remote">;
  targetCardInstanceId?: CardInstanceId;
  revealToCorpOnly?: boolean;
};

export type FutureExtraActionGrant = {
  side: Side;
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  remainingTurns: number;
  amountPerTurn: number;
  restriction?: RestrictedActionFamily;
};

export type RestrictedActionGrantState = {
  side: Side;
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  actionType: ActionType;
  remainingActions: number;
  costProfile:
    | "normal_click"
    | "extra_click"
    | "no_click"
    | "temporary_credit_bundle";
  temporaryCredits?: {
    amount: number;
    usableFor: "runner_program_install";
  };
  spendingCap?: {
    limit: number;
    appliesTo: "run_icebreaker_or_link";
  };
  conversions?: Array<{
    actionType: ActionType;
    requiredActions: number;
  }>;
  cleanupTiming: "side_turn_end" | "side_turn_start" | "on_remaining_zero";
};

export type RestrictedActionGrantBucket = Partial<
  Record<string, RestrictedActionGrantState>
>;

export type ActionEconomyState = {
  pendingOffer?: TurnBoundExtraActionOffer;
  grants?: TurnBoundExtraActionGrant[];
  futureGrants?: FutureExtraActionGrant[];
  corpCreditForfeitDebt?: {
    remaining: number;
    sourceCardInstanceId?: CardInstanceId;
    sourceDefinitionId?: CardDefinitionId;
  };
};

export type RunnerVirusPurgeWindowState = {
  windowId: string;
  timingFamily: "run_special_effect" | "corp_start_of_turn_between_effects";
};

export type ResolvedGameEffectKind =
  | "gain_credits"
  | "add_bad_publicity"
  | "draw_cards"
  | "lose_credits"
  | "rez_card"
  | "score_agenda"
  | "steal_agenda"
  | "trash_card"
  | "purge_counters"
  | "counter_change"
  | "gain_actions"
  | "add_tags"
  | "remove_tags"
  | "bad_publicity"
  | "damage"
  | "add_hosted_credits"
  | "take_hosted_credits"
  | "trash_source_when_empty"
  | "trash_source"
  | "pay_credits_or_lose_game"
  | "resolve_subroutine";

export type ResolvedGameEffect = {
  effectId: string;
  kind: ResolvedGameEffectKind;
  visibility: EventVisibilityClass;
  side?: Side;
  amount?: number;
  reason?: string;
  counterType?: CounterType;
  removedCounterAmount?: number;
  remainingCounters?: number;
  addedCounterAmount?: number;
  tagsAdded?: number;
  runnerTagsAfter?: number;
  redactedKind?: string;
  subroutineIndex?: number;
  subroutineType?: SubroutineType;
  dieRoll?: number;
  dieSize?: number;
  dieRolls?: string;
  randomPurpose?: string;
  randomCounterAfter?: number;
  randomDamageApplied?: boolean;
  randomEffectOutcome?: string;
  restrictedActionFamily?: RestrictedActionFamily;
  runAttemptsLastTurn?: number;
  badPublicityAdded?: number;
  corpBadPublicityAfter?: number;
  permanentActionGain?: boolean;
  sourceTrashed?: boolean;
  runnerClicksAfter?: number;
  runnerForgoneActionOrdinal?: number;
  damageCannotBePrevented?: boolean;
  damageType?: DamageType;
  cardsTrashed?: number;
  coreDamageAfter?: number;
  flatline?: boolean;
  endedRun?: boolean;
  paidCredits?: number;
  preventable?: boolean;
  gameLost?: boolean;
  winner?: Winner;
  sourceDefinitionId?: CardDefinitionId;
  sourceCardInstanceId?: CardInstanceId;
  sourceTitle?: string;
  cardDefinitionId?: CardDefinitionId;
  cardTitle?: string;
  serverId?: ServerId;
  serverLabel?: string;
};

export type PublicAbilityFamily =
  | "agenda-scoring"
  | "damage-prevention"
  | "hidden-zone"
  | "hosting-counters"
  | "payment-costs"
  | "random-effects"
  | "run-access"
  | "trace-tags";

export type PublicAbilityVisibility = {
  class: EventVisibilityClass;
  hiddenZoneBarrier?: boolean;
  redactedKind?: string;
};

/**
 * Side-safe fields shared by Chronicle, replay, AI and server projections.
 * Event-specific fields remain possible, but common semantics must use these
 * names and types instead of introducing another parallel payload vocabulary.
 *
 * Hidden-zone mutation fields describe an actual side-safe state change.
 * Opaque ability IDs remain useful diagnostics, but consumers must never infer
 * a mutation from words contained in those IDs. The zone flags describe the
 * zones actually changed; a no-op has all flags false and a zero card count.
 */
export type PublicEventPayload = Record<string, unknown> & {
  actor?: Side;
  actionType?: string;
  label?: string;
  abilityFamily?: PublicAbilityFamily;
  abilityId?: string;
  effectKind?: string;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: string;
  amounts?: Record<string, number>;
  targets?: Record<string, string | number | boolean>;
  visibility?: PublicAbilityVisibility;
  resolvedEffects?: ResolvedGameEffect[];
  hiddenZoneMutationKind?: "move" | "shuffle" | "reorder" | "swap";
  hiddenZoneAffectedCardCount?: number;
  hiddenZoneContentsChanged?: boolean;
  hiddenZoneOrderChanged?: boolean;
  hiddenZoneChangesHq?: boolean;
  hiddenZoneChangesRd?: boolean;
  /** Actor-safe canonical location of an installed Corp card. */
  serverId?: ServerId;
  installPlacement?: "ice" | "root";
  /** Opaque stable anchor; never a CardInstanceId or card definition. */
  installedPositionKey?: string;
  runnerCostPenaltySupportWindowOpened?: boolean;
  runnerCostPenaltySupportWindowId?: string;
  runnerCostPenaltySupportOriginalActionId?: string;
};

export type SpecialZoneKind = "set_aside" | "removed_from_game";
export type SpecialZoneVisibility =
  | "public"
  | "side_private"
  | "hidden"
  | "replay_only";

export type CostRequirement =
  | { kind: "click"; amount: number }
  | {
      kind: "credit";
      amount: number;
      source?: "credit_pool" | "future_hosted" | "future_recurring";
    }
  | { kind: "tag"; amount: number }
  | { kind: "counter"; counterType: string; amount: number; sourceRef: string };

export type AbilityKind =
  | "paid"
  | "triggered"
  | "static"
  | "setup"
  | "future_interrupt"
  | "future_replacement";

export type ModifierKind = "base_link" | "memory_limit" | "starting_credits";

export type ModifierDefinition = {
  modifierId: string;
  kind: ModifierKind;
  side: Side;
  amount: number;
  duration: "setup" | "static";
  sourceAbilityId?: string;
};

export type AbilityRef = {
  sourceCardInstanceId: CardInstanceId;
  /** Canonical <cardDefinitionId>:<capabilityKey> identity. */
  sourceAbilityId: string;
};

export type EffectSource =
  | { kind: "card"; cardInstanceId: CardInstanceId; abilityId?: string }
  | { kind: "core_rule"; ruleId: string }
  | { kind: "system"; systemId: string };

export type ImminentEventType =
  | "damage"
  | "add_tag"
  | "runner_installed_trash"
  | "test_interrupt";
export type EventModificationKind =
  | "prevent"
  | "avoid"
  | "interrupt"
  | "increase";
export type ReplacementEventType = ImminentEventType | "prevent_damage";

export type ImminentEvent = {
  eventId: string;
  eventType: ImminentEventType;
  source: {
    kind: "card" | "basic_action" | "game_rule" | "test_harness";
    instanceId?: CardInstanceId;
    definitionId?: CardDefinitionId;
  };
  controller: Side | "system";
  affectedSide?: Side;
  payload: Record<string, unknown>;
  visibility: EventVisibilityClass;
  createdAtStateVersion: number;
  modificationWindowId?: string;
};

export type EventModificationCandidate = {
  candidateId: string;
  eventId: string;
  kind: EventModificationKind;
  controller: Side;
  sourceRef: {
    kind: "card" | "game_rule" | "test_harness";
    instanceId?: CardInstanceId;
    definitionId?: CardDefinitionId;
    label: string;
  };
  priority: number;
  visibility: EventVisibilityClass;
  optional: boolean;
  preventAmount?: number;
  /**
   * The controller may choose any positive quantity up to preventAmount.
   * This is intentionally a candidate property rather than a card-specific
   * action shape: one prevention source can cover only part of one event.
   */
  selectablePreventAmount?: boolean;
  increaseAmount?: number;
  preventionSourceIndex?: number;
  preventedTags?: number;
  tagPreventionSourceIndex?: number;
  preventedTrashTargetIds?: CardInstanceId[];
  /** The controller chooses a non-empty subset of the protected targets. */
  selectablePreventTrashTargets?: boolean;
  /** Upper bound for a selectable protected-target subset. */
  maxPreventedTrashTargets?: number;
  trashPreventionSourceIndex?: number;
  /** Targets eligible for the Microtech Backup Drive trash replacement. */
  microtechBackupTargetIds?: CardInstanceId[];
  bypassCostPerDamage?: number;
  bypassPaymentSide?: Side;
};

export type EventModificationWindow = {
  windowId: string;
  eventId: string;
  eventType: ImminentEventType;
  kind: EventModificationKind;
  side: Side;
  candidates: EventModificationCandidate[];
  createdAtStateVersion: number;
  optional: boolean;
  conflictBlocked?: boolean;
};

export type ReplacementCandidate = {
  candidateId: string;
  controller: Side;
  sourceRef: {
    kind: "card" | "game_rule" | "test_harness";
    instanceId?: CardInstanceId;
    definitionId?: CardDefinitionId;
    label: string;
  };
  replacesEventType: ImminentEventType;
  replacementEventType: ReplacementEventType;
  priority: number;
  visibility: EventVisibilityClass;
  optional: boolean;
  tagAmount?: number;
};

export type ReplacementWindow = {
  windowId: string;
  originalEventId: string;
  eventType: ImminentEventType;
  candidates: ReplacementCandidate[];
  consumedCandidateIds: string[];
  createdAtStateVersion: number;
  optional: boolean;
  conflictBlocked?: boolean;
};

export type EventModificationTestHarness = {
  damagePrevention?: {
    side: Side;
    preventAmount: number;
    optional?: boolean;
    sourceLabel?: string;
    visibility?: EventVisibilityClass;
  };
  damageReplacement?: {
    side: Side;
    tagAmount: number;
    optional?: boolean;
    sourceLabel?: string;
    visibility?: EventVisibilityClass;
    priority?: number;
  };
  damageReplacementConflict?: boolean;
};

export type SpecialZoneTestHarness = {
  actor: Side;
  cardInstanceId: CardInstanceId;
  setAside?: {
    visibility: SpecialZoneVisibility;
    visibilitySide?: Side;
    reason?: string;
    allowReturn?: boolean;
    returnZone?: NormalZoneRef;
  };
  removedFromGame?: {
    visibility: SpecialZoneVisibility;
    visibilitySide?: Side;
    reason?: string;
  };
  controlChange?: {
    newController: Side;
    visibility?: EventVisibilityClass;
    reason?: string;
  };
};

export type EffectCommand =
  | { type: "gain_credits"; side: Side; amount: number }
  | { type: "spend_credits"; side: Side; amount: number }
  | { type: "draw_card"; side: Side; amount?: number }
  | {
      type: "do_damage";
      damageType: DamageType;
      amount: number;
      source?: string;
    }
  | { type: "remove_tag"; amount: number }
  | {
      type: "change_breaker_strength";
      breakerId: CardInstanceId;
      amount: number;
    }
  | { type: "break_subroutine"; subroutineIndex: number }
  | { type: "set_pending_choice"; choice: ChoiceRequest }
  | { type: "complete_pending_choice"; choiceId: string }
  | {
      type: "emit_event";
      eventType: string;
      visibilityClass: EventVisibilityClass;
      publicPayload?: Record<string, unknown>;
      privatePayload?: Partial<Record<Side, Record<string, unknown>>>;
    };

export type ChoiceKind =
  | "select_option"
  | "select_cards"
  | "bid_amount"
  | "confirm";

export const CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION =
  "corp-optional-rez-choice-quote-v2" as const;
export const CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND =
  "optional_rez_installed_corp_card_with_temporary_credits" as const;

export type CorpOptionalRezChoiceQuoteBinding = {
  schemaVersion: typeof CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION;
  kind: typeof CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND;
  context: "hq_to_new_remote_optional_rez";
  choiceId: string;
  optionId: string;
  sourceAgendaId: CardInstanceId;
  cardId: CardInstanceId;
  cardDefinitionId: CardDefinitionId;
  targetServerId: Exclude<ServerId, "new_remote">;
  installedZone: "serverIce" | "serverRoot";
  sequencePosition: number;
  stateVersion: number;
};

export type CorpOptionalRezChoiceQuote = CorpOptionalRezChoiceQuoteBinding &
  (
    | { complete: false }
    | {
        complete: true;
        cardType: "ice" | "asset" | "upgrade";
        baseCredits: number;
        finalCredits: number;
        mandatoryAdditionalCosts: VisibleMandatoryCorpRezCosts;
        reductionSourceDefinitionIds?: CardDefinitionId[];
        increaseSourceDefinitionIds?: CardDefinitionId[];
        temporaryCreditsAvailable: number;
        temporaryCreditsApplied: number;
        regularCreditsAvailable: number;
        regularCreditsRequired: number;
        creditPayable: boolean;
        additionalCostsPayable: boolean;
        affordable: boolean;
        mandatoryContinuationComplete: boolean;
        rezAndMandatoryContinuationExecutable: boolean;
      }
  );

export type ChoiceOption = {
  id: string;
  label: string;
  publicLabel?: string;
  value?: string | number | boolean;
  selectable?: boolean;
  metadata?: {
    creditCost?: number;
    postBidTraceLinkDelta?: number;
    delayedInstallRemainingCounters?: number;
    targetServerId?: ServerId;
    targetIcePosition?: number;
  };
};

export type StackSearchResolution = {
  reveal: "public" | "hidden";
  destination: "grip" | "install_program";
  shuffleAfter: boolean;
  publicRevealKind?: string;
};

export type CardSearchPresentation = StackSearchResolution & {
  sourceZone: "stack" | "heap";
  selectableFilter:
    | "program"
    | "any_card"
    | "event"
    | "resource"
    | "hardware"
    | "matching_cards";
  showNonMatchingCards: boolean;
  temporaryReturnAtEndOfTurn?: boolean;
};

export type TemporaryProgramInstallReturn = {
  cardId: CardInstanceId;
  sourceCardDefinitionId: CardDefinitionId;
};

export type VisibleChoiceOption = ChoiceOption & {
  card?: VisibleCard;
  hqInstallRezOptionQuote?: CorpOptionalRezChoiceQuote;
};

export type ChoiceRequest = {
  choiceId: string;
  side: Side;
  source: string;
  sourceCardInstanceId?: CardInstanceId;
  sourceCardDefinitionId?: CardDefinitionId;
  continuation?: ChoiceContinuation;
  prompt: string;
  kind: ChoiceKind;
  options: ChoiceOption[];
  minSelections: number;
  maxSelections: number;
  selectionOrdering?: "ordered" | "unordered";
  stateVersion: number;
  visibility: EventVisibilityClass;
  stackSearchResolution?: StackSearchResolution;
  cardSearchPresentation?: CardSearchPresentation;
};

export type ChoiceContinuation =
  | {
      family: "corp_fort_capacity_cleanup";
      originActionId: string;
      sourceCardDefinitionId: CardDefinitionId;
      serverId: Exclude<ServerId, "new_remote">;
      candidateCardInstanceIds: CardInstanceId[];
      createdAtStateVersion: number;
    }
  | {
      family: "corp_advancement_counter";
      originActionId: string;
      createdAtStateVersion: number;
    }
  | {
      family: "corp_scored_agenda_hq_shuffle";
      originActionId: string;
      agendaInstanceId: CardInstanceId;
      creditPerAgendaPoint: number;
      createdAtStateVersion: number;
    }
  | {
      family: "runner_grip_install_with_temporary_credits";
      originActionId: string;
      sourceCardInstanceId: CardInstanceId;
      sourceCardDefinitionId: CardDefinitionId;
      sourceCapabilityKey: string;
      temporaryCredits: number;
      allowedTypes: Array<"hardware" | "program">;
      createdAtStateVersion: number;
    }
  | {
      family: "runner_hidden_draw_keep_or_top_replacement";
      originActionId: string;
      sourceCardInstanceId: CardInstanceId;
      sourceCardDefinitionId: CardDefinitionId;
      drawnCardInstanceIds: CardInstanceId[];
      createdAtStateVersion: number;
    }
  | {
      family: "runner_program_trash_before_install";
      originActionId: string;
      sourceCardInstanceId: CardInstanceId;
      sourceCardDefinitionId: CardDefinitionId;
      selectedCardId?: CardInstanceId;
      selectedSubtype?: string;
      createdAtStateVersion: number;
    }
  | {
      family: "runner_post_break_stealth_loss";
      originActionId: string;
      breakerInstanceId: CardInstanceId;
      requiredLoss: number;
      sourceMode: "single_stealth_card" | "any_stealth_cards";
      createdAtStateVersion: number;
    };

export type PendingChoice = ChoiceRequest;

export type VisibleChoiceRequest = Omit<ChoiceRequest, "side" | "options"> & {
  side: Side;
  options: VisibleChoiceOption[];
};

export type ChoiceRequirement = {
  choiceId: string;
  minSelections: number;
  maxSelections: number;
  optionIds: string[];
};

export type EffectDefinition = {
  effectId: string;
  source: EffectSource;
  controller: Side;
  timing: TimingPointId;
  costs: CostRequirement[];
  targets: TargetRequirement[];
  choices?: ChoiceRequirement[];
  steps: EffectCommand[];
  visibility: EventVisibilityClass;
};

export type AbilityDefinition = {
  id: string;
  type: "pump_strength" | "break_subroutine" | "approach_ice_expose";
  cost: { credits: number };
  amount?: number;
  iceSubtype?: string;
  subroutineTypes?: SubroutineType[];
  subroutineBreakTags?: string[];
  postBreakStealthLoss?: number;
  count?: number;
  timingPoint: TimingPointId;
  kind?: AbilityKind;
  allowedTimingPoints?: TimingPointId[];
  effectRef?: string;
  publicActionType?: ActionType;
  useLimit?: "once_per_run";
};

export type CardDefinitionNumericFields = {
  cost: number | null;
  installCost: number | null;
  memoryCost: number | null;
  strength: number | null;
  rezCost: number | null;
  trashCost: number | null;
  advancementRequirement: number | null;
  agendaPoints: number | null;
};

export type VariableStrengthDefinition =
  | {
      kind: "paid_x";
      minimumStrength: number;
      maximumStrength: number;
    }
  | {
      kind: "random_die";
      dieSides: number;
    };

export type ResolvedStrengthDefinition =
  | { kind: "fixed"; value: number }
  | VariableStrengthDefinition
  | { kind: "not_applicable" };

export type CardDefinition = {
  id: CardDefinitionId;
  title: string;
  side: Side;
  type: CardType;
  subtypes: string[];
  implementationStatus: "playable_mvp";
  abilityEnabled?: boolean;
  cost?: number;
  playCost?: PlayCostDefinition | null;
  installCost?: number;
  memoryCost?: number;
  memoryLimitBonus?: number;
  maxHandSizeBonus?: number;
  strength?: number;
  variableStrength?: VariableStrengthDefinition;
  baseLink?: number;
  rezCost?: number;
  trashCost?: number;
  advancementRequirement?: number;
  agendaPoints?: number;
  recurringCredits?: number;
  rulesText: string;
  abilities?: AbilityDefinition[];
  modifiers?: ModifierDefinition[];
  subroutines?: SubroutineDefinition[];
  mechanics: string[];
  markCounterDisplay?: {
    id: string;
    label: string;
    ariaLabelName: string;
  };
};

export type ResolvedCardDefinition =
  | (Omit<CardDefinition, "type" | "playCost" | "variableStrength"> & {
      type: "event" | "operation";
      playCost: PlayCostDefinition;
      numeric: CardDefinitionNumericFields;
      strengthModel: ResolvedStrengthDefinition;
    })
  | (Omit<CardDefinition, "type" | "playCost" | "variableStrength"> & {
      type: Exclude<CardType, "event" | "operation">;
      playCost: null;
      numeric: CardDefinitionNumericFields;
      strengthModel: ResolvedStrengthDefinition;
    });

export type DeckDefinition = {
  id: string;
  name: string;
  side: Side;
  identity: CardDefinitionId;
  cards: Array<{ id: CardDefinitionId; quantity: number }>;
};

export type DeckPublicMetadata = {
  side: Side;
  identityCardId: CardDefinitionId;
  deckName: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  deckHash: string;
};

export type StandardDeckGuideRef = {
  standardDeckId: string;
};

export type PlayerController = {
  controllerId: string;
  side: Side;
  type: "human_local" | "human_remote" | "ai" | "replay";
  displayName?: string;
  profileId?: string;
  difficulty?: AiDifficulty;
};

export type AiDifficulty = "easy" | "normal" | "hard";

export type TraceRulesProfile =
  | "modern_open"
  | "classic_blind"
  | "classic_blind_corp_ties";

export const DEFAULT_TRACE_RULES_PROFILE: TraceRulesProfile = "modern_open";

export type CreateGameConfig = {
  matchId?: string;
  seed?: string;
  baseline?: RulesBaseline;
  runnerDeckId?: "demo_runner_001" | "demo_runner_004" | "demo_runner_008";
  corpDeckId?: "demo_corp_001" | "demo_corp_004" | "demo_corp_008";
  runnerDeck?: DeckDefinition;
  corpDeck?: DeckDefinition;
  runnerDeckMetadata?: DeckPublicMetadata;
  corpDeckMetadata?: DeckPublicMetadata;
  agendaPointsToWin?: number;
  traceRulesProfile?: TraceRulesProfile;
  setupMode?: "explicit" | "completed";
  controllers?: {
    runner: PlayerController;
    corp: PlayerController;
  };
};

export type SetupState = {
  status: "mulligan_runner" | "mulligan_corp" | "complete";
  initialHandSize: number;
  resolved: Partial<Record<Side, "keep" | "mulligan">>;
  mulligansTaken: Partial<Record<Side, number>>;
};

export type NormalZoneRef =
  | { side: "corp"; zone: "hq" | "rd" | "archives" | "scoreArea" }
  | {
      side: "corp";
      zone: "serverIce" | "serverRoot";
      serverId: Exclude<ServerId, "new_remote">;
    }
  | { side: "runner"; zone: "grip" | "stack" | "heap" | "scoreArea" | "rig" };

export type ZoneRef =
  | NormalZoneRef
  | {
      side: "special";
      zone: SpecialZoneKind;
      visibility: SpecialZoneVisibility;
      visibilitySide?: Side;
      returnZone?: NormalZoneRef;
    };

export type CardInstance = {
  instanceId: CardInstanceId;
  definitionId: CardDefinitionId;
  owner: Side;
  controller: Side;
  zone: ZoneRef;
  faceup: boolean;
  rezzed: boolean;
  advancementCounters: number;
  strengthModifier: number;
  agendaPointsSpent?: number;
  counters?: Partial<Record<CounterType, number>>;
  tapped?: boolean;
  hostedOn?: CardInstanceId;
  /** Bottom-to-top order for cards placed faceup on Microtech Backup Drive. */
  microtechBackupOrder?: number;
  selectedServerId?: Exclude<ServerId, "new_remote">;
  selectedCardId?: CardInstanceId;
  selectedSubtype?: string;
  installedAsRunnerProgram?: {
    memoryCost: number;
    scoreAsAgendaAction?: true;
    removeFromGameOnLeavePlay?: true;
    originalType?: CardType;
  };
  variableIceState?: {
    family: "x_strength" | "paid_end_the_run_subroutines" | "alternate_subtype";
    additionalCostPaid: number;
    value: number;
    cap?: number;
    strength?: number;
    subroutineCount?: number;
    selectedSubtypes?: string[];
    traceLimit?: number;
  };
};

export type CorpServer = {
  id: Exclude<ServerId, "new_remote">;
  kind: "hq" | "rd" | "archives" | "remote";
  label: string;
  ice: CardInstanceId[];
  root: CardInstanceId[];
};

export type CorpState = {
  identity: CardInstanceId;
  credits: number;
  clicks: number;
  maxHandSize: number;
  badPublicity: number;
  hq: CardInstanceId[];
  rd: CardInstanceId[];
  archives: CardInstanceId[];
  scoreArea: CardInstanceId[];
  servers: CorpServer[];
};

export type SpecialZoneState = {
  setAside: CardInstanceId[];
  removedFromGame: CardInstanceId[];
};

export type RunnerRig = {
  programs: CardInstanceId[];
  hardware: CardInstanceId[];
  resources: CardInstanceId[];
};

export type RunnerState = {
  identity: CardInstanceId;
  credits: number;
  clicks: number;
  maxHandSize: number;
  coreDamage: number;
  tags: number;
  memoryUsed: number;
  memoryLimit: number;
  grip: CardInstanceId[];
  stack: CardInstanceId[];
  heap: CardInstanceId[];
  scoreArea: CardInstanceId[];
  rig: RunnerRig;
};

export type AccessStealCostModifierSnapshot = {
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  sourceTitle: string;
  amount: number;
  appliesToCardType: Extract<CardType, "agenda">;
  visibility: EventVisibilityClass;
};

export type MultiServerSuccessSequenceState = {
  kind: "multi_server_success_sequence";
  sequence: "run_each_data_fort";
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  sourceTitle: string;
  pendingServerIds: Exclude<ServerId, "new_remote">[];
  successfulServerIds: Exclude<ServerId, "new_remote">[];
  anyUnsuccessful: boolean;
  onAllSuccessful: "gain_runner_event_agenda_point";
  onAnyUnsuccessful: "forgo_next_action";
  advanceAfterEachRun: true;
  resolveAfterAllRuns: true;
};

export type RunState = {
  runId: string;
  /** Continuous runner action ordinal that initiated this run, if any. */
  runnerActionOrdinal?: number;
  attackedServerId: Exclude<ServerId, "new_remote">;
  accessServerOverride?: Exclude<ServerId, "new_remote">;
  successfulRunServerOverride?: Exclude<ServerId, "new_remote">;
  freeTrashAccessZones?: Array<"rd" | "hq">;
  virusAccessTrashCounterUses?: Array<{
    counterType: Extract<PurgeableRunnerVirusCounterType, "garbage">;
    removeAtRunEnd: number;
    sourceDefinitionId: CardDefinitionId;
  }>;
  grantBonusRunOnFinish?: boolean;
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
    sourceDefinitionId: CardDefinitionId;
  };
  conditionalAccessBonusApplied?: boolean;
  corpRezCostSurcharge?: {
    kind: "matching_printed_rez_cost";
    sourceDefinitionId: CardDefinitionId;
  };
  traceAttemptedThisRun?: boolean;
  badPublicityRunAftermath?:
    | {
        kind: "successful_run_counted_subtypes";
        runnerTagsOnSuccess: number;
        badPublicityPerEncounteredIceSubtype: {
          subtype: "black_ice";
          amount: number;
        };
        badPublicityPerRezzedCardSubtype: {
          subtype: "black_ops";
          amount: number;
        };
        badPublicityPerLiberatedAgendaSubtype: {
          subtype: "black_ops";
          amount: number;
        };
        sourceCardId: CardInstanceId;
        sourceDefinitionId: CardDefinitionId;
        sourceTitle: string;
      }
    | {
        kind: "trashed_card_subtype_during_run";
        badPublicityPerTrashedCardSubtype: {
          subtype: "advertisement";
          amount: number;
        };
        sourceCardId: CardInstanceId;
        sourceDefinitionId: CardDefinitionId;
        sourceTitle: string;
      };
  successfulRunSourceCardId?: CardInstanceId;
  successfulRunSourceDefinitionId?: CardDefinitionId;
  successfulRunSourceTitle?: string;
  successfulRunCreditLoss?: number;
  successfulRunRunnerTagGain?: number;
  successfulRunCorpDraw?: number;
  successfulRunRunnerCreditGain?: number;
  successfulRunRequiresCorpCredits?: boolean;
  successfulRunPrivateLookCount?: number;
  successfulRunArchivesMoveCount?: number;
  phase: "approach_ice" | "encounter_ice" | "movement" | "access";
  position:
    | {
        kind: "ice";
        serverId: Exclude<ServerId, "new_remote">;
        iceIndex: number;
      }
    | { kind: "server"; serverId: Exclude<ServerId, "new_remote"> };
  approachedIceId?: CardInstanceId;
  encounteredIceId?: CardInstanceId;
  encounteredBlackIceCount?: number;
  rezzedBlackOpsCount?: number;
  liberatedBlackOpsAgendaCount?: number;
  trashedBlackOpsCount?: number;
  trashedAdvertisementCount?: number;
  approachIceExposeUsedSourceIdsThisRun?: CardInstanceId[];
  approachIceExposeSkippedIceIdsThisRun?: CardInstanceId[];
  approachIceExposeViewingIceId?: CardInstanceId;
  approachIceExposeViewingSourceCardId?: CardInstanceId;
  eventApproachIceExposeBeforeRez?: boolean;
  prohibitNoisyIcebreakers?: boolean;
  usedNoisyIcebreakerThisRun?: boolean;
  runnerCreditGainOnCorpRez?: number;
  damagePreventionPool?: {
    sourceDefinitionId: CardDefinitionId;
    remaining: number;
  };
  brokenSubroutineIndexes: number[];
  resolvedSubroutineIndexes: number[];
  ignoredSubroutineIndexes?: number[];
  successful: boolean;
  accessedCardId?: CardInstanceId;
  pendingSuccessBonusCredits?: number;
  accessCount?: number;
  preAccessTopRdReorderResolved?: boolean;
  hiddenRunnerResourceAccessStartServerId?: Exclude<ServerId, "new_remote">;
  hiddenRunnerResourceAccessStartWindowClosed?: boolean;
  badPublicityCredits?: number;
  runnerRunTemporaryCredits?: {
    sourceDefinitionId: CardDefinitionId;
    remaining: number;
    returnUnusedAtRunEnd: true;
  };
  testSpinTemporaryInstall?: {
    cardId: CardInstanceId;
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    installCostPenalty: number;
  };
  corpRunTemporaryCredits?: {
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    remaining: number;
    usableFor: "corp_costs_during_this_run";
    returnUnusedAtRunEnd: true;
  };
  unpreventableCoreDamageAtRunEnd?: {
    sourceDefinitionId: CardDefinitionId;
    amount: number;
  };
  runTraceLinkBonus?: number;
  runTraceLinkBonusSourceDefinitionId?: CardDefinitionId;
  bypassFirstIceRemaining?: boolean;
  encounterTaxForFutureIce?: number;
  encounterTaxSourceDefinitionId?: CardDefinitionId;
  breakSubroutineAdditionalCost?: number;
  breakSubroutineAdditionalCostSourceDefinitionId?: CardDefinitionId;
  runDurationAdditionalSubroutineModifiers?: Array<{
    modifierId: string;
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    subroutineKind: "end_the_run";
    append: "after_existing";
  }>;
  turbeauAccessTraceConsumedByServer?: Partial<
    Record<Exclude<ServerId, "new_remote">, CardInstanceId[]>
  >;
  activeIceProgramTrashSourceIceId?: CardInstanceId;
  activeIceProgramTrashPendingPassedIceId?: CardInstanceId;
  passRezzedIceProgramTrashModifiers?: Array<{
    modifierId: string;
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
  }>;
  passRezzedIceProgramTrashPending?: {
    passedIceId: CardInstanceId;
    remainingModifierIds: string[];
  };
  jackOutAdditionalCostForRun?: number;
  vacuumLinkRewindChoice?: {
    sourceIceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    rezzedIceBack: number;
    targetIceId: CardInstanceId;
    targetIceIndex: number;
  };
  encounterTemporaryTraceCredits?: {
    sourceIceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    remaining: number;
    usableFor: "this_ice_printed_trace_subroutines";
  };
  encounterTemporaryIceStrengthModifiers?: Array<{
    sourceIceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    amount: number;
    expires: "encounter_end";
  }>;
  encounterAdditionalSubroutines?: Array<{
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    sourceTitle: string;
    targetIceId?: CardInstanceId;
    originalSubroutineId?: string;
    subroutineKind: SubroutineType;
    amount?: number;
    copiedSubroutine?: SubroutineDefinition;
  }>;
  lastPassedIceId?: CardInstanceId;
  fortPassWindowUsedSourceIdsThisRun?: CardInstanceId[];
  postPassPayOrEndRun?: {
    sourceCardInstanceIds: CardInstanceId[];
    sourceDefinitionIds: CardDefinitionId[];
    passedIceId: CardInstanceId;
    serverId: Exclude<ServerId, "new_remote">;
    amount: number;
  };
  postPassCancellableFutureIceStrength?: {
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    passedIceId: CardInstanceId;
    serverId: Exclude<ServerId, "new_remote">;
    amount: number;
    paymentAmount: number;
  };
  corpPostPassIceReturnToHq?: {
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    passedIceId: CardInstanceId;
    serverId: Exclude<ServerId, "new_remote">;
    mode: "required_pay_or_return" | "optional_return_gain";
    paymentAmount?: number;
    gainCredits?: number;
  };
  runStartRandomStrengthSourceCardId?: CardInstanceId;
  runStartRandomStrength?: number;
  runStartRandomStrengthByBreaker?: Partial<Record<CardInstanceId, number>>;
  futureEncounterIceStrengthBonus?: number;
  nextEncounterNoBreakSubroutines?: boolean;
  nextEncounterJackOutLock?: boolean;
  noBreakSubroutinesActive?: boolean;
  jackOutLockedUntilEncounterEnds?: boolean;
  jackOutLockedForRun?: boolean;
  nextEncounterFatalDamage?: number;
  nextEncounterFatalDamageSourceDefinitionId?: CardDefinitionId;
  fatalDamageActiveForEncounter?: boolean;
  fatalDamageAmountForEncounter?: number;
  fatalDamageSourceDefinitionId?: CardDefinitionId;
  fullyBrokenIceIds?: CardInstanceId[];
  fullyBrokenPassedIcePendingId?: CardInstanceId;
  fullyBrokenPassedIceTrashPendingId?: CardInstanceId;
  forceJackOutAfterEncounterSourceId?: CardInstanceId;
  runEndCounterAwardBreakerIds?: CardInstanceId[];
  runOnceBreakTagAndStealthLossUsedBreakerIds?: CardInstanceId[];
  runEndTrashUsedBreakerIdsThisRun?: CardInstanceId[];
  bartmossUsedBreakerIdsThisEncounter?: CardInstanceId[];
  blinkUsedSubroutinesByBreakerThisEncounter?: Partial<
    Record<CardInstanceId, number[]>
  >;
  /** Generic state for breaker effects that persists only for this run. */
  breakerState?: {
    strengthModifiersByBreakerInstanceId: Partial<
      Record<
        CardInstanceId,
        Array<{
          amount: number;
          duration: "current_encounter" | "current_run";
          source: string;
        }>
      >
    >;
    brokenSubroutineCountByBreakerInstanceId: Partial<
      Record<CardInstanceId, number>
    >;
    brokenSubroutineBreakerByIndex?: Partial<Record<number, CardInstanceId>>;
    pendingFreeBreaks: Array<{
      sourceBreakerInstanceId: CardInstanceId;
      sourceAbilityId: string;
      iceSubtype: "sentry";
      remainingUses: number;
      mustBeNextEncounteredIce: true;
      targetIceId?: CardInstanceId;
    }>;
  };
  remainderStrengthBonusByBreaker?: Partial<Record<CardInstanceId, number>>;
  runStrengthBoostUsedSourceIds?: CardInstanceId[];
  runDurationEffects?: Array<{
    kind: "delayed_agenda_access_replacement";
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    serverId: Exclude<ServerId, "new_remote">;
    replacementWindow: "agenda_access";
    delayUntil: "runner_next_turn_start";
  }>;
  traceSuccessBySubroutineIndex?: Partial<Record<number, boolean>>;
  accessStealCostModifierSnapshotsByServer?: Partial<
    Record<Exclude<ServerId, "new_remote">, AccessStealCostModifierSnapshot[]>
  >;
  hqIceSwapUsedSourceIdsThisRun?: CardInstanceId[];
  iceRepositionUsedSourceIdsThisRun?: CardInstanceId[];
  discountedRezUsedSourceIdsThisRun?: CardInstanceId[];
  temporaryDiscountedRezzedIceIds?: CardInstanceId[];
  successfulRunInterventionUsedSourceIds?: CardInstanceId[];
  successfulRunInterventionWindowClosed?: boolean;
  secretSpendGuessRunAutoPassIceId?: CardInstanceId;
  delayedSuccessfulRun?: {
    originalServerId: Exclude<ServerId, "new_remote">;
    interventionSourceId: CardInstanceId;
    pendingMode:
      | "temporary_hq_ice_encounter"
      | "installed_ice_immediate_approach";
    temporaryIceId?: CardInstanceId;
    installedIceId?: CardInstanceId;
  };
  breach?: BreachState;
  successfulRunAbilityUsedSourceIds?: CardInstanceId[];
  fortPassWindowPassedKeys?: string[];
  rootRezWindowPendingPassKeys?: string[];
  rootRezWindowPassedKeys?: string[];
  rezInterruptPendingRezCardId?: CardInstanceId;
  rezInterruptPendingRezTimingPoint?: string;
  rezInterruptPendingRezActiveSide?: Side;
  runActionSpendingCap?: {
    sourceCardInstanceId: CardInstanceId;
    limit: number;
    spent: number;
  };
  runCreditSpendCap?: {
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    announcedSpendCap: number;
    spentDuringRun: number;
  };
  nextAgendaAccessAgendaPointBonus?: {
    sourceEffectInstanceIds: string[];
    sourceDefinitionIds: CardDefinitionId[];
    sourceTitles: string[];
    amount: number;
    cardId?: CardInstanceId;
  };
  activeSequence?: MultiServerSuccessSequenceState;
  runStartInterventions?: Array<{
    kind: "start_run_redirect_to_source_fort";
    originalServerId: Exclude<ServerId, "new_remote">;
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    targetServerId: Exclude<ServerId, "new_remote">;
    costCredits: number;
  }>;
};

export type AccessQueueEntry = {
  entryId: string;
  cardInstanceId: CardInstanceId;
  serverId: Exclude<ServerId, "new_remote">;
  zone: "rd" | "hq" | "archives" | "remote_root";
  status:
    | "pending"
    | "accessed"
    | "stolen"
    | "trashed"
    | "declined"
    | "skipped";
  hiddenInfo: boolean;
};

export type BreachState = {
  breachId: string;
  serverId: Exclude<ServerId, "new_remote">;
  accessMode: "single" | "multi";
  queue: AccessQueueEntry[];
  currentIndex: number;
  completed: boolean;
  accessedSummaries: Array<{
    entryId: string;
    status: AccessQueueEntry["status"];
    cardDefinitionId?: CardDefinitionId;
  }>;
};

export type TraceCorpPaymentSourceKind =
  | "temporary_trace_credit"
  | "fort_trace_bit_pool"
  | "corp_credits"
  | "corp_trace_bit_pool"
  | "corp_trace_counter_pool";

export type TraceRunnerPaymentSourceKind =
  | "runner_credits"
  | "runner_trace_link_credit";

export type TraceCorpBidPaymentCommitment = {
  side: "corp";
  bid: number;
  canPay: boolean;
  breakdown: Array<{
    kind: TraceCorpPaymentSourceKind;
    amount: number;
    sourceCardInstanceId?: CardInstanceId;
    sourceDefinitionId?: CardDefinitionId;
    serverId?: Exclude<ServerId, "new_remote">;
  }>;
  normalCreditsToPay: number;
  temporaryTraceCreditsToPay: number;
  fortTraceBitPoolToPay: number;
  corpTraceBitsToPay: number;
  corpTraceCountersToPay: number;
};

export type TraceRunnerBidPaymentCommitment = {
  side: "runner";
  purpose: "runner_trace_bid";
  amount: number;
  canPay: boolean;
  breakdown: Array<{
    kind: TraceRunnerPaymentSourceKind;
    amount: number;
    sourceCardInstanceId?: CardInstanceId;
    sourceDefinitionId?: CardDefinitionId;
    publicKind?: "runner_trace_link_bonus_credit";
  }>;
  traceLinkCreditsToPay: number;
  bonusTraceLinkCreditsToPay: number;
  normalCreditsToPay: number;
  sourceDefinitionIds: CardDefinitionId[];
};

export type TraceState = {
  traceId: string;
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  traceRulesProfile?: TraceRulesProfile;
  subroutineIndex?: number;
  traceLimit: number;
  effectiveTraceLimit?: number;
  corpBidMax?: number;
  rabbitTraceLimitReduction?: number;
  fortTraceBitPoolSourceCardInstanceId?: CardInstanceId;
  fortTraceBitPoolServerId?: Exclude<ServerId, "new_remote">;
  encounterTemporaryTraceCreditSourceIceId?: CardInstanceId;
  encounterTemporaryTraceCreditSourceDefinitionId?: CardDefinitionId;
  status:
    | "corp_bid"
    | "base_link"
    | "runner_bid"
    | "post_bid_link"
    | "trace_success_cancel"
    | "trace_success_program_trash";
  successEffect: TraceSuccessEffect;
  returnPhase?: Phase;
  returnTimingPoint?: TimingPointId;
  returnActiveSide?: Side;
  corpBid?: number;
  bidsRevealed?: boolean;
  traceValue?: number;
  runnerLink?: number;
  baseLinkSourceId?: CardInstanceId;
  baseLinkValue?: number;
  baseLinkCostPaid?: number;
  traceAvoidRewardUsages?: Array<{
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    amount: number;
    timing: "trace_base_link_window" | "trace_post_bid_link_window";
  }>;
  runnerBidPaymentSelection?: {
    bid: number;
    sourceCardInstanceIds: CardInstanceId[];
    sourceIndex: number;
    allocations: Array<{
      sourceCardInstanceId: CardInstanceId;
      amount: number;
    }>;
  };
  corpBidPaymentSelection?: {
    bid: number;
  };
  /** Private, transient and authoritative until both Blind bids reveal. */
  corpBidPaymentCommitment?: TraceCorpBidPaymentCommitment;
  /** Private, transient and authoritative until both Blind bids reveal. */
  runnerBidPaymentCommitment?: TraceRunnerBidPaymentCommitment;
  runnerBid?: number;
  runnerStrength?: number;
  postBidLinkSourceIds?: CardInstanceId[];
  postBidLinkBonus?: number;
  successful?: boolean;
  corpTemporaryTraceCredits?: {
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    remaining: number;
    includedInCorpCreditPool: true;
    usableFor: "unrestricted_during_current_trace";
    returnUnusedAtTraceEnd: true;
  };
};

export type RandomDrawRecord = {
  counter: number;
  purpose: string;
  value: number;
};

export type PublicGameEvent = {
  eventId: string;
  type: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  turnSerial?: number;
  stateHashAfter: StateHash;
  visibilityClass?: EventVisibilityClass;
  publicPayload: PublicEventPayload;
};

export type GameEvent = PublicGameEvent & {
  // Persisted/local replay input is validated structurally at the replay edge;
  // malformed stored data must remain representable so it can be rejected.
  privatePayload?: Partial<Record<Side, Record<string, unknown>>>;
};

export type RunnerDrawSequence = {
  sequenceId: string;
  remainingDrawCount: number;
  drawnCardIds: CardInstanceId[];
  currentDrawTaxSourceIds: CardInstanceId[];
  currentDrawTaxSourceIndex: number;
  preDrawRezWindowPassed: boolean;
  drawTaxSourceCount: number;
  drawTaxCreditsPaid: number;
  drawTaxTagsAdded: number;
  crashEverettSourceCardId?: CardInstanceId;
};

export type CorpDrawContinuation =
  | {
      kind: "card_effect_on_play";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      drawEffectIndex: number;
      nextEffectIndex: number;
      creditGainOrdinal: number;
    }
  | {
      kind: "card_effect_activated";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      sourceAbilityId: string;
      drawEffectIndex: number;
      nextEffectIndex: number;
      creditGainOrdinal: number;
      originalActionPayload: LegalActionPayload;
    }
  | {
      kind: "corporate_shuffle_hq_to_rd";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
    }
  | {
      kind: "effect_commands";
      remainingCommands: EffectCommand[];
    }
  | {
      kind: "corp_mandatory_draw";
      mandatoryCardCount: 1;
      additionalCardCount: number;
      totalBaseDrawCount: number;
      mandatoryAgendaCardCount: number;
      optionalAgendaCardCount: number;
      skivvissCardCount: number;
      additionalSourceDefinitionIds: CardDefinitionId[];
    };

export type CardCreditGainContinuation =
  | {
      kind: "card_effect_on_play";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      nextEffectIndex: number;
      creditGainOrdinal: number;
    }
  | {
      kind: "card_effect_activated";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      sourceAbilityId: string;
      nextEffectIndex: number;
      creditGainOrdinal: number;
      originalActionPayload: LegalActionPayload;
    }
  | {
      kind: "card_effect_immediate_lifecycle";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      lifecycle: "on_rez" | "on_install" | "on_score" | "on_leave_play";
      nextEffectIndex: number;
      creditGainOrdinal: number;
    }
  | {
      kind: "corp_root_rez_obligation";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      gainedCredits: number;
    };

export type CorpDrawTransaction = {
  transactionId: string;
  baseDrawCount: number;
  replacementDrawCount: number;
  drawnCardIds: CardInstanceId[];
  replacementSourceCardInstanceId?: CardInstanceId;
  replacementSourceDefinitionId?: CardDefinitionId;
  continuation?: CorpDrawContinuation;
};

export type PendingAddTagContinuation =
  | {
      kind: "terminal";
      sourceDefinitionId: CardDefinitionId;
    }
  | {
      kind: "access_effect";
      sourceCardId: CardInstanceId;
      effectIndex: number;
      tagStepIndex: number;
      nextStepIndex: number;
      accessZone: "installed" | "hq" | "rd" | "archives";
      runnerTagsBefore: number;
    }
  | {
      kind: "card_effect_on_play";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      tagEffectIndex: number;
      nextEffectIndex: number;
      creditGainOrdinal: number;
      runnerTagsBefore: number;
    }
  | {
      kind: "runner_draw_tax";
      sequenceId: string;
      sourceCardId: CardInstanceId;
      sourceIndex: number;
      runnerTagsBefore: number;
    }
  | {
      kind: "corp_start_turn_satellite_choice";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      nextRootCardIndex: number;
      runAttemptsLastTurn: number;
    }
  | {
      kind: "corp_start_turn";
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      nextRootCardIndex: number;
      runAttemptsLastTurn: number;
      dieRolls: number[];
      tagAmount: number;
      runnerTagsBefore: number;
    }
  | {
      kind: "runner_start_turn";
      sourceDefinitionId: CardDefinitionId;
      counterType: CounterType;
      nextCounterEffectIndex: number;
      tagAmount: number;
      runnerTagsBefore: number;
    }
  | {
      kind: "trace_add_counter";
      sourceDefinitionId: CardDefinitionId;
      counterType: CounterType;
      counterAmount: number;
    }
  | {
      kind: "successful_run_access_replacement";
      runId: string;
      runnerTagsBefore: number;
    }
  | {
      kind: "run_end_cleanup";
      runId: string;
      successful: boolean;
      runnerTagsBefore: number;
    }
  | {
      kind: "end_turn_tag";
      side: Side;
      sourceCardIds: CardInstanceId[];
      nextSourceIndex: number;
      runnerTagsBefore: number;
    };

export type HqInstallRezSequenceState = {
  sourceAgendaId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  serverId: Exclude<ServerId, "new_remote">;
  selectedCardIds: CardInstanceId[];
  nextCardIndex: number;
  temporaryCreditsProvided: number;
  temporaryCreditsRemaining: number;
  optionalRezContinuationProjection?: {
    cardId: CardInstanceId;
    sequencePosition: number;
    stateVersion: number;
    complete: boolean;
    executable: boolean;
  };
};

export type RunnerDelayedEffectInstance = {
  effectInstanceId: string;
  kind: "next_agenda_access_credit_gain" | "next_agenda_access_agenda_point";
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  sourceTitle: string;
  sourceCapabilityKey: string;
  amount: number;
  trigger: "next_agenda_access";
  expires: "runner_turn_end";
  createdAtTurnSerial: number;
  consumed: boolean;
  consumedByCardId?: CardInstanceId;
};

export type GameState = {
  matchId: string;
  baseline: RulesBaseline;
  traceRulesProfile?: TraceRulesProfile;
  stateVersion: number;
  turnSerial?: number;
  seed: string;
  randomCounter: number;
  randomDrawRecords: RandomDrawRecord[];
  aiTurnPlanRandomCounter?: number;
  aiTurnPlanRandomDrawRecords?: AiTurnPlanRandomDrawRecord[];
  activeSide: Side;
  phase: Phase;
  timingPoint: TimingPointId;
  corp: CorpState;
  runner: RunnerState;
  specialZones?: SpecialZoneState;
  cardInstances: Record<CardInstanceId, CardInstance>;
  eventLog: GameEvent[];
  winner: Winner | null;
  gameEndReason?: GameEndReason;
  agendaPointsToWin: number;
  setup?: SetupState;
  pendingChoice?: PendingChoice;
  pendingAardvarkBreakerContinuation?: {
    aardvarkId: CardInstanceId;
    breakerId: CardInstanceId;
    encounteredIceId: CardInstanceId;
    originalLegalAction: LegalAction;
    createdAtStateVersion: number;
  };
  hqInstallRezSequence?: HqInstallRezSequenceState;
  pendingAddTagContinuation?: PendingAddTagContinuation;
  pendingAccessEffectDamageContinuation?: {
    sourceCardId: CardInstanceId;
    effectIndex: number;
    damageStepIndex: number;
    nextStepIndex: number;
    accessZone: "installed" | "hq" | "rd" | "archives";
  };
  pendingTraceProgramTrashContinuation?: {
    traceId: string;
    traceStep: "runner_bid" | "post_bid_link";
    additionalTagAmount?: number;
  };
  pendingTraceHardwareWreckerContinuation?: {
    sourceDefinitionId: CardDefinitionId;
    sourceCardInstanceId: CardInstanceId;
    traceId: string;
    damageAmount: number;
    stage: "select_hardware" | "trash_prevention";
    targetHardwareId?: CardInstanceId;
  };
  pendingRunStartDamageContinuation?: {
    runId: string;
    counterEffectIndex: number;
    nextCounterOrdinal: number;
    counterCount: number;
    sourceDefinitionId: CardDefinitionId;
    counterType: CounterType;
    damageType: DamageType;
    amountPerCounter: number;
    totalDamageAmount: number;
    totalCardsTrashed: number;
  };
  pendingDamageFollowup?: {
    kind: "trash_corp_source";
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
  };
  pendingCorpCreditGainReplacement?: {
    requestedAmount: number;
    baseAmount: number;
    bonusAmount: number;
    creditsBefore: number;
    modifierSourceDefinitionIds: CardDefinitionId[];
    investmentFirmSourceIds: CardInstanceId[];
    sourceDefinitionId?: CardDefinitionId;
    sourceCardId?: CardInstanceId;
    sourceKind: string;
    sourceReason: string;
    continuation?: CardCreditGainContinuation;
  };
  pendingRunStartSourceOrder?: {
    runId: string;
    remaining: Array<{
      kind: "card_implementation" | "random_strength";
      sourceCardId: CardInstanceId;
    }>;
  };
  pendingPreventableTrashCostContinuation?: {
    kind: "runner_run_strength_boost";
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    targetCardId: CardInstanceId;
    runId: string;
    amount: number;
  };
  pendingRunEndTrashContinuation?: {
    runId: string;
    deferActionDebtConsumption: boolean;
    remainingSourceCardIds: CardInstanceId[];
    activeSourceCardId?: CardInstanceId;
    activeSourceDefinitionId?: CardDefinitionId;
    effectCount: number;
    preventedOrReplacedCount: number;
    trashedDefinitionIds: CardDefinitionId[];
  };
  pendingRunnerInstalledMultiTrash?: {
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    effectKind:
      | "trash_runner_resources_if_tagged"
      | "installed_hardware_trash_by_counter"
      | "access_hardware_trash_by_advancement"
      | "access_program_trash_by_advancement"
      | "access_daemon_trash";
    targetCardType: "resource" | "hardware" | "program" | "daemon";
    minimumTargets: number;
    maximumTargets: number;
    selectionOrdering: "ordered" | "unordered";
    excludesSubtype?: string;
    eligibleTargets: Array<{
      cardInstanceId: CardInstanceId;
      choiceValue: string;
    }>;
  };
  pendingVirusCounterPrevention?: {
    targets: Array<
      | {
          kind: "card";
          cardId: CardInstanceId;
          counterType: CounterType;
        }
      | {
          kind: "corp_pool";
          counterType: PurgeableRunnerVirusCounterType;
        }
      | {
          kind: "server_pool";
          serverId: Exclude<ServerId, "new_remote">;
          counterType: PurgeableRunnerVirusCounterType;
        }
      | {
          kind: "pox_server";
          serverId: Exclude<ServerId, "new_remote">;
        }
      | {
          kind: "fait_server";
          serverId: Exclude<ServerId, "new_remote">;
        }
    >;
  };
  pendingCorpDraw?: CorpDrawTransaction;
  runnerDrawSequence?: RunnerDrawSequence;
  imminentEvent?: ImminentEvent;
  temporaryProgramInstallReturns?: TemporaryProgramInstallReturn[];
  eventModificationWindow?: EventModificationWindow;
  replacementWindow?: ReplacementWindow;
  runnerTagAvoidanceCredits?: number;
  runnerActionsPerTurnOverride?: number;
  runnerPermanentMeatDamagePrevention?: boolean;
  eventModificationHarness?: EventModificationTestHarness;
  runnerCostPenaltySupportWindow?: {
    windowId: string;
    originalActionId: string;
    amountDue: number;
    kind: "cost" | "penalty";
    createdAtStateVersion: number;
    runnerCreditTarget?: number;
    paymentContext?:
      | "runner_pool"
      | "runner_install"
      | "runner_program_install"
      | "runner_run"
      | "runner_run_start"
      | "runner_access_trash"
      | "runner_trace_bid"
      | "runner_activated_ability";
  };
  specialZoneHarness?: SpecialZoneTestHarness;
  deckMetadata?: {
    runner: DeckPublicMetadata;
    corp: DeckPublicMetadata;
  };
  run?: RunState;
  trace?: TraceState;
  temporaryIceStrengthModifiersUntilEndOfTurn?: Array<{
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    targetIceId: CardInstanceId;
    amount: number;
    turnSerial: number;
    expires: "turn_end";
  }>;
  temporaryBreakerStrengthModifiersUntilEndOfTurn?: Array<{
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    targetBreakerId: CardInstanceId;
    amount: number;
    turnSerial: number;
    expires: "turn_end";
  }>;
  temporaryRunnerMemoryLimitModifiersUntilEndOfTurn?: Array<{
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    amount: number;
    turnSerial: number;
    expires: "turn_end";
  }>;
  secretSpendComparison?: {
    source: "secret_spend_compare";
    runId: string;
    sourceIceId: CardInstanceId;
    subroutineIndex: number;
    corpSpend?: number;
  };
  secretSpendGuessRunSecret?: {
    sourceCardId: CardInstanceId;
    hiddenAmount: number;
  };
  delayedAccessEffects?: Array<{
    kind: "delayed_agenda_access_replacement";
    agendaId: CardInstanceId;
    serverId: Exclude<ServerId, "new_remote">;
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    resolveAt: "runner_start_turn";
  }>;
  runnerDelayedEffectInstances?: RunnerDelayedEffectInstance[];
  activeObligationDebtCount?: number;
  corpTemporaryInstallRezCredits?: {
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    remaining: number;
    usableFor: "corp_install_or_rez";
    returnUnusedAtTurnEnd: true;
  };
  exposePreventionWindow?: {
    targetCardId: CardInstanceId;
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    scope: "inside_data_fort" | "any_installed";
    createdAtStateVersion: number;
  };
  corpBonusAgendaPoints?: number;
  identityAbilityUsage?: Partial<
    Record<
      Side,
      { setupAbilities: string[]; turn: number; usedThisTurn: string[] }
    >
  >;
  runnerTurnFlags?: {
    stoleAgendaThisTurn: boolean;
    stoleAgendaLastTurn: boolean;
    stolenAgendaIdsThisTurn?: CardInstanceId[];
    stolenAgendaAdvancementCountersThisTurn?: number;
    stolenAgendaAdvancementCountersLastTurn?: number;
    runnerReceivedTagThisTurn?: boolean;
    stoleResearchAgendaThisTurn?: boolean;
    stoleGrayOpsAgendaThisTurn?: boolean;
    stoleBlackOpsAgendaThisTurn?: boolean;
    runAttemptsThisTurn?: number;
    runAttemptsLastTurn?: number;
    runAttemptsThisGame?: number;
    trashedNodeThisTurn?: boolean;
    trashedNodeLastTurn?: boolean;
    trashedAdvertisementThisTurn?: boolean;
    trashedTransactionsThisTurn?: boolean;
    pendingSequences?: MultiServerSuccessSequenceState[];
    installedResourceIdsThisTurn?: CardInstanceId[];
    installedResourceIdsLastTurn?: CardInstanceId[];
    successfulHqRunThisTurn?: boolean;
    successfulRdRunThisTurn?: boolean;
    successfulRunThisTurn?: boolean;
    lastSuccessfulRunServerId?: Exclude<ServerId, "new_remote">;
    blackOpsLiberatedOrTrashedDuringSuccessfulHqOrRdRunThisTurn?: boolean;
    damagePreventionUsage?: Record<CardInstanceId, number>;
    /** Continuous across turns; each spent runner action advances the ordinal. */
    runnerActionOrdinal?: number;
    /** Present only while the root runner action is being initiated. */
    currentRunnerActionOrdinal?: number;
    lastDamageRunnerActionOrdinal?: number;
    abilityUsedSourceIdsByLimitKey?: Record<string, CardInstanceId[]>;
    restrictedActionGrants?: RestrictedActionGrantBucket;
    startOfTurnFloatingCreditsApplied?: boolean;
    incubatorPendingTransforms?: number;
    bonusRunPending?: boolean;
    forgoNextActionPending?: boolean;
    forgoNextActionsPending?: number;
    runLockActionsPending?: number;
    runnerRunLockCreditCost?: number;
    valuPakProgramInstallActionsRemaining?: number;
    valuPakTemporaryProgramInstallCredits?: number;
    delayedInstallStartTurnResolvedSourceIds?: CardInstanceId[];
    runnerStartOfTurnResolvedSourceIds?: CardInstanceId[];
    successfulRunExtraRunPending?: boolean;
    successfulRunExtraRunUsedThisTurn?: boolean;
    delayedEndTurnEffects?: Array<{
      sourceCardInstanceId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      abilityKey: string;
      kind: "damage";
      damageType: DamageType;
      amount: number;
      preventable: boolean;
    }>;
    delayedCorpInstalledCardTrashAtTurnEndIds?: CardInstanceId[];
    persistentModifiers?: Array<{
      sourceCardInstanceId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      kind: "runner_extra_actions_per_turn";
      amount: number;
    }>;
    corpRezzedIceThisTurn?: number;
    lastRezzedBlackIceThisTurn?: {
      cardId: CardInstanceId;
      definitionId: CardDefinitionId;
      serverId: Exclude<ServerId, "new_remote">;
    };
    runOnlyActionUsedSourceIdsThisTurn?: CardInstanceId[];
  };
  corpTurnFlags?: {
    scoredBlackOpsAgendaThisTurn: boolean;
    scoredBlackOpsAgendaLastTurn: boolean;
    restrictedActionGrants?: RestrictedActionGrantBucket;
    edgerunnerTempsInstallActionsRemaining?: number;
    counterPreventionUsedSourceIdsThisTurn?: CardInstanceId[];
    scoredAgendaStartDrawChoiceResolvedSourceIds?: CardInstanceId[];
    scoredAgendaStartDrawChoiceSelectedSourceIds?: CardInstanceId[];
    corpStartOfTurnResolvedSourceIds?: CardInstanceId[];
    pdcaUsedSourceIdsThisTurn?: CardInstanceId[];
    fortActivityServerIdsSinceCorpTurnStart?: Array<
      Exclude<ServerId, "new_remote">
    >;
  };
  ambushHarness?: {
    enabled: boolean;
    triggerDefinitionId?: CardDefinitionId;
  };
  poxCountersByServer?: Partial<
    Record<Exclude<ServerId, "new_remote">, number>
  >;
  serverAgendaCostCountersByServer?: Partial<
    Record<Exclude<ServerId, "new_remote">, number>
  >;
  spyCountersByServer?: Partial<
    Record<Exclude<ServerId, "new_remote">, number>
  >;
  purgeableRunnerVirusCounters?: PurgeableRunnerVirusCounterState;
  corpRunnerVirusCounterPreventionCharges?: number;
  corpActionDebt?: CorpActionDebtState;
  actionEconomy?: ActionEconomyState;
  runnerVirusPurgeWindow?: RunnerVirusPurgeWindowState;
  runnerAgendaPointsToForfeit?: number;
  cancelledDamagePreventionSourceIdsUntilEndOfTurn?: CardInstanceId[];
};

export type Cost = {
  clicks?: number;
  credits?: number;
};

export type TargetRequirement = {
  id: string;
  kind: "card" | "server" | "subroutine" | "side";
  zoneScope?: string[];
  side?: Side;
  visibility?: "known_to_actor" | "public" | "engine_only";
  allowedServers?: ServerId[];
  sourceIceRef?: CardInstanceId;
  allowedSides?: Side[];
};

export type LegalAction = {
  actionId: string;
  side: Side;
  type: ActionType;
  label: string;
  source: CardInstanceId | "basic_action" | "game_rule";
  timingPoint: TimingPointId;
  costs: Cost[];
  targetRequirements: TargetRequirement[];
  choiceRequirements?: ChoiceRequirement[];
  abilityRef?: AbilityRef;
  effectRef?: string;
  resolvedEffects?: ResolvedGameEffect[];
  visibility: "public" | "private_to_actor";
  expiresAtStateVersion: number;
  payload?: LegalActionPayload;
};

export const CORP_FORT_RUN_REZ_SUPPORT_QUOTE_SCHEMA_VERSION =
  "corp-fort-run-rez-support-quote-v1" as const;
export const CORP_FORT_RUN_REZ_SUPPORT_KIND =
  "install_hq_ice_innermost_after_successful_run" as const;
export const CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND =
  "temporary_hq_ice_encounter_after_successful_run" as const;

/**
 * Engine-certified, actor-private support quote for rezzing a source with the
 * matching CardImplementation fort-run mechanic in the exact final run window
 * where its successful-run ICE install can matter. Hidden HQ card identities
 * are intentionally not part of this contract.
 */
export type CorpFortRunRezSupportQuote = {
  schemaVersion: typeof CORP_FORT_RUN_REZ_SUPPORT_QUOTE_SCHEMA_VERSION;
  fortRunKind:
    | typeof CORP_FORT_RUN_REZ_SUPPORT_KIND
    | typeof CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND;
  complete: true;
  sourceCardInstanceId: CardInstanceId;
  targetServerId: Exclude<ServerId, "new_remote">;
  stateVersion: number;
  actionId: string;
  rezCredits: number;
  /** Minimum actor-private HQ follow-up payment among the currently eligible ICE. */
  followupCredits: number;
  /** Existing-ICE install payment; zero for a temporary encounter. */
  installCredits: number;
  totalCredits: number;
  totalCreditsPayable: boolean;
  hasOwnHqIce: boolean;
};

export const CORP_ROOT_REZ_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION =
  "corp-root-rez-credit-outcome-quote-v1" as const;

/**
 * Engine-certified actor quote for the immediate liquid-credit outcome of one
 * exact Corp root-rez LegalAction. `runner_interruptible` means the Engine has
 * found a current Runner rez interrupt that resolves before the quoted credit
 * effect, so consumers must not treat the gain as guaranteed.
 */
export type CorpRootRezCreditOutcomeQuote = {
  schemaVersion: typeof CORP_ROOT_REZ_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION;
  complete: true;
  sourceCardInstanceId: CardInstanceId;
  targetServerId: Exclude<ServerId, "new_remote">;
  stateVersion: number;
  timingPoint: TimingPointId;
  actionId: string;
  resolution: "guaranteed" | "runner_interruptible";
  grossCreditGain: number;
  rezCredits: number;
  netCreditGain: number;
};

export const RUNNER_DRAW_PROJECTION_SCHEMA_VERSION =
  "runner-draw-projection-v1" as const;

/**
 * Actor-private planning projection for one currently legal basic Runner draw.
 * It separates gross draws from the post-draw disposition so consumers do not
 * mistake Crash Everett's extra card visibility for net hand growth.
 */
export type RunnerDrawProjection = {
  schemaVersion: typeof RUNNER_DRAW_PROJECTION_SCHEMA_VERSION;
  projectedGrossDrawCount: number;
  projectedPostDrawDispositionCount: number;
  projectedNetHandDelta: number;
  visibleDrawTaxSourceCount: number;
};

export type LegalActionPayload = Record<string, string | number | boolean> &
  AbilityPayloadDiscriminators & {
    abilityFamily?: PublicAbilityFamily;
    abilityId?: string;
    effectKind?: string;
    /**
     * Engine-certified current quote for a lifecycle action that makes its
     * source leave play and then requires a payment or loses the game.
     */
    cardImplementationLifecycleLeavePlayPaymentAmount?: number;
    cardImplementationLifecycleLeavePlayPaymentStatus?: "payable" | "unpayable";
    /**
     * Engine-certified number of times the currently quoted hosted-credit
     * cash-out payout can still resolve unchanged from the visible source pool
     * this turn. Other click, credit and timing costs remain separate
     * LegalAction facts.
     */
    cardImplementationHostedCreditCashOutMaxUses?: number;
    runnerDrawProjectionSchemaVersion?: typeof RUNNER_DRAW_PROJECTION_SCHEMA_VERSION;
    projectedGrossDrawCount?: number;
    projectedPostDrawDispositionCount?: number;
    projectedNetHandDelta?: number;
    visibleDrawTaxSourceCount?: number;
  };

export type PlayerAction = {
  matchId: string;
  side: Side;
  actionId: string;
  clientKnownStateVersion: number;
  selectedTargets?: Record<string, string>;
  selectedChoices?: Record<string, unknown>;
  idempotencyKey?: string;
};

export const ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION =
  "engine-randomized-ice-install-selection-v1" as const;
export const ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION =
  "engine-randomized-turn-plan-selection-v1" as const;
export const ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION =
  "engine-randomized-trace-bid-selection-v1" as const;

export type TraceBidStakes = "low" | "normal" | "high" | "terminal";
export type TraceBidBehavioralBias =
  | "conservative"
  | "normal"
  | "aggressive"
  | "polarized";

export type EngineRandomizedTraceBidCandidate = {
  optionId: string;
  bid: number;
  weight: number;
  utility: number;
};

export type EngineRandomizedTraceBidAssessment = {
  traceId: string;
  traceRulesProfile: TraceRulesProfile;
  printedTrace: number;
  effectiveTraceLimit: number;
  currentLink: number;
  visibleOpponentBidCapacity: number;
  rationalTarget: number;
  rationalRange: [number, number];
  stakes: TraceBidStakes;
  behavioralBias: TraceBidBehavioralBias;
  reserveTarget: number;
  outcomeValue: number;
};

export type EngineRandomizedTraceBidSelectionRequest = {
  schemaVersion: typeof ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION;
  matchId: string;
  side: Side;
  stateVersion: number;
  timingPoint: TimingPointId;
  actionId: string;
  choiceId: string;
  planStepId: string;
  assessment: EngineRandomizedTraceBidAssessment;
  candidates: EngineRandomizedTraceBidCandidate[];
};

export type EngineRandomizedTraceBidSelectionQuote =
  EngineRandomizedTraceBidSelectionRequest & {
    visibility: "private_to_actor";
    complete: true;
    candidateFingerprint: string;
    legalAction: LegalAction;
  };

export type EngineRandomizedTraceBidSelectionQuoteResult =
  | { ok: true; quote: EngineRandomizedTraceBidSelectionQuote }
  | { ok: false; error: EngineError };

export type EngineRandomizedTraceBidSelectionCommand = {
  kind: "engine_randomized_trace_bid_selection";
  quote: EngineRandomizedTraceBidSelectionQuote;
  idempotencyKey?: string;
};

export type EngineRandomizedTurnPlanCandidate = {
  familyKey: string;
  lineId: string;
  actionId: string;
  weight: number;
};

export type EngineRandomizedTurnPlanSelectionRequest = {
  schemaVersion: typeof ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION;
  matchId: string;
  side: Side;
  stateVersion: number;
  timingPoint: TimingPointId;
  opportunityKey: string;
  candidates: EngineRandomizedTurnPlanCandidate[];
};

export type EngineRandomizedTurnPlanSelectionQuote = {
  schemaVersion: typeof ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION;
  visibility: "private_to_actor";
  complete: true;
  matchId: string;
  side: Side;
  stateVersion: number;
  timingPoint: TimingPointId;
  opportunityKey: string;
  candidates: EngineRandomizedTurnPlanCandidate[];
  candidateFingerprint: string;
  legalActions: LegalAction[];
};

export type EngineRandomizedTurnPlanSelectionQuoteResult =
  | { ok: true; quote: EngineRandomizedTurnPlanSelectionQuote }
  | { ok: false; error: EngineError };

export type EngineRandomizedTurnPlanSelectionCommand = {
  kind: "engine_randomized_turn_plan_selection";
  quote: EngineRandomizedTurnPlanSelectionQuote;
  idempotencyKey?: string;
};

export type EngineRandomizedIceInstallCandidate = {
  actionId: string;
  targetServerId: ServerId;
};

/**
 * Actor-private request for an Engine-certified choice among ICE installs that
 * the caller has already rated as a genuine near tie. Candidate order carries
 * no meaning; the Engine canonicalizes it before quoting.
 */
export type EngineRandomizedIceInstallSelectionRequest = {
  schemaVersion: typeof ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION;
  matchId: string;
  side: "corp";
  stateVersion: number;
  timingPoint: TimingPointId;
  planStepId: string;
  candidates: EngineRandomizedIceInstallCandidate[];
};

/**
 * Actor-private and state-bound. `candidateFingerprint` is a collision-free,
 * versioned canonical serialization rather than a lossy hash.
 */
export type EngineRandomizedIceInstallSelectionQuote = {
  schemaVersion: typeof ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION;
  visibility: "private_to_actor";
  complete: true;
  matchId: string;
  side: "corp";
  stateVersion: number;
  timingPoint: TimingPointId;
  planStepId: string;
  candidates: EngineRandomizedIceInstallCandidate[];
  candidateFingerprint: string;
  legalActions: LegalAction[];
};

export type EngineRandomizedIceInstallSelectionQuoteResult =
  | {
      ok: true;
      quote: EngineRandomizedIceInstallSelectionQuote;
    }
  | {
      ok: false;
      error: EngineError;
    };

/**
 * Replayable command. Applying it must re-quote every candidate before the
 * Engine consumes randomness.
 */
export type EngineRandomizedIceInstallSelectionCommand = {
  kind: "engine_randomized_ice_install_selection";
  quote: EngineRandomizedIceInstallSelectionQuote;
  idempotencyKey?: string;
};

export type ReplayableEngineAction =
  | PlayerAction
  | EngineRandomizedIceInstallSelectionCommand
  | EngineRandomizedTurnPlanSelectionCommand
  | EngineRandomizedTraceBidSelectionCommand;

export type AiTurnPlanRandomDrawRecord = RandomDrawRecord & {
  domain: "ai_turn_plan_selection";
};

export type EngineRandomizedTurnPlanSelectionReceipt = {
  schemaVersion: typeof ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION;
  visibility: "private_to_actor";
  matchId: string;
  side: Side;
  stateVersionBefore: number;
  stateVersionAfter: number;
  timingPoint: TimingPointId;
  opportunityKey: string;
  candidateFingerprint: string;
  selectedCandidate: EngineRandomizedTurnPlanCandidate;
  selectedLegalAction: LegalAction;
  randomDraw: AiTurnPlanRandomDrawRecord;
};

export type EngineRandomizedIceInstallSelectionReceipt = {
  schemaVersion: typeof ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION;
  visibility: "private_to_actor";
  matchId: string;
  side: "corp";
  stateVersionBefore: number;
  stateVersionAfter: number;
  timingPoint: TimingPointId;
  planStepId: string;
  candidateFingerprint: string;
  selectedCandidate: EngineRandomizedIceInstallCandidate;
  selectedLegalAction: LegalAction;
  randomDraw: RandomDrawRecord;
};

export type EngineRandomizedTraceBidSelectionReceipt = {
  schemaVersion: typeof ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION;
  visibility: "private_to_actor";
  matchId: string;
  side: Side;
  stateVersionBefore: number;
  stateVersionAfter: number;
  timingPoint: TimingPointId;
  actionId: string;
  choiceId: string;
  planStepId: string;
  assessment: EngineRandomizedTraceBidAssessment;
  candidateFingerprint: string;
  selectedCandidate: EngineRandomizedTraceBidCandidate;
  selectedLegalAction: LegalAction;
  randomDraw: RandomDrawRecord;
};

export type EngineError = {
  code:
    | "ERR_STALE_STATE"
    | "ERR_WRONG_SIDE"
    | "ERR_UNKNOWN_ACTION"
    | "ERR_INVALID_TARGET"
    | "ERR_CANNOT_PAY_COST"
    | "ERR_INVALID_CHOICE"
    | "ERR_INVARIANT_FAILED";
  message: string;
};

export type EngineResult =
  | {
      ok: true;
      state: GameState;
      event: GameEvent;
      publicEvents: PublicGameEvent[];
      stateHash: StateHash;
    }
  | {
      ok: false;
      error: EngineError;
      state: GameState;
    };

export type EngineRandomizedIceInstallSelectionResult =
  | (Extract<EngineResult, { ok: true }> & {
      receipt: EngineRandomizedIceInstallSelectionReceipt;
    })
  | Extract<EngineResult, { ok: false }>;

export type EngineRandomizedTurnPlanSelectionResult =
  | (Extract<EngineResult, { ok: true }> & {
      receipt: EngineRandomizedTurnPlanSelectionReceipt;
    })
  | Extract<EngineResult, { ok: false }>;

export type EngineRandomizedTraceBidSelectionResult =
  | (Extract<EngineResult, { ok: true }> & {
      receipt: EngineRandomizedTraceBidSelectionReceipt;
    })
  | Extract<EngineResult, { ok: false }>;

export type ApplyActionOptions = {
  publicEventsMode?: "history" | "latest";
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export type ReplayResult = {
  ok: boolean;
  state: GameState;
  expectedFinalStateHash?: StateHash;
  actualFinalStateHash: StateHash;
  errors: string[];
};

export type CounterDisplayKind =
  | "advancement"
  | "stored_credits"
  | "recurring_credit"
  | "virus"
  | "trace"
  | "shell"
  | "damage_prevention"
  | "bad_publicity"
  | "restricted_pool"
  | "generic_counter";

export type CounterUsageHint =
  | "spendable"
  | "refreshing"
  | "score_modifier"
  | "status_marker";

export type CounterCreditUse =
  | "using_icebreaker_during_run"
  | "using_icebreaker_during_run_non_noisy"
  | "using_killer_during_run"
  | "increase_link"
  | "trash_nodes"
  | "trash_upgrades"
  | "install_programs"
  | "remove_tags"
  | "play_events";

export type CounterCreditPoolKind =
  | "stored_credit"
  | "restricted_credit"
  | "recurring_credit";

export type CounterCreditRefreshTiming = "start_of_runner_turn";

export type CounterCreditRefreshBehavior = "refill_to_capacity_if_used";

export type CounterCreditPool = {
  kind: CounterCreditPoolKind;
  capacity?: number;
  uses?: readonly CounterCreditUse[];
  requireHostedBreakerForIcebreakerUse?: true;
  refresh?: {
    timing: CounterCreditRefreshTiming;
    behavior: CounterCreditRefreshBehavior;
  };
};

export type CounterDisplay = {
  id: string;
  amount: number;
  displayKind: CounterDisplayKind;
  label: string;
  ariaLabel: string;
  counterType?: CounterType;
  usageHint?: CounterUsageHint;
  creditPool?: CounterCreditPool;
};

export type VisibleServerRunProhibitedStatus = {
  id: string;
  kind: "run_prohibited";
  scope: "target_server";
  reason: "required_corp_activity_during_latest_corp_turn_missing";
  targetServerId: Exclude<ServerId, "new_remote">;
  sourceCardInstanceId: CardInstanceId;
  sourceAbilityId: string;
  sourceTitle: string;
  sourceSide: "corp";
};

export type VisibleServerCostModifierStatus = {
  id: string;
  kind: "cost_modifier";
  scope: "target_server";
  costKind: "corp_ice_install";
  operation: "increase" | "reduce";
  amount: number;
  targetServerId: Exclude<ServerId, "new_remote">;
  sourceCardInstanceId: CardInstanceId;
  sourceTitle: string;
  sourceSide: Side;
};

export type VisibleServerRunPaymentRestrictionStatus = {
  id: string;
  kind: "run_payment_restriction";
  scope: "target_server";
  restriction: "runner_stealth_bit_payment_sources";
  targetServerId: Exclude<ServerId, "new_remote">;
  sourceCardInstanceId: CardInstanceId;
  sourceTitle: string;
  sourceSide: "corp";
};

/** Public, server-scoped permission for a Corp to rez an unrezzed ICE during a run. */
export type VisibleServerDuringRunIceRezSupportStatus = {
  id: string;
  kind: "during_run_ice_rez_support";
  scope: "target_server";
  costModel: "half_rez_cost_rounded_down";
  target: "unrezzed_ice_on_this_fort";
  limit: "once_per_run_per_source";
  targetServerId: Exclude<ServerId, "new_remote">;
  sourceCardInstanceId: CardInstanceId;
  sourceTitle: string;
  sourceSide: "corp";
};

export type VisibleServerStatus =
  | VisibleServerRunProhibitedStatus
  | VisibleServerCostModifierStatus
  | VisibleServerRunPaymentRestrictionStatus
  | VisibleServerDuringRunIceRezSupportStatus;

export type VisibleEffectiveSubroutine = {
  id: string;
  type: SubroutineType;
  amount?: number;
  /** Public damage type for an effective visible damage subroutine. */
  damageType?: DamageType;
  traceLimit?: number;
  runFutureStrengthCancelPaymentAmount?: number;
  traceSuccessEffect?: TraceSuccessEffect;
  deflectorTarget?: "archives" | "any_data_fort" | "subsidiary_data_fort";
  deflectorCost?: number;
  deflectorAutoBreakIfNoTarget?: boolean;
  breakTags?: string[];
  sourceDefinitionId?: CardDefinitionId;
  sourceTitle?: string;
  dynamicSourceKind?:
    | "additional_subroutine"
    | "run_duration_additional_subroutine";
  unbrokenRunEffect?: {
    addsFutureEndTheRunSubroutines?: number;
    increasesFutureBreakCostPerSubroutine?: number;
    increasesFutureIceStrength?: number;
    preventsFutureBreaking?: boolean;
    addsFutureEncounterCost?: number;
    preventsJackOut?: boolean;
    causesDamageOrProgramTrash?: boolean;
    createsRunLockOrActionTax?: number;
  };
};

export type VisibleConditionalEncounterEffect =
  | {
      kind: "corp_paid_add_end_the_run_subroutine";
      creditCost: number;
    }
  | {
      kind: "random_strength_or_derez_auto_pass";
      dieFaces: 6;
      autoPassResult: 6;
      maxStrengthBonus: number;
    };

export type VisibleEffectiveIceRunQuote = {
  iceInstanceId: CardInstanceId;
  iceDefinitionId: CardDefinitionId;
  effectiveStrength: number;
  subroutines: VisibleEffectiveSubroutine[];
  breakSubroutineAdditionalCostPerSubroutine?: number;
  breakSubroutineCostSourceDefinitionIds?: CardDefinitionId[];
  breakSubroutineCostSourceTitles?: string[];
  encounterTemporaryTraceCredits?: number;
  conditionalEncounterEffects?: VisibleConditionalEncounterEffect[];
};

/**
 * Corp-private, Engine-certified run projection for one currently unrezzed,
 * installed ICE after a fixed rez in the current board state.
 *
 * Incomplete quotes intentionally expose no projected run effect. Consumers
 * must not reconstruct it from printed definitions, card text, or AI hints.
 */
export type VisibleCorpIcePostRezRunQuote =
  | {
      context: "installed_post_rez";
      cardId: CardInstanceId;
      iceDefinitionId: CardDefinitionId;
      targetServerId: Exclude<ServerId, "new_remote">;
      projectedServerId: Exclude<ServerId, "new_remote">;
      expiresAtStateVersion: number;
      complete: false;
      reason:
        | "variable_rez_choice_required"
        | "on_rez_lifecycle_projection_required"
        | "active_run_context"
        | "effective_run_projection_unavailable";
    }
  | {
      context: "installed_post_rez";
      cardId: CardInstanceId;
      iceDefinitionId: CardDefinitionId;
      targetServerId: Exclude<ServerId, "new_remote">;
      projectedServerId: Exclude<ServerId, "new_remote">;
      expiresAtStateVersion: number;
      complete: true;
      effectiveRunQuote: VisibleEffectiveIceRunQuote;
    };

export type VisibleMandatoryCorpRezCosts = {
  agendaPoints: number;
};

/**
 * Engine-certified effective rez-cost projection.
 *
 * Incomplete projections intentionally carry only their identity, server and
 * state-version binding. Consumers must not reconstruct missing costs from
 * printed card data.
 */
export type VisibleInstalledCorpRezCostQuoteBinding = {
  context: "installed";
  cardId: CardInstanceId;
  targetServerId: Exclude<ServerId, "new_remote">;
  projectedServerId: Exclude<ServerId, "new_remote">;
  expiresAtStateVersion: number;
};

export type VisiblePostInstallCorpRezCostQuoteBinding = {
  context: "post_install";
  cardId: CardInstanceId;
  targetServerId: ServerId;
  expiresAtStateVersion: number;
};

type VisibleCompleteCorpRezCostQuoteFields = {
  complete: true;
  projectedServerId: Exclude<ServerId, "new_remote">;
  /**
   * Printed/base credit component before public Engine modifiers.
   *
   * Consumers must still use `finalCredits` as the exact payment base. This
   * field exists to make every applied modifier auditable, not as a fallback.
   */
  baseCredits: number;
  /**
   * Exact credit payment after public Engine modifiers and before a certified
   * variable-rez parameter adds its own credits.
   */
  finalCredits: number;
  mandatoryAdditionalCosts: VisibleMandatoryCorpRezCosts;
  reductionSourceDefinitionIds?: CardDefinitionId[];
  increaseSourceDefinitionIds?: CardDefinitionId[];
};

export type VisibleVariableCorpRezCostParameter =
  | {
      kind: "x_strength";
      additionalCreditsPerValue: number;
      minValue: number;
      maxValue: number;
      minValueFinalCredits: number;
      maxValueFinalCredits: number;
      effectiveStrengthFromValue: true;
      traceLimitFromValue?: true;
    }
  | {
      kind: "paid_end_the_run_subroutines";
      additionalCreditsPerSubroutine: number;
      minSubroutines: number;
      minSubroutinesFinalCredits: number;
      firstEndTheRunSubroutineCount: number;
      firstEndTheRunFinalCredits: number;
    }
  | {
      kind: "alternate_subtype";
      baseSubtypes: string[];
      baseSubtypesFinalCredits: number;
      alternateSubtypes: string[];
      alternateSubtypesAdditionalCredits: number;
      alternateSubtypesFinalCredits: number;
    };

type VisibleFixedCorpRezCostQuoteFields =
  VisibleCompleteCorpRezCostQuoteFields & {
    costKind: "fixed";
    variableParameter?: never;
  };

type VisibleVariableCorpRezCostQuoteFields =
  VisibleCompleteCorpRezCostQuoteFields & {
    costKind: "variable";
    variableParameter: VisibleVariableCorpRezCostParameter;
  };

export type VisibleCorpRezCostQuote =
  | (VisibleInstalledCorpRezCostQuoteBinding & {
      complete: false;
    })
  | (VisibleInstalledCorpRezCostQuoteBinding &
      (
        | VisibleFixedCorpRezCostQuoteFields
        | VisibleVariableCorpRezCostQuoteFields
      ))
  | (VisiblePostInstallCorpRezCostQuoteBinding & {
      complete: false;
    })
  | (VisiblePostInstallCorpRezCostQuoteBinding &
      (
        | VisibleFixedCorpRezCostQuoteFields
        | VisibleVariableCorpRezCostQuoteFields
      ));

/**
 * Engine-certified current-run resource exchange for a legal Corp ICE rez.
 *
 * The quote deliberately stays side-safe: it may only describe an installed
 * Runner card that is already visible to the Corp. An incomplete quote carries
 * no inferred cost or effect, so consumers cannot fall back to printed card
 * data or card hints.
 */
export type VisibleCorpIceRezResourceExchangeQuote =
  | {
      context: "installed";
      cardId: CardInstanceId;
      targetServerId: Exclude<ServerId, "new_remote">;
      projectedServerId: Exclude<ServerId, "new_remote">;
      expiresAtStateVersion: number;
      complete: false;
      reason:
        | "not_current_approached_ice"
        | "effective_run_projection_unavailable"
        | "no_hard_end_the_run_subroutine"
        | "unsupported_encounter_cost_projection"
        | "visible_runner_break_projection_unknown";
    }
  | {
      context: "installed";
      cardId: CardInstanceId;
      targetServerId: Exclude<ServerId, "new_remote">;
      projectedServerId: Exclude<ServerId, "new_remote">;
      expiresAtStateVersion: number;
      complete: true;
      hardEndTheRunSubroutineCount: number;
      runnerBreak: {
        breakerCardId: CardInstanceId;
        breakerDefinitionId: CardDefinitionId;
        requiredCredits: number;
        pumpCredits: number;
        breakCredits: number;
        breakUses: number;
        /** Unrestricted credits required after current run-only pools apply. */
        normalCreditsRequired: number;
        /** Current run-only or restricted credits applied before that amount. */
        nonNormalRunCreditsApplied: number;
        canPayFromCurrentCredits: boolean;
        paymentEvidenceSource: "engine_icebreaker_ability";
        consumedCards: Array<{
          cardId: CardInstanceId;
          definitionId: CardDefinitionId;
          kind: "trash_at_run_end_after_break";
          evidenceSource: "engine_icebreaker_ability";
        }>;
        randomConsequences?: Array<{
          cardId: CardInstanceId;
          definitionId: CardDefinitionId;
          kind: "post_encounter_self_trash_check";
          numerator: number;
          denominator: number;
          evidenceSource: "engine_icebreaker_ability";
        }>;
      };
      runnerBreakUnavailable?: never;
    }
  | {
      context: "installed";
      cardId: CardInstanceId;
      targetServerId: Exclude<ServerId, "new_remote">;
      projectedServerId: Exclude<ServerId, "new_remote">;
      expiresAtStateVersion: number;
      complete: true;
      hardEndTheRunSubroutineCount: number;
      runnerBreak?: never;
      runnerBreakUnavailable: {
        reason: "no_visible_eligible_breaker";
        evidenceSource: "engine_icebreaker_ability";
      };
    };

export type VisibleCorpIceRezActionResourceExchangeQuote = {
  actionId: string;
  quote: VisibleCorpIceRezResourceExchangeQuote;
};

/**
 * Corp-private, Engine-certified continuation budget for one installed agenda.
 *
 * The quote deliberately exposes only guaranteed unrestricted Corp clicks for
 * the next Corp turn. Optional or restricted action grants are not converted
 * into credit capacity. This lets the score plan publish a conservative cash
 * reserve without teaching a downstream defense plan to interpret card text.
 */
export type VisibleCorpScoreContinuationQuote =
  | {
      context: "installed_agenda";
      agendaCardId: CardInstanceId;
      serverId: Exclude<ServerId, "new_remote">;
      expiresAtStateVersion: number;
      complete: false;
      reason:
        | "not_agenda"
        | "not_installed_root"
        | "not_completable_next_corp_turn";
    }
  | {
      context: "installed_agenda";
      agendaCardId: CardInstanceId;
      serverId: Exclude<ServerId, "new_remote">;
      expiresAtStateVersion: number;
      complete: true;
      remainingAdvancementCounters: number;
      advancementCreditCostPerCounter: 1;
      advancementClickCostPerCounter: 1;
      scoreActionCreditCost: 0;
      scoreActionClickCost: 0;
      nextCorpTurnGuaranteedFlexibleClicks: number;
      freeCreditClicksAfterAdvancement: number;
      certifiedCreditGainFromFreeClicks: number;
      creditsRequiredBeforeNextCorpTurn: number;
      terminalScore: boolean;
    };

export const CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION =
  "corp-agenda-install-score-horizon-quote-v1" as const;

/**
 * Actor-private, Engine-certified click horizon attached to one exact agenda
 * install LegalAction. The score plan may use this only to decide whether the
 * exposed agenda can be completed no later than the next Corp turn; it still
 * owns protection and credit reserves separately.
 */
export type CorpAgendaInstallScoreHorizonPayload =
  | {
      agendaInstallScoreHorizonQuoteSchemaVersion: typeof CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION;
      agendaInstallScoreHorizonQuoteComplete: false;
      agendaInstallScoreHorizonQuoteReason: "not_completable_by_next_corp_turn";
      agendaInstallScoreHorizonQuoteCardId: CardInstanceId;
      agendaInstallScoreHorizonQuoteTargetServerId: ServerId;
      agendaInstallScoreHorizonQuoteExpiresAtStateVersion: number;
      agendaInstallScoreHorizonQuoteAdvancementRequirement: number;
      agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances: number;
      agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn: number;
      agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks: number;
    }
  | {
      agendaInstallScoreHorizonQuoteSchemaVersion: typeof CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION;
      agendaInstallScoreHorizonQuoteComplete: true;
      agendaInstallScoreHorizonQuoteCardId: CardInstanceId;
      agendaInstallScoreHorizonQuoteTargetServerId: ServerId;
      agendaInstallScoreHorizonQuoteExpiresAtStateVersion: number;
      agendaInstallScoreHorizonQuoteAdvancementRequirement: number;
      agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances: number;
      agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn: number;
      agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks: number;
    };

/**
 * Corp-private, Engine-certified capability evidence for a card that can bank
 * its own advancement counters, cash them out, and later move them to one
 * installed advanceable card. This quote describes no future LegalAction;
 * callers must still observe and select the current Engine action.
 */
export const CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION =
  "corp-counter-bank-preparation-quote-v1" as const;

export type VisibleCorpCounterBankPreparationQuote = {
  schemaVersion: typeof CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION;
  context: "corp_counter_bank_preparation";
  sourceCardId: CardInstanceId;
  expiresAtStateVersion: number;
  location:
    | { kind: "corp_hq" }
    | {
        kind: "installed_root";
        serverId: Exclude<ServerId, "new_remote">;
      };
  advancementCounters: number;
  advanceableBeforeRez: true;
  activatedAbilitiesRequireRez: true;
  cashout: {
    advancementCounterCost: 1;
    creditGain: 1;
    actionCost: 0;
  };
  transfer: {
    actionCost: 1;
    minimumSourceCounters: 1;
    source: "source_card";
    target: "chosen_installed_advanceable_card";
    maximum: "all";
  };
};

export type VisibleCardLifecycleMarker = {
  kind: "temporary_return_to_grip";
  label: string;
  detail: string;
};

export type VisibleRunStartRandomStrengthState =
  | { status: "unresolved" }
  | {
      status: "resolved";
      actualStrength: number;
      /** Visible strength changes applied after the random run-start base. */
      currentStrengthAdjustment: number;
    };

export type VisibleRunnerPaymentSupportAbility = {
  sourceAbilityId: string;
  capabilityKey: string;
  timing: "runner_cost_penalty_support";
  label: string;
  creditCost: number;
  gainCredits: number;
  trashesSource: boolean;
};

/**
 * Runner-private trace inputs derived by the Engine from the current game
 * state. `baseLink` already includes the Runner identity and static link
 * modifiers; an activated base-link option replaces only the installed
 * base-link contribution, exactly as the trace runtime does.
 */
export type VisibleRunnerTraceSupportQuote = {
  traceCreditPool: number;
  /** Exact Runner-private sources that make up `traceCreditPool`. */
  traceCreditSources: ReadonlyArray<{
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    amount: number;
    isStealth: boolean;
  }>;
  baseLinkOptions: ReadonlyArray<{
    baseLink: number;
    activationCost: number;
    rewardCreditsOnAvoidTrace?: number;
    safeForAccess: boolean;
    sourceDefinitionId?: CardDefinitionId;
    sourceTitle?: string;
    sideEffect?: "ends_run_after_encounter";
  }>;
  postBidLinkOptions: ReadonlyArray<{
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    sourceTitle: string;
    linkDelta: number;
    activationCost: number;
    tapSource: boolean;
    trashSource: boolean;
    safeForAccess: boolean;
    useLimit: { kind: "once_per_trace" } | { kind: "repeatable_while_legal" };
    rewardCreditsOnAvoidTrace?: number;
  }>;
  traceSuccessCancelOptions: ReadonlyArray<{
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    sourceTitle: string;
    activationCost: number;
    tapSource: boolean;
    trashSource: boolean;
  }>;
};

export const CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION =
  "corp-punish-route-quote-v2" as const;

export type CorpPunishRouteIncompleteReason =
  | "malformed_route_request"
  | "source_unavailable"
  | "source_zone_unsupported"
  | "source_identity_unknown"
  | "source_capability_missing"
  | "source_capability_unsupported"
  | "source_effects_unsupported"
  | "source_condition_unsatisfied"
  | "head_legal_action_unavailable"
  | "cost_quote_incomplete"
  | "target_quote_incomplete"
  | "response_window_unknown"
  | "trash_prevention_quote_incomplete"
  | "damage_prevention_quote_incomplete"
  | "future_state_transition_unavailable";

export type CorpPunishRouteStepKind =
  | "tag"
  | "trace_tag"
  | "meat_damage"
  | "net_damage"
  | "core_damage"
  | "hardware_trash"
  | "other_punish";

export type CorpPunishRouteStepRequest = {
  stepId: string;
  order: number;
  kind: CorpPunishRouteStepKind;
  sourceCardInstanceId: CardInstanceId;
  sourceCapabilityBindingKind: "card_spec_capability_key";
  sourceCapabilityId: string;
  /**
   * Exact current head action selected by the caller when multiple legal
   * variants exist. Omitted only when asking the Engine to certify a
   * funding-only minimum horizon or a uniquely identified fixed action.
   */
  currentLegalActionId?: string;
};

/**
 * Caller-selected, ordered route description. The caller owns campaign and
 * route identity; the Engine certifies only state-bound rules facts.
 */
export type CorpPunishRouteQuoteRequest = {
  schemaVersion: typeof CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION;
  matchId: string;
  side: "corp";
  stateVersion: number;
  timingPoint: TimingPointId;
  campaignId: string;
  routeId: string;
  steps: CorpPunishRouteStepRequest[];
};

/**
 * One exact Engine-known source capability in an ordered Corp punish route.
 *
 * Only the current head may carry `currentLegalAction`. Future steps remain
 * source/capability bindings until the Engine reaches and re-quotes them in
 * their actual state.
 */
export type CorpPunishRouteStepQuote = {
  stepId: string;
  order: number;
  kind: CorpPunishRouteStepKind;
  sourceCardInstanceId: CardInstanceId;
  sourceCardDefinitionId: CardDefinitionId;
  sourceCapabilityBindingKind: "card_spec_capability_key";
  sourceCapabilityId: string;
  clicks: number;
  credits: number;
  hardwareTrashProjection?: {
    kind: "installed_runner_hardware";
    targetKnowledge: "public_exact";
    eligibleTargetInstanceIds: CardInstanceId[];
    eligibleTargetCount: number;
    excludedSubtype: "cybernetics";
    costKind: "variable_x";
    minimumX: number;
    selectedX: number;
    legalMaximumX: number;
    creditsPerX: number;
    preventionKnowledge: "none_visible";
  };
  currentLegalAction?: LegalAction;
};

export type CorpPunishRouteTagTriggerQuote =
  | {
      kind: "existing_tag";
      status: "satisfied";
      currentRunnerTags: number;
      requiredRunnerTags: number;
    }
  | {
      kind: "direct_tag_step";
      status: "projected";
      currentRunnerTags: number;
      requiredRunnerTags: number;
      sourceStepId: string;
    }
  | {
      kind: "trace_tag_step";
      status: "response_required";
      currentRunnerTags: number;
      requiredRunnerTags: number;
      sourceStepId: string;
      traceLimit: number;
    }
  | {
      kind: "none";
      status: "not_required";
      currentRunnerTags: number;
      requiredRunnerTags: 0;
    }
  | {
      kind: "unknown";
      status: "unknown";
      currentRunnerTags: number;
      requiredRunnerTags: number;
    };

export type CorpPunishRouteResponsePaymentEnvelope = {
  responseKind: "none" | "runner_optional" | "trace_bid" | "mixed" | "unknown";
  paymentKnowledge: "exact_public" | "bounded_public" | "unknown";
  corpCreditsAvailable: number;
  runnerCreditsVisible: number;
  /** Credits spent while resolving responses after action costs are paid. */
  corpResponseCredits: {
    minimum: number;
    maximum: number;
  };
  /** Action credits plus Corp response credits. Fund conservatively to maximum. */
  totalCorpCredits: {
    minimum: number;
    maximum: number;
  };
  runnerResponseCredits: {
    minimum: number;
    maximum: number;
  };
};

export type CorpPunishRouteDamageEnvelope = {
  runnerHandCount: number;
  rawDamage: {
    meat: number;
    net: number;
    core: number;
    total: number;
  };
  effectiveDamage: {
    minimum: number;
    maximum: number;
  };
  visiblePrevention: {
    knowledge: "none_visible" | "exact_public" | "bounded_public" | "unknown";
    maximumPreventableDamage: number;
    creditCost: {
      minimum: number;
      maximum: number;
    };
  };
  visiblePiercing: {
    knowledge: "none_visible" | "exact_public" | "bounded_public" | "unknown";
    maximumBypassedDamage: number;
    creditCost: {
      minimum: number;
      maximum: number;
    };
  };
};

export type CorpPunishRouteNonDamageEnvelope = {
  runnerCreditLoss: {
    knowledge: "exact_public";
    minimum: number;
    maximum: number;
  };
};

export type CorpPunishRouteQuote = {
  schemaVersion: typeof CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION;
  visibility: "private_to_actor";
  matchId: string;
  side: "corp";
  routeId: string;
  /**
   * Stable caller-owned campaign binding echoed by the Engine. The Engine
   * certifies route facts but never invents strategic campaign identity.
   */
  campaignId: string;
  campaignIdOrigin: "request_binding";
  stateVersion: number;
  timingPoint: TimingPointId;
  requestFingerprint: string;
  requestEcho: CorpPunishRouteQuoteRequest;
  complete: boolean;
  incompleteReasons: CorpPunishRouteIncompleteReason[];
  steps: CorpPunishRouteStepQuote[];
  totalClicks: number;
  /** Fixed credits paid by the ordered LegalAction sequence itself. */
  totalActionCredits: number;
  tagTrigger: CorpPunishRouteTagTriggerQuote;
  responsePaymentEnvelope: CorpPunishRouteResponsePaymentEnvelope;
  damageEnvelope: CorpPunishRouteDamageEnvelope;
  /** Exact public payoff for supported punish effects that do not deal damage. */
  nonDamageEnvelope?: CorpPunishRouteNonDamageEnvelope;
  guarantee:
    | "guaranteed"
    | "conditional_on_runner_response"
    | "not_guaranteed"
    | "unknown";
  responseKnowledge: "public_exact" | "public_bounded" | "unknown";
};

export type CorpPunishRouteQuoteResult =
  | {
      ok: true;
      quote: CorpPunishRouteQuote;
    }
  | {
      ok: false;
      error: EngineError;
    };

/**
 * Corp-only, actor-private transport collection. Each route remains
 * independently complete or fail-closed; one unsupported route never masks or
 * invalidates a sibling route.
 */
export type CorpPunishRouteQuoteSet = {
  schemaVersion: typeof CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION;
  visibility: "private_to_actor";
  side: "corp";
  stateVersion: number;
  timingPoint: TimingPointId;
  complete: boolean;
  incompleteReasons: CorpPunishRouteIncompleteReason[];
  runnerHandCount: number;
  runnerTags: number;
  runnerCreditsVisible: number;
  routes: CorpPunishRouteQuote[];
};

export type VisibleAgendaStealCostQuote = {
  stateVersion: number;
  serverId: Exclude<ServerId, "new_remote">;
  agendaInstanceId: CardInstanceId;
  creditCost: number;
  complete: true;
};

export type VisibleCard = {
  instanceId: CardInstanceId;
  known: boolean;
  /** Stable owner-side shorthand for consumers that do not need controller. */
  side?: Side;
  title?: string;
  definitionId?: CardDefinitionId;
  type?: CardType;
  subtypes?: string[];
  alternateIceSubtypeActive?: boolean;
  rulesText?: string;
  cost?: number;
  playCost?: PlayCostDefinition;
  installCost?: number;
  memoryCost?: number;
  memoryLimitBonus?: number;
  maxHandSizeBonus?: number;
  rezCost?: number;
  baseLink?: number;
  rezzed?: boolean;
  advancementCounters?: number;
  advancementRequirement?: number;
  overadvanceThreshold?: number;
  overadvanceReward?:
    | "agenda_points"
    | "start_of_corp_turn_actions"
    | "start_of_corp_turn_credits";
  strength?: number;
  strengthModifier?: number;
  /** Explicit run-scoped state for breakers with a run-start random strength. */
  randomRunStrengthState?: VisibleRunStartRandomStrengthState;
  agendaPoints?: number;
  trashCost?: number;
  counters?: Partial<Record<CounterType, number>>;
  counterDisplays?: CounterDisplay[];
  tapped?: boolean;
  concealed?: boolean;
  hiddenRunnerResource?: boolean;
  hostedOn?: CardInstanceId;
  hostedOnLabel?: string;
  selectedServerId?: Exclude<ServerId, "new_remote">;
  selectedServerLabel?: string;
  selectedSubtype?: string;
  selectedSubtypeLabel?: string;
  /** Exact target is visible only to the card's controller. */
  selectedTargetCardId?: CardInstanceId;
  selectedTargetLabel?: string;
  /** Public location context for a selected installed ICE target. */
  selectedTargetServerLabel?: string;
  selectedTargetIcePosition?: number;
  owner?: Side;
  controller?: Side;
  lifecycleMarkers?: VisibleCardLifecycleMarker[];
  runnerPaymentSupportAbilities?: VisibleRunnerPaymentSupportAbility[];
  effectiveRunQuote?: VisibleEffectiveIceRunQuote;
  /** Present only to the Corp for own, installed, currently unrezzed ICE. */
  effectivePostRezRunQuote?: VisibleCorpIcePostRezRunQuote;
  effectiveRezCostQuote?: VisibleCorpRezCostQuote;
  effectiveRezResourceExchangeQuote?: VisibleCorpIceRezResourceExchangeQuote;
  effectiveRezActionResourceExchangeQuotes?: VisibleCorpIceRezActionResourceExchangeQuote[];
  /** Present only for the Corp's installed agendas. */
  scoreContinuationQuote?: VisibleCorpScoreContinuationQuote;
  /** Present only in the Corp's own HQ or on an own installed root card. */
  counterBankPreparationQuote?: VisibleCorpCounterBankPreparationQuote;
  /** Present only when the installed agenda identity is known to the Runner. */
  effectiveStealCostQuote?: VisibleAgendaStealCostQuote;
};

export type VisibleTraceState = {
  traceId: string;
  sourceDefinitionId: CardDefinitionId;
  profile: TraceRulesProfile;
  phase: TraceState["status"];
  printedTrace: number;
  effectiveTraceLimit: number;
  corpBidMax?: number;
  bidsRevealed: boolean;
  corpBidCommitted: boolean;
  runnerBidCommitted: boolean;
  /** Aggregate capacity derived only from information visible to this viewer. */
  visibleOpponentBidCapacity: number;
  ownCommittedPayment?: {
    amount: number;
    sources: Array<{
      kind: TraceCorpPaymentSourceKind | TraceRunnerPaymentSourceKind;
      amount: number;
      sourceCardInstanceId?: CardInstanceId;
      sourceDefinitionId?: CardDefinitionId;
    }>;
  };
  corpBid?: number;
  corpStrength?: number;
  runnerLink?: number;
  runnerBid?: number;
  runnerStrength?: number;
  postRevealLinkBonus?: number;
  successful?: boolean;
};

export type PlayerView = {
  side: Side;
  stateVersion: number;
  turnSerial?: number;
  traceRulesProfile?: TraceRulesProfile;
  timingPoint: TimingPointId;
  activeSide: Side;
  phase: Phase;
  trace?: VisibleTraceState;
  own: {
    identity: VisibleCard;
    credits: number;
    clicks: number;
    agendaPoints: number;
    gripOrHq: VisibleCard[];
    stackOrRdCount: number;
    heapOrArchives: VisibleCard[];
    scoreArea: VisibleCard[];
    rig?: VisibleCard[];
    memoryUsed?: number;
    memoryLimit?: number;
    maxHandSize: number;
    coreDamage?: number;
    tags: number;
    /** Runner-private, currently available free Net/Core prevention. */
    freeNetOrCoreDamagePreventionRemaining?: number;
    /** Runner-private, authoritative trace payment and base-link choices. */
    runnerTraceSupportQuote?: VisibleRunnerTraceSupportQuote;
    /** Public Bad Publicity converted into run-only credits at run start. */
    availableBadPublicityRunCredits?: number;
  };
  opponent: {
    identity: VisibleCard;
    credits: number;
    clicks: number;
    agendaPoints: number;
    tags: number;
    handCount: number;
    maxHandSize: number;
    coreDamage?: number;
    deckCount: number;
    discardCount: number;
    discardCards?: VisibleCard[];
    scoreArea: VisibleCard[];
    rig?: VisibleCard[];
    memoryUsed?: number;
    memoryLimit?: number;
  };
  servers: Array<{
    id: Exclude<ServerId, "new_remote">;
    label: string;
    ice: VisibleCard[];
    root: VisibleCard[];
    counterDisplays?: CounterDisplay[];
    statuses?: VisibleServerStatus[];
  }>;
  specialZones?: {
    setAside: VisibleCard[];
    removedFromGame: VisibleCard[];
    setAsideCount: number;
    removedFromGameCount: number;
  };
  /** Present only in the Corp's own PlayerView; never a Runner-information surface. */
  corpCentralAccessQuotes?: CorpCentralAccessQuote[];
  /** Present only in the Corp's own PlayerView; never a Runner-information surface. */
  corpPunishRouteQuoteSet?: CorpPunishRouteQuoteSet;
  run?: {
    runId?: string;
    attackedServerId: Exclude<ServerId, "new_remote">;
    phase: RunState["phase"];
    position?: RunState["position"];
    approachedIce?: VisibleCard;
    encounteredIce?: VisibleCard;
    accessedCard?: VisibleCard;
    /** Runner-only engine-certified ICE that will be passed on approach. */
    pendingAutoPassIceId?: CardInstanceId;
    breach?: {
      breachId: string;
      serverId: Exclude<ServerId, "new_remote">;
      currentIndex: number;
      remainingCount: number;
      completed: boolean;
    };
    badPublicityCredits?: number;
    runnerRunTemporaryCredits?: {
      sourceDefinitionId: CardDefinitionId;
      remaining: number;
      returnUnusedAtRunEnd: true;
    };
    unpreventableCoreDamageAtRunEnd?: {
      sourceDefinitionId: CardDefinitionId;
      amount: number;
    };
    runTraceLinkBonus?: number;
    corpRezCostSurcharge?: {
      kind: "matching_printed_rez_cost";
      sourceDefinitionId: CardDefinitionId;
    };
    eventApproachIceExposeBeforeRez?: boolean;
    prohibitNoisyIcebreakers?: boolean;
    runnerCreditGainOnCorpRez?: number;
    damagePreventionPool?: {
      sourceDefinitionId: CardDefinitionId;
      remaining: number;
    };
    successful: boolean;
  };
  deckMetadata?: {
    own: DeckPublicMetadata;
    opponent: DeckPublicMetadata;
  };
  ownDeckGuideRef?: StandardDeckGuideRef;
  pendingChoice?: VisibleChoiceRequest;
  publicEvents: PublicGameEvent[];
  legalActions: LegalAction[];
  winner: Winner | null;
  agendaPointsToWin: number;
  gameEndReason?: GameEndReason;
};

export type CorpCentralAccessQuote = {
  serverId: "hq" | "rd";
  stateVersion: number;
  complete: true;
  effectiveAccessCount: number;
  isMultiaccess: boolean;
  sourceDefinitionIds: CardDefinitionId[];
  serverBoundEffects: Array<{
    id: string;
    kind: "purgeable_runner_virus_counter_access_modifier";
    serverId: "hq" | "rd";
    counterKind: PurgeableRunnerVirusCounterType;
    formula: "per_counter" | "per_counter_after_first";
    sourceDefinitionId: CardDefinitionId;
    counterCount: number;
    additionalAccessCount: number;
  }>;
};

export type AiDecisionInput = {
  /** Actor-private match binding used only for Engine-certified commands. */
  matchId?: string;
  side: Side;
  playerView: PlayerView;
  eventTail: PublicGameEvent[];
  legalActions: LegalAction[];
  difficulty: AiDifficulty;
  seed: string;
  decisionId: string;
  actionNumber: number;
  profileId: string;
};

export const AI_DECISION_DEBUG_SCHEMA_VERSION = "ai-decision-debug-v1";

export const AI_DECISION_DEBUG_REPLAY_FIELDS = [
  "schemaVersion",
  "aiLevel",
  "planFirstDecision",
  "planKind",
  "memoryVersion",
  "facts",
  "hypotheses",
  "uncertainty",
  "fallbackUsed",
  "timeoutUsed",
  "confidence",
  "summary",
  "rankedAlternatives",
  "actionAlternatives",
  "scoreBreakdown",
  "whyNot",
  "longTermPlan",
  "warnings",
  "detailSections",
  "decisionChain",
] as const;

export type AiDecisionScoreComponent = {
  key: string;
  label: string;
  value: number;
  weight?: number;
  reason?: string;
};

export type AiDecisionRankedAlternative = {
  rank: number;
  planId?: string;
  planKind?: string;
  selectedActionType?: string;
  summary?: string;
  score?: number;
  confidence?: number;
  visibleReasons?: string[];
  scoreBreakdown?: AiDecisionScoreComponent[];
  whyNot?: string[];
  warnings?: string[];
};

export type AiDecisionActionEconomyDetail = {
  economyKind: string;
  ability?: string;
  immediateGain?: number;
  netCredits?: number;
  storedCredits?: number;
  futurePoolAfter?: number;
  economyNeed?: string;
};

export type AiDecisionActionAlternative = {
  rank: number;
  actionId: string;
  actionType: string;
  label?: string;
  source?: string;
  sourceTitle?: string;
  selected: boolean;
  excluded?: boolean;
  score?: number;
  priority?: number;
  scoreBreakdown?: AiDecisionScoreComponent[];
  whyChosen?: string[];
  whyNot?: string[];
  economy?: AiDecisionActionEconomyDetail;
};

export type AiDecisionDetailSection = {
  id: string;
  title: string;
  items: string[];
};

export const AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION =
  "ai-plan-first-decision-debug-v1" as const;

export type AiPlanFirstDebugTarget = {
  kind: string;
  id: string;
  label?: string;
};

export type AiPlanFirstDebugSignal = {
  signalId: string;
  kind: "goal" | "threat";
  scope: "strategic" | "tactical";
  planModuleId: string;
  planDedupeKey: string;
  evidenceCode: string;
  guarantee: string;
  target?: AiPlanFirstDebugTarget;
};

export type AiPlanFirstDebugPlanInstance = {
  instanceId: string;
  dedupeKey: string;
  moduleId: string;
  moduleVersion: string;
  viability: string;
  portfolioRole: string;
  executionState: string;
  persistencePolicy: string;
  phase: string;
  milestone: string;
  target?: AiPlanFirstDebugTarget;
  parentInstanceId?: string;
  parentNeedId?: string;
  openNeedIds: string[];
  blockers: string[];
  evidenceCodes: string[];
};

export type AiPlanFirstDebugPriority = {
  requestedClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6";
  effectiveClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6";
  reasonCode: string;
  horizon: string;
  readiness: string;
  intentFit: "aligned" | "tactical_override" | "none";
  validationReasonCodes: string[];
  delegatedFromPlanInstanceId?: string;
  parentNeedId?: string;
  witness?: {
    kind: string;
    evidenceCode: string;
    guarantee: string;
    target?: AiPlanFirstDebugTarget;
  };
  p6Contract?:
    | "temporary_bounded_liquidity_transition"
    | "turn_completion"
    | "bounded_plan_contract";
};

export type AiPlanFirstDebugRoute = {
  planInstanceId: string;
  stepId: string;
  capabilityId: string;
  purpose: string;
  actionId: string;
  actionType: string;
  semanticActionType: string;
  stateVersion: number;
  target?: AiPlanFirstDebugTarget;
  continuation?: {
    continuationId: string;
    trigger: string;
    nextCapabilityId: string;
    purpose: string;
    target?: AiPlanFirstDebugTarget;
  };
};

export type AiPlanFirstDebugDisposition = {
  actionId: string;
  disposition: "explicitly_nonproductive" | "assessment_unknown";
  ownerModuleId: string;
  evidenceCode: string;
};

export type AiPlanFirstDebugExecutionOrigin = {
  rootPlanInstanceId: string;
  leafPlanInstanceId: string;
  commitmentId?: string;
  side: "runner" | "corp";
  windowKind:
    | "automatic_resolution"
    | "mandatory_choice"
    | "optional_ability"
    | "main_action"
    | "run"
    | "access"
    | "trace"
    | "pass_decline";
  windowId: string;
  stateVersion: number;
  timingPoint: string;
};

export type AiPlanFirstDebugStepBinding = {
  planInstanceId: string;
  stepId: string;
  parentInstanceId?: string;
  needId?: string;
  supportAssignmentId?: string;
};

export type AiPlanFirstDebugPrerunReserveQuote = {
  purpose: "information" | "access" | "multiaccess" | "contest";
  status: "not_required" | "satisfied" | "information_probe_only" | "blocked";
  riskTolerance: "standard" | "matchpoint_with_stable_universal_coverage";
  knownPathCost: number;
  creditsAfterKnownPath: number;
  unknownIceCount: number;
  unknownIcePositions: number[];
  corpRezCredits: number;
  visibleCoverage:
    | "stable_universal"
    | "risky_universal"
    | "typed_only"
    | "none";
  requiredCredits: number;
  creditGap: number;
  requiredHandBuffer: number;
  handBufferGap: number;
  evidence: string[];
};

export type AiPlanFirstDebugSelectedRunQuote = {
  schemaVersion: "ai-selected-run-quote-v1";
  actionId: string;
  serverId: string;
  targetKind: string;
  purpose: "information" | "access" | "multiaccess" | "contest";
  recommendation: string;
  pathPassability: string;
  pathCost: number;
  creditsBeforeRun: number;
  creditsAfterRun: number;
  score: number;
  reachable: boolean;
  runCommitment: "probe_only" | "full_path";
  supportNeedId?: string;
  routePreparation?: string;
  routeValue?: {
    rawRouteScore: number;
    opportunityCost: number;
    effectiveRouteScore: number;
  };
  reserveQuote?: AiPlanFirstDebugPrerunReserveQuote;
  riskContract?: {
    schemaVersion: "runner-run-risk-contract-v1";
    observedAtStateVersion: number;
    unrezzedIceRisk: number;
    runnerCreditsAtEntry: number;
    runnerHandCountAtEntry: number;
    visibleDuringRunRezSupport: boolean;
    reserveQuote: AiPlanFirstDebugPrerunReserveQuote;
    evidenceCodes: string[];
  };
  evidenceCodes: string[];
};

export const AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION =
  "ai-turn-planning-debug-v1" as const;

export type AiTurnPlanningDebug = {
  schemaVersion: typeof AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION;
  mode: "projection_contract" | "shadow" | "cutover";
  stateVersion: number;
  sideSafePlanningFingerprint: string;
  planningRulesFingerprint: string;
  turnKey: string;
  candidateAudit?: {
    schemaVersion: "ai-turn-planning-candidate-audit-v1";
    provenance: "persisted_at_decision";
  };
  heads: Array<{
    candidateId: string;
    moduleId: string;
    rootPlanInstanceId: string;
    executorPlanInstanceId?: string;
    actionId: string;
    semanticActionType: string;
    invocationKey: string;
    witnessValid: boolean;
    selectedInLine?: boolean;
    rootEligible?: boolean;
    dependencyCandidateIds?: string[];
    assessment?: {
      requestedPriorityClass: string;
      effectivePriorityClass: string;
      readiness: string;
      intentFit: string;
      withinClassValue: number;
      stepValue: number;
      resourceGaps: Array<{
        needId: string;
        capability: string;
        minimum: number;
        available: number;
        deadline: string;
      }>;
      blockers: Array<{
        code: string;
        owner: string;
        removable: boolean;
      }>;
      evidenceCodes: string[];
    };
  }>;
  selectedLine: {
    lineId: string;
    stopReason:
      | "projected_turn_end"
      | "observation_boundary"
      | "projection_not_supported"
      | "projected_plan_discovery_required"
      | "bounded_search_horizon";
    projectedFrameKey: string;
    cursor: { phaseIndex: number; nodeIndex: number };
    phases: Array<{
      phaseId: string;
      rootPlanInstanceId: string;
      rootModuleId: string;
      rootProvenance: "resident" | "admitted_child" | "admitted_support";
      entryFrameKey: string;
      completionCode: string;
      transitionKind: string;
      supportBindings: Array<{
        planInstanceId: string;
        parentNeedId: string;
        assignmentId: string;
      }>;
      nodes: Array<{
        nodeId: string;
        semanticActionType: string;
        boundaryAfter?: string;
      }>;
    }>;
  };
  commitment?: {
    commitmentId: string;
    status:
      | "prospective"
      | "active"
      | "awaiting_observation"
      | "completed"
      | "replanned"
      | "invalidated";
    cursor: {
      phaseIndex: number;
      nodeIndex: number;
      phaseId: string;
      nodeId: string;
    };
    phaseEntry: {
      phaseId: string;
      status: "projection_only" | "validated" | "pending" | "invalid";
      reasonCode: string;
    };
    rematerialization: {
      status: "not_attempted" | "executable" | "replan_required";
      actionId?: string;
      leaseId?: string;
      reasonCode?: string;
    };
    observationClass?:
      | "expected_progress"
      | "expected_phase_transition"
      | "expected_no_material_change"
      | "plan_internal_continuation_boundary"
      | "scheduled_information_boundary"
      | "material_cost_or_target_drift"
      | "material_outcome_deviation"
      | "urgent_interrupt"
      | "phase_milestone_reached"
      | "runtime_restarted"
      | "commitment_invalidated";
    replanReason?:
      | "runtime_restarted"
      | "rules_context_changed"
      | "turn_changed"
      | "state_identity_stale"
      | "current_step_not_legal"
      | "current_step_ambiguous"
      | "material_cost_drift"
      | "material_target_drift"
      | "material_choice_drift"
      | "material_outcome_deviation"
      | "scheduled_information_boundary"
      | "route_completed"
      | "route_unavailable"
      | "urgent_interrupt"
      | "phase_entry_invalid"
      | "hard_plan_commitment_invalid"
      | "campaign_requote_invalid"
      | "commitment_contract_invalid";
    continuation?: {
      status: "retained" | "preempted" | "released";
      previousCommitmentId: string;
      previousOwnerRootPlanInstanceId: string;
      intendedNextMilestoneId: string;
      boundaryKind:
        | "plan_internal_continuation"
        | "route_completed"
        | "route_unavailable"
        | "urgent_interrupt";
      nextCommitmentId?: string;
      takeoverRootPlanInstanceId?: string;
      evidenceCodes: string[];
    };
  };
  boundary?: {
    kind: string;
    residualTurnValueBasis: string;
    optionalityUnit: string;
    optionalityMinimum: number;
    optionalityMaximum: number;
  };
  agendaComparison?: {
    opportunityKey: string;
    selectedFamily?: "pure_rush" | "combined_rush" | "safe_setup";
    selectionReason: string;
    randomizationEligible: boolean;
    lines: Array<{
      lineId: string;
      family: "pure_rush" | "combined_rush" | "safe_setup";
      actionCount: number;
      agendaProgress: number;
      defense: number;
      economy: number;
      risk: number;
      worstCaseFloor: number;
      expectedValue: number;
    }>;
  };
  defenseComparison?: {
    selectedLineId?: string;
    lines: Array<{
      lineId: string;
      targetServerId: string;
      disposition:
        | "install_rez_ready"
        | "fund_then_install"
        | "stage_for_later_rez"
        | "bounded_bluff"
        | "draw_for_ice";
      actionCount: number;
      fundingGapBefore: number;
      fundingGapAfter: number;
      rezReadyAfterLine: boolean;
      bluffValue: number;
      defenseValue: number;
      economyValue: number;
      totalValue: number;
    }>;
    rejected: Array<{
      defenseId: string;
      actionId?: string;
      reasonCode: string;
    }>;
  };
  campaigns?: Array<{
    campaignId: string;
    kind: "agenda" | "defense" | "opening_rush";
    status:
      | "awaiting_opponent_outcome"
      | "continuable"
      | "blocked"
      | "completed"
      | "abandoned";
    rootPlanInstanceId: string;
    moduleId: "corp.score_agenda" | "corp.defend_servers";
    milestoneId: string;
    targetServerId?: string;
    targetCardInstanceId?: string;
    openingRushOpportunityKey?: string;
    requoteStatus:
      | "current"
      | "awaiting_next_own_turn"
      | "required_now"
      | "not_applicable";
    requoteReasonCode: string;
    reactionStatus: "idle" | "paused" | "resumable" | "expired" | "terminal";
    openReactionWindowKinds: Array<"rez" | "trace" | "prevention" | "ambush">;
    reactionDeadline: "none" | "current_run_end" | "next_own_turn";
    claimDisposition: "active" | "reserved" | "requote_required" | "released";
    reactionReasonCode: string;
    publicOutcomes: Array<{
      outcomeId: string;
      eventId: string;
      eventType: string;
      stateVersionAfter: number;
      kind:
        | "run_declared"
        | "run_completed"
        | "rez_window_opened"
        | "rez_window_resolved"
        | "corp_rez"
        | "trace_started"
        | "trace_resolved"
        | "prevention_window_opened"
        | "prevention_window_resolved"
        | "ambush_triggered"
        | "ambush_resolved"
        | "access_resolved"
        | "card_trashed"
        | "remote_compromised";
      milestoneId: string;
      origin: "public_event" | "visible_state_derivation";
      targetServerId?: string;
      targetCardInstanceId?: string;
      evidenceCode: string;
    }>;
    evidenceCodes: string[];
  }>;
  shadowComparison?: {
    liveActionId: string;
    shadowActionId?: string;
    shadowRootPlanInstanceId?: string;
    boundedBaselineActionId?: string;
    agreement: boolean;
    comparisonClass:
      | "agreement"
      | "two_step_changes_head"
      | "different_current_head"
      | "no_shadow_line";
    twoStepChangedHead: boolean;
  };
  coverage?: {
    status: "pass" | "fail";
    coveragePercent: number;
    legalActionCount: number;
    productiveActionCount: number;
    explicitlyNonproductiveActionCount: number;
    assessmentUnknownActionCount: number;
    engineWindowActionCount: number;
    missingActionCount: number;
    conflictingActionCount: number;
    issueCodes: string[];
    missingActionIds: string[];
    conflictingActionIds: string[];
  };
  search?: {
    headCount: number;
    lineCount: number;
    expandedNodeCount: number;
    protectedPartitionCount: number;
    conservativeBaselineCount: number;
    maximumDepth: number;
    maximumExpandedNodes: number;
    maximumBranchesPerPartition: number;
    maximumParetoLinesPerPartition: number;
    selectedLineScalarValue: number;
    selectedLineStepCount: number;
  };
  consideredLines?: Array<{
    lineId: string;
    firstActionId: string;
    rootPlanInstanceId: string;
    stepCount: number;
    scalarValue: number;
    upperBoundValue?: number;
    partitionKey?: string;
    priorityClass?: string;
    stopReason:
      | "projected_turn_end"
      | "observation_boundary"
      | "projection_not_supported"
      | "projected_plan_discovery_required"
      | "bounded_search_horizon";
    violatedObligationCount: number;
    steps: Array<{
      candidateId: string;
      semanticActionType: string;
      rootPlanInstanceId: string;
      nextMilestoneId: string;
      currentActionId?: string;
      actionId?: string;
    }>;
    projectedEndState?: {
      creditMinimum: number;
      creditMaximum: number;
      unrestrictedActionMinimum: number;
      unrestrictedActionMaximum: number;
      handMinimum: number;
      handMaximum: number;
      pendingBoundaryKind?: string;
    };
    evaluationValues: Record<string, number>;
    evidenceCodes: string[];
  }>;
  pruneEvents: Array<{
    candidateId: string;
    reasonCode: string;
    partitionKey?: string;
    prefixLineId?: string;
  }>;
  evidenceCodes: string[];
};

export type AiPlanFirstDecisionDebug = {
  schemaVersion: typeof AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION;
  stateVersion: number;
  lane: "plan" | "engine_window";
  selectionAuthority:
    | "resident_plan_instance"
    | "turn_plan_commitment"
    | "engine_window";
  rootPlanInstanceId: string;
  leafExecutorInstanceId: string;
  executionOrigin: AiPlanFirstDebugExecutionOrigin;
  selectedStep: AiPlanFirstDebugStepBinding;
  selectedRunQuote?: AiPlanFirstDebugSelectedRunQuote;
  selectedPlan?: AiPlanFirstDebugPlanInstance;
  priority?: AiPlanFirstDebugPriority;
  route?: AiPlanFirstDebugRoute;
  engineWindowAction?: {
    actionId: string;
    actionType: string;
    reasonCode: string;
  };
  strategicContext: {
    authority: "diagnostic_only";
    primaryStrategyId?: string;
    phase?: string;
    intentFit?: "aligned" | "tactical_override" | "none";
    signals: AiPlanFirstDebugSignal[];
  };
  engineQuoteEvidence: {
    status: "certified" | "unknown" | "not_reported";
    evidenceCodes: string[];
  };
  assessmentEvidenceCodes: string[];
  dispositions: AiPlanFirstDebugDisposition[];
  portfolio: AiPlanFirstDebugPlanInstance[];
  turnPlanning?: AiTurnPlanningDebug;
};

export const AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION =
  "ai-decision-chain-debug-v1" as const;

export type AiDecisionSelectionRoute =
  | "runner_run_plan"
  | "inevitable_corp_deckout"
  | "reactive_choice"
  | "self_damage_immediate_win"
  | "opponent_matchpoint_contest"
  | "tactical_plan_mapping"
  | "tactical_plan_override"
  | "semantic_score"
  | "semantic_coverage_fallback";

export type AiDecisionChainDebug = {
  schemaVersion: typeof AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION;
  legalActionCount: number;
  legalActionIds: string[];
  exclusions: Array<{
    actionId: string;
    key: string;
  }>;
  rawScoreWinner?: {
    actionId: string;
    score: number;
  };
  planSelection?: {
    planId: string;
    planKind: string;
    mappedActionIds: string[];
    contributionMode: "diagnostic_only" | "action_capacity_scoring";
  };
  planArbitration?: {
    outcome?:
      | "plan_mapping_selected"
      | "semantic_choice_selected"
      | "semantic_choice_blocked";
    selectedActionId?: string;
    mappedActionId?: string;
    overrideActionId?: string;
    overrideBlockedActionId?: string;
    reason?: string;
    scoreGap?: number;
    threshold?: number | "absolute";
    policy?: "score_gap" | "absolute_plan_control";
  };
  priorityCandidates: Array<{
    route: AiDecisionSelectionRoute;
    actionId: string;
  }>;
  initialSelection: {
    route: AiDecisionSelectionRoute;
    actionId: string;
  };
  adjustments: Array<{
    kind: "runner_run_only_adjustment";
    fromActionId: string;
    toActionId: string;
  }>;
  finalSelection: {
    actionId: string;
    selectedOptionCount: number;
    choiceResolution?: {
      choiceId: string;
      kind: string;
      source: string;
      selectedOptionIds: string[];
    };
  };
};

export type AiDecisionDebug = {
  schemaVersion: typeof AI_DECISION_DEBUG_SCHEMA_VERSION;
  aiLevel: number;
  planFirstDecision?: AiPlanFirstDecisionDebug;
  summary?: string;
  planId?: string;
  planKind?: string;
  selectedActionType?: string;
  score?: number;
  confidence?: number;
  visibleReasons?: string[];
  rankedAlternatives?: AiDecisionRankedAlternative[];
  actionAlternatives?: AiDecisionActionAlternative[];
  scoreBreakdown?: AiDecisionScoreComponent[];
  whyNot?: string[];
  longTermPlan?: string[];
  warnings?: string[];
  detailSections?: AiDecisionDetailSection[];
  decisionChain?: AiDecisionChainDebug;
  uncertainty?: string[];
  evidence?: string[];
  fallbackUsed?: boolean;
  seed?: string;
  profileId?: string;
  timeBudgetMs?: number;
  timeoutUsed?: boolean;
  memoryVersion?: string;
  facts?: string[];
  hypotheses?: string[];
  invalidations?: string[];
  beliefUncertainty?: string[];
  opponentModel?: Record<string, unknown>;
};

const AI_DECISION_DEBUG_FORBIDDEN_KEY_PATTERN =
  /(?:privatePayload|cardInstances|fullGameState|FullState|sessionToken|reconnectToken|joinToken|tokenHash|privateDeckSnapshots|decklist|deckList|deckContents|runnerDeck|corpDeck|opponentHand|opponentHq|hqContents|rdContents|rndContents|stackContents|handContents|deckCards|sessions?)/i;
const AI_DECISION_DEBUG_FORBIDDEN_VALUE_PATTERN =
  /(?:privatePayload|cardInstances|fullGameState|FullState|sessionToken|reconnectToken|joinToken|tokenHash|decklist|hidden-card|hidden-deck-card)/i;
const AI_DECISION_DEBUG_DETAIL_SECTION_ITEM_LIMIT = 256;

export function sanitizeAiDecisionDebug(
  debug: unknown,
): AiDecisionDebug | undefined {
  if (!debug || typeof debug !== "object" || Array.isArray(debug))
    return undefined;
  const source = debug as Record<string, unknown>;
  const aiLevel =
    typeof source.aiLevel === "number" && Number.isFinite(source.aiLevel)
      ? source.aiLevel
      : 0;
  const result: AiDecisionDebug = {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel,
  };
  const stringFields = [
    "summary",
    "planId",
    "planKind",
    "selectedActionType",
    "seed",
    "profileId",
    "memoryVersion",
  ] as const;
  for (const field of stringFields) {
    const value = sanitizeAiDecisionDebugString(source[field]);
    if (value !== undefined) result[field] = value;
  }
  const numberFields = ["score", "confidence", "timeBudgetMs"] as const;
  for (const field of numberFields) {
    const value = source[field];
    if (typeof value === "number" && Number.isFinite(value))
      result[field] = value;
  }
  const booleanFields = ["fallbackUsed", "timeoutUsed"] as const;
  for (const field of booleanFields) {
    const value = source[field];
    if (typeof value === "boolean") result[field] = value;
  }
  const stringArrayFields = [
    "visibleReasons",
    "whyNot",
    "longTermPlan",
    "warnings",
    "uncertainty",
    "evidence",
    "facts",
    "hypotheses",
    "invalidations",
    "beliefUncertainty",
  ] as const;
  for (const field of stringArrayFields) {
    const value = sanitizeAiDecisionDebugStringArray(source[field]);
    if (value) result[field] = value;
  }
  const rankedAlternatives = sanitizeAiDecisionRankedAlternatives(
    source.rankedAlternatives,
  );
  if (rankedAlternatives) result.rankedAlternatives = rankedAlternatives;
  const actionAlternatives = sanitizeAiDecisionActionAlternatives(
    source.actionAlternatives,
  );
  if (actionAlternatives) result.actionAlternatives = actionAlternatives;
  const scoreBreakdown = sanitizeAiDecisionScoreComponents(
    source.scoreBreakdown,
  );
  if (scoreBreakdown) result.scoreBreakdown = scoreBreakdown;
  const detailSections = sanitizeAiDecisionDetailSections(
    source.detailSections,
  );
  if (detailSections) result.detailSections = detailSections;
  const planFirstDecision = sanitizeAiPlanFirstDecisionDebug(
    source.planFirstDecision,
  );
  if (planFirstDecision) result.planFirstDecision = planFirstDecision;
  const decisionChain = sanitizeAiDecisionChainDebug(source.decisionChain);
  if (decisionChain) result.decisionChain = decisionChain;
  const opponentModel = sanitizeAiDecisionDebugJson(source.opponentModel);
  if (
    opponentModel &&
    typeof opponentModel === "object" &&
    !Array.isArray(opponentModel)
  )
    result.opponentModel = opponentModel as Record<string, unknown>;
  return result;
}

function sanitizeAiDecisionRankedAlternatives(
  value: unknown,
): AiDecisionRankedAlternative[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const alternatives = value
    .slice(0, 24)
    .map((entry): AiDecisionRankedAlternative | undefined => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return undefined;
      const source = entry as Record<string, unknown>;
      const rank =
        typeof source.rank === "number" && Number.isFinite(source.rank)
          ? Math.max(1, Math.round(source.rank))
          : undefined;
      if (rank === undefined) return undefined;
      const result: AiDecisionRankedAlternative = { rank };
      for (const field of [
        "planId",
        "planKind",
        "selectedActionType",
        "summary",
      ] as const) {
        const sanitized = sanitizeAiDecisionDebugString(source[field]);
        if (sanitized !== undefined) result[field] = sanitized;
      }
      for (const field of ["score", "confidence"] as const) {
        const numberValue = source[field];
        if (typeof numberValue === "number" && Number.isFinite(numberValue))
          result[field] = numberValue;
      }
      for (const field of ["visibleReasons", "whyNot", "warnings"] as const) {
        const values = sanitizeAiDecisionDebugStringArray(source[field]);
        if (values) result[field] = values;
      }
      const scoreBreakdown = sanitizeAiDecisionScoreComponents(
        source.scoreBreakdown,
      );
      if (scoreBreakdown) result.scoreBreakdown = scoreBreakdown;
      return result;
    })
    .filter(
      (entry): entry is AiDecisionRankedAlternative => entry !== undefined,
    );
  return alternatives.length > 0 ? alternatives : undefined;
}

function sanitizeAiDecisionActionAlternatives(
  value: unknown,
): AiDecisionActionAlternative[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const alternatives = value
    .slice(0, 32)
    .map((entry): AiDecisionActionAlternative | undefined => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return undefined;
      const source = entry as Record<string, unknown>;
      const rank =
        typeof source.rank === "number" && Number.isFinite(source.rank)
          ? Math.max(1, Math.round(source.rank))
          : undefined;
      const actionId = sanitizeAiDecisionDebugString(source.actionId);
      const actionType = sanitizeAiDecisionDebugString(source.actionType);
      const selected = source.selected;
      if (
        rank === undefined ||
        !actionId ||
        !actionType ||
        typeof selected !== "boolean"
      )
        return undefined;
      const result: AiDecisionActionAlternative = {
        rank,
        actionId,
        actionType,
        selected,
      };
      if (typeof source.excluded === "boolean")
        result.excluded = source.excluded;
      for (const field of ["label", "source", "sourceTitle"] as const) {
        const sanitized = sanitizeAiDecisionDebugString(source[field]);
        if (sanitized !== undefined) result[field] = sanitized;
      }
      for (const field of ["score", "priority"] as const) {
        const numberValue = source[field];
        if (typeof numberValue === "number" && Number.isFinite(numberValue))
          result[field] = numberValue;
      }
      const scoreBreakdown = sanitizeAiDecisionScoreComponents(
        source.scoreBreakdown,
      );
      if (scoreBreakdown) result.scoreBreakdown = scoreBreakdown;
      const whyChosen = sanitizeAiDecisionDebugStringArray(source.whyChosen);
      if (whyChosen) result.whyChosen = whyChosen;
      const whyNot = sanitizeAiDecisionDebugStringArray(source.whyNot);
      if (whyNot) result.whyNot = whyNot;
      const economy = sanitizeAiDecisionActionEconomy(source.economy);
      if (economy) result.economy = economy;
      return result;
    })
    .filter(
      (entry): entry is AiDecisionActionAlternative => entry !== undefined,
    );
  return alternatives.length > 0 ? alternatives : undefined;
}

function sanitizeAiDecisionActionEconomy(
  value: unknown,
): AiDecisionActionEconomyDetail | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const source = value as Record<string, unknown>;
  const economyKind = sanitizeAiDecisionDebugString(source.economyKind);
  if (!economyKind) return undefined;
  const result: AiDecisionActionEconomyDetail = { economyKind };
  const ability = sanitizeAiDecisionDebugString(source.ability);
  if (ability !== undefined) result.ability = ability;
  const economyNeed = sanitizeAiDecisionDebugString(source.economyNeed);
  if (economyNeed !== undefined) result.economyNeed = economyNeed;
  for (const field of [
    "immediateGain",
    "netCredits",
    "storedCredits",
    "futurePoolAfter",
  ] as const) {
    const numberValue = source[field];
    if (typeof numberValue === "number" && Number.isFinite(numberValue))
      result[field] = numberValue;
  }
  return result;
}

function sanitizeAiDecisionScoreComponents(
  value: unknown,
): AiDecisionScoreComponent[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const components = value
    .slice(0, 16)
    .map((entry): AiDecisionScoreComponent | undefined => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return undefined;
      const source = entry as Record<string, unknown>;
      const key = sanitizeAiDecisionDebugString(source.key);
      const label = sanitizeAiDecisionDebugString(source.label);
      const componentValue = source.value;
      if (
        !key ||
        !label ||
        typeof componentValue !== "number" ||
        !Number.isFinite(componentValue)
      )
        return undefined;
      const result: AiDecisionScoreComponent = {
        key,
        label,
        value: componentValue,
      };
      const weight = source.weight;
      if (typeof weight === "number" && Number.isFinite(weight))
        result.weight = weight;
      const reason = sanitizeAiDecisionDebugString(source.reason);
      if (reason !== undefined) result.reason = reason;
      return result;
    })
    .filter((entry): entry is AiDecisionScoreComponent => entry !== undefined);
  return components.length > 0 ? components : undefined;
}

function sanitizeAiDecisionDetailSections(
  value: unknown,
): AiDecisionDetailSection[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const sections = value
    .slice(0, 16)
    .map((entry): AiDecisionDetailSection | undefined => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return undefined;
      const source = entry as Record<string, unknown>;
      const id = sanitizeAiDecisionDebugString(source.id);
      const title = sanitizeAiDecisionDebugString(source.title);
      const items = sanitizeAiDecisionDebugStringArray(
        source.items,
        AI_DECISION_DEBUG_DETAIL_SECTION_ITEM_LIMIT,
      );
      if (!id || !title || !items) return undefined;
      return { id, title, items };
    })
    .filter((entry): entry is AiDecisionDetailSection => entry !== undefined);
  return sections.length > 0 ? sections : undefined;
}

function sanitizeAiDecisionDebugJson(
  value: unknown,
  depth = 0,
  limits: { maxDepth: number; arrayEntries: number; objectEntries: number } = {
    maxDepth: 10,
    arrayEntries: 16,
    objectEntries: 32,
  },
): unknown {
  // Turn-planning phases contain bound support records and action nodes below
  // the existing plan-first envelope. The object/array size limits still bound
  // the payload, while this depth preserves the declared typed contract.
  if (depth > limits.maxDepth) return undefined;
  if (typeof value === "string") return sanitizeAiDecisionDebugString(value);
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, limits.arrayEntries)
      .map((entry) => sanitizeAiDecisionDebugJson(entry, depth + 1, limits))
      .filter((entry) => entry !== undefined);
  }
  if (!value || typeof value !== "object") return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(
    value as Record<string, unknown>,
  ).slice(0, limits.objectEntries)) {
    if (AI_DECISION_DEBUG_FORBIDDEN_KEY_PATTERN.test(key)) {
      result[key] = "[redacted-debug-field]";
      continue;
    }
    const sanitized = sanitizeAiDecisionDebugJson(entry, depth + 1, limits);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

function sanitizeAiPlanFirstDecisionDebug(
  value: unknown,
): AiPlanFirstDecisionDebug | undefined {
  const sanitized = sanitizeAiDecisionDebugJson(value, 0, {
    maxDepth: 16,
    arrayEntries: 128,
    objectEntries: 64,
  });
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) {
    return undefined;
  }
  const candidate = sanitized as Record<string, unknown>;
  if (
    !hasOnlyAiPlanFirstFields(candidate, [
      "schemaVersion",
      "stateVersion",
      "lane",
      "selectionAuthority",
      "rootPlanInstanceId",
      "leafExecutorInstanceId",
      "executionOrigin",
      "selectedStep",
      "selectedRunQuote",
      "selectedPlan",
      "priority",
      "route",
      "engineWindowAction",
      "strategicContext",
      "engineQuoteEvidence",
      "assessmentEvidenceCodes",
      "dispositions",
      "portfolio",
      "turnPlanning",
    ]) ||
    candidate.schemaVersion !== AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION ||
    typeof candidate.stateVersion !== "number" ||
    !Number.isFinite(candidate.stateVersion) ||
    (candidate.lane !== "plan" && candidate.lane !== "engine_window") ||
    (candidate.selectionAuthority !== "resident_plan_instance" &&
      candidate.selectionAuthority !== "turn_plan_commitment" &&
      candidate.selectionAuthority !== "engine_window") ||
    typeof candidate.rootPlanInstanceId !== "string" ||
    typeof candidate.leafExecutorInstanceId !== "string" ||
    !isAiPlanFirstExecutionOrigin(candidate.executionOrigin) ||
    candidate.executionOrigin.rootPlanInstanceId !==
      candidate.rootPlanInstanceId ||
    candidate.executionOrigin.leafPlanInstanceId !==
      candidate.leafExecutorInstanceId ||
    candidate.executionOrigin.stateVersion !== candidate.stateVersion ||
    !isAiPlanFirstStepBinding(candidate.selectedStep) ||
    (candidate.selectedRunQuote !== undefined &&
      !isAiPlanFirstSelectedRunQuote(candidate.selectedRunQuote)) ||
    !isAiPlanFirstStrategicContext(candidate.strategicContext) ||
    !isAiPlanFirstQuoteEvidence(candidate.engineQuoteEvidence) ||
    !Array.isArray(candidate.assessmentEvidenceCodes) ||
    !candidate.assessmentEvidenceCodes.every(
      (entry) => typeof entry === "string",
    ) ||
    !Array.isArray(candidate.dispositions) ||
    !candidate.dispositions.every(isAiPlanFirstDisposition) ||
    !Array.isArray(candidate.portfolio) ||
    !candidate.portfolio.every(isAiPlanFirstPlanInstance) ||
    (candidate.turnPlanning !== undefined &&
      !isAiTurnPlanningDebug(candidate.turnPlanning))
  ) {
    return undefined;
  }
  if (
    candidate.lane === "plan" &&
    ((candidate.selectionAuthority !== "resident_plan_instance" &&
      candidate.selectionAuthority !== "turn_plan_commitment") ||
      candidate.engineWindowAction !== undefined ||
      !isAiPlanFirstPlanInstance(candidate.selectedPlan) ||
      !isAiPlanFirstPriority(candidate.priority) ||
      !isAiPlanFirstRoute(candidate.route) ||
      candidate.selectedStep.planInstanceId !==
        candidate.route.planInstanceId ||
      candidate.selectedStep.stepId !== candidate.route.stepId ||
      candidate.selectedPlan.instanceId !== candidate.route.planInstanceId ||
      candidate.selectedPlan.instanceId !== candidate.leafExecutorInstanceId ||
      candidate.route.stateVersion !== candidate.stateVersion)
  ) {
    return undefined;
  }
  if (
    candidate.lane === "engine_window" &&
    (candidate.selectionAuthority !== "engine_window" ||
      candidate.selectedPlan !== undefined ||
      candidate.priority !== undefined ||
      candidate.route !== undefined ||
      candidate.selectedRunQuote !== undefined ||
      !isAiPlanFirstEngineWindowAction(candidate.engineWindowAction))
  ) {
    return undefined;
  }
  return sanitized as AiPlanFirstDecisionDebug;
}

function isAiPlanFirstStepBinding(
  value: unknown,
): value is AiPlanFirstDebugStepBinding {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "planInstanceId",
      "stepId",
      "parentInstanceId",
      "needId",
      "supportAssignmentId",
    ]) &&
    typeof candidate.planInstanceId === "string" &&
    typeof candidate.stepId === "string" &&
    [
      candidate.parentInstanceId,
      candidate.needId,
      candidate.supportAssignmentId,
    ]
      .filter((entry) => entry !== undefined)
      .every((entry) => typeof entry === "string")
  );
}

function isAiPlanFirstSelectedRunQuote(
  value: unknown,
): value is AiPlanFirstDebugSelectedRunQuote {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.schemaVersion === "ai-selected-run-quote-v1" &&
    typeof candidate.actionId === "string" &&
    typeof candidate.serverId === "string" &&
    typeof candidate.targetKind === "string" &&
    ["information", "access", "multiaccess", "contest"].includes(
      String(candidate.purpose),
    ) &&
    typeof candidate.recommendation === "string" &&
    typeof candidate.pathPassability === "string" &&
    [
      candidate.pathCost,
      candidate.creditsBeforeRun,
      candidate.creditsAfterRun,
      candidate.score,
    ].every((entry) => typeof entry === "number" && Number.isFinite(entry)) &&
    typeof candidate.reachable === "boolean" &&
    (candidate.runCommitment === "probe_only" ||
      candidate.runCommitment === "full_path") &&
    Array.isArray(candidate.evidenceCodes) &&
    candidate.evidenceCodes.every((entry) => typeof entry === "string")
  );
}

function isAiPlanFirstExecutionOrigin(
  value: unknown,
): value is AiPlanFirstDebugExecutionOrigin {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "rootPlanInstanceId",
      "leafPlanInstanceId",
      "commitmentId",
      "side",
      "windowKind",
      "windowId",
      "stateVersion",
      "timingPoint",
    ]) &&
    typeof candidate.rootPlanInstanceId === "string" &&
    typeof candidate.leafPlanInstanceId === "string" &&
    (candidate.commitmentId === undefined ||
      typeof candidate.commitmentId === "string") &&
    (candidate.side === "runner" || candidate.side === "corp") &&
    [
      "automatic_resolution",
      "mandatory_choice",
      "optional_ability",
      "main_action",
      "run",
      "access",
      "trace",
      "pass_decline",
    ].includes(String(candidate.windowKind)) &&
    typeof candidate.windowId === "string" &&
    typeof candidate.stateVersion === "number" &&
    Number.isFinite(candidate.stateVersion) &&
    typeof candidate.timingPoint === "string"
  );
}

function isAiTurnPlanningDebug(value: unknown): value is AiTurnPlanningDebug {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (
    !hasOnlyAiPlanFirstFields(candidate, [
      "schemaVersion",
      "mode",
      "stateVersion",
      "sideSafePlanningFingerprint",
      "planningRulesFingerprint",
      "turnKey",
      "candidateAudit",
      "heads",
      "selectedLine",
      "commitment",
      "boundary",
      "agendaComparison",
      "defenseComparison",
      "campaigns",
      "shadowComparison",
      "coverage",
      "search",
      "consideredLines",
      "pruneEvents",
      "evidenceCodes",
    ]) ||
    candidate.schemaVersion !== AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION ||
    (candidate.mode !== "projection_contract" &&
      candidate.mode !== "shadow" &&
      candidate.mode !== "cutover") ||
    typeof candidate.stateVersion !== "number" ||
    !Number.isFinite(candidate.stateVersion) ||
    typeof candidate.sideSafePlanningFingerprint !== "string" ||
    typeof candidate.planningRulesFingerprint !== "string" ||
    typeof candidate.turnKey !== "string" ||
    (candidate.candidateAudit !== undefined &&
      !isAiTurnPlanningCandidateAudit(candidate.candidateAudit)) ||
    !Array.isArray(candidate.heads) ||
    !candidate.heads.every(isAiTurnPlanningDebugHead) ||
    !isAiTurnPlanningDebugLine(candidate.selectedLine) ||
    (candidate.commitment !== undefined &&
      !isAiTurnPlanningDebugCommitment(candidate.commitment)) ||
    (candidate.boundary !== undefined &&
      !isAiTurnPlanningDebugBoundary(candidate.boundary)) ||
    (candidate.agendaComparison !== undefined &&
      !isAiTurnPlanningAgendaComparison(candidate.agendaComparison)) ||
    (candidate.defenseComparison !== undefined &&
      !isAiTurnPlanningDefenseComparison(candidate.defenseComparison)) ||
    (candidate.campaigns !== undefined &&
      !isAiTurnPlanningCampaigns(candidate.campaigns)) ||
    (candidate.shadowComparison !== undefined &&
      !isAiTurnPlanningShadowComparison(candidate.shadowComparison)) ||
    (candidate.coverage !== undefined &&
      !isAiTurnPlanningCoverage(candidate.coverage)) ||
    (candidate.search !== undefined &&
      !isAiTurnPlanningSearch(candidate.search)) ||
    (candidate.consideredLines !== undefined &&
      !isAiTurnPlanningConsideredLines(candidate.consideredLines)) ||
    !Array.isArray(candidate.pruneEvents) ||
    !candidate.pruneEvents.every(isAiTurnPlanningPruneEvent) ||
    !Array.isArray(candidate.evidenceCodes) ||
    !candidate.evidenceCodes.every((entry) => typeof entry === "string")
  ) {
    return false;
  }
  return true;
}

function isAiTurnPlanningCandidateAudit(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, ["schemaVersion", "provenance"]) &&
    candidate.schemaVersion === "ai-turn-planning-candidate-audit-v1" &&
    candidate.provenance === "persisted_at_decision"
  );
}

function isAiTurnPlanningCampaigns(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return false;
    const campaign = entry as Record<string, unknown>;
    if (
      !hasOnlyAiPlanFirstFields(campaign, [
        "campaignId",
        "kind",
        "status",
        "rootPlanInstanceId",
        "moduleId",
        "milestoneId",
        "targetServerId",
        "targetCardInstanceId",
        "openingRushOpportunityKey",
        "requoteStatus",
        "requoteReasonCode",
        "reactionStatus",
        "openReactionWindowKinds",
        "reactionDeadline",
        "claimDisposition",
        "reactionReasonCode",
        "publicOutcomes",
        "evidenceCodes",
      ]) ||
      ![
        "campaignId",
        "rootPlanInstanceId",
        "moduleId",
        "milestoneId",
        "requoteReasonCode",
        "reactionReasonCode",
      ].every((field) => typeof campaign[field] === "string") ||
      ![
        "targetServerId",
        "targetCardInstanceId",
        "openingRushOpportunityKey",
      ].every(
        (field) =>
          campaign[field] === undefined || typeof campaign[field] === "string",
      ) ||
      !["agenda", "defense", "opening_rush"].includes(String(campaign.kind)) ||
      ![
        "awaiting_opponent_outcome",
        "continuable",
        "blocked",
        "completed",
        "abandoned",
      ].includes(String(campaign.status)) ||
      ![
        "current",
        "awaiting_next_own_turn",
        "required_now",
        "not_applicable",
      ].includes(String(campaign.requoteStatus)) ||
      !["idle", "paused", "resumable", "expired", "terminal"].includes(
        String(campaign.reactionStatus),
      ) ||
      !["none", "current_run_end", "next_own_turn"].includes(
        String(campaign.reactionDeadline),
      ) ||
      !["active", "reserved", "requote_required", "released"].includes(
        String(campaign.claimDisposition),
      ) ||
      !Array.isArray(campaign.openReactionWindowKinds) ||
      !campaign.openReactionWindowKinds.every((kind) =>
        ["rez", "trace", "prevention", "ambush"].includes(String(kind)),
      ) ||
      !Array.isArray(campaign.evidenceCodes) ||
      !campaign.evidenceCodes.every((code) => typeof code === "string") ||
      !Array.isArray(campaign.publicOutcomes)
    ) {
      return false;
    }
    return campaign.publicOutcomes.every((outcome) => {
      if (!outcome || typeof outcome !== "object" || Array.isArray(outcome))
        return false;
      const record = outcome as Record<string, unknown>;
      return (
        hasOnlyAiPlanFirstFields(record, [
          "outcomeId",
          "eventId",
          "eventType",
          "stateVersionAfter",
          "kind",
          "milestoneId",
          "origin",
          "targetServerId",
          "targetCardInstanceId",
          "evidenceCode",
        ]) &&
        [
          "outcomeId",
          "eventId",
          "eventType",
          "milestoneId",
          "evidenceCode",
        ].every((field) => typeof record[field] === "string") &&
        typeof record.stateVersionAfter === "number" &&
        Number.isFinite(record.stateVersionAfter) &&
        [
          "run_declared",
          "run_completed",
          "rez_window_opened",
          "rez_window_resolved",
          "corp_rez",
          "trace_started",
          "trace_resolved",
          "prevention_window_opened",
          "prevention_window_resolved",
          "ambush_triggered",
          "ambush_resolved",
          "access_resolved",
          "card_trashed",
          "remote_compromised",
        ].includes(String(record.kind)) &&
        ["public_event", "visible_state_derivation"].includes(
          String(record.origin),
        ) &&
        ["targetServerId", "targetCardInstanceId"].every(
          (field) =>
            record[field] === undefined || typeof record[field] === "string",
        )
      );
    });
  });
}

function isAiTurnPlanningShadowComparison(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "liveActionId",
      "shadowActionId",
      "shadowRootPlanInstanceId",
      "boundedBaselineActionId",
      "agreement",
      "comparisonClass",
      "twoStepChangedHead",
    ]) &&
    typeof candidate.liveActionId === "string" &&
    [
      "shadowActionId",
      "shadowRootPlanInstanceId",
      "boundedBaselineActionId",
    ].every(
      (field) =>
        candidate[field] === undefined || typeof candidate[field] === "string",
    ) &&
    typeof candidate.agreement === "boolean" &&
    [
      "agreement",
      "two_step_changes_head",
      "different_current_head",
      "no_shadow_line",
    ].includes(String(candidate.comparisonClass)) &&
    typeof candidate.twoStepChangedHead === "boolean"
  );
}

function isAiTurnPlanningCoverage(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "status",
      "coveragePercent",
      "legalActionCount",
      "productiveActionCount",
      "explicitlyNonproductiveActionCount",
      "assessmentUnknownActionCount",
      "engineWindowActionCount",
      "missingActionCount",
      "conflictingActionCount",
      "issueCodes",
      "missingActionIds",
      "conflictingActionIds",
    ]) &&
    (candidate.status === "pass" || candidate.status === "fail") &&
    [
      "coveragePercent",
      "legalActionCount",
      "productiveActionCount",
      "explicitlyNonproductiveActionCount",
      "assessmentUnknownActionCount",
      "engineWindowActionCount",
      "missingActionCount",
      "conflictingActionCount",
    ].every(
      (field) =>
        typeof candidate[field] === "number" &&
        Number.isFinite(candidate[field]),
    ) &&
    Array.isArray(candidate.issueCodes) &&
    candidate.issueCodes.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.missingActionIds) &&
    candidate.missingActionIds.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.conflictingActionIds) &&
    candidate.conflictingActionIds.every((entry) => typeof entry === "string")
  );
}

function isAiTurnPlanningSearch(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const fields = [
    "headCount",
    "lineCount",
    "expandedNodeCount",
    "protectedPartitionCount",
    "conservativeBaselineCount",
    "maximumDepth",
    "maximumExpandedNodes",
    "maximumBranchesPerPartition",
    "maximumParetoLinesPerPartition",
    "selectedLineScalarValue",
    "selectedLineStepCount",
  ];
  return (
    hasOnlyAiPlanFirstFields(candidate, fields) &&
    fields.every(
      (field) =>
        typeof candidate[field] === "number" &&
        Number.isFinite(candidate[field]),
    )
  );
}

function isAiTurnPlanningConsideredLines(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return false;
    const line = entry as Record<string, unknown>;
    return (
      hasOnlyAiPlanFirstFields(line, [
        "lineId",
        "firstActionId",
        "rootPlanInstanceId",
        "stepCount",
        "scalarValue",
        "upperBoundValue",
        "partitionKey",
        "priorityClass",
        "stopReason",
        "violatedObligationCount",
        "steps",
        "projectedEndState",
        "evaluationValues",
        "evidenceCodes",
      ]) &&
      ["lineId", "firstActionId", "rootPlanInstanceId"].every(
        (field) => typeof line[field] === "string",
      ) &&
      ["stepCount", "scalarValue", "violatedObligationCount"].every(
        (field) =>
          typeof line[field] === "number" && Number.isFinite(line[field]),
      ) &&
      (line.upperBoundValue === undefined ||
        (typeof line.upperBoundValue === "number" &&
          Number.isFinite(line.upperBoundValue))) &&
      (line.partitionKey === undefined ||
        typeof line.partitionKey === "string") &&
      (line.priorityClass === undefined ||
        typeof line.priorityClass === "string") &&
      Array.isArray(line.steps) &&
      line.steps.every((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry))
          return false;
        const step = entry as Record<string, unknown>;
        return (
          hasOnlyAiPlanFirstFields(step, [
            "candidateId",
            "semanticActionType",
            "rootPlanInstanceId",
            "nextMilestoneId",
            "currentActionId",
            "actionId",
          ]) &&
          [
            "candidateId",
            "semanticActionType",
            "rootPlanInstanceId",
            "nextMilestoneId",
          ].every((field) => typeof step[field] === "string") &&
          (step.currentActionId === undefined ||
            typeof step.currentActionId === "string") &&
          (step.actionId === undefined || typeof step.actionId === "string")
        );
      }) &&
      (line.projectedEndState === undefined ||
        isAiTurnPlanningProjectedEndState(line.projectedEndState)) &&
      Boolean(
        line.evaluationValues &&
        typeof line.evaluationValues === "object" &&
        !Array.isArray(line.evaluationValues) &&
        Object.values(line.evaluationValues).every(
          (entry) => typeof entry === "number" && Number.isFinite(entry),
        ),
      ) &&
      Array.isArray(line.evidenceCodes) &&
      line.evidenceCodes.every((entry) => typeof entry === "string") &&
      [
        "projected_turn_end",
        "observation_boundary",
        "projection_not_supported",
        "projected_plan_discovery_required",
        "bounded_search_horizon",
      ].includes(String(line.stopReason))
    );
  });
}

function isAiTurnPlanningProjectedEndState(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const numericFields = [
    "creditMinimum",
    "creditMaximum",
    "unrestrictedActionMinimum",
    "unrestrictedActionMaximum",
    "handMinimum",
    "handMaximum",
  ];
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      ...numericFields,
      "pendingBoundaryKind",
    ]) &&
    numericFields.every(
      (field) =>
        typeof candidate[field] === "number" &&
        Number.isFinite(candidate[field]),
    ) &&
    (candidate.pendingBoundaryKind === undefined ||
      typeof candidate.pendingBoundaryKind === "string")
  );
}

function isAiTurnPlanningPruneEvent(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "candidateId",
      "reasonCode",
      "partitionKey",
      "prefixLineId",
    ]) &&
    typeof candidate.candidateId === "string" &&
    typeof candidate.reasonCode === "string" &&
    (candidate.partitionKey === undefined ||
      typeof candidate.partitionKey === "string") &&
    (candidate.prefixLineId === undefined ||
      typeof candidate.prefixLineId === "string")
  );
}

function isAiTurnPlanningDebugCommitment(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const cursor = candidate.cursor;
  const phaseEntry = candidate.phaseEntry;
  const rematerialization = candidate.rematerialization;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "commitmentId",
      "status",
      "cursor",
      "phaseEntry",
      "rematerialization",
      "observationClass",
      "replanReason",
      "continuation",
    ]) &&
    typeof candidate.commitmentId === "string" &&
    [
      "prospective",
      "active",
      "awaiting_observation",
      "completed",
      "replanned",
      "invalidated",
    ].includes(String(candidate.status)) &&
    Boolean(cursor && typeof cursor === "object" && !Array.isArray(cursor)) &&
    hasOnlyAiPlanFirstFields(cursor as Record<string, unknown>, [
      "phaseIndex",
      "nodeIndex",
      "phaseId",
      "nodeId",
    ]) &&
    ["phaseIndex", "nodeIndex"].every(
      (field) =>
        typeof (cursor as Record<string, unknown>)[field] === "number" &&
        Number.isSafeInteger(
          (cursor as Record<string, unknown>)[field] as number,
        ) &&
        Number((cursor as Record<string, unknown>)[field]) >= 0,
    ) &&
    ["phaseId", "nodeId"].every(
      (field) => typeof (cursor as Record<string, unknown>)[field] === "string",
    ) &&
    Boolean(
      phaseEntry &&
      typeof phaseEntry === "object" &&
      !Array.isArray(phaseEntry),
    ) &&
    hasOnlyAiPlanFirstFields(phaseEntry as Record<string, unknown>, [
      "phaseId",
      "status",
      "reasonCode",
    ]) &&
    typeof (phaseEntry as Record<string, unknown>).phaseId === "string" &&
    ["projection_only", "validated", "pending", "invalid"].includes(
      String((phaseEntry as Record<string, unknown>).status),
    ) &&
    typeof (phaseEntry as Record<string, unknown>).reasonCode === "string" &&
    Boolean(
      rematerialization &&
      typeof rematerialization === "object" &&
      !Array.isArray(rematerialization),
    ) &&
    hasOnlyAiPlanFirstFields(rematerialization as Record<string, unknown>, [
      "status",
      "actionId",
      "leaseId",
      "reasonCode",
    ]) &&
    ["not_attempted", "executable", "replan_required"].includes(
      String((rematerialization as Record<string, unknown>).status),
    ) &&
    ["actionId", "leaseId", "reasonCode"].every(
      (field) =>
        (rematerialization as Record<string, unknown>)[field] === undefined ||
        typeof (rematerialization as Record<string, unknown>)[field] ===
          "string",
    ) &&
    (candidate.observationClass === undefined ||
      [
        "expected_progress",
        "expected_phase_transition",
        "expected_no_material_change",
        "plan_internal_continuation_boundary",
        "scheduled_information_boundary",
        "material_cost_or_target_drift",
        "material_outcome_deviation",
        "urgent_interrupt",
        "phase_milestone_reached",
        "runtime_restarted",
        "commitment_invalidated",
      ].includes(String(candidate.observationClass))) &&
    (candidate.replanReason === undefined ||
      [
        "runtime_restarted",
        "rules_context_changed",
        "turn_changed",
        "state_identity_stale",
        "current_step_not_legal",
        "current_step_ambiguous",
        "material_cost_drift",
        "material_target_drift",
        "material_choice_drift",
        "material_outcome_deviation",
        "scheduled_information_boundary",
        "route_completed",
        "route_unavailable",
        "urgent_interrupt",
        "phase_entry_invalid",
        "hard_plan_commitment_invalid",
        "campaign_requote_invalid",
        "commitment_contract_invalid",
      ].includes(String(candidate.replanReason))) &&
    (candidate.continuation === undefined ||
      isAiTurnPlanningDebugContinuation(candidate.continuation))
  );
}

function isAiTurnPlanningDebugContinuation(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "status",
      "previousCommitmentId",
      "previousOwnerRootPlanInstanceId",
      "intendedNextMilestoneId",
      "boundaryKind",
      "nextCommitmentId",
      "takeoverRootPlanInstanceId",
      "evidenceCodes",
    ]) &&
    ["retained", "preempted", "released"].includes(String(candidate.status)) &&
    [
      "previousCommitmentId",
      "previousOwnerRootPlanInstanceId",
      "intendedNextMilestoneId",
    ].every((field) => typeof candidate[field] === "string") &&
    [
      "plan_internal_continuation",
      "route_completed",
      "route_unavailable",
      "urgent_interrupt",
    ].includes(String(candidate.boundaryKind)) &&
    ["nextCommitmentId", "takeoverRootPlanInstanceId"].every(
      (field) =>
        candidate[field] === undefined || typeof candidate[field] === "string",
    ) &&
    Array.isArray(candidate.evidenceCodes) &&
    candidate.evidenceCodes.every((entry) => typeof entry === "string")
  );
}

function isAiTurnPlanningDefenseComparison(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "selectedLineId",
      "lines",
      "rejected",
    ]) &&
    (candidate.selectedLineId === undefined ||
      typeof candidate.selectedLineId === "string") &&
    Array.isArray(candidate.lines) &&
    candidate.lines.every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return false;
      const line = entry as Record<string, unknown>;
      return (
        hasOnlyAiPlanFirstFields(line, [
          "lineId",
          "targetServerId",
          "disposition",
          "actionCount",
          "fundingGapBefore",
          "fundingGapAfter",
          "rezReadyAfterLine",
          "bluffValue",
          "defenseValue",
          "economyValue",
          "totalValue",
        ]) &&
        typeof line.lineId === "string" &&
        typeof line.targetServerId === "string" &&
        [
          "install_rez_ready",
          "fund_then_install",
          "stage_for_later_rez",
          "bounded_bluff",
          "draw_for_ice",
        ].includes(String(line.disposition)) &&
        typeof line.rezReadyAfterLine === "boolean" &&
        [
          "actionCount",
          "fundingGapBefore",
          "fundingGapAfter",
          "bluffValue",
          "defenseValue",
          "economyValue",
          "totalValue",
        ].every(
          (field) =>
            typeof line[field] === "number" && Number.isFinite(line[field]),
        )
      );
    }) &&
    Array.isArray(candidate.rejected) &&
    candidate.rejected.every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return false;
      const rejected = entry as Record<string, unknown>;
      return (
        hasOnlyAiPlanFirstFields(rejected, [
          "defenseId",
          "actionId",
          "reasonCode",
        ]) &&
        typeof rejected.defenseId === "string" &&
        (rejected.actionId === undefined ||
          typeof rejected.actionId === "string") &&
        typeof rejected.reasonCode === "string"
      );
    })
  );
}

function isAiTurnPlanningAgendaComparison(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "opportunityKey",
      "selectedFamily",
      "selectionReason",
      "randomizationEligible",
      "lines",
    ]) &&
    typeof candidate.opportunityKey === "string" &&
    (candidate.selectedFamily === undefined ||
      ["pure_rush", "combined_rush", "safe_setup"].includes(
        String(candidate.selectedFamily),
      )) &&
    typeof candidate.selectionReason === "string" &&
    typeof candidate.randomizationEligible === "boolean" &&
    Array.isArray(candidate.lines) &&
    candidate.lines.every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return false;
      const line = entry as Record<string, unknown>;
      return (
        hasOnlyAiPlanFirstFields(line, [
          "lineId",
          "family",
          "actionCount",
          "agendaProgress",
          "defense",
          "economy",
          "risk",
          "worstCaseFloor",
          "expectedValue",
        ]) &&
        typeof line.lineId === "string" &&
        ["pure_rush", "combined_rush", "safe_setup"].includes(
          String(line.family),
        ) &&
        [
          "actionCount",
          "agendaProgress",
          "defense",
          "economy",
          "risk",
          "worstCaseFloor",
          "expectedValue",
        ].every(
          (field) =>
            typeof line[field] === "number" && Number.isFinite(line[field]),
        )
      );
    })
  );
}

function isAiTurnPlanningDebugHead(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "candidateId",
      "moduleId",
      "rootPlanInstanceId",
      "executorPlanInstanceId",
      "actionId",
      "semanticActionType",
      "invocationKey",
      "witnessValid",
      "selectedInLine",
      "rootEligible",
      "dependencyCandidateIds",
      "assessment",
    ]) &&
    [
      "candidateId",
      "moduleId",
      "rootPlanInstanceId",
      "actionId",
      "semanticActionType",
      "invocationKey",
    ].every((field) => typeof candidate[field] === "string") &&
    (candidate.executorPlanInstanceId === undefined ||
      typeof candidate.executorPlanInstanceId === "string") &&
    typeof candidate.witnessValid === "boolean" &&
    (candidate.selectedInLine === undefined ||
      typeof candidate.selectedInLine === "boolean") &&
    (candidate.rootEligible === undefined ||
      typeof candidate.rootEligible === "boolean") &&
    (candidate.dependencyCandidateIds === undefined ||
      (Array.isArray(candidate.dependencyCandidateIds) &&
        candidate.dependencyCandidateIds.every(
          (entry) => typeof entry === "string",
        ))) &&
    (candidate.assessment === undefined ||
      isAiTurnPlanningHeadAssessment(candidate.assessment))
  );
}

function isAiTurnPlanningHeadAssessment(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "requestedPriorityClass",
      "effectivePriorityClass",
      "readiness",
      "intentFit",
      "withinClassValue",
      "stepValue",
      "resourceGaps",
      "blockers",
      "evidenceCodes",
    ]) &&
    [
      "requestedPriorityClass",
      "effectivePriorityClass",
      "readiness",
      "intentFit",
    ].every((field) => typeof candidate[field] === "string") &&
    ["withinClassValue", "stepValue"].every(
      (field) =>
        typeof candidate[field] === "number" &&
        Number.isFinite(candidate[field]),
    ) &&
    Array.isArray(candidate.resourceGaps) &&
    candidate.resourceGaps.every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return false;
      const gap = entry as Record<string, unknown>;
      return (
        hasOnlyAiPlanFirstFields(gap, [
          "needId",
          "capability",
          "minimum",
          "available",
          "deadline",
        ]) &&
        ["needId", "capability", "deadline"].every(
          (field) => typeof gap[field] === "string",
        ) &&
        ["minimum", "available"].every(
          (field) =>
            typeof gap[field] === "number" && Number.isFinite(gap[field]),
        )
      );
    }) &&
    Array.isArray(candidate.blockers) &&
    candidate.blockers.every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return false;
      const blocker = entry as Record<string, unknown>;
      return (
        hasOnlyAiPlanFirstFields(blocker, ["code", "owner", "removable"]) &&
        typeof blocker.code === "string" &&
        typeof blocker.owner === "string" &&
        typeof blocker.removable === "boolean"
      );
    }) &&
    Array.isArray(candidate.evidenceCodes) &&
    candidate.evidenceCodes.every((entry) => typeof entry === "string")
  );
}

function isAiTurnPlanningDebugLine(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const cursor = candidate.cursor;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "lineId",
      "stopReason",
      "projectedFrameKey",
      "cursor",
      "phases",
    ]) &&
    typeof candidate.lineId === "string" &&
    [
      "projected_turn_end",
      "observation_boundary",
      "projection_not_supported",
      "projected_plan_discovery_required",
      "bounded_search_horizon",
    ].includes(String(candidate.stopReason)) &&
    typeof candidate.projectedFrameKey === "string" &&
    Boolean(cursor && typeof cursor === "object" && !Array.isArray(cursor)) &&
    typeof (cursor as Record<string, unknown>).phaseIndex === "number" &&
    Number.isSafeInteger((cursor as Record<string, unknown>).phaseIndex) &&
    Number((cursor as Record<string, unknown>).phaseIndex) >= 0 &&
    typeof (cursor as Record<string, unknown>).nodeIndex === "number" &&
    Number.isSafeInteger((cursor as Record<string, unknown>).nodeIndex) &&
    Number((cursor as Record<string, unknown>).nodeIndex) >= 0 &&
    Array.isArray(candidate.phases) &&
    candidate.phases.every(isAiTurnPlanningDebugPhase)
  );
}

function isAiTurnPlanningDebugPhase(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "phaseId",
      "rootPlanInstanceId",
      "rootModuleId",
      "rootProvenance",
      "entryFrameKey",
      "completionCode",
      "transitionKind",
      "supportBindings",
      "nodes",
    ]) &&
    [
      "phaseId",
      "rootPlanInstanceId",
      "rootModuleId",
      "entryFrameKey",
      "completionCode",
      "transitionKind",
    ].every((field) => typeof candidate[field] === "string") &&
    ["resident", "admitted_child", "admitted_support"].includes(
      String(candidate.rootProvenance),
    ) &&
    Array.isArray(candidate.supportBindings) &&
    candidate.supportBindings.every((entry) =>
      recordHasExactStringFields(entry, [
        "planInstanceId",
        "parentNeedId",
        "assignmentId",
      ]),
    ) &&
    Array.isArray(candidate.nodes) &&
    candidate.nodes.every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return false;
      const node = entry as Record<string, unknown>;
      return (
        hasOnlyAiPlanFirstFields(node, [
          "nodeId",
          "semanticActionType",
          "boundaryAfter",
        ]) &&
        typeof node.nodeId === "string" &&
        typeof node.semanticActionType === "string" &&
        (node.boundaryAfter === undefined ||
          typeof node.boundaryAfter === "string")
      );
    })
  );
}

function isAiTurnPlanningDebugBoundary(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "kind",
      "residualTurnValueBasis",
      "optionalityUnit",
      "optionalityMinimum",
      "optionalityMaximum",
    ]) &&
    [
      "private_observation",
      "public_random_outcome",
      "opponent_response_window",
      "engine_continuation",
      "projection_not_supported",
      "projected_plan_discovery_required",
    ].includes(String(candidate.kind)) &&
    [
      "remaining_capacity",
      "open_need_hit_distribution",
      "hand_quality_distribution",
      "public_outcome_distribution",
    ].includes(String(candidate.residualTurnValueBasis)) &&
    [
      "usable_actions",
      "need_hit_probability",
      "hand_quality_band",
      "public_outcome_band",
    ].includes(String(candidate.optionalityUnit)) &&
    typeof candidate.optionalityMinimum === "number" &&
    Number.isFinite(candidate.optionalityMinimum) &&
    typeof candidate.optionalityMaximum === "number" &&
    Number.isFinite(candidate.optionalityMaximum)
  );
}

function recordHasExactStringFields(
  value: unknown,
  fields: readonly string[],
): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, fields) &&
    fields.every((field) => typeof candidate[field] === "string")
  );
}

function isAiPlanFirstPlanInstance(
  value: unknown,
): value is AiPlanFirstDebugPlanInstance {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "instanceId",
      "dedupeKey",
      "moduleId",
      "moduleVersion",
      "viability",
      "portfolioRole",
      "executionState",
      "persistencePolicy",
      "phase",
      "milestone",
      "target",
      "parentInstanceId",
      "parentNeedId",
      "openNeedIds",
      "blockers",
      "evidenceCodes",
    ]) &&
    [
      "instanceId",
      "dedupeKey",
      "moduleId",
      "moduleVersion",
      "viability",
      "portfolioRole",
      "executionState",
      "persistencePolicy",
      "phase",
      "milestone",
    ].every((field) => typeof candidate[field] === "string") &&
    (candidate.target === undefined || isAiPlanFirstTarget(candidate.target)) &&
    (candidate.parentInstanceId === undefined ||
      typeof candidate.parentInstanceId === "string") &&
    (candidate.parentNeedId === undefined ||
      typeof candidate.parentNeedId === "string") &&
    Array.isArray(candidate.openNeedIds) &&
    candidate.openNeedIds.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.blockers) &&
    candidate.blockers.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.evidenceCodes) &&
    candidate.evidenceCodes.every((entry) => typeof entry === "string")
  );
}

function isAiPlanFirstPriority(
  value: unknown,
): value is AiPlanFirstDebugPriority {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const priorityClasses = new Set(["P1", "P2", "P3", "P4", "P5", "P6"]);
  const p6Contracts = new Set([
    "temporary_bounded_liquidity_transition",
    "turn_completion",
    "bounded_plan_contract",
  ]);
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "requestedClass",
      "effectiveClass",
      "reasonCode",
      "horizon",
      "readiness",
      "intentFit",
      "validationReasonCodes",
      "delegatedFromPlanInstanceId",
      "parentNeedId",
      "witness",
      "p6Contract",
    ]) &&
    typeof candidate.requestedClass === "string" &&
    priorityClasses.has(candidate.requestedClass) &&
    typeof candidate.effectiveClass === "string" &&
    priorityClasses.has(candidate.effectiveClass) &&
    typeof candidate.reasonCode === "string" &&
    typeof candidate.horizon === "string" &&
    typeof candidate.readiness === "string" &&
    (candidate.intentFit === "aligned" ||
      candidate.intentFit === "tactical_override" ||
      candidate.intentFit === "none") &&
    Array.isArray(candidate.validationReasonCodes) &&
    candidate.validationReasonCodes.every(
      (entry) => typeof entry === "string",
    ) &&
    (candidate.delegatedFromPlanInstanceId === undefined ||
      typeof candidate.delegatedFromPlanInstanceId === "string") &&
    (candidate.parentNeedId === undefined ||
      typeof candidate.parentNeedId === "string") &&
    (candidate.witness === undefined ||
      isAiPlanFirstWitness(candidate.witness)) &&
    (candidate.effectiveClass === "P6"
      ? typeof candidate.p6Contract === "string" &&
        p6Contracts.has(candidate.p6Contract)
      : candidate.p6Contract === undefined)
  );
}

function isAiPlanFirstRoute(value: unknown): value is AiPlanFirstDebugRoute {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "planInstanceId",
      "stepId",
      "capabilityId",
      "purpose",
      "actionId",
      "actionType",
      "semanticActionType",
      "stateVersion",
      "target",
      "continuation",
    ]) &&
    [
      "planInstanceId",
      "stepId",
      "capabilityId",
      "purpose",
      "actionId",
      "actionType",
      "semanticActionType",
    ].every((field) => typeof candidate[field] === "string") &&
    typeof candidate.stateVersion === "number" &&
    Number.isFinite(candidate.stateVersion) &&
    (candidate.target === undefined || isAiPlanFirstTarget(candidate.target)) &&
    (candidate.continuation === undefined ||
      isAiPlanFirstContinuation(candidate.continuation))
  );
}

function isAiPlanFirstStrategicContext(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "authority",
      "primaryStrategyId",
      "phase",
      "intentFit",
      "signals",
    ]) &&
    candidate.authority === "diagnostic_only" &&
    (candidate.primaryStrategyId === undefined ||
      typeof candidate.primaryStrategyId === "string") &&
    (candidate.phase === undefined || typeof candidate.phase === "string") &&
    (candidate.intentFit === undefined ||
      candidate.intentFit === "aligned" ||
      candidate.intentFit === "tactical_override" ||
      candidate.intentFit === "none") &&
    Array.isArray(candidate.signals) &&
    candidate.signals.every((signal) => {
      if (!signal || typeof signal !== "object" || Array.isArray(signal)) {
        return false;
      }
      const entry = signal as Record<string, unknown>;
      return (
        hasOnlyAiPlanFirstFields(entry, [
          "signalId",
          "kind",
          "scope",
          "planModuleId",
          "planDedupeKey",
          "evidenceCode",
          "guarantee",
          "target",
        ]) &&
        typeof entry.signalId === "string" &&
        (entry.kind === "goal" || entry.kind === "threat") &&
        (entry.scope === "strategic" || entry.scope === "tactical") &&
        typeof entry.planModuleId === "string" &&
        typeof entry.planDedupeKey === "string" &&
        typeof entry.evidenceCode === "string" &&
        typeof entry.guarantee === "string" &&
        (entry.target === undefined || isAiPlanFirstTarget(entry.target))
      );
    })
  );
}

function isAiPlanFirstQuoteEvidence(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, ["status", "evidenceCodes"]) &&
    (candidate.status === "certified" ||
      candidate.status === "unknown" ||
      candidate.status === "not_reported") &&
    Array.isArray(candidate.evidenceCodes) &&
    candidate.evidenceCodes.every((entry) => typeof entry === "string")
  );
}

function isAiPlanFirstDisposition(
  value: unknown,
): value is AiPlanFirstDebugDisposition {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "actionId",
      "disposition",
      "ownerModuleId",
      "evidenceCode",
    ]) &&
    typeof candidate.actionId === "string" &&
    (candidate.disposition === "explicitly_nonproductive" ||
      candidate.disposition === "assessment_unknown") &&
    typeof candidate.ownerModuleId === "string" &&
    typeof candidate.evidenceCode === "string"
  );
}

function isAiPlanFirstEngineWindowAction(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "actionId",
      "actionType",
      "reasonCode",
    ]) &&
    typeof candidate.actionId === "string" &&
    typeof candidate.actionType === "string" &&
    typeof candidate.reasonCode === "string"
  );
}

function isAiPlanFirstTarget(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, ["kind", "id", "label"]) &&
    typeof candidate.kind === "string" &&
    typeof candidate.id === "string" &&
    (candidate.label === undefined || typeof candidate.label === "string")
  );
}

function isAiPlanFirstWitness(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "kind",
      "evidenceCode",
      "guarantee",
      "target",
    ]) &&
    typeof candidate.kind === "string" &&
    typeof candidate.evidenceCode === "string" &&
    typeof candidate.guarantee === "string" &&
    (candidate.target === undefined || isAiPlanFirstTarget(candidate.target))
  );
}

function isAiPlanFirstContinuation(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOnlyAiPlanFirstFields(candidate, [
      "continuationId",
      "trigger",
      "nextCapabilityId",
      "purpose",
      "target",
    ]) &&
    typeof candidate.continuationId === "string" &&
    typeof candidate.trigger === "string" &&
    typeof candidate.nextCapabilityId === "string" &&
    typeof candidate.purpose === "string" &&
    (candidate.target === undefined || isAiPlanFirstTarget(candidate.target))
  );
}

function hasOnlyAiPlanFirstFields(
  value: Record<string, unknown>,
  allowedFields: readonly string[],
): boolean {
  const allowed = new Set(allowedFields);
  return Object.keys(value).every((field) => allowed.has(field));
}

function sanitizeAiDecisionChainDebug(
  value: unknown,
): AiDecisionChainDebug | undefined {
  const sanitized = sanitizeAiDecisionDebugJson(value);
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) {
    return undefined;
  }
  const candidate = sanitized as Record<string, unknown>;
  if (
    candidate.schemaVersion !== AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION ||
    typeof candidate.legalActionCount !== "number" ||
    !Array.isArray(candidate.legalActionIds) ||
    !Array.isArray(candidate.exclusions) ||
    !Array.isArray(candidate.priorityCandidates) ||
    !candidate.initialSelection ||
    typeof candidate.initialSelection !== "object" ||
    !Array.isArray(candidate.adjustments) ||
    !candidate.finalSelection ||
    typeof candidate.finalSelection !== "object"
  ) {
    return undefined;
  }
  return sanitized as AiDecisionChainDebug;
}

function sanitizeAiDecisionDebugStringArray(
  value: unknown,
  limit = 16,
): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .slice(0, limit)
    .map((entry) => sanitizeAiDecisionDebugString(entry))
    .filter((entry): entry is string => entry !== undefined);
}

function sanitizeAiDecisionDebugString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return AI_DECISION_DEBUG_FORBIDDEN_VALUE_PATTERN.test(value)
    ? "[redacted-debug-value]"
    : value;
}

type AiDecisionBase = {
  reasonCode: string;
  explanation: string;
  consideredActionIds: string[];
  fallbackUsed: boolean;
  confidence?: number;
  evidence?: string[];
  decisionDebug?: AiDecisionDebug;
  timeoutUsed?: boolean;
  profileId?: string;
  difficulty?: AiDifficulty;
  reason?: string;
};

export type AiDecision = AiDecisionBase &
  (
    | {
        selectionKind?: "direct";
        actionId: string;
        selectedChoices?: PlayerAction["selectedChoices"];
        engineCommand?: never;
      }
    | {
        selectionKind: "engine_randomized_ice_install_selection";
        engineCommand: EngineRandomizedIceInstallSelectionCommand;
        actionId?: never;
        selectedChoices?: never;
      }
    | {
        selectionKind: "engine_randomized_turn_plan_selection";
        engineCommand: EngineRandomizedTurnPlanSelectionCommand;
        actionId?: never;
        selectedChoices?: never;
      }
    | {
        selectionKind: "engine_randomized_trace_bid_selection";
        engineCommand: EngineRandomizedTraceBidSelectionCommand;
        actionId?: never;
        selectedChoices?: never;
      }
  );
