import type {
  AiDecisionChainDebug,
  AiDecisionDetailSection,
} from "@netgrid/shared";

export function buildSemanticDecisionChainDetailSection(
  chain: AiDecisionChainDebug,
): AiDecisionDetailSection {
  return {
    id: "semantic_decision_chain",
    title: "Entscheidungskette",
    items: [
      `chain_schema:${chain.schemaVersion}`,
      `legal_action_count:${chain.legalActionCount}`,
      `excluded_action_count:${chain.exclusions.length}`,
      ...(chain.rawScoreWinner
        ? [
            `raw_score_winner:${chain.rawScoreWinner.actionId}`,
            `raw_score_value:${chain.rawScoreWinner.score}`,
          ]
        : ["raw_score_winner:none"]),
      ...(chain.planSelection
        ? [
            `selected_plan:${chain.planSelection.planId}`,
            `selected_plan_kind:${chain.planSelection.planKind}`,
            `plan_mapped_actions:${chain.planSelection.mappedActionIds.join("|") || "none"}`,
            `plan_contribution_mode:${chain.planSelection.contributionMode}`,
          ]
        : ["selected_plan:none"]),
      ...(chain.planArbitration
        ? [
            `plan_arbitration_outcome:${chain.planArbitration.outcome ?? "none"}`,
            `plan_arbitration_selected:${chain.planArbitration.selectedActionId ?? "none"}`,
            `plan_arbitration_mapped:${chain.planArbitration.mappedActionId ?? "none"}`,
            `plan_arbitration_override:${chain.planArbitration.overrideActionId ?? "none"}`,
            `plan_arbitration_blocked_override:${chain.planArbitration.overrideBlockedActionId ?? "none"}`,
            `plan_arbitration_reason:${chain.planArbitration.reason ?? "none"}`,
            `plan_arbitration_score_gap:${chain.planArbitration.scoreGap ?? "none"}`,
            `plan_arbitration_threshold:${chain.planArbitration.threshold ?? "none"}`,
            `plan_arbitration_policy:${chain.planArbitration.policy ?? "none"}`,
          ]
        : ["plan_arbitration_outcome:none"]),
      ...chain.priorityCandidates.map(
        (candidate) =>
          `priority_candidate:${candidate.route}:${candidate.actionId}`,
      ),
      `initial_selection_route:${chain.initialSelection.route}`,
      `initial_selection_action:${chain.initialSelection.actionId}`,
      ...chain.adjustments.map(
        (adjustment) =>
          `selection_adjustment:${adjustment.kind}:${adjustment.fromActionId}:${adjustment.toActionId}`,
      ),
      `final_selection_action:${chain.finalSelection.actionId}`,
      `final_selection_option_count:${chain.finalSelection.selectedOptionCount}`,
      ...(chain.finalSelection.choiceResolution
        ? [
            `choice_resolution_id:${chain.finalSelection.choiceResolution.choiceId}`,
            `choice_resolution_kind:${chain.finalSelection.choiceResolution.kind}`,
            `choice_resolution_source:${chain.finalSelection.choiceResolution.source}`,
          ]
        : []),
    ],
  };
}
