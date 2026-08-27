import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import { assessRunnerHandRotation } from "./runner-hand-rotation-assessment";

describe("assessRunnerHandRotation", () => {
  it("admits generic full-hand rotation for a classified redundant copy", () => {
    const assessment = assessRunnerHandRotation(runnerInput(fullHand()), [
      handEvaluation("card-5", { deferReason: "duplicate" }),
    ]);

    expect(assessment).toMatchObject({
      handCapacityGap: 0,
      genericDrawAdmissible: true,
      exactKnownNeedDrawAdmissible: true,
      status: "known_rotation_target_available",
      knownRotationTargetCardInstanceIds: ["card-5"],
    });
  });

  it("does not admit generic rotation when the hand already exceeds its limit", () => {
    const input = runnerInput(fullHand());
    input.playerView.own.maxHandSize = 3;

    const assessment = assessRunnerHandRotation(input, [
      handEvaluation("card-5", {
        developmentRole: "duplicate_or_low_value",
        deferReason: "duplicate",
      }),
    ]);

    expect(assessment).toMatchObject({
      handCapacityGap: -2,
      genericDrawAdmissible: false,
      exactKnownNeedDrawAdmissible: false,
      status: "known_rotation_target_available",
      knownRotationTargetCardInstanceIds: ["card-5"],
    });
  });

  it("keeps an expensive strong card protected while leaving an exact need free to assess the cleanup trade-off", () => {
    const assessment = assessRunnerHandRotation(runnerInput(fullHand()), [
      handEvaluation("card-5", {
        availability: "missing_credits",
        deferReason: "missing_credits",
        strategicFit: "strong",
      }),
    ]);

    expect(assessment).toMatchObject({
      genericDrawAdmissible: false,
      exactKnownNeedDrawAdmissible: true,
      status: "exact_need_cleanup_tradeoff_only",
      knownRotationTargetCardInstanceIds: [],
    });
  });

  it("admits rotation for a weak unaffordable card with no near-term need", () => {
    const assessment = assessRunnerHandRotation(runnerInput(fullHand()), [
      handEvaluation("card-5", {
        availability: "missing_credits",
        deferReason: "missing_credits",
        strategicFit: "weak",
      }),
    ]);

    expect(assessment.genericDrawAdmissible).toBe(true);
    expect(assessment.knownRotationTargetCardInstanceIds).toEqual(["card-5"]);
  });
});

function fullHand(): VisibleCard[] {
  return Array.from({ length: 5 }, (_, index) => ({
    instanceId: `card-${index + 1}`,
    side: "runner",
    zone: "grip",
    known: true,
    definitionId: `test-card-${index + 1}`,
  })) as VisibleCard[];
}

function runnerInput(hand: VisibleCard[]): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: {
        gripOrHq: hand,
        maxHandSize: 5,
        stackOrRdCount: 10,
      },
    },
  } as AiDecisionInput;
}

function handEvaluation(
  cardInstanceId: string,
  overrides: Partial<RunnerHandDevelopmentEvaluation>,
): RunnerHandDevelopmentEvaluation {
  return {
    schemaVersion: "runner-hand-development-evaluation-v4",
    cardInstanceId,
    definitionId: `test-${cardInstanceId}`,
    availability: "legal_now",
    developmentRole: "unknown",
    strategicFit: "weak",
    currentNeed: "later",
    priority: 0,
    activationPrerequisites: [],
    deferReason: "no_current_need",
    evidence: [],
    ...overrides,
  };
}
