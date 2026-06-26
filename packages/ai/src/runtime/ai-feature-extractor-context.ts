import type { AiDecisionInput } from "@netgrid/shared";

import {
  extractAiFeatures as extractAiFeaturesRuntime,
  type AiFeatures,
  type AiFeaturesDependencies,
} from "./ai-features";

export function createAiFeatureExtractorContext(
  dependencies: AiFeaturesDependencies,
): {
  extractAiFeatures: (input: AiDecisionInput) => AiFeatures;
} {
  return {
    extractAiFeatures: (input) =>
      extractAiFeaturesRuntime(input, dependencies),
  };
}
