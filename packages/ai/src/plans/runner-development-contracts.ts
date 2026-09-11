import type { RunnerDevelopmentFundingMilestone } from "./runner-funding-contracts";
import type {
  RunnerHandDevelopmentCurrentNeed,
  RunnerHandDevelopmentRole,
  RunnerHandDevelopmentStrategicFit,
} from "../runner/hand-development/runner-hand-development-types";
export function runnerDevelopmentCardAdmission(params: {
  definitionId: string;
  assignedDomainPlanIds: readonly string[];
  concretePurposeCode?: string;
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
}):
  | { admitted: true; reasonCode: string }
  | { admitted: false; reasonCode: string } {
  if (params.assignedDomainPlanIds.length > 0) {
    return {
      admitted: false,
      reasonCode: `assigned_domain_requires_domain_owner:${[...params.assignedDomainPlanIds].sort()[0]}`,
    };
  }
  if (!isConcreteRunnerDevelopmentPurpose(params.concretePurposeCode))
    return { admitted: false, reasonCode: "no_concrete_plan_purpose" };
  if (params.duplicateAlreadyInstalled)
    return { admitted: false, reasonCode: "redundant_board_copy" };
  return {
    admitted: true,
    reasonCode: params.affordableOrSupportable
      ? `card_specific_purpose:${params.concretePurposeCode}`
      : `card_specific_waiting_route:${params.concretePurposeCode}`,
  };
}

export function runnerDevelopmentFundingMilestone(params: {
  targetCredits: number;
  currentCredits: number;
  normalizedDevelopmentValue: number;
  strategicFit: RunnerHandDevelopmentStrategicFit;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  developmentRole: RunnerHandDevelopmentRole;
  duplicateAlreadyInstalled: boolean;
  assignedDomainPlanIds: readonly string[];
}): RunnerDevelopmentFundingMilestone | undefined {
  if (
    !Number.isSafeInteger(params.targetCredits) ||
    !Number.isSafeInteger(params.currentCredits) ||
    !Number.isFinite(params.normalizedDevelopmentValue) ||
    params.targetCredits < 0 ||
    params.currentCredits < 0 ||
    params.duplicateAlreadyInstalled ||
    params.assignedDomainPlanIds.length > 0 ||
    params.developmentRole === "unknown" ||
    params.developmentRole === "run_event" ||
    params.developmentRole === "duplicate_or_low_value" ||
    params.strategicFit === "weak" ||
    params.strategicFit === "blocked" ||
    params.currentNeed === "later" ||
    params.currentNeed === "none"
  ) {
    return undefined;
  }
  const remainingGap = Math.max(
    0,
    params.targetCredits - params.currentCredits,
  );
  const maximumBoundedGap = 8;
  const minimumMaterialValue = 40 + remainingGap * 4;
  if (
    remainingGap <= 0 ||
    remainingGap > maximumBoundedGap ||
    params.normalizedDevelopmentValue < minimumMaterialValue
  ) {
    return undefined;
  }
  return {
    kind: "bounded_development_credit_milestone",
    targetCredits: params.targetCredits,
    observedCredits: params.currentCredits,
    remainingGap,
    priorityClass: "P4",
    hardness: "soft",
    deadline: "within_three_own_turns",
    maximumOwnTurns: 3,
    releaseCondition:
      "parent_invalidated_or_material_value_lost_or_urgent_preemption",
  };
}

function isConcreteRunnerDevelopmentPurpose(
  purposeCode: string | undefined,
): purposeCode is string {
  const normalized = purposeCode?.trim();
  return (
    normalized !== undefined &&
    normalized.length > 0 &&
    normalized !== "unknown" &&
    !normalized.startsWith("unknown:")
  );
}
