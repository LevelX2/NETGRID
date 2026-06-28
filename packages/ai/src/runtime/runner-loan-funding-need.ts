import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { rolesHaveBreakerRole } from "./breaker-role-match";

export type RunnerLoanFundingNeedDependencies = {
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  cardAddressesVisibleBreakerNeed: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => boolean;
  visibleCardPlayOrInstallCost: (card: VisibleCard) => number;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  isRunnerEconomyRole: (role: string) => boolean;
  hasKnownUnaffordableLegalRun: (input: AiDecisionInput) => boolean;
};

export function runnerLoanCriticalBreakerFundingNeed(
  input: AiDecisionInput,
  creditsAfterLoan: number,
  remoteThreatVisible: boolean,
  dependencies: Pick<
    RunnerLoanFundingNeedDependencies,
    "rolesForCardId" | "cardAddressesVisibleBreakerNeed" | "visibleCardPlayOrInstallCost"
  >,
): { active: boolean; evidence: string[] } {
  const candidates = input.playerView.own.gripOrHq.filter((card) => {
    if (card.known === false || !card.definitionId) return false;
    const roles = dependencies.rolesForCardId(card.definitionId);
    return (
      rolesHaveBreakerRole(roles) &&
      dependencies.cardAddressesVisibleBreakerNeed(input, card) &&
      dependencies.visibleCardPlayOrInstallCost(card) <= creditsAfterLoan
    );
  });
  const active = candidates.length > 0 && remoteThreatVisible;
  return {
    active,
    evidence: [
      `loanCriticalBreakerFunding:${active}`,
      `loanCriticalBreakerCandidates:${candidates.length}`,
    ],
  };
}

export function runnerLoanEmergencyFundingNeed(
  input: AiDecisionInput,
  desiredCreditReserve: number,
  dependencies: Pick<
    RunnerLoanFundingNeedDependencies,
    "rolesForAction" | "isRunnerEconomyRole" | "hasKnownUnaffordableLegalRun"
  >,
): boolean {
  const safeEconomyAvailable = input.legalActions.some(
    (action) =>
      action.type === "gain_credit" ||
      (action.type === "play_event" &&
        dependencies
          .rolesForAction(input, action)
          .some(dependencies.isRunnerEconomyRole)),
  );
  return (
    input.playerView.own.credits <= 1 &&
    (input.playerView.own.tags > 0 ||
      dependencies.hasKnownUnaffordableLegalRun(input) ||
      (!safeEconomyAvailable && input.playerView.own.gripOrHq.length <= 1) ||
      (!safeEconomyAvailable && desiredCreditReserve <= 1))
  );
}
