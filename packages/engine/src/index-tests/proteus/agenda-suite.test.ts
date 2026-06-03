import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "../../index";
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
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type ServerId,
  type Side,
} from "@netgrid/shared";

const CORPORATE_HEADHUNTERS = "onr_proteus_003_corporate-headhunters";
const FETAL_AI = "onr_proteus_004_fetal-ai";
const MARKED_ACCOUNTS = "onr_proteus_005_marked-accounts";
const PROJECT_ZURICH = "onr_proteus_008_project-zurich";
const WORLD_DOMINATION = "onr_proteus_010_world-domination";
const FALL_GUY = "onr_v1_161_fall-guy";
const BLACKMAIL = "onr_proteus_102_blackmail";
const PIRATE_BROADCAST = "onr_proteus_116_pirate-broadcast";
const PROMISES_PROMISES = "onr_proteus_119_promises-promises";
const NON_AGENDA_ASSET = "onr_v1_309_bbs-whispering-campaign";

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

function applyLegal(
  state: GameState,
  side: Side,
  action: LegalAction,
  idempotencyKey = `${side}-${state.stateVersion}-${action.actionId}`,
) {
  return applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey,
  });
}

function addCorpCard(
  state: GameState,
  definitionId: string,
  id: string,
  zone: "hq" | "rd" | "archives" | "remote_1",
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhereForTest(state, cardId);
  if (zone === "hq") state.corp.hq.unshift(cardId);
  else if (zone === "rd") state.corp.rd.unshift(cardId);
  else if (zone === "archives") state.corp.archives.unshift(cardId);
  else {
    let server = state.corp.servers.find((candidate) => candidate.id === zone);
    if (!server) {
      server = { id: zone, kind: "remote", label: "Remote 1", ice: [], root: [] };
      state.corp.servers.push(server);
    }
    server.root.unshift(cardId);
  }
  state.cardInstances[cardId] = {
    instanceId: cardId,
    id: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone:
      zone === "remote_1"
        ? { side: "corp", zone: "serverRoot", serverId: zone }
        : { side: "corp", zone },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  } as GameState["cardInstances"][CardInstanceId];
  return cardId;
}

function addRunnerGripCard(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhereForTest(state, cardId);
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

function scoreCorpAgenda(
  state: GameState,
  definitionId: string,
  id: string,
  advancementCounters = 0,
): CardInstanceId {
  const cardId = addCorpCard(state, definitionId, id, "hq");
  removeEverywhereForTest(state, cardId);
  state.corp.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    zone: { side: "corp", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
    advancementCounters,
  };
  return cardId;
}

function removeEverywhereForTest(state: GameState, cardId: CardInstanceId): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.root = server.root.filter((id) => id !== cardId);
    server.ice = server.ice.filter((id) => id !== cardId);
  }
}

function clearCorpCentralZone(
  state: GameState,
  zone: "hq" | "rd" | "archives",
): void {
  for (const cardId of state.corp[zone]) delete state.cardInstances[cardId];
  state.corp[zone] = [];
}

function clearRunnerGrip(state: GameState): void {
  for (const cardId of state.runner.grip) delete state.cardInstances[cardId];
  state.runner.grip = [];
}

function openAccess(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): void {
  state.activeSide = "runner";
  state.phase = "run";
  state.timingPoint = "access.resolve_card";
  state.run = {
    runId: `run_${state.stateVersion + 1}`,
    attackedServerId: serverId,
    phase: "access",
    position: { kind: "server", serverId },
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    bartmossUsedBreakerIdsThisEncounter: [],
    aardvarkInterceptionIceIds: [],
    blinkUsedSubroutinesByBreakerThisEncounter: {},
    successful: true,
    accessCount: 1,
  };
}

function accessTopCard(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): GameState {
  openAccess(state, serverId);
  return apply(
    state,
    "runner",
    (action) => action.type === "access_card",
  );
}

function expectReplayStable(before: GameState, after: GameState): void {
  const replay = replayEvents(before, after.eventLog.slice(before.eventLog.length));
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(after));
}

describe("Proteus PRO013 agenda suite behavior", () => {
  it("Corporate Headhunters requires a scored agenda and tag, costs one click, and reduces hand size only after successful meat damage", () => {
    let state = baseState("pro013-headhunters");
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    const sourceId = scoreCorpAgenda(
      state,
      CORPORATE_HEADHUNTERS,
      "pro013_headhunters",
    );
    state.runner.tags = 0;
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.payload?.cardId === sourceId,
      ),
    ).toBe(false);

    state.runner.tags = 1;
    addRunnerGripCard(state, "onr_v1_010_cascade", "pro013_damage_card");
    const heapBefore = state.runner.heap.length;
    const action = mustAction(
      state,
      "corp",
      (candidate) =>
        candidate.payload?.agendaAbility === "proteus_corporate_headhunters",
    );
    expect(action.costs).toEqual([{ clicks: 1 }]);
    const before = structuredClone(state);
    state = apply(state, "corp", (candidate) => candidate.actionId === action.actionId);
    expect(state.corp.clicks).toBe(3);
    expect(state.runner.heap).toHaveLength(heapBefore + 1);
    expect(state.runner.maxHandSize).toBe(4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageType: "meat",
      damageAmount: 1,
      cardsTrashed: 1,
    });
    expectReplayStable(before, state);

    let prevented = baseState("pro013-headhunters-prevented");
    prevented.activeSide = "corp";
    prevented.phase = "corp_action_phase";
    prevented.timingPoint = "corp_action.main";
    scoreCorpAgenda(prevented, CORPORATE_HEADHUNTERS, "pro013_headhunters_2");
    prevented.runner.tags = 1;
    clearRunnerGrip(prevented);
    const preventedAction = mustAction(
      prevented,
      "corp",
      (candidate) =>
        candidate.payload?.agendaAbility === "proteus_corporate_headhunters",
    );
    prevented = apply(
      prevented,
      "corp",
      (candidate) => candidate.actionId === preventedAction.actionId,
    );
    expect(prevented.runner.maxHandSize).toBe(5);
    expect(prevented.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardsTrashed: 0,
    });
  });

  it("Fetal AI and Marked Accounts fire only outside Archives, keep R&D reveal scoped, and Fetal AI revalidates steal cost/context", () => {
    let fetal = baseState("pro013-fetal");
    addCorpCard(fetal, MARKED_ACCOUNTS, "pro013_marked_hidden_rd", "rd");
    const fetalId = addCorpCard(fetal, FETAL_AI, "pro013_fetal_rd", "rd");
    addRunnerGripCard(fetal, "onr_v1_010_cascade", "pro013_net_1");
    addRunnerGripCard(fetal, "onr_v1_011_cloak", "pro013_net_2");
    const heapBefore = fetal.runner.heap.length;
    openAccess(fetal, "rd");
    const before = structuredClone(fetal);
    fetal = apply(fetal, "runner", (action) => action.type === "access_card");
    expect(fetal.run?.accessedCardId).toBe(fetalId);
    expect(fetal.runner.heap).toHaveLength(heapBefore + 2);
    expect(fetal.cardInstances[fetalId]?.faceup).toBe(true);
    expect(fetal.cardInstances["pro013_marked_hidden_rd"]?.faceup).toBe(false);
    expect(fetal.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageType: "net",
      damageAmount: 2,
      publicRevealDefinitionId: FETAL_AI,
    });
    const steal = mustAction(fetal, "runner", (action) => action.type === "steal_agenda");
    expect(steal.costs).toEqual([{ credits: 2 }]);
    const staleZone = structuredClone(fetal);
    staleZone.cardInstances[fetalId] = {
      ...staleZone.cardInstances[fetalId]!,
      zone: { side: "corp", zone: "archives" },
    };
    expect(applyLegal(staleZone, "runner", steal, "fetal-zone").ok).toBe(false);
    const brokeRunner = structuredClone(fetal);
    brokeRunner.runner.credits = 1;
    expect(applyLegal(brokeRunner, "runner", steal, "fetal-cost").ok).toBe(false);
    fetal = apply(fetal, "runner", (action) => action.actionId === steal.actionId);
    expect(fetal.runner.credits).toBe(28);
    expect(fetal.runner.scoreArea).toContain(fetalId);
    expectReplayStable(before, fetal);

    let archives = baseState("pro013-fetal-archives");
    addCorpCard(archives, FETAL_AI, "pro013_fetal_archives", "archives");
    addRunnerGripCard(archives, "onr_v1_010_cascade", "pro013_archives_grip");
    archives = accessTopCard(archives, "archives");
    expect(archives.runner.heap).not.toContain("pro013_archives_grip");

    let marked = baseState("pro013-marked");
    addCorpCard(marked, FETAL_AI, "pro013_fetal_hidden_rd", "rd");
    const markedId = addCorpCard(marked, MARKED_ACCOUNTS, "pro013_marked_rd", "rd");
    marked = accessTopCard(marked, "rd");
    expect(marked.run?.accessedCardId).toBe(markedId);
    expect(marked.runner.tags).toBe(1);
    expect(marked.cardInstances[markedId]?.faceup).toBe(true);
    expect(marked.cardInstances["pro013_fetal_hidden_rd"]?.faceup).toBe(false);
    expect(marked.eventLog.at(-1)?.publicPayload).toMatchObject({
      tagsAdded: 1,
      publicRevealDefinitionId: MARKED_ACCOUNTS,
    });
    let markedArchives = baseState("pro013-marked-archives");
    addCorpCard(markedArchives, MARKED_ACCOUNTS, "pro013_marked_archives", "archives");
    markedArchives = accessTopCard(markedArchives, "archives");
    expect(markedArchives.runner.tags).toBe(0);
  });

  it("keeps Marked Accounts access context when Fall Guy avoids the tag", () => {
    let state = baseState("pro013-marked-fall-guy");
    const fallGuyId = addRunnerGripCard(state, FALL_GUY, "pro013_fall_guy");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === fallGuyId,
    );
    addCorpCard(state, FETAL_AI, "pro013_fetal_stays_hidden_rd", "rd");
    const markedId = addCorpCard(
      state,
      MARKED_ACCOUNTS,
      "pro013_marked_fall_guy_rd",
      "rd",
    );

    openAccess(state, "rd");
    const before = structuredClone(state);
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.run?.accessedCardId).toBe(markedId);
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice?.source).toContain("event_modification");
    expect(state.cardInstances[markedId]?.faceup).toBe(true);
    expect(state.cardInstances["pro013_fetal_stays_hidden_rd"]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      eventModificationWindowOpened: true,
      publicRevealDefinitionId: MARKED_ACCOUNTS,
      ambushDefinitionId: MARKED_ACCOUNTS,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_access_ambush",
    });

    const fallGuyOption = state.pendingChoice?.options.find((option) =>
      option.id.includes("avoid_tag"),
    )?.id;
    expect(fallGuyOption).toBeDefined();
    if (!fallGuyOption) throw new Error("Missing Fall Guy tag-avoid option");

    state = applyChoice(state, "runner", fallGuyOption);

    expect(state.runner.tags).toBe(0);
    expect(state.runner.heap).toContain(fallGuyId);
    expect(state.cardInstances["pro013_fetal_stays_hidden_rd"]?.faceup).toBe(false);
    const resolvePayload = state.eventLog.at(-1)?.publicPayload;
    expect(resolvePayload).toMatchObject({
      actionType: "resolve_choice",
      eventModificationDecision: "apply",
      eventModificationOutcome: "avoided",
      imminentEventType: "add_tag",
      originalAmount: 1,
      preventedTags: 1,
      finalAmount: 0,
      tagsAdded: 0,
      runnerTagsAfter: 0,
      sourceDefinitionId: FALL_GUY,
      sourceTrashed: true,
      trashedCardDefinitionId: FALL_GUY,
      ambushDefinitionId: MARKED_ACCOUNTS,
      accessEffectSourceDefinitionId: MARKED_ACCOUNTS,
      accessedFromZone: "rd",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_access_ambush",
    });
    expect(resolvePayload).not.toHaveProperty("publicRevealDefinitionId");
    expect(JSON.stringify(resolvePayload)).not.toContain("pro013_fetal_stays_hidden_rd");
    expectReplayStable(before, state);
  });

  it("Project Zurich stores source-bound overadvance credits and World Domination awards fixed points through score authority", () => {
    let zurich = baseState("pro013-zurich");
    zurich.activeSide = "corp";
    zurich.phase = "corp_action_phase";
    zurich.timingPoint = "corp_action.main";
    const zurichId = addCorpCard(zurich, PROJECT_ZURICH, "pro013_zurich", "remote_1");
    zurich.cardInstances[zurichId]!.advancementCounters = 7;
    const before = structuredClone(zurich);
    zurich = apply(
      zurich,
      "corp",
      (action) => action.type === "score_agenda" && action.payload?.cardId === zurichId,
    );
    expect(zurich.corp.scoreArea).toContain(zurichId);
    expect(zurich.cardInstances[zurichId]?.counters?.mark).toBe(2);
    const creditsBefore = zurich.corp.credits;
    zurich = apply(zurich, "corp", (action) => action.type === "end_turn");
    zurich = apply(zurich, "runner", (action) => action.type === "end_turn");
    expect(zurich.corp.credits).toBeGreaterThanOrEqual(creditsBefore + 2);
    expectReplayStable(before, zurich);

    let world = baseState("pro013-world-domination");
    world.activeSide = "corp";
    world.phase = "corp_action_phase";
    world.timingPoint = "corp_action.main";
    const worldId = addCorpCard(world, WORLD_DOMINATION, "pro013_world", "remote_1");
    world.cardInstances[worldId]!.advancementCounters = 12;
    world = apply(
      world,
      "corp",
      (action) => action.type === "score_agenda" && action.payload?.cardId === worldId,
    );
    expect(world.corp.scoreArea).toContain(worldId);
    expect(world.winner).toBe("corp");
    expect(world.eventLog.at(-1)?.publicPayload).toMatchObject({
      totalAgendaPoints: 7,
    });
  });

  it("Blackmail replaces successful HQ access with exactly one Runner agenda point and has no unsuccessful reward", () => {
    let state = baseState("pro013-blackmail");
    const blackmailId = addRunnerGripCard(state, BLACKMAIL, "pro013_blackmail");
    const hqAgenda = addCorpCard(state, FETAL_AI, "pro013_hq_agenda", "hq");
    const before = structuredClone(state);
    const play = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === blackmailId &&
        action.payload?.serverId === "hq",
    );
    expect(play.costs).toEqual([{ clicks: 1, credits: 12 }]);
    state = apply(state, "runner", (action) => action.actionId === play.actionId);
    expect(state.runner.scoreArea).not.toContain(hqAgenda);
    expect(state.runner.scoreArea).toContain(blackmailId);
    expect(state.cardInstances[blackmailId]?.counters?.agenda).toBe(1);
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      accessReplacement: "runner_gain_agenda_point",
      gainedAgendaPoints: 1,
    });
    expectReplayStable(before, state);

    const wrongServer = baseState("pro013-blackmail-wrong-server");
    const wrongServerBlackmail = addRunnerGripCard(
      wrongServer,
      BLACKMAIL,
      "pro013_blackmail_wrong_server",
    );
    const remotePlay = getLegalActions(wrongServer, "runner").find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === wrongServerBlackmail &&
        action.payload?.serverId !== "hq",
    );
    expect(remotePlay).toBeUndefined();
  });

  it("Pirate Broadcast starts a deterministic data-fort sequence, forces follow-up runs, awards one point on completion, and defers action debt on failure", () => {
    let state = baseState("pro013-pirate");
    clearCorpCentralZone(state, "hq");
    clearCorpCentralZone(state, "rd");
    clearCorpCentralZone(state, "archives");
    const pirateId = addRunnerGripCard(state, PIRATE_BROADCAST, "pro013_pirate");
    const before = structuredClone(state);
    const play = mustAction(
      state,
      "runner",
      (action) => action.type === "play_event" && action.payload?.cardId === pirateId,
    );
    expect(play.costs).toEqual([{ clicks: 1, credits: 1 }]);
    state = apply(state, "runner", (action) => action.actionId === play.actionId);
    expect(state.runner.credits).toBe(29);
    expect(state.runnerTurnFlags?.pirateBroadcastPending).toMatchObject({
      pendingServerIds: ["rd", "archives"],
      successfulServerIds: ["hq"],
    });

    for (const expectedNext of ["rd", "archives"] as const) {
      const legal = getLegalActions(state, "runner");
      expect(legal).toHaveLength(1);
      expect(legal[0]).toMatchObject({
        type: "start_run",
        payload: {
          serverId: expectedNext,
          pirateBroadcastRun: true,
          bonusRunNoClick: true,
        },
      });
      state = apply(state, "runner", (action) => action.actionId === legal[0]!.actionId);
      if (state.run) state = apply(state, "runner", (action) => action.type === "access_card");
    }
    expect(state.runner.scoreArea).toContain(pirateId);
    expect(state.cardInstances[pirateId]?.counters?.agenda).toBe(1);
    expect(state.runnerTurnFlags?.pirateBroadcastPending).toBeUndefined();
    expect(state.runnerTurnFlags?.forgoNextActionsPending ?? 0).toBe(0);
    expectReplayStable(before, state);

    let failed = baseState("pro013-pirate-failed");
    failed.runnerTurnFlags ??= {
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: false,
    };
    failed.runnerTurnFlags.pirateBroadcastPending = {
      sourceCardId: "pro013_pirate_failed" as CardInstanceId,
      sourceDefinitionId: PIRATE_BROADCAST,
      sourceTitle: "Pirate Broadcast",
      pendingServerIds: ["remote_99"],
      successfulServerIds: ["hq"],
    };
    failed.runnerTurnFlags.forgoNextActionsPending = 0;
    const clicksBefore = failed.runner.clicks;
    failed = apply(
      failed,
      "runner",
      (action) =>
        action.payload?.runnerAbility === "pirate_broadcast_sequence_failed",
    );
    expect(failed.runnerTurnFlags?.pirateBroadcastPending).toBeUndefined();
    expect(failed.runnerTurnFlags?.forgoNextActionsPending).toBe(1);
    expect(failed.runner.clicks).toBe(clicksBefore);
    expect(failed.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerAbility: "pirate_broadcast_sequence_failed",
      amounts: { actionDebtAdded: 1 },
    });
  });

  it("Promises, Promises marks the next agenda access only, survives non-agenda access, expires at turn end, and adds exactly one steal point", () => {
    let state = baseState("pro013-promises");
    const promisesId = addRunnerGripCard(state, PROMISES_PROMISES, "pro013_promises");
    const assetId = addCorpCard(state, NON_AGENDA_ASSET, "pro013_non_agenda", "remote_1");
    const agendaId = addCorpCard(state, MARKED_ACCOUNTS, "pro013_promised_agenda", "rd");
    const before = structuredClone(state);
    state = apply(
      state,
      "runner",
      (action) => action.type === "play_event" && action.payload?.cardId === promisesId,
    );
    expectReplayStable(before, state);
    expect(state.runner.credits).toBe(28);
    expect(state.runnerTurnFlags?.promisesPromisesNextAgendaAccess).toBe(true);

    state = accessTopCard(state, "remote_1");
    expect(state.run?.accessedCardId).toBe(assetId);
    expect(state.runnerTurnFlags?.promisesPromisesNextAgendaAccess).toBe(true);
    state = apply(state, "runner", (action) => action.type === "decline_trash");

    state = accessTopCard(state, "rd");
    expect(state.run?.accessedCardId).toBe(agendaId);
    expect(state.runnerTurnFlags?.promisesPromisesNextAgendaAccess).toBe(false);
    expect(state.run?.promisesPromisesAgendaPointBonus).toMatchObject({
      amount: 1,
      cardId: agendaId,
    });
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    expect(state.runner.scoreArea).toContain(agendaId);
    expect(state.cardInstances[agendaId]?.counters?.agenda).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      agendaPointBonus: 1,
      totalAgendaPoints: 3,
    });

    let expires = baseState("pro013-promises-expires");
    const expiringPromises = addRunnerGripCard(
      expires,
      PROMISES_PROMISES,
      "pro013_promises_expires",
    );
    expires = apply(
      expires,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === expiringPromises,
    );
    expires = apply(expires, "runner", (action) => action.type === "end_turn");
    expires = toRunnerTurn(expires);
    expect(expires.runnerTurnFlags?.promisesPromisesNextAgendaAccess).toBe(false);
  });
});
