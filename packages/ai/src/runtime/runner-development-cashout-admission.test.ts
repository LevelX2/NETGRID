import { describe, expect, it } from "vitest";

import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import { assessRunnerDevelopmentCashOutAdmission } from "./runner-development-cashout-admission";

describe("runner development cashout admission", () => {
  it("admits a cashout only when it closes a bound route and preserves the hand buffer", () => {
    const assessment = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [development()],
      currentCredits: 2,
      estimatedPayout: 3,
      clicksRemaining: 3,
      gripCount: 4,
      minimumHandBuffer: 3,
    });

    expect(assessment).toEqual({
      admitted: true,
      route: {
        targetCardInstanceId: "development-1",
        requiredCredits: 5,
        missingCredits: 3,
        projectedCreditsAfterCashOut: 5,
        projectedCreditsAfterDevelopment: 0,
        projectedHandAfterDevelopment: 3,
        evidenceCodes: expect.arrayContaining([
          "development_cashout_target:development-1",
          "development_cashout_hand_buffer_preserved:true",
        ]),
      },
      rejectionCodes: [],
    });
  });

  it("rejects the one-card Dwarf shape because conversion would consume the required hand buffer", () => {
    const assessment = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [
        development({
          developmentRole: "breaker_or_rig_piece",
          currentNeed: "acute",
        }),
      ],
      currentCredits: 2,
      estimatedPayout: 3,
      clicksRemaining: 4,
      gripCount: 1,
      minimumHandBuffer: 3,
    });

    expect(assessment).toEqual({
      admitted: false,
      rejectionCodes: [
        "development_cashout_rejected:no_bound_convertible_route",
        "development_cashout_rejected:required_hand_buffer:development-1",
      ],
    });
  });

  it("does not infer a hand-buffer exception from an acute role", () => {
    const assessment = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [
        development({
          developmentRole: "defense_support",
          currentNeed: "acute",
        }),
      ],
      currentCredits: 2,
      estimatedPayout: 3,
      clicksRemaining: 3,
      gripCount: 2,
      minimumHandBuffer: 3,
    });

    expect(assessment.admitted).toBe(false);
  });

  it("accepts only an explicitly bound and role-compatible emergency witness", () => {
    const evaluation = development({
      developmentRole: "defense_support",
      currentNeed: "acute",
    });
    const mismatched = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [evaluation],
      currentCredits: 2,
      estimatedPayout: 3,
      clicksRemaining: 3,
      gripCount: 2,
      minimumHandBuffer: 3,
      explicitException: {
        kind: "acute_coverage",
        targetCardInstanceId: evaluation.cardInstanceId,
        evidenceCode: "runner_missing_wall_coverage",
      },
    });
    const explicitSurvival = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [evaluation],
      currentCredits: 2,
      estimatedPayout: 3,
      clicksRemaining: 3,
      gripCount: 2,
      minimumHandBuffer: 3,
      explicitException: {
        kind: "acute_survival",
        targetCardInstanceId: evaluation.cardInstanceId,
        evidenceCode: "runner_confirmed_damage_threat",
      },
    });

    expect(mismatched.admitted).toBe(false);
    expect(explicitSurvival).toMatchObject({
      admitted: true,
      route: {
        targetCardInstanceId: evaluation.cardInstanceId,
        exceptionKind: "acute_survival",
        evidenceCodes: expect.arrayContaining([
          "development_cashout_exception:acute_survival",
          "runner_confirmed_damage_threat",
        ]),
      },
    });
  });

  it("rejects a payout that cannot close the exact gap or lacks a follow-up click", () => {
    const tooSmall = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [development()],
      currentCredits: 2,
      estimatedPayout: 2,
      clicksRemaining: 3,
      gripCount: 4,
      minimumHandBuffer: 3,
    });
    const finalClick = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [development()],
      currentCredits: 2,
      estimatedPayout: 3,
      clicksRemaining: 1,
      gripCount: 4,
      minimumHandBuffer: 3,
    });

    expect(tooSmall).toEqual({
      admitted: false,
      rejectionCodes: [
        "development_cashout_rejected:no_bound_convertible_route",
        "development_cashout_rejected:payout_does_not_close_gap:development-1",
      ],
    });
    expect(finalClick).toEqual({
      admitted: false,
      rejectionCodes: [
        "development_cashout_rejected:no_same_turn_conversion_window",
      ],
    });
  });

  it.each([
    [
      "currentCredits",
      Number.NaN,
      "development_cashout_rejected:invalid_current_credits",
    ],
    [
      "estimatedPayout",
      Number.POSITIVE_INFINITY,
      "development_cashout_rejected:invalid_estimated_payout",
    ],
    [
      "clicksRemaining",
      Number.NaN,
      "development_cashout_rejected:invalid_clicks_remaining",
    ],
    [
      "gripCount",
      Number.POSITIVE_INFINITY,
      "development_cashout_rejected:invalid_grip_count",
    ],
    [
      "minimumHandBuffer",
      Number.NaN,
      "development_cashout_rejected:invalid_minimum_hand_buffer",
    ],
  ] as const)(
    "rejects non-finite %s instead of normalizing it to zero",
    (field, value, rejectionCode) => {
      const assessment = assessRunnerDevelopmentCashOutAdmission({
        evaluations: [development()],
        currentCredits: 2,
        estimatedPayout: 3,
        clicksRemaining: 3,
        gripCount: 4,
        minimumHandBuffer: 3,
        [field]: value,
      });

      expect(assessment).toEqual({
        admitted: false,
        rejectionCodes: [rejectionCode],
      });
    },
  );

  it.each([
    [
      "installOrPlayCost",
      Number.NaN,
      "development_cashout_rejected:invalid_install_or_play_cost:development-1",
    ],
    [
      "missingCredits",
      Number.POSITIVE_INFINITY,
      "development_cashout_rejected:invalid_missing_credits:development-1",
    ],
    [
      "targetCredits",
      Number.NaN,
      "development_cashout_rejected:invalid_target_credits:development-1",
    ],
  ] as const)(
    "rejects a non-finite fundingNeed.%s",
    (field, value, rejectionCode) => {
      const base = development();
      const assessment = assessRunnerDevelopmentCashOutAdmission({
        evaluations: [
          development({
            fundingNeed: {
              ...base.fundingNeed!,
              [field]: value,
            },
          }),
        ],
        currentCredits: 2,
        estimatedPayout: 3,
        clicksRemaining: 3,
        gripCount: 4,
        minimumHandBuffer: 3,
      });

      expect(assessment).toEqual({
        admitted: false,
        rejectionCodes: [
          rejectionCode,
          "development_cashout_rejected:no_bound_convertible_route",
        ],
      });
    },
  );

  it("rejects blocked, unsatisfied, and low-value evaluations instead of treating them as routes", () => {
    const assessment = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [
        development({ strategicFit: "blocked" }),
        development({
          cardInstanceId: "development-2",
          activationPrerequisites: [
            { kind: "same_turn_access", satisfied: false },
          ],
        }),
        development({
          cardInstanceId: "development-3",
          developmentRole: "duplicate_or_low_value",
        }),
      ],
      currentCredits: 2,
      estimatedPayout: 3,
      clicksRemaining: 3,
      gripCount: 5,
      minimumHandBuffer: 3,
    });

    expect(assessment.admitted).toBe(false);
    expect(assessment.rejectionCodes).toEqual(
      expect.arrayContaining([
        "development_cashout_rejected:no_bound_convertible_route",
        "development_cashout_rejected:target_not_plan_eligible:development-1",
        "development_cashout_rejected:target_not_plan_eligible:development-2",
        "development_cashout_rejected:target_not_plan_eligible:development-3",
      ]),
    );
  });

  it("does not delegate a cashout to generic development for a satisfied same-turn-access prerequisite", () => {
    const assessment = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [
        development({
          activationPrerequisites: [
            { kind: "same_turn_access", satisfied: true },
          ],
        }),
      ],
      currentCredits: 2,
      estimatedPayout: 3,
      clicksRemaining: 3,
      gripCount: 4,
      minimumHandBuffer: 3,
    });

    expect(assessment.admitted).toBe(false);
    expect(assessment.rejectionCodes).toEqual(
      expect.arrayContaining([
        "development_cashout_rejected:target_not_plan_eligible:development-1",
        "development_cashout_rejected:no_bound_convertible_route",
      ]),
    );
  });

  it("admits an exact cashout that closes a protected engine reserve gap", () => {
    const assessment = assessRunnerDevelopmentCashOutAdmission({
      evaluations: [
        development({
          availability: "legal_now",
          deferReason: "preserve_credit_floor",
          fundingNeed: {
            installOrPlayCost: 8,
            targetCredits: 12,
            missingCredits: 2,
            reason: "would_break_floor",
          },
        }),
      ],
      currentCredits: 10,
      estimatedPayout: 2,
      clicksRemaining: 3,
      gripCount: 4,
      minimumHandBuffer: 3,
    });

    expect(assessment).toMatchObject({
      admitted: true,
      route: {
        targetCardInstanceId: "development-1",
        requiredCredits: 12,
        missingCredits: 2,
        projectedCreditsAfterCashOut: 12,
        projectedCreditsAfterDevelopment: 4,
      },
      rejectionCodes: [],
    });
  });
});

function development(
  overrides: Partial<RunnerHandDevelopmentEvaluation> = {},
): RunnerHandDevelopmentEvaluation {
  return {
    schemaVersion: "runner-hand-development-evaluation-v3",
    cardInstanceId: "development-1",
    definitionId: "test-development",
    title: "Test Development",
    cardType: "resource",
    availability: "missing_credits",
    developmentRole: "economy_engine",
    strategicFit: "strong",
    currentNeed: "useful_now",
    priority: 800,
    fundingNeed: {
      installOrPlayCost: 5,
      targetCredits: 5,
      missingCredits: 3,
      reason: "cannot_pay",
    },
    activationPrerequisites: [],
    deferReason: "missing_credits",
    evidence: [],
    ...overrides,
  };
}
