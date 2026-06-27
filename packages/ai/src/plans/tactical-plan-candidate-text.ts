import type { ActionSemanticCandidate } from "../action-semantic-candidate";

export function candidateSemanticText(candidate: ActionSemanticCandidate): string {
  return [
    candidate.semanticActionType,
    candidate.sourceCardId,
    candidate.abilityId,
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...candidate.strategySupport.map((entry) => `${entry.strategyId}:${entry.role}`),
    ...candidate.conditions.map((entry) => entry.kind),
    ...candidate.risks.map((entry) => entry.kind),
    ...candidate.constraints.map((entry) => entry.kind),
    ...candidate.costProfile.additionalCosts,
    ...(candidate.targetContext?.targetProfileMatches.flatMap((entry) => entry.evidence) ?? []),
    ...candidate.evidence,
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();
}
