import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { bestSemanticRuntimeChoice } from "./semantic-choice-ranking";
import { semanticRuntimeChoiceWithEvidence } from "./semantic-runtime-score-components";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeExclusion,
} from "./semantic-runtime-types";

export type RunnerSelfDamageSurvivalAssessment = {
  survivesSelfDamage: boolean;
  immediateWinByAction: boolean;
  evidence: string[];
};

export type RunnerSelfDamageChoiceDependencies = {
  survivalAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerSelfDamageSurvivalAssessment | undefined;
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

export function runnerSelfDamageSurvivalExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerSelfDamageChoiceDependencies,
): SemanticRuntimeExclusion | undefined {
  const assessment = dependencies.survivalAssessment(input, action);
  if (!assessment) return undefined;
  if (assessment.survivesSelfDamage || assessment.immediateWinByAction) {
    return undefined;
  }
  return {
    key: "self_damage_flatline_risk",
    label: "Self-Damage-Flatline-Risiko",
    reason: sortedUnique(assessment.evidence).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
