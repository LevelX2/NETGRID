import type {
  FundingRoute,
  PaymentWindowFundingSetup,
} from "../plans/funding-route";

/** The setup compiler owns these exact capabilities. Their payout exists only
 * inside this run's later payment window, never in the preceding setup budget. */
export function runnerFundingPaymentWindowQuote(
  route: FundingRoute,
  setups: readonly PaymentWindowFundingSetup[],
): { creditGain: number; installedCardIds: string[] } | undefined {
  let creditGain = 0;
  const installedCardIds: string[] = [];
  for (const [index, step] of route.steps.entries()) {
    if (step.kind === "legal_action") continue;
    const installation = route.steps[index - 1];
    const setup = setups.find(
      (entry) =>
        entry.actionId === installation?.actionId &&
        step.stepId ===
          `payment_window:${entry.sourceCardInstanceId}:${entry.capabilityId}` &&
        step.projectionId === entry.capabilityId &&
        step.sourceDefinitionId === entry.sourceDefinitionId,
    );
    if (
      !setup ||
      installation?.kind !== "legal_action" ||
      installation.ownTurnOffset !== 0 ||
      installation.sourceDefinitionId !== setup.sourceDefinitionId ||
      installation.reliability !== "guaranteed" ||
      installation.creditRestriction !== "general" ||
      installation.netLiquidCreditGain !== 0 ||
      installation.clickCost !== setup.installClickCost ||
      installation.creditCost !== setup.installCreditCost ||
      installedCardIds.includes(setup.sourceCardInstanceId) ||
      step.ownTurnOffset !== 0 ||
      step.clickCost !== 0 ||
      step.creditCost !== setup.activationCreditCost ||
      step.netLiquidCreditGain !== setup.netPaymentGain ||
      step.creditRestriction !== "restricted" ||
      step.reliability !== "guaranteed"
    )
      return undefined;
    installedCardIds.push(setup.sourceCardInstanceId);
    creditGain += setup.netPaymentGain;
  }
  if (
    !Number.isSafeInteger(creditGain) ||
    route.projectedGeneralCredits + creditGain !== route.projectedCredits
  )
    return undefined;
  return { creditGain, installedCardIds };
}
