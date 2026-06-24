import type { LegalAction } from "@netgrid/shared";

type RunnerLoanGamePhase = "opening" | "midgame" | "late";
type RunnerLoanLiabilitySeverity = "low" | "medium" | "high" | "critical";
type RunnerLoanUseCase =
  | "emergency_funding"
  | "remote_contest_funding"
  | "known_agenda_funding"
  | "closeout_funding"
  | "fund_critical_breaker_install"
  | "generic_setup"
  | "bad_use";
type RunnerLoanDebtRepaymentRisk = "low" | "medium" | "high" | "critical";

export type RunnerLoanLiabilityPolicyDependencies = {
  projectedCreditGainForAction: (action: LegalAction) => number;
  actionCreditCost: (action: LegalAction) => number;
};

export function runnerLoanUseCase(
  params: {
    loanInstallAction: boolean;
    activeFundingNeed: boolean;
    remoteContestFunding: boolean;
    knownAgendaFunding: boolean;
    closeoutFunding: boolean;
    criticalBreakerFunding: boolean;
    emergencyFunding: boolean;
    genericSetupOnly: boolean;
    action: LegalAction;
    currentCredits: number;
    leavePlayPayCost: number;
    creditsAfterPlannedSpend: number;
    desiredCreditReserve: number;
  },
  dependencies: RunnerLoanLiabilityPolicyDependencies,
): RunnerLoanUseCase {
  if (params.loanInstallAction) {
    if (params.closeoutFunding) return "closeout_funding";
    if (params.knownAgendaFunding) return "known_agenda_funding";
    if (params.remoteContestFunding) return "remote_contest_funding";
    if (params.criticalBreakerFunding) return "fund_critical_breaker_install";
    if (params.emergencyFunding) return "emergency_funding";
    if (params.genericSetupOnly) return "generic_setup";
    return "bad_use";
  }
  if (
    dependencies.projectedCreditGainForAction(params.action) > 0 &&
    params.currentCredits < params.leavePlayPayCost
  ) {
    return "emergency_funding";
  }
  if (
    dependencies.actionCreditCost(params.action) > 0 &&
    params.creditsAfterPlannedSpend < params.desiredCreditReserve
  ) {
    return "bad_use";
  }
  return "generic_setup";
}

export function runnerLoanDebtRepaymentRisk(params: {
  creditsAfterPlannedSpend: number;
  leavePlayPayCost: number;
  startTurnCreditLoss: number;
  resourceTrashRisk: boolean;
}): RunnerLoanDebtRepaymentRisk {
  if (
    params.resourceTrashRisk &&
    params.creditsAfterPlannedSpend < params.leavePlayPayCost
  ) {
    return "critical";
  }
  if (params.creditsAfterPlannedSpend <= params.startTurnCreditLoss + 1) {
    return "critical";
  }
  if (params.creditsAfterPlannedSpend < params.leavePlayPayCost) return "high";
  if (
    params.creditsAfterPlannedSpend <
    params.leavePlayPayCost + params.startTurnCreditLoss
  ) {
    return "medium";
  }
  return "low";
}

export function runnerLoanLiabilitySeverity(params: {
  loanUseCase: RunnerLoanUseCase;
  debtRepaymentRisk: RunnerLoanDebtRepaymentRisk;
  currentGamePhase: RunnerLoanGamePhase;
  activeFundingNeed: boolean;
  creditsAfterPlannedSpend: number;
  desiredCreditReserve: number;
  resourceTrashRisk: boolean;
}): RunnerLoanLiabilitySeverity {
  if (params.loanUseCase === "bad_use") return "critical";
  if (params.debtRepaymentRisk === "critical") return "critical";
  if (
    params.resourceTrashRisk &&
    params.creditsAfterPlannedSpend < params.desiredCreditReserve
  ) {
    return "critical";
  }
  if (!params.activeFundingNeed && params.currentGamePhase === "opening") {
    return "high";
  }
  if (
    params.debtRepaymentRisk === "high" ||
    params.creditsAfterPlannedSpend < params.desiredCreditReserve
  ) {
    return "high";
  }
  if (
    params.loanUseCase === "generic_setup" ||
    params.debtRepaymentRisk === "medium"
  ) {
    return "medium";
  }
  return "low";
}

export function runnerLoanLiabilityScoreValue(
  params: {
    loanInstallAction: boolean;
    loanUseCase: RunnerLoanUseCase;
    liabilitySeverity: RunnerLoanLiabilitySeverity;
    debtRepaymentRisk: RunnerLoanDebtRepaymentRisk;
    currentGamePhase: RunnerLoanGamePhase;
    activeFundingNeed: boolean;
    currentCredits: number;
    leavePlayPayCost: number;
    creditsAfterPlannedSpend: number;
    desiredCreditReserve: number;
    plannedSpendAfterLoan: number;
    genericSetupSpendAfterLoan: number;
    action: LegalAction;
  },
  dependencies: RunnerLoanLiabilityPolicyDependencies,
): number {
  if (!params.loanInstallAction) {
    const gain = dependencies.projectedCreditGainForAction(params.action);
    if (gain > 0 && params.currentCredits < params.leavePlayPayCost) {
      return Math.min(
        1450,
        760 + (params.leavePlayPayCost - params.currentCredits) * 80,
      );
    }
    if (
      dependencies.actionCreditCost(params.action) > 0 &&
      params.creditsAfterPlannedSpend < params.desiredCreditReserve
    ) {
      return (
        -1250 -
        Math.max(
          0,
          params.desiredCreditReserve - params.creditsAfterPlannedSpend,
        ) *
          90
      );
    }
    return 0;
  }

  let value = 0;
  switch (params.loanUseCase) {
    case "closeout_funding":
      value += 3400;
      break;
    case "known_agenda_funding":
      value += 3000;
      break;
    case "remote_contest_funding":
      value += 2700;
      break;
    case "fund_critical_breaker_install":
      value += 2200;
      break;
    case "emergency_funding":
      value += 1500;
      break;
    case "generic_setup":
      value -= 2800;
      break;
    case "bad_use":
      value -= 4300;
      break;
  }
  if (!params.activeFundingNeed && params.currentGamePhase === "opening") {
    value -= 900;
  }
  if (
    params.genericSetupSpendAfterLoan > 0 &&
    params.creditsAfterPlannedSpend < params.desiredCreditReserve
  ) {
    value -= 1250;
  }
  if (
    params.plannedSpendAfterLoan > 0 &&
    params.creditsAfterPlannedSpend <= 3
  ) {
    value -= 700;
  }
  if (
    params.liabilitySeverity === "critical" &&
    params.loanUseCase !== "closeout_funding"
  ) {
    value -= 900;
  } else if (
    params.liabilitySeverity === "high" &&
    params.loanUseCase === "generic_setup"
  ) {
    value -= 650;
  } else if (
    params.debtRepaymentRisk === "high" &&
    params.loanUseCase !== "known_agenda_funding" &&
    params.loanUseCase !== "remote_contest_funding" &&
    params.loanUseCase !== "closeout_funding"
  ) {
    value -= 380;
  }
  return value;
}

export function runnerLoanAllowedReason(
  useCase: RunnerLoanUseCase,
): string | undefined {
  switch (useCase) {
    case "remote_contest_funding":
      return "funds_remote_contest";
    case "known_agenda_funding":
      return "funds_known_agenda_run";
    case "closeout_funding":
      return "funds_closeout";
    case "fund_critical_breaker_install":
      return "funds_critical_breaker_install";
    case "emergency_funding":
      return "emergency_funding";
    case "generic_setup":
    case "bad_use":
      return undefined;
  }
}

export function runnerLoanBlockedReason(params: {
  loanUseCase: RunnerLoanUseCase;
  activeFundingNeed: boolean;
  currentGamePhase: RunnerLoanGamePhase;
  creditsAfterPlannedSpend: number;
  desiredCreditReserve: number;
  genericSetupOnly: boolean;
  resourceTrashRisk: boolean;
}): string | undefined {
  if (params.loanUseCase === "bad_use") return "no_active_funding_need";
  if (
    params.genericSetupOnly &&
    params.creditsAfterPlannedSpend < params.desiredCreditReserve
  ) {
    return "loan_overextended_setup_spend";
  }
  if (!params.activeFundingNeed && params.currentGamePhase === "opening") {
    return "opening_generic_setup";
  }
  if (
    params.resourceTrashRisk &&
    params.creditsAfterPlannedSpend < params.desiredCreditReserve
  ) {
    return "resource_trash_risk_without_repayment_reserve";
  }
  if (params.creditsAfterPlannedSpend < params.desiredCreditReserve) {
    return "credits_after_loan_spend_below_reserve";
  }
  return undefined;
}
