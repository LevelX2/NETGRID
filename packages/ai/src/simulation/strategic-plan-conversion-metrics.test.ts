import { describe, expect, it } from "vitest";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  strategicPlanKindMatches,
  summarizeStrategicPlanConversionMetrics,
} from "./strategic-plan-conversion-metrics";

describe("strategicPlanKindMatches", () => {
  it("matches strategic plan kinds by bounded terms", () => {
    expect(
      strategicPlanKindMatches("recover_economy_plan", ["recover_economy"]),
    ).toBe(true);
    expect(
      strategicPlanKindMatches("recover_economyish_noise", ["recover_economy"]),
    ).toBe(false);
    expect(
      strategicPlanKindMatches("protect_hq", ["protect_hq", "protect_rnd"]),
    ).toBe(true);
    expect(strategicPlanKindMatches("protector_hq_noise", ["protect_hq"])).toBe(
      false,
    );
  });
});

describe("summarizeStrategicPlanConversionMetrics", () => {
  const reserve = entry("runner", "gain_credit", "runner.plan.reserve");
  const pressure = entry("runner", "start_run", "runner.plan.pressure");

  it("counts only progress by the side repeating its plan", () => {
    const score = entry("corp", "score_agenda", "corp.plan.score");
    const steal = entry("runner", "steal_agenda", "runner.run.steal");
    expect(
      metrics([reserve, score, reserve])
        .sameStrategicPlanRepeatedWithoutProgress,
    ).toBe(1);
    expect(
      metrics([reserve, steal, reserve])
        .sameStrategicPlanRepeatedWithoutProgress,
    ).toBe(0);
  });

  it("requires an observed plan change across the complete own-decision window", () => {
    expect(metrics([reserve]).planIntentAbandonedWithoutReason).toBe(0);
    expect(
      metrics([reserve, pressure, pressure]).planIntentAbandonedWithoutReason,
    ).toBe(0);
    expect(
      metrics([reserve, pressure, reserve, pressure])
        .planIntentAbandonedWithoutReason,
    ).toBe(0);
    expect(
      metrics([reserve, pressure, pressure, pressure])
        .planIntentAbandonedWithoutReason,
    ).toBe(1);
    const explained = {
      ...pressure,
      evidence: [
        "plan_abort_taken:true",
        "plan_abort_reason:information_change",
      ],
    };
    expect(
      metrics([reserve, explained, pressure, pressure])
        .planIntentAbandonedWithoutReason,
    ).toBe(0);
  });
});

function metrics(actionSequence: AiSimulationActionSequenceEntry[]) {
  return summarizeStrategicPlanConversionMetrics(
    [{ actionSequence } as AiSimulationSummary],
    (decision) =>
      decision.actionType === "score_agenda" ||
      decision.actionType === "steal_agenda",
    () => false,
  );
}

function entry(
  side: AiSimulationActionSequenceEntry["side"],
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
    qualityTags: [],
    stateHashAfter: "sha256:test",
    fallbackUsed: false,
    timeoutUsed: false,
  };
}
