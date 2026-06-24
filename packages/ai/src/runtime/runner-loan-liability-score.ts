import type { AiDecisionScoreComponent } from "@netgrid/shared";

export type RunnerLoanLiabilityScoreAssessment = {
  loanInstallAction: boolean;
  scoreValue: number;
  evidence: string[];
};

export function runnerLoanLiabilityScoreComponent(
  assessment: RunnerLoanLiabilityScoreAssessment | undefined,
): AiDecisionScoreComponent | undefined {
  if (!assessment || assessment.scoreValue === 0) return undefined;
  return {
    key: assessment.loanInstallAction
      ? "runner_loan_liability_assessment"
      : "runner_installed_loan_liability_reserve",
    label: assessment.loanInstallAction
      ? "Loan-Liability"
      : "Loan-Rueckzahlungsreserve",
    value: assessment.scoreValue,
    reason: sortedUnique(assessment.evidence).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
