import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { RunnerInstalledAgendaScoreSignal } from "./installed-agenda-types";

export function runnerInstalledAgendaScoreSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): RunnerInstalledAgendaScoreSignal[] {
  return candidates.flatMap((candidate) => {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    if (action?.payload?.cardImplementationScoresSourceAsAgenda !== true)
      return [];
    const sourceCardInstanceId = action.source;
    if (
      !runnerInstalledAgendaScoreActionIsCurrent(
        input,
        action,
        sourceCardInstanceId,
      ) ||
      candidate.actorSide !== "runner" ||
      candidate.stateVersion !== input.playerView.stateVersion ||
      candidate.sourceCardInstanceId !== sourceCardInstanceId
    ) {
      throw invalidInstalledAgendaScore(
        input,
        action,
        "Bind the score signal to the Engine's exact current Runner action and installed source.",
      );
    }
    const source = input.playerView.own.rig?.find(
      (card) => card.instanceId === sourceCardInstanceId,
    );
    const agendaPoints = source?.agendaPoints;
    if (
      source?.known !== true ||
      !source.definitionId ||
      source.controller !== "runner" ||
      typeof agendaPoints !== "number" ||
      !Number.isSafeInteger(agendaPoints) ||
      agendaPoints <= 0
    ) {
      throw invalidInstalledAgendaScore(
        input,
        action,
        "The installed score source must be known, Runner-controlled, and expose its exact positive agenda points.",
      );
    }
    return [
      {
        opportunityId: sourceCardInstanceId,
        sourceCardInstanceId,
        actionIds: [action.actionId],
        observedAtStateVersion: input.playerView.stateVersion,
        agendaPoints,
        terminal:
          input.playerView.own.agendaPoints + agendaPoints >=
          input.playerView.agendaPointsToWin,
        evidenceCode: "runner_installed_agenda_score_conversion",
      },
    ];
  });
}

export function runnerInstalledAgendaScoreActionIsCurrent(
  input: AiDecisionInput,
  action: LegalAction,
  sourceCardInstanceId: string,
): boolean {
  return (
    input.side === "runner" &&
    action.side === "runner" &&
    action.type === "activated_card_ability" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.source === sourceCardInstanceId &&
    action.abilityRef?.sourceCardInstanceId === sourceCardInstanceId &&
    action.payload?.cardImplementationScoresSourceAsAgenda === true
  );
}

function invalidInstalledAgendaScore(
  input: AiDecisionInput,
  action: LegalAction,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("invalid_player_view_card_projection", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map(({ type }) => type),
    unresolvedActionIds: [action.actionId],
    owner: "rules_contract",
    removalCondition,
  });
}
