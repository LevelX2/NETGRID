import type { AiSimulationSummary } from "./ai-simulation-summary";
import { describe, expect, it } from "vitest";
import { summarizeCentralCloseoutRepeatMetrics } from "./central-closeout-repeat-metrics";

describe("summarizeCentralCloseoutRepeatMetrics", () => {
  it("bounds central run justification reasons to exact labels", () => {
    const metrics = summarizeCentralCloseoutRepeatMetrics([
      centralSummary([
        centralRunReason("hq", 1, "multiaccess"),
        centralRunReason("rd", 2, "multiaccessory_noise"),
      ]),
    ]);

    expect(metrics.centralRunJustifiedByMultiaccess).toBe(1);
  });
});

function centralSummary(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary {
  return {
    seed: "central-closeout-repeat-metrics",
    actionSequence,
  } as AiSimulationSummary;
}

function centralRunReason(
  targetServerId: string,
  turnNumber: number,
  runnerCentralRunJustificationReason: string,
): AiSimulationSummary["actionSequence"][number] {
  return {
    side: "runner",
    actionType: "start_run",
    targetServerId,
    turnNumber,
    stateVersionBefore: turnNumber,
    runnerCentralRunJustificationReason,
  } as AiSimulationSummary["actionSequence"][number];
}
