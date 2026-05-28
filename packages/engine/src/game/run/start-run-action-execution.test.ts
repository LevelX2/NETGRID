import type { CardInstanceId, GameState, LegalAction } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  handleStartRunActionExecution,
  type StartRunActionExecutionHost,
} from "./start-run-action-execution";

function state(): GameState {
  return {
    stateVersion: 10,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    runner: {
      credits: 5,
      clicks: 3,
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
      servers: [],
    },
    runnerTurnFlags: {
      allNighterBonusRunPending: true,
      bodyweightDataCrecheExtraRunPending: true,
      wilsonRunOnlyActionsRemaining: 1,
    },
    cardInstances: {},
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function action(
  payload: NonNullable<LegalAction["payload"]> = { serverId: "hq" },
): LegalAction {
  return {
    actionId: "runner.start_run.hq",
    type: "start_run",
    label: "Run HQ",
    side: "runner",
    source: "game_rule",
    stateVersion: 10,
    timingPoint: "runner_action.main",
    costs: [],
    payload,
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 11,
  } as unknown as LegalAction;
}

function hostFor(
  gameState: GameState,
  calls: string[],
  activeWilsonIds: CardInstanceId[] = ["wilson_1" as CardInstanceId],
): StartRunActionExecutionHost {
  return {
    state: gameState,
    payment: {
      spendRunnerClick: () => {
        calls.push("spend_click");
        gameState.runner.clicks -= 1;
      },
      payRunStartTaxCredits: (legalAction) => {
        calls.push(`pay_tax:${legalAction.payload?.runStartTaxCredits ?? 0}`);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          runStartTaxPaid: Number(legalAction.payload?.runStartTaxCredits ?? 0),
        };
      },
    },
    turn: {
      ensureRunnerTurnFlags: () =>
        gameState.runnerTurnFlags as NonNullable<GameState["runnerTurnFlags"]>,
    },
    run: {
      validateRovingSubmarineRunGate: (serverId) =>
        calls.push(`validate:${serverId}`),
      startRun: (serverId, legalAction) => {
        calls.push(`start:${serverId}:${legalAction.type}`);
        gameState.run = {
          runId: "run_11",
          attackedServerId: serverId,
          phase: "approach_ice",
          position: { kind: "server", serverId },
          brokenSubroutineIndexes: [],
          resolvedSubroutineIndexes: [],
          bartmossUsedBreakerIdsThisEncounter: [],
          aardvarkInterceptionIceIds: [],
          blinkUsedSubroutinesByBreakerThisEncounter: {},
          successful: false,
          accessCount: 1,
        } as NonNullable<GameState["run"]>;
      },
      activeWilsonSourceIds: () => activeWilsonIds,
    },
  };
}

describe("start-run-action-execution", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./start-run-action-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it("returns unhandled for unrelated actions", () => {
    const calls: string[] = [];
    const result = handleStartRunActionExecution(
      hostFor(state(), calls),
      { ...action(), type: "gain_credit" } as LegalAction,
    );

    expect(result).toEqual({ handled: false });
    expect(calls).toEqual([]);
  });

  it("spends a click and delegates a basic run with stable server id", () => {
    const gameState = state();
    const calls: string[] = [];

    const result = handleStartRunActionExecution(
      hostFor(gameState, calls),
      action({ serverId: "rd" }),
    );

    expect(result.handled).toBe(true);
    expect(gameState.runner.clicks).toBe(2);
    expect(gameState.run?.attackedServerId).toBe("rd");
    expect(calls).toEqual([
      "validate:rd",
      "spend_click",
      "start:rd:start_run",
      "pay_tax:0",
    ]);
  });

  it("clears bonus-run flags without spending a click", () => {
    const gameState = state();
    const calls: string[] = [];

    handleStartRunActionExecution(
      hostFor(gameState, calls),
      action({ serverId: "hq", bonusRunNoClick: true }),
    );

    expect(gameState.runner.clicks).toBe(3);
    expect(gameState.runnerTurnFlags?.allNighterBonusRunPending).toBe(false);
    expect(gameState.runnerTurnFlags?.bodyweightDataCrecheExtraRunPending).toBe(
      false,
    );
    expect(calls).toEqual(["validate:hq", "start:hq:start_run", "pay_tax:0"]);
  });

  it("applies Wilson run-only action and spending-cap payload", () => {
    const gameState = state();
    const calls: string[] = [];
    const legalAction = action({ serverId: "archives", wilsonRunOnlyAction: true });

    handleStartRunActionExecution(hostFor(gameState, calls), legalAction);

    expect(gameState.runnerTurnFlags?.wilsonRunOnlyActionsRemaining).toBe(0);
    expect(gameState.run?.wilsonRunSpendingCap).toEqual({
      sourceCardInstanceId: "wilson_1",
      limit: 3,
      spent: 0,
    });
    expect(legalAction.payload).toMatchObject({
      wilsonRunOnlyAction: true,
      runSpendingCap: 3,
      runSpendingCapSpent: 0,
      wilsonRunSpendingCapActive: true,
    });
  });

  it("preserves Wilson exhaustion and run-start-tax delegation", () => {
    const gameState = state();
    const calls: string[] = [];
    gameState.runnerTurnFlags!.wilsonRunOnlyActionsRemaining = 0;

    expect(() =>
      handleStartRunActionExecution(
        hostFor(gameState, calls),
        action({ serverId: "hq", wilsonRunOnlyAction: true }),
      ),
    ).toThrow("Es ist keine Wilson-Run-Aktion verfuegbar.");

    const taxAction = action({ serverId: "hq", runStartTaxCredits: 2 });
    handleStartRunActionExecution(hostFor(state(), calls), taxAction);
    expect(taxAction.payload).toMatchObject({ runStartTaxPaid: 2 });
  });

  it("revalidates pending Pirate Broadcast sequence runs", () => {
    const gameState = state();
    const calls: string[] = [];
    gameState.runnerTurnFlags!.pirateBroadcastPending = {
      sourceCardId: "pirate_1" as CardInstanceId,
      sourceDefinitionId: "onr_proteus_116_pirate-broadcast",
      sourceTitle: "Pirate Broadcast",
      pendingServerIds: ["rd", "archives"],
      successfulServerIds: ["hq"],
    };

    expect(() =>
      handleStartRunActionExecution(
        hostFor(gameState, calls),
        action({ serverId: "hq", bonusRunNoClick: true, pirateBroadcastRun: true }),
      ),
    ).toThrow("Pirate Broadcast verlangt den nächsten Data Fort.");
    expect(() =>
      handleStartRunActionExecution(
        hostFor(gameState, calls),
        action({ serverId: "rd" }),
      ),
    ).toThrow("Pirate Broadcast erzwingt den nächsten Data-Fort-Run.");

    handleStartRunActionExecution(
      hostFor(gameState, calls),
      action({
        serverId: "rd",
        bonusRunNoClick: true,
        pirateBroadcastRun: true,
        bonusRunSource: "onr_proteus_116_pirate-broadcast",
      }),
    );

    expect(gameState.runner.clicks).toBe(3);
    expect(gameState.run?.attackedServerId).toBe("rd");
  });
});
