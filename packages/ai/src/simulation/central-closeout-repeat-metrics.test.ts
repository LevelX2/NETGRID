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

  it("does not credit a substitution for progression that happened earlier in the turn", () => {
    const metrics = summarizeCentralCloseoutRepeatMetrics([
      centralSummary([
        {
          side: "runner",
          actionType: "install_card",
          turnNumber: 1,
          runnerRigInstallAction: true,
        } as AiSimulationSummary["actionSequence"][number],
        {
          side: "runner",
          actionType: "end_turn",
          turnNumber: 1,
          runnerNoFreshCentralServerIds: ["hq"],
          runnerNoFreshCentralSubstitutionType: "end_turn",
        } as AiSimulationSummary["actionSequence"][number],
      ]),
    ]);

    expect(metrics.noFreshCentralSubstitutions).toBe(1);
    expect(metrics.substitutionLedToProgression).toBe(0);
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
