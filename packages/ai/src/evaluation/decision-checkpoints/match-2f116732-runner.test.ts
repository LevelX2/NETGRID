import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import successJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-2f116732-d112.json";
import endgameJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-2f116732-d240.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { runnerCurrentRunHasSafeCompletionReward } from "../../runtime/runner-known-access-payoff-context";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};
function replay(json: unknown) {
  const capture = structuredClone(json) as Capture;
  const snapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
  if (!snapshotId) throw new Error("Missing captured own deck snapshot");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(capture.input, snapshotId, capture.runtime);
  return {
    input: capture.input,
    decision: chooseAiAction(capture.input as AiDecisionInput),
  };
}

describe("match 2f116732 Runner decisions", () => {
  it("D112 converts the visible successful-run reward after the last ICE", () => {
    const { input, decision } = replay(successJson);
    expect(
      input.legalActions.find((a) => a.actionId === "runner.continue_run")
        ?.costs,
    ).toEqual([]);
    expect(decision).toMatchObject({
      actionId: "runner.continue_run",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          leafExecutorInstanceId:
            "plan:runner.convert_run_window:run%3Arun_177",
          route: { semanticActionType: "run.continue", stateVersion: 191 },
        },
      },
    });
  });
  it("D112 preserves the no-payoff exit without a success reward", () => {
    const capture = structuredClone(successJson) as Capture;
    const rig = capture.input.playerView.own.rig;
    if (!rig) throw new Error("Missing captured Runner rig");
    capture.input.playerView.own.rig = rig.filter(
      (c) => c.type !== "resource",
    );
    const { decision } = replay(capture);
    expect(decision.actionId).toBe("runner.jack_out");
    expect(decision.decisionDebug?.planKind).toBe("runner.convert_run_window");
  });
  it("D112 never turns an unknown root or an unfinished ICE path into a safe reward", () => {
    const capture = structuredClone(successJson) as Capture;
    const server = capture.input.playerView.servers.find(
      (s) => s.id === "remote_1",
    )!;
    server.root = [
      {
        instanceId: "hidden_control",
        known: false,
        rezzed: false,
        advancementCounters: 0,
      },
    ];
    expect(
      runnerCurrentRunHasSafeCompletionReward(capture.input as AiDecisionInput),
    ).toBe(false);
    const unfinished = structuredClone(successJson) as Capture;
    unfinished.input.playerView.run!.position = {
      kind: "ice",
      serverId: "remote_1",
      iceIndex: 0,
    };
    expect(
      runnerCurrentRunHasSafeCompletionReward(
        unfinished.input as AiDecisionInput,
      ),
    ).toBe(false);
  });
  it("D240 uses the reachable matchpoint HQ route with its actual safety floor", () => {
    const { input, decision } = replay(endgameJson);
    const targets = evaluateRunnerRunTargets({
      input: input as AiDecisionInput,
    });
    expect(targets.find((t) => t.targetServerId === "hq")).toMatchObject({
      pathCost: 5,
      creditsAfterRun: 6,
      fundingNeed: { reason: "none", protectedLiquidReserve: 3 },
      recommendation: "run_now",
    });
    expect(
      targets.find(
        (t) =>
          t.targetServerId === "rd" && t.actionId === "runner.start_run.rd",
      )?.prerunReserveQuote?.status,
    ).toBe("blocked");
    expect(decision).toMatchObject({
      actionId: "runner.start_run.hq",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.pressure_central",
        planFirstDecision: {
          rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
          leafExecutorInstanceId: "plan:runner.pressure_central:central%3Ahq",
          route: { semanticActionType: "run.start", stateVersion: 389 },
        },
      },
    });
  });
  it("D112 does not pay for the completion reward or ignore a known damage access", () => {
    const paid = structuredClone(successJson) as Capture;
    paid.input.legalActions.find(
      (a) => a.actionId === "runner.continue_run",
    )!.costs = [{ credits: 1 }];
    expect(
      runnerCurrentRunHasSafeCompletionReward(paid.input as AiDecisionInput),
    ).toBe(false);
    const danger = structuredClone(successJson) as Capture;
    danger.input.playerView.servers.find((s) => s.id === "remote_1")!.root = [
      {
        ...danger.input.playerView.opponent.scoreArea[0]!,
        instanceId: "visible_damage_control",
      },
    ];
    expect(
      runnerCurrentRunHasSafeCompletionReward(danger.input as AiDecisionInput),
    ).toBe(false);
  });
  it("D240 still funds a real post-run safety gap and protects a current remote threat", () => {
    const underfunded = structuredClone(endgameJson) as Capture;
    underfunded.input.playerView.own.credits = 6;
    const hq = evaluateRunnerRunTargets({
      input: underfunded.input as AiDecisionInput,
    }).find((t) => t.targetServerId === "hq");
    expect(hq).toMatchObject({
      recommendation: "gain_credits_first",
      fundingNeed: {
        reason: "post_run_floor_gap",
        protectedLiquidReserve: 3,
        postRunFloorGap: 2,
      },
    });
    const threatened = structuredClone(endgameJson) as Capture;
    const agenda = threatened.input.playerView.opponent.scoreArea[0]!;
    threatened.input.playerView.servers.find((s) => s.id === "remote_1")!.root =
      [
        {
          ...agenda,
          instanceId: "visible_threat_control",
          advancementCounters: 4,
        },
      ];
    const reserved = evaluateRunnerRunTargets({
      input: threatened.input as AiDecisionInput,
    }).find((t) => t.targetServerId === "hq");
    expect(reserved?.fundingNeed.protectedLiquidReserve).toBeGreaterThan(3);
  });
});
