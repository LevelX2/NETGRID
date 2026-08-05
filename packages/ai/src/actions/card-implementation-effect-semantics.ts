import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

export function applyCardImplementationEffectSemantics(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  if (
    action.side === "runner" &&
    action.type === "trigger_ability" &&
    action.payload?.runnerAbility === "boost_icebreaker_for_run"
  ) {
    const projectionIssues = new Set(candidate.projectionIssues);
    projectionIssues.delete("ability_unresolved");
    return {
      ...candidate,
      semanticActionType: "breaker.boost_strength",
      actionTacticSignals: [
        ...new Set([
          ...candidate.actionTacticSignals,
          "breaker.boost_strength",
          "run.encounter_mitigation",
        ]),
      ],
      primaryProjectionStatus: "projected",
      confidence: "high",
      projectionIssues: [...projectionIssues],
      evidence: [
        ...candidate.evidence,
        "Engine runner ability boosts an icebreaker for the active run",
      ],
    };
  }
  const effectKind = action.payload?.cardImplementationEffectKind;
  const searchFilter = action.payload?.cardImplementationSearchFilter;
  if (
    effectKind !== "search_stack_to_grip" ||
    searchFilter !== "program"
  ) {
    return candidate;
  }
  const projectionIssues = new Set(candidate.projectionIssues);
  projectionIssues.delete("ability_unresolved");
  projectionIssues.delete("target_context_unavailable");
  return {
    ...candidate,
    semanticActionType: "search.program_to_grip",
    actionTacticSignals: [
      ...new Set([...candidate.actionTacticSignals, "setup.search"]),
    ],
    effectTargets: [
      ...new Set([
        ...(candidate.effectTargets ?? []),
        "setup.program_search",
      ]),
    ],
    primaryProjectionStatus: "projected",
    confidence: "high",
    projectionIssues: [...projectionIssues],
    evidence: [
      ...candidate.evidence,
      "CardImplementation effect projects a visible program search from stack to grip",
    ],
  };
}
