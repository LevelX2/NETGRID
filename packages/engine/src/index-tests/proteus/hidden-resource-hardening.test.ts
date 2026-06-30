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
  apply,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { openRunnerInstalledTrashPreventionWindow } from "../../game/damage/damage-core";
import {
  addRunnerTagsWithPrevention,
  doDamage,
  openEventModificationWindow,
} from "../../game/damage/damage-core";
import {
  CURRENT_RULES_BASELINE,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";

function runnerState(seed: string): GameState {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 30;
  state.runner.clicks = 4;
  state.corp.credits = 30;
  return state;
}

function installHiddenResource(
  state: GameState,
  definitionId: CardDefinitionId,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  state.runner.rig.resources.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function addRunnerGripCard(
  state: GameState,
  definitionId: CardDefinitionId,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "grip" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function addCorpHqCard(
  state: GameState,
  definitionId: CardDefinitionId,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  state.corp.hq.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
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

function addCorpServerCard(
  state: GameState,
  definitionId: CardDefinitionId,
  id: string,
  serverId: "remote_1" | "rd" | "hq",
  slot: "root" | "ice",
): CardInstanceId {
  let server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) {
    server = {
      id: serverId,
      kind: serverId === "remote_1" ? "remote" : serverId,
      label: serverId,
      ice: [],
      root: [],
    } as (typeof state.corp.servers)[number];
    state.corp.servers.push(server);
  }
  const cardId = id as CardInstanceId;
  if (slot === "root") server.root.push(cardId);
  else server.ice.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: {
      side: "corp",
      zone: slot === "root" ? "serverRoot" : "serverIce",
      serverId,
    },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function applyLegal(
  state: GameState,
  side: "corp" | "runner",
  action: LegalAction,
) {
  return applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
}

function resolveChoice(
  state: GameState,
  side: "corp" | "runner",
  optionId: string,
) {
  const action = getLegalActions(state, side).find(
    (candidate) => candidate.type === "resolve_choice",
  );
  expect(action).toBeDefined();
  return applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action!.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice!.choiceId,
      selectedOptionIds: [optionId],
    },
  });
}

function supportActionFor(
  state: GameState,
  cardId: CardInstanceId,
): LegalAction | undefined {
  return getLegalActions(state, "runner").find(
    (candidate) =>
      candidate.payload?.cardId === cardId &&
      candidate.payload?.cardImplementationAbilityTiming ===
        "runner_cost_penalty_support",
  );
}

describe("PRO011 hidden resource timing hardening", () => {
  it("offers bank resources only in runner cost/penalty support windows and trashes Chiba on use", () => {
    let state = runnerState("pro011-1-bank");
    state.runner.credits = 1;
    const chibaId = installHiddenResource(
      state,
      "onr_proteus_133_chiba-bank-account",
      "pro011_chiba",
    );
    const expensiveProgramId = addRunnerGripCard(
      state,
      "onr_v1_010_cascade",
      "pro011_expensive_program",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.payload?.cardId === chibaId,
      ),
    ).toBe(false);

    const installAction = getLegalActions(state, "runner").find(
      (candidate) => candidate.payload?.cardId === expensiveProgramId,
    );
    expect(installAction).toBeDefined();
    const opened = applyLegal(state, "runner", installAction!);
    expect(opened.ok).toBe(true);
    state = opened.state;
    expect(state.runnerCostPenaltySupportWindow).toMatchObject({
      originalActionId: installAction!.actionId,
      amountDue: 4,
      kind: "cost",
    });
    expect(state.runner.credits).toBe(1);
    expect(state.runner.clicks).toBe(4);
    expect(state.runner.grip).toContain(expensiveProgramId);

    const action = getLegalActions(state, "runner").find(
      (candidate) => candidate.payload?.cardId === chibaId,
    );
    expect(action).toBeDefined();
    expect(
      getLegalActions(state, "runner").some(
        (candidate) => candidate.actionId === installAction!.actionId,
      ),
    ).toBe(false);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Chiba Bank Account",
    );

    const wrongSide = applyLegal(state, "corp", action!);
    expect(wrongSide.ok).toBe(false);

    const stale = structuredClone(state);
    stale.stateVersion += 1;
    expect(
      applyAction(stale, {
        matchId: stale.matchId,
        side: "runner",
        actionId: action!.actionId,
        clientKnownStateVersion: state.stateVersion,
      }).ok,
    ).toBe(false);

    const freshAction = getLegalActions(state, "runner").find(
      (candidate) => candidate.payload?.cardId === chibaId,
    );
    const beforeCredits = state.runner.credits;
    const resolved = applyLegal(state, "runner", freshAction!);
    expect(resolved.ok).toBe(true);
    state = resolved.state;
    expect(state.runner.credits).toBe(beforeCredits + 3);
    expect(state.runner.rig.resources).not.toContain(chibaId);
    expect(state.runner.heap).toContain(chibaId);
    expect(state.cardInstances[chibaId]?.zone).toEqual({
      side: "runner",
      zone: "heap",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: "onr_proteus_133_chiba-bank-account",
      sourceTrashed: true,
    });
    const continuedInstall = getLegalActions(state, "runner").find(
      (candidate) => candidate.actionId === installAction!.actionId,
    );
    expect(continuedInstall).toBeDefined();
    const installed = applyLegal(state, "runner", continuedInstall!);
    expect(installed.ok).toBe(true);
    state = installed.state;
    expect(state.runnerCostPenaltySupportWindow).toBeUndefined();
    expect(state.runner.credits).toBe(0);
    expect(state.runner.clicks).toBe(3);
    expect(state.runner.rig.programs).toContain(expensiveProgramId);
  });

  it("opens cost support for runner events that exceed the normal credit pool", () => {
    let state = runnerState("pro011-1-event-support");
    state.runner.credits = 2;
    const chibaId = installHiddenResource(
      state,
      "onr_proteus_133_chiba-bank-account",
      "pro011_event_chiba",
    );
    const scoreId = addRunnerGripCard(
      state,
      "onr_v1_108_score",
      "pro011_score",
    );

    const playScore = getLegalActions(state, "runner").find(
      (candidate) =>
        candidate.type === "play_event" && candidate.payload?.cardId === scoreId,
    );
    expect(playScore).toBeDefined();
    const opened = applyLegal(state, "runner", playScore!);
    expect(opened.ok).toBe(true);
    state = opened.state;
    expect(state.runnerCostPenaltySupportWindow).toMatchObject({
      originalActionId: playScore!.actionId,
      amountDue: 5,
      runnerCreditTarget: 5,
      paymentContext: "runner_pool",
    });
    expect(state.runner.heap).not.toContain(scoreId);

    const support = supportActionFor(state, chibaId);
    expect(support).toBeDefined();
    state = applyLegal(state, "runner", support!).state;
    expect(state.runner.credits).toBe(5);
    expect(state.runner.heap).toContain(chibaId);

    const continued = getLegalActions(state, "runner").find(
      (candidate) => candidate.actionId === playScore!.actionId,
    );
    expect(continued).toBeDefined();
    const played = applyLegal(state, "runner", continued!);
    expect(played.ok).toBe(true);
    state = played.state;
    expect(state.runnerCostPenaltySupportWindow).toBeUndefined();
    expect(state.runner.heap).toContain(scoreId);
    expect(state.runner.credits).toBe(9);
    expect(state.runner.clicks).toBe(3);
  });

  it("opens cost support for accessed card trash costs", () => {
    let state = runnerState("pro011-1-access-trash-support");
    state.runner.credits = 1;
    const chibaId = installHiddenResource(
      state,
      "onr_proteus_133_chiba-bank-account",
      "pro011_access_chiba",
    );
    const assetId = addCorpServerCard(
      state,
      "onr_v1_309_bbs-whispering-campaign",
      "pro011_bbs_campaign",
      "remote_1",
      "root",
    );
    state.run = {
      runId: "pro011_access_run",
      attackedServerId: "remote_1",
      phase: "access",
      position: { kind: "server", serverId: "remote_1" },
      accessedCardId: assetId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
    };
    state.timingPoint = "access.resolve_card";
    state.activeSide = "runner";

    const trashAction = getLegalActions(state, "runner").find(
      (candidate) => candidate.type === "trash_accessed_card",
    );
    expect(trashAction).toBeDefined();
    const opened = applyLegal(state, "runner", trashAction!);
    expect(opened.ok).toBe(true);
    state = opened.state;
    expect(state.runnerCostPenaltySupportWindow).toMatchObject({
      originalActionId: trashAction!.actionId,
      amountDue: 4,
      runnerCreditTarget: 4,
      paymentContext: "runner_access_trash",
    });

    const support = supportActionFor(state, chibaId);
    expect(support).toBeDefined();
    state = applyLegal(state, "runner", support!).state;
    expect(state.runner.credits).toBe(4);
    expect(state.runner.heap).toContain(chibaId);

    const continued = getLegalActions(state, "runner").find(
      (candidate) => candidate.actionId === trashAction!.actionId,
    );
    expect(continued).toBeDefined();
    const trashed = applyLegal(state, "runner", continued!);
    expect(trashed.ok).toBe(true);
    state = trashed.state;
    expect(state.runnerCostPenaltySupportWindow).toBeUndefined();
    expect(state.runner.credits).toBe(0);
    expect(state.corp.archives).toContain(assetId);
  });

  it("opens cost support for run-start taxes before spending the click", () => {
    let state = runnerState("pro011-1-run-start-support");
    state.runner.credits = 0;
    const swissId = installHiddenResource(
      state,
      "onr_proteus_152_swiss-bank-account",
      "pro011_run_swiss",
    );
    const taxAssetId = addCorpServerCard(
      state,
      "onr_v1_332_newsgroup-taunting",
      "pro011_newsgroup",
      "hq",
      "root",
    );
    state.cardInstances[taxAssetId] = {
      ...state.cardInstances[taxAssetId]!,
      faceup: true,
      rezzed: true,
    };

    const runAction = getLegalActions(state, "runner").find(
      (candidate) =>
        candidate.type === "start_run" && candidate.payload?.serverId === "hq",
    );
    expect(runAction).toBeDefined();
    const opened = applyLegal(state, "runner", runAction!);
    expect(opened.ok).toBe(true);
    state = opened.state;
    expect(state.runnerCostPenaltySupportWindow).toMatchObject({
      originalActionId: runAction!.actionId,
      amountDue: 1,
      runnerCreditTarget: 1,
      paymentContext: "runner_run_start",
    });
    expect(state.runner.clicks).toBe(4);
    expect(state.run).toBeUndefined();

    const support = supportActionFor(state, swissId);
    expect(support).toBeDefined();
    state = applyLegal(state, "runner", support!).state;
    expect(state.runner.credits).toBe(2);
    expect(state.cardInstances[swissId]?.tapped).toBe(true);

    const continued = getLegalActions(state, "runner").find(
      (candidate) => candidate.actionId === runAction!.actionId,
    );
    expect(continued).toBeDefined();
    const started = applyLegal(state, "runner", continued!);
    expect(started.ok).toBe(true);
    state = started.state;
    expect(state.runnerCostPenaltySupportWindow).toBeUndefined();
    expect(state.runner.credits).toBe(1);
    expect(state.runner.clicks).toBe(3);
    expect(state.run?.attackedServerId).toBe("hq");
  });

  it("opens HQ/R&D Mole only at access start, increases queue size, and keeps central cards hidden before breach", () => {
    let state = runnerState("pro011-1-mole");
    const hqMoleId = installHiddenResource(
      state,
      "onr_proteus_142_hq-mole",
      "pro011_hq_mole",
    );
    state.run = {
      runId: "pro011_hq_run",
      attackedServerId: "hq",
      phase: "encounter_ice",
      position: { kind: "server", serverId: "hq" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
    };
    state.timingPoint = "run.encounter_ice";
    state.activeSide = "runner";
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.payload?.cardId === hqMoleId,
      ),
    ).toBe(false);

    state.run = {
      ...state.run,
      phase: "movement",
      successful: true,
      hiddenRunnerResourceAccessStartServerId: "hq",
    };
    state.timingPoint = "game.checkpoint";
    const hqBefore = state.corp.hq.slice();
    const moleAction = getLegalActions(state, "runner").find(
      (candidate) => candidate.payload?.cardId === hqMoleId,
    );
    expect(moleAction).toBeDefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "HQ Mole",
    );
    expect(getPlayerView(state, "runner").run?.breach).toBeUndefined();

    const replayStart = state.eventLog.length;
    const replayInitial = structuredClone(state);
    state = apply(
      state,
      "runner",
      (candidate) => candidate.actionId === moleAction!.actionId,
    );
    expect(state.run?.accessCount).toBe(3);
    expect(state.corp.hq).toEqual(hqBefore);
    const continueAction = getLegalActions(state, "runner").find(
      (candidate) =>
        candidate.type === "continue_run" &&
        candidate.payload?.hiddenRunnerResourceAccessStartContinue === true,
    );
    expect(continueAction).toBeDefined();
    state = apply(
      state,
      "runner",
      (candidate) => candidate.actionId === continueAction!.actionId,
    );
    expect(state.run?.breach?.serverId).toBe("hq");
    expect(
      state.run?.breach?.queue.filter((entry) => entry.zone === "hq"),
    ).toHaveLength(Math.min(3, hqBefore.length));
    const replay = replayEvents(
      replayInitial,
      state.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("limits Time to Collect trash prevention to the actual Corp turn and never protects itself", () => {
    const runnerTurn = runnerState("pro011-1-time-runner-turn");
    const timeId = installHiddenResource(
      runnerTurn,
      "onr_proteus_153_time-to-collect",
      "pro011_time_runner_turn",
    );
    const otherId = installHiddenResource(
      runnerTurn,
      "onr_proteus_128_airport-locker",
      "pro011_other_resource",
    );
    runnerTurn.activeSide = "corp";
    runnerTurn.phase = "runner_action_phase";
    const runnerTurnAction = {
      side: "corp",
      payload: {},
    } as LegalAction;
    expect(
      openRunnerInstalledTrashPreventionWindow(
        runnerTurn,
        runnerTurnAction,
        [otherId],
        "test_runner_turn",
      ),
    ).toBe(false);

    const corpTurn = runnerState("pro011-1-time-corp-turn");
    const corpTimeId = installHiddenResource(
      corpTurn,
      "onr_proteus_153_time-to-collect",
      "pro011_time_corp_turn",
    );
    const corpOtherId = installHiddenResource(
      corpTurn,
      "onr_proteus_128_airport-locker",
      "pro011_other_resource_corp_turn",
    );
    corpTurn.phase = "corp_action_phase";
    corpTurn.activeSide = "corp";
    const corpTurnAction = {
      side: "corp",
      payload: {},
    } as LegalAction;
    expect(
      openRunnerInstalledTrashPreventionWindow(
        corpTurn,
        corpTurnAction,
        [corpOtherId, corpTimeId],
        "test_corp_turn",
      ),
    ).toBe(true);
    expect(corpTurn.eventModificationWindow?.candidates).toHaveLength(1);
    expect(
      corpTurn.eventModificationWindow?.candidates[0]?.preventedTrashTargetIds,
    ).toEqual([corpOtherId]);
    expect(JSON.stringify(getPlayerView(corpTurn, "corp"))).not.toContain(
      "Time to Collect",
    );
    expect(timeId).toBeDefined();
  });
});

describe("PRO012 hidden resource prevention and sabotage", () => {
  it("PRO012 Bolt-Hole prevents only Meat Damage, caps at two damage, reveals/taps without Corp-view leaks, and replays", () => {
    let state = runnerState("pro012-bolt-hole");
    const boltId = installHiddenResource(
      state,
      "onr_proteus_132_bolt-hole",
      "pro012_bolt",
    );
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Bolt-Hole",
    );

    const action = {
      side: "corp",
      type: "trigger_ability",
      actionId: "pro012.meat",
      label: "Meat",
      source: "test",
      costs: [],
      payload: {},
    } as unknown as LegalAction;
    const netOpened = openEventModificationWindow(
      state,
      {
        eventId: "pro012_bolt_net",
        eventType: "damage",
        source: { kind: "game_rule" },
        controller: "corp",
        affectedSide: "runner",
        payload: { damageType: "net", amount: 1, source: "pro012_test" },
        visibility: "public",
        createdAtStateVersion: state.stateVersion + 1,
      } as any,
      action,
    );
    expect(netOpened).toBe(false);
    expect(state.eventModificationWindow).toBeUndefined();

    const opened = openEventModificationWindow(
      state,
      {
        eventId: "pro012_bolt_meat",
        eventType: "damage",
        source: { kind: "game_rule" },
        controller: "corp",
        affectedSide: "runner",
        payload: { damageType: "meat", amount: 3, source: "pro012_test" },
        visibility: "public",
        createdAtStateVersion: state.stateVersion + 1,
      } as any,
      action,
    );
    expect(opened).toBe(true);
    expect(state.eventModificationWindow?.candidates[0]).toMatchObject({
      sourceRef: { instanceId: boltId },
      preventAmount: 2,
    });
    state.pendingChoice = {
      ...state.pendingChoice!,
      stateVersion: state.stateVersion,
    };
    const before = structuredClone(state);
    const optionId = state.pendingChoice!.options.find((option) =>
      option.id.includes(String(boltId)),
    )!.id;
    const result = resolveChoice(state, "runner", optionId);
    expect(result.ok).toBe(true);
    state = result.state;
    expect(state.cardInstances[boltId]?.tapped).toBe(true);
    expect(state.cardInstances[boltId]?.faceup).toBe(true);
    expect(state.runner.heap).toHaveLength(before.runner.heap.length + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationOutcome: "partially_prevented",
      preventedAmount: 2,
      damageAmount: 1,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: "onr_proteus_132_bolt-hole",
    });
    const replay = replayEvents(
      before,
      state.eventLog.slice(before.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("PRO012 Expendable Family Member pays one credit plus tap for tag prevention and revalidates credits", () => {
    let state = runnerState("pro012-expendable");
    state.runner.credits = 1;
    const expendableId = installHiddenResource(
      state,
      "onr_proteus_140_expendable-family-member",
      "pro012_expendable",
    );
    const action = {
      side: "corp",
      type: "trigger_ability",
      actionId: "pro012.tags",
      label: "Tags",
      source: "test",
      costs: [],
      payload: {},
    } as unknown as LegalAction;
    addRunnerTagsWithPrevention(state, action, 1, "pro012_test");
    expect(state.eventModificationWindow?.candidates[0]).toMatchObject({
      sourceRef: { instanceId: expendableId },
      preventedTags: 1,
    });
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Expendable Family Member",
    );
    state.pendingChoice = {
      ...state.pendingChoice!,
      stateVersion: state.stateVersion,
    };
    const optionId = state.pendingChoice!.options.find((option) =>
      option.id.includes(String(expendableId)),
    )!.id;

    const stale = structuredClone(state);
    stale.runner.credits = 0;
    expect(resolveChoice(stale, "runner", optionId).ok).toBe(false);

    const result = resolveChoice(state, "runner", optionId);
    expect(result.ok).toBe(true);
    state = result.state;
    expect(state.runner.credits).toBe(0);
    expect(state.runner.tags).toBe(0);
    expect(state.cardInstances[expendableId]?.tapped).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationOutcome: "avoided",
      paidCredits: 1,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: "onr_proteus_140_expendable-family-member",
    });
  });

  it("PRO012 Credit Subversion, Death from Above, and Mercenary enforce timing, targets, reveal, and tap", () => {
    let creditState = runnerState("pro012-credit-subversion");
    const creditSourceId = installHiddenResource(
      creditState,
      "onr_proteus_136_credit-subversion",
      "pro012_credit_subversion",
    );
    creditState.corp.credits = 2;
    creditState.run = {
      runId: "pro012_hq_success",
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
    };
    creditState.activeSide = "runner";
    creditState.timingPoint = "access.resolve_card";
    const creditAction = getLegalActions(creditState, "runner").find(
      (candidate) =>
        candidate.payload?.cardImplementationPrimitiveKind ===
          "successful_run_before_access_effect" &&
        candidate.payload?.cardImplementationEffectKind === "corp_lose_credits",
    );
    expect(creditAction).toBeDefined();
    const runnerCreditAction = getPlayerView(
      creditState,
      "runner",
    ).legalActions.find(
      (candidate) => candidate.actionId === creditAction?.actionId,
    );
    expect(runnerCreditAction?.payload).toMatchObject({
      cardImplementationAbilityId:
        "onr_proteus_136_credit-subversion:successful_run_before_access:0",
      cardImplementationAbilityKey: "successful_run_before_access:0",
      cardImplementationPrimitiveKind: "successful_run_before_access_effect",
      cardImplementationEffectKind: "corp_lose_credits",
      sourceCardId: creditSourceId,
      sourceDefinitionId: "onr_proteus_136_credit-subversion",
    });
    expect(creditAction?.payload).toMatchObject({
      cardImplementationAbilityId:
        "onr_proteus_136_credit-subversion:successful_run_before_access:0",
      cardImplementationAbilityKey: "successful_run_before_access:0",
      cardImplementationPrimitiveKind: "successful_run_before_access_effect",
      cardImplementationEffectKind: "corp_lose_credits",
      sourceCardId: creditSourceId,
      sourceDefinitionId: "onr_proteus_136_credit-subversion",
      proteusHiddenSuccessfulRunFollowup: "corp_lose_credits",
    });
    const corpCreditViewBeforeReveal = JSON.stringify(
      getPlayerView(creditState, "corp"),
    );
    expect(corpCreditViewBeforeReveal).not.toContain("Credit Subversion");
    expect(corpCreditViewBeforeReveal).not.toContain(
      "onr_proteus_136_credit-subversion",
    );
    expect(corpCreditViewBeforeReveal).not.toContain(
      "successful_run_before_access",
    );
    for (const fieldName of [
      "cardImplementationAbilityId",
      "cardImplementationAbilityKey",
      "cardImplementationPrimitiveKind",
      "cardImplementationEffectKind",
    ]) {
      expect(corpCreditViewBeforeReveal).not.toContain(fieldName);
    }
    expect(corpCreditViewBeforeReveal).not.toContain(String(creditSourceId));
    const creditReplayStart = creditState.eventLog.length;
    const creditReplayInitial = structuredClone(creditState);
    let result = applyLegal(creditState, "runner", creditAction!);
    expect(result.ok).toBe(true);
    creditState = result.state;
    expect(creditState.corp.credits).toBe(0);
    expect(creditState.cardInstances[creditSourceId]?.tapped).toBe(true);
    expect(creditState.eventLog.at(-1)?.publicPayload).toMatchObject({
      creditLoss: 2,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: "onr_proteus_136_credit-subversion",
    });
    const creditPublicPayload =
      creditState.eventLog.at(-1)?.publicPayload ?? {};
    expect(creditPublicPayload).toMatchObject({
      sourceDefinitionId: "onr_proteus_136_credit-subversion",
      visibility: { class: "hidden_info_barrier", hiddenZoneBarrier: true },
    });
    expect(creditPublicPayload).not.toHaveProperty(
      "cardImplementationPrimitiveKind",
    );
    expect(creditPublicPayload).not.toHaveProperty(
      "cardImplementationAbilityId",
    );
    for (const fieldName of [
      "cardImplementationAbilityId",
      "cardImplementationAbilityKey",
      "cardImplementationPrimitiveKind",
      "cardImplementationEffectKind",
    ]) {
      expect(JSON.stringify(creditPublicPayload)).not.toContain(fieldName);
    }
    expect(JSON.stringify(creditPublicPayload)).not.toContain(
      String(creditSourceId),
    );
    expect(
      getPlayerView(creditState, "corp").opponent.rig?.some(
        (card) =>
          card.known &&
          card.definitionId === "onr_proteus_136_credit-subversion",
      ),
    ).toBe(true);
    const creditReplay = replayEvents(
      creditReplayInitial,
      creditState.eventLog.slice(creditReplayStart),
    );
    expect(creditReplay.ok).toBe(true);
    expect(hashState(creditReplay.state)).toBe(hashState(creditState));
    expect(
      getLegalActions(creditState, "runner").some(
        (candidate) =>
          candidate.payload?.cardImplementationPrimitiveKind ===
            "successful_run_before_access_effect" &&
          candidate.payload?.cardImplementationEffectKind ===
            "corp_lose_credits",
      ),
    ).toBe(false);

    const wrongHqTiming = runnerState("pro012-credit-subversion-rd");
    installHiddenResource(
      wrongHqTiming,
      "onr_proteus_136_credit-subversion",
      "pro012_credit_subversion_wrong",
    );
    wrongHqTiming.run = {
      ...creditState.run!,
      runId: "pro012_rd_success",
      attackedServerId: "rd",
      position: { kind: "server", serverId: "rd" },
    };
    expect(
      getLegalActions(wrongHqTiming, "runner").some(
        (candidate) =>
          candidate.payload?.cardImplementationPrimitiveKind ===
            "successful_run_before_access_effect" &&
          candidate.payload?.cardImplementationEffectKind ===
            "corp_lose_credits",
      ),
    ).toBe(false);

    let deathState = runnerState("pro012-death-from-above");
    const deathSourceId = installHiddenResource(
      deathState,
      "onr_proteus_137_death-from-above",
      "pro012_death",
    );
    const assetId = addCorpServerCard(
      deathState,
      "onr_v1_309_bbs-whispering-campaign",
      "pro012_remote_asset",
      "remote_1",
      "root",
    );
    const upgradeId = addCorpServerCard(
      deathState,
      "onr_v1_350_antiquated-interface-routines",
      "pro012_remote_upgrade",
      "remote_1",
      "root",
    );
    const iceId = addCorpServerCard(
      deathState,
      "onr_v1_221_asp",
      "pro012_remote_ice",
      "remote_1",
      "ice",
    );
    deathState.run = {
      runId: "pro012_remote_success",
      attackedServerId: "remote_1",
      phase: "access",
      position: { kind: "server", serverId: "remote_1" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
    };
    deathState.activeSide = "runner";
    deathState.timingPoint = "access.resolve_card";
    const deathAction = getLegalActions(deathState, "runner").find(
      (candidate) =>
        candidate.payload?.cardImplementationPrimitiveKind ===
          "successful_run_before_access_effect" &&
        candidate.payload?.cardImplementationEffectKind === "trash_remote_fort",
    );
    expect(deathAction).toBeDefined();
    expect(deathAction?.payload).toMatchObject({
      cardImplementationAbilityId:
        "onr_proteus_137_death-from-above:successful_run_before_access:0",
      cardImplementationAbilityKey: "successful_run_before_access:0",
      cardImplementationPrimitiveKind: "successful_run_before_access_effect",
      cardImplementationEffectKind: "trash_remote_fort",
      sourceCardId: deathSourceId,
      sourceDefinitionId: "onr_proteus_137_death-from-above",
      proteusHiddenSuccessfulRunFollowup: "trash_remote_fort",
    });
    const corpDeathViewBeforeReveal = JSON.stringify(
      getPlayerView(deathState, "corp"),
    );
    expect(corpDeathViewBeforeReveal).not.toContain("Death from Above");
    expect(corpDeathViewBeforeReveal).not.toContain(
      "onr_proteus_137_death-from-above",
    );
    expect(corpDeathViewBeforeReveal).not.toContain("trash_remote_fort");
    const deathReplayStart = deathState.eventLog.length;
    const deathReplayInitial = structuredClone(deathState);
    result = applyLegal(deathState, "runner", deathAction!);
    expect(result.ok).toBe(true);
    deathState = result.state;
    expect(deathState.cardInstances[deathSourceId]?.tapped).toBe(true);
    expect(deathState.corp.archives).toEqual(
      expect.arrayContaining([assetId, upgradeId, iceId]),
    );
    expect(deathState.cardInstances[assetId]?.faceup).toBe(true);
    expect(deathState.cardInstances[upgradeId]?.faceup).toBe(true);
    expect(deathState.cardInstances[iceId]?.faceup).toBe(true);
    expect(deathState.eventLog.at(-1)?.publicPayload).toMatchObject({
      trashedCount: 3,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: "onr_proteus_137_death-from-above",
    });
    const deathPublicPayload = deathState.eventLog.at(-1)?.publicPayload ?? {};
    expect(deathPublicPayload).toMatchObject({
      sourceDefinitionId: "onr_proteus_137_death-from-above",
      visibility: { class: "hidden_info_barrier", hiddenZoneBarrier: true },
    });
    expect(deathPublicPayload).not.toHaveProperty(
      "cardImplementationPrimitiveKind",
    );
    expect(deathPublicPayload).not.toHaveProperty(
      "cardImplementationAbilityId",
    );
    const deathPublicPayloadJson = JSON.stringify(deathPublicPayload);
    expect(deathPublicPayloadJson).not.toContain(String(assetId));
    expect(deathPublicPayloadJson).not.toContain(String(upgradeId));
    expect(deathPublicPayloadJson).not.toContain(String(iceId));
    const deathReplay = replayEvents(
      deathReplayInitial,
      deathState.eventLog.slice(deathReplayStart),
    );
    expect(deathReplay.ok).toBe(true);
    expect(hashState(deathReplay.state)).toBe(hashState(deathState));

    let emptyDeathState = runnerState("pro012-death-empty-remote");
    installHiddenResource(
      emptyDeathState,
      "onr_proteus_137_death-from-above",
      "pro012_death_empty",
    );
    emptyDeathState.corp.servers = emptyDeathState.corp.servers.filter(
      (server) => server.id !== "remote_1",
    );
    emptyDeathState.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "remote_1",
      ice: [],
      root: [],
    });
    emptyDeathState.run = {
      runId: "pro012_empty_remote_success",
      attackedServerId: "remote_1",
      phase: "access",
      position: { kind: "server", serverId: "remote_1" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
    };
    emptyDeathState.activeSide = "runner";
    emptyDeathState.timingPoint = "access.resolve_card";
    expect(
      getLegalActions(emptyDeathState, "runner").some(
        (candidate) =>
          candidate.payload?.cardImplementationPrimitiveKind ===
            "successful_run_before_access_effect" &&
          candidate.payload?.cardImplementationEffectKind ===
            "trash_remote_fort",
      ),
    ).toBe(false);

    for (const serverId of ["hq", "rd", "archives"] as const) {
      const wrongServerState = runnerState(`pro012-death-${serverId}`);
      installHiddenResource(
        wrongServerState,
        "onr_proteus_137_death-from-above",
        `pro012_death_${serverId}`,
      );
      wrongServerState.run = {
        runId: `pro012_${serverId}_success`,
        attackedServerId: serverId,
        phase: "access",
        position: { kind: "server", serverId },
        brokenSubroutineIndexes: [],
        resolvedSubroutineIndexes: [],
        successful: true,
      };
      wrongServerState.activeSide = "runner";
      wrongServerState.timingPoint = "access.resolve_card";
      expect(
        getLegalActions(wrongServerState, "runner").some(
          (candidate) =>
            candidate.payload?.cardImplementationPrimitiveKind ===
              "successful_run_before_access_effect" &&
            candidate.payload?.cardImplementationEffectKind ===
              "trash_remote_fort",
        ),
      ).toBe(false);
    }

    let mercenaryState = runnerState("pro012-mercenary");
    mercenaryState.runner.credits = 4;
    const mercenaryId = installHiddenResource(
      mercenaryState,
      "onr_proteus_145_mercenary-subcontract",
      "pro012_mercenary",
    );
    const operationId = addCorpServerCard(
      mercenaryState,
      "onr_v1_281_accounts-receivable",
      "pro012_accessed_operation",
      "rd",
      "root",
    );
    mercenaryState.corp.rd = [operationId, ...mercenaryState.corp.rd];
    const rdServer = mercenaryState.corp.servers.find(
      (server) => server.id === "rd",
    );
    if (rdServer)
      rdServer.root = rdServer.root.filter((id) => id !== operationId);
    mercenaryState.cardInstances[operationId]!.zone = {
      side: "corp",
      zone: "rd",
    };
    mercenaryState.run = {
      runId: "pro012_current_access",
      attackedServerId: "rd",
      phase: "access",
      position: { kind: "server", serverId: "rd" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
      accessedCardId: operationId,
    };
    mercenaryState.activeSide = "runner";
    mercenaryState.timingPoint = "access.resolve_card";
    // Access is represented by one current run.accessedCardId. Multiaccess repeats
    // this window per accessed card, so Mercenary's "one or more" is sequential here.
    const mercenaryAction = getLegalActions(mercenaryState, "runner").find(
      (candidate) =>
        candidate.payload?.hiddenResourceCurrentAccessTrash === true &&
        candidate.payload.hiddenResourceSourceCardId === mercenaryId,
    );
    expect(mercenaryAction).toBeDefined();
    expect(mercenaryAction?.costs).toEqual([{ credits: 4 }]);
    result = applyLegal(mercenaryState, "runner", mercenaryAction!);
    expect(result.ok).toBe(true);
    mercenaryState = result.state;
    expect(mercenaryState.runner.credits).toBe(0);
    expect(mercenaryState.cardInstances[mercenaryId]?.tapped).toBe(true);
    expect(mercenaryState.corp.archives).toContain(operationId);
    expect(mercenaryState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: "onr_proteus_145_mercenary-subcontract",
      hiddenZoneAction: "proteus_hidden_current_access_free_trash",
    });

    const agendaState = runnerState("pro012-mercenary-agenda");
    installHiddenResource(
      agendaState,
      "onr_proteus_145_mercenary-subcontract",
      "pro012_mercenary_agenda",
    );
    const agendaId = addCorpServerCard(
      agendaState,
      "onr_v1_188_ai-chief-financial-officer",
      "pro012_accessed_agenda",
      "rd",
      "root",
    );
    agendaState.corp.rd = [agendaId, ...agendaState.corp.rd];
    const agendaRdServer = agendaState.corp.servers.find(
      (server) => server.id === "rd",
    );
    if (agendaRdServer)
      agendaRdServer.root = agendaRdServer.root.filter((id) => id !== agendaId);
    agendaState.cardInstances[agendaId]!.zone = { side: "corp", zone: "rd" };
    agendaState.run = { ...mercenaryState.run!, accessedCardId: agendaId };
    agendaState.timingPoint = "access.resolve_card";
    expect(
      getLegalActions(agendaState, "runner").some(
        (candidate) =>
          candidate.payload?.hiddenResourceCurrentAccessTrash === true,
      ),
    ).toBe(false);
  });

  it("PRO012 Back Door to Netwatch cancels a successful trace and adds Bad Publicity only for non-tag effects", () => {
    let state = runnerState("pro012-back-door");
    const backDoorId = installHiddenResource(
      state,
      "onr_proteus_129_back-door-to-netwatch",
      "pro012_back_door",
    );
    state.runner.credits = 3;
    state.corp.badPublicity = 6;
    state.trace = {
      traceId: "pro012_trace",
      sourceCardInstanceId: "corp_trace_source" as CardInstanceId,
      sourceDefinitionId: "onr_v1_188_ai-chief-financial-officer",
      baseTraceStrength: 5,
      status: "trace_success_cancel",
      successEffect: { type: "net_damage", amount: 1 },
      corpBid: 0,
      runnerBid: 0,
      traceStrength: 5,
      runnerLink: 0,
      runnerStrength: 0,
    };
    state.pendingChoice = {
      choiceId: "pro012_trace_cancel_choice",
      side: "runner",
      source: "trace_success_cancel:pro012_trace",
      prompt: "Trace-Erfolgseffekt canceln",
      kind: "select_option",
      options: [
        { id: "pass", label: "Pass" },
        {
          id: `trace_success_cancel_${backDoorId}`,
          label: "Trace-Effekt canceln",
          publicLabel: "Trace-Effekt canceln",
          value: backDoorId,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "hidden_info_barrier",
    };
    const before = structuredClone(state);
    const result = resolveChoice(
      state,
      "runner",
      `trace_success_cancel_${backDoorId}`,
    );
    expect(result.ok).toBe(true);
    state = result.state;
    expect(state.trace).toBeUndefined();
    expect(state.runner.credits).toBe(0);
    expect(state.cardInstances[backDoorId]?.tapped).toBe(true);
    expect(state.corp.badPublicity).toBe(7);
    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("bad_publicity_7");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceEffectCanceled: true,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: "onr_proteus_129_back-door-to-netwatch",
      badPublicityAdded: 1,
    });
    const replay = replayEvents(
      before,
      state.eventLog.slice(before.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    const tagsOnly = runnerState("pro012-back-door-tags");
    const tagsBackDoorId = installHiddenResource(
      tagsOnly,
      "onr_proteus_129_back-door-to-netwatch",
      "pro012_back_door_tags",
    );
    tagsOnly.runner.credits = 3;
    tagsOnly.trace = {
      traceId: "pro012_tags_trace",
      sourceCardInstanceId: "corp_trace_source_tags" as CardInstanceId,
      sourceDefinitionId: "onr_v1_188_ai-chief-financial-officer",
      baseTraceStrength: 5,
      status: "trace_success_cancel",
      successEffect: { type: "add_tag", amount: 1 },
      corpBid: 0,
      runnerBid: 0,
      traceStrength: 5,
      runnerLink: 0,
      runnerStrength: 0,
    };
    tagsOnly.pendingChoice = {
      choiceId: "pro012_trace_cancel_tags_choice",
      side: "runner",
      source: "trace_success_cancel:pro012_tags_trace",
      prompt: "Trace-Erfolgseffekt canceln",
      kind: "select_option",
      options: [
        { id: "pass", label: "Pass" },
        {
          id: `trace_success_cancel_${tagsBackDoorId}`,
          label: "Trace-Effekt canceln",
          publicLabel: "Trace-Effekt canceln",
          value: tagsBackDoorId,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: tagsOnly.stateVersion,
      visibility: "hidden_info_barrier",
    };
    const tagsResult = resolveChoice(
      tagsOnly,
      "runner",
      `trace_success_cancel_${tagsBackDoorId}`,
    );
    expect(tagsResult.ok).toBe(true);
    expect(tagsResult.state.corp.badPublicity).toBe(0);
  });

  it("PRO012 Get Ready to Rumble opens only after successful Meat Damage and discards HQ deterministically", () => {
    let state = runnerState("pro012-rumble");
    const rumbleId = installHiddenResource(
      state,
      "onr_proteus_141_get-ready-to-rumble",
      "pro012_rumble",
    );
    addRunnerGripCard(state, "onr_v1_010_cascade", "pro012_grip_1");
    addRunnerGripCard(state, "onr_v1_011_cloak", "pro012_grip_2");
    addRunnerGripCard(state, "onr_v1_012_clown", "pro012_grip_3");
    addCorpHqCard(
      state,
      "onr_v1_188_ai-chief-financial-officer",
      "pro012_hq_1",
    );
    addCorpHqCard(
      state,
      "onr_v1_188_ai-chief-financial-officer",
      "pro012_hq_2",
    );
    addCorpHqCard(
      state,
      "onr_v1_188_ai-chief-financial-officer",
      "pro012_hq_3",
    );
    const hqCountBefore = state.corp.hq.length;
    const archivesCountBefore = state.corp.archives.length;
    const randomBefore = state.randomCounter;
    const summary = doDamage(state, {
      damageId: "pro012_meat",
      damageType: "meat",
      amount: 1,
      source: "pro012_test",
    });
    expect(summary.flatline).toBe(false);
    expect(state.pendingChoice?.source).toContain(
      "hidden_resource.post_meat_damage",
    );
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Get Ready to Rumble",
    );
    state.pendingChoice = {
      ...state.pendingChoice!,
      stateVersion: state.stateVersion,
    };
    const beforeChoice = structuredClone(state);
    const optionId = `post_meat_damage_${rumbleId}`;
    const result = resolveChoice(state, "runner", optionId);
    expect(result.ok).toBe(true);
    state = result.state;
    expect(state.pendingChoice).toBeUndefined();
    expect(state.cardInstances[rumbleId]?.tapped).toBe(true);
    expect(state.corp.hq).toHaveLength(hqCountBefore - 2);
    expect(state.corp.archives).toHaveLength(archivesCountBefore + 2);
    expect(state.randomCounter).toBe(randomBefore + 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenResourcePostMeatDamageDecision: "apply",
      hiddenRunnerResourceRevealed: true,
      discardedHqCount: 2,
    });
    const replay = replayEvents(
      beforeChoice,
      state.eventLog.slice(beforeChoice.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    const netState = runnerState("pro012-rumble-net");
    installHiddenResource(
      netState,
      "onr_proteus_141_get-ready-to-rumble",
      "pro012_rumble_net",
    );
    addRunnerGripCard(netState, "onr_v1_010_cascade", "pro012_net_grip");
    doDamage(netState, {
      damageId: "pro012_net",
      damageType: "net",
      amount: 1,
      source: "pro012_test",
    });
    expect(netState.pendingChoice).toBeUndefined();

    const flatlineState = runnerState("pro012-rumble-flatline");
    installHiddenResource(
      flatlineState,
      "onr_proteus_141_get-ready-to-rumble",
      "pro012_rumble_flatline",
    );
    flatlineState.runner.grip = [];
    doDamage(flatlineState, {
      damageId: "pro012_flatline",
      damageType: "meat",
      amount: 1,
      source: "pro012_test",
    });
    expect(flatlineState.pendingChoice).toBeUndefined();
    expect(flatlineState.winner).toBe("corp");
  });
});
