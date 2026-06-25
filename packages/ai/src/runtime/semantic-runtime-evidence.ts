import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

export type SemanticRuntimeEvidenceDependencies = {
  serverId: (action: LegalAction) => string | undefined;
  runnerEvidence: (input: AiDecisionInput, action: LegalAction) => string[];
  corpEvidence: (input: AiDecisionInput, action: LegalAction) => string[];
};

export function semanticRuntimeEvidence(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
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
    ...dependencies.runnerEvidence(input, action),
    ...dependencies.corpEvidence(input, action),
  ];
}
