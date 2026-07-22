import { describe, expect, it } from "vitest";

import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import { deriveTacticalPlanActionDemands } from "./tactical-plan-action-demands";

describe("tactical plan action demands", () => {
  it("derives an exact hard Corp score sequence demand", () => {
    const plan = createTacticalPlan({
      planId: "corp:score",
      side: "corp",
      type: "corp.create_score_window",
      priority: 100,
      horizonTurns: 1,
      blockers: [
        {
          blockerId: "missing-action",
          kind: "missing_legal_action",
          severity: "hard",
          evidence: ["scoreline_needs_one_more_action"],
        },
      ],
      currentStep: createPlanStep({
        stepId: "gain-action",
        kind: "gain_action_capacity",
        desiredActionSemantics: ["gain_action_capacity"],
      }),
      nextSteps: [
        createPlanStep({
          stepId: "install",
          kind: "install_or_prepare_agenda",
          desiredActionSemantics: ["install.agenda"],
        }),
        createPlanStep({
          stepId: "advance-one",
          kind: "advance_score_card",
          desiredActionSemantics: ["advance.card"],
        }),
        createPlanStep({
          stepId: "advance-two",
          kind: "advance_score_card",
          desiredActionSemantics: ["advance.card"],
        }),
        createPlanStep({
          stepId: "advance-three",
          kind: "advance_score_card",
          desiredActionSemantics: ["advance.card"],
        }),
        createPlanStep({
          stepId: "score",
          kind: "score_agenda",
          desiredActionSemantics: ["score.agenda"],
        }),
      ],
      stateVersion: 1,
    });

    expect(deriveTacticalPlanActionDemands(plan, 3)[0]).toMatchObject({
      purpose: "current_score_closeout",
      hardness: "hard",
      deadline: "before_current_plan_action",
      currentActions: 3,
      targetActions: 4,
      gap: 1,
      acceptedRestrictions: ["unrestricted"],
    });
  });

  it("accepts program-install capacity for a Runner breaker install", () => {
    const plan = createTacticalPlan({
      planId: "runner:breaker",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      priority: 80,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "install-breaker",
        kind: "install_breaker",
        desiredActionSemantics: ["install.program"],
      }),
      stateVersion: 1,
    });

    expect(deriveTacticalPlanActionDemands(plan, 0)[0]).toMatchObject({
      purpose: "current_breaker_install",
      targetActions: 1,
      acceptedRestrictions: [
        "unrestricted",
        "install_only",
        "program_install_only",
      ],
      requiredActionTypes: ["install_card"],
    });
  });

  it("maps a Runner run plan to run-only compatibility", () => {
    const plan = createTacticalPlan({
      planId: "runner:run",
      side: "runner",
      type: "runner.contest_remote",
      priority: 70,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "run",
        kind: "run_target",
        desiredActionSemantics: ["run.start"],
      }),
      stateVersion: 1,
    });

    expect(deriveTacticalPlanActionDemands(plan, 0)[0]).toMatchObject({
      purpose: "current_run",
      acceptedRestrictions: ["unrestricted", "run_only"],
      requiredActionTypes: ["start_run"],
    });
  });

  it("uses the declared next-turn follow-up horizon without claiming same-turn coverage", () => {
    const plan = createTacticalPlan({
      planId: "runner:survival",
      side: "runner",
      type: "runner.survival_defense",
      priority: 90,
      horizonTurns: 2,
      currentStep: createPlanStep({
        stepId: "find-answer",
        kind: "find_survival_answer",
        desiredActionSemantics: ["draw.card"],
        followupBudget: {
          recommendation: "acquire_for_next_turn",
          horizon: "next_turn_allowed",
          availableActions: 0,
          acquisitionActionCost: 1,
          requiredFollowupActions: 2,
          conversionAvailable: false,
          sameTurnReachable: false,
          evidence: ["next_turn_survival_sequence"],
        },
      }),
      stateVersion: 1,
    });

    expect(deriveTacticalPlanActionDemands(plan, 0)[0]).toMatchObject({
      purpose: "current_survival_sequence",
      hardness: "soft",
      deadline: "start_of_next_own_turn",
      targetActions: 2,
    });
  });
});
