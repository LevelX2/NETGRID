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

const ROADBLOCK = "onr_proteus_035_roadblock";
const EXECUTIVE_BOOT_CAMP = "onr_proteus_058_executive-boot-camp";
const LISA_BLIGHT = "onr_proteus_063_lisa-blight";
const FORWARDS_LEGACY = "onr_proteus_087_forwards-legacy";
const WALL = "onr_v1_279_wall-of-static";
const SCORCHED_EARTH = "onr_v1_302_scorched-earth";

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
    server = { id: serverId, kind: "remote", label: "Remote", ice: [], root: [] };
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
    server = { id: serverId, kind: "remote", label: "Remote", ice: [], root: [] };
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

function removeEverywhere(state: GameState, cardId: CardInstanceId): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.root = server.root.filter((id) => id !== cardId);
    server.ice = server.ice.filter((id) => id !== cardId);
  }
  delete state.cardInstances[cardId];
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

function jackOut(state: GameState): GameState {
  return apply(state, "runner", (action) => action.type === "jack_out");
}

function payloadNumber(payload: unknown, key: string): number | undefined {
  const amounts = (payload as { amounts?: Record<string, unknown> } | undefined)
    ?.amounts;
  const value = amounts?.[key];
  return typeof value === "number" ? value : undefined;
}

function encounterIce(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  iceId: CardInstanceId,
): GameState {
  state = apply(
    state,
    "runner",
    (action) => action.type === "start_run" && action.payload?.serverId === serverId,
  );
  while (state.run?.encounteredIceId !== iceId && state.run) {
    if (!getLegalActions(state, "runner").some((action) => action.type === "continue_run"))
      break;
    state = apply(state, "runner", (action) => action.type === "continue_run");
  }
  return state;
}

describe("Proteus PRO016 random dice encounter suite", () => {
  it("rolls Forward's Legacy strength at run start and replays stably", () => {
    let state = baseState("pro016-forwards-legacy");
    const legacy = addRunnerProgram(state, FORWARDS_LEGACY, "legacy_1");
    const before = state;
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const runStrength = state.run?.aiBoonRunStrengthByBreaker?.[legacy];
    expect(runStrength).toBeGreaterThanOrEqual(1);
    expect(runStrength).toBeLessThanOrEqual(6);
    expect(state.randomCounter).toBeGreaterThan(before.randomCounter);
    expect(state.eventLog.at(-1)?.publicPayload.sourceDefinitionId).toBe(
      FORWARDS_LEGACY,
    );
    expect(
      payloadNumber(state.eventLog.at(-1)?.publicPayload, "randomCounterAfter"),
    ).toBeGreaterThan(before.randomCounter);
    expectReplayStable(before, state);
  });

  it("adds Roadblock encounter strength on a 1-5 roll", () => {
    let state = baseState("pro016-roadblock-strength");
    const roadblock = addCorpIce(state, ROADBLOCK, "roadblock_strength", "remote_1", true);
    state = encounterIce(state, "remote_1", roadblock);
    const payload = state.eventLog.at(-1)?.publicPayload;
    const dieRoll = payloadNumber(payload, "dieRoll");
    expect(dieRoll).toBeGreaterThanOrEqual(1);
    if (dieRoll === 6) return;
    expect(state.run?.encounterTemporaryIceStrengthModifiers?.[0]).toMatchObject({
      sourceIceId: roadblock,
      sourceDefinitionId: ROADBLOCK,
      amount: dieRoll,
    });
  });

  it("derezzes Roadblock and automatically passes on a 6", () => {
    let state: GameState | undefined;
    let roadblock: CardInstanceId | undefined;
    for (let index = 0; index < 40; index += 1) {
      const candidate = baseState(`pro016-roadblock-six-${index}`);
      const candidateRoadblock = addCorpIce(
        candidate,
        ROADBLOCK,
        `roadblock_six_${index}`,
        "remote_1",
        true,
      );
      const next = encounterIce(candidate, "remote_1", candidateRoadblock);
      if (payloadNumber(next.eventLog.at(-1)?.publicPayload, "dieRoll") === 6) {
        state = next;
        roadblock = candidateRoadblock;
        break;
      }
    }
    expect(state).toBeDefined();
    expect(roadblock).toBeDefined();
    expect(state!.cardInstances[roadblock!]!.rezzed).toBe(false);
    expect(state!.run?.lastPassedIceId).toBe(roadblock);
  });

  it("uses Executive Boot Camp only during runs with side-safe random HQ discard", () => {
    let state = baseState("pro016-boot-camp");
    const bootCamp = addCorpRoot(state, EXECUTIVE_BOOT_CAMP, "boot_camp_1", "remote_1", true);
    addCorpHq(state, SCORCHED_EARTH, "boot_hq_1");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "activated_card_ability" && action.source === bootCamp,
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state.timingPoint = "run.jack_out_window";
    const action = mustAction(
      state,
      "corp",
      (candidate) =>
        candidate.type === "activated_card_ability" && candidate.source === bootCamp,
    );
    const before = state;
    state = applyLegal(state, "corp", action.actionId);
    expect(state.randomCounter).toBe(before.randomCounter + 1);
    expect(state.corp.hq).toHaveLength(before.corp.hq.length - 1);
    expect(state.run?.corpRunTemporaryCredits?.remaining).toBe(2);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      SCORCHED_EARTH,
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      SCORCHED_EARTH,
    );
    expectReplayStable(before, state);
  });

  it("spends Executive Boot Camp credits on Korp costs during the run and returns unused credits at run end", () => {
    let state = baseState("pro016-boot-camp-spend-cleanup");
    const bootCamp = addCorpRoot(state, EXECUTIVE_BOOT_CAMP, "boot_camp_2", "remote_1", true);
    const lisa = addCorpRoot(state, LISA_BLIGHT, "boot_lisa", "remote_1", true);
    const wall = addCorpIce(state, WALL, "boot_wall", "remote_1", true);
    addCorpHq(state, SCORCHED_EARTH, "boot_spend_hq_1");
    addCorpHq(state, SCORCHED_EARTH, "boot_spend_hq_2");
    state = encounterIce(state, "remote_1", wall);
    state.timingPoint = "run.jack_out_window";
    const bootAction = mustAction(
      state,
      "corp",
      (candidate) =>
        candidate.type === "activated_card_ability" && candidate.source === bootCamp,
    );
    state = applyLegal(state, "corp", bootAction.actionId);
    expect(state.corp.credits).toBe(22);
    expect(state.run?.corpRunTemporaryCredits?.remaining).toBe(2);
    const lisaAction = mustAction(
      state,
      "corp",
      (candidate) =>
        candidate.type === "activated_card_ability" &&
        candidate.source === lisa &&
        candidate.payload?.targetCardId === wall,
    );
    state = applyLegal(state, "corp", lisaAction.actionId);
    expect(state.corp.credits).toBe(21);
    expect(state.run?.corpRunTemporaryCredits?.remaining).toBe(1);
    const beforeCleanup = state;
    state = jackOut(state);
    expect(state.run).toBeUndefined();
    expect(state.corp.credits).toBe(20);
    expectReplayStable(beforeCleanup, state);
  });

  it("removes unspent Executive Boot Camp credits at run end without leaving a post-run pool", () => {
    let state = baseState("pro016-boot-camp-unspent-cleanup");
    const bootCamp = addCorpRoot(state, EXECUTIVE_BOOT_CAMP, "boot_camp_3", "remote_1", true);
    addCorpHq(state, SCORCHED_EARTH, "boot_unspent_hq_1");
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state.timingPoint = "run.jack_out_window";
    state = applyLegal(
      state,
      "corp",
      mustAction(
        state,
        "corp",
        (candidate) =>
          candidate.type === "activated_card_ability" && candidate.source === bootCamp,
      ).actionId,
    );
    expect(state.corp.credits).toBe(22);
    state = jackOut(state);
    expect(state.run).toBeUndefined();
    expect(state.corp.credits).toBe(20);
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "activated_card_ability" && action.source === bootCamp,
      ),
    ).toBe(false);
  });

  it("copies a same-fort subroutine directly after the original with Lisa Blight and rejects empty-HQ costs", () => {
    let state = baseState("pro016-lisa");
    const lisa = addCorpRoot(state, LISA_BLIGHT, "lisa_1", "remote_1", true);
    const wall = addCorpIce(state, WALL, "lisa_wall", "remote_1", true);
    addCorpHq(state, SCORCHED_EARTH, "lisa_hq_1");
    state = encounterIce(state, "remote_1", wall);
    state.timingPoint = "run.jack_out_window";
    const action = mustAction(
      state,
      "corp",
      (candidate) =>
        candidate.type === "activated_card_ability" &&
        candidate.source === lisa &&
        candidate.payload?.targetCardId === wall &&
        candidate.payload?.subroutineIndex === 0,
    );
    const before = state;
    state = applyLegal(state, "corp", action.actionId);
    expect(state.corp.credits).toBe(before.corp.credits - 1);
    expect(state.corp.hq).toHaveLength(before.corp.hq.length - 1);
    expect(state.run?.encounterAdditionalSubroutines?.[0]).toMatchObject({
      targetIceId: wall,
      sourceDefinitionId: LISA_BLIGHT,
      subroutineKind: "end_the_run",
    });
    expectReplayStable(before, state);
    state.timingPoint = "run.encounter_ice";
    state.run!.phase = "encounter_ice";
    const subroutines =
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === "remote_1")
        ?.ice.find((ice) => ice.instanceId === wall)
        ?.effectiveRunQuote?.subroutines ?? [];
    const originalIndex = subroutines.findIndex(
      (subroutine) => subroutine.id === action.payload?.subroutineId,
    );
    expect(originalIndex).toBeGreaterThanOrEqual(0);
    expect(subroutines[originalIndex + 1]?.id).toContain("copied_subroutine");

    let emptyHq = baseState("pro016-lisa-empty");
    addCorpRoot(emptyHq, LISA_BLIGHT, "lisa_empty", "remote_1", true);
    const emptyWall = addCorpIce(emptyHq, WALL, "lisa_empty_wall", "remote_1", true);
    for (const cardId of emptyHq.corp.hq) delete emptyHq.cardInstances[cardId];
    emptyHq.corp.hq = [];
    emptyHq = encounterIce(emptyHq, "remote_1", emptyWall);
    emptyHq.timingPoint = "run.jack_out_window";
    expect(
      getLegalActions(emptyHq, "corp").some(
        (candidate) => candidate.type === "activated_card_ability",
      ),
    ).toBe(false);
  });

  it("keeps Lisa Blight subroutine copies run-scoped and rejects stale duplicate targets", () => {
    let state = baseState("pro016-lisa-duplicate");
    const lisa = addCorpRoot(state, LISA_BLIGHT, "lisa_duplicate", "remote_1", true);
    const wall = addCorpIce(state, WALL, "lisa_duplicate_wall", "remote_1", true);
    addCorpHq(state, SCORCHED_EARTH, "lisa_duplicate_hq_1");
    addCorpHq(state, SCORCHED_EARTH, "lisa_duplicate_hq_2");
    state = encounterIce(state, "remote_1", wall);
    state.timingPoint = "run.jack_out_window";
    const firstAction = mustAction(
      state,
      "corp",
      (candidate) =>
        candidate.type === "activated_card_ability" &&
        candidate.source === lisa &&
        candidate.payload?.targetCardId === wall &&
        candidate.payload?.subroutineIndex === 0,
    );
    const staleState = structuredClone(state) as GameState;
    staleState.run!.encounterAdditionalSubroutines = [
      ...(staleState.run!.encounterAdditionalSubroutines ?? []),
      {
        sourceCardInstanceId: lisa,
        sourceDefinitionId: LISA_BLIGHT,
        sourceTitle: "Lisa Blight",
        targetIceId: wall,
        originalSubroutineId: String(firstAction.payload?.subroutineId ?? ""),
        subroutineKind: "end_the_run",
      },
    ];
    const staleResult = applyAction(staleState, {
      matchId: staleState.matchId,
      side: "corp",
      actionId: firstAction.actionId,
      clientKnownStateVersion: staleState.stateVersion,
      idempotencyKey: "corp-stale-lisa-duplicate",
    });
    expect(staleResult.ok).toBe(false);

    state = applyLegal(state, "corp", firstAction.actionId);
    expect(
      getLegalActions(state, "corp").some(
        (candidate) =>
          candidate.type === "activated_card_ability" &&
          candidate.source === lisa &&
          candidate.payload?.targetCardId === wall &&
          candidate.payload?.subroutineIndex === 0,
      ),
    ).toBe(false);
    state = jackOut(state);
    expect(state.run).toBeUndefined();
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(state.run?.encounterAdditionalSubroutines).toBeUndefined();
  });

  it("keeps Lisa Blight illegal for other forts", () => {
    let state = baseState("pro016-lisa-wrong-fort");
    const lisa = addCorpRoot(state, LISA_BLIGHT, "lisa_wrong_fort", "remote_2", true);
    const wall = addCorpIce(state, WALL, "lisa_wrong_wall", "remote_1", true);
    addCorpHq(state, SCORCHED_EARTH, "lisa_wrong_hq_1");
    state = encounterIce(state, "remote_1", wall);
    state.timingPoint = "run.jack_out_window";
    expect(
      getLegalActions(state, "corp").some(
        (candidate) =>
          candidate.type === "activated_card_ability" && candidate.source === lisa,
      ),
    ).toBe(false);
  });
});
