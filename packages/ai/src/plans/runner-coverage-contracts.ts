import { rolesMatch } from "../role-match";

export const RUNNER_BREAKER_COVERAGE = {
  breaker_wall: {
    deckKind: "wall",
    needles: ["breaker_wall", "breaker_fracter"],
  },
  breaker_code_gate: {
    deckKind: "code_gate",
    needles: ["breaker_code_gate", "breaker_decoder"],
  },
  breaker_sentry: {
    deckKind: "sentry",
    needles: ["breaker_sentry", "breaker_killer"],
  },
  breaker_ap: { deckKind: "ap", needles: ["breaker_ap"] },
  breaker_trace: { deckKind: "trace", needles: ["breaker_trace"] },
  breaker_universal: { deckKind: "universal", needles: ["breaker_universal"] },
} as const;

export type RunnerBreakerCoverageRole = keyof typeof RUNNER_BREAKER_COVERAGE;

export const RUNNER_BREAKER_COVERAGE_ROLES: readonly RunnerBreakerCoverageRole[] =
  Object.keys(RUNNER_BREAKER_COVERAGE).filter(isRunnerBreakerCoverageRole);

export function isRunnerBreakerCoverageRole(
  role: string,
): role is RunnerBreakerCoverageRole {
  return Object.hasOwn(RUNNER_BREAKER_COVERAGE, role);
}

export type RunnerCoverageGapSignal = {
  gapId: string;
  needKind?:
    | "missing_coverage"
    | "cost_ineffective_coverage"
    | "coverage_upgrade";
  requiredRole: RunnerBreakerCoverageRole;
  targetServerId?: string;
  targetRunActionId?: string;
  requesterModuleId?: "runner.pressure_central" | "runner.contest_remote";
  requesterPlanInstanceId?: string;
  requesterNeedId?: string;
  priorityClass: "P2" | "P4" | "P5";
  evidenceCode: string;
  deckHasAnswer: boolean;
  answerInHand: boolean;
  handAnswerDefinitionId?: number;
  answerInstallCost?: number;
  installActionIds?: string[];
  installActionValues?: Record<string, number>;
  preparationActionIds?: string[];
  installCreditPreparation?: {
    actionId: string;
    sourceCardInstanceId: string;
    targetCardInstanceId: string;
    targetDefinitionId: number;
    savedLiquidCredits: number;
    stateVersion: number;
  };
  memorySupportActionIds?: string[];
  heapRecoveryPreparation?: {
    actionId: string;
    sourceCardInstanceId: string;
    currentTopCardInstanceId: string;
    targetCardInstanceId: string;
    targetDefinitionId: number;
    recoveryCount: number;
    requiredClicks: number;
    upfrontCredits: number;
    projectedKnownPathCost: number;
    stateVersion: number;
  };
  fundingGap?: number;
  bankFunding?: {
    stateVersion: number;
    needId: string;
    parentPlanInstanceId: string;
    gapId: string;
    targetDefinitionId: number;
    targetCredits: number;
    gap: number;
    bankId: string;
    actionId: string;
    replacedBasicClicks: number;
  };
  sameTurnRunConversion?: {
    targetRunActionId: string;
    requiredCredits: number;
    requiredClicksAfterFunding: number;
    projectedKnownPathCost: number;
    postRunCreditFloor: number;
    bankCashOutActionId?: string;
    /** Exact central parent value after the quoted current install and run. */
    projectedCentralPressureValue?: number;
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
    targetDefinitionId: number;
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
    sourceDefinitionId: number;
    resolvedSearchChoice?: {
      choiceId: string;
      choiceSource: string;
      stateVersion: number;
    };
    targetCardInstanceId?: string;
    targetDefinitionId?: number;
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
  requiredRole: RunnerBreakerCoverageRole,
): readonly string[] {
  return RUNNER_BREAKER_COVERAGE[requiredRole].needles;
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
