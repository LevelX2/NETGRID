import type { AiDecisionInput, LegalAction, Side } from "@netgrid/shared";

import type { AiFeatures } from "../runtime/ai-features";
import type { RankedChoice } from "../runtime/ranked-choice";

export type LegacyActionScorerDependencies = {
  extractAiFeatures: (input: AiDecisionInput) => AiFeatures;
  scoreRunnerAction: (
    input: AiDecisionInput,
    features: AiFeatures,
    action: LegalAction,
  ) => RankedChoice;
  scoreCorpAction: (
    input: AiDecisionInput,
    features: AiFeatures,
    action: LegalAction,
  ) => RankedChoice;
};

export function scoreActionsForLegacy(
  input: AiDecisionInput,
  side: Side,
  dependencies: LegacyActionScorerDependencies,
): RankedChoice[] {
  const features = dependencies.extractAiFeatures(input);
  return input.legalActions.map((action) =>
    side === "runner"
      ? dependencies.scoreRunnerAction(input, features, action)
      : dependencies.scoreCorpAction(input, features, action),
  );
}
