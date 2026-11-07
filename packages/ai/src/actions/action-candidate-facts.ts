import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

/** A known zone-count change is independent of whether an action gains credits. */
export function exactImmediateHandDelta(
  candidate: ActionSemanticCandidate,
): number | undefined {
  const projection = candidate.economyProjection;
  if (
    !projection ||
    projection.timing !== "immediate" ||
    projection.reliability !== "guaranteed" ||
    !Number.isSafeInteger(projection.netHandDelta)
  )
    return undefined;
  if (
    projection.source === "legal_action_payload" &&
    projection.confidence === "high"
  )
    return projection.netHandDelta;
  if (
    projection.source === "basic_action_contract" &&
    projection.confidence === "medium" &&
    candidate.sourceKind === "basic_action" &&
    candidate.actionType === "draw_card" &&
    candidate.semanticActionType === "draw.card" &&
    projection.cardsDrawn === 1 &&
    projection.cardsConsumed === 0 &&
    projection.netHandDelta === 1
  )
    return projection.netHandDelta;
  return undefined;
}

export function candidateTargetIds(
  candidate: ActionSemanticCandidate,
): string[] {
  const selectedTargets =
    candidate.targetContext?.selectedTargets.map((target) => target.targetId) ??
    [];
  return [
    ...(selectedTargets.length > 0
      ? selectedTargets
      : (candidate.targetContext?.availableTargets?.map(
          (target) => target.targetId,
        ) ?? [])),
    ...(candidate.runProjectionSummary?.serverId
      ? [candidate.runProjectionSummary.serverId]
      : []),
  ];
}

export function exactBasicLiquidCreditCandidate(
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
