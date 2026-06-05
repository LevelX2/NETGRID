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
  mustAction,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import {
  CURRENT_RULES_BASELINE,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type ServerId,
  type Side,
} from "@netgrid/shared";
import { CARD_IMPLEMENTATIONS } from "../../card-implementations/registry";

const CYBERTECH = "onr_proteus_055_cybertech-think-tank";
const DEPARTMENT = "onr_proteus_056_department-of-misinformation";
const GOVERNMENT_CONTRACT = "onr_proteus_059_government-contract";
const LDL = "onr_proteus_061_ldl-traffic-analyzers";
const PANIC_BUTTON = "onr_proteus_067_panic-button";
const RAYMOND = "onr_proteus_071_raymond-ellison";
const SIREN = "onr_proteus_074_siren";
const SYD = "onr_proteus_076_syd-meyer-superstores";
const WALL = "onr_v1_279_wall-of-static";
const MOUSE = "onr_v1_042_mouse";
const SCORCHED_EARTH = "onr_v1_302_scorched-earth";

const PRO014_IDS = [
  CYBERTECH,
  DEPARTMENT,
  GOVERNMENT_CONTRACT,
  LDL,
  PANIC_BUTTON,
  RAYMOND,
  SIREN,
  SYD,
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
  state.runner.credits = 20;
  state.runner.clicks = 4;
  state.corp.credits = 20;
  state.corp.clicks = 4;
  return state;
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
  let server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) {
    server = { id: serverId, kind: "remote", label: "Remote 1", ice: [], root: [] };
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

function addCorpRd(state: GameState, definitionId: string, id: string): CardInstanceId {
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

function addRunnerProgram(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.runner.rig.programs.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function addRunnerGrip(state: GameState, id: string): void {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId: "onr_v1_001_afreet" as CardDefinitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
}

function removeEverywhere(state: GameState, cardId: CardInstanceId): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.root = server.root.filter((id) => id !== cardId);
    server.ice = server.ice.filter((id) => id !== cardId);
  }
  delete state.cardInstances[cardId];
}

function goCorpMain(state: GameState): GameState {
  let next = apply(state, "runner", (action) => action.type === "end_turn");
  if (next.timingPoint === "corp_draw.mandatory_draw")
    next = apply(next, "corp", (action) => action.type === "mandatory_draw");
  return next;
}

function applyLegal(state: GameState, side: Side, actionId: string): GameState {
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

function expectReplayStable(before: GameState, after: GameState): void {
  const replay = replayEvents(before, after.eventLog.slice(before.eventLog.length));
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(after));
}

function openCorpTraceBidWindow(state: GameState, sourceCardId: CardInstanceId): void {
  state.trace = {
    traceId: "pro014_trace",
    sourceCardInstanceId: sourceCardId,
    sourceDefinitionId: state.cardInstances[sourceCardId]!.definitionId,
    baseTraceStrength: 0,
    corpBidMax: 5,
    status: "corp_bid",
    successEffect: { type: "none" },
    returnPhase: "corp_action_phase",
    returnTimingPoint: "corp_action.main",
    returnActiveSide: "corp",
  };
  state.pendingChoice = {
    choiceId: "pro014_trace.corp.bid",
    side: "corp",
    source: "trace:pro014_trace",
    prompt: "Corp Trace-Bid",
    kind: "bid_amount",
    options: Array.from({ length: 6 }, (_, amount) => ({
      id: `bid_${amount}`,
      label: `${amount} Credits`,
      publicLabel: `${amount} Credits`,
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "public",
  };
}

describe("Proteus PRO014 Corp asset/upgrade utility suite", () => {
  it("registers exactly the eight PRO014 CardImplementation definitions", () => {
    const implementations = new Map(
      CARD_IMPLEMENTATIONS.map((implementation) => [
        implementation.cardDefinitionId,
        implementation,
      ]),
    );
    for (const cardDefinitionId of PRO014_IDS)
      expect(implementations.get(cardDefinitionId)).toBeDefined();
  });

  it("opens a corp Siren start-of-run window, supports pass and redirect, and rejects stale runner bypass", () => {
    const before = baseState("pro014-siren");
    const sirenId = addCorpRoot(before, SIREN, "siren_1", "remote_1", true);

    const runHq = mustAction(
      before,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(
      getLegalActions(before, "runner").some(
        (action) => action.payload?.sirenRedirectSourceCardId === sirenId,
      ),
    ).toBe(false);

    let state = applyLegal(before, "runner", runHq.actionId);
    expect(state.pendingChoice?.source).toContain("corp.start_of_run_redirect");
    expect(getLegalActions(state, "runner")).toHaveLength(0);

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runHq.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "stale-siren-bypass",
    });
    expect(stale.ok).toBe(false);

    state = applyChoice(state, "corp", "pass");
    expect(state.run?.attackedServerId).toBe("hq");

    const redirectedBefore = baseState("pro014-siren-redirect");
    addCorpRoot(redirectedBefore, SIREN, "siren_2", "remote_1", true);
    let redirected = apply(
      redirectedBefore,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    redirected = applyChoice(redirected, "corp", "redirect_siren_2");
    expect(redirected.run?.attackedServerId).toBe("remote_1");
    expect(redirected.corp.credits).toBe(19);
    expectReplayStable(redirectedBefore, redirected);
  });

  it("opens Department of Misinformation expose prevention and keeps pass/use explicit", () => {
    const before = baseState("pro014-department");
    const targetId = addCorpRoot(before, GOVERNMENT_CONTRACT, "target_asset", "remote_1", false);
    addCorpRoot(before, DEPARTMENT, "department_1", "remote_1", false);
    addRunnerProgram(before, MOUSE, "mouse_1");

    let state = apply(
      before,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === "mouse_1",
    );
    expect(state.pendingChoice?.source).toContain("p3_36.expose_installed_card");
    const targetOptionId = state.pendingChoice?.options.find(
      (option) => option.value === targetId,
    )?.id;
    expect(targetOptionId).toMatch(/^card_hidden_/);
    state = applyChoice(state, "runner", targetOptionId ?? "");
    expect(state.pendingChoice?.source).toContain("corp.expose_prevention");
    expect(state.cardInstances[targetId]?.faceup).toBe(false);

    const passState = applyChoice(state, "corp", "pass");
    expect(passState.cardInstances[targetId]?.faceup).toBe(false);
    expect(passState.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("p3_36.expose_installed_card_review:"),
      prompt: "Karte ansehen",
      kind: "select_option",
      options: [{ id: "done", label: "Ansehen beenden", value: "done" }],
    });
    expect(
      getPlayerView(passState, "runner")
        .servers.flatMap((server) => server.root)
        .some((card) => card.known && card.definitionId === GOVERNMENT_CONTRACT),
    ).toBe(true);
    const passFinished = applyChoice(passState, "runner", "done");
    expect(passFinished.pendingChoice).toBeUndefined();

    const useBefore = baseState("pro014-department-use");
    const useTarget = addCorpRoot(useBefore, GOVERNMENT_CONTRACT, "target_asset_2", "remote_1", false);
    addCorpRoot(useBefore, DEPARTMENT, "department_2", "remote_1", false);
    addRunnerProgram(useBefore, MOUSE, "mouse_2");
    state = apply(
      useBefore,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === "mouse_2",
    );
    const useTargetOptionId = state.pendingChoice?.options.find(
      (option) => option.value === useTarget,
    )?.id;
    expect(useTargetOptionId).toMatch(/^card_hidden_/);
    state = applyChoice(state, "runner", useTargetOptionId ?? "");
    state = applyChoice(state, "corp", "department_department_2");
    expect(state.cardInstances[useTarget]?.faceup).toBe(false);
    expect(state.cardInstances["department_2" as CardInstanceId]?.rezzed).toBe(true);
    expect(state.corp.credits).toBe(19);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("offers Cybertech as a corp meat-damage boost without auto-consuming counters", () => {
    let state = baseState("pro014-cybertech");
    const cybertechId = addCorpRoot(state, CYBERTECH, "cybertech_1", "remote_1", true);
    state.cardInstances[cybertechId]!.advancementCounters = 1;
    addCorpHq(state, SCORCHED_EARTH, "scorched_1");
    addRunnerGrip(state, "grip_1");
    addRunnerGrip(state, "grip_2");
    addRunnerGrip(state, "grip_3");
    addRunnerGrip(state, "grip_4");
    state.runner.tags = 1;
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;

    state = apply(
      state,
      "corp",
      (action) => action.type === "play_operation",
    );
    expect(state.pendingChoice?.source).toContain("v120.event_modification.increase");
    expect(state.cardInstances[cybertechId]?.advancementCounters).toBe(1);

    const passState = applyChoice(state, "corp", "pass");
    expect(passState.eventLog.at(-1)?.publicPayload.damageAmount).toBe(4);

    state = baseState("pro014-cybertech-use");
    const useCybertech = addCorpRoot(state, CYBERTECH, "cybertech_2", "remote_1", true);
    state.cardInstances[useCybertech]!.advancementCounters = 1;
    addCorpHq(state, SCORCHED_EARTH, "scorched_2");
    for (let index = 0; index < 5; index += 1) addRunnerGrip(state, `grip_use_${index}`);
    state.runner.tags = 1;
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state = apply(
      state,
      "corp",
      (action) => action.type === "play_operation",
    );
    state = applyChoice(state, "corp", "cybertech_meat_damage_boost_cybertech_2");
    expect(state.cardInstances[useCybertech]?.advancementCounters).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload.damageAmount).toBe(5);
  });

  it("restricts Government Contract temporary credits to install and rez costs", () => {
    let state = baseState("pro014-government");
    const governmentId = addCorpRoot(state, GOVERNMENT_CONTRACT, "government_1", "remote_1", true);
    state.cardInstances[governmentId]!.advancementCounters = 1;
    state = goCorpMain(state);
    state.corp.credits = 0;

    state = apply(
      state,
      "corp",
      (action) => action.type === "activated_card_ability" && action.source === governmentId,
    );
    expect(state.corp.credits).toBe(3);
    expect(state.corpTemporaryInstallRezCredits?.remaining).toBe(3);

    addCorpRoot(state, SIREN, "siren_temp_only", "remote_1", true);
    for (const cardId of state.corp.hq.slice()) removeEverywhere(state, cardId);
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(0);

    const runnerState = state;
    const hqRun = apply(
      runnerState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(hqRun.pendingChoice?.source ?? "").not.toContain(
      "corp.start_of_run_redirect",
    );

    let installState = baseState("pro014-government-install");
    const govInstall = addCorpRoot(installState, GOVERNMENT_CONTRACT, "government_2", "remote_1", true);
    installState.cardInstances[govInstall]!.advancementCounters = 1;
    addCorpIce(installState, WALL, "existing_ice", "hq", false);
    addCorpHq(installState, WALL, "wall_to_install");
    installState = goCorpMain(installState);
    installState.corp.credits = 0;
    installState = apply(
      installState,
      "corp",
      (action) => action.type === "activated_card_ability" && action.source === govInstall,
    );
    installState = apply(
      installState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === "wall_to_install" &&
        action.payload?.serverId === "hq",
    );
    expect(installState.corpTemporaryInstallRezCredits?.remaining).toBe(2);
    expect(installState.corp.credits).toBe(2);
  });

  it("scopes LDL Traffic Analyzers credits to the active trace bid", () => {
    let state = baseState("pro014-ldl");
    const ldlId = addCorpRoot(state, LDL, "ldl_1", "remote_1", true);
    state.cardInstances[ldlId]!.advancementCounters = 1;
    openCorpTraceBidWindow(state, ldlId);
    state.corp.credits = 0;

    state = apply(
      state,
      "corp",
      (action) => action.type === "activated_card_ability" && action.source === ldlId,
    );
    expect(state.cardInstances[ldlId]?.advancementCounters).toBe(0);
    expect(state.trace?.corpTemporaryTraceCredits?.remaining).toBe(5);

    state = applyChoice(state, "corp", "bid_5");
    expect(state.trace?.corpBid).toBe(5);
    expect(state.trace?.corpTemporaryTraceCredits?.remaining).toBe(0);
    expect(state.corp.credits).toBe(0);

    const noTrace = baseState("pro014-ldl-no-trace");
    const noTraceLdl = addCorpRoot(noTrace, LDL, "ldl_2", "remote_1", true);
    noTrace.cardInstances[noTraceLdl]!.advancementCounters = 1;
    expect(
      getLegalActions(noTrace, "corp").some((action) => action.source === noTraceLdl),
    ).toBe(false);
  });

  it("keeps Panic Button in HQ and usable only during HQ runs", () => {
    let state = baseState("pro014-panic-install");
    addCorpHq(state, PANIC_BUTTON, "panic_install");
    state = goCorpMain(state);
    const panicInstallActions = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "install_card" && action.payload?.cardId === "panic_install",
    );
    expect(panicInstallActions.map((action) => action.payload?.serverId)).toEqual(["hq"]);

    let hqRun = baseState("pro014-panic-run-hq");
    const panicId = addCorpRoot(hqRun, PANIC_BUTTON, "panic_1", "hq", true);
    addCorpRd(hqRun, WALL, "rd_draw");
    hqRun = apply(
      hqRun,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    hqRun.timingPoint = "run.jack_out_window";
    const hqAction = mustAction(
      hqRun,
      "corp",
      (action) => action.type === "activated_card_ability" && action.source === panicId,
    );
    const beforeHq = hqRun.corp.hq.length;
    hqRun = applyLegal(hqRun, "corp", hqAction.actionId);
    expect(hqRun.corp.credits).toBe(19);
    expect(hqRun.corp.hq.length).toBe(beforeHq + 1);

    let rdRun = baseState("pro014-panic-run-rd");
    const rdPanic = addCorpRoot(rdRun, PANIC_BUTTON, "panic_2", "hq", true);
    rdRun = apply(
      rdRun,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    rdRun.timingPoint = "run.jack_out_window";
    expect(
      getLegalActions(rdRun, "corp").some((action) => action.source === rdPanic),
    ).toBe(false);
  });

  it("uses Raymond Ellison only in remote forts and converts same-fort counters into run-bound credits", () => {
    let installState = baseState("pro014-raymond-install");
    installState.corp.servers.push({
      id: "remote_9",
      kind: "remote",
      label: "Remote 9",
      ice: [],
      root: [],
    });
    addCorpHq(installState, RAYMOND, "raymond_install");
    installState = goCorpMain(installState);
    const raymondInstallServers = getLegalActions(installState, "corp")
      .filter(
        (action) =>
          action.type === "install_card" && action.payload?.cardId === "raymond_install",
      )
      .map((action) => action.payload?.serverId);
    expect(raymondInstallServers).toContain("remote_9");
    expect(raymondInstallServers).not.toContain("hq");

    let state = baseState("pro014-raymond-run");
    const raymondId = addCorpRoot(state, RAYMOND, "raymond_1", "remote_1", true);
    const sameFortIce = addCorpIce(state, WALL, "raymond_wall_same", "remote_1", true);
    const otherFortIce = addCorpIce(state, WALL, "raymond_wall_other", "hq", true);
    state.cardInstances[sameFortIce]!.advancementCounters = 2;
    state.cardInstances[otherFortIce]!.advancementCounters = 1;
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state.timingPoint = "run.jack_out_window";
    state = apply(
      state,
      "corp",
      (action) => action.type === "activated_card_ability" && action.source === raymondId,
    );
    expect(state.cardInstances[sameFortIce]?.advancementCounters).toBe(0);
    expect(state.cardInstances[otherFortIce]?.advancementCounters).toBe(1);
    expect(state.run?.corpRunTemporaryCredits?.remaining).toBe(6);
    expect(state.corp.credits).toBe(26);
  });

  it("spends Raymond Ellison credits only through explicit current-run corp costs", () => {
    let state = baseState("pro014-raymond-spend");
    const raymondId = addCorpRoot(state, RAYMOND, "raymond_spend", "remote_1", true);
    const sameFortIce = addCorpIce(state, WALL, "raymond_spend_wall", "remote_1", true);
    const panicId = addCorpRoot(state, PANIC_BUTTON, "raymond_spend_panic", "hq", true);
    addCorpRd(state, WALL, "raymond_spend_draw");
    state.cardInstances[sameFortIce]!.advancementCounters = 2;
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state.timingPoint = "run.jack_out_window";
    state = apply(
      state,
      "corp",
      (action) => action.type === "activated_card_ability" && action.source === raymondId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      amounts: {
        temporaryRunCredits: 6,
        temporaryRunCreditsRemaining: 6,
      },
    });

    const panic = mustAction(
      state,
      "corp",
      (action) => action.type === "activated_card_ability" && action.source === panicId,
    );
    const beforeSpend = state;
    state = applyLegal(state, "corp", panic.actionId);
    expect(state.run?.corpRunTemporaryCredits?.remaining).toBe(5);
    expect(state.corp.credits).toBe(25);
    expectReplayStable(beforeSpend, state);

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: panic.actionId,
      clientKnownStateVersion: beforeSpend.stateVersion,
      idempotencyKey: "stale-raymond-panic",
    });
    expect(stale.ok).toBe(false);
  });

  it("returns unused Raymond Ellison credits at run end and removes the pool", () => {
    let state = baseState("pro014-raymond-cleanup");
    const raymondId = addCorpRoot(state, RAYMOND, "raymond_cleanup", "remote_1", true);
    const sameFortIce = addCorpIce(state, WALL, "raymond_cleanup_wall", "remote_1", true);
    state.cardInstances[sameFortIce]!.advancementCounters = 2;
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state.timingPoint = "run.jack_out_window";
    state = apply(
      state,
      "corp",
      (action) => action.type === "activated_card_ability" && action.source === raymondId,
    );
    expect(state.corp.credits).toBe(26);

    state = apply(state, "runner", (action) => action.type === "jack_out");
    expect(state.run).toBeUndefined();
    expect(state.corp.credits).toBe(20);
  });

  it("does not offer or spend Raymond Ellison credits outside a run", () => {
    let state = baseState("pro014-raymond-outside-run");
    const raymondId = addCorpRoot(state, RAYMOND, "raymond_outside", "remote_1", true);
    const sameFortIce = addCorpIce(state, WALL, "raymond_outside_wall", "remote_1", true);
    state.cardInstances[sameFortIce]!.advancementCounters = 1;
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "activated_card_ability" && action.source === raymondId,
      ),
    ).toBe(false);

    state.corp.credits = 4;
    state.run = {
      runId: "raymond_orphan_pool",
      attackedServerId: "hq",
      phase: "movement",
      position: { kind: "server", serverId: "hq" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      corpRunTemporaryCredits: {
        sourceCardInstanceId: raymondId,
        sourceDefinitionId: RAYMOND as CardDefinitionId,
        remaining: 3,
        usableFor: "corp_costs_during_this_run",
        returnUnusedAtRunEnd: true,
      },
    };
    const unrezzedIce = addCorpIce(state, WALL, "raymond_unintended_wall", "hq", false);
    state.pendingChoice = {
      choiceId: "raymond_unintended_fao",
      side: "corp",
      source: `v1922.forged_activation_orders_corp:${unrezzedIce}:${state.stateVersion}`,
      prompt: "Forged Activation Orders: ICE rezzen oder trashen.",
      kind: "select_option",
      options: [
        { id: "rez_ice", label: "Rez ICE", publicLabel: "Rez ICE", value: "rez_ice" },
        { id: "trash_ice", label: "Trash ICE", publicLabel: "Trash ICE", value: "trash_ice" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    state = applyChoice(state, "corp", "rez_ice");
    expect(state.run?.corpRunTemporaryCredits?.remaining).toBe(3);
    expect(state.corp.credits).toBe(1);
    expect(state.cardInstances[unrezzedIce]?.rezzed).toBe(true);
  });

  it("lets Syd Meyer Superstores trash only own rezzed ICE for credits", () => {
    let state = baseState("pro014-syd");
    const sydId = addCorpRoot(state, SYD, "syd_1", "remote_1", true);
    const rezzedIce = addCorpIce(state, WALL, "syd_wall_rezzed", "hq", true);
    const unrezzedIce = addCorpIce(state, WALL, "syd_wall_unrezzed", "rd", false);
    state = goCorpMain(state);
    const sydActions = getLegalActions(state, "corp").filter(
      (action) => action.type === "activated_card_ability" && action.source === sydId,
    );
    expect(sydActions.map((action) => action.payload?.targetCardId)).toEqual([
      rezzedIce,
    ]);
    expect(
      sydActions.some((action) => action.payload?.targetCardId === unrezzedIce),
    ).toBe(false);

    state = applyLegal(state, "corp", sydActions[0]!.actionId);
    expect(state.corp.credits).toBe(24);
    expect(state.corp.archives).toContain(rezzedIce);
    expect(state.cardInstances[rezzedIce]?.zone).toEqual({
      side: "corp",
      zone: "archives",
    });
  });
});
