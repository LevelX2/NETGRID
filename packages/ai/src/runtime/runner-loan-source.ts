import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { runnerDebtFinancingProfile } from "./runner-canonical-card-facts";

export type RunnerLoanSourceDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export function runnerLoanDefinitionIdForAction(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerLoanSourceDependencies,
): string | undefined {
  if (action.type !== "install_card") return undefined;
  const definitionId = dependencies.sourceDefinitionIdForAction(input, action);
  return runnerDefinitionIsHighRiskLoan(definitionId)
    ? definitionId
    : undefined;
}

export function runnerDefinitionIsHighRiskLoan(
  definitionId: string | undefined,
): boolean {
  return runnerDebtFinancingProfile(definitionId) !== undefined;
}

export function runnerInstalledLoanCards(
  input: AiDecisionInput,
): VisibleCard[] {
  return (input.playerView.own.rig ?? []).filter((card) =>
    runnerDefinitionIsHighRiskLoan(card.definitionId),
  );
}

export function runnerLoanSemanticEvidence(
  definitionId: string | undefined,
): string[] | undefined {
  const profile = runnerDebtFinancingProfile(definitionId);
  if (!definitionId || !profile) return undefined;
  return [
    `loanSource:${definitionId}`,
    "loanSemantic:strategic_exchange:debt_financing",
    `loanCanonicalInstallCreditGain:${profile.installCreditGain}`,
    `loanCanonicalStartTurnCreditLoss:${profile.startOfTurnCreditLoss}`,
    `loanCanonicalLeavePlayPayCost:${profile.leavePlayPayCost}`,
  ];
}

export function runnerLoanValueHint(
  definitionId: string | undefined,
  key: "installCreditGain" | "startOfTurnCreditLoss" | "leavePlayPayCost",
): number | undefined {
  return runnerDebtFinancingProfile(definitionId)?.[key];
}
