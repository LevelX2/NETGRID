import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

export function applyCardImplementationEffectSemantics(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  if (
    action.side === "corp" &&
    action.type === "activated_card_ability" &&
    action.payload?.cardImplementationEffectKind === "end_run"
  ) {
    const projectionIssues = new Set(candidate.projectionIssues);
    projectionIssues.delete("ability_unresolved");
    return {
      ...candidate,
      semanticActionType: "run.end_by_corp",
      actionTacticSignals: [
        ...new Set([
          ...candidate.actionTacticSignals,
          "run.corp_end_run_counter",
        ]),
      ],
      primaryProjectionStatus: "projected",
      confidence: "high",
      projectionIssues: [...projectionIssues],
      evidence: [
        ...candidate.evidence,
        "Engine CardImplementation effect ends the current run",
      ],
    };
  }
  if (
    action.side === "runner" &&
    action.type === "play_event" &&
    action.payload?.cardImplementationEffectKind ===
      "secret_spend_guess_then_targeted_bypass_run"
  ) {
    const projectionIssues = new Set(candidate.projectionIssues);
    projectionIssues.delete("ability_unresolved");
    return {
      ...candidate,
      functionalEffects: [
        ...new Map(
          [
            ...(candidate.functionalEffects ?? []),
            {
              kind: "future_run_effect" as const,
              timing: "action" as const,
              scope: "server" as const,
              target: "make_run",
            },
            {
              kind: "future_encounter_effect" as const,
              timing: "during_run" as const,
              scope: "ice" as const,
              target: "bypass_chosen_ice",
            },
          ].map((effect) => [JSON.stringify(effect), effect]),
        ).values(),
      ],
      primaryProjectionStatus: "projected",
      confidence: "high",
      projectionIssues: [...projectionIssues],
      evidence: [
        ...candidate.evidence,
        "CardImplementation capability projects the targeted bypass run sequence",
      ],
    };
  }
  if (
    action.side === "runner" &&
    action.type === "trigger_ability" &&
    action.payload?.runnerAbility === "decline_optional_bonus_run"
  ) {
    const projectionIssues = new Set(candidate.projectionIssues);
    projectionIssues.delete("ability_unresolved");
    return {
      ...candidate,
      semanticActionType: "run.decline_optional_bonus",
      actionTacticSignals: [
        ...new Set([
          ...candidate.actionTacticSignals,
          "run.optional_bonus_decline",
        ]),
      ],
      primaryProjectionStatus: "projected",
      confidence: "high",
      projectionIssues: [...projectionIssues],
      evidence: [
        ...candidate.evidence,
        "Engine optional bonus-run decline resolves the current restricted run window",
      ],
    };
  }
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
  if (effectKind !== "search_stack_to_grip" || searchFilter !== "program") {
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
      ...new Set([...(candidate.effectTargets ?? []), "setup.program_search"]),
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
