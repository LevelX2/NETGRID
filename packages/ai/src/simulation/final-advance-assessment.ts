import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type CardInstanceId,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import { nonNegativeActionCreditCost as simulationActionCreditCost } from "../runtime/action-cost";
import { isProtectionDefinitionId } from "../runtime/protection-definition";
import {
  cardTargetTypeForInstance,
  remoteHasNearFinalAgenda,
} from "../runtime/simulation-card-target";
import {
  remoteProtectionScoreForSimulation,
  runnerContestRiskForSimulation,
} from "./remote-protection-score";

export type FinalAdvanceSimulationAssessment = {
  finalAdvance: boolean;
  unsafeFinalAdvance?: boolean;
  protectedFinalAdvance?: boolean;
  remoteProtectionScore?: number;
  runnerContestRisk?: "low" | "medium" | "high" | "unknown";
  advancesRemainingAfterAction?: number;
};

export function finalAdvanceAssessmentForSimulationAction(
  stateBeforeAction: GameState,
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
  targetCardIds: CardInstanceId[],
  advancementCountersAdded: number,
): FinalAdvanceSimulationAssessment {
  if (action.side !== "corp" || advancementCountersAdded <= 0)
    return { finalAdvance: false };
  const cardId = targetCardIds.find(
    (candidate) =>
      cardTargetTypeForInstance(stateBeforeAction, candidate) === "agenda",
  );
  if (!cardId || !targetServerId?.startsWith("remote_"))
    return { finalAdvance: false };
  const instance = stateBeforeAction.cardInstances[cardId];
  if (!instance) return { finalAdvance: false };
  const definitionId = instance.definitionId;
  const requirement =
    CARD_DEFINITIONS_BY_ID[definitionId]?.advancementRequirement ??
    RUNTIME_CARDS[definitionId]?.numeric.advancementRequirement ??
    0;
  const countersAfter = instance.advancementCounters + advancementCountersAdded;
  const advancesRemainingAfterAction = Math.max(0, requirement - countersAfter);
  if (advancesRemainingAfterAction > 1) return { finalAdvance: false };
  const remoteProtectionScore = remoteProtectionScoreForSimulation(
    stateBeforeAction,
    input,
    targetServerId,
    simulationActionCreditCost(action),
  );
  const runnerContestRisk = runnerContestRiskForSimulation(
    stateBeforeAction,
    input,
    targetServerId,
  );
  const sameTurnScoreLikely = advancesRemainingAfterAction === 0;
  const unsafeFinalAdvance =
    !sameTurnScoreLikely &&
    (runnerContestRisk === "high" || remoteProtectionScore < 60);
  return {
    finalAdvance: true,
    unsafeFinalAdvance,
    protectedFinalAdvance: !unsafeFinalAdvance,
    remoteProtectionScore,
    runnerContestRisk,
    advancesRemainingAfterAction,
  };
}

export function isProtectBeforeAdvanceSimulationAction(
  stateBeforeAction: GameState,
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): boolean {
  if (action.side !== "corp" || !targetServerId?.startsWith("remote_"))
    return false;
  if (!remoteHasNearFinalAgenda(stateBeforeAction, targetServerId))
    return false;
  if (action.type === "install_card" && action.payload?.placement === "ice")
    return true;
  if (
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    isProtectionDefinitionId(
      stateBeforeAction.cardInstances[action.source]?.definitionId,
    )
  )
    return true;
  if (action.type === "gain_credit") {
    const protectionBefore = remoteProtectionScoreForSimulation(
      stateBeforeAction,
      input,
      targetServerId,
      0,
    );
    const protectionAfter = remoteProtectionScoreForSimulation(
      stateBeforeAction,
      input,
      targetServerId,
      -1,
    );
    return protectionBefore < 60 && protectionAfter > protectionBefore;
  }
  return false;
}
