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
  | "move_to_set_aside"
  | "move_to_removed_from_game"
  | "return_from_set_aside"
  | "change_card_control"
  | "resolve_choice"
  | "trigger_ability"
  | "end_turn";

export type CardType = "identity" | "event" | "program" | "hardware" | "resource" | "agenda" | "operation" | "asset" | "upgrade" | "ice";
export type CardDefinitionId = string;
export type CardInstanceId = string;
export type ServerId = "hq" | "rd" | "archives" | `remote_${number}` | "new_remote";
export type StateHash = string;
export type Winner = Side | "draw";
export type GameEndReason = "agenda_points" | "corp_deck_empty" | "flatline" | "unknown";
export type DemoDeckId =
  | "demo_runner_001"
  | "demo_corp_001"
  | "demo_runner_004"
  | "demo_corp_004"
  | "demo_runner_008"
  | "demo_corp_008"
  | "demo_runner_096"
  | "demo_corp_096"
  | "demo_runner_097"
  | "demo_corp_097"
  | "demo_runner_098"
  | "demo_corp_098"
  | "demo_runner_099"
  | "demo_corp_099";

export type DamageType = "net" | "meat" | "core";
export type CounterType = "advancement" | "virus" | "power" | "agenda" | "recurring_credit" | "bad_publicity" | "charge" | "mark" | "dividend" | "core_damage";

export type TraceSuccessEffect = { type: "add_tag"; amount: number };

export type SubroutineType = "end_the_run" | "corp_gain_credit" | "runner_lose_credits" | "give_runner_tag" | "do_damage" | "initiate_trace";

export type SubroutineDefinition = {
  id: string;
  type: SubroutineType;
  amount?: number;
  damageType?: DamageType;
  baseTraceStrength?: number;
  traceSuccessEffect?: TraceSuccessEffect;
};

export type EventVisibilityClass = "public" | "private_to_side" | "hidden_info_barrier" | "replay_only";
export type SpecialZoneKind = "set_aside" | "removed_from_game";
export type SpecialZoneVisibility = "public" | "side_private" | "hidden" | "replay_only";

export type CostRequirement =
  | { kind: "click"; amount: number }
  | { kind: "credit"; amount: number; source?: "credit_pool" | "future_hosted" | "future_recurring" }
  | { kind: "tag"; amount: number }
  | { kind: "counter"; counterType: string; amount: number; sourceRef: string };

export type AbilityKind = "paid" | "triggered" | "static" | "setup" | "future_interrupt" | "future_replacement";

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

export type ImminentEventType = "damage" | "add_tag" | "test_interrupt";
export type EventModificationKind = "prevent" | "avoid" | "interrupt";

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
  replacementEventType: ImminentEventType;
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
  | { type: "do_damage"; damageType: DamageType; amount: number; source?: string }
  | { type: "add_tag"; amount: number }
  | { type: "remove_tag"; amount: number }
  | { type: "change_breaker_strength"; breakerId: CardInstanceId; amount: number }
  | { type: "break_subroutine"; subroutineIndex: number }
  | { type: "set_pending_choice"; choice: ChoiceRequest }
  | { type: "complete_pending_choice"; choiceId: string }
  | { type: "emit_event"; eventType: string; visibilityClass: EventVisibilityClass; publicPayload?: Record<string, unknown>; privatePayload?: Partial<Record<Side, Record<string, unknown>>> };

export type ChoiceKind = "select_option" | "select_cards" | "bid_amount" | "confirm";

export type ChoiceOption = {
  id: string;
  label: string;
  publicLabel?: string;
  value?: string | number | boolean;
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
};

export type PendingChoice = ChoiceRequest;

export type VisibleChoiceRequest = Omit<ChoiceRequest, "side"> & {
  side: Side;
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
  type: "pump_strength" | "break_subroutine";
  cost: { credits: number };
  amount?: number;
  iceSubtype?: string;
  count?: number;
  timingPoint: TimingPointId;
  kind?: AbilityKind;
  allowedTimingPoints?: TimingPointId[];
  effectRef?: string;
  publicActionType?: ActionType;
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

export type RulesBaseline = {
  rulesVersion: "26.03";
  cardTextSource: "manual";
  cardTextSnapshotId:
    | "mvp-0.1-demo"
    | "mvp-0.4-demo"
    | "mvp-0.8-demo"
    | "mvp-0.94-demo"
    | "mvp-0.95-demo"
    | "mvp-0.96-demo"
    | "mvp-0.97-demo"
    | "mvp-0.98-demo"
    | "mvp-0.99-demo";
  engineSchemaVersion: "0.1.0" | "0.2.0" | "0.3.0" | "0.4.0" | "0.8.0" | "0.94.0" | "0.95.0" | "0.96.0" | "0.97.0" | "0.98.0" | "0.99.0";
  cardImplementationVersion: "0.1.0" | "0.4.0" | "0.8.0" | "0.94.0" | "0.95.0" | "0.96.0" | "0.97.0" | "0.98.0" | "0.99.0";
  deviationRegistryVersion: "0.1.0" | "0.2.0" | "0.3.0" | "0.4.0" | "0.8.0" | "0.94.0" | "0.95.0" | "0.96.0" | "0.97.0" | "0.98.0" | "0.99.0";
  playerViewSchemaVersion?: "0.1.0" | "0.2.0" | "0.3.0" | "0.4.0" | "0.8.0" | "0.94.0" | "0.95.0" | "0.96.0" | "0.97.0" | "0.98.0" | "0.99.0";
  multiplayerSchemaVersion?: "0.2.0" | "0.3.0" | "0.4.0" | "0.8.0" | "0.94.0" | "0.95.0" | "0.96.0" | "0.97.0" | "0.98.0" | "0.99.0";
  aiControllerSchemaVersion?: "0.3.0" | "0.4.0" | "0.8.0" | "0.94.0" | "0.95.0" | "0.96.0" | "0.97.0" | "0.98.0" | "0.99.0";
  simulationSchemaVersion?: "0.3.0" | "0.4.0" | "0.8.0" | "0.94.0" | "0.95.0" | "0.96.0" | "0.97.0" | "0.98.0" | "0.99.0";
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
  runnerDeckId?: "demo_runner_001" | "demo_runner_004" | "demo_runner_008" | "demo_runner_096" | "demo_runner_097" | "demo_runner_098" | "demo_runner_099";
  corpDeckId?: "demo_corp_001" | "demo_corp_004" | "demo_corp_008" | "demo_corp_096" | "demo_corp_097" | "demo_corp_098" | "demo_corp_099";
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
  | { side: "corp"; zone: "serverIce" | "serverRoot"; serverId: Exclude<ServerId, "new_remote"> }
  | { side: "runner"; zone: "grip" | "stack" | "heap" | "scoreArea" | "rig" };

export type ZoneRef =
  | NormalZoneRef
  | { side: "special"; zone: SpecialZoneKind; visibility: SpecialZoneVisibility; visibilitySide?: Side; returnZone?: NormalZoneRef };

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
  hostedOn?: CardInstanceId;
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

export type RunState = {
  runId: string;
  attackedServerId: Exclude<ServerId, "new_remote">;
  phase: "approach_ice" | "encounter_ice" | "movement" | "access";
  position: { kind: "ice"; serverId: Exclude<ServerId, "new_remote">; iceIndex: number } | { kind: "server"; serverId: Exclude<ServerId, "new_remote"> };
  approachedIceId?: CardInstanceId;
  encounteredIceId?: CardInstanceId;
  brokenSubroutineIndexes: number[];
  resolvedSubroutineIndexes: number[];
  successful: boolean;
  accessedCardId?: CardInstanceId;
  pendingSuccessBonusCredits?: number;
  accessCount?: number;
  badPublicityCredits?: number;
  breach?: BreachState;
};

export type AccessQueueEntry = {
  entryId: string;
  cardInstanceId: CardInstanceId;
  serverId: Exclude<ServerId, "new_remote">;
  zone: "rd" | "hq" | "archives" | "remote_root";
  status: "pending" | "accessed" | "stolen" | "trashed" | "declined" | "skipped";
  hiddenInfo: boolean;
};

export type BreachState = {
  breachId: string;
  serverId: Exclude<ServerId, "new_remote">;
  accessMode: "single" | "multi";
  queue: AccessQueueEntry[];
  currentIndex: number;
  completed: boolean;
  accessedSummaries: Array<{ entryId: string; status: AccessQueueEntry["status"]; cardDefinitionId?: CardDefinitionId }>;
};

export type TraceState = {
  traceId: string;
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  subroutineIndex?: number;
  baseTraceStrength: number;
  status: "corp_bid" | "runner_bid";
  successEffect: TraceSuccessEffect;
  corpBid?: number;
  traceStrength?: number;
  runnerLink?: number;
  runnerBid?: number;
  runnerStrength?: number;
  successful?: boolean;
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
  eventModificationWindow?: EventModificationWindow;
  replacementWindow?: ReplacementWindow;
  eventModificationHarness?: EventModificationTestHarness;
  specialZoneHarness?: SpecialZoneTestHarness;
  deckMetadata?: {
    runner: DeckPublicMetadata;
    corp: DeckPublicMetadata;
  };
  run?: RunState;
  trace?: TraceState;
  identityAbilityUsage?: Partial<Record<Side, { setupAbilities: string[]; turn: number; usedThisTurn: string[] }>>;
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
  rezCost?: number;
  baseLink?: number;
  rezzed?: boolean;
  advancementCounters?: number;
  advancementRequirement?: number;
  strength?: number;
  agendaPoints?: number;
  trashCost?: number;
  counters?: Partial<Record<CounterType, number>>;
  hostedOn?: CardInstanceId;
  owner?: Side;
  controller?: Side;
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
    scoreArea: VisibleCard[];
    rig?: VisibleCard[];
  };
  servers: Array<{
    id: Exclude<ServerId, "new_remote">;
    label: string;
    ice: VisibleCard[];
    root: VisibleCard[];
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

export type AiDecision = {
  actionId: string;
  selectedChoices?: PlayerAction["selectedChoices"];
  reasonCode: string;
  explanation: string;
  consideredActionIds: string[];
  fallbackUsed: boolean;
  confidence?: number;
  evidence?: string[];
  decisionDebug?: Record<string, unknown>;
  timeoutUsed?: boolean;
  profileId?: string;
  difficulty?: AiDifficulty;
  reason?: string;
};

export const MVP_0_1_BASELINE: RulesBaseline = {
  rulesVersion: "26.03",
  cardTextSource: "manual",
  cardTextSnapshotId: "mvp-0.1-demo",
  engineSchemaVersion: "0.1.0",
  cardImplementationVersion: "0.1.0",
  deviationRegistryVersion: "0.1.0"
};

export const MVP_0_2_BASELINE: RulesBaseline = {
  ...MVP_0_1_BASELINE,
  engineSchemaVersion: "0.2.0",
  deviationRegistryVersion: "0.2.0",
  playerViewSchemaVersion: "0.2.0",
  multiplayerSchemaVersion: "0.2.0"
};

export const MVP_0_3_BASELINE: RulesBaseline = {
  ...MVP_0_2_BASELINE,
  engineSchemaVersion: "0.3.0",
  deviationRegistryVersion: "0.3.0",
  playerViewSchemaVersion: "0.3.0",
  multiplayerSchemaVersion: "0.3.0",
  aiControllerSchemaVersion: "0.3.0",
  simulationSchemaVersion: "0.3.0"
};

export const MVP_0_4_BASELINE: RulesBaseline = {
  ...MVP_0_3_BASELINE,
  cardTextSnapshotId: "mvp-0.4-demo",
  engineSchemaVersion: "0.4.0",
  cardImplementationVersion: "0.4.0",
  deviationRegistryVersion: "0.4.0",
  playerViewSchemaVersion: "0.4.0",
  multiplayerSchemaVersion: "0.4.0",
  aiControllerSchemaVersion: "0.4.0",
  simulationSchemaVersion: "0.4.0"
};

export const MVP_0_8_BASELINE: RulesBaseline = {
  ...MVP_0_4_BASELINE,
  cardTextSnapshotId: "mvp-0.8-demo",
  engineSchemaVersion: "0.8.0",
  cardImplementationVersion: "0.8.0",
  deviationRegistryVersion: "0.8.0",
  playerViewSchemaVersion: "0.8.0",
  multiplayerSchemaVersion: "0.8.0",
  aiControllerSchemaVersion: "0.8.0",
  simulationSchemaVersion: "0.8.0"
};

export const MVP_0_94_BASELINE: RulesBaseline = {
  ...MVP_0_8_BASELINE,
  cardTextSnapshotId: "mvp-0.94-demo",
  engineSchemaVersion: "0.94.0",
  cardImplementationVersion: "0.94.0",
  deviationRegistryVersion: "0.94.0",
  playerViewSchemaVersion: "0.94.0",
  multiplayerSchemaVersion: "0.94.0",
  aiControllerSchemaVersion: "0.94.0",
  simulationSchemaVersion: "0.94.0"
};

export const MVP_0_95_BASELINE: RulesBaseline = {
  ...MVP_0_94_BASELINE,
  cardTextSnapshotId: "mvp-0.95-demo",
  engineSchemaVersion: "0.95.0",
  cardImplementationVersion: "0.95.0",
  deviationRegistryVersion: "0.95.0",
  playerViewSchemaVersion: "0.95.0",
  multiplayerSchemaVersion: "0.95.0",
  aiControllerSchemaVersion: "0.95.0",
  simulationSchemaVersion: "0.95.0"
};

export const MVP_0_96_BASELINE: RulesBaseline = {
  ...MVP_0_95_BASELINE,
  cardTextSnapshotId: "mvp-0.96-demo",
  engineSchemaVersion: "0.96.0",
  cardImplementationVersion: "0.96.0",
  deviationRegistryVersion: "0.96.0",
  playerViewSchemaVersion: "0.96.0",
  multiplayerSchemaVersion: "0.96.0",
  aiControllerSchemaVersion: "0.96.0",
  simulationSchemaVersion: "0.96.0"
};

export const MVP_0_97_BASELINE: RulesBaseline = {
  ...MVP_0_96_BASELINE,
  cardTextSnapshotId: "mvp-0.97-demo",
  engineSchemaVersion: "0.97.0",
  cardImplementationVersion: "0.97.0",
  deviationRegistryVersion: "0.97.0",
  playerViewSchemaVersion: "0.97.0",
  multiplayerSchemaVersion: "0.97.0",
  aiControllerSchemaVersion: "0.97.0",
  simulationSchemaVersion: "0.97.0"
};

export const MVP_0_98_BASELINE: RulesBaseline = {
  ...MVP_0_97_BASELINE,
  cardTextSnapshotId: "mvp-0.98-demo",
  engineSchemaVersion: "0.98.0",
  cardImplementationVersion: "0.98.0",
  deviationRegistryVersion: "0.98.0",
  playerViewSchemaVersion: "0.98.0",
  multiplayerSchemaVersion: "0.98.0",
  aiControllerSchemaVersion: "0.98.0",
  simulationSchemaVersion: "0.98.0"
};

export const MVP_0_99_BASELINE: RulesBaseline = {
  ...MVP_0_98_BASELINE,
  cardTextSnapshotId: "mvp-0.99-demo",
  engineSchemaVersion: "0.99.0",
  cardImplementationVersion: "0.99.0",
  deviationRegistryVersion: "0.99.0",
  playerViewSchemaVersion: "0.99.0",
  multiplayerSchemaVersion: "0.99.0",
  aiControllerSchemaVersion: "0.99.0",
  simulationSchemaVersion: "0.99.0"
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
}): CardDefinition {
  const pumpText = params.pumpCost === undefined ? "" : ` ${params.pumpCost} Credits: +1 strength.`;
  const mechanics = ["install_program", "memory", ...(params.pumpCost === undefined ? [] : ["pump_breaker"]), "break_subroutine", ONR_V1_LOCAL_PRIVATE];
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
    rulesText: `${params.breakCost} Credits: Break 1 ${params.iceLabel} subroutine.${pumpText}`,
    abilities: [
      ...(params.pumpCost === undefined
        ? []
        : [{ id: `${params.id}_pump`, type: "pump_strength" as const, cost: { credits: params.pumpCost }, amount: 1, timingPoint: "run.encounter_ice" as const }]),
      { id: `${params.id}_break`, type: "break_subroutine", cost: { credits: params.breakCost }, iceSubtype: params.iceSubtype, count: 1, timingPoint: "run.encounter_ice" }
    ],
    mechanics
  };
}

function onrUniversalBreaker(params: { id: string; title: string; subtypes: string[]; installCost: number; memoryCost: number; strength: number; breakCost: number; pumpCost: number }): CardDefinition {
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
    rulesText: `${params.breakCost} Credits: Break 1 ice subroutine. ${params.pumpCost} Credits: +1 strength.`,
    abilities: [
      { id: `${params.id}_pump`, type: "pump_strength", cost: { credits: params.pumpCost }, amount: 1, timingPoint: "run.encounter_ice" },
      { id: `${params.id}_break`, type: "break_subroutine", cost: { credits: params.breakCost }, count: 1, timingPoint: "run.encounter_ice" }
    ],
    mechanics: ["install_program", "memory", "pump_breaker", "break_subroutine", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["install_ice", "rez_ice", "encounter_ice", ...(params.mechanics ?? []), ONR_V1_LOCAL_PRIVATE]
  };
}

function onrEtr(id: string): SubroutineDefinition {
  return { id, type: "end_the_run" };
}

function onrNetDamage(id: string, amount: number): SubroutineDefinition {
  return { id, type: "do_damage", damageType: "net", amount };
}

function onrMemoryChip(params: { id: string; title: string; installCost: number; memoryLimitBonus: number }): CardDefinition {
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
    mechanics: ["install_hardware", "modify_memory_limit", ONR_V1_LOCAL_PRIVATE]
  };
}

const ONR_V1_LIMITED_PLAYABLE_CARDS: CardDefinition[] = [
  onrBreaker({
    id: "onr_v1_015_codeslinger",
    title: "Codeslinger",
    subtypes: ["icebreaker", "killer"],
    installCost: 7,
    memoryCost: 1,
    strength: 3,
    breakCost: 0,
    iceSubtype: "sentry",
    iceLabel: "sentry"
  }),
  onrBreaker({
    id: "onr_v1_052_raffles",
    title: "Raffles",
    subtypes: ["icebreaker"],
    installCost: 7,
    memoryCost: 1,
    strength: 4,
    breakCost: 0,
    pumpCost: 2,
    iceSubtype: "code_gate",
    iceLabel: "code gate"
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
    iceLabel: "sentry"
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
    iceLabel: "code gate"
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
    mechanics: ["play_event", "draw_cards", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_event", "draw_cards", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_event", "gain_credits", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_event", "gain_credits", ONR_V1_LOCAL_PRIVATE]
  },
  onrBreaker({
    id: "onr_v1_006_black-dahlia",
    title: "Black Dahlia",
    subtypes: ["icebreaker", "killer"],
    installCost: 5,
    memoryCost: 1,
    strength: 10,
    breakCost: 2,
    pumpCost: 2,
    iceSubtype: "sentry",
    iceLabel: "sentry"
  }),
  onrBreaker({
    id: "onr_v1_014_codecracker",
    title: "Codecracker",
    subtypes: ["icebreaker"],
    installCost: 0,
    memoryCost: 1,
    strength: 2,
    breakCost: 0,
    pumpCost: 1,
    iceSubtype: "code_gate",
    iceLabel: "code gate"
  }),
  onrBreaker({
    id: "onr_v1_016_cyfermaster",
    title: "Cyfermaster™",
    subtypes: ["icebreaker"],
    installCost: 5,
    memoryCost: 1,
    strength: 2,
    breakCost: 2,
    pumpCost: 1,
    iceSubtype: "code_gate",
    iceLabel: "code gate"
  }),
  onrBreaker({
    id: "onr_v1_021_dwarf",
    title: "Dwarf",
    subtypes: ["icebreaker"],
    installCost: 3,
    memoryCost: 1,
    strength: 1,
    breakCost: 1,
    pumpCost: 1,
    iceSubtype: "wall",
    iceLabel: "wall"
  }),
  onrUniversalBreaker({
    id: "onr_v1_039_krash",
    title: "Krash",
    subtypes: ["icebreaker"],
    installCost: 3,
    memoryCost: 1,
    strength: 2,
    breakCost: 2,
    pumpCost: 2
  }),
  onrBreaker({
    id: "onr_v1_040_loony-goon",
    title: "Loony Goon",
    subtypes: ["icebreaker", "killer"],
    installCost: 0,
    memoryCost: 1,
    strength: 4,
    breakCost: 1,
    pumpCost: 1,
    iceSubtype: "sentry",
    iceLabel: "sentry"
  }),
  onrBreaker({
    id: "onr_v1_060_shaka",
    title: "Shaka",
    subtypes: ["icebreaker", "killer"],
    installCost: 2,
    memoryCost: 1,
    strength: 4,
    breakCost: 1,
    pumpCost: 2,
    iceSubtype: "sentry",
    iceLabel: "sentry"
  }),
  onrBreaker({
    id: "onr_v1_066_snowball",
    title: "Snowball",
    subtypes: ["icebreaker", "killer"],
    installCost: 3,
    memoryCost: 1,
    strength: 1,
    breakCost: 1,
    pumpCost: 1,
    iceSubtype: "sentry",
    iceLabel: "sentry"
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
    iceLabel: "sentry"
  }),
  onrBreaker({
    id: "onr_v1_074_worm",
    title: "Worm",
    subtypes: ["icebreaker"],
    installCost: 2,
    memoryCost: 1,
    strength: 1,
    breakCost: 0,
    pumpCost: 3,
    iceSubtype: "wall",
    iceLabel: "wall"
  }),
  {
    id: "onr_v1_081_custodial-position",
    title: "Custodial Position",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Make a run on R&D. If successful, access two additional cards from R&D.",
    mechanics: ["play_event", "start_run", "breach", "multiaccess", ONR_V1_LOCAL_PRIVATE]
  },
  {
    id: "onr_v1_085_executive-wiretaps",
    title: "Executive Wiretaps",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Make a run on HQ. If successful, access two additional cards from HQ.",
    mechanics: ["play_event", "start_run", "breach", "multiaccess", ONR_V1_LOCAL_PRIVATE]
  },
  {
    id: "onr_v1_101_mit-west-tier",
    title: "MIT West Tier",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Shuffle your grip, heap and stack together, draw five cards, then remove MIT West Tier from the game.",
    mechanics: ["play_event", "shuffle", "draw_cards", "removed_from_game", ONR_V1_LOCAL_PRIVATE]
  },
  onrBreaker({
    id: "onr_v1_073_wizards-book",
    title: "Wizard's Book",
    subtypes: ["icebreaker"],
    installCost: 2,
    memoryCost: 1,
    strength: 5,
    breakCost: 0,
    pumpCost: 2,
    iceSubtype: "code_gate",
    iceLabel: "code gate"
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
    mechanics: ["install_hardware", "modify_memory_limit", ONR_V1_LOCAL_PRIVATE]
  },
  onrMemoryChip({
    id: "onr_v1_144_tycho-mem-chip",
    title: "Tycho Mem Chip",
    installCost: 5,
    memoryLimitBonus: 3
  }),
  onrMemoryChip({
    id: "onr_v1_146_zetatech-mem-chip",
    title: "Zetatech Mem Chip",
    installCost: 3,
    memoryLimitBonus: 2
  }),
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
    mechanics: ["install_remote", "advance", "score", "steal", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["install_remote", "advance", "score", "steal", "on_score_gain_credits", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "gain_credits", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "draw_cards", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "runner_is_tagged", "runner_lose_credits", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "runner_is_tagged", "give_runner_tag", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "draw_cards", "gain_credits", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "gain_credits", ONR_V1_LOCAL_PRIVATE]
  },
  {
    id: "onr_v1_293_netwatch-credit-voucher",
    title: "Netwatch Credit Voucher",
    side: "corp",
    type: "operation",
    subtypes: ["gray_ops"],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Play only if Runner is tagged. Give Runner 1 tag and gain 1 credit.",
    mechanics: ["play_operation", "runner_is_tagged", "give_runner_tag", "gain_credits", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "gain_credits", "draw_cards", ONR_V1_LOCAL_PRIVATE]
  },
  {
    id: "onr_v1_297_overtime-incentives",
    title: "Overtime Incentives",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Gain two actions.",
    mechanics: ["play_operation", "gain_actions", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "runner_is_tagged", "damage", "flatline", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "runner_is_tagged", "damage", "flatline", ONR_V1_LOCAL_PRIVATE]
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
    mechanics: ["play_operation", "runner_is_tagged", "damage", "flatline", ONR_V1_LOCAL_PRIVATE]
  },
  onrIce({
    id: "onr_v1_230_cortical-scanner",
    title: "Cortical Scanner",
    subtypes: ["code_gate"],
    rezCost: 7,
    strength: 3,
    rulesText: "End the run.\nEnd the run.\nEnd the run.",
    subroutines: [onrEtr("onr_v1_230_cortical_scanner_etr_1"), onrEtr("onr_v1_230_cortical_scanner_etr_2"), onrEtr("onr_v1_230_cortical_scanner_etr_3")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_232_crystal-wall",
    title: "Crystal Wall",
    subtypes: ["wall"],
    rezCost: 4,
    strength: 3,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_232_crystal_wall_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_237_data-wall",
    title: "Data Wall",
    subtypes: ["wall"],
    rezCost: 1,
    strength: 0,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_237_data_wall_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_238_data-wall-2-0",
    title: "Data Wall 2.0",
    subtypes: ["wall"],
    rezCost: 2,
    strength: 1,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_238_data_wall_2_0_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_239_endless-corridor",
    title: "Endless Corridor",
    subtypes: ["code_gate"],
    rezCost: 4,
    strength: 2,
    rulesText: "End the run.\nEnd the run.",
    subroutines: [onrEtr("onr_v1_239_endless_corridor_etr_1"), onrEtr("onr_v1_239_endless_corridor_etr_2")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_244_filter",
    title: "Filter",
    subtypes: ["code_gate"],
    rezCost: 0,
    strength: 0,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_244_filter_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_245_fire-wall",
    title: "Fire Wall",
    subtypes: ["wall"],
    rezCost: 5,
    strength: 4,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_245_fire_wall_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_252_keeper",
    title: "Keeper",
    subtypes: ["code_gate"],
    rezCost: 4,
    strength: 4,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_252_keeper_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_253_laser-wire",
    title: "Laser Wire",
    subtypes: ["wall"],
    rezCost: 4,
    strength: 2,
    rulesText: "Do 1 net damage. End the run.",
    subroutines: [onrNetDamage("onr_v1_253_laser_wire_net_damage", 1), onrEtr("onr_v1_253_laser_wire_etr")],
    mechanics: ["damage", "flatline", "end_the_run"]
  }),
  onrIce({
    id: "onr_v1_256_mazer",
    title: "Mazer",
    subtypes: ["code_gate"],
    rezCost: 5,
    strength: 5,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_256_mazer_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_257_nerve-labyrinth",
    title: "Nerve Labyrinth",
    subtypes: ["code_gate"],
    rezCost: 6,
    strength: 4,
    rulesText: "Do 2 net damage. End the run.",
    subroutines: [onrNetDamage("onr_v1_257_nerve_labyrinth_net_damage", 2), onrEtr("onr_v1_257_nerve_labyrinth_etr")],
    mechanics: ["damage", "flatline", "end_the_run"]
  }),
  onrIce({
    id: "onr_v1_259_in-the-face",
    title: "π in the 'Face",
    subtypes: ["sentry", "deckrash"],
    rezCost: 5,
    strength: 3,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_259_in_the_face_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_261_quandary",
    title: "Quandary",
    subtypes: ["code_gate"],
    rezCost: 2,
    strength: 2,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_261_quandary_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_262_razor-wire",
    title: "Razor Wire",
    subtypes: ["wall"],
    rezCost: 6,
    strength: 3,
    rulesText: "Do 2 net damage. End the run.",
    subroutines: [onrNetDamage("onr_v1_262_razor_wire_net_damage", 2), onrEtr("onr_v1_262_razor_wire_etr")],
    mechanics: ["damage", "flatline", "end_the_run"]
  }),
  onrIce({
    id: "onr_v1_263_reinforced-wall",
    title: "Reinforced Wall",
    subtypes: ["wall"],
    rezCost: 8,
    strength: 4,
    rulesText: "End the run. End the run.",
    subroutines: [onrEtr("onr_v1_263_reinforced_wall_etr_1"), onrEtr("onr_v1_263_reinforced_wall_etr_2")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_265_rock-is-strong",
    title: "Rock Is Strong",
    subtypes: ["wall"],
    rezCost: 6,
    strength: 5,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_265_rock_is_strong_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_266_scramble",
    title: "Scramble",
    subtypes: ["code_gate"],
    rezCost: 3,
    strength: 3,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_266_scramble_etr")],
    mechanics: ["end_the_run"]
  }),
  onrIce({
    id: "onr_v1_269_shotgun-wire",
    title: "Shotgun Wire",
    subtypes: ["wall"],
    rezCost: 8,
    strength: 5,
    rulesText: "Do 2 net damage. End the run.",
    subroutines: [onrNetDamage("onr_v1_269_shotgun_wire_net_damage", 2), onrEtr("onr_v1_269_shotgun_wire_etr")],
    mechanics: ["damage", "flatline", "end_the_run"]
  }),
  onrIce({
    id: "onr_v1_270_sleeper",
    title: "Sleeper",
    subtypes: ["code_gate"],
    rezCost: 1,
    strength: 1,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_270_sleeper_etr")],
    mechanics: ["end_the_run"]
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
      onrEtr("onr_v1_278_wall_of_ice_etr_2")
    ],
    mechanics: ["damage", "flatline", "end_the_run"]
  }),
  onrIce({
    id: "onr_v1_279_wall-of-static",
    title: "Wall of Static",
    subtypes: ["wall"],
    rezCost: 3,
    strength: 2,
    rulesText: "End the run.",
    subroutines: [onrEtr("onr_v1_279_wall_of_static_etr")],
    mechanics: ["end_the_run"]
  })
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
    mechanics: ["identity_setup"]
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
    mechanics: ["play_event", "gain_credits"]
  },
  {
    id: "simple_run_event",
    title: "Simple Run Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 2 Credits.",
    mechanics: ["play_event", "start_run", "successful_run_bonus"]
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
      { id: "simple_fracter_pump", type: "pump_strength", cost: { credits: 1 }, amount: 1, timingPoint: "run.encounter_ice" },
      { id: "simple_fracter_break_barrier", type: "break_subroutine", cost: { credits: 1 }, iceSubtype: "barrier", count: 1, timingPoint: "run.encounter_ice" }
    ],
    mechanics: ["install_program", "memory", "pump_breaker", "break_subroutine"]
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
      { id: "simple_decoder_pump", type: "pump_strength", cost: { credits: 1 }, amount: 1, timingPoint: "run.encounter_ice" },
      { id: "simple_decoder_break_code_gate", type: "break_subroutine", cost: { credits: 1 }, iceSubtype: "code_gate", count: 1, timingPoint: "run.encounter_ice" }
    ],
    mechanics: ["install_program", "memory", "pump_breaker", "break_subroutine"]
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
      { id: "simple_killer_pump", type: "pump_strength", cost: { credits: 1 }, amount: 1, timingPoint: "run.encounter_ice" },
      { id: "simple_killer_break_sentry", type: "break_subroutine", cost: { credits: 1 }, iceSubtype: "sentry", count: 1, timingPoint: "run.encounter_ice" }
    ],
    mechanics: ["install_program", "memory", "pump_breaker", "break_subroutine"]
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
    mechanics: ["identity_setup"]
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
      { modifierId: "v098_runner_identity_setup_credit", kind: "starting_credits", side: "runner", amount: 1, duration: "setup", sourceAbilityId: "v098_runner_identity_setup" },
      { modifierId: "v098_runner_identity_memory", kind: "memory_limit", side: "runner", amount: 1, duration: "static", sourceAbilityId: "v098_runner_identity_static" }
    ],
    mechanics: ["identity_setup", "identity_ability", "static_modifier", "base_link", "modify_memory_limit", "v098_local_original"]
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
    modifiers: [{ modifierId: "v098_corp_identity_setup_credit", kind: "starting_credits", side: "corp", amount: 1, duration: "setup", sourceAbilityId: "v098_corp_identity_setup" }],
    mechanics: ["identity_setup", "identity_ability", "setup_modifier", "v098_local_original"]
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
    mechanics: ["install_remote", "advance", "score", "steal"]
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
    mechanics: ["play_operation", "gain_credits"]
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
    mechanics: ["play_operation", "damage", "core_damage", "flatline", "v111_local_original"]
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
    mechanics: ["install_remote", "rez_asset", "gain_credits_on_rez", "trash_on_access"]
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
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "end_the_run"]
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
      { id: "simple_code_gate_ice_gain_credit", type: "corp_gain_credit", amount: 1 },
      { id: "simple_code_gate_ice_etr", type: "end_the_run" }
    ],
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "corp_gain_credit", "end_the_run"]
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
      { id: "simple_sentry_ice_credit_loss", type: "runner_lose_credits", amount: 2 },
      { id: "simple_sentry_ice_etr", type: "end_the_run" }
    ],
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "runner_lose_credits", "end_the_run"]
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
    mechanics: ["play_event", "draw_cards"]
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
    mechanics: ["install_hardware", "modify_memory_limit"]
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
      { id: "efficient_fracter_pump", type: "pump_strength", cost: { credits: 1 }, amount: 1, timingPoint: "run.encounter_ice" },
      { id: "efficient_fracter_break_barrier", type: "break_subroutine", cost: { credits: 1 }, iceSubtype: "barrier", count: 1, timingPoint: "run.encounter_ice" }
    ],
    mechanics: ["install_program", "memory", "pump_breaker", "break_subroutine"]
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
    mechanics: ["install_remote", "advance", "score", "steal"]
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
    mechanics: ["play_operation", "draw_cards"]
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
      { id: "simple_taxing_barrier_ice_tax", type: "runner_lose_credits", amount: 1 },
      { id: "simple_taxing_barrier_ice_etr", type: "end_the_run" }
    ],
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "runner_lose_credits", "end_the_run"]
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
    mechanics: ["install_remote", "rez_upgrade", "trash_on_access"]
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
      { id: "simple_tag_ice_etr", type: "end_the_run" }
    ],
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "give_runner_tag", "end_the_run"]
  },
  {
    id: "simple_tag_punishment_operation",
    title: "Simple Tag Punishment Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Spiele nur, wenn der Runner getaggt ist. Der Runner verliert 2 Credits.",
    mechanics: ["play_operation", "runner_is_tagged", "runner_lose_credits"]
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
      { id: "v094_neural_sentry_ice_net_damage", type: "do_damage", amount: 1, damageType: "net" },
      { id: "v094_neural_sentry_ice_etr", type: "end_the_run" }
    ],
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "damage", "flatline", "end_the_run", "v094_local_original"]
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
    mechanics: ["install_resource", "resource", "trash_resource", "tag_interaction", "v095_local_original"]
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
        traceSuccessEffect: { type: "add_tag", amount: 1 }
      }
    ],
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "trace", "link", "bid_amount", "add_tag", "v096_local_original"]
  },
  {
    id: "v097_deep_dive_event",
    title: "Deep Dive Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Make a run. If successful, access 1 additional card during the breach.",
    mechanics: ["play_event", "start_run", "breach", "multiaccess", "v097_local_original"]
  },
  {
    id: "v098_stack_search_event",
    title: "Stack Search Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Search your stack for a program, add it to your grip, then shuffle your stack.",
    mechanics: ["play_event", "search", "shuffle", "hidden_zone_tool", "v098_local_original"]
  },
  {
    id: "v098_stack_arrange_event",
    title: "Stack Arrange Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Look at the top 2 cards of your stack and arrange them in any order.",
    mechanics: ["play_event", "look", "arrange", "hidden_zone_tool", "v098_local_original"]
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
    mechanics: ["play_event", "reveal", "v098_local_original"]
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
    mechanics: ["play_event", "expose", "reveal", "v098_local_original"]
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
    mechanics: ["play_operation", "swap", "hidden_zone_tool", "v098_local_original"]
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
    mechanics: ["install_resource", "resource", "hosting", "hidden_zone_choice", "v099_local_original"]
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
    mechanics: ["install_program", "memory", "counter", "virus", "purge", "v099_local_original"]
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
    mechanics: ["install_hardware", "counter", "recurring_credit", "v099_local_original"]
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
    mechanics: ["play_operation", "gain_credits", "bad_publicity", "v099_local_original"]
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
    mechanics: ["play_event", "gain_credits", "v08_local_original"]
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
    mechanics: ["play_event", "draw_cards", "v08_local_original"]
  },
  {
    id: "v08_overclock_run_event",
    title: "Overclock Run Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText: "Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 3 Credits.",
    mechanics: ["play_event", "start_run", "successful_run_bonus", "v08_local_original"]
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
    mechanics: ["install_hardware", "modify_memory_limit", "v08_local_original"]
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
      { id: "v08_steady_fracter_pump", type: "pump_strength", cost: { credits: 1 }, amount: 1, timingPoint: "run.encounter_ice" },
      { id: "v08_steady_fracter_break_barrier", type: "break_subroutine", cost: { credits: 1 }, iceSubtype: "barrier", count: 1, timingPoint: "run.encounter_ice" }
    ],
    mechanics: ["install_program", "memory", "pump_breaker", "break_subroutine", "v08_local_original"]
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
      { id: "v08_precise_decoder_pump", type: "pump_strength", cost: { credits: 1 }, amount: 1, timingPoint: "run.encounter_ice" },
      { id: "v08_precise_decoder_break_code_gate", type: "break_subroutine", cost: { credits: 1 }, iceSubtype: "code_gate", count: 1, timingPoint: "run.encounter_ice" }
    ],
    mechanics: ["install_program", "memory", "pump_breaker", "break_subroutine", "v08_local_original"]
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
      { id: "v08_adaptive_killer_pump", type: "pump_strength", cost: { credits: 1 }, amount: 1, timingPoint: "run.encounter_ice" },
      { id: "v08_adaptive_killer_break_sentry", type: "break_subroutine", cost: { credits: 1 }, iceSubtype: "sentry", count: 1, timingPoint: "run.encounter_ice" }
    ],
    mechanics: ["install_program", "memory", "pump_breaker", "break_subroutine", "v08_local_original"]
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
    mechanics: ["play_operation", "gain_credits", "v08_local_original"]
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
    mechanics: ["play_operation", "draw_cards", "v08_local_original"]
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
    mechanics: ["install_remote", "advance", "score", "steal", "v08_local_original"]
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
    mechanics: ["install_remote", "rez_asset", "gain_credits_on_rez", "trash_on_access", "v08_local_original"]
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
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "end_the_run", "v08_local_original"]
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
      { id: "v08_gate_ice_etr", type: "end_the_run" }
    ],
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "corp_gain_credit", "end_the_run", "v08_local_original"]
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
      { id: "v08_watchdog_ice_etr", type: "end_the_run" }
    ],
    mechanics: ["install_ice", "rez_ice", "encounter_ice", "give_runner_tag", "end_the_run", "v08_local_original"]
  },
  ...ONR_V1_LIMITED_PLAYABLE_CARDS
];

export const DEMO_CARDS_BY_ID: Record<CardDefinitionId, CardDefinition> = Object.fromEntries(
  DEMO_CARDS.map((card) => [card.id, card])
);

export const DEMO_DECKS: Record<DemoDeckId, DeckDefinition> = {
  demo_runner_001: {
    id: "demo_runner_001",
    name: "Runner Demo Deck 01 - Run & Steal",
    side: "runner",
    identity: "runner_identity_001",
    cards: [
      { id: "simple_economy_event", quantity: 3 },
      { id: "simple_run_event", quantity: 3 },
      { id: "simple_fracter", quantity: 2 },
      { id: "simple_decoder", quantity: 2 },
      { id: "simple_killer", quantity: 2 }
    ]
  },
  demo_corp_001: {
    id: "demo_corp_001",
    name: "Corp Demo Deck 01 - Build & Score",
    side: "corp",
    identity: "corp_identity_001",
    cards: [
      { id: "simple_agenda", quantity: 3 },
      { id: "simple_economy_operation", quantity: 3 },
      { id: "simple_economy_asset", quantity: 3 },
      { id: "simple_barrier_ice", quantity: 3 },
      { id: "simple_code_gate_ice", quantity: 3 },
      { id: "simple_sentry_ice", quantity: 3 }
    ]
  },
  demo_runner_004: {
    id: "demo_runner_004",
    name: "Runner Demo Deck 04 - Setup & Pressure",
    side: "runner",
    identity: "runner_identity_001",
    cards: [
      { id: "simple_economy_event", quantity: 3 },
      { id: "simple_run_event", quantity: 3 },
      { id: "simple_draw_event", quantity: 3 },
      { id: "simple_setup_hardware", quantity: 2 },
      { id: "simple_fracter", quantity: 2 },
      { id: "efficient_fracter", quantity: 2 },
      { id: "simple_decoder", quantity: 2 },
      { id: "simple_killer", quantity: 2 }
    ]
  },
  demo_corp_004: {
    id: "demo_corp_004",
    name: "Corp Demo Deck 04 - Build, Tax & Tag",
    side: "corp",
    identity: "corp_identity_001",
    cards: [
      { id: "simple_agenda", quantity: 2 },
      { id: "simple_priority_agenda", quantity: 1 },
      { id: "simple_economy_operation", quantity: 3 },
      { id: "simple_draw_operation", quantity: 2 },
      { id: "simple_economy_asset", quantity: 2 },
      { id: "simple_upgrade", quantity: 2 },
      { id: "simple_barrier_ice", quantity: 2 },
      { id: "simple_taxing_barrier_ice", quantity: 2 },
      { id: "simple_code_gate_ice", quantity: 2 },
      { id: "simple_sentry_ice", quantity: 2 },
      { id: "simple_tag_ice", quantity: 2 },
      { id: "simple_tag_punishment_operation", quantity: 2 }
    ]
  },
  demo_runner_008: {
    id: "demo_runner_008",
    name: "Runner Demo Deck 08 - Starter Pressure",
    side: "runner",
    identity: "runner_identity_001",
    cards: [
      { id: "simple_economy_event", quantity: 3 },
      { id: "simple_run_event", quantity: 2 },
      { id: "simple_draw_event", quantity: 2 },
      { id: "simple_setup_hardware", quantity: 1 },
      { id: "simple_fracter", quantity: 2 },
      { id: "efficient_fracter", quantity: 2 },
      { id: "simple_decoder", quantity: 1 },
      { id: "simple_killer", quantity: 1 },
      { id: "v08_burst_credit_event", quantity: 3 },
      { id: "v08_deep_draw_event", quantity: 3 },
      { id: "v08_overclock_run_event", quantity: 2 },
      { id: "v08_memory_chip", quantity: 2 },
      { id: "v08_steady_fracter", quantity: 2 },
      { id: "v08_precise_decoder", quantity: 1 },
      { id: "v08_adaptive_killer", quantity: 1 }
    ]
  },
  demo_corp_008: {
    id: "demo_corp_008",
    name: "Corp Demo Deck 08 - Starter Score Grid",
    side: "corp",
    identity: "corp_identity_001",
    cards: [
      { id: "simple_agenda", quantity: 1 },
      { id: "simple_priority_agenda", quantity: 1 },
      { id: "v08_project_agenda", quantity: 1 },
      { id: "simple_economy_operation", quantity: 2 },
      { id: "simple_draw_operation", quantity: 1 },
      { id: "simple_economy_asset", quantity: 1 },
      { id: "simple_upgrade", quantity: 1 },
      { id: "simple_barrier_ice", quantity: 1 },
      { id: "simple_code_gate_ice", quantity: 1 },
      { id: "simple_sentry_ice", quantity: 1 },
      { id: "simple_tag_ice", quantity: 1 },
      { id: "simple_taxing_barrier_ice", quantity: 1 },
      { id: "v08_credit_surge_operation", quantity: 3 },
      { id: "v08_archive_planning_operation", quantity: 2 },
      { id: "v08_cashout_asset", quantity: 2 },
      { id: "v08_wall_ice", quantity: 2 },
      { id: "v08_gate_ice", quantity: 2 },
      { id: "v08_watchdog_ice", quantity: 2 }
    ]
  },
  demo_runner_096: {
    id: "demo_runner_096",
    name: "Runner Demo Deck 0.96 - Trace Bidding Harness",
    side: "runner",
    identity: "runner_identity_001",
    cards: [
      { id: "simple_economy_event", quantity: 3 },
      { id: "simple_run_event", quantity: 2 },
      { id: "simple_draw_event", quantity: 2 },
      { id: "simple_fracter", quantity: 1 },
      { id: "simple_decoder", quantity: 1 },
      { id: "simple_killer", quantity: 2 },
      { id: "v08_burst_credit_event", quantity: 2 },
      { id: "v095_safehouse_resource", quantity: 1 }
    ]
  },
  demo_corp_096: {
    id: "demo_corp_096",
    name: "Corp Demo Deck 0.96 - Trace Probe Harness",
    side: "corp",
    identity: "corp_identity_001",
    cards: [
      { id: "simple_agenda", quantity: 1 },
      { id: "simple_priority_agenda", quantity: 1 },
      { id: "v08_project_agenda", quantity: 1 },
      { id: "simple_economy_operation", quantity: 2 },
      { id: "simple_economy_asset", quantity: 1 },
      { id: "simple_barrier_ice", quantity: 1 },
      { id: "simple_tag_ice", quantity: 1 },
      { id: "v096_trace_probe_ice", quantity: 3 },
      { id: "v08_credit_surge_operation", quantity: 2 }
    ]
  },
  demo_runner_097: {
    id: "demo_runner_097",
    name: "Runner Demo Deck 0.97 - Breach Multiaccess Harness",
    side: "runner",
    identity: "runner_identity_001",
    cards: [
      { id: "simple_economy_event", quantity: 3 },
      { id: "simple_run_event", quantity: 2 },
      { id: "simple_draw_event", quantity: 2 },
      { id: "simple_fracter", quantity: 1 },
      { id: "simple_decoder", quantity: 1 },
      { id: "simple_killer", quantity: 2 },
      { id: "v08_burst_credit_event", quantity: 2 },
      { id: "v095_safehouse_resource", quantity: 1 },
      { id: "v097_deep_dive_event", quantity: 2 }
    ]
  },
  demo_corp_097: {
    id: "demo_corp_097",
    name: "Corp Demo Deck 0.97 - Breach Queue Harness",
    side: "corp",
    identity: "corp_identity_001",
    cards: [
      { id: "simple_agenda", quantity: 1 },
      { id: "simple_priority_agenda", quantity: 1 },
      { id: "v08_project_agenda", quantity: 1 },
      { id: "simple_economy_operation", quantity: 2 },
      { id: "simple_economy_asset", quantity: 1 },
      { id: "simple_upgrade", quantity: 1 },
      { id: "simple_barrier_ice", quantity: 1 },
      { id: "simple_tag_ice", quantity: 1 },
      { id: "v096_trace_probe_ice", quantity: 1 },
      { id: "v08_credit_surge_operation", quantity: 2 }
    ]
  },
  demo_runner_098: {
    id: "demo_runner_098",
    name: "Runner Demo Deck 0.98 - Identity Modifier Harness",
    side: "runner",
    identity: "v098_runner_identity",
    cards: [
      { id: "simple_economy_event", quantity: 3 },
      { id: "simple_run_event", quantity: 2 },
      { id: "simple_draw_event", quantity: 2 },
      { id: "simple_fracter", quantity: 2 },
      { id: "simple_decoder", quantity: 1 },
      { id: "simple_killer", quantity: 2 },
      { id: "v08_burst_credit_event", quantity: 2 },
      { id: "v095_safehouse_resource", quantity: 1 },
      { id: "v097_deep_dive_event", quantity: 2 },
      { id: "v098_stack_search_event", quantity: 1 },
      { id: "v098_stack_arrange_event", quantity: 1 },
      { id: "v098_reveal_top_event", quantity: 1 },
      { id: "v098_expose_event", quantity: 1 }
    ]
  },
  demo_corp_098: {
    id: "demo_corp_098",
    name: "Corp Demo Deck 0.98 - Identity Modifier Harness",
    side: "corp",
    identity: "v098_corp_identity",
    cards: [
      { id: "simple_agenda", quantity: 1 },
      { id: "simple_priority_agenda", quantity: 1 },
      { id: "v08_project_agenda", quantity: 1 },
      { id: "simple_economy_operation", quantity: 2 },
      { id: "simple_economy_asset", quantity: 1 },
      { id: "simple_upgrade", quantity: 1 },
      { id: "simple_barrier_ice", quantity: 1 },
      { id: "simple_tag_ice", quantity: 1 },
      { id: "v096_trace_probe_ice", quantity: 1 },
      { id: "v08_credit_surge_operation", quantity: 2 },
      { id: "v098_hq_rd_swap_operation", quantity: 1 }
    ]
  },
  demo_runner_099: {
    id: "demo_runner_099",
    name: "Runner Demo Deck 0.99 - Hosting Counter Harness",
    side: "runner",
    identity: "v098_runner_identity",
    cards: [
      { id: "simple_economy_event", quantity: 2 },
      { id: "simple_run_event", quantity: 2 },
      { id: "simple_fracter", quantity: 2 },
      { id: "simple_decoder", quantity: 2 },
      { id: "simple_killer", quantity: 1 },
      { id: "v08_burst_credit_event", quantity: 2 },
      { id: "v095_safehouse_resource", quantity: 1 },
      { id: "v097_deep_dive_event", quantity: 1 },
      { id: "v099_host_resource", quantity: 2 },
      { id: "v099_virus_program", quantity: 2 },
      { id: "v099_recurring_chip", quantity: 2 }
    ]
  },
  demo_corp_099: {
    id: "demo_corp_099",
    name: "Corp Demo Deck 0.99 - Purge Bad Publicity Harness",
    side: "corp",
    identity: "v098_corp_identity",
    cards: [
      { id: "simple_agenda", quantity: 1 },
      { id: "simple_priority_agenda", quantity: 1 },
      { id: "v08_project_agenda", quantity: 1 },
      { id: "simple_economy_operation", quantity: 1 },
      { id: "simple_economy_asset", quantity: 1 },
      { id: "simple_upgrade", quantity: 1 },
      { id: "simple_barrier_ice", quantity: 2 },
      { id: "simple_tag_ice", quantity: 1 },
      { id: "v096_trace_probe_ice", quantity: 1 },
      { id: "v08_credit_surge_operation", quantity: 1 },
      { id: "v099_bad_publicity_operation", quantity: 2 }
    ]
  }
};
