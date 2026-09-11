import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { RunnerInstalledAgendaScoreSignal } from "./installed-agenda-types";

export function runnerInstalledAgendaScoreSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  findVisibleOwnCard: (instanceId: string) => VisibleCard | undefined,
): RunnerInstalledAgendaScoreSignal[] {
  return candidates.flatMap((candidate) => {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    if (action?.payload?.cardImplementationScoresSourceAsAgenda !== true)
      return [];
    const sourceCardInstanceId =
      candidate.sourceCardInstanceId ??
      (typeof action.source === "string" ? action.source : undefined);
    if (!sourceCardInstanceId)
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        owner: "action_semantics",
        removalCondition:
          "Every installed-agenda score action must expose its source card instance.",
      });
    const sourceCard = findVisibleOwnCard(sourceCardInstanceId);
    if (!sourceCard?.known || !sourceCard.definitionId)
      throw new PlanResolutionFailure("invalid_player_view_card_projection", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        owner: "rules_contract",
        removalCondition:
          "An installed-agenda score action must point to a visible own card with a definition.",
      });
    const agendaPoints =
      sourceCard.agendaPoints ??
      (sourceCard.definitionId
        ? CARD_DEFINITIONS_BY_ID[sourceCard.definitionId]?.agendaPoints
        : undefined);
    if (agendaPoints === undefined)
      throw new PlanResolutionFailure("missing_card_definition", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        owner: "rules_contract",
        removalCondition: `Provide agenda points for ${sourceCard.definitionId ?? sourceCardInstanceId}.`,
      });
    return [
      {
        opportunityId: sourceCardInstanceId,
        sourceCardInstanceId,
        actionIds: [candidate.actionId],
        agendaPoints,
        terminal:
          input.playerView.own.agendaPoints + agendaPoints >=
          input.playerView.agendaPointsToWin,
        evidenceCode: "runner_installed_agenda_score_conversion",
      },
    ];
  });
}
