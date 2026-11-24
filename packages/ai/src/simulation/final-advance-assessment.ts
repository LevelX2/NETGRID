import { isRemoteServerId } from "@netgrid/shared";
import { getPlayerView } from "@netgrid/engine";
import {
  type AiDecisionInput,
  type CardInstanceId,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
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
  targetCardId?: CardInstanceId;
  unsafeFinalAdvance?: boolean;
  protectedFinalAdvance?: boolean;
  remoteProtectionScore?: number;
  runnerContestRisk?: "low" | "medium" | "high" | "unknown";
  advancesRemainingAfterAction?: number;
};

export function finalAdvanceAssessmentForSimulationAction(
  stateBeforeAction: GameState,
  stateAfterAction: GameState,
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
      cardTargetTypeForInstance(stateBeforeAction, candidate) === "agenda" &&
      (stateAfterAction.cardInstances[candidate]?.advancementCounters ?? 0) >
        (stateBeforeAction.cardInstances[candidate]?.advancementCounters ?? 0),
  );
  if (!cardId || !isRemoteServerId(targetServerId))
    return { finalAdvance: false };
  const agenda = getPlayerView(stateAfterAction, "corp")
    .servers.find((server) => server.id === targetServerId)
    ?.root.find((card) => card.known === true && card.instanceId === cardId);
  const requirement = agenda?.advancementRequirement;
  const countersAfter = agenda?.advancementCounters;
  if (requirement === undefined || countersAfter === undefined)
    return { finalAdvance: false };
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
    targetCardId: cardId,
    unsafeFinalAdvance,
    protectedFinalAdvance: !unsafeFinalAdvance,
    remoteProtectionScore,
    runnerContestRisk,
    advancesRemainingAfterAction,
  };
}

export function isProtectBeforeAdvanceSimulationAction(
  stateBeforeAction: GameState,
  stateAfterAction: GameState,
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): boolean {
  if (action.side !== "corp") return false;
  if (action.type === "gain_credit") {
    const gainedCredits =
      stateAfterAction.corp.credits - stateBeforeAction.corp.credits;
    if (gainedCredits <= 0) return false;
    return input.playerView.servers.some((server) => {
      if (
        !isRemoteServerId(server.id) ||
        !remoteHasNearFinalAgenda(input.playerView, server.id)
      )
        return false;
      const protectionBefore = remoteProtectionScoreForSimulation(
        stateBeforeAction,
        input,
        server.id,
        0,
      );
      return (
        protectionBefore < 60 &&
        remoteProtectionScoreForSimulation(
          stateBeforeAction,
          input,
          server.id,
          -gainedCredits,
        ) > protectionBefore
      );
    });
  }
  if (
    !isRemoteServerId(targetServerId) ||
    !remoteHasNearFinalAgenda(input.playerView, targetServerId)
  )
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
  return false;
}
