import { describe, expect, it } from "vitest";
import type { AiSimulationSummary } from "./ai-simulation-summary";

import { summarizeMatchProgressionMetrics } from "./match-progression-summary";

describe("summarizeMatchProgressionMetrics", () => {
  it("takes the last reserve observation once per successful run", () => {
    const observe = (runId: string, reserve: number) => ({
      ...action("access_card"),
      runnerReserveRunId: runId,
      runnerReserveAfterSuccessfulRun: reserve,
      runnerReserveAfterCentralRun: reserve,
    });
    const metrics = summarizeMatchProgressionMetrics([
      summary([observe("run-1", 1), observe("run-1", -1)]),
      summary([observe("run-1", 3)]),
    ]);

    expect(metrics.runnerReserveAfterSuccessfulRun).toBe(1);
  });

  it("keeps pressure switches, low-reserve turns and ICE order within a match", () => {
    const belowReserve = {
      ...action("gain_credit"),
      runnerCreditsBefore: 1,
      runnerBelowReserveBefore: true,
    };
    const ice = {
      ...action("install_card", "hq"),
      side: "corp" as const,
      installPlacement: "ice",
    };
    const metrics = summarizeMatchProgressionMetrics([
      summary([
        action("start_run", "hq"),
        action("start_run", "rd"),
        belowReserve,
        belowReserve,
        { ...ice, corpFutureRunIceInstalledAsDeadEffect: true },
      ]),
      summary([action("start_run", "archives"), belowReserve, ice]),
    ]);
    expect(metrics.pressureTargetSwitches).toBe(1);
    expect(metrics.runnerTurnsBelowContestReserve).toBe(2);
    expect(metrics.corpMultiIceInstallOrderFutureEffectDead).toBe(0);
  });

  it("counts successful access runs once per match, including multiaccess", () => {
    const observed = (actionType: string) => ({
      ...action(actionType, "hq"),
      runnerReserveRunId: "run-1",
      runnerReserveAccessTarget: "hq",
    });
    const metrics = summarizeMatchProgressionMetrics([
      summary([
        observed("access_card"),
        observed("decline_trash"),
        observed("access_card"),
      ]),
      summary([observed("access_card")]),
    ]);
    expect(metrics.successfulCentralRuns).toBe(2);
  });

  it("counts successful remote access action types exactly", () => {
    const metrics = summarizeMatchProgressionMetrics([
      summary([
        action("start_run", "remote_1"),
        action("access_card"),
        action("access_card_noise"),
      ]),
    ]);

    expect(metrics.successfulRemoteAccesses).toBe(1);
  });
});

function summary(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary {
  return {
    seed: "test-seed",
    winner: "runner",
    actions: actionSequence.length,
    turns: 1,
    finalAgendaPoints: { runner: 0, corp: 0 },
    finalStateHash: "hash",
    eventLogLength: 0,
    replayOk: true,
    replayErrors: [],
    actionSequence,
    errors: [],
    cardPoolVersion: "test",
    metrics: {},
  } as unknown as AiSimulationSummary;
}

function action(
  actionType: string,
  targetServerId?: string,
): AiSimulationSummary["actionSequence"][number] {
  return {
    side: "runner",
    actionType,
    turnNumber: 1,
    evidence: [],
    ...(targetServerId ? { targetServerId } : {}),
  } as unknown as AiSimulationSummary["actionSequence"][number];
}
