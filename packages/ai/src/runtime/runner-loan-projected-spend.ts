import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

export type RunnerLoanProjectedSpend = {
  plannedSpendAfterLoan: number;
  directPlanSpendAfterLoan: number;
  genericSetupSpendAfterLoan: number;
  genericSetupSpendCount: number;
  criticalBreakerSpendAfterLoan: number;
  evidence: string[];
};

export type RunnerLoanSpendCandidateKind =
  | "critical_breaker"
  | "direct_plan"
  | "generic_setup"
  | "ignore";

export type RunnerLoanProjectedSpendDependencies = {
  actionClickCost: (action: LegalAction) => number;
  actionCreditCost: (action: LegalAction) => number;
  projectedCreditGainForAction: (action: LegalAction) => number;
  definitionIsHighRiskLoan: (definitionId: string | undefined) => boolean;
  visibleCardPlayOrInstallCost: (card: VisibleCard) => number;
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  spendCandidateKind: (
    input: AiDecisionInput,
    card: VisibleCard,
    roles: readonly string[],
  ) => RunnerLoanSpendCandidateKind;
  spendKindRank: (kind: RunnerLoanSpendCandidateKind) => number;
};

export function runnerLoanProjectedSpendAfterLoan(
  input: AiDecisionInput,
  loanAction: LegalAction,
  creditsAfterLoan: number,
  dependencies: RunnerLoanProjectedSpendDependencies,
): RunnerLoanProjectedSpend {
  const remainingClicks = Math.max(
    0,
    input.playerView.own.clicks - dependencies.actionClickCost(loanAction),
  );
  const spendCandidates = input.playerView.own.gripOrHq
    .filter(
      (card) =>
        card.known !== false &&
        card.definitionId !== undefined &&
        !dependencies.definitionIsHighRiskLoan(card.definitionId) &&
        card.instanceId !== loanAction.source,
    )
    .map((card) => {
      const cost = dependencies.visibleCardPlayOrInstallCost(card);
      const roles = dependencies.rolesForCardId(card.definitionId);
      const kind = dependencies.spendCandidateKind(input, card, roles);
      return { cost, kind };
    })
    .filter(
      (candidate) =>
        candidate.cost > 0 &&
        candidate.cost <= creditsAfterLoan &&
        candidate.kind !== "ignore",
    )
    .sort(
      (left, right) =>
        dependencies.spendKindRank(right.kind) -
          dependencies.spendKindRank(left.kind) ||
        right.cost - left.cost,
    )
    .slice(0, remainingClicks);
  const genericSetupSpendAfterLoan = spendCandidates
    .filter((candidate) => candidate.kind === "generic_setup")
    .reduce((sum, candidate) => sum + candidate.cost, 0);
  const directPlanSpendAfterLoan = spendCandidates
    .filter((candidate) => candidate.kind === "direct_plan")
    .reduce((sum, candidate) => sum + candidate.cost, 0);
  const criticalBreakerSpendAfterLoan = spendCandidates
    .filter((candidate) => candidate.kind === "critical_breaker")
    .reduce((sum, candidate) => sum + candidate.cost, 0);
  const plannedSpendAfterLoan =
    genericSetupSpendAfterLoan +
    directPlanSpendAfterLoan +
    criticalBreakerSpendAfterLoan;
  return {
    plannedSpendAfterLoan,
    directPlanSpendAfterLoan,
    genericSetupSpendAfterLoan,
    genericSetupSpendCount: spendCandidates.filter(
      (candidate) => candidate.kind === "generic_setup",
    ).length,
    criticalBreakerSpendAfterLoan,
    evidence: [
      `loanProjectedSpendCandidates:${spendCandidates.length}`,
      `loanProjectedGenericSetupSpend:${genericSetupSpendAfterLoan}`,
      `loanProjectedGenericSetupCount:${spendCandidates.filter((candidate) => candidate.kind === "generic_setup").length}`,
      `loanProjectedDirectPlanSpend:${directPlanSpendAfterLoan}`,
      `loanProjectedCriticalBreakerSpend:${criticalBreakerSpendAfterLoan}`,
    ],
  };
}

export function runnerInstalledLoanActionSpend(
  action: LegalAction,
  dependencies: Pick<
    RunnerLoanProjectedSpendDependencies,
    "actionCreditCost" | "projectedCreditGainForAction"
  >,
): RunnerLoanProjectedSpend {
  const spend = Math.max(
    0,
    dependencies.actionCreditCost(action) -
      dependencies.projectedCreditGainForAction(action),
  );
  return {
    plannedSpendAfterLoan: spend,
    directPlanSpendAfterLoan: 0,
    genericSetupSpendAfterLoan: spend,
    genericSetupSpendCount: spend > 0 ? 1 : 0,
    criticalBreakerSpendAfterLoan: 0,
    evidence: [`installedLoanActionSpend:${spend}`],
  };
}
