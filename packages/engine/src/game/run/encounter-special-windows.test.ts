import {
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type SubroutineDefinition,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  encounterSpecialWindowHost,
  markSubmarineUplinkJackOutAfterEncounter,
  resolveEncounterSpecialWindowSubroutine,
  resolveStartupImmolatorTrashIce,
  resolveTooManyDoorsSecretSpendChoice,
  resolveVacuumLinkRewindSubroutine,
  startupImmolatorPostPassActions,
} from "./encounter-special-windows";

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: zone.side,
    controller: zone.side,
    zone,
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    counters: options.counters,
    ...options,
  } as CardInstance;
}

function playerChoice(optionId: string): PlayerAction {
  return {
    matchId: "match_1",
    side: "runner",
    actionId: "runner.resolve_choice",
    clientKnownStateVersion: 9,
    selectedChoices: { selectedOptionIds: [optionId] },
  } as PlayerAction;
}

function makeState(): GameState {
  return {
    stateVersion: 9,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter_ice",
    runner: {
      credits: 6,
      tags: 0,
      identity: "runner_identity",
      rig: {
        programs: ["startup_1" as CardInstanceId],
        hardware: [],
        resources: ["submarine_1" as CardInstanceId],
      },
      scoreArea: [],
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      servers: [
        {
          id: "rd",
          kind: "rd",
          ice: [
            "ice_current" as CardInstanceId,
            "ice_middle" as CardInstanceId,
            "ice_outer" as CardInstanceId,
          ],
          root: [],
        },
        { id: "hq", kind: "hq", ice: [], root: [] },
        { id: "archives", kind: "archives", ice: [], root: [] },
      ],
    },
    cardInstances: {
      startup_1: instance("startup_1", "onr_v1_068_startup-immolator", {
        side: "runner",
        zone: "rig",
      }),
      submarine_1: instance("submarine_1", "onr_v1_182_submarine-uplink", {
        side: "runner",
        zone: "rig",
      }),
      ice_current: instance("ice_current", "onr_v1_272_too-many-doors", {
        side: "corp",
        zone: "serverIce",
        serverId: "rd",
      }),
      ice_middle: instance("ice_middle", "onr_v1_250_ice-pick-willie", {
        side: "corp",
        zone: "serverIce",
        serverId: "rd",
      }),
      ice_outer: instance("ice_outer", "onr_v1_275_vacuum-link", {
        side: "corp",
        zone: "serverIce",
        serverId: "rd",
      }),
    },
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIceId: "ice_current" as CardInstanceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      fullyBrokenIceIds: ["ice_current" as CardInstanceId],
      startupImmolatorPendingPassedIceId: "ice_current" as CardInstanceId,
    },
  } as unknown as GameState;
}

describe("encounter special windows boundary", () => {
  it("runs Too Many Doors secret bid privately, then reveals and ends the run when Corp spent less", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const subroutine = {
      id: "too_many_doors_secret",
      type: "secret_spend_compare_end_run_unless_corp_spent_at_least_runner",
    } as SubroutineDefinition;
    let finished: boolean | undefined;
    const host = encounterSpecialWindowHost(state, {
      spendCredits: (side, amount) => {
        state[side].credits -= amount;
      },
      finishRun: (successful) => {
        finished = successful;
        delete state.run;
      },
    });

    const start = resolveEncounterSpecialWindowSubroutine(host, {
      definition: { id: "onr_v1_272_too-many-doors", title: "Too Many Doors" } as never,
      subroutine,
      subroutineIndex: 2,
      legalAction,
    });

    expect(start).toMatchObject({ handled: true, suspended: true });
    expect(state.pendingChoice).toMatchObject({
      choiceId:
        "p3_56.too_many_doors_secret_spend:run_1:ice_current:2.corp.10",
      side: "corp",
      kind: "bid_amount",
      visibility: "hidden_info_barrier",
    });
    expect(legalAction.payload).toMatchObject({
      secretSpendStarted: true,
      secretSpendAmounts: "0,1,2",
      sourceDefinitionId: "onr_v1_272_too-many-doors",
    });

    const corpStep = resolveTooManyDoorsSecretSpendChoice(
      host,
      legalAction,
      playerChoice("bid_1"),
    );
    expect(corpStep).toMatchObject({
      handled: true,
      secretBidCorpAmount: 1,
    });
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: "p3_56.too_many_doors_secret_spend:run_1:ice_current:2",
      visibility: "hidden_info_barrier",
    });
    expect(legalAction.payload).not.toHaveProperty("secretSpendCorp");

    const reveal = resolveTooManyDoorsSecretSpendChoice(
      host,
      legalAction,
      playerChoice("bid_2"),
    );
    expect(reveal).toMatchObject({
      handled: true,
      revealed: true,
      secretBidCorpAmount: 1,
      secretBidRunnerAmount: 2,
      runShouldEnd: true,
    });
    expect(finished).toBe(false);
    expect(state.corp.credits).toBe(4);
    expect(state.runner.credits).toBe(4);
    expect(state.pendingChoice).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      choiceVisibility: "public",
      secretSpendRevealed: true,
      secretSpendCorp: 1,
      secretSpendRunner: 2,
      tooManyDoorsEndRun: true,
      corpCreditsAfter: 4,
      runnerCreditsAfter: 4,
    });
  });

  it("rewinds Vacuum Link by deterministic die using rezzed ICE and preserves the random purpose", () => {
    const state = makeState();
    state.run!.encounteredIceId = "ice_current" as CardInstanceId;
    const legalAction = { payload: {} } as LegalAction;
    const purposes: string[] = [];
    const host = encounterSpecialWindowHost(state, {
      rollDie: (purpose) => {
        purposes.push(purpose);
        state.randomCounter += 1;
        return 2;
      },
      resetBreakerStrength: () => {
        state.runner.memoryUsed = 99;
      },
    });

    const result = resolveVacuumLinkRewindSubroutine(host, legalAction);

    expect(result).toMatchObject({
      handled: true,
      suspended: true,
      dieRoll: 2,
      repositionIceId: "ice_outer",
      repositionIndex: 2,
    });
    expect(purposes).toEqual([
      "onr_v1_272_too-many-doors.rewind.run_1.ice_current",
    ]);
    expect(state.run).toMatchObject({
      phase: "movement",
      position: { kind: "ice", serverId: "rd", iceIndex: 2 },
      approachedIceId: "ice_outer",
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    });
    expect(legalAction.payload).toMatchObject({
      vacuumLinkDieRoll: 2,
      vacuumLinkRewindApplied: true,
      vacuumLinkRewindRezzedIceBack: 2,
      vacuumLinkTargetIceId: "ice_outer",
      vacuumLinkTargetIceIndex: 2,
    });
  });

  it("leaves Vacuum Link in place on die 4 without reposition side effects", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const result = resolveVacuumLinkRewindSubroutine(
      encounterSpecialWindowHost(state, { rollDie: () => 4 }),
      legalAction,
    );

    expect(result).toMatchObject({
      handled: true,
      dieRoll: 4,
      stateChanged: false,
    });
    expect(state.run?.position).toEqual({
      kind: "ice",
      serverId: "rd",
      iceIndex: 0,
    });
    expect(legalAction.payload).toMatchObject({
      vacuumLinkDieRoll: 4,
      vacuumLinkRewindApplied: false,
    });
  });

  it("builds and resolves Startup Immolator post-pass action through callbacks", () => {
    const state = makeState();
    state.phase = "run";
    state.timingPoint = "run.jack_out_window";
    state.run!.phase = "movement";
    const trashed: CardInstanceId[] = [];
    const host = encounterSpecialWindowHost(state, {
      quoteIceRezCost: () => 3,
      spendCredits: (side, amount) => {
        state[side].credits -= amount;
      },
      trashCorpInstalledCard: (cardId) => {
        trashed.push(cardId);
      },
    });

    const actions = startupImmolatorPostPassActions(host);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      actionId: "runner.trigger_ability.startup_1.startup_1",
      side: "runner",
      type: "trigger_ability",
      source: "startup_1",
      costs: [{ credits: 3 }],
      payload: {
        cardId: "startup_1",
        targetIceId: "ice_current",
        targetIceDefinitionId: "onr_v1_272_too-many-doors",
        v1922RunnerProgramAbility: "startup_immolator_trash_ice",
        rezCostPaid: 3,
      },
    });

    const result = resolveStartupImmolatorTrashIce(host, actions[0]!);

    expect(result).toMatchObject({
      handled: true,
      sourceCardId: "startup_1",
      iceId: "ice_current",
      paymentAmount: 3,
      paid: true,
      iceTrashed: true,
    });
    expect(state.runner.credits).toBe(3);
    expect(trashed).toEqual(["ice_current"]);
    expect(state.run?.startupImmolatorPendingPassedIceId).toBeUndefined();
    expect(state.runnerTurnFlags?.startupImmolatorUsedSourceIdsThisTurn).toEqual([
      "startup_1",
    ]);
    expect(actions[0]!.payload).toMatchObject({
      sourceDefinitionId: "onr_v1_068_startup-immolator",
      trashedCount: 1,
      trashedCardDefinitionId: "onr_v1_272_too-many-doors",
      runnerCreditsAfter: 3,
      startupImmolatorExhausted: true,
    });
  });

  it("sets Submarine Uplink forced-jack-out marker only for the matching base-link source", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;

    const result = markSubmarineUplinkJackOutAfterEncounter(
      encounterSpecialWindowHost(state),
      "submarine_1" as CardInstanceId,
      legalAction,
    );

    expect(result).toMatchObject({
      handled: true,
      sourceCardId: "submarine_1",
      sourceDefinitionId: "onr_v1_182_submarine-uplink",
      forcedJackOutAfterEncounter: true,
    });
    expect(state.run?.forceJackOutAfterEncounterSourceId).toBe("submarine_1");
    expect(legalAction.payload).toMatchObject({
      forceJackOutAfterEncounter: true,
      sourceDefinitionId: "onr_v1_182_submarine-uplink",
    });

    const otherAction = { payload: {} } as LegalAction;
    const other = markSubmarineUplinkJackOutAfterEncounter(
      encounterSpecialWindowHost(state),
      "startup_1" as CardInstanceId,
      otherAction,
    );
    expect(other).toEqual({ handled: false });
    expect(otherAction.payload).toEqual({});
  });
});
