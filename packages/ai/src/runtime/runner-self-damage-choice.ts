import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { bestSemanticRuntimeChoice } from "./semantic-choice-ranking";
import { semanticRuntimeChoiceWithEvidence } from "./semantic-runtime-score-components";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

export type RunnerSelfDamageImmediateWinAssessment = {
  immediateWinByAction: boolean;
};

export type RunnerSelfDamageChoiceDependencies = {
  survivalAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerSelfDamageImmediateWinAssessment | undefined;
};

export function runnerSelfDamageImmediateWinSemanticChoice(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
  dependencies: RunnerSelfDamageChoiceDependencies,
): SemanticRuntimeChoice | undefined {
  if (input.side !== "runner") return undefined;
  const choice = bestSemanticRuntimeChoice(
    choices.filter((candidate) => {
      if (candidate.exclusion) return false;
      return dependencies.survivalAssessment(input, candidate.action)
        ?.immediateWinByAction;
    }),
  );
  if (!choice) return undefined;
  return semanticRuntimeChoiceWithEvidence(choice, {
    reasonCode: "runner.self_damage.immediate_win",
    explanation:
      "Der Runner darf eine Self-Damage-Aktion waehlen, wenn dieselbe Aktion sofort gewinnt.",
    evidence: ["self_damage_immediate_win_selected:true"],
  });
}
