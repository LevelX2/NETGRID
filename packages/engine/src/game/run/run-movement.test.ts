import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildLegalAction } from "../turn/action-builders";
import { encounterResolutionHost } from "./encounter-resolution";
import { encounterSpecialWindowHost } from "./encounter-special-windows";
import {
  continueFromMovement,
  handleRunMovementAction,
  movePastCurrentIce,
  type RunMovementHost,
} from "./run-movement";

function instance(
  id: string,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? "corp",
    zone: options.zone ?? { side: "corp", zone: "serverIce", serverId: "rd" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    strengthModifier: options.strengthModifier ?? 0,
    ...options,
  } as CardInstance;
}

function definition(id: string, title = id): CardDefinition {
  return {
    id,
    title,
    side: "corp",
    type: "ice",
  } as CardDefinition;
}

function makeState(
  options: {
    iceIds?: CardInstanceId[];
    positionIceIndex?: number;
    phase?: NonNullable<GameState["run"]>["phase"];
    positionKind?: "ice" | "server";
    approachedIceId?: CardInstanceId;
    encounteredIceId?: CardInstanceId | undefined;
    runnerCredits?: number;
  } = {},
): GameState {
  const outer = "ice_outer" as CardInstanceId;
  const inner = "ice_inner" as CardInstanceId;
  const iceIds = options.iceIds ?? [inner, outer];
  const position =
    options.positionKind === "server"
      ? { kind: "server" as const, serverId: "rd" as const }
      : {
          kind: "ice" as const,
          serverId: "rd" as const,
          iceIndex: options.positionIceIndex ?? iceIds.length - 1,
        };
  return {
    stateVersion: 12,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter_ice",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: options.runnerCredits ?? 5,
      clicks: 0,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [
        {
          id: "rd",
          kind: "rd",
          label: "R&D",
          ice: iceIds,
          root: [],
        },
      ],
    },
    cardInstances: {
      [outer]: instance(outer, "outer_ice"),
      [inner]: instance(inner, "inner_ice", { rezzed: false }),
    },
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: options.phase ?? "encounter_ice",
      position,
      approachedIceId: options.approachedIceId ?? options.encounteredIceId ?? outer,
      encounteredIceId: options.encounteredIceId ?? outer,
      brokenSubroutineIndexes: [0],
      resolvedSubroutineIndexes: [1],
      successful: false,
      accessCount: 1,
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function action(
  state: GameState,
  type: LegalAction["type"],
  costs: LegalAction["costs"] = [],
  payload?: LegalAction["payload"],
): LegalAction {
  return buildLegalAction(state, "runner", type, type, "game_rule", costs, payload);
}

function hostFor(
  state: GameState,
  options: {
    v097?: boolean;
    corpRootRezActionsAvailable?: boolean;
    approachExposeAvailable?: boolean;
  } = {},
): { host: RunMovementHost; calls: {
  beganEncounter: CardInstanceId[];
  access: LegalAction[];
  finish: Array<{ successful: boolean; legalAction?: LegalAction }>;
} } {
  const calls: {
    beganEncounter: CardInstanceId[];
    access: LegalAction[];
    finish: Array<{ successful: boolean; legalAction?: LegalAction }>;
  } = { beganEncounter: [], access: [], finish: [] };
  const recordFinish = (
    successful: boolean,
    legalAction?: LegalAction,
  ): void => {
    calls.finish.push({
      successful,
      ...(legalAction ? { legalAction } : {}),
    });
  };
  const host: RunMovementHost = {
    state,
    cards: {
      definitionFor: (cardId) =>
        definition(state.cardInstances[cardId]!.definitionId),
      cardInstanceFor: (cardId) => state.cardInstances[cardId]!,
    },
    servers: {
      mustServer: (serverId) => {
        const server = state.corp.servers.find(
          (candidate) => candidate.id === serverId,
        );
        if (!server) throw new Error(`Server fehlt: ${serverId}`);
        return server as CorpServer;
      },
      publicServerLabel: () => "R&D",
    },
    rules: {
      isV097OrLater: () => options.v097 ?? true,
      corpRunRootRezActionsAvailable: () =>
        options.corpRootRezActionsAvailable ?? false,
      approachIceExposeCanBeOfferedForCurrentIce: () =>
        options.approachExposeAvailable ?? false,
    },
    encounter: {
      encounterResolutionHost: () => encounterResolutionHost(state),
      encounterSpecialWindowHost: () =>
        encounterSpecialWindowHost(state, {
          finishRun: (successful, legalAction) =>
            recordFinish(successful, legalAction),
          rollDie: () => 4,
        }),
      beginEncounter: (iceId) => {
        calls.beganEncounter.push(iceId);
        state.run!.phase = "encounter_ice";
        state.run!.encounteredIceId = iceId;
        state.timingPoint = "run.encounter_ice";
      },
    },
    access: {
      startAccessFromSuccessfulRun: (legalAction) => {
        if (legalAction) calls.access.push(legalAction);
        if (state.run) state.run = { ...state.run, phase: "access" };
      },
    },
    cleanup: {
      finishRun: (successful, legalAction) =>
        recordFinish(successful, legalAction),
    },
  };
  return { host, calls };
}

describe("run movement execution", () => {
  it("leaves non-movement continue actions unhandled", () => {
    const state = makeState({ phase: "encounter_ice" });
    const { host } = hostFor(state);

    const result = handleRunMovementAction(host, action(state, "continue_run"));

    expect(result).toEqual({ handled: false });
    expect(state.run?.phase).toBe("encounter_ice");
  });

  it("moves past current ICE into the stable jack-out movement window", () => {
    const state = makeState();
    const { host } = hostFor(state);

    const result = movePastCurrentIce(host, action(state, "continue_run"));

    expect(result).toMatchObject({
      handled: true,
      movedPastIceId: "ice_outer",
      nextIceId: "ice_inner",
      runContinues: true,
    });
    expect(state.run).toMatchObject({
      phase: "movement",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      approachedIceId: "ice_inner",
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    });
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.activeSide).toBe("runner");
  });

  it("continues from movement to the next approach without starting access", () => {
    const state = makeState({
      phase: "movement",
      positionIceIndex: 0,
      approachedIceId: "ice_inner" as CardInstanceId,
      encounteredIceId: undefined,
    });
    const { host, calls } = hostFor(state);

    const result = continueFromMovement(host, action(state, "continue_run"));

    expect(result).toMatchObject({
      handled: true,
      runContinues: true,
      nextIceId: "ice_inner",
      approachStarted: true,
    });
    expect(state.run?.phase).toBe("approach_ice");
    expect(state.timingPoint).toBe("run.approach_ice");
    expect(state.activeSide).toBe("corp");
    expect(calls.access).toHaveLength(0);
  });

  it("continues from the server movement window into access through the callback", () => {
    const state = makeState({
      iceIds: ["ice_outer" as CardInstanceId],
      positionIceIndex: 0,
    });
    const { host, calls } = hostFor(state);
    movePastCurrentIce(host, action(state, "continue_run"));

    const continueAction = action(state, "continue_run");
    const result = continueFromMovement(host, continueAction);

    expect(result).toMatchObject({ handled: true, accessShouldStart: true });
    expect(calls.access).toEqual([continueAction]);
    expect(state.run?.phase).toBe("access");
  });

  it("pays jack-out costs and delegates run finish without changing payload shape", () => {
    const state = makeState({
      phase: "movement",
      positionKind: "server",
      runnerCredits: 3,
    });
    const { host, calls } = hostFor(state);
    const jackOut = action(state, "jack_out", [{ credits: 2 }], {
      v1922CorpIceAbility: "jack_out_tax_after_passed_rezzed_ice",
    });

    const result = handleRunMovementAction(host, jackOut);

    expect(result).toMatchObject({
      handled: true,
      runnerJackedOut: true,
      runEnded: true,
    });
    expect(state.runner.credits).toBe(1);
    expect(jackOut.payload).toMatchObject({
      v1922CorpIceAbility: "jack_out_tax_after_passed_rezzed_ice",
      jackOutAdditionalCost: 2,
      jackOutBeforeAccess: true,
      runnerCreditsAfter: 1,
      serverLabel: "R&D",
    });
    expect(calls.finish).toEqual([{ successful: false }]);
  });

  it("resolves post-pass pay-or-end-run payment without advancing movement", () => {
    const state = makeState({
      phase: "movement",
      positionKind: "server",
      runnerCredits: 4,
    });
    state.run!.postPassPayOrEndRun = {
      sourceCardInstanceIds: ["source_1" as CardInstanceId],
      sourceDefinitionIds: ["source_definition"],
      passedIceId: "ice_outer" as CardInstanceId,
      serverId: "rd",
      amount: 2,
    };
    const { host, calls } = hostFor(state);
    const pay = action(state, "continue_run", [{ credits: 2 }], {
      fortRunWindowAbility: "runner_pay_or_end_run_after_passing_ice_on_this_fort",
      decision: "pay",
      paymentAmount: 2,
      passedIceId: "ice_outer",
      serverId: "rd",
    });

    const result = handleRunMovementAction(host, pay);

    expect(result).toMatchObject({
      handled: true,
      postPassPaymentResolved: true,
      runContinues: true,
    });
    expect(state.runner.credits).toBe(2);
    expect(state.run?.postPassPayOrEndRun).toBeUndefined();
    expect(state.run?.phase).toBe("movement");
    expect(calls.access).toHaveLength(0);
    expect(pay.payload).toMatchObject({
      paidCredits: 2,
      endedRun: false,
      runnerCreditsAfter: 2,
    });
  });
});
