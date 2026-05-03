import {
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  MVP_0_1_BASELINE,
  MVP_0_4_BASELINE,
  type ActionType,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type CorpServer,
  type CreateGameConfig,
  type DeckDefinition,
  type DeckPublicMetadata,
  type DemoDeckId,
  type EngineError,
  type EngineResult,
  type GameEvent,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type PlayerController,
  type PlayerView,
  type PublicGameEvent,
  type ReplayResult,
  type RulesBaseline,
  type ServerId,
  type Side,
  type StateHash,
  type ValidationResult,
  type VisibleCard,
  type Winner
} from "@netrunner/shared";

export {
  DEMO_CARDS,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  MVP_0_1_BASELINE,
  MVP_0_2_BASELINE,
  MVP_0_3_BASELINE,
  MVP_0_4_BASELINE
} from "@netrunner/shared";

export type {
  ActionType,
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  CreateGameConfig,
  DeckDefinition,
  DeckPublicMetadata,
  DemoDeckId,
  EngineError,
  EngineResult,
  GameEvent,
  GameState,
  LegalAction,
  PlayerAction,
  PlayerView,
  PublicGameEvent,
  ReplayResult,
  RulesBaseline,
  Side,
  StateHash,
  ValidationResult,
  VisibleCard,
  Winner
} from "@netrunner/shared";

const DEFAULT_CONTROLLERS: { runner: PlayerController; corp: PlayerController } = {
  runner: { controllerId: "runner-local", side: "runner", type: "human_local", displayName: "Runner" },
  corp: { controllerId: "corp-ai", side: "corp", type: "ai", displayName: "Corp KI" }
};

export function createGame(config: CreateGameConfig = {}): GameState {
  const seed = config.seed ?? "mvp-0.1-default-seed";
  const random = { counter: 0, records: [] as GameState["randomDrawRecords"] };
  const instances: Record<CardInstanceId, CardInstance> = {};
  const runnerDeckId = config.runnerDeckId ?? "demo_runner_001";
  const corpDeckId = config.corpDeckId ?? "demo_corp_001";
  const runnerDeckDefinition = config.runnerDeck ?? DEMO_DECKS[runnerDeckId];
  const corpDeckDefinition = config.corpDeck ?? DEMO_DECKS[corpDeckId];
  const expandedCardPool = usesExpandedCardPool(runnerDeckDefinition) || usesExpandedCardPool(corpDeckDefinition);
  const runnerDeckMetadata = config.runnerDeckMetadata ?? metadataForDeck(runnerDeckDefinition, expandedCardPool);
  const corpDeckMetadata = config.corpDeckMetadata ?? metadataForDeck(corpDeckDefinition, expandedCardPool);

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

  const runnerStack = shuffleIds(runnerDeck, seed, "runner_stack_shuffle", random);
  const corpRd = shuffleIds(corpDeck, seed, "corp_rd_shuffle", random);
  const runnerGrip = runnerStack.splice(0, 5);
  const corpHq = corpRd.splice(0, 5);

  for (const id of runnerGrip) instances[id] = { ...mustInstance(instances, id), zone: { side: "runner", zone: "grip" } };
  for (const id of runnerStack) instances[id] = { ...mustInstance(instances, id), zone: { side: "runner", zone: "stack" } };
  for (const id of corpHq) instances[id] = { ...mustInstance(instances, id), zone: { side: "corp", zone: "hq" } };
  for (const id of corpRd) instances[id] = { ...mustInstance(instances, id), zone: { side: "corp", zone: "rd" } };

  const state: GameState = {
    matchId: config.matchId ?? "local-demo-match",
    baseline: config.baseline ?? (expandedCardPool ? MVP_0_4_BASELINE : MVP_0_1_BASELINE),
    stateVersion: 0,
    seed,
    randomCounter: random.counter,
    randomDrawRecords: random.records,
    activeSide: "corp",
    phase: "corp_draw_phase",
    timingPoint: "corp_draw.mandatory_draw",
    corp: {
      identity: corpIdentity.instanceId,
      credits: 5,
      clicks: 3,
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
      tags: 0,
      memoryUsed: 0,
      memoryLimit: 4,
      grip: runnerGrip,
      stack: runnerStack,
      heap: [],
      scoreArea: [],
      rig: { programs: [], hardware: [] }
    },
    cardInstances: instances,
    eventLog: [],
    winner: null,
    agendaPointsToWin: config.agendaPointsToWin ?? (expandedCardPool ? 7 : 6),
    deckMetadata: {
      runner: runnerDeckMetadata,
      corp: corpDeckMetadata
    }
  };

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
      agendaPointsToWin: state.agendaPointsToWin
    }
  });

  return state;
}

export function getLegalActions(state: GameState, side: Side): LegalAction[] {
  if (state.winner || state.phase === "game_over") return [];
  if (side !== state.activeSide && state.timingPoint !== "run.approach_ice") return [];

  if (state.timingPoint === "corp_draw.mandatory_draw") {
    return side === "corp" ? [action(state, "corp", "mandatory_draw", "Corp Pflichtkarte ziehen", "game_rule")] : [];
  }

  if (state.timingPoint === "corp_action.main") return side === "corp" ? corpMainActions(state) : [];
  if (state.timingPoint === "runner_action.main") return side === "runner" ? runnerMainActions(state) : [];
  if (state.timingPoint === "run.approach_ice") return side === "corp" ? corpApproachActions(state) : [];
  if (state.timingPoint === "run.encounter_ice") return side === "runner" ? runnerEncounterActions(state) : [];
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

  const next = cloneState(state);
  const before = state.stateVersion;

  try {
    performAction(next, legalAction);
    checkWinConditions(next);
    const validation = validateGameState(next);
    if (!validation.ok) {
      return fail(state, "ERR_INVARIANT_FAILED", `Der Spielzustand ist ungültig: ${validation.errors[0] ?? "unbekannter Fehler"}`);
    }
  } catch (error) {
    return fail(state, "ERR_INVALID_TARGET", error instanceof Error ? error.message : "Die Aktion konnte nicht ausgeführt werden.");
  }

  next.stateVersion = before + 1;
  const stateHash = hashState(next);
  const event = buildEvent(before, next.stateVersion, stateHash, next, legalAction, playerAction);
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
    root: server.root.map((id) => visibleCorpCard(state, id, side, "root"))
  }));

  const run = state.run
    ? {
        attackedServerId: state.run.attackedServerId,
        phase: state.run.phase,
        ...(state.run.encounteredIceId ? { encounteredIce: visibleCorpCard(state, state.run.encounteredIceId, side, "ice") } : {}),
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
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          gripOrHq: state.runner.grip.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.runner.stack.length,
          heapOrArchives: state.runner.heap.map((id) => visibleOwnCard(state, id)),
          scoreArea: state.runner.scoreArea.map((id) => visibleOwnCard(state, id)),
          rig: [...state.runner.rig.programs, ...state.runner.rig.hardware].map((id) => visibleOwnCard(state, id)),
          memoryUsed: state.runner.memoryUsed,
          memoryLimit: state.runner.memoryLimit,
          tags: state.runner.tags
        }
      : {
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          gripOrHq: state.corp.hq.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.corp.rd.length,
          heapOrArchives: state.corp.archives.map((id) => visibleOwnCard(state, id)),
          scoreArea: state.corp.scoreArea.map((id) => visibleOwnCard(state, id)),
          tags: state.runner.tags
        },
    opponent: runnerSide
      ? {
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          tags: state.runner.tags,
          handCount: state.corp.hq.length,
          deckCount: state.corp.rd.length,
          scoreArea: state.corp.scoreArea.map((id) => visibleOwnCard(state, id))
        }
      : {
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          tags: state.runner.tags,
          handCount: state.runner.grip.length,
          deckCount: state.runner.stack.length,
          scoreArea: state.runner.scoreArea.map((id) => visibleOwnCard(state, id))
        },
    servers: visibleServers,
    ...(run ? { run } : {}),
    ...(state.deckMetadata
      ? {
          deckMetadata: {
            own: side === "runner" ? state.deckMetadata.runner : state.deckMetadata.corp,
            opponent: side === "runner" ? state.deckMetadata.corp : state.deckMetadata.runner
          }
        }
      : {}),
    publicEvents: state.eventLog.map(toPublicEvent),
    legalActions: getLegalActions(state, side),
    winner: state.winner
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

  for (const id of Object.keys(state.cardInstances)) {
    if (!placements.has(id)) errors.push(`CardInstance ${id} is not in any zone.`);
  }

  if (state.corp.credits < 0 || state.runner.credits < 0) errors.push("Credits must not be negative.");
  if (state.corp.clicks < 0 || state.runner.clicks < 0) errors.push("Clicks must not be negative.");
  if (state.runner.tags < 0) errors.push("Runner tags must not be negative.");
  if (state.runner.memoryUsed > state.runner.memoryLimit) errors.push("Runner memory limit exceeded.");
  if (state.run?.encounteredIceId && !state.cardInstances[state.run.encounteredIceId]) errors.push("Run references missing encountered ice.");

  return { ok: errors.length === 0, errors };
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
  const runnerPoints = agendaPoints(state, "runner");
  const corpPoints = agendaPoints(state, "corp");
  if (runnerPoints >= state.agendaPointsToWin && corpPoints >= state.agendaPointsToWin) state.winner = "draw";
  else if (runnerPoints >= state.agendaPointsToWin) state.winner = "runner";
  else if (corpPoints >= state.agendaPointsToWin) state.winner = "corp";
  if (state.winner) {
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
  actions.push(action(state, "corp", "gain_credit", "1 Credit nehmen", "basic_action", [{ clicks: 1 }]));
  if (state.corp.rd.length > 0) actions.push(action(state, "corp", "draw_card", "Karte ziehen", "basic_action", [{ clicks: 1 }]));
  for (const id of state.corp.hq) {
    const definition = definitionFor(state, id);
    if (definition.type === "operation" && state.corp.credits >= (definition.cost ?? 0) && (definition.id !== "simple_tag_punishment_operation" || state.runner.tags > 0)) {
      actions.push(action(state, "corp", "play_operation", `${definition.title} spielen`, id, [{ clicks: 1, credits: definition.cost ?? 0 }], { cardId: id }));
    }
    if (definition.type === "ice") {
      for (const server of state.corp.servers) {
        actions.push(action(state, "corp", "install_card", `ICE vor ${server.label} installieren`, id, [{ clicks: 1 }], { cardId: id, serverId: server.id, placement: "ice" }));
      }
    }
    if (definition.type === "agenda" || definition.type === "asset" || definition.type === "upgrade") {
      actions.push(action(state, "corp", "install_card", `Karte in neuem Remote installieren`, id, [{ clicks: 1 }], { cardId: id, serverId: "new_remote", placement: "root" }));
      for (const server of state.corp.servers.filter((candidate) => candidate.kind === "remote")) {
        actions.push(action(state, "corp", "install_card", `Karte in ${server.label} installieren`, id, [{ clicks: 1 }], { cardId: id, serverId: server.id, placement: "root" }));
      }
    }
  }
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      if (definition.type === "agenda") {
        if (state.corp.credits >= 1) actions.push(action(state, "corp", "advance_card", `Agenda in ${server.label} advancen`, id, [{ clicks: 1, credits: 1 }], { cardId: id }));
      }
      if ((definition.type === "asset" || definition.type === "upgrade") && !mustInstance(state.cardInstances, id).rezzed && state.corp.credits >= (definition.rezCost ?? 0)) {
        actions.push(action(state, "corp", "rez_ice", `Karte in ${server.label} rezzen`, id, [{ credits: definition.rezCost ?? 0 }], { cardId: id, rootRez: true }));
      }
    }
  }
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
    if (definition.type === "program" && state.runner.credits >= (definition.installCost ?? 0) && state.runner.memoryUsed + (definition.memoryCost ?? 0) <= state.runner.memoryLimit) {
      actions.push(action(state, "runner", "install_card", `${definition.title} installieren`, id, [{ clicks: 1, credits: definition.installCost ?? 0 }], { cardId: id }));
    }
    if (definition.type === "hardware" && state.runner.credits >= (definition.installCost ?? 0)) {
      actions.push(action(state, "runner", "install_card", `${definition.title} installieren`, id, [{ clicks: 1, credits: definition.installCost ?? 0 }], { cardId: id }));
    }
    if (definition.type === "event" && state.runner.credits >= (definition.cost ?? 0)) {
      if (definition.id === "simple_run_event") {
        for (const server of state.corp.servers) {
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
  actions.push(action(state, "runner", "end_turn", "Zug beenden", "game_rule"));
  return actions;
}

function corpApproachActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.approachedIceId) return [];
  const ice = mustInstance(state.cardInstances, run.approachedIceId);
  const definition = definitionFor(state, run.approachedIceId);
  const actions: LegalAction[] = [];
  if (!ice.rezzed && state.corp.credits >= (definition.rezCost ?? 0)) {
    actions.push(action(state, "corp", "rez_ice", `${definition.title} rezzen`, run.approachedIceId, [{ credits: definition.rezCost ?? 0 }], { cardId: run.approachedIceId }));
  }
  actions.push(action(state, "corp", "decline_rez", "Nicht rezzen", "game_rule"));
  return actions;
}

function runnerEncounterActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.encounteredIceId) return [];
  const encounteredIceId = run.encounteredIceId;
  const iceDefinition = definitionFor(state, run.encounteredIceId);
  const actions: LegalAction[] = [];
  for (const breakerId of state.runner.rig.programs) {
    const breaker = definitionFor(state, breakerId);
    const breakerStrength = (breaker.strength ?? 0) + mustInstance(state.cardInstances, breakerId).strengthModifier;
    const pump = breaker.abilities?.find((ability) => ability.type === "pump_strength");
    if (pump && state.runner.credits >= pump.cost.credits) {
      actions.push(action(state, "runner", "pump_breaker", `${breaker.title} pumpen`, breakerId, [{ credits: pump.cost.credits }], { breakerId, iceId: encounteredIceId }));
    }
    const breakAbility = breaker.abilities?.find((ability) => ability.type === "break_subroutine" && ability.iceSubtype && iceDefinition.subtypes.includes(ability.iceSubtype));
    if (breakAbility && breakerStrength >= (iceDefinition.strength ?? 0) && state.runner.credits >= breakAbility.cost.credits) {
      const subroutines = iceDefinition.subroutines ?? [];
      subroutines.forEach((subroutine, index) => {
        if (!run.brokenSubroutineIndexes.includes(index)) {
          actions.push(action(state, "runner", "break_subroutine", `${subroutine.id} brechen`, breakerId, [{ credits: breakAbility.cost.credits }], { breakerId, iceId: encounteredIceId, subroutineIndex: index }));
        }
      });
    }
  }
  actions.push(action(state, "runner", "continue_run", "Run fortsetzen", "game_rule"));
  return actions;
}

function runnerAccessActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.accessedCardId) {
    return [action(state, "runner", "access_card", "Karte accessen", "game_rule")];
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
  return [action(state, "runner", "decline_trash", "Access abschließen", "game_rule")];
}

function performAction(state: GameState, legalAction: LegalAction): void {
  switch (legalAction.type) {
    case "mandatory_draw":
      drawCorpCard(state);
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
        state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, zone: { side: "corp", zone: "archives" } };
        if (definition.id === "simple_economy_operation") state.corp.credits += 4;
        else if (definition.id === "simple_draw_operation") {
          drawCorpCard(state);
          drawCorpCard(state);
        } else if (definition.id === "simple_tag_punishment_operation") {
          if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
          state.runner.credits = Math.max(0, state.runner.credits - 2);
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
      scoreAgenda(state, String(legalAction.payload?.cardId));
      return;
    case "start_run":
      spendClick(state, "runner");
      startRun(state, String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">);
      return;
    case "rez_ice":
      rezCard(state, String(legalAction.payload?.cardId), legalAction.payload?.rootRez === true || legalAction.payload?.assetRez === true);
      return;
    case "decline_rez":
      passApproachedIce(state);
      return;
    case "pump_breaker":
      spendCredits(state, "runner", 1);
      mustInstance(state.cardInstances, String(legalAction.payload?.breakerId)).strengthModifier += 1;
      return;
    case "break_subroutine":
      spendCredits(state, "runner", 1);
      mustRun(state).brokenSubroutineIndexes.push(Number(legalAction.payload?.subroutineIndex));
      return;
    case "continue_run":
      continueRun(state);
      return;
    case "access_card":
      accessCurrentCard(state);
      return;
    case "steal_agenda":
      stealAgenda(state, mustRun(state).accessedCardId ?? "");
      return;
    case "trash_accessed_card":
      trashAccessedCard(state, mustRun(state).accessedCardId ?? "");
      return;
    case "decline_trash":
      finishRun(state, true);
      return;
    case "remove_tag":
      spendClick(state, "runner");
      spendCredits(state, "runner", 2);
      state.runner.tags = Math.max(0, state.runner.tags - 1);
      return;
    case "end_turn":
      endTurn(state, legalAction.side);
      return;
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
  if (definition.id === "simple_economy_event") {
    state.runner.credits += 4;
    return;
  }
  if (definition.id === "simple_draw_event") {
    drawRunnerCard(state);
    drawRunnerCard(state);
    return;
  }
  if (definition.id === "simple_run_event") {
    startRun(state, String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">, 2);
  }
}

function installCard(state: GameState, legalAction: LegalAction): void {
  const cardId = String(legalAction.payload?.cardId);
  const definition = definitionFor(state, cardId);
  spendClick(state, legalAction.side);
  if (legalAction.side === "runner") {
    spendCredits(state, "runner", definition.installCost ?? 0);
    removeFromAllZones(state, cardId);
    if (definition.type === "hardware") {
      state.runner.rig.hardware.push(cardId);
      if (definition.mechanics.includes("modify_memory_limit")) state.runner.memoryLimit += 1;
    } else {
      state.runner.rig.programs.push(cardId);
      state.runner.memoryUsed += definition.memoryCost ?? 0;
    }
    state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "runner", zone: "rig" } };
    return;
  }

  removeFromAllZones(state, cardId);
  const placement = legalAction.payload?.placement;
  if (placement === "ice") {
    const server = mustServer(state, String(legalAction.payload?.serverId));
    server.ice.unshift(cardId);
    state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: false, rezzed: false, zone: { side: "corp", zone: "serverIce", serverId: server.id } };
    return;
  }

  const server = legalAction.payload?.serverId === "new_remote" ? createRemote(state) : mustServer(state, String(legalAction.payload?.serverId));
  server.root.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: false, rezzed: false, zone: { side: "corp", zone: "serverRoot", serverId: server.id } };
}

function startRun(state: GameState, serverId: Exclude<ServerId, "new_remote">, pendingSuccessBonusCredits?: number): void {
  const server = mustServer(state, serverId);
  state.phase = "run";
  state.activeSide = "runner";
  state.run = {
    runId: `run_${state.stateVersion + 1}`,
    attackedServerId: server.id,
    phase: "approach_ice",
    position: server.ice.length > 0 ? { kind: "ice", serverId: server.id, iceIndex: 0 } : { kind: "server", serverId: server.id },
    brokenSubroutineIndexes: [],
    successful: false,
    ...(pendingSuccessBonusCredits ? { pendingSuccessBonusCredits } : {})
  };
  if (server.ice.length > 0) {
    const approachedIceId = mustArrayValue(server.ice, 0, "Server has no approached ice.");
    state.run.approachedIceId = approachedIceId;
    state.timingPoint = "run.approach_ice";
    state.activeSide = "corp";
  } else {
    enterAccess(state);
  }
}

function rezCard(state: GameState, cardId: string, rootRez: boolean): void {
  const definition = definitionFor(state, cardId);
  spendCredits(state, "corp", definition.rezCost ?? 0);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), rezzed: true, faceup: true };
  if (rootRez && definition.id === "simple_economy_asset") {
    state.corp.credits += 3;
    return;
  }
  if (rootRez) return;
  const run = mustRun(state);
  run.phase = "encounter_ice";
  run.encounteredIceId = cardId;
  run.brokenSubroutineIndexes = [];
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
    state.timingPoint = "run.encounter_ice";
    state.activeSide = "runner";
    return;
  }
  movePastCurrentIce(state);
}

function continueRun(state: GameState): void {
  const run = mustRun(state);
  if (run.phase !== "encounter_ice" || !run.encounteredIceId) {
    if (run.phase === "access") {
      finishRun(state, true);
      return;
    }
    throw new Error("Run kann in diesem Schritt nicht fortgesetzt werden.");
  }
  const definition = definitionFor(state, run.encounteredIceId);
  let ended = false;
  (definition.subroutines ?? []).forEach((subroutine, index) => {
    if (run.brokenSubroutineIndexes.includes(index) || ended) return;
    if (subroutine.type === "corp_gain_credit") state.corp.credits += subroutine.amount ?? 1;
    if (subroutine.type === "runner_lose_credits") state.runner.credits = Math.max(0, state.runner.credits - (subroutine.amount ?? 1));
    if (subroutine.type === "give_runner_tag") state.runner.tags += subroutine.amount ?? 1;
    if (subroutine.type === "end_the_run") ended = true;
  });
  resetBreakerStrength(state);
  if (ended) {
    finishRun(state, false);
    return;
  }
  movePastCurrentIce(state);
}

function movePastCurrentIce(state: GameState): void {
  const run = mustRun(state);
  if (run.position.kind !== "ice") throw new Error("Runner ist nicht an ICE positioniert.");
  const server = mustServer(state, run.position.serverId);
  const nextIndex = run.position.iceIndex + 1;
  if (nextIndex < server.ice.length) {
    const approachedIceId = mustArrayValue(server.ice, nextIndex, "Naechstes ICE fehlt.");
    state.run = {
      ...run,
      phase: "approach_ice",
      position: { kind: "ice", serverId: server.id, iceIndex: nextIndex },
      approachedIceId,
      brokenSubroutineIndexes: []
    };
    state.timingPoint = "run.approach_ice";
    state.activeSide = "corp";
    return;
  }
  state.run = { ...run, position: { kind: "server", serverId: server.id }, phase: "access" };
  enterAccess(state);
}

function enterAccess(state: GameState): void {
  const run = mustRun(state);
  state.run = { ...run, phase: "access", successful: true };
  state.timingPoint = "access.resolve_card";
  state.activeSide = "runner";
}

function accessCurrentCard(state: GameState): void {
  const run = mustRun(state);
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
  removeFromAllZones(state, cardId);
  state.runner.scoreArea.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "runner", zone: "scoreArea" } };
  finishRun(state, true);
}

function trashAccessedCard(state: GameState, cardId: string): void {
  const definition = definitionFor(state, cardId);
  spendCredits(state, "runner", definition.trashCost ?? 0);
  removeFromAllZones(state, cardId);
  state.corp.archives.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "corp", zone: "archives" } };
  finishRun(state, true);
}

function finishRun(state: GameState, successful: boolean): void {
  const bonus = successful ? state.run?.pendingSuccessBonusCredits ?? 0 : 0;
  state.runner.credits += bonus;
  resetBreakerStrength(state);
  delete state.run;
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.activeSide = "runner";
  cleanupEmptyRemotes(state);
}

function endTurn(state: GameState, side: Side): void {
  if (side === "runner") {
    state.activeSide = "corp";
    state.phase = "corp_draw_phase";
    state.timingPoint = "corp_draw.mandatory_draw";
    state.corp.clicks = 3;
    state.runner.clicks = 0;
    return;
  }
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 4;
  state.corp.clicks = 0;
}

function drawCorpCard(state: GameState): void {
  const cardId = state.corp.rd.shift();
  if (!cardId) {
    state.winner = "runner";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    return;
  }
  state.corp.hq.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), zone: { side: "corp", zone: "hq" } };
}

function drawRunnerCard(state: GameState): void {
  const cardId = state.runner.stack.shift();
  if (!cardId) return;
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), zone: { side: "runner", zone: "grip" } };
}

function scoreAgenda(state: GameState, cardId: string): void {
  const definition = definitionFor(state, cardId);
  if (definition.type !== "agenda") throw new Error("Nur Agendas koennen gescored werden.");
  if (mustInstance(state.cardInstances, cardId).advancementCounters < (definition.advancementRequirement ?? 0)) throw new Error("Agenda hat nicht genug Advancements.");
  removeFromAllZones(state, cardId);
  state.corp.scoreArea.push(cardId);
  state.cardInstances[cardId] = { ...mustInstance(state.cardInstances, cardId), faceup: true, rezzed: true, zone: { side: "corp", zone: "scoreArea" } };
  cleanupEmptyRemotes(state);
}

function action(
  state: GameState,
  side: Side,
  type: ActionType,
  label: string,
  source: LegalAction["source"],
  costs: LegalAction["costs"] = [],
  payload?: LegalAction["payload"]
): LegalAction {
  return {
    actionId: makeActionId(type, side, payload, source),
    side,
    type,
    label,
    source,
    timingPoint: state.timingPoint,
    costs,
    targetRequirements: [],
    visibility: type.startsWith("rez") || type === "score_agenda" ? "public" : "private_to_actor",
    expiresAtStateVersion: state.stateVersion,
    ...(payload ? { payload } : {})
  };
}

function makeActionId(type: ActionType, side: Side, payload: LegalAction["payload"] | undefined, source: LegalAction["source"]): string {
  const parts = [side, type, source === "basic_action" || source === "game_rule" ? "" : source];
  if (payload?.serverId) parts.push(String(payload.serverId));
  if (payload?.cardId) parts.push(String(payload.cardId));
  if (payload?.breakerId) parts.push(String(payload.breakerId));
  if (payload?.subroutineIndex !== undefined) parts.push(String(payload.subroutineIndex));
  return parts.filter(Boolean).join(".");
}

function buildEvent(before: number, after: number, stateHashAfter: StateHash, state: GameState, legalAction: LegalAction, playerAction: PlayerAction): GameEvent {
  const actor = legalAction.side;
  const reveal = revealForPublicEvent(state, legalAction);
  const publicPayload: Record<string, unknown> = {
    actor,
    actionType: legalAction.type,
    label: publicLabel(legalAction),
    ...reveal
  };
  return {
    eventId: `evt_${after}`,
    type: legalAction.type,
    stateVersionBefore: before,
    stateVersionAfter: after,
    stateHashAfter,
    publicPayload,
    privatePayload: {
      [actor]: {
        action: playerAction,
        legalAction
      }
    }
  };
}

function publicLabel(legalAction: LegalAction): string {
  if (legalAction.side === "corp" && legalAction.type === "install_card") return "Corp installiert eine Karte.";
  if (legalAction.side === "corp" && legalAction.type === "advance_card") return "Corp advanced eine Karte.";
  return legalAction.label;
}

function revealForPublicEvent(state: GameState, legalAction: LegalAction): Record<string, unknown> {
  const revealsCard =
    ["rez_ice", "score_agenda", "steal_agenda", "trash_accessed_card", "play_event", "play_operation"].includes(legalAction.type) ||
    (legalAction.side === "runner" && legalAction.type === "install_card");
  if (revealsCard && typeof legalAction.source === "string") {
    const cardId = legalAction.payload?.cardId ?? legalAction.source;
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
    publicPayload: event.publicPayload
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
    ...(definition.rezCost !== undefined ? { rezCost: definition.rezCost } : {}),
    rezzed: instance.rezzed,
    advancementCounters: instance.advancementCounters,
    ...(definition.advancementRequirement !== undefined ? { advancementRequirement: definition.advancementRequirement } : {}),
    ...(definition.strength !== undefined ? { strength: definition.strength + instance.strengthModifier } : {}),
    ...(definition.agendaPoints !== undefined ? { agendaPoints: definition.agendaPoints } : {}),
    ...(definition.trashCost !== undefined ? { trashCost: definition.trashCost } : {})
  };
}

function visibleCorpCard(state: GameState, id: CardInstanceId, viewer: Side, area: "ice" | "root"): VisibleCard {
  const instance = mustInstance(state.cardInstances, id);
  const definition = definitionFor(state, id);
  const accessed = state.run?.accessedCardId === id;
  const visible = viewer === "corp" || instance.rezzed || accessed || state.corp.scoreArea.includes(id) || state.corp.archives.includes(id);
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

function agendaPoints(state: GameState, side: Side): number {
  const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
  return ids.reduce((sum, id) => sum + (definitionFor(state, id).agendaPoints ?? 0), 0);
}

function credits(state: GameState, side: Side, amount: number): void {
  if (side === "corp") state.corp.credits += amount;
  else state.runner.credits += amount;
}

function spendCredits(state: GameState, side: Side, amount: number): void {
  if (amount <= 0) return;
  if (side === "corp") {
    if (state.corp.credits < amount) throw new Error("Die Corp kann die Kosten nicht bezahlen.");
    state.corp.credits -= amount;
    return;
  }
  if (state.runner.credits < amount) throw new Error("Der Runner kann die Kosten nicht bezahlen.");
  state.runner.credits -= amount;
}

function spendClick(state: GameState, side: Side): void {
  if (side === "corp") {
    if (state.corp.clicks <= 0) throw new Error("Die Corp hat keine Clicks mehr.");
    state.corp.clicks -= 1;
    return;
  }
  if (state.runner.clicks <= 0) throw new Error("Der Runner hat keine Clicks mehr.");
  state.runner.clicks -= 1;
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

function usesExpandedCardPool(deck: DeckDefinition): boolean {
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

function metadataForDeck(deck: DeckDefinition, expandedCardPool: boolean): DeckPublicMetadata {
  return {
    side: deck.side,
    identityCardId: deck.identity,
    deckName: deck.name,
    cardPoolSnapshotId: expandedCardPool ? "card-snapshot-0.5" : "mvp-0.1-demo",
    formatProfileId: expandedCardPool ? "local-demo-v0.6" : "legacy-demo",
    deckHash: `legacy:${deck.id}`
  };
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
