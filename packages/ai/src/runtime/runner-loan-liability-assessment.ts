import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

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
type RunnerLoanAssessmentRemoteThreat =
  | "none"
  | "possible"
  | "visible"
  | "urgent";

type RunnerLoanRunFundingContext = {
  remoteScoreThreat: RunnerLoanAssessmentRemoteThreat;
  remoteContestFunding: boolean;
  knownAgendaPayoff: boolean;
  knownAgendaFunding: boolean;
  closeoutFunding: boolean;
  evidence: string[];
};

type RunnerLoanProjectedSpend = {
  plannedSpendAfterLoan: number;
  directPlanSpendAfterLoan: number;
  genericSetupSpendAfterLoan: number;
  genericSetupSpendCount: number;
  criticalBreakerSpendAfterLoan: number;
  evidence: string[];
};

type RunnerLoanRuntimeContext = {
  desiredCreditReserve: number;
  contestReserve: number;
  runFunding: RunnerLoanRunFundingContext;
  evidence: string[];
};

type RunnerLoanActiveEvidence = {
  active: boolean;
  evidence: string[];
};

export type RunnerLoanLiabilityAssessment = {
  loanLiabilityAssessment: true;
  loanInstallAction: boolean;
  loanAlreadyInstalled: boolean;
  currentCredits: number;
  installCreditGain: number;
  creditsAfterLoan: number;
  plannedSpendAfterLoan: number;
  creditsAfterPlannedSpend: number;
  desiredCreditReserve: number;
  contestReserve: number;
  currentGamePhase: RunnerLoanGamePhase;
  remoteScoreThreat: RunnerLoanAssessmentRemoteThreat;
  knownAgendaPayoff: boolean;
  activeFundingNeed: boolean;
  debtRepaymentRisk: RunnerLoanDebtRepaymentRisk;
  leavePlayPayCost: number;
  startTurnCreditLoss: number;
  resourceTrashRisk: boolean;
  liabilitySeverity: RunnerLoanLiabilitySeverity;
  loanUseCase: RunnerLoanUseCase;
  scoreValue: number;
  evidence: string[];
};

export type RunnerLoanLiabilityAssessmentDependencies = {
  loanDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  installedLoanCards: (input: AiDecisionInput) => VisibleCard[];
  valueHint: (
    definitionId: string | undefined,
    key: "installCreditGain" | "startOfTurnCreditLoss" | "leavePlayPayCost",
    fallback: number,
  ) => number;
  projectedCreditGainForAction: (action: LegalAction) => number;
  actionCreditCost: (action: LegalAction) => number;
  runtimeContext: (
    input: AiDecisionInput,
    creditsAfterLoan: number,
  ) => RunnerLoanRuntimeContext;
  projectedSpendAfterLoan: (
    input: AiDecisionInput,
    loanAction: LegalAction,
    creditsAfterLoan: number,
  ) => RunnerLoanProjectedSpend;
  installedLoanActionSpend: (action: LegalAction) => RunnerLoanProjectedSpend;
  gamePhase: (input: AiDecisionInput) => RunnerLoanGamePhase;
  resourceTrashRisk: (input: AiDecisionInput) => boolean;
  criticalBreakerFundingNeed: (
    input: AiDecisionInput,
    creditsAfterLoan: number,
    remoteThreatVisible: boolean,
  ) => RunnerLoanActiveEvidence;
  emergencyFundingNeed: (
    input: AiDecisionInput,
    desiredCreditReserve: number,
  ) => boolean;
  useCase: (params: {
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
  }) => RunnerLoanUseCase;
  debtRepaymentRisk: (params: {
    creditsAfterPlannedSpend: number;
    leavePlayPayCost: number;
    startTurnCreditLoss: number;
    resourceTrashRisk: boolean;
  }) => RunnerLoanDebtRepaymentRisk;
  liabilitySeverity: (params: {
    loanUseCase: RunnerLoanUseCase;
    debtRepaymentRisk: RunnerLoanDebtRepaymentRisk;
    currentGamePhase: RunnerLoanGamePhase;
    activeFundingNeed: boolean;
    creditsAfterPlannedSpend: number;
    desiredCreditReserve: number;
    resourceTrashRisk: boolean;
  }) => RunnerLoanLiabilitySeverity;
  scoreValue: (params: {
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
  }) => number;
  allowedReason: (loanUseCase: RunnerLoanUseCase) => string | undefined;
  blockedReason: (params: {
    loanUseCase: RunnerLoanUseCase;
    activeFundingNeed: boolean;
    currentGamePhase: RunnerLoanGamePhase;
    creditsAfterPlannedSpend: number;
    desiredCreditReserve: number;
    genericSetupOnly: boolean;
    resourceTrashRisk: boolean;
  }) => string | undefined;
  semanticEvidence: (definitionId: string | undefined) => string[] | undefined;
};

export function runnerLoanLiabilityAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerLoanLiabilityAssessmentDependencies,
): RunnerLoanLiabilityAssessment | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  const loanDefinitionId = dependencies.loanDefinitionIdForAction(input, action);
  const loanInstallAction = loanDefinitionId !== undefined;
  const installedLoan = dependencies.installedLoanCards(input)[0];
  const loanAlreadyInstalled = installedLoan !== undefined;
  if (!loanInstallAction && !loanAlreadyInstalled) return undefined;

  const loanSourceDefinitionId =
    loanDefinitionId ?? installedLoan?.definitionId;
  const installCreditGain = loanInstallAction
    ? dependencies.valueHint(loanSourceDefinitionId, "installCreditGain", 12)
    : 0;
  const startTurnCreditLoss = dependencies.valueHint(
    loanSourceDefinitionId,
    "startOfTurnCreditLoss",
    1,
  );
  const leavePlayPayCost = dependencies.valueHint(
    loanSourceDefinitionId,
    "leavePlayPayCost",
    10,
  );
  const currentCredits = input.playerView.own.credits;
  const actionCreditGain = dependencies.projectedCreditGainForAction(action);
  const actionCreditSpend = dependencies.actionCreditCost(action);
  const creditsAfterLoan = loanInstallAction
    ? currentCredits + installCreditGain - actionCreditSpend
    : currentCredits;
  const runtimeContext = dependencies.runtimeContext(input, creditsAfterLoan);
  const projectedSpend = loanInstallAction
    ? dependencies.projectedSpendAfterLoan(input, action, creditsAfterLoan)
    : dependencies.installedLoanActionSpend(action);
  const creditsAfterPlannedSpend = loanInstallAction
    ? creditsAfterLoan - projectedSpend.plannedSpendAfterLoan
    : currentCredits + actionCreditGain - actionCreditSpend;
  const currentGamePhase = dependencies.gamePhase(input);
  const resourceTrashRisk = dependencies.resourceTrashRisk(input);
  const criticalBreakerFunding = loanInstallAction
    ? dependencies.criticalBreakerFundingNeed(
        input,
        creditsAfterLoan,
        runtimeContext.runFunding.remoteScoreThreat !== "none",
      )
    : { active: false, evidence: [] };
  const emergencyFunding =
    loanInstallAction &&
    dependencies.emergencyFundingNeed(
      input,
      runtimeContext.desiredCreditReserve,
    );
  const activeFundingNeed =
    runtimeContext.runFunding.remoteContestFunding ||
    runtimeContext.runFunding.knownAgendaFunding ||
    runtimeContext.runFunding.closeoutFunding ||
    criticalBreakerFunding.active ||
    emergencyFunding;
  const genericSetupOnly =
    loanInstallAction &&
    !activeFundingNeed &&
    projectedSpend.genericSetupSpendAfterLoan > 0;
  const loanUseCase = dependencies.useCase({
    loanInstallAction,
    activeFundingNeed,
    remoteContestFunding: runtimeContext.runFunding.remoteContestFunding,
    knownAgendaFunding: runtimeContext.runFunding.knownAgendaFunding,
    closeoutFunding: runtimeContext.runFunding.closeoutFunding,
    criticalBreakerFunding: criticalBreakerFunding.active,
    emergencyFunding,
    genericSetupOnly,
    action,
    currentCredits,
    leavePlayPayCost,
    creditsAfterPlannedSpend,
    desiredCreditReserve: runtimeContext.desiredCreditReserve,
  });
  const debtRepaymentRisk = dependencies.debtRepaymentRisk({
    creditsAfterPlannedSpend,
    leavePlayPayCost,
    startTurnCreditLoss,
    resourceTrashRisk,
  });
  const liabilitySeverity = dependencies.liabilitySeverity({
    loanUseCase,
    debtRepaymentRisk,
    currentGamePhase,
    activeFundingNeed,
    creditsAfterPlannedSpend,
    desiredCreditReserve: runtimeContext.desiredCreditReserve,
    resourceTrashRisk,
  });
  const scoreValue = dependencies.scoreValue({
    loanInstallAction,
    loanUseCase,
    liabilitySeverity,
    debtRepaymentRisk,
    currentGamePhase,
    activeFundingNeed,
    currentCredits,
    leavePlayPayCost,
    creditsAfterPlannedSpend,
    desiredCreditReserve: runtimeContext.desiredCreditReserve,
    plannedSpendAfterLoan: projectedSpend.plannedSpendAfterLoan,
    genericSetupSpendAfterLoan: projectedSpend.genericSetupSpendAfterLoan,
    action,
  });
  const allowedDespiteRisk = dependencies.allowedReason(loanUseCase);
  const blockedOrDeferred = dependencies.blockedReason({
    loanUseCase,
    activeFundingNeed,
    currentGamePhase,
    creditsAfterPlannedSpend,
    desiredCreditReserve: runtimeContext.desiredCreditReserve,
    genericSetupOnly,
    resourceTrashRisk,
  });
  const evidence = sortedUnique([
    "loanLiabilityAssessment:true",
    `loanAction:${loanInstallAction ? "install" : "installed_liability"}`,
    `loanUseCase:${loanUseCase}`,
    `currentCredits:${currentCredits}`,
    `installCreditGain:${installCreditGain}`,
    `creditsAfterLoan:${creditsAfterLoan}`,
    `plannedSpendAfterLoan:${projectedSpend.plannedSpendAfterLoan}`,
    `projectedCreditsAfterPlannedSpend:${creditsAfterPlannedSpend}`,
    `desiredCreditReserve:${runtimeContext.desiredCreditReserve}`,
    `contestReserve:${runtimeContext.contestReserve}`,
    `currentGamePhase:${currentGamePhase}`,
    `remoteScoreThreat:${runtimeContext.runFunding.remoteScoreThreat}`,
    `knownAgendaPayoff:${runtimeContext.runFunding.knownAgendaPayoff}`,
    `activeFundingNeed:${activeFundingNeed}`,
    `debtRepaymentRisk:${debtRepaymentRisk}`,
    `leavePlayPayCost:${leavePlayPayCost}`,
    `startTurnCreditLoss:${startTurnCreditLoss}`,
    `resourceTrashRisk:${resourceTrashRisk}`,
    `liabilitySeverity:${liabilitySeverity}`,
    `loanScoreValue:${scoreValue}`,
    "loan_not_build_credit_base:true",
    ...(dependencies.semanticEvidence(loanSourceDefinitionId) ?? []),
    ...runtimeContext.evidence,
    ...runtimeContext.runFunding.evidence,
    ...projectedSpend.evidence,
    ...criticalBreakerFunding.evidence,
    ...(genericSetupOnly ? ["loanUseCaseEvidence:generic_setup_only"] : []),
    ...(projectedSpend.genericSetupSpendAfterLoan > 0 &&
    creditsAfterPlannedSpend < runtimeContext.desiredCreditReserve
      ? [
          "loan_overextended_setup_spend:true",
          "credits_after_loan_spend_below_reserve:true",
        ]
      : []),
    ...(allowedDespiteRisk
      ? [`why_loan_allowed_despite_risk:${allowedDespiteRisk}`]
      : []),
    ...(blockedOrDeferred
      ? [`why_loan_blocked_or_deferred:${blockedOrDeferred}`]
      : []),
  ]);

  return {
    loanLiabilityAssessment: true,
    loanInstallAction,
    loanAlreadyInstalled,
    currentCredits,
    installCreditGain,
    creditsAfterLoan,
    plannedSpendAfterLoan: projectedSpend.plannedSpendAfterLoan,
    creditsAfterPlannedSpend,
    desiredCreditReserve: runtimeContext.desiredCreditReserve,
    contestReserve: runtimeContext.contestReserve,
    currentGamePhase,
    remoteScoreThreat: runtimeContext.runFunding.remoteScoreThreat,
    knownAgendaPayoff: runtimeContext.runFunding.knownAgendaPayoff,
    activeFundingNeed,
    debtRepaymentRisk,
    leavePlayPayCost,
    startTurnCreditLoss,
    resourceTrashRisk,
    liabilitySeverity,
    loanUseCase,
    scoreValue,
    evidence,
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
