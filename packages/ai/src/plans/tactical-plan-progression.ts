import type {
  PlanLifecycle,
  TacticalPlan,
  TacticalPlanMemorySnapshot,
} from "./tactical-plan-types";

const PLAN_CONTINUITY_PRIORITY_BONUS = 120;
const PLAN_CONTINUITY_SCORE_NORMALIZATION_DIVISOR = 10;

export function planCanMapToCurrentAction(plan: TacticalPlan): boolean {
  return (
    plan.status !== "abandoned" &&
    plan.status !== "expired" &&
    plan.status !== "failed" &&
    plan.status !== "satisfied"
  );
}

export function progressTacticalPlans(
  plans: readonly TacticalPlan[],
  previousPlan: TacticalPlanMemorySnapshot | undefined,
): {
  plans: TacticalPlan[];
  planProgressionReason?: string;
  whyPlanAbandoned?: string;
} {
  if (!previousPlan) return { plans: [...plans] };
  const creditBaseShouldYieldToRdOpportunity =
    previousPlan.type === "runner.build_credit_base" &&
    plans.some(isCheapUnknownRdOpportunityPlan);
  const previousCentralProbeSatisfied =
    previousPlan.type === "runner.opportunistic_central_run" &&
    previousPlan.status === "satisfied" &&
    previousPlan.ttlDecisionsRemaining <= 0;
  const continued = plans.map((plan) => {
    if (!samePlanLine(plan, previousPlan)) return plan;
    if (
      creditBaseShouldYieldToRdOpportunity &&
      plan.type === "runner.build_credit_base"
    ) {
      return {
        ...plan,
        evidence: [
          ...plan.evidence,
          `previous_plan:${previousPlan.planId}`,
          `plan_progression:${previousPlan.status}->interrupted_by_rd_opportunity`,
          "plan_continuity_suppressed:rd_unknown_low_cost_opportunity",
        ],
        scoreBreakdown: [
          ...plan.scoreBreakdown,
          {
            key: "previous_plan_continuity_suppressed",
            label: "Planfortschreibung unterbrochen",
            value: 0,
            reason: [
              previousPlan.planId,
              "rd_unknown_low_cost_opportunity:true",
            ].join("|"),
          },
        ],
      } satisfies TacticalPlan;
    }
    if (previousCentralProbeSatisfied) {
      return {
        ...plan,
        status: plan.status === "abandoned" ? plan.status : "satisfied",
        evidence: [
          ...plan.evidence,
          `previous_plan:${previousPlan.planId}`,
          `plan_progression:${previousPlan.status}->new_plan_required`,
        ],
        scoreBreakdown: [
          ...plan.scoreBreakdown,
          {
            key: "previous_probe_satisfied",
            label: "Previous probe satisfied",
            value: 0,
            reason: previousPlan.planId,
          },
        ],
      } satisfies TacticalPlan;
    }
    return {
      ...plan,
      status: plan.status === "active" ? "progressing" : plan.status,
      priority: plan.priority + PLAN_CONTINUITY_PRIORITY_BONUS,
      evidence: [
        ...plan.evidence,
        `previous_plan:${previousPlan.planId}`,
        `plan_progression:${previousPlan.status}->${plan.status}`,
        `plan_continuity_raw_value:${PLAN_CONTINUITY_PRIORITY_BONUS}`,
        `plan_continuity_normalized_value:${normalizedPlanContinuityValue(
          PLAN_CONTINUITY_PRIORITY_BONUS,
        )}`,
      ],
      scoreBreakdown: [
        ...plan.scoreBreakdown,
        {
          key: "previous_plan_continuity",
          label: "Planfortschreibung",
          value: PLAN_CONTINUITY_PRIORITY_BONUS,
          reason: [
            previousPlan.planId,
            `plan_continuity_raw_value:${PLAN_CONTINUITY_PRIORITY_BONUS}`,
            `plan_continuity_normalized_value:${normalizedPlanContinuityValue(
              PLAN_CONTINUITY_PRIORITY_BONUS,
            )}`,
          ].join("|"),
        },
      ],
    } satisfies TacticalPlan;
  });
  if (previousCentralProbeSatisfied) {
    return {
      plans: continued,
      planProgressionReason: "previous_central_probe_satisfied",
    };
  }
  if (creditBaseShouldYieldToRdOpportunity) {
    return {
      plans: continued,
      planProgressionReason:
        "previous_credit_base_interrupted_by_rd_opportunity",
    };
  }
  return {
    plans: continued,
    planProgressionReason: "previous_plan_considered",
  };
}

export function normalizedPlanContinuityValue(rawValue: number): number {
  return Math.max(
    -100,
    Math.min(
      100,
      Math.round(rawValue / PLAN_CONTINUITY_SCORE_NORMALIZATION_DIVISOR),
    ),
  );
}

export function rankTacticalPlans(
  plans: readonly TacticalPlan[],
): TacticalPlan[] {
  return [...plans].sort(
    (left, right) =>
      planStatusRank(right.status) - planStatusRank(left.status) ||
      right.priority - left.priority ||
      left.planId.localeCompare(right.planId),
  );
}

function samePlanLine(
  plan: TacticalPlan,
  previousPlan: TacticalPlanMemorySnapshot,
): boolean {
  if (plan.type !== previousPlan.type) return false;
  if (!plan.target && !previousPlan.target) return true;
  return (
    plan.target?.kind === previousPlan.target?.kind &&
    plan.target?.id === previousPlan.target?.id
  );
}

function isCheapUnknownRdOpportunityPlan(plan: TacticalPlan): boolean {
  return (
    plan.type === "runner.opportunistic_central_run" &&
    plan.target?.kind === "server" &&
    plan.target.id === "rd" &&
    plan.status === "active" &&
    plan.evidence.includes("rd_unknown_low_cost_opportunity_floor:true")
  );
}

function planStatusRank(status: PlanLifecycle): number {
  switch (status) {
    case "progressing":
      return 6;
    case "active":
      return 6;
    case "proposed":
      return 4;
    case "blocked":
      return 3;
    case "satisfied":
      return 2;
    case "expired":
      return 1;
    case "failed":
      return 0;
    case "abandoned":
      return -1;
  }
}
