import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
export function runnerCandidateIsCardAbility(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.sourceKind === "card" &&
    (candidate.actionType === "activated_card_ability" ||
      candidate.actionType === "trigger_ability")
  );
}

export function runnerCandidateIsExposeAbility(
  _input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    runnerCandidateIsCardAbility(candidate) &&
    (candidate.actionTacticSignals.includes("effect:expose_info") ||
      candidate.functionalEffects?.some(
        (effect) => effect.kind === "expose_info",
      ) === true)
  );
}

export function runnerCandidateIsCentralInformationAbility(
  candidate: ActionSemanticCandidate,
): "hq" | "rd" | undefined {
  if (!runnerCandidateIsCardAbility(candidate)) return undefined;
  if (candidate.actionTacticSignals.includes("effect:hq_info")) return "hq";
  if (candidate.actionTacticSignals.includes("effect:topdeck_info"))
    return "rd";
  return undefined;
}
