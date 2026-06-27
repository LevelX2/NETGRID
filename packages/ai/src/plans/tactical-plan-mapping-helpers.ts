import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { PlanMappingStatus, PlanStep } from "./tactical-plan-types";

export function mappingStatusForStep(
  step: PlanStep,
  legalActions: readonly LegalAction[],
): PlanMappingStatus {
  if (legalActions.length > 0) return "matched";
  if (
    step.requiredCapabilities.some(
      (capability) =>
        capability.kind.startsWith("breaker_") ||
        capability.kind === "remote_protection" ||
        capability.kind === "bank_payout",
    )
  ) {
    return "blocked_missing_capability";
  }
  return "blocked_no_legal_action";
}

export function candidateMappingRationale(candidate: ActionSemanticCandidate): string {
  return [
    `candidate_match:${candidate.actionId}`,
    `semantic:${candidate.semanticActionType}`,
    ...(candidate.sourceCardId ? [`source:${candidate.sourceCardId}`] : []),
    ...(candidate.abilityId ? [`ability:${candidate.abilityId}`] : []),
    ...(candidate.actionTacticSignals.length > 0
      ? [`tactics:${candidate.actionTacticSignals.slice(0, 4).join(",")}`]
      : []),
  ].join("|");
}
