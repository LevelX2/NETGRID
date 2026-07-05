import type { AiDecisionInput, Side } from "@netgrid/shared";

import {
  chooseCorpLegacyBaselineAction,
  chooseRunnerLegacyBaselineAction,
  createLegacyActionScoringComposition,
  decisionFromLegacyChoices,
  scoreActionsForLegacy,
  type LegacyActionScorerDependencies,
  type LegacyActionScoringCompositionDependencies,
} from "../legacy/legacy-entrypoints";

export type LegacyBaselineSimulationContextDependencies =
  LegacyActionScoringCompositionDependencies &
    Pick<LegacyActionScorerDependencies, "extractAiFeatures"> & {
      selectedChoicesForDecision: Parameters<
        typeof decisionFromLegacyChoices
      >[2]["selectedChoicesForDecision"];
      scrubEvidence: Parameters<
        typeof decisionFromLegacyChoices
      >[2]["scrubEvidence"];
    };

export function createLegacyBaselineSimulationContext(
  dependencies: LegacyBaselineSimulationContextDependencies,
) {
  const scoring = createLegacyActionScoringComposition(dependencies);
  const scoreActions = (input: AiDecisionInput, side: Side) =>
    scoreActionsForLegacy(input, side, {
      extractAiFeatures: dependencies.extractAiFeatures,
      scoreRunnerAction: scoring.scoreRunnerAction,
      scoreCorpAction: scoring.scoreCorpAction,
    });
  const decisionFromChoices: Parameters<
    typeof chooseCorpLegacyBaselineAction
  >[1]["decisionFromChoices"] = (input, choices) =>
    decisionFromLegacyChoices(input, choices, {
      selectedChoicesForDecision: dependencies.selectedChoicesForDecision,
      scrubEvidence: dependencies.scrubEvidence,
    });

  return {
    chooseCorpBaselineAction: (input: AiDecisionInput) =>
      chooseCorpLegacyBaselineAction(input, {
        scoreActions,
        decisionFromChoices,
      }),
    chooseRunnerBaselineAction: (input: AiDecisionInput) =>
      chooseRunnerLegacyBaselineAction(input, {
        scoreActions,
        decisionFromChoices,
      }),
  };
}
