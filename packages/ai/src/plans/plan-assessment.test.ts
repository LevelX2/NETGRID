import { describe, expect, it } from "vitest";
import {
  compareValidatedPlanAssessments,
  CORP_PLAN_PRIORITY_POLICY,
  requireValidatedPlanAssessment,
  RUNNER_PLAN_PRIORITY_POLICY,
  validatePriorityClaim,
  type PlanAssessment,
} from "./plan-assessment";
import { PlanResolutionFailure } from "./plan-resolution-failure";

describe("plan assessment and priority claims", () => {
  it("rejects an unproven P1 claim instead of trusting the module", () => {
    const assessment = assessmentFor("corp.kill", "corp", "P1", 900);
    assessment.priorityClaim = {
      requestedClass: "P1",
      reasonCode: "terminal_win",
      horizon: "current_turn",
    };

    expect(
      validatePriorityClaim(assessment, CORP_PLAN_PRIORITY_POLICY),
    ).toEqual({
      status: "rejected",
      requestedClass: "P1",
      reasonCodes: ["missing_threat_witness"],
    });
    expect(() =>
      requireValidatedPlanAssessment(
        assessment,
        CORP_PLAN_PRIORITY_POLICY,
        17,
      ),
    ).toThrow(PlanResolutionFailure);
  });

  it("accepts a visible but reactive lethal witness as P1", () => {
    const assessment = assessmentFor("corp.kill", "corp", "P1", 100);
    assessment.priorityClaim = {
      requestedClass: "P1",
      reasonCode: "terminal_win",
      horizon: "current_turn",
      witness: {
        kind: "terminal_path",
        evidenceCode: "visible_lethal_path",
        guarantee: "robust_but_reactive",
      },
    };

    expect(
      requireValidatedPlanAssessment(
        assessment,
        CORP_PLAN_PRIORITY_POLICY,
        20,
      ).priorityValidation.effectiveClass,
    ).toBe("P1");
  });

  it("keeps class precedence above arbitrary within-class values", () => {
    const p4 = requireValidatedPlanAssessment(
      assessmentFor("runner.pressure", "runner", "P4", -10_000),
      RUNNER_PLAN_PRIORITY_POLICY,
      3,
    );
    const p5 = requireValidatedPlanAssessment(
      assessmentFor("runner.bank", "runner", "P5", 10_000),
      RUNNER_PLAN_PRIORITY_POLICY,
      3,
    );

    expect([p5, p4].sort(compareValidatedPlanAssessments)).toEqual([p4, p5]);
  });

  it("requires intent fit or tactical evidence for P4 and P5", () => {
    const assessment = assessmentFor(
      "runner.development",
      "runner",
      "P5",
      10,
    );
    assessment.intentFit = "none";

    expect(
      validatePriorityClaim(assessment, RUNNER_PLAN_PRIORITY_POLICY),
    ).toMatchObject({
      status: "rejected",
      reasonCodes: ["missing_intent_or_tactical_evidence"],
    });
  });

  it.each(["P1", "P2", "P3"] as const)(
    "allows a reliably evidenced %s plan to override strategic intent",
    (priorityClass) => {
      const assessment = assessmentFor(
        `runner.${priorityClass.toLowerCase()}`,
        "runner",
        priorityClass,
        10,
      );
      assessment.intentFit = "none";

      expect(
        requireValidatedPlanAssessment(
          assessment,
          RUNNER_PLAN_PRIORITY_POLICY,
          17,
        ).priorityValidation.effectiveClass,
      ).toBe(priorityClass);
    },
  );

  it("rejects a P3 intent override without reliable current evidence", () => {
    const assessment = assessmentFor(
      "runner.expiring",
      "runner",
      "P3",
      10,
    );
    assessment.intentFit = "none";
    assessment.feasibility.confidence = "belief_supported";
    assessment.evidenceCodes = [];

    expect(
      validatePriorityClaim(assessment, RUNNER_PLAN_PRIORITY_POLICY),
    ).toMatchObject({
      status: "rejected",
      reasonCodes: ["priority_intent_override_without_reliable_evidence"],
    });
  });

  it("requires explicit current tactical evidence for a P4/P5 tactical override", () => {
    const assessment = assessmentFor(
      "runner.tactical-development",
      "runner",
      "P4",
      10,
    );
    assessment.intentFit = "tactical_override";

    expect(
      validatePriorityClaim(assessment, RUNNER_PLAN_PRIORITY_POLICY),
    ).toMatchObject({
      status: "rejected",
      reasonCodes: ["missing_explicit_tactical_evidence"],
    });

    assessment.transientSignals = [
      {
        schemaVersion: "transient-plan-signal-v1",
        signalId: "runner-visible-tactical-window",
        side: "runner",
        observedAtStateVersion: 17,
        planModuleId: "runner.tactical-development",
        planDedupeKey: "remote-1",
        kind: "goal",
        scope: "tactical",
        evidenceCode: "runner_visible_tactical_window",
        guarantee: "visible_state_forced",
        target: { kind: "server", id: "remote_1" },
      },
    ];
    const validated = requireValidatedPlanAssessment(
      assessment,
      RUNNER_PLAN_PRIORITY_POLICY,
      17,
    );

    expect(validated.priorityValidation.effectiveClass).toBe("P4");
    expect(validated.evidenceCodes).toContain(
      "transient_plan_signal_evidence:runner_visible_tactical_window",
    );
  });

  it("cannot encode a future action id in the step preview contract", () => {
    const assessment = assessmentFor(
      "runner.pressure",
      "runner",
      "P4",
      10,
    );

    expect(JSON.stringify(assessment.nextStepPreview)).not.toContain(
      "actionId",
    );
  });
});

function assessmentFor(
  instanceId: string,
  side: "runner" | "corp",
  priorityClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6",
  withinClassValue: number,
): PlanAssessment {
  const reasonByClass = {
    P1: "terminal_win",
    P2: "survival_threat",
    P3: "expiring_conversion",
    P4: "strategic_campaign",
    P5: "development_need",
    P6: "neutral_progress",
  } as const;
  return {
    instanceId,
    side,
    priorityClaim: {
      requestedClass: priorityClass,
      reasonCode: reasonByClass[priorityClass],
      horizon: priorityClass === "P3" ? "current_turn" : "multi_turn",
      ...((priorityClass === "P1" || priorityClass === "P2")
        ? {
            witness: {
              kind:
                priorityClass === "P1"
                  ? ("terminal_path" as const)
                  : ("survival_threat" as const),
              evidenceCode: "visible_witness",
              guarantee: "visible_state_forced" as const,
            },
          }
        : {}),
    },
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: "executable_now",
    nextStepPreview: {
      stepId: "next",
      capability: "gain_credits",
      purpose: "test",
    },
    feasibility: {
      currentRouteHeadPossible: true,
      projectedActionCount: 1,
      opponentCanReact: false,
      confidence: "visible_state_forced",
    },
    resourceGaps: [],
    expectedOutcome: {
      outcomeKind: "progress",
      minimumValue: 1,
      expectedValue: 1,
      maximumValue: 1,
      terminal: priorityClass === "P1",
      guarantee: "visible_state_forced",
    },
    continuity: {
      isCurrentForeground: false,
      sameObjectiveAsForeground: false,
      switchingCost: 0,
      progressAtRisk: 0,
    },
    blockers: [],
    withinClassValue,
    evidenceCodes: ["visible_witness"],
  };
}
