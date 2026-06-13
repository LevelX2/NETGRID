import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import {
  ONR_V1_1_2K_CORP_DECK,
  ONR_V1_1_2K_RUNNER_DECK,
  apply,
  applyChoice,
  applyChoices,
  mustAction,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { CARD_IMPLEMENTATIONS } from "../../card-implementations/registry";
import {
  CURRENT_RULES_BASELINE,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type ServerId,
} from "@netgrid/shared";

const EMERGENCY_RIG = "onr_proteus_049_emergency-rig";
const RENT_TO_OWN = "onr_proteus_051_rent-to-own-contract";
const ICE_AND_DATA = "onr_proteus_111_ice-and-data-special-report";
const HERMAN = "onr_proteus_060_herman-revista";
const MARCEL = "onr_proteus_064_marcel-desoleil";
const OBFUSCATED = "onr_proteus_066_obfuscated-fortress";
const PAVIT = "onr_proteus_069_pavit-bharat";
const SIMON = "onr_proteus_073_simon-francisco";
const WALL = "onr_v1_279_wall-of-static";
const CHIHUAHUA = "onr_proteus_014_chihuahua";
const SIMPLE_ASSET = "simple_economy_asset";
const SIMPLE_AGENDA = "simple_agenda";
const SIMPLE_UPGRADE = "simple_upgrade";

const PRO019_IDS = [
  EMERGENCY_RIG,
  RENT_TO_OWN,
  HERMAN,
  MARCEL,
  OBFUSCATED,
  PAVIT,
  SIMON,
  ICE_AND_DATA,
] as const;

function corpActionState(seed: string): GameState {
  const state = createGameAfterSetup({
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
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.corp.credits = 20;
  state.runner.credits = 20;
  return state;
}

function removeEverywhere(state: GameState, cardId: CardInstanceId): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== cardId);
    server.root = server.root.filter((id) => id !== cardId);
  }
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
}

function addCorpHq(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.corp.hq.unshift(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function addRunnerGrip(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.runner.grip.unshift(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function addCorpIce(
  state: GameState,
  definitionId: string,
  id: string,
  serverId: Exclude<ServerId, "new_remote">,
  rezzed = false,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  let server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) {
    server = {
      id: serverId,
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  server.ice.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: rezzed,
    rezzed,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function addCorpRoot(
  state: GameState,
  definitionId: string,
  id: string,
  serverId: Exclude<ServerId, "new_remote">,
  rezzed = true,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  let server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) {
    server = {
      id: serverId,
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  server.root.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: rezzed,
    rezzed,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function addCorpRd(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.corp.rd.unshift(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function clearCorpHq(state: GameState): void {
  for (const cardId of state.corp.hq) {
    if (!state.corp.archives.includes(cardId)) state.corp.archives.push(cardId);
    state.cardInstances[cardId] = {
      ...mustExistingInstance(state, cardId),
      zone: { side: "corp", zone: "archives" },
    };
  }
  state.corp.hq = [];
}

function mustExistingInstance(state: GameState, cardId: CardInstanceId) {
  const instance = state.cardInstances[cardId];
  if (!instance) throw new Error(`Missing instance ${cardId}`);
  return instance;
}

function applySelected(
  state: GameState,
  side: "corp" | "runner",
  actionId: string,
): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function remoteServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
) {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error(`Missing server ${serverId}`);
  return server;
}

function forceRunAtServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): void {
  const server = remoteServer(state, serverId);
  state.run = {
    runId: `${state.matchId}_${serverId}_forced_run`,
    attackedServerId: serverId,
    phase: "movement",
    position: { kind: "server", serverId },
    ...(server.ice[0] ? { lastPassedIceId: server.ice[0] } : {}),
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    successful: false,
    accessCount: 2,
  };
  state.phase = "run";
  state.timingPoint = "run.jack_out_window";
  state.activeSide = "corp";
}

describe("PRO019 rule-contract baseline utilities", () => {
  it("registers exactly the eight PRO019 CardImplementation definitions", () => {
    const implementations = new Map(
      CARD_IMPLEMENTATIONS.map((implementation) => [
        implementation.cardDefinitionId,
        implementation,
      ]),
    );
    for (const cardDefinitionId of PRO019_IDS)
      expect(implementations.get(cardDefinitionId)).toBeDefined();
  });

  it("plays Emergency Rig through LegalActions with bounded nonzero X", () => {
    let state = corpActionState("pro019-emergency");
    addCorpHq(state, EMERGENCY_RIG, "emergency_1");
    const iceId = addCorpIce(state, WALL, "wall_1", "remote_1");

    const actions = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "play_operation" &&
        action.payload?.cardId === "emergency_1",
    );
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some((action) => action.payload?.xValue === 0)).toBe(false);
    expect(actions.every((action) => Number(action.payload?.xValue) >= 1)).toBe(
      true,
    );

    const selected = actions.find((action) => action.payload?.xValue === 1);
    expect(selected).toBeDefined();
    state = applySelected(state, "corp", selected!.actionId);

    expect(state.cardInstances[iceId]?.rezzed).toBe(true);
    expect(state.cardInstances[iceId]?.counters?.kludge).toBe(1);
    expect(hashState(state)).toMatch(/^fnv1a:/);
  });

  it("removes Kludge counters at Corp turn start and trashes ICE on the last counter", () => {
    let state = corpActionState("pro019-emergency-lifecycle");
    addCorpHq(state, EMERGENCY_RIG, "emergency_lifecycle");
    const iceId = addCorpIce(state, WALL, "wall_kludge", "remote_1");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        action.payload?.cardId === "emergency_lifecycle" &&
        action.payload?.xValue === 1,
    );
    state = apply(state, "corp", (action) => action.type === "end_turn");
    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.cardInstances[iceId]?.zone.zone).toBe("archives");
    expect(state.corp.archives).toContain(iceId);
  });

  it("plays Rent-to-Own Contract and binds Term counters to target rez cost", () => {
    let state = corpActionState("pro019-rent");
    addCorpHq(state, RENT_TO_OWN, "rent_1");
    const iceId = addCorpIce(state, WALL, "wall_2", "remote_1");

    const selected = getLegalActions(state, "corp").find(
      (action) =>
        action.type === "play_operation" && action.payload?.cardId === "rent_1",
    );
    expect(selected?.payload?.targetRezCost).toBeGreaterThan(0);
    state = applySelected(state, "corp", selected!.actionId);

    expect(state.cardInstances[iceId]?.rezzed).toBe(true);
    expect(state.cardInstances[iceId]?.counters?.term).toBe(
      selected!.payload?.targetRezCost,
    );
  });

  it("ticks Rent-to-Own Term counters according to Corp credits", () => {
    let payState = corpActionState("pro019-rent-pay");
    addCorpHq(payState, RENT_TO_OWN, "rent_pay");
    const payIce = addCorpIce(payState, WALL, "wall_term_pay", "remote_1");
    payState = apply(
      payState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        action.payload?.cardId === "rent_pay",
    );
    const startingTerm = payState.cardInstances[payIce]?.counters?.term ?? 0;
    payState.corp.credits = 2;
    payState = apply(payState, "corp", (action) => action.type === "end_turn");
    payState = apply(
      payState,
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(payState.corp.credits).toBe(0);
    expect(payState.cardInstances[payIce]?.counters?.term).toBe(
      startingTerm - 1,
    );
    expect(payState.cardInstances[payIce]?.rezzed).toBe(true);

    let growState = corpActionState("pro019-rent-grow");
    addCorpHq(growState, RENT_TO_OWN, "rent_grow");
    const growIce = addCorpIce(growState, WALL, "wall_term_grow", "remote_1");
    growState = apply(
      growState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        action.payload?.cardId === "rent_grow",
    );
    const growStartingTerm =
      growState.cardInstances[growIce]?.counters?.term ?? 0;
    growState.corp.credits = 1;
    growState = apply(
      growState,
      "corp",
      (action) => action.type === "end_turn",
    );
    growState = apply(
      growState,
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(growState.corp.credits).toBe(1);
    expect(growState.cardInstances[growIce]?.counters?.term).toBe(
      growStartingTerm + 1,
    );
  });

  it("offers Herman Revista only at start of run on its fort and reorders ICE privately", () => {
    let state = corpActionState("pro019-herman");
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    addCorpRoot(state, HERMAN, "herman_1", "remote_1", true);
    const outerIce = addCorpIce(state, WALL, "herman_outer", "remote_1", true);
    const innerIce = addCorpIce(
      state,
      CHIHUAHUA,
      "herman_inner",
      "remote_1",
      true,
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(state.pendingChoice?.source).toContain("corp.start_of_run_redirect");
    expect(
      state.pendingChoice?.options.some(
        (option) => option.id === "herman_herman_1",
      ),
    ).toBe(true);
    state = applyChoice(state, "corp", "herman_herman_1");
    expect(state.pendingChoice?.source).toContain("herman_reorder");
    state = applyChoices(state, "corp", [
      `card_${innerIce}`,
      `card_${outerIce}`,
    ]);
    expect(
      state.corp.servers.find((server) => server.id === "remote_1")?.ice,
    ).toEqual([innerIce, outerIce]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "herman_revista_reorder",
    });

    const wrongFort = corpActionState("pro019-herman-wrong-fort");
    wrongFort.activeSide = "runner";
    wrongFort.phase = "runner_action_phase";
    wrongFort.timingPoint = "runner_action.main";
    wrongFort.runner.clicks = 4;
    addCorpRoot(wrongFort, HERMAN, "herman_wrong", "remote_1", true);
    const hqRun = apply(
      wrongFort,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(hqRun.pendingChoice?.source ?? "").not.toContain(
      "corp.start_of_run_redirect",
    );
  });

  it("gates Marcel DeSoleil on run timing and top-two-R&D costs", () => {
    let state = corpActionState("pro019-marcel");
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    const marcelId = addCorpRoot(state, MARCEL, "marcel_1", "remote_1", true);
    addCorpIce(state, WALL, "marcel_wall", "remote_1", true);
    addCorpRd(state, WALL, "marcel_rd_1");
    addCorpRd(state, CHIHUAHUA, "marcel_rd_2");

    expect(
      getLegalActions(state, "corp").some(
        (action) => action.source === marcelId,
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    if (state.pendingChoice?.side === "corp")
      state = applyChoice(state, "corp", "pass");
    state.timingPoint = "run.jack_out_window";
    const selected = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" && action.source === marcelId,
    );
    const beforeRd = state.corp.rd.length;
    state = applySelected(state, "corp", selected.actionId);
    expect(state.corp.credits).toBe(18);
    expect(state.corp.rd.length).toBe(beforeRd - 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "trash_top_corp_rd",
    });

    const shortRd = corpActionState("pro019-marcel-short-rd");
    shortRd.activeSide = "runner";
    shortRd.phase = "runner_action_phase";
    shortRd.timingPoint = "runner_action.main";
    shortRd.runner.clicks = 4;
    const shortMarcel = addCorpRoot(
      shortRd,
      MARCEL,
      "marcel_short",
      "remote_1",
      true,
    );
    addCorpIce(shortRd, WALL, "marcel_short_wall", "remote_1", true);
    const keptRd = shortRd.corp.rd.slice(0, 1);
    const movedRd = shortRd.corp.rd.slice(1);
    shortRd.corp.rd = keptRd;
    for (const cardId of movedRd) {
      shortRd.corp.archives.push(cardId);
      shortRd.cardInstances[cardId] = {
        ...shortRd.cardInstances[cardId]!,
        zone: { side: "corp", zone: "archives" },
      };
    }
    const shortRun = apply(
      shortRd,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(
      getLegalActions(shortRun, "corp").some(
        (action) => action.source === shortMarcel,
      ),
    ).toBe(false);
  });

  it("opens Obfuscated Fortress spend declaration and applies run-end shortfall", () => {
    let state = corpActionState("pro019-obfuscated");
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    addCorpRoot(state, OBFUSCATED, "obfuscated_1", "remote_1", true);
    addCorpIce(state, WALL, "obfuscated_wall", "remote_1", true);
    state.runner.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(state.pendingChoice?.source).toContain("runner_spend_cap");
    state = applyChoice(state, "runner", "spend_3");
    expect(state.run?.runCreditSpendCap?.announcedSpendCap).toBe(3);
    expect(state.run?.runCreditSpendCap?.spentDuringRun).toBe(0);
    state.timingPoint = "run.jack_out_window";
    state = apply(state, "runner", (action) => action.type === "jack_out");
    expect(state.runner.credits).toBe(2);
  });

  it("scopes Simon Francisco and Pavit Bharat install actions to legal forts", () => {
    let simonState = corpActionState("pro019-simon-install");
    addCorpHq(simonState, SIMON, "simon_install");
    const simonServers = getLegalActions(simonState, "corp")
      .filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === "simon_install",
      )
      .map((action) => action.payload?.serverId);
    expect(simonServers).toEqual(["hq", "rd"]);

    let pavitState = corpActionState("pro019-pavit-install");
    addCorpHq(pavitState, PAVIT, "pavit_install");
    const pavitServers = getLegalActions(pavitState, "corp")
      .filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === "pavit_install",
      )
      .map((action) => action.payload?.serverId);
    expect(pavitServers).toContain("new_remote");
    expect(pavitServers).not.toContain("hq");
    expect(pavitServers).not.toContain("rd");
  });

  it("accesses Simon from HQ and reduces one later HQ stored-card access only", () => {
    let state = corpActionState("pro019-simon-hq-access");
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    state.purgeableRunnerVirusCounters = { corp: { vienna: 1 } };
    addCorpRoot(state, SIMON, "simon_hq_root", "hq", true);
    addCorpHq(state, WALL, "simon_hq_stored_1");
    addCorpHq(state, CHIHUAHUA, "simon_hq_stored_2");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.run?.accessedCardId).toBe("simon_hq_root");
    const queue = state.run?.breach?.queue ?? [];
    expect(queue[0]).toMatchObject({
      cardInstanceId: "simon_hq_root",
      zone: "remote_root",
      status: "accessed",
    });
    expect(
      queue.filter(
        (entry) => entry.zone === "hq" && entry.status === "skipped",
      ),
    ).toHaveLength(1);
    expect(
      queue.filter(
        (entry) => entry.zone === "hq" && entry.status === "pending",
      ),
    ).toHaveLength(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "reduce_current_access_queue",
    });
  });

  it("accesses Simon from R&D and is stable when no later stored-card access remains", () => {
    let state = corpActionState("pro019-simon-rd-access");
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    addCorpRoot(state, SIMON, "simon_rd_root", "rd", true);
    for (const cardId of state.corp.rd.slice()) {
      state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "archives" },
      };
    }

    const replayStart = structuredClone(state);
    const replayStartIndex = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.run?.accessedCardId).toBe("simon_rd_root");
    expect(state.run?.breach?.queue).toHaveLength(1);
    expect(
      state.run?.breach?.queue.some((entry) => entry.status === "skipped"),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
    });
    expect(hashState(state)).toMatch(/^fnv1a:/);
    expect(
      replayEvents(replayStart, state.eventLog.slice(replayStartIndex)).ok,
    ).toBe(true);
  });

  it("offers Pavit only at server approach and replaces fort cards through a redacted HQ choice", () => {
    let beforeServer = corpActionState("pro019-pavit-before-server");
    addCorpRoot(beforeServer, PAVIT, "pavit_before", "remote_1", false);
    addCorpIce(beforeServer, WALL, "pavit_before_ice", "remote_1", true);
    beforeServer.run = {
      runId: "pavit_before_run",
      attackedServerId: "remote_1",
      phase: "approach_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      approachedIceId: "pavit_before_ice" as CardInstanceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      accessCount: 1,
    };
    beforeServer.phase = "run";
    beforeServer.timingPoint = "run.jack_out_window";
    expect(
      getLegalActions(beforeServer, "corp").some(
        (action) => action.payload?.cardId === "pavit_before",
      ),
    ).toBe(false);

    let state = corpActionState("pro019-pavit-choice");
    const oldIce = addCorpIce(
      state,
      CHIHUAHUA,
      "pavit_old_ice",
      "remote_1",
      true,
    );
    const pavitId = addCorpRoot(
      state,
      PAVIT,
      "pavit_source",
      "remote_1",
      false,
    );
    const newIce = addCorpHq(state, WALL, "pavit_new_ice");
    const newRoot = addCorpHq(state, SIMPLE_UPGRADE, "pavit_new_root");
    addCorpHq(state, CHIHUAHUA, "pavit_extra_ice");
    forceRunAtServer(state, "remote_1");

    const rezAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" && action.payload?.cardId === pavitId,
    );
    state = applySelected(state, "corp", rezAction.actionId);
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 2,
      maxSelections: 2,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "ordered_fort_rebuild_sequence",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      String(newIce),
    );
    const invalid = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: mustAction(
        state,
        "corp",
        (action) => action.type === "resolve_choice",
      ).actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${newIce}`, `card_${newIce}`],
      },
      idempotencyKey: "pavit-invalid-duplicate",
    });
    expect(invalid.ok).toBe(false);
    expect(hashState(invalid.state)).toBe(hashState(state));
    expect(remoteServer(invalid.state, "remote_1").ice).toEqual([oldIce]);
    expect(remoteServer(invalid.state, "remote_1").root).toEqual([pavitId]);

    state = applyChoices(state, "corp", [`card_${newIce}`, `card_${newRoot}`]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "ordered_fort_rebuild_sequence",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      String(newIce),
    );
    const server = remoteServer(state, "remote_1");
    expect(server.ice).toEqual([newIce]);
    expect(server.root).toEqual([newRoot]);
    expect(state.corp.hq).toEqual(expect.arrayContaining([oldIce, pavitId]));
    expect(state.cardInstances[newIce]?.zone).toMatchObject({
      zone: "serverIce",
      serverId: "remote_1",
    });
    expect(state.cardInstances[newRoot]?.zone).toMatchObject({
      zone: "serverRoot",
      serverId: "remote_1",
    });
    expect(state.cardInstances[newIce]?.rezzed).toBe(false);
    expect(state.cardInstances[newRoot]?.rezzed).toBe(false);
  });

  it("rejects stale Pavit replacement choices without mutating the fort", () => {
    let state = corpActionState("pro019-pavit-stale-choice");
    clearCorpHq(state);
    const oldIce = addCorpIce(
      state,
      CHIHUAHUA,
      "pavit_stale_old_ice",
      "remote_1",
      true,
    );
    const pavitId = addCorpRoot(
      state,
      PAVIT,
      "pavit_stale_source",
      "remote_1",
      false,
    );
    const newIce = addCorpHq(state, WALL, "pavit_stale_new_ice");
    const newRoot = addCorpHq(state, SIMPLE_UPGRADE, "pavit_stale_new_root");
    addCorpHq(state, CHIHUAHUA, "pavit_stale_extra_ice");
    forceRunAtServer(state, "remote_1");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" && action.payload?.cardId === pavitId,
    );
    state.run = {
      ...state.run!,
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      approachedIceId: oldIce,
    };
    const beforeStaleHash = hashState(state);
    const beforeStaleEventCount = state.eventLog.length;

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: mustAction(
        state,
        "corp",
        (action) => action.type === "resolve_choice",
      ).actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${newIce}`, `card_${newRoot}`],
      },
      idempotencyKey: "pavit-stale-choice",
    });

    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale Pavit choice rejection.");
    expect(stale.error.message).not.toContain(String(newIce));
    expect(stale.error.message).not.toContain(String(newRoot));
    expect(hashState(stale.state)).toBe(beforeStaleHash);
    expect(stale.state.eventLog).toHaveLength(beforeStaleEventCount);
    expect(remoteServer(stale.state, "remote_1").ice).toEqual([oldIce]);
    expect(remoteServer(stale.state, "remote_1").root).toEqual([pavitId]);
    expect(stale.state.corp.hq).toEqual(
      expect.arrayContaining([newIce, newRoot]),
    );
  });

  it("does not offer Pavit when only individually plausible HQ cards form no legal set", () => {
    const state = corpActionState("pro019-pavit-no-joint-set");
    clearCorpHq(state);
    addCorpIce(state, CHIHUAHUA, "pavit_blocked_old_ice", "remote_1", true);
    const pavitId = addCorpRoot(
      state,
      PAVIT,
      "pavit_blocked_source",
      "remote_1",
      false,
    );
    addCorpHq(state, SIMPLE_ASSET, "pavit_blocked_asset");
    addCorpHq(state, SIMPLE_AGENDA, "pavit_blocked_agenda");
    forceRunAtServer(state, "remote_1");

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_ice" && action.payload?.cardId === pavitId,
      ),
    ).toBe(false);
  });

  it("allows Pavit to replace a fort with a jointly legal ICE and upgrade mix", () => {
    let state = corpActionState("pro019-pavit-joint-ice-upgrade");
    clearCorpHq(state);
    const oldIce = addCorpIce(
      state,
      CHIHUAHUA,
      "pavit_mix_old_ice",
      "remote_1",
      true,
    );
    const pavitId = addCorpRoot(
      state,
      PAVIT,
      "pavit_mix_source",
      "remote_1",
      false,
    );
    const newIce = addCorpHq(state, WALL, "pavit_mix_new_ice");
    const newUpgrade = addCorpHq(
      state,
      SIMPLE_UPGRADE,
      "pavit_mix_new_upgrade",
    );
    forceRunAtServer(state, "remote_1");
    const replayStart = structuredClone(state);
    const replayStartIndex = state.eventLog.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" && action.payload?.cardId === pavitId,
    );

    const server = remoteServer(state, "remote_1");
    expect(server.ice).toEqual([newIce]);
    expect(server.root).toEqual([newUpgrade]);
    expect(state.corp.hq).toEqual(expect.arrayContaining([oldIce, pavitId]));
    expect(hashState(state)).toMatch(/^fnv1a:/);
    expect(
      replayEvents(replayStart, state.eventLog.slice(replayStartIndex)).ok,
    ).toBe(true);
  });

  it("rejects a Pavit choice that is individually plausible but jointly illegal without leaking HQ cards", () => {
    let state = corpActionState("pro019-pavit-invalid-joint-choice");
    clearCorpHq(state);
    addCorpIce(state, CHIHUAHUA, "pavit_invalid_old_ice", "remote_1", true);
    const pavitId = addCorpRoot(
      state,
      PAVIT,
      "pavit_invalid_source",
      "remote_1",
      false,
    );
    addCorpHq(state, WALL, "pavit_invalid_new_ice");
    addCorpHq(state, SIMPLE_UPGRADE, "pavit_invalid_upgrade");
    const assetId = addCorpHq(state, SIMPLE_ASSET, "pavit_invalid_asset");
    const agendaId = addCorpHq(state, SIMPLE_AGENDA, "pavit_invalid_agenda");
    forceRunAtServer(state, "remote_1");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" && action.payload?.cardId === pavitId,
    );
    const beforeInvalidHash = hashState(state);
    const beforeInvalidEventCount = state.eventLog.length;
    const invalid = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: mustAction(
        state,
        "corp",
        (action) => action.type === "resolve_choice",
      ).actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${assetId}`, `card_${agendaId}`],
      },
      idempotencyKey: "pavit-invalid-joint-set",
    });

    expect(invalid.ok).toBe(false);
    if (invalid.ok) throw new Error("Expected Pavit choice rejection.");
    expect(invalid.error.message).not.toContain(String(assetId));
    expect(invalid.error.message).not.toContain(String(agendaId));
    expect(invalid.error.message).not.toContain(SIMPLE_ASSET);
    expect(invalid.error.message).not.toContain(SIMPLE_AGENDA);
    expect(hashState(invalid.state)).toBe(beforeInvalidHash);
    expect(invalid.state.eventLog).toHaveLength(beforeInvalidEventCount);
    const runnerView = JSON.stringify(getPlayerView(invalid.state, "runner"));
    expect(runnerView).not.toContain(String(assetId));
    expect(runnerView).not.toContain(String(agendaId));
  });

  it("counts Obfuscated Fortress run cap across trace/link payments", () => {
    let state = corpActionState("pro019-obfuscated-trace-cap");
    const sourceIce = addCorpIce(
      state,
      WALL,
      "obfuscated_trace_source",
      "remote_1",
      true,
    );
    state.runner.credits = 5;
    state.run = {
      runId: "obfuscated_trace_run",
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      approachedIceId: sourceIce,
      encounteredIceId: sourceIce,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      accessCount: 1,
      runCreditSpendCap: {
        sourceCardInstanceId: "obfuscated_trace" as CardInstanceId,
        sourceDefinitionId: OBFUSCATED as CardDefinitionId,
        announcedSpendCap: 1,
        spentDuringRun: 0,
      },
    };
    state.trace = {
      traceId: "obfuscated_trace",
      sourceCardInstanceId: sourceIce,
      sourceDefinitionId: WALL as CardDefinitionId,
      baseTraceStrength: 1,
      corpBidMax: 0,
      corpBid: 0,
      traceStrength: 1,
      runnerLink: 0,
      status: "runner_bid",
      successEffect: { type: "add_tag", amount: 1 },
      returnPhase: state.phase,
      returnTimingPoint: state.timingPoint,
      returnActiveSide: state.activeSide,
    };
    state.pendingChoice = {
      choiceId: "obfuscated_trace.runner.bid",
      side: "runner",
      source: "trace:obfuscated_trace",
      prompt: "Runner Link-Bid wählen",
      kind: "bid_amount",
      options: [
        { id: "bid_0", label: "0 Credits", publicLabel: "0 Credits", value: 0 },
        { id: "bid_1", label: "1 Credit", publicLabel: "1 Credit", value: 1 },
        { id: "bid_2", label: "2 Credits", publicLabel: "2 Credits", value: 2 },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    state.activeSide = "runner";
    const tooMuch = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mustAction(
        state,
        "runner",
        (action) => action.type === "resolve_choice",
      ).actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["bid_2"],
      },
      idempotencyKey: "obfuscated-trace-too-much",
    });
    expect(tooMuch.ok).toBe(false);
    state = applyChoice(state, "runner", "bid_1");
    expect(state.run?.runCreditSpendCap?.spentDuringRun).toBe(1);
  });

  it("plays Ice and Data Special Report for cost 3 and opens a private expose choice", () => {
    let state = corpActionState("pro019-ice-data");
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    addRunnerGrip(state, ICE_AND_DATA, "ice_data_1");
    addCorpIce(state, WALL, "wall_3", "remote_1");
    const replayStart = structuredClone(state);
    const replayStartIndex = state.eventLog.length;

    const selected = getLegalActions(state, "runner").find(
      (action) =>
        action.type === "play_event" && action.payload?.cardId === "ice_data_1",
    );
    expect(selected?.costs[0]?.credits).toBe(3);
    state = applySelected(state, "runner", selected!.actionId);

    expect(state.pendingChoice?.source).toContain(
      "expose_installed_cards_fort_select",
    );
    expect(state.pendingChoice?.maxSelections).toBe(1);
    state = applyChoice(state, "runner", "fort_remote_1");
    expect(state.pendingChoice?.source).toContain("single_data_fort:remote_1");
    expect(state.pendingChoice?.minSelections).toBe(0);
    expect(state.pendingChoice?.maxSelections).toBe(1);
    expect(hashState(state)).toMatch(/^fnv1a:/);

    const replay = replayEvents(
      replayStart,
      state.eventLog.slice(replayStartIndex),
    );
    expect(replay.ok).toBe(true);
  });

  it("rejects Ice and Data selections across multiple forts and allows zero selections", () => {
    let state = corpActionState("pro019-ice-data-fort-scope");
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    addRunnerGrip(state, ICE_AND_DATA, "ice_data_scope");
    const remoteIce = addCorpIce(state, WALL, "ice_data_remote", "remote_1");
    const hqIce = addCorpIce(state, WALL, "ice_data_hq", "hq");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === "ice_data_scope",
    );
    const invalid = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mustAction(
        state,
        "runner",
        (action) => action.type === "resolve_choice",
      ).actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${remoteIce}`, `card_${hqIce}`],
      },
      idempotencyKey: "ice-data-cross-fort",
    });
    expect(invalid.ok).toBe(false);

    state = applyChoice(state, "runner", "fort_none");
    expect(state.pendingChoice).toBeUndefined();
    expect(hashState(state)).toMatch(/^fnv1a:/);
  });
});
