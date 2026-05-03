export type Side = "corp" | "runner";

export type Phase =
  | "corp_draw_phase"
  | "corp_action_phase"
  | "runner_action_phase"
  | "run"
  | "game_over";

export type TimingPointId =
  | "corp_draw.mandatory_draw"
  | "corp_action.main"
  | "runner_action.main"
  | "run.approach_ice"
  | "run.encounter_ice"
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
  | "rez_ice"
  | "decline_rez"
  | "pump_breaker"
  | "break_subroutine"
  | "continue_run"
  | "access_card"
  | "steal_agenda"
  | "trash_accessed_card"
  | "decline_trash"
  | "remove_tag"
  | "resolve_choice"
  | "trigger_ability"
  | "end_turn";

export type CardType = "identity" | "event" | "program" | "hardware" | "agenda" | "operation" | "asset" | "upgrade" | "ice";
export type CardDefinitionId = string;
export type CardInstanceId = string;
export type ServerId = "hq" | "rd" | "archives" | `remote_${number}` | "new_remote";
export type StateHash = string;
export type Winner = Side | "draw";
export type DemoDeckId = "demo_runner_001" | "demo_corp_001" | "demo_runner_004" | "demo_corp_004" | "demo_runner_008" | "demo_corp_008";

export type SubroutineType = "end_the_run" | "corp_gain_credit" | "runner_lose_credits" | "give_runner_tag";

export type SubroutineDefinition = {
  id: string;
  type: SubroutineType;
  amount?: number;
};

export type EventVisibilityClass = "public" | "private_to_side" | "hidden_info_barrier" | "replay_only";

export type CostRequirement =
  | { kind: "click"; amount: number }
  | { kind: "credit"; amount: number; source?: "credit_pool" | "future_hosted" | "future_recurring" }
  | { kind: "tag"; amount: number }
  | { kind: "counter"; counterType: string; amount: number; sourceRef: string };

export type AbilityKind = "paid" | "triggered" | "static" | "setup" | "future_interrupt" | "future_replacement";

export type AbilityRef = {
  sourceCardInstanceId: CardInstanceId;
  abilityId: string;
};

export type EffectSource =
  | { kind: "card"; cardInstanceId: CardInstanceId; abilityId?: string }
  | { kind: "core_rule"; ruleId: string }
  | { kind: "system"; systemId: string };

export type EffectCommand =
  | { type: "gain_credits"; side: Side; amount: number }
  | { type: "spend_credits"; side: Side; amount: number }
  | { type: "draw_card"; side: Side; amount?: number }
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
  strength?: number;
  rezCost?: number;
  trashCost?: number;
  advancementRequirement?: number;
  agendaPoints?: number;
  rulesText: string;
  abilities?: AbilityDefinition[];
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
  formatProfileId: string;
  deckHash: string;
};

export type RulesBaseline = {
  rulesVersion: "26.03";
  cardTextSource: "manual";
  cardTextSnapshotId: "mvp-0.1-demo" | "mvp-0.4-demo" | "mvp-0.8-demo";
  engineSchemaVersion: "0.1.0" | "0.2.0" | "0.3.0" | "0.4.0" | "0.8.0";
  cardImplementationVersion: "0.1.0" | "0.4.0" | "0.8.0";
  deviationRegistryVersion: "0.1.0" | "0.2.0" | "0.3.0" | "0.4.0" | "0.8.0";
  playerViewSchemaVersion?: "0.1.0" | "0.2.0" | "0.3.0" | "0.4.0" | "0.8.0";
  multiplayerSchemaVersion?: "0.2.0" | "0.3.0" | "0.4.0" | "0.8.0";
  aiControllerSchemaVersion?: "0.3.0" | "0.4.0" | "0.8.0";
  simulationSchemaVersion?: "0.3.0" | "0.4.0" | "0.8.0";
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
  runnerDeckId?: "demo_runner_001" | "demo_runner_004" | "demo_runner_008";
  corpDeckId?: "demo_corp_001" | "demo_corp_004" | "demo_corp_008";
  runnerDeck?: DeckDefinition;
  corpDeck?: DeckDefinition;
  runnerDeckMetadata?: DeckPublicMetadata;
  corpDeckMetadata?: DeckPublicMetadata;
  agendaPointsToWin?: number;
  controllers?: {
    runner: PlayerController;
    corp: PlayerController;
  };
};

export type ZoneRef =
  | { side: "corp"; zone: "hq" | "rd" | "archives" | "scoreArea" }
  | { side: "corp"; zone: "serverIce" | "serverRoot"; serverId: Exclude<ServerId, "new_remote"> }
  | { side: "runner"; zone: "grip" | "stack" | "heap" | "scoreArea" | "rig" };

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
  badPublicity: number;
  hq: CardInstanceId[];
  rd: CardInstanceId[];
  archives: CardInstanceId[];
  scoreArea: CardInstanceId[];
  servers: CorpServer[];
};

export type RunnerRig = {
  programs: CardInstanceId[];
  hardware: CardInstanceId[];
};

export type RunnerState = {
  identity: CardInstanceId;
  credits: number;
  clicks: number;
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
  phase: "approach_ice" | "encounter_ice" | "access";
  position: { kind: "ice"; serverId: Exclude<ServerId, "new_remote">; iceIndex: number } | { kind: "server"; serverId: Exclude<ServerId, "new_remote"> };
  approachedIceId?: CardInstanceId;
  encounteredIceId?: CardInstanceId;
  brokenSubroutineIndexes: number[];
  successful: boolean;
  accessedCardId?: CardInstanceId;
  pendingSuccessBonusCredits?: number;
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
  cardInstances: Record<CardInstanceId, CardInstance>;
  eventLog: GameEvent[];
  winner: Winner | null;
  agendaPointsToWin: number;
  pendingChoice?: PendingChoice;
  deckMetadata?: {
    runner: DeckPublicMetadata;
    corp: DeckPublicMetadata;
  };
  run?: RunState;
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
  rezCost?: number;
  rezzed?: boolean;
  advancementCounters?: number;
  advancementRequirement?: number;
  strength?: number;
  agendaPoints?: number;
  trashCost?: number;
};

export type PlayerView = {
  side: Side;
  stateVersion: number;
  timingPoint: TimingPointId;
  activeSide: Side;
  phase: Phase;
  own: {
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
    tags: number;
  };
  opponent: {
    credits: number;
    clicks: number;
    agendaPoints: number;
    tags: number;
    handCount: number;
    deckCount: number;
    discardCount: number;
    scoreArea: VisibleCard[];
  };
  servers: Array<{
    id: Exclude<ServerId, "new_remote">;
    label: string;
    ice: VisibleCard[];
    root: VisibleCard[];
  }>;
  run?: {
    attackedServerId: Exclude<ServerId, "new_remote">;
    phase: RunState["phase"];
    encounteredIce?: VisibleCard;
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
  reasonCode: string;
  explanation: string;
  consideredActionIds: string[];
  fallbackUsed: boolean;
  confidence?: number;
  evidence?: string[];
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

export const DEMO_CARDS: CardDefinition[] = [
  {
    id: "runner_identity_001",
    title: "Runner Identity",
    side: "runner",
    type: "identity",
    subtypes: [],
    implementationStatus: "playable_mvp",
    abilityEnabled: false,
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
  }
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
      { id: "simple_fracter", quantity: 1 },
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
  }
};
