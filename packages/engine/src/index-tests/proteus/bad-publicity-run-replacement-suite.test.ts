import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "../../index";
import {
  createDamageImminentEvent,
  openReplacementWindow,
} from "../../game/damage/damage-core";
import { rezCard } from "../../game/rez/rez-card";
import {
  ONR_V1_1_2K_CORP_DECK,
  ONR_V1_1_2K_RUNNER_DECK,
  apply,
  applyChoice,
  mustAction,
  sourceDefinition,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import {
  CURRENT_RULES_BASELINE,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type ServerId,
  type Side,
} from "@netgrid/shared";
import { CARD_IMPLEMENTATIONS } from "../../card-implementations/registry";

const FRAME_UP = "onr_proteus_109_frame-up";
const IDENTITY_DONOR = "onr_proteus_112_identity-donor";
const LIVE_NEWS_FEED = "onr_proteus_113_live-news-feed";
const SENATORIAL_FIELD_TRIP = "onr_proteus_123_senatorial-field-trip";
const SUBLIMINAL_CORRUPTION = "onr_proteus_125_subliminal-corruption";
const SCORCHED_EARTH = "onr_v1_302_scorched-earth";
const BLACK_ICE = "onr_v1_227_cerberus";
const TEST_BLACK_OPS_ASSET = "test_black_ops_asset";
const BLACK_OPS_AGENDA = "onr_proteus_002_charity-takeover";
const ADVERTISEMENT = "onr_v1_309_bbs-whispering-campaign";

const PRO015_IDS = [
  FRAME_UP,
  IDENTITY_DONOR,
  LIVE_NEWS_FEED,
  SENATORIAL_FIELD_TRIP,
  SUBLIMINAL_CORRUPTION,
] as const;

function baseState(seed: string): GameState {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      agendaPointsToWin: 7,
      runnerDeck: {
        ...ONR_V1_1_2K_RUNNER_DECK,
        id: `${seed}_runner`,
        cards: [...ONR_V1_1_2K_RUNNER_DECK.cards],
      },
      corpDeck: {
        ...ONR_V1_1_2K_CORP_DECK,
        id: `${seed}_corp`,
        cards: [...ONR_V1_1_2K_CORP_DECK.cards],
      },
    }),
  );
  state.runner.credits = 30;
  state.runner.clicks = 4;
  state.corp.credits = 30;
  state.corp.clicks = 4;
  return state;
}

function addRunnerGripCard(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.runner.grip.unshift(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    id: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  } as GameState["cardInstances"][CardInstanceId];
  return cardId;
}

function addCorpHqCard(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.corp.hq.unshift(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    id: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  } as GameState["cardInstances"][CardInstanceId];
  return cardId;
}

function addCorpRdCard(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.corp.rd.unshift(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    id: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  } as GameState["cardInstances"][CardInstanceId];
  return cardId;
}

function addCorpRootCard(
  state: GameState,
  definitionId: string,
  id: string,
  serverId: Exclude<ServerId, "new_remote">,
  rezzed = false,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  let server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) {
    server = { id: serverId, kind: "remote", label: "Remote 1", ice: [], root: [] };
    state.corp.servers.push(server);
  }
  server.root.unshift(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    id: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: rezzed,
    rezzed,
    advancementCounters: 0,
    strengthModifier: 0,
  } as GameState["cardInstances"][CardInstanceId];
  return cardId;
}

function addCorpIce(
  state: GameState,
  definitionId: string,
  id: string,
  serverId: Exclude<ServerId, "new_remote">,
  rezzed = true,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  let server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) {
    server = { id: serverId, kind: "remote", label: "Remote 1", ice: [], root: [] };
    state.corp.servers.push(server);
  }
  server.ice.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    id: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: rezzed,
    rezzed,
    advancementCounters: 0,
    strengthModifier: 0,
  } as GameState["cardInstances"][CardInstanceId];
  return cardId;
}

function removeEverywhere(state: GameState, cardId: CardInstanceId): void {
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== cardId);
    server.root = server.root.filter((id) => id !== cardId);
  }
}

function clearCorpZone(state: GameState, zone: "hq" | "rd"): void {
  for (const cardId of state.corp[zone]) {
    removeEverywhere(state, cardId);
    delete state.cardInstances[cardId];
  }
  state.corp[zone] = [];
}

function applyLegal(
  state: GameState,
  side: Side,
  action: LegalAction,
  idempotencyKey = `${side}-${state.stateVersion}-${action.actionId}`,
): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function playRunnerEvent(
  state: GameState,
  cardId: CardInstanceId,
  serverId?: ServerId,
): GameState {
  const action = mustAction(
    state,
    "runner",
    (candidate) =>
      candidate.type === "play_event" &&
      candidate.payload?.cardId === cardId &&
      (serverId === undefined || candidate.payload?.serverId === serverId),
  );
  return applyLegal(state, "runner", action);
}

function takeRunnerAction(
  state: GameState,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, "runner").find(predicate);
  if (!action)
    throw new Error(
      `Missing runner legal action; available=${getLegalActions(state, "runner")
        .map((candidate) => candidate.type)
        .join(",")}; timing=${state.timingPoint}; phase=${state.phase}; active=${state.activeSide}; runPhase=${state.run?.phase}; server=${state.run?.attackedServerId}; hq=${state.corp.hq.length}; rd=${state.corp.rd.length}; pending=${state.pendingChoice?.source ?? ""}`,
    );
  return applyLegal(state, "runner", action);
}

function accessAndStealAgenda(state: GameState): GameState {
  let next = takeRunnerAction(state, (action) => action.type === "access_card");
  next = takeRunnerAction(next, (action) => action.type === "steal_agenda");
  return next;
}

function trashAccessedCard(state: GameState): GameState {
  let next = takeRunnerAction(state, (action) => action.type === "access_card");
  next = takeRunnerAction(next, (action) => action.type === "trash_accessed_card");
  return next;
}

function executeRunScopedBlackOpsRezHook(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const definition: CardDefinition = {
    id: TEST_BLACK_OPS_ASSET as CardDefinitionId,
    title: "Test Black Ops Asset",
    side: "corp",
    type: "asset",
    subtypes: ["black_ops"],
    implementationStatus: "playable_mvp",
    cost: 0,
    installCost: 0,
    memoryCost: 0,
    strength: 0,
    rezCost: 0,
    trashCost: 0,
    advancementRequirement: 0,
    agendaPoints: 0,
    rulesText: "",
    mechanics: [],
  };
  const legalAction = {
    actionId: `corp.rez_ice.${cardId}`,
    type: "rez_ice",
    side: "corp",
    label: "Rez",
    source: cardId,
    costs: [],
    payload: { cardId, rootRez: true },
  } as unknown as LegalAction;
  rezCard(
    {
      state,
      cards: {
        definitionFor: () => definition,
        mustInstance: (id) => state.cardInstances[id]!,
        hasCardImplementationForDefinition: () => false,
        variableRezForDefinition: () => undefined,
        stableSubtypeList: (subtypes) => subtypes.slice().sort(),
      },
      run: {
        mustRun: () => state.run!,
        handleRunRootRezPostRez: () => undefined,
        beginEncounter: () => undefined,
      },
      payment: {
        rezCostForCard: () => 0,
        assertCorpRezCostQuoteValid: () => ({
          purpose: "corp_rez",
          side: "corp",
          targetCardId: cardId,
          baseCredits: 0,
          finalCredits: 0,
          costs: [],
          modifiers: [],
          canPay: true,
          publicPayload: {},
        }),
        creditCostForAction: () => 0,
        spendCredits: () => undefined,
      },
      corp: {
        isAcmeSavingsAndLoanDefinition: () => false,
        spendCorpAgendaPointCost: () => ({
          paidPoints: 0,
          bonusPointsSpent: 0,
          forfeitedAgendaIds: [],
          forfeitedAgendaDefinitionIds: [],
        }),
        acmeSavingsAndLoanObligationCount: () => 0,
      },
      runner: {
        ensureTurnFlags: () =>
          (state.runnerTurnFlags ??= {
            stoleAgendaThisTurn: false,
            stoleAgendaLastTurn: false,
          }),
      },
      counters: {
        setCardCounter: () => undefined,
      },
      lifecycle: {
        executeOnRez: () => undefined,
      },
      fort: {
        isParisTracePoolSource: () => false,
        parisTracePoolCapacityForCard: () => 0,
      },
      constants: {
        KRUMZ_TRACE_ASSET_CARD_ID: "onr_v1_312_chicago-branch" as CardDefinitionId,
      },
    },
    cardId,
    true,
    legalAction,
  );
}

function expectReplayStable(before: GameState, after: GameState): void {
  const replay = replayEvents(before, after.eventLog.slice(before.eventLog.length));
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(after));
}

describe("Proteus PRO015 Bad-Publicity Run/Replacement Suite", () => {
  it("registers exactly the five PRO015 CardImplementation definitions", () => {
    const implementations = new Set(
      CARD_IMPLEMENTATIONS.map((implementation) => implementation.cardDefinitionId),
    );
    for (const cardDefinitionId of PRO015_IDS)
      expect(implementations.has(cardDefinitionId)).toBe(true);
  });

  it("keeps Identity Donor out of normal Runner actions", () => {
    const state = baseState("pro015-identity-normal-action");
    const identityId = addRunnerGripCard(state, IDENTITY_DONOR, "identity_normal");
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" && action.payload?.cardId === identityId,
      ),
    ).toBe(false);
  });

  it("requires successful HQ and R&D runs for Frame-Up and adds the Black-Ops bonus only from relevant run history", () => {
    let state = baseState("pro015-frame-up");
    const frameId = addRunnerGripCard(state, FRAME_UP, "frame_up");

    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "play_event" && action.payload?.cardId === frameId,
      ),
    ).toBe(false);

    clearCorpZone(state, "hq");
    addCorpHqCard(state, BLACK_OPS_AGENDA, "frame_up_black_ops_hq");
    state = takeRunnerAction(
      state,
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = accessAndStealAgenda(state);
    clearCorpZone(state, "rd");
    addCorpRdCard(state, SCORCHED_EARTH, "frame_up_rd_access");
    state = takeRunnerAction(
      state,
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = takeRunnerAction(state, (action) => action.type === "access_card");
    const legal = mustAction(
      state,
      "runner",
      (action) => action.type === "play_event" && action.payload?.cardId === frameId,
    );
    expect(legal.costs).toEqual([{ clicks: 1, credits: 2 }]);
    state = applyLegal(state, "runner", legal);
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runnerTurnFlags?.successfulRdRunThisTurn).toBe(true);
    expect(
      state.runnerTurnFlags?.blackOpsLiberatedOrTrashedDuringSuccessfulHqOrRdRunThisTurn,
    ).toBe(true);
    expect(state.corp.badPublicity).toBe(2);

    state = baseState("pro015-frame-up-no-bonus");
    const noBonusFrameId = addRunnerGripCard(state, FRAME_UP, "frame_up_no_bonus");
    clearCorpZone(state, "hq");
    addCorpHqCard(state, SCORCHED_EARTH, "frame_up_plain_hq");
    state = takeRunnerAction(
      state,
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = takeRunnerAction(state, (action) => action.type === "access_card");
    clearCorpZone(state, "rd");
    addCorpRdCard(state, SCORCHED_EARTH, "frame_up_plain_rd");
    state = takeRunnerAction(
      state,
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = takeRunnerAction(state, (action) => action.type === "access_card");
    state = playRunnerEvent(state, noBonusFrameId);
    expect(state.corp.badPublicity).toBe(1);
  });

  it("resolves Live News Feed tags and Bad Publicity from encounter, rez, and steal production hooks", () => {
    let state = baseState("pro015-live-news-feed");
    const sourceId = addRunnerGripCard(state, LIVE_NEWS_FEED, "live_news");
    const blackIceId = addCorpIce(state, BLACK_ICE, "live_news_black_ice", "hq", true);
    clearCorpZone(state, "hq");
    addCorpHqCard(state, BLACK_OPS_AGENDA, "live_news_black_ops_agenda");
    const before = structuredClone(state);

    state = playRunnerEvent(state, sourceId, "hq");
    expect(state.run?.badPublicityRunAftermath?.kind).toBe("live_news_feed");
    state = takeRunnerAction(state, (action) => action.type === "continue_run");
    expect(state.run?.encounteredBlackIceCount).toBe(1);
    expect(state.run?.encounteredIceId).toBe(blackIceId);
    state.run = {
      ...state.run!,
      phase: "access",
      position: { kind: "server", serverId: "hq" },
    };
    delete state.run.approachedIceId;
    delete state.run.encounteredIceId;
    delete state.pendingChoice;
    delete state.trace;
    state.timingPoint = "access.resolve_card";
    const blackOpsId = addCorpRootCard(
      state,
      TEST_BLACK_OPS_ASSET,
      "live_news_black_ops_asset",
      "hq",
      false,
    );
    executeRunScopedBlackOpsRezHook(state, blackOpsId);
    expect(state.cardInstances[blackOpsId]?.rezzed).toBe(true);
    expect(state.run?.rezzedBlackOpsCount).toBe(1);
    removeEverywhere(state, blackOpsId);
    delete state.cardInstances[blackOpsId];

    state.activeSide = "runner";
    state.timingPoint = "access.resolve_card";
    state = accessAndStealAgenda(state);
    expect(state.run).toBeUndefined();
    expect(state.runner.tags).toBe(2);
    expect(state.corp.badPublicity).toBe(3);

    expect(state.runner.tags).toBe(2);
    expect(state.corp.badPublicity).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      tagsAdded: 2,
      badPublicityAdded: 3,
    });
    expect(before.run).toBeUndefined();
  });

  it("counts only Advertisements trashed during the Subliminal Corruption run", () => {
    let state = baseState("pro015-subliminal");
    const sourceId = addRunnerGripCard(state, SUBLIMINAL_CORRUPTION, "subliminal");
    addCorpRootCard(state, ADVERTISEMENT, "advertisement_remote", "remote_1", true);
    state.runner.credits = 30;
    const before = structuredClone(state);

    state = playRunnerEvent(state, sourceId, "remote_1");
    expect(state.run?.badPublicityRunAftermath?.kind).toBe("subliminal_corruption");
    state = trashAccessedCard(state);

    expect(state.corp.badPublicity).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      badPublicityAdded: 1,
    });
    expect(before.run).toBeUndefined();
  });

  it("does not offer Identity Donor in Runner-turn run windows even when activeSide is corp", () => {
    const state = baseState("pro015-identity-runner-window");
    state.phase = "runner_action_phase";
    state.timingPoint = "run.approach_ice";
    state.activeSide = "corp";
    state.run = {
      runId: "identity_runner_window_run",
      attackedServerId: "hq",
      phase: "approach_ice",
      position: { kind: "ice", serverId: "hq", iceIndex: 0 },
    } as NonNullable<GameState["run"]>;
    addRunnerGripCard(state, IDENTITY_DONOR, "identity_runner_window");
    const event = createDamageImminentEvent(state, {
      damageId: "identity-runner-window",
      damageType: "meat",
      amount: 1,
      source: "test:runner_window",
    });
    const legalAction = {
      actionId: "test.damage",
      type: "trigger_ability",
      side: "corp",
      label: "Damage",
      source: "test",
      costs: [],
    } as unknown as LegalAction;

    expect(openReplacementWindow(state, event, legalAction)).toBe(false);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.replacementWindow).toBeUndefined();
  });

  it("opens Identity Donor only for Corp-turn Meat Damage, prevents it, moves the card to Heap, and uses the central BP loss gate", () => {
    let state = baseState("pro015-identity-donor");
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.runner.tags = 1;
    state.corp.badPublicity = 5;
    const identityId = addRunnerGripCard(state, IDENTITY_DONOR, "identity_donor");
    addCorpHqCard(state, SCORCHED_EARTH, "scorched");
    for (let index = 0; index < 5; index += 1)
      addRunnerGripCard(state, "onr_v1_012_clown", `grip_${index}`);
    const before = structuredClone(state);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === SCORCHED_EARTH,
    );
    expect(state.pendingChoice?.source).toBe("v121.replacement.damage");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    const optionId = state.pendingChoice?.options.find((option) =>
      option.id.includes("grip_meat_damage_replacement"),
    )?.id;
    expect(optionId).toBeDefined();

    state = applyChoice(state, "runner", String(optionId));
    expect(state.replacementWindow).toBeUndefined();
    expect(state.runner.grip).not.toContain(identityId);
    expect(state.runner.heap).toContain(identityId);
    expect(state.corp.badPublicity).toBe(7);
    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("bad_publicity_7");
    expectReplayStable(before, state);
  });

  it("offers Senatorial Field Trip only for the concrete Black ICE rezzed this turn and revalidates stale choices", () => {
    let state = baseState("pro015-senatorial-derez");
    const sourceId = addRunnerGripCard(state, SENATORIAL_FIELD_TRIP, "senatorial");
    const iceId = addCorpIce(state, BLACK_ICE, "black_ice", "hq", true);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "play_event" && action.payload?.cardId === sourceId,
      ),
    ).toBe(false);

    state.runnerTurnFlags ??= { stoleAgendaThisTurn: false, stoleAgendaLastTurn: false };
    state.runnerTurnFlags.lastRezzedBlackIceThisTurn = {
      cardId: iceId,
      definitionId: BLACK_ICE,
      serverId: "hq",
    };
    state = playRunnerEvent(state, sourceId);
    expect(state.pendingChoice?.source).toContain(
      "card_implementation.derez_last_rezzed_black_ice_or_bad_publicity",
    );

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: `corp.resolve_choice.${state.pendingChoice!.choiceId}`,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice!.choiceId,
        selectedOptionIds: ["derez"],
      },
      idempotencyKey: "stale-senatorial",
    });
    expect(stale.ok).toBe(false);

    state = applyChoice(state, "corp", "derez");
    expect(state.cardInstances[iceId]?.rezzed).toBe(false);

    let bpState = baseState("pro015-senatorial-bp");
    const bpSourceId = addRunnerGripCard(
      bpState,
      SENATORIAL_FIELD_TRIP,
      "senatorial_bp",
    );
    const bpIceId = addCorpIce(bpState, BLACK_ICE, "black_ice_bp", "hq", true);
    bpState.runnerTurnFlags ??= {
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: false,
    };
    bpState.runnerTurnFlags.lastRezzedBlackIceThisTurn = {
      cardId: bpIceId,
      definitionId: BLACK_ICE,
      serverId: "hq",
    };
    bpState = playRunnerEvent(bpState, bpSourceId);
    bpState = applyChoice(bpState, "corp", "bad_publicity");
    expect(bpState.cardInstances[bpIceId]?.rezzed).toBe(true);
    expect(bpState.corp.badPublicity).toBe(2);
  });

  it("rejects Senatorial Field Trip when the stored Black ICE target became stale", () => {
    let state = baseState("pro015-senatorial-stale-target");
    const sourceId = addRunnerGripCard(state, SENATORIAL_FIELD_TRIP, "senatorial_stale");
    const iceId = addCorpIce(state, BLACK_ICE, "black_ice_stale", "hq", true);
    state.runnerTurnFlags ??= { stoleAgendaThisTurn: false, stoleAgendaLastTurn: false };
    state.runnerTurnFlags.lastRezzedBlackIceThisTurn = {
      cardId: iceId,
      definitionId: BLACK_ICE,
      serverId: "hq",
    };
    state.cardInstances[iceId]!.rezzed = false;

    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "play_event" && action.payload?.cardId === sourceId,
      ),
    ).toBe(false);
  });

  it("records run-scoped Black-Ops agenda access for Frame-Up history without leaking stale global counters", () => {
    let state = baseState("pro015-frame-up-run-history");
    const frameId = addRunnerGripCard(state, FRAME_UP, "frame_up_after_runs");
    addCorpHqCard(state, BLACK_OPS_AGENDA, "black_ops_hq");
    state.runnerTurnFlags ??= { stoleAgendaThisTurn: false, stoleAgendaLastTurn: false };
    state.runnerTurnFlags.successfulHqRunThisTurn = true;
    state.runnerTurnFlags.successfulRdRunThisTurn = true;
    state.runnerTurnFlags.blackOpsLiberatedOrTrashedDuringSuccessfulHqOrRdRunThisTurn =
      true;

    state = playRunnerEvent(state, frameId);
    expect(state.corp.badPublicity).toBe(2);
  });
});
