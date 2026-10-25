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

export function runnerCandidateIsRemoteExposePreparation(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    input.playerView.run === undefined &&
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
  if (
    candidate.functionalEffects?.some(
      (effect) => effect.kind === "hq_info" && effect.scope === "hq",
    )
  )
    return "hq";
  if (
    candidate.functionalEffects?.some(
      (effect) => effect.kind === "topdeck_info" && effect.scope === "rnd",
    )
  )
    return "rd";
  return undefined;
}
