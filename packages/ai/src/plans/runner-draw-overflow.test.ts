import { describe, expect, it } from "vitest";

import {
  drawOverflowSeverity,
  runnerDrawOverflowCreditPriorityBoost,
  runnerDrawOverflowEvidence,
  runnerDrawOverflowPenalty,
  runnerDrawOverflowRationale,
  runnerDrawOverflowReasons,
  runnerDrawOverflowSupportsCreditPlan,
  runnerHandDevelopmentOverflowBonus,
} from "./runner-draw-overflow";
import type { RunnerDrawOverflowAssessment } from "./tactical-plan-types";

describe("runner draw overflow planning", () => {
  it("classifies projected hand limit pressure", () => {
    expect(drawOverflowSeverity(0, 0)).toBe("none");
    expect(drawOverflowSeverity(1, 0)).toBe("minor");
    expect(drawOverflowSeverity(2, 0)).toBe("moderate");
    expect(drawOverflowSeverity(3, 0)).toBe("high");
    expect(drawOverflowSeverity(1, 1)).toBe("high");
  });

  it("keeps overflow penalty math bounded and urgency-aware", () => {
    expect(
      runnerDrawOverflowPenalty({
        currentOverflow: 0,
        projectedOverflow: 2,
        severity: "moderate",
        discardFodderCount: 1,
        valuableCardsAtRisk: 1,
        usefulPlayableCardsInHand: 1,
        usefulHandCardsBlockedByCredits: 1,
        urgencyOverride: "none",
      }),
    ).toBe(330);

    expect(
      runnerDrawOverflowPenalty({
        currentOverflow: 2,
        projectedOverflow: 8,
        severity: "high",
        discardFodderCount: 0,
        valuableCardsAtRisk: 5,
        usefulPlayableCardsInHand: 4,
        usefulHandCardsBlockedByCredits: 4,
        urgencyOverride: "none",
      }),
    ).toBe(760);

    expect(
      runnerDrawOverflowPenalty({
        currentOverflow: 0,
        projectedOverflow: 1,
        severity: "minor",
        discardFodderCount: 1,
        valuableCardsAtRisk: 0,
        usefulPlayableCardsInHand: 0,
        usefulHandCardsBlockedByCredits: 0,
        urgencyOverride: "find_economy",
      }),
    ).toBe(0);
  });

  it("returns sorted unique reasons for overflow diagnostics", () => {
    expect(
      runnerDrawOverflowReasons({
        currentOverflow: 1,
        projectedOverflow: 2,
        severity: "moderate",
        discardFodderCount: 1,
        valuableCardsAtRisk: 1,
        usefulPlayableCardsInHand: 1,
        usefulHandCardsBlockedByCredits: 1,
        urgencyOverride: "find_breaker_for_score_threat",
        penalty: 330,
      }),
    ).toEqual([
      "already_over_hand_limit",
      "credit_base_needed_before_more_draw",
      "discard_fodder_reduces_penalty",
      "overdraw_penalty_applied",
      "projected_overflow",
      "urgency_override_keeps_draw_plausible",
      "useful_hand_play_available_before_draw",
      "valuable_hand_cards_at_risk",
    ]);
  });

  it("builds side-safe rationale and evidence strings from assessments", () => {
    const assessment = drawOverflowAssessment();

    expect(runnerDrawOverflowRationale(assessment)).toEqual([
      "handLimitPressure:moderate",
      "projectedOverflow:2",
      "drawOverflowPenalty:330",
      "discardFodderCount:1",
      "usefulPlayableCardsInHand:1",
      "urgencyOverride:none",
      "why_draw_over_install_or_credit:projected_overflow,overdraw_penalty_applied",
    ]);
    expect(runnerDrawOverflowEvidence(assessment)).toContain(
      "useful_hand_cards_blocked_by_credits:1",
    );
    expect(runnerDrawOverflowEvidence(assessment)).toContain(
      "why_draw_over_install_or_credit:projected_overflow,overdraw_penalty_applied",
    );
  });

  it("supports credit plans and hand development priorities without urgency", () => {
    const assessment = drawOverflowAssessment({
      usefulPlayableCardsInHand: 0,
      usefulHandCardsBlockedByCredits: 3,
    });

    expect(runnerDrawOverflowSupportsCreditPlan(assessment)).toBe(true);
    expect(runnerDrawOverflowCreditPriorityBoost(assessment)).toBe(240);
    expect(runnerHandDevelopmentOverflowBonus(assessment)).toBe(0);

    const installBeforeDraw = drawOverflowAssessment({
      severity: "high",
      usefulPlayableCardsInHand: 2,
    });

    expect(runnerDrawOverflowSupportsCreditPlan(installBeforeDraw)).toBe(false);
    expect(runnerHandDevelopmentOverflowBonus(installBeforeDraw)).toBe(210);
  });
});

function drawOverflowAssessment(
  overrides: Partial<RunnerDrawOverflowAssessment> = {},
): RunnerDrawOverflowAssessment {
  return {
    currentHandCount: 6,
    maxHandSize: 5,
    cardsToDraw: 1,
    remainingClicks: 2,
    projectedHandAfterDraw: 7,
    projectedOverflow: 2,
    severity: "moderate",
    discardFodderCount: 1,
    valuableCardsAtRisk: 1,
    usefulPlayableCardsInHand: 1,
    usefulHandCardsBlockedByCredits: 1,
    urgencyOverride: "none",
    penalty: 330,
    reasons: ["projected_overflow", "overdraw_penalty_applied"],
    ...overrides,
  };
}
