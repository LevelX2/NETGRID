import { shuffleIds, recordRandomMarkers } from "./state/draw-random";
import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
// ARCH-3: Setup functions are the first real game-facade extraction step.
// No run/action/access/payment logic belongs here; GameState types stay in @netgrid/shared.
import {
  CURRENT_RULES_BASELINE,
  DEFAULT_TRACE_RULES_PROFILE,
  DEMO_DECKS,
  ORIGINALSET_DEFAULT_DECKS,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type ChoiceRequest,
  type CreateGameConfig,
  type GameState,
  type ModifierKind,
  type Side,
} from "@netgrid/shared";
import { cardPoolVersionForDecks, metadataForDeck } from "../card-pool";
import { hashStateSnapshot } from "../state-hash";
import { cardInstanceIdForCopy } from "./state/card-instance-id";

const STANDARD_AGENDA_POINTS_TO_WIN = 7;
const INITIAL_HAND_SIZE = 5;
const BASE_MAX_HAND_SIZE = 5;

export function createGame(config: CreateGameConfig = {}): GameState {
  const seed = config.seed ?? "mvp-0.1-default-seed";
  const random = { counter: 0, records: [] as GameState["randomDrawRecords"] };
  const instances: Record<CardInstanceId, CardInstance> = {};
  const runnerDeckDefinition =
    config.runnerDeck ??
    (config.runnerDeckId
      ? DEMO_DECKS[config.runnerDeckId]
      : ORIGINALSET_DEFAULT_DECKS.runner);
  const corpDeckDefinition =
    config.corpDeck ??
    (config.corpDeckId
      ? DEMO_DECKS[config.corpDeckId]
      : ORIGINALSET_DEFAULT_DECKS.corp);
  const cardPoolVersion = cardPoolVersionForDecks(
    runnerDeckDefinition,
    corpDeckDefinition,
  );
  const runnerDeckMetadata =
    config.runnerDeckMetadata ??
    metadataForDeck(runnerDeckDefinition, cardPoolVersion);
  const corpDeckMetadata =
    config.corpDeckMetadata ??
    metadataForDeck(corpDeckDefinition, cardPoolVersion);

  const runnerIdentity = createInstance(
    "runner",
    runnerDeckDefinition.identity,
    0,
    {
      side: "runner",
      zone: "rig",
    },
  );
  const corpIdentity = createInstance("corp", corpDeckDefinition.identity, 0, {
    side: "corp",
    zone: "scoreArea",
  });
  instances[runnerIdentity.instanceId] = runnerIdentity;
  instances[corpIdentity.instanceId] = corpIdentity;

  const runnerDeck = expandDeck(
    "runner",
    runnerDeckDefinition.cards,
    instances,
  );
  const corpDeck = expandDeck("corp", corpDeckDefinition.cards, instances);

  const runnerStack = shuffleIds(
    runnerDeck,
    seed,
    [1],
    random,
  );
  const corpRd = shuffleIds(
    corpDeck,
    seed,
    [2],
    random,
  );
  const runnerGrip = runnerStack.splice(0, INITIAL_HAND_SIZE);
  const corpHq = corpRd.splice(0, INITIAL_HAND_SIZE);
  recordRandomMarkers(
    seed,
    [3],
    runnerGrip.length,
    random,
  );
  recordRandomMarkers(
    seed,
    [4],
    corpHq.length,
    random,
  );

  for (const id of runnerGrip)
    instances[id] = {
      ...mustInstance(instances, id),
      zone: { side: "runner", zone: "grip" },
    };
  for (const id of runnerStack)
    instances[id] = {
      ...mustInstance(instances, id),
      zone: { side: "runner", zone: "stack" },
    };
  for (const id of corpHq)
    instances[id] = {
      ...mustInstance(instances, id),
      zone: { side: "corp", zone: "hq" },
    };
  for (const id of corpRd)
    instances[id] = {
      ...mustInstance(instances, id),
      zone: { side: "corp", zone: "rd" },
    };

  const state: GameState = {
    matchId: config.matchId ?? "local-demo-match",
    baseline: config.baseline ?? CURRENT_RULES_BASELINE,
    traceRulesProfile: config.traceRulesProfile ?? DEFAULT_TRACE_RULES_PROFILE,
    stateVersion: 0,
    seed,
    randomCounter: random.counter,
    randomDrawRecords: random.records,
    aiTurnPlanRandomCounter: 0,
    aiTurnPlanRandomDrawRecords: [],
    activeSide: config.setupMode === "completed" ? "corp" : "runner",
    phase: config.setupMode === "completed" ? "corp_draw_phase" : "setup",
    timingPoint:
      config.setupMode === "completed"
        ? "corp_draw.mandatory_draw"
        : "setup.mulligan.runner",
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
        {
          id: "archives",
          kind: "archives",
          label: "Archives",
          ice: [],
          root: [],
        },
      ],
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
      rig: { programs: [], hardware: [], resources: [] },
    },
    specialZones: { setAside: [], removedFromGame: [] },
    cardInstances: instances,
    eventLog: [],
    winner: null,
    agendaPointsToWin:
      config.agendaPointsToWin ?? STANDARD_AGENDA_POINTS_TO_WIN,
    activeObligationDebtCount: 0,
    corpBonusAgendaPoints: 0,
    setup:
      config.setupMode === "completed"
        ? {
            status: "complete",
            initialHandSize: INITIAL_HAND_SIZE,
            resolved: { runner: "keep", corp: "keep" },
            mulligansTaken: {},
          }
        : {
            status: "mulligan_runner",
            initialHandSize: INITIAL_HAND_SIZE,
            resolved: {},
            mulligansTaken: {},
          },
    deckMetadata: {
      runner: runnerDeckMetadata,
      corp: corpDeckMetadata,
    },
    runnerTurnFlags: {
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: false,
      stolenAgendaAdvancementCountersThisTurn: 0,
      stolenAgendaAdvancementCountersLastTurn: 0,
      runnerReceivedTagThisTurn: false,
      stoleResearchAgendaThisTurn: false,
      stoleGrayOpsAgendaThisTurn: false,
      stoleBlackOpsAgendaThisTurn: false,
      runAttemptsThisTurn: 0,
      runAttemptsLastTurn: 0,
      runAttemptsThisGame: 0,
      trashedAdvertisementThisTurn: false,
      trashedTransactionsThisTurn: false,
      successfulHqRunThisTurn: false,
      successfulRunThisTurn: false,
      damagePreventionUsage: {},
      runnerActionOrdinal: 0,
    },
    corpTurnFlags: {
      scoredBlackOpsAgendaThisTurn: false,
      scoredBlackOpsAgendaLastTurn: false,
      counterPreventionUsedSourceIdsThisTurn: [],
    },
  };

  applyIdentityStaticModifiers(state);
  applyIdentitySetupAbilities(state);
  if (config.setupMode !== "completed")
    state.pendingChoice = setupMulliganChoice(state, "runner");

  const initialHash = hashStateSnapshot(state);
  state.eventLog.push({
    eventId: state.stateVersion + 1,
    type: "game_created",
    stateVersionBefore: 0,
    stateVersionAfter: 0,
    stateHashAfter: initialHash,
    publicPayload: {
      baseline: state.baseline,
      traceRulesProfile: state.traceRulesProfile,
      runnerDeckId: runnerDeckDefinition.id,
      corpDeckId: corpDeckDefinition.id,
      runnerDeck: runnerDeckMetadata,
      corpDeck: corpDeckMetadata,
      agendaPointsToWin: state.agendaPointsToWin,
      ...(state.setup ? { setupStatus: state.setup.status } : {}),
    },
  });

  return state;
}

export function createGameAfterSetup(config: CreateGameConfig = {}): GameState {
  return createGame({ ...config, setupMode: "completed" });
}

function expandDeck(
  side: Side,
  cards: Array<{ id: CardDefinitionId; quantity: number }>,
  instances: Record<CardInstanceId, CardInstance>,
): CardInstanceId[] {
  const ids: CardInstanceId[] = [];
  for (const card of cards) {
    for (let copy = 1; copy <= card.quantity; copy += 1) {
      const instance = createInstance(
        side,
        card.id,
        copy,
        side === "corp"
          ? { side: "corp", zone: "rd" }
          : { side: "runner", zone: "stack" },
      );
      instances[instance.instanceId] = instance;
      ids.push(instance.instanceId);
    }
  }
  return ids;
}

function createInstance(
  side: Side,
  definitionId: number,
  copy: number,
  zone: CardInstance["zone"],
): CardInstance {
  return {
    instanceId: cardInstanceIdForCopy(side, definitionId, copy),
    definitionId,
    owner: side,
    controller: side,
    zone,
    faceup:
      side === "runner" ||
      CARD_DEFINITIONS_BY_ID[definitionId]?.type === "identity",
    rezzed:
      side === "runner" ||
      CARD_DEFINITIONS_BY_ID[definitionId]?.type === "identity",
    advancementCounters: 0,
    strengthModifier: 0,
  };
}

function applyIdentityStaticModifiers(state: GameState): void {
  const memoryModifier = identityModifierAmount(
    state,
    "runner",
    "memory_limit",
    "static",
  );
  state.runner.memoryLimit += memoryModifier;
  if (
    !Number.isInteger(state.runner.memoryLimit) ||
    state.runner.memoryLimit < 0
  ) {
    throw new Error("Runner-Memory-Limit ist ungueltig.");
  }
}

function applyIdentitySetupAbilities(state: GameState): void {
  for (const side of ["corp", "runner"] as const) {
    const identity = identityDefinition(state, side);
    for (const modifier of identity.modifiers ?? []) {
      if (
        modifier.duration !== "setup" ||
        modifier.kind !== "starting_credits" ||
        modifier.side !== side
      )
        continue;
      if (!Number.isInteger(modifier.amount) || modifier.amount < 0)
        throw new Error("Setup-Credit-Modifier ist ungueltig.");
      addCredits(state, side, modifier.amount);
      recordIdentitySetupAbility(state, side, modifier.modifierId);
    }
  }
}

function identityModifierAmount(
  state: GameState,
  side: Side,
  kind: ModifierKind,
  duration: "setup" | "static",
): number {
  const identity = identityDefinition(state, side);
  return (identity.modifiers ?? [])
    .filter(
      (modifier) =>
        modifier.side === side &&
        modifier.kind === kind &&
        modifier.duration === duration,
    )
    .reduce((sum, modifier) => {
      if (!Number.isInteger(modifier.amount))
        throw new Error("Identity-Modifier ist ungueltig.");
      return sum + modifier.amount;
    }, 0);
}

function identityDefinition(state: GameState, side: Side): CardDefinition {
  return definitionFor(
    state,
    side === "runner" ? state.runner.identity : state.corp.identity,
  );
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}

function recordIdentitySetupAbility(
  state: GameState,
  side: Side,
  modifierId: string,
): void {
  const usage = (state.identityAbilityUsage ??= {});
  const sideUsage = (usage[side] ??= {
    setupAbilities: [],
    turn: 0,
    usedThisTurn: [],
  });
  if (!sideUsage.setupAbilities.includes(modifierId))
    sideUsage.setupAbilities.push(modifierId);
}

function setupMulliganChoice(
  state: GameState,
  side: Side,
  stateVersion = state.stateVersion,
): ChoiceRequest {
  return {
    choiceId: `setup_mulligan_${side}_${stateVersion}`,
    side,
    source: "setup.mulligan",
    prompt: side === "runner" ? "Runner-Starthand" : "Korp-Starthand",
    presentationKey: "setup_mulligan",
    kind: "select_option",
    options: [
      {
        id: "keep",
        label: "Starthand behalten",
        publicLabel: "Setup-Entscheidung",
      },
      {
        id: "mulligan",
        label: "Mulligan nehmen",
        publicLabel: "Setup-Entscheidung",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: "hidden_info_barrier",
  };
}

function addCredits(state: GameState, side: Side, amount: number): void {
  if (side === "corp") state.corp.credits += amount;
  else state.runner.credits += amount;
}

function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  id: CardInstanceId,
): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

function mustArrayValue<T>(values: T[], index: number, message: string): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}
