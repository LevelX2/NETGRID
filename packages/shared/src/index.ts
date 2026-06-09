export {
  LEGACY_ABILITY_PAYLOAD_FIELDS,
  type LegacyAbilityPayloadField,
} from "./ability-payload";
import proteusCardsData from "../../../data/cards/proteus-cards.json";
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
export {
  CURRENT_RULES_BASELINE,
  type RulesBaseline,
} from "./baselines";
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
  | "acme_savings_and_loan_unpaid"
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
  | "doppelganger_antibody"
  | "pattel_antibody"
  | "cerberus"
  | "data_raven"
  | "mastiff"
  | "militech"
  | "power"
  | "agenda"
  | "recurring_credit"
  | "bad_publicity"
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
  | { type: "end_run_trash_hardware_and_unpreventable_meat_damage"; amount: number }
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
  | "initiate_trace"
  | "trash_installed_program"
  | "trash_installed_program_unless_runner_pays"
  | "set_run_encounter_tax"
  | "set_run_break_subroutine_cost_modifier"
  | "set_run_future_end_the_run_subroutine"
  | "set_run_viral_15"
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
  | "rewind_run_to_rezzed_ice_by_die";

export type SubroutineDefinition = {
  id: string;
  type: SubroutineType;
  amount?: number;
  damageType?: DamageType;
  baseTraceStrength?: number;
  traceBidLimit?: number;
  traceSuccessEffect?: TraceSuccessEffect;
  runFutureStrengthCancelPaymentAmount?: number;
  requiresSuccessfulTraceSubroutineIndex?: number;
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
export type EventModificationKind = "prevent" | "avoid" | "interrupt" | "increase";
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

export type SneakPreviewTemporaryInstall = {
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

export type AiDeckDoctrineProfile = {
  schemaVersion: "ai-deck-doctrine-v1";
  deckSnapshotId: string;
  deckHash: string;
  side: Side;
  formatProfileId?: string;
  confidence: number;
  archetypeTags: string[];
  roleCounts: Record<string, number>;
  roleDensity: Record<string, number>;
  planWeights: Record<string, number>;
  mulliganWeights: Record<string, number>;
  riskFlags: string[];
  evidence: Array<{
    kind: "role_count" | "density" | "missing_role" | "curve" | "agenda_density" | "ice_mix" | "economy_mix";
    label: string;
    value: number | string;
  }>;
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
  counters?: Partial<Record<CounterType, number>>;
  tapped?: boolean;
  hostedOn?: CardInstanceId;
  selectedServerId?: Exclude<ServerId, "new_remote">;
  selectedCardId?: CardInstanceId;
  selectedSubtype?: string;
  variableIceState?: {
    family:
      | "x_strength"
      | "paid_end_the_run_subroutines"
      | "alternate_subtype";
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

export type RunState = {
  runId: string;
  attackedServerId: Exclude<ServerId, "new_remote">;
  accessServerOverride?: Exclude<ServerId, "new_remote">;
  freeTrashAccessZones?: Array<"rd" | "hq">;
  grantAllNighterBonusRunOnFinish?: boolean;
  successfulRunAccessReplacement?:
    | "corp_lose_credits"
    | "runner_spend_corp_lose_credits"
    | "private_look_top_rd"
    | "archives_faceup_to_rd"
    | "trash_rezzed_ice_on_fort_and_tag_runner"
    | "runner_gain_agenda_point";
  badPublicityRunAftermath?:
    | {
        kind: "live_news_feed";
        sourceCardId: CardInstanceId;
        sourceDefinitionId: CardDefinitionId;
        sourceTitle: string;
      }
    | {
        kind: "subliminal_corruption";
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
  microtechAiInterfacePreAccessResolved?: boolean;
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
  viral15ActiveSourceIceId?: CardInstanceId;
  viral15PendingPassedIceId?: CardInstanceId;
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
  aiBoonSourceCardId?: CardInstanceId;
  aiBoonRunStrength?: number;
  aiBoonRunStrengthByBreaker?: Partial<Record<CardInstanceId, number>>;
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
  nextSentryFreeBreakByBreaker?: Partial<Record<CardInstanceId, CardInstanceId>>;
  nextSentryFreeBreakTargetIceByBreaker?: Partial<
    Record<CardInstanceId, CardInstanceId>
  >;
  fullyBrokenPassedIcePendingId?: CardInstanceId;
  startupImmolatorPendingPassedIceId?: CardInstanceId;
  forceJackOutAfterEncounterSourceId?: CardInstanceId;
  dupreUsedBreakerIdsThisRun?: CardInstanceId[];
  mysteryBoxUsedSourceIdsThisRun?: CardInstanceId[];
  bartmossUsedBreakerIdsThisEncounter?: CardInstanceId[];
  aardvarkInterceptionIceIds?: CardInstanceId[];
  blinkUsedSubroutinesByBreakerThisEncounter?: Partial<
    Record<CardInstanceId, number[]>
  >;
  remainderStrengthBonusByBreaker?: Partial<Record<CardInstanceId, number>>;
  runStrengthBoostUsedSourceIds?: CardInstanceId[];
  bizarreEncryptionSchemeActive?: boolean;
  traceSuccessBySubroutineIndex?: Partial<Record<number, boolean>>;
  accessStealCostModifierSnapshotsByServer?: Partial<
    Record<
      Exclude<ServerId, "new_remote">,
      AccessStealCostModifierSnapshot[]
    >
  >;
  singaporeCityGridUsedSourceIdsThisRun?: CardInstanceId[];
  iceRepositionUsedSourceIdsThisRun?: CardInstanceId[];
  oliviaSalazarUsedSourceIdsThisRun?: CardInstanceId[];
  oliviaSalazarTemporaryRezzedIceIds?: CardInstanceId[];
  successfulRunInterventionUsedSourceIds?: CardInstanceId[];
  successfulRunInterventionWindowClosed?: boolean;
  socialEngineeringAutoPassIceId?: CardInstanceId;
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
  speedTrapPendingRezCardId?: CardInstanceId;
  speedTrapPendingRezTimingPoint?: string;
  speedTrapPendingRezActiveSide?: Side;
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
  promisesPromisesAgendaPointBonus?: {
    sourceDefinitionId: CardDefinitionId;
    sourceTitle: string;
    amount: 1;
    cardId?: CardInstanceId;
  };
  pirateBroadcast?: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    sourceTitle: string;
    pendingServerIds: Exclude<ServerId, "new_remote">[];
    successfulServerIds: Exclude<ServerId, "new_remote">[];
  };
  sirenStartRunRedirect?: {
    originalServerId: Exclude<ServerId, "new_remote">;
    sourceCardInstanceIds: CardInstanceId[];
    sourceDefinitionIds: CardDefinitionId[];
  };
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
  sneakPreviewTemporaryInstalls?: SneakPreviewTemporaryInstall[];
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
  };
  specialZoneHarness?: SpecialZoneTestHarness;
  deckMetadata?: {
    runner: DeckPublicMetadata;
    corp: DeckPublicMetadata;
  };
  run?: RunState;
  trace?: TraceState;
  secretSpendComparison?: {
    source: "too_many_doors";
    runId: string;
    sourceIceId: CardInstanceId;
    subroutineIndex: number;
    corpSpend?: number;
  };
  socialEngineeringSecret?: {
    sourceCardId: CardInstanceId;
    hiddenAmount: number;
  };
  bizarreEncryptionDelayedAgendas?: Array<{
    agendaId: CardInstanceId;
    serverId: Exclude<ServerId, "new_remote">;
  }>;
  acmeSavingsAndLoanObligations?: number;
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
    prearrangedDropPending?: boolean;
    promisesPromisesNextAgendaAccess?: boolean;
    promisesPromisesSourceDefinitionId?: CardDefinitionId;
    promisesPromisesSourceTitle?: string;
    pirateBroadcastPending?: {
      sourceCardId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      sourceTitle: string;
      pendingServerIds: Exclude<ServerId, "new_remote">[];
      successfulServerIds: Exclude<ServerId, "new_remote">[];
    };
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
    allNighterBonusRunPending?: boolean;
    forgoNextActionPending?: boolean;
    forgoNextActionsPending?: number;
    runLockActionsPending?: number;
    fangRunLockCreditCost?: number;
    valuPakProgramInstallActionsRemaining?: number;
    valuPakTemporaryProgramInstallCredits?: number;
    shellTradersStartTurnResolvedSourceIds?: CardInstanceId[];
    bodyweightDataCrecheExtraRunPending?: boolean;
    bodyweightDataCrecheExtraRunUsedThisTurn?: boolean;
    startupImmolatorUsedSourceIdsThisTurn?: CardInstanceId[];
    preyingMantisUsedSourceIdsThisTurn?: CardInstanceId[];
    preyingMantisDamageDueSourceIdsThisTurn?: CardInstanceId[];
    questForCattekinPermanentActionGain?: boolean;
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
    disinfectantUsedSourceIdsThisTurn?: CardInstanceId[];
    employeeEmpowermentStartTurnResolvedSourceIds?: CardInstanceId[];
    pdcaUsedSourceIdsThisTurn?: CardInstanceId[];
  };
  ambushHarness?: {
    enabled: boolean;
    triggerDefinitionId?: CardDefinitionId;
  };
  poxCountersByServer?: Partial<
    Record<Exclude<ServerId, "new_remote">, number>
  >;
  faitAccompliCountersByServer?: Partial<
    Record<Exclude<ServerId, "new_remote">, number>
  >;
  spyCountersByServer?: Partial<Record<Exclude<ServerId, "new_remote">, number>>;
  purgeableRunnerVirusCounters?: PurgeableRunnerVirusCounterState;
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
  | "remove_tags";

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
  breakTags?: string[];
  sourceDefinitionId?: CardDefinitionId;
  sourceTitle?: string;
  dynamicSourceKind?: "additional_subroutine" | "run_duration_additional_subroutine";
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
  ownDeckDoctrine?: AiDeckDoctrineProfile;
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
  "detailSections"
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
  ownDeckDoctrine?: {
    schemaVersion?: string;
    side: Side;
    confidence: number;
    archetypeTags: string[];
    riskFlags: string[];
  };
  doctrinePlanWeight?: number;
};

const AI_DECISION_DEBUG_FORBIDDEN_KEY_PATTERN =
  /(?:privatePayload|cardInstances|fullGameState|FullState|sessionToken|reconnectToken|joinToken|tokenHash|privateDeckSnapshots|decklist|deckList|deckContents|runnerDeck|corpDeck|opponentHand|opponentHq|hqContents|rdContents|rndContents|stackContents|handContents|deckCards|sessions?)/i;
const AI_DECISION_DEBUG_FORBIDDEN_VALUE_PATTERN =
  /(?:privatePayload|cardInstances|fullGameState|FullState|sessionToken|reconnectToken|joinToken|tokenHash|decklist|hidden-card|hidden-deck-card)/i;

export function sanitizeAiDecisionDebug(debug: unknown): AiDecisionDebug | undefined {
  if (!debug || typeof debug !== "object" || Array.isArray(debug)) return undefined;
  const source = debug as Record<string, unknown>;
  const aiLevel = typeof source.aiLevel === "number" && Number.isFinite(source.aiLevel) ? source.aiLevel : 0;
  const result: AiDecisionDebug = {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel
  };
  const stringFields = ["summary", "planId", "planKind", "selectedActionType", "seed", "profileId", "memoryVersion"] as const;
  for (const field of stringFields) {
    const value = sanitizeAiDecisionDebugString(source[field]);
    if (value !== undefined) result[field] = value;
  }
  const numberFields = ["score", "confidence", "timeBudgetMs", "doctrinePlanWeight"] as const;
  for (const field of numberFields) {
    const value = source[field];
    if (typeof value === "number" && Number.isFinite(value)) result[field] = value;
  }
  const booleanFields = ["fallbackUsed", "timeoutUsed"] as const;
  for (const field of booleanFields) {
    const value = source[field];
    if (typeof value === "boolean") result[field] = value;
  }
  const stringArrayFields = ["visibleReasons", "whyNot", "longTermPlan", "warnings", "uncertainty", "evidence", "facts", "hypotheses", "invalidations", "beliefUncertainty"] as const;
  for (const field of stringArrayFields) {
    const value = sanitizeAiDecisionDebugStringArray(source[field]);
    if (value) result[field] = value;
  }
  const rankedAlternatives = sanitizeAiDecisionRankedAlternatives(source.rankedAlternatives);
  if (rankedAlternatives) result.rankedAlternatives = rankedAlternatives;
  const actionAlternatives = sanitizeAiDecisionActionAlternatives(source.actionAlternatives);
  if (actionAlternatives) result.actionAlternatives = actionAlternatives;
  const scoreBreakdown = sanitizeAiDecisionScoreComponents(source.scoreBreakdown);
  if (scoreBreakdown) result.scoreBreakdown = scoreBreakdown;
  const detailSections = sanitizeAiDecisionDetailSections(source.detailSections);
  if (detailSections) result.detailSections = detailSections;
  const opponentModel = sanitizeAiDecisionDebugJson(source.opponentModel);
  if (opponentModel && typeof opponentModel === "object" && !Array.isArray(opponentModel)) result.opponentModel = opponentModel as Record<string, unknown>;
  const ownDeckDoctrine = sanitizeAiDecisionDebugDoctrine(source.ownDeckDoctrine);
  if (ownDeckDoctrine) result.ownDeckDoctrine = ownDeckDoctrine;
  return result;
}

function sanitizeAiDecisionRankedAlternatives(value: unknown): AiDecisionRankedAlternative[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const alternatives = value
    .slice(0, 24)
    .map((entry): AiDecisionRankedAlternative | undefined => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;
      const source = entry as Record<string, unknown>;
      const rank = typeof source.rank === "number" && Number.isFinite(source.rank) ? Math.max(1, Math.round(source.rank)) : undefined;
      if (rank === undefined) return undefined;
      const result: AiDecisionRankedAlternative = { rank };
      for (const field of ["planId", "planKind", "selectedActionType", "summary"] as const) {
        const sanitized = sanitizeAiDecisionDebugString(source[field]);
        if (sanitized !== undefined) result[field] = sanitized;
      }
      for (const field of ["score", "confidence"] as const) {
        const numberValue = source[field];
        if (typeof numberValue === "number" && Number.isFinite(numberValue)) result[field] = numberValue;
      }
      for (const field of ["visibleReasons", "whyNot", "warnings"] as const) {
        const values = sanitizeAiDecisionDebugStringArray(source[field]);
        if (values) result[field] = values;
      }
      const scoreBreakdown = sanitizeAiDecisionScoreComponents(source.scoreBreakdown);
      if (scoreBreakdown) result.scoreBreakdown = scoreBreakdown;
      return result;
    })
    .filter((entry): entry is AiDecisionRankedAlternative => entry !== undefined);
  return alternatives.length > 0 ? alternatives : undefined;
}

function sanitizeAiDecisionActionAlternatives(value: unknown): AiDecisionActionAlternative[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const alternatives = value
    .slice(0, 32)
    .map((entry): AiDecisionActionAlternative | undefined => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;
      const source = entry as Record<string, unknown>;
      const rank = typeof source.rank === "number" && Number.isFinite(source.rank) ? Math.max(1, Math.round(source.rank)) : undefined;
      const actionId = sanitizeAiDecisionDebugString(source.actionId);
      const actionType = sanitizeAiDecisionDebugString(source.actionType);
      const selected = source.selected;
      if (rank === undefined || !actionId || !actionType || typeof selected !== "boolean") return undefined;
      const result: AiDecisionActionAlternative = { rank, actionId, actionType, selected };
      if (typeof source.excluded === "boolean") result.excluded = source.excluded;
      for (const field of ["label", "source", "sourceTitle"] as const) {
        const sanitized = sanitizeAiDecisionDebugString(source[field]);
        if (sanitized !== undefined) result[field] = sanitized;
      }
      const priority = source.priority;
      if (typeof priority === "number" && Number.isFinite(priority)) result.priority = priority;
      const scoreBreakdown = sanitizeAiDecisionScoreComponents(source.scoreBreakdown);
      if (scoreBreakdown) result.scoreBreakdown = scoreBreakdown;
      const whyChosen = sanitizeAiDecisionDebugStringArray(source.whyChosen);
      if (whyChosen) result.whyChosen = whyChosen;
      const whyNot = sanitizeAiDecisionDebugStringArray(source.whyNot);
      if (whyNot) result.whyNot = whyNot;
      const economy = sanitizeAiDecisionActionEconomy(source.economy);
      if (economy) result.economy = economy;
      return result;
    })
    .filter((entry): entry is AiDecisionActionAlternative => entry !== undefined);
  return alternatives.length > 0 ? alternatives : undefined;
}

function sanitizeAiDecisionActionEconomy(value: unknown): AiDecisionActionEconomyDetail | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const economyKind = sanitizeAiDecisionDebugString(source.economyKind);
  if (!economyKind) return undefined;
  const result: AiDecisionActionEconomyDetail = { economyKind };
  const ability = sanitizeAiDecisionDebugString(source.ability);
  if (ability !== undefined) result.ability = ability;
  const economyNeed = sanitizeAiDecisionDebugString(source.economyNeed);
  if (economyNeed !== undefined) result.economyNeed = economyNeed;
  for (const field of ["immediateGain", "netCredits", "storedCredits", "futurePoolAfter"] as const) {
    const numberValue = source[field];
    if (typeof numberValue === "number" && Number.isFinite(numberValue)) result[field] = numberValue;
  }
  return result;
}

function sanitizeAiDecisionScoreComponents(value: unknown): AiDecisionScoreComponent[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const components = value
    .slice(0, 16)
    .map((entry): AiDecisionScoreComponent | undefined => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;
      const source = entry as Record<string, unknown>;
      const key = sanitizeAiDecisionDebugString(source.key);
      const label = sanitizeAiDecisionDebugString(source.label);
      const componentValue = source.value;
      if (!key || !label || typeof componentValue !== "number" || !Number.isFinite(componentValue)) return undefined;
      const result: AiDecisionScoreComponent = {
        key,
        label,
        value: componentValue
      };
      const weight = source.weight;
      if (typeof weight === "number" && Number.isFinite(weight)) result.weight = weight;
      const reason = sanitizeAiDecisionDebugString(source.reason);
      if (reason !== undefined) result.reason = reason;
      return result;
    })
    .filter((entry): entry is AiDecisionScoreComponent => entry !== undefined);
  return components.length > 0 ? components : undefined;
}

function sanitizeAiDecisionDetailSections(value: unknown): AiDecisionDetailSection[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const sections = value
    .slice(0, 8)
    .map((entry): AiDecisionDetailSection | undefined => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;
      const source = entry as Record<string, unknown>;
      const id = sanitizeAiDecisionDebugString(source.id);
      const title = sanitizeAiDecisionDebugString(source.title);
      const items = sanitizeAiDecisionDebugStringArray(source.items, 96);
      if (!id || !title || !items) return undefined;
      return { id, title, items };
    })
    .filter((entry): entry is AiDecisionDetailSection => entry !== undefined);
  return sections.length > 0 ? sections : undefined;
}

function sanitizeAiDecisionDebugDoctrine(value: unknown): AiDecisionDebug["ownDeckDoctrine"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const side = source.side === "runner" || source.side === "corp" ? source.side : undefined;
  const confidence = typeof source.confidence === "number" && Number.isFinite(source.confidence) ? source.confidence : undefined;
  if (!side || confidence === undefined) return undefined;
  return {
    ...(typeof source.schemaVersion === "string" ? { schemaVersion: source.schemaVersion } : {}),
    side,
    confidence,
    archetypeTags: sanitizeAiDecisionDebugStringArray(source.archetypeTags) ?? [],
    riskFlags: sanitizeAiDecisionDebugStringArray(source.riskFlags) ?? []
  };
}

function sanitizeAiDecisionDebugJson(value: unknown, depth = 0): unknown {
  if (depth > 4) return undefined;
  if (typeof value === "string") return sanitizeAiDecisionDebugString(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, 16)
      .map((entry) => sanitizeAiDecisionDebugJson(entry, depth + 1))
      .filter((entry) => entry !== undefined);
  }
  if (!value || typeof value !== "object") return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 32)) {
    if (AI_DECISION_DEBUG_FORBIDDEN_KEY_PATTERN.test(key)) {
      result[key] = "[redacted-debug-field]";
      continue;
    }
    const sanitized = sanitizeAiDecisionDebugJson(entry, depth + 1);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

function sanitizeAiDecisionDebugStringArray(value: unknown, limit = 16): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .slice(0, limit)
    .map((entry) => sanitizeAiDecisionDebugString(entry))
    .filter((entry): entry is string => entry !== undefined);
}

function sanitizeAiDecisionDebugString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return AI_DECISION_DEBUG_FORBIDDEN_VALUE_PATTERN.test(value) ? "[redacted-debug-value]" : value;
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

const ONR_V1_LOCAL_PRIVATE = "onr_v1_limited_private_local";

function onrBreaker(params: {
  id: string;
  title: string;
  subtypes: string[];
  installCost: number;
  memoryCost: number;
  strength: number;
  breakCost: number;
  pumpCost?: number;
  iceSubtype: string;
  iceLabel: string;
  rulesText?: string;
  extraMechanics?: string[];
}): CardDefinition {
  const pumpText =
    params.pumpCost === undefined
      ? ""
      : ` ${params.pumpCost} Credits: +1 strength.`;
  const mechanics = [
    "install_program",
    "memory",
    ...(params.pumpCost === undefined ? [] : ["pump_breaker"]),
    "break_subroutine",
    ...(params.extraMechanics ?? []),
    ONR_V1_LOCAL_PRIVATE,
  ];
  return {
    id: params.id,
    title: params.title,
    side: "runner",
    type: "program",
    subtypes: params.subtypes,
    implementationStatus: "playable_mvp",
    installCost: params.installCost,
    memoryCost: params.memoryCost,
    strength: params.strength,
    rulesText:
      params.rulesText ??
      `${params.breakCost} Credits: Break 1 ${params.iceLabel} subroutine.${pumpText}`,
    abilities: [
      ...(params.pumpCost === undefined
        ? []
        : [
            {
              id: `${params.id}_pump`,
              type: "pump_strength" as const,
              cost: { credits: params.pumpCost },
              amount: 1,
              timingPoint: "run.encounter_ice" as const,
            },
          ]),
      {
        id: `${params.id}_break`,
        type: "break_subroutine",
        cost: { credits: params.breakCost },
        iceSubtype: params.iceSubtype,
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics,
  };
}

function onrUniversalBreaker(params: {
  id: string;
  title: string;
  subtypes: string[];
  installCost: number;
  memoryCost: number;
  strength: number;
  breakCost: number;
  pumpCost: number;
  rulesText?: string;
}): CardDefinition {
  return {
    id: params.id,
    title: params.title,
    side: "runner",
    type: "program",
    subtypes: params.subtypes,
    implementationStatus: "playable_mvp",
    installCost: params.installCost,
    memoryCost: params.memoryCost,
    strength: params.strength,
    rulesText:
      params.rulesText ??
      `${params.breakCost} Credits: Break 1 ice subroutine. ${params.pumpCost} Credits: +1 strength.`,
    abilities: [
      {
        id: `${params.id}_pump`,
        type: "pump_strength",
        cost: { credits: params.pumpCost },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: `${params.id}_break`,
        type: "break_subroutine",
        cost: { credits: params.breakCost },
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
      ONR_V1_LOCAL_PRIVATE,
    ],
  };
}

function onrIce(params: {
  id: string;
  title: string;
  subtypes: string[];
  rezCost: number;
  strength: number;
  rulesText: string;
  subroutines: SubroutineDefinition[];
  mechanics?: string[];
}): CardDefinition {
  return {
    id: params.id,
    title: params.title,
    side: "corp",
    type: "ice",
    subtypes: params.subtypes,
    implementationStatus: "playable_mvp",
    rezCost: params.rezCost,
    strength: params.strength,
    rulesText: params.rulesText,
    subroutines: params.subroutines,
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      ...(params.mechanics ?? []),
      ONR_V1_LOCAL_PRIVATE,
    ],
  };
}

function onrEtr(id: string): SubroutineDefinition {
  return { id, type: "end_the_run" };
}

function onrNetDamage(id: string, amount: number): SubroutineDefinition {
  return { id, type: "do_damage", damageType: "net", amount };
}

function onrMeatDamage(id: string, amount: number): SubroutineDefinition {
  return { id, type: "do_damage", damageType: "meat", amount };
}

function onrCoreDamage(id: string, amount: number): SubroutineDefinition {
  return { id, type: "do_damage", damageType: "core", amount };
}

function onrTrashInstalledProgram(id: string): SubroutineDefinition {
  return { id, type: "trash_installed_program" };
}

function onrSetRunEncounterTax(
  id: string,
  amount: number,
): SubroutineDefinition {
  return { id, type: "set_run_encounter_tax", amount };
}

function onrSetRunBreakSubroutineCostModifier(
  id: string,
  amount: number,
): SubroutineDefinition {
  return { id, type: "set_run_break_subroutine_cost_modifier", amount };
}

function onrSetRunFutureEndTheRunSubroutine(
  id: string,
): SubroutineDefinition {
  return { id, type: "set_run_future_end_the_run_subroutine" };
}

function onrSetRunViral15(id: string): SubroutineDefinition {
  return { id, type: "set_run_viral_15" };
}

function onrSetRunFutureStrengthBonus(
  id: string,
  amount: number,
): SubroutineDefinition {
  return { id, type: "set_run_future_strength_bonus", amount };
}

function onrSetNextEncounterFatalDamage(
  id: string,
  amount: number,
): SubroutineDefinition {
  return {
    id,
    type: "set_next_encounter_unless_fully_break_damage",
    damageType: "net",
    amount,
  };
}

function onrSetNextEncounterLock(id: string): SubroutineDefinition {
  return { id, type: "set_next_encounter_lock" };
}

function onrSetNextEncounterNoBreakSubroutines(
  id: string,
): SubroutineDefinition {
  return { id, type: "set_next_encounter_no_break_subroutines" };
}

function onrSetRunJackOutLock(id: string): SubroutineDefinition {
  return { id, type: "set_run_jack_out_lock" };
}

function onrSetRunnerForgoNextAction(id: string): SubroutineDefinition {
  return { id, type: "set_runner_forgo_next_action" };
}

function onrSetRunnerRunLockActions(
  id: string,
  amount: number,
): SubroutineDefinition {
  return { id, type: "set_runner_run_lock_actions", amount };
}

function onrRevealCorpRdTop(id: string): SubroutineDefinition {
  return { id, type: "reveal_corp_rd_top" };
}

function onrReorderCorpRdTop2(id: string): SubroutineDefinition {
  return { id, type: "reorder_corp_rd_top2" };
}

function onrRewindRunToRezzedIceByDie(id: string): SubroutineDefinition {
  return { id, type: "rewind_run_to_rezzed_ice_by_die" };
}

function onrMemoryChip(params: {
  id: string;
  title: string;
  installCost: number;
  memoryLimitBonus: number;
}): CardDefinition {
  return {
    id: params.id,
    title: params.title,
    side: "runner",
    type: "hardware",
    subtypes: ["chip"],
    implementationStatus: "playable_mvp",
    installCost: params.installCost,
    memoryLimitBonus: params.memoryLimitBonus,
    rulesText: `Provides +${params.memoryLimitBonus} MU.`,
    mechanics: [
      "install_hardware",
      "modify_memory_limit",
      ONR_V1_LOCAL_PRIVATE,
    ],
  };
}

const ONR_V1_LIMITED_PLAYABLE_CARDS: CardDefinition[] = [
  {
    id: "onr_v1_005_bartmoss-memorial-icebreaker",
    title: "Bartmoss Memorial Icebreaker",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "random"],
    implementationStatus: "playable_mvp",
    installCost: 5,
    memoryCost: 1,
    strength: 0,
    rulesText:
      "1 credit: Break ice subroutine.\n1 credit: +1 strength.\nAfter passing each piece of ice, roll a die if you used Bartmoss Memorial Icebreaker to break any subroutines of that ice. On a 1, trash Bartmoss Memorial Icebreaker.",
    abilities: [
      {
        id: "onr_v1_005_bartmoss_memorial_icebreaker_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "onr_v1_005_bartmoss_memorial_icebreaker_break",
        type: "break_subroutine",
        cost: { credits: 1 },
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
      "deterministic_die_roll",
      "post_encounter_trigger",
      "trash_self",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_007_blink",
    title: "Blink",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "random"],
    implementationStatus: "playable_mvp",
    installCost: 5,
    memoryCost: 1,
    strength: 5,
    rulesText:
      "0 credits: Roll a die. On a 4, 5, or 6, break ice subroutine; otherwise, suffer that much Net damage.\nUse this ability only once on each subroutine during each encounter with a piece of ice.",
    abilities: [
      {
        id: "onr_v1_007_blink_break",
        type: "break_subroutine",
        cost: { credits: 0 },
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "break_subroutine",
      "deterministic_die_roll",
      "net_damage",
      "encounter_usage_limit",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_009_butcher-boy",
    title: "Butcher Boy",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    rulesText:
      "Whenever you make a successful run on HQ, give the Corp a Butcher Boy counter. For every two Butcher Boy counters, gain 1 at the start of each of your turns. The Corp may remove all Virus counters by forgoing its next three actions.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "virus",
      "purge",
      "recurring_start_turn",
      "hq_run_success_trigger",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_010_cascade",
    title: "Cascade",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 4,
    memoryCost: 1,
    rulesText:
      "Whenever you make a successful run on R&D, give the Corp a Cascade counter. Every two Cascade counters require the Corp to trash faceup one card stored in R&D at the start of each of its turns. The Corp may remove all Virus counters by forgoing its next three actions.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "virus",
      "purge",
      "successful_rd_run_counter",
      "corp_start_turn_trash",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_017_deep-thought",
    title: "Deep Thought",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Whenever you make a successful run on R&D, give the Corp a Thought counter. Three or more Thought counters allow you to look at the top card of R&D at the start of each of your turns. The Corp may remove all Virus counters by forgoing its next three actions.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "virus",
      "purge",
      "successful_rd_run_counter",
      "top_rd_look",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_013_cockroach",
    title: "Cockroach",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Whenever you make a successful run on HQ, give the Corp a Cockroach counter. Two or more Cockroach counters cause all discards from HQ to become random. The Corp may remove all Virus counters by forgoing its next three actions.",
    mechanics: [
      "install_program",
      "memory",
      "virus",
      "successful_run_trigger",
      "hq_discard_randomization",
      "deterministic_random",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_001_afreet",
    title: "Afreet",
    side: "runner",
    type: "program",
    subtypes: ["daemon"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    rulesText:
      "Afreet can host up to 3 MU of programs. Hosted programs use Afreet's hosting capacity instead of Runner MU.",
    mechanics: [
      "install_program",
      "memory",
      "hosting",
      "subtype_daemon",
      "hosted_program_lifecycle",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_012_clown",
    title: "Clown",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 4,
    memoryCost: 1,
    rulesText: "All ice is encountered with its strength reduced by 1.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "encounter_ice",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrBreaker({
    id: "onr_v1_015_codeslinger",
    title: "Codeslinger",
    subtypes: ["icebreaker", "killer"],
    installCost: 7,
    memoryCost: 1,
    strength: 3,
    breakCost: 1,
    iceSubtype: "sentry",
    iceLabel: "sentry",
  }),
  onrUniversalBreaker({
    id: "onr_v1_018_dogcatcher",
    title: "Dogcatcher",
    subtypes: ["icebreaker"],
    installCost: 3,
    memoryCost: 1,
    strength: 3,
    breakCost: 1,
    pumpCost: 1,
    rulesText:
      "1 Credits: Break 1 Pit Bull, Hellhound, Bloodhound, or Watchdog subroutine. 1 Credits: +1 strength.",
  }),
  onrUniversalBreaker({
    id: "onr_v1_019_dropp",
    title: "Dropp",
    subtypes: ["icebreaker"],
    installCost: 3,
    memoryCost: 1,
    strength: 4,
    breakCost: 0,
    pumpCost: 1,
    rulesText:
      "0 Credits: Break all subroutines of a piece of ice, and end the run. 1 Credits: +1 strength.",
  }),
  onrBreaker({
    id: "onr_v1_052_raffles",
    title: "Raffles",
    subtypes: ["icebreaker"],
    installCost: 7,
    memoryCost: 1,
    strength: 4,
    breakCost: 1,
    pumpCost: 2,
    iceSubtype: "code_gate",
    iceLabel: "code gate",
  }),
  onrBreaker({
    id: "onr_v1_054_raptor",
    title: "Raptor",
    subtypes: ["icebreaker", "killer"],
    installCost: 1,
    memoryCost: 1,
    strength: 1,
    breakCost: 2,
    pumpCost: 1,
    iceSubtype: "sentry",
    iceLabel: "sentry",
  }),
  onrBreaker({
    id: "onr_v1_070_tinweasel",
    title: "Tinweasel",
    subtypes: ["icebreaker"],
    installCost: 5,
    memoryCost: 1,
    strength: 3,
    breakCost: 0,
    iceSubtype: "code_gate",
    iceLabel: "code gate",
  }),
  {
    id: "onr_v1_079_bodyweight-synthetic-blood",
    title: "Bodyweight™ Synthetic Blood",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText: "Draw five cards.",
    mechanics: ["play_event", "draw_cards", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_095_jack-n-joe",
    title: "Jack 'n' Joe",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Draw three cards.",
    mechanics: ["play_event", "draw_cards", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_097_livewires-contacts",
    title: "Livewire's Contacts",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Gain 3 credits.",
    mechanics: ["play_event", "gain_credits", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_108_score",
    title: "Score!",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 5,
    rulesText: "Gain 9 credits.",
    mechanics: ["play_event", "gain_credits", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_115_terrorist-reprisal",
    title: "Terrorist Reprisal",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText:
      "Play only if the Corp scored any Black Ops agendas during its last turn. The Corp discards five cards at random.",
    mechanics: [
      "play_event",
      "agenda_subtype_condition",
      "random_discard",
      "deterministic_random",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrBreaker({
    id: "onr_v1_006_black-dahlia",
    title: "Black Dahlia",
    subtypes: ["icebreaker", "killer"],
    installCost: 10,
    memoryCost: 1,
    strength: 5,
    breakCost: 2,
    pumpCost: 2,
    iceSubtype: "sentry",
    iceLabel: "sentry",
  }),
  onrBreaker({
    id: "onr_v1_014_codecracker",
    title: "Codecracker",
    subtypes: ["icebreaker"],
    installCost: 2,
    memoryCost: 1,
    strength: 0,
    breakCost: 0,
    pumpCost: 1,
    iceSubtype: "code_gate",
    iceLabel: "code gate",
  }),
  onrBreaker({
    id: "onr_v1_016_cyfermaster",
    title: "Cyfermaster™",
    subtypes: ["icebreaker"],
    installCost: 4,
    memoryCost: 1,
    strength: 5,
    breakCost: 2,
    pumpCost: 1,
    iceSubtype: "code_gate",
    iceLabel: "code gate",
  }),
  onrBreaker({
    id: "onr_v1_021_dwarf",
    title: "Dwarf",
    subtypes: ["icebreaker", "worm"],
    installCost: 6,
    memoryCost: 1,
    strength: 3,
    breakCost: 1,
    pumpCost: 1,
    iceSubtype: "wall",
    iceLabel: "wall",
  }),
  onrBreaker({
    id: "onr_v1_023_evil-twin",
    title: "Evil Twin",
    subtypes: ["icebreaker", "killer"],
    installCost: 6,
    memoryCost: 1,
    strength: 3,
    breakCost: 3,
    pumpCost: 1,
    iceSubtype: "sentry",
    iceLabel: "sentry",
    extraMechanics: [
      "damage_prevention",
      "damage_prevention_turn_limit",
      "core_damage",
    ],
  }),
  {
    id: "onr_v1_028_force-shield",
    title: "Force Shield",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    rulesText: "Prevents up to 2 net and/or core damage each turn.",
    mechanics: [
      "install_program",
      "memory",
      "damage_prevention",
      "damage_prevention_turn_limit",
      "core_damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_038_joan-of-arc",
    title: "Joan of Arc",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "[T]: Prevent one or more of your other installed programs from being trashed. 1 Credit: Prevent one or more of your other installed programs from being trashed, and bring Joan of Arc into your hand.",
    mechanics: [
      "install_program",
      "memory",
      "trash_prevention",
      "program_trash_prevention",
      "return_to_hand",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrBreaker({
    id: "onr_v1_030_grubb",
    title: "Grubb",
    subtypes: ["icebreaker", "worm"],
    installCost: 0,
    memoryCost: 1,
    strength: 0,
    breakCost: 1,
    pumpCost: 2,
    iceSubtype: "wall",
    iceLabel: "wall",
    extraMechanics: ["run_remainder_strength_bonus"],
  }),
  {
    id: "onr_v1_034_incubator",
    title: "Incubator",
    side: "runner",
    type: "program",
    subtypes: ["virus", "random"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Whenever you make a successful run, give the Corp an Incubate counter. Each Incubate counter necessitates a die roll at the start of each of your turns; on each 6, choose a Virus counter and exchange that counter for two counters of the same type. The Corp may remove all Virus counters by forgoing its next three actions.",
    mechanics: [
      "install_program",
      "memory",
      "virus",
      "successful_run_trigger",
      "start_of_turn_trigger",
      "deterministic_die_roll",
      "counter_transform_choice",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_032_i-spy",
    title: "I Spy",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "[T]: Put a Spy counter in a data fort. A Spy counter exposes all cards installed inside or on a fort containing it. The Corp may remove a Spy counter by taking an action to pay 4. Use this ability only immediately after a successful run on that fort.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "spy_counter",
      "expose",
      "successful_run_trigger",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrBreaker({
    id: "onr_v1_036_jackhammer",
    title: "Jackhammer",
    subtypes: ["icebreaker", "noisy"],
    installCost: 1,
    memoryCost: 1,
    strength: 0,
    breakCost: 0,
    pumpCost: 1,
    iceSubtype: "wall",
    iceLabel: "wall",
    rulesText:
      "0 Credits: Break 1 wall subroutine. 1 Credits: +1 strength. Whenever you break a wall subroutine with Jackhammer, lose 1 from a Stealth card, if you can.",
    extraMechanics: ["subtype_noisy"],
  }),
  onrUniversalBreaker({
    id: "onr_v1_039_krash",
    title: "Krash",
    subtypes: ["icebreaker"],
    installCost: 0,
    memoryCost: 1,
    strength: 0,
    breakCost: 2,
    pumpCost: 2,
  }),
  onrBreaker({
    id: "onr_v1_040_loony-goon",
    title: "Loony Goon",
    subtypes: ["icebreaker", "killer"],
    installCost: 4,
    memoryCost: 1,
    strength: 0,
    breakCost: 1,
    pumpCost: 1,
    iceSubtype: "sentry",
    iceLabel: "sentry",
  }),
  {
    id: "onr_v1_042_mouse",
    title: "Mouse",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    rulesText:
      "Installed Hidden-Zone helper: expose one unrezzed installed Corp card in a chosen fort.",
    mechanics: [
      "install_program",
      "memory",
      "expose",
      "reveal",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_046_pattels-virus",
    title: "Pattel's Virus",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    memoryCost: 1,
    rulesText:
      "Whenever you make a successful run, put a Pattel counter on a piece of ice that had all its subroutines broken during that run. Each Pattel counter on a piece of ice reduces its strength by 1. The Corp may remove all Virus counters by forgoing its next three actions.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "virus",
      "purge",
      "run_success_trigger",
      "encounter_ice",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_049_pox",
    title: "Pox",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Whenever you make a successful run, put a Pox counter in the fort that was run. Every two Pox counters in a fort require the Corp to pay 1, in addition to any other costs, to install a card inside or on that fort. The Corp may remove all Virus counters by forgoing its next three actions.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "virus",
      "purge",
      "run_success_trigger",
      "install_cost_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_058_seeya",
    title: "SeeYa",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "Installed Hidden-Zone helper: expose one unrezzed installed Corp card in a chosen fort.",
    mechanics: [
      "install_program",
      "memory",
      "expose",
      "reveal",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_059_self-modifying-code",
    title: "Self-Modifying Code",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 2,
    rulesText:
      "Trash Self-Modifying Code: search your stack for a program, reveal it, pay its install cost and install it. Use during an ICE encounter. Shuffle your stack afterwards; if memory is short, choose installed programs to trash first.",
    mechanics: [
      "install_program",
      "memory",
      "search_stack",
      "reveal",
      "shuffle",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrBreaker({
    id: "onr_v1_060_shaka",
    title: "Shaka",
    subtypes: ["icebreaker", "killer"],
    installCost: 4,
    memoryCost: 1,
    strength: 2,
    breakCost: 1,
    pumpCost: 2,
    iceSubtype: "sentry",
    iceLabel: "sentry",
  }),
  {
    id: "onr_v1_064_skivviss",
    title: "Skivviss",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "Whenever you make a successful run on R&D, give the Corp a Skivviss counter. Each Skivviss counter requires the Corp to draw one extra card at the start of each of its turns. The Corp may remove all Virus counters by forgoing its next three actions.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "virus",
      "successful_run_trigger",
      "corp_start_turn_draw",
      "purge",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrBreaker({
    id: "onr_v1_066_snowball",
    title: "Snowball",
    subtypes: ["icebreaker", "killer"],
    installCost: 10,
    memoryCost: 1,
    strength: 0,
    breakCost: 1,
    pumpCost: 1,
    iceSubtype: "sentry",
    iceLabel: "sentry",
    rulesText:
      "Snowball has +1 strength for each subroutine it has broken during a run, until the end of that run. 1 Credits: Break 1 sentry subroutine. 1 Credits: +1 strength.",
  }),
  onrBreaker({
    id: "onr_v1_072_wild-card",
    title: "Wild Card",
    subtypes: ["icebreaker", "killer"],
    installCost: 0,
    memoryCost: 1,
    strength: 0,
    breakCost: 0,
    pumpCost: 3,
    iceSubtype: "sentry",
    iceLabel: "sentry",
  }),
  {
    id: "onr_v1_011_cloak",
    title: "Cloak",
    side: "runner",
    type: "program",
    subtypes: ["stealth"],
    implementationStatus: "playable_mvp",
    installCost: 7,
    memoryCost: 1,
    recurringCredits: 3,
    rulesText:
      "Put 3 from the bank on Cloak when it is installed. Use these bits only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use any of these bits, replace them at the start of your next turn.",
    mechanics: [
      "install_program",
      "memory",
      "subtype_stealth",
      "recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_069_succubus",
    title: "Succubus",
    side: "runner",
    type: "program",
    subtypes: ["daemon"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "Succubus can have up to 3 MU of programs installed in it. If Succubus leaves play, trash all programs installed in it.",
    mechanics: [
      "install_program",
      "memory",
      "hosting",
      "subtype_daemon",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrBreaker({
    id: "onr_v1_074_worm",
    title: "Worm",
    subtypes: ["icebreaker", "worm"],
    installCost: 4,
    memoryCost: 1,
    strength: 2,
    breakCost: 0,
    pumpCost: 3,
    iceSubtype: "wall",
    iceLabel: "wall",
  }),
  {
    id: "onr_v1_076_all-nighter",
    title: "All-Nighter",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Make a run; whether or not that run is successful, you may then make another run.",
    mechanics: ["play_event", "start_run", "run_flow", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_081_custodial-position",
    title: "Custodial Position",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText:
      "Make a run on R&D. If successful, access two additional cards from R&D.",
    mechanics: [
      "play_event",
      "start_run",
      "breach",
      "multiaccess",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_083_desperate-competitor",
    title: "Desperate Competitor",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Play only if you liberated any Gray Ops agendas this turn. Score 1 agenda point.",
    mechanics: [
      "play_event",
      "agenda_point_gain",
      "agenda_subtype_condition",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_084_edited-shipping-manifests",
    title: "Edited Shipping Manifests",
    side: "runner",
    type: "event",
    subtypes: ["sabotage"],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Make a run on HQ. If run is successful, and the Corp has any bits when you would access HQ, do not access cards from HQ; instead, the Corp loses 1 and gives you a tag, and you gain 10.",
    mechanics: [
      "play_event",
      "start_run",
      "breach",
      "access_replacement",
      "tag",
      "gain_credits",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_087_forgotten-backup-chip",
    title: "Forgotten Backup Chip",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Search your stack for a program, reveal it and bring it into your grip. Shuffle your stack afterwards.",
    mechanics: [
      "play_event",
      "search_stack",
      "reveal",
      "shuffle",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_088_fortress-respecification",
    title: "Fortress Respecification",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Expose an unrezzed installed Corp card in the chosen fort.",
    mechanics: [
      "play_event",
      "expose",
      "reveal",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_089_gideons-pawnshop",
    title: "Gideon's Pawnshop",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText:
      "Search your stack for a program, reveal it and bring it into your grip. Shuffle your stack afterwards.",
    mechanics: [
      "play_event",
      "search_stack",
      "reveal",
      "shuffle",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_092_ice-and-datas-guide-to-the-net",
    title: "Ice and Data's Guide to the Net",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Expose the outermost ice of each data fort.",
    mechanics: [
      "play_event",
      "expose",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_085_executive-wiretaps",
    title: "Executive Wiretaps",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText:
      "Make a run on HQ. If successful, access two additional cards from HQ.",
    mechanics: [
      "play_event",
      "start_run",
      "breach",
      "multiaccess",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_099_mantis-fixer-at-large",
    title: "Mantis, Fixer-at-Large",
    side: "runner",
    type: "event",
    subtypes: ["connection", "unique"],
    implementationStatus: "playable_mvp",
    cost: 3,
    rulesText:
      "Search your stack for a program, reveal it and bring it into your grip. Shuffle your stack afterwards.",
    mechanics: [
      "play_event",
      "search_stack",
      "reveal",
      "shuffle",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_110_sneak-preview",
    title: "Sneak Preview",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 3,
    rulesText: "Reveal the top card of your stack.",
    mechanics: [
      "play_event",
      "search_stack",
      "search_trash",
      "install_program",
      "temporary_install",
      "end_turn_return",
      "reveal",
      "shuffle",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_090_hot-tip-for-wns",
    title: "Hot Tip for WNS",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Score 1 agenda point if you liberated any Black Ops agendas this turn.",
    mechanics: [
      "play_event",
      "agenda_point_gain",
      "agenda_subtype_condition",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_094_inside-job",
    title: "Inside Job",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText:
      "Make a run. You automatically pass the first piece of ice you encounter during that run.",
    mechanics: ["play_event", "start_run", "bypass_ice", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_096_kilroy-was-here",
    title: "Kilroy Was Here",
    side: "runner",
    type: "event",
    subtypes: ["sabotage"],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Make a run on R&D; you may trash, at no cost, any cards you access that were stored in R&D, even if the cards cannot normally be trashed.",
    mechanics: [
      "play_event",
      "start_run",
      "breach",
      "access_trash_free",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_101_mit-west-tier",
    title: "MIT West Tier",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 3,
    rulesText:
      "Shuffle your grip, heap and stack together, draw five cards, then remove MIT West Tier from the game.",
    mechanics: [
      "play_event",
      "shuffle",
      "draw_cards",
      "removed_from_game",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_107_romp-through-hq",
    title: "Romp through HQ",
    side: "runner",
    type: "event",
    subtypes: ["sabotage"],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText:
      "Make a run on HQ; you may trash, at no cost, any cards you access that were stored in HQ, even if the cards cannot normally be trashed.",
    mechanics: [
      "play_event",
      "start_run",
      "breach",
      "access_trash_free",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_151_aujourdoui",
    title: "Aujourd'Oui",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "Look at the top five cards of your stack. You may bring any program cards among them into your grip. Pay 1 credit for each card taken this way, reveal those cards to the Corp, then shuffle your stack.",
    mechanics: [
      "install_resource",
      "search_stack",
      "shuffle",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_155_code-viral-cache",
    title: "Code Viral Cache",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText:
      "Play only if you made a successful run on HQ this turn. If the Corp purges Virus counters, choose up to two Virus counters that are not removed. The Corp may take an action and pay 5 to trash Code Viral Cache.",
    mechanics: [
      "install_resource",
      "successful_hq_run_condition",
      "virus_counter_purge_replacement",
      "corp_trash_action",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_156_corporate-ally",
    title: "Corporate Ally",
    side: "runner",
    type: "resource",
    subtypes: ["connection", "unique"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    rulesText:
      "Installing Corporate Ally costs 1 agenda point, in addition to the normal cost. The difficulty of all agendas is +1.",
    mechanics: [
      "install_resource",
      "unique_card",
      "agenda_point_cost",
      "agenda_difficulty_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_159_databroker",
    title: "Databroker",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText: "A, [T], 1 agenda point: Gain 10 credits.",
    mechanics: [
      "install_resource",
      "action_economy",
      "agenda_point_cost",
      "gain_credits",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_161_fall-guy",
    title: "Fall Guy",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText: "[T]: Avoid receiving a tag.",
    mechanics: ["install_resource", "tag_avoid", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_158_danshis-second-id",
    title: "Danshi's Second ID",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText: "A, [T]: Remove up to three tags, at no cost.",
    mechanics: [
      "install_resource",
      "tag_remove",
      "action_economy",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_163_floating-runner-bbs",
    title: "Floating Runner BBS",
    side: "runner",
    type: "resource",
    subtypes: ["bbs", "position"],
    implementationStatus: "playable_mvp",
    installCost: 6,
    rulesText: "Gain 1 credit at the start of each of your turns.",
    mechanics: [
      "install_resource",
      "start_of_turn_credit_gain",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_169_n-e-t-o",
    title: "N.E.T.O.",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "Installed Hidden-Zone helper: search your stack for a program, reveal it and bring it into your grip. Shuffle your stack afterwards.",
    mechanics: [
      "install_resource",
      "search_stack",
      "reveal",
      "shuffle",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_170_nomad-allies",
    title: "Nomad Allies",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    rulesText:
      "A, 1 Credit: Remove a tag, at no cost. [T]: Avoid receiving a tag.",
    mechanics: [
      "install_resource",
      "action_economy",
      "remove_tag",
      "tag_avoid",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_173_restrictive-net-zoning",
    title: "Restrictive Net Zoning",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText:
      "Choose a data fort when Restrictive Net Zoning is installed. The Corp must pay 2, in addition to the normal cost, to install ice on that fort.",
    mechanics: [
      "install_resource",
      "install_cost_modifier",
      "counter",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_174_rigged-investments",
    title: "Rigged Investments",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 4,
    rulesText:
      "Put 12 credits on Rigged Investments when it is installed. At the start of each of your turns, take 1 credit from Rigged Investments. When all credits have been removed, trash Rigged Investments.",
    mechanics: [
      "install_resource",
      "counter",
      "runner_start_turn_credit",
      "auto_trash",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_175_ronin-around",
    title: "Ronin Around",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 3,
    rulesText:
      "Installed Hidden-Zone helper: look at and reorder the top two cards of your stack.",
    mechanics: [
      "install_resource",
      "reorder_stack",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_176_the-shell-traders",
    title: "The Shell Traders",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "[A]: Set aside a program or hardware card from your grip face-up with Shell counters equal to its install cost. At the start of your turn, remove 1 Shell counter from one of those cards. 1 Credit: Remove 1 Shell counter. When the last Shell counter is removed, install that card at no cost.",
    mechanics: [
      "install_resource",
      "counter",
      "set_aside",
      "shell_counter",
      "delayed_install",
      "start_turn_counter_removal",
      "paid_counter_removal",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_177_the-short-circuit",
    title: "The Short Circuit",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText:
      "[A], [1]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.",
    mechanics: [
      "install_resource",
      "search",
      "reveal",
      "shuffle",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_180_smiths-pawnshop",
    title: "Smith's Pawnshop",
    side: "runner",
    type: "resource",
    subtypes: ["connection", "unique"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "At the start of each of your turns, you may trash one of your other installed cards to gain 2 credits.\nOnly one unique card of a particular name can be in play at a time.",
    mechanics: [
      "install_resource",
      "unique_card",
      "start_of_turn_optional_trash_for_credit",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_184_top-runners-conference",
    title: "Top Runners' Conference",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "Gain 2 credits at the start of each of your turns. Trash Top Runners' Conference when you make a run.",
    mechanics: [
      "install_resource",
      "start_of_turn_credit_gain",
      "trash_on_run",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_185_trauma-team",
    title: "Trauma Team",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "Put 2 Trauma counters on Trauma Team when it is installed. Trauma counter: Prevent 1 meat damage. A: Put 1 Trauma counter on Trauma Team.",
    mechanics: [
      "install_resource",
      "counter",
      "damage_prevention",
      "damage_prevention_counter_cost",
      "meat_damage",
      "action_counter",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_186_umbrella-policy",
    title: "Umbrella Policy",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "[T]: Prevent an installed program or hardware card from being trashed.",
    mechanics: [
      "install_resource",
      "trash_prevention",
      "program_trash_prevention",
      "hardware_trash_prevention",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_187_wilson-weeflerunner-apprentice",
    title: "Wilson, Weeflerunner Apprentice",
    side: "runner",
    type: "resource",
    subtypes: ["connection", "unique"],
    implementationStatus: "playable_mvp",
    installCost: 4,
    rulesText:
      "Once each of your turns, you may gain an action that can only be used to make a run. During that run, you cannot spend more than 3 credits to use icebreakers or increase your link. [T]: Avoid receiving a tag. [T]: Prevent any amount of meat damage.",
    mechanics: [
      "install_resource",
      "unique_card",
      "action_gain",
      "run_spending_cap",
      "tag_avoid",
      "damage_prevention",
      "meat_damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_179_silicon-saloon-franchise",
    title: "Silicon Saloon Franchise",
    side: "runner",
    type: "resource",
    subtypes: ["position"],
    implementationStatus: "playable_mvp",
    installCost: 8,
    rulesText: "A: Gain 1 credit and draw one card.",
    mechanics: [
      "install_resource",
      "action_economy",
      "draw_cards",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrBreaker({
    id: "onr_v1_073_wizards-book",
    title: "Wizard's Book",
    subtypes: ["icebreaker"],
    installCost: 5,
    memoryCost: 1,
    strength: 2,
    breakCost: 0,
    pumpCost: 2,
    iceSubtype: "code_gate",
    iceLabel: "code gate",
  }),
  {
    id: "onr_v1_145_wutech-mem-chip",
    title: "WuTech Mem Chip",
    side: "runner",
    type: "hardware",
    subtypes: ["chip"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText: "+1 memory limit.",
    mechanics: [
      "install_hardware",
      "modify_memory_limit",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_106_private-ldl-access",
    title: "Private LDL Access",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Make a run on HQ. If run is successful, do not access cards from HQ; instead, treat run as a successful run on R&D.",
    mechanics: [
      "play_event",
      "start_run",
      "breach",
      "access_replacement",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_082_deal-with-militech",
    title: "Deal with Militech",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Play only if you liberated a Research agenda this turn. Put a Militech counter on each installed icebreaker; each Militech counter gives +1 strength.",
    mechanics: [
      "play_event",
      "agenda_subtype_condition",
      "counter",
      "icebreaker_strength_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_091_hunt-club-bbs",
    title: "Hunt Club BBS",
    side: "runner",
    type: "event",
    subtypes: ["bbs"],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Expose up to three installed Corp cards.",
    mechanics: [
      "play_event",
      "expose",
      "reveal",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_114_temple-microcode-outlet",
    title: "Temple Microcode Outlet",
    side: "runner",
    type: "event",
    subtypes: ["bbs"],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Shuffle your stack afterwards.",
    mechanics: ["play_event", "search_stack", "shuffle", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_118_weather-to-finance-pipe",
    title: "Weather-to-Finance Pipe",
    side: "runner",
    type: "event",
    subtypes: ["sabotage"],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Make a run on HQ. If run is successful, do not access cards from HQ; instead, the Corp loses 4 credits.",
    mechanics: [
      "play_event",
      "start_run",
      "breach",
      "access_replacement",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_125_dermatech-bodyplating",
    title: "Dermatech Bodyplating",
    side: "runner",
    type: "hardware",
    subtypes: ["cybernetics"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText: "Prevents 1 meat damage each turn.",
    mechanics: [
      "install_hardware",
      "damage_prevention",
      "damage_prevention_turn_limit",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_121_armored-fridge",
    title: "Armored Fridge",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 3,
    rulesText:
      "Install with 7 Ablative counters. Remove 1 counter to prevent 1 meat damage; trash Armored Fridge when none remain.",
    mechanics: [
      "install_hardware",
      "counter",
      "damage_prevention",
      "damage_prevention_counter_cost",
      "meat_damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_127_full-body-conversion",
    title: "Full Body Conversion",
    side: "runner",
    type: "hardware",
    subtypes: ["cybernetics"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "Prevents all meat damage. For each 1 credit the Corp pays when meat damage is done, 1 meat damage is not prevented.",
    mechanics: [
      "install_hardware",
      "damage_prevention",
      "damage_prevention_full_meat",
      "corp_bypass_payment",
      "meat_damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_128_green-knight-surge-buffers",
    title: '"Green Knight" Surge Buffers',
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText: "Prevents 1 net damage each turn.",
    mechanics: [
      "install_hardware",
      "damage_prevention",
      "damage_prevention_turn_limit",
      "net_damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_130_lifesaver-nanosurgeons",
    title: "Lifesaver Nanosurgeons",
    side: "runner",
    type: "hardware",
    subtypes: ["cybernetics"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText:
      "A: Draw two cards. Use this ability only if you were damaged during any of your last three actions. [T]: Prevent 1 brain damage.",
    mechanics: [
      "install_hardware",
      "draw_cards",
      "recent_damage_gate",
      "damage_prevention",
      "core_damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_135_nasuko-cycle",
    title: "Nasuko Cycle",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText: "3 Credits: Avoid receiving a tag.",
    mechanics: ["install_hardware", "tag_avoid", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_139_r-and-d-interface",
    title: "R&D Interface",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 4,
    rulesText:
      "Installed access tool: access 1 additional card whenever you access R&D.",
    mechanics: [
      "install_hardware",
      "access",
      "breach",
      "multiaccess",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_143_techtronica-utility-suit",
    title: "Techtronica Utility Suit",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 6,
    rulesText:
      "Provides +1 MU. Prevents 1 meat damage each turn. Put 5 credits on Techtronica Utility Suit when it is installed. Use these credits only to pay for increasing your link. If you use any of these credits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.",
    mechanics: [
      "install_hardware",
      "memory",
      "damage_prevention",
      "damage_prevention_turn_limit",
      "meat_damage",
      "link",
      "recurring_credit",
      "deck_unique",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrMemoryChip({
    id: "onr_v1_144_tycho-mem-chip",
    title: "Tycho Mem Chip",
    installCost: 5,
    memoryLimitBonus: 3,
  }),
  onrMemoryChip({
    id: "onr_v1_146_zetatech-mem-chip",
    title: "Zetatech Mem Chip",
    installCost: 3,
    memoryLimitBonus: 2,
  }),
  {
    id: "onr_v1_129_hq-interface",
    title: "HQ Interface",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 4,
    rulesText:
      "Whenever you access cards from HQ, access one additional card from HQ.",
    mechanics: [
      "install_hardware",
      "breach",
      "multiaccess",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_220_tycho-extension",
    title: "Tycho Extension",
    side: "corp",
    type: "agenda",
    subtypes: ["asset"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 4,
    rulesText: "No additional ability.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_194_corporate-downsizing",
    title: "Corporate Downsizing",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 2,
    rulesText: "Scored agenda Hidden-Zone helper: reveal the top card of R&D.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "reveal",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_198_detroit-police-contract",
    title: "Detroit Police Contract",
    side: "corp",
    type: "agenda",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 1,
    rulesText:
      "Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "counter",
      "recurring_pool",
      "gain_credits",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_199_employee-empowerment",
    title: "Employee Empowerment",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 3,
    rulesText:
      "You may choose to draw an additional card at the start of each of your turns. [A]: Draw two cards.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "recurring_start_turn",
      "choice",
      "draw_cards",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_193_corporate-coup",
    title: "Corporate Coup",
    side: "corp",
    type: "agenda",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 5,
    agendaPoints: 2,
    rulesText:
      "Put 15 from the bank on Corporate Coup when you score it.\n[A]: Take 3 from Corporate Coup, if it has any bits.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "counter",
      "action_economy",
      "gain_credits",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_188_ai-chief-financial-officer",
    title: "AI Chief Financial Officer",
    side: "corp",
    type: "agenda",
    subtypes: ["asset"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 5,
    agendaPoints: 2,
    rulesText:
      "[A]: Shuffle cards stored in HQ and the Archives into R&D; then draw five cards.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda_action",
      "hidden_zone_shuffle",
      "draw_cards",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_201_executive-extraction",
    title: "Executive Extraction",
    side: "corp",
    type: "agenda",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 1,
    rulesText: "Difficulty of Gray Ops agendas is reduced by 1.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "agenda_difficulty_modifier",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_203_hostile-takeover",
    title: "Hostile Takeover",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 1,
    rulesText: "Gain 5 credits when scored.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "on_score_gain_credits",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_207_netwatch-operations-office",
    title: "Netwatch Operations Office",
    side: "corp",
    type: "agenda",
    subtypes: ["asset"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 5,
    agendaPoints: 2,
    rulesText: "[A]: Trace 2 - If trace is successful, give Runner a tag.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda_action",
      "trace",
      "link",
      "bid_amount",
      "add_tag",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_208_on-call-solo-team",
    title: "On-Call Solo Team",
    side: "corp",
    type: "agenda",
    subtypes: ["asset"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 3,
    rulesText:
      "[A]: Do 1 meat damage. Use this ability only if Runner is tagged.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda_action",
      "runner_is_tagged",
      "damage",
      "flatline",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_209_political-coup",
    title: "Political Coup",
    side: "corp",
    type: "agenda",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 2,
    rulesText:
      "Put 12 from the bank on Political Coup when you score it.\n[A]: Take 3 from Political Coup, if it has any bits.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "counter",
      "action_economy",
      "gain_credits",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_211_polymer-breakthrough",
    title: "Polymer Breakthrough",
    side: "corp",
    type: "agenda",
    subtypes: ["research"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 6,
    agendaPoints: 3,
    rulesText: "Gain 1 at the start of each of your turns.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "start_of_turn_credit_gain",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_212_priority-requisition",
    title: "Priority Requisition",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 5,
    agendaPoints: 3,
    rulesText:
      "You may rez a piece of ice, at no cost, when you score Priority Requisition.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "on_score_rez_ice_free",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_214_project-babylon",
    title: "Project Babylon",
    side: "corp",
    type: "agenda",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 1,
    rulesText:
      "Score 1 additional agenda point for every two advancement counters over Project Babylon's difficulty that are on Project Babylon when you score it.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "overadvance_bonus",
      "agenda_counter_bonus",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_215_security-net-optimization",
    title: "Security Net Optimization",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 5,
    agendaPoints: 3,
    rulesText:
      "Choose a fort when scored. Ice installed on that fort gets +1 strength.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "global_ice_strength_modifier",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_216_security-purge",
    title: "Security Purge",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 2,
    rulesText:
      "When scored, reveal the top three cards of R&D, or as many as exist. Install and rez revealed ice at no printed rez cost, then trash the rest.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "hidden_zone_search_reveal",
      "on_score_install_rez_ice",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_219_superior-net-barriers",
    title: "Superior Net Barriers",
    side: "corp",
    type: "agenda",
    subtypes: ["research"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 6,
    agendaPoints: 3,
    rulesText:
      "All walls have +1 strength. When you score Superior Net Barriers, reveal as many walls as you wish. Then, gain 1 for each revealed or rezzed wall.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "global_ice_strength_modifier",
      "hidden_zone_search_reveal",
      "on_score_gain_credits",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_308_acme-savings-and-loan",
    title: "ACME Savings and Loan",
    side: "corp",
    type: "asset",
    subtypes: ["transactions"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "Rezzing ACME S&L costs 1 agenda point, in addition to the normal cost. When you rez ACME S&L, gain 12 credits and trash ACME S&L. For the remainder of the game, pay 1 credit at the end of each of your turns, or lose the game. You can remove this effect, and score 1 agenda point, by taking an action to pay 12 credits.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "agenda_point_rez_cost",
      "on_rez_credit_gain",
      "self_trash_on_rez",
      "persistent_special_state",
      "end_of_turn_credit_tax",
      "lose_the_game",
      "agenda_point_score_action",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_309_bbs-whispering-campaign",
    title: "BBS Whispering Campaign",
    side: "corp",
    type: "asset",
    subtypes: ["advertisement", "campaign"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 4,
    rulesText:
      "Rezzed campaign asset for Corp economy. It installs in a remote, can be trashed on access, and is handled through the generic asset/node resolver.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "campaign_economy",
      "hosting",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_310_blood-cat",
    title: "Blood Cat",
    side: "corp",
    type: "asset",
    subtypes: ["ai"],
    implementationStatus: "playable_mvp",
    rezCost: 6,
    trashCost: 0,
    rulesText: "[A]: Trace 5 - If trace is successful, give Runner a tag.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "trace",
      "ai_asset_node",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_311_braindance-campaign",
    title: "Braindance Campaign",
    side: "corp",
    type: "asset",
    subtypes: ["advertisement", "campaign", "gray_ops"],
    implementationStatus: "playable_mvp",
    rezCost: 6,
    trashCost: 7,
    rulesText:
      "Rezzed campaign asset for recurring Corp economy. Recurring/start-of-turn handling is tracked separately from display text.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "campaign_economy",
      "hosting",
      "recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_314_corporate-negotiating-center",
    title: "Corporate Negotiating Center",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText:
      "At the start of each Corp turn, the Corp may reveal agenda cards from HQ. Gain 1 credit for each agenda revealed this way.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "economy",
      "hq_agenda_reveal",
      "start_of_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_316_cowboy-sysop",
    title: "Cowboy Sysop",
    side: "corp",
    type: "asset",
    subtypes: ["sysop"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText:
      "Rezzed sysop asset with installed-card target handling. Any uninstall or return effect is resolved through explicit visible targets.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "installed_card_uninstall",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_318_department-of-truth-enhancement",
    title: "Department of Truth Enhancement",
    side: "corp",
    type: "asset",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 1,
    rulesText:
      "Rezzed Gray Ops asset with generic asset and hosting lifecycle coverage. Trash-on-access remains the public interaction path.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "gray_ops",
      "hosting",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_319_disinfectant-inc",
    title: "Disinfectant, Inc.",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 4,
    rulesText:
      "Rezzed asset for virus and counter interaction. Prevention, purge and counter effects remain resolver-driven and side-safe.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "virus",
      "counter",
      "purge",
      "prevention",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_321_esa-contract",
    title: "ESA Contract",
    side: "corp",
    type: "asset",
    subtypes: ["transactions"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText:
      "Rezzed transaction asset with a Corp draw/economy ability surface. Hidden draws stay private and deterministic.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "draw_card",
      "transactions",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_326_holovid-campaign",
    title: "Holovid Campaign",
    side: "corp",
    type: "asset",
    subtypes: ["advertisement", "campaign"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    trashCost: 7,
    rulesText:
      "When Holovid Campaign is rezzed, put 12 bits from the bank on it. At the start of each Corp turn, remove 1 bit and gain 1 credit. Trash Holovid Campaign when it has no bits.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "campaign_economy",
      "hosting",
      "bit_counter",
      "start_turn_counter_drain",
      "self_trash",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_329_investment-firm",
    title: "Investment Firm",
    side: "corp",
    type: "asset",
    subtypes: ["transactions"],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 2,
    rulesText:
      "Rezzed transaction asset with a Corp basic-credit replacement: take the normal credit or place 2 recurring credits on Investment Firm instead.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "transactions",
      "economy",
      "basic_credit_replacement",
      "recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_330_krumz",
    title: "Krumz",
    side: "corp",
    type: "asset",
    subtypes: ["ai"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 2,
    rulesText:
      "When rezzed, put 1 bit on Krumz. Use this bit only during Corp trace bids. If spent, replace it at the start of the next Corp turn.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "trace",
      "trace_bid_credit_source",
      "counter",
      "recurring_start_turn",
      "ai_asset_node",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_333_omniscience-foundation",
    title: "Omniscience Foundation",
    side: "corp",
    type: "asset",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 1,
    rulesText:
      "Rezzed Gray Ops asset handled through the generic asset/node resolver and normal trash-on-access rules.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "gray_ops",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_336_rescheduler",
    title: "Rescheduler",
    side: "corp",
    type: "asset",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText:
      "[A]: Note the number of cards in HQ. Shuffle those cards into R&D, then draw that many cards.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "gray_ops",
      "hq_shuffle_into_rd",
      "draw",
      "deterministic_shuffle",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_337_rockerboy-promotion",
    title: "Rockerboy Promotion",
    side: "corp",
    type: "asset",
    subtypes: ["advertisement", "campaign"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    trashCost: 3,
    rulesText:
      "Rezzed campaign asset for Corp economy and hosting lifecycle coverage. The Runner may trash it on access.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "campaign_economy",
      "hosting",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_340_setup",
    title: "Setup!",
    side: "corp",
    type: "asset",
    subtypes: ["ambush"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "When accessed, do 2 net damage. Ignore this effect from Archives. From R&D, reveal Setup! publicly.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "access_breach",
      "hidden_zone_search_reveal",
      "access_ambush",
      "net_damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_342_solo-squad",
    title: "Solo Squad",
    side: "corp",
    type: "asset",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText:
      "Rezzed asset with meat-damage surface. Damage resolution is performed by explicit resolver paths and not by catalog text.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "meat_damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_344_spinn-public-relations",
    title: "Spinn Public Relations",
    side: "corp",
    type: "asset",
    subtypes: ["advertisement", "transactions"],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 4,
    rulesText:
      "[A]: Put 6 bits from the bank on Spinn Public Relations. At the start of each Corp turn, take 1 bit from it if able.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "transactions",
      "campaign_economy",
      "hosting",
      "recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_345_trap",
    title: "TRAP!",
    side: "corp",
    type: "asset",
    subtypes: ["ambush"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "If you pay [4] when Runner accesses TRAP!, it does 3 Net damage and gives Runner a tag, even if TRAP! is not installed. Ignore this effect if Runner accesses it from Archives. If TRAP! is accessed from R&D, Runner must show it to you.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "access_breach",
      "hidden_zone_search_reveal",
      "tag",
      "access_ambush",
      "net_damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_354_crybaby",
    title: "Crybaby",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 2,
    rulesText:
      "When accessed, give the Runner a Crying counter. Each Crying counter reduces Runner link by 2 during traces. Runner may pay 4 and spend an action to remove one.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "trace",
      "counter",
      "access_breach",
      "access_ambush",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_355_crystal-palace-station-grid",
    title: "Crystal Palace Station Grid",
    side: "corp",
    type: "upgrade",
    subtypes: ["region"],
    implementationStatus: "playable_mvp",
    rezCost: 5,
    trashCost: 5,
    rulesText:
      "Rezzed region upgrade with server-bound grid and counter surfaces. City-grid effects remain tied to the installed server.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "city_grid",
      "counter",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_356_dedicated-response-team",
    title: "Dedicated Response Team",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 2,
    rulesText:
      "Whenever Runner accesses Dedicated Response Team, do 3 Meat damage if Runner is tagged.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "access_breach",
      "access_ambush",
      "meat_damage",
      "tag_condition",
      "prevention",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_357_dieter-esslin",
    title: "Dieter Esslin",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText:
      "Whenever Runner accesses Dieter Esslin, do 1 Net damage.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "access_breach",
      "access_ambush",
      "net_damage",
      "prevention",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_358_dr-dreff",
    title: "Dr. Dreff",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText:
      "Rezzed server upgrade with run-flow and counter surfaces. Any run tax or timing effect is represented by legal actions.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "run_flow",
      "counter",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_359_jenny-jett",
    title: "Jenny Jett",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 1,
    rulesText:
      "Rezzed server upgrade handled by the generic upgrade/root/server resolver and normal trash-on-access rules.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_361_namatoki-plaza",
    title: "Namatoki Plaza",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    trashCost: 1,
    rulesText:
      "Rez Namatoki Plaza when you install it. Install Namatoki Plaza only if you can pay to rez it. Install only inside a subsidiary data fort. That fort may have an additional agenda or node installed inside it. If Namatoki Plaza leaves play while installed, and this results in the fort having too many agendas and nodes installed inside it, trash one of those agendas or nodes.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_362_new-galveston-city-grid",
    title: "New Galveston City Grid",
    side: "corp",
    type: "upgrade",
    subtypes: ["region"],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 4,
    rulesText:
      "Region. While rezzed, each other asset and upgrade in this fort costs the Runner +2 credits to trash.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "city_grid",
      "region",
      "trash_cost_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_364_omni-kismet-ph-d",
    title: "Omni Kismet, Ph.D.",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText:
      "Rezzed server upgrade with tag-condition surfaces. Tag effects are resolved through explicit side-safe paths.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "tag",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_365_paris-city-grid",
    title: "Paris City Grid",
    side: "corp",
    type: "upgrade",
    subtypes: ["region"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 6,
    rulesText:
      "When rezzed, put 3 bits from the bank on Paris City Grid. Use these bits only to pay for traces made during runs on this fort. If any are used, replace them at the start of the next Corp turn.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "city_grid",
      "trace",
      "trace_bid_credit_source",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_366_red-herrings",
    title: "Red Herrings",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 1,
    rulesText:
      "Rezzed server upgrade with access/breach cost surfaces. Access modification is resolved through server-bound legal actions.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "access_breach",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_369_singapore-city-grid",
    title: "Singapore City Grid",
    side: "corp",
    type: "upgrade",
    subtypes: ["region"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 5,
    rulesText:
      "Once during a run on this fort, the Corp may swap an unrezzed ICE on this fort with an ICE from HQ. The replacement ICE enters concealed and unrezzed.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "city_grid",
      "hidden_zone",
      "swap",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_370_tesseract-fort-construction",
    title: "Tesseract Fort Construction",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 3,
    rulesText:
      "Rezzed server upgrade for server-bound root effects. The installed server remains the only effect scope.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_372_turbeau-delacroix",
    title: "Turbeau Delacroix",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 2,
    rulesText:
      "Trace 4 - If trace is successful, give Runner a tag. Use this ability only when Runner accesses Turbeau Delacroix, and only once during each run on this fort.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "trace",
      "access_breach",
      "tag",
      "access_ambush",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_373_twenty-four-hour-surveillance",
    title: "Twenty-Four-Hour Surveillance",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 2,
    rulesText:
      "Rezzed server upgrade with stealth-credit interaction surfaces. Stealth and server effects stay resolver-driven.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "stealth",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_025_fait-accompli",
    title: "Fait Accompli",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    memoryCost: 1,
    rulesText:
      "Installed program with agenda, counter and overadvance interaction surfaces. Effects resolve only through explicit legal actions.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_078_arasaka-owns-you",
    title: "Arasaka Owns You",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Play only when you are about to take enough damage to flatline. Prevent all that damage, trash Arasaka Owns You, remove all core damage, fill your hand to its maximum size, gain 10, remove all tags, forgo your next four actions, and forfeit the next 3 agenda points you score.",
    mechanics: [
      "play_event",
      "tag",
      "prevention",
      "replacement",
      "scored_agenda",
      "agenda_difficulty",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_189_artificial-security-directors",
    title: "Artificial Security Directors",
    side: "corp",
    type: "agenda",
    subtypes: ["research"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 1,
    rulesText:
      "Agenda with scored static and hidden-zone support surfaces. Score, steal and reveal effects remain side-safe.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda",
      "hidden_zone_tool",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_202_genetics-visionary-acquisition",
    title: "Genetics-Visionary Acquisition",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 1,
    rulesText:
      "Agenda with hidden-zone and overadvance surfaces. Score and steal values are computed from engine state.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda",
      "hidden_zone_tool",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_291_falsified-transactions-expert",
    title: "Falsified-Transactions Expert",
    side: "corp",
    type: "operation",
    subtypes: ["transaction"],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Operation with counter and agenda-difficulty surfaces. Counter placement and agenda costs are legal-action gated.",
    mechanics: [
      "play_operation",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_292_management-shake-up",
    title: "Management Shake-Up",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 10,
    rulesText:
      "Operation that places 3 advancement counters across installed advanceable Corp cards. Resolution is deterministic and replayable.",
    mechanics: [
      "play_operation",
      "advance",
      "advancement_counter",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_300_project-consultants",
    title: "Project Consultants",
    side: "corp",
    type: "operation",
    subtypes: ["transaction"],
    implementationStatus: "playable_mvp",
    cost: 12,
    rulesText:
      "Operation with advancement and overadvance planning surfaces. Agenda targets are revalidated by applyAction.",
    mechanics: [
      "play_operation",
      "advance",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_303_silver-lining-recovery-protocol",
    title: "Silver Lining Recovery Protocol",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Operation with economy, counter and agenda-difficulty surfaces. Credit and counter branches remain explicit.",
    mechanics: [
      "play_operation",
      "gain_credits",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_304_systematic-layoffs",
    title: "Systematic Layoffs",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 5,
    rulesText:
      "Add two advancement counters to any combination of installed cards that can be advanced.",
    mechanics: [
      "play_operation",
      "advance",
      "advancement_counter",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_305_team-restructuring",
    title: "Team Restructuring",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Operation with counter and scored-agenda support surfaces. It does not grant implicit agenda effects.",
    mechanics: [
      "play_operation",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_312_chicago-branch",
    title: "Chicago Branch",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 1,
    rulesText:
      "Rezzed asset with counter and agenda-difficulty surfaces. Asset abilities resolve through explicit Corp actions.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_315_corprunners-shattered-remains",
    title: "Corprunner's Shattered Remains",
    side: "corp",
    type: "asset",
    subtypes: ["ambush"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 0,
    rulesText:
      "Access ambush asset with installed-card, counter and agenda surfaces. Targets are visible and revalidated.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "access_ambush",
      "installed_card_destroy",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_323_experimental-ai",
    title: "Experimental AI",
    side: "corp",
    type: "asset",
    subtypes: ["ai", "ambush"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 0,
    rulesText:
      "AI asset with access ambush, installed-card and agenda-overadvance surfaces. Ambush branches stay access-window gated.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "access_ambush",
      "installed_card_destroy",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_328_information-laundering",
    title: "Information Laundering",
    side: "corp",
    type: "asset",
    subtypes: ["transactions"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 1,
    rulesText:
      "Advanceable transactions asset. [A], trash: gain 4 credits for each advancement counter on Information Laundering.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "gain_credits",
      "scored_agenda",
      "agenda_difficulty",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_346_vacant-soulkiller",
    title: "Vacant Soulkiller",
    side: "corp",
    type: "asset",
    subtypes: ["ambush"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 0,
    rulesText:
      "Access ambush asset with core-damage, counter and agenda surfaces. Damage paths use side-safe damage events.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "access_ambush",
      "core_damage",
      "damage",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_347_vapor-ops",
    title: "Vapor Ops",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 1,
    rulesText:
      "Rezzed asset with economy, counter and overadvance surfaces. Counter values are visible public state.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "gain_credits",
      "counter",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_348_virus-test-site",
    title: "Virus Test Site",
    side: "corp",
    type: "asset",
    subtypes: ["ambush"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "Advanceable access ambush. When accessed, do at least 1 net damage, or 2 net damage per advancement counter. Ignore from Archives. From R&D, reveal publicly.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "access_ambush",
      "net_damage",
      "hidden_zone_search_reveal",
      "scored_agenda",
      "agenda_difficulty",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_363_olivia-salazar",
    title: "Olivia Salazar",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 1,
    rulesText:
      "For half cost, rounded down, rez a piece of ICE installed on this fort. Derez that ICE at the end of the run. Use this ability only once during each run on this fort.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "ice_rez_cost_modifier",
      "temporary_derez",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_368_roving-submarine",
    title: "Roving Submarine",
    side: "corp",
    type: "upgrade",
    subtypes: ["region"],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    trashCost: 0,
    rulesText:
      "Install only inside a subsidiary data fort. This fort may be run only if you installed or advanced a card inside or on this fort during your last turn. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "advance",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_374_washington-d-c-city-grid",
    title: "Washington, D.C., City Grid",
    side: "corp",
    type: "upgrade",
    subtypes: ["region"],
    implementationStatus: "playable_mvp",
    rezCost: 7,
    trashCost: 6,
    rulesText:
      "Rezzed city-grid upgrade with agenda-difficulty and overadvance surfaces. City-grid effects stay tied to the installed server.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "city_grid",
      "scored_agenda",
      "agenda_difficulty",
      "overadvance",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_002_ai-boon",
    title: "AI Boon",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "killer"],
    implementationStatus: "playable_mvp",
    installCost: 12,
    memoryCost: 1,
    strength: 2,
    recurringCredits: 1,
    rulesText:
      "1 Credit: Break 1 sentry subroutine. 1 Credit: +1 strength. At the start of each run, roll a die and add the result to AI Boon's strength for that run.",
    abilities: [
      {
        id: "onr_v1_002_ai-boon_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "onr_v1_002_ai-boon_break_sentry",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "sentry",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "icebreaker",
      "pump_breaker",
      "break_subroutine",
      "deterministic_random",
      "recurring_credit",
      "recurring_start_turn",
      "run_flow",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_008_boardwalk",
    title: "Boardwalk",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    recurringCredits: 1,
    rulesText:
      "Installed virus program with deterministic random, hidden-zone and recurring-counter surfaces. Random results are recorded and replay-stable.",
    mechanics: [
      "install_program",
      "memory",
      "virus",
      "counter",
      "deterministic_random",
      "hidden_zone_tool",
      "recurring_credit",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_104_playful-ai",
    title: "Playful AI",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Runner event with deterministic random and AI-asset interaction surfaces. Resolution uses explicit legal actions and public random records.",
    mechanics: [
      "play_event",
      "deterministic_random",
      "generic_asset_node",
      "memory",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_172_quest-for-cattekin",
    title: "Quest for Cattekin",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 4,
    recurringCredits: 1,
    rulesText:
      "Installed resource with deterministic random, recurring, damage and persistent-state surfaces. Outcomes stay side-safe and replay-stable.",
    mechanics: [
      "install_resource",
      "deterministic_random",
      "recurring_credit",
      "persistent_special_state",
      "damage_prevention",
      "core_damage",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_339_schlaghund",
    title: "Schlaghund",
    side: "corp",
    type: "asset",
    subtypes: ["ambush"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 4,
    rulesText:
      "Rezzed asset with deterministic random and damage surfaces. Damage and random outcomes are legal-action gated and public.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "deterministic_random",
      "damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_367_rio-de-janeiro-city-grid",
    title: "Rio de Janeiro City Grid",
    side: "corp",
    type: "upgrade",
    subtypes: ["region"],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 6,
    rulesText:
      "Roll a die whenever Runner passes a piece of rezzed ice during a run on this fort. On a 1, end the run. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "city_grid",
      "deterministic_random",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_119_arasaka-portable-prototype",
    title: "Arasaka Portable Prototype",
    side: "runner",
    type: "hardware",
    subtypes: ["deck"],
    implementationStatus: "playable_mvp",
    installCost: 11,
    memoryLimitBonus: 3,
    recurringCredits: 3,
    rulesText:
      "Deck. +3 MU. Costs 1 agenda point to install. 3 recurring credits for using icebreakers during runs. You may have only one deck installed.",
    mechanics: [
      "install_hardware",
      "memory",
      "deck_unique",
      "agenda_point_cost",
      "recurring_credit",
      "icebreaker_recurring_credit",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_122_artemis-2020",
    title: "Artemis 2020",
    side: "runner",
    type: "hardware",
    subtypes: ["deck"],
    implementationStatus: "playable_mvp",
    installCost: 10,
    memoryLimitBonus: 2,
    recurringCredits: 2,
    rulesText:
      "Provides +2 MU. Put 2 recurring credits on Artemis 2020 when it is installed. Use these credits only to pay for using icebreakers during runs. If you use any of these credits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.",
    mechanics: [
      "install_hardware",
      "memory",
      "deck_unique",
      "recurring_credit",
      "icebreaker_recurring_credit",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_123_bodyweight-data-creche",
    title: "Bodyweight Data Creche",
    side: "runner",
    type: "hardware",
    subtypes: ["deck"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryLimitBonus: 2,
    recurringCredits: 3,
    rulesText:
      "Deck. +2 MU. 3 recurring credits for increasing link. You may have only one deck installed.",
    mechanics: [
      "install_hardware",
      "memory",
      "deck_unique",
      "recurring_credit",
      "link_recurring_credit",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_124_corolla-speed-chip",
    title: "Corolla Speed Chip",
    side: "runner",
    type: "hardware",
    subtypes: ["chip"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    recurringCredits: 1,
    rulesText:
      "1 recurring credit. Use this credit only for Killer icebreaker use during runs.",
    mechanics: [
      "install_hardware",
      "memory",
      "recurring_credit",
      "recurring_start_turn",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_131_microtech-backup-drive",
    title: "Microtech Backup Drive",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "When installed programs hosted on another card would be trashed together, stack them on Microtech Backup Drive instead. [A]: Return the top hosted program to your grip.",
    mechanics: [
      "install_hardware",
      "program_trash_replacement",
      "hosted_program_lifecycle",
      "return_hosted_to_grip",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_136_pandoras-deck",
    title: "Pandora's Deck",
    side: "runner",
    type: "hardware",
    subtypes: ["deck"],
    implementationStatus: "playable_mvp",
    installCost: 6,
    memoryLimitBonus: 2,
    recurringCredits: 3,
    rulesText:
      "Deck. +2 MU. 3 recurring credits for increasing link. You may have only one deck installed.",
    mechanics: [
      "install_hardware",
      "memory",
      "deck_unique",
      "recurring_credit",
      "link_recurring_credit",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_137_parraline-5750",
    title: "Parraline 5750",
    side: "runner",
    type: "hardware",
    subtypes: ["deck"],
    implementationStatus: "playable_mvp",
    installCost: 5,
    memoryLimitBonus: 1,
    recurringCredits: 1,
    rulesText:
      "Deck. +1 MU. 1 recurring credit for using icebreakers during runs. You may have only one deck installed.",
    mechanics: [
      "install_hardware",
      "memory",
      "recurring_credit",
      "deck_unique",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_138_pk-6089a",
    title: "PK-6089a",
    side: "runner",
    type: "hardware",
    subtypes: ["deck"],
    implementationStatus: "playable_mvp",
    installCost: 4,
    memoryLimitBonus: 1,
    recurringCredits: 3,
    rulesText:
      "Deck. +1 MU. 3 recurring credits for increasing link. You may have only one deck installed.",
    mechanics: [
      "install_hardware",
      "memory",
      "deck_unique",
      "recurring_credit",
      "link_recurring_credit",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_147_zz22-speed-chip",
    title: "ZZ22 Speed Chip",
    side: "runner",
    type: "hardware",
    subtypes: ["chip"],
    implementationStatus: "playable_mvp",
    installCost: 5,
    recurringCredits: 2,
    rulesText:
      "2 recurring credits. Use these credits only for Killer icebreaker use during runs.",
    mechanics: [
      "install_hardware",
      "memory",
      "per_card_longtail",
      "recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_077_anonymous-tip",
    title: "Anonymous Tip",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 3,
    rulesText:
      "Runner event with black ICE derez surface. Resolution remains LegalAction-gated.",
    mechanics: [
      "play_event",
      "ice_target",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_080_core-command-jettison-ice",
    title: "Core Command: Jettison Ice",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Play only after a successful HQ run this turn. Pay a rezzed ICE's rez cost to trash it.",
    mechanics: [
      "play_event",
      "ice_target",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_086_forged-activation-orders",
    title: "Forged Activation Orders",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Choose an unrezzed piece of ICE. The Corp either pays its rez cost to rez it or trashes it.",
    mechanics: [
      "play_event",
      "ice_target",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_093_if-you-want-it-done-right",
    title: "If You Want It Done Right...",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Runner event with per-card longtail surface. Resolution remains LegalAction-gated.",
    mechanics: ["play_event", "per_card_longtail", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_100_misc-for-sale",
    title: "misc.for-sale",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Runner event with per-card longtail surface. Resolution remains LegalAction-gated.",
    mechanics: ["play_event", "per_card_longtail", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_102_open-ended-mileage-program",
    title: "Open-Ended Mileage Program",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Runner event with per-card longtail surface. Resolution remains LegalAction-gated.",
    mechanics: ["play_event", "per_card_longtail", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_103_organ-donor",
    title: "Organ Donor",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Runner event with per-card longtail surface. Resolution remains LegalAction-gated.",
    mechanics: ["play_event", "per_card_longtail", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_109_security-code-worm-chip",
    title: "Security Code WORM Chip",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Play only after a successful HQ run this turn. Choose an unrezzed piece of ICE and trash it.",
    mechanics: [
      "play_event",
      "worm",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_113_synchronized-attack-on-hq",
    title: "Synchronized Attack on HQ",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 4,
    rulesText:
      "Play only after a successful HQ run this turn. The Corp discards all cards in HQ unless they pay 2 credits per kept card.",
    mechanics: [
      "play_event",
      "run_flow",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_117_valu-pak-software-bundle",
    title: "Valu-Pak Software Bundle",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Runner event with program-bundle longtail surface. Resolution remains LegalAction-gated.",
    mechanics: [
      "play_event",
      "program",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_195_corporate-retreat",
    title: "Corporate Retreat",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 3,
    rulesText:
      "[A]: Gain 2 credits. This ability is lost after Corp installs or rezzes any card.",
    mechanics: [
      "install_remote",
      "advance",
      "score_agenda",
      "scored_agenda_action",
      "gain_credits",
      "ability_loss_on_install_or_rez",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_196_corporate-war",
    title: "Corporate War",
    side: "corp",
    type: "agenda",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 3,
    rulesText:
      "When scored, if Corp has at least 12 credits, gain 12 credits; otherwise lose all credits.",
    mechanics: [
      "install_remote",
      "advance",
      "score_agenda",
      "gain_credits",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_197_data-fort-reclamation",
    title: "Data Fort Reclamation",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 2,
    rulesText:
      "When scored, choose up to 4 HQ cards and install them in a new data fort. Optional rez sequencing remains deferred.",
    mechanics: [
      "install_remote",
      "advance",
      "score_agenda",
      "hidden_zone",
      "install_remote",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_206_marine-arcology",
    title: "Marine Arcology",
    side: "corp",
    type: "agenda",
    subtypes: ["asset"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 2,
    rulesText: "[A], [A]: Gain 3 credits.",
    mechanics: [
      "install_remote",
      "advance",
      "score_agenda",
      "scored_agenda_action",
      "gain_credits",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_210_political-overthrow",
    title: "Political Overthrow",
    side: "corp",
    type: "agenda",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 9,
    agendaPoints: 6,
    rulesText: "[A]: Gain 3 credits.",
    mechanics: [
      "install_remote",
      "advance",
      "score_agenda",
      "scored_agenda_action",
      "gain_credits",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_026_false-echo",
    title: "False Echo",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Install as a program. Its successful-run forced-rez ability remains gated until the trigger and rez sequence contract is confirmed.",
    mechanics: [
      "install_program",
      "memory",
      "per_card_longtail",
      "ability_contract_pending",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_031_hammer",
    title: "Hammer",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "noisy"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    strength: 2,
    rulesText:
      "1 credit: Break Wall subroutine.\n1 credit: +1 strength.\nWhenever Hammer breaks a Wall subroutine, lose up to 2 from Stealth cards.",
    abilities: [
      {
        id: "onr_v1_031_hammer_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "onr_v1_031_hammer_break",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "wall",
        postBreakStealthLoss: 2,
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
      "subtype_noisy",
      "stealth_loss",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_044_netspace-inverter",
    title: "Netspace Inverter",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Install as a program. Its successful-run server-ICE reorder ability remains gated until the trigger and public order-update contract is confirmed.",
    mechanics: [
      "install_program",
      "memory",
      "per_card_longtail",
      "ability_contract_pending",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_037_japanese-water-torture",
    title: "Japanese Water Torture",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker"],
    implementationStatus: "playable_mvp",
    installCost: 7,
    memoryCost: 1,
    strength: 2,
    rulesText:
      "0 credits: Break Wall subroutine.\n1 credit: +1 strength and forgo your next action.",
    abilities: [
      {
        id: "onr_v1_037_japanese_water_torture_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "onr_v1_037_japanese_water_torture_break",
        type: "break_subroutine",
        cost: { credits: 0 },
        iceSubtype: "wall",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
      "future_action_debt",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_027_flak",
    title: "Flak",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker"],
    implementationStatus: "playable_mvp",
    installCost: 4,
    memoryCost: 1,
    strength: 2,
    rulesText: "1 credit: Break AP subroutine.\n1 credit: +1 strength.",
    abilities: [
      {
        id: "onr_v1_027_flak_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "onr_v1_027_flak_break",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "ap",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_055_reflector",
    title: "Reflector",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    strength: 4,
    rulesText: "0 credits: Break stun, hellbolt, or knockout subroutine.",
    abilities: [
      {
        id: "onr_v1_055_reflector_break",
        type: "break_subroutine",
        cost: { credits: 0 },
        subroutineBreakTags: ["stun", "hellbolt", "knockout"],
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "break_subroutine",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_061_shield",
    title: "Shield",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText: "Prevent up to 2 net damage each turn.",
    mechanics: [
      "install_program",
      "memory",
      "damage_prevention",
      "damage_prevention_turn_limit",
      "net_damage",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_045_newsgroup-filter",
    title: "Newsgroup Filter",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 5,
    memoryCost: 2,
    rulesText: "[A]: Gain 2 Credits.",
    mechanics: [
      "install_program",
      "memory",
      "gain_credits",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_048_poltergeist",
    title: "Poltergeist",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    recurringCredits: 2,
    rulesText:
      "Put 2 recurring credits from the bank on Poltergeist when it is installed. Use these credits only to pay for trashing nodes. If you use any of these credits, replace them at the start of your next turn.",
    mechanics: [
      "install_program",
      "memory",
      "per_card_longtail",
      "recurring_credit",
      "node_trash_recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_051_rabbit",
    title: "Rabbit",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Ice that attempts to trace the Runner has its Corp trace-bid limit reduced by 1.",
    mechanics: [
      "install_program",
      "memory",
      "trace",
      "trace_limit_modifier",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_057_scatter-shot",
    title: "Scatter Shot",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    recurringCredits: 2,
    rulesText:
      "2 recurring credits for trashing accessed upgrades. Used counters refresh at the start of each Runner turn.",
    mechanics: [
      "install_program",
      "memory",
      "recurring_credit",
      "recurring_start_turn",
      "restricted_credit",
      "upgrade_trash_payment",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_067_speed-trap",
    title: "Speed Trap",
    side: "runner",
    type: "program",
    subtypes: ["detection"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "After the Corp rezzes an upgrade or node during a run and before it takes effect, you may jack out. If used after the last ice, the run is successful but you access no cards.",
    mechanics: [
      "install_program",
      "memory",
      "rez_interrupt",
      "jack_out",
      "successful_run_without_access",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_068_startup-immolator",
    title: "Startup Immolator",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "During a run, after passing ice whose subroutines were all broken, exhaust Startup Immolator and pay that ice's rez cost to trash it.",
    mechanics: [
      "install_program",
      "memory",
      "post_encounter_trigger",
      "trash_ice",
      "rez_cost_payment",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_075_zetatech-software-installer",
    title: "Zetatech Software Installer",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    recurringCredits: 2,
    rulesText:
      "2 recurring credits. Use these credits to install programs. You may install a program over Zetatech Software Installer; overlay programs use no additional MU.",
    mechanics: [
      "install_program",
      "memory",
      "recurring_credit",
      "program_install_support",
      "overlay_program_install",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_289_edgerunner-inc-temps",
    title: "Edgerunner, Inc., Temps",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Gain up to three consecutive install-only actions.",
    mechanics: [
      "play_operation",
      "install_remote",
      "action_economy",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_296_off-site-backups",
    title: "Off-Site Backups",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Bring any card from Archives into HQ.",
    mechanics: [
      "play_operation",
      "hidden_zone_tool",
      "archives_to_hq",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_298_planning-consultants",
    title: "Planning Consultants",
    side: "corp",
    type: "operation",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Look at the top five cards of R&D and arrange them in any order.",
    mechanics: [
      "play_operation",
      "hidden_zone_tool",
      "reorder",
      "per_card_longtail",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_022_emergency-self-construct",
    title: "Emergency Self-Construct",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Installed program with handlimit, damage-prevention and persistent-state surfaces. Effects resolve through explicit legal actions.",
    mechanics: [
      "install_program",
      "memory",
      "persistent_special_state",
      "modify_hand_limit",
      "damage_prevention",
      "action_economy",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_029_gremlins",
    title: "Gremlins",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    rulesText:
      "Installed program with counter and persistent action-economy surfaces. Counter effects stay legal-action gated.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "persistent_special_state",
      "action_economy",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_133_militech-mram-chip",
    title: "Militech MRAM Chip",
    side: "runner",
    type: "hardware",
    subtypes: ["chip"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    maxHandSizeBonus: 3,
    rulesText:
      "Hand size +3. The hand-size modifier is installed, visible and recomputed from public rig state.",
    mechanics: [
      "install_hardware",
      "modify_hand_limit",
      "persistent_special_state",
      "action_economy",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_134_mram-chip",
    title: "MRAM Chip",
    side: "runner",
    type: "hardware",
    subtypes: ["chip"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    maxHandSizeBonus: 2,
    rulesText:
      "Hand size +2. The hand-size modifier is installed, visible and recomputed from public rig state.",
    mechanics: [
      "install_hardware",
      "modify_hand_limit",
      "persistent_special_state",
      "action_economy",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_160_diplomatic-immunity",
    title: "Diplomatic Immunity",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText:
      "Installed resource that prevents Meat damage unless the Corp forfeits 1 agenda point to cancel that prevention window.",
    mechanics: [
      "install_resource",
      "damage_prevention",
      "agenda_point_cost",
      "event_modification_prevention",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_168_loan-from-chiba",
    title: "Loan from Chiba",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "Gain [12] when Loan from Chiba is installed. At the start of each of your turns, lose [1]. If Loan from Chiba leaves play, pay [10] or lose the game. You may trash Loan from Chiba at the end of any of your turns.",
    mechanics: [
      "install_resource",
      "gain_credits",
      "persistent_special_state",
      "action_economy",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_171_preying-mantis",
    title: "Preying Mantis",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "Installed resource with action-economy, prevention and persistent-state surfaces. All action changes require explicit legal actions.",
    mechanics: [
      "install_resource",
      "action_economy",
      "persistent_special_state",
      "damage_prevention",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_190_bioweapons-engineering",
    title: "Bioweapons Engineering",
    side: "corp",
    type: "agenda",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 3,
    rulesText:
      "Agenda with global damage and persistent-state modifier surfaces. Scored effects are computed from public score state.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda",
      "persistent_special_state",
      "global_static_modifier",
      "damage",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_191_black-ice-quality-assurance",
    title: "Black Ice Quality Assurance",
    side: "corp",
    type: "agenda",
    subtypes: ["research"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 5,
    agendaPoints: 2,
    rulesText:
      "All Black ICE has +2 strength. Modifier sources remain public after scoring.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda",
      "global_static_modifier",
      "persistent_special_state",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_192_corporate-boon",
    title: "Corporate Boon",
    side: "corp",
    type: "agenda",
    subtypes: [],
    implementationStatus: "playable_mvp",
    advancementRequirement: 6,
    agendaPoints: 2,
    rulesText:
      "Agenda with action-economy and counter surfaces. Any extra action or counter branch is legal-action gated.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda",
      "action_economy",
      "counter",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_200_encryption-breakthrough",
    title: "Encryption Breakthrough",
    side: "corp",
    type: "agenda",
    subtypes: ["research"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 5,
    agendaPoints: 2,
    rulesText:
      "All code gates get +1 strength. When scored, reveal code gates and gain 1 credit for each revealed or rezzed code gate.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda",
      "global_static_modifier",
      "persistent_special_state",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_204_ice-transmutation",
    title: "Ice Transmutation",
    side: "corp",
    type: "agenda",
    subtypes: ["research"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 5,
    agendaPoints: 3,
    rulesText:
      "When scored, choose a rezzed piece of ice. It gets +1 strength and each of its printed subroutines is repeated directly after itself.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda",
      "persistent_special_state",
      "ice_strength_modifier",
      "subroutine_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_205_main-office-relocation",
    title: "Main-Office Relocation",
    side: "corp",
    type: "agenda",
    subtypes: [],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 3,
    rulesText:
      "Agenda with handsize and global HQ modifier surfaces. Handlimit values are recomputed from scored public sources.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda",
      "modify_hand_limit",
      "global_static_modifier",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_218_subsidiary-branch",
    title: "Subsidiary Branch",
    side: "corp",
    type: "agenda",
    subtypes: [],
    implementationStatus: "playable_mvp",
    advancementRequirement: 6,
    agendaPoints: 1,
    rulesText:
      "Agenda with action-economy surfaces. Extra actions remain public, deterministic and legal-action gated.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda",
      "action_economy",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_313_city-surveillance",
    title: "City Surveillance",
    side: "corp",
    type: "asset",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 2,
    rulesText:
      "For each card Runner draws, give Runner a tag unless Runner pays 1 credit to avoid that tag. City Surveillance may be rezzed just before the card is drawn.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "global_static_modifier",
      "tag",
      "runner_draw_tax",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_322_euromarket-consortium",
    title: "Euromarket Consortium",
    side: "corp",
    type: "asset",
    subtypes: ["transactions"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 4,
    rulesText:
      "Rezzed asset with handsize, action-economy and economy modifier surfaces. Public installed state is the modifier source.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "modify_hand_limit",
      "action_economy",
      "global_static_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_324_fortress-architects",
    title: "Fortress Architects",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText:
      "Rezzed asset with global ICE install and server-building modifier surfaces. Server effects remain explicit and public.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "global_static_modifier",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_325_hacker-tracker-central",
    title: "Hacker Tracker Central",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 2,
    rulesText:
      "After each trace attempt, put 1 counter on Hacker Tracker Central. During a trace attempt, the Corp may spend counters from Hacker Tracker Central; each counter spent increases Trace strength and Trace limit by 1.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "trace",
      "counter",
      "global_static_modifier",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_327_i-got-a-rock",
    title: "I Got a Rock",
    side: "corp",
    type: "asset",
    subtypes: ["ambush"],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    trashCost: 2,
    rulesText:
      "[A], 3 agenda points: Do 15 Meat damage. Use only if Runner has two or more tags.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "meat_damage",
      "tag_condition",
      "scored_agenda",
      "agenda_point_cost",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_331_nevinyrral",
    title: "Nevinyrral",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    trashCost: 5,
    rulesText:
      "Rezzed asset with persistent action-economy surfaces. Extra or lost actions remain deterministic legal-action effects.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "action_economy",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_332_newsgroup-taunting",
    title: "Newsgroup Taunting",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 0,
    rulesText:
      "Rezzed asset with run-flow and global static modifier surfaces. Run restrictions are source-bound and public.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "run_flow",
      "global_static_modifier",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_334_pacifica-regional-ai",
    title: "Pacifica Regional AI",
    side: "corp",
    type: "asset",
    subtypes: ["ai"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "Rezzed AI asset with agenda, counter and action-economy surfaces. Public counters and actions remain explicit.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "scored_agenda",
      "counter",
      "action_economy",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_335_remote-facility",
    title: "Remote Facility",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 5,
    trashCost: 1,
    rulesText:
      "Rezzed asset with action-economy and server-state surfaces. Remote effects are scoped to visible installed state.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "action_economy",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_338_rustbelt-hq-branch",
    title: "Rustbelt HQ Branch",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 2,
    rulesText:
      "Rezzed asset with HQ handsize and economy modifier surfaces. Static effects are public and source-bound.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "modify_hand_limit",
      "global_static_modifier",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_343_south-african-mining-corp",
    title: "South African Mining Corp",
    side: "corp",
    type: "asset",
    subtypes: ["transactions"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 1,
    rulesText: "[A], [A], [A]: Gain 6 credits.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_asset_node",
      "gain_credits",
      "legal_action_only",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_360_jerusalem-city-grid",
    title: "Jerusalem City Grid",
    side: "corp",
    type: "upgrade",
    subtypes: ["region"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 5,
    rulesText:
      "Cost to rez walls on this fort is reduced by 9. All walls on this fort have +1 strength. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "generic_upgrade_root_server",
      "city_grid",
      "global_static_modifier",
      "persistent_special_state",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_317_data-masons",
    title: "Data Masons",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 1,
    rulesText:
      "Walls cost 2 less to rez and get +1 strength while Data Masons is rezzed.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "global_ice_rez_cost_modifier",
      "global_ice_strength_modifier",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_320_encoder-inc",
    title: "Encoder, Inc.",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 1,
    rulesText:
      'Code gates cost 1 less to rez while Encoder, Inc. is rezzed. All code gates have an additional "*End the run" subroutine after all other subroutines.',
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "global_ice_rez_cost_modifier",
      "subroutine_modifier",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_341_skalderviken-sa-beta-test-site",
    title: "Skälderviken SA Beta Test Site",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 2,
    rulesText: "Black ice costs 2 less to rez while this asset is rezzed.",
    mechanics: [
      "install_remote",
      "rez_card",
      "trash_on_access",
      "global_ice_rez_cost_modifier",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_350_antiquated-interface-routines",
    title: "Antiquated Interface Routines",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 1,
    rulesText: "All ice on this fort has +1 strength.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "trash_on_access",
      "server_ice_strength_modifier",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_349_aardvark",
    title: "Aardvark",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 4,
    rulesText:
      "Runner cannot use worms during runs on this fort. If Runner uses a worm during a run on this fort before Aardvark is rezzed, you may rez Aardvark to trash that worm, and any bits spent using that worm on the current piece of ice are lost to no effect. Runner may then use further icebreakers to break the ice.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "trash_on_access",
      "server_icebreaker_worm_use_then_breach_failover",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_351_bizarre-encryption-scheme",
    title: "Bizarre Encryption Scheme",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 1,
    rulesText:
      "Runner does not score any agenda or agendas on a run during which Bizarre Encryption Scheme is accessed; return that agenda to the fort instead. Runner scores the agenda at the start of his or her next turn, if neither you nor Runner has scored it by then. This does not affect any further runs.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "trash_on_access",
      "corp_access_delay_and_return_to_server_then_start_turn_score",
      "delayed_agenda_score",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_352_chester-mix",
    title: "Chester Mix",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 3,
    rulesText: "Cost to install ice on this fort is reduced by 2.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "trash_on_access",
      "ice_install_cost_mod_server",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_353_chimera",
    title: "Chimera",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 3,
    rulesText: "When Runner accesses Chimera, trash a daemon.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "trash_on_access",
      "accessed_card_ambush_daemon_trash",
      "daemon_trash_choice",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_371_tokyo-chiba-infighting",
    title: "Tokyo-Chiba Infighting",
    side: "corp",
    type: "upgrade",
    subtypes: ["region"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 6,
    rulesText:
      "Gain 2 after each unsuccessful run on this fort. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "trash_on_access",
      "region_install_rules",
      "run_unsuccessful_credit_bonus",
      "persistent_modifier",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_213_private-cybernet-police",
    title: "Private Cybernet Police",
    side: "corp",
    type: "agenda",
    subtypes: ["asset"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 7,
    agendaPoints: 2,
    rulesText: "[A]: Trace 5 - If trace is successful, give Runner a tag.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda_action",
      "trace",
      "link",
      "bid_amount",
      "add_tag",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_217_strike-force-kali",
    title: "Strike Force Kali",
    side: "corp",
    type: "agenda",
    subtypes: ["asset"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 6,
    agendaPoints: 3,
    rulesText:
      "[A]: Do 2 meat damage. Use this ability only if Runner is tagged.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "scored_agenda_action",
      "runner_is_tagged",
      "damage",
      "flatline",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_281_accounts-receivable",
    title: "Accounts Receivable",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 5,
    rulesText: "Gain 9 credits.",
    mechanics: ["play_operation", "gain_credits", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_282_annual-reviews",
    title: "Annual Reviews",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Draw three cards.",
    mechanics: ["play_operation", "draw_cards", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_283_audit-of-call-records",
    title: "Audit of Call Records",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Play only if Runner attempted two or more runs during last turn. Trace 5 - If successful, give Runner 1 tag.",
    mechanics: [
      "play_operation",
      "trace",
      "link",
      "bid_amount",
      "add_tag",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_284_chance-observation",
    title: "Chance Observation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText:
      "Play only if Runner attempted a run during last turn. Trace 5 - If successful, give Runner 1 tag.",
    mechanics: [
      "play_operation",
      "trace",
      "link",
      "bid_amount",
      "add_tag",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_285_closed-accounts",
    title: "Closed Accounts",
    side: "corp",
    type: "operation",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Play only if Runner is tagged. Runner loses all credits.",
    mechanics: [
      "play_operation",
      "runner_is_tagged",
      "runner_lose_credits",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_286_corporate-detective-agency",
    title: "Corporate Detective Agency",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Play only if Runner is tagged. Trash up to two Resources at no cost.",
    mechanics: [
      "play_operation",
      "runner_is_tagged",
      "trash_resource",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_287_datapool-by-zetatech",
    title: "Datapool® by Zetatech",
    side: "corp",
    type: "operation",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Play only if Runner is tagged. Give Runner two tags.",
    mechanics: [
      "play_operation",
      "runner_is_tagged",
      "give_runner_tag",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_288_day-shift",
    title: "Day Shift",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Draw two cards and gain 1 credit.",
    mechanics: [
      "play_operation",
      "draw_cards",
      "gain_credits",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_290_efficiency-experts",
    title: "Efficiency Experts",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Gain 3 credits.",
    mechanics: ["play_operation", "gain_credits", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_293_netwatch-credit-voucher",
    title: "Netwatch Credit Voucher",
    side: "corp",
    type: "operation",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Play only if Runner is tagged. Give Runner 1 tag and gain 1 credit.",
    mechanics: [
      "play_operation",
      "runner_is_tagged",
      "give_runner_tag",
      "gain_credits",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_295_night-shift",
    title: "Night Shift",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Gain 2 credits and draw one card.",
    mechanics: [
      "play_operation",
      "gain_credits",
      "draw_cards",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_297_overtime-incentives",
    title: "Overtime Incentives",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 4,
    rulesText: "Gain two actions.",
    mechanics: ["play_operation", "gain_actions", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_301_punitive-counterstrike",
    title: "Punitive Counterstrike",
    side: "corp",
    type: "operation",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Play only if Runner is tagged. Do 2 meat damage.",
    mechanics: [
      "play_operation",
      "runner_is_tagged",
      "damage",
      "flatline",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_302_scorched-earth",
    title: "Scorched Earth",
    side: "corp",
    type: "operation",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    cost: 3,
    rulesText: "Play only if Runner is tagged. Do 4 meat damage.",
    mechanics: [
      "play_operation",
      "runner_is_tagged",
      "damage",
      "flatline",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_306_trojan-horse",
    title: "Trojan Horse",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText:
      "Play only if Runner stole any agendas during his or her last turn. Give Runner a tag.",
    mechanics: [
      "play_operation",
      "runner_stole_agenda_last_turn",
      "give_runner_tag",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_307_urban-renewal",
    title: "Urban Renewal",
    side: "corp",
    type: "operation",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    cost: 6,
    rulesText: "Play only if Runner is tagged. Do 5 meat damage.",
    mechanics: [
      "play_operation",
      "runner_is_tagged",
      "damage",
      "flatline",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrIce({
    id: "onr_v1_222_ball-and-chain",
    title: "Ball and Chain",
    subtypes: ["code_gate"],
    rezCost: 2,
    strength: 5,
    rulesText:
      "[Subroutine] For the remainder of the run, Runner must pay 2 when encountering a piece of ice, in addition to any other costs, or end the run.",
    subroutines: [
      onrSetRunEncounterTax("onr_v1_222_ball_and_chain_encounter_tax", 2),
    ],
    mechanics: ["encounter_tax", "run_modifier"],
  }),
  onrIce({
    id: "onr_v1_223_banpei",
    title: "Banpei",
    subtypes: ["sentry", "killer"],
    rezCost: 4,
    strength: 0,
    rulesText: "[Subroutine] Trash a program.\n[Subroutine] End the run.",
    subroutines: [
      onrTrashInstalledProgram("onr_v1_223_banpei_trash_program"),
      onrEtr("onr_v1_223_banpei_etr"),
    ],
    mechanics: [
      "trash_installed_program",
      "end_the_run",
      "concrete_special_resolver",
    ],
  }),
  onrIce({
    id: "onr_v1_224_bolter-cluster",
    title: "Bolter Cluster",
    subtypes: ["sentry", "ap", "hellbolt"],
    rezCost: 7,
    strength: 4,
    rulesText:
      "[Subroutine] Do 4 net damage.\n[Subroutine] The Runner cannot break any subroutines of the next piece of ice encountered during this run.",
    subroutines: [
      onrNetDamage("onr_v1_224_bolter_cluster_net_damage", 4),
      onrSetNextEncounterNoBreakSubroutines(
        "onr_v1_224_bolter_cluster_next_ice_no_break",
      ),
    ],
    mechanics: ["damage", "flatline", "next_encounter_penalty", "run_modifier"],
  }),
  onrIce({
    id: "onr_v1_225_canis-major",
    title: "Canis Major",
    subtypes: ["sentry", "watchdog"],
    rezCost: 0,
    strength: 4,
    rulesText:
      "[Subroutine] For the remainder of the run, all further ice is encountered at +2 strength.",
    subroutines: [
      onrSetRunFutureStrengthBonus("onr_v1_225_canis_major_future_strength", 2),
    ],
    mechanics: ["encounter_ice_strength_bonus", "run_modifier"],
  }),
  onrIce({
    id: "onr_v1_226_canis-minor",
    title: "Canis Minor",
    subtypes: ["sentry", "watchdog"],
    rezCost: 0,
    strength: 5,
    rulesText:
      "[Subroutine] For the remainder of the run, all further ice is encountered at +1 strength.",
    subroutines: [
      onrSetRunFutureStrengthBonus("onr_v1_226_canis_minor_future_strength", 1),
    ],
    mechanics: ["encounter_ice_strength_bonus", "run_modifier"],
  }),
  onrIce({
    id: "onr_v1_242_fatal-attractor",
    title: "Fatal Attractor",
    subtypes: ["sentry", "black_ice", "ap"],
    rezCost: 1,
    strength: 4,
    rulesText:
      "[Subroutine] The next time Runner encounters a piece of ice during the run, do 3 Net damage unless Runner breaks all subroutines of that piece of ice.",
    subroutines: [
      onrSetNextEncounterFatalDamage(
        "onr_v1_242_fatal_attractor_next_encounter",
        3,
      ),
    ],
    mechanics: ["next_encounter_penalty", "damage", "run_modifier"],
  }),
  onrIce({
    id: "onr_v1_268_shock-r",
    title: "Shock.r",
    subtypes: ["sentry", "ap", "stun"],
    rezCost: 1,
    strength: 3,
    rulesText:
      "[Subroutine] Runner cannot break any subroutines of the next piece of ice encountered during the run, and cannot jack out until after that encounter.",
    subroutines: [
      {
        ...onrSetNextEncounterLock("onr_v1_268_shock_r_next_encounter_lock"),
        breakTags: ["stun"],
      },
    ],
    mechanics: ["next_encounter_penalty", "jack_out_lock", "run_modifier"],
  }),
  onrIce({
    id: "onr_v1_275_vacuum-link",
    title: "Vacuum Link",
    subtypes: ["sentry", "random"],
    rezCost: 3,
    strength: 5,
    rulesText:
      "[Subroutine] Roll a die. If you roll a 1, 2, or 3, Runner resumes the run from that many pieces of rezzed ice back, or jacks out. If there are not that many pieces of ice, Runner returns to the first piece of ice.",
    subroutines: [
      onrRewindRunToRezzedIceByDie("onr_v1_275_vacuum_link_rewind"),
    ],
    mechanics: ["deterministic_die_roll", "run_rewind", "jack_out_window"],
  }),
  onrIce({
    id: "onr_v1_229_code-corpse",
    title: "Code Corpse",
    subtypes: ["sentry", "ice", "ap", "zombie"],
    rezCost: 10,
    strength: 5,
    rulesText:
      "[Subroutine] Do 1 core damage.\n[Subroutine] Do 1 core damage.\n[Subroutine] End the run.",
    subroutines: [
      onrCoreDamage("onr_v1_229_code_corpse_core_damage_1", 1),
      onrCoreDamage("onr_v1_229_code_corpse_core_damage_2", 1),
      onrEtr("onr_v1_229_code_corpse_etr"),
    ],
    mechanics: ["damage", "core_damage", "flatline", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_230_cortical-scanner",
    title: "Cortical Scanner",
    subtypes: ["code_gate"],
    rezCost: 7,
    strength: 3,
    rulesText: "End the run.\nEnd the run.\nEnd the run.",
    subroutines: [
      onrEtr("onr_v1_230_cortical_scanner_etr_1"),
      onrEtr("onr_v1_230_cortical_scanner_etr_2"),
      onrEtr("onr_v1_230_cortical_scanner_etr_3"),
    ],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_231_cortical-scrub",
    title: "Cortical Scrub",
    subtypes: ["sentry", "black_ice", "ap", "brainwipe"],
    rezCost: 7,
    strength: 3,
    rulesText: "[Subroutine] Do 1 core damage.\n[Subroutine] End the run.",
    subroutines: [
      onrCoreDamage("onr_v1_231_cortical_scrub_core_damage", 1),
      onrEtr("onr_v1_231_cortical_scrub_etr"),
    ],
    mechanics: ["damage", "core_damage", "flatline", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_232_crystal-wall",
    title: "Crystal Wall",
    subtypes: ["wall"],
    rezCost: 4,
    strength: 3,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_232_crystal_wall_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_233_d-arc-knight",
    title: "D'Arc Knight",
    subtypes: ["sentry", "killer"],
    rezCost: 6,
    strength: 2,
    rulesText: "[Subroutine] Trash a program.\n[Subroutine] End the run.",
    subroutines: [
      onrTrashInstalledProgram("onr_v1_233_d_arc_knight_trash_program"),
      onrEtr("onr_v1_233_d_arc_knight_etr"),
    ],
    mechanics: ["uninstall_runner_program", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_234_data-darts",
    title: "Data Darts",
    subtypes: ["sentry", "ap", "hellbolt"],
    rezCost: 5,
    strength: 3,
    rulesText:
      "[Subroutine] Do 3 net damage.\n[Subroutine] The Runner cannot break any subroutines of the next piece of ice encountered during this run.",
    subroutines: [
      onrNetDamage("onr_v1_234_data_darts_net_damage", 3),
      onrSetNextEncounterNoBreakSubroutines(
        "onr_v1_234_data_darts_next_ice_no_break",
      ),
    ],
    mechanics: [
      "damage",
      "flatline",
      "next_encounter_penalty",
      "run_modifier",
      "event_modification",
    ],
  }),
  onrIce({
    id: "onr_v1_235_data-naga",
    title: "Data Naga",
    subtypes: ["sentry", "killer"],
    rezCost: 9,
    strength: 5,
    rulesText: "[Subroutine] Trash a program.\n[Subroutine] End the run.",
    subroutines: [
      onrTrashInstalledProgram("onr_v1_235_data_naga_trash_program"),
      onrEtr("onr_v1_235_data_naga_etr"),
    ],
    mechanics: [
      "trash_installed_program",
      "end_the_run",
      "concrete_special_resolver",
    ],
  }),
  onrIce({
    id: "onr_v1_236_data-raven",
    title: "Data Raven",
    subtypes: ["sentry"],
    rezCost: 5,
    strength: 5,
    rulesText:
      "[Subroutine] Trace 5 - If trace is successful, give Runner a tag and a Data Raven counter. Each Data Raven counter gives Runner a tag at the start of each Runner turn. Runner may remove a Data Raven counter by taking an action to pay 1.",
    subroutines: [
      {
        id: "onr_v1_236_data_raven_trace_counter",
        type: "initiate_trace",
        baseTraceStrength: 5,
        traceSuccessEffect: {
          type: "add_tag_and_counter",
          tagAmount: 1,
          counterType: "data_raven",
          amount: 1,
        },
      },
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "counter",
      "persistent_tag_counter",
    ],
  }),
  onrIce({
    id: "onr_v1_237_data-wall",
    title: "Data Wall",
    subtypes: ["wall"],
    rezCost: 1,
    strength: 0,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_237_data_wall_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_238_data-wall-2-0",
    title: "Data Wall 2.0",
    subtypes: ["wall"],
    rezCost: 2,
    strength: 1,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_238_data_wall_2_0_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_239_endless-corridor",
    title: "Endless Corridor",
    subtypes: ["code_gate"],
    rezCost: 4,
    strength: 2,
    rulesText: "End the run.\nEnd the run.",
    subroutines: [
      onrEtr("onr_v1_239_endless_corridor_etr_1"),
      onrEtr("onr_v1_239_endless_corridor_etr_2"),
    ],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_243_fetch-4-0-1",
    title: "Fetch 4.0.1",
    subtypes: ["sentry", "bloodhound"],
    rezCost: 0,
    strength: 3,
    rulesText:
      "[Subroutine] Trace 3 - If trace is successful, give Runner a tag.",
    subroutines: [
      {
        id: "onr_v1_243_fetch_4_0_1_trace",
        type: "initiate_trace",
        baseTraceStrength: 3,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ],
    mechanics: ["trace", "link", "bid_amount", "add_tag"],
  }),
  onrIce({
    id: "onr_v1_244_filter",
    title: "Filter",
    subtypes: ["code_gate"],
    rezCost: 0,
    strength: 0,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_244_filter_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_245_fire-wall",
    title: "Fire Wall",
    subtypes: ["wall"],
    rezCost: 5,
    strength: 4,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_245_fire_wall_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_247_haunting-inquisition",
    title: "Haunting Inquisition",
    subtypes: ["code_gate"],
    rezCost: 8,
    strength: 6,
    rulesText:
      "[Subroutine] Runner cannot make runs with their next six actions.\n[Subroutine] End the run.",
    subroutines: [
      onrSetRunnerRunLockActions(
        "onr_v1_247_haunting_inquisition_run_lock",
        6,
      ),
      onrEtr("onr_v1_247_haunting_inquisition_etr"),
    ],
    mechanics: ["run_modifier", "action_economy", "end_the_run", "per_card_longtail"],
  }),
  onrIce({
    id: "onr_v1_249_hunter",
    title: "Hunter",
    subtypes: ["sentry", "bloodhound"],
    rezCost: 2,
    strength: 5,
    rulesText:
      "[Subroutine] Trace 5 - If trace is successful, give Runner a tag.",
    subroutines: [
      {
        id: "onr_v1_249_hunter_trace",
        type: "initiate_trace",
        baseTraceStrength: 5,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ],
    mechanics: ["trace", "link", "bid_amount", "add_tag"],
  }),
  onrIce({
    id: "onr_v1_250_ice-pick-willie",
    title: "Ice Pick Willie",
    subtypes: ["sentry", "killer"],
    rezCost: 5,
    strength: 1,
    rulesText: "[Subroutine] Trash a program.\n[Subroutine] End the run.",
    subroutines: [
      onrTrashInstalledProgram("onr_v1_250_ice_pick_willie_trash_program"),
      onrEtr("onr_v1_250_ice_pick_willie_etr"),
    ],
    mechanics: ["trash_installed_program", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_251_jack-attack",
    title: "Jack Attack",
    subtypes: ["sentry", "ap"],
    rezCost: 3,
    strength: 3,
    rulesText:
      "[Subroutine] For the remainder of the run, Runner cannot jack out.\n[Subroutine] Trace 5 - If trace is successful, give Runner a tag.",
    subroutines: [
      onrSetRunJackOutLock("onr_v1_251_jack_attack_run_jack_out_lock"),
      {
        id: "onr_v1_251_jack_attack_trace",
        type: "initiate_trace",
        baseTraceStrength: 5,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ],
    mechanics: [
      "run_modifier",
      "jack_out_lock",
      "trace",
      "link",
      "bid_amount",
      "add_tag",
    ],
  }),
  onrIce({
    id: "onr_v1_252_keeper",
    title: "Keeper",
    subtypes: ["code_gate"],
    rezCost: 4,
    strength: 4,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_252_keeper_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_253_laser-wire",
    title: "Laser Wire",
    subtypes: ["wall"],
    rezCost: 4,
    strength: 2,
    rulesText: "Do 1 net damage. End the run.",
    subroutines: [
      onrNetDamage("onr_v1_253_laser_wire_net_damage", 1),
      onrEtr("onr_v1_253_laser_wire_etr"),
    ],
    mechanics: ["damage", "flatline", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_254_liche",
    title: "Liche",
    subtypes: ["sentry", "black_ice", "ap"],
    rezCost: 14,
    strength: 6,
    rulesText:
      "[Subroutine] Do 1 core damage.\n[Subroutine] Do 1 core damage.\n[Subroutine] Do 1 core damage.\n[Subroutine] End the run.",
    subroutines: [
      onrCoreDamage("onr_v1_254_liche_core_damage_1", 1),
      onrCoreDamage("onr_v1_254_liche_core_damage_2", 1),
      onrCoreDamage("onr_v1_254_liche_core_damage_3", 1),
      onrEtr("onr_v1_254_liche_etr"),
    ],
    mechanics: ["damage", "core_damage", "flatline", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_256_mazer",
    title: "Mazer",
    subtypes: ["code_gate"],
    rezCost: 5,
    strength: 5,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_256_mazer_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_257_nerve-labyrinth",
    title: "Nerve Labyrinth",
    subtypes: ["code_gate"],
    rezCost: 6,
    strength: 4,
    rulesText: "Do 2 net damage. End the run.",
    subroutines: [
      onrNetDamage("onr_v1_257_nerve_labyrinth_net_damage", 2),
      onrEtr("onr_v1_257_nerve_labyrinth_etr"),
    ],
    mechanics: ["damage", "flatline", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_258_neural-blade",
    title: "Neural Blade",
    subtypes: ["sentry", "ap", "sword"],
    rezCost: 4,
    strength: 4,
    rulesText:
      "[Subroutine] Do 1 net damage.\n[Subroutine] The Runner cannot break any subroutines of the next piece of ice encountered during this run.",
    subroutines: [
      onrNetDamage("onr_v1_258_neural_blade_net_damage", 1),
      onrSetNextEncounterNoBreakSubroutines(
        "onr_v1_258_neural_blade_next_ice_no_break",
      ),
    ],
    mechanics: ["damage", "flatline", "next_encounter_penalty", "run_modifier"],
  }),
  onrIce({
    id: "onr_v1_259_in-the-face",
    title: "π in the 'Face",
    subtypes: ["sentry", "deckrash"],
    rezCost: 5,
    strength: 3,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_259_in_the_face_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_261_quandary",
    title: "Quandary",
    subtypes: ["code_gate"],
    rezCost: 2,
    strength: 2,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_261_quandary_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_262_razor-wire",
    title: "Razor Wire",
    subtypes: ["wall"],
    rezCost: 6,
    strength: 3,
    rulesText: "Do 2 net damage. End the run.",
    subroutines: [
      onrNetDamage("onr_v1_262_razor_wire_net_damage", 2),
      onrEtr("onr_v1_262_razor_wire_etr"),
    ],
    mechanics: ["damage", "flatline", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_263_reinforced-wall",
    title: "Reinforced Wall",
    subtypes: ["wall"],
    rezCost: 8,
    strength: 4,
    rulesText: "End the run. End the run.",
    subroutines: [
      onrEtr("onr_v1_263_reinforced_wall_etr_1"),
      onrEtr("onr_v1_263_reinforced_wall_etr_2"),
    ],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_265_rock-is-strong",
    title: "Rock Is Strong",
    subtypes: ["wall"],
    rezCost: 6,
    strength: 5,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_265_rock_is_strong_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_266_scramble",
    title: "Scramble",
    subtypes: ["code_gate"],
    rezCost: 3,
    strength: 3,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_266_scramble_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_267_sentinels-prime",
    title: "Sentinels Prime",
    subtypes: ["sentry", "killer"],
    rezCost: 8,
    strength: 4,
    rulesText: "[Subroutine] Trash a program.\n[Subroutine] End the run.",
    subroutines: [
      onrTrashInstalledProgram("onr_v1_267_sentinels_prime_trash_program"),
      onrEtr("onr_v1_267_sentinels_prime_etr"),
    ],
    mechanics: ["uninstall_runner_program", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_269_shotgun-wire",
    title: "Shotgun Wire",
    subtypes: ["wall"],
    rezCost: 8,
    strength: 5,
    rulesText: "Do 2 net damage. End the run.",
    subroutines: [
      onrNetDamage("onr_v1_269_shotgun_wire_net_damage", 2),
      onrEtr("onr_v1_269_shotgun_wire_etr"),
    ],
    mechanics: ["damage", "flatline", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_270_sleeper",
    title: "Sleeper",
    subtypes: ["code_gate"],
    rezCost: 1,
    strength: 1,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_270_sleeper_etr")],
    mechanics: ["end_the_run"],
  }),
  onrIce({
    id: "onr_v1_271_tko-2-0",
    title: "TKO 2.0",
    subtypes: ["sentry", "ap", "knockout"],
    rezCost: 7,
    strength: 4,
    rulesText:
      "[Subroutine] End the run, and Runner forgoes his or her next action.",
    subroutines: [
      {
        ...onrSetRunnerForgoNextAction("onr_v1_271_tko_2_0_forgo_next_action"),
        breakTags: ["knockout"],
      },
      onrEtr("onr_v1_271_tko_2_0_etr"),
    ],
    mechanics: ["end_the_run", "action_economy", "run_modifier"],
  }),
  onrIce({
    id: "onr_v1_272_too-many-doors",
    title: "Too Many Doors",
    subtypes: ["sentry"],
    rezCost: 1,
    strength: 3,
    rulesText:
      "[Subroutine] Secretly spend 0, 1, or 2; Runner does the same. Then reveal how much each of you spent. End the run unless the Corp spent at least as many credits as Runner spent.",
    subroutines: [
      onrReorderCorpRdTop2("onr_v1_272_too_many_doors_reorder_rd_top2"),
    ],
    mechanics: ["reorder_rd", "hidden_zone_tool"],
  }),
  onrIce({
    id: "onr_v1_274_tutor",
    title: "Tutor",
    subtypes: ["code_gate"],
    rezCost: 4,
    strength: 5,
    rulesText:
      "[Subroutine] For the remainder of the run, each later encountered ice gains an additional end-the-run subroutine.",
    subroutines: [
      onrSetRunFutureEndTheRunSubroutine(
        "onr_v1_274_tutor_future_end_the_run",
      ),
    ],
    mechanics: ["run_modifier", "end_the_run", "per_card_longtail"],
  }),
  onrIce({
    id: "onr_v1_273_triggerman",
    title: "Triggerman",
    subtypes: ["sentry", "killer"],
    rezCost: 7,
    strength: 3,
    rulesText: "[Subroutine] Trash a program.\n[Subroutine] End the run.",
    subroutines: [
      onrTrashInstalledProgram("onr_v1_273_triggerman_trash_program"),
      onrEtr("onr_v1_273_triggerman_etr"),
    ],
    mechanics: ["uninstall_runner_program", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_276_viral-15",
    title: "Viral 15",
    subtypes: ["sentry"],
    rezCost: 5,
    strength: 3,
    rulesText:
      "[Subroutine] For the remainder of the run, Runner must pay 1 to jack out, in addition to any other costs.\n[Subroutine] For the remainder of the run, Runner trashes an installed program after passing each piece of rezzed ice, including Viral 15, unless Runner jacks out.",
    subroutines: [onrSetRunViral15("onr_v1_276_viral_15_run_modifier")],
    mechanics: [
      "run_modifier",
      "jack_out_tax",
      "uninstall_runner_program",
      "per_card_longtail",
    ],
  }),
  onrIce({
    id: "onr_v1_277_virizz",
    title: "Virizz",
    subtypes: ["sentry"],
    rezCost: 2,
    strength: 4,
    rulesText:
      "[Subroutine] For the remainder of the run, the Runner must pay 1 additional credit to break each ice subroutine.",
    subroutines: [
      onrSetRunBreakSubroutineCostModifier(
        "onr_v1_277_virizz_break_cost_modifier",
        1,
      ),
    ],
    mechanics: ["run_modifier", "per_card_longtail"],
  }),
  onrIce({
    id: "onr_v1_280_zombie",
    title: "Zombie",
    subtypes: ["sentry", "black_ice", "ap", "zombie"],
    rezCost: 9,
    strength: 4,
    rulesText:
      "[Subroutine] Do 1 core damage.\n[Subroutine] Do 1 core damage.\n[Subroutine] End the run.",
    subroutines: [
      onrCoreDamage("onr_v1_280_zombie_core_damage_1", 1),
      onrCoreDamage("onr_v1_280_zombie_core_damage_2", 1),
      onrEtr("onr_v1_280_zombie_etr"),
    ],
    mechanics: [
      "damage",
      "core_damage",
      "flatline",
      "end_the_run",
      "per_card_longtail",
    ],
  }),
  onrIce({
    id: "onr_v1_278_wall-of-ice",
    title: "Wall of Ice",
    subtypes: ["wall"],
    rezCost: 13,
    strength: 6,
    rulesText: "Do 2 net damage. Do 2 net damage. End the run. End the run.",
    subroutines: [
      onrNetDamage("onr_v1_278_wall_of_ice_net_damage_1", 2),
      onrNetDamage("onr_v1_278_wall_of_ice_net_damage_2", 2),
      onrEtr("onr_v1_278_wall_of_ice_etr_1"),
      onrEtr("onr_v1_278_wall_of_ice_etr_2"),
    ],
    mechanics: ["damage", "flatline", "end_the_run"],
  }),
  onrIce({
    id: "onr_v1_279_wall-of-static",
    title: "Wall of Static",
    subtypes: ["wall"],
    rezCost: 3,
    strength: 2,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_279_wall_of_static_etr")],
    mechanics: ["end_the_run"],
  }),
  {
    id: "onr_v1_053_ramming-piston",
    title: "Ramming Piston",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "noisy"],
    implementationStatus: "playable_mvp",
    installCost: 4,
    memoryCost: 1,
    strength: 5,
    rulesText:
      "[2]: Break wall subroutine. [1]: +1 strength. After each wall subroutine broken with Ramming Piston, lose a total of 2 credits from Stealth cards.",
    abilities: [
      {
        id: "ramming_piston_break_wall",
        type: "break_subroutine",
        cost: { credits: 2 },
        iceSubtype: "wall",
        timingPoint: "run.encounter_ice",
        postBreakStealthLoss: 2,
      },
      {
        id: "ramming_piston_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "icebreaker",
      "wall_breaker",
      "pump_strength",
      "stealth_loss",
      "subtype_noisy",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_056_replicator",
    title: "Replicator",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker"],
    implementationStatus: "playable_mvp",
    installCost: 5,
    memoryCost: 1,
    strength: 2,
    rulesText:
      "0 credits: Break trace subroutine. 1 credit: +1 strength.",
    abilities: [
      {
        id: "replicator_break_trace",
        type: "break_subroutine",
        cost: { credits: 0 },
        subroutineBreakTags: ["trace"],
        timingPoint: "run.encounter_ice",
      },
      {
        id: "replicator_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "icebreaker",
      "trace",
      "link",
      "bid_amount",
      "pump_breaker",
      "break_subroutine",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_063_signpost",
    title: "Signpost",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    rulesText:
      "1 credit: +2 link. Use this ability only once during each trace attempt, and only after both players have revealed how much they spent.",
    mechanics: [
      "install_program",
      "memory",
      "trace",
      "link",
      "bid_amount",
      "post_bid_link",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_116_total-genetic-retrofit",
    title: "Total Genetic Retrofit",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 3,
    rulesText: "Play only while tagged. Remove all Runner tags.",
    mechanics: [
      "play_event",
      "tag_avoid",
      "event_modification",
      "damage_prevention",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_120_armadillo-armored-road-home",
    title: '"Armadillo" Armored Road Home',
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    recurringCredits: 2,
    rulesText:
      "Put 2 bits on Armored Road Home when it is installed. Use these bits only to pay for removing tags. If you use any of these bits, replace them at the start of your next turn. [T]: Prevent up to 3 meat damage.",
    mechanics: [
      "install_hardware",
      "recurring_credit",
      "recurring_start_turn",
      "tag_avoid",
      "damage_prevention",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_126_drifter-mobile-environment",
    title: '"Drifter" Mobile Environment',
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    recurringCredits: 2,
    rulesText:
      "Put 2 bits on Mobile Environment when it is installed. Use these bits only to pay for removing tags. If you use any of these bits, replace them at the start of your next turn.",
    mechanics: [
      "install_hardware",
      "recurring_credit",
      "recurring_start_turn",
      "tag_avoid",
      "remove_tag",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_132_microtech-trode-set",
    title: "Microtech 'Trode Set",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    baseLink: 1,
    rulesText: "+1 link for trace bidding; damage overlap remains side-safe.",
    mechanics: [
      "install_hardware",
      "trace",
      "link",
      "bid_amount",
      "damage_prevention",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_154_broker",
    title: "Broker",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 3,
    rulesText: "Installed resource for tag-risk economy decisions.",
    mechanics: [
      "install_resource",
      "resource_action",
      "resource_tag_interaction",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_157_crash-everett-inventive-fixer",
    title: "Crash Everett, Inventive Fixer",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    rulesText:
      "Installed resource action with side-safe draw and economy planning.",
    mechanics: [
      "install_resource",
      "resource_action",
      "draw_cards",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_162_field-reporter-for-ice-and-data",
    title: "Field Reporter for Ice and Data",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText: "Installed information resource with tag-risk interaction.",
    mechanics: [
      "install_resource",
      "resource_action",
      "resource_tag_interaction",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_164_hells-run",
    title: "Hell's Run",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    recurringCredits: 1,
    rulesText:
      "Put 1 bit on Hell's Run when it is installed. Use this bit only to pay for increasing your link. If you use the bit, replace it at the start of your next turn.",
    mechanics: [
      "install_resource",
      "counter",
      "recurring_credit",
      "trace",
      "link",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_165_junkyard-bbs",
    title: "Junkyard BBS",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText: "Installed resource action with tag-risk interaction.",
    mechanics: [
      "install_resource",
      "resource_action",
      "resource_tag_interaction",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_166_karl-de-veres-corporate-stooge",
    title: "Karl de Veres, Corporate Stooge",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    rulesText: "Installed resource for tag-risk and Corp-pressure decisions.",
    mechanics: [
      "install_resource",
      "resource_action",
      "resource_tag_interaction",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_167_leland-corporate-bodyguard",
    title: "Leland, Corporate Bodyguard",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    rulesText: "Installed resource for tag and damage protection overlap.",
    mechanics: [
      "install_resource",
      "resource_tag_interaction",
      "tag_avoid",
      "damage_prevention",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_178_short-term-contract",
    title: "Short-Term Contract",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText:
      "Put 12 credits on Short-Term Contract when installed. [A]: Take 2 credits from it. Trash it when empty.",
    mechanics: [
      "install_resource",
      "resource_action",
      "gain_credit",
      "resource_tag_interaction",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_181_the-springboard",
    title: "The Springboard",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "1 credit: +1 link. Use this ability only once during each trace attempt, and only after both players have revealed how much they spent.",
    mechanics: [
      "install_resource",
      "trace",
      "link",
      "bid_amount",
      "post_bid_link",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_183_technician-lover",
    title: "Technician Lover",
    side: "runner",
    type: "resource",
    subtypes: ["connection"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    rulesText: "Installed resource action with tag-risk interaction.",
    mechanics: [
      "install_resource",
      "resource_action",
      "resource_tag_interaction",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrIce({
    id: "onr_v1_221_asp",
    title: "Asp",
    subtypes: ["sentry"],
    rezCost: 4,
    strength: 4,
    rulesText:
      "Trace 5. If successful, end the run. The Runner cannot make another run until they take an action to pay 1.",
    subroutines: [
      {
        id: "onr_v1_221_asp_trace",
        type: "initiate_trace",
        baseTraceStrength: 5,
        traceSuccessEffect: { type: "end_run_and_run_lock", amount: 1 },
      },
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "end_the_run",
      "run_lock",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
  onrIce({
    id: "onr_v1_228_cinderella",
    title: "Cinderella",
    subtypes: ["sentry", "black_ice", "ap", "firestarter"],
    rezCost: 8,
    strength: 6,
    rulesText:
      "Trace 6. If successful, end the run, trash 1 installed Runner hardware, and do 2 meat damage that cannot be prevented.",
    subroutines: [
      {
        id: "onr_v1_228_cinderella_trace",
        type: "initiate_trace",
        baseTraceStrength: 6,
        traceSuccessEffect: { type: "none" },
      },
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "trash_hardware",
      "damage",
      "damage_prevention",
      "end_the_run",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
  onrIce({
    id: "onr_v1_240_fang",
    title: "Fang",
    subtypes: ["sentry", "pit_bull"],
    rezCost: 5,
    strength: 4,
    rulesText:
      "Trace 4. If successful, end the run. The Runner cannot make another run until they take an action to pay 2.",
    subroutines: [
      {
        id: "onr_v1_240_fang_trace",
        type: "initiate_trace",
        baseTraceStrength: 4,
        traceSuccessEffect: { type: "end_run_and_run_lock", amount: 2 },
      },
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "end_the_run",
      "run_lock",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
  onrIce({
    id: "onr_v1_241_fang-2-0",
    title: "Fang 2.0",
    subtypes: ["sentry", "pit_bull"],
    rezCost: 6,
    strength: 5,
    rulesText:
      "Trace 5. If successful, end the run. The Runner cannot make another run until they take an action to pay 2.",
    subroutines: [
      {
        id: "onr_v1_241_fang_2_0_trace",
        type: "initiate_trace",
        baseTraceStrength: 5,
        traceSuccessEffect: { type: "end_run_and_run_lock", amount: 2 },
      },
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "end_the_run",
      "run_lock",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
  onrIce({
    id: "onr_v1_248_homewrecker",
    title: "Homewrecker",
    subtypes: ["sentry", "black_ice", "ap", "firestarter"],
    rezCost: 7,
    strength: 5,
    rulesText:
      "Trace 5. If successful, end the run, trash 1 installed Runner hardware, and do 2 meat damage that cannot be prevented.",
    subroutines: [
      {
        id: "onr_v1_248_homewrecker_trace",
        type: "initiate_trace",
        baseTraceStrength: 5,
        traceSuccessEffect: { type: "none" },
      },
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "trash_hardware",
      "damage",
      "damage_prevention",
      "end_the_run",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
  onrIce({
    id: "onr_v1_260_pocket-virtual-reality",
    title: "Pocket Virtual Reality",
    subtypes: ["sentry"],
    rezCost: 7,
    strength: 4,
    rulesText:
      "Trace 6. If successful, give the Runner 1 tag. Trace 6. If successful, give the Runner 1 tag. Whenever Pocket Virtual Reality is encountered, gain 4 temporary credits usable only for these traces; return unused credits when the encounter ends.",
    subroutines: [
      {
        id: "onr_v1_260_pocket_virtual_reality_trace",
        type: "initiate_trace",
        baseTraceStrength: 6,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "add_tag",
      "counter",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
  onrIce({
    id: "onr_v1_264_rex",
    title: "Rex",
    subtypes: ["sentry", "pit_bull"],
    rezCost: 4,
    strength: 3,
    rulesText:
      "Trace 3. If successful, end the run. The Runner cannot make another run until they take an action to pay 2.",
    subroutines: [
      {
        id: "onr_v1_264_rex_trace",
        type: "initiate_trace",
        baseTraceStrength: 3,
        traceSuccessEffect: { type: "end_run_and_run_lock", amount: 2 },
      },
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "end_the_run",
      "run_lock",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
  {
    id: "onr_v1_299_power-grid-overload",
    title: "Power Grid Overload",
    side: "corp",
    type: "operation",
    subtypes: ["gray-ops"],
    implementationStatus: "playable_mvp",
    rulesText:
      "Play only if the Runner is tagged. Pay X to trash X pieces of installed Runner hardware, other than Cybernetics.",
    mechanics: [
      "play_operation",
      "tag_condition",
      "trash_hardware",
      "resource_tag_interaction",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_020_dupre",
    title: "Dupré",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    memoryCost: 1,
    strength: 0,
    rulesText:
      "1: Break code gate subroutine. 2: +1 strength. Put 1 strength counter on Dupré after each run during which it broke a subroutine. When Dupré is used on a different fort from the last one, lose all strength counters on it.",
    abilities: [
      {
        id: "onr_v1_020_dupre_pump",
        type: "pump_strength",
        cost: { credits: 2 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "onr_v1_020_dupre_break_code_gate",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "code_gate",
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "icebreaker",
      "pump_strength",
      "break_subroutine",
      "counter",
      "code_gate",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_024_expert-schedule-analyzer",
    title: "Expert Schedule Analyzer",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Installed access tool for breach planning and additional access support.",
    mechanics: [
      "install_program",
      "memory",
      "access",
      "multiaccess",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_041_microtech-ai-interface",
    title: "Microtech AI Interface",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "Installed access tool for breach planning and additional access support.",
    mechanics: [
      "install_program",
      "memory",
      "access",
      "multiaccess",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_043_mystery-box",
    title: "Mystery Box",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "Installed run helper with side-safe hidden-zone reveal support.",
    mechanics: [
      "install_program",
      "memory",
      "run_flow",
      "reveal",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_062_shredder-uplink-protocol",
    title: "Shredder Uplink Protocol",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 4,
    memoryCost: 2,
    rulesText:
      "A: Make a run on the Archives. If run is successful, do not access cards from the Archives; instead, treat run as a successful run on HQ.",
    mechanics: [
      "install_program",
      "memory",
      "run_flow",
      "access",
      "multiaccess",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_065_smarteye",
    title: "Smarteye",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    rulesText: "Installed run helper with side-safe reveal support.",
    abilities: [
      {
        id: "onr_v1_065_smarteye_approach_ice_expose",
        type: "approach_ice_expose",
        cost: { credits: 0 },
        timingPoint: "run.approach_ice",
        kind: "triggered",
        allowedTimingPoints: ["run.approach_ice"],
        publicActionType: "trigger_ability",
        useLimit: "once_per_run",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "run_flow",
      "reveal",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_098_lucidrine-booster-drug",
    title: "Lucidrine Booster Drug",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Make a run with replacement and avoid overlap support.",
    mechanics: [
      "play_event",
      "run_flow",
      "event_modification",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_105_priority-wreck",
    title: "Priority Wreck",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Make a run. If successful, access 1 additional card during the breach.",
    mechanics: ["play_event", "access", "multiaccess", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_111_social-engineering",
    title: "Social Engineering",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Make a run and resolve normal access if successful.",
    mechanics: ["play_event", "run_flow", "access", ONR_V1_LOCAL_PRIVATE],
  },
  {
    id: "onr_v1_112_stumble-through-wilderspace",
    title: "Stumble through Wilderspace",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 2,
    rulesText:
      "Make a trace-aware run and resolve normal access if successful.",
    mechanics: [
      "play_event",
      "trace",
      "link",
      "run_flow",
      "access",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_142_record-reconstructor",
    title: "Record Reconstructor",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "Installed hardware for access and side-safe hidden-zone support.",
    mechanics: [
      "install_hardware",
      "access",
      "multiaccess",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrIce({
    id: "onr_v1_227_cerberus",
    title: "Cerberus",
    subtypes: ["sentry", "black_ice", "ap", "hellhound"],
    rezCost: 11,
    strength: 5,
    rulesText:
      "[Subroutine] Do 3 Net damage.\n[Subroutine] Trace 5 - If trace is successful, give Runner a Cerberus counter. Each Cerberus counter does 2 Net damage at the start of each run. Runner may remove a Cerberus counter by taking an action to spend 4.\n[Subroutine] End the run.",
    subroutines: [
      onrNetDamage("onr_v1_227_cerberus_net_damage", 3),
      {
        id: "onr_v1_227_cerberus_trace",
        type: "initiate_trace",
        baseTraceStrength: 5,
        traceSuccessEffect: {
          type: "add_counter",
          counterType: "cerberus",
          amount: 1,
        },
      },
      onrEtr("onr_v1_227_cerberus_etr"),
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "damage",
      "persistent_counter",
      "end_the_run",
      "run_flow",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
  onrIce({
    id: "onr_v1_255_mastiff",
    title: "Mastiff",
    subtypes: ["sentry", "black_ice", "ap", "hellhound", "watchdog"],
    rezCost: 12,
    strength: 5,
    rulesText:
      "[Subroutine] Do 1 brain damage.\n[Subroutine] Do 1 Net damage.\n[Subroutine] For the remainder of the run, all ice is encountered at +1 strength.\n[Subroutine] Trace 5 - If trace is successful, give Runner a Mastiff counter.\n[Subroutine] End the run.",
    subroutines: [
      onrCoreDamage("onr_v1_255_mastiff_core_damage", 1),
      onrNetDamage("onr_v1_255_mastiff_net_damage", 1),
      onrSetRunFutureStrengthBonus("onr_v1_255_mastiff_strength_bonus", 1),
      {
        id: "onr_v1_255_mastiff_trace",
        type: "initiate_trace",
        baseTraceStrength: 5,
        traceSuccessEffect: {
          type: "add_counter",
          counterType: "mastiff",
          amount: 1,
        },
      },
      onrEtr("onr_v1_255_mastiff_etr"),
    ],
    mechanics: [
      "trace",
      "link",
      "bid_amount",
      "persistent_counter",
      "damage",
      "core_damage",
      "encounter_ice_strength_bonus",
      "run_modifier",
      "end_the_run",
      "run_flow",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
  {
    id: "onr_v1_294_new-blood",
    title: "New Blood",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Conceal all revealed but unrezzed ice; then rearrange your installed ice by swapping pairs of ice while Runner looks away.",
    mechanics: [
      "play_operation",
      "run_flow",
      "recurring_credit",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_003_baedekers-net-map",
    title: "Baedeker's Net Map",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 1,
    memoryCost: 1,
    baseLink: 1,
    rulesText:
      "Installed program that contributes base link for trace interactions.",
    mechanics: [
      "install_program",
      "memory",
      "base_link",
      "trace",
      "link",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_004_bakdoor",
    title: "Bakdoor",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 2,
    baseLink: 1,
    rulesText:
      "Installed program that contributes base link for trace interactions.",
    mechanics: [
      "install_program",
      "memory",
      "base_link",
      "trace",
      "link",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_033_imp",
    title: "Imp",
    side: "runner",
    type: "program",
    subtypes: ["daemon"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText: "Daemon program for hosting and hosted-card lifecycle coverage.",
    mechanics: [
      "install_program",
      "memory",
      "hosting",
      "hosted_program_lifecycle",
      "subtype_daemon",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_035_invisibility",
    title: "Invisibility",
    side: "runner",
    type: "program",
    subtypes: ["stealth"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    recurringCredits: 1,
    rulesText: "Stealth program with recurring run credits.",
    mechanics: [
      "install_program",
      "memory",
      "subtype_stealth",
      "recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_047_pile-driver",
    title: "Pile Driver",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "fracter", "stealth", "noisy"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    memoryCost: 1,
    strength: 7,
    recurringCredits: 1,
    rulesText:
      "3 credits: Break up to four wall subroutines on a single piece of ice. 1 credit: +1 strength. Whenever you use Pile Driver's break-walls ability, lose a total of 3 credits from Stealth cards.",
    abilities: [
      {
        id: "onr_v1_047_pile_driver_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "onr_v1_047_pile_driver_break",
        type: "break_subroutine",
        cost: { credits: 3 },
        iceSubtype: "wall",
        postBreakStealthLoss: 3,
        count: 4,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
      "multi_subroutine_break",
      "subtype_stealth",
      "subtype_noisy",
      "stealth_loss",
      "recurring_credit",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_050_r-and-d-protocol-files",
    title: "R&D-Protocol Files",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText:
      "A: Make a run on R&D, but instead of accessing cards, look at the top five cards of R&D.",
    mechanics: [
      "install_program",
      "memory",
      "start_run",
      "rd_run",
      "access_replacement",
      "hidden_zone_tool",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_071_vewy-vewy-quiet",
    title: "Vewy Vewy Quiet",
    side: "runner",
    type: "program",
    subtypes: ["stealth"],
    implementationStatus: "playable_mvp",
    installCost: 4,
    memoryCost: 1,
    recurringCredits: 2,
    rulesText:
      "2 recurring credits for icebreaker costs during runs; these credits cannot be used for noisy icebreakers.",
    mechanics: [
      "install_program",
      "memory",
      "subtype_stealth",
      "recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_140_raven-microcyb-eagle",
    title: "Raven Microcyb Eagle",
    side: "runner",
    type: "hardware",
    subtypes: ["stealth"],
    implementationStatus: "playable_mvp",
    installCost: 6,
    recurringCredits: 1,
    rulesText: "Hardware that supplies recurring stealth credits for runs.",
    mechanics: [
      "install_hardware",
      "subtype_stealth",
      "recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_141_raven-microcyb-owl",
    title: "Raven Microcyb Owl",
    side: "runner",
    type: "hardware",
    subtypes: ["stealth"],
    implementationStatus: "playable_mvp",
    installCost: 11,
    recurringCredits: 3,
    rulesText:
      "Put 3 bits on Microcyb Owl when it is installed. Use these bits only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use any of these bits, replace them at the start of your next turn.",
    mechanics: [
      "install_hardware",
      "subtype_stealth",
      "recurring_credit",
      "recurring_start_turn",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_148_access-through-alpha",
    title: "Access through Alpha",
    side: "runner",
    type: "resource",
    subtypes: ["link"],
    implementationStatus: "playable_mvp",
    installCost: 9,
    baseLink: 9,
    rulesText:
      "1 credit: Base link 9. Only one base-link card is used for each trace attempt.",
    mechanics: [
      "install_resource",
      "base_link",
      "trace",
      "link",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_149_access-to-arasaka",
    title: "Access to Arasaka",
    side: "runner",
    type: "resource",
    subtypes: ["link"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    baseLink: 1,
    rulesText: "Resource that contributes base link for trace interactions.",
    mechanics: [
      "install_resource",
      "base_link",
      "trace",
      "link",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_150_access-to-kiribati",
    title: "Access to Kiribati",
    side: "runner",
    type: "resource",
    subtypes: ["link"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    baseLink: 1,
    rulesText: "Resource that contributes base link for trace interactions.",
    mechanics: [
      "install_resource",
      "base_link",
      "trace",
      "link",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_152_back-door-to-hilliard",
    title: "Back Door to Hilliard",
    side: "runner",
    type: "resource",
    subtypes: ["link"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    baseLink: 1,
    rulesText: "Resource that contributes base link for trace interactions.",
    mechanics: [
      "install_resource",
      "base_link",
      "trace",
      "link",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_153_back-door-to-orbital-air",
    title: "Back Door to Orbital Air",
    side: "runner",
    type: "resource",
    subtypes: ["link"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    baseLink: 1,
    rulesText: "Resource that contributes base link for trace interactions.",
    mechanics: [
      "install_resource",
      "base_link",
      "trace",
      "link",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  {
    id: "onr_v1_182_submarine-uplink",
    title: "Submarine Uplink",
    side: "runner",
    type: "resource",
    subtypes: ["link"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    baseLink: 1,
    rulesText:
      "Resource with base link and counter interaction for trace support.",
    mechanics: [
      "install_resource",
      "base_link",
      "trace",
      "link",
      "counter",
      ONR_V1_LOCAL_PRIVATE,
    ],
  },
  onrIce({
    id: "onr_v1_246_fragmentation-storm",
    title: "Fragmentation Storm",
    subtypes: ["sentry"],
    rezCost: 6,
    strength: 4,
    rulesText:
      "Trace 4. If successful, end the run and trash a program. The Runner cannot make another run until they take an action to pay 1.",
    subroutines: [
      {
        id: "onr_v1_246_fragmentation_storm_trace",
        type: "initiate_trace",
        baseTraceStrength: 4,
        traceSuccessEffect: {
          type: "end_run_trash_program_and_run_lock",
          amount: 1,
        },
      },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "trace",
      "link",
      "end_the_run",
      "run_lock",
      "trash_installed_program",
      ONR_V1_LOCAL_PRIVATE,
    ],
  }),
];

const PROTEUS_VISIBLE_BASELINE_CARDS: CardDefinition[] = [
  {
    id: "onr_proteus_002_charity-takeover",
    title: "Charity Takeover",
    side: "corp",
    type: "agenda",
    subtypes: ["bad_publicity", "black_ops"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 1,
    rulesText:
      "Gain [9] and 1 Bad Publicity point. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.",
    mechanics: [
      "score_agenda",
      "gain_credits",
      "bad_publicity",
      "bad_publicity_loss_gate",
    ],
  },
  {
    id: "onr_proteus_009_viral-breeding-ground",
    title: "Viral Breeding Ground",
    side: "corp",
    type: "agenda",
    subtypes: ["ambush", "research", "virus"],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 2,
    rulesText:
      "When you score Viral Breeding Ground, trash all cards installed in or on the fort it was installed in. When Runner accesses Viral Breeding Ground, choose up to two installed programs for each advancement counter on it; Runner brings those programs into their grip.",
    mechanics: [
      "score_agenda",
      "access_ambush",
      "advancement_counter",
      "trash_installed_card",
      "return_installed_program_to_grip",
      "proteus_antibody_counter_family",
    ],
  },
  {
    id: "onr_proteus_031_minotaur",
    title: "Minotaur",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 6,
    strength: 4,
    rulesText:
      'For each rezzed code gate or wall installed outside Minotaur, Minotaur has one "[Subroutine] End the run" subroutine.',
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "dynamic_subroutine",
      "end_the_run",
      "proteus_dynamic_public_etr_ice",
    ],
  },
  {
    id: "onr_proteus_054_bel-digmo-antibody",
    title: "Bel-Digmo Antibody",
    side: "corp",
    type: "asset",
    subtypes: ["node", "ambush", "virus"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "Shuffle Bel-Digmo Antibody into R&D when it is rezzed. When Runner accesses Bel-Digmo Antibody from R&D, do 1 Net damage, and Runner must show it to you.",
    mechanics: [
      "install_remote",
      "rez_asset",
      "access_ambush",
      "net_damage",
      "shuffle_into_rd",
      "proteus_antibody_counter_family",
    ],
  },
  {
    id: "onr_proteus_057_doppelganger-antibody",
    title: "Doppelganger Antibody",
    side: "corp",
    type: "asset",
    subtypes: ["node", "ambush", "virus"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "When Runner accesses Doppelganger Antibody, you may pay [2] to give Runner a Doppelganger counter, even if Doppelganger is not installed. Ignore this effect if Runner accesses Doppelganger from the Archives. Each Doppelganger counter causes Runner to lose [1] at the start of each of his or her turns. Runner may take an action to pay [4] to remove a Doppelganger counter. If Doppelganger is accessed from R&D, Runner must show it to you.",
    mechanics: [
      "install_remote",
      "rez_asset",
      "access_ambush",
      "runner_status_counter",
      "lose_credits",
      "proteus_antibody_counter_family",
    ],
  },
  {
    id: "onr_proteus_068_pattel-antibody",
    title: "Pattel Antibody",
    side: "corp",
    type: "asset",
    subtypes: ["node", "ambush", "virus"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "When Runner accesses Pattel Antibody, you may pay [3] to put a Pattel counter on all installed icebreakers, even if Pattel Antibody is not installed. Ignore this effect if Runner accesses Pattel Antibody from the Archives. Each Pattel counter on an icebreaker reduces its strength by 1. If Pattel Antibody is accessed from R&D, Runner must show it to you.",
    mechanics: [
      "install_remote",
      "rez_asset",
      "access_ambush",
      "icebreaker_counter",
      "icebreaker_strength",
      "proteus_antibody_counter_family",
    ],
  },
  {
    id: "onr_proteus_075_stereogram-antibody",
    title: "Stereogram Antibody",
    side: "corp",
    type: "asset",
    subtypes: ["node", "ambush", "virus"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "When Runner accesses Stereogram Antibody from the Archives, do 1 Net damage and shuffle Stereogram Antibody into R&D.",
    mechanics: [
      "access_archives",
      "access_ambush",
      "net_damage",
      "shuffle_into_rd",
      "proteus_antibody_counter_family",
    ],
  },
  {
    id: "onr_proteus_034_riddler",
    title: "Riddler",
    side: "corp",
    type: "ice",
    subtypes: ["code_gate"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    strength: 4,
    rulesText:
      '[2]: Riddler has one "[Subroutine] End the run" subroutine for the present encounter. Use this ability only when Runner encounters Riddler.',
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "dynamic_subroutine",
      "end_the_run",
      "proteus_dynamic_public_etr_ice",
    ],
  },
  {
    id: "onr_proteus_062_lesley-major",
    title: "Lesley Major",
    side: "corp",
    type: "upgrade",
    subtypes: ["sysop"],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 0,
    rulesText:
      "Install Lesley Major only in a subsidiary data fort. [5]: Add two advancement counters, at no cost, to a card installed in this data fort. Use this ability only when Runner passes the last piece of ice on this fort, and only once per run.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "fort_run_window",
      "advancement_counter",
      "proteus_public_fort_pass_window",
    ],
  },
  {
    id: "onr_proteus_070_rasmin-bridger",
    title: "Rasmin Bridger",
    side: "corp",
    type: "upgrade",
    subtypes: ["sysop"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    trashCost: 2,
    rulesText:
      "After Runner passes each piece of ice on this fort, Runner must pay [1] or end the run.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "fort_run_window",
      "run_tax",
      "proteus_public_fort_pass_window",
    ],
  },
  {
    id: "onr_proteus_041_toughoniumtm-wall",
    title: "Toughonium™ Wall",
    side: "corp",
    type: "ice",
    subtypes: ["wall"],
    implementationStatus: "playable_mvp",
    rezCost: 13,
    strength: 7,
    rulesText:
      "[Subroutine] End the run.\n[Subroutine] End the run.\n[Subroutine] End the run.\n[Subroutine] End the run.",
    subroutines: [
      { id: "onr_proteus_041_toughonium_wall_etr_1", type: "end_the_run" },
      { id: "onr_proteus_041_toughonium_wall_etr_2", type: "end_the_run" },
      { id: "onr_proteus_041_toughonium_wall_etr_3", type: "end_the_run" },
      { id: "onr_proteus_041_toughonium_wall_etr_4", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "end_the_run",
      "proteus_visible_baseline",
    ],
  },
  {
    id: "onr_proteus_065_networked-center",
    title: "Networked Center",
    side: "corp",
    type: "upgrade",
    subtypes: ["asset", "region"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    trashCost: 3,
    rulesText:
      "The difficulty of Gray Ops agendas installed in this fort is reduced by 1. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "region",
      "agenda_difficulty",
      "proteus_visible_baseline",
    ],
  },
  {
    id: "onr_proteus_072_research-bunker",
    title: "Research Bunker",
    side: "corp",
    type: "upgrade",
    subtypes: ["asset", "region"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    trashCost: 3,
    rulesText:
      "The difficulty of research agendas installed in this fort is reduced by 1. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "region",
      "agenda_difficulty",
      "proteus_visible_baseline",
    ],
  },
  {
    id: "onr_proteus_077_weapons-depot",
    title: "Weapons Depot",
    side: "corp",
    type: "upgrade",
    subtypes: ["asset", "region"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    trashCost: 3,
    rulesText:
      "The difficulty of Black Ops agendas installed in this fort is reduced by 1. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
    mechanics: [
      "install_remote",
      "rez_upgrade",
      "region",
      "agenda_difficulty",
      "proteus_visible_baseline",
    ],
  },
  {
    id: "onr_proteus_078_armageddon",
    title: "Armageddon",
    side: "runner",
    type: "program",
    subtypes: ["random", "virus"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    memoryCost: 1,
    rulesText:
      "After each successful run on R&D, you may choose to give the Corp a Doom counter instead of accessing cards from R&D. Each Doom counter forces the Corp to roll a die whenever it installs a card. On a 6, the card is trashed after it is installed, and the Corp removes a Doom counter. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
    mechanics: [
      "install_program",
      "virus",
      "successful_run_replacement",
      "random_die_resolution",
      "corp_install_trigger",
      "proteus_random_virus_longtail",
    ],
  },
  {
    id: "onr_proteus_084_crumble",
    title: "Crumble",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "After each successful run on HQ, give the Corp a Crumble counter. Two or more Crumble counters allow you trash, at no cost, any cards accessed from HQ, even if the cards cannot normally be trashed. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
    mechanics: [
      "install_program",
      "virus",
      "successful_run_counter",
      "free_access_trash",
      "proteus_runner_virus_access_trash",
    ],
  },
  {
    id: "onr_proteus_085_disintegrator",
    title: "Disintegrator",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 6,
    memoryCost: 2,
    rulesText:
      "[2]: Derez a piece of ice and end your run. Use this ability only when you have just broken all the subroutines of that piece of ice and have successfully passed it.",
    mechanics: [
      "install_program",
      "post_pass_fully_broken_ice",
      "derez_ice",
      "end_run",
      "proteus_post_pass_derez_utility",
    ],
  },
  {
    id: "onr_proteus_089_garbage-in",
    title: "Garbage In",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "After each successful run on R&D, give the Corp a Garbage counter. Two or more Garbage counters allow you to trash, at no cost, any cards accessed from R&D, even if the cards cannot normally be trashed. The Corp loses two Garbage counters after any run during which this ability is used. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
    mechanics: [
      "install_program",
      "virus",
      "successful_run_counter",
      "free_access_trash",
      "counter_spend",
      "proteus_runner_virus_access_trash",
    ],
  },
  {
    id: "onr_proteus_090_highlighter",
    title: "Highlighter",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "After each successful run on R&D, give the Corp a Highlighter counter. Each Highlighter counter after the first allows you to access an additional card from R&D whenever you access cards from R&D. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
    mechanics: [
      "install_program",
      "virus",
      "successful_run_counter",
      "access_breach_multiaccess_ambush",
      "proteus_runner_virus_run_counter",
    ],
  },
  {
    id: "onr_proteus_094_scaldan",
    title: "Scaldan",
    side: "runner",
    type: "program",
    subtypes: ["bad_publicity", "random", "virus"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "After each successful run on HQ, give the Corp a Scaldan counter. Each Scaldan counter forces the Corp to roll a die at the start of each of its turns. On a 5 or a 6, the Corp gains 1 Bad Publicity point. The Corp may remove all Virus counters at any time, but must then forgo its next three actions. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.",
    mechanics: [
      "install_program",
      "virus",
      "successful_run_counter",
      "random_die_resolution",
      "bad_publicity",
      "proteus_random_virus_longtail",
    ],
  },
  {
    id: "onr_proteus_097_taxman",
    title: "Taxman",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "After each successful run on HQ, give the Corp a Tax counter. Every two Tax counters cause the Corp to lose [1] at the start of each of its turns. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
    mechanics: [
      "install_program",
      "virus",
      "successful_run_counter",
      "start_of_turn",
      "corp_lose_credits",
      "proteus_runner_virus_run_counter",
    ],
  },
  {
    id: "onr_proteus_098_vienna-22",
    title: "Vienna 22",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "After each successful run on HQ, give the Corp a Vienna counter. Each Vienna counter allows you to access an additional card from HQ whenever you access cards from HQ. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
    mechanics: [
      "install_program",
      "virus",
      "successful_run_counter",
      "access_breach_multiaccess_ambush",
      "proteus_runner_virus_run_counter",
    ],
  },
  {
    id: "onr_proteus_099_viral-pipeline",
    title: "Viral Pipeline",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    rulesText:
      "After each successful run on Archives, HQ, or R&D, put a Socket counter in that data fort. Socket counter from Archives, Socket counter from HQ, and Socket counter from R&D: Give the Corp a Pipe counter. Each Pipe counter causes the Corp to forgo an action at the start of each of its turns. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
    mechanics: [
      "install_program",
      "virus",
      "successful_run_counter",
      "central_server_scope",
      "action_debt",
      "proteus_runner_virus_run_counter",
    ],
  },
  {
    id: "onr_proteus_108_faked-hit",
    title: "Faked Hit",
    side: "runner",
    type: "event",
    subtypes: ["bad_publicity"],
    implementationStatus: "playable_mvp",
    cost: 5,
    rulesText:
      "Give the Corp 1 Bad Publicity point. Take 2 brain damage. This damage cannot be prevented. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.",
    mechanics: [
      "play_event",
      "bad_publicity",
      "bad_publicity_loss_gate",
      "core_damage",
      "flatline",
    ],
  },
  {
    id: "onr_proteus_117_poisoned-water-supply",
    title: "Poisoned Water Supply",
    side: "runner",
    type: "event",
    subtypes: ["bad_publicity"],
    implementationStatus: "playable_mvp",
    cost: 4,
    rulesText:
      "Play only if you have at least two connections in play. Trash two connections. Give the Corp 1 Bad Publicity point. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.",
    mechanics: [
      "play_event",
      "connection_condition",
      "trash_installed_connection_cost",
      "bad_publicity",
      "bad_publicity_loss_gate",
    ],
  },
  {
    id: "onr_proteus_150_streetware-distributor",
    title: "Streetware Distributor",
    side: "runner",
    type: "resource",
    subtypes: ["bbs", "position"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText:
      "Take [1] from Streetware Distributor, if it has any bits, at the start of each of your turns. A: Put [3] from the bank on Streetware Distributor.",
    mechanics: [
      "install_resource",
      "counter",
      "recurring_pool",
      "gain_credits",
      "proteus_visible_baseline",
    ],
  },
];

const PROTEUS_CYBERNETICS_DECK_CARDS: CardDefinition[] = [
  {
    id: "onr_proteus_134_cortical-cybermodem",
    title: "Cortical Cybermodem",
    side: "runner",
    type: "hardware",
    subtypes: ["cybernetics", "deck"],
    implementationStatus: "playable_mvp",
    installCost: 11,
    rulesText:
      "Provides +2 MU and +2 hand size. Put [2] from the bank on Cortical Cybermodem when it is installed. Use these bits only to pay for using icebreakers during runs. If you use any of these bits, replace them from the bank at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.",
    mechanics: [
      "install_hardware",
      "hardware_deck",
      "memory",
      "max_hand_size",
      "restricted_hosted_credits",
      "proteus_cybernetics_deck_hardware",
    ],
  },
  {
    id: "onr_proteus_135_cortical-stimulators",
    title: "Cortical Stimulators",
    side: "runner",
    type: "hardware",
    subtypes: ["cybernetics"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    rulesText: "Prevents 1 Net or brain damage each turn.",
    mechanics: [
      "install_hardware",
      "damage_prevention",
      "damage_prevention_turn_limit",
      "proteus_cybernetics_deck_hardware",
    ],
  },
  {
    id: "onr_proteus_138_deck-the",
    title: "Deck, The",
    side: "runner",
    type: "hardware",
    subtypes: ["base_link", "deck"],
    implementationStatus: "playable_mvp",
    installCost: 11,
    rulesText:
      "[0]: Base link 5. [1]: +1 link. Provides +1 MU. Use only one base link card for each trace attempt made against you. Only one deck can be in play at a time. Trash any older decks.",
    mechanics: [
      "install_hardware",
      "hardware_deck",
      "memory",
      "base_link",
      "trace",
      "proteus_cybernetics_deck_hardware",
    ],
  },
  {
    id: "onr_proteus_151_sunburst-cranial-interface",
    title: "Sunburst Cranial Interface",
    side: "runner",
    type: "hardware",
    subtypes: ["cybernetics", "deck", "stealth"],
    implementationStatus: "playable_mvp",
    installCost: 5,
    rulesText:
      "Provides +1 MU and +1 hand size. Put [1] from the bank on Cranial Interface when it is installed. Use this bit only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use the bit, replace it from the bank at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.",
    mechanics: [
      "install_hardware",
      "hardware_deck",
      "memory",
      "max_hand_size",
      "restricted_hosted_credits",
      "subtype_noisy",
      "proteus_cybernetics_deck_hardware",
    ],
  },
];

const PROTEUS_VARIABLE_ICE_CARDS: CardDefinition[] = [
  {
    id: "onr_proteus_012_bug-zapper",
    title: "Bug Zapper",
    side: "corp",
    type: "ice",
    subtypes: ["sentry", "ap", "hellbolt"],
    implementationStatus: "playable_mvp",
    rezCost: 6,
    strength: 2,
    rulesText:
      "[Subroutine] Do 2 net damage for each rezzed piece of ice installed outside Bug Zapper.\n[Subroutine] End the run.",
    subroutines: [
      {
        id: "onr_proteus_012_bug_zapper_net_damage",
        type: "do_damage",
        damageType: "net",
        amount: 0,
      },
      { id: "onr_proteus_012_bug_zapper_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "relative_ice_count",
      "dynamic_subroutine",
    ],
  },
  {
    id: "onr_proteus_013_caryatid",
    title: "Caryatid",
    side: "corp",
    type: "ice",
    subtypes: ["wall"],
    implementationStatus: "playable_mvp",
    rezCost: 7,
    strength: 5,
    rulesText:
      "[Subroutine] End the run.\nWhen you rez Caryatid, you may pay 1 above the rez cost to make it a code gate instead of a wall.",
    subroutines: [{ id: "onr_proteus_013_caryatid_etr", type: "end_the_run" }],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_017_credit-blocks",
    title: "Credit Blocks",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 6,
    strength: 3,
    rulesText:
      "[Subroutine] End the run.\nWhen you rez Credit Blocks, you may pay 1 above the rez cost to make it a wall instead of a sentry.",
    subroutines: [
      { id: "onr_proteus_017_credit_blocks_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_020_digiconda",
    title: "Digiconda",
    side: "corp",
    type: "ice",
    subtypes: ["sentry", "ap", "sword"],
    implementationStatus: "playable_mvp",
    rezCost: 6,
    strength: 0,
    rulesText:
      "[Subroutine] Do 2 net damage.\n[Subroutine] End the run.\nPay X above the rez cost when you rez Digiconda. X is Digiconda's strength and cannot be greater than 6.",
    subroutines: [
      {
        id: "onr_proteus_020_digiconda_net_damage",
        type: "do_damage",
        damageType: "net",
        amount: 2,
      },
      { id: "onr_proteus_020_digiconda_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_021_dog-pile",
    title: "Dog Pile",
    side: "corp",
    type: "ice",
    subtypes: ["sentry", "ap"],
    implementationStatus: "playable_mvp",
    rezCost: 5,
    strength: 0,
    rulesText:
      "[Subroutine] Do 1 net damage for each rezzed piece of ice installed outside Dog Pile.\n[Subroutine] End the run.\nDog Pile has +1 strength for each rezzed piece of ice installed outside it.",
    subroutines: [
      {
        id: "onr_proteus_021_dog_pile_net_damage",
        type: "do_damage",
        damageType: "net",
        amount: 0,
      },
      { id: "onr_proteus_021_dog_pile_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "relative_ice_count",
      "dynamic_strength",
      "dynamic_subroutine",
    ],
  },
  {
    id: "onr_proteus_022_food-fight",
    title: "Food Fight",
    side: "corp",
    type: "ice",
    subtypes: ["sentry", "deckrash"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    strength: 3,
    rulesText:
      "Food Fight has one [Subroutine] End the run for every 2 credits you pay above the rez cost when you rez it.",
    subroutines: [],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_023_galatea",
    title: "Galatea",
    side: "corp",
    type: "ice",
    subtypes: ["wall"],
    implementationStatus: "playable_mvp",
    rezCost: 6,
    strength: 4,
    rulesText:
      "[Subroutine] End the run.\nWhen you rez Galatea, you may pay 1 above the rez cost to make it a code gate instead of a wall.",
    subroutines: [{ id: "onr_proteus_023_galatea_etr", type: "end_the_run" }],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_024_gatekeeper",
    title: "Gatekeeper",
    side: "corp",
    type: "ice",
    subtypes: ["code_gate"],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    strength: 4,
    rulesText:
      "Gatekeeper has one [Subroutine] End the run for every 2 credits you pay above the rez cost when you rez it.",
    subroutines: [],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_025_homing-missile",
    title: "Homing Missile",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    strength: 0,
    rulesText:
      "[Subroutine] Trace X. If successful, end the run and Runner cannot make another run until Runner takes an action to pay 2.\nPay X above the rez cost when you rez Homing Missile. X is Homing Missile's strength and trace limit, and X cannot be greater than 8.",
    subroutines: [
      {
        id: "onr_proteus_025_homing_missile_trace",
        type: "initiate_trace",
        baseTraceStrength: 0,
        traceBidLimit: 0,
        traceSuccessEffect: { type: "end_run_and_run_lock", amount: 2 },
      },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
      "trace",
      "run_lock",
    ],
  },
  {
    id: "onr_proteus_026_hunting-pack",
    title: "Hunting Pack",
    side: "corp",
    type: "ice",
    subtypes: ["sentry", "bloodhound"],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    strength: 4,
    rulesText:
      "For each rezzed piece of ice installed outside Hunting Pack, Hunting Pack has one [Subroutine] Trace 5. If successful, give Runner a tag.",
    subroutines: [],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "relative_ice_count",
      "dynamic_subroutine",
      "trace",
      "add_tag",
    ],
  },
  {
    id: "onr_proteus_028_lesser-arcana",
    title: "Lesser Arcana",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 7,
    strength: 4,
    rulesText:
      "[Subroutine] End the run.\nWhen you rez Lesser Arcana, you may pay 1 above the rez cost to make it a wall instead of a sentry.",
    subroutines: [
      { id: "onr_proteus_028_lesser_arcana_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_030_mastermind",
    title: "Mastermind",
    side: "corp",
    type: "ice",
    subtypes: ["sentry", "black_ice", "ap", "zombie"],
    implementationStatus: "playable_mvp",
    rezCost: 7,
    strength: 0,
    rulesText:
      "[Subroutine] Do 1 core damage for each rezzed piece of ice installed outside Mastermind.\n[Subroutine] End the run.\nMastermind has +1 strength for each rezzed piece of ice installed outside it.",
    subroutines: [
      {
        id: "onr_proteus_030_mastermind_core_damage",
        type: "do_damage",
        damageType: "core",
        amount: 0,
      },
      { id: "onr_proteus_030_mastermind_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "relative_ice_count",
      "dynamic_strength",
      "dynamic_subroutine",
    ],
  },
  {
    id: "onr_proteus_033_mobile-barricade",
    title: "Mobile Barricade",
    side: "corp",
    type: "ice",
    subtypes: ["wall"],
    implementationStatus: "playable_mvp",
    rezCost: 6,
    strength: 3,
    rulesText:
      "[Subroutine] Do 1 net damage.\n[Subroutine] End the run.\n[1]: Move Mobile Barricade and insert it in a different position on this data fort. Use this ability only at the start of a run on this data fort. You may use this ability even if Mobile Barricade is unrezzed, in which case, you reveal it.",
    subroutines: [
      {
        id: "onr_proteus_033_mobile_barricade_net_damage",
        type: "do_damage",
        damageType: "net",
        amount: 1,
      },
      {
        id: "onr_proteus_033_mobile_barricade_etr",
        type: "end_the_run",
      },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "ice_repositioning",
      "reveal",
      "end_the_run",
    ],
  },
  {
    id: "onr_proteus_036_sandstorm",
    title: "Sandstorm",
    side: "corp",
    type: "ice",
    subtypes: ["wall"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    strength: 4,
    rulesText:
      "Sandstorm has one [Subroutine] End the run for every 2 credits you pay above the rez cost when you rez it.",
    subroutines: [],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_039_sphinx-2006",
    title: "Sphinx 2006",
    side: "corp",
    type: "ice",
    subtypes: ["code_gate"],
    implementationStatus: "playable_mvp",
    rezCost: 6,
    strength: 5,
    rulesText:
      "[Subroutine] End the run.\nWhen you rez Sphinx 2006, you may pay 4 above the rez cost to make it a sentry instead of a code gate.",
    subroutines: [
      { id: "onr_proteus_039_sphinx_2006_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_040_sumo-2008",
    title: "Sumo 2008",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 8,
    strength: 5,
    rulesText:
      "[Subroutine] End the run.\nWhen you rez Sumo 2008, you may pay 1 above the rez cost to make it a wall instead of a sentry.",
    subroutines: [{ id: "onr_proteus_040_sumo_2008_etr", type: "end_the_run" }],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "variable_rez",
      "variable_ice_state",
    ],
  },
  {
    id: "onr_proteus_044_walking-wall",
    title: "Walking Wall",
    side: "corp",
    type: "ice",
    subtypes: ["wall"],
    implementationStatus: "playable_mvp",
    rezCost: 5,
    strength: 3,
    rulesText:
      "[Subroutine] End the run.\n[1]: Move Walking Wall and insert it in a different position on this data fort. Use this ability only at the start of a run on this data fort. You may use this ability even if Walking Wall is unrezzed, in which case, you reveal it.",
    subroutines: [
      { id: "onr_proteus_044_walking_wall_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "ice_repositioning",
      "reveal",
      "end_the_run",
    ],
  },
];

export const DEMO_CARDS: CardDefinition[] = [
  {
    id: "runner_identity_001",
    title: "Runner Identity",
    side: "runner",
    type: "identity",
    subtypes: [],
    implementationStatus: "playable_mvp",
    abilityEnabled: false,
    baseLink: 0,
    rulesText: "Testidentität ohne aktive Fähigkeit.",
    mechanics: ["identity_setup"],
  },
  {
    id: "simple_economy_event",
    title: "Simple Economy Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Erhalte 4 Credits.",
    mechanics: ["play_event", "gain_credits"],
  },
  {
    id: "simple_run_event",
    title: "Simple Run Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 2 Credits.",
    mechanics: ["play_event", "start_run", "successful_run_bonus"],
  },
  {
    id: "simple_fracter",
    title: "Simple Fracter",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "fracter"],
    implementationStatus: "playable_mvp",
    installCost: 2,
    memoryCost: 1,
    strength: 2,
    rulesText: "1 Credit: +1 Stärke. 1 Credit: Brich 1 Barrier-Subroutine.",
    abilities: [
      {
        id: "simple_fracter_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "simple_fracter_break_barrier",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "barrier",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
    ],
  },
  {
    id: "simple_decoder",
    title: "Simple Decoder",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "decoder"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    strength: 2,
    rulesText: "1 Credit: +1 Stärke. 1 Credit: Brich 1 Code-Gate-Subroutine.",
    abilities: [
      {
        id: "simple_decoder_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "simple_decoder_break_code_gate",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "code_gate",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
    ],
  },
  {
    id: "simple_killer",
    title: "Simple Killer",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "killer"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    strength: 1,
    rulesText: "1 Credit: +1 Stärke. 1 Credit: Brich 1 Sentry-Subroutine.",
    abilities: [
      {
        id: "simple_killer_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "simple_killer_break_sentry",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "sentry",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
    ],
  },
  {
    id: "corp_identity_001",
    title: "Corp Identity",
    side: "corp",
    type: "identity",
    subtypes: [],
    implementationStatus: "playable_mvp",
    abilityEnabled: false,
    rulesText: "Testidentität ohne aktive Fähigkeit.",
    mechanics: ["identity_setup"],
  },
  {
    id: "v098_runner_identity",
    title: "Identity Lab Runner",
    side: "runner",
    type: "identity",
    subtypes: [],
    implementationStatus: "playable_mvp",
    abilityEnabled: true,
    baseLink: 1,
    rulesText: "Setup: Gain 1 credit. Static: +1 memory limit.",
    modifiers: [
      {
        modifierId: "v098_runner_identity_setup_credit",
        kind: "starting_credits",
        side: "runner",
        amount: 1,
        duration: "setup",
        sourceAbilityId: "v098_runner_identity_setup",
      },
      {
        modifierId: "v098_runner_identity_memory",
        kind: "memory_limit",
        side: "runner",
        amount: 1,
        duration: "static",
        sourceAbilityId: "v098_runner_identity_static",
      },
    ],
    mechanics: [
      "identity_setup",
      "identity_ability",
      "static_modifier",
      "base_link",
      "modify_memory_limit",
      "v098_local_original",
    ],
  },
  {
    id: "v098_corp_identity",
    title: "Identity Lab Corp",
    side: "corp",
    type: "identity",
    subtypes: [],
    implementationStatus: "playable_mvp",
    abilityEnabled: true,
    rulesText: "Setup: Gain 1 credit.",
    modifiers: [
      {
        modifierId: "v098_corp_identity_setup_credit",
        kind: "starting_credits",
        side: "corp",
        amount: 1,
        duration: "setup",
        sourceAbilityId: "v098_corp_identity_setup",
      },
    ],
    mechanics: [
      "identity_setup",
      "identity_ability",
      "setup_modifier",
      "v098_local_original",
    ],
  },
  {
    id: "simple_agenda",
    title: "Simple Agenda",
    side: "corp",
    type: "agenda",
    subtypes: [],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 2,
    rulesText: "Keine zusätzliche Fähigkeit.",
    mechanics: ["install_remote", "advance", "score", "steal"],
  },
  {
    id: "simple_economy_operation",
    title: "Simple Economy Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Erhalte 4 Credits.",
    mechanics: ["play_operation", "gain_credits"],
  },
  {
    id: "v111_core_damage_operation",
    title: "Core Damage Harness",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Do 1 Core Damage.",
    mechanics: [
      "play_operation",
      "damage",
      "core_damage",
      "flatline",
      "v111_local_original",
    ],
  },
  {
    id: "simple_economy_asset",
    title: "Simple Economy Asset",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 1,
    trashCost: 3,
    rulesText: "Wenn diese Karte gerezzt wird, erhält die Corp 3 Credits.",
    mechanics: [
      "install_remote",
      "rez_asset",
      "gain_credits_on_rez",
      "trash_on_access",
    ],
  },
  {
    id: "simple_barrier_ice",
    title: "Simple Barrier ICE",
    side: "corp",
    type: "ice",
    subtypes: ["barrier"],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    strength: 3,
    rulesText: "End the run.",
    subroutines: [{ id: "simple_barrier_ice_etr", type: "end_the_run" }],
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "end_the_run"],
  },
  {
    id: "simple_code_gate_ice",
    title: "Simple Code Gate ICE",
    side: "corp",
    type: "ice",
    subtypes: ["code_gate"],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    strength: 2,
    rulesText: "Die Corp erhält 1 Credit. End the run.",
    subroutines: [
      {
        id: "simple_code_gate_ice_gain_credit",
        type: "corp_gain_credit",
        amount: 1,
      },
      { id: "simple_code_gate_ice_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "corp_gain_credit",
      "end_the_run",
    ],
  },
  {
    id: "simple_sentry_ice",
    title: "Simple Sentry ICE",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    strength: 3,
    rulesText: "Der Runner verliert 2 Credits, falls möglich. End the run.",
    subroutines: [
      {
        id: "simple_sentry_ice_credit_loss",
        type: "runner_lose_credits",
        amount: 2,
      },
      { id: "simple_sentry_ice_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "runner_lose_credits",
      "end_the_run",
    ],
  },
  {
    id: "simple_draw_event",
    title: "Simple Draw Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Ziehe 2 Karten.",
    mechanics: ["play_event", "draw_cards"],
  },
  {
    id: "simple_setup_hardware",
    title: "Simple Setup Hardware",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    rulesText: "+1 Memory Limit.",
    mechanics: ["install_hardware", "modify_memory_limit"],
  },
  {
    id: "efficient_fracter",
    title: "Efficient Fracter",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "fracter"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    strength: 3,
    rulesText: "1 Credit: +1 Stärke. 1 Credit: Brich 1 Barrier-Subroutine.",
    abilities: [
      {
        id: "efficient_fracter_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "efficient_fracter_break_barrier",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "barrier",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
    ],
  },
  {
    id: "simple_priority_agenda",
    title: "Simple Priority Agenda",
    side: "corp",
    type: "agenda",
    subtypes: [],
    implementationStatus: "playable_mvp",
    advancementRequirement: 4,
    agendaPoints: 3,
    rulesText: "Keine zusätzliche Fähigkeit.",
    mechanics: ["install_remote", "advance", "score", "steal"],
  },
  {
    id: "simple_draw_operation",
    title: "Simple Draw Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Ziehe 2 Karten.",
    mechanics: ["play_operation", "draw_cards"],
  },
  {
    id: "simple_taxing_barrier_ice",
    title: "Simple Taxing Barrier ICE",
    side: "corp",
    type: "ice",
    subtypes: ["barrier"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    strength: 4,
    rulesText: "Der Runner verliert 1 Credit. End the run.",
    subroutines: [
      {
        id: "simple_taxing_barrier_ice_tax",
        type: "runner_lose_credits",
        amount: 1,
      },
      { id: "simple_taxing_barrier_ice_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "runner_lose_credits",
      "end_the_run",
    ],
  },
  {
    id: "simple_upgrade",
    title: "Simple Upgrade",
    side: "corp",
    type: "upgrade",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 0,
    trashCost: 4,
    rulesText: "Einfache Root-Karte ohne aktive Fähigkeit.",
    mechanics: ["install_remote", "rez_upgrade", "trash_on_access"],
  },
  {
    id: "simple_tag_ice",
    title: "Simple Tag ICE",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    strength: 2,
    rulesText: "Gib dem Runner 1 Tag. End the run.",
    subroutines: [
      { id: "simple_tag_ice_tag", type: "give_runner_tag", amount: 1 },
      { id: "simple_tag_ice_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "give_runner_tag",
      "end_the_run",
    ],
  },
  {
    id: "simple_tag_punishment_operation",
    title: "Simple Tag Punishment Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Spiele nur, wenn der Runner getaggt ist. Der Runner verliert 2 Credits.",
    mechanics: ["play_operation", "runner_is_tagged", "runner_lose_credits"],
  },
  {
    id: "v094_neural_sentry_ice",
    title: "Neural Sentry ICE",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    strength: 2,
    rulesText: "Do 1 net damage. End the run.",
    subroutines: [
      {
        id: "v094_neural_sentry_ice_net_damage",
        type: "do_damage",
        amount: 1,
        damageType: "net",
      },
      { id: "v094_neural_sentry_ice_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "damage",
      "flatline",
      "end_the_run",
      "v094_local_original",
    ],
  },
  {
    id: "v095_safehouse_resource",
    title: "Safehouse Resource",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    rulesText: "Einfache offene Runner-Resource ohne aktive Fähigkeit.",
    mechanics: [
      "install_resource",
      "resource",
      "trash_resource",
      "tag_interaction",
      "v095_local_original",
    ],
  },
  {
    id: "v096_trace_probe_ice",
    title: "Trace Probe ICE",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    strength: 2,
    rulesText: "Trace 2. If successful, give the Runner 1 tag.",
    subroutines: [
      {
        id: "v096_trace_probe_ice_trace",
        type: "initiate_trace",
        baseTraceStrength: 2,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "trace",
      "link",
      "bid_amount",
      "add_tag",
      "v096_local_original",
    ],
  },
  {
    id: "v097_deep_dive_event",
    title: "Deep Dive Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Make a run. If successful, access 1 additional card during the breach.",
    mechanics: [
      "play_event",
      "start_run",
      "breach",
      "multiaccess",
      "v097_local_original",
    ],
  },
  {
    id: "v098_stack_search_event",
    title: "Stack Search Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Search your stack for a program, add it to your grip, then shuffle your stack.",
    mechanics: [
      "play_event",
      "search",
      "shuffle",
      "hidden_zone_tool",
      "v098_local_original",
    ],
  },
  {
    id: "v098_stack_arrange_event",
    title: "Stack Arrange Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Look at the top 2 cards of your stack and arrange them in any order.",
    mechanics: [
      "play_event",
      "look",
      "arrange",
      "hidden_zone_tool",
      "v098_local_original",
    ],
  },
  {
    id: "v098_reveal_top_event",
    title: "Public Reveal Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Reveal the top card of your stack.",
    mechanics: ["play_event", "reveal", "v098_local_original"],
  },
  {
    id: "v098_expose_event",
    title: "Expose Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Expose an unrezzed installed Corp card in the chosen server.",
    mechanics: ["play_event", "expose", "reveal", "v098_local_original"],
  },
  {
    id: "v098_hq_rd_swap_operation",
    title: "HQ R&D Swap Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Swap the top card of R&D with a card in HQ.",
    mechanics: [
      "play_operation",
      "swap",
      "hidden_zone_tool",
      "v098_local_original",
    ],
  },
  {
    id: "v099_host_resource",
    title: "Host Resource",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText: "When installed, host a program from your grip.",
    mechanics: [
      "install_resource",
      "resource",
      "hosting",
      "hidden_zone_choice",
      "v099_local_original",
    ],
  },
  {
    id: "v099_virus_program",
    title: "Virus Program",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    memoryCost: 1,
    rulesText: "When installed, place 1 virus counter on this program.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "virus",
      "purge",
      "v099_local_original",
    ],
  },
  {
    id: "v099_recurring_chip",
    title: "Recurring Chip",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    recurringCredits: 1,
    rulesText: "1 recurring credit. Use this credit to install a program.",
    mechanics: [
      "install_hardware",
      "counter",
      "recurring_credit",
      "v099_local_original",
    ],
  },
  {
    id: "v099_bad_publicity_operation",
    title: "Bad Publicity Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Gain 3 credits and take 1 bad publicity.",
    mechanics: [
      "play_operation",
      "gain_credits",
      "bad_publicity",
      "v099_local_original",
    ],
  },
  {
    id: "v08_burst_credit_event",
    title: "Burst Credit Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Erhalte 6 Credits.",
    mechanics: ["play_event", "gain_credits", "v08_local_original"],
  },
  {
    id: "v08_deep_draw_event",
    title: "Deep Draw Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Ziehe 3 Karten.",
    mechanics: ["play_event", "draw_cards", "v08_local_original"],
  },
  {
    id: "v08_overclock_run_event",
    title: "Overclock Run Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 3 Credits.",
    mechanics: [
      "play_event",
      "start_run",
      "successful_run_bonus",
      "v08_local_original",
    ],
  },
  {
    id: "v08_memory_chip",
    title: "Memory Chip",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    rulesText: "+1 Memory Limit.",
    mechanics: [
      "install_hardware",
      "modify_memory_limit",
      "v08_local_original",
    ],
  },
  {
    id: "v08_steady_fracter",
    title: "Steady Fracter",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "fracter"],
    implementationStatus: "playable_mvp",
    installCost: 4,
    memoryCost: 1,
    strength: 4,
    rulesText: "1 Credit: +1 Stärke. 1 Credit: Brich 1 Barrier-Subroutine.",
    abilities: [
      {
        id: "v08_steady_fracter_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "v08_steady_fracter_break_barrier",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "barrier",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
      "v08_local_original",
    ],
  },
  {
    id: "v08_precise_decoder",
    title: "Precise Decoder",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "decoder"],
    implementationStatus: "playable_mvp",
    installCost: 3,
    memoryCost: 1,
    strength: 3,
    rulesText: "1 Credit: +1 Stärke. 1 Credit: Brich 1 Code-Gate-Subroutine.",
    abilities: [
      {
        id: "v08_precise_decoder_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "v08_precise_decoder_break_code_gate",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "code_gate",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
      "v08_local_original",
    ],
  },
  {
    id: "v08_adaptive_killer",
    title: "Adaptive Killer",
    side: "runner",
    type: "program",
    subtypes: ["icebreaker", "killer"],
    implementationStatus: "playable_mvp",
    installCost: 4,
    memoryCost: 1,
    strength: 3,
    rulesText: "1 Credit: +1 Stärke. 1 Credit: Brich 1 Sentry-Subroutine.",
    abilities: [
      {
        id: "v08_adaptive_killer_pump",
        type: "pump_strength",
        cost: { credits: 1 },
        amount: 1,
        timingPoint: "run.encounter_ice",
      },
      {
        id: "v08_adaptive_killer_break_sentry",
        type: "break_subroutine",
        cost: { credits: 1 },
        iceSubtype: "sentry",
        count: 1,
        timingPoint: "run.encounter_ice",
      },
    ],
    mechanics: [
      "install_program",
      "memory",
      "pump_breaker",
      "break_subroutine",
      "v08_local_original",
    ],
  },
  {
    id: "v08_credit_surge_operation",
    title: "Credit Surge Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Erhalte 7 Credits.",
    mechanics: ["play_operation", "gain_credits", "v08_local_original"],
  },
  {
    id: "v08_archive_planning_operation",
    title: "Archive Planning Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Ziehe 3 Karten.",
    mechanics: ["play_operation", "draw_cards", "v08_local_original"],
  },
  {
    id: "v08_project_agenda",
    title: "Project Agenda",
    side: "corp",
    type: "agenda",
    subtypes: [],
    implementationStatus: "playable_mvp",
    advancementRequirement: 3,
    agendaPoints: 2,
    rulesText: "Keine zusätzliche Fähigkeit.",
    mechanics: [
      "install_remote",
      "advance",
      "score",
      "steal",
      "v08_local_original",
    ],
  },
  {
    id: "v08_cashout_asset",
    title: "Cashout Asset",
    side: "corp",
    type: "asset",
    subtypes: [],
    implementationStatus: "playable_mvp",
    rezCost: 2,
    trashCost: 4,
    rulesText: "Wenn diese Karte gerezzt wird, erhält die Corp 4 Credits.",
    mechanics: [
      "install_remote",
      "rez_asset",
      "gain_credits_on_rez",
      "trash_on_access",
      "v08_local_original",
    ],
  },
  {
    id: "v08_wall_ice",
    title: "Wall ICE",
    side: "corp",
    type: "ice",
    subtypes: ["barrier"],
    implementationStatus: "playable_mvp",
    rezCost: 5,
    strength: 5,
    rulesText: "End the run.",
    subroutines: [{ id: "v08_wall_ice_etr", type: "end_the_run" }],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "end_the_run",
      "v08_local_original",
    ],
  },
  {
    id: "v08_gate_ice",
    title: "Gate ICE",
    side: "corp",
    type: "ice",
    subtypes: ["code_gate"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    strength: 3,
    rulesText: "Die Corp erhält 2 Credits. End the run.",
    subroutines: [
      { id: "v08_gate_ice_gain_credit", type: "corp_gain_credit", amount: 2 },
      { id: "v08_gate_ice_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "corp_gain_credit",
      "end_the_run",
      "v08_local_original",
    ],
  },
  {
    id: "v08_watchdog_ice",
    title: "Watchdog ICE",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 4,
    strength: 3,
    rulesText: "Gib dem Runner 1 Tag. End the run.",
    subroutines: [
      { id: "v08_watchdog_ice_tag", type: "give_runner_tag", amount: 1 },
      { id: "v08_watchdog_ice_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "give_runner_tag",
      "end_the_run",
      "v08_local_original",
    ],
  },
  ...ONR_V1_LIMITED_PLAYABLE_CARDS,
  ...PROTEUS_VISIBLE_BASELINE_CARDS,
  ...PROTEUS_CYBERNETICS_DECK_CARDS,
  ...PROTEUS_VARIABLE_ICE_CARDS,
];

export const DEMO_CARDS_BY_ID: Record<CardDefinitionId, CardDefinition> =
  Object.fromEntries([
    ...proteusCatalogFallbackCards().map((card) => [card.id, card] as const),
    ...DEMO_CARDS.map((card) => [card.id, card] as const),
  ]);

type ProteusCatalogCard = {
  cardId: string;
  title: string;
  side: Side;
  type: CardType;
  subtypes?: string[];
  numeric?: {
    cost?: number | null;
    installCost?: number | null;
    memoryCost?: number | null;
    strength?: number | null;
    rezCost?: number | null;
    trashCost?: number | null;
    advancementRequirement?: number | null;
    agendaPoints?: number | null;
  };
  text?: string;
};

function proteusCatalogFallbackCards(): CardDefinition[] {
  return (proteusCardsData.cards as ProteusCatalogCard[]).map((card) => {
    const numeric = card.numeric ?? {};
    return {
      id: card.cardId,
      title: card.title,
      side: card.side,
      type: card.type,
      subtypes: card.subtypes ?? [],
      implementationStatus: "playable_mvp",
      ...numberField("cost", numeric.cost),
      ...numberField("installCost", numeric.installCost),
      ...numberField("memoryCost", numeric.memoryCost),
      ...numberField("strength", numeric.strength),
      ...numberField("rezCost", numeric.rezCost),
      ...numberField("trashCost", numeric.trashCost),
      ...numberField("advancementRequirement", numeric.advancementRequirement),
      ...numberField("agendaPoints", numeric.agendaPoints),
      rulesText: card.text ?? "",
      mechanics: ["proteus_catalog_fallback"],
    };
  });
}

function numberField<K extends keyof CardDefinition>(key: K, value: number | null | undefined): Partial<Pick<CardDefinition, K>> {
  return typeof value === "number" ? ({ [key]: value } as Partial<Pick<CardDefinition, K>>) : {};
}
