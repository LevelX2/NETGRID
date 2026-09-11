import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
export function runnerFundingRouteCandidateIsMaterializable(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    !candidate.effectTargets?.some((target) =>
      [
        "economy.bank_cashout_all",
        "economy.bank_load",
        "economy.temporary_resource_bank",
      ].includes(target),
    ) &&
    candidate.economyProjection?.kind === "immediate_liquid" &&
    candidate.economyProjection.timing === "immediate" &&
    candidate.economyProjection.creditRestriction === "general" &&
    candidate.economyProjection.storedCreditsAdded === undefined &&
    candidate.economyProjection.storedCreditsTaken === undefined &&
    candidate.economyProjection.payoutMode !== "all_available" &&
    typeof candidate.economyProjection.netLiquidCreditGain === "number" &&
    Number.isFinite(candidate.economyProjection.netLiquidCreditGain) &&
    candidate.economyProjection.netLiquidCreditGain > 0
  );
}

export function runnerTurnLiquidityCandidateIsMaterializable(
  candidate: ActionSemanticCandidate,
): boolean {
  const projection = candidate.economyProjection;
  return (
    runnerFundingRouteCandidateIsMaterializable(candidate) &&
    candidate.costProfile.clickCost === 1 &&
    (candidate.costProfile.creditCost === undefined ||
      candidate.costProfile.creditCost === 0) &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.clickCost === 1 &&
    projection.creditCost === 0 &&
    projection.cardsDrawn === 0 &&
    ((projection.cardsConsumed === 0 && projection.netHandDelta === 0) ||
      (candidate.actionType === "play_event" &&
        projection.cardsConsumed === 1 &&
        projection.netHandDelta === -1)) &&
    projection.payoutMode === "fixed" &&
    projection.reliability === "guaranteed" &&
    ((projection.source === "basic_action_contract" &&
      projection.confidence === "medium") ||
      (projection.source === "legal_action_payload" &&
        projection.confidence === "high"))
  );
}

export function runnerExactBasicLiquidCreditCandidate(
  candidate: ActionSemanticCandidate,
): boolean {
  const projection = candidate.economyProjection;
  return (
    candidate.sourceKind === "basic_action" &&
    candidate.actionType === "gain_credit" &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.costProfile.clickCost === 1 &&
    (candidate.costProfile.creditCost === undefined ||
      candidate.costProfile.creditCost === 0) &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.clickCost === 1 &&
    projection.creditCost === 0 &&
    projection.grossLiquidCreditGain === 1 &&
    projection.netLiquidCreditGain === 1 &&
    projection.cardsDrawn === 0 &&
    projection.cardsConsumed === 0 &&
    projection.netHandDelta === 0 &&
    projection.payoutMode === "fixed" &&
    projection.reliability === "guaranteed" &&
    ((projection.source === "basic_action_contract" &&
      projection.confidence === "medium") ||
      (projection.source === "legal_action_payload" &&
        projection.confidence === "high"))
  );
}
