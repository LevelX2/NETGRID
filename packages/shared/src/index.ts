export {
  LEGACY_ABILITY_PAYLOAD_FIELDS,
  type LegacyAbilityPayloadField,
} from "./ability-payload";
import proteusCardsData from "../../../data/cards/proteus-cards.json";
import classicCardsData from "../../../data/cards/classic-cards.json";
export type {
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
  ApiMatchStartLobbyPayload,
  ApiMatchStatus,
  ApiOpponentStatus,
  ApiPendingUndoRequest,
  ApiPlayerClockConfig,
  ApiPlayerClockMode,
  ApiPlayerClockSnapshot,
  ApiRecentGameResult,
  ApiRecentResultEntry,
  ApiRecentSeriesGameResult,
  ApiRecentSeriesResult,
  ApiSeriesPlayerSlot,
  ApiSeriesResultSummary,
  ApiSeriesStatus,
  ApiServerMessage,
  ApiServicePayload,
  ApiSidePayload,
} from "./api-contracts";
export {
  CORE_DEMO_DECK_IDS,
  DEMO_DECK_IDS,
  LEGACY_FIXTURE_DECK_IDS,
  type DemoDeckId,
} from "./demo-fixtures";
export { DEMO_DECKS } from "./demo-decks";
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
  | "cockroach"
  | "cascade"
  | "doom"
  | "crumble"
  | "garbage"
  | "highlighter"
  | "scaldan"
  | "tax"
  | "vienna"
  | "socket_archives"
  | "socket_hq"
  | "socket_rd"
  | "pipe"
  | "spy"
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
  damageType?: DamageType;
  dieFaces?: 6;
  damageOnResults?: number[];
  baseTraceStrength?: number;
  traceBidLimit?: number;
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

export type PurgeableRunnerVirusCounterType =
  | "cascade"
  | "doom"
  | "crumble"
  | "garbage"
  | "highlighter"
  | "scaldan"
  | "tax"
  | "vienna"
  | "socket_archives"
  | "socket_hq"
  | "socket_rd"
  | "pipe";

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
  | "corp_install"
  | "gain_credit"
  | "draw_card"
  | "start_run"
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
  runnerTagsAfter?: number;
  redactedKind?: string;
  subroutineIndex?: number;
  subroutineType?: SubroutineType;
  damageType?: DamageType;
  cardsTrashed?: number;
  endedRun?: boolean;
  paidCredits?: number;
  preventable?: boolean;
  gameLost?: boolean;
  winner?: Winner;
  sourceDefinitionId?: CardDefinitionId;
  sourceTitle?: string;
  cardDefinitionId?: CardDefinitionId;
  cardTitle?: string;
  serverId?: ServerId;
  serverLabel?: string;
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
  abilityId: string;
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
  increaseAmount?: number;
  preventionSourceIndex?: number;
  preventedTags?: number;
  tagPreventionSourceIndex?: number;
  preventedTrashTargetIds?: CardInstanceId[];
  trashPreventionSourceIndex?: number;
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
  | { type: "add_tag"; amount: number }
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

export type ChoiceOption = {
  id: string;
  label: string;
  publicLabel?: string;
  value?: string | number | boolean;
  selectable?: boolean;
  metadata?: {
    postBidTraceLinkDelta?: number;
    shellTradersRemainingCounters?: number;
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
};

export type ChoiceRequest = {
  choiceId: string;
  side: Side;
  source: string;
  prompt: string;
  kind: ChoiceKind;
  options: ChoiceOption[];
  minSelections: number;
  maxSelections: number;
  stateVersion: number;
  visibility: EventVisibilityClass;
  stackSearchResolution?: StackSearchResolution;
  cardSearchPresentation?: CardSearchPresentation;
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

export type CardDefinition = {
  id: CardDefinitionId;
  title: string;
  side: Side;
  type: CardType;
  subtypes: string[];
  implementationStatus: "playable_mvp";
  abilityEnabled?: boolean;
  cost?: number;
  installCost?: number;
  memoryCost?: number;
  memoryLimitBonus?: number;
  maxHandSizeBonus?: number;
  strength?: number;
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

export type PlayerController = {
  controllerId: string;
  side: Side;
  type: "human_local" | "human_remote" | "ai" | "replay";
  displayName?: string;
  profileId?: string;
  difficulty?: AiDifficulty;
};

export type AiDifficulty = "easy" | "normal" | "hard";

export type CreateGameConfig = {
  matchId?: string;
  seed?: string;
  baseline?: RulesBaseline;
  runnerDeckId?:
    | "demo_runner_001"
    | "demo_runner_004"
    | "demo_runner_008"
    | "demo_runner_096"
    | "demo_runner_097"
    | "demo_runner_098"
    | "demo_runner_099";
  corpDeckId?:
    | "demo_corp_001"
    | "demo_corp_004"
    | "demo_corp_008"
    | "demo_corp_096"
    | "demo_corp_097"
    | "demo_corp_098"
    | "demo_corp_099";
  runnerDeck?: DeckDefinition;
  corpDeck?: DeckDefinition;
  runnerDeckMetadata?: DeckPublicMetadata;
  corpDeckMetadata?: DeckPublicMetadata;
  agendaPointsToWin?: number;
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
    traceBidLimit?: number;
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
  onAllSuccessful: "gain_runner_event_agenda_point";
  onAnyUnsuccessful: "forgo_next_action";
  advanceOnSuccessfulRun: true;
  failOnUnsuccessfulRun: true;
};

export type RunState = {
  runId: string;
  attackedServerId: Exclude<ServerId, "new_remote">;
  accessServerOverride?: Exclude<ServerId, "new_remote">;
  freeTrashAccessZones?: Array<"rd" | "hq">;
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
        kind: "successful_run_draw_event";
        sourceCardId: CardInstanceId;
        sourceDefinitionId: CardDefinitionId;
        sourceTitle: string;
      }
    | {
        kind: "bad_publicity_run_replacement";
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
  breakSubroutineAdditionalCost?: number;
  futureEncounterEndTheRunSourceIceId?: CardInstanceId;
  turbeauAccessTraceConsumedByServer?: Partial<
    Record<Exclude<ServerId, "new_remote">, CardInstanceId[]>
  >;
  activeIceProgramTrashSourceIceId?: CardInstanceId;
  activeIceProgramTrashPendingPassedIceId?: CardInstanceId;
  passRezzedIceProgramTrashSourceIceId?: CardInstanceId;
  passRezzedIceProgramTrashPendingPassedIceId?: CardInstanceId;
  jackOutAdditionalCostForRun?: number;
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
    subroutineKind: "end_the_run" | "end_the_run_unless_runner_pays";
    amount?: number;
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
  runStartRandomStrengthBonus?: number;
  runStartRandomStrengthBonusByBreaker?: Partial<
    Record<CardInstanceId, number>
  >;
  futureEncounterIceStrengthBonus?: number;
  nextEncounterNoBreakSubroutines?: boolean;
  nextEncounterJackOutLock?: boolean;
  noBreakSubroutinesActive?: boolean;
  jackOutLockedUntilEncounterEnds?: boolean;
  jackOutLockedForRun?: boolean;
  nextEncounterFatalDamage?: number;
  fatalDamageActiveForEncounter?: boolean;
  fatalDamageAmountForEncounter?: number;
  fullyBrokenIceIds?: CardInstanceId[];
  nextSentryFreeBreakByBreaker?: Partial<
    Record<CardInstanceId, CardInstanceId>
  >;
  nextSentryFreeBreakTargetIceByBreaker?: Partial<
    Record<CardInstanceId, CardInstanceId>
  >;
  fullyBrokenPassedIcePendingId?: CardInstanceId;
  fullyBrokenPassedIceTrashPendingId?: CardInstanceId;
  forceJackOutAfterEncounterSourceId?: CardInstanceId;
  dupreUsedBreakerIdsThisRun?: CardInstanceId[];
  runOnceBreakTagAndStealthLossUsedBreakerIds?: CardInstanceId[];
  runEndTrashUsedBreakerIdsThisRun?: CardInstanceId[];
  hiddenStackInstallUsedSourceIdsThisRun?: CardInstanceId[];
  bartmossUsedBreakerIdsThisEncounter?: CardInstanceId[];
  aardvarkInterceptionIceIds?: CardInstanceId[];
  blinkUsedSubroutinesByBreakerThisEncounter?: Partial<
    Record<CardInstanceId, number[]>
  >;
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
    sourceDefinitionId: CardDefinitionId;
    sourceTitle: string;
    amount: 1;
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

export type TraceState = {
  traceId: string;
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  subroutineIndex?: number;
  baseTraceStrength: number;
  traceBidLimit?: number;
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
    | "trace_success_cancel";
  successEffect: TraceSuccessEffect;
  returnPhase?: Phase;
  returnTimingPoint?: TimingPointId;
  returnActiveSide?: Side;
  corpBid?: number;
  traceStrength?: number;
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
  runnerBid?: number;
  runnerStrength?: number;
  postBidLinkSourceIds?: CardInstanceId[];
  postBidLinkBonus?: number;
  successful?: boolean;
  corpTemporaryTraceCredits?: {
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    remaining: number;
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
  stateHashAfter: StateHash;
  visibilityClass?: EventVisibilityClass;
  publicPayload: Record<string, unknown>;
};

export type GameEvent = PublicGameEvent & {
  privatePayload?: Partial<Record<Side, Record<string, unknown>>>;
};

export type GameState = {
  matchId: string;
  baseline: RulesBaseline;
  stateVersion: number;
  turnSerial?: number;
  seed: string;
  randomCounter: number;
  randomDrawRecords: RandomDrawRecord[];
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
    nextAgendaAccessCreditGainPending?: boolean;
    nextAgendaAccessAgendaPointPending?: boolean;
    nextAgendaAccessAgendaPointSourceDefinitionId?: CardDefinitionId;
    nextAgendaAccessAgendaPointSourceTitle?: string;
    pendingSequences?: MultiServerSuccessSequenceState[];
    installedResourceIdsThisTurn?: CardInstanceId[];
    installedResourceIdsLastTurn?: CardInstanceId[];
    successfulHqRunThisTurn?: boolean;
    successfulRdRunThisTurn?: boolean;
    successfulRunThisTurn?: boolean;
    lastSuccessfulRunServerId?: Exclude<ServerId, "new_remote">;
    blackOpsLiberatedOrTrashedDuringSuccessfulHqOrRdRunThisTurn?: boolean;
    damagePreventionUsage?: Record<CardInstanceId, number>;
    runnerActionsTakenThisTurn?: number;
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
    pdcaUsedSourceIdsThisTurn?: CardInstanceId[];
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
  payload?: Record<string, string | number | boolean>;
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

export type VisibleEffectiveSubroutine = {
  id: string;
  type: SubroutineType;
  amount?: number;
  baseTraceStrength?: number;
  traceSuccessEffect?: TraceSuccessEffect;
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

export type VisibleEffectiveIceRunQuote = {
  iceInstanceId: CardInstanceId;
  iceDefinitionId: CardDefinitionId;
  effectiveStrength: number;
  subroutines: VisibleEffectiveSubroutine[];
  breakSubroutineAdditionalCostPerSubroutine?: number;
  breakSubroutineCostSourceDefinitionIds?: CardDefinitionId[];
  breakSubroutineCostSourceTitles?: string[];
};

export type VisibleCard = {
  instanceId: CardInstanceId;
  known: boolean;
  title?: string;
  definitionId?: CardDefinitionId;
  type?: CardType;
  subtypes?: string[];
  rulesText?: string;
  cost?: number;
  installCost?: number;
  memoryCost?: number;
  memoryLimitBonus?: number;
  maxHandSizeBonus?: number;
  rezCost?: number;
  baseLink?: number;
  rezzed?: boolean;
  advancementCounters?: number;
  advancementRequirement?: number;
  strength?: number;
  strengthModifier?: number;
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
  selectedTargetLabel?: string;
  owner?: Side;
  controller?: Side;
  effectiveRunQuote?: VisibleEffectiveIceRunQuote;
};

export type PlayerView = {
  side: Side;
  stateVersion: number;
  timingPoint: TimingPointId;
  activeSide: Side;
  phase: Phase;
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
  }>;
  specialZones?: {
    setAside: VisibleCard[];
    removedFromGame: VisibleCard[];
    setAsideCount: number;
    removedFromGameCount: number;
  };
  run?: {
    attackedServerId: Exclude<ServerId, "new_remote">;
    phase: RunState["phase"];
    position?: RunState["position"];
    approachedIce?: VisibleCard;
    encounteredIce?: VisibleCard;
    accessedCard?: VisibleCard;
    breach?: {
      breachId: string;
      serverId: Exclude<ServerId, "new_remote">;
      currentIndex: number;
      remainingCount: number;
      completed: boolean;
    };
    badPublicityCredits?: number;
    successful: boolean;
  };
  deckMetadata?: {
    own: DeckPublicMetadata;
    opponent: DeckPublicMetadata;
  };
  pendingChoice?: VisibleChoiceRequest;
  publicEvents: PublicGameEvent[];
  legalActions: LegalAction[];
  winner: Winner | null;
  agendaPointsToWin: number;
  gameEndReason?: GameEndReason;
};

export type AiDecisionInput = {
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

export type AiDecisionDebug = {
  schemaVersion: typeof AI_DECISION_DEBUG_SCHEMA_VERSION;
  aiLevel: number;
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

function sanitizeAiDecisionDebugJson(value: unknown, depth = 0): unknown {
  if (depth > 4) return undefined;
  if (typeof value === "string") return sanitizeAiDecisionDebugString(value);
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, 16)
      .map((entry) => sanitizeAiDecisionDebugJson(entry, depth + 1))
      .filter((entry) => entry !== undefined);
  }
  if (!value || typeof value !== "object") return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(
    value as Record<string, unknown>,
  ).slice(0, 32)) {
    if (AI_DECISION_DEBUG_FORBIDDEN_KEY_PATTERN.test(key)) {
      result[key] = "[redacted-debug-field]";
      continue;
    }
    const sanitized = sanitizeAiDecisionDebugJson(entry, depth + 1);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
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

export type AiDecision = {
  actionId: string;
  selectedChoices?: PlayerAction["selectedChoices"];
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

export {
  CARD_DEFINITIONS,
  CARD_DEFINITIONS_BY_ID,
} from "./card-definitions";
