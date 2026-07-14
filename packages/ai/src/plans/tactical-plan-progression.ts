import type { AiDecisionInput } from "@netgrid/shared";
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
  input?: AiDecisionInput,
): {
  plans: TacticalPlan[];
  planProgressionReason?: string;
  whyPlanAbandoned?: string;
} {
  if (!previousPlan) return { plans: [...plans] };
  const previousPunishMadeNoProgress =
    input !== undefined &&
    punishPlanMadeNoObservableProgress(previousPlan, input);
  const creditBaseShouldYieldToRdOpportunity =
    previousPlan.type === "runner.build_credit_base" &&
    plans.some(isCheapUnknownRdOpportunityPlan) &&
    !plans.some(isNearTermCreditBaseFundingPlan);
  const previousCentralProbeSatisfied =
    previousPlan.type === "runner.opportunistic_central_run" &&
    previousPlan.status === "satisfied" &&
    previousPlan.ttlDecisionsRemaining <= 0;
  const continued = plans.map((plan) => {
    if (!samePlanLine(plan, previousPlan)) return plan;
    if (previousPunishMadeNoProgress) {
      const abandoned = previousPlan.ttlDecisionsRemaining <= 1;
      return {
        ...plan,
        status: abandoned ? "abandoned" : plan.status,
        evidence: [
          ...plan.evidence,
          `previous_plan:${previousPlan.planId}`,
          "plan_progression:no_observable_progress",
        ],
        scoreBreakdown: [
          ...plan.scoreBreakdown,
          {
            key: "previous_plan_no_observable_progress",
            label: "Plan ohne sichtbaren Fortschritt",
            value: 0,
            reason: previousPlan.planId,
          },
        ],
      } satisfies TacticalPlan;
    }
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
  if (previousPunishMadeNoProgress) {
    return {
      plans: continued,
      planProgressionReason: "no_observable_progress",
      ...(previousPlan.ttlDecisionsRemaining <= 1
        ? { whyPlanAbandoned: "repeated_punish_without_visible_conversion" }
        : {}),
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

function punishPlanMadeNoObservableProgress(
  previousPlan: TacticalPlanMemorySnapshot,
  input: AiDecisionInput,
): boolean {
  const baseline = previousPlan.progressBaseline;
  if (
    previousPlan.type !== "corp.apply_punish_pressure" ||
    !baseline ||
    input.side !== "corp" ||
    input.playerView.stateVersion <= previousPlan.updatedAtStateVersion
  ) {
    return false;
  }
  const tagLanded = input.playerView.opponent.tags > baseline.opponentTags;
  const damageLanded =
    (input.playerView.opponent.coreDamage ?? 0) > baseline.opponentCoreDamage;
  const payoffConverted =
    input.playerView.own.agendaPoints > baseline.ownAgendaPoints ||
    input.playerView.opponent.agendaPoints < baseline.opponentAgendaPoints;
  const meaningfulCreditConvergence =
    input.playerView.opponent.credits < baseline.opponentCredits &&
    input.playerView.own.credits + input.playerView.own.clicks * 2 >=
      input.playerView.opponent.credits;
  return !(
    tagLanded ||
    damageLanded ||
    payoffConverted ||
    meaningfulCreditConvergence
  );
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

function isNearTermCreditBaseFundingPlan(plan: TacticalPlan): boolean {
  if (plan.type !== "runner.build_credit_base") return false;
  const prefix = "credit_base_top_missing_credits:";
  const missingCredits = Number(
    plan.evidence
      .find((entry) => entry.startsWith(prefix))
      ?.slice(prefix.length),
  );
  return (
    plan.evidence.includes("credit_base_funding_need:true") &&
    Number.isFinite(missingCredits) &&
    missingCredits > 0 &&
    missingCredits <= 2
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
