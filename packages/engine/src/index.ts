import {
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  MVP_0_1_BASELINE,
  MVP_0_4_BASELINE,
  MVP_0_8_BASELINE,
  MVP_0_94_BASELINE,
  MVP_0_95_BASELINE,
  MVP_0_96_BASELINE,
  MVP_0_97_BASELINE,
  MVP_0_98_BASELINE,
  MVP_0_99_BASELINE,
  type ActionType,
  type ChoiceRequest,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type CounterType,
  type CorpServer,
  type CreateGameConfig,
  type DeckDefinition,
  type DeckPublicMetadata,
  type DemoDeckId,
  type DamageType,
  type EngineError,
  type EngineResult,
  type EventVisibilityClass,
  type EffectCommand,
  type EventModificationCandidate,
  type EventModificationWindow,
  type GameEvent,
  type GameEndReason,
  type GameState,
  type ImminentEvent,
  type LegalAction,
  type PlayerAction,
  type PlayerController,
  type PlayerView,
  type PublicGameEvent,
  type ReplacementCandidate,
  type ReplacementWindow,
  type ReplayResult,
  type RunState,
  type RulesBaseline,
  type SpecialZoneKind,
  type SpecialZoneState,
  type SpecialZoneVisibility,
  type ModifierKind,
  type ServerId,
  type SetupState,
  type Side,
  type StateHash,
  type ValidationResult,
  type VisibleCard,
  type Winner
} from "@netgrid/shared";

export {
  DEMO_CARDS,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  MVP_0_1_BASELINE,
  MVP_0_2_BASELINE,
  MVP_0_3_BASELINE,
  MVP_0_4_BASELINE,
  MVP_0_8_BASELINE,
  MVP_0_94_BASELINE,
  MVP_0_95_BASELINE,
  MVP_0_96_BASELINE,
  MVP_0_97_BASELINE,
  MVP_0_98_BASELINE,
  MVP_0_99_BASELINE
} from "@netgrid/shared";

export type {
  ActionType,
  CardDefinition,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CounterType,
  CorpServer,
  CreateGameConfig,
  DeckDefinition,
  DeckPublicMetadata,
  DemoDeckId,
  DamageType,
  EngineError,
  EngineResult,
  EventVisibilityClass,
  EventModificationCandidate,
  EventModificationWindow,
  EffectCommand,
  GameEvent,
  GameEndReason,
  GameState,
  ImminentEvent,
  LegalAction,
  PlayerAction,
  PlayerView,
  PublicGameEvent,
  ReplacementCandidate,
  ReplacementWindow,
  ReplayResult,
  RulesBaseline,
  SpecialZoneKind,
  SpecialZoneState,
  SpecialZoneVisibility,
  SetupState,
  Side,
  StateHash,
  ValidationResult,
  VisibleCard,
  Winner
} from "@netgrid/shared";

const DEFAULT_CONTROLLERS: { runner: PlayerController; corp: PlayerController } = {
  runner: { controllerId: "runner-local", side: "runner", type: "human_local", displayName: "Runner" },
  corp: { controllerId: "corp-ai", side: "corp", type: "ai", displayName: "Korp KI" }
};

type CardPoolVersion = "0.1.0" | "0.4.0" | "0.8.0" | "0.94.0" | "0.95.0" | "0.96.0" | "0.97.0" | "0.98.0" | "0.99.0";

type RunnerEventResolver = {
  name: string;
  requiresServer?: boolean;
  canPlay?: (state: GameState) => boolean;
  canPlayForServer?: (state: GameState, serverId: Exclude<ServerId, "new_remote">) => boolean;
  resolve: (state: GameState, legalAction: LegalAction) => void;
};

type CorpOperationResolver = {
  name: string;
  canPlay?: (state: GameState) => boolean;
  resolve: (state: GameState, legalAction: LegalAction) => void;
};

type CorpRootRezResolver = {
  name: string;
  resolve: (state: GameState) => void;
};

type DamageSummary = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

type RuntimeDamagePreventionProfile = {
  maxPerTurn: number;
  damageTypes: DamageType[];
  priority: number;
};

type ActiveRun = NonNullable<GameState["run"]>;
type ActiveBreach = NonNullable<ActiveRun["breach"]>;
type BreachEntryStatus = ActiveBreach["queue"][number]["status"];

const STANDARD_AGENDA_POINTS_TO_WIN = 7;
const INITIAL_HAND_SIZE = 5;
const BASE_MAX_HAND_SIZE = 5;

const RUNTIME_DAMAGE_PREVENTION_PROFILES: Record<string, RuntimeDamagePreventionProfile> = {
  "onr_v1_023_evil-twin": { maxPerTurn: 2, damageTypes: ["net", "core"], priority: 90 },
  "onr_v1_028_force-shield": { maxPerTurn: 2, damageTypes: ["net", "core"], priority: 100 },
  "onr_v1_125_dermatech-bodyplating": { maxPerTurn: 1, damageTypes: ["meat"], priority: 110 }
};

const RUNNER_EVENT_RESOLVERS: Record<string, RunnerEventResolver> = {
  simple_economy_event: {
    name: "runner_event_gain_credits_4",
    resolve: (state) => {
      state.runner.credits += 4;
    }
  },
  simple_draw_event: {
    name: "runner_event_draw_2",
    resolve: (state) => {
      drawRunnerCard(state);
      drawRunnerCard(state);
    }
  },
  simple_run_event: {
    name: "runner_event_run_success_2",
    requiresServer: true,
    resolve: (state, legalAction) => {
      startRun(state, String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">, 2);
    }
  },
  v08_burst_credit_event: {
    name: "runner_event_gain_credits_6",
    resolve: (state) => {
      state.runner.credits += 6;
    }
  },
  v08_deep_draw_event: {
    name: "runner_event_draw_3",
    resolve: (state) => {
      drawRunnerCard(state);
      drawRunnerCard(state);
      drawRunnerCard(state);
    }
  },
  v08_overclock_run_event: {
    name: "runner_event_run_success_3",
    requiresServer: true,
    resolve: (state, legalAction) => {
      startRun(state, String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">, 3);
    }
  },
  v097_deep_dive_event: {
    name: "runner_event_run_multiaccess_2",
    requiresServer: true,
    resolve: (state, legalAction) => {
      startRun(state, String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">, undefined, 2);
    }
  },
  v098_stack_search_event: {
    name: "runner_event_search_stack_program",
    canPlay: (state) => state.runner.stack.some((id) => definitionFor(state, id).type === "program"),
    resolve: (state, legalAction) => {
      startRunnerStackSearchChoice(state);
      legalAction.payload = { ...(legalAction.payload ?? {}), hiddenZoneBarrier: true, hiddenZoneAction: "search_stack" };
    }
  },
  v098_stack_arrange_event: {
    name: "runner_event_arrange_stack_top_2",
    canPlay: (state) => state.runner.stack.length >= 2,
    resolve: (state, legalAction) => {
      startRunnerStackArrangeChoice(state);
      legalAction.payload = { ...(legalAction.payload ?? {}), hiddenZoneBarrier: true, hiddenZoneAction: "arrange_stack" };
    }
  },
  v098_reveal_top_event: {
    name: "runner_event_reveal_stack_top",
    canPlay: (state) => state.runner.stack.length > 0,
    resolve: (state, legalAction) => {
      revealRunnerStackTop(state, legalAction);
    }
  },
  v098_expose_event: {
    name: "runner_event_expose_unrezzed_server_card",
    requiresServer: true,
    canPlayForServer: (state, serverId) => exposedCorpCardInServer(state, serverId) !== undefined,
    resolve: (state, legalAction) => {
      exposeCorpCardInServer(state, String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">, legalAction);
    }
  },
  "onr_v1_079_bodyweight-synthetic-blood": {
    name: "onr_runner_event_draw_5",
    resolve: (state) => {
      drawRunnerCards(state, 5);
    }
  },
  "onr_v1_095_jack-n-joe": {
    name: "onr_runner_event_draw_3",
    resolve: (state) => {
      drawRunnerCards(state, 3);
    }
  },
  "onr_v1_097_livewires-contacts": {
    name: "onr_runner_event_gain_credits_3",
    resolve: (state) => {
      state.runner.credits += 3;
    }
  },
  onr_v1_108_score: {
    name: "onr_runner_event_gain_credits_9",
    resolve: (state) => {
      state.runner.credits += 9;
    }
  },
  "onr_v1_081_custodial-position": {
    name: "onr_runner_event_run_rd_multiaccess_3",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "rd",
    resolve: (state, legalAction) => {
      startRun(state, "rd", undefined, 3);
      legalAction.payload = { ...(legalAction.payload ?? {}), serverId: "rd", accessCount: 3 };
    }
  },
  "onr_v1_085_executive-wiretaps": {
    name: "onr_runner_event_run_hq_multiaccess_3",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "hq",
    resolve: (state, legalAction) => {
      startRun(state, "hq", undefined, 3);
      legalAction.payload = { ...(legalAction.payload ?? {}), serverId: "hq", accessCount: 3 };
    }
  },
  "onr_v1_101_mit-west-tier": {
    name: "onr_runner_event_mit_west_tier",
    resolve: (state, legalAction) => {
      resolveMitWestTier(state, legalAction);
    }
  }
};

const CORP_OPERATION_RESOLVERS: Record<string, CorpOperationResolver> = {
  simple_economy_operation: {
    name: "corp_operation_gain_credits_4",
    resolve: (state) => {
      state.corp.credits += 4;
    }
  },
  v111_core_damage_operation: {
    name: "corp_operation_core_damage_1",
    resolve: (state, legalAction) => {
      resolveDamageOperation(state, legalAction, "core", 1, "v111_core_damage_operation");
    }
  },
  simple_draw_operation: {
    name: "corp_operation_draw_2",
    resolve: (state) => {
      drawCorpCard(state);
      drawCorpCard(state);
    }
  },
  simple_tag_punishment_operation: {
    name: "corp_operation_tag_punishment_lose_2",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state) => {
      if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
      state.runner.credits = Math.max(0, state.runner.credits - 2);
    }
  },
  v08_credit_surge_operation: {
    name: "corp_operation_gain_credits_7",
    resolve: (state) => {
      state.corp.credits += 7;
    }
  },
  v08_archive_planning_operation: {
    name: "corp_operation_draw_3",
    resolve: (state) => {
      drawCorpCard(state);
      drawCorpCard(state);
      drawCorpCard(state);
    }
  },
  v098_hq_rd_swap_operation: {
    name: "corp_operation_swap_hq_rd",
    canPlay: (state) => state.corp.hq.length > 1 && state.corp.rd.length > 0,
    resolve: (state) => {
      swapCorpHqAndRdTop(state);
    }
  },
  v099_bad_publicity_operation: {
    name: "corp_operation_bad_publicity_credit",
    resolve: (state) => {
      state.corp.credits += 3;
      state.corp.badPublicity += 1;
    }
  },
  "onr_v1_281_accounts-receivable": {
    name: "onr_corp_operation_gain_credits_9",
    resolve: (state) => {
      state.corp.credits += 9;
    }
  },
  "onr_v1_282_annual-reviews": {
    name: "onr_corp_operation_draw_3",
    resolve: (state) => {
      drawCorpCards(state, 3);
    }
  },
  "onr_v1_285_closed-accounts": {
    name: "onr_corp_operation_closed_accounts",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state) => {
      requireRunnerTagged(state);
      state.runner.credits = 0;
    }
  },
  "onr_v1_287_datapool-by-zetatech": {
    name: "onr_corp_operation_give_two_tags",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state) => {
      requireRunnerTagged(state);
      state.runner.tags += 2;
    }
  },
  "onr_v1_288_day-shift": {
    name: "onr_corp_operation_draw_2_gain_1",
    resolve: (state) => {
      drawCorpCards(state, 2);
      state.corp.credits += 1;
    }
  },
  "onr_v1_290_efficiency-experts": {
    name: "onr_corp_operation_gain_credits_3",
    resolve: (state) => {
      state.corp.credits += 3;
    }
  },
  "onr_v1_293_netwatch-credit-voucher": {
    name: "onr_corp_operation_tag_runner_gain_1",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state) => {
      requireRunnerTagged(state);
      state.runner.tags += 1;
      state.corp.credits += 1;
    }
  },
  "onr_v1_295_night-shift": {
    name: "onr_corp_operation_gain_2_draw_1",
    resolve: (state) => {
      state.corp.credits += 2;
      drawCorpCard(state);
    }
  },
  "onr_v1_301_punitive-counterstrike": {
    name: "onr_corp_operation_meat_damage_2",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      resolveDamageOperation(state, legalAction, "meat", 2, "onr_v1_301_punitive-counterstrike");
    }
  },
  "onr_v1_302_scorched-earth": {
    name: "onr_corp_operation_meat_damage_4",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      resolveDamageOperation(state, legalAction, "meat", 4, "onr_v1_302_scorched-earth");
    }
  },
  "onr_v1_306_trojan-horse": {
    name: "onr_corp_operation_trojan_horse_tag",
    canPlay: (state) => runnerStoleAgendaLastTurn(state),
    resolve: (state) => {
      if (!runnerStoleAgendaLastTurn(state)) throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      state.runner.tags += 1;
    }
  },
  "onr_v1_307_urban-renewal": {
    name: "onr_corp_operation_meat_damage_5",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      resolveDamageOperation(state, legalAction, "meat", 5, "onr_v1_307_urban-renewal");
    }
  },
  "onr_v1_297_overtime-incentives": {
    name: "onr_corp_operation_gain_two_actions",
    resolve: (state, legalAction) => {
      state.corp.clicks += 2;
      legalAction.payload = { ...(legalAction.payload ?? {}), gainedActions: 2, corpClicksAfter: state.corp.clicks };
    }
  }
};

const CORP_ROOT_REZ_RESOLVERS: Record<string, CorpRootRezResolver> = {
  simple_economy_asset: {
    name: "corp_asset_rez_gain_3",
    resolve: (state) => {
      state.corp.credits += 3;
    }
  },
  v08_cashout_asset: {
    name: "corp_asset_rez_gain_4",
    resolve: (state) => {
      state.corp.credits += 4;
    }
  }
};

export function createGame(config: CreateGameConfig = {}): GameState {
  const seed = config.seed ?? "mvp-0.1-default-seed";
  const random = { counter: 0, records: [] as GameState["randomDrawRecords"] };
  const instances: Record<CardInstanceId, CardInstance> = {};
  const runnerDeckId = config.runnerDeckId ?? "demo_runner_001";
  const corpDeckId = config.corpDeckId ?? "demo_corp_001";
  const runnerDeckDefinition = config.runnerDeck ?? DEMO_DECKS[runnerDeckId];
  const corpDeckDefinition = config.corpDeck ?? DEMO_DECKS[corpDeckId];
  const cardPoolVersion = cardPoolVersionForDecks(runnerDeckDefinition, corpDeckDefinition);
  const runnerDeckMetadata = config.runnerDeckMetadata ?? metadataForDeck(runnerDeckDefinition, cardPoolVersion);
  const corpDeckMetadata = config.corpDeckMetadata ?? metadataForDeck(corpDeckDefinition, cardPoolVersion);

  const runnerIdentity = createInstance("runner", runnerDeckDefinition.identity, 0, {
    side: "runner",
    zone: "rig"
  });
  const corpIdentity = createInstance("corp", corpDeckDefinition.identity, 0, {
    side: "corp",
    zone: "scoreArea"
  });
  instances[runnerIdentity.instanceId] = runnerIdentity;
  instances[corpIdentity.instanceId] = corpIdentity;

  const runnerDeck = expandDeck("runner", runnerDeckDefinition.cards, instances);
  const corpDeck = expandDeck("corp", corpDeckDefinition.cards, instances);

  const runnerStack = shuffleIds(runnerDeck, seed, "setup.shuffle.runner.start_stack", random);
  const corpRd = shuffleIds(corpDeck, seed, "setup.shuffle.corp.start_rnd", random);
  const runnerGrip = runnerStack.splice(0, INITIAL_HAND_SIZE);
  const corpHq = corpRd.splice(0, INITIAL_HAND_SIZE);
  recordRandomMarkers(seed, "setup.draw.runner.initial_hand", runnerGrip.length, random);
  recordRandomMarkers(seed, "setup.draw.corp.initial_hand", corpHq.length, random);

  for (const id of runnerGrip) instances[id] = { ...mustInstance(instances, id), zone: { side: "runner", zone: "grip" } };
  for (const id of runnerStack) instances[id] = { ...mustInstance(instances, id), zone: { side: "runner", zone: "stack" } };
  for (const id of corpHq) instances[id] = { ...mustInstance(instances, id), zone: { side: "corp", zone: "hq" } };
  for (const id of corpRd) instances[id] = { ...mustInstance(instances, id), zone: { side: "corp", zone: "rd" } };

  const state: GameState = {
    matchId: config.matchId ?? "local-demo-match",
    baseline: config.baseline ?? baselineForCardPoolVersion(cardPoolVersion),
    stateVersion: 0,
    seed,
    randomCounter: random.counter,
    randomDrawRecords: random.records,
    activeSide: config.setupMode === "completed" ? "corp" : "runner",
    phase: config.setupMode === "completed" ? "corp_draw_phase" : "setup",
    timingPoint: config.setupMode === "completed" ? "corp_draw.mandatory_draw" : "setup.mulligan.runner",
    corp: {
      identity: corpIdentity.instanceId,
      credits: 5,
      clicks: 3,
      maxHandSize: BASE_MAX_HAND_SIZE,
      badPublicity: 0,
      hq: corpHq,
      rd: corpRd,
      archives: [],
      scoreArea: [],
      servers: [
        { id: "hq", kind: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", kind: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", kind: "archives", label: "Archives", ice: [], root: [] }
      ]
    },
    runner: {
      identity: runnerIdentity.instanceId,
      credits: 5,
      clicks: 0,
      maxHandSize: BASE_MAX_HAND_SIZE,
      coreDamage: 0,
      tags: 0,
      memoryUsed: 0,
      memoryLimit: 4,
      grip: runnerGrip,
      stack: runnerStack,
      heap: [],
      scoreArea: [],
      rig: { programs: [], hardware: [], resources: [] }
    },
    specialZones: { setAside: [], removedFromGame: [] },
    cardInstances: instances,
    eventLog: [],
    winner: null,
    agendaPointsToWin: config.agendaPointsToWin ?? STANDARD_AGENDA_POINTS_TO_WIN,
    setup:
      config.setupMode === "completed"
        ? {
            status: "complete",
            initialHandSize: INITIAL_HAND_SIZE,
            resolved: { runner: "keep", corp: "keep" },
            mulligansTaken: {}
          }
        : {
            status: "mulligan_runner",
            initialHandSize: INITIAL_HAND_SIZE,
            resolved: {},
            mulligansTaken: {}
          },
    deckMetadata: {
      runner: runnerDeckMetadata,
      corp: corpDeckMetadata
    },
    runnerTurnFlags: {
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: false,
      damagePreventionUsage: {}
    }
  };

  applyIdentityStaticModifiers(state);
  applyIdentitySetupAbilities(state);
  if (config.setupMode !== "completed") state.pendingChoice = setupMulliganChoice(state, "runner");

  const initialHash = hashState(state);
  state.eventLog.push({
    eventId: "evt_0",
    type: "game_created",
    stateVersionBefore: 0,
    stateVersionAfter: 0,
    stateHashAfter: initialHash,
    publicPayload: {
      baseline: state.baseline,
      runnerDeckId: runnerDeckDefinition.id,
      corpDeckId: corpDeckDefinition.id,
      runnerDeck: runnerDeckMetadata,
      corpDeck: corpDeckMetadata,
      agendaPointsToWin: state.agendaPointsToWin,
      ...(state.setup ? { setupStatus: state.setup.status } : {})
    }
  });

  return state;
}

export function createGameAfterSetup(config: CreateGameConfig = {}): GameState {
  return createGame({ ...config, setupMode: "completed" });
}

export function getLegalActions(state: GameState, side: Side): LegalAction[] {
  if (state.winner || state.phase === "game_over") return [];
  if (state.pendingChoice) return side === state.pendingChoice.side ? [choiceAction(state, state.pendingChoice)] : [];
  if (side !== state.activeSide && state.timingPoint !== "run.approach_ice") return [];

  if (state.timingPoint === "corp_draw.mandatory_draw") {
    return side === "corp" ? [action(state, "corp", "mandatory_draw", "Korp Pflichtkarte ziehen", "game_rule")] : [];
  }

  if (state.timingPoint === "corp_action.main") return side === "corp" ? corpMainActions(state) : [];
  if (state.timingPoint === "runner_action.main") return side === "runner" ? runnerMainActions(state) : [];
  if (state.timingPoint === "run.approach_ice") return side === "corp" ? corpApproachActions(state) : [];
  if (state.timingPoint === "run.encounter_ice") return side === "runner" ? runnerEncounterActions(state) : [];
  if (state.timingPoint === "run.jack_out_window") return side === "runner" ? runnerMovementActions(state) : [];
  if (state.timingPoint === "access.resolve_card") return side === "runner" ? runnerAccessActions(state) : [];
  return [];
}

export function applyAction(state: GameState, playerAction: PlayerAction): EngineResult {
  if (playerAction.matchId !== state.matchId) {
    return fail(state, "ERR_INVALID_TARGET", "Diese Aktion gehört nicht zu diesem Spiel.");
  }
  if (playerAction.clientKnownStateVersion !== state.stateVersion) {
    return fail(state, "ERR_STALE_STATE", "Der Spielzustand ist veraltet. Bitte aktualisiere die Ansicht.");
  }

  const legalActions = getLegalActions(state, playerAction.side);
  const legalAction = legalActions.find((candidate) => candidate.actionId === playerAction.actionId);
  if (!legalAction) {
    return fail(state, playerAction.side === state.activeSide ? "ERR_UNKNOWN_ACTION" : "ERR_WRONG_SIDE", "Diese Aktion ist im aktuellen Fenster nicht legal.");
  }

  const choiceError = validateChoiceAction(state.pendingChoice, legalAction, playerAction);
  if (choiceError) return fail(state, "ERR_INVALID_CHOICE", choiceError);

  const next = cloneState(state);
  const before = state.stateVersion;

  try {
    performAction(next, legalAction, playerAction);
    checkWinConditions(next);
    next.stateVersion = before + 1;
    const validation = validateGameState(next);
    if (!validation.ok) {
      return fail(state, "ERR_INVARIANT_FAILED", `Der Spielzustand ist ungültig: ${validation.errors[0] ?? "unbekannter Fehler"}`);
    }
  } catch (error) {
    return fail(state, "ERR_INVALID_TARGET", error instanceof Error ? error.message : "Die Aktion konnte nicht ausgeführt werden.");
  }

  const stateHash = hashState(next);
  const event = buildEvent(before, next.stateVersion, stateHash, state, next, legalAction, playerAction);
  next.eventLog.push(event);

  return {
    ok: true,
    state: next,
    event,
    publicEvents: next.eventLog.map(toPublicEvent),
    stateHash
  };
}

export function getPlayerView(state: GameState, side: Side): PlayerView {
  const own = side === "runner" ? state.runner : state.corp;
  const opponent = side === "runner" ? state.corp : state.runner;
  const runnerSide = side === "runner";
  const visibleServers = state.corp.servers.map((server) => ({
    id: server.id,
    label: server.label,
    ice: server.ice.map((id) => visibleCorpCard(state, id, side, "ice")),
    root: server.id === "archives" ? visibleCorpArchives(state, side) : server.root.map((id) => visibleCorpCard(state, id, side, "root"))
  }));

  const run = state.run
    ? {
        attackedServerId: state.run.attackedServerId,
        phase: state.run.phase,
        ...(state.run.encounteredIceId ? { encounteredIce: visibleCorpCard(state, state.run.encounteredIceId, side, "ice") } : {}),
        ...(state.run.accessedCardId ? { accessedCard: visibleCorpCard(state, state.run.accessedCardId, side, "root") } : {}),
        ...(state.run.breach
          ? {
              breach: {
                breachId: state.run.breach.breachId,
                serverId: state.run.breach.serverId,
                currentIndex: state.run.breach.currentIndex,
                remainingCount: state.run.breach.queue.filter((entry) => entry.status === "pending").length,
                completed: state.run.breach.completed
              }
            }
          : {}),
        ...(state.run.badPublicityCredits !== undefined ? { badPublicityCredits: state.run.badPublicityCredits } : {}),
        successful: state.run.successful
      }
    : undefined;

  return {
    side,
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    activeSide: state.activeSide,
    phase: state.phase,
    own: runnerSide
      ? {
          identity: visibleOwnCard(state, state.runner.identity),
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          gripOrHq: state.runner.grip.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.runner.stack.length,
          heapOrArchives: state.runner.heap.map((id) => visibleOwnCard(state, id)),
          scoreArea: state.runner.scoreArea.map((id) => visibleOwnCard(state, id)),
          rig: [...state.runner.rig.programs, ...state.runner.rig.hardware, ...state.runner.rig.resources].map((id) => visibleOwnCard(state, id)),
          memoryUsed: state.runner.memoryUsed,
          memoryLimit: state.runner.memoryLimit,
          maxHandSize: maxHandSize(state, "runner"),
          coreDamage: state.runner.coreDamage,
          tags: state.runner.tags
        }
      : {
          identity: visibleOwnCard(state, state.corp.identity),
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          gripOrHq: state.corp.hq.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.corp.rd.length,
          heapOrArchives: state.corp.archives.map((id) => visibleOwnCard(state, id)),
          scoreArea: state.corp.scoreArea.map((id) => visibleOwnCard(state, id)),
          maxHandSize: maxHandSize(state, "corp"),
          tags: state.runner.tags
        },
    opponent: runnerSide
      ? {
          identity: visibleOwnCard(state, state.corp.identity),
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          tags: state.runner.tags,
          handCount: state.corp.hq.length,
          maxHandSize: maxHandSize(state, "corp"),
          deckCount: state.corp.rd.length,
          discardCount: state.corp.archives.length,
          scoreArea: state.corp.scoreArea.map((id) => visibleOwnCard(state, id))
        }
        : {
          identity: visibleOwnCard(state, state.runner.identity),
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          tags: state.runner.tags,
          handCount: state.runner.grip.length,
          maxHandSize: maxHandSize(state, "runner"),
          coreDamage: state.runner.coreDamage,
          deckCount: state.runner.stack.length,
          discardCount: state.runner.heap.length,
          scoreArea: state.runner.scoreArea.map((id) => visibleOwnCard(state, id)),
          rig: [...state.runner.rig.programs, ...state.runner.rig.hardware, ...state.runner.rig.resources].map((id) => visibleOwnCard(state, id))
        },
    servers: visibleServers,
    specialZones: visibleSpecialZones(state, side),
    ...(run ? { run } : {}),
    ...(state.pendingChoice?.side === side ? { pendingChoice: visibleChoice(state.pendingChoice) } : {}),
    ...(state.deckMetadata
      ? {
          deckMetadata: {
            own: side === "runner" ? state.deckMetadata.runner : state.deckMetadata.corp,
            opponent: side === "runner" ? state.deckMetadata.corp : state.deckMetadata.runner
          }
        }
      : {}),
    publicEvents: state.eventLog.map((event) => redactPublicEventForSide(toPublicEvent(event), side)),
    legalActions: getLegalActions(state, side),
    winner: state.winner,
    agendaPointsToWin: state.agendaPointsToWin,
    ...(state.gameEndReason ? { gameEndReason: state.gameEndReason } : {})
  };
}

export function validateGameState(state: GameState): ValidationResult {
  const errors: string[] = [];
  const placements = new Map<CardInstanceId, string>();
  const addPlacement = (id: CardInstanceId, zone: string) => {
    if (placements.has(id)) errors.push(`CardInstance ${id} appears multiple times.`);
    placements.set(id, zone);
    if (!state.cardInstances[id]) errors.push(`Zone references missing CardInstance ${id}.`);
  };

  addPlacement(state.corp.identity, "corp.identity");
  addPlacement(state.runner.identity, "runner.identity");
  for (const id of state.corp.hq) addPlacement(id, "corp.hq");
  for (const id of state.corp.rd) addPlacement(id, "corp.rd");
  for (const id of state.corp.archives) addPlacement(id, "corp.archives");
  for (const id of state.corp.scoreArea) addPlacement(id, "corp.scoreArea");
  for (const server of state.corp.servers) {
    for (const id of server.ice) addPlacement(id, `${server.id}.ice`);
    for (const id of server.root) addPlacement(id, `${server.id}.root`);
  }
  for (const id of state.runner.grip) addPlacement(id, "runner.grip");
  for (const id of state.runner.stack) addPlacement(id, "runner.stack");
  for (const id of state.runner.heap) addPlacement(id, "runner.heap");
  for (const id of state.runner.scoreArea) addPlacement(id, "runner.scoreArea");
  for (const id of state.runner.rig.programs) addPlacement(id, "runner.rig.programs");
  for (const id of state.runner.rig.hardware) addPlacement(id, "runner.rig.hardware");
  for (const id of state.runner.rig.resources) addPlacement(id, "runner.rig.resources");
  for (const id of state.specialZones?.setAside ?? []) addPlacement(id, "special.set_aside");
  for (const id of state.specialZones?.removedFromGame ?? []) addPlacement(id, "special.removed_from_game");

  for (const id of Object.keys(state.cardInstances)) {
    if (!placements.has(id)) errors.push(`CardInstance ${id} is not in any zone.`);
  }

  for (const [id, instance] of Object.entries(state.cardInstances)) {
    const placement = placements.get(id);
    const expected = placementForZoneRef(instance.zone);
    if (id !== state.corp.identity && id !== state.runner.identity && placement && expected && placement !== expected) {
      errors.push(`CardInstance ${id} zoneRef ${expected} does not match placement ${placement}.`);
    }
    if (instance.owner !== "corp" && instance.owner !== "runner") errors.push(`CardInstance ${id} has invalid owner.`);
    if (instance.controller !== "corp" && instance.controller !== "runner") errors.push(`CardInstance ${id} has invalid controller.`);
    if (instance.zone.side === "special") {
      if (instance.zone.zone !== "set_aside" && instance.zone.zone !== "removed_from_game") errors.push(`CardInstance ${id} has invalid special zone.`);
      if (instance.zone.visibility !== "public" && instance.zone.visibility !== "side_private" && instance.zone.visibility !== "hidden" && instance.zone.visibility !== "replay_only") {
        errors.push(`CardInstance ${id} has invalid special zone visibility.`);
      }
      if (instance.zone.zone === "removed_from_game" && instance.zone.returnZone) errors.push(`Removed-from-game CardInstance ${id} must not have a return zone.`);
    }
  }

  if (state.corp.credits < 0 || state.runner.credits < 0) errors.push("Credits must not be negative.");
  if (state.corp.clicks < 0 || state.runner.clicks < 0) errors.push("Clicks must not be negative.");
  if (!Number.isInteger(state.corp.maxHandSize) || state.corp.maxHandSize < 0) errors.push("Corp max hand size must be a non-negative integer.");
  if (!Number.isInteger(state.runner.maxHandSize) || state.runner.maxHandSize < 0) errors.push("Runner base max hand size must be a non-negative integer.");
  if (!Number.isInteger(state.runner.coreDamage) || state.runner.coreDamage < 0) errors.push("Runner core damage must be a non-negative integer.");
  if (!Number.isInteger(state.corp.badPublicity) || state.corp.badPublicity < 0) errors.push("Corp bad publicity must be a non-negative integer.");
  if (state.runner.tags < 0) errors.push("Runner tags must not be negative.");
  if (!Number.isInteger(state.runner.memoryLimit) || state.runner.memoryLimit < 0) errors.push("Runner memory limit must be a non-negative integer.");
  if (!Number.isInteger(state.runner.memoryUsed) || state.runner.memoryUsed < 0) errors.push("Runner memory used must be a non-negative integer.");
  if (state.runner.memoryUsed > state.runner.memoryLimit) errors.push("Runner memory limit exceeded.");
  for (const id of state.runner.rig.programs) {
    if (definitionFor(state, id).type !== "program") errors.push(`Runner rig program slot contains non-program ${id}.`);
  }
  for (const id of state.runner.rig.hardware) {
    if (definitionFor(state, id).type !== "hardware") errors.push(`Runner rig hardware slot contains non-hardware ${id}.`);
  }
  for (const id of state.runner.rig.resources) {
    if (definitionFor(state, id).type !== "resource") errors.push(`Runner rig resource slot contains non-resource ${id}.`);
  }
  for (const [id, instance] of Object.entries(state.cardInstances)) {
    for (const [counterType, amount] of Object.entries(instance.counters ?? {})) {
      if (!Number.isInteger(amount) || amount < 0) errors.push(`Counter ${counterType} on ${id} must be a non-negative integer.`);
    }
    if (instance.hostedOn) {
      if (instance.hostedOn === id) errors.push(`CardInstance ${id} cannot host itself.`);
      if (!state.cardInstances[instance.hostedOn]) errors.push(`CardInstance ${id} references missing host ${instance.hostedOn}.`);
      if (hasHostingCycle(state, id)) errors.push(`CardInstance ${id} has a hosting cycle.`);
    }
  }
  if (state.run?.encounteredIceId && !state.cardInstances[state.run.encounteredIceId]) errors.push("Run references missing encountered ice.");
  if (state.run && !Array.isArray(state.run.resolvedSubroutineIndexes)) errors.push("Run resolved subroutine index list is missing.");
  if (state.run?.breach) {
    if (state.run.phase !== "access") errors.push("Breach is only valid during access.");
    if (state.run.breach.serverId !== state.run.attackedServerId) errors.push("Breach server must match attacked server.");
    if (!state.run.breach.completed && (state.run.breach.currentIndex < 0 || state.run.breach.currentIndex >= state.run.breach.queue.length)) {
      errors.push("Breach current index is invalid.");
    }
    const entryIds = new Set<string>();
    for (const entry of state.run.breach.queue) {
      if (entryIds.has(entry.entryId)) errors.push(`Breach entry ${entry.entryId} appears multiple times.`);
      entryIds.add(entry.entryId);
      if (!state.cardInstances[entry.cardInstanceId]) errors.push(`Breach references missing CardInstance ${entry.cardInstanceId}.`);
      if (entry.serverId !== state.run.attackedServerId) errors.push("Breach entry server must match attacked server.");
    }
    const currentEntry = state.run.breach.queue[state.run.breach.currentIndex];
    if (state.run.accessedCardId && currentEntry && currentEntry.cardInstanceId !== state.run.accessedCardId) {
      errors.push("Accessed card must match the current breach entry.");
    }
  }
  if (state.trace) {
    if (!state.cardInstances[state.trace.sourceCardInstanceId]) errors.push("Trace references missing source card.");
    if (!Number.isInteger(state.trace.baseTraceStrength) || state.trace.baseTraceStrength < 0) errors.push("Trace base strength is invalid.");
    if (state.trace.successEffect.type !== "add_tag" || state.trace.successEffect.amount !== 1) errors.push("Trace success effect is outside V0.96 scope.");
    if (!state.pendingChoice) errors.push("Trace requires an open PendingChoice.");
    if (state.trace.status === "corp_bid" && state.pendingChoice?.side !== "corp") errors.push("Corp trace bid requires Corp choice.");
    if (state.trace.status === "runner_bid") {
      if (state.pendingChoice?.side !== "runner") errors.push("Runner trace bid requires Runner choice.");
      if (state.trace.corpBid === undefined || state.trace.traceStrength === undefined || state.trace.runnerLink === undefined) errors.push("Runner trace bid is missing Corp bid context.");
    }
  }
  if (state.identityAbilityUsage) {
    for (const side of ["corp", "runner"] as const) {
      const usage = state.identityAbilityUsage[side];
      if (!usage) continue;
      const setupAbilities = Array.isArray(usage.setupAbilities) ? usage.setupAbilities : [];
      const usedThisTurn = Array.isArray(usage.usedThisTurn) ? usage.usedThisTurn : [];
      if (!Array.isArray(usage.setupAbilities) || !Array.isArray(usage.usedThisTurn)) errors.push(`Identity usage for ${side} must contain ability arrays.`);
      if (!Number.isInteger(usage.turn) || usage.turn < 0) errors.push(`Identity usage for ${side} has invalid turn.`);
      if (new Set(setupAbilities).size !== setupAbilities.length) errors.push(`Identity setup usage for ${side} must be unique.`);
      if (new Set(usedThisTurn).size !== usedThisTurn.length) errors.push(`Identity turn usage for ${side} must be unique.`);
      if (![...setupAbilities, ...usedThisTurn].every((id) => typeof id === "string" && id.length > 0)) {
        errors.push(`Identity usage for ${side} has invalid ability ids.`);
      }
    }
  }
  if (state.pendingChoice) {
    if (state.pendingChoice.side !== "corp" && state.pendingChoice.side !== "runner") errors.push("PendingChoice has invalid side.");
    if (state.pendingChoice.stateVersion !== state.stateVersion) errors.push("PendingChoice stateVersion must match current GameState.");
    if (state.pendingChoice.minSelections < 0 || state.pendingChoice.maxSelections < state.pendingChoice.minSelections) errors.push("PendingChoice has invalid selection bounds.");
    const optionIds = new Set(state.pendingChoice.options.map((option) => option.id));
    if (optionIds.size !== state.pendingChoice.options.length) errors.push("PendingChoice option ids must be unique.");
  }
  if (state.eventModificationWindow) {
    if (!state.imminentEvent) errors.push("EventModificationWindow requires an ImminentEvent.");
    if (state.eventModificationWindow.eventId !== state.imminentEvent?.eventId) errors.push("EventModificationWindow eventId must match ImminentEvent.");
    if (state.eventModificationWindow.candidates.some((candidate) => candidate.eventId !== state.eventModificationWindow?.eventId)) {
      errors.push("EventModification candidates must reference the open event.");
    }
  }
  if (state.replacementWindow) {
    if (!state.imminentEvent) errors.push("ReplacementWindow requires an ImminentEvent.");
    if (state.replacementWindow.originalEventId !== state.imminentEvent?.eventId) errors.push("ReplacementWindow originalEventId must match ImminentEvent.");
    const consumed = new Set(state.replacementWindow.consumedCandidateIds);
    if (consumed.size !== state.replacementWindow.consumedCandidateIds.length) errors.push("Replacement consumedCandidateIds must be unique.");
  }

  return { ok: errors.length === 0, errors };
}

function placementForZoneRef(zone: CardInstance["zone"]): string | undefined {
  if (zone.side === "corp" && zone.zone === "hq") return "corp.hq";
  if (zone.side === "corp" && zone.zone === "rd") return "corp.rd";
  if (zone.side === "corp" && zone.zone === "archives") return "corp.archives";
  if (zone.side === "corp" && zone.zone === "scoreArea") return "corp.scoreArea";
  if (zone.side === "corp" && zone.zone === "serverIce") return `${zone.serverId}.ice`;
  if (zone.side === "corp" && zone.zone === "serverRoot") return `${zone.serverId}.root`;
  if (zone.side === "runner" && zone.zone === "grip") return "runner.grip";
  if (zone.side === "runner" && zone.zone === "stack") return "runner.stack";
  if (zone.side === "runner" && zone.zone === "heap") return "runner.heap";
  if (zone.side === "runner" && zone.zone === "scoreArea") return "runner.scoreArea";
  if (zone.side === "runner" && zone.zone === "rig") {
    return undefined;
  }
  if (zone.side === "special" && zone.zone === "set_aside") return "special.set_aside";
  if (zone.side === "special" && zone.zone === "removed_from_game") return "special.removed_from_game";
  return undefined;
}

export function validateDeckDefinition(
  deck: DeckDefinition,
  options: {
    expectedSide?: Side;
    allowedDeckIds?: string[];
    minimumAgendaPoints?: number;
  } = {}
): ValidationResult {
  const errors: string[] = [];
  if (options.allowedDeckIds && !options.allowedDeckIds.includes(deck.id)) errors.push(`Deck ${deck.id} is not in the curated allowlist.`);
  if (options.expectedSide && deck.side !== options.expectedSide) errors.push(`Deck ${deck.id} has side ${deck.side}, expected ${options.expectedSide}.`);

  const identity = DEMO_CARDS_BY_ID[deck.identity];
  if (!identity) errors.push(`Deck ${deck.id} references missing identity ${deck.identity}.`);
  else {
    if (identity.type !== "identity") errors.push(`Deck ${deck.id} identity ${deck.identity} is not an identity.`);
    if (identity.side !== deck.side) errors.push(`Deck ${deck.id} identity ${deck.identity} has wrong side.`);
  }

  let agendaPointsTotal = 0;
  for (const entry of deck.cards) {
    const definition = DEMO_CARDS_BY_ID[entry.id];
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) errors.push(`Deck ${deck.id} has invalid quantity for ${entry.id}.`);
    if (!definition) {
      errors.push(`Deck ${deck.id} references unknown card ${entry.id}.`);
      continue;
    }
    if (cardHasSubtype(definition, "unique") && entry.quantity > 1) {
      errors.push(`Deck ${deck.id} includes more than one copy of unique card ${entry.id}.`);
    }
    if (definition.side !== deck.side) errors.push(`Deck ${deck.id} includes wrong-side card ${entry.id}.`);
    if (definition.implementationStatus !== "playable_mvp") errors.push(`Deck ${deck.id} includes non-playable card ${entry.id}.`);
    agendaPointsTotal += (definition.agendaPoints ?? 0) * entry.quantity;
  }
  if (deck.side === "corp" && options.minimumAgendaPoints !== undefined && agendaPointsTotal < options.minimumAgendaPoints) {
    errors.push(`Deck ${deck.id} has ${agendaPointsTotal} agenda points, expected at least ${options.minimumAgendaPoints}.`);
  }

  return { ok: errors.length === 0, errors };
}

export function checkWinConditions(state: GameState): Winner | null {
  if (state.winner) {
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    state.gameEndReason ??= "unknown";
    return state.winner;
  }
  const runnerPoints = agendaPoints(state, "runner");
  const corpPoints = agendaPoints(state, "corp");
  if (runnerPoints >= state.agendaPointsToWin && corpPoints >= state.agendaPointsToWin) state.winner = "draw";
  else if (runnerPoints >= state.agendaPointsToWin) state.winner = "runner";
  else if (corpPoints >= state.agendaPointsToWin) state.winner = "corp";
  if (state.winner) {
    state.gameEndReason = "agenda_points";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
  }
  return state.winner;
}

export function replayEvents(initialState: GameState, eventLog: GameEvent[]): ReplayResult {
  let current = cloneState({ ...initialState, eventLog: initialState.eventLog.slice(0, 1) });
  const errors: string[] = [];
  for (const event of eventLog) {
    if (event.type === "game_created") continue;
    const actionPayload = event.privatePayload?.[event.publicPayload.actor as Side]?.action;
    if (!isReplayAction(actionPayload)) {
      errors.push(`Event ${event.eventId} has no replayable action.`);
      continue;
    }
    const result = applyAction(current, actionPayload);
    if (!result.ok) {
      errors.push(`Replay failed at ${event.eventId}: ${result.error.code}`);
      break;
    }
    current = result.state;
    if (result.stateHash !== event.stateHashAfter) {
      errors.push(`StateHash mismatch at ${event.eventId}.`);
      break;
    }
  }
  const lastHash = eventLog.at(-1)?.stateHashAfter;
  return {
    ok: errors.length === 0,
    state: current,
    ...(lastHash ? { expectedFinalStateHash: lastHash } : {}),
    actualFinalStateHash: hashState(current),
    errors
  };
}

export function hashState(state: GameState): StateHash {
  const canonical = stableStringify(stripForHash(state));
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function applyEffectCommands(state: GameState, commands: EffectCommand[]): GameState {
  const next = cloneState(state);
  executeEffectCommands(next, commands);
  const validation = validateGameState(next);
  if (!validation.ok) throw new Error(validation.errors[0] ?? "Effect command left invalid state.");
  return next;
}

export function eventVisibilityForAction(legalAction: LegalAction): EventVisibilityClass {
  if (legalAction.type === "move_to_set_aside" || legalAction.type === "move_to_removed_from_game" || legalAction.type === "return_from_set_aside") {
    return legalAction.payload?.specialZoneVisibility === "public" ? "public" : "hidden_info_barrier";
  }
  if (legalAction.type === "change_card_control") {
    const visibility = legalAction.payload?.controlChangeVisibility;
    return visibility === "hidden_info_barrier" || visibility === "private_to_side" || visibility === "replay_only" || visibility === "public" ? visibility : "public";
  }
  if (legalAction.type === "resolve_choice") {
    const choiceVisibility = legalAction.payload?.choiceVisibility;
    return choiceVisibility === "hidden_info_barrier" || choiceVisibility === "private_to_side" || choiceVisibility === "replay_only" || choiceVisibility === "public"
      ? choiceVisibility
      : "private_to_side";
  }
  if (legalAction.payload?.traceStarted === true) return "public";
  if (legalAction.payload?.damageResolved === true) return "hidden_info_barrier";
  if (legalAction.payload?.hiddenZoneBarrier === true) return "hidden_info_barrier";
  if (["access_card", "rez_ice", "score_agenda", "steal_agenda", "trash_accessed_card", "play_operation"].includes(legalAction.type)) return "hidden_info_barrier";
  if (["mandatory_draw", "draw_card"].includes(legalAction.type)) return "private_to_side";
  if (legalAction.type === "purge_virus_counters") return "public";
  if (legalAction.type === "jack_out") return "public";
  if (legalAction.visibility === "public") return "public";
  if (legalAction.type === "play_event") return "public";
  return "private_to_side";
}

export function isHiddenInfoBarrierEvent(event: GameEvent): boolean {
  if (event.visibilityClass === "hidden_info_barrier") return true;
  if (event.publicPayload.damageResolved === true) return true;
  if (event.publicPayload.hiddenZoneBarrier === true) return true;
  if (event.publicPayload.specialZoneVisibility && event.publicPayload.specialZoneVisibility !== "public") return true;
  return ["access_card", "rez_ice", "score_agenda", "steal_agenda", "trash_accessed_card", "play_operation"].includes(event.type);
}

function corpMainActions(state: GameState): LegalAction[] {
  const actions: LegalAction[] = [];
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      if (definition.type === "agenda" && (definition.advancementRequirement ?? 0) <= mustInstance(state.cardInstances, id).advancementCounters) {
        actions.push(action(state, "corp", "score_agenda", `Agenda in ${server.label} scoren`, id, [], { cardId: id }));
      }
    }
  }
  if (state.corp.clicks <= 0) {
    actions.push(action(state, "corp", "end_turn", "Zug beenden", "game_rule"));
    return actions;
  }
  if (state.corp.clicks >= 3 && totalCounters(state, "virus") > 0) {
    actions.push(
      action(state, "corp", "purge_virus_counters", "Virus-Counter purgen", "basic_action", [{ clicks: 3 }], { purgedCounterType: "virus" }, { targetRequirements: [] })
    );
  }
  actions.push(action(state, "corp", "gain_credit", "1 Credit nehmen", "basic_action", [{ clicks: 1 }]));
  if (state.corp.rd.length > 0) actions.push(action(state, "corp", "draw_card", "Karte ziehen", "basic_action", [{ clicks: 1 }]));
  if (state.runner.tags > 0 && state.corp.credits >= 2) {
    for (const id of state.runner.rig.resources) {
      const definition = definitionFor(state, id);
      actions.push(
        action(
          state,
          "corp",
          "trash_resource",
          `${definition.title} trashen`,
          "basic_action",
          [{ clicks: 1, credits: 2 }],
          { cardId: id, resourceId: id },
          { targetRequirements: [{ id: "resource", kind: "card", side: "runner", zoneScope: ["runner.rig.resources"], visibility: "public" }] }
        )
      );
    }
  }
  for (const id of state.corp.hq) {
    const definition = definitionFor(state, id);
    if (definition.type === "operation" && state.corp.credits >= (definition.cost ?? 0) && canPlayCorpOperation(state, definition)) {
      actions.push(action(state, "corp", "play_operation", `${definition.title} spielen`, id, [{ clicks: 1, credits: definition.cost ?? 0 }], { cardId: id }));
    }
    if (definition.type === "ice") {
      actions.push(action(state, "corp", "install_card", `ICE vor neuem Remote installieren`, id, [{ clicks: 1 }], { cardId: id, serverId: "new_remote", placement: "ice" }));
      for (const server of state.corp.servers) {
        actions.push(action(state, "corp", "install_card", `ICE vor ${server.label} installieren`, id, [{ clicks: 1 }], { cardId: id, serverId: server.id, placement: "ice" }));
      }
    }
    if (definition.type === "agenda" || definition.type === "asset" || definition.type === "upgrade") {
      if (isUniqueCard(definition) && hasInstalledUniqueCardDefinition(state, "corp", definition.id)) continue;
      const regionInstallCost = isRegionUpgrade(definition) ? rezCostForCard(state, id) : 0;
      if (state.corp.credits >= regionInstallCost) {
        actions.push(
          action(
            state,
            "corp",
            "install_card",
            `Karte in neuem Remote installieren`,
            id,
            [{ clicks: 1, ...(regionInstallCost > 0 ? { credits: regionInstallCost } : {}) }],
            { cardId: id, serverId: "new_remote", placement: "root" }
          )
        );
      }
      for (const server of state.corp.servers.filter((candidate) => candidate.kind === "remote")) {
        if (canInstallCorpRootCardInServer(state, definition, server) && state.corp.credits >= regionInstallCost) {
          actions.push(
            action(
              state,
              "corp",
              "install_card",
              `Karte in ${server.label} installieren`,
              id,
              [{ clicks: 1, ...(regionInstallCost > 0 ? { credits: regionInstallCost } : {}) }],
              { cardId: id, serverId: server.id, placement: "root" }
            )
          );
        }
      }
    }
  }
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      if (definition.type === "agenda") {
        if (state.corp.credits >= 1) actions.push(action(state, "corp", "advance_card", `Agenda in ${server.label} advancen`, id, [{ clicks: 1, credits: 1 }], { cardId: id }));
      }
      const rezCost = rezCostForCard(state, id);
      if ((definition.type === "asset" || definition.type === "upgrade") && !mustInstance(state.cardInstances, id).rezzed && state.corp.credits >= rezCost) {
        actions.push(action(state, "corp", "rez_ice", `Karte in ${server.label} rezzen`, id, [{ credits: rezCost }], { cardId: id, rootRez: true }));
      }
    }
  }
  actions.push(...specialZoneHarnessActions(state, "corp"));
  actions.push(action(state, "corp", "end_turn", "Zug beenden", "game_rule"));
  return actions;
}

function runnerMainActions(state: GameState): LegalAction[] {
  const actions: LegalAction[] = [];
  if (state.runner.clicks <= 0) {
    actions.push(action(state, "runner", "end_turn", "Zug beenden", "game_rule"));
    return actions;
  }
  actions.push(action(state, "runner", "gain_credit", "1 Credit nehmen", "basic_action", [{ clicks: 1 }]));
  if (state.runner.stack.length > 0) actions.push(action(state, "runner", "draw_card", "Karte ziehen", "basic_action", [{ clicks: 1 }]));
  if (state.runner.tags > 0 && state.runner.credits >= 2) {
    actions.push(action(state, "runner", "remove_tag", "Tag entfernen", "basic_action", [{ clicks: 1, credits: 2 }]));
  }
  for (const id of state.runner.grip) {
    const definition = definitionFor(state, id);
    const uniqueBlocked = isUniqueCard(definition) && hasInstalledUniqueCardDefinition(state, "runner", definition.id);
    if (
      definition.type === "program" &&
      !uniqueBlocked &&
      availableRunnerProgramInstallCredits(state) >= (definition.installCost ?? 0) &&
      state.runner.memoryUsed + (definition.memoryCost ?? 0) <= state.runner.memoryLimit
    ) {
      actions.push(action(state, "runner", "install_card", `${definition.title} installieren`, id, [{ clicks: 1, credits: definition.installCost ?? 0 }], { cardId: id }));
    }
    if (definition.type === "program" && !uniqueBlocked && availableRunnerProgramInstallCredits(state) >= (definition.installCost ?? 0)) {
      for (const hostId of state.runner.rig.programs) {
        if (!canHostProgramOnDaemon(state, hostId, definition)) continue;
        const hostDefinition = definitionFor(state, hostId);
        actions.push(
          action(
            state,
            "runner",
            "install_card",
            `${definition.title} in ${hostDefinition.title} hosten`,
            id,
            [{ clicks: 1, credits: definition.installCost ?? 0 }],
            { cardId: id, hostOnCardId: hostId },
            { targetRequirements: [{ id: "hostProgram", kind: "card", side: "runner", zoneScope: ["runner.rig.programs"], visibility: "public" }] }
          )
        );
      }
    }
    if (definition.type === "hardware" && !uniqueBlocked && state.runner.credits >= (definition.installCost ?? 0)) {
      actions.push(action(state, "runner", "install_card", `${definition.title} installieren`, id, [{ clicks: 1, credits: definition.installCost ?? 0 }], { cardId: id }));
    }
    if (definition.type === "resource" && !uniqueBlocked && state.runner.credits >= (definition.installCost ?? 0)) {
      actions.push(
        action(
          state,
          "runner",
          "install_card",
          `${definition.title} installieren`,
          id,
          [{ clicks: 1, credits: definition.installCost ?? 0 }],
          { cardId: id },
          { targetRequirements: [{ id: "resourceCard", kind: "card", side: "runner", zoneScope: ["runner.grip"], visibility: "known_to_actor" }] }
        )
      );
    }
    if (definition.type === "event" && state.runner.credits >= (definition.cost ?? 0)) {
      const resolver = RUNNER_EVENT_RESOLVERS[definition.id];
      if (!resolver) continue;
      if (resolver.canPlay && !resolver.canPlay(state)) continue;
      if (resolver.requiresServer) {
        for (const server of state.corp.servers) {
          if (resolver.canPlayForServer && !resolver.canPlayForServer(state, server.id)) continue;
          actions.push(action(state, "runner", "play_event", `${definition.title} auf ${server.label}`, id, [{ clicks: 1, credits: definition.cost ?? 0 }], { cardId: id, serverId: server.id }));
        }
      } else {
        actions.push(action(state, "runner", "play_event", `${definition.title} spielen`, id, [{ clicks: 1, credits: definition.cost ?? 0 }], { cardId: id }));
      }
    }
  }
  for (const server of state.corp.servers) {
    actions.push(action(state, "runner", "start_run", `Run auf ${server.label}`, "basic_action", [{ clicks: 1 }], { serverId: server.id }));
  }
  actions.push(...specialZoneHarnessActions(state, "runner"));
  actions.push(action(state, "runner", "end_turn", "Zug beenden", "game_rule"));
  return actions;
}

function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cardHasSubtype(definition: CardDefinition, subtype: string): boolean {
  const target = normalizeSubtypeLabel(subtype);
  return definition.subtypes.some((candidate) => normalizeSubtypeLabel(candidate) === target);
}

function isRegionUpgrade(definition: CardDefinition): boolean {
  return definition.type === "upgrade" && cardHasSubtype(definition, "region");
}

function isUniqueCard(definition: CardDefinition): boolean {
  return cardHasSubtype(definition, "unique");
}

function runnerInstalledCardIds(state: GameState): CardInstanceId[] {
  return [...state.runner.rig.programs, ...state.runner.rig.hardware, ...state.runner.rig.resources];
}

function corpInstalledCardIds(state: GameState): CardInstanceId[] {
  const installed: CardInstanceId[] = [];
  for (const server of state.corp.servers) installed.push(...server.root, ...server.ice);
  return installed;
}

function hasInstalledUniqueCardDefinition(state: GameState, side: Side, definitionId: CardDefinitionId): boolean {
  const installed = side === "runner" ? runnerInstalledCardIds(state) : corpInstalledCardIds(state);
  return installed.some((cardId) => definitionFor(state, cardId).id === definitionId);
}

function daemonHostingCapacity(definition: CardDefinition): number {
  if (definition.id === "onr_v1_069_succubus") return 3;
  if (definition.id === "onr_v1_001_afreet") return 3;
  if (definition.id === "onr_v1_033_imp") return 2;
  return 0;
}

function daemonHostedMemoryUsed(state: GameState, hostId: CardInstanceId): number {
  return hostedCardsOn(state, hostId).reduce((sum, cardId) => {
    const definition = definitionFor(state, cardId);
    if (definition.type !== "program") return sum;
    return sum + (definition.memoryCost ?? 0);
  }, 0);
}

function canHostProgramOnDaemon(state: GameState, hostId: CardInstanceId, programDefinition: CardDefinition): boolean {
  if (programDefinition.type !== "program") return false;
  const hostDefinition = definitionFor(state, hostId);
  if (hostDefinition.type !== "program" || !cardHasSubtype(hostDefinition, "daemon")) return false;
  const capacity = daemonHostingCapacity(hostDefinition);
  if (capacity <= 0) return false;
  return daemonHostedMemoryUsed(state, hostId) + (programDefinition.memoryCost ?? 0) <= capacity;
}

function corpServerIdForInstalledCard(state: GameState, cardId: CardInstanceId): Exclude<ServerId, "new_remote"> | undefined {
  const zone = mustInstance(state.cardInstances, cardId).zone;
  if (zone.side === "corp" && (zone.zone === "serverIce" || zone.zone === "serverRoot")) return zone.serverId;
  return undefined;
}

function rezzedCorpRootCardIds(state: GameState): CardInstanceId[] {
  const ids: CardInstanceId[] = [];
  for (const server of state.corp.servers) {
    for (const cardId of server.root) {
      if (mustInstance(state.cardInstances, cardId).rezzed) ids.push(cardId);
    }
  }
  return ids;
}

function scoredCorpAgendaIds(state: GameState): CardInstanceId[] {
  return state.corp.scoreArea.slice();
}

function iceStrengthBonusFor(state: GameState, iceId: CardInstanceId): number {
  const iceDefinition = definitionFor(state, iceId);
  const iceServerId = corpServerIdForInstalledCard(state, iceId);
  let bonus = 0;
  for (const sourceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinition = definitionFor(state, sourceId);
    if (sourceDefinition.id === "onr_v1_317_data-masons" && cardHasSubtype(iceDefinition, "wall")) bonus += 1;
    if (sourceDefinition.id === "onr_v1_350_antiquated-interface-routines" && iceServerId && corpServerIdForInstalledCard(state, sourceId) === iceServerId) bonus += 1;
  }
  for (const agendaId of scoredCorpAgendaIds(state)) {
    const agendaDefinition = definitionFor(state, agendaId);
    if (agendaDefinition.id === "onr_v1_215_security-net-optimization") bonus += 1;
  }
  return bonus;
}

function iceStrengthFor(state: GameState, iceId: CardInstanceId): number {
  const definition = definitionFor(state, iceId);
  const instance = mustInstance(state.cardInstances, iceId);
  return (definition.strength ?? 0) + instance.strengthModifier + iceStrengthBonusFor(state, iceId);
}

function iceRezCostReductionFor(state: GameState, iceDefinition: CardDefinition): number {
  let reduction = 0;
  for (const sourceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinition = definitionFor(state, sourceId);
    if (sourceDefinition.id === "onr_v1_317_data-masons" && cardHasSubtype(iceDefinition, "wall")) reduction += 2;
    if (sourceDefinition.id === "onr_v1_320_encoder-inc" && cardHasSubtype(iceDefinition, "code_gate")) reduction += 2;
    if (sourceDefinition.id === "onr_v1_341_skalderviken-sa-beta-test-site" && cardHasSubtype(iceDefinition, "black_ice")) reduction += 2;
  }
  return reduction;
}

function rezCostForCard(state: GameState, cardId: CardInstanceId): number {
  const definition = definitionFor(state, cardId);
  const baseCost = definition.rezCost ?? 0;
  if (definition.type !== "ice") return baseCost;
  const reduction = iceRezCostReductionFor(state, definition);
  return Math.max(0, baseCost - reduction);
}

function specialZoneHarnessActions(state: GameState, side: Side): LegalAction[] {
  const harness = state.specialZoneHarness;
  if (!harness || harness.actor !== side || !state.cardInstances[harness.cardInstanceId]) return [];
  const cardId = harness.cardInstanceId;
  const instance = mustInstance(state.cardInstances, cardId);
  const actions: LegalAction[] = [];
  if (harness.setAside && instance.zone.side !== "special") {
    actions.push(
      action(
        state,
        side,
        "move_to_set_aside",
        "Karte testweise set-aside legen",
        "game_rule",
        [],
        {
          cardId,
          specialZone: "set_aside",
          specialZoneVisibility: harness.setAside.visibility,
          ...(harness.setAside.visibilitySide ? { specialZoneVisibilitySide: harness.setAside.visibilitySide } : {}),
          specialZoneReason: harness.setAside.reason ?? "v1.2.2_test_harness"
        },
        { targetRequirements: [{ id: "card", kind: "card", visibility: "engine_only" }] }
      )
    );
  }
  if (harness.removedFromGame && instance.zone.side !== "special") {
    actions.push(
      action(
        state,
        side,
        "move_to_removed_from_game",
        "Karte testweise aus dem Spiel entfernen",
        "game_rule",
        [],
        {
          cardId,
          specialZone: "removed_from_game",
          specialZoneVisibility: harness.removedFromGame.visibility,
          ...(harness.removedFromGame.visibilitySide ? { specialZoneVisibilitySide: harness.removedFromGame.visibilitySide } : {}),
          specialZoneReason: harness.removedFromGame.reason ?? "v1.2.2_test_harness"
        },
        { targetRequirements: [{ id: "card", kind: "card", visibility: "engine_only" }] }
      )
    );
  }
  if (harness.setAside?.allowReturn && instance.zone.side === "special" && instance.zone.zone === "set_aside") {
    actions.push(
      action(
        state,
        side,
        "return_from_set_aside",
        "Karte testweise aus Set Aside zurückholen",
        "game_rule",
        [],
        { cardId, specialZone: "set_aside", specialZoneReason: harness.setAside.reason ?? "v1.2.2_test_harness_return" },
        { targetRequirements: [{ id: "card", kind: "card", zoneScope: ["special.set_aside"], visibility: "engine_only" }] }
      )
    );
  }
  if (harness.controlChange && instance.controller !== harness.controlChange.newController) {
    actions.push(
      action(
        state,
        side,
        "change_card_control",
        "Kartenkontrolle testweise wechseln",
        "game_rule",
        [],
        {
          cardId,
          oldController: instance.controller,
          newController: harness.controlChange.newController,
          controlChangeVisibility: harness.controlChange.visibility ?? "public",
          controlChangeReason: harness.controlChange.reason ?? "v1.2.2_test_harness"
        },
        { targetRequirements: [{ id: "card", kind: "card", visibility: "engine_only" }, { id: "controller", kind: "side", allowedSides: ["corp", "runner"] }] }
      )
    );
  }
  return actions;
}

function corpApproachActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.approachedIceId) return [];
  const ice = mustInstance(state.cardInstances, run.approachedIceId);
  const definition = definitionFor(state, run.approachedIceId);
  const actions: LegalAction[] = [];
  const rezCost = rezCostForCard(state, run.approachedIceId);
  if (!ice.rezzed && state.corp.credits >= rezCost) {
    actions.push(action(state, "corp", "rez_ice", `${definition.title} rezzen`, run.approachedIceId, [{ credits: rezCost }], { cardId: run.approachedIceId }));
  }
  actions.push(action(state, "corp", "decline_rez", "Nicht rezzen", "game_rule"));
  return actions;
}

function runnerEncounterActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.encounteredIceId) return [];
  const encounteredIceId = run.encounteredIceId;
  const iceDefinition = definitionFor(state, run.encounteredIceId);
  const encounteredIceStrength = iceStrengthFor(state, encounteredIceId);
  const actions: LegalAction[] = [];
  for (const breakerId of state.runner.rig.programs) {
    const breaker = definitionFor(state, breakerId);
    const breakerStrength = (breaker.strength ?? 0) + mustInstance(state.cardInstances, breakerId).strengthModifier;
    const pump = breaker.abilities?.find((ability) => ability.type === "pump_strength");
    if (pump && availableRunnerRunCredits(state, breakerId) >= pump.cost.credits) {
      actions.push(
        action(
          state,
          "runner",
          "pump_breaker",
          `${breaker.title} pumpen`,
          breakerId,
          [{ credits: pump.cost.credits }],
          { breakerId, iceId: encounteredIceId },
          abilityMetadata(breakerId, pump.id, encounteredIceId)
        )
      );
    }
    const breakAbility = breaker.abilities?.find((ability) => ability.type === "break_subroutine" && (!ability.iceSubtype || iceDefinition.subtypes.includes(ability.iceSubtype)));
    if (breakAbility && breakerStrength >= encounteredIceStrength && availableRunnerRunCredits(state, breakerId) >= breakAbility.cost.credits) {
      const subroutines = iceDefinition.subroutines ?? [];
      subroutines.forEach((subroutine, index) => {
        if (!run.brokenSubroutineIndexes.includes(index) && !run.resolvedSubroutineIndexes.includes(index)) {
          actions.push(
            action(
              state,
              "runner",
              "break_subroutine",
              `${subroutine.id} brechen`,
              breakerId,
              [{ credits: breakAbility.cost.credits }],
              { breakerId, iceId: encounteredIceId, subroutineIndex: index },
              abilityMetadata(breakerId, breakAbility.id, encounteredIceId)
            )
          );
        }
      });
    }
  }
  const nextSubroutines = encounterSubroutinesForNextContinue(run, iceDefinition.subroutines ?? []);
  const willEndRun = nextSubroutines.some((subroutine) => subroutine.type === "end_the_run");
  const continueLabel = nextSubroutines.length === 0 ? "ICE passieren" : willEndRun ? "Subroutinen auslösen (Run endet)" : "Subroutinen auslösen";
  actions.push(
    action(state, "runner", "continue_run", continueLabel, "game_rule", [], {
      encounterContinue: true,
      unbrokenSubroutineCount: nextSubroutines.length,
      encounterWillEndRun: willEndRun
    })
  );
  return actions;
}

function encounterSubroutinesForNextContinue(run: RunState, subroutines: NonNullable<CardDefinition["subroutines"]>): NonNullable<CardDefinition["subroutines"]> {
  const nextSubroutines: NonNullable<CardDefinition["subroutines"]> = [];
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (!subroutine || run.brokenSubroutineIndexes.includes(index) || run.resolvedSubroutineIndexes.includes(index)) continue;
    nextSubroutines.push(subroutine);
    if (subroutine.type === "initiate_trace") break;
  }
  return nextSubroutines;
}

function runnerMovementActions(state: GameState): LegalAction[] {
  mustRun(state);
  return [action(state, "runner", "jack_out", "Jack-out", "game_rule"), action(state, "runner", "continue_run", "Run fortsetzen", "game_rule")];
}

function runnerAccessActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.accessedCardId) {
    if (hasPendingAccessCandidate(state, run)) return [action(state, "runner", "access_card", "Karte accessen", "game_rule")];
    return [action(state, "runner", "continue_run", "Zugriff abschließen", "game_rule")];
  }
  const definition = definitionFor(state, run.accessedCardId);
  if (definition.type === "agenda") return [action(state, "runner", "steal_agenda", `${definition.title} stehlen`, run.accessedCardId)];
  if (definition.type === "asset" || definition.type === "upgrade") {
    const actions: LegalAction[] = [];
    if (state.runner.credits >= (definition.trashCost ?? 0)) {
      actions.push(action(state, "runner", "trash_accessed_card", `${definition.title} trashen`, run.accessedCardId, [{ credits: definition.trashCost ?? 0 }]));
    }
    actions.push(action(state, "runner", "decline_trash", "Nicht trashen", "game_rule"));
    return actions;
  }
  return [action(state, "runner", "decline_trash", run.breach ? "Weiter accessen" : "Access abschließen", "game_rule")];
}

function hasPendingAccessCandidate(state: GameState, run: ActiveRun): boolean {
  if (run.breach) return run.breach.queue[run.breach.currentIndex]?.status === "pending";
  const server = mustServer(state, run.attackedServerId);
  if (server.id === "rd") return state.corp.rd.length > 0;
  if (server.id === "hq") return state.corp.hq.length > 0;
  if (server.id === "archives") return state.corp.archives.length > 0;
  return server.root.length > 0;
}

function performAction(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  switch (legalAction.type) {
    case "mandatory_draw":
      drawCorpCard(state);
      if (state.winner) return;
      state.phase = "corp_action_phase";
      state.timingPoint = "corp_action.main";
      state.activeSide = "corp";
      return;
    case "gain_credit":
      spendClick(state, legalAction.side);
      credits(state, legalAction.side, 1);
      return;
    case "draw_card":
      spendClick(state, legalAction.side);
      legalAction.side === "runner" ? drawRunnerCard(state) : drawCorpCard(state);
      return;
    case "play_event":
      playRunnerEvent(state, legalAction);
      return;
    case "play_operation":
      spendClick(state, "corp");
      spendCredits(state, "corp", legalAction.costs[0]?.credits ?? 0);
      if (legalAction.payload?.cardId) {
        const cardId = String(legalAction.payload.cardId);
        const definition = definitionFor(state, cardId);
        removeFromAllZones(state, cardId);
        state.corp.archives.push(cardId);
        state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "corp", zone: "archives" } };
        resolveCorpOperation(state, definition, legalAction);
        if (definition.id === "v098_hq_rd_swap_operation") {
          legalAction.payload = { ...(legalAction.payload ?? {}), hiddenZoneBarrier: true, hiddenZoneAction: "swap_hq_rd" };
        }
        if (definition.id === "v099_bad_publicity_operation") {
          legalAction.payload = { ...(legalAction.payload ?? {}), badPublicityAfter: state.corp.badPublicity };
        }
      }
      return;
    case "install_card":
      installCard(state, legalAction);
      return;
    case "advance_card":
      spendClick(state, "corp");
      spendCredits(state, "corp", 1);
      mustInstance(state.cardInstances, String(legalAction.payload?.cardId)).advancementCounters += 1;
      return;
    case "score_agenda":
      scoreAgenda(state, String(legalAction.payload?.cardId), legalAction);
      return;
    case "start_run":
      spendClick(state, "runner");
      startRun(state, String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">);
      return;
    case "jack_out":
      finishRun(state, false);
      return;
    case "rez_ice":
      rezCard(state, String(legalAction.payload?.cardId), legalAction.payload?.rootRez === true || legalAction.payload?.assetRez === true);
      return;
    case "decline_rez":
      passApproachedIce(state);
      return;
    case "pump_breaker":
      spendRunnerRunCredits(state, legalAction.costs[0]?.credits ?? 1, typeof legalAction.payload?.breakerId === "string" ? String(legalAction.payload.breakerId) : undefined);
      executeEffectCommands(state, [
        { type: "change_breaker_strength", breakerId: String(legalAction.payload?.breakerId), amount: 1 }
      ]);
      return;
    case "break_subroutine":
      spendRunnerRunCredits(state, legalAction.costs[0]?.credits ?? 1, typeof legalAction.payload?.breakerId === "string" ? String(legalAction.payload.breakerId) : undefined);
      executeEffectCommands(state, [
        { type: "break_subroutine", subroutineIndex: Number(legalAction.payload?.subroutineIndex) }
      ]);
      return;
    case "continue_run":
      continueRun(state, legalAction);
      return;
    case "access_card":
      accessCurrentCard(state, legalAction);
      return;
    case "steal_agenda":
      stealAgenda(state, mustRun(state).accessedCardId ?? "");
      return;
    case "trash_accessed_card":
      trashAccessedCard(state, mustRun(state).accessedCardId ?? "");
      return;
    case "trash_resource":
      trashResource(state, String(legalAction.payload?.resourceId ?? legalAction.payload?.cardId ?? ""));
      return;
    case "decline_trash":
      declineCurrentAccess(state);
      return;
    case "remove_tag":
      spendClick(state, "runner");
      spendCredits(state, "runner", 2);
      state.runner.tags = Math.max(0, state.runner.tags - 1);
      return;
    case "purge_virus_counters": {
      spendClicks(state, "corp", 3);
      const purged = purgeVirusCounters(state);
      legalAction.payload = { ...(legalAction.payload ?? {}), purgedVirusCounters: purged, purgedCounterType: "virus" };
      return;
    }
    case "move_to_set_aside":
      moveToSpecialZone(state, legalAction, "set_aside");
      return;
    case "move_to_removed_from_game":
      moveToSpecialZone(state, legalAction, "removed_from_game");
      return;
    case "return_from_set_aside":
      returnFromSetAside(state, legalAction);
      return;
    case "change_card_control":
      changeCardControl(state, legalAction);
      return;
    case "resolve_choice":
      resolvePendingChoice(state, legalAction, playerAction);
      return;
    case "end_turn":
      endTurn(state, legalAction.side);
      return;
    case "trigger_ability":
      throw new Error("Generische Abilities sind vorbereitet, aber in V0.93 nicht sichtbar freigeschaltet.");
  }
}

function playRunnerEvent(state: GameState, legalAction: LegalAction): void {
  spendClick(state, "runner");
  spendCredits(state, "runner", legalAction.costs[0]?.credits ?? 0);
  const cardId = String(legalAction.payload?.cardId);
  const definition = definitionFor(state, cardId);
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, zone: { side: "runner", zone: "heap" } };
  const resolver = RUNNER_EVENT_RESOLVERS[definition.id];
  if (!resolver) throw new Error(`Kein Event-Resolver fuer ${definition.id}.`);
  resolver.resolve(state, legalAction);
}

function resolveMitWestTier(state: GameState, legalAction: LegalAction): void {
  const cardId = String(legalAction.payload?.cardId);
  removeFromAllZones(state, cardId);
  const specialZones = ensureSpecialZones(state);
  specialZones.removedFromGame.push(cardId);
  specialZones.removedFromGame.sort();
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    zone: { side: "special", zone: "removed_from_game", visibility: "public" }
  };

  const allIds = [...state.runner.grip, ...state.runner.heap, ...state.runner.stack].filter((id) => id !== cardId);
  state.runner.grip = [];
  state.runner.heap = [];
  state.runner.stack = shuffleStateIds(state, allIds, `onr_v1_101_mit_west_tier:${state.stateVersion + 1}`);
  for (const id of state.runner.stack) {
    state.cardInstances[id] = { ...mustInstance(state.cardInstances, id), zone: { side: "runner", zone: "stack" } };
  }
  drawRunnerCards(state, 5);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "mit_west_tier_shuffle_grip_heap_stack",
    specialZone: "removed_from_game",
    specialZoneVisibility: "public",
    specialZoneReason: "onr_v1_101_mit_west_tier"
  };
}

function installCard(state: GameState, legalAction: LegalAction): void {
  const cardId = String(legalAction.payload?.cardId);
  const definition = definitionFor(state, cardId);
  if (isUniqueCard(definition) && hasInstalledUniqueCardDefinition(state, legalAction.side, definition.id)) {
    throw new Error("Eine Unique-Karte mit diesem Namen ist bereits installiert.");
  }
  spendClick(state, legalAction.side);
  if (legalAction.side === "runner") {
    const hostOnCardId = typeof legalAction.payload?.hostOnCardId === "string" ? String(legalAction.payload.hostOnCardId) : undefined;
    if (definition.type !== "program" && hostOnCardId) {
      throw new Error("Nur Programme koennen gehostet installiert werden.");
    }
    if (definition.type === "program" && hostOnCardId && !state.runner.rig.programs.includes(hostOnCardId)) {
      throw new Error("Der angegebene Host ist nicht installiert.");
    }
    if (definition.type === "program" && hostOnCardId && !canHostProgramOnDaemon(state, hostOnCardId, definition)) {
      throw new Error("Der angegebene Daemon-Host hat nicht genug freie MU.");
    }
    spendRunnerInstallCredits(state, definition.installCost ?? 0, definition.type);
    removeFromAllZones(state, cardId);
    if (definition.type === "hardware") {
      state.runner.rig.hardware.push(cardId);
      if (definition.mechanics.includes("modify_memory_limit")) state.runner.memoryLimit += definition.memoryLimitBonus ?? 1;
      if ((definition.recurringCredits ?? 0) > 0) setCardCounter(state, cardId, "recurring_credit", definition.recurringCredits ?? 0);
    } else if (definition.type === "program") {
      state.runner.rig.programs.push(cardId);
      if (!hostOnCardId) state.runner.memoryUsed += definition.memoryCost ?? 0;
      if ((definition.recurringCredits ?? 0) > 0) setCardCounter(state, cardId, "recurring_credit", definition.recurringCredits ?? 0);
      if (definition.mechanics.includes("virus")) addCardCounter(state, cardId, "virus", 1);
    } else if (definition.type === "resource") {
      state.runner.rig.resources.push(cardId);
    } else {
      throw new Error("Nur Programme, Hardware und Resources koennen vom Runner installiert werden.");
    }
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "rig" },
      ...(hostOnCardId ? { hostedOn: hostOnCardId } : {})
    };
    if (definition.id === "v099_host_resource") startRunnerHostingChoice(state, cardId, legalAction);
    return;
  }

  removeFromAllZones(state, cardId);
  const placement = legalAction.payload?.placement;
  if (placement === "ice") {
    const server = legalAction.payload?.serverId === "new_remote" ? createRemote(state) : mustServer(state, String(legalAction.payload?.serverId));
    server.ice.unshift(cardId);
    state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: false, rezzed: false, zone: { side: "corp", zone: "serverIce", serverId: server.id } };
    return;
  }

  const server = legalAction.payload?.serverId === "new_remote" ? createRemote(state) : mustServer(state, String(legalAction.payload?.serverId));
  if (!canInstallCorpRootCardInServer(state, definition, server)) {
    throw new Error("In einem Außenserver darf nur eine Agenda oder ein Asset im Root installiert sein.");
  }
  server.root.push(cardId);
  const regionInstall = isRegionUpgrade(definition);
  if (regionInstall) {
    spendCredits(state, "corp", legalAction.costs[0]?.credits ?? rezCostForCard(state, cardId));
  }
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: regionInstall,
    rezzed: regionInstall,
    zone: { side: "corp", zone: "serverRoot", serverId: server.id }
  };
  if (regionInstall) {
    trashOlderRegionUpgradesInServer(state, server, cardId);
  }
}

function canInstallCorpRootCardInServer(state: GameState, definition: CardDefinition, server: CorpServer): boolean {
  if (server.kind !== "remote") return false;
  if (definition.type === "upgrade") return true;
  if (definition.type !== "agenda" && definition.type !== "asset") return false;
  return !server.root.some((id) => {
    const installedType = definitionFor(state, id).type;
    return installedType === "agenda" || installedType === "asset";
  });
}

function startRun(state: GameState, serverId: Exclude<ServerId, "new_remote">, pendingSuccessBonusCredits?: number, accessCount = 1): void {
  const server = mustServer(state, serverId);
  state.phase = "run";
  state.activeSide = "runner";
  state.run = {
    runId: `run_${state.stateVersion + 1}`,
    attackedServerId: server.id,
    phase: "approach_ice",
    position: server.ice.length > 0 ? { kind: "ice", serverId: server.id, iceIndex: 0 } : { kind: "server", serverId: server.id },
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    successful: false,
    accessCount: Math.max(1, Math.floor(accessCount)),
    ...(isV099OrLater(state) ? { badPublicityCredits: state.corp.badPublicity } : {}),
    ...(pendingSuccessBonusCredits ? { pendingSuccessBonusCredits } : {})
  };
  if (server.ice.length > 0) {
    const approachedIceId = mustArrayValue(server.ice, 0, "Server has no approached ice.");
    state.run.approachedIceId = approachedIceId;
    approachOrEncounterIce(state, approachedIceId);
  } else {
    enterAccess(state);
  }
}

function rezCard(state: GameState, cardId: string, rootRez: boolean): void {
  const definition = definitionFor(state, cardId);
  spendCredits(state, "corp", rezCostForCard(state, cardId));
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), rezzed: true, faceup: true };
  if (rootRez && CORP_ROOT_REZ_RESOLVERS[definition.id]) {
    CORP_ROOT_REZ_RESOLVERS[definition.id]?.resolve(state);
    return;
  }
  if (rootRez) return;
  const run = mustRun(state);
  run.phase = "encounter_ice";
  run.encounteredIceId = cardId;
  run.brokenSubroutineIndexes = [];
  run.resolvedSubroutineIndexes = [];
  state.timingPoint = "run.encounter_ice";
  state.activeSide = "runner";
}

function passApproachedIce(state: GameState): void {
  const run = mustRun(state);
  if (!run.approachedIceId) throw new Error("Kein ICE wird approached.");
  const ice = mustInstance(state.cardInstances, run.approachedIceId);
  if (ice.rezzed) {
    run.phase = "encounter_ice";
    run.encounteredIceId = run.approachedIceId;
    run.brokenSubroutineIndexes = [];
    run.resolvedSubroutineIndexes = [];
    state.timingPoint = "run.encounter_ice";
    state.activeSide = "runner";
    return;
  }
  movePastCurrentIce(state);
}

function approachOrEncounterIce(state: GameState, approachedIceId: CardInstanceId): void {
  const run = mustRun(state);
  const ice = mustInstance(state.cardInstances, approachedIceId);
  run.approachedIceId = approachedIceId;
  if (ice.rezzed) {
    run.phase = "encounter_ice";
    run.encounteredIceId = approachedIceId;
    run.brokenSubroutineIndexes = [];
    run.resolvedSubroutineIndexes = [];
    state.timingPoint = "run.encounter_ice";
    state.activeSide = "runner";
    return;
  }
  const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } = run;
  void _encounteredIceId;
  state.run = { ...runWithoutEncounter, phase: "approach_ice", approachedIceId };
  state.timingPoint = "run.approach_ice";
  state.activeSide = "corp";
}

function continueRun(state: GameState, legalAction?: LegalAction): void {
  const run = mustRun(state);
  if (run.phase === "movement") {
    continueFromMovement(state);
    return;
  }
  if (run.phase !== "encounter_ice" || !run.encounteredIceId) {
    if (run.phase === "access") {
      finishRun(state, true);
      return;
    }
    throw new Error("Run kann in diesem Schritt nicht fortgesetzt werden.");
  }
  const definition = definitionFor(state, run.encounteredIceId);
  let ended = false;
  const damageSummaries: DamageSummary[] = [];
  const subroutines = definition.subroutines ?? [];
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (!subroutine || state.winner || run.brokenSubroutineIndexes.includes(index) || run.resolvedSubroutineIndexes.includes(index) || ended) continue;
    if (subroutine.type === "corp_gain_credit") state.corp.credits += subroutine.amount ?? 1;
    if (subroutine.type === "runner_lose_credits") state.runner.credits = Math.max(0, state.runner.credits - (subroutine.amount ?? 1));
    if (subroutine.type === "give_runner_tag") state.runner.tags += subroutine.amount ?? 1;
    if (subroutine.type === "initiate_trace") {
      startTraceFromSubroutine(state, run.encounteredIceId, index, subroutine, legalAction);
      return;
    }
    if (subroutine.type === "do_damage") {
      const damageType = subroutine.damageType ?? "net";
      const summary = doDamage(state, {
        damageId: `${run.runId}.${run.encounteredIceId}.${index}`,
        damageType,
        amount: subroutine.amount ?? 1,
        source: `subroutine:${definition.id}:${subroutine.id}`
      });
      damageSummaries.push(summary);
      if (legalAction) {
        setDamagePayload(legalAction, aggregateDamageSummaries(damageSummaries));
      }
      if (state.winner) return;
    }
    if (subroutine.type === "trash_installed_program") {
      const targetProgramId = pickRunnerProgramForUninstall(state);
      if (targetProgramId) trashRunnerInstalledProgram(state, targetProgramId);
    }
    if (subroutine.type === "end_the_run") ended = true;
  }
  if (state.winner) return;
  resetBreakerStrength(state);
  if (ended) {
    finishRun(state, false);
    return;
  }
  movePastCurrentIce(state);
}

function startTraceFromSubroutine(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
  subroutineIndex: number,
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  legalAction?: LegalAction
): void {
  if (state.trace || state.pendingChoice) throw new Error("Es ist bereits ein Trace oder eine Choice offen.");
  const baseTraceStrength = subroutine.baseTraceStrength ?? subroutine.amount ?? 0;
  if (!Number.isInteger(baseTraceStrength) || baseTraceStrength < 0) throw new Error("Trace strength ist ungueltig.");
  const successEffect = subroutine.traceSuccessEffect;
  if (!successEffect || successEffect.type !== "add_tag" || successEffect.amount !== 1) throw new Error("Dieser Trace-Effekt ist in V0.96 nicht freigegeben.");

  const run = mustRun(state);
  if (!run.resolvedSubroutineIndexes.includes(subroutineIndex)) run.resolvedSubroutineIndexes.push(subroutineIndex);
  const sourceDefinition = definitionFor(state, sourceCardInstanceId);
  const traceId = `${run.runId}.${sourceCardInstanceId}.${subroutineIndex}.trace`;
  state.trace = {
    traceId,
    sourceCardInstanceId,
    sourceDefinitionId: sourceDefinition.id,
    subroutineIndex,
    baseTraceStrength,
    status: "corp_bid",
    successEffect
  };
  state.pendingChoice = traceBidChoice(state, "corp", traceId, `Korp Trace-Bid wählen (Base Trace ${baseTraceStrength})`, state.corp.credits);
  state.activeSide = "corp";
  state.timingPoint = "run.encounter_ice";
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceStarted: true,
      traceId,
      sourceCardId: sourceCardInstanceId,
      sourceDefinitionId: sourceDefinition.id,
      baseTraceStrength
    };
  }
}

function traceBidChoice(
  state: GameState,
  side: Side,
  traceId: string,
  prompt: string,
  maxBid: number
): ChoiceRequest {
  const boundedMax = Math.max(0, Math.floor(maxBid));
  return {
    choiceId: `${traceId}.${side}.bid.${state.stateVersion + 1}`,
    side,
    source: `trace:${traceId}`,
    prompt,
    kind: "bid_amount",
    options: Array.from({ length: boundedMax + 1 }, (_, amount) => ({
      id: `bid_${amount}`,
      label: `${amount} Credits`,
      publicLabel: `${amount} Credits`,
      value: amount
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public"
  };
}

function movePastCurrentIce(state: GameState): void {
  const run = mustRun(state);
  if (run.position.kind !== "ice") throw new Error("Runner ist nicht an ICE positioniert.");
  const server = mustServer(state, run.position.serverId);
  const nextIndex = run.position.iceIndex + 1;
  if (nextIndex < server.ice.length) {
    const approachedIceId = mustArrayValue(server.ice, nextIndex, "Naechstes ICE fehlt.");
    if (isV097OrLater(state)) {
      const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } = run;
      void _encounteredIceId;
      state.run = {
        ...runWithoutEncounter,
        phase: "movement",
        position: { kind: "ice", serverId: server.id, iceIndex: nextIndex },
        approachedIceId,
        brokenSubroutineIndexes: [],
        resolvedSubroutineIndexes: []
      };
      state.timingPoint = "run.jack_out_window";
      state.activeSide = "runner";
      return;
    }
    state.run = {
      ...run,
      phase: "approach_ice",
      position: { kind: "ice", serverId: server.id, iceIndex: nextIndex },
      approachedIceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: []
    };
    approachOrEncounterIce(state, approachedIceId);
    return;
  }
  if (isV097OrLater(state)) {
    const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } = run;
    void _encounteredIceId;
    state.run = { ...runWithoutEncounter, position: { kind: "server", serverId: server.id }, phase: "movement" };
    state.timingPoint = "run.jack_out_window";
    state.activeSide = "runner";
    return;
  }
  state.run = { ...run, position: { kind: "server", serverId: server.id }, phase: "access" };
  enterAccess(state);
}

function continueFromMovement(state: GameState): void {
  const run = mustRun(state);
  if (run.position.kind === "ice") {
    const server = mustServer(state, run.position.serverId);
    const approachedIceId = run.approachedIceId ?? mustArrayValue(server.ice, run.position.iceIndex, "Naechstes ICE fehlt.");
    state.run = { ...run, phase: "approach_ice", approachedIceId };
    approachOrEncounterIce(state, approachedIceId);
    return;
  }
  enterAccess(state);
}

function enterAccess(state: GameState): void {
  const run = mustRun(state);
  if (isV097OrLater(state)) {
    const breach = buildBreachState(state, run);
    if (breach.queue.length === 0) {
      finishRun(state, true);
      return;
    }
    const { accessedCardId: _accessedCardId, ...runWithoutAccessedCard } = run;
    void _accessedCardId;
    state.run = { ...runWithoutAccessedCard, phase: "access", successful: true, breach };
  } else {
    state.run = { ...run, phase: "access", successful: true };
  }
  state.timingPoint = "access.resolve_card";
  state.activeSide = "runner";
}

function buildBreachState(state: GameState, run: ActiveRun): ActiveBreach {
  const server = mustServer(state, run.attackedServerId);
  const accessCount = Math.max(1, run.accessCount ?? 1);
  const queueIds = accessQueueIds(state, server, run, accessCount);
  return {
    breachId: `${run.runId}.breach`,
    serverId: server.id,
    accessMode: accessCount > 1 ? "multi" : "single",
    queue: queueIds.map((cardId, index) => ({
      entryId: `${run.runId}.breach.${index}`,
      cardInstanceId: cardId,
      serverId: server.id,
      zone: accessQueueZone(server.id),
      status: "pending",
      hiddenInfo: isBreachEntryHidden(state, cardId)
    })),
    currentIndex: 0,
    completed: false,
    accessedSummaries: []
  };
}

function accessQueueIds(state: GameState, server: CorpServer, run: ActiveRun, accessCount: number): CardInstanceId[] {
  if (server.id === "rd") return state.corp.rd.slice(0, Math.min(accessCount, state.corp.rd.length));
  if (server.id === "hq") return randomHqAccessQueue(state, run.runId, accessCount);
  if (server.id === "archives") return state.corp.archives.slice();
  return server.root.slice();
}

function accessQueueZone(serverId: Exclude<ServerId, "new_remote">): ActiveBreach["queue"][number]["zone"] {
  if (serverId === "rd") return "rd";
  if (serverId === "hq") return "hq";
  if (serverId === "archives") return "archives";
  return "remote_root";
}

function isBreachEntryHidden(state: GameState, cardId: CardInstanceId): boolean {
  const instance = mustInstance(state.cardInstances, cardId);
  if (state.corp.archives.includes(cardId)) return !instance.faceup;
  return !instance.rezzed && !instance.faceup;
}

function randomHqAccessQueue(state: GameState, runId: string, accessCount: number): CardInstanceId[] {
  const available = state.corp.hq.slice();
  const selected: CardInstanceId[] = [];
  const limit = Math.min(accessCount, available.length);
  for (let index = 0; index < limit; index += 1) {
    const value = nextRandom(state, `hq_multiaccess:${runId}:selection:${index}`);
    const selectedIndex = Math.floor(value * available.length);
    const cardId = mustArrayValue(available, selectedIndex, "HQ access selection missing.");
    available.splice(selectedIndex, 1);
    selected.push(cardId);
  }
  return selected;
}

function accessCurrentCard(state: GameState, legalAction: LegalAction): void {
  const run = mustRun(state);
  if (run.breach) {
    const breach = run.breach;
    const entry = breach.queue[breach.currentIndex];
    if (!entry || entry.status !== "pending") {
      finishRun(state, true);
      return;
    }
    const cardId = entry.cardInstanceId;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessedCardId: cardId,
      serverId: breach.serverId,
      breachId: breach.breachId,
      accessIndex: breach.currentIndex
    };
    const updatedQueue = breach.queue.map((candidate, index) => (index === breach.currentIndex ? { ...candidate, status: "accessed" as const } : candidate));
    state.run = {
      ...run,
      accessedCardId: cardId,
      breach: {
        ...breach,
        queue: updatedQueue
      }
    };
    const instance = mustInstance(state.cardInstances, cardId);
    state.cardInstances[cardId] = { ...instance, faceup: true };
    const definition = definitionFor(state, cardId);
    if (definition.type !== "agenda" && definition.type !== "asset" && definition.type !== "upgrade") {
      completeCurrentBreachAccess(state, "accessed");
    }
    return;
  }
  const server = mustServer(state, run.attackedServerId);
  let cardId: string | undefined;
  if (server.id === "rd") cardId = state.corp.rd[0];
  else if (server.id === "hq") cardId = randomHqAccess(state);
  else if (server.id === "archives") cardId = state.corp.archives[0];
  else cardId = server.root[0];
  if (!cardId) {
    finishRun(state, true);
    return;
  }
  legalAction.payload = { ...(legalAction.payload ?? {}), accessedCardId: cardId, serverId: server.id };
  state.run = { ...run, accessedCardId: cardId };
  const instance = mustInstance(state.cardInstances, cardId);
  state.cardInstances[cardId] = { ...instance, faceup: true };
  const definition = definitionFor(state, cardId);
  if (definition.type !== "agenda" && definition.type !== "asset" && definition.type !== "upgrade") {
    finishRun(state, true);
  }
}

function stealAgenda(state: GameState, cardId: string): void {
  if (!cardId) throw new Error("Keine Agenda wird accessed.");
  ensureRunnerTurnFlags(state).stoleAgendaThisTurn = true;
  removeFromAllZones(state, cardId);
  state.runner.scoreArea.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "runner", zone: "scoreArea" } };
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "stolen");
    return;
  }
  finishRun(state, true);
}

function trashAccessedCard(state: GameState, cardId: string): void {
  const definition = definitionFor(state, cardId);
  spendCredits(state, "runner", definition.trashCost ?? 0);
  const sourceZone = mustInstance(state.cardInstances, cardId).zone;
  if (sourceZone.side === "corp" && sourceZone.zone === "archives") {
    state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "corp", zone: "archives" } };
    if (state.run?.breach) {
      completeCurrentBreachAccess(state, "trashed");
      return;
    }
    finishRun(state, true);
    return;
  }
  removeFromAllZones(state, cardId);
  state.corp.archives.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "corp", zone: "archives" } };
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "trashed");
    return;
  }
  finishRun(state, true);
}

function declineCurrentAccess(state: GameState): void {
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "declined");
    return;
  }
  finishRun(state, true);
}

function completeCurrentBreachAccess(state: GameState, status: BreachEntryStatus): void {
  const run = mustRun(state);
  const breach = run.breach;
  if (!breach) {
    finishRun(state, true);
    return;
  }
  const current = breach.queue[breach.currentIndex];
  if (!current) {
    finishRun(state, true);
    return;
  }
  const finalStatus: BreachEntryStatus = status === "pending" ? "accessed" : status;
  const queue = breach.queue.map((entry, index) => (index === breach.currentIndex ? { ...entry, status: finalStatus } : entry));
  const nextIndex = queue.findIndex((entry, index) => index > breach.currentIndex && entry.status === "pending");
  const accessedSummaries = [
    ...breach.accessedSummaries,
    {
      entryId: current.entryId,
      status: finalStatus,
      cardDefinitionId: definitionFor(state, current.cardInstanceId).id
    }
  ];
  const { accessedCardId: _accessedCardId, ...runWithoutAccessedCard } = run;
  void _accessedCardId;
  if (nextIndex === -1) {
    state.run = {
      ...runWithoutAccessedCard,
      breach: {
        ...breach,
        queue,
        completed: true,
        accessedSummaries
      }
    };
    finishRun(state, true);
    return;
  }
  state.run = {
    ...runWithoutAccessedCard,
    breach: {
      ...breach,
      queue,
      currentIndex: nextIndex,
      accessedSummaries
    }
  };
  state.timingPoint = "access.resolve_card";
  state.activeSide = "runner";
}

function trashResource(state: GameState, cardId: string): void {
  if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
  if (!state.runner.rig.resources.includes(cardId)) throw new Error("Diese Resource ist nicht installiert.");
  const definition = definitionFor(state, cardId);
  if (definition.type !== "resource") throw new Error("Nur installierte Resources koennen getrasht werden.");
  spendClick(state, "corp");
  spendCredits(state, "corp", 2);
  trashRunnerInstalledCardToHeap(state, cardId);
}

function pickRunnerProgramForUninstall(state: GameState): CardInstanceId | undefined {
  return state.runner.rig.programs
    .slice()
    .sort((left, right) => {
      const leftDefinition = definitionFor(state, left);
      const rightDefinition = definitionFor(state, right);
      const byInstallCost = (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
      if (byInstallCost !== 0) return byInstallCost;
      const byMemoryCost = (rightDefinition.memoryCost ?? 0) - (leftDefinition.memoryCost ?? 0);
      if (byMemoryCost !== 0) return byMemoryCost;
      return left.localeCompare(right);
    })[0];
}

function trashRunnerInstalledProgram(state: GameState, cardId: CardInstanceId): void {
  if (!state.runner.rig.programs.includes(cardId)) return;
  const hostedIds = hostedCardsOn(state, cardId);
  for (const hostedId of hostedIds) trashRunnerInstalledProgram(state, hostedId);
  const definition = definitionFor(state, cardId);
  const instance = mustInstance(state.cardInstances, cardId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  if (runnerProgramUsesMemory(state, cardId)) {
    state.runner.memoryUsed = Math.max(0, state.runner.memoryUsed - (definition.memoryCost ?? 0));
  }
  state.cardInstances[cardId] = { ...withoutHost, faceup: true, rezzed: true, zone: { side: "runner", zone: "heap" } };
}

function runnerProgramUsesMemory(state: GameState, cardId: CardInstanceId): boolean {
  const instance = mustInstance(state.cardInstances, cardId);
  if (!instance.hostedOn) return true;
  const hostDefinition = definitionFor(state, instance.hostedOn);
  if (hostDefinition.type === "program" && cardHasSubtype(hostDefinition, "daemon")) return false;
  return true;
}

function trashRunnerInstalledCardToHeap(state: GameState, cardId: CardInstanceId): void {
  const definition = definitionFor(state, cardId);
  if (definition.type === "program") {
    trashRunnerInstalledProgram(state, cardId);
    return;
  }
  if (definition.type !== "hardware" && definition.type !== "resource") return;
  const rig = definition.type === "hardware" ? state.runner.rig.hardware : state.runner.rig.resources;
  if (!rig.includes(cardId)) return;
  for (const hostedId of hostedCardsOn(state, cardId)) {
    const hostedDefinition = definitionFor(state, hostedId);
    if (hostedDefinition.type === "program") trashRunnerInstalledProgram(state, hostedId);
  }
  const instance = mustInstance(state.cardInstances, cardId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = { ...withoutHost, faceup: true, rezzed: true, zone: { side: "runner", zone: "heap" } };
}

function trashCorpInstalledCardToArchives(state: GameState, cardId: CardInstanceId): void {
  const instance = mustInstance(state.cardInstances, cardId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  removeFromAllZones(state, cardId);
  state.corp.archives.push(cardId);
  state.cardInstances[cardId] = { ...withoutHost, faceup: true, rezzed: true, zone: { side: "corp", zone: "archives" } };
}

function trashOlderRegionUpgradesInServer(state: GameState, server: CorpServer, keepCardId: CardInstanceId): void {
  const olderRegions = server.root
    .filter((cardId) => cardId !== keepCardId)
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return definition.type === "upgrade" && cardHasSubtype(definition, "region");
    })
    .sort();
  for (const cardId of olderRegions) trashCorpInstalledCardToArchives(state, cardId);
}

function tokyoChibaUnsuccessfulRunBonus(state: GameState, run: GameState["run"], successful: boolean): number {
  if (!run || successful) return 0;
  const attackedServer = state.corp.servers.find((server) => server.id === run.attackedServerId);
  if (!attackedServer) return 0;
  return attackedServer.root.reduce((sum, cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    if (!instance.rezzed) return sum;
    return definitionFor(state, cardId).id === "onr_v1_371_tokyo-chiba-infighting" ? sum + 1 : sum;
  }, 0);
}

function finishRun(state: GameState, successful: boolean): void {
  const run = state.run;
  const bonus = successful ? run?.pendingSuccessBonusCredits ?? 0 : 0;
  const corpBonus = tokyoChibaUnsuccessfulRunBonus(state, run, successful);
  state.runner.credits += bonus;
  state.corp.credits += corpBonus;
  resetBreakerStrength(state);
  delete state.run;
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.activeSide = "runner";
  cleanupEmptyRemotes(state);
}

function endTurn(state: GameState, side: Side): void {
  if (side === "runner") {
    const flags = ensureRunnerTurnFlags(state);
    flags.stoleAgendaLastTurn = flags.stoleAgendaThisTurn;
    flags.stoleAgendaThisTurn = false;
  }
  startDiscardPhase(state, side);
}

function startDiscardPhase(state: GameState, side: Side): void {
  state.activeSide = side;
  if (side === "runner") {
    state.phase = "runner_discard_phase";
    state.timingPoint = "runner_discard.flatline_check";
    if (maxHandSize(state, "runner") < 0) {
      state.winner = "corp";
      state.gameEndReason = "flatline";
      state.phase = "game_over";
      state.timingPoint = "game.checkpoint";
      delete state.pendingChoice;
      delete state.run;
      return;
    }
    processDiscardStep(state, "runner");
    return;
  }

  state.phase = "corp_discard_phase";
  state.timingPoint = "corp_discard.select_cards";
  processDiscardStep(state, "corp");
}

function processDiscardStep(state: GameState, side: Side): void {
  const hand = handForSide(state, side);
  const requiredDiscardCount = hand.length - maxHandSize(state, side);
  if (requiredDiscardCount <= 0) {
    completeDiscardPhase(state, side);
    return;
  }
  state.timingPoint = side === "corp" ? "corp_discard.select_cards" : "runner_discard.select_cards";
  state.pendingChoice = discardChoice(state, side, requiredDiscardCount, state.stateVersion + 1);
}

function completeDiscardPhase(state: GameState, side: Side): void {
  if (side === "runner") {
    startCorpTurn(state);
    return;
  }
  startRunnerTurn(state);
}

function startCorpTurn(state: GameState): void {
  state.activeSide = "corp";
  state.phase = "corp_draw_phase";
  state.timingPoint = "corp_draw.mandatory_draw";
  state.corp.clicks = 3;
  state.runner.clicks = 0;
  ensureRunnerTurnFlags(state).damagePreventionUsage = {};
}

function startRunnerTurn(state: GameState): void {
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 4;
  state.corp.clicks = 0;
  const flags = ensureRunnerTurnFlags(state);
  flags.stoleAgendaThisTurn = false;
  flags.stoleAgendaLastTurn = false;
  flags.damagePreventionUsage = {};
  refreshRecurringCredits(state, "runner");
  applyRunnerStartOfTurnEffects(state);
}

function applyRunnerStartOfTurnEffects(state: GameState): void {
  for (const cardId of state.runner.rig.resources) {
    const definition = definitionFor(state, cardId);
    if (definition.id === "onr_v1_163_floating-runner-bbs") credits(state, "runner", 1);
  }
  for (const cardId of state.runner.rig.resources.slice().sort()) {
    if (state.pendingChoice) break;
    const definition = definitionFor(state, cardId);
    if (definition.id === "onr_v1_180_smiths-pawnshop") startSmithsPawnshopChoice(state, cardId);
  }
}

function startSmithsPawnshopChoice(state: GameState, pawnshopId: CardInstanceId): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (!state.runner.rig.resources.includes(pawnshopId)) return;
  const eligible = runnerInstalledCardIds(state)
    .filter((cardId) => cardId !== pawnshopId)
    .sort();
  if (eligible.length === 0) return;
  state.pendingChoice = {
    choiceId: `v170_smiths_pawnshop_${state.stateVersion + 1}`,
    side: "runner",
    source: `v170.smiths_pawnshop:${pawnshopId}:${state.stateVersion + 1}`,
    prompt: "Smith's Pawnshop: Eine andere installierte Karte trashen und 1 Credit nehmen?",
    kind: "select_option",
    options: [
      { id: "pass", label: "Nein" },
      ...eligible.map((cardId) => ({ id: `card_${cardId}`, label: definitionFor(state, cardId).title, value: cardId }))
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public"
  };
}

function handForSide(state: GameState, side: Side): CardInstanceId[] {
  return side === "corp" ? state.corp.hq : state.runner.grip;
}

function maxHandSize(state: GameState, side: Side): number {
  if (side === "corp") return state.corp.maxHandSize;
  return state.runner.maxHandSize - state.runner.coreDamage;
}

function drawCorpCard(state: GameState): void {
  const cardId = state.corp.rd.shift();
  if (!cardId) {
    state.winner = "runner";
    state.gameEndReason = "corp_deck_empty";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    return;
  }
  state.corp.hq.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), zone: { side: "corp", zone: "hq" } };
}

function drawCorpCards(state: GameState, amount: number): void {
  for (let index = 0; index < amount; index += 1) drawCorpCard(state);
}

function drawRunnerCard(state: GameState): void {
  const cardId = state.runner.stack.shift();
  if (!cardId) return;
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), zone: { side: "runner", zone: "grip" } };
}

function drawRunnerCards(state: GameState, amount: number): void {
  for (let index = 0; index < amount; index += 1) drawRunnerCard(state);
}

function doDamage(
  state: GameState,
  request: {
    damageId: string;
    damageType: DamageType;
    amount: number;
    source: string;
  }
): DamageSummary {
  assertPositiveIntegerAmount(request.amount);
  if (request.amount > state.runner.grip.length) {
    state.winner = "corp";
    state.gameEndReason = "flatline";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    state.activeSide = "corp";
    delete state.run;
    return { damageType: request.damageType, amount: request.amount, cardsTrashed: 0, flatline: true };
  }

  const available = state.runner.grip.slice();
  const selected: CardInstanceId[] = [];
  for (let index = 0; index < request.amount; index += 1) {
    const value = nextRandom(state, `damage:${request.damageId}:${request.damageType}:${request.source}:${request.amount}:selection:${index}`);
    const selectedIndex = Math.floor(value * available.length);
    const cardId = mustArrayValue(available, selectedIndex, "Damage-Auswahl fehlt.");
    available.splice(selectedIndex, 1);
    selected.push(cardId);
  }

  for (const cardId of selected) {
    removeFromAllZones(state, cardId);
    state.runner.heap.push(cardId);
    state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "runner", zone: "heap" } };
  }

  if (request.damageType === "core") state.runner.coreDamage += request.amount;

  return {
    damageType: request.damageType,
    amount: request.amount,
    cardsTrashed: selected.length,
    flatline: false,
    ...(request.damageType === "core"
      ? {
          coreDamageAfter: state.runner.coreDamage,
          runnerMaxHandSizeAfter: maxHandSize(state, "runner")
        }
      : {})
  };
}

function aggregateDamageSummaries(summaries: DamageSummary[]): DamageSummary {
  const first = mustArrayValue(summaries, 0, "Damage-Zusammenfassung fehlt.");
  const lastCoreSummary = summaries
    .slice()
    .reverse()
    .find((summary) => summary.coreDamageAfter !== undefined || summary.runnerMaxHandSizeAfter !== undefined);
  return {
    damageType: first.damageType,
    amount: summaries.reduce((total, summary) => total + summary.amount, 0),
    cardsTrashed: summaries.reduce((total, summary) => total + summary.cardsTrashed, 0),
    flatline: summaries.some((summary) => summary.flatline),
    ...(lastCoreSummary?.coreDamageAfter !== undefined ? { coreDamageAfter: lastCoreSummary.coreDamageAfter } : {}),
    ...(lastCoreSummary?.runnerMaxHandSizeAfter !== undefined ? { runnerMaxHandSizeAfter: lastCoreSummary.runnerMaxHandSizeAfter } : {})
  };
}

function setDamagePayload(legalAction: LegalAction, summary: DamageSummary): void {
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    damageResolved: true,
    damageType: summary.damageType,
    damageAmount: summary.amount,
    cardsTrashed: summary.cardsTrashed,
    flatline: summary.flatline,
    ...(summary.coreDamageAfter !== undefined ? { coreDamageAfter: summary.coreDamageAfter } : {}),
    ...(summary.runnerMaxHandSizeAfter !== undefined ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter } : {})
  };
}

function resolveDamageOperation(state: GameState, legalAction: LegalAction, damageType: DamageType, amount: number, source: string): void {
  const request = {
    damageId: `${state.matchId}.${state.stateVersion}.${source}`,
    damageType,
    amount,
    source: `operation:${source}`
  };
  const event = createDamageImminentEvent(state, request);
  if (openReplacementWindow(state, event, legalAction)) return;
  if (openEventModificationWindow(state, event, legalAction)) return;
  const summary = resolveDamageImminentEvent(state, event);
  setDamagePayload(legalAction, summary);
}

function createDamageImminentEvent(
  state: GameState,
  request: {
    damageId: string;
    damageType: DamageType;
    amount: number;
    source: string;
  }
): ImminentEvent {
  return {
    eventId: `imminent_damage_${state.stateVersion + 1}_${sanitizeId(request.damageId)}`,
    eventType: "damage",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      damageId: request.damageId,
      damageType: request.damageType,
      amount: request.amount,
      source: request.source
    },
    visibility: "hidden_info_barrier",
    createdAtStateVersion: state.stateVersion + 1
  };
}

function openEventModificationWindow(state: GameState, event: ImminentEvent, legalAction: LegalAction): boolean {
  const candidates = collectEventModificationCandidates(state, event);
  if (candidates.length === 0) return false;
  const sorted = candidates.slice().sort(compareEventModificationCandidate);
  if (hasEventModificationConflict(sorted)) throw new Error("Event-Modification-Konflikt blockiert.");
  const candidate = sorted[0];
  if (!candidate) return false;
  const windowId = `v120_window_${event.eventId}`;
  const window: EventModificationWindow = {
    windowId,
    eventId: event.eventId,
    eventType: event.eventType,
    kind: candidate.kind,
    side: candidate.controller,
    candidates: sorted,
    createdAtStateVersion: state.stateVersion + 1,
    optional: candidate.optional
  };
  state.imminentEvent = { ...event, modificationWindowId: windowId };
  state.eventModificationWindow = window;
  state.pendingChoice = eventModificationChoice(window, state.imminentEvent, state.stateVersion + 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    eventModificationWindowOpened: true,
    eventModificationKind: window.kind,
    eventModificationWindowId: window.windowId,
    imminentEventId: event.eventId,
    imminentEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    candidateCount: window.candidates.length,
    redactedKind: "event_modification"
  };
  return true;
}

function collectEventModificationCandidates(state: GameState, event: ImminentEvent): EventModificationCandidate[] {
  if (event.eventType !== "damage") return [];
  const runtime = collectRuntimeDamagePreventionCandidates(state, event);
  const harness = collectHarnessDamagePreventionCandidates(state, event);
  return [...runtime, ...harness];
}

function collectRuntimeDamagePreventionCandidates(state: GameState, event: ImminentEvent): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (amount <= 0 || event.affectedSide !== "runner") return [];
  const installed = [...state.runner.rig.programs, ...state.runner.rig.hardware, ...state.runner.rig.resources];
  const candidates: EventModificationCandidate[] = [];
  for (const cardId of installed) {
    const definition = definitionFor(state, cardId);
    const profile = RUNTIME_DAMAGE_PREVENTION_PROFILES[definition.id];
    if (!profile || !profile.damageTypes.includes(damageType)) continue;
    const used = damagePreventionUsedThisTurn(state, cardId);
    const remaining = Math.max(0, profile.maxPerTurn - used);
    if (remaining <= 0) continue;
    const preventAmount = Math.min(amount, remaining);
    candidates.push({
      candidateId: `v161_damage_prevent_${sanitizeId(cardId)}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: "runner",
      sourceRef: {
        kind: "card",
        instanceId: cardId,
        definitionId: definition.id,
        label: definition.title
      },
      priority: profile.priority,
      visibility: "hidden_info_barrier",
      optional: true,
      preventAmount
    });
  }
  return candidates;
}

function collectHarnessDamagePreventionCandidates(state: GameState, event: ImminentEvent): EventModificationCandidate[] {
  const harness = state.eventModificationHarness?.damagePrevention;
  const amount = numberPayload(event, "amount");
  if (!harness || amount <= 0) return [];
  const preventAmount = Math.min(harness.preventAmount, amount);
  if (!Number.isInteger(preventAmount) || preventAmount <= 0) return [];
  return [
    {
      candidateId: `v120_damage_prevent_${sanitizeId(String(harness.sourceLabel ?? "test_harness"))}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: harness.side,
      sourceRef: {
        kind: "test_harness",
        label: harness.sourceLabel ?? "Test-only Damage Prevention"
      },
      priority: 100,
      visibility: harness.visibility ?? "hidden_info_barrier",
      optional: harness.optional ?? true,
      preventAmount
    }
  ];
}

function openReplacementWindow(state: GameState, event: ImminentEvent, legalAction: LegalAction): boolean {
  const candidates = collectReplacementCandidates(state, event).sort(compareReplacementCandidate);
  if (candidates.length === 0) return false;
  if (hasReplacementConflict(candidates)) throw new Error("Replacement-Konflikt blockiert.");
  const candidate = candidates[0];
  if (!candidate) return false;
  const windowId = `v121_window_${event.eventId}`;
  const window: ReplacementWindow = {
    windowId,
    originalEventId: event.eventId,
    eventType: event.eventType,
    candidates,
    consumedCandidateIds: [],
    createdAtStateVersion: state.stateVersion + 1,
    optional: candidate.optional
  };
  state.imminentEvent = { ...event, modificationWindowId: windowId };
  state.replacementWindow = window;
  state.pendingChoice = replacementChoice(window, state.imminentEvent, state.stateVersion + 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementWindowOpened: true,
    replacementWindowId: window.windowId,
    originalEventId: event.eventId,
    originalEventType: event.eventType,
    replacementCandidateCount: window.candidates.length,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "replacement"
  };
  return true;
}

function collectReplacementCandidates(state: GameState, event: ImminentEvent): ReplacementCandidate[] {
  if (event.eventType !== "damage") return [];
  const harness = state.eventModificationHarness?.damageReplacement;
  const amount = numberPayload(event, "amount");
  if (!harness || amount <= 0) return [];
  const base: ReplacementCandidate = {
    candidateId: `v121_damage_replace_${sanitizeId(String(harness.sourceLabel ?? "test_harness"))}_${harness.tagAmount}`,
    controller: harness.side,
    sourceRef: {
      kind: "test_harness",
      label: harness.sourceLabel ?? "Test-only Damage Replacement"
    },
    replacesEventType: "damage",
    replacementEventType: "add_tag",
    priority: harness.priority ?? 100,
    visibility: harness.visibility ?? "hidden_info_barrier",
    optional: harness.optional ?? true,
    tagAmount: harness.tagAmount
  };
  if (!state.eventModificationHarness?.damageReplacementConflict) return [base];
  return [
    base,
    {
      ...base,
      candidateId: `${base.candidateId}_conflict`,
      tagAmount: base.tagAmount ? base.tagAmount + 1 : 2
    }
  ];
}

function replacementChoice(window: ReplacementWindow, event: ImminentEvent, stateVersion: number): ChoiceRequest {
  const candidate = mustArrayValue(window.candidates, 0, "Replacement-Kandidat fehlt.");
  return {
    choiceId: `v121_choice_${window.windowId}`,
    side: candidate.controller,
    source: "v121.replacement.damage",
    prompt: "Damage Replacement",
    kind: "select_option",
    options: [
      { id: "pass", label: "Nicht ersetzen", publicLabel: "Replacement" },
      {
        id: candidate.candidateId,
        label: `Damage durch ${candidate.tagAmount ?? 1} Tag ersetzen`,
        publicLabel: "Replacement"
      }
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: candidate.visibility
  };
}

function eventModificationChoice(window: EventModificationWindow, event: ImminentEvent, stateVersion: number): ChoiceRequest {
  const candidate = mustArrayValue(window.candidates, 0, "Event-Modification-Kandidat fehlt.");
  const amount = numberPayload(event, "amount");
  const options = [
    { id: "pass", label: "Nicht verhindern", publicLabel: "Event Modification" },
    {
      id: candidate.candidateId,
      label:
        candidate.sourceRef.kind === "card"
          ? `${candidate.sourceRef.label}: ${candidate.preventAmount ?? amount} Schaden verhindern`
          : `${candidate.preventAmount ?? amount} Schaden verhindern`,
      publicLabel: "Event Modification"
    }
  ];
  return {
    choiceId: `v120_choice_${window.windowId}`,
    side: window.side,
    source: `v120.event_modification.${window.kind}`,
    prompt: "Damage Prevention",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: candidate.visibility
  };
}

function resolveEventModificationChoice(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const window = state.eventModificationWindow;
  const event = state.imminentEvent;
  if (!window || !event) throw new Error("Es ist kein Event-Modification-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (!selected) throw new Error("Es wurde keine Event-Modification-Option gewählt.");
  const basePayload = {
    ...(legalAction.payload ?? {}),
    eventModificationWindowId: window.windowId,
    eventModificationKind: window.kind,
    imminentEventId: event.eventId,
    imminentEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "event_modification"
  };
  if (selected === "pass") {
    const summary = resolveDamageImminentEvent(state, event);
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: "pass",
      eventModificationOutcome: "original_resolved",
      originalAmount: numberPayload(event, "amount")
    };
    setDamagePayload(legalAction, summary);
    clearEventModificationState(state);
    return;
  }
  const candidate = window.candidates.find((item) => item.candidateId === selected);
  if (!candidate) throw new Error("Dieser Event-Modification-Kandidat ist nicht legal.");
  if (candidate.eventId !== event.eventId || candidate.kind !== "prevent") throw new Error("Dieser Event-Modification-Kandidat passt nicht zum Fenster.");
  const originalAmount = numberPayload(event, "amount");
  const preventedAmount = Math.min(candidate.preventAmount ?? 0, originalAmount);
  const finalAmount = Math.max(0, originalAmount - preventedAmount);
  registerDamagePreventionUsage(state, candidate, preventedAmount);
  const summary = resolveDamageImminentEvent(state, {
    ...event,
    payload: { ...event.payload, amount: finalAmount }
  });
  legalAction.payload = {
    ...basePayload,
    eventModificationDecision: "apply",
    eventModificationOutcome: finalAmount === 0 ? "prevented" : "partially_prevented",
    candidateId: candidate.candidateId,
    originalAmount,
    preventedAmount,
    finalAmount,
    sourceKind: candidate.sourceRef.kind
  };
  setDamagePayload(legalAction, summary);
  clearEventModificationState(state);
}

function resolveReplacementChoice(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const window = state.replacementWindow;
  const event = state.imminentEvent;
  if (!window || !event) throw new Error("Es ist kein Replacement-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (!selected) throw new Error("Es wurde keine Replacement-Option gewählt.");
  const basePayload = {
    ...(legalAction.payload ?? {}),
    replacementWindowId: window.windowId,
    originalEventId: event.eventId,
    originalEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "replacement"
  };
  if (selected === "pass") {
    const summary = resolveDamageImminentEvent(state, event);
    legalAction.payload = {
      ...basePayload,
      replacementDecision: "pass",
      replacementOutcome: "original_resolved",
      originalAmount: numberPayload(event, "amount")
    };
    setDamagePayload(legalAction, summary);
    clearReplacementState(state);
    return;
  }
  const candidate = window.candidates.find((item) => item.candidateId === selected);
  if (!candidate) throw new Error("Dieser Replacement-Kandidat ist nicht legal.");
  if (window.consumedCandidateIds.includes(candidate.candidateId)) throw new Error("Dieser Replacement-Kandidat wurde in diesem Fenster bereits genutzt.");
  if (candidate.replacesEventType !== event.eventType || candidate.replacementEventType !== "add_tag") {
    throw new Error("Dieser Replacement-Kandidat passt nicht zum Originalevent.");
  }
  window.consumedCandidateIds.push(candidate.candidateId);
  const tagAmount = candidate.tagAmount ?? 1;
  state.runner.tags += tagAmount;
  legalAction.payload = {
    ...basePayload,
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "add_tag",
    originalAmount: numberPayload(event, "amount"),
    tagsAdded: tagAmount,
    sourceKind: candidate.sourceRef.kind
  };
  clearReplacementState(state);
}

function resolveDamageImminentEvent(state: GameState, event: ImminentEvent): DamageSummary {
  if (event.eventType !== "damage") throw new Error("Nur Damage-ImminentEvents sind in V1.2.0 auflösbar.");
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (amount <= 0) return { damageType, amount: 0, cardsTrashed: 0, flatline: false };
  return doDamage(state, {
    damageId: stringPayload(event, "damageId"),
    damageType,
    amount,
    source: stringPayload(event, "source")
  });
}

function clearEventModificationState(state: GameState): void {
  delete state.pendingChoice;
  delete state.eventModificationWindow;
  delete state.imminentEvent;
}

function clearReplacementState(state: GameState): void {
  delete state.pendingChoice;
  delete state.replacementWindow;
  delete state.imminentEvent;
}

function compareEventModificationCandidate(left: EventModificationCandidate, right: EventModificationCandidate): number {
  return left.priority - right.priority || left.controller.localeCompare(right.controller) || left.candidateId.localeCompare(right.candidateId);
}

function hasEventModificationConflict(candidates: EventModificationCandidate[]): boolean {
  if (candidates.length <= 1) return false;
  const first = candidates[0];
  return candidates.some((candidate) => candidate.priority === first?.priority && candidate.kind !== first.kind);
}

function compareReplacementCandidate(left: ReplacementCandidate, right: ReplacementCandidate): number {
  return (
    left.priority - right.priority ||
    left.controller.localeCompare(right.controller) ||
    (left.sourceRef.instanceId ?? "").localeCompare(right.sourceRef.instanceId ?? "") ||
    left.candidateId.localeCompare(right.candidateId)
  );
}

function hasReplacementConflict(candidates: ReplacementCandidate[]): boolean {
  if (candidates.length <= 1) return false;
  const first = candidates[0];
  return candidates.some(
    (candidate) =>
      candidate.priority === first?.priority &&
      (candidate.replacementEventType !== first.replacementEventType || candidate.tagAmount !== first.tagAmount || candidate.controller !== first.controller)
  );
}

function numberPayload(event: ImminentEvent, key: string): number {
  const value = event.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringPayload(event: ImminentEvent, key: string): string {
  const value = event.payload[key];
  return typeof value === "string" ? value : "";
}

function damageTypePayload(event: ImminentEvent): DamageType {
  const value = event.payload.damageType;
  return value === "meat" || value === "core" ? value : "net";
}

function damagePreventionUsedThisTurn(state: GameState, cardId: CardInstanceId): number {
  const flags = ensureRunnerTurnFlags(state);
  return flags.damagePreventionUsage?.[cardId] ?? 0;
}

function registerDamagePreventionUsage(state: GameState, candidate: EventModificationCandidate, preventedAmount: number): void {
  if (preventedAmount <= 0 || candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId) return;
  const flags = ensureRunnerTurnFlags(state);
  const usage = (flags.damagePreventionUsage ??= {});
  usage[candidate.sourceRef.instanceId] = (usage[candidate.sourceRef.instanceId] ?? 0) + preventedAmount;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 80);
}

function requireRunnerTagged(state: GameState): void {
  if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
}

function runnerStoleAgendaLastTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.stoleAgendaLastTurn === true;
}

function scoreAgenda(state: GameState, cardId: string, legalAction?: LegalAction): void {
  const definition = definitionFor(state, cardId);
  if (definition.type !== "agenda") throw new Error("Nur Agendas koennen gescored werden.");
  if (mustInstance(state.cardInstances, cardId).advancementCounters < (definition.advancementRequirement ?? 0)) throw new Error("Agenda hat nicht genug Advancements.");
  removeFromAllZones(state, cardId);
  state.corp.scoreArea.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "corp", zone: "scoreArea" } };
  if (definition.id === "onr_v1_203_hostile-takeover") {
    state.corp.credits += 5;
    if (legalAction) legalAction.payload = { ...(legalAction.payload ?? {}), onScoreGainCredits: 5, corpCreditsAfter: state.corp.credits };
  }
  if (definition.id === "onr_v1_212_priority-requisition") {
    const candidates = Object.entries(state.cardInstances)
      .filter(([, instance]) => instance.zone.side === "corp" && instance.zone.zone === "serverIce" && !instance.rezzed)
      .map(([instanceId]) => instanceId as CardInstanceId)
      .sort((left, right) => {
        const leftCost = definitionFor(state, left).rezCost ?? 0;
        const rightCost = definitionFor(state, right).rezCost ?? 0;
        return rightCost - leftCost || left.localeCompare(right);
      });
    const freeRezTarget = candidates[0];
    if (freeRezTarget) {
      state.cardInstances[freeRezTarget] = { ...mustInstance(state.cardInstances, freeRezTarget), faceup: true, rezzed: true };
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          priorityRequisitionFreeRez: true,
          priorityRequisitionTarget: freeRezTarget,
          priorityRequisitionTargetDefinitionId: definitionFor(state, freeRezTarget).id
        };
      }
    }
  }
  if (definition.id === "onr_v1_215_security-net-optimization" && legalAction) {
    legalAction.payload = { ...(legalAction.payload ?? {}), securityNetOptimizationActive: true };
  }
  cleanupEmptyRemotes(state);
}

function action(
  state: GameState,
  side: Side,
  type: ActionType,
  label: string,
  source: LegalAction["source"],
  costs: LegalAction["costs"] = [],
  payload?: LegalAction["payload"],
  metadata: Partial<Pick<LegalAction, "abilityRef" | "effectRef" | "choiceRequirements" | "targetRequirements">> = {}
): LegalAction {
  return {
    actionId: makeActionId(type, side, payload, source),
    side,
    type,
    label,
    source,
    timingPoint: state.timingPoint,
    costs,
    targetRequirements: metadata.targetRequirements ?? [],
    visibility: type.startsWith("rez") || type === "score_agenda" || type === "trash_resource" || (side === "runner" && type === "install_card") ? "public" : "private_to_actor",
    expiresAtStateVersion: state.stateVersion,
    ...(metadata.choiceRequirements ? { choiceRequirements: metadata.choiceRequirements } : {}),
    ...(metadata.abilityRef ? { abilityRef: metadata.abilityRef } : {}),
    ...(metadata.effectRef ? { effectRef: metadata.effectRef } : {}),
    ...(payload ? { payload } : {})
  };
}

function choiceAction(state: GameState, choice: ChoiceRequest): LegalAction {
  return action(
    state,
    choice.side,
    "resolve_choice",
    choice.prompt,
    "game_rule",
    [],
    { choiceId: choice.choiceId, choiceVisibility: choice.visibility, choiceKind: choice.kind },
    {
      choiceRequirements: [
        {
          choiceId: choice.choiceId,
          minSelections: choice.minSelections,
          maxSelections: choice.maxSelections,
          optionIds: choice.options.map((option) => option.id)
        }
      ]
    }
  );
}

function abilityMetadata(sourceCardInstanceId: CardInstanceId, abilityId: string, encounteredIceId?: CardInstanceId): Pick<LegalAction, "abilityRef" | "effectRef" | "targetRequirements"> {
  return {
    abilityRef: { sourceCardInstanceId, abilityId },
    effectRef: `effect.${abilityId}`,
    targetRequirements: [
      { id: "encounteredIce", kind: "card", visibility: "public" },
      { id: "subroutine", kind: "subroutine", ...(encounteredIceId ? { sourceIceRef: encounteredIceId } : {}) }
    ]
  };
}

function visibleChoice(choice: ChoiceRequest): NonNullable<PlayerView["pendingChoice"]> {
  return {
    choiceId: choice.choiceId,
    side: choice.side,
    source: choice.source,
    prompt: choice.prompt,
    kind: choice.kind,
    options: choice.options.map((option) => ({
      id: option.id,
      label: option.label,
      ...(option.publicLabel ? { publicLabel: option.publicLabel } : {}),
      ...(option.value !== undefined ? { value: option.value } : {})
    })),
    minSelections: choice.minSelections,
    maxSelections: choice.maxSelections,
    stateVersion: choice.stateVersion,
    visibility: choice.visibility
  };
}

function validateChoiceAction(choice: ChoiceRequest | undefined, legalAction: LegalAction, playerAction: PlayerAction): string | undefined {
  if (!choice) return legalAction.type === "resolve_choice" ? "Es ist keine Choice offen." : undefined;
  if (legalAction.type !== "resolve_choice") return "Solange eine Choice offen ist, sind keine anderen Aktionen legal.";
  if (playerAction.side !== choice.side) return "Diese Choice gehoert der anderen Seite.";
  if (choice.stateVersion !== playerAction.clientKnownStateVersion) return "Diese Choice gehoert zu einem anderen Spielzustand.";
  if (playerAction.selectedChoices?.choiceId !== choice.choiceId) return "Die ChoiceId ist ungueltig.";
  const selectedOptionIds = selectedChoiceIds(playerAction.selectedChoices);
  if (selectedOptionIds.length < choice.minSelections || selectedOptionIds.length > choice.maxSelections) return "Die Anzahl der gewaehlten Optionen ist ungueltig.";
  const optionIds = new Set(choice.options.map((option) => option.id));
  if (selectedOptionIds.some((id) => !optionIds.has(id))) return "Eine gewaehlte Option ist nicht legal.";
  if (new Set(selectedOptionIds).size !== selectedOptionIds.length) return "Eine Option wurde doppelt gewaehlt.";
  return undefined;
}

function selectedChoiceIds(selectedChoices: PlayerAction["selectedChoices"]): string[] {
  const raw =
    selectedChoices?.selectedOptionIds ??
    selectedChoices?.optionIds ??
    selectedChoices?.options ??
    selectedChoices?.selectedOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}

function resolvePendingChoice(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const choiceId = String(legalAction.payload?.choiceId ?? "");
  if (!state.pendingChoice || state.pendingChoice.choiceId !== choiceId) throw new Error("Diese Choice ist nicht offen.");
  if (state.pendingChoice.source === "setup.mulligan") {
    resolveSetupMulliganChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source === "discard_phase") {
    resolveDiscardChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v121.replacement")) {
    resolveReplacementChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v120.event_modification")) {
    resolveEventModificationChoice(state, legalAction, playerAction);
    return;
  }
  if (state.trace) {
    if (state.trace.status === "corp_bid") {
      resolveTraceCorpBid(state, legalAction, playerAction);
      return;
    }
    resolveTraceRunnerBid(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v098.search_stack")) {
    resolveRunnerStackSearchChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v098.arrange_stack_top2")) {
    resolveRunnerStackArrangeChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v099.host_program")) {
    resolveRunnerHostingChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v170.smiths_pawnshop")) {
    resolveSmithsPawnshopChoice(state, legalAction, playerAction);
    return;
  }
  delete state.pendingChoice;
}

function setupMulliganChoice(state: GameState, side: Side, stateVersion = state.stateVersion): ChoiceRequest {
  return {
    choiceId: `setup_mulligan_${side}_${stateVersion}`,
    side,
    source: "setup.mulligan",
    prompt: side === "runner" ? "Runner-Starthand" : "Korp-Starthand",
    kind: "select_option",
    options: [
      { id: "keep", label: "Starthand behalten", publicLabel: "Setup-Entscheidung" },
      { id: "mulligan", label: "Mulligan nehmen", publicLabel: "Setup-Entscheidung" }
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: "hidden_info_barrier"
  };
}

function discardChoice(state: GameState, side: Side, requiredDiscardCount: number, stateVersion = state.stateVersion): ChoiceRequest {
  const hand = handForSide(state, side);
  return {
    choiceId: `discard_${side}_${stateVersion}`,
    side,
    source: "discard_phase",
    prompt: side === "corp" ? "Korp-Discard wählen" : "Runner-Discard wählen",
    kind: "select_cards",
    options: hand.map((cardId) => ({
      id: `card_${cardId}`,
      label: definitionFor(state, cardId).title,
      publicLabel: "Handkarte",
      value: cardId
    })),
    minSelections: requiredDiscardCount,
    maxSelections: requiredDiscardCount,
    stateVersion,
    visibility: "hidden_info_barrier"
  };
}

function resolveDiscardChoice(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const choice = state.pendingChoice;
  if (!choice || choice.source !== "discard_phase") throw new Error("Es ist keine Discard-Choice offen.");
  const side = choice.side;
  if (state.timingPoint !== (side === "corp" ? "corp_discard.select_cards" : "runner_discard.select_cards")) {
    throw new Error("Discard ist im aktuellen Timingpoint nicht legal.");
  }
  const selectedIds = selectedChoiceIds(playerAction.selectedChoices);
  const selectedCards = selectedIds.map((optionId) => {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    if (typeof option?.value !== "string") throw new Error("Die Discard-Auswahl ist ungueltig.");
    return option.value;
  });
  const expectedCount = handForSide(state, side).length - maxHandSize(state, side);
  if (expectedCount !== choice.minSelections || expectedCount !== selectedCards.length) throw new Error("Die Discard-Anzahl ist nicht mehr gueltig.");
  const hand = handForSide(state, side);
  for (const cardId of selectedCards) {
    const instance = mustInstance(state.cardInstances, cardId);
    if (instance.owner !== side || !hand.includes(cardId)) throw new Error("Eine Discard-Karte liegt nicht in der Hand.");
  }

  for (const cardId of selectedCards) {
    removeFromAllZones(state, cardId);
    if (side === "corp") {
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: false, rezzed: false, zone: { side: "corp", zone: "archives" } };
    } else {
      state.runner.heap.push(cardId);
      state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "runner", zone: "heap" } };
    }
  }

  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    discardResolved: true,
    discardSide: side,
    discardCount: selectedCards.length,
    discardZone: side === "corp" ? "archives" : "heap",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "discard_phase"
  };
  delete state.pendingChoice;
  completeDiscardPhase(state, side);
}

function resolveSetupMulliganChoice(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const setup = state.setup ?? {
    status: state.pendingChoice?.side === "runner" ? "mulligan_runner" : "mulligan_corp",
    initialHandSize: INITIAL_HAND_SIZE,
    resolved: {},
    mulligansTaken: {}
  };
  const side = state.pendingChoice?.side;
  if (!side) throw new Error("Es ist keine Setup-Choice offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (selected !== "keep" && selected !== "mulligan") throw new Error("Die Mulligan-Auswahl ist ungueltig.");
  if (setup.resolved[side]) throw new Error("Diese Seite hat ihre Mulligan-Entscheidung bereits getroffen.");

  if (selected === "mulligan") {
    if ((setup.mulligansTaken[side] ?? 0) >= 1) throw new Error("Diese Seite hat bereits einen Mulligan genommen.");
    takeSetupMulligan(state, side, setup.initialHandSize);
    setup.mulligansTaken[side] = (setup.mulligansTaken[side] ?? 0) + 1;
  }
  setup.resolved[side] = selected;
  state.setup = setup;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    setupStep: "mulligan",
    setupSide: side,
    setupDecisionPublic: "resolved",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "setup_mulligan"
  };

  if (side === "runner") {
    setup.status = "mulligan_corp";
    state.activeSide = "corp";
    state.phase = "setup";
    state.timingPoint = "setup.mulligan.corp";
    state.pendingChoice = setupMulliganChoice(state, "corp", state.stateVersion + 1);
    return;
  }

  setup.status = "complete";
  delete state.pendingChoice;
  state.activeSide = "corp";
  state.phase = "corp_draw_phase";
  state.timingPoint = "corp_draw.mandatory_draw";
}

function takeSetupMulligan(state: GameState, side: Side, handSize: number): void {
  if (side === "runner") {
    const allIds = [...state.runner.grip, ...state.runner.stack];
    for (const id of allIds) state.cardInstances[id] = { ...mustInstance(state.cardInstances, id), zone: { side: "runner", zone: "stack" } };
    const shuffled = shuffleStateIds(state, allIds, "setup.shuffle.runner.mulligan");
    const grip = shuffled.splice(0, handSize);
    state.runner.grip = grip;
    state.runner.stack = shuffled;
    for (const id of grip) state.cardInstances[id] = { ...mustInstance(state.cardInstances, id), zone: { side: "runner", zone: "grip" } };
    recordStateRandomMarkers(state, "setup.draw.runner.mulligan_hand", grip.length);
    return;
  }

  const allIds = [...state.corp.hq, ...state.corp.rd];
  for (const id of allIds) state.cardInstances[id] = { ...mustInstance(state.cardInstances, id), zone: { side: "corp", zone: "rd" } };
  const shuffled = shuffleStateIds(state, allIds, "setup.shuffle.corp.mulligan");
  const hq = shuffled.splice(0, handSize);
  state.corp.hq = hq;
  state.corp.rd = shuffled;
  for (const id of hq) state.cardInstances[id] = { ...mustInstance(state.cardInstances, id), zone: { side: "corp", zone: "hq" } };
  recordStateRandomMarkers(state, "setup.draw.corp.mulligan_hand", hq.length);
}

function startRunnerStackSearchChoice(state: GameState): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = state.runner.stack
    .filter((cardId) => definitionFor(state, cardId).type === "program")
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (options.length === 0) throw new Error("Keine suchbare Programmkarte im Stack.");
  state.pendingChoice = {
    choiceId: `v098_search_stack_${state.stateVersion + 1}`,
    side: "runner",
    source: `v098.search_stack:${state.stateVersion + 1}`,
    prompt: "Stack durchsuchen",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier"
  };
}

function resolveRunnerStackSearchChoice(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine Search-Choice offen.");
  const cardId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!cardId || !state.runner.stack.includes(cardId)) throw new Error("Die gewaehlte Karte liegt nicht im Stack.");
  if (definitionFor(state, cardId).type !== "program") throw new Error("Nur Programme sind in dieser Search-Harness legal.");
  removeFromAllZones(state, cardId);
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), zone: { side: "runner", zone: "grip" } };
  shuffleRunnerStack(state, `v098_search_stack:${choice.choiceId}:shuffle`);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "search_stack",
    selectedCount: 1,
    shuffled: true
  };
}

function startRunnerStackArrangeChoice(state: GameState): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const topCards = state.runner.stack.slice(0, 2);
  if (topCards.length < 2) throw new Error("Nicht genug Karten fuer Arrange.");
  state.pendingChoice = {
    choiceId: `v098_arrange_stack_top2_${state.stateVersion + 1}`,
    side: "runner",
    source: `v098.arrange_stack_top2:${state.stateVersion + 1}`,
    prompt: "Top 2 Karten anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier"
  };
}

function resolveRunnerStackArrangeChoice(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine Arrange-Choice offen.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const topCards = state.runner.stack.slice(0, choice.options.length);
  if (selectedIds.length !== topCards.length) throw new Error("Die Arrange-Auswahl ist unvollstaendig.");
  const selectedSet = new Set(selectedIds);
  if (selectedSet.size !== selectedIds.length || topCards.some((cardId) => !selectedSet.has(cardId))) throw new Error("Die Arrange-Auswahl enthaelt ungueltige Karten.");
  state.runner.stack = [...selectedIds, ...state.runner.stack.slice(topCards.length)];
  for (const cardId of selectedIds) {
    state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), zone: { side: "runner", zone: "stack" } };
  }
  delete state.pendingChoice;
  legalAction.payload = { ...(legalAction.payload ?? {}), hiddenZoneBarrier: true, hiddenZoneAction: "arrange_stack", arrangedCount: selectedIds.length };
}

function startRunnerHostingChoice(state: GameState, hostId: CardInstanceId, legalAction: LegalAction): void {
  const host = mustInstance(state.cardInstances, hostId);
  if (host.definitionId !== "v099_host_resource" || !state.runner.rig.resources.includes(hostId)) throw new Error("Diese Karte kann in V0.99 nicht hosten.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = state.runner.grip
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return definition.type === "program" && state.runner.memoryUsed + (definition.memoryCost ?? 0) <= state.runner.memoryLimit;
    })
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (options.length === 0) return;
  state.pendingChoice = {
    choiceId: `v099_host_program_${state.stateVersion + 1}`,
    side: "runner",
    source: `v099.host_program:${hostId}:${state.stateVersion + 1}`,
    prompt: "Programm hosten",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier"
  };
  legalAction.payload = { ...(legalAction.payload ?? {}), hiddenZoneBarrier: true, hiddenZoneAction: "host_program", hostId };
}

function resolveRunnerHostingChoice(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine Hosting-Choice offen.");
  const sourceParts = choice.source.split(":");
  const hostId = sourceParts[1];
  if (!hostId || !state.runner.rig.resources.includes(hostId)) throw new Error("Der Host ist nicht mehr installiert.");
  const hostDefinition = definitionFor(state, hostId);
  if (hostDefinition.id !== "v099_host_resource") throw new Error("Diese Karte kann in V0.99 nicht hosten.");
  const cardId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!cardId || !state.runner.grip.includes(cardId)) throw new Error("Die gewählte Karte liegt nicht in der Grip.");
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program") throw new Error("Nur Programme können in dieser Hosting-Harness gehostet werden.");
  if (state.runner.memoryUsed + (definition.memoryCost ?? 0) > state.runner.memoryLimit) throw new Error("Nicht genug Memory für das gehostete Programm.");
  setHostedOn(state, cardId, hostId);
  removeFromAllZones(state, cardId);
  state.runner.rig.programs.push(cardId);
  state.runner.memoryUsed += definition.memoryCost ?? 0;
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
    hostedOn: hostId
  };
  delete state.pendingChoice;
  legalAction.payload = { ...(legalAction.payload ?? {}), hiddenZoneBarrier: true, hiddenZoneAction: "host_program", hostedCount: 1, hostId };
}

function resolveSmithsPawnshopChoice(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v170.smiths_pawnshop")) throw new Error("Es ist keine Smith's-Pawnshop-Choice offen.");
  const sourceParts = choice.source.split(":");
  const pawnshopId = sourceParts[1];
  if (!pawnshopId || !state.runner.rig.resources.includes(pawnshopId)) throw new Error("Smith's Pawnshop ist nicht mehr installiert.");
  const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "pass";
  if (selectedId !== "pass") {
    const option = choice.options.find((candidate) => candidate.id === selectedId);
    const cardId = typeof option?.value === "string" ? option.value : "";
    if (!cardId) throw new Error("Die gewaehlte Karte ist ungueltig.");
    if (cardId === pawnshopId) throw new Error("Smith's Pawnshop kann sich nicht selbst trashen.");
    if (!runnerInstalledCardIds(state).includes(cardId)) throw new Error("Die gewaehlte Karte ist nicht mehr installiert.");
    trashRunnerInstalledCardToHeap(state, cardId);
    credits(state, "runner", 1);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      smithsPawnshopTriggered: true,
      smithsPawnshopCardId: pawnshopId,
      trashedCardId: cardId,
      creditsGained: 1
    };
  } else {
    legalAction.payload = { ...(legalAction.payload ?? {}), smithsPawnshopTriggered: false, smithsPawnshopCardId: pawnshopId };
  }
  delete state.pendingChoice;
}

function selectedChoiceCardIds(choice: ChoiceRequest, playerAction: PlayerAction): CardInstanceId[] {
  return selectedChoiceIds(playerAction.selectedChoices).map((optionId) => {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    if (typeof option?.value !== "string") throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value;
  });
}

function shuffleRunnerStack(state: GameState, purpose: string): void {
  const random = { counter: state.randomCounter, records: state.randomDrawRecords };
  state.runner.stack = shuffleIds(state.runner.stack, state.seed, purpose, random);
  state.randomCounter = random.counter;
}

function revealRunnerStackTop(state: GameState, legalAction: LegalAction): void {
  const cardId = state.runner.stack[0];
  if (!cardId) throw new Error("Der Stack ist leer.");
  const definition = definitionFor(state, cardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    publicRevealKind: "reveal",
    publicRevealDefinitionId: definition.id
  };
}

function exposedCorpCardInServer(state: GameState, serverId: Exclude<ServerId, "new_remote">): CardInstanceId | undefined {
  const server = mustServer(state, serverId);
  return [...server.root, ...server.ice].find((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return !instance.rezzed;
  });
}

function exposeCorpCardInServer(state: GameState, serverId: Exclude<ServerId, "new_remote">, legalAction: LegalAction): void {
  const cardId = exposedCorpCardInServer(state, serverId);
  if (!cardId) throw new Error("In diesem Server liegt keine unrezzed installierte Korp-Karte.");
  const definition = definitionFor(state, cardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    publicRevealKind: "expose",
    publicRevealDefinitionId: definition.id
  };
}

function swapCorpHqAndRdTop(state: GameState): void {
  const hqCardId = state.corp.hq[0];
  const rdCardId = state.corp.rd[0];
  if (!hqCardId || !rdCardId) throw new Error("HQ und R&D brauchen je eine Karte fuer Swap.");
  state.corp.hq[0] = rdCardId;
  state.corp.rd[0] = hqCardId;
  state.cardInstances[hqCardId] = { ...mustInstance(state.cardInstances, hqCardId), zone: { side: "corp", zone: "rd" } };
  state.cardInstances[rdCardId] = { ...mustInstance(state.cardInstances, rdCardId), zone: { side: "corp", zone: "hq" } };
}

function resolveTraceCorpBid(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const trace = state.trace;
  if (!trace || trace.status !== "corp_bid") throw new Error("Es ist kein Korp-Trace-Bid offen.");
  const bid = selectedBidAmount(state.pendingChoice, playerAction);
  spendCredits(state, "corp", bid);
  const traceStrength = trace.baseTraceStrength + bid;
  const runnerLink = calculateRunnerLink(state);
  state.trace = {
    ...trace,
    status: "runner_bid",
    corpBid: bid,
    traceStrength,
    runnerLink
  };
  state.pendingChoice = traceBidChoice(state, "runner", trace.traceId, `Runner Link-Bid wählen (Trace ${traceStrength}, Link ${runnerLink})`, state.runner.credits);
  state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "corp_bid",
    baseTraceStrength: trace.baseTraceStrength,
    corpBid: bid,
    traceStrength,
    runnerLink
  };
}

function resolveTraceRunnerBid(state: GameState, legalAction: LegalAction, playerAction: PlayerAction): void {
  const trace = state.trace;
  if (!trace || trace.status !== "runner_bid") throw new Error("Es ist kein Runner-Trace-Bid offen.");
  const bid = selectedBidAmount(state.pendingChoice, playerAction);
  spendCredits(state, "runner", bid);
  const runnerLink = trace.runnerLink ?? calculateRunnerLink(state);
  const traceStrength = trace.traceStrength ?? trace.baseTraceStrength + (trace.corpBid ?? 0);
  const runnerStrength = runnerLink + bid;
  const successful = traceStrength > runnerStrength;
  const tagsAdded = successful ? trace.successEffect.amount : 0;
  if (successful) state.runner.tags += tagsAdded;
  delete state.pendingChoice;
  delete state.trace;
  if (state.run) {
    state.timingPoint = "run.encounter_ice";
    state.activeSide = "runner";
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "runner_bid",
    baseTraceStrength: trace.baseTraceStrength,
    corpBid: trace.corpBid ?? 0,
    traceStrength,
    runnerLink,
    runnerBid: bid,
    runnerStrength,
    traceSuccessful: successful,
    tagsAdded
  };
}

function selectedBidAmount(choice: ChoiceRequest | undefined, playerAction: PlayerAction): number {
  if (!choice) throw new Error("Es ist keine Bid-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selected = choice.options.find((option) => option.id === selectedOptionId);
  const amount = typeof selected?.value === "number" ? selected.value : Number.NaN;
  if (!Number.isInteger(amount) || amount < 0) throw new Error("Der Trace-Bid ist ungueltig.");
  return amount;
}

function calculateRunnerLink(state: GameState): number {
  const identity = definitionFor(state, state.runner.identity);
  const baseLink = identity.baseLink ?? 0;
  if (!Number.isInteger(baseLink) || baseLink < 0) throw new Error("Runner-Link ist ungueltig.");
  const modifier = identityModifierAmount(state, "runner", "base_link", "static");
  const link = baseLink + modifier;
  if (!Number.isInteger(link) || link < 0) throw new Error("Runner-Link ist ungueltig.");
  return link;
}

function applyIdentityStaticModifiers(state: GameState): void {
  const memoryModifier = identityModifierAmount(state, "runner", "memory_limit", "static");
  state.runner.memoryLimit += memoryModifier;
  if (!Number.isInteger(state.runner.memoryLimit) || state.runner.memoryLimit < 0) {
    throw new Error("Runner-Memory-Limit ist ungueltig.");
  }
}

function applyIdentitySetupAbilities(state: GameState): void {
  for (const side of ["corp", "runner"] as const) {
    const identity = identityDefinition(state, side);
    for (const modifier of identity.modifiers ?? []) {
      if (modifier.duration !== "setup" || modifier.kind !== "starting_credits" || modifier.side !== side) continue;
      if (!Number.isInteger(modifier.amount) || modifier.amount < 0) throw new Error("Setup-Credit-Modifier ist ungueltig.");
      credits(state, side, modifier.amount);
      recordIdentitySetupAbility(state, side, modifier.modifierId);
    }
  }
}

function identityModifierAmount(state: GameState, side: Side, kind: ModifierKind, duration: "setup" | "static"): number {
  const identity = identityDefinition(state, side);
  return (identity.modifiers ?? [])
    .filter((modifier) => modifier.side === side && modifier.kind === kind && modifier.duration === duration)
    .reduce((sum, modifier) => {
      if (!Number.isInteger(modifier.amount)) throw new Error("Identity-Modifier ist ungueltig.");
      return sum + modifier.amount;
    }, 0);
}

function identityDefinition(state: GameState, side: Side): CardDefinition {
  return definitionFor(state, side === "runner" ? state.runner.identity : state.corp.identity);
}

function recordIdentitySetupAbility(state: GameState, side: Side, modifierId: string): void {
  const usage = (state.identityAbilityUsage ??= {});
  const sideUsage = (usage[side] ??= { setupAbilities: [], turn: 0, usedThisTurn: [] });
  if (!sideUsage.setupAbilities.includes(modifierId)) sideUsage.setupAbilities.push(modifierId);
}

function executeEffectCommands(state: GameState, commands: EffectCommand[]): void {
  for (const command of commands) {
    switch (command.type) {
      case "gain_credits":
        assertNonNegativeAmount(command.amount);
        credits(state, command.side, command.amount);
        break;
      case "spend_credits":
        assertNonNegativeAmount(command.amount);
        spendCredits(state, command.side, command.amount);
        break;
      case "draw_card":
        for (let count = 0; count < (command.amount ?? 1); count += 1) {
          command.side === "corp" ? drawCorpCard(state) : drawRunnerCard(state);
        }
        break;
      case "do_damage":
        doDamage(state, {
          damageId: `effect.${command.source ?? "unknown"}.${state.stateVersion}.${state.randomCounter}`,
          damageType: command.damageType,
          amount: command.amount,
          source: command.source ?? "effect_command"
        });
        break;
      case "add_tag":
        assertNonNegativeAmount(command.amount);
        state.runner.tags += command.amount;
        break;
      case "remove_tag":
        assertNonNegativeAmount(command.amount);
        state.runner.tags = Math.max(0, state.runner.tags - command.amount);
        break;
      case "change_breaker_strength":
        mustInstance(state.cardInstances, command.breakerId).strengthModifier += command.amount;
        break;
      case "break_subroutine": {
        const run = mustRun(state);
        if (!run.brokenSubroutineIndexes.includes(command.subroutineIndex)) run.brokenSubroutineIndexes.push(command.subroutineIndex);
        break;
      }
      case "set_pending_choice":
        if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
        state.pendingChoice = cloneState(command.choice);
        break;
      case "complete_pending_choice":
        if (!state.pendingChoice || state.pendingChoice.choiceId !== command.choiceId) throw new Error("Diese Choice ist nicht offen.");
        delete state.pendingChoice;
        break;
      case "emit_event":
        throw new Error("Effect-Event-Emission wird in V0.93 nur spezifiziert, aber nicht vom State-Only-Executor geschrieben.");
    }
  }
}

function assertNonNegativeAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Effect amount ist ungueltig.");
}

function assertPositiveIntegerAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Damage amount ist ungueltig.");
}

function makeActionId(type: ActionType, side: Side, payload: LegalAction["payload"] | undefined, source: LegalAction["source"]): string {
  const parts = [side, type, source === "basic_action" || source === "game_rule" ? "" : source];
  if (payload?.serverId) parts.push(String(payload.serverId));
  if (payload?.cardId) parts.push(String(payload.cardId));
  if (payload?.hostOnCardId) parts.push(String(payload.hostOnCardId));
  if (payload?.breakerId) parts.push(String(payload.breakerId));
  if (payload?.subroutineIndex !== undefined) parts.push(String(payload.subroutineIndex));
  return parts.filter(Boolean).join(".");
}

function buildEvent(before: number, after: number, stateHashAfter: StateHash, previousState: GameState, state: GameState, legalAction: LegalAction, playerAction: PlayerAction): GameEvent {
  const actor = legalAction.side;
  const reveal = revealForPublicEvent(state, legalAction);
  const visibilityClass = eventVisibilityForAction(legalAction);
  const publicPayload: Record<string, unknown> = {
    actor,
    actionType: legalAction.type,
    label: publicLabel(legalAction),
    ...publicActionUseContext(previousState, legalAction),
    ...publicContextForAction(state, legalAction),
    ...reveal
  };
  return {
    eventId: `evt_${after}`,
    type: legalAction.type,
    stateVersionBefore: before,
    stateVersionAfter: after,
    stateHashAfter,
    visibilityClass,
    publicPayload,
    privatePayload: {
      [actor]: {
        action: playerAction,
        legalAction
      }
    }
  };
}

function publicActionUseContext(state: GameState, legalAction: LegalAction): Record<string, unknown> {
  const actionCostClicks = clickCostForAction(legalAction);
  if (actionCostClicks <= 0) return {};
  const clicksBefore = clicksForSide(state, legalAction.side);
  const turnCapacity = Math.max(baseClicksForSide(legalAction.side), clicksBefore);
  const usedBefore = Math.max(0, turnCapacity - clicksBefore);
  return {
    actionCostClicks,
    turnActionOrdinalStart: usedBefore + 1,
    turnActionOrdinalEnd: usedBefore + actionCostClicks
  };
}

function clickCostForAction(legalAction: LegalAction): number {
  return legalAction.costs.reduce((sum, cost) => sum + (Number.isInteger(cost.clicks) && cost.clicks ? cost.clicks : 0), 0);
}

function clicksForSide(state: GameState, side: Side): number {
  return side === "corp" ? state.corp.clicks : state.runner.clicks;
}

function baseClicksForSide(side: Side): number {
  return side === "corp" ? 3 : 4;
}

function publicLabel(legalAction: LegalAction): string {
  if (legalAction.type === "resolve_choice" && legalAction.payload?.setupStep === "mulligan") return "Setup-Entscheidung wurde beantwortet.";
  if (legalAction.type === "resolve_choice" && legalAction.payload?.discardResolved === true) return "Discard wurde abgeschlossen.";
  if (legalAction.type === "resolve_choice" && legalAction.payload?.replacementDecision) return "Replacement-Entscheidung wurde beantwortet.";
  if (legalAction.type === "resolve_choice" && legalAction.payload?.eventModificationDecision) return "Event-Modification-Entscheidung wurde beantwortet.";
  if (legalAction.type === "resolve_choice") return "Choice wurde beantwortet.";
  if (legalAction.type === "move_to_set_aside") return "Eine Karte wurde in Set Aside bewegt.";
  if (legalAction.type === "move_to_removed_from_game") return "Eine Karte wurde aus dem Spiel entfernt.";
  if (legalAction.type === "return_from_set_aside") return "Eine Karte ist aus Set Aside zurückgekehrt.";
  if (legalAction.type === "change_card_control") return "Die Kontrolle einer Karte wurde geändert.";
  if (legalAction.side === "corp" && legalAction.type === "install_card") return "Korp installiert eine Karte.";
  if (legalAction.side === "corp" && legalAction.type === "advance_card") return "Korp advanced eine Karte.";
  return legalAction.label;
}

function publicContextForAction(state: GameState, legalAction: LegalAction): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  const cardId =
    typeof legalAction.payload?.cardId === "string"
      ? legalAction.payload.cardId
      : typeof legalAction.payload?.accessedCardId === "string"
        ? legalAction.payload.accessedCardId
        : undefined;
  const sourceCardId = typeof legalAction.source === "string" && state.cardInstances[legalAction.source] ? legalAction.source : undefined;
  const serverLabel = publicServerLabelForCard(state, cardId) ?? publicServerLabel(state, legalAction.payload?.serverId);
  const agendaId = cardId ?? sourceCardId;

  if (serverLabel) context.serverLabel = serverLabel;
  if (legalAction.type === "install_card") {
    const definition = cardId ? definitionFor(state, cardId) : undefined;
    context.zoneLabel = legalAction.side === "runner" ? (definition?.type === "resource" ? "Resource" : "Rig") : legalAction.payload?.placement === "ice" ? "ICE" : "Remote";
  }
  if (legalAction.type === "trash_resource") context.zoneLabel = "Resource";
  if (legalAction.type === "rez_ice") context.zoneLabel = legalAction.payload?.rootRez === true || legalAction.payload?.assetRez === true ? "Remote" : "ICE";
  if (legalAction.type === "gain_credit" || legalAction.type === "draw_card" || legalAction.type === "remove_tag") context.amount = 1;
  if (legalAction.type === "resolve_choice") {
    context.choiceKind = legalAction.payload?.choiceKind;
    if (legalAction.payload?.discardResolved === true) {
      context.discardResolved = true;
      context.discardSide = legalAction.payload.discardSide;
      context.discardCount = legalAction.payload.discardCount;
      context.discardZone = legalAction.payload.discardZone;
      context.redactedKind = "discard";
    }
    if (legalAction.payload?.setupStep === "mulligan") {
      context.setupStep = "mulligan";
      context.setupSide = legalAction.payload.setupSide;
      context.setupStatus = state.setup?.status ?? "complete";
    }
    if (legalAction.payload?.choiceVisibility === "public") context.choiceId = legalAction.payload?.choiceId;
    else context.redactedKind = "choice";
    for (const key of [
      "eventModificationWindowId",
      "eventModificationKind",
      "eventModificationDecision",
      "eventModificationOutcome",
      "imminentEventId",
      "imminentEventType",
      "affectedSide",
      "originalAmount",
      "preventedAmount",
      "finalAmount"
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    for (const key of [
      "replacementWindowId",
      "replacementDecision",
      "replacementOutcome",
      "originalEventId",
      "originalEventType",
      "replacementEventId",
      "replacementEventType",
      "tagsAdded"
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    for (const key of [
      "traceId",
      "traceStep",
      "baseTraceStrength",
      "corpBid",
      "traceStrength",
      "runnerLink",
      "runnerBid",
      "runnerStrength",
      "traceSuccessful",
      "tagsAdded"
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.type === "continue_run") {
    context.result = state.run ? "continued" : "ended";
    if (legalAction.payload?.encounterContinue === true) {
      context.encounterContinue = true;
      context.unbrokenSubroutineCount = legalAction.payload.unbrokenSubroutineCount;
      context.encounterWillEndRun = legalAction.payload.encounterWillEndRun;
    }
  }
  if (legalAction.payload?.traceStarted === true) {
    context.traceStarted = true;
    context.traceId = legalAction.payload.traceId;
    context.sourceCardId = legalAction.payload.sourceCardId;
    context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    context.baseTraceStrength = legalAction.payload.baseTraceStrength;
  }
  if (legalAction.payload?.damageResolved === true) {
    context.damageResolved = true;
    context.damageType = legalAction.payload.damageType;
    context.damageAmount = legalAction.payload.damageAmount;
    context.cardsTrashed = legalAction.payload.cardsTrashed;
    context.flatline = legalAction.payload.flatline;
    if (typeof legalAction.payload.coreDamageAfter === "number") context.coreDamageAfter = legalAction.payload.coreDamageAfter;
    if (typeof legalAction.payload.runnerMaxHandSizeAfter === "number") context.runnerMaxHandSizeAfter = legalAction.payload.runnerMaxHandSizeAfter;
  }
  if (legalAction.payload?.eventModificationWindowOpened === true) {
    context.eventModificationWindowOpened = true;
    context.eventModificationKind = legalAction.payload.eventModificationKind;
    context.eventModificationWindowId = legalAction.payload.eventModificationWindowId;
    context.imminentEventId = legalAction.payload.imminentEventId;
    context.imminentEventType = legalAction.payload.imminentEventType;
    context.affectedSide = legalAction.payload.affectedSide;
    context.candidateCount = legalAction.payload.candidateCount;
    context.redactedKind = "event_modification";
  }
  if (legalAction.payload?.replacementWindowOpened === true) {
    context.replacementWindowOpened = true;
    context.replacementWindowId = legalAction.payload.replacementWindowId;
    context.originalEventId = legalAction.payload.originalEventId;
    context.originalEventType = legalAction.payload.originalEventType;
    context.replacementCandidateCount = legalAction.payload.replacementCandidateCount;
    context.affectedSide = legalAction.payload.affectedSide;
    context.redactedKind = "replacement";
  }
  if (legalAction.type === "purge_virus_counters") {
    context.purgedCounterType = "virus";
    context.purgedVirusCounters = legalAction.payload?.purgedVirusCounters ?? 0;
  }
  if (legalAction.payload?.hiddenZoneBarrier === true) {
    context.hiddenZoneBarrier = true;
    context.hiddenZoneAction = legalAction.payload.hiddenZoneAction;
    context.redactedKind = "hidden_zone";
  }
  if (legalAction.payload?.publicRevealKind) context.revealKind = legalAction.payload.publicRevealKind;
  if (legalAction.type === "move_to_set_aside" || legalAction.type === "move_to_removed_from_game" || legalAction.type === "return_from_set_aside") {
    context.specialZone = legalAction.payload?.specialZone;
    context.specialZoneVisibility = legalAction.payload?.specialZoneVisibility;
    context.specialZoneReason = legalAction.payload?.specialZoneReason;
    context.redactedKind = "special_zone";
  }
  if (legalAction.type === "change_card_control") {
    context.oldController = legalAction.payload?.oldController;
    context.newController = legalAction.payload?.newController;
    context.ownershipChanged = false;
    context.controlChangeReason = legalAction.payload?.controlChangeReason;
    context.redactedKind = "control_change";
  }
  if (typeof legalAction.payload?.badPublicityAfter === "number") context.badPublicityAfter = legalAction.payload.badPublicityAfter;
  if (typeof legalAction.payload?.onScoreGainCredits === "number") context.onScoreGainCredits = legalAction.payload.onScoreGainCredits;
  if (typeof legalAction.payload?.corpCreditsAfter === "number") context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
  if (typeof legalAction.payload?.gainedActions === "number") context.gainedActions = legalAction.payload.gainedActions;
  if (state.winner && state.gameEndReason) context.gameEndReason = state.gameEndReason;
  if (state.run?.phase) context.runPhase = state.run.phase;
  if ((legalAction.type === "score_agenda" || legalAction.type === "steal_agenda") && agendaId) {
    const definition = definitionFor(state, agendaId);
    if (definition.type === "agenda" && typeof definition.agendaPoints === "number") context.agendaPoints = definition.agendaPoints;
  }
  if (legalAction.side === "corp" && (legalAction.type === "install_card" || legalAction.type === "advance_card")) context.redactedKind = "installed_card";

  return context;
}

function publicServerLabel(state: GameState, serverId: unknown): string | undefined {
  if (typeof serverId !== "string") return undefined;
  if (serverId === "new_remote") return "neuem Remote";
  return state.corp.servers.find((server) => server.id === serverId)?.label;
}

function publicServerLabelForCard(state: GameState, cardId: string | undefined): string | undefined {
  if (!cardId) return undefined;
  const zone = state.cardInstances[cardId]?.zone;
  const serverId = zone && "serverId" in zone ? zone.serverId : undefined;
  return publicServerLabel(state, serverId);
}

function revealForPublicEvent(state: GameState, legalAction: LegalAction): Record<string, unknown> {
  if (typeof legalAction.payload?.publicRevealDefinitionId === "string") {
    const definition = DEMO_CARDS_BY_ID[legalAction.payload.publicRevealDefinitionId];
    if (definition) return { cardDefinitionId: definition.id, title: definition.title };
  }
  if (
    (legalAction.type === "move_to_set_aside" || legalAction.type === "move_to_removed_from_game" || legalAction.type === "return_from_set_aside" || legalAction.type === "change_card_control") &&
    (legalAction.payload?.specialZoneVisibility === "public" || legalAction.payload?.controlChangeVisibility === "public")
  ) {
    const cardId = typeof legalAction.payload?.cardId === "string" ? legalAction.payload.cardId : undefined;
    if (cardId && state.cardInstances[cardId]) {
      const definition = definitionFor(state, cardId);
      return { cardDefinitionId: definition.id, title: definition.title };
    }
  }
  const revealsCard =
    ["access_card", "rez_ice", "score_agenda", "steal_agenda", "trash_accessed_card", "trash_resource", "play_event", "play_operation", "pump_breaker", "break_subroutine"].includes(legalAction.type) ||
    (legalAction.side === "runner" && legalAction.type === "install_card");
  if (revealsCard && typeof legalAction.source === "string") {
    const cardId = legalAction.type === "access_card" ? (typeof legalAction.payload?.accessedCardId === "string" ? legalAction.payload.accessedCardId : state.run?.accessedCardId) : legalAction.payload?.cardId ?? legalAction.source;
    if (typeof cardId === "string" && state.cardInstances[cardId]) {
      const definition = definitionFor(state, cardId);
      return { cardDefinitionId: definition.id, title: definition.title };
    }
    if (typeof cardId === "string" && DEMO_CARDS_BY_ID[cardId]) return { cardDefinitionId: cardId, title: DEMO_CARDS_BY_ID[cardId]?.title };
  }
  return {};
}

function toPublicEvent(event: GameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass ? { visibilityClass: event.visibilityClass } : {}),
    publicPayload: event.publicPayload
  };
}

export function redactPublicEventForSide(event: PublicGameEvent, viewerSide: Side): PublicGameEvent {
  const actor = event.publicPayload.actor;
  const actionType = event.publicPayload.actionType;
  if (actionType !== "access_card" || actor !== "runner" || viewerSide !== "corp") return event;
  const serverLabel = typeof event.publicPayload.serverLabel === "string" ? event.publicPayload.serverLabel : "";
  const serverId = typeof event.publicPayload.serverId === "string" ? event.publicPayload.serverId : "";
  const rdHiddenAccess = serverId === "rd" || serverLabel === "R&D" || serverLabel === "F&E (R&D)" || serverLabel === "F&E";
  if (!rdHiddenAccess) return event;
  const { cardDefinitionId: _cardDefinitionId, title: _title, ...publicPayload } = event.publicPayload;
  void _cardDefinitionId;
  void _title;
  return {
    ...event,
    publicPayload: {
      ...publicPayload,
      redactedKind: "accessed_card"
    }
  };
}

function visibleOwnCard(state: GameState, id: CardInstanceId): VisibleCard {
  const definition = definitionFor(state, id);
  const instance = mustInstance(state.cardInstances, id);
  return {
    instanceId: id,
    known: true,
    title: definition.title,
    definitionId: definition.id,
    type: definition.type,
    subtypes: definition.subtypes,
    rulesText: definition.rulesText,
    ...(definition.cost !== undefined ? { cost: definition.cost } : {}),
    ...(definition.installCost !== undefined ? { installCost: definition.installCost } : {}),
    ...(definition.memoryCost !== undefined ? { memoryCost: definition.memoryCost } : {}),
    ...(definition.memoryLimitBonus !== undefined ? { memoryLimitBonus: definition.memoryLimitBonus } : {}),
    ...(definition.rezCost !== undefined ? { rezCost: definition.rezCost } : {}),
    ...(definition.baseLink !== undefined ? { baseLink: definition.baseLink } : {}),
    rezzed: instance.rezzed,
    advancementCounters: instance.advancementCounters,
    ...(definition.advancementRequirement !== undefined ? { advancementRequirement: definition.advancementRequirement } : {}),
    ...(definition.strength !== undefined ? { strength: definition.type === "ice" ? iceStrengthFor(state, id) : definition.strength + instance.strengthModifier } : {}),
    ...(definition.agendaPoints !== undefined ? { agendaPoints: definition.agendaPoints } : {}),
    ...(definition.trashCost !== undefined ? { trashCost: definition.trashCost } : {}),
    ...(instance.counters ? { counters: cloneCounters(instance.counters) } : {}),
    ...(instance.hostedOn ? { hostedOn: instance.hostedOn } : {}),
    owner: instance.owner,
    controller: instance.controller
  };
}

function visibleCorpCard(state: GameState, id: CardInstanceId, viewer: Side, area: "ice" | "root"): VisibleCard {
  const instance = mustInstance(state.cardInstances, id);
  const definition = definitionFor(state, id);
  const accessed = state.run?.accessedCardId === id;
  const visible = viewer === "corp" || instance.rezzed || accessed || state.corp.scoreArea.includes(id) || (state.corp.archives.includes(id) && instance.faceup);
  if (!visible) {
    return {
      instanceId: hiddenVisibleCardId(id),
      known: false,
      rezzed: false,
      advancementCounters: area === "root" ? instance.advancementCounters : 0
    };
  }
  return visibleOwnCard(state, id);
}

function visibleCorpArchives(state: GameState, viewer: Side): VisibleCard[] {
  return state.corp.archives
    .filter((id) => viewer === "corp" || mustInstance(state.cardInstances, id).faceup)
    .map((id) => visibleCorpCard(state, id, viewer, "root"));
}

function visibleSpecialZones(state: GameState, viewer: Side): NonNullable<PlayerView["specialZones"]> {
  const zones = state.specialZones ?? { setAside: [], removedFromGame: [] };
  return {
    setAside: zones.setAside.map((id) => visibleSpecialZoneCard(state, id, viewer)),
    removedFromGame: zones.removedFromGame.map((id) => visibleSpecialZoneCard(state, id, viewer)),
    setAsideCount: zones.setAside.length,
    removedFromGameCount: zones.removedFromGame.length
  };
}

function visibleSpecialZoneCard(state: GameState, id: CardInstanceId, viewer: Side): VisibleCard {
  const instance = mustInstance(state.cardInstances, id);
  if (instance.zone.side !== "special") return visibleOwnCard(state, id);
  if (canSeeSpecialZoneCard(instance, viewer)) return visibleOwnCard(state, id);
  return {
    instanceId: hiddenVisibleCardId(id),
    known: false
  };
}

function canSeeSpecialZoneCard(instance: CardInstance, viewer: Side): boolean {
  if (instance.zone.side !== "special") return true;
  if (instance.zone.visibility === "public") return true;
  if (instance.zone.visibility === "side_private") return viewer === (instance.zone.visibilitySide ?? instance.owner);
  return false;
}


function agendaPoints(state: GameState, side: Side): number {
  const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
  return ids.reduce((sum, id) => sum + (definitionFor(state, id).agendaPoints ?? 0), 0);
}

function credits(state: GameState, side: Side, amount: number): void {
  if (side === "corp") state.corp.credits += amount;
  else state.runner.credits += amount;
}

function cloneCounters(counters: Partial<Record<CounterType, number>>): Partial<Record<CounterType, number>> {
  return Object.fromEntries(Object.entries(counters).filter(([, amount]) => typeof amount === "number" && amount > 0)) as Partial<Record<CounterType, number>>;
}

function cardCounter(state: GameState, cardId: CardInstanceId, counterType: CounterType): number {
  return mustInstance(state.cardInstances, cardId).counters?.[counterType] ?? 0;
}

function setCardCounter(state: GameState, cardId: CardInstanceId, counterType: CounterType, amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) throw new Error("Counter amount ist ungueltig.");
  const instance = mustInstance(state.cardInstances, cardId);
  const counters = { ...(instance.counters ?? {}) };
  if (amount === 0) delete counters[counterType];
  else counters[counterType] = amount;
  const { counters: _counters, ...withoutCounters } = instance;
  void _counters;
  state.cardInstances[cardId] = Object.keys(counters).length > 0 ? { ...withoutCounters, counters } : withoutCounters;
}

function addCardCounter(state: GameState, cardId: CardInstanceId, counterType: CounterType, amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) throw new Error("Counter amount ist ungueltig.");
  setCardCounter(state, cardId, counterType, cardCounter(state, cardId, counterType) + amount);
}

function spendCardCounter(state: GameState, cardId: CardInstanceId, counterType: CounterType, amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) throw new Error("Counter amount ist ungueltig.");
  const current = cardCounter(state, cardId, counterType);
  if (current < amount) throw new Error("Nicht genug Counter vorhanden.");
  setCardCounter(state, cardId, counterType, current - amount);
}

function totalCounters(state: GameState, counterType: CounterType): number {
  return Object.keys(state.cardInstances).reduce((sum, cardId) => sum + cardCounter(state, cardId, counterType), 0);
}

function purgeVirusCounters(state: GameState): number {
  const total = totalCounters(state, "virus");
  if (total <= 0) throw new Error("Es gibt keine Virus-Counter zu purgen.");
  for (const cardId of Object.keys(state.cardInstances)) {
    setCardCounter(state, cardId, "virus", 0);
  }
  return total;
}

function hostedCardsOn(state: GameState, hostId: CardInstanceId): CardInstanceId[] {
  return Object.entries(state.cardInstances)
    .filter(([, instance]) => instance.hostedOn === hostId)
    .map(([cardId]) => cardId)
    .sort();
}

function setHostedOn(state: GameState, cardId: CardInstanceId, hostId: CardInstanceId): void {
  if (cardId === hostId) throw new Error("Eine Karte kann nicht auf sich selbst gehostet werden.");
  if (!state.cardInstances[hostId]) throw new Error("Host-Karte fehlt.");
  let current: CardInstanceId | undefined = hostId;
  while (current) {
    if (current === cardId) throw new Error("Hosting-Zyklus ist nicht erlaubt.");
    current = state.cardInstances[current]?.hostedOn;
  }
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), hostedOn: hostId };
}

function hasHostingCycle(state: GameState, cardId: CardInstanceId): boolean {
  const seen = new Set<CardInstanceId>([cardId]);
  let current = state.cardInstances[cardId]?.hostedOn;
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    current = state.cardInstances[current]?.hostedOn;
  }
  return false;
}

function spendCredits(state: GameState, side: Side, amount: number): void {
  if (amount <= 0) return;
  if (side === "corp") {
    if (state.corp.credits < amount) throw new Error("Die Korp kann die Kosten nicht bezahlen.");
    state.corp.credits -= amount;
    return;
  }
  if (state.runner.credits < amount) throw new Error("Der Runner kann die Kosten nicht bezahlen.");
  state.runner.credits -= amount;
}

function availableRunnerProgramInstallCredits(state: GameState): number {
  return state.runner.credits + runnerRecurringCredits(state);
}

function runnerRecurringCredits(state: GameState): number {
  return state.runner.rig.hardware.reduce((sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"), 0);
}

function spendRunnerInstallCredits(state: GameState, amount: number, cardType: CardDefinition["type"]): void {
  if (amount <= 0) return;
  if (cardType !== "program") {
    spendCredits(state, "runner", amount);
    return;
  }
  if (availableRunnerProgramInstallCredits(state) < amount) throw new Error("Der Runner kann die Installationskosten nicht bezahlen.");
  let remaining = amount;
  for (const cardId of state.runner.rig.hardware) {
    if (remaining <= 0) break;
    const available = cardCounter(state, cardId, "recurring_credit");
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      spendCardCounter(state, cardId, "recurring_credit", spent);
      remaining -= spent;
    }
  }
  spendCredits(state, "runner", remaining);
}

function runnerRunRecurringCreditSourceIds(state: GameState, breakerId?: CardInstanceId): CardInstanceId[] {
  const noisyBreaker =
    breakerId && state.cardInstances[breakerId] && state.runner.rig.programs.includes(breakerId) ? cardHasSubtype(definitionFor(state, breakerId), "noisy") : false;
  const runnerRig = [...state.runner.rig.hardware, ...state.runner.rig.programs, ...state.runner.rig.resources];
  return runnerRig.filter((cardId) => {
    if (cardCounter(state, cardId, "recurring_credit") <= 0) return false;
    if (!noisyBreaker) return true;
    return !cardHasSubtype(definitionFor(state, cardId), "stealth");
  });
}

function runnerRunRecurringCredits(state: GameState, breakerId?: CardInstanceId): number {
  return runnerRunRecurringCreditSourceIds(state, breakerId).reduce((sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"), 0);
}

function availableRunnerRunCredits(state: GameState, breakerId?: CardInstanceId): number {
  return state.runner.credits + (state.run?.badPublicityCredits ?? 0) + runnerRunRecurringCredits(state, breakerId);
}

function spendRunnerRunCredits(state: GameState, amount: number, breakerId?: CardInstanceId): void {
  if (amount <= 0) return;
  if (availableRunnerRunCredits(state, breakerId) < amount) throw new Error("Der Runner kann die Run-Kosten nicht bezahlen.");
  const run = mustRun(state);
  let remaining = amount;
  const fromBadPublicity = Math.min(run.badPublicityCredits ?? 0, remaining);
  if (fromBadPublicity > 0) {
    run.badPublicityCredits = (run.badPublicityCredits ?? 0) - fromBadPublicity;
    remaining -= fromBadPublicity;
  }
  for (const cardId of runnerRunRecurringCreditSourceIds(state, breakerId)) {
    if (remaining <= 0) break;
    const available = cardCounter(state, cardId, "recurring_credit");
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      spendCardCounter(state, cardId, "recurring_credit", spent);
      remaining -= spent;
    }
  }
  spendCredits(state, "runner", remaining);
}

function refreshRecurringCredits(state: GameState, side: Side): void {
  if (side !== "runner" || !isV099OrLater(state)) return;
  for (const cardId of runnerInstalledCardIds(state)) {
    const definition = definitionFor(state, cardId);
    if ((definition.recurringCredits ?? 0) > 0) setCardCounter(state, cardId, "recurring_credit", definition.recurringCredits ?? 0);
  }
}

function spendClick(state: GameState, side: Side): void {
  if (side === "corp") {
    if (state.corp.clicks <= 0) throw new Error("Die Korp hat keine Clicks mehr.");
    state.corp.clicks -= 1;
    return;
  }
  if (state.runner.clicks <= 0) throw new Error("Der Runner hat keine Clicks mehr.");
  state.runner.clicks -= 1;
}

function spendClicks(state: GameState, side: Side, amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) throw new Error("Click amount ist ungueltig.");
  if (side === "corp") {
    if (state.corp.clicks < amount) throw new Error("Die Korp hat nicht genug Clicks.");
    state.corp.clicks -= amount;
    return;
  }
  if (state.runner.clicks < amount) throw new Error("Der Runner hat nicht genug Clicks.");
  state.runner.clicks -= amount;
}

function randomHqAccess(state: GameState): CardInstanceId | undefined {
  if (state.corp.hq.length === 0) return undefined;
  const value = nextRandom(state, "hq_random_access");
  const index = Math.floor(value * state.corp.hq.length);
  return state.corp.hq[index];
}

function nextRandom(state: GameState, purpose: string): number {
  const value = deterministicNumber(`${state.seed}:${purpose}:${state.randomCounter}`);
  state.randomDrawRecords.push({ counter: state.randomCounter, purpose, value });
  state.randomCounter += 1;
  return value;
}

function deterministicNumber(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 0x100000000;
}

function hiddenVisibleCardId(id: CardInstanceId): CardInstanceId {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `hidden_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function shuffleIds(ids: CardInstanceId[], seed: string, purpose: string, random: { counter: number; records: GameState["randomDrawRecords"] }): CardInstanceId[] {
  const shuffled = ids.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const value = deterministicNumber(`${seed}:${purpose}:${random.counter}`);
    random.records.push({ counter: random.counter, purpose, value });
    random.counter += 1;
    const swapIndex = Math.floor(value * (index + 1));
    const current = mustArrayValue(shuffled, index, "Shuffle index missing.");
    shuffled[index] = mustArrayValue(shuffled, swapIndex, "Shuffle swap missing.");
    shuffled[swapIndex] = current;
  }
  return shuffled;
}

function shuffleStateIds(state: GameState, ids: CardInstanceId[], purpose: string): CardInstanceId[] {
  const random = { counter: state.randomCounter, records: state.randomDrawRecords };
  const shuffled = shuffleIds(ids, state.seed, purpose, random);
  state.randomCounter = random.counter;
  return shuffled;
}

function recordRandomMarkers(seed: string, purpose: string, amount: number, random: { counter: number; records: GameState["randomDrawRecords"] }): void {
  for (let index = 0; index < amount; index += 1) {
    const value = deterministicNumber(`${seed}:${purpose}:${random.counter}`);
    random.records.push({ counter: random.counter, purpose, value });
    random.counter += 1;
  }
}

function recordStateRandomMarkers(state: GameState, purpose: string, amount: number): void {
  const random = { counter: state.randomCounter, records: state.randomDrawRecords };
  recordRandomMarkers(state.seed, purpose, amount, random);
  state.randomCounter = random.counter;
}

function expandDeck(side: Side, cards: Array<{ id: string; quantity: number }>, instances: Record<CardInstanceId, CardInstance>): CardInstanceId[] {
  const ids: CardInstanceId[] = [];
  for (const card of cards) {
    for (let copy = 1; copy <= card.quantity; copy += 1) {
      const instance = createInstance(side, card.id, copy, side === "corp" ? { side: "corp", zone: "rd" } : { side: "runner", zone: "stack" });
      instances[instance.instanceId] = instance;
      ids.push(instance.instanceId);
    }
  }
  return ids;
}

function cardPoolVersionForDecks(runnerDeck: DeckDefinition, corpDeck: DeckDefinition): CardPoolVersion {
  if (usesMvp099CardPool(runnerDeck) || usesMvp099CardPool(corpDeck)) return "0.99.0";
  if (usesMvp098CardPool(runnerDeck) || usesMvp098CardPool(corpDeck)) return "0.98.0";
  if (usesMvp097CardPool(runnerDeck) || usesMvp097CardPool(corpDeck)) return "0.97.0";
  if (usesMvp096CardPool(runnerDeck) || usesMvp096CardPool(corpDeck)) return "0.96.0";
  if (usesMvp095CardPool(runnerDeck) || usesMvp095CardPool(corpDeck)) return "0.95.0";
  if (usesMvp094CardPool(runnerDeck) || usesMvp094CardPool(corpDeck)) return "0.94.0";
  if (usesMvp08CardPool(runnerDeck) || usesMvp08CardPool(corpDeck)) return "0.8.0";
  if (usesExpandedCardPool(runnerDeck) || usesExpandedCardPool(corpDeck)) return "0.4.0";
  return "0.1.0";
}

function baselineForCardPoolVersion(version: CardPoolVersion): RulesBaseline {
  if (version === "0.99.0") return MVP_0_99_BASELINE;
  if (version === "0.98.0") return MVP_0_98_BASELINE;
  if (version === "0.97.0") return MVP_0_97_BASELINE;
  if (version === "0.96.0") return MVP_0_96_BASELINE;
  if (version === "0.95.0") return MVP_0_95_BASELINE;
  if (version === "0.94.0") return MVP_0_94_BASELINE;
  if (version === "0.8.0") return MVP_0_8_BASELINE;
  if (version === "0.4.0") return MVP_0_4_BASELINE;
  return MVP_0_1_BASELINE;
}

function usesMvp099CardPool(deck: DeckDefinition): boolean {
  if (deck.id.endsWith("_099") || deck.id.includes("_0_99") || deck.id.includes("_v0_99")) return true;
  if (deck.identity.startsWith("v099_")) return true;
  return deck.cards.some((card) => card.id.startsWith("v099_"));
}

function usesMvp098CardPool(deck: DeckDefinition): boolean {
  if (usesMvp099CardPool(deck)) return true;
  if (deck.id.endsWith("_098") || deck.id.includes("_0_98") || deck.id.includes("_v0_98")) return true;
  if (deck.identity.startsWith("v098_")) return true;
  return deck.cards.some((card) => card.id.startsWith("v098_"));
}

function usesMvp097CardPool(deck: DeckDefinition): boolean {
  if (usesMvp098CardPool(deck)) return true;
  if (deck.id.endsWith("_097") || deck.id.includes("_0_97") || deck.id.includes("_v0_97")) return true;
  return deck.cards.some((card) => card.id.startsWith("v097_"));
}

function usesMvp096CardPool(deck: DeckDefinition): boolean {
  if (deck.id.endsWith("_096") || deck.id.includes("_0_96") || deck.id.includes("_v0_96")) return true;
  return deck.cards.some((card) => card.id.startsWith("v096_"));
}

function usesMvp095CardPool(deck: DeckDefinition): boolean {
  if (usesMvp096CardPool(deck)) return true;
  if (deck.id.endsWith("_095") || deck.id.includes("_0_95") || deck.id.includes("_v0_95")) return true;
  return deck.cards.some((card) => card.id.startsWith("v095_"));
}

function usesMvp094CardPool(deck: DeckDefinition): boolean {
  if (deck.id.endsWith("_094") || deck.id.includes("_0_94") || deck.id.includes("_v0_94")) return true;
  return deck.cards.some((card) => card.id.startsWith("v094_") || card.id.startsWith("onr_v1_"));
}

function usesMvp08CardPool(deck: DeckDefinition): boolean {
  if (usesMvp094CardPool(deck)) return true;
  if (deck.id.endsWith("_008") || deck.id.includes("_0_8") || deck.id.includes("_v0_8")) return true;
  return deck.cards.some((card) => card.id.startsWith("v08_"));
}

function usesExpandedCardPool(deck: DeckDefinition): boolean {
  if (usesMvp08CardPool(deck)) return true;
  if (deck.id.endsWith("_004") || deck.id.includes("_0_6")) return true;
  return deck.cards.some((card) =>
    [
      "simple_draw_event",
      "simple_setup_hardware",
      "efficient_fracter",
      "simple_priority_agenda",
      "simple_draw_operation",
      "simple_taxing_barrier_ice",
      "simple_upgrade",
      "simple_tag_ice",
      "simple_tag_punishment_operation"
    ].includes(card.id)
  );
}

function metadataForDeck(deck: DeckDefinition, cardPoolVersion: CardPoolVersion): DeckPublicMetadata {
  const expandedCardPool = cardPoolVersion !== "0.1.0";
  return {
    side: deck.side,
    identityCardId: deck.identity,
    deckName: deck.name,
    cardPoolSnapshotId:
      cardPoolVersion === "0.99.0"
        ? "card-snapshot-0.99"
        : cardPoolVersion === "0.98.0"
        ? "card-snapshot-0.98"
        : cardPoolVersion === "0.97.0"
        ? "card-snapshot-0.97"
        : cardPoolVersion === "0.96.0"
        ? "card-snapshot-0.96"
        : cardPoolVersion === "0.95.0"
          ? "card-snapshot-0.95"
          : cardPoolVersion === "0.94.0"
            ? "card-snapshot-0.94"
            : cardPoolVersion === "0.8.0"
              ? "card-snapshot-0.8"
              : expandedCardPool
                ? "card-snapshot-0.5"
                : "mvp-0.1-demo",
    formatProfileId:
      cardPoolVersion === "0.99.0"
        ? "local-demo-v0.99"
        : cardPoolVersion === "0.98.0"
        ? "local-demo-v0.98"
        : cardPoolVersion === "0.97.0"
        ? "local-demo-v0.97"
        : cardPoolVersion === "0.96.0"
        ? "local-demo-v0.96"
        : cardPoolVersion === "0.95.0"
          ? "local-demo-v0.95"
          : cardPoolVersion === "0.94.0"
            ? "local-demo-v0.94"
            : cardPoolVersion === "0.8.0"
              ? "local-demo-v0.8"
              : expandedCardPool
                ? "local-demo-v0.6"
                : "legacy-demo",
    deckHash: `legacy:${deck.id}`
  };
}

function isV097OrLater(state: GameState): boolean {
  return isVersionAtLeast(state, 97);
}

function isV099OrLater(state: GameState): boolean {
  return isVersionAtLeast(state, 99);
}

function isVersionAtLeast(state: GameState, minorGate: number): boolean {
  const version = state.baseline.engineSchemaVersion.split(".").map((part) => Number(part));
  const [major = 0, minor = 0, patch = 0] = version;
  if (major !== 0) return major > 0;
  if (minor !== minorGate) return minor > minorGate;
  return patch >= 0;
}

function canPlayCorpOperation(state: GameState, definition: CardDefinition): boolean {
  const resolver = CORP_OPERATION_RESOLVERS[definition.id];
  return Boolean(resolver && (resolver.canPlay?.(state) ?? true));
}

function resolveCorpOperation(state: GameState, definition: CardDefinition, legalAction: LegalAction): void {
  const resolver = CORP_OPERATION_RESOLVERS[definition.id];
  if (!resolver) throw new Error(`Kein Operation-Resolver fuer ${definition.id}.`);
  resolver.resolve(state, legalAction);
}

function createInstance(side: Side, definitionId: string, copy: number, zone: CardInstance["zone"]): CardInstance {
  return {
    instanceId: `${side}_${definitionId}_${copy}`,
    definitionId,
    owner: side,
    controller: side,
    zone,
    faceup: side === "runner" || DEMO_CARDS_BY_ID[definitionId]?.type === "identity",
    rezzed: side === "runner" || DEMO_CARDS_BY_ID[definitionId]?.type === "identity",
    advancementCounters: 0,
    strengthModifier: 0
  };
}

function removeFromAllZones(state: GameState, cardId: string): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== cardId);
    server.root = server.root.filter((id) => id !== cardId);
  }
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter((id) => id !== cardId);
  state.runner.rig.hardware = state.runner.rig.hardware.filter((id) => id !== cardId);
  state.runner.rig.resources = state.runner.rig.resources.filter((id) => id !== cardId);
  const specialZones = ensureSpecialZones(state);
  specialZones.setAside = specialZones.setAside.filter((id) => id !== cardId);
  specialZones.removedFromGame = specialZones.removedFromGame.filter((id) => id !== cardId);
}

function ensureSpecialZones(state: GameState): SpecialZoneState {
  state.specialZones ??= { setAside: [], removedFromGame: [] };
  state.specialZones.setAside ??= [];
  state.specialZones.removedFromGame ??= [];
  return state.specialZones;
}

function ensureRunnerTurnFlags(state: GameState): NonNullable<GameState["runnerTurnFlags"]> {
  state.runnerTurnFlags ??= {
    stoleAgendaThisTurn: false,
    stoleAgendaLastTurn: false,
    damagePreventionUsage: {}
  };
  state.runnerTurnFlags.damagePreventionUsage ??= {};
  return state.runnerTurnFlags;
}

function moveToSpecialZone(state: GameState, legalAction: LegalAction, zone: SpecialZoneKind): void {
  const cardId = stringLegalPayload(legalAction, "cardId");
  const instance = mustInstance(state.cardInstances, cardId);
  const harness = state.specialZoneHarness;
  const harnessConfig = zone === "set_aside" ? harness?.setAside : harness?.removedFromGame;
  if (!harness || harness.actor !== legalAction.side || harness.cardInstanceId !== cardId || !harnessConfig) {
    throw new Error("Special-Zone-Harness ist fuer diese Aktion nicht freigegeben.");
  }
  if (instance.zone.side === "special") throw new Error("Karte liegt bereits in einer Spezialzone.");
  const previousZone = instance.zone as Exclude<CardInstance["zone"], { side: "special" }>;
  const visibility = specialZoneVisibilityPayload(legalAction, harnessConfig.visibility);
  const visibilitySide = specialZoneVisibilitySidePayload(legalAction, harnessConfig.visibilitySide);
  removeFromAllZones(state, cardId);
  const specialZones = ensureSpecialZones(state);
  const target = zone === "set_aside" ? specialZones.setAside : specialZones.removedFromGame;
  target.push(cardId);
  target.sort();
  state.cardInstances[cardId] = {
    ...instance,
    zone: {
      side: "special",
      zone,
      visibility,
      ...(visibilitySide ? { visibilitySide } : {}),
      ...(zone === "set_aside" ? { returnZone: harness.setAside?.returnZone ?? previousZone } : {})
    }
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    specialZone: zone,
    specialZoneVisibility: visibility,
    ...(visibilitySide ? { specialZoneVisibilitySide: visibilitySide } : {}),
    specialZoneReason: String(legalAction.payload?.specialZoneReason ?? harnessConfig.reason ?? "v1.2.2_test_harness"),
    redactedKind: "special_zone"
  };
}

function returnFromSetAside(state: GameState, legalAction: LegalAction): void {
  const cardId = stringLegalPayload(legalAction, "cardId");
  const instance = mustInstance(state.cardInstances, cardId);
  const harness = state.specialZoneHarness;
  if (!harness?.setAside?.allowReturn || harness.actor !== legalAction.side || harness.cardInstanceId !== cardId) {
    throw new Error("Rueckkehr aus Set Aside ist nur test-only freigegeben.");
  }
  if (instance.zone.side !== "special" || instance.zone.zone !== "set_aside") throw new Error("Karte liegt nicht in Set Aside.");
  const returnZone = harness.setAside.returnZone ?? instance.zone.returnZone;
  if (!returnZone) throw new Error("Keine Rueckkehrzone fuer Set Aside definiert.");
  removeFromAllZones(state, cardId);
  placeCardInZone(state, cardId, returnZone);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), zone: returnZone };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    specialZone: "set_aside",
    specialZoneReason: String(legalAction.payload?.specialZoneReason ?? harness.setAside.reason ?? "v1.2.2_test_harness_return"),
    redactedKind: "special_zone"
  };
}

function changeCardControl(state: GameState, legalAction: LegalAction): void {
  const cardId = stringLegalPayload(legalAction, "cardId");
  const instance = mustInstance(state.cardInstances, cardId);
  const newController = sideLegalPayload(legalAction, "newController");
  const harness = state.specialZoneHarness;
  if (!harness?.controlChange || harness.actor !== legalAction.side || harness.cardInstanceId !== cardId || harness.controlChange.newController !== newController) {
    throw new Error("Control-Wechsel ist fuer diese Aktion nicht freigegeben.");
  }
  if (instance.controller === newController) throw new Error("Die Karte hat diesen Controller bereits.");
  state.cardInstances[cardId] = { ...instance, controller: newController };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    oldController: instance.controller,
    newController,
    controlChangeVisibility: harness.controlChange.visibility ?? "public",
    controlChangeReason: harness.controlChange.reason ?? "v1.2.2_test_harness",
    ownershipChanged: false,
    redactedKind: "control_change"
  };
}

function placeCardInZone(state: GameState, cardId: CardInstanceId, zone: Exclude<CardInstance["zone"], { side: "special" }>): void {
  if (zone.side === "corp" && zone.zone === "hq") state.corp.hq.push(cardId);
  else if (zone.side === "corp" && zone.zone === "rd") state.corp.rd.push(cardId);
  else if (zone.side === "corp" && zone.zone === "archives") state.corp.archives.push(cardId);
  else if (zone.side === "corp" && zone.zone === "scoreArea") state.corp.scoreArea.push(cardId);
  else if (zone.side === "corp" && zone.zone === "serverIce") mustServer(state, zone.serverId).ice.push(cardId);
  else if (zone.side === "corp" && zone.zone === "serverRoot") mustServer(state, zone.serverId).root.push(cardId);
  else if (zone.side === "runner" && zone.zone === "grip") state.runner.grip.push(cardId);
  else if (zone.side === "runner" && zone.zone === "stack") state.runner.stack.push(cardId);
  else if (zone.side === "runner" && zone.zone === "heap") state.runner.heap.push(cardId);
  else if (zone.side === "runner" && zone.zone === "scoreArea") state.runner.scoreArea.push(cardId);
  else if (zone.side === "runner" && zone.zone === "rig") {
    const definition = definitionFor(state, cardId);
    if (definition.type === "program") state.runner.rig.programs.push(cardId);
    else if (definition.type === "hardware") state.runner.rig.hardware.push(cardId);
    else if (definition.type === "resource") state.runner.rig.resources.push(cardId);
    else throw new Error("Nur Runner-Programme, Hardware und Resources koennen in die Rig zurueckkehren.");
  }
}

function specialZoneVisibilityPayload(legalAction: LegalAction, fallback: SpecialZoneVisibility): SpecialZoneVisibility {
  const value = legalAction.payload?.specialZoneVisibility;
  return value === "public" || value === "side_private" || value === "hidden" || value === "replay_only" ? value : fallback;
}

function specialZoneVisibilitySidePayload(legalAction: LegalAction, fallback: Side | undefined): Side | undefined {
  const value = legalAction.payload?.specialZoneVisibilitySide;
  return value === "corp" || value === "runner" ? value : fallback;
}

function stringLegalPayload(legalAction: LegalAction, key: string): string {
  const value = legalAction.payload?.[key];
  if (typeof value !== "string" || value.length === 0) throw new Error(`Payload ${key} fehlt.`);
  return value;
}

function sideLegalPayload(legalAction: LegalAction, key: string): Side {
  const value = legalAction.payload?.[key];
  if (value !== "corp" && value !== "runner") throw new Error(`Payload ${key} ist keine Seite.`);
  return value;
}

function createRemote(state: GameState): CorpServer {
  const remoteIds = state.corp.servers.filter((server) => server.kind === "remote").map((server) => Number(server.id.replace("remote_", "")));
  const nextId = Math.max(0, ...remoteIds) + 1;
  const server: CorpServer = { id: `remote_${nextId}`, kind: "remote", label: `Remote ${nextId}`, ice: [], root: [] };
  state.corp.servers.push(server);
  return server;
}

function cleanupEmptyRemotes(state: GameState): void {
  state.corp.servers = state.corp.servers.filter((server) => server.kind !== "remote" || server.ice.length > 0 || server.root.length > 0 || state.run?.attackedServerId === server.id);
}

function resetBreakerStrength(state: GameState): void {
  for (const id of state.runner.rig.programs) {
    const instance = mustInstance(state.cardInstances, id);
    state.cardInstances[id] = { ...instance, strengthModifier: 0 };
  }
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition) throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}

function mustInstance(source: Record<CardInstanceId, CardInstance>, id: CardInstanceId): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

function mustRun(state: GameState): NonNullable<GameState["run"]> {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}

function mustServer(state: GameState, id: string): CorpServer {
  const server = state.corp.servers.find((candidate) => candidate.id === id);
  if (!server) throw new Error(`Server fehlt: ${id}`);
  return server;
}

function mustArrayValue<T>(values: T[], index: number, message: string): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}

function fail(state: GameState, code: EngineError["code"], message: string): EngineResult {
  return { ok: false, error: { code, message }, state };
}

function cloneState<T>(state: T): T {
  return structuredClone(state) as T;
}

function stripForHash(state: GameState): unknown {
  const copy = cloneState(state);
  copy.eventLog = [];
  return copy;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function isReplayAction(value: unknown): value is PlayerAction {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PlayerAction>;
  return typeof record.matchId === "string" && typeof record.side === "string" && typeof record.actionId === "string" && typeof record.clientKnownStateVersion === "number";
}
