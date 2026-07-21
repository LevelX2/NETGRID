import { describe, expect, it } from "vitest";

import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import { publishTacticalPlanCreditDemands } from "./tactical-plan-credit-demands";

describe("tactical plan credit demands", () => {
  it("publishes an unaffordable current breaker as an acute hard demand", () => {
    const plan = createTacticalPlan({
      planId: "runner.obtain_breaker_coverage:remote_1",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      status: "blocked",
      priority: 950,
      horizonTurns: 1,
      requiredCapabilities: [
        {
          capabilityId: "runner.breaker.install",
          kind: "credits",
          side: "runner",
          minimumCredits: 6,
          evidence: ["visible_breaker_cost:6"],
        },
      ],
      blockers: [
        {
          blockerId: "breaker-unaffordable",
          kind: "breaker_present_but_unaffordable",
          severity: "hard",
          evidence: ["visible_breaker_cost:6"],
        },
      ],
      currentStep: createPlanStep({
        stepId: "install-breaker",
        kind: "install_breaker",
        desiredActionSemantics: ["install.card"],
      }),
      stateVersion: 1,
    });

    expect(publishTacticalPlanCreditDemands(plan, 2).creditDemands).toEqual([
      expect.objectContaining({
        purpose: "breaker_for_current_plan",
        priority: "acute_hard_plan_blocker",
        hardness: "hard",
        deadline: "before_current_plan_action",
        currentCredits: 2,
        targetCredits: 6,
        gap: 4,
      }),
    ]);
  });

  it("does not invent a demand for a plan without a numeric credit requirement", () => {
    const plan = createTacticalPlan({
      planId: "runner.obtain_breaker_coverage:search",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      priority: 800,
      horizonTurns: 2,
      currentStep: createPlanStep({
        stepId: "search-breaker",
        kind: "search_for_answer",
        desiredActionSemantics: ["search.card"],
      }),
      stateVersion: 1,
    });

    expect(publishTacticalPlanCreditDemands(plan, 2).creditDemands).toEqual([]);
  });
});
