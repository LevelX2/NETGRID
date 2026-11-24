import { describe, expect, it } from "vitest";
import type { AiSimulationSummary } from "./ai-simulation-summary";

import { summarizeMatchProgressionMetrics } from "./match-progression-summary";

describe("summarizeMatchProgressionMetrics", () => {
  it("takes the last reserve observation once per successful run", () => {
    const observe = (runId: number, reserve: number) => ({
      ...action("access_card"),
      runnerReserveRunId: runId,
      runnerReserveAfterSuccessfulRun: reserve,
      runnerReserveAfterCentralRun: reserve,
    });
    const metrics = summarizeMatchProgressionMetrics([
      summary([observe(1, 1), observe(1, -1)]),
      summary([observe(1, 3)]),
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
        { ...action("start_run", "hq"), runnerRunStarted: true },
        { ...action("play_event", "rd"), runnerRunStarted: true },
        belowReserve,
        belowReserve,
        { ...ice, corpFutureRunIceInstalledAsDeadEffect: true },
      ]),
      summary([
        { ...action("start_run", "archives"), runnerRunStarted: true },
        belowReserve,
        ice,
      ]),
    ]);
    expect(metrics.pressureTargetSwitches).toBe(1);
    expect(metrics.runnerTurnsBelowContestReserve).toBe(2);
    expect(metrics.corpMultiIceInstallOrderFutureEffectDead).toBe(0);
  });

  it("counts each actual remote conversion once, including immediate agenda installs", () => {
    const created = (
      targetServerId: string,
      installPlacement: "root" | "ice",
    ) => ({
      ...action("install_card", targetServerId),
      side: "corp" as const,
      corpNewRemoteCreated: true as const,
      installPlacement,
      targetCardType:
        installPlacement === "root" ? ("agenda" as const) : ("ice" as const),
    });
    const withPayload = created("r1", "root");
    const empty = created("r2", "ice");
    const baitAndAsset = {
      ...action("install_card", "r2"),
      side: "corp" as const,
      reasonCode: "corp.asset_bait",
    };
    const metrics = summarizeMatchProgressionMetrics([
      summary([withPayload, empty, baitAndAsset]),
    ]);
    expect(metrics.corpNewRemoteCreated).toBe(2);
    expect(metrics.corpRemoteConvertedToAgendaAssetOrBait).toBe(2);
    expect(metrics.corpRemoteConversionRate).toBe(1);
    expect(metrics.corpRemoteCreatedThenNoScorePath).toBe(0);
  });

  it("ignores unknown remote role keys even when they name inherited object fields", () => {
    const metrics = summarizeMatchProgressionMetrics([
      summary([
        {
          ...action("run"),
          evidence: [
            "runner_remote_role_kind:constructor",
            "runner_remote_role_server_scope:toString",
            "runner_remote_role_kind:run_tax",
          ],
        },
      ]),
    ]);
    expect(metrics.remoteRoleByKind).toBe(1);
    expect(metrics.remoteRoleByServerScope).toBe(0);
  });

  it("counts successful access runs once per match, including multiaccess", () => {
    const observed = (actionType: string) => ({
      ...action(actionType, "hq"),
      runnerReserveRunId: 1,
      runnerReserveAccessTarget: "hq" as const,
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
        { ...action("play_event", "r1"), runnerRunStarted: true },
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
