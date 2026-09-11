import { rolesMatch } from "../runtime/role-match";

export type RunnerCoverageGapSignal = {
  gapId: string;
  needKind?:
    | "missing_coverage"
    | "cost_ineffective_coverage"
    | "coverage_upgrade";
  requiredRole:
    | "breaker_wall"
    | "breaker_code_gate"
    | "breaker_sentry"
    | "breaker_ap"
    | "breaker_trace"
    | "breaker_universal";
  targetServerId?: string;
  targetRunActionId?: string;
  requesterModuleId?: "runner.pressure_central" | "runner.contest_remote";
  requesterPlanInstanceId?: string;
  requesterNeedId?: string;
  priorityClass: "P2" | "P4" | "P5";
  evidenceCode: string;
  deckHasAnswer: boolean;
  answerInHand: boolean;
  answerInstallCost?: number;
  installActionIds?: string[];
  installActionValues?: Record<string, number>;
  preparationActionIds?: string[];
  memorySupportActionIds?: string[];
  fundingGap?: number;
  sameTurnRunConversion?: {
    targetRunActionId: string;
    requiredCredits: number;
    requiredClicksAfterFunding: number;
    projectedKnownPathCost: number;
    postRunCreditFloor: number;
    installProjection:
      | "current_legal_action"
      | "card_spec_requires_rematerialization";
  };
  currentKnownPathCost?: number;
  currentPathFundingGap?: number;
  recoveryMode?:
    | "install_visible_answer"
    | "search_known_alternative"
    | "draw_for_known_role"
    | "install_visible_upgrade"
    | "search_known_upgrade";
  recoveryEvidenceCodes?: string[];
  upgradeQuote?: {
    schemaVersion: "runner-breaker-upgrade-economic-quote-v2";
    targetDefinitionId: string;
    currentKnownPathCost: number;
    projectedKnownPathCost: number;
    savingsPerRun: number;
    plannedRunHorizon: number;
    grossRunSavings: number;
    upfrontCreditCost: number;
    totalInvestment: number;
    netValueBeforeSafetyMargin: number;
    requiredNetSafetyMargin: number;
    projectedLiquidCreditsAfterUpgradeAndRun: number;
    desiredCreditReserve: number;
    memoryAvailable: number;
    memorySupportAdditionalMu: number;
    memorySupportCreditCost: number;
    memorySupportActionClicks: number;
    projectedMemoryAvailable: number;
    candidateMemoryCost: number;
  };
  fundingActionIds: string[];
  directSearchActionIds: string[];
  directSearchChoiceBindings?: Array<{
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    resolvedSearchChoice?: {
      choiceId: string;
      choiceSource: string;
      stateVersion: number;
    };
    targetCardInstanceId?: string;
    targetDefinitionId?: string;
    installMemorySacrificeBinding?: {
      targetCardInstanceId: string;
      targetMemoryCost?: number;
      requiredMemoryToFree: number;
      selectedCards: Array<{
        cardInstanceId: string;
        memoryCost: number;
      }>;
    };
  }>;
  programInstallMemoryRejectedActionIds?: string[];
  rejectedSearchActionIds?: string[];
  searchEngineSetupActionIds: string[];
  drawForAnswerActionIds: string[];
};

export function runnerCoverageRoleNeedles(
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): readonly string[] {
  switch (requiredRole) {
    case "breaker_wall":
      return ["breaker_wall", "breaker_fracter"];
    case "breaker_code_gate":
      return ["breaker_code_gate", "breaker_decoder"];
    case "breaker_sentry":
      return ["breaker_sentry", "breaker_killer"];
    case "breaker_ap":
      return ["breaker_ap"];
    case "breaker_trace":
      return ["breaker_trace"];
    case "breaker_universal":
      return ["breaker_universal"];
  }
  const exhaustiveRole: never = requiredRole;
  return exhaustiveRole;
}

export function runnerRolesCoverCoverageGap(
  roles: readonly string[],
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): boolean {
  return (
    rolesMatch(roles, runnerCoverageRoleNeedles(requiredRole)) ||
    rolesMatch(roles, ["universal_breaker", "breaker_universal"])
  );
}
