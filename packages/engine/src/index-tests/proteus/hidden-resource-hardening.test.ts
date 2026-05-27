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
import { doDamage } from "../../game/damage/damage-core";
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

function applyLegal(state: GameState, side: "corp" | "runner", action: LegalAction) {
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

describe("PRO011 hidden resource timing hardening", () => {
  it("offers bank resources only in runner cost/penalty support windows and revalidates stale/tapped sources", () => {
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

    state.cardInstances[chibaId]!.tapped = true;
    const tapped = applyLegal(state, "runner", action!);
    expect(tapped.ok).toBe(false);
    state.cardInstances[chibaId]!.tapped = false;

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
    expect(state.cardInstances[chibaId]?.tapped).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: "onr_proteus_133_chiba-bank-account",
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
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain("HQ Mole");
    expect(getPlayerView(state, "runner").run?.breach).toBeUndefined();

    const replayStart = state.eventLog.length;
    const replayInitial = structuredClone(state);
    state = apply(state, "runner", (candidate) => candidate.actionId === moleAction!.actionId);
    expect(state.run?.accessCount).toBe(3);
    expect(state.corp.hq).toEqual(hqBefore);
    const continueAction = getLegalActions(state, "runner").find(
      (candidate) =>
        candidate.type === "continue_run" &&
        candidate.payload?.hiddenRunnerResourceAccessStartContinue === true,
    );
    expect(continueAction).toBeDefined();
    state = apply(state, "runner", (candidate) => candidate.actionId === continueAction!.actionId);
    expect(state.run?.breach?.serverId).toBe("hq");
    expect(state.run?.breach?.queue.filter((entry) => entry.zone === "hq")).toHaveLength(
      Math.min(3, hqBefore.length),
    );
    const replay = replayEvents(replayInitial, state.eventLog.slice(replayStart));
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
    const replay = replayEvents(before, state.eventLog.slice(before.eventLog.length));
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
    addCorpHqCard(state, "onr_v1_188_ai-chief-financial-officer", "pro012_hq_1");
    addCorpHqCard(state, "onr_v1_188_ai-chief-financial-officer", "pro012_hq_2");
    addCorpHqCard(state, "onr_v1_188_ai-chief-financial-officer", "pro012_hq_3");
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
    expect(state.pendingChoice?.source).toContain("hidden_resource.post_meat_damage");
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
