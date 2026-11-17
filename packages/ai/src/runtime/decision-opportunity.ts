import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { selectableChoiceOptions } from "./choice-option";
import { exactCurrentChoiceAction } from "./plan-bound-choice-contract";

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
  const choice = input.playerView.pendingChoice;
  const choiceAlternatives =
    choice &&
    exactCurrentChoiceAction(input, choice)?.actionId ===
      selectedAction.actionId
      ? countChoiceAlternatives(
          selectableChoiceOptions(choice.options).length,
          choice.minSelections,
          choice.maxSelections,
          choice.selectionOrdering === "ordered",
        )
      : undefined;
  const actionableAlternativeCount = Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.max(0, legalActionCount - 1) + (choiceAlternatives ?? 0),
  );
  const kind: DecisionOpportunity =
    actionableAlternativeCount === 0 && choiceAlternatives !== undefined
      ? "forced_choice"
      : legalActionCount === 1 && TERMINAL_ACTION_TYPES.has(selectedAction.type)
        ? "forced_terminal"
        : "competitive";
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

function countChoiceAlternatives(
  optionCount: number,
  minSelections: number,
  maxSelections: number,
  ordered: boolean,
): number {
  let possibleSelections = 0;
  let optionsAtSize = 1;
  const maxSize = Math.min(optionCount, maxSelections);
  for (let size = 0; size <= maxSize; size += 1) {
    if (size >= minSelections) {
      if (optionsAtSize >= Number.MAX_SAFE_INTEGER - possibleSelections)
        return Number.MAX_SAFE_INTEGER;
      possibleSelections += Math.round(optionsAtSize);
    }
    optionsAtSize *= (optionCount - size) / (ordered ? 1 : size + 1);
  }
  return Math.max(0, possibleSelections - 1);
}
