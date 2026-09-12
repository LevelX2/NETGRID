import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { corpZoneTransitionProjectionStatus } from "../actions/action-economy-projection";
import { corpVoluntaryDrawLeavesUnsafeMandatoryHorizon } from "./corp-draw-admission";

export function exactCurrentCorpDrawAdmissionProjection(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
):
  | {
      cardsDrawn: number;
      netDeckConsumption: number;
      netHandDelta: number;
      selfContainedDispositionCount: number;
      clickCost: number;
    }
  | undefined {
  if (exactCurrentBasicCorpDrawCandidate(input, candidate)) {
    return {
      cardsDrawn: 1,
      netDeckConsumption: 1,
      netHandDelta: 1,
      selfContainedDispositionCount: 0,
      clickCost: 1,
    };
  }
  const projection = candidate.economyProjection;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (!action) return undefined;
  const zoneTransition = corpZoneTransitionProjectionStatus(candidate, action);
  if (
    !exactCurrentCorpScoreMaterialDrawCandidate(input, candidate) ||
    projection?.source !== "legal_action_payload" ||
    projection.reliability !== "guaranteed" ||
    projection.confidence !== "high" ||
    !Number.isSafeInteger(projection.cardsDrawn) ||
    (projection.cardsDrawn ?? 0) <= 0 ||
    !Number.isSafeInteger(projection.netHandDelta) ||
    (projection.netHandDelta ?? -1) < 0 ||
    !Number.isSafeInteger(candidate.costProfile.clickCost) ||
    (candidate.costProfile.clickCost ?? 0) <= 0
  ) {
    return undefined;
  }
  return {
    cardsDrawn: projection.cardsDrawn!,
    netDeckConsumption:
      projection.netDrawPileDelta !== undefined
        ? -projection.netDrawPileDelta
        : projection.cardsDrawn!,
    netHandDelta: projection.netHandDelta,
    selfContainedDispositionCount:
      zoneTransition.status === "guaranteed"
        ? zoneTransition.projection.postDrawDispositionCount
        : 0,
    clickCost: candidate.costProfile.clickCost!,
  };
}

export function corpCandidateProjectsCardDraw(
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType === "draw.card") return true;
  const cardsDrawn = candidate.economyProjection?.cardsDrawn;
  return (
    typeof cardsDrawn === "number" &&
    Number.isFinite(cardsDrawn) &&
    cardsDrawn > 0
  );
}

export function corpCandidatePreservesVoluntaryDrawHorizon(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  terminalNeedBeforeMandatoryDraw = false,
): boolean {
  const cardsDrawn =
    candidate.semanticActionType === "draw.card"
      ? 1
      : candidate.economyProjection?.cardsDrawn;
  const netDeckConsumption =
    candidate.semanticActionType === "draw.card" &&
    candidate.sourceKind === "basic_action"
      ? 1
      : candidate.economyProjection?.netDrawPileDelta !== undefined
        ? -candidate.economyProjection.netDrawPileDelta
        : undefined;
  if (!Number.isSafeInteger(cardsDrawn) || (cardsDrawn ?? 0) <= 0) {
    return true;
  }
  if (!Number.isSafeInteger(netDeckConsumption)) return false;
  return !corpVoluntaryDrawLeavesUnsafeMandatoryHorizon({
    remainingDeckCardsBeforeDraw: input.playerView.own.stackOrRdCount,
    netDeckConsumption: netDeckConsumption!,
    terminalNeedBeforeMandatoryDraw,
  });
}

export function exactCurrentBasicCorpDrawCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.sourceKind !== "basic_action" ||
    candidate.semanticActionType !== "draw.card" ||
    candidate.costProfile.clickCost !== 1 ||
    (candidate.costProfile.creditCost !== undefined &&
      candidate.costProfile.creditCost !== 0) ||
    candidate.costProfile.additionalCosts.length > 0
  ) {
    return false;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    action?.side !== "corp" ||
    action.type !== "draw_card" ||
    action.source !== "basic_action" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0
  ) {
    return false;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  return (
    totalClicks === 1 &&
    totalCredits === 0 &&
    input.playerView.own.stackOrRdCount > 0 &&
    Number.isSafeInteger(input.playerView.own.gripOrHq.length) &&
    Number.isSafeInteger(input.playerView.own.maxHandSize)
  );
}

function exactCurrentCorpScoreMaterialDrawCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (exactCurrentBasicCorpDrawCandidate(input, candidate)) return true;
  if (
    !corpCandidateProjectsCardDraw(candidate) ||
    candidate.costProfile.additionalCosts.length > 0
  ) {
    return false;
  }
  const projection = candidate.economyProjection;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const cardsDrawn = projection?.cardsDrawn;
  const netHandDelta = projection?.netHandDelta;
  const clickCost = candidate.costProfile.clickCost;
  const creditCost = candidate.costProfile.creditCost;
  if (
    action?.side !== "corp" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0 ||
    projection?.timing !== "immediate" ||
    projection.reliability !== "guaranteed" ||
    !Number.isSafeInteger(cardsDrawn) ||
    (cardsDrawn ?? 0) <= 0 ||
    !Number.isSafeInteger(netHandDelta) ||
    (netHandDelta ?? -1) < 0 ||
    !Number.isSafeInteger(clickCost) ||
    (clickCost ?? 0) <= 0 ||
    !Number.isSafeInteger(creditCost) ||
    (creditCost ?? -1) < 0
  ) {
    return false;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  return (
    totalClicks === clickCost &&
    totalCredits === creditCost &&
    totalClicks <= input.playerView.own.clicks &&
    totalCredits <= input.playerView.own.credits
  );
}
