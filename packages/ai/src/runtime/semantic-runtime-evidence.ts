import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

export type SemanticRuntimeEvidenceDependencies = {
  serverId: (action: LegalAction) => string | undefined;
  runnerEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate: ActionSemanticCandidate | undefined,
  ) => string[];
  corpEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate: ActionSemanticCandidate | undefined,
  ) => string[];
};

export function semanticRuntimeEvidence(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: SemanticRuntimeEvidenceDependencies,
): string[] {
  const serverId = dependencies.serverId(action);
  return [
    `side:${input.side}`,
    `scope_family:${scopeId}`,
    ...(serverId ? [`server:${serverId}`] : []),
    `own_credits:${input.playerView.own.credits}`,
    `own_clicks:${input.playerView.own.clicks}`,
    `own_tags:${input.playerView.own.tags}`,
    ...dependencies.runnerEvidence(input, action, actionSemanticCandidate),
    ...dependencies.corpEvidence(input, action, actionSemanticCandidate),
  ];
}
