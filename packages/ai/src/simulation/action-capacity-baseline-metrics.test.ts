import { describe, expect, it } from "vitest";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { summarizeActionCapacityBaselineMetrics } from "./action-capacity-baseline-metrics";

describe("action-capacity baseline metrics", () => {
  it("tracks opportunities, planned follow-ups, expiration, and misconversion", () => {
    const metrics = summarizeActionCapacityBaselineMetrics([
      summary([
        entry({
          turnNumber: 1,
          actionCapacityOpportunity: true,
          actionCapacitySourceUsed: true,
          actionCapacityPlanConversionUsed: true,
          actionType: "play_operation",
        }),
        entry({ turnNumber: 1, actionType: "score_agenda" }),
        entry({
          turnNumber: 2,
          actionCapacityOpportunity: true,
          actionCapacitySourceUsed: true,
          actionType: "play_operation",
        }),
        entry({
          turnNumber: 2,
          actionType: "end_turn",
          actionsRemainingBefore: 1,
        }),
      ]),
    ]);

    expect(metrics).toEqual({
      actionCapacityOpportunities: 2,
      actionCapacityUses: 2,
      actionCapacityPlanConversions: 1,
      actionCapacityFollowupConversions: 1,
      actionCapacityExpiredUses: 1,
      actionCapacityMisconversions: 1,
    });
  });

  it("counts an inline self-financing action as a converted use", () => {
    const metrics = summarizeActionCapacityBaselineMetrics([
      summary([
        entry({
          side: "runner",
          turnNumber: 1,
          timingPoint: "runner_action.main",
          actionType: "start_run",
          actionCapacityOpportunity: true,
          actionCapacitySourceUsed: true,
          actionCapacityInlineConversionUsed: true,
          actionsRemainingBefore: 0,
        }),
        entry({
          side: "runner",
          turnNumber: 1,
          timingPoint: "runner_action.main",
          actionType: "end_turn",
          actionsRemainingBefore: 0,
        }),
      ]),
    ]);

    expect(metrics).toMatchObject({
      actionCapacityUses: 1,
      actionCapacityFollowupConversions: 1,
      actionCapacityExpiredUses: 0,
      actionCapacityMisconversions: 0,
    });
  });
});

function summary(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary {
  return { actionSequence } as unknown as AiSimulationSummary;
}

function entry(
  overrides: Partial<AiSimulationSummary["actionSequence"][number]>,
): AiSimulationSummary["actionSequence"][number] {
  return {
    side: "corp",
    stateVersionBefore: 1,
    actionType: "gain_credit",
    timingPoint: "corp_action.main",
    turnNumber: 1,
    reasonCode: "test",
    explanation: "test",
    confidence: 1,
    evidence: [],
    qualityTags: [],
    stateHashAfter: "hash",
    fallbackUsed: false,
    timeoutUsed: false,
    ...overrides,
  } as AiSimulationSummary["actionSequence"][number];
}
