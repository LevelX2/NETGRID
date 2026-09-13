import type {
  FundingRouteHorizon,
  FundingRouteReliability,
  FundingRouteStatus,
  PaymentWindowFundingSetup,
} from "./funding-route";

export type RunnerFundingRouteAssessment = {
  stateVersion: number;
  routeId: string;
  status: FundingRouteStatus;
  reliability: FundingRouteReliability;
  horizon: FundingRouteHorizon;
  projectedGap: number;
  totalClickCost: number;
  firstStepActionId?: string;
  paymentInstall?: PaymentWindowFundingSetup & {
    targetServerId: string;
    runActionId: string;
  };
  evidenceCodes: string[];
};

export type RunnerFundingRouteContract = {
  routeActionIds: string[];
  routeAssessment: RunnerFundingRouteAssessment;
};

export type RunnerDevelopmentFundingMilestone = {
  kind: "bounded_development_credit_milestone";
  targetCredits: number;
  observedCredits: number;
  remainingGap: number;
  priorityClass: "P4";
  hardness: "soft";
  deadline: "within_three_own_turns";
  maximumOwnTurns: 3;
  releaseCondition: "parent_invalidated_or_material_value_lost_or_urgent_preemption";
};

export type RunnerFundingNeedSignal =
  | (RunnerFundingRouteContract & {
      kind: "parent_plan_support";
      providerModuleId?: "runner.credit_bank";
      needId: string;
      parentPlanInstanceId: string;
      driver: {
        kind: "run" | "contest" | "development" | "resource_lifecycle";
        targetId: string;
        reasonCode: string;
      };
      targetCredits: number;
      currentCreditsAtRevalidation: number;
      gap: number;
      priorityClass: "P2" | "P4" | "P5";
      developmentFundingMilestone?: RunnerDevelopmentFundingMilestone;
      revalidation: {
        stateVersion: number;
        status: "material_parent_open";
      };
      evidenceCode: string;
    })
  | (RunnerFundingRouteContract & {
      kind: "portfolio_reserve";
      needId: "runner-portfolio-credit-reserve";
      targetCredits: number;
      currentCreditsAtRevalidation: number;
      gap: number;
      priorityClass: "P6";
      revalidation: {
        stateVersion: number;
        status: "portfolio_reserve_open";
      };
      evidenceCode: string;
    })
  | {
      kind: "develop_liquidity";
      needId: string;
      actionIds: string[];
      currentCreditsAtRevalidation: number;
      targetCredits: number;
      gap: number;
      priorityClass: "P6";
      cadence: {
        kind: "remaining_turn_capacity";
        maximumConversions: number;
      };
      completion: {
        kind: "target_credits_or_no_clicks";
      };
      revalidation: {
        stateVersion: number;
        status: "turn_liquidity_open";
      };
      evidenceCode: string;
    };

export function validRunnerFundingNeedContract(
  need: RunnerFundingNeedSignal,
  stateVersion: number,
): boolean {
  if (need.kind === "develop_liquidity") {
    const actionIds = [...new Set(need.actionIds)];
    return (
      need.needId.startsWith("economy-liquidity-development:") &&
      actionIds.length === need.actionIds.length &&
      actionIds.length > 0 &&
      Number.isSafeInteger(need.currentCreditsAtRevalidation) &&
      Number.isSafeInteger(need.targetCredits) &&
      Number.isSafeInteger(need.gap) &&
      need.currentCreditsAtRevalidation >= 0 &&
      need.targetCredits >= 0 &&
      need.gap > 0 &&
      need.targetCredits === need.currentCreditsAtRevalidation + need.gap &&
      need.priorityClass === "P6" &&
      need.cadence.kind === "remaining_turn_capacity" &&
      Number.isSafeInteger(need.cadence.maximumConversions) &&
      need.cadence.maximumConversions === need.gap &&
      need.completion.kind === "target_credits_or_no_clicks" &&
      need.revalidation.stateVersion === stateVersion &&
      need.revalidation.status === "turn_liquidity_open" &&
      need.evidenceCode.trim().length > 0
    );
  }
  if (
    !Number.isFinite(need.targetCredits) ||
    !Number.isFinite(need.currentCreditsAtRevalidation) ||
    !Number.isFinite(need.gap) ||
    need.targetCredits < 0 ||
    need.currentCreditsAtRevalidation < 0 ||
    need.gap <= 0 ||
    need.revalidation.stateVersion !== stateVersion ||
    need.routeAssessment.stateVersion !== stateVersion ||
    need.gap !==
      Math.max(0, need.targetCredits - need.currentCreditsAtRevalidation)
  ) {
    return false;
  }
  const routeActionIds = [...new Set(need.routeActionIds)];
  if (
    routeActionIds.length !== need.routeActionIds.length ||
    routeActionIds.length > 1 ||
    need.routeAssessment.routeId.length === 0 ||
    need.routeAssessment.evidenceCodes.length === 0 ||
    !Number.isFinite(need.routeAssessment.projectedGap) ||
    need.routeAssessment.projectedGap < 0 ||
    !Number.isFinite(need.routeAssessment.totalClickCost) ||
    need.routeAssessment.totalClickCost < 0
  ) {
    return false;
  }
  if (routeActionIds.length > 0) {
    if (
      need.routeAssessment.status !== "covered_guaranteed" ||
      need.routeAssessment.reliability !== "guaranteed" ||
      need.routeAssessment.horizon !== "same_turn" ||
      need.routeAssessment.projectedGap !== 0 ||
      need.routeAssessment.firstStepActionId !== routeActionIds[0]
    ) {
      return false;
    }
  } else if (need.routeAssessment.firstStepActionId !== undefined) {
    return false;
  }
  if (need.kind === "portfolio_reserve") {
    return (
      need.priorityClass === "P6" &&
      need.revalidation.status === "portfolio_reserve_open"
    );
  }
  if (need.driver.kind === "development") {
    const milestone = need.developmentFundingMilestone;
    if (
      milestone?.kind !== "bounded_development_credit_milestone" ||
      milestone.targetCredits !== need.targetCredits ||
      milestone.observedCredits !== need.currentCreditsAtRevalidation ||
      milestone.remainingGap !== need.gap ||
      milestone.priorityClass !== "P4" ||
      milestone.hardness !== "soft" ||
      milestone.deadline !== "within_three_own_turns" ||
      milestone.maximumOwnTurns !== 3 ||
      milestone.releaseCondition !==
        "parent_invalidated_or_material_value_lost_or_urgent_preemption"
    ) {
      return false;
    }
  } else if (need.developmentFundingMilestone !== undefined) {
    return false;
  }
  return (
    need.parentPlanInstanceId.length > 0 &&
    need.driver.targetId.length > 0 &&
    need.driver.reasonCode.length > 0 &&
    need.revalidation.status === "material_parent_open"
  );
}
