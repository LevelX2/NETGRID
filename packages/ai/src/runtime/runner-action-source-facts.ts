import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
export function runnerCandidateSourceDefinitionId(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const payloadDefinitionId = legalAction?.payload?.sourceDefinitionId;
  const sourceInstanceId =
    candidate.sourceCardInstanceId ?? legalAction?.source;
  return (
    candidate.sourceDefinitionId ??
    (typeof payloadDefinitionId === "string"
      ? payloadDefinitionId
      : undefined) ??
    (sourceInstanceId
      ? visibleOwnCardByInstanceId(input, sourceInstanceId)?.definitionId
      : undefined)
  );
}

export function visibleOwnCardByInstanceId(
  input: AiDecisionInput,
  instanceId: string,
): VisibleCard | undefined {
  return [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [
      ...server.root,
      ...server.ice,
    ]),
  ].find((card) => card.instanceId === instanceId);
}

export function runnerInstallSourceInstanceId(
  candidate: ActionSemanticCandidate,
  action: LegalAction | undefined,
): string | undefined {
  if (candidate.sourceCardInstanceId) return candidate.sourceCardInstanceId;
  const cardId = action?.payload?.cardId;
  if (typeof cardId === "string" && cardId.length > 0) return cardId;
  return typeof action?.source === "string" &&
    action.source.length > 0 &&
    action.source !== "basic_action"
    ? action.source
    : undefined;
}
