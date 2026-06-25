import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  runnerBlinkRiskEvidenceForAction,
  runnerBlinkRunExclusion,
  type RunnerBlinkRiskEvidenceDependencies,
  type RunnerBlinkRunExclusionDependencies,
} from "./runner-blink-run-exclusion";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerBlinkRiskContext = {
  runnerBlinkRiskEvidenceForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
  runnerBlinkRunExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createRunnerBlinkRiskContext(
  dependencies: RunnerBlinkRiskEvidenceDependencies &
    Pick<RunnerBlinkRunExclusionDependencies, "shouldAvoidRun">,
): RunnerBlinkRiskContext {
  return {
    runnerBlinkRiskEvidenceForAction: (input, action) =>
      runnerBlinkRiskEvidenceForAction(input, action, dependencies),
    runnerBlinkRunExclusion: (input, action) =>
      runnerBlinkRunExclusion(input, action, dependencies),
  };
}
