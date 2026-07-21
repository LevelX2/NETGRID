import {
  createCreditDemand,
  type CreditDemand,
  type CreditDemandDeadline,
  type CreditDemandHardness,
  type CreditDemandPriority,
  type CreditDemandPurpose,
} from "./credit-demand";
import type {
  PlanBlockerKind,
  RequiredCapability,
  TacticalPlan,
} from "./tactical-plan-types";

const CREDIT_BLOCKERS = new Set<PlanBlockerKind>([
  "too_expensive",
  "breaker_present_but_unaffordable",
  "missing_rez_reserve",
  "missing_credits",
]);

export function publishTacticalPlanCreditDemands(
  plan: TacticalPlan,
  currentCredits: number,
): TacticalPlan {
  if ((plan.creditDemands?.length ?? 0) > 0) {
    return {
      ...plan,
      creditDemands: plan.creditDemands!.map((demand) =>
        createCreditDemand({
          ...demand,
          currentCredits,
          evidence: demand.evidence,
        }),
      ),
    };
  }
  const requiredCredits = maximumRequiredCredits(plan);
  if (requiredCredits <= 0) return plan;
  const hardness = creditDemandHardness(plan);
  const purpose = creditDemandPurpose(plan);
  const priority = creditDemandPriority(hardness, purpose);
  const deadline = creditDemandDeadline(hardness, purpose);
  const demand = createCreditDemand({
    demandId: `${plan.planId}:credits`,
    side: plan.side,
    sourcePlanId: plan.planId,
    purpose,
    priority,
    hardness,
    deadline,
    currentCredits,
    targetCredits: requiredCredits,
    acceptedCreditRestrictions:
      purpose === "current_run" ? ["general", "restricted"] : ["general"],
    evidence: [
      `credit_demand_source_plan:${plan.planId}`,
      `credit_demand_source_capability_target:${requiredCredits}`,
    ],
  });
  return { ...plan, creditDemands: [demand] };
}

export function primaryCreditDemandForPlan(
  plan: TacticalPlan,
): CreditDemand | undefined {
  return [...(plan.creditDemands ?? [])].sort(
    (left, right) =>
      right.priorityRank - left.priorityRank ||
      right.gap - left.gap ||
      left.demandId.localeCompare(right.demandId),
  )[0];
}

function maximumRequiredCredits(plan: TacticalPlan): number {
  return Math.max(
    0,
    ...allRequiredCapabilities(plan).map(
      (capability) => capability.minimumCredits ?? 0,
    ),
  );
}

function allRequiredCapabilities(plan: TacticalPlan): RequiredCapability[] {
  return [
    ...plan.requiredCapabilities,
    ...plan.currentStep.requiredCapabilities,
    ...plan.nextSteps.flatMap((step) => step.requiredCapabilities),
  ];
}

function creditDemandHardness(plan: TacticalPlan): CreditDemandHardness {
  return plan.blockers.some(
    (blocker) =>
      blocker.severity === "hard" && CREDIT_BLOCKERS.has(blocker.kind),
  )
    ? "hard"
    : "soft";
}

function creditDemandPurpose(plan: TacticalPlan): CreditDemandPurpose {
  switch (plan.type) {
    case "runner.obtain_breaker_coverage":
      return "breaker_for_current_plan";
    case "runner.contest_remote":
    case "runner.opportunistic_central_run":
      return "current_run";
    case "corp.create_score_window":
    case "corp.establish_scoring_remote":
      return "current_score_window";
    case "corp.rez_defense":
      return "current_rez_window";
    case "runner.build_credit_base":
      return "phase_reserve";
    case "corp.fund_strategy_reserve":
      return "tactical_reserve";
    case "runner.build_credit_bank":
    case "corp.build_credit_bank":
    case "corp.activate_persistent_economy":
      return "next_turn_setup";
    default:
      return "foreground_plan";
  }
}

function creditDemandPriority(
  hardness: CreditDemandHardness,
  purpose: CreditDemandPurpose,
): CreditDemandPriority {
  if (hardness === "hard") return "acute_hard_plan_blocker";
  if (purpose === "phase_reserve") return "phase_reserve";
  if (purpose === "tactical_reserve") return "tactical_reserve";
  if (purpose === "next_turn_setup") return "next_own_turn";
  return "current_foreground_plan";
}

function creditDemandDeadline(
  hardness: CreditDemandHardness,
  purpose: CreditDemandPurpose,
): CreditDemandDeadline {
  if (hardness === "hard") return "before_current_plan_action";
  if (purpose === "phase_reserve") return "within_three_own_turns";
  if (purpose === "next_turn_setup") return "start_of_next_own_turn";
  return "end_of_current_turn";
}
