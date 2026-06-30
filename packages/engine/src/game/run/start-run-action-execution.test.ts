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
      bonusRunPending: true,
      successfulRunExtraRunPending: true,
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
  activeRunOnlyActionSourceIds: CardInstanceId[] = [
    "wilson_1" as CardInstanceId,
  ],
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
        const amount = Number(legalAction.payload?.runStartTaxCredits ?? 0);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          runStartTaxPaid: amount,
        };
        return { handled: amount > 0, paid: amount > 0, amount };
      },
    },
    turn: {
      ensureRunnerTurnFlags: () =>
        gameState.runnerTurnFlags as NonNullable<GameState["runnerTurnFlags"]>,
    },
    run: {
      validateActivityGatedFortRun: (serverId) =>
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
      activeRunActionSpendingCapSourceIds: () => activeRunOnlyActionSourceIds,
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
    const result = handleStartRunActionExecution(hostFor(state(), calls), {
      ...action(),
      type: "gain_credit",
    } as LegalAction);

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
      "pay_tax:0",
      "spend_click",
      "start:rd:start_run",
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
    expect(gameState.runnerTurnFlags?.bonusRunPending).toBe(false);
    expect(gameState.runnerTurnFlags?.successfulRunExtraRunPending).toBe(
      false,
    );
    expect(calls).toEqual(["validate:hq", "pay_tax:0", "start:hq:start_run"]);
  });

  it("applies direct run-only action and spending-cap payload", () => {
    const gameState = state();
    const calls: string[] = [];
    const legalAction = action({
      serverId: "archives",
      runOnlyAction: true,
      runOnlyActionSourceCardId: "wilson_1",
    });

    handleStartRunActionExecution(hostFor(gameState, calls), legalAction);

    expect(
      gameState.runnerTurnFlags?.runOnlyActionUsedSourceIdsThisTurn,
    ).toEqual(["wilson_1"]);
    expect(gameState.run?.runActionSpendingCap).toEqual({
      sourceCardInstanceId: "wilson_1",
      limit: 3,
      spent: 0,
    });
    expect(legalAction.payload).toMatchObject({
      runOnlyAction: true,
      runSpendingCap: 3,
      runSpendingCapSpent: 0,
      runActionSpendingCapActive: true,
    });
  });

  it("starts a direct Wilson run by gaining and spending its extra action", () => {
    const gameState = state();
    const calls: string[] = [];
    gameState.runner.clicks = 0;
    const legalAction = action({
      serverId: "hq",
      cardId: "wilson_1",
      runOnlyAction: true,
      runOnlyActionSourceCardId: "wilson_1",
    });

    handleStartRunActionExecution(hostFor(gameState, calls), legalAction);

    expect(gameState.runner.clicks).toBe(0);
    expect(
      gameState.runnerTurnFlags?.runOnlyActionUsedSourceIdsThisTurn,
    ).toEqual(["wilson_1"]);
    expect(gameState.run?.runActionSpendingCap).toEqual({
      sourceCardInstanceId: "wilson_1",
      limit: 3,
      spent: 0,
    });
    expect(calls).toEqual([
      "validate:hq",
      "pay_tax:0",
      "spend_click",
      "start:hq:start_run",
    ]);
  });

  it("preserves run-only source exhaustion and run-start-tax delegation", () => {
    const gameState = state();
    const calls: string[] = [];
    gameState.runnerTurnFlags!.runOnlyActionUsedSourceIdsThisTurn = [
      "wilson_1" as CardInstanceId,
    ];

    expect(() =>
      handleStartRunActionExecution(
        hostFor(gameState, calls),
        action({
          serverId: "hq",
          runOnlyAction: true,
          runOnlyActionSourceCardId: "wilson_1",
        }),
      ),
    ).toThrow("Diese Run-Aktion wurde diesen Zug bereits genutzt.");

    const taxAction = action({ serverId: "hq", runStartTaxCredits: 2 });
    handleStartRunActionExecution(hostFor(state(), calls), taxAction);
    expect(taxAction.payload).toMatchObject({ runStartTaxPaid: 2 });
  });

  it("revalidates pending multi-server success sequence runs", () => {
    const gameState = state();
    const calls: string[] = [];
    gameState.runnerTurnFlags!.pendingSequences = [
      {
        kind: "multi_server_success_sequence",
        sequence: "run_each_data_fort",
        sourceCardId: "pirate_1" as CardInstanceId,
        sourceDefinitionId: "onr_proteus_116_pirate-broadcast",
        sourceTitle: "Pirate Broadcast",
        pendingServerIds: ["rd", "archives"],
        successfulServerIds: ["hq"],
        onAllSuccessful: "gain_runner_event_agenda_point",
        onAnyUnsuccessful: "forgo_next_action",
        advanceOnSuccessfulRun: true,
        failOnUnsuccessfulRun: true,
      },
    ];

    expect(() =>
      handleStartRunActionExecution(
        hostFor(gameState, calls),
        action({
          serverId: "hq",
          bonusRunNoClick: true,
          multiServerSuccessSequenceRun: true,
        }),
      ),
    ).toThrow("Die offene Run-Sequenz verlangt den naechsten Data Fort.");
    expect(() =>
      handleStartRunActionExecution(
        hostFor(gameState, calls),
        action({ serverId: "rd" }),
      ),
    ).toThrow("Die offene Run-Sequenz erzwingt den naechsten Data-Fort-Run.");

    handleStartRunActionExecution(
      hostFor(gameState, calls),
      action({
        serverId: "rd",
        bonusRunNoClick: true,
        multiServerSuccessSequenceRun: true,
        bonusRunSource: "onr_proteus_116_pirate-broadcast",
      }),
    );

    expect(gameState.runner.clicks).toBe(3);
    expect(gameState.run?.attackedServerId).toBe("rd");
  });
});
