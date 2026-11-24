import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { classifyTagPunishPayoffFromOntology } from "../tag-punish-ontology-consumer";

export type CorpTagSourcePayoffContextDependencies = {
  tagPunishAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => { isPunishPayoff: boolean } | undefined;
  payoffProfileForDefinition: typeof classifyTagPunishPayoffFromOntology;
};

export function createCorpTagSourcePayoffContext(
  dependencies: CorpTagSourcePayoffContextDependencies,
) {
  const corpOntologyPayoffAvailableForTagSource = (
    input: AiDecisionInput,
    sourceAction: LegalAction,
  ): boolean => {
    if (input.side !== "corp" || sourceAction.side !== "corp") return false;
    const consumedSource =
      sourceAction.type === "play_operation" ? sourceAction.source : undefined;
    if (
      input.legalActions.some((action) => {
        if (
          action.actionId === sourceAction.actionId ||
          action.source === consumedSource
        )
          return false;
        return dependencies.tagPunishAssessmentForAction(input, action)
          ?.isPunishPayoff;
      })
    )
      return true;
    const archivedCardIds = new Set(
      input.playerView.own.heapOrArchives.map((card) => card.instanceId),
    );
    return [
      ...input.playerView.own.gripOrHq,
      ...input.playerView.own.scoreArea,
      ...input.playerView.servers.flatMap((server) => [
        ...server.ice.filter((card) => !archivedCardIds.has(card.instanceId)),
        ...server.root.filter((card) => !archivedCardIds.has(card.instanceId)),
      ]),
    ].some((card) =>
      Boolean(
        card.instanceId !== consumedSource &&
        card.known &&
        card.definitionId &&
        dependencies.payoffProfileForDefinition(card.definitionId),
      ),
    );
  };

  return corpOntologyPayoffAvailableForTagSource;
}
