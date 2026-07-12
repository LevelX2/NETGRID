import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

export type DecisionOpportunity =
  | "competitive"
  | "forced_terminal"
  | "forced_choice";

export type DecisionOpportunityAssessment = {
  kind: DecisionOpportunity;
  legalActionCount: number;
  actionableAlternativeCount: number;
  evidence: string[];
};

const TERMINAL_ACTION_TYPES = new Set<LegalAction["type"]>([
  "end_turn",
  "decline_rez",
  "decline_trash",
  "jack_out",
]);

export function assessDecisionOpportunity(
  input: AiDecisionInput,
  selectedAction: LegalAction,
): DecisionOpportunityAssessment {
  const legalActionCount = input.legalActions.length;
  const selectableChoiceCount =
    selectedAction.type === "resolve_choice" && input.playerView.pendingChoice
      ? input.playerView.pendingChoice.options.filter(
          (option) => option.selectable !== false,
        ).length
      : undefined;
  const kind: DecisionOpportunity =
    selectableChoiceCount !== undefined && selectableChoiceCount <= 1
      ? "forced_choice"
      : legalActionCount === 1 && TERMINAL_ACTION_TYPES.has(selectedAction.type)
        ? "forced_terminal"
        : "competitive";
  const actionableAlternativeCount =
    kind === "forced_choice"
      ? Math.max(0, (selectableChoiceCount ?? 0) - 1)
      : Math.max(0, legalActionCount - 1);
  return {
    kind,
    legalActionCount,
    actionableAlternativeCount,
    evidence: [
      `decision_opportunity:${kind}`,
      `decision_legal_action_count:${legalActionCount}`,
      `decision_actionable_alternative_count:${actionableAlternativeCount}`,
    ],
  };
}
