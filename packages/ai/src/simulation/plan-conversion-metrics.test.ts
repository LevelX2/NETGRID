import type { Side } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { summarizePlanConversionMetrics } from "./plan-conversion-metrics";

describe("summarizePlanConversionMetrics", () => {
  it("does not credit one side's board progress to the other side's plan", () => {
    const metrics = summarizePlanConversionMetrics([
      {
        seed: "side-scoped-plan-progress",
        actionSequence: [
          entry("runner", "gain_credit", "runner.plan.reserve"),
          entry("corp", "score_agenda", "corp.plan.score"),
          entry("runner", "gain_credit", "runner.plan.reserve"),
        ],
      } as AiSimulationSummary,
    ]);

    expect(metrics.samePlanRepeatedWithoutProgress).toBe(1);
  });
});

function entry(
  side: Side,
  actionType: AiSimulationActionSequenceEntry["actionType"],
  reasonCode: string,
): AiSimulationActionSequenceEntry {
  return {
    side,
    actionType,
    reasonCode,
    stateVersionBefore: 1,
    explanation: "test",
    confidence: 1,
    evidence: [],
    fallbackUsed: false,
    timeoutUsed: false,
  };
}
